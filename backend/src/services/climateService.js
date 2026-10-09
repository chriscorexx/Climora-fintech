'use strict';

const config = require('../config/index.js');
const climateRepository = require('../repositories/climateRepository.js');
const { clamp } = require('./riskService.js');
const { get: httpsGet } = require('node:https');

/**
 * Open-Meteo integration.
 *
 * All outbound calls use an explicit timeout and an IPv4-forced agent because
 * the flood host publishes an AAAA record that is unreachable from several
 * networks. Responses are cached in SQLite and every returned record is
 * explicitly labelled as one of:
 *   live_forecast | live_historical | live_observation | live_geocoding | cached | demo_fallback
 *
 * Demo fallback values are never presented as live observations.
 */

// IPv4-only agent: avoids an unreachable AAAA record on the flood host.
const ipv4Agent = new (require('node:https').Agent)({ family: 4, keepAlive: false, maxSockets: 4 });

function httpGetJson(url, { timeoutMs = config.climate.timeoutMs, attempts = 2 } = {}) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const runAttempt = () => {
      attempt += 1;
      let settled = false;
      const request = httpsGet(
        url,
        { agent: ipv4Agent, headers: { Accept: 'application/json', 'User-Agent': 'Climora-Backend/1.0' } },
        (response) => {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            if (settled) return;
            settled = true;
            const body = Buffer.concat(chunks).toString('utf8');
            if (response.statusCode < 200 || response.statusCode >= 300) {
              const error = new Error(`Climate provider responded with HTTP ${response.statusCode}`);
              error.statusCode = response.statusCode;
              reject(error);
              return;
            }
            try {
              resolve({ json: JSON.parse(body), latencyMs: Date.now() - startedAt });
            } catch (error) {
              reject(new Error(`Climate provider returned invalid JSON: ${error.message}`));
            }
          });
        }
      );

      request.setTimeout(timeoutMs, () => {
        request.destroy(new Error(`Climate provider request timed out after ${timeoutMs}ms`));
      });

      request.on('error', (error) => {
        if (settled) return;
        settled = true;
        if (attempt < attempts) return runAttempt();
        reject(error);
      });
    };

    runAttempt();
  });
}

async function fetchJson(url, options) {
  return httpGetJson(url, options);
}

/**
 * The outbound HTTP call is injectable so tests can run without network access
 * and without changing production behaviour.
 */
let httpClientImpl = httpGetJson;

function httpClient(url, options) {
  return httpClientImpl(url, options);
}

function setHttpClient(fn) {
  httpClientImpl = fn;
}

const DEMO_VALUES = {
  flood: 50,
  rainfall: 50,
  heat: 50,
};

function isoDateDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function maxOf(values) {
  const numbers = (values || []).filter((v) => typeof v === 'number' && Number.isFinite(v));
  return numbers.length ? Math.max(...numbers) : null;
}

function percentile(values, p) {
  const numbers = (values || []).filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
  if (!numbers.length) return null;
  const index = clamp(Math.floor(numbers.length * p), 0, numbers.length - 1);
  return numbers[index];
}

// ---------------------------------------------------------------------------
// Normalisation rules — documented, transparent and deterministic.
// ---------------------------------------------------------------------------

const RAINFALL_THRESHOLDS = [
  { min: 200, score: 100 },
  { min: 150, score: 85 },
  { min: 100, score: 70 },
  { min: 64.5, score: 50 },
  { min: 25, score: 30 },
  { min: 10, score: 15 },
];

const HEAT_THRESHOLDS = [
  { min: 45, score: 100 },
  { min: 42, score: 85 },
  { min: 40, score: 70 },
  { min: 38, score: 50 },
  { min: 35, score: 30 },
  { min: 32, score: 15 },
];

function scoreFromThresholds(value, thresholds) {
  if (value === null || value === undefined) return null;
  for (const threshold of thresholds) {
    if (value >= threshold.min) return threshold.score;
  }
  return 5;
}

/**
 * Flood score: the forecast peak daily river discharge expressed as a
 * percentage of the maximum daily discharge recorded at the same coordinates
 * over the trailing year.
 *
 * IMPORTANT: river discharge is a regional river-flow hazard proxy at 5 km
 * resolution. It is NOT a measurement of flood risk to an individual business
 * premise, and it is not a flood probability.
 */
function scoreFlood(forecastPayload, historyPayload) {
  const forecastPeak = maxOf(forecastPayload?.daily?.river_discharge_max);
  const referenceMax = maxOf(historyPayload?.daily?.river_discharge_max);
  if (forecastPeak === null || referenceMax === null || referenceMax === 0) return null;
  const ratio = forecastPeak / referenceMax;
  return {
    score: clamp(Math.round(ratio * 100)),
    ratio,
    forecastPeak,
    referenceMax,
  };
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

function forecastUrl(lat, lng) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: String(config.climate.forecastDays),
  });
  return `${config.climate.baseUrl}/v1/forecast?${params.toString()}`;
}

function floodForecastUrl(lat, lng) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: 'river_discharge,river_discharge_max',
    forecast_days: String(config.climate.forecastDays),
  });
  return `${config.climate.floodBaseUrl}/v1/flood?${params.toString()}`;
}

function floodHistoryUrl(lat, lng) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: 'river_discharge_max',
    start_date: isoDateDaysAgo(config.climate.historyDays),
    end_date: today(),
  });
  return `${config.climate.floodBaseUrl}/v1/flood?${params.toString()}`;
}

function geocodeUrl(query) {
  const params = new URLSearchParams({ name: query, count: '5', language: 'en', format: 'json' });
  return `${config.climate.geocodingBaseUrl}/v1/search?${params.toString()}`;
}

function cacheKeyFor(kind, lat, lng) {
  const roundedLat = Number(lat).toFixed(3);
  const roundedLng = Number(lng).toFixed(3);
  if (kind === 'flood_history') {
    return `${kind}:${roundedLat}:${roundedLng}:${isoDateDaysAgo(config.climate.historyDays)}`;
  }
  if (kind === 'flood_forecast' || kind === 'forecast') {
    return `${kind}:${roundedLat}:${roundedLng}:${today()}`;
  }
  return `${kind}:${roundedLat}:${roundedLng}`;
}

/**
 * Fetches a JSON payload, using the SQLite cache when it is still fresh.
 */
async function fetchWithCache({ kind, lat, lng, url, provider, dataType, sourceTimeOf }) {
  const cacheKey = cacheKeyFor(kind, lat, lng);
  const ttl = config.climate.cacheTtlMinutes;

  const fresh = climateRepository.findFresh(cacheKey, ttl);
  if (fresh) {
    return { ...fresh, dataType: 'cached', cacheKey, ttlMinutes: ttl };
  }

  try {
    const { json } = await httpClient(url, { timeoutMs: config.climate.timeoutMs });
    const sourceTime = sourceTimeOf ? sourceTimeOf(json) : null;
    const record = climateRepository.buildRecord({
      cacheKey,
      kind,
      provider,
      dataType,
      latitude: lat,
      longitude: lng,
      payload: json,
      sourceTime,
      ttlMinutes: ttl,
    });
    climateRepository.save(record);
    return {
      cached: false,
      kind,
      provider,
      dataType,
      sourceTime,
      fetchedAt: record.fetchedAt,
      payload: json,
      cacheKey,
      ttlMinutes: ttl,
    };
  } catch (error) {
    const stale = climateRepository.findStale(cacheKey);
    if (stale) {
      return { ...stale, dataType: 'cached', cacheKey, ttlMinutes: ttl, staleReason: error.message };
    }
    throw error;
  }
}

async function getForecast(lat, lng) {
  return fetchWithCache({
    kind: 'forecast',
    lat,
    lng,
    url: forecastUrl(lat, lng),
    provider: 'Open-Meteo Forecast API',
    dataType: 'live_forecast',
    sourceTimeOf: (json) => json?.daily?.time?.[0] || null,
  });
}

async function getFloodForecast(lat, lng) {
  return fetchWithCache({
    kind: 'flood_forecast',
    lat,
    lng,
    url: floodForecastUrl(lat, lng),
    provider: 'Open-Meteo Flood API (GloFAS simulated river discharge)',
    dataType: 'live_forecast',
    sourceTimeOf: (json) => json?.daily?.time?.[0] || null,
  });
}

async function getFloodHistory(lat, lng) {
  return fetchWithCache({
    kind: 'flood_history',
    lat,
    lng,
    url: floodHistoryUrl(lat, lng),
    provider: 'Open-Meteo Flood API (GloFAS simulated river discharge)',
    dataType: 'live_historical',
    sourceTimeOf: (json) => json?.daily?.time?.[json.daily.time.length - 1] || null,
  });
}

async function geocode(query) {
  const { json } = await fetchJson(geocodeUrl(query));
  const results = Array.isArray(json?.results) ? json.results : [];
  return results.map((r) => ({
    name: r.name,
    admin1: r.admin1,
    country: r.country,
    countryCode: r.country_code,
    latitude: r.latitude,
    longitude: r.longitude,
    elevation: r.elevation,
    timezone: r.timezone,
  }));
}

function deriveDimensionScores(forecast, floodForecast, floodHistory, warnings) {
  const daily = forecast?.payload?.daily;
  const heatMax = maxOf(daily?.temperature_2m_max);
  const rainfallMax = maxOf(daily?.precipitation_sum);

  let floodScore = null;
  let floodDetail = null;
  try {
    floodDetail = scoreFlood(floodForecast?.payload, floodHistory?.payload);
    floodScore = floodDetail ? floodDetail.score : null;
  } catch (error) {
    warnings.push(`Flood dimension could not be derived: ${error.message}`);
  }

  return {
    flood: { score: floodScore, detail: floodDetail },
    rainfall: { score: scoreFromThresholds(rainfallMax, RAINFALL_THRESHOLDS), observed: rainfallMax },
    heat: { score: scoreFromThresholds(heatMax, HEAT_THRESHOLDS), observed: heatMax },
  };
}

/**
 * Returns the full climate bundle for a location, including per-dimension
 * scores used by the risk engine, source labels and uncertainty warnings.
 *
 * When a provider call fails, the affected dimension is returned as `null`
 * (MISSING) so that the risk engine excludes it and reweights the remaining
 * dimensions. Demo values are only ever used when `forceDemo` is set by an
 * explicit caller, and are then labelled as demo everywhere.
 *
 * @returns {Promise<{ok: boolean, demoFallback: boolean, missingDimensions: string[], dimensions: Object, sources: Array, warnings: Array}>}
 */
async function getClimateBundle(lat, lng, { businessId = null, forceDemo = false } = {}) {
  if (forceDemo) {
    return {
      ok: false,
      demoFallback: true,
      missingDimensions: [],
      dimensions: {
        flood: DEMO_VALUES.flood,
        rainfall: DEMO_VALUES.rainfall,
        heat: DEMO_VALUES.heat,
      },
      detail: {},
      sources: [
        {
          dimension: ['flood', 'rainfall', 'heat'],
          provider: 'Climora demo fallback (synthetic placeholder values)',
          dataType: 'demo_fallback',
          sourceTime: null,
          fetchedAt: new Date().toISOString(),
          cached: false,
        },
      ],
      warnings: [
        'DEMO DATA REQUESTED: all climate dimensions use clearly labelled demo placeholder values. No live observations were fetched.',
      ],
      raw: {},
    };
  }

  const warnings = [];
  const sources = [];

  let forecast = null;
  let floodForecast = null;
  let floodHistory = null;

  const failures = [];

  await Promise.all([
    getForecast(lat, lng).then((r) => { forecast = r; }).catch((e) => failures.push({ call: 'forecast', error: e })),
    getFloodForecast(lat, lng).then((r) => { floodForecast = r; }).catch((e) => failures.push({ call: 'flood_forecast', error: e })),
    getFloodHistory(lat, lng).then((r) => { floodHistory = r; }).catch((e) => failures.push({ call: 'flood_history', error: e })),
  ]);

  if (forecast) {
    sources.push({
      dimension: ['rainfall', 'heat'],
      provider: forecast.provider,
      dataType: forecast.dataType,
      sourceTime: forecast.sourceTime,
      fetchedAt: forecast.fetchedAt,
      cached: Boolean(forecast.cached),
      stale: Boolean(forecast.stale),
    });
  } else {
    warnings.push('Open-Meteo forecast data is unavailable; rainfall and heat dimensions cannot be scored from live data.');
  }

  if (floodForecast) {
    sources.push({
      dimension: ['flood'],
      provider: floodForecast.provider,
      dataType: floodForecast.dataType,
      sourceTime: floodForecast.sourceTime,
      fetchedAt: floodForecast.fetchedAt,
      cached: Boolean(floodForecast.cached),
      stale: Boolean(floodForecast.stale),
    });
  }
  if (floodHistory) {
    sources.push({
      dimension: ['flood'],
      provider: floodHistory.provider,
      dataType: floodHistory.dataType,
      sourceTime: floodHistory.sourceTime,
      fetchedAt: floodHistory.fetchedAt,
      cached: Boolean(floodHistory.cached),
    });
  }
  if (!floodForecast || !floodHistory) {
    warnings.push('Open-Meteo river-discharge data is unavailable; the flood dimension cannot be derived. River discharge is a regional hazard proxy, not a premise-level flood probability.');
  }

  for (const failure of failures) {
    warnings.push(`Climate provider call "${failure.call}" failed: ${failure.error.message}`);
  }

  let dimensions = deriveDimensionScores(forecast, floodForecast, floodHistory, warnings);

  // A dimension with no usable data is reported as MISSING (null) and excluded
  // from the risk score by proportional reweighting. Climora never substitutes
  // demo numbers into a score implicitly, because that would fabricate inputs.
  const missingDimensions = Object.entries(dimensions)
    .filter(([, value]) => value.score === null)
    .map(([key]) => key);

  for (const key of missingDimensions) {
    warnings.push(
      `The "${key}" dimension is reported as MISSING because no live provider data was available for it. ` +
        'It is excluded from the score rather than treated as zero risk.'
    );
  }

  return {
    ok: failures.length === 0,
    demoFallback: false,
    missingDimensions,
    dimensions: {
      flood: dimensions.flood.score,
      rainfall: dimensions.rainfall.score,
      heat: dimensions.heat.score,
    },
    detail: {
      flood: dimensions.flood.detail,
      rainfallObservedMaxMm: dimensions.rainfall.observed,
      heatObservedMaxC: dimensions.heat.observed,
    },
    sources,
    warnings,
    raw: {
      forecast: forecast ? forecast.payload : null,
      floodForecast: floodForecast ? floodForecast.payload : null,
    },
  };
}

module.exports = {
  fetchJson,
  httpGetJson,
  setHttpClient,
  getForecast,
  getFloodForecast,
  getFloodHistory,
  geocode,
  getClimateBundle,
  scoreFlood,
  scoreFromThresholds,
  RAINFALL_THRESHOLDS,
  HEAT_THRESHOLDS,
  DEMO_VALUES,
};

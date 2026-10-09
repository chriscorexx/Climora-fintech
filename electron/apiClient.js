/**
 * electron/apiClient.js
 * Open-Meteo API client — runs in the Electron main process only.
 * Covers: Geocoding, Forecast (rain/temp), Flood (river discharge).
 * All network calls have a configurable timeout.
 * Returns null + reason string on any failure — callers must handle fallback.
 *
 * Attribution: Weather data by Open-Meteo (CC BY 4.0)
 * https://open-meteo.com/
 */

const TIMEOUT_MS   = parseInt(process.env.CLIMORA_API_TIMEOUT_MS  ?? '8000', 10);
const BASE_GEO     = 'https://geocoding-api.open-meteo.com/v1/search';
const BASE_FORECAST= 'https://api.open-meteo.com/v1/forecast';
const BASE_FLOOD   = 'https://flood-api.open-meteo.com/v1/flood';

// ── Utility ───────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return await res.json();
  } catch (err) {
    const reason = err.name === 'AbortError'
      ? `Request timed out after ${timeoutMs}ms`
      : err.message;
    return { _error: reason };
  } finally {
    clearTimeout(timer);
  }
}

function hasError(data) {
  return !data || data._error;
}

// ── Geocoding ─────────────────────────────────────────────────────────────

/**
 * Resolve a location string to { lat, lng, name, country }.
 * Returns null when the location cannot be found.
 */
export async function geocodeLocation(locationName) {
  const url = `${BASE_GEO}?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`;
  const data = await fetchWithTimeout(url);
  if (hasError(data)) return { ok: false, reason: data?._error ?? 'Geocoding failed' };

  const result = data.results?.[0];
  if (!result) return { ok: false, reason: `Location not found: "${locationName}"` };

  return {
    ok: true,
    lat: result.latitude,
    lng: result.longitude,
    name: result.name,
    country: result.country,
    timezone: result.timezone,
  };
}

// ── Forecast (rain + heat) ────────────────────────────────────────────────

/**
 * Fetch 7-day forecast for lat/lng.
 * Returns raw daily arrays or error.
 */
export async function fetchForecast(lat, lng) {
  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lng,
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'rain_sum',
      'weather_code',
    ].join(','),
    timezone: 'auto',
    forecast_days: 7,
  });
  const url = `${BASE_FORECAST}?${params}`;
  const data = await fetchWithTimeout(url);
  if (hasError(data)) return { ok: false, reason: data?._error ?? 'Forecast fetch failed' };
  return { ok: true, daily: data.daily };
}

// ── Flood (river discharge) ───────────────────────────────────────────────

/**
 * Fetch 7-day ensemble flood forecast for lat/lng.
 * Uses GloFAS via Open-Meteo Flood API.
 */
export async function fetchFlood(lat, lng) {
  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lng,
    daily: 'river_discharge_max',
    forecast_days: 7,
  });
  const url = `${BASE_FLOOD}?${params}`;
  const data = await fetchWithTimeout(url);
  if (hasError(data)) return { ok: false, reason: data?._error ?? 'Flood API fetch failed' };
  return { ok: true, daily: data.daily };
}

// ── Composite fetch ───────────────────────────────────────────────────────

/**
 * Fetch all climate data for a location in one call.
 * Returns { forecast, flood, geocode, errors[] }.
 * Partial results are returned when only some calls succeed.
 */
export async function fetchAllClimateData(lat, lng) {
  const [forecastResult, floodResult] = await Promise.all([
    fetchForecast(lat, lng),
    fetchFlood(lat, lng),
  ]);

  const errors = [];
  if (!forecastResult.ok) errors.push(`Forecast: ${forecastResult.reason}`);
  if (!floodResult.ok)    errors.push(`Flood: ${floodResult.reason}`);

  return {
    forecast: forecastResult.ok ? forecastResult.daily : null,
    flood:    floodResult.ok    ? floodResult.daily    : null,
    errors,
    anyLive:  forecastResult.ok || floodResult.ok,
  };
}

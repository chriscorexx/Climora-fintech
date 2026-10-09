/**
 * electron/scorer.js
 * Maps Open-Meteo API responses → normalised 0–100 risk dimension scores.
 * Runs exclusively in the Electron main process (Node.js).
 *
 * All thresholds are PROVISIONAL hackathon values.
 * Must be calibrated by domain experts before any real-world use.
 *
 * Methodology: RISK_SCORING.md
 */

// ── Thresholds ────────────────────────────────────────────────────────────

// Rainfall: total precipitation over the 7-day forecast window (mm)
const RAIN_THRESHOLDS = [
  { max: 10,  score: 10 },
  { max: 30,  score: 25 },
  { max: 60,  score: 45 },
  { max: 100, score: 65 },
  { max: 150, score: 80 },
  { max: Infinity, score: 95 },
];

// Heat: maximum daily temperature in the 7-day window (°C)
const HEAT_THRESHOLDS = [
  { max: 25,       score: 5  },
  { max: 30,       score: 20 },
  { max: 35,       score: 45 },
  { max: 38,       score: 65 },
  { max: 40,       score: 80 },
  { max: Infinity, score: 95 },
];

// Flood: peak river discharge in 7-day window (m³/s)
// GloFAS 5 km resolution — used as relative indicator only.
const FLOOD_THRESHOLDS = [
  { max: 50,       score: 5  },
  { max: 200,      score: 20 },
  { max: 500,      score: 40 },
  { max: 1000,     score: 60 },
  { max: 2000,     score: 78 },
  { max: Infinity, score: 93 },
];

// Business vulnerability — sector lookup (same values as demoData)
const SECTOR_VULNERABILITY = {
  retail:         12,
  manufacturing:  18,
  agriculture:    25,
  food_processing:20,
  hospitality:    15,
  construction:   22,
  services:        8,
  logistics:      16,
};

// Risk category labels
const CATEGORIES = [
  { max: 24,  label: 'Low'       },
  { max: 49,  label: 'Moderate'  },
  { max: 74,  label: 'High'      },
  { max: 100, label: 'Very High' },
];

// Scoring weights (must sum to 1.0)
const WEIGHTS = { flood: 0.30, rainfall: 0.25, heat: 0.20, business: 0.15, financial: 0.10 };

// ── Helpers ───────────────────────────────────────────────────────────────

function stepScore(value, thresholds) {
  for (const t of thresholds) {
    if (value <= t.max) return t.score;
  }
  return thresholds[thresholds.length - 1].score;
}

function clamp(v, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

function getCategory(score) {
  for (const c of CATEGORIES) {
    if (score <= c.max) return c.label;
  }
  return 'Very High';
}

// ── Dimension scorers ─────────────────────────────────────────────────────

/**
 * Derive rainfall score from 7-day daily forecast arrays.
 * Uses total precipitation_sum over the window.
 */
export function scoreRainfall(forecastDaily) {
  if (!forecastDaily?.precipitation_sum) return null;
  const total = forecastDaily.precipitation_sum.reduce((s, v) => s + (v ?? 0), 0);
  return clamp(stepScore(total, RAIN_THRESHOLDS));
}

/**
 * Derive heat score from 7-day maximum temperatures.
 */
export function scoreHeat(forecastDaily) {
  if (!forecastDaily?.temperature_2m_max) return null;
  const peak = Math.max(...forecastDaily.temperature_2m_max.map(v => v ?? -Infinity));
  if (!isFinite(peak)) return null;
  return clamp(stepScore(peak, HEAT_THRESHOLDS));
}

/**
 * Derive flood score from 7-day peak river discharge.
 */
export function scoreFlood(floodDaily) {
  if (!floodDaily?.river_discharge_max) return null;
  const peak = Math.max(...floodDaily.river_discharge_max.map(v => v ?? -Infinity));
  if (!isFinite(peak)) return null;
  return clamp(stepScore(peak, FLOOD_THRESHOLDS));
}

/**
 * Derive business vulnerability score from sector key.
 */
export function scoreBusiness(sector) {
  const base = SECTOR_VULNERABILITY[sector?.toLowerCase()] ?? 15;
  // Normalise: max base is 25 (agriculture) → maps to 100
  return clamp(Math.round((base / 25) * 100));
}

/**
 * Derive financial vulnerability score from revenue/expenses/reserves.
 * Higher score = more vulnerable (less resilient).
 */
export function scoreFinancial({ revenue, expenses, emergencyReserve, debtObligations } = {}) {
  if (!revenue || revenue <= 0) return null;

  let score = 0;
  let factors = 0;

  // Expense ratio: 0.9+ = very tight
  if (expenses != null) {
    const ratio = expenses / revenue;
    score += ratio >= 0.9 ? 85 : ratio >= 0.8 ? 65 : ratio >= 0.7 ? 45 : ratio >= 0.6 ? 25 : 10;
    factors++;
  }

  // Reserve coverage: < 1 month = very vulnerable
  if (emergencyReserve != null && expenses != null && expenses > 0) {
    const months = emergencyReserve / (expenses / 12);
    score += months < 1 ? 90 : months < 2 ? 70 : months < 3 ? 50 : months < 6 ? 25 : 5;
    factors++;
  }

  // Debt-to-revenue ratio
  if (debtObligations != null) {
    const dtr = debtObligations / revenue;
    score += dtr >= 0.5 ? 85 : dtr >= 0.3 ? 60 : dtr >= 0.15 ? 35 : 10;
    factors++;
  }

  if (factors === 0) return null;
  return clamp(Math.round(score / factors));
}

// ── Main scoring function ─────────────────────────────────────────────────

/**
 * Compute the overall weighted risk score.
 * Uses proportional reweighting for any null dimensions.
 *
 * @param {object} dims  - { flood, rainfall, heat, business, financial } — null = missing
 * @returns {object}     - Full scored result
 */
export function computeScore(dims) {
  const entries = Object.entries(WEIGHTS);
  const missing = [];
  let totalWeighted = 0;
  let totalActiveWeight = 0;

  for (const [key, weight] of entries) {
    const v = dims[key];
    if (v == null) {
      missing.push(key);
    } else {
      totalWeighted    += clamp(v) * weight;
      totalActiveWeight += weight;
    }
  }

  const overall = totalActiveWeight > 0
    ? Math.round(totalWeighted / totalActiveWeight)
    : 0;

  return {
    overallScore:    overall,
    category:        getCategory(overall),
    dimensions:      dims,
    missingDims:     missing,
    isIncomplete:    missing.length > 0,
    weights:         WEIGHTS,
  };
}

// ── Full pipeline ─────────────────────────────────────────────────────────

/**
 * Build dimension scores from raw API data + business profile,
 * then compute the final risk score.
 *
 * @param {object} apiData    - { forecast, flood } from apiClient
 * @param {object} business   - business profile row
 * @returns {object}          - Full scored result + dataSource label
 */
export function buildAssessment(apiData, business) {
  const anyLive = apiData?.forecast != null || apiData?.flood != null;

  const dims = {
    flood:    scoreFlood(apiData?.flood)        ?? FALLBACK.flood[business.sector]    ?? 50,
    rainfall: scoreRainfall(apiData?.forecast)  ?? FALLBACK.rainfall[business.sector] ?? 40,
    heat:     scoreHeat(apiData?.forecast)      ?? FALLBACK.heat[business.sector]     ?? 35,
    business: scoreBusiness(business.sector),
    financial: scoreFinancial({
      revenue:          business.revenue,
      expenses:         business.expenses,
      emergencyReserve: business.emergency_reserve,
      debtObligations:  business.debt_obligations,
    }),
  };

  const scored = computeScore(dims);

  // Track which came from live API vs fallback sample data
  const apiErrors = apiData?.errors ?? [];
  const dataSource = anyLive ? 'live' : 'sample';
  const dataNote   = anyLive
    ? `Live data from Open-Meteo. ${apiErrors.length > 0 ? 'Some dimensions used sample fallback: ' + apiErrors.join('; ') : 'All dimensions from live API.'}`
    : `Open-Meteo API unavailable. All climate dimensions use clearly-labelled sample fallback data. Errors: ${apiErrors.join('; ')}`;

  return { ...scored, dataSource, dataNote, apiErrors };
}

// ── Sample fallback data ──────────────────────────────────────────────────
// Used only when the API is unreachable. Clearly labelled in the UI.

const FALLBACK = {
  flood:    { retail: 50, manufacturing: 60, agriculture: 45, food_processing: 55, hospitality: 55, construction: 65, services: 20, logistics: 60 },
  rainfall: { retail: 40, manufacturing: 50, agriculture: 65, food_processing: 50, hospitality: 40, construction: 30, services: 25, logistics: 45 },
  heat:     { retail: 40, manufacturing: 55, agriculture: 55, food_processing: 45, hospitality: 50, construction: 35, services: 30, logistics: 45 },
};

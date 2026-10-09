'use strict';

const config = require('../config/index.js');
const { ok } = require('../middleware/asyncHandler.js');

/**
 * Resolves the single-tenant owner scope for a request.
 *
 * The current MVP has no user accounts or login. All records are scoped by an
 * owner id so that per-user isolation can be enforced later without a schema
 * change. Clients may pass `X-Climora-Owner`; it defaults to `local`.
 */
function resolveOwner(req) {
  const header = req.headers['x-climora-owner'];
  if (header === undefined || header === null || String(header).trim() === '') return 'local';
  const owner = String(header).trim();
  if (owner.length > 64 || !/^[A-Za-z0-9_.-]+$/.test(owner)) {
    const error = new Error('X-Climora-Owner must be 1-64 characters of letters, digits, dot, underscore or hyphen');
    error.status = 400;
    throw error;
  }
  return owner;
}

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error('Expected a positive integer query parameter');
    error.status = 400;
    throw error;
  }
  return parsed;
}

function health(req, res) {
  return ok(res, {
    status: 'ok',
    service: 'climora-api',
    environment: config.env,
    timestamp: new Date().toISOString(),
    scoring: {
      weights: config.risk.weights,
      categories: config.risk.categories,
      sectors: config.risk.sectors,
      missingDataStrategy:
        'Missing dimensions are excluded and remaining dimensions are proportionally reweighted. ' +
        'Missing data is never treated as zero risk.',
    },
    disclaimer:
      'Climora produces an illustrative prototype climate-risk score. It is not a validated credit rating, ' +
      'probability of default, or lending recommendation.',
  });
}

function publicConfig(req, res) {
  return ok(res, {
    risk: config.risk,
    business: config.business,
    climate: {
      provider: 'Open-Meteo',
      forecastDays: config.climate.forecastDays,
      historyDays: config.climate.historyDays,
      allowDemoFallback: config.climate.allowDemoFallback,
    },
  });
}

module.exports = { resolveOwner, parsePositiveInt, health, publicConfig };

'use strict';

const climate = require('../services/climateService.js');
const businessRepository = require('../repositories/businessRepository.js');
const climateRepository = require('../repositories/climateRepository.js');
const { ok, httpError } = require('../middleware/asyncHandler.js');
const { resolveOwner } = require('./healthController.js');

/**
 * Geocode a location string using the Open-Meteo Geocoding API.
 */
async function geocode(req, res) {
  const query = String(req.query.q || req.query.query || '').trim();
  if (query.length < 2) {
    throw httpError(400, 'Validation failed', ['Query parameter "q" must contain at least 2 characters']);
  }

  let results;
  try {
    results = await climate.geocode(query);
  } catch (error) {
    throw httpError(503, `Geocoding provider unavailable: ${error.message}`);
  }

  return ok(res, {
    query,
    results,
    provider: 'Open-Meteo Geocoding API',
    dataType: 'live_geocoding',
    retrievedAt: new Date().toISOString(),
    demoFallback: false,
  });
}

/**
 * Returns the current climate bundle for a business: live forecast, river
 * discharge forecast and trailing 12-month discharge reference.
 */
async function getBusinessClimate(req, res) {
  const ownerId = resolveOwner(req);
  const business = businessRepository.findById(req.params.id, ownerId);
  if (!business) throw httpError(404, 'Business not found');
  if (!business.coordinates) {
    throw httpError(400, 'Validation failed', ['Business has no coordinates stored']);
  }

  const bundle = await climate.getClimateBundle(business.coordinates.lat, business.coordinates.lng, {
    businessId: business.id,
  });

  return ok(res, {
    businessId: business.id,
    coordinates: business.coordinates,
    dimensions: bundle.dimensions,
    detail: bundle.detail,
    sources: bundle.sources,
    warnings: bundle.warnings,
    demoFallback: bundle.demoFallback,
    attribution:
      'Weather data provided by Open-Meteo (https://open-meteo.com), licensed CC BY 4.0. River discharge is simulated ' +
      'GloFAS data at ~5 km resolution and is a regional hazard proxy, not a measurement of flood risk to an individual business.',
    disclaimer:
      'Forecasts are short-term predictions, not long-run climate risk. Demo fallback values, when present, are synthetic ' +
      'placeholders and are never live observations.',
    cachedObservations: climateRepository.listForBusiness(business.id),
  });
}

module.exports = { geocode, getBusinessClimate };

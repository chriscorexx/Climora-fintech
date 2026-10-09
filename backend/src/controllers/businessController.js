'use strict';

const config = require('../config/index.js');
const businessRepository = require('../repositories/businessRepository.js');
const assessmentRepository = require('../repositories/assessmentRepository.js');
const assessmentService = require('../services/assessmentService.js');
const { ok, httpError, createId, nowIso } = require('../middleware/asyncHandler.js');
const { resolveOwner, parsePositiveInt } = require('./healthController.js');

function listBusinesses(req, res) {
  const ownerId = resolveOwner(req);
  const limit = parsePositiveInt(req.query.limit, 50);
  const offset = parsePositiveInt(req.query.offset, 0);

  const { rows, total } = businessRepository.list(ownerId, {
    search: req.query.search,
    industry: req.query.industry,
    state: req.query.state,
    limit,
    offset,
    sort: req.query.sort,
    includeDemo: req.query.includeDemo !== 'false',
  });

  return ok(res, {
    businesses: rows,
    pagination: { total, limit, offset },
  });
}

function getBusiness(req, res) {
  const ownerId = resolveOwner(req);
  const business = businessRepository.findById(req.params.id, ownerId);
  if (!business) {
    const anyOwner = businessRepository.findAnyOwner(req.params.id);
    if (anyOwner) throw httpError(404, 'Business not found for the current owner scope');
    throw httpError(404, 'Business not found');
  }
  return ok(res, { business });
}

/**
 * Accepts coordinates either as `coordinates: { lat, lng }` or as top-level
 * `latitude` / `longitude` fields, matching the shape used by the frontend.
 */
function readCoordinates(body) {
  const errors = [];
  let coordinates = null;

  if (body.coordinates !== undefined && body.coordinates !== null) {
    const { lat, lng } = body.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number' || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errors.push('coordinates must contain numeric lat (-90..90) and lng (-180..180)');
    } else {
      coordinates = { lat, lng };
    }
  } else if (body.latitude !== undefined || body.longitude !== undefined) {
    const { latitude: lat, longitude: lng } = body;
    if (typeof lat !== 'number' || typeof lng !== 'number' || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errors.push('latitude (-90..90) and longitude (-180..180) must both be provided as numbers');
    } else {
      coordinates = { lat, lng };
    }
  }

  return { coordinates, errors };
}

function createBusiness(req, res) {
  const ownerId = resolveOwner(req);
  const body = req.body;

  const { coordinates, errors: coordErrors } = readCoordinates(body);
  if (coordErrors.length > 0) throw httpError(400, 'Validation failed', coordErrors);

  const business = businessRepository.create({
    id: body.id ? String(body.id) : createId('biz'),
    ownerId,
    name: body.name.trim(),
    industry: body.industry,
    location: body.location.trim(),
    state: body.state !== undefined ? (body.state ? String(body.state).trim() : null) : null,
    latitude: coordinates ? coordinates.lat : null,
    longitude: coordinates ? coordinates.lng : null,
    businessSize: body.businessSize !== undefined ? body.businessSize : null,
    businessStage: body.businessStage !== undefined ? body.businessStage : null,
    annualTurnover: body.annualTurnover !== undefined ? body.annualTurnover : null,
    annualExpenses: body.annualExpenses !== undefined ? body.annualExpenses : null,
    employeeCount: body.employeeCount !== undefined ? body.employeeCount : null,
    fundingRequired: body.fundingRequired !== undefined ? body.fundingRequired : null,
    hasBackupSupplier: body.hasBackupSupplier === true,
    hasEmergencyReserve: body.hasEmergencyReserve === true,
    monthlyOperatingCost: body.monthlyOperatingCost !== undefined ? body.monthlyOperatingCost : null,
    operationalDetails: body.operationalDetails !== undefined ? String(body.operationalDetails).slice(0, 2000) : null,
    isDemo: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return ok(res, { business }, 201);
}

function updateBusiness(req, res) {
  const ownerId = resolveOwner(req);

  if (req.body.coordinates !== undefined || req.body.latitude !== undefined || req.body.longitude !== undefined) {
    const { coordinates, errors } = readCoordinates(req.body);
    if (errors.length > 0) throw httpError(400, 'Validation failed', errors);
    const patch = { ...req.body, coordinates: coordinates || { lat: null, lng: null } };
    delete patch.latitude;
    delete patch.longitude;
    const business = businessRepository.update(req.params.id, ownerId, patch);
    if (!business) throw httpError(404, 'Business not found');
    return ok(res, { business });
  }

  const business = businessRepository.update(req.params.id, ownerId, req.body);
  if (!business) throw httpError(404, 'Business not found');
  return ok(res, { business });
}

function deleteBusiness(req, res) {
  const ownerId = resolveOwner(req);
  const removed = businessRepository.remove(req.params.id, ownerId);
  if (!removed) throw httpError(404, 'Business not found');
  return ok(res, { deleted: true, id: req.params.id });
}

async function createAssessment(req, res) {
  const ownerId = resolveOwner(req);
  const business = businessRepository.findById(req.params.id, ownerId);
  if (!business) throw httpError(404, 'Business not found');

  if (!business.coordinates) {
    throw httpError(
      400,
      'Validation failed',
      [
        'Business has no coordinates. Add latitude and longitude to the business, or call ' +
          'POST /api/climate/geocode to resolve the location first.',
      ]
    );
  }

  const { assessment, climate, sourceTimestamps } = await assessmentService.runAssessment(business, {
    forceDemo: req.body.forceDemo === true,
  });

  return ok(
    res,
    {
      business: { id: business.id, name: business.name, industry: business.industry, location: business.location },
      assessment,
      climate: {
        demoFallback: climate.demoFallback,
        sources: climate.sources,
        warnings: climate.warnings,
        detail: climate.detail,
        sourceTimestamps,
      },
      disclaimer: assessmentService.PROTOTYPE_DISCLAIMER,
    },
    201
  );
}

function listAssessmentsForBusiness(req, res) {
  const ownerId = resolveOwner(req);
  const business = businessRepository.findById(req.params.id, ownerId);
  if (!business) throw httpError(404, 'Business not found');
  return ok(res, { assessments: assessmentService.listForBusiness(business.id) });
}

function listAssessments(req, res) {
  const ownerId = resolveOwner(req);
  return ok(res, {
    assessments: assessmentRepository.listForOwner(ownerId, {
      limit: parsePositiveInt(req.query.limit, 50),
      offset: parsePositiveInt(req.query.offset, 0),
      category: req.query.category,
      from: req.query.from,
      to: req.query.to,
    }),
  });
}

function getAssessment(req, res) {
  const ownerId = resolveOwner(req);
  const assessment = assessmentService.getAssessment(req.params.id);
  if (!assessment) throw httpError(404, 'Assessment not found');
  if (assessment.ownerId !== ownerId) throw httpError(404, 'Assessment not found');
  return ok(res, {
    assessment,
    disclaimer: assessmentService.PROTOTYPE_DISCLAIMER,
  });
}

module.exports = {
  listBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  createAssessment,
  listAssessmentsForBusiness,
  listAssessments,
  getAssessment,
};

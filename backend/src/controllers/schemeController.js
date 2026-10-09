'use strict';

const schemeRepository = require('../repositories/schemeRepository.js');
const businessRepository = require('../repositories/businessRepository.js');
const schemeMatcher = require('../services/schemeMatcher.js');
const { ok, httpError } = require('../middleware/asyncHandler.js');
const { resolveOwner, parsePositiveInt } = require('./healthController.js');

function listSchemes(req, res) {
  const limit = parsePositiveInt(req.query.limit, 50);
  const offset = parsePositiveInt(req.query.offset, 0);
  const { rows, total } = schemeRepository.list({
    category: req.query.category,
    governmentLevel: req.query.governmentLevel,
    state: req.query.state,
    industry: req.query.industry,
    supportType: req.query.supportType,
    verificationStatus: req.query.verificationStatus,
    search: req.query.search,
    limit,
    offset,
  });

  return ok(res, {
    schemes: rows,
    pagination: { total, limit, offset },
    disclaimer: schemeMatcher.CATALOGUE_DISCLAIMER,
  });
}

function getScheme(req, res) {
  const scheme = schemeRepository.findById(req.params.id);
  if (!scheme) throw httpError(404, 'Scheme not found');
  return ok(res, { scheme, disclaimer: schemeMatcher.CATALOGUE_DISCLAIMER });
}

function matchSchemesForBusiness(req, res) {
  const ownerId = resolveOwner(req);
  const business = businessRepository.findById(req.params.id, ownerId);
  if (!business) throw httpError(404, 'Business not found');
  return ok(res, { businessId: business.id, ...schemeMatcher.matchBusiness(business) });
}

function listSaved(req, res) {
  const ownerId = resolveOwner(req);
  return ok(res, {
    savedSchemes: schemeRepository.listSavedForOwner(ownerId),
    disclaimer: schemeMatcher.CATALOGUE_DISCLAIMER,
  });
}

function saveScheme(req, res) {
  const ownerId = resolveOwner(req);
  const prepStatus = req.body.prepStatus || 'not_started';
  const allowed = ['not_started', 'gathering_documents', 'ready_to_apply', 'submitted', 'not_interested'];
  if (!allowed.includes(prepStatus)) {
    throw httpError(400, 'Validation failed', [`prepStatus must be one of: ${allowed.join(', ')}`]);
  }
  const saved = schemeRepository.saveForOwner(ownerId, req.params.id, prepStatus, req.body.notes);
  return ok(res, { savedSchemes: saved }, 201);
}

function unsaveScheme(req, res) {
  const ownerId = resolveOwner(req);
  const removed = schemeRepository.removeForOwner(ownerId, req.params.id);
  if (!removed) throw httpError(404, 'Saved scheme not found');
  return ok(res, { deleted: true, schemeId: req.params.id, savedSchemes: schemeRepository.listSavedForOwner(ownerId) });
}

module.exports = {
  listSchemes,
  getScheme,
  matchSchemesForBusiness,
  listSaved,
  saveScheme,
  unsaveScheme,
};

'use strict';

const loanReadinessService = require('../services/loanReadinessService.js');
const improvementRepository = require('../repositories/improvementRepository.js');
const improvementService = require('../services/improvementService.js');
const businessRepository = require('../repositories/businessRepository.js');
const { ok, httpError } = require('../middleware/asyncHandler.js');
const { resolveOwner } = require('./healthController.js');

function loadBusiness(req) {
  const ownerId = resolveOwner(req);
  const business = businessRepository.findById(req.params.id, ownerId);
  if (!business) throw httpError(404, 'Business not found');
  return business;
}

function getReadiness(req, res) {
  const business = loadBusiness(req);
  return ok(res, { loanReadiness: loanReadinessService.getReadiness(business) });
}

function updateReadiness(req, res) {
  const business = loadBusiness(req);
  const ownerId = resolveOwner(req);
  return ok(res, {
    loanReadiness: loanReadinessService.updateReadiness(business, req.body || {}, ownerId),
  });
}

function updateChecklistItem(req, res) {
  const business = loadBusiness(req);
  return ok(res, {
    loanReadiness: loanReadinessService.updateChecklistItem(business, req.params.documentName, req.body.status),
  });
}

function listImprovements(req, res) {
  const business = loadBusiness(req);
  return ok(res, {
    improvementActions: improvementRepository.listByBusiness(business.id, {
      status: req.query.status,
    }),
  });
}

function updateImprovement(req, res) {
  const business = loadBusiness(req);
  const allowed = ['open', 'in_progress', 'done', 'not_applicable'];
  const status = req.body.status;
  if (!allowed.includes(status)) {
    throw httpError(400, 'Validation failed', [`status must be one of: ${allowed.join(', ')}`]);
  }
  const updated = improvementRepository.updateStatus(req.params.actionId, business.id, status);
  if (!updated) throw httpError(404, 'Improvement action not found for this business');
  return ok(res, { improvementAction: updated });
}

function generateImprovements(req, res) {
  const business = loadBusiness(req);
  return ok(res, { improvementActions: improvementService.generateForBusiness(business) });
}

module.exports = {
  getReadiness,
  updateReadiness,
  updateChecklistItem,
  listImprovements,
  updateImprovement,
  generateImprovements,
};

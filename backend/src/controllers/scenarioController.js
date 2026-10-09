'use strict';

const scenarioService = require('../services/scenarioService.js');
const scenarioRepository = require('../repositories/scenarioRepository.js');
const businessRepository = require('../repositories/businessRepository.js');
const { ok, httpError } = require('../middleware/asyncHandler.js');
const { resolveOwner } = require('./healthController.js');

function loadBusiness(req) {
  const ownerId = resolveOwner(req);
  const business = businessRepository.findById(req.params.id, ownerId);
  if (!business) throw httpError(404, 'Business not found');
  return business;
}

async function createScenario(req, res) {
  const business = loadBusiness(req);
  const scenario = scenarioService.runScenario(business, req.body || {});
  return ok(res, { scenario }, 201);
}

function listScenarios(req, res) {
  const business = loadBusiness(req);
  return ok(res, {
    scenarios: scenarioRepository.listByBusiness(business.id, { limit: 100, offset: 0 }),
  });
}

function getScenario(req, res) {
  const ownerId = resolveOwner(req);
  const scenario = scenarioRepository.findById(req.params.id);
  if (!scenario) throw httpError(404, 'Scenario not found');
  if (scenario.ownerId !== ownerId) throw httpError(404, 'Scenario not found');
  return ok(res, { scenario });
}

function deleteScenario(req, res) {
  const ownerId = resolveOwner(req);
  const scenario = scenarioRepository.findById(req.params.id);
  if (!scenario) throw httpError(404, 'Scenario not found');
  if (scenario.ownerId !== ownerId) throw httpError(404, 'Scenario not found');
  scenarioRepository.remove(scenario.id);
  return ok(res, { deleted: true, id: scenario.id });
}

module.exports = { createScenario, listScenarios, getScenario, deleteScenario };

'use strict';

const dashboardService = require('../services/dashboardService.js');
const { ok } = require('../middleware/asyncHandler.js');
const { resolveOwner } = require('./healthController.js');

function getDashboard(req, res) {
  const ownerId = resolveOwner(req);
  const metrics = dashboardService.getDashboardMetrics(ownerId);

  return ok(res, {
    metrics,
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Metrics are computed from records stored in this Climora instance. Records flagged as demo data are sample ' +
      'records created for local development. Scores are illustrative prototype heuristics, not validated credit ratings.',
  });
}

module.exports = { getDashboard };

'use strict';

const express = require('express');
const router = express.Router();

const healthController = require('../controllers/healthController.js');
const businessController = require('../controllers/businessController.js');
const climateController = require('../controllers/climateController.js');
const scenarioController = require('../controllers/scenarioController.js');
const schemeController = require('../controllers/schemeController.js');
const loanReadinessController = require('../controllers/loanReadinessController.js');
const dashboardController = require('../controllers/dashboardController.js');

const { validateBody } = require('../validators/validateBody.js');
const { asyncHandler } = require('../middleware/asyncHandler.js');
const config = require('../config/index.js');

// --------------------------------------------------------------- health/config
router.get('/health', asyncHandler(healthController.health));
router.get('/config', asyncHandler(healthController.publicConfig));

// ------------------------------------------------------------------ businesses
const businessRules = [
  ['name', { type: 'string', required: true, minLength: 2, maxLength: 160, label: 'Business name' }],
  ['industry', { type: 'string', required: true, allowed: config.business.industries, label: 'Industry' }],
  ['location', { type: 'string', required: true, minLength: 2, maxLength: 160, label: 'Location' }],
  ['state', { type: 'string', maxLength: 80, label: 'State' }],
  ['businessSize', { type: 'string', allowed: config.business.sizes, label: 'Business size' }],
  ['businessStage', { type: 'string', allowed: config.business.stages, label: 'Business stage' }],
  ['annualTurnover', { type: 'number', min: 0, max: 1e13, label: 'Annual turnover' }],
  ['annualExpenses', { type: 'number', min: 0, max: 1e13, label: 'Annual expenses' }],
  ['monthlyOperatingCost', { type: 'number', min: 0, max: 1e13, label: 'Monthly operating cost' }],
  ['employeeCount', { type: 'integer', min: 0, max: 1000000, label: 'Employee count' }],
  ['fundingRequired', { type: 'number', min: 0, max: 1e13, label: 'Funding required' }],
  ['hasBackupSupplier', { type: 'boolean', label: 'Has backup supplier' }],
  ['hasEmergencyReserve', { type: 'boolean', label: 'Has emergency reserve' }],
];

router.get('/businesses', asyncHandler(businessController.listBusinesses));
router.post('/businesses', validateBody(businessRules), asyncHandler(businessController.createBusiness));
router.get('/businesses/:id', asyncHandler(businessController.getBusiness));
router.patch('/businesses/:id', validateBody(businessRules), asyncHandler(businessController.updateBusiness));
router.put('/businesses/:id', validateBody(businessRules), asyncHandler(businessController.updateBusiness));
router.delete('/businesses/:id', asyncHandler(businessController.deleteBusiness));

// ----------------------------------------------------------------- assessments
router.get('/assessments', asyncHandler(businessController.listAssessments));
router.get('/assessments/:id', asyncHandler(businessController.getAssessment));
router.get(
  '/businesses/:id/assessments',
  asyncHandler(businessController.listAssessmentsForBusiness)
);
router.post(
  '/businesses/:id/assessments',
  validateBody([['forceDemo', { type: 'boolean', label: 'Force demo data' }]]),
  asyncHandler(businessController.createAssessment)
);

// --------------------------------------------------------------------- climate
router.get('/climate/geocode', asyncHandler(climateController.geocode));
router.get('/climate/businesses/:id', asyncHandler(climateController.getBusinessClimate));

// -------------------------------------------------------------------- scenarios
router.post(
  '/businesses/:id/scenarios',
  validateBody([
    ['name', { type: 'string', maxLength: 160, label: 'Scenario name' }],
    ['annualNetRevenue', { type: 'number', min: 0, max: 1e13, label: 'Annual net revenue' }],
    ['annualFixedCost', { type: 'number', min: 0, max: 1e13, label: 'Annual fixed cost' }],
    ['monthlyOperatingCost', { type: 'number', min: 0, max: 1e13, label: 'Monthly operating cost' }],
    ['disruptionDays', { type: 'number', min: 0, max: 365, label: 'Disruption days per year' }],
    ['revenueDisruptionPct', { type: 'number', min: 0, max: 1, label: 'Revenue disruption percentage (0-1)' }],
    ['backupSupplier', { type: 'boolean', label: 'Backup supplier' }],
    ['emergencyReserve', { type: 'boolean', label: 'Emergency reserve' }],
    ['resilienceInvestment', { type: 'number', min: 0, max: 1e13, label: 'Resilience investment' }],
    ['resilienceAmortisationYears', { type: 'number', min: 0, max: 50, label: 'Resilience amortisation years' }],
  ]),
  asyncHandler(scenarioController.createScenario)
);
router.get('/businesses/:id/scenarios', asyncHandler(scenarioController.listScenarios));
router.get('/scenarios/:id', asyncHandler(scenarioController.getScenario));
router.delete('/scenarios/:id', asyncHandler(scenarioController.deleteScenario));

// ---------------------------------------------------------------------- schemes
router.get('/schemes', asyncHandler(schemeController.listSchemes));
router.get('/schemes/saved', asyncHandler(schemeController.listSaved));
router.get('/schemes/:id', asyncHandler(schemeController.getScheme));
router.get('/businesses/:id/scheme-matches', asyncHandler(schemeController.matchSchemesForBusiness));
router.post(
  '/schemes/:id/save',
  validateBody([
    ['prepStatus', { type: 'string', label: 'Preparation status' }],
    ['notes', { type: 'string', maxLength: 2000, label: 'Notes' }],
  ]),
  asyncHandler(schemeController.saveScheme)
);
router.delete('/schemes/:id/save', asyncHandler(schemeController.unsaveScheme));

// ------------------------------------------------- loan readiness / improvements
router.get('/businesses/:id/loan-readiness', asyncHandler(loanReadinessController.getReadiness));
router.put(
  '/businesses/:id/loan-readiness',
  validateBody([
    ['applicationStatus', { type: 'string', label: 'Application status' }],
    ['requestedAmount', { type: 'number', min: 0, max: 1e13, label: 'Requested amount' }],
    ['lenderName', { type: 'string', maxLength: 160, label: 'Lender name' }],
    ['rejectionReason', { type: 'string', maxLength: 2000, label: 'Rejection reason' }],
    ['lenderFeedback', { type: 'string', maxLength: 2000, label: 'Lender feedback' }],
  ]),
  asyncHandler(loanReadinessController.updateReadiness)
);
router.patch(
  '/businesses/:id/loan-readiness/documents/:documentName',
  validateBody([['status', { type: 'string', required: true, label: 'Document status' }]]),
  asyncHandler(loanReadinessController.updateChecklistItem)
);
router.get('/businesses/:id/improvements', asyncHandler(loanReadinessController.listImprovements));
router.post('/businesses/:id/improvements', asyncHandler(loanReadinessController.generateImprovements));
router.patch(
  '/businesses/:id/improvements/:actionId',
  validateBody([['status', { type: 'string', required: true, label: 'Improvement action status' }]]),
  asyncHandler(loanReadinessController.updateImprovement)
);

// ------------------------------------------------------------------- dashboard
router.get('/dashboard', asyncHandler(dashboardController.getDashboard));

module.exports = router;

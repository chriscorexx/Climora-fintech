import { Router } from 'express';
import {
  listBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
} from '../controllers/businessController';
import {
  runAssessmentForBusiness,
  listAssessmentsForBusiness,
  getAssessmentById,
} from '../controllers/assessmentController';
import { geocodeLocation, getClimateForBusiness } from '../controllers/climateController';
import { runScenario, listScenarios } from '../controllers/scenarioController';
import {
  listSchemes,
  getSchemeById,
  matchSchemesForBusiness,
  saveSchemeForBusiness,
  listSavedSchemes,
} from '../controllers/schemeController';
import { getHealth, getDashboardSummary } from '../controllers/dashboardController';

export const apiRouter = Router();

// Health & Dashboard
apiRouter.get('/health', getHealth);
apiRouter.get('/dashboard', getDashboardSummary);

// Businesses
apiRouter.get('/businesses', listBusinesses);
apiRouter.post('/businesses', createBusiness);
apiRouter.get('/businesses/:id', getBusinessById);
apiRouter.put('/businesses/:id', updateBusiness);
apiRouter.patch('/businesses/:id', updateBusiness);
apiRouter.delete('/businesses/:id', deleteBusiness);

// Assessments
apiRouter.post('/businesses/:id/assessments', runAssessmentForBusiness);
apiRouter.get('/businesses/:id/assessments', listAssessmentsForBusiness);
apiRouter.get('/assessments/:id', getAssessmentById);

// Climate
apiRouter.get('/climate/geocode', geocodeLocation);
apiRouter.get('/climate/businesses/:id', getClimateForBusiness);

// Scenarios
apiRouter.post('/businesses/:id/scenarios', runScenario);
apiRouter.get('/businesses/:id/scenarios', listScenarios);

// Schemes
apiRouter.get('/schemes', listSchemes);
apiRouter.get('/schemes/:id', getSchemeById);
apiRouter.get('/businesses/:id/scheme-matches', matchSchemesForBusiness);
apiRouter.post('/schemes/save', saveSchemeForBusiness);
apiRouter.get('/schemes/saved/:businessId', listSavedSchemes);

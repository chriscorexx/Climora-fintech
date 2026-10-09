'use strict';

const businessRepository = require('../repositories/businessRepository.js');
const schemeRepository = require('../repositories/schemeRepository.js');
const { buildSchemeRows } = require('../data/schemeCatalogue.js');
const { createId } = require('../middleware/asyncHandler.js');
const assessmentService = require('../services/assessmentService.js');

/**
 * Clearly-labelled demo seed data.
 *
 * Only inserted when the database is empty. Existing rows are never removed or
 * modified. Demo businesses are flagged with `is_demo = 1` so the API can label
 * or exclude them, and every demo record carries an explicit disclaimer in its
 * operational details.
 */

const DEMO_BUSINESSES = [
  {
    name: 'Sahyadri Agro Products',
    industry: 'food_processing',
    location: 'Pune, Maharashtra',
    state: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    businessSize: 'micro',
    businessStage: 'growth',
    annualTurnover: 4800000,
    annualExpenses: 3900000,
    employeeCount: 18,
    fundingRequired: 1500000,
    monthlyOperatingCost: 325000,
    hasBackupSupplier: false,
    hasEmergencyReserve: false,
  },
  {
    name: 'Konkan Textile Works',
    industry: 'manufacturing',
    location: 'Ichalkaranji, Maharashtra',
    state: 'Maharashtra',
    latitude: 16.7,
    longitude: 74.4667,
    businessSize: 'small',
    businessStage: 'established',
    annualTurnover: 12600000,
    annualExpenses: 10800000,
    employeeCount: 42,
    fundingRequired: 5000000,
    monthlyOperatingCost: 900000,
    hasBackupSupplier: true,
    hasEmergencyReserve: false,
  },
  {
    name: 'Deccan Farm Fresh LLP',
    industry: 'agriculture',
    location: 'Nashik, Maharashtra',
    state: 'Maharashtra',
    latitude: 19.9975,
    longitude: 73.7898,
    businessSize: 'small',
    businessStage: 'growth',
    annualTurnover: 3600000,
    annualExpenses: 3000000,
    employeeCount: 24,
    fundingRequired: 2000000,
    monthlyOperatingCost: 250000,
    hasBackupSupplier: false,
    hasEmergencyReserve: true,
  },
  {
    name: 'Arabian Sea Seafoods',
    industry: 'food_processing',
    location: 'Ratnagiri, Maharashtra',
    state: 'Maharashtra',
    latitude: 16.9944,
    longitude: 73.3,
    businessSize: 'micro',
    businessStage: 'established',
    annualTurnover: 6400000,
    annualExpenses: 5200000,
    employeeCount: 20,
    fundingRequired: 1200000,
    monthlyOperatingCost: 430000,
    hasBackupSupplier: true,
    hasEmergencyReserve: true,
  },
];

const DEMO_DISCLAIMER =
  'DEMO RECORD: seeded sample data for local development. Not a real business, ' +
  'not a live climate observation and not an assessment performed by any lender.';

function seed() {
  const result = { schemes: 0, businesses: 0, demoAssessments: 0, skipped: false };

  const existingSchemes = schemeRepository.count();
  if (existingSchemes === 0) {
    schemeRepository.insertMany(buildSchemeRows());
    result.schemes = schemeRepository.count();
  } else {
    result.skipped = true;
  }

  const existingBusinesses = businessRepository.list('local', { limit: 1, offset: 0 }).total;
  if (existingBusinesses === 0) {
    const now = new Date().toISOString();
    const created = [];
    for (const demo of DEMO_BUSINESSES) {
      const business = businessRepository.create({
        id: createId('biz'),
        ownerId: 'local',
        ...demo,
        operationalDetails: DEMO_DISCLAIMER,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      });
      created.push(business);
    }
    result.businesses = created.length;

    // One clearly-labelled demo assessment per seeded business, generated from
    // demo climate values so the dashboard is meaningful on a fresh install
    // without claiming any live observation.
    for (const business of created) {
      try {
        assessmentService.runAssessment(business, { forceDemo: true, isDemo: true });
        result.demoAssessments += 1;
      } catch (error) {
        console.error(`[climora] demo assessment for "${business.name}" failed:`, error.message);
      }
    }
  } else {
    result.skipped = true;
  }

  return result;
}

module.exports = { seed, DEMO_BUSINESSES, DEMO_DISCLAIMER };

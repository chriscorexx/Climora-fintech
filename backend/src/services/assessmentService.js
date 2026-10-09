'use strict';

const config = require('../config/index.js');
const businessRepository = require('../repositories/businessRepository.js');
const assessmentRepository = require('../repositories/assessmentRepository.js');
const improvementRepository = require('../repositories/improvementRepository.js');
const risk = require('./riskService.js');
const climate = require('./climateService.js');
const { createId, nowIso } = require('../middleware/asyncHandler.js');

const METHODOLOGY =
  'Weighted rule-based heuristic using proportional reweighting of missing dimensions. ' +
  'Weights: Flood 30%, Heavy Rainfall 25%, Extreme Heat 20%, Business Vulnerability 15%, Financial Resilience 10%. ' +
  risk.getMissingDataStrategy();

const PROTOTYPE_DISCLAIMER =
  'This score is an illustrative prototype heuristic produced for decision support. It is not a validated ' +
  'credit rating, a calibrated probability of default, or a lending recommendation, and it must not be used as ' +
  'the sole basis for approving or rejecting a loan.';

function buildFactorExplainers(dimension, score, availability, detail) {
  switch (dimension) {
    case 'flood':
      return detail && detail.referenceMax
        ? `Forecast peak daily river discharge ${detail.forecastPeak} m3/s is ${(detail.ratio * 100).toFixed(0)}% of the trailing 12-month maximum (${detail.referenceMax} m3/s) at the nearest modelled river cell. Regional hazard proxy only — not a premise-level flood probability.`
        : 'Flood dimension derived from Open-Meteo simulated river discharge.';
    case 'rainfall':
      return detail && detail.rainfallObservedMaxMm !== null && detail.rainfallObservedMaxMm !== undefined
        ? `Highest forecast daily precipitation total over the next ${config.climate.forecastDays} days is ${detail.rainfallObservedMaxMm} mm.`
        : 'Rainfall dimension derived from Open-Meteo daily forecast precipitation totals.';
    case 'heat':
      return detail && detail.heatObservedMaxC !== null && detail.heatObservedMaxC !== undefined
        ? `Highest forecast daily maximum temperature over the next ${config.climate.forecastDays} days is ${detail.heatObservedMaxC} C.`
        : 'Heat dimension derived from Open-Meteo daily forecast maximum temperatures.';
    case 'business':
      return 'Sector baseline vulnerability for the business industry.';
    case 'financial':
      return 'Derived from the user-provided expense-to-revenue ratio. Optional; treated as missing when either value is absent.';
    default:
      return '';
  }
}

/**
 * Runs a full assessment for a business: fetches climate data, derives the
 * dimension scores, runs the deterministic scoring engine and persists history.
 */
async function runAssessment(business, options = {}) {
  const ownerId = business.ownerId || 'local';
  const uncertaintyNotes = [];

  let climateBundle;
  climateBundle = await climate.getClimateBundle(business.coordinates.lat, business.coordinates.lng, {
    businessId: business.id,
    forceDemo: options.forceDemo === true,
  });

  const isDemoRecord = options.isDemo === true || Boolean(business.isDemo);

  const climateAvailability = climateBundle.demoFallback ? 'demo' : 'live_forecast';
  const availability = {
    flood: climateAvailability,
    rainfall: climateAvailability,
    heat: climateAvailability,
    business: 'derived',
    financial: 'derived',
  };

  const financialScore = risk.getFinancialVulnerability(
    business.annualTurnover,
    business.annualExpenses
  );
  if (financialScore === null) {
    uncertaintyNotes.push(
      'Financial resilience is missing because annual turnover and/or annual expenses were not provided. It was excluded from the score rather than treated as zero or as poor resilience.'
    );
  }

  const businessScore = risk.getBusinessVulnerability(business.industry);
  if (!config.risk.sectors[business.industry]) {
    uncertaintyNotes.push(
      'Industry is not in the mapped sector list; the default sector vulnerability of ' +
        `${config.risk.defaultSectorVulnerability} was used.`
    );
  }

  const dimensionInput = {
    flood: climateBundle.dimensions.flood,
    rainfall: climateBundle.dimensions.rainfall,
    heat: climateBundle.dimensions.heat,
    business: businessScore,
    financial: financialScore,
  };

  const invalid = risk.validateDimensionInputs(dimensionInput);
  if (!invalid.valid) {
    const error = new Error('Invalid dimension values');
    error.status = 500;
    error.details = invalid.invalidFields;
    throw error;
  }

  const score = risk.calculateRiskScore(dimensionInput);
  const sourceTimestamps = {};
  for (const source of climateBundle.sources) {
    for (const dim of source.dimension) sourceTimestamps[dim] = source.sourceTime || source.fetchedAt;
  }

  const factors = risk.DIMENSIONS.map(({ key }) => {
    const value = score.dimensionScores[key];
    const isMissing = value === null || value === undefined;
    return {
      dimension: key,
      score: isMissing ? null : value,
      baseWeight: config.risk.weights[key],
      effectiveWeight: isMissing ? 0 : score.effectiveWeights[key],
      contribution: isMissing ? 0 : value * config.risk.weights[key],
      dataAvailability: isMissing ? 'missing' : availability[key],
      sourceTimestamp: sourceTimestamps[key] || null,
      explanation: isMissing
        ? 'Dimension excluded from the score because the required data was not available. It is not scored as zero risk.'
        : buildFactorExplainers(key, value, availability[key], climateBundle.detail),
    };
  });

  if (score.isIncomplete) {
    uncertaintyNotes.push(
      `Assessment is incomplete: ${score.missingDimensions.join(', ')} had no usable data. ` +
        'Available dimensions were proportionally reweighted.'
    );
  }
  if (climateBundle.demoFallback) {
    uncertaintyNotes.push(
      'One or more climate dimensions use demo placeholder values because the live provider was unavailable. The score is illustrative.'
    );
  }
  uncertaintyNotes.push(
    'Simulated river discharge represents regional river flow at approximately 5 km resolution. It is a hazard proxy and is not a direct measurement of flood risk to this specific business.'
  );
  uncertaintyNotes.push(PROTOTYPE_DISCLAIMER);

  const assessmentId = createId('asmt');
  const assessmentRecord = {
    id: assessmentId,
    businessId: business.id,
    ownerId,
    overallScore: score.overallScore,
    category: score.category,
    isIncomplete: score.isIncomplete,
    missingDimensions: score.missingDimensions,
    dataNote: isDemoRecord && climateBundle.demoFallback
      ? 'DEMO RECORD: this assessment was generated for a seeded demo business using clearly labelled demo climate values. No live observations were fetched.'
      : climateBundle.demoFallback
        ? 'DEMO DATA REQUESTED: all climate dimensions use synthetic placeholder values. No live observations were fetched.'
        : 'Climate dimensions derived from live Open-Meteo forecast data for the business coordinates. Dimensions with no provider data are marked missing and excluded from the score.',
    methodology: METHODOLOGY,
    inputSnapshot: {
      coordinates: business.coordinates,
      industry: business.industry,
      annualTurnover: business.annualTurnover,
      annualExpenses: business.annualExpenses,
      dimensionInput,
    },
    uncertaintyNotes,
    createdAt: nowIso(),
  };

  const created = assessmentRepository.create(
    { ...assessmentRecord, isDemo: isDemoRecord },
    factors
  );

  // Improvement actions are derived from the assessment and from the resilience
  // information captured on the business profile.
  const engineActions = risk.generateRecommendations({
    dimensionScores: score.dimensionScores,
    industry: business.industry,
  });
  const actions = engineActions.map((rec) => ({
    id: createId('imp'),
    businessId: business.id,
    ownerId,
    title: rec.title,
    description: rec.description,
    priority: rec.priority,
    source: 'climora_engine',
    status: 'open',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));
  if (business.hasBackupSupplier === false) {
    actions.push({
      id: createId('imp'),
      businessId: business.id,
      ownerId,
      title: 'Establish a Backup Supplier',
      description:
        'No backup supplier is recorded. Identifying at least one alternate supplier reduces disruption exposure from climate-related transport and supply failures.',
      priority: 'Medium',
      source: 'climora_engine',
      status: 'open',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }
  if (business.hasEmergencyReserve === false) {
    actions.push({
      id: createId('imp'),
      businessId: business.id,
      ownerId,
      title: 'Build an Emergency Reserve',
      description:
        'No emergency reserve is recorded. Even a partial reserve covering essential operating costs improves the ability to absorb short climate-related disruptions.',
      priority: 'High',
      source: 'climora_engine',
      status: 'open',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }
  improvementRepository.createMany(actions);

  return { assessment: created, climate: climateBundle, score, sourceTimestamps };
}

function getAssessment(id) {
  return assessmentRepository.findById(id);
}

function listForBusiness(businessId) {
  return assessmentRepository.listByBusiness(businessId, { limit: 100, offset: 0 });
}

function latestForBusiness(businessId) {
  return assessmentRepository.latestForBusiness(businessId);
}

module.exports = { runAssessment, getAssessment, listForBusiness, latestForBusiness, METHODOLOGY, PROTOTYPE_DISCLAIMER };

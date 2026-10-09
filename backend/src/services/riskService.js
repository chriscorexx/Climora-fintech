'use strict';

const config = require('../config/index.js');

const DIMENSIONS = [
  { key: 'flood', label: 'Flood Exposure', dataType: 'live_forecast' },
  { key: 'rainfall', label: 'Heavy Rainfall', dataType: 'live_forecast' },
  { key: 'heat', label: 'Extreme Heat', dataType: 'live_forecast' },
  { key: 'business', label: 'Business Vulnerability', dataType: 'derived' },
  { key: 'financial', label: 'Financial Resilience', dataType: 'derived' },
];

const DIMENSION_LABELS = DIMENSIONS.reduce((acc, d) => {
  acc[d.key] = d.label;
  return acc;
}, {});

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function getRiskCategory(score) {
  const match = config.risk.categories.find((c) => score >= c.min && score <= c.max);
  return match || config.risk.categories[config.risk.categories.length - 1];
}

function getBusinessVulnerability(industry) {
  const sector = config.risk.sectors[industry];
  return sector ? sector.baseVulnerability : config.risk.defaultSectorVulnerability;
}

function getFinancialVulnerability(revenue, expenses) {
  if (revenue === undefined || revenue === null || revenue <= 0) return null;
  if (expenses === undefined || expenses === null) return null;
  const expenseRatio = expenses / revenue;
  if (expenseRatio >= 0.9) return 90;
  if (expenseRatio >= 0.8) return 70;
  if (expenseRatio >= 0.7) return 50;
  if (expenseRatio >= 0.6) return 30;
  return 15;
}

/**
 * Core scoring function.
 *
 * Mirrors src/data/riskEngine.js on the frontend so the desktop UI and the API
 * agree on every number. Missing dimensions are excluded and the remaining
 * dimensions are proportionally reweighted — missing data is never scored as
 * zero risk.
 */
function calculateRiskScore(params) {
  const weights = config.risk.weights;
  const dimensions = {
    flood: { weight: weights.flood, value: params.flood },
    rainfall: { weight: weights.rainfall, value: params.rainfall },
    heat: { weight: weights.heat, value: params.heat },
    business: { weight: weights.business, value: params.business },
    financial: { weight: weights.financial, value: params.financial },
  };

  let totalWeighted = 0;
  let totalActiveWeight = 0;
  const missingDimensions = [];
  const dimensionScores = {};
  const weightedContributions = {};
  const effectiveWeights = {};

  for (const [name, dim] of Object.entries(dimensions)) {
    if (dim.value === null || dim.value === undefined) {
      missingDimensions.push(name);
      dimensionScores[name] = null;
      weightedContributions[name] = 0;
      continue;
    }
    const clamped = clamp(dim.value);
    dimensionScores[name] = clamped;
    weightedContributions[name] = clamped * dim.weight;
    totalWeighted += clamped * dim.weight;
    totalActiveWeight += dim.weight;
  }

  const overallScore = totalActiveWeight > 0 ? Math.round(totalWeighted / totalActiveWeight) : 0;

  for (const [name, dim] of Object.entries(dimensions)) {
    if (dim.value !== null && dim.value !== undefined && totalActiveWeight > 0) {
      effectiveWeights[name] = dim.weight / totalActiveWeight;
    }
  }

  const category = getRiskCategory(overallScore);

  return {
    overallScore,
    category: category.label,
    categoryKey: category.key,
    dimensionScores,
    weightedContributions,
    effectiveWeights,
    missingDimensions,
    isIncomplete:
      missingDimensions.length > 0 ||
      Object.keys(dimensions).length - missingDimensions.length <
        config.risk.minimumDimensionsForCompleteAssessment,
    activeWeightSum: totalActiveWeight,
    totalWeightSum: 1.0,
  };
}

function validateDimensionInputs(params) {
  const invalidFields = [];
  for (const { key } of DIMENSIONS) {
    const value = params[key];
    if (value === null || value === undefined) continue;
    if (typeof value !== 'number' || Number.isNaN(value) || value < 0 || value > 100) {
      invalidFields.push(key);
    }
  }
  return { valid: invalidFields.length === 0, invalidFields };
}

function getMissingDataStrategy() {
  return (
    'When one or more risk dimensions lack data, the dimension is excluded from the score ' +
    'and the remaining dimensions are proportionally reweighted. If fewer than ' +
    `${config.risk.minimumDimensionsForCompleteAssessment} dimensions have data, the assessment is ` +
    'flagged as incomplete. Missing data is never silently treated as zero risk.'
  );
}

function describeWeights() {
  return config.risk.categories.map((c) => `${c.label} (${c.min}-${c.max})`).join(', ');
}

/**
 * Deterministic recommendations derived from the dimension scores.
 * Mirrors the frontend "Recommended Actions" block so both surfaces agree.
 */
function generateRecommendations({ dimensionScores, industry }) {
  const recommendations = [];
  const d = dimensionScores || {};

  if (d.flood !== null && d.flood !== undefined && d.flood > 60) {
    recommendations.push({
      title: 'Flood Preparedness Plan',
      description:
        'Document flood-response procedures, identify evacuation routes, secure critical equipment, and review insurance cover for flood damage.',
      priority: 'High',
    });
  }
  if (d.rainfall !== null && d.rainfall !== undefined && d.rainfall > 50) {
    recommendations.push({
      title: 'Rainfall Impact Assessment',
      description:
        'Evaluate drainage around premises, protect inventory from water ingress, and identify backup suppliers for delivery-dependent operations.',
      priority: 'High',
    });
  }
  if (d.heat !== null && d.heat !== undefined && d.heat > 50) {
    recommendations.push({
      title: 'Heat Stress Management',
      description:
        'Provide cooling measures for workers, check HVAC capacity, and schedule heat-sensitive operations during cooler hours.',
      priority: 'Medium',
    });
  }
  if (d.business !== null && d.business !== undefined && d.business > 15) {
    const label = config.risk.sectors[industry]?.label || 'the selected sector';
    recommendations.push({
      title: 'Sector-Specific Resilience',
      description: `Review industry-specific climate vulnerabilities and contingency plans for ${label}.`,
      priority: 'Medium',
    });
  }
  if (d.financial !== null && d.financial !== undefined && d.financial > 30) {
    recommendations.push({
      title: 'Financial Resilience',
      description:
        'Build an emergency fund covering 3-6 months of operating expenses, review debt obligations, and consider refinancing options.',
      priority: 'High',
    });
  }
  recommendations.push({
    title: 'Business Continuity Plan',
    description:
      'Create a plan covering temporary closure, supply-chain disruption, and remote operations where feasible.',
    priority: 'Low',
  });
  return recommendations;
}

module.exports = {
  DIMENSIONS,
  DIMENSION_LABELS,
  calculateRiskScore,
  getRiskCategory,
  getBusinessVulnerability,
  getFinancialVulnerability,
  validateDimensionInputs,
  getMissingDataStrategy,
  generateRecommendations,
  describeWeights,
  clamp,
};

import { riskWeights, riskCategories, businessSectors } from './demoData.js';

/**
 * Pure JavaScript risk scoring module.
 * Implements the transparent rule-based scoring methodology from RISK_SCORING.md.
 *
 * Weights:
 * - Flood Exposure: 30%
 * - Heavy Rainfall: 25%
 * - Extreme Heat: 20%
 * - Business Vulnerability: 15%
 * - Financial Vulnerability: 10%
 * Total: 100%
 *
 * This is an illustrative heuristic, not a validated credit rating or probability of default.
 */

function getRiskCategory(score) {
  if (score <= riskCategories.low.max) return riskCategories.low;
  if (score <= riskCategories.moderate.max) return riskCategories.moderate;
  if (score <= riskCategories.high.max) return riskCategories.high;
  return riskCategories.veryHigh;
}

function getBusinessVulnerability(sectorKey) {
  const sector = businessSectors[sectorKey];
  return sector ? sector.baseVulnerability : 15;
}

function getFinancialVulnerability(revenue, expenses) {
  if (revenue === undefined || revenue === null || revenue === 0) {
    return null;
  }
  if (expenses === undefined || expenses === null) {
    return null;
  }
  const expenseRatio = expenses / revenue;
  let score;
  if (expenseRatio >= 0.9) score = 90;
  else if (expenseRatio >= 0.8) score = 70;
  else if (expenseRatio >= 0.7) score = 50;
  else if (expenseRatio >= 0.6) score = 30;
  else score = 15;
  return score;
}

/**
 * Calculates an overall risk score using proportional reweighting
 * for any dimensions that are missing/null.
 *
 * @param {Object} params - Risk dimension values (0-100 each)
 * @param {number|null} params.flood - Flood exposure dimension
 * @param {number|null} params.rainfall - Heavy rainfall dimension
 * @param {number|null} params.heat - Extreme heat dimension
 * @param {number|null} params.business - Business vulnerability dimension
 * @param {number|null} params.financial - Financial vulnerability dimension
 * @returns {Object} Score result with overall, category, weighted contributions, and missing info
 */
function calculateRiskScore(params) {
  const dimensions = {
    flood: { weight: riskWeights.flood, value: params.flood },
    rainfall: { weight: riskWeights.rainfall, value: params.rainfall },
    heat: { weight: riskWeights.heat, value: params.heat },
    business: { weight: riskWeights.business, value: params.business },
    financial: { weight: riskWeights.financial, value: params.financial },
  };

  let totalWeighted = 0;
  let totalActiveWeight = 0;
  const missingDimensions = [];
  const weightedContributions = {};
  const dimensionScores = {};

  for (const [name, dim] of Object.entries(dimensions)) {
    if (dim.value === null || dim.value === undefined) {
      missingDimensions.push(name);
      dimensionScores[name] = null;
      weightedContributions[name] = 0;
    } else {
      const clamped = Math.max(0, Math.min(100, dim.value));
      dimensionScores[name] = clamped;
      const contribution = clamped * dim.weight;
      weightedContributions[name] = contribution;
      totalWeighted += contribution;
      totalActiveWeight += dim.weight;
    }
  }

  let overallScore = 0;
  if (totalActiveWeight > 0) {
    overallScore = Math.round(totalWeighted / totalActiveWeight);
  }

  const effectiveWeights = {};
  if (totalActiveWeight > 0) {
    for (const [name, dim] of Object.entries(dimensions)) {
      if (dim.value !== null && dim.value !== undefined) {
        effectiveWeights[name] = dim.weight / totalActiveWeight;
      }
    }
  }

  const category = getRiskCategory(overallScore);
  const isIncomplete = missingDimensions.length > 0;

  return {
    overallScore,
    category: category.label,
    categoryColor: category.color,
    dimensionScores,
    weightedContributions,
    effectiveWeights,
    missingDimensions,
    isIncomplete,
    activeWeightSum: totalActiveWeight,
    totalWeightSum: 1.0,
  };
}

/**
 * Validates that a dimension value is within the acceptable range (0-100).
 * @param {number} value
 * @returns {boolean}
 */
function isValidDimensionValue(value) {
  if (value === null || value === undefined) return true;
  return typeof value === 'number' && value >= 0 && value <= 100;
}

/**
 * Validates that all provided dimension values are within range.
 * @param {Object} params
 * @returns {{valid: boolean, invalidFields: string[]}}
 */
function validateDimensionInputs(params) {
  const invalidFields = [];
  const fields = ['flood', 'rainfall', 'heat', 'business', 'financial'];
  for (const field of fields) {
    if (!isValidDimensionValue(params[field])) {
      invalidFields.push(field);
    }
  }
  return {
    valid: invalidFields.length === 0,
    invalidFields,
  };
}

/**
 * Returns a summary of the missing-data strategy used.
 * @returns {string}
 */
function getMissingDataStrategy() {
  return (
    'When one or more risk dimensions lack data, the dimension is excluded from the score ' +
    'and the remaining dimensions are proportionally reweighted. If fewer than 2 dimensions ' +
    'have data, the assessment is flagged as incomplete. Missing data is never silently ' +
    'treated as zero risk.'
  );
}

export {
  calculateRiskScore,
  getRiskCategory,
  getBusinessVulnerability,
  getFinancialVulnerability,
  validateDimensionInputs,
  isValidDimensionValue,
  getMissingDataStrategy,
};

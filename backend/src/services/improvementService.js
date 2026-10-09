'use strict';

const risk = require('./riskService.js');
const improvementRepository = require('../repositories/improvementRepository.js');
const { createId, nowIso } = require('../middleware/asyncHandler.js');

/**
 * Improvement roadmap generator.
 *
 * Generated actions are always labelled `climora_engine` so that they can be
 * distinguished from anything a lender or user supplies.
 */
function buildActions(business, latestAssessment) {
  const dimensionScores = latestAssessment ? latestAssessment.factors.reduce((acc, factor) => {
    acc[factor.dimension] = factor.score;
    return acc;
  }, {}) : {};

  const actions = risk.generateRecommendations({ dimensionScores, industry: business.industry });

  if (business.hasBackupSupplier === false) {
    actions.push({
      title: 'Establish a Backup Supplier',
      description:
        'No backup supplier is recorded. Identifying at least one alternate supplier reduces disruption exposure from climate-related transport and supply failures.',
      priority: 'Medium',
    });
  }
  if (business.hasEmergencyReserve === false) {
    actions.push({
      title: 'Build an Emergency Reserve',
      description:
        'No emergency reserve is recorded. Even a partial reserve covering essential operating costs improves the ability to absorb short climate-related disruptions.',
      priority: 'High',
    });
  }
  if (business.annualTurnover === null || business.annualExpenses === null) {
    actions.push({
      title: 'Record Annual Turnover and Expenses',
      description:
        'Financial resilience cannot be assessed without both values. They are treated as missing data rather than zero resilience.',
      priority: 'Medium',
    });
  }

  return actions.map((action) => ({
    id: createId('imp'),
    businessId: business.id,
    ownerId: business.ownerId,
    title: action.title,
    description: action.description,
    priority: action.priority,
    source: 'climora_engine',
    status: 'open',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));
}

function generateForBusiness(business) {
  // Reuse the existing generator by running the same derivation as the
  // assessment service, without creating a new assessment.
  const latest = require('../repositories/assessmentRepository.js').latestForBusiness(business.id);
  const actions = buildActions(business, latest);
  improvementRepository.createMany(actions);
  return improvementRepository.listByBusiness(business.id);
}

module.exports = { generateForBusiness, buildActions };

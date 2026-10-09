'use strict';

const businessRepository = require('../repositories/businessRepository.js');
const assessmentRepository = require('../repositories/assessmentRepository.js');
const schemeRepository = require('../repositories/schemeRepository.js');
const scenarioRepository = require('../repositories/scenarioRepository.js');
const improvementRepository = require('../repositories/improvementRepository.js');
const loanReadinessRepository = require('../repositories/loanReadinessRepository.js');
const config = require('../config/index.js');

/**
 * Dashboard metrics, all derived from stored records. No hardcoded figures.
 */
function getDashboardMetrics(ownerId) {
  const businesses = businessRepository.list(ownerId, { limit: 500, offset: 0 }).rows;
  const assessments = assessmentRepository.listForOwner(ownerId, { limit: 1000, offset: 0 });

  const latestByBusiness = new Map();
  for (const assessment of assessments) {
    if (!latestByBusiness.has(assessment.businessId)) {
      latestByBusiness.set(assessment.businessId, assessment);
    }
  }

  const assessedCount = latestByBusiness.size;
  const scores = [...latestByBusiness.values()].map((a) => a.overallScore);
  const averageScore = scores.length ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : null;
  const highRiskCount = scores.filter((s) => s >= 50).length;
  const incompleteCount = [...latestByBusiness.values()].filter((a) => a.isIncomplete).length;

  const categoryDistribution = {};
  for (const category of config.risk.categories) {
    categoryDistribution[category.label] = scores.filter((s) => {
      const match = config.risk.categories.find((c) => s >= c.min && s <= c.max);
      return match && match.label === category.label;
    }).length;
  }

  const industryDistribution = {};
  for (const business of businesses) {
    const label = config.risk.sectors[business.industry]?.label || business.industry || 'Unspecified';
    industryDistribution[label] = (industryDistribution[label] || 0) + 1;
  }

  let savedSchemes = 0;
  let scenarios = 0;
  let openImprovements = 0;
  let loanRecords = 0;

  for (const business of businesses) {
    scenarios += scenarioRepository.listByBusiness(business.id, { limit: 1000, offset: 0 }).length;
    openImprovements += improvementRepository.listByBusiness(business.id, { status: 'open' }).length;
    if (loanReadinessRepository.findByBusinessId(business.id)) loanRecords += 1;
  }
  savedSchemes = schemeRepository.listSavedForOwner(ownerId).length;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const assessmentsLast30Days = assessments.filter((a) => a.createdAt >= thirtyDaysAgo).length;

  return {
    portfolioSize: businesses.length,
    assessedBusinesses: assessedCount,
    unassessedBusinesses: businesses.length - assessedCount,
    averageRiskScore: averageScore,
    highRiskBusinesses: highRiskCount,
    highRiskPct: assessedCount ? Math.round((highRiskCount / assessedCount) * 100) : null,
    categoryDistribution,
    industryDistribution,
    incompleteAssessments: incompleteCount,
    totalAssessments: assessments.length,
    assessmentsLast30Days,
    savedSchemes,
    scenarioCount: scenarios,
    openImprovementActions: openImprovements,
    loanReadinessRecords: loanRecords,
    businesses,
    latestAssessmentByBusiness: [...latestByBusiness.entries()].map(([businessId, assessment]) => ({
      businessId,
      assessmentId: assessment.id,
      overallScore: assessment.overallScore,
      category: assessment.category,
      createdAt: assessment.createdAt,
      isIncomplete: assessment.isIncomplete,
    })),
  };
}

module.exports = { getDashboardMetrics };

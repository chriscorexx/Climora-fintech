'use strict';

const config = require('../config/index.js');
const scenarioRepository = require('../repositories/scenarioRepository.js');
const { createId, nowIso } = require('../middleware/asyncHandler.js');

/**
 * Climate-to-cashflow impact simulator.
 *
 * All outputs are deterministic functions of the supplied inputs and are clearly
 * labelled as scenario estimates, not actual losses or guaranteed predictions.
 * No precise financial impact is produced when required inputs are missing.
 */

const LIMITATIONS = [
  'Scenario outputs are illustrative estimates based on the assumptions provided, not audited actuals or predictions.',
  'The disruption model is a simple linear approximation; it does not model supply chains, seasonality, demand substitution or insurance recoveries.',
  'Downstream revenue effects assume disrupted days are entirely lost operating time at the supplied daily net revenue.',
  'Climate hazard probabilities are not modelled. The downtime assumption is user-supplied and is not derived from any flood or rainfall probability.',
];

function requirePositive(value, field) {
  if (value === undefined || value === null || typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    const error = new Error(`${field} is required for a cashflow impact scenario and must be a positive number`);
    error.status = 400;
    error.details = [error.message];
    throw error;
  }
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Baseline: normal operating year with no climate disruption.
 */
function computeBaseline(inputs) {
  const annualNetRevenue = inputs.annualNetRevenue;
  const annualFixedCost = inputs.annualFixedCost;
  const annualNetIncome = annualNetRevenue - annualFixedCost;
  const dailyNetRevenue = annualNetRevenue / 365;

  return {
    annualNetRevenue,
    annualFixedCost,
    annualNetIncome,
    dailyNetRevenue,
    marginRatio: annualNetRevenue > 0 ? annualNetIncome / annualNetRevenue : null,
  };
}

/**
 * Scenario: expected annualised climate disruption cost.
 *
 * disruptionDays        days per year of lost or reduced operations
 * revenueDisruptionPct  share of daily net revenue lost on a disrupted day
 * backupSupplier        reduces downtime by `backupMitigationPct`
 * emergencyReserve      finances part of the shock; only reduces the funding gap
 * resilienceInvestment  upfront cost amortised over `resilienceAmortisationYears`
 */
function computeScenarioImpact(inputs, baseline) {
  const mitigation = inputs.backupSupplier ? config.scenario.backupMitigationPct : 0;
  const reserveCover = inputs.emergencyReserve ? config.scenario.emergencyReserveCoverPct : 0;

  const effectiveDowntimeDays = inputs.disruptionDays * (1 - mitigation);

  const grossDisruptionCost = round2(effectiveDowntimeDays * baseline.dailyNetRevenue * inputs.revenueDisruptionPct);
  const disruptionCost = round2(grossDisruptionCost);

  const annualResilienceCost = round2(
    inputs.resilienceInvestment / Math.max(1, inputs.resilienceAmortisationYears)
  );

  const totalAnnualImpact = round2(disruptionCost + annualResilienceCost);

  const cashBufferAvailable = round2(inputs.monthlyOperatingCost * reserveCover * 6);
  const fundingGap = round2(Math.max(0, disruptionCost - cashBufferAvailable));

  const netIncomeAfterImpact = round2(baseline.annualNetIncome - totalAnnualImpact);
  const incomeReductionPct =
    baseline.annualNetIncome !== 0
      ? round2((totalAnnualImpact / Math.abs(baseline.annualNetIncome)) * 100)
      : null;

  return {
    disruptionDaysAssumed: inputs.disruptionDays,
    effectiveDowntimeDays: round2(effectiveDowntimeDays),
    backupSupplierMitigationPct: round2(mitigation * 100),
    revenueDisruptionPct: round2(inputs.revenueDisruptionPct * 100),
    annualDisruptionCost: disruptionCost,
    annualResilienceInvestmentCost: annualResilienceCost,
    totalAnnualImpact,
    cashBufferAvailable,
    fundingGap,
    netIncomeAfterImpact,
    incomeReductionPct,
    breakdown: [
      { label: 'Effective downtime days', value: round2(effectiveDowntimeDays), unit: 'days/year' },
      { label: 'Daily net revenue', value: round2(baseline.dailyNetRevenue), unit: 'per day' },
      { label: 'Gross disruption cost', value: grossDisruptionCost, unit: 'per year' },
      { label: 'Resilience investment (amortised)', value: annualResilienceCost, unit: 'per year' },
      { label: 'Total annual impact', value: totalAnnualImpact, unit: 'per year' },
      { label: 'Cash buffer assumed available', value: cashBufferAvailable, unit: 'one-off' },
      { label: 'Estimated funding gap', value: fundingGap, unit: 'one-off' },
    ],
  };
}

function runScenario(business, payload) {
  const inputs = {
    name: payload.name || 'Untitled scenario',
    annualNetRevenue: payload.annualNetRevenue !== undefined ? payload.annualNetRevenue : business.annualTurnover,
    annualFixedCost:
      payload.annualFixedCost !== undefined ? payload.annualFixedCost : business.annualExpenses,
    monthlyOperatingCost:
      payload.monthlyOperatingCost !== undefined ? payload.monthlyOperatingCost : business.monthlyOperatingCost,
    disruptionDays: payload.disruptionDays,
    revenueDisruptionPct:
      payload.revenueDisruptionPct !== undefined ? payload.revenueDisruptionPct : config.scenario.defaultRevenueDisruptionPct,
    backupSupplier:
      payload.backupSupplier !== undefined ? payload.backupSupplier : business.hasBackupSupplier,
    emergencyReserve:
      payload.emergencyReserve !== undefined ? payload.emergencyReserve : business.hasEmergencyReserve,
    resilienceInvestment: payload.resilienceInvestment || 0,
    resilienceAmortisationYears:
      payload.resilienceAmortisationYears || config.scenario.defaultAmortisationYears,
  };

  requirePositive(inputs.annualNetRevenue, 'annualNetRevenue');
  requirePositive(inputs.annualFixedCost, 'annualFixedCost');
  requirePositive(inputs.monthlyOperatingCost, 'monthlyOperatingCost');
  requirePositive(inputs.disruptionDays, 'disruptionDays');

  if (inputs.revenueDisruptionPct <= 0 || inputs.revenueDisruptionPct > 1) {
    const error = new Error('revenueDisruptionPct must be greater than 0 and at most 1');
    error.status = 400;
    error.details = [error.message];
    throw error;
  }
  if (inputs.resilienceAmortisationYears <= 0) {
    const error = new Error('resilienceAmortisationYears must be a positive number');
    error.status = 400;
    error.details = [error.message];
    throw error;
  }

  const baseline = computeBaseline(inputs);
  const result = computeScenarioImpact(inputs, baseline);

  const record = scenarioRepository.create({
    id: createId('scn'),
    businessId: business.id,
    ownerId: business.ownerId,
    name: inputs.name,
    inputs,
    baseline,
    scenario: {
      disruptionDays: inputs.disruptionDays,
      revenueDisruptionPct: inputs.revenueDisruptionPct,
      backupSupplier: inputs.backupSupplier,
      emergencyReserve: inputs.emergencyReserve,
      resilienceInvestment: inputs.resilienceInvestment,
      resilienceAmortisationYears: inputs.resilienceAmortisationYears,
    },
    result,
    createdAt: nowIso(),
  });

  return {
    ...record,
    limitations: LIMITATIONS,
    disclaimer:
      'This is a hypothetical scenario produced from user-supplied assumptions. It is not an actual loss, a forecast of future losses, or a guaranteed financial outcome.',
  };
}

module.exports = { runScenario, listScenarios: (businessId) => scenarioRepository.listByBusiness(businessId), LIMITATIONS };

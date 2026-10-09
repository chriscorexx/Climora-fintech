import { MSMEProfile, CashflowScenario } from '../types';
import { normalizeProfile } from './profileUtils';

/**
 * Climate-to-Cashflow Stress Testing Simulator
 * Calculates DSCR and liquidity deterioration under physical climate disruptions.
 */

export interface ScenarioParams {
  hazardType: 'flash_flood' | 'extreme_heatwave' | 'severe_storm_cyclone' | 'water_shortage';
  durationDays: number;
  intensityPct: number; // 0 - 100%
  facilityInundation: boolean;
  powerGridOutageDays: number;
}

export function simulateCashflowStress(
  profile: MSMEProfile,
  params: ScenarioParams
): CashflowScenario {
  const safeProfile = normalizeProfile(profile);
  const { monthlyRevenue, monthlyOperatingExpenses, existingMonthlyDebtObligations, availableCashReserves } = safeProfile.financials;

  const baselineNetOperatingIncome = monthlyRevenue - monthlyOperatingExpenses;
  const baselineDSCR = existingMonthlyDebtObligations > 0
    ? baselineNetOperatingIncome / existingMonthlyDebtObligations
    : 3.5;
  const baselineCashRunwayMonths = monthlyOperatingExpenses > 0
    ? availableCashReserves / monthlyOperatingExpenses
    : 1.0;

  // 1. Calculate Daily Disruption & Revenue Loss
  let baseDailyLossRate = 0.033; // 1/30th per day
  let emergencyRepairCost = 0;

  switch (params.hazardType) {
    case 'flash_flood':
      // Physical water entry stops all production and foot-traffic
      baseDailyLossRate = params.facilityInundation ? 0.90 : 0.45;
      emergencyRepairCost = params.facilityInundation
        ? Math.round(monthlyRevenue * 0.35 + (safeProfile.operations?.hasFloodBarriers ? -15000 : 35000))
        : 10000;
      break;

    case 'extreme_heatwave':
      // Productivity loss + equipment overheating
      baseDailyLossRate = safeProfile.operations?.perishableInventory && !safeProfile.operations?.hasColdStorage
        ? 0.70
        : 0.30;
      emergencyRepairCost = safeProfile.operations?.hasBackupGenerator ? 5000 : 25000;
      break;

    case 'severe_storm_cyclone':
      baseDailyLossRate = 0.80;
      emergencyRepairCost = Math.round(monthlyRevenue * 0.25);
      break;

    case 'water_shortage':
      baseDailyLossRate = safeProfile.operations?.waterIntensive && !safeProfile.operations?.hasWaterStorageRainwater
        ? 0.65
        : 0.20;
      emergencyRepairCost = 15000;
      break;
  }

  // Adjust for power outages
  if (params.powerGridOutageDays > 0 && !safeProfile.operations?.hasBackupGenerator) {
    baseDailyLossRate = Math.min(1.0, baseDailyLossRate + 0.15);
  }

  // Scaled by intensity slider
  const intensityMultiplier = 0.6 + (params.intensityPct / 100) * 0.8;
  const effectiveDays = Math.min(30, params.durationDays);
  const totalMonthRevenueLoss = Math.min(
    monthlyRevenue,
    Math.round((monthlyRevenue / 30) * effectiveDays * baseDailyLossRate * intensityMultiplier)
  );

  const stressedRevenue = Math.max(0, monthlyRevenue - totalMonthRevenueLoss);
  // Fixed costs (rent, wages, minimal power) still remain at ~75% of operating expenses
  const stressedOperatingExpenses = monthlyOperatingExpenses * 0.85 + (emergencyRepairCost / 3);
  const stressedNetOperatingIncome = stressedRevenue - stressedOperatingExpenses;

  // Stressed DSCR
  const stressedDSCR = existingMonthlyDebtObligations > 0
    ? stressedNetOperatingIncome / existingMonthlyDebtObligations
    : stressedNetOperatingIncome > 0 ? 2.0 : 0.2;

  // Cash deficit during the stressed month
  const monthlyCashOutflow = stressedOperatingExpenses + existingMonthlyDebtObligations;
  const netDeficit = Math.max(0, monthlyCashOutflow - stressedRevenue);

  // Stressed cash reserves
  const remainingCashReserves = Math.max(0, availableCashReserves - netDeficit);
  const stressedCashRunwayMonths = monthlyOperatingExpenses > 0
    ? remainingCashReserves / monthlyOperatingExpenses
    : 0;

  // Recovery time estimation in months
  const monthlySurplus = Math.max(1, baselineNetOperatingIncome - existingMonthlyDebtObligations);
  const recoveryTimeMonths = netDeficit > 0 ? Math.ceil(netDeficit / monthlySurplus) : 0;

  // Insolvency classification
  let insolvencyRisk: 'resilient' | 'strained' | 'critical' = 'resilient';
  if (stressedDSCR < 0.8 || stressedCashRunwayMonths < 0.5) {
    insolvencyRisk = 'critical';
  } else if (stressedDSCR < 1.15 || stressedCashRunwayMonths < 1.5) {
    insolvencyRisk = 'strained';
  }

  const hazardLabels: Record<string, string> = {
    flash_flood: 'Flash Flood & River Inundation',
    extreme_heatwave: 'Extreme Heatwave & Grid Stress',
    severe_storm_cyclone: 'Severe Tropical Storm & Gale Winds',
    water_shortage: 'Acute Water Shortage & Tanker Disruption',
  };

  return {
    scenarioId: `scen_${Date.now()}`,
    hazardType: params.hazardType,
    hazardLabel: hazardLabels[params.hazardType] || params.hazardType,
    durationDays: params.durationDays,
    dailyRevenueLossPct: Math.round(baseDailyLossRate * 100),
    emergencyRepairCostInr: emergencyRepairCost,
    baselineMonthlyRevenue: monthlyRevenue,
    baselineMonthlyExpenses: monthlyOperatingExpenses,
    baselineMonthlyDebt: existingMonthlyDebtObligations,
    baselineDSCR: Math.round(baselineDSCR * 100) / 100,
    stressedDSCR: Math.round(stressedDSCR * 100) / 100,
    baselineCashRunwayMonths: Math.round(baselineCashRunwayMonths * 10) / 10,
    stressedCashRunwayMonths: Math.round(stressedCashRunwayMonths * 10) / 10,
    netCashflowDeficitInr: Math.round(netDeficit),
    insolvencyRisk,
    recoveryTimeMonths,
  };
}

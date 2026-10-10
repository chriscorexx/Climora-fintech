import {
  MSMEProfile,
  ClimateIndicators,
  RiskAssessment,
  RiskCategory,
  DimensionScore,
  MitigationRecommendation,
  IndustryType,
} from '../types';
import { normalizeProfile } from './profileUtils';

/**
 * Climora Transparent Rule-Based Risk Engine
 * FUSION 2026 Hackathon (FIN-05, IFC Guidelines)
 */

const NOMINAL_WEIGHTS = {
  floodExposure: 0.3,
  heavyRainfall: 0.25,
  extremeHeat: 0.2,
  businessVulnerability: 0.15,
  financialResilience: 0.1,
};

/**
 * 1. Flood Exposure Dimension (0 - 100)
 * Evaluates simulated river discharge anomaly, district baseline exposure, and plinth elevation.
 */
function calculateFloodScore(
  climate: ClimateIndicators,
  profile: MSMEProfile,
): { score: number; factors: string[] } {
  const safeProfile = normalizeProfile(profile);
  const factors: string[] = [];
  const baseline = climate.districtBaseline.floodExposureScore; // 0-100
  const riverAnomaly = climate.extremes.riverDischargeAnomalyPct; // 0-100

  // Combine river discharge forecast with district hazard zone
  let rawScore = baseline * 0.55 + riverAnomaly * 0.45;

  if (baseline >= 60) {
    factors.push(
      `District is situated in high-exposure flood basin (World Bank score: ${baseline}/100)`,
    );
  }
  if (riverAnomaly >= 50) {
    factors.push(
      `Simulated river discharge indicates elevated seasonal flow (+${riverAnomaly}% anomaly)`,
    );
  }

  // Structural mitigations reduce the physical vulnerability
  const plinth = safeProfile.operations?.plinthHeightMeters ?? 0.3;
  if (plinth >= 1.0) {
    rawScore = Math.max(10, rawScore - 22);
    factors.push(
      `Elevated ground plinth (+${plinth}m) significantly buffers flood ingress (-22 pts)`,
    );
  } else if (plinth <= 0.2) {
    rawScore = Math.min(100, rawScore + 12);
    factors.push(
      'Ground-level floor (<0.2m) increases flash-flood inundation vulnerability (+12 pts)',
    );
  }

  if (safeProfile.operations?.hasFloodBarriers) {
    rawScore = Math.max(10, rawScore - 15);
    factors.push('Installed flood barriers/sandbag bulkheads reduce direct water entry (-15 pts)');
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  if (factors.length === 0) {
    factors.push('Normal hydrological conditions and moderate terrain clearance');
  }

  return { score: finalScore, factors };
}

/**
 * 2. Heavy Rainfall Dimension (0 - 100)
 * Evaluates 7-day max daily precipitation sum, rain days, and drainage/perishable risks.
 */
function calculateRainfallScore(
  climate: ClimateIndicators,
  profile: MSMEProfile,
): { score: number; factors: string[] } {
  const safeProfile = normalizeProfile(profile);
  const factors: string[] = [];
  const maxRain = climate.extremes.maxDailyPrecipitationMm;
  const rainDays = climate.extremes.precipitationDaysCount;

  // Rating based on Indian Meteorological Department (IMD) rainfall thresholds:
  // <15mm: normal, 15-64mm: moderate/heavy, 65-115mm: very heavy, >115mm: extremely heavy
  let baseRainScore = 15;
  if (maxRain >= 115) {
    baseRainScore = 95;
    factors.push(`Forecast indicates extreme torrential downpour (${maxRain}mm in 24h)`);
  } else if (maxRain >= 65) {
    baseRainScore = 75;
    factors.push(
      `Heavy rainfall spell forecast (${maxRain}mm in 24h) risking localized waterlogging`,
    );
  } else if (maxRain >= 25) {
    baseRainScore = 48;
    factors.push(`Moderate rainfall expected (${maxRain}mm peak)`);
  } else {
    factors.push(`Low precipitation forecast (peak ${maxRain}mm over 7-day horizon)`);
  }

  if (rainDays >= 4) {
    baseRainScore += 10;
    factors.push(
      `Prolonged multi-day precipitation (${rainDays} of 7 days) risks cumulative water buildup`,
    );
  }

  // Sensitivity: transport/logistics dependency
  if (safeProfile.operations?.transportSupplyChainSensitive) {
    baseRainScore += 8;
    factors.push('High reliance on road transport increases risk of supply-chain delay (+8 pts)');
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(baseRainScore)));
  return { score: finalScore, factors };
}

/**
 * 3. Extreme Heat Dimension (0 - 100)
 * Evaluates peak temperatures, consecutive hot days (>= 38°C), cold-storage availability, and heat-sensitive labor.
 */
function calculateHeatScore(
  climate: ClimateIndicators,
  profile: MSMEProfile,
): { score: number; factors: string[] } {
  const safeProfile = normalizeProfile(profile);
  const factors: string[] = [];
  const hotDays = climate.extremes.consecutiveHotDays;
  const maxTemp = Math.max(...climate.forecast7Days.map((d) => d.maxTempC), 32);

  let baseScore = 20;
  if (maxTemp >= 43) {
    baseScore = 90;
    factors.push(
      `Extreme heatwave threshold exceeded (peak ${maxTemp}°C) causing severe labor and cooling stress`,
    );
  } else if (maxTemp >= 39) {
    baseScore = 68;
    factors.push(`High ambient temperature (${maxTemp}°C) with elevated machinery thermal load`);
  } else if (maxTemp >= 35) {
    baseScore = 45;
    factors.push(`Elevated seasonal temperature (${maxTemp}°C)`);
  } else {
    factors.push(
      `Moderate thermal conditions (peak ${maxTemp}°C) within normal operational thresholds`,
    );
  }

  if (hotDays >= 3) {
    baseScore += 12;
    factors.push(
      `${hotDays} consecutive days above 38°C stress worker productivity and cooling grids`,
    );
  }

  // Inventory & operational sensitivities
  if (safeProfile.operations?.perishableInventory) {
    if (!safeProfile.operations?.hasColdStorage) {
      baseScore += 20;
      factors.push(
        'Perishable inventory WITHOUT on-site cold storage exposes business to spoilage (+20 pts)',
      );
    } else if (!safeProfile.operations?.hasBackupGenerator) {
      baseScore += 10;
      factors.push(
        'Cold storage without backup generator risks inventory loss during grid brownouts (+10 pts)',
      );
    } else {
      baseScore -= 10;
      factors.push('Cold storage backed by auxiliary power mitigates heat spoilage (-10 pts)');
    }
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(baseScore)));
  return { score: finalScore, factors };
}

/**
 * 4. Business Operational Vulnerability (0 - 100)
 * Evaluates sector sensitivity, utilities dependence, and supply chain redundancy.
 */
function calculateVulnerabilityScore(profile: MSMEProfile): { score: number; factors: string[] } {
  const safeProfile = normalizeProfile(profile);
  const factors: string[] = [];
  const sectorRisk = getSectorBaselineVulnerability(safeProfile.industry);
  let score = sectorRisk;

  factors.push(
    `${formatIndustry(safeProfile.industry)} baseline climate sensitivity: ${sectorRisk}/100`,
  );

  if (safeProfile.operations?.waterIntensive && !safeProfile.operations?.hasWaterStorageRainwater) {
    score += 15;
    factors.push(
      'Water-intensive operations lack rainwater harvesting or on-site storage buffer (+15 pts)',
    );
  }

  if (
    safeProfile.operations?.electricityGridDependent &&
    !safeProfile.operations?.hasBackupGenerator
  ) {
    score += 12;
    factors.push(
      '100% grid dependence without captive backup power exposes enterprise to climate storm outages (+12 pts)',
    );
  }

  if (!safeProfile.operations?.hasClimateInsurance) {
    score += 8;
    factors.push(
      'Absence of climate/property catastrophe insurance limits external loss recovery (+8 pts)',
    );
  } else {
    score -= 14;
    factors.push('Active commercial insurance cushions asset replacement (-14 pts)');
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(score)));
  return { score: finalScore, factors };
}

/**
 * 5. Financial Resilience Dimension (0 - 100)
 * Evaluates cash runway, Debt Service Coverage Ratio (DSCR), and expense margins.
 * Inverted: Less resilience = HIGHER risk score.
 */
function calculateFinancialResilienceScore(profile: MSMEProfile): {
  score: number;
  factors: string[];
} {
  const safeProfile = normalizeProfile(profile);
  const factors: string[] = [];
  const {
    monthlyRevenue,
    monthlyOperatingExpenses,
    existingMonthlyDebtObligations,
    availableCashReserves,
  } = safeProfile.financials;

  const netOperatingIncome = monthlyRevenue - monthlyOperatingExpenses;
  const dscr =
    existingMonthlyDebtObligations > 0
      ? netOperatingIncome / existingMonthlyDebtObligations
      : netOperatingIncome > 0
        ? 3.0
        : 0.8;

  const cashRunwayMonths =
    monthlyOperatingExpenses > 0 ? availableCashReserves / monthlyOperatingExpenses : 1.0;

  let riskScore = 45;

  // DSCR analysis
  if (dscr >= 2.0) {
    riskScore -= 20;
    factors.push(
      `Robust Debt Service Coverage Ratio (DSCR: ${dscr.toFixed(2)}x) provides strong cushion`,
    );
  } else if (dscr >= 1.25) {
    riskScore -= 8;
    factors.push(
      `Adequate DSCR (${dscr.toFixed(2)}x) comfortably covers current debt amortizations`,
    );
  } else if (dscr >= 1.0) {
    riskScore += 14;
    factors.push(`Tight DSCR (${dscr.toFixed(2)}x) leaves little buffer for revenue contraction`);
  } else {
    riskScore += 35;
    factors.push(
      `Sub-unity DSCR (${dscr.toFixed(2)}x) indicates negative cashflow margin under debt obligations`,
    );
  }

  // Cash runway analysis
  if (cashRunwayMonths >= 3.0) {
    riskScore -= 15;
    factors.push(
      `Healthy cash reserves (${cashRunwayMonths.toFixed(1)} months of operating expenses)`,
    );
  } else if (cashRunwayMonths >= 1.5) {
    factors.push(`Moderate cash buffer (${cashRunwayMonths.toFixed(1)} months of opex)`);
  } else {
    riskScore += 20;
    factors.push(
      `Critical liquidity constraint: only ${cashRunwayMonths.toFixed(1)} months of opex in cash reserves`,
    );
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(riskScore)));
  return { score: finalScore, factors };
}

/**
 * Evaluates sector-specific baseline climate vulnerability
 */
function getSectorBaselineVulnerability(industry: IndustryType): number {
  switch (industry) {
    case 'agriculture_allied':
      return 75;
    case 'food_processing':
      return 62;
    case 'textile_garments':
      return 50;
    case 'chemicals_plastics':
      return 55;
    case 'retail_grocery':
      return 45;
    case 'logistics_warehousing':
      return 58;
    case 'light_manufacturing':
      return 40;
    case 'automotive_repair':
      return 35;
    default:
      return 50;
  }
}

/**
 * Main Assessment Scoring Function
 */
export function assessMSMEClimateRisk(
  profile: MSMEProfile,
  climate: ClimateIndicators,
): RiskAssessment {
  const safeProfile = normalizeProfile(profile);
  const flood = calculateFloodScore(climate, safeProfile);
  const rainfall = calculateRainfallScore(climate, safeProfile);
  const heat = calculateHeatScore(climate, safeProfile);
  const vulnerability = calculateVulnerabilityScore(safeProfile);
  const resilience = calculateFinancialResilienceScore(safeProfile);

  const rawDimensions: Record<
    string,
    { score: number; baseWeight: number; available: boolean; factors: string[] }
  > = {
    floodExposure: {
      score: flood.score,
      baseWeight: NOMINAL_WEIGHTS.floodExposure,
      available: true,
      factors: flood.factors,
    },
    heavyRainfall: {
      score: rainfall.score,
      baseWeight: NOMINAL_WEIGHTS.heavyRainfall,
      available: true,
      factors: rainfall.factors,
    },
    extremeHeat: {
      score: heat.score,
      baseWeight: NOMINAL_WEIGHTS.extremeHeat,
      available: true,
      factors: heat.factors,
    },
    businessVulnerability: {
      score: vulnerability.score,
      baseWeight: NOMINAL_WEIGHTS.businessVulnerability,
      available: true,
      factors: vulnerability.factors,
    },
    financialResilience: {
      score: resilience.score,
      baseWeight: NOMINAL_WEIGHTS.financialResilience,
      available: true,
      factors: resilience.factors,
    },
  };

  // Dynamic proportional reweighting
  let totalAvailableWeight = 0;
  const dataGaps: string[] = [];

  for (const [key, dim] of Object.entries(rawDimensions)) {
    if (dim.available) {
      totalAvailableWeight += dim.baseWeight;
    } else {
      dataGaps.push(
        `Indicator "${key}" data unavailable; excluded from scoring and remaining weights normalized.`,
      );
    }
  }

  const dimensionScores: Record<string, DimensionScore> = {};
  const effectiveWeights: Record<string, number> = {};
  let overallScoreRaw = 0;

  for (const [key, dim] of Object.entries(rawDimensions)) {
    const effWeight =
      dim.available && totalAvailableWeight > 0 ? dim.baseWeight / totalAvailableWeight : 0;
    effectiveWeights[key] = Math.round(effWeight * 100) / 100;

    dimensionScores[key] = {
      score: dim.score,
      baseWeight: dim.baseWeight,
      effectiveWeight: effectiveWeights[key],
      available: dim.available,
      contributingFactors: dim.factors,
    };

    if (dim.available) {
      overallScoreRaw += dim.score * effWeight;
    }
  }

  const overallScore = Math.min(100, Math.max(0, Math.round(overallScoreRaw)));

  // Risk band category
  let riskCategory: RiskCategory = 'low';
  if (overallScore >= 75) riskCategory = 'severe';
  else if (overallScore >= 50) riskCategory = 'high';
  else if (overallScore >= 25) riskCategory = 'moderate';

  // Explainability summary
  const explainabilitySummary: string[] = [
    `Overall climate risk score is ${overallScore}/100 (${riskCategory.toUpperCase()} RISK).`,
    `Highest hazard driver: ${getHighestDriver(dimensionScores)}.`,
  ];

  // Tailored mitigation recommendations
  const mitigationRecommendations = generateMitigations(safeProfile, dimensionScores);

  // Loan underwriting recommendation
  const loanDecisionSupport = generateLoanDecisionSupport(overallScore, riskCategory, safeProfile);

  return {
    id: `asm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    businessId: safeProfile.id,
    timestamp: new Date().toISOString(),
    overallScore,
    riskCategory,
    dimensionScores: dimensionScores as RiskAssessment['dimensionScores'],
    effectiveWeights,
    explainabilitySummary,
    mitigationRecommendations,
    dataGaps,
    loanDecisionSupport,
    provenance: {
      isLive: climate.provenance.isLive,
      provider: climate.provenance.provider,
      timestamp: climate.provenance.retrievedAt,
    },
  };
}

function getHighestDriver(dims: Record<string, DimensionScore>): string {
  let highestKey = '';
  let highestImpact = -1;

  for (const [key, dim] of Object.entries(dims)) {
    const impact = dim.score * dim.effectiveWeight;
    if (impact > highestImpact) {
      highestImpact = impact;
      highestKey = key;
    }
  }

  const names: Record<string, string> = {
    floodExposure: 'Flood Exposure',
    heavyRainfall: 'Heavy Rainfall',
    extremeHeat: 'Extreme Heat',
    businessVulnerability: 'Operational Vulnerability',
    financialResilience: 'Financial Resilience Buffer',
  };
  return `${names[highestKey] || highestKey} (${dims[highestKey]?.score}/100)`;
}

function generateMitigations(
  profile: MSMEProfile,
  dims: Record<string, DimensionScore>,
): MitigationRecommendation[] {
  const safeProfile = normalizeProfile(profile);
  const list: MitigationRecommendation[] = [];

  if ((dims.floodExposure?.score ?? 0) >= 45 && !safeProfile.operations?.hasFloodBarriers) {
    list.push({
      id: 'mit_flood_barriers',
      title: 'Install Removable Flood Barriers & Plinth Elevation',
      category: 'physical_infrastructure',
      estimatedCostInr: 45000,
      riskReductionPts: 14,
      description:
        'Fit aluminum flood barriers at facility entry doors and elevate electrical circuit breakers 1.2m above floor level.',
      priority: 'immediate',
      matchedSchemeId: 'sch_msme_growth',
    });
  }

  if (
    (dims.extremeHeat?.score ?? 0) >= 50 &&
    (!safeProfile.operations?.hasBackupGenerator || !safeProfile.operations?.hasColdStorage)
  ) {
    list.push({
      id: 'mit_rooftop_solar',
      title: 'Adopt Grid-Interactive Rooftop Solar & Battery Backup',
      category: 'energy_water',
      estimatedCostInr: 150000,
      riskReductionPts: 16,
      description:
        'Install 5kW rooftop solar PV with hybrid inverter to secure uninterrupted refrigeration and ventilation during peak heatwaves.',
      priority: 'immediate',
      matchedSchemeId: 'sch_pm_surya_ghar',
    });
  }

  if (safeProfile.operations?.waterIntensive && !safeProfile.operations?.hasWaterStorageRainwater) {
    list.push({
      id: 'mit_rainwater_storage',
      title: 'Construct Rainwater Harvesting & Dual Storage Tank',
      category: 'energy_water',
      estimatedCostInr: 60000,
      riskReductionPts: 10,
      description:
        'Add 10,000L subterranean water buffer to insulate against municipal supply shortages during heatwaves.',
      priority: 'medium_term',
    });
  }

  if (!safeProfile.operations?.hasClimateInsurance) {
    list.push({
      id: 'mit_climate_insurance',
      title: 'Enroll in Parametric MSME Climate & Inundation Cover',
      category: 'financial_buffer',
      estimatedCostInr: 18000,
      riskReductionPts: 12,
      description:
        'Secure insurance with indexed payouts triggered automatically when rainfall exceeds 100mm in 24 hours.',
      priority: 'immediate',
    });
  }

  return list;
}

function generateLoanDecisionSupport(score: number, category: RiskCategory, profile: MSMEProfile) {
  const safeProfile = normalizeProfile(profile);
  const monthlyProfit =
    safeProfile.financials.monthlyRevenue - safeProfile.financials.monthlyOperatingExpenses;
  const maxSafeMonthlyEmi = Math.max(0, monthlyProfit * 0.45);
  const estimatedSafeLoan = Math.round(
    maxSafeMonthlyEmi * (safeProfile.financials.loanTenureMonths || 36),
  );

  if (category === 'low') {
    return {
      recommendedAction: 'proceed' as const,
      suggestedInterestAdjustmentBps: -25, // 25 bps green discount
      suggestedClimateCovenants: [
        'Maintain annual renewal of comprehensive property & storm cover.',
        'Semi-annual verification of water drainage maintenance.',
      ],
      maxSafeLoanAmountInr: estimatedSafeLoan,
    };
  }

  if (category === 'moderate') {
    return {
      recommendedAction: 'proceed_with_covenants' as const,
      suggestedInterestAdjustmentBps: 0,
      suggestedClimateCovenants: [
        'Borrower commits to allocate at least 15% of facility expansion to flood protection or backup power.',
        'Mandatory parametric flood/weather insurance endorsement.',
      ],
      maxSafeLoanAmountInr: Math.round(estimatedSafeLoan * 0.85),
    };
  }

  if (category === 'high') {
    return {
      recommendedAction: 'require_resilience_plan' as const,
      suggestedInterestAdjustmentBps: 50, // +50 bps climate risk premium
      suggestedClimateCovenants: [
        'Disbursement in tranches contingent on completion of plinth elevation or drainage upgrade.',
        'Maintain minimum 2 months opex in liquid cash reserves as climate debt service reserve (DSRA).',
        'Enrollment in CGTMSE or MSME Credit Guarantee scheme to mitigate principal default risk.',
      ],
      maxSafeLoanAmountInr: Math.round(estimatedSafeLoan * 0.65),
    };
  }

  return {
    recommendedAction: 'escalate_review' as const,
    suggestedInterestAdjustmentBps: 125,
    suggestedClimateCovenants: [
      'Credit Committee exceptional approval required.',
      'Mandatory physical on-site civil engineer drainage inspection prior to term sheet issuance.',
      '100% guarantee coverage via government risk-sharing scheme.',
    ],
    maxSafeLoanAmountInr: Math.round(estimatedSafeLoan * 0.45),
  };
}

export function formatIndustry(industry: IndustryType): string {
  return industry
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

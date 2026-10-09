/**
 * Climora Core Domain Type Definitions
 * FUSION 2026 Hackathon (FIN-05: Real-Time Climate Risk Scoring for MSMEs)
 */

export type IndustryType =
  | 'retail_grocery'
  | 'textile_garments'
  | 'light_manufacturing'
  | 'food_processing'
  | 'agriculture_allied'
  | 'automotive_repair'
  | 'logistics_warehousing'
  | 'chemicals_plastics';

export type RiskCategory = 'low' | 'moderate' | 'high' | 'severe';

export type UserRole = 'lender' | 'msme_owner' | 'command_center';

export interface LocationData {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  address?: string;
  districtCode?: string;
}

export interface FinancialIndicators {
  monthlyRevenue: number;
  monthlyOperatingExpenses: number;
  existingMonthlyDebtObligations: number;
  availableCashReserves: number;
  requestedLoanAmount?: number;
  loanTenureMonths?: number;
  annualTurnover?: number;
}

export interface OperationalDependencies {
  electricityGridDependent: boolean;
  hasBackupGenerator: boolean;
  waterIntensive: boolean;
  hasWaterStorageRainwater: boolean;
  perishableInventory: boolean;
  hasColdStorage: boolean;
  transportSupplyChainSensitive: boolean;
  plinthHeightMeters: number; // ground clearance height
  hasFloodBarriers: boolean;
  hasClimateInsurance: boolean;
}

export interface MSMEProfile {
  id: string;
  name: string;
  registrationNumber?: string;
  udyamNumber?: string;
  industry: IndustryType;
  businessSize: 'micro' | 'small' | 'medium';
  businessStage: 'startup' | 'growth' | 'established';
  employeeCount: number;
  location: LocationData;
  financials: FinancialIndicators;
  operations: OperationalDependencies;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherDayForecast {
  date: string;
  maxTempC: number;
  minTempC: number;
  precipitationSumMm: number;
  precipitationProbPct: number;
  maxWindSpeedKmh: number;
  riverDischargeM3s?: number;
}

export interface ClimateIndicators {
  location: {
    latitude: number;
    longitude: number;
    resolvedAddress: string;
  };
  currentConditions: {
    temperatureC: number;
    relativeHumidityPct: number;
    windSpeedKmh: number;
    precipitationMm: number;
    weatherCode: number;
    weatherDescription: string;
  };
  forecast7Days: WeatherDayForecast[];
  extremes: {
    consecutiveHotDays: number; // Days >= 38°C
    maxDailyPrecipitationMm: number;
    precipitationDaysCount: number;
    riverDischargeAnomalyPct: number; // % above normal
  };
  districtBaseline: {
    floodExposureScore: number; // 0-100 historical percentile
    cycloneWindScore: number;
    droughtScore: number;
  };
  provenance: {
    provider: 'Open-Meteo' | 'Sample-Fallback';
    retrievedAt: string;
    isLive: boolean;
    confidenceLevel: 'high' | 'moderate' | 'low';
    attribution: string;
  };
}

export interface DimensionScore {
  score: number; // 0-100
  baseWeight: number; // nominal weight (e.g. 0.30)
  effectiveWeight: number; // after re-weighting missing data
  available: boolean;
  contributingFactors: string[];
}

export interface MitigationRecommendation {
  id: string;
  title: string;
  category: 'physical_infrastructure' | 'financial_buffer' | 'supply_chain' | 'energy_water';
  estimatedCostInr: number;
  riskReductionPts: number;
  description: string;
  priority: 'immediate' | 'medium_term' | 'long_term';
  matchedSchemeId?: string;
  completed?: boolean;
}

export interface RiskAssessment {
  id: string;
  businessId: string;
  timestamp: string;
  overallScore: number; // 0-100
  riskCategory: RiskCategory;
  dimensionScores: {
    floodExposure: DimensionScore;
    heavyRainfall: DimensionScore;
    extremeHeat: DimensionScore;
    businessVulnerability: DimensionScore;
    financialResilience: DimensionScore;
  };
  effectiveWeights: Record<string, number>;
  explainabilitySummary: string[];
  mitigationRecommendations: MitigationRecommendation[];
  dataGaps: string[];
  loanDecisionSupport: {
    recommendedAction: 'proceed' | 'proceed_with_covenants' | 'require_resilience_plan' | 'escalate_review';
    suggestedInterestAdjustmentBps: number; // basis points (+25 bps, -50 bps)
    suggestedClimateCovenants: string[];
    maxSafeLoanAmountInr: number;
  };
  provenance: {
    isLive: boolean;
    provider: string;
    timestamp: string;
  };
}

export interface CashflowScenario {
  scenarioId: string;
  hazardType: 'flash_flood' | 'extreme_heatwave' | 'severe_storm_cyclone' | 'water_shortage';
  hazardLabel: string;
  durationDays: number;
  dailyRevenueLossPct: number;
  emergencyRepairCostInr: number;
  baselineMonthlyRevenue: number;
  baselineMonthlyExpenses: number;
  baselineMonthlyDebt: number;
  baselineDSCR: number;
  stressedDSCR: number;
  baselineCashRunwayMonths: number;
  stressedCashRunwayMonths: number;
  netCashflowDeficitInr: number;
  insolvencyRisk: 'resilient' | 'strained' | 'critical';
  recoveryTimeMonths: number;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  category: 'credit_guarantee' | 'interest_subvention' | 'capital_subsidy' | 'green_technology' | 'emergency_relief';
  governmentLevel: 'central' | 'state';
  sponsoringAuthority: string;
  eligibleStates: string[];
  eligibleIndustries: IndustryType[];
  eligibleSizes: Array<'micro' | 'small' | 'medium'>;
  eligibilityCriteria: string[];
  supportType: string;
  maxBenefitSummary: string;
  requiredDocuments: string[];
  officialSourceUrl: string;
  matchingScore: number; // 0-100 relevance score
  isEligible: boolean;
  matchReasons: string[];
}

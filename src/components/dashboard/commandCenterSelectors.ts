import {
  ClimateIndicators,
  DimensionScore,
  MitigationRecommendation,
  MSMEProfile,
  RiskAssessment,
  WeatherDayForecast,
} from '../../types';

export type DimensionKey = keyof RiskAssessment['dimensionScores'];
export type DimensionAccent = 'neutral' | 'amber' | 'emerald';

export interface DimensionSpec {
  key: DimensionKey;
  label: string;
  hint: string;
  accent: DimensionAccent;
}

export const COMMAND_CENTER_DIMENSIONS: DimensionSpec[] = [
  {
    key: 'floodExposure',
    label: 'Flood Exposure',
    hint: 'River discharge + plinth elevation',
    accent: 'neutral',
  },
  {
    key: 'heavyRainfall',
    label: 'Heavy Rainfall',
    hint: '7-day precipitation forecast',
    accent: 'neutral',
  },
  {
    key: 'extremeHeat',
    label: 'Extreme Heat',
    hint: 'Hot days + cooling dependency',
    accent: 'amber',
  },
  {
    key: 'businessVulnerability',
    label: 'Operational Vulnerability',
    hint: 'Grid & water dependencies',
    accent: 'neutral',
  },
  {
    key: 'financialResilience',
    label: 'Financial Resilience',
    hint: 'Inverted risk (higher is safer)',
    accent: 'emerald',
  },
];

export interface DimensionSummary extends DimensionSpec {
  score: number;
  effectiveWeight: number;
  available: boolean;
  primaryFactor: string;
  level: 'low' | 'moderate' | 'high' | 'severe';
}

export type ForecastHazard = 'none' | 'rain' | 'heat';

export interface ForecastPoint {
  isoDate: string;
  day: string;
  maxTempC: number;
  minTempC: number;
  precipitationSumMm: number;
  precipitationProbPct: number;
  maxWindSpeedKmh: number;
  hazard: ForecastHazard;
}

export interface AdaptationProgress {
  completed: number;
  total: number;
  pct: number;
  riskPointsSecured: number;
  riskPointsRemaining: number;
}

export interface ChartPalette {
  grid: string;
  axis: string;
  tempHigh: string;
  tempLow: string;
  rain: string;
  accent: string;
  tooltipBg: string;
  tooltipBorder: string;
}

export const LIGHT_CHART_PALETTE: ChartPalette = {
  grid: '#E5E5E5',
  axis: '#737373',
  tempHigh: '#EA580C',
  tempLow: '#0A0A0A',
  rain: '#404040',
  accent: '#059669',
  tooltipBg: '#FFFFFF',
  tooltipBorder: '#E5E5E5',
};

export const DARK_CHART_PALETTE: ChartPalette = {
  grid: '#262626',
  axis: '#A3A3A3',
  tempHigh: '#FB923C',
  tempLow: '#FAFAFA',
  rain: '#737373',
  accent: '#10B981',
  tooltipBg: '#0A0A0A',
  tooltipBorder: '#262626',
};

export function severityLevel(score: number): DimensionSummary['level'] {
  if (score >= 75) return 'severe';
  if (score >= 50) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

export function summarizeDimensions(assessment: RiskAssessment): DimensionSummary[] {
  const scores = assessment?.dimensionScores;
  return COMMAND_CENTER_DIMENSIONS.map((spec) => {
    const dimension: DimensionScore | undefined = scores?.[spec.key];
    const score = Number(dimension?.score ?? 0);
    return {
      ...spec,
      score,
      effectiveWeight: Number(dimension?.effectiveWeight ?? 0),
      available: Boolean(dimension?.available),
      primaryFactor: dimension?.contributingFactors?.[0] ?? 'No contributing factors reported.',
      level: severityLevel(score),
    };
  });
}

export function getPeakExposure(assessment: RiskAssessment): { label: string; score: number } {
  const summaries = summarizeDimensions(assessment).filter((d) => d.key !== 'financialResilience');
  const peak = summaries.reduce(
    (worst, current) => (current.score > worst.score ? current : worst),
    summaries[0] ?? { label: 'No Exposure', score: 0 },
  );
  return { label: peak.label, score: peak.score };
}

function formatDay(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString([], { weekday: 'short' });
}

export function buildForecastSeries(
  climate: ClimateIndicators | null | undefined,
  days = 7,
): ForecastPoint[] {
  const forecast: WeatherDayForecast[] = climate?.forecast7Days ?? [];
  return forecast.slice(0, Math.max(0, days)).map((day) => {
    const maxTempC = Number(day.maxTempC ?? 0);
    const precipitationSumMm = Number(day.precipitationSumMm ?? 0);
    return {
      isoDate: day.date,
      day: formatDay(day.date),
      maxTempC,
      minTempC: Number(day.minTempC ?? 0),
      precipitationSumMm,
      precipitationProbPct: Number(day.precipitationProbPct ?? 0),
      maxWindSpeedKmh: Number(day.maxWindSpeedKmh ?? 0),
      hazard: maxTempC >= 38 ? 'heat' : precipitationSumMm > 5 ? 'rain' : 'none',
    };
  });
}

export function computeAdaptationProgress(
  recommendations: MitigationRecommendation[] | undefined,
  completedActionIds: string[] | undefined,
): AdaptationProgress {
  const items = recommendations ?? [];
  const completed = new Set(completedActionIds ?? []);
  const done = items.filter((item) => completed.has(item.id));
  const riskPointsSecured = done.reduce((sum, item) => sum + Number(item.riskReductionPts ?? 0), 0);
  const riskPointsTotal = items.reduce((sum, item) => sum + Number(item.riskReductionPts ?? 0), 0);
  return {
    completed: done.length,
    total: items.length,
    pct: items.length === 0 ? 0 : Math.round((done.length / items.length) * 100),
    riskPointsSecured,
    riskPointsRemaining: Math.max(0, riskPointsTotal - riskPointsSecured),
  };
}

export function formatInrLakhs(value: number | undefined): string {
  const safe = Number(value ?? 0) / 100000;
  return `₹${safe.toFixed(2)} L`;
}

export function formatInrCrore(value: number | undefined): string {
  const safe = Number(value ?? 0) / 10000000;
  return `₹${safe.toFixed(2)} Cr`;
}

export function resolveChartPalette(theme: 'light' | 'dark'): ChartPalette {
  return theme === 'dark' ? DARK_CHART_PALETTE : LIGHT_CHART_PALETTE;
}

export interface PortfolioRow {
  profile: MSMEProfile;
  dscr: number;
  exposureInr: number;
  requiresCovenants: boolean;
}

export function buildPortfolioRows(profiles: MSMEProfile[] | undefined): PortfolioRow[] {
  return (profiles ?? []).map((profile) => {
    const financials = profile.financials;
    const revenue = Number(financials?.monthlyRevenue ?? 0);
    const expenses = Number(financials?.monthlyOperatingExpenses ?? 0);
    const debt = Number(financials?.existingMonthlyDebtObligations ?? 0);
    const dscr = debt > 0 ? (revenue - expenses) / debt : 3.5;
    const plinth = Number(profile.operations?.plinthHeightMeters ?? 0.3);
    const opexRatio = revenue > 0 ? expenses / revenue : 1;
    return {
      profile,
      dscr,
      exposureInr: Number(financials?.requestedLoanAmount ?? 2000000),
      requiresCovenants: plinth < 0.3 || opexRatio > 0.85,
    };
  });
}

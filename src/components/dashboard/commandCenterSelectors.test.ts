import { describe, it, expect } from 'vitest';
import {
  COMMAND_CENTER_DIMENSIONS,
  DARK_CHART_PALETTE,
  LIGHT_CHART_PALETTE,
  buildForecastSeries,
  buildPortfolioRows,
  computeAdaptationProgress,
  formatInrCrore,
  formatInrLakhs,
  getPeakExposure,
  resolveChartPalette,
  severityLevel,
  summarizeDimensions,
} from './commandCenterSelectors';
import { assessMSMEClimateRisk } from '../../core/riskEngine';
import { getFallbackIndicators } from '../../core/weatherService';
import { SAMPLE_MSME_PROFILES } from '../../core/sampleData';
import { MSMEProfile } from '../../types';

const profile = SAMPLE_MSME_PROFILES[0];
const climate = getFallbackIndicators(
  profile.location.latitude,
  profile.location.longitude,
  profile.location.city,
);
const assessment = assessMSMEClimateRisk(profile, climate);

describe('Command Center selectors', () => {
  it('summarizes the five transparent risk dimensions in stable order', () => {
    const summaries = summarizeDimensions(assessment);

    expect(summaries).toHaveLength(5);
    expect(summaries.map((s) => s.key)).toEqual([
      'floodExposure',
      'heavyRainfall',
      'extremeHeat',
      'businessVulnerability',
      'financialResilience',
    ]);
    summaries.forEach((summary) => {
      expect(summary.score).toBeGreaterThanOrEqual(0);
      expect(summary.score).toBeLessThanOrEqual(100);
      expect(summary.primaryFactor.length).toBeGreaterThan(0);
    });
    expect(summaries.filter((s) => s.available).length).toBe(5);
  });

  it('maps every dimension spec to an accent colour that is never blue-shaded', () => {
    const accents = new Set(COMMAND_CENTER_DIMENSIONS.map((d) => d.accent));
    expect(accents.has('neutral')).toBe(true);
    expect(accents.has('amber')).toBe(true);
    expect(accents.has('emerald')).toBe(true);
    accents.forEach((accent) => expect(['neutral', 'amber', 'emerald']).toContain(accent));
  });

  it('classifies severity bands monotonically', () => {
    expect(severityLevel(0)).toBe('low');
    expect(severityLevel(24)).toBe('low');
    expect(severityLevel(25)).toBe('moderate');
    expect(severityLevel(49)).toBe('moderate');
    expect(severityLevel(50)).toBe('high');
    expect(severityLevel(74)).toBe('high');
    expect(severityLevel(75)).toBe('severe');
    expect(severityLevel(100)).toBe('severe');
  });

  it('reports the dominant hazard excluding the inverted resilience dimension', () => {
    const peak = getPeakExposure(assessment);
    expect(peak.label).not.toBe('Financial Resilience');
    expect(peak.score).toBeGreaterThanOrEqual(0);
    expect(peak.score).toBeLessThanOrEqual(100);
  });

  it('builds a seven point forecast series with hazard classification', () => {
    const series = buildForecastSeries(climate, 7);

    expect(series).toHaveLength(7);
    series.forEach((point) => {
      expect(point.day.length).toBeGreaterThan(0);
      expect(point.hazard === 'heat' ? point.maxTempC >= 38 : true).toBe(true);
      expect(point.hazard === 'rain' ? point.precipitationSumMm > 5 : true).toBe(true);
    });
  });

  it('tolerates missing climate data', () => {
    expect(buildForecastSeries(null)).toEqual([]);
    expect(buildForecastSeries(undefined, 3)).toEqual([]);
  });

  it('computes adaptation roadmap completion state and residual risk points', () => {
    const recommendations = assessment.mitigationRecommendations;
    const firstId = recommendations[0].id;

    expect(computeAdaptationProgress(recommendations, [])).toEqual({
      completed: 0,
      total: recommendations.length,
      pct: 0,
      riskPointsSecured: 0,
      riskPointsRemaining: recommendations.reduce((sum, r) => sum + r.riskReductionPts, 0),
    });

    const partial = computeAdaptationProgress(recommendations, [firstId]);
    expect(partial.completed).toBe(1);
    expect(partial.riskPointsSecured).toBe(recommendations[0].riskReductionPts);

    const full = computeAdaptationProgress(
      recommendations,
      recommendations.map((r) => r.id),
    );
    expect(full.pct).toBe(100);
    expect(full.riskPointsRemaining).toBe(0);

    expect(computeAdaptationProgress([], [])).toEqual({
      completed: 0,
      total: 0,
      pct: 0,
      riskPointsSecured: 0,
      riskPointsRemaining: 0,
    });
  });

  it('formats INR exposure into lakhs and crores', () => {
    expect(formatInrLakhs(2500000)).toBe('₹25.00 L');
    expect(formatInrCrore(25000000)).toBe('₹2.50 Cr');
    expect(formatInrLakhs(undefined)).toBe('₹0.00 L');
  });

  it('resolves theme aware chart palettes that contain zero blue-tinted values', () => {
    expect(resolveChartPalette('dark')).toBe(DARK_CHART_PALETTE);
    expect(resolveChartPalette('light')).toBe(LIGHT_CHART_PALETTE);

    const palettes = [LIGHT_CHART_PALETTE, DARK_CHART_PALETTE];
    palettes.forEach((palette) => {
      Object.entries(palette).forEach(([token, hex]) => {
        expect(hex).toMatch(/^#[0-9A-F]{6}$/i);
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
        const isBlueTinted = b > g && b >= r;
        expect(isBlueTinted, `${token} resolved to blue-tinted ${hex}`).toBe(false);
      });
    });
  });

  it('ranks portfolio rows with DSCR and covenant flags', () => {
    const risky: MSMEProfile = {
      ...profile,
      id: 'msme_risky',
      operations: { ...profile.operations, plinthHeightMeters: 0.1 },
      financials: {
        ...profile.financials,
        monthlyRevenue: 1000000,
        monthlyOperatingExpenses: 950000,
        existingMonthlyDebtObligations: 200000,
      },
    };

    const rows = buildPortfolioRows([profile, risky]);
    expect(rows).toHaveLength(2);
    expect(rows[0].requiresCovenants).toBe(false);
    expect(rows[1].requiresCovenants).toBe(true);
    expect(rows[1].dscr).toBeLessThan(rows[0].dscr);
    expect(rows[0].exposureInr).toBeGreaterThan(0);

    expect(buildPortfolioRows(undefined)).toEqual([]);
  });
});

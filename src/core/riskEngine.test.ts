import { describe, it, expect } from 'vitest';
import { assessMSMEClimateRisk } from './riskEngine';
import { simulateCashflowStress } from './scenarioSimulator';
import { matchSchemesForProfile } from './schemeMatcher';
import { getFallbackIndicators } from './weatherService';
import { SAMPLE_MSME_PROFILES } from './sampleData';

describe('Climora TypeScript Domain Engines', () => {
  const profile = SAMPLE_MSME_PROFILES[0]; // Sahyadri Agro-Food Processors
  const climate = getFallbackIndicators(profile.location.latitude, profile.location.longitude, profile.location.city);

  it('computes transparent 5-dimension risk score between 0 and 100', () => {
    const assessment = assessMSMEClimateRisk(profile, climate);

    expect(assessment.overallScore).toBeGreaterThanOrEqual(0);
    expect(assessment.overallScore).toBeLessThanOrEqual(100);
    expect(['low', 'moderate', 'high', 'severe']).toContain(assessment.riskCategory);

    // Weights must sum to 1.0 (100%)
    const totalWeight = Object.values(assessment.effectiveWeights).reduce((a, b) => a + b, 0);
    expect(Math.round(totalWeight)).toBe(1);

    // Loan decision support must be generated
    expect(assessment.loanDecisionSupport.maxSafeLoanAmountInr).toBeGreaterThan(0);
    expect(assessment.loanDecisionSupport.suggestedClimateCovenants.length).toBeGreaterThan(0);
  });

  it('demonstrates that elevated plinth reduces flood score', () => {
    const lowPlinthProfile = {
      ...profile,
      operations: { ...profile.operations, plinthHeightMeters: 0.1, hasFloodBarriers: false },
    };
    const highPlinthProfile = {
      ...profile,
      operations: { ...profile.operations, plinthHeightMeters: 1.5, hasFloodBarriers: true },
    };

    const lowPlinthScore = assessMSMEClimateRisk(lowPlinthProfile, climate);
    const highPlinthScore = assessMSMEClimateRisk(highPlinthProfile, climate);

    expect(highPlinthScore.dimensionScores.floodExposure.score).toBeLessThan(
      lowPlinthScore.dimensionScores.floodExposure.score
    );
  });

  it('simulates cashflow stress and deteriorates DSCR under flash flood shock', () => {
    const scenario = simulateCashflowStress(profile, {
      hazardType: 'flash_flood',
      durationDays: 10,
      intensityPct: 80,
      facilityInundation: true,
      powerGridOutageDays: 3,
    });

    expect(scenario.baselineDSCR).toBeGreaterThan(scenario.stressedDSCR);
    expect(scenario.netCashflowDeficitInr).toBeGreaterThan(0);
    expect(['resilient', 'strained', 'critical']).toContain(scenario.insolvencyRisk);
  });

  it('matches eligible government schemes for food processing MSME in Maharashtra', () => {
    const matched = matchSchemesForProfile(profile, 60, 55);

    expect(matched.length).toBeGreaterThan(0);
    const topScheme = matched[0];
    expect(topScheme.matchingScore).toBeGreaterThanOrEqual(50);

    // PM Surya Ghar should match heat exposure
    const solarScheme = matched.find((s) => s.id === 'sch_pm_surya_ghar');
    expect(solarScheme).toBeDefined();
    expect(solarScheme?.isEligible).toBe(true);
  });
});

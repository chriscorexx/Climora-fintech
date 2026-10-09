import { describe, it, expect } from 'vitest';
import {
  calculateRiskScore,
  getRiskCategory,
  getBusinessVulnerability,
  getFinancialVulnerability,
  validateDimensionInputs,
  isValidDimensionValue,
  getMissingDataStrategy,
} from './riskEngine.js';

describe('getRiskCategory', () => {
  it('returns Low for scores 0-24', () => {
    expect(getRiskCategory(0).label).toBe('Low');
    expect(getRiskCategory(15).label).toBe('Low');
    expect(getRiskCategory(24).label).toBe('Low');
  });

  it('returns Moderate for scores 25-49', () => {
    expect(getRiskCategory(25).label).toBe('Moderate');
    expect(getRiskCategory(40).label).toBe('Moderate');
    expect(getRiskCategory(49).label).toBe('Moderate');
  });

  it('returns High for scores 50-74', () => {
    expect(getRiskCategory(50).label).toBe('High');
    expect(getRiskCategory(68).label).toBe('High');
    expect(getRiskCategory(74).label).toBe('High');
  });

  it('returns Very High for scores 75-100', () => {
    expect(getRiskCategory(75).label).toBe('Very High');
    expect(getRiskCategory(90).label).toBe('Very High');
    expect(getRiskCategory(100).label).toBe('Very High');
  });
});

describe('calculateRiskScore', () => {
  it('calculates weighted score with all dimensions present', () => {
    const result = calculateRiskScore({
      flood: 80,
      rainfall: 60,
      heat: 40,
      business: 20,
      financial: 15,
    });
    // 80*0.30 + 60*0.25 + 40*0.20 + 20*0.15 + 15*0.10 = 24+15+8+3+1.5 = 51.5 -> 52
    expect(result.overallScore).toBe(52);
    expect(result.category).toBe('High');
    expect(result.isIncomplete).toBe(false);
    expect(result.missingDimensions).toHaveLength(0);
  });

  it('flags incomplete when dimensions are missing', () => {
    const result = calculateRiskScore({
      flood: 80,
      rainfall: null,
      heat: 40,
      business: null,
      financial: null,
    });
    expect(result.isIncomplete).toBe(true);
    expect(result.missingDimensions).toContain('rainfall');
    expect(result.missingDimensions).toContain('business');
    expect(result.missingDimensions).toContain('financial');
    expect(result.dimensionScores.rainfall).toBeNull();
  });

  it('uses proportional reweighting when dimensions are missing', () => {
    const result = calculateRiskScore({
      flood: 80,
      rainfall: null,
      heat: 40,
      business: null,
      financial: null,
    });
    // Active weight sum: flood(0.30) + heat(0.20) = 0.50
    // totalWeighted: 80*0.30 + 40*0.20 = 24 + 8 = 32
    // overallScore = 32 / 0.50 = 64
    expect(result.overallScore).toBe(64);
    expect(result.effectiveWeights.flood).toBeCloseTo(0.6, 2);
    expect(result.effectiveWeights.heat).toBeCloseTo(0.4, 2);
  });

  it('returns score 0 when all dimensions are missing', () => {
    const result = calculateRiskScore({
      flood: null,
      rainfall: null,
      heat: null,
      business: null,
      financial: null,
    });
    expect(result.overallScore).toBe(0);
    expect(result.isIncomplete).toBe(true);
    expect(result.activeWeightSum).toBe(0);
  });

  it('clamps dimension values to 0-100 range', () => {
    const result = calculateRiskScore({
      flood: 150,
      rainfall: -20,
      heat: 40,
      business: 20,
      financial: 15,
    });
    // Clamped: flood=100, rainfall=0
    // 100*0.30 + 0*0.25 + 40*0.20 + 20*0.15 + 15*0.10 = 30+0+8+3+1.5 = 42.5 -> 43
    expect(result.overallScore).toBe(43);
    expect(result.dimensionScores.flood).toBe(100);
    expect(result.dimensionScores.rainfall).toBe(0);
  });

  it('matches demo business scores', () => {
    const greenValley = { flood: 85, rainfall: 45, heat: 62, business: 15, financial: 28 };
    const result = calculateRiskScore(greenValley);
    // 85*0.30 + 45*0.25 + 62*0.20 + 15*0.15 + 28*0.10 = 25.5+11.25+12.4+2.25+2.8 = 54.2 -> 54
    expect(result.overallScore).toBe(54);
  });

  it('correctly categorizes low-risk business', () => {
    const techSolutions = { flood: 12, rainfall: 25, heat: 30, business: 8, financial: 12 };
    const result = calculateRiskScore(techSolutions);
    // 12*0.30 + 25*0.25 + 30*0.20 + 8*0.15 + 12*0.10 = 3.6+6.25+6+1.2+1.2 = 18.25 -> 18
    expect(result.overallScore).toBe(18);
    expect(result.category).toBe('Low');
  });
});

describe('getBusinessVulnerability', () => {
  it('returns base vulnerability for known sectors', () => {
    expect(getBusinessVulnerability('retail')).toBe(12);
    expect(getBusinessVulnerability('agriculture')).toBe(25);
    expect(getBusinessVulnerability('services')).toBe(8);
  });

  it('returns default value 15 for unknown sectors', () => {
    expect(getBusinessVulnerability('unknown_sector')).toBe(15);
    expect(getBusinessVulnerability(null)).toBe(15);
  });
});

describe('getFinancialVulnerability', () => {
  it('returns null for missing revenue', () => {
    expect(getFinancialVulnerability(null, 1000)).toBeNull();
    expect(getFinancialVulnerability(undefined, 1000)).toBeNull();
    expect(getFinancialVulnerability(0, 1000)).toBeNull();
  });

  it('returns null for missing expenses', () => {
    expect(getFinancialVulnerability(1000, null)).toBeNull();
    expect(getFinancialVulnerability(1000, undefined)).toBeNull();
  });

  it('calculates score based on expense ratio', () => {
    expect(getFinancialVulnerability(1000000, 950000)).toBe(90); // 95%
    expect(getFinancialVulnerability(1000000, 850000)).toBe(70); // 85%
    expect(getFinancialVulnerability(1000000, 750000)).toBe(50); // 75%
    expect(getFinancialVulnerability(1000000, 650000)).toBe(30); // 65%
    expect(getFinancialVulnerability(1000000, 500000)).toBe(15);  // 50%
  });
});

describe('isValidDimensionValue', () => {
  it('returns true for null/undefined (optional)', () => {
    expect(isValidDimensionValue(null)).toBe(true);
    expect(isValidDimensionValue(undefined)).toBe(true);
  });

  it('returns true for valid numbers in range', () => {
    expect(isValidDimensionValue(0)).toBe(true);
    expect(isValidDimensionValue(50)).toBe(true);
    expect(isValidDimensionValue(100)).toBe(true);
  });

  it('returns false for out of range numbers', () => {
    expect(isValidDimensionValue(-1)).toBe(false);
    expect(isValidDimensionValue(101)).toBe(false);
    expect(isValidDimensionValue(150)).toBe(false);
  });

  it('returns false for non-numbers', () => {
    expect(isValidDimensionValue('50')).toBe(false);
    expect(isValidDimensionValue(true)).toBe(false);
    expect(isValidDimensionValue({})).toBe(false);
  });
});

describe('validateDimensionInputs', () => {
  it('returns valid=true for all-valid inputs', () => {
    const result = validateDimensionInputs({
      flood: 50,
      rainfall: 60,
      heat: 40,
      business: 20,
      financial: 10,
    });
    expect(result.valid).toBe(true);
    expect(result.invalidFields).toHaveLength(0);
  });

  it('returns invalid for out-of-range values', () => {
    const result = validateDimensionInputs({
      flood: 150,
      rainfall: 60,
      heat: -5,
      business: 20,
      financial: 10,
    });
    expect(result.valid).toBe(false);
    expect(result.invalidFields).toContain('flood');
    expect(result.invalidFields).toContain('heat');
  });

  it('returns valid=true for all-null inputs', () => {
    const result = validateDimensionInputs({
      flood: null,
      rainfall: null,
      heat: null,
      business: null,
      financial: null,
    });
    expect(result.valid).toBe(true);
  });
});

describe('getMissingDataStrategy', () => {
  it('returns a non-empty strategy description', () => {
    const strategy = getMissingDataStrategy();
    expect(strategy).toMatch(/propor|reweight|excluded/);
    expect(strategy.length).toBeGreaterThan(20);
  });
});

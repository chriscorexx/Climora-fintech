import { describe, it, expect } from 'vitest';
import {
  buildPipelineCsv,
  buildPortfolioAssessments,
  computeDscr,
  countByCategory,
  filterPortfolioByCategory,
  mergeProfiles,
  searchPortfolio,
} from './portfolio';
import { SAMPLE_MSME_PROFILES } from './sampleData';
import { MSMEProfile } from '../types';

const profiles = SAMPLE_MSME_PROFILES.slice(0, 4);

describe('Portfolio aggregation', () => {
  it('computes DSCR from monthly net operating income and debt obligations', () => {
    expect(computeDscr(profiles[0])).toBeCloseTo((1450000 - 1120000) / 125000, 5);
  });

  it('computes a fallback DSCR when there are no debt obligations', () => {
    const profile: MSMEProfile = {
      ...profiles[0],
      id: 'msme_nodebt',
      financials: { ...profiles[0].financials, existingMonthlyDebtObligations: 0 },
    };
    expect(computeDscr(profile)).toBe(3.5);
  });

  it('assesses every profile in the portfolio with fallback climate data', () => {
    const rows = buildPortfolioAssessments(profiles);

    expect(rows).toHaveLength(profiles.length);
    rows.forEach((row) => {
      expect(row.score).toBeGreaterThanOrEqual(0);
      expect(row.score).toBeLessThanOrEqual(100);
      expect(['low', 'moderate', 'high', 'severe']).toContain(row.riskCategory);
      expect(row.exposureInr).toBeGreaterThan(0);
      expect(typeof row.requiresCovenants).toBe('boolean');
    });
    expect(buildPortfolioAssessments(undefined)).toEqual([]);
  });

  it('filters the pipeline by risk category and reports per-category counts', () => {
    const rows = buildPortfolioAssessments(profiles);
    const filtered = filterPortfolioByCategory(rows, 'moderate');

    expect(filtered.every((row) => row.riskCategory === 'moderate')).toBe(true);
    expect(filtered).toHaveLength(countByCategory(rows, 'moderate'));

    const total = (['low', 'moderate', 'high', 'severe'] as const)
      .map((filter) => countByCategory(rows, filter))
      .reduce((sum, count) => sum + count, 0);
    expect(total).toBe(rows.length);
    expect(countByCategory(rows, 'all')).toBe(rows.length);
  });

  it('searches by enterprise name, city, and industry', () => {
    const rows = buildPortfolioAssessments(profiles);

    expect(searchPortfolio(rows, '')).toHaveLength(rows.length);
    expect(searchPortfolio(rows, 'nonexistent-enterprise')).toHaveLength(0);

    const byCity = searchPortfolio(rows, profiles[1].location.city);
    expect(byCity).toHaveLength(1);
    expect(byCity[0].profile.id).toBe(profiles[1].id);
  });

  it('builds a CSV export with escaped values and a header row', () => {
    const rows = buildPortfolioAssessments([{ ...profiles[0], name: 'Agro, Seeds & "Grains"' }]);
    const csv = buildPipelineCsv(rows);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      'Enterprise,Industry,City,State,Loan Requested (INR),DSCR,Risk Score,Risk Category,Requires Covenants',
    );
    expect(lines[1]).toContain('"Agro, Seeds & ""Grains"""');
    expect(lines[1]).toContain(profiles[0].location.city);
  });

  it('merges remote and local profiles, preserving owner-stamped local entries', () => {
    const remote = SAMPLE_MSME_PROFILES.slice(0, 2);
    const ownedLocal: MSMEProfile = {
      ...profiles[0],
      ownerId: 'user_1',
      ownerEmail: 'owner@climora.in',
    };
    const localOnly: MSMEProfile = { ...profiles[2], id: 'msme_local_only' };

    const merged = mergeProfiles(remote, [ownedLocal, localOnly]);

    expect(merged.map((p) => p.id)).toEqual([profiles[0].id, profiles[1].id, 'msme_local_only']);
    expect(merged[0].ownerId).toBe('user_1');
    expect(merged[0].ownerEmail).toBe('owner@climora.in');
    expect(merged[2].ownerId).toBeUndefined();
    expect(mergeProfiles(undefined, undefined)).toEqual([]);
  });
});

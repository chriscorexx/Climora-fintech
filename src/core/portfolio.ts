import { MSMEProfile, RiskCategory } from '../types';
import { assessMSMEClimateRisk } from './riskEngine';
import { getFallbackIndicators } from './weatherService';
import { normalizeProfile } from './profileUtils';

export type PortfolioRiskFilter = 'all' | RiskCategory;

export interface PortfolioAssessmentRow {
  profile: MSMEProfile;
  score: number;
  riskCategory: RiskCategory;
  dscr: number;
  exposureInr: number;
  requiresCovenants: boolean;
}

export function computeDscr(profile: MSMEProfile): number {
  const financials = normalizeProfile(profile).financials;
  const netOperatingIncome = financials.monthlyRevenue - financials.monthlyOperatingExpenses;
  return financials.existingMonthlyDebtObligations > 0
    ? netOperatingIncome / financials.existingMonthlyDebtObligations
    : 3.5;
}

export function assessProfileWithFallback(profile: MSMEProfile): {
  score: number;
  riskCategory: RiskCategory;
} {
  const safeProfile = normalizeProfile(profile);
  const climate = getFallbackIndicators(
    safeProfile.location.latitude,
    safeProfile.location.longitude,
    safeProfile.location.city,
  );
  const assessment = assessMSMEClimateRisk(safeProfile, climate);
  return { score: assessment.overallScore, riskCategory: assessment.riskCategory };
}

export function buildPortfolioAssessments(
  profiles: MSMEProfile[] | undefined,
): PortfolioAssessmentRow[] {
  return (profiles ?? []).map((rawProfile) => {
    const profile = normalizeProfile(rawProfile);
    const { score, riskCategory } = assessProfileWithFallback(profile);
    const revenue = profile.financials.monthlyRevenue;
    const expenses = profile.financials.monthlyOperatingExpenses;
    const plinth = profile.operations?.plinthHeightMeters ?? 0.3;
    const opexRatio = revenue > 0 ? expenses / revenue : 1;
    return {
      profile,
      score,
      riskCategory,
      dscr: computeDscr(profile),
      exposureInr: profile.financials.requestedLoanAmount || 2000000,
      requiresCovenants: plinth < 0.3 || opexRatio > 0.85,
    };
  });
}

export function filterPortfolioByCategory(
  rows: PortfolioAssessmentRow[],
  filter: PortfolioRiskFilter,
): PortfolioAssessmentRow[] {
  if (filter === 'all') return rows;
  return rows.filter((row) => row.riskCategory === filter);
}

export function searchPortfolio(
  rows: PortfolioAssessmentRow[],
  term: string,
): PortfolioAssessmentRow[] {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return rows;
  return rows.filter(
    (row) =>
      row.profile.name.toLowerCase().includes(normalized) ||
      row.profile.location.city.toLowerCase().includes(normalized) ||
      row.profile.industry.toLowerCase().includes(normalized),
  );
}

export function countByCategory(
  rows: PortfolioAssessmentRow[],
  filter: PortfolioRiskFilter,
): number {
  return filterPortfolioByCategory(rows, filter).length;
}

function escapeCsvValue(value: string | number): string {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function buildPipelineCsv(rows: PortfolioAssessmentRow[]): string {
  const headers = [
    'Enterprise',
    'Industry',
    'City',
    'State',
    'Loan Requested (INR)',
    'DSCR',
    'Risk Score',
    'Risk Category',
    'Requires Covenants',
  ];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.profile.name,
        row.profile.industry,
        row.profile.location.city,
        row.profile.location.state,
        row.exposureInr,
        row.dscr.toFixed(2),
        row.score,
        row.riskCategory,
        row.requiresCovenants ? 'yes' : 'no',
      ]
        .map(escapeCsvValue)
        .join(','),
    );
  }
  return lines.join('\n');
}

export function mergeProfiles(
  remoteProfiles: MSMEProfile[] | undefined,
  localProfiles: MSMEProfile[] | undefined,
): MSMEProfile[] {
  const merged = new Map<string, MSMEProfile>();
  for (const raw of remoteProfiles ?? []) {
    const profile = normalizeProfile(raw);
    merged.set(profile.id, profile);
  }
  for (const raw of localProfiles ?? []) {
    const profile = normalizeProfile(raw);
    const existing = merged.get(profile.id);
    if (!existing) {
      merged.set(profile.id, profile);
      continue;
    }
    const stamped = existing.ownerId || existing.ownerEmail ? existing : profile;
    merged.set(profile.id, normalizeProfile(stamped));
  }
  return Array.from(merged.values());
}

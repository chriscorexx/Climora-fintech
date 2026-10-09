/**
 * Shared mapping and formatting helpers for backend payloads.
 * Keeps the screens free of shape-translation logic.
 */

import { riskCategories } from '../data/demoData.js';

/** Backend category label -> CSS custom property used by the design system. */
const CATEGORY_COLOR = {
  Low: 'var(--color-low)',
  Moderate: 'var(--color-moderate)',
  High: 'var(--color-high)',
  'Very High': 'var(--color-very-high)',
};

export function categoryColor(category) {
  return CATEGORY_COLOR[category] || 'var(--color-text-tertiary)';
}

export function categoryKey(category) {
  const match = riskCategories[String(category || '').toLowerCase().replace(/\s+/g, '')];
  return match ? match.key : String(category || '').toLowerCase();
}

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const PLAIN = new Intl.NumberFormat('en-IN');

/** Compact money for tight UI slots (cards, table cells). */
export function formatMoney(value, { compact = false } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  if (compact) {
    if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(n % 1e7 === 0 ? 0 : 1)} Cr`;
    if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(n % 1e5 === 0 ? 0 : 1)} L`;
  }
  return INR.format(n);
}

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return PLAIN.format(Number(value));
}

export function formatPercent(value, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${(Number(value) * 100).toFixed(digits)}%`;
}

const DATE = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const DATE_TIME = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value, { time = false } = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return (time ? DATE_TIME : DATE).format(date);
}

export function formatDimension(dimension) {
  const labels = {
    flood: 'Flood Exposure',
    rainfall: 'Heavy Rainfall',
    heat: 'Extreme Heat',
    business: 'Business Vulnerability',
    financial: 'Financial Resilience',
  };
  return labels[dimension] || dimension;
}

export function formatIndustry(industry, sectors) {
  const sector = sectors?.[industry];
  if (!sector) return industry || '—';
  return sector.label || industry;
}

export function formatSize(size) {
  const labels = { micro: 'Micro', small: 'Small', medium: 'Medium' };
  return labels[size] || size || '—';
}

export function formatStage(stage) {
  const labels = { startup: 'Startup', growth: 'Growth', established: 'Established' };
  return labels[stage] || stage || '—';
}

export const DATA_AVAILABILITY_LABEL = {
  live_forecast: 'Live forecast',
  live_historical: 'Live historical',
  live_geocoding: 'Live geocoding',
  cached: 'Cached source',
  demo_fallback: 'Demo data',
  derived: 'Derived from profile',
  missing: 'No data',
};

/** Maps a backend assessment record onto the shape the assessment detail view reads. */
export function toAssessmentRecord(assessment) {
  const factors = assessment.factors || [];
  const dimensions = {};
  for (const factor of factors) dimensions[factor.dimension] = factor.score;
  return {
    id: assessment.id,
    businessId: assessment.businessId,
    overallScore: assessment.overallScore,
    category: assessment.category,
    dimensions,
    factors,
    missingDimensions: assessment.missingDimensions || [],
    isIncomplete: Boolean(assessment.isIncomplete),
    dataNote: assessment.dataNote,
    methodology: assessment.methodology,
    uncertaintyNotes: assessment.uncertaintyNotes || [],
    assessedAt: assessment.assessedAt || assessment.createdAt,
  };
}

/** Maps a business record onto the portfolio/dashboard row shape. */
export function toBusinessRow(business, sectors) {
  return {
    id: business.id,
    name: business.name,
    industry: business.industry,
    industryLabel: formatIndustry(business.industry, sectors),
    location: business.location,
    state: business.state,
    coordinates: business.coordinates,
    businessSize: business.businessSize,
    businessStage: business.businessStage,
    employeeCount: business.employeeCount,
    annualTurnover: business.annualTurnover,
    annualExpenses: business.annualExpenses,
    monthlyOperatingCost: business.monthlyOperatingCost,
    fundingRequired: business.fundingRequired,
    hasBackupSupplier: Boolean(business.hasBackupSupplier),
    hasEmergencyReserve: Boolean(business.hasEmergencyReserve),
    isDemo: Boolean(business.isDemo),
    operationalDetails: business.operationalDetails,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
  };
}

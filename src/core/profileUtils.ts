import { MSMEProfile } from '../types';

export const DEFAULT_OPERATIONS = {
  electricityGridDependent: true,
  hasBackupGenerator: false,
  waterIntensive: false,
  hasWaterStorageRainwater: false,
  perishableInventory: false,
  hasColdStorage: false,
  transportSupplyChainSensitive: true,
  plinthHeightMeters: 0.3,
  hasFloodBarriers: false,
  hasClimateInsurance: false,
};

export const DEFAULT_FINANCIALS = {
  monthlyRevenue: 1500000,
  monthlyOperatingExpenses: 1100000,
  existingMonthlyDebtObligations: 120000,
  availableCashReserves: 800000,
  requestedLoanAmount: 2500000,
  loanTenureMonths: 36,
  annualTurnover: 18000000,
};

export const DEFAULT_LOCATION = {
  city: 'Pune',
  state: 'Maharashtra',
  country: 'India',
  latitude: 18.5204,
  longitude: 73.8567,
  address: 'Pune, Maharashtra',
};

/**
 * Normalizes an MSME profile to guarantee all sub-objects and properties exist,
 * preventing any runtime undefined exceptions.
 */
export function normalizeProfile(raw: any): MSMEProfile {
  if (!raw || typeof raw !== 'object') {
    return {
      id: `msme_${Date.now()}`,
      name: 'Benchmark Enterprise',
      industry: 'food_processing',
      businessSize: 'small',
      businessStage: 'growth',
      employeeCount: 15,
      location: { ...DEFAULT_LOCATION },
      financials: { ...DEFAULT_FINANCIALS },
      operations: { ...DEFAULT_OPERATIONS },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const ops = raw.operations || {};
  const fin = raw.financials || {};
  const loc = raw.location || {};

  return {
    id: String(raw.id || `msme_${Date.now()}`),
    name: String(raw.name || 'Unnamed Enterprise'),
    registrationNumber: raw.registrationNumber || raw.registration_number,
    udyamNumber: raw.udyamNumber || raw.udyam_number,
    industry: raw.industry || 'food_processing',
    businessSize: raw.businessSize || raw.business_size || 'small',
    businessStage: raw.businessStage || raw.business_stage || 'growth',
    employeeCount: Number(raw.employeeCount || raw.employee_count || 15),
    location: {
      city: String(loc.city || raw.city || DEFAULT_LOCATION.city),
      state: String(loc.state || raw.state || DEFAULT_LOCATION.state),
      country: String(loc.country || raw.country || DEFAULT_LOCATION.country),
      latitude: Number(loc.latitude ?? raw.latitude ?? DEFAULT_LOCATION.latitude),
      longitude: Number(loc.longitude ?? raw.longitude ?? DEFAULT_LOCATION.longitude),
      address: loc.address || raw.address || raw.location || `${loc.city || raw.city || 'Pune'}, ${loc.state || raw.state || 'Maharashtra'}`,
      districtCode: loc.districtCode || raw.districtCode,
    },
    financials: {
      monthlyRevenue: Number(fin.monthlyRevenue ?? raw.monthly_revenue ?? raw.monthlyRevenue ?? DEFAULT_FINANCIALS.monthlyRevenue),
      monthlyOperatingExpenses: Number(fin.monthlyOperatingExpenses ?? raw.monthly_operating_expenses ?? raw.monthlyOperatingExpenses ?? DEFAULT_FINANCIALS.monthlyOperatingExpenses),
      existingMonthlyDebtObligations: Number(fin.existingMonthlyDebtObligations ?? raw.monthly_debt_obligations ?? raw.existingMonthlyDebtObligations ?? DEFAULT_FINANCIALS.existingMonthlyDebtObligations),
      availableCashReserves: Number(fin.availableCashReserves ?? raw.available_cash_reserves ?? raw.availableCashReserves ?? DEFAULT_FINANCIALS.availableCashReserves),
      requestedLoanAmount: Number(fin.requestedLoanAmount ?? raw.requested_loan_amount ?? raw.requestedLoanAmount ?? DEFAULT_FINANCIALS.requestedLoanAmount),
      loanTenureMonths: Number(fin.loanTenureMonths ?? raw.loan_tenure_months ?? raw.loanTenureMonths ?? DEFAULT_FINANCIALS.loanTenureMonths),
      annualTurnover: Number(fin.annualTurnover ?? raw.annualTurnover ?? raw.annual_turnover ?? ((fin.monthlyRevenue ?? DEFAULT_FINANCIALS.monthlyRevenue) * 12)),
    },
    operations: {
      electricityGridDependent: Boolean(ops.electricityGridDependent ?? true),
      hasBackupGenerator: Boolean(ops.hasBackupGenerator ?? false),
      waterIntensive: Boolean(ops.waterIntensive ?? false),
      hasWaterStorageRainwater: Boolean(ops.hasWaterStorageRainwater ?? false),
      perishableInventory: Boolean(ops.perishableInventory ?? false),
      hasColdStorage: Boolean(ops.hasColdStorage ?? false),
      transportSupplyChainSensitive: Boolean(ops.transportSupplyChainSensitive ?? true),
      plinthHeightMeters: Number(ops.plinthHeightMeters ?? 0.3),
      hasFloodBarriers: Boolean(ops.hasFloodBarriers ?? false),
      hasClimateInsurance: Boolean(ops.hasClimateInsurance ?? false),
    },
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.updated_at || new Date().toISOString()),
  };
}

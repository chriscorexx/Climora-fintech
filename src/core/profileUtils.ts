import {
  MSMEProfile,
  LocationData,
  OperationalDependencies,
  FinancialIndicators,
  IndustryType,
} from '../types';

type RawProfile = Record<string, unknown>;

const asOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.length > 0 ? value : undefined;

const asEnum = <T extends string>(value: unknown, fallback: T): T =>
  typeof value === 'string' && value.length > 0 ? (value as T) : fallback;

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
export function normalizeProfile(input: unknown): MSMEProfile {
  if (!input || typeof input !== 'object') {
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

  const raw = input as RawProfile;
  const ops = (raw.operations || {}) as Partial<OperationalDependencies>;
  const fin = (raw.financials || {}) as Partial<FinancialIndicators>;
  const loc = (raw.location || {}) as Partial<LocationData>;

  return {
    id: String(raw.id || `msme_${Date.now()}`),
    name: String(raw.name || 'Unnamed Enterprise'),
    registrationNumber:
      asOptionalString(raw.registrationNumber) ?? asOptionalString(raw.registration_number),
    udyamNumber: asOptionalString(raw.udyamNumber) ?? asOptionalString(raw.udyam_number),
    industry: asEnum<IndustryType>(raw.industry, 'food_processing'),
    businessSize: asEnum(raw.businessSize || raw.business_size, 'small'),
    businessStage: asEnum(raw.businessStage || raw.business_stage, 'growth'),
    employeeCount: Number(raw.employeeCount || raw.employee_count || 15),
    location: {
      city: String(loc.city || raw.city || DEFAULT_LOCATION.city),
      state: String(loc.state || raw.state || DEFAULT_LOCATION.state),
      country: String(loc.country || raw.country || DEFAULT_LOCATION.country),
      latitude: Number(loc.latitude ?? raw.latitude ?? DEFAULT_LOCATION.latitude),
      longitude: Number(loc.longitude ?? raw.longitude ?? DEFAULT_LOCATION.longitude),
      address: String(
        loc.address ||
          raw.address ||
          raw.location ||
          `${loc.city || raw.city || 'Pune'}, ${loc.state || raw.state || 'Maharashtra'}`,
      ),
      districtCode: asOptionalString(loc.districtCode) ?? asOptionalString(raw.districtCode),
    },
    financials: {
      monthlyRevenue: Number(
        fin.monthlyRevenue ??
          raw.monthly_revenue ??
          raw.monthlyRevenue ??
          DEFAULT_FINANCIALS.monthlyRevenue,
      ),
      monthlyOperatingExpenses: Number(
        fin.monthlyOperatingExpenses ??
          raw.monthly_operating_expenses ??
          raw.monthlyOperatingExpenses ??
          DEFAULT_FINANCIALS.monthlyOperatingExpenses,
      ),
      existingMonthlyDebtObligations: Number(
        fin.existingMonthlyDebtObligations ??
          raw.monthly_debt_obligations ??
          raw.existingMonthlyDebtObligations ??
          DEFAULT_FINANCIALS.existingMonthlyDebtObligations,
      ),
      availableCashReserves: Number(
        fin.availableCashReserves ??
          raw.available_cash_reserves ??
          raw.availableCashReserves ??
          DEFAULT_FINANCIALS.availableCashReserves,
      ),
      requestedLoanAmount: Number(
        fin.requestedLoanAmount ??
          raw.requested_loan_amount ??
          raw.requestedLoanAmount ??
          DEFAULT_FINANCIALS.requestedLoanAmount,
      ),
      loanTenureMonths: Number(
        fin.loanTenureMonths ??
          raw.loan_tenure_months ??
          raw.loanTenureMonths ??
          DEFAULT_FINANCIALS.loanTenureMonths,
      ),
      annualTurnover: Number(
        fin.annualTurnover ??
          raw.annualTurnover ??
          raw.annual_turnover ??
          (fin.monthlyRevenue ?? DEFAULT_FINANCIALS.monthlyRevenue) * 12,
      ),
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
    ownerId: asOptionalString(raw.ownerId) ?? asOptionalString(raw.owner_id),
    ownerEmail: asOptionalString(raw.ownerEmail) ?? asOptionalString(raw.owner_email),
  };
}

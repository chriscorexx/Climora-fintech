import { getDatabase } from './database';
import { SAMPLE_MSME_PROFILES } from '../../../src/core/sampleData';
import { SCHEMES_CATALOGUE } from '../../../src/core/schemeMatcher';

export function seedDatabaseIfEmpty(): void {
  const db = getDatabase();

  // 1. Check & Seed Schemes
  const schemeCountRow = db.prepare('SELECT COUNT(*) as count FROM schemes').get() as { count: number };
  if (schemeCountRow.count === 0) {
    const insertScheme = db.prepare(`
      INSERT INTO schemes (
        id, name, category, government_level, sponsoring_authority,
        eligible_states_json, eligible_industries_json, eligible_sizes_json,
        eligibility_criteria_json, support_type, max_benefit_summary, official_source_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of SCHEMES_CATALOGUE) {
      insertScheme.run(
        s.id,
        s.name,
        s.category,
        s.governmentLevel,
        s.sponsoringAuthority,
        JSON.stringify(s.eligibleStates),
        JSON.stringify(s.eligibleIndustries),
        JSON.stringify(s.eligibleSizes),
        JSON.stringify(s.eligibilityCriteria),
        s.supportType,
        s.maxBenefitSummary,
        s.officialSourceUrl
      );
    }
  }

  // 2. Check & Seed Businesses
  const bizCountRow = db.prepare('SELECT COUNT(*) as count FROM businesses').get() as { count: number };
  if (bizCountRow.count === 0) {
    const insertBiz = db.prepare(`
      INSERT INTO businesses (
        id, name, udyam_number, industry, business_size, business_stage,
        location, city, state, latitude, longitude,
        monthly_revenue, monthly_operating_expenses, monthly_debt_obligations, available_cash_reserves,
        requested_loan_amount, loan_tenure_months, operations_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const b of SAMPLE_MSME_PROFILES) {
      insertBiz.run(
        b.id,
        b.name,
        b.udyamNumber || null,
        b.industry,
        b.businessSize,
        b.businessStage,
        b.location.address || `${b.location.city}, ${b.location.state}`,
        b.location.city,
        b.location.state,
        b.location.latitude,
        b.location.longitude,
        b.financials.monthlyRevenue,
        b.financials.monthlyOperatingExpenses,
        b.financials.existingMonthlyDebtObligations,
        b.financials.availableCashReserves,
        b.financials.requestedLoanAmount || 2500000,
        b.financials.loanTenureMonths || 36,
        JSON.stringify(b.operations),
        b.createdAt,
        b.updatedAt
      );
    }
  }
}

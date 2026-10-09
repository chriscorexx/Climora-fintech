import { getDatabase } from '../db/database';
import { MSMEProfile } from '../../../src/types';
import { normalizeProfile } from '../../../src/core/profileUtils';

export class BusinessRepository {
  private db = getDatabase();

  getAll(search?: string): MSMEProfile[] {
    let query = 'SELECT * FROM businesses';
    const params: string[] = [];

    if (search) {
      query += ' WHERE name LIKE ? OR city LIKE ? OR industry LIKE ?';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    query += ' ORDER BY updated_at DESC';

    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map(this.mapRowToProfile);
  }

  getById(id: string): MSMEProfile | null {
    const row = this.db.prepare('SELECT * FROM businesses WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRowToProfile(row);
  }

  create(profile: MSMEProfile): MSMEProfile {
    const stmt = this.db.prepare(`
      INSERT INTO businesses (
        id, name, udyam_number, industry, business_size, business_stage,
        location, city, state, latitude, longitude,
        monthly_revenue, monthly_operating_expenses, monthly_debt_obligations, available_cash_reserves,
        requested_loan_amount, loan_tenure_months, operations_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      profile.id,
      profile.name,
      profile.udyamNumber || null,
      profile.industry,
      profile.businessSize,
      profile.businessStage,
      profile.location.address || `${profile.location.city}, ${profile.location.state}`,
      profile.location.city,
      profile.location.state,
      profile.location.latitude,
      profile.location.longitude,
      profile.financials.monthlyRevenue,
      profile.financials.monthlyOperatingExpenses,
      profile.financials.existingMonthlyDebtObligations,
      profile.financials.availableCashReserves,
      profile.financials.requestedLoanAmount || 2500000,
      profile.financials.loanTenureMonths || 36,
      JSON.stringify(profile.operations),
      profile.createdAt,
      profile.updatedAt
    );

    return profile;
  }

  update(id: string, updates: Partial<MSMEProfile>): MSMEProfile | null {
    const current = this.getById(id);
    if (!current) return null;

    const merged: MSMEProfile = {
      ...current,
      ...updates,
      location: { ...current.location, ...updates.location },
      financials: { ...current.financials, ...updates.financials },
      operations: { ...current.operations, ...updates.operations },
      updatedAt: new Date().toISOString(),
    };

    const stmt = this.db.prepare(`
      UPDATE businesses SET
        name = ?, udyam_number = ?, industry = ?, business_size = ?, business_stage = ?,
        location = ?, city = ?, state = ?, latitude = ?, longitude = ?,
        monthly_revenue = ?, monthly_operating_expenses = ?, monthly_debt_obligations = ?, available_cash_reserves = ?,
        requested_loan_amount = ?, loan_tenure_months = ?, operations_json = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      merged.name,
      merged.udyamNumber || null,
      merged.industry,
      merged.businessSize,
      merged.businessStage,
      merged.location.address || `${merged.location.city}, ${merged.location.state}`,
      merged.location.city,
      merged.location.state,
      merged.location.latitude,
      merged.location.longitude,
      merged.financials.monthlyRevenue,
      merged.financials.monthlyOperatingExpenses,
      merged.financials.existingMonthlyDebtObligations,
      merged.financials.availableCashReserves,
      merged.financials.requestedLoanAmount || 2500000,
      merged.financials.loanTenureMonths || 36,
      JSON.stringify(merged.operations),
      merged.updatedAt,
      id
    );

    return merged;
  }

  delete(id: string): boolean {
    const res = this.db.prepare('DELETE FROM businesses WHERE id = ?').run(id);
    return res.changes > 0;
  }

  private mapRowToProfile(row: any): MSMEProfile {
    return normalizeProfile({
      id: row.id,
      name: row.name,
      udyamNumber: row.udyam_number || undefined,
      industry: row.industry,
      businessSize: row.business_size,
      businessStage: row.business_stage,
      employeeCount: 15,
      location: {
        city: row.city,
        state: row.state,
        country: 'India',
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.location,
      },
      financials: {
        monthlyRevenue: row.monthly_revenue,
        monthlyOperatingExpenses: row.monthly_operating_expenses,
        existingMonthlyDebtObligations: row.monthly_debt_obligations,
        availableCashReserves: row.available_cash_reserves,
        requestedLoanAmount: row.requested_loan_amount,
        loanTenureMonths: row.loan_tenure_months,
      },
      operations: JSON.parse(row.operations_json || '{}'),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

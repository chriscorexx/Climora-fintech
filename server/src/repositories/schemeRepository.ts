import { getDatabase } from '../db/database';
import { GovernmentScheme } from '../../../src/types';

export class SchemeRepository {
  private db = getDatabase();

  getAll(): any[] {
    const rows = this.db.prepare('SELECT * FROM schemes').all() as any[];
    return rows.map(this.mapRowToScheme);
  }

  getById(id: string): any | null {
    const row = this.db.prepare('SELECT * FROM schemes WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRowToScheme(row);
  }

  saveForBusiness(schemeId: string, businessId: string, notes?: string): boolean {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO saved_schemes (id, scheme_id, business_id, prep_status, notes, created_at)
      VALUES (?, ?, ?, 'interested', ?, ?)
    `);
    const res = stmt.run(
      `saved_${Date.now()}`,
      schemeId,
      businessId,
      notes || null,
      new Date().toISOString(),
    );
    return res.changes > 0;
  }

  getSavedByBusiness(businessId: string): any[] {
    return this.db
      .prepare(
        `
      SELECT s.*, ss.prep_status, ss.notes as saved_notes, ss.created_at as saved_at
      FROM saved_schemes ss
      JOIN schemes s ON s.id = ss.scheme_id
      WHERE ss.business_id = ?
    `,
      )
      .all(businessId);
  }

  private mapRowToScheme(row: any) {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      governmentLevel: row.government_level,
      sponsoringAuthority: row.sponsoring_authority,
      eligibleStates: JSON.parse(row.eligible_states_json || '[]'),
      eligibleIndustries: JSON.parse(row.eligible_industries_json || '[]'),
      eligibleSizes: JSON.parse(row.eligible_sizes_json || '[]'),
      eligibilityCriteria: JSON.parse(row.eligibility_criteria_json || '[]'),
      supportType: row.support_type,
      maxBenefitSummary: row.max_benefit_summary,
      officialSourceUrl: row.official_source_url,
    };
  }
}

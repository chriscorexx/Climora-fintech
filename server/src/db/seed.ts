import { getDatabase } from './database';
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
}

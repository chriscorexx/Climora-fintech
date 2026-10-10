import { getDatabase } from '../db/database';
import { CashflowScenario } from '../../../src/types';

export class ScenarioRepository {
  private db = getDatabase();

  create(businessId: string, scenario: CashflowScenario): CashflowScenario {
    const stmt = this.db.prepare(`
      INSERT INTO scenarios (
        id, business_id, hazard_type, hazard_label, duration_days,
        baseline_dscr, stressed_dscr, net_deficit, insolvency_risk, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      scenario.scenarioId,
      businessId,
      scenario.hazardType,
      scenario.hazardLabel,
      scenario.durationDays,
      scenario.baselineDSCR,
      scenario.stressedDSCR,
      scenario.netCashflowDeficitInr,
      scenario.insolvencyRisk,
      new Date().toISOString(),
    );

    return scenario;
  }

  getByBusinessId(businessId: string): any[] {
    return this.db
      .prepare(
        `
      SELECT * FROM scenarios WHERE business_id = ? ORDER BY created_at DESC
    `,
      )
      .all(businessId);
  }

  delete(id: string): boolean {
    const res = this.db.prepare('DELETE FROM scenarios WHERE id = ?').run(id);
    return res.changes > 0;
  }
}

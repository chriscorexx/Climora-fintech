import { getDatabase } from '../db/database';
import { RiskAssessment } from '../../../src/types';

export class AssessmentRepository {
  private db = getDatabase();

  create(assessment: RiskAssessment): RiskAssessment {
    const insertAsmt = this.db.prepare(`
      INSERT INTO assessments (
        id, business_id, overall_score, category, is_incomplete,
        missing_dimensions_json, effective_weights_json, explainability_json,
        decision_support_json, is_live, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAsmt.run(
      assessment.id,
      assessment.businessId,
      assessment.overallScore,
      assessment.riskCategory,
      assessment.dataGaps.length > 0 ? 1 : 0,
      JSON.stringify(assessment.dataGaps),
      JSON.stringify(assessment.effectiveWeights),
      JSON.stringify(assessment.explainabilitySummary),
      JSON.stringify(assessment.loanDecisionSupport),
      assessment.provenance.isLive ? 1 : 0,
      assessment.timestamp
    );

    const insertFactor = this.db.prepare(`
      INSERT INTO assessment_factors (
        id, assessment_id, dimension, score, base_weight, effective_weight, explanation
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const [dimKey, dim] of Object.entries(assessment.dimensionScores)) {
      insertFactor.run(
        `fct_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        assessment.id,
        dimKey,
        dim.score,
        dim.baseWeight,
        dim.effectiveWeight,
        dim.contributingFactors.join('; ')
      );
    }

    return assessment;
  }

  getByBusinessId(businessId: string): RiskAssessment[] {
    const rows = this.db.prepare(`
      SELECT * FROM assessments WHERE business_id = ? ORDER BY created_at DESC
    `).all(businessId) as any[];

    return rows.map((r) => this.mapRowToAssessment(r));
  }

  getById(id: string): RiskAssessment | null {
    const row = this.db.prepare('SELECT * FROM assessments WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRowToAssessment(row);
  }

  private mapRowToAssessment(row: any): RiskAssessment {
    const factorRows = this.db.prepare(`
      SELECT * FROM assessment_factors WHERE assessment_id = ?
    `).all(row.id) as any[];

    const dimensionScores: any = {};
    for (const f of factorRows) {
      dimensionScores[f.dimension] = {
        score: f.score,
        baseWeight: f.base_weight,
        effectiveWeight: f.effective_weight,
        available: true,
        contributingFactors: f.explanation.split('; '),
      };
    }

    return {
      id: row.id,
      businessId: row.business_id,
      timestamp: row.created_at,
      overallScore: row.overall_score,
      riskCategory: row.category as any,
      dimensionScores,
      effectiveWeights: JSON.parse(row.effective_weights_json || '{}'),
      explainabilitySummary: JSON.parse(row.explainability_json || '[]'),
      mitigationRecommendations: [],
      dataGaps: JSON.parse(row.missing_dimensions_json || '[]'),
      loanDecisionSupport: JSON.parse(row.decision_support_json || '{}'),
      provenance: {
        isLive: Boolean(row.is_live),
        provider: 'Open-Meteo',
        timestamp: row.created_at,
      },
    };
  }
}

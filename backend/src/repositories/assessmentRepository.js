'use strict';

const { getDatabase, sanitize } = require('../db/index.js');

const FACTOR_COLUMNS = `dimension, score, base_weight, effective_weight, contribution,
  data_availability, source_timestamp, explanation`;

function toFactor(row) {
  return {
    dimension: row.dimension,
    score: row.score,
    baseWeight: row.base_weight,
    effectiveWeight: row.effective_weight,
    contribution: row.contribution,
    dataAvailability: row.data_availability,
    sourceTimestamp: row.source_timestamp,
    explanation: row.explanation,
  };
}

function toAssessment(row) {
  if (!row) return null;
  return {
    id: row.id,
    businessId: row.business_id,
    overallScore: row.overall_score,
    category: row.category,
    isIncomplete: Boolean(row.is_incomplete),
    missingDimensions: JSON.parse(row.missing_dimensions),
    factors: (row.factors || []).map(toFactor),
    dataNote: row.data_note,
    methodology: row.methodology,
    inputSnapshot: row.input_snapshot ? JSON.parse(row.input_snapshot) : null,
    uncertaintyNotes: row.uncertainty_notes ? JSON.parse(row.uncertainty_notes) : [],
    ownerId: row.owner_id,
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
  };
}

function create(assessment, factors) {
  const db = getDatabase();
  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO assessments
        (id, business_id, owner_id, overall_score, category, is_incomplete, missing_dimensions,
         data_note, methodology, input_snapshot, uncertainty_notes, is_demo, created_at)
       VALUES (@id, @businessId, @ownerId, @overallScore, @category, @isIncomplete, @missingDimensions,
               @dataNote, @methodology, @inputSnapshot, @uncertaintyNotes, @isDemo, @createdAt)`
    ).run(sanitize({
      id: assessment.id,
      businessId: assessment.businessId,
      ownerId: assessment.ownerId,
      overallScore: assessment.overallScore,
      category: assessment.category,
      isIncomplete: assessment.isIncomplete ? 1 : 0,
      missingDimensions: JSON.stringify(assessment.missingDimensions),
      dataNote: assessment.dataNote,
      methodology: assessment.methodology,
      inputSnapshot: JSON.stringify(assessment.inputSnapshot),
      uncertaintyNotes: JSON.stringify(assessment.uncertaintyNotes),
      isDemo: assessment.isDemo ? 1 : 0,
      createdAt: assessment.createdAt,
    }));

    const insertFactor = db.prepare(
      `INSERT INTO assessment_factors
        (assessment_id, dimension, score, base_weight, effective_weight, contribution,
         data_availability, source_timestamp, explanation)
       VALUES (@assessmentId, @dimension, @score, @baseWeight, @effectiveWeight, @contribution,
               @dataAvailability, @sourceTimestamp, @explanation)`
    );
    for (const factor of factors) {
      insertFactor.run(sanitize({ assessmentId: assessment.id, ...factor }));
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return findById(assessment.id);
}

function findById(id) {
  const row = getDatabase()
    .prepare('SELECT * FROM assessments WHERE id = ?')
    .get(id);
  if (!row) return null;
  const factors = getDatabase()
    .prepare(`SELECT ${FACTOR_COLUMNS} FROM assessment_factors WHERE assessment_id = ?`)
    .all(id);
  return toAssessment({ ...row, factors });
}

function listByBusiness(businessId, { limit, offset } = {}) {
  const rows = getDatabase()
    .prepare('SELECT * FROM assessments WHERE business_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(businessId, limit, offset);
  return rows.map((row) => toAssessment({ ...row, factors: [] }));
}

function latestForBusiness(businessId) {
  const rows = listByBusiness(businessId, { limit: 1, offset: 0 });
  return rows[0] ? findById(rows[0].id) : null;
}

function listForOwner(ownerId, { limit, offset, category, from, to } = {}) {
  const where = ['owner_id = @ownerId'];
  const params = { ownerId, limit, offset };
  if (category) {
    where.push('category = @category');
    params.category = category;
  }
  if (from) {
    where.push('created_at >= @from');
    params.from = from;
  }
  if (to) {
    where.push('created_at <= @to');
    params.to = to;
  }
  const rows = getDatabase()
    .prepare(
      `SELECT * FROM assessments WHERE ${where.join(' AND ')}
       ORDER BY created_at DESC LIMIT @limit OFFSET @offset`
    )
    .all(params);
  return rows.map((row) => toAssessment({ ...row, factors: [] }));
}

module.exports = { create, findById, listByBusiness, latestForBusiness, listForOwner };

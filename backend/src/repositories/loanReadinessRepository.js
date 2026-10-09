'use strict';

const { getDatabase, sanitize } = require('../db/index.js');

function toLoanReadiness(row) {
  if (!row) return null;
  return {
    id: row.id,
    businessId: row.business_id,
    applicationStatus: row.application_status,
    requestedAmount: row.requested_amount,
    lenderName: row.lender_name,
    rejectionReason: row.rejection_reason,
    lenderFeedback: row.lender_feedback,
    lenderConfirmed: Boolean(row.lender_confirmed),
    documentChecklist: (row.checklist || []).map((item) => ({
      documentName: item.document_name,
      required: Boolean(item.required),
      status: item.status,
      updatedAt: item.updated_at,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLUMNS = `id, business_id, owner_id, application_status, requested_amount, lender_name,
  rejection_reason, lender_feedback, lender_confirmed, created_at, updated_at`;

function upsert(record) {
  const db = getDatabase();
  db.prepare(
    `INSERT INTO loan_readiness (${COLUMNS})
     VALUES (@id, @businessId, @ownerId, @applicationStatus, @requestedAmount, @lenderName,
             @rejectionReason, @lenderFeedback, @lenderConfirmed, @createdAt, @updatedAt)
     ON CONFLICT(business_id) DO UPDATE SET
       application_status = excluded.application_status,
       requested_amount = excluded.requested_amount,
       lender_name = excluded.lender_name,
       rejection_reason = excluded.rejection_reason,
       lender_feedback = excluded.lender_feedback,
       lender_confirmed = excluded.lender_confirmed,
       updated_at = excluded.updated_at`
  ).run(sanitize(record));
  return findByBusinessId(record.businessId);
}

function findByBusinessId(businessId) {
  const row = getDatabase().prepare(`SELECT ${COLUMNS} FROM loan_readiness WHERE business_id = ?`).get(businessId);
  if (!row) return null;
  const checklist = getDatabase()
    .prepare('SELECT * FROM document_checklist_items WHERE loan_readiness_id = ? ORDER BY document_name ASC')
    .all(row.id);
  return toLoanReadiness({ ...row, checklist });
}

function replaceChecklist(loanReadinessId, items) {
  const db = getDatabase();
  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM document_checklist_items WHERE loan_readiness_id = ?').run(loanReadinessId);
    const insert = db.prepare(
      `INSERT INTO document_checklist_items (loan_readiness_id, document_name, required, status, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(loan_readiness_id, document_name) DO UPDATE SET
         required = excluded.required, status = excluded.status, updated_at = excluded.updated_at`
    );
    const now = new Date().toISOString();
    for (const item of items) {
      insert.run(loanReadinessId, item.documentName, item.required ? 1 : 0, item.status, now);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function remove(businessId) {
  return getDatabase().prepare('DELETE FROM loan_readiness WHERE business_id = ?').run(businessId).changes > 0;
}

module.exports = { upsert, findByBusinessId, replaceChecklist, remove };

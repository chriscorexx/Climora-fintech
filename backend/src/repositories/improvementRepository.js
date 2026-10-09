'use strict';

const { getDatabase, sanitize } = require('../db/index.js');

const COLUMNS = `id, business_id, owner_id, title, description, priority, source, status, created_at, updated_at`;

function toAction(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    source: row.source,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createMany(actions) {
  const db = getDatabase();
  const insert = db.prepare(
    `INSERT INTO improvement_actions (${COLUMNS})
     VALUES (@id, @businessId, @ownerId, @title, @description, @priority, @source, @status, @createdAt, @updatedAt)`
  );
  db.exec('BEGIN');
  try {
    for (const action of actions) insert.run(sanitize(action));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function listByBusiness(businessId, { status } = {}) {
  const where = ['business_id = ?'];
  const params = [businessId];
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  return getDatabase()
    .prepare(`SELECT ${COLUMNS} FROM improvement_actions WHERE ${where.join(' AND ')} ORDER BY created_at DESC`)
    .all(...params)
    .map(toAction);
}

function updateStatus(id, businessId, status) {
  const result = getDatabase()
    .prepare(
      `UPDATE improvement_actions SET status = ?, updated_at = ?
       WHERE id = ? AND business_id = ?`
    )
    .run(status, new Date().toISOString(), id, businessId);
  if (result.changes === 0) return null;
  const row = getDatabase().prepare(`SELECT ${COLUMNS} FROM improvement_actions WHERE id = ?`).get(id);
  return toAction(row);
}

function remove(id, businessId) {
  return getDatabase()
    .prepare('DELETE FROM improvement_actions WHERE id = ? AND business_id = ?')
    .run(id, businessId).changes > 0;
}

function removeForBusiness(businessId) {
  return getDatabase().prepare('DELETE FROM improvement_actions WHERE business_id = ?').run(businessId).changes;
}

module.exports = { createMany, listByBusiness, updateStatus, remove, removeForBusiness };

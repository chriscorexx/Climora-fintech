'use strict';

const { getDatabase, sanitize } = require('../db/index.js');

const COLUMNS = `id, business_id, owner_id, name, inputs, baseline, scenario, result, created_at`;

function toScenario(row) {
  return {
    id: row.id,
    businessId: row.business_id,
    ownerId: row.owner_id,
    name: row.name,
    inputs: JSON.parse(row.inputs),
    baseline: JSON.parse(row.baseline),
    scenario: JSON.parse(row.scenario),
    result: JSON.parse(row.result),
    createdAt: row.created_at,
  };
}

function create(scenario) {
  getDatabase()
    .prepare(
      `INSERT INTO scenarios (id, business_id, owner_id, name, inputs, baseline, scenario, result, created_at)
       VALUES (@id, @businessId, @ownerId, @name, @inputs, @baseline, @scenario, @result, @createdAt)`
    )
    .run(sanitize({
      id: scenario.id,
      businessId: scenario.businessId,
      ownerId: scenario.ownerId,
      name: scenario.name,
      inputs: JSON.stringify(scenario.inputs),
      baseline: JSON.stringify(scenario.baseline),
      scenario: JSON.stringify(scenario.scenario),
      result: JSON.stringify(scenario.result),
      createdAt: scenario.createdAt,
    }));
  return findById(scenario.id);
}

function findById(id) {
  const row = getDatabase().prepare(`SELECT ${COLUMNS} FROM scenarios WHERE id = ?`).get(id);
  return row ? toScenario(row) : null;
}

function listByBusiness(businessId, { limit, offset } = {}) {
  return getDatabase()
    .prepare(`SELECT ${COLUMNS} FROM scenarios WHERE business_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(businessId, limit, offset)
    .map(toScenario);
}

function remove(id) {
  return getDatabase().prepare('DELETE FROM scenarios WHERE id = ?').run(id).changes > 0;
}

module.exports = { create, findById, listByBusiness, remove };

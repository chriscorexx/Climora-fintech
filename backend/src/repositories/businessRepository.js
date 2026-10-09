'use strict';

const { getDatabase, sanitize } = require('../db/index.js');

function rowToBusiness(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    location: row.location,
    state: row.state,
    coordinates:
      row.latitude !== null && row.longitude !== null
        ? { lat: row.latitude, lng: row.longitude }
        : null,
    businessSize: row.business_size,
    businessStage: row.business_stage,
    annualTurnover: row.annual_turnover,
    annualExpenses: row.annual_expenses,
    employeeCount: row.employee_count,
    fundingRequired: row.funding_required,
    hasBackupSupplier: Boolean(row.has_backup_supplier),
    hasEmergencyReserve: Boolean(row.has_emergency_reserve),
    monthlyOperatingCost: row.monthly_operating_cost,
    operationalDetails: row.operational_details,
    isDemo: Boolean(row.is_demo),
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLUMNS = `id, owner_id, name, industry, location, state, latitude, longitude,
  business_size, business_stage, annual_turnover, annual_expenses, employee_count,
  funding_required, has_backup_supplier, has_emergency_reserve, monthly_operating_cost,
  operational_details, is_demo, created_at, updated_at`;

function create(business) {
  getDatabase()
    .prepare(
      `INSERT INTO businesses (${COLUMNS})
       VALUES (@id, @ownerId, @name, @industry, @location, @state, @latitude, @longitude,
               @businessSize, @businessStage, @annualTurnover, @annualExpenses, @employeeCount,
               @fundingRequired, @hasBackupSupplier, @hasEmergencyReserve, @monthlyOperatingCost,
               @operationalDetails, @isDemo, @createdAt, @updatedAt)`
    )
    .run(sanitize(business));
  return findById(business.id, business.ownerId);
}

function findById(id, ownerId) {
  const row = getDatabase()
    .prepare(`SELECT ${COLUMNS} FROM businesses WHERE id = ? AND owner_id = ?`)
    .get(id, ownerId);
  return rowToBusiness(row);
}

/** Ownership check that ignores the owner scope (used for 404 vs 403 decisions). */
function findAnyOwner(id) {
  const row = getDatabase()
    .prepare(`SELECT ${COLUMNS} FROM businesses WHERE id = ?`)
    .get(id);
  return rowToBusiness(row);
}

function list(ownerId, { search, industry, state, limit, offset, sort, includeDemo = true } = {}) {
  const where = ['owner_id = @ownerId'];
  const params = { ownerId };

  if (search) {
    where.push('(LOWER(name) LIKE @search OR LOWER(location) LIKE @search)');
    params.search = `%${String(search).toLowerCase()}%`;
  }
  if (industry) {
    where.push('industry = @industry');
    params.industry = industry;
  }
  if (state) {
    where.push('state = @state');
    params.state = state;
  }
  if (!includeDemo) {
    where.push('is_demo = 0');
  }

  const order = sort === 'name' ? 'name ASC' : sort === 'created_at' ? 'created_at DESC' : 'updated_at DESC';

  const rows = getDatabase()
    .prepare(
      `SELECT ${COLUMNS} FROM businesses WHERE ${where.join(' AND ')}
       ORDER BY ${order} LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit, offset });

  const totalRow = getDatabase()
    .prepare(`SELECT COUNT(*) AS count FROM businesses WHERE ${where.join(' AND ')}`)
    .get(params);

  return { rows: rows.map(rowToBusiness), total: totalRow.count };
}

function update(id, ownerId, patch) {
  const existing = findById(id, ownerId);
  if (!existing) return null;

  const merged = {
    id,
    ownerId,
    name: patch.name !== undefined ? patch.name : existing.name,
    industry: patch.industry !== undefined ? patch.industry : existing.industry,
    location: patch.location !== undefined ? patch.location : existing.location,
    state: patch.state !== undefined ? patch.state : existing.state,
    latitude:
      patch.coordinates && patch.coordinates.lat !== undefined
        ? patch.coordinates.lat
        : existing.coordinates
          ? existing.coordinates.lat
          : null,
    longitude:
      patch.coordinates && patch.coordinates.lng !== undefined
        ? patch.coordinates.lng
        : existing.coordinates
          ? existing.coordinates.lng
          : null,
    businessSize: patch.businessSize !== undefined ? patch.businessSize : existing.businessSize,
    businessStage: patch.businessStage !== undefined ? patch.businessStage : existing.businessStage,
    annualTurnover:
      patch.annualTurnover !== undefined ? patch.annualTurnover : existing.annualTurnover,
    annualExpenses:
      patch.annualExpenses !== undefined ? patch.annualExpenses : existing.annualExpenses,
    employeeCount:
      patch.employeeCount !== undefined ? patch.employeeCount : existing.employeeCount,
    fundingRequired:
      patch.fundingRequired !== undefined ? patch.fundingRequired : existing.fundingRequired,
    hasBackupSupplier:
      patch.hasBackupSupplier !== undefined ? patch.hasBackupSupplier : existing.hasBackupSupplier,
    hasEmergencyReserve:
      patch.hasEmergencyReserve !== undefined
        ? patch.hasEmergencyReserve
        : existing.hasEmergencyReserve,
    monthlyOperatingCost:
      patch.monthlyOperatingCost !== undefined
        ? patch.monthlyOperatingCost
        : existing.monthlyOperatingCost,
    operationalDetails:
      patch.operationalDetails !== undefined
        ? patch.operationalDetails
        : existing.operationalDetails,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  getDatabase()
    .prepare(
      `UPDATE businesses SET name = @name, industry = @industry, location = @location, state = @state,
        latitude = @latitude, longitude = @longitude, business_size = @businessSize,
        business_stage = @businessStage, annual_turnover = @annualTurnover,
        annual_expenses = @annualExpenses, employee_count = @employeeCount,
        funding_required = @fundingRequired, has_backup_supplier = @hasBackupSupplier,
        has_emergency_reserve = @hasEmergencyReserve, monthly_operating_cost = @monthlyOperatingCost,
        operational_details = @operationalDetails, updated_at = @updatedAt
       WHERE id = @id AND owner_id = @ownerId`
    )
    .run(sanitize(merged));

  return findById(id, ownerId);
}

function remove(id, ownerId) {
  const result = getDatabase()
    .prepare('DELETE FROM businesses WHERE id = ? AND owner_id = ?')
    .run(id, ownerId);
  return result.changes > 0;
}

module.exports = { create, findById, findAnyOwner, list, update, remove, rowToBusiness };

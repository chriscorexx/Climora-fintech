'use strict';

const { getDatabase, sanitize } = require('../db/index.js');

function toScheme(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    governmentLevel: row.government_level,
    eligibleStates: JSON.parse(row.eligible_states),
    industries: JSON.parse(row.industries),
    businessStages: JSON.parse(row.business_stages),
    businessSizes: JSON.parse(row.business_sizes),
    eligibilityCriteria: JSON.parse(row.eligibility_criteria),
    supportType: row.support_type,
    requiredDocuments: JSON.parse(row.required_documents),
    officialSourceUrl: row.official_source_url,
    applicationUrl: row.application_url,
    verificationStatus: row.verification_status,
    lastVerifiedDate: row.last_verified_date,
    notes: row.notes,
  };
}

const COLUMNS = `id, name, category, government_level, eligible_states, industries, business_stages,
  business_sizes, eligibility_criteria, support_type, required_documents, official_source_url,
  application_url, verification_status, last_verified_date, notes, created_at`;

function insertMany(schemes) {
  const db = getDatabase();
  const insert = db.prepare(
    `INSERT OR IGNORE INTO schemes (${COLUMNS})
     VALUES (@id, @name, @category, @governmentLevel, @eligibleStates, @industries, @businessStages,
             @businessSizes, @eligibilityCriteria, @supportType, @requiredDocuments,
             @officialSourceUrl, @applicationUrl, @verificationStatus, @lastVerifiedDate, @notes, @createdAt)`
  );
  db.exec('BEGIN');
  try {
    for (const scheme of schemes) {
      insert.run(sanitize({
        id: scheme.id,
        name: scheme.name,
        category: scheme.category,
        governmentLevel: scheme.governmentLevel,
        eligibleStates: JSON.stringify(scheme.eligibleStates || []),
        industries: JSON.stringify(scheme.industries || []),
        businessStages: JSON.stringify(scheme.businessStages || []),
        businessSizes: JSON.stringify(scheme.businessSizes || []),
        eligibilityCriteria: JSON.stringify(scheme.eligibilityCriteria || []),
        supportType: scheme.supportType,
        requiredDocuments: JSON.stringify(scheme.requiredDocuments || []),
        officialSourceUrl: scheme.officialSourceUrl,
        applicationUrl: scheme.applicationUrl || null,
        verificationStatus: scheme.verificationStatus || 'unverified',
        lastVerifiedDate: scheme.lastVerifiedDate || null,
        notes: scheme.notes || null,
        createdAt: scheme.createdAt,
      }));
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function count() {
  return getDatabase().prepare('SELECT COUNT(*) AS count FROM schemes').get().count;
}

function findById(id) {
  return toScheme(getDatabase().prepare(`SELECT ${COLUMNS} FROM schemes WHERE id = ?`).get(id));
}

function list({ category, governmentLevel, state, industry, supportType, verificationStatus, search, limit, offset } = {}) {
  const where = [];
  const params = { limit, offset };

  if (category) {
    where.push('category = @category');
    params.category = category;
  }
  if (governmentLevel) {
    where.push('government_level = @governmentLevel');
    params.governmentLevel = governmentLevel;
  }
  if (supportType) {
    where.push('support_type = @supportType');
    params.supportType = supportType;
  }
  if (verificationStatus) {
    where.push('verification_status = @verificationStatus');
    params.verificationStatus = verificationStatus;
  }
  if (state) {
    // A scheme is applicable when its eligible_states list is empty (all-India)
    // or contains the requested state.
    where.push(`(eligible_states = '[]' OR eligible_states LIKE '%' || @state || '%')`);
    params.state = state;
  }
  if (industry) {
    where.push(`(industries = '[]' OR industries LIKE '%' || @industry || '%')`);
    params.industry = industry;
  }
  if (search) {
    where.push('(LOWER(name) LIKE @search OR LOWER(category) LIKE @search OR LOWER(support_type) LIKE @search)');
    params.search = `%${String(search).toLowerCase()}%`;
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = getDatabase()
    .prepare(`SELECT ${COLUMNS} FROM schemes ${clause} ORDER BY name ASC LIMIT @limit OFFSET @offset`)
    .all(params);

  // node:sqlite rejects parameter keys that do not exist in the statement, so
  // pagination values are excluded from the COUNT query.
  const { limit: _limit, offset: _offset, ...countParams } = params;
  const total = getDatabase()
    .prepare(`SELECT COUNT(*) AS count FROM schemes ${clause}`)
    .get(countParams).count;

  return { rows: rows.map(toScheme), total };
}

function saveForOwner(ownerId, schemeId, prepStatus, notes) {
  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      `INSERT INTO saved_schemes (owner_id, scheme_id, prep_status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(owner_id, scheme_id) DO UPDATE SET
         prep_status = excluded.prep_status,
         notes = excluded.notes,
         updated_at = excluded.updated_at`
    )
    .run(ownerId, schemeId, prepStatus, notes || null, now, now);
  return listSavedForOwner(ownerId);
}

function removeForOwner(ownerId, schemeId) {
  return getDatabase()
    .prepare('DELETE FROM saved_schemes WHERE owner_id = ? AND scheme_id = ?')
    .run(ownerId, schemeId).changes > 0;
}

function listSavedForOwner(ownerId) {
  return getDatabase()
    .prepare(
      `SELECT s.*, ss.prep_status AS saved_prep_status, ss.notes AS saved_notes,
              ss.created_at AS saved_at, ss.updated_at AS saved_updated_at
       FROM saved_schemes ss JOIN schemes s ON s.id = ss.scheme_id
       WHERE ss.owner_id = ? ORDER BY ss.updated_at DESC`
    )
    .all(ownerId)
    .map((row) => ({
      ...toScheme(row),
      saved: true,
      prepStatus: row.saved_prep_status,
      savedNotes: row.saved_notes,
      savedAt: row.saved_at,
    }));
}

function findSaved(ownerId, schemeId) {
  const row = getDatabase()
    .prepare('SELECT * FROM saved_schemes WHERE owner_id = ? AND scheme_id = ?')
    .get(ownerId, schemeId);
  return row ? { prepStatus: row.prep_status, notes: row.notes } : null;
}

module.exports = {
  insertMany,
  count,
  findById,
  list,
  saveForOwner,
  removeForOwner,
  listSavedForOwner,
  findSaved,
};

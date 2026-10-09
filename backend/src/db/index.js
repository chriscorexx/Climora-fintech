'use strict';

const { DatabaseSync } = require('node:sqlite');
const { mkdirSync } = require('node:fs');
const { dirname, resolve } = require('node:path');

const SCHEMA_VERSION = 1;

let db = null;

/**
 * Opens (or creates) the SQLite database, enables foreign keys and applies the
 * schema. Repeated initialisation is safe: it never drops or deletes data.
 */
function initDatabase(dbPath) {
  if (db) return db;

  const absolutePath = resolve(dbPath);
  if (absolutePath !== ':memory:') {
    mkdirSync(dirname(absolutePath), { recursive: true });
  }

  db = new DatabaseSync(absolutePath);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  applySchema(db);
  return db;
}

function applySchema(database) {
  database.exec('BEGIN');
  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version     INTEGER PRIMARY KEY,
        applied_at  TEXT NOT NULL
      );
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS businesses (
        id                    TEXT PRIMARY KEY,
        owner_id              TEXT NOT NULL DEFAULT 'local',
        name                  TEXT NOT NULL,
        industry              TEXT NOT NULL,
        location              TEXT NOT NULL,
        state                 TEXT,
        latitude              REAL,
        longitude             REAL,
        business_size         TEXT,
        business_stage        TEXT,
        annual_turnover       REAL,
        employee_count        INTEGER,
        annual_expenses       REAL,
        funding_required      REAL,
        has_backup_supplier   INTEGER NOT NULL DEFAULT 0,
        has_emergency_reserve INTEGER NOT NULL DEFAULT 0,
        monthly_operating_cost REAL,
        operational_details   TEXT,
        is_demo               INTEGER NOT NULL DEFAULT 0,
        created_at            TEXT NOT NULL,
        updated_at            TEXT NOT NULL
      );
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS climate_observations (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id   TEXT REFERENCES businesses(id) ON DELETE CASCADE,
        cache_key     TEXT NOT NULL UNIQUE,
        kind          TEXT NOT NULL,
        provider      TEXT NOT NULL,
        data_type     TEXT NOT NULL,
        latitude      REAL NOT NULL,
        longitude     REAL NOT NULL,
        payload       TEXT NOT NULL,
        source_time   TEXT,
        fetched_at    TEXT NOT NULL,
        expires_at    TEXT NOT NULL
      );
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS assessments (
        id                 TEXT PRIMARY KEY,
        business_id        TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        owner_id           TEXT NOT NULL DEFAULT 'local',
        overall_score      INTEGER NOT NULL,
        category           TEXT NOT NULL,
        is_incomplete      INTEGER NOT NULL DEFAULT 0,
        missing_dimensions TEXT NOT NULL DEFAULT '[]',
        data_note          TEXT,
        methodology        TEXT,
        input_snapshot     TEXT,
        uncertainty_notes  TEXT,
        is_demo            INTEGER NOT NULL DEFAULT 0,
        created_at         TEXT NOT NULL
      );
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS assessment_factors (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        assessment_id     TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
        dimension         TEXT NOT NULL,
        score             REAL,
        base_weight       REAL NOT NULL,
        effective_weight  REAL NOT NULL,
        contribution      REAL NOT NULL,
        data_availability TEXT NOT NULL,
        source_timestamp  TEXT,
        explanation       TEXT
      );
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id          TEXT PRIMARY KEY,
        business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        owner_id    TEXT NOT NULL DEFAULT 'local',
        name        TEXT NOT NULL,
        inputs      TEXT NOT NULL,
        baseline    TEXT NOT NULL,
        scenario    TEXT NOT NULL,
        result      TEXT NOT NULL,
        created_at  TEXT NOT NULL
      );
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS schemes (
        id                  TEXT PRIMARY KEY,
        name                TEXT NOT NULL,
        category            TEXT NOT NULL,
        government_level    TEXT NOT NULL,
        eligible_states     TEXT NOT NULL DEFAULT '[]',
        industries          TEXT NOT NULL DEFAULT '[]',
        business_stages     TEXT NOT NULL DEFAULT '[]',
        business_sizes      TEXT NOT NULL DEFAULT '[]',
        eligibility_criteria TEXT NOT NULL DEFAULT '[]',
        support_type        TEXT NOT NULL,
        required_documents  TEXT NOT NULL DEFAULT '[]',
        official_source_url TEXT NOT NULL,
        application_url     TEXT,
        verification_status TEXT NOT NULL DEFAULT 'unverified',
        last_verified_date  TEXT,
        notes               TEXT,
        created_at          TEXT NOT NULL
      );
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS saved_schemes (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id    TEXT NOT NULL DEFAULT 'local',
        scheme_id   TEXT NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
        prep_status TEXT NOT NULL DEFAULT 'not_started',
        notes       TEXT,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL,
        UNIQUE (owner_id, scheme_id)
      );
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS loan_readiness (
        id               TEXT PRIMARY KEY,
        business_id      TEXT NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
        owner_id         TEXT NOT NULL DEFAULT 'local',
        application_status TEXT NOT NULL DEFAULT 'not_applied',
        requested_amount REAL,
        lender_name      TEXT,
        rejection_reason TEXT,
        lender_feedback  TEXT,
        lender_confirmed INTEGER NOT NULL DEFAULT 0,
        created_at       TEXT NOT NULL,
        updated_at       TEXT NOT NULL
      );
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS document_checklist_items (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_readiness_id TEXT NOT NULL REFERENCES loan_readiness(id) ON DELETE CASCADE,
        document_name    TEXT NOT NULL,
        required         INTEGER NOT NULL DEFAULT 1,
        status           TEXT NOT NULL DEFAULT 'missing',
        updated_at       TEXT NOT NULL,
        UNIQUE (loan_readiness_id, document_name)
      );
    `);

    database.exec(`
      CREATE TABLE IF NOT EXISTS improvement_actions (
        id          TEXT PRIMARY KEY,
        business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        owner_id    TEXT NOT NULL DEFAULT 'local',
        title       TEXT NOT NULL,
        description TEXT NOT NULL,
        priority    TEXT NOT NULL,
        source      TEXT NOT NULL DEFAULT 'climora_engine',
        status      TEXT NOT NULL DEFAULT 'open',
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );
    `);

    database.exec(`
      CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
      CREATE INDEX IF NOT EXISTS idx_assessments_business ON assessments(business_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_factors_assessment ON assessment_factors(assessment_id);
      CREATE INDEX IF NOT EXISTS idx_scenarios_business ON scenarios(business_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_saved_schemes_owner ON saved_schemes(owner_id);
      CREATE INDEX IF NOT EXISTS idx_loan_business ON loan_readiness(business_id);
      CREATE INDEX IF NOT EXISTS idx_checklist_loan ON document_checklist_items(loan_readiness_id);
      CREATE INDEX IF NOT EXISTS idx_improvements_business ON improvement_actions(business_id, status);
      CREATE INDEX IF NOT EXISTS idx_businesses_demo ON businesses(is_demo);
      CREATE INDEX IF NOT EXISTS idx_climate_expiry ON climate_observations(expires_at);
    `);

    const row = database
      .prepare('SELECT version FROM schema_migrations WHERE version = ?')
      .get(SCHEMA_VERSION);
    if (!row) {
      database
        .prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)')
        .run(SCHEMA_VERSION, new Date().toISOString());
    }

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

/**
 * node:sqlite cannot bind booleans or `undefined`. This converts every value
 * in a parameter object to something SQLite accepts.
 */
function sanitize(params) {
  if (params === undefined || params === null) return {};
  if (typeof params !== 'object') return params;
  if (Array.isArray(params) || params instanceof Date) return params;
  const out = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) out[key] = null;
    else if (typeof value === 'boolean') out[key] = value ? 1 : 0;
    else out[key] = value;
  }
  return out;
}

function getDatabase() {
  if (!db) throw new Error('Database has not been initialised. Call initDatabase() first.');
  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { initDatabase, getDatabase, closeDatabase, sanitize, SCHEMA_VERSION };

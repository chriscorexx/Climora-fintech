/**
 * electron/db.js
 * SQLite repository for Climora.
 * All queries use parameterised statements — no string concatenation.
 * Database file lives in Electron's userData directory.
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { mkdirSync } from 'fs';

let _db = null;

// ── Schema ────────────────────────────────────────────────────────────────

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS businesses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  sector        TEXT    NOT NULL,
  location      TEXT    NOT NULL,
  latitude      REAL,
  longitude     REAL,
  employee_count INTEGER,
  revenue       REAL,
  expenses      REAL,
  debt_obligations REAL,
  emergency_reserve REAL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assessments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id     INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  overall_score   REAL    NOT NULL,
  category        TEXT    NOT NULL,
  flood_score     REAL,
  rainfall_score  REAL,
  heat_score      REAL,
  business_score  REAL,
  financial_score REAL,
  data_source     TEXT    NOT NULL DEFAULT 'sample',
  missing_dims    TEXT    NOT NULL DEFAULT '[]',
  data_note       TEXT,
  assessed_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assessment_history (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id   INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  note          TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id   INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  category      TEXT    NOT NULL DEFAULT 'General',
  status        TEXT    NOT NULL DEFAULT 'Not Ready',
  linked_action TEXT,
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assessments_business ON assessments(business_id);
CREATE INDEX IF NOT EXISTS idx_history_business     ON assessment_history(business_id);
CREATE INDEX IF NOT EXISTS idx_documents_business   ON documents(business_id);
`;

// ── Initialise ────────────────────────────────────────────────────────────

export function initDb() {
  if (_db) return _db;

  const dataDir = join(app.getPath('userData'), 'climora');
  mkdirSync(dataDir, { recursive: true });
  const dbPath = join(dataDir, 'climora.db');

  _db = new Database(dbPath);
  _db.exec(SCHEMA);
  return _db;
}

export function getDb() {
  if (!_db) throw new Error('Database not initialised — call initDb() first.');
  return _db;
}

// ── Business repository ───────────────────────────────────────────────────

export const businessRepo = {
  list() {
    return getDb()
      .prepare('SELECT * FROM businesses ORDER BY created_at DESC')
      .all();
  },

  getById(id) {
    return getDb()
      .prepare('SELECT * FROM businesses WHERE id = ?')
      .get(id);
  },

  insert(b) {
    const stmt = getDb().prepare(`
      INSERT INTO businesses
        (name, sector, location, latitude, longitude,
         employee_count, revenue, expenses, debt_obligations, emergency_reserve)
      VALUES
        (@name, @sector, @location, @latitude, @longitude,
         @employeeCount, @revenue, @expenses, @debtObligations, @emergencyReserve)
    `);
    const info = stmt.run(b);
    return { ...b, id: info.lastInsertRowid };
  },

  update(id, b) {
    getDb().prepare(`
      UPDATE businesses SET
        name = @name, sector = @sector, location = @location,
        latitude = @latitude, longitude = @longitude,
        employee_count = @employeeCount, revenue = @revenue,
        expenses = @expenses, debt_obligations = @debtObligations,
        emergency_reserve = @emergencyReserve,
        updated_at = datetime('now')
      WHERE id = @id
    `).run({ ...b, id });
    return businessRepo.getById(id);
  },

  delete(id) {
    getDb().prepare('DELETE FROM businesses WHERE id = ?').run(id);
  },
};

// ── Assessment repository ─────────────────────────────────────────────────

export const assessmentRepo = {
  listForBusiness(businessId) {
    return getDb()
      .prepare(`
        SELECT a.*, ah.note
        FROM assessments a
        LEFT JOIN assessment_history ah ON ah.assessment_id = a.id
        WHERE a.business_id = ?
        ORDER BY a.assessed_at DESC
      `)
      .all(businessId);
  },

  getLatest(businessId) {
    return getDb()
      .prepare(`
        SELECT * FROM assessments
        WHERE business_id = ?
        ORDER BY assessed_at DESC LIMIT 1
      `)
      .get(businessId);
  },

  insert(a) {
    const stmt = getDb().prepare(`
      INSERT INTO assessments
        (business_id, overall_score, category,
         flood_score, rainfall_score, heat_score, business_score, financial_score,
         data_source, missing_dims, data_note)
      VALUES
        (@businessId, @overallScore, @category,
         @floodScore, @rainfallScore, @heatScore, @businessScore, @financialScore,
         @dataSource, @missingDims, @dataNote)
    `);
    const info = stmt.run({
      ...a,
      missingDims: JSON.stringify(a.missingDims ?? []),
    });
    const newId = info.lastInsertRowid;
    // Write history record
    getDb().prepare(`
      INSERT INTO assessment_history (business_id, assessment_id, note)
      VALUES (?, ?, ?)
    `).run(a.businessId, newId, a.note ?? null);
    return assessmentRepo.getLatest(a.businessId);
  },
};

// ── Document repository ───────────────────────────────────────────────────

export const documentRepo = {
  listForBusiness(businessId) {
    return getDb()
      .prepare('SELECT * FROM documents WHERE business_id = ? ORDER BY category, name')
      .all(businessId);
  },

  upsert(doc) {
    if (doc.id) {
      getDb().prepare(`
        UPDATE documents SET status = @status, updated_at = datetime('now')
        WHERE id = @id AND business_id = @businessId
      `).run(doc);
      return doc;
    }
    const info = getDb().prepare(`
      INSERT INTO documents (business_id, name, category, status, linked_action)
      VALUES (@businessId, @name, @category, @status, @linkedAction)
    `).run(doc);
    return { ...doc, id: info.lastInsertRowid };
  },

  seedDefaults(businessId) {
    const defaults = [
      { name: 'Bank Statements (24 months)', category: 'Financial',  linkedAction: null },
      { name: 'Sales Records & Invoices',    category: 'Financial',  linkedAction: null },
      { name: 'Tax Returns (2 years)',        category: 'Financial',  linkedAction: null },
      { name: 'Cash Flow Forecast (12 mo)',   category: 'Financial',  linkedAction: null },
      { name: 'Business Registration',        category: 'Legal',      linkedAction: null },
      { name: 'Flood Response Plan',          category: 'Climate',    linkedAction: null },
      { name: 'Business Continuity Plan',     category: 'Climate',    linkedAction: null },
      { name: 'Loan Repayment Schedules',     category: 'Debt',       linkedAction: null },
    ];
    const stmt = getDb().prepare(`
      INSERT OR IGNORE INTO documents (business_id, name, category, status, linked_action)
      VALUES (@businessId, @name, @category, 'Not Ready', @linkedAction)
    `);
    for (const d of defaults) stmt.run({ businessId, ...d });
  },
};

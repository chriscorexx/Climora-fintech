import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dbDir = path.dirname(config.databasePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new DatabaseSync(config.databasePath);
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  dbInstance.exec('PRAGMA journal_mode = WAL;');

  initSchema(dbInstance);
  return dbInstance;
}

function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      udyam_number TEXT,
      industry TEXT NOT NULL,
      business_size TEXT NOT NULL DEFAULT 'small',
      business_stage TEXT NOT NULL DEFAULT 'growth',
      location TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      monthly_revenue REAL NOT NULL,
      monthly_operating_expenses REAL NOT NULL,
      monthly_debt_obligations REAL NOT NULL DEFAULT 0,
      available_cash_reserves REAL NOT NULL DEFAULT 0,
      requested_loan_amount REAL,
      loan_tenure_months INTEGER DEFAULT 36,
      operations_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      overall_score INTEGER NOT NULL,
      category TEXT NOT NULL,
      is_incomplete INTEGER NOT NULL DEFAULT 0,
      missing_dimensions_json TEXT NOT NULL,
      effective_weights_json TEXT NOT NULL,
      explainability_json TEXT NOT NULL,
      decision_support_json TEXT NOT NULL,
      is_live INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessment_factors (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
      dimension TEXT NOT NULL,
      score INTEGER NOT NULL,
      base_weight REAL NOT NULL,
      effective_weight REAL NOT NULL,
      explanation TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      hazard_type TEXT NOT NULL,
      hazard_label TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      baseline_dscr REAL NOT NULL,
      stressed_dscr REAL NOT NULL,
      net_deficit REAL NOT NULL,
      insolvency_risk TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schemes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      government_level TEXT NOT NULL,
      sponsoring_authority TEXT NOT NULL,
      eligible_states_json TEXT NOT NULL,
      eligible_industries_json TEXT NOT NULL,
      eligible_sizes_json TEXT NOT NULL,
      eligibility_criteria_json TEXT NOT NULL,
      support_type TEXT NOT NULL,
      max_benefit_summary TEXT NOT NULL,
      official_source_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_schemes (
      id TEXT PRIMARY KEY,
      scheme_id TEXT NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      prep_status TEXT NOT NULL DEFAULT 'interested',
      notes TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(scheme_id, business_id)
    );

    CREATE TABLE IF NOT EXISTS climate_cache (
      location_key TEXT PRIMARY KEY,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
    CREATE INDEX IF NOT EXISTS idx_assessments_biz ON assessments(business_id);
    CREATE INDEX IF NOT EXISTS idx_scenarios_biz ON scenarios(business_id);
  `);
}

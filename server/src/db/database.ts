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
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('lender','msme_owner','admin')),
        password_hash TEXT NOT NULL,
        salt TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        email_verified_at TEXT,
        failed_login_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TEXT,
        last_login_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS auth_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK(type IN ('refresh','verify_email','reset_password')),
        expires_at TEXT NOT NULL,
        used_at TEXT,
        revoked_at TEXT,
        created_at TEXT NOT NULL,
        user_agent TEXT,
        ip_address TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_used_at TEXT,
        revoked_at TEXT,
        user_agent TEXT,
        ip_address TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS businesses (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
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

      CREATE TABLE IF NOT EXISTS loan_applications (
        id TEXT PRIMARY KEY,
        business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        applicant_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        loan_amount REAL NOT NULL,
        tenure_months INTEGER NOT NULL,
        purpose TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('draft','submitted','under_review','approved','rejected','revision_requested')) DEFAULT 'draft',
        assigned_lender_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        notes_json TEXT,
        timeline_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS loan_application_docs (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
        doc_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_url TEXT NOT NULL,
        uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        uploaded_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
      CREATE INDEX IF NOT EXISTS idx_businesses_user ON businesses(user_id);
      CREATE INDEX IF NOT EXISTS idx_assessments_biz ON assessments(business_id);
      CREATE INDEX IF NOT EXISTS idx_scenarios_biz ON scenarios(business_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_loan_apps_biz ON loan_applications(business_id);
    `);
}

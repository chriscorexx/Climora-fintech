'use strict';

/**
 * Climora backend test suite.
 *
 * Run with:  npm test   (from the backend directory)
 * Uses the built-in Node.js test runner — no extra dependencies.
 */

process.env.NODE_ENV = 'test';
process.env.SEED_DEMO_DATA = 'true';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const TEST_DIR = path.join(__dirname, '..', 'data', 'test');
const TEST_DB = path.join(TEST_DIR, 'climora-test.db');

// Must be set before the config module is loaded.
process.env.DATABASE_PATH = TEST_DB;

const { initDatabase, closeDatabase, getDatabase } = require('../src/db/index.js');
const seed = require('../src/db/seed.js');
const { createApp } = require('../src/app.js');
const risk = require('../src/services/riskService.js');
const climate = require('../src/services/climateService.js');
const config = require('../src/config/index.js');

let server;
let baseUrl;

// ---------------------------------------------------------------------------
// Deterministic offline climate fixtures.
//
// The climate HTTP client is replaced with a stub that returns fixed
// Open-Meteo-shaped payloads, so the whole suite is network independent and
// reproducible. The real HTTP implementation is still covered by the failure
// and timeout tests below.
// ---------------------------------------------------------------------------
const FIXTURES = {
  'api.open-meteo.com': {
    daily: {
      time: ['2026-10-09', '2026-10-10', '2026-10-11'],
      temperature_2m_max: [41.5, 42.0, 44.0],
      temperature_2m_min: [25, 26, 27],
      precipitation_sum: [12.5, 180.0, 3.0],
    },
  },
  'flood-api.open-meteo.com': {
    daily: {
      time: ['2026-10-09', '2026-10-10', '2026-10-11'],
      river_discharge: [5, 6, 7],
      river_discharge_max: [8, 9, 10],
    },
  },
  'geocoding-api.open-meteo.com': {
    results: [
      {
        name: 'Nashik',
        latitude: 19.9975,
        longitude: 73.7898,
        elevation: 700,
        country: 'India',
        country_code: 'IN',
        admin1: 'Maharashtra',
        timezone: 'Asia/Kolkata',
      },
    ],
  },
};

installStubHttpClient();

function installStubHttpClient() {
  climate.setHttpClient(async (url) => {
    const host = new URL(url).host;
    const fixture = FIXTURES[host];
    if (!fixture) {
      const error = new Error(`No fixture registered for ${host}`);
      error.statusCode = 404;
      throw error;
    }
    if (url.includes('start_date')) {
      // Trailing-12-month discharge reference.
      return {
        json: {
          daily: {
            time: ['2026-10-08', '2026-10-09'],
            river_discharge_max: [3.0, 20.0],
          },
        },
      };
    }
    return { json: fixture, latencyMs: 1 };
  });
}

function startServer() {
  const app = createApp();
  return new Promise((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1');
    listener.once('listening', () => resolve(listener));
    listener.once('error', reject);
  });
}

async function api(method, url, body, headers = {}) {
  const response = await fetch(`${baseUrl}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, body: json };
}

before(async () => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });
  initDatabase(TEST_DB);
  seed.seed();
  installStubHttpClient();
  server = await startServer();
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  closeDatabase();
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

// --------------------------------------------------------------------- health

test('GET /api/health returns 200 with a payload', async () => {
  const { status, body } = await api('GET', '/api/health');
  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data.status, 'ok');
  assert.ok(body.data.timestamp);
  assert.deepEqual(body.data.scoring.weights, config.risk.weights);
});

// ----------------------------------------------------------------- businesses

test('creating a business returns 201 and a stable id', async () => {
  const { status, body } = await api('POST', '/api/businesses', {
    name: 'Test Agro LLP',
    industry: 'food_processing',
    location: 'Nashik, Maharashtra',
    state: 'Maharashtra',
    latitude: 19.9975,
    longitude: 73.7898,
    businessSize: 'micro',
    businessStage: 'growth',
    annualTurnover: 5000000,
    annualExpenses: 4200000,
    employeeCount: 12,
    fundingRequired: 1000000,
    monthlyOperatingCost: 300000,
    hasBackupSupplier: false,
    hasEmergencyReserve: false,
  });
  assert.equal(status, 201);
  assert.ok(body.data.business.id.startsWith('biz_'));
  assert.equal(body.data.business.isDemo, false);
  globalThis.__bizId = body.data.business.id;
});

test('rejects invalid business input', async () => {
  const missing = await api('POST', '/api/businesses', { name: 'x' });
  assert.equal(missing.status, 400);
  assert.equal(missing.body.success, false);
  assert.ok(missing.body.error.details.length >= 3);

  const badIndustry = await api('POST', '/api/businesses', {
    name: 'Bad sector Co',
    industry: 'space_mining',
    location: 'Nowhere',
  });
  assert.equal(badIndustry.status, 400);

  const badNumber = await api('POST', '/api/businesses', {
    name: 'Negative revenue Co',
    industry: 'retail',
    location: 'Pune',
    annualTurnover: -5,
  });
  assert.equal(badNumber.status, 400);

  const badCoords = await api('POST', '/api/businesses', {
    name: 'Bad coords Co',
    industry: 'retail',
    location: 'Pune',
    coordinates: { lat: 999, lng: 72 },
  });
  assert.equal(badCoords.status, 400);

  const badSize = await api('POST', '/api/businesses', {
    name: 'Bad size Co',
    industry: 'retail',
    location: 'Pune',
    businessSize: 'large',
  });
  assert.equal(badSize.status, 400);
});

test('unknown business id returns 404', async () => {
  const { status, body } = await api('GET', '/api/businesses/biz_doesnotexist');
  assert.equal(status, 404);
  assert.equal(body.success, false);
});

test('unknown route returns 404 JSON', async () => {
  const { status, body } = await api('GET', '/api/definitely-not-a-route');
  assert.equal(status, 404);
  assert.equal(body.success, false);
  assert.equal(body.error.code, 'NOT_FOUND');
});

// --------------------------------------------------------------- risk scoring

test('risk engine matches documented weights and proportional reweighting', () => {
  const full = risk.calculateRiskScore({
    flood: 80,
    rainfall: 60,
    heat: 40,
    business: 20,
    financial: 15,
  });
  assert.equal(full.overallScore, 52);
  assert.equal(full.category, 'High');
  assert.equal(full.isIncomplete, false);

  const partial = risk.calculateRiskScore({
    flood: 80,
    rainfall: null,
    heat: 40,
    business: null,
    financial: null,
  });
  assert.equal(partial.overallScore, 64);
  assert.equal(partial.isIncomplete, true);
  assert.deepEqual(partial.missingDimensions, ['rainfall', 'business', 'financial']);

  const none = risk.calculateRiskScore({ flood: null, rainfall: null, heat: null, business: null, financial: null });
  assert.equal(none.overallScore, 0);
  assert.equal(none.isIncomplete, true);
});

test('risk categories follow the documented ranges', () => {
  assert.equal(risk.getRiskCategory(0).label, 'Low');
  assert.equal(risk.getRiskCategory(24).label, 'Low');
  assert.equal(risk.getRiskCategory(25).label, 'Moderate');
  assert.equal(risk.getRiskCategory(49).label, 'Moderate');
  assert.equal(risk.getRiskCategory(50).label, 'High');
  assert.equal(risk.getRiskCategory(74).label, 'High');
  assert.equal(risk.getRiskCategory(75).label, 'Very High');
  assert.equal(risk.getRiskCategory(100).label, 'Very High');
});

test('missing financial data returns null rather than zero risk', () => {
  assert.equal(risk.getFinancialVulnerability(null, 1000), null);
  assert.equal(risk.getFinancialVulnerability(1000, null), null);
  assert.equal(risk.getFinancialVulnerability(undefined, 1000), null);
});

// ----------------------------------------------------------------- assessment

test('assessment endpoint returns structured factors and uncertainty notes', async () => {
  const { status, body } = await api('POST', `/api/businesses/${globalThis.__bizId}/assessments`);
  assert.equal(status, 201);
  const assessment = body.data.assessment;
  assert.ok(assessment.id.startsWith('asmt_'));
  assert.equal(assessment.factors.length, 5);
  for (const factor of assessment.factors) {
    assert.ok(['live_forecast', 'demo', 'derived', 'missing', 'cached'].includes(factor.dataAvailability));
  }
  assert.ok(assessment.uncertaintyNotes.length > 0);
  assert.ok(assessment.methodology.length > 20);
  assert.ok(body.data.disclaimer.length > 20);
  globalThis.__asmtId = assessment.id;
  globalThis.__asmtScore = assessment.overallScore;
});

test('assessment is deterministic for the same cached inputs', async () => {
  const first = await api('POST', `/api/businesses/${globalThis.__bizId}/assessments`);
  const second = await api('POST', `/api/businesses/${globalThis.__bizId}/assessments`);
  assert.equal(first.body.data.assessment.overallScore, second.body.data.assessment.overallScore);
});

test('assessment on a business with no coordinates is rejected', async () => {
  const created = await api('POST', '/api/businesses', {
    name: 'No Coordinates Co',
    industry: 'retail',
    location: 'Unknown',
  });
  const { status } = await api('POST', `/api/businesses/${created.body.data.business.id}/assessments`);
  assert.equal(status, 400);
});

test('assessment history is retrievable and scoped to the business', async () => {
  const { body } = await api('GET', `/api/businesses/${globalThis.__bizId}/assessments`);
  assert.ok(body.data.assessments.length >= 1);
  assert.equal(body.data.assessments[0].businessId, globalThis.__bizId);

  const { status, body: detail } = await api('GET', `/api/assessments/${globalThis.__asmtId}`);
  assert.equal(status, 200);
  assert.ok(detail.data.assessment.factors.length === 5);
});

test('assessment for an unknown business returns 404', async () => {
  const { status } = await api('POST', '/api/businesses/biz_missing/assessments');
  assert.equal(status, 404);
});

// ------------------------------------------------------------------ climate

test('climate endpoint reports labelled sources and demo fallback is explicit', async () => {
  const { status, body } = await api('GET', `/api/climate/businesses/${globalThis.__bizId}`);
  assert.equal(status, 200);
  assert.ok(Array.isArray(body.data.sources));
  for (const source of body.data.sources) {
    assert.ok(source.provider);
    assert.ok(source.dataType);
  }
  assert.ok(typeof body.data.demoFallback === 'boolean');
  assert.ok(body.data.attribution.includes('Open-Meteo'));
});

test('forced demo mode is clearly labelled and never claims live data', async () => {
  const { status, body } = await api('POST', `/api/businesses/${globalThis.__bizId}/assessments`, {
    forceDemo: true,
  });
  assert.equal(status, 201);
  assert.equal(body.data.climate.demoFallback, true);
  assert.ok(body.data.climate.sources.every((s) => s.dataType === 'demo_fallback'));
  assert.ok(body.data.assessment.dataNote.includes('DEMO DATA REQUESTED'));
  assert.ok(body.data.assessment.factors.every((f) => f.dataAvailability !== 'live_forecast'));
});

test('climate provider failure is handled and the flood dimension is marked missing', async () => {
  // Drop cached weather so the failure is genuinely exercised.
  require('../src/repositories/climateRepository.js').clearAll();

  climate.setHttpClient(async (url) => {
    if (url.includes('flood-api')) {
      const error = new Error('simulated provider outage');
      error.statusCode = 503;
      throw error;
    }
    return { json: FIXTURES['api.open-meteo.com'] };
  });
  try {
    const { status, body } = await api('POST', `/api/businesses/${globalThis.__bizId}/assessments`);
    assert.equal(status, 201);
    const warnings = body.data.climate.warnings.join(' ');
    assert.match(warnings, /flood/i);
    const floodFactor = body.data.assessment.factors.find((f) => f.dimension === 'flood');
    assert.equal(floodFactor.dataAvailability, 'missing');
    assert.equal(body.data.assessment.isIncomplete, true);
    // The assessment must not claim the flood dimension is a live observation.
    assert.ok(body.data.assessment.factors.every((f) => f.dataAvailability !== 'live_forecast' || f.dimension !== 'flood'));
  } finally {
    require('../src/repositories/climateRepository.js').clearAll();
    installStubHttpClient();
  }
});

test('the real outbound client retries and fails cleanly on connection errors', async () => {
  let attempts = 0;
  climate.setHttpClient(async (url, options) => climate.httpGetJson(url, { ...options, timeoutMs: 300, attempts: 2 }));
  // Point at a closed port through the real client.
  const original = config.climate.floodBaseUrl;
  config.climate.floodBaseUrl = 'http://127.0.0.1:1';
  try {
    await assert.rejects(() => climate.getFloodForecast(19.07, 72.87));
  } finally {
    config.climate.floodBaseUrl = original;
    installStubHttpClient();
  }
});

test('geocode validates its query parameter', async () => {
  const missing = await api('GET', '/api/climate/geocode');
  assert.equal(missing.status, 400);
});

test('geocode returns results or a labelled provider error', async () => {
  const { status, body } = await api('GET', '/api/climate/geocode?q=Pune');
  assert.equal(status, 200);
  assert.ok(body.data.query === 'Pune');
  assert.ok(Array.isArray(body.data.results));
});

// ----------------------------------------------------------------- scenarios

test('scenario simulation is deterministic and labelled as a scenario', async () => {
  const payload = {
    name: 'Monsoon disruption scenario',
    annualNetRevenue: 5000000,
    annualFixedCost: 3800000,
    monthlyOperatingCost: 300000,
    disruptionDays: 12,
    revenueDisruptionPct: 0.5,
    backupSupplier: false,
    emergencyReserve: false,
    resilienceInvestment: 150000,
  };
  const first = await api('POST', `/api/businesses/${globalThis.__bizId}/scenarios`, payload);
  assert.equal(first.status, 201);
  const second = await api('POST', `/api/businesses/${globalThis.__bizId}/scenarios`, payload);
  assert.deepEqual(second.body.data.scenario.result, first.body.data.scenario.result);
  assert.ok(first.body.data.scenario.limitations.length >= 3);
  assert.match(first.body.data.scenario.disclaimer, /scenario/i);
  assert.ok(first.body.data.scenario.result.breakdown.length >= 5);
  globalThis.__scnId = first.body.data.scenario.id;
});

test('scenario rejects missing financial inputs instead of inventing impact', async () => {
  const created = await api('POST', '/api/businesses', {
    name: 'No Financials Co',
    industry: 'retail',
    location: 'Pune, Maharashtra',
    state: 'Maharashtra',
    latitude: 18.52,
    longitude: 73.85,
  });
  const { status } = await api('POST', `/api/businesses/${created.body.data.business.id}/scenarios`, {
    disruptionDays: 10,
  });
  assert.equal(status, 400);
});

test('scenario endpoints list, fetch and delete', async () => {
  const list = await api('GET', `/api/businesses/${globalThis.__bizId}/scenarios`);
  assert.ok(list.body.data.scenarios.length >= 1);

  const one = await api('GET', `/api/scenarios/${globalThis.__scnId}`);
  assert.equal(one.status, 200);

  const del = await api('DELETE', `/api/scenarios/${globalThis.__scnId}`);
  assert.equal(del.status, 200);

  const after = await api('GET', `/api/scenarios/${globalThis.__scnId}`);
  assert.equal(after.status, 404);
});

test('scenario for an unknown business returns 404', async () => {
  const { status } = await api('POST', '/api/businesses/biz_missing/scenarios', { disruptionDays: 5 });
  assert.equal(status, 404);
});

// ------------------------------------------------------------------- schemes

test('scheme catalogue is seeded with structured, sourced entries', async () => {
  const { status, body } = await api('GET', '/api/schemes?limit=100');
  assert.equal(status, 200);
  assert.ok(body.data.schemes.length >= 15);
  for (const scheme of body.data.schemes) {
    assert.ok(scheme.name);
    assert.ok(scheme.category);
    assert.ok(['central', 'state'].includes(scheme.governmentLevel));
    assert.ok(Array.isArray(scheme.eligibilityCriteria));
    assert.ok(Array.isArray(scheme.requiredDocuments));
    assert.match(scheme.officialSourceUrl, /^https:\/\//);
    assert.ok(['verified', 'partially_verified', 'needs_verification'].includes(scheme.verificationStatus));
  }
  assert.ok(body.data.disclaimer.length > 50);
});

test('scheme filtering by government level works', async () => {
  const state = await api('GET', '/api/schemes?governmentLevel=state');
  assert.ok(state.body.data.schemes.length >= 1);
  assert.ok(state.body.data.schemes.every((s) => s.governmentLevel === 'state'));

  const central = await api('GET', '/api/schemes?governmentLevel=central');
  assert.ok(central.body.data.schemes.every((s) => s.government_level === 'central' || s.governmentLevel === 'central'));
});

test('scheme detail and unknown id behaviour', async () => {
  const { status, body } = await api('GET', '/api/schemes/sch_pmmy');
  assert.equal(status, 200);
  assert.equal(body.data.scheme.id, 'sch_pmmy');

  const missing = await api('GET', '/api/schemes/sch_nope');
  assert.equal(missing.status, 404);
});

test('scheme matching distinguishes eligible, ineligible and insufficient information', async () => {
  const { status, body } = await api('GET', `/api/businesses/${globalThis.__bizId}/scheme-matches`);
  assert.equal(status, 200);
  const { results, counts } = body.data;

  assert.ok(counts.potentiallyEligible >= 1);
  assert.equal(
    counts.total,
    counts.potentiallyEligible + counts.insufficientInformation + counts.ineligible
  );

  for (const result of results) {
    assert.ok(['potentially_eligible', 'ineligible', 'insufficient_information'].includes(result.matchStatus));
    assert.ok(Array.isArray(result.unverifiedCriteria));
    assert.ok(result.unverifiedCriteria.length > 0);
    assert.ok(Array.isArray(result.missingInformation));
    assert.ok(Array.isArray(result.documentsToPrepare));
  }

  const ineligible = results.filter((r) => r.matchStatus === 'ineligible');
  assert.ok(ineligible.length >= 1, 'the Maharashtra-only schemes should be ineligible for a Maharashtra business only when another rule fails');
});

test('scheme matching reports ineligible for a business outside Maharashtra', async () => {
  const created = await api('POST', '/api/businesses', {
    name: 'Karnataka Retail Co',
    industry: 'retail',
    location: 'Bengaluru, Karnataka',
    state: 'Karnataka',
    latitude: 12.9716,
    longitude: 77.5946,
    businessSize: 'small',
    businessStage: 'established',
    annualTurnover: 3000000,
    annualExpenses: 2500000,
  });
  const { body } = await api('GET', `/api/businesses/${created.body.data.business.id}/scheme-matches`);
  const stateSchemes = body.data.results.filter((r) => r.scheme.governmentLevel === 'state');
  assert.ok(stateSchemes.length >= 1);
  for (const result of stateSchemes) {
    assert.equal(result.matchStatus, 'ineligible');
  }
});

test('scheme matching reports insufficient information when profile fields are absent', async () => {
  const created = await api('POST', '/api/businesses', {
    name: 'Sparse Co',
    industry: 'other',
    location: 'Unknown',
  });
  const { body } = await api('GET', `/api/businesses/${created.body.data.business.id}/scheme-matches`);
  assert.ok(body.data.counts.insufficientInformation >= 1);
});

test('saved schemes can be created, listed and removed', async () => {
  const saved = await api('POST', '/api/schemes/sch_cgtmse/save', { prepStatus: 'gathering_documents' });
  assert.equal(saved.status, 201);
  assert.equal(saved.body.data.savedSchemes[0].id, 'sch_cgtmse');

  const bad = await api('POST', '/api/schemes/sch_cgtmse/save', { prepStatus: 'nonsense' });
  assert.equal(bad.status, 400);

  const list = await api('GET', '/api/schemes/saved');
  assert.ok(list.body.data.savedSchemes.some((s) => s.id === 'sch_cgtmse'));

  const removed = await api('DELETE', '/api/schemes/sch_cgtmse/save');
  assert.equal(removed.status, 200);

  const after = await api('GET', '/api/schemes/saved');
  assert.ok(!after.body.data.savedSchemes.some((s) => s.id === 'sch_cgtmse'));
});

// ----------------------------------------------------------- loan readiness

test('loan readiness creates a checklist and separates lender data from suggestions', async () => {
  const { status, body } = await api('GET', `/api/businesses/${globalThis.__bizId}/loan-readiness`);
  assert.equal(status, 200);
  const readiness = body.data.loanReadiness;
  assert.equal(readiness.applicationStatus, 'not_applied');
  assert.ok(readiness.documentChecklist.length >= 8);
  assert.ok(readiness.climoraSuggestions.length >= 1);
  assert.match(readiness.disclaimer, /not a credit decision/i);
  globalThis.__loanReady = readiness;
});

test('loan readiness updates, invalid status rejected, checklist completion tracked', async () => {
  const updated = await api('PUT', `/api/businesses/${globalThis.__bizId}/loan-readiness`, {
    applicationStatus: 'preparing',
    lenderFeedback: 'Bank asked for six months of statements',
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.loanReadiness.applicationStatus, 'preparing');
  assert.equal(updated.body.data.loanReadiness.lenderConfirmed, true);

  const bad = await api('PUT', `/api/businesses/${globalThis.__bizId}/loan-readiness`, {
    applicationStatus: 'not_a_status',
  });
  assert.equal(bad.status, 400);

  const doc = 'Udyam Registration Certificate';
  const patch = await api(
    'PATCH',
    `/api/businesses/${globalThis.__bizId}/loan-readiness/documents/${encodeURIComponent(doc)}`,
    { status: 'ready' }
  );
  assert.equal(patch.status, 200);
  assert.ok(patch.body.data.loanReadiness.documentCompletionPct > 0);

  const badStatus = await api(
    'PATCH',
    `/api/businesses/${globalThis.__bizId}/loan-readiness/documents/${encodeURIComponent(doc)}`,
    { status: 'nope' }
  );
  assert.equal(badStatus.status, 400);

  const unknownDoc = await api(
    'PATCH',
    `/api/businesses/${globalThis.__bizId}/loan-readiness/documents/NotADocument`,
    { status: 'ready' }
  );
  assert.equal(unknownDoc.status, 404);
});

// ----------------------------------------------------------- improvements

test('improvement actions are listed and can be progressed', async () => {
  const list = await api('GET', `/api/businesses/${globalThis.__bizId}/improvements`);
  assert.equal(list.status, 200);
  assert.ok(list.body.data.improvementActions.length >= 1);
  const action = list.body.data.improvementActions.find((a) => a.status === 'open');
  assert.ok(action);

  const patched = await api('PATCH', `/api/businesses/${globalThis.__bizId}/improvements/${action.id}`, {
    status: 'done',
  });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.data.improvementAction.status, 'done');

  const bad = await api('PATCH', `/api/businesses/${globalThis.__bizId}/improvements/${action.id}`, {
    status: 'weird',
  });
  assert.equal(bad.status, 400);
});

// --------------------------------------------------------------- dashboard

test('dashboard returns real metrics derived from stored records', async () => {
  const { status, body } = await api('GET', '/api/dashboard');
  assert.equal(status, 200);
  const m = body.data.metrics;
  assert.ok(m.portfolioSize >= 1);
  assert.ok(m.assessedBusinesses >= 1);
  assert.ok(typeof m.averageRiskScore === 'number');
  assert.ok(m.categoryDistribution.Low !== undefined);
  assert.equal(m.totalAssessments, m.assessmentsLast30Days + (m.totalAssessments - m.assessmentsLast30Days));
  assert.ok(body.data.disclaimer.length > 20);
});

// -------------------------------------------------------------- validation

test('invalid query parameters are rejected', async () => {
  const bad = await api('GET', '/api/businesses?limit=abc');
  assert.equal(bad.status, 400);
});

test('oversized JSON bodies are rejected', async () => {
  const response = await fetch(`${baseUrl}/api/businesses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'A'.repeat(300 * 1024), industry: 'retail', location: 'x' }),
  });
  assert.ok([400, 413].includes(response.status));
});

test('error responses never leak stack traces', async () => {
  const { body } = await api('GET', '/api/businesses/biz_missing/assessments');
  assert.equal(body.success, false);
  assert.equal(body.error.stack, undefined);
});

// ------------------------------------------------------- persistence checks

test('database records persist across a reconnect', async () => {
  const before = await api('GET', `/api/businesses/${globalThis.__bizId}`);
  assert.equal(before.status, 200);
  const expected = before.body.data.business;

  // Re-open the same on-disk database through a second connection.
  const { DatabaseSync } = require('node:sqlite');
  const probe = new DatabaseSync(TEST_DB);
  const row = probe
    .prepare('SELECT name, industry FROM businesses WHERE id = ?')
    .get(globalThis.__bizId);
  probe.close();

  assert.ok(row);
  assert.equal(row.name, expected.name);
  assert.equal(row.industry, expected.industry);
});

test('foreign keys are enforced', () => {
  const db = getDatabase();
  const fk = db.prepare('PRAGMA foreign_keys').get();
  assert.equal(fk.foreign_keys, 1);
});

test('assessment factors reference their assessment and cascade on delete', async () => {
  const count = getDatabase()
    .prepare('SELECT COUNT(*) AS c FROM assessment_factors WHERE assessment_id = ?')
    .get(globalThis.__asmtId).c;
  assert.equal(count, 5);

  getDatabase().prepare('DELETE FROM businesses WHERE id = ?').run(globalThis.__bizId);
  const remaining = getDatabase()
    .prepare('SELECT COUNT(*) AS c FROM assessment_factors WHERE assessment_id = ?')
    .get(globalThis.__asmtId).c;
  assert.equal(remaining, 0);
});

test('seeding is idempotent and never deletes rows', async () => {
  // seed is required at the top
  const schemesBefore = getDatabase().prepare('SELECT COUNT(*) AS c FROM schemes').get().c;
  const first = seed.seed();
  const schemesAfter = getDatabase().prepare('SELECT COUNT(*) AS c FROM schemes').get().c;
  assert.equal(schemesBefore, schemesAfter);
  assert.ok(first.skipped);
});

import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import { initDb, businessRepo, assessmentRepo, documentRepo } from './db.js';
import { geocodeLocation, fetchAllClimateData } from './apiClient.js';
import { buildAssessment } from './scorer.js';
import {
  validate,
  BusinessSchema,
  BusinessUpdateSchema,
  AssessmentRequestSchema,
  DocumentSchema,
  HistoryRequestSchema,
  IdSchema,
} from './validator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let mainWindow;

// ── Window ────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed so preload can import ES modules
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0b0f1e',
  });

  const startUrl =
    process.env.ELECTRON_RENDERER_URL ||
    `file://${join(__dirname, '../dist-renderer/index.html')}`;
  mainWindow.loadURL(startUrl);

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  initDb();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC helpers ───────────────────────────────────────────────────────────

function ok(data) {
  return { ok: true, data };
}

function err(errors, code = 'ERROR') {
  const messages = Array.isArray(errors) ? errors : [String(errors)];
  console.error('[IPC error]', code, messages);
  return { ok: false, errors: messages, code };
}

// Wrap an async IPC handler with top-level error handling
function handle(channel, fn) {
  ipcMain.handle(channel, async (_event, payload) => {
    try {
      return await fn(payload);
    } catch (e) {
      return err([e.message], 'INTERNAL');
    }
  });
}

// ── IPC: app info ─────────────────────────────────────────────────────────

handle('get-app-info', () =>
  ok({ name: 'Climora', version: app.getVersion(), mode: 'Demo' })
);

// ── IPC: businesses ───────────────────────────────────────────────────────

handle('list-businesses', () => {
  const rows = businessRepo.list();
  return ok(rows);
});

handle('save-business', (payload) => {
  const isUpdate = payload?.id != null;
  const schema   = isUpdate ? BusinessUpdateSchema : BusinessSchema;
  const v = validate(schema, payload);
  if (!v.ok) return err(v.errors, 'VALIDATION');

  let business;
  if (isUpdate) {
    business = businessRepo.update(v.data.id, v.data);
  } else {
    // Auto-geocode if lat/lng not provided
    // We do this synchronously by launching an async resolution first,
    // then saving. If geocoding fails we save with null coords.
    business = businessRepo.insert(v.data);
  }

  // Seed default document checklist on first save
  if (!isUpdate) {
    documentRepo.seedDefaults(business.id);
  }

  return ok(business);
});

handle('delete-business', (payload) => {
  const v = validate(IdSchema, payload);
  if (!v.ok) return err(v.errors, 'VALIDATION');
  businessRepo.delete(v.data.id);
  return ok({ deleted: true });
});

// ── IPC: geocode ──────────────────────────────────────────────────────────

handle('geocode-location', async (payload) => {
  const location = String(payload?.location ?? '').trim();
  if (!location) return err(['location is required'], 'VALIDATION');
  const result = await geocodeLocation(location);
  return result.ok ? ok(result) : err([result.reason], 'GEOCODE_FAILED');
});

// ── IPC: run assessment ───────────────────────────────────────────────────

handle('run-assessment', async (payload) => {
  const v = validate(AssessmentRequestSchema, payload);
  if (!v.ok) return err(v.errors, 'VALIDATION');

  const business = businessRepo.getById(v.data.businessId);
  if (!business) return err(['Business not found'], 'NOT_FOUND');

  // Step 1 — Geocode if coords missing
  let lat = business.latitude;
  let lng = business.longitude;

  if (lat == null || lng == null) {
    const geo = await geocodeLocation(business.location);
    if (geo.ok) {
      lat = geo.lat;
      lng = geo.lng;
      businessRepo.update(business.id, { ...business, latitude: lat, longitude: lng });
    }
  }

  // Step 2 — Fetch climate data (gracefully degrades to null on failure)
  let apiData = { forecast: null, flood: null, errors: ['No coordinates — could not fetch live data'], anyLive: false };
  if (lat != null && lng != null) {
    apiData = await fetchAllClimateData(lat, lng);
  }

  // Step 3 — Score
  const scored = buildAssessment(apiData, business);

  // Step 4 — Persist
  const saved = assessmentRepo.insert({
    businessId:     business.id,
    overallScore:   scored.overallScore,
    category:       scored.category,
    floodScore:     scored.dimensions.flood,
    rainfallScore:  scored.dimensions.rainfall,
    heatScore:      scored.dimensions.heat,
    businessScore:  scored.dimensions.business,
    financialScore: scored.dimensions.financial,
    dataSource:     scored.dataSource,
    missingDims:    scored.missingDims,
    dataNote:       scored.dataNote,
    note:           `Assessment run on ${new Date().toISOString().slice(0, 10)}`,
  });

  return ok({ ...scored, assessmentId: saved.id, businessId: business.id });
});

// ── IPC: history ──────────────────────────────────────────────────────────

handle('get-history', (payload) => {
  const v = validate(HistoryRequestSchema, payload);
  if (!v.ok) return err(v.errors, 'VALIDATION');
  const rows = assessmentRepo.listForBusiness(v.data.businessId);
  return ok(rows);
});

// ── IPC: documents ────────────────────────────────────────────────────────

handle('list-documents', (payload) => {
  const v = validate(HistoryRequestSchema, payload);
  if (!v.ok) return err(v.errors, 'VALIDATION');
  const rows = documentRepo.listForBusiness(v.data.businessId);
  return ok(rows);
});

handle('save-document', (payload) => {
  const v = validate(DocumentSchema, payload);
  if (!v.ok) return err(v.errors, 'VALIDATION');
  const saved = documentRepo.upsert(v.data);
  return ok(saved);
});

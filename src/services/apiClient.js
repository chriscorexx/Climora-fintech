/**
 * API client for the Climora backend.
 *
 * Talks to the Express API documented in backend/API.md. Every response uses
 * the envelope { success: true, data } / { success: false, error }, which this
 * module unwraps so callers receive plain payloads.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000);

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status ?? null;
    this.code = code ?? null;
    this.details = details ?? null;
  }

  /** Network/offline condition rather than a server-reported failure. */
  get isNetworkError() {
    return this.status === null;
  }

  get isOffline() {
    return this.isNetworkError;
  }
}

function buildQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, typeof value === 'boolean' ? String(value) : value);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function request(path, { method = 'GET', body, params, timeout = DEFAULT_TIMEOUT_MS, signal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  try {
    const response = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    let payload = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        throw new ApiError(`Unexpected non-JSON response from ${path}`, { status: response.status });
      }
    }

    if (!response.ok || payload?.success === false) {
      const error = payload?.error || {};
      throw new ApiError(error.message || `Request failed (${response.status}) for ${path}`, {
        status: response.status,
        code: error.code || null,
        details: error.details || null,
      });
    }

    return payload?.data ?? null;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err?.name === 'AbortError') {
      throw new ApiError(
        signal?.aborted ? 'Request cancelled' : `Request timed out after ${timeout}ms: ${path}`,
        { status: null, code: 'timeout' }
      );
    }
    throw new ApiError(
      `Cannot reach the Climora backend at ${BASE_URL}. Is it running (npm start in backend/)?`,
      { status: null, code: 'network' }
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

export const api = {
  // ── health / config ────────────────────────────────────────────────
  health: () => request('/health', { timeout: 8000 }),
  config: () => request('/config'),

  // ── businesses ──────────────────────────────────────────────────────
  listBusinesses: (params) => request('/businesses', { params }),
  getBusiness: (id) => request(`/businesses/${encodeURIComponent(id)}`),
  createBusiness: (body) => request('/businesses', { method: 'POST', body }),
  updateBusiness: (id, body) => request(`/businesses/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
  deleteBusiness: (id) => request(`/businesses/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // ── assessments ─────────────────────────────────────────────────────
  listAssessments: (params) => request('/assessments', { params }),
  getAssessment: (id) => request(`/assessments/${encodeURIComponent(id)}`),
  listBusinessAssessments: (id, params) =>
    request(`/businesses/${encodeURIComponent(id)}/assessments`, { params }),
  createAssessment: (id, { forceDemo = false } = {}) =>
    request(`/businesses/${encodeURIComponent(id)}/assessments`, {
      method: 'POST',
      body: { forceDemo },
      timeout: 30000,
    }),

  // ── climate ─────────────────────────────────────────────────────────
  geocode: (q) => request('/climate/geocode', { params: { q } }),
  businessClimate: (id) => request(`/climate/businesses/${encodeURIComponent(id)}`, { timeout: 30000 }),

  // ── scenarios ───────────────────────────────────────────────────────
  listScenarios: (id) => request(`/businesses/${encodeURIComponent(id)}/scenarios`),
  getScenario: (id) => request(`/scenarios/${encodeURIComponent(id)}`),
  createScenario: (id, body) => request(`/businesses/${encodeURIComponent(id)}/scenarios`, { method: 'POST', body }),
  deleteScenario: (id) => request(`/scenarios/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // ── schemes ─────────────────────────────────────────────────────────
  listSchemes: (params) => request('/schemes', { params }),
  getScheme: (id) => request(`/schemes/${encodeURIComponent(id)}`),
  savedSchemes: () => request('/schemes/saved'),
  matchSchemes: (id) => request(`/businesses/${encodeURIComponent(id)}/scheme-matches`),
  saveScheme: (id, body) => request(`/schemes/${encodeURIComponent(id)}/save`, { method: 'POST', body }),
  unsaveScheme: (id) => request(`/schemes/${encodeURIComponent(id)}/save`, { method: 'DELETE' }),

  // ── loan readiness / improvements ───────────────────────────────────
  loanReadiness: (id) => request(`/businesses/${encodeURIComponent(id)}/loan-readiness`),
  updateReadiness: (id, body) =>
    request(`/businesses/${encodeURIComponent(id)}/loan-readiness`, { method: 'PUT', body }),
  updateDocumentStatus: (id, documentName, status) =>
    request(`/businesses/${encodeURIComponent(id)}/loan-readiness/documents/${encodeURIComponent(documentName)}`, {
      method: 'PATCH',
      body: { status },
    }),
  improvements: (id) => request(`/businesses/${encodeURIComponent(id)}/improvements`),
  generateImprovements: (id) => request(`/businesses/${encodeURIComponent(id)}/improvements`, { method: 'POST' }),
  updateImprovement: (id, actionId, status) =>
    request(`/businesses/${encodeURIComponent(id)}/improvements/${encodeURIComponent(actionId)}`, {
      method: 'PATCH',
      body: { status },
    }),

  // ── dashboard ───────────────────────────────────────────────────────
  dashboard: () => request('/dashboard'),
};

export { BASE_URL as API_BASE_URL };

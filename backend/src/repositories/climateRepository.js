'use strict';

const { getDatabase, sanitize } = require('../db/index.js');
const { nowIso } = require('../middleware/asyncHandler.js');

const CACHE_TTL_MS_FLOOR = 60 * 1000;

function findFresh(cacheKey, ttlMinutes) {
  const ttlMs = Math.max(CACHE_TTL_MS_FLOOR, ttlMinutes * 60 * 1000);
  const row = getDatabase()
    .prepare(
      `SELECT * FROM climate_observations
       WHERE cache_key = ? AND datetime(expires_at) > datetime('now')`
    )
    .get(cacheKey);

  if (!row) return null;

  // Guard against an in-process stale entry when ttl was overridden to a tiny value.
  if (Date.now() - Date.parse(row.fetched_at) > ttlMs) return null;

  return {
    cached: true,
    kind: row.kind,
    provider: row.provider,
    dataType: row.data_type,
    sourceTime: row.source_time,
    fetchedAt: row.fetched_at,
    payload: JSON.parse(row.payload),
  };
}

function findStale(cacheKey) {
  const row = getDatabase()
    .prepare('SELECT * FROM climate_observations WHERE cache_key = ?')
    .get(cacheKey);
  if (!row) return null;
  return {
    cached: true,
    stale: true,
    kind: row.kind,
    provider: row.provider,
    dataType: row.data_type,
    sourceTime: row.source_time,
    fetchedAt: row.fetched_at,
    payload: JSON.parse(row.payload),
  };
}

function save(record) {
  getDatabase()
    .prepare(
      `INSERT INTO climate_observations
        (business_id, cache_key, kind, provider, data_type, latitude, longitude, payload, source_time, fetched_at, expires_at)
       VALUES (@businessId, @cacheKey, @kind, @provider, @dataType, @latitude, @longitude, @payload, @sourceTime, @fetchedAt, @expiresAt)
       ON CONFLICT(cache_key) DO UPDATE SET
        payload = excluded.payload,
        source_time = excluded.source_time,
        fetched_at = excluded.fetched_at,
        expires_at = excluded.expires_at`
    )
    .run(sanitize(record));
}

function buildRecord({ cacheKey, businessId, kind, provider, dataType, latitude, longitude, payload, sourceTime, ttlMinutes }) {
  const fetchedAt = nowIso();
  return {
    cacheKey,
    businessId: businessId || null,
    kind,
    provider,
    dataType,
    latitude,
    longitude,
    payload: JSON.stringify(payload),
    sourceTime: sourceTime || null,
    fetchedAt,
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString(),
  };
}

function pruneExpired() {
  getDatabase()
    .prepare(`DELETE FROM climate_observations WHERE datetime(expires_at) < datetime('now', '-7 days')`)
    .run();
}

function listForBusiness(businessId) {
  return getDatabase()
    .prepare(
      `SELECT kind, provider, data_type, source_time, fetched_at, expires_at
       FROM climate_observations WHERE business_id = ? ORDER BY fetched_at DESC`
    )
    .all(businessId);
}

/** Test/admin helper: drop all cached climate payloads. */
function clearAll() {
  getDatabase().prepare('DELETE FROM climate_observations').run();
}

module.exports = { findFresh, findStale, save, buildRecord, pruneExpired, listForBusiness, clearAll };

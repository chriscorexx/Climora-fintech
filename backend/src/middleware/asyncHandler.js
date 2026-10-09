'use strict';

const { randomUUID } = require('node:crypto');

/**
 * Wraps an async route handler so rejected promises reach the error middleware.
 */
function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/**
 * Terminal error handler. Never leaks stack traces or SQL errors to clients.
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = Number.isInteger(err.status) ? err.status : 500;
  const isServerError = status >= 500;

  if (isServerError) {
    console.error('[climora] unhandled error:', err);
  }

  res.status(status).json({
    success: false,
    error: {
      message: isServerError
        ? 'Internal server error'
        : err.message || 'Request failed',
      code: err.code || (isServerError ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
      ...(err.details ? { details: err.details } : {}),
    },
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
      code: 'NOT_FOUND',
    },
  });
}

/**
 * Builds an error carrying an HTTP status code.
 */
function httpError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  error.code = status === 404 ? 'NOT_FOUND' : 'BAD_REQUEST';
  if (details) error.details = details;
  return error;
}

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

/**
 * Small helper producing stable, readable ids such as `biz_8f3a...`.
 */
function createId(prefix) {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = {
  asyncHandler,
  errorHandler,
  notFoundHandler,
  httpError,
  ok,
  createId,
  nowIso,
  todayIsoDate,
};

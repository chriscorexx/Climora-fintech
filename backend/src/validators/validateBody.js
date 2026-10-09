'use strict';

const { httpError } = require('../middleware/asyncHandler.js');

/**
 * Minimal, dependency-free request validation.
 *
 * Each rule is `[field, { type, required, min, max, allowed, label }]`.
 * Supported types: string, number, boolean, integer, coordinates, jsonArray.
 */
function validateBody(rules) {
  return function run(req, res, next) {
    const errors = [];
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    for (const rule of rules) {
      const [field, spec] = Array.isArray(rule) ? rule : [rule, {}];
      const label = spec.label || field;
      const raw = body[field];
      const present = raw !== undefined && raw !== null && raw !== '';

      if (!present) {
        if (spec.required) errors.push(`${label} is required`);
        continue;
      }

      switch (spec.type) {
        case 'string': {
          if (typeof raw !== 'string') {
            errors.push(`${label} must be a string`);
            break;
          }
          const value = raw.trim();
          if (spec.minLength && value.length < spec.minLength) {
            errors.push(`${label} must be at least ${spec.minLength} characters`);
          }
          if (spec.maxLength && value.length > spec.maxLength) {
            errors.push(`${label} must be at most ${spec.maxLength} characters`);
          }
          if (spec.allowed && !spec.allowed.includes(value)) {
            errors.push(`${label} must be one of: ${spec.allowed.join(', ')}`);
          }
          break;
        }
        case 'number': {
          if (typeof raw !== 'number' || Number.isNaN(raw)) {
            errors.push(`${label} must be a number`);
            break;
          }
          if (!Number.isFinite(raw)) {
            errors.push(`${label} must be a finite number`);
            break;
          }
          if (spec.min !== undefined && raw < spec.min) {
            errors.push(`${label} must be at least ${spec.min}`);
          }
          if (spec.max !== undefined && raw > spec.max) {
            errors.push(`${label} must be at most ${spec.max}`);
          }
          break;
        }
        case 'integer': {
          if (typeof raw !== 'number' || !Number.isInteger(raw)) {
            errors.push(`${label} must be an integer`);
            break;
          }
          if (spec.min !== undefined && raw < spec.min) {
            errors.push(`${label} must be at least ${spec.min}`);
          }
          if (spec.max !== undefined && raw > spec.max) {
            errors.push(`${label} must be at most ${spec.max}`);
          }
          break;
        }
        case 'boolean': {
          if (typeof raw !== 'boolean') errors.push(`${label} must be true or false`);
          break;
        }
        case 'date': {
          if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
            errors.push(`${label} must be an ISO date (YYYY-MM-DD)`);
          }
          break;
        }
        default:
          break;
      }
    }

    if (errors.length > 0) {
      return next(httpError(400, 'Validation failed', errors));
    }
    return next();
  };
}

module.exports = { validateBody };

/**
 * electron/validator.js
 * Zod schemas for all IPC input validation.
 * Runs in the main process — never trust renderer-side data.
 */

import { z } from 'zod';

// ── Business profile schema ───────────────────────────────────────────────

export const BusinessSchema = z.object({
  name:             z.string().min(1, 'Business name is required').max(200),
  sector:           z.enum([
    'retail', 'manufacturing', 'agriculture', 'food_processing',
    'hospitality', 'construction', 'services', 'logistics',
  ]),
  location:         z.string().min(1, 'Location is required').max(300),
  latitude:         z.number().min(-90).max(90).nullable().optional(),
  longitude:        z.number().min(-180).max(180).nullable().optional(),
  employeeCount:    z.number().int().min(0).max(100000).nullable().optional(),
  revenue:          z.number().min(0).nullable().optional(),
  expenses:         z.number().min(0).nullable().optional(),
  debtObligations:  z.number().min(0).nullable().optional(),
  emergencyReserve: z.number().min(0).nullable().optional(),
});

export const BusinessUpdateSchema = BusinessSchema.partial().extend({
  id: z.number().int().positive(),
});

// ── Assessment request schema ─────────────────────────────────────────────

export const AssessmentRequestSchema = z.object({
  businessId: z.number().int().positive(),
  forceRefresh: z.boolean().optional().default(false),
});

// ── Document schema ───────────────────────────────────────────────────────

export const DocumentSchema = z.object({
  id:           z.number().int().positive().optional(),
  businessId:   z.number().int().positive(),
  name:         z.string().min(1).max(300),
  category:     z.enum(['Financial', 'Legal', 'Climate', 'Debt', 'General']).default('General'),
  status:       z.enum(['Not Ready', 'In Progress', 'Ready']).default('Not Ready'),
  linkedAction: z.string().nullable().optional(),
});

// ── History request schema ────────────────────────────────────────────────

export const HistoryRequestSchema = z.object({
  businessId: z.number().int().positive(),
});

// ── Delete schema ─────────────────────────────────────────────────────────

export const IdSchema = z.object({
  id: z.number().int().positive(),
});

// ── Helper ────────────────────────────────────────────────────────────────

/**
 * Validate data against a schema.
 * Returns { ok, data, errors }.
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data, errors: [] };
  const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
  return { ok: false, data: null, errors };
}

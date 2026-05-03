/**
 * SALERY — Security Middleware Bundle
 * - Rate limiting per route type
 * - Zod validation middleware factory
 * - companyId guard
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z, ZodSchema } from 'zod';

// ─── Rate Limiters ────────────────────────────────────────────────────────────

/** Auth endpoints: 50 requests / 15 min (Relaxed for dev) */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/** Badge scan: 60 scans / min (real clock-in cadence) */
export const scanLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: 'Too many scan requests. Slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/** General API: 200 req / min */
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { error: 'Too many requests. Please wait a moment.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Zod Validation Middleware ────────────────────────────────────────────────

/**
 * Factory: validates req.body against a Zod schema.
 * 400 with descriptive errors if invalid.
 */
export const validate = (schema: ZodSchema) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
            return res.status(400).json({ error: 'Validation failed', details: errors });
        }
        req.body = result.data;
        next();
    };

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

export const employeeCreateSchema = z.object({
    firstName: z.string().min(1, 'firstName required').max(100),
    lastName: z.string().min(1, 'lastName required').max(100),
    email: z.string().email('Invalid email').optional().nullable(),
    phone: z.string().max(30).optional().nullable(),
    position: z.string().min(1, 'position required').max(200),
    baseSalary: z.number({ coerce: true }).min(0, 'baseSalary must be >= 0'),
    salaryType: z.enum(['MONTHLY', 'HOURLY']).default('MONTHLY'),
    hireDate: z.string().datetime({ offset: true }).optional(),
});

export const employeePatchSchema = z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().max(30).optional().nullable(),
    position: z.string().min(1).max(200).optional(),
    baseSalary: z.number({ coerce: true }).min(0).optional(),
    salaryType: z.enum(['MONTHLY', 'HOURLY']).optional(),
    hireDate: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, { message: 'At least one field required' });

export const leaveCreateSchema = z.object({
    employeeId: z.string().uuid(),
    type: z.enum(['CONGE_ANNUEL', 'MALADIE', 'MATERNITE', 'PATERNITE', 'SANS_SOLDE', 'AUTRE']).default('CONGE_ANNUEL'),
    startDate: z.string().datetime({ offset: true }),
    endDate: z.string().datetime({ offset: true }),
    reason: z.string().max(1000).optional().nullable(),
});

export const siteCreateSchema = z.object({
    name: z.string().min(1, 'name required').max(200),
    city: z.string().max(100).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    phone: z.string().max(30).optional().nullable(),
    manager: z.string().max(200).optional().nullable(),
});

export const primeCreateSchema = z.object({
    name: z.string().min(1, 'name required').max(200),
    amount: z.number({ coerce: true }).min(0),
    isSoumisCnss: z.boolean().default(false),
    isRecurring: z.boolean().default(true),
    description: z.string().max(500).optional().nullable(),
});

export const attendanceManualSchema = z.object({
    employeeId: z.string().uuid(),
    date: z.string(),
    checkIn: z.string(),
    checkOut: z.string().optional().nullable(),
});

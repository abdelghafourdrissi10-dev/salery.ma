/**
 * SALERY — Primes / Bonuses Module (API-first, no localStorage)
 * Full CRUD: GET / POST / PATCH / DELETE
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard, validateTenantResource } from '../../middleware/tenant.middleware';
import { validate, primeCreateSchema } from '../../middleware/security.middleware';
import { prisma } from '../../prisma';


const router = Router();

// ─── GET all primes for a company (Tenant Locked) ─────────────────────────────
router.get('/', authenticate, tenantGuard, async (req, res, next) => {
    try {
        const companyId = req.tenantId!;
        const primes = await prisma.prime.findMany({
            where: { companyId: companyId! },
            orderBy: { createdAt: 'desc' },
        });
        res.json(primes);
    } catch (e) { next(e); }
});

// ─── GET single prime (Tenant Locked) ─────────────────────────────────────────
router.get('/:id', authenticate, tenantGuard, async (req, res, next) => {
    try {
        const prime = await prisma.prime.findUnique({ 
            where: { id: req.params.id, companyId: req.tenantId! } 
        });
        if (!prime) return res.status(404).json({ error: 'Prime not found' });
        res.json(prime);
    } catch (e) { next(e); }
});

// ─── POST create prime (Tenant Locked) ────────────────────────────────────────
router.post('/', authenticate, tenantGuard, validate(primeCreateSchema), async (req, res, next) => {
    try {
        const companyId = req.tenantId!;
        const { name, amount, isSoumisCnss, isRecurring, description } = req.body;

        if (!name || amount === undefined) {
            return res.status(400).json({ error: 'name and amount are required' });
        }

        const prime = await prisma.prime.create({
            data: {
                name,
                amount: Number(amount),
                isSoumisCnss: isSoumisCnss ?? false,
                isRecurring: isRecurring ?? true,
                description: description || null,
                companyId: companyId!,
            },
        });
        res.status(201).json(prime);
    } catch (e) { next(e); }
});

// ─── PATCH update prime (Tenant Locked) ───────────────────────────────────────
router.patch('/:id', authenticate, tenantGuard, validateTenantResource(prisma.prime), async (req, res, next) => {
    try {
        const { name, amount, isSoumisCnss, isRecurring, description } = req.body;
        const updated = await prisma.prime.update({
            where: { id: req.params.id, companyId: req.tenantId! },
            data: {
                ...(name && { name }),
                ...(amount !== undefined && { amount: Number(amount) }),
                ...(isSoumisCnss !== undefined && { isSoumisCnss }),
                ...(isRecurring !== undefined && { isRecurring }),
                ...(description !== undefined && { description }),
            },
        });
        res.json(updated);
    } catch (e) { next(e); }
});

// ─── DELETE prime (Tenant Locked) ─────────────────────────────────────────────
router.delete('/:id', authenticate, tenantGuard, validateTenantResource(prisma.prime), async (req, res, next) => {
    try {
        await prisma.prime.delete({ where: { id: req.params.id, companyId: req.tenantId! } });
        res.json({ success: true });
    } catch (e) { next(e); }
});

export const primesRoutes = router;

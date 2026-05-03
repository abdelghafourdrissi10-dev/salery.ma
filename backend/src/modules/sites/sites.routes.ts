/**
 * SALERY — Sites / Branches Module (API-first, no localStorage)
 * Full CRUD: GET / POST / PATCH / DELETE + employee assignments
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { prisma } from '../../prisma';

const router = Router();

// ─── GET all sites for company ────────────────────────────────────────────────
router.get('/', authenticate, async (req, res, next) => {
    try {
        const companyId = req.user?.companyId;
        const sites = await prisma.site.findMany({
            where: { companyId: companyId! },
            include: {
                employees: {
                    where: { isActive: true },
                    include: { employee: { select: { id: true, firstName: true, lastName: true, position: true } } },
                },
                primes: {
                    where: { isActive: true },
                    include: { prime: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(sites);
    } catch (e) { next(e); }
});

// ─── GET single site ──────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const site = await prisma.site.findUnique({
            where: { id: req.params.id },
            include: {
                employees: { include: { employee: true } },
                primes: { include: { prime: true } },
            },
        });
        if (!site) return res.status(404).json({ error: 'Site not found' });
        res.json(site);
    } catch (e) { next(e); }
});

// ─── POST create site ─────────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res, next) => {
    try {
        const companyId = req.user?.companyId;
        const { name, city, address, phone, manager } = req.body;

        if (!name) return res.status(400).json({ error: 'name is required' });

        const site = await prisma.site.create({
            data: { name, city, address, phone, manager, companyId: companyId! },
        });
        res.status(201).json(site);
    } catch (e) { next(e); }
});

// ─── PATCH update site ────────────────────────────────────────────────────────
router.patch('/:id', authenticate, async (req, res, next) => {
    try {
        const { name, city, address, phone, manager, isActive } = req.body;
        const updated = await prisma.site.update({
            where: { id: req.params.id },
            data: {
                ...(name && { name }),
                ...(city !== undefined && { city }),
                ...(address !== undefined && { address }),
                ...(phone !== undefined && { phone }),
                ...(manager !== undefined && { manager }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        res.json(updated);
    } catch (e) { next(e); }
});

// ─── DELETE site ──────────────────────────────────────────────────────────────
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        await prisma.site.update({ where: { id: req.params.id }, data: { isActive: false } });
        res.json({ success: true });
    } catch (e) { next(e); }
});

// ─── POST assign employee to site ─────────────────────────────────────────────
router.post('/:id/employees', authenticate, async (req, res, next) => {
    try {
        const { employeeId } = req.body;
        if (!employeeId) return res.status(400).json({ error: 'employeeId required' });

        const assignment = await prisma.siteEmployee.upsert({
            where: { siteId_employeeId: { siteId: req.params.id, employeeId } },
            create: { siteId: req.params.id, employeeId, isActive: true },
            update: { isActive: true },
        });
        res.status(201).json(assignment);
    } catch (e) { next(e); }
});

// ─── DELETE unassign employee from site ───────────────────────────────────────
router.delete('/:id/employees/:employeeId', authenticate, async (req, res, next) => {
    try {
        await prisma.siteEmployee.updateMany({
            where: { siteId: req.params.id, employeeId: req.params.employeeId },
            data: { isActive: false },
        });
        res.json({ success: true });
    } catch (e) { next(e); }
});

export const sitesRoutes = router;

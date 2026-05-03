/**
 * SALERY — Leaves Module (API-first, no localStorage)
 * Full CRUD: GET / POST / PATCH / DELETE
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard, validateTenantResource } from '../../middleware/tenant.middleware';
import { validate, leaveCreateSchema } from '../../middleware/security.middleware';
import { prisma } from '../../prisma';
import { LeavesService } from './leaves.service';
import { requireRole } from '../../middleware/rbac.middleware';
import { checkSubscription } from '../../middleware/subscription.middleware';


const router = Router();

// ─── GET all leaves for a company (Tenant Locked) ────────────────────────────
router.get('/', authenticate, tenantGuard, async (req, res, next) => {
    try {
        const companyId = req.tenantId!;
        const { status, employeeId, month } = req.query;

        const where: any = { companyId };
        if (status) where.status = status;
        if (employeeId) where.employeeId = String(employeeId);
        if (month) {
            const [year, m] = String(month).split('-');
            const start = new Date(Number(year), Number(m) - 1, 1);
            const end = new Date(Number(year), Number(m), 1);
            where.startDate = { gte: start, lt: end };
        }

        const leaves = await prisma.leave.findMany({
            where,
            include: { employee: { select: { firstName: true, lastName: true, position: true } } },
            orderBy: { createdAt: 'desc' },
        });

        res.json(leaves);
    } catch (e) { next(e); }
});

// ─── GET single leave (Tenant Locked) ─────────────────────────────────────────
router.get('/:id', authenticate, tenantGuard, async (req, res, next) => {
    try {
        const leave = await prisma.leave.findUnique({
            where: { id: req.params.id, companyId: req.tenantId! },
            include: { employee: { select: { firstName: true, lastName: true } } },
        });
        if (!leave) return res.status(404).json({ error: 'Leave not found' });
        res.json(leave);
    } catch (e) { next(e); }
});

// ─── POST create leave request (Tenant Locked) ────────────────────────────────
router.post('/', authenticate, tenantGuard, validate(leaveCreateSchema), async (req, res, next) => {
    try {
        const companyId = req.tenantId!;
        const { employeeId, type, startDate, endDate, reason } = req.body;

        if (!employeeId || !startDate || !endDate) {
            return res.status(400).json({ error: 'employeeId, startDate, endDate are required' });
        }

        const leave = await prisma.leave.create({
            data: {
                employeeId,
                companyId: companyId!,
                type: type || 'CONGE_ANNUEL',
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason: reason || null,
            },
        });

        // Trigger Event for HR
        const { eventBus, EVENTS } = await import('../../services/eventBus');
        eventBus.emitEvent(EVENTS.LEAVE.SUBMITTED, {
            companyId: req.tenantId!,
            employeeId: req.user!.id,
            employeeName: req.user!.email, // Fallback if name not in user object
            leaveId: leave.id,
            startDate: leave.startDate,
            endDate: leave.endDate
        });

        res.status(201).json(leave);
    } catch (e) { next(e); }
});

// ─── PATCH approve / reject / update leave (Tenant Locked) ────────────────────
router.patch('/:id', authenticate, tenantGuard, validateTenantResource(prisma.leave), async (req, res, next) => {
    try {
        const { status, reason, startDate, endDate } = req.body;
        const approvedBy = req.user?.email;

        const updated = await prisma.leave.update({
            where: { id: req.params.id, companyId: req.tenantId! },
            data: {
                ...(status && { status }),
                ...(reason !== undefined && { reason }),
                ...(startDate && { startDate: new Date(startDate) }),
                ...(endDate && { endDate: new Date(endDate) }),
                ...(status === 'APPROVED' && { approvedBy }),
            },
        });

        // Trigger Notification for Employee
        if (status === 'APPROVED' || status === 'REJECTED') {
            const { NotificationService } = await import('../notifications/notification.service');
            await NotificationService.create({
                companyId: req.tenantId!,
                userId: updated.employeeId, // Use employeeId as userId (assuming 1:1 or mapping)
                title: status === 'APPROVED' ? 'Congé Approuvé' : 'Congé Refusé',
                message: status === 'APPROVED' 
                    ? 'Votre demande de congé a été acceptée.' 
                    : 'Votre demande de congé a été déclinée.',
                type: status === 'APPROVED' ? 'SUCCESS' : 'ERROR'
            });
        }

        res.json(updated);
    } catch (e) { next(e); }
});

// ─── POST trigger monthly accrual (Admin Only) ───────────────────────────────
router.post('/accrue', authenticate, tenantGuard, checkSubscription, requireRole(['ADMIN']), async (req, res, next) => {
    try {
        await LeavesService.processMonthlyAccrual(req.tenantId!);
        res.json({ success: true, message: 'Traitement des congés mensuels complété.' });
    } catch (e) { next(e); }
});

// ─── GET leave balance for an employee (Tenant Locked) ────────────────────────
router.get('/balance/:employeeId', authenticate, tenantGuard, async (req, res, next) => {
    try {
        const employee = await (prisma.employee as any).findUnique({
            where: { id: req.params.employeeId, companyId: req.tenantId! },
            select: { leaveBalance: true, firstName: true, lastName: true }
        });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });
        res.json(employee);
    } catch (e) { next(e); }
});

export const leavesRoutes = router;

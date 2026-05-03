/**
 * SALERY — Attendance Module
 * Fixes: removed take:100 / take:30 limits | secured /scan endpoint
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { Role } from '@prisma/client';
import { prisma } from '../../prisma';

const router = Router();

// ─── GET all attendance (Tenant Locked) ───────────────────────────────────────
router.get('/', authenticate, tenantGuard, async (req, res, next) => {
    try {
        const companyId = req.tenantId!;
        const { month, employeeId } = req.query;

        // Build companyId join via employee
        const where: any = {};
        if (employeeId) where.employeeId = String(employeeId);
        if (month) {
            const [year, m] = String(month).split('-');
            const start = new Date(Number(year), Number(m) - 1, 1);
            const end = new Date(Number(year), Number(m), 1);
            where.date = { gte: start, lt: end };
        }

        if (employeeId) {
            where.employeeId = String(employeeId);
            where.employee = { companyId }; // Ensure employee belongs to tenant
        } else {
            where.employee = { companyId };
        }

        // ✅ NO take/skip — full dataset
        const records = await prisma.attendance.findMany({
            where,
            include: {
                employee: { select: { firstName: true, lastName: true, position: true } },
            },
            orderBy: { date: 'desc' },
        });

        res.json(records);
    } catch (e) { next(e); }
});

// ─── GET attendance for single employee (Tenant Locked) ───────────────────────
router.get('/employee/:id', authenticate, tenantGuard, async (req, res, next) => {
    try {
        const { month } = req.query;
        const where: any = { 
            employeeId: req.params.id,
            employee: { companyId: req.tenantId! } // Force tenant check via join
        };

        if (month) {
            const [year, m] = String(month).split('-');
            where.date = {
                gte: new Date(Number(year), Number(m) - 1, 1),
                lt: new Date(Number(year), Number(m), 1),
            };
        }

        // ✅ NO take/skip
        const records = await prisma.attendance.findMany({
            where,
            orderBy: { date: 'desc' },
        });
        res.json(records);
    } catch (e) { next(e); }
});

// ─── GET by employee email (legacy compat) ────────────────────────────────────
router.get('/:email', authenticate, async (req, res, next) => {
    try {
        const employee = await prisma.employee.findUnique({ where: { email: req.params.email } });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        // ✅ NO take — full history
        const records = await prisma.attendance.findMany({
            where: { employeeId: employee.id },
            orderBy: { date: 'desc' },
        });
        res.json(records);
    } catch (e) { next(e); }
});

// ─── POST clock-in (Self Service - Tenant Locked) ─────────────────────────────
router.post('/clock-in', authenticate, tenantGuard, async (req, res, next) => {
    try {
        const email = req.user?.email;
        const employee = await prisma.employee.findUnique({ 
            where: { email, companyId: req.tenantId! } 
        });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const existing = await prisma.attendance.findFirst({ where: { employeeId: employee.id, date: today } });
        if (existing) return res.status(400).json({ error: 'Already clocked in today' });

        const record = await prisma.attendance.create({
            data: { employeeId: employee.id, date: today, checkIn: new Date(), hoursWorked: 0 },
        });

        // Intelligence: Late Arrival Detection (Threshold: 08:15)
        const now = new Date();
        if (now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 15)) {
            const { eventBus, EVENTS } = await import('../../services/eventBus');
            eventBus.emitEvent(EVENTS.ATTENDANCE.LATE, {
                companyId: req.tenantId!,
                employeeId: employee.id,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                time: now.toLocaleTimeString('fr-FR')
            });
        }

        res.json(record);
    } catch (e) { next(e); }
});

// ─── POST manual attendance (HR only) ────────────────────────────────────────
router.post('/manual', requireRole([Role.ADMIN, Role.HR]), async (req, res, next) => {
    try {
        const { employeeId, date, checkIn, checkOut } = req.body;
        if (!employeeId || !date || !checkIn) {
            return res.status(400).json({ error: 'employeeId, date, checkIn required' });
        }
        const ci = new Date(checkIn);
        const co = checkOut ? new Date(checkOut) : null;
        const hours = co ? (co.getTime() - ci.getTime()) / 3600000 : 0;

        const record = await prisma.attendance.create({
            data: {
                employeeId,
                date: new Date(date),
                checkIn: ci,
                checkOut: co,
                hoursWorked: Math.max(0, Number(hours.toFixed(2))),
            },
        });
        res.json(record);
    } catch (e) { next(e); }
});

// ─── POST badge scan (QR / NFC) — SECURED with authentication ─────────────────
// Note: uses authenticate so only a valid badge/token from our app can clock in
router.post('/scan', authenticate, async (req, res, next) => {
    try {
        const { qrData, nfcId } = req.body;
        let employee;

        if (qrData) {
            const payload = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
            employee = await prisma.employee.findFirst({
                where: { id: payload.e, companyId: payload.c, badgeToken: payload.t },
            });
        } else if (nfcId) {
            employee = await prisma.employee.findFirst({ where: { badgeNFCId: nfcId } });
        }

        if (!employee) return res.status(401).json({ error: 'Badge invalide ou non reconnu.' });
        if (employee.badgeStatus === 'DISABLED') return res.status(403).json({ error: 'Badge désactivé.' });

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const existing = await prisma.attendance.findFirst({ where: { employeeId: employee.id, date: today } });

        let record;
        if (existing && !existing.checkOut) {
            const co = new Date();
            const hours = (co.getTime() - existing.checkIn.getTime()) / 3600000;
            record = await prisma.attendance.update({
                where: { id: existing.id },
                data: { checkOut: co, hoursWorked: Math.max(0, Number(hours.toFixed(2))) },
            });

            // Intelligence: Overtime Detection (> 9h)
            if ((record.hoursWorked || 0) > 9) {
                const { eventBus, EVENTS } = await import('../../services/eventBus');
                eventBus.emitEvent(EVENTS.ATTENDANCE.OVERTIME, {
                    companyId: employee.companyId,
                    employeeId: employee.id,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    hours: record.hoursWorked
                });
            }

            // Intelligence: Early Check-out (< 17:00)
            if (co.getHours() < 17) {
                const { eventBus, EVENTS } = await import('../../services/eventBus');
                eventBus.emitEvent(EVENTS.ATTENDANCE.EARLY_OUT, {
                    companyId: employee.companyId,
                    employeeId: employee.id,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    time: co.toLocaleTimeString('fr-FR')
                });
            }

            prisma.employeeEvent.create({
                data: { employeeId: employee.id, type: 'CHECK_OUT', title: 'Pointage Sortie', description: `${record.hoursWorked || 0}h travaillées`, metadata: {} },
            }).catch(console.error);
        } else if (!existing) {
            const now = new Date();
            record = await prisma.attendance.create({
                data: { employeeId: employee.id, date: today, checkIn: now, hoursWorked: 0 },
            });

            // Intelligence: Late Arrival Detection (Threshold: 08:15)
            if (now.getHours() > 8 || (now.getHours() === 8 && now.getMinutes() > 15)) {
                const { eventBus, EVENTS } = await import('../../services/eventBus');
                eventBus.emitEvent(EVENTS.ATTENDANCE.LATE, {
                    companyId: employee.companyId,
                    employeeId: employee.id,
                    employeeName: `${employee.firstName} ${employee.lastName}`,
                    time: now.toLocaleTimeString('fr-FR')
                });
            }

            prisma.employeeEvent.create({
                data: { employeeId: employee.id, type: 'CHECK_IN', title: 'Pointage Entrée', description: 'Arrivée enregistrée', metadata: {} },
            }).catch(console.error);
        } else {
            return res.status(400).json({ error: 'Sortie déjà pointée pour aujourd\'hui.' });
        }

        res.json({
            employee: { id: employee.id, name: `${employee.firstName} ${employee.lastName}` },
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            status: record.checkOut ? 'CHECKED_OUT' : 'CHECKED_IN',
        });
    } catch (e) { next(e); }
});

export const attendanceRoutes = router;

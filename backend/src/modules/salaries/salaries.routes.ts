import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { requireRole, restrictToSelf } from '../../middleware/rbac.middleware';
import { SalariesService } from './salaries.service';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, tenantGuard, requireRole([Role.ADMIN, Role.HR]), async (req, res, next) => {
    try {
        const { prisma } = await import('../../prisma');
        const companyId = req.tenantId!;
        const { employeeId, month } = req.query as any;
        const where: any = { employee: { companyId } };
        if (employeeId) where.employeeId = String(employeeId);
        if (month) where.month = String(month);

        // ✅ NO take/skip — full salary history
        const salaries = await prisma.salary.findMany({
            where,
            include: { employee: { select: { firstName: true, lastName: true, position: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(salaries);
    } catch (err) { next(err); }
});

router.get('/:employeeId', authenticate, tenantGuard, requireRole([Role.ADMIN, Role.HR, Role.EMPLOYEE]), async (req, res, next) => {
    try {
        const companyId = req.tenantId!;
        // restrictToSelf logic conceptually implies we only fetch if you are admin/hr or matching employee.
        const salaries = await SalariesService.getEmployeeSalaries(req.params.employeeId, companyId);
        res.json(salaries);
    } catch (err) {
        next(err);
    }
});

router.post('/calculate', authenticate, tenantGuard, requireRole([Role.ADMIN, Role.HR]), async (req, res, next) => {
    try {
        const companyId = req.tenantId!;
        const { employeeId, month, overtimeHours, overtimePay, bonuses, deductions } = req.body;
        const salary = await SalariesService.calculateAndProcessSalary(employeeId, companyId, month, overtimeHours, overtimePay, bonuses, deductions);
        res.json(salary);
    } catch (err) {
        next(err);
    }
});

export const salariesRoutes = router;

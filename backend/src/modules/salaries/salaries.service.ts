import { prisma } from '../../prisma';
import { PayrollEngine } from './payroll.engine';
import { cacheService } from '../../services/cacheService';

export class SalariesService {
    /**
     * Calculates and creates a salary record for an employee.
     */
    static async calculateAndProcessSalary(
        employeeId: string,
        companyId: string,
        month: string,
        overtimeHours: number,
        overtimePay: number,
        bonuses: number,
        deductions: number
    ) {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId, companyId }
        });

        if (!employee) {
            throw new Error('Employee not found');
        }

        // Core Business Logic: Salary calculation
        const payroll = PayrollEngine.calculate(
            employee.baseSalary,
            bonuses,
            deductions
        );

        const result = await prisma.salary.create({
            data: {
                employeeId,
                month,
                baseSalary: employee.baseSalary,
                overtimeHours,
                overtimePay,
                deductions,
                bonuses,
                netSalary: payroll.netSalary,
            }
        });

        // Invalidate cache for this employee
        cacheService.invalidate(`salaries:${employeeId}`);

        // Intelligence: Payroll / Bonus / Deduction Event
        if (bonuses > 0 || overtimePay > 0 || deductions > 0) {
            const { eventBus, EVENTS } = await import('../../services/eventBus');
            const totalAdj = (bonuses + overtimePay - deductions);
            eventBus.emitEvent(EVENTS.PAYROLL.SALARY_PROCESSED, {
                companyId: companyId,
                employeeId: employeeId,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                adjustment: totalAdj.toFixed(2),
                month,
                isNegative: totalAdj < 0
            });
        }
        
        return result;
    }

    static async getEmployeeSalaries(employeeId: string, companyId: string) {
        const cacheKey = `salaries:${employeeId}`;
        
        return cacheService.getOrSet(cacheKey, async () => {
            return prisma.salary.findMany({
                where: { employeeId, employee: { companyId } },
                orderBy: { createdAt: 'desc' }
            });
        });
    }
}

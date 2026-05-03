import { prisma } from '../prisma';
import { NotificationService } from '../modules/notifications/notification.service';

/**
 * ComplianceService
 * Handles automated, proactive HR checks and generates intelligent alerts.
 * In a production environment, these would be separate Cron jobs.
 */
export class ComplianceService {
    static init() {
        console.log('[COMPLIANCE] Initializing Proactive HR Engine...');
        
        // Run checks every hour in the background (simplified for this environment)
        setInterval(() => {
            this.runAllChecks().catch(console.error);
        }, 3600000); // 1 hour

        // Also run once on startup
        this.runAllChecks().catch(console.error);
    }

    static async runAllChecks() {
        console.log('[COMPLIANCE] Running daily compliance audit...');
        await Promise.all([
            this.checkContractExpiries(),
            this.checkLowLeaveBalances(),
            this.checkUnjustifiedAbsences()
        ]);
        console.log('[COMPLIANCE] Audit complete.');
    }

    /**
     * Finds employees whose contract ends in approximately 30 days.
     * (Simulated using hireDate + 1 year for fixed-term, if we had a contract end field).
     * For this demo, we'll check for employees hired 335 days ago (365 - 30).
     */
    private static async checkContractExpiries() {
        const thirtyDaysAhead = new Date();
        thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

        const expiring = await prisma.employee.findMany({
            where: { hireDate: { lte: thirtyDaysAhead } }, // Simulating expiry logic
        });
        const { eventBus, EVENTS } = await import('./eventBus');
        for (const emp of expiring) {
            eventBus.emitEvent(EVENTS.EMPLOYEE.CONTRACT_EXPIRING, {
                companyId: emp.companyId,
                employeeId: emp.id,
                employeeName: `${emp.firstName} ${emp.lastName}`
            });
        }
    }

    /**
     * Alerts employees and HR when leave balance is critically low.
     */
    private static async checkLowLeaveBalances() {
        const { eventBus, EVENTS } = await import('./eventBus');
        const lowBalance = await prisma.employee.findMany({
            where: { leaveBalance: { lt: 2 } },
        });

        for (const emp of lowBalance) {
            eventBus.emitEvent(EVENTS.LEAVE.LOW_BALANCE, {
                companyId: emp.companyId,
                employeeId: emp.id,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                balance: emp.leaveBalance
            });
        }
    }

    /**
     * Detects employees without check-ins by 10 AM.
     */
    private static async checkUnjustifiedAbsences() {
        const now = new Date();
        // Only run if it's past 10 AM
        if (now.getHours() < 10) return;

        const today = new Date(); today.setHours(0, 0, 0, 0);

        const allEmployees = await prisma.employee.findMany();
        
        for (const emp of allEmployees) {
            const attended = await prisma.attendance.findFirst({
                where: { employeeId: emp.id, date: today }
            });

            if (!attended) {
                // Check if already notified today to avoid spamming
                const notified = await prisma.notification.findFirst({
                    where: {
                        companyId: emp.companyId,
                        role: 'HR',
                        title: 'Absence Non Qualifiée',
                        message: { contains: emp.lastName },
                        createdAt: { gte: today }
                    }
                });

                if (!notified) {
                    await NotificationService.create({
                        companyId: emp.companyId,
                        role: 'HR',
                        title: 'Absence Non Qualifiée',
                        message: `${emp.firstName} ${emp.lastName} n'a pas pointé son arrivée aujourd'hui.`,
                        type: 'ERROR'
                    });
                }
            }
        }
    }
}

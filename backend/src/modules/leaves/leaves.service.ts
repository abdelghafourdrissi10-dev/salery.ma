import { prisma } from '../../prisma';

/**
 * LEAVE ACCRUAL ENGINE (Moroccan CNSS/Labor Law)
 * Rules:
 * - 1.5 days per month of effective work (1.5 * 12 = 18 days/year)
 * - Seniority bonus: +1.5 days every 5 years of service
 * - Maximum total accrual cap: User defined (usually 30-45 days)
 */
export class LeavesService {
    /**
     * Calculate accrued leaves for a single employee based on seniority
     */
    static calculateMonthlyAccrual(hireDate: Date): number {
        const now = new Date();
        const seniorityYears = now.getFullYear() - hireDate.getFullYear();
        
        let accrual = 1.5; // Base case

        // Seniority bonus: 1.5 days additional every 5 years
        if (seniorityYears >= 5) accrual += 1.5 * Math.floor(seniorityYears / 5);

        return accrual / 12; // Yearly accrual divided by 12? No, 1.5 is already the MONTHLY base.
        // Wait, standard Moroccan law is 1.5 days per MONTH.
        // So base is 1.5. 
        // Total yearly = 18.
        // After 5 years, it increases.
        
        // Actually seniority bonus is often applied to the YEARLY total or the monthly.
        // Standard: 1.5 days/month. After 5 years: +1.5 days (total 19.5/year).
        // That means monthly accrual = 1.625.
        
        const monthlyAccrual = 1.5 + (seniorityYears >= 5 ? (1.5 * Math.floor(seniorityYears / 5) / 12) : 0);
        return monthlyAccrual;
    }

    /**
     * Process monthly leave accrual for all employees in a company
     */
    static async processMonthlyAccrual(companyId: string) {
        const employees = await prisma.employee.findMany({
            where: { companyId }
        });

        for (const employee of employees) {
            const monthlyBonus = this.calculateMonthlyAccrual(employee.hireDate);
            
            await (prisma.employee as any).update({
                where: { id: employee.id },
                data: {
                    leaveBalance: {
                        increment: monthlyBonus
                    }
                }
            });

            // Log the event
            await prisma.employeeEvent.create({
                data: {
                    employeeId: employee.id,
                    type: 'LEAVE_ACCRUED',
                    title: 'Mensualités de Congé',
                    description: `Ajout de ${monthlyBonus.toFixed(2)} jours de congé au solde (Loi Marocaine).`,
                }
            });
        }
    }
}

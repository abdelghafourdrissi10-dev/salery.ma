import { prisma } from '../../prisma';
import { EmployeeStatus } from '@prisma/client';
import { logAudit } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';

export class EmployeesService {
    static async updatePhoto(companyId: string, employeeId: string, photoUrl: string) {
        return prisma.employee.update({
            where: { id: employeeId }, // We might not strictly force companyId here if ADMIN uploads, but let's test isolation.
            data: { photoUrl }
        });
    }

    static async create(companyId: string, data: any) {
        return prisma.employee.create({
            data: { ...data, companyId },
        });
    }

    static async findAll(companyId: string) {
        return prisma.employee.findMany({
            where: { companyId, status: { not: EmployeeStatus.ARCHIVED } },
        });
    }

    static async revokeUserTokensByEmail(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await AuthService.logout(user.id);
        }
    }

    static async deactivate(companyId: string, employeeId: string) {
        return prisma.$transaction(async (tx) => {
            const employee = await tx.employee.update({
                where: { id: employeeId, companyId },
                data: { status: EmployeeStatus.INACTIVE },
            });

            if (employee.email) {
                const user = await tx.user.findUnique({ where: { email: employee.email } });
                if (user) {
                    await tx.user.update({
                        where: { id: user.id },
                        data: { portalAccessMode: 'READ_ONLY' }
                    });

                    await logAudit({
                        action: 'PORTAL_MODE_CHANGED',
                        userId: user.id,
                        companyId,
                        details: { newMode: 'READ_ONLY', employeeId }
                    });

                    await tx.refreshToken.updateMany({
                        where: { userId: user.id },
                        data: { revoked: true }
                    });
                }
            }

            await logAudit({
                action: 'EMPLOYEE_DEACTIVATED',
                companyId,
                details: { employeeId, severity: 'WARN' },
            });

            return employee;
        });
    }

    static async archive(userId: string, companyId: string, employeeId: string) {
        return prisma.$transaction(async (tx) => {
            const employee = await tx.employee.update({
                where: { id: employeeId, companyId },
                data: { status: EmployeeStatus.ARCHIVED, archivedAt: new Date() },
            });

            if (employee.email) {
                const user = await tx.user.findUnique({ where: { email: employee.email } });
                if (user) {
                    await tx.user.update({
                        where: { id: user.id },
                        data: { portalAccessMode: 'DISABLED' }
                    });

                    await logAudit({
                        action: 'PORTAL_MODE_CHANGED',
                        userId: user.id,
                        companyId,
                        details: { newMode: 'DISABLED', employeeId }
                    });

                    await tx.refreshToken.updateMany({
                        where: { userId: user.id },
                        data: { revoked: true }
                    });
                }
            }

            await logAudit({
                action: 'EMPLOYEE_ARCHIVED',
                userId,
                companyId,
                details: { employeeId, severity: 'INFO' },
            });

            return employee;
        });
    }

    static async hardDelete(userId: string, companyId: string, employeeId: string) {
        await prisma.$transaction(async (tx) => {
            const auditCount = await tx.auditLog.count({
                where: { details: { path: ['employeeId'], equals: employeeId } }
            });

            if (auditCount > 0) {
                throw new Error('Cannot hard delete employee: associated audit logs exist.');
            }

            await tx.employee.delete({
                where: { id: employeeId, companyId },
            });

            await logAudit({
                action: 'EMPLOYEE_HARD_DELETED',
                userId,
                companyId,
                details: { employeeId, severity: 'CRITICAL' },
            });
        });
    }
}

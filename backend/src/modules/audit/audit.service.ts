import { prisma } from '../../prisma';

export const logAudit = async (data: {
    action: string;
    userId?: string;
    companyId?: string;
    ipAddress?: string;
    details?: any;
}) => {
    return prisma.auditLog.create({
        data,
    });
};

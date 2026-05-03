import { Request, Response } from 'express';
import { prisma } from '../../prisma';

// ─── GET NOTIFICATIONS — Roles & User Filter ────────────────────────────────
export const getNotifications = async (req: Request, res: Response) => {
    const { userId, role, companyId } = req.user!;
    const tenantId = req.tenantId!; // from tenantGuard

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                companyId: tenantId,
                OR: [
                    { userId: userId },             // Specific to this user
                    { role: role },               // Specific to this role
                    { AND: [{ userId: null }, { role: null }] } // Global company announcement
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(notifications);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// ─── MARK AS READ ────────────────────────────────────────────────────────────
export const markAsRead = async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    try {
        await prisma.notification.updateMany({
            where: { id, companyId: tenantId },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

// ─── INTERNAL HELPER: Create Notification ────────────────────────────────────
export const internalCreateNotification = async (data: {
    companyId: string,
    userId?: string,
    role?: string,
    title: string,
    message: string
}) => {
    try {
        return await prisma.notification.create({ data });
    } catch (e) {
        console.error('[NotificationService] Create failed:', e);
    }
};

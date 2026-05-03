import { prisma } from '../../prisma.ts';

export const createNotification = async (data: {
    companyId: string,
    userId?: string,
    role?: string,
    title: string,
    message: string,
    type?: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS',
    metadata?: any
}) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                ...data,
                type: data.type || 'INFO',
                metadata: data.metadata || {}
            }
        });

        // Trigger Real-time Broadcast
        const { SocketService } = await import('../../services/socketService');
        SocketService.sendNotification(notification);

        return notification;
    } catch (e) {
        console.error('[NotificationService] Failed to create notification:', e);
    }
};

export const NotificationService = {
    create: createNotification
};

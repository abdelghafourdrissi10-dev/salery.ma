import { api } from './api';
import { Notification } from '../types';

export const getNotifications = async (): Promise<Notification[]> => {
    return await api.get('/notifications');
};

export const markAsRead = async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`, {});
};

export const NotificationService = {
    getNotifications,
    markAsRead
};

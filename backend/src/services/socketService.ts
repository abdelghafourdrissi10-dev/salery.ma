import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

/**
 * SocketService
 * Handles real-time communication with connected clients.
 * Notifications are broadcasted to specific rooms based on companyId/userId/role.
 */
export class SocketService {
    private static io: SocketIOServer;

    static init(server: HttpServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: '*', // Adjust for production
                methods: ['GET', 'POST']
            }
        });

        console.log('[SOCKET_SERVICE] WebSocket server initialized.');

        this.io.on('connection', (socket) => {
            const { companyId, userId, role } = socket.handshake.query;

            if (companyId) {
                const room = `company:${companyId}`;
                socket.join(room);
                console.log(`[SOCKET_SERVICE] Socket ${socket.id} joined room: ${room}`);

                if (role === 'HR' || role === 'ADMIN') {
                    const hrRoom = `company:${companyId}:HR`;
                    socket.join(hrRoom);
                    console.log(`[SOCKET_SERVICE] Socket ${socket.id} joined room: ${hrRoom}`);
                }

                if (userId) {
                    const userRoom = `user:${userId}`;
                    socket.join(userRoom);
                    console.log(`[SOCKET_SERVICE] Socket ${socket.id} joined room: ${userRoom}`);
                }
            }

            socket.on('disconnect', () => {
                console.log(`[SOCKET_SERVICE] Socket ${socket.id} disconnected.`);
            });
        });
    }

    /**
     * Broadcast a notification to relevant rooms
     */
    static sendNotification(notification: any) {
        if (!this.io) return;

        const { companyId, userId, role } = notification;

        if (userId) {
            // Targeted to specific user
            this.io.to(`user:${userId}`).emit('NEW_NOTIFICATION', notification);
        } else if (role === 'HR' || role === 'ADMIN') {
            // Targeted to HR/Admin role
            this.io.to(`company:${companyId}:HR`).emit('NEW_NOTIFICATION', notification);
        } else {
            // Broadcast to whole company
            this.io.to(`company:${companyId}`).emit('NEW_NOTIFICATION', notification);
        }
    }
}

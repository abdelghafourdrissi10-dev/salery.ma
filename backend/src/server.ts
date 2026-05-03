import { app } from './app';
import { env } from './config/env';
import { prisma } from './prisma';

async function bootstrap() {
    try {
        await prisma.$connect();
        console.log('Database connected successfully');

        const http = await import('http');
        const server = http.createServer(app);

        server.listen(Number(env.PORT), '0.0.0.0', () => {
            console.log(`Server strictly bound to http://0.0.0.0:${env.PORT}`);
            
            // Start Socket Service (WebSockets)
            import('./services/socketService').then(({ SocketService }) => {
                SocketService.init(server);
            });

            // Start Proactive Compliance Service (Background Checks)
            import('./services/complianceService').then(({ ComplianceService }) => {
                ComplianceService.init();
            });

            // Start Notification Processor (Event Listeners)
            import('./modules/notifications/notification.processor').then(({ NotificationProcessor }) => {
                NotificationProcessor.init();
            });
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

bootstrap();

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { getNotifications, markAsRead } from './notification.controller';

const router = Router();

router.use(authenticate, tenantGuard);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);

export const notificationRoutes = router;

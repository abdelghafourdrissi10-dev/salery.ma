import { Router } from 'express';
import { prisma } from '../../prisma';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/notifications/preferences
 */
router.get('/preferences', authenticate, async (req, res) => {
    try {
        let prefs = await (prisma as any).notificationPreference.findUnique({
            where: { userId: (req.user as any).id }
        });

        if (!prefs) {
            // Create default preferences if none exist
            prefs = await (prisma as any).notificationPreference.create({
                data: {
                    userId: (req.user as any).id,
                    companyId: (req.user as any).companyId || 'default',
                    inAppEnabled: true,
                    emailEnabled: true,
                    pushEnabled: false
                }
            });
        }

        res.json(prefs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch preferences' });
    }
});

/**
 * PUT /api/notifications/preferences
 */
router.put('/preferences', authenticate, async (req, res) => {
    const { inAppEnabled, emailEnabled, pushEnabled } = req.body;
    try {
        const prefs = await (prisma as any).notificationPreference.upsert({
            where: { userId: (req.user as any).id },
            update: { inAppEnabled, emailEnabled, pushEnabled },
            create: {
                userId: (req.user as any).id,
                companyId: (req.user as any).companyId || 'default',
                inAppEnabled,
                emailEnabled,
                pushEnabled
            }
        });
        res.json(prefs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

export default router;

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

/**
 * SUBSCRIPTION GUARD
 * Ensures the company has an ACTIVE subscription for premium features.
 */
export const checkSubscription = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = req.tenantId || req.user?.companyId;

    if (!companyId) return res.status(401).json({ error: 'Company context required' });

    // ─── BYPASS FOR SUPER_ADMIN ──────────────────────────────────────────────────
    if (req.user?.role === 'SUPER_ADMIN') {
        return next();
    }

    try {
        const subscription = await prisma.subscription.findUnique({
            where: { companyId }
        });

        const now = new Date();

        if (!subscription || subscription.status !== 'ACTIVE' || (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) < now)) {
            return res.status(402).json({ 
                error: 'Subscription required', 
                code: 'PAYMENT_REQUIRED',
                message: 'This feature requires an active premium subscription.' 
            });
        }

        next();
    } catch (err) {
        next(err);
    }
};

import { Router } from 'express';
import Stripe from 'stripe';
import { env } from '../../config/env';
import { authenticate } from '../../middleware/auth.middleware';
import { prisma } from '../../prisma';

const router = Router();
const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    apiVersion: '2023-10-16' as any,
});

// ─── POST Create Checkout Session ─────────────────────────────────────────────
router.post('/checkout', authenticate, async (req, res, next) => {
    try {
        const { planId } = req.body;
        const companyId = req.user!.companyId;

        // In a real app, look up the Stripe Price ID from the Plan model
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) return res.status(404).json({ error: 'Plan not found' });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: plan.currency.toLowerCase(),
                        product_data: { name: `Salery ${plan.name} Plan` },
                        unit_amount: Math.round(plan.price * 100),
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/billing`,
            metadata: { companyId, planId },
        });

        res.json({ url: session.url });
    } catch (err) { next(err); }
});

// ─── POST Stripe Webhook ──────────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            (req as any).rawBody || JSON.stringify(req.body),
            sig,
            env.STRIPE_WEBHOOK_SECRET || ''
        );
    } catch (err: any) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            const { companyId, planId } = session.metadata || {};
            if (companyId && planId) {
                await prisma.subscription.upsert({
                    where: { companyId },
                    update: { 
                        planId, 
                        status: 'ACTIVE', 
                        nextBill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                    },
                    create: { 
                        companyId, 
                        planId, 
                        status: 'ACTIVE', 
                        nextBill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                    },
                });
            }
            break;
        case 'invoice.payment_failed':
            // Logic to mark subscription as PAST_DUE
            break;
    }

    res.json({ received: true });
});

export const billingRoutes = router;

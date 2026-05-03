import { Router } from 'express';
import { InviteService } from './invite.service';
import { authenticate } from '../../middleware/auth.middleware';
import { prisma } from '../../prisma';
import { TokenService } from '../../services/tokenService';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/invites/send
 * Initiate user invitation (Admin/HR only)
 */
router.post('/send', authenticate, async (req, res) => {
    try {
        const { email, role } = req.body;
        // Basic permission check
        const userRole = (req.user as any).role || '';
        const allowedRoles = ['SUPER_ADMIN', 'COMPANY_OWNER', 'DIRECTEUR_RH', 'TEAM_RH', 'ADMIN', 'HR'];
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ error: 'Permission refusée' });
        }

        const result = await InviteService.createInvite({
            email,
            role,
            companyId: (req.user as any).companyId
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/invites/tracking
 * Fetch onboarding dashboard data
 */
router.get('/tracking', authenticate, async (req, res) => {
    try {
        const invites = await prisma.userInvite.findMany({
            where: { companyId: (req.user as any).companyId },
            include: { emailLogs: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(invites);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/invites/resend
 */
router.post('/resend', authenticate, async (req, res) => {
    try {
        const { inviteId } = req.body;
        const result = await InviteService.resendInvite(inviteId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/invites/setup
 * Public endpoint for setting initial password and activating account
 */
router.post('/setup', async (req, res) => {
    try {
        const { token, password } = req.body;
        const hashedToken = TokenService.hashToken(token);

        const invite = await prisma.userInvite.findUnique({
            where: { token: hashedToken }
        });

        if (!invite) return res.status(404).json({ error: 'Lien d\'invitation invalide' });
        if (invite.status === 'ACCEPTED') return res.status(400).json({ error: 'Lien déjà utilisé' });
        if (new Date() > invite.expiresAt) return res.status(400).json({ error: 'Lien expiré', code: 'EXPIRED' });

        // 1. Hash new password
        const passwordHash = await bcrypt.hash(password, 12);

        // 2. Activate User
        await prisma.user.update({
            where: { email: invite.email },
            data: {
                password: passwordHash,
                status: 'ACTIVE'
            }
        });

        // 3. Mark Invite as Accepted
        await prisma.userInvite.update({
            where: { id: invite.id },
            data: { status: 'ACCEPTED' }
        });

        res.json({ success: true, message: 'Compte activé avec succès' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;

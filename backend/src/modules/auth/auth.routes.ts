import { Router } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../../prisma';
import { env } from '../../config/env';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} from '../../utils/jwt';
import { authenticate } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/security.middleware';

const router = Router();

// ─── POST Login ───────────────────────────────────────────────────────────────
router.post('/login', authLimiter, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log(`[AUTH] Login attempt for: ${email}`);

        if (!email || !password) {
            return res.status(400).json({ error: 'email and password required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log(`[AUTH] User not found: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Development fallback: Allow plain text '1234' or 'admin123' if not hashed
        let isValid = false;
        if (user.password === password) {
            console.log(`[AUTH] PLAIN TEXT MATCH for: ${email}`);
            isValid = true;
        } else {
            isValid = await bcrypt.compare(password, user.password);
        }

        if (!isValid) {
            console.log(`[AUTH] Password mismatch for: ${email}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken({
            userId: user.id,
            companyId: user.currentCompanyId || '',
            role: user.role,
            email: user.email,
        });

        const refreshToken = generateRefreshToken(user.id);

        const isProd = process.env.NODE_ENV === 'production';
        
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Fetch accessible companies
        const accesses = await (prisma as any).userCompany.findMany({
            where: { userId: user.id },
            include: { company: true }
        });

        res.json({ 
            success: true, 
            accessToken,
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                currentCompanyId: user.currentCompanyId
            },
            companies: accesses.map((a: any) => ({
                id: a.company.id,
                name: a.company.name,
                role: a.role
            }))
        });
    } catch (err) { next(err); }
});

// ─── POST Refresh (Cookie Based) ──────────────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(400).json({ error: 'refreshToken required' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) return res.status(401).json({ error: 'User not found' });

        const newAccessToken = generateAccessToken({
            userId: user.id,
            companyId: user.currentCompanyId || '',
            role: user.role,
            email: user.email,
        });

        const newRefreshToken = generateRefreshToken(user.id);

        const isProd = process.env.NODE_ENV === 'production';

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({ success: true });
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

// ─── GET Me (Session Check) ──────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ 
            where: { id: req.user!.userId },
            select: { id: true, email: true, role: true, currentCompanyId: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Fetch accessible companies
        const accesses = await (prisma as any).userCompany.findMany({
            where: { userId: user.id },
            include: { company: true }
        });

        res.json({ 
            user, 
            companies: accesses.map((a: any) => ({
                id: a.company.id,
                name: a.company.name,
                role: a.role
            }))
        });
    } catch (e) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── POST Switch Context ──────────────────────────────────────────────────────
router.post('/switch-context', authenticate, async (req, res) => {
    try {
        const { companyId } = req.body;
        if (!companyId) return res.status(400).json({ error: 'companyId required' });

        // Verify access
        const access = await (prisma as any).userCompany.findUnique({
            where: { userId_companyId: { userId: req.user!.userId, companyId } }
        });

        if (!access) {
            return res.status(403).json({ error: 'No access to this company' });
        }

        // Update user's current context in DB
        const user = await prisma.user.update({
            where: { id: req.user!.userId },
            data: { currentCompanyId: companyId }
        });

        // Re-issue tokens
        const accessToken = generateAccessToken({
            userId: user.id,
            companyId: user.currentCompanyId!,
            role: user.role,
            email: user.email,
        });

        const isProd = process.env.NODE_ENV === 'production';
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000
        });

        res.json({ success: true, companyId });
    } catch (e) {
        res.status(500).json({ error: 'Switch context failed' });
    }
});

// ─── POST Logout ──────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
});

export const authRoutes = router;

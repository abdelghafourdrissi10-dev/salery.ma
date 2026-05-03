import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from '../../prisma';
import { generateAccessToken } from '../../utils/jwt';
import { logAudit } from '../audit/audit.service';
import { Role } from '@prisma/client';

export class AuthService {
    static async createRefreshToken(userId: string, ipAddress?: string, userAgent?: string) {
        const rawToken = crypto.randomBytes(40).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const deviceName = userAgent ? userAgent.split('(')[1]?.split(';')[0]?.trim() || 'Unknown Device' : null;

        await prisma.refreshToken.create({
            data: { userId, tokenHash, ipAddress, userAgent, deviceName, expiresAt }
        });

        return rawToken;
    }

    static async registerCompany(data: any, ip?: string) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) throw new Error('Email already in use');

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const company = await prisma.$transaction(async (tx) => {
            const comp = await tx.company.create({
                data: { name: data.companyName },
            });

            const user = await tx.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    role: Role.COMPANY_ADMIN,
                    companyId: comp.id,
                },
            });

            await logAudit({
                action: 'COMPANY_REGISTERED',
                userId: user.id,
                companyId: comp.id,
                ipAddress: ip,
                details: { email: data.email },
            });

            return comp;
        });

        return { message: 'Company registered successfully', companyId: company.id };
    }

    static async login(data: any, ip?: string, userAgent?: string) {
        const user = await prisma.user.findUnique({ where: { email: data.email } });

        if (!user) {
            await logAudit({ action: 'LOGIN_FAILED', ipAddress: ip, details: { email: data.email, reason: 'User not found' } });
            throw new Error('Invalid credentials');
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
            await logAudit({ action: 'LOGIN_LOCKED', userId: user.id, companyId: user.companyId, ipAddress: ip });
            throw new Error('Account locked due to too many failed attempts');
        }

        const isValid = await bcrypt.compare(data.password, user.password);

        if (!isValid) {
            const failedAttempts = user.failedAttempts + 1;
            const lockedUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

            await prisma.user.update({
                where: { id: user.id },
                data: { failedAttempts, lockedUntil },
            });

            await logAudit({ action: 'LOGIN_FAILED', userId: user.id, companyId: user.companyId, ipAddress: ip, details: { attempts: failedAttempts } });
            throw new Error('Invalid credentials');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lockedUntil: null },
        });

        await logAudit({ action: 'LOGIN_SUCCESS', userId: user.id, companyId: user.companyId, ipAddress: ip });

        const accessToken = generateAccessToken({ userId: user.id, companyId: user.companyId, role: user.role, portalAccessMode: user.portalAccessMode });
        const refreshToken = await this.createRefreshToken(user.id, ip, userAgent);

        return { accessToken, refreshToken };
    }

    static async refresh(rawToken: string) {
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        const tokenRecord = await prisma.$transaction(async (tx) => {
            const record = await tx.refreshToken.findFirst({
                where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
                include: { user: true }
            });

            if (!record) throw new Error('Invalid or revoked token');

            // Revoke the used token immediately
            await tx.refreshToken.update({
                where: { id: record.id },
                data: { revoked: true }
            });

            return record;
        });

        const accessToken = generateAccessToken({
            userId: tokenRecord.user.id,
            companyId: tokenRecord.user.companyId,
            role: tokenRecord.user.role,
            portalAccessMode: tokenRecord.user.portalAccessMode
        });

        const newRefreshToken = await this.createRefreshToken(
            tokenRecord.user.id,
            tokenRecord.ipAddress ?? undefined,
            tokenRecord.userAgent ?? undefined
        );

        return { accessToken, refreshToken: newRefreshToken };
    }

    static async logout(userId: string, rawToken?: string) {
        if (rawToken) {
            const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
            await prisma.refreshToken.updateMany({
                where: { userId, tokenHash },
                data: { revoked: true }
            });
        } else {
            await prisma.refreshToken.updateMany({
                where: { userId },
                data: { revoked: true }
            });
        }
    }
}

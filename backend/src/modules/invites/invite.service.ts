import { prisma } from '../../prisma';
import { TokenService } from '../../services/tokenService';
import { InviteQueue } from '../../services/inviteQueue';
import { addDays } from 'date-fns';

/**
 * InviteService
 * Orchestrates the onboarding invitation lifecycle.
 */
export class InviteService {
    /**
     * Creates a new user invitation and queues the delivery.
     */
    static async createInvite(data: {
        email: string;
        companyId: string;
        role: string;
    }) {
        const rawToken = TokenService.generateRawToken();
        const hashedToken = TokenService.hashToken(rawToken);
        const expiresAt = addDays(new Date(), 1); // 24h expiration

        // 1. Create Inactive User if not already exists
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (!existingUser) {
            const newUser = await prisma.user.create({
                data: {
                    email: data.email,
                    role: data.role as any,
                    status: 'INACTIVE',
                    currentCompanyId: data.companyId,
                    password: 'LOCKED_' + crypto.randomUUID(),
                }
            });
            // Link user to company via UserCompany join table
            await prisma.userCompany.upsert({
                where: { userId_companyId: { userId: newUser.id, companyId: data.companyId } },
                update: {},
                create: { userId: newUser.id, companyId: data.companyId, role: data.role as any }
            });
        }

        // 2. Create UserInvite record
        const invite = await prisma.userInvite.create({
            data: {
                email: data.email,
                token: hashedToken,
                companyId: data.companyId,
                role: data.role,
                status: 'PENDING',
                expiresAt
            }
        });

        // 3. Queue Invitation Delivery — pass rawToken so email URL is correct
        await InviteQueue.add(invite.id, rawToken);

        return { 
            inviteId: invite.id, 
            status: 'QUEUED',
            token: rawToken
        };
    }

    /**
     * Resends an existing invitation with a fresh token.
     */
    static async resendInvite(inviteId: string) {
        const invite = await prisma.userInvite.findUnique({ where: { id: inviteId } });
        if (!invite) throw new Error('Invitation non trouvée');

        const rawToken = TokenService.generateRawToken();
        const hashedToken = TokenService.hashToken(rawToken);

        await prisma.userInvite.update({
            where: { id: inviteId },
            data: {
                token: hashedToken,
                status: 'PENDING',
                expiresAt: addDays(new Date(), 1)
            }
        });

        await InviteQueue.add(inviteId, rawToken);
        return { status: 'RESENT' };
    }
}

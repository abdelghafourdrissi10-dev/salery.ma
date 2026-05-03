/**
 * InviteQueue
 * A robust background queue for user onboarding invitations.
 * The raw token is passed as a job parameter so the email URL is correct.
 */
export class InviteQueue {
    private static jobs: Array<{ inviteId: string; rawToken: string; attempts: number }> = [];
    private static isWorking = false;

    private static RETRY_CONFIG = {
        maxAttempts: 5,
        backoffFactor: 2000
    };

    /**
     * Adds an invitation task to the queue.
     * @param inviteId  - The DB record ID
     * @param rawToken  - The un-hashed token to embed in the setup URL
     */
    static async add(inviteId: string, rawToken: string) {
        console.log(`[INVITE_QUEUE] 📥 Queuing invitation: ${inviteId}`);
        this.jobs.push({ inviteId, rawToken, attempts: 0 });

        if (!this.isWorking) {
            this.process();
        }
    }

    private static async process() {
        this.isWorking = true;

        while (this.jobs.length > 0) {
            const job = this.jobs.shift();
            if (!job) continue;

            try {
                console.log(`[INVITE_QUEUE] ⚙️ Processing invite: ${job.inviteId} (Attempt ${job.attempts + 1})`);

                const { EmailService } = await import('./emailService');
                const { prisma } = await import('../prisma');

                const invite = await prisma.userInvite.findUnique({
                    where: { id: job.inviteId }
                });

                if (!invite) throw new Error('Invite not found');

                // Use rawToken (not the invite ID) to build the correct setup URL
                const html = EmailService.getInvitationTemplate('Salery', invite.role, job.rawToken);

                await EmailService.send(invite.email, '🔐 Activez votre compte Salery', html);

                await prisma.userInvite.update({
                    where: { id: invite.id },
                    data: { status: 'SENT' }
                });

                await prisma.emailLog.create({
                    data: {
                        inviteId: invite.id,
                        status: 'SENT',
                        attempts: job.attempts + 1
                    }
                });

                console.log(`[INVITE_QUEUE] ✅ Invite sent successfully: ${job.inviteId}`);
            } catch (error: any) {
                console.error(`[INVITE_QUEUE] ❌ Failed invite: ${job.inviteId}`, error.message);

                const { prisma } = await import('../prisma');
                await prisma.emailLog.create({
                    data: {
                        inviteId: job.inviteId,
                        status: 'FAILED',
                        attempts: job.attempts + 1,
                        errorMessage: error.message
                    }
                });

                if (job.attempts + 1 < this.RETRY_CONFIG.maxAttempts) {
                    const delay = Math.pow(2, job.attempts) * this.RETRY_CONFIG.backoffFactor;
                    console.log(`[INVITE_QUEUE] ⏳ Retrying in ${delay}ms...`);
                    setTimeout(() => {
                        this.jobs.push({ ...job, attempts: job.attempts + 1 });
                        if (!this.isWorking) this.process();
                    }, delay);
                } else {
                    await prisma.userInvite.update({
                        where: { id: job.inviteId },
                        data: { status: 'FAILED' }
                    });
                }
            }
        }

        this.isWorking = false;
    }
}

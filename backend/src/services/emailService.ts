import nodemailer from 'nodemailer';

/**
 * EmailService
 * Production-ready SMTP email delivery system for Salery.
 * Configure SMTP credentials in backend/.env
 */

// Create a singleton transporter from env vars
const createTransporter = () => {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        console.warn('[EMAIL_SERVICE] ⚠️  SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
        return null;
    }

    return nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
    });
};

export class EmailService {
    /**
     * Sends a real HTML email via SMTP.
     */
    static async send(to: string, subject: string, html: string) {
        console.log(`[EMAIL_SERVICE] 📧 Sending to: ${to} — ${subject}`);

        const transporter = createTransporter();

        if (!transporter) {
            // Fallback: log the link to console for local dev
            console.log(`[EMAIL_SERVICE] 🔗 (Dev mode) Setup link would be sent to: ${to}`);
            return;
        }

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Salery RH" <no-reply@salery.ma>',
            to,
            subject,
            html,
        });

        console.log(`[EMAIL_SERVICE] ✅ Delivered: [${subject}] to ${to}`);
    }

    /**
     * Generates a professional branded invitation email.
     */
    static getInvitationTemplate(companyName: string, role: string, rawToken: string) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3005';
        const setupUrl = `${frontendUrl}/setup-account?token=${encodeURIComponent(rawToken)}`;

        return `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                <div style="background-color: #0f172a; padding: 40px; text-align: center; border-radius: 24px 24px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">SALERY</h1>
                    <p style="color: #94a3b8; margin: 8px 0 0; font-size: 13px;">Plateforme RH & Paie</p>
                </div>
                <div style="padding: 40px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 24px 24px;">
                    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">
                        Bienvenue dans votre espace professionnel 👋
                    </h2>
                    <p style="font-size: 15px; line-height: 1.7; color: #64748b; margin-bottom: 32px;">
                        L'entreprise <strong style="color: #0f172a;">${companyName}</strong> vous invite à rejoindre sa plateforme de gestion RH en tant que <strong style="color: #0f172a;">${role}</strong>.
                        <br><br>
                        Cliquez sur le bouton ci-dessous pour configurer votre accès sécurisé.
                    </p>
                    <div style="text-align: center; margin-bottom: 40px;">
                        <a href="${setupUrl}"
                           style="background-color: #0f172a; color: #ffffff; padding: 18px 40px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
                            Configurer mon compte →
                        </a>
                    </div>
                    <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.6;">
                            🔒 Ce lien est <strong>valable 24 heures</strong> et ne peut être utilisé qu'une seule fois.<br>
                            Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
                        </p>
                    </div>
                    <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
                        <p style="font-size: 11px; font-weight: 800; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
                            Salery • Plateforme RH Maroc 2026
                        </p>
                    </div>
                </div>
            </div>
        `;
    }
}

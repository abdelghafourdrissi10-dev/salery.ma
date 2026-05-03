import { eventBus, EVENTS } from '../../services/eventBus';
import { NotificationService } from './notification.service';
import { prisma } from '../../prisma';

/**
 * NotificationProcessor
 * Subscribes to the EventBus and routes events to the NotificationService,
 * applying rules and preferences along the way.
 */
export class NotificationProcessor {
    static init() {
        console.log('[NOTIFICATION_PROCESSOR] Listening for system events...');

        // Helper to handle delivery based on preferences (Offloaded to Queue)
        const deliver = async (companyId: string, userId: string | null, role: string | null, title: string, message: string, type: any, metadata: any) => {
            // Log for visibility
            console.log(`[PROCESSOR] 📡 Offloading to Queue: ${title}`);

            const { NotificationQueue } = await import('../../services/queueService');
            await NotificationQueue.add({
                companyId,
                userId: userId || undefined,
                role: role || undefined,
                title,
                message,
                type,
                metadata
            });
        };

        // --- Attendance Listeners ---
        eventBus.on(EVENTS.ATTENDANCE.LATE, async (data) => {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const lateCount = await prisma.employeeEvent.count({
                where: { employeeId: data.employeeId, type: 'CHECK_IN', createdAt: { gte: oneWeekAgo }, title: 'Pointage Entrée', description: { contains: 'retard' } }
            });

            await deliver(data.companyId, null, 'HR', 'Retard Détecté', `${data.employeeName} a pointé en retard (${data.time}).`, 'WARNING', { ...data, lateCountInWeek: lateCount + 1 });

            if (lateCount + 1 >= 3) {
                await deliver(data.companyId, null, 'HR', 'ALERTE: Retards Répétés', `${data.employeeName} a été en retard ${lateCount + 1} fois cette semaine.`, 'ERROR', { ...data, lateCount: lateCount + 1 });
            }
        });

        eventBus.on(EVENTS.ATTENDANCE.OVERTIME, async (data) => {
            await deliver(data.companyId, null, 'HR', 'Heures Supplémentaires', `${data.employeeName} a travaillé ${data.hours}h aujourd'hui.`, 'INFO', data);
        });

        eventBus.on(EVENTS.ATTENDANCE.EARLY_OUT, async (data) => {
            await deliver(data.companyId, null, 'HR', 'Sortie Anticipée', `${data.employeeName} a quitté avant l'heure (${data.time}).`, 'WARNING', data);
        });

        eventBus.on(EVENTS.ATTENDANCE.ABSENCE, async (data) => {
            await deliver(data.companyId, null, 'HR', 'Absence Non Qualifiée', `${data.employeeName} n'a pas pointé son arrivée aujourd'hui.`, 'ERROR', data);
        });

        eventBus.on(EVENTS.EMPLOYEE.CREATED, async (data) => {
            await deliver(data.companyId, null, 'HR', 'Nouveau Talent', `${data.employeeName} a été ajouté à l'effectif.`, 'SUCCESS', data);
        });

        eventBus.on(EVENTS.EMPLOYEE.UPDATED, async (data) => {
            await deliver(data.companyId, data.employeeId, null, 'Mise à jour du Profil', 'Des modifications ont été apportées à votre contrat (Salaire ou Poste).', 'INFO', data);
        });

        eventBus.on(EVENTS.EMPLOYEE.DOCUMENT_UPLOADED, async (data) => {
            await deliver(data.companyId, null, 'HR', 'Nouveau Document', `Un document (${data.documentType}) a été déposé pour le profil ${data.employeeName}.`, 'INFO', data);
        });

        eventBus.on(EVENTS.EMPLOYEE.CONTRACT_EXPIRING, async (data) => {
            await deliver(data.companyId, null, 'HR', 'Contrat Bientôt Expired', `Le contrat de ${data.employeeName} arrive à échéance dans 30 jours.`, 'WARNING', data);
        });

        eventBus.on(EVENTS.PAYROLL.SALARY_PROCESSED, async (data) => {
            await deliver(data.companyId, data.employeeId, null, 'Ajustement Salaire', `Des ajustements (${data.adjustment} MAD) ont été appliqués à votre salaire pour ${data.month}.`, data.isNegative ? 'WARNING' : 'SUCCESS', data);
        });

        eventBus.on(EVENTS.LEAVE.SUBMITTED, async (data) => {
            await deliver(data.companyId, null, 'HR', 'Demande de Congé', `${data.employeeName} a soumis une demande de congé.`, 'INFO', data);
        });

        eventBus.on(EVENTS.LEAVE.APPROVED, async (data) => {
            await deliver(data.companyId, data.employeeId, null, 'Congé Approuvé', `Votre demande de congé pour le ${data.startDate} a été approuvée.`, 'SUCCESS', data);
        });

        eventBus.on(EVENTS.LEAVE.REJECTED, async (data) => {
            await deliver(data.companyId, data.employeeId, null, 'Congé Refusé', `Votre demande de congé pour le ${data.startDate} a été refusée.`, 'ERROR', data);
        });

        eventBus.on(EVENTS.LEAVE.LOW_BALANCE, async (data) => {
            await deliver(data.companyId, data.employeeId, null, 'Solde Congés Bas', `Votre solde de congés est de ${data.balance} jours.`, 'INFO', data);
        });

        eventBus.on(EVENTS.DOCUMENTS.BULK_ZIP_READY, async (data) => {
            await deliver(data.companyId, null, 'HR', 'Archive ZIP prête', `Votre génération d'archives ${data.month} est terminée.`, 'SUCCESS', data);
        });
    }
}

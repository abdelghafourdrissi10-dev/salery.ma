import { PlanningItem, PlanningType, PlanningPriority, PlanningStatus, Employee, AttendanceRecord } from '../types';

const uuidv4 = () => crypto.randomUUID();

export const planningService = {
    /**
     * Generates mock tasks for a given month
     */
    generateMockData: (companyId: string, month: string): PlanningItem[] => {
        const items: PlanningItem[] = [
            {
                id: uuidv4(),
                companyId,
                date: `${month}-05`,
                title: 'Réunion de Paie',
                description: 'Vérification des variables de paie mensuelle avec l\'équipe RH.',
                type: 'EVENT',
                priority: 'HIGH',
                status: 'DONE',
                createdById: 'admin-1',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {
                id: uuidv4(),
                companyId,
                date: `${month}-10`,
                title: 'Déclaration CNSS',
                description: 'Date limite pour la soumission Damancom.',
                type: 'ALERT',
                priority: 'HIGH',
                status: 'PENDING',
                createdById: 'admin-1',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {
                id: uuidv4(),
                companyId,
                date: `${month}-15`,
                title: 'Entretien Youssef F.',
                description: 'Évaluation annuelle de performance.',
                type: 'TASK',
                priority: 'MEDIUM',
                status: 'IN_PROGRESS',
                assignedToUserId: 'manager-1',
                createdById: 'admin-1',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            }
        ];

        return items;
    },

    /**
     * Detects absences and creates ALERT items
     */
    detectAbsences: (attendance: AttendanceRecord[], employees: Employee[], currentMonth: string): PlanningItem[] => {
        const alerts: PlanningItem[] = [];
        const absences = attendance.filter(a => a.status === 'absent');

        absences.forEach(a => {
            const emp = employees.find(e => e.id === a.employeeId);
            alerts.push({
                id: uuidv4(),
                companyId: emp?.companyId || '',
                date: a.date,
                title: `Absence: ${emp?.fullName}`,
                description: `L'employé ${emp?.fullName} est marqué absent sans justificatif.`,
                type: 'ALERT',
                priority: 'MEDIUM',
                status: 'PENDING',
                createdById: 'system',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        return alerts;
    },

    /**
     * Detects excessive overtime
     */
    detectOvertime: (attendance: AttendanceRecord[], employees: Employee[]): PlanningItem[] => {
        const alerts: PlanningItem[] = [];
        const highOvertime = attendance.filter(a => (a.overtimeHours || 0) > 4);

        highOvertime.forEach(a => {
            const emp = employees.find(e => e.id === a.employeeId);
            alerts.push({
                id: uuidv4(),
                companyId: emp?.companyId || '',
                date: a.date,
                title: `Heures Sup. Excessives: ${emp?.fullName}`,
                description: `L'employé a effectué ${a.overtimeHours}h supplémentaires. Révision recommandée.`,
                type: 'EVENT',
                priority: 'LOW',
                status: 'PENDING',
                createdById: 'system',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        return alerts;
    }
};

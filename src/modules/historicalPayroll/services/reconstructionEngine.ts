import { HistoricalRecord } from './importEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Anomaly {
    id: string;
    recordId: string;
    employeeId: string;
    employeeName: string;
    year: number;
    month: number;
    type: AnomalyType;
    label: string;
    detail: string;
    riskLevel: RiskLevel;
    amount?: number;
}

export type AnomalyType =
    | 'SALARY_JUMP'
    | 'SALARY_DROP'
    | 'MISSING_CNSS'
    | 'IR_INCONSISTENCY'
    | 'OVERTIME_SPIKE'
    | 'BONUS_ANOMALY'
    | 'PAID_DECLARED_GAP'
    | 'MISSING_PERIOD'
    | 'NEGATIVE_NET';

export interface AIInsight {
    employeeId: string;
    employeeName: string;
    icon: string;
    message: string;
    riskLevel: RiskLevel;
}

export interface ReconstructionOutput {
    records: HistoricalRecord[];
    anomalies: Anomaly[];
    aiInsights: AIInsight[];
    riskScore: number; // 0–100
    byEmployee: Record<string, HistoricalRecord[]>;
    byYear: Record<number, HistoricalRecord[]>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const pct = (a: number, b: number) => b === 0 ? 0 : ((a - b) / b) * 100;

// ─── Main Function ────────────────────────────────────────────────────────────

export const runReconstruction = (records: HistoricalRecord[]): ReconstructionOutput => {
    const anomalies: Anomaly[] = [];
    const aiInsightMap = new Map<string, AIInsight[]>();

    // Group data
    const byEmployee: Record<string, HistoricalRecord[]> = {};
    const byYear: Record<number, HistoricalRecord[]> = {};

    records.forEach(r => {
        if (!byEmployee[r.employeeId]) byEmployee[r.employeeId] = [];
        byEmployee[r.employeeId].push(r);
        if (!byYear[r.year]) byYear[r.year] = [];
        byYear[r.year].push(r);
    });

    // Sort each employee's records chronologically
    Object.values(byEmployee).forEach(recs => {
        recs.sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);
    });

    // ── Per-record anomaly checks ──────────────────────────────────────────────

    const updatedRecords: HistoricalRecord[] = records.map(r => {
        const recs = byEmployee[r.employeeId] || [];
        const idx = recs.indexOf(r);
        const prev = idx > 0 ? recs[idx - 1] : null;

        let hasAnomaly = false;

        // Rule 1: Salary jump > 20% month-over-month
        if (prev && prev.realSalary > 0) {
            const change = pct(r.realSalary, prev.realSalary);
            if (change > 20) {
                hasAnomaly = true;
                anomalies.push({
                    id: crypto.randomUUID(), recordId: r.id,
                    employeeId: r.employeeId, employeeName: r.employeeName,
                    year: r.year, month: r.month,
                    type: 'SALARY_JUMP',
                    label: 'Hausse de salaire anormale',
                    detail: `Salaire augmenté de ${change.toFixed(1)}% en ${MONTHS_FULL[r.month - 1]} ${r.year} (${prev.realSalary.toLocaleString()} → ${r.realSalary.toLocaleString()} DH)`,
                    riskLevel: change > 50 ? 'high' : 'medium',
                    amount: r.realSalary - prev.realSalary,
                });
            }
            if (change < -15) {
                hasAnomaly = true;
                anomalies.push({
                    id: crypto.randomUUID(), recordId: r.id,
                    employeeId: r.employeeId, employeeName: r.employeeName,
                    year: r.year, month: r.month,
                    type: 'SALARY_DROP',
                    label: 'Baisse de salaire',
                    detail: `Salaire réduit de ${Math.abs(change).toFixed(1)}% en ${MONTHS_FULL[r.month - 1]} ${r.year}`,
                    riskLevel: 'medium',
                    amount: r.realSalary - prev.realSalary,
                });
            }
        }

        // Rule 2: Paid/Declared gap
        if (Math.abs(r.difference) > 100) {
            hasAnomaly = true;
            anomalies.push({
                id: crypto.randomUUID(), recordId: r.id,
                employeeId: r.employeeId, employeeName: r.employeeName,
                year: r.year, month: r.month,
                type: 'PAID_DECLARED_GAP',
                label: 'Écart salaire payé / réel',
                detail: `Écart de ${r.difference > 0 ? '+' : ''}${r.difference.toFixed(0)} DH — catégorisé : ${r.differenceCategory}`,
                riskLevel: Math.abs(r.difference) > 2000 ? 'high' : 'low',
                amount: r.difference,
            });
        }

        // Rule 3: CNSS seems too low for the declared salary
        const expectedCNSS = +(r.realSalary * 0.044).toFixed(2);
        if (r.cnssEmployee > 0 && Math.abs(r.cnssEmployee - expectedCNSS) > expectedCNSS * 0.1) {
            hasAnomaly = true;
            anomalies.push({
                id: crypto.randomUUID(), recordId: r.id,
                employeeId: r.employeeId, employeeName: r.employeeName,
                year: r.year, month: r.month,
                type: 'MISSING_CNSS',
                label: 'Cotisation CNSS incohérente',
                detail: `CNSS déclarée: ${r.cnssEmployee} DH | Attendu: ~${expectedCNSS} DH pour salaire ${r.realSalary.toLocaleString()} DH`,
                riskLevel: 'high',
                amount: expectedCNSS - r.cnssEmployee,
            });
        }

        // Rule 4: Overtime spike (> 60 hours/month = suspicious)
        if (r.overtimeHours > 60) {
            hasAnomaly = true;
            anomalies.push({
                id: crypto.randomUUID(), recordId: r.id,
                employeeId: r.employeeId, employeeName: r.employeeName,
                year: r.year, month: r.month,
                type: 'OVERTIME_SPIKE',
                label: 'Heures supplémentaires excessives',
                detail: `${r.overtimeHours}h de HS déclarées en ${MONTHS_FULL[r.month - 1]} ${r.year} — limite légale: 60h/mois (Loi 65-99)`,
                riskLevel: r.overtimeHours > 80 ? 'high' : 'medium',
                amount: r.overtimeHours,
            });
        }

        // Rule 5: Negative net salary
        if (r.netSalary < 0) {
            hasAnomaly = true;
            anomalies.push({
                id: crypto.randomUUID(), recordId: r.id,
                employeeId: r.employeeId, employeeName: r.employeeName,
                year: r.year, month: r.month,
                type: 'NEGATIVE_NET',
                label: 'Salaire net négatif',
                detail: `Net calculé: ${r.netSalary} DH — Les retenues dépassent le brut. À vérifier.`,
                riskLevel: 'high',
                amount: r.netSalary,
            });
        }

        // Rule 6: Bonus > 50% of real salary
        if (r.bonus > r.realSalary * 0.5 && r.bonus > 0) {
            hasAnomaly = true;
            anomalies.push({
                id: crypto.randomUUID(), recordId: r.id,
                employeeId: r.employeeId, employeeName: r.employeeName,
                year: r.year, month: r.month,
                type: 'BONUS_ANOMALY',
                label: 'Prime anormalement élevée',
                detail: `Prime de ${r.bonus.toLocaleString()} DH = ${pct(r.bonus, r.realSalary).toFixed(0)}% du salaire de base`,
                riskLevel: 'medium',
                amount: r.bonus,
            });
        }

        return { ...r, reconstructionStatus: hasAnomaly ? 'anomaly' : 'validated' };
    });

    // ── Per-employee AI insights ───────────────────────────────────────────────

    const aiInsights: AIInsight[] = [];

    Object.entries(byEmployee).forEach(([empId, recs]) => {
        const empName = recs[0]?.employeeName || empId;
        const empAnomalies = anomalies.filter(a => a.employeeId === empId);
        const highRisk = empAnomalies.filter(a => a.riskLevel === 'high');
        const salaries = recs.map(r => r.realSalary).filter(s => s > 0);
        const avgSalary = salaries.length ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;
        const maxSalary = Math.max(...salaries);
        const minSalary = Math.min(...salaries);

        if (highRisk.length > 0) {
            aiInsights.push({
                employeeId: empId, employeeName: empName,
                icon: '🔴',
                message: `${highRisk.length} anomalie(s) à haut risque détectée(s) — Risque de redressement CNSS/IR.`,
                riskLevel: 'high',
            });
        }

        if (salaries.length >= 3) {
            const salaryChange = pct(maxSalary, minSalary);
            if (salaryChange > 30) {
                aiInsights.push({
                    employeeId: empId, employeeName: empName,
                    icon: '📈',
                    message: `Salaire a augmenté de ${salaryChange.toFixed(0)}% sur la période (${minSalary.toLocaleString()} → ${maxSalary.toLocaleString()} DH).`,
                    riskLevel: salaryChange > 60 ? 'high' : 'medium',
                });
            }
        }

        const cnssGaps = empAnomalies.filter(a => a.type === 'MISSING_CNSS');
        if (cnssGaps.length > 2) {
            aiInsights.push({
                employeeId: empId, employeeName: empName,
                icon: '⚠️',
                message: `Cotisations CNSS incohérentes sur ${cnssGaps.length} mois — Exposition au redressement CNSS.`,
                riskLevel: 'high',
            });
        }

        const diffRecs = recs.filter(r => Math.abs(r.difference) > 0);
        if (diffRecs.length > 0 && diffRecs.every(r => r.difference === diffRecs[0].difference)) {
            aiInsights.push({
                employeeId: empId, employeeName: empName,
                icon: '🔁',
                message: `Prime fixe non déclarée détectée: ${diffRecs[0].difference.toFixed(0)} DH/mois sur ${diffRecs.length} mois. Recommandation: intégrer dans le salaire de base.`,
                riskLevel: 'medium',
            });
        }
    });

    // ── Risk score ─────────────────────────────────────────────────────────────

    const highCount = anomalies.filter(a => a.riskLevel === 'high').length;
    const medCount = anomalies.filter(a => a.riskLevel === 'medium').length;
    const lowCount = anomalies.filter(a => a.riskLevel === 'low').length;
    const totalRecords = records.length || 1;
    const riskScore = Math.min(100, Math.round(
        (highCount * 10 + medCount * 4 + lowCount * 1) / totalRecords * 10
    ));

    return {
        records: updatedRecords,
        anomalies,
        aiInsights,
        riskScore,
        byEmployee,
        byYear,
    };
};

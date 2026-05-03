import { HistoricalRecord } from './importEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayComponent {
    label: string;
    amount: number;
    type: 'earning' | 'deduction' | 'employer';
}

export interface RetroPayslip {
    id: string;
    employeeId: string;
    employeeName: string;
    cin: string;
    cnssNumber: string;
    period: string;       // "Janvier 2024"
    periodCode: string;   // "2024-01"
    year: number;
    month: number;
    companyId: string;

    // Earnings
    baseSalary: number;
    overtime: number;
    bonus: number;
    transportAllowance: number;
    mealAllowance: number;
    otherAllowances: number;
    grossSalary: number;

    // Deductions
    cnssEmployee: number;
    taxIR: number;
    absenceDeduction: number;
    totalDeductions: number;

    // Net
    netSalary: number;
    paidSalary: number;
    difference: number;

    // Employer charges
    cnssEmployer: number;

    // Line items for display
    earnings: PayComponent[];
    deductions: PayComponent[];

    // Status
    isAnomaly: boolean;
    paymentDate: string;
    generatedAt: number;
}

// ─── Month labels ─────────────────────────────────────────────────────────────

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// ─── Generator ────────────────────────────────────────────────────────────────

export const generatePayslip = (record: HistoricalRecord): RetroPayslip => {
    const overtime = record.overtimeHours * record.overtimeRate;
    const absenceDeduction = record.absenceDays > 0
        ? +((record.realSalary / 26) * record.absenceDays).toFixed(2)
        : 0;

    const earnings: PayComponent[] = [
        { label: 'Salaire de base', amount: record.realSalary, type: 'earning' },
    ];
    if (overtime > 0) earnings.push({ label: `Heures supplémentaires (${record.overtimeHours}h)`, amount: +overtime.toFixed(2), type: 'earning' });
    if (record.bonus > 0) earnings.push({ label: 'Primes et gratifications', amount: record.bonus, type: 'earning' });
    if (record.transportAllowance > 0) earnings.push({ label: 'Indemnité de transport', amount: record.transportAllowance, type: 'earning' });
    if (record.mealAllowance > 0) earnings.push({ label: 'Indemnité de repas', amount: record.mealAllowance, type: 'earning' });
    if (record.otherAllowances > 0) earnings.push({ label: 'Autres indemnités', amount: record.otherAllowances, type: 'earning' });

    const deductions: PayComponent[] = [];
    if (record.cnssEmployee > 0) deductions.push({ label: 'CNSS (part salariale 4.4%)', amount: record.cnssEmployee, type: 'deduction' });
    if (record.taxIR > 0) deductions.push({ label: 'Impôt sur le Revenu (IR)', amount: record.taxIR, type: 'deduction' });
    if (absenceDeduction > 0) deductions.push({ label: `Retenue absences (${record.absenceDays}j)`, amount: absenceDeduction, type: 'deduction' });

    return {
        id: crypto.randomUUID(),
        employeeId: record.employeeId,
        employeeName: record.employeeName,
        cin: record.cin,
        cnssNumber: record.cnssNumber,
        period: `${MONTHS[record.month - 1]} ${record.year}`,
        periodCode: `${record.year}-${String(record.month).padStart(2, '0')}`,
        year: record.year,
        month: record.month,
        companyId: record.companyId,
        baseSalary: record.realSalary,
        overtime: +overtime.toFixed(2),
        bonus: record.bonus,
        transportAllowance: record.transportAllowance,
        mealAllowance: record.mealAllowance,
        otherAllowances: record.otherAllowances,
        grossSalary: record.grossSalary,
        cnssEmployee: record.cnssEmployee,
        taxIR: record.taxIR,
        absenceDeduction,
        totalDeductions: record.totalDeductions + absenceDeduction,
        netSalary: record.netSalary,
        paidSalary: record.paidSalary,
        difference: record.difference,
        cnssEmployer: record.cnssEmployer,
        earnings,
        deductions,
        isAnomaly: record.reconstructionStatus === 'anomaly',
        paymentDate: record.paymentDate || `${record.year}-${String(record.month).padStart(2, '0')}-28`,
        generatedAt: Date.now(),
    };
};

export const generateBatchPayslips = (
    records: HistoricalRecord[],
    months: 12 | 24 | 36
): RetroPayslip[] => {
    // Step 1: find all distinct period keys, sorted newest first
    const distinctPeriods = [
        ...new Set(
            records.map(r => `${r.year}-${String(r.month).padStart(2, '0')}`)
        )
    ].sort((a, b) => b.localeCompare(a)); // descending = newest first

    // Step 2: keep only the last N months
    const allowedPeriods = new Set(distinctPeriods.slice(0, months));

    // Step 3: return ALL records in those periods, sorted newest → oldest
    return records
        .filter(r => allowedPeriods.has(`${r.year}-${String(r.month).padStart(2, '0')}`))
        .sort((a, b) =>
            a.year !== b.year ? b.year - a.year :
                a.month !== b.month ? b.month - a.month :
                    (a.employeeName || '').localeCompare(b.employeeName || '')
        )
        .map(generatePayslip);
};

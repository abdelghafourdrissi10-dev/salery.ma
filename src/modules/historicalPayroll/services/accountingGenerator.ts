import { HistoricalRecord } from './importEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LedgerEntry {
    id: string;
    date: string;
    period: string; // "MM/YYYY"
    employeeId: string;
    employeeName: string;
    reference: string;
    label: string;
    debitAccount: string;
    debitLabel: string;
    creditAccount: string;
    creditLabel: string;
    amount: number;
    isAnomaly: boolean;
}

// ─── Moroccan Chart of Accounts (PCG Marocain) ───────────────────────────────

const ACCOUNTS: Record<string, string> = {
    '6411': 'Rémunérations du personnel',
    '6412': 'Primes et gratifications',
    '6413': 'Indemnités et avantages divers',
    '6414': 'Charges sociales patronales (CNSS)',
    '421': 'Personnel — Rémunérations dues',
    '431': 'Cotisations sociales (CNSS salarié)',
    '4452': 'État — Impôt sur le Revenu (IR)',
    '447': 'Autres impôts et taxes',
};

const account = (code: string) => `${code} — ${ACCOUNTS[code] || ''}`;

// ─── Generator ────────────────────────────────────────────────────────────────

export const generateLedger = (records: HistoricalRecord[]): LedgerEntry[] => {
    const entries: LedgerEntry[] = [];

    records.forEach(r => {
        const period = `${String(r.month).padStart(2, '0')}/${r.year}`;
        const ref = `RECON-${r.year}-${String(r.month).padStart(2, '0')}-${r.employeeId.substring(0, 6).toUpperCase()}`;
        const date = r.paymentDate || `${r.year}-${String(r.month).padStart(2, '0')}-28`;
        const isAnomaly = r.reconstructionStatus === 'anomaly';

        // 1. Gross salary charge → debit 6411 / credit 421
        entries.push({
            id: crypto.randomUUID(), date, period,
            employeeId: r.employeeId, employeeName: r.employeeName,
            reference: `${ref}-BRUT`,
            label: `Salaire brut — ${r.employeeName} — ${period}`,
            debitAccount: '6411', debitLabel: ACCOUNTS['6411'],
            creditAccount: '421', creditLabel: ACCOUNTS['421'],
            amount: r.grossSalary,
            isAnomaly,
        });

        // 2. CNSS employee deduction → debit 421 / credit 431
        if (r.cnssEmployee > 0) {
            entries.push({
                id: crypto.randomUUID(), date, period,
                employeeId: r.employeeId, employeeName: r.employeeName,
                reference: `${ref}-CNSS-SAL`,
                label: `Retenue CNSS salarié — ${r.employeeName} — ${period}`,
                debitAccount: '421', debitLabel: ACCOUNTS['421'],
                creditAccount: '431', creditLabel: ACCOUNTS['431'],
                amount: r.cnssEmployee,
                isAnomaly,
            });
        }

        // 3. CNSS employer share → debit 6414 / credit 431
        if (r.cnssEmployer > 0) {
            entries.push({
                id: crypto.randomUUID(), date, period,
                employeeId: r.employeeId, employeeName: r.employeeName,
                reference: `${ref}-CNSS-PAT`,
                label: `Charge patronale CNSS — ${r.employeeName} — ${period}`,
                debitAccount: '6414', debitLabel: ACCOUNTS['6414'],
                creditAccount: '431', creditLabel: ACCOUNTS['431'],
                amount: r.cnssEmployer,
                isAnomaly,
            });
        }

        // 4. IR deduction → debit 421 / credit 4452
        if (r.taxIR > 0) {
            entries.push({
                id: crypto.randomUUID(), date, period,
                employeeId: r.employeeId, employeeName: r.employeeName,
                reference: `${ref}-IR`,
                label: `Retenue IR — ${r.employeeName} — ${period}`,
                debitAccount: '421', debitLabel: ACCOUNTS['421'],
                creditAccount: '4452', creditLabel: ACCOUNTS['4452'],
                amount: r.taxIR,
                isAnomaly,
            });
        }

        // 5. Bonus / prime → debit 6412 / credit 421
        if (r.bonus > 0) {
            entries.push({
                id: crypto.randomUUID(), date, period,
                employeeId: r.employeeId, employeeName: r.employeeName,
                reference: `${ref}-PRIME`,
                label: `Prime — ${r.employeeName} — ${period}`,
                debitAccount: '6412', debitLabel: ACCOUNTS['6412'],
                creditAccount: '421', creditLabel: ACCOUNTS['421'],
                amount: r.bonus,
                isAnomaly,
            });
        }

        // 6. Allowances → debit 6413 / credit 421
        if (r.totalAllowances > 0) {
            entries.push({
                id: crypto.randomUUID(), date, period,
                employeeId: r.employeeId, employeeName: r.employeeName,
                reference: `${ref}-IND`,
                label: `Indemnités (transport+repas) — ${r.employeeName} — ${period}`,
                debitAccount: '6413', debitLabel: ACCOUNTS['6413'],
                creditAccount: '421', creditLabel: ACCOUNTS['421'],
                amount: r.totalAllowances,
                isAnomaly,
            });
        }
    });

    // Sort by date, then employee
    return entries.sort((a, b) => a.date.localeCompare(b.date) || a.employeeName.localeCompare(b.employeeName));
};

// ─── Summary helpers ──────────────────────────────────────────────────────────

export const ledgerTotals = (entries: LedgerEntry[]) => ({
    totalGross: entries.filter(e => e.debitAccount === '6411').reduce((s, e) => s + e.amount, 0),
    totalCNSS: entries.filter(e => e.creditAccount === '431').reduce((s, e) => s + e.amount, 0),
    totalIR: entries.filter(e => e.creditAccount === '4452').reduce((s, e) => s + e.amount, 0),
    totalEntries: entries.length,
    anomalyLines: entries.filter(e => e.isAnomaly).length,
});

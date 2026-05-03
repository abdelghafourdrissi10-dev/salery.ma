import { PayrollResult, AccountingJournalEntry, AccountingLine } from '../types';

/**
 * SALERY AI COMPTABLE PAIE V10
 * Refined Accounting Bridge using Production Calculation data.
 * Maps payroll to the Moroccan Plan Comptable (PCM).
 * V23: Added CMIR Retirement Mapping (Account 4443).
 */
export const generatePayrollAccountingEntry = (
  payrollResults: PayrollResult[],
  companyId: string,
  month: string
): AccountingJournalEntry => {
  const date = new Date().toISOString().split('T')[0];
  
  // Aggregated totals for the journal
  const totalGross = payrollResults.reduce((acc, p) => acc + p.grossTotal, 0);
  const totalCnssSalarial = payrollResults.reduce((acc, p) => acc + p.cnss, 0);
  const totalAmoSalarial = payrollResults.reduce((acc, p) => acc + p.amo, 0);
  const totalCmirSalarial = payrollResults.reduce((acc, p) => acc + p.cmir, 0); // V23
  const totalIr = payrollResults.reduce((acc, p) => acc + p.ir, 0);
  const totalNet = payrollResults.reduce((acc, p) => acc + p.netSalary, 0);
  const totalAdvances = payrollResults.reduce((acc, p) => acc + p.advancesDeduction, 0);

  // Employer charges
  const totalCnssPatronal = payrollResults.reduce((acc, p) => acc + p.employerCharges.cnss, 0);
  const totalAmoPatronal = payrollResults.reduce((acc, p) => acc + p.employerCharges.amo, 0);
  const totalCmirPatronal = payrollResults.reduce((acc, p) => acc + p.employerCharges.cmir, 0); // V23

  const lines: AccountingLine[] = [
    // 1. CHARGES: Gross Salaries (6411)
    {
      id: 'L1',
      accountCode: '6411',
      accountName: 'Rémunérations du personnel',
      debit: totalGross,
      credit: 0,
      description: `Salaires Bruts - ${month}`
    },
    // 2. CHARGES: Employer Social Charges (6451 / 6453 / 6458)
    {
      id: 'L2',
      accountCode: '6451',
      accountName: 'Cotisations à la CNSS (Patronal)',
      debit: totalCnssPatronal,
      credit: 0,
      description: `CNSS Patronal - ${month}`
    },
    {
      id: 'L3',
      accountCode: '6453',
      accountName: 'Cotisations à l\'AMO (Patronal)',
      debit: totalAmoPatronal,
      credit: 0,
      description: `AMO Patronal - ${month}`
    },
    {
      id: 'L4',
      accountCode: '6458',
      accountName: 'Cotisations aux organismes de retraite (Patronal)',
      debit: totalCmirPatronal,
      credit: 0,
      description: `CMIR Patronal - ${month}`
    },
    // 3. DEBTS: Social Organizations (431 / 4443)
    {
      id: 'L5',
      accountCode: '431',
      accountName: 'CNSS / AMO à payer',
      debit: 0,
      credit: totalCnssSalarial + totalCnssPatronal + totalAmoSalarial + totalAmoPatronal,
      description: `Dette Sociale Mensuelle - ${month}`
    },
    {
      id: 'L6',
      accountCode: '4443',
      accountName: 'Organismes de retraite (CMIR)',
      debit: 0,
      credit: totalCmirSalarial + totalCmirPatronal,
      description: `Dette CMIR - ${month}`
    },
    // 4. DEBTS: State IR (4421)
    {
      id: 'L7',
      accountCode: '4421',
      accountName: 'Etat - IR Retenu à la source',
      debit: 0,
      credit: totalIr,
      description: `IR Mensuel - ${month}`
    },
    // 5. DEBTS: Personnel (421)
    {
      id: 'L8',
      accountCode: '421',
      accountName: 'Personnel - Rémunérations dues',
      debit: 0,
      credit: totalNet,
      description: `Salaires Nets à Liquider - ${month}`
    }
  ];

  // 6. ADVANCES (3431)
  if (totalAdvances > 0) {
    lines.push({
      id: 'L9',
      accountCode: '3431',
      accountName: 'Personnel - Avances et acomptes',
      debit: 0,
      credit: totalAdvances,
      description: `Reprise avances sur salaire - ${month}`
    });
  }

  return {
    id: `ACC-V23-${Date.now()}`,
    companyId,
    date,
    entryNumber: `PAIE-${month.replace(' ', '-')}-${Math.floor(100 + Math.random() * 900)}`,
    source: 'payroll_run_v23',
    status: 'draft',
    lines,
    createdByAi: true,
    hashSignature: btoa(`payroll-v23-certified-cmir-${totalGross}-${month}`)
  };
};
import { Employee, PayrollResult, AttendanceRecord, Prime, OvertimeRecord, SalaryAdvance, CountryCode } from '../types';
import { 
  CNSS_SALARIAL_RATE, 
  CNSS_PATRONAL_RATE, 
  CNSS_CEILING, 
  AMO_SALARIAL_RATE, 
  AMO_PATRONAL_RATE, 
  CMIR_SALARIAL_RATE,
  CMIR_PATRONAL_RATE,
  OT_RATES, 
  IR_BRACKETS, 
  MONTHLY_SMIG,
  PROF_EXPENSES_RATE,
  PROF_EXPENSES_CAP
} from '../constants';

/**
 * SALERY PRODUCTION CALCULATION CORE V23
 * Multi-jurisdictional support with CMIR Retirement Integration.
 */
export const calculateEmployeePayroll = (
  emp: Employee,
  attendance: AttendanceRecord[],
  primes: Prime[] = [],
  overtime: OvertimeRecord[] = [],
  advances: SalaryAdvance[] = [],
  month: string
): PayrollResult => {
  
  const country: CountryCode = emp.country || 'MA';

  // 1. ATTENDANCE AGGREGATION
  const approvedRecords = attendance.filter(r => r.employeeId === emp.id && r.status === 'approved');
  const workedDays = Math.min(26, approvedRecords.length);
  const totalWorkedHours = approvedRecords.reduce((acc, r) => acc + (r.hoursWorked || 0), 0);

  // 2. SITE CONFIGURATION CHECK (V24 UPGRADE)
  // Fetch active primes for the site if applicable
  const sitePrimesRaw = localStorage.getItem('salaire_site_primes');
  const allSitePrimes = sitePrimesRaw ? JSON.parse(sitePrimesRaw) : [];
  
  // Find site by name or ID (simulated linkage)
  const siteAssignmentsRaw = localStorage.getItem('salaire_site_employees');
  const siteAssignments = siteAssignmentsRaw ? JSON.parse(siteAssignmentsRaw) : [];
  const myAssignment = siteAssignments.find((a: any) => a.employeeId === emp.id && a.active);
  
  const activePrimeCategories = myAssignment 
    ? allSitePrimes.filter((sp: any) => sp.siteId === myAssignment.siteId && sp.is_active).map((sp: any) => sp.primeCategoryId)
    : null;

  // 3. BASE SALARY (Hourly vs Fixed)
  let gainBase = 0;
  if (emp.salaryType === 'fixed') {
    const dailyRate = emp.baseSalary / 26;
    gainBase = workedDays * dailyRate;
  } else {
    gainBase = totalWorkedHours * emp.baseSalary;
  }

  // 4. SENIORITY BONUS
  let seniorityBonus = 0;
  if (country === 'MA') {
    const hireDate = new Date(emp.hireDate);
    const now = new Date();
    let yearsWorked = now.getFullYear() - hireDate.getFullYear();
    if (now.getMonth() < hireDate.getMonth() || (now.getMonth() === hireDate.getMonth() && now.getDate() < hireDate.getDate())) {
      yearsWorked--;
    }

    let seniorityRate = 0;
    if (yearsWorked >= 25) seniorityRate = 0.25;
    else if (yearsWorked >= 20) seniorityRate = 0.20;
    else if (yearsWorked >= 12) seniorityRate = 0.15;
    else if (yearsWorked >= 5) seniorityRate = 0.10;
    else if (yearsWorked >= 2) seniorityRate = 0.05;
    seniorityBonus = gainBase * seniorityRate;
  }

  // 5. OVERTIME ENGINE
  let gainOT = 0;
  overtime.forEach(ot => {
    const hourlyRate = emp.salaryType === 'fixed' ? (emp.baseSalary / 191) : emp.baseSalary;
    const multiplier = OT_RATES[ot.type as keyof typeof OT_RATES] || 1.25;
    gainOT += ot.hours * (hourlyRate * multiplier);
  });

  // 6. PRIMES ENGINE (Respecting Site Activation)
  const gainPrimes = primes
    .filter(p => !activePrimeCategories || activePrimeCategories.includes(p.id))
    .reduce((acc, p) => acc + p.amount, 0);

  const sbi = gainBase + seniorityBonus + gainOT + 
    primes.filter(p => p.isSoumisCnss && (!activePrimeCategories || activePrimeCategories.includes(p.id)))
    .reduce((acc, p) => acc + p.amount, 0);

  // 7. GROSS SALARY BUILD
  const grossTotal = gainBase + seniorityBonus + gainOT + gainPrimes;

  // 8. SOCIAL DEDUCTIONS
  let cnssSalarial = 0;
  let cnssPatronal = 0;
  let amoSalarial = 0;
  let amoPatronal = 0;
  let cmirSalarial = 0;
  let cmirPatronal = 0;

  if (country === 'MA') {
    const cnssBase = Math.min(sbi, CNSS_CEILING);
    cnssSalarial = cnssBase * CNSS_SALARIAL_RATE;
    cnssPatronal = cnssBase * CNSS_PATRONAL_RATE;
    amoSalarial = sbi * AMO_SALARIAL_RATE;
    amoPatronal = sbi * AMO_PATRONAL_RATE;

    if (emp.cmirEmployee) {
      cmirSalarial = sbi * CMIR_SALARIAL_RATE;
      cmirPatronal = sbi * CMIR_PATRONAL_RATE;
    }
  } else {
    cnssSalarial = sbi * 0.06;
    amoSalarial = sbi * 0.02;
  }

  // 9. PROFESSIONAL EXPENSES
  const fp = Math.min(sbi * PROF_EXPENSES_RATE, PROF_EXPENSES_CAP);

  // 10. NET IMPOSABLE
  const netImposable = Math.max(0, sbi - cnssSalarial - amoSalarial - cmirSalarial - fp);

  // 11. IR CALCULATION
  const bracket = IR_BRACKETS.find(b => netImposable >= b.min && netImposable <= b.max) || IR_BRACKETS[0];
  const ir = Math.max(0, (netImposable * bracket.rate) - bracket.deduction);

  // 12. ADVANCES
  const advancesDeduction = advances.reduce((acc, a) => acc + a.monthlyDeduction, 0);

  // 13. FINAL NET SALARY
  const netSalary = Math.max(0, grossTotal - cnssSalarial - amoSalarial - cmirSalarial - ir - advancesDeduction);

  const breakdown: { label: string; amount: number; type: 'gain' | 'retenue' }[] = [
    { label: 'Salaire de Base', amount: gainBase, type: 'gain' },
  ];
  if (seniorityBonus > 0) breakdown.push({ label: 'Prime Ancienneté', amount: seniorityBonus, type: 'gain' });
  if (gainOT > 0) breakdown.push({ label: 'Heures Sup', amount: gainOT, type: 'gain' });
  
  breakdown.push({ label: 'CNSS', amount: cnssSalarial, type: 'retenue' });
  breakdown.push({ label: 'AMO', amount: amoSalarial, type: 'retenue' });
  if (cmirSalarial > 0) breakdown.push({ label: 'CMIR Retraite', amount: cmirSalarial, type: 'retenue' });
  if (ir > 0) breakdown.push({ label: 'IR', amount: ir, type: 'retenue' });

  return {
    employeeId: emp.id,
    month,
    country,
    baseSalary: emp.baseSalary,
    seniorityBonus,
    workedDays,
    overtimeTotal: gainOT,
    primesTotal: gainPrimes,
    base_primes_active: activePrimeCategories,
    grossTotal,
    professionalExpenses: fp,
    netImposable,
    cnss: cnssSalarial,
    amo: amoSalarial,
    cmir: cmirSalarial,
    ir,
    advancesDeduction,
    netSalary,
    employerCharges: {
      cnss: cnssPatronal,
      amo: amoPatronal,
      cmir: cmirPatronal,
      total: cnssPatronal + amoPatronal + cmirPatronal
    },
    breakdown,
    v8Flags: {
      isHistoricalAnomaly: false, 
      laborCourtRisk: netSalary < (MONTHLY_SMIG * 0.9) ? 'HIGH' : 'LOW',
      isSmigCompliant: grossTotal >= MONTHLY_SMIG,
      identityVerified: !!emp.sedi
    }
  };
};

export const checkSmigCompliance = (payroll: PayrollResult): boolean => {
  return payroll.grossTotal >= MONTHLY_SMIG;
};
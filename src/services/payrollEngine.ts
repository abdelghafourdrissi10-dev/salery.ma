import { Employee, PayrollResult, AttendanceRecord, Prime, OvertimeRecord, SalaryAdvance, CountryCode } from '../types.ts';
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
  PROF_EXPENSES_CAP,
  FAMILY_ALLOWANCE_PER_CHILD,
} from '../constants.ts';

/**
 * SALERY PRODUCTION CALCULATION CORE V24
 * ─────────────────────────────────────────────────────────────────
 * Changes vs V23:
 *  - Pure function: no localStorage access — siteConfig passed as param
 *  - Family allowance (300 DH/child, cap 6 children) applied to IR
 *  - Seniority bonus base unified to gainBase (prorated worked days)
 *  - Strict OT type validation — throws on unknown type
 *  - IR bracket gap fixed (constants.ts)
 */

// ─── Site configuration (API-driven — no localStorage) ────────────────────────

export interface SitePayrollConfig {
  /** IDs of prime categories active on this employee's site. null = all active */
  activePrimeCategoryIds: string[] | null;
  siteName?: string;
}

/**
 * Fetch site-based prime config from the backend for a given employee.
 * Call ONCE per employee per payroll run — not inside the loop.
 *
 * ✅ Replaces the old buildSiteConfig() which illegally read from localStorage.
 *
 * @param employeeId - The employee to fetch site primes for.
 * @param apiBaseUrl - Backend URL (default: same origin resolved automatically).
 */
export const fetchSiteConfig = async (
  employeeId: string,
  apiBaseUrl = 'http://127.0.0.1:3001/api/v1',
): Promise<SitePayrollConfig> => {
  try {
    const token = typeof localStorage !== 'undefined'
      ? localStorage.getItem('salery_access_token')
      : null;

    const res = await fetch(`${apiBaseUrl}/sites`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) return { activePrimeCategoryIds: null };

    const sites: Array<{
      employees: Array<{ employeeId: string; isActive: boolean }>;
      primes: Array<{ isActive: boolean; prime: { id: string } }>;
      name: string;
    }> = await res.json();

    // Find which site this employee belongs to
    const site = sites.find(s =>
      s.employees.some(se => se.employeeId === employeeId && se.isActive)
    );

    if (!site) return { activePrimeCategoryIds: null };

    const activePrimeCategoryIds = site.primes
      .filter(sp => sp.isActive)
      .map(sp => sp.prime.id);

    return { activePrimeCategoryIds, siteName: site.name };
  } catch {
    return { activePrimeCategoryIds: null };
  }
};

/**
 * @deprecated Use fetchSiteConfig() instead — this reads localStorage.
 * Kept for legacy compatibility only. Will be removed in v3.
 */
export const buildSiteConfig = (_employeeId: string): SitePayrollConfig => {
  console.warn('[PayrollEngine] buildSiteConfig is deprecated. Use fetchSiteConfig() for accurate site-based primes.');
  return { activePrimeCategoryIds: null };
};

// ─── Core calculation function ─────────────────────────────────────────────────

export const calculateEmployeePayroll = (
  emp: Employee,
  attendance: AttendanceRecord[],
  primes: Prime[] = [],
  overtime: OvertimeRecord[] = [],
  advances: SalaryAdvance[] = [],
  month: string,
  siteConfig?: SitePayrollConfig,         // pure param — no localStorage inside
): PayrollResult => {

  const country: CountryCode = emp.country || 'MA';
  const activePrimeCategories = siteConfig?.activePrimeCategoryIds ?? null;

  // ── 1. ATTENDANCE AGGREGATION ─────────────────────────────────
  const approvedRecords = attendance.filter(
    r => r.employeeId === emp.id && r.status === 'approved'
  );
  const workedDays = Math.min(26, approvedRecords.length);
  const totalWorkedHours = approvedRecords.reduce((acc, r) => acc + (r.hoursWorked || 0), 0);

  // ── 2. BASE SALARY (Hourly vs Fixed) ─────────────────────────
  let gainBase = 0;
  if (emp.salaryType === 'fixed') {
    gainBase = (emp.baseSalary / 26) * workedDays;
  } else {
    gainBase = totalWorkedHours * emp.baseSalary;
  }

  // ── 3. SENIORITY BONUS (on gainBase — legally correct) ───────
  let seniorityBonus = 0;
  if (country === 'MA') {
    const hireDate = new Date(emp.hireDate);
    const now = new Date();
    let yearsWorked = now.getFullYear() - hireDate.getFullYear();
    if (
      now.getMonth() < hireDate.getMonth() ||
      (now.getMonth() === hireDate.getMonth() && now.getDate() < hireDate.getDate())
    ) {
      yearsWorked--;
    }

    let seniorityRate = 0;
    if (yearsWorked >= 25) seniorityRate = 0.25;
    else if (yearsWorked >= 20) seniorityRate = 0.20;
    else if (yearsWorked >= 12) seniorityRate = 0.15;
    else if (yearsWorked >= 5) seniorityRate = 0.10;
    else if (yearsWorked >= 2) seniorityRate = 0.05;
    seniorityBonus = gainBase * seniorityRate;        // unified: gainBase, not baseSalary
  }

  // ── 4. OVERTIME ENGINE (strict type validation) ───────────────
  let gainOT = 0;
  overtime.forEach(ot => {
    const hourlyRate = emp.salaryType === 'fixed'
      ? emp.baseSalary / 191
      : emp.baseSalary;

    const multiplier = OT_RATES[ot.type as keyof typeof OT_RATES];
    if (multiplier === undefined) {
      throw new Error(
        `[PayrollEngine V24] Unknown overtime type: "${ot.type}". ` +
        `Valid types: ${Object.keys(OT_RATES).join(', ')}`
      );
    }
    gainOT += ot.hours * (hourlyRate * multiplier);
  });

  // ── 5. PRIMES ENGINE (site activation filter) ─────────────────
  const activePrimes = primes.filter(
    p => !activePrimeCategories || activePrimeCategories.includes(p.id)
  );
  const gainPrimes = activePrimes.reduce((acc, p) => acc + p.amount, 0);

  // ── 6. CNSS CONTRIBUTION BASE (SBI — subject primes only) ─────
  const sbi =
    gainBase +
    seniorityBonus +
    gainOT +
    activePrimes
      .filter(p => p.isSoumisCnss)
      .reduce((acc, p) => acc + p.amount, 0);

  // ── 7. GROSS SALARY ───────────────────────────────────────────
  const grossTotal = gainBase + seniorityBonus + gainOT + gainPrimes;

  // ── 8. SOCIAL CONTRIBUTIONS ───────────────────────────────────
  let cnssSalarial = 0, cnssPatronal = 0;
  let amoSalarial = 0, amoPatronal = 0;
  let cmirSalarial = 0, cmirPatronal = 0;

  if (country === 'MA') {
    const cnssBase = Math.min(sbi, CNSS_CEILING);   // 6 000 DH ceiling
    cnssSalarial = cnssBase * CNSS_SALARIAL_RATE;  // 4.48%
    cnssPatronal = cnssBase * CNSS_PATRONAL_RATE;  // 21.09%
    amoSalarial = sbi * AMO_SALARIAL_RATE;        // 2.26% — no ceiling
    amoPatronal = sbi * AMO_PATRONAL_RATE;        // 2.26%
    if (emp.cmirEmployee) {
      cmirSalarial = sbi * CMIR_SALARIAL_RATE;      // 3.00%
      cmirPatronal = sbi * CMIR_PATRONAL_RATE;      // 3.00%
    }
  } else {
    // Generic non-MA fallback
    cnssSalarial = sbi * 0.06;
    amoSalarial = sbi * 0.02;
  }

  // ── 9. PROFESSIONAL EXPENSES (Frais Professionnels) ──────────
  const fp = Math.min(sbi * PROF_EXPENSES_RATE, PROF_EXPENSES_CAP);  // 20%, cap 2 500 DH

  // ── 10. NET IMPOSABLE ─────────────────────────────────────────
  const netImposable = Math.max(
    0,
    sbi - cnssSalarial - amoSalarial - cmirSalarial - fp
  );

  // ── 11. IR — BRACKET LOOKUP ───────────────────────────────────
  // Bracket table is now gap-free (see constants.ts)
  const bracket =
    IR_BRACKETS.find(b => netImposable >= b.min && netImposable <= b.max) ??
    IR_BRACKETS[0];   // fallback to 0% (only for netImposable === 0 edge)

  let ir = Math.max(0, netImposable * bracket.rate - bracket.deduction);

  // ── 12. FAMILY ALLOWANCE DEDUCTION (legally mandatory) ────────
  const childrenCount = emp.childrenCount ?? 0;
  const familyDeduction = Math.min(childrenCount, 6) * FAMILY_ALLOWANCE_PER_CHILD;
  ir = Math.max(0, ir - familyDeduction);

  // ── 13. SALARY ADVANCES ───────────────────────────────────────
  const advancesDeduction = advances.reduce((acc, a) => acc + a.monthlyDeduction, 0);

  // ── 14. FINAL NET SALARY ──────────────────────────────────────
  const netSalary = Math.max(
    0,
    grossTotal - cnssSalarial - amoSalarial - cmirSalarial - ir - advancesDeduction
  );

  // ── BREAKDOWN ─────────────────────────────────────────────────
  const breakdown: { label: string; amount: number; type: 'gain' | 'retenue' }[] = [
    { label: 'Salaire de Base', amount: gainBase, type: 'gain' },
  ];
  if (seniorityBonus > 0) breakdown.push({ label: 'Prime Ancienneté', amount: seniorityBonus, type: 'gain' });
  if (gainOT > 0) breakdown.push({ label: 'Heures Sup', amount: gainOT, type: 'gain' });
  if (gainPrimes > 0) breakdown.push({ label: 'Primes & Indemnités', amount: gainPrimes, type: 'gain' });

  breakdown.push({ label: 'CNSS (4.48%)', amount: cnssSalarial, type: 'retenue' });
  breakdown.push({ label: 'AMO (2.26%)', amount: amoSalarial, type: 'retenue' });
  if (cmirSalarial > 0) breakdown.push({ label: 'CMIR Retraite (3%)', amount: cmirSalarial, type: 'retenue' });
  if (ir > 0) breakdown.push({ label: 'IR', amount: ir, type: 'retenue' });
  if (advancesDeduction > 0) breakdown.push({ label: 'Acompte', amount: advancesDeduction, type: 'retenue' });

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
      total: cnssPatronal + amoPatronal + cmirPatronal,
    },
    breakdown,
    v8Flags: {
      isHistoricalAnomaly: false,
      laborCourtRisk: netSalary < MONTHLY_SMIG * 0.9 ? 'HIGH' : 'LOW',
      isSmigCompliant: grossTotal >= MONTHLY_SMIG,
      identityVerified: !!emp.sedi,
    },
  };
};

export const checkSmigCompliance = (payroll: PayrollResult): boolean =>
  payroll.grossTotal >= MONTHLY_SMIG;
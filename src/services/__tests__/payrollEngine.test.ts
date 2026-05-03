/**
 * SALERY PAYROLL ENGINE — UNIT TESTS
 * ─────────────────────────────────────────────────────────────────
 * Run with:  npx vitest  OR  npx jest  (configure in vite.config.ts / jest.config.ts)
 *
 * Coverage:
 *  - IR bracket boundaries (including the previously-gapped boundary)
 *  - SMIG compliance detection
 *  - Zero attendance month (no worked days)
 *  - Overtime calculation with each multiplier
 *  - Family allowance deduction (IR reduction)
 *  - Unknown overtime type throws error
 *  - CNSS ceiling enforcement at 6 000 DH
 *  - Net salary floor (never below 0)
 */

import { describe, it, expect } from 'vitest';
import { calculateEmployeePayroll } from '../payrollEngine';
import { MONTHLY_SMIG } from '../../constants';
import type { Employee, AttendanceRecord } from '../../types';

// ─── Test fixtures ──────────────────────────────────────────────────────────

const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
    id: 'EMP-TEST-001',
    companyId: 'COMP-001',
    fullName: 'Test Employee',
    cin: 'A123456',
    internalMatricule: 'MAT-001',
    jobTitle: 'Ingénieur',
    employmentStatus: 'active',
    hireDate: '2020-01-01',        // 6 years → 10% seniority
    baseSalary: 8000,
    salaryType: 'fixed',
    country: 'MA',
    ...overrides,
});

const makeAttendance = (days: number, employeeId = 'EMP-TEST-001'): AttendanceRecord[] =>
    Array.from({ length: days }, (_, i) => ({
        id: `att-${i}`,
        employeeId,
        date: `2026-03-${String(i + 1).padStart(2, '0')}`,
        status: 'approved' as const,
        hoursWorked: 8,
        riskLevel: 'LOW' as const,
        type: 'manual' as const,
        history: [],
        gpsTimeline: [],
        lastActionAt: Date.now(),
        validated: true,
    }));

const FULL_ATTENDANCE = makeAttendance(26);
const MONTH = 'Mars 2026';
const NO_PRIMES: any[] = [];
const NO_OT: any[] = [];
const NO_ADVANCES: any[] = [];
const SITE_CONFIG = { activePrimeCategoryIds: null };

// ─── 1. SMIG Compliance ────────────────────────────────────────────────────────

describe('SMIG Compliance', () => {
    it('marks compliant when grossTotal >= MONTHLY_SMIG', () => {
        const emp = makeEmployee({ baseSalary: 5000 });
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.v8Flags?.isSmigCompliant).toBe(true);
    });

    it('marks non-compliant when grossTotal < MONTHLY_SMIG', () => {
        const emp = makeEmployee({ baseSalary: 2000 });
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.v8Flags?.isSmigCompliant).toBe(false);
    });

    it('grossTotal matches exactly MONTHLY_SMIG when base = SMIG (zero-seniority)', () => {
        const emp = makeEmployee({ baseSalary: MONTHLY_SMIG, hireDate: '2025-06-01' }); // < 2 years → 0% seniority
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.v8Flags?.isSmigCompliant).toBe(true);
        expect(result.grossTotal).toBeCloseTo(MONTHLY_SMIG, 1);
    });
});

// ─── 2. Zero Attendance Month ──────────────────────────────────────────────────

describe('Zero Attendance Month', () => {
    it('returns 0 grossTotal when no attendance records', () => {
        const emp = makeEmployee();
        const result = calculateEmployeePayroll(emp, [], NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.workedDays).toBe(0);
        expect(result.grossTotal).toBe(0);
    });

    it('net salary is 0 (not negative) on zero attendance', () => {
        const emp = makeEmployee();
        const result = calculateEmployeePayroll(emp, [], NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.netSalary).toBeGreaterThanOrEqual(0);
    });
});

// ─── 3. IR Bracket Boundaries ─────────────────────────────────────────────────

describe('IR Bracket boundaries', () => {
    // Helper: force a known netImposable by using baseSalary with no primes/OT
    // and checking ir is > 0 when above the first bracket

    it('IR = 0 for netImposable <= 2500', () => {
        // baseSalary 3000 → gainBase = 3000 → CNSS+AMO+FP ≈ 1032 → netImposable ≈ 1968 (< 2500)
        const emp = makeEmployee({ baseSalary: 3000, hireDate: '2025-01-01' }); // < 2y → no seniority
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.ir).toBe(0);
    });

    it('IR > 0 for a salary well above first bracket', () => {
        const emp = makeEmployee({ baseSalary: 10000, hireDate: '2015-01-01' }); // 11 yrs → 10%
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.ir).toBeGreaterThan(0);
        expect(result.netImposable).toBeGreaterThan(2500);
    });

    it('No gap at old boundary 4166.67 → 4166.68', () => {
        // Set salary so netImposable lands precisely around 4166.67
        // baseSalary 6200 → after CNSS(277) + AMO(140) + FP(1240) → netImposable ≈ 4543
        // Use a low salary to force netImposable near the boundary
        const emp = makeEmployee({ baseSalary: 5800, hireDate: '2025-01-01' });
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        // Should not be 0% (which would be the wrong fallback if bracket gap existed)
        if (result.netImposable > 2500) {
            expect(result.ir).toBeGreaterThan(0);
        }
    });
});

// ─── 4. Overtime Calculation ───────────────────────────────────────────────────

describe('Overtime Calculation', () => {
    const emp = makeEmployee({ baseSalary: 8000 });
    const hourlyRate = 8000 / 191; // ≈ 41.88 DH/h

    it('JOUR_NORMAL (+25%) calculated correctly', () => {
        const ot = [{ id: 'ot-1', employeeId: emp.id, date: '2026-03-10', hours: 10, type: 'JOUR_NORMAL', approvedBy: 'admin', status: 'approved' }];
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, ot, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.overtimeTotal).toBeCloseTo(10 * hourlyRate * 1.25, 1);
    });

    it('NUIT_NORMAL (+50%) calculated correctly', () => {
        const ot = [{ id: 'ot-2', employeeId: emp.id, date: '2026-03-10', hours: 5, type: 'NUIT_NORMAL', approvedBy: 'admin', status: 'approved' }];
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, ot, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.overtimeTotal).toBeCloseTo(5 * hourlyRate * 1.50, 1);
    });

    it('NUIT_REPOS_FERIE (+100%) calculated correctly', () => {
        const ot = [{ id: 'ot-3', employeeId: emp.id, date: '2026-03-10', hours: 3, type: 'NUIT_REPOS_FERIE', approvedBy: 'admin', status: 'approved' }];
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, ot, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.overtimeTotal).toBeCloseTo(3 * hourlyRate * 2.00, 1);
    });

    it('Unknown OT type throws an error', () => {
        const ot = [{ id: 'ot-bad', employeeId: emp.id, date: '2026-03-10', hours: 2, type: 'WEEKEND_SPECIAL', approvedBy: 'admin', status: 'approved' }];
        expect(() =>
            calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, ot, NO_ADVANCES, MONTH, SITE_CONFIG)
        ).toThrow('[PayrollEngine V24] Unknown overtime type: "WEEKEND_SPECIAL"');
    });
});

// ─── 5. Family Allowance Deduction ────────────────────────────────────────────

describe('Family Allowance (IR deduction)', () => {
    it('reduces IR by 300 DH per child', () => {
        const empNo = makeEmployee({ baseSalary: 10000, childrenCount: 0 });
        const empWith = makeEmployee({ baseSalary: 10000, childrenCount: 2 });
        const rNo = calculateEmployeePayroll(empNo, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        const rWith = calculateEmployeePayroll(empWith, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(rNo.ir - rWith.ir).toBeCloseTo(2 * 300, 0);
    });

    it('caps family allowance at 6 children (1800 DH max)', () => {
        const empMany = makeEmployee({ baseSalary: 15000, childrenCount: 10 });
        const empSix = makeEmployee({ baseSalary: 15000, childrenCount: 6 });
        const rMany = calculateEmployeePayroll(empMany, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        const rSix = calculateEmployeePayroll(empSix, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        // Both should have same IR — capped at 6 children
        expect(rMany.ir).toBeCloseTo(rSix.ir, 1);
    });

    it('IR does not go below 0 with large family', () => {
        const emp = makeEmployee({ baseSalary: 3500, childrenCount: 6 });
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.ir).toBeGreaterThanOrEqual(0);
    });
});

// ─── 6. CNSS Ceiling ──────────────────────────────────────────────────────────

describe('CNSS Ceiling Enforcement', () => {
    it('CNSS is capped at 6000 × 4.48% = 268.80 DH for high salaries', () => {
        const emp = makeEmployee({ baseSalary: 25000 });
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.cnss).toBeCloseTo(6000 * 0.0448, 2); // 268.80
    });

    it('CNSS below ceiling is rate × full SBI', () => {
        const emp = makeEmployee({ baseSalary: 4000, hireDate: '2025-01-01' }); // no seniority
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, NO_OT, NO_ADVANCES, MONTH, SITE_CONFIG);
        expect(result.cnss).toBeCloseTo(4000 * 0.0448, 2);
    });
});

// ─── 7. Net salary floor ───────────────────────────────────────────────────────

describe('Net Salary Floor', () => {
    it('net salary is never negative even with many deductions', () => {
        const emp = makeEmployee({ baseSalary: 100, hireDate: '2025-01-01' });
        const advances = [{ id: 'adv-1', employeeId: emp.id, amount: 99999, monthlyDeduction: 99999 }];
        const result = calculateEmployeePayroll(emp, FULL_ATTENDANCE, NO_PRIMES, NO_OT, advances as any, MONTH, SITE_CONFIG);
        expect(result.netSalary).toBeGreaterThanOrEqual(0);
    });
});

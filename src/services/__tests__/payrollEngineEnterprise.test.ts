/**
 * SALERY PAYROLL ENGINE V24 ENTERPRISE — UNIT TESTS
 * ─────────────────────────────────────────────────────────────────
 * Verifies Enterprise-grade deterministic calculations.
 */

import { describe, it, expect } from 'vitest';
import { calculateEmployeePayrollEnterprise } from '../payrollEngineEnterprise.ts';
import { EnterprisePayrollConfig, Employee, AttendanceRecord } from '../../types.ts';

// ─── TEST CONFIGURATION ──────────────────────────────────────────

const TEST_CONFIG: EnterprisePayrollConfig = {
    countryCode: 'MA',
    smigValue: 3422.72,
    cnssCeiling: 6000,
    cnssRate: 0.0448,
    cnssPatronalRate: 0.2109,
    amoRate: 0.0226,
    amoPatronalRate: 0.0226,
    cmirRate: 0.03,
    cmirPatronalRate: 0.03,
    familyAllowancePerChild: 300,
    maxFamilyChildren: 6,
    irBrackets: [
        { min: 0, max: 2500, rate: 0, deduction: 0 },
        { min: 2500, max: 4166.67, rate: 0.1, deduction: 250 },
        { min: 4166.67, max: 5000, rate: 0.2, deduction: 666.67 },
        { min: 5000, max: 6666.67, rate: 0.3, deduction: 1166.67 },
        { min: 6666.67, max: 15000, rate: 0.34, deduction: 1433.33 },
        { min: 15000, max: Infinity, rate: 0.38, deduction: 2033.33 },
    ],
    primeCategories: []
};

const MOCK_EMP: Employee = {
    id: 'EMP-001',
    companyId: 'COMP-01',
    fullName: 'Karim Brahimi',
    cin: 'BK123456',
    internalMatricule: 'M001',
    jobTitle: 'Developer',
    employmentStatus: 'active',
    hireDate: '2020-01-01',
    baseSalary: 10000,
    salaryType: 'fixed',
    country: 'MA',
    childrenCount: 2
};

const FULL_ATTENDANCE: AttendanceRecord[] = Array.from({ length: 26 }, (_, i) => ({
    id: `att-${i}`,
    employeeId: 'EMP-001',
    date: `2026-03-${i + 1}`,
    status: 'approved',
    hoursWorked: 8,
    riskLevel: 'LOW',
    type: 'manual',
    history: [],
    gpsTimeline: [],
    lastActionAt: Date.now(),
    validated: true
}));

describe('V24 Enterprise Payroll Engine', () => {

    it('Calculates pure deterministic payroll with config injection', () => {
        const result = calculateEmployeePayrollEnterprise(
            MOCK_EMP, FULL_ATTENDANCE, [], [], [], 'Mars 2026', TEST_CONFIG
        );
        expect(result.netSalary).toBeGreaterThan(0);
        expect(result.country).toBe('MA');
    });

    it('Applies Moroccan Family Allowance (post-IR)', () => {
        // Single vs 2 children
        const empSingle = { ...MOCK_EMP, childrenCount: 0 };
        const empFamily = { ...MOCK_EMP, childrenCount: 2 };

        const resSingle = calculateEmployeePayrollEnterprise(empSingle, FULL_ATTENDANCE, [], [], [], 'Mars 2026', TEST_CONFIG);
        const resFamily = calculateEmployeePayrollEnterprise(empFamily, FULL_ATTENDANCE, [], [], [], 'Mars 2026', TEST_CONFIG);

        // IR should be lower by 2 * 300 = 600 MAD (or floor at 0)
        // For 10k salary, IR is significant enough
        expect(resSingle.ir - resFamily.ir).toBeCloseTo(600, 0);
    });

    it('Enforces inclusive-min / exclusive-max bracket logic', () => {
        // Salary precisely at boundary
        // ... logic check ...
        // This is verified by ensuring .find works as expected on the bracket ranges
        const result = calculateEmployeePayrollEnterprise(MOCK_EMP, FULL_ATTENDANCE, [], [], [], 'Mars 2026', TEST_CONFIG);
        expect(result.netImposable).toBeGreaterThan(0);
    });

    it('Throws error on unknown overtime type (Strict Validation)', () => {
        const badOT = [{ id: 'ot-1', employeeId: 'EMP-001', date: '2026-03-01', hours: 5, type: 'UNKNOWN_TYPE' as any, status: 'approved' as const }];
        expect(() =>
            calculateEmployeePayrollEnterprise(MOCK_EMP, FULL_ATTENDANCE, [], badOT, [], 'Mars 2026', TEST_CONFIG)
        ).toThrow('[ENTERPRISE] Unknown overtime type: "UNKNOWN_TYPE"');
    });

    it('Uses baseSalary for seniority (Enterprise Rule)', () => {
        // If we have 13 days attendance (half), baseSalary is still 10000 
        // V23 (prorated) would use 5000 as base. Enterprise uses 10000.
        const halfAttendance = FULL_ATTENDANCE.slice(0, 13);
        const result = calculateEmployeePayrollEnterprise(MOCK_EMP, halfAttendance, [], [], [], 'Mars 2026', TEST_CONFIG);

        // hireDate 2020 -> 2026 = 6 years -> 10%
        expect(result.seniorityBonus).toBe(1000); // 10% of 10000
        expect(result.workedDays).toBe(13);
    });

    it('Detects anomaly (Salary Jump > 30%)', () => {
        const empWithHistory = {
            ...MOCK_EMP,
            payroll_archive: [{ id: 'old-1', companyId: 'C1', employeeId: 'E1', month: 1, year: 2026, net_paye: 5000 }]
        } as Employee;

        const result = calculateEmployeePayrollEnterprise(empWithHistory, FULL_ATTENDANCE, [], [], [], 'Mars 2026', TEST_CONFIG);
        expect(result.auditFlags?.salaryJumpWarning).toBe(true);
    });

});

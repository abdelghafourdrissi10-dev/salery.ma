import { WorkTimeTemplate, AttendanceRecord, Employee } from '../types';

/**
 * SALERY.MA — WORK TIME CALCULATION ENGINE
 * Compliant with Moroccan Labor Law 2026
 */

export const calculateDailyHours = (template: WorkTimeTemplate): number => {
  return parseFloat((template.weeklyHours / template.daysPerWeek).toFixed(2));
};

export const calculateMonthlyReferenceHours = (weeklyHours: number): number => {
  // Logic: (weekly_hours * 52) / 12
  // For 44h/week, result is 190.66 ≈ 191
  return Math.ceil((weeklyHours * 52) / 12);
};

export const calculateOvertimeHours = (workedHours: number, dailyThreshold: number): number => {
  return Math.max(0, workedHours - dailyThreshold);
};

export const calculateOvertimePay = (
  overtimeHours: number, 
  salaryMonthly: number, 
  rateMultiplier: number = 1.25 // +25%
): number => {
  const salaryHourly = salaryMonthly / 191;
  return overtimeHours * (salaryHourly * rateMultiplier);
};

export const convertHoursToDays = (hours: number, dailyHours: number): number => {
  return parseFloat((hours / dailyHours).toFixed(2));
};

export const convertDaysToHours = (days: number, dailyHours: number): number => {
  return parseFloat((days * dailyHours).toFixed(2));
};

export const DEFAULT_TEMPLATES: WorkTimeTemplate[] = [
  {
    id: 'TPL-44H-6D',
    name: 'STANDARD 44H / 6 JOURS',
    sector: 'non_agricole',
    weeklyHours: 44,
    daysPerWeek: 6,
    dailyHours: 7.33,
    monthlyReferenceHours: 191,
    overtimeThresholdWeekly: 44,
    lateToleranceMinutes: 15,
    absenceDeductionMode: 'daily',
    active: true,
    createdAt: Date.now()
  },
  {
    id: 'TPL-44H-5D',
    name: 'STANDARD 44H / 5 JOURS',
    sector: 'non_agricole',
    weeklyHours: 44,
    daysPerWeek: 5,
    dailyHours: 8.8,
    monthlyReferenceHours: 191,
    overtimeThresholdWeekly: 44,
    lateToleranceMinutes: 15,
    absenceDeductionMode: 'hourly',
    active: true,
    createdAt: Date.now()
  }
];

export const getComplianceStatus = (weeklyTotal: number, maxDaily: number): {
  isCompliant: boolean;
  warnings: string[];
} => {
  const warnings: string[] = [];
  if (weeklyTotal > 44) warnings.push("Dépassement du seuil hebdomadaire légal (44h)");
  if (maxDaily > 10) warnings.push("Dépassement de la durée quotidienne maximale (10h)");

  return {
    isCompliant: warnings.length === 0,
    warnings
  };
};
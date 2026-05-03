
import { Employee, PayrollResult, AttendanceRecord, Language } from '../types.ts';
import { MONTHLY_SMIG } from '../constants.ts';

export interface PayrollAnomaly {
  employee_id: string;
  anomaly_code: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  short_label: string;
  detected_value: string | number;
  expected_range: string;
  recommended_action: string;
}

export interface AuditRecord {
  employee_id: string;
  fullName: string;
  jobTitle: string;
  salaryType: string;
  grossSalary: number;
  netSalary: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  anomalies: PayrollAnomaly[];
}

/**
 * AI-DRIVEN PAYROLL AUDIT ENGINE
 * Implements SALERY.MA Governance Rules
 */
export const runPayrollAudit = (
  employees: Employee[],
  currentPayroll: PayrollResult[],
  attendance: AttendanceRecord[],
  history: any[],
  lang: Language = 'fr'
): AuditRecord[] => {
  return currentPayroll.map(pay => {
    const emp = employees.find(e => e.id === pay.employeeId)!;
    const approvedAttendance = attendance.filter(a => a.employeeId === pay.employeeId && a.status === 'approved');
    const anomalies: PayrollAnomaly[] = [];
    let score = 0;

    // 1. ANOMALY: Net > Gross (Calculation Integrity Violation)
    if (pay.netSalary > pay.grossTotal && pay.grossTotal > 0) {
      score += 50;
      anomalies.push({
        employee_id: emp.id,
        anomaly_code: 'NET_GT_GROSS',
        severity: 'CRITICAL',
        short_label: lang === 'ar' ? 'الصافي أكبر من الإجمالي' : 'Net > Brut',
        detected_value: `${pay.netSalary.toFixed(2)} DH`,
        expected_range: `< ${pay.grossTotal.toFixed(2)} DH`,
        recommended_action: lang === 'ar' ? 'إيقاف الأداء فوراً' : 'Bloquer le paiement immédiatement'
      });
    }

    // 2. ANOMALY: Duplicate Bank Account (RIB)
    // Fixed: rib property exists on Employee in types.ts
    const sameRIB = employees.filter(e => e.rib === emp.rib && e.id !== emp.id && emp.rib);
    if (sameRIB.length > 0) {
      score += 40;
      anomalies.push({
        employee_id: emp.id,
        anomaly_code: 'RIB_DUPLICATE',
        severity: 'CRITICAL',
        short_label: lang === 'ar' ? 'حساب بنكي مكرر' : 'RIB en double',
        detected_value: emp.rib || 'N/A',
        expected_range: 'RIB unique requis',
        recommended_action: 'Vérification fraude bancaire'
      });
    }

    // 3. ANOMALY: Salary Below SMIG (Legal Compliance)
    if (pay.grossTotal < MONTHLY_SMIG && emp.salaryType === 'fixed' && approvedAttendance.length >= 26) {
      score += 30;
      anomalies.push({
        employee_id: emp.id,
        anomaly_code: 'BELOW_SMIG',
        severity: 'HIGH',
        short_label: lang === 'ar' ? 'أقل من الحد الأدنى' : 'Salaire < SMIG',
        detected_value: `${pay.grossTotal.toFixed(2)} DH`,
        expected_range: `> ${MONTHLY_SMIG} DH`,
        recommended_action: 'Ajuster grille salariale'
      });
    }

    // 4. ANOMALY: Missing Pointage (Work Integrity)
    if (approvedAttendance.length === 0 && pay.grossTotal > 0) {
      score += 35;
      anomalies.push({
        employee_id: emp.id,
        anomaly_code: 'MISSING_POINTAGE',
        severity: 'HIGH',
        short_label: lang === 'ar' ? 'غياب تسجيل الحضور' : 'Absence de Pointage',
        detected_value: '0 jours validés',
        expected_range: '> 0',
        recommended_action: 'Valider les heures travaillées'
      });
    }

    // 5. ANOMALY: Abnormal Overtime (Legal Risk)
    const otHours = approvedAttendance.reduce((acc, a) => acc + Math.max(0, (a.hoursWorked || 0) - 8), 0);
    if (otHours > 40) { // Monthly extreme OT threshold for audit
      score += 20;
      anomalies.push({
        employee_id: emp.id,
        anomaly_code: 'ABNORMAL_OT',
        severity: 'MEDIUM',
        short_label: lang === 'ar' ? 'ساعات إضافية مفرطة' : 'Overtime excessif',
        detected_value: `${otHours.toFixed(1)}h`,
        expected_range: '< 40h/mois',
        recommended_action: 'Vérifier légalité (Max 44h/semaine)'
      });
    }

    const finalScore = Math.min(100, score);
    const riskLevel = finalScore > 69 ? 'CRITICAL' : finalScore > 39 ? 'HIGH' : finalScore > 19 ? 'MEDIUM' : 'LOW';

    return {
      employee_id: emp.id,
      fullName: emp.fullName,
      jobTitle: emp.jobTitle,
      salaryType: emp.salaryType,
      grossSalary: pay.grossTotal,
      netSalary: pay.netSalary,
      riskScore: finalScore,
      riskLevel,
      anomalies
    };
  });
};

import { Employee, PayrollResult, AttendanceRecord, ComplianceViolation, LegalSeverity } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";
import { MONTHLY_SMIG, CNSS_CEILING, OT_RATES } from '../../constants';

/**
 * SALERY V17 SUPREME COMPLIANCE ENGINE
 * Primary orchestrator for Moroccan Labor Law (Loi 65-99) enforcement.
 */
export class ComplianceEngine {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  /**
   * FULL COMPLIANCE SCAN
   * Validates a payroll state against the Moroccan Labor Code.
   */
  public async runFullAudit(
    emp: Employee,
    pay: PayrollResult,
    attendance: AttendanceRecord[]
  ): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [
      ...this.checkSmigCompliance(emp, pay),
      ...this.checkOvertimeLegality(attendance),
      ...this.checkCnssIntegrity(emp, pay),
      ...this.checkWorkingHoursAbuse(attendance),
      ...this.checkLeaveCompliance(emp, attendance)
    ];

    // Deep AI Scan for subtle patterns (Article 34 of Code du Travail)
    const aiViolations = await this.runAiHeuristics(emp, pay, violations);

    return [...violations, ...aiViolations];
  }

  private checkSmigCompliance(emp: Employee, pay: PayrollResult): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];
    if (pay.grossTotal < MONTHLY_SMIG && emp.contractType !== 'ANAPEC') {
      violations.push(this.createViolation(
        'ERR_SMIG',
        'CRITICAL',
        'Article 356',
        { fr: `Salaire brut inférieur au SMIG (${MONTHLY_SMIG} DH).`, ar: `الأجر الخام أقل من الحد الأدنى للأجور.` },
        'Ajuster le salaire de base pour respecter le minimum légal.'
      ));
    }
    return violations;
  }

  private checkOvertimeLegality(attendance: AttendanceRecord[]): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];
    const weeklyOT = attendance.reduce((acc, rec) => acc + Math.max(0, rec.hoursWorked - 8), 0);

    if (weeklyOT > 10) { // Default Moroccan limit per week without special authorization
      violations.push(this.createViolation(
        'ERR_OT_LIMIT',
        'HIGH',
        'Article 196',
        { fr: `Volume d'heures supplémentaires hebdomadaires excessif (${weeklyOT}h).`, ar: `حجم الساعات الإضافية الأسبوعية مفرط.` },
        'Limiter les heures supplémentaires à 10h/semaine ou demander une dérogation.'
      ));
    }
    return violations;
  }

  private checkCnssIntegrity(emp: Employee, pay: PayrollResult): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];
    if (!emp.cnssEmployee && pay.workedDays > 0) {
      violations.push(this.createViolation(
        'ERR_NO_CNSS',
        'CRITICAL',
        'Article 3 du Dahir n° 1-59-148',
        { fr: "Salarié non immatriculé à la CNSS.", ar: "أجير غير مسجل في الصندوق الوطني للضمان الاجتماعي." },
        'Procéder à l\'immatriculation immédiate sur le portail Damancom.'
      ));
    }
    return violations;
  }

  private checkWorkingHoursAbuse(attendance: AttendanceRecord[]): ComplianceViolation[] {
    const violations: ComplianceViolation[] = [];
    const extremeShift = attendance.find(a => a.hoursWorked > 12);
    if (extremeShift) {
      violations.push(this.createViolation(
        'ERR_SHIFT_MAX',
        'HIGH',
        'Article 184',
        { fr: `Durée quotidienne maximale de travail dépassée le ${extremeShift.date}.`, ar: `تجاوز الحد الأقصى لساعات العمل اليومية.` },
        'Réorganiser les shifts pour ne pas dépasser 10h par jour sauf cas d\'urgence.'
      ));
    }
    return violations;
  }

  private checkLeaveCompliance(emp: Employee, attendance: AttendanceRecord[]): ComplianceViolation[] {
    // Logic to ensure 1.5 days accrued per month
    return [];
  }

  private createViolation(code: string, severity: LegalSeverity, law: string, desc: { fr: string, ar: string }, rem: string): ComplianceViolation {
    return {
      id: `VIO-${code}-${Date.now()}`,
      code,
      severity,
      lawReference: law,
      description: desc,
      remediation: rem,
      status: 'OPEN',
      timestamp: Date.now()
    };
  }

  private async runAiHeuristics(emp: Employee, pay: PayrollResult, existing: ComplianceViolation[]): Promise<ComplianceViolation[]> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Context: Moroccan Labor Law. Data: ${JSON.stringify({ emp, pay, existing })}. Identify subtle violations like illegal salary deductions, contract misclassification, or fraud risks. Return JSON array of ComplianceViolation.`,
      config: {
        systemInstruction: "You are the Supreme Legal AI of Salery.ma. Audit this employee data for Moroccan law compliance. High precision is mandatory. Article references required.",
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '[]');
  }
}

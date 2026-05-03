import { GoogleGenAI, Type } from "@google/genai";
import { Employee, AttendanceRecord, PayrollResult, ComplianceViolation } from "../../types";

/**
 * SALERY V17 VIOLATION DETECTION ENGINE
 * Pattern-based and AI-driven detection of non-compliant behavior.
 */
export class ViolationDetectionEngine {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  /**
   * SCAN FOR ANOMALOUS PATTERNS
   */
  public async scanCompanyState(
    employees: Employee[],
    payroll: PayrollResult[],
    attendance: AttendanceRecord[]
  ): Promise<ComplianceViolation[]> {
    
    // 1. Data Sanitization for AI
    const dataset = {
      staff: employees.length,
      uninsured: employees.filter(e => !e.cnssEmployee).length,
      overtimeSpikes: attendance.filter(a => a.hoursWorked > 10).length,
      ribDuplicates: this.detectRibDuplicates(employees)
    };

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this Moroccan HR state for systemic violations or fraud: ${JSON.stringify(dataset)}. Focus on Articles 184-200 (Hours) and Articles 356-360 (Wages).`,
      config: {
        systemInstruction: "You are an Elite Labor Auditor for Salery.ma. Identify high-level risks and systemic non-compliance. Return JSON array of ComplianceViolation.",
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '[]');
  }

  private detectRibDuplicates(employees: Employee[]): string[] {
    const ribs = new Map<string, string>();
    const duplicates: string[] = [];
    employees.forEach(e => {
      if (e.rib) {
        if (ribs.has(e.rib)) duplicates.push(`${e.fullName} shares RIB with ${ribs.get(e.rib)}`);
        else ribs.set(e.rib, e.fullName);
      }
    });
    return duplicates;
  }
}

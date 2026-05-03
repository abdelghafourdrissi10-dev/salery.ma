import { GoogleGenAI, Type } from "@google/genai";
import { Employee, AttendanceRecord, PayrollResult } from "../../types";

/**
 * SALERY V17 INSPECTION RISK ENGINE
 * Predictive scoring for legal disputes and government audits.
 */
export class InspectionRiskEngine {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  /**
   * CALCULATES INSPECTION PROBABILITY & PENALTY ESTIMATION
   */
  public async calculateRiskVector(
    employees: Employee[],
    payroll: PayrollResult[],
    attendance: AttendanceRecord[]
  ) {
    // 1. Heuristic Pattern Detection
    const uninsuredCount = employees.filter(e => !e.cnssEmployee).length;
    const extremeOvertimeCount = attendance.filter(a => a.hoursWorked > 12).length;
    const belowSmigCount = payroll.filter(p => p.grossTotal < 3266.10).length;

    const riskInputs = {
      uninsuredRatio: uninsuredCount / employees.length,
      overtimeFrequency: extremeOvertimeCount / attendance.length,
      smigViolations: belowSmigCount,
      industry: "BTP/Services" // Contextual
    };

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Calculate inspection risk for a Moroccan company with these metrics: ${JSON.stringify(riskInputs)}`,
      config: {
        systemInstruction: "You are a Legal Risk Strategist. Predict the probability of a CNSS or Labor Inspection audit based on patterns of non-compliance. Return JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            probabilityScore: { type: Type.NUMBER, description: "0-100" },
            estimatedFineMAD: { type: Type.NUMBER },
            primaryRiskDrivers: { type: Type.ARRAY, items: { type: Type.STRING } },
            fraudIndicators: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }
}

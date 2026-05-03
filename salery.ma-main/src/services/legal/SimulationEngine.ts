import { GoogleGenAI, Type } from "@google/genai";
import { LegalSimulationResult, Employee, PayrollResult } from "../../types";

/**
 * SALERY V17 SIMULATION ORACLE
 * Predictive Legal Impact Analysis for Decision Support.
 */
export class SimulationEngine {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  /**
   * SIMULATE SALARY UPDATE
   */
  public async simulateSalaryImpact(
    currentPayroll: PayrollResult[],
    proposedChangePct: number
  ): Promise<LegalSimulationResult> {
    const totalCurrent = currentPayroll.reduce((acc, p) => acc + p.grossTotal, 0);
    const totalNew = totalCurrent * (1 + proposedChangePct / 100);

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Simulate a ${proposedChangePct}% salary increase for a Moroccan company with ${currentPayroll.length} staff. Current Gross: ${totalCurrent} MAD. Analyze Tax impact and regulatory risk.`,
      config: {
        systemInstruction: "You are a Moroccan CFO and Legal Advisor. Provide a detailed impact analysis of salary changes. Return JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenarioName: { type: Type.STRING },
            financialImpact: { type: Type.NUMBER },
            litigationProbability: { type: Type.NUMBER },
            regulatoryScore: { type: Type.NUMBER },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }

  /**
   * SIMULATE CONTRACT TERMINATION (Article 41 of Code du Travail)
   */
  public async simulateTerminationRisk(emp: Employee, reason: string): Promise<LegalSimulationResult> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Simulate termination for ${emp.fullName} (Seniority: ${emp.hireDate}, Salary: ${emp.baseSalary} MAD). Reason: ${reason}. Calculate legal indemnity and Labor Court risk in Morocco.`,
      config: {
        systemInstruction: "Expert in Moroccan Labor Court (Tribunal Social). Calculate legal risks of dismissal. Return JSON.",
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  }
}

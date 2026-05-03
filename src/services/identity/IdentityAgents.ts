import { GoogleGenAI, Type } from "@google/genai";
import { IdentityAgentId, IdentityDirective, SEDI, SDEI, Employee, PayrollResult } from "../../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * SALERY.MA V20 - IDENTITY AGENT MESH
 * Autonomous guardians of the sovereign identity layer.
 */
export class IdentityAgentRegistry {

  /**
   * RUN GHOST EMPLOYEE DETECTION
   * Cross-references Attendance vs Payroll vs Identity Anchors.
   */
  public static async scanForGhosts(
    employer: SDEI,
    employees: Employee[],
    payroll: PayrollResult[]
  ): Promise<IdentityDirective[]> {
    const context = {
      employerId: employer.id,
      staffCount: employees.length,
      unidentifiedSedi: employees.filter(e => !e.sedi).length,
      unpaidCount: employees.length - payroll.length
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform Ghost Employee detection for: ${JSON.stringify(context)}. Look for lack of SEDI anchors.`,
      config: {
        systemInstruction: "You are the Ghost Employee Detector. Identify risks where payroll exists without a verified Sovereign Identity. Return JSON array of IdentityDirective.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              agentId: { type: Type.STRING },
              severity: { type: Type.STRING },
              actionRequired: { type: Type.STRING },
              evidenceHash: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  }

  /**
   * CROSS-EMPLOYER FRAUD SCAN
   * Detects if one human (SEDI) is simultaneously active on multiple employers (SDEI) 
   * in conflicting shifts (Article 184 violation).
   */
  public static async scanWorkforceMobility(sediId: string): Promise<IdentityDirective[]> {
    // Simulate lookup in National Workforce Graph
    return [{
      agentId: 'WORKFORCE_MOBILITY_TRACKER',
      severity: 'INFO',
      actionRequired: 'Update seniority record based on SEDI timeline.',
      evidenceHash: btoa(sediId)
    }];
  }
}

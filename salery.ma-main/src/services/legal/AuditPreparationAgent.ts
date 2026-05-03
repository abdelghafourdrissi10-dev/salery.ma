import { GoogleGenAI, Type } from "@google/genai";
import { Employee, PayrollResult, AttendanceRecord, CompanyProfile } from "../../types";

/**
 * SALERY V17 AUDIT PREPARATION AGENT
 * Prepares the company for "La Visite de l'Inspecteur du Travail"
 */
export class AuditPreparationAgent {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  /**
   * GENERATES A COMPLETE INSPECTION READINESS PACKAGE
   */
  public async prepareAuditPackage(
    company: CompanyProfile,
    employees: Employee[],
    payroll: PayrollResult[],
    attendance: AttendanceRecord[]
  ) {
    const context = {
      ice: company.ice,
      cnssEmployer: company.cnssEmployer,
      totalStaff: employees.length,
      payrollTotal: payroll.reduce((acc, p) => acc + p.grossTotal, 0),
      attendancePoints: attendance.length
    };

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform a full Moroccan Labor Inspection audit for: ${JSON.stringify(context)}. 
      Check for: 
      1. Registry (Article 15)
      2. Pay sheets (Article 370)
      3. Work hours (Article 184)
      4. CNSS declarations
      Identify missing documents for each of the ${employees.length} employees.`,
      config: {
        systemInstruction: "You are the Supreme Auditor of Salery.ma. Identify every legal gap that could lead to a fine under the Moroccan Labor Code. Return structured JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            complianceScore: { type: Type.NUMBER },
            criticalGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingDocumentRegistry: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  employeeId: { type: Type.STRING },
                  missingDocs: { type: Type.ARRAY, items: { type: Type.STRING } },
                  riskLevel: { type: Type.STRING }
                }
              }
            },
            legalRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }
}

import { CompanyProfile, Employee, PayrollResult, AttendanceRecord, InspectionRiskReport } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";

/**
 * SALERY V17 INSPECTION ORACLE
 * Automated Pre-Audit for Labor Inspection (Inspecteur du Travail)
 */

export class InspectionOracle {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  public async generateReadinessReport(
    company: CompanyProfile,
    employees: Employee[],
    payroll: PayrollResult[],
    attendance: AttendanceRecord[]
  ): Promise<InspectionRiskReport> {
    
    // 1. Aggregation for Contextual Analysis
    const auditPayload = {
      companyIdentity: company.ice,
      staffCount: employees.length,
      uninsuredCount: employees.filter(e => !e.cnssEmployee).length,
      abnormalOTCount: attendance.filter(a => a.hoursWorked > 12).length,
      payrollDeviations: payroll.filter(p => p.v8Flags?.laborCourtRisk === 'HIGH').length
    };

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Simulate a Moroccan Labor Inspection for this company: ${JSON.stringify(auditPayload)}`,
      config: {
        systemInstruction: "You are an Inspecteur du Travail (Morocco). Conduct a rigorous pre-audit. Identify gaps, fraud risks, and potential fines. Return JSON matching InspectionRiskReport.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallRisk: { type: Type.STRING },
            missingDocs: { type: Type.ARRAY, items: { type: Type.STRING } },
            fraudIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
            estimatedPenaltyMAD: { type: Type.NUMBER },
            priorityActions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const report = JSON.parse(response.text || '{}');
    return {
      ...report,
      lastAuditAt: Date.now()
    };
  }
}

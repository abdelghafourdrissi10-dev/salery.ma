import { GoogleGenAI, Type } from "@google/genai";
import { 
  Employee, PayrollResult, AuthUser, ExecutiveDirective, 
  DirectiveCategory, DirectivePriority 
} from "../types";

/**
 * SALERY CEO BRAIN V15
 * Advanced Strategic Decision Engine for Moroccan Enterprises.
 */

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class CeoDecisionSystem {
  /**
   * INGESTS COMPANY STATE AND GENERATES EXECUTIVE DIRECTIVES
   */
  static async generateDirectives(
    user: AuthUser,
    employees: Employee[],
    payroll: PayrollResult[]
  ): Promise<ExecutiveDirective[]> {
    console.log("[CEO BRAIN] Synthesizing board-level strategy...");

    const context = {
      companyName: user.companyName,
      employeeCount: employees.length,
      totalMonthlyPayroll: payroll.reduce((acc, p) => acc + p.grossTotal, 0),
      avgSalary: payroll.length > 0 ? (payroll.reduce((acc, p) => acc + p.grossTotal, 0) / payroll.length) : 0,
      turnoverRiskCount: payroll.filter(p => p.v8Flags?.laborCourtRisk === 'HIGH').length
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze this Moroccan company state: ${JSON.stringify(context)}. 
        Act as the AI CEO of Salery.ma. Generate 3 high-impact strategic directives based on Moroccan Labor Law and current economic trends (Inflation, SMIG 2026).
        Return purely JSON array matching the ExecutiveDirective interface.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { 
                  type: Type.OBJECT,
                  properties: {
                    fr: { type: Type.STRING },
                    ar: { type: Type.STRING }
                  }
                },
                category: { type: Type.STRING, description: "COMPLIANCE, COST_CONTROL, etc." },
                priority: { type: Type.STRING, description: "URGENT, HIGH, etc." },
                rationale: {
                  type: Type.OBJECT,
                  properties: {
                    fr: { type: Type.STRING },
                    ar: { type: Type.STRING }
                  }
                },
                suggestedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
                impact: {
                  type: Type.OBJECT,
                  properties: {
                    financialMAD: { type: Type.NUMBER },
                    legalRiskScore: { type: Type.NUMBER },
                    productivityBoost: { type: Type.NUMBER }
                  }
                },
                legalReference: { type: Type.STRING }
              }
            }
          }
        }
      });

      const directives = JSON.parse(response.text || '[]');
      return directives.map((d: any, i: number) => ({
        ...d,
        id: `DIR-V15-${Date.now()}-${i}`,
        timestamp: Date.now(),
        status: 'PROPOSED'
      }));

    } catch (error) {
      console.error("[CEO BRAIN CRITICAL]", error);
      // Fallback directives if AI fails
      return [
        {
          id: 'FALLBACK-1',
          title: { fr: "Audit SMIG 2026", ar: "تدقيق الحد الأدنى للأجور 2026" },
          category: 'COMPLIANCE',
          priority: 'URGENT',
          rationale: { fr: "Mise en conformité avec la Loi de Finances.", ar: "الامتثال لقانون المالية الجديد." },
          suggestedActions: ["Ajuster les salaires de base", "Notifier les employés concernés"],
          impact: { financialMAD: -12000, legalRiskScore: 5, productivityBoost: 2 },
          timestamp: Date.now(),
          status: 'PROPOSED'
        }
      ];
    }
  }

  /**
   * SIMULATES THE OUTCOME OF A DIRECTIVE
   */
  static async simulateOutcome(directive: ExecutiveDirective): Promise<string> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Simulate outcome for directive: ${directive.title.fr}. Impact: ${JSON.stringify(directive.impact)}. 
      Context: Moroccan SME. Return short executive summary (FR).`,
    });
    return response.text || "Simulation inconclusive.";
  }
}

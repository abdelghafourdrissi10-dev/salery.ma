import { GoogleGenAI } from "@google/genai";
import { GovernmentAgentId, GovAgentDirective, Employee, PayrollResult } from "../../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * SALERY.MA V19 - NATIONAL AGENT NETWORK
 * Specialized AI agents acting on behalf of government regulations.
 */
export class NationalAgentRegistry {
  
  /**
   * DISPATCHES A GOVERNMENT AUDIT TASK
   */
  public static async executeGovAudit(
    agentId: GovernmentAgentId, 
    context: any
  ): Promise<GovAgentDirective> {
    const traceId = `AGNT-AUDIT-${Date.now()}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Agent ${agentId} perform audit on: ${JSON.stringify(context)}`,
      config: {
        systemInstruction: this.getAgentInstruction(agentId),
        temperature: 0.1
      }
    });

    return {
      agentId,
      action: response.text || "NO_ACTION_REQUIRED",
      priority: response.text?.includes("URGENT") ? "URGENT" : "NORMAL",
      validationRequired: true,
      traceId
    };
  }

  private static getAgentInstruction(id: GovernmentAgentId): string {
    const base = "You are an official Moroccan Government AI Agent. Follow the Code du Travail and CGI strictly.";
    switch(id) {
      case 'CNSS_VALIDATOR_AGENT': 
        return `${base} Focus: Damancom integrity, employee coverage, and contribution ceilings (6000 DH).`;
      case 'TAX_RISK_AGENT': 
        return `${base} Focus: IR progressive brackets, professional expenses caps (2500 DH), and tax leakage.`;
      case 'LABOR_INSPECTOR_AGENT': 
        return `${base} Focus: Article 184 (44h/week), Articles 196-200 (Overtime), and Registry (Article 15).`;
      case 'GOV_LIAISON_AGENT':
        return `${base} Focus: Official communication orchestration and document certification.`;
      default:
        return base;
    }
  }
}

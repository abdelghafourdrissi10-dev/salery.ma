import { GoogleGenAI, Type } from "@google/genai";
import { LawUpdate } from "../../types";
import { LegalEventBus } from "./EventBus";

/**
 * SALERY V17 LAW MONITORING AGENT
 * Track and Integrate Moroccan Legislative Updates
 */
export class LawMonitorAgent {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  private eventBus = LegalEventBus.getInstance();

  public async scanForUpdates(tenantId: string): Promise<LawUpdate[]> {
    // Simulate scraping gov.ma / B.O. sources
    const rawLegislativeText = "Le SMIG passera à 18.20 DH/heure à partir de Juillet 2026. L'AMO pour les indépendants subit une révision du plafond...";

    const analysis = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Parse this legislative text for Salery.ma Payroll Engine: ${rawLegislativeText}`,
      config: {
        systemInstruction: "Detect Moroccan law changes. Map them to system rules. High precision required. Return JSON array of LawUpdate.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              lawId: { type: Type.STRING },
              category: { type: Type.STRING },
              summary: { type: Type.STRING },
              impactScore: { type: Type.NUMBER },
              effectiveDate: { type: Type.STRING },
              affectedRules: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });

    const updates = JSON.parse(analysis.text || '[]');
    
    for (const update of updates) {
      await this.eventBus.publish(
        tenantId,
        'LEGISLATIVE_UPDATE',
        update.impactScore > 8 ? 'CRITICAL' : 'MEDIUM',
        'LCM_AGENT',
        update
      );
    }

    return updates;
  }
}

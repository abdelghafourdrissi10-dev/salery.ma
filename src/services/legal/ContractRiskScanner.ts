import { GoogleGenAI, Type } from "@google/genai";

/**
 * SALERY V17 CONTRACT RISK SCANNER
 * Post-generation audit to ensure no illegal clauses were hallucinated.
 */
export class ContractRiskScanner {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  public async scanForViolations(markdown: string): Promise<{
    status: 'CLEAN' | 'RISKY' | 'ILLEGAL';
    findings: string[];
  }> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Audit this Moroccan contract for Article 13, 184, and 356 violations: ${markdown}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            findings: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    return JSON.parse(response.text || '{"status":"UNKNOWN", "findings":[]}');
  }
}

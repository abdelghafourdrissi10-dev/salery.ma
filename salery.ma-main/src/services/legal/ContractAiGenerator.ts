import { GoogleGenAI, Type } from "@google/genai";
import { Employee, CompanyProfile, DocType } from "../../types";
import { MANDATORY_CLAUSES } from "./ClauseLibrary";

/**
 * SALERY V17 CONTRACT AI GENERATOR
 * Production-grade engine for legally binding Moroccan contracts.
 */
export class ContractAiGenerator {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  /**
   * GENERATE FULL CONTRACT
   */
  public async generateLegalContract(
    company: CompanyProfile,
    employee: Employee,
    docType: DocType,
    customRequirements: string[] = []
  ): Promise<{ markdown: string; metadata: any }> {
    
    // 1. Identify deterministic mandatory clauses
    const requiredClauses = MANDATORY_CLAUSES.filter(c => c.docTypes.includes(docType));
    
    // 2. Build Rich Prompt for Gemini
    const prompt = `
      Act as the Chief Legal Officer for ${company.name} (ICE: ${company.ice}).
      Draft a professional ${docType} for ${employee.fullName} (CIN: ${employee.cin}).
      
      BASE DATA:
      - Job Title: ${employee.jobTitle}
      - Base Salary: ${employee.baseSalary} MAD/month
      - Hire Date: ${employee.hireDate}
      - Site: ${employee.assignedSite || company.city}
      
      MANDATORY LEGAL FRAMEWORK (Loi 65-99):
      ${requiredClauses.map(c => `- ${c.article}: ${c.title.fr}`).join('\n')}
      
      CUSTOM BUSINESS RULES:
      ${customRequirements.join('\n')}
      
      FORMATTING:
      - Use professional legal French.
      - Return structured Markdown.
      - Include placeholders for signatures.
      - Add a "Legal Compliance Footer" with HASH reference.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are an Elite Moroccan Labor Law Expert. Your contracts must be legally defensible in Moroccan Labor Courts (Tribunal Social). Ensure precise terminology (Salaire brut, indemnités, préavis).",
          temperature: 0.1 // Low temperature for legal precision
        }
      });

      const content = response.text || "ERROR_GENERATION_FAILED";
      const riskScore = await this.assessContractRisk(content);

      return {
        markdown: content,
        metadata: {
          generatedAt: Date.now(),
          riskScore,
          version: "V17.2.0",
          model: "gemini-3-pro-preview",
          clausesApplied: requiredClauses.map(c => c.id)
        }
      };
    } catch (error) {
      console.error("[CONTRACT_AI] Critical failure during generation:", error);
      throw new Error("Contract generation engine offline.");
    }
  }

  /**
   * ASSESS LITIGATION RISK
   */
  private async assessContractRisk(content: string): Promise<number> {
    const riskPrompt = `Analyze this Moroccan employment contract for legal risks or missing mandatory clauses: ${content}`;
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: riskPrompt,
      config: {
        systemInstruction: "Rate the litigation risk from 0-100. Return ONLY the integer.",
      }
    });
    return parseInt(response.text || "50");
  }
}

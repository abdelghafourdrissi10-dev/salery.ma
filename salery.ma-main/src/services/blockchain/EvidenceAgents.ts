import { GoogleGenAI } from "@google/genai";
import { NationalLedgerService } from "./NationalLedger";
import { WorkforceAnchor, BlockchainModule, AuthUser } from "../../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * SALERY.MA V24 - BLOCKCHAIN EVIDENCE AGENTS
 */
export class EvidenceAgentMesh {
  private ledger = NationalLedgerService.getInstance();

  /**
   * EVIDENCE WATCHDOG: Audits off-chain data consistency before anchoring.
   */
  public async auditAndAnchor(
    user: AuthUser,
    module: BlockchainModule,
    sediId: string,
    sdeiId: string,
    data: any
  ): Promise<WorkforceAnchor | null> {
    console.log(`[V24 AGENT] Evidence Watchdog auditing ${module} payload...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Audit this workforce event for legal consistency: ${JSON.stringify(data)}`,
      config: {
        systemInstruction: "You are the Evidence Integrity Agent. Verify if the data is compliant with Moroccan Labor Law before anchoring to the blockchain."
      }
    });

    if (response.text?.includes("REJECTED")) {
      console.warn("[V24 AGENT] AUDIT FAILED. ANCHORING BLOCKED.");
      return null;
    }

    return await this.ledger.anchorEvent(module, sediId, sdeiId, data);
  }
}

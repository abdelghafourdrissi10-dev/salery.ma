import { WorkforceAnchor, BlockchainModule, SEDI, SDEI } from "../../types";

/**
 * SALERY.MA V24 - NATIONAL WORKFORCE BLOCKCHAIN
 * Sovereign Proof Layer for Moroccan Labor Integrity.
 */
export class NationalLedgerService {
  private static instance: NationalLedgerService;
  private readonly NODES = ['TRIBUNAL_CASA', 'CNSS_VALIDATOR', 'DGI_NODE', 'SALERY_SOVEREIGN'];

  private constructor() {}

  public static getInstance(): NationalLedgerService {
    if (!NationalLedgerService.instance) {
      NationalLedgerService.instance = new NationalLedgerService();
    }
    return NationalLedgerService.instance;
  }

  /**
   * ANCHORS A WORKFORCE EVENT TO THE BLOCKCHAIN
   */
  public async anchorEvent(
    category: BlockchainModule,
    sediId: string,
    sdeiId: string,
    payload: any
  ): Promise<WorkforceAnchor> {
    console.log(`[V24-BLOCKCHAIN] Anchoring ${category} for ${sediId} on-chain...`);

    // 1. Generate Deterministic SHA-256 Proof Hash
    const rawData = JSON.stringify(payload) + sediId + sdeiId + Date.now();
    const proofHash = await this.generateProofHash(rawData);

    // 2. Simulate On-chain Transaction
    const txId = `TX-${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
    const blockNumber = Math.floor(Math.random() * 1000000) + 5000000;
    
    const anchor: WorkforceAnchor = {
      txId,
      blockNumber,
      timestamp: Date.now(),
      sediId,
      sdeiId,
      category,
      proofHash,
      digitalSignature: btoa(txId + proofHash),
      validatorNode: this.NODES[Math.floor(Math.random() * this.NODES.length)]
    };

    // 3. Persist to Local Sovereign Mirror (Simulation)
    this.persistAnchor(anchor);

    return anchor;
  }

  /**
   * VERIFIES A LOCALLY STORED PROOF AGAINST THE INSTITUTIONAL LEDGER
   */
  public async verifyProof(txId: string, providedHash: string): Promise<boolean> {
    const saved = this.getAnchors();
    const anchor = saved.find(a => a.txId === txId);
    if (!anchor) return false;
    return anchor.proofHash === providedHash;
  }

  private async generateProofHash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private persistAnchor(anchor: WorkforceAnchor) {
    const existing = this.getAnchors();
    localStorage.setItem('salery_workforce_ledger', JSON.stringify([...existing, anchor]));
  }

  public getAnchors(): WorkforceAnchor[] {
    const saved = localStorage.getItem('salery_workforce_ledger');
    return saved ? JSON.parse(saved) : [];
  }
}

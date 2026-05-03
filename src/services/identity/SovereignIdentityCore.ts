import { CompanyProfile, Employee, SDEI, SEDI } from "../../types";

/**
 * SALERY.MA V20 - SOVEREIGN IDENTITY CORE
 * The deterministic anchor for all module identities.
 */
export class SovereignIdentityCore {
  private static instance: SovereignIdentityCore;

  private constructor() {}

  public static getInstance(): SovereignIdentityCore {
    if (!SovereignIdentityCore.instance) {
      SovereignIdentityCore.instance = new SovereignIdentityCore();
    }
    return SovereignIdentityCore.instance;
  }

  /**
   * GENERATES SDEI (Sovereign Digital Employer ID)
   */
  public async generateSDEI(company: CompanyProfile): Promise<SDEI> {
    const rawData = `${company.ice}-${company.ifCode}-${company.cnssEmployer}`;
    const id = await this.hashString(rawData);
    
    return {
      id: `SDEI-${id.substring(0, 16).toUpperCase()}`,
      ice: company.ice,
      ifCode: company.ifCode || '',
      cnssEmployer: company.cnssEmployer,
      legalStatus: 'ACTIVE_CORPORATION',
      digitalSignatureThumbprint: btoa(id),
      branches: [],
      lastCertifiedAt: Date.now(),
      // Fix: Added missing required jurisdiction property
      jurisdiction: 'MA'
    };
  }

  /**
   * GENERATES SEDI (Sovereign Employee Digital Identity)
   * Cross-company identity based on CIN.
   */
  public async generateSEDI(employee: Employee): Promise<SEDI> {
    const rawData = `${employee.cin}-SALERY-MA-PRIVATE`;
    const id = await this.hashString(rawData);

    return {
      id: `SEDI-${id.substring(0, 16).toUpperCase()}`,
      cin: employee.cin,
      cnssEmployee: employee.cnssEmployee || '',
      workHistoryAnchors: [],
      identityToken: this.issueIdentityToken(id),
      status: 'VERIFIED',
      // Fix: Added missing required globalMobilityIndex property
      globalMobilityIndex: 0
    };
  }

  /**
   * ISSUES A ZERO-TRUST SESSION TOKEN
   * Bindable to Pointage, Docs, and Payroll.
   */
  public issueIdentityToken(identityId: string): string {
    const payload = `${identityId}-${Date.now()}-ZTRUST`;
    return btoa(payload);
  }

  private async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
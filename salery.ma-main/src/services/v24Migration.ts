import { EvidenceAgentMesh } from "./blockchain/EvidenceAgents";
import { AuthUser, Employee, PayrollResult } from "../types";

/**
 * SALERY.MA V24 - BLOCKCHAIN MIGRATION SERVICE
 * Anchors V23 historical data to the Sovereign Ledger.
 */
export class BlockchainMigrationService {
  private agent = new EvidenceAgentMesh();

  public async migrateHistory(
    user: AuthUser, 
    employees: Employee[], 
    payrollResults: PayrollResult[]
  ) {
    console.log("[V24 MIGRATION] Starting Blockchain Anchoring cycle...");

    // Anchor SDEI (Employer)
    await this.agent.auditAndAnchor(user, 'CONTRACT', 'NATIONAL_CORE', user.companyId, {
      companyName: user.companyName,
      anchorType: 'TENANT_PROVISIONING',
      version: 'V24'
    });

    // Batch anchor payroll history
    for (const res of payrollResults) {
      const emp = employees.find(e => e.id === res.employeeId);
      if (emp) {
        await this.agent.auditAndAnchor(
          user, 
          'PAYROLL', 
          emp.id, 
          user.companyId, 
          { 
            month: res.month, 
            netSalary: res.netSalary, 
            txRef: `MIGRATION_V23_${Date.now()}` 
          }
        );
      }
    }

    console.log("[V24 MIGRATION] Blockchain cycle completed.");
  }
}

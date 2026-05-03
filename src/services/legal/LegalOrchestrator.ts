import { ComplianceEngine } from './ComplianceEngine';
import { LawMonitorAgent } from './LawMonitor';
import { SimulationEngine } from './SimulationEngine';
import { ViolationDetectionEngine } from './ViolationDetectionEngine';
import { ContractAiGenerator } from './ContractAiGenerator';
import { AuditPreparationAgent } from './AuditPreparationAgent';
import { InspectionRiskEngine } from './InspectionRiskEngine';
import { AuditReportEngine } from './AuditReportEngine';
import { LegalEventBus } from './EventBus';
import { Employee, PayrollResult, AttendanceRecord, DocType, AuthUser } from '../../types';

/**
 * SALERY V17 LEGAL ORCHESTRATOR
 * Unified interface for all Legal AI services.
 */
export class LegalOrchestrator {
  private compliance = new ComplianceEngine();
  private monitor = new LawMonitorAgent();
  private simulation = new SimulationEngine();
  private detector = new ViolationDetectionEngine();
  private contractor = new ContractAiGenerator();
  private auditor = new AuditPreparationAgent();
  private riskEngine = new InspectionRiskEngine();
  private reportEngine = new AuditReportEngine();
  private eventBus = LegalEventBus.getInstance();

  /**
   * EXECUTES A FULL READINESS AUDIT FOR INSPECTION
   */
  public async runInspectionReadinessAudit(
    user: AuthUser,
    employees: Employee[],
    payroll: PayrollResult[],
    attendance: AttendanceRecord[]
  ) {
    console.log("[LEGAL V17] Starting Inspection Readiness Cycle...");

    // 1. Parallel AI Analysis
    const [prepData, riskData] = await Promise.all([
      this.auditor.prepareAuditPackage(user as any, employees, payroll, attendance),
      this.riskEngine.calculateRiskVector(employees, payroll, attendance)
    ]);

    // 2. Generate Final Report
    const finalReport = this.reportEngine.formatInspectionReport(user as any, riskData, prepData);

    // 3. Publish Event
    // Fix: replaced 'LOW' with 'INFO' as 'LOW' is not a valid LegalSeverity value
    await this.eventBus.publish(
      user.companyId,
      'AUDIT_READY',
      riskData.probabilityScore > 70 ? 'HIGH' : 'INFO',
      'INSPECTION_ORACLE',
      { score: prepData.complianceScore, risk: riskData.probabilityScore }
    );

    return {
      status: 'COMPLETE',
      report: finalReport,
      timestamp: Date.now()
    };
  }

  /**
   * START MONTHLY COMPLIANCE CYCLE
   */
  public async executeComplianceCycle(
    user: AuthUser,
    employees: Employee[],
    payroll: PayrollResult[],
    attendance: AttendanceRecord[]
  ) {
    console.log("[LEGAL V17] Initiating Compliance Cycle...");

    // 1. Check for Law Updates
    const updates = await this.monitor.scanForUpdates(user.companyId);
    
    // 2. Individual Compliance Checks
    const allViolations = [];
    for (const emp of employees) {
      const pay = payroll.find(p => p.employeeId === emp.id);
      if (pay) {
        const violations = await this.compliance.runFullAudit(emp, pay, attendance);
        allViolations.push(...violations);
        
        // Broadcast critical violations immediately
        const criticals = violations.filter(v => v.severity === 'CRITICAL');
        for (const v of criticals) {
          await this.eventBus.publish(
            user.companyId,
            'COMPLIANCE_VIOLATION_DETECTED',
            'CRITICAL',
            'PAYROLL_VALIDATOR',
            { employeeId: emp.id, violationCode: v.code }
          );
        }
      }
    }

    // 3. Systemic Risk Detection
    const systemic = await this.detector.scanCompanyState(employees, payroll, attendance);
    if (systemic.length > 0) {
      await this.eventBus.publish(
        user.companyId,
        'RISK_THRESHOLD_EXCEEDED',
        'HIGH',
        'SYSTEMIC_DETECTOR',
        { count: systemic.length }
      );
    }
    
    return {
      status: 'COMPLETE',
      individualViolations: allViolations,
      systemicRisks: systemic,
      lawUpdates: updates,
      timestamp: Date.now()
    };
  }

  public async draftContract(emp: Employee, company: any, type: DocType) {
    const result = await this.contractor.generateLegalContract(company, emp, type);
    
    // Broadcast contract certification
    // Fix: replaced 'LOW' with 'INFO' as 'LOW' is not a valid LegalSeverity value
    await this.eventBus.publish(
      company.id,
      'CONTRACT_CERTIFIED',
      'INFO',
      'CONTRACT_AI_SERVICE',
      { employeeId: emp.id, hash: result.metadata.hashSignature }
    );

    return result;
  }

  public getSimulationEngine() { return this.simulation; }
}

import { Employee, AttendanceRecord, PayrollResult, CompanyProfile, Language } from '../types';
import { AuditRecord } from './auditEngine';

export interface InspectionReportData {
  company: CompanyProfile;
  period: { from: string; to: string };
  generationDate: string;
  summary: {
    totalEmployees: number;
    totalDaysWorked: number;
    totalNormalHours: number;
    totalOTHours: number;
    totalGrossPayroll: number;
    totalNetPayroll: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    anomalyCount: number;
    employeesAffected: number;
  };
  registry: any[];
  attendance: any[];
  payroll: any[];
  cnssStatus: any[];
  anomalies: any[];
  documents: any[];
}

export const generateLaborInspectionData = (
  company: CompanyProfile,
  employees: Employee[],
  attendance: AttendanceRecord[],
  payroll: PayrollResult[],
  audit: AuditRecord[],
  dateRange: { from: string; to: string }
): InspectionReportData => {
  
  const totalGross = payroll.reduce((acc, p) => acc + p.grossTotal, 0);
  const totalNet = payroll.reduce((acc, p) => acc + p.netSalary, 0);
  const totalOT = attendance.reduce((acc, a) => acc + Math.max(0, (a.hoursWorked || 0) - 8), 0);
  const totalAnomalies = audit.reduce((acc, a) => acc + a.anomalies.length, 0);
  const employeesWithAnomalies = audit.filter(a => a.anomalies.length > 0).length;

  return {
    company,
    period: dateRange,
    generationDate: new Date().toISOString(),
    summary: {
      totalEmployees: employees.length,
      totalDaysWorked: attendance.length,
      totalNormalHours: attendance.reduce((acc, a) => acc + Math.min(8, a.hoursWorked), 0),
      totalOTHours: totalOT,
      totalGrossPayroll: totalGross,
      totalNetPayroll: totalNet,
      riskLevel: totalAnomalies > 10 ? 'HIGH' : totalAnomalies > 3 ? 'MEDIUM' : 'LOW',
      anomalyCount: totalAnomalies,
      employeesAffected: employeesWithAnomalies
    },
    registry: employees.map(e => ({
      matricule: e.internalMatricule,
      name: e.fullName,
      cin: e.cin,
      cnss: e.cnssEmployee || 'N/A',
      job: e.jobTitle,
      contract: e.contractType,
      hired: e.hireDate,
      type: e.salaryType,
      base: e.baseSalary,
      status: e.employmentStatus
    })),
    attendance: employees.map(e => {
      const records = attendance.filter(a => a.employeeId === e.id);
      return {
        name: e.fullName,
        days: records.length,
        normal: records.reduce((acc, r) => acc + Math.min(8, r.hoursWorked), 0),
        ot: records.reduce((acc, r) => acc + Math.max(0, r.hoursWorked - 8), 0),
        absences: 0 
      };
    }),
    payroll: payroll.map(p => {
      const e = employees.find(emp => emp.id === p.employeeId)!;
      return {
        name: e.fullName,
        gross: p.grossTotal,
        primes: 0,
        travel: 0,
        deductions: p.cnss + p.amo + p.ir,
        net: p.netSalary
      };
    }),
    cnssStatus: employees.map(e => {
      const p = payroll.find(pay => pay.employeeId === e.id);
      return {
        name: e.fullName,
        declared: !!e.cnssEmployee ? 'OUI' : 'NON',
        base: p ? Math.min(p.grossTotal, 6000) : 0,
        gap: 0,
        obs: !e.cnssEmployee ? 'Régularisation requise' : 'OK'
      };
    }),
    anomalies: audit.flatMap(a => a.anomalies.map(ano => ({
      name: a.fullName,
      type: ano.short_label,
      severity: ano.severity,
      month: 'Janv 2026',
      comment: ano.recommended_action
    }))),
    documents: employees.map(e => ({
      name: e.fullName,
      missing: [
        !e.cin && 'CIN',
        !e.cnssEmployee && 'Attestation CNSS',
        'Contrat signé'
      ].filter(Boolean).join(', ') || 'AUCUN'
    }))
  };
};

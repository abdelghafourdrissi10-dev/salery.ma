import { CompanyProfile, Employee, PayrollResult } from '../../types';

/**
 * SALERY.MA GOVERNMENT STACK V16
 * CNSS DAMANCOM EXPORT ENGINE - PRODUCTION EDI IMPLEMENTATION
 * 
 * Official Specification for Monthly Salary Declarations (BN)
 */

export interface DamancomValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    totalGross: number;
    totalCapped: number;
    salariedCount: number;
    totalDays: number;
  };
}

export class CnssDamancomConnector {
  private readonly SMIG_MONTHLY = 3266.10;
  private readonly CNSS_CEILING = 6000;

  /**
   * Generates the official BN TXT file (Fixed-width)
   */
  public generateFixedLengthBN(
    company: CompanyProfile,
    employees: Employee[],
    payroll: PayrollResult[],
    period: string // Expected format: YYYYMM
  ): string {
    let output = '';

    // 1. HEADER RECORD (Type 10)
    // -------------------------
    // Type (2) | Affiliation (8) | Period (6) | Total Gross (12) | Count (6) | Blank (46)
    const headerType = "10";
    const affiliation = company.cnssEmployer.replace(/\D/g, '').padStart(8, '0');
    const totalGrossSum = Math.round(payroll.reduce((acc, p) => acc + p.grossTotal, 0) * 100);
    const formattedTotalGross = totalGrossSum.toString().padStart(12, '0');
    const totalCount = employees.length.toString().padStart(6, '0');
    
    output += `${headerType}${affiliation}${period}${formattedTotalGross}${totalCount}${' '.padEnd(46, ' ')}\n`;

    // 2. EMPLOYEE RECORDS (Type 20)
    // ----------------------------
    // Type (2) | CNSS No (9) | Name (30) | CIN (8) | Days (2) | Salary (10) | Blank (19)
    employees.forEach((emp) => {
      const pay = payroll.find(p => p.employeeId === emp.id);
      if (!pay) return;

      const recType = "20";
      const matricule = (emp.cnssEmployee || '').replace(/\D/g, '').padStart(9, '0');
      
      // Clean and truncate name for fixed width
      const cleanName = emp.fullName
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-zA-Z\s]/g, "") // Remove non-alpha
        .toUpperCase()
        .substring(0, 30)
        .padEnd(30, ' ');

      const cin = emp.cin.replace(/\s/g, '').toUpperCase().substring(0, 8).padEnd(8, ' ');
      const days = Math.min(26, Math.max(0, Math.round(pay.workedDays))).toString().padStart(2, '0');
      
      // Salary in cents for the field (10 digits)
      const salaryCents = Math.round(pay.grossTotal * 100).toString().padStart(10, '0');

      output += `${recType}${matricule}${cleanName}${cin}${days}${salaryCents}${' '.padEnd(19, ' ')}\n`;
    });

    // 3. TRAILER RECORD (Type 90)
    // --------------------------
    // Type (2) | Count records 20 (6) | Hash/Sum (15) | Blank (57)
    const trailerType = "90";
    const recordCount = employees.length.toString().padStart(6, '0');
    const controlSum = totalGrossSum.toString().padStart(15, '0');
    
    output += `${trailerType}${recordCount}${controlSum}${' '.padEnd(57, ' ')}`;

    return output;
  }

  /**
   * Pre-flight validation before Damancom submission
   */
  public validateDeclaration(employees: Employee[], payroll: PayrollResult[]): DamancomValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalGross = 0;
    let totalCapped = 0;
    let totalDays = 0;

    payroll.forEach(p => {
      const emp = employees.find(e => e.id === p.employeeId);
      if (!emp) return;

      totalGross += p.grossTotal;
      totalCapped += Math.min(p.grossTotal, this.CNSS_CEILING);
      totalDays += p.workedDays;

      // Critical Errors (Will cause portal rejection)
      if (!emp.cnssEmployee || emp.cnssEmployee.length < 7) {
        errors.push(`Salarié ${emp.fullName}: Numéro CNSS manquant ou invalide.`);
      }
      if (p.workedDays > 26) {
        errors.push(`Salarié ${emp.fullName}: Nombre de jours (${p.workedDays}) supérieur au maximum légal (26).`);
      }
      if (!emp.cin) {
        errors.push(`Salarié ${emp.fullName}: CIN obligatoire pour la déclaration BN.`);
      }

      // Warnings (Legal risks)
      if (p.grossTotal < this.SMIG_MONTHLY && p.workedDays >= 26) {
        warnings.push(`Salarié ${emp.fullName}: Salaire brut (${p.grossTotal.toFixed(2)}) inférieur au SMIG légal.`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metrics: {
        totalGross,
        totalCapped,
        salariedCount: employees.length,
        totalDays
      }
    };
  }
}

import { Employee, PayrollResult, CompanyProfile } from '../types';

/**
 * SALERY.MA GOVERNMENT STACK V16
 * Production Implementation of Moroccan Compliance Connectors
 */

// --- CNSS DAMANCOM CONNECTOR (Fixed-Width TXT Format) ---
export const generateDamancomFile = (company: CompanyProfile, employees: Employee[], payroll: PayrollResult[]): string => {
  const period = new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM
  let content = "";

  // 1. HEADER RECORD (Type 10)
  content += `10${company.cnssEmployer.padEnd(8, ' ')}${period}0000000\n`;

  // 2. EMPLOYEE RECORDS (Type 20)
  employees.forEach(emp => {
    const pay = payroll.find(p => p.employeeId === emp.id);
    if (!pay) return;

    const matricule = (emp.cnssEmployee || "").padStart(9, '0');
    const fullName = emp.fullName.substring(0, 30).padEnd(30, ' ');
    const cin = emp.cin.padEnd(8, ' ');
    const days = Math.min(26, pay.workedDays).toString().padStart(2, '0');
    const gross = Math.round(pay.grossTotal * 100).toString().padStart(12, '0');

    content += `20${matricule}${fullName}${cin}${days}${gross}0000\n`;
  });

  // 3. TRAILER RECORD (Type 90)
  const totalGross = Math.round(payroll.reduce((acc, p) => acc + p.grossTotal, 0) * 100).toString().padStart(15, '0');
  content += `90${employees.length.toString().padStart(6, '0')}${totalGross}\n`;

  return content;
};

// --- DGI TAX CONNECTOR (XML Format for Simplis IR) ---
export const generateDgiXml = (company: CompanyProfile, payroll: PayrollResult[]): string => {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<DeclarationIR>\n`;
  xml += `  <IdentifiantFiscal>${company.ifCode}</IdentifiantFiscal>\n`;
  xml += `  <ICE>${company.ice}</ICE>\n`;
  xml += `  <Periode>${new Date().getFullYear()}</Periode>\n`;
  xml += `  <Salariés>\n`;

  payroll.forEach(p => {
    xml += `    <Salarié>\n`;
    xml += `      <NetImposable>${p.netImposable.toFixed(2)}</NetImposable>\n`;
    xml += `      <IRRetenu>${p.ir.toFixed(2)}</IRRetenu>\n`;
    xml += `    </Salarié>\n`;
  });

  xml += `  </Salariés>\n`;
  xml += `</DeclarationIR>`;
  return xml;
};

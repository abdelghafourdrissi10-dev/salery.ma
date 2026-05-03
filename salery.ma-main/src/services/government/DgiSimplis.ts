import { CompanyProfile, PayrollResult, Employee } from '../../types';

/**
 * SALERY.MA GOVERNMENT STACK V16
 * DGI SIMPLIS IR CONNECTOR - XML SCHEMA V4.2
 */

export class DgiSimplisConnector {
  /**
   * Generates Simplis IR XML for monthly submission
   */
  public generateMonthlyIrXml(
    company: CompanyProfile,
    payroll: PayrollResult[],
    employees: Employee[]
  ): string {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<DeclarationRevenuSalarial xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n`;
    
    // Identifiant Fiscal & ICE
    xml += `  <IdentifiantFiscal>${company.ifCode}</IdentifiantFiscal>\n`;
    xml += `  <ICE>${company.ice}</ICE>\n`;
    xml += `  <Annee>${year}</Annee>\n`;
    xml += `  <Mois>${month}</Mois>\n`;
    
    xml += `  <ListeSalaries>\n`;
    
    payroll.forEach(p => {
      const emp = employees.find(e => e.id === p.employeeId);
      if (!emp) return;

      xml += `    <Salarie>\n`;
      xml += `      <Nom>${emp.fullName.split(' ')[0]}</Nom>\n`;
      xml += `      <Prenom>${emp.fullName.split(' ').slice(1).join(' ')}</Prenom>\n`;
      xml += `      <CIN>${emp.cin}</CIN>\n`;
      xml += `      <SalaireBrutGlobal>${p.grossTotal.toFixed(2)}</SalaireBrutGlobal>\n`;
      xml += `      <SalaireNetImposable>${p.netImposable.toFixed(2)}</SalaireNetImposable>\n`;
      xml += `      <IrRetenu>${p.ir.toFixed(2)}</IrRetenu>\n`;
      xml += `      <TempsTravail>${p.workedDays}</TempsTravail>\n`;
      xml += `    </Salarie>\n`;
    });

    xml += `  </ListeSalaries>\n`;
    
    // Totals
    const totalIr = payroll.reduce((acc, curr) => acc + curr.ir, 0);
    xml += `  <TotalIrRetenu>${totalIr.toFixed(2)}</TotalIrRetenu>\n`;
    xml += `</DeclarationRevenuSalarial>`;

    return xml;
  }

  /**
   * Validates DGI schema constraints
   */
  public checkFiscalIntegrity(company: CompanyProfile): boolean {
    return !!(company.ifCode && company.ice && company.ice.length === 15);
  }
}


import { CalendarEvent, Employee, CompanyProfile } from '../types';

/**
 * Handles professional document generation and CSV formatting
 */

export const exportToExcel = (events: CalendarEvent[], employees: Employee[]) => {
  const headers = "Collaborateur,Date,Type,Heures,Coût Est.(MAD),Statut\n";
  const rows = events.map(e => {
    const emp = employees.find(emp => emp.id === e.employeeId);
    const date = e.start.split('T')[0];
    // Fix: replaced emp.firstName emp.lastName with emp.fullName
    const name = emp ? emp.fullName : 'N/A';
    return `"${name}",${date},${e.type},${e.hours || 0},${e.cost || 0},${e.status}`;
  }).join('\n');

  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Salery_Payroll_Export_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
};

// Fix: replaced Branding with CompanyProfile
export const generateCalendarPDF = (company: CompanyProfile, data: any) => {
  console.log("Triggering PDF Layout for Print...");
  window.print(); // Relies on @media print CSS in index.html
};

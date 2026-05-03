import React, { useState, useMemo } from 'react';
import {
  Calculator, ShieldCheck, Printer, FileText, X, Eye,
  Activity, Landmark, ChevronRight, ArrowLeft, FileDown, RefreshCw
} from 'lucide-react';
import { PayrollResult, Language, Employee, AuthUser, AttendanceRecord, CompanyProfile } from '../types';
import { calculateEmployeePayroll } from '../services/payrollEngine';
import PayslipPDF from './PayslipPDF';
import { documentService } from '../services/documentService';

interface Props {
  employees: Employee[];
  lang: Language;
  user: AuthUser;
  onShowPricing: () => void;
}

const PayrollCalculator: React.FC<Props> = ({ employees, lang, user }) => {
  const [selectedPayslip, setSelectedPayslip] = useState<{ emp: Employee, result: PayrollResult } | null>(null);

  const company: CompanyProfile = useMemo(() => {
    const saved = localStorage.getItem('salaire_company_profile');
    return saved ? JSON.parse(saved) : {
      id: 'COMP-1', name: 'Salery Enterprise MA', physicalAddress: 'Casablanca', city: 'Casablanca', country: 'MA',
      rc: '---', ice: '---', cnssEmployer: '---', settings: { defaultSignatoryName: 'RH Director' }
    };
  }, []);

  const attendance: AttendanceRecord[] = useMemo(() => {
    const saved = localStorage.getItem('salaire_attendance');
    return saved ? JSON.parse(saved) : [];
  }, []);

  const currentMonth = useMemo(() => {
    return new Date().toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { month: 'long', year: 'numeric' });
  }, [lang]);

  const payrollResults = useMemo(() => {
    return employees
      .filter(e => e.employmentStatus === 'active')
      .map(emp => calculateEmployeePayroll(emp, attendance, [], [], [], currentMonth));
  }, [employees, attendance, currentMonth]);

  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async () => {
    const element = document.getElementById('pro-document');
    if (!element) return;
    
    try {
      setIsExporting(true);
      
      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const originalTransform = element.style.transform;
      element.style.transform = 'none';
      
      const imgData = await htmlToImage.toJpeg(element, {
        quality: 1.0,
        pixelRatio: 3, // High-res exact UI preservation
        backgroundColor: '#ffffff',
      });
      
      element.style.transform = originalTransform;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const canvasRatio = element.offsetWidth / element.offsetHeight;
      
      let finalWidth = pdfWidth;
      let finalHeight = finalWidth / canvasRatio;

      // Smart auto-scaling engine to force single page A4
      if (finalHeight > pdfHeight) {
          finalHeight = pdfHeight;
          finalWidth = finalHeight * canvasRatio;
      }
      
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
      pdf.save(`Bulletin_Paie_${selectedPayslip?.emp.lastName}_${currentMonth.replace(/\//g, '-')}.pdf`);
      
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  if (selectedPayslip) {
    return (
      <div className="animate-in fade-in duration-300 fixed inset-0 z-[100] bg-[#E3E8EE]/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 no-print">
        <div className="relative w-full max-w-[1200px] h-full flex flex-col md:flex-row gap-6 items-center md:items-stretch">
          
          <div className="flex-1 overflow-y-auto custom-scrollbar flex items-start justify-center bg-transparent p-4 sm:p-8 relative">
            <div className="shadow-2xl ring-1 ring-black/5 bg-white transition-all print:shadow-none print:ring-0 my-auto overflow-hidden">
              <PayslipPDF
                company={company}
                employee={selectedPayslip.emp}
                payroll={selectedPayslip.result}
                period={currentMonth}
                lang={lang}
              />
            </div>
          </div>

          <div className="flex md:flex-col gap-4 bg-white/80 p-4 rounded-3xl border border-gray-200 backdrop-blur-xl shadow-xl self-center">
          <button 
            onClick={() => setSelectedPayslip(null)} 
            className="group relative flex items-center justify-center w-12 h-12 bg-white text-gray-400 hover:text-rose-600 rounded-2xl shadow-xl border border-gray-100 hover:border-rose-100 hover:bg-rose-50 transition-all active:scale-95"
            title="Fermer"
          >
            <X size={20} strokeWidth={2.5} />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
              Fermer
            </span>
          </button>
          
          <div className="w-6 h-px bg-gray-300/50 mx-auto my-1"></div>

          <button 
            onClick={exportPDF}
            disabled={isExporting}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl shadow-xl border transition-all active:scale-95 ${isExporting ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-[#111827] border-gray-100 hover:border-transparent hover:bg-[#111827] hover:text-white'}`}
            title="Générer PDF"
          >
            {isExporting ? <RefreshCw size={20} strokeWidth={2.5} className="animate-spin" /> : <FileText size={20} strokeWidth={2.5} />}
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
              {isExporting ? 'Génération...' : 'Générer PDF'}
            </span>
          </button>

          <button 
            onClick={() => window.open(`/print/payslip/${selectedPayslip.emp.id}/${encodeURIComponent(currentMonth)}`, '_blank')}
            className="group relative flex items-center justify-center w-12 h-12 bg-white text-emerald-600 hover:text-white rounded-2xl shadow-xl border border-gray-100 hover:border-transparent hover:bg-emerald-600 transition-all active:scale-95"
            title="Imprimer"
          >
            <Printer size={20} strokeWidth={2.5} />
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
              Imprimer
            </span>
          </button>

          <button 
            onClick={() => alert("Fonction d'envoi par email en cours de développement.")}
            className="group relative flex items-center justify-center w-12 h-12 bg-white text-blue-600 hover:text-white rounded-2xl shadow-xl border border-gray-100 hover:border-transparent hover:bg-blue-600 transition-all active:scale-95"
            title="Envoyer par Email"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7"/><rect x="3" y="5" width="18" height="14" rx="2" ry="2"/></svg>
            <span className="absolute right-full mr-4 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
              Envoyer (Email)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

  const t = {
    fr: { title: "Intelligence Paie V10", sub: "Calculs conformes Loi 65-99", colEmp: "Collaborateur", colMass: "Masse Brut", colNet: "Net à Payer", btnView: "BULLETIN" },
    ar: { title: "ذكاء الأجور V10", sub: "حسابات مطابقة للقانون 65-99", colEmp: "المتعاون", colMass: "الأجر الخام", colNet: "الصافي للأداء", btnView: "ورقة الأداء" }
  }[lang === 'ar' ? 'ar' : 'fr'];

  return (
    <div className="space-y-8 animate-in fade-in pb-20 max-w-7xl mx-auto text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black text-[#111827] tracking-tighter">{t.title}</h2>
            <span className="px-3 py-1 bg-[#F0F7FF] text-[#0078D4] border border-[#DBEAFE] rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Activity size={10} className="animate-pulse" /> {currentMonth}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-400">{t.sub}</p>
        </div>

        <button
          onClick={() => documentService.downloadZip('bulletins', user.companyId, currentMonth)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0078D4] hover:bg-blue-100 transition-all shadow-sm"
        >
          <FileDown size={14} /> Exporter Tous (ZIP)
        </button>
      </header>

      <div className="airbnb-card bg-white overflow-hidden border-[#E5E7EB] shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-[#F7F9FC] border-b border-[#E5E7EB]">
            <tr className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">
              <th className="p-6">{t.colEmp}</th>
              <th className="p-6 text-right">{t.colMass}</th>
              <th className="p-6 text-right">{t.colNet}</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {employees.filter(e => e.employmentStatus === 'active').map(emp => {
              const result = payrollResults.find(r => r.employeeId === emp.id);
              if (!result) return null;
              return (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black border border-gray-100 overflow-hidden">
                        {emp.photoUrl || (emp as any).photo ? <img src={emp.photoUrl || (emp as any).photo} className="w-full h-full object-cover" /> : emp.fullName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-[#111827]">{emp.fullName}</p>
                        <p className="text-[9px] text-[#6B7280] uppercase font-black tracking-tighter">{emp.jobTitle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-right font-black text-[#111827]">{result.grossTotal.toLocaleString()} DH</td>
                  <td className="p-6 text-right font-black text-[#0078D4]">{result.netSalary.toLocaleString()} DH</td>
                  <td className="p-6 text-right">
                    <button
                      onClick={() => setSelectedPayslip({ emp, result })}
                      className="px-4 py-2 bg-[#111827] text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ml-auto shadow-md hover:bg-black transition-all active:scale-95"
                    >
                      <Eye size={12} /> {t.btnView}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollCalculator;
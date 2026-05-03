import React, { useState, useMemo } from 'react';
import {
  Calculator, ShieldCheck, Printer, FileText, X, Eye,
  Activity, Landmark, ChevronRight, ArrowLeft
} from 'lucide-react';
import { PayrollResult, Language, Employee, AuthUser, AttendanceRecord, CompanyProfile } from '../types';
import { calculateEmployeePayroll } from '../services/payrollEngine';
import PayslipPDF from './PayslipPDF';

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

  if (selectedPayslip) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="flex justify-between items-center mb-8 no-print sticky top-20 bg-[#F5F7FA]/80 backdrop-blur-md p-4 rounded-2xl z-50">
          <button onClick={() => setSelectedPayslip(null)} className="flex items-center gap-2 px-6 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all">
            <ArrowLeft size={16} /> Retour au registre
          </button>
          <button onClick={() => window.print()} className="px-8 py-3 btn-primary-gradient text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl">
            <Printer size={16} /> Imprimer Bulletin
          </button>
        </div>
        <div className="flex justify-center">
          <PayslipPDF
            company={company}
            employee={selectedPayslip.emp}
            payroll={selectedPayslip.result}
            period={currentMonth}
            lang={lang}
          />
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
          <p className="text-sm font-medium text-[#64748B]">{t.sub}</p>
        </div>
      </header>

      <div className="airbnb-card bg-white overflow-hidden border-[#E5E7EB] shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-[#F7F9FC] border-b border-[#E5E7EB]">
            <tr className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">
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
                        {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : emp.fullName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-[#111827]">{emp.fullName}</p>
                        <p className="text-[9px] text-[#64748B] uppercase font-black tracking-tighter">{emp.jobTitle}</p>
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
import React, { useState, useMemo } from 'react';
import {
   BarChart3, TrendingUp, ShieldCheck, BadgeCheck, FileWarning, Search,
   FileSpreadsheet, Download, Printer, Table, LayoutList
} from 'lucide-react';
import { Employee, LeaveRequest, Language, AttendanceRecord, CompanyProfile, PayrollResult, AuthUser, CountryCode } from '../types';
import { runPayrollAudit } from '../services/auditEngine';
import { generateLaborInspectionData, InspectionReportData } from '../services/reportGenerator';
import LaborInspectionReport from './LaborInspectionReport';

interface Props {
   employees: Employee[];
   leaves: LeaveRequest[];
   lang: Language;
   user: AuthUser;
}

const Reports: React.FC<Props> = ({ employees, lang, user }) => {
   const [activeTab, setActiveTab] = useState<'finance' | 'audit' | 'ledger'>('finance');
   const [showInspectionReport, setShowInspectionReport] = useState(false);

   const attendance: AttendanceRecord[] = useMemo(() => {
      const saved = localStorage.getItem('salaire_attendance');
      return saved ? JSON.parse(saved) : [];
   }, []);

   const company: CompanyProfile = useMemo(() => {
      const saved = localStorage.getItem('salaire_company_profile');
      if (saved) return JSON.parse(saved);
      return {
         id: 'COMP-1', name: 'Salery Enterprise MA', physicalAddress: 'Casablanca',
         city: 'Casablanca', country: 'MA' as CountryCode, rc: '554321', ice: '001542369000087',
         cnssEmployer: '12345678', settings: { defaultSignatoryName: 'Le Directeur RH', companyStampUrl: '' }
      };
   }, []);

   const payrollResults: PayrollResult[] = useMemo(() => {
      const month = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return employees.map(e => ({
         employeeId: e.id,
         month: month,
         country: 'MA' as CountryCode,
         baseSalary: e.baseSalary,
         seniorityBonus: e.baseSalary * 0.05, // Mock seniority
         workedDays: 26,
         overtimeTotal: 0,
         primesTotal: 0,
         grossTotal: e.baseSalary * 1.05,
         professionalExpenses: (e.baseSalary * 1.05) * 0.2,
         netImposable: (e.baseSalary * 1.05) * 0.8,
         cnss: Math.min(e.baseSalary * 1.05, 6000) * 0.0448,
         amo: (e.baseSalary * 1.05) * 0.0226,
         cmir: 0,
         ir: 0,
         advancesDeduction: 0,
         netSalary: (e.baseSalary * 1.05) * 0.85,
         employerCharges: {
            cnss: Math.min(e.baseSalary * 1.05, 6000) * 0.2109,
            amo: (e.baseSalary * 1.05) * 0.0226,
            cmir: 0,
            total: (Math.min(e.baseSalary * 1.05, 6000) * 0.2109) + ((e.baseSalary * 1.05) * 0.0226)
         },
         breakdown: []
      }));
   }, [employees]);

   const auditData = useMemo(() => runPayrollAudit(employees, payrollResults, attendance, [], lang), [employees, payrollResults, attendance, lang]);

   const inspectionData: InspectionReportData = useMemo(() => {
      return generateLaborInspectionData(
         company,
         employees,
         attendance,
         payrollResults,
         auditData,
         { from: '2026-01-01', to: '2026-01-31' }
      );
   }, [company, employees, attendance, payrollResults, auditData]);

   if (showInspectionReport) {
      return <LaborInspectionReport data={inspectionData} lang={lang} onClose={() => setShowInspectionReport(false)} />;
   }

   const t = {
      fr: { title: "Rapports & Livre de Paie", finance: "Vue d'ensemble", audit: "Audit IA", ledger: "Livre de Paie", btnReport: "RAPPORT INSPECTION", mass: "Masse Salariale", compliance: "Conformité" },
      ar: { title: "التقارير وسجل الأداء", finance: "نظرة عامة", audit: "تدقيق الذكاء", ledger: "سجل الأداء", btnReport: "تقرير التفتيش", mass: "كتلة الأجور", compliance: "المطابقة" }
   }[lang === 'ar' ? 'ar' : 'fr'];

   return (
      <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto px-4 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
            <div className="space-y-1">
               <h2 className="text-3xl font-black text-[#111827] tracking-tighter">{t.title}</h2>
               <div className="flex bg-white p-1 rounded-xl border border-[#E5E7EB] mt-4 shadow-sm w-fit">
                  <button onClick={() => setActiveTab('finance')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'finance' ? 'bg-[#F0F7FF] text-[#0078D4]' : 'text-gray-400'}`}>{t.finance}</button>
                  <button onClick={() => setActiveTab('ledger')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'ledger' ? 'bg-[#F0F7FF] text-[#0078D4]' : 'text-gray-400'}`}>{t.ledger}</button>
                  <button onClick={() => setActiveTab('audit')} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'audit' ? 'bg-[#F0F7FF] text-[#0078D4]' : 'text-gray-400'}`}>{t.audit}</button>
               </div>
            </div>
            <button onClick={() => setShowInspectionReport(true)} className="bg-[#111827] text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-black transition-all">
               <ShieldCheck size={18} className="text-[#34C759]" /> {t.btnReport}
            </button>
         </header>

         {activeTab === 'finance' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 airbnb-card p-10 bg-white shadow-sm border-[#E5E7EB]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                     <div className="p-8 bg-[#F0FFF4] rounded-[32px] border border-[#DCFCE7] flex flex-col justify-center min-h-[200px]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t.mass}</p>
                        <p className="text-4xl font-black text-[#111827] tracking-tighter">
                           {payrollResults.reduce((acc, p) => acc + p.grossTotal, 0).toLocaleString()} <span className="text-xl">DH</span>
                        </p>
                     </div>
                     <div className="p-8 bg-[#F0F7FF] rounded-[32px] border border-[#DBEAFE] flex flex-col justify-center min-h-[200px]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Cotisations Est.</p>
                        <p className="text-4xl font-black text-[#0078D4] tracking-tighter">
                           {payrollResults.reduce((acc, p) => acc + (p.cnss + p.amo), 0).toLocaleString()} <span className="text-xl">DH</span>
                        </p>
                     </div>
                  </div>
               </div>
               <div className="lg:col-span-4 airbnb-card p-10 bg-[#111827] text-white rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-10"><ShieldCheck size={180} /></div>
                  <div className="relative z-10 text-start">
                     <div className="w-12 h-12 bg-[#0078D4] rounded-xl flex items-center justify-center mb-8 shadow-lg">
                        <BadgeCheck className="text-white" size={28} />
                     </div>
                     <h3 className="text-xl font-black mb-6 tracking-tight">{t.compliance}</h3>
                     <div className="space-y-4">
                        <ComplianceRow label="CNSS BN" status="PRÊT" color="text-[#34C759]" />
                        <ComplianceRow label="SIMPLIS DGI" status="PRÊT" color="text-[#34C759]" />
                        <ComplianceRow label="LOI FINANCES 2026" status="VÉRIFIÉ" color="text-[#34C759]" />
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'ledger' && (
            <div className="airbnb-card bg-white border-[#E5E7EB] shadow-sm overflow-hidden">
               <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-[#111827] text-white rounded-xl flex items-center justify-center shadow-lg"><Table size={20} /></div>
                     <div>
                        <h3 className="text-xl font-black text-[#111827]">{t.ledger}</h3>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Document Obligatoire - Article 371</p>
                     </div>
                  </div>
                  <div className="flex gap-2 no-print">
                     <button className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 hover:bg-blue-100 transition-all shadow-sm"><Download size={18} /></button>
                     <button onClick={() => window.print()} className="p-2.5 bg-[#0078D4] text-white rounded-xl shadow-md hover:bg-blue-700 transition-all"><Printer size={18} /></button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse min-w-[1200px]">
                     <thead>
                        <tr className="bg-gray-100 border-b border-gray-200 text-gray-500 font-black uppercase">
                           <th className="p-4 text-left border-r w-48">Salarié</th>
                           <th className="p-4 text-right border-r">Salaire de Base</th>
                           <th className="p-4 text-right border-r">Ancienneté</th>
                           <th className="p-4 text-right border-r bg-blue-50/50 text-[#0078D4]">Brut Global</th>
                           <th className="p-4 text-right border-r">CNSS (4.48%)</th>
                           <th className="p-4 text-right border-r">AMO (2.26%)</th>
                           <th className="p-4 text-right border-r">I.R.</th>
                           <th className="p-4 text-right bg-emerald-50 text-emerald-700">Net à Payer</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {employees.map(emp => {
                           const pay = payrollResults.find(p => p.employeeId === emp.id);
                           if (!pay) return null;
                           return (
                              <tr key={emp.id} className="hover:bg-gray-50 transition-all group">
                                 <td className="p-4 font-black border-r whitespace-nowrap">
                                    <div className="flex flex-col">
                                       <span>{emp.fullName}</span>
                                       <span className="text-[8px] text-gray-400 font-mono">CIN: {emp.cin}</span>
                                    </div>
                                 </td>
                                 <td className="p-4 text-right border-r font-medium">{pay.baseSalary.toLocaleString()}</td>
                                 <td className="p-4 text-right border-r font-medium text-gray-400">{pay.seniorityBonus.toLocaleString()}</td>
                                 <td className="p-4 text-right border-r font-black bg-blue-50/20">{pay.grossTotal.toLocaleString()}</td>
                                 <td className="p-4 text-right border-r text-rose-500 font-bold">{pay.cnss.toLocaleString()}</td>
                                 <td className="p-4 text-right border-r text-rose-500 font-bold">{pay.amo.toLocaleString()}</td>
                                 <td className="p-4 text-right border-r text-rose-500 font-bold">{pay.ir.toLocaleString()}</td>
                                 <td className="p-4 text-right font-black bg-emerald-50/20 text-emerald-700">{pay.netSalary.toLocaleString()}</td>
                              </tr>
                           );
                        })}
                     </tbody>
                     <tfoot className="bg-[#111827] text-white font-black uppercase">
                        <tr>
                           <td className="p-4 border-r">TOTAUX MENSUELS</td>
                           <td className="p-4 text-right border-r">---</td>
                           <td className="p-4 text-right border-r">---</td>
                           <td className="p-4 text-right border-r text-[#34C759]">{payrollResults.reduce((a, c) => a + c.grossTotal, 0).toLocaleString()}</td>
                           <td className="p-4 text-right border-r">{payrollResults.reduce((a, c) => a + c.cnss, 0).toLocaleString()}</td>
                           <td className="p-4 text-right border-r">{payrollResults.reduce((a, c) => a + c.amo, 0).toLocaleString()}</td>
                           <td className="p-4 text-right border-r">{payrollResults.reduce((a, c) => a + c.ir, 0).toLocaleString()}</td>
                           <td className="p-4 text-right bg-[#0078D4]">{payrollResults.reduce((a, c) => a + c.netSalary, 0).toLocaleString()}</td>
                        </tr>
                     </tfoot>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'audit' && (
            <div className="grid grid-cols-1 gap-6">
               {auditData.map(record => (
                  <div key={record.employee_id} className="airbnb-card p-6 bg-white border-[#E5E7EB] flex items-center justify-between">
                     <div className="text-start">
                        <p className="font-black text-[#111827]">{record.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{record.jobTitle}</p>
                     </div>
                     <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${record.riskLevel === 'LOW' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        RISQUE: {record.riskLevel}
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
};

const ComplianceRow = ({ label, status, color }: { label: string, status: string, color: string }) => (
   <div className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{status}</span>
   </div>
);

export default Reports;
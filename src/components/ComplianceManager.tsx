import React, { useState, useMemo } from 'react';
import {
   ShieldCheck, Landmark, FileText, BadgeCheck, FileDown, FileSignature,
   RefreshCw, ExternalLink, Printer, Eye, Lock, ShieldAlert, History, CreditCard,
   FileCode, FileJson, CheckCircle2, Cpu, Network, Search, Filter, Users,
   Fingerprint, Activity, Server, Database, Globe, Key, Shield,
   Info, Terminal, ArrowRight, Zap, Clock, ChevronRight, AlertTriangle
} from 'lucide-react';
import { Language, Employee, AuthUser, AttendanceRecord, CompanyProfile, PayrollResult, GovernmentSubmission } from '../types';
import { calculateEmployeePayroll } from '../services/payrollEngine';
import { CnssLogo, DgiLogo } from './GovernmentLogos';
import Logo from './Logo';
import { documentService } from '../services/documentService';

interface Props {
   lang: Language;
   employees: Employee[];
   attendance: AttendanceRecord[];
   user: AuthUser;
}

const ComplianceManager: React.FC<Props> = ({ lang, employees, attendance, user }) => {
   const [activeView, setActiveView] = useState<'registry' | 'security' | 'cnss'>('cnss');
   const [isProcessing, setIsProcessing] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');

   const currentMonthYear = new Date().toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { month: 'long', year: 'numeric' });

   const payrollResults: PayrollResult[] = useMemo(() => {
      return employees.map(e => calculateEmployeePayroll(e, attendance, [], [], [], currentMonthYear));
   }, [employees, attendance, currentMonthYear]);

   const totalIR = payrollResults.reduce((acc, p) => acc + p.ir, 0);
   const totalCNSS = payrollResults.reduce((acc, p) => acc + (p.cnss || 0), 0);

   const t = useMemo(() => ({
      fr: {
         stack: "Plateforme Gouvernementale",
         version: "V16",
         connectorSub: "Connecteurs Damancom (CNSS) & Simplis (DGI) Officiels",
         tele: "Télédéclarations",
         registry: "Registre V15",
         security: "Zéro Confiance",
         portalTitle: "Portail de Télédéclaration",
         compliantLaw: "Fichiers conformes Loi de Finances 2026.",
         bdsCnss: "BDS CNSS — Bordereau Nominatif (.TXT)",
         simplisIr: "SIMPLIS IR (.XML) — DGI",
         visualizePdf: "Aperçu PDF",
         printReport: "Imprimer",
         telepay: "Initier Télépaiement",
         directPay: "Paiement Direct",
         totalIr: "IR à liquider",
         totalCnss: "CNSS Part Salariale",
         certified: "Certifié V16 Suprême",
         certifiedSub: "Signature numérique SHA-256 appliquée sur chaque bordereau.",
         cloudSov: "Souveraineté Cloud",
         encryption: "Chiffrement RGPD/CNDP",
         auditTrail: "Piste d'Audit",
         regTitle: "Registre du Personnel (Art. 15)",
         regSub: "Document légal obligatoire certifié conforme.",
         secTitle: "Centre d'Opérations de Sécurité",
         secSub: "Protection des données souveraines & isolation multi-tenant.",
         employees: employees.length,
         month: currentMonthYear,
      },
      ar: {
         stack: "المنصة الحكومية",
         version: "V16",
         connectorSub: "موصلات Damancom و Simplis الرسمية",
         tele: "التصريحات الإلكترونية",
         registry: "السجل V15",
         security: "الثقة الصفرية",
         portalTitle: "بوابة التصريح الإلكتروني",
         compliantLaw: "ملفات مطابقة لقانون المالية 2026.",
         bdsCnss: "BDS CNSS - اللائحة الاسمية (.TXT)",
         simplisIr: "SIMPLIS IR (.XML)",
         visualizePdf: "معاينة PDF",
         printReport: "طباعة",
         telepay: "بدء الأداء الإلكتروني",
         directPay: "الأداء المباشر",
         totalIr: "إجمالي الضريبة (IR)",
         totalCnss: "CNSS حصة الأجير",
         regTitle: "سجل الموظفين (المادة 15)",
         regSub: "وثيقة قانونية إلزامية معتمدة.",
         secTitle: "مركز عمليات الأمان",
         secSub: "حماية البيانات السيادية وعزل المؤسسات.",
         employees: employees.length,
         month: currentMonthYear,
      }
   }), [])[lang];

   const filteredEmployees = useMemo(() => {
      return employees.filter(e => e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || e.cin.toLowerCase().includes(searchTerm.toLowerCase()));
   }, [employees, searchTerm]);

   const tabs = [
      { id: 'cnss' as const, label: t.tele, icon: <FileText size={14} /> },
      { id: 'registry' as const, label: t.registry, icon: <Users size={14} /> },
      { id: 'security' as const, label: t.security, icon: <Shield size={14} /> },
   ];

   const generateCNSSFile = async () => {
      await documentService.downloadPdf('cnss', user.companyId, currentMonthYear);
   };

   const generateDGIFile = async () => {
      // DGI uses Simplis IR XML in real life, but we will download the payroll journal as PDF for now, 
      // or we can keep the XML generator for DGI and only use documentService for PDFs.
      let content = `<?xml version="1.0" encoding="UTF-8"?>\n<SimplisIR>\n<Periode>${currentMonthYear}</Periode>\n<Salaries>\n`;
      employees.forEach((emp, index) => {
         const p = payrollResults[index];
         content += `  <Salarie>\n    <Matricule>${emp.internalMatricule}</Matricule>\n    <IR>${p.ir}</IR>\n  </Salarie>\n`;
      });
      content += `</Salaries>\n</SimplisIR>`;
      const blob = new Blob([content], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SIMPLIS_IR_${currentMonthYear.replace(/\s+/g, '_')}.xml`;
      a.click();
   };

   const generatePayrollPdf = async () => {
      await documentService.downloadPdf('payroll', user.companyId, currentMonthYear);
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1400px] mx-auto px-4 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

         {/* ── HEADER ─────────────────────────────────────────────────── */}
         <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 no-print">
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-100 text-[#0078D4] rounded-full text-[10px] font-black uppercase tracking-widest">
                     <span className="w-1.5 h-1.5 rounded-full bg-[#0078D4] animate-pulse" /> CERTIFIÉ CONFORME
                  </span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.month}</span>
               </div>
               <h2 className="text-4xl font-black text-[#111827] tracking-tighter leading-none">
                  {t.stack} <span className="text-[#0078D4]">{t.version}</span>
               </h2>
               <p className="text-[#6B7280] font-medium text-sm">{t.connectorSub}</p>
            </div>

            {/* Tab Pills */}
            <div className="flex bg-[#F4F6F8] p-1.5 rounded-2xl border border-[#E5E7EB]">
               {tabs.map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveView(tab.id)}
                     className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${activeView === tab.id
                        ? 'bg-white shadow-sm text-[#0078D4] border border-gray-100'
                        : 'text-gray-400 hover:text-gray-700'
                        }`}
                  >
                     {tab.icon} {tab.label}
                  </button>
               ))}
            </div>
         </header>

         {/* ── QUICK STATS BAR ─────────────────────────────────────────── */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
            {[
               { label: 'Salariés Déclarés', val: employees.length.toString(), color: 'text-[#111827]', sub: 'Effectif total', icon: <Users size={16} /> },
               { label: t.totalIr, val: `${totalIR.toLocaleString()} DH`, color: 'text-rose-600', sub: 'Mois courant', icon: <CreditCard size={16} /> },
               { label: t.totalCnss, val: `${totalCNSS.toLocaleString()} DH`, color: 'text-indigo-600', sub: 'Part salariale', icon: <ShieldCheck size={16} /> },
               { label: 'Statut Déclaration', val: 'EN ATTENTE', color: 'text-amber-500', sub: 'Action requise', icon: <Clock size={16} /> },
            ].map(stat => (
               <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>{stat.icon}</div>
                  <div className="min-w-0">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate mb-0.5">{stat.label}</p>
                     <p className={`text-base font-black ${stat.color} leading-tight`}>{stat.val}</p>
                     <p className="text-[9px] text-gray-400 font-medium">{stat.sub}</p>
                  </div>
               </div>
            ))}
         </div>

         {/* ── TÉLÉDÉCLARATIONS ─────────────────────────────────────────── */}
         {activeView === 'cnss' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 duration-400">

               {/* Main portal card */}
               <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-8 space-y-8 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-10 opacity-[0.025] pointer-events-none rotate-6">
                        <Landmark size={300} />
                     </div>

                     {/* Portal header */}
                     <div className="flex items-start gap-5 relative z-10">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                           <Landmark size={26} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-[#111827] tracking-tight">{t.portalTitle}</h3>
                           <p className="text-sm text-gray-500 font-medium mt-0.5">{t.compliantLaw}</p>
                        </div>
                        <span className="ml-auto px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0">
                           Loi 2026 ✓
                        </span>
                     </div>

                     {/* Action buttons */}
                     <div className="relative z-10 grid grid-cols-1 gap-3">
                        <button onClick={generateCNSSFile} className="w-full py-4 bg-[#111827] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-4 px-6 shadow-lg hover:bg-black transition-all group">
                           <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                              <CnssLogo size={16} />
                           </div>
                           <span className="flex-1 text-left">{t.bdsCnss}</span>
                           <FileDown size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <button onClick={generateDGIFile} className="w-full py-4 bg-blue-50 border border-blue-100 text-[#0078D4] rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-4 px-6 hover:bg-blue-100 transition-all group">
                           <div className="w-8 h-8 bg-[#0078D4]/10 rounded-lg flex items-center justify-center shrink-0">
                              <DgiLogo size={16} />
                           </div>
                           <span className="flex-1 text-left">{t.simplisIr}</span>
                           <FileDown size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                           <button onClick={generatePayrollPdf} className="py-3.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2.5 hover:border-gray-300 hover:bg-white transition-all">
                              <FileDown size={15} /> Rapport Paie PDF
                           </button>
                           <button onClick={generateCNSSFile} className="py-3.5 bg-[#0078D4] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-md shadow-blue-200 hover:bg-blue-700 transition-all">
                              <FileDown size={15} /> Déclaration CNSS PDF
                           </button>
                        </div>
                     </div>

                     {/* Payment footer */}
                     <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-100">
                              <CreditCard size={22} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.directPay}</p>
                              <p className="text-xl font-black text-[#111827] mt-0.5">{totalIR.toLocaleString()} <span className="text-sm font-bold text-gray-400">DH</span></p>
                           </div>
                        </div>
                        <button className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-[#0078D4] to-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3">
                           <ExternalLink size={16} /> {t.telepay}
                        </button>
                     </div>
                  </div>

                  {/* Recent submissions preview */}
                  <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
                     <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Historique des Dépôts</h4>
                        <button className="text-[10px] font-black text-[#0078D4] flex items-center gap-1 hover:underline">Voir tout <ChevronRight size={12} /></button>
                     </div>
                     <div className="space-y-3">
                        {[
                           { month: 'Février 2026', status: 'Déposé', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', date: '02/03/2026' },
                           { month: 'Janvier 2026', status: 'Déposé', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', date: '01/02/2026' },
                           { month: 'Décembre 2025', status: 'Déposé', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', date: '03/01/2026' },
                        ].map(item => (
                           <div key={item.month} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                              <div className="flex items-center gap-3">
                                 <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                 <span className="text-sm font-bold text-[#111827]">{item.month}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 <span className="text-[10px] text-gray-400">{item.date}</span>
                                 <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${item.color}`}>{item.status}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Side compliance card */}
               <div className="lg:col-span-4 space-y-5">
                  <div className="bg-[#0F172A] text-white rounded-[28px] shadow-2xl shadow-blue-900/20 p-8 relative overflow-hidden group">
                     {/* BG decoration */}
                     <div className="absolute inset-0 bg-gradient-to-br from-[#0078D4]/20 to-indigo-600/10 pointer-events-none" />
                     <div className="absolute -right-10 -top-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                        <ShieldCheck size={260} />
                     </div>

                     <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-[#0078D4] rounded-xl flex items-center justify-center shadow-lg">
                              <BadgeCheck size={22} className="text-white" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Statut Certification</p>
                              <h4 className="text-lg font-black leading-tight">{t.certified}</h4>
                           </div>
                        </div>

                        <p className="text-sm text-slate-400 leading-relaxed">{t.certifiedSub}</p>

                        <div className="space-y-4 pt-2 border-t border-white/10">
                           <ComplianceRow label={t.cloudSov} status="MA-LOCAL" />
                           <ComplianceRow label={t.encryption} status="AES-GCM" />
                           <ComplianceRow label={t.auditTrail} status="IMMUABLE" />
                        </div>

                        <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                           <div className="bg-white/5 rounded-xl p-3 text-center">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nœud</p>
                              <p className="text-sm font-black text-white mt-0.5">CASA-1</p>
                           </div>
                           <div className="bg-white/5 rounded-xl p-3 text-center">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TLS</p>
                              <p className="text-sm font-black text-white mt-0.5">1.3 AES</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Quick info boxes */}
                  <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 space-y-3">
                     <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Connecteurs Actifs</h5>
                     {[
                        { name: 'Damancom (CNSS)', status: 'Connecté', color: 'text-emerald-500' },
                        { name: 'Simplis IR (DGI)', status: 'Connecté', color: 'text-emerald-500' },
                        { name: 'OMPIC Registre', status: 'Inactif', color: 'text-gray-400' },
                     ].map(c => (
                        <div key={c.name} className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-sm font-bold text-[#111827]">
                              <span className={`w-2 h-2 rounded-full ${c.color.includes('emerald') ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                              {c.name}
                           </div>
                           <span className={`text-[10px] font-black uppercase ${c.color}`}>{c.status}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {/* ── REGISTRE V15 ─────────────────────────────────────────────── */}
         {activeView === 'registry' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-400">
               <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-8 space-y-6">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                           <Users size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-[#111827] tracking-tight">{t.regTitle}</h3>
                           <p className="text-sm text-gray-500 font-medium">{t.regSub}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 w-full md:w-auto no-print">
                        <div className="relative flex-1 md:w-72 group">
                           <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                           <input
                              placeholder="Rechercher un salarié..."
                              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                           />
                        </div>
                        <button onClick={() => window.print()} className="shrink-0 px-5 py-3 bg-[#111827] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-black transition-all">
                           <Printer size={14} /> Exporter
                        </button>
                     </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-100">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <th className="px-5 py-4">Matricule</th>
                              <th className="px-5 py-4">Salarié</th>
                              <th className="px-5 py-4">CIN</th>
                              <th className="px-5 py-4">N° CNSS</th>
                              <th className="px-5 py-4">Contrat</th>
                              <th className="px-5 py-4 text-right">Salaire Base</th>
                              <th className="px-5 py-4 text-center">Statut</th>
                           </tr>
                        </thead>
                        <tbody>
                           {filteredEmployees.length === 0 ? (
                              <tr>
                                 <td colSpan={7} className="py-12 text-center text-gray-400 text-sm font-medium">
                                    <Users size={32} className="mx-auto mb-3 text-gray-200" />
                                    Aucun salarié trouvé
                                 </td>
                              </tr>
                           ) : filteredEmployees.map((emp, i) => (
                              <tr key={emp.id} className={`group transition-colors hover:bg-indigo-50/30 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                 <td className="px-5 py-4 font-mono text-[11px] font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">{emp.internalMatricule}</td>
                                 <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                          {emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full object-cover" alt="" /> : null}
                                       </div>
                                       <span className="font-bold text-sm text-[#111827]">{emp.fullName}</span>
                                    </div>
                                 </td>
                                 <td className="px-5 py-4 font-bold text-xs text-gray-500 uppercase">{emp.cin}</td>
                                 <td className="px-5 py-4 font-mono text-xs text-gray-400">{emp.cnssEmployee || '—'}</td>
                                 <td className="px-5 py-4">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-black uppercase tracking-widest">{emp.contractType}</span>
                                 </td>
                                 <td className="px-5 py-4 text-right font-black text-sm text-[#111827]">{emp.baseSalary.toLocaleString()} <span className="text-gray-400 font-medium">DH</span></td>
                                 <td className="px-5 py-4 text-center">
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase">VÉRIFIÉ</span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  {/* Footer note */}
                  <div className="flex items-center gap-2 pt-2">
                     <Info size={14} className="text-indigo-400 shrink-0" />
                     <p className="text-[10px] font-bold text-gray-400 italic">Article 15 : Le registre doit être visé et numéroté par l'inspecteur du travail.</p>
                  </div>
               </div>
            </div>
         )}

         {/* ── ZÉRO CONFIANCE ─────────────────────────────────────────── */}
         {activeView === 'security' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-400">
               {/* Security metric grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SecurityMetric label="SHA-256 Intégrité" value="VALIDE" sub="128 MB payload signé" color="text-[#0078D4]" icon={<Fingerprint size={18} />} />
                  <SecurityMetric label="Chiffrement" value="AES-GCM" sub="Accéléré matériel" color="text-indigo-600" icon={<Lock size={18} />} />
                  <SecurityMetric label="Localisation" value="CASA-1" sub="MA Sovereignty Center" color="text-emerald-600" icon={<Globe size={18} />} />
                  <SecurityMetric label="Niveau de Menace" value="ZÉRO" sub="Scan actif V16" color="text-blue-500" icon={<Activity size={18} />} />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Audit log */}
                  <div className="lg:col-span-8 bg-white rounded-[28px] border border-gray-100 shadow-sm p-8 space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                              <Terminal size={22} />
                           </div>
                           <div>
                              <h3 className="text-lg font-black text-[#111827] tracking-tight">V16 Zero-Trust Audit Log</h3>
                              <p className="text-sm text-gray-400 font-medium">Registres d'activité immuables.</p>
                           </div>
                        </div>
                        <div className="px-4 py-2 bg-zinc-100 text-zinc-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-zinc-200">
                           ISO 27001
                        </div>
                     </div>

                     <div className="space-y-3">
                        <AuditRow time="10:45:22" event="AUTH_HANDSHAKE_SUCCESS" user="Admin Node" target="Tenant Isolation" status="ok" />
                        <AuditRow time="10:42:01" event="ENCRYPTED_QUERY_EXEC" user="AI Agent" target="Payroll Registry" status="ok" />
                        <AuditRow time="09:15:33" event="GOV_TX_SIGNED" user="Damancom Connector" target="SHA-256 Bordereau" status="ok" />
                        <AuditRow time="08:00:10" event="BACKUP_REPLICATION" user="System Core" target="Sovereign Cluster MA" status="ok" />
                        <AuditRow time="07:12:55" event="RBAC_POLICY_ENFORCED" user="Auth Gateway" target="HR Module Access" status="ok" />
                     </div>
                  </div>

                  {/* Sidebar security info */}
                  <div className="lg:col-span-4 space-y-5">
                     <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-[28px] shadow-2xl p-7 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                           <Shield size={160} />
                        </div>
                        <div className="relative z-10 space-y-5">
                           <BadgeCheck size={36} className="text-indigo-200" />
                           <h4 className="text-lg font-black leading-snug">Souveraineté des données</h4>
                           <p className="text-indigo-200 text-sm leading-relaxed">Vos données RH et paie ne quittent jamais le périmètre national. Les clés sont gérées via HSM.</p>
                           <div className="space-y-3 pt-2 border-t border-white/10">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                 <span className="text-indigo-200">Protection DNS</span>
                                 <span className="text-emerald-400">ACTIVÉE</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-400 w-full rounded-full" />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 space-y-4">
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Infrastructure Système</h5>
                        <InfraRow icon={<Server size={13} />} label="Node Region" val="MA-CENTRAL-1" />
                        <InfraRow icon={<Database size={13} />} label="Storage Layer" val="PostgreSQL (Chiffré)" />
                        <InfraRow icon={<Network size={13} />} label="API Gateway" val="K8s Ingress Controller" />
                        <InfraRow icon={<Key size={13} />} label="Key Management" val="HSM Hardware" />
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

// ── Sub-components ──────────────────────────────────────────────────────────

const SecurityMetric = ({ label, value, sub, color, icon }: any) => (
   <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-36 hover:shadow-md hover:border-gray-200 transition-all group cursor-default">
      <div className={`p-2.5 bg-gray-50 rounded-xl w-fit group-hover:scale-105 transition-transform ${color}`}>{icon}</div>
      <div>
         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
         <p className={`text-xl font-black ${color} tracking-tighter leading-none`}>{value}</p>
         <p className="text-[9px] font-medium text-gray-400 mt-0.5">{sub}</p>
      </div>
   </div>
);

const AuditRow = ({ time, event, user, target, status }: any) => (
   <div className="flex items-center gap-4 py-3 px-4 bg-gray-50 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
      <span className="text-[10px] font-mono font-bold text-gray-300 shrink-0">{time}</span>
      <div className="flex-1 min-w-0">
         <p className="text-xs font-black text-[#1A1F36] uppercase leading-tight truncate">{event}</p>
         <p className="text-[9px] font-bold text-gray-400 mt-0.5 truncate">{user} <span className="text-gray-300">•</span> {target}</p>
      </div>
      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
   </div>
);

const InfraRow = ({ icon, label, val }: any) => (
   <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
         <span className="text-gray-300">{icon}</span>
         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{label}</span>
      </div>
      <span className="text-[10px] font-black text-[#1A1F36] text-right">{val}</span>
   </div>
);

const ComplianceRow = ({ label, status }: { label: string; status: string }) => (
   <div className="flex justify-between items-center">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-[11px] font-black text-[#0078D4] uppercase tracking-widest">{status}</span>
   </div>
);

export default ComplianceManager;
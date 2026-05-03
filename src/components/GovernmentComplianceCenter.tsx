import React, { useState, useEffect, useMemo } from 'react';
import {
   ShieldCheck, Landmark, BarChart3, PieChart, TrendingUp, Search, Download, FileSpreadsheet,
   Fingerprint, FileCheck, BadgeCheck, ShieldAlert, Cpu, Network,
   ArrowUpRight, Globe, Lock, Activity, Server, Database,
   ArrowRight, CheckCircle2, AlertTriangle, RefreshCw,
   FileDown, FileSignature, FileStack, Archive, History
} from 'lucide-react';
import {
   Language, Employee, PayrollResult, NationalComplianceScore,
   AuthUser, MinistryAnalytics, GovernmentSubmission
} from '../types';
import { GovernmentNodeCore } from '../services/government/GovernmentNodeCore';
import { CnssLogo, DgiLogo, CmirLogo } from './GovernmentLogos';
import Logo from './Logo';

interface Props {
   lang: Language;
   employees: Employee[];
   payroll: PayrollResult[];
   user: AuthUser;
}

const GovernmentComplianceCenter: React.FC<Props> = ({ lang, employees, payroll, user }) => {
   const [score, setScore] = useState<NationalComplianceScore | null>(null);
   const [analytics, setAnalytics] = useState<MinistryAnalytics | null>(null);
   const [loading, setLoading] = useState(false);
   const [activeTab, setActiveTab] = useState<'node' | 'cmir' | 'security'>('node');

   const govNode = useMemo(() => GovernmentNodeCore.getInstance(), []);

   const runNationalAudit = async () => {
      setLoading(true);
      const [newScore, newAnalytics] = await Promise.all([
         govNode.calculateNationalCompliance(user.companyId, employees, payroll),
         govNode.getMinistryAnalytics('Casablanca-Settat', 'BTP')
      ]);
      setScore(newScore);
      setAnalytics(newAnalytics);
      setLoading(false);
   };

   useEffect(() => {
      runNationalAudit();
   }, [user.companyId, employees.length]);

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-24" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-start">
            <div className="space-y-1">
               <h2 className="text-3xl font-black text-[#1A1F36] tracking-tighter flex items-center gap-4">
                  <Landmark size={32} className="text-[#0052FF]" /> Government Node V23
               </h2>
               <p className="text-gray-400 font-medium text-sm">National Compliance Infrastructure • Pan-African Labor Hub</p>
            </div>
            <div className="flex bg-[#F7F9FC] p-1 rounded-2xl border border-[#E3E8EE] shadow-inner">
               <button onClick={() => setActiveTab('node')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'node' ? 'bg-white shadow-md text-[#0052FF]' : 'text-gray-400'}`}>National Compliance</button>
               <button onClick={() => setActiveTab('cmir')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cmir' ? 'bg-white shadow-md text-[#0052FF]' : 'text-gray-400'}`}>CMIR Retirement</button>
               <button onClick={() => setActiveTab('security')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-white shadow-md text-[#0052FF]' : 'text-gray-400'}`}>Security Protocol</button>
            </div>
         </header>

         {activeTab === 'node' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-6">
               <div className="lg:col-span-8 space-y-6">
                  <div className="airbnb-card p-10 bg-white border-none shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12"><ShieldCheck size={240} /></div>
                     <div className="relative z-10 space-y-10">
                        <div className="flex justify-between items-center">
                           <div className="text-start">
                              <div className="flex items-center gap-3 mb-2">
                                 <DgiLogo size={20} />
                                 <span className="text-[10px] font-black uppercase text-[#0E6F5C] tracking-widest">Direction Générale des Impôts</span>
                              </div>
                              <h3 className="text-2xl font-black text-[#1A1F36]">National Compliance Index</h3>
                              <p className="text-sm font-medium text-gray-400">Validated against Bulletin Officiel Morocco V2026</p>
                           </div>
                           <div className="text-right">
                              <p className="text-5xl font-black text-[#0052FF] tracking-tighter">{score?.overallScore || '---'}%</p>
                              <span className="text-[9px] font-black uppercase text-emerald-600">Certified Sovereign Node</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                           <ScoreMetric label="Payroll Integrity" value={score?.payrollIntegrity || 0} />
                           <ScoreMetric label="Tax Regularity" value={score?.taxRegularity || 0} />
                           <ScoreMetric label="Social Coverage" value={score?.socialCoverage || 0} />
                           <ScoreMetric label="Labor Adherence" value={score?.laborLawAdherence || 0} />
                        </div>

                        <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <BarChart3 size={20} className="text-blue-500" />
                              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">SHA-256: {score?.certificationHash.substring(0, 32)}...</span>
                           </div>
                           <button className="px-6 py-3 bg-[#1A1F36] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95">
                              <BadgeCheck size={16} /> RE-CERTIFY STATUS
                           </button>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-4 space-y-6 text-start">
                  <div className="airbnb-card p-10 bg-[#1A1F36] text-white rounded-[48px] shadow-2xl relative overflow-hidden group">
                     <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-1000"><Cpu size={180} /></div>
                     <h4 className="text-xl font-black mb-4 relative z-10 flex items-center gap-3"><Network size={24} className="text-[#0052FF]" /> Agent Compliance Hub</h4>
                     <div className="space-y-4 relative z-10">
                        <AgentPulse logo={<CnssLogo size={14} />} name="CNSS Validator" status="ACTIVE" load="12%" />
                        <AgentPulse logo={<CmirLogo size={14} />} name="CMIR Retirement" status="SCANNING" load="5%" />
                        <AgentPulse logo={<DgiLogo size={14} />} name="DGI Simplis" status="READY" load="0%" />
                        <AgentPulse logo={<ShieldCheck size={14} />} name="Labor Court Sim" status="IDLE" load="0%" />
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'cmir' && (
            <div className="animate-in slide-in-from-bottom-6 space-y-8 text-start">
               <div className="airbnb-card bg-white p-10 rounded-[40px] shadow-sm space-y-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12"><CmirLogo size={300} /></div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-50 pb-8 relative z-10">
                     <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-sm border border-indigo-100"><CmirLogo size={32} /></div>
                        <div>
                           <h3 className="text-2xl font-black text-[#1A1F36]">CMIR Export Portal</h3>
                           <p className="text-sm font-medium text-gray-400 uppercase tracking-widest text-[9px] font-black">Caisse Marocaine Interprofessionnelle de Retraite</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95">
                           <FileDown size={16} /> Générer Bordereau (.XLSX)
                        </button>
                        <button className="px-6 py-3 bg-white border border-gray-100 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-black transition-all">
                           <History size={16} /> Archives CMIR
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                     <div className="p-8 bg-[#F7F9FC] rounded-[36px] border border-gray-100 space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Salariés Affiliés</p>
                        <div className="flex items-baseline gap-2">
                           <p className="text-4xl font-black text-[#1A1F36]">{employees.filter(e => e.cmirEmployee).length}</p>
                           <span className="text-xs font-bold text-gray-300">/ {employees.length}</span>
                        </div>
                     </div>
                     <div className="p-8 bg-[#F7F9FC] rounded-[36px] border border-gray-100 space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contributions Totales</p>
                        <p className="text-4xl font-black text-indigo-600">{payroll.reduce((acc, p) => acc + p.cmir + p.employerCharges.cmir, 0).toLocaleString()} DH</p>
                     </div>
                     <div className="p-8 bg-emerald-50 rounded-[36px] border border-emerald-100 space-y-4">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Statut Règlement</p>
                        <div className="flex items-center gap-3">
                           <BadgeCheck className="text-emerald-500" size={24} />
                           <p className="text-xl font-black text-emerald-900">EN RÈGLE</p>
                        </div>
                     </div>
                  </div>

                  <div className="overflow-hidden rounded-[32px] border border-gray-100 relative z-10">
                     <table className="w-full text-left">
                        <thead className="bg-[#F7F9FC]">
                           <tr>
                              <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Collaborateur</th>
                              <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">N° CMIR</th>
                              <th className="p-5 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Part Salariale</th>
                              <th className="p-5 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Part Patronale</th>
                              <th className="p-5 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                           {employees.filter(e => e.cmirEmployee).map(emp => {
                              const pay = payroll.find(p => p.employeeId === emp.id);
                              return (
                                 <tr key={emp.id} className="hover:bg-indigo-50/10 transition-colors">
                                    <td className="p-5 font-bold text-[#1A1F36]">{emp.fullName}</td>
                                    <td className="p-5 font-mono text-xs text-gray-500">{emp.cmirEmployee}</td>
                                    <td className="p-5 text-right font-black">{(pay?.cmir || 0).toLocaleString()} DH</td>
                                    <td className="p-5 text-right font-black">{(pay?.employerCharges.cmir || 0).toLocaleString()} DH</td>
                                    <td className="p-5 text-right"><span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-black text-xs">{((pay?.cmir || 0) + (pay?.employerCharges.cmir || 0)).toLocaleString()} DH</span></td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

const ScoreMetric = ({ label, value }: { label: string, value: number }) => (
   <div className="p-4 bg-gray-50 rounded-2xl text-start group hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100">
      <p className="text-[8px] font-black text-gray-400 uppercase mb-2 tracking-widest">{label}</p>
      <div className="flex items-end gap-2">
         <span className="text-2xl font-black text-[#1A1F36]">{value}</span>
         <span className="text-[10px] font-bold text-gray-300 mb-1">/100</span>
      </div>
   </div>
);

const AgentPulse = ({ name, status, load, logo }: { name: string, status: string, load: string, logo?: React.ReactNode }) => (
   <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl group hover:bg-white/10 transition-all">
      <div className="flex items-center gap-3">
         <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            {logo}
         </div>
         <span className="text-xs font-bold text-gray-300">{name}</span>
      </div>
      <div className="flex items-center gap-4">
         <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">LOAD: {load}</span>
         <span className="text-[10px] font-black uppercase text-[#0052FF]">{status}</span>
      </div>
   </div>
);

const TabBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
   <button onClick={onClick} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-white shadow-md text-[#0052FF]' : 'text-gray-400 hover:text-gray-600'}`}>
      {icon} {label}
   </button>
);

export default GovernmentComplianceCenter;
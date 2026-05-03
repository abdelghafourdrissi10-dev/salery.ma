import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Search, Filter, 
  ChevronRight, BrainCircuit, Info, Download, Printer, 
  BarChart3, PieChart, Activity, RefreshCw, FileWarning, 
  BadgeCheck, Users, Gavel, ArrowUpRight, TrendingDown
} from 'lucide-react';
import { 
  Employee, Language, AuthUser, PayrollResult, 
  CnssRiskMetrics, CnssEmployeeRisk 
} from '../types';
import { GoogleGenAI } from "@google/genai";

interface Props {
  employees: Employee[];
  payrollResults: PayrollResult[];
  lang: Language;
  user: AuthUser;
}

const CnssComplianceModule: React.FC<Props> = ({ employees, payrollResults, lang, user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Constants per Moroccan Law
  const CNSS_RATE = 0.0448; // Salarial
  const CNSS_CEILING = 6000;

  const riskData = useMemo(() => {
    const risks: CnssEmployeeRisk[] = employees.map(emp => {
      const pay = payrollResults.find(p => p.employeeId === emp.id);
      const issues: string[] = [];
      let status: 'COMPLIANT' | 'WARNING' | 'HIGH_RISK' = 'COMPLIANT';

      // 1. Missing CNSS Number
      if (!emp.cnssEmployee) {
        issues.push(lang === 'ar' ? 'رقم الضمان الاجتماعي مفقود' : 'Numéro CNSS manquant');
        status = 'HIGH_RISK';
      }

      // 2. SMIG Compliance (approximate check for declaration)
      if (emp.baseSalary < 3422.72 && emp.salaryType === 'fixed') {
        issues.push(lang === 'ar' ? 'الراتب أقل من الحد الأدنى' : 'Salaire < SMIG');
        status = status === 'HIGH_RISK' ? 'HIGH_RISK' : 'WARNING';
      }

      // 3. Contribution Check
      const due = pay ? Math.min(pay.grossTotal, CNSS_CEILING) * CNSS_RATE : 0;
      const paid = pay ? pay.cnss : 0;
      
      if (Math.abs(due - paid) > 5) { // 5 DH tolerance for rounding
        issues.push(lang === 'ar' ? 'فرق في المساهمة' : 'Écart de cotisation');
        status = 'HIGH_RISK';
      }

      return {
        employeeId: emp.id,
        employeeName: emp.fullName,
        cnssNumber: emp.cnssEmployee || '---',
        baseSalary: emp.baseSalary,
        contributionPaid: paid,
        contributionDue: due,
        status,
        issues
      };
    });

    const metrics: CnssRiskMetrics = {
      overallRiskScore: Math.round((risks.filter(r => r.status !== 'COMPLIANT').length / (risks.length || 1)) * 100),
      missingCnssNumbers: risks.filter(r => r.cnssNumber === '---').length,
      incorrectDeclarations: risks.filter(r => r.issues.includes('Salaire < SMIG') || r.issues.includes('الراتب أقل من الحد الأدنى')).length,
      lateContributions: 0, // Mocked for UI
      contractAnomalies: risks.filter(r => r.status === 'HIGH_RISK').length,
      totalDueMAD: risks.reduce((acc, r) => acc + r.contributionDue, 0),
      totalPaidMAD: risks.reduce((acc, r) => acc + r.contributionPaid, 0)
    };

    return { risks, metrics };
  }, [employees, payrollResults, lang]);

  const filteredRisks = riskData.risks.filter(r => {
    const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || r.cnssNumber.includes(searchTerm);
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleLancerAuditIA = async () => {
    setIsAnalyzing(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = {
      metrics: riskData.metrics,
      sampleAnomalies: riskData.risks.filter(r => r.status === 'HIGH_RISK').slice(0, 5)
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this CNSS compliance risk data for a Moroccan company: ${JSON.stringify(context)}. Provide 3 actionable corrections in professional ${lang === 'fr' ? 'French' : 'Arabic'}. Focus on legal risks and CNSS Articles.`,
        config: { temperature: 0.2 }
      });
      setAiAnalysis(response.text || 'Audit impossible.');
    } catch (e) {
      setAiAnalysis("Erreur d'analyse IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const t = {
    fr: {
      title: "Risque de Conformité CNSS",
      sub: "Audit temps réel et détection d'anomalies sociales.",
      scoreLabel: "Score de Risque Global",
      metrics: ["CNSS Manquants", "Décl. Incorrectes", "Contrats à risque", "Écart Cotisations"],
      aiAudit: "LANCER AUDIT IA",
      aiWait: "Analyse en cours...",
      table: { name: "Employé", cnss: "N° CNSS", salary: "Salaire", due: "Dû", paid: "Payé", status: "Statut" },
      status: { COMPLIANT: "Conforme", WARNING: "Alerte", HIGH_RISK: "Risque Élevé" },
      footer: "Conforme au Code de Sécurité Sociale Marocain (Dahir n° 1-59-148).",
      lastAudit: "Dernier audit système : "
    },
    ar: {
      title: "مخاطر الامتثال للضمان الاجتماعي",
      sub: "تدقيق فوري وكشف الاختلالات الاجتماعية.",
      scoreLabel: "مؤشر المخاطر العام",
      metrics: ["أرقام مفقودة", "تصاريح خاطئة", "عقود مهددة", "فوارق الأداء"],
      aiAudit: "بدء تدقيق الذكاء",
      aiWait: "جاري التحليل...",
      table: { name: "الموظف", cnss: "رقم الضمان", salary: "الراتب", due: "المستحق", paid: "المؤدى", status: "الحالة" },
      status: { COMPLIANT: "مطابق", WARNING: "تنبيه", HIGH_RISK: "مخاطر عالية" }
    }
  }[lang === 'ar' ? 'ar' : 'fr'];

  const riskColor = riskData.metrics.overallRiskScore > 40 ? 'text-rose-600' : riskData.metrics.overallRiskScore > 15 ? 'text-amber-500' : 'text-emerald-500';
  const riskBg = riskData.metrics.overallRiskScore > 40 ? 'bg-rose-50' : riskData.metrics.overallRiskScore > 15 ? 'bg-amber-50' : 'bg-emerald-50';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1400px] mx-auto text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 1. Header & Risk Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-2">
          <h2 className="text-3xl font-black text-[#1E3A8A] tracking-tighter">{t.title}</h2>
          <p className="text-gray-400 font-medium">{t.sub}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
             <MetricBox label={t.metrics[0]} value={riskData.metrics.missingCnssNumbers} icon={<Users size={16}/>} isAlert={riskData.metrics.missingCnssNumbers > 0} />
             <MetricBox label={t.metrics[1]} value={riskData.metrics.incorrectDeclarations} icon={<FileWarning size={16}/>} isAlert={riskData.metrics.incorrectDeclarations > 0} />
             <MetricBox label={t.metrics[2]} value={riskData.metrics.contractAnomalies} icon={<AlertTriangle size={16}/>} isAlert={riskData.metrics.contractAnomalies > 5} />
             <MetricBox label={t.metrics[3]} value={`${Math.abs(riskData.metrics.totalDueMAD - riskData.metrics.totalPaidMAD).toLocaleString()} DH`} icon={<TrendingDown size={16}/>} isAlert={Math.abs(riskData.metrics.totalDueMAD - riskData.metrics.totalPaidMAD) > 100} />
          </div>
        </div>

        <div className={`airbnb-card p-8 ${riskBg} border-none flex flex-col items-center justify-center text-center shadow-xl`}>
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">{t.scoreLabel}</p>
           <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                 <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-100" />
                 <circle 
                   cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="12" 
                   strokeDasharray={440} 
                   strokeDashoffset={440 - (440 * riskData.metrics.overallRiskScore) / 100} 
                   className={riskColor}
                   strokeLinecap="round"
                 />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className={`text-4xl font-black ${riskColor}`}>{riskData.metrics.overallRiskScore}%</span>
                 <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">AI AGENT SCORE</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* 2. Main Table View */}
        <div className="xl:col-span-8 space-y-6">
           <div className="airbnb-card bg-white p-8 border-[#E5E7EB] shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                 <div className="relative w-full md:w-96">
                    <Search size={18} className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-300`} />
                    <input 
                       placeholder={lang === 'ar' ? 'بحث...' : 'Filtrer par nom ou N° CNSS...'}
                       className={`w-full py-3 ${lang === 'ar' ? 'pr-11' : 'pl-11'} pr-5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-[#1E3A8A] transition-all`}
                       value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'ALL' ? 'bg-[#1E3A8A] text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}>TOUS</button>
                    <button onClick={() => setFilterStatus('HIGH_RISK')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'HIGH_RISK' ? 'bg-rose-600 text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}>RISQUE</button>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <th className="pb-4">{t.table.name}</th>
                          <th className="pb-4">{t.table.cnss}</th>
                          <th className="pb-4 text-right">{t.table.salary}</th>
                          <th className="pb-4 text-right">{t.table.paid}</th>
                          <th className="pb-4 text-center">{t.table.status}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {filteredRisks.map(r => (
                         <tr key={r.employeeId} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 font-bold text-[#111827] text-sm">{r.employeeName}</td>
                            <td className={`py-4 font-mono text-xs ${r.cnssNumber === '---' ? 'text-rose-500 font-black' : 'text-gray-500'}`}>{r.cnssNumber}</td>
                            <td className="py-4 text-right font-medium text-gray-600">{r.baseSalary.toLocaleString()} DH</td>
                            <td className="py-4 text-right font-black text-[#1E3A8A]">{r.contributionPaid.toLocaleString()} DH</td>
                            <td className="py-4 text-center">
                               <div className="flex flex-col items-center">
                                  <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${
                                    r.status === 'COMPLIANT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    r.status === 'WARNING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-rose-50 text-rose-600 border-rose-100'
                                  }`}>{(t.status as any)[r.status]}</span>
                                  {r.issues.length > 0 && <span className="text-[7px] text-gray-400 mt-1 uppercase font-bold">{r.issues[0]}</span>}
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* 3. AI Insights Sidebar */}
        <div className="xl:col-span-4 space-y-6">
           <div className="airbnb-card p-10 bg-[#1E3A8A] text-white border-none shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:scale-125 transition-transform duration-1000"><BrainCircuit size={180}/></div>
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20"><BadgeCheck size={24}/></div>
                    <div>
                       <h3 className="text-xl font-black tracking-tight">Salery AI Auditor</h3>
                       <p className="text-[9px] font-black uppercase text-white/50 tracking-widest">Autonomous Compliance Scan</p>
                    </div>
                 </div>

                 {!aiAnalysis ? (
                   <div className="space-y-6">
                      <p className="text-sm font-medium text-white/70 leading-relaxed">Le moteur Salery peut analyser les écarts de déclaration et suggérer des corrections immédiates pour éviter les redressements CNSS.</p>
                      <button 
                        onClick={handleLancerAuditIA}
                        disabled={isAnalyzing}
                        className="w-full py-5 bg-white text-[#1E3A8A] rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4"
                      >
                         {isAnalyzing ? <RefreshCw size={16} className="animate-spin"/> : <Activity size={16}/>} {isAnalyzing ? t.aiWait : t.aiAudit}
                      </button>
                   </div>
                 ) : (
                   <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-sm font-medium leading-relaxed italic whitespace-pre-wrap">
                        {aiAnalysis}
                      </div>
                      <button onClick={() => setAiAnalysis('')} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Réinitialiser l'audit</button>
                   </div>
                 )}
              </div>
           </div>

           <div className="airbnb-card p-8 bg-white border-[#E5E7EB] shadow-sm space-y-6">
              <h4 className="text-sm font-black text-[#111827] uppercase tracking-widest flex items-center gap-3"><Info size={16} className="text-[#1E3A8A]"/> Actions Prioritaires</h4>
              <div className="space-y-4">
                 <PriorityAction label="Éditer CIN M. Alaoui" desc="Numéro CNSS manquant détecté" />
                 <PriorityAction label="Recalculer Paie IT" desc="3 écarts de cotisation sur le brut global" />
                 <PriorityAction label="Review CDD Commercial" desc="Contrat expiré affectant l'AMO" />
              </div>
           </div>
        </div>
      </div>

      {/* 4. Footer & Legal References */}
      <footer className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" /> {t.footer}
         </p>
         <div className="flex items-center gap-8 no-print">
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{t.lastAudit} {new Date().toLocaleDateString()}</span>
            <button className="bg-[#1E3A8A] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-900 transition-all flex items-center gap-2"><Printer size={14}/> {lang === 'fr' ? 'Imprimer Rapport' : 'طباعة التقرير'}</button>
            <button className="bg-blue-50 text-[#1E3A8A] border border-blue-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"><Download size={14}/> CSV</button>
         </div>
      </footer>
    </div>
  );
};

// Sub-components
const MetricBox = ({ label, value, icon, isAlert }: any) => (
  <div className={`p-4 rounded-2xl border transition-all ${isAlert ? 'bg-rose-50 border-rose-100' : 'bg-gray-50 border-transparent'} text-start`}>
     <div className="flex items-center gap-2 mb-2 text-gray-400">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
     </div>
     <p className={`text-xl font-black tracking-tighter ${isAlert ? 'text-rose-600' : 'text-[#111827]'}`}>{value}</p>
  </div>
);

const PriorityAction = ({ label, desc }: any) => (
  <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl group hover:bg-[#F0F7FF] cursor-pointer transition-all border border-transparent hover:border-blue-100">
     <div className="text-start">
        <h5 className="font-black text-xs text-[#111827] mb-1">{label}</h5>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{desc}</p>
     </div>
     <ChevronRight size={16} className="text-gray-300 group-hover:text-[#1E3A8A] transition-all" />
  </div>
);

export default CnssComplianceModule;
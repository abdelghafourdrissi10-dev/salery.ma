import React, { useState, useEffect, useMemo } from 'react';
import {
   Clock, LayoutGrid, Plus, ShieldCheck, AlertTriangle,
   Trash2, Edit3, CheckCircle2, TrendingUp, History,
   User, Search, ArrowRight, Layers, PieChart,
   BadgeCheck, Settings2, FileStack, Zap, Calendar,
   Timer, Lock, Unlock, Copy, Activity, X, ShieldAlert
} from 'lucide-react';
import {
   Employee, Language, AuthUser, WorkTimeTemplate,
   AttendanceRecord, SectorType
} from '../types';
import {
   DEFAULT_TEMPLATES,
   calculateDailyHours,
   calculateMonthlyReferenceHours,
   getComplianceStatus
} from '../services/attendanceEngine';

interface Props {
   employees: Employee[];
   lang: Language;
   user: AuthUser;
}

const WorkTimeManager: React.FC<Props> = ({ employees, lang, user }) => {
   const [activeTab, setActiveTab] = useState<'templates' | 'live' | 'compliance'>('templates');
   const [templates, setTemplates] = useState<WorkTimeTemplate[]>([]);
   const [isAdding, setIsAdding] = useState(false);
   const [editingTemplate, setEditingTemplate] = useState<WorkTimeTemplate | null>(null);

   const t = {
      fr: {
         title: "Moteur de Gabarits de Temps",
         sub: "Gabarits de pointage conformes Code du Travail 2026",
         btnNew: "NOUVEAU GABARIT",
         tabTemplates: "Gabarits",
         tabLive: "Suivi Temps",
         tabCompliance: "Audit Légal",
         colName: "Nom du Gabarit",
         colWeekly: "Hebdo",
         colDaily: "Quotidien",
         colRef: "Ref Mensuel",
         colStatus: "Statut",
         legalLimit: "Limite 44h",
         createTitle: "Création de Gabarit",
         editTitle: "Modification Gabarit",
         save: "Enregistrer Gabarit",
         cancel: "Annuler",
         metricHebdo: "Base Hebdo",
         metricJourSem: "Jour / Sem",
         metricQuotidien: "Quotidien",
         metricRefMensuelle: "Réf Mensuelle",
         sectorNonAgricole: "Non Agricole",
         sectorAgricole: "Agricole"
      },
      ar: {
         title: "محرك قوالب وقت العمل",
         sub: "قوالب تسجيل الحضور مطابقة لمدونة الشغل 2026",
         btnNew: "قالب جديد",
         tabTemplates: "القوالب",
         tabLive: "تتبع الوقت",
         tabCompliance: "التدقيق القانوني",
         colName: "اسم القالب",
         colWeekly: "أسبوعي",
         colDaily: "يومي",
         colRef: "المرجع الشهري",
         colStatus: "الحالة",
         legalLimit: "الحد 44 ساعة",
         createTitle: "إنشاء قالب",
         editTitle: "تعديل القالب",
         save: "حفظ القالب",
         cancel: "إلغاء",
         metricHebdo: "الأساس الأسبوعي",
         metricJourSem: "يوم / أسبوع",
         metricQuotidien: "الأساس اليومي",
         metricRefMensuelle: "المرجع الشهري",
         sectorNonAgricole: "غير فلاحي",
         sectorAgricole: "فلاحي"
      }
   }[lang] || {
      fr: {
         title: "Moteur de Gabarits de Temps",
         sub: "Gabarits de pointage conformes Code du Travail 2026",
         btnNew: "NOUVEAU GABARIT",
         tabTemplates: "Gabarits",
         tabLive: "Suivi Temps",
         tabCompliance: "Audit Légal",
         colName: "Nom du Gabarit",
         colWeekly: "Hebdo",
         colDaily: "Quotidien",
         colRef: "Ref Mensuel",
         colStatus: "Statut",
         legalLimit: "Limite 44h",
         createTitle: "Création de Gabarit",
         editTitle: "Modification Gabarit",
         save: "Enregistrer Gabarit",
         cancel: "Annuler",
         metricHebdo: "Base Hebdo",
         metricJourSem: "Jour / Sem",
         metricQuotidien: "Quotidien",
         metricRefMensuelle: "Réf Mensuelle",
         sectorNonAgricole: "Non Agricole",
         sectorAgricole: "Agricole"
      }
   }.fr;

   useEffect(() => {
      const saved = localStorage.getItem('salaire_work_templates');
      if (saved) {
         setTemplates(JSON.parse(saved));
      } else {
         setTemplates(DEFAULT_TEMPLATES);
      }
   }, []);

   const saveTemplates = (newTemplates: WorkTimeTemplate[]) => {
      setTemplates(newTemplates);
      localStorage.setItem('salaire_work_templates', JSON.stringify(newTemplates));
   };

   const handleDelete = (id: string) => {
      if (confirm("Supprimer ce gabarit ?")) {
         saveTemplates(templates.filter(t => t.id !== id));
      }
   };

   const handleClone = (tpl: WorkTimeTemplate) => {
      const clone = {
         ...tpl,
         id: `TPL-CLONE-${Date.now()}`,
         name: `${tpl.name} (Copie)`,
         createdAt: Date.now()
      };
      saveTemplates([...templates, clone]);
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-24 text-start">
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 text-[#0078D4] rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                     <Clock size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-[#1A1F36] tracking-tighter">{t.title}</h2>
               </div>
               <p className="text-sm font-medium text-gray-400">{t.sub}</p>
            </div>

            <div className="flex gap-3">
               <button
                  onClick={() => { setEditingTemplate(null); setIsAdding(true); }}
                  className="px-6 py-3 bg-[#111827] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
               >
                  <Plus size={16} /> {t.btnNew}
               </button>
               <nav className="flex bg-[#F7F9FC] p-1 rounded-2xl border border-[#E3E8EE] shadow-inner overflow-x-auto no-scrollbar">
                  <button
                     onClick={() => setActiveTab('templates')}
                     className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'templates' ? 'bg-white shadow-md text-[#0078D4]' : 'text-gray-400'}`}
                  >
                     {t.tabTemplates}
                  </button>
                  <button
                     onClick={() => setActiveTab('live')}
                     className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'live' ? 'bg-white shadow-md text-[#0078D4]' : 'text-gray-400'}`}
                  >
                     {t.tabLive}
                  </button>
                  <button
                     onClick={() => setActiveTab('compliance')}
                     className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'compliance' ? 'bg-white shadow-md text-[#0078D4]' : 'text-gray-400'}`}
                  >
                     {t.tabCompliance}
                  </button>
               </nav>
            </div>
         </header>

         {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {templates.map(tpl => (
                  <div key={tpl.id} className="airbnb-card p-8 bg-white border-[#E5E7EB] hover:border-[#0078D4] transition-all group flex flex-col justify-between">
                     <div className="space-y-6">
                        <div className="flex justify-between items-start">
                           <div className="w-12 h-12 bg-blue-50 text-[#0078D4] rounded-2xl flex items-center justify-center border border-blue-100"><Timer size={24} /></div>
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleClone(tpl)} className="p-2 text-gray-400 hover:text-blue-500 rounded-lg"><Copy size={16} /></button>
                              <button onClick={() => handleDelete(tpl.id)} className="p-2 text-gray-400 hover:text-rose-500 rounded-lg"><Trash2 size={16} /></button>
                           </div>
                        </div>

                        <div className="text-start">
                           <h4 className="text-xl font-black text-[#1A1F36] tracking-tight">{tpl.name}</h4>
                           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">
                              {tpl.sector === 'non_agricole' ? t.sectorNonAgricole : t.sectorAgricole}
                           </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-3 bg-gray-50 rounded-xl">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t.metricHebdo}</p>
                              <p className="text-lg font-black text-[#1A1F36]">{tpl.weeklyHours}h</p>
                           </div>
                           <div className="p-3 bg-gray-50 rounded-xl">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t.metricJourSem}</p>
                              <p className="text-lg font-black text-[#1A1F36]">{tpl.daysPerWeek}j</p>
                           </div>
                           <div className="p-3 bg-blue-50 rounded-xl">
                              <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{t.metricQuotidien}</p>
                              <p className="text-lg font-black text-[#0078D4]">{tpl.dailyHours}h</p>
                           </div>
                           <div className="p-3 bg-blue-50 rounded-xl">
                              <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{t.metricRefMensuelle}</p>
                              <p className="text-lg font-black text-[#0078D4]">{tpl.monthlyReferenceHours}h</p>
                           </div>
                        </div>
                     </div>

                     <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <ShieldCheck size={16} className="text-emerald-500" />
                           <span className="text-[9px] font-black uppercase text-emerald-600">Loi 65-99 OK</span>
                        </div>
                        <button className="px-4 py-2 bg-blue-50 text-[#0078D4] rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all">ASSIGNER</button>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {activeTab === 'live' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard label="Taux de présence" value="94.2%" sub="Aujourd'hui" icon={<CheckCircle2 size={20} />} color="text-emerald-500" />
                  <StatCard label="Heures Sup (Cumul)" value="164h" sub="Semaine en cours" icon={<TrendingUp size={20} />} color="text-blue-500" />
                  <StatCard label="Retards détectés" value="12" sub="Dernières 24h" icon={<Activity size={20} />} color="text-amber-500" />
                  <StatCard label="Effectif Hors-Site" value="3" sub="Chantiers externes" icon={<User size={20} />} color="text-gray-500" />
               </div>

               <div className="airbnb-card bg-white p-10 border-[#E5E7EB] shadow-sm overflow-hidden">
                  <div className="flex justify-between items-center mb-10">
                     <h4 className="text-xl font-black text-[#1A1F36]">Heatmap des Heures supplémentaires</h4>
                     <div className="flex gap-2">
                        <button className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-600 hover:bg-blue-100 transition-all"><Zap size={16} /></button>
                     </div>
                  </div>
                  <div className="h-48 flex items-end gap-2 px-4 border-b border-gray-100">
                     {[42, 68, 55, 92, 110, 84, 130, 45, 76, 54, 88, 120].map((v, i) => (
                        <div key={i} className="flex-1 bg-blue-100 rounded-t-lg transition-all hover:bg-[#0078D4] cursor-help relative group" style={{ height: `${v}%` }}>
                           <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1A1F36] text-white px-2 py-1 rounded text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              {v}h
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="flex justify-between px-4 mt-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                     <span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Juin</span>
                     <span>Juil</span><span>Août</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Déc</span>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'compliance' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
               <div className="airbnb-card bg-[#111827] text-white p-12 rounded-[48px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-10"><ShieldCheck size={200} /></div>
                  <div className="relative z-10 max-w-2xl">
                     <h3 className="text-3xl font-black tracking-tighter mb-6">Moteur de Conformité Sociale</h3>
                     <p className="text-gray-400 text-base leading-relaxed mb-10 italic">
                        "Le système scanne automatiquement vos gabarits et vos pointages pour assurer une conformité totale avec les Articles 184 à 205 du Code du Travail marocain."
                     </p>
                     <div className="flex flex-wrap gap-4">
                        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                           <BadgeCheck size={20} className="text-[#0078D4]" />
                           <span className="text-[10px] font-black uppercase tracking-widest">CNSS Ready</span>
                        </div>
                        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                           <BadgeCheck size={20} className="text-emerald-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Article 191 Validated</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="airbnb-card p-10 bg-white border-[#E5E7EB] space-y-8">
                     <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Détections de Risques</h4>
                     <div className="space-y-4">
                        <RiskItem level="LOW" label="Seuil Hebdo" desc="44h/semaine respecté sur 98% de l'effectif." />
                        <RiskItem level="MEDIUM" label="Dépassement 10h" desc="3 salariés ont dépassé la limite journalière (Art. 184)." />
                        <RiskItem level="HIGH" label="Audit requis" desc="Dépassement du contingent annuel d'heures sup." />
                     </div>
                  </div>
                  <div className="airbnb-card p-10 bg-white border-[#E5E7EB] space-y-8">
                     <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Integrations Paie</h4>
                     <div className="space-y-4">
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
                           <div className="text-start">
                              <p className="text-xs font-black text-[#1A1F36] uppercase">Injection automatique</p>
                              <p className="text-[9px] font-bold text-gray-400">Pointage {'->'} Bulletin de paie</p>
                           </div>
                           <div className="w-12 h-6 rounded-full bg-[#0078D4] p-1 flex items-center justify-end"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                        </div>
                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
                           <div className="text-start">
                              <p className="text-xs font-black text-[#1A1F36] uppercase">Verrouillage Paie</p>
                              <p className="text-[9px] font-bold text-gray-400">Bloquer gabarits après validation</p>
                           </div>
                           <div className="w-12 h-6 rounded-full bg-gray-200 p-1 flex items-center justify-start"><div className="w-4 h-4 bg-white rounded-full"></div></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* ADD/EDIT MODAL */}
         {(isAdding || editingTemplate) && (
            <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
               <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in duration-300 relative border border-gray-100 my-auto">
                  <header className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                     <div className="flex items-center gap-4 text-start">
                        <div className="w-12 h-12 bg-blue-50 text-[#0078D4] rounded-2xl flex items-center justify-center shadow-inner"><Settings2 size={24} /></div>
                        <div>
                           <h3 className="text-xl font-black text-[#1A1F36] tracking-tighter">{editingTemplate ? t.editTitle : t.createTitle}</h3>
                           <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Configuration structurelle temps de travail</p>
                        </div>
                     </div>
                     {/* Added comment: correct reference to X icon */}
                     <button onClick={() => { setIsAdding(false); setEditingTemplate(null); }} className="p-3 bg-white hover:bg-gray-100 rounded-full text-gray-400 transition-all"><X size={24} /></button>
                  </header>

                  <div className="p-10 space-y-10 text-start">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom du Gabarit</label>
                        <input
                           type="text"
                           placeholder="Ex: Bureau 44H / 5 Jours"
                           className="w-full p-4 bg-[#F7F9FC] border border-[#E3E8EE] rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secteur</label>
                           <select className="w-full p-4 bg-[#F7F9FC] border border-[#E3E8EE] rounded-2xl text-sm font-bold outline-none cursor-pointer">
                              <option value="non_agricole">Non Agricole (44h)</option>
                              <option value="agricole">Agricole</option>
                           </select>
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jours / Semaine</label>
                           <select className="w-full p-4 bg-[#F7F9FC] border border-[#E3E8EE] rounded-2xl text-sm font-bold outline-none cursor-pointer">
                              <option value="5">5 Jours</option>
                              <option value="6">6 Jours</option>
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100 text-center">
                           <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Hebdomadaire</p>
                           <p className="text-xl font-black text-[#0078D4]">44h</p>
                        </div>
                        <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100 text-center">
                           <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Quotidien Est.</p>
                           <p className="text-xl font-black text-[#0078D4]">8.8h</p>
                        </div>
                        <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100 text-center col-span-2 md:col-span-1">
                           <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Ref Mensuelle</p>
                           <p className="text-xl font-black text-[#0078D4]">191h</p>
                        </div>
                     </div>

                     <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-start gap-4">
                        <ShieldCheck size={20} className="text-emerald-500 mt-0.5" />
                        <p className="text-[10px] text-emerald-800 font-bold leading-relaxed italic">
                           Ce gabarit respecte le Code du Travail (Article 184). Le seuil des heures sup est automatiquement fixé à 44h.
                        </p>
                     </div>

                     <button className="w-full py-6 btn-primary-gradient text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
                        <CheckCircle2 size={24} /> {t.save}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

const StatCard = ({ label, value, sub, icon, color }: any) => (
   <div className="airbnb-card p-6 bg-white border-[#E5E7EB] text-start flex flex-col justify-between h-40 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
         <div className={`p-3 bg-gray-50 rounded-2xl ${color} shadow-inner`}>{icon}</div>
      </div>
      <div>
         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
         <p className={`text-2xl font-black text-[#1A1F36] tracking-tighter`}>{value}</p>
         <p className="text-[8px] font-bold text-[#6B7280]">{sub}</p>
      </div>
   </div>
);

const RiskItem = ({ level, label, desc }: any) => (
   <div className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-2xl group hover:bg-white transition-all border border-transparent hover:border-blue-100">
      <div className="flex items-center gap-4 text-start">
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${level === 'HIGH' ? 'bg-rose-50 border-rose-100 text-rose-500' :
            level === 'MEDIUM' ? 'bg-amber-50 border-amber-100 text-amber-500' :
               'bg-emerald-50 border-emerald-100 text-emerald-500'
            }`}>
            {/* Added comment: correct reference to ShieldAlert icon */}
            <ShieldAlert size={18} />
         </div>
         <div>
            <h5 className="font-black text-xs text-[#1A1F36] uppercase">{label}</h5>
            <p className="text-[10px] font-bold text-gray-400 leading-tight">{desc}</p>
         </div>
      </div>
      <ArrowRight size={16} className="text-gray-300 group-hover:text-[#111827] transition-all" />
   </div>
);

const TabBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
   <button onClick={onClick} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-white shadow-md text-[#0078D4]' : 'text-gray-400 hover:text-gray-600'}`}>
      {icon} {label}
   </button>
);

export default WorkTimeManager;
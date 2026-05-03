import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, Plus, MapPin, Search, ChevronRight, LayoutGrid, 
  BarChart4, Users, Clock, ShieldCheck, Zap, X, Save, 
  Trash2, Edit3, Landmark, MoreHorizontal, TrendingUp,
  AlertTriangle, BadgeCheck, Timer, Activity, ArrowRight,
  ArrowLeft, FileText, Target, PieChart, Wallet, ShieldAlert,
  ArrowUpRight, List, Grid, CheckCircle2, Info, RefreshCw,
  Power, Globe, Calendar
} from 'lucide-react';
import { Site, Employee, Language, AuthUser, SiteType, PayrollResult, AttendanceRecord, SitePrime } from '../types';
import { getSites, createSite, calculateSiteCost, assignEmployeeToSite, getSitePrimes, toggleSitePrime } from '../services/siteService';
import { PRIME_CATEGORIES } from '../services/primeEngine';

interface Props {
  employees: Employee[];
  lang: Language;
  user: AuthUser;
}

type SiteTab = 'general' | 'personnel' | 'attendance' | 'primes' | 'finance';

const SiteManager: React.FC<Props> = ({ employees, lang, user }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [activeSiteTab, setActiveSiteTab] = useState<SiteTab>('general');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [sitePrimes, setSitePrimes] = useState<SitePrime[]>([]);
  const [confirmDeactivation, setConfirmDeactivation] = useState<{siteId: string, catId: string} | null>(null);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    type: 'chantier',
    city: '',
    address: '',
    budget: 0,
    workTemplateId: 'TPL-44H-6D',
    autoPrimes: true // Flag pour le toggle
  });

  useEffect(() => {
    setSites(getSites());
  }, []);

  useEffect(() => {
    if (selectedSite) {
      setSitePrimes(getSitePrimes(selectedSite.id));
    }
  }, [selectedSite]);

  const t = {
    fr: {
      title: "Sovereign Site Control",
      sub: "Gouvernance opérationnelle des chantiers et succursales.",
      btnNew: "OUVRIR UN SITE",
      general: "Infos Générales",
      team: "Personnel",
      attendance: "Pointage",
      finance: "Finance",
      primes: "Primes Site",
      stats: ["Sites Actifs", "Effectif Global", "Budget Total", "Conformité"],
      modalTitle: "Nouvel Actif Opérationnel",
      modalSub: "Définissez la structure opérationnelle et budgétaire.",
      fields: { name: "Nom du Site", type: "Type d'exploitation", city: "Ville", budget: "Budget RH (Mensuel)", address: "Localisation", template: "Gabarit Temps" },
      types: { chantier: "Chantier BTP", agence: "Agence", bureau: "Bureau", projet: "Mission" },
      primeConfirm: "Cette action arrêtera l'application de cette prime à partir du prochain cycle de paie.",
      saveBtn: "ENREGISTRER LES MODIFICATIONS"
    },
    ar: {
      title: "إدارة المواقع السيادية",
      sub: "التحكم التشغيلي في الأوراش والفروع.",
      btnNew: "فتح موقع جديد",
      general: "معلومات عامة",
      team: "الموظفين",
      attendance: "تسجيل الحضور",
      finance: "المالية",
      primes: "التعويضات",
      stats: ["المواقع النشطة", "إجمالي الموظفين", "إجمالي الميزانية", "الامتثال"],
      modalTitle: "فتح موقع تشغيلي جديد",
      modalSub: "حدد الهيكل التشغيلي والميزانية.",
      fields: { name: "اسم الموقع", type: "نوع الاستغلال", city: "المدينة", budget: "ميزانية RH", address: "الموقع الجغرافي", template: "قالب الوقت" },
      types: { chantier: "ورش بناء", agence: "وكالة", bureau: "مكتب", projet: "مهمة" }
    }
  }[lang === 'ar' ? 'ar' : 'fr'];

  const globalMetrics = useMemo(() => {
    return {
      activeCount: sites.length,
      totalStaff: employees.length,
      totalBudget: sites.reduce((acc, s) => acc + (s.budget || 0), 0),
      avgCompliance: 98
    };
  }, [sites, employees]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newSite = createSite(formData, user.role);
      setSites([...sites, newSite]);
      setShowForm(false);
      // Reset
      setFormData({ name: '', type: 'chantier', city: '', address: '', budget: 0, workTemplateId: 'TPL-44H-6D', autoPrimes: true });
    } catch (error: any) {
      alert(error.message || "Erreur lors de la création du site.");
    }
  };

  const handleTogglePrime = (siteId: string, categoryId: string, currentStatus: boolean) => {
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'DIRECTEUR_RH') return;
    if (currentStatus) setConfirmDeactivation({ siteId, catId: categoryId });
    else {
      toggleSitePrime(siteId, categoryId, true, user.id);
      setSitePrimes(getSitePrimes(siteId));
    }
  };

  const confirmToggle = () => {
    if (confirmDeactivation) {
      toggleSitePrime(confirmDeactivation.siteId, confirmDeactivation.catId, false, user.id);
      setSitePrimes(getSitePrimes(confirmDeactivation.siteId));
      setConfirmDeactivation(null);
    }
  };

  const filteredSites = sites.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedSite) {
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 pb-10 text-start overflow-hidden">
         {/* COMPACT SITE HEADER */}
         <div className="bg-white border-b border-[#E5E7EB] p-6 shrink-0 shadow-sm rounded-t-[24px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="flex items-center gap-5">
                  <button onClick={() => setSelectedSite(null)} className="p-2.5 bg-gray-50 border border-[#E5E7EB] rounded-xl hover:bg-gray-100 transition-all">
                     <ArrowLeft size={18} className="text-[#1A1F36]" />
                  </button>
                  <div className="space-y-1">
                     <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-[#1A1F36] tracking-tighter leading-none">{selectedSite.name}</h2>
                        <span className="px-2 py-0.5 bg-blue-50 text-[#0078D4] border border-blue-100 rounded text-[9px] font-black uppercase tracking-widest">{selectedSite.code}</span>
                        <div className={`w-2 h-2 rounded-full ${selectedSite.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'} shadow-[0_0_8px_currentColor]`}></div>
                     </div>
                     <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><MapPin size={12} className="text-[#0078D4]"/> {selectedSite.city}</span>
                        <span className="flex items-center gap-1.5"><Calendar size={12} className="text-[#0078D4]"/> Ouvert: {new Date(selectedSite.startDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><Wallet size={12} className="text-emerald-500"/> Budget: {selectedSite.budget.toLocaleString()} MAD</span>
                     </div>
                  </div>
               </div>
               <div className="flex gap-2 shrink-0">
                  <button className="px-4 py-2 bg-[#F9FAFB] border border-[#E5E7EB] text-gray-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all shadow-sm">
                     <Edit3 size={14}/> MODIFIER
                  </button>
                  <button className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-100 transition-all shadow-sm">
                     <ShieldAlert size={14}/> SUSPENDRE
                  </button>
               </div>
            </div>

            <nav className="flex gap-1 bg-[#F7F9FC] p-1 rounded-xl border border-[#E5E7EB] mt-6 w-fit shadow-inner">
               <TabButtonSmall active={activeSiteTab === 'general'} onClick={() => setActiveSiteTab('general')} label={t.general} icon={<Info size={12}/>} />
               <TabButtonSmall active={activeSiteTab === 'personnel'} onClick={() => setActiveSiteTab('personnel')} label={t.team} icon={<Users size={12}/>} />
               <TabButtonSmall active={activeSiteTab === 'attendance'} onClick={() => setActiveSiteTab('attendance')} label={t.attendance} icon={<Timer size={12}/>} />
               <TabButtonSmall active={activeSiteTab === 'primes'} onClick={() => setActiveSiteTab('primes')} label={t.primes} icon={<Zap size={12}/>} />
               <TabButtonSmall active={activeSiteTab === 'finance'} onClick={() => setActiveSiteTab('finance')} label={t.finance} icon={<Wallet size={12}/>} />
            </nav>
         </div>

         <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scroll bg-[#F5F7FA]">
            <div className="max-w-6xl mx-auto">
               {activeSiteTab === 'general' && (
                 <div className="animate-in fade-in duration-300 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="airbnb-card p-8 bg-white border-[#E5E7EB] space-y-8">
                          <SectionTitleSmall icon={<Info size={14}/>} label="Détails Structurels" />
                          <div className="grid grid-cols-1 gap-6">
                             <StructuralField label={t.fields.name} val={selectedSite.name} />
                             <StructuralField label={t.fields.type} val={t.types[selectedSite.type]} isTag />
                             <StructuralField label={t.fields.city} val={selectedSite.city} />
                             <StructuralField label={t.fields.template} val={selectedSite.workTemplateId} isTag />
                          </div>
                       </div>
                       
                       <div className="airbnb-card p-8 bg-white border-[#E5E7EB] space-y-8">
                          <SectionTitleSmall icon={<MapPin size={14}/>} label="Localisation & Logistique" />
                          <div className="grid grid-cols-1 gap-6">
                             <StructuralField label={t.fields.address} val={selectedSite.address} />
                             <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                <div className="text-start">
                                   <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Coordonnées GPS</p>
                                   <p className="text-xs font-bold text-[#0078D4]">{selectedSite.lat.toFixed(4)}, {selectedSite.lng.toFixed(4)}</p>
                                </div>
                                <Globe size={24} className="text-[#0078D4] opacity-20" />
                             </div>
                             <StructuralField label="Rayon de Pointage" val={`${selectedSite.radius}m`} />
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {activeSiteTab === 'primes' && (
                 <div className="animate-in fade-in duration-300 space-y-6">
                    <div className="airbnb-card bg-white p-8 border-[#E5E7EB] shadow-sm">
                       <SectionTitleSmall icon={<Zap size={14}/>} label="Contrôle des Primes Site" />
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          {PRIME_CATEGORIES.filter(c => ['PC_TRANS_HORS', 'PC_PANIER', 'PC_TOURNEE', 'PC_TRANS_VILLE'].includes(c.id)).map(cat => {
                             const sitePrime = sitePrimes.find(p => p.primeCategoryId === cat.id);
                             const isActive = sitePrime?.is_active || false;
                             return (
                                <div key={cat.id} className="p-5 bg-gray-50 rounded-[20px] border border-gray-100 flex items-center justify-between group hover:border-[#0078D4] transition-all">
                                   <div className="text-start space-y-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                         <h4 className="font-black text-xs text-[#1A1F36] truncate">{cat.name}</h4>
                                         <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase shrink-0 ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {isActive ? 'Active' : 'Off'}
                                         </span>
                                      </div>
                                      <p className="text-[9px] text-gray-400 font-bold uppercase truncate">{cat.description}</p>
                                   </div>
                                   <button 
                                      onClick={() => handleTogglePrime(selectedSite.id, cat.id, isActive)}
                                      className={`w-12 h-6 rounded-full p-1 transition-all flex items-center shrink-0 ${isActive ? 'bg-[#34C759]' : 'bg-gray-300'}`}
                                   >
                                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                   </button>
                                </div>
                             );
                          })}
                       </div>
                    </div>
                 </div>
               )}

               {['personnel', 'attendance', 'finance'].includes(activeSiteTab) && (
                 <div className="py-24 text-center space-y-4 bg-white border border-gray-100 rounded-[32px] shadow-sm">
                    <RefreshCw className="mx-auto text-blue-100 animate-spin" size={48} />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initialisation de l'analyse {activeSiteTab}...</p>
                 </div>
               )}
            </div>
         </div>

         {/* STICKY SAVE BUTTON */}
         <div className="bg-white/80 backdrop-blur-md border-t border-[#E5E7EB] p-4 flex justify-end gap-4 shrink-0 px-10">
            <button 
              onClick={() => setSelectedSite(null)}
              className="px-8 py-3.5 bg-white border border-[#E5E7EB] text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-[#1A1F36] transition-all"
            >
              ANNULER
            </button>
            <button className="px-10 py-3.5 btn-primary-gradient text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center gap-3">
               <Save size={16}/> {t.saveBtn}
            </button>
         </div>

         {confirmDeactivation && (
            <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
               <div className="bg-white p-10 rounded-[40px] shadow-3xl max-w-sm text-center space-y-6 border border-rose-100 animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                     <ShieldAlert size={32}/>
                  </div>
                  <h3 className="text-xl font-black text-[#1A1F36]">Confirmation requis</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tight leading-relaxed">{t.primeConfirm}</p>
                  <div className="flex gap-3">
                     <button onClick={() => setConfirmDeactivation(null)} className="flex-1 py-3.5 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">ANNULER</button>
                     <button onClick={confirmToggle} className="flex-1 py-3.5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200">CONFIRMER</button>
                  </div>
               </div>
            </div>
         )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 text-start h-full flex flex-col no-scrollbar" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* GLOBAL STATS - COMPACT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
         <MetricCardMini label={t.stats[0]} value={globalMetrics.activeCount} icon={<Building2 size={16}/>} color="text-[#1A1F36]" />
         <MetricCardMini label={t.stats[1]} value={globalMetrics.totalStaff} icon={<Users size={16}/>} color="text-[#0078D4]" />
         <MetricCardMini label={t.stats[2]} value={globalMetrics.totalBudget.toLocaleString()} unit="DH" icon={<Wallet size={16}/>} color="text-emerald-500" />
         <MetricCardMini label={t.stats[3]} value={`${globalMetrics.avgCompliance}%`} icon={<ShieldCheck size={16}/>} color="text-blue-600" />
      </div>

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#1A1F36] tracking-tighter">{t.title}</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t.sub}</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
           <div className="flex bg-[#F7F9FC] p-1 rounded-xl border border-[#E5E7EB] shrink-0">
              <button onClick={() => setDisplayMode('grid')} className={`p-2 rounded-lg transition-all ${displayMode === 'grid' ? 'bg-white shadow-sm text-[#0078D4]' : 'text-gray-400'}`}><Grid size={16}/></button>
              <button onClick={() => setDisplayMode('list')} className={`p-2 rounded-lg transition-all ${displayMode === 'list' ? 'bg-white shadow-sm text-[#0078D4]' : 'text-gray-400'}`}><List size={16}/></button>
           </div>
           <button 
             onClick={() => { setShowForm(true); setFormData({ ...formData, name: '', city: '', address: '', budget: 0 }); }}
             className="flex-1 md:flex-none btn-primary-gradient px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
           >
             <Plus size={16}/> {t.btnNew}
           </button>
        </div>
      </header>

      <div className="relative group max-w-lg shrink-0">
        <Search className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0078D4]`} size={16} />
        <input 
          type="text" 
          placeholder={lang === 'ar' ? 'بحث...' : 'Chercher site, ville, code...'}
          className={`w-full ${lang === 'ar' ? 'pr-12 pl-6' : 'pl-12 pr-6'} py-3 bg-white border border-[#E5E7EB] rounded-2xl text-xs font-bold outline-none shadow-sm transition-all`}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scroll pr-2 -mr-2">
        {displayMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSites.map(site => {
              const siteStaff = employees.filter(e => e.assignedSite === site.name).length;
              return (
                <div key={site.id} onClick={() => setSelectedSite(site)} className="airbnb-card p-8 bg-white border-[#E5E7EB] hover:border-[#0078D4] transition-all group flex flex-col justify-between cursor-pointer">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                        <div className={`p-3 rounded-xl ${site.type === 'chantier' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} shadow-inner border ${site.type === 'chantier' ? 'border-amber-100' : 'border-blue-100'}`}>
                          <Landmark size={20} />
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase border ${site.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400'}`}>
                          {site.status}
                        </span>
                    </div>
                    
                    <div className="text-start">
                        <h3 className="text-lg font-black text-[#1A1F36] tracking-tight truncate leading-tight">{site.name}</h3>
                        <div className="flex items-center gap-1.5 text-gray-400 mt-1">
                          <MapPin size={10}/>
                          <p className="text-[10px] font-bold truncate">{site.city} • {site.address}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-[#F9FAFB] rounded-xl text-start border border-gray-50">
                          <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Budget</p>
                          <p className="text-sm font-black text-[#1A1F36]">{site.budget.toLocaleString()} <span className="text-[8px] text-gray-400">DH</span></p>
                        </div>
                        <div className="p-3 bg-[#F9FAFB] rounded-xl text-start border border-gray-50">
                          <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Effectif</p>
                          <p className="text-sm font-black text-[#0078D4]">{siteStaff}</p>
                        </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-600 uppercase">SDEI Certified</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-[#0078D4] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="airbnb-card bg-white border-[#E5E7EB] shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-[#F7F9FC] border-b">
                  <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="p-4">Site / Exploitation</th>
                      <th className="p-4">Ville</th>
                      <th className="p-4 text-right">Budget (DH)</th>
                      <th className="p-4 text-center">Effectif</th>
                      <th className="p-4 text-center">Statut</th>
                      <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[11px]">
                  {filteredSites.map(site => (
                    <tr key={site.id} onClick={() => setSelectedSite(site)} className="hover:bg-blue-50/10 cursor-pointer group transition-all">
                        <td className="p-4">
                          <div className="text-start">
                              <p className="font-bold text-[#1A1F36]">{site.name}</p>
                              <p className="text-[8px] font-black text-[#0078D4] uppercase tracking-tighter">{site.code}</p>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-gray-500">{site.city}</td>
                        <td className="p-4 text-right font-black text-[#1A1F36]">{site.budget.toLocaleString()}</td>
                        <td className="p-4 text-center font-black text-[#0078D4]">{employees.filter(e => e.assignedSite === site.name).length}</td>
                        <td className="p-4 text-center">
                          <div className={`w-2 h-2 rounded-full mx-auto ${site.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                        </td>
                        <td className="p-4 text-right"><ChevronRight size={16} className="text-gray-300 group-hover:text-[#1A1F36]"/></td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in duration-300 relative border border-gray-100">
              <header className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30 text-start">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-[#0078D4] rounded-xl flex items-center justify-center shadow-inner"><Plus size={20}/></div>
                    <div>
                       <h3 className="text-lg font-black text-[#1A1F36] tracking-tight leading-none">{t.modalTitle}</h3>
                       <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mt-1">{t.modalSub}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowForm(false)} className="p-2 bg-white hover:bg-gray-100 rounded-full text-gray-400 transition-all shadow-sm"><X size={20}/></button>
              </header>

              <form onSubmit={handleCreate} className="p-8 space-y-5 text-start">
                 <div className="grid grid-cols-2 gap-5">
                    <FormInputCompact label={t.fields.name} value={formData.name} onChange={(v: string) => setFormData({...formData, name: v})} required placeholder="Ex: Casa Finance II" />
                    <FormSelectCompact 
                      label={t.fields.type} 
                      value={formData.type} 
                      onChange={(v: string) => setFormData({...formData, type: v as SiteType})} 
                      options={Object.entries(t.types).map(([k,v]) => ({v:k, l:v}))} 
                      info={formData.type === 'chantier' ? "Active auto. primes panier/transport hors-ville" : undefined}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-5">
                    <FormInputCompact label={t.fields.city} value={formData.city} onChange={(v: string) => setFormData({...formData, city: v})} required placeholder="Casablanca" />
                    <FormInputCompact label={t.fields.budget} type="number" value={formData.budget} onChange={(v: string) => setFormData({...formData, budget: Number(v)})} placeholder="0.00" />
                 </div>

                 <FormInputCompact label={t.fields.address} value={formData.address} onChange={(v: string) => setFormData({...formData, address: v})} placeholder="Numéro, Rue, Quartier..." />

                 <div className="grid grid-cols-2 gap-5">
                    <FormInputCompact label="Date d'ouverture" type="date" value={formData.startDate} onChange={(v: string) => setFormData({...formData, startDate: v})} />
                    <FormSelectCompact 
                       label={t.fields.template} 
                       value={formData.workTemplateId} 
                       onChange={(v: string) => setFormData({...formData, workTemplateId: v})} 
                       options={[{v:'TPL-44H-6D', l:'STANDARD 44H/6J'}, {v:'TPL-44H-5D', l:'STANDARD 44H/5J'}]} 
                    />
                 </div>

                 <div className="p-4 bg-[#F0F7FF] rounded-2xl border border-blue-50 flex items-center justify-between mt-2">
                    <div className="text-start">
                       <p className="text-[10px] font-black text-[#1A1F36] uppercase tracking-tight">Primes automatiques</p>
                       <p className="text-[8px] font-bold text-gray-400">Appliquer les gains sectoriels par défaut</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFormData((prev: any) => ({ ...prev, autoPrimes: !prev.autoPrimes }))}
                      className={`w-10 h-5 rounded-full p-1 transition-all flex items-center ${formData.autoPrimes ? 'bg-[#0078D4] justify-end' : 'bg-gray-300 justify-start'}`}
                    >
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </button>
                 </div>

                 <button type="submit" className="w-full mt-4 py-4 btn-primary-gradient text-white rounded-[20px] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                    <Save size={18}/> CONFIRMER OUVERTURE SITE
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

const MetricCardMini = ({ label, value, unit, icon, color }: any) => (
  <div className="airbnb-card p-4 bg-white border-[#E5E7EB] text-start flex items-center gap-4 hover:shadow-md transition-all">
     <div className={`p-2.5 bg-gray-50 rounded-xl ${color} shadow-inner shrink-0`}>{icon}</div>
     <div className="min-w-0">
        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <div className="flex items-baseline gap-0.5 leading-none">
           <p className={`text-base font-black ${color} tracking-tighter truncate`}>{value}</p>
           {unit && <span className="text-[8px] font-black text-gray-300">{unit}</span>}
        </div>
     </div>
  </div>
);

const TabButtonSmall = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${active ? 'bg-white shadow-sm text-[#0078D4]' : 'text-gray-400 hover:text-[#1A1F36]'}`}>
     {icon} {label}
  </button>
);

const SectionTitleSmall = ({ icon, label }: any) => (
  <div className="flex items-center gap-2 border-b border-gray-50 pb-2 mb-4">
     <div className="text-[#0078D4]">{icon}</div>
     <h4 className="text-[10px] font-black text-[#1A1F36] uppercase tracking-[0.2em]">{label}</h4>
  </div>
);

const StructuralField = ({ label, val, isTag }: any) => (
  <div className="flex flex-col text-start gap-1">
     <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">{label}</span>
     {isTag ? (
       <span className="px-2 py-0.5 bg-blue-50 text-[#0078D4] border border-blue-100 rounded-md text-[9px] font-black uppercase w-fit">{val}</span>
     ) : (
       <span className="text-sm font-bold text-[#1A1F36] break-all">{val}</span>
     )}
  </div>
);

const FormInputCompact = ({ label, value, onChange, type = "text", required, placeholder }: any) => (
  <div className="space-y-1.5">
     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
     <input 
       required={required}
       type={type} value={value} onChange={e => onChange(e.target.value)} 
       placeholder={placeholder}
       className="w-full px-4 h-11 bg-[#F7F9FC] border border-[#E3E8EE] rounded-xl text-xs font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all shadow-inner placeholder-gray-300"
     />
  </div>
);

const FormSelectCompact = ({ label, value, onChange, options, info }: any) => (
  <div className="space-y-1.5">
     <div className="flex items-center gap-1.5 ml-1">
        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
        {info && (
          <div className="group relative">
             <Info size={10} className="text-blue-400 cursor-help" />
             <div className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-[#1A1F36] text-white text-[9px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[50] leading-relaxed shadow-2xl border border-white/10">
                {info}
             </div>
          </div>
        )}
     </div>
     <select 
       value={value} onChange={e => onChange(e.target.value)}
       className="w-full px-4 h-11 bg-[#F7F9FC] border border-[#E3E8EE] rounded-xl text-xs font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all cursor-pointer shadow-inner"
     >
        {options.map((opt: any) => <option key={opt.v} value={opt.v}>{opt.l}</option>)}
     </select>
  </div>
);

export default SiteManager;
import React, { useState, useMemo } from 'react';
import { 
  Users, BarChart3, TrendingUp, ShieldCheck, Globe2, Landmark, 
  RefreshCw, BadgeCheck, Network, Layers, Award, Heart, Shield, Blocks,
  // Fix: Add missing Fingerprint icon import
  Fingerprint
} from 'lucide-react';
import { Employee, Language, AuthUser } from '../types';
import { getHRMetrics, getContinentalPresence, getRetirementReadiness } from '../services/godModeEngine';

interface Props {
  employees: Employee[];
  lang: Language;
  user: AuthUser;
}

const AnalyticsCenter: React.FC<Props> = ({ employees, lang, user }) => {
  const [activeTab, setActiveTab] = useState<'hr' | 'continental' | 'pension'>('hr');
  const hrMetrics = useMemo(() => getHRMetrics(employees), [employees]);
  const presence = useMemo(() => getContinentalPresence(), []);
  const retirement = useMemo(() => getRetirementReadiness(employees), [employees]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-[#111827] rounded-lg flex items-center justify-center text-[#34C759] shadow-xl border border-white/10 shrink-0">
               <Globe2 size={32} />
            </div>
            <div className="text-start">
               <h2 className="text-3xl font-black text-[#111827] tracking-tighter">Executive Studio V23</h2>
               <p className="text-gray-400 font-medium text-xs uppercase tracking-widest mt-1 flex items-center gap-2">
                 <BadgeCheck size={14} className="text-[#0078D4]"/> SOVEREIGN_LABOR_OS_CORE
               </p>
            </div>
         </div>
         <div className="flex bg-white p-1 rounded-[10px] border border-[#E5E7EB] shadow-sm">
            <TabBtn active={activeTab === 'hr'} onClick={() => setActiveTab('hr')} icon={<Users size={12}/>} label="HR Metrics" />
            <TabBtn active={activeTab === 'continental'} onClick={() => setActiveTab('continental')} icon={<Globe2 size={12}/>} label="Continental Hub" />
            <TabBtn active={activeTab === 'pension'} onClick={() => setActiveTab('pension')} icon={<Landmark size={12}/>} label="Retirement Hub" />
         </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <MetricCard label="Global HC" value={hrMetrics.totalEmployees.toString()} color="text-[#0078D4]" icon={<Users size={20}/>} />
         <MetricCard label="Continental Score" value="84/100" color="text-[#34C759]" icon={<Award size={20}/>} />
         <MetricCard label="Aging Index" value="34.2 yrs" color="text-[#111827]" icon={<Heart size={20}/>} />
         <MetricCard label="Trust Score" value="99.2%" color="text-[#00A99D]" icon={<ShieldCheck size={20}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 airbnb-card p-10 bg-white border-[#E5E7EB]">
            <h3 className="text-xl font-black text-[#111827] mb-8 tracking-tight">Workforce Distribution</h3>
            <div className="space-y-6">
               {presence.map((p, i) => (
                 <div key={i}>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-sm font-bold text-[#111827]">{p.country}</span>
                       <span className="text-[10px] font-black text-gray-400 uppercase">{p.employees} staff</span>
                    </div>
                    <div className="h-2 bg-[#F5F7FA] rounded-full overflow-hidden border border-[#E5E7EB]">
                       <div className="h-full btn-primary-gradient" style={{ width: `${(p.employees / 1000) * 100}%` }}></div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="lg:col-span-4 airbnb-card p-10 bg-white border-[#E5E7EB] space-y-8">
            <h3 className="text-xl font-black text-[#111827] tracking-tight">Identity Mesh</h3>
            <div className="p-6 bg-[#F5F7FA] rounded-lg border border-[#E5E7EB] text-center space-y-4">
               {/* Fix: Fingerprint icon is now imported from lucide-react */}
               <Fingerprint size={48} className="mx-auto text-[#0078D4] opacity-20" />
               <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-relaxed">Identity mobility graph is anchored to national workforce ledger.</p>
               <button className="w-full py-3 btn-secondary text-[10px] font-black uppercase tracking-widest">EXPLORE LEDGER</button>
            </div>
         </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, color, icon }: any) => (
  <div className="airbnb-card p-6 bg-white border-[#E5E7EB] text-start">
     <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#F5F7FA] flex items-center justify-center border border-[#E5E7EB] text-[#6B7280]">{icon}</div>
     </div>
     <p className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest mb-1">{label}</p>
     <h4 className={`text-3xl font-black ${color} tracking-tighter`}>{value}</h4>
  </div>
);

const TabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`px-6 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-[#0078D4] text-white shadow-md' : 'text-[#6B7280]'}`}>
     {icon} {label}
  </button>
);

export default AnalyticsCenter;
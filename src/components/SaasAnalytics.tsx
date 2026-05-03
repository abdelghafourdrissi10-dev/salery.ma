import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, PieChart, 
  BarChart3, ArrowUpRight, ArrowDownRight, Info, Calendar,
  Activity, RefreshCcw, Layers, CreditCard, ShieldCheck, Target, 
  ArrowRight, Landmark
} from 'lucide-react';
import { calculateSaaSAnalytics } from '../services/analyticsService';
import { Language, SaaSAnalyticsData, PlanType } from '../types';

interface Props {
  lang: Language;
}

const SaasAnalytics: React.FC<Props> = ({ lang }) => {
  const [data, setData] = useState<SaaSAnalyticsData>(calculateSaaSAnalytics());

  const formatDH = (val: number) => {
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-MA' : lang === 'ar' ? 'ar-MA' : 'en-US', {
      style: 'currency',
      currency: 'MAD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const t = {
    fr: {
      title: "Indicateurs SaaS",
      mrr: "MRR (Mensuel)",
      arr: "ARR (Annuel)",
      netNew: "Net New MRR",
      churn: "Taux de Churn",
      retention: "Rétention",
      arpa: "ARPA Moyen",
      active: "Abonnements",
      breakdown: "Bridge MRR",
      newMrr: "Nouveau",
      expMrr: "Expansion",
      contMrr: "Contraction",
      churnMrr: "Churn",
      plans: "Segmentation Offres",
      planName: "Plan",
      revShare: "Part Revenu",
      count: "Comptes",
      last30: "Derniers 30 jours",
      refresh: "Actualiser",
      syncMsg: "Synchronisé via Stripe Billing • Nov 2025",
      normalizationNote: "Les plans annuels sont normalisés (Prix / 12) selon les standards SaaS IFRS.",
      growth: "Croissance"
    },
    en: {
      title: "SaaS Metrics",
      mrr: "MRR (Monthly)",
      arr: "ARR (Annual)",
      netNew: "Net New MRR",
      churn: "Churn Rate",
      retention: "Retention",
      arpa: "ARPA (Avg)",
      active: "Subscriptions",
      breakdown: "MRR Bridge",
      newMrr: "New",
      expMrr: "Expansion",
      contMrr: "Contraction",
      churnMrr: "Churn",
      plans: "Plan Segmentation",
      planName: "Plan",
      revShare: "Revenue Share",
      count: "Accounts",
      last30: "Last 30 days",
      refresh: "Refresh",
      syncMsg: "Synced via Stripe Billing • Nov 2025",
      normalizationNote: "Annual plans are normalized (Price / 12) as per SaaS IFRS standards.",
      growth: "Growth"
    },
    ar: {
      title: "إحصائيات SaaS",
      mrr: "MRR (شهري)",
      arr: "ARR (سنوي)",
      netNew: "صافي MRR الجديد",
      churn: "معدل الإلغاء",
      retention: "الاحتفاظ",
      arpa: "متوسط ARPA",
      active: "الاشتراكات",
      breakdown: "مخطط MRR",
      newMrr: "جديد",
      expMrr: "توسع",
      contMrr: "تقلص",
      churnMrr: "إلغاء",
      plans: "تقسيم العروض",
      planName: "العرض",
      revShare: "نسبة الإيرادات",
      count: "الحسابات",
      last30: "آخر 30 يومًا",
      refresh: "تحديث",
      syncMsg: "تمت المزامنة عبر Stripe • نونبر 2025",
      normalizationNote: "يتم تسوية الخطط السنوية (السعر / 12) وفقًا لمعايير IFRS.",
      growth: "النمو"
    }
  }[lang];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto px-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="text-start">
          <h2 className="text-3xl font-black text-[#222222] tracking-tighter">{t.title}</h2>
          <p className="text-gray-400 font-medium text-sm flex items-center gap-2 mt-1">
            <ShieldCheck size={16} className="text-emerald-500" /> {t.syncMsg}
          </p>
        </div>
        <button 
          onClick={() => setData(calculateSaaSAnalytics())}
          className="flex items-center gap-2 px-8 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#222222] hover:bg-white transition-all shadow-sm active:scale-95"
        >
          <RefreshCcw size={14} className="text-[#0052FF]" /> {t.refresh}
        </button>
      </header>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard title={t.mrr} value={formatDH(data.mrr.total)} delta={12.5} icon={<Landmark className="text-emerald-500" />} />
        <KpiCard title={t.arr} value={formatDH(data.arr.total)} delta={8.2} icon={<TrendingUp className="text-blue-500" />} />
        <KpiCard title={t.netNew} value={formatDH(data.mrr.netNew)} delta={-2.1} icon={<Activity className="text-[#0052FF]" />} deltaType={data.mrr.netNew >= 0 ? 'pos' : 'neg'} />
        <KpiCard title={t.churn} value={`${data.kpis.churnRate.toFixed(1)}%`} delta={-0.4} icon={<ArrowDownRight className="text-rose-500" />} deltaType="neg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* MRR Bridge Chart */}
        <div className="lg:col-span-8 airbnb-card bg-white/80 backdrop-blur-sm border-white/30 p-8 md:p-10 shadow-sm flex flex-col min-h-[480px]">
          <div className={`flex justify-between items-center mb-10 ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className="text-start">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.breakdown}</h3>
              <p className="text-xl font-black text-[#222222] tracking-tighter">{t.breakdown}</p>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50 backdrop-blur-md px-3 py-1 rounded-full">{t.last30}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <MovementCard label={t.newMrr} value={formatDH(data.mrr.new)} type="pos" />
            <MovementCard label={t.expMrr} value={formatDH(data.mrr.expansion)} type="pos" />
            <MovementCard label={t.contMrr} value={formatDH(data.mrr.contraction)} type="neg" />
            <MovementCard label={t.churnMrr} value={formatDH(data.mrr.churned)} type="neg" />
          </div>

          <div className="flex-1 flex items-end justify-between gap-3 md:gap-6 pt-10 border-t border-gray-100/20 relative">
            <div className="absolute inset-x-0 bottom-[15%] h-px bg-gray-100/10 pointer-events-none"></div>
            
            <Bar label="START" height="h-32" color="bg-gray-100/50 backdrop-blur-sm" />
            <Bar label={t.newMrr} height="h-48" color="bg-emerald-400/80 backdrop-blur-sm" />
            <Bar label={t.expMrr} height="h-24" color="bg-emerald-200/80 backdrop-blur-sm" />
            <Bar label={t.contMrr} height="h-16" color="bg-rose-200/80 backdrop-blur-sm" />
            <Bar label={t.churnMrr} height="h-28" color="bg-rose-400/80 backdrop-blur-sm" />
            <Bar label="END" height="h-56" color="bg-[#222222]/90 backdrop-blur-sm" isAccent />
          </div>
        </div>

        {/* Plan Distribution & Secondary Metrics */}
        <div className="lg:col-span-4 space-y-6">
          <div className="airbnb-card bg-[#222222]/90 backdrop-blur-sm text-white p-10 relative overflow-hidden shadow-2xl min-h-[320px] flex flex-col transition-all duration-200 hover:scale-[1.02]">
             <div className="absolute -right-8 -top-8 opacity-5 rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                <PieChart size={180} />
             </div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0052FF] mb-10">{t.plans}</h3>
             <div className="space-y-8 relative z-10 flex-1">
                {(Object.keys(data.planBreakdown) as PlanType[]).map(p => (
                  <div key={p} className="flex justify-between items-center group cursor-pointer hover:translate-x-1 transition-transform">
                    <div className="text-start space-y-1">
                       <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{p}</p>
                       <div className="flex items-baseline gap-2">
                          <p className="text-xl font-black text-white">{data.planBreakdown[p].count}</p>
                          <span className="text-[9px] text-gray-500 font-bold uppercase">{lang === 'ar' ? 'حساب' : 'accounts'}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-white">{data.planBreakdown[p].pct.toFixed(0)}%</p>
                       <div className="w-12 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-[#0052FF]" style={{ width: `${data.planBreakdown[p].pct}%` }}></div>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="airbnb-card bg-white/80 backdrop-blur-sm border-white/30 p-6 shadow-sm text-start transition-all duration-200 hover:scale-[1.02]">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.arpa}</p>
                <p className="text-xl font-black text-[#222222] tracking-tighter">{formatDH(data.kpis.arpa)}</p>
             </div>
             <div className="airbnb-card bg-white/80 backdrop-blur-sm border-white/30 p-6 shadow-sm text-start transition-all duration-200 hover:scale-[1.02]">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.active}</p>
                <p className="text-xl font-black text-[#222222] tracking-tighter">{data.kpis.activeCount}</p>
             </div>
          </div>

          <div className="p-6 bg-blue-50/50 backdrop-blur-sm rounded-[32px] border border-blue-100/30 flex items-start gap-4">
             <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
             <p className="text-[11px] text-blue-700 font-medium leading-relaxed italic text-start">
               {t.normalizationNote}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ title: string, value: string, delta: number, icon: React.ReactNode, deltaType?: 'pos' | 'neg' }> = ({ title, value, delta, icon, deltaType = 'pos' }) => (
  <div className="airbnb-card bg-white/80 backdrop-blur-sm border-white/30 p-8 shadow-sm flex flex-col justify-between h-40 hover:shadow-xl hover:border-blue-100/50 transition-all duration-200 hover:scale-[1.02] group">
    <div className="flex justify-between items-start">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</span>
      <div className="p-3 bg-gray-50/50 rounded-2xl group-hover:bg-blue-50/80 transition-colors">
        {icon}
      </div>
    </div>
    <div className="flex items-end justify-between">
      <p className="text-2xl md:text-3xl font-black text-[#222222] tracking-tighter leading-none">{value}</p>
      <div className={`flex items-center gap-1 text-[10px] font-black ${deltaType === 'pos' ? 'text-emerald-500' : 'text-[#0078D4]'}`}>
        {deltaType === 'pos' ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />} {Math.abs(delta)}%
      </div>
    </div>
  </div>
);

const MovementCard: React.FC<{ label: string, value: string, type: 'pos' | 'neg' }> = ({ label, value, type }) => (
  <div className={`p-4 rounded-2xl border backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-default ${type === 'pos' ? 'bg-emerald-50/50 border-emerald-100/30 text-emerald-900' : 'bg-rose-50/50 border-rose-100/30 text-rose-900'}`}>
    <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-1 opacity-70`}>{label}</p>
    <p className={`text-sm font-black tracking-tight`}>{type === 'pos' ? '+' : '-'}{value}</p>
  </div>
);

const Bar: React.FC<{ label: string, height: string, color: string, isAccent?: boolean }> = ({ label, height, color, isAccent }) => (
  <div className="flex-1 flex flex-col items-center gap-3 relative group">
    <div className={`w-full max-w-[48px] ${color} rounded-t-xl transition-all duration-700 ease-out hover:brightness-110 cursor-pointer ${height}`}></div>
    <span className={`text-[9px] font-black uppercase tracking-tighter ${isAccent ? 'text-[#0052FF]' : 'text-gray-300'}`}>{label}</span>
  </div>
);

export default SaasAnalytics;
import React, { useState, useMemo } from 'react';
import {
  Users, CreditCard, Calendar, Clock, TrendingUp, TrendingDown, AlertCircle,
  ArrowRight, ChevronRight, BarChart3, Bell, LayoutDashboard, CheckCircle2,
  PieChart, ArrowUpRight, Target, ShieldCheck, Timer, X, Printer,
  Landmark, Scale, FileText, BadgeCheck, Sparkles, BrainCircuit, Activity, Zap, RefreshCw,
  Info, Shield, User, Download, FileSpreadsheet, Plus, FileCheck, LogOut, History
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, PieChart as RechartsPie, Pie, Legend
} from 'recharts';
import {
  Employee, LeaveRequest, Language, AuthUser
} from '../types.ts';

interface Props {
  employees: Employee[];
  leaves: LeaveRequest[];
  lang: Language;
  user: AuthUser;
}

const Dashboard: React.FC<Props> = ({ employees, leaves, lang, user }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Find the current employee's data
  const myData = useMemo(() => {
    return employees.find(e =>
      (e.id && user.employeeId && e.id === user.employeeId) ||
      (e.email && user.email && e.email.toLowerCase() === user.email.toLowerCase())
    );
  }, [employees, user]);

  if (user.role === 'EMPLOYEE') {
    if (!myData) return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
        <AlertCircle size={48} className="text-[#0078D4] opacity-20" />
        <p className="text-[#334155] font-bold uppercase tracking-widest text-xs">Profil non lié.</p>
      </div>
    );

    return (
      <div className="min-h-screen bg-[#F4F7FA] text-[#1F2937] font-sans animate-in fade-in duration-300 pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* HEADER - Blue Gradient */}
        <header className="relative h-64 bg-gradient-to-r from-[#0A66C2] to-[#0078D4] rounded-b-[40px] shadow-lg overflow-hidden mb-20">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <BrainCircuit size={400} className="absolute -right-20 -top-20 rotate-12" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-10 flex flex-col md:flex-row items-center gap-8 translate-y-1/2">
            <div className="w-[120px] h-[120px] rounded-[32px] bg-white p-1 shadow-2xl border-4 border-white overflow-hidden shrink-0">
              {myData.photo ? (
                <img src={myData.photo} className="w-full h-full object-cover rounded-[28px]" />
              ) : (
                <div className="w-full h-full bg-blue-50 flex items-center justify-center text-[#0078D4]">
                  <User size={48} />
                </div>
              )}
            </div>
            <div className="text-center md:text-start space-y-1">
              <h1 className="text-3xl font-black text-white tracking-tighter">{myData.fullName}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <p className="text-white/80 font-bold text-sm">{myData.jobTitle}</p>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${myData.employmentStatus === 'active' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' : 'bg-rose-500/20 text-rose-100 border-rose-500/30'
                  }`}>
                  {myData.employmentStatus === 'active' ? 'ACTIF' : 'INACTIF'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 space-y-10">
          {/* SECTION 1 - PERSONAL INFO */}
          <section className="bg-white rounded-[32px] p-10 border border-[#E5E7EB] shadow-sm text-start">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                <User className="text-[#0078D4]" size={24} />
                MON DOSSIER PERSONNEL
              </h3>
              <button className="px-6 py-2.5 bg-gradient-to-r from-[#0A66C2] to-[#0078D4] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all">
                Modifier mes informations
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <ProfileField label="Nom complet" value={myData.fullName} />
              <ProfileField label="CIN" value={myData.cin} />
              <ProfileField label="Date de naissance" value={myData.birthDate || "---"} />
              <ProfileField label="Situation familiale" value={myData.familyStatus || "Célibataire"} />
              <ProfileField label="Numéro CNSS" value={myData.cnssNumber || "---"} />
              <ProfileField label="Poste" value={myData.jobTitle} />
              <ProfileField label="Type de contrat" value={myData.contractType} />
              <ProfileField label="Date début contrat" value={myData.hireDate} />
              <ProfileField label="Salaire de base" value={`${myData.baseSalary.toLocaleString()} MAD`} />
            </div>
          </section>

          {/* SECTION 2 - MY DOCUMENTS */}
          <section className="space-y-6 text-start">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-3 px-4">
              <FileText className="text-[#0078D4]" size={24} />
              MES DOCUMENTS
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <DocCard icon={<FileCheck size={24} />} label="Contrat" />
              <DocCard icon={<Shield size={24} />} label="CIN" />
              <DocCard icon={<Landmark size={24} />} label="RIB" />
              <DocCard icon={<BadgeCheck size={24} />} label="Diplôme" />
              <DocCard icon={<FileText size={24} />} label="CV" />
              <DocCard icon={<Plus size={24} />} label="Autres" />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* SECTION 4 - NOTIFICATIONS */}
            <section className="bg-white rounded-[32px] p-10 border border-[#E5E7EB] shadow-sm text-start">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-3 mb-8">
                <Bell className="text-[#0078D4]" size={24} />
                NOTIFICATIONS
              </h3>
              <div className="space-y-4">
                <NotificationItem title="Nouveau bulletin disponible" desc="Votre bulletin de paie de Janvier 2026 est prêt." time="Il y a 2h" />
                <NotificationItem title="Document manquant" desc="Veuillez uploader votre RIB pour le virement." time="Hier" />
                <NotificationItem title="Contrat expire bientôt" desc="Votre contrat CDD arrive à échéance dans 15 jours." time="Il y a 3j" />
                <NotificationItem title="Mise à jour RH" desc="Nouveau règlement intérieur disponible au téléchargement." time="Il y a 1 sem" />
              </div>
            </section>

            {/* SECTION 5 - SECURITY */}
            <section className="bg-white rounded-[32px] p-10 border border-[#E5E7EB] shadow-sm text-start">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-3 mb-8">
                <Lock className="text-[#0078D4]" size={24} />
                SÉCURITÉ
              </h3>
              <div className="space-y-3">
                <SecurityAction icon={<RefreshCw size={18} />} label="Changer le mot de passe" />
                <SecurityAction icon={<ShieldCheck size={18} />} label="Double authentification (2FA)" />
                <SecurityAction icon={<History size={18} />} label="Historique de connexion" />
                <SecurityAction icon={<LogOut size={18} />} label="Déconnecter toutes les sessions" color="text-rose-500" />
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  const activeEmps = employees.filter(e => e.employmentStatus === 'active');
  const totalPayrollValue = useMemo(() => activeEmps.reduce((acc, e) => acc + e.baseSalary, 0), [activeEmps]);

  const payrollHistory = [
    { name: 'Jun', value: totalPayrollValue * 0.85 },
    { name: 'Jul', value: totalPayrollValue * 0.88 },
    { name: 'Aug', value: totalPayrollValue * 0.92 },
    { name: 'Sep', value: totalPayrollValue * 0.95 },
    { name: 'Oct', value: totalPayrollValue * 0.98 },
    { name: 'Nov', value: totalPayrollValue },
  ];

  const deptData = [
    { name: 'Operations', value: 45 },
    { name: 'Technology', value: 32 },
    { name: 'Sales', value: 24 },
    { name: 'Finance', value: 12 },
  ];

  const workforceSplit = [
    { name: 'CDI', value: 75, fill: '#0A9E9A' },
    { name: 'CDD', value: 15, fill: '#34C759' },
    { name: 'ANAPEC', value: 10, fill: '#334155' },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const t = {
    fr: {
      totalPayroll: "Masse Salariale",
      activeStaff: "Effectif Actif",
      avgSalary: "Salaire Moyen",
      compliance: "Score Conformité",
      evolution: "Évolution Mensuelle",
      distribution: "Coûts par Département",
      contractTypes: "Structure Contractuelle",
      insights: "Décisions IA",
      lastUpdated: "Mis à jour: Aujourd'hui à 11:15",
      aiCore: "Salery AI Core",
      systemHealthy: "SYSTÈME SAIN",
    },
    ar: {
      totalPayroll: "كتلة الأجور",
      activeStaff: "الموظفون النشطون",
      avgSalary: "متوسط الراتب",
      compliance: "مؤشر الامتثال",
      evolution: "تطور الأجور",
      distribution: "التكاليف حسب القسم",
      contractTypes: "أنواع العقود",
      insights: "قرارات الذكاء",
      lastUpdated: "آخر تحديث: اليوم على 11:15",
      aiCore: "Salery AI Core",
      systemHealthy: "نظام سليم",
    }
  }[lang === 'ar' ? 'ar' : 'fr'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] p-6 lg:p-10 font-sans selection:bg-teal-100 overflow-x-hidden animate-in fade-in duration-300" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="light-blob blob-1"></div>
      <div className="light-blob blob-2"></div>

      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
        <div className="space-y-1 text-start">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight uppercase text-[#0F172A]">Global Infrastructure</h1>
            <span className="px-3 py-1 bg-teal-50 text-teal-600 border border-teal-100 rounded-full text-[9px] font-black uppercase tracking-widest">{t.systemHealthy}</span>
          </div>
          <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-[0.2em]">{t.lastUpdated}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-sm">
            <button className="px-6 py-2 bg-teal-50 text-[#0A9E9A] rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border border-teal-100 hover:bg-teal-100 transition-all">M-TD</button>
            <button className="px-6 py-2 text-[#64748B] hover:text-[#0A9E9A] transition-all text-[10px] font-black uppercase tracking-widest">Y-TD</button>
          </div>
          <button onClick={handleRefresh} className={`p-3 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#0A9E9A] transition-all shadow-sm ${isRefreshing ? 'animate-spin' : ''}`}>
            <RefreshCw size={18} />
          </button>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-100 transition-all shadow-sm">
              <Download size={14} /> PDF
            </button>
            <button className="flex items-center gap-2 px-8 py-3 btn-primary-gradient text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-100 hover:brightness-110 transition-all active:scale-95">
              <FileSpreadsheet size={14} /> EXPORTER XLS
            </button>
          </div>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
        <KpiCard label={t.totalPayroll} value={totalPayrollValue.toLocaleString()} unit="MAD" trend={+4.2} icon={<CreditCard size={20} />} color="text-teal-600" bg="bg-teal-50" />
        <KpiCard label={t.activeStaff} value={activeEmps.length} trend={+1.5} icon={<Users size={20} />} color="text-blue-600" bg="bg-blue-50" />
        <KpiCard label={t.avgSalary} value={Math.round(totalPayrollValue / (activeEmps.length || 1)).toLocaleString()} unit="DH" trend={-0.8} icon={<TrendingUp size={20} />} color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard label={t.compliance} value="99.2" unit="%" trend={+0.5} icon={<ShieldCheck size={20} />} color="text-indigo-600" bg="bg-indigo-50" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 relative z-10">

        {/* Evolutionary Chart (70%) */}
        <div className="lg:col-span-8 bg-white rounded-[32px] border border-[#E2E8F0] p-10 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-10">
            <div className="text-start">
              <h3 className="text-xl font-black text-[#0F172A] tracking-tight">{t.evolution}</h3>
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mt-1">Comparaison Semestrielle • Source: Damancom</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100">
                REAL-TIME SYNC
              </span>
            </div>
          </div>
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payrollHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A9E9A" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0A9E9A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0A9E9A"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panel: Insights (30%) */}
        <div className="lg:col-span-4 space-y-8 animate-in slide-in-from-right-4 duration-500">
          <div className="bg-white rounded-[32px] border border-[#E2E8F0] p-10 relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
              <BrainCircuit size={180} />
            </div>
            <div className="relative z-10 space-y-10 text-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-teal-50 text-[#0A9E9A] rounded-2xl flex items-center justify-center border border-teal-100 shadow-inner">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0F172A] tracking-tight">{t.aiCore}</h3>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cognitive Audit Node</p>
                </div>
              </div>
              <div className="space-y-6">
                <InsightItem
                  title="Optimisation Fiscale"
                  desc="Detection d'une réduction possible de l'IR via l'Article 57 du CGI. Potentiel: 3,400 MAD/mois."
                  type="info"
                />
                <InsightItem
                  title="Risque Labor Court"
                  desc="Détection d'un écart de préavis sur 2 contrats IT. Action corrective requise."
                  type="warning"
                />
                <InsightItem
                  title="Alerte CNSS"
                  desc="2 numéros d'immatriculation manquants pour le cycle de Novembre."
                  type="danger"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-10 text-start flex flex-col justify-between h-[200px] shadow-sm border border-[#E2E8F0] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700 text-teal-600"><Shield size={120} /></div>
            <div className="relative z-10 space-y-2">
              <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Statut Gouvernance</p>
              <h4 className="text-2xl font-black text-[#0F172A] tracking-tight">Certification ISO 27001</h4>
            </div>
            <button className="relative z-10 flex items-center justify-between w-full text-[10px] font-black text-[#0F172A] uppercase tracking-widest pt-6 border-t border-[#E2E8F0] group">
              Vérifier les protocoles <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Row: Small Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">

        <div className="bg-white rounded-[32px] border border-[#E2E8F0] p-10 text-start shadow-sm animate-in zoom-in duration-500">
          <h3 className="text-[10px] font-black text-[#64748B] mb-10 uppercase tracking-[0.2em]">{t.distribution}</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical" margin={{ left: -10 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748B', fontSize: 11, fontWeight: 800 }}
                  width={90}
                />
                <Tooltip cursor={{ fill: '#F1F5F9' }} content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
                  {deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0A9E9A' : '#E2E8F0'} className="hover:brightness-95 transition-all" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-[#E2E8F0] p-10 text-start shadow-sm animate-in zoom-in duration-500 delay-100">
          <h3 className="text-[10px] font-black text-[#64748B] mb-10 uppercase tracking-[0.2em]">{t.contractTypes}</h3>
          <div className="h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={workforceSplit}
                  innerRadius={80}
                  outerRadius={105}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                >
                  {workforceSplit.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-[#0F172A] font-black text-4xl tracking-tighter">
                  {employees.length}
                </text>
                <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-[#64748B] font-bold text-[9px] uppercase tracking-widest">
                  TOTAL STAFF
                </text>
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  formatter={(val) => <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">{val}</span>}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-[#E2E8F0] p-10 text-start shadow-sm animate-in zoom-in duration-500 delay-200">
          <h3 className="text-[10px] font-black text-[#64748B] mb-10 uppercase tracking-[0.2em]">Compliance Dashboard</h3>
          <div className="space-y-10">
            <MiniGauge label="Immatriculation CNSS" value={94} color="bg-teal-500" total={100} unit="%" />
            <MiniGauge label="Certificats Médicaux" value={82} color="bg-blue-500" total={100} unit="%" />
            <div className="pt-6 border-t border-[#F1F5F9] grid grid-cols-2 gap-6">
              <div className="text-start">
                <p className="text-[9px] font-black text-[#64748B] uppercase tracking-widest mb-1">PROFIL À RISQUE</p>
                <p className="text-2xl font-black text-rose-500">03</p>
              </div>
              <div className="text-start">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">NODES ACTIFS</p>
                <p className="text-2xl font-black text-teal-600">08</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

// --- Sub-Components ---

const KpiCard = ({ label, value, unit, trend, icon, color, bg }: any) => (
  <div className="bg-white p-8 rounded-[24px] border border-[#E2E8F0] hover:border-[#0A9E9A] transition-all group shadow-sm relative animate-in fade-in duration-500">
    <div className="flex justify-between items-start mb-8">
      <div className={`p-4 ${bg} rounded-2xl ${color} shadow-sm border border-transparent group-hover:border-current transition-all`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1.5 text-[11px] font-black ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {Math.abs(trend)}%
      </div>
    </div>
    <div className="text-start space-y-1">
      <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em]">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black text-[#0F172A] tracking-tighter leading-none">
          {value}
        </p>
        {unit && <span className="text-sm font-bold text-[#64748B]">{unit}</span>}
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xl text-start">
        <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-3">{label}</p>
        <div className="flex flex-col gap-1">
          <p className="text-xl font-black text-[#0F172A] tracking-tighter leading-none">
            {payload[0].value.toLocaleString()} <span className="text-xs">MAD</span>
          </p>
          <p className="text-[9px] font-bold text-teal-600 uppercase tracking-widest mt-1">Brut Global Certifié</p>
        </div>
      </div>
    );
  }
  return null;
};

const InsightItem = ({ title, desc, type }: any) => {
  const colors = {
    info: "text-blue-700 bg-blue-50 border-blue-100",
    warning: "text-amber-700 bg-amber-50 border-amber-100",
    danger: "text-rose-700 bg-rose-50 border-rose-100"
  };
  return (
    <div className={`p-5 rounded-[22px] border transition-all hover:scale-[1.02] cursor-default ${colors[type as keyof typeof colors]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} strokeWidth={3} />
        <h5 className="text-[10px] font-black uppercase tracking-widest leading-none">{title}</h5>
      </div>
      <p className="text-[12px] font-bold leading-relaxed opacity-80">{desc}</p>
    </div>
  );
};

const MiniGauge = ({ label, value, color, total, unit }: any) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
      <span className="text-[#64748B]">{label}</span>
      <span className="text-[#0F172A]">{value}{unit}</span>
    </div>
    <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${(value / total) * 100}%` }}></div>
    </div>
  </div>
);

const ProfileField = ({ label, value }: { label: string; value: string | number }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">{label}</p>
    <p className="text-sm font-bold text-[#0F172A]">{value}</p>
  </div>
);

const DocCard = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <button className="flex flex-col items-center justify-center p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl hover:border-[#0A9E9A] hover:bg-white transition-all group">
    <div className="text-[#64748B] group-hover:text-[#0A9E9A] transition-all mb-3">{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B] group-hover:text-[#0F172A]">{label}</span>
  </button>
);

const NotificationItem = ({ title, desc, time }: { title: string; desc: string; time: string }) => (
  <div className="flex gap-4 p-4 rounded-2xl hover:bg-[#F8FAFC] transition-all border border-transparent hover:border-[#E2E8F0]">
    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
    <div className="space-y-1">
      <h5 className="text-[11px] font-black uppercase text-[#0F172A] tracking-tight">{title}</h5>
      <p className="text-xs text-[#334155] leading-relaxed">{desc}</p>
      <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">{time}</p>
    </div>
  </div>
);

const SecurityAction = ({ icon, label, color = "text-[#334155]" }: { icon: React.ReactNode; label: string; color?: string }) => (
  <button className="flex items-center justify-between w-full p-4 rounded-2xl border border-[#E2E8F0] hover:border-[#0A9E9A] hover:bg-[#F8FAFC] transition-all group">
    <div className="flex items-center gap-4">
      <div className={`${color} group-hover:scale-110 transition-transform`}>{icon}</div>
      <span className={`text-[11px] font-black uppercase tracking-widest ${color}`}>{label}</span>
    </div>
    <ChevronRight size={16} className="text-[#64748B]" />
  </button>
);

export default Dashboard;
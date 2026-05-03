import React, { useState, useEffect } from 'react';
import {
  Calculator, FileText, MessageSquare, LayoutDashboard, Target,
  Users, Calendar as CalendarIcon, Menu as MenuIcon, X, BarChart3, LogOut, Clock, ShieldCheck, Globe, Settings, Bell, Languages, CloudSync, CheckCircle2, ArrowUpCircle, Sparkles, AlertCircle, HelpCircle, Lock, MoreHorizontal, User, ChevronRight, CreditCard, PieChart, Shield, ChevronDown, RefreshCw, BarChart4, Landmark, Fingerprint, Timer, Bot, Terminal, FileSearch, ShieldAlert, ChevronLeft, PanelLeftClose, PanelLeft, Zap, Building2, Moon, Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard.tsx';
import EmployeeManager from './components/EmployeeManager.tsx';
import PayrollCalculator from './components/PayrollCalculator.tsx';
import DocumentGenerator from './components/DocumentGenerator.tsx';
import LeaveManager from './components/LeaveManager.tsx';
import LegalChat from './components/LegalChat.tsx';
import AttendanceManager from './components/AttendanceManager.tsx';
import WorkTimeManager from './components/WorkTimeManager.tsx';
import SettingsManager from './components/SettingsManager.tsx';
import AccountModal from './components/AccountModal.tsx';
import EmployeePortal from './components/EmployeePortal.tsx';
import SiteManager from './components/SiteManager.tsx';
import GovernmentComplianceCenter from './components/GovernmentComplianceCenter.tsx';
import SovereignIdentityHub from './components/SovereignIdentityHub.tsx';
import ComplianceManager from './components/ComplianceManager.tsx';
import CalendarModule from './components/CalendarModule.tsx';
import AnalyticsCenter from './components/AnalyticsCenter.tsx';
import Reports from './components/Reports.tsx';
import CnssComplianceModule from './components/CnssComplianceModule.tsx';
import PrimeManager from './components/PrimeManager.tsx';
import Auth from './components/Auth.tsx';
import Logo from './components/Logo.tsx';
import RecruitmentATS from './components/RecruitmentATS.tsx';
import { Language, Employee, LeaveRequest, AuthUser, AttendanceRecord, PayrollResult, Notification as AppNotification } from './types.ts';
import { calculateEmployeePayroll } from './services/payrollEngine.ts';
import { requestPushPermission, registerDeviceToken } from './services/pushService.ts';
import { useAppStore } from './store/store.ts';
import { canAccessModule, ROLE_DEFAULT_TAB } from './services/rbac';
import RoleBadge from './components/RoleBadge.tsx';
import SecureLoadingSpinner from './components/SecureLoadingSpinner.tsx';
import { getCurrentUser } from './services/authService.ts';

const App: React.FC = () => {
  const {
    user, setUser, employees, setEmployees, leaves, setLeaves, attendance,
    authLoading, isAuthenticated, setAuthStatus
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<string>('dash');
  const [lang, setLang] = useState<Language>('fr');
  const [showAccount, setShowAccount] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sidebar State
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const isSidebarExpanded = isSidebarPinned || isSidebarHovered;

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // ZERO-TRUST BOOT SEQUENCE
  useEffect(() => {
    const boot = async () => {
      setAuthStatus({ loading: true });
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setAuthStatus({ authenticated: true });
          if (!canAccessModule(currentUser, activeTab)) {
            setActiveTab(ROLE_DEFAULT_TAB[currentUser.role] || 'dash');
          }
        } else {
          setAuthStatus({ authenticated: false });
        }
      } catch (err) {
        setAuthStatus({ error: "Authorization failed" });
      } finally {
        setTimeout(() => setAuthStatus({ loading: false }), 400);
      }
    };
    boot();
  }, []);

  const t = {
    fr: {
      dash: 'Tableau de bord', portal: 'Mon Espace', emps: 'Équipe RH', recrut: 'Recrutement', sites: 'Sites & Branches', pointage: 'Attendance', workTime: 'Gabarits Temps', primes: 'Primes & Gains', calc: 'Paie & Calculs', leaves: 'Congés', calendar: 'Planning', compliance: 'Compliance', cnssRisk: 'Audit CNSS', reports: 'Génération Rapports', advisor: 'Assistant IA', docs: 'Coffre Documents', settings: 'Configuration',
      notifs: "Notifications", markAllRead: "Tout marquer lu", noNotifs: "Aucune notification",
      empDash: 'Mon Profil', empDocs: 'Mes Documents', empPayslips: 'Mes Bulletins', empSecurity: 'Sécurité'
    },
    ar: {
      dash: 'لوحة القيادة', portal: 'فضائي الخاص', emps: 'الفريق', recrut: 'التوظيف', sites: 'المواقع والفروع', pointage: 'تسجيل الحضور', workTime: 'قوالب الوقت', primes: 'التعويضات', calc: 'الأجور', leaves: 'العطل', calendar: 'الجدولة', compliance: 'الامتثال', cnssRisk: 'مخاطر الضمان', reports: 'التقارير', advisor: 'مستشار الذكاء', docs: 'الوثائق', settings: 'الإعدادات',
      notifs: "التنبيهات", markAllRead: "تحديد الكل كمقروء", noNotifs: "لا توجد تنبيهات",
      empDash: 'ملفي الشخصي', empDocs: 'وثائقي', empPayslips: 'أوراق أدائي', empSecurity: 'الأمان'
    }
  }[lang === 'ar' ? 'ar' : 'fr'];

  const allNavItems = [
    { id: 'dash', label: t.dash, icon: <LayoutDashboard size={20} /> },
    { id: 'portal', label: t.portal, icon: <User size={20} /> },
    { id: 'emps', label: t.emps, icon: <Users size={20} /> },
    { id: 'recrut', label: t.recrut, icon: <Target size={20} /> },
    { id: 'sites', label: t.sites, icon: <Building2 size={20} /> },
    { id: 'pointage', label: t.pointage, icon: <Timer size={20} /> },
    { id: 'workTime', label: t.workTime, icon: <Clock size={20} /> },
    { id: 'primes', label: t.primes, icon: <Zap size={20} /> },
    { id: 'calc', label: t.calc, icon: <Calculator size={20} /> },
    { id: 'cnssRisk', label: t.cnssRisk, icon: <ShieldAlert size={20} /> },
    { id: 'leaves', label: t.leaves, icon: <CalendarIcon size={20} /> },
    { id: 'calendar', label: t.calendar, icon: <Clock size={20} /> },
    { id: 'compliance', label: t.compliance, icon: <ShieldCheck size={20} /> },
    { id: 'reports', label: t.reports, icon: <FileSearch size={20} /> },
    { id: 'advisor', label: t.advisor, icon: <Bot size={20} /> },
    { id: 'docs', label: t.docs, icon: <FileText size={20} /> },
    { id: 'empDocs', label: t.empDocs, icon: <FileText size={20} /> },
    { id: 'empPay', label: t.empPayslips, icon: <CreditCard size={20} /> },
    { id: 'empLeaves', label: t.leaves, icon: <CalendarIcon size={20} /> },
    { id: 'settings', label: user?.role === 'EMPLOYEE' ? t.empSecurity : t.settings, icon: user?.role === 'EMPLOYEE' ? <Lock size={20} /> : <Settings size={20} /> },
  ];

  const navItems = allNavItems.filter(item => canAccessModule(user, item.id));

  const handleLogout = () => {
    useAppStore.getState().logout();
  };

  const handleLogin = (u: AuthUser) => {
    setUser(u);
    requestPushPermission().then(granted => {
      if (granted) registerDeviceToken(u);
    });
    setActiveTab(ROLE_DEFAULT_TAB[u.role] || 'dash');
  };

  const toggleNotifications = async () => {
    if (!showNotifications) {
      const granted = await requestPushPermission();
      if (granted && user) registerDeviceToken(user);
    }
    setShowNotifications(!showNotifications);
  };

  if (authLoading) {
    return <SecureLoadingSpinner userName={user?.firstName} />;
  }

  if (!user || !isAuthenticated) {
    return (
      <Auth
        onLogin={(u) => {
          setUser(u);
          setAuthStatus({ authenticated: true });
          setActiveTab(ROLE_DEFAULT_TAB[u.role] || 'dash');
        }}
        lang={lang}
        setLang={setLang}
      />
    );
  }

  return (
    <div className={`flex h-[100dvh] w-full bg-[var(--salery-bg)] selection:bg-blue-100 overflow-hidden ${isDarkMode ? 'dark' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <aside
        className={`hidden lg:flex flex-col bg-[var(--salery-bg-sidebar)] border-r border-[var(--salery-border)] transition-all duration-300 sidebar-transition shrink-0 z-[20] ${isSidebarExpanded ? 'w-72' : 'w-20'}`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <div className="p-6 h-20 flex items-center justify-between shrink-0">
          <Logo iconOnly={!isSidebarExpanded} onClick={() => setActiveTab('dash')} />
          {isSidebarExpanded && (
            <button onClick={() => setIsSidebarPinned(!isSidebarPinned)} className="p-2 text-gray-400 hover:text-[#0078D4] hover:bg-blue-50 rounded-lg transition-colors">
              {isSidebarPinned ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scroll no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full px-3 py-3 rounded-xl transition-all group ${activeTab === item.id ? 'bg-[#F0F7FF] text-[#0078D4] shadow-sm' : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#1F2937]'}`}
            >
              <div className={`shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                {item.icon}
              </div>
              <span className={`ml-4 text-[13px] font-medium whitespace-nowrap transition-opacity duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {item.label}
              </span>
              {activeTab === item.id && isSidebarExpanded && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0078D4]" />}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB] shrink-0">
          <button
            onClick={() => setShowAccount(true)}
            className="flex items-center w-full p-2 rounded-xl hover:bg-gray-50 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F0F7FF] flex items-center justify-center text-[#0078D4] shrink-0 border border-blue-50 shadow-sm overflow-hidden">
              {user.photo ? <img src={user.photo} className="w-full h-full object-cover" /> : <User size={20} />}
            </div>
            {isSidebarExpanded && (
              <div className="ml-3 text-start truncate">
                <p className="text-[13px] font-bold text-[#1F2937] truncate">{user.firstName} {user.lastName}</p>
                <RoleBadge role={user.role} lang={lang} size="sm" />
              </div>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="h-20 bg-[var(--salery-glass-bg)] backdrop-blur-md border-b border-[var(--salery-border)] px-6 lg:px-10 flex items-center justify-between sticky top-0 z-[15] shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden p-2.5 bg-[var(--salery-input-bg)] rounded-xl text-[var(--salery-text-primary)]">
              <MenuIcon size={24} />
            </button>
            <h1 className="text-xl font-black text-[var(--salery-text-primary)] tracking-tight hidden md:block">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[var(--salery-input-bg)] border border-[var(--salery-border)] rounded-xl">
              <div className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse"></div>
              <span className="text-[10px] font-black uppercase text-[#1F2937] tracking-widest">{user.companyName}</span>
            </div>

            <div className="flex items-center bg-[#F9FAFB] p-1 rounded-xl border border-[#E5E7EB]">
              <button onClick={() => setLang('fr')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${lang === 'fr' ? 'bg-white shadow-sm text-[#0078D4]' : 'text-gray-400'}`}>FR</button>
              <button onClick={() => setLang('ar')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${lang === 'ar' ? 'bg-white shadow-sm text-[#0078D4]' : 'text-gray-400'}`}>AR</button>
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 bg-[var(--salery-input-bg)] border border-[var(--salery-border)] rounded-xl transition-all shadow-sm text-[var(--salery-text-secondary)] hover:text-[var(--salery-primary-blue)]"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={toggleNotifications}
              className={`relative p-2.5 bg-[var(--salery-input-bg)] border rounded-xl transition-all shadow-sm ${showNotifications ? 'text-[var(--salery-primary-blue)] border-[var(--salery-primary-blue)]' : 'text-[var(--salery-text-secondary)] border-[var(--salery-border)] hover:text-[var(--salery-primary-blue)]'}`}
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {showNotifications && (
          <div className="absolute top-20 right-10 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl z-[200] animate-in slide-in-from-top-2 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <h4 className="text-sm font-black uppercase tracking-tight">{t.notifs}</h4>
              <button onClick={() => setShowNotifications(false)} className="text-gray-400"><X size={16} /></button>
            </div>
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300"><Bell size={24} /></div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.noNotifs}</p>
            </div>
            <button onClick={() => setShowNotifications(false)} className="w-full py-3 bg-[#F0F7FF] text-[#0078D4] rounded-xl text-[9px] font-black uppercase tracking-[0.2em]">{t.markAllRead}</button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto custom-scroll bg-[var(--salery-bg)] p-6 lg:p-10 min-w-0 z-[1] flex flex-col">
          {!canAccessModule(user, activeTab) ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center shadow-xl shadow-rose-100 border border-rose-100 ring-4 ring-white">
                <ShieldAlert size={48} />
              </div>
              <div className="space-y-3 max-w-md">
                <h2 className="text-4xl font-black text-[#1F2937] tracking-tighter uppercase leading-none">
                  {lang === 'ar' ? 'وصول ممنوع' : '403: Accès Interdit'}
                </h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                  {lang === 'ar'
                    ? 'ليس لديك الصلاحيات الكافية للوصول إلى هذا القسم. تم تسجيل محاولة الوصول.'
                    : 'Vous n\'avez pas les permissions nécessaires pour accéder à ce module. L\'incident a été enregistré.'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab(ROLE_DEFAULT_TAB[user.role] || 'dash')}
                className="px-8 py-4 bg-[#1F2937] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all active:scale-95 shadow-2xl shadow-gray-200"
              >
                {lang === 'ar' ? 'العودة للرئيسية' : 'Retour à l\'accueil'}
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-[1600px] mx-auto w-full flex-1 min-w-0"
              >
                {activeTab === 'dash' && <Dashboard employees={employees} leaves={leaves} lang={lang} user={user} />}
                {activeTab === 'portal' && <EmployeePortal user={user} employees={employees} leaves={leaves} attendance={attendance} lang={lang} />}
                {activeTab === 'emps' && <EmployeeManager employees={employees} setEmployees={setEmployees} lang={lang} user={user} onShowPricing={() => { }} />}
                {activeTab === 'recrut' && <RecruitmentATS lang={lang} user={user} />}
                {activeTab === 'sites' && <SiteManager employees={employees} lang={lang} user={user} />}
                {activeTab === 'pointage' && <AttendanceManager lang={lang} user={user} employees={employees} />}
                {activeTab === 'workTime' && <WorkTimeManager employees={employees} lang={lang} user={user} />}
                {activeTab === 'primes' && <PrimeManager employees={employees} lang={lang} user={user} onUpdateEmployee={(e) => {
                  const updated = employees.map(emp => emp.id === e.id ? e : emp);
                  setEmployees(updated);
                  localStorage.setItem('salaire_employees', JSON.stringify(updated));
                }} />}
                {activeTab === 'calc' && <PayrollCalculator employees={employees} lang={lang} user={user} onShowPricing={() => { }} />}
                {activeTab === 'cnssRisk' && <CnssComplianceModule employees={employees} payrollResults={employees.map(e => calculateEmployeePayroll(e, attendance, [], [], [], 'Current'))} lang={lang} user={user} />}
                {activeTab === 'leaves' && <LeaveManager employees={employees} leaves={leaves} setLeaves={setLeaves} lang={lang} />}
                {activeTab === 'calendar' && <CalendarModule employees={employees} leaves={leaves} lang={lang} user={user} />}
                {activeTab === 'compliance' && <ComplianceManager employees={employees} attendance={attendance} lang={lang} user={user} />}
                {activeTab === 'reports' && <Reports employees={employees} leaves={leaves} lang={lang} user={user} />}
                {activeTab === 'advisor' && <LegalChat lang={lang} user={user} />}
                {activeTab === 'docs' && <DocumentGenerator lang={lang} user={user} />}
                {activeTab === 'settings' && <SettingsManager lang={lang} user={user} setUser={setUser} />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {showAccount && (
        <AccountModal
          user={user}
          setUser={setUser}
          lang={lang}
          onClose={() => setShowAccount(false)}
          onShowPricing={() => { }}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;

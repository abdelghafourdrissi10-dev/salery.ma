import React, { useMemo } from 'react';
import {
    LayoutDashboard, Users, Target, Building2, Timer, Clock, Zap,
    Calculator, ShieldAlert, Calendar as CalendarIcon, ShieldCheck,
    FileSearch, Bot, FileText, User, Settings, Lock, PanelLeftClose, PanelLeft,
    History, CreditCard
} from 'lucide-react';
import Logo from './Logo.tsx';
import ContextSwitcher from './ContextSwitcher.tsx';
import RoleBadge from './RoleBadge.tsx';
import { AuthUser, Language } from '../types.ts';
import { canAccessModule } from '../services/rbac.ts';

interface SidebarProps {
    user: AuthUser;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    lang: Language;
    isExpanded: boolean;
    isPinned: boolean;
    setIsPinned: (pinned: boolean) => void;
    onHover: (hovered: boolean) => void;
    onShowAccount: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    user, activeTab, setActiveTab, lang, isExpanded, isPinned, setIsPinned, onHover, onShowAccount
}) => {
    const t = {
        fr: {
            dash: 'Tableau de bord', portal: 'Mon Portail', emps: 'Équipe RH', recrut: 'Recrutement', sites: 'Sites & Branches', pointage: 'Pointage', workTime: 'Gabarits Horaires', primes: 'Primes & Gains', calc: 'Paie & Calculs', salaries: 'Historique des Salaires', leaves: 'Congés', calendar: 'Planning', compliance: 'Emploi & Conformité', cnssRisk: 'Audit CNSS', reconstruction: 'Audit Historique', reports: 'Génération Rapports', advisor: 'Assistant IA', docs: 'Coffre Documents', settings: 'Configuration',
            empDash: 'Mon Profil', empDocs: 'Mes Documents', empPayslips: 'Mes Bulletins', empSecurity: 'Sécurité'
        },
        ar: {
            dash: 'لوحة القيادة', portal: 'فضائي الخاص', emps: 'الفريق', recrut: 'التوظيف', sites: 'المواقع والفروع', pointage: 'تسجيل الحضور', workTime: 'قوالب الوقت', primes: 'التعويضات', calc: 'الأجور', salaries: 'سجل الرواتب', leaves: 'العطل', calendar: 'الجدولة', compliance: 'الامتثال', cnssRisk: 'مخاطر الضمان', reconstruction: 'التدقيق التاريخي', reports: 'التقارير', advisor: 'مستشار الذكاء', docs: 'الوثائق', settings: 'الإعدادات',
            empDash: 'ملفي الشخصي', empDocs: 'وثائقي', empPayslips: 'أوراق أدائي', empSecurity: 'الأمان'
        }
    }[lang === 'ar' ? 'ar' : 'fr'];

    const allNavItems = useMemo(() => [
        { id: 'dash', label: t.dash, icon: <LayoutDashboard size={20} /> },
        { id: 'portal', label: t.portal, icon: <User size={20} /> },
        { id: 'emps', label: t.emps, icon: <Users size={20} /> },
        { id: 'recrut', label: t.recrut, icon: <Target size={20} /> },
        { id: 'sites', label: t.sites, icon: <Building2 size={20} /> },
        { id: 'pointage', label: t.pointage, icon: <Timer size={20} /> },
        { id: 'workTime', label: t.workTime, icon: <Clock size={20} /> },
        { id: 'primes', label: t.primes, icon: <Zap size={20} /> },
        { id: 'calc', label: t.calc, icon: <Calculator size={20} /> },
        { id: 'salaries', label: t.salaries, icon: <CreditCard size={20} /> },
        { id: 'cnssRisk', label: t.cnssRisk, icon: <ShieldAlert size={20} /> },
        { id: 'leaves', label: t.leaves, icon: <CalendarIcon size={20} /> },
        { id: 'calendar', label: t.calendar, icon: <Clock size={20} /> },
        { id: 'compliance', label: t.compliance, icon: <ShieldCheck size={20} /> },
        { id: 'reconstruction', label: t.reconstruction, icon: <History size={20} /> },
        { id: 'reports', label: t.reports, icon: <FileSearch size={20} /> },
        { id: 'advisor', label: t.advisor, icon: <Bot size={20} /> },
        { id: 'docs', label: t.docs, icon: <FileText size={20} /> },
        { id: 'empDocs', label: t.empDocs, icon: <FileText size={20} /> },
        { id: 'empPay', label: t.empPayslips, icon: <CreditCard size={20} /> },
        { id: 'empLeaves', label: t.leaves, icon: <CalendarIcon size={20} /> },
        { id: 'settings', label: user?.role === 'EMPLOYEE' ? t.empSecurity : t.settings, icon: user?.role === 'EMPLOYEE' ? <Lock size={20} /> : <Settings size={20} /> },
    ], [t, user?.role]);

    const navItems = useMemo(() => {
        return allNavItems.filter(item => canAccessModule(user, item.id));
    }, [user, allNavItems]);

    return (
        <aside
            className={`hidden lg:flex flex-col h-full bg-[var(--salery-bg-sidebar)] border-r border-[var(--salery-border)] transition-all duration-300 sidebar-transition shrink-0 z-[20] overflow-hidden ${isExpanded ? 'w-72' : 'w-20'}`}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
        >
            <div className={`shrink-0 h-20 flex items-center transition-all duration-300 ${isExpanded ? 'px-6 justify-between' : 'justify-center'}`}>
                <Logo iconOnly={!isExpanded} />
                {isExpanded && (
                    <button onClick={() => setIsPinned(!isPinned)} className="p-2 text-gray-400 hover:text-[#0078D4] hover:bg-blue-50 rounded-lg transition-colors">
                        {isPinned ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                    </button>
                )}
            </div>

            <ContextSwitcher isExpanded={isExpanded} />

            <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center w-full px-3 py-3 rounded-xl transition-all group ${activeTab === item.id ? 'bg-[#F0F7FF] text-[#0078D4] shadow-sm' : 'text-[#6B7280] hover:bg-gray-50 hover:text-[#1F2937]'}`}
                    >
                        <div className={`shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                            {item.icon}
                        </div>
                        <span className={`ml-4 text-[13px] font-medium whitespace-nowrap transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            {item.label}
                        </span>
                        {activeTab === item.id && isExpanded && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0078D4]" />}
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-[#E5E7EB] shrink-0">
                <button
                    onClick={onShowAccount}
                    className="flex items-center w-full p-2 rounded-xl hover:bg-gray-50 transition-all group"
                >
                    <div className="w-10 h-10 rounded-xl bg-[#F0F7FF] flex items-center justify-center text-[#0078D4] shrink-0 border border-blue-50 shadow-sm overflow-hidden">
                        {user.photoUrl ? <img src={user.photoUrl} className="w-full h-full object-cover" /> : <User size={20} />}
                    </div>
                    {isExpanded && (
                        <div className="ml-3 text-start truncate">
                            <p className="text-[13px] font-bold text-[#1F2937] truncate">{user.firstName} {user.lastName}</p>
                            <RoleBadge role={user.role} lang={lang} size="sm" />
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

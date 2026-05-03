import React, { useState, useMemo, useEffect } from 'react';
import {
  User, CreditCard, Calendar as CalendarIcon, FileText, MessageSquare,
  ChevronRight, ChevronDown, Download, Info, CheckCircle2, Clock,
  MapPin, Phone, Mail, Hash, ShieldCheck, BadgeCheck,
  Plus, Printer, ArrowRight, AlertCircle, Send, Timer, Navigation,
  QrCode, Upload, FileUp, Eye, Search, LayoutGrid, List, X, RefreshCw,
  FileBadge, FileStack, ShieldAlert, History, FileType, Sparkles, BrainCircuit,
  LocateFixed, Coffee, CalendarDays, TrendingUp, Play, Lock, Unlock, Zap,
  FileCheck, Users
} from 'lucide-react';
import { Language, AuthUser, Employee, LeaveRequest, AttendanceRecord, PayrollResult, CompanyProfile, CountryCode } from '../types';
import { CNSS_SALARIAL_RATE as CNSS_RATE, CNSS_CEILING, AMO_SALARIAL_RATE as AMO_RATE } from '../constants';
import Logo from './Logo';
import { documentService } from '../services/documentService';

interface Props {
  user: AuthUser;
  employees: Employee[];
  leaves: LeaveRequest[];
  attendance: AttendanceRecord[];
  lang: Language;
}

type SubSection = 'profile' | 'payroll' | 'leaves' | 'attendance' | 'docs';

const EmployeePortal: React.FC<Props> = ({ user, employees, leaves, attendance, lang }) => {
  const [activeTab, setActiveTab] = useState<SubSection>('profile');

  const myData = useMemo(() => {
    return employees.find(e =>
      (e.id && user.employeeId && e.id === user.employeeId) ||
      (e.email && user.email && e.email.toLowerCase() === user.email.toLowerCase())
    );
  }, [employees, user]);

  const t = {
    fr: {
      welcome: "Bonjour,",
      sidebar: { profile: "Profil", payroll: "Ma Paie", leaves: "Congés", attendance: "Pointage", docs: "Documents" },
      profile: { title: "Dossier Employé", id: "Matricule", status: { active: "Conforme", incomplete: "Incomplet" } },
    },
    ar: {
      welcome: "مرحباً،",
      sidebar: { profile: "ملفي", payroll: "أجري", leaves: "عطلي", attendance: "حضوري", docs: "وثائقي" },
      profile: { title: "ملف الموظف", id: "الرقم", status: { active: "مطابق", incomplete: "ناقص" } },
    }
  }[lang === 'ar' ? 'ar' : 'fr'];

  if (!myData) return (
    <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
      <AlertCircle size={48} className="text-[#0078D4] opacity-20" />
      <p className="text-[#6B7280] font-bold uppercase tracking-widest text-xs">Profil non lié.</p>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in max-w-7xl mx-auto w-full pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <aside className="w-full lg:w-64 shrink-0 space-y-4 lg:sticky lg:top-24 h-fit">
        <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-4 mb-8 text-start">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0A66C2] font-black border border-blue-100 shrink-0 shadow-sm">
              {myData.photoUrl ? <img src={myData.photoUrl} className="w-full h-full object-cover rounded-2xl" /> : <User size={20} />}
            </div>
            <div className="truncate">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-tight">{t.welcome}</p>
              <h2 className="text-lg font-black text-[#1F2937] tracking-tighter truncate">{myData.fullName}</h2>
            </div>
          </div>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
            <SidebarLink active={activeTab === 'profile'} icon={<User size={18} />} label={t.sidebar.profile} onClick={() => setActiveTab('profile')} />
            <SidebarLink active={activeTab === 'attendance'} icon={<Timer size={18} />} label={t.sidebar.attendance} onClick={() => setActiveTab('attendance')} />
            <SidebarLink active={activeTab === 'payroll'} icon={<CreditCard size={18} />} label={t.sidebar.payroll} onClick={() => setActiveTab('payroll')} />
            <SidebarLink active={activeTab === 'leaves'} icon={<CalendarIcon size={18} />} label={t.sidebar.leaves} onClick={() => setActiveTab('leaves')} />
            <SidebarLink active={activeTab === 'docs'} icon={<FileText size={18} />} label={t.sidebar.docs} onClick={() => setActiveTab('docs')} />
          </nav>
        </div>
      </aside>

      <main className="flex-1">
        <div className="airbnb-card p-12 text-start rounded-[32px] border-[#E5E7EB] shadow-sm">
          {activeTab === 'profile' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center border-b border-gray-50 pb-8">
                <h3 className="text-2xl font-black text-[#1F2937] tracking-tighter">{t.profile.title}</h3>
                <div className="px-5 py-2 bg-emerald-50 text-[#00A99D] rounded-full text-[10px] font-black uppercase border border-emerald-100 flex items-center gap-2 shadow-sm">
                  <BadgeCheck size={16} /> {t.profile.status.active}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <ProfileField label="Nom complet" value={myData.fullName} />
                <ProfileField label="CIN" value={myData.cin} />
                <ProfileField label="E-mail" value={myData.email || "---"} />
                <ProfileField label="Matricule" value={myData.internalMatricule} />
                <ProfileField label="Poste" value={myData.jobTitle} />
                <ProfileField label="Département" value={myData.department || "N/A"} />
              </div>
            </div>
          )}
          {activeTab === 'attendance' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-2xl font-black text-[#1F2937] tracking-tighter mb-6 border-b border-gray-50 pb-8">Mon Pointage</h3>
              <EmployeeAttendanceList userEmail={myData.email} />
            </div>
          )}
          {activeTab === 'payroll' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-2xl font-black text-[#1F2937] tracking-tighter mb-6 border-b border-gray-50 pb-8">Mes Bulletins de Paie</h3>
              <EmployeePayrollList employeeId={myData.id} companyId={user.companyId} />
            </div>
          )}
          {['leaves', 'docs'].includes(activeTab) && (
            <div className="py-24 text-center space-y-6">
              <div className="w-20 h-20 bg-blue-50 rounded-[24px] flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
                <RefreshCw className="animate-spin text-[#0A66C2]" size={40} />
              </div>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Fonctionnalité en cours de déploiement (V2)...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const SidebarLink: React.FC<{ active: boolean, icon: React.ReactNode, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shrink-0 lg:w-full ${active ? 'bg-[#F0F7FF] text-[#0A66C2] shadow-sm' : 'text-gray-400 hover:text-[#0A66C2] hover:bg-[#F9FAFB]'}`}>
    {icon} <span className="whitespace-nowrap">{label}</span>
  </button>
);

function ProfileField({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-bold text-[#1F2937] tracking-tight">{value}</p>
    </div>
  );
}

function EmployeeAttendanceList({ userEmail }: { userEmail: string }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../services/api').then(({ api }) => {
      api.get(`/attendance/${userEmail}`).then((data: any) => {
        setRecords(Array.isArray(data) ? data : []);
        setLoading(false);
      }).catch(err => setLoading(false));
    });
  }, [userEmail]);

  if (loading) return <div className="p-10 text-center text-gray-400"><RefreshCw className="animate-spin mx-auto" /></div>;

  return (
    <div className="overflow-x-auto no-scrollbar border border-gray-100 rounded-2xl">
      <table className="w-full text-left whitespace-nowrap">
        <thead className="bg-[#F7F9FC] border-b border-gray-100">
          <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <th className="p-4">Date</th>
            <th className="p-4">Arrivée</th>
            <th className="p-4">Départ</th>
            <th className="p-4">Heures</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {records.length > 0 ? records.map(r => (
            <tr key={r.id}>
              <td className="p-4 font-bold text-gray-700">{new Date(r.date).toLocaleDateString()}</td>
              <td className="p-4 font-bold">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
              <td className="p-4 font-bold">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
              <td className="p-4 text-[#0078D4] font-black">{r.hoursWorked}h</td>
            </tr>
          )) : <tr><td colSpan={4} className="p-8 text-center text-gray-400">Aucun pointage.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

const EmployeePayrollList: React.FC<{ employeeId: string; companyId: string }> = ({ employeeId, companyId }) => {
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../services/api').then(({ api }) => {
      api.get(`/salaries/${employeeId}`).then((data: any) => {
        setSalaries(Array.isArray(data) ? data : []);
        setLoading(false);
      }).catch(err => setLoading(false));
    });
  }, [employeeId]);

  if (loading) return <div className="p-10 text-center text-gray-400"><RefreshCw className="animate-spin mx-auto" /></div>;

  return (
    <div className="overflow-x-auto no-scrollbar border border-gray-100 rounded-2xl">
      <table className="w-full text-left whitespace-nowrap">
        <thead className="bg-[#F7F9FC] border-b border-gray-100">
          <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            <th className="p-4">Mois</th>
            <th className="p-4">Salaire Base</th>
            <th className="p-4">Net Payé</th>
            <th className="p-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {salaries.length > 0 ? salaries.map(s => (
            <tr key={s.id}>
              <td className="p-4 font-bold text-gray-700">{s.month}</td>
              <td className="p-4 font-bold">{Number(s.baseSalary).toLocaleString()} DH</td>
              <td className="p-4 font-black text-[#00A99D]">{Number(s.netSalary).toLocaleString()} DH</td>
              <td className="p-4 text-right">
                <button
                  onClick={() => documentService.downloadPdf('bulletin', companyId, s.month, employeeId)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black tracking-widest uppercase hover:bg-blue-100 transition-colors"
                >
                  PDF
                </button>
              </td>
            </tr>
          )) : <tr><td colSpan={4} className="p-8 text-center text-gray-400">Aucun bulletin de paie disponible.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeePortal;
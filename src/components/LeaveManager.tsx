import React, { useState } from 'react';
import {
  Calendar, Plus, X, CheckCircle2, Info, Search,
  CalendarDays, Loader2
} from 'lucide-react';
import { Employee, Language } from '../types';
import { useLeaves } from '../hooks/useLeaves';

interface Props {
  employees: Employee[];
  lang: Language;
  // Legacy props kept for backward-compat — data comes from backend now
  leaves?: any[];
  setLeaves?: (l: any[]) => void;
}

const TYPE_MAP: Record<string, string> = {
  CONGE_ANNUEL: 'Congé Annuel',
  MALADIE: 'Maladie',
  MATERNITE: 'Maternité',
  PATERNITE: 'Paternité',
  SANS_SOLDE: 'Sans Solde',
  AUTRE: 'Autre',
  // legacy aliases
  ANNUAL: 'Congé Annuel',
  SICK: 'Maladie',
  BIRTH: 'Naissance',
  MARRIAGE: 'Mariage',
  DEATH: 'Décès',
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
  APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  REJECTED: 'bg-rose-50 text-rose-600 border-rose-100',
  CANCELLED: 'bg-gray-50 text-gray-400 border-gray-100',
  // legacy
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  rejected: 'bg-rose-50 text-rose-600 border-rose-100',
};

const LeaveManager: React.FC<Props> = ({ employees, lang }) => {
  const { leaves, loading, error, create, approve, reject, refetch } = useLeaves();

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    employeeId: '',
    type: 'CONGE_ANNUEL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const t = {
    fr: {
      title: 'Congés & Absences',
      subtitle: 'Suivi des périodes de repos conformes au Code du Travail.',
      btnNew: 'NOUVELLE DEMANDE',
      empty: 'Aucune demande enregistrée.',
      modalTitle: 'Nouvelle Demande de Congé',
      modalSub: 'Définissez les dates et le motif pour validation.',
      fieldEmp: 'Collaborateur',
      fieldType: 'Type de congé',
      fieldStart: 'Date de début',
      fieldEnd: 'Date de fin',
      fieldReason: 'Motif (optionnel)',
      btnConfirm: 'Confirmer la demande',
      approve: 'APPROUVER',
      reject: 'REFUSER',
    },
    ar: {
      title: 'العطل والغيابات',
      subtitle: 'تتبع فترات الراحة وفقاً لمدونة الشغل.',
      btnNew: 'طلب جديد',
      empty: 'لا توجد طلبات.',
      modalTitle: 'طلب عطلة جديد',
      modalSub: 'حدد التواريخ والسبب للموافقة.',
      fieldEmp: 'الموظف',
      fieldType: 'نوع العطلة',
      fieldStart: 'تاريخ البدء',
      fieldEnd: 'تاريخ الانتهاء',
      fieldReason: 'السبب (اختياري)',
      btnConfirm: 'تأكيد الطلب',
      approve: 'موافقة',
      reject: 'رفض',
    },
  }[lang === 'ar' ? 'ar' : 'fr'];

  const filtered = leaves.filter(l => {
    const emp = employees.find(e => e.id === l.employeeId);
    const name = emp
      ? `${emp.firstName || ''} ${emp.lastName || ''} ${(emp as any).fullName || ''}`.toLowerCase()
      : (l.employee ? `${l.employee.firstName} ${l.employee.lastName}`.toLowerCase() : '');
    return name.includes(searchTerm.toLowerCase());
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId) return;
    setSubmitting(true);
    try {
      await create({
        employeeId: form.employeeId,
        type: form.type,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        reason: form.reason || undefined,
      });
      setShowForm(false);
      setForm({ employeeId: '', type: 'CONGE_ANNUEL', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], reason: '' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => { await approve(id); };
  const handleReject = async (id: string) => { await reject(id); };

  const getDays = (s: string, e: string) => {
    const diff = new Date(e).getTime() - new Date(s).getTime();
    return Math.max(1, Math.ceil(diff / 86400000) + 1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-[#111827] tracking-tighter">{t.title}</h2>
          <p className="text-[#6B7280] font-medium">{t.subtitle}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary-gradient px-8 py-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95"
        >
          <Plus size={18} /> {t.btnNew}
        </button>
      </header>

      {/* Search */}
      <div className="relative group">
        <Search className={`absolute ${lang === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0078D4] transition-colors`} size={20} />
        <input
          type="text"
          placeholder="Rechercher un collaborateur..."
          className={`w-full ${lang === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} py-4 bg-white border border-[#E5E7EB] rounded-full text-sm font-bold outline-none shadow-sm focus:border-[#0078D4]`}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm font-bold text-rose-600">
          ⚠️ {error}
        </div>
      )}

      {/* Leave list */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-3 text-gray-400">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-sm font-bold">Chargement depuis la base de données...</span>
          </div>
        ) : filtered.length > 0 ? filtered.map(leave => {
          const emp = employees.find(e => e.id === leave.employeeId);
          const empName = emp
            ? ((emp as any).fullName || `${emp.firstName} ${emp.lastName}`)
            : leave.employee
              ? `${leave.employee.firstName} ${leave.employee.lastName}`
              : '—';
          const days = getDays(leave.startDate, leave.endDate);
          const statusKey = leave.status?.toUpperCase?.() || leave.status || 'PENDING';

          return (
            <div key={leave.id} className="airbnb-card p-6 bg-white border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-[#F5F7FA] text-[#0078D4] rounded-lg flex items-center justify-center border border-[#E5E7EB]">
                  <Calendar size={20} />
                </div>
                <div className="text-start">
                  <h4 className="font-black text-[#111827] text-lg leading-tight">{empName}</h4>
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mt-1">
                    {new Date(leave.startDate).toLocaleDateString('fr-FR')} → {new Date(leave.endDate).toLocaleDateString('fr-FR')} ({days}j)
                  </p>
                  <span className="text-[9px] font-black text-gray-400 uppercase">{TYPE_MAP[leave.type] || leave.type}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                {statusKey === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => handleApprove(leave.id)}
                      className="px-6 py-2.5 bg-[#34C759] text-white rounded-[10px] text-[10px] font-black uppercase tracking-widest shadow-sm hover:brightness-110 active:scale-95 transition-all"
                    >
                      {t.approve}
                    </button>
                    <button
                      onClick={() => handleReject(leave.id)}
                      className="px-6 py-2.5 bg-rose-500 text-white rounded-[10px] text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-rose-600 active:scale-95 transition-all"
                    >
                      {t.reject}
                    </button>
                  </>
                ) : (
                  <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_STYLES[statusKey] || STATUS_STYLES[leave.status] || ''}`}>
                    {statusKey}
                  </span>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="py-20 text-center airbnb-card bg-white border-dashed border-2 flex flex-col items-center justify-center text-gray-400 italic font-bold">
            {t.empty}
          </div>
        )}
      </div>

      {/* Create leave modal */}
      {showForm && (
        <div className="fixed inset-0 z-[1500] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in duration-300 relative border border-gray-100">
            <header className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
              <div className="flex items-center gap-4 text-start">
                <div className="w-12 h-12 bg-blue-50 text-[#0078D4] rounded-2xl flex items-center justify-center shadow-inner"><CalendarDays size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-[#1A1F36] tracking-tighter">{t.modalTitle}</h3>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.modalSub}</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="p-3 bg-white hover:bg-gray-100 rounded-full text-gray-400 transition-all"><X size={24} /></button>
            </header>

            <form onSubmit={handleSubmit} className="p-10 space-y-6 text-start">
              {/* Employee */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldEmp}</label>
                <select
                  required
                  value={form.employeeId}
                  onChange={e => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all cursor-pointer"
                >
                  <option value="">Sélectionner...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{(e as any).fullName || `${e.firstName} ${e.lastName}`}</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldType}</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all cursor-pointer"
                >
                  <option value="CONGE_ANNUEL">Congé Annuel</option>
                  <option value="MALADIE">Maladie</option>
                  <option value="MATERNITE">Maternité</option>
                  <option value="PATERNITE">Paternité</option>
                  <option value="SANS_SOLDE">Sans Solde</option>
                  <option value="AUTRE">Autre</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldStart}</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldEnd}</label>
                  <input required type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all" />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldReason}</label>
                <input type="text" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all" />
              </div>

              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                <Info size={18} className="text-[#0078D4] mt-0.5 shrink-0" />
                <p className="text-[11px] text-blue-800 font-bold leading-relaxed italic">
                  Les congés annuels sont déduites du solde après approbation RH (Art. 245 Code du Travail).
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 btn-primary-gradient text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-60"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                {t.btnConfirm}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManager;
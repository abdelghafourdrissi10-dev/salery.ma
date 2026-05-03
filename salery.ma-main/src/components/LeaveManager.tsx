import React, { useState, useMemo } from 'react';
import {
  Calendar, Plus, Clock, Check, X, ArrowRight, Settings2,
  Trash2, Edit3, Search, Filter, CheckCircle2, ShieldAlert,
  User, CalendarDays, FileText, Info
} from 'lucide-react';
import { Employee, LeaveRequest, Language } from '../types';

interface Props {
  employees: Employee[];
  leaves: LeaveRequest[];
  setLeaves: (leaves: LeaveRequest[]) => void;
  lang: Language;
}

const LeaveManager: React.FC<Props> = ({ employees, leaves, setLeaves, lang }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New Request Form State
  const [newLeave, setNewLeave] = useState({
    employeeId: '',
    type: 'ANNUAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const t = {
    fr: {
      title: "Congés & Absences",
      subtitle: "Suivi des périodes de repos conformes au Code du Travail.",
      btnNew: "NOUVELLE DEMANDE",
      empty: "Aucune demande en cours.",
      modalTitle: "Nouvelle Demande de Congé",
      modalSub: "Définissez les dates et le motif pour validation.",
      fieldEmp: "Collaborateur",
      fieldType: "Type de congé",
      fieldStart: "Date de début",
      fieldEnd: "Date de fin",
      btnConfirm: "Confirmer la demande",
      types: {
        ANNUAL: "Congé Annuel (1.5j/mois)",
        SICK: "Maladie (Justifiée)",
        BIRTH: "Naissance (3 jours)",
        MARRIAGE: "Mariage",
        DEATH: "Décès (Proche)"
      }
    },
    ar: {
      title: "العطل والغيابات",
      subtitle: "تتبع فترات الراحة وفقاً لمدونة الشغل.",
      btnNew: "طلب جديد",
      empty: "لا توجد طلبات حالياً.",
      modalTitle: "طلب عطلة جديد",
      modalSub: "حدد التواريخ والسبب للموافقة.",
      fieldEmp: "الموظف",
      fieldType: "نوع العطلة",
      fieldStart: "تاريخ البدء",
      fieldEnd: "تاريخ الانتهاء",
      btnConfirm: "تأكيد الطلب",
      types: {
        ANNUAL: "عطلة سنوية",
        SICK: "مرض",
        BIRTH: "ولادة",
        MARRIAGE: "زواج",
        DEATH: "وفاة"
      }
    }
  }[lang === 'ar' ? 'ar' : 'fr'];

  const filteredLeaves = leaves.filter(l => {
    const emp = employees.find(e => e.id === l.employeeId);
    return emp?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.employeeId) return;

    const start = new Date(newLeave.startDate);
    const end = new Date(newLeave.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const request: LeaveRequest = {
      id: `LV-${Date.now()}`,
      employeeId: newLeave.employeeId,
      type: newLeave.type,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      days: diffDays,
      status: 'pending'
    };

    const updatedLeaves = [request, ...leaves];
    setLeaves(updatedLeaves);
    localStorage.setItem('salaire_leaves', JSON.stringify(updatedLeaves));

    setShowForm(false);
    setNewLeave({
      employeeId: '',
      type: 'ANNUAL',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: ''
    });
  };

  const updateStatus = (id: string, status: 'approved' | 'rejected') => {
    const updated = leaves.map(l => l.id === id ? { ...l, status } : l);
    setLeaves(updated);
    localStorage.setItem('salaire_leaves', JSON.stringify(updated));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-[#111827] tracking-tighter">{t.title}</h2>
          <p className="text-[#6B7280] font-medium">{t.subtitle}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary-gradient px-8 py-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95">
          <Plus size={18} /> {t.btnNew}
        </button>
      </header>

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

      <div className="space-y-4">
        {filteredLeaves.length > 0 ? filteredLeaves.map(leave => {
          const emp = employees.find(e => e.id === leave.employeeId);
          return (
            <div key={leave.id} className="airbnb-card p-6 bg-white border-[#E5E7EB] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-[#F5F7FA] text-[#0078D4] rounded-lg flex items-center justify-center border border-[#E5E7EB]">
                  <Calendar size={20} />
                </div>
                <div className="text-start">
                  <h4 className="font-black text-[#111827] text-lg leading-tight">{emp?.fullName}</h4>
                  <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mt-1">
                    {leave.startDate} → {leave.endDate} ({leave.days} jours)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${leave.type === 'SICK' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                  {(t.types as any)[leave.type] || leave.type}
                </span>

                <div className="flex items-center gap-3">
                  {leave.status === 'pending' ? (
                    <>
                      <button onClick={() => updateStatus(leave.id, 'approved')} className="px-6 py-2.5 bg-[#34C759] text-white rounded-[10px] text-[10px] font-black uppercase tracking-widest shadow-sm hover:brightness-110 active:scale-95 transition-all">APPROUVER</button>
                      <button onClick={() => updateStatus(leave.id, 'rejected')} className="px-6 py-2.5 bg-rose-500 text-white rounded-[10px] text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-rose-600 active:scale-95 transition-all">REFUSER</button>
                    </>
                  ) : (
                    <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${leave.status === 'approved' ? 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {leave.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="py-20 text-center airbnb-card bg-white border-dashed border-2 flex flex-col items-center justify-center text-gray-400 italic font-bold">
            {t.empty}
          </div>
        )}
      </div>

      {/* NEW REQUEST MODAL */}
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

            <form onSubmit={handleCreateLeave} className="p-10 space-y-8 text-start">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldEmp}</label>
                <select
                  required
                  value={newLeave.employeeId}
                  onChange={e => setNewLeave({ ...newLeave, employeeId: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all cursor-pointer"
                >
                  <option value="">Sélectionner...</option>
                  {employees.filter(e => e.employmentStatus === 'active').map(e => (
                    <option key={e.id} value={e.id}>{e.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldType}</label>
                <select
                  value={newLeave.type}
                  onChange={e => setNewLeave({ ...newLeave, type: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all cursor-pointer"
                >
                  {Object.entries(t.types).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldStart}</label>
                  <input
                    required
                    type="date"
                    value={newLeave.startDate}
                    onChange={e => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.fieldEnd}</label>
                  <input
                    required
                    type="date"
                    value={newLeave.endDate}
                    onChange={e => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                <Info size={20} className="text-[#0078D4] mt-0.5 shrink-0" />
                <p className="text-[11px] text-blue-800 font-bold leading-relaxed italic">
                  Les demandes de congés annuels sont débitées du solde après approbation RH selon l'Article 245.
                </p>
              </div>

              <button type="submit" className="w-full py-6 btn-primary-gradient text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
                <CheckCircle2 size={24} /> {t.btnConfirm}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManager;
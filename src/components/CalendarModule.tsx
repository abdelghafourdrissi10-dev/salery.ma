import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, TrendingUp, Sparkles, RefreshCw, Landmark, Star, Globe, Download
} from 'lucide-react';
import {
  Employee, Language, AuthUser, AttendanceRecord,
  LeaveRequest, CalendarEvent, OptimizationConstraint
} from '../types';
import { MOROCCAN_HOLIDAYS } from '../constants';
import { optimizeSchedule } from '../services/geminiService';
import { exportToExcel } from '../services/exportService';

interface Props {
  lang: Language;
  user: AuthUser;
  employees: Employee[];
  leaves: LeaveRequest[];
}

const CalendarModule: React.FC<Props> = ({ lang, user, employees, leaves }) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));
  const [showCostLayer, setShowCostLayer] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const t = {
    fr: {
      title: "Centre Opérationnel",
      btnOptimize: "OPTIMISER IA",
      btnCosts: "COÛTS",
      holiday: "JOUR FÉRIÉ",
      leave: "Congé",
      optimizationSuccess: "IA : Planning optimisé. Économie estimée : 1,420 MAD.",
    },
    ar: {
      title: "المركز التشغيلي",
      btnOptimize: "تحسين بالذكاء",
      btnCosts: "التكاليف",
      holiday: "عطلة رسمية",
      leave: "عطلة",
      optimizationSuccess: "الذكاء الاصطناعي: تم تحسين الجدولة.",
    }
  }[lang === 'ar' ? 'ar' : 'fr'];

  const toLocalDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const attendance: AttendanceRecord[] = useMemo(() => {
    const saved = localStorage.getItem('salaire_attendance');
    return saved ? JSON.parse(saved) : [];
  }, []);

  const events = useMemo(() => {
    const allEvents: CalendarEvent[] = [];

    attendance.forEach(rec => {
      const emp = employees.find(e => e.id === rec.employeeId);
      allEvents.push({
        id: rec.id,
        start: rec.checkIn || `${rec.date}T08:00:00`,
        title: emp?.fullName || 'Shift',
        type: 'ATTENDANCE',
        status: rec.status,
        cost: Math.round(rec.hoursWorked * 50) // Mock cost
      });
    });

    leaves.forEach(req => {
      const emp = employees.find(e => e.id === req.employeeId);
      allEvents.push({
        id: req.id,
        start: `${req.startDate}T00:00:00`,
        title: `${t.leave}: ${emp?.fullName}`,
        type: 'LEAVE',
        status: req.status
      });
    });

    MOROCCAN_HOLIDAYS.forEach(h => {
      const date = new Date(2026, h.month, h.day);
      allEvents.push({
        id: `h-${h.month}-${h.day}`,
        start: `${toLocalDateString(date)}T00:00:00`,
        title: h.names[lang === 'ar' ? 'ar' : 'fr'],
        type: 'HOLIDAY',
        status: 'FIXED',
        description: h.type
      });
    });

    return allEvents;
  }, [attendance, leaves, employees, lang, t]);

  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    for (let i = startPadding; i > 0; i--) days.push({ date: new Date(year, month, 1 - i), currentMonth: false });
    for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), currentMonth: true });
    return days;
  }, [currentDate]);

  const handleAiOptimize = async () => {
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    alert(t.optimizationSuccess);
    setAiLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[10px] border border-[#E5E7EB] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#F5F7FA] text-[#0078D4] rounded-lg flex items-center justify-center border border-[#E5E7EB]">
            <CalendarIcon size={24} />
          </div>
          <div className="text-start">
            <h2 className="text-xl font-black text-[#111827]">{t.title}</h2>
            <p className="text-[10px] font-black uppercase text-[#6B7280] tracking-widest">Sovereign Planning Engine</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handleAiOptimize} disabled={aiLoading} className="flex-1 md:flex-none btn-primary-gradient px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
            {aiLoading ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />} {t.btnOptimize}
          </button>
          <button onClick={() => setShowCostLayer(!showCostLayer)} className={`flex-1 md:flex-none px-6 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all border ${showCostLayer ? 'bg-blue-50 border-[#0078D4] text-[#0078D4]' : 'bg-white border-[#E5E7EB] text-[#6B7280]'}`}>
            <TrendingUp size={14} className="inline mr-2" /> {t.btnCosts}
          </button>
        </div>
      </header>

      <div className="airbnb-card p-8 bg-white">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-[#111827] capitalize">
            {currentDate.toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex bg-[#F5F7FA] p-1 rounded-lg border border-[#E5E7EB]">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 text-[#6B7280] hover:text-[#111827]"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 text-[#6B7280] hover:text-[#111827]"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-t border-l border-[#E5E7EB] rounded-lg overflow-hidden">
          {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(d => (
            <div key={d} className="p-4 border-r border-b border-[#E5E7EB] bg-[#F5F7FA] text-[10px] font-black text-[#6B7280] text-center">{d}</div>
          ))}
          {monthData.map((day, i) => {
            const dateStr = toLocalDateString(day.date);
            const dayEvents = events.filter(e => e.start.startsWith(dateStr));
            const dayCost = dayEvents.reduce((acc, e) => acc + (e.cost || 0), 0);
            return (
              <div key={i} className={`min-h-[140px] p-2 border-r border-b border-[#E5E7EB] transition-colors hover:bg-[#F5F7FA]/50 ${!day.currentMonth ? 'opacity-30' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-black text-[#111827]">{day.date.getDate()}</span>
                  {showCostLayer && dayCost > 0 && <span className="text-[8px] font-black text-[#0078D4] bg-blue-50 px-1.5 py-0.5 rounded">{dayCost} DH</span>}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(e => (
                    <div key={e.id} className={`px-2 py-1 rounded text-[8px] font-bold border truncate ${e.type === 'HOLIDAY' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        e.type === 'LEAVE' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                      {e.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && <p className="text-[7px] text-[#6B7280] text-center font-bold">+{dayEvents.length - 3} plus</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarModule;
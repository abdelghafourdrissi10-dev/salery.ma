import React, { useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Search, Filter, Plus, MessageSquare, Bell,
    Download, Printer, Sparkles, RefreshCw
} from 'lucide-react';
import { usePlanningStore } from '../../store/usePlanningStore';
import { useAppStore } from '../../store/store';
import { planningService } from '../../services/planningService';
import { Language, AuthUser, PlanningItem } from '../../types';
import DayCell from './DayCell.tsx';
import PlanningModal from './PlanningModal.tsx';
import PlanningSidebar from './PlanningSidebar.tsx';

interface Props {
    lang: Language;
}

const PlanningCalendar: React.FC<Props> = ({ lang }) => {
    const { user, employees, attendance } = useAppStore();
    const {
        items, addItem, updateItem, deleteItem, setItems
    } = usePlanningStore();

    const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedItem, setSelectedItem] = useState<PlanningItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');

    const monthYearStr = currentDate.toISOString().slice(0, 7); // YYYY-MM

    // Load Initial Data & Anomaly Detection
    useEffect(() => {
        if (items.length === 0 && user) {
            const mock = planningService.generateMockData(user.companyId, monthYearStr);
            const absences = planningService.detectAbsences(attendance, employees, monthYearStr);
            const overtime = planningService.detectOvertime(attendance, employees);
            setItems([...mock, ...absences, ...overtime]);
        }
    }, [items.length, user, monthYearStr, attendance, employees, setItems]);

    const monthData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // ISO week alignment (Mon)
        const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        for (let i = startPadding; i > 0; i--) {
            days.push({ date: new Date(year, month, 1 - i), currentMonth: false });
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), currentMonth: true });
        }
        return days;
    }, [currentDate]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [items, searchTerm, typeFilter]);

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleItemClick = (item: PlanningItem) => {
        setSelectedItem(item);
        setIsSidebarOpen(true);
    };

    const toLocalDateString = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const t = {
        fr: {
            title: "Centre Opérationnel & Planning",
            subtitle: "Enterprise Task & Messaging Command Center",
            searchPlaceholder: "Rechercher une tâche, alerte...",
            newBtn: "NOUVEAU",
            export: "EXPORTER",
            print: "IMPRIMER",
            aiOptimize: "ANALYSE IA",
        },
        ar: {
            title: "مركز العمليات والتخطيط",
            subtitle: "مركز قيادة المهام والرسائل للمؤسسات",
            searchPlaceholder: "البحث عن مهمة، تنبيه...",
            newBtn: "جديد",
            export: "تصدير",
            print: "طباعة",
            aiOptimize: "تحليل الذكاء",
        }
    }[lang === 'ar' ? 'ar' : 'fr'];

    return (
        <div className="flex bg-[#F8FAFC] min-h-screen animate-in fade-in duration-700">
            <main className="flex-1 p-8 overflow-hidden flex flex-col gap-6">

                {/* COMMAND HEADER */}
                <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-[#F0F7FF] text-[#0078D4] rounded-2xl flex items-center justify-center border border-blue-50 shadow-inner">
                            <CalendarIcon size={28} className="drop-shadow-sm" />
                        </div>
                        <div className="text-start">
                            <h1 className="text-2xl font-black text-[#111827] tracking-tight">{t.title}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <p className="text-[10px] font-black uppercase text-[#6B7280] tracking-[0.2em]">{t.subtitle}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        <div className="relative group flex-1 xl:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#0078D4] transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder={t.searchPlaceholder}
                                className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-gray-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0078D4]/20 focus:bg-white transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-[#0078D4] hover:bg-blue-50 transition-all shadow-sm">
                                <Filter size={18} />
                            </button>
                            <div className="h-10 w-[1px] bg-gray-100 mx-1" />
                            <button className="px-5 py-3 btn-primary-gradient text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all">
                                <Plus size={16} /> {t.newBtn}
                            </button>
                        </div>
                    </div>
                </header>

                {/* CALENDAR CONTROLS */}
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-white/40 shadow-sm">
                    <div className="flex items-center gap-6">
                        <h2 className="text-3xl font-black text-[#111827] capitalize min-w-[240px]">
                            {currentDate.toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex bg-white/80 p-1.5 rounded-xl border border-gray-100 shadow-sm">
                            <button
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                className="p-2.5 text-gray-400 hover:text-[#0078D4] hover:bg-blue-50 rounded-lg transition-all"
                            >
                                <ChevronLeft size={22} />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                className="p-2.5 text-gray-400 hover:text-[#0078D4] hover:bg-blue-50 rounded-lg transition-all"
                            >
                                <ChevronRight size={22} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-xl border border-gray-100 shadow-sm">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-[#6B7280] outline-none px-4 py-2 cursor-pointer border-r border-gray-50"
                        >
                            <option value="ALL">TOUS LES TYPES</option>
                            <option value="TASK">TÂCHES</option>
                            <option value="ALERT">ALERTES RH</option>
                            <option value="EVENT">ÉVÉNEMENTS</option>
                            <option value="NOTE">NOTES</option>
                        </select>
                        <button className="flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[#0078D4] hover:bg-blue-50 rounded-lg transition-all">
                            <Sparkles size={14} className="animate-pulse" /> {t.aiOptimize}
                        </button>
                    </div>
                </div>

                {/* MAIN CALENDAR GRID */}
                <div className="airbnb-card flex-1 overflow-hidden flex flex-col border-none shadow-2xl p-0.5 bg-gray-200/20 backdrop-blur-md">
                    <div className="grid grid-cols-7 bg-[#F8FAFC]">
                        {['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'].map(d => (
                            <div key={d} className="py-4 text-[10px] font-black text-[#6B7280] text-center uppercase tracking-[0.2em] border-r border-[#E5E7EB] last:border-r-0 bg-white/90">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-[#F1F5F9] border-t border-[#E5E7EB]">
                        {monthData.map((day, i) => {
                            const dateStr = toLocalDateString(day.date);
                            const dayItems = filteredItems.filter(item => item.date === dateStr);
                            const isToday = dateStr === toLocalDateString(new Date());

                            return (
                                <DayCell
                                    key={i}
                                    date={day.date}
                                    isCurrentMonth={day.currentMonth}
                                    isToday={isToday}
                                    items={dayItems}
                                    onDateClick={handleDateClick}
                                    onItemClick={handleItemClick}
                                />
                            );
                        })}
                    </div>
                </div>

            </main>

            {/* MODALS & SIDEBARS */}
            {isModalOpen && (
                <PlanningModal
                    lang={lang}
                    date={selectedDate}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={(item) => {
                        addItem(item);
                        setIsModalOpen(false);
                    }}
                />
            )}

            <PlanningSidebar
                lang={lang}
                item={selectedItem}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                onUpdate={(id, updates) => updateItem(id, updates)}
                onDelete={(id) => {
                    deleteItem(id);
                    setIsSidebarOpen(false);
                }}
            />

        </div>
    );
};

export default PlanningCalendar;

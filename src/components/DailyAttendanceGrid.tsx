import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    User, Search, Download, Upload, Save,
    Trash2, AlertTriangle, CheckCircle2, MoreVertical,
    Copy, FileSpreadsheet
} from 'lucide-react';
import { Employee, DailyEntry, DailyEntryType, Language } from '../types';

interface Props {
    lang: Language;
    date: string;
    employees: Employee[];
    initialEntries: DailyEntry[];
    onSave: (entries: DailyEntry[]) => void;
    onExport: () => void;
    onImport: () => void;
}

const DailyAttendanceGrid: React.FC<Props> = ({
    lang, date, employees, initialEntries, onSave, onExport, onImport
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [entries, setEntries] = useState<Record<string, DailyEntry>>({});
    const [editingId, setEditingId] = useState<string | null>(null);

    // Sync initial entries
    useEffect(() => {
        const entryMap: Record<string, DailyEntry> = {};
        initialEntries.forEach(entry => {
            entryMap[entry.employeeId] = entry;
        });
        setEntries(entryMap);
    }, [initialEntries]);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp =>
            emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.internalMatricule.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);

    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: filteredEmployees.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 52,
        overscan: 10,
    });

    const handleHoursChange = (empId: string, value: string) => {
        const hours = parseFloat(value) || 0;
        if (hours < 0 || hours > 24) return;

        let type: DailyEntryType = 'WORK';
        if (hours === 0) type = 'ABSENCE';
        else if (hours > 8) type = 'OVERTIME';

        const newEntry: DailyEntry = {
            id: entries[empId]?.id || crypto.randomUUID(),
            employeeId: empId,
            companyId: employees[0]?.companyId || '',
            date,
            hoursWorked: hours,
            type,
            updatedAt: Date.now(),
        };

        setEntries(prev => ({ ...prev, [empId]: newEntry }));
    };

    const getColorClass = (hours: number) => {
        if (hours === 0) return 'text-slate-400 bg-slate-50 border-slate-100';
        if (hours > 0 && hours < 8) return 'text-amber-600 bg-amber-50 border-amber-100';
        if (hours === 8) return 'text-[#0078D4] bg-blue-50 border-blue-100';
        if (hours > 8) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        return 'text-slate-600';
    };

    const handlePaste = (e: React.ClipboardEvent, empId: string) => {
        const data = e.clipboardData.getData('text');
        const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length > 1) {
            e.preventDefault();
            const updatedEntries = { ...entries };
            const startIdx = filteredEmployees.findIndex(emp => emp.id === empId);

            lines.forEach((line, i) => {
                const targetEmp = filteredEmployees[startIdx + i];
                if (targetEmp) {
                    const hours = parseFloat(line.trim()) || 0;
                    if (hours >= 0 && hours <= 24) {
                        let type: DailyEntryType = 'WORK';
                        if (hours === 0) type = 'ABSENCE';
                        else if (hours > 8) type = 'OVERTIME';

                        updatedEntries[targetEmp.id] = {
                            id: entries[targetEmp.id]?.id || crypto.randomUUID(),
                            employeeId: targetEmp.id,
                            companyId: targetEmp.companyId,
                            date,
                            hoursWorked: hours,
                            type,
                            updatedAt: Date.now(),
                        };
                    }
                }
            });
            setEntries(updatedEntries);
        }
    };

    const t = {
        fr: {
            search: "Rechercher un collaborateur (Nom, Matricule)...",
            colId: "ID",
            colName: "Nom complet",
            colHours: "Heures Travaillées",
            colStatus: "Statut",
            save: "Enregistrer les modifications",
            export: "Exporter CSV",
            import: "Importer Excel/CSV",
            absent: "ABSENCE",
            work: "TRAVAIL",
            overtime: "HEURES SUP",
        },
        ar: {
            search: "بحث عن موظف...",
            colId: "المعرف",
            colName: "الاسم الكامل",
            colHours: "ساعات العمل",
            colStatus: "الحالة",
            save: "حفظ التغييرات",
            export: "تصدير CSV",
            import: "استيراد Excel/CSV",
            absent: "غياب",
            work: "عمل",
            overtime: "ساعات إضافية",
        }
    }[lang === 'ar' ? 'ar' : 'fr'];

    return (
        <div className="flex flex-col h-full bg-[#F9FAFB] text-start border border-gray-100 rounded-3xl overflow-hidden shadow-2xl">

            {/* TOOLBAR */}
            <header className="p-6 bg-white border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative group w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0078D4] transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder={t.search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-[#0078D4] transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={onExport} className="icon-btn-secondary p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-500 transition-all shadow-sm">
                        <Download size={20} />
                    </button>
                    <button onClick={onImport} className="icon-btn-secondary p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-500 transition-all shadow-sm">
                        <Upload size={20} />
                    </button>
                    <div className="h-10 w-[1px] bg-gray-100 mx-1" />
                    <button
                        onClick={() => onSave(Object.values(entries))}
                        className="btn-primary-gradient px-6 py-3 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                        <Save size={16} /> {t.save}
                    </button>
                </div>
            </header>

            {/* VIRTUALIZED GRID */}
            <div
                ref={parentRef}
                className="flex-1 overflow-auto custom-scroll"
                style={{ height: 'calc(100vh - 350px)' }}
            >
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {/* STICKY HEADER */}
                    <div className="sticky top-0 z-20 grid grid-cols-[80px_1fr_120px_150px] bg-white border-b border-gray-100 px-6 py-4 shadow-sm">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.colId}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.colName}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">{t.colHours}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.colStatus}</div>
                    </div>

                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const emp = filteredEmployees[virtualRow.index];
                        const entry = entries[emp.id];
                        const hours = entry?.hoursWorked || 0;

                        return (
                            <div
                                key={virtualRow.key}
                                className="absolute top-0 left-0 w-full grid grid-cols-[80px_1fr_120px_150px] items-center px-6 border-b border-gray-50 hover:bg-blue-50/30 transition-colors group cursor-default"
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                <div className="text-[11px] font-mono font-bold text-gray-400 uppercase">{emp.internalMatricule}</div>

                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black border border-white shadow-sm overflow-hidden shrink-0">
                                        {emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full object-cover" /> : <User size={14} className="text-gray-300" />}
                                    </div>
                                    <div className="font-bold text-[#1A1F36] text-[13px] truncate">{emp.fullName}</div>
                                </div>

                                <div className="flex justify-center px-4">
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="24"
                                        value={entry?.hoursWorked ?? ''}
                                        placeholder="0"
                                        onPaste={(e) => handlePaste(e, emp.id)}
                                        onChange={(e) => handleHoursChange(emp.id, e.target.value)}
                                        className={`w-20 text-center py-1.5 rounded-xl font-black text-[13px] border transition-all focus:ring-4 outline-none focus:ring-blue-500/10 focus:bg-white focus:border-[#0078D4] ${getColorClass(hours)}`}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${hours === 0 ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        hours > 8 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                        {hours === 0 ? t.absent : hours > 8 ? t.overtime : t.work}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* FOOTER STATS */}
            <footer className="p-6 bg-white border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex gap-8">
                    <div className="text-start">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Heures</p>
                        <p className="text-xl font-black text-[#1A1F36]">{(Object.values(entries) as DailyEntry[]).reduce((sum: number, e: DailyEntry) => sum + e.hoursWorked, 0).toFixed(1)}h</p>
                    </div>
                    <div className="text-start">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Effectif Actif</p>
                        <p className="text-xl font-black text-[#0078D4]">{(Object.values(entries) as DailyEntry[]).filter((e: DailyEntry) => e.hoursWorked > 0).length} / {employees.length}</p>
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                        <CheckCircle2 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Auto-saved Locally</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default DailyAttendanceGrid;

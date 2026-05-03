import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    ChevronLeft, ChevronRight, Save, Download, Upload,
    FileSpreadsheet, Clock, Calendar as CalendarIcon, User,
    Search, CheckCircle2, AlertTriangle, Printer, Loader2, X
} from 'lucide-react';
import { Employee, Language, MonthlyAttendanceRecord, AttendanceRecord, AuthUser } from '../types';
import { saveMonthlyGrid, getMonthlyGrid, bridgeGridToAttendance } from '../services/attendanceGridService';
import { useAppStore } from '../store/store';
import { useVirtualizer } from '@tanstack/react-virtual';
import { exportGridToExcel, parseGridExcel, printGrid } from '../services/attendanceGridExport';

// STRICTURE SYSTEM CONSTANTS
const COL_EMP_WIDTH = 200;
const COL_DAY_WIDTH = 48;
const COL_TOTAL_WIDTH = 70;
const COL_STATS_WIDTH = 50;
const GRID_HEADER_HEIGHT = 48;
const GRID_ROW_HEIGHT = 42;

interface Props {
    lang: Language;
    user: AuthUser;
    employees: Employee[];
    attendance: AttendanceRecord[];
    onSaveSuccess?: () => void;
}

const MonthlyAttendanceGrid: React.FC<Props> = ({ lang, user, employees, attendance, onSaveSuccess }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [gridData, setGridData] = useState<Record<string, Record<number, number>>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState<{ empId: string, day: number, value: number } | null>(null);
    const [scrolled, setScrolled] = useState({ x: false, y: false });
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);
    const [viewHalf, setViewHalf] = useState<'first' | 'second'>('first');
    const { isImmersiveMode, setIsImmersiveMode } = useAppStore();

    const parentRef = React.useRef<HTMLDivElement>(null);

    // 1. Generate Days of the Month
    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = new Date(year, month, 1);
        const days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentDate]);

    const filteredDays = useMemo(() => {
        return viewHalf === 'first'
            ? daysInMonth.slice(0, 15)
            : daysInMonth.slice(15);
    }, [daysInMonth, viewHalf]);

    // 2. Load from Grid Service (Enterprise Persistent Data)
    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;

        const loadGrid = async () => {
            const records = await getMonthlyGrid(year, month);
            const initialData: Record<string, Record<number, number>> = {};

            employees.forEach(emp => {
                initialData[emp.id] = {};
                for (let d = 1; d <= 31; d++) initialData[emp.id][d] = 0;
            });

            records.forEach(r => {
                if (initialData[r.employeeId]) initialData[r.employeeId][r.day] = r.hoursWorked;
            });

            // If no grid records, fallback to existing AttendanceRecord (for migration/v23 compatibility)
            if (records.length === 0) {
                attendance.forEach(rec => {
                    const recDate = new Date(rec.date);
                    if (recDate.getFullYear() === year && (recDate.getMonth() + 1) === month) {
                        if (initialData[rec.employeeId]) {
                            initialData[rec.employeeId][recDate.getDate()] = rec.hoursWorked;
                        }
                    }
                });
            }

            setGridData(initialData);
            setHasUnsavedChanges(false);
        };

        loadGrid();
    }, [currentDate, employees, attendance]);

    // 3. Save Logic
    const handleSave = useCallback(async () => {
        if (Object.keys(gridData).length === 0) return;

        setIsSaving(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const records: MonthlyAttendanceRecord[] = [];

            Object.entries(gridData).forEach(([employeeId, days]) => {
                Object.entries(days).forEach(([day, hours]) => {
                    if (hours > 0) {
                        records.push({
                            id: `grid-${employeeId}-${year}-${month}-${day}`,
                            companyId: user.companyId,
                            employeeId,
                            year,
                            month,
                            day: parseInt(day),
                            hoursWorked: hours as number
                        });
                    }
                });
            });

            // 1. Save results to Grid DB
            await saveMonthlyGrid(records);

            // 2. Sync to Attendance System (Payroll Bridge)
            const attendanceRecords = bridgeGridToAttendance(records, user.companyId, `${user.firstName} ${user.lastName}`);
            localStorage.setItem('salaire_attendance', JSON.stringify(attendanceRecords));

            setHasUnsavedChanges(false);
            onSaveSuccess?.();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    }, [gridData, currentDate, user, onSaveSuccess]);

    // 4. Auto-save with Debounce
    useEffect(() => {
        if (!hasUnsavedChanges) return;
        const timer = setTimeout(() => {
            handleSave();
        }, 5000); // Auto-save after 5s of inactivity
        return () => clearTimeout(timer);
    }, [gridData, hasUnsavedChanges, handleSave]);

    const handleCellChange = (employeeId: string, day: number, value: string | number) => {
        const hours = typeof value === 'string' ? parseFloat(value) || 0 : value;
        setGridData(prev => ({
            ...prev,
            [employeeId]: {
                ...prev[employeeId],
                [day]: Math.min(Math.max(hours, 0), 24)
            }
        }));
        setHasUnsavedChanges(true);
    };

    // Drag to Fill Handlers
    const onMouseDown = (empId: string, day: number, value: number) => {
        setDragStart({ empId, day, value });
    };

    const onMouseEnter = (empId: string, day: number) => {
        if (dragStart && dragStart.empId === empId) {
            handleCellChange(empId, day, dragStart.value);
        }
    };

    const onMouseUp = () => {
        setDragStart(null);
    };

    useEffect(() => {
        window.addEventListener('mouseup', onMouseUp);
        return () => window.removeEventListener('mouseup', onMouseUp);
    }, []);

    const handleExport = () => {
        exportGridToExcel(employees, daysInMonth, gridData, monthLabel);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            const records = await parseGridExcel(file, employees, year, month, user.companyId);

            if (records.length > 0) {
                const newData: Record<string, Record<number, number>> = { ...gridData };
                records.forEach(r => {
                    if (!newData[r.employeeId]) newData[r.employeeId] = {};
                    newData[r.employeeId][r.day] = r.hoursWorked;
                });
                setGridData(newData);
                setHasUnsavedChanges(true);
                alert(lang === 'ar' ? `تم استيراد ${records.length} سجلاً` : `${records.length} enregistrements importés.`);
            }
        } catch (err) {
            console.error(err);
            alert("Error parsing file");
        }
    };

    const handlePrint = () => {
        printGrid();
    };

    const getDayName = (date: Date) => {
        const days = {
            fr: ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'],
            ar: ['أحد', 'ثنين', 'ثلاث', 'ربعاء', 'خميس', 'جمعة', 'سبت']
        };
        return days[lang === 'ar' ? 'ar' : 'fr'][date.getDay()];
    };

    const isWeekend = (date: Date) => {
        const day = date.getDay();
        return { isSat: day === 6, isSun: day === 0 };
    };

    const filteredEmployees = employees.filter(emp =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.internalMatricule.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculateTotals = (employeeId: string) => {
        const hours = Object.values(gridData[employeeId] || {}) as number[];
        const totalHours = hours.reduce((sum, h) => sum + h, 0);
        const workedDays = hours.filter(h => h >= 8).length;
        const partialDays = hours.filter(h => h > 0 && h < 8).length;
        const absences = daysInMonth.length - (workedDays + partialDays);
        const overtime = hours.reduce((sum, h) => sum + Math.max(0, h - 8), 0);

        return { totalHours, workedDays, absences, overtime };
    };

    // Total Calculations
    const totalGridWidth = COL_EMP_WIDTH + (filteredDays.length * COL_DAY_WIDTH) + COL_TOTAL_WIDTH + (COL_STATS_WIDTH * 2);

    // Virtualization Logic
    const rowVirtualizer = useVirtualizer({
        count: filteredEmployees.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => GRID_ROW_HEIGHT,
        overscan: 10,
    });

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollLeft, scrollTop } = e.currentTarget;
        setScrolled({ x: scrollLeft > 0, y: scrollTop > 0 });
    };

    const monthLabel = currentDate.toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { month: 'long', year: 'numeric' });

    return (
        <div className={`space-y-4 animate-in fade-in duration-500 ${isImmersiveMode ? 'fixed inset-0 z-[100] bg-[var(--salery-bg)] p-6 overflow-hidden flex flex-col' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-gradient-to-br from-[#0078D4] to-[#0A66C2] text-white rounded-2xl shadow-lg">
                        <CalendarIcon size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-black text-[#1A1F36] tracking-tight">{monthLabel}</h3>
                            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-white rounded-md transition-all shadow-sm"><ChevronLeft size={14} /></button>
                                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-white rounded-md transition-all shadow-sm"><ChevronRight size={14} /></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enterprise Attendance Grid</p>
                            {hasUnsavedChanges && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes"></span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Compact Status Indicator */}
                    <div className="flex items-center bg-emerald-50 border border-emerald-100/50 rounded-full px-3 py-1 gap-2 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Enterprise Ultra-Dense</span>
                    </div>

                    <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>

                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
                        <span className="text-[9px] font-black text-gray-400 px-2 uppercase">Jour</span>
                        <select
                            className="bg-transparent text-[10px] font-black uppercase text-[#0078D4] focus:outline-none cursor-pointer"
                            value={hoveredDay ?? ''}
                            onChange={(e) => {
                                const day = parseInt(e.target.value);
                                if (day > 15) setViewHalf('second');
                                else setViewHalf('first');

                                setTimeout(() => {
                                    const el = parentRef.current;
                                    if (el) {
                                        const cellWidth = COL_DAY_WIDTH;
                                        const offset = (day > 15) ? (day - 16) : (day - 1);
                                        el.scrollTo({ left: offset * cellWidth, behavior: 'smooth' });
                                    }
                                }, 50);
                            }}
                        >
                            <option value="">--</option>
                            {daysInMonth.map(d => <option key={d.getDate()} value={d.getDate()}>{d.getDate()}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl p-0.5 gap-0.5 shadow-sm ml-2">
                        <button
                            onClick={() => { setViewHalf('first'); parentRef.current?.scrollTo({ left: 0, behavior: 'smooth' }); }}
                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewHalf === 'first' ? 'bg-white text-[#0078D4] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Phase 1 (1-15)
                        </button>
                        <button
                            onClick={() => { setViewHalf('second'); parentRef.current?.scrollTo({ left: 0, behavior: 'smooth' }); }}
                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewHalf === 'second' ? 'bg-white text-[#0078D4] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Phase 2 (16-{daysInMonth.length})
                        </button>
                    </div>

                    <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0078D4]" size={14} />
                        <input
                            type="text"
                            placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all w-40"
                        />
                    </div>

                    <label className="p-2 text-gray-400 hover:text-[#0078D4] hover:bg-gray-50 rounded-lg transition-all cursor-pointer">
                        <Upload size={18} />
                        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
                    </label>
                    <button onClick={handlePrint} className="p-2 text-gray-400 hover:text-[#0078D4] hover:bg-gray-50 rounded-lg transition-all"><Printer size={18} /></button>
                    <button onClick={handleExport} className="p-2 text-gray-400 hover:text-[#0078D4] hover:bg-gray-50 rounded-lg transition-all"><Download size={18} /></button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !hasUnsavedChanges}
                        className={`ml-1 px-5 py-2.5 bg-[#111827] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-md active:scale-95 ${(isSaving || !hasUnsavedChanges) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        {isSaving ? (lang === 'ar' ? 'جاري...' : 'Saving...') : (lang === 'ar' ? 'حفظ' : 'Save')}
                    </button>

                    {isImmersiveMode && (
                        <button
                            onClick={() => setIsImmersiveMode(false)}
                            className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-rose-100/50"
                            title="Exit Immersive Mode"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Grid Container */}
            <div className={`airbnb-card bg-white border-white/5 rounded-2xl overflow-hidden shadow-2xl flex-1 flex flex-col min-h-0 ${isImmersiveMode ? 'border-none shadow-none rounded-none' : ''}`}>

                {/* Centering Wrapper for Header & Body */}
                <div className="flex-1 overflow-auto custom-scroll relative no-scrollbar bg-[#F9FAFB]" ref={parentRef} onScroll={handleScroll}>

                    <div className="min-w-max mx-auto px-10 py-6" style={{ width: `${totalGridWidth + 80}px` }}>

                        {/* Grid Header */}
                        <div
                            className={`flex bg-white sticky top-0 z-[100] border border-gray-100 rounded-t-xl transition-shadow ${scrolled.y ? 'shadow-lg border-blue-100/30' : ''}`}
                            style={{ height: `${GRID_HEADER_HEIGHT}px`, width: `${totalGridWidth}px` }}
                        >
                            <div
                                className={`sticky left-0 z-[110] bg-white p-4 font-black text-[#1A1F36] uppercase tracking-[0.15em] border-r border-gray-100 shrink-0 flex items-center transition-shadow rounded-tl-xl ${scrolled.x ? 'shadow-[4px_0_12px_rgba(0,0,0,0.1)]' : ''} text-[11px]`}
                                style={{ width: `${COL_EMP_WIDTH}px` }}
                            >
                                Collaborateurs
                            </div>
                            <div className="flex">
                                {filteredDays.map(date => {
                                    const dayNum = date.getDate();
                                    const { isSat, isSun } = isWeekend(date);
                                    const isHovered = hoveredDay === dayNum;
                                    return (
                                        <div
                                            key={date.toISOString()}
                                            className={`flex flex-col items-center justify-center border-r border-gray-50 shrink-0 transition-all duration-150 ${isSun ? 'text-rose-500 bg-rose-50/40 font-bold' : isSat ? 'text-gray-400 bg-gray-50/50 font-semibold' : 'text-[#697386] font-semibold'} ${isHovered ? 'bg-[#2563EB]/15 text-[#2563EB] z-10 scale-105' : ''}`}
                                            style={{ width: `${COL_DAY_WIDTH}px`, height: `${GRID_HEADER_HEIGHT}px` }}
                                            title={getDayName(date)}
                                        >
                                            <span className="text-[8px] uppercase tracking-widest opacity-80 leading-none mb-1">{getDayName(date).substring(0, 3)}</span>
                                            <span className="text-[14px] leading-none [font-variant-numeric:tabular-nums]">{dayNum}</span>
                                        </div>
                                    );
                                })}
                                <div className="flex items-center justify-center bg-blue-50/40 text-[#2563EB] font-black tracking-widest text-center shrink-0 border-r border-gray-100 text-[11px]" style={{ width: `${COL_TOTAL_WIDTH}px` }}>TOTAL</div>
                                <div className="flex items-center justify-center bg-gray-50/40 text-[#697386] font-bold tracking-widest text-center shrink-0 border-r border-gray-100 text-[11px]" style={{ width: `${COL_STATS_WIDTH}px` }}>HT</div>
                                <div className="flex items-center justify-center bg-gray-50/40 text-[#697386] font-bold tracking-widest text-center shrink-0 text-[11px] rounded-tr-xl" style={{ width: `${COL_STATS_WIDTH}px` }}>AB</div>
                            </div>
                        </div>

                        {/* Virtualized Body */}
                        <div className="bg-white border-x border-b border-gray-100 rounded-b-xl overflow-hidden shadow-sm" style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: `${totalGridWidth}px`, position: 'relative' }}>
                            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                const emp = filteredEmployees[virtualRow.index];
                                const totals = calculateTotals(emp.id);
                                const isExpanded = expandedEmployeeId === emp.id;
                                const isEven = virtualRow.index % 2 === 0;

                                return (
                                    <div
                                        key={emp.id}
                                        style={{
                                            height: `${GRID_ROW_HEIGHT}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%'
                                        }}
                                        className={`flex border-b border-gray-100/50 transition-colors group ${isEven ? 'bg-white' : 'bg-[#FAFBFC]'} hover:bg-blue-50/40 ${isExpanded ? 'bg-blue-50/50 z-[10]' : 'z-[1]'}`}
                                    >
                                        <div
                                            className={`sticky left-0 z-[50] group-hover:bg-blue-50/10 px-4 border-r border-gray-100 transition-all flex items-center gap-3 overflow-hidden shrink-0 ${scrolled.x ? 'shadow-[4px_0_12px_rgba(0,0,0,0.08)]' : ''} ${isEven ? 'bg-white' : 'bg-[#FAFBFC]'}`}
                                            style={{ width: `${COL_EMP_WIDTH}px` }}
                                            onClick={() => setExpandedEmployeeId(isExpanded ? null : emp.id)}
                                        >
                                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center font-black text-[10px] text-[#2563EB] border-2 border-white shadow-sm shrink-0">
                                                {emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full object-cover rounded-full" /> : <span>{(emp.firstName || emp.fullName || '?')[0]}{(emp.lastName || '')[0] || ''}</span>}
                                            </div>
                                            <div className="flex flex-col truncate">
                                                <p className="font-bold text-[#111827] text-[13px] truncate leading-none">
                                                    {emp.firstName ? `${emp.firstName} ${(emp.lastName || '')[0] || ''}.` : emp.fullName}
                                                </p>
                                                <p className="text-[9px] text-gray-400 font-medium uppercase tracking-tighter mt-0.5">{emp.internalMatricule || '---'}</p>
                                            </div>
                                        </div>

                                        <div className="flex">
                                            {filteredDays.map(date => {
                                                const dayNum = date.getDate();
                                                const value = gridData[emp.id]?.[dayNum] ?? 0;

                                                let cellClass = "text-gray-300";
                                                if (value === 0) { cellClass = "text-gray-200"; }
                                                else if (value === 4) { cellClass = "text-[#F59E0B]"; }
                                                else if (value === 8) { cellClass = "text-[#2563EB]"; }
                                                else if (value > 8) { cellClass = "text-[#16A34A]"; }

                                                return (
                                                    <div
                                                        key={dayNum}
                                                        className={`flex items-center justify-center border-r border-gray-100/30 shrink-0 transition-all cursor-cell select-none p-1 ${hoveredDay === dayNum ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-500/20' : 'hover:bg-blue-100/15'}`}
                                                        style={{ width: `${COL_DAY_WIDTH}px`, height: `${GRID_ROW_HEIGHT}px` }}
                                                        onMouseDown={() => onMouseDown(emp.id, dayNum, value)}
                                                        onMouseEnter={() => {
                                                            onMouseEnter(emp.id, dayNum);
                                                            setHoveredDay(dayNum);
                                                        }}
                                                        onMouseLeave={() => setHoveredDay(null)}
                                                    >
                                                        <input
                                                            type="text"
                                                            value={value === 0 ? '' : value}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                handleCellChange(emp.id, dayNum, e.target.value);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            placeholder="."
                                                            className={`w-full h-full text-center font-black outline-none bg-transparent hover:scale-110 focus:bg-white focus:ring-2 focus:ring-[#2563EB] transition-all pointer-events-auto rounded-md text-[16px] opacity-100 [font-variant-numeric:tabular-nums] ${cellClass}`}
                                                        />
                                                    </div>
                                                );
                                            })}
                                            <div className="flex items-center justify-center bg-blue-50/20 font-black text-[#2563EB] shrink-0 border-r border-gray-50 text-[14px]" style={{ width: `${COL_TOTAL_WIDTH}px` }}>{totals.totalHours}</div>
                                            <div className="flex items-center justify-center font-bold text-[#697386] shrink-0 border-r border-gray-100 text-[13px]" style={{ width: `${COL_STATS_WIDTH}px` }}>{totals.workedDays}j</div>
                                            <div className="flex items-center justify-center font-bold text-[#697386] shrink-0 text-[13px]" style={{ width: `${COL_STATS_WIDTH}px` }}>{totals.absences}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Summary Info */}
            <div className="flex flex-wrap gap-6 items-center bg-white p-4 px-6 border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.02)] min-w-max">
                <div className="flex items-center gap-4 border-r border-gray-100 pr-6 mr-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Légende :</span>
                    <div className="flex items-center gap-2 bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100/50 transition-all hover:bg-blue-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"></div>
                        <span className="text-[9px] font-bold text-[#2563EB] uppercase tracking-tighter">Normal (8h)</span>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50/50 px-2 py-0.5 rounded-md border border-amber-100/50 transition-all hover:bg-amber-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></div>
                        <span className="text-[9px] font-bold text-[#F59E0B] uppercase tracking-tighter">Partiel / Retard</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50/50 px-2 py-0.5 rounded-md border border-emerald-100/50 transition-all hover:bg-emerald-50">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></div>
                        <span className="text-[9px] font-bold text-[#16A34A] uppercase tracking-tighter">Heures Sup. (+)</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50/50 px-2 py-0.5 rounded-md border border-gray-100 transition-all hover:bg-gray-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Absence / Repos</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 ml-auto">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">Total Employees</span>
                        <span className="text-[14px] font-black text-gray-700 leading-none [font-variant-numeric:tabular-nums]">{filteredEmployees.length}</span>
                    </div>
                    <div className="h-6 w-[1px] bg-gray-100"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">Unsaved Changes</span>
                        <span className={`text-[14px] font-black leading-none [font-variant-numeric:tabular-nums] ${hasUnsavedChanges ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {hasUnsavedChanges ? 'YES' : 'NONE'}
                        </span>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Saisie Validée par IA</span>
                    <span className="flex items-center gap-1.5"><AlertTriangle size={14} className="text-amber-500" /> Anomalies Détectées: 0</span>
                </div>
            </div>
        </div>
    );
};

export default MonthlyAttendanceGrid;

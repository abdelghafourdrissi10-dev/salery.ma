import React, { useState, useMemo } from 'react';
import {
    X, History, Search, ShieldAlert, CheckCircle2,
    Users, Building2, UserX, UserCheck, AlertTriangle
} from 'lucide-react';
import { Employee, Site, AuthUser, Language, AttendanceRecord } from '../types';

export type TargetStrategy = 'single' | 'multiple' | 'all' | 'site' | 'exclude';

interface Props {
    user: AuthUser;
    lang: Language;
    employees: Employee[];
    sites: Site[];
    onClose: () => void;
    onSave: (records: any[]) => void;
}

const BulkAttendanceModal: React.FC<Props> = ({ user, lang, employees, sites, onClose, onSave }) => {
    const [strategy, setStrategy] = useState<TargetStrategy>('single');

    // Selections
    const [singleId, setSingleId] = useState<string>('');
    const [multiIds, setMultiIds] = useState<string[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState<string>('');
    const [excludeIds, setExcludeIds] = useState<string[]>([]);

    // Form Data
    const [manualData, setManualData] = useState({
        date: new Date().toISOString().split('T')[0],
        checkIn: '08:00',
        checkOut: '17:00',
        reason: ''
    });

    const t = {
        fr: {
            title: "Pointage Manuel Multi-Cibles",
            sub: "Créez des entrées de pointage pour un ou plusieurs collaborateurs en une seule action.",
            target: "Appliquer à :",
            strategies: {
                single: "Employé spécifique",
                multiple: "Plusieurs employés",
                all: "Tous les employés",
                site: "Par site",
                exclude: "Tous sauf..."
            },
            searchEmp: "Rechercher...",
            selectSite: "Sélectionner un site...",
            btnSave: "CONFIRMER L'OPÉRATION",
            preview: "Aperçu de l'impact",
            warningMissing: "Justification obligatoire pour les actions de masse ou anomalies d'heures.",
            count: "collaborateurs impactés"
        },
        ar: {
            title: "تسجيل حضور متعدد الأهداف",
            sub: "قم بإنشاء سجلات حضور لموظف واحد أو أكثر في إجراء واحد.",
            target: "التطبيق على:",
            strategies: {
                single: "موظف محدد",
                multiple: "عدة موظفين",
                all: "جميع الموظفين",
                site: "حسب الموقع",
                exclude: "الجميع باستثناء..."
            },
            searchEmp: "بحث...",
            selectSite: "اختر موقعاً...",
            btnSave: "تأكيد العملية",
            preview: "معاينة التأثير",
            warningMissing: "التبرير مطلوب للإجراءات الجماعية أو الساعات غير الطبيعية.",
            count: "موظفين متأثرين"
        }
    }[lang === 'ar' ? 'ar' : 'fr'];

    // Calculate impacted employees
    const previewEmployees = useMemo(() => {
        let filtered = [...employees];

        // Si Manager, limiter à son équipe/site (simplifié ici par sécurité de base)
        if (user.role === 'MANAGER' && user.assignedSite) {
            filtered = filtered.filter(e => e.assignedSite === user.assignedSite);
        }

        switch (strategy) {
            case 'single':
                return filtered.filter(e => e.id === singleId);
            case 'multiple':
                return filtered.filter(e => multiIds.includes(e.id));
            case 'all':
                return filtered;
            case 'site':
                const site = sites.find(s => s.id === selectedSiteId);
                if (!site) return [];
                return filtered.filter(e => e.assignedSite === site.name);
            case 'exclude':
                return filtered.filter(e => !excludeIds.includes(e.id));
            default:
                return [];
        }
    }, [strategy, employees, singleId, multiIds, selectedSiteId, excludeIds, user, sites]);


    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (previewEmployees.length === 0) return;

        // Check justification requirement
        const ci = new Date(`${manualData.date}T${manualData.checkIn}`);
        const co = new Date(`${manualData.date}T${manualData.checkOut}`);
        const hours = (co.getTime() - ci.getTime()) / (1000 * 60 * 60);

        const isAbnormal = hours < 6 || hours > 10;
        const isBulk = previewEmployees.length > 1;

        const records = previewEmployees.map(emp => ({
            employeeId: emp.id,
            date: manualData.date,
            checkIn: `${manualData.date}T${manualData.checkIn}:00`,
            checkOut: `${manualData.date}T${manualData.checkOut}:00`,
            reason: manualData.reason,
            status: 'pending',
            type: 'manual',
            hoursWorked: hours,
            riskLevel: isAbnormal ? 'HIGH' : 'LOW'
        }));

        onSave(records);
    };

    const toggleMultiSelect = (empId: string, isExclude = false) => {
        const list = isExclude ? excludeIds : multiIds;
        const setList = isExclude ? setExcludeIds : setMultiIds;
        if (list.includes(empId)) setList(list.filter(id => id !== empId));
        else setList([...list, empId]);
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-auto max-h-[80vh]">

                {/* 1. COMPACT HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
                    <h3 className="text-lg font-bold text-[#1A1F36]">{t.title}</h3>
                    {previewEmployees.length > 0 && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold ml-auto mr-4">
                            <CheckCircle2 size={14} />
                            {previewEmployees.length} {t.count}
                        </div>
                    )}
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0 bg-[#F7F9FC]">

                    {/* LEFT COLUMN: TARGETING */}
                    <div className="w-full md:w-[260px] lg:w-[300px] border-r border-[#E3E8EE] flex flex-col min-h-0 bg-[#F7F9FC] shrink-0">
                        <div className="p-4 overflow-y-auto custom-scroll max-h-full">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.target}</p>

                            {/* COMPACT RADIO LIST */}
                            <div className="space-y-1 mb-4">
                                {(Object.keys(t.strategies) as TargetStrategy[]).map(s => (
                                    <label key={s} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-white transition-colors group">
                                        <input type="radio" checked={strategy === s} onChange={() => setStrategy(s)} className="hidden" />
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${strategy === s ? 'border-[#0078D4]' : 'border-gray-300 group-hover:border-gray-400'}`}>
                                            {strategy === s && <div className="w-2 h-2 rounded-full bg-[#0078D4]" />}
                                        </div>
                                        <span className={`text-sm ${strategy === s ? 'font-bold text-[#1A1F36]' : 'text-gray-600'}`}>{t.strategies[s]}</span>
                                    </label>
                                ))}
                            </div>

                            {/* DYNAMIC SELECTOR CONTENT */}
                            {strategy === 'single' && (
                                <select value={singleId} onChange={e => setSingleId(e.target.value)} className="w-full p-2.5 bg-white border border-[#E3E8EE] rounded-lg text-sm outline-none focus:border-[#0078D4]">
                                    <option value="">{t.searchEmp}</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                                </select>
                            )}

                            {strategy === 'site' && (
                                <select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} className="w-full p-2.5 bg-white border border-[#E3E8EE] rounded-lg text-sm outline-none focus:border-[#0078D4]">
                                    <option value="">{t.selectSite}</option>
                                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            )}

                            {(strategy === 'multiple' || strategy === 'exclude') && (
                                <div className="bg-white border border-[#E3E8EE] rounded-lg flex flex-col max-h-[200px] overflow-hidden">
                                    <input type="text" placeholder={t.searchEmp} className="w-full bg-gray-50 px-3 py-2 text-xs outline-none border-b border-gray-100" />
                                    <div className="flex-1 overflow-y-auto p-1 custom-scroll">
                                        {employees.map(e => {
                                            const isSelected = strategy === 'exclude' ? excludeIds.includes(e.id) : multiIds.includes(e.id);
                                            return (
                                                <label key={e.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-md cursor-pointer">
                                                    <input type="checkbox" checked={isSelected} onChange={() => toggleMultiSelect(e.id, strategy === 'exclude')} className="w-3.5 h-3.5 rounded text-[#0078D4]" />
                                                    <div className="text-start min-w-0">
                                                        <p className="text-xs font-medium text-[#1A1F36] truncate">{e.fullName}</p>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {strategy === 'all' && (
                                <div className="p-3 bg-blue-50/50 rounded-lg text-start flex items-start gap-2 border border-blue-100/50">
                                    <AlertTriangle className="text-blue-500 shrink-0 mt-0.5" size={14} />
                                    <p className="text-xs text-blue-700 leading-tight">Action globale sur tous les employés actifs.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: DATA FORM */}
                    <div className="flex-1 flex flex-col min-h-0 bg-white">
                        <form onSubmit={handleSave} className="flex flex-col h-full min-h-0 relative">
                            <div className="flex-1 p-6 overflow-y-auto custom-scroll space-y-5">

                                {/* 4. INLINE FORM: Date, Arrivée, Départ */}
                                <div className="flex space-x-3">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date</label>
                                        <input autoFocus required type="date" value={manualData.date} onChange={(e) => setManualData({ ...manualData, date: e.target.value })} className="w-full h-10 px-3 bg-[#F7F9FC] border border-[#E3E8EE] rounded-lg text-sm font-medium focus:bg-white focus:border-[#0078D4] outline-none transition-colors" />
                                    </div>
                                    <div className="w-28 shrink-0">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Arrivée</label>
                                        <input required type="time" value={manualData.checkIn} onChange={(e) => setManualData({ ...manualData, checkIn: e.target.value })} className="w-full h-10 px-3 bg-[#F7F9FC] border border-[#E3E8EE] rounded-lg text-sm font-medium focus:bg-white focus:border-[#0078D4] outline-none transition-colors" />
                                    </div>
                                    <div className="w-28 shrink-0">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Départ</label>
                                        <input required type="time" value={manualData.checkOut} onChange={(e) => setManualData({ ...manualData, checkOut: e.target.value })} className="w-full h-10 px-3 bg-[#F7F9FC] border border-[#E3E8EE] rounded-lg text-sm font-medium focus:bg-white focus:border-[#0078D4] outline-none transition-colors" />
                                    </div>
                                </div>

                                {/* 5. REASON */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Justification</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Ex: Oubli de scan groupé, Travail extérieur..."
                                        value={manualData.reason}
                                        onChange={(e) => setManualData({ ...manualData, reason: e.target.value })}
                                        className="w-full h-[70px] p-3 bg-[#F7F9FC] border border-[#E3E8EE] rounded-lg text-sm font-medium focus:bg-white focus:border-[#0078D4] outline-none resize-none transition-colors"
                                    />
                                </div>

                                {/* PREVIEW BADGE FOR MOBILE */}
                                {previewEmployees.length > 0 && (
                                    <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold w-full justify-center mt-4">
                                        <CheckCircle2 size={16} />
                                        {previewEmployees.length} {t.count}
                                    </div>
                                )}
                            </div>

                            {/* 6. STICKY ACTION BAR */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
                                <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={previewEmployees.length === 0}
                                    className="px-6 py-2.5 bg-[#0078D4] hover:bg-[#006CBE] text-white rounded-lg font-bold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <CheckCircle2 size={16} /> {t.btnSave}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkAttendanceModal;

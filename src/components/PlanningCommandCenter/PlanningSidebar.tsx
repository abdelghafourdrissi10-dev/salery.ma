import React from 'react';
import {
    X, Clock, User, CheckCircle2, AlertCircle,
    Trash2, MessageSquare, History, ArrowRight, Share2, Printer
} from 'lucide-react';
import { PlanningItem, PlanningType, PlanningPriority, Language } from '../../types';

interface Props {
    lang: Language;
    item: PlanningItem | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<PlanningItem>) => void;
    onDelete: (id: string) => void;
}

const PlanningSidebar: React.FC<Props> = ({
    lang, item, isOpen, onClose, onUpdate, onDelete
}) => {
    if (!item) return null;

    const typeData: Record<PlanningType, { label: string, color: string, icon: any }> = {
        TASK: { label: 'TÂCHE', color: 'blue', icon: CheckCircle2 },
        ALERT: { label: 'ALERTE RH', color: 'rose', icon: AlertCircle },
        EVENT: { label: 'ÉVÉNEMENT', color: 'emerald', icon: ArrowRight },
        NOTE: { label: 'NOTE', color: 'slate', icon: History },
    };

    const statusColors = {
        PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
        IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-100',
        DONE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-[1100] bg-black/5 backdrop-blur-[2px] transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={onClose}
            />

            <aside className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[1200] shadow-[-10px_0_40px_rgba(0,0,0,0.08)] border-l border-gray-100 transition-all duration-500 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                <div className="h-full flex flex-col">

                    {/* SIDEBAR HEADER */}
                    <header className={`p-8 pb-10 border-b border-gray-50 relative overflow-hidden bg-${typeData[item.type].color}-50/30`}>
                        <button onClick={onClose} className="absolute top-6 right-6 p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-rose-500 hover:border-rose-100 rounded-xl transition-all shadow-sm">
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-current opacity-70 ${item.type === 'ALERT' ? 'text-rose-600' :
                                item.type === 'EVENT' ? 'text-emerald-600' : 'text-blue-600'
                                }`}>
                                {typeData[item.type].label}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${statusColors[item.status]}`}>
                                {item.status}
                            </span>
                        </div>

                        <h2 className="text-2xl font-black text-[#111827] leading-tight mb-2 pr-12">{item.title}</h2>
                        <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400">
                            <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                                <Clock size={12} />
                                <span>{new Date(item.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                                <User size={12} />
                                <span>#{item.id.slice(0, 8)}</span>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 overflow-auto p-8 space-y-10 custom-scroll">

                        {/* ACTIONS BAR */}
                        <div className="flex gap-2">
                            {item.status !== 'DONE' ? (
                                <button
                                    onClick={() => onUpdate(item.id, { status: 'DONE' })}
                                    className="flex-1 py-4 bg-[#0078D4] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <CheckCircle2 size={18} /> Marquer Terminé
                                </button>
                            ) : (
                                <button
                                    onClick={() => onUpdate(item.id, { status: 'PENDING' })}
                                    className="flex-1 py-4 bg-gray-50 text-gray-600 border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white transition-all"
                                >
                                    Réouvrir la Tâche
                                </button>
                            )}
                            <button
                                onClick={() => onDelete(item.id)}
                                className="p-4 bg-rose-50 text-rose-500 border border-rose-100 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        {/* DESCRIPTION */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#111827]">Description Étendue</h3>
                                <button className="text-[9px] font-bold text-blue-600 hover:underline">Modifier</button>
                            </div>
                            <div className="p-6 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                                <p className="text-[13px] font-medium text-gray-600 leading-relaxed italic">
                                    "{item.description || 'Aucune description fournie.'}"
                                </p>
                            </div>
                        </section>

                        {/* MESSAGING PREVIEW */}
                        <section className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[#111827]">Collaboration & Activity</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white shadow-sm" />
                                    <div className="flex-1 p-4 bg-indigo-50/30 rounded-2xl rounded-tl-none border border-indigo-50">
                                        <p className="text-[11px] font-medium text-indigo-900 leading-normal">
                                            Système: Alerte absence détectée via scan biometric.
                                        </p>
                                        <span className="text-[9px] font-bold text-indigo-400 mt-2 block">Il y a 2 heures</span>
                                    </div>
                                </div>

                                <div className="relative">
                                    <textarea
                                        placeholder="Ajouter une note ou un message..."
                                        className="w-full p-4 pr-12 bg-white border border-gray-100 rounded-2xl text-[12px] font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none h-24"
                                    />
                                    <button className="absolute bottom-4 right-4 p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                                        <Share2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </section>

                    </div>

                    <footer className="p-8 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Temps Réel Actif</span>
                        </div>
                        <button className="flex items-center gap-2 text-[10px] font-black text-[#0078D4] border border-[#0078D4]/20 px-4 py-2 rounded-xl transition-all hover:bg-blue-50">
                            <Printer size={14} /> Fiche Tâche
                        </button>
                    </footer>

                </div>

            </aside>
        </>
    );
};

export default PlanningSidebar;

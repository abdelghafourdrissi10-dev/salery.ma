import React, { useState } from 'react';
import { X, Save, Trash2, Calendar, User, Users, Flag, Type, AlignLeft } from 'lucide-react';
import { PlanningItem, PlanningType, PlanningPriority, Language } from '../../types';

const uuidv4 = () => crypto.randomUUID();
import { useAppStore } from '../../store/store';

interface Props {
    lang: Language;
    date: Date | null;
    item?: PlanningItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: PlanningItem) => void;
}

const PlanningModal: React.FC<Props> = ({
    lang, date, item, isOpen, onClose, onSave
}) => {
    const { user } = useAppStore();

    const [title, setTitle] = useState(item?.title || '');
    const [description, setDescription] = useState(item?.description || '');
    const [type, setType] = useState<PlanningType>(item?.type || 'TASK');
    const [priority, setPriority] = useState<PlanningPriority>(item?.priority || 'MEDIUM');
    const [status, setStatus] = useState(item?.status || 'PENDING');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!title.trim() || !user || !date) return;

        const newItem: PlanningItem = {
            id: item?.id || uuidv4(),
            companyId: user.companyId,
            date: date.toISOString().split('T')[0],
            title,
            description,
            type,
            priority,
            status: item?.status || 'PENDING',
            createdById: user.id,
            createdAt: item?.createdAt || Date.now(),
            updatedAt: Date.now(),
        };

        onSave(newItem);
    };

    const t = {
        fr: {
            title: item ? "Modifier l'Élément" : "Nouvel Élément",
            placeholderTitle: "Titre de la tâche ou de l'événement...",
            placeholderDesc: "Description détaillée...",
            type: "Type",
            priority: "Priorité",
            save: "Enregistrer",
            cancel: "Annuler",
        },
        ar: {
            title: item ? "تعديل العنصر" : "عنصر جديد",
            placeholderTitle: "عنوان المهمة أو الحدث...",
            placeholderDesc: "وصف مفصل...",
            type: "النوع",
            priority: "الأولوية",
            save: "حفظ",
            cancel: "إلغاء",
        }
    }[lang === 'ar' ? 'ar' : 'fr'];

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">

                {/* MODAL HEADER */}
                <header className="flex justify-between items-center p-6 border-b border-gray-50">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${type === 'ALERT' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                            type === 'EVENT' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                'bg-blue-50 border-blue-100 text-blue-600'
                            }`}>
                            <Type size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#111827]">{t.title}</h2>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                                {date?.toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-50 rounded-xl transition-all"><X size={20} /></button>
                </header>

                <div className="p-8 space-y-8">

                    {/* TITLE INPUT */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Titre de l'Opération</label>
                        <div className="relative group">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={t.placeholderTitle}
                                className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[14px] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* TYPE SELECTOR */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Nature de l'Élément</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as PlanningType)}
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option value="TASK">📝 TÂCHE</option>
                                <option value="ALERT">🚨 ALERTE RH</option>
                                <option value="EVENT">📅 ÉVÉNEMENT</option>
                                <option value="NOTE">💡 NOTE</option>
                            </select>
                        </div>

                        {/* PRIORITY SELECTOR */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Priorité</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as PlanningPriority)}
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option value="LOW">FAIBLE</option>
                                <option value="MEDIUM">MOYENNE</option>
                                <option value="HIGH">HAUTE</option>
                            </select>
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Détails & Instructions</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t.placeholderDesc}
                            className="w-full h-32 px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all shadow-inner resize-none"
                        />
                    </div>

                </div>

                {/* MODAL FOOTER */}
                <footer className="flex justify-end gap-3 p-6 bg-gray-50/50 border-t border-gray-50">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280] hover:text-[#111827] transition-all"
                    >
                        {t.cancel}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 btn-primary-gradient text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl hover:scale-105 transition-all"
                    >
                        <Save size={16} /> {t.save}
                    </button>
                </footer>

            </div>
        </div>
    );
};

export default PlanningModal;

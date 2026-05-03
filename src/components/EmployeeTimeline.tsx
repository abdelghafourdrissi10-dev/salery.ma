import React, { useEffect, useState } from 'react';
import {
    Clock, FileText, Upload, DollarSign, TrendingUp,
    Building2, UserCircle, Briefcase, Calendar,
    CheckCircle2, Filter
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TimelineEvent {
    id: string;
    type: string;
    title: string;
    description: string | null;
    metadata: Record<string, any> | null;
    createdAt: string;
}

interface Props { employeeId: string; }

// ─── Pure helpers (no external deps) ─────────────────────────────────────────

const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

const getGroup = (iso: string): string => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays <= 7) return 'Cette Semaine';
    if (diffDays <= 30) return 'Ce Mois';
    return 'Plus Ancien';
};

const GROUP_ORDER = ["Aujourd'hui", 'Hier', 'Cette Semaine', 'Ce Mois', 'Plus Ancien'];

const groupEvents = (events: TimelineEvent[]) => {
    const groups: Record<string, TimelineEvent[]> = {};
    events.forEach(e => {
        const g = getGroup(e.createdAt);
        if (!groups[g]) groups[g] = [];
        groups[g].push(e);
    });
    return GROUP_ORDER.filter(g => groups[g]?.length).map(g => ({ label: g, events: groups[g] }));
};

// ─── Icon & color maps ────────────────────────────────────────────────────────

const iconFor = (type: string) => {
    const cls = "shrink-0";
    switch (type) {
        case 'EMPLOYEE_CREATED': return <UserCircle size={18} className={cls + " text-emerald-500"} />;
        case 'DOCUMENT_UPLOADED':
        case 'CONTRACT_UPLOADED': return <FileText size={18} className={cls + " text-blue-500"} />;
        case 'SALARY_UPDATED': return <DollarSign size={18} className={cls + " text-emerald-600"} />;
        case 'PROMOTION': return <TrendingUp size={18} className={cls + " text-purple-500"} />;
        case 'DEPARTMENT_CHANGED': return <Building2 size={18} className={cls + " text-indigo-500"} />;
        case 'ROLE_CHANGED': return <Briefcase size={18} className={cls + " text-indigo-500"} />;
        case 'CHECK_IN': return <CheckCircle2 size={18} className={cls + " text-emerald-500"} />;
        case 'CHECK_OUT': return <Clock size={18} className={cls + " text-gray-400"} />;
        case 'ABSENCE': return <Calendar size={18} className={cls + " text-rose-500"} />;
        case 'VACATION': return <Calendar size={18} className={cls + " text-amber-400"} />;
        default: return <Upload size={18} className={cls + " text-gray-400"} />;
    }
};

const dotColorFor = (type: string): string => {
    if (['CHECK_IN', 'EMPLOYEE_CREATED', 'SALARY_UPDATED'].includes(type)) return 'bg-emerald-100 border-emerald-200';
    if (['DOCUMENT_UPLOADED', 'CONTRACT_UPLOADED'].includes(type)) return 'bg-blue-100 border-blue-200';
    if (['PROMOTION', 'ROLE_CHANGED', 'DEPARTMENT_CHANGED'].includes(type)) return 'bg-purple-100 border-purple-200';
    if (type === 'ABSENCE') return 'bg-rose-100 border-rose-200';
    if (type === 'VACATION') return 'bg-amber-100 border-amber-200';
    return 'bg-gray-100 border-gray-200';
};

// ─── Category filter map ──────────────────────────────────────────────────────

const FILTERS = [
    { id: 'ALL', label: 'Tout' },
    { id: 'ATTENDANCE', label: 'Pointages' },
    { id: 'DOCUMENTS', label: 'Documents' },
    { id: 'SYSTEM', label: 'Système' },
];

const matchesFilter = (type: string, filter: string) => {
    if (filter === 'ALL') return true;
    if (filter === 'ATTENDANCE') return ['CHECK_IN', 'CHECK_OUT', 'ABSENCE', 'VACATION'].includes(type);
    if (filter === 'DOCUMENTS') return ['DOCUMENT_UPLOADED', 'CONTRACT_UPLOADED'].includes(type);
    if (filter === 'SYSTEM') return ['EMPLOYEE_CREATED', 'ROLE_CHANGED', 'DEPARTMENT_CHANGED', 'SALARY_UPDATED', 'PROMOTION'].includes(type);
    return true;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
    <div className="animate-pulse space-y-8">
        {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-16 bg-gray-100 rounded-xl border border-gray-200" />
                </div>
            </div>
        ))}
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmployeeTimeline({ employeeId }: Props) {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem('salery_access_token');
                const res = await fetch(`http://127.0.0.1:3001/api/v1/employees/${employeeId}/timeline`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) setEvents(await res.json());
            } catch { /* fail silently — demo mode */ }
            finally { setLoading(false); }
        };
        load();
    }, [employeeId]);

    if (loading) return <Skeleton />;

    const filtered = events.filter(e => matchesFilter(e.type, filter));
    const grouped = groupEvents(filtered);

    if (events.length === 0) return (
        <div className="py-14 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-14 h-14 bg-white shadow-sm flex items-center justify-center rounded-2xl mx-auto mb-4 border border-gray-100">
                <Clock className="text-gray-300" size={24} />
            </div>
            <p className="font-bold text-gray-700 mb-1">Aucun événement enregistré</p>
            <p className="text-sm text-gray-400">Les actions sur ce profil apparaîtront ici.</p>
        </div>
    );

    return (
        <div className="w-full">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 mb-8 p-2 bg-gray-50 border border-gray-200 rounded-xl overflow-x-auto">
                <div className="flex items-center gap-1.5 px-3 text-gray-400 border-r border-gray-200 shrink-0">
                    <Filter size={13} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filtres</span>
                </div>
                {FILTERS.map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filter === f.id
                            ? 'bg-white shadow-sm border border-gray-200 text-gray-900'
                            : 'text-gray-500 hover:bg-gray-100'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {grouped.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">Aucun événement dans cette catégorie.</p>
            ) : (
                <div className="relative space-y-10">
                    {/* Vertical axis line */}
                    <div className="absolute top-0 bottom-0 left-5 w-px bg-gradient-to-b from-gray-200 via-gray-200 to-transparent pointer-events-none" />

                    {grouped.map(group => (
                        <div key={group.label}>
                            {/* Group header badge */}
                            <div className="ml-12 mb-4">
                                <span className="inline-block text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                    {group.label}
                                </span>
                            </div>

                            <div className="space-y-4">
                                {group.events.map(event => (
                                    <div key={event.id} className="relative flex items-start gap-4 group">
                                        {/* Circle dot */}
                                        <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 bg-white shadow-sm transition-transform group-hover:scale-110 ${dotColorFor(event.type)}`}>
                                            {iconFor(event.type)}
                                        </div>

                                        {/* Card */}
                                        <div className="flex-1 min-w-0 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between gap-3 mb-1">
                                                <h4 className="text-sm font-bold text-gray-900 leading-tight">{event.title}</h4>
                                                <time className="text-[10px] font-semibold text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md border border-gray-100 shrink-0">
                                                    {fmtDate(event.createdAt)}
                                                </time>
                                            </div>

                                            {event.description && (
                                                <p className="text-xs text-gray-500 leading-relaxed mt-1">{event.description}</p>
                                            )}

                                            {/* Metadata chips */}
                                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-3 mt-2 border-t border-gray-50">
                                                    {Object.entries(event.metadata).map(([k, v]) => {
                                                        if (typeof v === 'object' || v == null) return null;
                                                        return (
                                                            <span key={k} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-bold text-gray-600">
                                                                <span className="text-gray-400 uppercase">{k}:</span> {String(v)}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

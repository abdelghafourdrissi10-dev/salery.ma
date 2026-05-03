import React, { useMemo, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle2, ChevronRight, Filter, Download, Eye, Flag, Clock, X } from 'lucide-react';
import { useGlobalStore } from './HistoricalImport';
import { Anomaly, RiskLevel } from '../services/reconstructionEngine';
import * as XLSX from 'xlsx';

type Classification = 'pending' | 'regularized' | 'ignored' | 'escalated';

interface ClassifiedAnomaly extends Anomaly {
    classification: Classification;
    classifiedAt?: number;
    note?: string;
}

const RISK_COLORS: Record<RiskLevel, string> = {
    high: 'text-rose-600 bg-rose-50 border-rose-100',
    medium: 'text-amber-600 bg-amber-50 border-amber-100',
    low: 'text-teal-600 bg-teal-50 border-teal-100',
};
const CLASS_BADGE: Record<Classification, string> = {
    pending: 'text-gray-500 bg-gray-50 border-gray-200',
    regularized: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    ignored: 'text-gray-400 bg-gray-50 border-gray-200',
    escalated: 'text-purple-600 bg-purple-50 border-purple-100',
};
const CLASS_LABEL: Record<Classification, string> = {
    pending: 'En attente', regularized: 'Régularisé', ignored: 'Ignoré', escalated: 'Escaladé RH',
};

const AuditMode: React.FC = () => {
    const { reconstruction } = useGlobalStore();
    const [filterRisk, setFilterRisk] = useState<'all' | RiskLevel>('all');
    const [filterClass, setFilterClass] = useState<'all' | Classification>('all');
    const [classified, setClassified] = useState<Record<string, Classification>>({});
    const [selectedAnomaly, setSelectedAnomaly] = useState<ClassifiedAnomaly | null>(null);

    const anomalies = useMemo<ClassifiedAnomaly[]>(() => {
        if (!reconstruction) return [];
        return reconstruction.anomalies.map(a => ({
            ...a,
            classification: classified[a.id] || 'pending',
        }));
    }, [reconstruction, classified]);

    const filtered = useMemo(() => anomalies.filter(a => {
        if (filterRisk !== 'all' && a.riskLevel !== filterRisk) return false;
        if (filterClass !== 'all' && a.classification !== filterClass) return false;
        return true;
    }), [anomalies, filterRisk, filterClass]);

    const stats = useMemo(() => ({
        total: anomalies.length,
        high: anomalies.filter(a => a.riskLevel === 'high').length,
        pending: anomalies.filter(a => a.classification === 'pending').length,
        regularized: anomalies.filter(a => a.classification === 'regularized').length,
        escalated: anomalies.filter(a => a.classification === 'escalated').length,
    }), [anomalies]);

    const classify = (id: string, cls: Classification) => {
        setClassified(prev => ({ ...prev, [id]: cls }));
        if (selectedAnomaly?.id === id) setSelectedAnomaly(prev => prev ? { ...prev, classification: cls } : null);
    };

    const exportAuditReport = () => {
        const ws = XLSX.utils.json_to_sheet(filtered.map(a => ({
            'Risque': a.riskLevel.toUpperCase(),
            'Employé': a.employeeName,
            'Période': `${a.month}/${a.year}`,
            'Type': a.label,
            'Détail': a.detail,
            'Montant (DH)': a.amount ?? '',
            'Classification RH': CLASS_LABEL[a.classification],
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Rapport Audit');
        XLSX.writeFile(wb, `Salery_Audit_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (!reconstruction) {
        return (
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-20 flex flex-col items-center text-center gap-5">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 border border-gray-200"><Shield size={40} /></div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Audit Mode — Inactif</h3>
                    <p className="text-slate-400 font-medium text-sm mt-1">Lancez la reconstruction pour activer l'audit.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Audit banner */}
            <div className="flex items-center gap-4 bg-slate-900 text-white rounded-[24px] p-6">
                <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
                    <Shield size={22} className="text-slate-900" />
                </div>
                <div className="flex-1">
                    <p className="font-black text-base">Payroll Audit Mode — Actif</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {stats.total} anomalies · {stats.pending} en attente de classification · {stats.regularized} régularisées
                    </p>
                </div>
                <button onClick={exportAuditReport} className="flex items-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all shrink-0">
                    <Download size={13} /> Rapport Audit
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Anomalies', val: stats.total, color: 'text-slate-900' },
                    { label: 'Haut Risque', val: stats.high, color: 'text-rose-600' },
                    { label: 'En Attente', val: stats.pending, color: 'text-amber-600' },
                    { label: 'Régularisées', val: stats.regularized, color: 'text-emerald-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                        <p className={`text-3xl font-black ${s.color} mt-1`}>{s.val}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {(['all', 'high', 'medium', 'low'] as const).map(r => (
                        <button key={r} onClick={() => setFilterRisk(r)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterRisk === r ? 'bg-white shadow-sm text-slate-900' : 'text-gray-400 hover:text-gray-700'}`}>
                            {r === 'all' ? 'Tous' : r}
                        </button>
                    ))}
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {(['all', 'pending', 'regularized', 'escalated', 'ignored'] as const).map(c => (
                        <button key={c} onClick={() => setFilterClass(c)}
                            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterClass === c ? 'bg-white shadow-sm text-slate-900' : 'text-gray-400 hover:text-gray-700'}`}>
                            {c === 'all' ? 'Tous' : CLASS_LABEL[c]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Anomaly list */}
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{filtered.length} Anomalies</p>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center gap-4">
                        <CheckCircle2 size={40} className="text-emerald-300" />
                        <p className="text-gray-400 font-bold">Aucune anomalie dans cette sélection.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map((a, i) => (
                            <div key={i} className={`flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group ${a.classification === 'regularized' ? 'opacity-60' : ''}`}>
                                {/* Risk badge */}
                                <span className={`mt-0.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase border shrink-0 ${RISK_COLORS[a.riskLevel]}`}>
                                    {a.riskLevel}
                                </span>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-black text-slate-900">{a.label}</span>
                                        <span className="text-[10px] font-mono text-gray-400">{a.month}/{a.year}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{a.employeeName} · {a.detail}</p>
                                </div>

                                {/* Classification status */}
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border shrink-0 ${CLASS_BADGE[a.classification]}`}>
                                    {CLASS_LABEL[a.classification]}
                                </span>

                                {/* Actions */}
                                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {a.classification !== 'regularized' && (
                                        <button onClick={() => classify(a.id, 'regularized')}
                                            className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase hover:bg-emerald-100 transition-all">
                                            Régulariser
                                        </button>
                                    )}
                                    {a.classification !== 'escalated' && (
                                        <button onClick={() => classify(a.id, 'escalated')}
                                            className="px-3 py-1.5 bg-purple-50 border border-purple-100 text-purple-600 rounded-lg text-[9px] font-black uppercase hover:bg-purple-100 transition-all">
                                            Escalader
                                        </button>
                                    )}
                                    {a.classification !== 'ignored' && (
                                        <button onClick={() => classify(a.id, 'ignored')}
                                            className="p-1.5 bg-gray-50 border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-100 transition-all">
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditMode;

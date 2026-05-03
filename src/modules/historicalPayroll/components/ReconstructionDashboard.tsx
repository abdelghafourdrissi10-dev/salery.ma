import React, { useState, useEffect } from 'react';
import {
    History, Database, BrainCircuit, FileSpreadsheet,
    Shield, AlertTriangle, FileText, RefreshCw
} from 'lucide-react';
import HistoricalImport, { useGlobalStore } from './HistoricalImport';
import AIAnalysis from './AIAnalysis';
import GrandLivreView from './GrandLivreView';
import BulletinsRetroactifs from './BulletinsRetroactifs';
import AuditMode from './AuditMode';

type TabId = 'import' | 'ai' | 'gl' | 'bulletins' | 'audit';

const ReconstructionDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('import');
    const { result, reconstruction } = useGlobalStore();

    const recordCount = result?.totalRecords ?? 0;
    const employeeCount = result?.employeeCount ?? 0;
    const yearCount = result?.yearRange.length ?? 0;
    const anomalyCount = reconstruction?.anomalies.length ?? 0;
    const highRiskCount = reconstruction?.anomalies.filter(a => a.riskLevel === 'high').length ?? 0;
    const payslipCount = reconstruction?.records.filter(r => r.reconstructionStatus !== 'draft').length ?? 0;

    const tabs = [
        { id: 'import' as const, label: 'Import Historique', icon: <Database size={16} />, badge: recordCount > 0 ? recordCount : null },
        { id: 'ai' as const, label: 'Analyse IA', icon: <BrainCircuit size={16} />, badge: anomalyCount > 0 ? anomalyCount : null, badgeColor: highRiskCount > 0 ? 'bg-rose-500' : 'bg-amber-500' },
        { id: 'gl' as const, label: 'Grand Livre', icon: <FileSpreadsheet size={16} />, badge: null },
        { id: 'bulletins' as const, label: 'Bulletins', icon: <FileText size={16} />, badge: payslipCount > 0 ? payslipCount : null, badgeColor: 'bg-teal-500' },
        { id: 'audit' as const, label: 'Audit Mode', icon: <Shield size={16} />, badge: highRiskCount > 0 ? highRiskCount : null, badgeColor: 'bg-rose-500' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white border border-gray-100 rounded-[32px] shadow-sm p-7">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#0052FF] to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
                        <History size={26} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                                Reconstruction & Audit
                            </h1>
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black tracking-widest uppercase border border-amber-100">
                                Audit Ready
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Historical Payroll Reconstruction Engine v2.0
                        </p>
                    </div>
                </div>

                {/* Live counters */}
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'Enregistrements', val: recordCount, color: 'text-slate-900' },
                        { label: 'Employés', val: employeeCount, color: 'text-indigo-600' },
                        { label: 'Années', val: yearCount, color: 'text-emerald-600' },
                        { label: 'Anomalies', val: anomalyCount, color: anomalyCount > 0 ? 'text-rose-600' : 'text-emerald-600' },
                    ].map(c => (
                        <div key={c.label} className="flex flex-col items-end bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                            <p className={`text-xl font-black leading-none ${c.color}`}>{c.val}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{c.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Tab navigation ─────────────────────────────────────── */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100/60 rounded-[20px] border border-gray-100 w-fit flex-wrap">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-200 relative ${activeTab === tab.id
                            ? 'bg-white text-[#0052FF] shadow-md border border-blue-50'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-white/50'
                            }`}
                    >
                        {tab.icon}
                        <span className="whitespace-nowrap">{tab.label}</span>
                        {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
                            <span className={`min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[8px] font-black text-white ${tab.badgeColor || 'bg-[#0052FF]'}`}>
                                {tab.badge > 99 ? '99+' : tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Content ────────────────────────────────────────────── */}
            <div className="min-h-[500px]">
                {activeTab === 'import' && <HistoricalImport />}
                {activeTab === 'ai' && <AIAnalysis />}
                {activeTab === 'gl' && <GrandLivreView />}
                {activeTab === 'bulletins' && <BulletinsRetroactifs />}
                {activeTab === 'audit' && <AuditMode />}
            </div>
        </div>
    );
};

export default ReconstructionDashboard;

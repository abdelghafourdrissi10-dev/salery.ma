import React, { useMemo } from 'react';
import { BrainCircuit, ShieldAlert, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { useGlobalStore } from './HistoricalImport';
import { AIInsight, Anomaly, RiskLevel } from '../services/reconstructionEngine';

const RISK_COLORS: Record<RiskLevel, string> = {
    high: 'text-rose-600 bg-rose-50 border-rose-100',
    medium: 'text-amber-600 bg-amber-50 border-amber-100',
    low: 'text-emerald-600 bg-emerald-50 border-emerald-100',
};
const RISK_DOT: Record<RiskLevel, string> = {
    high: 'bg-rose-500', medium: 'bg-amber-500', low: 'bg-emerald-500',
};

const AIAnalysis: React.FC = () => {
    const { reconstruction } = useGlobalStore();

    if (!reconstruction) {
        return (
            <EmptyState
                icon={<BrainCircuit size={40} />}
                title="Analyse IA non disponible"
                sub="Importez des données historiques et lancez la reconstruction pour voir l'analyse."
            />
        );
    }

    const { anomalies, aiInsights, riskScore, records } = reconstruction;
    const highRisk = anomalies.filter(a => a.riskLevel === 'high');
    const medRisk = anomalies.filter(a => a.riskLevel === 'medium');
    const lowRisk = anomalies.filter(a => a.riskLevel === 'low');

    const riskColor = riskScore > 60 ? 'text-rose-600' : riskScore > 30 ? 'text-amber-500' : 'text-emerald-500';
    const riskGradient = riskScore > 60 ? 'from-rose-500 to-rose-600' : riskScore > 30 ? 'from-amber-400 to-amber-500' : 'from-emerald-400 to-emerald-500';

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Top row: Risk score + breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Risk gauge */}
                <div className="lg:col-span-1 bg-white border border-gray-100 rounded-[28px] shadow-sm p-8 flex flex-col items-center justify-center gap-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white pointer-events-none rounded-[28px]" />
                    <div className="relative z-10 text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Indice de Risque Fiscal</p>
                        <div className="relative w-28 h-28 mx-auto">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#F1F5F9" strokeWidth="10" />
                                <circle cx="50" cy="50" r="40" fill="none"
                                    stroke={riskScore > 60 ? '#EF4444' : riskScore > 30 ? '#F59E0B' : '#10B981'}
                                    strokeWidth="10"
                                    strokeDasharray={251}
                                    strokeDashoffset={251 - (251 * riskScore / 100)}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-3xl font-black ${riskColor}`}>{riskScore}</span>
                                <span className="text-[9px] font-bold text-gray-400">/100</span>
                            </div>
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-3 ${riskColor}`}>
                            {riskScore > 60 ? '🔴 RISQUE ÉLEVÉ' : riskScore > 30 ? '🟡 VIGILANCE' : '🟢 CONFORME'}
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Anomalies Haut Risque', count: highRisk.length, color: RISK_COLORS.high, dot: RISK_DOT.high },
                        { label: 'Anomalies Moyennes', count: medRisk.length, color: RISK_COLORS.medium, dot: RISK_DOT.medium },
                        { label: 'Anomalies Faibles', count: lowRisk.length, color: RISK_COLORS.low, dot: RISK_DOT.low },
                    ].map(s => (
                        <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</span>
                            </div>
                            <p className={`text-4xl font-black ${s.color.split(' ')[0]}`}>{s.count}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Insights */}
            <div className="bg-slate-900 rounded-[28px] p-8 space-y-5">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-10 h-10 bg-[#0052FF] rounded-xl flex items-center justify-center shadow-lg">
                        <BrainCircuit size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white tracking-tight">Intelligence Audit</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Motifs et observations détectés par l'engine IA</p>
                    </div>
                    <div className="ml-auto px-3 py-1 bg-[#0052FF]/20 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-[#0052FF]/30">
                        {aiInsights.length} Observations
                    </div>
                </div>

                {aiInsights.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <CheckCircle2 size={40} className="text-white/10 mb-4" />
                        <p className="text-slate-500 font-bold text-sm">Aucune observation IA — profil de paie régulier.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {aiInsights.map((insight, i) => (
                            <div key={i} className="flex items-start gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                                <span className="text-xl shrink-0">{insight.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white leading-relaxed">{insight.message}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{insight.employeeName}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border shrink-0 ${RISK_COLORS[insight.riskLevel]}`}>
                                    {insight.riskLevel}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Anomaly table */}
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-8 space-y-5">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Détail des Anomalies Détectées</h4>
                {anomalies.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center">
                        <CheckCircle2 size={36} className="text-emerald-300 mb-3" />
                        <p className="text-gray-400 font-bold">Aucune anomalie détectée sur les données importées.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <th className="px-4 py-3">Risque</th>
                                    <th className="px-4 py-3">Employé</th>
                                    <th className="px-4 py-3">Période</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Détail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {anomalies.map((a, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${RISK_COLORS[a.riskLevel]}`}>
                                                {a.riskLevel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-sm text-slate-900">{a.employeeName || a.employeeId}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.month}/{a.year}</td>
                                        <td className="px-4 py-3 font-bold text-[11px] text-slate-700">{a.label}</td>
                                        <td className="px-4 py-3 text-[11px] text-gray-500 max-w-xs">{a.detail}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const EmptyState = ({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) => (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-20 flex flex-col items-center text-center gap-5">
        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 border border-gray-200">{icon}</div>
        <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-slate-400 font-medium text-sm mt-1 max-w-sm">{sub}</p>
        </div>
    </div>
);

export default AIAnalysis;

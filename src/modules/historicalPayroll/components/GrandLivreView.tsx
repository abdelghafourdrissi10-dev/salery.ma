import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, Download, Filter, Search, TrendingUp, AlertTriangle } from 'lucide-react';
import { useGlobalStore } from './HistoricalImport';
import { generateLedger, ledgerTotals, LedgerEntry } from '../services/accountingGenerator';
import * as XLSX from 'xlsx';

const GrandLivreView: React.FC = () => {
    const { reconstruction } = useGlobalStore();
    const [search, setSearch] = useState('');
    const [filterAccount, setFilterAccount] = useState('all');
    const [showAnomalyOnly, setShowAnomalyOnly] = useState(false);

    const entries = useMemo(() => {
        if (!reconstruction) return [];
        return generateLedger(reconstruction.records);
    }, [reconstruction]);

    const totals = useMemo(() => ledgerTotals(entries), [entries]);

    const filtered = useMemo(() => entries.filter(e => {
        if (showAnomalyOnly && !e.isAnomaly) return false;
        if (filterAccount !== 'all' && e.debitAccount !== filterAccount && e.creditAccount !== filterAccount) return false;
        if (search && !e.employeeName.toLowerCase().includes(search.toLowerCase()) && !e.label.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }), [entries, search, filterAccount, showAnomalyOnly]);

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filtered.map(e => ({
            'Date': e.date, 'Période': e.period, 'Employé': e.employeeName,
            'Référence': e.reference, 'Libellé': e.label,
            'Compte Débit': e.debitAccount, 'Compte Crédit': e.creditAccount,
            'Montant (DH)': e.amount, 'Anomalie': e.isAnomaly ? 'OUI' : '',
        })));
        ws['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 20 }, { wch: 24 }, { wch: 45 }, { wch: 12 }, { wch: 13 }, { wch: 14 }, { wch: 8 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Grand Livre');
        XLSX.writeFile(wb, `Salery_Grand_Livre_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (!reconstruction) {
        return (
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-20 flex flex-col items-center text-center gap-5">
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 border border-gray-200">
                    <FileSpreadsheet size={40} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Grand Livre non disponible</h3>
                    <p className="text-slate-400 font-medium text-sm mt-1">Importez et reconstruisez les données d'abord.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* Summary totals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Brut (6411)', val: totals.totalGross, color: 'text-slate-900' },
                    { label: 'Total CNSS (431)', val: totals.totalCNSS, color: 'text-indigo-600' },
                    { label: 'Total IR (4452)', val: totals.totalIR, color: 'text-amber-600' },
                    { label: 'Lignes Anomalies', val: totals.anomalyLines, color: 'text-rose-600' },
                ].map(s => (
                    <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                        <p className={`text-xl font-black ${s.color} mt-1`}>
                            {typeof s.val === 'number' && s.label !== 'Lignes Anomalies'
                                ? `${s.val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH`
                                : s.val}
                        </p>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher..." className="pl-9 pr-4 py-2 text-xs font-bold bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#0052FF] transition-all w-48" />
                        </div>
                        <select value={filterAccount} onChange={e => setFilterAccount(e.target.value)}
                            className="px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#0052FF] transition-all">
                            <option value="all">Tous les comptes</option>
                            <option value="6411">6411 — Salaires</option>
                            <option value="6412">6412 — Primes</option>
                            <option value="431">431 — CNSS</option>
                            <option value="4452">4452 — IR</option>
                            <option value="421">421 — Dettes</option>
                        </select>
                        <button onClick={() => setShowAnomalyOnly(!showAnomalyOnly)}
                            className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${showAnomalyOnly ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                            <AlertTriangle className="inline mr-1" size={11} /> Anomalies seulement
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400">{filtered.length} lignes</span>
                        <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                            <Download size={13} /> Excel
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-gray-50 z-10">
                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Employé</th>
                                <th className="px-4 py-3">Référence</th>
                                <th className="px-4 py-3">Libellé</th>
                                <th className="px-4 py-3 text-center">Débit</th>
                                <th className="px-4 py-3 text-center">Crédit</th>
                                <th className="px-4 py-3 text-right">Montant</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm font-medium">Aucune écriture trouvée</td></tr>
                            ) : filtered.map((e, i) => (
                                <tr key={i} className={`group transition-colors ${e.isAnomaly ? 'bg-rose-50/30 hover:bg-rose-50' : 'hover:bg-gray-50/50'}`}>
                                    <td className="px-4 py-3 text-xs font-mono text-gray-400 whitespace-nowrap">{e.date}</td>
                                    <td className="px-4 py-3 font-bold text-xs text-slate-900 whitespace-nowrap">{e.employeeName}</td>
                                    <td className="px-4 py-3 font-mono text-[10px] text-gray-400">{e.reference}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600 max-w-[260px] truncate">{e.label}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded font-mono text-[10px] font-bold">{e.debitAccount}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="px-2 py-0.5 bg-purple-50 text-purple-600 border border-purple-100 rounded font-mono text-[10px] font-bold">{e.creditAccount}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-black text-sm text-slate-900 whitespace-nowrap">
                                        {e.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span className="text-gray-400 font-medium text-[10px]">DH</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GrandLivreView;

import React, { useMemo, useState } from 'react';
import {
    FileText, Download, Eye, X, Printer, AlertTriangle,
    CheckCircle2, ChevronLeft, ChevronRight, Building2,
    User, Calendar, Hash, CreditCard, Search, SlidersHorizontal
} from 'lucide-react';
import { useGlobalStore } from './HistoricalImport';
import { generateBatchPayslips, RetroPayslip } from '../services/payslipGenerator';

type BatchMonths = 12 | 24 | 36;
type GroupBy = 'month' | 'employee';

// ─── Date formatter ───────────────────────────────────────────────────────────
const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
        return dateStr;
    }
};

const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// ─── Main Component ───────────────────────────────────────────────────────────

const BulletinsRetroactifs: React.FC = () => {
    const { reconstruction } = useGlobalStore();
    const [selectedMonths, setSelectedMonths] = useState<BatchMonths>(12);
    const [preview, setPreview] = useState<RetroPayslip | null>(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [groupBy, setGroupBy] = useState<GroupBy>('month');
    const PAGE_SIZE = 12;

    const payslips = useMemo(() => {
        if (!reconstruction) return [];
        return generateBatchPayslips(reconstruction.records, selectedMonths);
    }, [reconstruction, selectedMonths]);

    const filtered = useMemo(() =>
        payslips.filter(p =>
            !search || p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
            p.periodCode.includes(search) || p.employeeId.toLowerCase().includes(search.toLowerCase())
        ), [payslips, search]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);

    const employeeCount = useMemo(() => new Set(payslips.map(p => p.employeeId)).size, [payslips]);
    const anomalyCount = useMemo(() => payslips.filter(p => p.isAnomaly).length, [payslips]);

    // Group for display
    const monthGroups = useMemo(() => {
        if (groupBy !== 'month') return null;
        const map = new Map<string, RetroPayslip[]>();
        paged.forEach(p => {
            const key = p.period;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(p);
        });
        return map;
    }, [paged, groupBy]);

    if (!reconstruction) {
        return (
            <EmptyState
                icon={<FileText size={40} />}
                title="Bulletins non générés"
                sub="Importez des données et lancez la reconstruction pour générer les bulletins."
            />
        );
    }

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            {/* ── Top bar ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm">
                <div className="flex items-center gap-5">
                    <div className="flex flex-col">
                        <p className="text-base font-black text-slate-900 tracking-tight">
                            {payslips.length.toLocaleString()} Bulletins Générés
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {employeeCount} employés
                            {anomalyCount > 0 && <span className="text-rose-500 ml-2">· {anomalyCount} anomalies</span>}
                        </p>
                    </div>
                    {/* Batch selector */}
                    <div className="flex items-center h-8 bg-gray-100 rounded-lg p-0.5 gap-0.5">
                        {([12, 24, 36] as BatchMonths[]).map(m => (
                            <button key={m}
                                onClick={() => { setSelectedMonths(m); setPage(0); }}
                                className={`px-3 h-full rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${selectedMonths === m
                                    ? 'bg-white shadow-sm text-[#0052FF]'
                                    : 'text-gray-400 hover:text-slate-700'}`}>
                                {m}M
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                            placeholder="Employé, période…" className="pl-8 pr-3 py-2 text-xs font-medium bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#0052FF] transition-all w-44" />
                    </div>
                </div>
            </div>

            {/* ── Payslip grid ────────────────────────────────────── */}
            {monthGroups ? (
                Array.from(monthGroups.entries()).map(([period, slips]) => (
                    <div key={period}>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] py-1 px-3 bg-gray-100 rounded-full">
                                {period}
                            </span>
                            <span className="text-[10px] font-bold text-gray-300">{slips.length} bulletins</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {slips.map(slip => (
                                <PayslipCard key={slip.id} slip={slip} onPreview={() => setPreview(slip)} />
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {paged.map(slip => (
                        <PayslipCard key={slip.id} slip={slip} onPreview={() => setPreview(slip)} />
                    ))}
                </div>
            )}

            {/* Empty filtered result */}
            {filtered.length === 0 && (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                    <Search size={32} className="text-gray-200" />
                    <p className="text-gray-400 font-bold text-sm">Aucun bulletin trouvé pour « {search} »</p>
                </div>
            )}

            {/* ── Pagination ──────────────────────────────────────── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-[11px] font-bold text-gray-400">
                        Page {page + 1} sur {totalPages} · {filtered.length} résultats
                    </p>
                    <div className="flex gap-1.5">
                        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-500 hover:border-[#0052FF] hover:text-[#0052FF] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronLeft size={15} />
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const p = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
                            return (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-xl text-[11px] font-black transition-all border ${p === page
                                        ? 'bg-[#0052FF] text-white border-[#0052FF] shadow-sm'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                                    {p + 1}
                                </button>
                            );
                        })}
                        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-500 hover:border-[#0052FF] hover:text-[#0052FF] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronRight size={15} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Preview modal ────────────────────────────────────── */}
            {preview && <PayslipModal slip={preview} onClose={() => setPreview(null)} />}
        </div>
    );
};

// ─── Payslip Card ─────────────────────────────────────────────────────────────

const PayslipCard: React.FC<{ slip: RetroPayslip; onPreview: () => void }> = ({ slip, onPreview }) => (
    <button
        onClick={onPreview}
        className={`group text-left bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 w-full ${slip.isAnomaly ? 'border-rose-100 hover:border-rose-200' : 'border-gray-100 hover:border-blue-100'}`}
    >
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 text-sm leading-tight truncate">{slip.employeeName || slip.employeeId}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{slip.period}</p>
            </div>
            <span className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${slip.isAnomaly
                ? 'bg-rose-50 border-rose-100 text-rose-500'
                : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                {slip.isAnomaly ? '⚠ Anomalie' : '✓ Conforme'}
            </span>
        </div>

        {/* Salary grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Brut</p>
                <p className="text-sm font-black text-slate-900 mt-0.5 tabular-nums">{slip.grossSalary.toLocaleString('fr-MA')} <span className="text-[10px] font-bold text-gray-400">DH</span></p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Net</p>
                <p className="text-sm font-black text-[#0052FF] mt-0.5 tabular-nums">{slip.netSalary.toLocaleString('fr-MA')} <span className="text-[10px] font-bold text-blue-300">DH</span></p>
            </div>
        </div>

        {/* Deductions quick row */}
        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-3">
            <span className="font-medium">CNSS {slip.cnssEmployee > 0 ? `${slip.cnssEmployee.toFixed(0)} DH` : '—'}</span>
            <span className="text-gray-200">·</span>
            <span className="font-medium">IR {slip.taxIR > 0 ? `${slip.taxIR.toFixed(0)} DH` : '—'}</span>
            <span className="text-gray-200">·</span>
            <span className={`font-bold ${Math.abs(slip.difference) > 0 ? (slip.difference > 0 ? 'text-blue-500' : 'text-rose-500') : 'text-gray-400'}`}>
                {slip.difference > 0 ? '+' : ''}{slip.difference.toFixed(0)} DH
            </span>
        </div>

        {/* CTA */}
        <div className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${slip.isAnomaly
            ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-100'
            : 'bg-blue-50 text-[#0052FF] group-hover:bg-blue-100'}`}>
            <Eye size={12} /> Voir le bulletin
        </div>
    </button>
);

// ─── Payslip Modal ────────────────────────────────────────────────────────────

const PayslipModal: React.FC<{ slip: RetroPayslip; onClose: () => void }> = ({ slip, onClose }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const totalRetenues = slip.totalDeductions;
    const tauxPrelevement = slip.grossSalary > 0 ? ((totalRetenues / slip.grossSalary) * 100).toFixed(1) : '0.0';
    const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    // Scroll to top when a new slip is opened
    React.useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    }, [slip.id]);

    return (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-6 px-4" onClick={onClose}>
            <div
                className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
                style={{ minHeight: '60vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Sticky modal toolbar ─────────────────────────── */}
                <div className="sticky top-0 z-20 bg-gradient-to-r from-slate-900 to-slate-800 px-7 pt-6 pb-5 shrink-0">
                    {/* Top action row */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#0052FF] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/30">
                                <Building2 size={17} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white font-black text-sm leading-none">Salery Tech Corp</p>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.18em] mt-0.5">Bulletin de Paie — Rétroactif</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {slip.isAnomaly && (
                                <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-full text-[9px] font-black uppercase">
                                    <AlertTriangle size={9} /> Anomalie
                                </span>
                            )}
                            <button onClick={() => window.print()}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-white/10">
                                <Printer size={12} /> Imprimer
                            </button>
                            <button onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl transition-all">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Employee name + net */}
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-[28px] font-black text-white leading-none tracking-tight">{slip.employeeName || slip.employeeId}</p>
                            <p className="text-slate-400 font-bold text-sm mt-1">{slip.period}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Net à Payer</p>
                            <p className="text-[32px] font-black text-white leading-none tabular-nums">
                                {slip.netSalary.toLocaleString('fr-MA')}
                                <span className="text-xl text-slate-400 ml-1.5">DH</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Body (scrollable via page scroll) ────────────── */}
                <div ref={scrollRef}>
                    {/* Meta bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-gray-100">
                        {[
                            { icon: <Hash size={11} />, label: 'Matricule', val: slip.employeeId },
                            { icon: <CreditCard size={11} />, label: 'CIN', val: slip.cin || '—' },
                            { icon: <User size={11} />, label: 'N° CNSS', val: slip.cnssNumber || '—' },
                            { icon: <Calendar size={11} />, label: 'Date de Paiement', val: formatDate(slip.paymentDate) },
                        ].map((m, i) => (
                            <div key={i} className={`px-5 py-4 ${i < 3 ? 'border-r border-gray-100' : ''}`}>
                                <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                                    {m.icon}
                                    <p className="text-[9px] font-black uppercase tracking-wider">{m.label}</p>
                                </div>
                                <p className="text-sm font-black text-slate-900 leading-tight">{m.val}</p>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Earnings */}
                        <Section title="Éléments de Rémunération">
                            <LineTable
                                rows={slip.earnings.map(e => ({ label: e.label, amount: e.amount, type: 'earning' as const }))}
                                footer={{ label: 'Salaire Brut', amount: slip.grossSalary, highlight: true }}
                            />
                        </Section>

                        {/* Deductions */}
                        {slip.deductions.length > 0 && (
                            <Section title="Retenues & Cotisations Sociales">
                                <LineTable
                                    rows={slip.deductions.map(d => ({ label: d.label, amount: d.amount, type: 'deduction' as const }))}
                                    footer={{ label: 'Total des Retenues', amount: totalRetenues, highlight: false }}
                                />
                            </Section>
                        )}

                        {/* Summary strip */}
                        <div className="grid grid-cols-3 gap-3">
                            <SummaryBox label="Salaire Brut" val={slip.grossSalary} color="slate" />
                            <SummaryBox label={`Retenues (${tauxPrelevement}%)`} val={-totalRetenues} color="rose" />
                            <SummaryBox label="Net à Payer" val={slip.netSalary} color="blue" bold />
                        </div>

                        {/* Employer info row */}
                        {slip.cnssEmployer > 0 && (
                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-[11px] font-bold text-gray-500">Charges patronales CNSS (note d'information)</p>
                                <p className="text-[11px] font-black text-gray-700">{slip.cnssEmployer.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH</p>
                            </div>
                        )}

                        {/* Anomaly notice */}
                        {Math.abs(slip.difference) > 0 && (
                            <div className={`flex items-start gap-3 p-4 rounded-xl border ${slip.difference > 0 ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'}`}>
                                <AlertTriangle size={14} className={`shrink-0 mt-0.5 ${slip.difference > 0 ? 'text-blue-500' : 'text-rose-500'}`} />
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${slip.difference > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                                        Écart constaté — {slip.differenceCategory || 'régularisation'}
                                    </p>
                                    <p className={`text-xs font-bold ${slip.difference > 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                                        Différence salaire payé / réel : {slip.difference > 0 ? '+' : ''}{slip.difference.toFixed(2)} DH
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── SIGNATURE SECTION ─────────────────────── */}
                        <div className="border-t border-dashed border-gray-200 pt-6 mt-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-center mb-5">
                                Signatures &amp; Approbation
                            </p>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Company signature */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center shrink-0">
                                            <Building2 size={11} className="text-white" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">L'Employeur</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400">Salery Tech Corp</p>

                                    {/* Stamp placeholder */}
                                    <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-gray-300">
                                        <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center">
                                            <Building2 size={16} className="text-gray-200" />
                                        </div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-center leading-tight text-gray-300">Cachet &amp;<br />Signature</p>
                                    </div>

                                    <div className="mt-2 space-y-1.5">
                                        <div className="h-px bg-gray-200 w-full" />
                                        <p className="text-[9px] font-bold text-gray-300 text-center">Nom &amp; Signature du Responsable RH</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="h-px bg-gray-200 w-full" />
                                        <p className="text-[9px] font-bold text-gray-300 text-center">Date : {today}</p>
                                    </div>
                                </div>

                                {/* Employee signature */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-5 h-5 bg-[#0052FF] rounded flex items-center justify-center shrink-0">
                                            <User size={11} className="text-white" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Le Salarié</p>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400">{slip.employeeName || slip.employeeId}</p>

                                    {/* Signature area */}
                                    <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-gray-300">
                                        <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center">
                                            <User size={16} className="text-gray-200" />
                                        </div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-center leading-tight text-gray-300">Lu &amp;<br />Approuvé</p>
                                    </div>

                                    <div className="mt-2 space-y-1.5">
                                        <div className="h-px bg-gray-200 w-full" />
                                        <p className="text-[9px] font-bold text-gray-300 text-center">Signature du Salarié</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="h-px bg-gray-200 w-full" />
                                        <p className="text-[9px] font-bold text-gray-300 text-center">Date : ________ / ________ / ________</p>
                                    </div>
                                </div>
                            </div>

                            {/* Legal notice */}
                            <div className="mt-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-[9px] font-medium text-gray-400 text-center leading-relaxed">
                                    Conformément à l'article 371 du Code du Travail marocain, ce bulletin de paie doit être conservé pendant au moins 5 ans.
                                    Tout différend relatif à ce bulletin doit être signalé dans un délai de 30 jours suivant sa remise.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Sticky footer ─────────────────────────────────── */}
                <div className="sticky bottom-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400">Salery · Bulletin rétroactif · {slip.period}</p>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${slip.isAnomaly
                        ? 'bg-rose-50 border-rose-100 text-rose-500'
                        : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                        {slip.isAnomaly ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                        {slip.isAnomaly ? 'ANOMALIE DÉTECTÉE' : 'CONFORME'}
                    </span>
                </div>
            </div>
        </div>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] mb-2">{title}</p>
        {children}
    </div>
);

const LineTable: React.FC<{
    rows: { label: string; amount: number; type: 'earning' | 'deduction' }[];
    footer: { label: string; amount: number; highlight: boolean };
}> = ({ rows, footer }) => (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
        {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                <span className="text-sm text-slate-600 font-medium">{row.label}</span>
                <span className={`text-sm font-black tabular-nums ${row.type === 'deduction' ? 'text-rose-600' : 'text-slate-900'}`}>
                    {row.type === 'deduction' ? '− ' : ''}{row.amount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
                </span>
            </div>
        ))}
        <div className={`flex items-center justify-between px-4 py-3 border-t border-gray-100 ${footer.highlight ? 'bg-slate-50' : 'bg-gray-50'}`}>
            <span className="text-sm font-black text-slate-900">{footer.label}</span>
            <span className={`text-sm font-black tabular-nums ${footer.highlight ? 'text-[#0052FF]' : 'text-rose-600'}`}>
                {footer.amount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
            </span>
        </div>
    </div>
);

const SummaryBox: React.FC<{ label: string; val: number; color: 'slate' | 'rose' | 'blue'; bold?: boolean }> = ({ label, val, color, bold }) => {
    const colors = {
        slate: 'bg-slate-50 border-slate-100 text-slate-900 text-slate-500',
        rose: 'bg-rose-50 border-rose-100 text-rose-700 text-rose-400',
        blue: 'bg-blue-50 border-blue-100 text-[#0052FF] text-blue-400',
    }[color].split(' ');
    return (
        <div className={`rounded-xl border p-3 ${colors[0]} ${colors[1]}`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${colors[3]}`}>{label}</p>
            <p className={`tabular-nums leading-tight ${bold ? 'text-lg font-black' : 'text-base font-bold'} ${colors[2]}`}>
                {Math.abs(val).toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH
            </p>
        </div>
    );
};

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; sub: string }> = ({ icon, title, sub }) => (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-20 flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 border border-gray-200">{icon}</div>
        <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
            <p className="text-slate-400 font-medium text-sm mt-1 max-w-xs">{sub}</p>
        </div>
    </div>
);

export default BulletinsRetroactifs;

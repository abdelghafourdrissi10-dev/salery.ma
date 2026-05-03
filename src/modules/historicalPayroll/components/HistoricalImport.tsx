import React, { useState, useRef, useCallback } from 'react';
import {
    Upload, FileText, CheckCircle2, AlertCircle, Play, X,
    Download, ChevronRight, Users, Calendar, Database, AlertTriangle
} from 'lucide-react';
import { parseHistoricalFile, downloadHistoricalTemplate, HistoricalRecord, ImportResult } from '../services/importEngine';
import { runReconstruction, ReconstructionOutput } from '../services/reconstructionEngine';

// ─── State store hook ─────────────────────────────────────────────────────────

interface ImportStore {
    result: ImportResult | null;
    reconstruction: ReconstructionOutput | null;
    setResult: (r: ImportResult) => void;
    setReconstruction: (r: ReconstructionOutput) => void;
}

// We use a module-level store for sharing state between tabs
// In production this would be a Zustand store
let _globalResult: ImportResult | null = null;
let _globalRecon: ReconstructionOutput | null = null;
const _listeners: Array<() => void> = [];
export const getGlobalState = () => ({ result: _globalResult, reconstruction: _globalRecon });
export const setGlobalResult = (r: ImportResult) => { _globalResult = r; _listeners.forEach(fn => fn()); };
export const setGlobalRecon = (r: ReconstructionOutput) => { _globalRecon = r; _listeners.forEach(fn => fn()); };
export const useGlobalStore = () => {
    const [, forceUpdate] = React.useState(0);
    React.useEffect(() => {
        const fn = () => forceUpdate(n => n + 1);
        _listeners.push(fn);
        return () => { const i = _listeners.indexOf(fn); if (i >= 0) _listeners.splice(i, 1); };
    }, []);
    return getGlobalState();
};

// ─── Component ────────────────────────────────────────────────────────────────

type Step = 'upload' | 'parsed' | 'processing' | 'complete';
type BatchMonths = 12 | 24 | 36;

const HistoricalImport: React.FC = () => {
    const [step, setStep] = useState<Step>('upload');
    const [dragOver, setDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parseResult, setParseResult] = useState<ImportResult | null>(null);
    const [progress, setProgress] = useState(0);
    const [batchMonths, setBatchMonths] = useState<BatchMonths>(12);
    const [progressMsg, setProgressMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback(async (f: File) => {
        setFile(f);
        setStep('processing');
        setProgress(10);
        setProgressMsg('Lecture du fichier...');

        await new Promise(r => setTimeout(r, 300));
        setProgress(30);
        setProgressMsg('Détection des colonnes...');

        const result = await parseHistoricalFile(f, 'company-demo');
        setProgress(60);
        setProgressMsg('Analyse des données...');

        await new Promise(r => setTimeout(r, 400));
        setParseResult(result);
        setGlobalResult(result);
        setProgress(100);

        await new Promise(r => setTimeout(r, 300));
        setStep('parsed');
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) processFile(f);
    }, [processFile]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) processFile(f);
    };

    const runFullReconstruction = async () => {
        if (!parseResult) return;
        setStep('processing');
        setProgress(0);
        setProgressMsg('Groupement par employé...');
        await new Promise(r => setTimeout(r, 400));

        setProgress(30);
        setProgressMsg('Détection des anomalies...');
        await new Promise(r => setTimeout(r, 500));

        setProgress(60);
        setProgressMsg('Génération analyse IA...');
        const recon = runReconstruction(parseResult.records);
        setGlobalRecon(recon);
        await new Promise(r => setTimeout(r, 400));

        setProgress(85);
        setProgressMsg('Génération bulletins rétroactifs...');
        await new Promise(r => setTimeout(r, 400));

        setProgress(100);
        setProgressMsg('Terminé !');
        await new Promise(r => setTimeout(r, 300));
        setStep('complete');
    };

    const reset = () => {
        setStep('upload');
        setFile(null);
        setParseResult(null);
        setProgress(0);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Upload step */}
            {step === 'upload' && (
                <div className="space-y-6">
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-[32px] p-16 flex flex-col items-center gap-6 cursor-pointer transition-all duration-300 ${dragOver
                            ? 'border-[#0052FF] bg-blue-50 scale-[1.01]'
                            : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40'
                            }`}
                    >
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300 border-2 ${dragOver ? 'bg-[#0052FF] border-[#0052FF] text-white' : 'bg-white border-gray-200 text-[#0052FF]'}`}>
                            <Upload size={36} />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-slate-900 tracking-tight">
                                {dragOver ? 'Relâchez pour analyser' : 'Glissez votre fichier historique'}
                            </p>
                            <p className="text-sm text-slate-400 font-medium mt-1">Formats supportés : XLSX, CSV, JSON — Max 50 MB</p>
                        </div>
                        <label className="px-8 py-4 bg-[#0052FF] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer">
                            Choisir un fichier
                            <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.csv,.json" onChange={handleFileInput} />
                        </label>
                    </div>

                    {/* Template download */}
                    <div className="flex items-center justify-between bg-slate-900 text-white rounded-[24px] p-6">
                        <div>
                            <p className="text-sm font-black">Gabarit Officiel Salery</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">22 colonnes · Données de paie historiques</p>
                        </div>
                        <button
                            onClick={e => { e.stopPropagation(); downloadHistoricalTemplate(); }}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all shadow-sm"
                        >
                            <Download size={14} /> Télécharger le Gabarit
                        </button>
                    </div>
                </div>
            )}

            {/* Processing */}
            {step === 'processing' && (
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-8">
                    <div className="relative w-36 h-36">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="68" cy="68" r="60" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                            <circle cx="68" cy="68" r="60" fill="none" stroke="#0052FF" strokeWidth="8"
                                strokeDasharray={377}
                                strokeDashoffset={377 - (377 * progress / 100)}
                                strokeLinecap="round"
                                className="transition-all duration-500"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-black text-slate-900">{progress}%</span>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-black text-slate-900 tracking-tight">Traitement en cours…</p>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{progressMsg}</p>
                    </div>
                </div>
            )}

            {/* Parsed — review before reconstruction */}
            {step === 'parsed' && parseResult && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Enregistrements', val: parseResult.totalRecords, icon: <Database size={18} />, color: 'text-[#0052FF]' },
                            { label: 'Employés détectés', val: parseResult.employeeCount, icon: <Users size={18} />, color: 'text-indigo-600' },
                            { label: 'Années', val: parseResult.yearRange.length, icon: <Calendar size={18} />, color: 'text-emerald-600' },
                            { label: 'Erreurs import', val: parseResult.errors.length, icon: <AlertCircle size={18} />, color: parseResult.errors.length > 0 ? 'text-rose-600' : 'text-emerald-600' },
                        ].map(s => (
                            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex items-start gap-3">
                                <div className={`p-2 rounded-lg bg-gray-50 ${s.color}`}>{s.icon}</div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                                    <p className={`text-2xl font-black ${s.color} leading-none mt-1`}>{s.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* File info */}
                    <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#0052FF] border border-blue-100 shrink-0">
                            <FileText size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-slate-900">{file?.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                {parseResult.yearRange.length > 0 ? `Années: ${parseResult.yearRange.join(', ')}` : 'Années non détectées'}
                                {' · '}
                                {(file?.size || 0) > 1024 ? `${((file?.size || 0) / 1024).toFixed(1)} Ko` : `${file?.size} o`}
                            </p>
                        </div>
                        <button onClick={reset} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Errors */}
                    {parseResult.errors.length > 0 && (
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 space-y-2">
                            <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                <AlertTriangle size={14} /> {parseResult.errors.length} Erreur(s) de lecture
                            </p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {parseResult.errors.map((e, i) => (
                                    <p key={i} className="text-xs text-rose-700 font-medium">{e.message}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Batch selection + launch */}
                    <div className="bg-white border border-gray-100 rounded-[28px] p-8 shadow-sm space-y-6">
                        <div>
                            <p className="text-sm font-black text-slate-900 mb-3">Période de reconstruction rétroactive</p>
                            <div className="flex gap-3">
                                {([12, 24, 36] as BatchMonths[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setBatchMonths(m)}
                                        className={`flex-1 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest border transition-all ${batchMonths === m
                                            ? 'bg-[#0052FF] text-white border-[#0052FF] shadow-md shadow-blue-200'
                                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        {m} Mois
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={runFullReconstruction}
                            className="w-full py-5 bg-gradient-to-r from-[#0052FF] to-indigo-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Play size={18} /> Générer les Bulletins Rétroactifs — {batchMonths} Mois
                        </button>
                    </div>
                </div>
            )}

            {/* Complete */}
            {step === 'complete' && (
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-16 flex flex-col items-center text-center gap-8 animate-in zoom-in duration-500">
                    <div className="w-28 h-28 bg-teal-50 text-teal-500 rounded-[40px] flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-teal-50">
                        <CheckCircle2 size={56} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Reconstruction Terminée</h3>
                        <p className="text-slate-400 font-bold text-sm max-w-md mx-auto">
                            L'engine a analysé {parseResult?.totalRecords} enregistrements, généré les bulletins rétroactifs et identifié les anomalies.
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Consultez les onglets : Analyse IA · Grand Livre · Bulletins · Audit Mode
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={reset} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all">
                            Nouvel Import
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoricalImport;

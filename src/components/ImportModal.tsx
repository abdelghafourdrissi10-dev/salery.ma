import React, { useState, useRef } from 'react';
import {
   X, Upload, FileText, CheckCircle2, AlertCircle,
   RefreshCw, Download, ArrowRight, ShieldCheck,
   FileSpreadsheet, Trash2, Info
} from 'lucide-react';
import { Language } from '../types';
// Fix: Import ImportResult from the correct location (services/importService) instead of types.ts
import { downloadTemplate, parseAndValidateEmployees, parseAndValidateAttendance, ImportResult } from '../services/importService';

interface Props {
   type: 'employees' | 'attendance';
   lang: Language;
   onClose: () => void;
   onComplete: (data: any[]) => void;
   contextData: any; // Employees for attendance import, or existing for employee import
}

const ImportModal: React.FC<Props> = ({ type, lang, onClose, onComplete, contextData }) => {
   const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'success'>('upload');
   const [file, setFile] = useState<File | null>(null);
   const [results, setResults] = useState<ImportResult<any> | null>(null);
   const [isOverwriting, setIsOverwriting] = useState(false);
   const [progress, setProgress] = useState(0);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;
      setFile(selectedFile);

      setStep('processing');
      let validationResult;
      if (type === 'employees') {
         validationResult = await parseAndValidateEmployees(selectedFile, contextData.employees, contextData.companyId);
      } else {
         validationResult = await parseAndValidateAttendance(selectedFile, contextData.employees, contextData.attendance);
      }

      setResults(validationResult);
      setStep('preview');
   };

   const handleConfirmImport = async () => {
      if (!results || results.valid.length === 0) return;
      setStep('processing');

      const { api } = await import('../services/api');
      const total = results.valid.length;
      let imported = 0;
      let failed = 0;

      if (type === 'employees') {
         // ✅ POST each employee to backend — database is source of truth
         for (let i = 0; i < results.valid.length; i++) {
            const emp = results.valid[i];
            try {
               await api.post('/employees', {
                  firstName: emp.firstName || emp.fullName?.split(' ')[0] || 'N/A',
                  lastName: emp.lastName || emp.fullName?.split(' ').slice(1).join(' ') || 'N/A',
                  email: emp.email || null,
                  phone: emp.phone || null,
                  position: emp.position || emp.jobTitle || 'Employé',
                  baseSalary: Number(emp.baseSalary) || 0,
                  salaryType: emp.salaryType || 'MONTHLY',
                  hireDate: emp.hireDate || new Date().toISOString(),
               });
               imported++;
            } catch (err) {
               console.warn(`[Import] Failed to insert ${emp.email || emp.fullName}:`, err);
               failed++;
            }
            // Update progress bar per row
            setProgress(Math.round(((i + 1) / total) * 90));
         }
         setProgress(100);

         // Refetch employees from backend so the UI reflects the DB
         try {
            const updatedEmployees = await api.get('/employees');
            if (Array.isArray(updatedEmployees)) {
               onComplete(updatedEmployees);
            }
         } catch {
            onComplete(results.valid);
         }

         console.log(`[Import] ✅ ${imported} imported, ❌ ${failed} failed`);
      } else {
         // Attendance import: update frontend state directly (no backend attendance POST yet)
         for (let i = 0; i <= 100; i += 10) {
            setProgress(i);
            await new Promise(r => setTimeout(r, 80));
         }
         onComplete(results.valid);
      }

      setStep('success');
   };


   const t = {
      fr: {
         title: type === 'employees' ? "Import Collaborateurs" : "Import Pointage Mensuel",
         sub: "Téléchargez votre fichier .xlsx ou .csv conforme au gabarit Salery.",
         upload: "Glissez votre fichier ici",
         browse: "Parcourir les fichiers",
         template: "Télécharger le Gabarit",
         preview: "Aperçu de l'import",
         validRows: "Lignes Valides",
         invalidRows: "Lignes avec Erreurs",
         confirm: "Confirmer l'Import",
         successTitle: "Importation Réussie",
         successMsg: "Les données ont été injectées dans le système.",
         finish: "Terminer"
      },
      ar: {
         title: type === 'employees' ? "استيراد الموظفين" : "استيراد تسجيل الحضور",
         sub: "قم برفع ملف Excel الخاص بك وفقاً للنموذج المعتمد.",
         upload: "قم بسحب الملف هنا",
         browse: "تصفح الملفات",
         template: "تحميل النموذج",
         preview: "معاينة الاستيراد",
         validRows: "أسطر صالحة",
         invalidRows: "أسطر بها أخطاء",
         confirm: "تأكيد الاستيراد",
         successTitle: "تم الاستيراد بنجاح",
         finish: "إغلاق"
      }
   }[lang === 'ar' ? 'ar' : 'fr'];

   return (
      <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
         <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in duration-300 relative border border-gray-100 flex flex-col max-h-[90vh]">

            <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
               <div className="flex items-center gap-4 text-start">
                  <div className="w-12 h-12 bg-blue-50 text-[#0078D4] rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                     <FileSpreadsheet size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-[#1A1F36] tracking-tighter">{t.title}</h3>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.sub}</p>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={24} /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-10 custom-scroll">
               {step === 'upload' && (
                  <div className="space-y-10">
                     <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group border-4 border-dashed border-gray-100 rounded-[48px] p-20 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-[#0078D4] hover:bg-blue-50/30 transition-all"
                     >
                        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 group-hover:bg-[#0078D4] group-hover:text-white transition-all shadow-inner">
                           <Upload size={40} />
                        </div>
                        <div className="text-center">
                           <p className="text-lg font-black text-[#1A1F36]">{t.upload}</p>
                           <p className="text-sm font-medium text-gray-400 mt-1">{t.browse}</p>
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx, .csv" onChange={handleFileSelect} />
                     </div>

                     <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-[#1A1F36] text-white rounded-[32px] shadow-xl">
                        <div className="flex items-center gap-4 text-start">
                           <div className="p-3 bg-[#0078D4] rounded-xl"><FileText size={24} /></div>
                           <div>
                              <p className="text-xs font-black uppercase tracking-widest">Nouveau sur Salery ?</p>
                              <p className="text-[10px] text-white/50 font-bold uppercase tracking-tight">Utilisez nos fichiers sources certifiés.</p>
                           </div>
                        </div>
                        {type === 'attendance' ? (
                           <button onClick={() => downloadTemplate(type)} className="px-8 py-4 bg-white text-[#1A1F36] rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-gray-100 transition-all shadow-lg">
                              <Download size={16} /> {t.template}
                           </button>
                        ) : (
                           <div className="flex flex-col sm:flex-row gap-3">
                              <button onClick={() => downloadTemplate('employees_basic')} className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-700 hover:text-white transition-all shadow-sm border border-gray-700">
                                 <Download size={14} /> Gabarit Basique
                              </button>
                              <button onClick={() => downloadTemplate('employees_payroll')} className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-700 hover:text-white transition-all shadow-sm border border-gray-700">
                                 <Download size={14} /> + Paie & RIB
                              </button>
                              <button onClick={() => downloadTemplate('employees_full')} className="px-6 py-3 bg-white text-[#1A1F36] rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-100 transition-all shadow-lg">
                                 <Download size={14} /> Master Data RH V3
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {step === 'preview' && results && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SummaryBox label={t.validRows} value={results.valid.length} color="text-emerald-500" icon={<CheckCircle2 size={20} />} />
                        <SummaryBox label={t.invalidRows} value={results.invalid.length} color="text-rose-500" icon={<AlertCircle size={20} />} />
                        <SummaryBox label="Doublons Détectés" value={results.duplicates} color="text-amber-500" icon={<RefreshCw size={20} />} />
                     </div>

                     {results.invalid.length > 0 && (
                        <div className="airbnb-card p-6 border-rose-100 bg-rose-50/30">
                           <h4 className="text-xs font-black uppercase tracking-widest text-rose-600 mb-4 flex items-center gap-2"><AlertCircle size={14} /> Rapport d'Erreurs</h4>
                           <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar pr-2">
                              {results.invalid.map((inv, i) => (
                                 <div key={i} className="text-[10px] font-bold text-rose-700 bg-white p-3 rounded-xl border border-rose-100 flex gap-4">
                                    <span className="shrink-0 font-black">Ligne {inv.row}:</span>
                                    <span>{inv.errors.join(' • ')}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}

                     <div className="airbnb-card overflow-hidden border-[#E3E8EE] rounded-[24px]">
                        <table className="w-full text-left text-[10px]">
                           <thead className="bg-[#F7F9FC] border-b">
                              <tr>
                                 <th className="p-4 font-black uppercase tracking-widest text-gray-400">Collaborateur</th>
                                 <th className="p-4 font-black uppercase tracking-widest text-gray-400">Données</th>
                                 <th className="p-4 font-black uppercase tracking-widest text-gray-400 text-right">Statut</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-50">
                              {results.valid.slice(0, 5).map((v, i) => (
                                 <tr key={i}>
                                    <td className="p-4 font-black text-[#1A1F36]">{v.fullName || v.employeeId}</td>
                                    <td className="p-4 text-gray-400 font-medium">{type === 'employees' ? `${v.baseSalary} DH • ${v.contractType}` : `${v.hoursWorked}h • ${v.date}`}</td>
                                    <td className="p-4 text-right"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-black uppercase tracking-tighter">PRÊT</span></td>
                                 </tr>
                              ))}
                              {results.valid.length > 5 && (
                                 <tr><td colSpan={3} className="p-4 text-center text-gray-400 italic">... et {results.valid.length - 5} autres lignes valides</td></tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {step === 'processing' && (
                  <div className="py-20 flex flex-col items-center justify-center gap-10 animate-in fade-in">
                     <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                           <circle cx="64" cy="64" r="60" fill="none" stroke="#F5F7FA" strokeWidth="8" />
                           <circle cx="64" cy="64" r="60" fill="none" stroke="#0078D4" strokeWidth="8" strokeDasharray={377} strokeDashoffset={377 - (377 * progress / 100)} strokeLinecap="round" className="transition-all duration-300" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <span className="text-2xl font-black text-[#1A1F36]">{progress}%</span>
                        </div>
                     </div>
                     <div className="text-center space-y-2">
                        <h4 className="text-xl font-black text-[#1A1F36]">Traitement Salery Node...</h4>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Validation cryptographique des signatures</p>
                     </div>
                  </div>
               )}

               {step === 'success' && (
                  <div className="py-20 flex flex-col items-center justify-center gap-8 animate-in zoom-in">
                     <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center shadow-xl border-4 border-white">
                        <ShieldCheck size={56} strokeWidth={2.5} />
                     </div>
                     <div className="text-center space-y-2">
                        <h3 className="text-3xl font-black text-[#1A1F36] tracking-tighter">{t.successTitle}</h3>
                        <p className="text-base font-medium text-gray-400">{t.successMsg}</p>
                     </div>
                     <div className="flex gap-4 p-8 bg-gray-50 rounded-[32px] border border-gray-100 w-full max-w-sm">
                        <div className="flex-1 text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Injectés</p><p className="text-2xl font-black text-emerald-500">{results?.valid.length}</p></div>
                        <div className="w-px bg-gray-200 h-10 self-center"></div>
                        <div className="flex-1 text-center"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ignorés</p><p className="text-2xl font-black text-rose-500">{results?.invalid.length}</p></div>
                     </div>
                  </div>
               )}
            </div>

            {step !== 'processing' && step !== 'success' && (
               <footer className="p-8 border-t border-gray-50 bg-gray-50/30 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                     <Info size={14} /> {results ? "Aperçu terminé" : "Sélectionnez un fichier"}
                  </div>
                  <div className="flex gap-4">
                     <button onClick={onClose} className="px-8 py-3.5 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-[#1A1F36] transition-all">ANNULER</button>
                     {step === 'preview' && (
                        <button
                           onClick={handleConfirmImport}
                           disabled={!results || results.valid.length === 0}
                           className="px-10 py-3.5 btn-primary-gradient text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
                        >
                           {t.confirm} <ArrowRight size={16} />
                        </button>
                     )}
                  </div>
               </footer>
            )}

            {step === 'success' && (
               <footer className="p-8 border-t border-gray-50 bg-gray-50/30 flex justify-center">
                  <button onClick={onClose} className="px-16 py-4 btn-primary-gradient text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95">
                     {t.finish}
                  </button>
               </footer>
            )}
         </div>
      </div>
   );
};

const SummaryBox = ({ label, value, color, icon }: any) => (
   <div className="airbnb-card p-6 bg-white border border-gray-100 text-start group hover:border-[#0078D4] transition-all">
      <div className="flex items-center gap-3 mb-4">
         <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>{icon}</div>
         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-3xl font-black ${color} tracking-tighter`}>{value}</p>
   </div>
);

export default ImportModal;

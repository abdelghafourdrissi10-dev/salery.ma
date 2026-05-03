import React, { useState, useEffect, useMemo } from 'react';
import {
   Zap, Plus, ShieldCheck, AlertTriangle, FileText,
   Trash2, Edit3, CheckCircle2, TrendingUp, Info,
   History, User, Briefcase, Filter, Search, ArrowRight,
   RefreshCw, Layers, PieChart, BadgeCheck, LayoutGrid,
   Settings2, FileStack, ArrowUpCircle, CheckCircle, X,
   PlusCircle, Save, Trash, Calendar
} from 'lucide-react';
import {
   Employee, Language, AuthUser, EmployeePrime,
   PrimeCategory, PrimeCalculationResult, PrimeTemplate
} from '../types';
import {
   PRIME_CATEGORIES,
   PRIME_TEMPLATES as DEFAULT_TEMPLATES,
   calculatePrimeParts,
   calculateSeniorityBonus
} from '../services/primeEngine';
import { SMIG_2026 } from '../constants';

interface Props {
   employees: Employee[];
   lang: Language;
   user: AuthUser;
   onUpdateEmployee: (emp: Employee) => void;
}

const PrimeManager: React.FC<Props> = ({ employees, lang, user, onUpdateEmployee }) => {
   const [activeTab, setActiveTab] = useState<'registry' | 'templates' | 'analytics' | 'categories'>('registry');
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
   const [templates, setTemplates] = useState<PrimeTemplate[]>([]);
   const [editingTemplate, setEditingTemplate] = useState<PrimeTemplate | null>(null);

   // New Prime Assignment State
   const [showNewPrimeModal, setShowNewPrimeModal] = useState(false);
   const [assignmentForm, setAssignmentForm] = useState({
      employeeId: '',
      categoryId: PRIME_CATEGORIES[0].id,
      amount: 0,
      startDate: new Date().toISOString().split('T')[0],
      recurring: true
   });

   const t = {
      fr: {
         title: "Gestion des Primes",
         sub: "Moteur de calcul conforme CNSS & DGI v2026",
         btnNew: "NOUVELLE PRIME",
         btnTemplate: "GÉRER GABARITS",
         colEmp: "Collaborateur",
         colBase: "Salaire Base",
         colPrimes: "Détails Primes",
         colRisk: "Conformité",
         tabs: { registry: "Registre", templates: "Gabarits", analytics: "Analyses", categories: "Paramétrage" },
         risk: { low: "Conforme", high: "Risque Audit" },
         applyTpl: "Appliquer à l'employé",
         editTpl: "Modifier Gabarit",
         saveTpl: "Enregistrer le Gabarit",
         addPrime: "Ajouter une prime au gabarit",
         assignTitle: "Assignation de Prime",
         assignSub: "Ajouter un gain ponctuel ou récurrent à un collaborateur.",
         btnConfirm: "Confirmer l'assignation"
      }
   }[lang === 'ar' ? 'fr' : 'fr'];

   useEffect(() => {
      const saved = localStorage.getItem('salaire_prime_templates');
      if (saved) {
         setTemplates(JSON.parse(saved));
      } else {
         setTemplates(DEFAULT_TEMPLATES);
      }
   }, []);

   const saveTemplates = (newTemplates: PrimeTemplate[]) => {
      setTemplates(newTemplates);
      localStorage.setItem('salaire_prime_templates', JSON.stringify(newTemplates));
   };

   const filteredEmployees = employees.filter(e =>
      e.fullName.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const handleApplyTemplate = (empId: string, template: PrimeTemplate) => {
      const emp = employees.find(e => e.id === empId);
      if (!emp) return;

      const newPrimes: EmployeePrime[] = template.primes.map(tp => ({
         id: `PRM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
         employeeId: empId,
         categoryId: tp.categoryId,
         amount: tp.amount,
         isPercentage: false,
         startDate: new Date().toISOString().split('T')[0],
         recurring: true,
         status: 'active'
      }));

      const updatedEmp = {
         ...emp,
         primes: [...(emp.primes || []), ...newPrimes],
         auditHistory: [
            {
               userId: user.id,
               userName: `${user.firstName} ${user.lastName}`,
               userRole: user.role,
               action: "TEMPLATE_APPLIED",
               timestamp: Date.now(),
               details: `Applied template: ${template.name}`
            },
            ...(emp.auditHistory || [])
         ]
      };

      onUpdateEmployee(updatedEmp);
      setSelectedEmpId(null);
   };

   const handleCreateAssignment = (e: React.FormEvent) => {
      e.preventDefault();
      const emp = employees.find(e => e.id === assignmentForm.employeeId);
      if (!emp) return;

      const newPrime: EmployeePrime = {
         id: `PRM-MANUAL-${Date.now()}`,
         employeeId: assignmentForm.employeeId,
         categoryId: assignmentForm.categoryId,
         amount: assignmentForm.amount,
         isPercentage: false,
         startDate: assignmentForm.startDate,
         recurring: assignmentForm.recurring,
         status: 'active'
      };

      const updatedEmp = {
         ...emp,
         primes: [...(emp.primes || []), newPrime],
         auditHistory: [
            {
               userId: user.id,
               userName: `${user.firstName} ${user.lastName}`,
               userRole: user.role,
               action: "PRIME_ASSIGNED",
               timestamp: Date.now(),
               details: `Added ${assignmentForm.categoryId} - ${assignmentForm.amount} DH`
            },
            ...(emp.auditHistory || [])
         ]
      };

      onUpdateEmployee(updatedEmp);
      setShowNewPrimeModal(false);
      setAssignmentForm({
         employeeId: '',
         categoryId: PRIME_CATEGORIES[0].id,
         amount: 0,
         startDate: new Date().toISOString().split('T')[0],
         recurring: true
      });
   };

   const handleUpdateTemplate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTemplate) return;

      const newTemplates = templates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
      saveTemplates(newTemplates);
      setEditingTemplate(null);
   };

   const addPrimeToEdit = () => {
      if (!editingTemplate) return;
      setEditingTemplate({
         ...editingTemplate,
         primes: [...editingTemplate.primes, { categoryId: PRIME_CATEGORIES[0].id, amount: 0 }]
      });
   };

   const removePrimeFromEdit = (index: number) => {
      if (!editingTemplate) return;
      const newPrimes = [...editingTemplate.primes];
      newPrimes.splice(index, 1);
      setEditingTemplate({ ...editingTemplate, primes: newPrimes });
   };

   const updatePrimeInEdit = (index: number, field: 'categoryId' | 'amount', value: any) => {
      if (!editingTemplate) return;
      const newPrimes = [...editingTemplate.primes];
      newPrimes[index] = { ...newPrimes[index], [field]: value };
      setEditingTemplate({ ...editingTemplate, primes: newPrimes });
   };

   const getEmployeePrimesData = (emp: Employee) => {
      const seniority = calculateSeniorityBonus(emp);
      const results: PrimeCalculationResult[] = (emp.primes || []).map(p => {
         const cat = PRIME_CATEGORIES.find(c => c.id === p.categoryId)!;
         return calculatePrimeParts(p, cat);
      });

      const totalExempt = results.reduce((acc, r) => acc + r.exemptPart, 0);
      const totalTaxable = results.reduce((acc, r) => acc + r.taxablePart, 0) + seniority;
      const risks = results.filter(r => r.riskAlert).length;

      return {
         total: totalExempt + totalTaxable,
         exempt: totalExempt,
         taxable: totalTaxable,
         seniority,
         risks,
         count: emp.primes?.length || 0
      };
   };

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-24 text-start">
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 text-[#0078D4] rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                     <Zap size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-[#1A1F36] tracking-tighter">{t.title}</h2>
               </div>
               <p className="text-sm font-medium text-gray-400">{t.sub}</p>
            </div>

            <div className="flex gap-3">
               <button
                  onClick={() => setShowNewPrimeModal(true)}
                  className="px-6 py-3 bg-[#111827] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
               >
                  <Plus size={16} /> {t.btnNew}
               </button>
               <nav className="flex bg-[#F7F9FC] p-1 rounded-2xl border border-[#E3E8EE] shadow-inner overflow-x-auto no-scrollbar max-w-xs md:max-w-none">
                  {Object.entries(t.tabs).map(([id, label]) => (
                     <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === id ? 'bg-white shadow-md text-[#0078D4]' : 'text-gray-400 hover:text-[#111827]'}`}
                     >
                        {label}
                     </button>
                  ))}
               </nav>
            </div>
         </header>

         {activeTab === 'registry' && (
            <div className="space-y-6">
               <div className="relative group max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                     type="text"
                     placeholder="Rechercher un collaborateur..."
                     className="w-full pl-12 pr-6 py-4 bg-white border border-[#E5E7EB] rounded-2xl text-sm font-bold focus:border-[#0078D4] outline-none shadow-sm transition-all"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>

               <div className="airbnb-card bg-white overflow-hidden border-[#E5E7EB] shadow-sm">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-[#F7F9FC] border-b border-[#E5E7EB]">
                        <tr className="text-[10px] font-black text-[#6B7280] uppercase tracking-widest">
                           <th className="p-6">{t.colEmp}</th>
                           <th className="p-6 text-right">Total Primes</th>
                           <th className="p-6 text-center">Répartition (Exonéré/Taxable)</th>
                           <th className="p-6 text-center">{t.colRisk}</th>
                           <th className="p-6 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[#E5E7EB]">
                        {filteredEmployees.map(emp => {
                           const data = getEmployeePrimesData(emp);
                           return (
                              <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                                 <td className="p-6">
                                    <div className="flex items-center gap-4 text-start">
                                       <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black border border-gray-100 overflow-hidden">
                                          {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" /> : <User size={18} className="text-gray-300" />}
                                       </div>
                                       <div>
                                          <p className="font-bold text-[#111827]">{emp.fullName}</p>
                                          <p className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">{data.count} primes actives</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="p-6 text-right">
                                    <div className="text-right">
                                       <p className="font-black text-[#111827]">{data.total.toLocaleString()} DH</p>
                                       <p className="text-[9px] text-[#00A99D] font-bold uppercase">Incl. Ancienneté: {data.seniority.toLocaleString()} DH</p>
                                    </div>
                                 </td>
                                 <td className="p-6 text-center">
                                    <div className="flex items-center justify-center gap-2 max-w-[200px] mx-auto">
                                       <div className="flex-1 flex flex-col items-center">
                                          <span className="text-[10px] font-black text-emerald-500">{data.exempt.toLocaleString()}</span>
                                          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                             <div className="h-full bg-emerald-500" style={{ width: `${(data.exempt / (data.total || 1)) * 100}%` }}></div>
                                          </div>
                                       </div>
                                       <div className="flex-1 flex flex-col items-center">
                                          <span className="text-[10px] font-black text-amber-500">{data.taxable.toLocaleString()}</span>
                                          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                             <div className="h-full bg-amber-500" style={{ width: `${(data.taxable / (data.total || 1)) * 100}%` }}></div>
                                          </div>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="p-6 text-center">
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 w-fit mx-auto ${data.risks > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                       {data.risks > 0 ? <AlertTriangle size={12} /> : <BadgeCheck size={12} />}
                                       {data.risks > 0 ? `${data.risks} ALERTE(S)` : t.risk.low}
                                    </span>
                                 </td>
                                 <td className="p-6 text-right">
                                    <button
                                       onClick={() => { setSelectedEmpId(emp.id); setActiveTab('templates'); }}
                                       className="p-2 text-gray-400 hover:text-[#0078D4] hover:bg-blue-50 rounded-lg transition-all"
                                       title={t.btnTemplate}
                                    >
                                       <FileStack size={18} />
                                    </button>
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'templates' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
               {selectedEmpId && (
                  <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center justify-between mb-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0078D4] shadow-sm"><User size={24} /></div>
                        <div className="text-start">
                           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Application de Gabarit pour :</p>
                           <h4 className="text-lg font-black text-[#1A1F36]">{employees.find(e => e.id === selectedEmpId)?.fullName}</h4>
                        </div>
                     </div>
                     <button onClick={() => setSelectedEmpId(null)} className="p-2 hover:bg-blue-100 rounded-full text-blue-400"><X size={20} /></button>
                  </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {templates.map(tpl => (
                     <div key={tpl.id} className="airbnb-card p-10 bg-white border-[#E5E7EB] hover:border-[#0078D4] transition-all flex flex-col justify-between group">
                        <div className="text-start space-y-4">
                           <div className="flex justify-between items-start">
                              <div className="w-12 h-12 bg-[#F7F9FC] rounded-2xl flex items-center justify-center text-[#111827] mb-4">
                                 <LayoutGrid size={24} />
                              </div>
                              <button
                                 onClick={() => setEditingTemplate(tpl)}
                                 className="p-3 text-gray-300 hover:text-[#0078D4] hover:bg-blue-50 rounded-xl transition-all"
                                 title={t.editTpl}
                              >
                                 <Edit3 size={18} />
                              </button>
                           </div>
                           <h3 className="text-2xl font-black text-[#1A1F36] tracking-tighter">{tpl.name}</h3>
                           <p className="text-sm font-medium text-gray-400 leading-relaxed">{tpl.description}</p>

                           <div className="pt-6 space-y-3">
                              {tpl.primes.map(p => {
                                 const cat = PRIME_CATEGORIES.find(c => c.id === p.categoryId);
                                 return (
                                    <div key={p.categoryId} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                       <span className="text-xs font-bold text-gray-600">{cat?.name}</span>
                                       <span className="text-xs font-black text-[#111827]">{p.amount.toLocaleString()} DH</span>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>

                        <button
                           disabled={!selectedEmpId}
                           onClick={() => handleApplyTemplate(selectedEmpId!, tpl)}
                           className={`w-full mt-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${selectedEmpId ? 'btn-primary-gradient shadow-xl hover:scale-105 active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                        >
                           <ArrowUpCircle size={20} /> {t.applyTpl}
                        </button>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {activeTab === 'categories' && (
            <div className="airbnb-card bg-white border-[#E5E7EB] shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
               <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <div className="flex items-center gap-4 text-start">
                     <div className="w-10 h-10 bg-[#111827] text-white rounded-xl flex items-center justify-center shadow-lg"><Settings2 size={20} /></div>
                     <div>
                        <h3 className="text-xl font-black text-[#111827]">Configuration des Primes 2026</h3>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Base de connaissances légale Salery</p>
                     </div>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-[#F7F9FC] border-b">
                        <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                           <th className="p-6">Catégorie</th>
                           <th className="p-6">Type Fiscal</th>
                           <th className="p-6 text-center">Plafond Légal (Est.)</th>
                           <th className="p-6 text-center">Soumis CNSS</th>
                           <th className="p-6 text-center">Soumis IR</th>
                           <th className="p-6 text-center">Justificatif</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {PRIME_CATEGORIES.map(cat => (
                           <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-6 text-start">
                                 <p className="font-bold text-[#111827]">{cat.name}</p>
                                 <p className="text-[10px] text-gray-400">{cat.description}</p>
                              </td>
                              <td className="p-6">
                                 <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${cat.type === 'exoneree_plafonnee' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                    {cat.type.replace('_', ' ')}
                                 </span>
                              </td>
                              <td className="p-6 text-center">
                                 <div className="flex flex-col items-center">
                                    <span className="font-bold text-[#1A1F36]">
                                       {cat.plafondType === 'fixed' ? `${cat.plafondValue} DH` : cat.plafondType === 'smig_based' ? `${(2 * SMIG_2026 * 26).toFixed(0)} DH` : '---'}
                                    </span>
                                    {cat.plafondType === 'smig_based' && <span className="text-[7px] text-gray-400 font-black uppercase">(2x SMIG × 26j)</span>}
                                 </div>
                              </td>
                              <td className="p-6 text-center">
                                 {cat.soumisCnss ? <CheckCircle className="text-rose-500 mx-auto" size={18} /> : <ShieldCheck className="text-emerald-500 mx-auto" size={18} />}
                              </td>
                              <td className="p-6 text-center">
                                 {cat.soumisIr ? <CheckCircle className="text-rose-500 mx-auto" size={18} /> : <ShieldCheck className="text-emerald-500 mx-auto" size={18} />}
                              </td>
                              <td className="p-6 text-center">
                                 {cat.justificatifRequired ? <div className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-[8px] font-black uppercase mx-auto w-fit">Requis</div> : <span className="text-gray-300">Optionnel</span>}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {/* NEW ASSIGNMENT MODAL (FIX FOR NOUVELLE PRIME BUTTON) */}
         {showNewPrimeModal && (
            <div className="fixed inset-0 z-[1500] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-xl rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in duration-300 relative border border-gray-100">
                  <header className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-4 text-start">
                        <div className="w-12 h-12 bg-blue-50 text-[#0078D4] rounded-2xl flex items-center justify-center shadow-inner"><Plus size={24} /></div>
                        <div>
                           <h3 className="text-2xl font-black text-[#1A1F36] tracking-tighter">{t.assignTitle}</h3>
                           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t.assignSub}</p>
                        </div>
                     </div>
                     <button onClick={() => setShowNewPrimeModal(false)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-all"><X size={24} /></button>
                  </header>

                  <form onSubmit={handleCreateAssignment} className="p-10 space-y-8 text-start">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Collaborateur</label>
                        <div className="relative">
                           <select
                              required
                              value={assignmentForm.employeeId}
                              onChange={e => setAssignmentForm({ ...assignmentForm, employeeId: e.target.value })}
                              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all appearance-none cursor-pointer"
                           >
                              <option value="">Sélectionner...</option>
                              {employees.filter(e => e.employmentStatus === 'active').map(e => (
                                 <option key={e.id} value={e.id}>{e.fullName} ({e.internalMatricule})</option>
                              ))}
                           </select>
                           <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type de Prime</label>
                           <select
                              value={assignmentForm.categoryId}
                              onChange={e => setAssignmentForm({ ...assignmentForm, categoryId: e.target.value })}
                              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all"
                           >
                              {PRIME_CATEGORIES.map(cat => (
                                 <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Montant (DH)</label>
                           <input
                              required
                              type="number"
                              value={assignmentForm.amount}
                              onChange={e => setAssignmentForm({ ...assignmentForm, amount: Number(e.target.value) })}
                              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date d'effet</label>
                           <div className="relative">
                              <input
                                 type="date"
                                 value={assignmentForm.startDate}
                                 onChange={e => setAssignmentForm({ ...assignmentForm, startDate: e.target.value })}
                                 className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all"
                              />
                              <Calendar size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                           </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mt-6">
                           <div className="text-start">
                              <p className="text-xs font-black text-[#1A1F36] uppercase">Récurrent</p>
                              <p className="text-[8px] font-bold text-gray-400 uppercase">Mensuel automatique</p>
                           </div>
                           <button
                              type="button"
                              onClick={() => setAssignmentForm({ ...assignmentForm, recurring: !assignmentForm.recurring })}
                              className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${assignmentForm.recurring ? 'bg-[#0078D4]' : 'bg-gray-200'}`}
                           >
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${assignmentForm.recurring ? 'translate-x-6' : 'translate-x-0'}`}></div>
                           </button>
                        </div>
                     </div>

                     <button
                        type="submit"
                        className="w-full py-6 btn-primary-gradient text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 mt-4"
                     >
                        <CheckCircle2 size={24} /> {t.btnConfirm}
                     </button>
                  </form>
               </div>
            </div>
         )}

         {/* TEMPLATE EDITOR MODAL */}
         {editingTemplate && (
            <div className="fixed inset-0 z-[1500] bg-black/70 backdrop-blur-xl flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                  <header className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-4 text-start">
                        <div className="w-12 h-12 bg-blue-50 text-[#0078D4] rounded-2xl flex items-center justify-center shadow-inner"><Edit3 size={24} /></div>
                        <div>
                           <h3 className="text-2xl font-black text-[#1A1F36] tracking-tighter">{t.editTpl}</h3>
                           <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Configuration des Primes & Plafonds</p>
                        </div>
                     </div>
                     <button onClick={() => setEditingTemplate(null)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-all"><X size={24} /></button>
                  </header>

                  <form onSubmit={handleUpdateTemplate} className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-10 text-start">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom du Gabarit</label>
                           <input
                              required
                              type="text"
                              value={editingTemplate.name}
                              onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                           <input
                              required
                              type="text"
                              value={editingTemplate.description}
                              onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-[#0078D4] outline-none transition-all"
                           />
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex justify-between items-center">
                           <h4 className="text-sm font-black text-[#1A1F36] uppercase tracking-widest">Structure des Primes</h4>
                           <button
                              type="button"
                              onClick={addPrimeToEdit}
                              className="px-4 py-2 bg-blue-50 text-[#0078D4] rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-[#0078D4] hover:text-white transition-all shadow-sm"
                           >
                              <PlusCircle size={14} /> {t.addPrime}
                           </button>
                        </div>

                        <div className="space-y-4">
                           {editingTemplate.primes.map((p, idx) => (
                              <div key={idx} className="flex flex-col md:flex-row items-end gap-4 p-6 bg-gray-50 rounded-[28px] border border-gray-100 group animate-in slide-in-from-top-2">
                                 <div className="flex-1 space-y-2 w-full">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Catégorie de Prime</label>
                                    <select
                                       value={p.categoryId}
                                       onChange={e => updatePrimeInEdit(idx, 'categoryId', e.target.value)}
                                       className="w-full p-4 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#0078D4]"
                                    >
                                       {PRIME_CATEGORIES.map(cat => (
                                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                                       ))}
                                    </select>
                                 </div>
                                 <div className="w-full md:w-48 space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Montant (DH)</label>
                                    <input
                                       type="number"
                                       value={p.amount}
                                       onChange={e => updatePrimeInEdit(idx, 'amount', Number(e.target.value))}
                                       className="w-full p-4 bg-white border border-gray-200 rounded-xl text-xs font-black outline-none focus:border-[#0078D4]"
                                    />
                                 </div>
                                 <button
                                    type="button"
                                    onClick={() => removePrimeFromEdit(idx)}
                                    className="p-4 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                 >
                                    <Trash2 size={20} />
                                 </button>
                              </div>
                           ))}

                           {editingTemplate.primes.length === 0 && (
                              <div className="py-12 border-2 border-dashed border-gray-100 rounded-[32px] text-center bg-gray-50/30">
                                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Aucune prime configurée dans ce gabarit</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </form>

                  <footer className="p-8 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-2 text-emerald-600">
                        <ShieldCheck size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Calculs Temps Réel Actifs</span>
                     </div>
                     <button
                        onClick={handleUpdateTemplate}
                        className="px-10 py-4 btn-primary-gradient text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all"
                     >
                        <Save size={18} /> {t.saveTpl}
                     </button>
                  </footer>
               </div>
            </div>
         )}

         {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4">
               <AnalyticCard title="Masse Primes Exonérée" value="142,500 DH" sub="Ce mois-ci" color="text-[#34C759]" icon={<ShieldCheck size={20} />} />
               <AnalyticCard title="Portion Taxable" value="48,200 DH" sub="Soumis CNSS/IR" color="text-amber-500" icon={<TrendingUp size={20} />} />
               <AnalyticCard title="Risque Audit Global" value="12%" sub="Basé sur les justificatifs" color="text-rose-500" icon={<AlertTriangle size={20} />} />

               <div className="lg:col-span-2 airbnb-card p-10 bg-white border-[#E5E7EB] shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                     <h4 className="text-xl font-black text-[#1A1F36]">Distribution des Primes</h4>
                     <PieChart size={24} className="text-gray-200" />
                  </div>
                  <div className="space-y-6">
                     <DistributionRow label="Transport (Plafonné)" pct={45} color="bg-[#0078D4]" amount="84,000 DH" />
                     <DistributionRow label="Panier (SMIG Based)" pct={25} color="bg-[#00A99D]" amount="46,000 DH" />
                     <DistributionRow label="Ancienneté (Obligatoire)" pct={20} color="bg-[#111827]" amount="37,000 DH" />
                     <DistributionRow label="Rendement (Taxable)" pct={10} color="bg-amber-400" amount="18,000 DH" />
                  </div>
               </div>

               <div className="airbnb-card p-10 bg-[#111827] text-white border-none shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={140} /></div>
                  <h4 className="text-xl font-black mb-6 relative z-10">IA Compliance</h4>
                  <p className="text-sm text-gray-400 leading-relaxed mb-8 relative z-10">
                     Notre agent IA détecte les anomalies de plafonds en temps réel pour prévenir les redressements de la Caisse Nationale de Sécurité Sociale.
                  </p>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[#0078D4]">
                        <span>Score Conformité</span>
                        <span>94%</span>
                     </div>
                     <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0078D4]" style={{ width: '94%' }}></div>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

const AnalyticCard = ({ title, value, sub, color, icon }: any) => (
   <div className="airbnb-card p-8 bg-white border-[#E5E7EB] shadow-sm text-start flex flex-col justify-between h-48 hover:shadow-md transition-all">
      <div className="flex justify-between items-start">
         <div className="p-3 bg-[#F7F9FC] rounded-2xl text-gray-400">{icon}</div>
      </div>
      <div>
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
         <p className={`text-2xl font-black ${color} tracking-tighter`}>{value}</p>
         <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{sub}</p>
      </div>
   </div>
);

const DistributionRow = ({ label, pct, color, amount }: any) => (
   <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
         <span className="text-gray-500">{label}</span>
         <span className="text-[#1A1F36]">{amount} ({pct}%)</span>
      </div>
      <div className="h-2 bg-[#F7F9FC] rounded-full overflow-hidden">
         <div className={`h-full ${color}`} style={{ width: `${pct}%` }}></div>
      </div>
   </div>
);

const TabBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
   <button onClick={onClick} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-white shadow-md text-[#0078D4]' : 'text-gray-400 hover:text-gray-600'}`}>
      {icon} {label}
   </button>
);

export default PrimeManager;
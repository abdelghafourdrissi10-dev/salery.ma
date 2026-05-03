import React, { useState, useEffect } from 'react';
import {
   User, Briefcase, CreditCard, FileText, History,
   X, Mail, Phone, MapPin, Hash, ShieldCheck,
   CheckCircle2, Upload, Download, Trash2, AlertCircle,
   Calendar, Landmark, Globe, Activity, Shield,
   ChevronRight, ArrowLeft, RefreshCw, FileSignature,
   AtSign, Baby, Heart, BadgeCheck, Lock, MoreVertical,
   Plus, Key, ShieldAlert, UserX, UserCheck, Camera,
   File as FileIcon, Image as ImageIcon, FileStack,
   Search, Filter, Layers, Fingerprint, ChevronLeft,
   Building2
} from 'lucide-react';
import {
   Employee, Language, AuthUser, EmployeeDocument,
   ActionLog, SystemUser
} from '../types.ts';
import { simulateUpload, formatFileSize, validateFile } from '../services/documentVault.ts';

interface Props {
   employee: Employee;
   lang: Language;
   user: AuthUser;
   onClose: () => void;
   onUpdate: (updatedEmp: Employee) => void;
}

const EmployeeProfile: React.FC<Props> = ({ employee, lang, user, onClose, onUpdate }) => {
   const [activeTab, setActiveTab] = useState<'profile' | 'professional' | 'payroll' | 'documents' | 'audit'>('profile');
   const [isUploading, setIsUploading] = useState(false);
   const [localEmp, setLocalEmp] = useState<Employee>(employee);
   const [linkedUser, setLinkedUser] = useState<SystemUser | null>(null);
   const [uploadError, setUploadError] = useState<string | null>(null);
   const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

   const [uploadType, setUploadType] = useState<EmployeeDocument['type']>('OTHER');

   useEffect(() => {
      const allUsersRaw = localStorage.getItem('salaire_system_users');
      const allUsers = allUsersRaw ? JSON.parse(allUsersRaw) : [];
      const found = allUsers.find((u: any) => u.employeeId === employee.id || u.email === employee.email);
      setLinkedUser(found || null);
   }, [employee.id, employee.email]);

   const logAction = (action: string, details?: string) => {
      const log: ActionLog = {
         userId: user.id,
         userName: `${user.firstName} ${user.lastName}`,
         userRole: user.role,
         action,
         timestamp: Date.now(),
         details
      };
      const updated = { ...localEmp, auditHistory: [log, ...(localEmp.auditHistory || [])] };
      setLocalEmp(updated);
      onUpdate(updated);
   };

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const error = validateFile(file);
      if (error) { setUploadError(error); return; }
      setIsUploading(true);
      try {
         const newDoc = await simulateUpload(file, localEmp.id, uploadType, user.id);
         const updated = { ...localEmp, documents: [...(localEmp.documents || []), newDoc] };
         setLocalEmp(updated);
         onUpdate(updated);
         logAction("DOCUMENT_UPLOAD", `Catégorie: ${uploadType}`);
      } catch (err) { setUploadError("Erreur d'envoi."); } finally { setIsUploading(false); }
   };

   const handleDeleteDoc = (docId: string) => {
      if (!window.confirm("Confirmer la suppression ?")) return;
      const updatedDocs = (localEmp.documents || []).filter(d => d.id !== docId);
      const updated = { ...localEmp, documents: updatedDocs };
      setLocalEmp(updated);
      onUpdate(updated);
      logAction("DOCUMENT_DELETE", `ID: ${docId}`);
   };

   const t = {
      fr: {
         tabs: { profile: "Identité", professional: "Carrière", payroll: "Paie & RIB", documents: "Documents", audit: "Sécurité" },
         save: "Enregistrer"
      }
   }[lang === 'ar' ? 'fr' : 'fr'];

   return (
      // FIX: Changed 'fixed' to 'absolute' so it starts after the Nav Sidebar in the content area
      // Added 'z-[50]' to stay above dashboard content but under global navigation if needed
      <div className="absolute inset-0 z-[50] bg-white flex overflow-hidden animate-in fade-in duration-200">

         {/* 1. LEFT EMPLOYEE PANEL - FIXED WIDTH, INDEPENDENT SCROLL */}
         <aside className={`bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-300 shrink-0 z-20 ${isSidebarCollapsed ? 'w-16' : 'w-[280px]'}`}>
            <div className="p-4 flex items-center justify-between border-b border-gray-50 bg-white sticky top-0 z-10 shrink-0 h-16">
               {!isSidebarCollapsed && (
                  <button onClick={onClose} className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg hover:bg-rose-100 transition-all">
                     <ArrowLeft size={18} />
                  </button>
               )}
               <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className={`p-2 text-gray-400 hover:bg-gray-50 rounded-lg ${isSidebarCollapsed ? 'mx-auto' : ''}`}>
                  {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
               </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-6">
               <div className="flex flex-col items-center px-4 space-y-4">
                  <div className="relative">
                     <div className={`${isSidebarCollapsed ? 'w-10 h-10' : 'w-24 h-24'} rounded-2xl bg-[#F9FAFB] border-2 border-white shadow-lg overflow-hidden flex items-center justify-center transition-all`}>
                        {localEmp.photo ? <img src={localEmp.photo} className="w-full h-full object-cover" /> : <div className="gradient-bg w-full h-full flex items-center justify-center text-white font-black text-xl">{localEmp.fullName[0]}</div>}
                     </div>
                     {!isSidebarCollapsed && (
                        <label className="absolute -bottom-1 -right-1 p-2 bg-[#111827] text-white rounded-xl shadow-lg cursor-pointer hover:scale-110 transition-transform">
                           <Camera size={12} /><input type="file" className="hidden" accept="image/*" onChange={(e) => { }} />
                        </label>
                     )}
                  </div>

                  {!isSidebarCollapsed && (
                     <div className="text-center w-full px-2">
                        <h2 className="text-base font-black text-[#111827] tracking-tighter truncate leading-tight uppercase">{localEmp.fullName}</h2>
                        <div className="flex items-center justify-center gap-2 mt-1">
                           <span className="px-2 py-0.5 bg-blue-50 text-[#0078D4] rounded text-[7px] font-black uppercase tracking-widest">{localEmp.jobTitle}</span>
                           <div className={`w-1.5 h-1.5 rounded-full ${localEmp.employmentStatus === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                        </div>
                     </div>
                  )}
               </div>

               {!isSidebarCollapsed && (
                  <div className="mt-8 px-6 space-y-5 animate-in fade-in">
                     <SideItem icon={<Hash size={12} />} label="Matricule" val={localEmp.internalMatricule} />
                     <SideItem icon={<Fingerprint size={12} />} label="CIN" val={localEmp.cin} />
                     <SideItem icon={<Building2 size={12} />} label="Site" val={localEmp.assignedSite || 'Siège'} />
                     <SideItem icon={<Mail size={12} />} label="E-mail" val={localEmp.email} isLong />
                  </div>
               )}
            </div>

            {!isSidebarCollapsed && (
               <div className="p-4 border-t border-gray-50 mt-auto bg-gray-50/30">
                  <div className="p-3 bg-white rounded-xl border border-gray-100 flex items-center gap-2 shadow-sm">
                     <BadgeCheck size={14} className="text-[#0078D4]" />
                     <span className="text-[8px] font-black text-blue-900 uppercase tracking-widest">Dossier Certifié</span>
                  </div>
               </div>
            )}
         </aside>

         {/* 2. MAIN WORKSPACE AREA - FLEX GROW, INDEPENDENT SCROLL */}
         <div className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB]">

            {/* STICKY HEADER - COMPACT FOR 768p */}
            <div className="sticky top-0 bg-white border-b border-[#E5E7EB] z-10 shrink-0">
               <div className="px-6 py-2 flex items-center justify-between h-10">
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Profil</span>
                     <ChevronRight size={10} className="text-gray-200" />
                     <span className="text-[9px] font-black text-[#0078D4] uppercase tracking-widest truncate max-w-[150px]">{localEmp.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md text-[8px] font-black uppercase">Actif</span>
                  </div>
               </div>

               <div className="px-6 flex gap-6 overflow-x-auto no-scrollbar">
                  {Object.entries(t.tabs).map(([id, label]) => (
                     <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`pb-2 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === id ? 'text-[#0078D4]' : 'text-gray-400 hover:text-gray-600'}`}
                     >
                        {label}
                        {activeTab === id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0078D4] animate-in slide-in-from-left-1"></div>}
                     </button>
                  ))}
               </div>
            </div>

            {/* MAIN CONTENT ZONE - SCROLLABLE */}
            <div className="flex-1 overflow-y-auto custom-scroll p-6 md:p-8">
               <div className="max-w-4xl mx-auto space-y-6">

                  {activeTab === 'profile' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
                        <SectionCard title="Identité Civile" icon={<User size={14} />}>
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                              <DataField label="Civilité" val={localEmp.civility} />
                              <DataField label="Nationalité" val={localEmp.nationality} />
                              <DataField label="Situation" val={localEmp.maritalStatus} />
                              <DataField label="Naissance" val={localEmp.dob} />
                              <DataField label="Lieu" val={localEmp.pob} />
                              <DataField label="Enfants" val={localEmp.childrenCount?.toString()} />
                              <div className="sm:col-span-3">
                                 <DataField label="Adresse Résidentielle" val={localEmp.physicalAddress} />
                              </div>
                           </div>
                        </SectionCard>
                     </div>
                  )}

                  {activeTab === 'professional' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
                        <SectionCard title="Contrat & Poste" icon={<Briefcase size={14} />}>
                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              <DataField label="Intitulé" val={localEmp.jobTitle} highlight />
                              <DataField label="Département" val={localEmp.department} />
                              <DataField label="Type" val={localEmp.contractType} isTag />
                              <DataField label="Embauche" val={localEmp.hireDate} />
                              <DataField label="Site" val={localEmp.assignedSite} isTag />
                              <DataField label="Manager" val={localEmp.manager || 'N/A'} />
                           </div>
                        </SectionCard>
                     </div>
                  )}

                  {activeTab === 'payroll' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
                        <SectionCard title="Paramètres Bancaires" icon={<Landmark size={14} />}>
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                              <DataField label="Salaire Brut" val={`${localEmp.baseSalary.toLocaleString()} MAD`} highlight />
                              <DataField label="Mode" val={localEmp.paymentMethod} />
                              <DataField label="Banque" val={localEmp.bankName} />
                              <div className="sm:col-span-3">
                                 <DataField label="R.I.B (24 chiffres)" val={localEmp.rib} isMono />
                              </div>
                           </div>
                        </SectionCard>
                     </div>
                  )}

                  {activeTab === 'documents' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm">
                           <div className="text-start">
                              <h3 className="text-sm font-black text-[#111827] uppercase tracking-tight">Coffre-fort Documents</h3>
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">Souveraineté CNDP V26</p>
                           </div>
                           <div className="flex gap-2">
                              <select value={uploadType} onChange={e => setUploadType(e.target.value as any)} className="bg-[#F7F9FC] border border-gray-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase outline-none">
                                 <option value="CONTRACT">Contrat</option>
                                 <option value="CIN">CIN</option>
                                 <option value="CNSS">Social</option>
                                 <option value="OTHER">Autre</option>
                              </select>
                              <label className="bg-[#111827] text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer flex items-center gap-2 hover:bg-black transition-all">
                                 {isUploading ? <RefreshCw size={10} className="animate-spin" /> : <Upload size={10} />} AJOUTER
                                 <input type="file" className="hidden" onChange={handleFileUpload} />
                              </label>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {(localEmp.documents || []).map(doc => (
                              <div key={doc.id} className="airbnb-card p-4 bg-white border-[#E5E7EB] hover:border-[#0078D4] flex items-center justify-between group transition-all">
                                 <div className="flex items-center gap-3 truncate">
                                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-[#0078D4] shrink-0">
                                       {doc.mimeType?.includes('image') ? <ImageIcon size={14} /> : <FileIcon size={14} />}
                                    </div>
                                    <div className="truncate">
                                       <p className="text-[10px] font-black text-[#1A1F36] truncate">{doc.name}</p>
                                       <p className="text-[7px] font-bold text-gray-400 uppercase">{formatFileSize(doc.size)}</p>
                                    </div>
                                 </div>
                                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={doc.url} download className="p-1.5 text-gray-400 hover:text-[#0078D4]"><Download size={12} /></a>
                                    <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 text-gray-400 hover:text-rose-500"><Trash2 size={12} /></button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {activeTab === 'audit' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-1 duration-200">
                        <SectionCard title="Gouvernance & Audit" icon={<Lock size={14} />}>
                           <div className="space-y-3">
                              {(localEmp.auditHistory || []).map((log, i) => (
                                 <div key={i} className="flex items-center gap-3 p-3 bg-white border border-[#E5E7EB] rounded-xl hover:border-[#0078D4] transition-all">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex justify-between items-center">
                                          <p className="text-[9px] font-black text-[#1A1F36] uppercase truncate">{log.action}</p>
                                          <span className="text-[8px] font-bold text-gray-300">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                       </div>
                                       <p className="text-[8px] font-medium text-gray-400 truncate">Par {log.userName} • {log.details || 'Validation système'}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </SectionCard>
                     </div>
                  )}

               </div>
            </div>

            {/* 3. COMPACT FOOTER ACTIONS */}
            <footer className="px-6 py-3 bg-white border-t border-[#E5E7EB] flex items-center justify-between z-10 shrink-0 h-14">
               <div className="flex items-center gap-2">
                  <RefreshCw size={10} className="text-[#0078D4] animate-spin" />
                  <span className="text-[8px] font-black text-[#0078D4] uppercase tracking-widest">Auto-sync V26</span>
               </div>
               <div className="flex gap-3">
                  <button onClick={onClose} className="px-5 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-rose-100 transition-all">Annuler</button>
                  <button onClick={() => onClose()} className="px-8 py-2 bg-[#0078D4] text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                     <CheckCircle2 size={12} /> {t.save}
                  </button>
               </div>
            </footer>
         </div>
      </div>
   );
};

// COMPACT REUSABLE COMPONENTS
const SectionCard = ({ title, icon, children }: any) => (
   <div className="bg-white rounded-[20px] border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      <div className="px-5 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center gap-2 shrink-0">
         <div className="text-[#0078D4]">{icon}</div>
         <h3 className="text-[9px] font-black text-[#111827] uppercase tracking-widest">{title}</h3>
      </div>
      <div className="p-6">
         {children}
      </div>
   </div>
);

const SideItem = ({ icon, label, val, isLong }: any) => (
   <div className="text-start space-y-0.5 group">
      <div className="flex items-center gap-2 text-gray-300 group-hover:text-[#0078D4] transition-colors">
         {icon}
         <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-[11px] font-bold text-[#111827] ${isLong ? 'break-all leading-tight' : 'truncate'}`}>{val || '---'}</p>
   </div>
);

const DataField = ({ label, val, highlight, isTag, isMono }: any) => (
   <div className="space-y-1 text-start">
      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block ml-0.5">{label}</label>
      {isTag ? (
         <span className="px-2 py-0.5 bg-blue-50 text-[#0078D4] border border-blue-100 rounded-md text-[8px] font-black uppercase inline-block">{val || '---'}</span>
      ) : (
         <p className={`${highlight ? 'text-base font-black text-[#0078D4] tracking-tight' : 'text-[13px] font-bold text-[#111827]'} ${isMono ? 'font-mono text-[10px]' : ''} truncate`}>
            {val || '---'}
         </p>
      )}
   </div>
);

export default EmployeeProfile;
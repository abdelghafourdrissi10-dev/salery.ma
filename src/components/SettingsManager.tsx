import React, { useState, useEffect } from 'react';
import {
   UserPlus, Building, MapPin, Camera, ImageIcon,
   FileBadge, PenTool, CheckCircle2, ShieldCheck, Mail,
   Phone, Hash, RefreshCw, Landmark, Save, Trash, FileDown,
   FileSignature, Landmark as BankIcon, Map as MapIcon,
   Mail as MailIcon, Smartphone, Key, Shield, UserCog, User, X, Info,
   Lock, ChevronDown, UserCheck, ShieldAlert, Edit3
} from 'lucide-react';
import { Language, AuthUser, SystemUser, CompanyProfile, UserRole } from '../types.ts';
import { MONTHLY_SMIG, CNSS_CEILING, CNSS_SALARIAL_RATE, AMO_SALARIAL_RATE, PROF_EXPENSES_CAP } from '../constants.ts';
import InviteTracker from './InviteTracker.tsx';

interface Props {
   lang: Language;
   user: AuthUser;
   setUser: (u: AuthUser) => void;
}

const SettingsManager: React.FC<Props> = ({ lang, user, setUser }) => {
   const [activeSubTab, setActiveSubTab] = useState<'branding' | 'users' | 'fiscality' | 'onboarding'>('branding');
   const [showUserModal, setShowUserModal] = useState(false);
   const [editingUserId, setEditingUserId] = useState<string | null>(null);

   const [company, setCompany] = useState<CompanyProfile>(() => {
      const saved = localStorage.getItem('salaire_company_profile');
      return saved ? JSON.parse(saved) : {
         id: 'COMP-1', name: 'Salery Enterprise MA', physicalAddress: 'Angle Bd Zerktouni & Bd Massira', city: 'Casablanca', country: 'MA',
         rc: '', ice: '', ifCode: '', cnssEmployer: '', rib: '', phone: '', email: '',
         settings: { defaultSignatoryName: 'Le Directeur RH', companyStampUrl: '' }
      };
   });

   const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
      const saved = localStorage.getItem('salaire_system_users');
      return saved ? JSON.parse(saved) : [
         { id: '1', firstName: 'Yassine', lastName: 'RH', email: 'rh@entreprise.ma', role: 'TEAM_RH', status: 'active', assignedSite: 'S1', companyId: user.companyId, companyName: user.companyName, createdAt: '2025-01-01' },
         { id: '2', firstName: 'Salima', lastName: 'Compta', email: 'finance@entreprise.ma', role: 'COMPTABLE', status: 'active', assignedSite: 'S1', companyId: user.companyId, companyName: user.companyName, createdAt: '2025-02-15' }
      ];
   });

   const [userFormData, setUserFormData] = useState<Partial<SystemUser>>({
      firstName: '',
      lastName: '',
      email: '',
      role: 'TEAM_RH',
      status: 'active'
   });

   const handleSaveCompany = () => {
      localStorage.setItem('salaire_company_profile', JSON.stringify(company));
      alert(lang === 'ar' ? 'تم حفظ التعديلات بنجاح' : lang === 'en' ? 'Profile saved successfully' : 'Profil enregistré avec succès');
   };

   const handleUserAction = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingUserId) {
         const updatedUsers = systemUsers.map(u => u.id === editingUserId ? { ...u, ...userFormData } as SystemUser : u);
         setSystemUsers(updatedUsers);
         localStorage.setItem('salaire_system_users', JSON.stringify(updatedUsers));
      } else {
         const userToCreate: SystemUser = {
            ...userFormData as SystemUser,
            id: `USER-${Date.now()}`,
            companyId: user.companyId,
            companyName: user.companyName,
            assignedSite: 'S1',
            createdAt: new Date().toISOString().split('T')[0]
         };
         const updatedUsers = [...systemUsers, userToCreate];
         setSystemUsers(updatedUsers);
         localStorage.setItem('salaire_system_users', JSON.stringify(updatedUsers));
      }
      setShowUserModal(false);
      setEditingUserId(null);
      setUserFormData({ firstName: '', lastName: '', email: '', role: 'TEAM_RH', status: 'active' });
   };

   const handleEditUser = (u: SystemUser) => {
      setEditingUserId(u.id);
      setUserFormData(u);
      setShowUserModal(true);
   };

   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature') => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
            if (field === 'logo') setCompany({ ...company, logoUrl: reader.result as string });
            else setCompany({ ...company, settings: { ...company.settings, companyStampUrl: reader.result as string } });
         };
         reader.readAsDataURL(file);
      }
   };

   const t = {
      fr: {
         users: "Utilisateurs", branding: "Profil Entreprise", fiscality: "Fiscalité & LOI", save: "ENREGISTRER",
         companyTitle: "Identité de l'entreprise", companySub: "Identifiants légaux et coordonnées pour la paie marocaine.",
         usersTitle: "Gouvernance des accès", usersSub: "Gérez les rôles administratifs de votre tenant Salery.",
         fiscalTitle: "Paramètres Fiscaux Maroc 2026", fiscalSub: "Seuils légaux et taux appliqués par le moteur Salery.",
         addUser: "AJOUTER UN ADMINISTRATEUR",
         editAccess: "ÉDITER L'ACCÈS",
         createTitle: editingUserId ? "Modifier Droits d'Accès" : "Nouveaux Droits d'Accès",
         createSub: "Définissez un profil administratif sécurisé.",
         confirmCreate: editingUserId ? "Enregistrer les modifications" : "Confirmer la création",
         fields: {
            name: "Raison Sociale", address: "Adresse Physique", city: "Ville", ice: "ICE (15 chiffres)", rc: "R.C. (Registre Commerce)",
            if: "Identifiant Fiscal", cnss: "Affiliation CNSS", rib: "R.I.B. (24 chiffres)", phone: "Téléphone", email: "E-mail de contact",
            signatory: "Nom du Signataire", first: "Prénom", last: "Nom", role: "Rôle assigné"
         },
         vault: { title: "Coffre Numérique", logo: "Logo d'entreprise", signature: "Signature & Cachet", sub: "Certification V25" },
         updates: {
            title: "Mises à jour automatiques",
            desc: "Le moteur Salery applique automatiquement les barèmes de l'IR et les taux sociaux en vigueur suite au Décret n° 2.25.983.",
            lastSync: "Dernière Synchronisation",
            status: "Loi de Finances 2026 v2.0 • Active"
         },
         onboarding: "Onboarding & Invitations"
      },
      ar: {
         users: "المستخدمون", branding: "ملف الشركة", fiscality: "الضرائب والقانون", save: "حفظ",
         companyTitle: "هوية المقاولة", companySub: "التعريفات القانونية ومعلومات الاتصال الضرورية لإعداد الأجور.",
         usersTitle: "إدارة الولوج", usersSub: "تسيير الأدوار الإدارية لمؤسستك على منصة Salery.",
         fiscalTitle: "الإعدادات الضريبية المغرب 2026", fiscalSub: "الحدود القانونية والمعدلات المطبقة من طرف نظام Salery.",
         addUser: "إضافة مدير",
         editAccess: "تعديل الولوج",
         createTitle: editingUserId ? "تعديل حقوق الولوج" : "حقوق ولوج جديدة",
         createSub: "حدد ملفًا إداريًا آمنًا.",
         confirmCreate: editingUserId ? "حفظ التغييرات" : "تأكيد الإنشاء",
         fields: {
            name: "الاسم التجاري", address: "العنوان الفعلي", city: "المدينة", ice: "التعريف الموحد للمقاولة", rc: "السجل التجاري",
            if: "التعريف الضريبي", cnss: "رقم الانخراط في الضمان الاجتماعي", rib: "رقم الحساب البنكي (RIB)", phone: "الهاتف", email: "البريد الإلكتروني",
            signatory: "اسم الموقع", first: "الاسم الشخصي", last: "الاسم العائلي", role: "الدور المعين"
         },
         vault: { title: "المخزن الرقمي", logo: "شعار المقاولة", signature: "التوقيع والختم", sub: "اعتماد V25" },
         updates: {
            title: "تحديثات تلقائية",
            desc: "يطبق محرك Salery تلقائيًا جداول ضريبة الدخل والمعدلات الاجتماعية المعمول بها وفقًا للمرسوم رقم 2.25.983.",
            lastSync: "آخر مزامنة",
            status: "قانون المالية 2026 للإصدار 2.0 • نشط"
         }
      }
   }[lang] || {
      fr: {
         users: "Utilisateurs", branding: "Profil Entreprise", fiscality: "Fiscalité & LOI", save: "ENREGISTRER",
         companyTitle: "Identité de l'entreprise", companySub: "Identifiants légaux et coordonnées pour la paie marocaine.",
         usersTitle: "Gouvernance des accès", usersSub: "Gérez les rôles administratifs de votre tenant Salery.",
         fiscalTitle: "Paramètres Fiscaux Maroc 2026", fiscalSub: "Seuils légaux et taux appliqués par le moteur Salery.",
         addUser: "AJOUTER UN ADMINISTRATEUR",
         editAccess: "ÉDITER L'ACCÈS",
         createTitle: "Nouveaux Droits d'Accès",
         createSub: "Définissez un profil administratif sécurisé.",
         confirmCreate: "Confirmer la création",
         fields: {
            name: "Raison Sociale", address: "Adresse Physique", city: "Ville", ice: "ICE (15 chiffres)", rc: "R.C. (Registre Commerce)",
            if: "Identifiant Fiscal", cnss: "Affiliation CNSS", rib: "R.I.B. (24 chiffres)", phone: "Téléphone", email: "E-mail de contact",
            signatory: "Nom du Signataire", first: "Prénom", last: "Nom", role: "Rôle assigné"
         },
         vault: { title: "Coffre Numérique", logo: "Logo d'entreprise", signature: "Signature & Cachet", sub: "Certification V25" },
         updates: {
            title: "Mises à jour automatiques",
            desc: "Le moteur Salery applique automatiquement les barèmes de l'IR et les taux sociaux en vigueur suite au Décret n° 2.25.983.",
            lastSync: "Dernière Synchronisation",
            status: "Loi de Finances 2026 v2.0 • Active"
         }
      }
   }.fr;

   const isRHOrAdmin = ['SUPER_ADMIN', 'COMPANY_OWNER', 'DIRECTEUR_RH', 'TEAM_RH'].includes(user.role);
   // Restore access to User Governance for HR Director as requested.
   const isFullAdmin = ['SUPER_ADMIN', 'COMPANY_OWNER', 'DIRECTEUR_RH'].includes(user.role);

   return (
      <div className="space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="text-start">
               <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter">
                  {user.role === 'EMPLOYEE' ? (lang === 'ar' ? 'الأمان' : 'Sécurité') : (lang === 'ar' ? 'الإعدادات' : 'Configuration')}
               </h2>
               <p className="text-[#64748B] mt-1 font-medium italic">
                  {user.role === 'EMPLOYEE'
                     ? (lang === 'ar' ? 'إدارة الوصول والأمان الخاص بي' : 'Gérez vos accès et votre sécurité.')
                     : (lang === 'ar' ? 'الإعدادات العامة لـ Salery.ma • البنية التحتية السيادية V26' : 'Paramètres globaux Salery.ma • V26 Sovereign Infrastructure')}
               </p>
            </div>

            {user.role !== 'EMPLOYEE' && (
               <div className="flex bg-[#F1F5F9] p-1.5 rounded-2xl border border-[#E2E8F0] shadow-sm overflow-x-auto no-scrollbar max-w-full">
                  <button onClick={() => setActiveSubTab('branding')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeSubTab === 'branding' ? 'bg-white shadow-md text-teal-600' : 'text-gray-400'}`}>{t.branding}</button>
                  {isFullAdmin && <button onClick={() => setActiveSubTab('users')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeSubTab === 'users' ? 'bg-white shadow-md text-teal-600' : 'text-gray-400'}`}>{t.users}</button>}
                  {isFullAdmin && <button onClick={() => setActiveSubTab('onboarding')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeSubTab === 'onboarding' ? 'bg-white shadow-md text-teal-600' : 'text-gray-400'}`}>{t.onboarding}</button>}
                  {isRHOrAdmin && <button onClick={() => setActiveSubTab('fiscality')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeSubTab === 'fiscality' ? 'bg-white shadow-md text-teal-600' : 'text-gray-400'}`}>{t.fiscality}</button>}
               </div>
            )}
         </header>

         {activeSubTab === 'branding' && (
            <div className={`grid grid-cols-1 ${user.role !== 'EMPLOYEE' ? 'lg:grid-cols-12' : ''} gap-8`}>
               <div className={user.role !== 'EMPLOYEE' ? 'lg:col-span-8 space-y-6' : 'space-y-6'}>
                  <div className="bg-white p-10 space-y-10 border border-[#E2E8F0] rounded-[32px] shadow-sm">
                     <div className="flex items-center gap-6">
                        <div className="p-5 bg-teal-50 text-teal-600 rounded-3xl border border-teal-100 shadow-inner">
                           {user.role === 'EMPLOYEE' ? <User size={36} /> : <Building size={36} />}
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">
                              {user.role === 'EMPLOYEE' ? 'Informations de connexion' : t.companyTitle}
                           </h3>
                           <p className="text-sm font-medium text-[#64748B]">
                              {user.role === 'EMPLOYEE' ? 'Vérifiez et sécurisez votre accès.' : t.companySub}
                           </p>
                        </div>
                     </div>

                     <div className="space-y-12">
                        {user.role === 'EMPLOYEE' ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Input label="Prénom" value={user.firstName} onChange={() => { }} icon={<User size={16} />} disabled />
                              <Input label="Nom" value={user.lastName} onChange={() => { }} icon={<User size={16} />} disabled />
                              <div className="md:col-span-2">
                                 <Input label="E-mail professionnel" value={user.email} onChange={() => { }} icon={<MailIcon size={16} />} disabled />
                              </div>
                              <div className="md:col-span-2 border-t border-gray-50 pt-8">
                                 <SectionTitle icon={<Lock size={14} />} label="Sécurité du compte" />
                                 <p className="text-xs font-medium text-gray-500 mb-6 italic">Modifiez vos paramètres de sécurité ou vos préférences de notification.</p>
                                 <button className="px-6 py-3 bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Réinitialiser le mot de passe</button>
                              </div>
                           </div>
                        ) : (
                           <>
                              <SectionTitle icon={<MapIcon size={14} />} label="Coordonnées & Siège" />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="md:col-span-2"><Input label={t.fields.name} value={company.name} onChange={v => setCompany({ ...company, name: v })} icon={<Building size={16} />} /></div>
                                 <div className="md:col-span-2"><Input label={t.fields.address} value={company.physicalAddress} onChange={v => setCompany({ ...company, physicalAddress: v })} icon={<MapPin size={16} />} /></div>
                                 <Input label={t.fields.city} value={company.city} onChange={v => setCompany({ ...company, city: v })} icon={<MapPin size={16} />} />
                                 <Input label={t.fields.phone} value={company.phone || ''} onChange={v => setCompany({ ...company, phone: v })} icon={<Smartphone size={16} />} />
                                 <Input label={t.fields.email} value={company.email || ''} onChange={v => setCompany({ ...company, email: v })} icon={<MailIcon size={16} />} />
                                 <Input label={t.fields.signatory} value={company.settings.defaultSignatoryName} onChange={v => setCompany({ ...company, settings: { ...company.settings, defaultSignatoryName: v } })} icon={<User size={16} />} />
                              </div>

                              <SectionTitle icon={<Landmark size={14} />} label="Identifiants Légaux & Banque" />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <Input label={t.fields.ice} value={company.ice} onChange={v => setCompany({ ...company, ice: v })} icon={<Hash size={16} />} />
                                 <Input label={t.fields.rc} value={company.rc} onChange={v => setCompany({ ...company, rc: v })} icon={<FileBadge size={16} />} />
                                 <Input label={t.fields.if} value={company.ifCode || ''} onChange={v => setCompany({ ...company, ifCode: v })} icon={<ShieldCheck size={16} />} />
                                 <Input label={t.fields.cnss} value={company.cnssEmployer} onChange={v => setCompany({ ...company, cnssEmployer: v })} icon={<RefreshCw size={16} />} />
                                 <div className="md:col-span-2"><Input label={t.fields.rib} value={company.rib || ''} onChange={v => setCompany({ ...company, rib: v })} icon={<BankIcon size={16} />} /></div>
                              </div>

                              <button onClick={handleSaveCompany} className="w-full py-6 animated-gradient text-white font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-teal-500/20 active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center gap-4">
                                 <Save size={20} /> {t.save}
                              </button>
                           </>
                        )}
                     </div>
                  </div>
               </div>

               {user.role !== 'EMPLOYEE' && (
                  <div className="lg:col-span-4 space-y-6">
                     <div className="bg-[#F8FAFC] p-10 rounded-[40px] border border-[#E2E8F0] space-y-12">
                        <div className="text-start">
                           <h4 className="text-xl font-black text-[#0F172A] flex items-center gap-3"><Lock size={20} className="text-teal-600" /> {t.vault.title}</h4>
                           <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mt-1">{t.vault.sub}</p>
                        </div>

                        <div className="space-y-10">
                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">{t.vault.logo}</label>
                              <div className="relative group">
                                 <div className="w-full h-44 bg-white rounded-[32px] flex items-center justify-center border-2 border-dashed border-[#E2E8F0] transition-all group-hover:border-teal-500 overflow-hidden shadow-inner">
                                    {company.logoUrl ? (
                                       <img src={company.logoUrl} className="max-w-[80%] max-h-[80%] object-contain mix-blend-multiply" alt="Logo" />
                                    ) : (
                                       <ImageIcon className="text-gray-300" size={48} />
                                    )}
                                 </div>
                                 <label className="absolute -bottom-3 -right-3 p-3.5 bg-[#0F172A] text-white rounded-2xl shadow-2xl cursor-pointer hover:scale-110 transition-all">
                                    <Camera size={20} />
                                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'logo')} />
                                 </label>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">{t.vault.signature}</label>
                              <div className="relative group">
                                 <div className="w-full h-44 bg-white rounded-[32px] flex items-center justify-center border-2 border-dashed border-[#E2E8F0] transition-all group-hover:border-teal-500 overflow-hidden shadow-inner">
                                    {company.settings.companyStampUrl ? (
                                       <img src={company.settings.companyStampUrl} className="max-w-[80%] max-h-[80%] object-contain mix-blend-multiply" alt="Signature" />
                                    ) : (
                                       <FileSignature className="text-gray-300" size={48} />
                                    )}
                                 </div>
                                 <label className="absolute -bottom-3 -right-3 p-3.5 bg-teal-600 text-white rounded-2xl shadow-2xl cursor-pointer hover:scale-110 transition-all">
                                    <PenTool size={20} />
                                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'signature')} />
                                 </label>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         )}

         {activeSubTab === 'users' && (
            <div className="bg-white p-10 border border-[#E2E8F0] rounded-[32px] shadow-sm space-y-10">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="text-start">
                     <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">{t.usersTitle}</h3>
                     <p className="text-sm font-medium text-[#64748B]">{t.usersSub}</p>
                  </div>
                  <button
                     onClick={() => { setEditingUserId(null); setUserFormData({ firstName: '', lastName: '', email: '', role: 'TEAM_RH', status: 'active' }); setShowUserModal(true); }}
                     className="animated-gradient px-10 py-4 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-teal-500/20 active:scale-95 transition-all flex items-center justify-center gap-4"
                  >
                     <UserPlus size={18} /> {t.addUser}
                  </button>
               </div>
               <div className="overflow-x-auto rounded-3xl border border-[#F1F5F9]">
                  <table className="w-full text-left">
                     <thead className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                           <th className="p-6">Utilisateur</th>
                           <th className="p-6">E-mail</th>
                           <th className="p-6">Rôle</th>
                           <th className="p-6">Statut</th>
                           <th className="p-6 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[#F1F5F9]">
                        {systemUsers.map(u => (
                           <tr key={u.id} className="hover:bg-[#FBFDFF] transition-colors group">
                              <td className="p-6 font-bold text-[#0F172A]">{u.firstName} {u.lastName}</td>
                              <td className="p-6 text-sm font-medium text-[#64748B]">{u.email}</td>
                              <td className="p-6"><span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-[9px] font-black uppercase border border-teal-100">{u.role}</span></td>
                              <td className="p-6"><span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> {u.status}</span></td>
                              <td className="p-6 text-right">
                                 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                       onClick={() => handleEditUser(u)}
                                       className="px-4 py-2 bg-white border border-[#E2E8F0] text-gray-400 hover:text-teal-600 hover:border-teal-100 rounded-xl transition-all shadow-sm flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
                                    >
                                       <Edit3 size={14} /> {t.editAccess}
                                    </button>
                                    <button
                                       onClick={() => {
                                          const updated = systemUsers.filter(user => user.id !== u.id);
                                          setSystemUsers(updated);
                                          localStorage.setItem('salaire_system_users', JSON.stringify(updated));
                                       }}
                                       className="p-3 bg-white border border-[#E2E8F0] text-gray-400 hover:text-rose-500 hover:border-rose-100 rounded-xl transition-all shadow-sm"
                                    >
                                       <Trash size={16} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeSubTab === 'fiscality' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="bg-white p-10 border border-[#E2E8F0] rounded-[32px] shadow-sm space-y-10">
                  <h3 className="text-xl font-black text-[#0F172A] flex items-center gap-4 tracking-tight"><ShieldCheck size={28} className="text-teal-600" /> {t.fiscalTitle}</h3>
                  <div className="space-y-6">
                     <FiscalRow label="SMIG Mensuel 2026" value={`${MONTHLY_SMIG.toLocaleString()} MAD`} />
                     <FiscalRow label="Taux CNSS Salarial" value={`${(CNSS_SALARIAL_RATE * 100).toFixed(2)} %`} />
                     <FiscalRow label="Plafond CNSS" value={`${CNSS_CEILING.toLocaleString()} MAD`} />
                     <FiscalRow label="Taux AMO Salarial" value={`${(AMO_SALARIAL_RATE * 100).toFixed(2)} %`} />
                     <FiscalRow label="Frais Pro. (Plafond)" value={`${PROF_EXPENSES_CAP.toLocaleString()} MAD / mois`} />
                  </div>
               </div>
               <div className="bg-[#0F172A] text-white p-12 rounded-[48px] border-none shadow-2xl space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-700"><RefreshCw size={240} /></div>
                  <h3 className="text-2xl font-black relative z-10 text-start tracking-tight">{t.updates.title}</h3>
                  <p className="text-sm font-medium text-gray-400 leading-relaxed relative z-10 text-start italic">{t.updates.desc}</p>
                  <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 relative z-10 text-start shadow-inner">
                     <p className="text-[10px] font-black uppercase text-teal-400 mb-2 tracking-[0.3em]">{t.updates.lastSync}</p>
                     <p className="text-xl font-black">{t.updates.status}</p>
                  </div>
               </div>
            </div>
         )}

         {activeSubTab === 'onboarding' && (
            <InviteTracker />
         )}

         {/* User Modal (Create/Edit) */}
         {showUserModal && (
            <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-lg rounded-[40px] shadow-3xl overflow-hidden animate-in zoom-in duration-300 relative border border-[#E2E8F0] flex flex-col max-h-[90vh]">
                  <button onClick={() => setShowUserModal(false)} className="absolute top-8 right-8 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-white hover:text-black rounded-full transition-all text-gray-400 shadow-sm z-10"><X size={24} /></button>

                  <div className="p-12 space-y-10 overflow-y-auto no-scrollbar">
                     <div className="flex items-center gap-6 text-start">
                        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center border border-teal-100 shadow-inner shrink-0"><UserCog size={36} /></div>
                        <div>
                           <h3 className="text-2xl font-black text-[#0F172A] tracking-tighter">{t.createTitle}</h3>
                           <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">{t.createSub}</p>
                        </div>
                     </div>

                     <form onSubmit={handleUserAction} className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                           <Input label={t.fields.first} value={userFormData.firstName} onChange={v => setUserFormData({ ...userFormData, firstName: v })} icon={<User size={16} />} />
                           <Input label={t.fields.last} value={userFormData.lastName} onChange={v => setUserFormData({ ...userFormData, lastName: v })} icon={<User size={16} />} />
                        </div>
                        <Input label={t.fields.email} value={userFormData.email} onChange={v => setUserFormData({ ...userFormData, email: v })} icon={<MailIcon size={16} />} />

                        <div className="space-y-3 text-start">
                           <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">{t.fields.role}</label>
                           <div className="relative group">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-teal-600">
                                 <Shield size={18} />
                              </div>
                              <select
                                 value={userFormData.role}
                                 onChange={e => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                                 className="w-full pl-12 pr-10 py-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-bold focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-50 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                              >
                                 {['DIRECTEUR_RH', 'TEAM_RH', 'COMPTABLE', 'SITE_MANAGER', 'EMPLOYEE'].map(role => (
                                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                 ))}
                              </select>
                              <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                           </div>
                        </div>

                        <div className="p-6 bg-teal-50 rounded-3xl border border-teal-100 flex items-start gap-4 shadow-sm">
                           <ShieldCheck size={24} className="text-teal-600 mt-0.5 shrink-0" />
                           <p className="text-[11px] text-teal-800 font-bold leading-relaxed italic">
                              L'utilisateur recevra un lien de configuration sécurisé conforme aux normes nationales de protection des données (CNDP).
                           </p>
                        </div>

                        <button type="submit" className="w-full py-6 animated-gradient text-white rounded-[24px] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-4">
                           <CheckCircle2 size={24} /> {t.confirmCreate}
                        </button>
                     </form>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

const SectionTitle = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
   <div className="flex items-center gap-4 border-b border-[#F1F5F9] pb-3 mb-8">
      <div className="text-teal-600">{icon}</div>
      <h4 className="text-[11px] font-black text-[#0F172A] uppercase tracking-[0.25em]">{label}</h4>
   </div>
);

const FiscalRow = ({ label, value }: { label: string, value: string }) => (
   <div className="flex justify-between items-center py-4 border-b border-[#F1F5F9] last:border-0 group">
      <span className="text-sm font-bold text-[#64748B] uppercase tracking-tight group-hover:text-teal-600 transition-colors">{label}</span>
      <span className="text-base font-black text-[#0F172A]">{value}</span>
   </div>
);

const Input = ({ label, value, onChange, icon }: any) => (
   <div className="space-y-3 text-start">
      <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">{label}</label>
      <div className="relative group">
         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-teal-600 transition-colors">
            {icon}
         </div>
         <input
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full pl-12 pr-6 h-14 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm font-bold focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-50 outline-none transition-all shadow-inner"
         />
      </div>
   </div>
);

export default SettingsManager;
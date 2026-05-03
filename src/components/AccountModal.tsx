import React, { useState } from 'react';
import { X, User, Mail, Lock, Camera, CheckCircle2, CreditCard, ChevronRight, Save, ShieldCheck, Key, RefreshCcw, LogOut } from 'lucide-react';
import { Language, AuthUser, PlanType } from '../types';
import RoleBadge from './RoleBadge';

interface Props {
   user: AuthUser;
   setUser: (u: AuthUser) => void;
   lang: Language;
   onClose: () => void;
   onShowPricing: () => void;
   onLogout: () => void;
}

const AccountModal: React.FC<Props> = ({ user, setUser, lang, onClose, onShowPricing, onLogout }) => {
   const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'plan'>('profile');
   const [isSaving, setIsSaving] = useState(false);
   const [formData, setFormData] = useState({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      photoUrl: user.photoUrl || ''
   });

   const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

   const t = {
      fr: { title: "Mon Compte", profile: "PROFIL", security: "SÉCURITÉ", plan: "ABONNEMENT", save: "Enregistrer", logout: "DÉCONNEXION" },
      ar: { title: "حسابي", profile: "الملف الشخصي", security: "الأمان", plan: "الاشتراك", save: "حفظ", logout: "خروج" }
   }[lang] || { title: "Account", profile: "PROFILE", security: "SECURITY", plan: "PLAN", save: "Save", logout: "Logout" };

   const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result as string }));
         reader.readAsDataURL(file);
      }
   };

   const handleSaveProfile = async () => {
      setIsSaving(true);
      await new Promise(r => setTimeout(r, 1000));
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      localStorage.setItem('salaire_user', JSON.stringify(updatedUser));
      setIsSaving(false);
   };

   return (
      <div className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
         <div className="bg-white/95 backdrop-blur-2xl w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] rounded-[32px] md:rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 relative border border-white/50">
            {/* Global Exit Button */}
            <button
               onClick={onClose}
               className="absolute top-6 right-6 z-[60] p-2.5 bg-gray-50/50 hover:bg-white rounded-full transition-all text-gray-400 hover:text-slate-900 shadow-sm border border-gray-100 hover:rotate-90 active:scale-90"
               aria-label="Close"
            >
               <X size={20} strokeWidth={3} />
            </button>

            <div className="w-full md:w-72 bg-slate-50/50 flex flex-col shrink-0 border-r border-slate-100 overflow-y-auto custom-scroll">
               <div className="p-6 md:p-8 flex flex-col items-start gap-4">
                  <div className="flex items-center gap-4 text-start">
                     <div className="w-14 h-14 bg-[#0052FF] rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-blue-200/50 overflow-hidden border-2 border-white">
                        {user.photoUrl ? <img src={user.photoUrl} className="w-full h-full object-cover" /> : <User size={24} />}
                     </div>
                     <div className="max-w-[160px]">
                        <h2 className="text-xl font-black text-slate-900 tracking-tighter truncate leading-tight uppercase">{user.firstName} {user.lastName}</h2>
                        <div className="mt-1">
                           <RoleBadge role={user.role} lang={lang} size="sm" />
                        </div>
                     </div>
                  </div>
               </div>

               <nav className="flex md:flex-col overflow-x-auto no-scrollbar px-6 md:px-6 pb-4 md:pb-6 space-x-2 md:space-x-0 md:space-y-1">
                  <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18} />} label={t.profile} />
                  <NavBtn active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<ShieldCheck size={18} />} label={t.security} />
                  <NavBtn active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} icon={<CreditCard size={18} />} label={t.plan} />
               </nav>

               <div className="hidden md:flex flex-col gap-2 p-6 md:p-8 mt-auto border-t border-slate-100">
                  <button
                     onClick={onLogout}
                     className="py-4 w-full bg-rose-50/50 text-rose-600 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-50 hover:text-rose-700 transition-all active:scale-[0.98] border border-rose-100/50"
                  >
                     <LogOut size={16} /> {t.logout}
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-white/40 custom-scroll">
               <div className="p-6 md:p-10 min-h-full flex flex-col">
                  {activeTab === 'profile' && (
                     <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-700 mt-auto mb-auto">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                           <div className="relative group shrink-0">
                              <div className="w-24 h-24 md:w-28 md:h-28 rounded-[28px] md:rounded-[32px] bg-slate-50 border-[6px] md:border-8 border-white shadow-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 duration-500">
                                 {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-200" />}
                              </div>
                              <label className="absolute bottom-[-4px] right-[-4px] md:bottom-1 md:right-1 p-2 bg-slate-900 text-white rounded-[14px] shadow-xl cursor-pointer hover:bg-black hover:scale-110 transition-all active:scale-90 border-[3px] border-white">
                                 <Camera size={16} />
                                 <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                              </label>
                           </div>
                           <div className="text-center md:text-start space-y-1">
                              <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight">{user.firstName} {user.lastName}</h3>
                              <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">{user.companyName}</p>
                           </div>
                        </div>

                        <div className="space-y-4 md:space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <InputGroup label="PRÉNOM" value={formData.firstName} onChange={v => setFormData({ ...formData, firstName: v })} lang={lang} />
                              <InputGroup label="NOM" value={formData.lastName} onChange={v => setFormData({ ...formData, lastName: v })} lang={lang} />
                           </div>
                           <InputGroup label="E-MAIL" value={formData.email} onChange={v => setFormData({ ...formData, email: v })} lang={lang} />
                        </div>

                        <button
                           onClick={handleSaveProfile}
                           disabled={isSaving}
                           className="w-full py-4 md:py-5 bg-[#0052FF] text-white rounded-[20px] md:rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-[0_10px_20px_-8px_rgba(0,82,255,0.4)] hover:shadow-[0_16px_32px_-8px_rgba(0,82,255,0.5)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4 border border-white/20 mt-4 md:mt-8"
                        >
                           {isSaving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />} {t.save}
                        </button>
                     </div>
                  )}

                  {activeTab === 'plan' && (
                     <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 mt-auto mb-auto">
                        <div className="p-10 bg-slate-900 text-white rounded-[32px] relative overflow-hidden shadow-2xl border border-white/10 group">
                           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700"><CreditCard size={120} /></div>
                           <div className="relative z-10">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-4">PLAN ACTUEL</p>
                              <h3 className="text-4xl md:text-5xl font-black mb-10 tracking-tighter">{user.plan}</h3>
                              <button
                                 onClick={() => { onClose(); onShowPricing(); }}
                                 className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-black/20"
                              >
                                 Changer de plan <ChevronRight size={16} />
                              </button>
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

const NavBtn: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
   <button
      onClick={onClick}
      className={`flex items-center shrink-0 md:w-full gap-4 px-6 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.15em] transition-all duration-300 ${active ? 'bg-white text-[#0052FF] shadow-[0_8px_32px_-8px_rgba(0,82,255,0.15)] ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-900 hover:bg-white/60'}`}
   >
      <div className={`${active ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>{icon}</div>
      <span className="whitespace-nowrap">{label}</span>
   </button>
);

const InputGroup: React.FC<{ label: string, value: string, onChange: (v: string) => void, lang: string }> = ({ label, value, onChange }) => (
   <div className="space-y-3 text-start">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{label}</label>
      <input
         value={value}
         onChange={e => onChange(e.target.value)}
         className="w-full px-7 py-5 bg-slate-50/50 border-2 border-transparent rounded-[24px] text-[13px] font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:shadow-[0_0_0_8px_rgba(0,82,255,0.05)] outline-none transition-all placeholder-slate-300 shadow-inner"
         placeholder={label}
      />
   </div>
);

export default AccountModal;
import React, { useState } from 'react';
import { X, User, Mail, Lock, Camera, CheckCircle2, CreditCard, ChevronRight, Save, ShieldCheck, Key, RefreshCcw, LogOut } from 'lucide-react';
import { Language, AuthUser, PlanType } from '../types';

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
      photo: user.photo || ''
   });

   const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

   const t = {
      fr: { title: "Mon Compte", profile: "Profil", security: "Sécurité", plan: "Abonnement", save: "Enregistrer", logout: "Déconnexion" },
      ar: { title: "حسابي", profile: "الملف الشخصي", security: "الأمان", plan: "الاشتراك", save: "حفظ", logout: "خروج" }
   }[lang] || { title: "Account", profile: "Profile", security: "Security", plan: "Plan", save: "Save", logout: "Logout" };

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
      alert(lang === 'ar' ? 'تم التحديث' : 'Profil mis à jour');
   };

   return (
      <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
         <div className="bg-white w-full max-w-4xl rounded-[48px] shadow-3xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300 relative">
            {/* Global Exit Button */}
            <button
               onClick={onClose}
               className="absolute top-6 right-6 z-[60] p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-[#1A1F36] shadow-sm border border-gray-100 active:scale-90"
               aria-label="Close"
            >
               <X size={24} strokeWidth={3} />
            </button>

            <div className="w-full md:w-72 bg-[#F7F9FC] flex flex-col shrink-0 border-r border-[#E3E8EE]">
               <div className="p-8 flex items-center justify-between md:block relative">
                  <div className="flex items-center gap-4 text-start">
                     <div className="w-12 h-12 bg-[#0052FF] rounded-2xl flex items-center justify-center text-white font-black shadow-lg overflow-hidden border border-white">
                        {user.photo ? <img src={user.photo} className="w-full h-full object-cover" /> : <User size={20} />}
                     </div>
                     <div className="pr-8">
                        <h2 className="text-xl font-black text-[#1A1F36] tracking-tighter truncate">{user.firstName}</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</p>
                     </div>
                  </div>
               </div>
               <nav className="flex md:flex-col overflow-x-auto no-scrollbar px-4 md:px-8 pb-4 space-x-2 md:space-x-0 md:space-y-2">
                  <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18} />} label={t.profile} />
                  <NavBtn active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<ShieldCheck size={18} />} label={t.security} />
                  <NavBtn active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} icon={<CreditCard size={18} />} label={t.plan} />
               </nav>
               <div className="hidden md:flex flex-col gap-2 p-8 mt-auto border-t border-[#E3E8EE]">
                  <button onClick={onLogout} className="py-3.5 w-full bg-rose-50 text-rose-600 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-rose-100 transition-all"><LogOut size={16} /> {t.logout}</button>
               </div>
            </div>
            <div className="flex-1 p-8 md:p-12 overflow-y-auto bg-white">
               {activeTab === 'profile' && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                     <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group">
                           <div className="w-32 h-32 rounded-[40px] bg-[#F7F9FC] border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                              {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <User size={40} className="text-gray-300" />}
                           </div>
                           <label className="absolute -bottom-1 -right-1 p-2.5 bg-[#1A1F36] text-white rounded-xl shadow-lg cursor-pointer hover:bg-black transition-all active:scale-90">
                              <Camera size={16} />
                              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                           </label>
                        </div>
                        <div className="text-center md:text-start">
                           <h3 className="text-2xl font-black text-[#1A1F36]">{user.firstName} {user.lastName}</h3>
                           <p className="text-sm text-gray-400 font-medium">{user.companyName}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label="Prénom" value={formData.firstName} onChange={v => setFormData({ ...formData, firstName: v })} lang={lang} />
                        <InputGroup label="Nom" value={formData.lastName} onChange={v => setFormData({ ...formData, lastName: v })} lang={lang} />
                        <div className="md:col-span-2"><InputGroup label="E-mail" value={formData.email} onChange={v => setFormData({ ...formData, email: v })} lang={lang} /></div>
                     </div>
                     <button onClick={handleSaveProfile} disabled={isSaving} className="w-full py-5 bg-[#0052FF] text-white rounded-[24px] font-black text-lg shadow-xl shadow-blue-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3">
                        {isSaving ? <RefreshCcw size={24} className="animate-spin" /> : <Save size={20} />} {t.save}
                     </button>
                  </div>
               )}
               {activeTab === 'plan' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                     <div className="airbnb-card p-10 bg-[#1A1F36] text-white rounded-[40px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-10"><CreditCard size={120} /></div>
                        <p className="text-[10px] font-black text-[#0052FF] uppercase tracking-[0.3em] mb-4">Plan actuel</p>
                        <h3 className="text-4xl md:text-5xl font-black mb-10 tracking-tighter">{user.plan}</h3>
                        <button onClick={() => { onClose(); onShowPricing(); }} className="px-8 py-4 bg-white text-[#1A1F36] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2">Changer de plan <ChevronRight size={18} /></button>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

const NavBtn: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
   <button onClick={onClick} className={`flex items-center shrink-0 md:w-full gap-4 px-5 py-4 rounded-2xl font-black text-sm uppercase tracking-tight transition-all ${active ? 'bg-white text-[#0052FF] shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-[#1A1F36] hover:bg-white/50'}`}>
      {icon} <span className="whitespace-nowrap">{label}</span>
   </button>
);

const InputGroup: React.FC<{ label: string, value: string, onChange: (v: string) => void, lang: string }> = ({ label, value, onChange }) => (
   <div className="space-y-2 text-start">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} className="w-full px-5 py-4 bg-[#F7F9FC] border-2 border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-[#0052FF] outline-none transition-all shadow-inner" placeholder={label} />
   </div>
);

export default AccountModal;
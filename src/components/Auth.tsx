import React, { useState } from 'react';
import {
   User, Building2, ShieldCheck, RefreshCw, ArrowRight, ArrowLeft,
   ChevronRight, Sparkles, Lock, Globe, Zap, FileEdit, Send, Check,
   Shield, Database, Fingerprint
} from 'lucide-react';
import { Language, AuthUser } from '../types';
import Logo from './Logo';
import { getPermissionsForRole } from '../services/rbac';
import { login } from '../services/authService';

interface Props {
   onLogin: (user: AuthUser) => void;
   lang: Language;
   setLang: (l: Language) => void;
}

const Auth: React.FC<Props> = ({ onLogin, lang, setLang }) => {
   const [view, setView] = useState<'auth' | 'about' | 'quote'>('about');
   const [handshakeStatus, setHandshakeStatus] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   const [quoteSent, setQuoteSent] = useState(false);
   const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
   const [loginEmail, setLoginEmail] = useState('');
   const [loginPassword, setLoginPassword] = useState('');

   const t = {
      fr: {
         heroTitle: "L’Intelligence RH\npour la paie souveraine au Maroc.",
         heroSub: "Infrastructure de paie certifiée et automatisée. Hébergement 100% Maroc. Conforme CNDP & Loi de Finances 2026.",
         selectContext: "Accéder au système",
         security: "Architecture Zéro Confiance • Certifié CNDP",
         navAcc: "CONNEXION",
         navAbout: "DÉCOUVRIR",
         navQuote: "DEMANDER UN DEVIS",
         tryFree: "Lancer l'audit gratuit",
         trustSignals: ["Hébergement Maroc", "Conforme Loi 09-08", "Moteur CNSS Validé", "Sécurité Bancaire"],
         quote: {
            title: "Configuration Entreprise",
            sub: "Déployez Salery au sein de votre infrastructure sous 24h.",
            btn: "Demander mon accès",
         }
      },
      ar: {
         heroTitle: "ذكاء الموارد البشرية\nلأجور سيادية في المغرب.",
         heroSub: "بنية تحتية معتمدة ومؤتمتة. استضافة مغربية 100%. مطابق لـ CNDP وقانون المالية 2026.",
         selectContext: "الدخول إلى النظام",
         security: "بنية Zero Trust • معتمد CNDP",
         navAcc: "الدخول",
         navAbout: "اكتشف",
         navQuote: "طلب عرض سعر",
         tryFree: "ابدأ التدقيق المجاني",
         trustSignals: ["استضافة مغربية", "مطابق للقانون 09-08", "نظام CNSS معتمد", "أمان بنكي"],
         quote: {
            title: "إعداد المؤسسات",
            sub: "قم بنشر Salery داخل بنيتكم التحتية في أقل من 24 ساعة.",
            btn: "اطلب الولوج الخاص بك",
         }
      }
   }[lang === 'ar' ? 'ar' : 'fr'];

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!loginEmail.trim()) return;
      setLoading(true);
      setHandshakeStatus("🔐 CONNECTING_SVR_MA...");

      try {
         // The role is now detected by the backend, not chosen by the user.
         const user = await login(loginEmail, loginPassword);

         setHandshakeStatus("🧬 IDENTITY_TOKEN_VALIDATE...");
         await new Promise(r => setTimeout(r, 600));
         setHandshakeStatus("🛡️ RBAC_PERMISSIONS_INJECT...");
         await new Promise(r => setTimeout(r, 400));

         onLogin(user);
      } catch (err) {
         setHandshakeStatus("❌ AUTH_FAILED");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="fixed inset-0 w-full h-full bg-[#F8FAFC] flex flex-col overflow-hidden selection:bg-teal-100 font-sans">

         {/* 1. TOP NAV - ENTERPRISE CLEAN */}
         <header className="w-full h-24 px-12 flex items-center justify-between z-50 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] shrink-0">
            <Logo />
            <nav className="hidden md:flex items-center gap-2 p-1.5 bg-[#F1F5F9] rounded-2xl border border-[#E2E8F0]">
               {(['about', 'quote', 'auth'] as const).map((v) => (
                  <button
                     key={v}
                     onClick={() => setView(v)}
                     className={`px-10 py-3 text-[10px] font-black rounded-full transition-all duration-300 uppercase tracking-widest whitespace-nowrap shadow-sm
                  ${view === v ? 'btn-premium-animated' : 'text-gray-500 hover:text-gray-900'}
                `}
                  >
                     {(t as any)[`nav${v.charAt(0).toUpperCase() + v.slice(1)}`] || v}
                  </button>
               ))}
            </nav>
            <div className="flex items-center gap-3">
               <button onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')} className="w-10 h-10 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[10px] font-black text-gray-400 hover:text-teal-600 transition-all">
                  {lang.toUpperCase()}
               </button>
            </div>
         </header>

         <main className="flex-1 relative overflow-y-auto no-scrollbar">
            <div className="light-blob blob-1"></div>
            <div className="light-blob blob-2"></div>

            <div className="w-full max-w-7xl mx-auto px-10 py-16 relative z-10 flex flex-col items-center min-h-full justify-center">

               {view === 'about' && (
                  <div className="w-full flex flex-col lg:flex-row items-center gap-20 py-10">
                     <div className="flex-1 text-start space-y-12 stagger-1">
                        <div className="space-y-6">
                           <div className="inline-flex items-center gap-3 px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                              <Sparkles size={14} className="animate-pulse" /> SOUVERAINETÉ NUMÉRIQUE ACTIVÉE
                           </div>
                           <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#0F172A] leading-[1.05]">
                              <span className="text-[0.6em] block mb-2">L'Intelligence RH</span>
                              pour la <span className="bg-clip-text text-transparent animated-gradient">paie souveraine</span> au Maroc.
                           </h1>
                           <p className="text-xl text-gray-500 font-medium max-w-xl leading-relaxed">
                              {t.heroSub}
                           </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                           <button onClick={() => setView('auth')} className="px-12 py-5 btn-premium-animated rounded-[18px] font-black text-lg flex items-center justify-center gap-4 group">
                              {t.navAcc} <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                           </button>
                           <button onClick={() => setView('quote')} className="px-12 py-5 bg-white text-[#0F172A] border-2 border-[#E2E8F0] rounded-[18px] font-black text-lg hover:border-teal-500 transition-all active:scale-95 shadow-sm">
                              {t.navQuote}
                           </button>
                        </div>

                        <div className="pt-8 border-t border-[#E2E8F0] flex flex-wrap gap-8">
                           {t.trustSignals.map((s, i) => (
                              <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                 <Check size={16} className="text-teal-500" /> {s}
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="hidden lg:flex flex-1 justify-end stagger-2">
                        <div className="relative">
                           <div className="absolute -inset-10 animated-gradient opacity-10 blur-3xl rounded-full animate-pulse"></div>
                           <div className="relative bg-white p-10 rounded-[48px] border border-[#E2E8F0] shadow-3xl w-[500px] space-y-8">
                              <div className="flex justify-between items-center border-b border-[#F1F5F9] pb-6">
                                 <h4 className="text-sm font-black uppercase text-[#0F172A]">Aperçu Moteur V26</h4>
                                 <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                              </div>
                              <div className="space-y-6">
                                 <FakeMetric label="CONFORMITÉ CNSS" val="100%" color="text-teal-600" />
                                 <FakeMetric label="LATENCE CALCUL" val="42ms" color="text-blue-600" />
                                 <FakeMetric label="SOUVERAINETÉ" val="CASABLANCA-1" color="text-indigo-600" />
                              </div>
                              <div className="p-5 bg-teal-50 rounded-3xl border border-teal-100 flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-sm"><Shield size={20} /></div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-teal-800 leading-tight">Moteur de paie auto-apprenant certifié.</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {view === 'auth' && (
                  <div className="max-w-md w-full animate-in slide-in-from-bottom-8 duration-500 py-10">
                     <div className="space-y-10">
                        <div className="text-center space-y-4">
                           <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter leading-none">{t.selectContext}</h3>
                           <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{t.security}</p>
                        </div>

                        {loading ? (
                           <div className="py-24 flex flex-col items-center gap-8 text-center animate-in fade-in duration-500">
                              <div className="relative">
                                 <RefreshCw className="animate-spin text-teal-600" size={56} />
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <Lock size={16} className="text-teal-600 opacity-50" />
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <p className="text-[11px] font-black uppercase tracking-[0.4em] text-[#0F172A]">{handshakeStatus}</p>
                                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">SÉCURISATION DU NŒUD CASABLANCA-1</p>
                              </div>
                           </div>
                        ) : (
                           <div className="space-y-6">
                              <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[40px] shadow-2xl border border-[#E2E8F0] space-y-6 relative overflow-hidden group">
                                 {/* Glass highlight */}
                                 <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                 <div className="space-y-2 text-start relative z-10">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail Professionnel</label>
                                    <input
                                       required
                                       type="email"
                                       placeholder="nom@entreprise.ma"
                                       className="enterprise-input w-full"
                                       value={loginEmail}
                                       onChange={(e) => setLoginEmail(e.target.value)}
                                    />
                                 </div>
                                 <div className="space-y-2 text-start relative z-10">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mot de passe</label>
                                    <input
                                       required
                                       type="password"
                                       placeholder="••••••••"
                                       className="enterprise-input w-full"
                                       value={loginPassword}
                                       onChange={(e) => setLoginPassword(e.target.value)}
                                    />
                                 </div>
                                 <button type="submit" className="w-full py-6 btn-premium-animated text-white font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-teal-500/10 active:scale-[0.98] transition-all rounded-[18px] relative z-10">
                                    Accéder au système
                                 </button>
                              </form>

                              <div className="flex items-center gap-3 justify-center opacity-40">
                                 <Fingerprint size={14} />
                                 <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">Authentification biométrique non disponible sur ce terminal</span>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {view === 'quote' && (
                  <div className="max-w-2xl w-full animate-in zoom-in duration-500 py-10">
                     {!quoteSent ? (
                        <div className="space-y-12">
                           <div className="text-center space-y-4">
                              <h2 className="text-5xl font-black text-[#0F172A] tracking-tighter leading-none">{t.quote.title}</h2>
                              <p className="text-lg text-gray-400 font-medium">{t.quote.sub}</p>
                           </div>
                           <form onSubmit={(e) => { e.preventDefault(); setQuoteSent(true); }} className="bg-white p-12 rounded-[48px] shadow-2xl border border-[#E2E8F0] space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <QuoteInput label="Raison Sociale" placeholder="Atlas Digital" />
                                 <QuoteInput label="Nombre d'employés" placeholder="50 - 250" />
                                 <QuoteInput label="Secteur" placeholder="Services / BTP" />
                                 <QuoteInput label="E-mail Direct" placeholder="dir@entreprise.ma" />
                              </div>
                              <button type="submit" className="w-full py-6 btn-premium-animated text-white font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-teal-500/10 active:scale-[0.99] transition-all flex items-center justify-center gap-4 rounded-[18px]">
                                 <Send size={18} /> {t.quote.btn}
                              </button>
                           </form>
                        </div>
                     ) : (
                        <div className="text-center space-y-10">
                           <div className="w-32 h-32 bg-teal-50 text-teal-600 rounded-[40px] flex items-center justify-center mx-auto shadow-xl border-4 border-white">
                              <Check size={64} strokeWidth={3} />
                           </div>
                           <h3 className="text-4xl font-black text-[#0F172A] tracking-tighter">Requête enregistrée.</h3>
                           <p className="text-xl text-gray-400 font-medium">Un ingénieur Salery prendra contact avec vous d'ici 2h.</p>
                           <button onClick={() => setView('about')} className="px-12 py-5 btn-premium-animated text-white rounded-[18px] font-black text-sm uppercase tracking-widest shadow-lg">Retour</button>
                        </div>
                     )}
                  </div>
               )}
            </div>
         </main>

         <footer className="w-full py-8 border-t border-[#E2E8F0] bg-white flex justify-center items-center gap-12 relative z-50 shrink-0">
            <div className="flex items-center gap-2 opacity-40">
               <Shield size={14} /> <span className="text-[8px] font-black uppercase tracking-widest">TLS 1.3 AES-256</span>
            </div>
            <div className="flex items-center gap-2 opacity-40">
               <Database size={14} /> <span className="text-[8px] font-black uppercase tracking-widest">Oracle Cloud MA</span>
            </div>
            <div className="flex items-center gap-2 opacity-40">
               <Globe size={14} /> <span className="text-[8px] font-black uppercase tracking-widest">Sovereign Node v26</span>
            </div>
         </footer>
      </div>
   );
};

const FakeMetric = ({ label, val, color }: any) => (
   <div className="flex justify-between items-center text-start">
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      <span className={`text-xl font-black ${color} tracking-tighter`}>{val}</span>
   </div>
);

const QuoteInput = ({ label, placeholder }: any) => (
   <div className="space-y-2 text-start">
      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input required placeholder={placeholder} className="enterprise-input w-full" />
   </div>
);

export default Auth;
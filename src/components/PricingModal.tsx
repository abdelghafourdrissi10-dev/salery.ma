import React, { useState, useMemo } from 'react';
import {
  X, Check, ShieldCheck, Zap, Crown, Sparkles, Rocket,
  Lock, Info, ChevronDown, ChevronUp, Globe, Shield,
  HelpCircle, BadgeCheck, Plus, ArrowRight,
  BrainCircuit, ArrowLeft, Users2, FileSpreadsheet,
  TrendingUp, Gauge, ChevronRight, Clock,
  Minus, Building2, RefreshCw, Star
} from 'lucide-react';
import { Language, PlanType } from '../types';
import { getPlanRecommendation } from '../services/geminiService';

interface Props {
  currentPlan: PlanType;
  lang: Language;
  onClose: () => void;
  onUpgrade: (plan: PlanType) => void;
}

type Currency = 'MAD' | 'USD' | 'EUR';

type RecommenderState = {
  step: number;
  size: string;
  cnss: boolean;
  type: string;
  isComplete: boolean;
  aiText: string;
};

const PricingModal: React.FC<Props> = ({ currentPlan, lang, onClose, onUpgrade }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currency, setCurrency] = useState<Currency>('MAD');

  const [showRecommender, setShowRecommender] = useState(false);
  const [rec, setRec] = useState<RecommenderState>({
    step: 1,
    size: '',
    cnss: false,
    type: '',
    isComplete: false,
    aiText: ''
  });

  const rates = { MAD: 1, USD: 0.1, EUR: 0.092 };
  const symbols = { MAD: 'DH', USD: '$', EUR: '€' };

  const convert = (val: number) => Math.round(val * rates[currency]);

  const allTranslations = {
    fr: {
      title: "Passez à la vitesse supérieure",
      subtitle: "Gérez votre paie en toute conformité avec l'outil N°1 au Maroc.",
      recommenderBtn: "🧠 Quel plan pour vous ?",
      recommenderSub: "Trouvez le plan idéal en 30 secondes",
      saveLabel: "🎉 Économisez jusqu'à 20%",
      yearly: "Annuel",
      monthly: "Mensuel",
      popular: "LE PLUS POPULAIRE",
      starter: "Essentiel",
      pro: "Avancé",
      enterprise: "Grand Compte",
      upgradeBtn: "Commencer",
      freeTrial: "Essai gratuit 14 jours",
      contactUs: "Contactez-nous",
      mo: "MOIS",
      yr: "AN",
      current: "Votre plan actuel",
      compare: "Comparer les plans",
      upTo: "Jusqu'à",
      employees: "employés",
      unlimited: "Illimité",
      startingAt: "À partir de",
      aiNudge: "L'IA gère tout pour vous",
      features: {
        starter: ["Gestion employés", "Heures de travail", "Calcul automatique salaire", "Congés & absences", "Bulletin de paie PDF"],
        pro: ["Tout du plan Essentiel", "Export CNSS & AMO", "Heures supplémentaires", "Jours fériés Maroc", "Rapports mensuels"],
        enterprise: ["Assistant RH & Paie 24/7 (IA)", "Hébergement au choix (Cloud / Privé)", "API & intégrations", "Support prioritaire", "SLA & sécurité avancée"]
      },
      recWizard: {
        q1: "Combien d’employés avez-vous ?",
        q2: "Besoin des déclarations CNSS / AMO ?",
        q3: "Type d’entreprise ?",
        resultTitle: "Le plan recommandé pour vous",
        startWith: "Choisir le plan",
        darijaTouch: "Simple et clair. Sans prise de tête.",
      }
    },
    en: {
      title: "Scale Your Business",
      subtitle: "Manage your payroll with Morocco's #1 digital tool.",
      recommenderBtn: "🧠 Which plan for you?",
      recommenderSub: "Find the ideal plan in 30 seconds",
      saveLabel: "🎉 Save up to 20%",
      yearly: "Annual",
      monthly: "Monthly",
      popular: "MOST POPULAR",
      starter: "Starter",
      pro: "Growth",
      enterprise: "Enterprise",
      upgradeBtn: "Get Started",
      freeTrial: "14-day free trial",
      contactUs: "Contact Us",
      mo: "MONTH",
      yr: "YEAR",
      current: "Your current plan",
      compare: "Compare plans",
      upTo: "Up to",
      employees: "employees",
      unlimited: "Unlimited",
      startingAt: "Starting at",
      aiNudge: "AI handles it all for you",
      features: {
        starter: ["Employee management", "Working hours", "Auto salary calculation", "Leaves & absences", "PDF Payslips"],
        pro: ["Everything in Starter", "CNSS & AMO Exports", "Overtime tracking", "Moroccan Holidays", "Monthly reports"],
        enterprise: ["24/7 HR & PAYROLL AI", "Hosting Choice (Cloud / Private)", "API & Integrations", "Priority Support", "SLA & Advanced Security"]
      },
      recWizard: {
        q1: "How many employees do you have?",
        q2: "Do you need CNSS / AMO exports?",
        q3: "Company type?",
        resultTitle: "Recommended plan for you",
        startWith: "Select Plan",
        darijaTouch: "Simple and clear. No hassle.",
      }
    },
    ar: {
      title: "ارتقِ بمستوى عملك",
      subtitle: "إدارة الأجور والامتثال القانوني مع الأداة الأولى في المغرب.",
      recommenderBtn: "🧠 أي خطة تناسبك؟",
      recommenderSub: "اعثر على الخطة المثالية في 30 ثانية",
      saveLabel: "🎉 وفر حتى 20%",
      yearly: "سنوي",
      monthly: "شهري",
      popular: "الأكثر طلباً",
      starter: "الباقة الأساسية",
      pro: "الباقة المتقدمة",
      enterprise: "باقة المؤسسات",
      upgradeBtn: "ابدأ الآن",
      freeTrial: "تجربة مجانية لـ 14 يوماً",
      contactUs: "اتصل بنا",
      mo: "شهر",
      yr: "سنة",
      current: "خطتك الحالية",
      compare: "قارن الخطط",
      upTo: "حتى",
      employees: "موظف",
      unlimited: "غير محدود",
      startingAt: "ابتداءً من",
      aiNudge: "الذكاء الاصطناعي يتكفل بكل شيء",
      features: {
        starter: ["إدارة الموظفين", "ساعات العمل", "الحساب التلقائي للأجور", "العطل والغيابات", "ورقة الأداء PDF"],
        pro: ["كل ميزات الباقة الأساسية", "تصدير الضمان الاجتماعي (CNSS)", "الساعات الإضافية", "الأعياد الوطنية المغربية", "التقارير الشهرية"],
        enterprise: ["مساعد ذكي 24/7 (IA)", "خيار الاستضافة (سحابي / خاص)", "الواجهة البرمجية (API)", "دعم ذو أولوية", "ضمان الخدمة والأمن المتقدم"]
      },
      recWizard: {
        q1: "كم عدد الموظفين لديك؟",
        q2: "هل تحتاج لتصاريح الضمان الاجتماعي؟",
        q3: "نوع المقاولة؟",
        resultTitle: "الخطة الموصى بها لك",
        startWith: "اختر الخطة",
        darijaTouch: "بسيطة وواضحة. بدون تعقيدات.",
      }
    }
  };

  const t = allTranslations[lang] || allTranslations['fr'];

  const recommendation = useMemo(() => {
    if (!rec.isComplete) return null;
    const isBig = rec.size === '500+' || rec.size === '201 – 500' || rec.type === 'Groupe';
    const isMedium = rec.cnss === true;
    if (isBig) {
      return { id: 'ENTERPRISE', title: t.enterprise, icon: <Crown size={48} className="text-[#0052FF]" /> };
    }
    if (isMedium) {
      return { id: 'BUSINESS', title: t.pro, icon: <Rocket size={48} className="text-[#0052FF]" /> };
    }
    return { id: 'STARTER', title: t.starter, icon: <Zap size={48} className="text-emerald-500" /> };
  }, [rec.isComplete, rec.size, rec.cnss, rec.type, t]);

  const handleRecOption = async (field: string, value: any) => {
    const newState = { ...rec, [field]: value, step: rec.step + 1 };
    if (newState.step > 3) {
      newState.isComplete = true;
      const aiResponse = await getPlanRecommendation({
        employees: newState.size,
        cnssRequired: newState.cnss,
        companyType: newState.type
      }, lang);
      newState.aiText = aiResponse;
    }
    setRec(newState);
  };

  const prices = {
    monthly: { starter: 999, pro: 4990, enterprise: 19990 },
    yearly: { starter: 799, pro: 3990, enterprise: 15990 }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-white overflow-y-auto selection:bg-blue-100 no-scrollbar" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="flex justify-between items-center mb-16 sticky top-0 z-50 bg-white/80 backdrop-blur-md py-4 -mx-6 px-6 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <div dir="ltr" className="bg-[#0052FF] px-3 py-1 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">Salery.ma</div>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-all text-gray-400">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="text-center max-w-4xl mx-auto mb-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-[#0052FF] rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
            <span className="animate-pulse">✨</span> {t.recWizard.darijaTouch}
          </div>
          <h2 className="text-4xl md:text-7xl font-black text-[#1A1F36] tracking-tighter leading-tight">
            {t.title}
          </h2>
          <p className="text-[#697386] text-lg md:text-xl font-medium max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {!showRecommender && (
          <div className="max-w-xl mx-auto mb-20">
            <button
              onClick={() => setShowRecommender(true)}
              className="w-full group p-6 bg-[#1A1F36] text-white rounded-[32px] shadow-xl flex items-center justify-between hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center gap-5 text-start">
                <div className="w-14 h-14 bg-[#0052FF] rounded-2xl flex items-center justify-center">
                  <BrainCircuit size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-black tracking-tight leading-none mb-1">{t.recommenderBtn}</h4>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{t.recommenderSub}</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <ChevronRight size={20} className={lang === 'ar' ? 'rotate-180' : ''} />
              </div>
            </button>
          </div>
        )}

        {showRecommender && (
          <div className="max-w-4xl mx-auto mb-32 bg-gray-50/50 p-6 md:p-12 rounded-[48px] border border-gray-100 relative min-h-[500px] flex flex-col justify-center animate-in fade-in zoom-in duration-300">
            <button onClick={() => { setShowRecommender(false); setRec({ step: 1, size: '', cnss: false, type: '', isComplete: false, aiText: '' }); }} className="absolute top-8 right-8 p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            {!rec.isComplete ? (
              <div className="space-y-10 text-center">
                <div className="flex items-center gap-2 justify-center mb-8">
                  {[1, 2, 3].map(s => <div key={s} className={`h-1 rounded-full transition-all ${rec.step >= s ? 'w-8 bg-[#0052FF]' : 'w-4 bg-gray-200'}`}></div>)}
                </div>
                {rec.step === 1 && (
                  <div className="space-y-8">
                    <h3 className="text-2xl md:text-3xl font-black text-[#1A1F36]">{t.recWizard.q1}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {['1-10', '11-50', '51-200', '201-500', '500+'].map(v => <button key={v} onClick={() => handleRecOption('size', v)} className="py-4 bg-white border border-gray-100 rounded-2xl font-black text-sm hover:border-[#0052FF] transition-all">{v}</button>)}
                    </div>
                  </div>
                )}
                {rec.step === 2 && (
                  <div className="space-y-8">
                    <h3 className="text-2xl md:text-3xl font-black text-[#1A1F36]">{t.recWizard.q2}</h3>
                    <div className="grid grid-cols-2 gap-4 max-sm mx-auto">
                      <button onClick={() => handleRecOption('cnss', true)} className="p-6 bg-white border border-gray-100 rounded-3xl font-black text-lg hover:border-[#0052FF] hover:bg-white transition-all">{lang === 'ar' ? 'نعم' : 'Oui'}</button>
                      <button onClick={() => handleRecOption('cnss', false)} className="p-6 bg-white border border-gray-100 rounded-3xl font-black text-lg hover:border-[#0052FF] hover:bg-white transition-all">{lang === 'ar' ? 'لا' : 'Non'}</button>
                    </div>
                  </div>
                )}
                {rec.step === 3 && (
                  <div className="space-y-8">
                    <h3 className="text-2xl md:text-3xl font-black text-[#1A1F36]">{t.recWizard.q3}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['Startup', 'PME', 'Groupe'].map(v => <button key={v} onClick={() => handleRecOption('type', v)} className="p-6 bg-white border border-gray-100 rounded-3xl font-black text-lg hover:border-[#0052FF] hover:bg-white transition-all">{v}</button>)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center max-w-2xl mx-auto w-full">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"><BadgeCheck size={32} /></div>
                  <h3 className="text-3xl font-black text-[#1A1F36]">{t.recWizard.resultTitle}</h3>
                </div>
                <div className="bg-white p-8 rounded-[40px] shadow-2xl border-2 border-[#0052FF] text-start">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">{recommendation?.icon}</div>
                    <div><h4 className="text-2xl font-black text-[#1A1F36]">{recommendation?.title}</h4></div>
                  </div>
                  <div className="mb-8 text-gray-600 font-medium whitespace-pre-wrap leading-relaxed">
                    {rec.aiText || <RefreshCw className="animate-spin text-[#0052FF]" />}
                  </div>
                  <button onClick={() => onUpgrade(recommendation?.id as PlanType)} className="w-full py-5 bg-[#0052FF] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3">
                    {t.recWizard.startWith} {recommendation?.title} <ArrowRight size={20} className={lang === 'ar' ? 'rotate-180' : ''} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!showRecommender && (
          <>
            <div className="flex flex-col items-center gap-6 mb-20">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex p-1 bg-[#F7F9FC] rounded-full border border-[#E3E8EE] w-fit">
                  <button onClick={() => setBillingCycle('monthly')} className={`relative z-10 px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'text-black' : 'text-gray-400'}`}>
                    {t.monthly}
                  </button>
                  <button onClick={() => setBillingCycle('yearly')} className={`relative z-10 px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'text-black' : 'text-gray-400'}`}>
                    {t.yearly}
                  </button>
                  <div
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-all duration-300`}
                    style={{ transform: billingCycle === 'yearly' ? (lang === 'ar' ? 'translateX(-100%)' : 'translateX(100%)') : 'none' }}
                  />
                </div>

                <div className="relative flex p-1 bg-[#F7F9FC] rounded-full border border-[#E3E8EE] w-fit">
                  {(['MAD', 'USD', 'EUR'] as Currency[]).map((cur) => (
                    <button key={cur} onClick={() => setCurrency(cur)} className={`relative z-10 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all ${currency === cur ? 'text-[#0052FF]' : 'text-gray-400'}`}>{cur}</button>
                  ))}
                  <div className="absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-white rounded-full shadow-sm transition-all" style={{ transform: currency === 'USD' ? (lang === 'ar' ? 'translateX(-100%)' : 'translateX(100%)') : currency === 'EUR' ? (lang === 'ar' ? 'translateX(-200%)' : 'translateX(200%)') : 'none' }} />
                </div>
              </div>
              <div className={`px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest transition-opacity ${billingCycle === 'yearly' ? 'opacity-100' : 'opacity-0'}`}>
                {t.saveLabel}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-20">
              <PricingCard
                icon={<Zap size={32} className="text-emerald-500" />}
                title={t.starter}
                badge={lang === 'ar' ? 'الباقة الأساسية' : lang === 'fr' ? 'Offre Essentiel' : 'Starter Offer'}
                price={convert(billingCycle === 'monthly' ? prices.monthly.starter : prices.yearly.starter)}
                cycle={billingCycle === 'monthly' ? t.mo : t.yr}
                symbol={symbols[currency]}
                limit={`${t.upTo} 50 ${t.employees}`}
                features={t.features.starter}
                cta={t.freeTrial}
                onSelect={() => onUpgrade('STARTER')}
                isCurrent={currentPlan === 'STARTER'}
                lang={lang}
                currentLabel={t.current}
              />

              <PricingCard
                icon={<Rocket size={32} className="text-white" />}
                title={t.pro}
                badge={t.popular}
                isPopular
                price={convert(billingCycle === 'monthly' ? prices.monthly.pro : prices.yearly.pro)}
                cycle={billingCycle === 'monthly' ? t.mo : t.yr}
                symbol={symbols[currency]}
                limit={`${t.upTo} 500 ${t.employees}`}
                features={t.features.pro}
                cta={t.upgradeBtn}
                onSelect={() => onUpgrade('BUSINESS')}
                isCurrent={currentPlan === 'BUSINESS'}
                lang={lang}
                currentLabel={t.current}
                plusLabel={t.starter}
              />

              <PricingCard
                icon={<Crown size={32} className="text-[#0052FF]" />}
                title={t.enterprise}
                badge={lang === 'ar' ? 'باقة المؤسسات' : lang === 'fr' ? 'Grand Compte' : 'Enterprise'}
                price="SUR DEVIS"
                cycle={billingCycle === 'monthly' ? t.mo : t.yr}
                symbol={symbols[currency]}
                limit={t.unlimited}
                features={t.features.enterprise}
                cta={t.contactUs}
                onSelect={() => onUpgrade('ENTERPRISE')}
                isCurrent={currentPlan === 'ENTERPRISE'}
                lang={lang}
                currentLabel={t.current}
                plusLabel={t.pro}
                pricePrefix={t.startingAt}
                aiNudge={t.aiNudge}
                isCustom={billingCycle === 'yearly'}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const PricingCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  badge: string;
  price: number;
  cycle: string;
  symbol: string;
  limit: string;
  features: string[];
  cta: string;
  onSelect: () => void;
  isCurrent: boolean;
  isPopular?: boolean;
  lang: Language;
  currentLabel: string;
  plusLabel?: string;
  pricePrefix?: string;
  aiNudge?: string;
  isCustom?: boolean;
}> = ({ icon, title, badge, price, cycle, symbol, limit, features, cta, onSelect, isCurrent, isPopular, lang, currentLabel, plusLabel, pricePrefix, aiNudge, isCustom }) => (
  <div className={`relative flex flex-col p-10 rounded-[40px] border-2 transition-all h-full ${isPopular
    ? 'border-[#0052FF] bg-[#1a1a1a] text-white shadow-2xl z-10 lg:scale-[1.05]'
    : 'border-gray-100 bg-white hover:border-blue-100 hover:shadow-xl'
    }`}>
    {isPopular && <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#0052FF] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl whitespace-nowrap">{badge}</div>}
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 ${isPopular ? 'bg-[#0052FF]' : 'bg-gray-50'}`}>{icon}</div>

    <div className="mb-8">
      {!isPopular && <div className="text-[9px] font-black uppercase tracking-widest text-[#0052FF] mb-2">{badge}</div>}
      <h3 className={`text-3xl font-black tracking-tighter ${isPopular ? 'text-white' : 'text-[#1A1F36]'}`}>{title}</h3>
      <p className="text-[10px] font-bold uppercase tracking-widest mt-2 text-gray-400">{limit}</p>
      {aiNudge && (
        <div className={`flex items-center gap-2 mt-4 ${isPopular ? 'bg-white/10 border-white/10 text-white/90' : 'bg-blue-50 border-blue-100 text-[#0052FF]'} px-3 py-1.5 rounded-full w-fit border`}>
          <Sparkles size={12} strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-tight">{aiNudge}</span>
        </div>
      )}
    </div>

    <div className="mb-10 text-start">
      {pricePrefix && !isCustom && <span className="text-[9px] font-black uppercase text-gray-400 mb-1 block">{pricePrefix}</span>}
      <div className={`flex items-baseline flex-wrap gap-x-2 ${lang === 'ar' ? 'flex-row-reverse justify-end text-right' : 'text-left'}`}>
        {isCustom ? (
          <span className={`text-4xl font-black tracking-tighter ${isPopular ? 'text-white' : 'text-[#1A1F36]'}`}>
            {lang === 'fr' ? 'SUR DEVIS' : lang === 'ar' ? 'على المقاس' : 'ON QUOTE'}
          </span>
        ) : (
          <div className="flex items-baseline gap-1.5 leading-none">
            <span className={`text-5xl md:text-6xl font-black tracking-tighter leading-none ${isPopular ? 'text-white' : 'text-[#1A1F36]'}`}>
              {price}
            </span>
            <div className="flex flex-col items-start leading-none gap-0.5">
              <span className={`text-lg md:text-xl font-black uppercase ${isPopular ? 'text-[#0052FF]' : 'text-[#1A1F36]'}`}>
                {symbol}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest leading-none text-gray-400 whitespace-nowrap`}>
                / {cycle}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="space-y-4 flex-1 mb-10 text-start">
      {plusLabel && <div className={`flex items-center gap-3 text-[9px] font-black uppercase tracking-widest ${isPopular ? 'text-[#0052FF]' : 'text-blue-400'}`}><Plus size={14} strokeWidth={3} /> {lang === 'ar' ? 'كل ميزات' : 'Tout de'} {plusLabel}</div>}
      {features.map((f, i) => (
        <div key={i} className={`flex items-start gap-3 text-sm font-semibold ${isPopular ? 'text-gray-300' : 'text-[#484848]'} ${lang === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${isPopular ? 'bg-blue-500/20 text-[#0052FF]' : 'bg-emerald-50 text-emerald-600'}`}>
            <Check size={12} strokeWidth={4} />
          </div>
          <span className={f.includes('IA') || f.includes('AI') ? "font-black text-[#0052FF]" : ""}>{f}</span>
        </div>
      ))}
    </div>
    <button onClick={onSelect} disabled={isCurrent} className={`w-full py-5 rounded-2xl font-black text-lg transition-all active:scale-[0.97] ${isCurrent ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : isPopular ? 'bg-[#0052FF] text-white' : 'bg-[#1A1F36] text-white'}`}>
      {isCurrent ? currentLabel : cta}
    </button>
  </div>
);

export default PricingModal;
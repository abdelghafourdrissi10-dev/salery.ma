import React, { useState } from 'react';
import { X, Send, MessageCircle, User, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { Language, AuthUser } from '../types';

interface Props {
  user?: AuthUser | null;
  lang: Language;
  onClose: () => void;
}

const SupportModal: React.FC<Props> = ({ user, lang, onClose }) => {
  const [formData, setFormData] = useState({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user ? user.email : '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const t = {
    fr: {
      title: "Support",
      subtitle: "Réponse sous 24h.",
      name: "Nom",
      email: "E-mail",
      subject: "Sujet",
      message: "Message",
      send: "Envoyer",
      sending: "Envoi...",
      successTitle: "Envoyé !",
      successDesc: "Nous reviendrons vers vous rapidement.",
      close: "Fermer",
      placeholderSubject: "Sujet de votre demande",
      placeholderMessage: "Détails..."
    },
    en: {
      title: "Support",
      subtitle: "Response within 24h.",
      name: "Name",
      email: "Email",
      subject: "Subject",
      message: "Message",
      send: "Send",
      sending: "Sending...",
      successTitle: "Sent!",
      successDesc: "We'll get back to you shortly.",
      close: "Close",
      placeholderSubject: "Subject of your request",
      placeholderMessage: "Details..."
    },
    ar: {
      title: "الدعم",
      subtitle: "الرد خلال 24 ساعة.",
      name: "الاسم",
      email: "البريد",
      subject: "الموضوع",
      message: "الرسالة",
      send: "إرسال",
      sending: "جاري...",
      successTitle: "تم الإرسال!",
      successDesc: "سنتصل بك في أقرب وقت.",
      close: "إغلاق",
      placeholderSubject: "موضوع الطلب",
      placeholderMessage: "التفاصيل..."
    }
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-3xl overflow-hidden relative animate-in zoom-in duration-300">
        <button onClick={onClose} className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'} p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors z-10`}>
          <X size={18} strokeWidth={3} className="text-gray-400" />
        </button>

        {!isSuccess ? (
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#0052FF]">
                <MessageCircle size={20} />
              </div>
              <div className="text-start">
                <h2 className="text-xl font-black text-[#222222] tracking-tighter leading-tight">{t.title}</h2>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{t.subtitle}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.name}</label>
                  <div className="relative">
                    <User size={14} className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-300`} />
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full ${lang === 'ar' ? 'pr-9' : 'pl-9'} py-2.5 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-50 focus:border-[#0052FF] outline-none transition-all`}
                      placeholder={t.name}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.email}</label>
                  <div className="relative">
                    <Mail size={14} className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-300`} />
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full ${lang === 'ar' ? 'pr-9' : 'pl-9'} py-2.5 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-50 focus:border-[#0052FF] outline-none transition-all`}
                      placeholder={t.email}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.subject}</label>
                <div className="relative">
                  <FileText size={14} className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-300`} />
                  <input
                    required
                    type="text"
                    placeholder={t.placeholderSubject}
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className={`w-full ${lang === 'ar' ? 'pr-9' : 'pl-9'} py-2.5 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-50 focus:border-[#0052FF] outline-none transition-all placeholder-gray-300`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.message}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={t.placeholderMessage}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="w-full p-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-50 focus:border-[#0052FF] outline-none transition-all placeholder-gray-300 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#222222] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? <span className="animate-pulse">{t.sending}</span> : <>{t.send} <Send size={14} /></>}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-8 text-center space-y-6 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-emerald-500" strokeWidth={3} />
            </div>
            <div className="text-start text-center">
              <h3 className="text-xl font-black text-[#222222] mb-2">{t.successTitle}</h3>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">{t.successDesc}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-[#0052FF] text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:brightness-110 active:scale-95 transition-all"
            >
              {t.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportModal;
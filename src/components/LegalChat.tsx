
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Send, Bot, Sparkles, RefreshCw, Plus, MessageSquare, History, Scale, 
  FileText, Search, Trash2, Paperclip, Mic, Lock, Zap, ShieldAlert,
  ChevronRight, X, AlertCircle, CheckCircle2, MicOff, Terminal,
  Maximize2, Minimize2, Download, Copy, Share2, Brain, Headphones
} from 'lucide-react';
import { Language, ChatMessage, AuthUser } from '../types';
import { streamLegalAdvice, connectLive } from '../services/geminiService';

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

interface Props {
  lang: Language;
  user: AuthUser;
}

const LegalChat: React.FC<Props> = ({ lang, user }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attachedFile, setAttachedFile] = useState<{name: string, data: string, mimeType: string, size: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const t = {
    fr: { 
      header: "Salery Intelligence", 
      newChat: "Nouvelle discussion",
      history: "Conversations récentes",
      placeholder: "Posez une question sur le droit du travail (Shift + Enter pour une nouvelle ligne)...", 
      trust: "Données souveraines • AES-256 • Conforme 2026",
      thinking: "Salery AI analyse votre requête...",
      search: "Rechercher (CMD + K)",
      empty: "Aucune conversation trouvée.",
      error: "Une erreur réseau est survenue. Veuillez réessayer.",
      retry: "RÉESSAYER",
      fileUploaded: "Document chargé",
      fileLimit: "Limite 10MB dépassée",
      thinkingMode: "Mode Réflexion",
      liveVoice: "Voix en Direct"
    },
    ar: { 
      header: "ذكاء Salery", 
      newChat: "محادثة جديدة",
      history: "المحادثات الأخيرة",
      placeholder: "اسأل عن قانون الشغل (Shift + Enter لسطر جديد)...", 
      trust: "بيانات سيادية • تشفير AES-256 • مطابق لـ 2026",
      thinking: "Salery AI يقوم بالتحليل...",
      search: "بحث (CMD + K)",
      empty: "لا توجد محادثات.",
      error: "حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى.",
      retry: "إعادة المحاولة",
      fileUploaded: "تم تحميل الملف",
      fileLimit: "تجاوز الحد الأقصى 10MB",
      thinkingMode: "وضع التفكير",
      liveVoice: "صوت مباشر"
    }
  }[lang === 'ar' ? 'ar' : 'fr'];

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem(`salery_v26_chats_${user.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setConversations(parsed);
      if (parsed.length > 0 && !activeId) setActiveId(parsed[0].id);
    }
  }, [user.id]);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(`salery_v26_chats_${user.id}`, JSON.stringify(conversations));
    }
  }, [conversations, user.id]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, loading, activeId, scrollToBottom]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('ai-chat-search')?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !loading && input.trim()) {
        handleSend();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, loading]);

  const activeConv = useMemo(() => conversations.find(c => c.id === activeId), [conversations, activeId]);

  const handleNewChat = () => {
    const id = `chat_${Date.now()}`;
    const newConv: Conversation = {
      id,
      title: lang === 'fr' ? 'Nouvelle discussion' : 'محادثة جديدة',
      messages: [],
      updatedAt: Date.now()
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveId(id);
    setInput('');
    setAttachedFile(null);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSend = async () => {
    const query = input.trim();
    if ((!query && !attachedFile) || loading) return;

    setError(null);
    let currentId = activeId;
    
    // Create conversation if none active
    if (!currentId) {
      const id = `chat_${Date.now()}`;
      const newConv: Conversation = {
        id,
        title: query.substring(0, 35) || 'Analyse Document',
        messages: [],
        updatedAt: Date.now()
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveId(id);
      currentId = id;
    }

    const userMsg: ChatMessage = { role: 'user', text: query || `Analyse du fichier: ${attachedFile?.name}`, timestamp: Date.now() };
    const aiMsgPlaceholder: ChatMessage = { role: 'model', text: '', timestamp: Date.now() + 1 };
    
    const currentHistory = activeConv?.messages || [];
    
    setConversations(prev => prev.map(c => 
      c.id === currentId ? { 
        ...c, 
        messages: [...c.messages, userMsg, aiMsgPlaceholder],
        title: c.messages.length === 0 ? userMsg.text.substring(0, 35) : c.title,
        updatedAt: Date.now() 
      } : c
    ));

    const filePayload = attachedFile ? { data: attachedFile.data.split(',')[1], mimeType: attachedFile.mimeType } : undefined;
    
    setInput('');
    setAttachedFile(null);
    setLoading(true);

    try {
      await streamLegalAdvice(
        query || "Analyse ce document dans le contexte du droit marocain.",
        currentHistory,
        user,
        (chunk) => {
          setConversations(prev => prev.map(c => 
            c.id === currentId ? {
              ...c,
              messages: c.messages.map((m, i) => 
                (i === c.messages.length - 1 && m.role === 'model') ? { ...m, text: chunk } : m
              )
            } : c
          ));
        },
        filePayload,
        useThinking
      );
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert(t.fileLimit);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        data: event.target?.result as string,
        mimeType: file.type,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Navigateur non compatible avec la voix.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'fr' ? 'fr-FR' : 'ar-MA';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const [liveSession, setLiveSession] = useState<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);

  const toggleLiveMode = async () => {
    if (isLiveMode) {
      liveSession?.close();
      setLiveSession(null);
      setIsLiveMode(false);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    try {
      const session = await connectLive({
        onopen: async () => {
          console.log("Live session opened");
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioContext = new AudioContext({ sampleRate: 16000 });
          audioContextRef.current = audioContext;
          
          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          
          source.connect(processor);
          processor.connect(audioContext.destination);
          
          processor.onaudioprocess = (e) => {
            if (!session) return;
            const inputData = e.inputBuffer.getChannelData(0);
            // Convert Float32 to Int16 PCM
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
            }
            const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
            session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } });
          };
        },
        onmessage: (message: any) => {
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            const audioData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)).buffer;
            // Playback logic for PCM would go here
            // For simplicity in this demo, we'll log it
            console.log("Received audio chunk");
          }
        },
        onclose: () => setIsLiveMode(false),
        onerror: (err: any) => console.error(err),
      }, "Vous êtes l'assistant vocal de Salery.ma. Répondez de manière concise et professionnelle en français ou arabe marocain.");

      setLiveSession(session);
      setIsLiveMode(true);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la connexion Live. Vérifiez vos permissions micro.");
    }
  };

  const filteredConversations = useMemo(() => conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [conversations, searchQuery]);

  return (
    <div className="flex h-[88vh] bg-white border border-[#E2E8F0] rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in duration-300 font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-[#F8FAFC] border-r border-[#E2E8F0] shrink-0">
        <div className="p-4 space-y-4 flex flex-col h-full">
           <button 
             onClick={handleNewChat}
             className="w-full flex items-center justify-between p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm group active:scale-95 shrink-0"
           >
             <div className="flex items-center gap-2">
                <Plus size={16} className="text-blue-600" />
                <span>{t.newChat}</span>
             </div>
             <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded text-[9px] text-gray-400 font-mono">⌘N</kbd>
           </button>

           <div className="relative group shrink-0">
              <Search size={14} className={`absolute ${lang === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
              <input 
                id="ai-chat-search"
                type="text"
                placeholder={t.search}
                className={`w-full ${lang === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
           </div>

           <div className="flex-1 overflow-y-auto no-scrollbar py-2">
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t.history}</p>
              <div className="space-y-1">
                 {filteredConversations.length > 0 ? filteredConversations.map((c) => (
                   <div key={c.id} className="relative group">
                    <button 
                      onClick={() => setActiveId(c.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${activeId === c.id ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      <MessageSquare size={14} className={activeId === c.id ? 'text-blue-600' : 'text-gray-300'} />
                      <span className="truncate pr-8">{c.title}</span>
                    </button>
                    <button 
                       onClick={(e) => { e.stopPropagation(); setConversations(prev => prev.filter(p => p.id !== c.id)); if(activeId === c.id) setActiveId(null); }} 
                       className={`absolute ${lang === 'ar' ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-rose-500 transition-all`}
                     >
                        <Trash2 size={12}/>
                     </button>
                   </div>
                 )) : (
                   <p className="px-3 text-[10px] text-gray-400 italic py-4">{t.empty}</p>
                 )}
              </div>
           </div>

           <div className="mt-auto pt-4 border-t border-[#E2E8F0] space-y-1 shrink-0">
              <ModuleItem icon={<Zap size={14}/>} label="Paie Pro" />
              <ModuleItem icon={<ShieldAlert size={14}/>} label="Alertes CNSS" />
           </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        <header className="h-14 px-6 border-b border-[#E2E8F0] flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-20">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100">
                 <Scale size={16} />
              </div>
              <h2 className="text-sm font-bold text-[#0F172A] truncate max-w-[400px]">{activeConv?.title || t.header}</h2>
           </div>
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setUseThinking(!useThinking)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${useThinking ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                title={t.thinkingMode}
              >
                <Brain size={16} className={useThinking ? 'animate-pulse' : ''} />
                <span className="text-[10px] font-black uppercase tracking-tight hidden sm:block">{t.thinkingMode}</span>
              </button>

              <button 
                onClick={toggleLiveMode}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${isLiveMode ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                title={t.liveVoice}
              >
                <Headphones size={16} className={isLiveMode ? 'animate-bounce' : ''} />
                <span className="text-[10px] font-black uppercase tracking-tight hidden sm:block">{t.liveVoice}</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight">Active Node</span>
              </div>
           </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll bg-[#FBFCFE]">
          <div className="max-w-[850px] mx-auto w-full py-12 px-6 space-y-10">
            
            {(!activeConv || !activeConv.messages.length) && !loading && (
              <div className="text-center py-20 animate-in fade-in zoom-in duration-700 space-y-8">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto border border-blue-100 shadow-sm text-blue-600">
                   <Bot size={44} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                   <h3 className="text-3xl font-black text-[#0F172A] tracking-tighter">Bienvenue, {user.firstName}</h3>
                   <p className="text-gray-500 text-sm max-w-sm mx-auto">Votre assistant juridique expert en droit du travail marocain est prêt à vous aider.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                   <QuickAction label="Indemnité de licenciement" onClick={setInput} />
                   <QuickAction label="Congé maternité (Droit)" onClick={setInput} />
                   <QuickAction label="Heures supplémentaires" onClick={setInput} />
                   <QuickAction label="Période d'essai (Cadre)" onClick={setInput} />
                </div>
              </div>
            )}

            {activeConv?.messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {m.role === 'user' ? (
                  <div className="max-w-[80%] bg-[#0F172A] text-white px-5 py-3.5 rounded-[22px] rounded-tr-sm shadow-md text-[14px] font-medium leading-relaxed">
                    {m.text}
                  </div>
                ) : (
                  <div className="w-full bg-white border border-[#E2E8F0] rounded-[28px] p-6 md:p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                          <Bot size={18} />
                       </div>
                       <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Salery AI Core</span>
                    </div>
                    <div className="prose prose-blue max-w-none text-[#0F172A] text-[15px] leading-[1.75]">
                       {formatAIResponse(m.text)}
                       {m.text === "" && loading && <TypingIndicator />}
                    </div>
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                       <ActionIcon icon={<Copy size={14}/>} />
                       <ActionIcon icon={<Download size={14}/>} />
                       <ActionIcon icon={<Share2 size={14}/>} />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {error && (
              <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4">
                 <div className="flex items-center gap-3 text-rose-700">
                    <AlertCircle size={20}/>
                    <p className="text-sm font-bold">{error}</p>
                 </div>
                 <button onClick={handleSend} className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200">{t.retry}</button>
              </div>
            )}
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="p-6 md:p-8 bg-white border-t border-[#E2E8F0] shrink-0 z-30">
          <div className="max-w-[850px] mx-auto w-full space-y-4">
             
             {attachedFile && (
               <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-2xl animate-in slide-in-from-bottom-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-50">
                     <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0 text-start">
                     <p className="text-xs font-bold text-blue-900 truncate">{attachedFile.name}</p>
                     <p className="text-[9px] font-bold text-blue-600 uppercase">{(attachedFile.size / 1024 / 1024).toFixed(2)} MB • {t.fileUploaded}</p>
                  </div>
                  <button onClick={() => setAttachedFile(null)} className="p-2 text-blue-400 hover:text-rose-500 transition-colors">
                     <X size={18}/>
                  </button>
               </div>
             )}

             <div className="relative group shadow-lg rounded-[28px] border border-[#E2E8F0] focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50/30 transition-all bg-white overflow-hidden">
                <div className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 flex items-center gap-1`}>
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
                   >
                     <Paperclip size={20} />
                   </button>
                   <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.xlsx,.txt" onChange={handleFileUpload} />
                </div>
                
                <textarea 
                  ref={inputRef}
                  value={input} 
                  rows={1}
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isListening ? "Parlez maintenant..." : t.placeholder}
                  className={`w-full py-5 ${lang === 'ar' ? 'pr-20 pl-32' : 'pl-16 pr-32'} bg-transparent text-[15px] font-medium text-[#0F172A] outline-none placeholder-gray-400 transition-all resize-none max-h-40 custom-scroll`}
                  disabled={loading}
                />

                <div className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 flex items-center gap-2`}>
                   {isListening && (
                     <div className="flex gap-0.5 items-center px-2">
                       <div className="w-1 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                       <div className="w-1 h-5 bg-blue-600 rounded-full animate-bounce delay-75"></div>
                       <div className="w-1 h-3 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                     </div>
                   )}
                   <button 
                     onClick={toggleVoice}
                     className={`p-2.5 transition-all active:scale-90 rounded-2xl ${isListening ? 'bg-rose-500 text-white shadow-lg' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                   >
                     {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                   </button>
                   <button 
                     onClick={handleSend}
                     disabled={(!input.trim() && !attachedFile) || loading}
                     className={`p-2.5 rounded-2xl transition-all shadow-lg active:scale-95 ${(!input.trim() && !attachedFile) || loading ? 'bg-gray-100 text-gray-300' : 'bg-[#0F172A] text-white hover:bg-black shadow-blue-100'}`}
                   >
                     {loading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
                   </button>
                </div>
             </div>

             <div className="flex justify-center items-center gap-8 px-4 opacity-50">
                <div className="flex items-center gap-1.5">
                   <Lock size={10} className="text-emerald-500" />
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{t.trust}</p>
                </div>
                <div className="flex items-center gap-1.5">
                   <Terminal size={10} className="text-blue-500" />
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">v26.4.2 Enterprise Node</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// HELPERS
const ModuleItem = ({ icon, label }: any) => (
  <button className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-all text-start group">
     <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-50 transition-colors">{icon}</div>
     <span>{label}</span>
  </button>
);

const QuickAction = ({ label, onClick }: any) => (
  <button onClick={() => onClick(label)} className="px-5 py-4 bg-blue-50/50 border border-blue-100/50 rounded-[20px] text-[13px] font-bold text-[#475569] hover:border-blue-400 hover:text-blue-600 hover:shadow-md transition-all text-start active:scale-95">
    {label}
  </button>
);

const ActionIcon = ({ icon }: any) => (
  <button className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-90">
    {icon}
  </button>
);

const TypingIndicator = () => (
  <div className="flex gap-1.5 py-2">
    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
  </div>
);

const formatAIResponse = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (line.startsWith('###')) {
      return <h3 key={i} className="text-xl font-black text-[#0F172A] mt-8 mb-4 tracking-tighter uppercase border-b border-gray-100 pb-2">{line.replace('###', '').trim()}</h3>;
    }
    if (line.startsWith('**')) {
       const parts = line.split(':');
       if (parts.length > 1) {
         return <p key={i} className="mb-3"><span className="font-black text-[#0F172A] uppercase text-[12px] tracking-widest mr-2">{parts[0].replace(/\*\*/g, '')}:</span><span className="text-gray-600">{parts.slice(1).join(':')}</span></p>;
       }
       return <p key={i} className="mb-4 text-[#0F172A] font-bold text-[14px] border-l-4 border-blue-600 pl-4">{line.replace(/\*\*/g, '')}</p>;
    }
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      return <li key={i} className="ml-5 text-gray-600 mb-2 list-none flex items-start gap-3 group">
        <div className="mt-2.5 w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0 group-hover:scale-125 transition-transform"></div>
        <span className="leading-relaxed">{line.substring(1).trim()}</span>
      </li>;
    }
    if (line.includes('Article')) {
      return <span key={i} className="inline-block px-3 py-1 bg-blue-50 text-blue-800 rounded-lg text-[11px] font-black border border-blue-100 my-2 shadow-sm uppercase tracking-tight">{line}</span>;
    }
    return line.trim() ? <p key={i} className="mb-4 text-gray-600 leading-[1.8]">{line}</p> : <div key={i} className="h-2"></div>;
  });
};

export default LegalChat;

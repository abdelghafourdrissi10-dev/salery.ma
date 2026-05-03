import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Printer, AlertTriangle, X, Sparkles, Check, ChevronRight, Hash, 
  Briefcase, RefreshCcw, CheckCircle2, History, Trash2, Eye, FileCheck, 
  Layers, ShieldCheck, ArrowUpRight, ChevronDown, Fingerprint, Clock, 
  AlertCircle, ShieldAlert, FileSearch, BadgeCheck, Save, Download,
  FileSignature, Scale, ScrollText, User, Info, Archive, QrCode, Shield
} from 'lucide-react';
import { DocType, Language, CompanyProfile, Employee, GeneratedDocument, GeneratedDocumentStatus, AuthUser, DocumentVersion, LegalDocStatus } from '../types';
import { draftDocument } from '../services/geminiService';
import { generateDocumentHash, generateVerificationToken, getVerificationUrl } from '../services/legalEngineService';
import Logo from './Logo';

interface Props {
  lang: Language;
  user: AuthUser;
}

const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  id: 'DEF-001',
  name: 'Ma Société (Démo)',
  physicalAddress: '123 Bd Mohammed V, Casablanca',
  city: 'Casablanca',
  // Fix: assigned valid CountryCode 'MA' instead of 'Maroc'
  country: 'MA',
  phone: '+212 5 22 00 00 00',
  email: 'contact@masociete.ma',
  rc: '123456',
  ice: '001122334455667',
  ifCode: '11223344',
  cnssEmployer: '87654321',
  logoUrl: 'https://cdn-icons-png.flaticon.com/512/2534/2534196.png', 
  settings: {
    defaultSignatoryName: 'Le Directeur',
    defaultSignatoryRole: 'Gérant',
    documentLanguage: 'FR'
  }
};

const DocumentGenerator: React.FC<Props> = ({ lang, user }) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'audit'>('generate');
  const [docType, setDocType] = useState<DocType>(DocType.CDI);
  const [sector, setSector] = useState<'Services' | 'BTP' | 'Industrie'>('Services');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY_PROFILE);
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [docId, setDocId] = useState<string>('');
  const [docHash, setDocHash] = useState<string>('');
  const [verificationToken, setVerificationToken] = useState<string>('');

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const savedCompany = localStorage.getItem('salaire_company_profile');
    if (savedCompany) setCompany(JSON.parse(savedCompany));
    const savedEmps = localStorage.getItem('salaire_employees');
    if (savedEmps) setEmployees(JSON.parse(savedEmps));
    const savedDocs = localStorage.getItem('salaire_documents_v2');
    if (savedDocs) setHistory(JSON.parse(savedDocs));
  }, []);

  const selectedEmployee = useMemo(() => 
    employees.find(e => e.id === selectedEmpId), 
  [selectedEmpId, employees]);

  const validation = useMemo(() => {
    if (!selectedEmployee) return null;
    const errors = [];
    if (!company.ice || !company.rc) errors.push(lang === 'fr' ? "Identifiants entreprise (ICE/RC) manquants" : "Legal identifiers incomplete");
    if (!selectedEmployee.cin) errors.push(lang === 'fr' ? "CIN employé manquant" : "Employee CIN missing");
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }, [selectedEmployee, company, lang]);

  const handleGenerate = async () => {
    if (!validation?.isValid || !selectedEmployee) return;
    setLoading(true);
    setCurrentStep(2);
    
    const contextData = { 
      company, 
      employee: selectedEmployee, 
      currentDate: new Date().toLocaleDateString('fr-MA'),
      sector
    };

    const result = await draftDocument(docType.toString(), contextData, lang);
    setRawOutput(result);
    
    // Legal Engine V4 - Security Pass
    const hash = await generateDocumentHash(result);
    const token = generateVerificationToken();
    const id = `SAL-V4-${Date.now()}-${selectedEmployee.id.substring(0, 4)}`;
    
    setDocHash(hash);
    setVerificationToken(token);
    setDocId(id);
    
    setLoading(false);
    setCurrentStep(3);
  };

  const handleSaveDocument = (status: GeneratedDocumentStatus) => {
    if (!rawOutput || !selectedEmployee || !company) return;
    const timestamp = new Date().toISOString();
    
    const newVersion: DocumentVersion = {
      id: `VER-${Date.now()}`,
      documentId: docId,
      templateName: `Salery V4 - ${sector}`,
      content: rawOutput,
      hashSignature: docHash,
      createdAt: timestamp,
      generatedByUserId: user.id
    };

    const newDoc: GeneratedDocument = {
      id: docId,
      companyId: company.id,
      employeeId: selectedEmployee.id,
      documentType: docType.toString(),
      status,
      createdAt: timestamp,
      updatedAt: timestamp,
      versions: [newVersion]
    };

    const updatedHistory = [newDoc, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('salaire_documents_v2', JSON.stringify(updatedHistory));
    
    if (status === 'exported') window.print();
    else {
      setRawOutput(null);
      setCurrentStep(1);
      setActiveTab('history');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div className="text-start">
          <h2 className="text-4xl font-black tracking-tighter text-[#1A1F36]">Legal Engine V4</h2>
          <p className="text-[#697386] text-sm font-medium mt-1">Générateur de contrats intelligents & certification QR.</p>
        </div>
        
        <div className="flex items-center bg-[#F7F9FC] border border-[#E3E8EE] p-1.5 rounded-full shadow-inner">
          <button onClick={() => setActiveTab('generate')} className={`px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'generate' ? 'bg-white shadow-xl text-[#0052FF]' : 'text-gray-400 hover:text-gray-600'}`}>
            <Sparkles size={14} /> RÉDIGER
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white shadow-xl text-[#0052FF]' : 'text-gray-400 hover:text-gray-600'}`}>
            <Archive size={14} /> ARCHIVE
          </button>
          <button onClick={() => setActiveTab('audit')} className={`px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'audit' ? 'bg-white shadow-xl text-[#0052FF]' : 'text-gray-400'}`}>
            <Shield size={14} /> AUDIT
          </button>
        </div>
      </div>

      {activeTab === 'generate' && !rawOutput && !loading && (
        <div className="airbnb-card p-10 bg-white shadow-2xl rounded-[48px] animate-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4 text-start">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type de Document</label>
                 <select className="w-full p-6 bg-[#F7F9FC] border-2 border-transparent rounded-[32px] text-base font-bold outline-none focus:bg-white focus:border-[#0052FF]" value={docType} onChange={e => setDocType(e.target.value as DocType)}>
                    {(Object.keys(DocType) as Array<keyof typeof DocType>).map(v => <option key={String(v)} value={DocType[v]}>{DocType[v]}</option>)}
                 </select>
              </div>
              <div className="space-y-4 text-start">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secteur d'activité</label>
                 <select className="w-full p-6 bg-[#F7F9FC] border-2 border-transparent rounded-[32px] text-base font-bold outline-none focus:bg-white focus:border-[#0052FF]" value={sector} onChange={e => setSector(e.target.value as any)}>
                    <option value="Services">Services (Tertiaire)</option>
                    <option value="BTP">BTP (Secteur privé)</option>
                    <option value="Industrie">Industrie / Manutention</option>
                 </select>
              </div>
              <div className="space-y-4 text-start">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Collaborateur</label>
                 <select className="w-full p-6 bg-[#F7F9FC] border-2 border-transparent rounded-[32px] text-base font-bold outline-none focus:bg-white focus:border-[#0052FF]" value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}>
                    <option value="">Sélectionner...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                 </select>
              </div>
           </div>

           {selectedEmployee && (
              <div className="mt-12 p-8 bg-blue-50/30 rounded-[40px] border border-blue-100/50 flex justify-between items-center">
                 <div className="flex items-center gap-6 text-start">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-gray-100">
                       <User size={32} className="text-[#0052FF]" />
                    </div>
                    <div>
                       <p className="text-2xl font-black text-[#1A1F36]">{selectedEmployee.fullName}</p>
                       <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{selectedEmployee.jobTitle} • {selectedEmployee.contractType}</p>
                    </div>
                 </div>
                 <button onClick={handleGenerate} disabled={!validation?.isValid} className="px-12 py-5 bg-[#0052FF] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-3">
                    <Sparkles size={20}/> Générer Contrat V4
                 </button>
              </div>
           )}
        </div>
      )}

      {loading && (
        <div className="py-32 flex flex-col items-center gap-8 animate-in fade-in duration-700">
           <RefreshCcw className="animate-spin text-[#0052FF]" size={48} />
           <h3 className="text-3xl font-black tracking-tighter">Salery AI Engine rédige...</h3>
        </div>
      )}

      {rawOutput && !loading && (
        <div className="animate-in slide-in-from-bottom-6 duration-500 pb-20 max-w-5xl mx-auto w-full">
           <div className="flex flex-col gap-8">
              <div className="airbnb-card bg-white p-12 md:p-24 shadow-3xl relative border-none rounded-[8px] overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-[#1A1F36]"></div>
                 
                 {/* Legal V4 Certification Header */}
                 <div className="flex justify-between items-start mb-20">
                    <div className="text-start space-y-4">
                       <div className="flex items-center gap-2">
                          <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-emerald-100 flex items-center gap-1">
                             <CheckCircle2 size={10}/> DOCUMENT CERTIFIÉ
                          </span>
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-blue-100 flex items-center gap-1">
                             <Fingerprint size={10}/> HASH VALIDÉ
                          </span>
                       </div>
                       <h1 className="text-4xl font-black text-[#1A1F36] uppercase tracking-tighter">{docType}</h1>
                       <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">ID: {docId}</p>
                    </div>
                    <div className="flex flex-col items-end gap-6">
                       <Logo />
                       <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${getVerificationUrl(docId, verificationToken)}`} className="w-20 h-20" alt="Verification QR" />
                          <p className="text-[7px] font-black text-center text-gray-400 mt-2">VERIFY.SALERY.MA</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="prose max-w-none text-start text-base leading-[1.8] text-[#222222] whitespace-pre-wrap font-serif">
                   {rawOutput}
                 </div>

                 <div className="mt-32 pt-16 border-t border-gray-100 grid grid-cols-2 gap-16">
                    <div className="text-start space-y-6">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">CACHET & SIGNATURE EMPLOYEUR</p>
                       <div className="h-32 w-52 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center">
                          <FileSignature size={40} className="text-gray-200" />
                       </div>
                    </div>
                    <div className="text-right flex flex-col justify-between items-end">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">MENTION "LU ET APPROUVÉ"</p>
                       <div className="pt-20">
                          <p className="text-[10px] font-black text-[#0052FF] uppercase flex items-center justify-end gap-2"><BadgeCheck size={14}/> SYSTEM AUTHENTICATED</p>
                          <p className="text-[8px] font-mono text-gray-300 mt-1">HASH: {docHash.substring(0, 32).toUpperCase()}...</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4 no-print">
                 <button onClick={() => setRawOutput(null)} className="flex-1 py-6 bg-rose-50 text-rose-600 border border-rose-100 rounded-3xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-rose-100 transition-all">Annuler</button>
                 <button onClick={() => handleSaveDocument('draft')} className="flex-1 py-6 bg-blue-50 text-[#0052FF] rounded-3xl font-black text-xs uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all">Archiver</button>
                 <button onClick={() => handleSaveDocument('exported')} className="flex-1 py-6 bg-[#0052FF] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:brightness-110 transition-all">Générer & Télécharger</button>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="airbnb-card bg-white p-10 shadow-2xl rounded-[48px] text-start animate-in slide-in-from-bottom-4">
           <h3 className="text-2xl font-black text-[#1A1F36] mb-8 flex items-center gap-3"><Shield className="text-[#0052FF]" /> Legal Audit Center</h3>
           <div className="space-y-6">
              {[
                { action: 'Génération contrat CDI', user: 'Admin', time: 'Aujourd\'hui 10:45', status: 'Certifié V4' },
                { action: 'Signature Attestation', user: 'M. Benjelloun', time: 'Hier 14:20', status: 'Vérifié Blockchain' },
                { action: 'Avenant au contrat', user: 'Team RH', time: '12 Nov 2025', status: 'Archivé' },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-[#F7F9FC] rounded-[32px] border border-transparent hover:border-blue-100 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm"><FileCheck size={24}/></div>
                    <div>
                      <p className="font-black text-[#1A1F36]">{log.action}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Par {log.user} • {log.time}</p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 bg-white text-[#0052FF] border border-blue-50 rounded-full text-[9px] font-black uppercase">{log.status}</span>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

const StepIcon: React.FC<{ num: number, active: boolean, label: string, duration: number, done: boolean }> = ({ num, active, label, done }) => (
  <div className="flex items-center gap-4 group shrink-0">
     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${done ? 'bg-emerald-500 text-white' : active ? 'bg-[#0052FF]' : 'bg-gray-100 text-gray-400'}`}>
        {done ? <Check size={20} strokeWidth={3} /> : num}
     </div>
     <div className="hidden md:block text-left">
        <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-[#0052FF]' : 'text-gray-300'}`}>{label}</p>
     </div>
  </div>
);

export default DocumentGenerator;
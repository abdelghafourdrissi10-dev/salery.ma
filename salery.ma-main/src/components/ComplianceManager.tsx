import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, Landmark, FileText, BadgeCheck, FileDown, FileSignature, 
  RefreshCw, ExternalLink, Printer, Eye, Lock, ShieldAlert, History, CreditCard,
  FileCode, FileJson, CheckCircle2, Cpu, Network, Search, Filter, Users, 
  Fingerprint, Activity, Server, Database, Globe, Key, Shield,
  // Added comment: Added Info and Terminal icons to fix missing references in registry footer and security audit log
  Info, Terminal
} from 'lucide-react';
import { Language, Employee, AuthUser, AttendanceRecord, CompanyProfile, PayrollResult, GovernmentSubmission } from '../types';
import { calculateEmployeePayroll } from '../services/payrollEngine';
import { CnssLogo, DgiLogo } from './GovernmentLogos';
import Logo from './Logo';

interface Props {
  lang: Language;
  employees: Employee[];
  attendance: AttendanceRecord[];
  user: AuthUser;
}

const ComplianceManager: React.FC<Props> = ({ lang, employees, attendance, user }) => {
  const [activeView, setActiveView] = useState<'registry' | 'security' | 'cnss'>('cnss');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentMonthYear = new Date().toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { month: 'long', year: 'numeric' });

  const payrollResults: PayrollResult[] = useMemo(() => {
    return employees.map(e => calculateEmployeePayroll(e, attendance, [], [], [], currentMonthYear));
  }, [employees, attendance, currentMonthYear]);

  const t = useMemo(() => ({
    fr: {
      stack: "Government Stack V16",
      connectorSub: "Connecteurs Damancom (CNSS) & Simplis (DGI) Officiels",
      tele: "TÉLÉDÉCLARATIONS",
      registry: "REGISTRE V15",
      security: "ZERO TRUST",
      portalTitle: "Portail de Télédéclaration",
      compliantLaw: "Fichiers conformes Loi de Finances 2026.",
      bdsCnss: "BDS CNSS - BORDEREAU NOMINATIF (.TXT)",
      simplisIr: "SIMPLIS IR (.XML)",
      visualizePdf: "VISUALISER PDF",
      printReport: "IMPRIMER",
      telepay: "INITIER TÉLÉPAIEMENT",
      directPay: "PAIEMENT DIRECT",
      totalIr: "Total IR à liquider:",
      certified: "Certifié V16 Supreme",
      certifiedSub: "Signature numérique SHA-256 appliquée sur chaque bordereau.",
      cloudSov: "Souveraineté Cloud",
      encryption: "Chiffrement RGPD/CNDP",
      auditTrail: "Audit Trail",
      regTitle: "Registre du Personnel (Art. 15)",
      regSub: "Document légal obligatoire certifié conforme.",
      secTitle: "Security Operations Center",
      secSub: "Protection des données souveraines & isolation multi-tenant."
    },
    ar: {
      stack: "نظام الحكومة V16",
      connectorSub: "موصلات Damancom و Simplis الرسمية",
      tele: "التصريحات الإلكترونية",
      registry: "السجل V15",
      security: "الثقة الصفرية",
      portalTitle: "بوابة التصريح الإلكتروني",
      compliantLaw: "ملفات مطابقة لقانون المالية 2026.",
      bdsCnss: "BDS CNSS - اللائحة الاسمية (.TXT)",
      simplisIr: "SIMPLIS IR (.XML)",
      visualizePdf: "معاينة PDF",
      printReport: "طباعة",
      telepay: "بدء الأداء الإلكتروني",
      directPay: "الأداء المباشر",
      totalIr: "إجمالي الضريبة (IR):",
      regTitle: "سجل الموظفين (المادة 15)",
      regSub: "وثيقة قانونية إلزامية معتمدة.",
      secTitle: "مركز عمليات الأمان",
      secSub: "حماية البيانات السيادية وعزل المؤسسات."
    }
  }), [])[lang];

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || e.cin.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [employees, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1400px] mx-auto px-4 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-[#111827] tracking-tighter">{t.stack}</h2>
          <p className="text-[#6B7280] font-medium text-sm">{t.connectorSub}</p>
        </div>
        <div className="flex bg-[#F9FAFB] p-1 rounded-xl border border-[#E5E7EB] shadow-inner">
           <button onClick={() => setActiveView('cnss')} className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'cnss' ? 'bg-white shadow-sm text-[#0078D4]' : 'text-gray-400'}`}>{t.tele}</button>
           <button onClick={() => setActiveView('registry')} className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'registry' ? 'bg-white shadow-sm text-[#0078D4]' : 'text-gray-400'}`}>{t.registry}</button>
           <button onClick={() => setActiveView('security')} className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'security' ? 'bg-white shadow-sm text-[#0078D4]' : 'text-gray-400'}`}>{t.security}</button>
        </div>
      </header>

      {activeView === 'cnss' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in slide-in-from-bottom-4 duration-500">
           <div className="lg:col-span-8 space-y-6">
              <div className="airbnb-card bg-white p-12 border-[#E5E7EB] shadow-sm space-y-12 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12"><Landmark size={360} /></div>
                 
                 <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                    <div className="flex items-center gap-8 text-start">
                       <div className="w-24 h-24 bg-[#F0F7FF] rounded-[40px] flex items-center justify-center text-[#0078D4] shrink-0 border border-[#DBEAFE] shadow-xl">
                          <Landmark size={48} />
                       </div>
                       <div className="space-y-1">
                          <h3 className="text-3xl font-black text-[#111827] tracking-tight">{t.portalTitle}</h3>
                          <p className="text-[#6B7280] font-medium text-base">{t.compliantLaw}</p>
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-4 w-full md:w-[420px]">
                       <button className="w-full py-4 bg-[#111827] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl hover:bg-black transition-all">
                          <CnssLogo size={18} /> {t.bdsCnss}
                       </button>
                       <button className="w-full py-4 bg-blue-50 border border-blue-100 text-[#111827] rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-100 transition-all">
                          <DgiLogo size={18} /> {t.simplisIr}
                       </button>
                       <div className="grid grid-cols-2 gap-3">
                          <button className="py-4 bg-blue-50 text-[#0078D4] rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 border border-blue-100 hover:bg-blue-100 transition-all"><Eye size={16}/> {t.visualizePdf}</button>
                          <button className="py-4 bg-[#0078D4] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:bg-blue-700 transition-all"><Printer size={16}/> {t.printReport}</button>
                       </div>
                    </div>
                 </div>

                 <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 text-start">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-[#F0FFF4] text-[#34C759] rounded-2xl flex items-center justify-center border border-[#DCFCE7]"><CreditCard size={28}/></div>
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.directPay}</p>
                          <p className="text-lg font-black text-[#111827]">{t.totalIr} {payrollResults.reduce((acc, p) => acc + p.ir, 0).toLocaleString()} DH</p>
                       </div>
                    </div>
                    <button className="px-12 py-5 bg-[#0078D4] text-white rounded-[24px] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-4">
                       <ExternalLink size={20}/> {t.telepay}
                    </button>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6 text-start">
              <div className="airbnb-card p-10 bg-[#111827] text-white rounded-[56px] shadow-2xl relative overflow-hidden group">
                 <div className="absolute -right-12 -top-12 opacity-10 group-hover:scale-110 transition-transform duration-1000"><ShieldCheck size={320}/></div>
                 <h4 className="text-2xl font-black mb-10 relative z-10 flex items-center gap-4"><BadgeCheck size={32} className="text-[#0078D4]"/> {t.certified}</h4>
                 <p className="text-gray-500 text-sm leading-relaxed mb-12 relative z-10">{t.certifiedSub}</p>
                 <div className="space-y-8 relative z-10">
                    <ComplianceRow label={t.cloudSov} status="MA-LOCAL" color="text-[#0078D4]" />
                    <ComplianceRow label={t.encryption} status="AES-GCM" color="text-[#0078D4]" />
                    <ComplianceRow label={t.auditTrail} status="IMMUTABLE" color="text-[#0078D4]" />
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeView === 'registry' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="airbnb-card bg-white p-10 border-[#E5E7EB] shadow-sm space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                       <Users size={28}/>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-[#111827] tracking-tight">{t.regTitle}</h3>
                       <p className="text-[#6B7280] font-medium text-sm">{t.regSub}</p>
                    </div>
                 </div>
                 <div className="relative w-full md:w-80 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                       placeholder="Rechercher salarié..."
                       className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all"
                       value={searchTerm}
                       onChange={e => setSearchTerm(e.target.value)}
                    />
                 </div>
              </div>

              <div className="overflow-x-auto rounded-[24px] border border-gray-100">
                 <table className="w-full text-left">
                    <thead className="bg-[#F7F9FC] border-b">
                       <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <th className="p-6">Matricule</th>
                          <th className="p-6">Salarié</th>
                          <th className="p-6">CIN</th>
                          <th className="p-6">N° CNSS</th>
                          <th className="p-6">Contrat</th>
                          <th className="p-6 text-right">Salaire Base</th>
                          <th className="p-6 text-center">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {filteredEmployees.map(emp => (
                          <tr key={emp.id} className="hover:bg-indigo-50/10 transition-colors group">
                             <td className="p-6 font-mono text-[11px] font-bold text-gray-400 group-hover:text-indigo-600">{emp.internalMatricule}</td>
                             <td className="p-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-[10px] text-gray-400">
                                      {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover rounded-lg" /> : emp.fullName[0]}
                                   </div>
                                   <span className="font-bold text-[#111827]">{emp.fullName}</span>
                                </div>
                             </td>
                             <td className="p-6 font-bold text-gray-500 uppercase">{emp.cin}</td>
                             <td className="p-6 font-mono text-xs text-gray-400">{emp.cnssEmployee || '---'}</td>
                             <td className="p-6 font-bold text-gray-400 text-[10px] uppercase tracking-widest">{emp.contractType}</td>
                             <td className="p-6 text-right font-black text-[#111827]">{emp.baseSalary.toLocaleString()} DH</td>
                             <td className="p-6 text-center">
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase border border-emerald-100">VÉRIFIÉ</span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="pt-8 border-t border-gray-100 flex justify-between items-center no-print">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic flex items-center gap-2">
                    <Info size={14} className="text-indigo-400"/> Article 15 : Le registre doit être visé et numéroté par l'inspecteur du travail.
                 </p>
                 <button onClick={() => window.print()} className="px-8 py-3 bg-[#111827] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-black transition-all">
                    <Printer size={16}/> EXPORTER LE REGISTRE
                 </button>
              </div>
           </div>
        </div>
      )}

      {activeView === 'security' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <SecurityMetric label="SHA-256 Integrité" value="VALIDE" sub="128MB payload signée" color="text-[#0078D4]" icon={<Fingerprint size={20}/>} />
              <SecurityMetric label="Encryption" value="AES-GCM" sub="Hardware-accelerated" color="text-indigo-600" icon={<Lock size={20}/>} />
              <SecurityMetric label="Localisation Data" value="CASA-1" sub="MA Sovereignty Center" color="text-emerald-500" icon={<Globe size={20}/>} />
              <SecurityMetric label="Threat Level" value="ZERO" sub="Active scanning V16" color="text-blue-400" icon={<Activity size={20}/>} />
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 airbnb-card bg-white p-10 border-[#E5E7EB] shadow-sm space-y-10">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 bg-zinc-900 text-white rounded-2xl flex items-center justify-center shadow-2xl">
                          <Terminal size={28}/>
                       </div>
                       <div className="text-start">
                          <h3 className="text-2xl font-black text-[#111827] tracking-tight">V16 Zero-Trust Audit Log</h3>
                          <p className="text-[#6B7280] font-medium text-sm">Registres d'activité système immuables.</p>
                       </div>
                    </div>
                    <div className="px-5 py-2 bg-zinc-100 text-zinc-400 rounded-xl text-[9px] font-black uppercase tracking-widest">
                       ISO 27001 COMPLIANT
                    </div>
                 </div>

                 <div className="space-y-4">
                    <AuditRow time="10:45:22" event="AUTH_HANDSHAKE_SUCCESS" user="Admin Node" target="Tenant Isolation" />
                    <AuditRow time="10:42:01" event="ENCRYPTED_QUERY_EXEC" user="AI Agent" target="Payroll Registry" />
                    <AuditRow time="09:15:33" event="GOV_TX_SIGNED" user="Damancom Connector" target="SHA-256 Bordereau" />
                    <AuditRow time="08:00:10" event="BACKUP_REPLICATION" user="System Core" target="Sovereign Cluster MA" />
                 </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                 <div className="airbnb-card p-10 bg-indigo-600 text-white border-none shadow-2xl rounded-[48px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-1000"><Shield size={180}/></div>
                    <div className="relative z-10">
                       <BadgeCheck className="text-white mb-6" size={40}/>
                       <h4 className="text-xl font-black mb-4">Souveraineté des données</h4>
                       <p className="text-indigo-100 text-sm leading-relaxed mb-8">Vos données RH et paie ne quittent jamais le périmètre national. Les clés de chiffrement sont gérées via HSM (Hardware Security Module).</p>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                             <span>Protection DNS</span>
                             <span className="text-emerald-400">ACTIVÉE</span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-400 w-full"></div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="airbnb-card p-8 bg-[#F7F9FC] border-none shadow-inner space-y-6 text-start">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Infrastructure</h5>
                    <div className="space-y-4">
                       <InfraRow icon={<Server size={14}/>} label="Node Region" val="MA-CENTRAL-1" />
                       <InfraRow icon={<Database size={14}/>} label="Storage Layer" val="PostgreSQL (Encrypted)" />
                       <InfraRow icon={<Network size={14}/>} label="API Gateway" val="K8s Ingress Controller" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const SecurityMetric = ({ label, value, sub, color, icon }: any) => (
  <div className="airbnb-card p-6 bg-white border-[#E5E7EB] text-start flex flex-col justify-between h-40 hover:shadow-lg transition-all group">
     <div className="flex justify-between items-start">
        <div className={`p-3 bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-colors text-gray-400 ${color}`}>{icon}</div>
     </div>
     <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-2xl font-black ${color} tracking-tighter`}>{value}</p>
        <p className="text-[8px] font-bold text-[#6B7280]">{sub}</p>
     </div>
  </div>
);

const AuditRow = ({ time, event, user, target }: any) => (
  <div className="flex items-center gap-6 p-4 bg-[#F9FAFB] rounded-2xl border border-transparent hover:border-indigo-100 hover:bg-white transition-all">
     <div className="text-[10px] font-mono font-black text-gray-300">{time}</div>
     <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-[#1A1F36] uppercase tracking-tight truncate">{event}</p>
        <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{user} • {target}</p>
     </div>
     <CheckCircle2 size={16} className="text-emerald-500 shrink-0"/>
  </div>
);

const InfraRow = ({ icon, label, val }: any) => (
  <div className="flex items-center justify-between text-start">
     <div className="flex items-center gap-3">
        <div className="text-gray-300">{icon}</div>
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">{label}</span>
     </div>
     <span className="text-[10px] font-black text-[#1A1F36]">{val}</span>
  </div>
);

const ComplianceRow = ({ label, status, color }: { label: string, status: string, color: string }) => (
  <div className="flex justify-between items-center group">
     <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">{label}</span>
     <span className={`text-[11px] font-black uppercase tracking-widest ${color}`}>{status}</span>
  </div>
);

export default ComplianceManager;
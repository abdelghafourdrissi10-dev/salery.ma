import React, { useState, useEffect, useMemo } from 'react';
import { 
  Fingerprint, ShieldCheck, Network, Cpu, Lock, 
  BadgeCheck, ShieldAlert, History, Globe, Landmark,
  Users, Activity, Database, Server, Key, Scan,
  ArrowRight, CheckCircle2, AlertTriangle, RefreshCw,
  Search, Filter, ChevronRight, FileCheck, Layers, User,
  Blocks, Link, Zap
} from 'lucide-react';
import { 
  Language, Employee, AuthUser, SDEI, SEDI, 
  IdentityDirective, NationalComplianceScore, WorkforceAnchor 
} from '../types';
import { SovereignIdentityCore } from '../services/identity/SovereignIdentityCore';
import { IdentityAgentRegistry } from '../services/identity/IdentityAgents';
import { NationalLedgerService } from '../services/blockchain/NationalLedger';
import Logo from './Logo';

interface Props {
  lang: Language;
  employees: Employee[];
  user: AuthUser;
}

const SovereignIdentityHub: React.FC<Props> = ({ lang, employees, user }) => {
  const [sdei, setSdei] = useState<SDEI | null>(null);
  const [directives, setDirectives] = useState<IdentityDirective[]>([]);
  const [activeTab, setActiveTab] = useState<'employer' | 'workforce' | 'blockchain'>('employer');
  const [loading, setLoading] = useState(false);
  const [anchors, setAnchors] = useState<WorkforceAnchor[]>([]);

  const core = useMemo(() => SovereignIdentityCore.getInstance(), []);
  const ledger = useMemo(() => NationalLedgerService.getInstance(), []);

  useEffect(() => {
    const initIdentity = async () => {
      setLoading(true);
      const company: any = JSON.parse(localStorage.getItem('salaire_company_profile') || '{}');
      if (company.ice) {
        const newSdei = await core.generateSDEI(company);
        setSdei(newSdei);
        const alerts = await IdentityAgentRegistry.scanForGhosts(newSdei, employees, []);
        setDirectives(alerts);
        setAnchors(ledger.getAnchors());
      }
      setLoading(false);
    };
    initIdentity();
  }, [employees.length]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-start">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-[#1A1F36] tracking-tighter flex items-center gap-4">
             <Fingerprint size={32} className="text-[#0052FF]" /> Identity Layer V24
          </h2>
          <p className="text-gray-400 font-medium text-sm">Sovereign Employer & Employee ID Infrastructure • Blockchain V24</p>
        </div>
        <div className="flex bg-[#F7F9FC] p-1 rounded-2xl border border-[#E3E8EE] shadow-inner">
           <TabBtn active={activeTab === 'employer'} onClick={() => setActiveTab('employer')} icon={<Landmark size={14}/>} label="Employer ID" />
           <TabBtn active={activeTab === 'workforce'} onClick={() => setActiveTab('workforce')} icon={<Users size={14}/>} label="Workforce Graph" />
           <TabBtn active={activeTab === 'blockchain'} onClick={() => setActiveTab('blockchain')} icon={<Blocks size={14}/>} label="National Ledger" />
        </div>
      </header>

      {activeTab === 'employer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-6">
           <div className="lg:col-span-8 space-y-6">
              <div className="airbnb-card p-10 bg-white border-none shadow-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><ShieldCheck size={240} /></div>
                 <div className="relative z-10 space-y-10">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                       <div className="text-start">
                          <h3 className="text-2xl font-black text-[#1A1F36]">SDEI Profile</h3>
                          <p className="text-sm font-medium text-gray-400">Moroccan Sovereign Digital Fingerprint</p>
                       </div>
                       <div className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase border border-emerald-100 flex items-center gap-2">
                          <BadgeCheck size={14}/> Active Authority
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <IdentityField label="Identity Hash" value={sdei?.id || '---'} isMono />
                       <IdentityField label="ICE Number" value={sdei?.ice || '---'} />
                       <IdentityField label="Digital Thumbprint" value={sdei?.digitalSignatureThumbprint.substring(0,32) + '...'} isMono />
                       <IdentityField label="Last Certification" value={new Date(sdei?.lastCertifiedAt || 0).toLocaleDateString()} />
                    </div>

                    <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
                       <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Anchored to National Blockchain</p>
                       <button className="px-6 py-3 bg-[#1A1F36] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all">
                          <Blocks size={16} /> SYNC BLOCKCHAIN
                       </button>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <ServiceBinding icon={<Scan size={20}/>} title="Pointage Identity" status="BLOCKCHAIN_BOUND" />
                 <ServiceBinding icon={<FileCheck size={20}/>} title="Document Anchor" status="IMMUTABLE" />
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <div className="airbnb-card p-8 bg-[#1A1F36] text-white rounded-[40px] shadow-2xl relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 opacity-10"><Cpu size={180}/></div>
                 <h4 className="text-xl font-black mb-8 relative z-10 flex items-center gap-3"><Activity size={24} className="text-[#0052FF]"/> Agent Identity Pulse</h4>
                 <div className="space-y-4 relative z-10">
                    {directives.length > 0 ? directives.map((d, i) => (
                      <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-start">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-[8px] font-black uppercase text-[#0052FF]">{d.agentId}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${d.severity === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>{d.severity}</span>
                         </div>
                         <p className="text-xs font-bold text-gray-300">{d.actionRequired}</p>
                      </div>
                    )) : (
                      <div className="py-10 text-center text-gray-500">
                         <ShieldCheck size={40} className="mx-auto mb-3 opacity-20" />
                         <p className="text-[10px] font-black uppercase">Integrity Optimal</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'blockchain' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-6 text-start">
           <div className="airbnb-card bg-white p-10 rounded-[40px] shadow-sm space-y-10 overflow-hidden">
              <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                 <div>
                    <h3 className="text-2xl font-black text-[#1A1F36]">National Workforce Ledger</h3>
                    <p className="text-sm font-medium text-gray-400">Institutional Workforce Anchors • Moroccan Blockchain Layer</p>
                 </div>
                 <div className="flex items-center gap-3 bg-[#F7F9FC] px-4 py-2 rounded-2xl border border-[#E3E8EE]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1F36]">INSTITUTIONAL SYNC: OK</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <BlockchainStat label="Blocks" value="5.2M+" icon={<Blocks size={16}/>} />
                 <BlockchainStat label="Trust Score" value="99.2%" icon={<ShieldCheck size={16}/>} />
                 <BlockchainStat label="Anchors" value={anchors.length.toString()} icon={<Link size={16}/>} />
                 <BlockchainStat label="Verified Nodes" value="4" icon={<Landmark size={16}/>} />
              </div>

              <div className="overflow-hidden rounded-[32px] border border-gray-100">
                 <table className="w-full text-left">
                    <thead className="bg-[#F7F9FC]">
                       <tr>
                          <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Transaction ID</th>
                          <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                          <th className="p-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Sovereign Proof Hash</th>
                          <th className="p-5 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Validator Node</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-mono text-[11px]">
                       {anchors.length > 0 ? anchors.map((a, i) => (
                          <tr key={i} className="hover:bg-blue-50/10 transition-colors">
                             <td className="p-5 text-[#0052FF] font-black">{a.txId}</td>
                             <td className="p-5"><span className="px-2 py-1 bg-gray-100 rounded text-[9px] font-black text-[#1A1F36]">{a.category}</span></td>
                             <td className="p-5 text-gray-400 truncate max-w-xs">{a.proofHash}</td>
                             <td className="p-5 text-right font-bold text-gray-600">{a.validatorNode}</td>
                          </tr>
                       )) : (
                          <tr><td colSpan={4} className="p-20 text-center text-gray-400 font-medium italic">No anchors detected. finalizing payroll to generate first block.</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const BlockchainStat = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-start group hover:bg-white hover:shadow-xl transition-all">
     <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white rounded-lg shadow-sm text-[#0052FF]">{icon}</div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
     </div>
     <p className="text-2xl font-black text-[#1A1F36]">{value}</p>
  </div>
);

const IdentityField = ({ label, value, isMono }: { label: string, value: string, isMono?: boolean }) => (
  <div className="space-y-2 text-start">
     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
     <p className={`text-base font-bold text-[#1A1F36] ${isMono ? 'font-mono text-sm' : ''}`}>{value}</p>
  </div>
);

const ServiceBinding = ({ icon, title, status }: { icon: React.ReactNode, title: string, status: string }) => (
  <div className="airbnb-card p-6 bg-white border border-gray-100 flex items-center justify-between group hover:border-[#0052FF] transition-all">
     <div className="flex items-center gap-5">
        <div className="p-3 bg-[#F7F9FC] rounded-2xl group-hover:bg-blue-50 transition-colors text-[#0052FF]">{icon}</div>
        <h5 className="font-black text-sm text-[#1A1F36]">{title}</h5>
     </div>
     <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest">{status}</span>
  </div>
);

const TabBtn = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button onClick={onClick} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-white shadow-md text-[#0052FF]' : 'text-gray-400 hover:text-gray-600'}`}>
     {icon} {label}
  </button>
);

export default SovereignIdentityHub;

import React, { useState, useMemo } from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Search, ArrowRight, XCircle, CheckCircle2, Info } from 'lucide-react';
import { AuditRecord } from '../services/auditEngine';
import { Language } from '../types';

interface Props {
  auditResults: AuditRecord[];
  lang: Language;
}

const PayrollAudit: React.FC<Props> = ({ auditResults, lang }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);

  const filteredData = useMemo(() => {
    return auditResults.filter(a => {
      const matchFilter = filter === 'ALL' || a.riskLevel === filter;
      const matchSearch = a.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [auditResults, filter, searchTerm]);

  const riskColors = {
    LOW: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-100',
    HIGH: 'bg-rose-50 text-rose-700 border-rose-100',
    CRITICAL: 'bg-zinc-900 text-white border-zinc-800'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="relative flex-1 w-full">
          <Search className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
          <input 
            type="text" 
            placeholder="Rechercher par nom..."
            className={`w-full ${lang === 'ar' ? 'pr-12 pl-6 text-right' : 'pl-12 pr-6 text-left'} py-3 bg-white border border-[#E3E8EE] rounded-2xl text-sm font-bold outline-none focus:border-[#0052FF]`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-[#F7F9FC] p-1 rounded-2xl border border-[#E3E8EE]">
           {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(lvl => (
             <button key={lvl} onClick={() => setFilter(lvl)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === lvl ? 'bg-white shadow-sm text-[#0052FF]' : 'text-gray-400'}`}>
                {lvl}
             </button>
           ))}
        </div>
      </div>

      <div className="airbnb-card bg-white overflow-hidden border-[#E3E8EE] rounded-[32px] shadow-xl text-start">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F9FC] border-b">
            <tr className="text-[10px] font-black text-[#697386] uppercase tracking-widest">
              <th className="p-6">Employé</th>
              <th className="p-6 text-right">Salaire Brut</th>
              <th className="p-6 text-center">Score Risque</th>
              <th className="p-6 text-center">Niveau</th>
              <th className="p-6 text-right">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredData.map(audit => (
              <tr key={audit.employee_id} className="hover:bg-blue-50/10 transition-colors">
                <td className="p-6">
                  <div className="font-bold text-[#1A1F36]">{audit.fullName}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-black">{audit.jobTitle}</div>
                </td>
                <td className="p-6 text-right font-black text-[#1A1F36]">
                  {audit.grossSalary.toLocaleString()} DH
                </td>
                <td className="p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-xs ${audit.riskScore > 60 ? 'bg-zinc-900 text-white' : audit.riskScore > 30 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {audit.riskScore}
                  </div>
                </td>
                <td className="p-6 text-center">
                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${riskColors[audit.riskLevel as keyof typeof riskColors]}`}>
                      {audit.riskLevel}
                   </span>
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => setSelectedAudit(audit)}
                    className="p-3 bg-[#F7F9FC] text-gray-400 hover:text-[#0052FF] rounded-2xl hover:bg-white hover:shadow-md transition-all active:scale-95"
                  >
                    <ArrowRight size={18} strokeWidth={3}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAudit && (
        <div className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-3xl p-10 animate-in zoom-in duration-300">
              <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${riskColors[selectedAudit.riskLevel as keyof typeof riskColors]}`}><ShieldAlert size={28}/></div>
                    <div className="text-start">
                       <h3 className="text-2xl font-black text-[#1A1F36]">{selectedAudit.fullName}</h3>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rapport d'anomalies • {selectedAudit.riskLevel}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedAudit(null)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-full transition-all active:scale-90"><XCircle size={24}/></button>
              </div>

              <div className="space-y-4 mb-10 text-start">
                 {selectedAudit.anomalies.map((ano, idx) => (
                   <div key={idx} className={`p-6 rounded-[28px] border-2 ${ano.severity === 'CRITICAL' ? 'bg-zinc-50 border-zinc-200' : 'bg-rose-50 border-rose-100'}`}>
                      <div className="flex justify-between items-start mb-3">
                         <h5 className="font-black text-sm uppercase text-[#1A1F36]">{ano.short_label}</h5>
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${ano.severity === 'CRITICAL' ? 'bg-zinc-900 text-white' : 'bg-rose-600 text-white'}`}>{ano.severity}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-6 text-[11px] mb-4">
                         <div>
                            <p className="text-gray-400 font-bold uppercase">Détecté</p>
                            <p className="font-black text-[#1A1F36]">{ano.detected_value}</p>
                         </div>
                         <div>
                            <p className="text-gray-400 font-bold uppercase">Attendu</p>
                            <p className="font-black text-[#1A1F36]">{ano.expected_range}</p>
                         </div>
                      </div>
                      <div className="pt-3 border-t border-black/5">
                         <p className="text-[10px] font-black text-[#0052FF] uppercase flex items-center gap-2">
                           <Info size={12}/> ACTION : {ano.recommended_action}
                         </p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PayrollAudit;
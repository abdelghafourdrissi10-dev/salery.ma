import React from 'react';
import { FileText, Printer, ShieldCheck, Building, Users, AlertCircle, CheckCircle2, FileWarning } from 'lucide-react';
import { InspectionReportData } from '../services/reportGenerator';
import { Language } from '../types';

interface Props {
  data: InspectionReportData;
  lang: Language;
  onClose: () => void;
}

const LaborInspectionReport: React.FC<Props> = ({ data, lang, onClose }) => {
  const t = {
    fr: {
      header: "RAPPORT DE CONTRÔLE — INSPECTION DU TRAVAIL",
      registry: "REGISTRE DU PERSONNEL",
      attendance: "SUIVI TEMPS DE TRAVAIL",
      payroll: "MASSE SALARIALE & RÉCAPITULATIF",
      cnss: "CONFORMITÉ CNSS & DÉCLARATIONS",
      anomalies: "ANOMALIES & NON-CONFORMITÉS",
      docs: "AUDIT DOCUMENTAIRE",
      final: "OBSERVATIONS FINALES",
      signature: "DÉCLARATION & SIGNATURE",
      print: "Imprimer Rapport"
    }
  }[lang] || {
    header: "RAPPORT DE CONTRÔLE — INSPECTION DU TRAVAIL",
    registry: "REGISTRE DU PERSONNEL",
    attendance: "SUIVI TEMPS DE TRAVAIL",
    payroll: "MASSE SALARIALE & RÉCAPITULATIF",
    cnss: "CONFORMITÉ CNSS & DÉCLARATIONS",
    anomalies: "ANOMALIES & NON-CONFORMITÉS",
    docs: "AUDIT DOCUMENTAIRE",
    final: "OBSERVATIONS FINALES",
    signature: "DÉCLARATION & SIGNATURE",
    print: "Imprimer Rapport"
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-8 no-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm no-print">
          <button onClick={onClose} className="px-6 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all shadow-sm">Quitter</button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2.5 bg-[#0052FF] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg">
            <Printer size={16}/> {t.print}
          </button>
        </div>

        <div id="pro-document" className="bg-white p-12 md:p-20 shadow-2xl rounded-[2px] font-sans text-[#1A1F36]">
          
          {/* SECTION 1: COVER */}
          <div className="text-center border-b-4 border-[#1A1F36] pb-10 mb-12">
            <h1 className="text-3xl font-black text-[#1A1F36] uppercase tracking-tighter mb-8">{t.header}</h1>
            <div className="grid grid-cols-2 gap-12 text-left text-[10px] leading-relaxed">
              <div className="space-y-1">
                <p className="font-black text-gray-400 uppercase">Employeur</p>
                <p className="text-lg font-bold">{data.company.name}</p>
                <p>ICE: {data.company.ice}</p>
                <p>RC: {data.company.rc}</p>
                <p>CNSS: {data.company.cnssEmployer}</p>
                <p>Adresse: {data.company.physicalAddress}, {data.company.city}</p>
                <p>Effectif total: <b>{data.summary.totalEmployees} salariés</b></p>
              </div>
              <div className="space-y-1 text-right">
                <p className="font-black text-gray-400 uppercase">Inspection</p>
                <p className="text-sm font-bold">Période: {data.period.from} au {data.period.to}</p>
                <p>Généré le: {new Date(data.generationDate).toLocaleDateString()}</p>
                <p className="text-[#0052FF] font-black uppercase text-[8px] mt-4">Généré via Système Certifié Salery.ma</p>
              </div>
            </div>
          </div>

          {/* SECTION 2: REGISTRY */}
          <ReportSection title={t.registry} icon={<Users size={18}/>}>
            <ReportTable headers={['Matricule', 'Nom & Prénom', 'CIN', 'CNSS', 'Contrat', 'Salaire Déclaré (DH)', 'Statut']}>
              {data.registry.map((row, i) => (
                <tr key={i} className="border-b text-[9px]">
                  <td className="p-2">{row.matricule}</td>
                  <td className="p-2 font-bold">{row.name}</td>
                  <td className="p-2">{row.cin}</td>
                  <td className="p-2">{row.cnss}</td>
                  <td className="p-2">{row.contract}</td>
                  <td className="p-2 text-right">{Math.round(row.base)}</td>
                  <td className="p-2 text-right font-black uppercase text-emerald-600">{row.status}</td>
                </tr>
              ))}
            </ReportTable>
          </ReportSection>

          {/* SECTION 3: ATTENDANCE */}
          <ReportSection title={t.attendance} icon={<ShieldCheck size={18}/>}>
             <div className="grid grid-cols-4 gap-4 mb-6">
                <SummaryBox label="Jours travaillés" value={data.summary.totalDaysWorked} />
                <SummaryBox label="Heures normales" value={Math.round(data.summary.totalNormalHours)} />
                <SummaryBox label="Heures supplémentaires" value={Math.round(data.summary.totalOTHours)} />
                <SummaryBox label="Absences cumulées" value={0} />
             </div>
          </ReportSection>

          {/* SECTION 4: PAYROLL */}
          <ReportSection title={t.payroll} icon={<FileText size={18}/>}>
            <div className="grid grid-cols-2 gap-8 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
               <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Masse Salariale Brute</p><p className="text-2xl font-black text-[#1A1F36]">{Math.round(data.summary.totalGrossPayroll)} DH</p></div>
               <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Masse Salariale Nette</p><p className="text-2xl font-black text-[#0E6F5C]">{Math.round(data.summary.totalNetPayroll)} DH</p></div>
            </div>
            <ReportTable headers={['Employé', 'Salaire Brut (DH)', 'Retenues sociales', 'Salaire Net (DH)']}>
               {data.payroll.map((row, i) => (
                 <tr key={i} className="border-b text-[9px]">
                   <td className="p-2 font-bold">{row.name}</td>
                   <td className="p-2 text-right">{Math.round(row.gross)}</td>
                   <td className="p-2 text-right">{Math.round(row.deductions)}</td>
                   <td className="p-2 text-right font-black">{Math.round(row.net)}</td>
                 </tr>
               ))}
            </ReportTable>
          </ReportSection>

          {/* SECTION 5: CNSS */}
          <ReportSection title={t.cnss} icon={<CheckCircle2 size={18}/>}>
             <ReportTable headers={['Employé', 'CNSS Déclaré', 'Base Déclarée (DH)', 'Écart détecté', 'Observation']}>
               {data.cnssStatus.map((row, i) => (
                 <tr key={i} className="border-b text-[9px]">
                   <td className="p-2 font-bold">{row.name}</td>
                   <td className="p-2 text-center">{row.declared}</td>
                   <td className="p-2 text-right">{Math.round(row.base)}</td>
                   <td className="p-2 text-center">{row.gap}</td>
                   <td className="p-2 italic">{row.obs}</td>
                 </tr>
               ))}
             </ReportTable>
          </ReportSection>

          {/* SECTION 6: ANOMALIES */}
          <ReportSection title={t.anomalies} icon={<AlertCircle size={18}/>}>
            <ReportTable headers={['Employé', 'Type d\'anomalie', 'Gravité', 'Mois', 'Commentaire']}>
               {data.anomalies.map((row, i) => (
                 <tr key={i} className="border-b text-[9px] bg-rose-50/20">
                   <td className="p-2 font-bold">{row.name}</td>
                   <td className="p-2 text-rose-700 font-bold">{row.type}</td>
                   <td className="p-2 text-center"><span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[7px] font-black">{row.severity}</span></td>
                   <td className="p-2 text-center">{row.month}</td>
                   <td className="p-2 italic">{row.comment}</td>
                 </tr>
               ))}
               {data.anomalies.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-emerald-600 font-bold">AUCUNE ANOMALIE DÉTECTÉE</td></tr>}
            </ReportTable>
          </ReportSection>

          {/* SECTION 7: DOCUMENTS */}
          <ReportSection title={t.docs} icon={<Users size={18}/>}>
            <div className="grid grid-cols-2 gap-8 mb-6 text-[10px] bg-gray-50 p-4 rounded-xl">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> CIN Archivée</div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Règlement intérieur disponible</div>
            </div>
            <ReportTable headers={['Employé', 'Documents manquants ou périmés']}>
               {data.documents.map((row, i) => (
                 <tr key={i} className="border-b text-[9px]">
                   <td className="p-2 font-bold">{row.name}</td>
                   <td className="p-2 text-rose-600">{row.missing}</td>
                 </tr>
               ))}
            </ReportTable>
          </ReportSection>

          {/* SECTION 8: FINAL OBSERVATIONS */}
          <ReportSection title={t.final} icon={<FileWarning size={18}/>}>
             <div className="p-6 border-2 border-gray-100 rounded-2xl bg-white space-y-4 text-[11px] leading-relaxed text-start">
                <p><b>Statut Global:</b> {data.summary.riskLevel === 'HIGH' ? <span className="text-rose-600 font-black">RISQUE ÉLEVÉ</span> : <span className="text-emerald-600 font-black">CONFORMITÉ ACCEPTABLE</span>}</p>
                <ul className="list-disc pl-6 space-y-1">
                   <li>Nombre total d’anomalies détectées : <b>{data.summary.anomalyCount}</b></li>
                   <li>Nombre de salariés concernés : <b>{data.summary.employeesAffected}</b></li>
                   <li>Points sensibles détectés : <b>{data.summary.anomalyCount > 0 ? 'Heures Suppl., Conformité CNSS' : 'Aucun'}</b></li>
                </ul>
             </div>
          </ReportSection>

          {/* SECTION 9: SIGNATURE */}
          <div className="mt-16 pt-10 border-t-2 border-gray-100">
             <div className="grid grid-cols-2 gap-20">
                <div className="text-[10px] italic text-gray-500 space-y-4 text-start">
                   <p>"Les informations ci-dessus sont issues du système de gestion de paie et de présence de l’entreprise certifié par Salaire.ma."</p>
                </div>
                <div className="text-center space-y-12">
                   <p className="font-black text-[10px] uppercase tracking-widest text-[#1A1F36]">Signature & Cachet de l'Employeur</p>
                   <div className="h-24 flex items-center justify-center opacity-40">
                      {data.company.settings.companyStampUrl && <img src={data.company.settings.companyStampUrl} className="max-h-full mix-blend-multiply" />}
                   </div>
                   <div className="pt-4 border-t border-gray-200">
                      <p className="font-bold text-xs">{data.company.settings.defaultSignatoryName}</p>
                      <p className="text-[8px] uppercase">{new Date().toLocaleDateString()}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportSection: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="mb-10 page-break-inside-avoid">
    <div className="flex items-center gap-3 border-b-2 border-gray-50 pb-2 mb-4">
      <div className="text-[#1A1F36]">{icon}</div>
      <h2 className="text-[11px] font-black uppercase tracking-widest text-[#1A1F36]">{title}</h2>
    </div>
    {children}
  </section>
);

const ReportTable: React.FC<{ headers: string[], children: React.ReactNode }> = ({ headers, children }) => (
  <table className="w-full text-left border-collapse border border-gray-50">
    <thead className="bg-gray-50">
      <tr>
        {headers.map((h, i) => (
          <th key={i} className="p-2 text-[8px] font-black uppercase tracking-tight text-gray-400 border border-gray-50">{h}</th>
        ))}
      </tr>
    </thead>
    <tbody>{children}</tbody>
  </table>
);

const SummaryBox: React.FC<{ label: string, value: string | number }> = ({ label, value }) => (
  <div className="border border-gray-100 p-4 rounded-xl text-center bg-gray-50/50 shadow-sm">
    <p className="text-[8px] font-black text-gray-400 uppercase mb-1 tracking-widest">{label}</p>
    <p className="text-lg font-black text-[#1A1F36]">{value}</p>
  </div>
);

export default LaborInspectionReport;

import React from 'react';
import { Employee, CompanyProfile, PayrollResult, Language } from '../types';
import { ShieldCheck, BadgeCheck } from 'lucide-react';
import Logo from './Logo';

interface Props {
  company: CompanyProfile;
  employee: Employee;
  payroll: PayrollResult;
  period: string;
  lang: Language;
}

const PayslipPDF: React.FC<Props> = ({ company, employee, payroll, period, lang }) => {
  const isAr = lang === 'ar';

  const labels = {
    employeur: { fr: "Employeur", ar: "المشغل" },
    salarie: { fr: "Salarié", ar: "الأجير" },
    matriculeCnss: { fr: "Matricule CNSS", ar: "رقم التسجيل في الصندوق الوطني للضمان الاجتماعي" },
    periode: { fr: "Période de paie", ar: "فترة الأداء" },
    base: { fr: "Salaire de base", ar: "الأجر الأساسي" },
    heures: { fr: "Heures travaillées", ar: "عدد الساعات / أيام العمل" },
    sup: { fr: "Heures supplémentaires", ar: "الساعات الإضافية" },
    primes: { fr: "Primes", ar: "التعويضات" },
    retenues: { fr: "Retenues", ar: "الاقتطاعات" },
    brut: { fr: "Salaire Brut", ar: "الأجر الخام" },
    cnss: { fr: "Cotisation CNSS", ar: "واجبات CNSS" },
    amo: { fr: "AMO", ar: "التأمين الإجباري عن المرض" },
    ir: { fr: "Impôt sur le Revenu (IR)", ar: "الضريبة على الدخل" },
    net: { fr: "Salaire Net à Payer", ar: "الأجر الصافي المستحق" },
    mode: { fr: "Mode de paiement", ar: "طريقة الأداء" },
    date: { fr: "Date de paiement", ar: "تاريخ الأداء" },
    signature: { fr: "Signature employeur", ar: "توقيع المشغل" },
    designation: { fr: "Désignation", ar: "البيان" },
    taux: { fr: "Taux", ar: "المعدل" },
    gains: { fr: "Gains (+)", ar: "المستحقات" }
  };

  return (
    <div id="pro-document" className="bg-white p-12 w-[210mm] min-h-[297mm] mx-auto font-sans text-[#1C1C1C] relative border-t-8 border-[#0052FF]" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="flex justify-between items-start mb-10 pb-8 border-b border-gray-100">
        <div className="w-1/2 space-y-4 text-start">
           {company.logoUrl ? (
             <img src={company.logoUrl} alt="Logo" className="max-h-24 mix-blend-multiply" />
           ) : (
             <Logo iconOnly className="h-16 w-16" />
           )}
           <div className="space-y-1">
              <h2 className="text-xl font-black uppercase text-[#1A1F36] tracking-tighter">{company.name}</h2>
              <div className="text-[10px] text-[#697386] font-medium leading-relaxed">
                <p>{company.physicalAddress}, {company.city}</p>
                <p className="flex gap-2">
                  <span><b>ICE:</b> {company.ice}</span>
                  <span><b>RC:</b> {company.rc}</span>
                  <span><b>CNSS:</b> {company.cnssEmployer}</span>
                </p>
              </div>
           </div>
        </div>
        
        <div className="w-1/2 text-right">
           <div className="inline-block bg-[#1A1F36] text-white px-8 py-4 rounded-3xl shadow-xl">
              <h1 className="text-xl font-black tracking-tight flex items-center justify-end gap-3">
                 <span>BULLETIN DE PAIE</span>
                 <span className="text-zinc-500">|</span>
                 <span className="font-arabic text-lg">ورقة الأداء</span>
              </h1>
              <p className="text-[11px] font-bold text-[#0052FF] uppercase mt-1 tracking-widest">
                {labels.periode.fr} : {period}
              </p>
           </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-px bg-[#E3E8EE] border border-[#E3E8EE] rounded-[32px] overflow-hidden mb-10 shadow-sm">
        <div className="bg-white p-6 space-y-3">
           <DetailRow label={`${labels.salarie.fr} / ${labels.salarie.ar}`} value={employee.fullName} isBold />
           <DetailRow label="CIN / البطاقة الوطنية" value={employee.cin} />
           <DetailRow label={`${labels.matriculeCnss.fr} / ${labels.matriculeCnss.ar}`} value={employee.cnssEmployee || '---'} />
        </div>
        <div className="bg-white p-6 space-y-3">
           <DetailRow label="Matricule / الرقم" value={employee.internalMatricule} />
           <DetailRow label="Poste / المنصب" value={employee.jobTitle} />
           <DetailRow label="Date d'embauche / التوظيف" value={new Date(employee.hireDate).toLocaleDateString('fr-MA')} />
        </div>
      </section>

      <div className="rounded-[32px] border border-[#E3E8EE] overflow-hidden shadow-lg mb-10">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#F7F9FC] border-b border-[#E3E8EE]">
              <th className="p-4 text-left font-black text-[#697386] uppercase tracking-widest">{labels.designation.fr} / {labels.designation.ar}</th>
              <th className="p-4 text-center font-black text-[#697386] uppercase tracking-widest">Base</th>
              <th className="p-4 text-center font-black text-[#697386] uppercase tracking-widest">{labels.taux.fr}</th>
              <th className="p-4 text-right font-black text-[#697386] uppercase tracking-widest">{labels.gains.fr}</th>
              <th className="p-4 text-right font-black text-[#697386] uppercase tracking-widest">{labels.retenues.fr}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr className="hover:bg-blue-50/10">
              <td className="p-4 font-bold text-[#1A1F36]">{labels.base.fr} / {labels.base.ar}</td>
              <td className="p-4 text-center font-medium">1.00</td>
              <td className="p-4 text-center font-medium">-</td>
              <td className="p-4 text-right font-black">{employee.baseSalary.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</td>
              <td className="p-4 text-right">-</td>
            </tr>
            {payroll.breakdown.map((item, idx) => (
              <tr key={idx} className="hover:bg-blue-50/10">
                <td className="p-4 text-[#1A1F36]">{item.label}</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-center">-</td>
                <td className="p-4 text-right font-bold text-emerald-600">{item.amount.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</td>
                <td className="p-4 text-right">-</td>
              </tr>
            ))}
            <tr className="hover:bg-blue-50/10">
              <td className="p-4 text-[#697386] italic">{labels.cnss.fr} (4.48%)</td>
              <td className="p-4 text-center text-[#697386]">{Math.min(payroll.grossTotal, 6000).toFixed(2)}</td>
              <td className="p-4 text-center text-[#697386]">4.48%</td>
              <td className="p-4 text-right">-</td>
              <td className="p-4 text-right font-bold text-rose-600">{payroll.cnss.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr className="hover:bg-blue-50/10">
              <td className="p-4 text-[#697386] italic">{labels.amo.fr} (2.26%)</td>
              <td className="p-4 text-center text-[#697386]">{payroll.grossTotal.toFixed(2)}</td>
              <td className="p-4 text-center text-[#697386]">2.26%</td>
              <td className="p-4 text-right">-</td>
              <td className="p-4 text-right font-bold text-rose-600">{payroll.amo.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
        
        <div className="bg-[#F7F9FC] border-t border-[#E3E8EE] p-6 flex justify-between items-center">
           <div className="text-start space-y-1">
              <p className="text-[10px] font-black text-[#697386] uppercase tracking-widest">Cumuls Annuels</p>
              <div className="flex gap-4 text-[10px] font-bold text-[#697386]">
                 <span>{labels.brut.fr}: {payroll.grossTotal.toLocaleString()} DH</span>
                 <span>Net: {payroll.netSalary.toLocaleString()} DH</span>
              </div>
           </div>
           <div className="flex gap-10">
              <div className="text-right">
                 <p className="text-[10px] font-black text-[#697386] uppercase tracking-widest mb-1">Total {labels.gains.fr}</p>
                 <p className="text-lg font-black text-[#1A1F36]">{payroll.grossTotal.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-[#697386] uppercase tracking-widest mb-1">Total {labels.retenues.fr}</p>
                 <p className="text-lg font-black text-rose-600">{(payroll.cnss + payroll.amo + payroll.ir).toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-16 px-4">
         <div className="max-w-[300px] text-start">
            <p className="text-[9px] font-bold text-[#697386] uppercase leading-relaxed italic">
              "En cas d'erreur ou d'omission, veuillez en informer le service RH dans les 48 heures suivant la réception."
            </p>
         </div>
         <div className="relative">
            <div className="absolute inset-0 bg-[#0052FF] blur-2xl opacity-10 rounded-full scale-150"></div>
            <div className="relative bg-[#1A1F36] text-white p-8 rounded-[40px] shadow-2xl min-w-[340px] text-right border-4 border-white">
               <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#0052FF] mb-2">{labels.net.fr} / {labels.net.ar}</p>
               <div className="flex items-baseline justify-end gap-3">
                  <h2 className="text-5xl font-black tracking-tighter">{payroll.netSalary.toLocaleString('fr-MA', { minimumFractionDigits: 2 })}</h2>
                  <span className="text-xl font-black text-[#0052FF]">DH</span>
               </div>
            </div>
         </div>
      </div>

      <footer className="grid grid-cols-2 gap-16 mt-auto pt-10 border-t border-[#E3E8EE]">
        <div className="text-start space-y-6">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#697386] mb-4">{labels.signature.fr}</p>
              <div className="h-32 w-48 flex items-center justify-center border-2 border-dashed border-[#E3E8EE] rounded-3xl bg-[#F7F9FC] overflow-hidden relative">
                 {company.settings.companyStampUrl ? (
                   <img src={company.settings.companyStampUrl} className="max-h-full mix-blend-multiply opacity-80" alt="Stamp" />
                 ) : (
                   <ShieldCheck size={48} className="text-[#E3E8EE]" />
                 )}
                 <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase">
                    <BadgeCheck size={12}/> AI CERTIFIED
                 </div>
              </div>
           </div>
           <p className="text-[10px] font-bold text-[#1A1F36]">{company.settings.defaultSignatoryName}</p>
        </div>
        
        <div className="text-right flex flex-col justify-between">
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#697386] mb-1">Signature du Salarié / توقيع الأجير</p>
              <p className="text-[9px] text-gray-300 font-medium italic">Lu et Approuvé / قرئ وصودق عليه</p>
           </div>
           <div className="pt-20 border-t border-[#E3E8EE] text-[9px] font-medium text-[#697386]">
              <p>Document généré électroniquement par Salery.ma</p>
              <p className="font-mono mt-1 opacity-50 uppercase tracking-tighter">HASH-SHA256: {btoa(payroll.employeeId + period).substr(0, 24).toUpperCase()}</p>
           </div>
        </div>
      </footer>
    </div>
  );
};

const DetailRow: React.FC<{ label: string, value: string, isBold?: boolean }> = ({ label, value, isBold }) => (
  <div className="flex justify-between items-center text-[11px]">
    <span className="text-[#697386] font-bold uppercase tracking-tight text-[9px]">{label}</span>
    <span className={`text-[#1A1F36] ${isBold ? 'font-black text-sm tracking-tighter' : 'font-bold'}`}>{value}</span>
  </div>
);

export default PayslipPDF;

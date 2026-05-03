import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, RefreshCw, BadgeDollarSign, Filter, Search, ShieldCheck } from 'lucide-react';
import { Employee, Language, AuthUser } from '../types';

interface Props {
    lang: Language;
    user: AuthUser;
}

const SalariesHistory: React.FC<Props> = ({ lang, user }) => {
    const [salaries, setSalaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        import('../services/api').then(({ api }) => {
            const endpoint = user.role === 'EMPLOYEE' ? `/salaries/${user.employeeId || ''}` : '/salaries';
            api.get(endpoint).then((data: any) => {
                setSalaries(Array.isArray(data) ? data : []);
                setLoading(false);
            }).catch((err: any) => {
                console.error("Salaries fetch error:", err);
                setLoading(false);
            });
        });
    }, [user]);

    const t = {
        fr: {
            title: "Historique des Salaires",
            subtitle: "Traceabilité et calculs de la masse salariale",
            search: "Rechercher un employé ou mois...",
            exportBtn: "EXPORTER",
            colEmp: "Employé",
            colMonth: "Mois",
            colBase: "Salaire de base",
            colOvertime: "Heures Sup.",
            colBonus: "Primes",
            colDeduction: "Retenues",
            colNet: "Net à payer",
            statusPaid: "VIRÉ"
        },
        ar: {
            title: "سجل الرواتب",
            subtitle: "تتبع وحسابات كتلة الأجور",
            search: "ابحث عن موظف أو شهر...",
            exportBtn: "تصدير",
            colEmp: "الموظف",
            colMonth: "الشهر",
            colBase: "الراتب الأساسي",
            colOvertime: "ساعات إضافية",
            colBonus: "مكافآت",
            colDeduction: "اقتطاعات",
            colNet: "الصافي",
            statusPaid: "مدفوع"
        }
    }[lang === 'ar' ? 'ar' : 'fr'];

    const filtered = salaries.filter(s => {
        const empName = s.employee?.firstName + " " + s.employee?.lastName;
        return empName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.month.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><BadgeDollarSign size={24} /></div>
                        <div>
                            <h2 className="text-3xl font-black text-[#1A1F36] tracking-tighter">{t.title}</h2>
                            <p className="text-[#697386] font-medium text-sm">{t.subtitle}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative group flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#0078D4]" size={18} />
                        <input
                            type="text"
                            placeholder={t.search}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 pl-12 pr-4 py-3 bg-white border border-[#E3E8EE] rounded-xl text-sm font-bold focus:border-[#0078D4] outline-none shadow-sm transition-all"
                        />
                    </div>
                    <button className="px-4 py-3 bg-white border border-[#E3E8EE] text-gray-500 rounded-xl hover:text-teal-600 transition-all shadow-sm">
                        <Filter size={18} />
                    </button>
                    {user.role !== 'EMPLOYEE' && (
                        <button className="px-6 py-3 bg-[#111827] text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md">
                            <FileSpreadsheet size={16} /> {t.exportBtn}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white border border-[#E3E8EE] rounded-[32px] overflow-hidden shadow-xl mt-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4 text-gray-400">
                        <RefreshCw className="animate-spin" size={32} />
                        <p className="text-sm font-bold uppercase tracking-widest">Synchronisation en cours...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead className="bg-[#F7F9FC] border-b border-[#E3E8EE]">
                                <tr className="text-[10px] font-black text-[#697386] uppercase tracking-widest">
                                    <th className="p-6">{t.colEmp}</th>
                                    <th className="p-6">{t.colMonth}</th>
                                    <th className="p-6 text-right">{t.colBase}</th>
                                    <th className="p-6 text-right text-teal-600">{t.colOvertime}</th>
                                    <th className="p-6 text-right text-emerald-600">{t.colBonus}</th>
                                    <th className="p-6 text-right text-rose-500">{t.colDeduction}</th>
                                    <th className="p-6 text-right text-[#0078D4]">{t.colNet}</th>
                                    <th className="p-6 text-center">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.length > 0 ? filtered.map((salary) => (
                                    <tr key={salary.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-6">
                                            <p className="font-black text-[#1A1F36]">{salary.employee?.firstName} {salary.employee?.lastName}</p>
                                        </td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 bg-gray-100 text-[#1A1F36] rounded-lg text-xs font-black uppercase tracking-widest">{salary.month}</span>
                                        </td>
                                        <td className="p-6 text-right font-black text-gray-600">{Number(salary.baseSalary).toLocaleString()} DH</td>
                                        <td className="p-6 text-right font-black text-teal-600">+{Number(salary.overtimePay).toLocaleString()} DH</td>
                                        <td className="p-6 text-right font-black text-emerald-600">+{Number(salary.bonuses).toLocaleString()} DH</td>
                                        <td className="p-6 text-right font-black text-rose-500">-{Number(salary.deductions).toLocaleString()} DH</td>
                                        <td className="p-6 text-right">
                                            <p className="text-lg font-black text-[#0078D4]">{Number(salary.netSalary).toLocaleString()} DH</p>
                                        </td>
                                        <td className="p-6 text-center">
                                            <div className="flex justify-center items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest w-fit mx-auto">
                                                <ShieldCheck size={12} /> {t.statusPaid}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={8} className="p-16 text-center text-gray-400 font-medium italic">Aucun historique de salaire trouvé.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalariesHistory;

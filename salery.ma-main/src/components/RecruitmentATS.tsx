import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, Filter, Plus, Briefcase, MapPin, Building,
    Calendar as CalendarIcon, MoreHorizontal, CheckCircle2,
    XCircle, Clock, FileText, Star, PlusCircle, UserPlus,
    ChevronRight, ArrowRight, Zap, Target
} from 'lucide-react';
import { Candidate, JobPosting, Language, AuthUser, CandidateStage } from '../types.ts';
import { useAppStore } from '../store/store.ts';

interface Props {
    lang: Language;
    user: AuthUser;
}

const STAGES: { id: CandidateStage; labelFR: string; labelAR: string; color: string }[] = [
    { id: 'NEW', labelFR: 'Nouveaux', labelAR: 'جديد', color: 'border-blue-500' },
    { id: 'SCREENING', labelFR: 'Pré-sélection', labelAR: 'الفرز الأولي', color: 'border-yellow-500' },
    { id: 'INTERVIEW', labelFR: 'Entretien', labelAR: 'مقابلة', color: 'border-purple-500' },
    { id: 'OFFER', labelFR: 'Offre envoyée', labelAR: 'تم إرسال العرض', color: 'border-orange-500' },
    { id: 'HIRED', labelFR: 'Recruté', labelAR: 'تم التوظيف', color: 'border-emerald-500' },
    { id: 'REJECTED', labelFR: 'Refusé', labelAR: 'مرفوض', color: 'border-rose-500' }
];

const mockJobs: JobPosting[] = [
    { id: 'J1', companyId: 'TENANT-8821', title: 'Senior React Developer', department: 'Engineering', location: 'Casablanca (Hybride)', type: 'FULL_TIME', status: 'OPEN', description: '', requirements: [], createdAt: '2026-02-01', applicationsCount: 12 },
    { id: 'J2', companyId: 'TENANT-8821', title: 'HR Manager', department: 'Human Resources', location: 'Rabat', type: 'FULL_TIME', status: 'OPEN', description: '', requirements: [], createdAt: '2026-02-15', applicationsCount: 8 },
    { id: 'J3', companyId: 'TENANT-8821', title: 'Marketing Assistant', department: 'Marketing', location: 'Tanger', type: 'CONTRACT', status: 'DRAFT', description: '', requirements: [], createdAt: '2026-02-20', applicationsCount: 2 }
];

export const RecruitmentATS: React.FC<Props> = ({ lang, user }) => {
    const { candidates, setCandidates, jobPostings, setJobPostings } = useAppStore();
    const [activeJobId, setActiveJobId] = useState<string>('J1');
    const [searchQuery, setSearchQuery] = useState('');

    // Hydrate with mock data if empty (for demo purposes)
    React.useEffect(() => {
        if (jobPostings.length === 0) setJobPostings(mockJobs);
        if (candidates.length === 0) {
            setCandidates([
                { id: 'C1', jobId: 'J1', companyId: user.companyId, firstName: 'Ayoub', lastName: 'Bennani', email: 'ayoub@example.com', phone: '0661123456', stage: 'INTERVIEW', rating: 4, notes: 'Excellent technical skills', appliedDate: '2026-02-10', lastUpdated: Date.now() },
                { id: 'C2', jobId: 'J1', companyId: user.companyId, firstName: 'Fatima', lastName: 'Zahra', email: 'fatima@example.com', phone: '0662234567', stage: 'NEW', rating: 0, notes: '', appliedDate: '2026-02-20', lastUpdated: Date.now() },
                { id: 'C3', jobId: 'J2', companyId: user.companyId, firstName: 'Omar', lastName: 'Radi', email: 'omar@example.com', phone: '0663345678', stage: 'SCREENING', rating: 3, notes: 'Good cultural fit', appliedDate: '2026-02-18', lastUpdated: Date.now() },
                { id: 'C4', jobId: 'J1', companyId: user.companyId, firstName: 'Yasmine', lastName: 'Alaoui', email: 'yasmine@example.com', phone: '0664456789', stage: 'OFFER', rating: 5, notes: 'Top choice', appliedDate: '2026-02-05', lastUpdated: Date.now() }
            ]);
        }
    }, []);

    const t = {
        fr: {
            title: 'Recrutement & ATS',
            subtitle: 'Gérez votre pipeline de talents avec précision.',
            addJob: 'Nouvelle Offre',
            addCandidate: 'Ajouter Candidat',
            allCandidates: 'Tous les candidats',
            searchBox: 'Chercher par nom, email...',
            openJobs: 'Offres actives'
        },
        ar: {
            title: 'التوظيف وتتبع المتقدمين',
            subtitle: 'إدارة مسار المواهب الخاصة بك بدقة.',
            addJob: 'عرض عمل جديد',
            addCandidate: 'إضافة مرشح',
            allCandidates: 'جميع المرشحين',
            searchBox: 'البحث بالاسم، البريد الإلكتروني...',
            openJobs: 'العروض النشطة'
        }
    }[lang === 'ar' ? 'ar' : 'fr'];

    const filteredCandidates = useMemo(() => {
        let result = candidates.filter(c => c.companyId === user.companyId);
        if (activeJobId !== 'all') {
            result = result.filter(c => c.jobId === activeJobId);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.firstName.toLowerCase().includes(q) ||
                c.lastName.toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q)
            );
        }
        return result;
    }, [candidates, activeJobId, searchQuery, user.companyId]);

    const moveCandidate = (candidateId: string, newStage: CandidateStage) => {
        setCandidates(candidates.map(c =>
            c.id === candidateId ? { ...c, stage: newStage, lastUpdated: Date.now() } : c
        ));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-[var(--salery-text-primary)] tracking-tight">{t.title}</h2>
                    <p className="text-[var(--salery-text-secondary)] mt-1 font-medium italic">{t.subtitle}</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[var(--salery-border)] rounded-xl text-[var(--salery-text-secondary)] hover:text-[var(--salery-primary-teal)] hover:border-[var(--salery-primary-teal)] transition-all shadow-sm text-sm font-black uppercase tracking-widest">
                        <PlusCircle size={16} /> {t.addJob}
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 btn-primary-gradient text-white rounded-xl shadow-xl hover:brightness-110 active:scale-95 transition-all text-sm font-black uppercase tracking-widest">
                        <UserPlus size={16} /> {t.addCandidate}
                    </button>
                </div>
            </header>

            {/* Analytics & Job Selector */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[var(--salery-card)] rounded-[32px] p-6 border border-[var(--salery-border)] shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--salery-text-muted)] mb-4">{t.openJobs}</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveJobId('all')}
                                className={`w-full text-start p-4 rounded-2xl transition-all flex justify-between items-center group ${activeJobId === 'all' ? 'bg-[var(--salery-primary-blue)] text-white shadow-md' : 'hover:bg-[var(--salery-bg-sidebar)] text-[var(--salery-text-primary)]'}`}
                            >
                                <span className="font-bold text-sm">{t.allCandidates}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeJobId === 'all' ? 'bg-white/20' : 'bg-[var(--salery-bg)] text-[var(--salery-text-muted)]'}`}>
                                    {candidates.length}
                                </span>
                            </button>

                            {jobPostings.filter(j => j.status === 'OPEN').map(job => {
                                const count = candidates.filter(c => c.jobId === job.id).length;
                                const isActive = activeJobId === job.id;
                                return (
                                    <button
                                        key={job.id}
                                        onClick={() => setActiveJobId(job.id)}
                                        className={`w-full text-start p-4 rounded-2xl transition-all border ${isActive ? 'bg-white border-[var(--salery-primary-blue)] shadow-sm' : 'border-transparent hover:bg-[var(--salery-bg-sidebar)]'} group`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold text-sm truncate pr-2 ${isActive ? 'text-[var(--salery-primary-blue)]' : 'text-[var(--salery-text-primary)]'}`}>{job.title}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-[var(--salery-bg)] text-[var(--salery-text-muted)]'}`}>
                                                {count}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-[var(--salery-text-muted)]">
                                            <MapPin size={10} /> <span className="truncate">{job.location}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Kanban Board Area */}
                <div className="lg:col-span-3 flex flex-col min-h-[600px] h-[calc(100vh-250px)]">
                    <div className="flex gap-4 mb-6">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--salery-primary-teal)] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder={t.searchBox}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-[var(--salery-card)] border border-[var(--salery-border)] rounded-2xl text-sm font-bold focus:ring-4 focus:ring-teal-50 focus:border-[var(--salery-primary-teal)] outline-none shadow-sm transition-all"
                            />
                        </div>
                        <button className="px-5 bg-[var(--salery-card)] border border-[var(--salery-border)] rounded-2xl text-[var(--salery-text-secondary)] hover:text-[var(--salery-primary-teal)] hover:border-[var(--salery-primary-teal)] transition-all shadow-sm">
                            <Filter size={18} />
                        </button>
                    </div>

                    {/* Board Columns */}
                    <div className="flex-1 flex gap-6 overflow-x-auto custom-scroll pb-4 no-scrollbar">
                        {STAGES.map(stage => {
                            const stageCandidates = filteredCandidates.filter(c => c.stage === stage.id);

                            return (
                                <div key={stage.id} className="flex flex-col min-w-[320px] max-w-[320px] bg-[var(--salery-bg-sidebar)] rounded-[32px] border border-[var(--salery-border)] p-4 shadow-sm shrink-0">
                                    <div className={`flex justify-between items-center mb-4 px-2 border-b-2 ${stage.color} pb-3`}>
                                        <h4 className="font-black text-[13px] uppercase tracking-widest text-[var(--salery-text-primary)]">
                                            {lang === 'ar' ? stage.labelAR : stage.labelFR}
                                        </h4>
                                        <span className="px-2.5 py-0.5 bg-[var(--salery-bg)] rounded-full text-[11px] font-black text-[var(--salery-text-muted)]">
                                            {stageCandidates.length}
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scroll space-y-4 px-1 pb-4">
                                        <AnimatePresence>
                                            {stageCandidates.map(candidate => (
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    key={candidate.id}
                                                    className="enterprise-card p-5 cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-[var(--salery-primary-teal)] hover:ring-offset-2 transition-all relative group bg-[var(--salery-card)]"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h5 className="font-black text-sm text-[var(--salery-text-primary)]">{candidate.firstName} {candidate.lastName}</h5>
                                                            <p className="text-[11px] font-bold text-[var(--salery-text-muted)] mt-0.5 truncate max-w-[180px]">
                                                                {jobPostings.find(j => j.id === candidate.jobId)?.title || 'Postulation Générale'}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            {candidate.rating > 0 && (
                                                                <div className="flex items-center text-amber-400">
                                                                    <Star size={12} fill="currentColor" />
                                                                    <span className="text-[10px] font-black text-[var(--salery-text-muted)] ml-1">{candidate.rating}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mb-4">
                                                        <span className="p-1.5 bg-gray-50 text-[var(--salery-text-secondary)] rounded-lg"><FileText size={12} /></span>
                                                        <span className="p-1.5 bg-gray-50 text-[var(--salery-text-secondary)] rounded-lg"><Clock size={12} /></span>
                                                        <span className="text-[9px] font-black text-[var(--salery-text-muted)] uppercase tracking-widest ml-auto">
                                                            {new Date(candidate.appliedDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>

                                                    {/* Quick Actions (Move Stage) */}
                                                    <div className="pt-3 border-t border-[var(--salery-border)] flex gap-2 overflow-x-auto no-scrollbar opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {STAGES.map(s => s.id !== candidate.stage && (
                                                            <button
                                                                key={s.id}
                                                                onClick={() => moveCandidate(candidate.id, s.id)}
                                                                className="px-2.5 py-1 bg-[var(--salery-bg)] hover:bg-[var(--salery-primary-teal)] hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest text-[var(--salery-text-secondary)] whitespace-nowrap transition-colors"
                                                            >
                                                                {lang === 'ar' ? s.labelAR : s.labelFR}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {stageCandidates.length === 0 && (
                                            <div className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-[var(--salery-border)] rounded-2xl">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--salery-text-muted)] opacity-50">Vide</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecruitmentATS;

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, PlusCircle, UserPlus,
    Clock, Star, MapPin, MoreHorizontal,
    Briefcase, XCircle, Linkedin, Link2
} from 'lucide-react';
import { Candidate, JobPosting, Language, AuthUser, CandidateStage } from '../types.ts';
import { useAppStore } from '../store/store.ts';

interface Props {
    lang: Language;
    user: AuthUser;
}

const STAGES: { id: CandidateStage; labelFR: string; labelAR: string; color: string; borderTop: string }[] = [
    { id: 'applied', labelFR: 'Nouveaux', labelAR: 'جديد', color: 'text-blue-600', borderTop: 'border-t-blue-500' },
    { id: 'screening', labelFR: 'Pré-sélection', labelAR: 'الفرز الأولي', color: 'text-amber-600', borderTop: 'border-t-amber-500' },
    { id: 'interview', labelFR: 'Entretien', labelAR: 'مقابلة', color: 'text-purple-600', borderTop: 'border-t-purple-500' },
    { id: 'offer', labelFR: 'Offre envoyée', labelAR: 'تم إرسال العرض', color: 'text-orange-600', borderTop: 'border-t-orange-500' },
    { id: 'hired', labelFR: 'Recruté', labelAR: 'تم التوظيف', color: 'text-emerald-600', borderTop: 'border-t-emerald-500' },
    { id: 'rejected', labelFR: 'Refusé', labelAR: 'مرفوض', color: 'text-rose-600', borderTop: 'border-t-rose-500' }
];

const mockJobs: JobPosting[] = [
    { id: 'J1', companyId: '1', title: 'Senior React Developer', department: 'Engineering', location: 'Casablanca (Hybride)', type: 'CDI', status: 'published', description: '', requirements: [], openDate: '2026-02-01', createdBy: '1', createdAt: Date.now() },
    { id: 'J2', companyId: '1', title: 'HR Manager', department: 'Human Resources', location: 'Rabat', type: 'CDI', status: 'published', description: '', requirements: [], openDate: '2026-02-15', createdBy: '1', createdAt: Date.now() },
    { id: 'J3', companyId: '1', title: 'Marketing Assistant', department: 'Marketing', location: 'Tanger', type: 'ANAPEC', status: 'draft', description: '', requirements: [], openDate: '2026-02-20', createdBy: '1', createdAt: Date.now() }
];

export const RecruitmentATS: React.FC<Props> = ({ lang, user }) => {
    const { candidates, setCandidates, jobPostings, setJobPostings } = useAppStore();
    const [activeJobId, setActiveJobId] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [showJobModal, setShowJobModal] = useState(false);
    const [showCandidateModal, setShowCandidateModal] = useState(false);

    // Form states
    const [newJob, setNewJob] = useState({ title: '', department: '', location: '', type: 'CDI', status: 'published' });
    const [newCandidate, setNewCandidate] = useState({ firstName: '', lastName: '', email: '', phone: '', jobId: '' });

    // Hydrate with mock data if empty
    React.useEffect(() => {
        if (jobPostings.length === 0) setJobPostings(mockJobs);
        if (candidates.length === 0) {
            setCandidates([
                { id: 'C1', jobId: 'J1', companyId: user.companyId, firstName: 'Ayoub', lastName: 'Bennani', email: 'ayoub@example.com', phone: '0661123456', stage: 'interview', rating: 4, notes: 'Excellent technical skills', appliedDate: '2026-02-10', lastUpdated: Date.now() },
                { id: 'C2', jobId: 'J1', companyId: user.companyId, firstName: 'Fatima', lastName: 'Zahra', email: 'fatima@example.com', phone: '0662234567', stage: 'applied', rating: 0, notes: '', appliedDate: '2026-02-20', lastUpdated: Date.now() },
                { id: 'C3', jobId: 'J2', companyId: user.companyId, firstName: 'Omar', lastName: 'Radi', email: 'omar@example.com', phone: '0663345678', stage: 'screening', rating: 3, notes: 'Good cultural fit', appliedDate: '2026-02-18', lastUpdated: Date.now() },
                { id: 'C4', jobId: 'J1', companyId: user.companyId, firstName: 'Yasmine', lastName: 'Alaoui', email: 'yasmine@example.com', phone: '0664456789', stage: 'offer', rating: 5, notes: 'Top choice', appliedDate: '2026-02-05', lastUpdated: Date.now() }
            ]);
        }
    }, []);

    const t = {
        fr: {
            title: 'Recrutement & ATS',
            subtitle: 'Gérez votre pipeline de talents avec précision.',
            addJob: 'Nouvelle Offre',
            addCandidate: 'Candidat',
            allCandidates: 'Tous les candidats',
            searchBox: 'Chercher par nom, email...',
            openJobs: 'Offres Actives'
        },
        ar: {
            title: 'التوظيف وتتبع المتقدمين',
            subtitle: 'إدارة مسار المواهب الخاصة بك بدقة.',
            addJob: 'عرض عمل',
            addCandidate: 'مرشح',
            allCandidates: 'جميع المرشحين',
            searchBox: 'البحث بالاسم...',
            openJobs: 'العروض النشطة'
        }
    }[lang];

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

    const handleAddJob = (e: React.FormEvent) => {
        e.preventDefault();
        const job: JobPosting = {
            id: `J${Date.now()}`,
            companyId: user.companyId,
            title: newJob.title,
            department: newJob.department,
            location: newJob.location,
            type: newJob.type as any,
            status: newJob.status as any,
            description: '',
            requirements: [],
            openDate: new Date().toISOString().split('T')[0],
            createdBy: user.id,
            createdAt: Date.now()
        };
        setJobPostings([...jobPostings, job]);
        setActiveJobId(job.id);
        setShowJobModal(false);
        setNewJob({ title: '', department: '', location: '', type: 'CDI', status: 'published' });
    };

    const handleAddCandidate = (e: React.FormEvent) => {
        e.preventDefault();
        const c: Candidate = {
            id: `C${Date.now()}`,
            jobId: newCandidate.jobId || (jobPostings[0]?.id || ''),
            companyId: user.companyId,
            firstName: newCandidate.firstName,
            lastName: newCandidate.lastName,
            email: newCandidate.email,
            phone: newCandidate.phone,
            stage: 'applied',
            rating: 0,
            notes: '',
            appliedDate: new Date().toISOString().split('T')[0],
            lastUpdated: Date.now()
        };
        setCandidates([...candidates, c]);
        setShowCandidateModal(false);
        setNewCandidate({ firstName: '', lastName: '', email: '', phone: '', jobId: '' });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-96px)] max-h-[calc(100vh-96px)] animate-in fade-in duration-500 overflow-hidden bg-gray-50/50" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            
            {/* Top Enterprise Header (72px) */}
            <header className="h-[72px] shrink-0 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-gray-900 text-white rounded-xl shadow-md">
                        <Briefcase size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">{t.title}</h2>
                        <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-widest">{t.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group hidden lg:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder={t.searchBox}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>
                    <button className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 bg-white transition-all hidden md:block shadow-sm">
                        <Filter size={18} />
                    </button>
                    <div className="w-px h-8 bg-gray-200 mx-2 hidden md:block"></div>
                    <button onClick={() => setShowJobModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm text-[11px] font-black uppercase tracking-widest">
                        <PlusCircle size={14} /> {t.addJob}
                    </button>
                    <button onClick={() => setShowCandidateModal(true)} className="flex items-center gap-2 px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl shadow-md transition-all text-[11px] font-black uppercase tracking-widest">
                        <UserPlus size={14} /> {t.addCandidate}
                    </button>
                </div>
            </header>

            {/* Main Content Body */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left Sidebar: Compact Job Pipeline Selector */}
                <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden hidden xl:flex z-0">
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">{t.openJobs}</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
                        <button
                            onClick={() => setActiveJobId('all')}
                            className={`w-full text-start px-4 py-3 rounded-2xl transition-all flex justify-between items-center group ${activeJobId === 'all' ? 'bg-gray-900 text-white shadow-md' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                            <span className="font-bold text-xs">{t.allCandidates}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${activeJobId === 'all' ? 'bg-white/20' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                                {candidates.length}
                            </span>
                        </button>

                        {jobPostings.filter(j => j.status === 'published').map(job => {
                            const count = candidates.filter(c => c.jobId === job.id).length;
                            const isActive = activeJobId === job.id;
                            return (
                                <button
                                    key={job.id}
                                    onClick={() => setActiveJobId(job.id)}
                                    className={`w-full text-start px-4 py-3 rounded-2xl transition-all flex flex-col group ${isActive ? 'bg-blue-50 border border-blue-200 shadow-sm' : 'border border-transparent hover:bg-gray-50'}`}
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <span className={`font-bold text-xs truncate pr-2 ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>{job.title}</span>
                                        <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-black shrink-0 ${isActive ? 'bg-white text-blue-600 shadow-sm' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>
                                            {count}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                            <MapPin size={10} /> <span className="truncate max-w-[100px]">{job.location}</span>
                                        </div>
                                        <div className={`flex gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <div title="Partager sur LinkedIn" className="p-1 rounded text-[#0077b5] hover:bg-[#0077b5]/10" onClick={(e) => { e.stopPropagation(); window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://salery.ma/jobs/${job.id}`)}`, '_blank'); }}>
                                                <Linkedin size={10} fill="currentColor" />
                                            </div>
                                            <div title="Copier le lien" className="p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-gray-200" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`https://salery.ma/jobs/${job.id}`); }}>
                                                <Link2 size={10} />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Horizontal Kanban Board (Restricts Vertical Scroll) */}
                <main className="flex-1 overflow-x-auto custom-scrollbar p-6 bg-slate-50/50">
                    <div className="flex gap-6 h-full min-w-max pb-2">
                        {STAGES.map(stage => {
                            const stageCandidates = filteredCandidates.filter(c => c.stage === stage.id);
                            return (
                                <div key={stage.id} className="flex flex-col w-[320px] shrink-0 h-full bg-gray-100/50 rounded-3xl p-3 border border-gray-200/60 shadow-sm">
                                    
                                    {/* Column Header */}
                                    <div className={`flex items-center justify-between px-4 py-3.5 mb-3 bg-white rounded-2xl border border-gray-200 shadow-sm border-t-4 ${stage.borderTop}`}>
                                        <h4 className={`font-black text-[11px] uppercase tracking-widest ${stage.color}`}>
                                            {lang === 'ar' ? stage.labelAR : stage.labelFR}
                                        </h4>
                                        <span className="bg-gray-50 border border-gray-100 text-gray-600 px-2.5 py-0.5 rounded-lg text-[11px] font-black shadow-inner">
                                            {stageCandidates.length}
                                        </span>
                                    </div>

                                    {/* Column Internal Scroll Area */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-1 pb-4">
                                        <AnimatePresence>
                                            {stageCandidates.map(candidate => (
                                                <motion.div
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    key={candidate.id}
                                                    className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden"
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div>
                                                            <h5 className="font-black text-[13px] text-gray-900 tracking-tight leading-tight">{candidate.firstName} {candidate.lastName}</h5>
                                                            <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider truncate max-w-[180px]">
                                                                {jobPostings.find(j => j.id === candidate.jobId)?.title || 'Postulation Générale'}
                                                            </p>
                                                        </div>
                                                        <div className="flex -space-x-1 shrink-0">
                                                            {candidate.rating > 0 && Array.from({ length: candidate.rating }).map((_, i) => (
                                                                <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                                                        <div className="flex items-center gap-1.5 text-gray-400">
                                                            <Clock size={12} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                                {new Date(candidate.appliedDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        </div>
                                                        <button className="p-1 rounded-md text-gray-300 hover:text-gray-900 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
                                                            <MoreHorizontal size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Quick Actions overlay (Appears on Hover) */}
                                                    <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 p-2 flex gap-1.5 overflow-x-auto custom-scrollbar translate-y-full group-hover:translate-y-0 transition-transform duration-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                                                        {STAGES.map(s => s.id !== candidate.stage && (
                                                            <button
                                                                key={s.id}
                                                                onClick={() => moveCandidate(candidate.id, s.id)}
                                                                className="px-2 py-1.5 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-600 whitespace-nowrap transition-colors flex-1 text-center"
                                                            >
                                                                {lang === 'ar' ? s.labelAR : s.labelFR}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {stageCandidates.length === 0 && (
                                            <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-white/40">
                                                <div className="p-2 bg-gray-50 rounded-xl text-gray-300 mb-2">
                                                    <Briefcase size={16} />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Aucun Candidat</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>

            {/* Modals (Job / Candidate Creation) */}
            <AnimatePresence>
                {showJobModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{t.addJob}</h3>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">Nouvelle campagne</p>
                                </div>
                                <button onClick={() => setShowJobModal(false)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                    <XCircle size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddJob} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1.5">Titre de l'offre</label>
                                    <input required type="text" value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" placeholder="Ex: Développeur Senior" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1.5">Département</label>
                                        <input required type="text" value={newJob.department} onChange={e => setNewJob({ ...newJob, department: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" placeholder="Ex: IT, RH" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1.5">Location</label>
                                        <input required type="text" value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" placeholder="Ex: Casablanca" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1.5">Contrat</label>
                                        <select value={newJob.type} onChange={e => setNewJob({ ...newJob, type: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all">
                                            <option value="CDI">CDI</option>
                                            <option value="CDD">CDD</option>
                                            <option value="ANAPEC">ANAPEC</option>
                                            <option value="STAGE">STAGE</option>
                                            <option value="FREELANCE">FREELANCE</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1.5">Statut</label>
                                        <select value={newJob.status} onChange={e => setNewJob({ ...newJob, status: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all">
                                            <option value="published">Actif</option>
                                            <option value="draft">Brouillon</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowJobModal(false)} className="px-5 py-2.5 text-gray-500 hover:text-gray-900 font-bold rounded-xl transition-all text-xs uppercase tracking-widest">Annuler</button>
                                    <button type="submit" className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-black rounded-xl shadow-md transition-all text-xs uppercase tracking-widest">Publier l'Offre</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}

                {showCandidateModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{t.addCandidate}</h3>
                                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">Ajout manuel</p>
                                </div>
                                <button onClick={() => setShowCandidateModal(false)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                    <XCircle size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleAddCandidate} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1.5">Offre Ciblée</label>
                                    <select required value={newCandidate.jobId} onChange={e => setNewCandidate({ ...newCandidate, jobId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all">
                                        <option value="">Sélectionner une offre...</option>
                                        {jobPostings.filter(j => j.status === 'published').map(j => (
                                            <option key={j.id} value={j.id}>{j.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1.5">Prénom</label>
                                        <input required type="text" value={newCandidate.firstName} onChange={e => setNewCandidate({ ...newCandidate, firstName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1.5">Nom</label>
                                        <input required type="text" value={newCandidate.lastName} onChange={e => setNewCandidate({ ...newCandidate, lastName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1.5">Email</label>
                                    <input required type="email" value={newCandidate.email} onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 mb-1.5">Téléphone</label>
                                    <input type="tel" value={newCandidate.phone} onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all" />
                                </div>
                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowCandidateModal(false)} className="px-5 py-2.5 text-gray-500 hover:text-gray-900 font-bold rounded-xl transition-all text-xs uppercase tracking-widest">Annuler</button>
                                    <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-all text-xs uppercase tracking-widest">Enregistrer</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RecruitmentATS;

import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Mail, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    RefreshCcw, 
    UserPlus, 
    Search,
    Filter,
    MoreVertical,
    History,
    AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface Invite {
    id: string;
    email: string;
    role: string;
    status: 'PENDING' | 'SENT' | 'FAILED' | 'ACCEPTED' | 'EXPIRED';
    expiresAt: string;
    createdAt: string;
    emailLogs: any[];
}

const InviteTracker: React.FC = () => {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');
    
    // Form state
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('EMPLOYEE');

    const fetchInvites = async () => {
        setLoading(true);
        try {
            const res = await api.get('/invites/tracking');
            setInvites(res);
        } catch (err) {
            console.error('Failed to fetch invites', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setSendError('');
        try {
            await api.post('/invites/send', { email: newEmail, role: newRole });
            setNewEmail('');
            setShowInviteModal(false);
            fetchInvites();
        } catch (err: any) {
            setSendError(err.message || 'Erreur lors de l\'envoi. Vérifiez la connexion.');
            console.error('Failed to send invite', err);
        } finally {
            setSending(false);
        }
    };

    const handleResend = async (inviteId: string) => {
        try {
            await api.post('/invites/resend', { inviteId });
            fetchInvites();
        } catch (err) {
            console.error('Failed to resend invite', err);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'ACCEPTED': return <CheckCircle2 className="text-green-500" size={16} />;
            case 'FAILED': return <XCircle className="text-rose-500" size={16} />;
            case 'PENDING': return <Clock className="text-amber-500" size={16} />;
            case 'SENT': return <Mail className="text-blue-500" size={16} />;
            default: return <AlertCircle className="text-slate-400" size={16} />;
        }
    };

    const filteredInvites = invites.filter(i => 
        i.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Invitations', val: invites.length, icon: Users, color: 'text-slate-600', bg: 'bg-slate-50' },
                    { label: 'En attente', val: invites.filter(i => i.status === 'SENT').length, icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Acceptées', val: invites.filter(i => i.status === 'ACCEPTED').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Échecs', val: invites.filter(i => i.status === 'FAILED').length, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} p-6 rounded-[24px] border border-white shadow-sm transition-all hover:shadow-md group`}>
                        <div className="flex items-center justify-between mb-2">
                            <stat.icon className={`${stat.color} group-hover:scale-110 transition-transform`} size={20} />
                            <span className="text-2xl font-black text-slate-900">{stat.val}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium text-slate-900"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="h-12 px-5 bg-slate-50 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2">
                        <Filter size={16} /> Filtrer
                    </button>
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="h-12 px-6 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-slate-200"
                    >
                        <UserPlus size={16} /> Inviter un utilisateur
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Rôle</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Statut Delivery</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Envoyé le</th>
                            <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredInvites.map((invite) => (
                            <tr key={invite.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold">
                                            {invite.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{invite.email}</p>
                                            <p className="text-[10px] font-medium text-slate-400">ID: {invite.id.slice(0,8)}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-600 tracking-wider">
                                        {invite.role}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(invite.status)}
                                        <span className="text-xs font-bold text-slate-700">{invite.status}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <p className="text-xs font-medium text-slate-500 italic">
                                        {new Date(invite.createdAt).toLocaleDateString()}
                                    </p>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        {invite.status !== 'ACCEPTED' && (
                                            <button 
                                                onClick={() => handleResend(invite.id)}
                                                className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                                                title="Renvoyer l'invitation"
                                            >
                                                <RefreshCcw size={16} />
                                            </button>
                                        )}
                                        <button className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                                            <History size={16} title="Voir l'historique delivery" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal - Quick Invite */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Nouvelle Invitation</h3>
                                <button onClick={() => { setShowInviteModal(false); setSendError(''); }} className="text-slate-400 hover:text-slate-900">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            {sendError && (
                                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold">
                                    ⚠️ {sendError}
                                </div>
                            )}

                            <form onSubmit={handleSendInvite} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block ml-1">Email professionnel</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="user@entreprise.com"
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block ml-1">Rôle assigné</label>
                                    <select 
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium"
                                    >
                                        <option value="EMPLOYEE">Employé</option>
                                        <option value="HR">RH / Gestionnaire</option>
                                        <option value="ADMIN">Administrateur</option>
                                    </select>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={sending}
                                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all mt-4 shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? '⏳ Envoi en cours...' : 'Envoyer l\'invitation'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InviteTracker;

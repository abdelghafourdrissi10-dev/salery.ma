import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/store.ts';
import { ROLE_DEFAULT_TAB } from '../services/rbac.ts';

const Unauthorized: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAppStore();

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center shadow-xl shadow-rose-100 border border-rose-100 ring-4 ring-white mx-auto">
                    <ShieldAlert size={48} />
                </div>

                <div className="space-y-3">
                    <h2 className="text-4xl font-black text-[#1F2937] tracking-tighter uppercase leading-none">
                        Accès Interdit
                    </h2>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                        Vous n'avez pas les permissions nécessaires pour accéder à ce module. L'incident a été enregistré dans nos journaux de sécurité.
                    </p>
                </div>

                <button
                    onClick={() => navigate(user ? `/${user.role.toLowerCase()}` : '/login')}
                    className="px-8 py-4 bg-[#1F2937] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all active:scale-95 shadow-2xl shadow-gray-200"
                >
                    Retour à l'accueil sécurisé
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;

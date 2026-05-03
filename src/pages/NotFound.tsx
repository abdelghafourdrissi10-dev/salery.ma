import React from 'react';
import { FileSearch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-blue-50 text-[#0078D4] rounded-[32px] flex items-center justify-center shadow-xl shadow-blue-100 border border-blue-100 ring-4 ring-white mx-auto">
                    <FileSearch size={48} />
                </div>

                <div className="space-y-3">
                    <h2 className="text-4xl font-black text-[#1F2937] tracking-tighter uppercase leading-none">
                        Page Non Trouvée
                    </h2>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                        La ressource que vous recherchez n'existe pas ou a été déplacée.
                    </p>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="px-8 py-4 bg-[#0078D4] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all active:scale-95 shadow-2xl shadow-blue-200"
                >
                    Retour au Dashboard
                </button>
            </div>
        </div>
    );
};

export default NotFound;

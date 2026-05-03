import React from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

interface Props {
    userName?: string;
}

const SecureLoadingSpinner: React.FC<Props> = ({ userName }) => {
    return (
        <div className="fixed inset-0 z-[9999] bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            {/* Background patterns */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-100 rounded-full blur-3xl animate-pulse delay-700"></div>
            </div>

            <div className="relative space-y-12 max-w-sm animate-in fade-in zoom-in duration-700">
                <div className="relative mx-auto">
                    {/* Outer ring */}
                    <div className="w-24 h-24 rounded-[32px] border-4 border-blue-100 border-t-blue-600 animate-spin"></div>

                    {/* Inner Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-600 ring-4 ring-blue-50">
                            <ShieldCheck size={24} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-[#0F172A] tracking-tighter leading-tight uppercase">
                            {userName ? `BIENVENUE, ${userName.toUpperCase()}` : "SÉCURISATION DE L'ACCÈS"}
                        </h2>
                        {userName && (
                            <p className="text-[10px] font-black uppercase text-teal-600 tracking-[0.3em]">IDENTITÉ VÉRIFIÉE • ACCÈS AUTORISÉ</p>
                        )}
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
                            <RefreshCw size={14} className="animate-spin text-gray-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Vérification Identity_Token</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                            Chargement de votre infrastructure RH personnalisée...
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded-lg"></div>
                    <span className="text-lg font-black tracking-tighter">salery.ma</span>
                </div>
            </div>
        </div>
    );
};

export default SecureLoadingSpinner;

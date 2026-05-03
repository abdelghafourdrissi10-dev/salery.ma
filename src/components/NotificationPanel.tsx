import React from 'react';
import { Bell, Check, Info, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onClose: () => void;
}

const NotificationPanel: React.FC<Props> = ({ notifications, onMarkAsRead, onClose }) => {
    const getIcon = (type?: string) => {
        switch (type) {
            case 'WARNING': return <AlertTriangle className="text-amber-500" size={18} />;
            case 'ERROR': return <AlertCircle className="text-rose-500" size={18} />;
            case 'SUCCESS': return <CheckCircle className="text-emerald-500" size={18} />;
            default: return <Info className="text-blue-500" size={18} />;
        }
    };

    return (
        <div className="absolute top-full right-0 mt-4 w-[400px] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-50">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Bell size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Centre de Notifications</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Temps réel • Mode Sécurisé</p>
                    </div>
                </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-center px-10">
                        <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center">
                            <Bell size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Aucune notification</p>
                            <p className="text-[10px] text-gray-300 font-medium">Vous êtes à jour avec toutes vos alertes RH.</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((n) => (
                            <div 
                                key={n.id} 
                                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer group relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                                onClick={() => !n.isRead && onMarkAsRead(n.id)}
                            >
                                {!n.isRead && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full"></div>
                                )}
                                <div className="flex gap-4">
                                    <div className="mt-1 shrink-0">{getIcon(n.type)}</div>
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center justify-between gap-4">
                                            <h4 className="text-xs font-black text-gray-900 tracking-tight">{n.title}</h4>
                                            <span className="text-[8px] font-black text-gray-300 uppercase shrink-0">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{n.message}</p>
                                        {!n.isRead && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onMarkAsRead(n.id); }}
                                                className="pt-2 flex items-center gap-1.5 text-[9px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Check size={10} /> Marquer comme lu
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
                <button onClick={onClose} className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Fermer le panneau</button>
            </div>
        </div>
    );
};

export default NotificationPanel;

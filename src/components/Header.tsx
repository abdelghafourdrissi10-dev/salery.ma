import React from 'react';
import { Menu as MenuIcon, Bell } from 'lucide-react';
import { AuthUser, Language } from '../types.ts';

interface HeaderProps {
    user: AuthUser;
    activeTabLabel?: string;
    lang: Language;
    setLang: (lang: Language) => void;
    onOpenMobileSidebar: () => void;
    toggleNotifications: () => void;
    showNotifications: boolean;
}

import { NotificationService } from '../services/NotificationService';
import NotificationPanel from './NotificationPanel';

const Header: React.FC<HeaderProps> = ({
    user, activeTabLabel, lang, setLang,
    onOpenMobileSidebar, toggleNotifications, showNotifications
}) => {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = React.useState(0);

    const fetchNotifications = React.useCallback(async () => {
        try {
            const data = await NotificationService.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Failed to load notifications');
        }
    }, []);

    React.useEffect(() => {
        fetchNotifications();

        // Socket.io Real-time Integration
        const socketLoad = async () => {
            const { io } = await import('socket.io-client');
            const socket = io('http://localhost:3001', {
                query: {
                    companyId: user.companyId,
                    userId: user.id || '',
                    role: user.role
                }
            });

            socket.on('NEW_NOTIFICATION', (newNotif: any) => {
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
            });

            return () => {
                socket.disconnect();
            };
        };

        const cleanupPromise = socketLoad();
        
        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, [fetchNotifications, user]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await NotificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Mark read failed');
        }
    };

    return (
        <header className="py-2 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-[15] shrink-0 bg-transparent pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
                <button onClick={onOpenMobileSidebar} className="lg:hidden p-2 bg-white shadow-sm border border-[var(--salery-border)] rounded-xl text-[var(--salery-text-primary)] hover:bg-gray-50 transition-colors">
                    <MenuIcon size={18} />
                </button>
                <h1 className="text-sm font-black text-[#0F172A] tracking-tight hidden md:block uppercase leading-none">
                    {activeTabLabel}
                </h1>
            </div>

            <div className="flex items-center gap-3 pointer-events-auto">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white border border-[#E2E8F0] rounded-md shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0A9E9A] animate-pulse"></div>
                    <span className="text-[9px] font-black uppercase text-[#475569] tracking-widest">{user.companyName}</span>
                </div>

                <div className="flex items-center bg-[#F8FAFC] p-0.5 rounded-md border border-[#E2E8F0] shadow-sm">
                    <button onClick={() => setLang('fr')} className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all ${lang === 'fr' ? 'bg-white shadow-sm text-[#0A66C2]' : 'text-gray-400 hover:text-gray-600'}`}>FR</button>
                    <button onClick={() => setLang('ar')} className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all ${lang === 'ar' ? 'bg-white shadow-sm text-[#0A66C2]' : 'text-gray-400 hover:text-gray-600'}`}>AR</button>
                </div>

                <div className="relative">
                    <button
                        onClick={toggleNotifications}
                        className={`relative p-2 bg-white border rounded-md transition-all shadow-sm ${showNotifications ? 'text-[#0A66C2] border-[#0A66C2]' : 'text-gray-400 border-[#E2E8F0] hover:text-[#0A66C2]'}`}
                    >
                        <Bell size={16} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-sm">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 lg:w-96 bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden z-50">
                            <NotificationPanel 
                                notifications={notifications}
                                onMarkAsRead={handleMarkAsRead}
                                onClose={toggleNotifications}
                            />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

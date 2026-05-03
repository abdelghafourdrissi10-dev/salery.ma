import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.tsx';
import Header from '../components/Header.tsx';
import AccountModal from '../components/AccountModal.tsx';
import { useAppStore } from '../store/store.ts';
import { ROLE_DEFAULT_TAB } from '../services/rbac.ts';

const RHLayout: React.FC = () => {
    const { user, setUser, logout, employees, leaves, authLoading, lang, setLang, isImmersiveMode, setIsImmersiveMode } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [isSidebarPinned, setIsSidebarPinned] = useState(true);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const isSidebarExpanded = isSidebarPinned || isSidebarHovered;

    // --- LIVE API FETCHING ---
    useEffect(() => {
        if (!user) return;
        import('../services/api').then(({ api }) => {
            api.get('/employees').then((data: any) => {
                const { setEmployees } = useAppStore.getState();
                setEmployees(data);
            }).catch(err => console.error("Failed to fetch employees", err));

            // Also fetch attendance and salaries if needed globally, 
            // but we can also fetch them per-page to be more efficient.
        });
    }, [user]);

    // --- AUTO IMMERSIVE ---
    useEffect(() => {
        const pathParts = location.pathname.split('/');
        const tab = pathParts.pop();
        if (tab === 'pointage') {
            setIsImmersiveMode(true);
        } else {
            setIsImmersiveMode(false);
        }
    }, [location.pathname, setIsImmersiveMode]);

    if (!user) return null;

    const activeTab = location.pathname.split('/').pop() || '';

    return (
        <div className="flex h-[100dvh] w-full bg-[var(--salery-bg)] selection:bg-blue-100 overflow-hidden print:h-auto print:overflow-visible print:bg-white print:block" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <div className="print:hidden shrink-0 h-full z-50">
                <Sidebar
                    user={user}
                    activeTab={activeTab}
                    setActiveTab={(tab: string) => navigate(`/rh/${tab}`)}
                    lang={lang}
                    isExpanded={isImmersiveMode ? (isSidebarHovered) : isSidebarExpanded}
                    isPinned={isImmersiveMode ? false : isSidebarPinned}
                    setIsPinned={setIsSidebarPinned}
                    onHover={setIsSidebarHovered}
                    onShowAccount={() => setShowAccount(true)}
                />
            </div>

            <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden relative print:block print:overflow-visible print:h-auto">
                <div className="print:hidden">
                    <Header
                        user={user}
                        lang={lang}
                        setLang={setLang}
                        onOpenMobileSidebar={() => setShowMobileSidebar(true)}
                        toggleNotifications={() => setShowNotifications(!showNotifications)}
                        showNotifications={showNotifications}
                    />
                </div>

                <main className="flex-1 min-h-0 overflow-y-auto custom-scroll bg-[var(--salery-bg)] p-6 lg:p-10 z-[1] block print:block print:overflow-visible print:p-0 print:bg-white relative">
                    <Outlet />
                </main>
            </div>

            {showAccount && (
                <AccountModal
                    user={user}
                    setUser={setUser}
                    lang={lang}
                    onClose={() => setShowAccount(false)}
                    onShowPricing={() => { }}
                    onLogout={() => { logout(); navigate('/login'); }}
                />
            )}
        </div>
    );
};

export default RHLayout;

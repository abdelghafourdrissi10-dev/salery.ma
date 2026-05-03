import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.tsx';
import Header from '../components/Header.tsx';
import AccountModal from '../components/AccountModal.tsx';
import { useAppStore } from '../store/store.ts';

const EmployeeLayout: React.FC = () => {
    const { user, setUser, logout, authLoading, lang, setLang } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();

    const [isSidebarPinned, setIsSidebarPinned] = useState(true);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [showAccount, setShowAccount] = useState(false);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const isSidebarExpanded = isSidebarPinned || isSidebarHovered;

    if (!user) return null;

    const activeTab = location.pathname.split('/').pop() || '';

    return (
        <div className="flex h-[100dvh] w-full bg-[var(--salery-bg)] selection:bg-blue-100 overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <Sidebar
                user={user}
                activeTab={activeTab}
                setActiveTab={(tab: string) => navigate(`/employee/${tab}`)}
                lang={lang}
                isExpanded={isSidebarExpanded}
                isPinned={isSidebarPinned}
                setIsPinned={setIsSidebarPinned}
                onHover={setIsSidebarHovered}
                onShowAccount={() => setShowAccount(true)}
            />

            <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden relative">
                <Header
                    user={user}
                    lang={lang}
                    setLang={setLang}
                    onOpenMobileSidebar={() => setShowMobileSidebar(true)}
                    toggleNotifications={() => setShowNotifications(!showNotifications)}
                    showNotifications={showNotifications}
                />

                <main className="flex-1 min-h-0 overflow-y-auto custom-scroll bg-[var(--salery-bg)] p-6 lg:p-10 z-[1] block relative">
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

export default EmployeeLayout;

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ subtitle = 'Main Dashboard' }) => {
  const { currentUser, navigateTo, isAuthenticated, logOut, setIsSidebarOpen, currentWorkspaceAccess } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showUserMenu) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowUserMenu(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserMenu]);

  return (
    <header className="fixed top-0 z-40 w-full border-b border-[#e2f0f9] bg-[#f4faff]/90 shadow-[0_1px_12px_rgba(16,61,53,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Left: menu + brand */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#101d24] transition-colors hover:bg-[#e2f0f9]"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          <div
            onClick={() => navigateTo('/dashboard')}
            className="flex min-w-0 cursor-pointer items-center gap-2.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#006b57] text-white shadow-sm">
              <span className="material-symbols-outlined text-[19px]">solar_power</span>
            </span>
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-base font-bold leading-none tracking-tight text-[#002620]">
                  SOLARIS
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#9af4d8]/70 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#006b57]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#006b57] state-pulse" />
                  {currentUser.discom}
                </span>
              </div>
              <span className="max-w-[150px] truncate text-[11px] font-medium text-[#404846] sm:max-w-none">
                {subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Right: state + user menu */}
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-[#c0c8c5]/40 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-[#404846] sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f6bd4f]" />
            Proposed plan · not approved
          </span>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[#e2f0f9]"
              aria-label="User menu"
              aria-expanded={showUserMenu}
              aria-haspopup="menu"
            >
              <img
                alt={currentUser.name}
                className="h-8 w-8 rounded-full object-cover shadow-[0_0_0_2px_rgba(0,107,87,0.2)]"
                src={currentUser.avatarUrl}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
                }}
              />
            </button>

            {showUserMenu && (
              <div
                role="menu"
                className="menu-in absolute right-0 top-12 w-60 origin-top-right rounded-xl border border-[#c0c8c5]/40 bg-white py-2 shadow-xl"
              >
                <div className="border-b border-[#e2f0f9] px-3 py-2">
                  <span className="block truncate text-xs font-bold text-[#002620]">{currentUser.name}</span>
                  <span className="block truncate text-[11px] text-[#404846]">{currentUser.roleTitle}</span>
                  <span className="mt-0.5 block text-[10px] font-semibold text-[#006b57]">
                    CA #{currentUser.consumerNumber}
                  </span>
                </div>

                <div className="px-2 pt-2">
                  {currentWorkspaceAccess.household && <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigateTo('/community');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#404846] transition-colors hover:bg-[#e2f0f9] hover:text-[#002620]"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#006b57]">groups</span>
                    <span>Community workspace</span>
                  </button>}
                  {currentWorkspaceAccess.commercial && <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigateTo('/commercial');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#404846] transition-colors hover:bg-[#e2f0f9] hover:text-[#002620]"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#006b57]">store</span>
                    <span>Commercial workspace</span>
                  </button>}
                  {currentWorkspaceAccess.installer && <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigateTo('/installer');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#404846] transition-colors hover:bg-[#e2f0f9] hover:text-[#002620]"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#006b57]">engineering</span>
                    <span>Installer portal</span>
                  </button>}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigateTo('/reports');
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#404846] transition-colors hover:bg-[#e2f0f9] hover:text-[#002620]"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#006b57]">description</span>
                    <span>Internal statements</span>
                  </button>
                </div>

                {isAuthenticated && (
                  <div className="mt-1 border-t border-[#e2f0f9] px-2 pt-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#93000a] transition-colors hover:bg-[#ffdad6]/40"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';

interface NavRoute {
  label: string;
  path: string;
  icon: string;
  category: string;
  badge?: string;
}

const NAV_ROUTES: NavRoute[] = [
  { label: 'Main Dashboard', path: '/dashboard', icon: 'dashboard', category: 'Core' },
  { label: 'Solar Feasibility', path: '/assessment', icon: 'solar_power', category: 'Planning' },
  { label: 'VNM Readiness', path: '/regulations', icon: 'gavel', category: 'Planning' },
  { label: 'Plan Optimiser', path: '/optimiser', icon: 'bolt', category: 'Planning', badge: 'F05' },
  { label: 'Community', path: '/community', icon: 'groups', category: 'Collaboration' },
  { label: 'Credit Reconciliation', path: '/credit-allocation', icon: 'pie_chart', category: 'Collaboration', badge: 'F09' },
  { label: 'Commercial Mall', path: '/commercial', icon: 'store', category: 'Commercial' },
  { label: 'Installer Portal', path: '/installer', icon: 'engineering', category: 'Commercial' },
  { label: 'Provider & O&M', path: '/monitoring', icon: 'query_stats', category: 'Operations' },
  { label: 'Reports & Statements', path: '/reports', icon: 'description', category: 'Operations' },
  { label: 'Governance & Audit', path: '/admin', icon: 'admin_panel_settings', category: 'Governance', badge: 'Gov' }
];

const CATEGORY_META: Record<string, { icon: string; hint: string }> = {
  Core: { icon: 'space_dashboard', hint: 'Overview' },
  Planning: { icon: 'architecture', hint: 'Model & size' },
  Collaboration: { icon: 'handshake', hint: 'Agree & reconcile' },
  Commercial: { icon: 'business', hint: 'B2B workspace' },
  Operations: { icon: 'monitoring', hint: 'Track & report' },
  Governance: { icon: 'verified_user', hint: 'Audit trail' }
};

export const Sidebar: React.FC = () => {
  const { currentPath, navigateTo, isSidebarOpen, setIsSidebarOpen, currentUser, community, logOut, currentWorkspaceAccess } = useApp();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(Array.from(new Set(NAV_ROUTES.map((route) => route.category))).map((category) => [category, true]))
  );

  const categories = useMemo(
    () => Array.from(new Set(NAV_ROUTES.map((route) => route.category))),
    []
  );

  const readiness = Math.min(
    100,
    Math.round((community.committedMembersCount / Math.max(1, community.totalEligibleFlats)) * 100)
  );

  useEffect(() => {
    if (!isSidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSidebarOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 80);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isSidebarOpen, setIsSidebarOpen]);

  const toggleGroup = (category: string) => {
    setOpenGroups((previous) => ({ ...previous, [category]: !previous[category] }));
  };

  return (
    <>
      {/* Scrim: solid translucent layer only, no full-screen backdrop blur */}
      <div
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 z-50 bg-[linear-gradient(100deg,rgba(0,38,32,0.74),rgba(0,38,32,0.38))] transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Drawer: stays mounted so open/close animates without a flash */}
      <aside
        className={`solaris-sidebar fixed bottom-0 left-0 top-0 z-[60] flex w-[300px] max-w-[88vw] flex-col overflow-hidden rounded-r-2xl border-r border-[#e2f0f9] bg-[#f4faff] shadow-[0_24px_70px_-24px_rgba(0,38,32,0.55)] transition-[translate,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isSidebarOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!isSidebarOpen}
        inert={!isSidebarOpen}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[#e2f0f9] px-3.5">
          <button
            type="button"
            onClick={() => {
              navigateTo('/dashboard');
              setIsSidebarOpen(false);
            }}
            className="flex min-w-0 items-center gap-2.5 rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#006b57]/40"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#006b57] text-white shadow-sm">
              <span className="material-symbols-outlined text-[20px]">solar_power</span>
            </span>
            <span className="min-w-0">
              <span className="font-headline block truncate text-sm font-bold leading-none tracking-tight text-[#002620]">
                SOLARIS
              </span>
              <span className="mt-1 block truncate text-[9px] font-semibold tracking-wide text-[#006b57]">
                Together We Shine Brighter
              </span>
            </span>
          </button>
          <button
            ref={closeButtonRef}
            onClick={() => setIsSidebarOpen(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#404846] transition-colors hover:bg-[#e2f0f9]"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Project readiness snapshot */}
        <div className="mx-3 mt-3 shrink-0 rounded-xl border border-[#c0c8c5]/30 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#717976]">Project readiness</span>
            <span className="text-[11px] font-bold text-[#006b57]">{readiness}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e2f0f9]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#006b57] to-[#7ed7bd] transition-[width] duration-500"
              style={{ width: `${readiness}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#717976]">
            <span>
              {community.committedMembersCount} of {community.totalEligibleFlats} flats
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#ca962b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f6bd4f]" />
              Synthetic demo
            </span>
          </div>
        </div>

        {/* User context */}
        <div className="mx-3 my-2.5 flex shrink-0 items-center gap-2.5 rounded-xl border border-[#c0c8c5]/30 bg-white p-2.5 shadow-sm">
          <img
            alt={currentUser.name}
            src={currentUser.avatarUrl}
            className="h-9 w-9 shrink-0 rounded-full object-cover shadow-sm ring-2 ring-[#006b57]/20"
            onError={(event) => {
              (event.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
            }}
          />
          <div className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-[#101d24]">{currentUser.name}</span>
            <span className="block truncate text-[10px] text-[#404846]">{currentUser.roleTitle}</span>
            <span className="block text-[10px] font-semibold text-[#006b57]">CA #{currentUser.consumerNumber}</span>
          </div>
        </div>

        {/* Grouped, collapsible navigation */}
        <div className="sidebar-scroll flex-1 overflow-y-auto px-2.5 pb-3">
          {categories.map((category) => {
            const meta = CATEGORY_META[category] ?? { icon: 'chevron_right', hint: '' };
            const routes = NAV_ROUTES.filter((route) => route.category === category);
            const isOpen = openGroups[category];

            return (
              <div key={category} className="pt-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(category)}
                  aria-expanded={isOpen}
                  aria-controls={`nav-group-${category}`}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[#e2f0f9]/70"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-[#717976]">{meta.icon}</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#717976]">{category}</span>
                    <span className="text-[9px] font-medium text-[#c0c8c5]">· {meta.hint}</span>
                  </span>
                  <span
                    className={`material-symbols-outlined text-[16px] text-[#717976] transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                <div
                  id={`nav-group-${category}`}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="space-y-1 pb-1 pt-1">
                      {routes.map((route) => {
                        const isCommercialRoute = route.path === '/commercial';
                        const isInstallerRoute = route.path === '/installer';
                        const isVisible =
                          !isCommercialRoute && !isInstallerRoute
                          ? true
                          : (isCommercialRoute && currentWorkspaceAccess.commercial)
                            || (isInstallerRoute && currentWorkspaceAccess.installer);

                        if (!isVisible) {
                          return null;
                        }

                        const isActive =
                          currentPath === route.path ||
                          (route.path !== '/' && currentPath.startsWith(route.path));

                        return (
                          <button
                            key={route.path}
                            onClick={() => {
                              navigateTo(route.path);
                              setIsSidebarOpen(false);
                            }}
                            aria-current={isActive ? 'page' : undefined}
                            className={`group flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-[11px] font-semibold transition-colors ${
                              isActive
                                ? 'bg-[#006b57] text-white shadow-sm'
                                : 'text-[#404846] hover:bg-[#e2f0f9] hover:text-[#002620]'
                            }`}
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-white/15 text-[#9af4d8]'
                                  : 'bg-[#e2f0f9] text-[#006b57] group-hover:bg-[#d6e5ee]'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[16px]">{route.icon}</span>
                            </span>
                            <span className="min-w-0 flex-1 truncate">{route.label}</span>
                            {route.badge && (
                              <span
                                className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                  route.badge === 'Gov'
                                    ? 'bg-[#ffdea7] text-[#271900]'
                                    : isActive
                                      ? 'bg-white/20 text-white'
                                      : 'bg-[#9af4d8] text-[#002019]'
                                }`}
                              >
                                {route.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 space-y-2 border-t border-[#e2f0f9] bg-[#f4faff] p-3">
          <button
            onClick={logOut}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold text-[#93000a] transition-colors hover:bg-[#ffdad6]/40"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Log out</span>
          </button>
          <div className="flex items-center justify-between text-[10px] text-[#717976]">
            <span>Delhi DERC · synthetic demo</span>
            <span className="font-mono font-medium text-[#006b57]">v2.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};

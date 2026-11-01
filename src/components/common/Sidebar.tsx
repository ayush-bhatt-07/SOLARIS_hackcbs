import React from 'react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { currentPath, navigateTo, isSidebarOpen, setIsSidebarOpen, currentUser, logOut } = useApp();

  const primaryRoutes = [
    { label: 'Main Dashboard', path: '/dashboard', icon: 'dashboard', category: 'Core' },
    { label: 'Economics Studio', path: '/commercial', icon: 'query_stats', category: 'Commercial' },
    { label: 'Solar Assessment', path: '/assessment', icon: 'calculate', category: 'Planning' },
    { label: 'Regulatory Checker', path: '/regulations', icon: 'gavel', category: 'Planning' },
    { label: 'Smart Optimiser', path: '/optimiser', icon: 'bolt', category: 'Planning' },
    { label: 'Community Workspace', path: '/community', icon: 'groups', category: 'Collaboration' },
    { label: 'Credit Allocation', path: '/credit-allocation', icon: 'pie_chart', category: 'Collaboration' },
    { label: 'Solar Monitoring', path: '/monitoring', icon: 'query_stats', category: 'Operations' },
    { label: 'Reports & Export', path: '/reports', icon: 'description', category: 'Operations' },
    { label: 'Admin & Audit Console', path: '/admin', icon: 'admin_panel_settings', category: 'Governance' },
  ];

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={() => setIsSidebarOpen(false)}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in"
        aria-hidden="true"
      />

      {/* Sidebar Drawer - overlays content on all screen sizes */}
      <aside
        className="fixed top-0 bottom-0 left-0 w-72 bg-[#f4faff] border-r border-[#e2f0f9] z-50 flex flex-col shadow-2xl animate-in slide-in-from-left"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 border-b border-[#e2f0f9] flex items-center justify-between">
          <div 
            onClick={() => {
              navigateTo('/dashboard');
              setIsSidebarOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img 
              alt="Solaris Emblem" 
              className="h-7 w-auto object-contain" 
              src="https://lh3.googleusercontent.com/aida/AEtjO1VRQ3ag_QUrg4F0RpgjDeg7dO5VcOfyaoOVMnuIl2OAGmbDHOYUxs2eERwlsekc4X4YPZEiFGfPCJ2p0zPYO7kbJQLSUvF3z2dlANCijd68Bpca06A2Vi1uqrvQPl7TnFRfFCSB0SsHgvs3NVpLhyvpNDZV4E-ZtB3wqovkmmQ2Zo6GtMJaSipNp0Sqqlz489QzoJnctAEJd_LUXI1cKHjEkUq_qibBtcKFTkSBu623vnQUNoBl2byPwHQ"
            />
            <div>
              <span className="font-headline font-bold text-[#002620] tracking-tight text-base block leading-none">
                SOLARIS
              </span>
              <span className="text-[10px] text-[#006b57] font-semibold tracking-wide">
                Together We Shine Brighter
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#404846] hover:bg-[#e2f0f9] transition-colors"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* User Context Card */}
        <div className="p-3 mx-3 my-2.5 rounded-xl bg-white border border-[#c0c8c5]/30 shadow-sm flex items-center gap-2.5">
          <img 
            alt={currentUser.name} 
            src={currentUser.avatarUrl} 
            className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm ring-2 ring-[#006b57]/20"
          />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-[#101d24] block truncate">{currentUser.name}</span>
            <span className="text-[10px] text-[#404846] block truncate">{currentUser.roleTitle}</span>
            <span className="text-[10px] text-[#006b57] font-semibold block">CA #{currentUser.consumerNumber}</span>
          </div>
        </div>

        {/* Navigation Routes List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {primaryRoutes.map((route) => {
            const isActive = currentPath === route.path || (route.path !== '/' && currentPath.startsWith(route.path));
            return (
              <button
                key={route.path}
                onClick={() => {
                  navigateTo(route.path);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#006b57] text-white shadow-sm'
                    : 'text-[#404846] hover:bg-[#e2f0f9] hover:text-[#002620]'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${isActive ? 'text-[#9af4d8]' : 'text-[#006b57]'}`}>
                  {route.icon}
                </span>
                <span className="truncate flex-1">{route.label}</span>
                {route.path === '/commercial' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#006b57] text-[#9af4d8] font-bold">
                    B2B
                  </span>
                )}
                {route.path === '/admin' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ffdea7] text-[#271900] font-bold">
                    Gov
                  </span>
                )}
                {route.path === '/optimiser' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#9af4d8] text-[#002019] font-bold">
                    AI Solv
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#e2f0f9] bg-[#f4faff] space-y-2">
          <button
            onClick={logOut}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-[#93000a] hover:bg-[#ffdad6]/40 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Log out</span>
          </button>
          <div className="flex items-center justify-between text-[11px] text-[#717976]">
            <span>Delhi DERC VNM 2024</span>
            <span className="text-[#006b57] font-medium font-mono">v2.4 LTS</span>
          </div>
        </div>
      </aside>
    </>
  );
};

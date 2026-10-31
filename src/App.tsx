import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { Sidebar } from './components/common/Sidebar';
import { ConsentModal } from './components/common/ConsentModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { RegulationsPage } from './pages/RegulationsPage';
import { CommunityPage } from './pages/CommunityPage';
import { OptimiserPage } from './pages/OptimiserPage';
import { CreditAllocationPage } from './pages/CreditAllocationPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { CommercialPage } from './pages/CommercialPage';
import { InstallerPage } from './pages/InstallerPage';
import { HeliosWidget } from './components/common/HeliosWidget';

const RouterView: React.FC = () => {
  const { currentPath, isAuthenticated, navigateTo, currentUser, currentWorkspaceAccess } = useApp();
  const isLogin = currentPath === '/login' || currentPath.startsWith('/login/');
  const isSignup = currentPath === '/signup' || currentPath.startsWith('/signup/');
  const isPublicPath = currentPath === '/' || isLogin || isSignup;
  const isBusiness = currentWorkspaceAccess.commercial && !currentWorkspaceAccess.household;
  const home = isBusiness ? '/commercial' : '/dashboard';
  const isCommercialPath = currentPath === '/commercial';
  const isInstallerPath = currentPath === '/installer';
  const needsOnboarding = currentUser?.needsOnboarding === true;
  const hasCompletedOnboarding = currentUser?.onboardingCompleted === true;

  useEffect(() => {
    if (!isAuthenticated && !isPublicPath) {
      navigateTo('/');
    } else if (isAuthenticated && (isLogin || isSignup)) {
      navigateTo(home);
    } else if (isAuthenticated && isBusiness && !isPublicPath && !isCommercialPath) {
      navigateTo('/commercial');
    } else if (isAuthenticated && needsOnboarding && currentPath !== '/onboarding') {
      navigateTo('/onboarding');
    } else if (isAuthenticated && hasCompletedOnboarding && currentPath === '/onboarding') {
      navigateTo('/dashboard');
    } else if (isAuthenticated && (isCommercialPath || isInstallerPath)) {
      const isAllowed = isCommercialPath
        ? currentUser?.role === 'msme' || currentUser?.role === 'commercial_property_owner' || currentUser?.role === 'facility_manager' || currentUser?.role === 'shop_tenant' || currentUser?.role === 'platform_admin'
        : currentUser?.role === 'installer_partner' || currentUser?.role === 'installer_admin' || currentUser?.role === 'installer_engineer' || currentUser?.role === 'platform_admin';
      if (!isAllowed) {
        navigateTo('/dashboard');
      }
    }
  }, [currentPath, isAuthenticated, isPublicPath, isCommercialPath, isInstallerPath, needsOnboarding, hasCompletedOnboarding, currentUser, navigateTo]);

  const getSubtitle = () => {
    switch (currentPath) {
      case '/':
        return 'Public Showcase';
      case '/dashboard':
        return 'Community solar command centre';
      case '/onboarding':
        return 'Location & profile setup';
      case '/assessment':
        return 'Solar feasibility calculator · F04';
      case '/regulations':
        return 'VNM readiness · F02';
      case '/community':
        return 'Community workspace · F01';
      case '/optimiser':
        return 'Benefit-aware plan optimiser · F05';
      case '/credit-allocation':
        return 'Credit reconciliation · F09';
      case '/monitoring':
        return 'Provider & O&M evidence · F07';
      case '/reports':
        return 'Statements & plan-vs-actual · F08/F10';
      case '/admin':
        return 'Rules, approvals & audit ledger';
      case '/commercial':
        return 'Commercial property solar workspace';
      case '/installer':
        return 'Installer portal · project pipeline';
      default:
        if (currentPath.startsWith('/community')) {
          return 'Community workspace · F01';
        }
        return 'Community solar command centre';
    }
  };

  const renderContent = () => {
    if (isLogin) return <LoginPage key={currentPath} />;
    if (isSignup) return <SignupPage key={currentPath} />;
    if (isAuthenticated && !isPublicPath && isBusiness) return <CommercialPage key={currentUser.id} />;
    if (isCommercialPath && !currentWorkspaceAccess.commercial) return <DashboardPage />;
    if (isInstallerPath && !currentWorkspaceAccess.installer) return <DashboardPage />;
    switch (currentPath) {
      case '/':
        return <LandingPage />;
      case '/login':
        return <LoginPage />;
      case '/signup':
        return <SignupPage />;
      case '/dashboard':
        return <DashboardPage />;
      case '/onboarding':
        return <OnboardingPage />;
      case '/assessment':
        return <AssessmentPage />;
      case '/regulations':
        return <RegulationsPage />;
      case '/community':
        return <CommunityPage />;
      case '/optimiser':
        return <OptimiserPage />;
      case '/credit-allocation':
        return <CreditAllocationPage />;
      case '/monitoring':
        return <MonitoringPage />;
      case '/reports':
        return <ReportsPage />;
      case '/admin':
        return <AdminPage />;
      case '/commercial':
        return <CommercialPage />;
      case '/installer':
        return <InstallerPage />;
      default:
        if (currentPath.startsWith('/community')) {
          return <CommunityPage />;
        }
        return <DashboardPage />;
    }
  };

  const showAppShell = isAuthenticated && !isPublicPath;
  const content = !isAuthenticated && !isPublicPath ? <LandingPage /> : renderContent();

  if (showAppShell && isBusiness) return <><CommercialPage key={`business-${currentUser.id}`} /><HeliosWidget key={`helios-${currentUser.id}`} /></>;

  return (
    <div className="min-h-screen bg-[#F8FAF7] text-[#1C2930] flex flex-col antialiased selection:bg-[#9af4d8] selection:text-[#00725d]">
      {showAppShell ? (
        <>
          <Header subtitle={getSubtitle()} />
          <main className="flex-1 w-full pt-20 pb-20 md:pb-8">
            {content}
          </main>
          <Sidebar />
          <BottomNav />
          <ConsentModal />
          <HeliosWidget />
        </>
      ) : (
        <>
          <main className="flex-1 w-full">{content}</main>
          <HeliosWidget />
        </>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <RouterView />
    </AppProvider>
  );
}

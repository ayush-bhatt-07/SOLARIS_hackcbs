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

const RouterView: React.FC = () => {
  const { currentPath, isAuthenticated, navigateTo, currentUser } = useApp();
  const isPublicPath = currentPath === '/' || currentPath === '/login' || currentPath === '/signup';
  const needsOnboarding = currentUser?.needsOnboarding === true;
  const hasCompletedOnboarding = currentUser?.onboardingCompleted === true;

  useEffect(() => {
    if (!isAuthenticated && !isPublicPath) {
      navigateTo('/');
    } else if (isAuthenticated && (currentPath === '/login' || currentPath === '/signup')) {
      navigateTo('/dashboard');
    } else if (isAuthenticated && needsOnboarding && currentPath !== '/onboarding') {
      // Redirect to onboarding only for new signups
      navigateTo('/onboarding');
    } else if (isAuthenticated && hasCompletedOnboarding && currentPath === '/onboarding') {
      // Redirect away from onboarding if already completed
      navigateTo('/dashboard');
    }
  }, [currentPath, isAuthenticated, isPublicPath, needsOnboarding, hasCompletedOnboarding, navigateTo]);

  const getSubtitle = () => {
    switch (currentPath) {
      case '/':
        return 'Public Showcase';
      case '/dashboard':
        return 'Main Dashboard';
      case '/onboarding':
        return 'Location & Profile Setup';
      case '/assessment':
        return 'Solar Feasibility Calculator';
      case '/regulations':
        return 'Regulatory Eligibility Checker';
      case '/community':
        return 'Community Solar Workspace';
      case '/optimiser':
        return 'Smart Affordability Optimiser';
      case '/credit-allocation':
        return 'Transparent Credit Allocation';
      case '/monitoring':
        return 'Synthetic O&M Monitoring';
      case '/reports':
        return 'Reports & Statutory Statements';
      case '/admin':
        return 'Rules & Audit Ledger';
      case '/commercial':
        return 'Commercial Solar & Economics Studio';
      default:
        if (currentPath.startsWith('/community')) {
          return 'Community Solar Workspace';
        }
        return 'Main Dashboard';
    }
  };

  const renderContent = () => {
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
      default:
        if (currentPath.startsWith('/community')) {
          return <CommunityPage />;
        }
        return <DashboardPage />;
    }
  };

  const showAppShell = isAuthenticated && !isPublicPath;
  const content = !isAuthenticated && !isPublicPath ? <LandingPage /> : renderContent();

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
        </>
      ) : (
        <main className="flex-1 w-full">{content}</main>
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

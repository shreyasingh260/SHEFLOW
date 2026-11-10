import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HealthProvider } from './context/HealthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import FloraChatPage from './pages/FloraChatPage';
import HormoneEnergyPage from './pages/HormoneEnergyPage';
import PhaseNutritionPage from './pages/PhaseNutritionPage';
import ProductsPage from './pages/ProductsPage';
import WashroomsPage from './pages/WashroomsPage';
import ProfilePage from './pages/ProfilePage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import EmergencyModal from './components/EmergencyModal';
import LogModal from './components/LogModal';

const PROTECTED = ['dashboard', 'flora', 'products', 'washrooms', 'profile', 'hormone-energy', 'nutrition'];

function AppContent() {
  const { isAuthenticated, loading, onboardingDone, user } = useAuth();
  const [currentView, setCurrentView] = useState('landing');
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [logModalState, setLogModalState] = useState({ isOpen: false, tab: 'symptoms' });

  const isUserOnboarded = Boolean(onboardingDone || user?.onboardingDone);

  /* ── Sync view with URL hash ── */
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'landing';

      // Authenticated + onboarding pending → force onboarding
      if (isAuthenticated && !isUserOnboarded && !loading) {
        if (hash !== 'onboarding') {
          setCurrentView('onboarding');
          window.location.hash = 'onboarding';
        }
        return;
      }

      // If user is onboarded, navigating to #onboarding should redirect to dashboard
      if (isAuthenticated && isUserOnboarded && hash === 'onboarding') {
        setCurrentView('dashboard');
        window.location.hash = 'dashboard';
        return;
      }

      // Protected route guard
      if (PROTECTED.includes(hash)) {
        if (!isAuthenticated && !loading) {
          setCurrentView('login');
          window.location.hash = 'login';
        } else {
          setCurrentView(hash);
        }
      } else {
        setCurrentView(hash);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [isAuthenticated, loading, isUserOnboarded]);

  const navigateTo = (view) => {
    window.location.hash = view;
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLogModal = (tab = 'symptoms') =>
    setLogModalState({ isOpen: true, tab });

  /* ── Loading spinner ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5F7] flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-[3px] border-[#FFC2D1] border-t-[#E83D6F] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#E83D6F] uppercase tracking-wider">Loading SheFlow...</p>
        </div>
      </div>
    );
  }

  /* ── PUBLIC ROUTES ── */
  if (currentView === 'landing') {
    return (
      <LandingPage
        onNavigateLogin={() => navigateTo('login')}
        onNavigateSignup={() => navigateTo('signup')}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onNavigateSignup={() => navigateTo('signup')}
        onNavigateForgotPassword={() => navigateTo('forgot-password')}
        onLoginSuccess={(res) => {
          if (res?.onboardingDone === true) {
            navigateTo('dashboard');
          } else {
            navigateTo('onboarding');
          }
        }}
      />
    );
  }

  if (currentView === 'signup') {
    return (
      <SignupPage
        onNavigateLogin={() => navigateTo('login')}
        onSignupSuccess={() => navigateTo('onboarding')}
      />
    );
  }

  if (currentView === 'forgot-password') {
    return <ForgotPasswordPage onNavigateLogin={() => navigateTo('login')} />;
  }

  /* ── ONBOARDING (authenticated but not onboarded) ── */
  if (currentView === 'onboarding') {
    if (!isAuthenticated) {
      navigateTo('login');
      return null;
    }
    if (isUserOnboarded) {
      navigateTo('dashboard');
      return null;
    }
    return (
      <OnboardingPage
        onComplete={() => navigateTo('dashboard')}
      />
    );
  }

  /* ── UNAUTHENTICATED → redirect to login ── */
  if (!isAuthenticated) {
    return (
      <LoginPage
        onNavigateSignup={() => navigateTo('signup')}
        onNavigateForgotPassword={() => navigateTo('forgot-password')}
        onLoginSuccess={(res) => {
          if (res?.onboardingDone === true) {
            navigateTo('dashboard');
          } else {
            navigateTo('onboarding');
          }
        }}
      />
    );
  }

  /* ── AUTHENTICATED + ONBOARDED: Authenticated but hasn't completed onboarding ── */
  if (!isUserOnboarded) {
    return (
      <OnboardingPage
        onComplete={() => navigateTo('dashboard')}
      />
    );
  }

  /* ── PROTECTED DASHBOARD SHELL ── */
  return (
    <HealthProvider>
      <div className="min-h-screen bg-[#FFF5F7] flex text-[#2D1420] font-sans antialiased">
        <Sidebar
          currentView={currentView}
          setView={navigateTo}
          onOpenEmergency={() => setEmergencyOpen(true)}
          onOpenLogModal={handleOpenLogModal}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Header
            onNavigateProfile={() => navigateTo('profile')}
            onNavigateLanding={() => navigateTo('landing')}
          />

          <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
            {currentView === 'dashboard' && (
              <DashboardPage
                onOpenEmergency={() => setEmergencyOpen(true)}
                onNavigateFlora={() => navigateTo('flora')}
                onNavigateHormones={() => navigateTo('hormone-energy')}
                onNavigateNutrition={() => navigateTo('nutrition')}
              />
            )}
            {currentView === 'hormone-energy' && (
              <HormoneEnergyPage
                onBack={() => navigateTo('dashboard')}
                onNavigateFlora={() => navigateTo('flora')}
                onNavigateNutrition={() => navigateTo('nutrition')}
              />
            )}
            {currentView === 'nutrition' && (
              <PhaseNutritionPage
                onBack={() => navigateTo('dashboard')}
                onNavigateFlora={() => navigateTo('flora')}
                onNavigateHormones={() => navigateTo('hormone-energy')}
              />
            )}
            {currentView === 'flora' && (
              <FloraChatPage
                onNavigateEmergency={() => setEmergencyOpen(true)}
                onNavigateHormones={() => navigateTo('hormone-energy')}
                onNavigateNutrition={() => navigateTo('nutrition')}
              />
            )}
            {currentView === 'products' && <ProductsPage onBack={() => navigateTo('dashboard')} />}
            {currentView === 'washrooms' && <WashroomsPage onBack={() => navigateTo('dashboard')} />}
            {currentView === 'profile' && <ProfilePage onBack={() => navigateTo('dashboard')} />}
          </main>
        </div>

        <EmergencyModal 
          isOpen={emergencyOpen} 
          onClose={() => setEmergencyOpen(false)} 
          onNavigateProfile={() => { setEmergencyOpen(false); navigateTo('profile'); }}
        />
        <LogModal
          isOpen={logModalState.isOpen}
          initialTab={logModalState.tab}
          onClose={() => setLogModalState({ isOpen: false, tab: 'symptoms' })}
        />
      </div>
    </HealthProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

import { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import { useFinanceStore } from './store/useFinanceStore';
import { Auth } from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import ResetPassword from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import { Toaster } from 'sonner';
import About from './pages/About';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import { LoadingProvider, useLoadingContext } from './context/LoadingContext';
import { Loader } from './components/common/Loader';
import TestAuthPanel from './components/TestAuthPanel';
import { MainLayout } from './components/Layout/MainLayout';
import { AccountsView } from './components/Accounts/AccountsView';
import { TransactionsView } from './components/Transactions/TransactionsView';
import { TransfersView } from './components/Transfers/TransfersView';
import { SavingsView } from './components/Savings/SavingsView';
import { PurchaseTracker } from './components/Purchases/PurchaseTracker';
import LendBorrowPage from './pages/LendBorrow';
import { PurchaseCategories } from './components/Purchases/PurchaseCategories';
import { PurchaseAnalytics } from './components/Purchases/PurchaseAnalytics';
import { LendBorrowAnalytics } from './components/LendBorrow/LendBorrowAnalytics';
import { AnalyticsView } from './components/Reports/AnalyticsView';
import { CurrencyAnalytics } from './components/Reports/CurrencyAnalytics';
import { Settings } from './components/Dashboard/Settings';
import HelpAndSupport from './pages/HelpAndSupport';
import { History } from './pages/History';
import { HelpLayout } from './components/Layout/HelpLayout';
import DonationsSavingsPage from './pages/DonationsSavingsPage';
import { FavoriteQuotes } from './pages/FavoriteQuotes';
import { WelcomeModal } from './components/common/WelcomeModal';
import PostAccountCreationTour from './components/PostAccountCreationTour';
import { Analytics } from '@vercel/analytics/react';
import { useNotificationStore } from './store/notificationStore';
import { MobileSidebarProvider } from './context/MobileSidebarContext';
import KBArticlePage from './pages/KBArticlePage';
import AdminPage from './pages/AdminPage';
import { useThemeStore } from './store/themeStore';

function AppContent() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const checkAuthState = useAuthStore((state) => state.checkAuthState);
  const { isDarkMode } = useThemeStore();
  const handleEmailConfirmation = useAuthStore((state) => state.handleEmailConfirmation);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const { isLoading: globalLoading, loadingMessage } = useLoadingContext();
  const location = useLocation();
  
  // Welcome modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeModalChecked, setWelcomeModalChecked] = useState(false);
  
  // Post-account creation tour state
  const [showPostAccountTour, setShowPostAccountTour] = useState(false);
  const { accounts, fetchAccounts } = useFinanceStore();
  const { initializeDefaultNotifications } = useNotificationStore();
  
  // Function to trigger post-account creation tour
  const handleStartPostAccountTour = () => {
    // Reset first, then set to true to ensure clean state
    setShowPostAccountTour(false);
    setTimeout(() => {
      setShowPostAccountTour(true);
    }, 100);
  };
  


  // Initialize theme on app load
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        const currentUser = session?.user;
        const { setUserAndProfile } = useAuthStore.getState();
        
        // CRITICAL: Check if we're in the middle of registration
        const isRegistrationInProgress = sessionStorage.getItem('registrationInProgress') === 'true';
        if (isRegistrationInProgress) {
          return;
        }
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            if (currentUser) {
              await setUserAndProfile(currentUser, null);
            }
            break;
            
          case 'USER_UPDATED':
            if (currentUser) {
              await setUserAndProfile(currentUser, null);
            }
            break;
            
          case 'SIGNED_OUT':
            // Don't clear success message when signing out
            const currentState = useAuthStore.getState();
            useAuthStore.setState({
              ...currentState,
              user: null,
              profile: null
            });
            break;
            
          case 'TOKEN_REFRESHED':
            if (currentUser && currentUser.email_confirmed_at) {
              setUserAndProfile(currentUser, null);
            } else if (currentUser && !currentUser.email_confirmed_at) {
              const currentState = useAuthStore.getState();
              useAuthStore.setState({
                ...currentState,
                user: null,
                profile: null
              });
            }
            break;
            
          default:
            break;
        }
      }
    );
    
    const initializeSession = async () => {
      // Add a timeout to prevent infinite hanging
      const timeoutId = setTimeout(() => {
        console.log('Session initialization timeout - forcing completion');
        setLoading(false);
      }, 10000); // 10 second timeout
      
      try {
        // Check if this is an email confirmation redirect
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session:', error);
          } else if (data.user) {
            await handleEmailConfirmation();
          }
        }
        
        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;
        const { setUserAndProfile } = useAuthStore.getState();
        
        if (currentUser && currentUser.email_confirmed_at) {
          // Only create profile for confirmed users - wait for it to complete
          console.log('Initializing session for confirmed user:', currentUser.id);
          try {
          await setUserAndProfile(currentUser, null);
          console.log('Profile initialization completed');
          } catch (error) {
            console.error('Error in setUserAndProfile:', error);
            // Continue anyway to prevent hanging
          }
        } else {
          // For unconfirmed users or no user, just set null without creating profile
          console.log('No confirmed user found, setting null profile');
          setUserAndProfile(null, null);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    
    initializeSession();
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [handleEmailConfirmation]);

  // Initialize notifications when user is authenticated
  useEffect(() => {
    if (user && !loading) {
      initializeDefaultNotifications();
      // Add help center notification for existing users
      const { addHelpCenterNotification } = useNotificationStore.getState();
      addHelpCenterNotification();
    }
  }, [user, loading, initializeDefaultNotifications]);

  // Check for premium intent after authentication
  useEffect(() => {
    if (user && !loading && profile) {
      // Check for premium intent first
      const premiumIntent = localStorage.getItem('premiumIntent');
      if (premiumIntent) {
        try {
          const intent = JSON.parse(premiumIntent);
          // Check if intent is recent (within 1 hour)
          if (Date.now() - intent.timestamp < 3600000) {
            localStorage.removeItem('premiumIntent');
            // Navigate to settings with plans tab
            setTimeout(() => {
              window.location.href = '/settings?tab=plans-usage';
            }, 1000);
            return;
          } else {
            // Remove expired intent
            localStorage.removeItem('premiumIntent');
          }
        } catch (error) {
          console.error('Error parsing premium intent:', error);
          localStorage.removeItem('premiumIntent');
        }
      }
    }
  }, [user, loading, profile]);

  // Check if user has accounts and show welcome modal if needed
  useEffect(() => {
    if (user && !loading) {
      const checkAndShowWelcomeModal = async () => {
        try {
          // Add a timeout to prevent hanging
          const timeoutId = setTimeout(() => {
            // If we timeout, assume new user and show modal
            setShowWelcomeModal(true);
            setWelcomeModalChecked(true);
          }, 5000); // 5 second timeout
          
          // First, fetch accounts to get the real count
          await fetchAccounts();
          
          // Get fresh accounts count after fetch
          const freshAccounts = useFinanceStore.getState().accounts;
          const hasAccounts = freshAccounts.length > 0;
          
          // Clear timeout since we got results
          clearTimeout(timeoutId);
          
          // Only show modal if user has NO accounts (regardless of default currency)
          if (!hasAccounts) {
            setShowWelcomeModal(true);
          } else {
            setShowWelcomeModal(false);
          }
          
          // Mark as checked to prevent re-running when profile loads
          setWelcomeModalChecked(true);
        } catch (error) {
          console.error('Error checking welcome modal conditions:', error);
          // On error, assume new user and show modal
          setShowWelcomeModal(true);
          setWelcomeModalChecked(true);
        }
      };
      
      checkAndShowWelcomeModal();
    }
  }, [user, loading, profile, fetchAccounts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
          Loading Balanze...
        </div>
      </div>
    );
  }

  return (
    <>
      <Loader isLoading={globalLoading} message={loadingMessage} />
      <Toaster 
        position="top-right" 
        richColors 
        expand={true}
        closeButton={true}
        duration={4000}
        theme="light"
        style={{
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          fontSize: '14px',
          fontWeight: '500',
          marginTop: '40px'
        }}
      />
      <Routes>
        <Route path="/" element={user ? <Dashboard /> : <LandingPage />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Auth />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Auth />} />
        <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        
        {/* Dashboard routes - all protected */}
        <Route path="/accounts" element={user ? <MainLayout><AccountsView /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/transactions" element={user ? <MainLayout><TransactionsView /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/transfers" element={user ? <MainLayout><TransfersView /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/savings" element={user ? <MainLayout><SavingsView /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/purchases" element={user ? <MainLayout><PurchaseTracker /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/lent-borrow" element={user ? <MainLayout><LendBorrowPage /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/purchase-categories" element={user ? <MainLayout><PurchaseCategories /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/purchase-analytics" element={user ? <MainLayout><PurchaseAnalytics /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/lent-borrow-analytics" element={user ? <MainLayout><LendBorrowAnalytics /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/analytics" element={user ? <MainLayout><AnalyticsView /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/currency-analytics" element={user ? <MainLayout><CurrencyAnalytics /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <MainLayout><Settings /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/help" element={user ? <HelpLayout><HelpAndSupport /></HelpLayout> : <Navigate to="/login" />} />
        <Route path="/kb/:slug" element={user ? <HelpLayout><KBArticlePage /></HelpLayout> : <Navigate to="/login" />} />
        <Route path="/admin" element={user ? <AdminPage /> : <Navigate to="/login" />} />
        <Route path="/history" element={user ? <MainLayout><History /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/donations" element={user ? <MainLayout><DonationsSavingsPage /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/favorite-quotes" element={user ? <MainLayout><FavoriteQuotes /></MainLayout> : <Navigate to="/login" />} />
        
        {/* Public routes */}
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/termsofservice" element={<TermsOfService />} />
        <Route path="/refundpolicy" element={<RefundPolicy />} />
      </Routes>
      
      {/* Welcome Modal for new users without accounts */}
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)}
        onStartTour={handleStartPostAccountTour}
      />
      
      {/* Post-Account Creation Tour */}
      <PostAccountCreationTour
        isOpen={showPostAccountTour}
        onClose={() => setShowPostAccountTour(false)}
        onComplete={() => {
          setShowPostAccountTour(false);
        }}
      />
    </>
  );
}

function App() {
  return (
    <LoadingProvider>
      <MobileSidebarProvider>
        <Router>
          <AppContent />
        </Router>
        {/* Test Panels - Only show in development */}
        {import.meta.env.DEV && (
          <>
            <TestAuthPanel />
          </>
        )}
        <Analytics />
      </MobileSidebarProvider>
    </LoadingProvider>
  );
}

export default App;
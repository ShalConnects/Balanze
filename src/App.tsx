import { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
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
import { PaymentHistoryPage } from './pages/PaymentHistoryPage';
import HelpAndSupport from './pages/HelpAndSupport';
import { History } from './pages/History';
import { HelpLayout } from './components/Layout/HelpLayout';
import { PublicHelpLayout } from './components/Layout/PublicHelpLayout';
import PublicHelpCenter from './pages/PublicHelpCenter';
import PublicArticlePage from './pages/PublicArticlePage';
import SitemapPage from './pages/SitemapPage';
import RobotsTxtPage from './pages/RobotsTxtPage';
import DonationsSavingsPage from './pages/DonationsSavingsPage';
import { FavoriteQuotes } from './pages/FavoriteQuotes';
import { WelcomeModal } from './components/common/WelcomeModal';
import PostAccountCreationTour from './components/PostAccountCreationTour';
import { Analytics } from '@vercel/analytics/react';
import { useNotificationStore } from './store/notificationStore';
import { useNotificationsStore } from './stores/notificationsStore';
import { urgentNotificationService } from './lib/urgentNotifications';
import { MobileSidebarProvider } from './context/MobileSidebarContext';
import KBArticlePage from './pages/KBArticlePage';
import KBSitemapPage from './pages/KBSitemapPage';
import KBRobotsPage from './pages/KBRobotsPage';
import AdminPage from './pages/AdminPage';
import { FileRenameAdmin } from './pages/FileRenameAdmin';
import DashboardDemo from './pages/DashboardDemo';
import DashboardDemoOnly from './pages/DashboardDemoOnly';
import ShortUrlRedirect from './pages/ShortUrlRedirect';
import { useThemeStore } from './store/themeStore';
import { AppInstallBanner } from './components/AppInstallBanner';
import { PullToRefresh } from './components/PullToRefresh';

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
  const { accounts, fetchAccounts, fetchAllData } = useFinanceStore();
  const { initializeDefaultNotifications } = useNotificationStore();
  const { fetchNotifications } = useNotificationsStore();
  
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

  // Detect Capacitor/Android and add class for status bar padding
  useEffect(() => {
    const isCapacitor = window.Capacitor !== undefined;
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isCapacitor && isAndroid) {
      document.body.classList.add('capacitor-android');
    }
  }, []);

  // SMART Pull-to-Refresh: Refresh at top, scroll everywhere else
  useEffect(() => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // Setup body constraints for proper scrolling
      const setBodyHeight = () => {
        document.body.style.height = '100vh';
        document.body.style.position = 'fixed';
        document.body.style.overflow = 'hidden';
        document.body.style.width = '100%';
        
        const rootElement = document.getElementById('root');
        if (rootElement) {
          rootElement.style.height = '100vh';
          rootElement.style.overflowY = 'auto';
          rootElement.style.overflowX = 'hidden';
          rootElement.style.WebkitOverflowScrolling = 'touch';
          rootElement.style.overscrollBehavior = 'auto'; // Allow overscroll for refresh
        }
      };
      
      setBodyHeight();
      window.addEventListener('resize', setBodyHeight);
      
      // SMART REFRESH LOGIC
      let startY = 0;
      let isPulling = false;
      const rootElement = document.getElementById('root');
      
      const handleTouchStart = (e: TouchEvent) => {
        if (!rootElement) return;
        startY = e.touches[0].clientY;
        isPulling = rootElement.scrollTop === 0; // Only allow refresh at top
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        if (!rootElement || !isPulling) return;
        
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        const isAtTop = rootElement.scrollTop === 0;
        
        // Smart behavior:
        // - At top + pulling down (deltaY > 0) → Allow refresh
        // - Not at top → Normal scroll (no refresh)
        if (isAtTop && deltaY > 80) {
          // User pulled down more than 80px at top
          // Allow the overscroll to trigger browser refresh
          // Don't preventDefault - let it happen naturally
        }
      };
      
      const handleTouchEnd = () => {
        isPulling = false;
      };
      
      if (rootElement) {
        rootElement.addEventListener('touchstart', handleTouchStart, { passive: true });
        rootElement.addEventListener('touchmove', handleTouchMove, { passive: true });
        rootElement.addEventListener('touchend', handleTouchEnd, { passive: true });
      }
      
      return () => {
        window.removeEventListener('resize', setBodyHeight);
        if (rootElement) {
          rootElement.removeEventListener('touchstart', handleTouchStart);
          rootElement.removeEventListener('touchmove', handleTouchMove);
          rootElement.removeEventListener('touchend', handleTouchEnd);
          rootElement.style.height = '';
          rootElement.style.overflowY = '';
          rootElement.style.overflowX = '';
          rootElement.style.WebkitOverflowScrolling = '';
          rootElement.style.overscrollBehavior = '';
        }
        document.body.style.height = '';
        document.body.style.position = '';
        document.body.style.overflow = '';
        document.body.style.width = '';
      };
    }
    
    return () => {};
  }, []);



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

          try {
          await setUserAndProfile(currentUser, null);

          } catch (error) {

            // Continue anyway to prevent hanging
          }
        } else {
          // For unconfirmed users or no user, just set null without creating profile

          setUserAndProfile(null, null);
        }
      } catch (error) {

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
      
      // Check for urgent notifications (overdue lent/borrow records)
      urgentNotificationService.checkAndCreateUrgentNotifications(user.id);
      
      // Force check urgent notifications immediately (bypasses time interval)
      urgentNotificationService.forceCheckUrgentNotifications(user.id);
      
      // Fetch notifications from database
      fetchNotifications();
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

          // On error, assume new user and show modal
          setShowWelcomeModal(true);
          setWelcomeModalChecked(true);
        }
      };
      
      checkAndShowWelcomeModal();
    }
  }, [user, loading, profile, fetchAccounts]);

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    if (user) {
      await fetchAllData();
    }
  };

  if (loading) {
    return <Loader isLoading={true} message="Loading Balanze..." />;
  }

  return (
    <>
      {/* Pull-to-Refresh Component - Only for logged-in users */}
      {user && <PullToRefresh onRefresh={handleRefresh} />}
      
      {/* App Install Banner - Bottom Banner (Option B) */}
      {/* Only shows on Android mobile browsers, not in app or desktop */}
      <AppInstallBanner position="bottom" />

      <Loader isLoading={globalLoading} message={loadingMessage} />
      <Toaster 
        position="top-right" 
        richColors 
        expand={false}
        closeButton={true}
        duration={4000}
        theme="light"
        style={{
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          fontSize: '14px',
          fontWeight: '500',
          marginTop: '20px'
        }}
        toastOptions={{
          style: {
            maxWidth: '400px',
            width: 'fit-content',
            margin: '0 auto',
            padding: '12px 16px',
            borderRadius: '8px'
          }
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
        <Route path="/payment-history" element={user ? <PaymentHistoryPage /> : <Navigate to="/login" />} />
        <Route path="/help" element={user ? <HelpLayout><HelpAndSupport /></HelpLayout> : <Navigate to="/login" />} />
        <Route path="/kb/:slug" element={user ? <HelpLayout><KBArticlePage /></HelpLayout> : <Navigate to="/login" />} />
        <Route path="/kb-sitemap.xml" element={user ? <KBSitemapPage /> : <Navigate to="/login" />} />
        <Route path="/kb-robots.txt" element={user ? <KBRobotsPage /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user ? <AdminPage /> : <Navigate to="/login" />} />
        <Route path="/admin/file-rename" element={user ? <FileRenameAdmin /> : <Navigate to="/login" />} />
        <Route path="/history" element={user ? <MainLayout><History /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/donations" element={user ? <MainLayout><DonationsSavingsPage /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/favorite-quotes" element={user ? <MainLayout><FavoriteQuotes /></MainLayout> : <Navigate to="/login" />} />
        
        {/* Demo routes - public */}
        <Route path="/dashboard-demo" element={<DashboardDemo />} />
        <Route path="/dashboard-demo-only" element={<DashboardDemoOnly />} />
        
        {/* Short URL redirect - public */}
        <Route path="/f/:shortCode" element={<ShortUrlRedirect />} />
        
        {/* Public routes */}
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/termsofservice" element={<TermsOfService />} />
        <Route path="/refundpolicy" element={<RefundPolicy />} />
        
        {/* Public Help Center Routes - SEO Optimized */}
        <Route path="/help-center" element={<PublicHelpCenter />} />
        <Route path="/help-center/:slug" element={<PublicArticlePage />} />
        
        {/* SEO Routes */}
        <Route path="/sitemap.xml" element={<SitemapPage />} />
        <Route path="/robots.txt" element={<RobotsTxtPage />} />
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
    <HelmetProvider>
      <LoadingProvider>
        <MobileSidebarProvider>
          <Router>
            <AppContent />
          </Router>
          {/* Test Panels removed for production */}
          <Analytics />
        </MobileSidebarProvider>
      </LoadingProvider>
    </HelmetProvider>
  );
}

export default App;


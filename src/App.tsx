import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
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
import { LoadingProvider, useLoadingContext } from './context/LoadingContext';
import { Loader } from './components/common/Loader';
import { MainLayout } from './components/Layout/MainLayout';
import { WelcomeModal } from './components/common/WelcomeModal';
import PostAccountCreationTour from './components/PostAccountCreationTour';
import { AchievementIntegration } from './components/Achievements/AchievementIntegration';
import ContextualTourTrigger from './components/ContextualTourTrigger';
import { Analytics } from '@vercel/analytics/react';
import { useNotificationStore } from './store/notificationStore';
import { useNotificationsStore } from './store/notificationsStore';
import { urgentNotificationService } from './lib/urgentNotifications';
import { MobileSidebarProvider } from './context/MobileSidebarContext';
import { useThemeStore } from './store/themeStore';
import { AppInstallBanner } from './components/AppInstallBanner';
import WelcomeOnboarding from './components/WelcomeOnboarding';
import { isAndroidApp } from './utils/platformDetection';
import { isFirstLaunch } from './utils/firstLaunch';
import { App as CapacitorApp } from '@capacitor/app';
import { getRememberMePreference } from './utils/authStorage';
import { Capacitor } from '@capacitor/core';
import { useMobileDetection } from './hooks/useMobileDetection';

// Lazy load non-critical components for code splitting
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const AccountsView = lazy(() => import('./components/Accounts/AccountsView').then(m => ({ default: m.AccountsView })));
const TransactionsView = lazy(() => import('./components/Transactions/TransactionsView').then(m => ({ default: m.TransactionsView })));
const TransfersView = lazy(() => import('./components/Transfers/TransfersView').then(m => ({ default: m.TransfersView })));
const TransfersTableView = lazy(() => import('./components/Transfers/TransfersTableView').then(m => ({ default: m.TransfersTableView })));
const Transfer_new = lazy(() => import('./components/Transfers/Transfer_new').then(m => ({ default: m.Transfer_new })));
const SavingsView = lazy(() => import('./components/Savings/SavingsView').then(m => ({ default: m.SavingsView })));
const PurchaseTracker = lazy(() => import('./components/Purchases/PurchaseTracker').then(m => ({ default: m.PurchaseTracker })));
const LendBorrowTableView = lazy(() => import('./components/LendBorrow/LendBorrowTableView').then(m => ({ default: m.LendBorrowTableView })));
const PurchaseCategories = lazy(() => import('./components/Purchases/PurchaseCategories').then(m => ({ default: m.PurchaseCategories })));
const PurchaseAnalytics = lazy(() => import('./components/Purchases/PurchaseAnalytics').then(m => ({ default: m.PurchaseAnalytics })));
const LendBorrowAnalytics = lazy(() => import('./components/LendBorrow/LendBorrowAnalytics').then(m => ({ default: m.LendBorrowAnalytics })));
const AnalyticsView = lazy(() => import('./components/Reports/AnalyticsView').then(m => ({ default: m.AnalyticsView })));
const ClientList = lazy(() => import('./components/Clients/ClientList').then(m => ({ default: m.ClientList })));
const Settings = lazy(() => import('./components/Dashboard/Settings').then(m => ({ default: m.Settings })));
const PaymentHistoryPage = lazy(() => import('./pages/PaymentHistoryPage').then(m => ({ default: m.PaymentHistoryPage })));
const HelpAndSupport = lazy(() => import('./pages/HelpAndSupport'));
const Investments = lazy(() => import('./pages/Investments').then(m => ({ default: m.Investments })));
const SimpleInvestments = lazy(() => import('./pages/SimpleInvestments').then(m => ({ default: m.SimpleInvestments })));
const History = lazy(() => import('./pages/History').then(m => ({ default: m.History })));
const HelpLayout = lazy(() => import('./components/Layout/HelpLayout').then(m => ({ default: m.HelpLayout })));
const PublicHelpCenter = lazy(() => import('./pages/PublicHelpCenter'));
const TopicClusterHub = lazy(() => import('./pages/TopicClusterHub'));
const PublicArticlePage = lazy(() => import('./pages/PublicArticlePage'));
const SitemapPage = lazy(() => import('./pages/SitemapPage'));
// robots.txt is served as static file - no component needed
const DonationsSavingsPage = lazy(() => import('./pages/DonationsSavingsPage'));
const FavoriteQuotes = lazy(() => import('./pages/FavoriteQuotes').then(m => ({ default: m.FavoriteQuotes })));
const Achievements = lazy(() => import('./pages/Achievements'));
const HabitGarden = lazy(() => import('./components/Habits/HabitGarden').then(m => ({ default: m.HabitGarden })));
const KBArticlePage = lazy(() => import('./pages/KBArticlePage'));
const KBSitemapPage = lazy(() => import('./pages/KBSitemapPage'));
const KBRobotsPage = lazy(() => import('./pages/KBRobotsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const FileRenameAdmin = lazy(() => import('./pages/FileRenameAdmin').then(m => ({ default: m.FileRenameAdmin })));
const DashboardDemo = lazy(() => import('./pages/DashboardDemo'));
const DashboardDemoOnly = lazy(() => import('./pages/DashboardDemoOnly'));
const ShortUrlRedirect = lazy(() => import('./pages/ShortUrlRedirect'));
const NotFound = lazy(() => import('./pages/NotFound'));

// HomeRoute component for Options 1 & 2: Platform-aware routing and first launch detection
const HomeRoute: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  
  // If user is logged in, go to dashboard
  if (user) {
    return <Dashboard />;
  }
  
  // Check if this is first launch AND Android app - only show WelcomeOnboarding for Android app
  if (isFirstLaunch() && isAndroidApp()) {
    return <WelcomeOnboarding />;
  }
  
  // Check if running in Android app (not first launch)
  if (isAndroidApp()) {
    return <Navigate to="/auth" replace />;
  }
  
  // Default: show landing page for web users (including first launch on web)
  return <LandingPage />;
};

function AppContent() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { isDarkMode } = useThemeStore();
  const handleEmailConfirmation = useAuthStore((state) => state.handleEmailConfirmation);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const { isLoading: globalLoading, loadingMessage } = useLoadingContext();
  const { isMobile } = useMobileDetection();
  
  // Welcome modal state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeModalChecked, setWelcomeModalChecked] = useState(false);
  const welcomeModalCheckRef = useRef(false);
  
  // Post-account creation tour state
  const [showPostAccountTour, setShowPostAccountTour] = useState(false);
  const { fetchAccounts, fetchAllData } = useFinanceStore();
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
      
      // Note: Custom Pull-to-Refresh is disabled
      
      return () => {
        window.removeEventListener('resize', setBodyHeight);
        const rootElement = document.getElementById('root');
        if (rootElement) {
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
            
          case 'SIGNED_OUT': {
            // Don't clear success message when signing out
            const currentState = useAuthStore.getState();
            useAuthStore.setState({
              ...currentState,
              user: null,
              profile: null
            });
            break;
          }
            
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
        // Check "Remember Me" preference - if false, clear session on app start
        const shouldRemember = getRememberMePreference();
        
        // If "Remember Me" was unchecked, clear session on app start (works for both Android and web)
        if (shouldRemember === false) {
          await supabase.auth.signOut();
          const { setUserAndProfile } = useAuthStore.getState();
          setUserAndProfile(null, null);
          setLoading(false);
          return;
        }
        
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
            // Error handling - continue with flow
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

          } catch {
            // Continue anyway to prevent hanging
          }
        } else {
          // For unconfirmed users or no user, just set null without creating profile

          setUserAndProfile(null, null);
        }
      } catch {
        // Error handling - continue with initialization
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };
    
    initializeSession();
    
    // For web: Clear session on page unload if "Remember Me" is unchecked
    const handlePageUnload = () => {
      const shouldRemember = getRememberMePreference();
      const isAndroid = isAndroidApp();
      
      // Only for web (not Android app)
      if (!isAndroid && shouldRemember === false) {
        // Clear Supabase session from localStorage directly (synchronous)
        // Supabase stores session with key pattern: sb-{project-ref}-auth-token
        try {
          // Clear all Supabase auth-related keys from localStorage
          Object.keys(localStorage).forEach(key => {
            if (key.includes('supabase') || (key.startsWith('sb-') && key.includes('auth'))) {
              localStorage.removeItem(key);
            }
          });
        } catch (error) {
          // Ignore errors during unload
        }
      }
    };
    
    // Add page unload listeners for web
    if (!isAndroidApp()) {
      window.addEventListener('beforeunload', handlePageUnload);
      window.addEventListener('pagehide', handlePageUnload);
    }
    
    return () => {
      authListener.subscription.unsubscribe();
      if (!isAndroidApp()) {
        window.removeEventListener('beforeunload', handlePageUnload);
        window.removeEventListener('pagehide', handlePageUnload);
      }
    };
  }, [handleEmailConfirmation]);

  // Handle deep link OAuth callback on Android
  useEffect(() => {
    const platform = Capacitor.getPlatform();
    console.error('[DEEPLINK] ========================================');
    console.error('[DEEPLINK] ========== SETTING UP DEEP LINK LISTENER ==========');
    console.error('[DEEPLINK] Platform:', platform);
    console.error('[DEEPLINK] ========================================');
    
    if (platform === 'android') {
      console.error('[DEEPLINK] ✅ Android platform detected - setting up deep link handlers');
      
      const handleOAuthCallback = async (url: string) => {
        console.error('[DEEPLINK] ========================================');
        console.error('[DEEPLINK] ========== DEEP LINK CALLBACK RECEIVED ==========');
        console.error('[DEEPLINK] 🔗 Full callback URL:', url);
        console.error('[DEEPLINK] URL length:', url?.length);
        console.error('[DEEPLINK] Contains /auth/callback?', url?.includes('/auth/callback'));
        console.error('[DEEPLINK] ========================================');
        
        // Check if this is the OAuth callback
        if (url && url.includes('/auth/callback')) {
          console.log('[DEEPLINK] ✅ This is an OAuth callback URL');
          try {
            console.log('[DEEPLINK] 🔄 Parsing URL...');
            const urlObj = new URL(url);
            console.log('[DEEPLINK] - URL host:', urlObj.host);
            console.log('[DEEPLINK] - URL pathname:', urlObj.pathname);
            console.log('[DEEPLINK] - URL hash:', urlObj.hash ? `${urlObj.hash.substring(0, 50)}...` : 'NONE');
            console.log('[DEEPLINK] - URL search:', urlObj.search ? `${urlObj.search.substring(0, 50)}...` : 'NONE');
            
            // Supabase OAuth uses hash fragments (#access_token=...) not query params
            // Parse hash fragment if present
            let accessToken: string | null = null;
            let refreshToken: string | null = null;
            let error: string | null = null;
            
            // Check hash fragment first (Supabase standard)
            if (urlObj.hash) {
              console.log('[DEEPLINK] 🔍 Parsing hash fragment...');
              const hashParams = new URLSearchParams(urlObj.hash.substring(1)); // Remove '#'
              accessToken = hashParams.get('access_token');
              refreshToken = hashParams.get('refresh_token');
              error = hashParams.get('error') || hashParams.get('error_description');
              console.log('[DEEPLINK] Hash params parsed:');
              console.log('[DEEPLINK] - Has access_token?', !!accessToken);
              console.log('[DEEPLINK] - Has refresh_token?', !!refreshToken);
              console.log('[DEEPLINK] - Error?', error);
            } else {
              console.log('[DEEPLINK] ⚠️ No hash fragment in URL');
            }
            
            // Fallback to query params (some OAuth flows use these)
            if (!accessToken && !refreshToken && !error) {
              console.log('[DEEPLINK] 🔍 Checking query params as fallback...');
              accessToken = urlObj.searchParams.get('access_token');
              refreshToken = urlObj.searchParams.get('refresh_token');
              error = urlObj.searchParams.get('error') || urlObj.searchParams.get('error_description');
              console.log('[DEEPLINK] Query params parsed:');
              console.log('[DEEPLINK] - Has access_token?', !!accessToken);
              console.log('[DEEPLINK] - Has refresh_token?', !!refreshToken);
              console.log('[DEEPLINK] - Error?', error);
            }
            
            console.log('[DEEPLINK] 📊 Final token status:', { 
              hasAccessToken: !!accessToken, 
              hasRefreshToken: !!refreshToken, 
              error,
              accessTokenLength: accessToken?.length || 0,
              refreshTokenLength: refreshToken?.length || 0
            });
            
            if (error) {
              console.error('[DEEPLINK] ❌ OAuth error from deep link:', error);
              console.log('[DEEPLINK] 🔄 Navigating to /auth with error...');
              // Navigate to auth page with error
              window.location.href = '/auth?error=oauth_failed';
              return;
            }
            
            if (accessToken && refreshToken) {
              console.log('[DEEPLINK] ✅ OAuth tokens found in URL');
              console.log('[DEEPLINK] 🔄 Setting Supabase session...');
              // Set the session with tokens
              const { data, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (sessionError) {
                console.error('[DEEPLINK] ❌ Error setting session:', sessionError);
                console.log('[DEEPLINK] 🔄 Navigating to /auth with session error...');
                window.location.href = '/auth?error=session_failed';
                return;
              }
              
              console.log('[DEEPLINK] ✅ Session set successfully');
              console.log('[DEEPLINK] - Has user data?', !!data.user);
              console.log('[DEEPLINK] - User ID:', data.user?.id);
              console.log('[DEEPLINK] - User email:', data.user?.email);
              
              if (data.user) {
                console.log('[DEEPLINK] ✅ User authenticated via deep link');
                console.log('[DEEPLINK] 🔄 Setting user and profile...');
                const { setUserAndProfile } = useAuthStore.getState();
                await setUserAndProfile(data.user, null);
                console.log('[DEEPLINK] ✅ User and profile set');
                console.log('[DEEPLINK] 🔄 Navigating to /dashboard...');
                // Navigate to dashboard
                window.location.href = '/dashboard';
              } else {
                console.error('[DEEPLINK] ❌ No user data after setting session');
                console.log('[DEEPLINK] 🔄 Navigating to /auth with no_user error...');
                window.location.href = '/auth?error=no_user';
              }
            } else {
              // Fallback: Navigate to /auth/callback route with the full URL
              // The AuthCallback component has logic to handle OAuth callbacks
              console.log('[DEEPLINK] ⚠️ No tokens found in URL params');
              console.log('[DEEPLINK] 📋 URL details:', { 
                hash: urlObj.hash ? `${urlObj.hash.substring(0, 100)}...` : 'NONE', 
                search: urlObj.search ? `${urlObj.search.substring(0, 100)}...` : 'NONE',
                fullUrl: url.substring(0, 200) + '...'
              });
              console.log('[DEEPLINK] 🔄 Redirecting to /auth/callback route...');
              
              // Preserve the hash and search params when navigating
              let callbackUrl = '/auth/callback';
              if (urlObj.hash) {
                callbackUrl += urlObj.hash;
              }
              if (urlObj.search) {
                callbackUrl += (urlObj.hash ? '' : urlObj.search);
              }
              
              console.log('[DEEPLINK] Final callback URL:', callbackUrl.substring(0, 200) + '...');
              window.location.href = callbackUrl;
            }
          } catch (error) {
            console.error('[DEEPLINK] ❌ Error handling deep link:', error);
            console.error('[DEEPLINK] Error details:', error instanceof Error ? error.message : String(error));
            console.log('[DEEPLINK] 🔄 Navigating to /auth with callback_failed error...');
            window.location.href = '/auth?error=callback_failed';
          }
        } else if (url && url.includes('/auth/reset-password')) {
          // Handle password reset deep link
          console.log('[DEEPLINK] ✅ This is a password reset URL');
          try {
            const urlObj = new URL(url);
            console.log('[DEEPLINK] 🔄 Processing password reset deep link...');
            console.log('[DEEPLINK] - URL pathname:', urlObj.pathname);
            console.log('[DEEPLINK] - URL hash:', urlObj.hash ? `${urlObj.hash.substring(0, 50)}...` : 'NONE');
            console.log('[DEEPLINK] - URL search:', urlObj.search ? `${urlObj.search.substring(0, 50)}...` : 'NONE');
            
            // Password reset URLs can have tokens in hash or query params
            let accessToken: string | null = null;
            let refreshToken: string | null = null;
            
            // Check hash fragment first
            if (urlObj.hash) {
              const hashParams = new URLSearchParams(urlObj.hash.substring(1));
              accessToken = hashParams.get('access_token');
              refreshToken = hashParams.get('refresh_token');
            }
            
            // Fallback to query params
            if (!accessToken) {
              accessToken = urlObj.searchParams.get('access_token');
              refreshToken = urlObj.searchParams.get('refresh_token');
            }
            
            console.log('[DEEPLINK] 📊 Password reset token status:', { 
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken
            });
            
            // Navigate to reset password page, preserving tokens
            let resetPasswordUrl = '/auth/reset-password';
            if (urlObj.hash) {
              resetPasswordUrl += urlObj.hash;
            } else if (urlObj.search) {
              resetPasswordUrl += urlObj.search;
            }
            
            console.log('[DEEPLINK] 🔄 Navigating to reset password page...');
            window.location.href = resetPasswordUrl;
          } catch (error) {
            console.error('[DEEPLINK] ❌ Error handling password reset deep link:', error);
            console.error('[DEEPLINK] Error details:', error instanceof Error ? error.message : String(error));
            window.location.href = '/auth?error=reset_failed';
          }
        } else {
          console.log('[DEEPLINK] ⚠️ URL received but not a recognized auth callback:', url);
        }
      };
      
      // Check for initial URL (if app was opened via deep link)
      console.error('[DEEPLINK] 🔍 Checking for launch URL...');
      CapacitorApp.getLaunchUrl().then((result) => {
        if (result?.url) {
          console.error('[DEEPLINK] 🚀 App launched with URL:', result.url);
          console.error('[DEEPLINK] 🔄 Processing launch URL...');
          handleOAuthCallback(result.url);
        } else {
          console.error('[DEEPLINK] ℹ️ No launch URL (app opened normally)');
        }
      }).catch((err) => {
        console.error('[DEEPLINK] ℹ️ getLaunchUrl() error (normal if app opened normally):', err);
      });
      
      // Listen for app URL open events (when app is already running)
      console.error('[DEEPLINK] 👂 Setting up appUrlOpen listener...');
      const listener = CapacitorApp.addListener('appUrlOpen', (event) => {
        console.error('[DEEPLINK] ========================================');
        console.error('[DEEPLINK] 📱📱📱 appUrlOpen EVENT FIRED! 📱📱📱');
        console.error('[DEEPLINK] Event URL:', event.url);
        console.error('[DEEPLINK] ========================================');
        handleOAuthCallback(event.url);
      });
      
      console.error('[DEEPLINK] ✅ Deep link listener setup complete');
      
      return () => {
        console.log('[DEEPLINK] 🧹 Cleaning up deep link listener...');
        listener.then(l => l.remove()).catch(() => {});
      };
    } else {
      console.log('[DEEPLINK] ⚠️ Not Android platform - skipping deep link setup');
    }
  }, []);

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
  }, [user, loading, initializeDefaultNotifications, fetchNotifications]);

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

  // Reset check ref when user changes
  useEffect(() => {
    if (user) {
      welcomeModalCheckRef.current = false;
      setWelcomeModalChecked(false);
    }
  }, [user?.id]);

  // Check if user has accounts and show welcome modal if needed
  useEffect(() => {
    // Prevent multiple checks
    if (welcomeModalCheckRef.current) {
      return;
    }
    
    if (user && !loading && profile) {
      const checkAndShowWelcomeModal = async () => {
        try {
          // Mark as checking to prevent re-runs
          welcomeModalCheckRef.current = true;
          
          // Ensure profile exists - wait for it if needed
          let currentProfile = profile;
          if (!currentProfile) {
            // Wait up to 3 seconds for profile to be created
            for (let i = 0; i < 6; i++) {
              await new Promise(resolve => setTimeout(resolve, 500));
              currentProfile = useAuthStore.getState().profile;
              if (currentProfile) break;
            }
          }
          
          // If profile still doesn't exist, don't show modal yet
          if (!currentProfile) {
            welcomeModalCheckRef.current = false; // Reset to allow retry
            return;
          }
          
          // Check if accounts already exist in store before fetching
          const existingAccounts = useFinanceStore.getState().accounts;
          if (existingAccounts.length > 0) {
            // User already has accounts, don't show modal
            setShowWelcomeModal(false);
            setWelcomeModalChecked(true);
            return;
          }
          
          // Add a timeout to prevent hanging (only if no accounts found)
          let timeoutId: NodeJS.Timeout | null = null;
          let timeoutTriggered = false;
          
          timeoutId = setTimeout(() => {
            timeoutTriggered = true;
            // Only show modal on timeout if we still have no accounts
            const accountsAfterTimeout = useFinanceStore.getState().accounts;
            if (accountsAfterTimeout.length === 0) {
              setShowWelcomeModal(true);
              setWelcomeModalChecked(true);
            }
          }, 5000); // 5 second timeout
          
          // Fetch accounts to get the real count
          await fetchAccounts();
          
          // Get fresh accounts count after fetch
          const freshAccounts = useFinanceStore.getState().accounts;
          const hasAccounts = freshAccounts.length > 0;
          
          // Clear timeout since we got results
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          // Only show modal if user has NO accounts (regardless of default currency)
          if (!hasAccounts && !timeoutTriggered) {
            setShowWelcomeModal(true);
          } else {
            setShowWelcomeModal(false);
          }
          
          // Mark as checked to prevent re-running when profile loads
          setWelcomeModalChecked(true);
        } catch (error) {
          console.error('Error checking for welcome modal:', error);
          
          // On error, check if accounts exist in store before assuming new user
          const accountsOnError = useFinanceStore.getState().accounts;
          if (accountsOnError.length > 0) {
            // User has accounts, don't show modal
            setShowWelcomeModal(false);
          } else {
            // No accounts found, might be new user - show modal
            setShowWelcomeModal(true);
          }
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
    <AchievementIntegration>
      
      {/* App Install Banner - Bottom Banner (Option B) */}
      {/* Only shows on Android mobile browsers, not in app or desktop */}
      <AppInstallBanner position="bottom" />

      <Loader isLoading={globalLoading} message={loadingMessage} />
      <Toaster 
        position={isMobile ? "top-center" : "top-right"} 
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
      <Suspense fallback={<Loader isLoading={true} message="Loading..." />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Auth />} />
          <Route path="/register" element={user ? <Navigate to="/" /> : <Auth />} />
          <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          
          {/* Dashboard routes - all protected */}
          <Route path="/accounts" element={user ? <MainLayout><AccountsView /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/transactions" element={user ? <MainLayout><TransactionsView /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/transfers" element={user ? <MainLayout><Transfer_new /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/transfers-table" element={user ? <MainLayout><TransfersTableView /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/transfers-new" element={user ? <MainLayout><TransfersView /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/savings" element={user ? <MainLayout><SavingsView /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/purchases" element={user ? <MainLayout><PurchaseTracker /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/lent-borrow" element={user ? <MainLayout><LendBorrowTableView /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/investments" element={user ? <MainLayout><Investments /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/simple-investments" element={user ? <MainLayout><SimpleInvestments /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/purchase-categories" element={user ? <MainLayout><PurchaseCategories /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/purchase-analytics" element={user ? <MainLayout><PurchaseAnalytics /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/lent-borrow-analytics" element={user ? <MainLayout><LendBorrowAnalytics /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/analytics" element={user ? <MainLayout><AnalyticsView /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/currency-analytics" element={user ? <Navigate to="/analytics" replace /> : <Navigate to="/login" />} />
        <Route path="/clients" element={user ? <MainLayout><ClientList /></MainLayout> : <Navigate to="/login" />} />
        <Route path="/habits" element={user ? <MainLayout><HabitGarden /></MainLayout> : <Navigate to="/login" />} />
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
        <Route path="/achievements" element={user ? <MainLayout><Achievements /></MainLayout> : <Navigate to="/login" />} />
        
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
        <Route path="/help-center/topics" element={<TopicClusterHub />} />
        <Route path="/help-center/:slug" element={<PublicArticlePage />} />
        
        {/* SEO Routes */}
        <Route path="/sitemap.xml" element={<SitemapPage />} />
        {/* robots.txt is served as static file from public/robots.txt - no route needed */}
        
        {/* 404 - Catch all route must be last */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      
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
      
      {/* Contextual Tour Trigger */}
      <ContextualTourTrigger       />
      
      {/* AI Chat Bot is now integrated into FloatingActionButton */}
    </AchievementIntegration>
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


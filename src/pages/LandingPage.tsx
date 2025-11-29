import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Wallet, Target, Handshake, PiggyBank, Bell, Shield, Heart,
  Check, ChevronDown, ChevronUp, Star, ArrowRight, BarChart3, PieChart,
  Users, Globe, Mail, Phone, Facebook, Twitter, Instagram, Linkedin, Github, ArrowUp, Moon, Sun, LogOut, Menu, X,
  Zap, MessageSquare, Download, Settings, CreditCard, Smartphone, Clock, AlertCircle, Repeat
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import InteractiveBackground from '../components/InteractiveBackground';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { PaddlePaymentModal } from '../components/common/PaddlePaymentModal';
import { Footer } from '../components/Layout/Footer';

const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'one-time'>('monthly');
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    planId: '',
    planName: '',
    price: 0,
    billingCycle: 'monthly' as 'monthly' | 'one-time',
    features: [] as string[]
  });
  
  // Animated counter states
  const [userCount, setUserCount] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [savingsCount, setSavingsCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    // Set Manrope font for the whole page
    document.body.style.fontFamily = 'Manrope, sans-serif';
    
    // Detect Capacitor/Android and add class for status bar padding
    const isCapacitor = window.Capacitor !== undefined;
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isCapacitor && isAndroid) {
      document.body.classList.add('capacitor-android');
    }
    
    // Back to top button visibility - works for both window and #root scrolling
    const handleScroll = () => {
      const isAndroid = /Android/i.test(navigator.userAgent);
      let scrollY = 0;
      
      if (isAndroid) {
        // On Android, scroll happens on #root element
        const rootElement = document.getElementById('root');
        scrollY = rootElement ? rootElement.scrollTop : 0;
      } else {
        // On other platforms, use window scroll
        scrollY = window.scrollY;
      }
      
      setShowBackToTop(scrollY > 300);
    };
    
    // Listen to the appropriate scroll event
    const isAndroidScroll = /Android/i.test(navigator.userAgent);
    const rootElement = document.getElementById('root');
    
    if (isAndroidScroll && rootElement) {
      // On Android, listen to #root scroll
      rootElement.addEventListener('scroll', handleScroll);
      return () => {
        rootElement.removeEventListener('scroll', handleScroll);
        document.body.style.fontFamily = '';
      };
    } else {
      // On other platforms, listen to window scroll
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll);
        document.body.style.fontFamily = '';
      };
    }
  }, []);

  // Mobile scroll fix for Android devices
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

  // Animated counter effect
  useEffect(() => {
    setIsVisible(true);
    
    const animateCount = (target: number, setter: (value: number) => void, duration: number = 2000) => {
      let startTime: number | null = null;
      const startValue = 0;
      
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (target - startValue) * easeOutQuart);
        
        setter(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    };

    if (isVisible) {
      setTimeout(() => {
        animateCount(12500, setUserCount, 2500);
        animateCount(2500000, setTransactionCount, 3000);
        animateCount(15, setSavingsCount, 2000);
      }, 500);
    }
  }, [isVisible]);

  const openPaymentModal = (planId: string, planName: string, price: number, cycle: 'monthly' | 'one-time') => {
    // Check if user is authenticated
    if (!user) {
      // Store premium intent in localStorage
      localStorage.setItem('premiumIntent', JSON.stringify({
        planId,
        planName,
        price,
        billingCycle: cycle,
        timestamp: Date.now()
      }));
      
      // Redirect to auth page
      navigate('/auth');
      return;
    }

    const features = planId.includes('premium') ? [
      'Unlimited accounts',
      'Unlimited currencies',
      'Unlimited transactions',
      'Advanced analytics',
      'Priority email support (4-8h response)',
      'Custom categories',
      'Recurring transactions',
      'Lent & borrow tracking',
      'Data export (PDF/CSV)',
      'Last Wish - Digital Time Capsule'
    ] : [];

    setPaymentModal({
      isOpen: true,
      planId,
      planName,
      price,
      billingCycle: cycle,
      features
    });
  };

  const features = [
    { icon: TrendingUp, title: "Spending Tracker", description: "See exactly where your money goes." },
    { icon: Wallet, title: "Budget Planner", description: "Set budgets and beat overspending." },
    { icon: Repeat, title: "Recurring Transactions", description: "Automate recurring income and expenses with smart scheduling." },
    { icon: Handshake, title: "Lent & Borrow", description: "Keep tabs on loans and IOUs." },
    { icon: PiggyBank, title: "Savings Goals", description: "Visualize your progress with goal thermometers." },
    { icon: Bell, title: "Smart Alerts", description: "Get nudges when you're off track." },
    { icon: Shield, title: "Secure & Private", description: "Industry-standard security & data encryption." },
    { icon: Heart, title: "Last Wish", description: "Plan and manage your legacy with dignity and care." }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson", title: "Marketing Manager",
              quote: "Balanze helped me save $5,000 in just 6 months. The spending tracker is a game-changer!",
      avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=0D8ABC&color=fff"
    },
    {
      name: "Michael Chen", title: "Software Engineer",
      quote: "The budget planner is incredibly intuitive. I finally have control over my finances.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    {
      name: "Emily Rodriguez", title: "Small Business Owner",
      quote: "The lend & borrow feature is perfect for tracking business loans. Highly recommended!",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const faqs = [
    { question: "How secure is my data?", answer: "We use industry-standard encryption and security measures to protect your financial data." },
    { question: "Can I cancel anytime?", answer: "Yes! You can cancel your subscription at any time with no cancellation fees." },
    { question: "What payment methods are supported?", answer: "We accept all major credit cards, PayPal, and Apple Pay." },
    { question: "Is there a free trial?", answer: "Yes! We offer a 14-day free trial with full access to all features." },
    { question: "Can I export my data?", answer: "Absolutely! You can export your data in CSV, PDF, or Excel formats at any time." }
  ];

  return (
    <>
      <Helmet>
        {/* SEO Meta Tags */}
        <meta name="description" content="Balanze Finance - Personal Finance Management. Track expenses, manage budgets, set savings goals, and take control of your finances with powerful analytics and multi-currency support." />
        <link rel="canonical" href="https://balanze.cash" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://balanze.cash" />
        <meta property="og:title" content="Balanze Finance - Personal Finance Management" />
        <meta property="og:description" content="Track expenses, manage budgets, set savings goals, and take control of your finances with powerful analytics and multi-currency support." />
        <meta property="og:image" content="https://balanze.cash/main-dashboard.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Balanze Finance Personal Finance Management Dashboard" />
        <meta property="og:site_name" content="Balanze Finance" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Balanze Finance - Personal Finance Management" />
        <meta name="twitter:description" content="Track expenses, manage budgets, set savings goals, and take control of your finances with powerful analytics and multi-currency support." />
        <meta name="twitter:image" content="https://balanze.cash/main-dashboard.png" />
        <meta name="twitter:image:alt" content="Balanze Finance Personal Finance Management Dashboard" />
      </Helmet>
      <div className="relative min-h-screen overflow-hidden full-height-mobile landing-page-mobile">
        <InteractiveBackground />
      
      <div className="relative z-10">
        {/* Navigation Header */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Balanze
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <button
                  className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Features
                </button>
                <button
                  className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => document.getElementById('last-wish')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Last Wish
                </button>
                <button
                  className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Pricing
                </button>
                <button
                  className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => navigate('/help-center')}
                >
                  Help Center
                </button>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Welcome, {user.email}
                    </span>
                    <button 
                      onClick={() => signOut()}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold"
                  >
                    Sign In
                  </button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center space-x-4">
                {user ? (
                  <button 
                    onClick={() => signOut()}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm flex items-center space-x-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold text-sm"
                  >
                    Sign In
                  </button>
                )}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={isMobileMenuOpen}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  <button
                    className="block w-full text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                    onClick={() => {
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Features
                  </button>
                  <button
                    className="block w-full text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                    onClick={() => {
                      document.getElementById('last-wish')?.scrollIntoView({ behavior: 'smooth' });
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Last Wish
                  </button>
                  <button
                    className="block w-full text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                    onClick={() => {
                      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Pricing
                  </button>
                  <button
                    className="block w-full text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                    onClick={() => {
                      navigate('/help-center');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Help Center
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

      <main>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden landing-page-safe-top">
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Take Control of Your{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Money
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Track spending, manage budgets, lend & borrow, and hit your financial goals with our comprehensive personal finance platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <>
                  <div className="text-center mb-4">
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                      Welcome back, {user.email}!
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      You're already logged in. Go to your dashboard or logout.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => navigate('/')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Go to Dashboard
                      <ArrowRight className="w-5 h-5 ml-2 inline" />
                    </button>
                    <button 
                      onClick={() => signOut()}
                      className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Start Your Free Trial
                    <ArrowRight className="w-5 h-5 ml-2 inline" />
                  </button>
                  <button
                    className="text-gray-700 dark:text-gray-300 px-8 py-4 rounded-lg text-lg font-semibold hover:text-gray-900 dark:hover:text-white transition-colors border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    View Features
                  </button>
                </>
              )}
            </div>
            
            {/* Product Hunt Badge */}
            <div className="mt-8 flex justify-center">
              <a 
                href="https://www.producthunt.com/products/balanze?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-balanze" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block hover:scale-105 transition-transform duration-300"
              >
                <img 
                  src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1033754&theme=light&t=1762271112892" 
                  alt="Balanze - Personal finance management | Product Hunt" 
                  style={{ width: '250px', height: '54px' }} 
                  width="250" 
                  height="54"
                  loading="lazy"
                  decoding="async"
                />
              </a>
            </div>
            
            {/* Trust indicators - Enhanced with animated counters */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Users className="w-8 h-8 mb-2 text-blue-600 dark:text-blue-400" />
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {userCount.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Happy Users</div>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <TrendingUp className="w-8 h-8 mb-2 text-green-600 dark:text-green-400" />
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {transactionCount.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Transactions Tracked</div>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Shield className="w-8 h-8 mb-2 text-purple-600 dark:text-purple-400" />
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ${savingsCount}M+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Money Saved</div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 flex justify-center">
            <div className="relative group">
              {/* Floating background decoration */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 transform rotate-3 hover:rotate-0 transition-all duration-500 group-hover:shadow-3xl">
                <picture>
                  {/* WebP format for modern browsers - uncomment when images are converted to WebP */}
                  {/* <source srcSet="/main-dashboard-400.webp 400w, /main-dashboard-800.webp 800w, /main-dashboard-1200.webp 1200w, /main-dashboard-1643.webp 1643w" type="image/webp" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px" /> */}
                  {/* PNG fallback with responsive sizes - uncomment when responsive PNGs are created */}
                  {/* <source srcSet="/main-dashboard-400.png 400w, /main-dashboard-800.png 800w, /main-dashboard-1200.png 1200w, /main-dashboard-1643.png 1643w" type="image/png" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px" /> */}
                  <img 
                    src="/main-dashboard.png" 
                    alt="Balanze Dashboard"
                    className="w-full max-w-4xl rounded-xl"
                    loading="eager"
                    decoding="async"
                    width="1643"
                    height="1060"
                    style={{ aspectRatio: '1643 / 1060' }}
                    fetchpriority="high"
                  />
                </picture>
              </div>
              
              {/* Enhanced Live Demo Badge */}
              <button
                onClick={() => window.open('/dashboard-demo-only', '_blank')}
                className="absolute -top-4 -right-4 bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow-lg p-3 animate-bounce hover:from-green-500 hover:to-green-700 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-white">Live Demo</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform duration-200" />
                </div>
                {/* Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  Try Balanze with sample data
                  <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </button>
              
              {/* Floating info cards */}
              <div className="absolute -left-8 top-1/4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 transform -rotate-6 hover:rotate-0 transition-transform duration-300 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Savings This Month</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">+$1,250</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -right-8 bottom-1/4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 transform rotate-6 hover:rotate-0 transition-transform duration-300 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Goal Progress</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">78%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Android App Coming Soon Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="text-center lg:text-left">
              {/* Coming Soon Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50 text-green-800 dark:text-green-300 px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
                <Clock className="w-4 h-4" />
                <span>COMING SOON</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Take Balanze{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  On the Go
                </span>
              </h2>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0">
                Our Android app is coming soon! Manage your finances, track spending, and stay on top of your goals wherever you are.
              </p>

              {/* Key Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Full Mobile Experience</h3>
                    <p className="text-gray-600 dark:text-gray-400">All features available on your Android device</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Smart Notifications</h3>
                    <p className="text-gray-600 dark:text-gray-400">Get alerts for spending limits and goal progress</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Secure & Sync</h3>
                    <p className="text-gray-600 dark:text-gray-400">Industry-standard security with real-time sync across devices</p>
                  </div>
                </div>
              </div>

              {/* Email Notification Signup - Hidden for now */}
              {/* <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Get Notified When It's Ready
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  Be the first to know when our Android app launches. No spam, just updates.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-2">
                    <Bell className="w-4 h-4" />
                    Notify Me
                  </button>
                </div>
              </div> */}
            </div>

            {/* Right Side - Mobile Mockup */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Phone Frame */}
                <div className="relative w-80 h-[600px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
                  {/* Screen */}
                  <div className="w-full h-full bg-white dark:bg-gray-800 rounded-[2.5rem] overflow-hidden relative">
                    
                    
                    {/* Dashboard Image */}
                    <div className="w-full h-full flex items-center justify-center">
                      <picture>
                        {/* WebP format for modern browsers - uncomment when images are converted to WebP */}
                        {/* <source srcSet="/android_view-200.webp 200w, /android_view-300.webp 300w, /android_view-400.webp 400w" type="image/webp" sizes="(max-width: 640px) 280px, 400px" /> */}
                        {/* PNG fallback with responsive sizes - uncomment when responsive PNGs are created */}
                        {/* <source srcSet="/android_view-200.png 200w, /android_view-300.png 300w, /android_view-400.png 400w" type="image/png" sizes="(max-width: 640px) 280px, 400px" /> */}
                        <img 
                          src="/android_view.png"
                          alt="Balanze Android App Demo"
                          className="w-full h-full object-cover rounded-[2.5rem]"
                          loading="lazy"
                          decoding="async"
                          width="400"
                          height="800"
                          style={{ padding: '15px' }}
                        />
                      </picture>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                
                <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 transform -rotate-6 hover:rotate-0 transition-transform duration-300" style={{left: '30px', padding: '1rem 3.1rem'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full flex items-center justify-center">
                      <Download className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Android App</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">Coming Soon</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Preview Section */}
      <section className="pt-20 pb-0 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Experience Balanze in Action
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              See how our dashboard works with real sample data. No signup required!
            </p>
            
            {/* Demo Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
              {/* Multi-Currency Card */}
              <button
                onClick={() => window.open('/dashboard-demo-only', '_blank')}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer group text-left w-full"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Multi-Currency</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">USD & BDT Support</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">USD Balance</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">$54,420.50</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">BDT Balance</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">৳175,000</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                  <span>Click to explore</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>

              {/* Recent Transactions Card */}
              <button
                onClick={() => window.open('/dashboard-demo-only', '_blank')}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 cursor-pointer group text-left w-full"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-500 transition-colors">Recent Activity</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last 5 transactions</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Salary Payment</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">+$3,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Grocery Shopping</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">-$120.50</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-green-600 dark:text-green-400 text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                  <span>Click to explore</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>

              {/* Analytics Card */}
              <button
                onClick={() => window.open('/dashboard-demo-only', '_blank')}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 cursor-pointer group text-left w-full"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Analytics</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Spending insights</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">$2,450</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Savings Rate</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">23%</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform duration-200">
                  <span>Click to explore</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            </div>

            {/* Enhanced Demo CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => window.open('/dashboard-demo-only', '_blank')}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 w-full sm:w-auto"
              >
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span>Try Live Demo</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="bg-transparent border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 w-full sm:w-auto"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Real-time Activity */}
      <section className="py-8 md:py-12 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap">
            <div className="flex items-center gap-2 md:gap-3 bg-white dark:bg-gray-800 px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg animate-pulse">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full animate-ping"></div>
              <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="font-bold text-blue-600 dark:text-blue-400">Sarah</span> just saved <span className="font-bold text-green-600">$500</span> <span className="hidden sm:inline">this month</span>
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-3 bg-white dark:bg-gray-800 px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg">
              <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
              <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="font-bold">4.9/5</span> <span className="hidden sm:inline">rating from</span> <span className="font-bold">2,500+</span> <span className="hidden sm:inline">reviews</span>
              </span>
            </div>
            <div className="flex items-center gap-2 md:gap-3 bg-white dark:bg-gray-800 px-4 md:px-6 py-2 md:py-3 rounded-full shadow-lg">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                <span className="font-bold">Industry-standard</span> <span className="hidden sm:inline">encryption</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 relative">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Master Your Finances
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Powerful features designed to give you complete control over your financial life
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            {features.filter(f => f.title !== 'Last Wish').map((feature, index) => (
              <div 
                key={index}
                className="group bg-white dark:bg-gray-700 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col items-center text-center w-72 transform hover:-translate-y-2 hover:scale-105 cursor-pointer border border-transparent hover:border-blue-500/50 dark:hover:border-purple-500/50 relative overflow-hidden"
              >
                {/* Animated background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                
                <div className="relative z-10 w-full">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-6 mx-auto transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500 shadow-lg group-hover:shadow-xl">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
                
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Showcase */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 relative">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Experience the Power of Balanze
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover how our intuitive interface makes financial management effortless
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-6 h-64 flex items-center justify-center">
                <img 
                  src="/info-feature-1.png" 
                  alt="Lent & Borrow Overview" 
                  className="w-full h-full object-contain rounded-md shadow-sm"
                  loading="lazy"
                  decoding="async"
                  width="1024"
                  height="512"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                All Lent & Borrow at a Glance
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track all your lending and borrowing activities in one comprehensive view. Monitor outstanding amounts, payment schedules, and transaction history effortlessly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-6 h-64 flex items-center justify-center">
                <img 
                  src="/info-feature-2.png" 
                  alt="Multi-Currency Details" 
                  className="w-full h-full object-contain rounded-md shadow-sm"
                  loading="lazy"
                  decoding="async"
                  width="1024"
                  height="512"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Intensive Details for Each Currency
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get comprehensive breakdowns of your finances across multiple currencies. View detailed analytics, account balances, and transaction patterns for each currency you manage.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 mb-6 h-64 flex items-center justify-center">
                <img 
                  src="/info-feature-3.png" 
                  alt="Donations & Savings Tracking" 
                  className="w-full h-full object-contain rounded-md shadow-sm"
                  loading="lazy"
                  decoding="async"
                  width="1024"
                  height="512"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Track Your Donations & Savings
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                See exactly where your donations go and monitor how much you've saved over time. Visualize your charitable giving impact and savings growth with detailed insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Showcase */}
      <section className="py-20 relative">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Analytics at Your Fingertips
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Get deep insights into your spending patterns and financial health
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Purchasing Analytics Card */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 shadow-lg flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Purchasing Analytics
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Track your spending patterns
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 flex-1 flex items-center justify-center">
                <img 
                  src="/purchase-analytics-demo.png" 
                  alt="Purchasing Analytics Demo" 
                  className="w-full h-auto max-h-72 object-contain rounded-md shadow"
                  loading="lazy"
                  decoding="async"
                  width="1024"
                  height="512"
                />
              </div>
            </div>

            {/* Lent & Borrow Analytics Card */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 shadow-lg flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Lent & Borrow Analytics
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Monitor your loans and IOUs
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 flex-1 flex items-center justify-center">
                <img 
                  src="/lend-borrow-analytics-demo.png" 
                  alt="Lent & Borrow Analytics Demo" 
                  className="w-full h-auto max-h-72 object-contain rounded-md shadow"
                  loading="lazy"
                  decoding="async"
                  width="1024"
                  height="512"
                />
              </div>
              {/* Removed See Dashboard button */}
            </div>
          </div>
        </div>
      </section>

      {/* Last Wish Feature Section - Testimonial Integration */}
      <section id="last-wish" className="py-20 bg-white dark:bg-gray-900 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 text-purple-800 dark:text-purple-300 px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
              <Heart className="w-4 h-4" />
              <span>PREMIUM FEATURE</span>
          </div>
            
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Last Wish</span>
              <br />
              <span className="text-2xl md:text-4xl text-gray-700 dark:text-gray-300 font-light">Your Digital Time Capsule</span>
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Trusted by thousands of families to preserve their most important messages and documents. 
              See how Last Wish has brought peace of mind to families worldwide.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            {/* Left Side - Feature Description */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48" className="w-10 h-10 text-white">
                    <path fill="currentColor" d="M24 44c-7.732 0-14-6.268-14-14 0-5.25 3.02-9.77 7.5-12.06V14a6.5 6.5 0 1 1 13 0v3.94C34.98 20.23 38 24.75 38 30c0 7.732-6.268 14-14 14Zm-2-30a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white">Secure Digital Legacy</h3>
                  <p className="text-gray-600 dark:text-gray-400">Preserve what matters most</p>
                </div>
              </div>

              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Securely record your final wishes, messages, and important information for your loved ones. 
                <span className="font-semibold text-purple-600 dark:text-purple-400"> Balanze's Last Wish</span> feature lets you create a digital legacy, 
                ensuring your intentions are preserved and delivered when it matters most.
              </p>

              {/* Key Features */}
              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Personal Messages</h4>
                    <p className="text-gray-600 dark:text-gray-400">Record heartfelt messages and written letters for your family and friends.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Important Documents</h4>
                    <p className="text-gray-600 dark:text-gray-400">Securely store wills, insurance policies, passwords, and other critical documents.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">100% Private & Secure</h4>
                    <p className="text-gray-600 dark:text-gray-400">Industry-standard encryption protects your most sensitive information. You control exactly when and how your legacy is shared.</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
                >
                  <Heart className="w-5 h-5" />
              Unlock Last Wish with Premium
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right Side - Testimonials */}
            <div className="space-y-8">
              {/* Featured Testimonial */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-800 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">S</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">Sarah Mitchell</h4>
                    <p className="text-gray-600 dark:text-gray-400">Mother of 3, Premium User</p>
                  </div>
                </div>
                <blockquote className="text-lg text-gray-700 dark:text-gray-300 italic mb-6 leading-relaxed">
                  "Last Wish gave me peace of mind knowing my children will have everything they need. 
                  I recorded personal messages for each of them, and stored all our important documents. 
                  It's like having a conversation with my future self."
                </blockquote>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">5.0 rating</span>
                </div>
              </div>

              {/* Additional Testimonials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">M</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900 dark:text-white">Michael Chen</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Business Owner</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm italic mb-3">
                    "As a business owner, I needed to ensure my family had access to all my accounts and passwords. 
                    Last Wish made this so easy and secure."
                  </p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">E</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900 dark:text-white">Emily Rodriguez</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Retired Teacher</p>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm italic mb-3">
                    "I love being able to leave personal messages for my grandchildren. 
                    They'll read my stories and memories even when I'm gone."
                  </p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white dark:bg-gray-900 px-6 text-sm text-gray-500 dark:text-gray-400">
            <Heart className="w-5 h-5 mx-auto" />
          </span>
        </div>
      </div>

      {/* Comparison Section - Why Choose Balanze */}
      <section className="py-20 bg-white dark:bg-gray-900 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Balanze</span>?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              See how we compare to other financial tracking solutions
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            {/* Mobile-friendly comparison */}
            <div className="md:hidden space-y-4">
              {[
                { feature: 'Multi-currency support', balanze: true, others: false },
                { feature: 'Lend & borrow tracking', balanze: true, others: false },
                { feature: 'Unlimited accounts', balanze: true, others: false },
                { feature: 'Last Wish feature', balanze: true, others: false },
                { feature: 'Industry-standard security', balanze: true, others: true },
                { feature: 'Mobile app', balanze: true, others: true },
                { feature: 'Dark mode', balanze: true, others: false },
                { feature: 'Data export', balanze: true, others: 'Limited' },
              ].map((row, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
                    {row.feature}
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-4">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Balanze</div>
                      <div className="flex justify-center">
                        {typeof row.balanze === 'boolean' ? (
                          row.balanze ? (
                            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                          ) : (
                            <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                          )
                        ) : (
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.balanze}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Others</div>
                      <div className="flex justify-center">
                        {typeof row.others === 'boolean' ? (
                          row.others ? (
                            <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                          ) : (
                            <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                          )
                        ) : (
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{row.others}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop comparison table */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
              {/* Header Row */}
              <div className="hidden md:block"></div>
              <div className="text-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl">
                <h3 className="text-xl font-bold text-white">Balanze</h3>
              </div>
              <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-t-xl">
                <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400">Others</h3>
              </div>

              {/* Comparison Rows */}
              {[
                { feature: 'Multi-currency support', balanze: true, others: false },
                { feature: 'Recurring transactions', balanze: true, others: false },
                { feature: 'Lend & borrow tracking', balanze: true, others: false },
                { feature: 'Unlimited accounts', balanze: true, others: false },
                { feature: 'Last Wish feature', balanze: true, others: false },
                { feature: 'Industry-standard security', balanze: true, others: true },
                { feature: 'Mobile app', balanze: true, others: true },
                { feature: 'Dark mode', balanze: true, others: false },
                { feature: 'Data export', balanze: true, others: 'Limited' },
              ].map((row, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-center p-4 font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    {row.feature}
                  </div>
                  <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    {typeof row.balanze === 'boolean' ? (
                      row.balanze ? (
                        <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                      )
                    ) : (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.balanze}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    {typeof row.others === 'boolean' ? (
                      row.others ? (
                        <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                      )
                    ) : (
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{row.others}</span>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
            
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/auth')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg inline-flex items-center"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Choose the perfect plan for your financial needs
            </p>
            
            {/* Billing Cycle Selector */}
            <div className="mt-6 flex items-center justify-center">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex w-full max-w-sm">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 px-3 lg:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('one-time')}
                  className={`flex-1 px-3 lg:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingCycle === 'one-time'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  One-time
                  <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                    Lifetime access
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 shadow p-4 lg:p-5 transition-all duration-200 hover:shadow-xl bg-white dark:bg-gray-800 flex flex-col h-full">
              <div className="text-center mb-5">
                <h3 className="text-lg lg:text-xl font-semibold mb-2 text-gray-900 dark:text-white">Free</h3>
                <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">Perfect for getting started with basic financial tracking</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">$0</span>
                  <span className="ml-1 text-sm lg:text-base text-gray-500 dark:text-gray-400">/{billingCycle === 'one-time' ? 'lifetime' : 'month'}</span>
                </div>
                
                {/* Free plan promotional badge */}
                <div className="mt-2 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    Always Free
                  </span>
                </div>
              </div>

              <ul className="space-y-2 lg:space-y-2.5 mb-4 lg:mb-5 flex-1">
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <BarChart3 className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Basic financial tracking</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Users className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Up to 3 accounts</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Globe className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">1 currency only</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <CreditCard className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">25 transactions per month</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Download className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">50 purchases (lifetime)</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <BarChart3 className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Basic reports</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Email support (24-48h response)</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <BarChart3 className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Basic analytics</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Settings className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-500 line-through">Custom categories</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Repeat className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-500 line-through">Recurring transactions</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Users className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-500 line-through">Lend & borrow tracking</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Download className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-500 line-through">Data export</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Heart className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-500 line-through">Last Wish - Digital Time Capsule</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 ml-2">
                    <Heart className="w-3 h-3 mr-1" />
                    Premium
                  </span>
                </li>
              </ul>

              <div className="mt-auto pt-4 lg:pt-5">
                <button
                  className="w-full rounded-lg px-3 lg:px-4 py-2 lg:py-2.5 text-sm font-medium transition-colors bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600"
                  onClick={() => navigate('/auth')}
                >
                  Get Started Free
                </button>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="relative rounded-xl border border-blue-500 shadow-lg dark:border-blue-400 p-4 lg:p-5 transition-all duration-200 hover:shadow-xl bg-white dark:bg-gray-800 flex flex-col h-full">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 dark:from-purple-900/50 dark:to-blue-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                  <Zap className="w-4 h-4 mr-1" />
                  Recommended
                </span>
              </div>

              <div className="text-center mb-5">
                <h3 className="text-lg lg:text-xl font-semibold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Premium</h3>
                <p className="text-sm mb-4 text-purple-700 dark:text-purple-300 font-medium">Unlock unlimited features and advanced financial insights</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    ${billingCycle === 'one-time' ? '199.99' : '7.99'}
                  </span>
                  <span className="ml-1 text-sm lg:text-base text-purple-600 dark:text-purple-400">/{billingCycle === 'one-time' ? 'lifetime' : 'month'}</span>
                </div>
                
                {/* Show lifetime access benefit for one-time Premium */}
                {billingCycle === 'one-time' && (
                  <div className="mt-2 text-center">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      ✨ Premium lifetime access - No recurring fees
                    </span>
                  </div>
                )}
                
                {/* First month discount badge - only show for monthly */}
                {billingCycle === 'monthly' && (
                  <div className="mt-2 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                      First month 50% off
                    </span>
                  </div>
                )}
              </div>

              <ul className="space-y-2 lg:space-y-2.5 mb-4 lg:mb-5 flex-1">
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Check className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Everything in Free</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Users className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Unlimited accounts</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Globe className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Unlimited currencies</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <CreditCard className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Unlimited transactions</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Download className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Unlimited purchases</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <BarChart3 className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Advanced analytics</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Priority email support (4-8h response)</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Settings className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Custom categories</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Repeat className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Recurring transactions</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Users className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Lend & borrow tracking</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <BarChart3 className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Advanced reporting</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Download className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Data export (CSV, Excel, PDF)</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex items-center flex-1">
                    <Heart className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Last Wish - Digital Time Capsule</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 ml-2">
                    <Heart className="w-3 h-3 mr-1" />
                    Premium
                  </span>
                </li>
              </ul>

              <div className="mt-auto pt-4 lg:pt-5">
                <button
                  className="w-full rounded-lg px-3 lg:px-4 py-2 lg:py-2.5 text-sm font-medium transition-colors bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  onClick={() => {
                    const planId = billingCycle === 'one-time' ? 'premium_lifetime' : 'premium_monthly';
                    const price = billingCycle === 'one-time' ? 199.99 : 7.99;
                    openPaymentModal(planId, 'Premium', price, billingCycle);
                  }}
                >
                  {billingCycle === 'one-time' ? 'Get Lifetime Access' : 'Start Free Trial'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                <span className="font-semibold">Premium plan</span> includes a{' '}
                <span className="font-bold text-green-800 dark:text-green-200">14-day free trial</span>. 
                No credit card required.
              </p>
            </div>
            
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 rounded-lg shadow-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -right-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Financial Life?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already taking control of their finances. Start your free trial today—no credit card required.
            </p>
            
            {/* Value propositions */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
              <div className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5" />
                <span className="font-medium">14-day free trial</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5" />
                <span className="font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Check className="w-5 h-5" />
                <span className="font-medium">Cancel anytime</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/auth')}
                className="bg-white text-purple-600 px-10 py-5 rounded-lg text-lg font-bold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl inline-flex items-center"
              >
                Start Free Trial Now
                <ArrowRight className="w-6 h-6 ml-2" />
              </button>
              <button
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-transparent border-2 border-white text-white px-10 py-5 rounded-lg text-lg font-bold hover:bg-white/10 transition-all duration-300 inline-flex items-center"
              >
                View Pricing
              </button>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 md:gap-4 text-white/80 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>SSL Secured</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-white/40 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">12,500+ Users</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-white/40 rounded-full"></div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-current flex-shrink-0" />
                <span className="whitespace-nowrap">4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="landing-page-safe-bottom">
        <Footer />
      </div>
      </main>

      {/* Dark Mode Toggle Button - Always Visible */}
      <button
        onClick={toggleTheme}
        className="fixed right-8 z-50 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600 floating-bottom-safe"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <Sun className="w-6 h-6" />
        ) : (
          <Moon className="w-6 h-6" />
        )}
      </button>

      {/* Back to Top Button - Only visible when scrolling */}
      {showBackToTop && (
        <button
          onClick={() => {
            const isAndroid = /Android/i.test(navigator.userAgent);
            if (isAndroid) {
              // On Android, scroll the #root element
              const rootElement = document.getElementById('root');
              if (rootElement) {
                rootElement.scrollTo({ top: 0, behavior: 'smooth' });
              }
            } else {
              // On other platforms, scroll the window
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="fixed right-8 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-colors floating-bottom-safe-secondary"
          aria-label="Back to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}

      {/* Paddle Payment Modal */}
      <PaddlePaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
        planId={paymentModal.planId}
        planName={paymentModal.planName}
        price={paymentModal.price}
        billingCycle={paymentModal.billingCycle}
        features={paymentModal.features}
      />

      </div>
    </div>
    </>
  );
};

export default LandingPage; 


import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Wallet, Target, Handshake, PiggyBank, Bell, Shield, Heart,
  Check, ChevronDown, ChevronUp, Star, ArrowRight, BarChart3, PieChart,
  Users, Globe, Mail, Phone, Facebook, Twitter, Instagram, Linkedin, Github, ArrowUp, Moon, Sun, LogOut, Menu, X,
  Zap, MessageSquare, Download, Settings, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InteractiveBackground from '../components/InteractiveBackground';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'one-time'>('monthly');
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    // Set Manrope font for the whole page
    document.body.style.fontFamily = 'Manrope, sans-serif';
    // Back to top button visibility
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.fontFamily = '';
    };
  }, []);

  const features = [
    { icon: TrendingUp, title: "Spending Tracker", description: "See exactly where your money goes." },
    { icon: Wallet, title: "Budget Planner", description: "Set budgets and beat overspending." },
    { icon: Handshake, title: "Lent & Borrow", description: "Keep tabs on loans and IOUs." },
    { icon: PiggyBank, title: "Savings Goals", description: "Visualize your progress with goal thermometers." },
    { icon: Bell, title: "Smart Alerts", description: "Get nudges when you're off track." },
    { icon: Shield, title: "Secure & Private", description: "Bank-level security & data encryption." },
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
    { question: "How secure is my data?", answer: "We use bank-level encryption and security measures to protect your financial data." },
    { question: "Can I cancel anytime?", answer: "Yes! You can cancel your subscription at any time with no cancellation fees." },
    { question: "What payment methods are supported?", answer: "We accept all major credit cards, PayPal, and Apple Pay." },
    { question: "Is there a free trial?", answer: "Yes! We offer a 14-day free trial with full access to all features." },
    { question: "Can I export my data?", answer: "Absolutely! You can export your data in CSV, PDF, or Excel formats at any time." }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <InteractiveBackground />
      
      <div className="relative z-10">
        {/* Navigation Header */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Balanze
                </h1>
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
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Pricing
                </button>
                <button
                  className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Testimonials
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
                      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Pricing
                  </button>
                  <button
                    className="block w-full text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                    onClick={() => {
                      document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' });
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Testimonials
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                New: Last Wish Planning Feature
              </div>
            </div>
            
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
            
            {/* Trust indicators */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>10,000+ users trust us</span>
              </div>
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                <span>Available worldwide</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 flex justify-center">
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="/main-dashboard.png" 
                  alt="Balanze Dashboard"
                  className="w-full max-w-4xl rounded-xl"
                />
              </div>
              <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Demo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 relative">
        <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8">
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
                className="bg-white dark:bg-gray-700 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center w-72"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Showcase */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 relative">
        <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8">
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
                />
              </div>
              {/* Removed See Dashboard button */}
            </div>
          </div>
        </div>
      </section>

      {/* Last Wish Feature Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 relative">
        <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-center gap-12">
          <div className="flex-shrink-0 flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg mb-8 md:mb-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 48 48" className="w-16 h-16 text-white"><path fill="currentColor" d="M24 44c-7.732 0-14-6.268-14-14 0-5.25 3.02-9.77 7.5-12.06V14a6.5 6.5 0 1 1 13 0v3.94C34.98 20.23 38 24.75 38 30c0 7.732-6.268 14-14 14Zm-2-30a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/></svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Last Wish</span> — Your Digital Time Capsule
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto md:mx-0">
              Securely record your final wishes, messages, and important information for your loved ones. Balanze's <b>Last Wish</b> feature lets you create a digital legacy, ensuring your voice and intentions are preserved and delivered when it matters most.
            </p>
            <ul className="text-left text-gray-700 dark:text-gray-300 mb-6 max-w-2xl mx-auto md:mx-0 space-y-2">
              <li className="flex items-center"><span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3"></span> Leave personal messages for family and friends</li>
              <li className="flex items-center"><span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3"></span> Store important documents and instructions</li>
              <li className="flex items-center"><span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-3"></span> 100% private, encrypted, and only shared when you choose</li>
            </ul>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300">
              Unlock Last Wish with Premium
            </button>
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
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex w-full max-w-xs">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 px-3 md:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('one-time')}
                  className={`flex-1 px-3 md:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 shadow p-4 md:p-6 transition-all duration-200 hover:shadow-xl bg-white dark:bg-gray-800 flex flex-col h-full">
              <div className="text-center mb-6">
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900 dark:text-white">Free</h3>
                <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">Perfect for getting started with basic financial tracking</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">$0</span>
                  <span className="ml-1 text-base md:text-lg text-gray-500 dark:text-gray-400">/{billingCycle === 'one-time' ? 'lifetime' : 'month'}</span>
                </div>
                
                {/* Free plan promotional badge */}
                <div className="mt-2 text-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    Always Free
                  </span>
                </div>
              </div>

              <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6 flex-1">
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
                    <Download className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Basic purchase tracking</span>
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
                    <CreditCard className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">100 transactions limit</span>
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
                    <Users className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-500 line-through">Lent & borrow tracking</span>
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

              <div className="mt-auto pt-4 md:pt-6">
                <button
                  className="w-full rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm font-medium transition-colors bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600"
                  onClick={() => navigate('/auth')}
                >
                  Get Started Free
                </button>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="relative rounded-xl border border-blue-500 shadow-lg dark:border-blue-400 p-4 md:p-6 transition-all duration-200 hover:shadow-xl bg-white dark:bg-gray-800 flex flex-col h-full transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 dark:from-purple-900/50 dark:to-blue-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                  <Zap className="w-4 h-4 mr-1" />
                  Recommended
                </span>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-lg md:text-xl font-semibold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Premium</h3>
                <p className="text-sm mb-4 text-purple-700 dark:text-purple-300 font-medium">Unlock unlimited features and advanced financial insights</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    ${billingCycle === 'one-time' ? '99.99' : '7.99'}
                  </span>
                  <span className="ml-1 text-base md:text-lg text-purple-600 dark:text-purple-400">/{billingCycle === 'one-time' ? 'lifetime' : 'month'}</span>
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

              <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6 flex-1">
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
                    <Users className="w-4 h-4 mr-2 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Lent & borrow tracking</span>
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

              <div className="mt-auto pt-4 md:pt-6">
                <button
                  className="w-full rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm font-medium transition-colors bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                  onClick={() => navigate('/auth')}
                >
                  Start Free Trial
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

      {/* Testimonials */}
      <section id="testimonials" className="py-20 relative">
        <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Thousands of Users
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              See what our users are saying about Balanze
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "{testimonial.quote}"
                </p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            ))}
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <h3 className="text-2xl font-bold">Balanze</h3>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Take control of your financial future with our comprehensive personal finance platform.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="/about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="/privacypolicy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/refundpolicy" className="text-gray-400 hover:text-white transition-colors">Refund Policy</a></li>
                <li><a href="/termsofservice" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 Balanze. All rights reserved.
              </p>
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <a href="mailto:shalconnect00@gmail.com" className="text-gray-400 hover:text-white transition-colors text-sm">
                  <Mail className="w-4 h-4 inline mr-2" />
                  shalconnect00@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Dark Mode Toggle Button - Always Visible */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-8 right-8 z-50 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600"
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
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-8 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-full shadow-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
          aria-label="Back to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
      </div>
    </div>
  );
};

export default LandingPage; 
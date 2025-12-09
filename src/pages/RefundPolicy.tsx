import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Wallet, Target, Handshake, PiggyBank, Bell, Shield, Heart,
  Check, ChevronDown, ChevronUp, Star, ArrowRight, BarChart3, PieChart,
  Users, Globe, Mail, Phone, Facebook, Twitter, Instagram, Linkedin, Github, ArrowUp, Moon, Sun, LogOut, Menu, X, RefreshCw, Clock, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InteractiveBackground from '../components/InteractiveBackground';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { Footer } from '../components/Layout/Footer';
import { RefundRequestForm } from '../components/common/RefundRequestForm';

const RefundPolicy: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    // Set Manrope font for the whole page
    document.body.style.fontFamily = 'Manrope, sans-serif';
    return () => {
      window.removeEventListener('scroll', () => {});
      document.body.style.fontFamily = '';
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <InteractiveBackground />
      
      <div className="relative z-10">
        {/* Navigation Header */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
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
                  onClick={() => navigate('/about')}
                >
                  About
                </button>
                <button
                  className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => navigate('/blog')}
                >
                  Blog
                </button>
                <button
                  className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => navigate('/privacypolicy')}
                >
                  Privacy Policy
                </button>
                <button
                  className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => navigate('/termsofservice')}
                >
                  Terms of Service
                </button>
                <button
                  className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => navigate('/refundpolicy')}
                >
                  Refund Policy
                </button>
                {user ? (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Get Started
                  </button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="px-4 py-4 space-y-4">
                <button
                  className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => {
                    navigate('/about');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  About
                </button>
                <button
                  className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => {
                    navigate('/blog');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Blog
                </button>
                <button
                  className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => {
                    navigate('/privacypolicy');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Privacy Policy
                </button>
                <button
                  className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => {
                    navigate('/termsofservice');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Terms of Service
                </button>
                <button
                  className="block w-full text-left text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                  onClick={() => {
                    navigate('/refundpolicy');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Refund Policy
                </button>
                {user ? (
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      navigate('/login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Get Started
                  </button>
                )}
              </div>
            </div>
          )}
        </nav>


        {/* Main Content */}
        <div className="pt-16 bg-white dark:bg-gray-900 scroll-smooth font-manrope">
          <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-8 text-center">Refund Policy</h1>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8">
              <div className="flex items-center mb-6">
                <RefreshCw className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">14-Day Money-Back Guarantee</h2>
              </div>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                We stand behind our Balanze Premium service with a comprehensive 14-day money-back guarantee. 
                If you're not completely satisfied with your purchase, we'll provide a full refund within 14 days of your initial purchase.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8">
              <div className="flex items-center mb-6">
                <Clock className="w-8 h-8 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Refund Eligibility</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Timeframe:</strong> Refund requests must be submitted within 14 days of your original purchase date.
                  </p>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Both Plans:</strong> Refunds are available for both monthly ($7.99) and lifetime ($199.99) Premium plans.
                  </p>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>No Questions Asked:</strong> We don't require detailed explanations for refund requests.
                  </p>
                </div>
                <div className="flex items-start">
                  <Check className="w-5 h-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Full Refund:</strong> You'll receive 100% of your payment back to your original payment method.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8">
              <div className="flex items-center mb-6">
                <CreditCard className="w-8 h-8 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How to Request a Refund</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">1</div>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Contact Us:</strong> Send an email to <a href="mailto:hello@shalconnects.com" className="text-blue-600 hover:underline">hello@shalconnects.com</a> with the subject line "Refund Request".
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">2</div>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Provide Details:</strong> Include your email address used for the purchase and the approximate date of purchase.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">3</div>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Processing:</strong> We'll process your refund within 3-5 business days and send you a confirmation email.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-1 flex-shrink-0">4</div>
                  <p className="text-gray-700 dark:text-gray-300">
                    <strong>Account Access:</strong> Your Premium features will be disabled immediately upon refund processing.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8">
              <div className="flex items-center mb-6">
                <Shield className="w-8 h-8 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Important Considerations</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    <strong>Digital Product:</strong> Since Balanze Premium is a digital service, refunds will be processed to your original payment method. Processing times may vary depending on your bank or payment provider.
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-200 font-medium">
                    <strong>Lifetime Access:</strong> If you purchased the lifetime plan and request a refund, you'll lose access to all Premium features permanently. Consider this carefully before requesting a refund.
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    <strong>Free Plan:</strong> After a refund, you'll automatically revert to our free plan, which includes basic financial tracking features.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8">
              <div className="flex items-center mb-6">
                <Heart className="w-8 h-8 text-red-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Our Commitment to You</h2>
              </div>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                We believe in the value of our Balanze Premium service and want you to feel confident in your purchase. 
                Our refund policy reflects our commitment to customer satisfaction and trust.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                If you have any questions about our refund policy or need assistance with your account, 
                please don't hesitate to contact us at <a href="mailto:hello@shalconnects.com" className="text-blue-600 hover:underline">hello@shalconnects.com</a>. 
                We're here to help!
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8">
              <div className="flex items-center mb-6">
                <Users className="w-8 h-8 text-indigo-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Can I get a refund after 30 days?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Our refund policy is strictly limited to 14 days from the original purchase date. After this period, 
                    we cannot process refunds as per our terms of service.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    What happens to my data after a refund?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Your data will be retained for 14 days after the refund is processed. During this time, you can 
                    export your data if needed. After 14 days, your data will be permanently deleted from our systems.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Can I repurchase after getting a refund?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Yes, you can repurchase Balanze Premium at any time after receiving a refund. However, 
                    you'll need to create a new account as your previous account will be deactivated.
                  </p>
                </div>
                
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    How long does it take to process a refund?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Refunds are typically processed within 3-5 business days. The time it takes for the refund 
                    to appear in your account depends on your bank or payment provider, usually 5-10 business days.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    What if I have technical issues with the app?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Before requesting a refund, please contact our support team at{' '}
                    <a href="mailto:hello@shalconnects.com" className="text-blue-600 hover:underline">hello@shalconnects.com</a>. 
                    We're committed to resolving any technical issues you may encounter.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Ready to Request a Refund?
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Use our convenient refund request form to submit your request quickly and easily.
                </p>
                <button
                  onClick={() => setShowRefundForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Request Refund
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-8">
              <p className="text-center text-yellow-800 dark:text-yellow-200 font-medium">
                ⚠️ This refund policy may be updated from time to time. Please review it regularly for any changes.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />

        {/* Dark Mode Toggle Button - Always Visible */}
        <button
          onClick={toggleTheme}
          className="fixed right-8 z-50 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-600"
          style={{
            bottom: (() => {
              const isAndroid = typeof window !== 'undefined' && /Android/i.test(navigator.userAgent);
              const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;
              if (isAndroid && isCapacitor) {
                return `max(3.5rem, calc(3.5rem + env(safe-area-inset-bottom, 0px)))`;
              }
              return `max(2rem, calc(2rem + env(safe-area-inset-bottom, 0px)))`;
            })()
          }}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="w-6 h-6" />
          ) : (
            <Moon className="w-6 h-6" />
          )}
        </button>

        {/* Refund Request Form Modal */}
        <RefundRequestForm
          isOpen={showRefundForm}
          onClose={() => setShowRefundForm(false)}
        />
      </div>
    </div>
  );
};

export default RefundPolicy;


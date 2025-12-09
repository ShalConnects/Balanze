import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, Mail, Facebook, Twitter, Instagram, Linkedin, Github, 
  LogOut, Menu, X, BookOpen, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InteractiveBackground from '../components/InteractiveBackground';
import { useAuthStore } from '../store/authStore';
import { DeleteConfirmationModal } from '../components/common/DeleteConfirmationModal';
import KBSearch from '../components/KBSearch';
import Breadcrumb from '../components/Breadcrumb';
import { Footer } from '../components/Layout/Footer';

const PublicHelpCenter: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
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
                {user ? (
                  <div className="flex items-center space-x-4">
                    <button
                      className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                      onClick={() => navigate('/dashboard')}
                    >
                      Dashboard
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Welcome, {user.email}
                    </span>
                    <button 
                      onClick={() => setShowLogoutConfirm(true)}
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
                      navigate('/about');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    About
                  </button>
                  <button
                    className="block w-full text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                    onClick={() => {
                      navigate('/blog');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Blog
                  </button>
                  {user && (
                    <button
                      className="block w-full text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                      onClick={() => {
                        navigate('/dashboard');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Dashboard
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <div className="pt-16 bg-white dark:bg-gray-800 scroll-smooth font-manrope">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            {/* Breadcrumb */}
            <div className="mb-4 sm:mb-6">
              <Breadcrumb />
            </div>
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-white/20 dark:bg-white/30 rounded-full flex-shrink-0 self-start">
                    <LifeBuoy className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">Welcome to the Help Center!</h1>
                    <p className="text-blue-100 dark:text-blue-200 text-sm sm:text-base lg:text-lg leading-relaxed">
                      Discover guides, tutorials, and tips to master Balanze. Can't find what you're looking for?{' '}
                      <button 
                        onClick={() => window.open('mailto:hello@shalconnects.com', '_blank')}
                        className="underline hover:text-white dark:hover:text-blue-100 font-semibold whitespace-nowrap"
                      >
                        Contact our support team
                      </button>
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm text-blue-100 dark:text-blue-200">Last updated</div>
                    <div className="font-semibold">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Knowledge Base Search Component */}
            <div className="mt-8">
              <KBSearch />
            </div>

            {/* Topic Clusters Navigation */}
            <div className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-4">
                Browse by Topic
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                Explore our organized topic clusters to find exactly what you need.
              </p>
              <button
                onClick={() => navigate('/help-center/topics')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <BookOpen className="w-4 h-4" />
                Browse All Topics
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Start Path */}
            <div className="mt-6 sm:mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-4">
                🚀 Quick Start Path
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                New to Balanze? Follow this step-by-step path to get started:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/help-center/getting-started-guide')}
                  className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-500 transition-colors text-left"
                >
                  <div className="text-xl sm:text-2xl mb-2">1️⃣</div>
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">Get Started</h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Complete setup guide</p>
                </button>
                
                <button
                  onClick={() => navigate('/help-center/create-first-account')}
                  className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors text-left"
                >
                  <div className="text-xl sm:text-2xl mb-2">2️⃣</div>
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">Create Account</h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Add your first account</p>
                </button>
                
                <button
                  onClick={() => navigate('/help-center/create-first-transaction')}
                  className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 transition-colors text-left"
                >
                  <div className="text-xl sm:text-2xl mb-2">3️⃣</div>
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">Add Transaction</h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Record income/expenses</p>
                </button>
                
                <button
                  onClick={() => navigate('/help-center/analytics-dashboard')}
                  className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 transition-colors text-left"
                >
                  <div className="text-xl sm:text-2xl mb-2">4️⃣</div>
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">View Analytics</h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Understand your finances</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />

        {/* Logout Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={async () => {
            await signOut();
            setShowLogoutConfirm(false);
          }}
          title="Confirm Logout"
          message="Are you sure you want to logout? You will need to sign in again to access your account."
          recordDetails={
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p>You will be signed out of your account and redirected to the login page.</p>
            </div>
          }
          confirmLabel="Logout"
          cancelLabel="Cancel"
        />
      </div>
    </div>
  );
};

export default PublicHelpCenter;


import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Moon, Sun, Menu, X, LogOut } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import InteractiveBackground from '../components/InteractiveBackground';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { Footer } from '../components/Layout/Footer';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, signOut } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Set Manrope font for the whole page
    document.body.style.fontFamily = 'Manrope, sans-serif';
    return () => {
      document.body.style.fontFamily = '';
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | Balanze</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Helmet>
      
      <div className="relative min-h-screen overflow-hidden">
        <InteractiveBackground />
        
        <div className="relative z-10">
          {/* Navigation Header */}
          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
                    onClick={() => navigate('/blog')}
                  >
                    Blog
                  </button>
                  <button
                    className="bg-transparent text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                    onClick={() => navigate('/about')}
                  >
                    About
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
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold"
                      onClick={() => navigate('/auth')}
                    >
                      Sign In
                    </button>
                  )}
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
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
                        navigate('/blog');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Blog
                    </button>
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
                        navigate('/help-center');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Help Center
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
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          toggleTheme();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center w-full text-left px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                      >
                        {isDarkMode ? (
                          <>
                            <Sun className="w-5 h-5 mr-2" />
                            Light Mode
                          </>
                        ) : (
                          <>
                            <Moon className="w-5 h-5 mr-2" />
                            Dark Mode
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* 404 Content */}
          <div className="pt-16 min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center max-w-2xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                    404
                  </h1>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Page Not Found
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Go Back
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold"
                  >
                    <Home className="w-5 h-5" />
                    Go Home
                  </button>
                  {user && (
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-colors font-semibold"
                    >
                      <Search className="w-5 h-5" />
                      Dashboard
                    </button>
                  )}
                </div>

                {/* Helpful Links */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    You might be looking for:
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={() => navigate('/blog')}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                    >
                      Blog
                    </button>
                    <button
                      onClick={() => navigate('/about')}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                    >
                      About
                    </button>
                    <button
                      onClick={() => navigate('/help-center')}
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                    >
                      Help Center
                    </button>
                    {!user && (
                      <button
                        onClick={() => navigate('/auth')}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </>
  );
};

export default NotFound;


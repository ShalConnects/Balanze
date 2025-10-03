import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, Mail, Facebook, Twitter, Instagram, Linkedin, Github, 
  LogOut, Menu, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InteractiveBackground from '../components/InteractiveBackground';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import KBSearch from '../components/KBSearch';

const PublicHelpCenter: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
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
        <div className="pt-16 bg-white dark:bg-gray-900 scroll-smooth font-manrope">
          <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mb-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    <LifeBuoy className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome to the Help Center!</h1>
                    <p className="text-blue-100 text-lg">
                      Discover guides, tutorials, and tips to master Balanze. Can't find what you're looking for? 
                      <button 
                        onClick={() => window.open('mailto:shalconnect00@gmail.com', '_blank')}
                        className="underline hover:text-white ml-1 font-semibold"
                      >
                        Contact our support team
                      </button>
                    </p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm text-blue-100">Last updated</div>
                    <div className="font-semibold">{new Date().toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Knowledge Base Search Component */}
            <div className="mt-8">
              <KBSearch />
            </div>
          </div>
        </div>

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
                  <li><a href="/help-center" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
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

      </div>
    </div>
  );
};

export default PublicHelpCenter;

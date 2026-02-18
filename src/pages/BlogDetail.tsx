import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, Wallet, Target, Handshake, PiggyBank, Bell, Shield, Heart,
  Check, ChevronDown, ChevronUp, Star, ArrowRight, BarChart3, PieChart,
  Users, Globe, Mail, Phone, Facebook, Twitter, Instagram, Linkedin, Github, ArrowUp, Moon, Sun, LogOut, Menu, X, ArrowLeft, Calendar, Clock, User
} from 'lucide-react';
import InteractiveBackground from '../components/InteractiveBackground';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { Footer } from '../components/Layout/Footer';
import { sanitizeHtml } from '../lib/sanitize';
import { getArticle, HABIT_GARDEN_PATH, ZAKAH_PAGE_PATH } from '../data/blogArticles';
import { openShare } from '../utils/share';

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, signOut } = useAuthStore();

  const article = slug ? getArticle(slug) : undefined;

  useEffect(() => {
    document.body.style.fontFamily = 'Manrope, sans-serif';
    return () => { document.body.style.fontFamily = ''; };
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || !article) return;
    const internalPaths = [HABIT_GARDEN_PATH, ZAKAH_PAGE_PATH] as const;
    const cleanups: (() => void)[] = [];
    internalPaths.forEach((path) => {
      const links = el.querySelectorAll<HTMLAnchorElement>(`a[href="${CSS.escape(path)}"]`);
      const handler = (e: Event) => {
        e.preventDefault();
        navigate(path);
      };
      links.forEach((a) => a.addEventListener('click', handler));
      cleanups.push(() => links.forEach((a) => a.removeEventListener('click', handler)));
    });
    return () => cleanups.forEach((f) => f());
  }, [article, navigate]);

  if (!article) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <InteractiveBackground />
        <div className="relative z-10">
          <div className="pt-16 min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Article Not Found</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">The article you're looking for doesn't exist.</p>
              <button
                onClick={() => navigate('/blog')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold"
              >
                Back to Blog
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <div className="pt-16 bg-white dark:bg-gray-900 scroll-smooth font-manrope">
          <div className="w-4/5 mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Back Button */}
            <button
              onClick={() => navigate('/blog')}
              className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Blog</span>
            </button>

            {/* Article Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-medium">
                  {article.category}
                </span>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{article.date}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTime}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{article.author}</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                {article.title}
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                {article.summary}
              </p>
            </div>

            {/* Featured Image */}
            <div className="mb-12">
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-lg"
              />
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <div
                ref={contentRef}
                className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
              />
            </div>

            {/* Article Footer */}
            <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500 dark:text-gray-400">Share this article:</span>
                  <div className="flex space-x-2">
                    {(['twitter', 'facebook', 'linkedin'] as const).map((p) => {
                      const Icon = { twitter: Twitter, facebook: Facebook, linkedin: Linkedin }[p];
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => openShare(p, window.location.href, article.title)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          aria-label={`Share on ${p}`}
                        >
                          <Icon className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/blog')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold"
                >
                  Back to Blog
                </button>
              </div>
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
      </div>
    </div>
  );
};

export default BlogDetail; 


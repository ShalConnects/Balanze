// src/components/KBSearch.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Search, BookOpen, ExternalLink, Clock, Tag, Home, Sun, Moon, User, X, History, TrendingUp, ThumbsUp, ThumbsDown, Clock as ClockIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { trackHelpCenter } from '../lib/analytics';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { getUserReadingHistory, getUserArticleStats } from '../lib/articleHistory';
import clsx from 'clsx';

interface KBArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;
  readTime: string;
}

interface KBSearchProps {
  className?: string;
}

interface ArticleReadingHistory {
  id: string;
  article_slug: string;
  article_title: string;
  article_category: string | null;
  read_at: string;
  time_spent_seconds: number;
  feedback: boolean | null;
  feedback_given_at: string | null;
}

interface UserBubbleProps {
  userName: string;
  userEmail: string;
  userPicUrl: string | null;
}

// Mock KB articles - in production, this would come from your CMS/API
const MOCK_ARTICLES: KBArticle[] = [
  {
    slug: 'settings-page-comprehensive-guide',
    title: 'Complete Settings Page Guide',
    description: 'Comprehensive guide to all Settings page tabs and features in Balanze',
    category: 'Settings & Configuration',
    tags: ['settings', 'configuration', 'account', 'preferences', 'categories', 'plans', 'last-wish'],
    difficulty: 'beginner',
    lastUpdated: '2024-01-15',
    readTime: '12 min read'
  },
  {
    slug: 'getting-started-guide',
    title: 'Getting Started with Balanze',
    description: 'Complete guide to setting up your account and adding your first transactions',
    category: 'Getting Started',
    tags: ['setup', 'beginner', 'accounts', 'transactions'],
    difficulty: 'beginner',
    lastUpdated: '2024-01-15',
    readTime: '5 min read'
  },
  {
    slug: 'how-to-create-your-first-transfer',
    title: 'How to Create Your First Transfer',
    description: 'Complete guide to understanding and creating transfers between accounts, including Currency Transfer, DPS Transfer, and In-between Transfer',
    category: 'Transfers',
    tags: ['transfers', 'currency', 'dps', 'accounts', 'beginner'],
    difficulty: 'beginner',
    lastUpdated: '2024-01-15',
    readTime: '8 min read'
  },
  {
    slug: 'create-first-account',
    title: 'How to Create Your First Account',
    description: 'Step-by-step guide to adding bank accounts, credit cards, and cash wallets',
    category: 'Accounts',
    tags: ['accounts', 'setup', 'banking'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0], // dynamically set to today
    readTime: '6 min read' // updated based on content length
  },
  {
    slug: 'create-first-transaction',
    title: 'How to Create Your First Transaction',
    description: 'Step-by-step guide to adding your first income and expense transactions',
    category: 'Transactions',
    tags: ['transactions', 'income', 'expenses', 'beginner'],
    difficulty: 'beginner',
    lastUpdated: '2024-01-15',
    readTime: '4 min read'
  },
  {
    slug: 'how-to-make-your-first-purchase',
    title: 'How to Make Your First Purchase',
    description: 'Learn how to use the Purchase feature to track planned purchases and manage your spending goals',
    category: 'Transactions',
    tags: ['purchase', 'spending', 'goals', 'transactions'],
    difficulty: 'beginner',
    lastUpdated: '2024-01-15',
    readTime: '5 min read'
  },
  {
    slug: 'transaction-management',
    title: 'Managing Income and Expenses',
    description: 'Learn how to add, categorize, and organize your financial transactions',
    category: 'Transactions',
    tags: ['transactions', 'income', 'expenses', 'categories'],
    difficulty: 'beginner',
    lastUpdated: '2024-01-12',
    readTime: '7 min read'
  },
  {
    slug: 'multi-currency-setup',
    title: 'Working with Multiple Currencies',
    description: 'Set up and manage accounts in different currencies with automatic conversion',
    category: 'Advanced',
    tags: ['currency', 'international', 'conversion'],
    difficulty: 'intermediate',
    lastUpdated: '2024-01-08',
    readTime: '6 min read'
  },
  {
    slug: 'data-export-import',
    title: 'Exporting and Importing Financial Data',
    description: 'Export your data for tax preparation or import from other financial apps',
    category: 'Advanced',
    tags: ['export', 'import', 'data', 'csv', 'backup'],
    difficulty: 'advanced',
    lastUpdated: '2024-01-09',
    readTime: '10 min read'
  },
  {
    slug: 'mobile-app-features',
    title: 'Using Balanze on Mobile Devices',
    description: 'Access all features on your phone with our responsive web app',
    category: 'Mobile',
    tags: ['mobile', 'responsive', 'app'],
    difficulty: 'beginner',
    lastUpdated: '2024-01-13',
    readTime: '5 min read'
  },
  {
    slug: 'how-to-create-lent-borrow-records',
    title: 'How to Create Lent & Borrow Records',
    description: 'Learn how to track money you lend to others and money you borrow from others',
    category: 'Premium Features',
    tags: ['lent', 'borrow', 'loans', 'transactions', 'debt', 'premium'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '5 min read'
  },
  {
    slug: 'analytics-dashboard',
    title: 'Understanding Your Financial Analytics Dashboard',
    description: 'Comprehensive guide to all analytics features including main dashboard, purchase analytics, and lent-borrow analytics',
    category: 'Analytics',
    tags: ['analytics', 'dashboard', 'reports', 'insights', 'charts', 'purchases', 'lent-borrow'],
    difficulty: 'intermediate',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '12 min read'
  },
  {
    slug: 'how-to-create-your-first-income-expense-category',
    title: 'How to Create Your First Income/Expense Category',
    description: 'Complete guide to creating, customizing, and managing income and expense categories in Balanze',
    category: 'Getting Started',
    tags: ['categories', 'income', 'expense', 'organization', 'setup', 'beginner'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '8 min read'
  },
  {
    slug: 'how-to-use-last-wish',
    title: 'How to Use Last Wish - Premium Digital Time Capsule',
    description: 'Complete guide to setting up and using the Last Wish feature - your premium digital time capsule for financial legacy planning',
    category: 'Premium Features',
    tags: ['premium', 'last-wish', 'digital-time-capsule', 'legacy', 'financial-planning', 'advanced'],
    difficulty: 'intermediate',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '8 min read'
  }
];

const CATEGORIES = ['All', 'Getting Started', 'Accounts', 'Transactions', 'Analytics', 'Transfers', 'Advanced', 'Mobile', 'Premium Features'];

const UserBubble: React.FC<UserBubbleProps> = ({ userName, userEmail, userPicUrl }) => {
  const [showModal, setShowModal] = useState(false);
  const [readingHistory, setReadingHistory] = useState<ArticleReadingHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [articleStats, setArticleStats] = useState({
    totalReads: 0,
    helpfulCount: 0,
    notHelpfulCount: 0,
    noFeedbackCount: 0,
    helpfulRate: 0,
    totalTimeSpent: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Generate initials from user name
  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const initials = getInitials(userName);

  // Load reading history and article stats when modal opens
  useEffect(() => {
    if (showModal) {
      setLoadingHistory(true);
      setLoadingStats(true);
      
      // Load reading history
      getUserReadingHistory(5).then(history => {
        setReadingHistory(history);
        setLoadingHistory(false);
      }).catch(error => {
        console.error('Error loading reading history:', error);
        setLoadingHistory(false);
      });
      
      // Load article statistics
      getUserArticleStats().then(stats => {
        setArticleStats(stats);
        setLoadingStats(false);
      }).catch(error => {
        console.error('Error loading article stats:', error);
        setLoadingStats(false);
      });
    }
  }, [showModal]);

  const formatReadDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* User Icon Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-9 h-9 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center font-bold"
        title="User Profile"
      >
        {userPicUrl ? (
          <img
            src={userPicUrl}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
            onError={e => { 
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <span className={userPicUrl ? 'hidden' : ''}>{initials}</span>
      </button>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {userPicUrl ? (
                      <img
                        src={userPicUrl}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                        onError={e => { 
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={userPicUrl ? 'hidden' : ''}>{initials}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{userName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Article Statistics */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Your Help Center Activity
                </h4>
                {loadingStats ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading stats...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{articleStats.totalReads}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Articles Read</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{Math.round(articleStats.helpfulRate)}%</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Helpful Rate</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{articleStats.helpfulCount}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Helpful Votes</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{Math.round(articleStats.totalTimeSpent / 60)}m</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Time Spent</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reading History */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Recent Articles
                </h4>
                {loadingHistory ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading history...</div>
                ) : readingHistory.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No articles read yet</div>
                ) : (
                  <div className="space-y-2">
                    {readingHistory.map((article) => (
                      <div key={article.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {article.article_title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <ClockIcon className="w-3 h-3" />
                            {formatReadDate(article.read_at)} • {Math.round(article.time_spent_seconds / 60)}m read
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function KBSearch({ className }: KBSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, profile } = useAuthStore();

  const userName = profile?.fullName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userPicUrl = profile?.profilePicture ? 
    supabase.storage.from('avatars').getPublicUrl(profile.profilePicture).data.publicUrl : null;

  const filteredArticles = useMemo(() => {
    let filtered = MOCK_ARTICLES;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by search query
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm) ||
        article.description.toLowerCase().includes(searchTerm) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  }, [query, selectedCategory]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setShowResults(true);
    trackHelpCenter('search', { query: searchQuery, category: selectedCategory });
  };

  const handleArticleClick = (article: KBArticle) => {
    trackHelpCenter('article_click', { 
      slug: article.slug, 
      title: article.title, 
      category: article.category,
      source: 'search'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary/10 rounded-lg">
              <BookOpen 
                className="w-6 h-6" 
                style={{
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }} 
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gradient-primary">
                Knowledge Base
              </h2>
              <p className="text-sm text-gradient-primary/70">
                Find answers to common questions and learn how to use Balanze
              </p>
            </div>
          </div>
          
          {/* Action Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gradient-primary hover:text-gradient-primary transition-colors duration-200 border border-gradient-primary/30 rounded-full hover:bg-gradient-primary/10"
              title="Go to Home"
            >
              <Home 
                className="w-5 h-5" 
                style={{
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }} 
              />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 text-gradient-primary hover:text-gradient-primary transition-colors duration-200 border border-gradient-primary/30 rounded-full hover:bg-gradient-primary/10"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <Sun 
                  className="w-5 h-5" 
                  style={{
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }} 
                />
              ) : (
                <Moon 
                  className="w-5 h-5" 
                  style={{
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)'
                      : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }} 
                />
              )}
            </button>
            <UserBubble 
              userName={userName}
              userEmail={userEmail}
              userPicUrl={userPicUrl}
            />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gradient-primary w-5 h-5" />
          <input
            type="text"
            placeholder="Search for help articles, features, or guides..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="w-full pl-10 pr-4 py-3 border border-gradient-primary/30 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gradient-primary/50 focus:ring-2 focus:ring-gradient-primary focus:border-gradient-primary"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setShowResults(true);
                trackHelpCenter('category_filter', { category });
              }}
              className={clsx(
                'px-3 py-1 text-sm font-medium rounded-full transition-colors',
                selectedCategory === category
                  ? 'bg-gradient-primary/10 text-gradient-primary border border-gradient-primary/20'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {showResults && (
        <div className="p-6">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gradient-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gradient-primary mb-2">
                No articles found
              </h3>
              <p className="text-gradient-primary/70">
                Try adjusting your search terms or browse different categories.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gradient-primary/70">
                  Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
                  {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                  {query && ` matching "${query}"`}
                </p>
              </div>
              
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <Link
                    key={article.slug}
                    to={`/kb/${article.slug}`}
                    onClick={() => handleArticleClick(article)}
                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gradient-primary hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-gradient-primary transition-colors">
                            {article.title}
                          </h3>
                          <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {article.description}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className={clsx('px-2 py-1 rounded-full', getDifficultyColor(article.difficulty))}>
                            {article.difficulty}
                          </span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.readTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {article.category}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tags */}
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {article.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                        {article.tags.length > 4 && (
                          <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                            +{article.tags.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Quick Links for when no search is active */}
      {!showResults && (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gradient-primary mb-4">
            Popular Articles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MOCK_ARTICLES.slice(0, 4).map((article) => (
              <Link
                key={article.slug}
                to={`/kb/${article.slug}`}
                onClick={() => handleArticleClick(article)}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gradient-primary transition-colors group"
              >
                <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-gradient-primary transition-colors text-sm">
                  {article.title}
                </h4>
                <p className="text-xs text-gradient-primary/70 mt-1">
                  {article.readTime} • {article.category}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

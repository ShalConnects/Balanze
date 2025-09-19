// src/components/KBSearch.tsx
import React, { useState, useMemo } from 'react';
import { Search, BookOpen, ExternalLink, Clock, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackHelpCenter } from '../lib/analytics';
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

// Mock KB articles - in production, this would come from your CMS/API
const MOCK_ARTICLES: KBArticle[] = [
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
    slug: 'create-first-account',
    title: 'How to Create Your First Account',
    description: 'Step-by-step guide to adding bank accounts, credit cards, and cash wallets',
    category: 'Accounts',
    tags: ['accounts', 'setup', 'banking'],
    difficulty: 'beginner',
    lastUpdated: '2024-01-10',
    readTime: '3 min read'
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
    slug: 'analytics-dashboard',
    title: 'Understanding Your Financial Analytics',
    description: 'Make sense of your spending patterns, trends, and financial insights',
    category: 'Analytics',
    tags: ['analytics', 'reports', 'insights', 'charts'],
    difficulty: 'intermediate',
    lastUpdated: '2024-01-14',
    readTime: '8 min read'
  },
  {
    slug: 'transfer-between-accounts',
    title: 'Transferring Money Between Accounts',
    description: 'Move money between your accounts and track internal transfers',
    category: 'Transfers',
    tags: ['transfers', 'accounts', 'money-movement'],
    difficulty: 'beginner',
    lastUpdated: '2024-01-11',
    readTime: '4 min read'
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
  }
];

const CATEGORIES = ['All', 'Getting Started', 'Accounts', 'Transactions', 'Analytics', 'Transfers', 'Advanced', 'Mobile'];

export default function KBSearch({ className }: KBSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showResults, setShowResults] = useState(false);

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
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Knowledge Base
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Find answers to common questions and learn how to use Balanze
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for help articles, features, or guides..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowResults(true)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
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
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No articles found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search terms or browse different categories.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Popular Articles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MOCK_ARTICLES.slice(0, 4).map((article) => (
              <Link
                key={article.slug}
                to={`/kb/${article.slug}`}
                onClick={() => handleArticleClick(article)}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
              >
                <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">
                  {article.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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

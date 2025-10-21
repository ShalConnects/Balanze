import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, TrendingUp, Users, CreditCard, BarChart3, Settings, Star } from 'lucide-react';

interface TopicCluster {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  articles: {
    slug: string;
    title: string;
    description: string;
    readTime: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  }[];
}

const TOPIC_CLUSTERS: TopicCluster[] = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Everything you need to know to begin using Balanze',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'blue',
    articles: [
      {
        slug: 'getting-started-guide',
        title: 'Getting Started with Balanze',
        description: 'Complete guide to setting up your account and adding your first transactions',
        readTime: '5 min read',
        difficulty: 'beginner'
      }
    ]
  },
  {
    id: 'account-management',
    name: 'Account Management',
    description: 'Managing accounts, transfers, and currencies',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'green',
    articles: [
      {
        slug: 'create-first-account',
        title: 'How to Create Your First Account',
        description: 'Step-by-step guide to adding bank accounts, credit cards, and cash wallets',
        readTime: '6 min read',
        difficulty: 'beginner'
      },
      {
        slug: 'how-to-create-your-first-transfer',
        title: 'How to Create Your First Transfer',
        description: 'Complete guide to understanding and creating transfers between accounts',
        readTime: '8 min read',
        difficulty: 'beginner'
      }
    ]
  },
  {
    id: 'transactions',
    name: 'Transactions & Tracking',
    description: 'Adding, managing, and analyzing transactions',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'purple',
    articles: [
      {
        slug: 'create-first-transaction',
        title: 'How to Create Your First Transaction',
        description: 'Learn how to record income and expenses in Balanze',
        readTime: '4 min read',
        difficulty: 'beginner'
      },
      {
        slug: 'how-to-make-your-first-purchase',
        title: 'How to Make Your First Purchase',
        description: 'Step-by-step guide to recording purchases and expenses',
        readTime: '5 min read',
        difficulty: 'beginner'
      },
      {
        slug: 'transaction-management',
        title: 'Transaction Management Guide',
        description: 'How to add, edit, delete, import, and report on transactions',
        readTime: '4 min read',
        difficulty: 'beginner'
      }
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics & Insights',
    description: 'Understanding your financial data and reports',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'orange',
    articles: [
      {
        slug: 'analytics-dashboard',
        title: 'Understanding Your Financial Analytics Dashboard',
        description: 'Complete guide to financial insights and reporting features',
        readTime: '7 min read',
        difficulty: 'intermediate'
      }
    ]
  },
  {
    id: 'features',
    name: 'Advanced Features',
    description: 'Premium features and specialized tools',
    icon: <Star className="w-6 h-6" />,
    color: 'yellow',
    articles: [
      {
        slug: 'quote-feature-comprehensive-guide',
        title: 'Complete Guide to the Quote Feature',
        description: 'Learn how to use the quote feature for financial planning',
        readTime: '6 min read',
        difficulty: 'intermediate'
      },
      {
        slug: 'how-to-create-lent-borrow-records',
        title: 'How to Create Lent & Borrow Records',
        description: 'Track money you lend to others or borrow from friends',
        readTime: '5 min read',
        difficulty: 'beginner'
      },
      {
        slug: 'how-to-create-your-first-income-expense-category',
        title: 'How to Create Your First Income/Expense Category',
        description: 'Set up custom categories for better financial organization',
        readTime: '4 min read',
        difficulty: 'beginner'
      },
      {
        slug: 'how-to-use-last-wish',
        title: 'How to Use Last Wish - Premium Digital Time Capsule',
        description: 'Learn how to use the Last Wish premium feature',
        readTime: '7 min read',
        difficulty: 'intermediate'
      }
    ]
  },
  {
    id: 'pages',
    name: 'Page Guides',
    description: 'Complete guides to specific pages and features',
    icon: <Settings className="w-6 h-6" />,
    color: 'indigo',
    articles: [
      {
        slug: 'settings-page-comprehensive-guide',
        title: 'Complete Settings Page Guide',
        description: 'Comprehensive guide to all Settings page tabs and features',
        readTime: '12 min read',
        difficulty: 'beginner'
      },
      {
        slug: 'donation-page-complete-guide',
        title: 'Donation Page - Complete Guide',
        description: 'Everything you need to know about the donation page',
        readTime: '5 min read',
        difficulty: 'beginner'
      },
      {
        slug: 'history-page-complete-guide',
        title: 'Activity History - Complete Guide',
        description: 'Understanding and using the activity history feature',
        readTime: '4 min read',
        difficulty: 'beginner'
      },
      {
        slug: 'notes-todo-comprehensive-guide',
        title: 'Notes & To-Do Feature: Complete Guide',
        description: 'How to use the notes and to-do features effectively',
        readTime: '6 min read',
        difficulty: 'beginner'
      }
    ]
  }
];

const TopicClusterHub: React.FC = () => {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
      green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
      purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
      orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'intermediate': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'advanced': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Balanze Help Center
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Everything you need to know about managing your finances with Balanze. 
            Browse by topic to find the perfect guide for your needs.
          </p>
        </div>

        {/* Topic Clusters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {TOPIC_CLUSTERS.map((cluster) => (
            <div
              key={cluster.id}
              className={`rounded-xl border-2 p-6 ${getColorClasses(cluster.color)}`}
            >
              <div className="flex items-center gap-3 mb-4">
                {cluster.icon}
                <h2 className="text-xl font-semibold">{cluster.name}</h2>
              </div>
              
              <p className="text-sm mb-6 opacity-80">
                {cluster.description}
              </p>

              <div className="space-y-3">
                {cluster.articles.map((article) => (
                  <Link
                    key={article.slug}
                    to={`/help-center/${article.slug}`}
                    className="block p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">
                          {article.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {article.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ml-2 flex-shrink-0" />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {article.readTime}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(article.difficulty)}`}>
                        {article.difficulty}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Help Center Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">14</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Articles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">6</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Topic Clusters</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">10+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Beginner Guides</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">100%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Free Access</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicClusterHub;

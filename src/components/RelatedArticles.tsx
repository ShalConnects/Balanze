import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Tag } from 'lucide-react';
import { getRelatedArticlesByCluster, TOPIC_CLUSTERS } from '../data/articles';

interface RelatedArticlesProps {
  currentSlug: string;
  limit?: number;
  showTopicCluster?: boolean;
}

interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Complete articles data - all 14 articles
const MOCK_ARTICLES: Record<string, Article> = {
  'getting-started-guide': {
    slug: 'getting-started-guide',
    title: 'Getting Started with Balanze',
    description: 'Complete guide to setting up your account and adding your first transactions',
    category: 'Getting Started',
    readTime: '5 min read',
    difficulty: 'beginner'
  },
  'create-first-account': {
    slug: 'create-first-account',
    title: 'How to Create Your First Account',
    description: 'Step-by-step guide to adding bank accounts, credit cards, and cash wallets',
    category: 'Accounts',
    readTime: '6 min read',
    difficulty: 'beginner'
  },
  'create-first-transaction': {
    slug: 'create-first-transaction',
    title: 'How to Add Your First Transaction',
    description: 'Learn how to record income and expenses in Balanze',
    category: 'Transactions',
    readTime: '4 min read',
    difficulty: 'beginner'
  },
  'settings-page-comprehensive-guide': {
    slug: 'settings-page-comprehensive-guide',
    title: 'Complete Settings Page Guide',
    description: 'Comprehensive guide to all Settings page tabs and features in Balanze',
    category: 'Settings & Configuration',
    readTime: '12 min read',
    difficulty: 'beginner'
  },
  'how-to-create-your-first-transfer': {
    slug: 'how-to-create-your-first-transfer',
    title: 'How to Create Your First Transfer',
    description: 'Complete guide to understanding and creating transfers between accounts',
    category: 'Transfers',
    readTime: '8 min read',
    difficulty: 'beginner'
  },
  'how-to-make-your-first-purchase': {
    slug: 'how-to-make-your-first-purchase',
    title: 'How to Make Your First Purchase',
    description: 'Step-by-step guide to recording purchases and expenses',
    category: 'Transactions',
    readTime: '5 min read',
    difficulty: 'beginner'
  },
  'quote-feature-comprehensive-guide': {
    slug: 'quote-feature-comprehensive-guide',
    title: 'Complete Guide to the Quote Feature',
    description: 'Learn how to use the quote feature for financial planning',
    category: 'Features',
    readTime: '6 min read',
    difficulty: 'intermediate'
  },
  'how-to-create-lent-borrow-records': {
    slug: 'how-to-create-lent-borrow-records',
    title: 'How to Create Lent & Borrow Records',
    description: 'Track money you lend to others or borrow from friends',
    category: 'Features',
    readTime: '5 min read',
    difficulty: 'beginner'
  },
  'analytics-dashboard': {
    slug: 'analytics-dashboard',
    title: 'Understanding Your Financial Analytics Dashboard',
    description: 'Complete guide to financial insights and reporting features',
    category: 'Analytics',
    readTime: '7 min read',
    difficulty: 'intermediate'
  },
  'how-to-create-your-first-income-expense-category': {
    slug: 'how-to-create-your-first-income-expense-category',
    title: 'How to Create Your First Income/Expense Category',
    description: 'Set up custom categories for better financial organization',
    category: 'Configuration',
    readTime: '4 min read',
    difficulty: 'beginner'
  },
  'how-to-use-last-wish': {
    slug: 'how-to-use-last-wish',
    title: 'How to Use Last Wish - Premium Digital Time Capsule',
    description: 'Learn how to use the Last Wish premium feature',
    category: 'Premium Features',
    readTime: '7 min read',
    difficulty: 'intermediate'
  },
  'donation-page-complete-guide': {
    slug: 'donation-page-complete-guide',
    title: 'Donation Page - Complete Guide',
    description: 'Everything you need to know about the donation page',
    category: 'Pages',
    readTime: '5 min read',
    difficulty: 'beginner'
  },
  'history-page-complete-guide': {
    slug: 'history-page-complete-guide',
    title: 'Activity History - Complete Guide',
    description: 'Understanding and using the activity history feature',
    category: 'Pages',
    readTime: '4 min read',
    difficulty: 'beginner'
  },
  'notes-todo-comprehensive-guide': {
    slug: 'notes-todo-comprehensive-guide',
    title: 'Notes & To-Do Feature: Complete Guide',
    description: 'How to use the notes and to-do features effectively',
    category: 'Features',
    readTime: '6 min read',
    difficulty: 'beginner'
  },
  'transaction-management': {
    slug: 'transaction-management',
    title: 'Transaction Management Guide',
    description: 'How to add, edit, delete, import, and report on transactions',
    category: 'Transactions',
    readTime: '4 min read',
    difficulty: 'beginner'
  }
};

const RelatedArticles: React.FC<RelatedArticlesProps> = ({ 
  currentSlug, 
  limit = 3, 
  showTopicCluster = true 
}) => {
  const relatedSlugs = getRelatedArticlesByCluster(currentSlug, limit);
  const relatedArticles = relatedSlugs
    .map(slug => MOCK_ARTICLES[slug])
    .filter(Boolean);

  if (relatedArticles.length === 0) {
    return null;
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'intermediate': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'advanced': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Related Articles
        </h3>
      </div>
      
      {showTopicCluster && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Continue learning with these related guides
        </p>
      )}

      <div className="grid gap-4">
        {relatedArticles.map((article) => (
          <Link
            key={article.slug}
            to={`/kb/${article.slug}`}
            className="group block p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {article.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {article.description}
                </p>
                
                <div className="flex items-center gap-3 mt-3">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                  
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Tag className="w-3 h-3" />
                    {article.category}
                  </span>
                  
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
                    {article.difficulty}
                  </span>
                </div>
              </div>
              
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ml-2 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <Link
          to="/help"
          className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Browse all help articles
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

export default RelatedArticles;

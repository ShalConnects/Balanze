// src/pages/AdminPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Edit3 } from 'lucide-react';
import ArticleEditor from '../components/admin/ArticleEditor';
import { KBArticle, TableOfContentsItem } from '../data/articles';

// Import the current article data
const MOCK_ARTICLES: Record<string, KBArticle> = {
  'getting-started-guide': {
    slug: 'getting-started-guide',
    title: 'Getting Started with Balanze',
    description: 'Complete guide to setting up your account and adding your first transactions',
    category: 'Getting Started',
    tags: ['setup', 'beginner', 'accounts', 'transactions'],
    difficulty: 'beginner',
    lastUpdated: '2024-01-15',
    readTime: '5 min read',
    author: 'Balanze Team',
    tableOfContents: [
      {
        id: 'what-is-balanze',
        title: 'What is Balanze?',
        level: 1
      },
      {
        id: 'quick-start',
        title: 'Plans & Pricing',
        level: 1,
        children: [
          {
            id: 'create-first-account',
            title: '- Create Your First Account',
            level: 2,
            children: [
              {
                id: 'account-types',
                title: '- - Account Types',
                level: 3
              }
            ]
          },
          {
            id: 'add-first-transaction',
            title: 'Add Your First Transaction',
            level: 2
          },
          {
            id: 'explore-dashboard',
            title: 'Explore Your Dashboard',
            level: 2
          }
        ]
      },
      {
        id: 'pro-tips',
        title: 'Pro Tips',
        level: 1
      },
      {
        id: 'need-help',
        title: 'Need Help?',
        level: 1
      },
      {
        id: 'whats-next',
        title: "What's Next?",
        level: 1
      }
    ],
    content: `
<div id="what-is-balanze" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">What is Balanze?</h2>
  
  <div class="mb-8">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Congratulations on taking the first step towards better financial management. This guide will walk you through everything you need to know to get started with Balanze.
    </p>
    
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Balanze is a comprehensive personal finance management platform that helps you:
    </p>
    
    <ul class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Track income and expenses</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Manage multiple accounts and currencies</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Analyze spending patterns</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Set and track financial goals</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Export data for tax preparation</span>
      </li>
    </ul>
  </div>

  <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 my-8 rounded-r-lg">
    <p class="text-gray-700 dark:text-gray-300 font-medium text-lg leading-relaxed">
      <strong class="text-blue-600 dark:text-blue-400">Balanze is completely FREE to use!</strong> Start tracking your finances immediately with our full-featured free plan. 
      Want even more advanced features? Try our premium features with a <span class="text-blue-600 dark:text-blue-400 font-bold">14-day free trial</span> - no credit card required!
    </p>
  </div>

  <div class="my-8">
    <img src="/article_1.png" alt="Balanze Dashboard Overview" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg" />
  </div>
</div>

<div id="quick-start" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Quick Start (3 Steps)</h2>
  
  <div class="space-y-12">
    <div id="create-first-account" class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
      <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Step 1: Create Your First Account</h3>
      
      <div class="space-y-4 text-gray-700 dark:text-gray-300">
        <div class="flex items-start">
          <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-1">1</span>
          <span>Click on <strong>"Accounts"</strong> in the sidebar</span>
        </div>
        <div class="flex items-start">
          <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-1">2</span>
          <span>Click the <strong>"Add Account"</strong> button</span>
        </div>
        <div class="flex items-start">
          <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-1">3</span>
          <span>Choose your account type (Bank Account, Credit Card, Cash, etc.)</span>
        </div>
        <div class="flex items-start">
          <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-1">4</span>
          <div>
            <span>Fill in the details:</span>
            <ul class="mt-2 ml-4 space-y-2">
              <li class="flex items-start">
                <span class="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Account name (e.g., "Chase Checking")</span>
              </li>
              <li class="flex items-start">
                <span class="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Currency</span>
              </li>
              <li class="flex items-start">
                <span class="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Initial balance</span>
              </li>
              <li class="flex items-start">
                <span class="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Account color/icon (optional)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div id="account-types" class="mt-8 p-6 bg-white dark:bg-gray-700 rounded-lg">
        <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Types</h4>
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
          Balanze supports several account types including Bank Accounts, Credit Cards, Cash, Investment accounts, and more.
        </p>
      </div>

      <div class="mt-6">
        <img src="/dashboard-screenshot-light.png" alt="Add Account Form" class="w-full max-w-2xl mx-auto rounded-lg shadow-md" />
      </div>
    </div>

    <div id="add-first-transaction" class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
      <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Step 2: Add Your First Transaction</h3>
      
      <div class="space-y-4 text-gray-700 dark:text-gray-300">
        <div class="flex items-start">
          <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-1">1</span>
          <span>Go to <strong>"Transactions"</strong> in the sidebar</span>
        </div>
        <div class="flex items-start">
          <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-1">2</span>
          <span>Click <strong>"Add Transaction"</strong></span>
        </div>
        <div class="flex items-start">
          <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-1">3</span>
          <div>
            <span>Fill in the transaction details:</span>
            <ul class="mt-2 ml-4 space-y-2">
              <li class="flex items-start">
                <span class="text-green-600 dark:text-green-400 mr-2">•</span>
                <span>Type: Income or Expense</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-600 dark:text-green-400 mr-2">•</span>
                <span>Amount</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-600 dark:text-green-400 mr-2">•</span>
                <span>Account</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-600 dark:text-green-400 mr-2">•</span>
                <span>Category</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-600 dark:text-green-400 mr-2">•</span>
                <span>Description (optional)</span>
              </li>
              <li class="flex items-start">
                <span class="text-green-600 dark:text-green-400 mr-2">•</span>
                <span>Date</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div id="explore-dashboard" class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
      <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Step 3: Explore Your Dashboard</h3>
      
      <p class="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
        Return to the dashboard to see:
      </p>
      
      <ul class="space-y-3 text-gray-700 dark:text-gray-300">
        <li class="flex items-start">
          <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
          <span>Account balances overview</span>
        </li>
        <li class="flex items-start">
          <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
          <span>Recent transactions</span>
        </li>
        <li class="flex items-start">
          <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
          <span>Spending by category</span>
        </li>
        <li class="flex items-start">
          <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
          <span>Monthly trends</span>
        </li>
      </ul>
    </div>
  </div>
</div>

<div id="pro-tips" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Pro Tips</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">Use Categories</h4>
      <p class="text-gray-700 dark:text-gray-300">Categorizing transactions helps you understand spending patterns</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">Regular Updates</h4>
      <p class="text-gray-700 dark:text-gray-300">Add transactions regularly for accurate insights</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3">Multiple Currencies</h4>
      <p class="text-gray-700 dark:text-gray-300">Balanze supports multiple currencies with automatic conversion</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-orange-900 dark:text-orange-300 mb-3">Mobile Friendly</h4>
      <p class="text-gray-700 dark:text-gray-300">Access Balanze from any device with our responsive design</p>
    </div>
  </div>
</div>

<div id="need-help" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Need Help?</h2>
  
  <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-lg">
    <p class="text-gray-700 dark:text-gray-300 mb-4 font-medium">If you get stuck:</p>
    <ul class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-yellow-600 dark:text-yellow-400 mr-3 mt-1">•</span>
        <span>Use the search function in the help center</span>
      </li>
      <li class="flex items-start">
        <span class="text-yellow-600 dark:text-yellow-400 mr-3 mt-1">•</span>
        <span>Check out our video tutorials</span>
      </li>
      <li class="flex items-start">
        <span class="text-yellow-600 dark:text-yellow-400 mr-3 mt-1">•</span>
        <span>Contact support at <a href="mailto:support@balanze.com" class="text-blue-600 dark:text-blue-400 hover:underline">support@balanze.com</a></span>
      </li>
    </ul>
  </div>
</div>

<div id="whats-next" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">What's Next?</h2>
  
  <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 rounded-xl">
    <p class="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Once you've completed the basics:
    </p>
    
    <div class="space-y-4">
      <div class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">1</span>
        <span class="text-gray-700 dark:text-gray-300">Explore the Analytics section for detailed insights</span>
      </div>
      <div class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">2</span>
        <span class="text-gray-700 dark:text-gray-300">Set up transfers between accounts</span>
      </div>
      <div class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">3</span>
        <span class="text-gray-700 dark:text-gray-300">Try the mobile experience</span>
      </div>
      <div class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1">4</span>
        <span class="text-gray-700 dark:text-gray-300">Export your data for external use</span>
      </div>
    </div>
    
    <div class="mt-8 text-center">
      <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">Happy budgeting! 🎉</p>
    </div>
  </div>
</div>`,
    relatedArticles: ['create-first-account', 'transaction-management', 'analytics-dashboard']
  }
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [currentArticle, setCurrentArticle] = useState<KBArticle>(MOCK_ARTICLES['getting-started-guide']);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = (updatedArticle: KBArticle) => {
    setCurrentArticle(updatedArticle);
    // In a real app, you'd save this to your backend/database
    console.log('Article saved:', updatedArticle);
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setShowPreview(false)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Editor
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Article
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {currentArticle.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {currentArticle.description}
              </p>
            </div>

            <div 
              className="prose prose-lg max-w-none dark:prose-invert prose-blue prose-headings:font-bold prose-p:leading-relaxed prose-li:leading-relaxed prose-ul:my-6 prose-ol:my-6"
              dangerouslySetInnerHTML={{ __html: currentArticle.content }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </button>
          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Article Editor
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Edit your knowledge base articles with ease
          </p>
        </div>

        <ArticleEditor article={currentArticle} onSave={handleSave} />
      </div>
    </div>
  );
}

// src/pages/KBArticlePage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Tag, 
  ThumbsUp, 
  ThumbsDown, 
  BookOpen,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { trackHelpCenter } from '../lib/analytics';
import { toast } from 'sonner';
import clsx from 'clsx';

interface KBArticle {
  slug: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;
  readTime: string;
  author?: string;
  relatedArticles?: string[];
}

// Mock article data - in production, this would come from your CMS/API
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
    content: `# Welcome to Balanze!

Congratulations on taking the first step towards better financial management. This guide will walk you through everything you need to know to get started with Balanze.

## What is Balanze?

Balanze is a comprehensive personal finance management platform that helps you:
- Track income and expenses
- Manage multiple accounts and currencies
- Analyze spending patterns
- Set and track financial goals
- Export data for tax preparation

## Quick Start (3 Steps)

### Step 1: Create Your First Account

1. Click on **"Accounts"** in the sidebar
2. Click the **"Add Account"** button
3. Choose your account type (Bank Account, Credit Card, Cash, etc.)
4. Fill in the details:
   - Account name (e.g., "Chase Checking")
   - Currency
   - Initial balance
   - Account color/icon (optional)

### Step 2: Add Your First Transaction

1. Go to **"Transactions"** in the sidebar
2. Click **"Add Transaction"**
3. Fill in the transaction details:
   - Type: Income or Expense
   - Amount
   - Account
   - Category
   - Description (optional)
   - Date

### Step 3: Explore Your Dashboard

Return to the dashboard to see:
- Account balances overview
- Recent transactions
- Spending by category
- Monthly trends

## Pro Tips

- **Use Categories**: Categorizing transactions helps you understand spending patterns
- **Regular Updates**: Add transactions regularly for accurate insights
- **Multiple Currencies**: Balanze supports multiple currencies with automatic conversion
- **Mobile Friendly**: Access Balanze from any device with our responsive design

## Need Help?

If you get stuck:
- Use the search function in the help center
- Check out our video tutorials
- Contact support at support@balanze.com

## What's Next?

Once you've completed the basics:
1. Explore the Analytics section for detailed insights
2. Set up transfers between accounts
3. Try the mobile experience
4. Export your data for external use

Happy budgeting! 🎉`,
    relatedArticles: ['create-first-account', 'transaction-management', 'analytics-dashboard']
  },
  'create-first-account': {
    slug: 'create-first-account',
    title: 'How to Create Your First Account',
    description: 'Step-by-step guide to adding bank accounts, credit cards, and cash wallets',
    category: 'Accounts',
    tags: ['accounts', 'setup', 'banking'],
    difficulty: 'beginner',
    lastUpdated: '2024-01-10',
    readTime: '3 min read',
    author: 'Balanze Team',
    content: `# Creating Your First Account

Setting up your first account in Balanze is quick and easy. This guide will walk you through the process step by step.

## Account Types

Balanze supports several account types:

- **Bank Account**: Checking, savings, or other bank accounts
- **Credit Card**: Track credit card balances and payments
- **Cash**: Physical cash you carry
- **Investment**: Investment accounts and portfolios
- **Loan**: Track loans and debts
- **Other**: Custom account types

## Step-by-Step Guide

### 1. Navigate to Accounts

Click on **"Accounts"** in the sidebar navigation.

### 2. Click "Add Account"

Look for the **"Add Account"** or **"+"** button, usually prominently displayed.

### 3. Fill in Account Details

**Account Name**: Give your account a descriptive name
- Good: "Chase Checking", "Visa Credit Card"
- Avoid: "Account 1", "Bank"

**Account Type**: Select the appropriate type from the dropdown

**Currency**: Choose your account's currency
- USD, EUR, GBP, BDT, and many others supported
- Each account can have its own currency

**Initial Balance**: Enter your current account balance
- For checking/savings: Current balance
- For credit cards: Current balance (use negative for debt)
- For cash: Amount you currently have

**Color & Icon** (Optional): Personalize your account
- Choose a color and icon to easily identify your account
- Helpful when you have multiple accounts

### 4. Save Your Account

Click **"Save Account"** to create your account.

## Account Management Tips

- **Accurate Balances**: Enter accurate initial balances for better tracking
- **Descriptive Names**: Use clear, descriptive names for easy identification
- **Regular Updates**: Update balances through transactions, not manual edits
- **Multiple Accounts**: Add all your real-world accounts for complete tracking

## Common Account Types Setup

### Bank Checking Account
- Type: Bank Account
- Name: "[Bank Name] Checking"
- Currency: Your local currency
- Balance: Current checking balance

### Credit Card
- Type: Credit Card
- Name: "[Card Name] Credit Card"
- Currency: Card currency
- Balance: Current balance (negative if you owe money)

### Cash Wallet
- Type: Cash
- Name: "Cash Wallet" or "Pocket Money"
- Currency: Your local currency
- Balance: Cash you currently have

## What's Next?

After creating your account:
1. Add your first transaction
2. Set up additional accounts
3. Start tracking your financial activity

Need help? Check out our guide on [Managing Income and Expenses](/kb/transaction-management).`,
    relatedArticles: ['getting-started-guide', 'transaction-management', 'multi-currency-setup']
  }
};

export default function KBArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<KBArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      // Simulate API call
      setTimeout(() => {
        const foundArticle = MOCK_ARTICLES[slug];
        setArticle(foundArticle || null);
        setLoading(false);
        
        if (foundArticle) {
          trackHelpCenter('article_view', { 
            slug, 
            title: foundArticle.title,
            category: foundArticle.category
          });
        }
      }, 300);
    }
  }, [slug]);

  const handleFeedback = (isHelpful: boolean) => {
    setFeedback(isHelpful ? 'helpful' : 'not-helpful');
    trackHelpCenter('article_feedback', { 
      slug: slug!, 
      helpful: isHelpful,
      title: article?.title
    });
    
    toast.success(
      isHelpful 
        ? 'Thanks for your feedback! 👍' 
        : 'Thanks for your feedback. We\'ll work on improving this article.'
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Article Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The article you're looking for doesn't exist or may have been moved.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Go Back
              </button>
              <Link
                to="/help"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Help Center
        </button>

        {/* Article Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className={clsx('px-3 py-1 text-sm font-medium rounded-full', getDifficultyColor(article.difficulty))}>
              {article.difficulty}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{article.category}</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {article.title}
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {article.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.readTime}
              </div>
              <div className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Last updated {new Date(article.lastUpdated).toLocaleDateString()}
              </div>
              {article.author && (
                <span>By {article.author}</span>
              )}
            </div>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Article Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6">
          <div className="prose prose-lg max-w-none dark:prose-invert prose-blue">
            <div 
              className="whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
            />
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Was this article helpful?
          </h3>
          
          {feedback ? (
            <div className="text-center py-4">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Thank you for your feedback!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We use your feedback to improve our documentation.
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => handleFeedback(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                Yes, helpful
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
                Needs improvement
              </button>
            </div>
          )}
        </div>

        {/* Related Articles */}
        {article.relatedArticles && article.relatedArticles.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Related Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {article.relatedArticles.map((relatedSlug) => {
                const relatedArticle = MOCK_ARTICLES[relatedSlug];
                if (!relatedArticle) return null;
                
                return (
                  <Link
                    key={relatedSlug}
                    to={`/kb/${relatedSlug}`}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {relatedArticle.title}
                      </h4>
                      <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {relatedArticle.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{relatedArticle.readTime}</span>
                      <span>•</span>
                      <span>{relatedArticle.category}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

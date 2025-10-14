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
  },
  'notes-todo-comprehensive-guide': {
    slug: 'notes-todo-comprehensive-guide',
    title: 'Notes & To-Do Feature: Complete Guide',
    description: 'Master the Notes and To-Do features in Balanze - organize your thoughts, track tasks, and boost productivity',
    category: 'Productivity Features',
    tags: ['notes', 'todo', 'tasks', 'productivity', 'organization', 'planning'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '5 min read',
    author: 'Balanze Team',
    relatedArticles: ['getting-started-guide', 'settings-page-comprehensive-guide', 'premium-features'],
    tableOfContents: [
      { id: 'overview', title: 'Notes & To-Do Overview', level: 1 },
      { id: 'getting-started', title: 'Getting Started', level: 1 },
      { id: 'notes-feature', title: 'Notes Feature', level: 1 },
      { id: 'todo-feature', title: 'To-Do Feature', level: 1 },
      { id: 'advanced-features', title: 'Advanced Features', level: 1 },
      { id: 'best-practices', title: 'Best Practices', level: 1 },
      { id: 'troubleshooting', title: 'Troubleshooting', level: 1 },
      { id: 'pro-tips', title: 'Pro Tips', level: 1 }
    ],
    content: `<div id="notes-todo-overview" class="mb-12">
  <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-8">Notes & To-Do Feature: Complete Guide</h1>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    The Notes & To-Do feature in Balanze is your personal productivity companion, designed to help you capture thoughts, organize tasks, and stay on top of your financial and personal goals. This comprehensive guide will help you master both features and integrate them seamlessly into your daily workflow.
  </p>

<div id="overview">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Notes & To-Do Overview</h2>
</div>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    The Notes & To-Do feature combines two powerful productivity tools in one convenient interface:
  </p>
  
  <div class="grid md:grid-cols-2 gap-6 mb-8">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 class="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">📝 Notes</h3>
      <ul class="space-y-2 text-blue-800 dark:text-blue-200">
        <li>• Capture quick thoughts and ideas</li>
        <li>• Store important information</li>
        <li>• Create personal reminders</li>
        <li>• Organize by categories</li>
      </ul>
    </div>
    
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
      <h3 class="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">✅ To-Do</h3>
      <ul class="space-y-2 text-green-800 dark:text-green-200">
        <li>• Track tasks and goals</li>
        <li>• Set priorities and deadlines</li>
        <li>• Mark completed items</li>
        <li>• Stay organized and focused</li>
      </ul>
    </div>
  </div>

<div id="getting-started">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Getting Started</h2>
</div>

  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    Accessing the Notes & To-Do feature is simple and intuitive:
  </p>

  <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">How to Access</h3>
    <ol class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
        <span>Navigate to the main dashboard or sidebar</span>
      </li>
      <li class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
        <span>Look for the "Notes & To-Do" section or icon</span>
      </li>
      <li class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
        <span>Click to open the feature panel</span>
      </li>
    </ol>
  </div>

  <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
    <div class="flex items-start">
      <span class="text-yellow-600 dark:text-yellow-400 mr-3 mt-1">💡</span>
      <div>
        <h4 class="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Quick Tip</h4>
        <p class="text-yellow-700 dark:text-yellow-300">The Notes & To-Do feature is available on both desktop and mobile versions of Balanze, ensuring you can stay productive wherever you are.</p>
      </div>
    </div>
  </div>

<div id="notes-feature">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Notes Feature</h2>
</div>

  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    The Notes feature allows you to capture and organize your thoughts, ideas, and important information quickly and efficiently.
  </p>

  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Creating Notes</h3>
  <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6">
    <ol class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
        <span>Click on the "Notes" tab in the feature panel</span>
      </li>
      <li class="flex items-start">
        <span class="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
        <span>Click the "Add Note" button or the plus (+) icon</span>
      </li>
      <li class="flex items-start">
        <span class="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
        <span>Type your note content in the text field</span>
      </li>
      <li class="flex items-start">
        <span class="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">4</span>
        <span>Press Enter or click "Save" to create the note</span>
      </li>
    </ol>
  </div>

  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Managing Notes</h3>
  <div class="grid md:grid-cols-2 gap-6 mb-6">
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-2">✏️ Editing Notes</h4>
      <p class="text-gray-700 dark:text-gray-300 text-sm">Click on any note to edit its content. Changes are automatically saved as you type.</p>
    </div>
    
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🗑️ Deleting Notes</h4>
      <p class="text-gray-700 dark:text-gray-300 text-sm">Click the delete icon (trash can) next to any note to remove it permanently.</p>
    </div>
  </div>

  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Note Categories</h3>
  <p class="text-gray-700 dark:text-gray-300 mb-4">Organize your notes with categories for better management:</p>
  <ul class="space-y-2 text-gray-700 dark:text-gray-300 mb-6">
    <li class="flex items-start">
      <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
      <span><strong>Financial</strong>: Budget notes, expense tracking, financial goals</span>
    </li>
    <li class="flex items-start">
      <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
      <span><strong>Personal</strong>: Daily thoughts, ideas, personal reminders</span>
    </li>
    <li class="flex items-start">
      <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
      <span><strong>Work</strong>: Meeting notes, project ideas, work-related tasks</span>
    </li>
    <li class="flex items-start">
      <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
      <span><strong>Goals</strong>: Long-term objectives, milestone tracking</span>
    </li>
  </ul>

<div id="todo-feature">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">To-Do Feature</h2>
</div>

  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    The To-Do feature helps you stay organized and track your tasks, goals, and important deadlines.
  </p>

  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Creating Tasks</h3>
  <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-6">
    <ol class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
        <span>Click on the "To-Do" tab in the feature panel</span>
      </li>
      <li class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
        <span>Type your task in the "Add a task..." input field</span>
      </li>
      <li class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
        <span>Click the plus (+) button or press Enter to add the task</span>
      </li>
    </ol>
  </div>

  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Task Management</h3>
  <div class="grid md:grid-cols-3 gap-4 mb-6">
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-2">✅ Complete Tasks</h4>
      <p class="text-gray-700 dark:text-gray-300 text-sm">Click the checkbox next to any task to mark it as completed. Completed tasks will be crossed out and moved to the bottom.</p>
    </div>
    
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-2">✏️ Edit Tasks</h4>
      <p class="text-gray-700 dark:text-gray-300 text-sm">Click on any task text to edit its content. Changes are saved automatically.</p>
    </div>
    
    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-2">🗑️ Delete Tasks</h4>
      <p class="text-gray-700 dark:text-gray-300 text-sm">Click the delete icon next to any task to remove it from your list.</p>
    </div>
  </div>

  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Task Organization</h3>
  <p class="text-gray-700 dark:text-gray-300 mb-4">Keep your tasks organized with these strategies:</p>
  <ul class="space-y-2 text-gray-700 dark:text-gray-300 mb-6">
    <li class="flex items-start">
      <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
      <span><strong>Priority Order</strong>: List tasks in order of importance</span>
    </li>
    <li class="flex items-start">
      <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
      <span><strong>Daily Tasks</strong>: Focus on what needs to be done today</span>
    </li>
    <li class="flex items-start">
      <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
      <span><strong>Weekly Goals</strong>: Break down larger projects into smaller tasks</span>
    </li>
    <li class="flex items-start">
      <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
      <span><strong>Financial Tasks</strong>: Track bill payments, budget reviews, and financial planning</span>
    </li>
  </ul>

<div id="advanced-features">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Advanced Features</h2>
</div>

  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Search and Filter</h3>
  <p class="text-gray-700 dark:text-gray-300 mb-4">Quickly find what you're looking for:</p>
  <ul class="space-y-2 text-gray-700 dark:text-gray-300 mb-6">
    <li class="flex items-start">
      <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
      <span><strong>Search</strong>: Use the search bar to find specific notes or tasks</span>
    </li>
    <li class="flex items-start">
      <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
      <span><strong>Filter by Status</strong>: Show only completed or pending tasks</span>
    </li>
    <li class="flex items-start">
      <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
      <span><strong>Sort Options</strong>: Organize by date, priority, or alphabetical order</span>
    </li>
  </ul>

  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Data Synchronization</h3>
  <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
    <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-3">🔄 Automatic Sync</h4>
    <p class="text-blue-800 dark:text-blue-200 mb-3">Your notes and tasks are automatically synchronized across all your devices:</p>
    <ul class="space-y-2 text-blue-800 dark:text-blue-200">
      <li>• Changes made on your phone appear instantly on your computer</li>
      <li>• No manual sync required - everything happens automatically</li>
      <li>• Your data is safely backed up in the cloud</li>
    </ul>
  </div>

<div id="best-practices">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Best Practices</h2>
</div>

  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Notes Best Practices</h3>
  <div class="grid md:grid-cols-2 gap-6 mb-6">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-3">📝 Writing Effective Notes</h4>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
        <li>• Keep notes concise and to the point</li>
        <li>• Use bullet points for better readability</li>
        <li>• Include dates and context when relevant</li>
        <li>• Review and update notes regularly</li>
      </ul>
    </div>
    
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-3">🗂️ Organization Tips</h4>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
        <li>• Use consistent naming conventions</li>
        <li>• Group related notes together</li>
        <li>• Archive old notes periodically</li>
        <li>• Use tags or categories for easy filtering</li>
      </ul>
    </div>
  </div>

  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">To-Do Best Practices</h3>
  <div class="grid md:grid-cols-2 gap-6 mb-6">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-3">✅ Task Management</h4>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
        <li>• Break large tasks into smaller, actionable items</li>
        <li>• Set realistic deadlines for yourself</li>
        <li>• Review your task list daily</li>
        <li>• Celebrate completed tasks</li>
      </ul>
    </div>
    
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-3">🎯 Productivity Tips</h4>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
        <li>• Focus on 3-5 most important tasks per day</li>
        <li>• Use the 2-minute rule for quick tasks</li>
        <li>• Batch similar tasks together</li>
        <li>• Regular cleanup of completed items</li>
      </ul>
    </div>
  </div>

<div id="troubleshooting">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Troubleshooting</h2>
</div>

  <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Common Issues</h3>
  
  <div class="space-y-4 mb-6">
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <h4 class="font-semibold text-red-800 dark:text-red-200 mb-2">❌ Notes not saving</h4>
      <p class="text-red-700 dark:text-red-300 mb-2">If your notes aren't saving automatically:</p>
      <ul class="space-y-1 text-red-700 dark:text-red-300 text-sm">
        <li>• Check your internet connection</li>
        <li>• Refresh the page and try again</li>
        <li>• Clear your browser cache</li>
        <li>• Contact support if the issue persists</li>
      </ul>
    </div>
    
    <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <h4 class="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Tasks not syncing</h4>
      <p class="text-yellow-700 dark:text-yellow-300 mb-2">If tasks aren't syncing across devices:</p>
      <ul class="space-y-1 text-yellow-700 dark:text-yellow-300 text-sm">
        <li>• Ensure you're logged into the same account</li>
        <li>• Check your internet connection</li>
        <li>• Wait a few minutes for sync to complete</li>
        <li>• Log out and log back in</li>
      </ul>
    </div>
    
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h4 class="font-semibold text-blue-800 dark:text-blue-200 mb-2">ℹ️ Performance issues</h4>
      <p class="text-blue-700 dark:text-blue-300 mb-2">If the feature is running slowly:</p>
      <ul class="space-y-1 text-blue-700 dark:text-blue-300 text-sm">
        <li>• Clear old completed tasks regularly</li>
        <li>• Archive old notes to improve performance</li>
        <li>• Close other browser tabs</li>
        <li>• Update your browser to the latest version</li>
      </ul>
    </div>
  </div>

<div id="pro-tips">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Pro Tips</h2>
</div>

  <div class="grid md:grid-cols-2 gap-6 mb-8">
    <div class="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
      <h3 class="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">🚀 Productivity Hacks</h3>
      <ul class="space-y-2 text-purple-800 dark:text-purple-200 text-sm">
        <li>• Use notes for brainstorming and tasks for action items</li>
        <li>• Create a daily "Top 3" task list</li>
        <li>• Use notes to capture ideas before they slip away</li>
        <li>• Review notes weekly to extract actionable tasks</li>
      </ul>
    </div>
    
    <div class="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
      <h3 class="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">💡 Integration Ideas</h3>
      <ul class="space-y-2 text-green-800 dark:text-green-200 text-sm">
        <li>• Link notes to specific financial transactions</li>
        <li>• Create task lists for budget planning sessions</li>
        <li>• Use notes to track financial goals and progress</li>
        <li>• Combine with expense tracking for complete financial management</li>
      </ul>
    </div>
  </div>

  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-8">
    <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">🎯 Advanced Workflow</h3>
    <p class="text-blue-800 dark:text-blue-200 mb-3">Create a powerful productivity system:</p>
    <ol class="space-y-2 text-blue-800 dark:text-blue-200 text-sm">
      <li class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">1</span>
        <span>Start each day by reviewing your task list and adding new items</span>
      </li>
      <li class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">2</span>
        <span>Use notes to capture thoughts and ideas throughout the day</span>
      </li>
      <li class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">3</span>
        <span>Convert important notes into actionable tasks</span>
      </li>
      <li class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">4</span>
        <span>End each day by reviewing completed tasks and planning tomorrow</span>
      </li>
    </ol>
  </div>

  <div class="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Need More Help?</h3>
    <p class="text-gray-700 dark:text-gray-300 mb-4">If you have questions about the Notes & To-Do feature:</p>
    <ul class="space-y-2 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Check out our other help center articles</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Watch our video tutorials on productivity features</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Contact support at <a href="mailto:support@balanze.com" class="text-blue-600 dark:text-blue-400 hover:underline">support@balanze.com</a></span>
      </li>
    </ul>
  </div>
</div>`
  }
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [currentArticle, setCurrentArticle] = useState<KBArticle>(MOCK_ARTICLES['getting-started-guide']);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = (updatedArticle: KBArticle) => {
    setCurrentArticle(updatedArticle);
    // In a real app, you'd save this to your backend/database

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


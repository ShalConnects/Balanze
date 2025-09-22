// src/pages/KBArticlePage.tsx
import { useEffect, useState } from 'react';
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
  Check,
  Menu,
  X,
  ChevronUp
} from 'lucide-react';
import { trackHelpCenter } from '../lib/analytics';
import { trackArticleReading, trackArticleTimeSpent, trackArticleFeedback } from '../lib/articleHistory';
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
  tableOfContents?: TableOfContentsItem[];
}

interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
  children?: TableOfContentsItem[];
}

// Mock article data - in production, this would come from your CMS/API
const MOCK_ARTICLES: Record<string, KBArticle> = {
  'settings-page-comprehensive-guide': {
    slug: 'settings-page-comprehensive-guide',
    title: 'Complete Settings Page Guide',
    description: 'Comprehensive guide to all Settings page tabs and features in Balanze',
    category: 'Settings & Configuration',
    tags: ['settings', 'configuration', 'account', 'preferences', 'categories', 'plans', 'last-wish'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0], // dynamically set to today
    readTime: '3 min read',
    author: 'Balanze Team',
    relatedArticles: ['getting-started-guide', 'account-management', 'premium-features'],
    tableOfContents: [
      { id: 'overview', title: 'Settings Page Overview', level: 1 },
      { id: 'general-tab', title: 'General', level: 1 },
      { id: 'categories-tab', title: 'Categories', level: 1 },
      { id: 'plans-usage-tab', title: 'Plans & Usage', level: 1 },
      { id: 'account-management-tab', title: 'Account Management', level: 1 },
      { id: 'last-wish-tab', title: 'Last Wish (Premium)', level: 1 },
      { id: 'pro-tips', title: 'Pro Tips', level: 1 },
      { id: 'need-help', title: 'Need Help?', level: 1 }
    ],
    content: `<div id="settings-overview" class="mb-12">
  <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-8">Complete Settings Page Guide</h1>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    The Settings page in Balanze is your central hub for customizing your financial tracking experience. This comprehensive guide will walk you through every tab and feature available in your Settings.
  </p>
<div id="overview">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings Page Overview</h2>
  </div>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    The Settings page is organized into five main tabs, each serving a specific purpose in managing your Balanze experience:
  </p>
  
  <ul class="space-y-3 text-gray-700 dark:text-gray-300 mb-8">
    <li class="flex items-start">
      <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
      <span><strong>General</strong>: Basic app preferences and currency settings</span>
    </li>
    <li class="flex items-start">
      <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
      <span><strong>Categories</strong>: Manage income and expense categories</span>
    </li>
    <li class="flex items-start">
      <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
      <span><strong>Plans & Usage</strong>: Monitor usage limits and subscription management</span>
    </li>
    <li class="flex items-start">
      <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
      <span><strong>Account</strong>: Profile management and data export</span>
    </li>
    <li class="flex items-start">
      <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
      <span><strong>Last Wish</strong>: Premium digital time capsule feature</span>
    </li>
  </ul>
</div>

<div id="general-tab" class="mb-12">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">General</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    The General tab contains your core application preferences and currency configuration.
  </p>

  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl mb-8">
    
    <div class="space-y-6">
      <div>
        <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Primary Currency Selection</h4>
        <ul class="space-y-2 text-gray-700 dark:text-gray-300">
          <li class="flex items-start">
            <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
            <span>Choose your main currency for forms and default display</span>
          </li>
          <li class="flex items-start">
            <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
            <span>Free plan users can select one primary currency</span>
          </li>
          <li class="flex items-start">
            <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
            <span>Premium users can select multiple currencies</span>
          </li>
        </ul>
        <br>
        <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">Notifications</h4>
        <ul class="space-y-2 text-gray-700 dark:text-gray-300">
          <li class="flex items-start">
            <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
            <span>You can change your notification preferences here</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <img src="/settings-currency.gif" alt="Settings Currency" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg mb-8" />
</div>

<div id="categories-tab" class="mb-12">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Categories</h2>
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    For comprehensive, step-by-step instructions, please refer to our guide:&nbsp;
    <a 
      href="/kb/how-to-create-your-first-income-expense-category" 
      class="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
      target="_blank"
      rel="noopener"
    >
      How to Create Your First Income/Expense Category
    </a>.
    <br />
    This resource provides detailed information on how to add, customize, and manage your <strong>income/expense categories</strong> within Balanze.
  </p>
    
</div>

<div id="plans-usage-tab" class="mb-12">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Plans & Usage</h2>

  <div class="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-xl mb-8">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      The <strong>Plans & Usage</strong> tab gives you a clear overview of your current subscription plan, usage limits, and upgrade options in Balanze. Here, you can monitor how much of your plan's quota you've used, see what features are available to you, and manage your subscription.
    </p>
    <ul class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span><strong>Current Plan:</strong> See whether you're on the Free or Premium plan, and what features are included.</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span><strong>Usage Overview:</strong> Track your usage of accounts, currencies, and transactions for the current month.</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span><strong>Upgrade Options:</strong> Explore the benefits of upgrading to Premium and start the upgrade process directly from this tab.</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span><strong>Renewal & Billing:</strong> View your renewal date, manage payment methods, and download invoices (Premium only).</span>
      </li>
    </ul>
  </div>

  <div class="bg-green-50 dark:bg-green-900/20 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Plan Comparison</h3>
    <div class="overflow-x-auto">
      <table class="min-w-full text-left border border-gray-200 dark:border-gray-700 rounded-lg">
        <thead>
          <tr class="bg-gray-100 dark:bg-gray-800">
            <th class="px-4 py-3 font-semibold text-gray-900 dark:text-white">Feature</th>
            <th class="px-4 py-3 font-semibold text-blue-700 dark:text-blue-400">Free</th>
            <th class="px-4 py-3 font-semibold text-yellow-700 dark:text-yellow-400">Premium</th>
          </tr>
        </thead>
        <tbody class="text-gray-700 dark:text-gray-300">
          <tr class="border-t border-gray-200 dark:border-gray-700">
            <td class="px-4 py-3">Accounts</td>
            <td class="px-4 py-3">Up to 3</td>
            <td class="px-4 py-3">Unlimited</td>
          </tr>
          <tr class="border-t border-gray-200 dark:border-gray-700">
            <td class="px-4 py-3">Currencies</td>
            <td class="px-4 py-3">1</td>
            <td class="px-4 py-3">Multiple</td>
          </tr>
          <tr class="border-t border-gray-200 dark:border-gray-700">
            <td class="px-4 py-3">Transactions per month</td>
            <td class="px-4 py-3">100</td>
            <td class="px-4 py-3">Unlimited</td>
          </tr>
          <tr class="border-t border-gray-200 dark:border-gray-700">
            <td class="px-4 py-3">Analytics</td>
            <td class="px-4 py-3">Basic</td>
            <td class="px-4 py-3">Advanced</td>
          </tr>
          <tr class="border-t border-gray-200 dark:border-gray-700">
            <td class="px-4 py-3">Priority Support</td>
            <td class="px-4 py-3">-</td>
            <td class="px-4 py-3">Yes</td>
          </tr>
          <tr class="border-t border-gray-200 dark:border-gray-700">
            <td class="px-4 py-3">Data Export</td>
            <td class="px-4 py-3">CSV</td>
            <td class="px-4 py-3">CSV, Excel, PDF</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
      <span class="font-semibold text-yellow-700 dark:text-yellow-300">Premium</span> unlocks unlimited accounts, advanced analytics, and more.
    </p>
  </div>

  <div class="bg-purple-50 dark:bg-purple-900/20 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">How to Upgrade</h3>
    <ol class="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
      <li>Go to the <strong>Plans & Usage</strong> tab in your Settings.</li>
      <li>Click the <span class="font-semibold text-yellow-700 dark:text-yellow-300">Get started</span> button.</li>
      <li>Follow the prompts to select your plan and enter payment details.</li>
      <li>Once upgraded, your new features and limits will be available instantly.</li>
    </ol>
    <p class="mt-4 text-gray-700 dark:text-gray-300">
      If you have questions about billing or need help choosing a plan, contact our support team from the <strong>Need Help?</strong> section.
    </p>
  </div>
  <img src="/plan-usage.gif" alt="Settings Upgrade" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg mb-8" />
</div>

<div id="account-management-tab" class="mb-12">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Management</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    The <strong>Account Management</strong> tab is your central hub for managing your Balanze profile, security, and data. Here’s a detailed breakdown of what you can do in this section:
  </p>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">Profile Settings</h4>
      <ul class="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-2">
        <li>Update your <strong>name</strong> and <strong>email address</strong></li>
        <li>Upload or change your <strong>profile picture</strong></li>
        <li>View your <strong>account creation date</strong></li>
      </ul>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3">Data Export</h4>
      <ul class="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-2">
        <li>Export your data in <strong>CSV</strong>, <strong>Excel</strong>, or <strong>PDF</strong> formats</li>
      </ul>
    </div>
        <div class="bg-pink-50 dark:bg-red-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-red-900 dark:text-red-300 mb-3">Account Actions & Article History</h4>
      <ul class="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-2">
        <li>
          <strong>View your Article History</strong> – See a list of help center articles you've read, your feedback, and your time spent on each article. This helps you keep track of your learning progress and revisit useful guides anytime.
        </li>
      </ul>
    </div>
    <div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-red-900 dark:text-red-300 mb-3">Account Actions</h4>
      <ul class="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-2">
        <li><strong>Delete your account</strong> permanently (with confirmation and warning)</li>
      </ul>
    </div>
  </div>

  <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-8">
    <h4 class="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Tips for Managing Your Account</h4>
    <ul class="list-disc ml-6 text-gray-700 dark:text-gray-300 space-y-1">
      <li>Keep your email address up to date to receive important notifications.</li>
      <li>Regularly export your data for your own records or backups.</li>
    </ul>
  </div>
  <img src="/account-management.png" alt="Account Management" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg mb-8" />
</div>

<div id="last-wish-tab" class="mb-12">

  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Last Wish (Premium Feature)</h2>
    <div class="mb-6">
    <span class="inline-block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 font-semibold px-4 py-2 rounded-lg text-base shadow-sm">
      <strong>Premium Feature:</strong> Last Wish is available on <span class="font-bold">Balanze Premium</span>. Upgrade to unlock this powerful digital time capsule feature!
    </span>
  </div>
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    To know more about how to use this feature, check out our article: 
    <a 
      href="/kb/how-to-use-last-wish" 
      class="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
      target="_blank"
      rel="noopener"
    >
      How to Use Last Wish
    </a>
  </p>
</div>

<div id="pro-tips" class="mb-12">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pro Tips</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">Customize Your Categories</h4>
      <p class="text-gray-700 dark:text-gray-300">Create specific categories that match your spending habits - this makes tracking and budgeting much more effective</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">Monitor Your Usage</h4>
      <p class="text-gray-700 dark:text-gray-300">Check your Plans & Usage tab regularly to see how close you are to your limits and plan upgrades accordingly</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3">Export Data Regularly</h4>
      <p class="text-gray-700 dark:text-gray-300">Set up regular data exports for backup purposes - this ensures you never lose your financial history</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-orange-900 dark:text-orange-300 mb-3">Review Article History</h4>
      <p class="text-gray-700 dark:text-gray-300">Use the Article History feature to track your learning progress and revisit helpful guides when needed</p>
    </div>
  </div>
</div>

<div id="need-help" class="mb-12">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Need Help?</h2>
  
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

`
  },
  'getting-started-guide': {
    slug: 'getting-started-guide',
    title: 'Getting Started with Balanze',
    description: 'Complete guide to setting up your account and adding your first transactions',
    category: 'Getting Started',
    tags: ['setup', 'beginner', 'accounts', 'transactions'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0], // dynamically set to today
    readTime: `${Math.max(1, Math.round((`
      <div id="what-is-balanze" class="mb-12">

          
        `.replace(/<[^>]+>/g, '').split(/\s+/).length) / 200))} min read`, // estimate: 200 wpm
    author: 'Balanze Team',
    tableOfContents: [
      {
        id: 'what-is-balanze',
        title: 'What is Balanze?',
        level: 1
      },
      {
        id: 'pricing',
        title: 'Plans & Pricing',
        level: 1,
      },
      {
        id: 'registration-and-login',
        title: 'Registration & Login',
        level: 1,
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
      }
    ],
    content: `
<div id="what-is-balanze" class="mb-12">

    
  
  <div class="mb-8">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Congratulations on taking the first step towards better financial management. This guide will walk you through everything you need to know to get started with Balanze.
    </p>

      <h5 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">What is Balanze?</h5>

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

  <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 my-8 rounded-r-lg" id="pricing">
    <p class="text-gray-700 dark:text-gray-300 font-medium text-lg leading-relaxed">
      <strong class="text-blue-600 dark:text-blue-400">Balanze is completely FREE to use!</strong> Start tracking your finances immediately with our full-featured free plan. 
      Want even more advanced features? Try our premium features with a <span class="text-blue-600 dark:text-blue-400 font-bold">14-day free trial</span> - no credit card required!
    </p>
  </div>

  <div class="my-8">
    <img src="/article_1.png" alt="Balanze Dashboard Overview" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg" />
  </div>
</div>

<div id="registration-and-login" class="mb-12">

<p class="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
  To get started with Balanze, you need to create an account. You will have two options to do so:
</p>
<p class="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
  - Register with your email address and password <br>
  - Register with your Google account
</p>
<img src="/article_2.png" alt="Balanze Registration" class="w-1/2 max-w-4xl mx-auto rounded-lg shadow-lg" />
<br>
<p class="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
  After you login, you will be redirected to the dashboard where you need to select your currency first. After you select your currency, a default 
  <span class="relative group inline-block">
    <span class="underline decoration-dotted cursor-pointer text-blue-600 dark:text-blue-400" tabIndex={0}>
      Cash Account
      <span class="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm rounded-lg shadow-lg px-4 py-3 z-20 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none">
        A <strong>Cash Account</strong> in Balanze represents your physical cash on hand (e.g., bills and coins in your wallet). It helps you track cash transactions separately from your bank or credit card accounts.
      </span>
    </span>
  </span>
  will be created for you.
</p>
<img src="/select_currency.gif" alt="Balanze Dashboard" class="w-1/2 max-w-4xl mx-auto rounded-lg shadow-lg" />
</div>

<div id="pro-tips" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Pro Tips</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">Choose Your Currency Wisely</h4>
      <p class="text-gray-700 dark:text-gray-300">Select your primary currency during setup - you can always add more currencies later, but this sets your default for all new accounts</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">Google Sign-In Advantage</h4>
      <p class="text-gray-700 dark:text-gray-300">Using Google sign-in is faster and more secure - no need to remember another password, and you get automatic account recovery</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3">Start with the Default Cash Account</h4>
      <p class="text-gray-700 dark:text-gray-300">The automatically created cash account is perfect for tracking physical cash transactions - use it for wallet money, tips, and small purchases</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-orange-900 dark:text-orange-300 mb-3">Free Trial Benefits</h4>
      <p class="text-gray-700 dark:text-gray-300">Take advantage of the 14-day free trial to explore premium features like advanced analytics and multi-currency support</p>
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

`,
    relatedArticles: ['create-first-account', 'create-first-transaction', 'analytics-dashboard']
  },
  'create-first-account': {
    slug: 'create-first-account',
    title: 'How to Create Your First Account',
    description: 'Step-by-step guide to adding bank accounts, credit cards, and cash wallets with DPS setup',
    category: 'Accounts',
    tags: ['accounts', 'setup', 'banking', 'dps'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0], // dynamically set to today
    readTime: `${Math.max(1, Math.round((`
      You can add more accounts later by following these steps: Click on Accounts in the sidebar. Click the Add Account button. Choose your account type Bank Account Credit Card Cash etc. Fill in the details: Account name e.g. Chase Checking Account Type Initial balance Currency Description optional. Account Types Balanze supports several account types including Checking Savings Credit Cash Investment accounts and more. DPS While you are at it you can also enable Daily Profit Sharing DPS for your account. DPS is a feature that allows you to automatically transfer a portion of your daily income to a savings account to build wealth over time. What is DPS Daily Profit Sharing? DPS stands for Daily Profit Sharing. It's a savings automation feature that helps you grow your wealth by regularly transferring a set amount or percentage of your income into a dedicated savings account. With DPS enabled you can ensure consistent savings without manual effort making it easier to reach your financial goals. DPS can be enabled for any eligible account such as a savings account. You can choose how often to contribute e.g. daily monthly. Decide whether to save a fixed amount or a percentage of your income. Track your DPS balance and watch your savings grow automatically. How to Enable DPS When creating or editing an account look for the Enable DPS option. Toggle the switch to enable DPS for this account. Choose your DPS Type: Monthly: Contribute once per month. Daily: Contribute every day if supported. Select your Amount Type: Fixed Amount: Save a specific amount each period e.g. 10/month. Percentage: Save a percentage of your income e.g. 5% of each deposit. Enter the Fixed Amount or Percentage you want to save. For example 0.00 as the starting value. Optionally set an Initial DPS Balance if you want to start with an existing amount. Save your account settings. DPS will now run automatically based on your configuration! Tip: You can always adjust or disable DPS later from your account settings. Start with Real Balances Enter your actual account balances when creating accounts - this gives you an accurate starting point for tracking your finances. Enable DPS Early Set up Daily Profit Sharing when creating savings accounts - even small amounts add up over time and build good saving habits. Use Descriptive Names Give your accounts clear descriptive names like Chase Checking or Emergency Savings - this makes it easier to identify them later. Account Types Matter Choose the correct account type Checking Savings Credit etc. - this affects how balances are calculated and displayed in your dashboard.
      `.replace(/<[^>]+>/g, '').split(/\s+/).length) / 200))} min read`, // estimate: 200 wpm
    author: 'Balanze Team',
    tableOfContents: [
      {
        id: 'accounts',
        title: 'Creating Your First Account',
        level: 1,
        children: [
          {
            id: 'account-types',
            title: '- Account Types',
            level: 2,
          },
          {
            id: 'dps',
            title: '- DPS (Daily Profit Sharing)',
            level: 2,
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
      }
    ],
    content: `<div id="accounts" class="mb-12">

  <div class="space-y-12">
    <div id="create-first-account" class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
      <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">You can add accounts by following these steps:</h3>
      
      <div class="space-y-4 text-gray-700 dark:text-gray-300">
        <div class="flex items-start">
          <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">1</span>
          <div>
            <span>Click on <strong>"Accounts"</strong> in the sidebar</span>
            <img 
              src="/add_account_1.png" 
              alt='Screenshot showing the "Accounts" button highlighted in the Balanze sidebar' 
              class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0"
              style={{ marginLeft: 0 }}
            />
          </div>
        </div>
        <div class="flex items-start">
          <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">2</span>
          <div>
            <span>Click the <strong>"Add Account"</strong> button</span>
            <img 
              src="/add_account_2.png" 
              alt='Screenshot showing the "Add Accounts" button' 
              class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0"
              style={{ marginLeft: 0 }}
            />
          </div>
        </div>
        <div class="flex items-start">
          <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">3</span>
          <span>Choose your account type (Bank Account, Credit Card, Cash, etc.)</span>
        </div>
        <div class="flex items-start">
          <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">4</span>
          <div>
            <span>Fill in the details:</span>
            <ul class="mt-2 ml-4 space-y-2">
              <li class="flex items-start">
                <span class="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Account name (e.g., "Chase Checking")</span>
              </li>
              <li class="flex items-start">
                <span class="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Account Type</span>
              </li>
              <li class="flex items-start">
                <span class="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Initial balance</span>
              </li>
              <li class="flex items-start">
                <span class="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Currency</span>
              </li>
              <li class="flex items-start">
                <span class="text-blue-600 dark:text-blue-400 mr-2">•</span>
                <span>Description (optional)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div id="account-types" class="mt-8 p-6 bg-white dark:bg-gray-700 rounded-lg">
        <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Types</h4>
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
          Balanze supports several account types including Checking, Savings, Credit, Cash, Investment accounts, and more.
        </p>
        <img src="/account_types.png" alt="Account Types" class="w-full max-w-2xl mx-auto rounded-lg shadow-md" />
      </div>
      <div id="dps" class="mt-8 p-6 bg-white dark:bg-gray-700 rounded-lg">
        <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">DPS</h4>
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
          While you are at it, you can also enable Daily Profit Sharing (DPS) for your account. DPS is a feature that allows you to automatically transfer a portion of your daily income to a savings account to build wealth over time.
        </p>
        <div class="mt-6">
          <h5 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">What is DPS (Daily Profit Sharing)?</h5>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            <strong>DPS</strong> stands for <strong>Daily Profit Sharing</strong>. It's a savings automation feature that helps you grow your wealth by regularly transferring a set amount or percentage of your income into a dedicated savings account. With DPS enabled, you can ensure consistent savings without manual effort, making it easier to reach your financial goals.
          </p>
          <ul class="list-disc ml-6 text-gray-700 dark:text-gray-300 mb-4 space-y-1">
            <li>DPS can be enabled for any eligible account (such as a savings account).</li>
            <li>You can choose how often to contribute (e.g., daily, monthly).</li>
            <li>Decide whether to save a fixed amount or a percentage of your income.</li>
            <li>Track your DPS balance and watch your savings grow automatically.</li>
          </ul>
        </div>
        <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h6 class="text-md font-semibold text-blue-700 dark:text-blue-300 mb-2">How to Enable DPS</h6>
          <ol class="list-decimal ml-6 text-gray-700 dark:text-gray-300 space-y-1 mb-2">
            <li>When creating or editing an account, look for the <strong>"Enable DPS"</strong> option.</li>
            <li>Toggle the switch to enable DPS for this account.</li>
            <li>Choose your <strong>DPS Type</strong>:
              <ul class="list-disc ml-6 mt-1">
                <li><strong>Monthly</strong>: Contribute once per month.</li>
                <li><strong>Daily</strong>: Contribute every day (if supported).</li>
              </ul>
            </li>
            <li>Select your <strong>Amount Type</strong>:
              <ul class="list-disc ml-6 mt-1">
                <li><strong>Fixed Amount</strong>: Save a specific amount each period (e.g., $10/month).</li>
                <li><strong>Percentage</strong>: Save a percentage of your income (e.g., 5% of each deposit).</li>
              </ul>
            </li>
            <li>Enter the <strong>Fixed Amount</strong> or <strong>Percentage</strong> you want to save. For example, <code>0.00</code> as the starting value.</li>
            <li>Optionally, set an <strong>Initial DPS Balance</strong> if you want to start with an existing amount.</li>
            <li>Save your account settings. DPS will now run automatically based on your configuration!</li>
          </ol>
          <div class="mt-4">
            <img src="/dps.png" alt="Enable DPS Example" class="w-full max-w-md mx-auto rounded shadow" />
          </div>
        </div>
        <div class="mt-4 text-gray-700 dark:text-gray-300">
          <strong>Tip:</strong> You can always adjust or disable DPS later from your account settings.
        </div>
      </div>
    </div>

  </div>
</div>

<div id="pro-tips" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Pro Tips</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">Start with Real Balances</h4>
      <p class="text-gray-700 dark:text-gray-300">Enter your actual account balances when creating accounts - this gives you an accurate starting point for tracking your finances</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">Enable DPS Early</h4>
      <p class="text-gray-700 dark:text-gray-300">Set up Daily Profit Sharing when creating savings accounts - even small amounts add up over time and build good saving habits</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3">Use Descriptive Names</h4>
      <p class="text-gray-700 dark:text-gray-300">Give your accounts clear, descriptive names like "Chase Checking" or "Emergency Savings" - this makes it easier to identify them later</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-orange-900 dark:text-orange-300 mb-3">Account Types Matter</h4>
      <p class="text-gray-700 dark:text-gray-300">Choose the correct account type (Checking, Savings, Credit, etc.) - this affects how balances are calculated and displayed in your dashboard</p>
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

`,
    relatedArticles: ['getting-started-guide', 'create-first-transaction', 'multi-currency-setup']
  },
  'how-to-use-last-wish': {
    slug: 'how-to-use-last-wish',
    title: 'How to Use Last Wish - Premium Digital Time Capsule',
    description: 'Complete guide to setting up and using the Last Wish feature - your premium digital time capsule for financial legacy planning',
    category: 'Premium Features',
    tags: ['premium', 'last-wish', 'digital-time-capsule', 'legacy', 'financial-planning', 'advanced'],
    difficulty: 'intermediate',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '8 min read',
    author: 'Balanze Team',
    relatedArticles: ['settings-page-comprehensive-guide', 'premium-features', 'account-management'],
    tableOfContents: [
      { id: 'overview', title: 'What is Last Wish?', level: 1 },
      { id: 'getting-started', title: 'Getting Started', level: 1 },
      { id: 'setting-up-last-wish', title: 'Setting Up Your Last Wish', level: 1 },
      { id: 'creating-messages', title: 'Creating Messages & Instructions', level: 1 },
      { id: 'managing-recipients', title: 'Managing Recipients', level: 1 },
      { id: 'security-privacy', title: 'Security & Privacy', level: 1 },
      { id: 'activation-delivery', title: 'Activation & Delivery Process', level: 1 },
      { id: 'pro-tips', title: 'Pro Tips', level: 1 },
      { id: 'need-help', title: 'Need Help?', level: 1 }
    ],
    content: `<div id="last-wish-overview" class="mb-12">


  <div class="mb-6">
    <span class="inline-block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 font-semibold px-4 py-2 rounded-lg text-base shadow-sm">
      <svg class="inline-block w-5 h-5 mr-2 -mt-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.93 12.412a.75.75 0 01-1.86 0l-.7-2.8a.75.75 0 01.72-.962h2.82a.75.75 0 01.72.962l-.7 2.8zm-.93-4.162a1 1 0 110-2 1 1 0 010 2z"/>
      </svg>
      <strong>Premium Feature:</strong> Last Wish are available on <span class="font-bold">Balanze Premium</span>. Upgrade to unlock this feature and manage your personal loans with ease!
    </span>
  </div>

<div id="overview">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">What is Last Wish?</h2>
  </div>
  
  <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 rounded-xl mb-8">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Last Wish is more than just a digital vault - it's a comprehensive legacy planning tool designed specifically for your financial life. Think of it as a secure, encrypted time capsule that ensures your financial information and final wishes reach the right people at the right time.
    </p>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div class="flex items-center mb-3">
          <span class="text-2xl mr-3">🔒</span>
          <h4 class="font-semibold text-gray-900 dark:text-white">Secure Storage</h4>
        </div>
        <p class="text-gray-700 dark:text-gray-300 text-sm">
          Bank-grade encryption protects all your sensitive information
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div class="flex items-center mb-3">
          <span class="text-2xl mr-3">📝</span>
          <h4 class="font-semibold text-gray-900 dark:text-white">Financial Records</h4>
        </div>
        <p class="text-gray-700 dark:text-gray-300 text-sm">
          Store account numbers, passwords, and important financial documents
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div class="flex items-center mb-3">
          <span class="text-2xl mr-3">💌</span>
          <h4 class="font-semibold text-gray-900 dark:text-white">Personal Messages</h4>
        </div>
        <p class="text-gray-700 dark:text-gray-300 text-sm">
          Leave heartfelt messages and important instructions for loved ones
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div class="flex items-center mb-3">
          <span class="text-2xl mr-3">👥</span>
          <h4 class="font-semibold text-gray-900 dark:text-white">Multiple Recipients</h4>
        </div>
        <p class="text-gray-700 dark:text-gray-300 text-sm">
          Designate different information for different people
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div class="flex items-center mb-3">
          <span class="text-2xl mr-3">⏰</span>
          <h4 class="font-semibold text-gray-900 dark:text-white">Controlled Delivery</h4>
        </div>
        <p class="text-gray-700 dark:text-gray-300 text-sm">
          Information is delivered only when specific conditions are met
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div class="flex items-center mb-3">
          <span class="text-2xl mr-3">🔄</span>
          <h4 class="font-semibold text-gray-900 dark:text-white">Always Updated</h4>
        </div>
        <p class="text-gray-700 dark:text-gray-300 text-sm">
          Automatically includes your latest Balanze financial data
        </p>
      </div>
    </div>
  </div>
</div>

<div id="getting-started" class="mb-12">

  <div class="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Prerequisites</h3>
    
    <div class="space-y-4">
      <div class="flex items-start">
        <div class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">1</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Balanze Premium Subscription</h4>
          <p class="text-gray-700 dark:text-gray-300">
            Last Wish is a premium feature. If you haven't upgraded yet, go to Settings → Plans & Usage to get started with Premium.
          </p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">2</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Email Verification</h4>
          <p class="text-gray-700 dark:text-gray-300">
            Ensure your email address is verified in Settings → Account Management, as this is crucial for the delivery process.
          </p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">3</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Gather Information</h4>
          <p class="text-gray-700 dark:text-gray-300">
            Collect the financial information, account details, and recipient email addresses you want to include.
          </p>
        </div>
      </div>
    </div>
  </div>
  
  <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
    <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">✅ Ready to Begin?</h4>
    <p class="text-gray-700 dark:text-gray-300">
      Once you have Premium access and your email is verified, navigate to <strong>Settings → Last Wish</strong> to start setting up your digital time capsule.
    </p>
  </div>
</div>

<div id="setting-up-last-wish" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Setting Up Your Last Wish</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    Setting up Last Wish is a step-by-step process that ensures all your important information is properly organized and secured.
  </p>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Initial Setup Process</h3>
    
    <div class="space-y-8">
      <div class="flex items-start">
        <div class="bg-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-6 mt-0 flex-shrink-0">1</div>
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Access Last Wish Settings</h4>
          <ul class="text-gray-700 dark:text-gray-300 ml-4 space-y-1 mb-4">
            <li>• Navigate to Settings from your dashboard</li>
            <li>• Click on the "Last Wish" tab</li>
            <li>• You'll see the Last Wish setup interface</li>
          </ul>
          <div class="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> If you don't see the Last Wish tab, ensure your Premium subscription is active.
            </p>
          </div>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-6 mt-0 flex-shrink-0">2</div>
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Enable Last Wish</h4>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            Click the "Enable Last Wish" toggle to activate the feature. This will initialize your secure digital time capsule.
          </p>
          <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <p class="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>Important:</strong> Once enabled, your Last Wish will remain active as long as your Premium subscription is maintained.
            </p>
          </div>
          <img src="/last_wish_enable.png" alt="Screenshot showing the "Enable Last Wish" toggle" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-6 mt-0 flex-shrink-0">3</div>
        <div class="flex-1">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Set Activation Conditions</h4>
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            Configure when your Last Wish should be activated:
          </p>
          <ul class="text-gray-700 dark:text-gray-300 ml-4 space-y-2 mb-4">
            <li>• <strong>Inactivity Period:</strong> Set how long without account activity triggers activation (default: 180 days)</li>
            <img src="/last_wish_activation_conditions.png" alt="Screenshot showing the "Activation Conditions" settings" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
            <li>• <strong>Emergency Contacts:</strong> Designate trusted contacts who can request activation</li>
            <img src="/last_wish_emergency_contacts.png" alt="Screenshot showing the "Emergency Contacts" settings" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
          </ul>
        </div>
      </div>
    <div class="flex items-start">
      <div class="bg-purple-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-6 mt-0 flex-shrink-0">4</div>
      <div class="flex-1">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-3">How Inactivity Monitoring & Data Distribution Works</h4>
        <p class="text-gray-700 dark:text-gray-300 mb-4">
          The system will continuously monitor your account activity. You can select an inactivity duration from the available options: <strong>7, 14, 30, 60, or 90 days</strong>. If you do not log in or interact with your account within the chosen period, Balanze will automatically trigger the secure distribution of your Last Wish data to your authorized beneficiaries.
        </p>
        <ul class="text-gray-700 dark:text-gray-300 ml-4 space-y-1 mb-4">
          <li>• Choose your preferred inactivity period in the Last Wish settings</li>
          <li>• If no activity is detected for the selected duration, the system initiates the data delivery process</li>
          <li>• Only your designated beneficiaries will receive the information, ensuring privacy and security</li>
        </ul>
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p class="text-sm text-blue-900 dark:text-blue-300">
            <strong>Tip:</strong> You can update your inactivity period or beneficiaries at any time from the Last Wish tab in Settings.
          </p>
        </div>
        <img src="/last_wish_inactivity_monitoring.png" alt="Screenshot showing inactivity period selection and beneficiary list" class="w-1/2 max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
      </div>
    </div>

    </div>
  </div>
</div>

<div id="creating-messages" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Creating Messages & Instructions</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    The heart of Last Wish is the ability to leave meaningful messages and detailed instructions for your recipients. This section helps you organize different types of information effectively.
  </p>
  
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center">
        <span class="mr-2">💝</span> Personal Messages
      </h4>
      <ul class="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
        <li>• Heartfelt goodbye messages</li>
        <li>• Life advice and wisdom</li>
        <li>• Family history and stories</li>
        <li>• Personal memories and experiences</li>
        <li>• Expressions of love and gratitude</li>
      </ul>
      <img src="/last_wish_create_messages.png" alt="Screenshot showing the "Create Messages" section" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
    </div>
    
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-green-900 dark:text-green-300 mb-4 flex items-center">
        <span class="mr-2">📋</span> Financial Instructions
      </h4>
      <ul class="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
        <li>• Bank account details and passwords</li>
        <li>• Investment account information</li>
        <li>• Insurance policy details</li>
        <li>• Bill payment instructions</li>
        <li>• Asset location and access details</li>
      </ul>
      <img src="/last_wish_data_export.png" alt="Screenshot showing the data export options for Last Wish messages and instructions" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
    </div>
  </div>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Creating Your Messages</h3>
    
    <div class="space-y-6">
      <div class="flex items-start">
        <div class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">1</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Add New Message Section</h4>
          <p class="text-gray-700 dark:text-gray-300">Click "Add Message Section" to create different categories of information (Personal, Financial, Instructions, etc.)</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">2</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Choose Section Type</h4>
          <ul class="text-gray-700 dark:text-gray-300 ml-4 space-y-1">
            <li>• <strong>Personal Message:</strong> For heartfelt communications</li>
            <li>• <strong>Financial Information:</strong> For account details and passwords</li>
            <li>• <strong>Instructions:</strong> For step-by-step guidance</li>
            <li>• <strong>Documents:</strong> For important file attachments</li>
          </ul>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">3</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Write Your Content</h4>
          <p class="text-gray-700 dark:text-gray-300">Use the rich text editor to format your messages with headers, lists, and emphasis where needed</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">4</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Set Privacy Levels</h4>
          <p class="text-gray-700 dark:text-gray-300">Choose which recipients can see each section - some information might be for everyone, while sensitive details might be for specific people only</p>
        </div>
      </div>
    </div>
  </div>
  
  <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl mb-6">
    <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3">💡 Writing Tips</h4>
    <ul class="text-gray-700 dark:text-gray-300 space-y-2">
      <li>• <strong>Be Specific:</strong> Include exact account numbers, website URLs, and contact information</li>
      <li>• <strong>Use Clear Language:</strong> Write as if explaining to someone unfamiliar with your finances</li>
      <li>• <strong>Include Context:</strong> Explain why certain accounts exist and how they're used</li>
      <li>• <strong>Regular Updates:</strong> Review and update information quarterly or when major changes occur</li>
      <li>• <strong>Personal Touch:</strong> Balance practical information with emotional messages</li>
    </ul>
  </div>
</div>

<div id="managing-recipients" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Managing Recipients</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    Last Wish allows you to designate different recipients for different types of information, ensuring that each person receives only what's appropriate and relevant to them.
  </p>
  
  <div class="bg-teal-50 dark:bg-teal-900/20 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Adding Recipients</h3>
    
    <div class="space-y-6">
      <div class="flex items-start">
        <div class="bg-teal-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">1</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Click "Add Recipient"</h4>
          <p class="text-gray-700 dark:text-gray-300">Navigate to the Authorized Beneficiaries section and click the "Add" button</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-teal-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">2</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Enter Recipient Details</h4>
          <ul class="text-gray-700 dark:text-gray-300 ml-4 space-y-1">
            <li>• <strong>Full Name:</strong> The recipient's complete name</li>
            <li>• <strong>Email Address:</strong> A valid, frequently-checked email</li>
            <li>• <strong>Relationship:</strong> Your relationship to this person</li>
          </ul>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-teal-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">3</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Verify Email Address</h4>
          <p class="text-gray-700 dark:text-gray-300">Click authorize beneficiary button</p>
        </div>
      </div>
    </div>
  </div>
  
  
  <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-6">
    <h4 class="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">📧 Email Verification Important</h4>
    <p class="text-gray-700 dark:text-gray-300">
      Always verify recipient email addresses and consider adding backup contacts. If an email address becomes invalid, that recipient won't receive their information. Consider informing trusted recipients about Last Wish (without revealing sensitive details) so they know to expect it.
    </p>
  </div>
  
  <div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl">
    <h4 class="font-semibold text-red-900 dark:text-red-300 mb-3">🚨 Backup Recipients</h4>
    <p class="text-gray-700 dark:text-gray-300 mb-3">
      Always designate backup recipients in case primary recipients are unavailable:
    </p>
    <ul class="text-gray-700 dark:text-gray-300 space-y-1">
      <li>• Set up at least 2 recipients for critical information</li>
      <li>• Include recipients of different generations (in case of age-related issues)</li>
      <li>• Consider geographical diversity (different locations)</li>
      <li>• Review and update recipient information annually</li>
    </ul>
  </div>
</div>

<div id="security-privacy" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Security & Privacy</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    Last Wish employs multiple layers of security to protect your sensitive information while ensuring it reaches the right people when needed.
  </p>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-4 flex items-center">
        <span class="mr-2">🔐</span> Encryption & Storage
      </h4>
      <ul class="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
        <li>• <strong>AES-256 Encryption:</strong> Military-grade encryption for all stored data</li>
        <li>• <strong>Zero-Knowledge Architecture:</strong> Balanze cannot read your encrypted messages</li>
        <li>• <strong>Secure Key Management:</strong> Encryption keys are managed separately from data</li>
        <li>• <strong>Regular Security Audits:</strong> Third-party security assessments ensure protection</li>
      </ul>
    </div>
    
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-green-900 dark:text-green-300 mb-4 flex items-center">
        <span class="mr-2">🛡️</span> Access Control
      </h4>
      <ul class="text-gray-700 dark:text-gray-300 space-y-2 text-sm">
        <li>• <strong>Multi-Factor Authentication:</strong> Recipients must verify identity</li>
        <li>• <strong>Time-Based Access:</strong> Information only available after activation</li>
        <li>• <strong>Role-Based Permissions:</strong> Each recipient sees only their designated content</li>
        <li>• <strong>Audit Trail:</strong> All access attempts are logged and monitored</li>
      </ul>
    </div>
  </div>
  
  <div class="bg-purple-50 dark:bg-purple-900/20 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">How Your Data is Protected</h3>
    
    <div class="space-y-6">
      <div class="flex items-start">
        <div class="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">1</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Data Encryption at Rest</h4>
          <p class="text-gray-700 dark:text-gray-300">All Last Wish data is encrypted using AES-256 encryption before being stored on our servers. Your master password serves as part of the encryption key.</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">2</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Transmission Security</h4>
          <p class="text-gray-700 dark:text-gray-300">When activated, your Last Wish information is transmitted to recipients using TLS encryption and additional password protection.</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">3</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Access Verification</h4>
          <p class="text-gray-700 dark:text-gray-300">Recipients must provide both the master password and verify their identity through email before accessing any information.</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">4</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Data Isolation</h4>
          <p class="text-gray-700 dark:text-gray-300">Each recipient's information is stored and transmitted separately, ensuring complete privacy between different recipients.</p>
        </div>
      </div>
    </div>
  </div>
  
  <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-r-lg mb-6">
    <h4 class="font-semibold text-red-700 dark:text-red-300 mb-2">🔒 Your Responsibilities</h4>
    <ul class="text-gray-700 dark:text-gray-300 space-y-2">
      <li>• <strong>Strong Master Password:</strong> Choose a secure but memorable master password</li>
      <li>• <strong>Secure Password Storage:</strong> Store the master password where trusted contacts can find it</li>
      <li>• <strong>Regular Updates:</strong> Keep recipient information and content current</li>
      <li>• <strong>Email Security:</strong> Ensure recipient email accounts are secure</li>
      <li>• <strong>Trusted Recipients:</strong> Only add people you completely trust</li>
    </ul>
  </div>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
    <h4 class="font-semibold text-gray-900 dark:text-white mb-3">🔍 Privacy Controls</h4>
    <ul class="text-gray-700 dark:text-gray-300 space-y-2">
      <li>• <strong>Granular Permissions:</strong> Control exactly what each recipient can see</li>
      <li>• <strong>Anonymous Recipients:</strong> Recipients don't see each other's information or identities</li>
      <li>• <strong>Selective Sharing:</strong> Different messages can have different recipient lists</li>
      <li>• <strong>Revocation Rights:</strong> You can remove recipients or change permissions anytime</li>
    </ul>
  </div>
</div>

<div id="activation-delivery" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Activation & Delivery Process</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    Understanding how Last Wish is activated and delivered helps ensure your information reaches recipients when intended while preventing accidental or premature activation.
  </p>
  
  <div class="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">The Delivery Process</h3>
    
    <div class="space-y-6">
      <div class="flex items-start">
        <div class="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-6 mt-0 flex-shrink-0">1</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Activation Triggered</h4>
          <p class="text-gray-700 dark:text-gray-300">Either inactivity period expires or emergency activation is confirmed through the verification process.</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-6 mt-0 flex-shrink-0">2</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Recipients Notified</h4>
          <p class="text-gray-700 dark:text-gray-300">All designated recipients receive an email notification that your Last Wish has been activated and they have information waiting for them.</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-6 mt-0 flex-shrink-0">3</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Secure Access Portal</h4>
          <p class="text-gray-700 dark:text-gray-300">Recipients are provided with a secure link to access their designated information, requiring the master password for entry.</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-6 mt-0 flex-shrink-0">4</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Information Delivered</h4>
          <p class="text-gray-700 dark:text-gray-300">After authentication, recipients can view their designated messages, download financial information, and access any attached documents.</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mr-6 mt-0 flex-shrink-0">5</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Balanze Data Included</h4>
          <p class="text-gray-700 dark:text-gray-300">Recipients automatically receive your complete Balanze financial data export, including all accounts, transactions, and reports up to the activation date.</p>
        </div>
      </div>
    </div>
  </div>
  
  <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-6">
    <h4 class="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">⚠️ Preventing Accidental Activation</h4>
    <ul class="text-gray-700 dark:text-gray-300 space-y-2">
      <li>• <strong>Warning Emails:</strong> You'll receive warnings at 30, 14, and 7 days before inactivity activation</li>
      <li>• <strong>Easy Reset:</strong> Simply log in to reset the inactivity timer</li>
      <li>• <strong>Emergency Contacts:</strong> Choose trusted contacts who understand the system</li>
    </ul>
  </div>
  
  <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
    <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">✅ What Recipients Receive</h4>
    <ul class="text-gray-700 dark:text-gray-300 space-y-2">
      <li>• <strong>Personal Messages:</strong> All messages you've designated for them</li>
      <li>• <strong>Financial Information:</strong> Account details and instructions they're authorized to see</li>
      <li>• <strong>Balanze Data Export:</strong> Complete financial history from your Balanze account</li>
      <li>• <strong>Document Attachments:</strong> Any files you've uploaded to Last Wish</li>
      <li>• <strong>Contact Information:</strong> Details for other recipients (if you've allowed it)</li>
    </ul>
  </div>
</div>

<div id="pro-tips" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Pro Tips</h2>
  
  <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
    <ul class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Start with basic financial info, then add personal messages</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Always have backup recipients for critical information</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Test the system regularly with trusted contacts</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Update information quarterly or after major life events</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Don't use work email addresses for recipients</span>
      </li>
    </ul>
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


<div class="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-8 rounded-xl mb-8">
  <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">🏆 Congratulations on Setting Up Last Wish!</h3>
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-4">
    You've taken an important step in ensuring your financial legacy is protected and your loved ones are taken care of. Last Wish provides peace of mind knowing that your important information will reach the right people when needed.
  </p>
  <p class="text-gray-700 dark:text-gray-300">
    <strong>Remember:</strong> Review and update your Last Wish regularly to ensure all information remains current and accurate. Your future self and your loved ones will thank you for this thoughtful preparation.
  </p>
</div>`
  },
  'create-first-transaction': {
    slug: 'create-first-transaction',
    title: 'How to Create Your First Transaction',
    description: 'Step-by-step guide to adding your first income and expense transactions',
    category: 'Transactions',
    tags: ['transactions', 'income', 'expenses', 'beginner'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '4 min read',
    author: 'Balanze Team',
    tableOfContents: [
      {
        id: 'add-first-transaction',
        title: 'Add Your First Transaction',
        level: 1
      },
      {
        id: 'explore-dashboard',
        title: 'Explore Your Dashboard',
        level: 1
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
      }
    ],
    content: `
<div id="add-first-transaction" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Add Your First Transaction</h2>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Now that you have your accounts set up, it's time to add your first transaction. This will help you start tracking your income and expenses.
    </p>
    
    <div class="space-y-4 text-gray-700 dark:text-gray-300">
      <div class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">1</span>
        <div>
          <span>Go to <strong>"Transactions"</strong> in the sidebar</span>
          <img src="/add_transaction_1.png" alt="Screenshot showing the "Transactions" button highlighted in the Balanze sidebar" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>
      <div class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">2</span>
        <div>
          <span>Click <strong>"Add Transaction"</strong></span>
          <img src="/add_transaction_2.png" alt="Screenshot showing the "Add Transaction" button" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>
      <div class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">3</span>
        <div>
          <span>Fill in the transaction details:</span>
          <ul class="mt-2 ml-4 space-y-2">
          <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Account</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Type: Income or Expense</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Purchase Type: Regular Expense or 
                <span class="relative group inline-block">
                  <span class="underline decoration-dotted cursor-pointer text-blue-600 dark:text-blue-400" tabIndex={0}>
                    Purchase
                    <span class="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm rounded-lg shadow-lg px-4 py-3 z-20 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 delay-300 hover:opacity-100 pointer-events-auto">
                      A <strong>Purchase</strong> in Balanze is a special transaction type that helps you track planned purchases and manage your spending goals. It allows you to set aside money for specific items and track your progress toward buying them.
                      <br><br>
                      <a href="/kb/how-to-make-your-first-purchase" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">Learn how to make your first purchase →</a>
                    </span>
                  </span>
                </span>
              </span>
            </li>
            
            
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Category (You can set it up in the settings)</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Amount</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Description (optional)</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Date(Today by default)</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">4</span>
        <div>
          <span>Click the <strong>"Make Transaction"</strong> button to save your transaction</span>
          <img src="/add_transaction_3.png" alt="Screenshot showing the "Make Transaction" button" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>
    </div>
  </div>
</div>

<div id="explore-dashboard" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Explore Your Dashboard</h2>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      After adding your first transaction, return to the dashboard to see how your financial data is displayed:
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

<div id="pro-tips" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Pro Tips</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">Use Categories Consistently</h4>
      <p class="text-gray-700 dark:text-gray-300">Choose the same categories for similar transactions - this helps you track spending patterns and create accurate reports</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">Add Descriptions</h4>
      <p class="text-gray-700 dark:text-gray-300">Include brief descriptions for your transactions - they help you remember what each transaction was for months later</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3">Check Your Balances</h4>
      <p class="text-gray-700 dark:text-gray-300">After adding transactions, verify that your account balances are updated correctly in the dashboard</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-orange-900 dark:text-orange-300 mb-3">Start with Recent Transactions</h4>
      <p class="text-gray-700 dark:text-gray-300">Begin by adding your most recent transactions first - this gives you an immediate view of your current financial activity</p>
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
`,
    relatedArticles: ['create-first-account', 'transaction-management', 'analytics-dashboard']
  },
  'how-to-make-your-first-purchase': {
    slug: 'how-to-make-your-first-purchase',
    title: 'How to Make Your First Purchase',
    description: 'Learn how to use the Purchase feature to track planned purchases and manage your spending goals',
    category: 'Transactions',
    tags: ['purchase', 'spending', 'goals', 'transactions'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '5 min read',
    author: 'Balanze Team',
    tableOfContents: [
      {
        id: 'what-is-purchase',
        title: 'What is a Purchase?',
        level: 1
      },
      {
        id: 'creating-purchase',
        title: 'Creating Your First Purchase',
        level: 1
      },
      {
        id: 'tracking-progress',
        title: 'Tracking Purchase Progress',
        level: 1
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
      }
    ],
    content: `
<div id="what-is-purchase" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">What is a Purchase?</h2>
  
  <div class="mb-8">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      A <strong>Purchase</strong> in Balanze is a special transaction type designed to help you plan and track your spending goals. Unlike regular expenses, purchases allow you to set aside money for specific items and monitor your progress toward buying them.
    </p>
    
    <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 my-8 rounded-r-lg">
      <p class="text-gray-700 dark:text-gray-300 font-medium text-lg leading-relaxed">
        <strong class="text-blue-600 dark:text-blue-400">Perfect for planned purchases!</strong> Use this feature for items like electronics, furniture, vacations, or any significant purchase you want to save up for.
      </p>
    </div>
    
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Key Benefits:</h3>
    <ul class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Set specific savings goals for items you want to buy</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Track your progress toward each purchase goal</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Visualize how much you've saved vs. how much you need</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Stay motivated with clear savings targets</span>
      </li>
    </ul>
  </div>
</div>

<div id="creating-purchase" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Creating Your First Purchase</h2>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      You can create purchase records following two methods:
    </p>
    
    <div class="mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Method 1: Using the Transactions Form</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        By selecting the purchase category in the transactions form when adding a new transaction. You can refer to this <a href="/kb/how-to-create-your-first-transaction" class="text-blue-600 dark:text-blue-400 hover:underline">article</a> for more details.
        <img src="/add_purchase_1.png" alt="Screenshot showing the "Purchase" options in the transactions form" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
      </p>
    </div>
    
    <div class="mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Method 2: Using the Purchase Page</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        By going to the purchase page and using the dedicated purchase form.
      </p>
    </div>
    
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Follow these steps to create your first purchase goal using Method 2:
    </p>
    
    <div class="space-y-4 text-gray-700 dark:text-gray-300">
      <div class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">1</span>
        <div>
          <span>Go to <strong>"Purchases"</strong> in the sidebar</span>
          <img src="/add_purchase_3.png" alt="Screenshot showing the "Transactions" button highlighted in the Balanze sidebar" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>
      <div class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">2</span>
        <div>
          <span>Click <strong>"Add Purchase"</strong></span>
          <img src="/add_purchase_2.png" alt="Screenshot showing the "Transactions" button highlighted in the Balanze sidebar" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>
      <div class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">3</span>
        <div>
          <span>Fill in the purchase details:</span>
          <ul class="mt-2 ml-4 space-y-2">
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Item name (e.g., "New Laptop", "Vacation to Europe")</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Status <strong> (e.g., "Planned", "Purchased")</strong></span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Select the account</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Select category (same as the category in the transactions form)</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Amount (how much the item costs)</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Account to save from</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Date (when you want to buy it or bought it)</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Description (optional notes, you can attach invoices or receipts)</span>
            </li>
          </ul>
        </div>
      </div>
      <div class="flex items-start mt-6">
  <span class="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">4</span>
  <div>
    <span>
      <strong>Exclude from account balance calculation</strong>
      <span class="ml-2 inline-block align-middle">
        <svg class="inline w-5 h-5 text-yellow-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="10" />
        </svg>
      </span>
    </span>
    <div class="mt-2 text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
      <p>
        <strong>Check this option if the purchase was already made without using any existing account.</strong><br />
        This will <span class="font-semibold text-yellow-700 dark:text-yellow-300">not create a transaction record or affect your account balance</span>.
      </p>
    </div>
    <img 
      src="/purchase_exclude_balance_highlighted.png" 
      alt="Screenshot highlighting the 'Exclude from account balance calculation' setting in the purchase form" 
      class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0 border-2 border-yellow-400"
      style={{ marginLeft: 0 }}
    />
  </div>
</div>
    </div>
  </div>
</div>

<div id="tracking-progress" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Tracking Purchase Progress</h2>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Once you've created a purchase goal, you can track your progress:
    </p>
    
    <ul class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>View your purchase goals in the dashboard</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>See progress bars showing how much you've saved</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>Add money to your purchase goals with regular transactions</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>Get notifications when you reach your target amount</span>
      </li>
    </ul>
  </div>
</div>

<div id="pro-tips" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Pro Tips</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">Set Realistic Goals</h4>
      <p class="text-gray-700 dark:text-gray-300">Choose target amounts and dates that are achievable based on your income and expenses</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">Use Descriptive Names</h4>
      <p class="text-gray-700 dark:text-gray-300">Give your purchases clear, specific names like "MacBook Pro 16-inch" instead of just "laptop"</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3">Regular Contributions</h4>
      <p class="text-gray-700 dark:text-gray-300">Add money to your purchase goals regularly - even small amounts add up over time</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-orange-900 dark:text-orange-300 mb-3">Track Multiple Goals</h4>
      <p class="text-gray-700 dark:text-gray-300">Create separate purchase goals for different items to prioritize your spending</p>
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
`,
    relatedArticles: ['create-first-transaction', 'transaction-management', 'analytics-dashboard']
  },
  'how-to-create-lent-borrow-records': {
    slug: 'how-to-create-lent-borrow-records',
    title: 'How to Create Lent & Borrow Records',
    description: 'Learn how to track money you lend to others and money you borrow from others',
    category: 'Premium Features',
    tags: ['lent', 'borrow', 'loans', 'transactions', 'debt', 'premium'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '5 min read',
    author: 'Balanze Team',
    tableOfContents: [
      {
        id: 'what-is-lent-borrow',
        title: 'What are Lent & Borrow Records?',
        level: 1
      },
      {
        id: 'creating-lent-borrow',
        title: 'Creating Your First Lent & Borrow Record',
        level: 1
      },
      {
        id: 'tracking-repayments',
        title: 'Tracking Repayments',
        level: 1
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
      }
    ],
    content: `
<div id="what-is-lent-borrow" class="mb-12">
  <div class="mb-6">
    <span class="inline-block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 font-semibold px-4 py-2 rounded-lg text-base shadow-sm">
      <svg class="inline-block w-5 h-5 mr-2 -mt-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.93 12.412a.75.75 0 01-1.86 0l-.7-2.8a.75.75 0 01.72-.962h2.82a.75.75 0 01.72.962l-.7 2.8zm-.93-4.162a1 1 0 110-2 1 1 0 010 2z"/>
      </svg>
      <strong>Premium Feature:</strong> Lent & Borrow Records are available on <span class="font-bold">Balanze Premium</span>. Upgrade to unlock this feature and manage your personal loans with ease!
    </span>
  </div>

  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">What are Lent & Borrow Records?</h2>
  
  <div class="mb-8">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      <strong>Lent & Borrow Records</strong> in Balanze help you track money you lend to others and money you borrow from others. This feature is essential for managing personal loans, informal lending, and keeping track of who owes you money or who you owe money to.
    </p>
    
    <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 my-8 rounded-r-lg">
      <p class="text-gray-700 dark:text-gray-300 font-medium text-lg leading-relaxed">
        <strong class="text-blue-600 dark:text-blue-400">Perfect for personal finance tracking!</strong> Use this feature for loans to friends, family borrowing, informal lending, or any money exchanges that need to be tracked separately from regular transactions.
      </p>
    </div>
    
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Key Benefits:</h3>
    <ul class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Track money you lend to friends, family, or others</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Monitor money you borrow from others</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Record partial and full repayments</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Keep detailed records of loan terms and conditions</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Generate reports on your lending and borrowing activity</span>
      </li>
    </ul>
  </div>
</div>

<div id="creating-lent-borrow" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Creating Your First Lent & Borrow Record</h2>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      You can create lent & borrow records following two methods:
    </p>
    
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Follow these steps to create your first lent & borrow record:
    </p>
    
    <div class="space-y-4 text-gray-700 dark:text-gray-300">
      <div class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">1</span>
        <div>
          <span>Go to <strong>"Lent & Borrow"</strong> in the sidebar</span>
          <img src="/add_lent_borrow_3.png" alt="Screenshot showing the "Lent & Borrow" button highlighted in the Balanze sidebar" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>
      <div class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">2</span>
        <div>
          <span>Click <strong>"Add Lent/Borrow Record"</strong></span>
          <img src="/add_lent_borrow_2.png" alt="Screenshot showing the "Add Lent/Borrow Record" button" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>
      <div class="flex items-start">
        <span class="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">3</span>
        <div>
          <span>Fill in the lent/borrow details:</span>
          <ul class="mt-2 ml-4 space-y-2">
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Type: <strong>Lent</strong> (you lent money) or <strong>Borrowed</strong> (you borrowed money)</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Person/Entity name (who you lent to or borrowed from)</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Amount (how much was lent or borrowed)</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Select curency</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Due date (when it should be repaid)</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2">•</span>
              <span>Description (optional notes about the loan terms)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

<div id="tracking-repayments" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Tracking Repayments</h2>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Once you've created a lent or borrow record, you can track repayments:
    </p>
    
    <ul class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>View all your lent and borrowed amounts in the dashboard</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>Record partial repayments as they happen</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>Track remaining balances for each loan</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>Get reminders for upcoming due dates</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>Mark loans as fully repaid when completed</span>
      </li>
    </ul>
  </div>
</div>

<div id="pro-tips" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Pro Tips</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">Set Clear Terms</h4>
      <p class="text-gray-700 dark:text-gray-300">Always include due dates, and repayment terms in the description to avoid confusion later</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">Use Descriptive Names</h4>
      <p class="text-gray-700 dark:text-gray-300">Include the person's name and purpose in the description, like "John - Car repair loan" or "Sarah - Emergency fund"</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3">Track Regularly</h4>
      <p class="text-gray-700 dark:text-gray-300">Update repayment records promptly to maintain accurate balances and avoid forgetting about loans</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-orange-900 dark:text-orange-300 mb-3">Separate Personal and Business</h4>
      <p class="text-gray-700 dark:text-gray-300">Use different categories or descriptions to distinguish between personal loans to friends and business lending</p>
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
`,
    relatedArticles: ['create-first-transaction', 'how-to-make-your-first-purchase', 'transaction-management']
  },
  'analytics-dashboard': {
    slug: 'analytics-dashboard',
    title: 'Understanding Your Financial Analytics Dashboard',
    description: 'Comprehensive guide to all analytics features including main dashboard, purchase analytics, and lent-borrow analytics',
    category: 'Analytics',
    tags: ['analytics', 'dashboard', 'reports', 'insights', 'charts', 'purchases', 'lent-borrow'],
    difficulty: 'intermediate',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '12 min read',
    author: 'Balanze Team',
    tableOfContents: [
      {
        id: 'overview',
        title: 'Analytics Overview',
        level: 1
      },
      {
        id: 'main-analytics',
        title: 'Main Analytics Dashboard',
        level: 1,
        children: [
          {
            id: 'monthly-trends',
            title: '- Monthly Trends Chart',
            level: 2
          },
          {
            id: 'kpi-cards',
            title: '- KPI Cards & Gauges',
            level: 2
          },
          {
            id: 'smart-recommendations',
            title: '- Smart Recommendations',
            level: 2
          }
        ]
      },
      {
        id: 'purchase-analytics',
        title: 'Purchase Analytics',
        level: 1,
        children: [
          {
            id: 'purchase-kpis',
            title: '- Purchase KPIs',
            level: 2
          },
          {
            id: 'spending-trends',
            title: '- Spending Trends',
            level: 2
          },
          {
            id: 'category-breakdown',
            title: '- Category Breakdown',
            level: 2
          }
        ]
      },
      {
        id: 'lent-borrow-analytics',
        title: 'Lent & Borrow Analytics',
        level: 1,
        children: [
          {
            id: 'loan-overview',
            title: '- Loan Overview',
            level: 2
          },
          {
            id: 'aging-analysis',
            title: '- Aging Analysis',
            level: 2
          },
          {
            id: 'due-date-tracking',
            title: '- Due Date Tracking',
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
      }
    ],
    content: `
<div id="overview" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Analytics Overview</h2>
  
  <div class="mb-8">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Balanze's analytics dashboard provides comprehensive insights into your financial behavior through three specialized analytics pages. Each page offers unique perspectives on different aspects of your financial life, helping you make informed decisions and track your progress toward financial goals.
    </p>
    
    <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 my-8 rounded-r-lg">
      <p class="text-gray-700 dark:text-gray-300 font-medium text-lg leading-relaxed">
        <strong class="text-blue-600 dark:text-blue-400">Three Analytics Pages:</strong> Main Analytics, Purchase Analytics, and Lent & Borrow Analytics each provide specialized insights tailored to different financial activities.
      </p>
    </div>
    
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Available Analytics Pages:</h3>
    <ul class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span><strong>Main Analytics</strong> - Overall financial health, trends, and smart recommendations</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span><strong>Purchase Analytics</strong> - Detailed insights into your purchase behavior and spending patterns</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span><strong>Lent & Borrow Analytics</strong> - Track loans, lending activity, and repayment schedules</span>
      </li>
    </ul>
  </div>
</div>

<div id="main-analytics" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Main Analytics Dashboard</h2>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      The main analytics dashboard provides a comprehensive overview of your financial health. Access it by navigating to <strong>Analytics</strong> in the sidebar.
    </p>
    
    <div id="monthly-trends" class="mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Monthly Trends Chart</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        The monthly trends chart shows your financial progress over time with:
      </p>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-2">•</span>
          <span>Income and expense trends over multiple months</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-2">•</span>
          <span>Net cash flow visualization</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-2">•</span>
          <span>Period selection (Current Month, Last 3/6/12 Months)</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-2">•</span>
          <span>Currency-specific analysis</span>
        </li>
      </ul>
      <img src="/monthly-trends-chart.png" alt="Monthly Trends Chart showing income, expenses, and net cash flow over time" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg mt-6" />
    </div>
    
    <div id="kpi-cards" class="mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">KPI Cards & Gauges</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        Four key performance indicators provide instant insights:
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Net Cash Flow Gauge</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Visual gauge showing your monthly income vs expenses with color-coded indicators for positive/negative cash flow.</p>
        </div>
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Spending by Category</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Donut chart breaking down your expenses by category with percentages and amounts.</p>
        </div>
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Debt Payoff Progress</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Progress bar showing your debt reduction journey with completion percentage and remaining balance.</p>
        </div>
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Savings Goal Thermometer</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Visual thermometer showing progress toward your savings goals with projection estimates.</p>
        </div>
      </div>
      <img src="/kpi-cards-gauges.png" alt="KPI Cards showing Net Cash Flow Gauge and Spending by Category donut chart" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg mt-6" />
    </div>
    
    <div id="smart-recommendations" class="mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Smart Recommendations</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        AI-powered recommendations based on your financial patterns:
      </p>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
        <li class="flex items-start">
          <span class="text-purple-600 dark:text-purple-400 mr-2">•</span>
          <span>Budget optimization suggestions</span>
        </li>
        <li class="flex items-start">
          <span class="text-purple-600 dark:text-purple-400 mr-2">•</span>
          <span>Savings opportunities identification</span>
        </li>
        <li class="flex items-start">
          <span class="text-purple-600 dark:text-purple-400 mr-2">•</span>
          <span>Spending pattern alerts</span>
        </li>
        <li class="flex items-start">
          <span class="text-purple-600 dark:text-purple-400 mr-2">•</span>
          <span>Goal achievement strategies</span>
        </li>
      </ul>
      <img src="/smart-recommendations-insights.png" alt="Smart Recommendations and Insights & Alerts showing financial health status and positive insights" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg mt-6" />
    </div>
  </div>
</div>

<div id="purchase-analytics" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Purchase Analytics</h2>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Purchase Analytics provides detailed insights into your purchase behavior and spending patterns. Access it by navigating to <strong>Purchase Analytics</strong> in the sidebar.
    </p>
    
    <div id="purchase-kpis" class="mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Purchase KPIs</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        Key performance indicators for your purchase activity:
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Total Purchases</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Total amount spent on planned purchases in the selected period.</p>
        </div>
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Average Purchase</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Average amount per purchase to understand your spending patterns.</p>
        </div>
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Purchase Frequency</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">How often you make purchases to identify spending habits.</p>
        </div>
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Goal Completion</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Percentage of purchase goals completed vs planned.</p>
        </div>
      </div>
      <img src="/purchase-analytics-kpis.png" alt="Purchase Analytics KPI Cards showing Total Spent, Budget Utilization, Purchase Count, and Average Purchase" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg mt-6" />
    </div>
    
    <div id="spending-trends" class="mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Spending Trends</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        Visual analysis of your purchase spending over time:
      </p>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
        <li class="flex items-start">
          <span class="text-orange-600 dark:text-orange-400 mr-2">•</span>
          <span>Monthly spending trends with line charts</span>
        </li>
        <li class="flex items-start">
          <span class="text-orange-600 dark:text-orange-400 mr-2">•</span>
          <span>Seasonal spending pattern identification</span>
        </li>
        <li class="flex items-start">
          <span class="text-orange-600 dark:text-orange-400 mr-2">•</span>
          <span>Budget vs actual spending comparison</span>
        </li>
        <li class="flex items-start">
          <span class="text-orange-600 dark:text-orange-400 mr-2">•</span>
          <span>Spending velocity analysis</span>
        </li>
      </ul>
      <img src="/purchase-analytics-trends-breakdown.png" alt="Purchase Analytics showing Spending Trend over 12 months and Category Breakdown donut chart" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg mt-6" />
    </div>
    
    <div id="category-breakdown" class="mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        Detailed analysis of your purchases by category:
      </p>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
        <li class="flex items-start">
          <span class="text-red-600 dark:text-red-400 mr-2">•</span>
          <span>Category-wise spending distribution</span>
        </li>
        <li class="flex items-start">
          <span class="text-red-600 dark:text-red-400 mr-2">•</span>
          <span>Top spending categories identification</span>
        </li>
        <li class="flex items-start">
          <span class="text-red-600 dark:text-red-400 mr-2">•</span>
          <span>Category performance over time</span>
        </li>
        <li class="flex items-start">
          <span class="text-red-600 dark:text-red-400 mr-2">•</span>
          <span>Budget allocation vs actual spending</span>
        </li>
      </ul>
    </div>
  </div>
</div>

<div id="lent-borrow-analytics" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Lent & Borrow Analytics</h2>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Lent & Borrow Analytics provides comprehensive insights into your lending and borrowing activity. Access it by navigating to <strong>Lent & Borrow Analytics</strong> in the sidebar.
    </p>
    
    <div id="loan-overview" class="mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Loan Overview</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        Key metrics for your lending and borrowing activity:
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Total Lent Out</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Total amount you've lent to others with active loan count.</p>
        </div>
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Total Borrowed</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Total amount you've borrowed from others with active loan count.</p>
        </div>
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Outstanding Lent</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Amount still owed to you from active loans.</p>
        </div>
        <div class="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Outstanding Borrowed</h4>
          <p class="text-sm text-gray-600 dark:text-gray-300">Amount you still owe to others from active loans.</p>
        </div>
      </div>
      <img src="/lent-borrow-overview-cards.png" alt="Lent & Borrow Overview Cards showing Total Lent Out, Total Borrowed, Net Position, and Overdue Loans" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg mt-6" />
    </div>
    
    <div id="aging-analysis" class="mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Aging Analysis</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        Track loan aging to identify overdue payments:
      </p>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-2">•</span>
          <span><strong>0-30 days:</strong> Recently due loans (green indicator)</span>
        </li>
        <li class="flex items-start">
          <span class="text-yellow-600 dark:text-yellow-400 mr-2">•</span>
          <span><strong>31-60 days:</strong> Moderately overdue loans (yellow indicator)</span>
        </li>
        <li class="flex items-start">
          <span class="text-red-600 dark:text-red-400 mr-2">•</span>
          <span><strong>61+ days:</strong> Severely overdue loans (red indicator)</span>
        </li>
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-2">•</span>
          <span>Visual bar chart showing distribution across age groups</span>
        </li>
      </ul>
      <img src="/loan-aging-analysis-trophy-case.png" alt="Loan Aging Analysis bar chart and Trophy Case showing achievements like Loan Round-Trip, Super Lender, Quick Settler, and Trust Builder" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg mt-6" />
    </div>
    
    <div id="due-date-tracking" class="mb-8">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Due Date Tracking</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        Monitor upcoming and overdue payments:
      </p>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
        <li class="flex items-start">
          <span class="text-indigo-600 dark:text-indigo-400 mr-2">•</span>
          <span>Upcoming due dates calendar view</span>
        </li>
        <li class="flex items-start">
          <span class="text-indigo-600 dark:text-indigo-400 mr-2">•</span>
          <span>Overdue payment alerts and notifications</span>
        </li>
        <li class="flex items-start">
          <span class="text-indigo-600 dark:text-indigo-400 mr-2">•</span>
          <span>Payment history tracking</span>
        </li>
        <li class="flex items-start">
          <span class="text-indigo-600 dark:text-indigo-400 mr-2">•</span>
          <span>Interest calculation for overdue amounts</span>
        </li>
      </ul>
      <img src="/upcoming-due-dates.png" alt="Upcoming Due Dates section showing five cards with lent/borrow items, amounts, and due dates" class="w-full max-w-4xl mx-auto rounded-lg shadow-lg mt-6" />
    </div>
  </div>
</div>

<div id="pro-tips" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Pro Tips</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">Regular Analytics Review</h4>
      <p class="text-gray-700 dark:text-gray-300">Check your analytics weekly to identify spending patterns and make timely adjustments to your financial strategy</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">Use Multiple Time Periods</h4>
      <p class="text-gray-700 dark:text-gray-300">Compare different time periods (3, 6, 12 months) to identify seasonal trends and long-term patterns</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3">Currency-Specific Analysis</h4>
      <p class="text-gray-700 dark:text-gray-300">Use the currency selector to analyze spending patterns in different currencies for better international financial management</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-orange-900 dark:text-orange-300 mb-3">Export for External Analysis</h4>
      <p class="text-gray-700 dark:text-gray-300">Use the export feature to download your analytics data for external analysis or sharing with financial advisors</p>
    </div>
    <div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-red-900 dark:text-red-300 mb-3">Monitor Loan Aging</h4>
      <p class="text-gray-700 dark:text-gray-300">Regularly check the aging analysis in lent-borrow analytics to identify overdue payments and maintain healthy lending relationships</p>
    </div>
    <div class="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Set Up Alerts</h4>
      <p class="text-gray-700 dark:text-gray-300">Use the smart recommendations and alerts to stay informed about important financial milestones and potential issues</p>
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
`,
    relatedArticles: ['create-first-transaction', 'how-to-make-your-first-purchase', 'how-to-create-lent-borrow-records']
  },
  'how-to-create-your-first-transfer': {
    slug: 'how-to-create-your-first-transfer',
    title: 'How to Create Your First Transfer',
    description: 'Complete guide to understanding and creating transfers between accounts, including Currency Transfer, DPS Transfer, and In-between Transfer',
    category: 'Transfers',
    tags: ['transfers', 'currency', 'dps', 'accounts', 'beginner'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '8 min read',
    author: 'Balanze Team',
    tableOfContents: [
      {
        id: 'what-are-transfers',
        title: 'What are Transfers?',
        level: 1
      },
      {
        id: 'transfer-types',
        title: 'Types of Transfers',
        level: 1,
        children: [
          {
            id: 'currency-transfer',
            title: '- Currency Transfer',
            level: 2
          },
          {
            id: 'dps-transfer',
            title: '- DPS Transfer',
            level: 2
          },
          {
            id: 'in-between-transfer',
            title: '- In-between Transfer',
            level: 2
          }
        ]
      },
      {
        id: 'creating-first-transfer',
        title: 'Creating Your First Transfer',
        level: 1
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
      }
    ],
    content: `
<div id="what-are-transfers" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">What are Transfers?</h2>
  
  <div class="mb-8">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      <strong>Transfers</strong> in Balanze are transactions that move money between your accounts without creating new income or expenses. They help you maintain accurate account balances while tracking money movement across your financial ecosystem.
    </p>
    
    <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 my-8 rounded-r-lg">
      <p class="text-gray-700 dark:text-gray-300 font-medium text-lg leading-relaxed">
        <strong class="text-blue-600 dark:text-blue-400">Essential for accurate tracking!</strong> Transfers ensure your account balances reflect real-world money movements while keeping your income and expense reports clean and accurate.
      </p>
    </div>
    
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Why Use Transfers?</h3>
    <ul class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Move money between your accounts (checking to savings, cash to bank, etc.)</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Convert between different currencies with real exchange rates</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Automate savings through Daily Profit Sharing (DPS)</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Maintain accurate account balances without affecting income/expense reports</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Track money flow between different financial institutions</span>
      </li>
    </ul>
  </div>
</div>

<div id="transfer-types" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Types of Transfers</h2>
  
  <div class="mb-8">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Balanze offers three distinct transfer types, each designed for specific use cases. Understanding when to use each type will help you maintain accurate financial records.
    </p>
  </div>

  <div id="currency-transfer" class="mb-12">
    <div class="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-8 rounded-xl border border-blue-200 dark:border-blue-700">
      <div class="flex items-center mb-4">
        <div class="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-blue-900 dark:text-blue-100">Currency Transfer</h3>
      </div>
      
      <p class="text-lg text-blue-800 dark:text-blue-200 mb-4 leading-relaxed">
        <strong>Transfer between any accounts with exchange rates.</strong> Perfect for moving money between accounts that use different currencies.
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">When to Use:</h4>
          <ul class="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
            <li class="flex items-start">
              <span class="text-blue-600 dark:text-blue-400 mr-2 mt-1">•</span>
              <span>USD checking to EUR savings account</span>
            </li>
            <li class="flex items-start">
              <span class="text-blue-600 dark:text-blue-400 mr-2 mt-1">•</span>
              <span>Converting travel money between currencies</span>
            </li>
            <li class="flex items-start">
              <span class="text-blue-600 dark:text-blue-400 mr-2 mt-1">•</span>
              <span>International business transactions</span>
            </li>
            <li class="flex items-start">
              <span class="text-blue-600 dark:text-blue-400 mr-2 mt-1">•</span>
              <span>Multi-currency investment rebalancing</span>
            </li>
          </ul>
        </div>
        
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Key Features:</h4>
          <ul class="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
              <span>Real-time exchange rate calculation</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
              <span>Automatic currency conversion</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
              <span>Exchange rate history tracking</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
              <span>Multi-currency balance updates</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
        <p class="text-blue-800 dark:text-blue-200 text-sm">
          <strong>Example:</strong> Transfer $1,000 from your USD checking account to your EUR savings account. Balanze automatically converts at current exchange rates (e.g., $1,000 = €920) and updates both account balances accordingly.
        </p>
      </div>
      
      <div class="mt-6">
        <img src="/currency-transfer-modal.png" alt="Currency Transfer modal showing From Account, To Account, Amount, and Note fields with Transfer button" class="w-full max-w-md mx-auto rounded-lg shadow-lg" />
      </div>
    </div>
  </div>

  <div id="dps-transfer" class="mb-12">
    <div class="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-8 rounded-xl border border-purple-200 dark:border-purple-700">
      <div class="flex items-center mb-4">
        <div class="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-purple-900 dark:text-purple-100">DPS Transfer</h3>
      </div>
      
      <p class="text-lg text-purple-800 dark:text-purple-200 mb-4 leading-relaxed">
        <strong>Automatic savings transfers from DPS accounts.</strong> Streamlined transfers for accounts with Daily Profit Sharing enabled.
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">When to Use:</h4>
          <ul class="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
            <li class="flex items-start">
              <span class="text-purple-600 dark:text-purple-400 mr-2 mt-1">•</span>
              <span>Moving DPS savings to main account</span>
            </li>
            <li class="flex items-start">
              <span class="text-purple-600 dark:text-purple-400 mr-2 mt-1">•</span>
              <span>Consolidating automated savings</span>
            </li>
            <li class="flex items-start">
              <span class="text-purple-600 dark:text-purple-400 mr-2 mt-1">•</span>
              <span>Accessing accumulated DPS funds</span>
            </li>
            <li class="flex items-start">
              <span class="text-purple-600 dark:text-purple-400 mr-2 mt-1">•</span>
              <span>Reallocating DPS savings to investments</span>
            </li>
          </ul>
        </div>
        
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Key Features:</h4>
          <ul class="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
              <span>Pre-configured for DPS accounts</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
              <span>Maintains DPS tracking</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
              <span>Simplified transfer process</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
              <span>DPS balance preservation</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg">
        <p class="text-purple-800 dark:text-purple-200 text-sm">
          <strong>Example:</strong> Transfer $500 from your DPS-enabled savings account to your checking account. The transfer maintains your DPS settings while moving the accumulated savings to your main account for immediate use.
        </p>
      </div>
      
      <div class="mt-6">
        <img src="/dps-transfer-modal.png" alt="DPS Transfer modal showing DPS Account dropdown and Transfer button" class="w-full max-w-md mx-auto rounded-lg shadow-lg" />
      </div>
    </div>
  </div>

  <div id="in-between-transfer" class="mb-12">
    <div class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 p-8 rounded-xl border border-gray-200 dark:border-gray-600">
      <div class="flex items-center mb-4">
        <div class="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mr-4">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
          </svg>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">In-between Transfer</h3>
      </div>
      
      <p class="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
        <strong>Transfer between accounts within the same currency.</strong> The most common transfer type for moving money between accounts that use the same currency.
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">When to Use:</h4>
          <ul class="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
            <li class="flex items-start">
              <span class="text-gray-600 dark:text-gray-400 mr-2 mt-1">•</span>
              <span>Checking to savings account</span>
            </li>
            <li class="flex items-start">
              <span class="text-gray-600 dark:text-gray-400 mr-2 mt-1">•</span>
              <span>Cash to bank account deposit</span>
            </li>
            <li class="flex items-start">
              <span class="text-gray-600 dark:text-gray-400 mr-2 mt-1">•</span>
              <span>Credit card payment from checking</span>
            </li>
            <li class="flex items-start">
              <span class="text-gray-600 dark:text-gray-400 mr-2 mt-1">•</span>
              <span>Moving money between bank accounts</span>
            </li>
          </ul>
        </div>
        
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Key Features:</h4>
          <ul class="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
              <span>Same currency, no conversion needed</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
              <span>Instant balance updates</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
              <span>Simple 1:1 amount transfer</span>
            </li>
            <li class="flex items-start">
              <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
              <span>Most straightforward transfer type</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <p class="text-gray-700 dark:text-gray-300 text-sm">
          <strong>Example:</strong> Transfer $200 from your checking account to your savings account. Both accounts use USD, so the transfer is a simple $200 debit from checking and $200 credit to savings.
        </p>
      </div>
      
      <div class="mt-6">
        <img src="/in-between-transfer-modal.png" alt="In-between Transfer modal showing From Account, To Account, Amount, and Note fields with Transfer button" class="w-full max-w-md mx-auto rounded-lg shadow-lg" />
      </div>
    </div>
  </div>
</div>

<div id="creating-first-transfer" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Creating Your First Transfer</h2>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      Follow these step-by-step instructions to create your first transfer between accounts:
    </p>
    
    <div class="space-y-6 text-gray-700 dark:text-gray-300">
      <div class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0 flex-shrink-0">1</span>
        <div>
          <span class="font-semibold">Navigate to Transfers</span>
          <p class="text-gray-600 dark:text-gray-400 mt-1">Go to <strong>"Transfers"</strong> in the sidebar or click the transfer button from your dashboard.</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0 flex-shrink-0">2</span>
        <div>
          <span class="font-semibold">Click "Add Transfer"</span>
          <p class="text-gray-600 dark:text-gray-400 mt-1">Click the <strong>"Add Transfer"</strong> button to open the transfer creation form.</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0 flex-shrink-0">3</span>
        <div>
          <span class="font-semibold">Select Transfer Type</span>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Choose from the three transfer types based on your needs:
          </p>
          <div class="mt-6 flex flex-col items-center">
            <img
              src="/transfer_type.png"
              alt="Transfer type selection example"
              class="w-1/2 max-w-md rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
              id="transfer-type-image"
            /><br>
          </div>
        </div>
      </div>
      </div>
      
      <div class="flex items-start">
        <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0 flex-shrink-0">4</span>
        <div>
          <span class="font-semibold">Fill Transfer Details</span>
        </div>
      </div>
      
      <div class="flex items-start mt-6">
        <span class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-0 flex-shrink-0">5</span>
        <div>
          <span class="font-semibold">Review and Confirm</span>
          <p class="text-gray-600 dark:text-gray-400 mt-1">Review all details, especially exchange rates for currency transfers, then click <strong>"Create Transfer"</strong> to complete the transaction.</p>
        </div>
      </div>
    </div>
  </div>
</div>


<div id="pro-tips" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Pro Tips</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">Choose the Right Type</h4>
      <p class="text-gray-700 dark:text-gray-300">Currency transfers for different currencies, DPS transfers for automated savings, in-between transfers for same currency.</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">Add Clear Descriptions</h4>
      <p class="text-gray-700 dark:text-gray-300">Use descriptive notes like "Monthly savings" or "Credit card payment" to easily identify transfers later.</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3">Check Exchange Rates</h4>
      <p class="text-gray-700 dark:text-gray-300">For currency transfers, verify rates before large amounts as they change throughout the day.</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-orange-900 dark:text-orange-300 mb-3">Set Up Regular Transfers</h4>
      <p class="text-gray-700 dark:text-gray-300">Schedule recurring transfers for savings goals and bill payments to maintain consistent habits.</p>
    </div>
    <div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-red-900 dark:text-red-300 mb-3">Verify Balances</h4>
      <p class="text-gray-700 dark:text-gray-300">Always check that both account balances update correctly after creating transfers.</p>
    </div>
    <div class="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Use DPS Transfers</h4>
      <p class="text-gray-700 dark:text-gray-300">Access automated savings while preserving DPS tracking and analytics history.</p>
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
`,
    relatedArticles: ['create-first-account', 'create-first-transaction', 'analytics-dashboard']
  },
  'how-to-create-your-first-income-expense-category': {
    slug: 'how-to-create-your-first-income-expense-category',
    title: 'How to Create Your First Income/Expense Category',
    description: 'Complete guide to creating, customizing, and managing income and expense categories in Balanze',
    category: 'Getting Started',
    tags: ['categories', 'income', 'expense', 'organization', 'setup', 'beginner'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '8 min read',
    author: 'Balanze Team',
    relatedArticles: ['settings-page-comprehensive-guide', 'create-first-transaction', 'analytics-dashboard'],
    tableOfContents: [
      { id: 'overview', title: 'Understanding Categories', level: 1 },
      { id: 'why-categories-matter', title: 'Why Categories Matter', level: 1 },
      { id: 'accessing-categories', title: 'Accessing Categories', level: 1 },
      { id: 'creating-income-categories', title: 'Creating Income Categories', level: 1 },
      { id: 'creating-expense-categories', title: 'Creating Expense Categories', level: 1 },
      { id: 'managing-categories', title: 'Managing Your Categories', level: 1 },
      { id: 'pro-tips', title: 'Pro Tips', level: 1 },
      { id: 'need-help', title: 'Need Help?', level: 1 }
    ],
    content: `<div id="category-overview" class="mb-12">

  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    Categories are the foundation of effective financial tracking in Balanze. They help you organize your income and expenses, making it easier to understand where your money comes from and where it goes. This comprehensive guide will walk you through creating your first categories and establishing a solid organizational system.
  </p>

<div id="overview">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Understanding Categories</h2>
  </div>
  
  <div class="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-xl mb-8">
    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
      In Balanze, categories serve as labels that help you classify your financial transactions. There are two main types:
    </p>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
        <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center">
          <span class="mr-2">💰</span> Income Categories
        </h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm">
          Used to classify money coming into your accounts (salary, freelance work, investments, gifts, etc.). 
          <br />
          <span class="text-xs text-gray-500 dark:text-gray-400">
            <strong>Note:</strong> By default, income categories include <strong>Freelance</strong>, <strong>Investment</strong>, and <strong>Salary</strong>.
          </span>
        </p>
      </div>
      
      <div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
        <h4 class="font-semibold text-red-900 dark:text-red-300 mb-3 flex items-center">
          <span class="mr-2">💸</span> Expense Categories
        </h4>
        <p class="text-gray-700 dark:text-gray-300 text-sm">
          Used to classify money going out of your accounts (rent, food, utilities, entertainment, etc.)

        <br />
        <span class="text-xs text-gray-500 dark:text-gray-400">
          <strong>Note:</strong> By default, these will be expense categories, but will only appear if you click on <strong>Sync Categories</strong> and select a category such as <strong>Bills & Utilities</strong>, <strong>Donations</strong>, <strong>Entertainment</strong>, <strong>Food & Dining</strong>, <strong>Healthcare</strong>, <strong>Insurance</strong>, <strong>Rent & Housing</strong>, <strong>Shopping</strong>, <strong>Subscriptions</strong>, <strong>Transportation</strong></span>
        </p>
      </div>
    </div>
  </div>
</div>

<div id="why-categories-matter" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Why Categories Matter</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    Proper categorization is crucial for effective financial management. Here's why:
  </p>
  
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
      <div class="flex items-center mb-3">
        <span class="text-2xl mr-3">📊</span>
        <h4 class="font-semibold text-purple-900 dark:text-purple-300">Better Analytics</h4>
      </div>
      <p class="text-gray-700 dark:text-gray-300 text-sm">
        See exactly where your money goes with detailed breakdowns and trends
      </p>
    </div>
    
    <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl">
      <div class="flex items-center mb-3">
        <span class="text-2xl mr-3">🎯</span>
        <h4 class="font-semibold text-orange-900 dark:text-orange-300">Budget Tracking</h4>
      </div>
      <p class="text-gray-700 dark:text-gray-300 text-sm">
        Set and monitor budgets for specific categories to stay on track
      </p>
    </div>
    
    <div class="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-xl">
      <div class="flex items-center mb-3">
        <span class="text-2xl mr-3">🔍</span>
        <h4 class="font-semibold text-teal-900 dark:text-teal-300">Easy Search</h4>
      </div>
      <p class="text-gray-700 dark:text-gray-300 text-sm">
        Quickly find transactions by filtering by category
      </p>
    </div>
  </div>
</div>

<div id="accessing-categories" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Accessing Categories</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    To manage your categories, you'll need to access the Categories section in your Settings:
  </p>
  
  <div class="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl mb-6">
    <h4 class="font-semibold text-gray-900 dark:text-white mb-4">Step-by-Step Navigation:</h4>
    <ol class="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300">
      <li>Click on <strong>Settings</strong> on the sidebar</li>
      <li>Click on the <strong>"Categories"</strong> tab in the settings navigation</li>
      <li>You'll see your existing categories and options to create new ones</li>
    </ol>
  </div>
  
  <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-lg mb-6">
    <h4 class="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">💡 Quick Tip</h4>
    <p class="text-gray-700 dark:text-gray-300">
      You can also access categories while creating a transaction - there's a "+" button next to the category dropdown that lets you create categories on the fly!
    </p>
  </div>
</div>

<div id="creating-income-categories" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Creating Income Categories</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    Let's start by creating your first income category. Income categories help you track different sources of money coming into your accounts.
  </p>
  
  <div class="bg-green-50 dark:bg-green-900/20 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Creating Your First Income Category</h3>
    
    <div class="space-y-6">
      <div class="flex items-start">
        <div class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">1</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Navigate to Categories</h4>
          <p class="text-gray-700 dark:text-gray-300">Go to Settings → Categories tab</p>
          <img src="/navigate_to_categories.png" alt="Screenshot showing the "Categories" tab" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">2</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Click "Add Income Category"</h4>
          <p class="text-gray-700 dark:text-gray-300">Look for the "Add Category" button in the Income section</p>
          <img src="/add_income_category.png" alt="Screenshot showing the "Add Income Category" button" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>

      
      
      <div class="flex items-start">
        <div class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">3</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Fill in Category Details</h4>
          <ul class="text-gray-700 dark:text-gray-300 ml-4 space-y-1">
            <li><strong>Name:</strong> Choose a descriptive name (e.g., "Salary", "Freelance Work", "Investment Returns")</li>
            <li><strong>Description:</strong> Add optional details about what this category covers</li>
            <li><strong>Currency:</strong> Select the currency for this category</li>
            <li><strong>Color:</strong> Select a color to easily identify this category in charts and lists</li>
          </ul>
          <img src="/fill_in_category_details.png" alt="Screenshot showing the "Fill in Category Details" form" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-0 flex-shrink-0">4</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Save Your Category</h4>
          <p class="text-gray-700 dark:text-gray-300">Click "Add Category" to save your new income category</p>
        </div>
      </div>
    </div>
  </div>
</div>

<div id="creating-expense-categories" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Creating Expense Categories</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    Expense categories help you track where your money goes. These are typically more numerous than income categories since people spend money in many different ways.
  </p>
  
  <div class="bg-red-50 dark:bg-red-900/20 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Creating Your First Expense Category</h3>
    
    <div class="space-y-6">
      <div class="flex items-start">
        <div class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1 flex-shrink-0">1</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Navigate to Categories</h4>
          <p class="text-gray-700 dark:text-gray-300">Go to Settings → Categories tab, scroll to the Expense section</p>
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1 flex-shrink-0">2</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Click "Add Expense Category"</h4>
          <p class="text-gray-700 dark:text-gray-300">Look for the "Add Category" button in the Expense section</p>
          <img src="/add_expense_category.png" alt="Screenshot showing the "Add Expense Category" button" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1 flex-shrink-0">3</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Fill in Category Details</h4>
          <ul class="text-gray-700 dark:text-gray-300 ml-4 space-y-1">
            <li><strong>Name:</strong> Use clear, specific names (e.g., "Groceries", "Gas", "Netflix Subscription")</li>
            <li><strong>Description:</strong> Add details about what expenses this category includes</li>
            <li><strong>Monthly Budget:</strong> Set a monthly budget for this category</li>
            <li><strong>Currency:</strong> Select the currency for this category</li>
            <li><strong>Color:</strong> Choose a color that makes sense (red for bills, green for food, etc.)</li>
          </ul>
          <img src="/fill_in_category_details_1.png" alt="Screenshot showing the "Fill in Category Details" form" class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0" style={{ marginLeft: 0 }} />
        </div>
      </div>
      
      <div class="flex items-start">
        <div class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1 flex-shrink-0">4</div>
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Save Your Category</h4>
          <p class="text-gray-700 dark:text-gray-300">Click "Add Category" to save your new expense category</p>
        </div>
      </div>
    </div>
  </div>
</div>

<div id="managing-categories" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Managing Your Categories</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    Once you've created categories, you'll want to manage them effectively. Here's what you can do:
  </p>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">✏️ Edit Categories</h4>
      <p class="text-gray-700 dark:text-gray-300 text-sm mb-3">
        Click the edit button next to any category to modify its name, description, or color.
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Note: Editing affects all future transactions, not past ones.
      </p>
    </div>
    
    <div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-red-900 dark:text-red-300 mb-3">🗑️ Delete Categories</h4>
      <p class="text-gray-700 dark:text-gray-300 text-sm mb-3">
        Remove categories you no longer need by clicking the delete button.
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Warning: This will affect existing transactions using this category.
      </p>
    </div>
  </div>
  
  <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-lg">
    <h4 class="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">⚠️ Important Notes</h4>
    <ul class="text-gray-700 dark:text-gray-300 space-y-1 text-sm">
      <li>• Deleting a category will require you to reassign existing transactions to other categories</li>
      <li>• You can't delete a category if it's the only one of its type (income or expense)</li>
      <li>• Category changes sync across all your devices automatically</li>
    </ul>
  </div>
</div>

<div id="pro-tips" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Pro Tips</h2>
  
  <div class="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Advanced Category Management</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center">
          <span class="mr-2">🎯</span> Smart Naming
        </h4>
        <ul class="text-gray-700 dark:text-gray-300 text-sm space-y-2">
          <li>• Use consistent naming patterns (e.g., "Food - Groceries", "Food - Restaurants")</li>
          <li>• Include emojis for quick visual identification</li>
          <li>• Keep names short but descriptive</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
          <span class="mr-2">📊</span> Analytics Optimization
        </h4>
        <ul class="text-gray-700 dark:text-gray-300 text-sm space-y-2">
          <li>• Create categories that align with your financial goals</li>
          <li>• Use subcategories for detailed tracking</li>
          <li>• Regular review and consolidation</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center">
          <span class="mr-2">⚡</span> Efficiency Tips
        </h4>
        <ul class="text-gray-700 dark:text-gray-300 text-sm space-y-2">
          <li>• Create categories on-the-fly during transaction entry</li>
          <li>• Use color coding for quick recognition</li>
          <li>• Set up recurring transaction templates</li>
        </ul>
      </div>
      
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h4 class="font-semibold text-orange-900 dark:text-orange-300 mb-3 flex items-center">
          <span class="mr-2">🔄</span> Maintenance
        </h4>
        <ul class="text-gray-700 dark:text-gray-300 text-sm space-y-2">
          <li>• Monthly category review and cleanup</li>
          <li>• Merge similar categories regularly</li>
          <li>• Archive unused categories instead of deleting</li>
        </ul>
      </div>
    </div>
  </div>
  
  <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-lg">
    <h4 class="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">💡 Expert Insight</h4>
    <p class="text-gray-700 dark:text-gray-300">
      The most successful users start with 5-7 broad categories and gradually add more specific ones as they identify spending patterns. This approach prevents category overload while maintaining detailed insights.
    </p>
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

`
  },
  'donation-page-complete-guide': {
    slug: 'donation-page-complete-guide',
    title: 'Donation Page - Complete Guide',
    description: 'Comprehensive guide to understanding and using the Donation page feature for tracking charitable giving and savings goals',
    category: 'Transactions',
    tags: ['donations', 'charity', 'savings', 'transactions', 'giving', 'tracking'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '10 min read',
    author: 'Balanze Team',
    relatedArticles: ['create-first-transaction', 'transaction-management', 'how-to-make-your-first-purchase'],
    tableOfContents: [
      { id: 'overview', title: 'Donation Page Overview', level: 1 },
      { id: 'accessing-donations', title: 'Accessing the Donation Page', level: 1 },
      { 
        id: 'understanding-donations', 
        title: 'Understanding Donation Records', 
        level: 1,
        children: [
          { id: 'automatic-donations', title: '- Automatic Donations from Income', level: 2 },
          { id: 'manual-donations', title: '- Manual Donation Entry', level: 2 }
        ]
      },
      { id: 'donation-modes', title: 'Donation Modes Explained', level: 1 },
      { id: 'tracking-progress', title: 'Tracking Your Donation Progress', level: 1 },
      { id: 'filters-search', title: 'Using Filters and Search', level: 1 },
      { id: 'pro-tips', title: 'Pro Tips', level: 1 },
      { id: 'need-help', title: 'Need Help?', level: 1 }
    ],
    content: `<div id="overview" class="mb-12">
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    The Donation page in Balanze is a powerful feature that helps you track your charitable giving and savings goals. Whether you want to automatically donate a portion of your income or manually record donations, this comprehensive guide will show you how to make the most of this feature.
  </p>

  <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8">
    <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">What You'll Learn</h3>
    <ul class="space-y-2 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>How to access and navigate the Donation page</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Understanding automatic vs manual donations</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Setting up donation modes (fixed amount vs percentage)</span>
      </li>
      <li class="flex items-start">
        <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
        <span>Using filters, search, and analytics features</span>
      </li>
    </ul>
  </div>
</div>

<div id="accessing-donations" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Accessing the Donation Page</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    The Donation page is easily accessible from the main navigation. Here's how to get there:
  </p>

  <div class="space-y-4 text-gray-700 dark:text-gray-300">
    <div class="flex items-start">
      <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">1</span>
      <div>
        <span>Look for the <strong>"Donations"</strong> option in profile card</span>
        <img 
          src="/donation_nav.png" 
          alt='Screenshot showing the "Donations" option in the Balanze sidebar' 
          class="w-1/2 max-w-md rounded-lg shadow-lg mt-4 ml-0"
          style={{ marginLeft: 0 }}
        />
      </div>
    </div>
    <div class="flex items-start">
      <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">2</span>
      <span>Click on <strong>"Donations"</strong> to open the Donation page</span>
    </div>
    <div class="flex items-start">
      <span class="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">3</span>
      <span>You'll see the main Donation dashboard with your donation records and analytics</span>
    </div>
  </div>
</div>

<div id="understanding-donations" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Understanding Donation Records</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    Donation records in Balanze track your charitable giving and savings goals. Each record contains important information about your donation activity.
  </p>

  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Key Components of a Donation Record</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
          <div>
            <strong>Transaction ID:</strong> If started with F(link to the original transaction), if started with M(link to the manual donation)
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
          <div>
            <strong>Original Amount:</strong> The donation amount in your selected currency
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
          <div>
            <strong>Mode:</strong> Fixed amount or percentage-based donation
          </div>
        </div>
      </div>
      <div class="space-y-4">
        <div class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <div>
            <strong>Date:</strong> When the donation was created or scheduled
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <div>
            <strong>Donation Amount:</strong> The amount of the donation
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
          <div>
            <strong>Status:</strong> Pending (planned) or Donated (completed)
          </div>
        </div>
      </div>
    <div class="col-span-2 flex justify-center mt-6">
      <img
        src="/donation_record_example.png"
        alt="Example of a donation record in Balanze"
        class="w-full max-w-md rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      />
    </div>
    </div>
  </div>
</div>

<div id="automatic-donations" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Automatic Donations from Income</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    One of the most powerful features of Balanze's donation system is the ability to automatically create donation records when you receive income. This helps you maintain consistent charitable giving habits.
  </p>

  <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg mb-6">
    <h3 class="text-xl font-semibold text-green-900 dark:text-green-300 mb-4">How Automatic Donations Work</h3>
    <ol class="list-decimal ml-6 text-gray-700 dark:text-gray-300 space-y-2">
      <li>When you create an <strong>income transaction</strong>, you can set up donation preferences</li>
      <li>Choose between <strong>fixed amount</strong> or <strong>percentage</strong> donation mode</li>
      <li>Enter the donation amount or percentage you want to give</li>
      <li>Balanze automatically creates a donation record linked to that income transaction</li>
      <li>The donation record starts as "pending" and can be marked as "donated" when you actually make the donation</li>
    </ol>
  <div class="mt-6 flex flex-col items-center">
    <img
      src="/automatic_donations_example.png"
      alt="Example of automatic donation setup in income transaction"
      class="w-full max-w-md rounded-lg shadow-lg border border-green-200 dark:border-green-700"
    />
  </div>
  </div>

</div>

<div id="manual-donations" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Manual Donation Entry</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    Sometimes you want to record donations that aren't tied to specific income transactions. Balanze allows you to manually enter donation records for any charitable giving you do.
  </p>

  <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg mb-6">
    <h3 class="text-xl font-semibold text-purple-900 dark:text-purple-300 mb-4">When to Use Manual Donations</h3>
    <ul class="space-y-2 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>One-time charitable donations not tied to income</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>Donations from savings or other non-income sources</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>Retroactive recording of past donations</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">•</span>
        <span>Donations made in different currencies</span>
      </li>
    </ul>
  </div>

  <div class="space-y-4 text-gray-700 dark:text-gray-300">
    <div class="flex items-start">
      <span class="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">1</span>
      <div>
        <span>On the Donation page, click the <strong>"Quick Donate"</strong> button</span>
        <img 
          src="/manual_donation_button.png" 
          alt='Screenshot showing the "Add Manual Donation" button' 
          class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0"
          style={{ marginLeft: 0 }}
        />
      </div>
    </div>
    <div class="flex items-start">
      <span class="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">2</span>
      <span>Fill in the donation details:
        <ul class="mt-2 ml-4 space-y-1">
          <li class="flex items-start">
            <span class="text-purple-600 dark:text-purple-400 mr-2">•</span>
            <span><strong>Amount:</strong> The donation amount</span>
          </li>
          <li class="flex items-start">
            <span class="text-purple-600 dark:text-purple-400 mr-2">•</span>
            <span><strong>Currency:</strong> Select the appropriate currency</span>
          </li>
          <li class="flex items-start">
            <span class="text-purple-600 dark:text-purple-400 mr-2">•</span>
            <span><strong>Notes:</strong> Optional description of the donation</span>
          </li>
        </ul>
      </span>
      <img
        src="/manual_donation_form.png"
        alt='Screenshot showing the "Manual Donation" form'
        class="w-full max-w-md rounded-lg shadow-lg mt-4 ml-0"
        style={{ marginLeft: 0 }}
      />
    </div>
    <div class="flex items-start">
      <span class="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-4 mt-0">3</span>
      <span>Click <strong>"Save"</strong> to create the manual donation record</span>
    </div>
  </div>
</div>

<div id="donation-modes" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Donation Modes Explained</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    Balanze supports two different donation modes, each with its own advantages depending on your giving strategy.
  </p>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
      <h3 class="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-4">Fixed Amount Mode</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        Donate a specific amount regardless of your income level. This provides predictable giving amounts.
      </p>
      <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <div class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-2 mt-1">✓</span>
          <span>Predictable donation amounts</span>
        </div>
        <div class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-2 mt-1">✓</span>
          <span>Easy to budget for</span>
        </div>
        <div class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-2 mt-1">✓</span>
          <span>Good for consistent giving</span>
        </div>
      </div>
      <div class="mt-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded">
        <strong>Example:</strong> Always donate $100 from each paycheck
      </div>
    </div>

    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
      <h3 class="text-xl font-semibold text-green-900 dark:text-green-300 mb-4">Percentage Mode</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        Donate a percentage of your income, so your giving scales with your earnings.
      </p>
      <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        <div class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
          <span>Scales with income changes</span>
        </div>
        <div class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
          <span>Maintains giving ratio</span>
        </div>
        <div class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-2 mt-1">✓</span>
          <span>Flexible for varying income</span>
        </div>
      </div>
      <div class="mt-4 p-3 bg-green-100 dark:bg-green-800/30 rounded">
        <strong>Example:</strong> Donate 10% of all income received
      </div>
    </div>
  </div>
</div>

<div id="tracking-progress" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Tracking Your Donation Progress</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    The Donation page provides comprehensive tracking tools to help you monitor your charitable giving progress and stay on top of your donation goals.
  </p>

  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl mb-8">
    <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Key Tracking Features</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-4">
        <div class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <div>
            <strong>Donation Summary Cards:</strong> Quick overview of total donated, pending amounts, and recent activity
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <div>
            <strong>Status Tracking:</strong> Monitor which donations are pending vs. completed
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <div>
            <strong>Currency Breakdown:</strong> See donations by currency for multi-currency users
          </div>
        </div>
      </div>
      <div class="space-y-4">
        <div class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
          <div>
            <strong>Date Range Filtering:</strong> View donations by time periods (1 month, 3 months, etc.)
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
          <div>
            <strong>Mode Filtering:</strong> Filter by fixed amount or percentage donations
          </div>
        </div>
        <div class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
          <div>
            <strong>Export Options:</strong> Download donation data for tax purposes or record keeping
          </div>
        </div>
      </div>
    </div>
    <div class="mt-8 flex flex-col items-center">
      <img
        src="/donation_tracking_dashboard.png"
        alt="Screenshot of the Donation Tracking Dashboard"
        class="w-full max-w-2xl rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      />
    </div>
  </div>
</div>

<div id="filters-search" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Using Filters and Search</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    The Donation page includes powerful filtering and search capabilities to help you find specific donation records quickly.
  </p>

  <div class="space-y-6">
    <div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Filters</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-3">
          <div class="flex items-start">
            <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
            <div>
              <strong>Mode Filter:</strong> Show all, fixed amount, or percentage donations
            </div>
          </div>
          <div class="flex items-start">
            <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
            <div>
              <strong>Status Filter:</strong> View pending or completed donations
            </div>
          </div>
        </div>
        <div class="space-y-3">
          <div class="flex items-start">
            <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
            <div>
              <strong>Currency Filter:</strong> Filter by specific currencies
            </div>
          </div>
          <div class="flex items-start">
            <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
            <div>
              <strong>Date Range:</strong> 1 month, 3 months, 6 months, 1 year, or all time
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Search Functionality</h3>
      <p class="text-gray-700 dark:text-gray-300 mb-4">
        Use the search bar to find donations by:
      </p>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300">
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span>Transaction ID or custom transaction ID</span>
        </li>
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span>Donation amount</span>
        </li>
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span>Notes or descriptions</span>
        </li>
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span>Date information</span>
        </li>
      </ul>
    </div>
  </div>
    <div class="mt-8 flex flex-col items-center">
      <img
        src="/donation_filter.png"
        alt="Screenshot showing the donation list with filters and search"
        class="w-full max-w-2xl rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      />
    </div>
</div>

<div id="pro-tips" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Pro Tips</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-blue-900 dark:text-blue-300 mb-3">Set Up Automatic Donations</h4>
      <p class="text-gray-700 dark:text-gray-300">Enable donation tracking when creating income transactions to build consistent giving habits</p>
    </div>
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-green-900 dark:text-green-300 mb-3">Use Percentage Mode</h4>
      <p class="text-gray-700 dark:text-gray-300">Consider using percentage-based donations to maintain consistent giving ratios as your income changes</p>
    </div>
    <div class="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-purple-900 dark:text-purple-300 mb-3">Regular Status Updates</h4>
      <p class="text-gray-700 dark:text-gray-300">Mark donations as "donated" when you actually make the charitable contribution to keep accurate records</p>
    </div>
    <div class="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-orange-900 dark:text-orange-300 mb-3">Export for Taxes</h4>
      <p class="text-gray-700 dark:text-gray-300">Use the export feature to download donation records for tax deduction purposes</p>
    </div>
    <div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-red-900 dark:text-red-300 mb-3">Multi-Currency Support</h4>
      <p class="text-gray-700 dark:text-gray-300">Track donations in different currencies and use filters to view by specific currency</p>
    </div>
    <div class="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl">
      <h4 class="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Add Detailed Notes</h4>
      <p class="text-gray-700 dark:text-gray-300">Include notes about the charity or cause to maintain detailed records of your giving</p>
    </div>
  </div>
</div>

<div id="need-help" class="mb-12">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Need Help?</h2>
  
  <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-6 rounded-r-lg">
    <p class="text-gray-700 dark:text-gray-300 mb-4 font-medium">If you need additional assistance:</p>
    <ul class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-yellow-600 dark:text-yellow-400 mr-3 mt-1">•</span>
        <span>Use the search function in the help center to find related articles</span>
      </li>
      <li class="flex items-start">
        <span class="text-yellow-600 dark:text-yellow-400 mr-3 mt-1">•</span>
        <span>Check out our video tutorials for visual guidance</span>
      </li>
      <li class="flex items-start">
        <span class="text-yellow-600 dark:text-yellow-400 mr-3 mt-1">•</span>
        <span>Contact support at <a href="mailto:support@balanze.com" class="text-blue-600 dark:text-blue-400 hover:underline">support@balanze.com</a></span>
      </li>
      <li class="flex items-start">
        <span class="text-yellow-600 dark:text-yellow-400 mr-3 mt-1">•</span>
        <span>Join our community forum for tips and discussions</span>
      </li>
    </ul>
  </div>
</div>

`
  },
  'history-page-complete-guide': {
    slug: 'history-page-complete-guide',
    title: 'Activity History - Complete Guide',
    description: 'Comprehensive guide to understanding and using the Activity History page for tracking all your account activities and changes',
    category: 'Analytics',
    tags: ['history', 'activity', 'audit-trail', 'tracking', 'timeline', 'changes'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '4 min read',
    author: 'Balanze Team',
    relatedArticles: ['analytics-dashboard', 'getting-started-guide', 'create-first-transaction'],
    tableOfContents: [
      { id: 'features', title: 'Key Features', level: 1 },
      { id: 'activity-timeline', title: 'Activity Timeline', level: 1 },
      { id: 'filtering-options', title: 'Search & Filtering Options', level: 1 },
      { id: 'pro-tips', title: 'Pro Tips', level: 1 },
      { id: 'need-help', title: 'Need Help?', level: 1 }
    ],
    content: `<div id="history-overview" class="mb-12">

  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    The Activity History page in Balanze is your comprehensive audit trail, tracking every action you take across your financial data. From creating transactions to updating accounts, this powerful feature provides complete visibility into all changes and activities within your Balanze account.
  </p>

<img src="/activity_history_overview.png" alt="Balanze Activity History Page Overview" class="w-full max-w-3xl mx-auto rounded-lg shadow-lg mb-8" />

</div>

<div id="features" class="mb-12">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Key Features</h2>
  
  <div class="grid md:grid-cols-2 gap-8 mb-8">
    <div class="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">📊 Activity Statistics</h3>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300">
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">✓</span>
          <span>Total activities counter</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">✓</span>
          <span>Activity breakdown by type (Transactions, Purchases, Accounts, Transfers)</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">✓</span>
          <span>Today and This Week activity counts</span>
        </li>
      </ul>
    </div>
    
    <div class="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">🔍 Smart Filtering</h3>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300">
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">✓</span>
          <span>Filter by entity type (Transaction, Purchase, Account, Transfer)</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">✓</span>
          <span>Search across activity details and entity IDs</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">✓</span>
          <span>Date-grouped timeline view</span>
        </li>
      </ul>
    </div>
  </div>
</div>

<div id="activity-timeline" class="mb-12">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Activity Timeline</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    The activity timeline is organized by date, showing all your actions chronologically. Each activity entry shows what was changed, when, and provides detailed information about the operation.
  </p>

  <div class="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-xl mb-8">
    <h4 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Activity Types & Visual Indicators</h4>
    
    <div class="space-y-6">
      <div>
        <h5 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Activity Operations</h5>
        <ul class="space-y-2 text-gray-700 dark:text-gray-300">
          <li class="flex items-start">
            <span class="text-green-600 dark:text-green-400 mr-3 mt-1">+</span>
            <span><strong>CREATE</strong>: New items added (green background)</span>
          </li>
          <li class="flex items-start">
            <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">✏</span>
            <span><strong>UPDATE</strong>: Existing items modified (blue background)</span>
          </li>
          <li class="flex items-start">
            <span class="text-red-600 dark:text-red-400 mr-3 mt-1">🗑</span>
            <span><strong>DELETE</strong>: Items removed (red background)</span>
          </li>
        </ul>
      </div>
      
      <div>
        <h5 class="text-lg font-medium text-gray-900 dark:text-white mb-3">Entity Types</h5>
        <ul class="space-y-2 text-gray-700 dark:text-gray-300">
          <li class="flex items-start">
            <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">💳</span>
            <span><strong>Account</strong>: Bank accounts, credit cards, cash wallets</span>
          </li>
          <li class="flex items-start">
            <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">💰</span>
            <span><strong>Transaction</strong>: Income and expense records</span>
          </li>
          <li class="flex items-start">
            <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">🛍️</span>
            <span><strong>Purchase</strong>: Planned purchase tracking</span>
          </li>
          <li class="flex items-start">
            <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">📊</span>
            <span><strong>Transfer</strong>: Money movements between accounts</span>
          </li>
          <li class="flex items-start">
            <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">🎯</span>
            <span><strong>Savings Goal</strong>: Goal creation and updates</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>

<div id="filtering-options" class="mb-12">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Search & Filtering Options</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    The Activity History page provides powerful search and filtering capabilities to help you find specific activities quickly.
  </p>

  <div class="grid md:grid-cols-2 gap-8 mb-8">
    <div class="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Search Functionality</h3>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300">
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span>Search by entity ID or activity details</span>
        </li>
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span>Find specific activity types (CREATE, UPDATE, DELETE)</span>
        </li>
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span>Search within activity summaries and descriptions</span>
        </li>
      </ul>
    </div>
    
    <div class="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">Filter Options</h3>
      <ul class="space-y-2 text-gray-700 dark:text-gray-300">
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span><strong>All</strong>: Show all activity types</span>
        </li>
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span><strong>Transaction</strong>: Only transaction-related activities</span>
        </li>
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span><strong>Purchase</strong>: Only purchase-related activities</span>
        </li>
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span><strong>Account</strong>: Only account-related activities</span>
        </li>
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span><strong>Transfer</strong>: Only transfer-related activities</span>
        </li>
      </ul>
    </div>
  </div>

  <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svg class="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <div class="ml-3">
        <h3 class="text-lg font-medium text-yellow-800 dark:text-yellow-200">Pro Tip</h3>
        <p class="mt-1 text-yellow-700 dark:text-yellow-300">
          Use the search function to quickly find activities related to specific transactions or accounts. You can search by entity IDs, descriptions, or activity types to locate exactly what you're looking for.
        </p>
      </div>
    </div>
  </div>
</div>


<div id="pro-tips" class="mb-12">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pro Tips</h2>
  
  <div class="grid md:grid-cols-2 gap-8">
    <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl">
      <h3 class="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">💡 Navigation Tips</h3>
      <ul class="space-y-3 text-blue-800 dark:text-blue-200">
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span>Use the statistics cards at the top to get a quick overview of your activity levels</span>
        </li>
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span>Click on date headers to expand/collapse activity groups for better organization</span>
        </li>
        <li class="flex items-start">
          <span class="text-blue-600 dark:text-blue-400 mr-3 mt-1">•</span>
          <span>Toggle "Show Details" to see entity IDs and copy them for reference</span>
        </li>
      </ul>
    </div>
    
    <div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
      <h3 class="text-xl font-semibold text-green-900 dark:text-green-100 mb-4">🔍 Search & Filter Tips</h3>
      <ul class="space-y-3 text-green-800 dark:text-green-200">
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
          <span>Filter by specific entity types to focus on particular activities (transactions, purchases, etc.)</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
          <span>Use the search bar to find activities by entity ID, description, or activity type</span>
        </li>
        <li class="flex items-start">
          <span class="text-green-600 dark:text-green-400 mr-3 mt-1">•</span>
          <span>Export filtered results to CSV for external analysis or record-keeping</span>
        </li>
      </ul>
    </div>
  </div>
</div>
<div id="need-help" class="mb-12">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Need Help?</h2>
  
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

`
  },
  'quote-feature-comprehensive-guide': {
    slug: 'quote-feature-comprehensive-guide',
    title: 'Complete Guide to the Quote Feature',
    description: 'Comprehensive guide to understanding and using the motivational quote feature in Balanze, including favorites, categories, and customization options',
    category: 'Features',
    tags: ['quotes', 'motivation', 'favorites', 'personalization', 'dashboard', 'widgets'],
    difficulty: 'beginner',
    lastUpdated: new Date().toISOString().split('T')[0],
    readTime: '10 min read',
    author: 'Balanze Team',
    relatedArticles: ['getting-started-guide', 'settings-page-comprehensive-guide', 'dashboard-overview'],
    tableOfContents: [
      { id: 'quote-overview', title: 'Quote Feature Overview', level: 1 },
      { id: 'quote-widget', title: 'Motivational Quote Widget', level: 1 },

      { id: 'favorite-quotes', title: 'Favorite Quotes System', level: 1 },
      { id: 'quote-categories', title: 'Quote Categories', level: 1 },
     
      { id: 'customization', title: 'Customization Options', level: 1 },
    
      { id: 'pro-tips', title: 'Pro Tips', level: 1 }, 
      { id: 'need-help', title: 'Need Help?', level: 1 }
    ],
    content: `<div id="quote-overview" class="mb-12">

  <p class="text-lg text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
    The Quote feature in Balanze provides daily motivation and inspiration through carefully curated quotes from successful entrepreneurs, financial experts, and thought leaders. This comprehensive guide will help you understand and make the most of this powerful motivational tool.
  </p>

  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8">
    <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 What You'll Learn</h3>
    <ul class="text-blue-800 dark:text-blue-200 space-y-1">
      <li>• How the quote system works and refreshes automatically</li>
      <li>• How to save and manage your favorite quotes</li>
      <li>• Understanding quote categories and their purposes</li>
      <li>• Customization options and widget management</li>
      <li>• Troubleshooting common issues</li>
    </ul>
  </div>
</div>

<div id="quote-widget">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Motivational Quote Widget</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    The main quote widget appears on your dashboard and provides daily inspiration. It's designed to motivate you on your financial journey with wisdom from successful individuals.
  </p>

  <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Widget Features</h3>
  
  <div class="grid md:grid-cols-2 gap-6 mb-8">
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">🔄 Auto-Refresh</h4>
      <p class="text-gray-700 dark:text-gray-300">
        Quotes automatically refresh every 30 minutes to keep your motivation fresh and provide variety throughout the day.
      </p>
    </div>
    
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">❤️ Favorite System</h4>
      <p class="text-gray-700 dark:text-gray-300">
        Save quotes that resonate with you by clicking the heart icon. Your favorites are stored securely and can be accessed anytime.
      </p>
    </div>
    
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">🔄 Manual Refresh</h4>
      <p class="text-gray-700 dark:text-gray-300">
        Click the refresh button to get a new quote instantly without waiting for the automatic refresh cycle.
      </p>
    </div>
    
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">📱 Responsive Design</h4>
      <p class="text-gray-700 dark:text-gray-300">
        The widget adapts beautifully to all screen sizes, ensuring you get inspiration whether you're on desktop or mobile.
      </p>
    </div>
  <div class="flex items-center justify-center mt-4 md:col-span-2">
    <img
      src="/quote-widget-example.png"
      alt="Motivational Quote Widget Example"
      class="rounded-lg shadow-lg max-w-full h-auto border border-gray-200 dark:border-gray-700"
    />
  </div>
  </div>

  <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Widget Controls</h3>
  
  <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
    <ul class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart w-4 h-4 transition-colors text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
        </span>
        <span><strong>Heart Icon</strong>: Add or remove quotes from your favorites</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-cw w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:rotate-180 transition-transform"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path></svg>
        </span>
        <span><strong>Refresh Icon</strong>: Get a new quote immediately</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x w-4 h-4"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
        </span>
        <span><strong>Close Button</strong>: Hide the quote widget (can be restored in settings)</span>
      </li>
      <li class="flex items-start">
        <span class="text-purple-600 dark:text-purple-400 mr-3 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link w-4 h-4 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
        </span>
        <span>
          <strong>External Link Icon</strong>: Opens your dedicated Favorite Quotes page, where you can view and manage all your saved quotes.
        </span>
      </li>
    </ul>
  </div>
</div>
<div id="favorite-quotes">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Favorite Quotes System</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    The favorite quotes system allows you to build a personal collection of inspirational quotes that resonate with your financial journey and personal growth goals.
  </p>

  <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">How to Save Favorites</h3>
  
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
    <ol class="space-y-3 text-gray-700 dark:text-gray-300">
      <li class="flex items-start">
        <span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">1</span>
        <span>
          When you see a quote that inspires you, click the heart icon 
          <svg class="inline w-5 h-5 text-red-600 dark:text-red-400 mx-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
          </svg>
          in the quote widget
        </span>
      </li>
      <li class="flex items-start">
        <span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">2</span>
        <span>The heart will turn solid purple, indicating the quote has been saved</span>
      </li>
      <li class="flex items-start">
        <span class="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">3</span>
        <span>Your favorite quotes are automatically categorized and stored securely</span>
      </li>
    </ol>
  </div>

  <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Managing Your Favorites</h3>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    Your favorite quotes are stored in the database and associated with your account. This means:
  </p>

  <ul class="space-y-3 text-gray-700 dark:text-gray-300 mb-8">
    <li class="flex items-start">
      <span class="text-green-600 dark:text-green-400 mr-3 mt-1">✓</span>
      <span><strong>Persistent Storage</strong>: Your favorites are saved permanently and won't be lost</span>
    </li>
    <li class="flex items-start">
      <span class="text-green-600 dark:text-green-400 mr-3 mt-1">✓</span>
      <span><strong>Cross-Device Access</strong>: Access your favorites from any device where you're logged in</span>
    </li>
    <li class="flex items-start">
      <span class="text-green-600 dark:text-green-400 mr-3 mt-1">✓</span>
      <span><strong>Automatic Categorization</strong>: Quotes are automatically sorted into relevant categories</span>
    </li>
    <li class="flex items-start">
      <span class="text-green-600 dark:text-green-400 mr-3 mt-1">✓</span>
      <span><strong>Duplicate Prevention</strong>: The system prevents saving the same quote multiple times</span>
    </li>
  </ul>
</div>

<div id="quote-categories">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Quote Categories</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    Quotes in Balanze are organized into four main categories, each designed to provide specific types of motivation and inspiration for your financial journey.
  </p>

  <div class="grid md:grid-cols-2 gap-6 mb-8">
    <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
      <h3 class="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">💰 Financial</h3>
      <p class="text-green-800 dark:text-green-200 mb-4">
        Quotes focused on money management, investment wisdom, and financial success from renowned investors and financial experts.
      </p>
      <div class="text-sm text-green-700 dark:text-green-300">
        <strong>Examples:</strong> Warren Buffett, Robert Kiyosaki, Dave Ramsey
      </div>
    </div>
    
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
      <h3 class="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">🚀 Motivation</h3>
      <p class="text-blue-800 dark:text-blue-200 mb-4">
        Inspirational quotes to boost your daily motivation and help you stay focused on your goals and aspirations.
      </p>
      <div class="text-sm text-blue-700 dark:text-blue-300">
        <strong>Examples:</strong> Zig Ziglar, Tony Robbins, motivational speakers
      </div>
    </div>
    
    <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
      <h3 class="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-3">🏆 Success</h3>
      <p class="text-purple-800 dark:text-purple-200 mb-4">
        Wisdom from successful entrepreneurs and leaders about achieving goals and building lasting success.
      </p>
      <div class="text-sm text-purple-700 dark:text-purple-300">
        <strong>Examples:</strong> Steve Jobs, Elon Musk, successful business leaders
      </div>
    </div>
    
    <div class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-6">
      <h3 class="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-3">🧠 Wisdom</h3>
      <p class="text-amber-800 dark:text-amber-200 mb-4">
        Timeless wisdom and life lessons from philosophers, spiritual leaders, and wise individuals throughout history.
      </p>
      <div class="text-sm text-amber-700 dark:text-amber-300">
        <strong>Examples:</strong> Dalai Lama, ancient philosophers, spiritual teachers
      </div>
    </div>
  </div>
</div>

</div>

<div id="customization">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Customization Options</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    The quote feature offers several customization options to fit your preferences and workflow.
  </p>

  <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Widget Visibility</h3>
  
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
    <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">Hide/Show Quote Widget</h4>
    <p class="text-gray-700 dark:text-gray-300 mb-4">
      You can hide the quote widget if you prefer a cleaner dashboard or if you find it distracting.
    </p>
    
    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2"><strong>To hide the widget:</strong></p>
      <ol class="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4">
        <li>1. Click the "X" button in the top-right corner of the quote widget</li>
        <li>2. The widget will be hidden from your dashboard</li>
        <li>3. Your preference is saved automatically</li>
      </ol>
    <img
      src="/hide-quote-widget.png"
      alt="Screenshot showing how to hide the quote widget"
      class="rounded-lg border border-gray-200 dark:border-gray-600 mb-4 w-full max-w-md"
    />
    </div>
    
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
      <p class="text-sm text-blue-800 dark:text-blue-200">
        <strong>💡 Tip:</strong> You can restore the widget anytime by going to your Settings page and enabling it again.
      </p><br>
    <img
      src="/settings-restore-quote-widget.png"
      alt="Screenshot showing how to restore the quote widget in settings"
      class="rounded-lg border border-gray-200 dark:border-gray-600 mb-4 w-1/2 max-w-md"
    />
    <img
      src="/settings-quote-widget-toggle.png"
      alt="Settings page toggle for quote widget visibility"
      class="rounded-lg border border-gray-200 dark:border-gray-600 w-full max-w-md"
    />
    </div>
  </div>

</div>

<div id="pro-tips">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Pro Tips</h2>
  
  <p class="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
    Make the most of the quote feature with these expert tips and best practices.
  </p>

  <div class="grid md:grid-cols-2 gap-6 mb-8">
    <div class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
      <h3 class="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-3">💡 Daily Inspiration</h3>
      <p class="text-purple-800 dark:text-purple-200">
        Start your day by checking the quote widget. The 30-minute refresh cycle means you'll see multiple inspiring quotes throughout your workday, keeping your motivation high.
      </p>
    </div>
    
    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
      <h3 class="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">📚 Build Your Library</h3>
      <p class="text-blue-800 dark:text-blue-200">
        Actively save quotes that resonate with you. Over time, you'll build a personal collection of wisdom that reflects your values and goals.
      </p>
    </div>
    
    <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
      <h3 class="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">🎯 Goal Alignment</h3>
      <p class="text-green-800 dark:text-green-200">
        Pay attention to quote categories. Financial quotes can reinforce your money management goals, while success quotes can motivate you during challenging times.
      </p>
    </div>
    
  </div>

</div>
<div id="need-help" class="mb-12">
  <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Need Help?</h2>
  
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



`
  }
};

export default function KBArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<KBArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<'helpful' | 'not-helpful' | null>(null);
  const [copied, setCopied] = useState(false);
  const [startTime] = useState(Date.now());
  const [activeSection, setActiveSection] = useState<string>('');
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

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
          
          // Track article reading in database
          trackArticleReading({
            article_slug: slug,
            article_title: foundArticle.title,
            article_category: foundArticle.category
          });
        }
      }, 300);
    }
  }, [slug]);

  // Track time spent when component unmounts or user navigates away
  useEffect(() => {
    return () => {
      if (article && slug) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        if (timeSpent > 5) { // Only track if user spent more than 5 seconds
          trackArticleTimeSpent(slug, article.title, article.category, timeSpent);
        }
      }
    };
  }, [article, slug, startTime]);

  // Track active section on scroll with improved performance
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Handle back to top button visibility
          const scrollY = window.scrollY;
          setShowBackToTop(scrollY > 300);

          if (!article?.tableOfContents) {
            ticking = false;
            return;
          }

          const sections = article.tableOfContents.flatMap(item => [
            item,
            ...(item.children || []),
            ...(item.children?.flatMap(child => child.children || []) || [])
          ]);

          const scrollPosition = window.scrollY + 150; // Increased offset for better visibility

          // Calculate reading progress
          const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = Math.min(100, Math.max(0, (window.scrollY / documentHeight) * 100));
          setReadingProgress(progress);

          for (let i = sections.length - 1; i >= 0; i--) {
            const element = document.getElementById(sections[i].id);
            if (element && element.offsetTop <= scrollPosition) {
              setActiveSection(sections[i].id);
              break;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial call to set active section
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - 100; // Account for fixed header
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setIsTocOpen(false); // Close mobile TOC after navigation
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleFeedback = (isHelpful: boolean) => {
    setFeedback(isHelpful ? 'helpful' : 'not-helpful');
    
    // Track feedback in analytics
    trackHelpCenter('article_feedback', { 
      slug: slug!, 
      helpful: isHelpful,
      title: article?.title
    });
    
    // Track feedback in database
    if (article && slug) {
      trackArticleFeedback({
        article_slug: slug,
        article_title: article.title,
        article_category: article.category,
        feedback: isHelpful
      });
    }
    
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

  const renderTocItem = (item: TableOfContentsItem) => (
    <div key={item.id} className="mb-1">
      <button
        onClick={() => scrollToSection(item.id)}
        className={clsx(
          'block w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-[1.02]',
          activeSection === item.id
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium shadow-sm border-l-2 border-blue-500'
            : 'text-gray-600 dark:text-gray-400',
          item.level === 1 && 'font-medium',
          item.level === 2 && 'ml-4 text-sm',
          item.level === 3 && 'ml-8 text-xs'
        )}
      >
        {item.title}
      </button>
      {item.children && (
        <div className="mt-1">
          {item.children.map(child => renderTocItem(child))}
        </div>
      )}
    </div>
  );

  const TableOfContents = () => {
    if (!article?.tableOfContents) return null;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Table of Contents
          </h3>
          <button
            onClick={() => setIsTocOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Reading Progress Indicator */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Reading Progress</span>
            <span>{Math.round(readingProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-1">
          {article.tableOfContents.map(item => renderTocItem(item))}
        </div>
      </div>
    );
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Mobile TOC Toggle Button */}
      {article?.tableOfContents && (
        <button
          onClick={() => setIsTocOpen(true)}
          className="fixed top-4 right-4 z-50 lg:hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      )}

      {/* Mobile TOC Overlay */}
      {isTocOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity duration-300" 
            onClick={() => setIsTocOpen(false)} 
          />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-white dark:bg-gray-900 shadow-xl overflow-y-auto transform transition-transform duration-300 ease-out">
            <div className="p-4">
              <TableOfContents />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8 relative">
          {/* TOC Sidebar */}
          {article?.tableOfContents && (
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div 
                className="fixed top-8 w-80 max-h-[calc(100vh-4rem)] z-10"
                style={{ left: 'calc((100vw - 80rem) / 2 + 1rem)' }}
              >
                <TableOfContents />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Back Button */}
            <button
              onClick={() => navigate('/help')}
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
          <div 
            className="prose prose-lg max-w-none dark:prose-invert prose-blue prose-headings:font-bold prose-p:leading-relaxed prose-li:leading-relaxed prose-ul:my-6 prose-ol:my-6"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
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
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-gradient-primary hover:bg-gradient-primary-hover text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gradient-primary focus:ring-offset-2"
          aria-label="Back to top"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

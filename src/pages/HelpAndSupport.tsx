import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  LifeBuoy, 
  Database, 
  BarChart2, 
  DollarSign, 
  Wallet, 
  ArrowLeftRight, 
  Moon, 
  PlusCircle, 
  StickyNote, 
  Lock, 
  User, 
  Search,
  BookOpen,
  Code,
  Smartphone,
  Globe,
  Settings,
  CreditCard,
  TrendingUp,
  FileText,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Play,
  Zap,
  Shield,
  Users,
  Calendar,
  Target,
  PiggyBank,
  Gift
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  items: HelpItem[];
}

interface HelpItem {
  id: string;
  title: string;
  description: string;
  content: string;
  tech?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
}

interface QuickStart {
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
  color: string;
}

const HelpAndSupport: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const sections: Section[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Play,
      description: 'Quick start guides and basic setup',
      items: [
        {
          id: 'welcome',
          title: 'Welcome to Balanze',
          description: 'Your personal finance management platform',
          content: `Balanze is a modern, multi-user SaaS finance application that helps you track your income, expenses, accounts, and financial goals. Built with React, TypeScript, and Supabase, it provides a secure and intuitive way to manage your personal finances.

Key Features:
• Secure authentication with social login
• Multi-currency support
• Real-time data synchronization
• Beautiful, responsive interface
• Advanced analytics and reporting`,
          difficulty: 'beginner',
          tags: ['introduction', 'overview']
        },
        {
          id: 'first-steps',
          title: 'First Steps',
          description: 'Create your account and set up your first account',
          content: `1. Sign up with your email or social account
2. Verify your email address
3. Create your first financial account
4. Add your first transaction
5. Explore the dashboard

The app will guide you through each step with helpful tooltips and instructions.`,
          difficulty: 'beginner',
          tags: ['setup', 'onboarding']
        },
        {
          id: 'navigation',
          title: 'Navigation Guide',
          description: 'Learn how to navigate the application',
          content: `Main Navigation:
• Dashboard: Overview of your finances
• Transactions: Manage income and expenses
• Accounts: Manage your financial accounts
• Analytics: Detailed financial reports
• Settings: Customize your experience

Sidebar Navigation:
• Quick access to all features
• Collapsible for more screen space
• Mobile-responsive design`,
          difficulty: 'beginner',
          tags: ['navigation', 'ui']
        }
      ]
    },
    {
      id: 'features',
      title: 'Core Features',
      icon: Zap,
      description: 'Detailed guides for all features',
      items: [
        {
          id: 'authentication',
          title: 'Authentication & Security',
          description: 'Secure user registration and login system',
          content: `Balanze uses Supabase Auth for secure authentication:

Features:
• Email/password registration and login
• Social login (Google, Apple)
• Secure session management
• Password reset functionality
• Email verification

Security Features:
• Encrypted passwords
• JWT token management
• Row Level Security (RLS)
• Automatic session refresh`,
          tech: 'Supabase Auth, Zustand',
          difficulty: 'beginner',
          tags: ['security', 'auth', 'login']
        },
        {
          id: 'dashboard',
          title: 'Dashboard & Analytics',
          description: 'Central hub for financial overview',
          content: `The dashboard provides a comprehensive view of your financial health:

Key Components:
• Total balance across all accounts
• Monthly income vs expenses chart
• Recent transactions list
• Quick action buttons
• Currency-specific overviews
• Interactive charts and graphs

Analytics Features:
• Income vs expense trends
• Category-wise spending analysis
• Account balance tracking
• Multi-currency support`,
          tech: 'Recharts, Tailwind CSS',
          difficulty: 'beginner',
          tags: ['dashboard', 'analytics', 'charts']
        },
        {
          id: 'transactions',
          title: 'Transaction Management',
          description: 'Complete CRUD system for financial transactions',
          content: `Manage all your income and expenses with ease:

Features:
• Add income and expense transactions
• Categorize transactions
• Attach receipts and notes
• Bulk operations
• Search and filter
• Export functionality

Transaction Types:
• Income: Money received
• Expense: Money spent
• Transfer: Between accounts
• Recurring: Automatic transactions

Categories:
• Pre-defined categories
• Custom categories
• Category icons and colors
• Category analytics`,
          tech: 'Supabase (Realtime), React Hook Form, Zod',
          difficulty: 'intermediate',
          tags: ['transactions', 'crud', 'categories']
        },
        {
          id: 'accounts',
          title: 'Account Management',
          description: 'Manage multiple financial accounts',
          content: `Create and manage different types of financial accounts:

Account Types:
• Checking accounts
• Savings accounts
• Credit cards
• Investment accounts
• Cash accounts

Features:
• Account balance tracking
• Currency support
• Account icons and colors
• Transfer between accounts
• Account analytics
• Balance history`,
          tech: 'Supabase, Zustand',
          difficulty: 'beginner',
          tags: ['accounts', 'balance', 'currency']
        },
        {
          id: 'transfers',
          title: 'Fund Transfers',
          description: 'Transfer money between accounts',
          content: `Transfer funds between your accounts with ease:

Transfer Types:
• Regular transfers
• Currency transfers (with exchange rates)
• DPS transfers (automatic savings)

Features:
• Real-time balance updates
• Transfer history
• Exchange rate calculations
• Scheduled transfers
• Transfer confirmations`,
          tech: 'Supabase transactions',
          difficulty: 'intermediate',
          tags: ['transfers', 'currency', 'exchange']
        },
        {
          id: 'purchases',
          title: 'Purchase Tracking',
          description: 'Track purchases and shopping lists',
          content: `Specialized tracking for purchases and shopping:

Features:
• Purchase history
• Shopping lists
• Price tracking
• Category management
• Purchase analytics
• Receipt storage

Purchase Categories:
• Groceries
• Electronics
• Clothing
• Entertainment
• Custom categories`,
          tech: 'Supabase, React Hook Form',
          difficulty: 'intermediate',
          tags: ['purchases', 'shopping', 'tracking']
        },
        {
          id: 'lend-borrow',
          title: 'Lend & Borrow',
          description: 'Track money you lend or borrow',
          content: `Keep track of money you lend to others or borrow:

Features:
• Lend money tracking
• Borrow money tracking
• Installment plans
• Due date reminders
• Payment history
• Interest calculations

Lend/Borrow Types:
• Personal loans
• Business loans
• Installment payments
• One-time payments`,
          tech: 'Supabase, React Hook Form',
          difficulty: 'intermediate',
          tags: ['lend', 'borrow', 'loans']
        },
        {
          id: 'donations-savings',
          title: 'Donations & Savings',
          description: 'Track charitable giving and savings goals',
          content: `Manage your charitable giving and savings goals:

Donation Features:
• Track donation amounts
• Set donation preferences
• Donation history
• Charity categories
• Tax deduction tracking

Savings Features:
• Savings goals
• Automatic savings
• Goal progress tracking
• Savings analytics
• Goal completion celebrations`,
          tech: 'Supabase, React Hook Form',
          difficulty: 'intermediate',
          tags: ['donations', 'savings', 'goals']
        }
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Features',
      icon: Code,
      description: 'Advanced functionality and customization',
      items: [
        {
          id: 'analytics',
          title: 'Advanced Analytics',
          description: 'Detailed financial analysis and reporting',
          content: `Comprehensive analytics for better financial insights:

Analytics Types:
• Income vs expense trends
• Category spending analysis
• Account performance
• Currency analytics
• Time-based analysis
• Custom date ranges

Charts and Graphs:
• Line charts for trends
• Pie charts for categories
• Bar charts for comparisons
• Interactive tooltips
• Export capabilities`,
          tech: 'Recharts, D3.js',
          difficulty: 'advanced',
          tags: ['analytics', 'charts', 'reporting']
        },
        {
          id: 'multi-currency',
          title: 'Multi-Currency Support',
          description: 'Manage finances in multiple currencies',
          content: `Support for multiple currencies and exchange rates:

Features:
• Multiple currency accounts
• Real-time exchange rates
• Currency conversion
• Multi-currency analytics
• Currency-specific reports
• Exchange rate history

Supported Currencies:
• USD (US Dollar)
• EUR (Euro)
• GBP (British Pound)
• BDT (Bangladeshi Taka)
• And many more...`,
          tech: 'Exchange Rate API, Supabase',
          difficulty: 'advanced',
          tags: ['currency', 'exchange', 'international']
        },
        {
          id: 'api-integration',
          title: 'API Integration',
          description: 'Integrate with external services',
          content: `Connect Balanze with external financial services:

Available Integrations:
• Bank account sync
• Credit card import
• Investment portfolio tracking
• Tax software export
• Accounting software sync

API Features:
• RESTful API endpoints
• Webhook support
• OAuth authentication
• Rate limiting
• Comprehensive documentation`,
          tech: 'REST API, Webhooks, OAuth',
          difficulty: 'advanced',
          tags: ['api', 'integration', 'external']
        }
      ]
    },
    {
      id: 'mobile',
      title: 'Mobile & Accessibility',
      icon: Smartphone,
      description: 'Mobile experience and accessibility features',
      items: [
        {
          id: 'mobile-app',
          title: 'Mobile Application',
          description: 'Native mobile apps for iOS and Android',
          content: `Native mobile applications for on-the-go financial management:

Mobile Features:
• Full feature parity with web app
• Offline capability
• Push notifications
• Biometric authentication
• Widget support
• Dark mode

Platform Support:
• iOS (iPhone, iPad)
• Android (Phone, Tablet)
• Progressive Web App (PWA)`,
          tech: 'React Native, Expo',
          difficulty: 'intermediate',
          tags: ['mobile', 'ios', 'android']
        },
        {
          id: 'accessibility',
          title: 'Accessibility Features',
          description: 'Making Balanze accessible to everyone',
          content: `Comprehensive accessibility features for all users:

Accessibility Features:
• Screen reader support
• Keyboard navigation
• High contrast mode
• Font size adjustment
• Voice commands
• Color blind friendly

Standards Compliance:
• WCAG 2.1 AA compliance
• Section 508 compliance
• ARIA labels and roles
• Semantic HTML structure`,
          tech: 'ARIA, WCAG, Semantic HTML',
          difficulty: 'intermediate',
          tags: ['accessibility', 'a11y', 'inclusive']
        },
        {
          id: 'responsive-design',
          title: 'Responsive Design',
          description: 'Optimized for all screen sizes',
          content: `Fully responsive design that works on all devices:

Responsive Features:
• Mobile-first design
• Tablet optimization
• Desktop enhancement
• Touch-friendly interfaces
• Adaptive layouts
• Flexible grids

Breakpoints:
• Mobile: 320px - 768px
• Tablet: 768px - 1024px
• Desktop: 1024px+`,
          tech: 'Tailwind CSS, CSS Grid, Flexbox',
          difficulty: 'beginner',
          tags: ['responsive', 'mobile', 'design']
        }
      ]
    }
  ];

  const quickStarts: QuickStart[] = [
    {
      title: 'Create Your First Account',
      description: 'Set up your first financial account in minutes',
      icon: Wallet,
      link: '/accounts',
      color: 'bg-blue-500'
    },
    {
      title: 'Add Your First Transaction',
      description: 'Start tracking your income and expenses',
      icon: DollarSign,
      link: '/transactions',
      color: 'bg-green-500'
    },
    {
      title: 'Explore Analytics',
      description: 'View your financial insights and trends',
      icon: BarChart2,
      link: '/analytics',
      color: 'bg-purple-500'
    },
    {
      title: 'Customize Settings',
      description: 'Personalize your Balanze experience',
      icon: Settings,
      link: '/settings',
      color: 'bg-orange-500'
    }
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections;
    
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    })).filter(section => section.items.length > 0);
  }, [sections, searchQuery]);

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const activeSectionData = filteredSections.find(s => s.id === activeSection);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <LifeBuoy className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome to the Help Center!</h1>
                <p className="text-blue-100">
                  Discover guides, tutorials, and tips to master Balanze. Can't find what you're looking for? 
                  <button 
                    onClick={() => window.open('mailto:support@balanze.com', '_blank')}
                    className="underline hover:text-white ml-1"
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <nav className="space-y-2">
                {filteredSections.map((section) => (
                  <div key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <section.icon className="w-5 h-5" />
                        <span className="font-medium">{section.title}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-8">
                        {section.description}
                      </p>
                    </button>
                  </div>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSectionData ? (
              <div>
                {/* Section Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <activeSectionData.icon className="w-8 h-8 text-blue-600" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activeSectionData.title}
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {activeSectionData.description}
                  </p>
                </div>

                {/* Quick Starts */}
                {activeSection === 'getting-started' && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Quick Start Guides
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {quickStarts.map((quickStart) => (
                        <a
                          key={quickStart.title}
                          href={quickStart.link}
                          className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${quickStart.color}`}>
                              <quickStart.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {quickStart.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {quickStart.description}
                              </p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Items */}
                <div className="space-y-4">
                  {activeSectionData.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {item.title}
                            </h3>
                            {item.difficulty && (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                item.difficulty === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                item.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {item.difficulty}
                              </span>
                            )}
                          </div>
                          {expandedItems.has(item.id) ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          {item.description}
                        </p>
                        {item.tech && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono">
                            <span className="font-semibold">Tech:</span> {item.tech}
                          </div>
                        )}
                      </button>
                      
                      {expandedItems.has(item.id) && (
                        <div className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="pt-4 prose prose-sm max-w-none dark:prose-invert">
                            <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                              {item.content}
                            </div>
                          </div>
                          {item.tags && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {item.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Feedback Section */}
                          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Was this helpful?
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    toast.success('Thanks for your feedback! 👍');
                                    // Here you could track helpful feedback
                                  }}
                                  className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-full transition-colors"
                                >
                                  👍 Yes
                                </button>
                                <button
                                  onClick={() => {
                                    toast.info('We\'re sorry this wasn\'t helpful. Please contact support for assistance.');
                                    // Here you could track unhelpful feedback
                                  }}
                                  className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-full transition-colors"
                                >
                                  👎 No
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Try adjusting your search terms or browse the sections above.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpAndSupport; 
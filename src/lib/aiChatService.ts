import { supabase } from './supabase';

// Request cache to prevent duplicate requests
interface CacheEntry {
  response: string;
  timestamp: number;
}

// Type definitions for better type safety
interface UserContext {
  accounts: Array<{
    name: string;
    type: string;
    balance: number;
    currency: string;
  }>;
  transactions: Array<{
    description: string;
    amount: number;
    type: string;
    category: string;
    date: string;
  }>;
  summary: {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    accountCount: number;
    transactionCount: number;
    categoryBreakdown: Record<string, number>;
    thisMonthExpenses: number;
    lastMonthExpenses: number;
    primaryCurrency: string;
  };
  purchases: Array<{
    item_name: string;
    amount: number;
    status: string;
  }>;
  lendBorrow: Array<{
    person_name: string;
    amount: number;
    type: string;
    status: string;
  }>;
  budgets: Record<string, { budget: number; spent: number }>;
  savingsGoals: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    progress: number;
    remaining: number;
    daysRemaining: number;
    targetDate: string;
  }>;
  investments: {
    totalPortfolioValue: number;
    totalCostBasis: number;
    totalGainLoss: number;
    returnPercentage: number;
    assetCount: number;
  };
  analytics: {
    monthlySpending: Array<{ month: string; amount: number; year: number; monthNum: number }>;
    avgMonthlySpending: number;
    dailyAverage: number;
    projectedMonthEnd: number;
    monthlyIncome: number;
    netMonthlyRate: number;
    monthsUntilZero: number | null;
    categoryAnomalies: Array<{ category: string; thisMonth: number; avgMonth: number; increase: number }>;
  };
  currencies: Record<string, { balance: number; income: number; expenses: number }>;
}

const requestCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds cache

// User context cache to avoid fetching data on every request
interface ContextCacheEntry {
  context: UserContext;
  timestamp: number;
}

const contextCache = new Map<string, ContextCacheEntry>();
const CONTEXT_CACHE_TTL = 60000; // 60 seconds - context cache lasts longer than response cache

// Conversation memory - stores recent conversation history per user
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ConversationHistory {
  messages: ConversationMessage[];
  lastActivity: number;
}

const conversationHistory = new Map<string, ConversationHistory>();
const MAX_CONVERSATION_HISTORY = 10; // Keep last 10 messages (5 user + 5 assistant)
const CONVERSATION_TIMEOUT = 300000; // 5 minutes - clear history after inactivity

// Helper to generate cache key
function getCacheKey(query: string, userId: string): string {
  return `${userId}:${query.toLowerCase().trim()}`;
}

// Helper to check and get from cache
function getCachedResponse(query: string, userId: string): string | null {
  const key = getCacheKey(query, userId);
  const entry = requestCache.get(key);
  
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.response;
  }
  
  if (entry) {
    requestCache.delete(key); // Remove expired entry
  }
  
  return null;
}

// Helper to set cache
function setCachedResponse(query: string, userId: string, response: string): void {
  const key = getCacheKey(query, userId);
  requestCache.set(key, {
    response,
    timestamp: Date.now(),
  });
  
  // Limit cache size to prevent memory leaks
  if (requestCache.size > 50) {
    const firstKey = requestCache.keys().next().value;
    if (firstKey) {
      requestCache.delete(firstKey);
    }
  }
}

// Helper function to format currency with commas
function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', 
    ALL: 'L', INR: '₹', CAD: '$', AUD: '$'
  };
  const symbol = symbols[currency] || currency;
  const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${symbol}${formattedAmount}`;
}

// Enhanced synonyms for better query understanding
const SYNONYMS: Record<string, string[]> = {
  // Income/Deposit synonyms
  deposit: ['income', 'credit', 'salary', 'wage', 'payroll', 'earnings', 'revenue', 'profit', 'bonus', 'commission'],
  income: ['deposit', 'credit', 'salary', 'wage', 'payroll', 'earnings', 'revenue', 'profit', 'bonus', 'commission'],
  salary: ['income', 'wage', 'payroll', 'earnings', 'stipend', 'allowance'],
  earned: ['income', 'made', 'received', 'got'],
  earning: ['income', 'revenue', 'profit'],
  
  // Expense/Spending synonyms
  expense: ['spending', 'cost', 'payment', 'charge', 'fee', 'bill', 'outgoing', 'debit'],
  spent: ['spending', 'expense', 'paid', 'cost', 'used'],
  spending: ['expense', 'spent', 'cost', 'payment'],
  cost: ['expense', 'spending', 'price', 'charge'],
  payment: ['expense', 'spending', 'cost', 'charge', 'fee'],
  
  // Balance/Money synonyms
  balance: ['money', 'amount', 'total', 'available', 'current', 'remaining'],
  money: ['balance', 'amount', 'funds', 'cash'],
  total: ['sum', 'amount', 'all', 'everything'],
  
  // Account synonyms
  account: ['bank', 'checking', 'savings', 'financial'],
  accounts: ['banks', 'checking', 'savings'],
  
  // Transaction synonyms
  transaction: ['payment', 'expense', 'income', 'entry', 'record'],
  transactions: ['payments', 'expenses', 'income', 'entries', 'records'],
  
  // Category synonyms
  category: ['type', 'group', 'class'],
  categories: ['types', 'groups', 'classes'],
  
  // Budget synonyms
  budget: ['limit', 'allocation', 'planning', 'forecast'],
  over: ['exceeded', 'above', 'beyond'],
  under: ['below', 'less', 'within'],
  
  // Savings/Goals synonyms
  savings: ['reserve', 'fund', 'nest egg', 'stash'],
  goal: ['target', 'objective', 'aim'],
  goals: ['targets', 'objectives', 'aims'],
  
  // Investment synonyms
  investment: ['portfolio', 'assets', 'securities', 'stocks', 'bonds'],
  portfolio: ['investment', 'assets', 'holdings'],
  
  // Time/Date synonyms
  recent: ['latest', 'newest', 'current', 'today', 'this week'],
  latest: ['recent', 'newest', 'current'],
  month: ['monthly', 'per month'],
  week: ['weekly', 'per week'],
  year: ['yearly', 'annual', 'per year'],
  
  // Comparison synonyms
  compare: ['comparison', 'versus', 'vs', 'difference'],
  trend: ['pattern', 'change', 'increase', 'decrease'],
  more: ['higher', 'greater', 'increase'],
  less: ['lower', 'smaller', 'decrease'],
  
  // Help/Support synonyms
  help: ['assist', 'support', 'guide', 'what can'],
  what: ['how', 'tell', 'show'],
  how: ['what', 'tell', 'show'],
};

// Expand query with synonyms for better matching
function expandQueryWithSynonyms(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  let expanded = [...words];
  
  // Add synonyms for each word
  for (const word of words) {
    // Remove common punctuation
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    if (SYNONYMS[cleanWord]) {
      expanded = expanded.concat(SYNONYMS[cleanWord]);
    }
  }
  
  // Add phrase-based synonyms
  const phrase = query.toLowerCase();
  if (phrase.includes('how much') || phrase.includes('how many')) {
    expanded.push('what', 'total', 'amount');
  }
  if (phrase.includes('spent') || phrase.includes('spending')) {
    expanded.push('expense', 'cost', 'payment');
  }
  if (phrase.includes('earned') || phrase.includes('income')) {
    expanded.push('made', 'received', 'got');
  }
  
  // Remove duplicates and return
  return [...new Set(expanded)];
}

// Improved query matching with synonyms and fuzzy matching
function matchesQuery(message: string, patterns: string[]): boolean {
  const lowerMessage = message.toLowerCase().trim();
  const expandedTerms = expandQueryWithSynonyms(lowerMessage);
  const expandedMessage = expandedTerms.join(' ');
  
  // Check direct patterns
  for (const pattern of patterns) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(lowerMessage) || regex.test(expandedMessage)) {
      return true;
    }
  }
  
  // Fuzzy matching: check if key terms appear (even if not exact match)
  const keyTerms = patterns.map(p => {
    // Extract key words from regex pattern
    const match = p.match(/\b(\w+)\b/g);
    return match ? match.map(m => m.toLowerCase()) : [];
  }).flat();
  
  const messageWords = lowerMessage.split(/\s+/);
  const expandedWords = expandedMessage.split(/\s+/);
  const allWords = [...messageWords, ...expandedWords];
  
  // Check if at least 2 key terms appear in the message
  const matchingTerms = keyTerms.filter(term => 
    allWords.some(word => word.includes(term) || term.includes(word))
  );
  
  return matchingTerms.length >= Math.min(2, keyTerms.length);
}

// Helper to get cached context
function getCachedContext(userId: string): UserContext | null {
  const entry = contextCache.get(userId);
  if (entry && Date.now() - entry.timestamp < CONTEXT_CACHE_TTL) {
    return entry.context;
  }
  if (entry) {
    contextCache.delete(userId); // Remove expired entry
  }
  return null;
}

// Helper to set cached context
function setCachedContext(userId: string, context: UserContext): void {
  contextCache.set(userId, {
    context,
    timestamp: Date.now(),
  });
  
  // Limit cache size to prevent memory leaks
  if (contextCache.size > 100) {
    const firstKey = contextCache.keys().next().value;
    if (firstKey) {
      contextCache.delete(firstKey);
    }
  }
}

// Conversation memory helpers
function getConversationHistory(userId: string): ConversationMessage[] {
  const history = conversationHistory.get(userId);
  if (!history) {
    return [];
  }
  
  // Clear old conversations (inactivity timeout)
  if (Date.now() - history.lastActivity > CONVERSATION_TIMEOUT) {
    conversationHistory.delete(userId);
    return [];
  }
  
  return history.messages;
}

function addToConversationHistory(userId: string, role: 'user' | 'assistant', content: string): void {
  let history = conversationHistory.get(userId);
  
  if (!history) {
    history = {
      messages: [],
      lastActivity: Date.now(),
    };
    conversationHistory.set(userId, history);
  }
  
  // Add new message
  history.messages.push({
    role,
    content,
    timestamp: Date.now(),
  });
  
  // Keep only last N messages
  if (history.messages.length > MAX_CONVERSATION_HISTORY) {
    history.messages = history.messages.slice(-MAX_CONVERSATION_HISTORY);
  }
  
  history.lastActivity = Date.now();
  
  // Limit total conversations in memory
  if (conversationHistory.size > 200) {
    const firstKey = conversationHistory.keys().next().value;
    if (firstKey) {
      conversationHistory.delete(firstKey);
    }
  }
}

// Export function to clear conversation history (useful for resetting conversations)
export function clearConversationHistory(userId: string): void {
  conversationHistory.delete(userId);
}

// Helper function to gather user financial context (client-side) - with caching
async function gatherUserContext(userId: string, forceRefresh: boolean = false): Promise<UserContext> {
  // Check cache first unless force refresh
  if (!forceRefresh) {
    const cached = getCachedContext(userId);
    if (cached) {
      return cached;
    }
  }
  
  try {
    const [accountsResult, transactionsResult, purchasesResult, lendBorrowResult, savingsGoalsResult, categoriesResult, investmentAssetsResult] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', userId),
      supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('purchases').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('lend_borrow').select('*').eq('user_id', userId),
      supabase.from('savings_goals').select('*').eq('user_id', userId),
      supabase.from('categories').select('*').eq('user_id', userId),
      supabase.from('investment_assets').select('*').eq('user_id', userId),
    ]);

    const accounts = accountsResult.data || [];
    const allTransactions = transactionsResult.data || [];
    const purchases = purchasesResult.data || [];
    const lendBorrow = lendBorrowResult.data || [];
    const savingsGoals = savingsGoalsResult.data || [];
    const categories = categoriesResult.data || [];
    const investmentAssets = investmentAssetsResult.data || [];

    // Filter out transfers
    const transactions = allTransactions.filter((t: any) => {
      const tags = t.tags || [];
      return !tags.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'));
    });

    // Calculate summary statistics
    const totalBalance = accounts.reduce((sum: number, acc: any) => sum + (parseFloat(acc.balance) || 0), 0);
    const incomeTransactions = transactions.filter((t: any) => t.type === 'income');
    const expenseTransactions = transactions.filter((t: any) => t.type === 'expense');
    const totalIncome = incomeTransactions.reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
    const totalExpenses = expenseTransactions.reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
    const netAmount = totalIncome - totalExpenses;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    expenseTransactions.forEach((t: any) => {
      const category = t.category || 'Uncategorized';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + Math.abs(parseFloat(t.amount) || 0);
    });

    // Monthly breakdown
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const thisMonthExpenses = expenseTransactions
      .filter((t: any) => {
        const date = new Date(t.created_at || t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const lastMonthExpenses = expenseTransactions
      .filter((t: any) => {
        const date = new Date(t.created_at || t.date);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      })
      .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    // Get primary currency and multi-currency breakdown
    const currencies = [...new Set(accounts.map((a: any) => a.currency))];
    const primaryCurrency = currencies[0] || 'USD';
    
    // Multi-currency analysis
    const currencyBreakdown: Record<string, { balance: number; income: number; expenses: number }> = {};
    currencies.forEach((curr: string) => {
      const currencyAccounts = accounts.filter((a: any) => a.currency === curr);
      const currencyBalance = currencyAccounts.reduce((sum: number, a: any) => sum + (parseFloat(a.balance) || 0), 0);
      
      const currencyIncome = incomeTransactions
        .filter((t: any) => {
          const account = accounts.find((a: any) => a.id === t.account_id);
          return account && account.currency === curr;
        })
        .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
      
      const currencyExpenses = expenseTransactions
        .filter((t: any) => {
          const account = accounts.find((a: any) => a.id === t.account_id);
          return account && account.currency === curr;
        })
        .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
      
      currencyBreakdown[curr] = {
        balance: currencyBalance,
        income: currencyIncome,
        expenses: currencyExpenses,
      };
    });

    // Calculate budget data (from categories with monthly_budget)
    const budgetData: Record<string, { budget: number; spent: number }> = {};
    categories.forEach((cat: any) => {
      if (cat.monthly_budget && cat.monthly_budget > 0) {
        const categoryName = cat.name || 'Uncategorized';
        const spent = categoryBreakdown[categoryName] || 0;
        budgetData[categoryName] = {
          budget: parseFloat(cat.monthly_budget) || 0,
          spent: spent,
        };
      }
    });

    // Calculate savings goals progress
    const savingsGoalsProgress = savingsGoals.map((goal: any) => {
      const targetAmount = parseFloat(goal.target_amount) || 0;
      const currentAmount = parseFloat(goal.current_amount) || 0;
      const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
      const remaining = targetAmount - currentAmount;
      const targetDate = new Date(goal.target_date);
      const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        name: goal.name || 'Unnamed Goal',
        targetAmount,
        currentAmount,
        progress: Math.min(100, Math.max(0, progress)),
        remaining,
        daysRemaining,
        targetDate: goal.target_date,
      };
    });

    // Calculate investment portfolio value
    const totalPortfolioValue = investmentAssets.reduce((sum: number, asset: any) => {
      return sum + (parseFloat(asset.current_value || asset.total_value || 0));
    }, 0);

    const totalCostBasis = investmentAssets.reduce((sum: number, asset: any) => {
      return sum + (parseFloat(asset.cost_basis || 0));
    }, 0);

    const totalGainLoss = totalPortfolioValue - totalCostBasis;
    const returnPercentage = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

    // Advanced Analytics: Historical spending data (last 6 months)
    const monthlySpending: Array<{ month: string; amount: number; year: number; monthNum: number }> = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthNum = date.getMonth();
      const year = date.getFullYear();
      const monthName = date.toLocaleString('default', { month: 'long' });
      
      const monthExpenses = expenseTransactions
        .filter((t: any) => {
          const tDate = new Date(t.created_at || t.date);
          return tDate.getMonth() === monthNum && tDate.getFullYear() === year;
        })
        .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
      
      monthlySpending.push({ month: monthName, amount: monthExpenses, year, monthNum });
    }

    // Calculate average monthly spending
    const avgMonthlySpending = monthlySpending.length > 0
      ? monthlySpending.reduce((sum, m) => sum + m.amount, 0) / monthlySpending.length
      : 0;

    // Calculate spending velocity (daily average this month)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const dailyAverage = dayOfMonth > 0 ? thisMonthExpenses / dayOfMonth : 0;
    const projectedMonthEnd = dailyAverage * daysInMonth;

    // Burn rate (how long until balance runs out at current spending rate)
    const monthlyIncome = incomeTransactions
      .filter((t: any) => {
        const tDate = new Date(t.created_at || t.date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      })
      .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
    
    const netMonthlyRate = monthlyIncome - thisMonthExpenses;
    const monthsUntilZero = netMonthlyRate < 0 && totalBalance > 0
      ? Math.floor(totalBalance / Math.abs(netMonthlyRate))
      : null;

    // Anomaly detection: find categories with unusually high spending this month
    const categoryAnomalies: Array<{ category: string; thisMonth: number; avgMonth: number; increase: number }> = [];
    Object.entries(categoryBreakdown).forEach(([category, thisMonthSpent]) => {
      // Calculate average for this category over last 3 months
      const last3MonthsAvg = monthlySpending.slice(0, 3).reduce((sum, monthData) => {
        const monthExpenses = expenseTransactions
          .filter((t: any) => {
            const tDate = new Date(t.created_at || t.date);
            return tDate.getMonth() === monthData.monthNum && 
                   tDate.getFullYear() === monthData.year &&
                   (t.category || 'Uncategorized') === category;
          })
          .reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
        return sum + monthExpenses;
      }, 0) / 3;

      if (last3MonthsAvg > 0 && thisMonthSpent > last3MonthsAvg * 1.5) {
        categoryAnomalies.push({
          category,
          thisMonth: thisMonthSpent,
          avgMonth: last3MonthsAvg,
          increase: ((thisMonthSpent - last3MonthsAvg) / last3MonthsAvg) * 100,
        });
      }
    });

    const context: UserContext = {
      accounts: accounts.map((a: any) => ({
        name: a.name || 'Unnamed Account',
        type: a.type || 'other',
        balance: parseFloat(a.balance) || 0,
        currency: a.currency || 'USD',
      })),
      transactions: transactions.map((t: any) => ({
        description: t.description || 'No description',
        amount: parseFloat(t.amount) || 0,
        type: t.type || 'expense',
        category: t.category || 'Uncategorized',
        date: t.created_at || t.date || new Date().toISOString(),
      })),
      summary: {
        totalBalance,
        totalIncome,
        totalExpenses,
        netAmount,
        accountCount: accounts.length,
        transactionCount: transactions.length,
        categoryBreakdown,
        thisMonthExpenses,
        lastMonthExpenses,
        primaryCurrency,
      },
      purchases: purchases.map((p: any) => ({
        item_name: p.item_name || 'Unnamed Item',
        amount: parseFloat(p.amount) || parseFloat(p.price) || 0,
        status: p.status || 'purchased',
      })),
      lendBorrow: lendBorrow.map((lb: any) => ({
        person_name: lb.person_name || 'Unknown',
        amount: parseFloat(lb.amount) || 0,
        type: lb.type || 'lent',
        status: lb.status || 'active',
      })),
      budgets: budgetData,
      savingsGoals: savingsGoalsProgress,
      investments: {
        totalPortfolioValue,
        totalCostBasis,
        totalGainLoss,
        returnPercentage,
        assetCount: investmentAssets.length,
      },
      analytics: {
        monthlySpending,
        avgMonthlySpending,
        dailyAverage,
        projectedMonthEnd,
        monthlyIncome,
        netMonthlyRate,
        monthsUntilZero,
        categoryAnomalies,
      },
      currencies: currencyBreakdown,
    };
    
    // Cache the context before returning
    setCachedContext(userId, context);
    return context;
  } catch (error) {
    console.error('Error gathering user context:', error);
    const defaultContext: UserContext = {
      accounts: [],
      transactions: [],
      summary: {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        accountCount: 0,
        transactionCount: 0,
        categoryBreakdown: {},
        thisMonthExpenses: 0,
        lastMonthExpenses: 0,
        primaryCurrency: 'USD',
      },
      purchases: [],
      lendBorrow: [],
      budgets: {},
      savingsGoals: [],
      investments: {
        totalPortfolioValue: 0,
        totalCostBasis: 0,
        totalGainLoss: 0,
        returnPercentage: 0,
        assetCount: 0,
      },
      analytics: {
        monthlySpending: [],
        avgMonthlySpending: 0,
        dailyAverage: 0,
        projectedMonthEnd: 0,
        monthlyIncome: 0,
        netMonthlyRate: 0,
        monthsUntilZero: null,
        categoryAnomalies: [],
      },
      currencies: {},
    };
    
    // Cache the default context even on error to avoid repeated failed fetches
    setCachedContext(userId, defaultContext);
    return defaultContext;
  }
}

// Helper function to get date range from query - Enhanced with natural language support
function getDateRangeFromQuery(message: string): { start: Date; end: Date; label: string } | null {
  const lowerMessage = message.toLowerCase();
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to start of day
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  
  // Today
  if (lowerMessage.match(/\b(today)\b/)) {
    return {
      start: new Date(now),
      end: new Date(now),
      label: 'Today'
    };
  }
  
  // Yesterday
  if (lowerMessage.match(/\b(yesterday)\b/)) {
    const yesterday = new Date(now);
    yesterday.setDate(currentDate - 1);
    return {
      start: yesterday,
      end: yesterday,
      label: 'Yesterday'
    };
  }
  
  // Last N days (e.g., "last 7 days", "last 30 days", "past 7 days")
  const lastDaysMatch = lowerMessage.match(/\b(last|past)\s+(\d+)\s+days?\b/);
  if (lastDaysMatch) {
    const days = parseInt(lastDaysMatch[2], 10);
    if (days > 0 && days <= 365) {
      const startDate = new Date(now);
      startDate.setDate(currentDate - days);
      return {
        start: startDate,
        end: new Date(now),
        label: `Last ${days} Days`
      };
    }
  }
  
  // Last week
  if (lowerMessage.match(/\b(last week|previous week)\b/)) {
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const lastMonday = new Date(now);
    lastMonday.setDate(currentDate + diffToMonday - 7);
    lastMonday.setHours(0, 0, 0, 0);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);
    return {
      start: lastMonday,
      end: lastSunday,
      label: 'Last Week'
    };
  }
  
  // This week
  if (lowerMessage.match(/\b(this week|current week)\b/)) {
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(currentDate + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return {
      start: monday,
      end: sunday,
      label: 'This Week'
    };
  }
  
  // Last month
  if (lowerMessage.match(/\b(last month|previous month)\b/)) {
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return {
      start: new Date(lastMonthYear, lastMonth, 1),
      end: new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59, 999),
      label: 'Last Month'
    };
  }
  
  // This month
  if (lowerMessage.match(/\b(this month|current month)\b/)) {
    return {
      start: new Date(currentYear, currentMonth, 1),
      end: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999),
      label: 'This Month'
    };
  }
  
  // N weeks ago (e.g., "2 weeks ago", "3 weeks ago")
  const weeksAgoMatch = lowerMessage.match(/\b(\d+)\s+weeks?\s+ago\b/);
  if (weeksAgoMatch) {
    const weeks = parseInt(weeksAgoMatch[1], 10);
    if (weeks > 0 && weeks <= 52) {
      const day = now.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const targetMonday = new Date(now);
      targetMonday.setDate(currentDate + diffToMonday - (weeks * 7));
      targetMonday.setHours(0, 0, 0, 0);
      const targetSunday = new Date(targetMonday);
      targetSunday.setDate(targetMonday.getDate() + 6);
      targetSunday.setHours(23, 59, 59, 999);
      return {
        start: targetMonday,
        end: targetSunday,
        label: `${weeks} Week${weeks > 1 ? 's' : ''} Ago`
      };
    }
  }
  
  // N months ago (e.g., "2 months ago", "3 months ago")
  const monthsAgoMatch = lowerMessage.match(/\b(\d+)\s+months?\s+ago\b/);
  if (monthsAgoMatch) {
    const months = parseInt(monthsAgoMatch[1], 10);
    if (months > 0 && months <= 12) {
      const targetMonth = currentMonth - months;
      const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
      const actualMonth = targetMonth < 0 ? targetMonth + 12 : targetMonth;
      return {
        start: new Date(targetYear, actualMonth, 1),
        end: new Date(targetYear, actualMonth + 1, 0, 23, 59, 59, 999),
        label: `${months} Month${months > 1 ? 's' : ''} Ago`
      };
    }
  }
  
  // This quarter
  if (lowerMessage.match(/\b(this quarter|current quarter)\b/)) {
    const quarter = Math.floor(currentMonth / 3);
    const quarterStartMonth = quarter * 3;
    const quarterEndMonth = quarterStartMonth + 2;
    return {
      start: new Date(currentYear, quarterStartMonth, 1),
      end: new Date(currentYear, quarterEndMonth + 1, 0, 23, 59, 59, 999),
      label: 'This Quarter'
    };
  }
  
  // Last quarter
  if (lowerMessage.match(/\b(last quarter|previous quarter)\b/)) {
    const quarter = Math.floor(currentMonth / 3);
    const lastQuarter = quarter === 0 ? 3 : quarter - 1;
    const lastQuarterYear = quarter === 0 ? currentYear - 1 : currentYear;
    const quarterStartMonth = lastQuarter * 3;
    const quarterEndMonth = quarterStartMonth + 2;
    return {
      start: new Date(lastQuarterYear, quarterStartMonth, 1),
      end: new Date(lastQuarterYear, quarterEndMonth + 1, 0, 23, 59, 59, 999),
      label: 'Last Quarter'
    };
  }
  
  // This year
  if (lowerMessage.match(/\b(this year|current year)\b/)) {
    return {
      start: new Date(currentYear, 0, 1),
      end: new Date(currentYear, 11, 31, 23, 59, 59, 999),
      label: 'This Year'
    };
  }
  
  // Last year
  if (lowerMessage.match(/\b(last year|previous year)\b/)) {
    return {
      start: new Date(currentYear - 1, 0, 1),
      end: new Date(currentYear - 1, 11, 31, 23, 59, 59, 999),
      label: 'Last Year'
    };
  }
  
  // Specific month (e.g., "in January", "in March")
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
  for (let i = 0; i < monthNames.length; i++) {
    if (lowerMessage.includes(monthNames[i])) {
      // Check if it's this year or last year
      const isLastYear = lowerMessage.includes('last year') || 
                        (i > currentMonth && !lowerMessage.includes('this year'));
      const year = isLastYear ? currentYear - 1 : currentYear;
      return {
        start: new Date(year, i, 1),
        end: new Date(year, i + 1, 0, 23, 59, 59, 999),
        label: monthNames[i].charAt(0).toUpperCase() + monthNames[i].slice(1)
      };
    }
  }
  
  return null;
}

// Helper function to filter transactions by date range
function filterTransactionsByDate(transactions: any[], dateRange: { start: Date; end: Date }): any[] {
  return transactions.filter((t: any) => {
    const transactionDate = new Date(t.date);
    return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
  });
}

// Rule-based response generator (same as API) - Enhanced with conversation memory
function generateResponse(message: string, context: UserContext, conversationHistory: ConversationMessage[] = []): string {
  const lowerMessage = message.toLowerCase().trim();
  const { accounts, transactions, summary, purchases, lendBorrow, budgets, savingsGoals, investments, analytics, currencies } = context;
  
  // Use conversation history for context-aware responses
  const recentUserMessages = conversationHistory
    .filter(m => m.role === 'user')
    .slice(-3) // Last 3 user messages
    .map(m => m.content.toLowerCase());
  
  const recentAssistantMessages = conversationHistory
    .filter(m => m.role === 'assistant')
    .slice(-2) // Last 2 assistant messages
    .map(m => m.content.toLowerCase());
  
  // Check for follow-up questions (e.g., "what about", "and", "also", "more")
  const isFollowUp = lowerMessage.match(/\b(what about|and|also|more|tell me more|how about|what else)\b/) ||
                     (recentUserMessages.length > 0 && lowerMessage.length < 20);
  
  // Check for date range in query
  const dateRange = getDateRangeFromQuery(message);

  // Balance questions - improved matching
  if (matchesQuery(message, [
    '\\b(balance|total balance|how much money|current balance|account balance)\\b',
    '\\b(what.*balance|show.*balance|my balance|available.*money)\\b',
    '\\b(how much.*have|total.*money|all.*money)\\b'
  ])) {
    if (accounts.length === 0) {
      return "You don't have any accounts set up yet. Add an account to start tracking your balance! 💰\n\nTo get started:\n1. Go to Accounts\n2. Click 'Add Account'\n3. Enter your account details";
    }
    if (summary.totalBalance === 0 && accounts.length > 0) {
      return `You have ${accounts.length} account${accounts.length > 1 ? 's' : ''} set up, but ${accounts.length === 1 ? 'it' : 'they'} ${accounts.length === 1 ? 'has' : 'have'} a balance of ${formatCurrency(0, summary.primaryCurrency)}.\n\n💡 Add some transactions to see your balance update!`;
    }
    const accountList = accounts.map((a: any) => `💰 ${a.name}: ${formatCurrency(a.balance, a.currency)}`).join('\n');
    return `Here's your account balance:\n\n${accountList}\n\n💵 **Total Balance:** ${formatCurrency(summary.totalBalance, summary.primaryCurrency)}`;
  }

  // Income questions with date range support - improved matching
  if (matchesQuery(message, [
    '\\b(income|earned|earning|salary|how much.*income|total income)\\b',
    '\\b(what.*income|show.*income|my income|how much.*earned|how much.*made)\\b',
    '\\b(revenue|payroll|wage|earnings|salary)\\b'
  ])) {
    const incomeTransactions = transactions.filter((t: any) => t.type === 'income');
    
    if (dateRange) {
      const filteredIncome = filterTransactionsByDate(incomeTransactions, dateRange);
      const totalIncome = filteredIncome.reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);
      if (filteredIncome.length === 0) {
        return `You didn't record any income in ${dateRange.label.toLowerCase()}.\n\n💡 To track your income:\n1. Go to Transactions\n2. Click 'Add Transaction'\n3. Select 'Income' as the type\n4. Enter the amount and details`;
      }
      return `Great! In ${dateRange.label.toLowerCase()}, you earned ${formatCurrency(totalIncome, summary.primaryCurrency)} from ${filteredIncome.length} income transaction${filteredIncome.length > 1 ? 's' : ''}. 💰`;
    }
    
    if (incomeTransactions.length === 0) {
      return "You haven't recorded any income yet. 📈\n\nTo start tracking your income:\n1. Go to Transactions\n2. Click 'Add Transaction'\n3. Select 'Income' as the type\n4. Enter the amount and details\n\nThis will help Balanzo provide better financial insights!";
    }
    if (summary.totalIncome === 0) {
      return `You have ${incomeTransactions.length} income transaction${incomeTransactions.length > 1 ? 's' : ''} recorded, but the total amount is ${formatCurrency(0, summary.primaryCurrency)}.\n\n💡 Make sure your income transactions have positive amounts.`;
    }
    return `Your total income is **${formatCurrency(summary.totalIncome, summary.primaryCurrency)}** from ${incomeTransactions.length} transaction${incomeTransactions.length > 1 ? 's' : ''}. Keep up the great work! 💰`;
  }

  // Top spending categories (check before general expense questions) - improved matching
  if (matchesQuery(message, [
    '\\b(top|highest|most|biggest).*?(spend|expense|category|categories)\\b',
    '\\b(what.*top|show.*top|largest.*category|biggest.*spending)\\b'
  ])) {
    const topCategories = Object.entries(summary.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    if (topCategories.length === 0) {
      return "You don't have enough spending data yet to show top categories. 💸\n\nTo see category breakdown:\n1. Add expense transactions\n2. Assign categories to your expenses\n3. Ask again to see your top spending areas";
    }
    const categoryList = topCategories.map(([cat, amount], idx) => {
      const percentage = summary.totalExpenses > 0 
        ? ((amount / summary.totalExpenses) * 100).toFixed(1)
        : '0.0';
      return `${idx + 1}. 📊 ${cat}: ${formatCurrency(amount, summary.primaryCurrency)} (${percentage}%)`;
    }).join('\n');
    return `Here are your top spending categories:\n\n${categoryList}`;
  }

  // Spending by category / category breakdown (check before general expense) - improved matching
  if (matchesQuery(message, [
    '\\b(spending|spend|expense).*?(by|per|category|categories|breakdown)\\b',
    '\\b(what.*category|show.*category|spending.*breakdown|category.*spending)\\b'
  ])) {
    const topCategories = Object.entries(summary.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    if (topCategories.length === 0) {
      return "You don't have any spending by category yet. 📊\n\nTo see category breakdown:\n1. Go to Transactions\n2. Add expense transactions\n3. Assign categories to your expenses\n4. Ask again to see your spending breakdown";
    }
    const categoryList = topCategories.map(([cat, amount], idx) => {
      const percentage = summary.totalExpenses > 0 
        ? ((amount / summary.totalExpenses) * 100).toFixed(1)
        : '0.0';
      return `${idx + 1}. 📊 ${cat}: ${formatCurrency(amount, summary.primaryCurrency)} (${percentage}%)`;
    }).join('\n');
    return `Here's your spending by category:\n\n${categoryList}`;
  }

  // Category spending questions (specific category)
  const categoryMatch = lowerMessage.match(/\b(spent|spending|spend).*?(on|for)?\s+([a-z\s]+?)(\?|$|this|last|month)/i);
  if (categoryMatch) {
    const categoryName = categoryMatch[3]?.trim();
    if (categoryName && categoryName.length > 2) {
      const matchingCategory = Object.keys(summary.categoryBreakdown).find(
        (cat: string) => cat.toLowerCase().includes(categoryName.toLowerCase()) || categoryName.toLowerCase().includes(cat.toLowerCase())
      );
      if (matchingCategory) {
        const amount = summary.categoryBreakdown[matchingCategory];
        return `You've spent ${formatCurrency(amount, summary.primaryCurrency)} on ${matchingCategory}.`;
      }
    }
  }

  // General expense questions with date range support (check last, after category-specific checks) - improved matching
  if (matchesQuery(message, [
    '\\b(expense|spent|spending|how much.*spend|total expense|cost)\\b',
    '\\b(what.*spent|show.*spending|how much.*paid|my expenses|total.*cost)\\b',
    '\\b(how much.*spending|what.*cost|spending.*amount)\\b'
  ])) {
    const expenseTransactions = transactions.filter((t: any) => t.type === 'expense');
    
    if (dateRange) {
      const filteredExpenses = filterTransactionsByDate(expenseTransactions, dateRange);
      const totalSpent = filteredExpenses.reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
      
      if (filteredExpenses.length === 0) {
        return `You didn't record any expenses in ${dateRange.label.toLowerCase()}. 💸\n\nTo track expenses:\n1. Go to Transactions\n2. Click 'Add Transaction'\n3. Select 'Expense' as the type\n4. Enter the amount and category`;
      }
      
      return `In ${dateRange.label.toLowerCase()}, you spent **${formatCurrency(totalSpent, summary.primaryCurrency)}** across ${filteredExpenses.length} expense transaction${filteredExpenses.length > 1 ? 's' : ''}. 💸`;
    }
    
    if (expenseTransactions.length === 0) {
      return "You haven't recorded any expenses yet. 💸\n\nTo start tracking:\n1. Go to Transactions\n2. Click 'Add Transaction'\n3. Select 'Expense' as the type\n4. Enter the amount, category, and details\n\nThis helps Balanzo provide better spending insights!";
    }
    if (summary.totalExpenses === 0) {
      return `You have ${expenseTransactions.length} expense transaction${expenseTransactions.length > 1 ? 's' : ''} recorded, but the total amount is ${formatCurrency(0, summary.primaryCurrency)}.\n\n💡 Make sure your expense transactions have amounts entered.`;
    }
    return `Your total expenses are **${formatCurrency(summary.totalExpenses, summary.primaryCurrency)}** from ${expenseTransactions.length} transaction${expenseTransactions.length > 1 ? 's' : ''}. 💸`;
  }

  // Net amount / savings - improved matching
  if (matchesQuery(message, [
    '\\b(net|savings|saved|left over|remaining|difference)\\b',
    '\\b(what.*net|show.*savings|how much.*saved|remaining.*money)\\b'
  ])) {
    const net = summary.netAmount;
    if (summary.totalIncome === 0 && summary.totalExpenses === 0) {
      return "I can't calculate your net amount yet because you don't have any income or expense transactions. 💰\n\nTo see your net savings:\n1. Add income transactions\n2. Add expense transactions\n3. Ask again to see your net amount";
    }
    if (net > 0) {
      return `🎉 Great news! You're saving money! Your net amount is **${formatCurrency(net, summary.primaryCurrency)}** - that's fantastic! Keep up the excellent work! 💰`;
    } else if (net < 0) {
      return `Your net amount is **${formatCurrency(Math.abs(net), summary.primaryCurrency)}** in the negative. 💡 Consider reviewing your expenses to improve your financial health. I can help you identify areas where you might be able to cut back - just ask!`;
    } else {
      return `Your income and expenses are perfectly balanced at **${formatCurrency(0, summary.primaryCurrency)}**. You're breaking even! 💰`;
    }
  }

  // Monthly spending with date range support
  if (lowerMessage.match(/\b(this month|current month|monthly|per month|last month|previous month|this week|last week|this year|last year)\b/)) {
    if (dateRange) {
      const expenseTransactions = transactions.filter((t: any) => t.type === 'expense');
      const filteredExpenses = filterTransactionsByDate(expenseTransactions, dateRange);
      const totalSpent = filteredExpenses.reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
      
      if (filteredExpenses.length === 0) {
        return `You didn't record any expenses in ${dateRange.label.toLowerCase()}.`;
      }
      
      // Compare with previous period if available
      let comparison = '';
      if (dateRange.label === 'This Month') {
        comparison = summary.lastMonthExpenses > 0 
          ? ` Last month you spent ${formatCurrency(summary.lastMonthExpenses, summary.primaryCurrency)}.`
          : '';
      }
      
      return `In ${dateRange.label.toLowerCase()}, you spent ${formatCurrency(totalSpent, summary.primaryCurrency)}.${comparison}`;
    }
    
    return `This month, you've spent ${formatCurrency(summary.thisMonthExpenses, summary.primaryCurrency)}. ` +
           (summary.lastMonthExpenses > 0 
             ? `Last month you spent ${formatCurrency(summary.lastMonthExpenses, summary.primaryCurrency)}.`
             : '');
  }

  // Account questions - improved matching
  if (matchesQuery(message, [
    '\\b(account|accounts|how many.*account)\\b',
    '\\b(what.*account|show.*account|list.*account|my accounts)\\b'
  ])) {
    if (accounts.length === 0) {
      return "You don't have any accounts yet. 🏦\n\nTo get started:\n1. Go to Accounts\n2. Click 'Add Account'\n3. Enter your account name, type, and initial balance\n\nThis helps Balanzo track your finances!";
    }
    const accountList = accounts.map((a: any) => `🏦 ${a.name} (${a.type}): ${formatCurrency(a.balance, a.currency)}`).join('\n');
    return `You have ${accounts.length} account${accounts.length > 1 ? 's' : ''}:\n\n${accountList}`;
  }

  // Transaction count - improved matching
  if (matchesQuery(message, [
    '\\b(transaction|transactions|how many.*transaction)\\b',
    '\\b(what.*transaction|count.*transaction|total.*transaction)\\b'
  ])) {
    if (summary.transactionCount === 0) {
      return "You don't have any transactions recorded yet. 📝\n\nTo add transactions:\n1. Go to Transactions\n2. Click 'Add Transaction'\n3. Choose Income or Expense\n4. Enter the details\n\nStart tracking to see your financial data!";
    }
    return `You have ${summary.transactionCount} transaction${summary.transactionCount > 1 ? 's' : ''} recorded. ` +
           `(${transactions.filter((t: any) => t.type === 'income').length} income, ` +
           `${transactions.filter((t: any) => t.type === 'expense').length} expense${transactions.filter((t: any) => t.type === 'expense').length > 1 ? 's' : ''})`;
  }

  // Recent transactions - improved matching
  if (matchesQuery(message, [
    '\\b(recent|latest|last|recently)\\b',
    '\\b(what.*recent|show.*recent|latest.*transaction|recent.*transaction)\\b'
  ])) {
    const recent = transactions.slice(0, 5);
    if (recent.length === 0) {
      return "You don't have any transactions yet. 📝\n\nTo see recent transactions:\n1. Go to Transactions\n2. Add some transactions (Income or Expense)\n3. Ask again to see your recent activity";
    }
    const recentList = recent.map((t: any) => {
      const icon = t.type === 'income' ? '💰' : '💸';
      const sign = t.type === 'income' ? '+' : '-';
      return `${icon} ${t.description}: ${sign}${formatCurrency(Math.abs(t.amount), summary.primaryCurrency)} (${t.category})`;
    }).join('\n');
    return `Here are your recent transactions:\n\n${recentList}`;
  }

  // Lend/Borrow questions - Enhanced
  if (lowerMessage.match(/\b(lent|borrow|loan|owe|owed|lend|who owes|who.*owe)\b/)) {
    const activeLent = lendBorrow.filter((lb: any) => lb.type === 'lent' && lb.status === 'active');
    const activeBorrowed = lendBorrow.filter((lb: any) => lb.type === 'borrowed' && lb.status === 'active');
    const overdueLent = lendBorrow.filter((lb: any) => {
      if (lb.type !== 'lent' || lb.status !== 'active') return false;
      const dueDate = lb.due_date ? new Date(lb.due_date) : null;
      return dueDate && dueDate < new Date();
    });
    
    if (activeLent.length === 0 && activeBorrowed.length === 0) {
      return "You don't have any active lend/borrow records.";
    }
    
    let response = '';
    
    // Who owes me
    if (lowerMessage.match(/\b(who.*owe|who owes|lent to)\b/)) {
      if (activeLent.length === 0) {
        return "No one currently owes you money.";
      }
      const lentList = activeLent.map((lb: any) => 
        `• ${lb.person_name}: ${formatCurrency(lb.amount, summary.primaryCurrency)}`
      ).join('\n');
      const totalLent = activeLent.reduce((sum: number, lb: any) => sum + lb.amount, 0);
      response = `People who owe you money:\n\n${lentList}\n\n💰 Total: ${formatCurrency(totalLent, summary.primaryCurrency)}`;
      
      if (overdueLent.length > 0) {
        response += `\n\n⚠️ Overdue: ${overdueLent.length} record${overdueLent.length > 1 ? 's' : ''}`;
      }
      return response;
    }
    
    // Who I owe
    if (lowerMessage.match(/\b(who.*i.*owe|i owe|borrowed from)\b/)) {
      if (activeBorrowed.length === 0) {
        return "You don't owe anyone money.";
      }
      const borrowedList = activeBorrowed.map((lb: any) => 
        `• ${lb.person_name}: ${formatCurrency(lb.amount, summary.primaryCurrency)}`
      ).join('\n');
      const totalBorrowed = activeBorrowed.reduce((sum: number, lb: any) => sum + lb.amount, 0);
      return `People you owe money to:\n\n${borrowedList}\n\n💸 Total: ${formatCurrency(totalBorrowed, summary.primaryCurrency)}`;
    }
    
    // General lend/borrow summary
    if (activeLent.length > 0) {
      const totalLent = activeLent.reduce((sum: number, lb: any) => sum + lb.amount, 0);
      response += `💰 You've lent ${formatCurrency(totalLent, summary.primaryCurrency)} to ${activeLent.length} person${activeLent.length > 1 ? 's' : ''}.\n`;
      if (overdueLent.length > 0) {
        response += `⚠️ ${overdueLent.length} ${overdueLent.length > 1 ? 'are' : 'is'} overdue.\n`;
      }
    }
    if (activeBorrowed.length > 0) {
      const totalBorrowed = activeBorrowed.reduce((sum: number, lb: any) => sum + lb.amount, 0);
      response += `💸 You've borrowed ${formatCurrency(totalBorrowed, summary.primaryCurrency)} from ${activeBorrowed.length} person${activeBorrowed.length > 1 ? 's' : ''}.`;
    }
    return response;
  }

  // Purchase questions
  if (lowerMessage.match(/\b(purchase|purchases|bought|buying)\b/)) {
    if (purchases.length === 0) {
      return "You don't have any purchases recorded yet.";
    }
    const totalPurchases = purchases.reduce((sum: number, p: any) => sum + p.amount, 0);
    const plannedPurchases = purchases.filter((p: any) => p.status === 'planned');
    return `You have ${purchases.length} purchase${purchases.length > 1 ? 's' : ''} recorded, ` +
           `totaling ${formatCurrency(totalPurchases, summary.primaryCurrency)}. ` +
           (plannedPurchases.length > 0 
             ? `${plannedPurchases.length} ${plannedPurchases.length > 1 ? 'are' : 'is'} still planned.`
             : '');
  }

  // Financial health / summary - improved matching
  if (matchesQuery(message, [
    '\\b(summary|overview|financial health|how.*doing|status)\\b',
    '\\b(what.*summary|show.*summary|financial.*overview|my.*status)\\b'
  ])) {
    if (summary.accountCount === 0 && summary.transactionCount === 0) {
      return "I don't have enough data to provide a financial summary yet. 📊\n\nTo get started:\n1. Add at least one account\n2. Add some transactions (Income or Expense)\n3. Ask again for your financial summary\n\nThis helps Balanzo give you better insights!";
    }
    const savingsRate = summary.totalIncome > 0 
      ? ((summary.netAmount / summary.totalIncome) * 100).toFixed(1)
      : '0';
    
    let summaryText = `Here's your financial summary:\n\n` +
           `💰 **Total Balance:** ${formatCurrency(summary.totalBalance, summary.primaryCurrency)}\n` +
           `📈 **Total Income:** ${formatCurrency(summary.totalIncome, summary.primaryCurrency)}\n` +
           `📉 **Total Expenses:** ${formatCurrency(summary.totalExpenses, summary.primaryCurrency)}\n` +
           `💵 **Net Amount:** ${formatCurrency(summary.netAmount, summary.primaryCurrency)}`;
    
    if (summary.totalIncome > 0) {
      summaryText += `\n📊 **Savings Rate:** ${savingsRate}%`;
      const savingsRateNum = parseFloat(savingsRate);
      if (savingsRateNum > 20) {
        summaryText += ` - Excellent! 🎉`;
      } else if (savingsRateNum > 10) {
        summaryText += ` - Good job! 👍`;
      }
    }
    
    summaryText += `\n🏦 **Accounts:** ${summary.accountCount}\n` +
           `📝 **Transactions:** ${summary.transactionCount}`;
    
    return summaryText;
  }

  // Budget questions - improved matching
  if (matchesQuery(message, [
    '\\b(budget|over budget|under budget|budget left|budget remaining)\\b',
    '\\b(what.*budget|show.*budget|budget.*status|budget.*remaining)\\b'
  ])) {
    const budgetEntries = Object.entries(budgets);
    if (budgetEntries.length === 0) {
      return "You don't have any budgets set up yet. 💵\n\nTo set up budgets:\n1. Go to Categories or Budgets\n2. Set monthly budget limits for your spending categories\n3. Ask again to see your budget status\n\nThis helps you track spending against your goals!";
    }

    const overBudget: string[] = [];
    const underBudget: string[] = [];
    const onTrack: string[] = [];

    budgetEntries.forEach(([category, data]: [string, any]) => {
      const { budget, spent } = data;
      const remaining = budget - spent;
      const percentage = (spent / budget) * 100;

      if (spent > budget) {
        overBudget.push(`${category}: ${formatCurrency(spent, summary.primaryCurrency)} spent (${formatCurrency(budget, summary.primaryCurrency)} budget) - Over by ${formatCurrency(remaining, summary.primaryCurrency)}`);
      } else if (percentage >= 80) {
        onTrack.push(`${category}: ${formatCurrency(spent, summary.primaryCurrency)} / ${formatCurrency(budget, summary.primaryCurrency)} (${percentage.toFixed(1)}%)`);
      } else {
        underBudget.push(`${category}: ${formatCurrency(remaining, summary.primaryCurrency)} remaining (${percentage.toFixed(1)}% used)`);
      }
    });

    let response = `Here's your budget status:\n\n`;
    if (overBudget.length > 0) {
      response += `⚠️ Over Budget:\n${overBudget.map(b => `• ${b}`).join('\n')}\n\n`;
    }
    if (onTrack.length > 0) {
      response += `📊 On Track (80%+):\n${onTrack.map(b => `• ${b}`).join('\n')}\n\n`;
    }
    if (underBudget.length > 0) {
      response += `✅ Under Budget:\n${underBudget.map(b => `• ${b}`).join('\n')}`;
    }

    return response;
  }

  // Savings goals questions
  if (lowerMessage.match(/\b(savings goal|savings goals|goal progress|how.*goal|target)\b/)) {
    if (savingsGoals.length === 0) {
      return "You don't have any savings goals set up yet. Create a savings goal to track your progress!";
    }

    const goalsList = savingsGoals.map((goal: any) => {
      const progressBar = '█'.repeat(Math.floor(goal.progress / 5)) + '░'.repeat(20 - Math.floor(goal.progress / 5));
      const status = goal.progress >= 100 ? '✅ Completed!' : goal.daysRemaining < 0 ? '⚠️ Overdue' : `${goal.daysRemaining} days left`;
      return `🎯 ${goal.name}:\n` +
             `   Progress: ${progressBar} ${goal.progress.toFixed(1)}%\n` +
             `   ${formatCurrency(goal.currentAmount, summary.primaryCurrency)} / ${formatCurrency(goal.targetAmount, summary.primaryCurrency)}\n` +
             `   Remaining: ${formatCurrency(goal.remaining, summary.primaryCurrency)}\n` +
             `   ${status}`;
    }).join('\n\n');

    return `Here's your savings goals progress:\n\n${goalsList}`;
  }

  // Investment questions
  if (lowerMessage.match(/\b(investment|portfolio|investments|portfolio value|return|gain|loss)\b/)) {
    if (investments.assetCount === 0) {
      return "You don't have any investments recorded yet. Add investment assets to track your portfolio!";
    }

    const gainLossIcon = investments.totalGainLoss >= 0 ? '📈' : '📉';
    const gainLossText = investments.totalGainLoss >= 0 ? 'gain' : 'loss';

    return `Here's your investment portfolio:\n\n` +
           `💰 Portfolio Value: ${formatCurrency(investments.totalPortfolioValue, summary.primaryCurrency)}\n` +
           `💵 Cost Basis: ${formatCurrency(investments.totalCostBasis, summary.primaryCurrency)}\n` +
           `${gainLossIcon} Total ${gainLossText}: ${formatCurrency(Math.abs(investments.totalGainLoss), summary.primaryCurrency)}\n` +
           `📊 Return: ${investments.returnPercentage.toFixed(2)}%\n` +
           `🏦 Assets: ${investments.assetCount}`;
  }

  // Trends & comparisons
  if (lowerMessage.match(/\b(compare|comparison|trend|increase|decrease|more|less|vs|versus)\b/)) {
    if (summary.lastMonthExpenses === 0 && summary.thisMonthExpenses === 0) {
      return "You don't have enough spending data to compare months yet.";
    }

    const difference = summary.thisMonthExpenses - summary.lastMonthExpenses;
    const percentageChange = summary.lastMonthExpenses > 0 
      ? ((difference / summary.lastMonthExpenses) * 100).toFixed(1)
      : '0.0';

    let trendMessage = '';
    if (difference > 0) {
      trendMessage = `📈 Your spending increased by ${formatCurrency(Math.abs(difference), summary.primaryCurrency)} (${percentageChange}%) compared to last month.`;
    } else if (difference < 0) {
      trendMessage = `📉 Great! Your spending decreased by ${formatCurrency(Math.abs(difference), summary.primaryCurrency)} (${Math.abs(parseFloat(percentageChange))}%) compared to last month.`;
    } else {
      trendMessage = `➡️ Your spending stayed the same compared to last month.`;
    }

    return `Month-over-Month Comparison:\n\n` +
           `This Month: ${formatCurrency(summary.thisMonthExpenses, summary.primaryCurrency)}\n` +
           `Last Month: ${formatCurrency(summary.lastMonthExpenses, summary.primaryCurrency)}\n\n` +
           trendMessage;
  }

  // Predictive insights & forecasts
  if (lowerMessage.match(/\b(forecast|prediction|projected|projection|will spend|spending forecast|end of month)\b/)) {
    if (analytics.dailyAverage === 0) {
      return "I need more spending data to make accurate forecasts. Try again after recording some expenses this month.";
    }

    const now = new Date();
    const daysRemaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    const projectedTotal = analytics.projectedMonthEnd;

    let forecastMessage = `📊 Spending Forecast:\n\n` +
           `Current spending: ${formatCurrency(summary.thisMonthExpenses, summary.primaryCurrency)}\n` +
           `Daily average: ${formatCurrency(analytics.dailyAverage, summary.primaryCurrency)}\n` +
           `Projected month-end: ${formatCurrency(projectedTotal, summary.primaryCurrency)}\n` +
           `Days remaining: ${daysRemaining}\n\n`;

    if (analytics.avgMonthlySpending > 0) {
      const variance = projectedTotal - analytics.avgMonthlySpending;
      const variancePercent = ((variance / analytics.avgMonthlySpending) * 100).toFixed(1);
      
      if (variance > 0) {
        forecastMessage += `⚠️ You're projected to spend ${formatCurrency(Math.abs(variance), summary.primaryCurrency)} more than your average (${variancePercent}% increase).`;
      } else {
        forecastMessage += `✅ You're on track to spend ${formatCurrency(Math.abs(variance), summary.primaryCurrency)} less than your average (${Math.abs(parseFloat(variancePercent))}% decrease).`;
      }
    }

    return forecastMessage;
  }

  // Burn rate / runway analysis
  if (lowerMessage.match(/\b(burn rate|runway|how long|months left|until zero|until broke)\b/)) {
    if (analytics.monthsUntilZero === null) {
      if (analytics.netMonthlyRate > 0) {
        return `✅ Great news! You're saving ${formatCurrency(analytics.netMonthlyRate, summary.primaryCurrency)} per month. Your balance is growing!`;
      } else {
        return "I need more data to calculate your burn rate. Make sure you have income and expense transactions recorded.";
      }
    }

    return `🔥 Burn Rate Analysis:\n\n` +
           `Current balance: ${formatCurrency(summary.totalBalance, summary.primaryCurrency)}\n` +
           `Monthly net: ${formatCurrency(analytics.netMonthlyRate, summary.primaryCurrency)}\n` +
           `⚠️ At current spending rate, you'll run out of money in approximately ${analytics.monthsUntilZero} month${analytics.monthsUntilZero > 1 ? 's' : ''}.\n\n` +
           `💡 Consider reducing expenses or increasing income to extend your runway.`;
  }

  // Anomaly detection
  if (lowerMessage.match(/\b(anomaly|unusual|spike|unexpected|abnormal|outlier)\b/)) {
    if (analytics.categoryAnomalies.length === 0) {
      return "✅ No unusual spending patterns detected this month. Your spending looks normal!";
    }

    const anomaliesList = analytics.categoryAnomalies.map(anomaly => 
      `⚠️ ${anomaly.category}: ${formatCurrency(anomaly.thisMonth, summary.primaryCurrency)} this month (avg: ${formatCurrency(anomaly.avgMonth, summary.primaryCurrency)}) - ${anomaly.increase.toFixed(1)}% increase`
    ).join('\n');

    return `🚨 Unusual Spending Detected:\n\n${anomaliesList}\n\n💡 These categories show significantly higher spending than your 3-month average.`;
  }

  // Spending velocity
  if (lowerMessage.match(/\b(velocity|spending rate|daily spending|spending pace|spend per day)\b/)) {
    if (analytics.dailyAverage === 0) {
      return "I need spending data from this month to calculate your spending velocity.";
    }

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const percentOfMonth = (dayOfMonth / daysInMonth) * 100;
    const percentSpent = analytics.avgMonthlySpending > 0 
      ? (summary.thisMonthExpenses / analytics.avgMonthlySpending) * 100
      : 0;

    let velocityMessage = `⚡ Spending Velocity:\n\n` +
           `Daily average: ${formatCurrency(analytics.dailyAverage, summary.primaryCurrency)}\n` +
           `Month progress: ${percentOfMonth.toFixed(1)}% (day ${dayOfMonth} of ${daysInMonth})\n` +
           `Spent so far: ${formatCurrency(summary.thisMonthExpenses, summary.primaryCurrency)}\n\n`;

    if (analytics.avgMonthlySpending > 0) {
      if (percentSpent > percentOfMonth * 1.2) {
        velocityMessage += `⚠️ You're spending faster than usual. You've used ${percentSpent.toFixed(1)}% of your average monthly spending with only ${percentOfMonth.toFixed(1)}% of the month elapsed.`;
      } else if (percentSpent < percentOfMonth * 0.8) {
        velocityMessage += `✅ You're spending slower than usual. Great job managing your expenses!`;
      } else {
        velocityMessage += `➡️ Your spending pace is on track with your average.`;
      }
    }

    return velocityMessage;
  }

  // Multi-currency analysis
  if (lowerMessage.match(/\b(multi.*currency|currency breakdown|by currency|all currencies|currency analysis)\b/)) {
    const currencyKeys = Object.keys(currencies);
    if (currencyKeys.length <= 1) {
      return `You're using a single currency (${summary.primaryCurrency}). Multi-currency analysis is available when you have accounts in different currencies.`;
    }

    const currencyList = currencyKeys.map(curr => {
      const data = currencies[curr];
      return `${curr}:\n` +
             `  💰 Balance: ${formatCurrency(data.balance, curr)}\n` +
             `  📈 Income: ${formatCurrency(data.income, curr)}\n` +
             `  📉 Expenses: ${formatCurrency(data.expenses, curr)}\n` +
             `  💵 Net: ${formatCurrency(data.income - data.expenses, curr)}`;
    }).join('\n\n');

    return `🌍 Multi-Currency Breakdown:\n\n${currencyList}`;
  }

  // Smart recommendations
  if (lowerMessage.match(/\b(recommend|suggestion|advice|tip|should|what should|how to improve)\b/)) {
    const recommendations: string[] = [];

    // Budget recommendations
    const budgetEntries = Object.entries(budgets);
    budgetEntries.forEach(([category, data]: [string, any]) => {
      const { budget, spent } = data;
      const percentage = (spent / budget) * 100;
      if (percentage >= 90) {
        recommendations.push(`⚠️ ${category} budget is at ${percentage.toFixed(1)}%. Consider reducing spending or increasing budget.`);
      }
    });

    // Anomaly-based recommendations
    if (analytics.categoryAnomalies.length > 0) {
      const topAnomaly = analytics.categoryAnomalies[0];
      recommendations.push(`💡 ${topAnomaly.category} spending is ${topAnomaly.increase.toFixed(1)}% above average. Review recent transactions in this category.`);
    }

    // Burn rate recommendations
    if (analytics.monthsUntilZero !== null && analytics.monthsUntilZero < 6) {
      recommendations.push(`🔥 Your runway is only ${analytics.monthsUntilZero} months. Focus on reducing expenses or increasing income.`);
    }

    // Savings goals recommendations
    savingsGoals.forEach((goal: any) => {
      if (goal.daysRemaining > 0 && goal.daysRemaining < 30 && goal.progress < 80) {
        const neededPerDay = goal.remaining / goal.daysRemaining;
        recommendations.push(`🎯 "${goal.name}" needs ${formatCurrency(neededPerDay, summary.primaryCurrency)} per day to meet your target.`);
      }
    });

    // Spending velocity recommendations
    if (analytics.avgMonthlySpending > 0) {
      const percentSpent = (summary.thisMonthExpenses / analytics.avgMonthlySpending) * 100;
      const now = new Date();
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const percentOfMonth = (dayOfMonth / daysInMonth) * 100;
      
      if (percentSpent > percentOfMonth * 1.2) {
        recommendations.push(`⚡ You're spending ${percentSpent.toFixed(1)}% of your monthly average with only ${percentOfMonth.toFixed(1)}% of the month elapsed. Slow down spending to stay on track.`);
      }
    }

    if (recommendations.length === 0) {
      return `✅ Your finances look healthy! No urgent recommendations at this time. Keep up the good work! 💪`;
    }

    return `💡 Smart Recommendations:\n\n${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n\n')}`;
  }

  // Help / what can you do - improved matching
  if (matchesQuery(message, [
    '\\b(help|what can|what do|how can|assist|support)\\b',
    '\\b(what.*help|show.*help|what.*you.*do|capabilities)\\b'
  ])) {
    return `Hi! I'm Balanzo, your financial assistant. I can help you with:\n\n` +
           `💰 Check your account balances\n` +
           `📈 View your income and expenses\n` +
           `📊 See spending by category\n` +
           `📋 Get your financial summary\n` +
           `🕐 View recent transactions\n` +
           `🤝 Check lend/borrow records\n` +
           `📅 Monthly/weekly/yearly spending analysis\n` +
           `💵 Budget tracking and status\n` +
           `🎯 Savings goals progress\n` +
           `📈 Investment portfolio\n` +
           `📊 Trends and comparisons\n\n` +
           `💡 Try asking:\n` +
           `• "What's my balance?"\n` +
           `• "How much did I spend this month?"\n` +
           `• "Am I over budget?"\n` +
           `• "How are my savings goals?"\n` +
           `• "What's my portfolio value?"\n` +
           `• "Compare this month vs last month"`;
  }

  // Default response - improved with suggestions and conversation awareness
  const expandedTerms = expandQueryWithSynonyms(message.toLowerCase());
  const hasFinancialTerms = expandedTerms.some(term => 
    ['balance', 'income', 'expense', 'spending', 'account', 'transaction', 'budget', 'savings'].includes(term)
  );
  
  // Use conversation context for better responses
  if (isFollowUp && recentAssistantMessages.length > 0) {
    // If this is a follow-up, try to provide more context
    const lastTopic = recentUserMessages[recentUserMessages.length - 1] || '';
    if (lastTopic.includes('balance') || lastTopic.includes('account')) {
      return `Here's more about your accounts:\n\n` +
             `You have ${accounts.length} account${accounts.length > 1 ? 's' : ''} with a total balance of ${formatCurrency(summary.totalBalance, summary.primaryCurrency)}.\n\n` +
             `Would you like to know about your spending, income, or something else?`;
    }
    if (lastTopic.includes('spend') || lastTopic.includes('expense')) {
      return `Here's more about your spending:\n\n` +
             `Your total expenses are ${formatCurrency(summary.totalExpenses, summary.primaryCurrency)}.\n` +
             `This month you've spent ${formatCurrency(summary.thisMonthExpenses, summary.primaryCurrency)}.\n\n` +
             `Would you like to see spending by category, compare with last month, or something else?`;
    }
  }
  
  if (hasFinancialTerms) {
    return `I understand you're asking about "${message}". Let me help! 💡\n\n` +
           `I can help you with:\n` +
           `• Account balances - "What's my balance?"\n` +
           `• Income and expenses - "How much did I spend?"\n` +
           `• Spending by category - "Show spending by category"\n` +
           `• Financial summaries - "What's my financial summary?"\n` +
           `• Recent transactions - "Show recent transactions"\n\n` +
           `Try rephrasing your question, or ask "help" to see all my capabilities!`;
  }
  
  // Check if user is asking about something we just discussed
  if (recentAssistantMessages.length > 0) {
    return `I understand you're asking about "${message}". 💰\n\n` +
           `Based on our conversation, I can help you with:\n` +
           `• More details about what we just discussed\n` +
           `• Different aspects of your finances\n` +
           `• Comparisons or trends\n\n` +
           `Try asking: "What's my balance?" or "How much did I spend this month?"\n` +
           `Or ask "help" to see everything I can do!`;
  }
  
  return `I understand you're asking about "${message}". I'm Balanzo, your financial assistant! 💰\n\n` +
         `I can help you with:\n` +
         `• Account balances\n` +
         `• Income and expenses\n` +
         `• Spending by category\n` +
         `• Financial summaries\n` +
         `• Recent transactions\n\n` +
         `Try asking: "What's my balance?" or "How much did I spend this month?"\n` +
         `Or ask "help" to see everything I can do!`;
}

// Main service function - uses API in production, client-side in development
// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getAIResponse(message: string, userId: string, retryCount = 0): Promise<string> {
  // Check cache first
  const cachedResponse = getCachedResponse(message, userId);
  if (cachedResponse) {
    return cachedResponse;
  }

  const isDevelopment = import.meta.env.DEV;

  try {
    let response: string;

    if (isDevelopment) {
      // Use client-side processing in development
      const userContext = await gatherUserContext(userId);
      const history = getConversationHistory(userId);
      response = generateResponse(message, userContext, history);
    } else {
      // Use API endpoint in production
      const fetchResponse = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId,
        }),
      });

      if (!fetchResponse.ok) {
        // Retry on server errors (5xx)
        if (fetchResponse.status >= 500 && retryCount < MAX_RETRIES) {
          await sleep(RETRY_DELAY * (retryCount + 1));
          return getAIResponse(message, userId, retryCount + 1);
        }
        const errorData = await fetchResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${fetchResponse.status}`);
      }

      const data = await fetchResponse.json();
      if (!data.response || typeof data.response !== 'string') {
        throw new Error('Invalid response from server');
      }

      response = data.response;
    }

    // Cache the response
    setCachedResponse(message, userId, response);
    
    // Add to conversation history
    addToConversationHistory(userId, 'user', message);
    addToConversationHistory(userId, 'assistant', response);
    
    return response;
  } catch (error) {
    console.error('AI service error:', error);
    
    // Retry logic for network errors
    if (retryCount < MAX_RETRIES && error instanceof Error && 
        (error.message.includes('fetch') || error.message.includes('network'))) {
      await sleep(RETRY_DELAY * (retryCount + 1));
      return getAIResponse(message, userId, retryCount + 1);
    }

    // Fallback to client-side processing
    try {
      const userContext = await gatherUserContext(userId);
      const history = getConversationHistory(userId);
      const fallbackResponse = generateResponse(message, userContext, history);
      // Cache fallback response too
      setCachedResponse(message, userId, fallbackResponse);
      
      // Add to conversation history
      addToConversationHistory(userId, 'user', message);
      addToConversationHistory(userId, 'assistant', fallbackResponse);
      
      return fallbackResponse;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      throw new Error('Unable to process your request. Please try again later.');
    }
  }
}


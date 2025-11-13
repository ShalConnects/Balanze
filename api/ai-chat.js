import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Helper function to format currency with commas
function formatCurrency(amount, currency = 'USD') {
  const symbols = {
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

// Helper function to gather user financial context
async function gatherUserContext(userId) {
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

    // Check for errors in results
    if (accountsResult.error) {
      console.error('Error fetching accounts:', accountsResult.error);
    }
    if (transactionsResult.error) {
      console.error('Error fetching transactions:', transactionsResult.error);
    }
    if (purchasesResult.error) {
      console.error('Error fetching purchases:', purchasesResult.error);
    }
    if (lendBorrowResult.error) {
      console.error('Error fetching lend_borrow:', lendBorrowResult.error);
    }

    const accounts = accountsResult.data || [];
    const allTransactions = transactionsResult.data || [];
    const purchases = purchasesResult.data || [];
    const lendBorrow = lendBorrowResult.data || [];
    const savingsGoals = savingsGoalsResult.data || [];
    const categories = categoriesResult.data || [];
    const investmentAssets = investmentAssetsResult.data || [];

    // Filter out transfers
    const transactions = allTransactions.filter(t => {
      const tags = t.tags || [];
      return !tags.some(tag => tag.includes('transfer') || tag.includes('dps_transfer'));
    });

    // Calculate summary statistics
    const totalBalance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
    const netAmount = totalIncome - totalExpenses;

    // Category breakdown
    const categoryBreakdown = {};
    expenseTransactions.forEach(t => {
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
      .filter(t => {
        const date = new Date(t.created_at || t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    const lastMonthExpenses = expenseTransactions
      .filter(t => {
        const date = new Date(t.created_at || t.date);
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      })
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);

    // Get primary currency and multi-currency breakdown
    const currencies = [...new Set(accounts.map(a => a.currency))];
    const primaryCurrency = currencies[0] || 'USD';

    // Calculate budget data (from categories with monthly_budget)
    const budgetData = {};
    categories.forEach(cat => {
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
    const now = new Date();
    const savingsGoalsProgress = savingsGoals.map(goal => {
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
    const totalPortfolioValue = investmentAssets.reduce((sum, asset) => {
      return sum + (parseFloat(asset.current_value || asset.total_value || 0));
    }, 0);

    const totalCostBasis = investmentAssets.reduce((sum, asset) => {
      return sum + (parseFloat(asset.cost_basis || 0));
    }, 0);

    const totalGainLoss = totalPortfolioValue - totalCostBasis;
    const returnPercentage = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

    // Advanced Analytics: Historical spending data (last 6 months)
    const monthlySpending = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthNum = date.getMonth();
      const year = date.getFullYear();
      const monthName = date.toLocaleString('default', { month: 'long' });
      
      const monthExpenses = expenseTransactions
        .filter(t => {
          const tDate = new Date(t.created_at || t.date);
          return tDate.getMonth() === monthNum && tDate.getFullYear() === year;
        })
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
      
      monthlySpending.push({ month: monthName, amount: monthExpenses, year, monthNum });
    }

    // Calculate average monthly spending
    const avgMonthlySpending = monthlySpending.length > 0
      ? monthlySpending.reduce((sum, m) => sum + m.amount, 0) / monthlySpending.length
      : 0;

    // Calculate spending velocity (daily average this month)
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const dailyAverage = dayOfMonth > 0 ? thisMonthExpenses / dayOfMonth : 0;
    const projectedMonthEnd = dailyAverage * daysInMonth;

    // Burn rate (how long until balance runs out at current spending rate)
    const monthlyIncome = incomeTransactions
      .filter(t => {
        const tDate = new Date(t.created_at || t.date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const netMonthlyRate = monthlyIncome - thisMonthExpenses;
    const monthsUntilZero = netMonthlyRate < 0 && totalBalance > 0
      ? Math.floor(totalBalance / Math.abs(netMonthlyRate))
      : null;

    // Anomaly detection: find categories with unusually high spending this month
    const categoryAnomalies = [];
    Object.entries(categoryBreakdown).forEach(([category, thisMonthSpent]) => {
      // Calculate average for this category over last 3 months
      const last3MonthsAvg = monthlySpending.slice(0, 3).reduce((sum, monthData) => {
        const monthExpenses = expenseTransactions
          .filter(t => {
            const tDate = new Date(t.created_at || t.date);
            return tDate.getMonth() === monthData.monthNum && 
                   tDate.getFullYear() === monthData.year &&
                   (t.category || 'Uncategorized') === category;
          })
          .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
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

    // Multi-currency analysis
    const currencyBreakdown = {};
    currencies.forEach(curr => {
      const currencyAccounts = accounts.filter(a => a.currency === curr);
      const currencyBalance = currencyAccounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
      
      const currencyIncome = incomeTransactions
        .filter(t => {
          const account = accounts.find(a => a.id === t.account_id);
          return account && account.currency === curr;
        })
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
      const currencyExpenses = expenseTransactions
        .filter(t => {
          const account = accounts.find(a => a.id === t.account_id);
          return account && account.currency === curr;
        })
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
      
      currencyBreakdown[curr] = {
        balance: currencyBalance,
        income: currencyIncome,
        expenses: currencyExpenses,
      };
    });

    return {
      accounts: accounts.map(a => ({
        name: a.name || 'Unnamed Account',
        type: a.type || 'other',
        balance: parseFloat(a.balance) || 0,
        currency: a.currency || 'USD',
      })),
      transactions: transactions.map(t => ({
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
      purchases: purchases.map(p => ({
        item_name: p.item_name || 'Unnamed Item',
        amount: parseFloat(p.amount) || parseFloat(p.price) || 0,
        status: p.status || 'purchased',
      })),
      lendBorrow: lendBorrow.map(lb => ({
        person_name: lb.person_name || 'Unknown',
        amount: parseFloat(lb.amount) || 0,
        type: lb.type || 'lent',
        status: lb.status || 'active',
        due_date: lb.due_date || null,
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
  } catch (error) {
    console.error('Error gathering user context:', error);
    console.error('Error stack:', error.stack);
    // Return empty context instead of null to prevent crashes
    return {
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
  }
}

// Helper function to get date range from query
function getDateRangeFromQuery(message) {
  const lowerMessage = message.toLowerCase();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Last month
  if (lowerMessage.match(/\b(last month|previous month)\b/)) {
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return {
      start: new Date(lastMonthYear, lastMonth, 1),
      end: new Date(lastMonthYear, lastMonth + 1, 0),
      label: 'Last Month'
    };
  }
  
  // This month
  if (lowerMessage.match(/\b(this month|current month)\b/)) {
    return {
      start: new Date(currentYear, currentMonth, 1),
      end: new Date(currentYear, currentMonth + 1, 0),
      label: 'This Month'
    };
  }
  
  // Last week
  if (lowerMessage.match(/\b(last week|previous week)\b/)) {
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() + diffToMonday - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
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
    monday.setDate(now.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday,
      end: sunday,
      label: 'This Week'
    };
  }
  
  // This year
  if (lowerMessage.match(/\b(this year|current year)\b/)) {
    return {
      start: new Date(currentYear, 0, 1),
      end: new Date(currentYear, 11, 31),
      label: 'This Year'
    };
  }
  
  // Last year
  if (lowerMessage.match(/\b(last year|previous year)\b/)) {
    return {
      start: new Date(currentYear - 1, 0, 1),
      end: new Date(currentYear - 1, 11, 31),
      label: 'Last Year'
    };
  }
  
  // Specific month
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
  for (let i = 0; i < monthNames.length; i++) {
    if (lowerMessage.includes(monthNames[i])) {
      const isLastYear = lowerMessage.includes('last year') || 
                        (i > currentMonth && !lowerMessage.includes('this year'));
      const year = isLastYear ? currentYear - 1 : currentYear;
      return {
        start: new Date(year, i, 1),
        end: new Date(year, i + 1, 0),
        label: monthNames[i].charAt(0).toUpperCase() + monthNames[i].slice(1)
      };
    }
  }
  
  return null;
}

// Helper function to filter transactions by date range
function filterTransactionsByDate(transactions, dateRange) {
  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
  });
}

// Rule-based response generator
function generateResponse(message, context) {
  const lowerMessage = message.toLowerCase().trim();
  const { accounts, transactions, summary, purchases, lendBorrow, budgets, savingsGoals, investments, analytics, currencies } = context;
  
  // Check for date range in query
  const dateRange = getDateRangeFromQuery(message);

  // Balance questions
  if (lowerMessage.match(/\b(balance|total balance|how much money|current balance|account balance)\b/)) {
    if (accounts.length === 0) {
      return "You don't have any accounts set up yet. Add an account to start tracking your balance!";
    }
    const accountList = accounts.map(a => `💰 ${a.name}: ${formatCurrency(a.balance, a.currency)}`).join('\n');
    return `Here's your account balance:\n\n${accountList}\n\n💵 Total Balance: ${formatCurrency(summary.totalBalance, summary.primaryCurrency)}`;
  }

  // Income questions with date range support
  if (lowerMessage.match(/\b(income|earned|earning|salary|how much.*income|total income)\b/)) {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    
    if (dateRange) {
      const filteredIncome = filterTransactionsByDate(incomeTransactions, dateRange);
      const totalIncome = filteredIncome.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      if (filteredIncome.length === 0) {
        return `You didn't record any income in ${dateRange.label.toLowerCase()}.`;
      }
      return `Your income in ${dateRange.label.toLowerCase()} was ${formatCurrency(totalIncome, summary.primaryCurrency)}. You had ${filteredIncome.length} income transaction${filteredIncome.length > 1 ? 's' : ''}.`;
    }
    
    if (incomeTransactions.length === 0) {
      return "You haven't recorded any income yet. Add an income transaction to start tracking!";
    }
    return `Your total income is ${formatCurrency(summary.totalIncome, summary.primaryCurrency)}. You have ${incomeTransactions.length} income transactions recorded.`;
  }

  // Top spending categories (check before general expense questions)
  if (lowerMessage.match(/\b(top|highest|most|biggest).*?(spend|expense|category|categories)\b/)) {
    const topCategories = Object.entries(summary.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    if (topCategories.length === 0) {
      return "You don't have enough spending data yet to show top categories.";
    }
    const categoryList = topCategories.map(([cat, amount], idx) => {
      const percentage = summary.totalExpenses > 0 
        ? ((amount / summary.totalExpenses) * 100).toFixed(1)
        : '0.0';
      return `${idx + 1}. 📊 ${cat}: ${formatCurrency(amount, summary.primaryCurrency)} (${percentage}%)`;
    }).join('\n');
    return `Here are your top spending categories:\n\n${categoryList}`;
  }

  // Spending by category / category breakdown (check before general expense)
  if (lowerMessage.match(/\b(spending|spend|expense).*?(by|per|category|categories|breakdown)\b/)) {
    const topCategories = Object.entries(summary.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    if (topCategories.length === 0) {
      return "You don't have any spending by category yet. Add some expense transactions to see category breakdown!";
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
        cat => cat.toLowerCase().includes(categoryName.toLowerCase()) || categoryName.toLowerCase().includes(cat.toLowerCase())
      );
      if (matchingCategory) {
        const amount = summary.categoryBreakdown[matchingCategory];
        return `You've spent ${formatCurrency(amount, summary.primaryCurrency)} on ${matchingCategory}.`;
      }
    }
  }

  // General expense questions with date range support (check last, after category-specific checks)
  if (lowerMessage.match(/\b(expense|spent|spending|how much.*spend|total expense|cost)\b/)) {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    if (dateRange) {
      const filteredExpenses = filterTransactionsByDate(expenseTransactions, dateRange);
      const totalSpent = filteredExpenses.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
      
      if (filteredExpenses.length === 0) {
        return `You didn't record any expenses in ${dateRange.label.toLowerCase()}.`;
      }
      
      return `In ${dateRange.label.toLowerCase()}, you spent ${formatCurrency(totalSpent, summary.primaryCurrency)}. You had ${filteredExpenses.length} expense transaction${filteredExpenses.length > 1 ? 's' : ''}.`;
    }
    
    if (expenseTransactions.length === 0) {
      return "You haven't recorded any expenses yet. Add an expense transaction to start tracking!";
    }
    return `Your total expenses are ${formatCurrency(summary.totalExpenses, summary.primaryCurrency)}. You have ${expenseTransactions.length} expense transactions recorded.`;
  }

  // Net amount / savings
  if (lowerMessage.match(/\b(net|savings|saved|left over|remaining|difference)\b/)) {
    const net = summary.netAmount;
    if (net > 0) {
      return `Great news! You have a positive net amount of ${formatCurrency(net, summary.primaryCurrency)}. That means you're saving money! 💰`;
    } else if (net < 0) {
      return `Your net amount is ${formatCurrency(Math.abs(net), summary.primaryCurrency)} in the negative. Consider reviewing your expenses to improve your financial health.`;
    } else {
      return `Your income and expenses are balanced at ${formatCurrency(0, summary.primaryCurrency)}.`;
    }
  }

  // Monthly spending with date range support
  if (lowerMessage.match(/\b(this month|current month|monthly|per month|last month|previous month|this week|last week|this year|last year)\b/)) {
    if (dateRange) {
      const expenseTransactions = transactions.filter(t => t.type === 'expense');
      const filteredExpenses = filterTransactionsByDate(expenseTransactions, dateRange);
      const totalSpent = filteredExpenses.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0);
      
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

  // Account questions
  if (lowerMessage.match(/\b(account|accounts|how many.*account)\b/)) {
    if (accounts.length === 0) {
      return "You don't have any accounts yet. Add an account to get started!";
    }
    const accountList = accounts.map(a => `🏦 ${a.name} (${a.type}): ${formatCurrency(a.balance, a.currency)}`).join('\n');
    return `You have ${accounts.length} account${accounts.length > 1 ? 's' : ''}:\n\n${accountList}`;
  }

  // Transaction count
  if (lowerMessage.match(/\b(transaction|transactions|how many.*transaction)\b/)) {
    return `You have ${summary.transactionCount} transactions recorded. ` +
           `(${transactions.filter(t => t.type === 'income').length} income, ` +
           `${transactions.filter(t => t.type === 'expense').length} expenses)`;
  }

  // Recent transactions
  if (lowerMessage.match(/\b(recent|latest|last|recently)\b/)) {
    const recent = transactions.slice(0, 5);
    if (recent.length === 0) {
      return "You don't have any transactions yet.";
    }
    const recentList = recent.map(t => {
      const icon = t.type === 'income' ? '💰' : '💸';
      const sign = t.type === 'income' ? '+' : '-';
      return `${icon} ${t.description}: ${sign}${formatCurrency(Math.abs(t.amount), summary.primaryCurrency)} (${t.category})`;
    }).join('\n');
    return `Here are your recent transactions:\n\n${recentList}`;
  }

  // Budget questions
  if (lowerMessage.match(/\b(budget|over budget|under budget|budget left|budget remaining)\b/)) {
    const budgetEntries = Object.entries(budgets);
    if (budgetEntries.length === 0) {
      return "You don't have any budgets set up yet. Set monthly budgets for categories to track your spending!";
    }

    const overBudget = [];
    const underBudget = [];
    const onTrack = [];

    budgetEntries.forEach(([category, data]) => {
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

    const goalsList = savingsGoals.map(goal => {
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
    const recommendations = [];

    // Budget recommendations
    const budgetEntries = Object.entries(budgets);
    budgetEntries.forEach(([category, data]) => {
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
    savingsGoals.forEach(goal => {
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

  // Lend/Borrow questions - Enhanced
  if (lowerMessage.match(/\b(lent|borrow|loan|owe|owed|lend|who owes|who.*owe)\b/)) {
    const activeLent = lendBorrow.filter(lb => lb.type === 'lent' && lb.status === 'active');
    const activeBorrowed = lendBorrow.filter(lb => lb.type === 'borrowed' && lb.status === 'active');
    const overdueLent = lendBorrow.filter(lb => {
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
      const lentList = activeLent.map(lb => 
        `• ${lb.person_name}: ${formatCurrency(lb.amount, summary.primaryCurrency)}`
      ).join('\n');
      const totalLent = activeLent.reduce((sum, lb) => sum + lb.amount, 0);
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
      const borrowedList = activeBorrowed.map(lb => 
        `• ${lb.person_name}: ${formatCurrency(lb.amount, summary.primaryCurrency)}`
      ).join('\n');
      const totalBorrowed = activeBorrowed.reduce((sum, lb) => sum + lb.amount, 0);
      return `People you owe money to:\n\n${borrowedList}\n\n💸 Total: ${formatCurrency(totalBorrowed, summary.primaryCurrency)}`;
    }
    
    // General lend/borrow summary
    if (activeLent.length > 0) {
      const totalLent = activeLent.reduce((sum, lb) => sum + lb.amount, 0);
      response += `💰 You've lent ${formatCurrency(totalLent, summary.primaryCurrency)} to ${activeLent.length} person${activeLent.length > 1 ? 's' : ''}.\n`;
      if (overdueLent.length > 0) {
        response += `⚠️ ${overdueLent.length} ${overdueLent.length > 1 ? 'are' : 'is'} overdue.\n`;
      }
    }
    if (activeBorrowed.length > 0) {
      const totalBorrowed = activeBorrowed.reduce((sum, lb) => sum + lb.amount, 0);
      response += `💸 You've borrowed ${formatCurrency(totalBorrowed, summary.primaryCurrency)} from ${activeBorrowed.length} person${activeBorrowed.length > 1 ? 's' : ''}.`;
    }
    return response;
  }

  // Purchase questions
  if (lowerMessage.match(/\b(purchase|purchases|bought|buying)\b/)) {
    if (purchases.length === 0) {
      return "You don't have any purchases recorded yet.";
    }
    const totalPurchases = purchases.reduce((sum, p) => sum + p.amount, 0);
    const plannedPurchases = purchases.filter(p => p.status === 'planned');
    return `You have ${purchases.length} purchase${purchases.length > 1 ? 's' : ''} recorded, ` +
           `totaling ${formatCurrency(totalPurchases, summary.primaryCurrency)}. ` +
           (plannedPurchases.length > 0 
             ? `${plannedPurchases.length} ${plannedPurchases.length > 1 ? 'are' : 'is'} still planned.`
             : '');
  }

  // Financial health / summary
  if (lowerMessage.match(/\b(summary|overview|financial health|how.*doing|status)\b/)) {
    const savingsRate = summary.totalIncome > 0 
      ? ((summary.netAmount / summary.totalIncome) * 100).toFixed(1)
      : 0;
    
    return `Here's your financial summary:\n\n` +
           `💰 Total Balance: ${formatCurrency(summary.totalBalance, summary.primaryCurrency)}\n` +
           `📈 Total Income: ${formatCurrency(summary.totalIncome, summary.primaryCurrency)}\n` +
           `📉 Total Expenses: ${formatCurrency(summary.totalExpenses, summary.primaryCurrency)}\n` +
           `💵 Net Amount: ${formatCurrency(summary.netAmount, summary.primaryCurrency)}\n` +
           (summary.totalIncome > 0 
             ? `📊 Savings Rate: ${savingsRate}%\n`
             : '') +
           `🏦 Accounts: ${summary.accountCount}\n` +
           `📝 Transactions: ${summary.transactionCount}`;
  }

  // Help / what can you do
  if (lowerMessage.match(/\b(help|what can|what do|how can|assist|support)\b/)) {
    return `I can help you with:\n\n` +
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
           `📊 Trends and comparisons\n` +
           `🔮 Predictive forecasts\n` +
           `🚨 Anomaly detection\n` +
           `⚡ Spending velocity\n` +
           `🔥 Burn rate analysis\n` +
           `🌍 Multi-currency analysis\n` +
           `💡 Smart recommendations\n\n` +
           `💡 Try asking:\n` +
           `• "What's my balance?"\n` +
           `• "Spending forecast"\n` +
           `• "Burn rate"\n` +
           `• "Any unusual spending?"\n` +
           `• "Give me recommendations"\n` +
           `• "Multi-currency breakdown"`;
  }

  // Default response
  return `I understand you're asking about "${message}". I can help you with:\n\n` +
         `• Account balances\n` +
         `• Income and expenses\n` +
         `• Spending by category\n` +
         `• Financial summaries\n` +
         `• Recent transactions\n\n` +
         `Try asking: "What's my balance?" or "How much did I spend this month?"`;
}

// Main handler function
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Message and userId are required' });
    }

    console.log('Processing chat request:', { message: message.substring(0, 50), userId });

    // Gather user context
    const userContext = await gatherUserContext(userId);

    if (!userContext) {
      console.error('Failed to gather user context');
      return res.status(500).json({ error: 'Failed to gather user context' });
    }

    console.log('User context gathered:', {
      accountCount: userContext.accounts.length,
      transactionCount: userContext.transactions.length,
    });

    // Generate response using rule-based system
    let response;
    try {
      response = generateResponse(message, userContext);
    } catch (genError) {
      console.error('Error generating response:', genError);
      response = 'I apologize, but I encountered an error processing your question. Please try rephrasing it.';
    }

    if (!response || typeof response !== 'string') {
      console.error('Invalid response generated:', response);
      response = 'I apologize, but I couldn\'t generate a proper response. Please try again.';
    }

    return res.status(200).json({
      response: response,
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      error: 'An error occurred while processing your request',
      message: error.message || 'Unknown error',
    });
  }
}


// Lightweight context-detection utility for analytics humor.
// This is standalone and does not modify existing functionality.

export type TransactionLike = {
  amount: number; // positive for income, negative for expense, or use type field
  type?: string; // 'income' | 'expense' | ... (optional)
  category?: string;
  tags?: string[];
  date?: string | Date;
};

export type DetectUserContextInput = {
  monthlyIncome?: number; // optional if computing from transactions
  monthlyExpenses?: number; // optional if computing from transactions
  transactions?: TransactionLike[];
};

export type UserContext = {
  netIncome: number;
  savingsRate: number; // percentage 0..100
  tags: string[]; // e.g., ['savings_champion', 'category_dominant']
  primaryPersonalitySuggestion: 'cheerleader' | 'sarcastic' | 'coach' | 'wise';
  details: {
    dominantCategory?: string;
    dominantCategoryShare?: number; // 0..1
    donationShareOfExpenses?: number; // 0..1
    avgTransactionAmount?: number;
    smallTransactionCount?: number;
    largeTransactionCount?: number;
    totalTransactions?: number;
  };
};

const toNumber = (n: unknown): number => (typeof n === 'number' && isFinite(n) ? n : 0);

const isExpense = (t: TransactionLike): boolean => {
  if (typeof t.amount === 'number') return t.amount < 0;
  if (t.type) return t.type.toLowerCase() === 'expense';
  return false;
};

const isIncome = (t: TransactionLike): boolean => {
  if (typeof t.amount === 'number') return t.amount > 0;
  if (t.type) return t.type.toLowerCase() === 'income';
  return false;
};

export function detectUserContext(input: DetectUserContextInput): UserContext {
  const transactions = input.transactions ?? [];

  // Compute totals either from provided monthly figures or infer from transactions
  const inferredIncome = transactions.filter(isIncome).reduce((sum, t) => sum + Math.max(0, toNumber(t.amount)), 0);
  const inferredExpenses = transactions
    .filter(isExpense)
    .reduce((sum, t) => sum + Math.abs(toNumber(t.amount)), 0);

  const monthlyIncome = toNumber(input.monthlyIncome) || inferredIncome;
  const monthlyExpenses = toNumber(input.monthlyExpenses) || inferredExpenses;

  const netIncome = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.min(100, (netIncome / monthlyIncome) * 100)) : 0;

  // Category aggregation (expenses only)
  const categoryTotals: Record<string, number> = {};
  for (const t of transactions) {
    if (!isExpense(t)) continue;
    const cat = (t.category || 'Uncategorized').toLowerCase();
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(toNumber(t.amount));
  }

  const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || monthlyExpenses;
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const [dominantCategory, dominantAmount] = sortedCategories[0] || [undefined, 0];
  const dominantCategoryShare = totalExpense > 0 ? dominantAmount / totalExpense : 0;

  // Behavioral patterns
  const expenseTxns = transactions.filter(isExpense);
  const absAmounts = expenseTxns.map(t => Math.abs(toNumber(t.amount))).filter(a => a > 0);
  const totalTransactions = transactions.length;
  const avgTransactionAmount = absAmounts.length > 0 ? absAmounts.reduce((a, b) => a + b, 0) / absAmounts.length : 0;
  const smallTransactionCount = absAmounts.filter(a => a < 20).length;
  const largeTransactionCount = absAmounts.filter(a => a > 200).length;

  const donationTotal = Object.entries(categoryTotals)
    .filter(([cat]) => cat.includes('donation') || cat.includes('charity'))
    .reduce((sum, [, amt]) => sum + amt, 0);
  const donationShareOfExpenses = totalExpense > 0 ? donationTotal / totalExpense : 0;

  // Tags
  const tags: string[] = [];
  if (savingsRate >= 20) tags.push('savings_champion');
  if (netIncome < 0 && monthlyIncome > 0) tags.push('struggling_but_trying');
  if (Math.abs(netIncome) < monthlyIncome * 0.05 && monthlyIncome > 0) tags.push('balance_master');
  if (dominantCategoryShare > 0.4) tags.push('category_dominant');
  if (smallTransactionCount >= 5 && smallTransactionCount > absAmounts.length * 0.5) tags.push('impulse_buyer');
  if (largeTransactionCount >= 3 && largeTransactionCount > absAmounts.length * 0.5) tags.push('planned_spender');
  if (donationShareOfExpenses > 0.15 || donationTotal > 100) tags.push('charity_hero');
  if (totalTransactions > 0 && totalTransactions < 5) tags.push('minimalist');

  // Personality suggestion
  let primaryPersonalitySuggestion: UserContext['primaryPersonalitySuggestion'] = 'wise';
  if (savingsRate >= 30) primaryPersonalitySuggestion = 'cheerleader';
  else if (netIncome < 0) primaryPersonalitySuggestion = 'coach';
  else if (tags.includes('category_dominant') || tags.includes('impulse_buyer')) primaryPersonalitySuggestion = 'sarcastic';

  return {
    netIncome,
    savingsRate,
    tags,
    primaryPersonalitySuggestion,
    details: {
      dominantCategory,
      dominantCategoryShare,
      donationShareOfExpenses,
      avgTransactionAmount,
      smallTransactionCount,
      largeTransactionCount,
      totalTransactions,
    },
  };
}



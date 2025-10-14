import { Category, PurchaseCategory, Account } from '../types';

/**
 * Filter categories by currency
 * @param categories - Array of categories to filter
 * @param currency - Currency to filter by
 * @returns Filtered categories that match the currency
 */
export const filterCategoriesByCurrency = (
  categories: Category[],
  currency: string
): Category[] => {
  if (!currency) return categories;
  return categories.filter(category => category.currency === currency);
};

/**
 * Filter purchase categories by currency
 * @param categories - Array of purchase categories to filter
 * @param currency - Currency to filter by
 * @returns Filtered purchase categories that match the currency
 */
export const filterPurchaseCategoriesByCurrency = (
  categories: PurchaseCategory[],
  currency: string
): PurchaseCategory[] => {
  if (!currency) return categories;
  return categories.filter(category => category.currency === currency);
};

/**
 * Sort categories by currency and then by name
 * @param categories - Array of categories to sort
 * @returns Sorted categories
 */
export const sortCategoriesByCurrency = (categories: Category[]): Category[] => {

  
  const sorted = [...categories].sort((a, b) => {
    // First sort by currency
    const currencyA = a.currency || 'USD';
    const currencyB = b.currency || 'USD';
    
    if (currencyA !== currencyB) {
      return currencyA.localeCompare(currencyB);
    }
    
    // Then sort by name within the same currency
    return a.name.localeCompare(b.name);
  });
  

  
  // Check if all currencies are the same
  const currencies = [...new Set(sorted.map(c => c.currency || 'USD'))];

  
  if (currencies.length === 1) {

  }
  
  return sorted;
};

/**
 * Sort purchase categories by currency and then by name
 * @param categories - Array of purchase categories to sort
 * @returns Sorted purchase categories
 */
export const sortPurchaseCategoriesByCurrency = (categories: PurchaseCategory[]): PurchaseCategory[] => {
  const sorted = [...categories].sort((a, b) => {
    // First sort by currency
    const currencyA = a.currency || 'USD';
    const currencyB = b.currency || 'USD';
    
    if (currencyA !== currencyB) {
      return currencyA.localeCompare(currencyB);
    }
    
    // Then sort by name within the same currency
    return a.category_name.localeCompare(b.category_name);
  });
  
  return sorted;
};

/**
 * Get account currency by account ID
 * @param accounts - Array of accounts
 * @param accountId - ID of the account
 * @returns Currency of the account or null if not found
 */
export const getAccountCurrency = (
  accounts: Account[],
  accountId: string
): string | null => {
  const account = accounts.find(acc => acc.id === accountId);
  return account?.currency || null;
};

/**
 * Get filtered categories for transaction form
 * @param categories - Array of categories
 * @param purchaseCategories - Array of purchase categories
 * @param accounts - Array of accounts
 * @param accountId - Selected account ID
 * @param type - Transaction type ('income' or 'expense')
 * @param expenseType - Expense type ('purchase', 'regular_expense', etc.)
 * @returns Object with filtered categories and account currency
 */
export const getFilteredCategoriesForTransaction = (
  categories: Category[],
  purchaseCategories: PurchaseCategory[],
  accounts: Account[],
  accountId: string,
  type: 'income' | 'expense',
  expenseType: string
) => {
  const accountCurrency = getAccountCurrency(accounts, accountId);
  
  if (type === 'income') {
    const incomeCategories = categories.filter(cat => cat.type === 'income');
    const filteredCategories = accountCurrency 
      ? filterCategoriesByCurrency(incomeCategories, accountCurrency)
      : sortCategoriesByCurrency(incomeCategories);
    
    return {
      incomeCategories: filteredCategories,
      purchaseCategories: [],
      accountCurrency,
      hasMatchingCategories: filteredCategories.length > 0,
      totalCategories: incomeCategories.length
    };
  }
  
  if (type === 'expense' && (expenseType === 'purchase' || expenseType === 'regular_expense')) {
    const filteredCategories = accountCurrency 
      ? filterPurchaseCategoriesByCurrency(purchaseCategories, accountCurrency)
      : sortPurchaseCategoriesByCurrency(purchaseCategories);
    
    return {
      incomeCategories: [],
      purchaseCategories: filteredCategories,
      accountCurrency,
      hasMatchingCategories: filteredCategories.length > 0,
      totalCategories: purchaseCategories.length
    };
  }
  
  return {
    incomeCategories: [],
    purchaseCategories: [],
    accountCurrency,
    hasMatchingCategories: false,
    totalCategories: 0
  };
};

/**
 * Get filtered categories for purchase form
 * @param purchaseCategories - Array of purchase categories
 * @param accounts - Array of accounts
 * @param accountId - Selected account ID
 * @param manualCurrency - Optional manual currency override (for exclude from calculation mode)
 * @returns Object with filtered categories and account currency
 */
export const getFilteredCategoriesForPurchase = (
  purchaseCategories: PurchaseCategory[],
  accounts: Account[],
  accountId: string,
  manualCurrency?: string
) => {
  // Use manual currency if provided, otherwise get from account
  const effectiveCurrency = manualCurrency || getAccountCurrency(accounts, accountId);
  const filteredCategories = effectiveCurrency 
    ? filterPurchaseCategoriesByCurrency(purchaseCategories, effectiveCurrency)
    : sortPurchaseCategoriesByCurrency(purchaseCategories);
  
  return {
    categories: filteredCategories,
    accountCurrency: effectiveCurrency,
    hasMatchingCategories: filteredCategories.length > 0,
    totalCategories: purchaseCategories.length
  };
}; 


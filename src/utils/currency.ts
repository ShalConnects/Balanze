export const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case 'BDT':
      return '৳';
    case 'USD':
      return '$';
    case 'GBP':
      return '£';
    case 'EUR':
      return '€';
    case 'CAD':
      return 'C$';
    case 'JPY':
      return '¥';
    case 'AUD':
      return 'A$';
    default:
      return currency;
  }
};

export const formatCurrency = (amount: number, currency: string = 'USD') => {
  // Handle empty/null currency codes
  if (!currency || currency.trim() === '') {
    currency = 'USD'; // Default fallback
  }
  
  // Special handling for BDT to ensure ৳ symbol is always displayed
  if (currency === 'BDT') {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${Math.abs(amount).toLocaleString('en-BD', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
  
  try {
    const symbol = getCurrencySymbol(currency);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol'
    }).format(Math.abs(amount)).replace(currency, symbol);
  } catch (error) {
    // Fallback to simple formatting if Intl.NumberFormat fails
    console.warn('Currency formatting failed for:', currency, 'Falling back to USD');
    const symbol = getCurrencySymbol('USD');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'narrowSymbol'
    }).format(Math.abs(amount)).replace('USD', symbol);
  }
}; 
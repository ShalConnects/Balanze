// Exchange Rate Utilities
// This file handles exchange rate calculations and API integrations

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

// Common currency pairs with approximate rates (for fallback)
const COMMON_RATES: Record<string, number> = {
  'USD-EUR': 0.85,
  'EUR-USD': 1.18,
  'USD-GBP': 0.73,
  'GBP-USD': 1.37,
  'USD-CAD': 1.25,
  'CAD-USD': 0.80,
  'USD-AUD': 1.35,
  'AUD-USD': 0.74,
  'USD-JPY': 110.0,
  'JPY-USD': 0.0091,
  'USD-CHF': 0.92,
  'CHF-USD': 1.09,
  'USD-CNY': 6.45,
  'CNY-USD': 0.155,
  'USD-INR': 74.5,
  'INR-USD': 0.0134,
  'EUR-GBP': 0.86,
  'GBP-EUR': 1.16,
  'EUR-CAD': 1.47,
  'CAD-EUR': 0.68,
  'EUR-AUD': 1.59,
  'AUD-EUR': 0.63,
  'GBP-CAD': 1.71,
  'CAD-GBP': 0.58,
  'GBP-AUD': 1.85,
  'AUD-GBP': 0.54,
};

/**
 * Get exchange rate between two currencies
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Promise<number> - Exchange rate
 */
export async function getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  // If same currency, return 1
  if (fromCurrency === toCurrency) {
    return 1;
  }

  try {
    // Try to get real-time rate from API (you can replace this with your preferred API)
    const rate = await fetchRealTimeRate(fromCurrency, toCurrency);
    if (rate) {
      return rate;
    }
  } catch (error) {
    console.warn('Failed to fetch real-time exchange rate:', error);
  }

  // Fallback to common rates
  const key = `${fromCurrency}-${toCurrency}`;
  const fallbackRate = COMMON_RATES[key];
  
  if (fallbackRate) {
    console.log(`Using fallback rate for ${key}: ${fallbackRate}`);
    return fallbackRate;
  }

  // If no rate found, return 1 (same currency treatment)
  console.warn(`No exchange rate found for ${fromCurrency} to ${toCurrency}, using 1:1`);
  return 1;
}

/**
 * Fetch real-time exchange rate from API
 * You can replace this with your preferred exchange rate API
 * Examples: Fixer.io, ExchangeRate-API, CurrencyLayer, etc.
 */
async function fetchRealTimeRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
  try {
    // Example using a free API (you'll need to sign up for an API key)
    // const API_KEY = process.env.REACT_APP_EXCHANGE_RATE_API_KEY;
    // const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    // const data = await response.json();
    // return data.rates[toCurrency];

    // For now, return null to use fallback rates
    // Uncomment the above code and add your API key to use real-time rates
    return null;
  } catch (error) {
    console.error('Error fetching real-time exchange rate:', error);
    return null;
  }
}

/**
 * Calculate converted amount
 * @param amount - Original amount
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @param exchangeRate - Exchange rate to use
 * @returns number - Converted amount
 */
export function calculateConvertedAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  return amount * exchangeRate;
}

/**
 * Format exchange rate for display
 * @param rate - Exchange rate
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns string - Formatted rate
 */
export function formatExchangeRate(rate: number, fromCurrency: string, toCurrency: string): string {
  if (fromCurrency === toCurrency) {
    return '1:1';
  }
  
  // Format based on the magnitude of the rate
  if (rate >= 1) {
    return `1:${rate.toFixed(4)}`;
  } else {
    return `${(1 / rate).toFixed(4)}:1`;
  }
}

/**
 * Get suggested exchange rate for common currency pairs
 * @param fromCurrency - Source currency
 * @param toCurrency - Target currency
 * @returns number | null - Suggested rate or null if not found
 */
export function getSuggestedRate(fromCurrency: string, toCurrency: string): number | null {
  if (fromCurrency === toCurrency) {
    return 1;
  }
  
  const key = `${fromCurrency}-${toCurrency}`;
  return COMMON_RATES[key] || null;
}

/**
 * Validate exchange rate
 * @param rate - Exchange rate to validate
 * @returns boolean - True if rate is valid
 */
export function isValidExchangeRate(rate: number): boolean {
  return rate > 0 && rate < 10000; // Reasonable range for most currency pairs
}

/**
 * Get all supported currencies
 * @returns string[] - Array of supported currency codes
 */
export function getSupportedCurrencies(): string[] {
  const currencies = new Set<string>();
  
  // Extract currencies from common rates
  Object.keys(COMMON_RATES).forEach(pair => {
    const [from, to] = pair.split('-');
    currencies.add(from);
    currencies.add(to);
  });
  
  return Array.from(currencies).sort();
} 
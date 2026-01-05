// Fallback Search Service
// Simple search implementation without external dependencies

export interface SearchConfig {
  threshold?: number;
  keys: Array<{ name: string; weight: number }>;
  includeMatches?: boolean;
  minMatchCharLength?: number;
  findAllMatches?: boolean;
  ignoreLocation?: boolean;
  useExtendedSearch?: boolean;
}

export interface SearchResult<T> {
  item: T;
  score?: number;
  matches?: Array<{
    key: string;
    value: string;
    indices: Array<[number, number]>;
  }>;
  finalScore?: number;
}

export interface SearchOptions {
  limit?: number;
  sortBy?: 'score' | 'date' | 'relevance';
  includeHighlights?: boolean;
}

// Enhanced synonyms/aliases for comprehensive financial search
const SYNONYMS: Record<string, string[]> = {
  // Income/Deposit synonyms
  deposit: ['income', 'credit', 'salary', 'wage', 'payroll', 'earnings', 'revenue', 'profit', 'bonus', 'commission'],
  income: ['deposit', 'credit', 'salary', 'wage', 'payroll', 'earnings', 'revenue', 'profit', 'bonus', 'commission'],
  salary: ['income', 'wage', 'payroll', 'earnings', 'salary', 'stipend', 'allowance'],
  
  // Expense/Withdrawal synonyms
  withdrawal: ['expense', 'debit', 'payment', 'cost', 'charge', 'fee', 'bill', 'spending', 'outgoing'],
  expense: ['withdrawal', 'debit', 'payment', 'cost', 'charge', 'fee', 'bill', 'spending', 'outgoing'],
  payment: ['expense', 'withdrawal', 'debit', 'cost', 'charge', 'fee', 'bill'],
  
  // Transfer synonyms
  transfer: ['move', 'send', 'shift', 'relocate', 'migrate', 'port', 'switch'],
  move: ['transfer', 'send', 'shift', 'relocate'],
  send: ['transfer', 'move', 'dispatch', 'transmit'],
  
  // Purchase/Buy synonyms
  purchase: ['buy', 'expense', 'acquisition', 'procurement', 'shopping', 'buying'],
  buy: ['purchase', 'acquire', 'obtain', 'procure', 'shop'],
  shopping: ['purchase', 'buying', 'retail', 'spending'],
  
  // Account types
  bank: ['checking', 'savings', 'account', 'financial'],
  credit: ['card', 'credit card', 'plastic', 'payment card'],
  cash: ['money', 'currency', 'bills', 'coins', 'physical'],
  
  // Transaction types
  recurring: ['repeating', 'regular', 'periodic', 'scheduled', 'automatic'],
  one_time: ['single', 'once', 'individual', 'unique'],
  
  // Status synonyms
  pending: ['waiting', 'processing', 'in progress', 'unconfirmed'],
  completed: ['done', 'finished', 'processed', 'confirmed', 'settled'],
  cancelled: ['aborted', 'terminated', 'stopped', 'voided'],
  
  // Amount/Currency synonyms
  amount: ['value', 'sum', 'total', 'cost', 'price'],
  balance: ['remaining', 'available', 'current', 'outstanding'],
  
  // Date/Time synonyms
  recent: ['latest', 'newest', 'current', 'today', 'this week'],
  old: ['previous', 'past', 'historical', 'archived'],
  
  // Common financial terms
  budget: ['allocation', 'planning', 'forecast', 'estimate'],
  savings: ['reserve', 'fund', 'nest egg', 'stash'],
  investment: ['portfolio', 'assets', 'securities', 'stocks', 'bonds'],
  debt: ['loan', 'borrowing', 'liability', 'obligation'],
  loan: ['debt', 'borrowing', 'advance', 'credit'],
  
  // Categories
  food: ['dining', 'restaurant', 'groceries', 'meals', 'eating'],
  transport: ['travel', 'commute', 'gas', 'fuel', 'transportation'],
  entertainment: ['fun', 'leisure', 'recreation', 'hobby', 'activity'],
  healthcare: ['medical', 'health', 'doctor', 'hospital', 'medicine'],
  education: ['school', 'learning', 'tuition', 'course', 'training'],
  utilities: ['bills', 'electricity', 'water', 'internet', 'phone'],
};

/**
 * Expand search query with synonyms for better matching
 */
export function expandQuery(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  let expanded = [...words];
  
  // Add synonyms for each word
  for (const word of words) {
    if (SYNONYMS[word]) {
      expanded = expanded.concat(SYNONYMS[word]);
    }
  }
  
  // Add phrase-based synonyms for common financial phrases
  const phrase = query.toLowerCase();
  if (phrase.includes('credit card') || phrase.includes('creditcard')) {
    expanded.push('card', 'plastic', 'payment');
  }
  if (phrase.includes('bank account') || phrase.includes('bankaccount')) {
    expanded.push('checking', 'savings', 'financial');
  }
  if (phrase.includes('cash flow') || phrase.includes('cashflow')) {
    expanded.push('income', 'expense', 'money', 'flow');
  }
  if (phrase.includes('monthly') || phrase.includes('recurring')) {
    expanded.push('regular', 'periodic', 'scheduled');
  }
  
  // Remove duplicates and return
  return [...new Set(expanded)];
}

/**
 * Simple fuzzy search implementation
 */
function simpleFuzzySearch<T>(
  data: T[],
  query: string,
  keys: Array<{ name: string; weight: number }>,
  threshold: number = 0.3
): SearchResult<T>[] {
  const results: SearchResult<T>[] = [];
  const queryLower = query.toLowerCase();
  
  for (const item of data) {
    let totalScore = 0;
    let totalWeight = 0;
    const matches: Array<{
      key: string;
      value: string;
      indices: Array<[number, number]>;
    }> = [];
    
    for (const key of keys) {
      const value = (item as any)[key.name];
      if (typeof value === 'string') {
        const valueLower = value.toLowerCase();
        const index = valueLower.indexOf(queryLower);
        
        if (index !== -1) {
          const score = 1 - (index / value.length);
          totalScore += score * key.weight;
          totalWeight += key.weight;
          
          matches.push({
            key: key.name,
            value: value,
            indices: [[index, index + query.length - 1]]
          });
        }
      }
    }
    
    if (totalWeight > 0) {
      const finalScore = totalScore / totalWeight;
      if (finalScore >= threshold) {
        results.push({
          item,
          score: finalScore,
          matches
        });
      }
    }
  }
  
  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * Enhanced result ranking function
 */
export function rankSearchResults<T>(
  results: SearchResult<T>[], 
  type: string,
  options: { recencyBoost?: boolean; amountBoost?: boolean } = {}
): SearchResult<T>[] {
  return results.map(result => {
    let score = result.score || 0;
    
    // Recency boost (more recent items get higher scores)
    if (options.recencyBoost && result.item && typeof result.item === 'object' && 'date' in result.item) {
      const itemDate = new Date((result.item as any).date || (result.item as any).created_at || (result.item as any).updated_at || 0);
      const now = new Date();
      const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.max(0, 1 - (daysDiff / 365)); // Boost decreases over a year
      score += recencyBoost * 0.2;
    }
    
    // Frequency boost (items with higher amounts or more activity)
    if (options.amountBoost && result.item && typeof result.item === 'object' && 'amount' in result.item) {
      const amount = parseFloat((result.item as any).amount) || 0;
      const amountBoost = Math.min(0.1, Math.log10(amount || 1) / 10);
      score += amountBoost;
    }
    
    // Type-specific boosts
    if (type === 'transaction' && result.item && typeof result.item === 'object' && 'type' in result.item) {
      if ((result.item as any).type === 'income') {
        score += 0.05; // Slightly boost income transactions
      }
    }
    if (type === 'account' && result.item && typeof result.item === 'object' && 'isActive' in result.item) {
      if ((result.item as any).isActive) {
        score += 0.1; // Boost active accounts
      }
    }
    
    return { ...result, finalScore: score };
  }).sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
}

/**
 * Highlight search matches in text (returns plain text with markers)
 */
export function highlightMatches(text: string, matches: any[]): string {
  if (!matches || matches.length === 0) return text;
  
  let result = '';
  let lastIdx = 0;
  
  for (const match of matches) {
    const { indices } = match;
    for (const [start, end] of indices) {
      if (start > lastIdx) {
        result += text.slice(lastIdx, start);
      }
      result += `**${text.slice(start, end + 1)}**`;
      lastIdx = end + 1;
    }
  }
  
  if (lastIdx < text.length) {
    result += text.slice(lastIdx);
  }
  
  return result || text;
}

/**
 * Fallback Search Service
 */
export class UnifiedSearchService {
  private searchCache: Map<string, any> = new Map();
  private readonly CACHE_LIMIT = 50;

  /**
   * Perform unified search across any data type
   */
  search<T>(
    data: T[],
    query: string,
    dataType: string,
    config: SearchConfig,
    options: SearchOptions = {}
  ): SearchResult<T>[] {
    if (!query.trim()) {
      return [];
    }

    const startTime = performance.now();

    // Check cache first
    const cacheKey = `${dataType}-${query.toLowerCase()}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }

    // Expand query with synonyms
    const expandedQuery = expandQuery(query.toLowerCase()).join(' ');

    // Perform simple fuzzy search
    const results = simpleFuzzySearch(data, expandedQuery, config.keys, config.threshold || 0.3);

    // Apply ranking
    const rankedResults = rankSearchResults(results, dataType, {
      recencyBoost: true,
      amountBoost: true
    });

    // Apply limit
    const limitedResults = options.limit 
      ? rankedResults.slice(0, options.limit)
      : rankedResults;

    const searchTime = performance.now() - startTime;

    // Cache results (limit cache size)
    if (this.searchCache.size > this.CACHE_LIMIT) {
      const firstKey = this.searchCache.keys().next().value;
      if (firstKey) {
        this.searchCache.delete(firstKey);
      }
    }
    this.searchCache.set(cacheKey, limitedResults);

    return limitedResults;
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Get search suggestions based on data
   */
  getSuggestions<T>(
    data: T[],
    query: string,
    suggestionKeys: string[],
    limit: number = 5
  ): string[] {
    if (!query || query.length < 2) return [];

    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();

    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        suggestionKeys.forEach(key => {
          const value = (item as any)[key];
          if (typeof value === 'string' && value.toLowerCase().includes(queryLower)) {
            suggestions.push(value);
          }
        });
      }
    });

    return [...new Set(suggestions)].slice(0, limit);
  }

  /**
   * Track search result click
   */
  trackResultClick(result: any, itemType: string, itemId: string, itemTitle: string): void {
    // Fallback implementation - no analytics tracking
    console.log('Search result clicked:', { itemType, itemId, itemTitle });
  }

  /**
   * Track suggestion usage
   */
  trackSuggestionUsage(originalQuery: string, suggestion: string): void {
    // Fallback implementation - no analytics tracking
    console.log('Suggestion used:', { originalQuery, suggestion });
  }
}

// Default search configurations for different data types
export const SEARCH_CONFIGS = {
  transactions: {
    threshold: 0.3,
    keys: [
      { name: 'description', weight: 0.4 },
      { name: 'category', weight: 0.25 },
      { name: 'tags', weight: 0.15 },
      { name: 'transaction_id', weight: 0.1 },
      { name: 'type', weight: 0.1 }
    ],
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true
  },
  
  accounts: {
    threshold: 0.3,
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'type', weight: 0.25 },
      { name: 'currency', weight: 0.15 },
      { name: 'description', weight: 0.1 },
      { name: 'tags', weight: 0.1 }
    ],
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true
  },
  
  articles: {
    threshold: 0.4,
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'description', weight: 0.3 },
      { name: 'tags', weight: 0.2 }
    ],
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true
  },
  
  purchases: {
    threshold: 0.3,
    keys: [
      { name: 'item_name', weight: 0.4 },
      { name: 'category', weight: 0.25 },
      { name: 'notes', weight: 0.15 },
      { name: 'status', weight: 0.1 },
      { name: 'price', weight: 0.1 }
    ],
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true
  },
  
  lendBorrow: {
    threshold: 0.3,
    keys: [
      { name: 'person_name', weight: 0.4 },
      { name: 'type', weight: 0.25 },
      { name: 'notes', weight: 0.15 },
      { name: 'status', weight: 0.1 },
      { name: 'currency', weight: 0.1 }
    ],
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true
  },
  
  donations: {
    threshold: 0.3,
    keys: [
      { name: 'type', weight: 0.4 },
      { name: 'note', weight: 0.3 },
      { name: 'status', weight: 0.2 },
      { name: 'mode', weight: 0.1 }
    ],
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true
  },
  
  clients: {
    threshold: 0.3,
    keys: [
      { name: 'name', weight: 0.35 },
      { name: 'company_name', weight: 0.25 },
      { name: 'email', weight: 0.15 },
      { name: 'source', weight: 0.1 },
      { name: 'tags', weight: 0.1 },
      { name: 'phone', weight: 0.05 }
    ],
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true
  },
  
  tasks: {
    threshold: 0.3,
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'description', weight: 0.25 },
      { name: 'status', weight: 0.15 },
      { name: 'priority', weight: 0.1 },
      { name: 'client.name', weight: 0.1 }
    ],
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true
  },
  
  invoices: {
    threshold: 0.3,
    keys: [
      { name: 'invoice_number', weight: 0.35 },
      { name: 'client.name', weight: 0.25 },
      { name: 'status', weight: 0.15 },
      { name: 'total', weight: 0.1 },
      { name: 'notes', weight: 0.1 },
      { name: 'payment_status', weight: 0.05 }
    ],
    includeMatches: true,
    minMatchCharLength: 1,
    findAllMatches: true,
    ignoreLocation: true,
    useExtendedSearch: true
  }
};

// Export singleton instance
export const searchService = new UnifiedSearchService();

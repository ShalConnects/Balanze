// Search Analytics Service
// Tracks user search behavior to improve search experience and performance

export interface SearchEvent {
  id: string;
  timestamp: number;
  query: string;
  page: string;
  resultCount: number;
  clicked: boolean;
  clickedItem?: {
    type: string;
    id: string;
    title: string;
  };
  searchTime: number; // Time taken to perform search in ms
  filters?: Record<string, any>;
  suggestionUsed?: boolean;
  suggestion?: string;
}

export interface SearchMetrics {
  totalSearches: number;
  averageSearchTime: number;
  zeroResultRate: number;
  clickThroughRate: number;
  popularQueries: Array<{ query: string; count: number }>;
  searchByPage: Record<string, number>;
  averageResultsPerSearch: number;
  suggestionUsageRate: number;
}

export interface SearchSession {
  id: string;
  startTime: number;
  endTime?: number;
  searches: SearchEvent[];
  page: string;
  userId?: string;
}

class SearchAnalyticsService {
  private events: SearchEvent[] = [];
  private sessions: Map<string, SearchSession> = new Map();
  private currentSessionId: string | null = null;
  private readonly STORAGE_KEY = 'balanze_search_analytics';
  private readonly MAX_EVENTS = 1000; // Limit stored events
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.loadFromStorage();
    this.initializeSession();
  }

  /**
   * Initialize a new search session
   */
  private initializeSession(): void {
    this.currentSessionId = this.generateSessionId();
    this.sessions.set(this.currentSessionId, {
      id: this.currentSessionId,
      startTime: Date.now(),
      searches: [],
      page: window.location.pathname
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track a search event
   */
  trackSearch(
    query: string,
    page: string,
    resultCount: number,
    searchTime: number,
    filters?: Record<string, any>,
    suggestionUsed?: boolean,
    suggestion?: string
  ): string {
    const eventId = this.generateEventId();
    const event: SearchEvent = {
      id: eventId,
      timestamp: Date.now(),
      query: query.trim(),
      page,
      resultCount,
      clicked: false,
      searchTime,
      filters,
      suggestionUsed,
      suggestion
    };

    this.events.push(event);
    
    // Add to current session
    if (this.currentSessionId) {
      const session = this.sessions.get(this.currentSessionId);
      if (session) {
        session.searches.push(event);
      }
    }

    // Clean up old events if we exceed the limit
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    this.saveToStorage();
    return eventId;
  }

  /**
   * Track when a search result is clicked
   */
  trackSearchClick(
    eventId: string,
    itemType: string,
    itemId: string,
    itemTitle: string
  ): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.clicked = true;
      event.clickedItem = {
        type: itemType,
        id: itemId,
        title: itemTitle
      };
      this.saveToStorage();
    }
  }

  /**
   * Track search suggestion usage
   */
  trackSuggestionClick(
    originalQuery: string,
    suggestion: string,
    page: string
  ): void {
    this.trackSearch(
      suggestion,
      page,
      0, // Will be updated when actual search completes
      0, // Will be updated when actual search completes
      undefined,
      true, // suggestionUsed
      suggestion
    );
  }

  /**
   * Track zero results searches
   */
  trackZeroResults(query: string, page: string, searchTime: number): void {
    this.trackSearch(query, page, 0, searchTime);
  }

  /**
   * Get search metrics
   */
  getMetrics(): SearchMetrics {
    const totalSearches = this.events.length;
    const clickedSearches = this.events.filter(e => e.clicked).length;
    const zeroResultSearches = this.events.filter(e => e.resultCount === 0).length;
    const suggestionUsedSearches = this.events.filter(e => e.suggestionUsed).length;

    // Calculate average search time
    const averageSearchTime = this.events.length > 0
      ? this.events.reduce((sum, e) => sum + e.searchTime, 0) / this.events.length
      : 0;

    // Calculate click-through rate
    const clickThroughRate = totalSearches > 0 ? (clickedSearches / totalSearches) * 100 : 0;

    // Calculate zero result rate
    const zeroResultRate = totalSearches > 0 ? (zeroResultSearches / totalSearches) * 100 : 0;

    // Get popular queries
    const queryCounts = this.events.reduce((acc, e) => {
      acc[e.query] = (acc[e.query] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get searches by page
    const searchByPage = this.events.reduce((acc, e) => {
      acc[e.page] = (acc[e.page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average results per search
    const averageResultsPerSearch = totalSearches > 0
      ? this.events.reduce((sum, e) => sum + e.resultCount, 0) / totalSearches
      : 0;

    // Calculate suggestion usage rate
    const suggestionUsageRate = totalSearches > 0 ? (suggestionUsedSearches / totalSearches) * 100 : 0;

    return {
      totalSearches,
      averageSearchTime,
      zeroResultRate,
      clickThroughRate,
      popularQueries,
      searchByPage,
      averageResultsPerSearch,
      suggestionUsageRate
    };
  }

  /**
   * Get search performance insights
   */
  getPerformanceInsights(): {
    slowSearches: SearchEvent[];
    highZeroResultQueries: string[];
    popularSuggestionQueries: string[];
    searchTrends: Array<{ date: string; searches: number }>;
  } {
    // Find slow searches (above 500ms)
    const slowSearches = this.events.filter(e => e.searchTime > 500);

    // Find queries with high zero result rate
    const queryZeroResults = this.events.reduce((acc, e) => {
      if (!acc[e.query]) {
        acc[e.query] = { total: 0, zeroResults: 0 };
      }
      acc[e.query].total++;
      if (e.resultCount === 0) {
        acc[e.query].zeroResults++;
      }
      return acc;
    }, {} as Record<string, { total: number; zeroResults: number }>);

    const highZeroResultQueries = Object.entries(queryZeroResults)
      .filter(([_, stats]) => stats.total >= 3 && (stats.zeroResults / stats.total) > 0.5)
      .map(([query, _]) => query);

    // Find popular suggestion queries
    const suggestionQueries = this.events
      .filter(e => e.suggestionUsed && e.suggestion)
      .map(e => e.suggestion!)
      .reduce((acc, suggestion) => {
        acc[suggestion] = (acc[suggestion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const popularSuggestionQueries = Object.entries(suggestionQueries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query, _]) => query);

    // Get search trends (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp > sevenDaysAgo);
    
    const searchTrends = recentEvents.reduce((acc, e) => {
      const date = new Date(e.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const searchTrendsArray = Object.entries(searchTrends)
      .map(([date, searches]) => ({ date, searches }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      slowSearches,
      highZeroResultQueries,
      popularSuggestionQueries,
      searchTrends: searchTrendsArray
    };
  }

  /**
   * Get user search patterns
   */
  getUserSearchPatterns(): {
    mostSearchedPages: Array<{ page: string; count: number }>;
    searchSessionLength: number;
    averageSearchesPerSession: number;
    commonSearchFilters: Record<string, number>;
  } {
    // Most searched pages
    const pageCounts = this.events.reduce((acc, e) => {
      acc[e.page] = (acc[e.page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostSearchedPages = Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count);

    // Search session length
    const searchSessionLength = this.sessions.size;

    // Average searches per session
    const totalSearches = this.events.length;
    const averageSearchesPerSession = searchSessionLength > 0 ? totalSearches / searchSessionLength : 0;

    // Common search filters
    const filterCounts = this.events.reduce((acc, e) => {
      if (e.filters) {
        Object.entries(e.filters).forEach(([key, value]) => {
          const filterKey = `${key}:${value}`;
          acc[filterKey] = (acc[filterKey] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      mostSearchedPages,
      searchSessionLength,
      averageSearchesPerSession,
      commonSearchFilters: filterCounts
    };
  }

  /**
   * Clear analytics data
   */
  clearAnalytics(): void {
    this.events = [];
    this.sessions.clear();
    this.currentSessionId = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Export analytics data
   */
  exportAnalytics(): string {
    return JSON.stringify({
      events: this.events,
      sessions: Array.from(this.sessions.values()),
      metrics: this.getMetrics(),
      performanceInsights: this.getPerformanceInsights(),
      userPatterns: this.getUserSearchPatterns()
    }, null, 2);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save analytics to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        events: this.events,
        sessions: Array.from(this.sessions.values())
      }));
    } catch (error) {
      console.warn('Failed to save search analytics to localStorage:', error);
    }
  }

  /**
   * Load analytics from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events || [];
        
        // Reconstruct sessions map
        if (data.sessions) {
          data.sessions.forEach((session: SearchSession) => {
            this.sessions.set(session.id, session);
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load search analytics from localStorage:', error);
    }
  }
}

// Export singleton instance
export const searchAnalytics = new SearchAnalyticsService();

// Helper functions for easy integration
export const trackSearch = (
  query: string,
  page: string,
  resultCount: number,
  searchTime: number,
  filters?: Record<string, any>,
  suggestionUsed?: boolean,
  suggestion?: string
): string => {
  return searchAnalytics.trackSearch(
    query,
    page,
    resultCount,
    searchTime,
    filters,
    suggestionUsed,
    suggestion
  );
};

export const trackSearchClick = (
  eventId: string,
  itemType: string,
  itemId: string,
  itemTitle: string
): void => {
  searchAnalytics.trackSearchClick(eventId, itemType, itemId, itemTitle);
};

export const trackSuggestionClick = (
  originalQuery: string,
  suggestion: string,
  page: string
): void => {
  searchAnalytics.trackSuggestionClick(originalQuery, suggestion, page);
};

export const trackZeroResults = (
  query: string,
  page: string,
  searchTime: number
): void => {
  searchAnalytics.trackZeroResults(query, page, searchTime);
};

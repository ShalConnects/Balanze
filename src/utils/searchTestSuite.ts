// Search Test Suite
// Comprehensive testing and validation for all search improvements

import { searchService, SEARCH_CONFIGS } from './searchService';
import { searchAnalytics } from './searchAnalytics';

export interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: any;
}

export interface TestSuite {
  name: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

class SearchTestSuite {
  private testResults: TestResult[] = [];

  /**
   * Run all search tests
   */
  async runAllTests(): Promise<TestSuite> {
    const startTime = performance.now();
    this.testResults = [];

    console.log('🔍 Starting Search Test Suite...');

    // Test unified search service
    await this.testUnifiedSearchService();
    
    // Test search configurations
    await this.testSearchConfigurations();
    
    // Test search analytics
    await this.testSearchAnalytics();
    
    // Test search performance
    await this.testSearchPerformance();
    
    // Test search suggestions
    await this.testSearchSuggestions();
    
    // Test search caching
    await this.testSearchCaching();
    
    // Test search ranking
    await this.testSearchRanking();

    const totalDuration = performance.now() - startTime;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = this.testResults.filter(r => !r.passed).length;

    const suite: TestSuite = {
      name: 'Search Test Suite',
      results: this.testResults,
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      totalDuration
    };

    console.log(`✅ Search Test Suite Complete: ${passedTests}/${this.testResults.length} tests passed in ${totalDuration.toFixed(2)}ms`);
    
    return suite;
  }

  /**
   * Test unified search service functionality
   */
  private async testUnifiedSearchService(): Promise<void> {
    const testData = [
      { id: '1', name: 'Test Transaction', description: 'Payment for groceries', category: 'Food', amount: 50 },
      { id: '2', name: 'Salary Deposit', description: 'Monthly salary', category: 'Income', amount: 3000 },
      { id: '3', name: 'Rent Payment', description: 'Monthly rent', category: 'Housing', amount: 1200 }
    ];

    // Test basic search
    await this.runTest('Unified Search - Basic Query', async () => {
      const results = searchService.search(
        testData,
        'groceries',
        'transactions',
        SEARCH_CONFIGS.transactions
      );
      
      if (results.length === 0) {
        throw new Error('No results found for "groceries"');
      }
      
      if (results[0].item.description !== 'Payment for groceries') {
        throw new Error('Incorrect result returned');
      }
      
      return { resultCount: results.length, firstResult: results[0].item };
    });

    // Test fuzzy search
    await this.runTest('Unified Search - Fuzzy Matching', async () => {
      const results = searchService.search(
        testData,
        'grocery', // Slightly different from 'groceries'
        'transactions',
        SEARCH_CONFIGS.transactions
      );
      
      if (results.length === 0) {
        throw new Error('Fuzzy search failed for "grocery"');
      }
      
      return { resultCount: results.length };
    });

    // Test empty query
    await this.runTest('Unified Search - Empty Query', async () => {
      const results = searchService.search(
        testData,
        '',
        'transactions',
        SEARCH_CONFIGS.transactions
      );
      
      if (results.length !== 0) {
        throw new Error('Empty query should return no results');
      }
      
      return { resultCount: results.length };
    });

    // Test limit option
    await this.runTest('Unified Search - Limit Option', async () => {
      const results = searchService.search(
        testData,
        'payment',
        'transactions',
        SEARCH_CONFIGS.transactions,
        { limit: 1 }
      );
      
      if (results.length > 1) {
        throw new Error('Limit option not working correctly');
      }
      
      return { resultCount: results.length };
    });
  }

  /**
   * Test search configurations
   */
  private async testSearchConfigurations(): Promise<void> {
    const testData = [
      { title: 'How to create account', description: 'Guide for account creation', tags: ['account', 'setup'] },
      { title: 'Transaction management', description: 'Managing your transactions', tags: ['transaction', 'finance'] }
    ];

    // Test articles configuration
    await this.runTest('Search Config - Articles', async () => {
      const results = searchService.search(
        testData,
        'account',
        'articles',
        SEARCH_CONFIGS.articles
      );
      
      if (results.length === 0) {
        throw new Error('Articles search failed');
      }
      
      return { resultCount: results.length };
    });

    // Test all configurations exist
    await this.runTest('Search Config - All Configs Exist', async () => {
      const requiredConfigs = ['transactions', 'accounts', 'articles', 'purchases', 'lendBorrow', 'donations'];
      
      for (const config of requiredConfigs) {
        if (!SEARCH_CONFIGS[config as keyof typeof SEARCH_CONFIGS]) {
          throw new Error(`Missing configuration for ${config}`);
        }
      }
      
      return { configCount: requiredConfigs.length };
    });
  }

  /**
   * Test search analytics functionality
   */
  private async testSearchAnalytics(): Promise<void> {
    // Test analytics tracking
    await this.runTest('Search Analytics - Track Search', async () => {
      const eventId = searchAnalytics.trackSearch(
        'test query',
        '/test-page',
        5,
        100,
        { type: 'test' }
      );
      
      if (!eventId) {
        throw new Error('Failed to track search event');
      }
      
      return { eventId };
    });

    // Test click tracking
    await this.runTest('Search Analytics - Track Click', async () => {
      // First track a search
      const eventId = searchAnalytics.trackSearch('test', '/test', 1, 50);
      
      // Then track a click
      searchAnalytics.trackSearchClick(eventId, 'transaction', '123', 'Test Transaction');
      
      // Get metrics to verify
      const metrics = searchAnalytics.getMetrics();
      
      if (metrics.totalSearches === 0) {
        throw new Error('Search tracking not working');
      }
      
      return { totalSearches: metrics.totalSearches, clickThroughRate: metrics.clickThroughRate };
    });

    // Test metrics calculation
    await this.runTest('Search Analytics - Metrics Calculation', async () => {
      const metrics = searchAnalytics.getMetrics();
      
      if (typeof metrics.totalSearches !== 'number') {
        throw new Error('Invalid metrics calculation');
      }
      
      if (typeof metrics.averageSearchTime !== 'number') {
        throw new Error('Invalid average search time calculation');
      }
      
      return { metrics };
    });
  }

  /**
   * Test search performance
   */
  private async testSearchPerformance(): Promise<void> {
    // Generate large dataset for performance testing
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i.toString(),
      name: `Item ${i}`,
      description: `Description for item ${i}`,
      category: `Category ${i % 10}`,
      amount: Math.random() * 1000
    }));

    // Test search performance with large dataset
    await this.runTest('Search Performance - Large Dataset', async () => {
      const startTime = performance.now();
      
      const results = searchService.search(
        largeDataset,
        'item 500',
        'transactions',
        SEARCH_CONFIGS.transactions
      );
      
      const duration = performance.now() - startTime;
      
      if (duration > 1000) { // Should complete within 1 second
        throw new Error(`Search too slow: ${duration.toFixed(2)}ms`);
      }
      
      if (results.length === 0) {
        throw new Error('No results found in large dataset');
      }
      
      return { duration, resultCount: results.length };
    });

    // Test caching performance
    await this.runTest('Search Performance - Caching', async () => {
      const query = 'performance test';
      
      // First search (should be slower)
      const start1 = performance.now();
      searchService.search(largeDataset, query, 'transactions', SEARCH_CONFIGS.transactions);
      const duration1 = performance.now() - start1;
      
      // Second search (should be faster due to caching)
      const start2 = performance.now();
      searchService.search(largeDataset, query, 'transactions', SEARCH_CONFIGS.transactions);
      const duration2 = performance.now() - start2;
      
      if (duration2 >= duration1) {
        throw new Error('Caching not improving performance');
      }
      
      return { firstSearch: duration1, secondSearch: duration2, improvement: ((duration1 - duration2) / duration1 * 100) };
    });
  }

  /**
   * Test search suggestions
   */
  private async testSearchSuggestions(): Promise<void> {
    const testData = [
      { name: 'Bank Account', description: 'Main bank account', type: 'bank' },
      { name: 'Credit Card', description: 'Visa credit card', type: 'credit' },
      { name: 'Savings Account', description: 'High yield savings', type: 'savings' }
    ];

    await this.runTest('Search Suggestions - Basic Functionality', async () => {
      const suggestions = searchService.getSuggestions(
        testData,
        'bank',
        ['name', 'description', 'type'],
        3
      );
      
      if (suggestions.length === 0) {
        throw new Error('No suggestions generated');
      }
      
      if (!suggestions.some(s => s.toLowerCase().includes('bank'))) {
        throw new Error('Suggestions don\'t match query');
      }
      
      return { suggestionCount: suggestions.length, suggestions };
    });

    await this.runTest('Search Suggestions - Limit Functionality', async () => {
      const suggestions = searchService.getSuggestions(
        testData,
        'account',
        ['name', 'description'],
        1
      );
      
      if (suggestions.length > 1) {
        throw new Error('Limit not working for suggestions');
      }
      
      return { suggestionCount: suggestions.length };
    });
  }

  /**
   * Test search caching
   */
  private async testSearchCaching(): Promise<void> {
    const testData = [{ id: '1', name: 'Test Item', description: 'Test description' }];

    await this.runTest('Search Caching - Cache Storage', async () => {
      const query = 'test item';
      
      // Perform search to populate cache
      searchService.search(testData, query, 'transactions', SEARCH_CONFIGS.transactions);
      
      // Check if cache is populated (we can't directly access cache, but we can test performance)
      const start = performance.now();
      searchService.search(testData, query, 'transactions', SEARCH_CONFIGS.transactions);
      const duration = performance.now() - start;
      
      // Cached search should be very fast
      if (duration > 10) {
        throw new Error('Cache not working properly');
      }
      
      return { duration };
    });

    await this.runTest('Search Caching - Cache Clear', async () => {
      const query = 'cache test';
      
      // Perform search
      searchService.search(testData, query, 'transactions', SEARCH_CONFIGS.transactions);
      
      // Clear cache
      searchService.clearCache();
      
      // Search again - should not be cached
      const start = performance.now();
      searchService.search(testData, query, 'transactions', SEARCH_CONFIGS.transactions);
      const duration = performance.now() - start;
      
      // Should take longer than cached search
      if (duration < 5) {
        throw new Error('Cache clear not working');
      }
      
      return { duration };
    });
  }

  /**
   * Test search ranking
   */
  private async testSearchRanking(): Promise<void> {
    const testData = [
      { id: '1', name: 'Recent Transaction', description: 'Payment for food', date: new Date().toISOString(), amount: 50 },
      { id: '2', name: 'Old Transaction', description: 'Payment for rent', date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), amount: 1000 },
      { id: '3', name: 'High Amount Transaction', description: 'Large payment', date: new Date().toISOString(), amount: 5000 }
    ];

    await this.runTest('Search Ranking - Recency Boost', async () => {
      const results = searchService.search(
        testData,
        'payment',
        'transactions',
        SEARCH_CONFIGS.transactions
      );
      
      if (results.length === 0) {
        throw new Error('No results for ranking test');
      }
      
      // Recent transactions should rank higher
      const firstResult = results[0].item;
      if (firstResult.id !== '1' && firstResult.id !== '3') {
        throw new Error('Recency ranking not working');
      }
      
      return { firstResult: firstResult.id, resultCount: results.length };
    });

    await this.runTest('Search Ranking - Amount Boost', async () => {
      const results = searchService.search(
        testData,
        'transaction',
        'transactions',
        SEARCH_CONFIGS.transactions
      );
      
      if (results.length === 0) {
        throw new Error('No results for amount ranking test');
      }
      
      // High amount transactions should rank higher
      const firstResult = results[0].item;
      if (firstResult.amount < 1000) {
        throw new Error('Amount ranking not working');
      }
      
      return { firstResult: firstResult.id, amount: firstResult.amount };
    });
  }

  /**
   * Run a single test
   */
  private async runTest(testName: string, testFunction: () => Promise<any>): Promise<void> {
    const startTime = performance.now();
    
    try {
      const result = await testFunction();
      const duration = performance.now() - startTime;
      
      this.testResults.push({
        testName,
        passed: true,
        message: 'Test passed',
        duration,
        details: result
      });
      
      console.log(`✅ ${testName} - ${duration.toFixed(2)}ms`);
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.testResults.push({
        testName,
        passed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
        details: error
      });
      
      console.error(`❌ ${testName} - ${duration.toFixed(2)}ms: ${error}`);
    }
  }

  /**
   * Generate test report
   */
  generateReport(suite: TestSuite): string {
    const report = `
# Search Test Suite Report

## Summary
- **Total Tests**: ${suite.totalTests}
- **Passed**: ${suite.passedTests}
- **Failed**: ${suite.failedTests}
- **Success Rate**: ${((suite.passedTests / suite.totalTests) * 100).toFixed(1)}%
- **Total Duration**: ${suite.totalDuration.toFixed(2)}ms

## Test Results

${suite.results.map(result => `
### ${result.testName}
- **Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}
- **Duration**: ${result.duration.toFixed(2)}ms
- **Message**: ${result.message}
${result.details ? `- **Details**: ${JSON.stringify(result.details, null, 2)}` : ''}
`).join('')}

## Performance Insights
- **Average Test Duration**: ${(suite.totalDuration / suite.totalTests).toFixed(2)}ms
- **Fastest Test**: ${Math.min(...suite.results.map(r => r.duration)).toFixed(2)}ms
- **Slowest Test**: ${Math.max(...suite.results.map(r => r.duration)).toFixed(2)}ms

## Recommendations
${suite.failedTests > 0 ? `
⚠️ **${suite.failedTests} tests failed** - Review failed tests and fix issues
` : ''}
${suite.totalDuration > 5000 ? `
⚠️ **Test suite is slow** - Consider optimizing test performance
` : ''}
${suite.passedTests === suite.totalTests ? `
🎉 **All tests passed!** - Search system is working correctly
` : ''}
`;

    return report;
  }
}

// Export test suite instance
export const searchTestSuite = new SearchTestSuite();

// Helper function to run tests
export const runSearchTests = async (): Promise<TestSuite> => {
  return await searchTestSuite.runAllTests();
};

// Helper function to run tests and generate report
export const runSearchTestsWithReport = async (): Promise<string> => {
  const suite = await searchTestSuite.runAllTests();
  return searchTestSuite.generateReport(suite);
};

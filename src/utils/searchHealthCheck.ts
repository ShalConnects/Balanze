// Search Health Check Utility
// Validates search system health and provides recommendations

import { searchService, SEARCH_CONFIGS } from './searchService';
import { searchAnalytics } from './searchAnalytics';

export interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  recommendations: string[];
  metrics?: any;
}

export interface SearchHealthReport {
  overallStatus: 'healthy' | 'warning' | 'critical';
  results: HealthCheckResult[];
  summary: {
    totalChecks: number;
    healthy: number;
    warnings: number;
    critical: number;
  };
  recommendations: string[];
}

class SearchHealthChecker {
  /**
   * Run comprehensive health check
   */
  async runHealthCheck(): Promise<SearchHealthReport> {
    const results: HealthCheckResult[] = [];

    // Check search service functionality
    results.push(await this.checkSearchService());
    
    // Check search configurations
    results.push(await this.checkSearchConfigurations());
    
    // Check search analytics
    results.push(await this.checkSearchAnalytics());
    
    // Check search performance
    results.push(await this.checkSearchPerformance());
    
    // Check search caching
    results.push(await this.checkSearchCaching());
    
    // Check search suggestions
    results.push(await this.checkSearchSuggestions());

    // Calculate overall status
    const criticalCount = results.filter(r => r.status === 'critical').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    let overallStatus: 'healthy' | 'warning' | 'critical';
    if (criticalCount > 0) {
      overallStatus = 'critical';
    } else if (warningCount > 0) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'healthy';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(results);

    return {
      overallStatus,
      results,
      summary: {
        totalChecks: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        warnings: warningCount,
        critical: criticalCount
      },
      recommendations
    };
  }

  /**
   * Check search service functionality
   */
  private async checkSearchService(): Promise<HealthCheckResult> {
    try {
      const testData = [
        { id: '1', name: 'Test Item', description: 'Test description' }
      ];

      const results = searchService.search(
        testData,
        'test',
        'transactions',
        SEARCH_CONFIGS.transactions
      );

      if (results.length === 0) {
        return {
          component: 'Search Service',
          status: 'critical',
          message: 'Search service not returning results',
          recommendations: [
            'Check search service configuration',
            'Verify Fuse.js integration',
            'Test with different data types'
          ]
        };
      }

      return {
        component: 'Search Service',
        status: 'healthy',
        message: 'Search service functioning correctly',
        recommendations: [],
        metrics: { resultCount: results.length }
      };
    } catch (error) {
      return {
        component: 'Search Service',
        status: 'critical',
        message: `Search service error: ${error}`,
        recommendations: [
          'Check search service implementation',
          'Verify dependencies are installed',
          'Review error logs'
        ]
      };
    }
  }

  /**
   * Check search configurations
   */
  private async checkSearchConfigurations(): Promise<HealthCheckResult> {
    const requiredConfigs = ['transactions', 'accounts', 'articles', 'purchases', 'lendBorrow', 'donations'];
    const missingConfigs = requiredConfigs.filter(config => !SEARCH_CONFIGS[config as keyof typeof SEARCH_CONFIGS]);

    if (missingConfigs.length > 0) {
      return {
        component: 'Search Configurations',
        status: 'critical',
        message: `Missing configurations: ${missingConfigs.join(', ')}`,
        recommendations: [
          'Add missing search configurations',
          'Verify all data types are supported',
          'Check configuration file integrity'
        ]
      };
    }

    // Check configuration quality
    const configIssues = [];
    for (const [key, config] of Object.entries(SEARCH_CONFIGS)) {
      if (!config.keys || config.keys.length === 0) {
        configIssues.push(`${key}: no search keys defined`);
      }
      if (config.threshold === undefined || config.threshold < 0 || config.threshold > 1) {
        configIssues.push(`${key}: invalid threshold value`);
      }
    }

    if (configIssues.length > 0) {
      return {
        component: 'Search Configurations',
        status: 'warning',
        message: `Configuration issues: ${configIssues.join(', ')}`,
        recommendations: [
          'Review search configuration settings',
          'Optimize threshold values',
          'Ensure all keys are properly defined'
        ]
      };
    }

    return {
      component: 'Search Configurations',
      status: 'healthy',
      message: 'All search configurations are valid',
      recommendations: [],
      metrics: { configCount: requiredConfigs.length }
    };
  }

  /**
   * Check search analytics
   */
  private async checkSearchAnalytics(): Promise<HealthCheckResult> {
    try {
      const metrics = searchAnalytics.getMetrics();
      
      if (typeof metrics.totalSearches !== 'number') {
        return {
          component: 'Search Analytics',
          status: 'critical',
          message: 'Analytics metrics not calculating correctly',
          recommendations: [
            'Check analytics service implementation',
            'Verify data storage functionality',
            'Review metrics calculation logic'
          ]
        };
      }

      // Check for performance issues
      const performanceIssues = [];
      if (metrics.averageSearchTime > 1000) {
        performanceIssues.push('Average search time is too high');
      }
      if (metrics.zeroResultRate > 50) {
        performanceIssues.push('High zero result rate indicates search issues');
      }

      if (performanceIssues.length > 0) {
        return {
          component: 'Search Analytics',
          status: 'warning',
          message: `Performance issues: ${performanceIssues.join(', ')}`,
          recommendations: [
            'Optimize search algorithms',
            'Improve search suggestions',
            'Review search result ranking'
          ],
          metrics
        };
      }

      return {
        component: 'Search Analytics',
        status: 'healthy',
        message: 'Analytics system functioning correctly',
        recommendations: [],
        metrics
      };
    } catch (error) {
      return {
        component: 'Search Analytics',
        status: 'critical',
        message: `Analytics error: ${error}`,
        recommendations: [
          'Check analytics service implementation',
          'Verify localStorage functionality',
          'Review error handling'
        ]
      };
    }
  }

  /**
   * Check search performance
   */
  private async checkSearchPerformance(): Promise<HealthCheckResult> {
    try {
      // Generate test dataset
      const testData = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        name: `Item ${i}`,
        description: `Description for item ${i}`,
        category: `Category ${i % 10}`
      }));

      const startTime = performance.now();
      const results = searchService.search(
        testData,
        'item 50',
        'transactions',
        SEARCH_CONFIGS.transactions
      );
      const duration = performance.now() - startTime;

      if (duration > 500) {
        return {
          component: 'Search Performance',
          status: 'warning',
          message: `Search performance is slow: ${duration.toFixed(2)}ms`,
          recommendations: [
            'Optimize search algorithms',
            'Implement better caching',
            'Consider data indexing'
          ],
          metrics: { duration, resultCount: results.length }
        };
      }

      if (results.length === 0) {
        return {
          component: 'Search Performance',
          status: 'critical',
          message: 'No results returned from performance test',
          recommendations: [
            'Check search algorithm implementation',
            'Verify data format compatibility',
            'Test with different query types'
          ]
        };
      }

      return {
        component: 'Search Performance',
        status: 'healthy',
        message: `Search performance is good: ${duration.toFixed(2)}ms`,
        recommendations: [],
        metrics: { duration, resultCount: results.length }
      };
    } catch (error) {
      return {
        component: 'Search Performance',
        status: 'critical',
        message: `Performance test error: ${error}`,
        recommendations: [
          'Check search service implementation',
          'Verify test data format',
          'Review error handling'
        ]
      };
    }
  }

  /**
   * Check search caching
   */
  private async checkSearchCaching(): Promise<HealthCheckResult> {
    try {
      const testData = [{ id: '1', name: 'Cache Test', description: 'Testing cache functionality' }];
      const query = 'cache test';

      // First search (should populate cache)
      const start1 = performance.now();
      searchService.search(testData, query, 'transactions', SEARCH_CONFIGS.transactions);
      const duration1 = performance.now() - start1;

      // Second search (should use cache)
      const start2 = performance.now();
      searchService.search(testData, query, 'transactions', SEARCH_CONFIGS.transactions);
      const duration2 = performance.now() - start2;

      const improvement = ((duration1 - duration2) / duration1) * 100;

      if (improvement < 50) {
        return {
          component: 'Search Caching',
          status: 'warning',
          message: `Cache performance improvement is low: ${improvement.toFixed(1)}%`,
          recommendations: [
            'Review cache implementation',
            'Check cache key generation',
            'Optimize cache storage'
          ],
          metrics: { 
            firstSearch: duration1, 
            secondSearch: duration2, 
            improvement 
          }
        };
      }

      return {
        component: 'Search Caching',
        status: 'healthy',
        message: `Cache is working well: ${improvement.toFixed(1)}% improvement`,
        recommendations: [],
        metrics: { 
          firstSearch: duration1, 
          secondSearch: duration2, 
          improvement 
        }
      };
    } catch (error) {
      return {
        component: 'Search Caching',
        status: 'critical',
        message: `Cache test error: ${error}`,
        recommendations: [
          'Check cache implementation',
          'Verify cache key generation',
          'Review error handling'
        ]
      };
    }
  }

  /**
   * Check search suggestions
   */
  private async checkSearchSuggestions(): Promise<HealthCheckResult> {
    try {
      const testData = [
        { name: 'Bank Account', description: 'Main bank account', type: 'bank' },
        { name: 'Credit Card', description: 'Visa credit card', type: 'credit' }
      ];

      const suggestions = searchService.getSuggestions(
        testData,
        'bank',
        ['name', 'description', 'type'],
        5
      );

      if (suggestions.length === 0) {
        return {
          component: 'Search Suggestions',
          status: 'critical',
          message: 'No suggestions generated',
          recommendations: [
            'Check suggestion algorithm',
            'Verify data format',
            'Test with different queries'
          ]
        };
      }

      if (!suggestions.some(s => s.toLowerCase().includes('bank'))) {
        return {
          component: 'Search Suggestions',
          status: 'warning',
          message: 'Suggestions not matching query',
          recommendations: [
            'Review suggestion algorithm',
            'Check data filtering logic',
            'Test with different data types'
          ],
          metrics: { suggestionCount: suggestions.length }
        };
      }

      return {
        component: 'Search Suggestions',
        status: 'healthy',
        message: `Suggestions working correctly: ${suggestions.length} suggestions`,
        recommendations: [],
        metrics: { suggestionCount: suggestions.length }
      };
    } catch (error) {
      return {
        component: 'Search Suggestions',
        status: 'critical',
        message: `Suggestion test error: ${error}`,
        recommendations: [
          'Check suggestion service implementation',
          'Verify data format compatibility',
          'Review error handling'
        ]
      };
    }
  }

  /**
   * Generate recommendations based on health check results
   */
  private generateRecommendations(results: HealthCheckResult[]): string[] {
    const recommendations: string[] = [];

    const criticalIssues = results.filter(r => r.status === 'critical');
    const warningIssues = results.filter(r => r.status === 'warning');

    if (criticalIssues.length > 0) {
      recommendations.push('🚨 Critical issues detected - immediate attention required');
      criticalIssues.forEach(issue => {
        recommendations.push(`• Fix ${issue.component}: ${issue.message}`);
      });
    }

    if (warningIssues.length > 0) {
      recommendations.push('⚠️ Warning issues detected - should be addressed soon');
      warningIssues.forEach(issue => {
        recommendations.push(`• Improve ${issue.component}: ${issue.message}`);
      });
    }

    if (criticalIssues.length === 0 && warningIssues.length === 0) {
      recommendations.push('✅ All systems healthy - consider performance optimizations');
      recommendations.push('• Monitor search analytics for trends');
      recommendations.push('• Consider adding more search features');
    }

    return recommendations;
  }
}

// Export health checker instance
export const searchHealthChecker = new SearchHealthChecker();

// Helper function to run health check
export const runSearchHealthCheck = async (): Promise<SearchHealthReport> => {
  return await searchHealthChecker.runHealthCheck();
};

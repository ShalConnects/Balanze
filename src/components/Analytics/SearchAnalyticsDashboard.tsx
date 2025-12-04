import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Clock, Target, BarChart3, Download, Trash2, Eye } from 'lucide-react';
import { searchAnalytics, SearchMetrics } from '../../utils/searchAnalytics';

interface SearchAnalyticsDashboardProps {
  className?: string;
}

export const SearchAnalyticsDashboard: React.FC<SearchAnalyticsDashboardProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<SearchMetrics | null>(null);
  const [performanceInsights, setPerformanceInsights] = useState<any>(null);
  const [userPatterns, setUserPatterns] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    setIsLoading(true);
    try {
      const metricsData = searchAnalytics.getMetrics();
      const performanceData = searchAnalytics.getPerformanceInsights();
      const patternsData = searchAnalytics.getUserSearchPatterns();

      setMetrics(metricsData);
      setPerformanceInsights(performanceData);
      setUserPatterns(patternsData);
    } catch (error) {
      console.error('Failed to load search analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportAnalytics = () => {
    try {
      const data = searchAnalytics.exportAnalytics();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export analytics:', error);
    }
  };

  const clearAnalytics = () => {
    if (window.confirm('Are you sure you want to clear all search analytics data? This action cannot be undone.')) {
      searchAnalytics.clearAnalytics();
      loadAnalytics();
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Search Analytics Data
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start searching to see analytics data here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Search Analytics
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Track search performance and user behavior
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={exportAnalytics}
              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Export Analytics"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={clearAnalytics}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Clear Analytics"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={loadAnalytics}
              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              title="Refresh Data"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Searches */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Searches</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {metrics.totalSearches.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Average Search Time */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Avg Search Time</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {metrics.averageSearchTime.toFixed(0)}ms
                </p>
              </div>
            </div>
          </div>

          {/* Click Through Rate */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Click Through Rate</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {metrics.clickThroughRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Zero Result Rate */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Zero Result Rate</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {metrics.zeroResultRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Queries */}
        {metrics.popularQueries.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Queries</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.popularQueries.slice(0, 6).map((query, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {query.query}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                    {query.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search by Page */}
        {Object.keys(metrics.searchByPage).length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Searches by Page</h3>
            <div className="space-y-2">
              {Object.entries(metrics.searchByPage)
                .sort((a, b) => b[1] - a[1])
                .map(([page, count]) => (
                  <div key={page} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {page === '/' ? 'Dashboard' : page.replace('/', '').replace('-', ' ')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Performance Insights */}
        {performanceInsights && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Insights</h3>
            
            {performanceInsights.slowSearches.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Slow Searches (>500ms)</h4>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {performanceInsights.slowSearches.length} searches took longer than 500ms
                </div>
              </div>
            )}

            {performanceInsights.highZeroResultQueries.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">High Zero Result Queries</h4>
                <div className="flex flex-wrap gap-2">
                  {performanceInsights.highZeroResultQueries.slice(0, 5).map((query, index) => (
                    <span key={index} className="text-xs bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 px-2 py-1 rounded-full">
                      {query}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {performanceInsights.popularSuggestionQueries.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Popular Suggestions</h4>
                <div className="flex flex-wrap gap-2">
                  {performanceInsights.popularSuggestionQueries.map((query, index) => (
                    <span key={index} className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 px-2 py-1 rounded-full">
                      {query}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Patterns */}
        {userPatterns && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Search Patterns</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Average Searches per Session</h4>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userPatterns.averageSearchesPerSession.toFixed(1)}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Search Sessions</h4>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userPatterns.searchSessionLength}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

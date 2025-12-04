import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Link, 
  Clock, 
  Users, 
  BarChart3, 
  Download,
  AlertCircle,
  CheckCircle,
  Target,
  Eye
} from 'lucide-react';
import { getSEOAnalytics, getContentGapAnalysis, seoAnalytics } from '../lib/seoAnalytics';

interface SEOAnalyticsDashboardProps {
  className?: string;
}

const SEOAnalyticsDashboard: React.FC<SEOAnalyticsDashboardProps> = ({ className = '' }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [contentGaps, setContentGaps] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load analytics data
    const loadAnalytics = () => {
      const analyticsData = getSEOAnalytics();
      const gapsData = getContentGapAnalysis();
      
      setAnalytics(analyticsData);
      setContentGaps(gapsData);
      setIsLoading(false);
    };

    loadAnalytics();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const exportAnalytics = () => {
    const data = seoAnalytics.exportAnalyticsData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            SEO Analytics Dashboard
          </h3>
        </div>
        <button
          onClick={exportAnalytics}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Page Views</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {analytics?.pageViews || 0}
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Link className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Internal Links</span>
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {analytics?.internalLinkClicks || 0}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Avg. Time</span>
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {analytics?.averageTimeOnPage ? `${Math.round(analytics.averageTimeOnPage)}s` : '0s'}
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Bounce Rate</span>
          </div>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {analytics?.bounceRate ? `${Math.round(analytics.bounceRate)}%` : '0%'}
          </div>
        </div>
      </div>

      {/* Top Internal Links */}
      {analytics?.topInternalLinks && analytics.topInternalLinks.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            🔗 Top Internal Links
          </h4>
          <div className="space-y-2">
            {analytics.topInternalLinks.slice(0, 5).map((link: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">
                  {link.targetSlug}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {link.clicks} clicks
                  </span>
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    {Math.round(link.clickRate)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Gap Analysis */}
      {contentGaps && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            📊 Content Gap Analysis
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-700 dark:text-red-300">Missing Articles</span>
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">
                {contentGaps.missingArticles?.length || 0} articles needed
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-yellow-700 dark:text-yellow-300">High Opportunity</span>
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                {contentGaps.highOpportunityKeywords?.length || 0} keywords
              </div>
            </div>
          </div>

          {/* Suggested Content */}
          {contentGaps.suggestedContent && contentGaps.suggestedContent.length > 0 && (
            <div className="mt-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Suggested Content:</h5>
              <div className="space-y-2">
                {contentGaps.suggestedContent.slice(0, 3).map((content: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h6 className="font-medium text-gray-900 dark:text-white">
                          {content.title}
                        </h6>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {content.description}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {content.targetKeywords.slice(0, 2).map((keyword: string, i: number) => (
                            <span key={i} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        content.priority === 'high' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : content.priority === 'medium'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {content.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="font-medium text-gray-900 dark:text-white">Performance Insights</span>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {analytics?.bounceRate < 50 ? (
            <span className="text-green-600 dark:text-green-400">✅ Good bounce rate - users are engaging with content</span>
          ) : (
            <span className="text-red-600 dark:text-red-400">⚠️ High bounce rate - consider improving content relevance</span>
          )}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {analytics?.averageTimeOnPage > 60 ? (
            <span className="text-green-600 dark:text-green-400">✅ Good engagement time - users are reading content</span>
          ) : (
            <span className="text-yellow-600 dark:text-yellow-400">⚠️ Low engagement time - consider shorter, more focused content</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SEOAnalyticsDashboard;

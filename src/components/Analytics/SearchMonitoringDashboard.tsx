import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  BarChart3,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { runSearchHealthCheck, SearchHealthReport } from '../../utils/searchHealthCheck';
import { runSearchTests, TestSuite } from '../../utils/searchTestSuite';
import { searchAnalytics } from '../../utils/searchAnalytics';

interface SearchMonitoringDashboardProps {
  className?: string;
}

export const SearchMonitoringDashboard: React.FC<SearchMonitoringDashboardProps> = ({ className }) => {
  const [healthReport, setHealthReport] = useState<SearchHealthReport | null>(null);
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const runFullDiagnostics = async () => {
    setIsLoading(true);
    try {
      // Run health check
      const health = await runSearchHealthCheck();
      setHealthReport(health);

      // Run test suite
      const tests = await runSearchTests();
      setTestSuite(tests);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    runFullDiagnostics();
  }, []);

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
                Search Monitoring
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Comprehensive search system diagnostics
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={runFullDiagnostics}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isLoading ? 'Running...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Running Diagnostics...
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Please wait while we check all search systems
            </p>
          </div>
        )}

        {!isLoading && healthReport && testSuite && (
          <>
            {/* Overall Status */}
            <div className="mb-8">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${getStatusColor(healthReport.overallStatus)}`}>
                {getStatusIcon(healthReport.overallStatus)}
                <span className="font-medium">
                  Overall Status: {healthReport.overallStatus.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Health Summary */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Healthy</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {healthReport.summary.healthy}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      {healthReport.summary.warnings}
                    </p>
                  </div>
                </div>
              </div>

              {/* Critical Issues */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Critical</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {healthReport.summary.critical}
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Success Rate */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Test Success</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {((testSuite.passedTests / testSuite.totalTests) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Check Results */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Health Check Results</h3>
              <div className="space-y-3">
                {healthReport.results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={getStatusColor(result.status)}>
                        {getStatusIcon(result.status)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {result.component}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {result.message}
                        </p>
                        {result.recommendations.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Recommendations:</p>
                            <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                              {result.recommendations.slice(0, 2).map((rec, i) => (
                                <li key={i}>• {rec}</li>
                              ))}
                              {result.recommendations.length > 2 && (
                                <li>• +{result.recommendations.length - 2} more...</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Results Summary */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test Results Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900 dark:text-white">Passed Tests</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {testSuite.passedTests}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-900 dark:text-white">Total Duration</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {testSuite.totalDuration.toFixed(0)}ms
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-gray-900 dark:text-white">Total Tests</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {testSuite.totalTests}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {healthReport.recommendations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommendations</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <ul className="space-y-2">
                    {healthReport.recommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm text-blue-800 dark:text-blue-200">
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Last Update */}
            {lastUpdate && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdate.toLocaleString()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

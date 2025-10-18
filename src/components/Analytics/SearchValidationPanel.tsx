import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, Clock, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { runSearchTests, TestSuite, TestResult } from '../../utils/searchTestSuite';

interface SearchValidationPanelProps {
  className?: string;
}

export const SearchValidationPanel: React.FC<SearchValidationPanelProps> = ({ className }) => {
  const [testSuite, setTestSuite] = useState<TestSuite | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const suite = await runSearchTests();
      setTestSuite(suite);
      setLastRun(new Date());
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const exportReport = () => {
    if (!testSuite) return;
    
    const report = generateReport(testSuite);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-validation-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReport = (suite: TestSuite): string => {
    return `
# Search Validation Report

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
`).join('')}

Generated on: ${new Date().toISOString()}
`;
  };

  const getStatusColor = (result: TestResult) => {
    if (result.passed) {
      if (result.duration < 100) return 'text-green-600';
      if (result.duration < 500) return 'text-yellow-600';
      return 'text-orange-600';
    }
    return 'text-red-600';
  };

  const getStatusIcon = (result: TestResult) => {
    if (result.passed) {
      return <CheckCircle className="w-4 h-4" />;
    }
    return <XCircle className="w-4 h-4" />;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Search Validation
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Test and validate search functionality
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? 'Running...' : 'Run Tests'}
            </button>
            
            {testSuite && (
              <button
                onClick={exportReport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!testSuite && !isRunning && (
          <div className="text-center py-8">
            <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Ready to Test
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Click "Run Tests" to validate all search functionality
            </p>
            <button
              onClick={runTests}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Start Testing
            </button>
          </div>
        )}

        {isRunning && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Running Tests...
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Please wait while we validate the search system
            </p>
          </div>
        )}

        {testSuite && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Tests</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {testSuite.totalTests}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Passed</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {testSuite.passedTests}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">Failed</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                      {testSuite.failedTests}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Duration</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {testSuite.totalDuration.toFixed(0)}ms
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Rate */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Success Rate</h3>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {((testSuite.passedTests / testSuite.totalTests) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    testSuite.passedTests === testSuite.totalTests
                      ? 'bg-green-500'
                      : testSuite.passedTests / testSuite.totalTests > 0.8
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${(testSuite.passedTests / testSuite.totalTests) * 100}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Test Results */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test Results</h3>
              <div className="space-y-3">
                {testSuite.results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={getStatusColor(result)}>
                        {getStatusIcon(result)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {result.testName}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {result.message}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {result.duration.toFixed(2)}ms
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {result.duration < 100 ? 'Fast' : result.duration < 500 ? 'Medium' : 'Slow'}
                        </div>
                      </div>
                      
                      {!result.passed && (
                        <div className="text-red-500">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Last Run Info */}
            {lastRun && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last run: {lastRun.toLocaleString()}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

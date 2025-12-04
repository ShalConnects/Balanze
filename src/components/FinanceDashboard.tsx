import React, { useState, useEffect, useMemo } from 'react';
import TrendChart from './charts/TrendChart';
import BudgetChart from './charts/BudgetChart';
import SankeyView from './charts/SankeyView';
import GoalsPanel from './GoalsPanel';
import { chartColors } from '../styles/colors';
import { format, differenceInDays, startOfMonth, endOfMonth } from 'date-fns';
import { Download, Calendar } from 'lucide-react';

interface KPIData {
  availableCash: number;
  sevenDayRunway: number;
  monthlyNetFlow: number;
  goalProgress: number;
}

interface AlertData {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  actions: string[];
  daysUntilCritical?: number;
}

interface InsightData {
  text: string;
  confidence: number;
  explanation: string;
  suggestions: string[];
  source: 'ai' | 'deterministic';
}

interface FinanceDashboardProps {
  className?: string;
  currency?: string;
  onAnalyticsTrack?: (event: string, properties: Record<string, any>) => void;
  onExportData?: (format: 'csv' | 'pdf' | 'excel') => void;
}

// Mock data generators
const generateMockKPIs = (): KPIData => ({
  availableCash: 45000,
  sevenDayRunway: 15,
  monthlyNetFlow: 8500,
  goalProgress: 68
});

const generateMockAlerts = (): AlertData[] => [
  {
    id: 'low-runway',
    type: 'warning',
    title: 'Low Cash Runway',
    message: 'At current spending rate, you\'ll run out of cash in 15 days',
    actions: ['Transfer from savings', 'Pause subscriptions', 'Reduce discretionary spending'],
    daysUntilCritical: 15
  },
  {
    id: 'budget-overspend',
    type: 'error',
    title: 'Budget Exceeded',
    message: 'You\'ve spent 130% of your dining budget this month',
    actions: ['Set spending alerts', 'Cook more at home', 'Review dining budget']
  }
];

const generateMockInsights = (): InsightData => ({
  text: 'Your spending on dining has increased by 45% compared to last month, primarily due to weekend restaurant visits.',
  confidence: 0.87,
  explanation: 'This insight is based on transaction categorization and spending pattern analysis over the past 60 days.',
  suggestions: [
    'Set a weekly dining budget limit',
    'Try meal prep for weekends',
    'Use dining rewards credit cards'
  ],
  source: 'ai'
});

// KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: string | number;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  'aria-label'?: string;
}> = ({ title, value, delta, trend, onClick, 'aria-label': ariaLabel }) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 text-left w-full"
      aria-label={ariaLabel || `${title}: ${value}${delta ? `, ${delta}` : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {trend && (
          <div className={`flex items-center ${getTrendColor()}`}>
            {getTrendIcon()}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {delta && (
        <p className={`text-sm mt-1 ${getTrendColor()}`}>
          {delta}
        </p>
      )}
    </button>
  );
};

// Alert Card Component
const AlertCard: React.FC<{
  alert: AlertData;
  onAction: (alertId: string, action: string) => void;
  onDismiss: (alertId: string) => void;
}> = ({ alert, onAction, onDismiss }) => {
  const getAlertStyles = () => {
    switch (alert.type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getAlertIcon = () => {
    switch (alert.type) {
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getAlertStyles()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getAlertIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">{alert.title}</h3>
            <button
              onClick={() => onDismiss(alert.id)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss alert"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm mb-3">{alert.message}</p>
          {alert.daysUntilCritical && (
            <p className="text-xs font-medium mb-3">
              {alert.daysUntilCritical} days remaining
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {alert.actions.slice(0, 3).map((action, index) => (
              <button
                key={index}
                onClick={() => onAction(alert.id, action)}
                className="px-3 py-1 text-xs font-medium bg-white border border-current rounded-full hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Insights Component
const InsightsSection: React.FC<{
  insight: InsightData;
  onAcceptSuggestion: (suggestion: string) => void;
}> = ({ insight, onAcceptSuggestion }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">AI Insight</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {(insight.confidence * 100).toFixed(0)}% confidence
              </span>
              <div className={`w-2 h-2 rounded-full ${
                insight.source === 'ai' ? 'bg-blue-500' : 'bg-gray-500'
              }`} />
            </div>
          </div>
          <p className="text-gray-700 mb-3">{insight.text}</p>
          
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
            aria-expanded={showExplanation}
          >
            Why we say that {showExplanation ? '▼' : '▶'}
          </button>
          
          {showExplanation && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">{insight.explanation}</p>
              <p className="text-xs text-gray-500">
                Source: {insight.source === 'ai' ? 'AI Analysis' : 'Rule-based Analysis'}
              </p>
            </div>
          )}
        </div>
      </div>

      {insight.suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Suggested Actions</h4>
          <div className="space-y-2">
            {insight.suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onAcceptSuggestion(suggestion)}
                className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main Dashboard Component
const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  className = '',
  currency = '₹',
  onAnalyticsTrack,
  onExportData
}) => {
  const [kpiData] = useState<KPIData>(generateMockKPIs());
  const [alerts, setAlerts] = useState<AlertData[]>(generateMockAlerts());
  const [insight] = useState<InsightData>(generateMockInsights());
  const [showMoneyFlow, setShowMoneyFlow] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dateFilter, setDateFilter] = useState<'this_month' | 'last_3_months' | 'last_6_months' | 'this_year'>('this_month');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu && !(event.target as Element).closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  const formatCurrency = (amount: number) => `${currency}${amount.toLocaleString()}`;

  const kpiDeltas = useMemo(() => {
    return {
      cash: '+12% from last week',
      runway: '-3 days from last week',
      netFlow: '+₹2,300 from last month',
      goals: '+5% this month'
    };
  }, []);

  const handleKPIClick = (kpiType: string) => {
    onAnalyticsTrack?.('kpi_click', { kpi_type: kpiType });
    // Handle KPI drill-down navigation
  };

  const handleAlertAction = (alertId: string, action: string) => {
    onAnalyticsTrack?.('alert_action', { alert_id: alertId, action });
    // Handle alert actions
  };

  const handleAlertDismiss = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
    onAnalyticsTrack?.('alert_dismiss', { alert_id: alertId });
  };

  const handleInsightAccept = (suggestion: string) => {
    onAnalyticsTrack?.('insight_accept', { suggestion });
    // Handle insight suggestion acceptance
  };

  const handleGoalAction = (goalId: string, action: string) => {
    onAnalyticsTrack?.('goal_action', { goal_id: goalId, action });
    // Handle goal actions
  };

  const handleDateFilterChange = (filter: typeof dateFilter) => {
    setDateFilter(filter);
    onAnalyticsTrack?.('date_filter_change', { filter });
  };

  const handleExportData = (format: 'csv' | 'pdf' | 'excel') => {
    onExportData?.(format);
    onAnalyticsTrack?.('export_data', { format, date_filter: dateFilter });
    setShowExportMenu(false);
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'this_month': return 'This Month';
      case 'last_3_months': return 'Last 3 Months';
      case 'last_6_months': return 'Last 6 Months';
      case 'this_year': return 'This Year';
      default: return 'This Month';
    }
  };

  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case 'this_month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'last_3_months':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 3, 1),
          end: endOfMonth(now)
        };
      case 'last_6_months':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 6, 1),
          end: endOfMonth(now)
        };
      case 'this_year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31)
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  };

  return (
    <main className={`p-4 max-w-screen-xl mx-auto ${className}`}>
      {/* KPI Header - Sticky */}
      <header className="sticky top-0 bg-white/90 backdrop-blur z-10 p-4 -m-4 mb-4 border-b border-gray-200">
        <div className={`grid gap-4 ${
          isMobile ? 'grid-cols-2' : 'grid-cols-4'
        }`}>
          <KPICard
            title="Available Cash"
            value={formatCurrency(kpiData.availableCash)}
            delta={kpiDeltas.cash}
            trend="up"
            onClick={() => handleKPIClick('available_cash')}
            aria-label={`Available cash: ${formatCurrency(kpiData.availableCash)}, up 12% from last week`}
          />
          <KPICard
            title="7-Day Runway"
            value={`${kpiData.sevenDayRunway} days`}
            delta={kpiDeltas.runway}
            trend="down"
            onClick={() => handleKPIClick('runway')}
            aria-label={`7-day runway: ${kpiData.sevenDayRunway} days, down 3 days from last week`}
          />
          {!isMobile && (
            <>
              <KPICard
                title="Monthly Net Flow"
                value={formatCurrency(kpiData.monthlyNetFlow)}
                delta={kpiDeltas.netFlow}
                trend="up"
                onClick={() => handleKPIClick('net_flow')}
                aria-label={`Monthly net flow: ${formatCurrency(kpiData.monthlyNetFlow)}, up ₹2,300 from last month`}
              />
              <KPICard
                title="Goal Progress"
                value={`${kpiData.goalProgress}%`}
                delta={kpiDeltas.goals}
                trend="up"
                onClick={() => handleKPIClick('goal_progress')}
                aria-label={`Goal progress: ${kpiData.goalProgress}%, up 5% this month`}
              />
            </>
          )}
        </div>
        
        {/* Mobile: Show collapsed additional KPIs */}
        {isMobile && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <KPICard
              title="Net Flow"
              value={formatCurrency(kpiData.monthlyNetFlow)}
              delta={kpiDeltas.netFlow}
              trend="up"
              onClick={() => handleKPIClick('net_flow')}
            />
            <KPICard
              title="Goals"
              value={`${kpiData.goalProgress}%`}
              delta={kpiDeltas.goals}
              trend="up"
              onClick={() => handleKPIClick('goal_progress')}
            />
          </div>
        )}

        {/* Filter and Export Controls */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Period:</span>
            <div className="flex flex-wrap gap-1">
              {(['this_month', 'last_3_months', 'last_6_months', 'this_year'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleDateFilterChange(filter)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                    dateFilter === filter
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                  aria-pressed={dateFilter === filter}
                >
                  {filter === 'this_month' ? 'This Month' :
                   filter === 'last_3_months' ? 'Last 3 Months' :
                   filter === 'last_6_months' ? 'Last 6 Months' :
                   'This Year'}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              {format(getDateRange().start, 'MMM dd')} - {format(getDateRange().end, 'MMM dd, yyyy')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Data Button */}
            <div className="relative export-menu-container">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-expanded={showExportMenu}
                aria-label="Export data options"
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
                <svg className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <button
                      onClick={() => handleExportData('csv')}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExportData('pdf')}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Export as PDF
                    </button>
                    <button
                      onClick={() => handleExportData('excel')}
                      className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export as Excel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <section className="mb-6">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onAction={handleAlertAction}
                onDismiss={handleAlertDismiss}
              />
            ))}
          </div>
        </section>
      )}

      {/* Main Dashboard Grid */}
      <section className={`grid gap-6 ${
        isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
      }`}>
        {/* Trend Chart - Full width on mobile, 2 columns on desktop */}
        <div className={isMobile ? 'col-span-1' : 'col-span-2'}>
          <TrendChart aria-labelledby="trend-title" />
        </div>

        {/* Right Sidebar */}
        <aside className="space-y-6">
          <BudgetChart currency={currency} />
          <GoalsPanel currency={currency} onGoalAction={handleGoalAction} />
        </aside>
      </section>

      {/* Expandable Money Flow Section */}
      <section className="mt-6">
        <button
          type="button"
          onClick={() => {
            setShowMoneyFlow(!showMoneyFlow);
            onAnalyticsTrack?.('money_flow_toggle', { expanded: !showMoneyFlow });
          }}
          className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-expanded={showMoneyFlow}
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h2 className="text-lg font-semibold text-gray-900">Money Flow Analysis</h2>
              <p className="text-sm text-gray-500">Income sources to spending categories</p>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${showMoneyFlow ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {showMoneyFlow && (
          <div className="mt-4">
            <SankeyView currency={currency} />
          </div>
        )}
      </section>

      {/* AI Insights Section */}
      <section className="mt-6">
        <InsightsSection
          insight={insight}
          onAcceptSuggestion={handleInsightAccept}
        />
      </section>

      {/* Hidden accessibility summary for screen readers */}
      <div className="sr-only">
        <h2>Dashboard Summary</h2>
        <p>
          Current financial status: Available cash {formatCurrency(kpiData.availableCash)}, 
          {kpiData.sevenDayRunway} days runway, monthly net flow {formatCurrency(kpiData.monthlyNetFlow)}, 
          {kpiData.goalProgress}% goal progress.
        </p>
        {alerts.length > 0 && (
          <div>
            <h3>Active Alerts</h3>
            <ul>
              {alerts.map(alert => (
                <li key={alert.id}>{alert.type}: {alert.title} - {alert.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
};

export default FinanceDashboard;


import React, { useState, useEffect } from 'react';
import FinanceDashboard from '../components/FinanceDashboard';
import PhoneLayout from '../components/PhoneLayout';
import { getDashboardAnalytics, trackDashboardLoad } from '../lib/dashboardAnalytics';

const DashboardDemo: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [currency, setCurrency] = useState('₹');
  const [loadTime, setLoadTime] = useState<number | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Track load time
    const handleLoad = () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      setLoadTime(duration);
      trackDashboardLoad(duration);
    };
    
    // Use setTimeout to ensure all components are rendered
    const timer = setTimeout(handleLoad, 100);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  const analytics = getDashboardAnalytics();

  const handleAnalyticsTrack = (event: string, properties: Record<string, any>) => {
    analytics.track(event, properties);
  };

  const mockKPIData = {
    availableCash: 45000,
    sevenDayRunway: 15,
    monthlyNetFlow: 8500,
    goalProgress: 68
  };

  const handleKPIClick = (kpiType: string) => {
    handleAnalyticsTrack('kpi_click', { kpi_type: kpiType });
  };

  const handleActionClick = (action: string) => {
    handleAnalyticsTrack('mobile_action', { action });
  };

  const handleExportData = (format: 'csv' | 'pdf' | 'excel') => {
    // Simulate export functionality
    const exportData = {
      format,
      dateRange: 'This Month',
      timestamp: new Date().toISOString(),
      data: {
        kpis: mockKPIData,
        charts: ['trend', 'budget', 'goals'],
        period: 'current_month'
      }
    };
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: format === 'csv' ? 'text/csv' : 
            format === 'pdf' ? 'application/pdf' : 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-dashboard-export-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    handleAnalyticsTrack('export_data', { format });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Personal Finance Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Responsive, accessible, and AI-powered financial insights
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Currency Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="currency-select" className="text-sm font-medium text-gray-700">
                  Currency:
                </label>
                <select
                  id="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="₹">₹ (INR)</option>
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                </select>
              </div>
              
              {/* Layout Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Layout:</span>
                <button
                  onClick={() => setIsMobile(!isMobile)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                    isMobile
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                  aria-pressed={isMobile}
                >
                  {isMobile ? 'Mobile' : 'Desktop'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Performance Info */}
          {loadTime && (
            <div className="mt-3 text-xs text-gray-500">
              Dashboard loaded in {loadTime.toFixed(1)}ms
            </div>
          )}
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="py-6">
        {isMobile ? (
          <div className="max-w-sm mx-auto">
            <PhoneLayout
              kpiData={mockKPIData}
              currency={currency}
              onKPIClick={handleKPIClick}
              onActionClick={handleActionClick}
            />
          </div>
        ) : (
          <FinanceDashboard
            currency={currency}
            onAnalyticsTrack={handleAnalyticsTrack}
            onExportData={handleExportData}
          />
        )}
      </main>

      {/* Demo Footer */}
      <footer className="bg-white border-t border-gray-200 p-6 mt-12">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Accessibility Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• WCAG 2.1 AA compliant</li>
                <li>• Keyboard navigation support</li>
                <li>• Screen reader optimized</li>
                <li>• Colorblind-safe palettes</li>
                <li>• 44px minimum tap targets</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Technical Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• React + TypeScript</li>
                <li>• Tailwind CSS styling</li>
                <li>• Recharts visualizations</li>
                <li>• Progressive disclosure</li>
                <li>• Privacy-focused analytics</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Design Principles</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Evidence-based UX</li>
                <li>• Mobile-first responsive</li>
                <li>• Loss aversion framing</li>
                <li>• AI-powered insights</li>
                <li>• Performance optimized</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Built with accessibility, performance, and user experience in mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardDemo;


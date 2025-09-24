import React, { useState, useRef, useEffect } from 'react';
import { chartColors } from '../styles/colors';

interface PhoneLayoutProps {
  kpiData: {
    availableCash: number;
    sevenDayRunway: number;
    monthlyNetFlow: number;
    goalProgress: number;
  };
  currency?: string;
  onKPIClick?: (kpiType: string) => void;
  onActionClick?: (action: string) => void;
  className?: string;
}

interface SwipeableCardProps {
  cards: React.ReactNode[];
  currentIndex: number;
  onSwipe: (index: number) => void;
}

// Swipeable cards component for mobile
const SwipeableCards: React.FC<SwipeableCardProps> = ({ cards, currentIndex, onSwipe }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diff = startX - currentX;
    const threshold = 50; // Minimum swipe distance
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < cards.length - 1) {
        // Swipe left - next card
        onSwipe(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right - previous card
        onSwipe(currentIndex - 1);
      }
    }
    
    setIsDragging(false);
    setCurrentX(0);
    setStartX(0);
  };

  return (
    <div className="relative overflow-hidden">
      <div
        ref={containerRef}
        className="flex transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {cards.map((card, index) => (
          <div key={index} className="w-full flex-shrink-0">
            {card}
          </div>
        ))}
      </div>
      
      {/* Pagination dots */}
      <div className="flex justify-center mt-4 space-x-2">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => onSwipe(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

// Compact KPI card for mobile
const CompactKPICard: React.FC<{
  title: string;
  value: string;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  onClick?: () => void;
}> = ({ title, value, delta, trend, icon, onClick }) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
      style={{ minHeight: '44px' }} // Ensure 44px minimum tap target
    >
      <div className="flex items-start justify-between mb-3">
        <div className="text-blue-600 opacity-80">
          {icon}
        </div>
        {trend && (
          <div className={`text-xs ${getTrendColor()}`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </div>
        )}
      </div>
      
      <div className="text-left">
        <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-lg font-bold text-gray-900 mb-1">{value}</p>
        {delta && (
          <p className={`text-xs ${getTrendColor()}`}>
            {delta}
          </p>
        )}
      </div>
    </button>
  );
};

// Quick action button
const QuickActionButton: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}> = ({ title, description, icon, color, onClick }) => (
  <button
    onClick={onClick}
    className="w-full p-4 text-left bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
    style={{ minHeight: '44px' }}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
);

// Mini trend visualization
const MiniTrendChart: React.FC<{
  data: number[];
  trend: 'up' | 'down' | 'neutral';
}> = ({ data, trend }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = range > 0 ? ((max - value) / range) * 100 : 50;
    return `${x},${y}`;
  }).join(' ');

  const color = trend === 'up' ? chartColors.kpi.positive : 
                trend === 'down' ? chartColors.kpi.negative : 
                chartColors.kpi.neutral;

  return (
    <div className="w-full h-16 bg-gray-50 rounded-lg p-2">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          stroke={color}
          strokeWidth="2"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {/* Fill area under curve */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill={color}
          fillOpacity="0.1"
        />
      </svg>
    </div>
  );
};

const PhoneLayout: React.FC<PhoneLayoutProps> = ({
  kpiData,
  currency = '₹',
  onKPIClick,
  onActionClick,
  className = ''
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const formatCurrency = (amount: number) => `${currency}${amount.toLocaleString()}`;

  // Generate mock trend data for mini charts
  const trendData = {
    cash: [42000, 44000, 43500, 45000, 47000, 45000, 45000],
    runway: [18, 16, 14, 15, 13, 14, 15],
    netFlow: [6200, 7100, 8500, 7800, 8500, 9200, 8500],
    goals: [60, 62, 65, 66, 68, 67, 68]
  };

  // KPI cards for swipeable view
  const kpiCards = [
    <div key="cash" className="p-1">
      <CompactKPICard
        title="Available Cash"
        value={formatCurrency(kpiData.availableCash)}
        delta="+12% this week"
        trend="up"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        }
        onClick={() => onKPIClick?.('available_cash')}
      />
      <div className="mt-3">
        <MiniTrendChart data={trendData.cash} trend="up" />
      </div>
    </div>,
    
    <div key="runway" className="p-1">
      <CompactKPICard
        title="Cash Runway"
        value={`${kpiData.sevenDayRunway} days`}
        delta="-3 days from last week"
        trend="down"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        onClick={() => onKPIClick?.('runway')}
      />
      <div className="mt-3">
        <MiniTrendChart data={trendData.runway} trend="down" />
      </div>
    </div>,
    
    <div key="netflow" className="p-1">
      <CompactKPICard
        title="Monthly Net Flow"
        value={formatCurrency(kpiData.monthlyNetFlow)}
        delta="+₹2,300 from last month"
        trend="up"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
        onClick={() => onKPIClick?.('net_flow')}
      />
      <div className="mt-3">
        <MiniTrendChart data={trendData.netFlow} trend="up" />
      </div>
    </div>,
    
    <div key="goals" className="p-1">
      <CompactKPICard
        title="Goal Progress"
        value={`${kpiData.goalProgress}%`}
        delta="+5% this month"
        trend="up"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        onClick={() => onKPIClick?.('goal_progress')}
      />
      <div className="mt-3">
        <MiniTrendChart data={trendData.goals} trend="up" />
      </div>
    </div>
  ];

  const quickActions = [
    {
      title: 'Add Transaction',
      description: 'Record income or expense',
      icon: <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>,
      color: 'bg-blue-500',
      action: 'add_transaction'
    },
    {
      title: 'Set Budget Alert',
      description: 'Get notified when spending limits are reached',
      icon: <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
      </svg>,
      color: 'bg-orange-500',
      action: 'set_alert'
    },
    {
      title: 'Auto-Save Setup',
      description: 'Automatically save ₹500/month',
      icon: <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>,
      color: 'bg-green-500',
      action: 'setup_autosave'
    },
    {
      title: 'View Reports',
      description: 'Detailed spending analysis',
      icon: <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>,
      color: 'bg-purple-500',
      action: 'view_reports'
    }
  ];

  return (
    <div className={`max-w-sm mx-auto bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            <p className="text-xs text-gray-500">Financial Overview</p>
          </div>
          <button
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            style={{ minHeight: '44px', minWidth: '44px' }}
            aria-label="More options"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* KPI Cards - Swipeable */}
      <div className="p-4">
        <SwipeableCards
          cards={kpiCards}
          currentIndex={currentSlide}
          onSwipe={setCurrentSlide}
        />
      </div>

      {/* Quick Actions */}
      <div className="p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="space-y-3">
          {quickActions.slice(0, showMoreOptions ? quickActions.length : 2).map((action, index) => (
            <QuickActionButton
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              color={action.color}
              onClick={() => onActionClick?.(action.action)}
            />
          ))}
        </div>
        
        {!showMoreOptions && quickActions.length > 2 && (
          <button
            onClick={() => setShowMoreOptions(true)}
            className="w-full mt-3 p-3 text-center text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            style={{ minHeight: '44px' }}
          >
            Show More Actions ({quickActions.length - 2} more)
          </button>
        )}
      </div>

      {/* Bottom Navigation Hint */}
      <div className="p-4 pb-8">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Tip</p>
              <p className="text-xs text-gray-600">Swipe left/right on KPI cards for more details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden accessibility info */}
      <div className="sr-only">
        <h2>Mobile Dashboard Summary</h2>
        <p>
          Showing KPI card {currentSlide + 1} of {kpiCards.length}. 
          Current metrics: Available cash {formatCurrency(kpiData.availableCash)}, 
          {kpiData.sevenDayRunway} days runway, monthly net flow {formatCurrency(kpiData.monthlyNetFlow)}, 
          {kpiData.goalProgress}% goal progress.
        </p>
      </div>
    </div>
  );
};

export default PhoneLayout;

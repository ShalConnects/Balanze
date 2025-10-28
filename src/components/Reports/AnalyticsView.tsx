import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Line,
  Area,
  ComposedChart,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  ShoppingBag,
  Handshake,
  Sparkles,
  Trophy,
  Award,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval, parseISO } from 'date-fns';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { detectUserContext } from '../../utils/humorContext';
import { HumorEngine } from '../../utils/humorEngine';
import BudgetChart from '../charts/BudgetChart';
import { supabase } from '../../lib/supabase';

export const AnalyticsView: React.FC = () => {
  const { getActiveTransactions, getDashboardStats, getActiveAccounts, purchases, lendBorrowRecords, getCategories } = useFinanceStore();
  const { profile } = useAuthStore();
  const transactions = getActiveTransactions();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const accounts = getActiveAccounts();
  const stats = getDashboardStats();
  const categories = getCategories();
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'last3' | 'last6' | 'last12'>('current');
  const [selectedCurrency, setSelectedCurrency] = useState(stats.byCurrency[0]?.currency || 'USD');
  const [showTrends, setShowTrends] = useState(true);
  const [expandedAccordions, setExpandedAccordions] = useState({
    total: true,
    budget: false,
    purchase: false,
    lendBorrow: false
  });
  
  // Budget data state
  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [budgetSummary, setBudgetSummary] = useState({
    totalBudget: 0,
    totalSpent: 0,
    remainingBudget: 0,
    overBudgetCount: 0,
    onTrackCount: 0
  });
  const [budgetLoading, setBudgetLoading] = useState(false);

  // Fetch budget data
  const fetchBudgetData = async () => {
    if (!profile?.id) return;
    
    setBudgetLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_categories')
        .select(`
          category_name,
          monthly_budget,
          category_color,
          currency,
          user_id
        `)
        .eq('currency', selectedCurrency)
        .eq('user_id', profile.id);

      if (error) {
        console.error('Error fetching budget data:', error);
        return;
      }

      if (data && data.length > 0) {
        // Get purchases for this month to calculate actual spending
        const { data: purchases, error: purchaseError } = await supabase
          .from('purchases')
          .select('category, price, currency')
          .eq('user_id', profile.id)
          .eq('currency', selectedCurrency)
          .eq('status', 'purchased')
          .gte('purchase_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lt('purchase_date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString());

        if (purchaseError) {
          console.error('Error fetching purchases:', purchaseError);
          return;
        }

        // Calculate spent amount per category
        const spentByCategory = (purchases || []).reduce((acc, purchase) => {
          acc[purchase.category] = (acc[purchase.category] || 0) + purchase.price;
          return acc;
        }, {} as Record<string, number>);

        // Transform data for BudgetChart component
        const chartData = data.map(item => {
          const spent = spentByCategory[item.category_name] || 0;
          const variance = spent - item.monthly_budget;
          const variancePercent = item.monthly_budget > 0 ? (spent / item.monthly_budget) * 100 : 0;
          
          return {
            category: item.category_name,
            budgeted: item.monthly_budget,
            actual: spent,
            variance: variance,
            variancePercent: variancePercent
          };
        });

        setBudgetData(chartData);

        // Calculate summary
        const totalBudget = data.reduce((sum, item) => sum + item.monthly_budget, 0);
        const totalSpent = Object.values(spentByCategory).reduce((sum, spent) => sum + spent, 0);
        const overBudgetCount = chartData.filter(item => item.variance > 0).length;
        
        setBudgetSummary({
          totalBudget,
          totalSpent,
          remainingBudget: totalBudget - totalSpent,
          overBudgetCount,
          onTrackCount: data.length - overBudgetCount
        });
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setBudgetLoading(false);
    }
  };

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

  // Fetch budget data when currency changes
  useEffect(() => {
    fetchBudgetData();
  }, [selectedCurrency, profile?.id]);

  // Export functionality
  const handleExportData = (format: 'csv' | 'pdf' | 'excel') => {
    // Exporting analytics data
    
    // Create comprehensive export data
    const exportData = {
      format,
      dateRange: selectedPeriod,
      currency: selectedCurrency,
      timestamp: new Date().toISOString(),
      analytics: {
        summary: {
          totalTransactions: transactions.length,
          currency: selectedCurrency
        },
        transactions: transactions.map(t => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          category: t.category,
          description: t.description,
          date: t.date
        })),
        accounts: accounts.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type
        })),
        stats: stats,
        period: selectedPeriod,
        generatedAt: new Date().toISOString()
      }
    };
    
    if (format === 'pdf') {
      // For PDF, create a simple text-based report
      const pdfContent = `
ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}
Currency: ${selectedCurrency}
Period: ${selectedPeriod}

SUMMARY:
- Total Transactions: ${transactions.length}

TRANSACTIONS:
${transactions.map(t => 
  `${t.date} | ${t.type.toUpperCase()} | ${formatCurrency(t.amount, selectedCurrency)} | ${t.category || 'Uncategorized'} | ${t.description}`
).join('\n')}

ACCOUNTS:
${accounts.map(a => 
  `${a.name} | ${a.type}`
).join('\n')}
      `.trim();
      
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${format}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // For CSV and Excel, use JSON format
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: format === 'csv' ? 'text/csv' : 
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${format}-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    setShowExportMenu(false);
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Accordion toggle function - only one section can be open at a time
  const toggleAccordion = (accordion: 'total' | 'budget' | 'purchase' | 'lendBorrow') => {
    setExpandedAccordions(prev => {
      // If clicking the same section, keep it open (no toggle behavior)
      if (prev[accordion]) {
        return prev; // Keep current state unchanged
      }
      // If clicking a different section, close all others and open the clicked one
      const newState = {
        total: accordion === 'total',
        budget: accordion === 'budget',
        purchase: accordion === 'purchase',
        lendBorrow: accordion === 'lendBorrow'
      };
      return newState;
    });
  };

  // Purchase Analytics Functions
  const getCurrencyPurchases = (currency: string) => {
    return purchases.filter(p => p.currency === currency);
  };

  const getPeriodPurchases = (period: string) => {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'current':
        startDate = startOfMonth(now);
        break;
      case 'last3':
        startDate = subMonths(now, 3);
        break;
      case 'last6':
        startDate = subMonths(now, 6);
        break;
      case 'last12':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = startOfMonth(now);
    }
    
    return getCurrencyPurchases(selectedCurrency).filter(purchase => {
      const purchaseDate = new Date(purchase.purchase_date);
      return purchaseDate >= startDate && purchaseDate <= now;
    });
  };

  const periodPurchases = getPeriodPurchases(selectedPeriod);

  // Calculate KPIs for the selected period
  const totalSpent = periodPurchases
    .filter(p => p.status === 'purchased')
    .reduce((sum, p) => sum + Number(p.price), 0);
  
  const purchaseCount = periodPurchases.filter(p => p.status === 'purchased').length;
  const plannedCount = periodPurchases.filter(p => p.status === 'planned').length;
  const averagePurchase = purchaseCount > 0 ? totalSpent / purchaseCount : 0;
  
  // Real Purchase Analytics Calculations
  const totalPlanned = periodPurchases.length;
  const completionRate = totalPlanned > 0 ? (purchaseCount / totalPlanned) * 100 : 0;
  
  // Average planned vs actual price comparison
  const plannedItems = periodPurchases.filter(p => p.status === 'planned');
  const purchasedItems = periodPurchases.filter(p => p.status === 'purchased');
  const averagePlannedPrice = plannedItems.length > 0 ? 
    plannedItems.reduce((sum, p) => sum + Number(p.price), 0) / plannedItems.length : 0;
  const averageActualPrice = purchasedItems.length > 0 ? 
    purchasedItems.reduce((sum, p) => sum + Number(p.price), 0) / purchasedItems.length : 0;
  const priceAccuracy = averagePlannedPrice > 0 ? 
    ((averageActualPrice - averagePlannedPrice) / averagePlannedPrice) * 100 : 0;
  
  // Purchase frequency (purchases per week)
  const now = new Date();
  const startDate = selectedPeriod === 'current' ? startOfMonth(now) : 
                   selectedPeriod === 'last3' ? subMonths(now, 3) :
                   selectedPeriod === 'last6' ? subMonths(now, 6) : subMonths(now, 12);
  const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksInPeriod = Math.max(1, daysDiff / 7);
  const purchaseFrequency = weeksInPeriod > 0 ? purchaseCount / weeksInPeriod : 0;
  
  // Category success rate
  const categoryStats = periodPurchases.reduce((acc, purchase) => {
    const category = purchase.category || 'Other';
    if (!acc[category]) {
      acc[category] = { planned: 0, purchased: 0 };
    }
    if (purchase.status === 'planned') acc[category].planned++;
    if (purchase.status === 'purchased') acc[category].purchased++;
    return acc;
  }, {} as Record<string, { planned: number, purchased: number }>);
  
  const categorySuccessRates = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    successRate: stats.planned > 0 ? (stats.purchased / stats.planned) * 100 : 0,
    planned: stats.planned,
    purchased: stats.purchased
  })).filter(cat => cat.planned > 0);
  
  const bestCategory = categorySuccessRates.length > 0 ? 
    categorySuccessRates.reduce((best, current) => 
      current.successRate > best.successRate ? current : best
    ) : null;

  // Generate trend data for the selected period
  const generateTrendData = () => {
    const now = new Date();
    const days = selectedPeriod === 'current' ? 30 : selectedPeriod === 'last3' ? 90 : selectedPeriod === 'last6' ? 180 : 365;
    const trendData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const dayPurchases = periodPurchases.filter(p => {
        const purchaseDate = new Date(p.purchase_date);
        return purchaseDate.toISOString().split('T')[0] === dateKey;
      });
      
      const dailySpend = dayPurchases
        .filter(p => p.status === 'purchased')
        .reduce((sum, p) => sum + Number(p.price), 0);
      
      const purchaseCount = dayPurchases.filter(p => p.status === 'purchased').length;
      
      trendData.push({
        date: dateKey,
        spend: Math.round(dailySpend),
        purchases: purchaseCount
      });
    }
    
    return trendData;
  };

  const trendData = useMemo(() => generateTrendData(), [periodPurchases, selectedPeriod]);

  // Generate category breakdown
  const generateCategoryData = () => {
    const categoryMap = new Map();
    
    periodPurchases
      .filter(p => p.status === 'purchased')
      .forEach(purchase => {
        const category = purchase.category || 'Other';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { total: 0, count: 0 });
        }
        categoryMap.get(category).total += Number(purchase.price);
        categoryMap.get(category).count += 1;
      });
    
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    
    return Array.from(categoryMap.entries()).map(([name, data], index) => ({
      name,
      value: Math.round(data.total),
      count: data.count,
      color: colors[index % colors.length]
    }));
  };

  const categoryData = useMemo(() => generateCategoryData(), [periodPurchases]);

  // Smart alerts for purchases using humor engine (same as Total Analytics)
  const generatePurchaseAlerts = () => {
    const alerts = [];
    
    // Always detect user context for balanced humor (same as Total Analytics)
    let userContext = null;
    let humorEngine = null;
    
    if (periodPurchases.length > 0) {
      try {
        userContext = detectUserContext({
          monthlyIncome: currentCurrencyStats?.monthlyIncome,
          monthlyExpenses: currentCurrencyStats?.monthlyExpenses,
          transactions: currencyTransactions.map(t => ({
            amount: t.amount,
            type: t.type,
            category: t.category,
            tags: t.tags,
            date: t.date
          }))
        });
        humorEngine = new HumorEngine(userContext, 'medium', 'auto');
      } catch (error) {
        console.warn('HumorEngine failed to initialize:', error);
      }
    }
    
    // Completion rate insights with humor
    if (completionRate >= 80) {
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('surplus', { amount: completionRate });
        alerts.push({
          type: 'success',
          message: humorMessage.message,
          category: 'Purchase Planning',
          icon: Sparkles
        });
      } else {
        alerts.push({
          type: 'success',
          message: `🎯 Excellent! You complete ${completionRate.toFixed(1)}% of your planned purchases!`,
          category: 'Purchase Planning',
          icon: AlertTriangle
        });
      }
    } else if (completionRate >= 50) {
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('deficit', { amount: completionRate });
        alerts.push({
          type: 'warning',
          message: humorMessage.message,
          category: 'Purchase Planning',
          icon: AlertTriangle
        });
      } else {
        alerts.push({
          type: 'warning',
          message: `📊 You complete ${completionRate.toFixed(1)}% of planned purchases. Consider being more selective with planning.`,
          category: 'Purchase Planning',
          icon: AlertTriangle
        });
      }
    } else if (completionRate > 0) {
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('deficit', { amount: completionRate });
        alerts.push({
          type: 'warning',
          message: humorMessage.message,
          category: 'Purchase Planning',
          icon: AlertTriangle
        });
      } else {
        alerts.push({
          type: 'warning',
          message: `⚠️ Low completion rate (${completionRate.toFixed(1)}%). Focus on planning items you'll actually buy.`,
          category: 'Purchase Planning',
          icon: AlertTriangle
        });
      }
    }
    
    // Price accuracy insights with humor
    if (Math.abs(priceAccuracy) <= 10) {
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('surplus', { amount: Math.abs(priceAccuracy) });
        alerts.push({
          type: 'success',
          message: humorMessage.message,
          category: 'Price Planning',
          icon: CheckCircle
        });
      } else {
        alerts.push({
          type: 'success',
          message: `💰 Great price prediction! You're within ${Math.abs(priceAccuracy).toFixed(1)}% of planned prices.`,
          category: 'Price Planning',
          icon: CheckCircle
        });
      }
    } else if (priceAccuracy > 20) {
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('deficit', { amount: priceAccuracy });
        alerts.push({
          type: 'warning',
          message: humorMessage.message,
          category: 'Price Planning',
          icon: CheckCircle
        });
      } else {
        alerts.push({
          type: 'warning',
          message: `📈 You're spending ${priceAccuracy.toFixed(1)}% more than planned. Consider more realistic budgeting.`,
          category: 'Price Planning',
          icon: CheckCircle
        });
      }
    } else if (priceAccuracy < -20) {
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('surplus', { amount: Math.abs(priceAccuracy) });
        alerts.push({
          type: 'success',
          message: humorMessage.message,
          category: 'Price Planning',
          icon: CheckCircle
        });
      } else {
        alerts.push({
          type: 'success',
          message: `🎉 You're spending ${Math.abs(priceAccuracy).toFixed(1)}% less than planned! Great budgeting!`,
          category: 'Price Planning',
          icon: CheckCircle
        });
      }
    }
    
    // Purchase frequency insights with humor
    if (purchaseFrequency > 5) {
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('deficit', { amount: purchaseFrequency });
        alerts.push({
          type: 'warning',
          message: humorMessage.message,
          category: 'Purchase Rhythm',
          icon: CheckCircle
        });
      } else {
        alerts.push({
          type: 'warning',
          message: `🛒 High purchase frequency (${purchaseFrequency.toFixed(1)}/week). Consider spacing out purchases.`,
          category: 'Purchase Rhythm',
          icon: CheckCircle
        });
      }
    } else if (purchaseFrequency > 0 && purchaseFrequency <= 2) {
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('surplus', { amount: purchaseFrequency });
        alerts.push({
          type: 'success',
          message: humorMessage.message,
          category: 'Purchase Rhythm',
          icon: CheckCircle
        });
      } else {
        alerts.push({
          type: 'success',
          message: `👍 Good purchase rhythm! ${purchaseFrequency.toFixed(1)} purchases per week shows thoughtful spending.`,
          category: 'Purchase Rhythm',
          icon: CheckCircle
        });
      }
    }
    
    // Category success insights with humor
    if (bestCategory && bestCategory.successRate >= 80) {
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('surplus', { amount: bestCategory.successRate });
        alerts.push({
          type: 'success',
          message: humorMessage.message,
          category: 'Category Performance',
          icon: Trophy
        });
      } else {
        alerts.push({
          type: 'success',
          message: `🏆 Your best category is ${bestCategory.category} with ${bestCategory.successRate.toFixed(1)}% success rate!`,
          category: 'Category Performance',
          icon: Trophy
        });
      }
    }
    
    if (purchaseCount === 0 && totalPlanned === 0) {
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('general', {});
        alerts.push({
          type: 'info',
          message: humorMessage.message,
          category: 'General',
          icon: ShoppingBag
        });
      } else {
        alerts.push({
          type: 'info',
          message: `📈 No purchase data found for ${selectedCurrency} in this period. Start planning some purchases to see insights!`,
          category: 'General',
          icon: ShoppingBag
        });
      }
    }
    
    return alerts;
  };

  const purchaseAlerts = generatePurchaseAlerts();

  // L&B Analytics Functions
  
  // Generate real data from actual L&B records
  const lbRealData = useMemo(() => {
    const now = new Date();
    const currencyRecords = lendBorrowRecords.filter(r => r.currency === selectedCurrency);
    
    // Separate records that affect account balance from standalone records
    const recordsAffectingBalance = currencyRecords.filter(r => (r as any).affect_account_balance === true);
    
    // Calculate loan aging data
    const agingData = [
      { age: '0-30d', count: 0, amount: 0, color: '#10B981' },
      { age: '31-60d', count: 0, amount: 0, color: '#F59E0B' },
      { age: '61+d', count: 0, amount: 0, color: '#EF4444' }
    ];
    
    // Only include records that affect account balance in aging analysis
    recordsAffectingBalance.forEach(record => {
      if (record.due_date && record.due_date !== '') {
        try {
          const dueDate = new Date(record.due_date);
          const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 30) {
            agingData[0].count++;
            agingData[0].amount += record.amount;
          } else if (daysDiff <= 60) {
            agingData[1].count++;
            agingData[1].amount += record.amount;
          } else {
            agingData[2].count++;
            agingData[2].amount += record.amount;
          }
        } catch (error) {
          // Skip invalid dates
        }
      }
    });
    
    // Generate upcoming due dates from real records (only those affecting balance)
    const upcomingDue = recordsAffectingBalance
      .filter(record => record.due_date && record.due_date !== '' && record.status === 'active')
      .map(record => {
        try {
          const dueDate = new Date(record.due_date!);
          return {
            id: record.id,
            type: record.type,
            person: record.person_name,
            amount: record.amount,
            dueDate: dueDate,
            icon: record.type === 'lend' ? '🤝' : '💼'
          };
        } catch (error) {
          return null;
        }
      })
      .filter(item => item !== null && item.dueDate > now) // Only future due dates
      .sort((a, b) => a!.dueDate.getTime() - b!.dueDate.getTime()) // Sort by due date
      .slice(0, 5); // Take top 5
    
    // Calculate real milestones based on actual data (only records affecting balance)
    const totalRecords = recordsAffectingBalance.length;
    const settledRecords = recordsAffectingBalance.filter(r => r.status === 'settled').length;
    const totalLent = recordsAffectingBalance.filter(r => r.type === 'lend').reduce((sum, r) => sum + r.amount, 0);
    const repaymentRate = totalRecords > 0 ? (settledRecords / totalRecords) * 100 : 0;
    
    const milestones = [
      { 
        id: 1, 
        title: 'Loan Round-Trip', 
        description: 'Completed 5 full loan cycles', 
        icon: Trophy, 
        achieved: settledRecords >= 5, 
        color: '#F59E0B' 
      },
      { 
        id: 2, 
        title: 'Super Lender', 
        description: 'Lent over $10,000 total', 
        icon: Award, 
        achieved: totalLent >= 10000, 
        color: '#10B981' 
      },
      { 
        id: 3, 
        title: 'Trust Builder', 
        description: 'Maintained 100% repayment rate', 
        icon: Star, 
        achieved: repaymentRate >= 100, 
        color: '#3B82F6' 
      },
      { 
        id: 4, 
        title: 'Quick Settler', 
        description: 'Settled 3 loans within 30 days', 
        icon: CheckCircle, 
        achieved: settledRecords >= 3, 
        color: '#8B5CF6' 
      }
    ];
    
    return {
      agingData,
      upcomingDue,
      milestones
    };
  }, [lendBorrowRecords, selectedCurrency]);
  
  // Calculate KPIs from real data (only records affecting account balance)
  const currencyRecords = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (selectedPeriod) {
      case 'current':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last3':
        startDate = subMonths(now, 3);
        endDate = now;
        break;
      case 'last6':
        startDate = subMonths(now, 6);
        endDate = now;
        break;
      case 'last12':
        startDate = subMonths(now, 12);
        endDate = now;
        break;
      default:
        startDate = subMonths(now, 12);
        endDate = now;
    }

    return lendBorrowRecords.filter(r => {
      if (r.currency !== selectedCurrency) return false;
      // Temporarily remove period filtering to debug
      return true;
    });
  }, [lendBorrowRecords, selectedCurrency, selectedPeriod]);

  const recordsAffectingBalance = currencyRecords.filter(r => (r as any).affect_account_balance === true);
  const standaloneRecords = currencyRecords.filter(r => (r as any).affect_account_balance === false);
  
  const totalLent = recordsAffectingBalance.filter(r => r.type === 'lend').reduce((sum, r) => sum + r.amount, 0);
  const totalBorrowed = recordsAffectingBalance.filter(r => r.type === 'borrow').reduce((sum, r) => sum + r.amount, 0);
  const outstandingLent = recordsAffectingBalance.filter(r => r.type === 'lend' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0);
  const outstandingBorrowed = recordsAffectingBalance.filter(r => r.type === 'borrow' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0);
  const overdueCount = recordsAffectingBalance.filter(r => r.status === 'overdue').length;
  const activeLentCount = recordsAffectingBalance.filter(r => r.type === 'lend' && r.status === 'active').length;
  const activeBorrowedCount = recordsAffectingBalance.filter(r => r.type === 'borrow' && r.status === 'active').length;
  
  // Standalone records stats
  const standaloneLent = standaloneRecords.filter(r => r.type === 'lend').reduce((sum, r) => sum + r.amount, 0);
  const standaloneBorrowed = standaloneRecords.filter(r => r.type === 'borrow').reduce((sum, r) => sum + r.amount, 0);
  const standaloneCount = standaloneRecords.length;
  
  // Calculate net position and percentages
  const netPosition = totalLent - totalBorrowed;
  const isNetPositive = netPosition >= 0;
  const lentRepaidPercent = totalLent > 0 ? ((totalLent - outstandingLent) / totalLent) * 100 : 0;
  const borrowRepaidPercent = totalBorrowed > 0 ? ((totalBorrowed - outstandingBorrowed) / totalBorrowed) * 100 : 0;

  const getDaysUntilDue = (dueDate: Date) => {
    const diffTime = dueDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Purchase Analytics Components
  const PurchaseKPICards: React.FC = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {/* Purchase Completion Rate */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-medium">COMPLETION RATE</p>
          <p className="text-lg font-semibold text-gray-900">{completionRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">
            {purchaseCount} of {totalPlanned} planned
          </p>
        </div>

        {/* Price Accuracy */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-medium">PRICE ACCURACY</p>
          <p className={`text-lg font-semibold ${priceAccuracy >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceAccuracy >= 0 ? '+' : ''}{priceAccuracy.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">vs planned price</p>
        </div>

        {/* Purchase Frequency */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-medium">PURCHASE FREQUENCY</p>
          <p className="text-lg font-semibold text-gray-900">{purchaseFrequency.toFixed(1)}</p>
          <p className="text-xs text-gray-500">per week</p>
        </div>

        {/* Best Category Success */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-medium">BEST CATEGORY</p>
          <p className="text-lg font-semibold text-gray-900">
            {bestCategory ? bestCategory.successRate.toFixed(1) : '0'}%
          </p>
          <p className="text-xs text-gray-500">
            {bestCategory ? bestCategory.category : 'No data'}
          </p>
        </div>
      </div>
    );
  };

  const PurchaseSpendingTrend: React.FC = () => {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending Trend ({selectedPeriod === 'current' ? '30 Days' : selectedPeriod === 'last3' ? '3 Months' : selectedPeriod === 'last6' ? '6 Months' : '12 Months'})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value: any) => [formatCurrency(value, selectedCurrency), 'Amount']} 
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              dataKey="spend" 
              fill="rgba(59, 130, 246, 0.1)" 
              stroke="none" 
              fillOpacity={0.3} 
            />
            <Line 
              type="monotone" 
              dataKey="spend" 
              stroke="#3B82F6" 
              strokeWidth={2} 
              dot={false} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const PurchaseCategoryBreakdown: React.FC = () => {
    if (categoryData.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown ({selectedCurrency})</h3>
          <div className="text-center text-gray-500 dark:text-gray-400">No purchase data available</div>
        </div>
      );
    }

    const highestCategory = categoryData.reduce((max, item) => item.value > max.value ? item : max);
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown ({selectedCurrency})</h3>
        <div className="flex items-center space-x-6">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === highestCategory.name ? '#F59E0B' : entry.color}
                      stroke={entry.name === highestCategory.name ? '#D97706' : entry.color}
                      strokeWidth={entry.name === highestCategory.name ? 2 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value, selectedCurrency),
                    name
                  ]}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                          <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {formatCurrency(data.value, selectedCurrency)} ({data.count} items)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <div className="space-y-3">
              {categoryData.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.name === highestCategory.name ? '#F59E0B' : category.color }}
                    />
                    <span className={`text-sm text-gray-900 dark:text-white ${category.name === highestCategory.name ? 'font-semibold' : ''}`}>
                      {category.name}
                    </span>
                    {category.name === highestCategory.name && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full">
                        Highest
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(category.value, selectedCurrency)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PurchaseAlertsComponent: React.FC = () => {
    if (purchaseAlerts.length === 0) return null;
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Insights & Alerts ({selectedCurrency})</h3>
        <div className="space-y-3">
          {purchaseAlerts.map((alert, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${
                alert.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300' 
                  : alert.type === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <alert.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // L&B Analytics Components
  const LBKPICards: React.FC = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Lent Out Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Handshake className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Lent Out</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">৳{totalLent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">• {activeLentCount} active loans</p>
          </div>
        </div>

        {/* Total Borrowed Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Borrowed</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">৳{totalBorrowed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">• {activeBorrowedCount} active debts</p>
          </div>
        </div>

        {/* Net Position Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isNetPositive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                {isNetPositive ? (
                  <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <ThumbsDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Position</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className={`text-3xl font-bold ${isNetPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isNetPositive ? '+' : ''}৳{Math.abs(netPosition).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-sm ${isNetPositive ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {isNetPositive ? 'Net lender' : 'Net borrower'}
            </p>
          </div>
        </div>

        {/* Overdue Loans Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Overdue Loans</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">{overdueCount}</span>
              {overdueCount > 0 && (
                <div className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs px-2 py-1 rounded-full font-medium">
                  Action needed
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {overdueCount > 0 ? 'Requires attention' : 'All loans current'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const LBRepaymentProgress: React.FC = () => {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Repayment Progress</h3>
        <div className="space-y-6">
          {/* Lent Repaid Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lent Repaid</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{lentRepaidPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${lentRepaidPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(totalLent - outstandingLent, selectedCurrency)} repaid of {formatCurrency(totalLent, selectedCurrency)}
            </p>
          </div>

          {/* Borrow Repaid Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Borrow Repaid</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{borrowRepaidPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${borrowRepaidPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatCurrency(totalBorrowed - outstandingBorrowed, selectedCurrency)} repaid of {formatCurrency(totalBorrowed, selectedCurrency)}
            </p>
          </div>
        </div>
      </div>
    );
  };


  const LBMilestones: React.FC = () => {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trophy Case</h3>
        <div className="grid grid-cols-2 gap-4">
          {lbRealData.milestones.map((milestone: any) => (
            <div
              key={milestone.id}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                milestone.achieved 
                  ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20' 
                  : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className={`p-2 rounded-full ${
                    milestone.achieved 
                      ? 'bg-green-100 dark:bg-green-900/40' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <milestone.icon 
                    className={`w-5 h-5 ${
                      milestone.achieved 
                        ? milestone.color === '#F59E0B' ? 'text-yellow-600' : 'text-green-600'
                        : 'text-gray-400'
                    }`} 
                  />
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium text-sm ${
                    milestone.achieved ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {milestone.title}
                  </h4>
                  <p className={`text-xs ${
                    milestone.achieved ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {milestone.description}
                  </p>
                </div>
                {milestone.achieved && (
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LBUpcomingDue: React.FC = () => {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Due Dates</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {lbRealData.upcomingDue.map((item: any) => {
            const daysUntilDue = getDaysUntilDue(item.dueDate);
            const isUrgent = daysUntilDue <= 7;
            const isWarning = daysUntilDue <= 14;
            
            return (
              <div
                key={item.id}
                className={`flex-shrink-0 p-4 rounded-lg border-2 min-w-[200px] transition-all duration-200 group cursor-pointer ${
                  isUrgent 
                    ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40' 
                    : isWarning 
                    ? 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={`${item.person} — ${formatCurrency(item.amount, selectedCurrency)} — Due ${item.dueDate.toLocaleDateString()}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white">{item.person}</h4>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(item.amount, selectedCurrency)}
                    </p>
                    <p className={`text-xs ${
                      isUrgent ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {daysUntilDue === 0 ? 'Due today' : 
                       daysUntilDue === 1 ? 'Due tomorrow' : 
                       `Due in ${daysUntilDue} days`}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  // Human-perceivable comparisons for better understanding
  const getHumanComparison = (amount: number, type: 'expense' | 'income' | 'savings') => {
    const absAmount = Math.abs(amount);
    
    if (type === 'expense') {
      if (absAmount >= 1000) return `≈ ${Math.round(absAmount / 50)} coffee shop visits`;
      if (absAmount >= 500) return `≈ ${Math.round(absAmount / 15)} restaurant meals`;
      if (absAmount >= 100) return `≈ ${Math.round(absAmount / 5)} coffee drinks`;
      if (absAmount >= 20) return `≈ ${Math.round(absAmount / 4)} fast food meals`;
      return `≈ ${Math.round(absAmount / 1.5)} snack purchases`;
    }
    
    if (type === 'savings') {
      if (absAmount >= 10000) return `🏠 Down payment progress`;
      if (absAmount >= 5000) return `🚗 Car purchase fund`;
      if (absAmount >= 2000) return `✈️ Dream vacation fund`;
      if (absAmount >= 1000) return `📱 New device fund`;
      return `🎯 Emergency fund building`;
    }
    
    // Income comparisons
    if (absAmount >= 5000) return `💼 Professional salary level`;
    if (absAmount >= 3000) return `💰 Solid monthly income`;
    if (absAmount >= 1500) return `📈 Growing income stream`;
    return `🌱 Starting income level`;
  };

  // Helper: Map account_id to currency
  const accountCurrencyMap = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach(acc => { map[acc.id] = acc.currency; });
    return map;
  }, [accounts]);

  // Get transactions for selected currency
  const getCurrencyTransactions = (currency: string) => {
    return transactions.filter(t => {
      const accCurrency = accountCurrencyMap[t.account_id];
      return accCurrency === currency;
    });
  };

  // Get current currency stats
  const currentCurrencyStats = stats.byCurrency.find(s => s.currency === selectedCurrency);
  const currencyTransactions = getCurrencyTransactions(selectedCurrency);

  // Filter currencies based on profile.selected_currencies
  const currencyOptions = useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      return stats.byCurrency.filter(s => profile.selected_currencies?.includes?.(s.currency));
    }
    return stats.byCurrency;
  }, [profile?.selected_currencies, stats.byCurrency]);

  // Generate trends data based on selected period and currency
  const monthlyTrendsData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;
    let isDailyView = false;

    // Calculate date range based on selected period
    switch (selectedPeriod) {
      case 'current':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        isDailyView = true;
        break;
      case 'last3':
        startDate = subMonths(now, 3);
        endDate = now;
        break;
      case 'last6':
        startDate = subMonths(now, 6);
        endDate = now;
        break;
      case 'last12':
        startDate = subMonths(now, 12);
        endDate = now;
        break;
      default:
        startDate = subMonths(now, 12);
        endDate = now;
    }

    // Filter transactions by currency and period
    const periodTransactions = currencyTransactions.filter(t => {
      const transactionDate = parseISO(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    if (isDailyView) {
      // For 1 month: show daily data
      const days = [];
      const currentMonth = startDate;
      const daysInMonth = endOfMonth(currentMonth).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dayEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 23, 59, 59);
        
        const dayTransactions = periodTransactions.filter(t => {
          const transactionDate = parseISO(t.date);
          return transactionDate >= dayDate && transactionDate <= dayEnd;
        });

        const income = dayTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = dayTransactions
          .filter(t => {
            const isExpense = t.type === 'expense';
            const isTransferTag = t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'));
            const isTransferCategory = (t.category || '').toLowerCase() === 'transfer';
            return isExpense && !isTransferTag && !isTransferCategory;
          })
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        days.push({
          month: day.toString(),
          income,
          expenses,
          net: income - expenses,
          date: dayDate
        });
      }
      
      return days;
    } else {
      // For 3+ months: show monthly data
    const months = eachMonthOfInterval({
        start: startDate,
        end: endDate
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = periodTransactions.filter(t => {
        const transactionDate = parseISO(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => {
          const isExpense = t.type === 'expense';
          const isTransferTag = t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'));
          const isTransferCategory = (t.category || '').toLowerCase() === 'transfer';
          return isExpense && !isTransferTag && !isTransferCategory;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return {
        month: format(month, 'MMM'),
        income,
        expenses,
        net: income - expenses,
        date: month
      };
    });
    }
  }, [currencyTransactions, selectedPeriod]);

  // Calculate trends
  const trends = useMemo(() => {
    if (monthlyTrendsData.length < 2) return null;
    
    const current = monthlyTrendsData[monthlyTrendsData.length - 1];
    const previous = monthlyTrendsData[monthlyTrendsData.length - 2];
    
    const incomeChange = previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : 0;
    const expenseChange = previous.expenses > 0 ? ((current.expenses - previous.expenses) / previous.expenses) * 100 : 0;
    const netChange = previous.net !== 0 ? ((current.net - previous.net) / Math.abs(previous.net)) * 100 : 0;
    
    return { incomeChange, expenseChange, netChange };
  }, [monthlyTrendsData]);

  // Net Cash Flow Gauge Component
  const NetCashFlowGauge: React.FC = () => {
    // Calculate real-time data based on selected currency and period
    const periodData = useMemo(() => {
      const now = new Date();
      let startDate: Date;
      let endDate = now;

      switch (selectedPeriod) {
        case 'current':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'last3':
          startDate = subMonths(now, 3);
          endDate = now;
          break;
        case 'last6':
          startDate = subMonths(now, 6);
          endDate = now;
          break;
        case 'last12':
          startDate = subMonths(now, 12);
          endDate = now;
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }

      const periodTransactions = currencyTransactions.filter(t => {
        const transactionDate = parseISO(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      const income = periodTransactions
        .filter(t => {
          const isIncome = t.type === 'income';
          const isTransferTag = t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'));
          const isTransferCategory = (t.category || '').toLowerCase() === 'transfer';
          return isIncome && !isTransferTag && !isTransferCategory;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = periodTransactions
        .filter(t => {
          const isExpense = t.type === 'expense';
          const isTransferTag = t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'));
          const isTransferCategory = (t.category || '').toLowerCase() === 'transfer';
          return isExpense && !isTransferTag && !isTransferCategory;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      return { income, expenses, startDate, endDate };
    }, [currencyTransactions, selectedPeriod]);

    if (periodData.income === 0 && periodData.expenses === 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Cash Flow Health</h3>
          <div className="text-center text-gray-500 dark:text-gray-400">No data available for {selectedCurrency}</div>
        </div>
      );
    }

    const { income: monthlyIncome, expenses: monthlyExpenses } = periodData;
    const surplus = monthlyIncome - monthlyExpenses;
    const isSurplus = surplus >= 0;
    const savingsRate = monthlyIncome > 0 ? (surplus / monthlyIncome) * 100 : 0;
    const healthScore = Math.max(0, Math.min(100, savingsRate + 50));
    
    const getPeriodLabel = () => {
      switch (selectedPeriod) {
        case 'current': return 'This Month';
        case 'last3': return 'Last 3 Months';
        case 'last6': return 'Last 6 Months';
        case 'last12': return 'Last 12 Months';
        default: return 'This Month';
      }
    };
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Cash Flow Health</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{selectedCurrency} • {getPeriodLabel()}</p>
          </div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            healthScore >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
            healthScore >= 40 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}>
            {healthScore >= 70 ? '🟢 Excellent' : healthScore >= 40 ? '🟡 Good' : '🔴 Needs Attention'}
          </div>
        </div>
        
        {/* Mobile-First Layout */}
        <div className="space-y-4">
          {/* Main Flow Display */}
          <div className={`text-center p-4 rounded-lg ${isSurplus ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'}`}>
            <div className="flex items-center justify-center mb-2">
              {isSurplus ? (
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400 mr-2" />
              )}
              <div className={`text-xl sm:text-2xl font-bold ${isSurplus ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {selectedCurrency === 'BDT' ? `৳${Math.abs(surplus).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatCurrency(Math.abs(surplus), selectedCurrency)}
              </div>
            </div>
            <div className={`text-sm font-semibold ${isSurplus ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              {isSurplus ? '✅ Monthly Surplus' : '⚠️ Monthly Deficit'}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {getHumanComparison(Math.abs(surplus), isSurplus ? 'savings' : 'expense')}
            </p>
          </div>
          
          {/* Income/Expense Breakdown - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Income</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600 dark:text-green-400 text-sm sm:text-base">
                  {selectedCurrency === 'BDT' ? `৳${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatCurrency(monthlyIncome, selectedCurrency)}
                </div>
                {trends && (
                  <div className={`text-xs ${trends.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trends.incomeChange >= 0 ? '↗️' : '↘️'} {Math.abs(trends.incomeChange).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Expenses</span>
              </div>
              <div className="text-right">
                <div className="font-semibold text-red-600 dark:text-red-400 text-sm sm:text-base">
                  {selectedCurrency === 'BDT' ? `৳${monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatCurrency(monthlyExpenses, selectedCurrency)}
                </div>
                {trends && (
                  <div className={`text-xs ${trends.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trends.expenseChange <= 0 ? '↘️' : '↗️'} {Math.abs(trends.expenseChange).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Savings Rate Visualization */}
          {monthlyIncome > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Savings Rate</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{savingsRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    savingsRate >= 20 ? 'bg-green-500' : savingsRate >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(5, Math.min(100, Math.abs(savingsRate)))}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {savingsRate >= 20 ? '🎯 Excellent! Experts recommend 20%+' : 
                 savingsRate >= 10 ? '👍 Good progress! Try for 20%' : 
                 savingsRate >= 0 ? '📈 Building up! Every bit counts' : 
                 '⚠️ Focus on reducing expenses'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Monthly Trends Chart Component
  const MonthlyTrendsChart: React.FC = () => {
    // Generate title based on selected period
    const getPeriodLabel = () => {
      switch (selectedPeriod) {
        case 'current': return '1 month';
        case 'last3': return '3 months';
        case 'last6': return '6 months';
        case 'last12': return '1 year';
        default: return '1 year';
      }
    };

    if (monthlyTrendsData.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Cash Flow ({selectedCurrency} - {getPeriodLabel()})</h3>
          <div className="text-center text-gray-500 dark:text-gray-400">No trend data available</div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Cash Flow ({selectedCurrency} - {getPeriodLabel()})</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={monthlyTrendsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#6B7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={(value) => formatCurrency(value, selectedCurrency)}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value, selectedCurrency), '']}
              labelFormatter={(label) => `${label} 2024`}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="income" 
              stackId="1"
              stroke="#10B981" 
              fill="#10B981" 
              fillOpacity={0.3}
              name="Income"
            />
            <Area 
              type="monotone" 
              dataKey="expenses" 
              stackId="1"
              stroke="#EF4444" 
              fill="#EF4444" 
              fillOpacity={0.3}
              name="Expenses"
            />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              name="Net"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Spending by Category Donut Component
  const SpendingByCategoryDonut: React.FC = () => {
    // Calculate spending by category for the selected currency and period
    const categorySpending = useMemo(() => {
      const now = new Date();
      let startDate: Date;
      let endDate = now;

      switch (selectedPeriod) {
        case 'current':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'last3':
          startDate = subMonths(now, 3);
          endDate = now;
          break;
        case 'last6':
          startDate = subMonths(now, 6);
          endDate = now;
          break;
        case 'last12':
          startDate = subMonths(now, 12);
          endDate = now;
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }

      const periodTransactions = currencyTransactions.filter(t => {
        const transactionDate = parseISO(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      return periodTransactions
      .filter(t => {
        const isExpense = t.type === 'expense';
        const isTransferTag = t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'));
        const isTransferCategory = (t.category || '').toLowerCase() === 'transfer';
        const isLendBorrowCategory = (t.category || '').toLowerCase().includes('lend') || (t.category || '').toLowerCase().includes('borrow');
        return isExpense && !isTransferTag && !isTransferCategory && !isLendBorrowCategory;
      })
      .reduce((acc, transaction) => {
        const category = transaction.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += Math.abs(transaction.amount);
        return acc;
      }, {} as Record<string, number>);
    }, [currencyTransactions, selectedPeriod]);

    const totalSpending = Object.values(categorySpending).reduce((sum, value) => sum + value, 0);
    
    const getCategoryColor = (categoryName: string) => {
      const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());
      return category?.color || '#3B82F6'; // Default blue color
    };

    const data = Object.entries(categorySpending)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: ((value / totalSpending) * 100),
        color: getCategoryColor(name),
        current: value,
        average: value * 0.9 // Dummy average for now
      }))
      .sort((a, b) => b.value - a.value); // Sort by spending amount

    if (data.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Spending Breakdown</h3>
          <div className="text-center text-gray-500 dark:text-gray-400">No spending data available</div>
        </div>
      );
    }

    const highestCategory = data[0]; // Already sorted, so first is highest
    
    const getPeriodLabel = () => {
      switch (selectedPeriod) {
        case 'current': return 'This Month';
        case 'last3': return 'Last 3 Months';
        case 'last6': return 'Last 6 Months';
        case 'last12': return 'Last 12 Months';
        default: return 'This Month';
      }
    };
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Spending Breakdown</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{selectedCurrency} • {getPeriodLabel()}</p>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total: <span className="font-semibold">{selectedCurrency === 'BDT' ? `৳${totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatCurrency(totalSpending, selectedCurrency)}</span>
          </div>
        </div>
        
        {/* Bottom Section - Categories and Chart/Insights Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories List */}
            <div className="space-y-2">
              {data.slice(0, 6).map((category, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium truncate">
                          {category.name}
                        </span>
                        {index === 0 && (
                          <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 px-2 py-0.5 rounded-full flex-shrink-0">
                            Top
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full transition-all duration-1000"
                            style={{ 
                              backgroundColor: category.color, 
                              width: `${category.percentage}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {category.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="text-sm font-semibold">{selectedCurrency === 'BDT' ? `৳${category.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : formatCurrency(category.value, selectedCurrency)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {category.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
              
              {data.length > 6 && (
                <div className="text-center pt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    +{data.length - 6} more categories
                  </span>
                </div>
              )}
            </div>
            
          {/* Right Column - Chart and Spending Insights */}
          <div className="space-y-6">
            {/* Chart Section */}
            <div className="w-full">
              <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          stroke={entry.color}
                          strokeWidth={index === 0 ? 3 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
      return (
                            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <p className="font-semibold flex items-center">
                              {data.name}
                            </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {formatCurrency(data.current, selectedCurrency)} ({data.percentage.toFixed(1)}%)
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {getHumanComparison(data.current, 'expense')}
                              </p>
        </div>
      );
    }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
            {/* Spending Insights */}
            <div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Top Category</span>
                </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Your biggest expense is <strong>{highestCategory.name}</strong> at {highestCategory.percentage.toFixed(1)}% of total spending.
                </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  {getHumanComparison(highestCategory.value, 'expense')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  
  // Positive Reinforcement Alerts Component
  // Budget Summary Cards Component
  const BudgetSummaryCards: React.FC = () => {
    const formatCurrency = (amount: number) => {
      const currencySymbols: Record<string, string> = {
        USD: '$',
        BDT: '৳',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        ALL: 'L',
        INR: '₹',
        CAD: '$',
        AUD: '$',
      };
      const symbol = currencySymbols[selectedCurrency] || '$';
      return `${symbol}${Math.abs(amount).toLocaleString()}`;
    };

    if (budgetLoading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    if (budgetData.length === 0) {
      return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              No budget data available for {selectedCurrency}. Set up purchase categories with monthly budgets to see budget analytics.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Budget</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(budgetSummary.totalBudget)}
              </p>
            </div>
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(budgetSummary.totalSpent)}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Remaining</p>
              <p className={`text-lg font-semibold ${
                budgetSummary.remainingBudget >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(budgetSummary.remainingBudget)}
              </p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              budgetSummary.remainingBudget >= 0 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {budgetSummary.remainingBudget >= 0 ? (
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">On Track</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {budgetSummary.onTrackCount}/{budgetData.length}
              </p>
            </div>
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PositiveReinforcementAlerts: React.FC = () => {
    // Generate alerts based on real data
    const alerts = [];
    
    // Always detect user context for balanced humor
    let userContext = null;
    let humorEngine = null;
    
    if (currencyTransactions.length > 0) {
      try {
        userContext = detectUserContext({
          monthlyIncome: currentCurrencyStats?.monthlyIncome,
          monthlyExpenses: currentCurrencyStats?.monthlyExpenses,
          transactions: currencyTransactions.map(t => ({
            amount: t.amount,
            type: t.type,
            category: t.category,
            tags: t.tags,
            date: t.date
          }))
        });
        humorEngine = new HumorEngine(userContext, 'medium', 'auto');
      } catch (error) {
        console.warn('HumorEngine failed to initialize:', error);
      }
    }
    
    if (currentCurrencyStats) {
      const { monthlyIncome, monthlyExpenses } = currentCurrencyStats;
      const netIncome = monthlyIncome - monthlyExpenses;
      
      // Surplus alert
      if (netIncome > 0) {
        if (humorEngine) {
          const humorMessage = humorEngine.generateMessage('surplus', { amount: netIncome, currency: selectedCurrency });
          alerts.push({
            type: 'success',
            message: humorMessage.message,
            category: 'Cash Flow'
          });
        } else {
          alerts.push({
            type: 'success',
            message: `👍 Great job! You have a ${formatCurrency(netIncome, selectedCurrency)} surplus this month!`,
            category: 'Cash Flow'
          });
        }
      } else {
        if (humorEngine) {
          const humorMessage = humorEngine.generateMessage('deficit', { amount: Math.abs(netIncome), currency: selectedCurrency });
          alerts.push({
            type: 'warning',
            message: humorMessage.message,
            category: 'Cash Flow'
          });
        } else {
          alerts.push({
            type: 'warning',
            message: `⚠️ You have a ${formatCurrency(Math.abs(netIncome), selectedCurrency)} deficit this month.`,
            category: 'Cash Flow'
          });
        }
      }
      
      // Savings rate alert
      const savingsRate = monthlyIncome > 0 ? (netIncome / monthlyIncome) * 100 : 0;
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('savings_rate', { rate: savingsRate });
        alerts.push({
          type: savingsRate >= 10 ? 'success' : 'warning',
          message: humorMessage.message,
          category: 'Savings'
        });
      } else {
        if (savingsRate >= 20) {
          alerts.push({
            type: 'success',
            message: `🎉 Excellent! You're saving ${formatPercentage(savingsRate)} of your income!`,
            category: 'Savings'
          });
        } else if (savingsRate >= 10) {
          alerts.push({
            type: 'success',
            message: `💪 Good progress! You're saving ${formatPercentage(savingsRate)} of your income.`,
            category: 'Savings'
          });
        } else {
          alerts.push({
            type: 'warning',
            message: `📈 Consider increasing your savings rate. Currently at ${formatPercentage(savingsRate)}.`,
            category: 'Savings'
          });
        }
      }
    }
    
    // Category spending alerts
    const categorySpending = currencyTransactions
      .filter(t => {
        const isExpense = t.type === 'expense';
        const isTransferTag = t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer'));
        const isTransferCategory = (t.category || '').toLowerCase() === 'transfer';
        return isExpense && !isTransferTag && !isTransferCategory;
      })
      .reduce((acc, transaction) => {
        const category = transaction.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += Math.abs(transaction.amount);
        return acc;
      }, {} as Record<string, number>);

    const highestSpendingCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (highestSpendingCategory) {
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('category_spending', { 
          category: highestSpendingCategory[0], 
          amount: highestSpendingCategory[1], 
          currency: selectedCurrency 
        });
        alerts.push({
          type: 'warning',
          message: humorMessage.message,
          category: 'Spending'
        });
      } else {
        alerts.push({
          type: 'warning',
          message: `📊 Your highest spending category is ${highestSpendingCategory[0]} at ${formatCurrency(highestSpendingCategory[1], selectedCurrency)}`,
          category: 'Spending'
        });
      }
    }
    
    if (alerts.length === 0) {
      if (humorEngine) {
        const humorMessage = humorEngine.generateMessage('general', {});
        alerts.push({
          type: 'success',
          message: humorMessage.message,
          category: 'General',
          icon: ShoppingBag
        });
      } else {
        alerts.push({
          type: 'success',
          message: `📈 No transactions found for ${selectedCurrency}. Add some transactions to see insights!`,
          category: 'General',
          icon: ShoppingBag
        });
      }
    }
    
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">Insights & Alerts ({selectedCurrency})</h3>
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${
                alert.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300' 
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {alert.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div data-tour="analytics-overview" className="space-y-4 sm:space-y-6 px-2 sm:px-0">

      {/* Accordion Structure */}
      <div className="space-y-4">
        {/* Tab-Style Navigation */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => toggleAccordion('total')}
              className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium transition-colors text-sm sm:text-base ${
                expandedAccordions.total 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="hidden sm:inline">Total Analytics</span>
              <span className="sm:hidden">Total</span>
            </button>
            <button 
              onClick={() => toggleAccordion('budget')}
              className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium transition-colors text-sm sm:text-base ${
                expandedAccordions.budget 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="hidden sm:inline">Budget Analytics</span>
              <span className="sm:hidden">Budget</span>
            </button>
            <button 
              onClick={() => toggleAccordion('purchase')}
              className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center font-medium transition-colors text-sm sm:text-base ${
                expandedAccordions.purchase 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="hidden sm:inline">Purchase Analytics</span>
              <span className="sm:hidden">Purchase</span>
            </button>
          </div>

          {/* Shared Filter Bar - Hidden for Budget Analytics */}
          {!expandedAccordions.budget && (
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                  {/* Currency Filter */}
                  <div className="flex-1 sm:flex-none">
                    <CustomDropdown
                      value={selectedCurrency}
                      onChange={setSelectedCurrency}
                      options={currencyOptions.map(currency => ({
                        value: currency.currency,
                        label: currency.currency
                      }))}
                      placeholder="Select Currency"
                      className="w-full sm:w-auto"
                    />
                  </div>

                  {/* Period Filter */}
                  <div className="flex-1 sm:flex-none">
                    <CustomDropdown
                      value={selectedPeriod}
                      onChange={(value) => setSelectedPeriod(value as 'current' | 'last3' | 'last6' | 'last12')}
                      options={[
                        { value: 'current', label: 'This Month' },
                        { value: 'last3', label: 'Last 3 Months' },
                        { value: 'last6', label: 'Last 6 Months' },
                        { value: 'last12', label: 'Last 12 Months' }
                      ]}
                      placeholder="Select Period"
                      className="w-full sm:w-auto"
                    />
                  </div>
                </div>

                {/* Hide Trends Toggle - Hidden for Purchase Analytics */}
                {!expandedAccordions.purchase && (
                  <button
                    onClick={() => setShowTrends(!showTrends)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto ${
                      showTrends 
                        ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="hidden sm:inline">{showTrends ? 'Hide Trends' : 'Show Trends'}</span>
                    <span className="sm:hidden">{showTrends ? 'Hide' : 'Show'} Trends</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Budget Analytics Filter Bar - Only Currency Filter */}
          {expandedAccordions.budget && (
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                  {/* Currency Filter Only */}
                  <div className="flex-1 sm:flex-none">
                    <CustomDropdown
                      value={selectedCurrency}
                      onChange={setSelectedCurrency}
                      options={currencyOptions.map(currency => ({
                        value: currency.currency,
                        label: currency.currency
                      }))}
                      placeholder="Select Currency"
                      className="w-full sm:w-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {expandedAccordions.total && (
            <div className="px-3 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6" style={{ marginTop: '10px' }}>
      {/* Monthly Trends Chart - Full Width */}
      {showTrends && <div data-tour="balance-trend" style={{ marginTop: '10px' }}><MonthlyTrendsChart /></div>}

      {/* Main Analytics Grid - Enhanced Mobile Layout */}
      <div data-tour="spending-chart" className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <NetCashFlowGauge />
        <SpendingByCategoryDonut />
      </div>

      {/* Positive Reinforcement Alerts */}
      <PositiveReinforcementAlerts />
            </div>
          )}

          {expandedAccordions.budget && (
            <div>
              {/* Budget Chart */}
              <BudgetChart data={budgetData} currency={selectedCurrency} />
            </div>
          )}

          {expandedAccordions.purchase && (
            <div className="px-3 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6" style={{ marginTop: '10px' }}>
              {/* KPI Cards */}
              <PurchaseKPICards />

              {/* Main Analytics Grid - Removed charts as requested */}

              {/* Alerts */}
              <PurchaseAlertsComponent />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}; 


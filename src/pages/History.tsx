import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { formatTimeUTC } from '../utils/timezoneUtils';
import { useAuthStore } from '../store/authStore';
import { HistorySkeleton, HistoryMobileSkeleton, HistoryShimmerSkeleton } from '../components/History/HistorySkeleton';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  PiggyBank,
  User,
  Calendar,
  Clock,
  Info,
  Search,
  Hash,
  Copy,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
  Activity,
  BarChart3,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  ShoppingBag,
  ArrowUpDown,
  ChevronUp
} from 'lucide-react';

interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  activity_type: string;
  created_at: string;
  details: any;
  user_id?: string;
}

interface Statistics {
  total: number;
  transactions: number;
  purchases: number;
  accounts: number;
  transfers: number;
  lend_borrow: number;
  today: number;
  thisWeek: number;
}

export const History: React.FC = () => {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    transactions: 0,
    purchases: 0,
    accounts: 0,
    transfers: 0,
    lend_borrow: 0,
    today: 0,
    thisWeek: 0
  });

  // Table-related state
  const [tableFilters, setTableFilters] = useState({
    search: '',
    entityType: 'all',
    activityType: 'all',
    timeFilter: 'this-month'
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showEntityTypeMenu, setShowEntityTypeMenu] = useState(false);
  const [showActivityTypeMenu, setShowActivityTypeMenu] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [showMobileFilterMenu, setShowMobileFilterMenu] = useState(false);
  const entityTypeMenuRef = useRef<HTMLDivElement>(null);
  const activityTypeMenuRef = useRef<HTMLDivElement>(null);
  const timeMenuRef = useRef<HTMLDivElement>(null);
  
  // Temporary filter state for mobile modal
  const [tempFilters, setTempFilters] = useState(tableFilters);

  // Helper to match entity_type flexibly (moved outside so it's available everywhere)
  const matchType = (log: ActivityLog, type: string) =>
    log.entity_type && log.entity_type.toLowerCase().includes(type);

  // Mobile filter functionality
  useEffect(() => {
    if (showMobileFilterMenu) {
      setTempFilters(tableFilters);
    }
  }, [showMobileFilterMenu, tableFilters]);

  const handleCloseModal = () => {
    setTempFilters({
      search: '',
      entityType: 'all',
      activityType: 'all',
      timeFilter: 'this-month'
    });
    setShowMobileFilterMenu(false);
  };

  // Handle Escape key to close mobile filter modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMobileFilterMenu) {
        handleCloseModal();
      }
    };

    if (showMobileFilterMenu) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMobileFilterMenu]);

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Row expansion handlers
  const toggleRowExpansion = (date: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(date)) {
      newExpandedRows.delete(date);
    } else {
      newExpandedRows.add(date);
    }
    setExpandedRows(newExpandedRows);
  };

  const isRowExpanded = (date: string) => expandedRows.has(date);

  const fetchLogs = async (isRefresh = false) => {
    if (!user) return;
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const { data, error } = await supabase
        .from('activity_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      
      let logsData = data || [];
      
      // Deduplicate logs
      const transactionKeys = new Set();
      logsData.forEach(log => {
        if (log.entity_type === 'transaction') {
          const desc =
            log.details?.new_values?.description ||
            log.details?.old_values?.description ||
            '';
          const key = `${desc}|${log.activity_type}|${log.created_at.slice(0, 16)}`;
          transactionKeys.add(key);
        }
      });
      
      const uniqueLogs: ActivityLog[] = [];
      const seen = new Set();
      
      for (const log of logsData) {
        let skip = false;
        if (log.entity_type === 'purchase') {
          const itemName =
            log.details?.new_values?.item_name ||
            log.details?.old_values?.item_name ||
            '';
          const key = `${itemName}|${log.activity_type}|${log.created_at.slice(0, 16)}`;
          if (transactionKeys.has(key)) {
            skip = true;
          }
        }
        
        const uniqKey = `${log.entity_type}|${log.entity_id}|${log.activity_type}|${log.created_at.slice(0, 16)}`;
        if (!skip && !seen.has(uniqKey)) {
          uniqueLogs.push(log);
          seen.add(uniqKey);
        }
      }
      
      if (!error) {
        setLogs(uniqueLogs);
        calculateStatistics(uniqueLogs);
      }
    } catch (error) {

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const handleRefresh = async () => {
    await fetchLogs(true);
  };

  const calculateStatistics = (logs: ActivityLog[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: logs.length,
      transactions: logs.filter(log => matchType(log, 'transaction')).length,
      purchases: logs.filter(log => matchType(log, 'purchase')).length,
      accounts: logs.filter(log => matchType(log, 'account')).length,
      transfers: logs.filter(log => matchType(log, 'transfer')).length,
      lend_borrow: logs.filter(log => matchType(log, 'lend_borrow')).length,
      today: logs.filter(log => new Date(log.created_at) >= today).length,
      thisWeek: logs.filter(log => new Date(log.created_at) >= thisWeek).length
    };

    setStatistics(stats);
  };

  const filteredLogs = logs.filter(log => {
    // Apply entity type filter
    if (tableFilters.entityType !== 'all' && !matchType(log, tableFilters.entityType)) return false;
    
    // Apply activity type filter
    if (tableFilters.activityType !== 'all' && log.activity_type !== tableFilters.activityType) return false;
    
    // Apply time filter
    const logDate = new Date(log.created_at);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    switch (tableFilters.timeFilter) {
      case 'all-time':
        // Show all logs regardless of date
        break;
      case 'this-month':
        if (logDate < startOfMonth) return false;
        break;
      case '3-months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        if (logDate < threeMonthsAgo) return false;
        break;
      case '6-months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        if (logDate < sixMonthsAgo) return false;
        break;
      case '1-year':
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        if (logDate < oneYearAgo) return false;
        break;
    }
    
    // Apply search filter
    if (tableFilters.search) {
      const searchLower = tableFilters.search.toLowerCase();
      return (
        (log.entity_id && log.entity_id.toLowerCase().includes(searchLower)) ||
        (log.activity_type && log.activity_type.toLowerCase().includes(searchLower)) ||
        (log.entity_type && log.entity_type.toLowerCase().includes(searchLower)) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = format(new Date(log.created_at), 'MMM dd, yyyy');
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
    return groups;
  }, {} as Record<string, ActivityLog[]>);

  useEffect(() => {
    if (openDate === null && Object.keys(groupedLogs).length > 0) {
      setOpenDate(Object.keys(groupedLogs)[0]);
    }
  }, [Object.keys(groupedLogs).join(',')]);

  // Click outside handlers for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (entityTypeMenuRef.current && !entityTypeMenuRef.current.contains(event.target as Node)) {
        setShowEntityTypeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activityTypeMenuRef.current && !activityTypeMenuRef.current.contains(event.target as Node)) {
        setShowActivityTypeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeMenuRef.current && !timeMenuRef.current.contains(event.target as Node)) {
        setShowTimeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'account':
        return <CreditCard className="w-3 h-3" />;
      case 'transaction':
        return <DollarSign className="w-3 h-3" />;
      case 'transfer':
        return <TrendingUp className="w-3 h-3" />;
      case 'purchase':
        return <ShoppingBag className="w-3 h-3" />;
      case 'savings_goal':
        return <PiggyBank className="w-3 h-3" />;
      case 'user':
        return <User className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'CREATE':
        return <Plus className="w-3 h-3" />;
      case 'UPDATE':
        return <Edit className="w-3 h-3" />;
      case 'DELETE':
        return <Trash2 className="w-3 h-3" />;
      default:
        return <Info className="w-3 h-3" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'CREATE':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'UPDATE':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'DELETE':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  const copyEntityId = async (entityId: string) => {
    try {
      await navigator.clipboard.writeText(entityId);
    } catch (err) {

    }
  };

  const exportHistory = () => {
    const csvContent = [
      ['Date', 'Time', 'Entity Type', 'Activity Type', 'Entity ID', 'Details'],
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'MMM dd, yyyy'),
        formatTimeUTC(log.created_at),
        log.entity_type,
        log.activity_type,
        log.entity_id,
        log.details?.summary || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => (
    <div className={`p-4 rounded-lg border ${color} dark:border-gray-700`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className="text-gray-400 dark:text-gray-500">{icon}</div>
      </div>
    </div>
  );

  // Detect mobile view with proper state management
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return isMobile ? <HistoryMobileSkeleton /> : <HistorySkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* PullToRefresh is handled globally in App.tsx */}
        {/* Refresh indicator */}
        {refreshing && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Refreshing...</span>
            </div>
          </div>
        )}
        
        {/* Unified Table View */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto lg:rounded-b-xl" style={{ borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem' }}>
          {/* Filters Section */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                    value={tableFilters.search}
                    onChange={(e) => setTableFilters({ ...tableFilters, search: e.target.value })}
                    className="w-full pl-8 pr-2 py-1.5 text-[13px] h-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 transition-colors border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                placeholder="Search activities, IDs, or details..."
              />
                </div>
            </div>

            {/* Mobile Filter Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileFilterMenu(true)}
                className="px-2 py-1.5 text-[13px] h-8 w-8 rounded-md transition-colors flex items-center justify-center text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                style={{ background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' }}
                title="Filters"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
            
              {/* Entity Type Filter */}
              <div className="hidden md:block relative" ref={entityTypeMenuRef}>
                <button
                  onClick={() => setShowEntityTypeMenu(v => !v)}
                  className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                    tableFilters.entityType !== 'all' 
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={tableFilters.entityType !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                >
                  <span>{tableFilters.entityType === 'all' ? 'All Types' : tableFilters.entityType === 'lend_borrow' ? 'Lend & Borrow' : tableFilters.entityType.charAt(0).toUpperCase() + tableFilters.entityType.slice(1)}</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showEntityTypeMenu && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    <button
                      onClick={() => { setTableFilters({ ...tableFilters, entityType: 'all' }); setShowEntityTypeMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.entityType === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                    >
                      All Types
                    </button>
                    {['transaction', 'purchase', 'account', 'transfer', 'lend_borrow'].map(type => (
                  <button
                    key={type}
                        onClick={() => { setTableFilters({ ...tableFilters, entityType: type }); setShowEntityTypeMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.entityType === type ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                  >
                    {type === 'lend_borrow' ? 'Lend & Borrow' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
                )}
              </div>

              {/* Activity Type Filter */}
              <div className="hidden md:block relative" ref={activityTypeMenuRef}>
                <button
                  onClick={() => setShowActivityTypeMenu(v => !v)}
                  className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                    tableFilters.activityType !== 'all' 
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={tableFilters.activityType !== 'all' ? { background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' } : {}}
                >
                  <span>{tableFilters.activityType === 'all' ? 'All Activities' : tableFilters.activityType.charAt(0) + tableFilters.activityType.slice(1).toLowerCase()}</span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showActivityTypeMenu && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => { setTableFilters({ ...tableFilters, activityType: 'all' }); setShowActivityTypeMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.activityType === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                    >
                      All Activities
                    </button>
                    {['CREATE', 'UPDATE', 'DELETE'].map(activity => (
                      <button
                        key={activity}
                        onClick={() => { setTableFilters({ ...tableFilters, activityType: activity }); setShowActivityTypeMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.activityType === activity ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                      >
                        {activity.charAt(0) + activity.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Time Filter */}
              <div className="hidden md:block relative" ref={timeMenuRef}>
                <button
                  onClick={() => setShowTimeMenu(v => !v)}
                  className={`px-3 py-1.5 pr-2 text-[13px] h-8 rounded-md transition-colors flex items-center space-x-1.5 ${
                    tableFilters.timeFilter !== 'this-month' 
                      ? 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700' 
                      : 'text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                  }`}
                  style={{ background: 'linear-gradient(135deg, #3b82f61f 0%, #8b5cf633 100%)' }}
                >
                  <span>
                    {tableFilters.timeFilter === 'all-time' ? 'All Time' :
                     tableFilters.timeFilter === 'this-month' ? 'This Month' :
                     tableFilters.timeFilter === '3-months' ? '3 Months' :
                     tableFilters.timeFilter === '6-months' ? '6 Months' :
                     tableFilters.timeFilter === '1-year' ? '1 Year' : 'This Month'}
                  </span>
                  <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTimeMenu && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    {[
                      { value: 'this-month', label: 'This Month' },
                      { value: '3-months', label: '3 Months' },
                      { value: '6-months', label: '6 Months' },
                      { value: '1-year', label: '1 Year' },
                      { value: 'all-time', label: 'All Time' }
                    ].map(time => (
                      <button
                        key={time.value}
                        onClick={() => { setTableFilters({ ...tableFilters, timeFilter: time.value }); setShowTimeMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.timeFilter === time.value ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                      >
                        {time.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              <div className="hidden md:block">
                {(tableFilters.search || tableFilters.entityType !== 'all' || tableFilters.activityType !== 'all' || tableFilters.timeFilter !== 'this-month') && (
                <button
                  onClick={() => setTableFilters({ search: '', entityType: 'all', activityType: 'all', timeFilter: 'this-month' })}
                  className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                  title="Clear all filters"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                )}
              </div>

            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3 justify-start">
            {/* First Card - Today - NOT affected by time filter, but affected by other filters */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Today</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>
                    {(() => {
                      const today = new Date();
                      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
                      
                      return logs.filter(log => {
                        const logDate = new Date(log.created_at);
                        const isToday = logDate >= startOfToday && logDate < endOfToday;
                        
                        if (!isToday) return false;
                        
                        // Apply other filters (search, entity type, activity type) but NOT time filter
                        if (tableFilters.entityType !== 'all' && !matchType(log, tableFilters.entityType)) return false;
                        if (tableFilters.activityType !== 'all' && log.activity_type !== tableFilters.activityType) return false;
                        if (tableFilters.search) {
                          const searchLower = tableFilters.search.toLowerCase();
                          return (
                            (log.entity_id && log.entity_id.toLowerCase().includes(searchLower)) ||
                            (log.activity_type && log.activity_type.toLowerCase().includes(searchLower)) ||
                            (log.entity_type && log.entity_type.toLowerCase().includes(searchLower)) ||
                            (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower))
                          );
                        }
                        return true;
                      }).length;
                    })()}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                    {(() => {
                      const today = new Date();
                      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
                      
                      const todayCount = logs.filter(log => {
                        const logDate = new Date(log.created_at);
                        const isToday = logDate >= startOfToday && logDate < endOfToday;
                        
                        if (!isToday) return false;
                        
                        // Apply other filters (search, entity type, activity type) but NOT time filter
                        if (tableFilters.entityType !== 'all' && !matchType(log, tableFilters.entityType)) return false;
                        if (tableFilters.activityType !== 'all' && log.activity_type !== tableFilters.activityType) return false;
                        if (tableFilters.search) {
                          const searchLower = tableFilters.search.toLowerCase();
                          return (
                            (log.entity_id && log.entity_id.toLowerCase().includes(searchLower)) ||
                            (log.activity_type && log.activity_type.toLowerCase().includes(searchLower)) ||
                            (log.entity_type && log.entity_type.toLowerCase().includes(searchLower)) ||
                            (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower))
                          );
                        }
                        return true;
                      }).length;
                      
                      return todayCount > 0 ? 'Activities today' : 'No activities today';
                    })()}
                  </p>
                </div>
                <Calendar className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
              </div>
            </div>
            
            {/* Second Card - Total Activities (Filtered) - IS affected by all filters */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 py-1.5 px-2">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Activities</p>
                  <p className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontSize: '1.2rem' }}>{filteredLogs.length}</p>
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '11px' }}>
                    {filteredLogs.length > 0 ? 'Matching current filters' : 'No matching activities'}
                  </p>
                </div>
                <Filter className="text-blue-600" style={{ fontSize: '1.2rem', width: '1.2rem', height: '1.2rem' }} />
          </div>
        </div>

          </div>

          {/* Desktop Table Section */}
          <div className="hidden lg:block max-h-[500px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
              <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activities found</h3>
            <p className="text-gray-600 dark:text-gray-400">
                  {tableFilters.search ? 'Try adjusting your search terms or filters.' : 'No activity history available.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date</span>
                          {getSortIcon('date')}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activities
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transactions
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Purchases
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Accounts
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transfers
                      </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lend & Borrow
                        </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {Object.entries(groupedLogs).map(([date, dateLogs]) => {
                      const transactionCount = dateLogs.filter(log => matchType(log, 'transaction')).length;
                      const purchaseCount = dateLogs.filter(log => matchType(log, 'purchase')).length;
                      const accountCount = dateLogs.filter(log => matchType(log, 'account')).length;
                      const transferCount = dateLogs.filter(log => matchType(log, 'transfer')).length;
                      const lendBorrowCount = dateLogs.filter(log => matchType(log, 'lend_borrow')).length;
                      const isExpanded = isRowExpanded(date);

                      return (
                        <React.Fragment key={date}>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => toggleRowExpansion(date)}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                              {dateLogs.length}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                              {transactionCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                              {purchaseCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                              {accountCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                              {transferCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                              {lendBorrowCount}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="px-0 py-0">
                                <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                  <div className="p-4">
                                    <div className="space-y-2">
                                      {dateLogs.map((log, index) => {
                                        let summary = log.details?.summary || '';
                                        summary = summary.replace(/category: ([a-z])/, (m: string, c: string) => 'category: ' + c.toUpperCase());
                                        const summaryMatch = summary.match(/^(.*?:)(.*)$/);

                                        return (
                                          <div
                                            key={log.id}
                                            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                          >
                                            {/* Activity Icon */}
                                            <div className={`p-1.5 rounded-full ${getActivityColor(log.activity_type)}`}>
                                              {getActivityIcon(log.activity_type)}
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                  {getEntityIcon(log.entity_type)}
                                                  <span className="font-medium text-gray-900 dark:text-white capitalize text-sm">
                                                    {log.entity_type}
                                                  </span>
                                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {log.activity_type.toLowerCase()}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                  <Clock className="w-3 h-3" />
                                                  {formatTimeUTC(log.created_at)}
                                                </div>
                                              </div>
                                              
                                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                                {summaryMatch ? (
                                                  <>
                                                    <span className="font-medium">{summaryMatch[1]}</span>
                                                    <span className="ml-1">{summaryMatch[2]}</span>
                                                  </>
                                                ) : (
                                                  <span>{summary}</span>
                                                )}
                                              </div>
                                              
                                              {showDetails && (
                                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <Hash className="w-3 h-3" />
                                                    <span className="font-mono">{log.entity_id}</span>
                                                    <button
                                                      onClick={() => copyEntityId(log.entity_id)}
                                                      className="hover:text-gray-700 dark:hover:text-gray-300"
                                                    >
                                                      <Copy className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Mobile Card Section */}
          <div className="lg:hidden max-h-[500px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activities found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {tableFilters.search ? 'Try adjusting your search terms or filters.' : 'No activity history available.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 px-2.5">
                {Object.entries(groupedLogs).map(([date, dateLogs]) => {
                  const transactionCount = dateLogs.filter(log => matchType(log, 'transaction')).length;
                  const purchaseCount = dateLogs.filter(log => matchType(log, 'purchase')).length;
                  const accountCount = dateLogs.filter(log => matchType(log, 'account')).length;
                  const transferCount = dateLogs.filter(log => matchType(log, 'transfer')).length;
                  const lendBorrowCount = dateLogs.filter(log => matchType(log, 'lend_borrow')).length;
                  const isExpanded = isRowExpanded(date);

                  return (
              <div key={date} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => toggleRowExpansion(date)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">{date}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">({dateLogs.length} activities)</span>
                  </div>
                </button>
                
                      {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    <div className="p-3 space-y-2">
                      {dateLogs.map((log, index) => {
                        let summary = log.details?.summary || '';
                        summary = summary.replace(/category: ([a-z])/, (m: string, c: string) => 'category: ' + c.toUpperCase());
                        const summaryMatch = summary.match(/^(.*?:)(.*)$/);

                        return (
                          <div
                            key={log.id}
                            className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            {/* Activity Icon */}
                            <div className={`p-1.5 rounded-full ${getActivityColor(log.activity_type)}`}>
                              {getActivityIcon(log.activity_type)}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  {getEntityIcon(log.entity_type)}
                                  <span className="font-medium text-gray-900 dark:text-white capitalize text-sm">
                                    {log.entity_type}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {log.activity_type.toLowerCase()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="w-3 h-3" />
                                  {formatTimeUTC(log.created_at)}
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                {summaryMatch ? (
                                  <>
                                    <span className="font-medium">{summaryMatch[1]}</span>
                                    <span className="ml-1">{summaryMatch[2]}</span>
                                  </>
                                ) : (
                                  <span>{summary}</span>
                                )}
                              </div>
                              
                              {showDetails && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <Hash className="w-3 h-3" />
                                    <span className="font-mono">{log.entity_id}</span>
                                    <button
                                      onClick={() => copyEntityId(log.entity_id)}
                                      className="hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
                  );
                })}
          </div>
        )}
      </div>
        </div>

        {/* Mobile Filter Modal */}
        {showMobileFilterMenu && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-xs overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Header with Check and Cross */}
              <div className="bg-white dark:bg-gray-900 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Filters</span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Select filters and click ✓ to apply</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTableFilters(tempFilters);
                        setShowMobileFilterMenu(false);
                      }}
                      className={`p-1 transition-colors ${
                        (tempFilters.entityType !== 'all' || tempFilters.activityType !== 'all' || tempFilters.timeFilter !== 'this-month')
                          ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                      title="Apply Filters"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setTableFilters({ search: '', entityType: 'all', activityType: 'all', timeFilter: 'this-month' });
                        setShowMobileFilterMenu(false);
                      }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
                      title="Clear All Filters"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Entity Type Filter */}
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Entity Type</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, entityType: 'all' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.entityType === 'all' 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  {['transaction', 'purchase', 'account', 'transfer', 'lend_borrow'].map(type => (
                    <button
                      key={type}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, entityType: type });
                      }}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        tempFilters.entityType === type 
                          ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                          : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {type === 'lend_borrow' ? 'Lend & Borrow' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Activity Type Filter */}
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Activity Type</div>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempFilters({ ...tempFilters, activityType: 'all' });
                    }}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      tempFilters.activityType === 'all' 
                        ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                        : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All
                  </button>
                  {['CREATE', 'UPDATE', 'DELETE'].map(activity => (
                    <button
                      key={activity}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, activityType: activity });
                      }}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        tempFilters.activityType === activity 
                          ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                          : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {activity.charAt(0) + activity.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Time Filter */}
              <div className="px-3 py-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Time Period</div>
                <div className="flex flex-wrap gap-1">
                  {[
                    { value: 'this-month', label: 'This Month' },
                    { value: '3-months', label: '3 Months' },
                    { value: '6-months', label: '6 Months' },
                    { value: '1-year', label: '1 Year' },
                    { value: 'all-time', label: 'All' }
                  ].map(time => (
                    <button
                      key={time.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempFilters({ ...tempFilters, timeFilter: time.value });
                      }}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        tempFilters.timeFilter === time.value 
                          ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-600 dark:text-blue-200' 
                          : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {time.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

    </div>
  );
}; 


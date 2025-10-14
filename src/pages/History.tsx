import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { HistorySkeleton, HistoryMobileSkeleton, HistoryShimmerSkeleton } from '../components/History/HistorySkeleton';
import PullToRefresh from '../components/PullToRefresh';
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
  ArrowUpDown
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
    today: 0,
    thisWeek: 0
  });

  // Helper to match entity_type flexibly (moved outside so it's available everywhere)
  const matchType = (log: ActivityLog, type: string) =>
    log.entity_type && log.entity_type.toLowerCase().includes(type);

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
      today: logs.filter(log => new Date(log.created_at) >= today).length,
      thisWeek: logs.filter(log => new Date(log.created_at) >= thisWeek).length
    };

    setStatistics(stats);
  };

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && !matchType(log, filter)) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
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
        format(new Date(log.created_at), 'h:mm a'),
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
    <div className="w-full h-full p-4 bg-gray-50 dark:bg-gray-900">
      <PullToRefresh onRefresh={handleRefresh} />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Refresh indicator */}
        {refreshing && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Refreshing...</span>
            </div>
          </div>
        )}
        
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard
            title="Total Activities"
            value={statistics.total}
            icon={<Activity className="w-5 h-5" />}
            color="bg-white dark:bg-gray-800"
          />
          <StatCard
            title="Transactions"
            value={statistics.transactions}
            icon={<DollarSign className="w-5 h-5" />}
            color="bg-white dark:bg-gray-800"
          />
          <StatCard
            title="Purchases"
            value={statistics.purchases}
            icon={<ShoppingBag className="w-5 h-5" />}
            color="bg-white dark:bg-gray-800"
          />
          <StatCard
            title="Accounts"
            value={statistics.accounts}
            icon={<CreditCard className="w-5 h-5" />}
            color="bg-white dark:bg-gray-800"
          />
          <StatCard
            title="Transfers"
            value={statistics.transfers}
            icon={<TrendingUp className="w-5 h-5" />}
            color="bg-white dark:bg-gray-800"
          />
          <StatCard
            title="Today"
            value={statistics.today}
            icon={<Calendar className="w-5 h-5" />}
            color="bg-white dark:bg-gray-800"
          />
          <StatCard
            title="This Week"
            value={statistics.thisWeek}
            icon={<BarChart3 className="w-5 h-5" />}
            color="bg-white dark:bg-gray-800"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities, IDs, or details..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {['all', 'transaction', 'purchase', 'account', 'transfer'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      filter === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activities found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search terms or filters.' : 'No activity history available.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
              <div key={date} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setOpenDate(openDate === date ? null : date)}
                  aria-expanded={openDate === date}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-base font-semibold text-gray-900 dark:text-white">{date}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({dateLogs.length} activities)</span>
                  </div>
                  {openDate === date ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {openDate === date && (
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
                                  {format(new Date(log.created_at), 'h:mm a')}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 


import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Download, UserX, Shield, CheckCircle, XCircle, User, CreditCard, ShoppingBag, TrendingUp, Globe, Edit3, Calendar, LogOut, ArrowRight, HandCoins, ChevronDown, ChevronUp } from 'lucide-react';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { generateTransactionId, createSuccessMessage } from '../../utils/transactionId';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProfileEditModal } from '../Layout/ProfileEditModal';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { Link } from 'react-router-dom';

interface AccountManagementProps {
  hideTitle?: boolean;
}

type DeletionStep = 'warning' | 'confirmation' | 'processing' | 'complete';

// Helper to get the correct profile picture URL
const getProfilePicUrl = (pic: string | undefined) => {
  if (!pic) return undefined;
  if (pic.startsWith('http')) return pic;
  // Assume it's a Supabase storage key in the 'avatars' bucket
  return supabase.storage.from('avatars').getPublicUrl(pic).data.publicUrl;
};

export const AccountManagement: React.FC<AccountManagementProps> = ({ hideTitle = false }) => {
  const { user, profile, logout, deleteAccount } = useAuthStore();
  const { accounts, transactions, purchases, fetchAccounts, fetchTransactions, fetchPurchases, donationSavingRecords, fetchDonationSavingRecords } = useFinanceStore();
  const [currentStep, setCurrentStep] = useState<DeletionStep>('warning');
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const { isMobile } = useMobileDetection();
  const { usageStats, loading: loadingUsage, isFreePlan, isPremiumPlan } = usePlanFeatures();
  
  // Android detection
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isCapacitor = !!(window as any).Capacitor;
  const isAndroidApp = isAndroid && isCapacitor;
  
  // Android download modal state
  const [showAndroidDownloadModal, setShowAndroidDownloadModal] = useState(false);
  
  // Danger Zone collapsible state
  const [isDangerZoneExpanded, setIsDangerZoneExpanded] = useState(false);
  
  // Logout confirmation modal state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Fetch all data on component mount
  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchTransactions();
      fetchPurchases();
      fetchDonationSavingRecords();
    }
  }, [user, fetchAccounts, fetchTransactions, fetchPurchases, fetchDonationSavingRecords]);

  // Calculate data summary
  const dataSummary = {
    accounts: accounts.length,
    transactions: transactions.length,
    purchases: purchases.length,
    currencies: [...new Set(accounts.map(acc => acc.currency))].length,
    lendBorrow: (() => {
      const analytics = useFinanceStore.getState().getLendBorrowAnalytics();
      return (analytics.active_count || 0) + (analytics.settled_count || 0);
    })(),
    donation: donationSavingRecords.filter(r => r.type === 'donation').length,
  };

  // User info section
  const userName = profile?.fullName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userPicUrl = getProfilePicUrl(profile?.profilePicture);
  
  // Format registration date
  const formatRegistrationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const registrationDate = user?.created_at ? formatRegistrationDate(user.created_at) : null;

  // Helper function to get usage display for compact widget
  const getUsageDisplay = (type: 'accounts' | 'currencies' | 'transactions' | 'purchases') => {
    if (!usageStats) return { current: 0, limit: '∞', percentage: 0 };
    
    // Handle monthly usage stats structure for transactions
    if (type === 'transactions' && 'current_month_transactions' in usageStats) {
      const current = (usageStats as any).current_month_transactions || 0;
      const limitNum = (usageStats as any).max_transactions_per_month || -1;
      const percentage = (usageStats as any).percentage_used || 0;
      return {
        current,
        limit: limitNum === -1 ? '∞' : String(limitNum),
        percentage
      };
    }
    
    // Handle other types with combined stats structure
    const stats: any = (usageStats as any)[type];
    const current = typeof stats?.current === 'number' ? stats.current : 0;
    const limitNum = typeof stats?.limit === 'number' ? stats.limit : -1;
    const percentage = typeof stats?.percentage === 'number' ? stats.percentage : 0;
    return {
      current,
      limit: limitNum === -1 ? '∞' : String(limitNum),
      percentage
    };
  };

  // Get critical limits (>= 80% usage)
  const getCriticalLimits = () => {
    if (!usageStats || isPremiumPlan) return [];
    
    const limits = [
      { type: 'accounts' as const, label: 'Accounts', icon: CreditCard },
      { type: 'currencies' as const, label: 'Currencies', icon: Globe },
      { type: 'transactions' as const, label: 'Transactions', icon: TrendingUp },
      { type: 'purchases' as const, label: 'Purchases', icon: ShoppingBag }
    ];
    
    return limits
      .map(limit => {
        const stats = getUsageDisplay(limit.type);
        return { ...limit, ...stats };
      })
      .filter(limit => limit.percentage >= 80);
  };

  const criticalLimits = getCriticalLimits();

  const handleStartDeletion = () => {
    setShowDeleteModal(true);
    setCurrentStep('warning');
  };

  const handleConfirmWarning = () => {
    setCurrentStep('confirmation');
  };

  const handleConfirmDeletion = async () => {
    if (confirmationText !== 'DELETE') {
      toast.error('Please type DELETE exactly to confirm');
      return;
    }

    setCurrentStep('processing');
    setIsDeleting(true);
    setDeletionProgress(0);

    try {

      
      // Simulate progress updates
      setDeletionProgress(25);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setDeletionProgress(50);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setDeletionProgress(75);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setDeletionProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Use the auth store's bulletproof deletion method

      const { success, error } = await deleteAccount();
      
      if (!success) {
        throw new Error(error || 'Failed to delete account');
      }


      setDeletionProgress(100);
      
      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentStep('complete');
      setIsDeleting(false);
      
      // Show success message
      toast.success('Account deleted successfully');
      
      // Redirect to home page after a delay
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error: any) {

      setIsDeleting(false);
      setCurrentStep('confirmation');
      toast.error(error.message || 'Failed to delete account. Please try again.');
    }
  };

  const handleCancel = () => {
    setShowDeleteModal(false);
    setCurrentStep('warning');
    setConfirmationText('');
    setIsDeleting(false);
    setDeletionProgress(0);
  };

  const exportUserData = async () => {
    try {
      const exportData = {
        user: {
          id: user?.id,
          email: user?.email,
          profile: profile
        },
        accounts: accounts,
        transactions: transactions,
        purchases: purchases,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
              a.download = `balanze-data-${user?.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {

      
      // Check if it's a plan limit error and show upgrade prompt
      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        const errorMessage = error.message;
        
        if (errorMessage && errorMessage.includes('FEATURE_NOT_AVAILABLE') && errorMessage.includes('data export')) {
          toast.error('Data export is a Premium feature. Upgrade to Premium to export your data.');
          setTimeout(() => {
            window.location.href = '/settings?tab=plans';
          }, 2000);
          
          return;
        }
      }
      
      toast.error('Error exporting data');
    }
  };

  // PDF Export Handler
  const handleExportPDF = () => {
    const doc = new jsPDF();
    let y = 10;
    // User Info
    doc.setFontSize(16);
    doc.text('User Data Export', 14, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Name: ${userName}`, 14, y);
    y += 6;
    doc.text(`Email: ${userEmail}`, 14, y);
    y += 8;
    // Accounts Table
    if (accounts.length) {
      autoTable(doc, {
        startY: y,
        head: [["Name", "Type", "Currency", "Balance", "Status"]],
        body: accounts.map(acc => [acc.name, acc.type, acc.currency, acc.calculated_balance, acc.isActive ? 'Active' : 'Inactive']),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
    // Transactions Table
    if (transactions.length) {
      autoTable(doc, {
        startY: y,
        head: [["Date", "Description", "Category", "Account", "Type", "Amount"]],
        body: transactions.map(tx => [
          new Date(tx.date).toLocaleDateString(),
          tx.description,
          tx.category,
          accounts.find(a => a.id === tx.account_id)?.name || '',
          tx.type,
          tx.amount
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [39, 174, 96] },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
    // Purchases Table
    if (purchases.length) {
      autoTable(doc, {
        startY: y,
        head: [["Date", "Item", "Category", "Amount", "Account"]],
        body: purchases.map(p => [
          new Date(p.purchase_date).toLocaleDateString(),
          p.item_name || '',
          p.category,
          p.price,
          accounts.find(a => a.id === p.account_id)?.name || ''
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [155, 89, 182] },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
    // Currencies Table
    const uniqueCurrencies = [...new Set(accounts.map(acc => acc.currency))];
    if (uniqueCurrencies.length) {
      autoTable(doc, {
        startY: y,
        head: [["Currency"]],
        body: uniqueCurrencies.map(cur => [cur]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [52, 73, 94] },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
    // Donations Table
    if (donationSavingRecords.length) {
      autoTable(doc, {
        startY: y,
        head: [["Type", "Amount", "Date", "Note"]],
        body: donationSavingRecords.filter(r => r.type === 'donation').map(r => [
          r.type,
          r.amount,
          r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
          r.note || ''
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [230, 126, 34] },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
    doc.save(`user-data-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!hideTitle) {
    return (
      <div className="space-y-6">
        {/* User Info Card */}
        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-2 shadow-sm">
          {userPicUrl ? (
            <img
              src={userPicUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 mr-4"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl font-bold text-blue-600 mr-4">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{userName}</div>
            <div className="text-sm text-gray-500 dark:text-gray-300">{userEmail}</div>
            {registrationDate && (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Member since {registrationDate}
              </div>
            )}
          </div>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account settings and data
          </p>
        </div>
        
        <AccountManagement hideTitle />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Clean Profile Card */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-2xl border border-blue-200/50 dark:border-blue-800/50 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {userPicUrl ? (
              <div className="relative flex-shrink-0">
                <img
                  src={userPicUrl}
                  alt="Profile"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 shadow-sm"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm">
                  <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                </div>
              </div>
            ) : (
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl sm:text-2xl font-semibold text-white shadow-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-sm">
                  <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">{userName}</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5 sm:mt-1">{userEmail}</p>
              {registrationDate && (
                <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center mt-1.5 sm:mt-2">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 text-gray-400" />
                  <span className="hidden xs:inline">Member since </span>
                  {registrationDate}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => {
                if (isAndroidApp) {
                  setShowAndroidDownloadModal(true);
                } else {
                  handleExportPDF();
                }
              }}
              className="flex items-center px-3 py-2 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all border border-blue-200/50 dark:border-blue-800/50 text-sm font-medium hover:shadow-sm"
              title="Export Data"
            >
              <Download className="w-4 h-4" />
              <span className="hidden lg:inline ml-2">Export</span>
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center px-3 py-2 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all border border-blue-200/50 dark:border-blue-800/50 text-sm font-medium hover:shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline ml-2">Sign Out</span>
            </button>
            <button
              onClick={() => setShowProfileEdit(true)}
              className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-medium shadow-sm hover:shadow-md"
            >
              <Edit3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </button>
          </div>
        </div>

        {/* Compact Usage Alerts Widget - Inside Profile Card */}
        {!isPremiumPlan && criticalLimits.length > 0 && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-blue-200/50 dark:border-blue-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {criticalLimits.length} limit{criticalLimits.length > 1 ? 's' : ''} near capacity
                </span>
              </div>
              <Link
                to="/settings?tab=plans-usage"
                className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 transition-colors self-start sm:self-auto"
              >
                View Details
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Dashboard - Clean Minimalist Design */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-800/50 p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 md:p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none truncate">Accounts</p>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white leading-none flex-shrink-0">{dataSummary.accounts}</p>
                </div>
              </div>
              
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-800/50 p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 md:p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none truncate">Transactions</p>
                  </div>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white leading-none flex-shrink-0">{dataSummary.transactions}</p>
                  </div>
                </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-800/50 p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 md:p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex-shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none truncate">Purchases</p>
                    </div>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white leading-none flex-shrink-0">{dataSummary.purchases}</p>
                </div>
              </div>
              
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-800/50 p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 md:p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex-shrink-0">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none truncate">Currencies</p>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white leading-none flex-shrink-0">{dataSummary.currencies}</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-800/50 p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 md:p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex-shrink-0">
                <HandCoins className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-none truncate">Lend & Borrow</p>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 dark:text-white leading-none flex-shrink-0">{dataSummary.lendBorrow}</p>
          </div>
        </div>
      </div>

      {/* Account Management - Danger Zone */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-red-200/50 dark:border-red-800/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 sm:p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-red-900 dark:text-red-300 leading-none mb-0.5 sm:mb-1">Danger Zone</h3>
              <p className="text-[10px] sm:text-xs text-red-700 dark:text-red-400 leading-tight sm:leading-none">
                Permanently delete your account and all data
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDangerZoneExpanded(!isDangerZoneExpanded)}
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0 ml-2"
            aria-label={isDangerZoneExpanded ? "Collapse" : "Expand"}
          >
            {isDangerZoneExpanded ? (
              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
            ) : (
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
            )}
          </button>
        </div>
        
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isDangerZoneExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-red-100 dark:border-red-900/30 pt-3 sm:pt-4">
            <p className="text-xs text-red-700 dark:text-red-400 mb-3 sm:mb-4">
              This action cannot be undone. All your accounts, transactions, purchases, settings, and profile data will be permanently deleted.
            </p>
            <button
              onClick={handleStartDeletion}
              className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium text-xs sm:text-sm shadow-sm hover:shadow-md"
            >
              <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Delete My Account
              </button>
            </div>
          </div>
      </div>

      {/* Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            {currentStep === 'warning' && (
              <div className="text-center">
                <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 dark:text-red-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Final Warning
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                  Are you absolutely sure you want to delete your account? This action cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:space-x-0">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmWarning}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium shadow-sm text-sm sm:text-base"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'confirmation' && (
              <div className="text-center">
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 dark:text-red-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Type DELETE to Confirm
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                  To confirm account deletion, please type "DELETE" in the field below.
                </p>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && confirmationText === 'DELETE') {
                      handleConfirmDeletion();
                    } else if (e.key === 'Escape') {
                      handleCancel();
                    }
                  }}
                  placeholder="Type DELETE"
                  className={`w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4 transition-colors ${
                    confirmationText === 'DELETE' 
                      ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20' 
                      : confirmationText.length > 0 
                        ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600'
                  }`}
                  autoFocus
                />
                <div className="mb-3 sm:mb-4">
                  {confirmationText.length > 0 && confirmationText !== 'DELETE' && (
                    <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
                      Please type "DELETE" exactly
                    </p>
                  )}
                  {confirmationText === 'DELETE' && (
                    <p className="text-green-600 dark:text-green-400 text-xs sm:text-sm">
                      ✓ Confirmation ready
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:space-x-0">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeletion}
                    disabled={confirmationText !== 'DELETE'}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm text-sm sm:text-base"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'processing' && (
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Deleting Account
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                  Please wait while we delete your account and all associated data...
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${deletionProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {deletionProgress}% Complete
                </p>
              </div>
            )}

            {currentStep === 'complete' && (
              <div className="text-center">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Account Deleted
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
                  Your account has been successfully deleted. You will be automatically redirected to the login page in a few seconds.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      window.location.href = '/auth';
                    }}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm text-sm sm:text-base"
                  >
                    Go to Login Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <ProfileEditModal
          open={showProfileEdit}
          onClose={() => setShowProfileEdit(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={async () => {
          await logout();
          setShowLogoutConfirm(false);
        }}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to sign in again to access your account."
        recordDetails={
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p>You will be signed out of your account and redirected to the login page.</p>
          </div>
        }
        confirmLabel="Logout"
        cancelLabel="Cancel"
      />

      {/* Android Download Modal */}
      {showAndroidDownloadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl max-w-md w-full border border-gray-200/50 dark:border-gray-700/50">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Download Not Available
                </h3>
              </div>
              
              <div className="mb-4 sm:mb-6">
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
                  File downloads are not supported in the Android app due to security restrictions.
                </p>
                
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg p-3 sm:p-4">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2">
                    💡 Alternative Solutions:
                  </h4>
                  <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1.5 sm:space-y-2">
                    <li>• Open Balanze in your web browser</li>
                    <li>• Use the web version for downloads</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex">
                <button
                  onClick={() => setShowAndroidDownloadModal(false)}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 


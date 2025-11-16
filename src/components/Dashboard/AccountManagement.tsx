import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Download, UserX, Shield, CheckCircle, XCircle, User, CreditCard, ShoppingBag, TrendingUp, Globe, Heart, BookOpen, Clock, Edit3, Settings, Database, Calendar, BarChart3, FileText, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { generateTransactionId, createSuccessMessage } from '../../utils/transactionId';
import { getUserArticleStats } from '../../lib/articleHistory';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProfileEditModal } from '../Layout/ProfileEditModal';
import { useMobileDetection } from '../../hooks/useMobileDetection';

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
  const [articleStats, setArticleStats] = useState({
    totalReads: 0,
    helpfulCount: 0,
    notHelpfulCount: 0,
    noFeedbackCount: 0,
    helpfulRate: 0,
    totalTimeSpent: 0
  });
  const [loadingArticleStats, setLoadingArticleStats] = useState(false);
  const { isMobile } = useMobileDetection();
  
  // Android detection
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isCapacitor = !!(window as any).Capacitor;
  const isAndroidApp = isAndroid && isCapacitor;
  
  // Android download modal state
  const [showAndroidDownloadModal, setShowAndroidDownloadModal] = useState(false);

  // Fetch all data on component mount
  useEffect(() => {
    if (user) {
      fetchAccounts();
      fetchTransactions();
      fetchPurchases();
      fetchDonationSavingRecords();
      
      // Fetch article statistics
      setLoadingArticleStats(true);
      getUserArticleStats().then(stats => {
        setArticleStats(stats);
        setLoadingArticleStats(false);
      }).catch(error => {

        setLoadingArticleStats(false);
      });
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

  // Helper function to format total time spent
  const formatTotalTimeSpent = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

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
    <div className="space-y-3">
      {/* Enhanced Profile Card with Pattern Background */}
      <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 rounded-xl border border-blue-200/50 dark:border-gray-700 p-3 shadow-md overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(59, 130, 246) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {userPicUrl ? (
              <div className="relative">
                <img
                  src={userPicUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-lg ring-2 ring-blue-500/20"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <User className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-2 ring-blue-500/20">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <User className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 truncate">{userName}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5">{userEmail}</p>
              {registrationDate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                  <div className="p-0.5 bg-blue-100 dark:bg-blue-900/30 rounded mr-1.5">
                    <Calendar className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Member since {registrationDate}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowProfileEdit(true)}
            className="flex items-center px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm border border-gray-200 dark:border-gray-600 text-sm font-medium hover:shadow-md hover:scale-105"
          >
            <div className="p-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md mr-1.5">
              <Edit3 className="w-3 h-3 text-white" />
            </div>
            <span className="hidden sm:inline">Edit Profile</span>
            <span className="sm:hidden">Edit</span>
          </button>
        </div>
      </div>

      {/* Statistics Dashboard with Progress Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-blue-200/50 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-lg shadow-sm">
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Accounts</p>
            <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">{dataSummary.accounts}</p>
            <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((dataSummary.accounts / 10) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-green-200/50 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-lg shadow-sm">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Transactions</p>
            <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">{dataSummary.transactions}</p>
            <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-600 to-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((dataSummary.transactions / 1000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-purple-200/50 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 rounded-lg shadow-sm">
                <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Purchases</p>
            <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">{dataSummary.purchases}</p>
            <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((dataSummary.purchases / 500) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-indigo-200/50 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 rounded-lg shadow-sm">
                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Currencies</p>
            <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-blue-400">{dataSummary.currencies}</p>
            <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((dataSummary.currencies / 5) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Quick Actions Card */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -mr-12 -mt-12"></div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2.5 flex items-center relative">
            <div className="p-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-md mr-2">
              <Settings className="w-3 h-3 text-white" />
            </div>
            Quick Actions
          </h3>
          <div className="space-y-2 relative">
            <button
              onClick={() => {
                if (isAndroidApp) {
                  setShowAndroidDownloadModal(true);
                } else {
                  handleExportPDF();
                }
              }}
              className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all border border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md group"
            >
              <div className="flex items-center min-w-0">
                <div className="p-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md mr-2.5 shadow-sm group-hover:scale-110 transition-transform">
                  <Download className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 truncate">Export Data</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 truncate">Download as PDF</p>
                </div>
              </div>
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md group"
            >
              <div className="flex items-center min-w-0">
                <div className="p-1.5 bg-gray-200 dark:bg-gray-600 rounded-md mr-2.5 shadow-sm group-hover:scale-110 transition-transform">
                  <LogOut className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">Sign Out</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Log out of account</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Article Reading Statistics */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full -mr-12 -mt-12"></div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2.5 flex items-center relative">
            <div className="p-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-md mr-2">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            Reading Statistics
          </h3>
          {loadingArticleStats ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 relative">
              <div className="relative bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 rounded-lg p-2.5 border border-cyan-200/50 dark:border-cyan-800/50 shadow-sm hover:shadow-md transition-all group">
                <div className="absolute top-1 right-1 w-10 h-10 bg-cyan-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform"></div>
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="p-1 bg-cyan-500/20 rounded-md">
                      <BookOpen className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">Articles</span>
                  </div>
                  <div className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-cyan-700 bg-clip-text text-transparent dark:from-cyan-400 dark:to-cyan-300">{articleStats.totalReads}</div>
                </div>
              </div>
              
              <div className="relative bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-lg p-2.5 border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm hover:shadow-md transition-all group">
                <div className="absolute top-1 right-1 w-10 h-10 bg-emerald-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform"></div>
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="p-1 bg-emerald-500/20 rounded-md">
                      <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Rate</span>
                  </div>
                  <div className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent dark:from-emerald-400 dark:to-emerald-300">
                    {articleStats.helpfulRate > 0 ? `${Math.round(articleStats.helpfulRate)}%` : 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="relative bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-2.5 border border-green-200/50 dark:border-green-800/50 shadow-sm hover:shadow-md transition-all group">
                <div className="absolute top-1 right-1 w-10 h-10 bg-green-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform"></div>
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="p-1 bg-green-500/20 rounded-md">
                      <Heart className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wide">Helpful</span>
                  </div>
                  <div className="text-lg font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent dark:from-green-400 dark:to-green-300">{articleStats.helpfulCount}</div>
                </div>
              </div>
              
              <div className="relative bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 rounded-lg p-2.5 border border-violet-200/50 dark:border-violet-800/50 shadow-sm hover:shadow-md transition-all group">
                <div className="absolute top-1 right-1 w-10 h-10 bg-violet-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform"></div>
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="p-1 bg-violet-500/20 rounded-md">
                      <Clock className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wide">Time</span>
                  </div>
                  <div className="text-lg font-bold bg-gradient-to-r from-violet-600 to-violet-700 bg-clip-text text-transparent dark:from-violet-400 dark:to-violet-300">
                    {formatTotalTimeSpent(articleStats.totalTimeSpent)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Account Management - Danger Zone */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg border-2 border-red-300 dark:border-red-800/50 p-3 shadow-md overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 dark:from-red-900/10 dark:to-orange-900/10"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16"></div>
        {isMobile ? (
          // Mobile Layout - Icon at top
          <div className="text-center relative">
            <div className="flex justify-center mb-2.5">
              <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 rounded-lg shadow-md">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h3 className="text-base font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent dark:from-red-400 dark:to-red-500 mb-1.5">Danger Zone</h3>
            <p className="text-xs text-red-700 dark:text-red-300 mb-2.5">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <div className="bg-red-50/80 dark:bg-red-900/20 rounded-lg p-2.5 mb-2.5 border border-red-200/50 dark:border-red-800/50">
              <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-1.5 uppercase tracking-wide">This will delete:</p>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-0.5">
                <li className="flex items-center"><span className="mr-1.5">•</span> All accounts and balances</li>
                <li className="flex items-center"><span className="mr-1.5">•</span> All transaction history</li>
                <li className="flex items-center"><span className="mr-1.5">•</span> All purchase records</li>
                <li className="flex items-center"><span className="mr-1.5">•</span> All settings and preferences</li>
                <li className="flex items-center"><span className="mr-1.5">•</span> Your user profile and data</li>
              </ul>
            </div>
            <button
              onClick={handleStartDeletion}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold text-xs shadow-md hover:shadow-lg hover:scale-105"
            >
              <UserX className="w-3.5 h-3.5 mr-1.5" />
              Delete My Account
            </button>
          </div>
        ) : (
          // Desktop Layout - Icon on left
          <div className="flex items-start relative">
            <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40 rounded-lg shadow-md mr-2.5 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent dark:from-red-400 dark:to-red-500 mb-1.5">Danger Zone</h3>
              <p className="text-xs text-red-700 dark:text-red-300 mb-2.5">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <div className="bg-red-50/80 dark:bg-red-900/20 rounded-lg p-2.5 mb-2.5 border border-red-200/50 dark:border-red-800/50">
                <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-1.5 uppercase tracking-wide">This will delete:</p>
                <ul className="text-xs text-red-700 dark:text-red-300 space-y-0.5">
                  <li className="flex items-center"><span className="mr-1.5">•</span> All accounts and balances</li>
                  <li className="flex items-center"><span className="mr-1.5">•</span> All transaction history</li>
                  <li className="flex items-center"><span className="mr-1.5">•</span> All purchase records</li>
                  <li className="flex items-center"><span className="mr-1.5">•</span> All settings and preferences</li>
                  <li className="flex items-center"><span className="mr-1.5">•</span> Your user profile and data</li>
                </ul>
              </div>
              <button
                onClick={handleStartDeletion}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold text-xs shadow-md hover:shadow-lg hover:scale-105"
              >
                <UserX className="w-3.5 h-3.5 mr-1.5" />
                Delete My Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            {currentStep === 'warning' && (
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Final Warning
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you absolutely sure you want to delete your account? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmWarning}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'confirmation' && (
              <div className="text-center">
                <Shield className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Type DELETE to Confirm
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
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
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4 transition-colors ${
                    confirmationText === 'DELETE' 
                      ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20' 
                      : confirmationText.length > 0 
                        ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600'
                  }`}
                  autoFocus
                />
                <div className="mb-4">
                  {confirmationText.length > 0 && confirmationText !== 'DELETE' && (
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      Please type "DELETE" exactly
                    </p>
                  )}
                  {confirmationText === 'DELETE' && (
                    <p className="text-green-600 dark:text-green-400 text-sm">
                      ✓ Confirmation ready
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDeletion}
                    disabled={confirmationText !== 'DELETE'}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'processing' && (
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Deleting Account
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
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
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Account Deleted
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your account has been successfully deleted. You will be automatically redirected to the login page in a few seconds.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      window.location.href = '/auth';
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

      {/* Android Download Modal */}
      {showAndroidDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Download Not Available
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  File downloads are not supported in the Android app due to security restrictions.
                </p>
                
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    💡 Alternative Solutions:
                  </h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    <li>• Open Balanze in your web browser</li>
                    <li>• Use the web version for downloads</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex">
                <button
                  onClick={() => setShowAndroidDownloadModal(false)}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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


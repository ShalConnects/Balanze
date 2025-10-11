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
        console.error('Error loading article stats:', error);
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
      console.log('Starting account deletion process...');
      
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
      console.log('Using auth store deletion method...');
      const { success, error } = await deleteAccount();
      
      if (!success) {
        throw new Error(error || 'Failed to delete account');
      }

      console.log('Account deletion completed successfully');
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
      console.error('Account deletion failed:', error);
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
      console.error('Error exporting data:', error);
      
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
    <div className="space-y-4">
      {/* Enhanced Profile Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-blue-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {userPicUrl ? (
              <img
                src={userPicUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-md"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-md">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{userName}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{userEmail}</p>
              {registrationDate && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                  <Calendar className="w-3 h-3 mr-1" />
                  Member since {registrationDate}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowProfileEdit(true)}
            className="flex items-center px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm border border-gray-200 dark:border-gray-600 text-sm"
          >
            <Edit3 className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Edit Profile</span>
            <span className="sm:hidden">Edit</span>
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Accounts</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{dataSummary.accounts}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Transactions</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{dataSummary.transactions}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Purchases</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{dataSummary.purchases}</p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
              <ShoppingBag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">Currencies</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{dataSummary.currencies}</p>
            </div>
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex-shrink-0">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Data Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="space-y-2">
            <button
              onClick={handleExportPDF}
              className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center min-w-0">
                <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">Export Data</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 truncate">Download as PDF</p>
                </div>
              </div>
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center min-w-0">
                <LogOut className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">Sign Out</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Log out of account</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Article Reading Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          {loadingArticleStats ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-3 border border-cyan-200 dark:border-cyan-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">Articles</span>
                </div>
                <div className="text-lg font-bold text-cyan-900 dark:text-cyan-100">{articleStats.totalReads}</div>
              </div>
              
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Rate</span>
                </div>
                <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                  {articleStats.helpfulRate > 0 ? `${Math.round(articleStats.helpfulRate)}%` : 'N/A'}
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <Heart className="w-3 h-3 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Helpful</span>
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">{articleStats.helpfulCount}</div>
              </div>
              
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 border border-violet-200 dark:border-violet-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                  <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Time</span>
                </div>
                <div className="text-lg font-bold text-violet-900 dark:text-violet-100">
                  {formatTotalTimeSpent(articleStats.totalTimeSpent)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Account Management - Danger Zone */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-4 shadow-sm">
        <div className="flex items-start">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3 flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-red-800 dark:text-red-200 mb-1">This will delete:</p>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-0.5">
                <li>• All accounts and balances</li>
                <li>• All transaction history</li>
                <li>• All purchase records</li>
                <li>• All settings and preferences</li>
                <li>• Your user profile and data</li>
              </ul>
            </div>
            <button
              onClick={handleStartDeletion}
              className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
            >
              <UserX className="w-4 h-4 mr-1.5" />
              Delete My Account
            </button>
          </div>
        </div>
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
    </div>
  );
}; 
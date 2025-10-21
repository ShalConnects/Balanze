import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Plus, 
  BarChart3, 
  Target, 
  Wallet,
  PieChart,
  LineChart
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { InvestmentDashboard } from '../components/Investments/InvestmentDashboard';
import { AssetManagement } from '../components/Investments/AssetManagement';
import { InvestmentGoals } from '../components/Investments/InvestmentGoals';
import { InvestmentTransactionForm } from '../components/Investments/InvestmentTransactionForm';
import { useAuthStore } from '../store/authStore';

type InvestmentTab = 'dashboard' | 'assets' | 'transactions' | 'goals' | 'analytics';

export const Investments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InvestmentTab>('dashboard');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);

  const {
    investmentAssets,
    investmentTransactions,
    investmentGoals,
    investmentCategories,
    loading,
    error,
    fetchInvestmentAssets,
    fetchInvestmentTransactions,
    fetchInvestmentGoals,
    fetchInvestmentCategories,
    getInvestmentDashboardStats,
    getInvestmentAnalytics,
    addInvestmentTransaction,
    addInvestmentAsset,
    addInvestmentGoal,
    updateInvestmentAsset,
    deleteInvestmentAsset,
    updateInvestmentGoal,
    deleteInvestmentGoal
  } = useFinanceStore();

  const { accounts } = useFinanceStore();

  useEffect(() => {
    // Fetch all investment data when component mounts
    const fetchData = async () => {
      await Promise.all([
        fetchInvestmentAssets(),
        fetchInvestmentTransactions(),
        fetchInvestmentGoals(),
        fetchInvestmentCategories()
      ]);
    };

    fetchData();
  }, []);

  const handleAddTransaction = async (transaction: any) => {
    try {
      await addInvestmentTransaction(transaction);
      setShowTransactionForm(false);
      // Refresh data
      await fetchInvestmentTransactions();
      await fetchInvestmentAssets(); // Assets might have changed
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleAddAsset = async (asset: any) => {
    try {
      await addInvestmentAsset(asset);
      setShowAssetForm(false);
      await fetchInvestmentAssets();
    } catch (error) {
      console.error('Error adding asset:', error);
    }
  };

  const handleAddGoal = async (goal: any) => {
    try {
      await addInvestmentGoal(goal);
      setShowGoalForm(false);
      await fetchInvestmentGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const handleEditAsset = (asset: any) => {
    // TODO: Implement edit asset functionality
    console.log('Edit asset:', asset);
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      await deleteInvestmentAsset(assetId);
      await fetchInvestmentAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const handleEditGoal = (goal: any) => {
    // TODO: Implement edit goal functionality
    console.log('Edit goal:', goal);
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteInvestmentGoal(goalId);
      await fetchInvestmentGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, status: any) => {
    try {
      await updateInvestmentGoal(goalId, { status });
      await fetchInvestmentGoals();
    } catch (error) {
      console.error('Error updating goal status:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'assets', label: 'Assets', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: TrendingUp },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: PieChart }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <InvestmentDashboard
            stats={getInvestmentDashboardStats()}
            loading={loading}
            onAddAsset={() => setShowAssetForm(true)}
            onAddTransaction={() => setShowTransactionForm(true)}
            onAddGoal={() => setShowGoalForm(true)}
          />
        );
      
      case 'assets':
        return (
          <AssetManagement
            assets={investmentAssets}
            loading={loading}
            onAddAsset={() => setShowAssetForm(true)}
            onEditAsset={handleEditAsset}
            onDeleteAsset={handleDeleteAsset}
            onViewAsset={(asset) => console.log('View asset:', asset)}
          />
        );
      
      case 'goals':
        return (
          <InvestmentGoals
            goals={investmentGoals}
            loading={loading}
            onAddGoal={() => setShowGoalForm(true)}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            onUpdateGoalStatus={handleUpdateGoalStatus}
          />
        );
      
      case 'transactions':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Investment Transactions</h2>
                <p className="text-gray-600">Track all your investment transactions</p>
              </div>
              <button
                onClick={() => setShowTransactionForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </button>
            </div>
            
            {/* Transaction List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="space-y-4">
                  {investmentTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                      <p className="text-gray-500 mb-4">Start tracking your investment transactions</p>
                      <button
                        onClick={() => setShowTransactionForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Your First Transaction
                      </button>
                    </div>
                  ) : (
                    investmentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.transaction_type === 'buy' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <TrendingUp className={`w-5 h-5 ${
                              transaction.transaction_type === 'buy' ? 'text-green-600' : 'text-red-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {transaction.transaction_type === 'buy' ? 'Bought' : 'Sold'} {transaction.quantity} shares
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.transaction_date).toLocaleDateString()} • 
                              {transaction.currency} {transaction.total_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {transaction.currency} {transaction.total_amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            @ {transaction.currency} {transaction.price_per_share.toFixed(2)}/share
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Investment Analytics</h2>
              <p className="text-gray-600">Detailed analysis of your investment portfolio</p>
            </div>
            
            {/* Analytics Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Gain/Loss</span>
                    <span className="font-medium text-green-600">+$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Return %</span>
                    <span className="font-medium text-green-600">+0.00%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Allocation</h3>
                <div className="text-center py-8">
                  <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No data available</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading investments</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investments</h1>
          <p className="text-gray-600">Manage your investment portfolio</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as InvestmentTab)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Modals */}
      <InvestmentTransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSubmit={handleAddTransaction}
        assets={investmentAssets}
        accounts={accounts.filter(account => account.type === 'investment')}
        loading={loading}
      />
    </div>
  );
};

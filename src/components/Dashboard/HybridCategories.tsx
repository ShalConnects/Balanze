import React, { useState } from 'react';
import { IncomeCategories } from '../Purchases/IncomeCategories';
import { PurchaseCategories } from '../Purchases/PurchaseCategories';
import { TrendingUp, TrendingDown, Plus, Settings } from 'lucide-react';

interface HybridCategoriesProps {
  hideTitle?: boolean;
}

type CategoryType = 'income' | 'expense';

export const HybridCategories: React.FC<HybridCategoriesProps> = ({ hideTitle = false }) => {
  const [activeType, setActiveType] = useState<CategoryType>('income');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleTypeChange = (type: CategoryType) => {
    setActiveType(type);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Categories</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your income and expense categories to organize your financial data
          </p>
        </div>
      )}

      {/* Toggle Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => handleTypeChange('income')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeType === 'income'
                ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Income Categories
          </button>
          <button
            onClick={() => handleTypeChange('expense')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeType === 'expense'
                ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Expense Categories
          </button>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add {activeType === 'income' ? 'Income' : 'Expense'} Category
        </button>
      </div>

      {/* Active Type Indicator */}
      <div className={`p-4 rounded-lg border-l-4 ${
        activeType === 'income' 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-400' 
          : 'bg-red-50 dark:bg-red-900/20 border-red-400'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            activeType === 'income' 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            {activeType === 'income' ? (
              <TrendingUp className={`w-5 h-5 ${
                activeType === 'income' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} />
            ) : (
              <TrendingDown className={`w-5 h-5 ${
                activeType === 'income' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`} />
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${
              activeType === 'income' 
                ? 'text-green-900 dark:text-green-100' 
                : 'text-red-900 dark:text-red-100'
            }`}>
              {activeType === 'income' ? 'Income' : 'Expense'} Categories
            </h3>
            <p className={`text-sm ${
              activeType === 'income' 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
            }`}>
              {activeType === 'income' 
                ? 'Manage categories for tracking your income sources' 
                : 'Manage categories for tracking your expenses and purchases'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Category Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6">
          {activeType === 'income' ? (
            <IncomeCategories hideTitle />
          ) : (
            <PurchaseCategories hideTitle />
          )}
        </div>
      </div>

      {/* Quick Stats for Both Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
            activeType === 'income'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 shadow-md'
              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/10'
          }`}
          onClick={() => handleTypeChange('income')}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              activeType === 'income' 
                ? 'bg-green-500' 
                : 'bg-green-100 dark:bg-green-900/30'
            }`}>
              <TrendingUp className={`w-4 h-4 ${
                activeType === 'income' 
                  ? 'text-white' 
                  : 'text-green-600 dark:text-green-400'
              }`} />
            </div>
            <div>
              <p className={`font-medium ${
                activeType === 'income' 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-gray-800 dark:text-gray-200'
              }`}>
                Income Categories
              </p>
              <p className={`text-xs ${
                activeType === 'income' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                Track your income sources
              </p>
            </div>
          </div>
        </div>
        
        <div 
          className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
            activeType === 'expense'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 shadow-md'
              : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/10'
          }`}
          onClick={() => handleTypeChange('expense')}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              activeType === 'expense' 
                ? 'bg-red-500' 
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <TrendingDown className={`w-4 h-4 ${
                activeType === 'expense' 
                  ? 'text-white' 
                  : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
            <div>
              <p className={`font-medium ${
                activeType === 'expense' 
                  ? 'text-red-800 dark:text-red-200' 
                  : 'text-gray-800 dark:text-gray-200'
              }`}>
                Expense Categories
              </p>
              <p className={`text-xs ${
                activeType === 'expense' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                Organize your spending
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-blue-600 rounded-lg mt-0.5">
            <Settings className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">Category Management</h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Use the toggle buttons above to switch between income and expense categories. 
              Each type has its own set of categories and can be managed independently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


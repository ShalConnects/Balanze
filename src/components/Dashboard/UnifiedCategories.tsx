import React, { useState } from 'react';
import { IncomeCategories } from '../Purchases/IncomeCategories';
import { PurchaseCategories } from '../Purchases/PurchaseCategories';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';

interface UnifiedCategoriesProps {
  hideTitle?: boolean;
}

export const UnifiedCategories: React.FC<UnifiedCategoriesProps> = ({ hideTitle = false }) => {
  const [expandedSections, setExpandedSections] = useState({
    income: true,
    expense: true
  });

  const toggleSection = (section: 'income' | 'expense') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

      {/* Income Categories Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <button
          onClick={() => toggleSection('income')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Income Categories</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Categories for tracking your income sources
              </p>
            </div>
          </div>
          {expandedSections.income ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.income && (
          <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
            <IncomeCategories hideTitle />
          </div>
        )}
      </div>

      {/* Expense Categories Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <button
          onClick={() => toggleSection('expense')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expense Categories</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Categories for tracking your expenses and purchases
              </p>
            </div>
          </div>
          {expandedSections.expense ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>
        
        {expandedSections.expense && (
          <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
            <PurchaseCategories hideTitle />
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Income Categories</p>
              <p className="text-xs text-green-600 dark:text-green-400">Track your income sources</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <TrendingDown className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Expense Categories</p>
              <p className="text-xs text-red-600 dark:text-red-400">Organize your spending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { IncomeCategories } from '../Purchases/IncomeCategories';
import { PurchaseCategories } from '../Purchases/PurchaseCategories';
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown,
  Eye,
  EyeOff
} from 'lucide-react';

interface CollapsibleCategoriesProps {
  hideTitle?: boolean;
}

export const CollapsibleCategories: React.FC<CollapsibleCategoriesProps> = ({ hideTitle = false }) => {
  const [expandedSections, setExpandedSections] = useState({
    income: true,
    expense: false
  });

  const [showAllSections, setShowAllSections] = useState(false);

  const toggleSection = (section: 'income' | 'expense') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleAllSections = () => {
    const newState = !showAllSections;
    setShowAllSections(newState);
    setExpandedSections({
      income: newState,
      expense: newState
    });
  };

  const getSectionCount = () => {
    return Object.values(expandedSections).filter(Boolean).length;
  };

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Categories</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your income and expense categories. Expand sections as needed to focus on specific types.
          </p>
        </div>
      )}

      {/* Global Controls */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sections expanded: {getSectionCount()}/2
            </span>
            <div className="flex gap-1">
              {Object.entries(expandedSections).map(([key, isExpanded]) => (
                <div
                  key={key}
                  className={`w-2 h-2 rounded-full ${
                    isExpanded 
                      ? key === 'income' 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAllSections}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              showAllSections
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {showAllSections ? (
              <>
                <EyeOff className="w-4 h-4" />
                Collapse All
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Expand All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Income Categories Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('income')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                  Income Categories
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track your income sources and revenue streams
                </p>
              </div>
            </div>
            
            {/* Section Status Indicator */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              expandedSections.income
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {expandedSections.income ? 'Expanded' : 'Collapsed'}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {expandedSections.income ? (
              <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
            )}
          </div>
        </button>
        
        {expandedSections.income && (
          <div className="border-t border-gray-100 dark:border-gray-700">
            <div className="p-4 bg-green-50/30 dark:bg-green-900/10">
              <IncomeCategories hideTitle />
            </div>
          </div>
        )}
      </div>

      {/* Expense Categories Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('expense')}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
                  Expense Categories
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Organize your spending and purchase categories
                </p>
              </div>
            </div>
            
            {/* Section Status Indicator */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              expandedSections.expense
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {expandedSections.expense ? 'Expanded' : 'Collapsed'}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {expandedSections.expense ? (
              <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
            )}
          </div>
        </button>
        
        {expandedSections.expense && (
          <div className="border-t border-gray-100 dark:border-gray-700">
            <div className="p-4 bg-red-50/30 dark:bg-red-900/10">
              <PurchaseCategories hideTitle />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};


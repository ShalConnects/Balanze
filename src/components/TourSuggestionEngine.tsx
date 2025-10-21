// src/components/TourSuggestionEngine.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { Lightbulb, TrendingUp, Target, Settings, BookOpen } from 'lucide-react';
import ArticleBasedTour from './ArticleBasedTour';

interface TourSuggestion {
  id: string;
  title: string;
  description: string;
  articleSlug: string;
  reason: string;
  icon: React.ReactNode;
  priority: number;
  category: string;
}

interface TourSuggestionEngineProps {
  maxSuggestions?: number;
  className?: string;
}

export default function TourSuggestionEngine({ 
  maxSuggestions = 3, 
  className = '' 
}: TourSuggestionEngineProps) {
  const [suggestions, setSuggestions] = useState<TourSuggestion[]>([]);
  const [showTour, setShowTour] = useState(false);
  const [selectedTour, setSelectedTour] = useState<string | null>(null);
  
  const location = useLocation();
  const { user } = useAuthStore();
  const { accounts, transactions } = useFinanceStore();

  // Generate tour suggestions based on user context
  useEffect(() => {
    const newSuggestions: TourSuggestion[] = [];

    // New user suggestions
    if (accounts.length === 0) {
      newSuggestions.push({
        id: 'getting-started',
        title: 'Getting Started with Balanze',
        description: 'Learn the basics of setting up your account and tracking finances',
        articleSlug: 'getting-started-guide',
        reason: 'You\'re new to Balanze - let\'s get you started!',
        icon: <BookOpen className="w-4 h-4" />,
        priority: 10,
        category: 'Getting Started'
      });
    }

    // Account management suggestions
    if (accounts.length === 1 && transactions.length === 0) {
      newSuggestions.push({
        id: 'first-transaction',
        title: 'Add Your First Transaction',
        description: 'Learn how to record your income and expenses',
        articleSlug: 'create-first-transaction',
        reason: 'You have an account - now let\'s add some transactions!',
        icon: <TrendingUp className="w-4 h-4" />,
        priority: 9,
        category: 'Transactions'
      });
    }

    // Analytics suggestions
    if (transactions.length >= 5 && location.pathname === '/analytics') {
      newSuggestions.push({
        id: 'analytics-tour',
        title: 'Understanding Your Analytics',
        description: 'Explore your financial insights and reporting features',
        articleSlug: 'analytics-overview',
        reason: 'You have enough data to explore analytics!',
        icon: <Target className="w-4 h-4" />,
        priority: 8,
        category: 'Analytics'
      });
    }

    // Multiple accounts suggestion
    if (accounts.length === 1 && transactions.length >= 3) {
      newSuggestions.push({
        id: 'multiple-accounts',
        title: 'Managing Multiple Accounts',
        description: 'Learn how to add and manage multiple accounts',
        articleSlug: 'account-management-guide',
        reason: 'Ready to expand your account setup?',
        icon: <Settings className="w-4 h-4" />,
        priority: 7,
        category: 'Account Management'
      });
    }

    // Settings optimization
    if (transactions.length >= 10 && location.pathname === '/settings') {
      newSuggestions.push({
        id: 'settings-optimization',
        title: 'Optimize Your Settings',
        description: 'Customize your Balanze experience with advanced settings',
        articleSlug: 'settings-page-comprehensive-guide',
        reason: 'Time to personalize your experience!',
        icon: <Settings className="w-4 h-4" />,
        priority: 6,
        category: 'Settings'
      });
    }

    // Sort by priority and limit suggestions
    const sortedSuggestions = newSuggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxSuggestions);

    setSuggestions(sortedSuggestions);
  }, [accounts.length, transactions.length, location.pathname, maxSuggestions]);

  const handleStartTour = (suggestion: TourSuggestion) => {
    setSelectedTour(suggestion.articleSlug);
    setShowTour(true);
  };

  const handleCloseTour = () => {
    setShowTour(false);
    setSelectedTour(null);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Getting Started': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Account Management': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'Transactions': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Analytics': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'Settings': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Suggested Tours
          </h3>
        </div>

        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    {suggestion.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {suggestion.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(suggestion.category)}`}>
                        {suggestion.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {suggestion.reason}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleStartTour(suggestion)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Start
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Article-Based Tour */}
      {showTour && selectedTour && (
        <ArticleBasedTour
          articleSlug={selectedTour}
          isOpen={showTour}
          onClose={handleCloseTour}
        />
      )}
    </>
  );
}

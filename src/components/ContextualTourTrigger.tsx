// src/components/ContextualTourTrigger.tsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFinanceStore } from '../store/useFinanceStore';
import { track } from '../lib/analytics';
import ArticleBasedTour from './ArticleBasedTour';

interface ContextualTourTriggerProps {
  onTourStart?: (tourId: string) => void;
  onTourDismiss?: () => void;
}

interface TourTrigger {
  id: string;
  condition: () => boolean;
  articleSlug: string;
  title: string;
  description: string;
  priority: number;
  cooldownHours?: number;
}

// User behavior detection
function useUserBehavior() {
  const { user } = useAuthStore();
  const { accounts, transactions } = useFinanceStore();
  const location = useLocation();

  return {
    hasAccounts: accounts.length > 0,
    hasTransactions: transactions.length > 0,
    isNewUser: accounts.length === 0 && transactions.length === 0,
    isOnDashboard: location.pathname === '/',
    isOnAccounts: location.pathname === '/accounts',
    isOnTransactions: location.pathname === '/transactions',
    isOnAnalytics: location.pathname === '/analytics',
    accountCount: accounts.length,
    transactionCount: transactions.length,
    lastLogin: user?.lastLogin,
  };
}

// Check if tour was recently shown
function wasTourRecentlyShown(tourId: string, cooldownHours: number = 24): boolean {
  const lastShown = localStorage.getItem(`tour_shown_${tourId}`);
  if (!lastShown) return false;
  
  const lastShownTime = new Date(lastShown).getTime();
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  return Date.now() - lastShownTime < cooldownMs;
}

// Mark tour as shown
function markTourAsShown(tourId: string): void {
  localStorage.setItem(`tour_shown_${tourId}`, new Date().toISOString());
}

export default function ContextualTourTrigger({ 
  onTourStart, 
  onTourDismiss 
}: ContextualTourTriggerProps) {
  const [activeTrigger, setActiveTrigger] = useState<TourTrigger | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [dismissedTriggers, setDismissedTriggers] = useState<Set<string>>(new Set());
  
  const behavior = useUserBehavior();
  
  // Create tour triggers inside the component where hooks can be used
  const triggers: TourTrigger[] = [
    {
      id: 'first-account-setup',
      condition: () => behavior.isNewUser && behavior.isOnAccounts,
      articleSlug: 'create-first-account',
      title: 'Need help setting up your first account?',
      description: 'Let me guide you through creating your first account step by step.',
      priority: 10,
      cooldownHours: 24
    },
    {
      id: 'first-transaction',
      condition: () => behavior.hasAccounts && !behavior.hasTransactions && behavior.isOnTransactions,
      articleSlug: 'create-first-transaction',
      title: 'Ready to add your first transaction?',
      description: 'I can show you how to record your income and expenses.',
      priority: 9,
      cooldownHours: 12
    },
    {
      id: 'analytics-exploration',
      condition: () => behavior.hasTransactions && behavior.transactionCount >= 5 && behavior.isOnAnalytics,
      articleSlug: 'analytics-overview',
      title: 'Want to understand your spending patterns?',
      description: 'Let me show you how to use the analytics features to gain insights.',
      priority: 7,
      cooldownHours: 48
    },
    {
      id: 'multiple-accounts',
      condition: () => behavior.accountCount === 1 && behavior.hasTransactions && behavior.isOnAccounts,
      articleSlug: 'account-management-guide',
      title: 'Ready to add more accounts?',
      description: 'Learn how to manage multiple accounts and transfers.',
      priority: 6,
      cooldownHours: 24
    },
    {
      id: 'settings-optimization',
      condition: () => behavior.hasTransactions && behavior.transactionCount >= 10 && behavior.isOnAnalytics,
      articleSlug: 'settings-page-comprehensive-guide',
      title: 'Want to customize your experience?',
      description: 'Explore settings to personalize your Balanze experience.',
      priority: 5,
      cooldownHours: 72
    }
  ];

  useEffect(() => {
    // Check for active triggers
    const activeTriggers = triggers
      .filter(trigger => {
        if (dismissedTriggers.has(trigger.id)) return false;
        if (wasTourRecentlyShown(trigger.id, trigger.cooldownHours)) return false;
        return trigger.condition();
      })
      .sort((a, b) => b.priority - a.priority);

    if (activeTriggers.length > 0 && !activeTrigger) {
      setActiveTrigger(activeTriggers[0]);
    }
  }, [behavior, dismissedTriggers, activeTrigger]);

  const handleStartTour = () => {
    if (!activeTrigger) return;
    
    setShowTour(true);
    markTourAsShown(activeTrigger.id);
    track('contextual_tour_start', {
      tour_id: activeTrigger.id,
      article_slug: activeTrigger.articleSlug,
      trigger_condition: 'contextual'
    });
    
    onTourStart?.(activeTrigger.id);
  };

  const handleDismiss = () => {
    if (!activeTrigger) return;
    
    setDismissedTriggers(prev => new Set([...prev, activeTrigger.id]));
    setActiveTrigger(null);
    track('contextual_tour_dismiss', {
      tour_id: activeTrigger.id,
      article_slug: activeTrigger.articleSlug
    });
    
    onTourDismiss?.();
  };

  const handleTourClose = () => {
    setShowTour(false);
    setActiveTrigger(null);
  };

  // Don't show if no active trigger
  if (!activeTrigger) return null;

  return (
    <>
      {/* Contextual Tour Banner */}
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-sm">💡</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                {activeTrigger.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                {activeTrigger.description}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleStartTour}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  Start Tour
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Article-Based Tour */}
      {showTour && (
        <ArticleBasedTour
          articleSlug={activeTrigger.articleSlug}
          isOpen={showTour}
          onClose={handleTourClose}
        />
      )}
    </>
  );
}

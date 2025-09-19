// src/components/OnboardingQuickstart.tsx
import React, { useState, useEffect } from 'react';
import { Wallet, DollarSign, BarChart2, CheckCircle2, Play, X } from 'lucide-react';
import { track, trackOnboardingStep } from '../lib/analytics';
import { useAuthStore } from '../store/authStore';
import { useFinanceStore } from '../store/useFinanceStore';
import clsx from 'clsx';

interface OnboardingQuickstartProps {
  onStartTour: (stepId: string) => void;
  onClose?: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  link: string;
  checkComplete: () => boolean;
}

export default function OnboardingQuickstart({ onStartTour, onClose }: OnboardingQuickstartProps) {
  const { accounts, transactions } = useFinanceStore();
  const { profile } = useAuthStore();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);

  const steps: OnboardingStep[] = [
    {
      id: 'add-account',
      title: 'Create your first account',
      description: 'Set up a bank account, wallet, or credit card to start tracking',
      icon: Wallet,
      link: '/accounts',
      checkComplete: () => accounts.length > 0
    },
    {
      id: 'add-transaction',
      title: 'Record your first transaction',
      description: 'Add an income or expense to see your financial activity',
      icon: DollarSign,
      link: '/transactions',
      checkComplete: () => transactions.length > 0
    },
    {
      id: 'view-analytics',
      title: 'Explore your financial insights',
      description: 'Check your spending patterns and financial health',
      icon: BarChart2,
      link: '/analytics',
      checkComplete: () => {
        // Consider analytics viewed if user has transactions and accounts
        return accounts.length > 0 && transactions.length > 2;
      }
    }
  ];

  // Check completion status
  useEffect(() => {
    const completionStatus = steps.reduce((acc, step) => {
      acc[step.id] = step.checkComplete();
      return acc;
    }, {} as Record<string, boolean>);
    
    setCompleted(completionStatus);
  }, [accounts, transactions]);

  // Auto-dismiss if all steps completed
  useEffect(() => {
    const allCompleted = steps.every(step => completed[step.id]);
    if (allCompleted && !dismissed) {
      // Delay dismissal to show completion state
      const timer = setTimeout(() => {
        setDismissed(true);
        track('onboarding_auto_complete');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [completed, dismissed]);

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleStartTour = (stepId: string) => {
    trackOnboardingStep(stepId, 'start_tour');
    onStartTour(stepId);
  };

  const handleSkip = () => {
    track('onboarding_skip');
    setDismissed(true);
    onClose?.();
  };

  const handleFinish = () => {
    track('onboarding_finish', { completed_steps: completedCount, total_steps: steps.length });
    setDismissed(true);
    onClose?.();
  };

  if (dismissed) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Get started with Balanze
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Complete these 3 steps to unlock your financial insights
            </p>
          </div>
        </div>
        <button
          onClick={handleSkip}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close onboarding"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress: {completedCount}/{steps.length} completed
          </span>
          <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-6">
        {steps.map((step, index) => {
          const isCompleted = completed[step.id];
          const StepIcon = step.icon;
          
          return (
            <div
              key={step.id}
              className={clsx(
                'flex items-center justify-between p-4 border rounded-lg transition-all duration-200',
                isCompleted
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-blue-300 dark:hover:border-blue-600'
              )}
            >
              <div className="flex items-center gap-4">
                <div className={clsx(
                  'p-2 rounded-lg',
                  isCompleted
                    ? 'bg-green-100 dark:bg-green-900/20'
                    : 'bg-blue-100 dark:bg-blue-900/20'
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <StepIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {step.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">
                    Done ✓
                  </span>
                ) : (
                  <>
                    <a
                      href={step.link}
                      className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      onClick={() => track('onboarding_step_link_click', { step: step.id })}
                    >
                      Go to {step.title.split(' ').pop()}
                    </a>
                    <button
                      className="px-3 py-1 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      onClick={() => handleStartTour(step.id)}
                    >
                      Guide me
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {completedCount === steps.length ? (
            <span className="text-green-600 dark:text-green-400 font-medium">
              🎉 All set! You're ready to manage your finances with Balanze.
            </span>
          ) : (
            `${steps.length - completedCount} step${steps.length - completedCount !== 1 ? 's' : ''} remaining`
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Skip for now
          </button>
          {completedCount === steps.length && (
            <button
              onClick={handleFinish}
              className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              Perfect! I'm ready
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

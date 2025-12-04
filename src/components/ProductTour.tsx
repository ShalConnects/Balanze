// src/components/ProductTour.tsx
import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, CallBackProps, Step } from 'react-joyride';
import { track, trackOnboardingStep } from '../lib/analytics';

interface ProductTourProps {
  stepToStart?: string | null;
  onClose?: () => void;
  isOpen?: boolean;
}

// Tour steps mapped to FinTrack/Balanze features
const TOUR_STEPS: Record<string, Step[]> = {
  'add-account': [
    {
      target: '[data-tour="add-account"]',
      content: 'Start here! Click this button to create your first financial account. You can add bank accounts, credit cards, cash wallets, or any account you want to track.',
      disableBeacon: true,
      placement: 'bottom'
    },
    {
      target: '[data-tour="account-form"]',
      content: 'Fill in your account details. Choose an account type, set the currency, and add an initial balance. Don\'t worry - you can always edit this later.',
      placement: 'right'
    }
  ],
  'add-transaction': [
    {
      target: '[data-tour="add-transaction"]',
      content: 'Now let\'s add your first transaction! Click here to record income or expenses. This is where you\'ll track all your financial activity.',
      disableBeacon: true,
      placement: 'bottom'
    },
    {
      target: '[data-tour="transaction-form"]',
      content: 'Choose whether it\'s income or expense, select the account, add an amount, and categorize it. Adding a description helps you remember what it was for.',
      placement: 'right'
    },
    {
      target: '[data-tour="transaction-categories"]',
      content: 'Categories help you understand where your money goes. We have common categories ready, or you can create custom ones that fit your lifestyle.',
      placement: 'left'
    }
  ],
  'view-analytics': [
    {
      target: '[data-tour="analytics-overview"]',
      content: 'Welcome to your financial command center! Here you can see your spending patterns, income trends, and account balances at a glance.',
      disableBeacon: true,
      placement: 'bottom'
    },
    {
      target: '[data-tour="spending-chart"]',
      content: 'This chart shows your spending by category. Watch how your habits change over time and identify areas where you might want to adjust.',
      placement: 'top'
    },
    {
      target: '[data-tour="balance-trend"]',
      content: 'Track your account balances over time. See if you\'re saving more, spending more, or maintaining steady finances.',
      placement: 'left'
    },
    {
      target: '[data-tour="export-data"]',
      content: 'Need your data elsewhere? You can export your transactions and reports for tax preparation or external analysis.',
      placement: 'top'
    }
  ],
  'general': [
    {
      target: '[data-tour="dashboard"]',
      content: 'Welcome to Balanze! This is your financial dashboard where you can see an overview of all your accounts and recent activity.',
      disableBeacon: true,
      placement: 'bottom'
    },
    {
      target: '[data-tour="navigation"]',
      content: 'Use this sidebar to navigate between different sections: Accounts, Transactions, Analytics, and more. Everything you need is just a click away.',
      placement: 'right'
    },
    {
      target: '[data-tour="quick-actions"]',
      content: 'These quick action buttons let you add transactions, create accounts, or transfer money without navigating away from the dashboard.',
      placement: 'left'
    },
    {
      target: '[data-tour="user-menu"]',
      content: 'Access your profile, settings, and help from here. You can also switch between light and dark modes to suit your preference.',
      placement: 'bottom-start'
    }
  ]
};

export default function ProductTour({ stepToStart = null, onClose, isOpen = false }: ProductTourProps) {
  // HIDDEN - Return null to hide component
  return null;
  
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [tourKey, setTourKey] = useState(0);

  useEffect(() => {
    if (isOpen && stepToStart) {
      const tourSteps = TOUR_STEPS[stepToStart] || TOUR_STEPS['general'];
      setSteps(tourSteps);
      setRun(true);
      setTourKey(prev => prev + 1); // Force re-render
      trackOnboardingStep(stepToStart, 'tour_start');
    } else if (isOpen && !stepToStart) {
      // Default general tour
      setSteps(TOUR_STEPS['general']);
      setRun(true);
      setTourKey(prev => prev + 1);
      trackOnboardingStep('general', 'tour_start');
    } else {
      setRun(false);
    }
  }, [stepToStart, isOpen]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;
    
    // Track tour events
    track('tour_event', { 
      status, 
      action, 
      index, 
      type, 
      step_id: stepToStart || 'general',
      timestamp: new Date().toISOString()
    });

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      trackOnboardingStep(stepToStart || 'general', status === STATUS.FINISHED ? 'tour_complete' : 'tour_skip');
      onClose?.();
    }
  };

  const joyrideStyles = {
    options: {
      zIndex: 10000,
      primaryColor: '#3B82F6', // Blue-500
    },
    tooltip: {
      borderRadius: '8px',
      fontSize: '14px',
    },
    tooltipContainer: {
      textAlign: 'left' as const,
    },
    tooltipTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1F2937', // Gray-800
    },
    tooltipContent: {
      padding: '12px 0',
      fontSize: '14px',
      lineHeight: '1.5',
      color: '#4B5563', // Gray-600
    },
    buttonNext: {
      backgroundColor: '#3B82F6', // Blue-500
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      padding: '8px 16px',
    },
    buttonBack: {
      color: '#6B7280', // Gray-500
      fontSize: '14px',
      fontWeight: '500',
      marginRight: '8px',
    },
    buttonSkip: {
      color: '#6B7280', // Gray-500
      fontSize: '14px',
      fontWeight: '500',
    },
    spotlight: {
      borderRadius: '4px',
    },
  };

  if (!run || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      key={tourKey}
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      disableCloseOnEsc={false}
      callback={handleJoyrideCallback}
      styles={joyrideStyles}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip tour',
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
}


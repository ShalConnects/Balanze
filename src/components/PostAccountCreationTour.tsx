import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, CallBackProps, Step } from 'react-joyride';
import { track } from '../lib/analytics';
import { useNavigate } from 'react-router-dom';
import { useMobileDetection } from '../hooks/useMobileDetection';


interface PostAccountCreationTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// Generate mobile-aware tour steps
const getTourSteps = (isMobile: boolean): Step[] => [
  {
    target: isMobile ? 'body' : '[data-tour="accounts-nav"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">🎉 Great! Your cash account is ready!</h3>
        <p>
          {isMobile 
            ? "Let's explore your accounts section. Click 'Next' and we'll take you to the accounts page. On mobile, you'll need to open the menu first."
            : "Let's explore your accounts section. Click 'Next' and we'll take you to the accounts page to set up your initial balance and add your first transaction."
          }
        </p>
        {isMobile && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>Mobile tip:</strong> Look for the menu button (☰) in the top-left to open the sidebar
            </p>
          </div>
        )}
      </div>
    ),
    disableBeacon: true,
    placement: isMobile ? 'center' : 'bottom',
    spotlightClicks: false,
  },
  {
    target: '[data-tour="edit-account"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">💰 Edit Your Account Balance</h3>
        <p>Click the pencil icon to set your initial cash balance. This helps us track your real starting amount accurately.</p>
        
        {/* Article link - smaller on mobile */}
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Read the guide:</p>
          <a 
            href="https://balanze.cash/kb/create-first-account"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-primary/30 text-gradient-primary rounded-lg hover:bg-gradient-primary/40 transition-colors text-sm font-medium"
          >
            How to Create Your First Account
            <svg className="w-4 h-4" fill="none" strokeWidth="2" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path stroke="url(#gradient1)" strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    ),
    placement: isMobile ? 'center' : 'left',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="add-transaction"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">📝 Add Your First Transaction</h3>
        <p>Finally, click the "+" button to add your first transaction! Record income, expenses, or transfers.</p>
        
        {/* Article link - smaller on mobile */}
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Read the guide:</p>
          <a 
            href="https://balanze.cash/kb/create-first-transaction"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-primary/30 text-gradient-primary rounded-lg hover:bg-gradient-primary/40 transition-colors text-sm font-medium"
          >
            How to Create Your First Transaction
            <svg className="w-4 h-4" fill="none" strokeWidth="2" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <path stroke="url(#gradient2)" strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    ),
    placement: isMobile ? 'center' : 'top',
    spotlightClicks: true,
  },
];

export default function PostAccountCreationTour({ 
  isOpen, 
  onClose, 
  onComplete 
}: PostAccountCreationTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const { isMobile } = useMobileDetection();

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setRun(true);
        track('post_account_tour_started');
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setRun(false);
      setStepIndex(0); // Reset step index
    }
  }, [isOpen]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;
    
    track('post_account_tour_event', { 
      status, 
      action, 
      index, 
      type,
      step: getTourSteps(isMobile)[index]?.target 
    });

    // Navigate to accounts page when moving from step 0 to step 1
    if (type === 'step:after' && action === 'next' && index === 0) {
      // Navigate to accounts page
      navigate('/accounts');
      track('tour_navigated_to_accounts');
      
      // Small delay to let the navigation complete before showing next step
      setTimeout(() => {
        setStepIndex(1);
      }, 500);
      return; // Don't update stepIndex immediately
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      track('post_account_tour_completed', { 
        completed: status === STATUS.FINISHED,
        skipped: status === STATUS.SKIPPED 
      });
      
      if (status === STATUS.FINISHED) {
        onComplete();
      }
      onClose();
    } else if (type === 'step:after') {
      setStepIndex(index + (action === 'prev' ? -1 : 1));
    }
  };

  if (!isOpen) return null;

  return (
    <Joyride
      steps={getTourSteps(isMobile)}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleJoyrideCallback}
      stepIndex={stepIndex}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#10b981', // Green to match success theme
        },
        tooltip: {
          borderRadius: 12,
          fontSize: isMobile ? 16 : 14, // Larger text on mobile
          maxWidth: isMobile ? '90vw' : '400px', // Responsive width
        },
        tooltipContent: {
          padding: isMobile ? '16px' : '20px', // Smaller padding on mobile
        },
        buttonNext: {
          backgroundColor: '#10b981',
          borderRadius: 8,
          fontSize: isMobile ? 16 : 14, // Larger buttons on mobile
          fontWeight: 600,
          padding: isMobile ? '12px 20px' : '8px 16px', // Larger touch targets
        },
        buttonBack: {
          color: '#6b7280',
          fontSize: isMobile ? 16 : 14,
          padding: isMobile ? '12px 20px' : '8px 16px',
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: isMobile ? 16 : 14,
          padding: isMobile ? '12px 20px' : '8px 16px',
        },
      }}
      locale={{
        back: '← Back',
        close: '✕',
        last: 'Finish Tour',
        next: 'Next →',
        skip: 'Skip Tour',
      }}
    />
  );
}


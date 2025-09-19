import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, CallBackProps, Step } from 'react-joyride';
import { track } from '../lib/analytics';
import { useFinanceStore } from '../store/useFinanceStore';


interface PostAccountCreationTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function PostAccountCreationTour({ 
  isOpen, 
  onClose, 
  onComplete 
}: PostAccountCreationTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const { currentView } = useFinanceStore();

  // Generate dynamic steps based on current view
  const getDynamicSteps = (): Step[] => {
    const baseSteps: Step[] = [
      {
        target: '[data-tour="accounts-nav"]',
        content: (
          <div>
            <h3 className="font-semibold mb-2">🎉 Great! Your cash account is ready!</h3>
            <p>Let's explore your accounts section. Click here to view and manage all your financial accounts.</p>
          </div>
        ),
        disableBeacon: true,
        placement: 'bottom',
        spotlightClicks: true,
      }
    ];

    // If user is not in accounts view, guide them there first
    if (currentView !== 'accounts') {
      baseSteps.push({
        target: '[data-tour="accounts-nav"]',
        content: (
          <div>
            <h3 className="font-semibold mb-2">📍 Navigate to Accounts</h3>
            <p>Click on the "Accounts" button in the sidebar to view your accounts. Once you're there, we'll show you the next steps!</p>
          </div>
        ),
        placement: 'bottom',
        spotlightClicks: true,
      });
    }

    // Add account-specific steps if user is in accounts view
    if (currentView === 'accounts') {
      baseSteps.push(
        {
          target: '[data-tour="edit-account"]',
          content: (
            <div>
              <h3 className="font-semibold mb-2">💰 Set your initial balance</h3>
              <p>Click the edit button (pencil icon) to add your current cash amount. This helps us track your real starting balance.</p>
            </div>
          ),
          placement: 'left',
          spotlightClicks: true,
        },
        {
          target: '[data-tour="add-transaction"]',
          content: (
            <div>
              <h3 className="font-semibold mb-2">📝 Add your first transaction</h3>
              <p>Finally, click the "+" button to add your first transaction! Record income, expenses, or transfers. This is where the magic happens!</p>
            </div>
          ),
          placement: 'top',
          spotlightClicks: true,
        }
      );
    }

    return baseSteps;
  };

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
    }
  }, [isOpen]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;
    
    track('post_account_tour_event', { 
      status, 
      action, 
      index, 
      type,
      step: POST_ACCOUNT_TOUR_STEPS[index]?.target 
    });

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
      steps={getDynamicSteps()}
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
          fontSize: 14,
        },
        tooltipContent: {
          padding: '20px',
        },
        buttonNext: {
          backgroundColor: '#10b981',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
        },
        buttonBack: {
          color: '#6b7280',
          fontSize: 14,
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: 14,
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

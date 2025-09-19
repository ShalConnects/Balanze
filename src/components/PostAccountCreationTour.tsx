import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, CallBackProps, Step } from 'react-joyride';
import { track } from '../lib/analytics';
import { useNavigate } from 'react-router-dom';


interface PostAccountCreationTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// Tour steps with navigation and GIF demonstrations
const TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="accounts-nav"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">🎉 Great! Your cash account is ready!</h3>
        <p>Let's explore your accounts section. Click "Next" and we'll take you to the accounts page to set up your initial balance and add your first transaction.</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'bottom',
    spotlightClicks: false, // Don't allow clicking during tour
  },
  {
    target: '[data-tour="edit-account"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">💰 Edit Your Account Balance</h3>
        <p>Click the pencil icon to set your initial cash balance. This helps us track your real starting amount accurately.</p>
        
        {/* GIF demonstration */}
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Watch how to do it:</p>
          <img 
            src="/static/placeholders/onboarding-gifs/step1.gif" 
            alt="How to edit account balance - click pencil icon and update initial balance"
            className="w-full max-w-xs mx-auto rounded border"
            style={{ maxHeight: '150px', objectFit: 'contain' }}
          />
        </div>
      </div>
    ),
    placement: 'left',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="add-transaction"]',
    content: (
      <div>
        <h3 className="font-semibold mb-2">📝 Add Your First Transaction</h3>
        <p>Finally, click the "+" button to add your first transaction! Record income, expenses, or transfers.</p>
        
        {/* GIF demonstration */}
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">See how easy it is:</p>
          <img 
            src="/static/placeholders/onboarding-gifs/step2.gif" 
            alt="How to add a transaction - click plus button and fill in details"
            className="w-full max-w-xs mx-auto rounded border"
            style={{ maxHeight: '150px', objectFit: 'contain' }}
          />
        </div>
      </div>
    ),
    placement: 'top',
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
      step: TOUR_STEPS[index]?.target 
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
      steps={TOUR_STEPS}
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

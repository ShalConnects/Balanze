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
const getTourSteps = (): Step[] => [
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
    target: 'body', // Use body as fallback until we're sure the elements exist
    content: (
      <div>
        <h3 className="font-semibold mb-2">💰 Edit Your Account Balance</h3>
        <p>Click the pencil icon to set your initial cash balance. This helps us track your real starting amount accurately.</p>
        
        {/* GIF demonstration */}
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Watch how to do it:</p>
          <div className="w-full max-w-xs mx-auto">
            <img 
              src="/static/placeholders/onboarding-gifs/step1.svg" 
              alt="How to edit account balance - click pencil icon and update initial balance"
              className="w-full rounded border"
              style={{ maxHeight: '150px', objectFit: 'contain' }}
              onError={(e) => {
                // Hide the image and show placeholder text if SVG doesn't exist
                e.currentTarget.style.display = 'none';
                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'block';
              }}
            />
            <div 
              className="hidden text-center py-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded border-2 border-dashed border-gray-300 dark:border-gray-600"
              style={{ display: 'none' }}
            >
              📹 GIF placeholder<br />
              <span className="text-xs">Record a demo of editing account balance</span>
            </div>
          </div>
        </div>
      </div>
    ),
    placement: 'center',
    spotlightClicks: true,
  },
  {
    target: 'body', // Use body as fallback
    content: (
      <div>
        <h3 className="font-semibold mb-2">📝 Add Your First Transaction</h3>
        <p>Finally, click the "+" button to add your first transaction! Record income, expenses, or transfers.</p>
        
        {/* GIF demonstration */}
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">See how easy it is:</p>
          <div className="w-full max-w-xs mx-auto">
            <img 
              src="/static/placeholders/onboarding-gifs/step2.svg" 
              alt="How to add a transaction - click plus button and fill in details"
              className="w-full rounded border"
              style={{ maxHeight: '150px', objectFit: 'contain' }}
              onError={(e) => {
                // Hide the image and show placeholder text if SVG doesn't exist
                e.currentTarget.style.display = 'none';
                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'block';
              }}
            />
            <div 
              className="hidden text-center py-4 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded border-2 border-dashed border-gray-300 dark:border-gray-600"
              style={{ display: 'none' }}
            >
              📹 GIF placeholder<br />
              <span className="text-xs">Record a demo of adding a transaction</span>
            </div>
          </div>
        </div>
      </div>
    ),
    placement: 'center',
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
      // Small delay to ensure UI is ready and DOM elements exist
      const timer = setTimeout(() => {
        // Check if the target element exists before starting the tour
        const firstTarget = document.querySelector('[data-tour="accounts-nav"]');
        if (firstTarget) {
          setRun(true);
          track('post_account_tour_started');
        } else {
          console.warn('Tour target not found, retrying in 1 second...');
          // Retry after another second
          setTimeout(() => {
            setRun(true);
            track('post_account_tour_started');
          }, 1000);
        }
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
      step: getTourSteps()[index]?.target 
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

  // Error boundary wrapper
  try {
    return (
      <Joyride
        steps={getTourSteps()}
        run={run}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        stepIndex={stepIndex}
        disableCloseOnEsc={false}
        disableOverlayClose={false}
        hideCloseButton={false}
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
  } catch (error) {
    console.error('Tour component error:', error);
    // Fallback UI or close tour
    onClose();
    return null;
  }
}

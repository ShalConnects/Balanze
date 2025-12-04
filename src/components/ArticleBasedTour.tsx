// src/components/ArticleBasedTour.tsx
import { useState, useEffect } from 'react';
import Joyride, { STATUS, CallBackProps, Step } from 'react-joyride';
import { track, trackOnboardingStep } from '../lib/analytics';
import { MOCK_ARTICLES } from '../pages/KBArticlePage';

interface ArticleBasedTourProps {
  articleSlug?: string;
  onClose?: () => void;
  isOpen?: boolean;
  customSteps?: Step[];
}

interface TourStep {
  target: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  disableBeacon?: boolean;
}

// Extract tour steps from article content
function extractTourStepsFromArticle(article: any): TourStep[] {
  const steps: TourStep[] = [];
  
  if (!article?.content) return steps;

  // Look for tour step markers in article content
  const tourStepRegex = /data-tour-step="([^"]+)"[^>]*>([^<]+)<\/[^>]*>/g;
  let match;
  
  while ((match = tourStepRegex.exec(article.content)) !== null) {
    const [, target, content] = match;
    steps.push({
      target: `[data-tour="${target}"]`,
      content: content.trim(),
      placement: 'bottom',
      disableBeacon: steps.length === 0
    });
  }

  // If no explicit tour steps found, create default tour steps based on article type
  if (steps.length === 0) {
    // First step - point to the tour card itself or help center content
    steps.push({
      target: 'body', // Use body as fallback target
      content: `Welcome to the tour for: ${article.title}. This interactive guide will help you get started with Balanze.`,
      placement: 'auto',
      disableBeacon: true
    });

    // Add specific tour steps based on article slug
    if (article.slug === 'getting-started-guide') {
      steps.push({
        target: 'body',
        content: 'To get started, you\'ll need to: 1) Create your first account, 2) Add your first transaction, 3) Explore your dashboard. Let\'s navigate to the accounts page to begin!',
        placement: 'auto'
      });
      steps.push({
        target: 'body',
        content: 'Click on "Accounts" in the sidebar to create your first account, or use the quick action buttons on the dashboard.',
        placement: 'auto'
      });
    } else if (article.slug === 'create-first-account') {
      steps.push({
        target: 'body',
        content: 'To create your first account: 1) Go to the Accounts page, 2) Click "Add Account", 3) Choose account type, 4) Fill in details and save.',
        placement: 'auto'
      });
    } else if (article.slug === 'create-first-transaction') {
      steps.push({
        target: 'body',
        content: 'To add your first transaction: 1) Go to the Transactions page, 2) Click "Add Transaction", 3) Select income/expense, 4) Enter amount and details.',
        placement: 'auto'
      });
    } else if (article.slug === 'analytics-overview') {
      steps.push({
        target: 'body',
        content: 'To explore analytics: 1) Go to the Analytics page, 2) View your spending patterns, 3) Check trends and insights, 4) Export data if needed.',
        placement: 'auto'
      });
    } else {
      // Generic tour step for other articles
      steps.push({
        target: 'body',
        content: `This tour will help you understand: ${article.title}. Navigate to the relevant page to follow along with the guide.`,
        placement: 'auto'
      });
    }
  }

  return steps;
}

// Generate tour steps from article content
function generateTourFromArticle(articleSlug: string): Step[] {
  console.log('ArticleBasedTour: Looking for article:', articleSlug);
  console.log('ArticleBasedTour: Available articles:', Object.keys(MOCK_ARTICLES));
  const article = MOCK_ARTICLES[articleSlug];
  console.log('ArticleBasedTour: Found article:', article);
  if (!article) {
    console.log('ArticleBasedTour: Article not found for slug:', articleSlug);
    return [];
  }

  const tourSteps = extractTourStepsFromArticle(article);
  
  return tourSteps.map((step) => ({
    target: step.target,
    content: step.content,
    placement: step.placement || 'bottom',
    disableBeacon: step.disableBeacon || false,
    styles: {
      options: {
        zIndex: 10000,
        primaryColor: '#3B82F6',
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
        color: '#1F2937',
      },
      tooltipContent: {
        padding: '12px 0',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#4B5563',
      },
      buttonNext: {
        backgroundColor: '#3B82F6',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        padding: '8px 16px',
      },
      buttonBack: {
        color: '#6B7280',
        fontSize: '14px',
        fontWeight: '500',
        marginRight: '8px',
      },
      buttonSkip: {
        color: '#6B7280',
        fontSize: '14px',
        fontWeight: '500',
      },
      spotlight: {
        borderRadius: '4px',
      },
    }
  }));
}

export default function ArticleBasedTour({ 
  articleSlug, 
  onClose, 
  isOpen = false, 
  customSteps 
}: ArticleBasedTourProps) {
  // HIDDEN - Return null to hide component
  return null;
  
  console.log('ArticleBasedTour: Component props:', { articleSlug, isOpen, customSteps });
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [tourKey, setTourKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      let tourSteps: Step[] = [];
      
      if (customSteps && customSteps.length > 0) {
        tourSteps = customSteps;
      } else if (articleSlug) {
        tourSteps = generateTourFromArticle(articleSlug);
        console.log('ArticleBasedTour: Generated steps for', articleSlug, tourSteps);
      }
      
      if (tourSteps.length > 0) {
        setSteps(tourSteps);
        setRun(true);
        setTourKey(prev => prev + 1);
        trackOnboardingStep(articleSlug || 'article-tour', 'tour_start');
        console.log('ArticleBasedTour: Starting tour with', tourSteps.length, 'steps');
      } else {
        console.log('ArticleBasedTour: No tour steps found for', articleSlug);
        setRun(false);
      }
    } else {
      setRun(false);
    }
  }, [isOpen, articleSlug, customSteps]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;
    
    // Track tour events
    track('article_tour_event', { 
      status, 
      action, 
      index, 
      type, 
      article_slug: articleSlug || 'custom',
      timestamp: new Date().toISOString()
    });

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      trackOnboardingStep(articleSlug || 'article-tour', status === STATUS.FINISHED ? 'tour_complete' : 'tour_skip');
      onClose?.();
    }
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

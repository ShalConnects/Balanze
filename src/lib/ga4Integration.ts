// Google Analytics 4 Integration for SEO and Help Center Tracking
// Tracks user behavior, content performance, and SEO metrics

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export interface GA4Event {
  event_name: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

export interface GA4Config {
  measurementId: string;
  debug?: boolean;
  anonymizeIp?: boolean;
  cookieDomain?: string;
}

// Default GA4 configuration
const DEFAULT_CONFIG: GA4Config = {
  measurementId: 'G-XXXXXXXXXX', // Replace with your actual GA4 Measurement ID
  debug: import.meta.env.DEV,
  anonymizeIp: true,
  cookieDomain: 'auto'
};

class GA4Tracker {
  private config: GA4Config;
  private isInitialized: boolean = false;

  constructor(config: Partial<GA4Config> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Initialize GA4
  initialize(): void {
    if (this.isInitialized) return;

    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    // Configure GA4
    window.gtag('js', new Date());
    window.gtag('config', this.config.measurementId, {
      debug_mode: this.config.debug,
      anonymize_ip: this.config.anonymizeIp,
      cookie_domain: this.config.cookieDomain
    });

    this.isInitialized = true;
    
    if (this.config.debug) {
      console.log('🔍 GA4 initialized with config:', this.config);
    }
  }

  // Track page views
  trackPageView(pagePath: string, pageTitle?: string): void {
    if (!this.isInitialized) this.initialize();

    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href
    });

    if (this.config.debug) {
      console.log('📊 GA4 Page View:', { pagePath, pageTitle });
    }
  }

  // Track help center article views
  trackArticleView(articleSlug: string, articleTitle: string, category: string, readTime: string): void {
    this.trackEvent('article_view', {
      event_category: 'Help Center',
      event_label: articleSlug,
      custom_parameters: {
        article_title: articleTitle,
        article_category: category,
        read_time: readTime,
        article_slug: articleSlug
      }
    });
  }

  // Track internal link clicks
  trackInternalLinkClick(sourceSlug: string, targetSlug: string, linkText: string, linkContext: string): void {
    this.trackEvent('internal_link_click', {
      event_category: 'SEO',
      event_label: `${sourceSlug} -> ${targetSlug}`,
      custom_parameters: {
        source_article: sourceSlug,
        target_article: targetSlug,
        link_text: linkText,
        link_context: linkContext
      }
    });
  }

  // Track search queries
  trackSearchQuery(query: string, resultsCount: number, category?: string): void {
    this.trackEvent('search', {
      event_category: 'Help Center',
      event_label: query,
      value: resultsCount,
      custom_parameters: {
        search_term: query,
        results_count: resultsCount,
        search_category: category || 'all'
      }
    });
  }

  // Track time on page
  trackTimeOnPage(pageSlug: string, timeSpent: number): void {
    this.trackEvent('time_on_page', {
      event_category: 'Engagement',
      event_label: pageSlug,
      value: timeSpent,
      custom_parameters: {
        page_slug: pageSlug,
        time_spent_seconds: timeSpent
      }
    });
  }

  // Track bounce rate
  trackBounce(pageSlug: string, timeSpent: number): void {
    this.trackEvent('bounce', {
      event_category: 'Engagement',
      event_label: pageSlug,
      value: timeSpent,
      custom_parameters: {
        page_slug: pageSlug,
        time_spent_seconds: timeSpent
      }
    });
  }

  // Track content engagement
  trackContentEngagement(contentType: string, contentId: string, engagementType: string): void {
    this.trackEvent('content_engagement', {
      event_category: 'Content',
      event_label: `${contentType}_${engagementType}`,
      custom_parameters: {
        content_type: contentType,
        content_id: contentId,
        engagement_type: engagementType
      }
    });
  }

  // Track SEO events
  trackSEOEvent(eventType: string, details: Record<string, any>): void {
    this.trackEvent('seo_event', {
      event_category: 'SEO',
      event_label: eventType,
      custom_parameters: details
    });
  }

  // Track user journey
  trackUserJourney(step: string, stepNumber: number, totalSteps: number): void {
    this.trackEvent('user_journey', {
      event_category: 'User Experience',
      event_label: step,
      value: stepNumber,
      custom_parameters: {
        journey_step: step,
        step_number: stepNumber,
        total_steps: totalSteps
      }
    });
  }

  // Track conversion events
  trackConversion(conversionType: string, value?: number, currency?: string): void {
    this.trackEvent('conversion', {
      event_category: 'Conversion',
      event_label: conversionType,
      value: value,
      custom_parameters: {
        conversion_type: conversionType,
        currency: currency || 'USD'
      }
    });
  }

  // Generic event tracking
  trackEvent(eventName: string, eventData: Partial<GA4Event>): void {
    if (!this.isInitialized) this.initialize();

    const eventPayload: any = {
      event: eventName,
      ...eventData
    };

    window.gtag('event', eventName, eventPayload);

    if (this.config.debug) {
      console.log('📈 GA4 Event:', eventName, eventPayload);
    }
  }

  // Set user properties
  setUserProperties(properties: Record<string, any>): void {
    if (!this.isInitialized) this.initialize();

    window.gtag('config', this.config.measurementId, {
      user_properties: properties
    });

    if (this.config.debug) {
      console.log('👤 GA4 User Properties:', properties);
    }
  }

  // Set custom dimensions
  setCustomDimensions(dimensions: Record<string, any>): void {
    if (!this.isInitialized) this.initialize();

    window.gtag('config', this.config.measurementId, {
      custom_map: dimensions
    });

    if (this.config.debug) {
      console.log('📏 GA4 Custom Dimensions:', dimensions);
    }
  }

  // Track scroll depth
  trackScrollDepth(pageSlug: string, scrollDepth: number): void {
    this.trackEvent('scroll_depth', {
      event_category: 'Engagement',
      event_label: pageSlug,
      value: scrollDepth,
      custom_parameters: {
        page_slug: pageSlug,
        scroll_depth_percentage: scrollDepth
      }
    });
  }

  // Track form interactions
  trackFormInteraction(formName: string, action: string, fieldName?: string): void {
    this.trackEvent('form_interaction', {
      event_category: 'Forms',
      event_label: `${formName}_${action}`,
      custom_parameters: {
        form_name: formName,
        action: action,
        field_name: fieldName
      }
    });
  }

  // Track error events
  trackError(errorType: string, errorMessage: string, pageSlug?: string): void {
    this.trackEvent('error', {
      event_category: 'Errors',
      event_label: errorType,
      custom_parameters: {
        error_type: errorType,
        error_message: errorMessage,
        page_slug: pageSlug
      }
    });
  }
}

// Create singleton instance
export const ga4Tracker = new GA4Tracker();

// Helper functions for easy integration
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  ga4Tracker.trackPageView(pagePath, pageTitle);
};

export const trackArticleView = (articleSlug: string, articleTitle: string, category: string, readTime: string) => {
  ga4Tracker.trackArticleView(articleSlug, articleTitle, category, readTime);
};

export const trackInternalLinkClick = (sourceSlug: string, targetSlug: string, linkText: string, linkContext: string) => {
  ga4Tracker.trackInternalLinkClick(sourceSlug, targetSlug, linkText, linkContext);
};

export const trackSearchQuery = (query: string, resultsCount: number, category?: string) => {
  ga4Tracker.trackSearchQuery(query, resultsCount, category);
};

export const trackTimeOnPage = (pageSlug: string, timeSpent: number) => {
  ga4Tracker.trackTimeOnPage(pageSlug, timeSpent);
};

export const trackBounce = (pageSlug: string, timeSpent: number) => {
  ga4Tracker.trackBounce(pageSlug, timeSpent);
};

export const trackContentEngagement = (contentType: string, contentId: string, engagementType: string) => {
  ga4Tracker.trackContentEngagement(contentType, contentId, engagementType);
};

export const trackSEOEvent = (eventType: string, details: Record<string, any>) => {
  ga4Tracker.trackSEOEvent(eventType, details);
};

export const trackUserJourney = (step: string, stepNumber: number, totalSteps: number) => {
  ga4Tracker.trackUserJourney(step, stepNumber, totalSteps);
};

export const trackConversion = (conversionType: string, value?: number, currency?: string) => {
  ga4Tracker.trackConversion(conversionType, value, currency);
};

export const trackScrollDepth = (pageSlug: string, scrollDepth: number) => {
  ga4Tracker.trackScrollDepth(pageSlug, scrollDepth);
};

export const trackFormInteraction = (formName: string, action: string, fieldName?: string) => {
  ga4Tracker.trackFormInteraction(formName, action, fieldName);
};

export const trackError = (errorType: string, errorMessage: string, pageSlug?: string) => {
  ga4Tracker.trackError(errorType, errorMessage, pageSlug);
};

// Initialize GA4 on app start
export const initializeGA4 = (config?: Partial<GA4Config>) => {
  if (config) {
    Object.assign(ga4Tracker, new GA4Tracker(config));
  }
  ga4Tracker.initialize();
};

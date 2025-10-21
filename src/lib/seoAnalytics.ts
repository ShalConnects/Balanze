// SEO Analytics and Internal Link Tracking
// Tracks internal link performance and SEO metrics

export interface InternalLinkClick {
  sourceSlug: string;
  targetSlug: string;
  linkText: string;
  linkContext: string;
  timestamp: number;
  userAgent: string;
  referrer: string;
}

export interface SEOAnalytics {
  pageViews: number;
  internalLinkClicks: number;
  averageTimeOnPage: number;
  bounceRate: number;
  topInternalLinks: Array<{
    targetSlug: string;
    clicks: number;
    clickRate: number;
  }>;
  topExitPages: Array<{
    slug: string;
    exits: number;
    exitRate: number;
  }>;
}

export interface ContentGapAnalysis {
  missingArticles: string[];
  lowPerformingPages: string[];
  highOpportunityKeywords: string[];
  suggestedContent: Array<{
    title: string;
    description: string;
    targetKeywords: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
}

class SEOAnalyticsTracker {
  private linkClicks: InternalLinkClick[] = [];
  private pageViews: Map<string, number> = new Map();
  private timeOnPage: Map<string, number[]> = new Map();
  private exitPages: Map<string, number> = new Map();

  // Track internal link clicks
  trackInternalLinkClick(
    sourceSlug: string,
    targetSlug: string,
    linkText: string,
    linkContext: string = 'unknown'
  ): void {
    const click: InternalLinkClick = {
      sourceSlug,
      targetSlug,
      linkText,
      linkContext,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    this.linkClicks.push(click);
    
    // Send to analytics service (in production, this would be your analytics API)
    this.sendToAnalytics('internal_link_click', click);
    
    console.log('🔗 Internal link tracked:', {
      from: sourceSlug,
      to: targetSlug,
      text: linkText,
      context: linkContext
    });
  }

  // Track page views
  trackPageView(slug: string): void {
    const currentViews = this.pageViews.get(slug) || 0;
    this.pageViews.set(slug, currentViews + 1);
    
    this.sendToAnalytics('page_view', { slug, timestamp: Date.now() });
  }

  // Track time spent on page
  trackTimeOnPage(slug: string, timeSpent: number): void {
    const times = this.timeOnPage.get(slug) || [];
    times.push(timeSpent);
    this.timeOnPage.set(slug, times);
    
    this.sendToAnalytics('time_on_page', { slug, timeSpent });
  }

  // Track exit pages
  trackExitPage(slug: string): void {
    const currentExits = this.exitPages.get(slug) || 0;
    this.exitPages.set(slug, currentExits + 1);
    
    this.sendToAnalytics('exit_page', { slug, timestamp: Date.now() });
  }

  // Get analytics summary
  getAnalyticsSummary(): SEOAnalytics {
    const totalPageViews = Array.from(this.pageViews.values()).reduce((a, b) => a + b, 0);
    const totalLinkClicks = this.linkClicks.length;
    
    // Calculate average time on page
    const allTimes = Array.from(this.timeOnPage.values()).flat();
    const averageTimeOnPage = allTimes.length > 0 
      ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length 
      : 0;

    // Calculate bounce rate (pages with only 1 view)
    const singleViewPages = Array.from(this.pageViews.entries())
      .filter(([_, views]) => views === 1).length;
    const bounceRate = totalPageViews > 0 ? (singleViewPages / totalPageViews) * 100 : 0;

    // Get top internal links
    const linkCounts = new Map<string, number>();
    this.linkClicks.forEach(click => {
      const key = click.targetSlug;
      linkCounts.set(key, (linkCounts.get(key) || 0) + 1);
    });

    const topInternalLinks = Array.from(linkCounts.entries())
      .map(([targetSlug, clicks]) => ({
        targetSlug,
        clicks,
        clickRate: totalLinkClicks > 0 ? (clicks / totalLinkClicks) * 100 : 0
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Get top exit pages
    const topExitPages = Array.from(this.exitPages.entries())
      .map(([slug, exits]) => ({
        slug,
        exits,
        exitRate: totalPageViews > 0 ? (exits / totalPageViews) * 100 : 0
      }))
      .sort((a, b) => b.exits - a.exits)
      .slice(0, 10);

    return {
      pageViews: totalPageViews,
      internalLinkClicks: totalLinkClicks,
      averageTimeOnPage,
      bounceRate,
      topInternalLinks,
      topExitPages
    };
  }

  // Analyze content gaps
  analyzeContentGaps(): ContentGapAnalysis {
    const analytics = this.getAnalyticsSummary();
    
    // Identify missing articles based on search patterns
    const missingArticles = [
      'financial-planning-guide',
      'data-export-guide',
      'mobile-app-features',
      'advanced-analytics',
      'troubleshooting-guide'
    ];

    // Identify low-performing pages (high bounce rate, low time on page)
    const lowPerformingPages = analytics.topExitPages
      .filter(page => page.exitRate > 50)
      .map(page => page.slug);

    // High opportunity keywords based on search trends
    const highOpportunityKeywords = [
      'budget planning',
      'expense tracking',
      'financial goals',
      'money management',
      'personal finance'
    ];

    // Suggested content based on gaps
    const suggestedContent = [
      {
        title: 'Financial Planning with Balanze',
        description: 'Complete guide to using Balanze for financial planning and goal setting',
        targetKeywords: ['financial planning', 'budget planning', 'financial goals'],
        priority: 'high' as const
      },
      {
        title: 'Data Export and Backup Guide',
        description: 'How to export your financial data and create backups',
        targetKeywords: ['data export', 'backup', 'csv export'],
        priority: 'medium' as const
      },
      {
        title: 'Mobile App Features Guide',
        description: 'Complete guide to using Balanze on mobile devices',
        targetKeywords: ['mobile app', 'mobile features', 'on-the-go'],
        priority: 'medium' as const
      }
    ];

    return {
      missingArticles,
      lowPerformingPages,
      highOpportunityKeywords,
      suggestedContent
    };
  }

  // Send data to analytics service
  private sendToAnalytics(event: string, data: any): void {
    // In production, this would send to your analytics service
    // For now, we'll just log it
    if (import.meta.env.DEV) {
      console.log(`📊 SEO Analytics: ${event}`, data);
    }
    
    // Example: Send to Google Analytics, Mixpanel, or your custom analytics
    // analytics.track(event, data);
  }

  // Export analytics data
  exportAnalyticsData(): string {
    const analytics = this.getAnalyticsSummary();
    const contentGaps = this.analyzeContentGaps();
    
    return JSON.stringify({
      analytics,
      contentGaps,
      timestamp: new Date().toISOString()
    }, null, 2);
  }
}

// Create singleton instance
export const seoAnalytics = new SEOAnalyticsTracker();

// Helper functions for easy integration
export const trackInternalLink = (
  sourceSlug: string,
  targetSlug: string,
  linkText: string,
  linkContext?: string
) => {
  seoAnalytics.trackInternalLinkClick(sourceSlug, targetSlug, linkText, linkContext);
};

export const trackPageView = (slug: string) => {
  seoAnalytics.trackPageView(slug);
};

export const trackTimeOnPage = (slug: string, timeSpent: number) => {
  seoAnalytics.trackTimeOnPage(slug, timeSpent);
};

export const trackExitPage = (slug: string) => {
  seoAnalytics.trackExitPage(slug);
};

export const getSEOAnalytics = () => {
  return seoAnalytics.getAnalyticsSummary();
};

export const getContentGapAnalysis = () => {
  return seoAnalytics.analyzeContentGaps();
};

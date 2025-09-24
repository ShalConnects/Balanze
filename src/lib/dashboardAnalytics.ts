/**
 * Analytics tracking for the Finance Dashboard
 * Minimal PII collection with focus on UX insights
 */

interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

interface DashboardAnalytics {
  track: (event: string, properties?: Record<string, any>) => void;
  flush: () => Promise<void>;
  getSessionId: () => string;
}

class DashboardAnalyticsImpl implements DashboardAnalytics {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly MAX_EVENTS = 50;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startAutoFlush();
  }

  private generateSessionId(): string {
    return `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, this.FLUSH_INTERVAL);
  }

  track(event: string, properties: Record<string, any> = {}): void {
    // Sanitize properties to remove PII
    const sanitizedProperties = this.sanitizeProperties(properties);
    
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...sanitizedProperties,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        user_agent: navigator.userAgent.substring(0, 100), // Truncated
        page_url: window.location.pathname, // No query params
        referrer: document.referrer ? new URL(document.referrer).hostname : null
      },
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.events.push(analyticsEvent);

    // Auto-flush if we have too many events
    if (this.events.length >= this.MAX_EVENTS) {
      this.flush();
    }
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    // Whitelist of allowed property keys (no PII)
    const allowedKeys = [
      'kpi_type', 'chart_filter', 'goal_action', 'alert_id', 'action',
      'suggestion', 'goal_id', 'expanded', 'view_mode', 'sort_by',
      'category', 'amount_range', 'time_period', 'insight_type',
      'error_type', 'feature_used', 'interaction_type'
    ];

    Object.keys(properties).forEach(key => {
      if (allowedKeys.includes(key)) {
        let value = properties[key];
        
        // Sanitize specific values
        if (typeof value === 'string') {
          value = value.substring(0, 100); // Truncate long strings
        } else if (typeof value === 'number') {
          // Round numbers to avoid precise financial amounts
          if (key.includes('amount')) {
            value = Math.round(value / 1000) * 1000; // Round to nearest 1000
          }
        }
        
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // In a real implementation, you'd send to your analytics endpoint
      await fetch('/api/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToSend,
          client_info: {
            dashboard_version: '1.0.0',
            timestamp: Date.now()
          }
        })
      });

      console.log(`Flushed ${eventsToSend.length} analytics events`);
    } catch (error) {
      console.warn('Failed to send analytics events:', error);
      // Re-add events back to queue for retry (with limit)
      if (this.events.length < this.MAX_EVENTS) {
        this.events.unshift(...eventsToSend.slice(0, this.MAX_EVENTS - this.events.length));
      }
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  // Clean up resources
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(); // Final flush
  }
}

// Singleton instance
let analyticsInstance: DashboardAnalyticsImpl | null = null;

export const getDashboardAnalytics = (): DashboardAnalytics => {
  if (!analyticsInstance) {
    analyticsInstance = new DashboardAnalyticsImpl();
  }
  return analyticsInstance;
};

// Predefined event types for type safety
export const AnalyticsEvents = {
  // KPI interactions
  KPI_CLICK: 'kpi_click',
  KPI_HOVER: 'kpi_hover',
  
  // Chart interactions
  CHART_FILTER: 'chart_filter',
  CHART_ZOOM: 'chart_zoom',
  CHART_EXPORT: 'chart_export',
  
  // Goal interactions
  GOAL_ACTION: 'goal_action',
  GOAL_CREATE: 'goal_create',
  GOAL_UPDATE: 'goal_update',
  
  // Alert interactions
  ALERT_DISMISS: 'alert_dismiss',
  ALERT_ACTION: 'alert_action',
  
  // Insight interactions
  INSIGHT_ACCEPT: 'insight_accept',
  INSIGHT_DISMISS: 'insight_dismiss',
  INSIGHT_EXPAND: 'insight_expand',
  
  // Navigation
  MONEY_FLOW_TOGGLE: 'money_flow_toggle',
  SECTION_EXPAND: 'section_expand',
  
  // Mobile interactions
  MOBILE_SWIPE: 'mobile_swipe',
  MOBILE_ACTION: 'mobile_action',
  
  // Errors
  CHART_ERROR: 'chart_error',
  DATA_ERROR: 'data_error',
  
  // Performance
  DASHBOARD_LOAD: 'dashboard_load',
  CHART_RENDER: 'chart_render'
} as const;

// Helper functions for common tracking scenarios
export const trackDashboardLoad = (loadTime: number) => {
  getDashboardAnalytics().track(AnalyticsEvents.DASHBOARD_LOAD, {
    load_time: loadTime,
    feature_used: 'dashboard'
  });
};

export const trackKPIInteraction = (kpiType: string, interactionType: 'click' | 'hover' = 'click') => {
  getDashboardAnalytics().track(
    interactionType === 'click' ? AnalyticsEvents.KPI_CLICK : AnalyticsEvents.KPI_HOVER,
    {
      kpi_type: kpiType,
      interaction_type: interactionType
    }
  );
};

export const trackChartInteraction = (chartType: string, action: string, details?: Record<string, any>) => {
  getDashboardAnalytics().track(AnalyticsEvents.CHART_FILTER, {
    chart_type: chartType,
    action,
    ...details
  });
};

export const trackGoalAction = (goalId: string, action: string) => {
  getDashboardAnalytics().track(AnalyticsEvents.GOAL_ACTION, {
    goal_id: goalId,
    action
  });
};

export const trackInsightInteraction = (insightType: string, action: 'accept' | 'dismiss' | 'expand') => {
  const eventType = action === 'accept' ? AnalyticsEvents.INSIGHT_ACCEPT :
                   action === 'dismiss' ? AnalyticsEvents.INSIGHT_DISMISS :
                   AnalyticsEvents.INSIGHT_EXPAND;
  
  getDashboardAnalytics().track(eventType, {
    insight_type: insightType,
    action
  });
};

export const trackError = (errorType: string, context: string, details?: Record<string, any>) => {
  getDashboardAnalytics().track(
    errorType.includes('chart') ? AnalyticsEvents.CHART_ERROR : AnalyticsEvents.DATA_ERROR,
    {
      error_type: errorType,
      context,
      ...details
    }
  );
};

// Cleanup function for app shutdown
export const cleanupAnalytics = () => {
  if (analyticsInstance) {
    analyticsInstance.destroy();
    analyticsInstance = null;
  }
};

export default getDashboardAnalytics;

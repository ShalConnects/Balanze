import React from 'react';

// Performance monitoring utilities
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface UserInteraction {
  action: string;
  component: string;
  timestamp: number;
  duration?: number;
  success?: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private interactions: UserInteraction[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  // Track component render time
  trackComponentRender(componentName: string, renderTime: number) {
    this.addMetric({
      name: `${componentName}_render_time`,
      value: renderTime,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { component: componentName }
    });
  }

  // Track user interactions
  trackInteraction(interaction: Omit<UserInteraction, 'timestamp'>) {
    this.interactions.push({
      ...interaction,
      timestamp: Date.now()
    });

    // Keep only last 100 interactions
    if (this.interactions.length > 100) {
      this.interactions = this.interactions.slice(-100);
    }
  }

  // Track API calls
  trackApiCall(endpoint: string, duration: number, success: boolean, error?: string) {
    this.trackInteraction({
      action: 'api_call',
      component: 'api',
      duration,
      success,
      error,
      metadata: { endpoint }
    });
  }

  // Track form submissions
  trackFormSubmission(formName: string, duration: number, success: boolean, error?: string) {
    this.trackInteraction({
      action: 'form_submission',
      component: formName,
      duration,
      success,
      error
    });
  }

  // Track page load times
  trackPageLoad(pageName: string, loadTime: number) {
    this.addMetric({
      name: `${pageName}_load_time`,
      value: loadTime,
      unit: 'ms',
      timestamp: Date.now(),
      metadata: { page: pageName }
    });
  }

  // Track memory usage
  trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.addMetric({
        name: 'memory_usage',
        value: memory.usedJSHeapSize / 1024 / 1024, // Convert to MB
        unit: 'MB',
        timestamp: Date.now(),
        metadata: {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        }
      });
    }
  }

  // Track network performance
  trackNetworkPerformance() {
    if ('getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0] as PerformanceNavigationTiming;
        
        this.addMetric({
          name: 'network_dns_lookup',
          value: nav.domainLookupEnd - nav.domainLookupStart,
          unit: 'ms',
          timestamp: Date.now()
        });

        this.addMetric({
          name: 'network_connection_time',
          value: nav.connectEnd - nav.connectStart,
          unit: 'ms',
          timestamp: Date.now()
        });

        this.addMetric({
          name: 'network_response_time',
          value: nav.responseEnd - nav.responseStart,
          unit: 'ms',
          timestamp: Date.now()
        });
      }
    }
  }

  // Add a metric
  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Get performance report
  getPerformanceReport(): {
    metrics: PerformanceMetric[];
    interactions: UserInteraction[];
    summary: {
      totalInteractions: number;
      averageApiCallTime: number;
      successRate: number;
      recentErrors: string[];
    };
  } {
    const apiCalls = this.interactions.filter(i => i.action === 'api_call');
    const successfulCalls = apiCalls.filter(call => call.success);
    const recentErrors = this.interactions
      .filter(i => i.error && i.timestamp > Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      .map(i => i.error!)
      .slice(-10);

    return {
      metrics: this.metrics,
      interactions: this.interactions,
      summary: {
        totalInteractions: this.interactions.length,
        averageApiCallTime: apiCalls.length > 0 
          ? apiCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / apiCalls.length 
          : 0,
        successRate: apiCalls.length > 0 ? (successfulCalls.length / apiCalls.length) * 100 : 100,
        recentErrors
      }
    };
  }

  // Start monitoring
  startMonitoring() {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.trackMemoryUsage();
    }, 30000);

    // Monitor network performance on page load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.trackNetworkPerformance();
        }, 1000);
      });
    }
  }

  // Clear all data
  clear() {
    this.metrics = [];
    this.interactions = [];
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common tracking scenarios
export const trackAccountAction = (action: string, accountId: string, success: boolean, duration?: number, error?: string) => {
  performanceMonitor.trackInteraction({
    action,
    component: 'accounts',
    duration,
    success,
    error,
    metadata: { accountId }
  });
};

export const trackFormAction = (formName: string, action: string, success: boolean, duration?: number, error?: string) => {
  performanceMonitor.trackFormSubmission(formName, duration || 0, success, error);
};

export const trackPageView = (pageName: string) => {
  const startTime = performance.now();
  
  // Track page load time after a short delay
  setTimeout(() => {
    const loadTime = performance.now() - startTime;
    performanceMonitor.trackPageLoad(pageName, loadTime);
  }, 100);
};

// React hook for tracking component performance
export const usePerformanceTracking = (componentName: string) => {
  const startTime = React.useRef(performance.now());

  React.useEffect(() => {
    const renderTime = performance.now() - startTime.current;
    performanceMonitor.trackComponentRender(componentName, renderTime);
  });

  const trackAction = React.useCallback((action: string, success: boolean, duration?: number, error?: string) => {
    performanceMonitor.trackInteraction({
      action,
      component: componentName,
      duration,
      success,
      error
    });
  }, [componentName]);

  return { trackAction };
};

// Start monitoring when the module is imported
if (typeof window !== 'undefined') {
  performanceMonitor.startMonitoring();
} 


/**
 * Smart Refresh System
 * Provides intelligent refresh logic with data staleness detection and background refresh
 */

export interface DataStalenessConfig {
  stalenessThreshold?: number; // milliseconds
  backgroundRefreshInterval?: number; // milliseconds
  enableBackgroundRefresh?: boolean;
  enableStalenessDetection?: boolean;
}

export interface RefreshAnalytics {
  lastRefresh: number;
  refreshCount: number;
  successCount: number;
  errorCount: number;
  averageDuration: number;
  lastError?: string;
}

export class SmartRefreshManager {
  private static instance: SmartRefreshManager;
  private config: Required<DataStalenessConfig> = {
    stalenessThreshold: 5 * 60 * 1000, // 5 minutes
    backgroundRefreshInterval: 2 * 60 * 1000, // 2 minutes
    enableBackgroundRefresh: true,
    enableStalenessDetection: true
  };
  private analytics: RefreshAnalytics = {
    lastRefresh: 0,
    refreshCount: 0,
    successCount: 0,
    errorCount: 0,
    averageDuration: 0
  };
  private backgroundRefreshTimer?: NodeJS.Timeout;
  private isOnline = navigator.onLine;
  private listeners: Array<(analytics: RefreshAnalytics) => void> = [];

  private constructor() {
    this.setupNetworkListeners();
  }

  public static getInstance(): SmartRefreshManager {
    if (!SmartRefreshManager.instance) {
      SmartRefreshManager.instance = new SmartRefreshManager();
    }
    return SmartRefreshManager.instance;
  }

  /**
   * Initialize smart refresh system
   */
  public initialize(config: Partial<DataStalenessConfig> = {}): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enableBackgroundRefresh) {
      this.startBackgroundRefresh();
    }
  }

  /**
   * Check if data is stale
   */
  public isDataStale(): boolean {
    if (!this.config.enableStalenessDetection) return false;
    
    const now = Date.now();
    return (now - this.analytics.lastRefresh) > this.config.stalenessThreshold;
  }

  /**
   * Get time since last refresh
   */
  public getTimeSinceLastRefresh(): number {
    return Date.now() - this.analytics.lastRefresh;
  }

  /**
   * Get formatted time since last refresh
   */
  public getFormattedTimeSinceLastRefresh(): string {
    const timeDiff = this.getTimeSinceLastRefresh();
    const minutes = Math.floor(timeDiff / 60000);
    const seconds = Math.floor((timeDiff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  }

  /**
   * Record refresh attempt
   */
  public recordRefreshAttempt(): void {
    this.analytics.refreshCount++;
  }

  /**
   * Record successful refresh
   */
  public recordRefreshSuccess(duration: number): void {
    this.analytics.successCount++;
    this.analytics.lastRefresh = Date.now();
    this.updateAverageDuration(duration);
    this.notifyListeners();
  }

  /**
   * Record failed refresh
   */
  public recordRefreshError(error: string): void {
    this.analytics.errorCount++;
    this.analytics.lastError = error;
    this.notifyListeners();
  }

  /**
   * Get current analytics
   */
  public getAnalytics(): RefreshAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get refresh recommendations
   */
  public getRefreshRecommendations(): {
    shouldRefresh: boolean;
    reason: string;
    priority: 'low' | 'medium' | 'high';
  } {
    const timeSinceRefresh = this.getTimeSinceLastRefresh();
    const stalenessThreshold = this.config.stalenessThreshold;
    
    // High priority: Data is very stale
    if (timeSinceRefresh > stalenessThreshold * 2) {
      return {
        shouldRefresh: true,
        reason: 'Data is very stale (over 10 minutes old)',
        priority: 'high'
      };
    }
    
    // Medium priority: Data is stale
    if (timeSinceRefresh > stalenessThreshold) {
      return {
        shouldRefresh: true,
        reason: 'Data is stale (over 5 minutes old)',
        priority: 'medium'
      };
    }
    
    // Low priority: Recent errors
    if (this.analytics.errorCount > this.analytics.successCount) {
      return {
        shouldRefresh: true,
        reason: 'Recent refresh errors detected',
        priority: 'low'
      };
    }
    
    return {
      shouldRefresh: false,
      reason: 'Data is fresh',
      priority: 'low'
    };
  }

  /**
   * Subscribe to analytics updates
   */
  public subscribe(listener: (analytics: RefreshAnalytics) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
    }
    this.listeners = [];
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      // Trigger refresh when coming back online if data is stale
      if (this.isDataStale()) {
        this.triggerBackgroundRefresh();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Start background refresh timer
   */
  private startBackgroundRefresh(): void {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
    }

    this.backgroundRefreshTimer = setInterval(() => {
      if (this.isOnline && this.isDataStale()) {
        this.triggerBackgroundRefresh();
      }
    }, this.config.backgroundRefreshInterval);
  }

  /**
   * Trigger background refresh
   */
  private triggerBackgroundRefresh(): void {
    // Dispatch custom event for background refresh
    window.dispatchEvent(new CustomEvent('backgroundRefreshNeeded', {
      detail: {
        reason: 'Data staleness',
        timeSinceLastRefresh: this.getTimeSinceLastRefresh()
      }
    }));
  }

  /**
   * Update average duration
   */
  private updateAverageDuration(duration: number): void {
    const totalDuration = this.analytics.averageDuration * (this.analytics.successCount - 1) + duration;
    this.analytics.averageDuration = totalDuration / this.analytics.successCount;
  }

  /**
   * Notify listeners of analytics changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getAnalytics());
      } catch (error) {
        console.error('Error in smart refresh listener:', error);
      }
    });
  }
}

/**
 * React hook for smart refresh functionality
 */
export const useSmartRefresh = (config: Partial<DataStalenessConfig> = {}) => {
  const [analytics, setAnalytics] = useState<RefreshAnalytics>({
    lastRefresh: 0,
    refreshCount: 0,
    successCount: 0,
    errorCount: 0,
    averageDuration: 0
  });
  const [recommendations, setRecommendations] = useState<{
    shouldRefresh: boolean;
    reason: string;
    priority: 'low' | 'medium' | 'high';
  }>({
    shouldRefresh: false,
    reason: 'Data is fresh',
    priority: 'low'
  });

  const manager = useMemo(() => SmartRefreshManager.getInstance(), []);

  useEffect(() => {
    manager.initialize(config);
    
    const unsubscribe = manager.subscribe(setAnalytics);
    
    // Update recommendations periodically
    const updateRecommendations = () => {
      const newRecommendations = manager.getRefreshRecommendations();
      setRecommendations(prev => {
        // Only update if the recommendations have actually changed
        if (prev.shouldRefresh !== newRecommendations.shouldRefresh || 
            prev.reason !== newRecommendations.reason || 
            prev.priority !== newRecommendations.priority) {
          return newRecommendations;
        }
        return prev;
      });
    };
    
    const interval = setInterval(updateRecommendations, 30000); // Update every 30 seconds
    updateRecommendations(); // Initial update
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [manager, config]);

  const recordRefreshAttempt = useCallback(() => {
    manager.recordRefreshAttempt();
  }, [manager]);

  const recordRefreshSuccess = useCallback((duration: number) => {
    manager.recordRefreshSuccess(duration);
  }, [manager]);

  const recordRefreshError = useCallback((error: string) => {
    manager.recordRefreshError(error);
  }, [manager]);

  const isDataStale = useCallback(() => {
    return manager.isDataStale();
  }, [manager]);

  const getTimeSinceLastRefresh = useCallback(() => {
    return manager.getTimeSinceLastRefresh();
  }, [manager]);

  const getFormattedTimeSinceLastRefresh = useCallback(() => {
    return manager.getFormattedTimeSinceLastRefresh();
  }, [manager]);

  return {
    analytics,
    recommendations,
    recordRefreshAttempt,
    recordRefreshSuccess,
    recordRefreshError,
    isDataStale,
    getTimeSinceLastRefresh,
    getFormattedTimeSinceLastRefresh
  };
};

// Import React hooks
import { useState, useEffect, useMemo, useCallback } from 'react';

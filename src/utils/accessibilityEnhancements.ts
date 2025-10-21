/**
 * Accessibility Enhancements
 * Provides accessibility improvements for refresh functionality
 */

export interface AccessibilityConfig {
  enableKeyboardShortcuts?: boolean;
  enableScreenReader?: boolean;
  enableHighContrast?: boolean;
  announceRefresh?: boolean;
  refreshAnnouncementDelay?: number;
}

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private config: Required<AccessibilityConfig> = {
    enableKeyboardShortcuts: true,
    enableScreenReader: true,
    enableHighContrast: false,
    announceRefresh: true,
    refreshAnnouncementDelay: 100
  };
  private isHighContrast = false;
  private keyboardListeners: Array<{ key: string; handler: () => void }> = [];

  private constructor() {
    this.detectHighContrast();
    this.setupKeyboardShortcuts();
  }

  public static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  /**
   * Initialize accessibility features
   */
  public initialize(config: Partial<AccessibilityConfig> = {}): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.enableKeyboardShortcuts) {
      this.setupKeyboardShortcuts();
    }
  }

  /**
   * Announce refresh status to screen readers
   */
  public announceRefresh(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.enableScreenReader || !this.config.announceRefresh) return;

    // Create or update live region for announcements
    let liveRegion = document.getElementById('refresh-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'refresh-announcements';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only'; // Screen reader only
      document.body.appendChild(liveRegion);
    }

    // Clear previous message and set new one
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = message;
    }, this.config.refreshAnnouncementDelay);
  }

  /**
   * Get enhanced button props for accessibility
   */
  public getRefreshButtonProps(isRefreshing: boolean, progress: number = 0): {
    'aria-label': string;
    'aria-describedby'?: string;
    'aria-busy': boolean;
    'aria-valuenow'?: number;
    'aria-valuemin': number;
    'aria-valuemax': number;
    'aria-valuetext'?: string;
  } {
    const baseProps = {
      'aria-label': isRefreshing 
        ? `Refreshing data, ${progress}% complete` 
        : 'Refresh data',
      'aria-busy': isRefreshing,
      'aria-valuemin': 0,
      'aria-valuemax': 100
    };

    if (isRefreshing) {
      return {
        ...baseProps,
        'aria-valuenow': progress,
        'aria-valuetext': `${progress}% complete`,
        'aria-describedby': 'refresh-progress-description'
      };
    }

    return baseProps;
  }

  /**
   * Get progress description for screen readers
   */
  public getProgressDescription(progress: number, currentStep?: string): string {
    if (currentStep) {
      return `Refresh progress: ${progress}% complete. Current step: ${currentStep}`;
    }
    return `Refresh progress: ${progress}% complete`;
  }

  /**
   * Setup keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + R for refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        this.triggerRefresh();
      }
      
      // F5 for refresh
      if (e.key === 'F5') {
        e.preventDefault();
        this.triggerRefresh();
      }
      
      // Escape to cancel refresh
      if (e.key === 'Escape') {
        this.cancelRefresh();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Store listener for cleanup
    this.keyboardListeners.push({
      key: 'keydown',
      handler: handleKeyDown
    });
  }

  /**
   * Trigger refresh via keyboard
   */
  private triggerRefresh(): void {
    // Dispatch custom event for keyboard-triggered refresh
    window.dispatchEvent(new CustomEvent('keyboardRefresh', {
      detail: { source: 'keyboard' }
    }));
  }

  /**
   * Cancel refresh
   */
  private cancelRefresh(): void {
    // Dispatch custom event for refresh cancellation
    window.dispatchEvent(new CustomEvent('cancelRefresh', {
      detail: { source: 'keyboard' }
    }));
  }

  /**
   * Detect high contrast mode
   */
  private detectHighContrast(): void {
    // Check for high contrast mode
    const testElement = document.createElement('div');
    testElement.style.border = '1px solid';
    testElement.style.borderColor = 'ButtonText';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement);
    this.isHighContrast = computedStyle.borderColor === 'rgb(0, 0, 0)';
    
    document.body.removeChild(testElement);
  }

  /**
   * Get high contrast styles
   */
  public getHighContrastStyles(): Record<string, string> {
    if (!this.isHighContrast || !this.config.enableHighContrast) {
      return {};
    }

    return {
      border: '2px solid ButtonText',
      backgroundColor: 'ButtonFace',
      color: 'ButtonText',
      outline: '2px solid Highlight'
    };
  }

  /**
   * Get enhanced focus styles
   */
  public getFocusStyles(): Record<string, string> {
    return {
      outline: '2px solid Highlight',
      outlineOffset: '2px',
      boxShadow: '0 0 0 2px Highlight'
    };
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.keyboardListeners.forEach(({ key, handler }) => {
      document.removeEventListener(key, handler);
    });
    this.keyboardListeners = [];
  }
}

/**
 * React hook for accessibility features
 */
export const useAccessibility = (config: Partial<AccessibilityConfig> = {}) => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const manager = useMemo(() => AccessibilityManager.getInstance(), []);

  useEffect(() => {
    manager.initialize(config);
    
    // Listen for refresh events
    const handleRefreshStart = () => {
      manager.announceRefresh('Refresh started', 'assertive');
      setAnnouncements(prev => [...prev, 'Refresh started']);
    };

    const handleRefreshProgress = (event: CustomEvent) => {
      const { progress, step } = event.detail;
      const message = `Refresh progress: ${progress}% complete${step ? `, ${step}` : ''}`;
      manager.announceRefresh(message, 'polite');
      setAnnouncements(prev => [...prev, message]);
    };

    const handleRefreshComplete = () => {
      manager.announceRefresh('Refresh completed successfully', 'assertive');
      setAnnouncements(prev => [...prev, 'Refresh completed']);
    };

    const handleRefreshError = (event: CustomEvent) => {
      const { error } = event.detail;
      manager.announceRefresh(`Refresh failed: ${error}`, 'assertive');
      setAnnouncements(prev => [...prev, `Refresh failed: ${error}`]);
    };

    // Add event listeners
    window.addEventListener('refreshStart', handleRefreshStart as EventListener);
    window.addEventListener('refreshProgress', handleRefreshProgress as EventListener);
    window.addEventListener('refreshComplete', handleRefreshComplete as EventListener);
    window.addEventListener('refreshError', handleRefreshError as EventListener);

    return () => {
      window.removeEventListener('refreshStart', handleRefreshStart as EventListener);
      window.removeEventListener('refreshProgress', handleRefreshProgress as EventListener);
      window.removeEventListener('refreshComplete', handleRefreshComplete as EventListener);
      window.removeEventListener('refreshError', handleRefreshError as EventListener);
    };
  }, [manager, config]);

  const announceRefresh = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    manager.announceRefresh(message, priority);
  }, [manager]);

  const getRefreshButtonProps = useCallback((isRefreshing: boolean, progress: number = 0) => {
    return manager.getRefreshButtonProps(isRefreshing, progress);
  }, [manager]);

  const getProgressDescription = useCallback((progress: number, currentStep?: string) => {
    return manager.getProgressDescription(progress, currentStep);
  }, [manager]);

  const getHighContrastStyles = useCallback(() => {
    return manager.getHighContrastStyles();
  }, [manager]);

  const getFocusStyles = useCallback(() => {
    return manager.getFocusStyles();
  }, [manager]);

  return {
    isHighContrast,
    announcements,
    announceRefresh,
    getRefreshButtonProps,
    getProgressDescription,
    getHighContrastStyles,
    getFocusStyles
  };
};

// Import React hooks
import { useState, useEffect, useMemo, useCallback } from 'react';

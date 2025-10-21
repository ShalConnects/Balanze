/**
 * Android Scroll Handler
 * Handles native Android browser pull-to-refresh functionality
 * Provides scroll behavior management and touch event handling
 */

export interface AndroidScrollConfig {
  enableNativeRefresh?: boolean;
  threshold?: number;
  hapticFeedback?: boolean;
}

export class AndroidScrollHandler {
  private static instance: AndroidScrollHandler;
  private isInitialized = false;
  private config: AndroidScrollConfig = {
    enableNativeRefresh: true,
    threshold: 80,
    hapticFeedback: true
  };
  private eventListeners: Array<{ element: Element; event: string; handler: EventListener }> = [];

  private constructor() {}

  public static getInstance(): AndroidScrollHandler {
    if (!AndroidScrollHandler.instance) {
      AndroidScrollHandler.instance = new AndroidScrollHandler();
    }
    return AndroidScrollHandler.instance;
  }

  /**
   * Initialize Android scroll handler
   */
  public initialize(config: Partial<AndroidScrollConfig> = {}): void {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };
    
    // Only initialize on Android devices
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (!isAndroid || !this.config.enableNativeRefresh) return;

    this.setupBodyConstraints();
    this.setupTouchHandlers();
    this.isInitialized = true;
  }

  /**
   * Setup body constraints for proper scrolling
   */
  private setupBodyConstraints(): void {
    const setBodyHeight = () => {
      document.body.style.height = '100vh';
      document.body.style.position = 'fixed';
      document.body.style.overflow = 'hidden';
      document.body.style.width = '100%';
      
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.style.height = '100vh';
        rootElement.style.overflowY = 'auto';
        rootElement.style.overflowX = 'hidden';
        rootElement.style.WebkitOverflowScrolling = 'touch';
        rootElement.style.overscrollBehavior = 'auto'; // Allow overscroll for refresh
      }
    };
    
    setBodyHeight();
    window.addEventListener('resize', setBodyHeight);
  }

  /**
   * Setup touch event handlers for smart refresh logic
   */
  private setupTouchHandlers(): void {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;

    let startY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isPulling = rootElement.scrollTop === 0; // Only allow refresh at top
      
      if (this.config.hapticFeedback && navigator.vibrate) {
        navigator.vibrate(10); // Light haptic feedback
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return;
      
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      const isAtTop = rootElement.scrollTop === 0;
      
      // Smart behavior:
      // - At top + pulling down (deltaY > 0) → Allow refresh
      // - Not at top → Normal scroll (no refresh)
      if (isAtTop && deltaY > this.config.threshold!) {
        // User pulled down more than threshold at top
        // Allow the overscroll to trigger browser refresh
        // Don't preventDefault - let it happen naturally
        
        if (this.config.hapticFeedback && navigator.vibrate) {
          navigator.vibrate(20); // Medium haptic feedback
        }
      }
    };

    const handleTouchEnd = () => {
      isPulling = false;
    };

    // Add event listeners with passive: true for better performance
    rootElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    rootElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    rootElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Store references for cleanup
    this.eventListeners.push(
      { element: rootElement, event: 'touchstart', handler: handleTouchStart },
      { element: rootElement, event: 'touchmove', handler: handleTouchMove },
      { element: rootElement, event: 'touchend', handler: handleTouchEnd }
    );
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AndroidScrollConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.isInitialized) {
      this.cleanup();
      this.initialize();
    }
  }

  /**
   * Check if handler is active
   */
  public isActive(): boolean {
    return this.isInitialized && this.config.enableNativeRefresh;
  }

  /**
   * Clean up event listeners and reset state
   */
  public cleanup(): void {
    // Remove all event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    
    this.eventListeners = [];
    this.isInitialized = false;
  }

  /**
   * Enable/disable native refresh
   */
  public setEnabled(enabled: boolean): void {
    this.updateConfig({ enableNativeRefresh: enabled });
  }

  /**
   * Set haptic feedback
   */
  public setHapticFeedback(enabled: boolean): void {
    this.updateConfig({ hapticFeedback: enabled });
  }

  /**
   * Set pull threshold
   */
  public setThreshold(threshold: number): void {
    this.updateConfig({ threshold });
  }
}

// Export singleton instance
export const androidScrollHandler = AndroidScrollHandler.getInstance();

// Export for use in components
export default AndroidScrollHandler;

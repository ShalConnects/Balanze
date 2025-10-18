/**
 * Unified Mobile Refresh System
 * Coordinates between Android scroll handler and PullToRefresh component
 * Provides a single interface for mobile refresh functionality
 */

import { androidScrollHandler } from './androidScrollHandler';

export interface MobileRefreshConfig {
  enableNativeRefresh?: boolean;
  enableCustomRefresh?: boolean;
  hapticFeedback?: boolean;
  threshold?: number;
  disabled?: boolean;
}

export class UnifiedMobileRefresh {
  private static instance: UnifiedMobileRefresh;
  private isInitialized = false;
  private config: MobileRefreshConfig = {
    enableNativeRefresh: true,
    enableCustomRefresh: true,
    hapticFeedback: true,
    threshold: 80,
    disabled: false
  };

  private constructor() {}

  public static getInstance(): UnifiedMobileRefresh {
    if (!UnifiedMobileRefresh.instance) {
      UnifiedMobileRefresh.instance = new UnifiedMobileRefresh();
    }
    return UnifiedMobileRefresh.instance;
  }

  /**
   * Initialize the unified mobile refresh system
   */
  public initialize(config: Partial<MobileRefreshConfig> = {}): void {
    if (this.isInitialized) return;

    this.config = { ...this.config, ...config };

    // Initialize Android scroll handler if native refresh is enabled
    if (this.config.enableNativeRefresh && !this.config.disabled) {
      androidScrollHandler.initialize();
    }

    this.isInitialized = true;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<MobileRefreshConfig>): void {
    this.config = { ...this.config, ...config };

    // Re-initialize if needed
    if (this.isInitialized) {
      this.cleanup();
      this.initialize();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): MobileRefreshConfig {
    return { ...this.config };
  }

  /**
   * Check if the system is active
   */
  public isActive(): boolean {
    return this.isInitialized && !this.config.disabled;
  }

  /**
   * Check if native refresh is enabled
   */
  public isNativeRefreshEnabled(): boolean {
    return this.config.enableNativeRefresh && !this.config.disabled;
  }

  /**
   * Check if custom refresh is enabled
   */
  public isCustomRefreshEnabled(): boolean {
    return this.config.enableCustomRefresh && !this.config.disabled;
  }

  /**
   * Get PullToRefresh props based on current configuration
   */
  public getPullToRefreshProps() {
    return {
      disabled: this.config.disabled || !this.config.enableCustomRefresh,
      threshold: this.config.threshold,
      hapticFeedback: this.config.hapticFeedback
    };
  }

  /**
   * Clean up the system
   */
  public cleanup(): void {
    if (this.config.enableNativeRefresh) {
      androidScrollHandler.cleanup();
    }
    this.isInitialized = false;
  }

  /**
   * Enable/disable the entire system
   */
  public setEnabled(enabled: boolean): void {
    this.updateConfig({ disabled: !enabled });
  }

  /**
   * Enable/disable native refresh only
   */
  public setNativeRefreshEnabled(enabled: boolean): void {
    this.updateConfig({ enableNativeRefresh: enabled });
  }

  /**
   * Enable/disable custom refresh only
   */
  public setCustomRefreshEnabled(enabled: boolean): void {
    this.updateConfig({ enableCustomRefresh: enabled });
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
export const unifiedMobileRefresh = UnifiedMobileRefresh.getInstance();

// Export for use in components
export default UnifiedMobileRefresh;

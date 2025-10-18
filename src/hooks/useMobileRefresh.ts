/**
 * useMobileRefresh Hook
 * React hook for easy integration with the unified mobile refresh system
 */

import { useEffect, useCallback } from 'react';
import { unifiedMobileRefresh, MobileRefreshConfig } from '../utils/unifiedMobileRefresh';

export interface UseMobileRefreshOptions extends MobileRefreshConfig {
  onRefresh?: () => Promise<void>;
  autoInitialize?: boolean;
}

export const useMobileRefresh = (options: UseMobileRefreshOptions = {}) => {
  const {
    onRefresh,
    autoInitialize = true,
    ...config
  } = options;

  // Initialize the system
  useEffect(() => {
    if (autoInitialize) {
      unifiedMobileRefresh.initialize(config);
    }

    return () => {
      if (autoInitialize) {
        unifiedMobileRefresh.cleanup();
      }
    };
  }, [autoInitialize, config.enableNativeRefresh, config.enableCustomRefresh, config.disabled]);

  // Update configuration when it changes
  useEffect(() => {
    if (autoInitialize) {
      unifiedMobileRefresh.updateConfig(config);
    }
  }, [autoInitialize, config]);

  // Get PullToRefresh props
  const pullToRefreshProps = unifiedMobileRefresh.getPullToRefreshProps();

  // Enhanced refresh handler
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      try {
        await onRefresh();
      } catch (error) {
        console.error('Mobile refresh error:', error);
        throw error; // Re-throw to let PullToRefresh handle the error state
      }
    }
  }, [onRefresh]);

  // Utility functions
  const setEnabled = useCallback((enabled: boolean) => {
    unifiedMobileRefresh.setEnabled(enabled);
  }, []);

  const setNativeRefreshEnabled = useCallback((enabled: boolean) => {
    unifiedMobileRefresh.setNativeRefreshEnabled(enabled);
  }, []);

  const setCustomRefreshEnabled = useCallback((enabled: boolean) => {
    unifiedMobileRefresh.setCustomRefreshEnabled(enabled);
  }, []);

  const setHapticFeedback = useCallback((enabled: boolean) => {
    unifiedMobileRefresh.setHapticFeedback(enabled);
  }, []);

  const setThreshold = useCallback((threshold: number) => {
    unifiedMobileRefresh.setThreshold(threshold);
  }, []);

  return {
    // PullToRefresh props
    pullToRefreshProps: {
      ...pullToRefreshProps,
      onRefresh: handleRefresh
    },
    
    // System state
    isActive: unifiedMobileRefresh.isActive(),
    isNativeRefreshEnabled: unifiedMobileRefresh.isNativeRefreshEnabled(),
    isCustomRefreshEnabled: unifiedMobileRefresh.isCustomRefreshEnabled(),
    config: unifiedMobileRefresh.getConfig(),
    
    // Control functions
    setEnabled,
    setNativeRefreshEnabled,
    setCustomRefreshEnabled,
    setHapticFeedback,
    setThreshold,
    
    // Direct refresh trigger
    triggerRefresh: handleRefresh
  };
};

export default useMobileRefresh;

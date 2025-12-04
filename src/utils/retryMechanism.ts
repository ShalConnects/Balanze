/**
 * Retry Mechanism Utility
 * Provides retry functionality for failed API calls with exponential backoff
 */

export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
  totalTime: number;
}

export class RetryMechanism {
  private static defaultConfig: Required<RetryConfig> = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryCondition: (error: any) => {
      // Retry on network errors, timeouts, and 5xx server errors
      return (
        !error.response || 
        error.response.status >= 500 || 
        error.code === 'NETWORK_ERROR' ||
        error.code === 'TIMEOUT'
      );
    }
  };

  /**
   * Execute a function with retry logic
   */
  static async execute<T>(
    fn: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<RetryResult<T>> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: any;
    let attempts = 0;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      attempts = attempt + 1;
      
      try {
        const data = await fn();
        return {
          success: true,
          data,
          attempts,
          totalTime: Date.now() - startTime
        };
      } catch (error) {
        lastError = error;
        
        // Don't retry if it's the last attempt or condition doesn't match
        if (attempt === finalConfig.maxRetries || !finalConfig.retryCondition(error)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
          finalConfig.maxDelay
        );

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
      totalTime: Date.now() - startTime
    };
  }

  /**
   * Execute multiple functions with retry logic
   */
  static async executeAll<T>(
    functions: Array<() => Promise<T>>,
    config: RetryConfig = {}
  ): Promise<Array<RetryResult<T>>> {
    const results = await Promise.allSettled(
      functions.map(fn => this.execute(fn, config))
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        success: false,
        error: result.reason,
        attempts: 0,
        totalTime: 0
      }
    );
  }

  /**
   * Execute functions with staggered retry (sequential with delays)
   */
  static async executeStaggered<T>(
    functions: Array<() => Promise<T>>,
    config: RetryConfig = {}
  ): Promise<Array<RetryResult<T>>> {
    const results: Array<RetryResult<T>> = [];
    
    for (const fn of functions) {
      const result = await this.execute(fn, config);
      results.push(result);
      
      // Add small delay between functions to prevent overwhelming the server
      if (result.success) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}

/**
 * Hook for retry functionality in React components
 */
export const useRetry = (config: RetryConfig = {}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<any>(null);

  const executeWithRetry = useCallback(async <T>(
    fn: () => Promise<T>
  ): Promise<RetryResult<T>> => {
    setIsRetrying(true);
    setRetryCount(0);
    setLastError(null);

    const result = await RetryMechanism.execute(fn, config);
    
    setRetryCount(result.attempts);
    if (!result.success) {
      setLastError(result.error);
    }
    
    setIsRetrying(false);
    return result;
  }, [config]);

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
    lastError
  };
};

// Import useState and useCallback for the hook
import { useState, useCallback } from 'react';

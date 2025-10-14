/**
 * Simple logger utility that's no-op in production, verbose in development
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      level: import.meta.env.DEV ? 'debug' : 'error',
      enabled: import.meta.env.DEV
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[level] >= levels[this.config.level];
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  // Convenience methods for common patterns
  logApiCall(endpoint: string, method: string, data?: any): void {
    this.debug(`API ${method.toUpperCase()} ${endpoint}`, data);
  }

  logUserAction(action: string, details?: any): void {
    this.debug(`User Action: ${action}`, details);
  }

  logError(error: Error, context?: string): void {
    this.error(`${context ? `[${context}] ` : ''}${error.message}`, error);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for convenience
export default logger;

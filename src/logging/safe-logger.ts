/**
 * SafeLogger - Simple logger for immediate access
 * 
 * This provides a simple logger that's always available, even during
 * early initialization when the full logging system might not be ready.
 */

import { LogLevel } from './LoggerTypes';
import { getLogger } from './index';

/**
 * Interface for the safe logger
 */
export interface SafeLogger {
  /**
   * Generic log method (maps to debug for backward compatibility)
   */
  log(category: string, message: string, data?: any): void;
  debug(category: string, message: string, data?: any): void;
  info(category: string, message: string, data?: any): void;
  warn(category: string, message: string, data?: any): void;
  error(category: string, message: string, error?: any): void;
  trace(category: string, message: string, data?: any): void;
}

/**
 * Simple safe logger implementation that just writes to console
 */
class SafeLoggerImpl implements SafeLogger {
  private level: LogLevel = 'debug';
  private initialized = false;
  
  /**
   * Generic log method (maps to info for backward compatibility)
   */
  log(category: string, message: string, data?: any): void {
    // For compatibility, map 'log' to 'info'
    this.info(category, message, data);
  }
  
  /**
   * Log a debug message
   */
  debug(category: string, message: string, data?: any): void {
    this.logWithLevel('debug', category, message, data);
  }
  
  /**
   * Log an info message
   */
  info(category: string, message: string, data?: any): void {
    this.logWithLevel('info', category, message, data);
  }
  
  /**
   * Log a warning message
   */
  warn(category: string, message: string, data?: any): void {
    this.logWithLevel('warn', category, message, data);
  }
  
  /**
   * Log an error message
   */
  error(category: string, message: string, error?: any): void {
    this.logWithLevel('error', category, message, error);
    if (error && error.stack) {
      console.error(error.stack);
    }
  }
  
  /**
   * Log a trace message
   */
  trace(category: string, message: string, data?: any): void {
    this.logWithLevel('trace', category, message, data);
  }
  
  /**
   * Helper to log with a specific level
   */
  private logWithLevel(level: LogLevel, category: string, message: string, data?: any): void {
    // Check if we should use the regular logger yet
    if (this.initialized) {
      try {
        const logger = getLogger('SafeLogger');
        switch (level) {
          case 'debug': logger.debug(category, message, data); break;
          case 'info': logger.info(category, message, data); break;
          case 'warn': logger.warn(category, message, data); break;
          case 'error': logger.error(category, message, data); break;
          case 'trace': logger.trace(category, message, data); break;
        }
        return;
      } catch (e) {
        // Failed to use the regular logger, fall back to console
        this.initialized = false;
      }
    }
    
    // Fall back to console
    const timestamp = new Date().toISOString();
    const formattedMsg = `[${timestamp}] ${level.toUpperCase()} [SafeLogger:${category}] ${message}`;
    
    switch (level) {
      case 'error': console.error(formattedMsg); break;
      case 'warn': console.warn(formattedMsg); break;
      case 'info': console.info(formattedMsg); break;
      case 'debug': console.debug(formattedMsg); break;
      case 'trace': console.log(formattedMsg); break;
    }
    
    if (data && level !== 'error') {
      console.log(data);
    }
  }
  
  /**
   * Mark the logger as initialized to start using the regular logger
   */
  setInitialized(): void {
    this.initialized = true;
  }
}

// Create singleton instance
const safeLoggerInstance = new SafeLoggerImpl();

/**
 * Get the safe logger
 */
export function getSafeLogger(): SafeLogger {
  return safeLoggerInstance;
}

/**
 * Initialize the safe logger to start using the regular logging system
 */
export function initializeSafeLogger(): void {
  safeLoggerInstance.setInitialized();
}

/**
 * Export default instance
 */
export default safeLoggerInstance; 
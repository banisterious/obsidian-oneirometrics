/**
 * Logging module exports
 * 
 * This file provides a unified interface for accessing the plugin's logging functionality.
 * It ensures backward compatibility with existing code while providing the new logging system.
 */

// Core exports
export { LogManager } from './core/LogManager';
export { Logger } from './core/Logger';
export { LoggerFactory } from './core/LoggerFactory';

// Adapter exports
export { ConsoleAdapter } from './adapters/ConsoleAdapter';
export { FileAdapter, type FileAdapterConfig } from './adapters/FileAdapter';
export { NoticeAdapter, type NoticeAdapterConfig } from './adapters/NoticeAdapter';
export { NullAdapter } from './adapters/NullAdapter';

// Formatter exports
export { StandardFormatter } from './formatters/StandardFormatter';

// Type exports
export type { 
  LogLevel,
  LogEntry,
  LogConfig,
  LogAdapter,
  LogFormatter,
  ILogger,
  ContextualLogger,
  ErrorContext,
  EnrichedError
} from './LoggerTypes';
export { LogLevelValue, LOG_LEVEL_MAP } from './LoggerTypes';

// Legacy adapter exports
export { LoggingAdapter } from './LoggingPluginAdapter';

// Create singleton factory
import { LoggerFactory } from './core/LoggerFactory';
const loggerFactory = new LoggerFactory();

// Export singleton factory instance
export { loggerFactory };

// Create and export default logger
const defaultLogger = loggerFactory.getLogger('default');
export default defaultLogger;

// Export the safe logger for safe access to logging functionality
export type { SafeLogger } from './safe-logger';
export { default as safeLogger, getSafeLogger } from './safe-logger';

// Export a helper function to get the appropriate logger
export function getLogger(context?: any): ILogger {
  // If context is a string, use it as the logger name
  if (typeof context === 'string') {
    return loggerFactory.getLogger(context);
  }
  
  // If context is an object with a name, use it as the logger name
  if (context && typeof context === 'object' && 'name' in context) {
    return loggerFactory.getLogger(context.name);
  }
  
  // If context has a constructor name, use it
  if (context && context.constructor && context.constructor.name) {
    return loggerFactory.getLogger(context.constructor.name);
  }
  
  // Fall back to the default logger
  return defaultLogger;
}

// Export convenience methods for quick logging
import { ILogger } from './LoggerTypes';

export const log = (category: string, message: string, data?: any) => 
    defaultLogger.debug(category, message, data);

export const info = (category: string, message: string, data?: any) => 
    defaultLogger.info(category, message, data);
    
export const debug = (category: string, message: string, data?: any) => 
    defaultLogger.debug(category, message, data);
    
export const warn = (category: string, message: string, data?: any) => 
    defaultLogger.warn(category, message, data);
    
export const error = (category: string, message: string, err?: Error) => 
    defaultLogger.error(category, message, err);
    
export const trace = (category: string, message: string, data?: any) => 
    defaultLogger.trace(category, message, data); 
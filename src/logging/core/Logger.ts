/**
 * Logger - Core implementation of the ILogger interface
 * 
 * This class provides the core logging functionality and implements
 * the ILogger interface.
 */

import { 
  ILogger, 
  LogLevel, 
  LogEntry, 
  ErrorContext, 
  EnrichedError,
  ContextualLogger
} from '../LoggerTypes';
import { LogManager } from './LogManager';

/**
 * Context-aware logger that adds additional context to log entries
 */
class ContextualLoggerImpl implements ContextualLogger {
  private baseLogger: Logger;
  private context: Record<string, any>;
  
  constructor(baseLogger: Logger, context: Record<string, any>) {
    this.baseLogger = baseLogger;
    this.context = context;
  }
  
  log(category: string, message: string, data?: any): void {
    this.baseLogger.log(category, message, this.mergeData(data));
  }
  
  debug(category: string, message: string, data?: any): void {
    this.baseLogger.debug(category, message, this.mergeData(data));
  }
  
  info(category: string, message: string, data?: any): void {
    this.baseLogger.info(category, message, this.mergeData(data));
  }
  
  warn(category: string, message: string, data?: any): void {
    this.baseLogger.warn(category, message, this.mergeData(data));
  }
  
  error(category: string, message: string, error?: any): void {
    this.baseLogger.error(category, message, error, this.context);
  }
  
  trace(category: string, message: string, data?: any): void {
    this.baseLogger.trace(category, message, this.mergeData(data));
  }
  
  enrichError(error: Error, context: Partial<ErrorContext>): EnrichedError {
    return this.baseLogger.enrichError(error, {
      ...context,
      metadata: {
        ...context.metadata,
        ...this.context
      }
    });
  }
  
  wrapError(originalError: Error, message: string, context: Partial<ErrorContext>): EnrichedError {
    return this.baseLogger.wrapError(originalError, message, {
      ...context,
      metadata: {
        ...context.metadata,
        ...this.context
      }
    });
  }
  
  withContext(additionalContext: Record<string, any>): ContextualLogger {
    return new ContextualLoggerImpl(this.baseLogger, {
      ...this.context,
      ...additionalContext
    });
  }
  
  private mergeData(data?: any): any {
    if (!data) return this.context;
    if (typeof data !== 'object') return { value: data, ...this.context };
    return { ...data, ...this.context };
  }
}

/**
 * Core logger implementation
 */
export class Logger implements ILogger {
  private name: string;
  private manager: LogManager;
  
  /**
   * Create a new logger
   * 
   * @param name The logger name/category
   * @param manager The log manager instance
   */
  constructor(name: string, manager: LogManager) {
    this.name = name;
    this.manager = manager;
  }
  
  /**
   * Log a message (generic method, maps to info for backward compatibility)
   */
  log(category: string, message: string, data?: any): void {
    this.info(category, message, data);
  }
  
  /**
   * Log a message at the debug level
   */
  debug(category: string, message: string, data?: any): void {
    this.logWithLevel('debug', category, message, data);
  }
  
  /**
   * Log a message at the info level
   */
  info(category: string, message: string, data?: any): void {
    this.logWithLevel('info', category, message, data);
  }
  
  /**
   * Log a message at the warn level
   */
  warn(category: string, message: string, data?: any): void {
    this.logWithLevel('warn', category, message, data);
  }
  
  /**
   * Log a message at the error level
   */
  error(category: string, message: string, error?: Error, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level: 'error',
      category: `${this.name}:${category}`,
      message,
      timestamp: new Date(),
      error,
      data: context
    };
    
    this.manager.log(entry);
  }
  
  /**
   * Log a message at the trace level
   */
  trace(category: string, message: string, data?: any): void {
    this.logWithLevel('trace', category, message, data);
  }
  
  /**
   * Create a contextual logger that includes additional context with each log
   */
  withContext(context: Record<string, any>): ContextualLogger {
    return new ContextualLoggerImpl(this, context);
  }
  
  /**
   * Log with the specified level
   */
  private logWithLevel(level: LogLevel, category: string, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      category: `${this.name}:${category}`,
      message,
      timestamp: new Date(),
      data
    };
    
    this.manager.log(entry);
  }
  
  /**
   * Start a timer and return a function to stop it and log the duration
   */
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info('Timer', `${label}: ${duration}ms`);
    };
  }
  
  /**
   * Count occurrences of an event
   */
  count(label: string): void {
    // This would ideally integrate with a metrics system
    this.debug('Counter', label);
  }
  
  /**
   * Enriches an error with additional context
   */
  enrichError(error: Error, context: Partial<ErrorContext>): EnrichedError {
    const enriched = error as EnrichedError;
    enriched.context = {
      component: context.component || this.name,
      operation: context.operation || 'unknown',
      timestamp: context.timestamp || Date.now(),
      metadata: context.metadata || {}
    };
    return enriched;
  }
  
  /**
   * Creates a new error that wraps an original error with additional context
   */
  wrapError(originalError: Error, message: string, context: Partial<ErrorContext>): EnrichedError {
    const wrapped = new Error(message) as EnrichedError;
    wrapped.originalError = originalError;
    wrapped.stack = `${wrapped.stack}\nCaused by: ${originalError.stack}`;
    wrapped.context = {
      component: context.component || this.name,
      operation: context.operation || 'unknown',
      timestamp: context.timestamp || Date.now(),
      metadata: context.metadata || {}
    };
    return wrapped;
  }
} 
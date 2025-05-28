/**
 * Shared type definitions for the logging system
 */

/**
 * Represents the available logging levels from least verbose to most verbose.
 */
export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * Represents the numeric values for log levels, used for comparison.
 */
export enum LogLevelValue {
  OFF = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5
}

/**
 * Maps log level strings to their numeric values for comparison.
 */
export const LOG_LEVEL_MAP: Record<LogLevel, LogLevelValue> = {
  'off': LogLevelValue.OFF,
  'error': LogLevelValue.ERROR,
  'warn': LogLevelValue.WARN,
  'info': LogLevelValue.INFO,
  'debug': LogLevelValue.DEBUG,
  'trace': LogLevelValue.TRACE
};

/**
 * Interface for error context to be attached to enriched errors.
 */
export interface ErrorContext {
  component: string;
  operation: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Extended Error interface with context information.
 */
export interface EnrichedError extends Error {
  context?: ErrorContext;
  originalError?: Error;
}

/**
 * A log entry representing a single log message
 */
export interface LogEntry {
  level: LogLevel;
  category: string;
  message: string;
  timestamp: Date;
  data?: any;
  error?: Error;
}

/**
 * Configuration options for the logger.
 */
export interface LogConfig {
  level: LogLevel;
  maxSize?: number;
  maxBackups?: number;
  logFilePath?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  enableNotices?: boolean;
}

/**
 * Base interface for loggers
 */
export interface ILogger {
  /**
   * Log a generic message (for backward compatibility, maps to debug or info)
   */
  log(category: string, message: string, data?: any): void;
  
  /**
   * Log a debug message
   */
  debug(category: string, message: string, data?: any): void;
  
  /**
   * Log an info message
   */
  info(category: string, message: string, data?: any): void;
  
  /**
   * Log a warning message
   */
  warn(category: string, message: string, data?: any): void;
  
  /**
   * Log an error message
   */
  error(category: string, message: string, error?: any): void;
  
  /**
   * Log a trace message
   */
  trace(category: string, message: string, data?: any): void;
  
  /**
   * Enrich an error with context information
   */
  enrichError(error: Error, context: Partial<ErrorContext>): EnrichedError;
  
  /**
   * Wrap an error with a new message and context
   */
  wrapError(originalError: Error, message: string, context: Partial<ErrorContext>): EnrichedError;
}

/**
 * Interface for log output adapters
 */
export interface LogAdapter {
  log(entry: LogEntry): void;
  flush(): Promise<void>;
  dispose(): Promise<void>;
}

/**
 * Interface for log message formatters
 */
export interface LogFormatter {
  format(entry: LogEntry): string;
}

/**
 * Interface for contextual loggers that include additional context with each log
 */
export interface ContextualLogger extends ILogger {
  withContext(additionalContext: Record<string, any>): ContextualLogger;
} 
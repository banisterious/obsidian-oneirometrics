import { App } from 'obsidian';

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
 * Configuration options for the logger.
 */
export interface LoggerConfig {
  level: LogLevel;
  maxLogSize?: number;
  maxSize?: number;
  maxBackups?: number;
  logFilePath?: string;
}

/**
 * Core interface for the logging service.
 */
export interface ILoggingService {
  /**
   * Configure the logging service.
   * @param config The logger configuration.
   */
  configure(config: LoggerConfig): void;
  
  /**
   * Log a message at the debug level.
   * @param category The log category/component.
   * @param message The message to log.
   * @param data Optional data to include in the log.
   */
  debug(category: string, message: string, data?: any): void;
  
  /**
   * Log a message at the info level.
   * @param category The log category/component.
   * @param message The message to log.
   * @param data Optional data to include in the log.
   */
  info(category: string, message: string, data?: any): void;
  
  /**
   * Log a message at the warn level.
   * @param category The log category/component.
   * @param message The message to log.
   * @param data Optional data to include in the log.
   */
  warn(category: string, message: string, data?: any): void;
  
  /**
   * Log a message at the error level.
   * @param category The log category/component.
   * @param message The message to log.
   * @param error Optional error to include in the log.
   */
  error(category: string, message: string, error?: any): void;
  
  /**
   * Log a message at the trace level.
   * @param category The log category/component.
   * @param message The message to log.
   * @param data Optional data to include in the log.
   */
  trace(category: string, message: string, data?: any): void;
  
  /**
   * Enriches an error with additional context.
   * @param error The original error.
   * @param context The context to add to the error.
   * @returns The enriched error.
   */
  enrichError(error: Error, context: Partial<ErrorContext>): EnrichedError;
  
  /**
   * Creates a new error that wraps an original error with additional context.
   * @param originalError The original error.
   * @param message The new error message.
   * @param context The context to add to the error.
   * @returns The wrapped error.
   */
  wrapError(originalError: Error, message: string, context: Partial<ErrorContext>): EnrichedError;
}

/**
 * Factory interface for creating logging service instances.
 */
export interface ILoggingServiceFactory {
  /**
   * Creates a logging service.
   * @param app The Obsidian app instance.
   * @returns A logging service instance.
   */
  createLoggingService(app: App): ILoggingService;
} 
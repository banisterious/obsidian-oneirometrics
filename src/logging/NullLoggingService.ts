/**
 * Null Object implementation of the LoggingAdapter
 * 
 * This provides a no-op implementation of the LoggingAdapter interface
 * that can be used as a fallback when the real LoggingAdapter is not available.
 * It implements the Null Object Pattern for defensive coding.
 */

import { App, Notice } from 'obsidian';
import { LogLevel, LoggerConfig } from './LoggingInterfaces';

/**
 * NullLoggingService implements the same interface as LoggingAdapter
 * but does nothing when methods are called.
 */
export class NullLoggingService {
    // Expose the same properties as the real LoggingAdapter
    logLevel: LogLevel = 'off';
    logFile: string = '';
    maxSize: number = 0;
    maxBackups: number = 0;
    
    /**
     * Singleton instance
     */
    private static instance: NullLoggingService;
    
    /**
     * Get the singleton instance
     */
    public static getInstance(): NullLoggingService {
        if (!NullLoggingService.instance) {
            NullLoggingService.instance = new NullLoggingService();
        }
        return NullLoggingService.instance;
    }
    
    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {}
    
    /**
     * Configure the logger with the specified settings - no-op
     */
    configure(level: LogLevel, maxSize: number = 0, maxBackups: number = 0): void {
        // Do nothing
    }
    
    /**
     * Alternative configure method - no-op
     */
    configureWithOptions(config: LoggerConfig): void {
        // Do nothing
    }
    
    /**
     * Log a message - no-op
     */
    log(category: string, message: string, data?: any): void {
        // Do nothing
    }
    
    /**
     * Log an error message - no-op
     */
    error(category: string, message: string, error?: any): void {
        // Do nothing
    }
    
    /**
     * Log a warning message - no-op
     */
    warn(category: string, message: string, data?: any): void {
        // Do nothing
    }
    
    /**
     * Log an info message - no-op
     */
    info(category: string, message: string, data?: any): void {
        // Do nothing
    }
    
    /**
     * Log a debug message - no-op
     */
    debug(category: string, message: string, data?: any): void {
        // Do nothing
    }
    
    /**
     * Log a trace message - no-op
     */
    trace(category: string, message: string, data?: any): void {
        // Do nothing
    }
    
    /**
     * Enrich an error with context information - returns the original error
     */
    enrichError(error: Error, context: {component: string, operation: string, metadata?: Record<string, any>}): Error {
        return error;
    }
    
    /**
     * Wrap an error with a new message and context - returns the original error
     */
    wrapError(originalError: Error, message: string, context: {component: string, operation: string, metadata?: Record<string, any>}): Error {
        return originalError;
    }
} 
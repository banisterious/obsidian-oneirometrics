/**
 * LoggingPluginAdapter - Compatibility layer for the old logging system
 * 
 * This adapter provides compatibility with the old logging system,
 * forwarding calls to the new system.
 */

import { App, Notice } from 'obsidian';
import { 
  LogLevel, 
  ErrorContext,
  EnrichedError
} from './LoggerTypes';
import { Logger } from './core/Logger';
import { LogManager } from './core/LogManager';
import { getLogger } from './index';

/**
 * Legacy adapter class to maintain compatibility
 * with existing code using the old logging system.
 */
export class LoggingAdapter {
    // Properties to match the old interface
    logLevel: LogLevel = 'info';
    logFile: string = '';
    maxSize: number = 0;
    maxBackups: number = 0;
    
    // Reference to the new logger
    private logger: Logger;
    
    /**
     * Create a new adapter
     */
    constructor(name: string = 'LegacyAdapter') {
        this.logger = LogManager.getInstance().getLogger(name) as Logger;
    }
    
    /**
     * Configure the logger with the specified settings
     */
    configure(level: LogLevel, maxSize: number = 0, maxBackups: number = 0): void {
        this.logLevel = level;
        this.maxSize = maxSize;
        this.maxBackups = maxBackups;
        
        // Update the configuration in the log manager
        LogManager.getInstance().configure({
            level: level,
            maxSize: maxSize,
            maxBackups: maxBackups
        });
    }
    
    /**
     * Alternative configure method
     */
    configureWithOptions(config: {
        level: LogLevel;
        maxLogSize?: number;
        maxSize?: number;
        maxBackups?: number;
        logFilePath?: string;
    }): void {
        this.logLevel = config.level;
        this.maxSize = config.maxSize || 0;
        this.maxBackups = config.maxBackups || 0;
        this.logFile = config.logFilePath || '';
        
        // Update the configuration in the log manager
        LogManager.getInstance().configure({
            level: config.level,
            maxSize: config.maxSize,
            maxBackups: config.maxBackups,
            logFilePath: config.logFilePath,
            enableFile: !!config.logFilePath
        });
    }
    
    /**
     * Log a message (generic method)
     */
    log(category: string, message: string, data?: any): void {
        this.logger.debug(category, message, data);
    }
    
    /**
     * Log an error message
     */
    error(category: string, message: string, error?: any): void {
        this.logger.error(category, message, error);
    }
    
    /**
     * Log a warning message
     */
    warn(category: string, message: string, data?: any): void {
        this.logger.warn(category, message, data);
    }
    
    /**
     * Log an info message
     */
    info(category: string, message: string, data?: any): void {
        this.logger.info(category, message, data);
    }
    
    /**
     * Log a debug message
     */
    debug(category: string, message: string, data?: any): void {
        this.logger.debug(category, message, data);
    }
    
    /**
     * Log a trace message
     */
    trace(category: string, message: string, data?: any): void {
        this.logger.trace(category, message, data);
    }
    
    /**
     * Enrich an error with context information
     */
    enrichError(error: Error, context: Partial<ErrorContext>): EnrichedError {
        return this.logger.enrichError(error, context);
    }
    
    /**
     * Wrap an error with a new message and context
     */
    wrapError(originalError: Error, message: string, context: Partial<ErrorContext>): EnrichedError {
        return this.logger.wrapError(originalError, message, context);
    }
    
    /**
     * Factory method to get a global logger instance
     */
    static getGlobalLogger(): LoggingAdapter {
        if (typeof window !== 'undefined' && (window as any).globalLogger) {
            return (window as any).globalLogger;
        }
        
        const adapter = new LoggingAdapter('GlobalAdapter');
        
        // Store on window for global access
        if (typeof window !== 'undefined') {
            (window as any).globalLogger = adapter;
        }
        
        return adapter;
    }
} 
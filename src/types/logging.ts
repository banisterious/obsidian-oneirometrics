/**
 * Logging types for OneiroMetrics
 * 
 * This file contains logging-related type definitions used throughout the plugin,
 * ensuring consistency with the logging service in src/logging.
 */

/**
 * Available logging levels from least verbose to most verbose
 */
export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

/**
 * Numeric values for log levels, used for comparison
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
 * Interface representing logging configuration
 */
export interface LoggingSettings {
    /** The current log level */
    level: LogLevel;
    
    /** Maximum log file size in bytes */
    maxSize?: number;
    
    /** Maximum number of log backups to keep */
    maxBackups?: number;
    
    /** Alternative name for maxSize used in some legacy code */
    maxLogSize?: number;
    
    /** Path to the log file */
    logFilePath?: string;
}

/**
 * Default logging configuration
 */
export const DEFAULT_LOGGING: LoggingSettings = {
    level: 'off',
    maxSize: 1024 * 1024 * 5, // 5MB
    maxBackups: 3
}; 
import { App, Notice } from 'obsidian';
import { LogLevel, LoggerConfig } from './LoggingInterfaces';
import { LoggingService } from './LoggingService';
import { LegacyLoggerAdapter } from './adapters/LegacyLoggerAdapter';

/**
 * Adapter class that bridges the old Logger implementation and the new LoggingService.
 * This allows us to gradually transition to the new implementation while maintaining
 * backward compatibility with the existing codebase.
 */
export class LoggingAdapter {
    private loggingService: LoggingService;
    private legacyLogger: LegacyLoggerAdapter;
    
    // Expose the same properties as the legacy Logger
    logLevel: LogLevel = 'off';
    logFile: string = 'oom-debug-log.txt';
    maxSize: number = 1024 * 1024; // 1MB
    maxBackups: number = 5;
    
    /**
     * Create a new LoggingAdapter instance.
     * @param app The Obsidian app instance
     */
    constructor(app: App) {
        this.loggingService = LoggingService.getInstance(app);
        this.legacyLogger = LegacyLoggerAdapter.getInstance(app);
    }
    
    /**
     * Configure the logger with the specified settings.
     * @param level The log level
     * @param maxSize Maximum log file size before rotation
     * @param maxBackups Maximum number of log backups to keep
     */
    configure(level: LogLevel, maxSize: number = 1024 * 1024, maxBackups: number = 5) {
        // Configure legacy logger for backward compatibility
        this.legacyLogger.configure(level, maxSize, maxBackups);
        
        // Configure new logging service
        this.logLevel = level;
        this.maxSize = maxSize;
        this.maxBackups = maxBackups;
        
        this.loggingService.configure({
            level: level,
            maxSize: maxSize,
            maxLogSize: maxSize, // Add maxLogSize for backward compatibility
            maxBackups: maxBackups,
            enableFileLogging: false // Disable file logging
        });
    }
    
    /**
     * Alternative configure method that accepts a LoggerConfig object
     * @param config The logging configuration
     */
    configureWithOptions(config: LoggerConfig) {
        // Ensure backward compatibility between maxSize and maxLogSize
        const maxSize = config.maxSize ?? config.maxLogSize ?? this.maxSize;
        
        // Set up a complete config with file logging disabled
        const fullConfig: LoggerConfig = {
            level: config.level,
            maxSize: maxSize,
            maxLogSize: maxSize,
            maxBackups: config.maxBackups ?? this.maxBackups,
            logFilePath: config.logFilePath,
            enableFileLogging: false // Explicitly disable file logging
        };
        
        // Configure the logging service directly with the full config
        this.loggingService.configure(fullConfig);
        
        // Update local properties for backward compatibility
        this.logLevel = config.level;
        this.maxSize = maxSize;
        this.maxBackups = fullConfig.maxBackups;
        if (config.logFilePath) {
            this.logFile = config.logFilePath;
        }
    }
    
    /**
     * Log a message at the specified level.
     * @param category The logging category
     * @param message The message to log
     * @param data Optional data to include in the log
     */
    log(category: string, message: string, data?: any) {
        // Log using both systems
        this.legacyLogger.log(category, message, data);
        this.loggingService.info(category, message, data); // Use info level as default
    }
    
    /**
     * Log an error message.
     * @param category The logging category
     * @param message The error message
     * @param error Optional error object or data
     */
    error(category: string, message: string, error?: any) {
        // Log error using both systems
        this.legacyLogger.error(category, message, error);
        this.loggingService.error(category, message, error);
    }
    
    /**
     * Log a warning message.
     * @param category The logging category
     * @param message The warning message
     * @param data Optional data to include in the log
     */
    warn(category: string, message: string, data?: any) {
        // Log warning using both systems
        this.legacyLogger.warn(category, message, data);
        this.loggingService.warn(category, message, data);
    }
    
    /**
     * Log an info message.
     * @param category The logging category
     * @param message The info message
     * @param data Optional data to include in the log
     */
    info(category: string, message: string, data?: any) {
        // Log info message using both systems
        this.legacyLogger.log(category, message, data); // Legacy logger doesn't have info level
        this.loggingService.info(category, message, data);
    }
    
    /**
     * Log a debug message.
     * @param category The logging category
     * @param message The debug message
     * @param data Optional data to include in the log
     */
    debug(category: string, message: string, data?: any) {
        // Log debug message using both systems
        this.legacyLogger.log(category, message, data); // Legacy logger doesn't have debug level
        this.loggingService.debug(category, message, data);
    }
    
    /**
     * Log a trace message.
     * @param category The logging category
     * @param message The trace message
     * @param data Optional data to include in the log
     */
    trace(category: string, message: string, data?: any) {
        // Log trace message (only in new logger since legacy doesn't support it)
        this.legacyLogger.log(category, message, data); // Use regular log for legacy
        this.loggingService.trace(category, message, data);
    }
    
    /**
     * Enrich an error with context information.
     * @param error The error to enrich
     * @param context The context information
     * @returns The enriched error
     */
    enrichError(error: Error, context: {component: string, operation: string, metadata?: Record<string, any>}): Error {
        // Create enriched error (this is a new feature only available in the new logger)
        const enrichedError = new Error(error.message);
        enrichedError.name = error.name;
        enrichedError.stack = error.stack;
        (enrichedError as any).context = {
            ...context,
            timestamp: Date.now()
        };
        (enrichedError as any).originalError = error;
        
        return enrichedError;
    }
    
    /**
     * Wrap an error with a new message and context.
     * @param originalError The original error
     * @param message The new error message
     * @param context The context information
     * @returns The wrapped error
     */
    wrapError(originalError: Error, message: string, context: {component: string, operation: string, metadata?: Record<string, any>}): Error {
        // Create wrapped error (this is a new feature only available in the new logger)
        const wrappedError = this.enrichError(new Error(message), context);
        (wrappedError as any).originalError = originalError;
        
        return wrappedError;
    }
} 
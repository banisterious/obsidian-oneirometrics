import { App, Notice, TFile } from 'obsidian';
import { 
  ILoggingService, 
  LogLevel, 
  LogLevelValue, 
  LoggerConfig, 
  ErrorContext, 
  EnrichedError,
  ILoggingServiceFactory 
} from './LoggingInterfaces';

/**
 * Maps log level strings to their numeric values for comparison.
 */
const LOG_LEVEL_MAP: Record<LogLevel, LogLevelValue> = {
  'off': LogLevelValue.OFF,
  'error': LogLevelValue.ERROR,
  'warn': LogLevelValue.WARN,
  'info': LogLevelValue.INFO,
  'debug': LogLevelValue.DEBUG,
  'trace': LogLevelValue.TRACE
};

/**
 * Implementation of the ILoggingService interface.
 */
export class LoggingService implements ILoggingService {
  private static instance: LoggingService;
  private logLevel: LogLevel = 'off';
  private logFile: string = 'logs/oom-debug-log.txt';
  private maxSize: number = 1024 * 1024; // 1MB
  private maxBackups: number = 5;
  private app: App;
  private isHandlingError: boolean = false;
  private enableFileLogging: boolean = false; // Disabled by default

  /**
   * Private constructor to enforce singleton pattern.
   * @param app The Obsidian app instance
   */
  private constructor(app: App) {
    this.app = app;
    
    // Initialize logger with safe defaults
    this.logLevel = 'info'; // Start with info level by default
    
    // Set default log file path based on vault path
    this.initializeLogPath();
  }

  /**
   * Get the singleton instance of the logging service.
   * @param app The Obsidian app instance
   * @returns The LoggingService instance
   */
  static getInstance(app: App): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService(app);
    }
    return LoggingService.instance;
  }

  /**
   * Configure the logging service.
   * @param config The logger configuration
   */
  configure(config: LoggerConfig): void {
    this.logLevel = config.level;
    
    // Support both maxSize and maxLogSize for backward compatibility
    if (config.maxSize !== undefined) {
      this.maxSize = config.maxSize;
    } else if (config.maxLogSize !== undefined) {
      this.maxSize = config.maxLogSize;
    }
    
    if (config.maxBackups !== undefined) {
      this.maxBackups = config.maxBackups;
    }
    
    if (config.logFilePath) {
      this.logFile = config.logFilePath;
    }
    
    // Set file logging flag if provided
    if (config.enableFileLogging !== undefined) {
      this.enableFileLogging = config.enableFileLogging;
    }
    
    this.debug('Logger', `Logger configured with level=${config.level}, fileLogging=${this.enableFileLogging}, maxSize=${this.maxSize}, maxBackups=${this.maxBackups}, logFile=${this.logFile}`);
  }

  /**
   * Check if a log message at the specified level should be logged.
   * @param level The log level to check
   * @returns True if the message should be logged, false otherwise
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.logLevel === 'off') return false;
    return LOG_LEVEL_MAP[level] <= LOG_LEVEL_MAP[this.logLevel];
  }

  /**
   * Internal method for logging system errors without infinite recursion
   * @param message The error message
   * @param error The error object
   */
  private logInternalError(message: string, error?: any): void {
    // Prevent infinite recursion with a flag
    if (this.isHandlingError) return;
    
    this.isHandlingError = true;
    try {
      const errorMessage = `LoggingService internal error: ${message}`;
      const details = error ? ` - ${error.message || JSON.stringify(error)}` : '';
      const fullMessage = errorMessage + details;
      
      // Fallback to console.error for internal logging errors
      console.error(fullMessage);
      if (error && error.stack) {
        console.error(error.stack);
      }
    } finally {
      this.isHandlingError = false;
    }
  }

  /**
   * Write a message to the log file.
   * @param message The message to write
   */
  private async writeToLog(message: string): Promise<void> {
    // Skip file logging if disabled
    if (!this.enableFileLogging) return;

    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;
      
      // Ensure logs directory exists
      const logsDir = this.logFile.substring(0, this.logFile.lastIndexOf('/'));
      if (logsDir && !(await this.app.vault.adapter.exists(logsDir))) {
        try {
          await this.app.vault.adapter.mkdir(logsDir);
          this.logInternalError(`Created logs directory: ${logsDir}`);
        } catch (mkdirError) {
          this.logInternalError(`Failed to create logs directory: ${logsDir}`, mkdirError);
          
          // Try using Obsidian's createFolder API as a fallback
          try {
            await this.app.vault.createFolder(logsDir);
            this.logInternalError(`Created logs directory using Obsidian API: ${logsDir}`);
          } catch (folderError) {
            this.logInternalError(`Failed to create logs directory using Obsidian API: ${logsDir}`, folderError);
          }
        }
      }
      
      // Check log size and rotate if needed
      const logExists = await this.app.vault.adapter.exists(this.logFile);
      if (logExists) {
        const logSize = (await this.app.vault.adapter.read(this.logFile)).length;
        if (logSize > this.maxSize) {
          await this.rotateLog();
        }
      }

      // Append to log file
      await this.app.vault.adapter.append(this.logFile, logEntry);
    } catch (error) {
      this.logInternalError('Failed to write to log', error);
    }
  }

  /**
   * Rotate the log file when it exceeds the maximum size.
   */
  private async rotateLog(): Promise<void> {
    // Skip if file logging is disabled
    if (!this.enableFileLogging) return;

    try {
      // Check if the log file exists before attempting to rotate
      const logExists = await this.app.vault.adapter.exists(this.logFile);
      if (!logExists) {
        this.logInternalError(`Log file doesn't exist for rotation: ${this.logFile}`);
        return; // Exit early if the log file doesn't exist
      }

      // Create backup with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${this.logFile}.${timestamp}.bak`;
      
      // Ensure the logs directory exists
      const logsDir = this.logFile.substring(0, this.logFile.lastIndexOf('/'));
      if (logsDir && !(await this.app.vault.adapter.exists(logsDir))) {
        try {
          await this.app.vault.adapter.mkdir(logsDir);
          this.logInternalError(`Created logs directory during rotation: ${logsDir}`);
        } catch (mkdirError) {
          this.logInternalError(`Failed to create logs directory during rotation: ${logsDir}`, mkdirError);
          return; // Exit if we can't create the directory
        }
      }

      // Check if backup file already exists (could happen with very rapid logging)
      const backupExists = await this.app.vault.adapter.exists(backupName);
      if (backupExists) {
        this.logInternalError(`Destination file already exists! Will create unique backup name instead`);
        // Add unique suffix to avoid conflicts
        const uniqueSuffix = Math.floor(Math.random() * 10000);
        const uniqueBackupName = `${backupName}.${uniqueSuffix}`;
        await this.app.vault.adapter.rename(this.logFile, uniqueBackupName);
      } else {
        // Rename current log to backup
        try {
          await this.app.vault.adapter.rename(this.logFile, backupName);
        } catch (renameError) {
          this.logInternalError(`Failed to rename log file, will try a copy+delete approach`, renameError);
          
          // Fallback approach: read, write to new file, then delete old
          try {
            const content = await this.app.vault.adapter.read(this.logFile);
            await this.app.vault.adapter.write(backupName, content);
            await this.app.vault.adapter.remove(this.logFile);
            this.logInternalError(`Successfully backed up log using copy+delete approach`);
          } catch (fallbackError) {
            this.logInternalError(`Failed backup using fallback approach`, fallbackError);
            // Just create an empty log file and continue
            await this.app.vault.adapter.write(this.logFile, '');
            return;
          }
        }
      }

      // Clean up old backups
      try {
        const files = await this.app.vault.adapter.list(logsDir || '');
        const logFileName = this.logFile.substring(this.logFile.lastIndexOf('/') + 1);
        
        const backups = files.files
          .filter((file: string) => file.startsWith(logFileName + '.') && file.endsWith('.bak'))
          .sort((a: string, b: string) => b.localeCompare(a));

        // Remove excess backups
        for (let i = this.maxBackups; i < backups.length; i++) {
          const fullPath = logsDir ? `${logsDir}/${backups[i]}` : backups[i];
          await this.app.vault.adapter.remove(fullPath);
        }
      } catch (listError) {
        this.logInternalError('Failed to list log backups for cleanup', listError);
      }
    } catch (error) {
      this.logInternalError('Failed to rotate log', error);
    }
  }

  /**
   * Log a message with the specified level.
   * @param level The log level
   * @param category The log category/component
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  private log(level: LogLevel, category: string, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const prefix = level === 'error' ? 'ERROR' : 
                   level === 'warn' ? 'WARNING' : 
                   level.toUpperCase();
    
    const logMessage = `[${prefix}][${category}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
    
    // Log to console with appropriate method
    if (level === 'error') {
      console.error(logMessage);
    } else if (level === 'warn') {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
    
    // Write to log file if file logging is enabled
    this.writeToLog(logMessage);
    
    // Show notice for errors
    if (level === 'error') {
      new Notice(`OneiroMetrics Error: ${message}`);
    }
  }

  /**
   * Log a message at the debug level.
   * @param category The log category/component
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  debug(category: string, message: string, data?: any): void {
    this.log('debug', category, message, data);
  }

  /**
   * Log a message at the info level.
   * @param category The log category/component
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  info(category: string, message: string, data?: any): void {
    this.log('info', category, message, data);
  }

  /**
   * Log a message at the warn level.
   * @param category The log category/component
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  warn(category: string, message: string, data?: any): void {
    this.log('warn', category, message, data);
  }

  /**
   * Log a message at the error level.
   * @param category The log category/component
   * @param message The message to log
   * @param error Optional error to include in the log
   */
  error(category: string, message: string, error?: any): void {
    this.log('error', category, message, error);
  }

  /**
   * Log a message at the trace level.
   * @param category The log category/component
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  trace(category: string, message: string, data?: any): void {
    this.log('trace', category, message, data);
  }

  /**
   * Enriches an error with additional context.
   * @param error The original error.
   * @param context The context to add to the error.
   * @returns The enriched error.
   */
  enrichError(error: Error, context: Partial<ErrorContext>): EnrichedError {
    const enriched = error as EnrichedError;
    enriched.context = {
      component: context.component || 'unknown',
      operation: context.operation || 'unknown',
      timestamp: context.timestamp || Date.now(),
      metadata: context.metadata || {}
    };
    return enriched;
  }

  /**
   * Creates a new error that wraps an original error with additional context.
   * @param originalError The original error.
   * @param message The new error message.
   * @param context The context to add to the error.
   * @returns The wrapped error.
   */
  wrapError(originalError: Error, message: string, context: Partial<ErrorContext>): EnrichedError {
    const wrapped = new Error(message) as EnrichedError;
    wrapped.originalError = originalError;
    wrapped.stack = `${wrapped.stack}\nCaused by: ${originalError.stack}`;
    wrapped.context = {
      component: context.component || 'unknown',
      operation: context.operation || 'unknown',
      timestamp: context.timestamp || Date.now(),
      metadata: context.metadata || {}
    };
    return wrapped;
  }

  /**
   * Initialize the log file path and ensure directory exists
   */
  private async initializeLogPath(): Promise<void> {
    // Skip if file logging is disabled
    if (!this.enableFileLogging) return;

    try {
      // Normalize log path based on OS
      this.logFile = this.logFile.replace(/\\/g, '/');
      
      // Ensure logs directory exists
      const logsDir = this.logFile.substring(0, this.logFile.lastIndexOf('/'));
      
      if (logsDir) {
        // Check if directory exists, create if it doesn't
        const dirExists = await this.app.vault.adapter.exists(logsDir);
        if (!dirExists) {
          try {
            // Try to create the logs directory
            await this.app.vault.adapter.mkdir(logsDir);
            console.log(`[LoggingService] Created logs directory: ${logsDir}`);
          } catch (mkdirError) {
            console.error(`[LoggingService] Failed to create logs directory: ${logsDir}`, mkdirError);
            
            // Try using Obsidian's createFolder API as a fallback
            try {
              await this.app.vault.createFolder(logsDir);
              console.log(`[LoggingService] Created logs directory using Obsidian API: ${logsDir}`);
            } catch (folderError) {
              console.error(`[LoggingService] Failed to create logs directory using Obsidian API: ${logsDir}`, folderError);
            }
          }
        }
      }
    } catch (error) {
      console.error(`[LoggingService] Error initializing log path: ${error}`);
    }
  }
}

/**
 * Factory implementation for creating logging service instances.
 */
export class LoggingServiceFactory implements ILoggingServiceFactory {
  /**
   * Creates a logging service.
   * @param app The Obsidian app instance.
   * @returns A logging service instance.
   */
  createLoggingService(app: App): ILoggingService {
    return LoggingService.getInstance(app);
  }
} 
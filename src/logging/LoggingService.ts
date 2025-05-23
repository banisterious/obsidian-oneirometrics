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
  'errors': LogLevelValue.ERRORS,
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
  private maxLogSize: number = 1024 * 1024; // 1MB
  private maxBackups: number = 5;
  private app: App;

  /**
   * Private constructor to enforce singleton pattern.
   * @param app The Obsidian app instance
   */
  private constructor(app: App) {
    this.app = app;
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
    
    if (config.maxLogSize !== undefined) {
      this.maxLogSize = config.maxLogSize;
    }
    
    if (config.maxBackups !== undefined) {
      this.maxBackups = config.maxBackups;
    }
    
    if (config.logFilePath) {
      this.logFile = config.logFilePath;
    }
    
    this.debug('Logger', `Logger configured with level=${config.level}, maxLogSize=${this.maxLogSize}, maxBackups=${this.maxBackups}, logFile=${this.logFile}`);
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
   * Write a message to the log file.
   * @param message The message to write
   */
  private async writeToLog(message: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;
      
      // Ensure logs directory exists
      const logsDir = this.logFile.substring(0, this.logFile.lastIndexOf('/'));
      if (logsDir && !(await this.app.vault.adapter.exists(logsDir))) {
        await this.app.vault.adapter.mkdir(logsDir);
      }
      
      // Check log size and rotate if needed
      const logExists = await this.app.vault.adapter.exists(this.logFile);
      if (logExists) {
        const logSize = (await this.app.vault.adapter.read(this.logFile)).length;
        if (logSize > this.maxLogSize) {
          await this.rotateLog();
        }
      }

      // Append to log file
      await this.app.vault.adapter.append(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log:', error);
    }
  }

  /**
   * Rotate the log file when it exceeds the maximum size.
   */
  private async rotateLog(): Promise<void> {
    try {
      // Create backup with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${this.logFile}.${timestamp}.bak`;
      
      // Rename current log to backup
      await this.app.vault.adapter.rename(this.logFile, backupName);

      // Clean up old backups
      const logsDir = this.logFile.substring(0, this.logFile.lastIndexOf('/'));
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
    } catch (error) {
      console.error('Failed to rotate log:', error);
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

    const prefix = level === 'errors' ? 'ERROR' : 
                   level === 'warn' ? 'WARNING' : 
                   level.toUpperCase();
    
    const logMessage = `[${prefix}][${category}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
    
    // Log to console with appropriate method
    if (level === 'errors') {
      console.error(logMessage);
    } else if (level === 'warn') {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
    }
    
    // Write to log file
    this.writeToLog(logMessage);
    
    // Show notice for errors
    if (level === 'errors') {
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
    this.log('errors', category, message, error);
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
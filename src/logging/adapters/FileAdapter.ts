/**
 * FileAdapter - Log adapter for file output
 * 
 * This adapter writes log messages to a file with rotation support.
 */

import { App, TFile } from 'obsidian';
import { LogAdapter, LogEntry, LogFormatter } from '../LoggerTypes';
import { StandardFormatter } from '../formatters/StandardFormatter';

/**
 * Configuration for the file adapter
 */
export interface FileAdapterConfig {
  filePath: string;
  maxSize?: number;
  maxBackups?: number;
  formatter?: LogFormatter;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Partial<FileAdapterConfig> = {
  maxSize: 1024 * 1024, // 1MB
  maxBackups: 5
};

/**
 * File output adapter for logging
 */
export class FileAdapter implements LogAdapter {
  private app: App;
  private formatter: LogFormatter;
  private config: FileAdapterConfig;
  private buffer: string[] = [];
  private flushPromise: Promise<void> | null = null;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  private isHandlingInternalError = false;
  
  /**
   * Create a new file adapter
   * 
   * @param app The Obsidian app instance
   * @param config The adapter configuration
   */
  constructor(app: App, config: FileAdapterConfig) {
    this.app = app;
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    this.formatter = config.formatter || new StandardFormatter();
    
    // Start periodic flush
    this.flushTimer = setInterval(() => this.flush(), this.FLUSH_INTERVAL);
  }

  /**
   * Handle internal errors without risking recursive loops
   * @param message Error message
   * @param error Error object
   */
  private logInternalError(message: string, error?: any): void {
    // Prevent recursive error handling
    if (this.isHandlingInternalError) return;
    
    try {
      this.isHandlingInternalError = true;
      const errorMessage = `FileAdapter internal error: ${message}`;
      const details = error ? ` - ${error.message || JSON.stringify(error)}` : '';
      
      // Safely log to console as a last resort
      console.error(errorMessage + details);
      if (error && error.stack) {
        console.error(error.stack);
      }
    } finally {
      this.isHandlingInternalError = false;
    }
  }
  
  /**
   * Write a log entry to the file
   */
  log(entry: LogEntry): void {
    const formattedMessage = this.formatter.format(entry);
    this.buffer.push(formattedMessage);
    
    // Add error details if present
    if (entry.error) {
      this.buffer.push(`Error: ${entry.error.message}`);
      if (entry.error.stack) {
        this.buffer.push(`Stack: ${entry.error.stack}`);
      }
    }
    
    // Add data if present
    if (entry.data) {
      try {
        const dataStr = typeof entry.data === 'string' 
          ? entry.data 
          : JSON.stringify(entry.data, null, 2);
        this.buffer.push(`Data: ${dataStr}`);
      } catch (error) {
        this.buffer.push(`Data: [Could not stringify: ${error}]`);
      }
    }
    
    // Add a blank line for readability
    this.buffer.push('');
  }
  
  /**
   * Flush the buffer to the file
   */
  async flush(): Promise<void> {
    // If already flushing, wait for that to complete
    if (this.flushPromise) {
      return this.flushPromise;
    }
    
    // If buffer is empty, nothing to do
    if (this.buffer.length === 0) {
      return Promise.resolve();
    }
    
    // Create a local copy of the buffer and clear it
    const bufferToFlush = [...this.buffer];
    this.buffer = [];
    
    // Create the flush promise
    this.flushPromise = this.writeToFile(bufferToFlush.join('\n'))
      .finally(() => {
        this.flushPromise = null;
      });
    
    return this.flushPromise;
  }
  
  /**
   * Write content to the log file
   */
  private async writeToFile(content: string): Promise<void> {
    try {
      // Ensure logs directory exists
      const logsDir = this.config.filePath.substring(0, this.config.filePath.lastIndexOf('/'));
      if (logsDir && !(await this.app.vault.adapter.exists(logsDir))) {
        await this.app.vault.adapter.mkdir(logsDir);
      }
      
      // Check log size and rotate if needed
      const logExists = await this.app.vault.adapter.exists(this.config.filePath);
      if (logExists) {
        const logSize = (await this.app.vault.adapter.read(this.config.filePath)).length;
        if (logSize > (this.config.maxSize || DEFAULT_CONFIG.maxSize!)) {
          await this.rotateLog();
        }
      }
      
      // Append to log file
      await this.app.vault.adapter.append(this.config.filePath, content + '\n');
    } catch (error) {
      this.logInternalError('Failed to write to log file', error);
    }
  }
  
  /**
   * Rotate the log file
   */
  private async rotateLog(): Promise<void> {
    try {
      // Create backup with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `${this.config.filePath}.${timestamp}.bak`;
      
      // Rename current log to backup
      await this.app.vault.adapter.rename(this.config.filePath, backupName);
      
      // Clean up old backups
      const logsDir = this.config.filePath.substring(0, this.config.filePath.lastIndexOf('/'));
      const files = await this.app.vault.adapter.list(logsDir || '');
      const logFileName = this.config.filePath.substring(this.config.filePath.lastIndexOf('/') + 1);
      
      const backups = files.files
        .filter((file: string) => file.startsWith(logFileName + '.') && file.endsWith('.bak'))
        .sort((a: string, b: string) => b.localeCompare(a));
      
      // Remove excess backups
      const maxBackups = this.config.maxBackups || DEFAULT_CONFIG.maxBackups!;
      for (let i = maxBackups; i < backups.length; i++) {
        const fullPath = logsDir ? `${logsDir}/${backups[i]}` : backups[i];
        await this.app.vault.adapter.remove(fullPath);
      }
    } catch (error) {
      this.logInternalError('Failed to rotate log', error);
    }
  }
  
  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    // Clear the flush timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Flush any remaining messages
    await this.flush();
  }
} 
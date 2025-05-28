/**
 * NoticeAdapter - Log adapter for Obsidian notices
 * 
 * This adapter shows log messages as Obsidian notices.
 */

import { Notice } from 'obsidian';
import { LogAdapter, LogEntry, LogFormatter, LogLevel } from '../LoggerTypes';
import { StandardFormatter } from '../formatters/StandardFormatter';

/**
 * Configuration for notice adapter
 */
export interface NoticeAdapterConfig {
  formatter?: LogFormatter;
  minLevel?: LogLevel;
  showCategory?: boolean;
  timeout?: number;
  errorTimeout?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: NoticeAdapterConfig = {
  minLevel: 'warn',
  showCategory: true,
  timeout: 5000,
  errorTimeout: 10000
};

/**
 * Notice adapter for displaying log messages as Obsidian notices
 */
export class NoticeAdapter implements LogAdapter {
  private formatter: LogFormatter;
  private config: NoticeAdapterConfig;
  
  /**
   * Create a new notice adapter
   * 
   * @param config The adapter configuration
   */
  constructor(config: NoticeAdapterConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
    this.formatter = config.formatter || new StandardFormatter();
  }
  
  /**
   * Show a log entry as a notice
   */
  log(entry: LogEntry): void {
    // Check if this message should be shown as a notice
    if (this.shouldShowNotice(entry.level)) {
      const message = this.formatNoticeMessage(entry);
      const timeout = entry.level === 'error' ? 
        this.config.errorTimeout : 
        this.config.timeout;
      
      new Notice(message, timeout);
    }
  }
  
  /**
   * Check if this log level should be shown as a notice
   */
  private shouldShowNotice(level: LogLevel): boolean {
    const levelMap: Record<LogLevel, number> = {
      'off': 0,
      'error': 1,
      'warn': 2,
      'info': 3,
      'debug': 4,
      'trace': 5
    };
    
    const minLevel = this.config.minLevel || DEFAULT_CONFIG.minLevel!;
    return levelMap[level] <= levelMap[minLevel];
  }
  
  /**
   * Format a log entry for display in a notice
   */
  private formatNoticeMessage(entry: LogEntry): string {
    let prefix = '';
    
    // Add level prefix for error/warning
    if (entry.level === 'error') {
      prefix = '❌ Error: ';
    } else if (entry.level === 'warn') {
      prefix = '⚠️ Warning: ';
    }
    
    // Add category if configured
    let categoryPrefix = '';
    if (this.config.showCategory && entry.category) {
      categoryPrefix = `[${entry.category}] `;
    }
    
    return `${prefix}${categoryPrefix}${entry.message}`;
  }
  
  /**
   * Flush the adapter (no-op for notices)
   */
  async flush(): Promise<void> {
    // No buffering in notice adapter
    return Promise.resolve();
  }
  
  /**
   * Dispose of resources (no-op for notices)
   */
  async dispose(): Promise<void> {
    // No resources to dispose
    return Promise.resolve();
  }
} 
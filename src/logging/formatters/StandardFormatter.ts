/**
 * StandardFormatter - Default log message formatter
 * 
 * This formatter provides the standard formatting for log messages.
 */

import { LogEntry, LogFormatter } from '../LoggerTypes';

/**
 * Standard formatter for log messages
 */
export class StandardFormatter implements LogFormatter {
  /**
   * Format a log entry as a string
   */
  format(entry: LogEntry): string {
    const timestamp = this.formatTimestamp(entry.timestamp);
    const level = this.formatLevel(entry.level);
    return `[${timestamp}] ${level} [${entry.category}] ${entry.message}`;
  }
  
  /**
   * Format a timestamp as a string
   */
  private formatTimestamp(date: Date): string {
    return date.toISOString();
  }
  
  /**
   * Format a log level as a string
   */
  private formatLevel(level: string): string {
    return level.toUpperCase().padEnd(5);
  }
} 
/**
 * ConsoleAdapter - Log adapter for console output
 * 
 * This adapter sends log messages to the browser console.
 * 
 * IMPORTANT: This file contains intentional and necessary console.* statements.
 * These are NOT targets for replacement with structured logging, as this class
 * IS the structured logging implementation for console output.
 * 
 * The console statements in this file are the final destination in the logging
 * pipeline - they represent the actual output mechanism, not ad-hoc logging.
 */

import { LogAdapter, LogEntry, LogFormatter } from '../LoggerTypes';
import { StandardFormatter } from '../formatters/StandardFormatter';

/**
 * Console output adapter for logging
 */
export class ConsoleAdapter implements LogAdapter {
  private formatter: LogFormatter;
  
  /**
   * Create a new console adapter
   * 
   * @param formatter The formatter to use for log messages
   */
  constructor(formatter?: LogFormatter) {
    this.formatter = formatter || new StandardFormatter();
  }
  
  /**
   * Write a log entry to the console
   * 
   * INTENTIONAL CONSOLE USAGE: This adapter is specifically designed to output
   * to the console, so these console.* calls are required and should not be
   * replaced with structured logging calls.
   */
  log(entry: LogEntry): void {
    const formattedMessage = this.formatter.format(entry);
    
    // INTENTIONAL CONSOLE USAGE: These statements are the actual logging implementation
    switch (entry.level) {
      case 'error':
        console.error(formattedMessage);
        if (entry.error) {
          console.error(entry.error);
        }
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'trace':
        console.trace(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
    
    // INTENTIONAL CONSOLE USAGE: Log data object separately if present
    if (entry.data && entry.level !== 'error') {
      console.log(entry.data);
    }
  }
  
  /**
   * Flush the adapter (no-op for console)
   */
  async flush(): Promise<void> {
    // No buffering in console adapter
    return Promise.resolve();
  }
  
  /**
   * Dispose of resources (no-op for console)
   */
  async dispose(): Promise<void> {
    // No resources to dispose
    return Promise.resolve();
  }
} 
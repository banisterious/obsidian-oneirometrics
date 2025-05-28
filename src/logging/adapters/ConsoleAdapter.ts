/**
 * ConsoleAdapter - Log adapter for console output
 * 
 * This adapter sends log messages to the browser console.
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
   */
  log(entry: LogEntry): void {
    const formattedMessage = this.formatter.format(entry);
    
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
    
    // Log data object separately if present
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
/**
 * NullAdapter - No-op log adapter
 * 
 * This adapter discards all log messages.
 * It implements the Null Object Pattern for defensive coding.
 */

import { LogAdapter, LogEntry } from '../LoggerTypes';

/**
 * Null adapter that discards all log messages
 */
export class NullAdapter implements LogAdapter {
  /**
   * Discard a log entry
   */
  log(entry: LogEntry): void {
    // No-op
  }
  
  /**
   * Flush the adapter (no-op)
   */
  async flush(): Promise<void> {
    return Promise.resolve();
  }
  
  /**
   * Dispose of resources (no-op)
   */
  async dispose(): Promise<void> {
    return Promise.resolve();
  }
} 
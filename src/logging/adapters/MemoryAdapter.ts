/**
 * MemoryAdapter - Log adapter that stores logs in memory
 * 
 * This adapter keeps logs in memory for display in the log viewer modal.
 */

import { LogAdapter, LogEntry, LogLevel } from '../LoggerTypes';

/**
 * Configuration for the memory adapter
 */
export interface MemoryAdapterConfig {
  maxEntries?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MemoryAdapterConfig = {
  maxEntries: 1000  // Store up to 1000 log entries by default
};

/**
 * Memory adapter that keeps logs in memory for the log viewer
 */
export class MemoryAdapter implements LogAdapter {
  private entries: LogEntry[] = [];
  private config: MemoryAdapterConfig;
  
  /**
   * Create a new memory adapter
   * 
   * @param config The adapter configuration
   */
  constructor(config: MemoryAdapterConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config
    };
  }
  
  /**
   * Store a log entry in memory
   */
  log(entry: LogEntry): void {
    // Add to the beginning for most recent first
    this.entries.unshift(entry);
    
    // Trim if we exceed the maximum entries
    if (this.entries.length > (this.config.maxEntries || DEFAULT_CONFIG.maxEntries!)) {
      this.entries = this.entries.slice(0, this.config.maxEntries);
    }
  }
  
  /**
   * Flush the adapter (no-op for memory)
   */
  async flush(): Promise<void> {
    return Promise.resolve();
  }
  
  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    this.clear();
    return Promise.resolve();
  }
  
  /**
   * Get all log entries
   */
  getEntries(): LogEntry[] {
    return [...this.entries];
  }
  
  /**
   * Get log entries of a specific level
   */
  getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(entry => entry.level === level);
  }
  
  /**
   * Get log entries matching a category
   */
  getEntriesByCategory(category: string): LogEntry[] {
    return this.entries.filter(entry => 
      entry.category.toLowerCase().includes(category.toLowerCase())
    );
  }
  
  /**
   * Get log entries containing specific text
   */
  getEntriesByText(text: string): LogEntry[] {
    return this.entries.filter(entry => {
      const searchText = (entry.message + ' ' + JSON.stringify(entry.data || '')).toLowerCase();
      return searchText.includes(text.toLowerCase());
    });
  }
  
  /**
   * Clear all stored entries
   */
  clear(): void {
    this.entries = [];
  }
} 
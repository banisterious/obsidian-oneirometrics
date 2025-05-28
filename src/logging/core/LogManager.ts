/**
 * LogManager - Central management of logging functionality
 * 
 * This class serves as the central point for all logging operations.
 * It manages loggers, adapters, and configuration.
 */

import { App } from 'obsidian';
import { 
  ILogger, 
  LogAdapter, 
  LogConfig, 
  LogEntry, 
  LogLevel,
  LOG_LEVEL_MAP
} from '../LoggerTypes';
import { Logger } from './Logger';

/**
 * Manages all logging functionality
 */
export class LogManager {
  private static instance: LogManager;
  private loggers: Map<string, Logger> = new Map();
  private adapters: LogAdapter[] = [];
  private config: LogConfig;
  private app?: App;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Default configuration
    this.config = {
      level: 'info',
      enableConsole: true,
      enableFile: false,
      enableNotices: false,
    };
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }
  
  /**
   * Set the Obsidian app instance
   */
  public setApp(app: App): void {
    this.app = app;
  }
  
  /**
   * Get the Obsidian app instance
   */
  public getApp(): App | undefined {
    return this.app;
  }
  
  /**
   * Add a log adapter for output
   */
  public addAdapter(adapter: LogAdapter): void {
    this.adapters.push(adapter);
  }
  
  /**
   * Remove all adapters
   */
  public clearAdapters(): void {
    this.adapters = [];
  }
  
  /**
   * Get or create a logger with the specified name
   */
  public getLogger(name: string): Logger {
    if (this.loggers.has(name)) {
      return this.loggers.get(name)!;
    }
    
    const logger = new Logger(name, this);
    this.loggers.set(name, logger);
    return logger;
  }
  
  /**
   * Configure logging with the specified options
   */
  public configure(config: LogConfig): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
  
  /**
   * Get the current configuration
   */
  public getConfig(): LogConfig {
    return { ...this.config };
  }
  
  /**
   * Check if a message at the specified level should be logged
   */
  public shouldLog(level: LogLevel): boolean {
    if (this.config.level === 'off') return false;
    return LOG_LEVEL_MAP[level] <= LOG_LEVEL_MAP[this.config.level];
  }
  
  /**
   * Write a log entry to all adapters
   */
  public log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;
    
    // Forward to all adapters
    for (const adapter of this.adapters) {
      try {
        adapter.log(entry);
      } catch (error) {
        console.error('Error in log adapter:', error);
      }
    }
  }
  
  /**
   * Flush all adapters
   */
  public async flush(): Promise<void> {
    for (const adapter of this.adapters) {
      try {
        await adapter.flush();
      } catch (error) {
        console.error('Error flushing log adapter:', error);
      }
    }
  }
  
  /**
   * Dispose of all resources
   */
  public async dispose(): Promise<void> {
    for (const adapter of this.adapters) {
      try {
        await adapter.dispose();
      } catch (error) {
        console.error('Error disposing log adapter:', error);
      }
    }
    this.adapters = [];
    this.loggers.clear();
  }
} 
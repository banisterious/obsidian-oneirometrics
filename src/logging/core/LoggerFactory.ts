/**
 * LoggerFactory - Creates and configures loggers
 * 
 * This class provides factory methods to create properly configured
 * loggers and adapters.
 */

import { App } from 'obsidian';
import { ILogger, LogConfig } from '../LoggerTypes';
import { LogManager } from './LogManager';
import { ConsoleAdapter } from '../adapters/ConsoleAdapter';
import { FileAdapter } from '../adapters/FileAdapter';
import { NoticeAdapter } from '../adapters/NoticeAdapter';
import { NullAdapter } from '../adapters/NullAdapter';
import { StandardFormatter } from '../formatters/StandardFormatter';

/**
 * Factory for creating loggers and adapters
 */
export class LoggerFactory {
  private manager: LogManager;
  private app?: App;
  
  /**
   * Create a new logger factory
   */
  constructor() {
    this.manager = LogManager.getInstance();
  }
  
  /**
   * Set the Obsidian app instance
   */
  setApp(app: App): void {
    this.app = app;
    this.manager.setApp(app);
  }
  
  /**
   * Initialize the logging system with the specified configuration
   */
  initialize(config: LogConfig): void {
    // Configure the manager
    this.manager.configure(config);
    
    // Clear existing adapters
    this.manager.clearAdapters();
    
    // Add console adapter if enabled
    if (config.enableConsole !== false) {
      this.manager.addAdapter(new ConsoleAdapter(new StandardFormatter()));
    }
    
    // Add file adapter if enabled
    if (config.enableFile && this.app && config.logFilePath) {
      this.manager.addAdapter(new FileAdapter(this.app, {
        filePath: config.logFilePath,
        maxSize: config.maxSize,
        maxBackups: config.maxBackups
      }));
    }
    
    // Add notice adapter if enabled
    if (config.enableNotices) {
      this.manager.addAdapter(new NoticeAdapter({
        minLevel: 'warn'
      }));
    }
  }
  
  /**
   * Get a logger with the specified name
   */
  getLogger(name: string): ILogger {
    return this.manager.getLogger(name);
  }
  
  /**
   * Get a logger for a component
   */
  getComponentLogger(component: any): ILogger {
    // If component is a class instance, use its constructor name
    if (component && component.constructor) {
      return this.manager.getLogger(component.constructor.name);
    }
    
    // If component is a string, use it directly
    if (typeof component === 'string') {
      return this.manager.getLogger(component);
    }
    
    // Otherwise, use a generic name
    return this.manager.getLogger('Component');
  }
  
  /**
   * Create a null logger that does nothing
   */
  createNullLogger(): ILogger {
    // Create a separate manager with only a null adapter
    const nullManager = LogManager.getInstance();
    nullManager.clearAdapters();
    nullManager.addAdapter(new NullAdapter());
    return nullManager.getLogger('null');
  }
} 
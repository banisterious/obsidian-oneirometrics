/**
 * LegacyLoggerAdapter - Adapter for backward compatibility with the old Logger class
 * 
 * This adapter maintains compatibility with code that expects the old Logger interface
 * while using the new modular logging system internally.
 */

import { App, Notice } from 'obsidian';
import { LogLevel, LogEntry } from '../LoggerTypes';
import { LogManager } from '../core/LogManager';
import { Logger } from '../core/Logger';

/**
 * Adapter to maintain compatibility with the old Logger class
 */
export class LegacyLoggerAdapter {
    private static instance: LegacyLoggerAdapter;
    private logManager: LogManager;
    private logger: Logger;

    /**
     * Create a new legacy logger adapter
     * @param app The Obsidian app instance
     */
    private constructor(app: App) {
        this.logManager = LogManager.getInstance();
        this.logManager.setApp(app);
        this.logger = this.logManager.getLogger('OneiroMetrics');
    }

    /**
     * Get the singleton instance of the LegacyLoggerAdapter
     * @param app The Obsidian app instance
     * @returns The singleton instance
     */
    static getInstance(app: App): LegacyLoggerAdapter {
        if (!LegacyLoggerAdapter.instance) {
            LegacyLoggerAdapter.instance = new LegacyLoggerAdapter(app);
        }
        return LegacyLoggerAdapter.instance;
    }

    /**
     * Configure the logger
     * @param level The log level
     * @param maxLogSize Maximum log file size (deprecated)
     * @param maxBackups Maximum backup count (deprecated)
     */
    configure(level: LogLevel, maxLogSize: number = 1024 * 1024, maxBackups: number = 5) {
        this.logManager.configure({ level });
    }

    /**
     * Log a message
     * @param category The log category
     * @param message The log message
     * @param data Optional data to include in the log
     */
    log(category: string, message: string, data?: any) {
        this.logger.info(`[${category}] ${message}`, data);
    }

    /**
     * Log an error
     * @param category The log category
     * @param message The error message
     * @param error Optional error to include in the log
     */
    error(category: string, message: string, error?: Error) {
        this.logger.error(`[${category}]`, message, error instanceof Error ? error : undefined);
        
        // Show notice for errors (mimicking old behavior)
        new Notice(`OneiroMetrics Error: ${message}`);
    }

    /**
     * Log a warning
     * @param category The log category
     * @param message The warning message
     * @param data Optional data to include in the log
     */
    warn(category: string, message: string, data?: any) {
        this.logger.warn(`[${category}] ${message}`, data);
    }
} 
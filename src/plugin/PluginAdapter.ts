import { App, Notice, TFile, TFolder } from 'obsidian';
import { DreamMetricsSettings, LogLevel } from '../types';
import { LoggingAdapter } from '../logging';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { IPluginAPI } from './IPluginAPI';
import { StateAdapter } from '../state/adapters';
import { IFileOperations } from '../file-operations/interfaces/IFileOperations';
import { FileOperations } from '../file-operations/services/FileOperations';

/**
 * Adapter class that implements the IPluginAPI interface by wrapping a DreamMetricsPlugin instance.
 * This allows components to depend on interfaces rather than concrete implementations
 * and facilitates better testing and modular architecture.
 */
export class PluginAdapter implements IPluginAPI {
    private fileOperations: IFileOperations;
    
    /**
     * Creates a new PluginAdapter instance.
     * @param plugin The DreamMetricsPlugin instance to wrap
     */
    constructor(private plugin: any) {
        this.fileOperations = new FileOperations(this.plugin.app);
    }
    
    /**
     * Get the Obsidian app instance
     */
    getApp(): App {
        return this.plugin.app;
    }
    
    /**
     * Get the plugin settings
     */
    getSettings(): DreamMetricsSettings {
        return this.plugin.settings;
    }
    
    /**
     * Save the plugin settings
     */
    async saveSettings(): Promise<void> {
        return this.plugin.saveSettings();
    }
    
    /**
     * Get the active file
     */
    getActiveFile(): TFile | null {
        return this.plugin.app.workspace.getActiveFile();
    }
    
    /**
     * Get the path of a file
     * @param file The file to get the path for
     */
    getFilePath(file: TFile): string {
        return file.path;
    }
    
    /**
     * Get the file operations service
     */
    getFileOperations(): IFileOperations {
        return this.fileOperations;
    }
    
    /**
     * Create a notice
     * @param message The message to display
     * @param timeout The timeout in milliseconds
     */
    createNotice(message: string, timeout?: number): Notice {
        return new Notice(message, timeout);
    }
    
    /**
     * Get the DreamMetricsState instance
     */
    getState(): DreamMetricsState {
        return this.plugin.state;
    }
    
    /**
     * Get the logger instance
     */
    getLogger(): LoggingAdapter {
        return this.plugin.logger;
    }
    
    /**
     * Parse a date string
     * @param dateStr The date string to parse
     */
    parseDate(dateStr: string): Date {
        return this.plugin.parseDate(dateStr);
    }
    
    /**
     * Format a date
     * @param date The date to format
     */
    formatDate(date: Date): string {
        return this.plugin.formatDate(date);
    }
    
    /**
     * Validate a date
     * @param date The date to validate
     */
    validateDate(date: Date): boolean {
        return this.plugin.validateDate(date);
    }
    
    /**
     * Get the state adapter for storing and retrieving arbitrary state data
     * @returns The state adapter
     */
    getStateAdapter(): StateAdapter {
        return (this.plugin as any).stateAdapter;
    }
    
    /**
     * Log a message with the specified level
     * @param level Log level
     * @param module Module name
     * @param message Message to log
     * @param data Additional data to log (optional)
     */
    log(level: LogLevel, module: string, message: string, data?: any): void {
        const logger = (this.plugin as any).logger;
        if (logger) {
            switch (level) {
                case 'error':
                    logger.error(module, message, data);
                    break;
                case 'warn':
                    logger.warn(module, message, data);
                    break;
                case 'info':
                    logger.info(module, message, data);
                    break;
                case 'debug':
                    logger.debug(module, message, data);
                    break;
                default:
                    logger.log(module, message, data);
            }
        }
    }
    
    /**
     * Open a file
     * @param file File to open or path to file
     * @param newLeaf Whether to open in a new leaf (optional)
     * @param leafBehavior Leaf behavior (optional)
     * @returns A promise that resolves when the file is opened
     */
    async openFile(file: TFile | string, newLeaf?: boolean, leafBehavior?: 'replace' | 'split'): Promise<void> {
        const app = this.getApp();
        
        if (typeof file === 'string') {
            const tfile = app.vault.getAbstractFileByPath(file);
            if (tfile instanceof TFile) {
                await app.workspace.getLeaf(newLeaf).openFile(tfile);
            } else {
                throw new Error(`File not found: ${file}`);
            }
        } else {
            await app.workspace.getLeaf(newLeaf).openFile(file);
        }
    }
    
    /**
     * Register a callback for when the plugin is unloaded
     * @param callback Callback to execute when plugin is unloaded
     * @returns A function to unregister the callback
     */
    onUnload(callback: () => void): () => void {
        const cleanupFunctions = (this.plugin as any).cleanupFunctions;
        if (Array.isArray(cleanupFunctions)) {
            cleanupFunctions.push(callback);
            return () => {
                const index = cleanupFunctions.indexOf(callback);
                if (index !== -1) {
                    cleanupFunctions.splice(index, 1);
                }
            };
        }
        return () => {}; // Fallback noop function
    }
} 
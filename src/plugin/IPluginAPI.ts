import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFile, TFolder } from 'obsidian';
import { DreamMetricsSettings, LogLevel } from '../types';
import { LoggingAdapter } from '../logging';
import { IErrorHandlingService } from '../logging/IErrorHandlingService';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { StateAdapter } from '../state/adapters';
import { IFileOperations } from '../file-operations/interfaces/IFileOperations';

/**
 * Interface defining the public API exposed by the DreamMetricsPlugin.
 * This allows components to depend on interfaces rather than concrete implementations
 * and facilitates better testing and modular architecture.
 */
export interface IPluginAPI {
    /**
     * Access to the Obsidian app instance
     */
    getApp(): App;
    
    /**
     * Settings access
     */
    getSettings(): DreamMetricsSettings;
    saveSettings(): Promise<void>;
    
    /**
     * File access
     */
    getActiveFile(): TFile | null;
    getFilePath(file: TFile): string;
    
    /**
     * Get the file operations service
     * @returns The file operations service
     */
    getFileOperations(): IFileOperations;
    
    /**
     * UI access
     */
    createNotice(message: string, timeout?: number): Notice;
    
    /**
     * State access
     */
    getState(): DreamMetricsState;
    
    /**
     * Logging
     */
    getLogger(): LoggingAdapter;
    
    /**
     * Error handling
     * @returns The error handling service
     */
    getErrorHandler(): IErrorHandlingService;
    
    /**
     * Utility functions
     */
    parseDate(dateStr: string): Date;
    formatDate(date: Date): string;
    validateDate(date: Date): boolean;
    
    /**
     * Get the state adapter for storing and retrieving arbitrary state data
     * @returns The state adapter
     */
    getStateAdapter(): StateAdapter;
    
    /**
     * Log a message with the specified level
     * @param level Log level
     * @param module Module name
     * @param message Message to log
     * @param data Additional data to log (optional)
     */
    log(level: LogLevel, module: string, message: string, data?: any): void;
    
    /**
     * Open a file
     * @param file File to open or path to file
     * @param newLeaf Whether to open in a new leaf (optional)
     * @param leafBehavior Leaf behavior (optional)
     * @returns A promise that resolves when the file is opened
     */
    openFile(file: TFile | string, newLeaf?: boolean, leafBehavior?: 'replace' | 'split'): Promise<void>;
    
    /**
     * Register a callback for when the plugin is unloaded
     * @param callback Callback to execute when plugin is unloaded
     * @returns A function to unregister the callback
     */
    onUnload(callback: () => void): () => void;
} 
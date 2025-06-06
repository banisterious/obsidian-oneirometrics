/**
 * ProjectNoteManager
 * 
 * Manages operations related to the OneiroMetrics project note,
 * including updates, backups, and rendering.
 */

import { App, TFile, Notice, MarkdownView } from 'obsidian';
import { DreamMetricData, DreamMetricsSettings } from '../types/core';
import { ILogger } from '../logging/LoggerTypes';
import { TableGenerator } from '../dom/tables/TableGenerator';
import safeLogger from '../logging/safe-logger';
import { getProjectNotePath } from '../utils/settings-helpers';
import { isBackupEnabled, getBackupFolderPath } from '../utils/settings-helpers';
import { createScrapeEvent, SCRAPE_EVENTS } from '../events/ScrapeEvents';
import type DreamMetricsPlugin from '../../main';

export class ProjectNoteManager {
    private tableGenerator: TableGenerator;
    
    constructor(
        private app: App,
        private plugin: DreamMetricsPlugin,
        private settings: DreamMetricsSettings,
        private logger?: ILogger
    ) {
        this.tableGenerator = new TableGenerator(settings, logger, app, plugin);
    }
    
    /**
     * Update the project note with metrics data
     * 
     * @param metrics - Record of metrics data
     * @param dreamEntries - Array of dream entries
     */
    public async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): Promise<void> {
        try {
            const notePath = getProjectNotePath(this.settings);
            
            if (!notePath) {
                this.logger?.error('ProjectNote', 'No project note path configured');
                new Notice('Error: No project note path configured. Please set up your OneiroMetrics Note path in settings.');
                return;
            }
            
            // Check if the file exists
            let file = this.app.vault.getAbstractFileByPath(notePath);
            
            if (!file) {
                this.logger?.error('ProjectNote', `Project note not found at ${notePath}`);
                new Notice(`Error: OneiroMetrics note not found at ${notePath}. Please create the file and folder structure manually.`);
                return;
            }
            
            if (!(file instanceof TFile)) {
                this.logger?.error('ProjectNote', 'Project note path points to a folder, not a file');
                new Notice('Error: Project note path points to a folder, not a file.');
                return;
            }
            
            // Backup the file before modifying if backup is enabled
            const shouldBackup = isBackupEnabled(this.settings);
            if (shouldBackup) {
                await this.backupProjectNote(file);
                // Continue with normal flow after backup
                await this.finishUpdate(file, metrics, dreamEntries);
            } else {
                // Emit backup warning event instead of showing modal
                return new Promise<void>((resolve, reject) => {
                    this.plugin.scrapeEventEmitter.emit(createScrapeEvent(
                        SCRAPE_EVENTS.BACKUP_WARNING,
                        'Warning: Backup is disabled. Updating the project note may overwrite existing content. Proceed?',
                        {
                            onProceed: async () => {
                                try {
                                    await this.finishUpdate(file, metrics, dreamEntries);
                                    resolve();
                                } catch (error) {
                                    reject(error);
                                }
                            },
                            onCancel: () => {
                                this.logger?.info('ProjectNote', 'User canceled update without backup');
                                resolve(); // Resolve without error, but don't proceed
                            }
                        }
                    ));
                });
            }
        } catch (error) {
            this.logger?.error('ProjectNote', 'Error updating project note', error as Error);
            new Notice(`Error updating project note: ${(error as Error).message}`);
            throw error;
        }
    }
    
    /**
     * Backup the project note before modifying
     * 
     * @param file - The project note file
     */
    private async backupProjectNote(file: TFile): Promise<void> {
        try {
            const backupFolderPath = getBackupFolderPath(this.settings);
            
            if (!backupFolderPath) {
                this.logger?.warn('ProjectNote', 'No backup folder path set, skipping backup');
                return;
            }
            
            // Create backup folder if it doesn't exist
            await this.createFolderRecursive(backupFolderPath);
            
            // Read the file content
            const fileContent = await this.app.vault.read(file);
            
            // Generate a timestamp for the backup file name
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            
            const timestamp = [
                now.getFullYear(),
                pad(now.getMonth() + 1),
                pad(now.getDate()),
                '_',
                pad(now.getHours()),
                pad(now.getMinutes()),
                pad(now.getSeconds())
            ].join('');
            
            // Create the backup file name
            const originalName = file.name.replace('.md', '');
            const backupFileName = `${originalName}_backup_${timestamp}.md`;
            const backupFilePath = `${backupFolderPath}/${backupFileName}`;
            
            // Write the backup file
            await this.app.vault.create(backupFilePath, fileContent);
            this.logger?.info('ProjectNote', `Created backup at ${backupFilePath}`);
            
            // Notify user
            new Notice(`Backup created: ${backupFileName}`);
        } catch (error) {
            this.logger?.error('ProjectNote', 'Error creating backup', error as Error);
            new Notice(`Warning: Failed to create backup: ${(error as Error).message}`);
            
            // We don't throw here to allow the update to proceed even if backup fails
        }
    }
    
    /**
     * Create a folder and any parent folders if they don't exist
     * 
     * @param folderPath - Path to the folder
     */
    private async createFolderRecursive(folderPath: string): Promise<void> {
        if (!folderPath) return;
        
        const pathParts = folderPath.split('/').filter(part => part.length > 0);
        let currentPath = '';
        
        for (const part of pathParts) {
            currentPath += (currentPath ? '/' : '') + part;
            const folder = this.app.vault.getAbstractFileByPath(currentPath);
            
            if (!folder) {
                try {
                    await this.app.vault.createFolder(currentPath);
                    this.logger?.debug('ProjectNote', `Created folder ${currentPath}`);
                } catch (error) {
                    // Check if error is "Folder already exists" (which is expected and safe to ignore)
                    const errorMessage = (error as Error).message;
                    if (errorMessage.includes('Folder already exists') || errorMessage.includes('already exists')) {
                        this.logger?.debug('ProjectNote', `Folder ${currentPath} already exists, continuing`);
                    } else {
                        // Only warn for unexpected errors
                        this.logger?.warn('ProjectNote', `Unexpected error creating folder ${currentPath}`, error as Error);
                    }
                }
            }
        }
    }
    
    /**
     * Clear the table generator cache
     */
    public clearCache(): void {
        this.tableGenerator.clearCache();
    }
    
    /**
     * Complete the project note update process
     * 
     * @param file - The project note file
     * @param metrics - Metrics data 
     * @param dreamEntries - Dream entries data
     */
    private async finishUpdate(file: TFile, metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): Promise<void> {
        // Generate table content
        this.logger?.info('ProjectNote', 'finishUpdate called with metrics:', Object.keys(metrics));
        this.logger?.info('ProjectNote', 'Dream entries count:', dreamEntries.length);
        
        // Check if metrics object has any data
        const hasMetricsData = Object.keys(metrics).some(key => metrics[key] && metrics[key].length > 0);
        this.logger?.info('ProjectNote', 'Has metrics data:', hasMetricsData);
        
        if (!hasMetricsData) {
            this.logger?.warn('ProjectNote', 'No metrics data found - charts will be empty');
        }
        
        const content = this.tableGenerator.generateMetricsTable(metrics, dreamEntries);
        
        // Update the file
        await this.app.vault.modify(file, content);
        this.logger?.info('ProjectNote', `Updated project note at ${file.path}`);
        
        // Open the file
        const leaf = this.app.workspace.getLeaf();
        await leaf.openFile(file);
        
        // Initialize chart tabs after content is rendered with better timing
        this.initializeChartsWithRetry(metrics, dreamEntries, 0);
    }
    
    /**
     * Initialize charts with retry logic for DOM readiness
     */
    private async initializeChartsWithRetry(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[], attempt: number): Promise<void> {
        const maxAttempts = 5;
        const baseDelay = 300;
        const currentDelay = baseDelay * Math.pow(1.5, attempt); // Exponential backoff
        
        setTimeout(async () => {
            this.logger?.debug('ProjectNote', `Chart initialization attempt ${attempt + 1}/${maxAttempts}`);
            
            // Check if the metrics container exists
            const metricsContainer = document.querySelector('#oom-metrics-container') as HTMLElement;
            if (metricsContainer) {
                this.logger?.debug('ProjectNote', 'Metrics container found, initializing chart tabs');
                try {
                    await this.tableGenerator.initializeChartTabs(metrics, dreamEntries);
                    this.logger?.info('ProjectNote', 'Chart tabs initialized successfully');
                    return;
                } catch (error) {
                    this.logger?.error('ProjectNote', 'Error initializing chart tabs', error as Error);
                }
            } else {
                this.logger?.debug('ProjectNote', `Metrics container not found on attempt ${attempt + 1}`);
                
                // Retry if we haven't exceeded max attempts
                if (attempt < maxAttempts - 1) {
                    this.initializeChartsWithRetry(metrics, dreamEntries, attempt + 1);
                } else {
                    this.logger?.warn('ProjectNote', 'Failed to find metrics container after all attempts');
                }
            }
        }, currentDelay);
    }
} 
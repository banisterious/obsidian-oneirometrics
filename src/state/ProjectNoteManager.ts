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

export class ProjectNoteManager {
    private tableGenerator: TableGenerator;
    
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private logger?: ILogger
    ) {
        this.tableGenerator = new TableGenerator(settings, logger);
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
            } else {
                // Confirm with user if they want to proceed without backup
                const confirmed = await this.confirmProceedWithoutBackup();
                if (!confirmed) {
                    this.logger?.info('ProjectNote', 'User canceled update without backup');
                    return;
                }
            }
            
            // Generate table content
            const content = this.tableGenerator.generateMetricsTable(metrics, dreamEntries);
            
            // Update the file
            await this.app.vault.modify(file, content);
            this.logger?.info('ProjectNote', `Updated project note at ${notePath}`);
            
            // Open the file
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(file);
            
            // Force re-render in a safer way
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (view) {
                this.logger?.debug('ProjectNote', 'Refreshing view');
                
                try {
                    // Simple approach - just re-open the file which will refresh the view
                    setTimeout(() => {
                        leaf.openFile(file, { active: true });
                    }, 100);
                } catch (refreshError) {
                    this.logger?.warn('ProjectNote', 'Error refreshing view', refreshError as Error);
                    // Non-critical error, continue execution
                }
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
     * Confirm with user if they want to proceed without backup
     * 
     * @returns Promise resolving to true if user confirms, false otherwise
     */
    private async confirmProceedWithoutBackup(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const notice = new Notice(
                'Warning: Backup is disabled. Updating the project note may overwrite existing content. Proceed?',
                0
            );
            
            // Add buttons to the notice
            const noticeEl = notice.noticeEl;
            
            // Add container for buttons
            const buttonContainer = noticeEl.createDiv('notice-button-container');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'flex-end';
            buttonContainer.style.marginTop = '8px';
            
            // Add cancel button
            const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
            cancelButton.style.marginRight = '8px';
            cancelButton.addEventListener('click', () => {
                notice.hide();
                resolve(false);
            });
            
            // Add confirm button
            const confirmButton = buttonContainer.createEl('button', { text: 'Proceed' });
            confirmButton.addClass('mod-warning');
            confirmButton.addEventListener('click', () => {
                notice.hide();
                resolve(true);
            });
            
            // Auto-dismiss after 30 seconds
            setTimeout(() => {
                notice.hide();
                resolve(false);
            }, 30000);
        });
    }
    
    /**
     * Clear the table generator cache
     */
    public clearCache(): void {
        this.tableGenerator.clearCache();
    }
} 
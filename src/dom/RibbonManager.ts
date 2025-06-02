/**
 * RibbonManager
 * 
 * Manages ribbon icons for the OneiroMetrics plugin.
 */

import { App, Plugin } from 'obsidian';
import { DreamMetricsSettings } from '../types/core';
import { ILogger } from '../logging/LoggerTypes';
import { shouldShowRibbonButtons } from '../utils/settings-helpers';
import { ModalsManager } from './modals/ModalsManager';
import { getProjectNotePath } from '../utils/settings-helpers';

export class RibbonManager {
    private ribbonIcons: HTMLElement[] = [];
    
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private plugin: Plugin, // Plugin instance that has methods like showMetrics
        private logger?: ILogger
    ) {}
    
    /**
     * Update ribbon icons based on settings
     */
    public updateRibbonIcons(): void {
        const shouldShow = shouldShowRibbonButtons(this.settings);
        
        if (shouldShow) {
            this.addRibbonIcons();
        } else {
            this.removeRibbonIcons();
        }
        
        this.logger?.debug('UI', 'Updated ribbon icons', { visible: shouldShow });
    }
    
    /**
     * Remove all ribbon icons
     */
    public removeRibbonIcons(): void {
        this.ribbonIcons.forEach(icon => icon.remove());
        this.ribbonIcons = [];
        
        this.logger?.debug('UI', 'Removed ribbon icons');
    }
    
    /**
     * Add ribbon icons based on settings
     */
    public addRibbonIcons(): void {
        // Remove existing icons first
        this.removeRibbonIcons();
        
        // Ensure plugin compatibility - check if folders exist before adding buttons
        this.ensurePluginCompatibility();
        
        // Add OneiroMetrics Hub button with lucide-shell icon
        // @ts-ignore - Obsidian typings aren't fully accurate
        const metricsHubRibbonEl = this.plugin.addRibbonIcon(
            'lucide-shell',
            'OneiroMetrics Hub',
            () => {
                // Use ModalsManager to open the consolidated hub
                try {
                    const modalsManager = new ModalsManager(this.app, this.plugin as any, this.logger);
                    modalsManager.openHubModal();
                } catch (e) {
                    this.logger?.error('UI', 'Error opening OneiroMetrics Hub', e instanceof Error ? e : new Error(String(e)));
                }
            }
        );
        this.ribbonIcons.push(metricsHubRibbonEl);
        
        this.logger?.debug('UI', 'Added ribbon icons');
    }
    
    /**
     * Ensure compatibility with other plugins like folder-notes
     * by ensuring required folders exist in the vault
     */
    private ensurePluginCompatibility(): void {
        try {
            // Get project note path and ensure parent folders exist
            const projectNotePath = getProjectNotePath(this.settings);
            if (projectNotePath) {
                // Extract folder path from the full path
                const folderPath = projectNotePath.substring(0, projectNotePath.lastIndexOf('/'));
                if (folderPath) {
                    // Check if folder exists and create if needed
                    this.ensureFolderExists(folderPath);
                }
            }
            
            // For folder-notes compatibility, ensure known paths referenced in errors exist
            // This helps prevent "Cannot read properties of undefined" errors
            const knownPaths = [
                'Journals',
                'Journals/Dream Diary',
                'Journals/Dream Diary/Metrics'
            ];
            
            for (const path of knownPaths) {
                this.ensureFolderExists(path);
            }
        } catch (e) {
            this.logger?.warn('Compatibility', 'Error ensuring plugin compatibility', e instanceof Error ? e : new Error(String(e)));
        }
    }
    
    /**
     * Ensure a folder exists in the vault, creating it if necessary
     */
    private ensureFolderExists(folderPath: string): void {
        try {
            const folder = this.app.vault.getAbstractFileByPath(folderPath);
            if (!folder) {
                // Create folder if it doesn't exist
                this.logger?.debug('Compatibility', `Creating folder: ${folderPath}`);
                // Use recursive creation to handle nested paths
                this.createFolderRecursively(folderPath);
            }
        } catch (e) {
            this.logger?.warn('Compatibility', `Error ensuring folder exists: ${folderPath}`, e instanceof Error ? e : new Error(String(e)));
        }
    }
    
    /**
     * Create a folder recursively, handling parent folders if needed
     */
    private async createFolderRecursively(folderPath: string): Promise<void> {
        try {
            await this.app.vault.createFolder(folderPath);
        } catch (e) {
            // If folder creation failed, it might be because the parent folder doesn't exist
            const lastSlashIndex = folderPath.lastIndexOf('/');
            if (lastSlashIndex > 0) {
                const parentFolder = folderPath.substring(0, lastSlashIndex);
                // Create parent folder first
                await this.createFolderRecursively(parentFolder);
                // Then try creating the original folder again
                await this.app.vault.createFolder(folderPath);
            }
        }
    }
    
    /**
     * Add a test ribbon icon for debugging
     * 
     * @param callback - Function to call when the icon is clicked
     * @param icon - Icon name
     * @param tooltip - Tooltip text
     * @returns The created ribbon icon element
     */
    public addTestRibbon(callback: () => void, icon: string = 'lucide-beaker', tooltip: string = 'Test'): HTMLElement {
        // @ts-ignore - Obsidian typings aren't fully accurate
        const ribbonIcon = this.plugin.addRibbonIcon(
            icon,
            tooltip,
            callback
        );
        this.ribbonIcons.push(ribbonIcon);
        return ribbonIcon;
    }
} 
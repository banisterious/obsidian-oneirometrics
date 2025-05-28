/**
 * MetricsProcessor
 * 
 * Handles the processing of metrics from dream journal entries.
 * Extracted from main.ts during the refactoring process.
 */

import { App, Modal, Notice, Setting, TFile, TFolder } from 'obsidian';
import DreamMetricsPlugin from '../../main';
import { DreamMetricData } from '../types/core';
import { ILogger } from '../logging/LoggerTypes';

export class MetricsProcessor {
    constructor(
        private app: App,
        private plugin: DreamMetricsPlugin,
        private logger?: ILogger
    ) {}

    /**
     * Process dream journal entries to extract metrics
     */
    public async scrapeMetrics(): Promise<void> {
        this.logger?.info('Scrape', 'Starting metrics scrape process');
        
        // Show a notice instead of a modal
        new Notice('Scraping dream metrics... This may take a moment.');

        // Variables needed for processing
        const metrics: Record<string, number[]> = {};
        const dreamEntries: DreamMetricData[] = [];
        let totalWords = 0;
        let entriesProcessed = 0;
        let calloutsFound = 0;
        let validNotes = 0;
        let foundAnyJournalEntries = false;
        let foundAnyMetrics = false;

        // Import our helper functions to access settings safely
        const { getSelectionMode, getSelectedFolder } = require('../utils/settings-helpers');

        // After the selection UI, define files for scraping
        let files: string[] = [];
        const mode = getSelectionMode(this.plugin.settings);
        const selectedFolderPath = getSelectedFolder(this.plugin.settings);
        if (mode === 'folder' && selectedFolderPath) {
            // Recursively gather up to 200 markdown files from the selected folder
            const folder = this.app.vault.getAbstractFileByPath(selectedFolderPath);
            if (folder && folder instanceof TFolder) {
                const gatherFiles = (folder: TFolder, acc: string[]) => {
                    for (const child of folder.children) {
                        if (child instanceof TFile && child.extension === 'md') {
                            acc.push(child.path);
                            if (acc.length >= 200) break;
                        } else if (child instanceof TFolder) {
                            gatherFiles(child, acc);
                            if (acc.length >= 200) break;
                        }
                    }
                };
                const acc: string[] = [];
                gatherFiles(folder, acc);
                files = acc.slice(0, 200);
            }
            // Exclude files if user previewed and unchecked them
            const pluginAny = this.plugin as any;
            if (Array.isArray(pluginAny._excludedFilesForNextScrape)) {
                files = files.filter((f: string) => !pluginAny._excludedFilesForNextScrape.includes(f));
            }
        } else {
            // Default: use selectedNotes
            files = this.plugin.settings.selectedNotes || [];
        }

        if (!files || files.length === 0) {
            new Notice('No notes selected. Please select at least one note or a folder to scrape.');
            this.logger?.warn('Scrape', 'No notes selected for processing');
            return;
        }

        // Process files in batches of 5
        const BATCH_SIZE = 5;
        const totalFiles = files.length;
        this.logger?.info('Scrape', `Processing ${totalFiles} files in batches of ${BATCH_SIZE}`);

        for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (path) => {
                const file = this.app.vault.getAbstractFileByPath(path);
                if (!(file instanceof TFile)) {
                    this.logger?.warn('Scrape', `File not found or not a file: ${path}`);
                    return;
                }
                validNotes++;
                try {
                    const content = await this.app.vault.read(file);
                    this.logger?.debug('Scrape', `Processing file: ${path}`, { contentLength: content.length });

                    // --- Processing logic for dream journal entries ---
                    // This would include callout parsing, metrics extraction, etc.
                    // Implementation would go here
                    
                } catch (error) {
                    this.logger?.error('Scrape', `Error processing file: ${path}`, error as Error);
                }
            });
            
            // Wait for batch to complete
            await Promise.all(batchPromises);
        }

        // Update project note with the metrics
        try {
            // Call the plugin's method to update the project note
            await this.updateProjectNote(metrics, dreamEntries);
            
            // Show confirmation
            if (foundAnyJournalEntries) {
                if (foundAnyMetrics) {
                    new Notice(`Updated metrics from ${validNotes} notes, found ${entriesProcessed} entries.`);
                    this.logger?.info('Scrape', `Metrics updated from ${validNotes} notes with ${entriesProcessed} entries`);
                } else {
                    new Notice(`Found ${entriesProcessed} entries but no metrics were detected.`);
                    this.logger?.warn('Scrape', `No metrics found in ${entriesProcessed} entries`);
                }
            } else {
                new Notice(`No dream journal entries found in the selected notes.`);
                this.logger?.warn('Scrape', 'No dream journal entries found');
            }
        } catch (error) {
            new Notice(`Error updating metrics: ${error.message}`);
            this.logger?.error('Scrape', 'Error updating metrics', error as Error);
        }
    }

    /**
     * Process metrics text from a journal entry
     */
    public processMetrics(metricsText: string, metrics: Record<string, number[]>): Record<string, number> {
        // Implementation would be moved from main.ts
        const result: Record<string, number> = {};
        // Metrics processing logic would go here
        return result;
    }
    
    /**
     * Process dream content, cleaning up formatting
     */
    public processDreamContent(content: string): string {
        // Implementation would be moved from main.ts
        // Content processing logic would go here
        return content;
    }
    
    /**
     * Update the project note with the metrics data
     * This is a wrapper that calls the plugin's updateProjectNote method
     */
    private async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): Promise<void> {
        // Call the plugin's method
        // We'll need to update main.ts to make this method public
        try {
            // For now, use type assertion to bypass TypeScript's access restrictions
            await (this.plugin as any).updateProjectNote(metrics, dreamEntries);
        } catch (error) {
            this.logger?.error('MetricsNote', 'Error updating project note', error as Error);
            throw error;
        }
    }
} 
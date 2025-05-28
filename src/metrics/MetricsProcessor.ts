/**
 * MetricsProcessor
 * 
 * Handles the processing of metrics from dream journal entries.
 * Extracted from main.ts during the refactoring process.
 */

import { App, Modal, Notice, Setting, TFile, TFolder } from 'obsidian';
import DreamMetricsPlugin from '../../main';
import { DreamMetricData, DreamMetricsSettings } from '../types/core';
import { ILogger } from '../logging/LoggerTypes';
import { getSelectedFolder, getSelectionMode } from '../utils/settings-helpers';
import { isMetricEnabled, standardizeMetric } from '../utils/metric-helpers';
import safeLogger from '../logging/safe-logger';

export class MetricsProcessor {
    private readonly settings: DreamMetricsSettings;

    constructor(
        private app: App,
        private plugin: DreamMetricsPlugin,
        private logger?: ILogger
    ) {
        this.settings = plugin.settings;
    }

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

        try {
            // After the selection UI, define files for scraping
            let files: string[] = [];
            const mode = getSelectionMode(this.settings);
            const selectedFolderPath = getSelectedFolder(this.settings);
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
                files = this.settings.selectedNotes || [];
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
                        // Process content and extract metrics here
                        // This would be more complex logic from main.ts's scrapeMetrics method
                        
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
        } catch (error) {
            this.logger?.error('Scrape', 'Error during metrics scraping process', error as Error);
            new Notice(`Error scraping metrics: ${error.message}`);
        }
    }

    /**
     * Process metrics text from a journal entry
     * Converts metrics text to a record of named metrics with numeric values
     * 
     * @param metricsText - The text containing metrics in "name: value" format, comma-separated
     * @param metrics - Record to accumulate metrics across multiple entries
     * @returns Record of processed metrics for a single entry
     */
    public processMetrics(metricsText: string, metrics: Record<string, number[]>): Record<string, number> {
        const dreamMetrics: Record<string, number> = {};
        
        try {
            const metricPairs = metricsText.split(',').map(pair => pair.trim());
            
            this.logger?.debug('Metrics', 'Processing metrics text', { text: metricsText });
            
            for (const pair of metricPairs) {
                const [name, value] = pair.split(':').map(s => s.trim());
                if (name && value !== '—' && !isNaN(Number(value))) {
                    const numValue = Number(value);
                    
                    // Find the matching metric name from settings (case-insensitive)
                    const metricName = Object.values(this.settings.metrics).find(
                        m => m.name.toLowerCase() === name.toLowerCase()
                    )?.name || name;
                    
                    dreamMetrics[metricName] = numValue;
                    
                    // Update global metrics record
                    if (!metrics[metricName]) {
                        metrics[metricName] = [];
                    }
                    metrics[metricName].push(numValue);
                    
                    this.logger?.debug('Metrics', `Processed metric: ${metricName} = ${numValue}`);
                }
            }
            
            this.logger?.debug('Metrics', 'Completed metrics processing', { dreamMetrics });
        } catch (error) {
            this.logger?.error('Metrics', 'Error processing metrics text', error as Error);
            // Return any metrics we were able to process before the error
        }
        
        return dreamMetrics;
    }
    
    /**
     * Process dream content, cleaning up formatting for display and analysis
     * Removes callouts, images, markdown artifacts, and standardizes whitespace
     * 
     * @param content - The raw dream content text
     * @returns Cleaned and processed content
     */
    public processDreamContent(content: string): string {
        try {
            // Remove callouts and images
            let processedContent = content.replace(/\[!.*?\]/g, '')
                           .replace(/!\[\[.*?\]\]/g, '')
                           .replace(/\[\[.*?\]\]/g, '')
                           .trim();
            
            // Remove any remaining markdown artifacts
            processedContent = processedContent.replace(/[#*_~`]/g, '')
                           .replace(/\n{3,}/g, '\n\n')
                           .replace(/^>\s*>/g, '') // Remove nested blockquotes
                           .replace(/^>\s*/gm, '') // Remove single blockquotes
                           .trim();
            
            return processedContent;
        } catch (error) {
            this.logger?.error('Metrics', 'Error processing dream content', error as Error);
            // Return original content if processing fails
            return content;
        }
    }
    
    /**
     * Update the project note with the metrics data
     * This is a wrapper that calls the plugin's updateProjectNote method
     * 
     * @param metrics - Record of metrics data to update
     * @param dreamEntries - Array of dream entries to include
     */
    private async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): Promise<void> {
        try {
            // Call the plugin's method
            // We'll need to update main.ts to make this method public
            await (this.plugin as any).updateProjectNote(metrics, dreamEntries);
        } catch (error) {
            this.logger?.error('MetricsNote', 'Error updating project note', error as Error);
            throw error;
        }
    }
    
    /**
     * Calculate advanced metrics for a dream entry
     * 
     * @param content - The processed dream content
     * @returns Record of calculated metrics
     */
    public calculateAdvancedMetrics(content: string): Record<string, number> {
        const metrics: Record<string, number> = {};
        
        try {
            // Word count
            const wordCount = content.trim().split(/\s+/).length;
            metrics['Words'] = wordCount;
            
            // Reading time (assuming average reading speed of 200 words per minute)
            metrics['Reading Time'] = Math.ceil(wordCount / 200);
            
            // Sentence count
            const sentenceCount = (content.match(/[.!?]+\s/g) || []).length + 1;
            metrics['Sentences'] = sentenceCount;
            
            // Average words per sentence
            if (sentenceCount > 0) {
                metrics['Words per Sentence'] = Math.round((wordCount / sentenceCount) * 10) / 10;
            }
            
            // Character count (without spaces)
            metrics['Characters'] = content.replace(/\s/g, '').length;
            
            this.logger?.debug('Metrics', 'Calculated advanced metrics', { metrics });
        } catch (error) {
            this.logger?.error('Metrics', 'Error calculating advanced metrics', error as Error);
        }
        
        return metrics;
    }
} 
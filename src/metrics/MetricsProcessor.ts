/**
 * MetricsProcessor
 * 
 * Handles the processing of metrics from dream journal entries.
 * Extracted from main.ts during the refactoring process.
 */

import { App, Modal, Notice, Setting, TFile, TFolder } from 'obsidian';
import DreamMetricsPlugin from '../../main';
import { DreamMetricData, DreamMetricsSettings } from '../../types';
import { ILogger } from '../logging/LoggerTypes';
import { getSelectedFolder, getSelectionMode } from '../utils/settings-helpers';
import { isMetricEnabled, standardizeMetric } from '../utils/metric-helpers';
import safeLogger from '../logging/safe-logger';

/**
 * Extract date from journal entry lines and file information
 * 
 * @param journalLines - Array of lines that might contain date information
 * @param filePath - Path to the journal file
 * @param fileContent - Content of the journal file
 * @returns Formatted date string in ISO format (YYYY-MM-DD)
 */
export function getDreamEntryDate(journalLines: string[], filePath: string, fileContent: string): string {
    // 1. Block Reference (^YYYYMMDD) on the callout line or the next line
    const blockRefRegex = /\^(\d{8})/;
    for (let i = 0; i < Math.min(2, journalLines.length); i++) {
        const blockRefMatch = journalLines[i].match(blockRefRegex);
        if (blockRefMatch) {
            const dateStr = blockRefMatch[1];
            return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        }
    }
    // 2. Date in the callout line (e.g., 'Monday, January 6, 2025')
    const calloutLine = journalLines[0] || '';
    const longDateRegex = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})/;
    const longDateMatch = calloutLine.match(longDateRegex);
    if (longDateMatch) {
        const [_, day, year] = longDateMatch;
        const dateObj = new Date(`${longDateMatch[0]}`);
        if (!isNaN(dateObj.getTime())) {
            return dateObj.toISOString().split('T')[0];
        }
    }
    // 3. YAML 'created' field
    const yamlCreatedMatch = fileContent.match(/created:\s*(\d{8})/);
    if (yamlCreatedMatch) {
        const dateStr = yamlCreatedMatch[1];
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    // 4. YAML 'modified' field
    const yamlModifiedMatch = fileContent.match(/modified:\s*(\d{8})/);
    if (yamlModifiedMatch) {
        const dateStr = yamlModifiedMatch[1];
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    // 5. Folder or filename (for year only, as a fallback)
    // Try to extract year from folder or filename
    const yearRegex = /\b(\d{4})\b/;
    const pathMatch = filePath.match(yearRegex);
    if (pathMatch) {
        return pathMatch[1];
    }
    // 6. Current date
    return new Date().toISOString().split('T')[0];
}

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
                        // Split content into lines
                        const lines = content.split('\n');
                        let journals: any[] = [];
                        let currentJournal: any = null;
                        let currentDiary: any = null;
                        let currentMetrics: any = null;
                        let blockLevel = 0;
                        let blockStack: any[] = [];
                        
                        // Helper to get callout type from a line
                        const getCalloutType = (line: string) => {
                            const match = line.match(/^>+\s*\[!(\w[\w-]*)/i);
                            return match ? match[1].toLowerCase() : null;
                        };
                        
                        // Helper to get blockquote level
                        const getBlockLevel = (line: string) => {
                            const match = line.match(/^(>+)/);
                            return match ? match[1].length : 0;
                        };
                        
                        // BEGIN IMPROVED STACK LOGIC
                        for (let idx = 0; idx < lines.length; idx++) {
                            const line = lines[idx];
                            const level = getBlockLevel(line);
                            const calloutType = getCalloutType(line);
                            
                            // Only pop the stack if the current level is LESS than the top of the stack's level
                            while (blockStack.length > 0 && blockStack[blockStack.length - 1].level > level) {
                                blockStack.pop();
                            }
                            
                            if (calloutType === 'journal-entry') {
                                currentJournal = {
                                    lines: [line],
                                    level,
                                    idx,
                                    diaries: []
                                };
                                journals.push(currentJournal);
                                blockStack.push({ type: 'journal-entry', obj: currentJournal, level });
                                calloutsFound++;
                            } else if (calloutType === 'dream-diary') {
                                currentDiary = {
                                    lines: [line],
                                    level,
                                    idx,
                                    metrics: []
                                };
                                // Attach to parent journal-entry if present
                                if (blockStack.length > 0 && blockStack[blockStack.length - 1].type === 'journal-entry') {
                                    blockStack[blockStack.length - 1].obj.diaries.push(currentDiary);
                                }
                                blockStack.push({ type: 'dream-diary', obj: currentDiary, level });
                                calloutsFound++;
                            } else if (calloutType === 'dream-metrics') {
                                currentMetrics = {
                                    lines: [line],
                                    level,
                                    idx
                                };
                                // Attach to parent dream-diary if present
                                if (blockStack.length > 0 && blockStack[blockStack.length - 1].type === 'dream-diary') {
                                    blockStack[blockStack.length - 1].obj.metrics.push(currentMetrics);
                                }
                                blockStack.push({ type: 'dream-metrics', obj: currentMetrics, level });
                                calloutsFound++;
                            } else if (blockStack.length > 0) {
                                // Add line to current block
                                blockStack[blockStack.length - 1].obj.lines.push(line);
                            }
                        }
                        
                        // Now extract data from the parsed structure
                        for (const journal of journals) {
                            if (journal.diaries.length > 0) {
                                foundAnyJournalEntries = true;
                                for (const diary of journal.diaries) {
                                    for (const metricsBlock of diary.metrics) {
                                        // Extract metrics text
                                        const metricsText = metricsBlock.lines.map((l: string) => l.replace(/^>+\s*/, '')).join(' ').replace(/\s+/g, ' ').trim();
                                        
                                        // Extract dream content (all lines in diary except metrics blocks)
                                        const diaryContentLines = diary.lines.filter((l: string) => !/^>+\s*\[!dream-diary/i.test(l) && !/^>+\s*\[!dream-metrics/i.test(l));
                                        let dreamContent = diaryContentLines.map((l: string) => l.replace(/^>+\s*/, '').trim()).join(' ').replace(/\s+/g, ' ').trim();
                                        
                                        // Extract date and title from the journal and diary callout lines
                                        const journalLine = journal.lines[0];
                                        const diaryLine = diary.lines[0];
                                        
                                        // More flexible date extraction
                                        let date = getDreamEntryDate([journalLine, lines[journal.idx + 1] || ''], path, content);
                                        
                                        // More flexible title extraction
                                        let title = '';
                                        let blockId = '';
                                        // Try dream-diary callout format
                                        const titleMatch = diaryLine.match(/\[!dream-diary\](?:\s*\[\[.*?\]\])?\s*(.*?)(?:\s*\[\[|$)/);
                                        if (titleMatch) {
                                            title = titleMatch[1].trim();
                                        }
                                        // Try block reference format
                                        if (!title) {
                                            const blockRefMatch = diaryLine.match(/\[\[.*?\|(.*?)\]\]/);
                                            if (blockRefMatch) {
                                                title = blockRefMatch[1].trim();
                                            }
                                        }
                                        // Try plain text after callout
                                        if (!title) {
                                            const plainTextMatch = diaryLine.match(/\[!dream-diary\](?:\s*\[\[.*?\]\])?\s*(.*)/);
                                            if (plainTextMatch) {
                                                title = plainTextMatch[1].trim();
                                            }
                                        }
                                        // Default if no title found
                                        if (!title) {
                                            title = 'Untitled Dream';
                                        }

                                        // Extract block ID if present
                                        const blockIdMatch = diaryLine.match(/\^(\d{8})/);
                                        if (blockIdMatch) {
                                            blockId = blockIdMatch[1];
                                            this.logger?.debug('Scrape', `Found block ID: ${blockId}`);
                                        }
                                        
                                        // Parse metrics
                                        const dreamMetrics = this.processMetrics(metricsText, metrics);
                                        dreamMetrics['Words'] = dreamContent.split(/\s+/).length;
                                        if (!metrics['Words']) {
                                            metrics['Words'] = [];
                                        }
                                        metrics['Words'].push(dreamMetrics['Words']);
                                        
                                        // Add dream entry
                                        foundAnyMetrics = true;
                                        const dreamTitle = title || 'Untitled Dream';
                                        const dreamEntry: any = {  // Use any temporarily to avoid type errors
                                            date: date,
                                            title: dreamTitle,
                                            content: dreamContent,
                                            source: {
                                                file: path,
                                                id: blockId // Store the block ID
                                            },
                                            wordCount: dreamMetrics['Words'],
                                            metrics: dreamMetrics,
                                            calloutMetadata: {
                                                type: 'dream', // Default type for dream callouts
                                                id: blockId
                                            }
                                        };
                                        dreamEntries.push(dreamEntry);
                                        entriesProcessed++;
                                    }
                                }
                            }
                        }
                        // END IMPROVED STACK LOGIC
                        this.logger?.debug('Scrape', `Parsed callout structure for file: ${path}`, { journals, blockStack: blockStack.length });
                    } catch (error) {
                        this.logger?.error('Scrape', `Error processing file ${path}:`, error as Error);
                        new Notice(`Error processing file: ${path}`);
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
    public async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): Promise<void> {
        try {
            // Call the plugin's method
            await this.plugin.updateProjectNote(metrics, dreamEntries);
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
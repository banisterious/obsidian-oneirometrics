/**
 * MetricsProcessor
 * 
 * Handles the processing of metrics from dream journal entries.
 * Extracted from main.ts during the refactoring process.
 */

import { App, Notice, TFile, TFolder } from 'obsidian';
import DreamMetricsPlugin from '../../main';
import { DreamMetricData, DreamMetricsSettings } from '../types/core';
import { ILogger } from '../logging/LoggerTypes';
import { getSelectedFolder, getSelectionMode } from '../utils/settings-helpers';
import { SettingsAdapter } from '../state/adapters/SettingsAdapter';
import { getDreamEntryDate } from '../utils/date-utils';
import { isFolderMode } from '../utils/selection-mode-helpers';

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
        console.log('MetricsProcessor.scrapeMetrics() called');
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
        let dreamDiaryCalloutsFound = 0;
        let dreamEntriesCreated = 0;

        try {
            // After the selection UI, define files for scraping
            let files: string[] = [];
            const mode = getSelectionMode(this.settings);
            const selectedFolderPath = getSelectedFolder(this.settings);
            if (isFolderMode(mode) && selectedFolderPath) {
                this.logger?.info('FileGathering', 'Using folder mode', {
                    selectedFolder: selectedFolderPath
                });
                
                // Recursively gather markdown files from the selected folder
                const folder = this.app.vault.getAbstractFileByPath(selectedFolderPath);
                if (folder && folder instanceof TFolder) {
                    const excludedNotes = this.settings.excludedNotes || [];
                    const excludedSubfolders = this.settings.excludedSubfolders || [];
                    
                    this.logger?.info('FileGathering', 'Folder found, starting recursive search', {
                        folderPath: selectedFolderPath,
                        excludedNotesCount: excludedNotes.length,
                        excludedSubfoldersCount: excludedSubfolders.length,
                        excludedNotes: excludedNotes,
                        excludedSubfolders: excludedSubfolders
                    });
                    
                    const gatherFiles = (folder: TFolder, acc: string[]) => {
                        this.logger?.debug('FileGathering', `Scanning folder: ${folder.path}`, {
                            childrenCount: folder.children?.length || 0
                        });
                        
                        for (const child of folder.children) {
                            if (child instanceof TFile && child.extension === 'md') {
                                this.logger?.debug('FileGathering', `Found markdown file: ${child.path}`, {
                                    isExcluded: excludedNotes.includes(child.path)
                                });
                                
                                // Check if this file is in the excluded notes list
                                if (!excludedNotes.includes(child.path)) {
                                    acc.push(child.path);
                                    this.logger?.debug('FileGathering', `✅ Added file: ${child.path}`);
                                } else {
                                    this.logger?.debug('FileGathering', `❌ Excluded file: ${child.path}`);
                                }
                                
                                // Check performance testing settings for file limits
                                const perfSettings = this.settings.performanceTesting;
                                const isPerformanceMode = perfSettings?.enabled ?? false;
                                const maxFiles = perfSettings?.maxFiles ?? 0;
                                
                                // Apply limits based on performance mode
                                if (!isPerformanceMode && acc.length >= 200) {
                                    // Normal mode: limit to 200 files
                                    this.logger?.info('FileGathering', 'Reached normal mode limit of 200 files');
                                    break;
                                } else if (isPerformanceMode && maxFiles > 0 && acc.length >= maxFiles) {
                                    // Performance mode with custom limit
                                    this.logger?.info('FileGathering', `Reached performance mode limit of ${maxFiles} files`);
                                    break;
                                }
                                // If performance mode with maxFiles = 0 (unlimited), no limit
                            } else if (child instanceof TFolder) {
                                this.logger?.debug('FileGathering', `Found subfolder: ${child.path}`, {
                                    isExcluded: excludedSubfolders.includes(child.path)
                                });
                                
                                // Check if this subfolder is excluded before recursing into it
                                if (!excludedSubfolders.includes(child.path)) {
                                    this.logger?.debug('FileGathering', `🔍 Recursing into subfolder: ${child.path}`);
                                    gatherFiles(child, acc);
                                } else {
                                    this.logger?.debug('FileGathering', `🚫 Skipping excluded subfolder: ${child.path}`);
                                }
                                
                                // Check limits after recursive call too
                                const perfSettings = this.settings.performanceTesting;
                                const isPerformanceMode = perfSettings?.enabled ?? false;
                                const maxFiles = perfSettings?.maxFiles ?? 0;
                                
                                if (!isPerformanceMode && acc.length >= 200) break;
                                else if (isPerformanceMode && maxFiles > 0 && acc.length >= maxFiles) break;
                            }
                        }
                    };
                    const acc: string[] = [];
                    gatherFiles(folder, acc);
                    
                    this.logger?.info('FileGathering', 'Recursive search completed', {
                        totalFilesFound: acc.length,
                        files: acc.slice(0, 10) // Show first 10 files for debugging
                    });
                    
                    // Apply final slice based on performance mode
                    const perfSettings = this.settings.performanceTesting;
                    const isPerformanceMode = perfSettings?.enabled ?? false;
                    const maxFiles = perfSettings?.maxFiles ?? 0;
                    
                    if (!isPerformanceMode) {
                        // Normal mode: limit to 200
                        files = acc.slice(0, 200);
                    } else if (maxFiles > 0) {
                        // Performance mode with custom limit
                        files = acc.slice(0, maxFiles);
                    } else {
                        // Performance mode unlimited
                        files = acc;
                    }
                    
                    this.logger?.info('FileGathering', 'Applied performance limits', {
                        isPerformanceMode,
                        maxFiles,
                        filesBeforeLimit: acc.length,
                        filesAfterLimit: files.length
                    });
                    
                    // Log performance mode status
                    if (isPerformanceMode) {
                        const limitText = maxFiles > 0 ? `${maxFiles} files` : 'unlimited files';
                        this.logger?.info('Performance', `Performance testing mode active - processing ${limitText} (found ${acc.length} total files)`);
                        
                        // Show warning if enabled
                        if (perfSettings?.showWarnings) {
                            console.warn(`[OneiroMetrics Performance Mode] Processing ${files.length} files (limit: ${limitText})`);
                        }
                    } else {
                        if (acc.length > 200) {
                            this.logger?.info('FileLimit', `Found ${acc.length} files, limited to 200 (enable performance testing mode to process more)`);
                        }
                    }
                    
                    // Log exclusion information
                    if (excludedNotes.length > 0 || excludedSubfolders.length > 0) {
                        this.logger?.info('Exclusions', `Applied exclusions - Notes: ${excludedNotes.length}, Subfolders: ${excludedSubfolders.length}`);
                    }
                } else {
                    this.logger?.error('FileGathering', 'Selected folder not found or invalid', {
                        selectedFolder: selectedFolderPath,
                        folderExists: !!folder,
                        isFolder: folder instanceof TFolder
                    });
                }
                // Exclude files if user previewed and unchecked them
                const pluginAny = this.plugin as any;
                if (Array.isArray(pluginAny._excludedFilesForNextScrape)) {
                    const beforeExclusion = files.length;
                    files = files.filter((f: string) => !pluginAny._excludedFilesForNextScrape.includes(f));
                    this.logger?.info('FileGathering', 'Applied preview exclusions', {
                        beforeExclusion,
                        afterExclusion: files.length,
                        excluded: pluginAny._excludedFilesForNextScrape
                    });
                }
            } else {
                this.logger?.info('FileGathering', 'Using notes mode', {
                    selectedNotesCount: this.settings.selectedNotes?.length || 0,
                    selectedNotes: this.settings.selectedNotes
                });
                // Default: use selectedNotes
                files = this.settings.selectedNotes || [];
            }

            this.logger?.info('FileGathering', 'File gathering completed', {
                finalFileCount: files.length,
                files: files.slice(0, 5) // Show first 5 files for debugging
            });

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
                                dreamDiaryCalloutsFound++;
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
                                        
                                        // More flexible date extraction with user preferences
                                        const settingsAdapter = new SettingsAdapter(this.settings);
                                        const adaptedSettings = settingsAdapter.getSettings();
                                        const dateHandling = adaptedSettings.dateHandling;
                                        let date = getDreamEntryDate([journalLine, lines[journal.idx + 1] || ''], path, content, dateHandling);
                                        
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
                                        
                                        this.logger?.debug('Parse', `✅ INCLUDED dream entry (MetricsProcessor)`, {
                                            file: path,
                                            date: date,
                                            title: dreamTitle,
                                            wordCount: dreamMetrics['Words'],
                                            contentPreview: dreamContent.substring(0, 100) + '...',
                                            blockId: blockId,
                                            metricsKeys: Object.keys(dreamMetrics),
                                            lineInfo: 'MetricsProcessor parsing'
                                        });
                                        
                                        dreamEntries.push(dreamEntry);
                                        entriesProcessed++;
                                        dreamEntriesCreated++;
                                    }
                                }
                            }
                        }
                        // END IMPROVED STACK LOGIC
                        this.logger?.debug('Scrape', `Parsed callout structure for file: ${path}`, { journals, blockStack: blockStack.length });
                        
                        // Log summary for this file
                        const fileDreamDiaries = journals.reduce((sum, j) => sum + j.diaries.length, 0);
                        const fileEntriesCreated = dreamEntries.length - entriesProcessed + dreamEntriesCreated;
                        if (fileDreamDiaries > 0) {
                            this.logger?.info('Parse', `File Summary: ${path}`, {
                                dreamDiaryCallouts: fileDreamDiaries,
                                entriesCreated: fileEntriesCreated - (dreamEntries.length - dreamEntriesCreated),
                                discrepancy: fileDreamDiaries !== (fileEntriesCreated - (dreamEntries.length - dreamEntriesCreated))
                            });
                        }
                    } catch (error) {
                        this.logger?.error('Scrape', `Error processing file ${path}:`, error as Error);
                        new Notice(`Error processing file: ${path}`);
                    }
                });
                
                // Wait for batch to complete
                await Promise.all(batchPromises);
            }

            // Add final summary log
            this.logger?.info('Scrape', `FINAL SUMMARY`, {
                totalDreamDiaryCallouts: dreamDiaryCalloutsFound,
                totalEntriesCreated: dreamEntriesCreated,
                discrepancy: dreamDiaryCalloutsFound !== dreamEntriesCreated,
                validNotes: validNotes
            });

            // Also write a simple debug file for easy reading
            try {
                const summaryText = `OneiroMetrics Debug Summary
Generated: ${new Date().toISOString()}

TOTALS:
- Dream-diary callouts found: ${dreamDiaryCalloutsFound}
- Dream entries created: ${dreamEntriesCreated} 
- Discrepancy: ${dreamDiaryCalloutsFound !== dreamEntriesCreated ? 'YES - MISSING ENTRIES' : 'NO - PERFECT MATCH'}
- Files processed: ${validNotes}

Expected: 148 callouts → 148 entries
Current: ${dreamDiaryCalloutsFound} callouts → ${dreamEntriesCreated} entries
Missing: ${dreamDiaryCalloutsFound - dreamEntriesCreated} entries
`;
                await this.app.vault.adapter.write('debug-summary.txt', summaryText);
            } catch (e) {
                // Silent fail - debug file is optional
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
     * Update the metrics note with the metrics data
     * This is a wrapper that calls the plugin's updateProjectNote method
     * 
     * @param metrics - Record of metrics data to update
     * @param dreamEntries - Array of dream entries to include
     */
    public async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): Promise<void> {
        try {
            // Convert new DreamMetricData to legacy format for compatibility
            const legacyEntries = dreamEntries.map(entry => ({
                ...entry,
                source: typeof entry.source === 'string' ? entry.source : entry.source?.file || 'unknown'
            }));
            // Call the plugin's method
            await this.plugin.updateProjectNote(metrics, legacyEntries as any);
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
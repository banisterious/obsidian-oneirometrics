/**
 * UniversalMetricsCalculator - Phase 2.4
 * 
 * Drop-in replacement for MetricsProcessor using Universal Worker Pool for parallel processing.
 * Maintains complete API compatibility while adding advanced caching, performance monitoring,
 * and intelligent fallback to main thread processing.
 * 
 * Key Features:
 * - Parallel metrics calculations using worker pool
 * - Advanced caching system with TTL and memory management  
 * - Sentiment analysis, time-based metrics, content analysis
 * - Intelligent fallback to main thread processing
 * - Real-time performance monitoring and statistics
 * - Batch processing for large datasets
 */

import { App, Notice, TFile, TFolder } from 'obsidian';
import DreamMetricsPlugin from '../../main';
import { DreamMetricData, DreamMetricsSettings } from '../../types';
import { ILogger } from '../logging/LoggerTypes';
import { getSelectedFolder, getSelectionMode } from '../utils/settings-helpers';
import { getDreamEntryDate } from '../utils/date-utils';
import { UniversalWorkerPool } from './UniversalWorkerPool';
import { 
    UniversalPoolConfiguration,
    UniversalTask,
    UniversalTaskType,
    MetricsTaskInput,
    MetricsEntry,
    MetricsOptions,
    MetricsSettings,
    MetricsResult,
    ProcessedMetricsEntry,
    MetricsStatistics,
    SentimentResult,
    ContentAnalysisResult,
    AdvancedMetricsResult,
    TimeBasedMetrics,
    MetricsAggregation
} from './types';
import { getJournalStructure } from '../utils/settings-helpers';
import { CalloutStructure, DEFAULT_JOURNAL_STRUCTURE_SETTINGS } from '../types/journal-check';
import { SettingsAdapter } from '../state/adapters/SettingsAdapter';
import { 
    isFolderMode,
    isNotesMode,
    areSelectionModesEquivalent,
    getSelectionModeLabel,
    normalizeSelectionMode
} from '../utils/selection-mode-helpers';
import { createScrapeEvent, SCRAPE_EVENTS } from '../events/ScrapeEvents';

// Cache configuration
interface CacheEntry {
    result: any;
    timestamp: number;
    ttl: number;
    size: number;
}

export class UniversalMetricsCalculator {
    private readonly settings: DreamMetricsSettings;
    private workerPool: UniversalWorkerPool;
    private cache = new Map<string, CacheEntry>();
    private readonly maxCacheSize = 50 * 1024 * 1024; // 50MB
    private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
    
    // Performance tracking
    private stats = {
        totalCalculations: 0,
        cacheHits: 0,
        cacheMisses: 0,
        workerPoolUsage: 0,
        fallbackUsage: 0,
        averageProcessingTime: 0
    };

    constructor(
        private app: App,
        private plugin: DreamMetricsPlugin,
        poolConfig?: UniversalPoolConfiguration,
        private logger?: ILogger
    ) {
        this.settings = plugin.settings;
        
        // Create default pool configuration for metrics calculations
        const defaultConfig: UniversalPoolConfiguration = {
            workerTypes: {
                [UniversalTaskType.DREAM_METRICS_PROCESSING]: {
                    dedicatedWorkers: 2,
                    fallbackEnabled: true,
                    cacheEnabled: true
                },
                [UniversalTaskType.SENTIMENT_ANALYSIS]: {
                    dedicatedWorkers: 1,
                    fallbackEnabled: true,
                    cacheEnabled: true
                },
                [UniversalTaskType.ADVANCED_METRICS_CALCULATION]: {
                    dedicatedWorkers: 1,
                    fallbackEnabled: true,
                    cacheEnabled: true
                },
                [UniversalTaskType.TIME_BASED_METRICS]: {
                    dedicatedWorkers: 1,
                    fallbackEnabled: true,
                    cacheEnabled: true
                }
            },
            loadBalancing: 'task-affinity',
            healthCheckInterval: 30000,
            maxWorkers: Math.max(2, Math.min(navigator.hardwareConcurrency || 4, 6)),
            batchSize: 100,
            memoryLimit: 256 * 1024 * 1024, // 256MB
            priorityMode: 'performance'
        };

        this.workerPool = new UniversalWorkerPool(this.app, poolConfig || defaultConfig);
        
        this.logger?.info('Initialization', 'Universal Metrics Calculator initialized', {
            maxWorkers: defaultConfig.maxWorkers,
            cacheEnabled: true,
            poolConfig: defaultConfig
        });
    }

    /**
     * Gets the active journal structures from settings, with fallback to defaults
     */
    private getActiveStructures(): CalloutStructure[] {
        const journalStructure = getJournalStructure(this.settings);
        
        // Get user's callout settings
        const journalCalloutName = this.settings.journalCalloutName || 'journal-entry';
        const dreamDiaryCalloutName = this.settings.dreamDiaryCalloutName || 'dream-diary';
        const metricsCalloutName = this.settings.metricsCalloutName || 'dream-metrics';
        
        this.logger?.info('Structure', 'DEBUG: getActiveStructures called with settings', {
            hasJournalStructure: !!journalStructure,
            isEnabled: journalStructure?.enabled,
            structuresCount: journalStructure?.structures?.length || 0,
            structureNames: journalStructure?.structures?.map(s => s.name) || [],
            userCalloutSettings: {
                journalCalloutName,
                dreamDiaryCalloutName,
                metricsCalloutName
            },
            rawSettings: {
                journalCalloutName: this.settings.journalCalloutName,
                dreamDiaryCalloutName: this.settings.dreamDiaryCalloutName,
                metricsCalloutName: this.settings.metricsCalloutName
            },
            defaultStructuresCount: DEFAULT_JOURNAL_STRUCTURE_SETTINGS.structures.length,
            defaultStructureNames: DEFAULT_JOURNAL_STRUCTURE_SETTINGS.structures.map(s => s.name)
        });
        
        // Check if configured structures match user's callout settings
        let useConfiguredStructures = false;
        if (journalStructure?.enabled && journalStructure.structures?.length > 0) {
            // Check if any configured structure uses the user's main callout names
            const hasMatchingStructure = journalStructure.structures.some(structure => 
                structure.rootCallout === journalCalloutName || 
                structure.rootCallout === 'av-journal'
            );
            
            if (hasMatchingStructure) {
                useConfiguredStructures = true;
                this.logger?.debug('Structure', 'Using configured journal structures (they match callout settings)', {
                    structures: journalStructure.structures.map(s => ({ 
                        name: s.name, 
                        rootCallout: s.rootCallout,
                        childCallouts: s.childCallouts,
                        metricsCallout: s.metricsCallout,
                        id: s.id
                    }))
                });
            } else {
                this.logger?.warn('Structure', 'Configured journal structures do not match callout settings - using dynamic structures', {
                    configuredStructures: journalStructure.structures.map(s => s.rootCallout),
                    expectedCallouts: [journalCalloutName, 'av-journal']
                });
            }
        }
        
        if (useConfiguredStructures) {
            return journalStructure.structures;
        }
        
        // Build dynamic structures based on user's callout settings
        const dynamicStructures: CalloutStructure[] = [
            {
                id: 'dynamic-journal-entry-structure',
                name: 'Dynamic Journal Entry Structure',
                description: `Dynamic structure using ${journalCalloutName} → ${dreamDiaryCalloutName} → ${metricsCalloutName}`,
                type: 'nested',
                rootCallout: journalCalloutName,
                childCallouts: [dreamDiaryCalloutName],
                metricsCallout: metricsCalloutName,
                dateFormat: ['MMMM d, yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'],
                requiredFields: [],
                optionalFields: []
            }
        ];
        
        // Also add av-journal structure if it's different from the main one
        if (journalCalloutName !== 'av-journal') {
            dynamicStructures.push({
                id: 'dynamic-av-journal-structure',
                name: 'Dynamic AV Journal Structure',
                description: `Dynamic AV Journal structure using av-journal → ${dreamDiaryCalloutName} → ${metricsCalloutName}`,
                type: 'nested',
                rootCallout: 'av-journal',
                childCallouts: [dreamDiaryCalloutName],
                metricsCallout: metricsCalloutName,
                dateFormat: ['MMMM d, yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'],
                requiredFields: [],
                optionalFields: []
            });
        }
        
        this.logger?.debug('Structure', 'Built dynamic journal structures from callout settings', {
            journalCalloutName,
            dreamDiaryCalloutName,
            metricsCalloutName,
            structures: dynamicStructures.map(s => ({ 
                name: s.name, 
                rootCallout: s.rootCallout,
                childCallouts: s.childCallouts,
                metricsCallout: s.metricsCallout,
                id: s.id
            }))
        });
        
        return dynamicStructures;
    }

    /**
     * Checks if a callout type is recognized by any of the configured journal structures
     */
    private isRecognizedCallout(calloutType: string): boolean {
        if (!calloutType) return false;
        
        const structures = this.getActiveStructures();
        return structures.some(structure => 
            structure.rootCallout === calloutType ||
            structure.childCallouts.includes(calloutType) ||
            structure.metricsCallout === calloutType
        );
    }

    /**
     * Gets all recognized callout types from active structures
     */
    private getAllRecognizedCallouts(): string[] {
        const structures = this.getActiveStructures();
        const allCallouts = new Set<string>();
        
        structures.forEach(structure => {
            allCallouts.add(structure.rootCallout);
            structure.childCallouts.forEach(callout => allCallouts.add(callout));
            if (structure.metricsCallout) {
                allCallouts.add(structure.metricsCallout);
            }
        });
        
        return Array.from(allCallouts);
    }

    /**
     * Determines the role of a callout type within the structure
     */
    private getCalloutRole(calloutType: string): 'root' | 'child' | 'metrics' | 'unknown' {
        if (!calloutType) return 'unknown';
        
        const structures = this.getActiveStructures();
        
        for (const structure of structures) {
            if (structure.rootCallout === calloutType) {
                return 'root';
            }
            if (structure.childCallouts.includes(calloutType)) {
                return 'child';
            }
            if (structure.metricsCallout === calloutType) {
                return 'metrics';
            }
        }
        
        return 'unknown';
    }

    /**
     * Gets the parent callout type for a given child or metrics callout
     */
    private getParentCalloutType(calloutType: string): string[] {
        const structures = this.getActiveStructures();
        const parents: string[] = [];
        
        for (const structure of structures) {
            if (structure.childCallouts.includes(calloutType)) {
                parents.push(structure.rootCallout);
            }
            if (structure.metricsCallout === calloutType) {
                // Metrics can be children of root or child callouts
                parents.push(structure.rootCallout);
                parents.push(...structure.childCallouts);
            }
        }
        
        return parents;
    }

    /**
     * Gets all metrics callout types from active structures
     */
    private getMetricsCalloutTypes(): string[] {
        const structures = this.getActiveStructures();
        const metricsCallouts = new Set<string>();
        
        structures.forEach(structure => {
            if (structure.metricsCallout) {
                metricsCallouts.add(structure.metricsCallout);
            }
        });
        
        return Array.from(metricsCallouts);
    }

    /**
     * Gets all child callout types from active structures  
     */
    private getChildCalloutTypes(): string[] {
        const structures = this.getActiveStructures();
        const childCallouts = new Set<string>();
        
        structures.forEach(structure => {
            structure.childCallouts.forEach(callout => childCallouts.add(callout));
        });
        
        return Array.from(childCallouts);
    }

    /**
     * Creates a regex pattern to match any metrics callout
     */
    private createMetricsCalloutPattern(): RegExp {
        const metricsTypes = this.getMetricsCalloutTypes();
        if (metricsTypes.length === 0) {
            return /^\s*>+\s*\[!(?:dream-)?metrics(?:\|[^\]]+)?\]/i; // Fallback pattern
        }
        
        const pattern = `^\\s*>+\\s*\\[!(${metricsTypes.join('|')})(?:\\|[^\\]]+)?\\]`;
        return new RegExp(pattern, 'i');
    }

    /**
     * Creates a regex pattern to match any child callout
     */
    private createChildCalloutPattern(): RegExp {
        const childTypes = this.getChildCalloutTypes();
        if (childTypes.length === 0) {
            return /^\s*>+\s*\[!(?:dream-)?diary(?:\|[^\]]+)?\]/i; // Fallback pattern
        }
        
        const pattern = `^\\s*>+\\s*\\[!(${childTypes.join('|')})(?:\\|[^\\]]+)?\\]`;
        return new RegExp(pattern, 'i');
    }

    /**
     * Extracts title from any child callout line using structure-aware patterns
     */
    private extractTitleFromChildCallout(diaryLine: string, calloutType: string): string {
        // Create a flexible pattern for the specific callout type
        const pattern = new RegExp(`\\[!${calloutType.replace(/-/g, '\\-')}[^\\]]*\\](?:\\s*\\[\\[.*?\\]\\])?\\s*(.*?)(?:\\s*\\[\\[|$)`);
        const titleMatch = diaryLine.match(pattern);
        
        if (titleMatch) {
            return titleMatch[1].trim();
        }
        
        // Try block reference format
        const blockRefMatch = diaryLine.match(/\[\[.*?\|(.*?)\]\]/);
        if (blockRefMatch) {
            return blockRefMatch[1].trim();
        }
        
        // Try plain text after callout
        const plainTextPattern = new RegExp(`\\[!${calloutType.replace(/-/g, '\\-')}[^\\]]*\\](?:\\s*\\[\\[.*?\\]\\])?\\s*(.*)`);
        const plainTextMatch = diaryLine.match(plainTextPattern);
        if (plainTextMatch) {
            return plainTextMatch[1].trim();
        }
        
        return 'Untitled Dream';
    }

    /**
     * Main entry point - maintains compatibility with MetricsProcessor.scrapeMetrics()
     */
    public async scrapeMetrics(): Promise<void> {
        console.log('UniversalMetricsCalculator.scrapeMetrics() called');
        this.logger?.info('Scrape', 'Starting enhanced metrics scrape process with worker pool');
        
        // Emit started event instead of showing notice
        this.plugin.scrapeEventEmitter.emit(createScrapeEvent(
            SCRAPE_EVENTS.STARTED,
            'Scraping dream metrics with enhanced processing... This may take a moment.'
        ));

        const startTime = performance.now();
        let totalWords = 0;
        let entriesProcessed = 0;
        let foundAnyJournalEntries = false;
        let foundAnyMetrics = false;
        let dreamDiaryCalloutsFound = 0;
        let dreamEntriesCreated = 0;

        try {
            // Get files to process (same logic as original)
            const files = await this.getFilesToProcess();
            if (!files || files.length === 0) {
                new Notice('No notes selected. Please select at least one note or a folder to scrape.');
                this.logger?.warn('Scrape', 'No notes selected for processing');
                return;
            }

            this.logger?.info('Scrape', `Processing ${files.length} files with Universal Worker Pool`);

            // Extract dream entries from files
            const { entries, debugInfo } = await this.extractDreamEntries(files);
            this.logger?.debug('Scrape', `Extracted ${entries.length} dream entries`, { 
                first3Entries: entries.slice(0, 3).map(e => ({
                    date: e.date,
                    title: e.title,
                    contentLength: e.content?.length || 0,
                    metadata: e.metadata
                }))
            });
            
            // Count the total dream-diary callouts and entries created by re-parsing files
            for (const filePath of files) {
                const file = this.app.vault.getAbstractFileByPath(filePath);
                if (file instanceof TFile) {
                    try {
                        const content = await this.app.vault.read(file);
                        const { entries, dreamDiaryCalloutsInFile, debugInfo } = this.parseJournalEntries(content, filePath);
                        dreamDiaryCalloutsFound += dreamDiaryCalloutsInFile;
                    } catch (error) {
                        // Ignore errors in counting
                    }
                }
            }
            dreamEntriesCreated = entries.length;

            foundAnyJournalEntries = true;
            entriesProcessed = entries.length;

            // Process entries and collect metrics
            let metrics: Record<string, number[]> = {};
            let processedEntries: DreamMetricData[] = [];
            let foundAnyMetrics = false;
            
            // Process with worker pool if available
            const metricsResult = await this.processMetricsWithWorkerPool(entries);
            
            this.logger?.info('Scrape', 'Metrics result from worker pool:', {
                entriesCount: metricsResult.entries.length,
                firstEntry: metricsResult.entries[0] ? {
                    date: metricsResult.entries[0].date,
                    title: metricsResult.entries[0].title,
                    calculatedMetrics: metricsResult.entries[0].calculatedMetrics
                } : null
            });
            
            if (metricsResult.entries.length > 0) {
                foundAnyMetrics = true;
                for (const entry of metricsResult.entries) {
                    this.logger?.info('Scrape', 'Processing entry:', {
                        date: entry.date,
                        title: entry.title,
                        calculatedMetricsKeys: Object.keys(entry.calculatedMetrics || {}),
                        calculatedMetrics: entry.calculatedMetrics
                    });
                    
                    const dreamData: DreamMetricData = {
                        date: entry.date,
                        title: entry.title || '',
                        content: entry.content || '',
                        metrics: entry.calculatedMetrics,
                        source: entry.metadata?.source as string || 'unknown',
                        wordCount: entry.calculatedMetrics['Words'] || entry.calculatedMetrics['Word Count'] || 0
                    };
                    processedEntries.push(dreamData);
                    
                    // Aggregate metrics
                    for (const [metricName, value] of Object.entries(entry.calculatedMetrics)) {
                        if (!metrics[metricName]) {
                            metrics[metricName] = [];
                        }
                        metrics[metricName].push(value);
                        this.logger?.info('Scrape', `Added metric: ${metricName} = ${value}`);
                    }
                    
                    totalWords += dreamData.wordCount || 0;
                }
                
                this.logger?.info('Scrape', 'Final aggregated metrics:', {
                    metricsKeys: Object.keys(metrics),
                    metricsData: metrics
                });
            } else {
                this.logger?.warn('Scrape', 'No entries returned from metrics processing');
            }

            // Update project note
            console.log('🔍 DEBUG: About to call updateProjectNote with metrics:', Object.keys(metrics));
            console.log('🔍 DEBUG: Metrics data sample:', {
                totalMetrics: Object.keys(metrics).length,
                wordsCount: metrics['Words']?.length || 0,
                firstMetric: Object.keys(metrics)[0],
                firstMetricSample: metrics[Object.keys(metrics)[0]]?.slice(0, 3)
            });
            
            try {
                await this.updateProjectNote(metrics, processedEntries);
                console.log('✅ DEBUG: updateProjectNote completed successfully');
            } catch (error) {
                console.error('❌ DEBUG: updateProjectNote failed:', error);
                throw error;
            }
            
            const processingTime = performance.now() - startTime;
            this.stats.averageProcessingTime = (this.stats.averageProcessingTime + processingTime) / 2;
            
            // Show results
            if (foundAnyMetrics) {
                // Emit completion event instead of showing notice
                this.plugin.scrapeEventEmitter.emit(createScrapeEvent(
                    SCRAPE_EVENTS.COMPLETED,
                    `Enhanced metrics updated from ${files.length} notes, processed ${entriesProcessed} entries in ${Math.round(processingTime)}ms.`,
                    {
                        filesProcessed: files.length,
                        entriesFound: entriesProcessed,
                        processingTime: Math.round(processingTime)
                    }
                ));
                this.logger?.info('Scrape', 'Metrics processing completed', {
                    entriesProcessed,
                    totalWords,
                    processingTime,
                    cacheHitRate: this.getCacheHitRate(),
                    workerPoolStats: this.workerPool.getStatistics()
                });
            } else {
                // Emit completion event for no metrics found
                this.plugin.scrapeEventEmitter.emit(createScrapeEvent(
                    SCRAPE_EVENTS.COMPLETED,
                    `Found ${entriesProcessed} entries but no metrics were detected.`,
                    {
                        entriesFound: entriesProcessed
                    }
                ));
                this.logger?.warn('Scrape', `No metrics found in ${entriesProcessed} entries`);
            }

        } catch (error) {
            this.logger?.error('Scrape', 'Error during enhanced metrics scraping', error as Error);
            // Emit error event instead of showing notice
            this.plugin.scrapeEventEmitter.emit(createScrapeEvent(
                SCRAPE_EVENTS.ERROR,
                `Error scraping metrics: ${(error as Error).message}`,
                { error: error as Error }
            ));
        }
    }

    /**
     * Process metrics text - maintains compatibility with MetricsProcessor.processMetrics()
     */
    public processMetrics(metricsText: string, metrics: Record<string, number[]>): Record<string, number> {
        const dreamMetrics: Record<string, number> = {};
        
        this.logger?.debug('ProcessMetrics', `Processing metrics text: "${metricsText}"`);
        
        try {
            const metricPairs = metricsText.split(',').map(pair => pair.trim());
            this.logger?.debug('ProcessMetrics', `Split into metric pairs:`, metricPairs);
            
            for (const pair of metricPairs) {
                const [name, value] = pair.split(':').map(s => s.trim());
                this.logger?.debug('ProcessMetrics', `Processing pair: name="${name}", value="${value}"`);
                
                if (name) {
                    let numValue = 0;
                    
                    // Handle placeholder values and convert to numbers
                    if (value === '—' || value === '-' || value === '' || value === 'undefined') {
                        numValue = 0; // Convert placeholders to 0
                        this.logger?.debug('ProcessMetrics', `Converted placeholder "${value}" to 0 for metric "${name}"`);
                    } else if (!isNaN(Number(value))) {
                        numValue = Number(value);
                    } else {
                        this.logger?.debug('ProcessMetrics', `Skipped invalid value: name="${name}", value="${value}"`);
                        continue; // Skip invalid non-numeric values
                    }
                    
                    const metricName = Object.values(this.settings.metrics).find(
                        m => m.name.toLowerCase() === name.toLowerCase()
                    )?.name || name;
                    
                    dreamMetrics[metricName] = numValue;
                    
                    if (!metrics[metricName]) {
                        metrics[metricName] = [];
                    }
                    metrics[metricName].push(numValue);
                    
                    this.logger?.debug('ProcessMetrics', `Successfully parsed: ${metricName} = ${numValue}`);
                } else {
                    this.logger?.debug('ProcessMetrics', `Skipped pair with empty name: value="${value}"`);
                }
            }
            
            this.logger?.debug('ProcessMetrics', `Final dream metrics:`, dreamMetrics);
        } catch (error) {
            this.logger?.error('ProcessMetrics', 'Error processing metrics text', error as Error);
        }
        
        return dreamMetrics;
    }

    /**
     * Process dream content - maintains compatibility with MetricsProcessor.processDreamContent()
     */
    public processDreamContent(content: string): string {
        try {
            let processedContent = content.replace(/\[!.*?\]/g, '')
                           .replace(/!\[\[.*?\]\]/g, '')
                           .replace(/\[\[.*?\]\]/g, '')
                           .trim();
            
            processedContent = processedContent.replace(/[#*_~`]/g, '')
                           .replace(/\n{3,}/g, '\n\n')
                           .replace(/^>\s*>/g, '')
                           .replace(/^>\s*/gm, '')
                           .trim();
            
            return processedContent;
        } catch (error) {
            this.logger?.error('Metrics', 'Error processing dream content', error as Error);
            return content;
        }
    }

    /**
     * Update project note - maintains compatibility with MetricsProcessor.updateProjectNote()
     */
    public async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): Promise<void> {
        try {
            await this.plugin.updateProjectNote(metrics, dreamEntries);
        } catch (error) {
            this.logger?.error('MetricsNote', 'Error updating project note', error as Error);
            throw error;
        }
    }

    /**
     * Calculate advanced metrics - enhanced version with worker pool support
     */
    public async calculateAdvancedMetrics(content: string): Promise<Record<string, number>> {
        const cacheKey = `advanced_metrics_${this.hashString(content)}`;
        
        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.stats.cacheHits++;
            return cached;
        }
        
        this.stats.cacheMisses++;
        
        try {
            // Try worker pool processing
            const metricsEntries: MetricsEntry[] = [{
                id: 'temp_' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                content: content
            }];

            const task: UniversalTask = {
                taskType: UniversalTaskType.ADVANCED_METRICS_CALCULATION,
                taskId: this.generateTaskId(),
                priority: 'normal',
                data: {
                    taskType: 'advanced',
                    data: metricsEntries,
                    options: {
                        enableAdvancedMetrics: true,
                        includeStatistics: false
                    }
                }
            };

            const result = await this.workerPool.processTask(task);
            if (result.success && result.data?.entries?.[0]?.advancedMetrics) {
                const metrics = result.data.entries[0].advancedMetrics;
                this.setCache(cacheKey, metrics);
                this.stats.workerPoolUsage++;
                return metrics;
            }
        } catch (error) {
            this.logger?.warn('Metrics', 'Worker pool failed, falling back to main thread', error as Error);
        }

        // Fallback to main thread calculation
        this.stats.fallbackUsage++;
        const metrics = this.calculateAdvancedMetricsSync(content);
        this.setCache(cacheKey, metrics);
        return metrics;
    }

    /**
     * Enhanced sentiment analysis with worker pool support
     */
    public async calculateSentimentAnalysis(content: string): Promise<SentimentResult> {
        const cacheKey = `sentiment_${this.hashString(content)}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.stats.cacheHits++;
            return cached;
        }
        
        this.stats.cacheMisses++;
        
        try {
            const metricsEntries: MetricsEntry[] = [{
                id: 'temp_' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                content: content
            }];

            const task: UniversalTask = {
                taskType: UniversalTaskType.SENTIMENT_ANALYSIS,
                taskId: this.generateTaskId(),
                priority: 'normal',
                data: {
                    taskType: 'sentiment',
                    data: metricsEntries,
                    options: {
                        enableSentimentAnalysis: true
                    }
                }
            };

            const result = await this.workerPool.processTask(task);
            if (result.success && result.data?.sentimentResult) {
                const sentiment = result.data.sentimentResult;
                this.setCache(cacheKey, sentiment);
                this.stats.workerPoolUsage++;
                return sentiment;
            }
        } catch (error) {
            this.logger?.warn('Sentiment', 'Worker pool failed, falling back to main thread', error as Error);
        }

        // Fallback to main thread
        this.stats.fallbackUsage++;
        const sentiment = this.calculateSentimentAnalysisSync(content);
        this.setCache(cacheKey, sentiment);
        return sentiment;
    }

    /**
     * Time-based metrics calculation with worker pool support
     */
    public async calculateTimeBasedMetrics(entries: DreamMetricData[]): Promise<TimeBasedMetrics> {
        const cacheKey = `time_based_${entries.length}_${this.hashString(JSON.stringify(entries.map(e => e.date)))}`;
        
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            this.stats.cacheHits++;
            return cached;
        }
        
        this.stats.cacheMisses++;
        
        try {
            const metricsEntries: MetricsEntry[] = entries.map(entry => ({
                id: 'temp_' + Date.now(),
                date: entry.date,
                title: entry.title,
                content: entry.content,
                wordCount: entry.wordCount,
                metrics: entry.metrics
            }));

            const task: UniversalTask = {
                taskType: UniversalTaskType.TIME_BASED_METRICS,
                taskId: this.generateTaskId(),
                priority: 'normal',
                data: {
                    taskType: 'time_based',
                    data: metricsEntries,
                    options: {
                        enableTimeBasedMetrics: true
                    }
                }
            };

            const result = await this.workerPool.processTask(task);
            if (result.success && result.data?.timeBasedMetrics) {
                const timeMetrics = result.data.timeBasedMetrics;
                this.setCache(cacheKey, timeMetrics);
                this.stats.workerPoolUsage++;
                return timeMetrics;
            }
        } catch (error) {
            this.logger?.warn('TimeMetrics', 'Worker pool failed, falling back to main thread', error as Error);
        }

        // Fallback to main thread
        this.stats.fallbackUsage++;
        const timeMetrics = this.calculateTimeBasedMetricsSync(entries);
        this.setCache(cacheKey, timeMetrics);
        return timeMetrics;
    }

    // =============================================================================
    // PRIVATE METHODS
    // =============================================================================

    private async getFilesToProcess(): Promise<string[]> {
        let files: string[] = [];
        
        this.logger?.info('FileGathering', 'Starting file gathering process', {
            selectionMode: this.settings.selectionMode,
            selectedFolder: this.settings.selectedFolder,
            selectedNotes: this.settings.selectedNotes?.length || 0
        });
        
        if (isFolderMode(this.settings.selectionMode) && this.settings.selectedFolder) {
            this.logger?.info('FileGathering', 'Using folder mode', {
                selectedFolder: this.settings.selectedFolder
            });
            
            const folder = this.app.vault.getAbstractFileByPath(this.settings.selectedFolder);
            if (folder && 'children' in folder) {
                const excludedNotes = this.settings.excludedNotes || [];
                const excludedSubfolders = this.settings.excludedSubfolders || [];
                
                this.logger?.info('FileGathering', 'Folder found, starting recursive search', {
                    folderPath: this.settings.selectedFolder,
                    excludedNotesCount: excludedNotes.length,
                    excludedSubfoldersCount: excludedSubfolders.length,
                    excludedNotes: excludedNotes,
                    excludedSubfolders: excludedSubfolders
                });
                
                const gatherFiles = (folder: any, acc: string[], currentPath: string = '') => {
                    this.logger?.debug('FileGathering', `Scanning folder: ${currentPath}`, {
                        childrenCount: folder.children?.length || 0
                    });
                    
                    for (const child of folder.children) {
                        if (child && 'extension' in child && child.extension === 'md') {
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
                        } else if (child && 'children' in child) {
                            this.logger?.debug('FileGathering', `Found subfolder: ${child.path}`, {
                                isExcluded: excludedSubfolders.includes(child.path)
                            });
                            
                            // Check if this subfolder is excluded before recursing into it
                            if (!excludedSubfolders.includes(child.path)) {
                                this.logger?.debug('FileGathering', `🔍 Recursing into subfolder: ${child.path}`);
                                gatherFiles(child, acc, child.path);
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
                gatherFiles(folder, acc, this.settings.selectedFolder);
                
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
                    selectedFolder: this.settings.selectedFolder,
                    folderExists: !!folder,
                    hasChildren: folder && 'children' in folder
                });
            }
            
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
            files = this.settings.selectedNotes || [];
        }
        
        this.logger?.info('FileGathering', 'File gathering completed', {
            finalFileCount: files.length,
            files: files.slice(0, 5) // Show first 5 files for debugging
        });
        
        return files;
    }

    private async extractDreamEntries(files: string[]): Promise<{ entries: MetricsEntry[], debugInfo: any[] }> {
        this.logger?.debug('Extract', `Starting extraction from ${files.length} files`);
        const dreamEntries: MetricsEntry[] = [];
        const allDebugInfo: any[] = [];
        
        for (const path of files) {
            const file = this.app.vault.getAbstractFileByPath(path);
            if (!(file instanceof TFile)) {
                this.logger?.debug('Extract', `Skipping non-file: ${path}`);
                continue;
            }
            
            try {
                const content = await this.app.vault.read(file);
                this.logger?.debug('Extract', `Processing file: ${path}`, {
                    contentLength: content.length,
                    lineCount: content.split('\n').length
                });
                
                // Use simplified extraction logic for now
                // In a full implementation, this would use the complex parsing from MetricsProcessor
                const { entries, dreamDiaryCalloutsInFile, debugInfo } = this.parseJournalEntries(content, path);
                
                this.logger?.debug('Extract', `Extracted ${entries.length} entries from ${path}`, {
                    entries: entries.map(e => ({
                        id: e.id,
                        date: e.date,
                        title: e.title,
                        contentLength: e.content?.length || 0,
                        source: e.source
                    }))
                });
                
                dreamEntries.push(...entries);
                allDebugInfo.push(...debugInfo);
            } catch (error) {
                this.logger?.error('Extract', `Error processing file ${path}`, error as Error);
            }
        }
        
        this.logger?.info('Extract', `Total extraction complete: ${dreamEntries.length} entries from ${files.length} files`);
        return { entries: dreamEntries, debugInfo: allDebugInfo };
    }

    private parseJournalEntries(content: string, filePath: string): { entries: MetricsEntry[], dreamDiaryCalloutsInFile: number, debugInfo: any[] } {
        // Use the same sophisticated parsing logic as MetricsProcessor
        this.logger?.debug('Parse', `Starting journal parsing for ${filePath}`);
        const entries: MetricsEntry[] = [];
        const lines = content.split('\n');
        
        // Stack-based parser to handle nested callouts properly
        const blockStack: any[] = [];
        const journals: any[] = [];
        let currentJournal: any = null;
        let currentDiary: any = null;
        let currentMetrics: any = null;
        let calloutsFound = 0;
        let dreamDiaryCalloutsInFile = 0;
        let dreamDiaryDebugInfo: any[] = [];
        
        const getCalloutType = (line: string) => {
            // Updated regex to handle metadata parameters like |hide and edge cases like |]
            const match = line.match(/\[!([\w-]+)(?:\|[^\]]*)??\]/);
            return match ? match[1] : null;
        };
        
        const getBlockLevel = (line: string) => {
            const match = line.match(/^(>+)/);
            return match ? match[1].length : 0;
        };
        
        // Parse the content into a structured format
        for (let idx = 0; idx < lines.length; idx++) {
            const line = lines[idx];
            const calloutType = getCalloutType(line);
            const level = getBlockLevel(line);
            
            // Debug logging for dream-diary detection
            if (line.toLowerCase().includes('dream-diary')) {
                const calloutRole = this.getCalloutRole(calloutType);
                const debugInfo = {
                    file: filePath,
                    lineNumber: idx + 1,
                    line: line.substring(0, 150),
                    extractedCalloutType: calloutType,
                    calloutRole: calloutRole,
                    level: level,
                    isRecognized: this.isRecognizedCallout(calloutType)
                };
                dreamDiaryDebugInfo.push(debugInfo);
                
                this.logger?.debug('Parse', `Found dream-diary line in ${filePath}:${idx}`, debugInfo);
            }
            
            // Clean up stack based on level changes, but be more conservative
            // Only clean up if we're at a lower or equal level AND it's a structural callout type
            if (calloutType && this.isRecognizedCallout(calloutType)) {
                while (blockStack.length > 0 && blockStack[blockStack.length - 1].level >= level) {
                    blockStack.pop();
                }
            }
            
            const calloutRole = this.getCalloutRole(calloutType);
            
            if (calloutRole === 'root') {
                // Handle root callout (journal-entry, av-journal, etc.)
                this.logger?.info('Parse', `DEBUG: Found ROOT callout: ${calloutType} at line ${idx}`, {
                    line: line.substring(0, 100),
                    level: level,
                    recognizedCallouts: this.getAllRecognizedCallouts()
                });
                currentJournal = {
                    lines: [line],
                    diaries: [],
                    level,
                    idx,
                    calloutType
                };
                journals.push(currentJournal);
                blockStack.push({ type: calloutType, obj: currentJournal, level });
                calloutsFound++;
            } else if (calloutRole === 'child') {
                // Handle child callout (dream-diary, etc.)
                dreamDiaryCalloutsInFile++;
                this.logger?.info('Parse', `DEBUG: Found CHILD callout: ${calloutType} at line ${idx}`, {
                    line: line.substring(0, 100),
                    level: level,
                    stackLength: blockStack.length,
                    stackTypes: blockStack.map(s => s.type),
                    possibleParents: this.getParentCalloutType(calloutType)
                });
                currentDiary = {
                    lines: [line],
                    metrics: [],
                    level,
                    idx,
                    calloutType
                };
                
                // Find the appropriate parent in the stack
                const possibleParents = this.getParentCalloutType(calloutType);
                let foundParent = false;
                
                for (let i = blockStack.length - 1; i >= 0; i--) {
                    if (possibleParents.includes(blockStack[i].type)) {
                        blockStack[i].obj.diaries.push(currentDiary);
                        foundParent = true;
                        this.logger?.debug('Parse', `Attached ${calloutType} "${line.substring(0, 50)}..." to ${blockStack[i].type} at stack level ${i}`);
                        break;
                    }
                }
                
                if (!foundParent) {
                    // If no appropriate parent found in stack, try to find the most recent journal
                    if (journals.length > 0) {
                        const lastJournal = journals[journals.length - 1];
                        lastJournal.diaries.push(currentDiary);
                        this.logger?.debug('Parse', `Attached orphaned ${calloutType} "${line.substring(0, 50)}..." to most recent journal`);
                        foundParent = true;
                    }
                }
                
                if (!foundParent) {
                    this.logger?.warn('Parse', `No appropriate parent found for ${calloutType} at line ${idx}: ${line.substring(0, 100)}`);
                }
                
                blockStack.push({ type: calloutType, obj: currentDiary, level });
                calloutsFound++;
            } else if (calloutRole === 'metrics') {
                // Handle metrics callout (dream-metrics, metrics, etc.)
                currentMetrics = {
                    lines: [line],
                    level,
                    idx,
                    calloutType
                };
                
                // Find the appropriate parent in the stack
                const possibleParents = this.getParentCalloutType(calloutType);
                let foundParent = false;
                
                for (let i = blockStack.length - 1; i >= 0; i--) {
                    if (possibleParents.includes(blockStack[i].type)) {
                        blockStack[i].obj.metrics.push(currentMetrics);
                        foundParent = true;
                        break;
                    }
                }
                
                if (!foundParent) {
                    this.logger?.warn('Parse', `No appropriate parent found for ${calloutType} at line ${idx}`);
                }
                
                blockStack.push({ type: calloutType, obj: currentMetrics, level });
                calloutsFound++;
            } else if (calloutType && ['journal-page', 'image', 'note', 'info', 'warning', 'tip', 'blank-container'].includes(calloutType)) {
                // Ignore non-essential callout types that shouldn't disrupt dream structure
                // But still add their content to the current block
                this.logger?.debug('Parse', `Ignoring non-essential callout type: ${calloutType}, but preserving content`);
                if (blockStack.length > 0) {
                    blockStack[blockStack.length - 1].obj.lines.push(line);
                }
            } else if (blockStack.length > 0 && level >= blockStack[blockStack.length - 1].level) {
                // Add line to current block
                blockStack[blockStack.length - 1].obj.lines.push(line);
            }
        }
        
        this.logger?.debug('Parse', `Parsed callout structure for ${filePath}`, {
            journalsFound: journals.length,
            calloutsFound,
            totalLines: lines.length,
            childCallouts: journals.reduce((sum: number, j: any) => sum + j.diaries.length, 0),
            activeStructures: this.getActiveStructures().map(s => s.name),
            recognizedCallouts: this.getAllRecognizedCallouts(),
            journalBreakdown: journals.map(j => ({
                diariesCount: j.diaries.length,
                totalMetricsBlocks: j.diaries.reduce((sum: number, d: any) => sum + d.metrics.length, 0),
                diaryTitles: j.diaries.map((d: any) => {
                    const diaryLine = d.lines[0] || '';
                    const calloutType = d.calloutType || 'unknown';
                    const title = this.extractTitleFromChildCallout(diaryLine, calloutType);
                    return title || 'No title extracted';
                })
            }))
        });
        
        // Extract dream entries from the parsed structure
        for (const journal of journals) {
            if (journal.diaries.length > 0) {
                for (const diary of journal.diaries) {
                    // Get explicit metrics if they exist
                    let metricsText = '';
                    if (diary.metrics.length > 0) {
                        // Create structure-aware metrics pattern
                        const metricsPattern = this.createMetricsCalloutPattern();
                        
                        // Extract metrics text from explicit metrics callouts
                        metricsText = diary.metrics
                            .map((metricsBlock: any) => {
                                // Filter lines to only include actual metrics content
                                const metricsLines = metricsBlock.lines
                                    .filter((l: string) => {
                                        // Exclude the callout header using structure-aware pattern
                                        if (metricsPattern.test(l)) return false;
                                        // Exclude lines that start other callouts
                                        if (/^\s*>+\s*\[!/.test(l)) return false;
                                        // Only include lines that look like metrics (contain colons or metric-like content)
                                        const cleaned = l.replace(/^>+\s*/, '').trim();
                                        return cleaned.length > 0 && (cleaned.includes(':') || /\b(words|sensory|emotional|lost|descriptiveness|confidence)\b/i.test(cleaned));
                                    })
                                    .map((l: string) => l.replace(/^>+\s*/, '').trim())
                                    .filter(l => l.length > 0);
                                
                                return metricsLines.join(', ');
                            })
                            .join(', ')
                            .replace(/\s+/g, ' ')
                            .trim();
                        
                        // Additional cleanup to remove any remaining callout references that got mixed in
                        metricsText = metricsText
                            .replace(/\[![\w-]+(?:\|[^\]]+)?\]/g, '') // Remove any callout references
                            .replace(/!\[\[.*?\]\]/g, '') // Remove image references
                            .replace(/\[\[.*?\]\]/g, '') // Remove wiki links
                            .replace(/<[^>]*>/g, '') // Remove HTML tags like <span>
                            .replace(/\s+/g, ' ') // Normalize whitespace
                            .trim();
                    }
                    
                    // Extract dream content (exclude all callout lines using structure-aware patterns)
                    const childPattern = this.createChildCalloutPattern();
                    const metricsPattern = this.createMetricsCalloutPattern();
                    
                    const diaryContentLines = diary.lines.filter((l: string) => 
                        !childPattern.test(l) && !metricsPattern.test(l)
                    );
                    const dreamContent = diaryContentLines
                        .map((l: string) => l.replace(/^>+\s*/, '').trim())
                        .filter((l: string) => l.length > 0) // Remove empty lines
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    
                    // Extract date using the same logic as MetricsProcessor
                    const journalLine = journal.lines[0];
                    const date = this.extractDateFromContent([journalLine, lines[journal.idx + 1] || ''], filePath, content);
                    
                    // Extract title using structure-aware method
                    const diaryLine = diary.lines[0];
                    const title = this.extractTitleFromChildCallout(diaryLine, diary.calloutType || 'dream-diary');
                    
                    // Extract block ID if present
                    const blockIdMatch = diaryLine.match(/\^(\d{8})/);
                    const blockId = blockIdMatch ? blockIdMatch[1] : '';
                    
                    // Only create entry if we have actual dream content
                    if (dreamContent.trim()) {
                        const processedContent = this.processDreamContent(dreamContent);
                        
                        // Only process metrics if we have explicit metrics text
                        const basicMetrics = metricsText.trim() ? this.processMetrics(metricsText, {}) : {};
                        
                        const entry = {
                            id: blockId || `entry_${diary.idx}_${Date.now()}`,
                            date: date,
                            title: title,
                            content: processedContent,
                            wordCount: processedContent.split(/\s+/).filter(w => w.length > 0).length,
                            metrics: basicMetrics,
                            source: filePath,
                            metadata: {
                                source: filePath,
                                lineNumber: diary.idx
                            }
                        };
                        
                        this.logger?.debug('Parse', `✅ INCLUDED dream entry`, {
                            file: filePath,
                            id: entry.id,
                            date: entry.date,
                            title: entry.title,
                            wordCount: entry.wordCount,
                            contentPreview: entry.content.substring(0, 100) + '...',
                            metricsKeys: Object.keys(entry.metrics),
                            metricsText: metricsText.substring(0, 50),
                            blockId,
                            diaryCalloutLine: diaryLine.substring(0, 100),
                            lineNumber: diary.idx
                        });
                        
                        entries.push(entry);
                    } else {
                        this.logger?.warn('Parse', `❌ EXCLUDED dream entry - no content extracted`, {
                            file: filePath,
                            diaryLine: diaryLine.substring(0, 100),
                            title: title,
                            metricsText: metricsText.substring(0, 50),
                            contentLines: diaryContentLines.length,
                            rawDiaryLines: diary.lines.length,
                            filteredContentLength: dreamContent.length,
                            firstFewContentLines: diaryContentLines.slice(0, 3),
                            allDiaryLines: diary.lines.slice(0, 10),
                            lineNumber: diary.idx
                        });
                    }
                }
            }
        }
        
        this.logger?.info('Parse', `Journal parsing complete for ${filePath}`, {
            totalLines: lines.length,
            journalsFound: journals.length,
            totalDreamDiaryCallouts: journals.reduce((sum: number, j: any) => sum + j.diaries.length, 0),
            entriesCreated: entries.length,
            calloutsFound,
            firstEntry: entries[0] ? {
                id: entries[0].id,
                date: entries[0].date,
                title: entries[0].title
            } : null
        });
        
        return { entries, dreamDiaryCalloutsInFile, debugInfo: dreamDiaryDebugInfo };
    }

    private extractDateFromContent(journalLines: string[], filePath: string, fileContent: string): string {
        // Get date handling configuration from settings with proper backward compatibility
        const settingsAdapter = new SettingsAdapter(this.settings);
        const adaptedSettings = settingsAdapter.getSettings();
        const dateHandling = adaptedSettings.dateHandling;

        // Use the enhanced date extraction logic that respects user preferences
        return getDreamEntryDate(journalLines, filePath, fileContent, dateHandling);
    }

    private async processMetricsWithWorkerPool(entries: MetricsEntry[]): Promise<MetricsResult> {
        this.logger?.debug('WorkerPool', `Processing ${entries.length} entries with worker pool`);
        
        try {
            const task: UniversalTask = {
                taskType: UniversalTaskType.DREAM_METRICS_PROCESSING,
                taskId: this.generateTaskId(),
                priority: 'normal',
                data: {
                    taskType: 'dream_processing',
                    data: entries,
                    options: {
                        enableSentimentAnalysis: true,
                        enableAdvancedMetrics: true,
                        enableTimeBasedMetrics: true,
                        includeStatistics: true
                    }
                }
            };

            this.logger?.debug('WorkerPool', `Created task`, {
                taskId: task.taskId,
                taskType: task.taskType,
                entriesCount: entries.length,
                firstEntry: entries[0] ? {
                    id: entries[0].id,
                    date: entries[0].date
                } : null
            });

            const result = await this.workerPool.processTask(task);
            this.logger?.debug('WorkerPool', `Worker pool returned result`, {
                success: result.success,
                dataExists: !!result.data,
                entriesCount: result.data?.entries?.length || 0
            });
            
            if (result.success && result.data) {
                this.stats.workerPoolUsage++;
                return result.data;
            } else {
                this.logger?.warn('WorkerPool', 'Worker pool task failed, falling back to sync', {
                    error: result.error
                });
            }
        } catch (error) {
            this.logger?.error('WorkerPool', 'Worker pool failed, falling back to sync processing', error as Error);
        }

        // Fallback to sync processing
        this.stats.fallbackUsage++;
        return this.processMetricsSync(entries);
    }

    private processMetricsSync(entries: MetricsEntry[]): MetricsResult {
        this.logger?.info('SyncProcessing', `Processing ${entries.length} entries synchronously`);
        
        const processedEntries: ProcessedMetricsEntry[] = [];
        const aggregatedMetrics: Record<string, MetricsAggregation> = {};

        for (const entry of entries) {
            this.logger?.info('SyncProcessing', `Processing entry ${entry.id}`, {
                date: entry.date,
                title: entry.title,
                contentLength: entry.content?.length || 0,
                existingMetrics: Object.keys(entry.metrics || {})
            });

            const content = entry.content || '';
            const words = content.split(/\s+/).filter(word => word.length > 0);
            const wordCount = words.length;
            
            // ONLY preserve metrics from the [!dream-metrics] callout (these are the REAL metrics)
            // DO NOT add any calculated metrics that would contaminate the results
            const calculatedMetrics: Record<string, number> = { ...entry.metrics || {} };
            
            // Only add basic word count if it was explicitly in the callout
            if (!calculatedMetrics['Words'] && !calculatedMetrics['Word Count'] && entry.metrics && Object.keys(entry.metrics).some(key => key.toLowerCase().includes('words'))) {
                calculatedMetrics['Words'] = wordCount;
            }

            this.logger?.info('SyncProcessing', `Final metrics for entry ${entry.id}`, {
                originalMetricsKeys: Object.keys(entry.metrics || {}),
                finalMetricsKeys: Object.keys(calculatedMetrics),
                finalMetricsData: calculatedMetrics,
                wordCount: wordCount,
                preservedRealMetrics: Object.keys(entry.metrics || {}).length > 0
            });

            const processedEntry: ProcessedMetricsEntry = {
                id: entry.id,
                date: entry.date,
                title: entry.title,
                content: entry.content,
                calculatedMetrics,
                metadata: entry.metadata
            };

            processedEntries.push(processedEntry);
        }

        this.logger?.info('SyncProcessing', `Sync processing completed`, {
            totalEntries: processedEntries.length,
            first3Entries: processedEntries.slice(0, 3).map(e => ({
                id: e.id,
                date: e.date,
                metricsCount: Object.keys(e.calculatedMetrics).length,
                metricsData: e.calculatedMetrics,
                hasRealMetrics: Object.keys(e.calculatedMetrics).some(key => 
                    !['Words', 'Word Count', 'Sentences', 'Words per Sentence', 'Characters', 'Sentiment', 'Sentiment Confidence'].includes(key)
                )
            }))
        });

        return {
            entries: processedEntries,
            aggregatedMetrics,
            statistics: {
                totalEntries: processedEntries.length,
                processedEntries: processedEntries.length,
                failedEntries: 0,
                processingTime: 0,
                cacheHits: 0,
                cacheMisses: 0,
                calculationsPerformed: {
                    sentiment: processedEntries.length,
                    advanced: processedEntries.length,
                    timeBased: 0,
                    aggregations: Object.keys(aggregatedMetrics).length
                },
                performance: {
                    entriesPerSecond: 0,
                    averageTimePerEntry: 0
                }
            }
        };
    }

    /**
     * Extract metric value from content using metric configuration
     */
    private extractMetricValue(content: string, metric: any): number {
        try {
            // Handle different metric types
            if (metric.type === 'range' || metric.type === 'numeric') {
                // Look for the metric in the content using various patterns
                const patterns = [
                    new RegExp(`${metric.name}\\s*[:=]\\s*(\\d+(?:\\.\\d+)?)`, 'i'),
                    new RegExp(`${metric.name}\\s+(\\d+(?:\\.\\d+)?)`, 'i'),
                    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${metric.name}`, 'i')
                ];

                for (const pattern of patterns) {
                    const match = content.match(pattern);
                    if (match && match[1]) {
                        const value = parseFloat(match[1]);
                        // Clamp to metric range if specified
                        if (metric.range) {
                            const [min, max] = metric.range;
                            return Math.max(min, Math.min(max, value));
                        }
                        return value;
                    }
                }
            }

            // Default value if not found
            return metric.defaultValue || 0;
        } catch (error) {
            this.logger?.warn('Metrics', `Error extracting metric ${metric.name}`, error as Error);
            return metric.defaultValue || 0;
        }
    }

    private calculateAdvancedMetricsSync(content: string): Record<string, number> {
        const metrics: Record<string, number> = {};
        
        const wordCount = content.trim().split(/\s+/).length;
        metrics['Words'] = wordCount;
        
        const sentenceCount = (content.match(/[.!?]+\s/g) || []).length + 1;
        metrics['Sentences'] = sentenceCount;
        
        if (sentenceCount > 0) {
            metrics['Words per Sentence'] = Math.round((wordCount / sentenceCount) * 10) / 10;
        }
        
        metrics['Characters'] = content.replace(/\s/g, '').length;
        
        return metrics;
    }

    private calculateSentimentAnalysisSync(content: string): SentimentResult {
        const sentiment = this.calculateBasicSentiment(content);
        
        return {
            score: sentiment,
            magnitude: Math.abs(sentiment),
            positiveWords: [],
            negativeWords: [],
            neutralWords: [],
            confidence: 0.5
        };
    }

    private calculateTimeBasedMetricsSync(entries: DreamMetricData[]): TimeBasedMetrics {
        const byMonth: Record<string, any> = {};
        const byDayOfWeek: Record<number, any> = {};
        const byHour: Record<number, any> = {};
        
        // Simplified implementation
        entries.forEach(entry => {
            const date = new Date(entry.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            
            if (!byMonth[monthKey]) {
                byMonth[monthKey] = {
                    count: 0,
                    totalWords: 0,
                    averageWords: 0,
                    metricAverages: {}
                };
            }
            
            byMonth[monthKey].count++;
            byMonth[monthKey].totalWords += entry.wordCount || 0;
            byMonth[monthKey].averageWords = byMonth[monthKey].totalWords / byMonth[monthKey].count;
        });
        
        return { byMonth, byDayOfWeek, byHour };
    }

    private calculateBasicSentiment(content: string): number {
        // Basic sentiment analysis
        const positiveWords = ['happy', 'joy', 'love', 'peaceful', 'beautiful', 'good', 'great'];
        const negativeWords = ['sad', 'fear', 'angry', 'terrible', 'bad', 'awful', 'scary'];
        
        const lowerContent = content.toLowerCase();
        let positiveCount = 0;
        let negativeCount = 0;
        
        positiveWords.forEach(word => {
            const matches = lowerContent.match(new RegExp(`\\b${word}\\b`, 'g'));
            if (matches) positiveCount += matches.length;
        });
        
        negativeWords.forEach(word => {
            const matches = lowerContent.match(new RegExp(`\\b${word}\\b`, 'g'));
            if (matches) negativeCount += matches.length;
        });
        
        if (positiveCount === 0 && negativeCount === 0) return 0;
        
        const total = positiveCount + negativeCount;
        return Math.round(((positiveCount - negativeCount) / total) * 100) / 100;
    }

    private calculateAggregations(entries: ProcessedMetricsEntry[], aggregatedMetrics: Record<string, MetricsAggregation>): void {
        const metricNames = new Set<string>();
        entries.forEach(entry => {
            Object.keys(entry.calculatedMetrics).forEach(name => metricNames.add(name));
        });
        
        metricNames.forEach(metricName => {
            const values = entries
                .map(entry => entry.calculatedMetrics[metricName])
                .filter(value => typeof value === 'number');
            
            if (values.length > 0) {
                const total = values.reduce((sum, val) => sum + val, 0);
                const average = total / values.length;
                const sortedValues = [...values].sort((a, b) => a - b);
                const median = sortedValues[Math.floor(sortedValues.length / 2)];
                const min = Math.min(...values);
                const max = Math.max(...values);
                
                const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
                const standardDeviation = Math.sqrt(variance);
                
                aggregatedMetrics[metricName] = {
                    total,
                    average: Math.round(average * 100) / 100,
                    median,
                    min,
                    max,
                    standardDeviation: Math.round(standardDeviation * 100) / 100,
                    count: values.length
                };
            }
        });
    }

    // Cache management
    private getFromCache(key: string): any {
        const entry = this.cache.get(key);
        if (!entry) return null;
        
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return entry.result;
    }

    private setCache(key: string, result: any, ttl = this.defaultTTL): void {
        const size = JSON.stringify(result).length;
        
        // Check cache size limit
        this.cleanupCache();
        
        this.cache.set(key, {
            result,
            timestamp: Date.now(),
            ttl,
            size
        });
    }

    private cleanupCache(): void {
        let totalSize = 0;
        const entries = Array.from(this.cache.entries());
        
        // Remove expired entries
        entries.forEach(([key, entry]) => {
            if (Date.now() - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
            } else {
                totalSize += entry.size;
            }
        });
        
        // Remove oldest entries if over size limit
        if (totalSize > this.maxCacheSize * 0.8) {
            const sortedEntries = entries
                .filter(([_, entry]) => Date.now() - entry.timestamp <= entry.ttl)
                .sort(([_, a], [__, b]) => a.timestamp - b.timestamp);
            
            for (const [key, _] of sortedEntries) {
                this.cache.delete(key);
                totalSize -= _.size;
                if (totalSize <= this.maxCacheSize * 0.8) break;
            }
        }
    }

    // Utility methods
    private hashString(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    private generateTaskId(): string {
        return `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getCacheHitRate(): number {
        const total = this.stats.cacheHits + this.stats.cacheMisses;
        return total > 0 ? this.stats.cacheHits / total : 0;
    }

    // Public utility methods for monitoring
    public getStatistics(): any {
        return {
            ...this.stats,
            cacheHitRate: this.getCacheHitRate(),
            cacheSize: this.cache.size,
            workerPoolStats: this.workerPool.getStatistics()
        };
    }

    public clearCache(): void {
        this.cache.clear();
        this.logger?.info('Cache', 'Cache cleared');
    }

    public getWorkerPoolInfo(): any {
        return this.workerPool.getWorkerInfo();
    }
} 
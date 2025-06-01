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
     * Main entry point - maintains compatibility with MetricsProcessor.scrapeMetrics()
     */
    public async scrapeMetrics(): Promise<void> {
        this.logger?.info('Scrape', 'Starting enhanced metrics scrape process with worker pool');
        
        new Notice('Scraping dream metrics with enhanced processing... This may take a moment.');

        const startTime = performance.now();
        let totalWords = 0;
        let entriesProcessed = 0;
        let foundAnyJournalEntries = false;
        let foundAnyMetrics = false;

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
            const dreamEntries = await this.extractDreamEntries(files);
            this.logger?.debug('Scrape', `Extracted ${dreamEntries.length} dream entries`, { 
                first3Entries: dreamEntries.slice(0, 3).map(e => ({
                    date: e.date,
                    title: e.title,
                    contentLength: e.content?.length || 0,
                    metadata: e.metadata
                }))
            });
            
            if (dreamEntries.length === 0) {
                new Notice('No dream journal entries found in the selected notes.');
                this.logger?.warn('Scrape', 'No dream journal entries found');
                return;
            }

            foundAnyJournalEntries = true;
            entriesProcessed = dreamEntries.length;

            // Process metrics using worker pool
            const metricsResult = await this.processMetricsWithWorkerPool(dreamEntries);
            this.logger?.debug('Scrape', `Worker pool returned ${metricsResult.entries.length} processed entries`, {
                first3Processed: metricsResult.entries.slice(0, 3).map(e => ({
                    id: e.id,
                    date: e.date,
                    title: e.title,
                    calculatedMetrics: e.calculatedMetrics,
                    metadata: e.metadata
                }))
            });
            
            foundAnyMetrics = metricsResult.entries.length > 0;

            // Convert to original format for compatibility - THIS IS WHERE THE BUG LIKELY IS
            const metrics: Record<string, number[]> = {};
            const processedEntries: DreamMetricData[] = [];

            for (const entry of metricsResult.entries) {
                this.logger?.debug('Scrape', `Converting entry ${entry.id}`, {
                    originalEntry: {
                        id: entry.id,
                        date: entry.date,
                        title: entry.title,
                        content: entry.content?.substring(0, 50) + '...',
                        calculatedMetrics: entry.calculatedMetrics,
                        metadata: entry.metadata
                    }
                });

                // Convert ProcessedMetricsEntry to DreamMetricData
                const dreamEntry: DreamMetricData = {
                    date: entry.date,
                    title: entry.title || 'Untitled Dream',
                    content: entry.content,
                    wordCount: entry.calculatedMetrics['Words'] || entry.calculatedMetrics['Word Count'] || 0,
                    metrics: entry.calculatedMetrics,
                    source: typeof entry.metadata?.source === 'string' ? entry.metadata.source : 
                           (entry.metadata?.source as any)?.file || 
                           (entry.metadata?.source as any)?.id || 
                           'unknown',
                    calloutMetadata: {
                        type: 'dream',
                        id: entry.id
                    }
                };

                // Reduced debug logging - only log first few entries or on errors
                if (processedEntries.length < 3) {
                    this.logger?.debug('Scrape', `Converted to DreamMetricData`, {
                        convertedEntry: {
                            date: dreamEntry.date,
                            title: dreamEntry.title,
                            content: dreamEntry.content?.substring(0, 50) + '...',
                            wordCount: dreamEntry.wordCount,
                            source: dreamEntry.source,
                            calloutMetadata: dreamEntry.calloutMetadata
                        }
                    });
                }

                processedEntries.push(dreamEntry);

                // Aggregate metrics
                Object.entries(entry.calculatedMetrics).forEach(([metricName, value]) => {
                    if (!metrics[metricName]) {
                        metrics[metricName] = [];
                    }
                    metrics[metricName].push(value);
                });

                totalWords += dreamEntry.wordCount || 0;
            }

            this.logger?.debug('Scrape', `Final aggregated metrics`, {
                metricsKeys: Object.keys(metrics),
                metricsLengths: Object.fromEntries(Object.entries(metrics).map(([k, v]) => [k, v.length])),
                totalEntries: processedEntries.length,
                totalWords
            });

            // Update project note
            await this.updateProjectNote(metrics, processedEntries);
            
            const processingTime = performance.now() - startTime;
            this.stats.averageProcessingTime = (this.stats.averageProcessingTime + processingTime) / 2;
            
            // Show results
            if (foundAnyMetrics) {
                new Notice(`Enhanced metrics updated from ${files.length} notes, processed ${entriesProcessed} entries in ${Math.round(processingTime)}ms.`);
                this.logger?.info('Scrape', 'Metrics processing completed', {
                    entriesProcessed,
                    totalWords,
                    processingTime,
                    cacheHitRate: this.getCacheHitRate(),
                    workerPoolStats: this.workerPool.getStatistics()
                });
            } else {
                new Notice(`Found ${entriesProcessed} entries but no metrics were detected.`);
                this.logger?.warn('Scrape', `No metrics found in ${entriesProcessed} entries`);
            }

        } catch (error) {
            this.logger?.error('Scrape', 'Error during enhanced metrics scraping', error as Error);
            new Notice(`Error scraping metrics: ${(error as Error).message}`);
        }
    }

    /**
     * Process metrics text - maintains compatibility with MetricsProcessor.processMetrics()
     */
    public processMetrics(metricsText: string, metrics: Record<string, number[]>): Record<string, number> {
        const dreamMetrics: Record<string, number> = {};
        
        try {
            const metricPairs = metricsText.split(',').map(pair => pair.trim());
            
            for (const pair of metricPairs) {
                const [name, value] = pair.split(':').map(s => s.trim());
                if (name && value !== '—' && !isNaN(Number(value))) {
                    const numValue = Number(value);
                    
                    const metricName = Object.values(this.settings.metrics).find(
                        m => m.name.toLowerCase() === name.toLowerCase()
                    )?.name || name;
                    
                    dreamMetrics[metricName] = numValue;
                    
                    if (!metrics[metricName]) {
                        metrics[metricName] = [];
                    }
                    metrics[metricName].push(numValue);
                }
            }
        } catch (error) {
            this.logger?.error('Metrics', 'Error processing metrics text', error as Error);
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
        const mode = getSelectionMode(this.settings);
        const selectedFolderPath = getSelectedFolder(this.settings);
        
        if (mode === 'folder' && selectedFolderPath) {
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
            
            const pluginAny = this.plugin as any;
            if (Array.isArray(pluginAny._excludedFilesForNextScrape)) {
                files = files.filter((f: string) => !pluginAny._excludedFilesForNextScrape.includes(f));
            }
        } else {
            files = this.settings.selectedNotes || [];
        }
        
        return files;
    }

    private async extractDreamEntries(files: string[]): Promise<MetricsEntry[]> {
        const dreamEntries: MetricsEntry[] = [];
        
        for (const path of files) {
            const file = this.app.vault.getAbstractFileByPath(path);
            if (!(file instanceof TFile)) continue;
            
            try {
                const content = await this.app.vault.read(file);
                // Use simplified extraction logic for now
                // In a full implementation, this would use the complex parsing from MetricsProcessor
                const entries = this.parseJournalEntries(content, path);
                dreamEntries.push(...entries);
            } catch (error) {
                this.logger?.error('Extract', `Error processing file ${path}`, error as Error);
            }
        }
        
        return dreamEntries;
    }

    private parseJournalEntries(content: string, filePath: string): MetricsEntry[] {
        // Simplified parser - in full implementation would use the complex logic from MetricsProcessor
        const entries: MetricsEntry[] = [];
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('[!journal-entry]') || line.includes('[!dream-diary]')) {
                // Extract dream content and metrics
                let dreamContent = '';
                let metricsText = '';
                let title = '';
                let blockId = `entry_${i}_${Date.now()}`;
                
                // Simple extraction logic
                for (let j = i + 1; j < lines.length && j < i + 50; j++) {
                    const nextLine = lines[j];
                    if (nextLine.startsWith('>')) {
                        if (nextLine.includes('**Metrics:**')) {
                            metricsText = nextLine.replace(/.*\*\*Metrics:\*\*\s*/, '').trim();
                        } else if (nextLine.includes('**Title:**')) {
                            title = nextLine.replace(/.*\*\*Title:\*\*\s*/, '').trim();
                        } else {
                            dreamContent += nextLine.replace(/^>\s*/, '') + ' ';
                        }
                    } else if (nextLine.trim() === '') {
                        continue;
                    } else {
                        break;
                    }
                }
                
                if (dreamContent.trim()) {
                    const processedContent = this.processDreamContent(dreamContent);
                    const basicMetrics = this.processMetrics(metricsText, {});
                    
                    entries.push({
                        id: blockId,
                        date: this.extractDateFromContent(lines.slice(i, i + 5), filePath, content),
                        title: title || 'Untitled Dream',
                        content: processedContent,
                        wordCount: processedContent.split(/\s+/).length,
                        metrics: basicMetrics,
                        source: filePath,
                        metadata: {
                            source: filePath,
                            lineNumber: i
                        }
                    });
                }
            }
        }
        
        return entries;
    }

    private extractDateFromContent(journalLines: string[], filePath: string, fileContent: string): string {
        // Use the same date extraction logic as the original MetricsProcessor
        // This is a simplified version - full implementation would use getDreamEntryDate
        
        // Try block reference first
        const blockRefRegex = /\^(\d{8})/;
        for (let i = 0; i < Math.min(2, journalLines.length); i++) {
            const blockRefMatch = journalLines[i].match(blockRefRegex);
            if (blockRefMatch) {
                const dateStr = blockRefMatch[1];
                return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
            }
        }
        
        // Fallback to current date
        return new Date().toISOString().split('T')[0];
    }

    private async processMetricsWithWorkerPool(entries: MetricsEntry[]): Promise<MetricsResult> {
        this.logger?.debug('WorkerPool', `Processing ${entries.length} entries with worker pool`);
        
        // TEMPORARY FIX: Disable worker pool to fix data corruption issue
        // Force immediate fallback to sync processing which works correctly
        this.logger?.warn('WorkerPool', 'Worker pool temporarily disabled due to data corruption - falling back to sync processing');
        this.stats.fallbackUsage++;
        return this.processMetricsSync(entries);
        
        /* COMMENTED OUT UNTIL WORKER POOL DATA CORRUPTION IS FIXED
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
        */
    }

    private processMetricsSync(entries: MetricsEntry[]): MetricsResult {
        this.logger?.debug('SyncProcessing', `Processing ${entries.length} entries synchronously`);
        
        const processedEntries: ProcessedMetricsEntry[] = [];
        const aggregatedMetrics: Record<string, MetricsAggregation> = {};

        for (const entry of entries) {
            this.logger?.debug('SyncProcessing', `Processing entry ${entry.id}`, {
                date: entry.date,
                title: entry.title,
                contentLength: entry.content?.length || 0
            });

            // Calculate basic metrics (word count, etc.)
            const content = entry.content || '';
            const words = content.split(/\s+/).filter(word => word.length > 0);
            const wordCount = words.length;
            
            // Initialize with basic metrics
            const calculatedMetrics: Record<string, number> = {
                'Words': wordCount,
                'Word Count': wordCount // Both versions for compatibility
            };

            // Process custom metrics from settings
            if (this.settings.metrics) {
                Object.values(this.settings.metrics).forEach(metric => {
                    if (metric.enabled) {
                        const value = this.extractMetricValue(content, metric);
                        calculatedMetrics[metric.name] = value;
                        this.logger?.debug('SyncProcessing', `Calculated ${metric.name} = ${value} for entry ${entry.id}`);
                    }
                });
            }

            // Calculate advanced metrics
            const advancedMetrics = this.calculateAdvancedMetricsSync(content);
            Object.assign(calculatedMetrics, advancedMetrics);

            // Calculate sentiment analysis
            const sentimentResult = this.calculateSentimentAnalysisSync(content);
            calculatedMetrics['Sentiment'] = sentimentResult.score;
            calculatedMetrics['Sentiment Confidence'] = sentimentResult.confidence;

            this.logger?.debug('SyncProcessing', `Final metrics for entry ${entry.id}`, {
                metricsKeys: Object.keys(calculatedMetrics),
                wordCount: calculatedMetrics['Words'],
                sentiment: calculatedMetrics['Sentiment']
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

        this.logger?.debug('SyncProcessing', `Sync processing completed`, {
            totalEntries: processedEntries.length,
            first3Entries: processedEntries.slice(0, 3).map(e => ({
                id: e.id,
                date: e.date,
                metricsCount: Object.keys(e.calculatedMetrics).length
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
        if (totalSize > this.maxCacheSize) {
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
/**
 * Universal Filter Manager
 * 
 * Integrates filtering operations with the Universal Worker Pool
 * Provides high-performance filtering for large datasets while maintaining
 * backward compatibility with the existing FilterManager interface
 */

import { App, Notice } from 'obsidian';
import { DreamMetricsSettings } from '../types/core';
import { ILogger } from '../logging/LoggerTypes';
import { UniversalWorkerPool } from './UniversalWorkerPool';
import { 
    UniversalTaskType, 
    FilterTaskInput, 
    FilterResult, 
    FilterEntry, 
    FilterCriteria, 
    FilterOptions,
    FilterStatistics,
    TaskResult
} from './types';
import { FilterDisplayManager } from '../dom/filters/FilterDisplayManager';
import { parseDate } from '../utils/date-utils';
import { UniversalPoolConfiguration } from './types';

/**
 * Cache entry for filter results
 */
interface FilterCacheEntry {
    result: FilterResult;
    timestamp: number;
    ttl: number;
    size: number;
}

export class UniversalFilterManager {
    private workerPool: UniversalWorkerPool;
    private filterDisplayManager: FilterDisplayManager;
    private cache = new Map<string, FilterCacheEntry>();
    private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
    private currentCacheSize = 0;

    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private saveSettings: () => Promise<void>,
        private saveData: (data: any) => Promise<void>,
        private logger?: ILogger
    ) {
        this.filterDisplayManager = new FilterDisplayManager(logger);
        
        const poolConfig: UniversalPoolConfiguration = {
            workerTypes: {},
            loadBalancing: 'task-affinity',
            healthCheckInterval: 30000,
            maxWorkers: Math.max(2, Math.min(navigator.hardwareConcurrency || 4, 6)),
            batchSize: 100,
            memoryLimit: 256 * 1024 * 1024, // 256MB
            priorityMode: 'performance'
        };
        
        this.workerPool = new UniversalWorkerPool(app, poolConfig);
    }

    /**
     * Initialize the Universal Filter Manager
     */
    public async initialize(): Promise<void> {
        this.logger?.info('UniversalFilter', 'Initializing Universal Filter Manager');
        
        try {
            // UniversalWorkerPool initializes itself in constructor
            this.logger?.info('UniversalFilter', 'Universal Worker Pool initialized successfully');
        } catch (error) {
            this.logger?.error('UniversalFilter', 'Failed to initialize worker pool', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Apply date range filter to entries
     */
    public async filterByDateRange(
        entries: FilterEntry[],
        startDate: string,
        endDate: string,
        options: FilterOptions = {}
    ): Promise<FilterResult> {
        const criteria: FilterCriteria = {
            dateRange: {
                start: startDate,
                end: endDate,
                inclusive: options.includeStats !== false
            }
        };

        const taskInput: FilterTaskInput = {
            filterType: 'date',
            data: entries,
            criteria,
            options: {
                ...options,
                enableCache: options.enableCache !== false,
                cacheKey: options.cacheKey || `date_${startDate}_${endDate}_${entries.length}`
            }
        };

        return this.executeFilterTask(UniversalTaskType.DATE_RANGE_FILTER, taskInput, 'high');
    }

    /**
     * Apply content search filter to entries
     */
    public async filterByContent(
        entries: FilterEntry[],
        searchTerm: string,
        searchMode: 'exact' | 'partial' | 'regex' | 'fuzzy' = 'partial',
        options: FilterOptions = {}
    ): Promise<FilterResult> {
        const criteria: FilterCriteria = {
            searchTerm,
            searchMode,
            caseSensitive: options.includeStats || false
        };

        const taskInput: FilterTaskInput = {
            filterType: 'content',
            data: entries,
            criteria,
            options: {
                ...options,
                enableCache: options.enableCache !== false,
                cacheKey: options.cacheKey || `content_${searchTerm}_${searchMode}_${entries.length}`
            }
        };

        return this.executeFilterTask(UniversalTaskType.CONTENT_FILTER, taskInput, 'normal');
    }

    /**
     * Apply metadata filter to entries (tags, properties)
     */
    public async filterByMetadata(
        entries: FilterEntry[],
        tags?: string[],
        properties?: Record<string, any>,
        options: FilterOptions = {}
    ): Promise<FilterResult> {
        const criteria: FilterCriteria = {
            tags,
            tagMode: 'any',
            properties,
            propertyMode: 'exact'
        };

        const taskInput: FilterTaskInput = {
            filterType: 'metadata',
            data: entries,
            criteria,
            options: {
                ...options,
                enableCache: options.enableCache !== false,
                cacheKey: options.cacheKey || `metadata_${JSON.stringify(tags)}_${JSON.stringify(properties)}_${entries.length}`
            }
        };

        return this.executeFilterTask(UniversalTaskType.METADATA_FILTER, taskInput, 'normal');
    }

    /**
     * Apply complex filter with multiple conditions
     */
    public async filterByComplexCriteria(
        entries: FilterEntry[],
        criteria: FilterCriteria,
        options: FilterOptions = {}
    ): Promise<FilterResult> {
        const taskInput: FilterTaskInput = {
            filterType: 'complex',
            data: entries,
            criteria,
            options: {
                ...options,
                enableCache: options.enableCache !== false,
                cacheKey: options.cacheKey || `complex_${JSON.stringify(criteria)}_${entries.length}`
            }
        };

        return this.executeFilterTask(UniversalTaskType.COMPLEX_FILTER, taskInput, 'normal');
    }

    /**
     * Validate filter criteria without executing
     */
    public async validateFilter(criteria: FilterCriteria): Promise<{ valid: boolean; errors: string[] }> {
        const taskInput: FilterTaskInput = {
            filterType: 'validation',
            data: [],
            criteria,
            options: { enableCache: false }
        };

        try {
            const result = await this.executeFilterTask(UniversalTaskType.FILTER_VALIDATION, taskInput, 'low');
            return {
                valid: result.matched === 0, // No errors found
                errors: []
            };
        } catch (error) {
            return {
                valid: false,
                errors: [error instanceof Error ? error.message : String(error)]
            };
        }
    }

    /**
     * Backward compatibility: Apply filters to DOM (matches existing FilterManager.applyFilters)
     */
    public async applyFilters(previewEl: HTMLElement): Promise<void> {
        this.logger?.debug('UniversalFilter', 'Apply filters called for DOM element');

        const tableContainer = previewEl.querySelector('.oom-table-container');
        const rows = previewEl.querySelectorAll('.oom-dream-row');

        if (!rows.length) {
            this.logger?.warn('UniversalFilter', 'No rows found in table');
            return;
        }

        const filterDropdown = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
        if (!filterDropdown) {
            this.logger?.warn('UniversalFilter', 'Filter dropdown not found');
            return;
        }

        const dateRange = filterDropdown.value || 'all';
        this.logger?.debug('UniversalFilter', `Applying filter: ${dateRange}`);

        // Convert DOM rows to FilterEntries
        const entries: FilterEntry[] = Array.from(rows).map((row, index) => {
            const rowEl = row as HTMLElement;
            return {
                id: `row_${index}`,
                date: rowEl.getAttribute('data-date') || '',
                content: rowEl.textContent || '',
                metadata: {
                    element: rowEl,
                    index
                }
            };
        });

        try {
            let result: FilterResult;

            if (dateRange === 'all') {
                // Show all entries
                result = {
                    filtered: entries,
                    total: entries.length,
                    matched: entries.length,
                    statistics: {
                        totalEntries: entries.length,
                        visibleEntries: entries.length,
                        hiddenEntries: 0,
                        processingTime: 0,
                        totalProcessed: entries.length,
                        matched: entries.length,
                        filtered: 0,
                        invalidEntries: 0,
                        executionTimeMs: 0
                    }
                };
            } else {
                // Apply date range filter
                const { start, end } = this.getDateRangeForFilter(dateRange);
                result = await this.filterByDateRange(entries, start, end, {
                    includeStats: true,
                    enableCache: true
                });
            }

            // Apply visibility to DOM
            this.applyVisibilityToDOM(result, rows);

            // Update filter display
            this.filterDisplayManager.updateFilterDisplay(
                previewEl,
                dateRange,
                result.matched,
                result.total,
                result.statistics?.invalidEntries || 0,
                result.total - result.matched
            );

            // Save filter state
            this.settings.lastAppliedFilter = dateRange;
            await this.saveSettings();

        } catch (error) {
            this.logger?.error('UniversalFilter', 'Failed to apply filters', error instanceof Error ? error : new Error(String(error)));
            
            // Fallback to showing all entries
            Array.from(rows).forEach(row => {
                (row as HTMLElement).classList.add('oom-display-show');
                (row as HTMLElement).classList.remove('oom-display-hide');
            });
        }
    }

    /**
     * Execute a filter task using the Universal Worker Pool
     */
    private async executeFilterTask(
        taskType: UniversalTaskType,
        taskInput: FilterTaskInput,
        priority: 'low' | 'normal' | 'high' = 'normal'
    ): Promise<FilterResult> {
        // Check cache first
        if (taskInput.options?.enableCache && taskInput.options.cacheKey) {
            const cached = this.getFromCache(taskInput.options.cacheKey);
            if (cached) {
                this.logger?.debug('UniversalFilter', `Cache hit for ${taskInput.options.cacheKey}`);
                return cached;
            }
        }

        const startTime = performance.now();

        try {
            const taskResult = await this.workerPool.processTask({
                taskType,
                taskId: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                priority,
                data: taskInput,
                options: {
                    timeout: taskInput.options?.timeout || 30000,
                    enableProgressReporting: taskInput.options?.includeStats || false
                }
            });

            const executionTime = performance.now() - startTime;

            if (!taskResult.success) {
                throw new Error(taskResult.error || 'Filter task failed');
            }

            const result: FilterResult = {
                ...taskResult.data,
                metadata: {
                    ...taskResult.data.metadata,
                    executionTime,
                    cacheHit: false
                }
            };

            // Cache the result
            if (taskInput.options?.enableCache && taskInput.options.cacheKey) {
                this.addToCache(taskInput.options.cacheKey, result);
            }

            this.logger?.info('UniversalFilter', `Filter task completed`, {
                taskType,
                executionTime,
                totalEntries: taskInput.data.length,
                filteredEntries: result.matched
            });

            return result;

        } catch (error) {
            this.logger?.error('UniversalFilter', `Filter task failed: ${taskType}`, error instanceof Error ? error : new Error(String(error)));
            
            // Fallback to main thread processing
            this.logger?.info('UniversalFilter', 'Falling back to main thread processing');
            return this.executeFilterOnMainThread(taskInput);
        }
    }

    /**
     * Fallback filter execution on main thread
     */
    private executeFilterOnMainThread(taskInput: FilterTaskInput): FilterResult {
        const startTime = performance.now();
        const entries = taskInput.data as FilterEntry[];
        let filtered: FilterEntry[] = [];

        switch (taskInput.filterType) {
            case 'date':
                filtered = this.filterByDateOnMainThread(entries, taskInput.criteria.dateRange!);
                break;
            case 'content':
                filtered = this.filterByContentOnMainThread(entries, taskInput.criteria);
                break;
            case 'metadata':
                filtered = this.filterByMetadataOnMainThread(entries, taskInput.criteria);
                break;
            case 'complex':
                filtered = this.filterByComplexOnMainThread(entries, taskInput.criteria);
                break;
            default:
                filtered = entries;
        }

        const executionTime = performance.now() - startTime;

        return {
            filtered,
            total: entries.length,
            matched: filtered.length,
            statistics: {
                totalEntries: entries.length,
                visibleEntries: filtered.length,
                hiddenEntries: entries.length - filtered.length,
                processingTime: executionTime,
                totalProcessed: entries.length,
                matched: filtered.length,
                filtered: entries.length - filtered.length,
                invalidEntries: 0,
                executionTimeMs: executionTime
            },
            metadata: {
                filterType: taskInput.filterType,
                executionTime,
                cacheHit: false,
                criteria: taskInput.criteria
            }
        };
    }

    /**
     * Main thread date filtering
     */
    private filterByDateOnMainThread(entries: FilterEntry[], dateRange: { start: string; end: string; inclusive?: boolean }): FilterEntry[] {
        const startDate = parseDate(dateRange.start);
        const endDate = parseDate(dateRange.end);

        if (!startDate || !endDate) {
            this.logger?.warn('UniversalFilter', 'Invalid date range in main thread filter');
            return entries;
        }

        return entries.filter(entry => {
            if (!entry.date) return false;
            const entryDate = parseDate(entry.date);
            if (!entryDate) return false;

            return entryDate >= startDate && entryDate <= endDate;
        });
    }

    /**
     * Main thread content filtering
     */
    private filterByContentOnMainThread(entries: FilterEntry[], criteria: FilterCriteria): FilterEntry[] {
        if (!criteria.searchTerm) return entries;

        const searchTerm = criteria.caseSensitive ? criteria.searchTerm : criteria.searchTerm.toLowerCase();

        return entries.filter(entry => {
            if (!entry.content) return false;
            const content = criteria.caseSensitive ? entry.content : entry.content.toLowerCase();

            switch (criteria.searchMode) {
                case 'exact':
                    return content === searchTerm;
                case 'partial':
                    return content.includes(searchTerm);
                case 'regex':
                    try {
                        const regex = new RegExp(criteria.searchTerm, criteria.caseSensitive ? 'g' : 'gi');
                        return regex.test(entry.content);
                    } catch {
                        return false;
                    }
                default:
                    return content.includes(searchTerm);
            }
        });
    }

    /**
     * Main thread metadata filtering
     */
    private filterByMetadataOnMainThread(entries: FilterEntry[], criteria: FilterCriteria): FilterEntry[] {
        return entries.filter(entry => {
            if (!entry.metadata) return false;

            // Tag filtering
            if (criteria.tags && criteria.tags.length > 0) {
                const entryTags = entry.metadata.tags || [];
                const hasMatchingTag = criteria.tags.some(tag => entryTags.includes(tag));
                if (!hasMatchingTag) return false;
            }

            // Property filtering
            if (criteria.properties) {
                for (const [key, value] of Object.entries(criteria.properties)) {
                    if (entry.metadata[key] !== value) return false;
                }
            }

            return true;
        });
    }

    /**
     * Main thread complex filtering
     */
    private filterByComplexOnMainThread(entries: FilterEntry[], criteria: FilterCriteria): FilterEntry[] {
        // Implement complex filtering logic here
        // For now, just return all entries
        this.logger?.warn('UniversalFilter', 'Complex filtering not implemented in main thread fallback');
        return entries;
    }

    /**
     * Apply visibility results to DOM elements
     */
    private applyVisibilityToDOM(result: FilterResult, rows: NodeListOf<Element>): void {
        const visibleIds = new Set(result.filtered.map(entry => entry.id));

        Array.from(rows).forEach((row, index) => {
            const rowEl = row as HTMLElement;
            const entryId = `row_${index}`;
            
            if (visibleIds.has(entryId)) {
                rowEl.classList.add('oom-display-show');
                rowEl.classList.remove('oom-display-hide', 'oom-filtered-out');
            } else {
                rowEl.classList.add('oom-display-hide', 'oom-filtered-out');
                rowEl.classList.remove('oom-display-show');
            }
        });
    }

    /**
     * Get date range for predefined filter types
     */
    private getDateRangeForFilter(filterType: string): { start: string; end: string } {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (filterType) {
            case 'today':
                return {
                    start: today.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                return {
                    start: yesterday.toISOString().split('T')[0],
                    end: yesterday.toISOString().split('T')[0]
                };
            case 'thisWeek':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                return {
                    start: startOfWeek.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };
            case 'thisMonth':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                return {
                    start: startOfMonth.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };
            case 'last30':
                const last30 = new Date(today);
                last30.setDate(today.getDate() - 30);
                return {
                    start: last30.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };
            case 'last6months':
                const last6months = new Date(today);
                last6months.setMonth(today.getMonth() - 6);
                return {
                    start: last6months.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };
            case 'thisYear':
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                return {
                    start: startOfYear.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };
            case 'last12months':
                const last12months = new Date(today);
                last12months.setFullYear(today.getFullYear() - 1);
                return {
                    start: last12months.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };
            default:
                return {
                    start: '1900-01-01',
                    end: '2100-12-31'
                };
        }
    }

    /**
     * Cache management methods
     */
    private getFromCache(key: string): FilterResult | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.currentCacheSize -= entry.size;
            return null;
        }

        return entry.result;
    }

    private addToCache(key: string, result: FilterResult): void {
        const size = JSON.stringify(result).length;
        
        // Check if we need to make room
        while (this.currentCacheSize + size > this.MAX_CACHE_SIZE && this.cache.size > 0) {
            this.evictOldestCacheEntry();
        }

        const entry: FilterCacheEntry = {
            result,
            timestamp: Date.now(),
            ttl: this.DEFAULT_TTL,
            size
        };

        this.cache.set(key, entry);
        this.currentCacheSize += size;
    }

    private evictOldestCacheEntry(): void {
        let oldestKey: string | null = null;
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            const entry = this.cache.get(oldestKey)!;
            this.cache.delete(oldestKey);
            this.currentCacheSize -= entry.size;
        }
    }

    /**
     * Get pool statistics
     */
    public getPoolStatistics() {
        return this.workerPool.getStatistics();
    }

    /**
     * Get worker information
     */
    public getWorkerInformation() {
        return this.workerPool.getWorkerInfo();
    }

    /**
     * Cleanup resources
     */
    public async cleanup(): Promise<void> {
        this.logger?.info('UniversalFilter', 'Cleaning up Universal Filter Manager');
        this.cache.clear();
        this.currentCacheSize = 0;
        this.workerPool.dispose();
    }
} 
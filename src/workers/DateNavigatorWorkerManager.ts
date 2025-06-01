// Date Navigator Web Worker Manager
// Manages web worker for date filtering with main thread fallback

import { App } from 'obsidian';
import { TypedWorkerManager } from './WorkerManager';
import { DreamMetricData } from '../types';
import { 
  WorkerMessageTypes, 
  FilterOptions, 
  VisibilityResult, 
  FilterStatistics,
  DatePattern,
  PatternAnalysis,
  WorkerError 
} from './types';

// Date Navigator specific worker manager
export class DateNavigatorWorkerManager extends TypedWorkerManager<WorkerMessageTypes> {
  private cacheEnabled = true;
  private resultCache = new Map<string, {
    result: any;
    timestamp: number;
    expiresAt: number;
  }>();
  
  constructor(app: App) {
    super(app);
    // Initialize worker when ready
    this.initWorker();
  }

  // Phase 1: Basic result caching
  private generateCacheKey(operation: string, data: any): string {
    return `${operation}-${JSON.stringify(data)}`;
  }

  private getCachedResult(key: string): any | null {
    if (!this.cacheEnabled) return null;
    
    const cached = this.resultCache.get(key);
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.resultCache.delete(key);
      this.logger.debug('Cache', 'Cache entry expired', { key });
      return null;
    }
    
    this.logger.debug('Cache', 'Cache hit', { key, age: Date.now() - cached.timestamp });
    return cached.result;
  }

  private setCachedResult(key: string, result: any, ttlMs: number = 300000): void { // 5 minutes default
    if (!this.cacheEnabled) return;
    
    this.resultCache.set(key, {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs
    });
    
    this.logger.debug('Cache', 'Cached result', { key, ttl: ttlMs, size: this.resultCache.size });
    
    // Basic cache size management
    if (this.resultCache.size > 100) {
      this.clearOldestCacheEntries();
    }
  }

  private clearOldestCacheEntries(): void {
    const entries = Array.from(this.resultCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 20% of entries
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.resultCache.delete(entries[i][0]);
    }
    
    this.logger.debug('Cache', 'Cleared oldest cache entries', { removed: toRemove, remaining: this.resultCache.size });
  }

  // Main thread fallback implementations
  private fallbackDateRangeFilter(
    entries: DreamMetricData[], 
    startDate: string, 
    endDate: string, 
    options?: FilterOptions
  ): { visibilityMap: VisibilityResult[]; statistics?: FilterStatistics } {
    this.logger.info('Fallback', 'Using main thread for date range filtering', {
      entriesCount: entries.length,
      startDate,
      endDate
    });

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const results: VisibilityResult[] = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      if (!entry.date) {
        results.push({
          id: entry.source || `entry-${i}`,
          visible: false,
          matchReason: 'no-date'
        });
        continue;
      }
      
      const entryTime = new Date(entry.date).getTime();
      const visible = entryTime >= start && entryTime <= end;
      
      results.push({
        id: entry.source || `entry-${i}`,
        visible,
        matchReason: visible ? 'date-range-match' : 'date-range-exclude'
      });
    }
    
    const response: { visibilityMap: VisibilityResult[]; statistics?: FilterStatistics } = {
      visibilityMap: results
    };
    
    if (options?.includeStatistics) {
      response.statistics = {
        totalEntries: entries.length,
        visibleEntries: results.filter(r => r.visible).length,
        hiddenEntries: results.filter(r => !r.visible).length,
        processingTime: 0,
        totalProcessed: entries.length,
        matched: results.filter(r => r.visible).length,
        filtered: results.filter(r => !r.visible).length,
        invalidEntries: 0,
        executionTimeMs: 0
      };
    }
    
    return response;
  }

  private fallbackMultipleDatesFilter(
    entries: DreamMetricData[], 
    selectedDates: string[], 
    mode: 'include' | 'exclude'
  ): { visibilityMap: VisibilityResult[]; affectedDates: string[] } {
    this.logger.info('Fallback', 'Using main thread for multiple dates filtering', {
      entriesCount: entries.length,
      selectedDatesCount: selectedDates.length,
      mode
    });

    const selectedSet = new Set(selectedDates);
    const results: VisibilityResult[] = [];
    const affectedDates: string[] = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      if (!entry.date) {
        results.push({
          id: entry.source || `entry-${i}`,
          visible: mode === 'exclude',
          matchReason: 'no-date'
        });
        continue;
      }
      
      const isSelected = selectedSet.has(entry.date);
      const visible = mode === 'include' ? isSelected : !isSelected;
      
      results.push({
        id: entry.source || `entry-${i}`,
        visible,
        matchReason: visible ? `multi-date-${mode}` : `multi-date-${mode}-exclude`
      });
      
      if (isSelected && !affectedDates.includes(entry.date)) {
        affectedDates.push(entry.date);
      }
    }
    
    return {
      visibilityMap: results,
      affectedDates
    };
  }

  private fallbackPatternFilter(
    entries: DreamMetricData[], 
    pattern: DatePattern
  ): { visibilityMap: VisibilityResult[]; matchedDates: string[]; patternInfo: PatternAnalysis } {
    this.logger.info('Fallback', 'Using main thread for pattern filtering', {
      entriesCount: entries.length,
      patternType: pattern.type,
      patternValue: pattern.value
    });

    const results: VisibilityResult[] = [];
    const matchedDates: string[] = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      if (!entry.date) {
        results.push({
          id: entry.source || `entry-${i}`,
          visible: false,
          matchReason: 'no-date'
        });
        continue;
      }
      
      let matches = false;
      const entryDate = new Date(entry.date);
      
      // Basic pattern matching
      switch (pattern.type) {
        case 'weekday':
          matches = entryDate.getDay() === pattern.value;
          break;
        case 'month-day':
          matches = entryDate.getDate() === pattern.value;
          break;
        default:
          this.logger.warn('Fallback', `Unsupported pattern type: ${pattern.type}`, { patternType: pattern.type });
          matches = false;
      }
      
      results.push({
        id: entry.source || `entry-${i}`,
        visible: matches,
        matchReason: matches ? 'pattern-match' : 'pattern-no-match'
      });
      
      if (matches && !matchedDates.includes(entry.date)) {
        matchedDates.push(entry.date);
      }
    }
    
    const patternInfo: PatternAnalysis = {
      totalMatches: results.filter(r => r.visible).length,
      patternEfficiency: results.length > 0 ? results.filter(r => r.visible).length / results.length : 0
    };
    
    return {
      visibilityMap: results,
      matchedDates,
      patternInfo
    };
  }

  // Public API methods with automatic fallback
  async filterByDateRange(
    entries: DreamMetricData[], 
    startDate: string, 
    endDate: string, 
    options?: FilterOptions & { onProgress?: (progress: any) => void }
  ): Promise<{ visibilityMap: VisibilityResult[]; statistics?: FilterStatistics }> {
    const cacheKey = this.generateCacheKey('dateRange', { startDate, endDate, options: options?.includeStatistics });
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Try worker first if available
      if (this.workerSupported && this.isWorkerActive) {
        const result = await this.sendMessage('FILTER_BY_DATE_RANGE', {
          entries,
          startDate,
          endDate,
          options
        }, {
          onProgress: options?.onProgress,
          timeout: 30000 // 30 second timeout
        });
        
        this.setCachedResult(cacheKey, result);
        return result;
      }
    } catch (error) {
      this.logger.warn('Filter', 'Worker date range filter failed, using fallback', {
        error: (error as Error).message,
        entriesCount: entries.length
      });
    }
    
    // Use main thread fallback
    const result = this.fallbackDateRangeFilter(entries, startDate, endDate, options);
    this.setCachedResult(cacheKey, result);
    return result;
  }

  async filterByMultipleDates(
    entries: DreamMetricData[], 
    selectedDates: string[], 
    mode: 'include' | 'exclude' = 'include'
  ): Promise<{ visibilityMap: VisibilityResult[]; affectedDates: string[] }> {
    const cacheKey = this.generateCacheKey('multipleDates', { selectedDates, mode });
    
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      if (this.workerSupported && this.isWorkerActive) {
        const result = await this.sendMessage('FILTER_BY_MULTIPLE_DATES', {
          entries,
          selectedDates,
          mode
        }, {
          timeout: 30000
        });
        
        this.setCachedResult(cacheKey, result);
        return result;
      }
    } catch (error) {
      this.logger.warn('Filter', 'Worker multiple dates filter failed, using fallback', {
        error: (error as Error).message
      });
    }
    
    const result = this.fallbackMultipleDatesFilter(entries, selectedDates, mode);
    this.setCachedResult(cacheKey, result);
    return result;
  }

  async filterByPattern(
    entries: DreamMetricData[], 
    pattern: DatePattern
  ): Promise<{ visibilityMap: VisibilityResult[]; matchedDates: string[]; patternInfo: PatternAnalysis }> {
    const cacheKey = this.generateCacheKey('pattern', { pattern });
    
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      if (this.workerSupported && this.isWorkerActive) {
        const result = await this.sendMessage('FILTER_BY_PATTERN', {
          entries,
          pattern
        }, {
          timeout: 30000
        });
        
        this.setCachedResult(cacheKey, result);
        return result;
      }
    } catch (error) {
      this.logger.warn('Filter', 'Worker pattern filter failed, using fallback', {
        error: (error as Error).message
      });
    }
    
    const result = this.fallbackPatternFilter(entries, pattern);
    this.setCachedResult(cacheKey, result);
    return result;
  }

  // Cache management
  public clearCache(): void {
    this.resultCache.clear();
    this.logger.info('Cache', 'Filter cache cleared');
  }

  public setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
    this.logger.info('Cache', `Filter caching ${enabled ? 'enabled' : 'disabled'}`);
  }

  public getCacheStats(): { size: number; enabled: boolean } {
    return {
      size: this.resultCache.size,
      enabled: this.cacheEnabled
    };
  }

  // Override dispose to clean up cache
  public dispose(): void {
    this.clearCache();
    super.dispose();
  }
} 
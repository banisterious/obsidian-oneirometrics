// Universal DateNavigator Manager
// Uses the Universal Worker Pool for date filtering operations

import { App } from 'obsidian';
import { getLogger } from '../logging';
import type { ContextualLogger } from '../logging';
import { DreamMetricData } from '../types';
import { UniversalWorkerPool } from './UniversalWorkerPool';
import { 
  UniversalTask,
  TaskResult,
  TaskCallbacks,
  FilterOptions,
  VisibilityResult,
  FilterStatistics,
  DatePattern,
  PatternAnalysis,
  TaskError,
  UniversalPoolConfiguration,
  UniversalTaskType
} from './types';

export class UniversalDateNavigatorManager {
  private logger: ContextualLogger = getLogger('UniversalDateNavigatorManager') as ContextualLogger;
  private workerPool: UniversalWorkerPool;
  private cacheEnabled = true;
  private resultCache = new Map<string, {
    result: any;
    timestamp: number;
    expiresAt: number;
  }>();

  constructor(app: App, poolConfig?: UniversalPoolConfiguration) {
    // Create default pool configuration if not provided
    const defaultConfig: UniversalPoolConfiguration = {
      workerTypes: {
        [UniversalTaskType.DATE_FILTER]: {
          dedicatedWorkers: 2,
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

    this.workerPool = new UniversalWorkerPool(app, poolConfig || defaultConfig);
    
    this.logger.info('Initialization', 'Universal DateNavigator Manager initialized', {
      poolConfig: poolConfig || defaultConfig,
      cacheEnabled: this.cacheEnabled
    });
  }

  // Generate cache key for result caching
  private generateCacheKey(operation: string, data: any): string {
    return `${operation}-${JSON.stringify(data)}`;
  }

  // Check for cached result
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
    
    this.logger.debug('Cache', 'Cache hit', { 
      key, 
      age: Date.now() - cached.timestamp 
    });
    return cached.result;
  }

  // Store result in cache
  private setCachedResult(key: string, result: any, ttlMs: number = 300000): void { // 5 minutes default
    if (!this.cacheEnabled) return;
    
    this.resultCache.set(key, {
      result,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs
    });
    
    this.logger.debug('Cache', 'Cached result', { 
      key, 
      ttl: ttlMs, 
      size: this.resultCache.size 
    });
    
    // Basic cache size management
    if (this.resultCache.size > 100) {
      this.clearOldestCacheEntries();
    }
  }

  // Clear oldest cache entries to manage memory
  private clearOldestCacheEntries(): void {
    const entries = Array.from(this.resultCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 20% of entries
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.resultCache.delete(entries[i][0]);
    }
    
    this.logger.debug('Cache', 'Cleared oldest cache entries', { 
      removed: toRemove, 
      remaining: this.resultCache.size 
    });
  }

  // Generate unique task ID
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Main thread fallback for date range filtering
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
        processingTime: 0, // Immediate processing
        totalProcessed: entries.length,
        matched: results.filter(r => r.visible).length,
        filtered: results.filter(r => !r.visible).length,
        invalidEntries: 0,
        executionTimeMs: 0
      };
    }
    
    return response;
  }

  // Filter entries by date range
  async filterByDateRange(
    entries: DreamMetricData[], 
    startDate: string, 
    endDate: string, 
    options?: FilterOptions & { onProgress?: (progress: any) => void }
  ): Promise<{ visibilityMap: VisibilityResult[]; statistics?: FilterStatistics }> {
    
    // Check cache first
    const cacheKey = this.generateCacheKey('dateRange', { startDate, endDate, entriesCount: entries.length });
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      this.logger.debug('Filter', 'Returning cached date range result', { cacheKey });
      return cachedResult;
    }

    // Create task for the universal pool
    const task: UniversalTask = {
      taskType: UniversalTaskType.DATE_FILTER,
      taskId: this.generateTaskId(),
      priority: 'normal',
      data: {
        entries,
        startDate,
        endDate,
        options
      },
      options: {
        enableProgressReporting: !!options?.onProgress,
        batchSize: options?.batchSize || 100,
        timeout: 30000,
        cacheKey
      }
    };

    try {
      const taskCallbacks: TaskCallbacks = {
        onProgress: options?.onProgress,
        onComplete: (result: TaskResult) => {
          this.logger.info('Filter', 'Date range filter completed via worker pool', {
            taskId: task.taskId,
            entriesProcessed: entries.length,
            processingTime: result.metadata?.processingTime
          });
        },
        onError: (error: string) => {
          this.logger.warn('Filter', 'Date range filter failed in worker pool', {
            taskId: task.taskId,
            error
          });
        }
      };

      const result = await this.workerPool.processTask(task, taskCallbacks);
      
      if (!result.success) {
        throw new TaskError(result.error || 'Task failed', task.taskType, task.taskId);
      }

      // Cache the successful result
      this.setCachedResult(cacheKey, result.data);
      
      return result.data;

    } catch (error) {
      this.logger.warn('Filter', 'Worker pool failed, using fallback', {
        taskId: task.taskId,
        error: (error as Error).message
      });
      
      // Use fallback processing on main thread
      const fallbackResult = this.fallbackDateRangeFilter(entries, startDate, endDate, options);
      
      // Cache the fallback result too
      this.setCachedResult(cacheKey, fallbackResult);
      
      return fallbackResult;
    }
  }

  // Filter entries by multiple dates
  async filterByMultipleDates(
    entries: DreamMetricData[], 
    selectedDates: string[], 
    mode: 'include' | 'exclude' = 'include'
  ): Promise<{ visibilityMap: VisibilityResult[]; affectedDates: string[] }> {
    
    const cacheKey = this.generateCacheKey('multipleDates', { selectedDates, mode, entriesCount: entries.length });
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      this.logger.debug('Filter', 'Returning cached multiple dates result', { cacheKey });
      return cachedResult;
    }

    const task: UniversalTask = {
      taskType: UniversalTaskType.DATE_FILTER,
      taskId: this.generateTaskId(),
      priority: 'normal',
      data: {
        entries,
        selectedDates,
        mode,
        filterType: 'multiple-dates'
      },
      options: {
        timeout: 30000,
        cacheKey
      }
    };

    try {
      const result = await this.workerPool.processTask(task);
      
      if (!result.success) {
        throw new TaskError(result.error || 'Task failed', task.taskType, task.taskId);
      }

      this.setCachedResult(cacheKey, result.data);
      return result.data;

    } catch (error) {
      this.logger.warn('Filter', 'Multiple dates filter failed, using fallback', {
        taskId: task.taskId,
        error: (error as Error).message
      });
      
      // Simple fallback implementation
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

      const fallbackResult = { visibilityMap: results, affectedDates };
      this.setCachedResult(cacheKey, fallbackResult);
      return fallbackResult;
    }
  }

  // Filter entries by date pattern
  async filterByPattern(
    entries: DreamMetricData[], 
    pattern: DatePattern
  ): Promise<{ visibilityMap: VisibilityResult[]; matchedDates: string[]; patternInfo: PatternAnalysis }> {
    
    const cacheKey = this.generateCacheKey('pattern', { pattern, entriesCount: entries.length });
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      this.logger.debug('Filter', 'Returning cached pattern result', { cacheKey });
      return cachedResult;
    }

    const task: UniversalTask = {
      taskType: UniversalTaskType.DATE_FILTER,
      taskId: this.generateTaskId(),
      priority: 'normal',
      data: {
        entries,
        pattern,
        filterType: 'pattern'
      },
      options: {
        timeout: 30000,
        cacheKey
      }
    };

    try {
      const result = await this.workerPool.processTask(task);
      
      if (!result.success) {
        throw new TaskError(result.error || 'Task failed', task.taskType, task.taskId);
      }

      this.setCachedResult(cacheKey, result.data);
      return result.data;

    } catch (error) {
      this.logger.warn('Filter', 'Pattern filter failed, using fallback', {
        taskId: task.taskId,
        error: (error as Error).message
      });
      
      // Simple fallback - just return empty results for now
      const fallbackResult = {
        visibilityMap: entries.map((entry, i) => ({
          id: entry.source || `entry-${i}`,
          visible: true, // Show all entries as fallback
          matchReason: 'pattern-fallback'
        })),
        matchedDates: [],
        patternInfo: {
          totalMatches: 0,
          patternEfficiency: 0,
          suggestedOptimizations: ['Pattern filtering requires worker support']
        }
      };

      this.setCachedResult(cacheKey, fallbackResult);
      return fallbackResult;
    }
  }

  // Get pool statistics
  getPoolStatistics() {
    return this.workerPool.getStatistics();
  }

  // Get worker information
  getWorkerInfo() {
    return this.workerPool.getWorkerInfo();
  }

  // Cache management methods
  public clearCache(): void {
    this.resultCache.clear();
    this.logger.info('Cache', 'Cache cleared manually');
  }

  public setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    this.logger.info('Cache', `Cache ${enabled ? 'enabled' : 'disabled'}`);
    
    if (!enabled) {
      this.clearCache();
    }
  }

  public getCacheStats(): { size: number; enabled: boolean } {
    return {
      size: this.resultCache.size,
      enabled: this.cacheEnabled
    };
  }

  // Dispose of the manager
  public dispose(): void {
    this.logger.info('Disposal', 'Disposing Universal DateNavigator Manager');
    
    // Clear cache
    this.clearCache();
    
    // Dispose worker pool
    this.workerPool.dispose();
  }
} 
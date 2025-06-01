// Web Worker Message Protocol Types
// Based on the enhanced architecture plan with strict typing

import { DreamMetricData } from '../types';

// Expanded core message types for Universal Worker Pool
export type WorkerMessageType = 
  | 'FILTER_BY_DATE_RANGE'
  | 'FILTER_BY_MULTIPLE_DATES'
  | 'FILTER_BY_PATTERN'
  | 'FILTER_RESULTS'
  | 'FILTER_PROGRESS'
  | 'FILTER_ERROR'
  | 'CANCEL_FILTER'
  | 'WORKER_LOG'
  | 'VERSION_CHECK'
  // Universal Pool task types
  | 'PROCESS_TASK'
  | 'TASK_RESULTS'
  | 'TASK_PROGRESS'
  | 'TASK_ERROR'
  | 'WORKER_HEALTH_CHECK'
  | 'WORKER_CAPABILITIES';

// Universal Task Types
export enum UniversalTaskType {
    DATE_FILTER = 'date_filter',
    METRICS_CALCULATION = 'metrics_calculation',
    TAG_ANALYSIS = 'tag_analysis',
    SEARCH_FILTER = 'search_filter',
    SORT_OPERATION = 'sort_operation',
    DATA_AGGREGATION = 'data_aggregation',
    // New FilterManager task types
    DATE_RANGE_FILTER = 'date_range_filter',
    CONTENT_FILTER = 'content_filter',
    METADATA_FILTER = 'metadata_filter',
    COMPLEX_FILTER = 'complex_filter',
    FILTER_VALIDATION = 'filter_validation'
}

// Base message interface
export interface WorkerMessage {
  id: string;
  type: WorkerMessageType;
  timestamp: number;
  protocolVersion?: string;
  data?: any;
}

// Universal task definition
export interface UniversalTask {
  taskType: UniversalTaskType;
  taskId: string;
  priority: 'low' | 'normal' | 'high';
  data: any;
  options?: TaskOptions;
}

// Task options for flexible configuration
export interface TaskOptions {
  enableProgressReporting?: boolean;
  batchSize?: number;
  timeout?: number;
  cacheKey?: string;
  retryCount?: number;
}

// Task result wrapper
export interface TaskResult {
  taskId: string;
  taskType: UniversalTaskType;
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    processingTime: number;
    memoryUsage?: number;
    workerPool?: string;
  };
}

// Worker capability definition
export interface WorkerCapabilities {
  workerId: string;
  supportedTasks: UniversalTaskType[];
  maxConcurrentTasks: number;
  memoryLimit: number;
  preferredTaskTypes?: UniversalTaskType[];
}

// Extended typed message definitions for Universal Pool
export interface WorkerMessageTypes {
  'FILTER_BY_DATE_RANGE': {
    request: { 
      entries: DreamMetricData[];
      startDate: string;
      endDate: string;
      options?: FilterOptions;
    };
    response: { 
      visibilityMap: VisibilityResult[];
      statistics?: FilterStatistics;
    };
  };
  'FILTER_BY_MULTIPLE_DATES': {
    request: { 
      entries: DreamMetricData[];
      selectedDates: string[];
      mode: 'include' | 'exclude';
    };
    response: { 
      visibilityMap: VisibilityResult[];
      affectedDates: string[];
    };
  };
  'FILTER_BY_PATTERN': {
    request: { 
      entries: DreamMetricData[];
      pattern: DatePattern;
      dateRange?: { start: string; end: string };
    };
    response: { 
      visibilityMap: VisibilityResult[];
      matchedDates: string[];
      patternInfo: PatternAnalysis;
    };
  };
  'PROCESS_TASK': {
    request: {
      task: UniversalTask;
    };
    response: TaskResult;
  };
  'TASK_PROGRESS': {
    request: never;
    response: { 
      taskId: string;
      progress: number;
      entriesProcessed: number;
      currentPhase: string;
      estimatedTimeRemaining?: number;
    };
  };
  'FILTER_PROGRESS': {
    request: never;
    response: { 
      progress: number;
      entriesProcessed: number;
      currentPhase: 'parsing' | 'filtering' | 'optimizing';
      estimatedTimeRemaining?: number;
    };
  };
  'WORKER_LOG': {
    request: never;
    response: {
      level: 'debug' | 'info' | 'warn' | 'error';
      category: string;
      message: string;
      context: Record<string, any>;
      workerId: string;
    };
  };
  'WORKER_CAPABILITIES': {
    request: never;
    response: WorkerCapabilities;
  };
}

// Filter options for worker operations
export interface FilterOptions {
  includeStatistics?: boolean;
  optimizeForLargeDatasets?: boolean;
  enableProgressReporting?: boolean;
  batchSize?: number;
  maxResults?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeStats?: boolean;
  enableCache?: boolean;
  cacheKey?: string;
  timeout?: number;
}

// Performance and statistics tracking
export interface FilterStatistics {
  totalEntries: number;
  visibleEntries: number;
  hiddenEntries: number;
  processingTime: number;
  memoryUsage?: number;
  cacheHits?: number;
  cacheMisses?: number;
  totalProcessed: number;
  matched: number;
  filtered: number;
  invalidEntries: number;
  executionTimeMs: number;
  cachePerformance?: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

// Visibility result for each entry
export interface VisibilityResult {
  id: string;
  visible: boolean;
  matchReason?: string;
  confidence?: number;
}

// Date pattern definitions for pattern-based filtering
export interface DatePattern {
  type: 'weekday' | 'month-day' | 'custom-interval' | 'regex';
  value: string | number;
  description: string;
  examples?: string[];
}

// Pattern analysis results
export interface PatternAnalysis {
  totalMatches: number;
  patternEfficiency: number; // 0-1 score
  suggestedOptimizations?: string[];
  alternativePatterns?: DatePattern[];
}

// Request handlers for worker manager
export interface FilterCallbacks {
  onProgress?: (progress: WorkerMessageTypes['FILTER_PROGRESS']['response']) => void;
  onComplete?: (results: any) => void;
  onError?: (error: string) => void;
}

// Task callbacks for Universal Pool
export interface TaskCallbacks {
  onProgress?: (progress: WorkerMessageTypes['TASK_PROGRESS']['response']) => void;
  onComplete?: (result: TaskResult) => void;
  onError?: (error: string) => void;
}

// Worker configuration options
export interface WorkerConfiguration {
  maxWorkers: number;
  batchSize: number;
  memoryLimit: number; // in bytes
  priorityMode: 'balanced' | 'performance' | 'efficiency';
}

// Universal Pool configuration
export interface UniversalPoolConfiguration extends WorkerConfiguration {
  workerTypes: {
    [taskType in UniversalTaskType]?: {
      dedicatedWorkers?: number;
      fallbackEnabled?: boolean;
      cacheEnabled?: boolean;
    };
  };
  loadBalancing: 'round-robin' | 'least-loaded' | 'task-affinity';
  healthCheckInterval: number;
}

// Error types for worker operations
export class WorkerError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'WorkerError';
  }
}

// Task-specific error
export class TaskError extends WorkerError {
  constructor(
    message: string,
    public taskType: UniversalTaskType,
    public taskId: string,
    context?: Record<string, any>
  ) {
    super(message, 'TASK_ERROR', { taskType, taskId, ...context });
    this.name = 'TaskError';
  }
}

// Circuit breaker state
export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  timeSinceLastFailure: number;
}

// Worker pool statistics
export interface PoolStatistics {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskTime: number;
  queueDepth: number;
}

// Protocol version for compatibility
export const CURRENT_PROTOCOL_VERSION = '1.0.0';

export interface FilterTaskInput {
    filterType: 'date' | 'content' | 'metadata' | 'complex' | 'validation';
    data: FilterEntry[] | string[] | Record<string, any>[];
    criteria: FilterCriteria;
    options?: FilterOptions;
}

export interface FilterEntry {
    id: string;
    date?: string;
    content?: string;
    metadata?: Record<string, any>;
    [key: string]: any;
}

export interface FilterCriteria {
    // Date filtering
    dateRange?: {
        start: string;
        end: string;
        inclusive?: boolean;
    };
    
    // Content filtering  
    searchTerm?: string;
    searchMode?: 'exact' | 'partial' | 'regex' | 'fuzzy';
    caseSensitive?: boolean;
    
    // Metadata filtering
    tags?: string[];
    tagMode?: 'any' | 'all' | 'none';
    properties?: Record<string, any>;
    propertyMode?: 'exact' | 'contains' | 'range';
    
    // Complex filtering
    conditions?: FilterCondition[];
    operator?: 'AND' | 'OR' | 'NOT';
}

export interface FilterCondition {
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'notIn';
    value: any;
    caseSensitive?: boolean;
}

export interface FilterResult {
    filtered: FilterEntry[];
    total: number;
    matched: number;
    statistics?: FilterStatistics;
    metadata?: {
        filterType: string;
        executionTime: number;
        cacheHit?: boolean;
        criteria: FilterCriteria;
    };
} 
// Web Worker Message Protocol Types
// Based on the enhanced architecture plan with strict typing

import { DreamMetricData } from '../types';

// Core message types for worker communication
export type WorkerMessageType = 
  | 'FILTER_BY_DATE_RANGE'
  | 'FILTER_BY_MULTIPLE_DATES'
  | 'FILTER_BY_PATTERN'
  | 'FILTER_RESULTS'
  | 'FILTER_PROGRESS'
  | 'FILTER_ERROR'
  | 'CANCEL_FILTER'
  | 'WORKER_LOG'
  | 'VERSION_CHECK';

// Base message interface
export interface WorkerMessage {
  id: string;
  type: WorkerMessageType;
  timestamp: number;
  protocolVersion?: string;
  data?: any;
}

// Typed message definitions for type-safe communication
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
}

// Filter options for worker operations
export interface FilterOptions {
  includeStatistics?: boolean;
  optimizeForLargeDatasets?: boolean;
  enableProgressReporting?: boolean;
  batchSize?: number;
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

// Worker configuration options
export interface WorkerConfiguration {
  maxWorkers: number;
  batchSize: number;
  memoryLimit: number; // in bytes
  priorityMode: 'balanced' | 'performance' | 'efficiency';
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

// Circuit breaker state
export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  timeSinceLastFailure: number;
}

// Protocol version for compatibility
export const CURRENT_PROTOCOL_VERSION = '1.0.0'; 
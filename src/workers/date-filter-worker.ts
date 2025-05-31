// Date Filter Web Worker
// Handles date-based filtering operations in the background

import { 
  WorkerMessage, 
  WorkerMessageTypes, 
  FilterStatistics, 
  VisibilityResult,
  DatePattern,
  PatternAnalysis,
  CURRENT_PROTOCOL_VERSION 
} from './types';

// Worker logging implementation
class WorkerLogger {
  private workerId: string;

  constructor(workerId: string) {
    this.workerId = workerId;
  }

  private sendLog(level: 'debug' | 'info' | 'warn' | 'error', category: string, message: string, context?: any) {
    // Send structured log message to main thread
    self.postMessage({
      id: `log-${Date.now()}`,
      type: 'WORKER_LOG',
      timestamp: Date.now(),
      data: {
        level,
        category,
        message,
        context: {
          workerId: this.workerId,
          ...context
        }
      }
    });
  }

  debug(category: string, message: string, context?: any) {
    this.sendLog('debug', category, message, context);
  }

  info(category: string, message: string, context?: any) {
    this.sendLog('info', category, message, context);
  }

  warn(category: string, message: string, context?: any) {
    this.sendLog('warn', category, message, context);
  }

  error(category: string, message: string, context?: any) {
    this.sendLog('error', category, message, context);
  }

  // Performance timing in worker
  time(operation: string): () => void {
    const startTime = performance.now();
    this.debug('Performance', `Starting ${operation}`, { operation, startTime });
    
    return () => {
      const duration = performance.now() - startTime;
      this.info('Performance', `Completed ${operation}`, { 
        operation, 
        duration: `${duration.toFixed(2)}ms`,
        startTime,
        endTime: performance.now()
      });
    };
  }
}

// Initialize worker logger
const workerLogger = new WorkerLogger(`worker-${Math.random().toString(36).substr(2, 9)}`);

// Track cancelled operations
const cancelledRequests = new Set<string>();

// Utility functions
function formatDateForComparison(dateStr: string): number {
  try {
    return new Date(dateStr).getTime();
  } catch (error) {
    workerLogger.error('DateParsing', `Failed to parse date: ${dateStr}`, { dateStr, error: error.message });
    return 0;
  }
}

function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function sendError(requestId: string, error: string, context?: any): void {
  self.postMessage({
    id: generateUniqueId(),
    type: 'FILTER_ERROR',
    timestamp: Date.now(),
    data: {
      requestId,
      error,
      context
    }
  });
}

function sendProgress(requestId: string, progress: number, entriesProcessed: number, currentPhase: string): void {
  self.postMessage({
    id: generateUniqueId(),
    type: 'FILTER_PROGRESS',
    timestamp: Date.now(),
    data: {
      requestId,
      progress,
      entriesProcessed,
      currentPhase
    }
  });
}

// Date range filtering implementation
function handleDateRangeFilter(message: WorkerMessage) {
  const endTimer = workerLogger.time(`process.${message.type}`);
  const { entries, startDate, endDate, options } = message.data;
  const requestId = message.id;
  
  workerLogger.debug('Filter', `Starting date range filter`, { 
    requestId,
    entriesCount: entries.length,
    startDate,
    endDate,
    includeStatistics: options?.includeStatistics
  });

  try {
    // Convert dates to consistent format for comparison
    const start = formatDateForComparison(startDate);
    const end = formatDateForComparison(endDate);
    
    if (start === 0 || end === 0) {
      throw new Error(`Invalid date format: start=${startDate}, end=${endDate}`);
    }
    
    const results: VisibilityResult[] = [];
    const batchSize = options?.batchSize || 100; // Default batch size
    let processedCount = 0;
    
    // Process in batches with progress updates
    function processNextBatch() {
      // Check if request was cancelled
      if (cancelledRequests.has(requestId)) {
        workerLogger.info('Filter', 'Date range filter cancelled', { requestId });
        cancelledRequests.delete(requestId);
        return;
      }
      
      const batchEnd = Math.min(processedCount + batchSize, entries.length);
      
      for (let i = processedCount; i < batchEnd; i++) {
        const entry = entries[i];
        
        // Handle entries that might not have a date field
        if (!entry.date) {
          results.push({
            id: entry.source || `entry-${i}`,
            visible: false,
            matchReason: 'no-date'
          });
          continue;
        }
        
        const entryDate = formatDateForComparison(entry.date);
        const visible = entryDate >= start && entryDate <= end;
        
        results.push({
          id: entry.source || `entry-${i}`,
          visible,
          matchReason: visible ? 'date-range-match' : 'date-range-exclude'
        });
      }
      
      processedCount = batchEnd;
      
      // Send progress update
      if (options?.enableProgressReporting !== false) {
        const progress = Math.floor((processedCount / entries.length) * 100);
        sendProgress(requestId, progress, processedCount, 'filtering');
      }
      
      // Continue or finish
      if (processedCount < entries.length) {
        setTimeout(processNextBatch, 0); // Continue in next tick
      } else {
        // Generate statistics if requested
        let statistics: FilterStatistics | undefined;
        if (options?.includeStatistics) {
          statistics = {
            totalEntries: entries.length,
            visibleEntries: results.filter(r => r.visible).length,
            hiddenEntries: results.filter(r => !r.visible).length,
            processingTime: Date.now() - message.timestamp
          };
        }
        
        // Send final results
        self.postMessage({
          id: generateUniqueId(),
          type: 'FILTER_RESULTS',
          timestamp: Date.now(),
          data: {
            requestId,
            results: {
              visibilityMap: results,
              statistics
            },
            timing: {
              processingTime: Date.now() - message.timestamp,
              entriesProcessed: entries.length
            }
          }
        });
        
        workerLogger.info('Filter', 'Date range filter completed', {
          requestId,
          totalEntries: entries.length,
          visibleEntries: results.filter(r => r.visible).length,
          processingTime: Date.now() - message.timestamp
        });
        
        endTimer();
      }
    }
    
    // Start processing
    processNextBatch();
    
  } catch (error) {
    endTimer();
    workerLogger.error('Filter', `Date range filter failed: ${error.message}`, {
      requestId,
      error: error.message,
      stack: error.stack
    });
    sendError(requestId, error.message, { operation: 'dateRangeFilter' });
  }
}

// Multiple dates filtering implementation
function handleMultipleDatesFilter(message: WorkerMessage) {
  const endTimer = workerLogger.time(`process.${message.type}`);
  const { entries, selectedDates, mode } = message.data;
  const requestId = message.id;
  
  workerLogger.debug('Filter', `Starting multiple dates filter`, { 
    requestId,
    entriesCount: entries.length,
    selectedDatesCount: selectedDates.length,
    mode
  });

  try {
    // Convert selected dates to timestamps for faster comparison
    const selectedTimestamps = new Set(
      selectedDates.map(date => formatDateForComparison(date))
        .filter(timestamp => timestamp !== 0)
    );
    
    if (selectedTimestamps.size === 0) {
      throw new Error('No valid dates provided for filtering');
    }
    
    const results: VisibilityResult[] = [];
    const affectedDates: string[] = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      if (!entry.date) {
        results.push({
          id: entry.source || `entry-${i}`,
          visible: mode === 'exclude', // If excluding, show entries without dates
          matchReason: 'no-date'
        });
        continue;
      }
      
      const entryTimestamp = formatDateForComparison(entry.date);
      const isSelected = selectedTimestamps.has(entryTimestamp);
      
      // Apply include/exclude logic
      const visible = mode === 'include' ? isSelected : !isSelected;
      
      results.push({
        id: entry.source || `entry-${i}`,
        visible,
        matchReason: visible ? `multi-date-${mode}` : `multi-date-${mode}-exclude`
      });
      
      // Track affected dates
      if (isSelected && !affectedDates.includes(entry.date)) {
        affectedDates.push(entry.date);
      }
    }
    
    // Send results
    self.postMessage({
      id: generateUniqueId(),
      type: 'FILTER_RESULTS',
      timestamp: Date.now(),
      data: {
        requestId,
        results: {
          visibilityMap: results,
          affectedDates
        },
        timing: {
          processingTime: Date.now() - message.timestamp,
          entriesProcessed: entries.length
        }
      }
    });
    
    workerLogger.info('Filter', 'Multiple dates filter completed', {
      requestId,
      totalEntries: entries.length,
      visibleEntries: results.filter(r => r.visible).length,
      affectedDatesCount: affectedDates.length
    });
    
    endTimer();
    
  } catch (error) {
    endTimer();
    workerLogger.error('Filter', `Multiple dates filter failed: ${error.message}`, {
      requestId,
      error: error.message,
      stack: error.stack
    });
    sendError(requestId, error.message, { operation: 'multipleDatesFilter' });
  }
}

// Pattern filtering implementation (basic implementation for Phase 1)
function handlePatternFilter(message: WorkerMessage) {
  const endTimer = workerLogger.time(`process.${message.type}`);
  const { entries, pattern, dateRange } = message.data;
  const requestId = message.id;
  
  workerLogger.debug('Filter', `Starting pattern filter`, { 
    requestId,
    entriesCount: entries.length,
    patternType: pattern.type,
    patternValue: pattern.value
  });

  try {
    // Basic implementation - can be enhanced in later phases
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
      
      // Basic pattern matching - to be expanded
      switch (pattern.type) {
        case 'weekday':
          matches = entryDate.getDay() === pattern.value;
          break;
        case 'month-day':
          matches = entryDate.getDate() === pattern.value;
          break;
        default:
          workerLogger.warn('Filter', `Unsupported pattern type: ${pattern.type}`, { requestId, patternType: pattern.type });
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
    
    // Basic pattern analysis
    const patternInfo: PatternAnalysis = {
      totalMatches: results.filter(r => r.visible).length,
      patternEfficiency: results.length > 0 ? results.filter(r => r.visible).length / results.length : 0
    };
    
    // Send results
    self.postMessage({
      id: generateUniqueId(),
      type: 'FILTER_RESULTS',
      timestamp: Date.now(),
      data: {
        requestId,
        results: {
          visibilityMap: results,
          matchedDates,
          patternInfo
        },
        timing: {
          processingTime: Date.now() - message.timestamp,
          entriesProcessed: entries.length
        }
      }
    });
    
    workerLogger.info('Filter', 'Pattern filter completed', {
      requestId,
      totalEntries: entries.length,
      matchedEntries: patternInfo.totalMatches,
      efficiency: patternInfo.patternEfficiency
    });
    
    endTimer();
    
  } catch (error) {
    endTimer();
    workerLogger.error('Filter', `Pattern filter failed: ${error.message}`, {
      requestId,
      error: error.message,
      stack: error.stack
    });
    sendError(requestId, error.message, { operation: 'patternFilter' });
  }
}

// Handle cancellation requests
function handleCancelFilter(message: WorkerMessage) {
  const { requestId } = message.data;
  cancelledRequests.add(requestId);
  
  workerLogger.info('Filter', 'Filter cancellation requested', { 
    originalRequestId: requestId 
  });
  
  // Acknowledge cancellation
  self.postMessage({
    id: generateUniqueId(),
    type: 'FILTER_RESULTS',
    timestamp: Date.now(),
    data: {
      requestId,
      cancelled: true
    }
  });
}

// Version check handler
function handleVersionCheck(message: WorkerMessage) {
  const { protocolVersion } = message.data || {};
  
  workerLogger.info('Version', 'Version check requested', { 
    requestedVersion: protocolVersion,
    workerVersion: CURRENT_PROTOCOL_VERSION
  });
  
  self.postMessage({
    id: generateUniqueId(),
    type: 'VERSION_CHECK',
    timestamp: Date.now(),
    data: {
      supported: protocolVersion === CURRENT_PROTOCOL_VERSION,
      workerVersion: CURRENT_PROTOCOL_VERSION,
      requestedVersion: protocolVersion
    }
  });
}

// Main message handler
self.onmessage = function(e: MessageEvent) {
  const message = e.data as WorkerMessage;
  
  workerLogger.debug('Message', `Received ${message.type}`, { 
    requestId: message.id,
    messageType: message.type,
    dataSize: JSON.stringify(message.data || {}).length
  });
  
  try {
    switch (message.type) {
      case 'FILTER_BY_DATE_RANGE':
        handleDateRangeFilter(message);
        break;
      case 'FILTER_BY_MULTIPLE_DATES':
        handleMultipleDatesFilter(message);
        break;
      case 'FILTER_BY_PATTERN':
        handlePatternFilter(message);
        break;
      case 'CANCEL_FILTER':
        handleCancelFilter(message);
        break;
      case 'VERSION_CHECK':
        handleVersionCheck(message);
        break;
      default:
        workerLogger.warn('Message', `Unknown message type: ${message.type}`, {
          requestId: message.id,
          messageType: message.type
        });
        sendError(message.id, 'Unknown message type');
    }
  } catch (error) {
    workerLogger.error('Processing', `Error processing ${message.type}`, {
      requestId: message.id,
      error: error.message,
      stack: error.stack
    });
    sendError(message.id, error.message);
  }
};

// Worker error handler
self.addEventListener('error', (error) => {
  workerLogger.error('Runtime', 'Worker runtime error', {
    message: error.message,
    filename: error.filename,
    lineno: error.lineno,
    colno: error.colno
  });
  
  self.postMessage({
    id: 'error',
    type: 'FILTER_ERROR',
    timestamp: Date.now(),
    data: {
      requestId: 'global',
      error: error.message || 'Unknown worker error'
    }
  });
});

// Initialize worker
workerLogger.info('Initialization', 'Date filter worker initialized', {
  version: CURRENT_PROTOCOL_VERSION,
  timestamp: Date.now()
}); 
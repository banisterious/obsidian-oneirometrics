// Universal Worker Pool
// Manages multiple workers and routes tasks intelligently based on type and load

import { App } from 'obsidian';
import { getLogger } from '../logging';
import type { ContextualLogger } from '../logging';
import safeLogger from '../logging/safe-logger';
import { 
  UniversalTask,
  UniversalTaskType,
  TaskResult,
  TaskCallbacks,
  UniversalPoolConfiguration,
  WorkerCapabilities,
  PoolStatistics,
  TaskError,
  WorkerError,
  CircuitBreakerState,
  CURRENT_PROTOCOL_VERSION 
} from './types';

// Worker instance tracking
interface PoolWorker {
  id: string;
  worker: Worker;
  capabilities: WorkerCapabilities;
  activeTasks: Map<string, UniversalTask>;
  isHealthy: boolean;
  lastHealthCheck: number;
  createdAt: number;
  taskHistory: {
    completed: number;
    failed: number;
    avgTime: number;
  };
}

// Task queue entry
interface QueuedTask {
  task: UniversalTask;
  callbacks?: TaskCallbacks;
  queuedAt: number;
  attempts: number;
}

// Load balancing strategy interface
interface LoadBalancer {
  selectWorker(
    availableWorkers: PoolWorker[], 
    task: UniversalTask
  ): PoolWorker | null;
}

// Round-robin load balancer
class RoundRobinBalancer implements LoadBalancer {
  private currentIndex = 0;

  selectWorker(availableWorkers: PoolWorker[], task: UniversalTask): PoolWorker | null {
    if (availableWorkers.length === 0) return null;
    
    const worker = availableWorkers[this.currentIndex % availableWorkers.length];
    this.currentIndex = (this.currentIndex + 1) % availableWorkers.length;
    return worker;
  }
}

// Least-loaded balancer
class LeastLoadedBalancer implements LoadBalancer {
  selectWorker(availableWorkers: PoolWorker[], task: UniversalTask): PoolWorker | null {
    if (availableWorkers.length === 0) return null;
    
    return availableWorkers.reduce((least, current) => 
      current.activeTasks.size < least.activeTasks.size ? current : least
    );
  }
}

// Task-affinity balancer (prefers workers that handle the task type well)
class TaskAffinityBalancer implements LoadBalancer {
  selectWorker(availableWorkers: PoolWorker[], task: UniversalTask): PoolWorker | null {
    if (availableWorkers.length === 0) return null;
    
    // Prefer workers that list this task type as preferred
    const preferredWorkers = availableWorkers.filter(w => 
      w.capabilities.preferredTaskTypes?.includes(task.taskType)
    );
    
    if (preferredWorkers.length > 0) {
      // Among preferred workers, choose least loaded
      return preferredWorkers.reduce((least, current) => 
        current.activeTasks.size < least.activeTasks.size ? current : least
      );
    }
    
    // Fall back to least loaded among all available
    return availableWorkers.reduce((least, current) => 
      current.activeTasks.size < least.activeTasks.size ? current : least
    );
  }
}

export class UniversalWorkerPool {
  private _logger: ContextualLogger | null = null;
  private get logger(): ContextualLogger {
    if (!this._logger) {
      try {
        this._logger = getLogger('UniversalWorkerPool') as ContextualLogger;
      } catch (error) {
        // Fallback to safe logger when structured logging fails
        this._logger = {
          debug: (category: string, message: string, ...args: any[]) => safeLogger.debug('UniversalWorkerPool', `${category}: ${message}`, ...args),
          info: (category: string, message: string, ...args: any[]) => safeLogger.info('UniversalWorkerPool', `${category}: ${message}`, ...args),
          warn: (category: string, message: string, ...args: any[]) => safeLogger.warn('UniversalWorkerPool', `${category}: ${message}`, ...args),
          error: (category: string, message: string, ...args: any[]) => safeLogger.error('UniversalWorkerPool', `${category}: ${message}`, ...args),
          trace: (category: string, message: string, ...args: any[]) => safeLogger.debug('UniversalWorkerPool', `${category}: ${message}`, ...args)
        } as ContextualLogger;
      }
    }
    return this._logger;
  }
  private workers = new Map<string, PoolWorker>();
  private taskQueue: QueuedTask[] = [];
  private activeRequests = new Map<string, {
    resolve: (result: TaskResult) => void;
    reject: (error: Error) => void;
    callbacks?: TaskCallbacks;
    startTime: number;
  }>();

  private loadBalancer: LoadBalancer;
  private healthCheckInterval?: NodeJS.Timeout;
  private queueProcessingInterval?: NodeJS.Timeout;
  
  // Pool statistics
  private stats: PoolStatistics = {
    totalWorkers: 0,
    activeWorkers: 0,
    idleWorkers: 0,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageTaskTime: 0,
    queueDepth: 0
  };

  constructor(
    private app: App,
    private config: UniversalPoolConfiguration
  ) {
    this.initializeLoadBalancer();
    this.initializeWorkerPool();
    this.startHealthChecking();
    this.startQueueProcessing();
    
    this.logger.info('Initialization', 'Universal Worker Pool initialized', {
      maxWorkers: config.maxWorkers,
      loadBalancing: config.loadBalancing,
      supportedTaskTypes: Object.keys(config.workerTypes)
    });
  }

  // Initialize load balancing strategy
  private initializeLoadBalancer(): void {
    switch (this.config.loadBalancing) {
      case 'round-robin':
        this.loadBalancer = new RoundRobinBalancer();
        break;
      case 'least-loaded':
        this.loadBalancer = new LeastLoadedBalancer();
        break;
      case 'task-affinity':
        this.loadBalancer = new TaskAffinityBalancer();
        break;
      default:
        this.loadBalancer = new LeastLoadedBalancer();
    }
  }

  // Initialize the worker pool
  private initializeWorkerPool(): void {
    const workerCount = Math.min(this.config.maxWorkers, 4); // Cap at 4 workers
    
    for (let i = 0; i < workerCount; i++) {
      this.createWorker(`worker-${i + 1}`);
    }

    this.updateStatistics();
  }

  // Create a new worker instance
  private createWorker(workerId: string): void {
    try {
      this.logger.debug('Worker', `Creating worker: ${workerId}`);
      
      // For now, create a generic worker that can handle all task types
      // In a full implementation, this would use the inline worker plugin
      const workerScript = this.getUniversalWorkerScript();
      this.logger.debug('Worker', `Worker script generated, length: ${workerScript.length}`);
      
      const workerBlob = new Blob([workerScript], {
        type: 'application/javascript'
      });
      this.logger.debug('Worker', `Worker blob created, size: ${workerBlob.size}`);
      
      const blobUrl = URL.createObjectURL(workerBlob);
      this.logger.debug('Worker', `Blob URL created: ${blobUrl}`);
      
      const worker = new Worker(blobUrl);
      this.logger.debug('Worker', `Worker instantiated: ${workerId}`);
      
      const poolWorker: PoolWorker = {
        id: workerId,
        worker,
        capabilities: {
          workerId,
          supportedTasks: [
            UniversalTaskType.DATE_FILTER, 
            UniversalTaskType.METRICS_CALCULATION, 
            UniversalTaskType.TAG_ANALYSIS, 
            UniversalTaskType.SEARCH_FILTER, 
            UniversalTaskType.DATE_RANGE_FILTER, 
            UniversalTaskType.CONTENT_FILTER, 
            UniversalTaskType.METADATA_FILTER, 
            UniversalTaskType.COMPLEX_FILTER, 
            UniversalTaskType.FILTER_VALIDATION,
            // Add missing MetricsCalculator task types - Phase 2.4
            UniversalTaskType.DREAM_METRICS_PROCESSING,
            UniversalTaskType.SENTIMENT_ANALYSIS,
            UniversalTaskType.ADVANCED_METRICS_CALCULATION,
            UniversalTaskType.TIME_BASED_METRICS,
            UniversalTaskType.METRICS_AGGREGATION,
            UniversalTaskType.CONTENT_ANALYSIS
          ],
          maxConcurrentTasks: 3,
          memoryLimit: this.config.memoryLimit,
          preferredTaskTypes: this.getPreferredTaskTypes(workerId)
        },
        activeTasks: new Map(),
        isHealthy: true,
        lastHealthCheck: Date.now(),
        createdAt: Date.now(),
        taskHistory: {
          completed: 0,
          failed: 0,
          avgTime: 0
        }
      };

      this.setupWorkerEventHandlers(poolWorker);
      this.workers.set(workerId, poolWorker);
      
      this.logger.info('Worker', `Created worker: ${workerId}`, {
        workerId,
        supportedTasks: poolWorker.capabilities.supportedTasks,
        maxConcurrentTasks: poolWorker.capabilities.maxConcurrentTasks
      });

    } catch (error) {
      this.logger.error('Worker', `Failed to create worker: ${workerId}`, 
        this.logger.enrichError(error as Error, {
          component: 'UniversalWorkerPool',
          operation: 'createWorker',
          metadata: { workerId }
        })
      );
    }
  }

  // Setup event handlers for a worker
  private setupWorkerEventHandlers(poolWorker: PoolWorker): void {
    const { worker, id: workerId } = poolWorker;

    worker.onmessage = (event) => {
      const message = event.data;
      this.logger.debug('Worker', `Message received from worker: ${workerId}`, {
        messageType: message?.type,
        messageId: message?.id,
        messageData: message?.data ? Object.keys(message.data) : 'none'
      });
      this.handleWorkerMessage(workerId, message);
    };

    worker.onerror = (error) => {
      this.logger.error('Worker', `Worker error: ${workerId}`, {
        workerId,
        error: error.message || 'Unknown error',
        filename: error.filename || 'Unknown file',
        lineno: error.lineno || 'Unknown line',
        colno: error.colno || 'Unknown column',
        type: error.type || 'Unknown type',
        stack: error.error?.stack || 'No stack available'
      });
      
      this.handleWorkerFailure(workerId);
    };

    worker.onmessageerror = (error) => {
      this.logger.error('Worker', `Worker message error: ${workerId}`, {
        workerId,
        error: error.type || 'Unknown message error',
        data: error.data || 'No error data available'
      });
    };

    // Send initial capabilities request
    worker.postMessage({
      id: `capabilities-${workerId}`,
      type: 'WORKER_CAPABILITIES',
      timestamp: Date.now(),
      protocolVersion: CURRENT_PROTOCOL_VERSION
    });
  }

  // Handle messages from workers
  private handleWorkerMessage(workerId: string, message: any): void {
    const poolWorker = this.workers.get(workerId);
    if (!poolWorker) return;

    switch (message.type) {
      case 'TASK_RESULTS':
        this.handleTaskResult(workerId, message);
        break;
      case 'TASK_PROGRESS':
        this.handleTaskProgress(workerId, message);
        break;
      case 'TASK_ERROR':
        this.handleTaskError(workerId, message);
        break;
      case 'WORKER_CAPABILITIES':
        this.handleWorkerCapabilities(workerId, message);
        break;
      case 'WORKER_LOG':
        this.handleWorkerLog(workerId, message);
        break;
      case 'WORKER_HEALTH_CHECK':
        // Health checks are normal - log at trace level only
        this.logger.trace('Message', `Health check from worker: ${workerId}`, {
          workerId,
          messageType: message.type
        });
        break;
      default:
        this.logger.debug('Message', `Unknown message type from worker: ${workerId}`, {
          workerId,
          messageType: message.type
        });
    }
  }

  // Handle task completion
  private handleTaskResult(workerId: string, message: any): void {
    const { taskId } = message.data;
    const request = this.activeRequests.get(taskId);
    const poolWorker = this.workers.get(workerId);

    if (!request || !poolWorker) return;

    // Remove task from worker's active tasks
    poolWorker.activeTasks.delete(taskId);
    
    // Update worker task history
    poolWorker.taskHistory.completed++;
    const duration = Date.now() - request.startTime;
    poolWorker.taskHistory.avgTime = 
      (poolWorker.taskHistory.avgTime * (poolWorker.taskHistory.completed - 1) + duration) / 
      poolWorker.taskHistory.completed;

    // Update pool statistics
    this.stats.completedTasks++;
    this.updateAverageTaskTime(duration);

    this.logger.info('Task', `Task completed: ${taskId}`, {
      taskId,
      workerId,
      duration: `${duration}ms`,
      success: message.data.success
    });

    // Resolve the request
    if (request.callbacks?.onComplete) {
      request.callbacks.onComplete(message.data);
    }
    request.resolve(message.data);
    this.activeRequests.delete(taskId);

    // Update statistics and process queue
    this.updateStatistics();
    this.processQueue();
  }

  // Handle task progress updates
  private handleTaskProgress(workerId: string, message: any): void {
    const { taskId } = message.data;
    const request = this.activeRequests.get(taskId);

    if (request?.callbacks?.onProgress) {
      request.callbacks.onProgress(message.data);
    }

    this.logger.debug('Task', `Task progress: ${taskId}`, {
      taskId,
      workerId,
      progress: message.data.progress
    });
  }

  // Handle task errors
  private handleTaskError(workerId: string, message: any): void {
    const { taskId } = message.data;
    const request = this.activeRequests.get(taskId);
    const poolWorker = this.workers.get(workerId);

    if (!request || !poolWorker) return;

    // Remove task from worker's active tasks
    poolWorker.activeTasks.delete(taskId);
    
    // Update worker task history
    poolWorker.taskHistory.failed++;

    // Update pool statistics
    this.stats.failedTasks++;

    const error = new TaskError(
      message.data.error || 'Task failed',
      message.data.taskType || 'UNKNOWN',
      taskId,
      { workerId }
    );

    this.logger.error('Task', `Task failed: ${taskId}`, {
      taskId,
      workerId,
      error: message.data.error,
      taskType: message.data.taskType
    });

    // Handle the error
    if (request.callbacks?.onError) {
      request.callbacks.onError(error.message);
    }
    request.reject(error);
    this.activeRequests.delete(taskId);

    // Update statistics and process queue
    this.updateStatistics();
    this.processQueue();
  }

  // Handle worker capabilities
  private handleWorkerCapabilities(workerId: string, message: any): void {
    const poolWorker = this.workers.get(workerId);
    if (!poolWorker) return;

    poolWorker.capabilities = { ...poolWorker.capabilities, ...message.data };
    
    this.logger.info('Worker', `Updated capabilities for worker: ${workerId}`, {
      workerId,
      capabilities: poolWorker.capabilities
    });
  }

  // Handle worker log messages
  private handleWorkerLog(workerId: string, message: any): void {
    const { level, category, message: logMessage, context } = message.data;
    
    // Forward worker logs to main logger with worker context
    const workerLogger = this.logger.withContext({ workerId });
    
    switch (level) {
      case 'debug':
        workerLogger.debug(category, logMessage, context);
        break;
      case 'info':
        workerLogger.info(category, logMessage, context);
        break;
      case 'warn':
        workerLogger.warn(category, logMessage, context);
        break;
      case 'error':
        workerLogger.error(category, logMessage, context);
        break;
    }
  }

  // Public method to process a task
  async processTask(task: UniversalTask, callbacks?: TaskCallbacks): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      // Store the request
      this.activeRequests.set(task.taskId, {
        resolve,
        reject,
        callbacks,
        startTime: Date.now()
      });

      // Add to queue for processing
      this.taskQueue.push({
        task,
        callbacks,
        queuedAt: Date.now(),
        attempts: 0
      });

      this.stats.totalTasks++;
      this.stats.queueDepth = this.taskQueue.length;

      this.logger.debug('Task', `Task queued: ${task.taskId}`, {
        taskId: task.taskId,
        taskType: task.taskType,
        priority: task.priority,
        queueDepth: this.taskQueue.length
      });

      // Try to process immediately
      this.processQueue();
    });
  }

  // Process the task queue
  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    // Sort queue by priority (high -> normal -> low) and queue time
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.task.priority] - priorityOrder[a.task.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.queuedAt - b.queuedAt; // Earlier tasks first
    });

    // Try to assign tasks to available workers
    const availableWorkers = Array.from(this.workers.values()).filter(worker => 
      worker.isHealthy && 
      worker.activeTasks.size < worker.capabilities.maxConcurrentTasks
    );

    let processed = 0;
    for (let i = 0; i < this.taskQueue.length && processed < availableWorkers.length; i++) {
      const queueItem = this.taskQueue[i];
      const { task } = queueItem;

      // Find workers that support this task type
      const compatibleWorkers = availableWorkers.filter(worker =>
        worker.capabilities.supportedTasks.includes(task.taskType) &&
        worker.activeTasks.size < worker.capabilities.maxConcurrentTasks
      );

      if (compatibleWorkers.length === 0) continue;

      // Select the best worker using load balancer
      const selectedWorker = this.loadBalancer.selectWorker(compatibleWorkers, task);
      if (!selectedWorker) continue;

      // Assign task to worker
      this.assignTaskToWorker(selectedWorker, task);
      
      // Remove from queue
      this.taskQueue.splice(i, 1);
      i--; // Adjust index since we removed an item
      processed++;
    }

    this.stats.queueDepth = this.taskQueue.length;
    this.updateStatistics();
  }

  // Assign a task to a specific worker
  private assignTaskToWorker(worker: PoolWorker, task: UniversalTask): void {
    worker.activeTasks.set(task.taskId, task);

    worker.worker.postMessage({
      id: task.taskId,
      type: 'PROCESS_TASK',
      timestamp: Date.now(),
      protocolVersion: CURRENT_PROTOCOL_VERSION,
      data: { task }
    });

    this.logger.info('Task', `Task assigned to worker`, {
      taskId: task.taskId,
      taskType: task.taskType,
      workerId: worker.id,
      activeTasks: worker.activeTasks.size
    });
  }

  // Handle worker failure
  private handleWorkerFailure(workerId: string): void {
    const poolWorker = this.workers.get(workerId);
    if (!poolWorker) return;

    poolWorker.isHealthy = false;
    
    this.logger.warn('Worker', `Worker marked as unhealthy: ${workerId}`, {
      workerId,
      activeTasks: poolWorker.activeTasks.size
    });

    // Requeue active tasks
    for (const [taskId, task] of poolWorker.activeTasks) {
      this.logger.info('Task', `Requeuing task due to worker failure`, {
        taskId,
        taskType: task.taskType,
        failedWorkerId: workerId
      });

      this.taskQueue.unshift({
        task,
        callbacks: this.activeRequests.get(taskId)?.callbacks,
        queuedAt: Date.now(),
        attempts: 1
      });
    }

    poolWorker.activeTasks.clear();
    
    // Try to recreate the worker
    this.recreateWorker(workerId);
    
    // Process queue to reassign tasks
    this.processQueue();
  }

  // Recreate a failed worker
  private recreateWorker(workerId: string): void {
    try {
      const oldWorker = this.workers.get(workerId);
      if (oldWorker) {
        oldWorker.worker.terminate();
        this.workers.delete(workerId);
      }

      // Create new worker with same ID
      this.createWorker(workerId);
      
      this.logger.info('Worker', `Worker recreated: ${workerId}`, { workerId });
    } catch (error) {
      this.logger.error('Worker', `Failed to recreate worker: ${workerId}`,
        this.logger.enrichError(error as Error, {
          component: 'UniversalWorkerPool',
          operation: 'recreateWorker',
          metadata: { workerId }
        })
      );
    }
  }

  // Start health checking
  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  // Perform health checks on all workers
  private performHealthChecks(): void {
    for (const [workerId, poolWorker] of this.workers) {
      if (!poolWorker.isHealthy) continue;

      // Send health check ping
      poolWorker.worker.postMessage({
        id: `health-${workerId}-${Date.now()}`,
        type: 'WORKER_HEALTH_CHECK',
        timestamp: Date.now(),
        protocolVersion: CURRENT_PROTOCOL_VERSION
      });

      poolWorker.lastHealthCheck = Date.now();
    }
  }

  // Start queue processing
  private startQueueProcessing(): void {
    this.queueProcessingInterval = setInterval(() => {
      if (this.taskQueue.length > 0) {
        this.processQueue();
      }
    }, 1000); // Process queue every second
  }

  // Update pool statistics
  private updateStatistics(): void {
    this.stats.totalWorkers = this.workers.size;
    this.stats.activeWorkers = Array.from(this.workers.values())
      .filter(w => w.isHealthy && w.activeTasks.size > 0).length;
    this.stats.idleWorkers = Array.from(this.workers.values())
      .filter(w => w.isHealthy && w.activeTasks.size === 0).length;
    this.stats.queueDepth = this.taskQueue.length;
  }

  // Update average task time
  private updateAverageTaskTime(newTime: number): void {
    if (this.stats.completedTasks === 1) {
      this.stats.averageTaskTime = newTime;
    } else {
      this.stats.averageTaskTime = 
        (this.stats.averageTaskTime * (this.stats.completedTasks - 1) + newTime) / 
        this.stats.completedTasks;
    }
  }

  // Get preferred task types for a worker (simple round-robin assignment)
  private getPreferredTaskTypes(workerId: string): UniversalTaskType[] {
    const allTypes: UniversalTaskType[] = [UniversalTaskType.DATE_FILTER, UniversalTaskType.METRICS_CALCULATION, UniversalTaskType.TAG_ANALYSIS, UniversalTaskType.SEARCH_FILTER];
    const workerIndex = parseInt(workerId.split('-')[1]) - 1;
    
    // Give each worker a preferred task type for affinity
    return [allTypes[workerIndex % allTypes.length]];
  }

  // Generate universal worker script
  private getUniversalWorkerScript(): string {
    return `
// Universal Worker Script
// Handles multiple task types in a single worker

try {

class UniversalWorker {
  constructor() {
    try {
      this.workerId = 'universal-' + Math.random().toString(36).substr(2, 9);
      this.setupMessageHandlers();
      // Send initialization success message
      self.postMessage({
        id: 'init-' + this.workerId,
        type: 'WORKER_LOG',
        timestamp: Date.now(),
        data: {
          level: 'info',
          category: 'Worker',
          message: 'Worker initialized successfully',
          context: { workerId: this.workerId },
          workerId: this.workerId
        }
      });
    } catch (error) {
      self.postMessage({
        id: 'init-error',
        type: 'WORKER_LOG',
        timestamp: Date.now(),
        data: {
          level: 'error',
          category: 'Worker',
          message: 'Worker initialization failed: ' + error.message,
          context: { error: error.stack || error.toString() },
          workerId: 'unknown'
        }
      });
    }
  }

  setupMessageHandlers() {
    self.onmessage = (event) => {
      const message = event.data;
      
      try {
        switch (message.type) {
          case 'PROCESS_TASK':
            this.processTask(message);
            break;
          case 'WORKER_HEALTH_CHECK':
            this.handleHealthCheck(message);
            break;
          case 'WORKER_CAPABILITIES':
            this.sendCapabilities(message);
            break;
          default:
            this.sendError(message.id, 'Unknown message type: ' + message.type);
        }
      } catch (error) {
        this.sendError(message.id, error.message);
      }
    };
  }

  processTask(message) {
    const { task } = message.data;
    const startTime = performance.now();

    // Route to appropriate processor
    switch (task.taskType) {
      case 'DATE_FILTER':
        this.processDateFilter(task);
        break;
      case 'METRICS_CALCULATION':
        this.processMetricsCalculation(task);
        break;
      case 'TAG_ANALYSIS':
        this.processTagAnalysis(task);
        break;
      case 'SEARCH_FILTER':
        this.processSearchFilter(task);
        break;
      // New FilterManager task types
      case 'date_range_filter':
        this.processDateRangeFilter(task);
        break;
      case 'content_filter':
        this.processContentFilter(task);
        break;
      case 'metadata_filter':
        this.processMetadataFilter(task);
        break;
      case 'complex_filter':
        this.processComplexFilter(task);
        break;
      case 'filter_validation':
        this.processFilterValidation(task);
        break;
      // New MetricsCalculator task types - Phase 2.4
      case 'dream_metrics_processing':
        this.processDreamMetrics(task);
        break;
      case 'sentiment_analysis':
        this.processSentimentAnalysis(task);
        break;
      case 'advanced_metrics_calculation':
        this.processAdvancedMetrics(task);
        break;
      case 'time_based_metrics':
        this.processTimeBasedMetrics(task);
        break;
      case 'metrics_aggregation':
        this.processMetricsAggregation(task);
        break;
      case 'content_analysis':
        this.processContentAnalysis(task);
        break;
      default:
        this.sendTaskError(task.taskId, 'Unsupported task type: ' + task.taskType);
        return;
    }
  }

  processDateFilter(task) {
    // Simple date filtering implementation
    const { entries, startDate, endDate } = task.data;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    const results = entries.map(entry => ({
      id: entry.source || entry.id || 'unknown',
      visible: entry.date ? 
        (new Date(entry.date).getTime() >= start && new Date(entry.date).getTime() <= end) : 
        false,
      matchReason: 'date-range-filter'
    }));

    this.sendTaskResult(task.taskId, {
      taskId: task.taskId,
      taskType: task.taskType,
      success: true,
      data: { visibilityMap: results },
      metadata: {
        processingTime: performance.now() - startTime,
        workerPool: 'universal'
      }
    });
  }

  // New FilterManager methods
  processDateRangeFilter(task) {
    const startTime = performance.now();
    const { data: entries, criteria } = task.data;
    const { dateRange } = criteria;
    
    const startDate = new Date(dateRange.start).getTime();
    const endDate = new Date(dateRange.end).getTime();
    
    const filtered = entries.filter(entry => {
      if (!entry.date) return false;
      const entryTime = new Date(entry.date).getTime();
      return entryTime >= startDate && entryTime <= endDate;
    });

    this.sendTaskResult(task.taskId, {
      taskId: task.taskId,
      taskType: task.taskType,
      success: true,
      data: {
        filtered,
        total: entries.length,
        matched: filtered.length,
        statistics: {
          totalEntries: entries.length,
          visibleEntries: filtered.length,
          hiddenEntries: entries.length - filtered.length,
          processingTime: performance.now() - startTime,
          totalProcessed: entries.length,
          matched: filtered.length,
          filtered: entries.length - filtered.length,
          invalidEntries: 0,
          executionTimeMs: performance.now() - startTime
        }
      },
      metadata: {
        processingTime: performance.now() - startTime,
        workerPool: 'universal'
      }
    });
  }

  processContentFilter(task) {
    const startTime = performance.now();
    const { data: entries, criteria } = task.data;
    const { searchTerm, searchMode, caseSensitive } = criteria;
    
    if (!searchTerm) {
      this.sendTaskResult(task.taskId, {
        taskId: task.taskId,
        taskType: task.taskType,
        success: true,
        data: { filtered: entries, total: entries.length, matched: entries.length }
      });
      return;
    }

    const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    
    const filtered = entries.filter(entry => {
      if (!entry.content) return false;
      const content = caseSensitive ? entry.content : entry.content.toLowerCase();
      
      switch (searchMode) {
        case 'exact':
          return content === term;
        case 'partial':
          return content.includes(term);
        case 'regex':
          try {
            const regex = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
            return regex.test(entry.content);
          } catch {
            return false;
          }
        default:
          return content.includes(term);
      }
    });

    this.sendTaskResult(task.taskId, {
      taskId: task.taskId,
      taskType: task.taskType,
      success: true,
      data: {
        filtered,
        total: entries.length,
        matched: filtered.length,
        statistics: {
          totalEntries: entries.length,
          visibleEntries: filtered.length,
          hiddenEntries: entries.length - filtered.length,
          processingTime: performance.now() - startTime,
          totalProcessed: entries.length,
          matched: filtered.length,
          filtered: entries.length - filtered.length,
          invalidEntries: 0,
          executionTimeMs: performance.now() - startTime
        }
      },
      metadata: {
        processingTime: performance.now() - startTime,
        workerPool: 'universal'
      }
    });
  }

  processMetadataFilter(task) {
    const startTime = performance.now();
    const { data: entries, criteria } = task.data;
    const { tags, properties } = criteria;
    
    const filtered = entries.filter(entry => {
      if (!entry.metadata) return false;
      
      // Tag filtering
      if (tags && tags.length > 0) {
        const entryTags = entry.metadata.tags || [];
        const hasMatchingTag = tags.some(tag => entryTags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      
      // Property filtering
      if (properties) {
        for (const [key, value] of Object.entries(properties)) {
          if (entry.metadata[key] !== value) return false;
        }
      }
      
      return true;
    });

    this.sendTaskResult(task.taskId, {
      taskId: task.taskId,
      taskType: task.taskType,
      success: true,
      data: {
        filtered,
        total: entries.length,
        matched: filtered.length,
        statistics: {
          totalEntries: entries.length,
          visibleEntries: filtered.length,
          hiddenEntries: entries.length - filtered.length,
          processingTime: performance.now() - startTime,
          totalProcessed: entries.length,
          matched: filtered.length,
          filtered: entries.length - filtered.length,
          invalidEntries: 0,
          executionTimeMs: performance.now() - startTime
        }
      },
      metadata: {
        processingTime: performance.now() - startTime,
        workerPool: 'universal'
      }
    });
  }

  processComplexFilter(task) {
    const startTime = performance.now();
    const { data: entries, criteria } = task.data;
    
    // For now, implement basic AND/OR logic
    const filtered = entries.filter(entry => {
      // Complex filtering implementation would go here
      // For now, just return all entries
      return true;
    });

    this.sendTaskResult(task.taskId, {
      taskId: task.taskId,
      taskType: task.taskType,
      success: true,
      data: {
        filtered,
        total: entries.length,
        matched: filtered.length,
        statistics: {
          totalEntries: entries.length,
          visibleEntries: filtered.length,
          hiddenEntries: entries.length - filtered.length,
          processingTime: performance.now() - startTime,
          totalProcessed: entries.length,
          matched: filtered.length,
          filtered: entries.length - filtered.length,
          invalidEntries: 0,
          executionTimeMs: performance.now() - startTime
        }
      },
      metadata: {
        processingTime: performance.now() - startTime,
        workerPool: 'universal'
      }
    });
  }

  processFilterValidation(task) {
    const startTime = performance.now();
    const { criteria } = task.data;
    const errors = [];
    
    // Validate date range
    if (criteria.dateRange) {
      const start = new Date(criteria.dateRange.start);
      const end = new Date(criteria.dateRange.end);
      
      if (isNaN(start.getTime())) {
        errors.push('Invalid start date format');
      }
      if (isNaN(end.getTime())) {
        errors.push('Invalid end date format');
      }
      if (start > end) {
        errors.push('Start date must be before end date');
      }
    }
    
    // Validate regex patterns
    if (criteria.searchMode === 'regex' && criteria.searchTerm) {
      try {
        new RegExp(criteria.searchTerm);
      } catch {
        errors.push('Invalid regular expression');
      }
    }

    this.sendTaskResult(task.taskId, {
      taskId: task.taskId,
      taskType: task.taskType,
      success: true,
      data: {
        filtered: [],
        total: 0,
        matched: errors.length,
        errors
      },
      metadata: {
        processingTime: performance.now() - startTime,
        workerPool: 'universal'
      }
    });
  }

  // =============================================================================
  // METRICS PROCESSING METHODS - Phase 2.4
  // =============================================================================

  processDreamMetrics(task) {
    const startTime = performance.now();
    const { data: entries, options } = task.data;
    
    if (!entries || !Array.isArray(entries)) {
      this.sendTaskError(task.taskId, 'Invalid entries data for dream metrics processing');
      return;
    }

    const processedEntries = [];
    const aggregatedMetrics = {};
    let statistics = {
      totalEntries: entries.length,
      processedEntries: 0,
      failedEntries: 0,
      processingTime: 0,
      calculationsPerformed: {
        sentiment: 0,
        advanced: 0,
        timeBased: 0,
        aggregations: 0
      }
    };

    // Process each entry
    for (const entry of entries) {
      try {
        const calculatedMetrics = { ...entry.metrics || {} };
        
        // Basic word count
        const wordCount = entry.content ? entry.content.trim().split(/\s+/).length : 0;
        calculatedMetrics['Words'] = wordCount;
        
        // Sentiment analysis if enabled
        let sentimentScore = 0;
        if (options?.enableSentimentAnalysis) {
          sentimentScore = this.calculateSentiment(entry.content || '');
          calculatedMetrics['Sentiment'] = sentimentScore;
          statistics.calculationsPerformed.sentiment++;
        }
        
        // Advanced metrics if enabled
        let advancedMetrics = undefined;
        if (options?.enableAdvancedMetrics) {
          try {
            advancedMetrics = this.calculateAdvancedMetricsWorker(entry.content || '');
            if (advancedMetrics && typeof advancedMetrics === 'object') {
              Object.assign(calculatedMetrics, advancedMetrics);
            }
            statistics.calculationsPerformed.advanced++;
          } catch (error) {
            // Advanced metrics failed, continue without them
          }
        }

        processedEntries.push({
          ...entry,
          calculatedMetrics,
          sentimentScore,
          advancedMetrics
        });
        
        statistics.processedEntries++;
      } catch (error) {
        statistics.failedEntries++;
        // Still add entry with basic metrics
        processedEntries.push({
          ...entry,
          calculatedMetrics: { Words: 0 },
          sentimentScore: 0
        });
      }
    }

    // Calculate aggregations
    this.calculateMetricsAggregations(processedEntries, aggregatedMetrics);
    statistics.calculationsPerformed.aggregations = Object.keys(aggregatedMetrics).length;
    
    statistics.processingTime = performance.now() - startTime;

    this.sendTaskResult(task.taskId, {
      taskId: task.taskId,
      taskType: task.taskType,
      success: true,
      data: {
        entries: processedEntries,
        aggregatedMetrics,
        statistics,
        metadata: {
          taskType: 'dream_processing',
          executionTime: statistics.processingTime,
          cacheHit: false
        }
      },
      metadata: {
        processingTime: statistics.processingTime,
        workerPool: 'universal'
      }
    });
  }

  processSentimentAnalysis(task) {
    const startTime = performance.now();
    const { data: entries } = task.data;
    
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      this.sendTaskError(task.taskId, 'Invalid entries data for sentiment analysis');
      return;
    }

    const entry = entries[0]; // Process first entry for individual analysis
    const content = entry.content || '';
    
    const sentimentResult = this.calculateSentimentDetailed(content);

    this.sendTaskResult(task.taskId, {
      taskId: task.taskId,
      taskType: task.taskType,
      success: true,
      data: {
        sentimentResult,
        metadata: {
          taskType: 'sentiment',
          executionTime: performance.now() - startTime,
          cacheHit: false
        }
      },
      metadata: {
        processingTime: performance.now() - startTime,
        workerPool: 'universal'
      }
    });
  }

  processAdvancedMetrics(task) {
    const startTime = performance.now();
    const { data: entries } = task.data;
    
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      this.sendTaskError(task.taskId, 'Invalid entries data for advanced metrics');
      return;
    }

    const entry = entries[0]; // Process first entry
    const content = entry.content || '';
    
    const advancedMetrics = this.calculateAdvancedMetricsWorker(content);

    this.sendTaskResult(task.taskId, {
      taskId: task.taskId,
      taskType: task.taskType,
      success: true,
      data: {
        entries: [{
          ...entry,
          advancedMetrics
        }],
        metadata: {
          taskType: 'advanced',
          executionTime: performance.now() - startTime,
          cacheHit: false
        }
      },
      metadata: {
        processingTime: performance.now() - startTime,
        workerPool: 'universal'
      }
    });
  }

  processTimeBasedMetrics(task) {
    const startTime = performance.now();
    const { data: entries } = task.data;
    
    if (!entries || !Array.isArray(entries)) {
      this.sendTaskError(task.taskId, 'Invalid entries data for time-based metrics');
      return;
    }

    const timeBasedMetrics = this.calculateTimeBasedMetricsWorker(entries);

    this.sendTaskResult(task.taskId, {
      taskId: task.taskId,
      taskType: task.taskType,
      success: true,
      data: {
        timeBasedMetrics,
        metadata: {
          taskType: 'time_based',
          executionTime: performance.now() - startTime,
          cacheHit: false
        }
      },
      metadata: {
        processingTime: performance.now() - startTime,
        workerPool: 'universal'
      }
    });
  }

  processMetricsAggregation(task) {
    const startTime = performance.now();
    const { data: entries } = task.data;
    
    if (!entries || !Array.isArray(entries)) {
      this.sendTaskError(task.taskId, 'Invalid entries data for metrics aggregation');
      return;
    }

    const aggregatedMetrics = {};
    this.calculateMetricsAggregations(entries, aggregatedMetrics);

    this.sendTaskResult(task.taskId, {
      taskId: task.taskId,
      taskType: task.taskType,
      success: true,
      data: {
        aggregatedMetrics,
        metadata: {
          taskType: 'aggregation',
          executionTime: performance.now() - startTime,
          cacheHit: false
        }
      },
      metadata: {
        processingTime: performance.now() - startTime,
        workerPool: 'universal'
      }
    });
  }

  processContentAnalysis(task) {
    const startTime = performance.now();
    const { data: entries } = task.data;
    
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      this.sendTaskError(task.taskId, 'Invalid entries data for content analysis');
      return;
    }

    const entry = entries[0]; // Process first entry
    const content = entry.content || '';
    
    const contentAnalysis = this.analyzeContent(content);

    this.sendTaskResult(task.taskId, {
      taskId: task.taskId,
      taskType: task.taskType,
      success: true,
      data: {
        contentAnalysis,
        metadata: {
          taskType: 'content_analysis',
          executionTime: performance.now() - startTime,
          cacheHit: false
        }
      },
      metadata: {
        processingTime: performance.now() - startTime,
        workerPool: 'universal'
      }
    });
  }

  // =============================================================================
  // METRICS CALCULATION HELPERS
  // =============================================================================

  calculateSentiment(content) {
    try {
      if (!content || typeof content !== 'string') return 0;
      
      // Basic sentiment analysis
      const positiveWords = ['happy', 'joy', 'love', 'peaceful', 'beautiful', 'wonderful', 'amazing', 'good', 'great', 'excellent', 'pleasant', 'delight', 'calm', 'safe', 'clarity', 'flying', 'float', 'success', 'achieve', 'accomplish'];
      const negativeWords = ['sad', 'fear', 'anxious', 'angry', 'terrified', 'nightmare', 'falling', 'chase', 'dark', 'scary', 'bad', 'awful', 'terrible', 'horror', 'trapped', 'confused', 'lost', 'danger', 'threat', 'panic', 'death'];
      
      const lowerContent = content.toLowerCase();
      let positiveCount = 0;
      let negativeCount = 0;
      
      positiveWords.forEach(word => {
        try {
          const regex = new RegExp('\\\\b' + word + '\\\\b', 'g');
          const matches = lowerContent.match(regex);
          if (matches) positiveCount += matches.length;
        } catch (e) {
          // Skip invalid regex patterns
        }
      });
      
      negativeWords.forEach(word => {
        try {
          const regex = new RegExp('\\\\b' + word + '\\\\b', 'g');
          const matches = lowerContent.match(regex);
          if (matches) negativeCount += matches.length;
        } catch (e) {
          // Skip invalid regex patterns
        }
      });
      
      if (positiveCount === 0 && negativeCount === 0) return 0;
      
      const total = positiveCount + negativeCount;
      return Math.round(((positiveCount - negativeCount) / total) * 100) / 100;
    } catch (error) {
      return 0;
    }
  }

  calculateSentimentDetailed(content) {
    const score = this.calculateSentiment(content);
    return {
      score,
      magnitude: Math.abs(score),
      positiveWords: [], // Simplified - could extract actual words found
      negativeWords: [],
      neutralWords: [],
      confidence: 0.5
    };
  }

  calculateAdvancedMetricsWorker(content) {
    try {
      const metrics = {};
      
      if (!content || typeof content !== 'string') {
        return { Words: 0, Sentences: 0, Characters: 0, Paragraphs: 0 };
      }
      
      const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
      metrics['Words'] = wordCount;
      
      const sentenceCount = Math.max(1, (content.match(/[.!?]+\s/g) || []).length + 1);
      metrics['Sentences'] = sentenceCount;
      
      if (sentenceCount > 0) {
        metrics['Words per Sentence'] = Math.round((wordCount / sentenceCount) * 10) / 10;
      }
      
      metrics['Characters'] = content.replace(/\s/g, '').length;
      
      // Additional metrics
      const paragraphCount = Math.max(1, content.split(/\n\s*\n/).length);
      metrics['Paragraphs'] = paragraphCount;
      
      return metrics;
    } catch (error) {
      return { Words: 0, Sentences: 0, Characters: 0, Paragraphs: 0 };
    }
  }

  calculateTimeBasedMetricsWorker(entries) {
    const byMonth = {};
    const byDayOfWeek = {};
    const byHour = {};
    
    entries.forEach(entry => {
      if (!entry.date) return;
      
      const date = new Date(entry.date);
      const monthKey = date.getFullYear() + '-' + (date.getMonth() + 1);
      const dayKey = date.getDay();
      const hourKey = date.getHours();
      
      // Monthly metrics
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
      
      // Day of week metrics
      if (!byDayOfWeek[dayKey]) {
        byDayOfWeek[dayKey] = {
          count: 0,
          totalWords: 0,
          averageWords: 0,
          metricAverages: {}
        };
      }
      byDayOfWeek[dayKey].count++;
      byDayOfWeek[dayKey].totalWords += entry.wordCount || 0;
      byDayOfWeek[dayKey].averageWords = byDayOfWeek[dayKey].totalWords / byDayOfWeek[dayKey].count;
      
      // Hour metrics
      if (!byHour[hourKey]) {
        byHour[hourKey] = {
          count: 0,
          totalWords: 0,
          averageWords: 0,
          metricAverages: {}
        };
      }
      byHour[hourKey].count++;
      byHour[hourKey].totalWords += entry.wordCount || 0;
      byHour[hourKey].averageWords = byHour[hourKey].totalWords / byHour[hourKey].count;
    });
    
    return { byMonth, byDayOfWeek, byHour };
  }

  calculateMetricsAggregations(entries, aggregatedMetrics) {
    const metricNames = new Set();
    entries.forEach(entry => {
      if (entry.calculatedMetrics) {
        Object.keys(entry.calculatedMetrics).forEach(name => metricNames.add(name));
      }
    });
    
    metricNames.forEach(metricName => {
      const values = entries
        .map(entry => entry.calculatedMetrics && entry.calculatedMetrics[metricName])
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

  analyzeContent(content) {
    const wordCount = content.trim().split(/\s+/).length;
    const sentenceCount = (content.match(/[.!?]+\s/g) || []).length + 1;
    const paragraphCount = content.split(/\n\s*\n/).length;
    const characterCount = content.replace(/\s/g, '').length;
    
    return {
      wordCount,
      sentenceCount,
      paragraphCount,
      averageWordsPerSentence: sentenceCount > 0 ? Math.round((wordCount / sentenceCount) * 10) / 10 : 0,
      characterCount,
      complexity: wordCount < 50 ? 'simple' : wordCount < 200 ? 'moderate' : 'complex'
    };
  }

  handleHealthCheck(message) {
    self.postMessage({
      id: message.id,
      type: 'WORKER_HEALTH_CHECK',
      timestamp: Date.now(),
      data: { workerId: this.workerId, healthy: true }
    });
  }

  sendCapabilities(message) {
    self.postMessage({
      id: message.id,
      type: 'WORKER_CAPABILITIES',
      timestamp: Date.now(),
      data: {
        workerId: this.workerId,
        supportedTasks: [
          'date_filter', 'metrics_calculation', 'tag_analysis', 'search_filter', 
          'date_range_filter', 'content_filter', 'metadata_filter', 'complex_filter', 'filter_validation',
          'dream_metrics_processing', 'sentiment_analysis', 'advanced_metrics_calculation', 
          'time_based_metrics', 'metrics_aggregation', 'content_analysis'
        ],
        maxConcurrentTasks: 3,
        memoryLimit: 50 * 1024 * 1024, // 50MB
        preferredTaskTypes: ['date_filter', 'date_range_filter', 'dream_metrics_processing']
      }
    });
  }

  sendTaskResult(taskId, result) {
    self.postMessage({
      id: taskId,
      type: 'TASK_RESULTS',
      timestamp: Date.now(),
      data: result
    });
  }

  sendTaskError(taskId, error) {
    self.postMessage({
      id: taskId,
      type: 'TASK_ERROR',
      timestamp: Date.now(),
      data: { taskId, error }
    });
  }

  sendError(messageId, error) {
    self.postMessage({
      id: messageId,
      type: 'TASK_ERROR',
      timestamp: Date.now(),
      data: { error }
    });
  }
}

// Initialize the worker
try {
  new UniversalWorker();
} catch (error) {
  self.postMessage({
    id: 'fatal-error',
    type: 'WORKER_LOG',
    timestamp: Date.now(),
    data: {
      level: 'error',
      category: 'Worker',
      message: 'Fatal worker initialization error: ' + error.message,
      context: { error: error.stack || error.toString() },
      workerId: 'unknown'
    }
  });
}

} catch (globalError) {
  self.postMessage({
    id: 'global-error',
    type: 'WORKER_LOG',
    timestamp: Date.now(),
    data: {
      level: 'error',
      category: 'Worker',
      message: 'Global worker script error: ' + globalError.message,
      context: { error: globalError.stack || globalError.toString() },
      workerId: 'unknown'
    }
  });
}
    `;
  }

  // Get pool statistics
  getStatistics(): PoolStatistics {
    return { ...this.stats };
  }

  // Get worker information
  getWorkerInfo(): Array<{
    id: string;
    isHealthy: boolean;
    activeTasks: number;
    supportedTasks: UniversalTaskType[];
    taskHistory: any;
  }> {
    return Array.from(this.workers.values()).map(worker => ({
      id: worker.id,
      isHealthy: worker.isHealthy,
      activeTasks: worker.activeTasks.size,
      supportedTasks: worker.capabilities.supportedTasks,
      taskHistory: worker.taskHistory
    }));
  }

  // Dispose of the pool
  dispose(): void {
    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    if (this.queueProcessingInterval) {
      clearInterval(this.queueProcessingInterval);
    }

    // Terminate all workers
    for (const [, poolWorker] of this.workers) {
      poolWorker.worker.terminate();
    }

    // Clear all maps
    this.workers.clear();
    this.activeRequests.clear();
    this.taskQueue.length = 0;

    this.logger.info('Disposal', 'Universal Worker Pool disposed', {
      workersTerminated: this.stats.totalWorkers,
      tasksCompleted: this.stats.completedTasks
    });
  }
} 
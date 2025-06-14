// Universal Worker Pool
// Manages multiple workers and routes tasks intelligently based on type and load

import { App } from 'obsidian';
import { getLogger } from '../logging';
import type { ContextualLogger } from '../logging';
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
  failureCount: number;
  lastFailureTime: number;
  circuitBreakerOpen: boolean;
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
  private logger: ContextualLogger = getLogger('UniversalWorkerPool') as ContextualLogger;
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
    this.logger.trace('Constructor', 'UniversalWorkerPool constructor START', {
      timestamp: Date.now(),
      maxWorkers: config.maxWorkers,
      workerTypes: Object.keys(config.workerTypes),
      loadBalancing: config.loadBalancing
    });
    
    this.logger.info('Initialization', 'UniversalWorkerPool constructor called', {
      maxWorkers: config.maxWorkers,
      workerTypes: Object.keys(config.workerTypes),
      loadBalancing: config.loadBalancing
    });
    
    this.logger.trace('Constructor', 'Initial logger.info completed', { timestamp: Date.now() });
    
    try {
      this.logger.trace('Constructor', 'About to initialize load balancer', { timestamp: Date.now() });
      this.logger.trace('Initialization', 'Initializing load balancer');
      this.initializeLoadBalancer();
      this.logger.trace('Constructor', 'Load balancer initialized', { timestamp: Date.now() });
      this.logger.trace('Initialization', 'Load balancer initialized successfully');
      
      this.logger.trace('Constructor', 'About to initialize worker pool', { timestamp: Date.now() });
      this.logger.trace('Initialization', 'Initializing worker pool');
      this.initializeWorkerPool();
      this.logger.trace('Constructor', 'Worker pool initialized', { timestamp: Date.now() });
      this.logger.trace('Initialization', 'Worker pool initialized successfully');
      
      this.logger.trace('Constructor', 'About to start health checking', { timestamp: Date.now() });
      this.logger.trace('Initialization', 'Starting health checking');
      this.startHealthChecking();
      this.logger.trace('Constructor', 'Health checking started', { timestamp: Date.now() });
      this.logger.trace('Initialization', 'Health checking started successfully');
      
      this.logger.trace('Constructor', 'About to start queue processing', { timestamp: Date.now() });
      this.logger.trace('Initialization', 'Starting queue processing');
      this.startQueueProcessing();
      this.logger.trace('Constructor', 'Queue processing started', { timestamp: Date.now() });
      this.logger.trace('Initialization', 'Queue processing started successfully');
      
      this.logger.info('Initialization', 'Universal Worker Pool initialized successfully', {
        workersCreated: this.workers.size,
        healthCheckInterval: 30000,
        loadBalancerType: config.loadBalancing
      });
    } catch (error) {
      this.logger.error('Initialization', 'Failed to initialize UniversalWorkerPool', error as Error);
      throw error;
    }
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
    this.logger.trace('WorkerPool', 'initializeWorkerPool START', { timestamp: Date.now() });
    const workerCount = Math.min(this.config.maxWorkers, 4); // Cap at 4 workers
    this.logger.trace('WorkerPool', 'Worker count calculated', { 
      workerCount, 
      maxWorkers: this.config.maxWorkers,
      timestamp: Date.now() 
    });
    
    for (let i = 0; i < workerCount; i++) {
      this.logger.trace('WorkerPool', `About to create worker ${i + 1}`, { 
        workerIndex: i + 1,
        workerId: `worker-${i + 1}`,
        timestamp: Date.now() 
      });
      this.createWorker(`worker-${i + 1}`);
      this.logger.trace('WorkerPool', `Worker ${i + 1} created`, { 
        workerIndex: i + 1,
        workerId: `worker-${i + 1}`,
        timestamp: Date.now() 
      });
    }

    this.logger.trace('WorkerPool', 'About to update statistics', { timestamp: Date.now() });
    this.updateStatistics();
    this.logger.trace('WorkerPool', 'initializeWorkerPool COMPLETE', { timestamp: Date.now() });
  }

  // Create a new worker instance
  private createWorker(workerId: string): void {
    this.logger.trace('CreateWorker', 'createWorker START', { 
      workerId, 
      timestamp: Date.now() 
    });
    const startTime = performance.now();
    
    try {
      this.logger.trace('Worker', `Creating worker: ${workerId}`);
      
      // Validate worker script before creating worker
      this.logger.trace('CreateWorker', 'About to validate worker script', { 
        workerId, 
        timestamp: Date.now() 
      });
      this.logger.trace('Worker', `Validating worker script for: ${workerId}`);
      const script = this.getUniversalWorkerScript();
      this.logger.trace('CreateWorker', 'Worker script obtained', { 
        workerId, 
        scriptLength: script.length,
        timestamp: Date.now() 
      });
      this.validateWorkerScript(script, workerId);
      this.logger.trace('CreateWorker', 'Worker script validated', { 
        workerId, 
        timestamp: Date.now() 
      });
      this.logger.trace('Worker', `Worker script validation passed for: ${workerId}`);
      
      // Create the worker
      this.logger.trace('CreateWorker', 'About to create Worker instance', { 
        workerId, 
        timestamp: Date.now() 
      });
      this.logger.trace('Worker', `Creating Worker instance for: ${workerId}`);
      const worker = new Worker(URL.createObjectURL(new Blob([script], { type: 'application/javascript' })));
      this.logger.trace('CreateWorker', 'Worker instance created', { 
        workerId, 
        timestamp: Date.now() 
      });
      this.logger.trace('Worker', `Worker instance created successfully for: ${workerId}`);
      
      const poolWorker: PoolWorker = {
        id: workerId,
        worker,
        capabilities: {
          workerId,
          supportedTasks: [
            UniversalTaskType.DREAM_METRICS_PROCESSING,
            UniversalTaskType.SENTIMENT_ANALYSIS,
            UniversalTaskType.ADVANCED_METRICS_CALCULATION,
            UniversalTaskType.TIME_BASED_METRICS
          ],
          maxConcurrentTasks: 3,
          memoryLimit: 64 * 1024 * 1024, // 64MB per worker
          preferredTaskTypes: [UniversalTaskType.DREAM_METRICS_PROCESSING]
        },
        activeTasks: new Map(),
        isHealthy: true,
        lastHealthCheck: Date.now(),
        createdAt: Date.now(),
        taskHistory: {
          completed: 0,
          failed: 0,
          avgTime: 0
        },
        failureCount: 0,
        lastFailureTime: 0,
        circuitBreakerOpen: false
      };

      this.workers.set(workerId, poolWorker);
      this.logger.trace('Worker', `Worker added to pool: ${workerId}`);
      
      // Setup event handlers
      this.logger.trace('Worker', `Setting up event handlers for: ${workerId}`);
      this.setupWorkerEventHandlers(poolWorker);
      this.logger.trace('Worker', `Event handlers setup complete for: ${workerId}`);
      
      const creationTime = performance.now() - startTime;
      this.logger.info('Worker', `Created worker: ${workerId}`, {
        workerId,
        creationTime: `${creationTime.toFixed(2)}ms`,
        scriptLength: script.length,
        supportedTasks: poolWorker.capabilities.supportedTasks,
        maxConcurrentTasks: poolWorker.capabilities.maxConcurrentTasks
      });
      
    } catch (error) {
      const creationTime = performance.now() - startTime;
      this.logger.error('Worker', `Failed to create worker: ${workerId}`, {
        workerId,
        error: (error as Error).message,
        errorStack: (error as Error).stack,
        creationTime: `${creationTime.toFixed(2)}ms`
      });
      throw error;
    }
  }

  // Setup event handlers for a worker
  private setupWorkerEventHandlers(poolWorker: PoolWorker): void {
    const { worker, id: workerId } = poolWorker;

    worker.onmessage = (event) => {
      const message = event.data;
      this.handleWorkerMessage(workerId, message);
    };

    worker.onerror = (error) => {
      const workerAge = Date.now() - poolWorker.createdAt;
      const isImmediateFailure = workerAge < 1000;
      
      this.logger.error('Worker', `Worker error: ${workerId}`, {
        workerId,
        error: error.message,
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
        errorType: error.type,
        timestamp: Date.now(),
        workerAge,
        isImmediateFailure,
        failureCount: poolWorker.failureCount,
        activeTasks: poolWorker.activeTasks.size
      });
      
      // Enhanced debugging for immediate failures
      if (isImmediateFailure) {
        const script = this.getUniversalWorkerScript();
        this.logger.error('Worker', `Worker failed immediately after creation - potential script issues`, {
          workerId,
          workerAge,
          scriptLength: script.length,
          scriptLines: script.split('\n').length,
          scriptPreview: script.substring(0, 300) + '...',
          errorLocation: error.lineno ? `Line ${error.lineno}${error.colno ? `, Column ${error.colno}` : ''}` : 'Unknown'
        });
      }
      
      this.handleWorkerFailure(workerId);
    };

    worker.onmessageerror = (error) => {
      this.logger.error('Worker', `Worker message error: ${workerId}`, {
        workerId,
        error: error.type,
        workerAge: Date.now() - poolWorker.createdAt,
        activeTasks: poolWorker.activeTasks.size
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
    this.logger.trace('ProcessTask', 'processTask START', {
      taskId: task.taskId,
      taskType: task.taskType,
      priority: task.priority,
      timestamp: Date.now()
    });

    return new Promise((resolve, reject) => {
      this.logger.trace('ProcessTask', 'Storing active request', {
        taskId: task.taskId,
        timestamp: Date.now()
      });

      // Store the request
      this.activeRequests.set(task.taskId, {
        resolve,
        reject,
        callbacks,
        startTime: Date.now()
      });

      this.logger.trace('ProcessTask', 'Adding task to queue', {
        taskId: task.taskId,
        currentQueueLength: this.taskQueue.length,
        timestamp: Date.now()
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

      this.logger.trace('ProcessTask', 'About to call processQueue', {
        taskId: task.taskId,
        queueDepth: this.taskQueue.length,
        timestamp: Date.now()
      });

      // Try to process immediately
      this.processQueue();

      this.logger.trace('ProcessTask', 'processQueue call completed', {
        taskId: task.taskId,
        queueDepth: this.taskQueue.length,
        timestamp: Date.now()
      });
    });
  }

  // Process the task queue
  private processQueue(): void {
    this.logger.trace('ProcessQueue', 'processQueue START', {
      queueLength: this.taskQueue.length,
      timestamp: Date.now()
    });
    
    if (this.taskQueue.length === 0) {
      this.logger.trace('ProcessQueue', 'Queue is empty, returning', { timestamp: Date.now() });
      return;
    }

    this.logger.trace('ProcessQueue', 'About to sort queue by priority', {
      queueLength: this.taskQueue.length,
      timestamp: Date.now()
    });

    // Sort queue by priority (high -> normal -> low) and queue time
    this.taskQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.task.priority] - priorityOrder[a.task.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.queuedAt - b.queuedAt; // Earlier tasks first
    });

    this.logger.trace('ProcessQueue', 'Queue sorted, getting available workers', {
      queueLength: this.taskQueue.length,
      totalWorkers: this.workers.size,
      timestamp: Date.now()
    });

    // Try to assign tasks to available workers
    const availableWorkers = Array.from(this.workers.values()).filter(worker => 
      worker.isHealthy && 
      worker.activeTasks.size < worker.capabilities.maxConcurrentTasks
    );

    this.logger.trace('ProcessQueue', 'Available workers identified', {
      totalWorkers: this.workers.size,
      availableWorkers: availableWorkers.length,
      availableWorkerIds: availableWorkers.map(w => w.id),
      workerDetails: availableWorkers.map(w => ({
        id: w.id,
        isHealthy: w.isHealthy,
        activeTasks: w.activeTasks.size,
        maxConcurrentTasks: w.capabilities.maxConcurrentTasks,
        supportedTasks: w.capabilities.supportedTasks
      })),
      timestamp: Date.now()
    });

    let processed = 0;
    for (let i = 0; i < this.taskQueue.length && processed < availableWorkers.length; i++) {
      const queueItem = this.taskQueue[i];
      const { task } = queueItem;

      this.logger.trace('ProcessQueue', `Processing task ${i + 1}/${this.taskQueue.length}`, {
        taskId: task.taskId,
        taskType: task.taskType,
        taskPriority: task.priority,
        queuedAt: queueItem.queuedAt,
        attempts: queueItem.attempts,
        timestamp: Date.now()
      });

      // Find workers that support this task type
      const compatibleWorkers = availableWorkers.filter(worker =>
        worker.capabilities.supportedTasks.includes(task.taskType) &&
        worker.activeTasks.size < worker.capabilities.maxConcurrentTasks
      );

      this.logger.trace('ProcessQueue', 'Compatible workers found', {
        taskId: task.taskId,
        taskType: task.taskType,
        compatibleWorkers: compatibleWorkers.length,
        compatibleWorkerIds: compatibleWorkers.map(w => w.id),
        allWorkerCapabilities: availableWorkers.map(w => ({
          id: w.id,
          supportedTasks: w.capabilities.supportedTasks,
          supportsThisTask: w.capabilities.supportedTasks.includes(task.taskType)
        })),
        timestamp: Date.now()
      });

      if (compatibleWorkers.length === 0) {
        this.logger.trace('ProcessQueue', 'No compatible workers, skipping task', {
          taskId: task.taskId,
          taskType: task.taskType,
          timestamp: Date.now()
        });
        continue;
      }

      this.logger.trace('ProcessQueue', 'About to select worker using load balancer', {
        taskId: task.taskId,
        compatibleWorkers: compatibleWorkers.length,
        loadBalancerType: this.config.loadBalancing,
        timestamp: Date.now()
      });

      // Select the best worker using load balancer
      const selectedWorker = this.loadBalancer.selectWorker(compatibleWorkers, task);
      
      this.logger.trace('ProcessQueue', 'Load balancer worker selection result', {
        taskId: task.taskId,
        selectedWorkerId: selectedWorker?.id || null,
        selectionSuccessful: !!selectedWorker,
        timestamp: Date.now()
      });
      
      if (!selectedWorker) {
        this.logger.trace('ProcessQueue', 'Load balancer returned null, skipping task', {
          taskId: task.taskId,
          timestamp: Date.now()
        });
        continue;
      }

      this.logger.trace('ProcessQueue', 'About to assign task to worker', {
        taskId: task.taskId,
        selectedWorkerId: selectedWorker.id,
        timestamp: Date.now()
      });

      // Assign task to worker
      this.assignTaskToWorker(selectedWorker, task);
      
      this.logger.trace('ProcessQueue', 'Task assigned, removing from queue', {
        taskId: task.taskId,
        selectedWorkerId: selectedWorker.id,
        queueIndexToRemove: i,
        timestamp: Date.now()
      });
      
      // Remove from queue
      this.taskQueue.splice(i, 1);
      i--; // Adjust index since we removed an item
      processed++;
      
      this.logger.trace('ProcessQueue', 'Task processing iteration complete', {
        taskId: task.taskId,
        selectedWorkerId: selectedWorker.id,
        processed: processed,
        remainingQueueLength: this.taskQueue.length,
        timestamp: Date.now()
      });
    }

    this.logger.trace('ProcessQueue', 'processQueue COMPLETE', {
      tasksProcessed: processed,
      remainingQueueLength: this.taskQueue.length,
      finalQueueDepth: this.taskQueue.length,
      timestamp: Date.now()
    });

    this.stats.queueDepth = this.taskQueue.length;
    this.updateStatistics();
  }

  // Assign a task to a specific worker
  private assignTaskToWorker(worker: PoolWorker, task: UniversalTask): void {
    this.logger.trace('AssignTask', 'assignTaskToWorker START', {
      taskId: task.taskId,
      taskType: task.taskType,
      workerId: worker.id,
      workerActiveTasks: worker.activeTasks.size,
      workerMaxConcurrent: worker.capabilities.maxConcurrentTasks,
      workerIsHealthy: worker.isHealthy,
      timestamp: Date.now()
    });

    this.logger.trace('AssignTask', 'Adding task to worker active tasks', {
      taskId: task.taskId,
      workerId: worker.id,
      beforeActiveTasksCount: worker.activeTasks.size,
      timestamp: Date.now()
    });

    worker.activeTasks.set(task.taskId, task);

    this.logger.trace('AssignTask', 'Task added to active tasks, about to post message', {
      taskId: task.taskId,
      workerId: worker.id,
      afterActiveTasksCount: worker.activeTasks.size,
      messageType: 'PROCESS_TASK',
      protocolVersion: CURRENT_PROTOCOL_VERSION,
      timestamp: Date.now()
    });

    worker.worker.postMessage({
      id: task.taskId,
      type: 'PROCESS_TASK',
      timestamp: Date.now(),
      protocolVersion: CURRENT_PROTOCOL_VERSION,
      data: { task }
    });

    this.logger.trace('AssignTask', 'Message posted to worker', {
      taskId: task.taskId,
      workerId: worker.id,
      messagePosted: true,
      timestamp: Date.now()
    });

    this.logger.info('Task', `Task assigned to worker`, {
      taskId: task.taskId,
      taskType: task.taskType,
      workerId: worker.id,
      activeTasks: worker.activeTasks.size
    });

    this.logger.trace('AssignTask', 'assignTaskToWorker COMPLETE', {
      taskId: task.taskId,
      workerId: worker.id,
      finalActiveTasksCount: worker.activeTasks.size,
      timestamp: Date.now()
    });
  }

  // Handle worker failure
  private handleWorkerFailure(workerId: string): void {
    const poolWorker = this.workers.get(workerId);
    if (!poolWorker) return;

    poolWorker.isHealthy = false;
    poolWorker.failureCount++;
    poolWorker.lastFailureTime = Date.now();
    
    // Circuit breaker logic - stop recreating if too many failures
    const FAILURE_THRESHOLD = 5;
    const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
    
    // Enhanced circuit breaker logging
    this.logger.trace('Worker', `Worker failure detected`, {
      workerId,
      failureCount: poolWorker.failureCount,
      failureThreshold: FAILURE_THRESHOLD,
      timeSinceCreation: Date.now() - poolWorker.createdAt,
      timeSinceLastFailure: poolWorker.lastFailureTime > 0 ? Date.now() - poolWorker.lastFailureTime : 0,
      activeTasks: poolWorker.activeTasks.size,
      taskHistory: poolWorker.taskHistory,
      circuitBreakerCurrentlyOpen: poolWorker.circuitBreakerOpen
    });
    
    if (poolWorker.failureCount >= FAILURE_THRESHOLD) {
      poolWorker.circuitBreakerOpen = true;
      this.logger.error('Worker', `Circuit breaker opened for worker: ${workerId}`, {
        workerId,
        failureCount: poolWorker.failureCount,
        failureThreshold: FAILURE_THRESHOLD,
        activeTasks: poolWorker.activeTasks.size,
        workerAge: Date.now() - poolWorker.createdAt,
        circuitBreakerTimeout: CIRCUIT_BREAKER_TIMEOUT,
        taskHistory: poolWorker.taskHistory,
        failurePattern: {
          averageTimeBetweenFailures: poolWorker.failureCount > 1 ? 
            (Date.now() - poolWorker.createdAt) / poolWorker.failureCount : 0,
          immediateFailure: (Date.now() - poolWorker.createdAt) < 1000
        }
      });
    }
    
    this.logger.warn('Worker', `Worker marked as unhealthy: ${workerId}`, {
      workerId,
      activeTasks: poolWorker.activeTasks.size,
      failureCount: poolWorker.failureCount,
      circuitBreakerOpen: poolWorker.circuitBreakerOpen,
      willRecreate: !poolWorker.circuitBreakerOpen
    });

    // Requeue active tasks
    for (const [taskId, task] of poolWorker.activeTasks) {
      this.logger.info('Task', `Requeuing task due to worker failure`, {
        taskId,
        taskType: task.taskType,
        failedWorkerId: workerId,
        queuedAt: Date.now()
      });

      this.taskQueue.unshift({
        task,
        callbacks: this.activeRequests.get(taskId)?.callbacks,
        queuedAt: Date.now(),
        attempts: 1
      });
    }

    poolWorker.activeTasks.clear();
    
    // Only recreate worker if circuit breaker is not open
    if (!poolWorker.circuitBreakerOpen) {
      this.logger.trace('Worker', `Attempting worker recreation`, {
        workerId,
        failureCount: poolWorker.failureCount,
        reason: 'circuit_breaker_closed'
      });
      this.recreateWorker(workerId);
    } else {
      // Schedule circuit breaker reset
      this.logger.info('Worker', `Scheduling circuit breaker reset`, {
        workerId,
        failureCount: poolWorker.failureCount,
        resetTimeout: CIRCUIT_BREAKER_TIMEOUT,
        resetTime: new Date(Date.now() + CIRCUIT_BREAKER_TIMEOUT).toISOString()
      });
      
      setTimeout(() => {
        if (poolWorker.circuitBreakerOpen) {
          this.logger.info('Worker', `Attempting to reset circuit breaker for worker: ${workerId}`, {
            workerId,
            failureCount: poolWorker.failureCount,
            timeInOpenState: Date.now() - poolWorker.lastFailureTime,
            resetAttempt: true
          });
          poolWorker.circuitBreakerOpen = false;
          poolWorker.failureCount = 0;
          this.recreateWorker(workerId);
        }
      }, CIRCUIT_BREAKER_TIMEOUT);
    }
    
    // Process queue to reassign tasks
    this.processQueue();
  }

  // Recreate a failed worker
  private recreateWorker(workerId: string): void {
    const startTime = performance.now();
    
    try {
      const oldWorker = this.workers.get(workerId);
      const hadOldWorker = !!oldWorker;
      const oldWorkerAge = oldWorker ? Date.now() - oldWorker.createdAt : 0;
      const oldFailureCount = oldWorker ? oldWorker.failureCount : 0;
      
      if (oldWorker) {
        this.logger.trace('Worker', `Terminating old worker before recreation`, {
          workerId,
          oldWorkerAge,
          oldFailureCount,
          activeTasks: oldWorker.activeTasks.size
        });
        
        oldWorker.worker.terminate();
        this.workers.delete(workerId);
      }

      // Create new worker with same ID
      this.createWorker(workerId);
      
      const recreationTime = performance.now() - startTime;
      
      this.logger.info('Worker', `Worker recreated: ${workerId}`, { 
        workerId,
        hadOldWorker,
        oldWorkerAge: hadOldWorker ? oldWorkerAge : undefined,
        oldFailureCount: hadOldWorker ? oldFailureCount : undefined,
        recreationTime: `${recreationTime.toFixed(2)}ms`,
        newWorkerCreated: this.workers.has(workerId)
      });
    } catch (error) {
      const recreationTime = performance.now() - startTime;
      
      this.logger.error('Worker', `Failed to recreate worker: ${workerId}`,
        this.logger.enrichError(error as Error, {
          component: 'UniversalWorkerPool',
          operation: 'recreateWorker',
          metadata: { 
            workerId,
            recreationTime: `${recreationTime.toFixed(2)}ms`,
            workerExists: this.workers.has(workerId)
          }
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

  // Validate worker script for basic syntax issues
  private validateWorkerScript(script: string, workerId: string): void {
    const startTime = performance.now();
    
    try {
      // Basic validation checks
      if (!script || script.trim().length === 0) {
        throw new Error('Worker script is empty');
      }
      
      const scriptSize = script.length;
      const scriptLines = script.split('\n').length;
      
      if (scriptSize > 1024 * 1024) { // 1MB limit
        throw new Error(`Worker script too large: ${scriptSize} bytes (limit: 1MB)`);
      }
      
      // Enhanced syntax validation
      try {
        new Function(script);
      } catch (syntaxError) {
        throw new Error(`Syntax error in worker script: ${(syntaxError as Error).message}`);
      }
      
      // Additional validation checks
      const validationResults = {
        hasMessageHandler: script.includes('onmessage') || script.includes('addEventListener'),
        hasErrorHandler: script.includes('onerror') || script.includes('error'),
        hasPostMessage: script.includes('postMessage'),
        hasClassDefinition: script.includes('class '),
        hasSelfReference: script.includes('self.'),
        scriptComplexity: this.calculateScriptComplexity(script)
      };
      
      const validationTime = performance.now() - startTime;
      
      this.logger.debug('Worker', `Worker script validation passed for ${workerId}`, {
        workerId,
        scriptLength: scriptSize,
        scriptLines,
        validationTime: `${validationTime.toFixed(2)}ms`,
        validation: validationResults,
        scriptPreview: script.substring(0, 200) + (script.length > 200 ? '...' : '')
      });
      
      // Log warnings for potential issues
      if (!validationResults.hasMessageHandler) {
        this.logger.warn('Worker', `Worker script may be missing message handler`, {
          workerId,
          issue: 'missing_message_handler'
        });
      }
      
      if (validationResults.scriptComplexity > 0.8) {
        this.logger.warn('Worker', `Worker script complexity is high`, {
          workerId,
          complexity: validationResults.scriptComplexity,
          recommendation: 'consider_simplification'
        });
      }
      
    } catch (error) {
      const validationTime = performance.now() - startTime;
      
      this.logger.error('Worker', `Worker script validation failed for ${workerId}`, {
        workerId,
        error: (error as Error).message,
        scriptLength: script.length,
        scriptLines: script.split('\n').length,
        validationTime: `${validationTime.toFixed(2)}ms`,
        scriptPreview: script.substring(0, 500) + (script.length > 500 ? '...' : ''),
        errorType: 'validation_failure'
      });
      throw new Error(`Worker script validation failed: ${(error as Error).message}`);
    }
  }

  // Calculate script complexity score (0-1, where 1 is most complex)
  private calculateScriptComplexity(script: string): number {
    const metrics = {
      lines: script.split('\n').length,
      functions: (script.match(/function\s+\w+/g) || []).length,
      classes: (script.match(/class\s+\w+/g) || []).length,
      loops: (script.match(/\b(for|while|do)\s*\(/g) || []).length,
      conditionals: (script.match(/\b(if|switch|case)\s*\(/g) || []).length,
      tryBlocks: (script.match(/\btry\s*\{/g) || []).length,
      callbacks: (script.match(/\w+\s*=>\s*\{/g) || []).length
    };
    
    // Weighted complexity calculation
    const complexity = (
      metrics.lines * 0.001 +
      metrics.functions * 0.1 +
      metrics.classes * 0.15 +
      metrics.loops * 0.2 +
      metrics.conditionals * 0.1 +
      metrics.tryBlocks * 0.15 +
      metrics.callbacks * 0.05
    ) / 10; // Normalize to 0-1 range
    
    return Math.min(complexity, 1);
  }

  // Generate simplified worker script for testing
  private getSimplifiedWorkerScript(): string {
    return `
// Simplified Universal Worker Script
// Minimal implementation to test worker creation

class UniversalWorker {
  constructor() {
    this.workerId = 'universal-' + Math.random().toString(36).substr(2, 9);
    this.setupMessageHandlers();
  }

  setupMessageHandlers() {
    self.onmessage = (event) => {
      const message = event.data;
      
      try {
        switch (message.type) {
          case 'WORKER_HEALTH_CHECK':
            this.handleHealthCheck(message);
            break;
          case 'WORKER_CAPABILITIES':
            this.sendCapabilities(message);
            break;
          case 'PROCESS_TASK':
            // For now, just return success for all tasks
            this.sendTaskResult(message.data.task.taskId, {
              taskId: message.data.task.taskId,
              taskType: message.data.task.taskType,
              success: true,
              data: { message: 'Simplified worker - task not implemented' },
              metadata: { processingTime: 1, workerPool: 'simplified' }
            });
            break;
          default:
            this.sendError(message.id, 'Unknown message type: ' + message.type);
        }
      } catch (error) {
        this.sendError(message.id, error.message);
      }
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
          'dream_metrics_processing',
          'sentiment_analysis', 
          'advanced_metrics_calculation',
          'time_based_metrics',
          'date_filter', 
          'metrics_calculation'
        ],
        maxConcurrentTasks: 3,
        memoryLimit: 64 * 1024 * 1024, // 64MB
        preferredTaskTypes: ['dream_metrics_processing']
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
new UniversalWorker();
    `;
  }

  // Generate universal worker script
  private getUniversalWorkerScript(): string {
    // Use full worker script with all task processors
    // return this.getSimplifiedWorkerScript();
    
    return `
// Universal Worker Script
// Handles multiple task types in a single worker

class UniversalWorker {
  constructor() {
    this.workerId = 'universal-' + Math.random().toString(36).substr(2, 9);
    this.setupMessageHandlers();
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
        if (options?.enableAdvancedMetrics) {
          const advanced = this.calculateAdvancedMetricsWorker(entry.content || '');
          Object.assign(calculatedMetrics, advanced);
          statistics.calculationsPerformed.advanced++;
        }

        processedEntries.push({
          ...entry,
          calculatedMetrics,
          sentimentScore,
          advancedMetrics: options?.enableAdvancedMetrics ? this.calculateAdvancedMetricsWorker(entry.content || '') : undefined
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
    // Basic sentiment analysis
    const positiveWords = ['happy', 'joy', 'love', 'peaceful', 'beautiful', 'wonderful', 'amazing', 'good', 'great', 'excellent', 'pleasant', 'delight', 'calm', 'safe', 'clarity', 'flying', 'float', 'success', 'achieve', 'accomplish'];
    const negativeWords = ['sad', 'fear', 'anxious', 'angry', 'terrified', 'nightmare', 'falling', 'chase', 'dark', 'scary', 'bad', 'awful', 'terrible', 'horror', 'trapped', 'confused', 'lost', 'danger', 'threat', 'panic', 'death'];
    
    const lowerContent = content.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
          positiveWords.forEach(word => {
        const regex = new RegExp('\\b' + word + '\\b', 'g');
      const matches = lowerContent.match(regex);
      if (matches) positiveCount += matches.length;
    });
    
    negativeWords.forEach(word => {
      const regex = new RegExp('\\\\b' + word + '\\\\b', 'g');
      const matches = lowerContent.match(regex);
      if (matches) negativeCount += matches.length;
    });
    
    if (positiveCount === 0 && negativeCount === 0) return 0;
    
    const total = positiveCount + negativeCount;
    return Math.round(((positiveCount - negativeCount) / total) * 100) / 100;
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
    const metrics = {};
    
    const wordCount = content.trim().split(/\s+/).length;
    metrics['Words'] = wordCount;
    
    const sentenceCount = (content.match(/[.!?]+\s/g) || []).length + 1;
    metrics['Sentences'] = sentenceCount;
    
    if (sentenceCount > 0) {
      metrics['Words per Sentence'] = Math.round((wordCount / sentenceCount) * 10) / 10;
    }
    
    metrics['Characters'] = content.replace(/\s/g, '').length;
    
    // Additional metrics
    const paragraphCount = content.split(/\n\s*\n/).length;
    metrics['Paragraphs'] = paragraphCount;
    
    return metrics;
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
new UniversalWorker();
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
    for (const [workerId, poolWorker] of this.workers) {
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
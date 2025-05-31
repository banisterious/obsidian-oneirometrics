// TypeScript-First Worker Manager
// Provides type-safe communication with web workers

import { App } from 'obsidian';
import { getLogger } from '../logging';
import type { ILogger } from '../logging';
import { 
  WorkerMessage, 
  WorkerMessageTypes, 
  FilterCallbacks, 
  WorkerConfiguration, 
  WorkerError,
  CircuitBreakerState,
  CURRENT_PROTOCOL_VERSION 
} from './types';

// Type-safe worker manager with full generic typing
export abstract class TypedWorkerManager<T extends WorkerMessageTypes> {
  protected logger: ILogger = getLogger('TypedWorkerManager');
  protected worker: Worker | null = null;
  protected workerSupported = true;
  protected isWorkerActive = false;
  
  protected activeRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: any) => void;
    startTime: number;
    operation: string;
  }>();

  constructor(protected app: App, protected workerScript?: string) {
    this.checkWorkerSupport();
  }

  // Feature detection for worker support
  private checkWorkerSupport(): boolean {
    if (typeof Worker === 'undefined') {
      this.logger.info('WorkerSupport', 'Web Workers not supported in this environment');
      this.workerSupported = false;
      return false;
    }
    
    try {
      // Attempt to create a minimal test worker to verify support
      const testWorker = new Worker(
        URL.createObjectURL(new Blob(['self.onmessage = () => self.postMessage("test")'], 
        { type: 'text/javascript' }))
      );
      
      // Clean up test worker
      testWorker.terminate();
      this.workerSupported = true;
      return true;
    } catch (e) {
      this.logger.warn('WorkerSupport', 'Web Worker creation failed, using fallback mode', { error: (e as Error).message });
      this.workerSupported = false;
      return false;
    }
  }

  // Performance timing implementation
  private performanceTimer(operation: string): () => void {
    const startTime = performance.now();
    this.logger.debug('Performance', `Starting ${operation}`, { operation, startTime });
    
    return () => {
      const duration = performance.now() - startTime;
      this.logger.info('Performance', `Completed ${operation}`, { 
        operation, 
        duration: `${duration.toFixed(2)}ms`,
        startTime,
        endTime: performance.now()
      });
    };
  }

  // Initialize worker with error handling
  protected initWorker(): void {
    if (!this.workerSupported) {
      this.logger.info('Initialization', 'Skipping worker initialization - not supported');
      return;
    }

    const endTimer = this.performanceTimer('worker.initialization');
    
    try {
      // For Phase 1, we'll use a basic approach - to be enhanced with esbuild plugin later
      if (this.workerScript) {
        this.worker = new Worker(this.workerScript);
      } else {
        // Default worker creation - will be enhanced in later implementation
        this.logger.warn('Initialization', 'No worker script provided');
        this.workerSupported = false;
        return;
      }
      
      this.setupWorkerEventHandlers();
      this.isWorkerActive = true;
      
      // Perform version handshake
      this.performVersionCheck();
      
      this.logger.info('Initialization', 'Worker initialized successfully', {
        workerSupported: true,
        userAgent: navigator.userAgent
      });
    } catch (error) {
      const enrichedError = this.logger.enrichError(error as Error, {
        component: 'TypedWorkerManager',
        operation: 'initWorker',
        metadata: {
          userAgent: navigator.userAgent,
          workerSupported: typeof Worker !== 'undefined'
        }
      });
      
      this.logger.error('Initialization', 'Failed to initialize worker, falling back to main thread', enrichedError);
      this.workerSupported = false;
    } finally {
      endTimer();
    }
  }

  // Version compatibility check
  private performVersionCheck(): void {
    if (!this.worker) return;

    this.worker.postMessage({
      id: 'version-check',
      type: 'VERSION_CHECK',
      timestamp: Date.now(),
      protocolVersion: CURRENT_PROTOCOL_VERSION,
      data: { protocolVersion: CURRENT_PROTOCOL_VERSION }
    });
  }

  // Setup worker event handlers
  private setupWorkerEventHandlers(): void {
    if (!this.worker) return;
    
    this.worker.onmessage = (e) => {
      const message = e.data as WorkerMessage;
      
      // Handle worker log messages
      if (message.type === 'WORKER_LOG') {
        this.handleWorkerLog(message);
        return;
      }

      // Handle version check responses
      if (message.type === 'VERSION_CHECK') {
        this.handleVersionCheckResponse(message);
        return;
      }
      
      // Handle other message types with logging
      const requestId = message.data?.requestId || message.id;
      const request = this.activeRequests.get(requestId);
      
      if (!request) {
        this.logger.warn('Message', 'Received response for unknown request', {
          requestId,
          messageType: message.type
        });
        return;
      }
      
      this.logger.debug('Message', `Received ${message.type} response`, {
        requestId,
        messageType: message.type,
        timing: message.data?.timing,
        operation: request.operation
      });
      
      try {
        switch (message.type) {
          case 'FILTER_RESULTS':
            // Check if cancelled
            if (message.data.cancelled) {
              request.reject(new WorkerError('Operation was cancelled', 'CANCELLED'));
            } else {
              request.resolve(message.data.results || message.data);
              this.logger.info('Filter', 'Filter operation completed', {
                requestId,
                operation: request.operation,
                entriesProcessed: message.data.timing?.entriesProcessed,
                processingTime: message.data.timing?.processingTime
              });
            }
            this.activeRequests.delete(requestId);
            break;
            
          case 'FILTER_PROGRESS':
            if (request.onProgress) {
              request.onProgress(message.data);
            }
            break;
            
          case 'FILTER_ERROR':
            const error = new WorkerError(
              message.data.error || 'Unknown worker error',
              'WORKER_ERROR',
              message.data.context
            );
            
            const enrichedError = this.logger.enrichError(error, {
              component: 'Worker',
              operation: request.operation,
              metadata: {
                requestId,
                errorContext: message.data.context
              }
            });
            
            request.reject(enrichedError);
            this.logger.error('Filter', 'Worker filter operation failed', enrichedError);
            this.activeRequests.delete(requestId);
            break;
        }
      } catch (error) {
        this.logger.error('Message', 'Error handling worker message', 
          this.logger.enrichError(error as Error, {
            component: 'TypedWorkerManager',
            operation: 'handleWorkerMessage',
            metadata: { messageType: message.type, requestId }
          })
        );
        request.reject(error as Error);
        this.activeRequests.delete(requestId);
      }
    };
    
    this.worker.onerror = (error) => {
      const enrichedError = this.logger.enrichError(new Error(error.message), {
        component: 'Worker',
        operation: 'runtime',
        metadata: {
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno
        }
      });
      
      this.logger.error('Worker', 'Worker runtime error occurred', enrichedError);
      this.handleWorkerFailure();
    };
  }

  // Handle worker log messages by integrating with main thread logging
  private handleWorkerLog(message: WorkerMessage): void {
    const { level, category, message: logMessage, context, workerId } = message.data;
    
    // Create enriched context for worker logs
    const enrichedContext = {
      workerId,
      workerType: 'date-filter',
      ...context
    };

    // Log with appropriate level using structured logging
    switch (level) {
      case 'debug':
        this.logger.debug(category, `[Worker] ${logMessage}`, enrichedContext);
        break;
      case 'info':
        this.logger.info(category, `[Worker] ${logMessage}`, enrichedContext);
        break;
      case 'warn':
        this.logger.warn(category, `[Worker] ${logMessage}`, enrichedContext);
        break;
      case 'error':
        this.logger.error(category, `[Worker] ${logMessage}`, enrichedContext);
        break;
    }
  }

  // Handle version check responses
  private handleVersionCheckResponse(message: WorkerMessage): void {
    const { supported, workerVersion, requestedVersion } = message.data;
    
    if (!supported) {
      this.logger.warn('Version', 'Worker protocol version mismatch', {
        workerVersion,
        requestedVersion,
        supported
      });
      // Could implement fallback or error handling here
    } else {
      this.logger.debug('Version', 'Worker version check passed', {
        workerVersion,
        requestedVersion
      });
    }
  }

  // Type-safe message sending with compile-time verification
  async sendMessage<K extends keyof T>(
    type: K, 
    data: any,
    options?: {
      onProgress?: (progress: any) => void;
      timeout?: number;
    }
  ): Promise<any> {
    
    if (!this.worker || !this.isWorkerActive) {
      throw new WorkerError('Worker not available', 'WORKER_UNAVAILABLE');
    }
    
    const requestId = this.generateRequestId();
    const message: WorkerMessage = {
      id: requestId,
      type: String(type) as any, // Cast to handle TypeScript strict typing
      timestamp: Date.now(),
      data
    };

    // Type-safe promise with timeout
    return new Promise<any>((resolve, reject) => {
      const timer = options?.timeout ? setTimeout(() => {
        this.activeRequests.delete(requestId);
        const error = new WorkerError(
          `Worker request timeout for ${String(type)}`,
          'TIMEOUT',
          { requestId, messageType: String(type), timeout: options.timeout }
        );
        reject(this.logger.enrichError(error, {
          component: 'TypedWorkerManager',
          operation: 'sendMessage',
          metadata: { requestId, messageType: String(type), timeout: options.timeout }
        }));
      }, options.timeout) : null;

      this.activeRequests.set(requestId, {
        resolve: (response: any) => {
          if (timer) clearTimeout(timer);
          resolve(response);
        },
        reject: (error: Error) => {
          if (timer) clearTimeout(timer);
          reject(error);
        },
        onProgress: options?.onProgress,
        startTime: Date.now(),
        operation: String(type)
      });

      // Send message with structured logging
      this.logger.debug('Message', `Sending ${String(type)} to worker`, {
        requestId,
        messageType: String(type),
        dataSize: JSON.stringify(data).length,
        hasProgressCallback: !!options?.onProgress,
        timeout: options?.timeout
      });

      this.worker!.postMessage(message);
    });
  }

  // Cancel a specific request
  public cancelRequest(requestId: string): void {
    if (this.worker && this.activeRequests.has(requestId)) {
      this.worker.postMessage({
        id: this.generateRequestId(),
        type: 'CANCEL_FILTER',
        timestamp: Date.now(),
        data: { requestId }
      });
      
      this.activeRequests.delete(requestId);
      this.logger.info('Cancel', 'Request cancelled', { requestId });
    }
  }

  // Enhanced error recovery
  protected handleWorkerFailure(): void {
    this.logger.warn('Recovery', 'Web Worker failed, initiating recovery process', {
      activeRequests: this.activeRequests.size,
      workerSupported: this.workerSupported
    });
    
    // Terminate failed worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isWorkerActive = false;
    }
    
    // Reject all pending requests
    this.activeRequests.forEach((request, requestId) => {
      this.logger.debug('Recovery', `Rejecting failed request`, {
        requestId,
        operation: request.operation
      });
      
      request.reject(new WorkerError('Worker failed', 'WORKER_FAILURE'));
    });
    
    this.activeRequests.clear();
    
    // Attempt to reinitialize worker after delay
    setTimeout(() => {
      this.logger.info('Recovery', 'Attempting worker recovery', {
        retryAttempt: 1,
        previousFailure: Date.now()
      });
      this.initWorker();
    }, 5000);
  }

  // Runtime type validation for development
  protected validateMessageType(message: WorkerMessage): void {
    if (!message.id || !message.type || !message.timestamp) {
      this.logger.warn('Validation', 'Invalid message structure', { message });
    }
    
    // Additional validation can be added here
  }

  protected generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Health check for monitoring
  async performHealthCheck(): Promise<boolean> {
    if (!this.worker || !this.isWorkerActive) {
      return false;
    }

    try {
      // Simple version check as health check
      this.performVersionCheck();
      return true;
    } catch (error) {
      this.logger.warn('HealthCheck', 'Worker health check failed', {
        error: (error as Error).message
      });
      return false;
    }
  }

  // Cleanup method
  public dispose(): void {
    this.logger.info('Disposal', 'Disposing TypedWorkerManager');
    
    // Cancel all pending requests
    this.activeRequests.forEach((_, requestId) => {
      this.cancelRequest(requestId);
    });
    
    // Terminate worker thread
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Clear all requests and callbacks
    this.activeRequests.clear();
    this.isWorkerActive = false;
  }
} 
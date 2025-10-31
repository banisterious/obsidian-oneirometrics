/**
 * RetryableRequest - Generic wrapper for API calls that supports retries
 * 
 * Provides a flexible mechanism to add retry capabilities to any asynchronous
 * operation, with support for cancellation, timeout, and cleanup.
 */

import { RetryPolicy, ErrorCategory } from './RetryPolicy';
import safeLogger from '../../logging/safe-logger';
import { withErrorHandling } from '../../utils/defensive-utils';

/**
 * Event types emitted during retry operations
 */
export enum RetryEventType {
  /** Emitted when a retry is attempted */
  RETRY_ATTEMPT = 'retry_attempt',
  
  /** Emitted when all retries are exhausted */
  RETRY_EXHAUSTED = 'retry_exhausted',
  
  /** Emitted when an operation succeeds after retry */
  RETRY_SUCCESS = 'retry_success',
  
  /** Emitted when an operation is aborted */
  RETRY_ABORT = 'retry_abort'
}

/**
 * Configuration options for retryable requests
 */
export interface RetryableRequestOptions {
  /** The retry policy to use */
  policy?: RetryPolicy;
  
  /** Timeout for the entire operation (all retries) in milliseconds */
  totalTimeoutMs?: number;
  
  /** Context information for logging */
  context?: Record<string, any>;
  
  /** Whether to throw errors or return them wrapped in a result object */
  throwErrors?: boolean;
  
  /** Function to call when an operation is retried */
  onRetry?: (attempt: number, error: Error, delayMs: number, context?: Record<string, any>) => void;
  
  /** Function to call when all retries are exhausted */
  onExhausted?: (attempts: number, lastError: Error, context?: Record<string, any>) => void;
  
  /** Function to call for cleanup after each attempt (regardless of success/failure) */
  cleanup?: () => void;
}

/**
 * Default options for retryable requests
 */
const DEFAULT_REQUEST_OPTIONS: RetryableRequestOptions = {
  policy: new RetryPolicy(),
  totalTimeoutMs: 60000,
  throwErrors: true,
  context: {}
};

/**
 * Result of a retryable operation
 */
export interface RetryResult<T> {
  /** The operation result (if successful) */
  data?: T;
  
  /** The error (if failed) */
  error?: Error;
  
  /** Whether the operation succeeded */
  success: boolean;
  
  /** The number of attempts made */
  attempts: number;
  
  /** The total time taken (milliseconds) */
  totalTimeMs: number;
  
  /** Whether the operation was aborted */
  aborted: boolean;
  
  /** Whether the operation timed out */
  timedOut: boolean;
}

/**
 * Status of a retryable operation
 */
interface RetryStatus {
  /** Whether the operation is in progress */
  inProgress: boolean;
  
  /** Whether the operation has been aborted */
  aborted: boolean;
  
  /** The current attempt number (1-based) */
  currentAttempt: number;
  
  /** The start time of the operation */
  startTime: number;

  /** Timeout ID for the total operation timeout */
  totalTimeoutId?: number;

  /** Timeout ID for the current attempt */
  attemptTimeoutId?: number;

  /** The abort controller for the current attempt */
  abortController?: AbortController;
}

/**
 * Event listener for retry events
 */
type RetryEventListener = (eventType: RetryEventType, data: any) => void;

/**
 * Provides a wrapper for API calls that supports retries with policy-based control
 */
export class RetryableRequest {
  /** The options for this request */
  private options: RetryableRequestOptions;
  
  /** Event listeners */
  private listeners: Map<RetryEventType, RetryEventListener[]> = new Map();
  
  /**
   * Creates a new RetryableRequest with the specified options
   * 
   * @param options Configuration options for the request
   */
  constructor(options: RetryableRequestOptions = {}) {
    this.options = {
      ...DEFAULT_REQUEST_OPTIONS,
      ...options
    };
  }
  
  /**
   * Executes an operation with retries according to the policy
   * 
   * @param operation The operation to execute
   * @returns A promise that resolves with the operation result
   */
  execute<T>(operation: (signal?: AbortSignal) => Promise<T>): Promise<T | RetryResult<T>> {
    const status: RetryStatus = {
      inProgress: true,
      aborted: false,
      currentAttempt: 1,
      startTime: Date.now()
    };
    
    // Create a promise that will resolve with the result
    return new Promise<T | RetryResult<T>>((resolve, reject) => {
      // Start the total timeout timer
      if (this.options.totalTimeoutMs) {
        status.totalTimeoutId = window.setTimeout(() => {
          this.abortCurrentAttempt(status);
          
          const timeoutError = new Error(`Operation timed out after ${this.options.totalTimeoutMs}ms`);
          const result: RetryResult<T> = {
            success: false,
            error: timeoutError,
            attempts: status.currentAttempt,
            totalTimeMs: Date.now() - status.startTime,
            aborted: true,
            timedOut: true
          };
          
          this.emitEvent(RetryEventType.RETRY_EXHAUSTED, {
            attempts: status.currentAttempt,
            error: timeoutError,
            context: this.options.context
          });
          
          this.cleanupResources(status);
          
          if (this.options.throwErrors) {
            reject(timeoutError);
          } else {
            resolve(result);
          }
        }, this.options.totalTimeoutMs);
      }
      
      // Start the retry loop
      this.executeWithRetry(operation, status)
        .then((result: RetryResult<T>) => {
          this.cleanupResources(status);
          
          if (result.success) {
            if (this.options.throwErrors) {
              resolve(result.data!);
            } else {
              resolve(result);
            }
          } else {
            if (this.options.throwErrors) {
              reject(result.error);
            } else {
              resolve(result);
            }
          }
        })
        .catch((error) => {
          this.cleanupResources(status);
          reject(error);
        });
    });
  }
  
  /**
   * Aborts the current request and all future retries
   */
  abort(): void {
    safeLogger.debug('RetryableRequest', 'Abort requested by client');
    this.emitEvent(RetryEventType.RETRY_ABORT, {
      context: this.options.context
    });
  }
  
  /**
   * Adds an event listener
   * 
   * @param eventType The event type to listen for
   * @param listener The listener function
   */
  addEventListener(eventType: RetryEventType, listener: RetryEventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    this.listeners.get(eventType)!.push(listener);
  }
  
  /**
   * Removes an event listener
   * 
   * @param eventType The event type to remove the listener from
   * @param listener The listener function to remove
   */
  removeEventListener(eventType: RetryEventType, listener: RetryEventListener): void {
    if (this.listeners.has(eventType)) {
      const listeners = this.listeners.get(eventType)!;
      const index = listeners.indexOf(listener);
      
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Executes an operation with retries according to the policy
   * 
   * @param operation The operation to execute
   * @param status The current retry status
   * @returns A promise that resolves with the retry result
   */
  private executeWithRetry<T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    status: RetryStatus
  ): Promise<RetryResult<T>> {
    return new Promise<RetryResult<T>>((resolve) => {
      // Skip if already aborted
      if (status.aborted) {
        resolve({
          success: false,
          error: new Error('Operation aborted'),
          attempts: status.currentAttempt,
          totalTimeMs: Date.now() - status.startTime,
          aborted: true,
          timedOut: false
        });
        return;
      }
      
      // Create an abort controller for this attempt
      status.abortController = new AbortController();
      
      // Set a timeout for this attempt
      const timeoutMs = this.options.policy?.getTimeoutMs() || 30000;
      status.attemptTimeoutId = window.setTimeout(() => {
        if (status.abortController) {
          status.abortController.abort();
        }
      }, timeoutMs);
      
      // Execute the operation
      operation(status.abortController.signal)
        .then((result) => {
          // Operation succeeded
          clearTimeout(status.attemptTimeoutId);
          
          this.emitEvent(RetryEventType.RETRY_SUCCESS, {
            attempts: status.currentAttempt,
            result,
            context: this.options.context
          });
          
          // Run cleanup function if provided
          if (this.options.cleanup) {
            try {
              this.options.cleanup();
            } catch (cleanupError) {
              safeLogger.error('RetryableRequest', 'Error in cleanup function', cleanupError);
            }
          }
          
          resolve({
            data: result,
            success: true,
            attempts: status.currentAttempt,
            totalTimeMs: Date.now() - status.startTime,
            aborted: false,
            timedOut: false
          });
        })
        .catch((error) => {
          // Operation failed
          clearTimeout(status.attemptTimeoutId);
          
          // Run cleanup function if provided
          if (this.options.cleanup) {
            try {
              this.options.cleanup();
            } catch (cleanupError) {
              safeLogger.error('RetryableRequest', 'Error in cleanup function', cleanupError);
            }
          }
          
          const policy = this.options.policy || DEFAULT_REQUEST_OPTIONS.policy!;
          const shouldRetry = policy.shouldRetry(error, status.currentAttempt);
          
          if (shouldRetry && status.currentAttempt < policy.getMaxAttempts()) {
            // Calculate delay for next attempt
            const delayMs = policy.getNextDelayMs(status.currentAttempt);
            
            // Emit retry event
            this.emitEvent(RetryEventType.RETRY_ATTEMPT, {
              attempt: status.currentAttempt,
              error,
              delayMs,
              context: this.options.context
            });
            
            // Call onRetry callback if provided
            if (this.options.onRetry) {
              try {
                this.options.onRetry(
                  status.currentAttempt,
                  error,
                  delayMs,
                  this.options.context
                );
              } catch (callbackError) {
                safeLogger.error('RetryableRequest', 'Error in onRetry callback', callbackError);
              }
            }
            
            // Log retry attempt
            safeLogger.info(
              'RetryableRequest',
              `Retry attempt ${status.currentAttempt} of ${policy.getMaxAttempts()} after ${delayMs}ms`,
              {
                error: error.message,
                category: this.categorizeError(error),
                context: this.options.context
              }
            );
            
            // Increment attempt counter
            status.currentAttempt++;
            
            // Schedule next attempt
            setTimeout(() => {
              this.executeWithRetry(operation, status)
                .then(resolve)
                .catch((retryError) => {
                  resolve({
                    error: retryError,
                    success: false,
                    attempts: status.currentAttempt,
                    totalTimeMs: Date.now() - status.startTime,
                    aborted: false,
                    timedOut: false
                  });
                });
            }, delayMs);
          } else {
            // No more retries
            this.emitEvent(RetryEventType.RETRY_EXHAUSTED, {
              attempts: status.currentAttempt,
              error,
              context: this.options.context
            });
            
            // Call onExhausted callback if provided
            if (this.options.onExhausted) {
              try {
                this.options.onExhausted(
                  status.currentAttempt,
                  error,
                  this.options.context
                );
              } catch (callbackError) {
                safeLogger.error('RetryableRequest', 'Error in onExhausted callback', callbackError);
              }
            }
            
            // Log retry exhausted
            safeLogger.warn(
              'RetryableRequest',
              `Retry exhausted after ${status.currentAttempt} attempts`,
              {
                error: error.message,
                category: this.categorizeError(error),
                context: this.options.context
              }
            );
            
            resolve({
              error,
              success: false,
              attempts: status.currentAttempt,
              totalTimeMs: Date.now() - status.startTime,
              aborted: false,
              timedOut: false
            });
          }
        });
    });
  }
  
  /**
   * Aborts the current attempt
   * 
   * @param status The current retry status
   */
  private abortCurrentAttempt(status: RetryStatus): void {
    status.aborted = true;
    
    if (status.abortController) {
      try {
        status.abortController.abort();
      } catch (error) {
        safeLogger.error('RetryableRequest', 'Error aborting request', error);
      }
    }
  }
  
  /**
   * Cleans up resources used by the request
   * 
   * @param status The current retry status
   */
  private cleanupResources(status: RetryStatus): void {
    // Clear the total timeout
    if (status.totalTimeoutId) {
      clearTimeout(status.totalTimeoutId);
      status.totalTimeoutId = undefined;
    }
    
    // Clear the attempt timeout
    if (status.attemptTimeoutId) {
      clearTimeout(status.attemptTimeoutId);
      status.attemptTimeoutId = undefined;
    }
    
    // Mark as not in progress
    status.inProgress = false;
  }
  
  /**
   * Emits an event to all listeners
   * 
   * @param eventType The event type to emit
   * @param data The event data
   */
  private emitEvent = withErrorHandling(
    (eventType: RetryEventType, data: any): void => {
      if (this.listeners.has(eventType)) {
        const listeners = this.listeners.get(eventType)!;
        
        for (const listener of listeners) {
          try {
            listener(eventType, data);
          } catch (error) {
            safeLogger.error('RetryableRequest', 'Error in event listener', error);
          }
        }
      }
    },
    undefined,
    (error) => {
      safeLogger.error('RetryableRequest', 'Error emitting event', error);
    }
  );
  
  /**
   * Categorizes an error to determine if it should be retried
   * 
   * @param error The error to categorize
   * @returns The error category
   */
  private categorizeError = withErrorHandling(
    (error: Error): ErrorCategory => {
      // Use the policy's categorization if available
      if (this.options.policy) {
        return (this.options.policy as any).categorizeError(error);
      }
      
      // Check for network errors
      if (
        error.message.includes('network') ||
        error.message.includes('connection') ||
        error.name === 'AbortError'
      ) {
        return ErrorCategory.NETWORK;
      }
      
      // Check for timeout errors
      if (
        error.message.includes('timeout') ||
        error.message.includes('timed out')
      ) {
        return ErrorCategory.TIMEOUT;
      }
      
      // Default to unknown
      return ErrorCategory.UNKNOWN;
    },
    ErrorCategory.UNKNOWN,
    (error) => {
      safeLogger.error('RetryableRequest', 'Error categorizing error', error);
    }
  );
  
  /**
   * Creates a RetryableRequest with default options
   */
  static create(options: RetryableRequestOptions = {}): RetryableRequest {
    return new RetryableRequest(options);
  }
  
  /**
   * Creates a RetryableRequest with aggressive retry policy for critical operations
   */
  static createAggressive(options: RetryableRequestOptions = {}): RetryableRequest {
    return new RetryableRequest({
      ...options,
      policy: RetryPolicy.createAggressive(),
      totalTimeoutMs: 120000
    });
  }
  
  /**
   * Creates a RetryableRequest with conservative retry policy for non-critical operations
   */
  static createConservative(options: RetryableRequestOptions = {}): RetryableRequest {
    return new RetryableRequest({
      ...options,
      policy: RetryPolicy.createConservative(),
      totalTimeoutMs: 30000
    });
  }
} 
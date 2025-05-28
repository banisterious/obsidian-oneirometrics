/**
 * ResilienceManager - Facade for API resilience components
 * 
 * Provides a unified interface for working with retry policies, 
 * circuit breakers, and offline support.
 */

import safeLogger from '../../logging/safe-logger';
import { withErrorHandling } from '../../utils/defensive-utils';
import { RetryPolicy, ErrorCategory } from './RetryPolicy';
import { RetryableRequest, RetryEventType, RetryableRequestOptions } from './RetryableRequest';
import { CircuitBreaker, CircuitBreakerOptions, CircuitState } from './CircuitBreaker';
import { OfflineSupport, OfflineSupportOptions, ConnectionStatus, OfflineEventType } from './OfflineSupport';

/**
 * Options for configuring the resilience manager
 */
export interface ResilienceManagerOptions {
  /** Name for this resilience manager instance */
  name: string;
  
  /** Whether to enable retries */
  enableRetries?: boolean;
  
  /** Configuration for retry policy */
  retryOptions?: RetryableRequestOptions;
  
  /** Whether to enable circuit breaker */
  enableCircuitBreaker?: boolean;
  
  /** Configuration for circuit breaker */
  circuitBreakerOptions?: CircuitBreakerOptions;
  
  /** Whether to enable offline support */
  enableOfflineSupport?: boolean;
  
  /** Configuration for offline support */
  offlineSupportOptions?: OfflineSupportOptions;
}

/**
 * Types of resilience mechanisms
 */
export enum ResilienceType {
  /** Retry mechanism */
  RETRY = 'retry',
  
  /** Circuit breaker */
  CIRCUIT_BREAKER = 'circuit_breaker',
  
  /** Offline support */
  OFFLINE_SUPPORT = 'offline_support'
}

/**
 * Health status for a resilience component
 */
export interface ResilienceHealth {
  /** Type of resilience mechanism */
  type: ResilienceType;
  
  /** Whether the component is healthy */
  healthy: boolean;
  
  /** Status message */
  statusMessage: string;
  
  /** Detailed metrics */
  metrics: Record<string, any>;
}

/**
 * Default options for resilience manager
 */
const DEFAULT_OPTIONS: Partial<ResilienceManagerOptions> = {
  enableRetries: true,
  enableCircuitBreaker: true,
  enableOfflineSupport: true
};

/**
 * Facade for API resilience components
 * 
 * Provides a unified interface for working with retry policies, 
 * circuit breakers, and offline support.
 */
export class ResilienceManager {
  /** Configuration options */
  private options: ResilienceManagerOptions;
  
  /** Retry policy for operations */
  private retryableRequest?: RetryableRequest;
  
  /** Circuit breaker for operations */
  private circuitBreaker?: CircuitBreaker;
  
  /** Offline support for operations */
  private offlineSupport?: OfflineSupport;
  
  /**
   * Creates a new ResilienceManager with the specified options
   * 
   * @param options Configuration options
   */
  constructor(options: ResilienceManagerOptions) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
    
    this.initialize();
  }
  
  /**
   * Initializes the resilience components
   */
  private initialize = withErrorHandling(
    (): void => {
      // Initialize retry policy
      if (this.options.enableRetries) {
        this.retryableRequest = new RetryableRequest(this.options.retryOptions);
        safeLogger.info('ResilienceManager', `Initialized retry policy for '${this.options.name}'`);
      }
      
      // Initialize circuit breaker
      if (this.options.enableCircuitBreaker) {
        const circuitOptions: CircuitBreakerOptions = {
          name: this.options.name,
          ...this.options.circuitBreakerOptions
        };
        
        this.circuitBreaker = new CircuitBreaker(circuitOptions);
        safeLogger.info('ResilienceManager', `Initialized circuit breaker for '${this.options.name}'`);
      }
      
      // Initialize offline support
      if (this.options.enableOfflineSupport) {
        this.offlineSupport = new OfflineSupport(this.options.offlineSupportOptions);
        
        // Listen for connection status changes
        this.offlineSupport.addEventListener(
          OfflineEventType.CONNECTION_STATUS_CHANGED,
          (_, data) => {
            safeLogger.info('ResilienceManager', `Connection status changed: ${data.oldStatus} -> ${data.newStatus}`);
            
            // Reset circuit breaker if we go online
            if (data.newStatus === ConnectionStatus.ONLINE && this.circuitBreaker) {
              const metrics = this.circuitBreaker.getHealthMetrics();
              
              if (metrics.state === CircuitState.OPEN) {
                safeLogger.info('ResilienceManager', 'Resetting circuit breaker due to connection restoration');
                this.circuitBreaker.reset();
              }
            }
          }
        );
        
        safeLogger.info('ResilienceManager', `Initialized offline support for '${this.options.name}'`);
      }
    },
    undefined,
    (error) => {
      safeLogger.error('ResilienceManager', `Error initializing resilience manager for '${this.options.name}'`, error);
    }
  );
  
  /**
   * Executes an operation with the configured resilience mechanisms
   * 
   * @param operation The operation to execute
   * @param options Additional options for this specific operation
   * @returns The result of the operation
   */
  async execute<T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    options: {
      offlineCapable?: boolean;
      offlineOperationType?: string;
      offlineOperationPayload?: any;
      context?: Record<string, any>;
    } = {}
  ): Promise<T> {
    const context = options.context || { operation: this.options.name };
    
    // Check if we're offline and the operation is offline-capable
    if (this.offlineSupport && options.offlineCapable && 
        this.offlineSupport.getConnectionStatus() === ConnectionStatus.OFFLINE) {
      safeLogger.info('ResilienceManager', `Queueing offline operation for '${this.options.name}'`, {
        type: options.offlineOperationType,
        context
      });
      
      // Queue the operation for later execution
      this.offlineSupport.enqueueOperation({
        type: options.offlineOperationType || 'unknown',
        payload: options.offlineOperationPayload,
        execute: () => operation(),
        metadata: { context }
      });
      
      throw new Error(`Operation queued for offline execution: ${options.offlineOperationType || 'unknown'}`);
    }
    
    // Apply circuit breaker if enabled
    const executeWithCircuitBreaker = async (): Promise<T> => {
      if (this.circuitBreaker) {
        return this.circuitBreaker.execute(async () => {
          if (this.retryableRequest) {
            return this.retryableRequest.execute(operation) as Promise<T>;
          } else {
            return operation();
          }
        });
      } else if (this.retryableRequest) {
        return this.retryableRequest.execute(operation) as Promise<T>;
      } else {
        return operation();
      }
    };
    
    try {
      return await executeWithCircuitBreaker();
    } catch (error) {
      // If we have offline support and the error is network-related, queue for later
      if (this.offlineSupport && options.offlineCapable && this.isNetworkError(error as Error)) {
        safeLogger.info(
          'ResilienceManager', 
          `Network error detected, queueing for offline execution: '${this.options.name}'`,
          { error: (error as Error).message, context }
        );
        
        // Transition to offline mode
        if (this.offlineSupport.getConnectionStatus() !== ConnectionStatus.OFFLINE) {
          // Force connection check
          await this.checkConnectivity();
        }
        
        // Queue the operation if we're offline
        if (this.offlineSupport.getConnectionStatus() === ConnectionStatus.OFFLINE) {
          this.offlineSupport.enqueueOperation({
            type: options.offlineOperationType || 'unknown',
            payload: options.offlineOperationPayload,
            execute: () => operation(),
            metadata: { context }
          });
          
          throw new Error(`Operation queued for offline execution due to network error: ${options.offlineOperationType || 'unknown'}`);
        }
      }
      
      // Re-throw the error
      throw error;
    }
  }
  
  /**
   * Checks if an error is a network-related error
   * 
   * @param error The error to check
   * @returns True if the error is network-related
   */
  private isNetworkError = withErrorHandling(
    (error: Error): boolean => {
      if (!error) {
        return false;
      }
      
      // Check error message for network-related terms
      const message = error.message.toLowerCase();
      return message.includes('network') || 
             message.includes('connection') || 
             message.includes('offline') || 
             message.includes('internet') ||
             message.includes('timeout') ||
             message.includes('econnrefused') ||
             message.includes('enotfound');
    },
    false,
    (error) => {
      safeLogger.error('ResilienceManager', 'Error checking for network error', error);
    }
  );
  
  /**
   * Checks the current connectivity status
   * 
   * @returns True if online
   */
  async checkConnectivity(): Promise<boolean> {
    if (this.offlineSupport) {
      // Trigger a connection check
      await (this.offlineSupport as any).checkConnectionStatus();
      return this.offlineSupport.getConnectionStatus() === ConnectionStatus.ONLINE;
    }
    
    // Default to navigator.onLine if offline support is not enabled
    return typeof navigator !== 'undefined' && navigator.onLine;
  }
  
  /**
   * Gets the health status of all resilience components
   * 
   * @returns Health status of all components
   */
  getHealth(): ResilienceHealth[] {
    const health: ResilienceHealth[] = [];
    
    // Check retry policy health
    if (this.retryableRequest) {
      health.push({
        type: ResilienceType.RETRY,
        healthy: true, // Retry policy is always considered healthy
        statusMessage: 'Retry policy active',
        metrics: {
          // No specific metrics for retry policy
          enabled: true
        }
      });
    }
    
    // Check circuit breaker health
    if (this.circuitBreaker) {
      const metrics = this.circuitBreaker.getHealthMetrics();
      const isHealthy = metrics.state !== CircuitState.OPEN;
      
      health.push({
        type: ResilienceType.CIRCUIT_BREAKER,
        healthy: isHealthy,
        statusMessage: isHealthy ? 'Circuit breaker healthy' : 'Circuit breaker open',
        metrics
      });
    }
    
    // Check offline support health
    if (this.offlineSupport) {
      const connectionStatus = this.offlineSupport.getConnectionStatus();
      const isHealthy = connectionStatus === ConnectionStatus.ONLINE;
      const queuedOperations = this.offlineSupport.getQueuedOperations();
      
      health.push({
        type: ResilienceType.OFFLINE_SUPPORT,
        healthy: isHealthy,
        statusMessage: isHealthy ? 'Online' : 'Offline',
        metrics: {
          connectionStatus,
          queuedOperationCount: queuedOperations.length
        }
      });
    }
    
    return health;
  }
  
  /**
   * Syncs any queued offline operations
   * 
   * @returns Result of the sync operation
   */
  async syncOfflineOperations() {
    if (this.offlineSupport) {
      return this.offlineSupport.syncOperations();
    }
    
    return {
      successCount: 0,
      failureCount: 0,
      totalCount: 0,
      successfulOperations: [],
      failedOperations: []
    };
  }
  
  /**
   * Resets all resilience components to their initial state
   */
  reset(): void {
    // Reset circuit breaker
    if (this.circuitBreaker) {
      this.circuitBreaker.reset();
      safeLogger.info('ResilienceManager', `Reset circuit breaker for '${this.options.name}'`);
    }
    
    // No reset needed for retry policy
    
    safeLogger.info('ResilienceManager', `Reset resilience components for '${this.options.name}'`);
  }
  
  /**
   * Disposes of resources
   */
  dispose(): void {
    // Dispose offline support
    if (this.offlineSupport) {
      this.offlineSupport.dispose();
    }
    
    safeLogger.info('ResilienceManager', `Disposed resilience manager for '${this.options.name}'`);
  }
  
  /**
   * Gets the offline support component
   * 
   * @returns The offline support component, or undefined if not enabled
   */
  getOfflineSupport(): OfflineSupport | undefined {
    return this.offlineSupport;
  }
  
  /**
   * Gets the circuit breaker component
   * 
   * @returns The circuit breaker component, or undefined if not enabled
   */
  getCircuitBreaker(): CircuitBreaker | undefined {
    return this.circuitBreaker;
  }
  
  /**
   * Gets the retryable request component
   * 
   * @returns The retryable request component, or undefined if not enabled
   */
  getRetryableRequest(): RetryableRequest | undefined {
    return this.retryableRequest;
  }
  
  /**
   * Creates a ResilienceManager with default options
   * 
   * @param name Name for the resilience manager
   * @returns A new ResilienceManager
   */
  static create(name: string): ResilienceManager {
    return new ResilienceManager({ name });
  }
  
  /**
   * Creates a ResilienceManager with aggressive retry policy
   * 
   * @param name Name for the resilience manager
   * @returns A new ResilienceManager with aggressive retry policy
   */
  static createAggressive(name: string): ResilienceManager {
    return new ResilienceManager({
      name,
      retryOptions: {
        policy: RetryPolicy.createAggressive()
      },
      circuitBreakerOptions: {
        failureThreshold: 75, // More lenient threshold (75%)
        resetTimeoutMs: 15000 // Shorter reset time (15 seconds)
      }
    });
  }
  
  /**
   * Creates a ResilienceManager with conservative retry policy
   * 
   * @param name Name for the resilience manager
   * @returns A new ResilienceManager with conservative retry policy
   */
  static createConservative(name: string): ResilienceManager {
    return new ResilienceManager({
      name,
      retryOptions: {
        policy: RetryPolicy.createConservative()
      },
      circuitBreakerOptions: {
        failureThreshold: 25, // Stricter threshold (25%)
        resetTimeoutMs: 60000 // Longer reset time (60 seconds)
      }
    });
  }
} 
/**
 * CircuitBreaker - Implementation of the Circuit Breaker pattern
 * 
 * Provides protection against cascading failures when external services fail
 * by temporarily disabling operations after failures exceed thresholds.
 */

import safeLogger from '../../logging/safe-logger';
import { withErrorHandling } from '../../utils/defensive-utils';

/**
 * Current state of the circuit breaker
 */
export enum CircuitState {
  /** Circuit is closed and operations proceed normally */
  CLOSED = 'closed',
  
  /** Circuit is open and operations fail fast without attempting */
  OPEN = 'open',
  
  /** Circuit is half-open, allowing a single test operation */
  HALF_OPEN = 'half-open'
}

/**
 * Options for configuring a circuit breaker
 */
export interface CircuitBreakerOptions {
  /** The failure threshold before opening the circuit (percent or count) */
  failureThreshold?: number;
  
  /** Whether the failure threshold is a percentage (vs count) */
  failureThresholdIsPercentage?: boolean;
  
  /** The reset timeout in milliseconds */
  resetTimeoutMs?: number;
  
  /** The size of the rolling window for tracking failures */
  rollingWindowSize?: number;
  
  /** Minimum number of calls needed before circuit can open */
  minimumRequestThreshold?: number;
  
  /** Circuit name for logging */
  name?: string;
  
  /** Function to determine if an error should count as a failure */
  isFailure?: (error: Error) => boolean;
}

/**
 * Default options for circuit breaker
 */
const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 50, // 50%
  failureThresholdIsPercentage: true,
  resetTimeoutMs: 30000, // 30 seconds
  rollingWindowSize: 10,
  minimumRequestThreshold: 5,
  name: 'default',
  isFailure: () => true // All errors count as failures by default
};

/**
 * Error thrown when a circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(circuitName: string) {
    super(`Circuit '${circuitName}' is open`);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Type for health metrics of the circuit
 */
export interface CircuitHealthMetrics {
  /** Current state of the circuit */
  state: CircuitState;
  
  /** Number of successful calls in the window */
  successCount: number;
  
  /** Number of failed calls in the window */
  failureCount: number;
  
  /** Total calls in the window */
  totalCount: number;
  
  /** Failure rate as a percentage */
  failureRate: number;
  
  /** When the circuit was last opened (if applicable) */
  lastOpenedTime?: Date;
  
  /** When the circuit was last tested (if applicable) */
  lastTestedTime?: Date;
  
  /** When the circuit was last reset (if applicable) */
  lastResetTime?: Date;
}

/**
 * Type for a circuit breaker event handler
 */
type CircuitEventHandler = (metrics: CircuitHealthMetrics) => void;

/**
 * Represents a call result for tracking purposes
 */
interface CallResult {
  /** Whether the call was successful */
  success: boolean;
  
  /** Timestamp of the call */
  timestamp: number;
}

/**
 * Implementation of the Circuit Breaker pattern
 * 
 * Protects against cascading failures when external services fail
 * by temporarily disabling operations after failures exceed thresholds.
 */
export class CircuitBreaker {
  /** Configuration options */
  private options: CircuitBreakerOptions;
  
  /** Current state of the circuit */
  private state: CircuitState = CircuitState.CLOSED;
  
  /** Results of calls in the rolling window */
  private results: CallResult[] = [];
  
  /** Timer for resetting the circuit */
  private resetTimer?: NodeJS.Timeout;
  
  /** Time when the circuit was last opened */
  private lastOpenTime?: number;
  
  /** Time when the circuit was last tested */
  private lastTestTime?: number;
  
  /** Time when the circuit was last reset */
  private lastResetTime?: number;
  
  /** Event handlers for state changes */
  private stateChangeHandlers: CircuitEventHandler[] = [];
  
  /**
   * Creates a new CircuitBreaker with the specified options
   * 
   * @param options Configuration options for the circuit breaker
   */
  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options
    };
  }
  
  /**
   * Executes an operation protected by the circuit breaker
   * 
   * @param operation The operation to execute
   * @returns The result of the operation if successful
   * @throws CircuitOpenError if the circuit is open
   * @throws The original error if the operation fails
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if the circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if it's time to try a test operation
      if (this.shouldAttemptReset()) {
        // Transition to half-open state
        this.transitionToState(CircuitState.HALF_OPEN);
        
        // Try the operation as a test
        try {
          const result = await operation();
          this.recordSuccess();
          return result;
        } catch (error) {
          this.recordFailure(error as Error);
          throw error;
        }
      }
      
      // Circuit is open, fail fast
      throw new CircuitOpenError(this.options.name || 'default');
    }
    
    // Circuit is closed or half-open, attempt the operation
    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure(error as Error);
      throw error;
    }
  }
  
  /**
   * Records a successful call
   */
  private recordSuccess = withErrorHandling(
    (): void => {
      this.addResult(true);
      
      // If we're half-open and got a success, close the circuit
      if (this.state === CircuitState.HALF_OPEN) {
        this.transitionToState(CircuitState.CLOSED);
      }
    },
    undefined,
    (error) => {
      safeLogger.error('CircuitBreaker', `Error recording success for circuit '${this.options.name}'`, error);
    }
  );
  
  /**
   * Records a failed call
   * 
   * @param error The error that occurred
   */
  private recordFailure = withErrorHandling(
    (error: Error): void => {
      // Check if this error counts as a failure
      const isFailure = this.options.isFailure ? 
        this.options.isFailure(error) : 
        DEFAULT_OPTIONS.isFailure!(error);
      
      if (!isFailure) {
        // This error doesn't count as a circuit breaker failure
        return;
      }
      
      this.addResult(false);
      
      // If we're half-open and got a failure, open the circuit
      if (this.state === CircuitState.HALF_OPEN) {
        this.transitionToState(CircuitState.OPEN);
        return;
      }
      
      // Check if we should open the circuit
      const metrics = this.getHealthMetrics();
      const threshold = this.options.failureThresholdIsPercentage ?
        this.options.failureThreshold! :
        this.options.failureThreshold! / metrics.totalCount * 100;
      
      // Only open the circuit if we have enough requests and are above the threshold
      if (metrics.totalCount >= (this.options.minimumRequestThreshold || DEFAULT_OPTIONS.minimumRequestThreshold!) &&
          metrics.failureRate >= threshold) {
        this.transitionToState(CircuitState.OPEN);
      }
    },
    undefined,
    (error) => {
      safeLogger.error('CircuitBreaker', `Error recording failure for circuit '${this.options.name}'`, error);
    }
  );
  
  /**
   * Adds a result to the rolling window
   * 
   * @param success Whether the call was successful
   */
  private addResult = withErrorHandling(
    (success: boolean): void => {
      const result: CallResult = {
        success,
        timestamp: Date.now()
      };
      
      this.results.push(result);
      
      // Trim the window to the configured size
      const windowSize = this.options.rollingWindowSize || DEFAULT_OPTIONS.rollingWindowSize!;
      if (this.results.length > windowSize) {
        this.results = this.results.slice(-windowSize);
      }
    },
    undefined,
    (error) => {
      safeLogger.error('CircuitBreaker', `Error adding result for circuit '${this.options.name}'`, error);
    }
  );
  
  /**
   * Transitions the circuit to a new state
   * 
   * @param newState The new state
   */
  private transitionToState = withErrorHandling(
    (newState: CircuitState): void => {
      if (this.state === newState) {
        return;
      }
      
      const oldState = this.state;
      this.state = newState;
      
      // Update state timings
      const now = Date.now();
      
      if (newState === CircuitState.OPEN) {
        this.lastOpenTime = now;
        
        // Set up the reset timer
        this.resetTimer && clearTimeout(this.resetTimer);
        this.resetTimer = setTimeout(() => {
          this.transitionToState(CircuitState.HALF_OPEN);
        }, this.options.resetTimeoutMs || DEFAULT_OPTIONS.resetTimeoutMs!);
      } else if (newState === CircuitState.HALF_OPEN) {
        this.lastTestTime = now;
      } else if (newState === CircuitState.CLOSED) {
        this.lastResetTime = now;
        // Clear the results when closing the circuit
        this.results = [];
      }
      
      // Log the transition
      safeLogger.info('CircuitBreaker', `Circuit '${this.options.name}' state changed from ${oldState} to ${newState}`, {
        circuit: this.options.name,
        oldState,
        newState,
        metrics: this.getHealthMetrics()
      });
      
      // Notify handlers
      this.notifyStateChangeHandlers();
    },
    undefined,
    (error) => {
      safeLogger.error('CircuitBreaker', `Error transitioning state for circuit '${this.options.name}'`, error);
    }
  );
  
  /**
   * Checks if it's time to attempt resetting the circuit
   * 
   * @returns True if it's time to reset
   */
  private shouldAttemptReset = withErrorHandling(
    (): boolean => {
      if (!this.lastOpenTime) {
        return false;
      }
      
      const resetTimeout = this.options.resetTimeoutMs || DEFAULT_OPTIONS.resetTimeoutMs!;
      return Date.now() - this.lastOpenTime >= resetTimeout;
    },
    false,
    (error) => {
      safeLogger.error('CircuitBreaker', `Error checking reset time for circuit '${this.options.name}'`, error);
    }
  );
  
  /**
   * Gets the health metrics for the circuit
   * 
   * @returns Health metrics
   */
  getHealthMetrics = withErrorHandling(
    (): CircuitHealthMetrics => {
      const successCount = this.results.filter(r => r.success).length;
      const failureCount = this.results.length - successCount;
      const totalCount = this.results.length;
      const failureRate = totalCount === 0 ? 0 : (failureCount / totalCount) * 100;
      
      const metrics: CircuitHealthMetrics = {
        state: this.state,
        successCount,
        failureCount,
        totalCount,
        failureRate
      };
      
      if (this.lastOpenTime) {
        metrics.lastOpenedTime = new Date(this.lastOpenTime);
      }
      
      if (this.lastTestTime) {
        metrics.lastTestedTime = new Date(this.lastTestTime);
      }
      
      if (this.lastResetTime) {
        metrics.lastResetTime = new Date(this.lastResetTime);
      }
      
      return metrics;
    },
    {
      state: CircuitState.CLOSED,
      successCount: 0,
      failureCount: 0,
      totalCount: 0,
      failureRate: 0
    } as CircuitHealthMetrics,
    (error) => {
      safeLogger.error('CircuitBreaker', `Error getting health metrics for circuit '${this.options.name}'`, error);
    }
  );
  
  /**
   * Resets the circuit to closed state
   */
  reset = withErrorHandling(
    (): void => {
      this.resetTimer && clearTimeout(this.resetTimer);
      this.results = [];
      this.transitionToState(CircuitState.CLOSED);
    },
    undefined,
    (error) => {
      safeLogger.error('CircuitBreaker', `Error resetting circuit '${this.options.name}'`, error);
    }
  );
  
  /**
   * Forces the circuit to open
   */
  forceOpen = withErrorHandling(
    (): void => {
      this.transitionToState(CircuitState.OPEN);
    },
    undefined,
    (error) => {
      safeLogger.error('CircuitBreaker', `Error forcing open circuit '${this.options.name}'`, error);
    }
  );
  
  /**
   * Adds a state change handler
   * 
   * @param handler The handler to add
   */
  onStateChange(handler: CircuitEventHandler): void {
    this.stateChangeHandlers.push(handler);
  }
  
  /**
   * Notifies all state change handlers
   */
  private notifyStateChangeHandlers = withErrorHandling(
    (): void => {
      const metrics = this.getHealthMetrics();
      
      for (const handler of this.stateChangeHandlers) {
        try {
          handler(metrics);
        } catch (error) {
          safeLogger.error('CircuitBreaker', 'Error in state change handler', error);
        }
      }
    },
    undefined,
    (error) => {
      safeLogger.error('CircuitBreaker', `Error notifying state change handlers for circuit '${this.options.name}'`, error);
    }
  );
  
  /**
   * Creates a CircuitBreaker with the specified options
   * 
   * @param options Configuration options
   * @returns A new CircuitBreaker
   */
  static create(options: CircuitBreakerOptions = {}): CircuitBreaker {
    return new CircuitBreaker(options);
  }
  
  /**
   * Creates a CircuitBreaker with a strict configuration
   * 
   * @param name Circuit name
   * @returns A new CircuitBreaker with a strict configuration
   */
  static createStrict(name: string): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 25, // 25% failure rate
      failureThresholdIsPercentage: true,
      resetTimeoutMs: 60000, // 1 minute
      rollingWindowSize: 20,
      minimumRequestThreshold: 3
    });
  }
  
  /**
   * Creates a CircuitBreaker with a lenient configuration
   * 
   * @param name Circuit name
   * @returns A new CircuitBreaker with a lenient configuration
   */
  static createLenient(name: string): CircuitBreaker {
    return new CircuitBreaker({
      name,
      failureThreshold: 75, // 75% failure rate
      failureThresholdIsPercentage: true,
      resetTimeoutMs: 15000, // 15 seconds
      rollingWindowSize: 5,
      minimumRequestThreshold: 10
    });
  }
} 
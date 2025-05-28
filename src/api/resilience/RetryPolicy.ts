/**
 * RetryPolicy - Configurable retry policies for API operations
 * 
 * Provides a flexible retry policy implementation with exponential backoff, jitter,
 * and configurable retry conditions for resilient API interactions.
 */

import safeLogger from '../../logging/safe-logger';
import { withErrorHandling } from '../../utils/defensive-utils';

/**
 * Categorizes errors that can occur during API operations
 */
export enum ErrorCategory {
  /** Network-related errors (connectivity, DNS, etc.) */
  NETWORK = 'network',
  
  /** Server errors (5xx status codes) */
  SERVER = 'server',
  
  /** Client errors (4xx status codes) */
  CLIENT = 'client',
  
  /** Timeout errors */
  TIMEOUT = 'timeout',
  
  /** Authentication errors */
  AUTH = 'auth',
  
  /** Unknown or uncategorized errors */
  UNKNOWN = 'unknown'
}

/**
 * Configuration options for retry policies
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  
  /** Base delay in milliseconds before applying backoff */
  baseDelayMs?: number;
  
  /** Maximum delay in milliseconds */
  maxDelayMs?: number;
  
  /** Whether to use jitter to prevent thundering herd problem */
  useJitter?: boolean;
  
  /** Backoff factor (default is 2 for exponential backoff) */
  backoffFactor?: number;
  
  /** Timeout in milliseconds for each attempt */
  timeoutMs?: number;
  
  /** Categories of errors that should be retried */
  retryableCategories?: ErrorCategory[];
  
  /** Custom function to determine if an error should be retried */
  shouldRetryFn?: (error: Error, attempt: number) => boolean;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 300,
  maxDelayMs: 10000,
  useJitter: true,
  backoffFactor: 2,
  timeoutMs: 30000,
  retryableCategories: [
    ErrorCategory.NETWORK,
    ErrorCategory.SERVER,
    ErrorCategory.TIMEOUT
  ]
};

/**
 * Provides configurable retry policies for API operations
 */
export class RetryPolicy {
  /** The options for this policy */
  private options: RetryOptions;
  
  /**
   * Creates a new RetryPolicy with the specified options
   * 
   * @param options Configuration options for the retry policy
   */
  constructor(options: RetryOptions = {}) {
    this.options = {
      ...DEFAULT_RETRY_OPTIONS,
      ...options
    };
  }
  
  /**
   * Determines if an error should be retried based on the policy
   * 
   * @param error The error that occurred
   * @param attempt The current attempt number (1-based)
   * @returns True if the operation should be retried
   */
  shouldRetry = withErrorHandling(
    (error: Error, attempt: number): boolean => {
      // Check if max attempts reached
      if (attempt >= (this.options.maxAttempts || DEFAULT_RETRY_OPTIONS.maxAttempts!)) {
        return false;
      }
      
      // Use custom function if provided
      if (this.options.shouldRetryFn) {
        return this.options.shouldRetryFn(error, attempt);
      }
      
      // Use built-in categorization
      const category = this.categorizeError(error);
      return (this.options.retryableCategories || DEFAULT_RETRY_OPTIONS.retryableCategories!)
        .includes(category);
    },
    false,
    (error) => {
      safeLogger.error('RetryPolicy', 'Error in shouldRetry', error);
    }
  );
  
  /**
   * Calculates the delay before the next retry attempt
   * 
   * @param attempt The current attempt number (1-based)
   * @returns Delay in milliseconds
   */
  getNextDelayMs = withErrorHandling(
    (attempt: number): number => {
      const baseDelay = this.options.baseDelayMs || DEFAULT_RETRY_OPTIONS.baseDelayMs!;
      const backoffFactor = this.options.backoffFactor || DEFAULT_RETRY_OPTIONS.backoffFactor!;
      const maxDelay = this.options.maxDelayMs || DEFAULT_RETRY_OPTIONS.maxDelayMs!;
      
      // Calculate exponential backoff
      let delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
      
      // Apply maximum delay
      delay = Math.min(delay, maxDelay);
      
      // Add jitter if enabled to prevent thundering herd problem
      if (this.options.useJitter) {
        // Add random jitter between 0-30% of the delay
        const jitterFactor = 0.3;
        const jitterAmount = delay * jitterFactor * Math.random();
        delay = delay + jitterAmount;
      }
      
      return Math.floor(delay);
    },
    DEFAULT_RETRY_OPTIONS.baseDelayMs!,
    (error) => {
      safeLogger.error('RetryPolicy', 'Error calculating retry delay', error);
    }
  );
  
  /**
   * Gets the maximum number of attempts for this policy
   * 
   * @returns The maximum number of attempts
   */
  getMaxAttempts(): number {
    return this.options.maxAttempts || DEFAULT_RETRY_OPTIONS.maxAttempts!;
  }
  
  /**
   * Gets the timeout for each attempt
   * 
   * @returns Timeout in milliseconds
   */
  getTimeoutMs(): number {
    return this.options.timeoutMs || DEFAULT_RETRY_OPTIONS.timeoutMs!;
  }
  
  /**
   * Categorizes an error to determine if it should be retried
   * 
   * @param error The error to categorize
   * @returns The error category
   */
  private categorizeError = withErrorHandling(
    (error: Error): ErrorCategory => {
      // Check for network errors
      if (
        error.message.includes('network') ||
        error.message.includes('connection') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ETIMEDOUT')
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
      
      // Check for fetch/response with status code
      const responseError = error as any;
      if (responseError.status || responseError.statusCode) {
        const status = responseError.status || responseError.statusCode;
        
        // 5xx errors are server errors
        if (status >= 500 && status < 600) {
          return ErrorCategory.SERVER;
        }
        
        // 4xx errors are client errors
        if (status >= 400 && status < 500) {
          // Special case for auth errors
          if (status === 401 || status === 403) {
            return ErrorCategory.AUTH;
          }
          return ErrorCategory.CLIENT;
        }
      }
      
      // Default to unknown
      return ErrorCategory.UNKNOWN;
    },
    ErrorCategory.UNKNOWN,
    (error) => {
      safeLogger.error('RetryPolicy', 'Error categorizing error', error);
    }
  );
  
  /**
   * Creates a RetryPolicy with fixed settings for common scenarios
   */
  static create(options: RetryOptions = {}): RetryPolicy {
    return new RetryPolicy(options);
  }
  
  /**
   * Creates a conservative policy with fewer retries, suitable for non-critical operations
   */
  static createConservative(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 2,
      baseDelayMs: 500,
      maxDelayMs: 5000,
      retryableCategories: [ErrorCategory.NETWORK, ErrorCategory.SERVER]
    });
  }
  
  /**
   * Creates an aggressive policy with more retries, suitable for critical operations
   */
  static createAggressive(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 5,
      baseDelayMs: 200,
      maxDelayMs: 30000,
      retryableCategories: [
        ErrorCategory.NETWORK,
        ErrorCategory.SERVER,
        ErrorCategory.TIMEOUT,
        ErrorCategory.UNKNOWN
      ]
    });
  }
} 
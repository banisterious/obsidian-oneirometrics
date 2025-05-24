/**
 * Async Helper Functions
 * 
 * This file contains utility functions for safely handling asynchronous
 * operations in OneiroMetrics plugin.
 */

/**
 * Type for an async operation result
 */
export type AsyncResult<T> = {
  success: boolean;
  data?: T;
  error?: Error | string;
};

/**
 * Safely executes an async function with error handling
 * @param asyncFn The async function to execute
 * @param errorHandler Optional custom error handler
 * @returns Promise resolving to an AsyncResult
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  errorHandler?: (error: any) => void
): Promise<AsyncResult<T>> {
  try {
    const data = await asyncFn();
    return { success: true, data };
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error('Async operation failed:', error);
    }
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
}

/**
 * Debounces an async function
 * @param fn The function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;
  let resolvePromise: ((value: ReturnType<T>) => void) | null = null;
  
  return function(...args: Parameters<T>): Promise<ReturnType<T>> {
    // If we already have a pending promise, return it
    if (pendingPromise && resolvePromise) {
      return pendingPromise;
    }
    
    // Create a new promise
    pendingPromise = new Promise<ReturnType<T>>(resolve => {
      resolvePromise = resolve;
    });
    
    // Clear any existing timeout
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // Create a new timeout
    timeout = setTimeout(async () => {
      if (resolvePromise) {
        const result = await fn(...args);
        resolvePromise(result);
        
        // Reset state
        pendingPromise = null;
        resolvePromise = null;
      }
    }, wait);
    
    return pendingPromise;
  };
}

/**
 * Safely fetches data with timeout and error handling
 * @param url URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise resolving to fetch result
 */
export async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 10000
): Promise<AsyncResult<T>> {
  return safeAsync(async () => {
    // Create abort controller for timeout
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Set timeout
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      // Perform fetch with signal
      const response = await fetch(url, {
        ...options,
        signal
      });
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }
      
      // Parse JSON response
      const data = await response.json();
      return data as T;
    } finally {
      // Clear timeout
      clearTimeout(timeout);
    }
  });
}

/**
 * Retries an async function with exponential backoff
 * @param fn The function to retry
 * @param maxRetries Maximum number of retries
 * @param initialDelayMs Initial delay in milliseconds
 * @returns Promise resolving to the function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 500
): Promise<T> {
  let retries = 0;
  let delay = initialDelayMs;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      
      if (retries > maxRetries) {
        throw error;
      }
      
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next retry
      delay *= 2;
    }
  }
}

/**
 * Creates a promise that can be manually resolved or rejected
 * @returns Object with promise, resolve, and reject functions
 */
export function createDeferredPromise<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
} {
  let resolveFn: (value: T) => void;
  let rejectFn: (reason?: any) => void;
  
  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  
  return {
    promise,
    resolve: resolveFn!,
    reject: rejectFn!
  };
} 
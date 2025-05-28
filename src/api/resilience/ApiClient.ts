/**
 * ApiClient - Example implementation using the resilience mechanisms
 * 
 * Demonstrates how to use the retry policy, circuit breaker, and offline
 * support to create a resilient API client.
 */

import safeLogger from '../../logging/safe-logger';
import { withErrorHandling } from '../../utils/defensive-utils';
import { ResilienceManager } from './ResilienceManager';

/**
 * Response from the API
 */
export interface ApiResponse<T> {
  /** The data returned by the API */
  data?: T;
  
  /** Whether the request was successful */
  success: boolean;
  
  /** Error message if the request failed */
  error?: string;
  
  /** Status code from the API */
  status?: number;
  
  /** Whether the response was loaded from cache */
  fromCache?: boolean;
  
  /** Response headers */
  headers?: Record<string, string>;
  
  /** Request ID for tracing */
  requestId?: string;
}

/**
 * Options for API requests
 */
export interface ApiRequestOptions {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  /** Request headers */
  headers?: Record<string, string>;
  
  /** Request body */
  body?: any;
  
  /** Query parameters */
  params?: Record<string, string>;
  
  /** Whether to cache the response */
  cache?: boolean;
  
  /** Time-to-live for cached responses in milliseconds */
  cacheTtl?: number;
  
  /** Whether the request can be performed offline */
  offlineCapable?: boolean;
  
  /** Type of offline operation for later execution */
  offlineOperationType?: string;
  
  /** Additional payload data for offline operation */
  offlineOperationPayload?: any;
  
  /** Whether to use circuit breaker */
  useCircuitBreaker?: boolean;
  
  /** Whether to use retries */
  useRetries?: boolean;
  
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  
  /** Additional context for logging */
  context?: Record<string, any>;
}

/**
 * Default request options
 */
const DEFAULT_REQUEST_OPTIONS: ApiRequestOptions = {
  method: 'GET',
  headers: {},
  cache: false,
  offlineCapable: false,
  useCircuitBreaker: true,
  useRetries: true,
  timeoutMs: 30000
};

/**
 * API client that uses resilience mechanisms
 */
export class ApiClient {
  /** Base URL for API requests */
  private baseUrl: string;
  
  /** Resilience manager for API requests */
  private resilienceManager: ResilienceManager;
  
  /** Default headers for all requests */
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  /** Response cache */
  private responseCache: Map<string, { data: any; expires: number }> = new Map();
  
  /**
   * Creates a new ApiClient
   * 
   * @param baseUrl Base URL for API requests
   * @param options Additional options
   */
  constructor(baseUrl: string, options: { defaultHeaders?: Record<string, string> } = {}) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    if (options.defaultHeaders) {
      this.defaultHeaders = {
        ...this.defaultHeaders,
        ...options.defaultHeaders
      };
    }
    
    // Initialize resilience manager
    this.resilienceManager = ResilienceManager.create('api-client');
    
    safeLogger.info('ApiClient', `Initialized with base URL: ${this.baseUrl}`);
  }
  
  /**
   * Makes a GET request
   * 
   * @param endpoint API endpoint
   * @param options Request options
   * @returns API response
   */
  async get<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET'
    });
  }
  
  /**
   * Makes a POST request
   * 
   * @param endpoint API endpoint
   * @param data Request body
   * @param options Request options
   * @returns API response
   */
  async post<T>(endpoint: string, data: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data
    });
  }
  
  /**
   * Makes a PUT request
   * 
   * @param endpoint API endpoint
   * @param data Request body
   * @param options Request options
   * @returns API response
   */
  async put<T>(endpoint: string, data: any, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data
    });
  }
  
  /**
   * Makes a DELETE request
   * 
   * @param endpoint API endpoint
   * @param options Request options
   * @returns API response
   */
  async delete<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }
  
  /**
   * Makes an API request with resilience mechanisms
   * 
   * @param endpoint API endpoint
   * @param options Request options
   * @returns API response
   */
  async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    const requestOptions: ApiRequestOptions = {
      ...DEFAULT_REQUEST_OPTIONS,
      ...options
    };
    
    const url = this.buildUrl(endpoint, requestOptions.params);
    const cacheKey = this.getCacheKey(url, requestOptions);
    
    // Check cache if enabled
    if (requestOptions.cache && requestOptions.method === 'GET') {
      const cachedResponse = this.getCachedResponse<T>(cacheKey);
      
      if (cachedResponse) {
        return {
          ...cachedResponse,
          fromCache: true
        };
      }
    }
    
    // Prepare headers
    const headers = {
      ...this.defaultHeaders,
      ...requestOptions.headers
    };
    
    // Prepare request init
    const requestInit: RequestInit = {
      method: requestOptions.method,
      headers,
      body: requestOptions.body ? JSON.stringify(requestOptions.body) : undefined
    };
    
    // Context for logging
    const context = {
      endpoint,
      method: requestOptions.method,
      ...requestOptions.context
    };
    
    try {
      // Execute request with resilience
      const response = await this.resilienceManager.execute(
        async (signal) => {
          // Add abort signal to request
          const requestWithSignal: RequestInit = {
            ...requestInit,
            signal
          };
          
          // Set up timeout
          const timeoutPromise = new Promise<Response>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Request timeout after ${requestOptions.timeoutMs}ms`));
            }, requestOptions.timeoutMs);
          });
          
          // Execute fetch with timeout
          const fetchPromise = fetch(url, requestWithSignal);
          const fetchResponse = await Promise.race([fetchPromise, timeoutPromise]);
          
          // Handle API errors
          if (!fetchResponse.ok) {
            const errorText = await fetchResponse.text();
            throw new Error(`API error: ${fetchResponse.status} ${fetchResponse.statusText} - ${errorText}`);
          }
          
          return fetchResponse;
        },
        {
          offlineCapable: requestOptions.offlineCapable,
          offlineOperationType: requestOptions.offlineOperationType || `${requestOptions.method}_${endpoint}`,
          offlineOperationPayload: requestOptions.offlineOperationPayload || requestOptions.body,
          context
        }
      );
      
      // Extract headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // Parse response
      const contentType = response.headers.get('content-type') || '';
      let data: T | undefined;
      
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/')) {
        data = await response.text() as unknown as T;
      } else {
        // Binary response
        data = await response.blob() as unknown as T;
      }
      
      const apiResponse: ApiResponse<T> = {
        data,
        success: true,
        status: response.status,
        headers: responseHeaders,
        requestId: responseHeaders['x-request-id']
      };
      
      // Cache response if enabled
      if (requestOptions.cache && requestOptions.method === 'GET') {
        this.cacheResponse(cacheKey, apiResponse, requestOptions.cacheTtl);
      }
      
      return apiResponse;
    } catch (error) {
      // Create error response
      const errorResponse: ApiResponse<T> = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      
      // Log error
      const errorMessage = error instanceof Error ? error.message : String(error);
      safeLogger.error('ApiClient', `Request failed: ${url} - ${errorMessage}`);
      
      return errorResponse;
    }
  }
  
  /**
   * Builds a URL from an endpoint and query parameters
   * 
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns Complete URL
   */
  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    try {
      const url = new URL(
        endpoint.startsWith('/') ? endpoint.substring(1) : endpoint,
        this.baseUrl
      );
      
      // Add query parameters
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }
      
      return url.toString();
    } catch (error) {
      safeLogger.error('ApiClient', 'Error building URL');
      return `${this.baseUrl}/${endpoint}`;
    }
  }
  
  /**
   * Gets a cache key for a request
   * 
   * @param url Request URL
   * @param options Request options
   * @returns Cache key
   */
  private getCacheKey(url: string, options: ApiRequestOptions): string {
    try {
      return `${options.method || 'GET'}_${url}`;
    } catch (error) {
      safeLogger.error('ApiClient', 'Error getting cache key');
      return url;
    }
  }
  
  /**
   * Gets a cached response if available and not expired
   * 
   * @param cacheKey Cache key
   * @returns Cached response or undefined
   */
  private getCachedResponse<T>(cacheKey: string): ApiResponse<T> | undefined {
    const cached = this.responseCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      safeLogger.debug('ApiClient', `Cache hit: ${cacheKey}`);
      return cached.data as ApiResponse<T>;
    }
    
    // Remove expired entry
    if (cached) {
      this.responseCache.delete(cacheKey);
    }
    
    return undefined;
  }
  
  /**
   * Caches a response
   * 
   * @param cacheKey Cache key
   * @param response Response to cache
   * @param ttl Time-to-live in milliseconds
   */
  private cacheResponse(cacheKey: string, response: ApiResponse<any>, ttl: number = 300000): void {
    try {
      this.responseCache.set(cacheKey, {
        data: response,
        expires: Date.now() + (ttl || 300000) // Default 5 minutes
      });
      
      safeLogger.debug('ApiClient', `Cached response: ${cacheKey}, expires in ${ttl}ms`);
    } catch (error) {
      safeLogger.error('ApiClient', 'Error caching response');
    }
  }
  
  /**
   * Clears the response cache
   */
  clearCache(): void {
    this.responseCache.clear();
    safeLogger.info('ApiClient', 'Response cache cleared');
  }
  
  /**
   * Syncs offline operations
   * 
   * @returns Result of the sync operation
   */
  async syncOfflineOperations() {
    return this.resilienceManager.syncOfflineOperations();
  }
  
  /**
   * Gets the health status of resilience components
   * 
   * @returns Health status
   */
  getHealth() {
    return this.resilienceManager.getHealth();
  }
  
  /**
   * Resets resilience components
   */
  resetResilience(): void {
    this.resilienceManager.reset();
  }
  
  /**
   * Checks if the client is online
   * 
   * @returns True if online
   */
  async isOnline(): Promise<boolean> {
    return this.resilienceManager.checkConnectivity();
  }
} 
/**
 * ApiResilienceDemo - Example usage of API resilience components
 * 
 * Demonstrates how to use the API resilience components in a typical Obsidian plugin.
 */

import { ApiClient, ApiRequestOptions } from '../ApiClient';
import safeLogger from '../../../logging/safe-logger';
import { ResilienceManager } from '../ResilienceManager';
import { RetryPolicy } from '../RetryPolicy';
import { CircuitBreaker } from '../CircuitBreaker';
import { OfflineSupport, OfflineEventType } from '../OfflineSupport';

/**
 * Example response from a weather API
 */
interface WeatherResponse {
  temperature: number;
  humidity: number;
  description: string;
  location: string;
  updatedAt: string;
}

/**
 * Mock API base URL (replace with a real API in production)
 */
const API_BASE_URL = 'https://api.example.com/v1';

/**
 * Demonstrates the usage of the API resilience components
 */
export class ApiResilienceDemo {
  /** API client with resilience mechanisms */
  private apiClient: ApiClient;
  
  /** Custom resilience manager for direct usage */
  private customResilienceManager: ResilienceManager;
  
  /**
   * Creates a new API resilience demo
   */
  constructor() {
    // Initialize API client
    this.apiClient = new ApiClient(API_BASE_URL, {
      defaultHeaders: {
        'X-Api-Key': 'YOUR_API_KEY', // Replace with actual API key
        'User-Agent': 'OnieroMetrics-Obsidian-Plugin/1.0'
      }
    });
    
    // Initialize custom resilience manager for direct usage
    this.customResilienceManager = ResilienceManager.create('custom-operations');
    
    safeLogger.info('ApiResilienceDemo', 'Demo initialized');
    
    // Set up listeners for offline events
    this.setupOfflineListeners();
  }
  
  /**
   * Sets up listeners for offline events
   */
  private setupOfflineListeners(): void {
    const offlineSupport = this.customResilienceManager.getOfflineSupport();
    
    if (!offlineSupport) {
      return;
    }
    
    // Listen for connection status changes
    offlineSupport.addEventListener(
      OfflineEventType.CONNECTION_STATUS_CHANGED,
      (_, data) => {
        safeLogger.info('ApiResilienceDemo', `Connection status changed: ${data.oldStatus} -> ${data.newStatus}`);
        
        // Show notification to user
        if (data.newStatus === 'online') {
          this.notifyUser('You are back online! Syncing offline changes...');
          this.syncOfflineOperations();
        } else if (data.newStatus === 'offline') {
          this.notifyUser('You are offline. Changes will be saved and synced when you reconnect.');
        }
      }
    );
    
    // Listen for sync completed events
    offlineSupport.addEventListener(
      OfflineEventType.SYNC_COMPLETED,
      (_, data) => {
        safeLogger.info('ApiResilienceDemo', `Sync completed: ${data.successCount} succeeded, ${data.failureCount} failed`);
        
        if (data.successCount > 0) {
          this.notifyUser(`Successfully synced ${data.successCount} operations.`);
        }
        
        if (data.failureCount > 0) {
          this.notifyUser(`Failed to sync ${data.failureCount} operations. Will try again later.`);
        }
      }
    );
  }
  
  /**
   * Demonstrates how to use the API client with resilience
   */
  async demonstrateApiClient(): Promise<void> {
    try {
      // Example 1: Basic GET request
      const weatherResponse = await this.apiClient.get<WeatherResponse>('/weather', {
        params: {
          location: 'London',
          units: 'metric'
        },
        cache: true,
        cacheTtl: 60000, // Cache for 1 minute
        offlineCapable: true
      });
      
      if (weatherResponse.success) {
        safeLogger.info('ApiResilienceDemo', `Current weather: ${weatherResponse.data?.description}, ${weatherResponse.data?.temperature}°C`);
      } else {
        safeLogger.warn('ApiResilienceDemo', `Failed to get weather: ${weatherResponse.error}`);
      }
      
      // Example 2: POST request
      const updateResponse = await this.apiClient.post('/user/preferences', {
        theme: 'dark',
        notifications: true,
        language: 'en'
      }, {
        offlineCapable: true,
        offlineOperationType: 'user_preferences_update'
      });
      
      if (updateResponse.success) {
        safeLogger.info('ApiResilienceDemo', 'User preferences updated successfully');
      } else {
        safeLogger.warn('ApiResilienceDemo', `Failed to update preferences: ${updateResponse.error}`);
      }
      
      // Example 3: Check health of resilience components
      const health = this.apiClient.getHealth();
      safeLogger.info('ApiResilienceDemo', 'Resilience health:', health);
      
    } catch (error) {
      safeLogger.error('ApiResilienceDemo', 'Error in API demo');
    }
  }
  
  /**
   * Demonstrates direct usage of resilience components
   */
  async demonstrateDirectResilienceUsage(): Promise<void> {
    try {
      // Example 1: Using RetryPolicy directly
      const retryPolicy = RetryPolicy.createAggressive();
      
      // Example 2: Using CircuitBreaker directly
      const circuitBreaker = CircuitBreaker.create({
        name: 'demo-circuit',
        failureThreshold: 50,
        resetTimeoutMs: 30000
      });
      
      // Example 3: Execute an operation with resilience manager
      const result = await this.customResilienceManager.execute(
        async () => {
          // Simulate a complex operation
          await this.simulateOperation();
          return { success: true, message: 'Operation completed' };
        },
        {
          offlineCapable: true,
          offlineOperationType: 'complex_operation'
        }
      );
      
      safeLogger.info('ApiResilienceDemo', 'Operation result:', result);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('queued for offline')) {
        safeLogger.info('ApiResilienceDemo', 'Operation queued for offline execution');
      } else {
        safeLogger.error('ApiResilienceDemo', 'Error in resilience demo');
      }
    }
  }
  
  /**
   * Synchronizes offline operations
   */
  async syncOfflineOperations(): Promise<void> {
    try {
      // Sync API client operations
      const apiClientResult = await this.apiClient.syncOfflineOperations();
      safeLogger.info('ApiResilienceDemo', `API client sync: ${apiClientResult.successCount} succeeded, ${apiClientResult.failureCount} failed`);
      
      // Sync custom operations
      const customResult = await this.customResilienceManager.syncOfflineOperations();
      safeLogger.info('ApiResilienceDemo', `Custom sync: ${customResult.successCount} succeeded, ${customResult.failureCount} failed`);
      
    } catch (error) {
      safeLogger.error('ApiResilienceDemo', 'Error syncing offline operations');
    }
  }
  
  /**
   * Simulates a complex operation (for demonstration purposes)
   */
  private async simulateOperation(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Randomly fail to demonstrate resilience
    const shouldFail = Math.random() < 0.3;
    if (shouldFail) {
      throw new Error('Simulated operation failure');
    }
  }
  
  /**
   * Shows a notification to the user (would be implemented by the plugin)
   * 
   * @param message Message to show
   */
  private notifyUser(message: string): void {
    // In a real Obsidian plugin, this would use Obsidian's notification API
    safeLogger.info('ApiResilienceDemo', `NOTIFICATION: ${message}`);
    console.log(`NOTIFICATION: ${message}`);
  }
  
  /**
   * Checks if the user is online
   * 
   * @returns True if online
   */
  async isOnline(): Promise<boolean> {
    return this.apiClient.isOnline();
  }
  
  /**
   * Disposes of resources
   */
  dispose(): void {
    this.customResilienceManager.dispose();
    safeLogger.info('ApiResilienceDemo', 'Demo disposed');
  }
}

/**
 * Main entry point to run the demo
 */
async function runDemo() {
  const demo = new ApiResilienceDemo();
  
  safeLogger.info('ApiResilienceDemo', 'Starting API resilience demo...');
  
  // Check if online
  const isOnline = await demo.isOnline();
  safeLogger.info('ApiResilienceDemo', `Online status: ${isOnline ? 'Online' : 'Offline'}`);
  
  // Run demos
  await demo.demonstrateApiClient();
  await demo.demonstrateDirectResilienceUsage();
  
  // Sync offline operations if online
  if (isOnline) {
    await demo.syncOfflineOperations();
  }
  
  safeLogger.info('ApiResilienceDemo', 'Demo completed');
  
  // Clean up
  demo.dispose();
}

// Uncomment to run the demo
// runDemo().catch(error => {
//   safeLogger.error('ApiResilienceDemo', 'Unhandled error in demo', error);
// });

export { runDemo }; 
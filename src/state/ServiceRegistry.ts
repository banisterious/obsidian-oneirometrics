/**
 * Service Registry for the OOMP plugin
 * 
 * This module provides a centralized registry for service dependencies,
 * helping to resolve initialization order issues and allowing components
 * to find their dependencies in a controlled manner.
 * 
 * Enhanced with defensive coding features to ensure robustness.
 */

import safeLogger from '../logging/safe-logger';
import { getSafe, withErrorHandling } from '../utils/defensive-utils';

/**
 * Type for a service factory function that can create a service
 * if it doesn't exist yet
 */
export type ServiceFactory<T> = () => T;

/**
 * Type for a fallback service that can be used when a service is not found
 */
export type ServiceFallback<T> = T;

/**
 * The main Service Registry for the OOMP plugin
 */
export class ServiceRegistry {
  // Singleton instance
  private static instance: ServiceRegistry;
  
  // Map of service names to service instances
  private services: Map<string, any> = new Map();
  
  // Map of service names to factory functions
  private factories: Map<string, ServiceFactory<any>> = new Map();
  
  // Map of service names to fallback implementations
  private fallbacks: Map<string, any> = new Map();
  
  // Private constructor to enforce singleton pattern
  private constructor() {}
  
  /**
   * Get the singleton instance of the service registry
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
      
      // Log the creation of the service registry
      try {
        safeLogger.debug('ServiceRegistry', 'Registry initialized');
      } catch (error) {
        console.debug('ServiceRegistry initialized');
      }
    }
    return ServiceRegistry.instance;
  }
  
  /**
   * Register a service in the registry
   * 
   * @param name The name of the service
   * @param service The service instance
   */
  public register<T>(name: string, service: T): void {
    if (this.services.has(name)) {
      try {
        safeLogger.warn('ServiceRegistry', `Service ${name} already registered, overwriting`);
      } catch (error) {
        console.warn(`ServiceRegistry: Service ${name} already registered, overwriting`);
      }
    }
    
    this.services.set(name, service);
    
    try {
      safeLogger.debug('ServiceRegistry', `Registered service: ${name}`);
    } catch (error) {
      console.debug(`Registered service: ${name}`);
    }
  }
  
  /**
   * Register a factory function that can create a service on demand
   * 
   * @param name The name of the service
   * @param factory A function that creates the service
   */
  public registerFactory<T>(name: string, factory: ServiceFactory<T>): void {
    this.factories.set(name, factory);
    
    try {
      safeLogger.debug('ServiceRegistry', `Registered factory for service: ${name}`);
    } catch (error) {
      console.debug(`Registered factory for service: ${name}`);
    }
  }
  
  /**
   * Register a fallback implementation for a service
   * This fallback will be used when the service is not found
   * 
   * @param name The name of the service
   * @param fallback The fallback implementation
   */
  public registerFallback<T>(name: string, fallback: T): void {
    this.fallbacks.set(name, fallback);
    
    try {
      safeLogger.debug('ServiceRegistry', `Registered fallback for service: ${name}`);
    } catch (error) {
      console.debug(`Registered fallback for service: ${name}`);
    }
  }
  
  /**
   * Get a service from the registry
   * 
   * @param name The name of the service
   * @returns The service instance or null if not found
   */
  public get<T>(name: string): T | null {
    // If service exists, return it
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }
    
    // If we have a factory for this service, create and register it
    if (this.factories.has(name)) {
      try {
        const factory = this.factories.get(name)!;
        const service = factory();
        this.register(name, service);
        return service as T;
      } catch (error) {
        try {
          safeLogger.error('ServiceRegistry', `Error creating service ${name}`, error);
        } catch (e) {
          console.error(`Error creating service ${name}:`, error);
        }
        return null;
      }
    }
    
    // Log warning about missing service
    try {
      safeLogger.warn('ServiceRegistry', `Service not found: ${name}`);
    } catch (error) {
      console.warn(`ServiceRegistry: Service not found: ${name}`);
    }
    
    return null;
  }
  
  /**
   * Get a service with a fallback if not found
   * This provides a defensive way to access services
   * 
   * @param name The name of the service
   * @param fallback The fallback implementation to use if service is not found
   * @returns The service instance or the fallback
   */
  public getSafe<T>(name: string, fallback: T): T {
    // Try to get the service
    const service = this.get<T>(name);
    
    // If service exists, return it
    if (service !== null) {
      return service;
    }
    
    // If we have a registered fallback, use that instead
    if (this.fallbacks.has(name)) {
      try {
        safeLogger.debug('ServiceRegistry', `Using registered fallback for service: ${name}`);
      } catch (error) {
        console.debug(`Using registered fallback for service: ${name}`);
      }
      return this.fallbacks.get(name) as T;
    }
    
    // Otherwise use the provided fallback
    try {
      safeLogger.debug('ServiceRegistry', `Using provided fallback for service: ${name}`);
    } catch (error) {
      console.debug(`Using provided fallback for service: ${name}`);
    }
    
    return fallback;
  }
  
  /**
   * Safely call a method on a service with error handling
   * 
   * @param name The name of the service
   * @param methodName The name of the method to call
   * @param args The arguments to pass to the method
   * @param fallbackValue The value to return if the call fails
   * @returns The result of the method call or the fallback value
   */
  public safeCall<T, R>(
    name: string, 
    methodName: string, 
    args: any[] = [], 
    fallbackValue: R
  ): R {
    try {
      const service = this.getSafe<T>(name, null as unknown as T);
      
      // If we only have the null fallback and no service, return the fallback value
      if (service === null) {
        return fallbackValue;
      }
      
      // Check if the method exists on the service
      if (typeof (service as any)[methodName] !== 'function') {
        safeLogger.warn('ServiceRegistry', `Method ${methodName} not found on service ${name}`);
        return fallbackValue;
      }
      
      // Call the method and return the result
      return (service as any)[methodName](...args);
    } catch (error) {
      safeLogger.error('ServiceRegistry', `Error calling ${methodName} on service ${name}`, error);
      return fallbackValue;
    }
  }
  
  /**
   * Check if a service exists in the registry
   * 
   * @param name The name of the service
   * @returns True if the service exists, false otherwise
   */
  public has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }
  
  /**
   * Check if a fallback exists for a service
   * 
   * @param name The name of the service
   * @returns True if a fallback exists, false otherwise
   */
  public hasFallback(name: string): boolean {
    return this.fallbacks.has(name);
  }
  
  /**
   * List all registered services
   * 
   * @returns Array of service names
   */
  public listServices(): string[] {
    return Array.from(this.services.keys());
  }
  
  /**
   * List all registered fallbacks
   * 
   * @returns Array of fallback service names
   */
  public listFallbacks(): string[] {
    return Array.from(this.fallbacks.keys());
  }
  
  /**
   * Clear all services (mainly for testing)
   */
  public clear(): void {
    this.services.clear();
    this.factories.clear();
    this.fallbacks.clear();
    
    try {
      safeLogger.debug('ServiceRegistry', 'Registry cleared');
    } catch (error) {
      console.debug('Registry cleared');
    }
  }
}

/**
 * Helper function to get the registry instance
 * This provides a more concise way to access the registry
 */
export function getServiceRegistry(): ServiceRegistry {
  return ServiceRegistry.getInstance();
}

/**
 * Helper function to register a service
 * 
 * @param name The name of the service
 * @param service The service instance
 */
export function registerService<T>(name: string, service: T): void {
  ServiceRegistry.getInstance().register(name, service);
}

/**
 * Helper function to register a fallback for a service
 * 
 * @param name The name of the service
 * @param fallback The fallback implementation
 */
export function registerFallback<T>(name: string, fallback: T): void {
  ServiceRegistry.getInstance().registerFallback(name, fallback);
}

/**
 * Helper function to get a service
 * 
 * @param name The name of the service
 * @returns The service instance or null if not found
 */
export function getService<T>(name: string): T | null {
  return ServiceRegistry.getInstance().get<T>(name);
}

/**
 * Helper function to get a service with a fallback
 * 
 * @param name The name of the service
 * @param fallback The fallback to use if service is not found
 * @returns The service instance or the fallback
 */
export function getServiceSafe<T>(name: string, fallback: T): T {
  return ServiceRegistry.getInstance().getSafe<T>(name, fallback);
}

/**
 * Helper function to safely call a method on a service
 * 
 * @param name The name of the service
 * @param methodName The method to call
 * @param args The arguments to pass to the method
 * @param fallbackValue The value to return if the call fails
 * @returns The result of the method call or the fallback value
 */
export function safeCall<T, R>(
  name: string, 
  methodName: string, 
  args: any[] = [], 
  fallbackValue: R
): R {
  return ServiceRegistry.getInstance().safeCall<T, R>(name, methodName, args, fallbackValue);
}

/**
 * Register a settings adapter with the registry
 * This is a convenience function for the common case of registering settings
 * 
 * @param settingsAdapter The settings adapter instance
 */
export function registerSettings(settingsAdapter: any): void {
  registerService(SERVICE_NAMES.SETTINGS, settingsAdapter);
}

/**
 * Get the settings adapter from the registry
 * This is a convenience function for the common case of getting settings
 * 
 * @returns The settings adapter or null if not found
 */
export function getSettings<T = any>(): T | null {
  return getService<T>(SERVICE_NAMES.SETTINGS);
}

/**
 * Get the settings adapter with a fallback
 * 
 * @param fallback The fallback settings to use if not found
 * @returns The settings adapter or the fallback
 */
export function getSettingsSafe<T = any>(fallback: T): T {
  return getServiceSafe<T>(SERVICE_NAMES.SETTINGS, fallback);
}

// Export registry constants
export const SERVICE_NAMES = {
  SETTINGS: 'settings',
  LOGGER: 'logger',
  STATE: 'state',
  DATE_NAVIGATOR: 'dateNavigator',
  TIME_FILTER: 'timeFilter',
  DREAM_JOURNAL: 'dreamJournal',
  CONTENT_PARSER: 'contentParser',
  METRICS_PROCESSOR: 'metricsProcessor',
  TEMPLATER: 'templater'
}; 
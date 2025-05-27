/**
 * Service Registry for the OOMP plugin
 * 
 * This module provides a centralized registry for service dependencies,
 * helping to resolve initialization order issues and allowing components
 * to find their dependencies in a controlled manner.
 */

import safeLogger from '../logging/safe-logger';

/**
 * Type for a service factory function that can create a service
 * if it doesn't exist yet
 */
export type ServiceFactory<T> = () => T;

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
   * Check if a service exists in the registry
   * 
   * @param name The name of the service
   * @returns True if the service exists, false otherwise
   */
  public has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
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
   * Clear all services (mainly for testing)
   */
  public clear(): void {
    this.services.clear();
    this.factories.clear();
    
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
 * Helper function to get a service
 * 
 * @param name The name of the service
 * @returns The service instance or null if not found
 */
export function getService<T>(name: string): T | null {
  return ServiceRegistry.getInstance().get<T>(name);
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
  return getService<T>('settings');
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
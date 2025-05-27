/**
 * EventBus implementation with defensive coding patterns
 * 
 * Provides a centralized event bus for component communication with
 * robust error handling and defensive programming.
 */

import { withErrorHandling, isNonEmptyString } from '../utils/defensive-utils';
import safeLogger from '../logging/safe-logger';
import { EventManager } from './EventManager';
import { 
  EventHandler, 
  EventSubscriptionOptions,
  AppEvents
} from './event-types';

/**
 * A centralized event bus for component communication
 */
export class EventBus {
  /**
   * The event manager instance
   */
  private eventManager: EventManager;
  
  /**
   * Singleton instance
   */
  private static instance: EventBus;
  
  /**
   * Gets the singleton instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.eventManager = EventManager.getInstance();
  }
  
  /**
   * Subscribe to an event
   * 
   * @param eventName The name of the event to subscribe to
   * @param handler The function to call when the event is emitted
   * @param options Optional subscription options
   * @returns A function to unsubscribe
   */
  subscribe = withErrorHandling(
    (
      eventName: string | AppEvents, 
      handler: EventHandler, 
      options?: EventSubscriptionOptions
    ): () => void => {
      // Convert enum to string using String() constructor instead of toString()
      const eventNameStr = typeof eventName === 'string' ? eventName : String(eventName);
      
      return this.eventManager.on(eventNameStr, handler, options);
    },
    {
      fallbackValue: () => {}, // Return no-op function as fallback
      errorMessage: "Failed to subscribe to event",
      onError: (error) => safeLogger.error('EventBus', 'Error in subscribe method', error)
    }
  );
  
  /**
   * Subscribe to an event once
   * 
   * @param eventName The name of the event to subscribe to
   * @param handler The function to call when the event is emitted
   * @param options Optional subscription options
   * @returns A function to unsubscribe
   */
  subscribeOnce = withErrorHandling(
    (
      eventName: string | AppEvents, 
      handler: EventHandler, 
      options?: Omit<EventSubscriptionOptions, 'once'>
    ): () => void => {
      // Convert enum to string using String() constructor instead of toString()
      const eventNameStr = typeof eventName === 'string' ? eventName : String(eventName);
      
      return this.eventManager.once(eventNameStr, handler, options);
    },
    {
      fallbackValue: () => {}, // Return no-op function as fallback
      errorMessage: "Failed to subscribe to event once",
      onError: (error) => safeLogger.error('EventBus', 'Error in subscribeOnce method', error)
    }
  );
  
  /**
   * Publish an event
   * 
   * @param eventName The name of the event to publish
   * @param args Arguments to pass to the event handlers
   */
  publish = withErrorHandling(
    (eventName: string | AppEvents, ...args: any[]): void => {
      // Convert enum to string using String() constructor instead of toString()
      const eventNameStr = typeof eventName === 'string' ? eventName : String(eventName);
      
      this.eventManager.emit(eventNameStr, ...args);
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to publish event",
      onError: (error) => safeLogger.error('EventBus', 'Error in publish method', error)
    }
  );
  
  /**
   * Unsubscribe from an event
   * 
   * @param eventName The name of the event to unsubscribe from
   * @param handler The handler to remove (if not provided, all handlers are removed)
   */
  unsubscribe = withErrorHandling(
    (eventName: string | AppEvents, handler?: EventHandler): void => {
      // Convert enum to string using String() constructor instead of toString()
      const eventNameStr = typeof eventName === 'string' ? eventName : String(eventName);
      
      this.eventManager.off(eventNameStr, handler);
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to unsubscribe from event",
      onError: (error) => safeLogger.error('EventBus', 'Error in unsubscribe method', error)
    }
  );
  
  /**
   * Check if an event has subscribers
   * 
   * @param eventName The name of the event to check
   * @returns True if the event has subscribers
   */
  hasSubscribers = withErrorHandling(
    (eventName: string | AppEvents): boolean => {
      // Convert enum to string using String() constructor instead of toString()
      const eventNameStr = typeof eventName === 'string' ? eventName : String(eventName);
      
      return this.eventManager.hasListeners(eventNameStr);
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to check if event has subscribers",
      onError: (error) => safeLogger.error('EventBus', 'Error in hasSubscribers method', error)
    }
  );
  
  /**
   * Count the subscribers for an event
   * 
   * @param eventName The name of the event to count subscribers for
   * @returns The number of subscribers
   */
  subscriberCount = withErrorHandling(
    (eventName: string | AppEvents): number => {
      // Convert enum to string using String() constructor instead of toString()
      const eventNameStr = typeof eventName === 'string' ? eventName : String(eventName);
      
      return this.eventManager.listenerCount(eventNameStr);
    },
    {
      fallbackValue: 0,
      errorMessage: "Failed to count event subscribers",
      onError: (error) => safeLogger.error('EventBus', 'Error in subscriberCount method', error)
    }
  );
  
  /**
   * Reset the event bus by removing all handlers
   */
  reset(): void {
    try {
      this.eventManager.removeAllListeners();
      safeLogger.debug('EventBus', 'Event bus reset');
    } catch (error) {
      safeLogger.error('EventBus', 'Error resetting event bus', error);
    }
  }
  
  /**
   * Get debug information about the event bus
   */
  debug(): Record<string, any> {
    try {
      return this.eventManager.debug();
    } catch (error) {
      safeLogger.error('EventBus', 'Error getting debug info', error);
      return {};
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    try {
      this.reset();
      // The EventManager singleton will be cleaned up separately
      safeLogger.debug('EventBus', 'Event bus cleaned up');
    } catch (error) {
      safeLogger.error('EventBus', 'Error cleaning up event bus', error);
    }
  }
} 
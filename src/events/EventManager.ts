/**
 * EventManager implementation with defensive coding patterns
 * 
 * Provides a robust event management system with error handling, memory leak prevention,
 * and defensive programming practices to improve reliability.
 */

import { withErrorHandling, isNonEmptyString } from '../utils/defensive-utils';
import safeLogger from '../logging/safe-logger';
import { 
  EventHandler, 
  EventErrorHandler, 
  EventSubscriptionOptions,
  EventEmission,
  EventDebugInfo
} from './event-types';

/**
 * Event handler entry with additional metadata
 */
interface EventHandlerEntry {
  /** The handler function */
  handler: EventHandler;
  /** Whether this is a one-time handler */
  once: boolean;
  /** Unique identifier for the handler */
  id: number;
  /** Timestamp when the handler was registered */
  registeredAt: number;
  /** Custom error handler for this subscription */
  errorHandler?: EventErrorHandler;
  /** Maximum lifetime in milliseconds (0 means no limit) */
  maxLifetime: number;
  /** Additional context associated with the handler */
  context?: any;
}

/**
 * Manages event subscriptions and dispatching with robust error handling
 */
export class EventManager {
  /**
   * Map of event names to their handlers
   */
  private events: Map<string, EventHandlerEntry[]> = new Map();
  
  /**
   * Counter for generating unique handler IDs
   */
  private handlerIdCounter: number = 0;
  
  /**
   * Maximum number of listeners per event (for memory leak detection)
   */
  private maxListeners: number = 10;
  
  /**
   * Whether event emission is currently in progress (to prevent recursion)
   */
  private isEmitting: boolean = false;
  
  /**
   * Queue of events that should be emitted after current emission completes
   */
  private pendingEmissions: EventEmission[] = [];
  
  /**
   * Default error handler for event execution errors
   */
  private defaultErrorHandler: EventErrorHandler = (error, eventName, handler) => {
    safeLogger.error(
      'EventManager', 
      `Error in handler for event '${eventName}'`, 
      error
    );
  };
  
  /**
   * Track emission stats for debugging
   */
  private emissionStats: Map<string, {
    count: number;
    lastTimestamp: number;
  }> = new Map();
  
  /**
   * Interval for cleaning up expired handlers
   */
  private cleanupInterval: any = null;
  
  /**
   * Singleton instance
   */
  private static instance: EventManager;
  
  /**
   * Gets the singleton instance
   */
  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Setup periodic cleanup of expired handlers
    this.cleanupInterval = setInterval(() => this.cleanupExpiredHandlers(), 60000);
  }
  
  /**
   * Subscribe to an event
   * 
   * @param eventName The name of the event to subscribe to
   * @param handler The function to call when the event is emitted
   * @param options Optional subscription options
   * @returns A function to unsubscribe
   */
  on = withErrorHandling(
    (
      eventName: string, 
      handler: EventHandler, 
      options?: EventSubscriptionOptions
    ): () => void => {
      if (!isNonEmptyString(eventName)) {
        throw new Error('Event name must be a non-empty string');
      }
      
      if (typeof handler !== 'function') {
        throw new Error('Event handler must be a function');
      }
      
      const once = options?.once || false;
      const errorHandler = options?.errorHandler;
      const maxLifetime = options?.maxLifetime || 0;
      const context = options?.context;
      
      return this.addListener(eventName, handler, once, errorHandler, maxLifetime, context);
    },
    {
      fallbackValue: () => {}, // Return no-op function as fallback
      errorMessage: "Failed to subscribe to event",
      onError: (error) => safeLogger.error('EventManager', 'Error in on method', error)
    }
  );
  
  /**
   * Subscribe to an event and receive only the first emission
   * 
   * @param eventName The name of the event to subscribe to
   * @param handler The function to call when the event is emitted
   * @param options Optional subscription options (once will be set to true)
   * @returns A function to unsubscribe
   */
  once = withErrorHandling(
    (
      eventName: string, 
      handler: EventHandler, 
      options?: Omit<EventSubscriptionOptions, 'once'>
    ): () => void => {
      if (!isNonEmptyString(eventName)) {
        throw new Error('Event name must be a non-empty string');
      }
      
      if (typeof handler !== 'function') {
        throw new Error('Event handler must be a function');
      }
      
      const errorHandler = options?.errorHandler;
      const maxLifetime = options?.maxLifetime || 0;
      const context = options?.context;
      
      return this.addListener(eventName, handler, true, errorHandler, maxLifetime, context);
    },
    {
      fallbackValue: () => {}, // Return no-op function as fallback
      errorMessage: "Failed to subscribe to event once",
      onError: (error) => safeLogger.error('EventManager', 'Error in once method', error)
    }
  );
  
  /**
   * Emit an event with the given arguments
   * 
   * @param eventName The name of the event to emit
   * @param args Arguments to pass to the event handlers
   */
  emit = withErrorHandling(
    (eventName: string, ...args: any[]): void => {
      if (!isNonEmptyString(eventName)) {
        safeLogger.warn('EventManager', 'Attempted to emit event with invalid name');
        return;
      }
      
      // Track emission stats
      this.recordEmission(eventName);
      
      // Prevent recursive emissions by queueing them
      if (this.isEmitting) {
        this.queueEmission(eventName, args);
        return;
      }
      
      try {
        this.isEmitting = true;
        const handlers = this.events.get(eventName);
        
        if (!handlers || handlers.length === 0) {
          safeLogger.debug('EventManager', `No handlers for event: ${eventName}`);
          return;
        }
        
        // Create a defensive copy to prevent issues if handlers are added/removed during emission
        const handlersCopy = [...handlers];
        
        // Track handlers to remove after emission
        const toRemove: number[] = [];
        
        // Call each handler safely
        handlersCopy.forEach(entry => {
          try {
            // Check if the handler has expired
            if (entry.maxLifetime > 0) {
              const age = Date.now() - entry.registeredAt;
              if (age > entry.maxLifetime) {
                toRemove.push(entry.id);
                return;
              }
            }
            
            // Call the handler with the provided arguments
            entry.handler.apply(entry.context, args);
            
            // Mark one-time handlers for removal
            if (entry.once) {
              toRemove.push(entry.id);
            }
          } catch (error) {
            // Use the handler's custom error handler or the default
            const errorHandler = entry.errorHandler || this.defaultErrorHandler;
            errorHandler(
              error instanceof Error ? error : new Error(String(error)),
              eventName,
              entry.handler
            );
          }
        });
        
        // Remove one-time handlers and expired handlers that were executed
        if (toRemove.length > 0 && this.events.has(eventName)) {
          this.removeHandlersByIds(eventName, toRemove);
        }
      } finally {
        this.isEmitting = false;
        
        // Process any events that were queued during emission
        this.processPendingEmissions();
      }
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to emit event",
      onError: (error) => safeLogger.error('EventManager', 'Error in emit method', error)
    }
  );
  
  /**
   * Record emission statistics for an event
   */
  private recordEmission(eventName: string): void {
    try {
      if (!this.emissionStats.has(eventName)) {
        this.emissionStats.set(eventName, {
          count: 0,
          lastTimestamp: 0
        });
      }
      
      const stats = this.emissionStats.get(eventName)!;
      stats.count++;
      stats.lastTimestamp = Date.now();
    } catch (error) {
      safeLogger.error('EventManager', 'Error recording emission stats', error);
    }
  }
  
  /**
   * Queue an event for later emission
   */
  private queueEmission(eventName: string, args: any[]): void {
    try {
      this.pendingEmissions.push({
        eventName,
        args,
        timestamp: Date.now(),
        id: `${eventName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
      
      // Cap the queue size to prevent memory issues
      if (this.pendingEmissions.length > 100) {
        safeLogger.warn(
          'EventManager',
          `Event queue exceeds 100 items. Dropping oldest events.`
        );
        this.pendingEmissions = this.pendingEmissions.slice(-100);
      }
    } catch (error) {
      safeLogger.error('EventManager', 'Error queueing emission', error);
    }
  }
  
  /**
   * Process any events that were queued during emission
   */
  private processPendingEmissions(): void {
    if (this.pendingEmissions.length === 0) {
      return;
    }
    
    // Take a copy of the pending emissions and clear the queue
    const emissions = [...this.pendingEmissions];
    this.pendingEmissions = [];
    
    // Process each emission (limited to avoid infinite loops)
    const MAX_BATCH = 25;
    const batch = emissions.slice(0, MAX_BATCH);
    
    for (const emission of batch) {
      this.emit(emission.eventName, ...emission.args);
    }
    
    // If there are more emissions, queue them for the next cycle
    if (emissions.length > MAX_BATCH) {
      setTimeout(() => {
        this.pendingEmissions = [
          ...this.pendingEmissions,
          ...emissions.slice(MAX_BATCH)
        ];
        this.processPendingEmissions();
      }, 0);
    }
  }
  
  /**
   * Remove handlers by their IDs
   */
  private removeHandlersByIds(eventName: string, ids: number[]): void {
    try {
      if (!this.events.has(eventName)) {
        return;
      }
      
      const handlers = this.events.get(eventName)!;
      const filteredHandlers = handlers.filter(entry => !ids.includes(entry.id));
      
      if (filteredHandlers.length === 0) {
        this.events.delete(eventName);
      } else {
        this.events.set(eventName, filteredHandlers);
      }
    } catch (error) {
      safeLogger.error('EventManager', 'Error removing handlers by IDs', error);
    }
  }
  
  /**
   * Remove an event handler
   * 
   * @param eventName The name of the event to remove the handler from
   * @param handler The handler to remove (if not provided, all handlers for the event are removed)
   */
  off = withErrorHandling(
    (eventName: string, handler?: EventHandler): void => {
      if (!isNonEmptyString(eventName)) {
        safeLogger.warn('EventManager', 'Attempted to unsubscribe from event with invalid name');
        return;
      }
      
      if (!this.events.has(eventName)) {
        return;
      }
      
      if (!handler) {
        // Remove all handlers for this event
        this.events.delete(eventName);
        return;
      }
      
      // Find and remove the specific handler
      const handlers = this.events.get(eventName)!;
      const filteredHandlers = handlers.filter(entry => entry.handler !== handler);
      
      if (filteredHandlers.length === 0) {
        this.events.delete(eventName);
      } else {
        this.events.set(eventName, filteredHandlers);
      }
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to unsubscribe from event",
      onError: (error) => safeLogger.error('EventManager', 'Error in off method', error)
    }
  );
  
  /**
   * Remove all event handlers
   * 
   * @param eventName If provided, only remove handlers for this event
   */
  removeAllListeners = withErrorHandling(
    (eventName?: string): void => {
      if (eventName) {
        if (isNonEmptyString(eventName)) {
          this.events.delete(eventName);
        }
      } else {
        this.events.clear();
      }
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to remove all listeners",
      onError: (error) => safeLogger.error('EventManager', 'Error in removeAllListeners method', error)
    }
  );
  
  /**
   * Get the number of listeners for an event
   * 
   * @param eventName The name of the event
   * @returns The number of listeners
   */
  listenerCount = withErrorHandling(
    (eventName: string): number => {
      if (!isNonEmptyString(eventName)) {
        return 0;
      }
      
      const handlers = this.events.get(eventName);
      return handlers ? handlers.length : 0;
    },
    {
      fallbackValue: 0,
      errorMessage: "Failed to get listener count",
      onError: (error) => safeLogger.error('EventManager', 'Error in listenerCount method', error)
    }
  );
  
  /**
   * Set the maximum number of listeners per event
   * 
   * @param count The maximum number of listeners
   */
  setMaxListeners(count: number): void {
    if (typeof count !== 'number' || count < 0) {
      safeLogger.warn('EventManager', 'Invalid max listeners count, using default of 10');
      this.maxListeners = 10;
      return;
    }
    
    this.maxListeners = count;
  }
  
  /**
   * Get all event names that have active listeners
   * 
   * @returns An array of event names
   */
  eventNames(): string[] {
    return Array.from(this.events.keys());
  }
  
  /**
   * Check if an event has listeners
   * 
   * @param eventName The event name to check
   * @returns True if the event has listeners
   */
  hasListeners(eventName: string): boolean {
    try {
      if (!isNonEmptyString(eventName)) {
        return false;
      }
      
      return this.events.has(eventName) && this.events.get(eventName)!.length > 0;
    } catch (error) {
      safeLogger.error('EventManager', 'Error in hasListeners method', error);
      return false;
    }
  }
  
  /**
   * Clean up expired handlers
   */
  private cleanupExpiredHandlers(): void {
    try {
      const now = Date.now();
      let count = 0;
      
      for (const [eventName, handlers] of this.events.entries()) {
        const expiredIds = handlers
          .filter(entry => entry.maxLifetime > 0 && (now - entry.registeredAt) > entry.maxLifetime)
          .map(entry => entry.id);
        
        if (expiredIds.length > 0) {
          this.removeHandlersByIds(eventName, expiredIds);
          count += expiredIds.length;
        }
      }
      
      if (count > 0) {
        safeLogger.debug('EventManager', `Cleaned up ${count} expired event handlers`);
      }
    } catch (error) {
      safeLogger.error('EventManager', 'Error cleaning up expired handlers', error);
    }
  }
  
  /**
   * Internal method to add a listener
   * 
   * @param eventName The event name
   * @param handler The handler function
   * @param once Whether this is a one-time handler
   * @param errorHandler Custom error handler
   * @param maxLifetime Maximum lifetime in milliseconds
   * @param context Context for the handler
   * @returns A function to unsubscribe
   */
  private addListener(
    eventName: string, 
    handler: EventHandler, 
    once: boolean,
    errorHandler?: EventErrorHandler,
    maxLifetime: number = 0,
    context?: any
  ): () => void {
    // Create the event array if it doesn't exist
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    
    const handlers = this.events.get(eventName)!;
    
    // Check for potential memory leaks
    if (handlers.length >= this.maxListeners) {
      safeLogger.warn(
        'EventManager', 
        `Possible memory leak detected: event '${eventName}' has ${handlers.length} listeners`
      );
    }
    
    // Generate a unique ID for this handler
    const id = this.handlerIdCounter++;
    
    // Add the handler
    handlers.push({
      handler,
      once,
      id,
      registeredAt: Date.now(),
      errorHandler,
      maxLifetime,
      context
    });
    
    // Return an unsubscribe function
    return () => {
      this.off(eventName, handler);
    };
  }
  
  /**
   * Debug method to log information about all registered events and handlers
   */
  debug(): Record<string, EventDebugInfo> {
    const debug: Record<string, EventDebugInfo> = {};
    
    for (const [eventName, handlers] of this.events.entries()) {
      const stats = this.emissionStats.get(eventName);
      
      debug[eventName] = {
        count: handlers.length,
        oneTimeHandlers: handlers.filter(h => h.once).length,
        oldestHandler: Math.min(...handlers.map(h => h.registeredAt)),
        newestHandler: Math.max(...handlers.map(h => h.registeredAt)),
        lastEmitted: stats?.lastTimestamp,
        emissionCount: stats?.count || 0
      };
    }
    
    return debug;
  }
  
  /**
   * Clean up any resources
   */
  cleanup(): void {
    // Clear all event handlers
    this.events.clear();
    
    // Clear pending emissions
    this.pendingEmissions = [];
    
    // Clear emission stats
    this.emissionStats.clear();
    
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    safeLogger.debug('EventManager', 'Event manager cleaned up');
  }
} 
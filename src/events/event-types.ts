/**
 * Type definitions for the event management system
 */

/**
 * Callback function for event handlers
 */
export type EventHandler = (...args: any[]) => void;

/**
 * Error handler for event listener execution errors
 */
export type EventErrorHandler = (error: Error, eventName: string, handler: EventHandler) => void;

/**
 * Options for subscribing to events
 */
export interface EventSubscriptionOptions {
  /** Whether this is a one-time event handler */
  once?: boolean;
  
  /** Custom error handler for this subscription */
  errorHandler?: EventErrorHandler;
  
  /** Maximum time (ms) this subscription should live before auto-cleanup */
  maxLifetime?: number;
  
  /** Additional context to associate with this subscription */
  context?: any;
}

/**
 * Information about an event emission
 */
export interface EventEmission {
  /** Name of the event */
  eventName: string;
  
  /** Arguments passed to the event */
  args: any[];
  
  /** Timestamp when the event was emitted */
  timestamp: number;
  
  /** Unique ID for this emission */
  id: string;
}

/**
 * Debug information about an event
 */
export interface EventDebugInfo {
  /** Number of handlers for this event */
  count: number;
  
  /** Number of one-time handlers */
  oneTimeHandlers: number;
  
  /** Timestamp of the oldest handler registration */
  oldestHandler: number;
  
  /** Timestamp of the newest handler registration */
  newestHandler: number;
  
  /** Last time this event was emitted */
  lastEmitted?: number;
  
  /** Number of times this event has been emitted */
  emissionCount: number;
}

/**
 * Standard events in the application
 */
export enum AppEvents {
  /** Plugin initialization complete */
  INIT_COMPLETE = 'init:complete',
  
  /** State change in any component */
  STATE_CHANGED = 'state:changed',
  
  /** UI is ready and rendered */
  UI_READY = 'ui:ready',
  
  /** User interaction with a component */
  UI_INTERACTION = 'ui:interaction',
  
  /** Error occurred */
  ERROR = 'error',
  
  /** Plugin cleanup initiated */
  CLEANUP = 'cleanup'
} 
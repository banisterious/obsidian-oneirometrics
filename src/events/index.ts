/**
 * Event system exports
 * 
 * Provides a unified entry point for the event management system with
 * robust error handling and defensive programming.
 */

// Export the event types
export * from './event-types';

// Export the event management classes
export { EventManager } from './EventManager';
export { EventBus } from './EventBus';
export { NullEventManager } from './NullEventManager';

// Export the default EventBus instance for easy access
import { EventBus } from './EventBus';
export const eventBus = EventBus.getInstance(); 
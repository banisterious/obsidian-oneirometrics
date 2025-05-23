/**
 * Represents a function that can be called when an event is emitted.
 */
export type EventListener<T> = (payload: T) => void;

/**
 * A typed event emitter implementation that allows typed event handling.
 * This provides type safety for both event names and payload types.
 */
export class EventEmitter<EventMap extends Record<string, any>> {
  /**
   * Storage for event listeners
   * @private
   */
  private listeners: {
    [K in keyof EventMap]?: Array<EventListener<EventMap[K]>>;
  } = {};
  
  /**
   * Subscribe to an event
   * @param event The event name to subscribe to
   * @param listener The function to call when the event is emitted
   * @returns A function that, when called, unsubscribes the listener
   */
  on<K extends keyof EventMap>(
    event: K, 
    listener: EventListener<EventMap[K]>
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event]?.push(listener);
    
    // Return an unsubscribe function
    return () => this.off(event, listener);
  }
  
  /**
   * Unsubscribe from an event
   * @param event The event name to unsubscribe from
   * @param listener The listener function to remove
   */
  off<K extends keyof EventMap>(
    event: K, 
    listener: EventListener<EventMap[K]>
  ): void {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event]?.filter(
      l => l !== listener
    ) as any;
  }
  
  /**
   * Emit an event with a payload
   * @param event The event name to emit
   * @param payload The data to send with the event
   */
  emit<K extends keyof EventMap>(
    event: K, 
    payload: EventMap[K]
  ): void {
    if (!this.listeners[event]) return;
    
    this.listeners[event]?.forEach(listener => {
      try {
        listener(payload);
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error);
      }
    });
  }
  
  /**
   * Subscribe to an event and receive only the first emission
   * @param event The event name to subscribe to
   * @param listener The function to call when the event is emitted
   * @returns A function that, when called, unsubscribes the listener
   */
  once<K extends keyof EventMap>(
    event: K,
    listener: EventListener<EventMap[K]>
  ): () => void {
    const wrappedListener: EventListener<EventMap[K]> = (payload) => {
      // Unsubscribe first to prevent potential recursion issues
      this.off(event, wrappedListener);
      // Call the original listener
      listener(payload);
    };
    
    return this.on(event, wrappedListener);
  }
  
  /**
   * Clear all event listeners
   */
  clear(): void {
    this.listeners = {};
  }
} 
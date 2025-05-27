/**
 * Null Object implementation of an Event Manager
 * 
 * This provides a no-op implementation of basic event management functions
 * that can be used as a fallback when the real event system is not available.
 * It implements the Null Object Pattern for defensive coding.
 */

/**
 * Type for event handler functions
 */
export type EventHandler = (...args: any[]) => void;

/**
 * NullEventManager implements basic event management functions
 * but does nothing when methods are called.
 */
export class NullEventManager {
    /**
     * Singleton instance
     */
    private static instance: NullEventManager;
    
    /**
     * Get the singleton instance
     */
    public static getInstance(): NullEventManager {
        if (!NullEventManager.instance) {
            NullEventManager.instance = new NullEventManager();
        }
        return NullEventManager.instance;
    }
    
    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {}
    
    /**
     * Subscribe to an event - returns a no-op unsubscribe function
     */
    on(eventName: string, handler: EventHandler): () => void {
        // Return a no-op unsubscribe function
        return () => {};
    }
    
    /**
     * Subscribe to an event once - returns a no-op unsubscribe function
     */
    once(eventName: string, handler: EventHandler): () => void {
        // Return a no-op unsubscribe function
        return () => {};
    }
    
    /**
     * Emit an event - no-op implementation
     */
    emit(eventName: string, ...args: any[]): void {
        // Do nothing
    }
    
    /**
     * Remove an event handler - no-op implementation
     */
    off(eventName: string, handler?: EventHandler): void {
        // Do nothing
    }
    
    /**
     * Remove all event handlers - no-op implementation
     */
    removeAllListeners(eventName?: string): void {
        // Do nothing
    }
    
    /**
     * Get the number of listeners for an event - always returns 0
     */
    listenerCount(eventName: string): number {
        return 0;
    }
} 
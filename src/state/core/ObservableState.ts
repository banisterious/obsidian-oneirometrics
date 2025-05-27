/**
 * ObservableState implementation with defensive coding patterns
 * 
 * Provides an observable state pattern with robust error handling
 * and defensive programming to improve reliability.
 */

import { withErrorHandling } from '../../utils/defensive-utils';
import safeLogger from '../../logging/safe-logger';

/**
 * Type definition for listener functions
 */
type StateListener<T> = (state: T) => void;

/**
 * Error handler for listener invocation
 */
type ListenerErrorHandler = (error: Error, listener: Function) => void;

/**
 * Represents an observable state that notifies listeners when changes occur
 */
export class ObservableState<T> {
  /**
   * The current state value
   * @protected Access for subclasses
   */
  protected state: T;

  /**
   * Listeners registered for state changes
   * @private
   */
  private listeners: Array<{
    callback: StateListener<T>;
    errorHandler?: ListenerErrorHandler;
  }> = [];

  /**
   * Whether the state is being updated (to prevent recursive notifications)
   */
  private isUpdating: boolean = false;

  /**
   * Default error handler for listeners
   */
  private defaultErrorHandler: ListenerErrorHandler = (error, listener) => {
    safeLogger.error(
      'ObservableState', 
      `Error in state listener: ${listener.name || 'anonymous'}`, 
      error
    );
  };

  /**
   * Creates a new observable state
   * @param initialState The initial state value
   */
  constructor(initialState: T) {
    this.state = initialState;
  }

  /**
   * Gets the current state
   * @returns Current state
   */
  getState(): T {
    return this.state;
  }

  /**
   * Subscribes to state changes
   * @param listener Function to call when state changes
   * @param errorHandler Optional custom error handler for this listener
   * @returns Function to unsubscribe
   */
  subscribe = withErrorHandling(
    (
      listener: StateListener<T>, 
      errorHandler?: ListenerErrorHandler
    ): () => void => {
      if (typeof listener !== 'function') {
        throw new Error('Listener must be a function');
      }
      
      // Store the listener with its error handler
      const listenerEntry = {
        callback: listener,
        errorHandler: errorHandler || this.defaultErrorHandler
      };
      
      this.listeners.push(listenerEntry);
      
      // Notify immediately with current state (with error handling)
      this.safelyInvokeListener(listenerEntry, this.state);
      
      // Return unsubscribe function
      return () => {
        this.unsubscribe(listener);
      };
    },
    {
      fallbackValue: () => {}, // Return no-op unsubscribe function as fallback
      errorMessage: "Failed to subscribe to state changes",
      onError: (error) => safeLogger.error('ObservableState', 'Error in subscribe', error)
    }
  );

  /**
   * Removes a listener from the subscribers list
   * @param listener The listener to remove
   * @returns True if the listener was found and removed
   */
  private unsubscribe(listener: StateListener<T>): boolean {
    try {
      const initialLength = this.listeners.length;
      this.listeners = this.listeners.filter(entry => entry.callback !== listener);
      return initialLength > this.listeners.length;
    } catch (error) {
      safeLogger.error('ObservableState', 'Error unsubscribing listener', error);
      return false;
    }
  }

  /**
   * Safely invokes a listener with error handling
   * @param listenerEntry The listener entry to invoke
   * @param state The current state to pass to the listener
   */
  private safelyInvokeListener(
    listenerEntry: { callback: StateListener<T>; errorHandler?: ListenerErrorHandler },
    state: T
  ): void {
    try {
      listenerEntry.callback(state);
    } catch (error) {
      if (listenerEntry.errorHandler) {
        listenerEntry.errorHandler(
          error instanceof Error ? error : new Error(String(error)),
          listenerEntry.callback
        );
      } else {
        this.defaultErrorHandler(
          error instanceof Error ? error : new Error(String(error)),
          listenerEntry.callback
        );
      }
    }
  }

  /**
   * Notifies all listeners of state changes
   * @protected For use by subclasses
   */
  protected notifyListeners(): void {
    // Prevent recursive notifications
    if (this.isUpdating) {
      safeLogger.warn('ObservableState', 'Recursive state update detected');
      return;
    }

    try {
      this.isUpdating = true;
      
      // Make a copy of listeners array to prevent issues if listeners modify the array
      const listenersCopy = [...this.listeners];
      
      for (const listener of listenersCopy) {
        // Skip listeners that may have been removed during iteration
        if (this.listeners.includes(listener)) {
          this.safelyInvokeListener(listener, this.state);
        }
      }
    } catch (error) {
      safeLogger.error('ObservableState', 'Error notifying listeners', error);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Removes all listeners
   * @returns Number of listeners removed
   */
  clearListeners(): number {
    try {
      const count = this.listeners.length;
      this.listeners = [];
      return count;
    } catch (error) {
      safeLogger.error('ObservableState', 'Error clearing listeners', error);
      return 0;
    }
  }
} 
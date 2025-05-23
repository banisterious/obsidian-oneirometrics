/**
 * Interface for the observable state pattern.
 * Allows components to subscribe to state changes.
 */
export interface IObservableState<T> {
  /**
   * Subscribe to state changes.
   * @param listener Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: (state: T) => void): () => void;
  
  /**
   * Get the current state.
   * @returns Current state
   */
  getState(): T;
} 
/**
 * Stub implementation of ObservableState
 * 
 * This is a temporary stub to fix TypeScript errors during migration.
 * It will be replaced with a proper implementation in later phases.
 */

/**
 * Type definition for listener functions
 */
type StateListener<T> = (state: T) => void;

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
  private listeners: StateListener<T>[] = [];

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
   * @returns Function to unsubscribe
   */
  subscribe(listener: StateListener<T>): () => void {
    this.listeners.push(listener);
    
    // Notify immediately with current state
    listener(this.state);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notifies all listeners of state changes
   * @protected For use by subclasses
   */
  protected notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
} 
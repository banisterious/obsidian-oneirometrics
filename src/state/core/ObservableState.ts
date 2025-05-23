import { IObservableState } from '../interfaces';

/**
 * Base implementation of observable state pattern.
 */
export class ObservableState<T> implements IObservableState<T> {
  protected state: T;
  private listeners: ((state: T) => void)[] = [];

  /**
   * Creates a new ObservableState instance.
   * @param initialState Initial state value
   */
  constructor(initialState: T) {
    this.state = initialState;
  }

  /**
   * Subscribe to state changes.
   * @param listener Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: (state: T) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately notify the listener of the current state
    listener(this.state);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get the current state.
   * @returns Current state
   */
  getState(): T {
    return this.state;
  }

  /**
   * Notify all listeners of a state change.
   */
  protected notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
} 
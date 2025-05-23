import { IObservableState, StateChangeListener } from './StateInterfaces';

/**
 * Base implementation of the Observable State pattern.
 * This class manages subscriptions and notifies listeners when state changes.
 */
export class ObservableState<T extends Record<string, any>> implements IObservableState<T> {
  protected state: T;
  protected initialState: Readonly<T>;
  private listeners: Set<StateChangeListener<T>> = new Set();
  
  /**
   * Create a new observable state with the given initial state.
   * @param initialState The initial values for the state
   */
  constructor(initialState: T) {
    this.state = { ...initialState };
    this.initialState = Object.freeze({ ...initialState });
  }
  
  /**
   * Subscribe to state changes.
   * @param listener Function to call when state changes
   * @returns A function to unsubscribe the listener
   */
  subscribe(listener: StateChangeListener<T>): () => void {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }
  
  /**
   * Remove a listener from the subscribers list.
   * @param listener The listener to remove
   */
  unsubscribe(listener: StateChangeListener<T>): void {
    this.listeners.delete(listener);
  }
  
  /**
   * Get a read-only view of the current state.
   * @returns An immutable copy of the current state
   */
  getState(): Readonly<T> {
    return Object.freeze({ ...this.state });
  }
  
  /**
   * Protected method to update state and notify listeners.
   * @param changes Partial state changes to apply
   */
  protected updateState(changes: Partial<T>): void {
    // Only update if there are actual changes
    const hasChanges = Object.keys(changes).some(key => {
      const k = key as keyof T;
      return changes[k] !== this.state[k];
    });
    
    if (!hasChanges) {
      return;
    }
    
    // Update the state with the changes
    this.state = {
      ...this.state,
      ...changes
    };
    
    // Notify listeners with only the changed parts
    this.notifyListeners(changes);
  }
  
  /**
   * Notify all listeners about state changes.
   * @param changes The parts of state that changed
   */
  protected notifyListeners(changes: Partial<T>): void {
    // Create an immutable view of the changes
    const frozenChanges = Object.freeze({ ...changes });
    
    // Notify each listener with the changes
    this.listeners.forEach(listener => {
      try {
        listener(frozenChanges);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }
  
  /**
   * Reset state to initial values.
   */
  protected reset(): void {
    this.updateState({ ...this.initialState as Partial<T> });
  }
} 
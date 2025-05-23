import { IObservableState, IStateSelector } from './StateInterfaces';

/**
 * A class that selects specific parts of a state and notifies
 * subscribers when those parts change.
 */
export class StateSelector<T extends Record<string, any>, K extends keyof T> implements IStateSelector<T, K> {
  private state: IObservableState<T>;
  private keys: K[];
  private unsubscribe: (() => void) | null = null;
  private listeners: Set<(selected: Pick<T, K>) => void> = new Set();
  
  /**
   * Create a new state selector that watches specific keys in a state.
   * @param state The state to select from
   * @param keys The keys to select
   */
  constructor(state: IObservableState<T>, ...keys: K[]) {
    this.state = state;
    this.keys = keys;
    this.initializeSubscription();
  }
  
  /**
   * Set up the subscription to the source state.
   */
  private initializeSubscription(): void {
    // Unsubscribe from any existing subscription
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    // Subscribe to state changes
    this.unsubscribe = this.state.subscribe(changes => {
      // Check if any of the selected keys have changed
      const hasRelevantChanges = this.keys.some(key => key in changes);
      
      if (hasRelevantChanges) {
        // Get the current selected state and notify listeners
        const selected = this.getSelected();
        this.notifyListeners(selected);
      }
    });
  }
  
  /**
   * Get the currently selected portion of state.
   * @returns The selected state fields
   */
  getSelected(): Pick<T, K> {
    const fullState = this.state.getState();
    const selected = {} as Pick<T, K>;
    
    // Copy only the selected keys
    this.keys.forEach(key => {
      selected[key] = fullState[key];
    });
    
    return selected;
  }
  
  /**
   * Subscribe to changes in the selected state.
   * @param onChange Function to call when selected state changes
   * @returns A function to unsubscribe
   */
  subscribe(onChange: (selected: Pick<T, K>) => void): () => void {
    this.listeners.add(onChange);
    
    // Immediately notify with current selection
    onChange(this.getSelected());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(onChange);
    };
  }
  
  /**
   * Notify all listeners with the current selection.
   * @param selected The current selected state
   */
  private notifyListeners(selected: Pick<T, K>): void {
    // Create an immutable copy to prevent modification
    const frozenSelected = Object.freeze({ ...selected });
    
    // Notify each listener
    this.listeners.forEach(listener => {
      try {
        listener(frozenSelected);
      } catch (error) {
        console.error('Error in state selector listener:', error);
      }
    });
  }
  
  /**
   * Clean up subscriptions when the selector is no longer needed.
   */
  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
  }
} 
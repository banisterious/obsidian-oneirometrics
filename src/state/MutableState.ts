import { IMutableState } from './StateInterfaces';
import { ObservableState } from './ObservableState';

/**
 * A state implementation that can be directly modified.
 * Provides methods to update and reset the state.
 */
export class MutableState<T extends Record<string, any>> extends ObservableState<T> implements IMutableState<T> {
  /**
   * Create a new mutable state with the given initial state.
   * @param initialState The initial values for the state
   */
  constructor(initialState: T) {
    super(initialState);
  }
  
  /**
   * Update the state with new values and notify listeners.
   * @param newState Partial state to merge with current state
   */
  setState(newState: Partial<T>): void {
    this.updateState(newState);
  }
  
  /**
   * Reset the state to its initial values.
   */
  resetState(): void {
    this.reset();
  }
  
  /**
   * Update a specific field in the state.
   * @param key The key to update
   * @param value The new value
   */
  setField<K extends keyof T>(key: K, value: T[K]): void {
    // Create a properly typed partial update object
    const update = {} as Partial<T>;
    update[key] = value;
    this.setState(update);
  }
  
  /**
   * Update multiple fields in a nested object within the state.
   * @param parentKey The key of the parent object
   * @param updates The updates to apply to the nested object
   */
  updateNested<K extends keyof T, U extends Partial<T[K]>>(
    parentKey: K, 
    updates: U
  ): void {
    if (typeof this.state[parentKey] !== 'object') {
      console.error(`Cannot update nested properties of non-object field: ${String(parentKey)}`);
      return;
    }
    
    const currentValue = this.state[parentKey];
    const updatedValue = {
      ...currentValue,
      ...updates
    };
    
    this.setField(parentKey, updatedValue as T[K]);
  }
} 
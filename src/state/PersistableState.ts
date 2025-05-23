import { IPersistableState } from './StateInterfaces';
import { MutableState } from './MutableState';

/**
 * State class that can be persisted to storage.
 * Adds serialization and deserialization capabilities to MutableState.
 */
export class PersistableState<T extends Record<string, any>> extends MutableState<T> implements IPersistableState<T> {
  /**
   * Create a new persistable state with the given initial state.
   * @param initialState The initial values for the state
   */
  constructor(initialState: T) {
    super(initialState);
  }
  
  /**
   * Serialize the state to a JSON string.
   * @returns A serialized representation of the state
   */
  serialize(): string {
    return JSON.stringify(this.state);
  }
  
  /**
   * Deserialize a JSON string into the state.
   * @param data The serialized state
   */
  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data) as Partial<T>;
      this.setState(parsed);
    } catch (error) {
      console.error('Failed to deserialize state:', error);
      // Consider resetting to initial state on deserialization failure
      // this.resetState();
    }
  }
  
  /**
   * Create a persistable state from serialized data.
   * @param data The serialized state data
   * @param initialState The initial state to use if deserialization fails
   * @returns A new PersistableState instance
   */
  static fromSerialized<U extends Record<string, any>>(
    data: string, 
    initialState: U
  ): PersistableState<U> {
    const state = new PersistableState<U>(initialState);
    try {
      state.deserialize(data);
    } catch (error) {
      console.error('Failed to create state from serialized data:', error);
      // Keep the initial state as-is
    }
    return state;
  }
} 
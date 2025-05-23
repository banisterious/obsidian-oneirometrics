/**
 * Type definition for a function that listens to state changes.
 * It receives the changed portions of the state.
 */
export type StateChangeListener<T> = (changes: Partial<T>) => void;

/**
 * Basic interface for an observable state object.
 * This allows components to subscribe to state changes.
 */
export interface IObservableState<T> {
  /**
   * Subscribe to state changes.
   * @param listener Function to call when state changes
   * @returns Unsubscribe function to remove the listener
   */
  subscribe(listener: StateChangeListener<T>): () => void;
  
  /**
   * Remove a listener from the state.
   * @param listener The listener to remove
   */
  unsubscribe(listener: StateChangeListener<T>): void;
  
  /**
   * Get a read-only snapshot of the current state.
   * @returns An immutable view of the current state
   */
  getState(): Readonly<T>;
}

/**
 * Extended interface for state that can be persisted.
 */
export interface IPersistableState<T> extends IObservableState<T> {
  /**
   * Serialize the state to a JSON string.
   * @returns A serialized representation of the state
   */
  serialize(): string;
  
  /**
   * Deserialize a JSON string into the state.
   * @param data The serialized state
   */
  deserialize(data: string): void;
}

/**
 * Interface for a state selector that watches specific parts of state.
 */
export interface IStateSelector<T, K extends keyof T> {
  /**
   * Get the currently selected portion of state.
   * @returns The selected state
   */
  getSelected(): Pick<T, K>;
  
  /**
   * Subscribe to changes in the selected portion of state.
   * @param onChange Function to call when the selected state changes
   * @returns Unsubscribe function
   */
  subscribe(onChange: (selected: Pick<T, K>) => void): () => void;
}

/**
 * Interface for a mutable state object.
 */
export interface IMutableState<T> extends IObservableState<T> {
  /**
   * Update the state with new values.
   * @param newState Partial state to merge with current state
   */
  setState(newState: Partial<T>): void;
  
  /**
   * Reset the state to its initial values.
   */
  resetState(): void;
}

/**
 * Interface for an action dispatcher that can execute state changes.
 */
export interface IStateDispatcher<T> {
  /**
   * Dispatch an action that will update the state.
   * @param action Name of the action
   * @param payload Data associated with the action
   */
  dispatch<A extends string, P>(action: A, payload?: P): void;
  
  /**
   * Register a reducer function to handle a specific action.
   * @param action Name of the action to handle
   * @param reducer Function that produces a new state based on the current state and action payload
   */
  registerReducer<A extends string, P>(
    action: A,
    reducer: (state: T, payload?: P) => Partial<T>
  ): void;
} 
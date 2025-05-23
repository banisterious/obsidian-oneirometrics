import { IObservableState } from './IObservableState';

/**
 * Interface for mutable state.
 * Extends observable state with methods to update the state.
 */
export interface IMutableState<T> extends IObservableState<T> {
  /**
   * Update the state with a partial state object.
   * @param partialState Partial state to merge with current state
   */
  setState(partialState: Partial<T>): void;
  
  /**
   * Update the state using a function that receives the current state.
   * @param updater Function that receives current state and returns a partial state
   */
  updateState(updater: (currentState: T) => Partial<T>): void;
  
  /**
   * Reset the state to its initial value.
   */
  resetState(): void;
} 
import { IMutableState } from '../interfaces';
import { ObservableState } from './ObservableState';

/**
 * Base implementation of mutable state.
 */
export class MutableState<T extends Record<string, any>> extends ObservableState<T> implements IMutableState<T> {
  private initialState: T;

  /**
   * Creates a new MutableState instance.
   * @param initialState Initial state value
   */
  constructor(initialState: T) {
    super(initialState);
    // Deep clone the initial state to prevent modifications
    this.initialState = JSON.parse(JSON.stringify(initialState));
  }

  /**
   * Update the state with a partial state object.
   * @param partialState Partial state to merge with current state
   */
  setState(partialState: Partial<T>): void {
    // Create a new state object by merging the current state with the partial state
    this.state = { ...this.state, ...partialState };
    this.notifyListeners();
  }

  /**
   * Update the state using a function that receives the current state.
   * @param updater Function that receives current state and returns a partial state
   */
  updateState(updater: (currentState: T) => Partial<T>): void {
    const partialState = updater(this.getState());
    this.setState(partialState);
  }

  /**
   * Reset the state to its initial value.
   */
  resetState(): void {
    // Deep clone the initial state to prevent modifications
    this.state = JSON.parse(JSON.stringify(this.initialState));
    this.notifyListeners();
  }
} 
import { ObservableState } from './ObservableState';

/**
 * Stub implementation of MutableState
 * 
 * This is a temporary stub to fix TypeScript errors during migration.
 * It will be replaced with a proper implementation in later phases.
 */

/**
 * Represents a mutable observable state
 */
export class MutableState<T extends object> extends ObservableState<T> {
  /**
   * Sets the state to a new value
   * @param newState The new state
   */
  setState(newState: T): void {
    this.state = newState;
    this.notifyListeners();
  }

  /**
   * Updates the state using a function that receives the current state
   * @param updateFn A function that returns a new state based on the current state
   */
  updateState(updateFn: (currentState: T) => T): void {
    this.setState(updateFn(this.state));
  }
} 
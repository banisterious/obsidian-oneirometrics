/**
 * Stub implementation of StateSelector
 * 
 * This is a temporary stub to fix TypeScript errors during migration.
 * It will be replaced with a proper implementation in later phases.
 */

import { ObservableState } from './ObservableState';

/**
 * A selector that extracts a derived value from an observable state
 */
export class StateSelector<TState, TSelected> {
  /**
   * The selector function that extracts data from the state
   */
  private selector: (state: TState) => TSelected;

  /**
   * Creates a new state selector
   * @param selector Function that extracts the desired value from state
   */
  constructor(selector: (state: TState) => TSelected) {
    this.selector = selector;
  }

  /**
   * Creates an observable for the selected state
   * @param observable The source observable state
   * @returns A new observable state for the selected value
   */
  observe(observable: ObservableState<TState>): ObservableState<TSelected> {
    // Create a new observable with the currently selected value
    const selected = this.selector(observable.getState());
    const derivedState = new DerivedObservableState<TSelected>(selected);
    
    // Subscribe to the source observable to keep derived state in sync
    const unsubscribe = observable.subscribe(state => {
      const newSelected = this.selector(state);
      derivedState.updateState(newSelected);
    });
    
    // We should store the unsubscribe function and call it when the derived observable is no longer needed
    // For this stub, we'll just return the derived observable
    return derivedState;
  }
}

/**
 * A simple extension of ObservableState that allows updating the state
 */
class DerivedObservableState<T> extends ObservableState<T> {
  /**
   * Updates the state value and notifies listeners
   * @param newValue The new state value
   */
  updateState(newValue: T): void {
    this.state = newValue;
    this.notifyListeners();
  }
} 
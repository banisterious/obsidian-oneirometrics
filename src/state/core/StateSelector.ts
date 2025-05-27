/**
 * StateSelector implementation with defensive coding patterns
 * 
 * Provides a way to safely extract derived state from observable state
 * with robust error handling and defensive programming.
 */

import { ObservableState } from './ObservableState';
import { withErrorHandling } from '../../utils/defensive-utils';
import safeLogger from '../../logging/safe-logger';

/**
 * A selector that extracts a derived value from an observable state
 */
export class StateSelector<TState, TSelected> {
  /**
   * The selector function that extracts data from the state
   */
  private selector: (state: TState) => TSelected;
  
  /**
   * Optional fallback value to use when selector fails
   */
  private fallbackValue?: TSelected;

  /**
   * Creates a new state selector
   * @param selector Function that extracts the desired value from state
   * @param fallbackValue Optional fallback value to use when selector fails
   */
  constructor(
    selector: (state: TState) => TSelected,
    fallbackValue?: TSelected
  ) {
    if (typeof selector !== 'function') {
      throw new Error('Selector must be a function');
    }
    
    this.selector = selector;
    this.fallbackValue = fallbackValue;
  }

  /**
   * Safely executes the selector function with error handling
   * @param state The state to select from
   * @returns The selected value or fallback if an error occurs
   */
  private safeSelect(state: TState): TSelected {
    try {
      return this.selector(state);
    } catch (error) {
      safeLogger.error('StateSelector', 'Error executing selector function', error);
      
      if (this.fallbackValue !== undefined) {
        return this.fallbackValue;
      }
      
      // If no fallback provided, re-throw the error
      throw error;
    }
  }

  /**
   * Creates an observable for the selected state
   * @param observable The source observable state
   * @returns A new observable state for the selected value
   */
  observe = withErrorHandling(
    (observable: ObservableState<TState>): ObservableState<TSelected> => {
      if (!observable || !(observable instanceof ObservableState)) {
        throw new Error('Invalid observable provided to observe method');
      }
      
      try {
        // Create a new observable with the currently selected value
        let selected: TSelected;
        
        try {
          selected = this.safeSelect(observable.getState());
        } catch (error) {
          if (this.fallbackValue !== undefined) {
            selected = this.fallbackValue;
          } else {
            throw error;
          }
        }
        
        const derivedState = new DerivedObservableState<TSelected>(selected);
        
        // Keep track of subscription to clean up later
        let subscription: (() => void) | null = null;
        
        // Add cleanup method to the derived state
        (derivedState as any).cleanup = () => {
          if (subscription) {
            subscription();
            subscription = null;
          }
        };
        
        // Subscribe to the source observable to keep derived state in sync
        subscription = observable.subscribe(state => {
          try {
            const newSelected = this.safeSelect(state);
            derivedState.updateState(newSelected);
          } catch (error) {
            safeLogger.error('StateSelector', 'Error updating derived state', error);
            
            // If fallback is available, use it
            if (this.fallbackValue !== undefined) {
              derivedState.updateState(this.fallbackValue);
            }
          }
        });
        
        return derivedState;
      } catch (error) {
        safeLogger.error('StateSelector', 'Error creating derived observable', error);
        
        // Create a static observable with fallback value
        const fallback = this.fallbackValue !== undefined 
          ? this.fallbackValue 
          : ({} as TSelected);
          
        return new DerivedObservableState<TSelected>(fallback);
      }
    },
    {
      fallbackValue: new DerivedObservableState<TSelected>({} as TSelected),
      errorMessage: "Failed to create derived observable state",
      onError: (error) => safeLogger.error('StateSelector', 'Error in observe method', error)
    }
  );
}

/**
 * A simple extension of ObservableState that allows updating the state
 */
class DerivedObservableState<T> extends ObservableState<T> {
  /**
   * Updates the state value and notifies listeners
   * @param newValue The new state value
   * @returns True if successful, false if an error occurred
   */
  updateState = withErrorHandling(
    (newValue: T): boolean => {
      this.state = newValue;
      this.notifyListeners();
      return true;
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to update derived state",
      onError: (error) => safeLogger.error('DerivedObservableState', 'Error updating state', error)
    }
  );
  
  /**
   * Cleanup method to be implemented by instances
   */
  cleanup(): void {
    // Default implementation does nothing
  }
} 
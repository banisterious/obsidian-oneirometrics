import { IObservableState, IStateSelector } from '../interfaces';

/**
 * Observable state implementation for state selectors.
 * This class adapts a global state observable to a selected state observable.
 */
export class SelectorObservable<GlobalState, SelectedState> implements IObservableState<SelectedState> {
  private sourceObservable: IObservableState<GlobalState>;
  private selector: IStateSelector<GlobalState, SelectedState>;
  private lastValue: SelectedState | null = null;
  
  /**
   * Creates a new SelectorObservable instance.
   * @param sourceObservable Source observable for the global state
   * @param selector Selector to extract the selected state
   */
  constructor(
    sourceObservable: IObservableState<GlobalState>,
    selector: IStateSelector<GlobalState, SelectedState>
  ) {
    this.sourceObservable = sourceObservable;
    this.selector = selector;
  }
  
  /**
   * Subscribe to changes in the selected state.
   * @param listener Function to call when selected state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: (state: SelectedState) => void): () => void {
    // Use a separate listener for the source to add memoization
    return this.sourceObservable.subscribe((globalState) => {
      const selectedState = this.selector.select(globalState);
      
      // Only notify if the selected state has changed
      // Note: This is a simple equality check; you might need deeper equality for complex objects
      if (this.lastValue === null || !this.areEqual(this.lastValue, selectedState)) {
        this.lastValue = selectedState;
        listener(selectedState);
      }
    });
  }
  
  /**
   * Get the current selected state.
   * @returns Current selected state
   */
  getState(): SelectedState {
    const globalState = this.sourceObservable.getState();
    return this.selector.select(globalState);
  }
  
  /**
   * Compare two state values for equality.
   * This is a simple implementation that uses JSON.stringify for deep comparison.
   * For more complex objects, you might want to use a more efficient method.
   * @param a First state value
   * @param b Second state value
   * @returns True if the values are equal
   */
  private areEqual(a: SelectedState, b: SelectedState): boolean {
    if (a === b) return true;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    if (a === null || b === null) return false;
    
    return JSON.stringify(a) === JSON.stringify(b);
  }
} 
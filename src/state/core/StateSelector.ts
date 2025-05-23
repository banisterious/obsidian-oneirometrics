import { IObservableState, IStateSelector } from '../interfaces';
import { SelectorObservable } from './SelectorObservable';

/**
 * Base implementation of state selectors.
 */
export class StateSelector<GlobalState, SelectedState> implements IStateSelector<GlobalState, SelectedState> {
  private selectorFn: (state: GlobalState) => SelectedState;
  
  /**
   * Creates a new StateSelector instance.
   * @param selectorFn Function that selects a portion of the global state
   */
  constructor(selectorFn: (state: GlobalState) => SelectedState) {
    this.selectorFn = selectorFn;
  }
  
  /**
   * Select a portion of the global state.
   * @param state Global state
   * @returns Selected state portion
   */
  select(state: GlobalState): SelectedState {
    return this.selectorFn(state);
  }
  
  /**
   * Create an observable for this selector from a global state observable.
   * @param stateObservable Observable of the global state
   * @returns Observable of the selected state
   */
  observe(stateObservable: IObservableState<GlobalState>): IObservableState<SelectedState> {
    return new SelectorObservable(stateObservable, this);
  }
} 
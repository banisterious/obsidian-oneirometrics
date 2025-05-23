import { IObservableState } from './IObservableState';

/**
 * Interface for state selectors.
 * Selectors derive specific pieces of state from the global state.
 */
export interface IStateSelector<GlobalState, SelectedState> {
  /**
   * Select a portion of the global state.
   * @param state Global state
   * @returns Selected state portion
   */
  select(state: GlobalState): SelectedState;
  
  /**
   * Create an observable for this selector from a global state observable.
   * @param stateObservable Observable of the global state
   * @returns Observable of the selected state
   */
  observe(stateObservable: IObservableState<GlobalState>): IObservableState<SelectedState>;
} 
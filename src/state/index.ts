// Export interfaces
export type {
  StateChangeListener,
  IObservableState,
  IPersistableState,
  IStateSelector,
  IMutableState,
  IStateDispatcher
} from './StateInterfaces';

// Export base state classes
export { ObservableState } from './ObservableState';
export { MutableState } from './MutableState';
export { PersistableState } from './PersistableState';
export { StateSelector } from './StateSelector';
export { StateDispatcher } from './StateDispatcher';

// Export metrics state specific functionality
export { MetricsState, MetricsActions } from './MetricsState';
export type { MetricsStateShape } from './MetricsState';
export { MetricsStateAdapter } from './MetricsStateAdapter';

// Export legacy state for backward compatibility
export { DreamMetricsState } from './DreamMetricsState'; 
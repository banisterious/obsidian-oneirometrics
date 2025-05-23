import { MutableState } from '../core';
import { IMutableState } from '../interfaces';
import { IMetricsState } from './interfaces';
import { DreamMetric } from '../../types';

/**
 * Default metrics used for initialization.
 * Should be imported from a central location.
 */
const DEFAULT_METRICS: DreamMetric[] = [
  {
    name: 'lucidity',
    icon: 'lightbulb',
    minValue: 0,
    maxValue: 5,
    description: 'Awareness that you are dreaming while in the dream'
  },
  // Additional default metrics would be defined here
];

/**
 * Default metrics state for initialization.
 */
const DEFAULT_METRICS_STATE: IMetricsState = {
  metrics: Object.fromEntries(DEFAULT_METRICS.map(m => [m.name, m])),
  selectedNotes: [],
  selectionMode: 'notes',
  selectedFolder: '',
  expandedStates: {},
  projectNote: '',
  calloutName: '',
  _persistentExclusions: {}
};

/**
 * Manages metrics state using the observable pattern.
 */
export class MetricsState extends MutableState<IMetricsState> implements IMutableState<IMetricsState> {
  /**
   * Creates a new MetricsState instance.
   * @param initialState Optional initial state to override defaults
   */
  constructor(initialState: Partial<IMetricsState> = {}) {
    // Merge default state with initial state
    super({
      ...DEFAULT_METRICS_STATE,
      ...initialState,
      // Specially handle merging metrics
      metrics: {
        ...DEFAULT_METRICS_STATE.metrics,
        ...(initialState.metrics || {})
      }
    });
  }
  
  /**
   * Add a new custom metric.
   * @param metric Metric to add
   */
  addMetric(metric: DreamMetric): void {
    this.updateState(state => ({
      metrics: {
        ...state.metrics,
        [metric.name]: metric
      }
    }));
  }
  
  /**
   * Update an existing metric.
   * @param name Name of the metric to update
   * @param updates Partial metric updates
   */
  updateMetric(name: string, updates: Partial<DreamMetric>): void {
    this.updateState(state => {
      const currentMetric = state.metrics[name];
      if (!currentMetric) {
        return {}; // No changes if metric doesn't exist
      }
      
      return {
        metrics: {
          ...state.metrics,
          [name]: {
            ...currentMetric,
            ...updates
          }
        }
      };
    });
  }
  
  /**
   * Remove a metric.
   * @param name Name of the metric to remove
   */
  removeMetric(name: string): void {
    this.updateState(state => {
      const newMetrics = { ...state.metrics };
      delete newMetrics[name];
      
      return { metrics: newMetrics };
    });
  }
  
  /**
   * Set enabled state for a metric (to be implemented in UI layer).
   */
  
  /**
   * Update selected notes.
   * @param selectedNotes Array of selected note paths
   */
  setSelectedNotes(selectedNotes: string[]): void {
    this.setState({ selectedNotes });
  }
  
  /**
   * Set the selection mode.
   * @param mode Selection mode
   */
  setSelectionMode(mode: IMetricsState['selectionMode']): void {
    this.setState({ selectionMode: mode });
  }
  
  /**
   * Set the selected folder.
   * @param folderPath Path to the folder
   */
  setSelectedFolder(folderPath: string): void {
    this.setState({ selectedFolder: folderPath });
  }
  
  /**
   * Set the project note path.
   * @param notePath Path to the project note
   */
  setProjectNote(notePath: string): void {
    this.setState({ projectNote: notePath });
  }
  
  /**
   * Toggle expanded state of a component.
   * @param componentId ID of the component
   */
  toggleExpandedState(componentId: string): void {
    this.updateState(state => ({
      expandedStates: {
        ...state.expandedStates,
        [componentId]: !state.expandedStates[componentId]
      }
    }));
  }
  
  /**
   * Set expanded state of a component.
   * @param componentId ID of the component
   * @param expanded Whether the component is expanded
   */
  setExpandedState(componentId: string, expanded: boolean): void {
    this.updateState(state => ({
      expandedStates: {
        ...state.expandedStates,
        [componentId]: expanded
      }
    }));
  }
  
  /**
   * Add a persistent exclusion.
   * @param key Key to exclude
   */
  addPersistentExclusion(key: string): void {
    this.updateState(state => ({
      _persistentExclusions: {
        ...state._persistentExclusions,
        [key]: true
      }
    }));
  }
  
  /**
   * Remove a persistent exclusion.
   * @param key Key to include
   */
  removePersistentExclusion(key: string): void {
    this.updateState(state => {
      const newExclusions = { ...state._persistentExclusions };
      delete newExclusions[key];
      
      return { _persistentExclusions: newExclusions };
    });
  }
  
  /**
   * Check if a key is persistently excluded.
   * @param key Key to check
   * @returns True if the key is excluded
   */
  isPersistentlyExcluded(key: string): boolean {
    return !!this.state._persistentExclusions[key];
  }
} 
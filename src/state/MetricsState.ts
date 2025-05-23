import { DreamMetricData, DreamMetric, DreamMetricsSettings } from '../../types';
import { PersistableState } from './PersistableState';
import { StateDispatcher } from './StateDispatcher';

/**
 * Interface describing the structure of the metrics state.
 */
export interface MetricsStateShape {
  metrics: Record<string, DreamMetric>;
  dreamEntries: DreamMetricData[];
  expandedStates: Record<string, boolean>;
  settings: DreamMetricsSettings;
  ui: {
    isLoading: boolean;
    activeView: string;
    selectedFilters: string[];
    dateRange: {
      startDate: string | null;
      endDate: string | null;
    };
  };
}

/**
 * Enum of available actions for the metrics state.
 */
export enum MetricsActions {
  UPDATE_METRICS = 'updateMetrics',
  UPDATE_ENTRIES = 'updateEntries',
  TOGGLE_EXPANDED = 'toggleExpanded',
  UPDATE_SETTINGS = 'updateSettings',
  SET_LOADING = 'setLoading',
  SET_ACTIVE_VIEW = 'setActiveView',
  UPDATE_FILTERS = 'updateFilters',
  SET_DATE_RANGE = 'setDateRange',
  RESET_UI = 'resetUi'
}

/**
 * State management for dream metrics data.
 * This class extends PersistableState to allow saving/loading state.
 */
export class MetricsState extends PersistableState<MetricsStateShape> {
  private static instance: MetricsState;
  public readonly dispatcher: StateDispatcher<MetricsStateShape>;
  
  /**
   * Create a new metrics state.
   * @param initialSettings Initial settings for the state
   */
  private constructor(initialSettings: DreamMetricsSettings) {
    const initialState: MetricsStateShape = {
      metrics: initialSettings.metrics || {},
      dreamEntries: [],
      expandedStates: initialSettings.expandedStates || {},
      settings: initialSettings,
      ui: {
        isLoading: false,
        activeView: 'dashboard',
        selectedFilters: [],
        dateRange: {
          startDate: null,
          endDate: null
        }
      }
    };
    
    super(initialState);
    
    // Create dispatcher and register reducers
    this.dispatcher = new StateDispatcher<MetricsStateShape>(this);
    this.registerReducers();
  }
  
  /**
   * Get the singleton instance of MetricsState.
   * @param settings Optional settings to initialize with
   * @returns The metrics state instance
   */
  public static getInstance(settings?: DreamMetricsSettings): MetricsState {
    if (!MetricsState.instance) {
      if (!settings) {
        throw new Error('MetricsState must be initialized with settings first time');
      }
      MetricsState.instance = new MetricsState(settings);
    }
    return MetricsState.instance;
  }
  
  /**
   * Register all reducers for state actions.
   */
  private registerReducers(): void {
    this.dispatcher.registerReducers({
      [MetricsActions.UPDATE_METRICS]: (state, payload: Record<string, DreamMetric>) => ({
        metrics: payload
      }),
      
      [MetricsActions.UPDATE_ENTRIES]: (state, payload: DreamMetricData[]) => ({
        dreamEntries: payload
      }),
      
      [MetricsActions.TOGGLE_EXPANDED]: (state, payload: { contentId: string; isExpanded: boolean }) => {
        const newExpandedStates = { ...state.expandedStates };
        newExpandedStates[payload.contentId] = payload.isExpanded;
        
        return {
          expandedStates: newExpandedStates
        };
      },
      
      [MetricsActions.UPDATE_SETTINGS]: (state, payload: Partial<DreamMetricsSettings>) => ({
        settings: { ...state.settings, ...payload }
      }),
      
      [MetricsActions.SET_LOADING]: (state, payload: boolean) => ({
        ui: { ...state.ui, isLoading: payload }
      }),
      
      [MetricsActions.SET_ACTIVE_VIEW]: (state, payload: string) => ({
        ui: { ...state.ui, activeView: payload }
      }),
      
      [MetricsActions.UPDATE_FILTERS]: (state, payload: string[]) => ({
        ui: { ...state.ui, selectedFilters: payload }
      }),
      
      [MetricsActions.SET_DATE_RANGE]: (state, payload: { startDate: string | null; endDate: string | null }) => ({
        ui: { 
          ...state.ui, 
          dateRange: {
            startDate: payload.startDate,
            endDate: payload.endDate
          }
        }
      }),
      
      [MetricsActions.RESET_UI]: (state) => ({
        ui: {
          isLoading: false,
          activeView: 'dashboard',
          selectedFilters: [],
          dateRange: {
            startDate: null,
            endDate: null
          }
        }
      })
    });
  }
  
  /**
   * Get metrics data.
   * @returns All metrics
   */
  getMetrics(): Record<string, DreamMetric> {
    return this.getState().metrics;
  }
  
  /**
   * Get dream entries.
   * @returns All dream entries
   */
  getDreamEntries(): DreamMetricData[] {
    return this.getState().dreamEntries;
  }
  
  /**
   * Check if a content section is expanded.
   * @param contentId ID of the content section
   * @returns True if expanded, false otherwise
   */
  isExpanded(contentId: string): boolean {
    return this.getState().expandedStates[contentId] || false;
  }
  
  /**
   * Save state to settings.
   * This updates the settings object and returns it for persisting.
   * @returns Updated settings
   */
  saveToSettings(): DreamMetricsSettings {
    const state = this.getState();
    const updatedSettings: DreamMetricsSettings = {
      ...state.settings,
      metrics: state.metrics,
      expandedStates: state.expandedStates
    };
    
    // Update our internal settings
    this.dispatcher.dispatch(MetricsActions.UPDATE_SETTINGS, updatedSettings);
    
    return updatedSettings;
  }
} 
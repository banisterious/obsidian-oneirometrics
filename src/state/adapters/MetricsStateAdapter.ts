import { DreamMetric, DreamMetricData, DreamMetricsSettings } from '../../types';
import { MetricsState } from '../metrics/MetricsState';
import { IMetricsState } from '../metrics/interfaces';

/**
 * Adapter for the legacy DreamMetricsState API.
 * Provides backward compatibility while using the new MetricsState implementation.
 */
export class MetricsStateAdapter {
  private metricsState: MetricsState;
  private expandedStates: Map<string, boolean> = new Map();
  private dreamEntries: DreamMetricData[] = [];
  
  /**
   * Creates a new MetricsStateAdapter instance.
   * @param settings Legacy settings object
   */
  constructor(settings: DreamMetricsSettings) {
    // Convert legacy settings to new state format
    const initialState: Partial<IMetricsState> = {
      metrics: settings.metrics,
      selectedNotes: settings.selectedNotes || [],
      selectionMode: 'notes', // Default to notes mode
      selectedFolder: settings.folderOptions?.path || '',
      projectNote: settings.projectNotePath || '',
      calloutName: settings.calloutName || '',
      expandedStates: {},
      _persistentExclusions: {}
    };
    
    // Initialize the new state with converted settings
    this.metricsState = new MetricsState(initialState);
    
    // Handle expanded states from settings if available
    // Note: expandedStates is not in the type definition but might be in the actual data
    const anySettings = settings as any;
    if (anySettings.expandedStates && typeof anySettings.expandedStates === 'object') {
      Object.entries(anySettings.expandedStates).forEach(([id, expanded]) => {
        if (typeof expanded === 'boolean') {
          this.expandedStates.set(id, expanded);
        }
      });
    }
  }
  
  /**
   * Toggle expanded state for a content item.
   * @param contentId ID of the content item
   * @param isExpanded Whether the content is expanded
   */
  toggleExpandedState(contentId: string, isExpanded: boolean): void {
    this.expandedStates.set(contentId, isExpanded);
    this.metricsState.setExpandedState(contentId, isExpanded);
    this.notifyListeners();
  }
  
  /**
   * Get the expanded state for a content item.
   * @param contentId ID of the content item
   * @returns Whether the content is expanded
   */
  getExpandedState(contentId: string): boolean {
    return this.expandedStates.get(contentId) || false;
  }
  
  /**
   * Update metrics configurations.
   * @param metrics Updated metrics
   */
  updateMetrics(metrics: Record<string, DreamMetric>): void {
    Object.entries(metrics).forEach(([name, metric]) => {
      if (this.metricsState.getState().metrics[name]) {
        // Update existing metric
        this.metricsState.updateMetric(name, metric);
      } else {
        // Add new metric
        this.metricsState.addMetric(metric);
      }
    });
    
    // Remove metrics that are no longer present
    Object.keys(this.metricsState.getState().metrics).forEach(name => {
      if (!metrics[name]) {
        this.metricsState.removeMetric(name);
      }
    });
    
    this.notifyListeners();
  }
  
  /**
   * Update dream entries.
   * @param entries Updated dream entries
   */
  updateDreamEntries(entries: DreamMetricData[]): void {
    this.dreamEntries = entries;
    this.notifyListeners();
  }
  
  /**
   * Get metrics configurations.
   * @returns Current metrics
   */
  getMetrics(): Record<string, DreamMetric> {
    return this.metricsState.getState().metrics;
  }
  
  /**
   * Get dream entries.
   * @returns Current dream entries
   */
  getDreamEntries(): DreamMetricData[] {
    return this.dreamEntries;
  }
  
  // Private listeners for legacy code compatibility
  private listeners: Set<() => void> = new Set();
  
  /**
   * Subscribe to state changes.
   * @param listener Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    
    // Also subscribe to the new state
    const unsubscribe = this.metricsState.subscribe(() => listener());
    
    // Return composite unsubscribe function
    return () => {
      this.listeners.delete(listener);
      unsubscribe();
    };
  }
  
  /**
   * Notify all listeners of a state change.
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
  
  /**
   * Get a summary of the current state for debugging.
   * @returns State summary
   */
  getStateSummary(): string {
    return JSON.stringify({
      expandedStatesCount: this.expandedStates.size,
      metricsCount: Object.keys(this.getMetrics()).length,
      dreamEntriesCount: this.dreamEntries.length,
      listenersCount: this.listeners.size
    }, null, 2);
  }
  
  /**
   * Get the underlying new state instance.
   * For migration purposes.
   * @returns The new MetricsState instance
   */
  getNewState(): MetricsState {
    return this.metricsState;
  }
  
  /**
   * Save settings.
   * Legacy compatibility method, does nothing.
   */
  saveSettings(): void {
    // Implementation for saving settings is handled by state persistence
    console.warn('saveSettings is deprecated. Use state persistence instead.');
  }
  
  /**
   * Load settings.
   * Legacy compatibility method, does nothing.
   */
  loadSettings(): void {
    // Implementation for loading settings is handled by state persistence
    console.warn('loadSettings is deprecated. Use state persistence instead.');
  }
} 
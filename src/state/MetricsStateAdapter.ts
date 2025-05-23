import { DreamMetric, DreamMetricData, DreamMetricsSettings } from '../../types';
import { MetricsState, MetricsActions } from './MetricsState';

/**
 * Adapter for the legacy DreamMetricsState API.
 * This class maintains the old API for backward compatibility
 * while using the new state management system internally.
 */
export class MetricsStateAdapter {
  private metricsState: MetricsState;
  private listeners: Set<() => void> = new Set();
  private unsubscribe: (() => void) | null = null;
  
  /**
   * Create a new metrics state adapter.
   * @param settings The metrics settings
   */
  constructor(settings: DreamMetricsSettings) {
    // Initialize the new state management system
    this.metricsState = MetricsState.getInstance(settings);
    
    // Set up subscription to forward changes to legacy listeners
    this.unsubscribe = this.metricsState.subscribe(() => {
      this.notifyListeners();
    });
  }
  
  /**
   * Toggle the expanded state of a content section.
   * @param contentId ID of the content section
   * @param isExpanded New expanded state
   */
  toggleExpandedState(contentId: string, isExpanded: boolean): void {
    this.metricsState.dispatcher.dispatch(MetricsActions.TOGGLE_EXPANDED, {
      contentId,
      isExpanded
    });
  }
  
  /**
   * Get the expanded state of a content section.
   * @param contentId ID of the content section
   * @returns True if expanded, false otherwise
   */
  getExpandedState(contentId: string): boolean {
    return this.metricsState.isExpanded(contentId);
  }
  
  /**
   * Update the metrics data.
   * @param metrics New metrics data
   */
  updateMetrics(metrics: Record<string, DreamMetric>): void {
    this.metricsState.dispatcher.dispatch(MetricsActions.UPDATE_METRICS, metrics);
  }
  
  /**
   * Update dream entries.
   * @param entries New dream entries
   */
  updateDreamEntries(entries: DreamMetricData[]): void {
    this.metricsState.dispatcher.dispatch(MetricsActions.UPDATE_ENTRIES, entries);
  }
  
  /**
   * Get all metrics data.
   * @returns All metrics
   */
  getMetrics(): Record<string, DreamMetric> {
    return this.metricsState.getMetrics();
  }
  
  /**
   * Get all dream entries.
   * @returns All dream entries
   */
  getDreamEntries(): DreamMetricData[] {
    return this.metricsState.getDreamEntries();
  }
  
  /**
   * Subscribe to state changes.
   * @param listener Function to call when state changes
   * @returns Function to unsubscribe
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners about state changes.
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in legacy state listener:', error);
      }
    });
  }
  
  /**
   * Get a JSON summary of the current state.
   * @returns JSON string with state summary
   */
  getStateSummary(): string {
    const state = this.metricsState.getState();
    return JSON.stringify({
      expandedStatesCount: Object.keys(state.expandedStates).length,
      metricsCount: Object.keys(state.metrics).length,
      dreamEntriesCount: state.dreamEntries.length,
      listenersCount: this.listeners.size
    }, null, 2);
  }
  
  /**
   * Save settings.
   */
  public saveSettings(): void {
    const settings = this.metricsState.saveToSettings();
    // In the real implementation, this would save to disk/storage
    console.log('Would save settings:', settings);
  }
  
  /**
   * Load settings.
   */
  public loadSettings(): void {
    // In the real implementation, this would load from disk/storage
    console.log('Would load settings');
  }
  
  /**
   * Clean up resources when no longer needed.
   */
  public cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
  }
} 
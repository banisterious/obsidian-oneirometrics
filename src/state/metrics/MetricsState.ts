/**
 * Stub implementation of MetricsState
 * 
 * This is a temporary stub to fix TypeScript errors during migration.
 * It will be replaced with a proper implementation in later phases.
 */

import { MutableState } from '../core/MutableState';
import { DreamMetric, DreamMetricData } from '../../types/core';

/**
 * Interface representing metrics state
 */
interface MetricsStateData {
  metricsVersion: string;
  metrics: Record<string, DreamMetric>;
  entries: DreamMetricData[];
}

/**
 * Manages the state for dream metrics
 */
export class MetricsState extends MutableState<MetricsStateData> {
  /**
   * Default empty metrics state
   */
  private static DEFAULT_STATE: MetricsStateData = {
    metricsVersion: '1.0.0',
    metrics: {},
    entries: []
  };

  /**
   * Creates a new metrics state
   * @param initialState Optional initial state
   */
  constructor(initialState: Partial<MetricsStateData> = {}) {
    super({
      ...MetricsState.DEFAULT_STATE,
      ...initialState
    });
  }

  /**
   * Adds a metric to the state
   * @param metric The metric to add
   * @param options Optional category for the metric
   */
  addMetric(metric: DreamMetric, options: { category?: string } = {}): void {
    this.updateState(state => {
      return {
        ...state,
        metrics: {
          ...state.metrics,
          [metric.name]: {
            ...metric,
            category: options.category || metric.category || 'default'
          }
        }
      };
    });
  }

  /**
   * Removes a metric from the state
   * @param metricName The name of the metric to remove
   */
  removeMetric(metricName: string): void {
    this.updateState(state => {
      const newMetrics = { ...state.metrics };
      delete newMetrics[metricName];
      
      return {
        ...state,
        metrics: newMetrics
      };
    });
  }

  /**
   * Adds an entry to the state
   * @param entry The entry to add
   */
  addEntry(entry: DreamMetricData): void {
    this.updateState(state => {
      return {
        ...state,
        entries: [...state.entries, entry]
      };
    });
  }

  /**
   * Gets all metrics
   * @returns Record of metrics
   */
  getMetrics(): Record<string, DreamMetric> {
    return this.getState().metrics;
  }

  /**
   * Gets all entries
   * @returns Array of entries
   */
  getEntries(): DreamMetricData[] {
    return this.getState().entries;
  }
} 
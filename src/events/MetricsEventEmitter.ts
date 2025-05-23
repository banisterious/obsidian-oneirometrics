import { EventEmitter } from './EventEmitter';
import { MetricsEvents } from './EventTypes';

/**
 * Event emitter for metrics-related events.
 * Provides typed methods for emitting standard metrics events.
 */
export class MetricsEventEmitter extends EventEmitter<MetricsEvents> {
  private static instance: MetricsEventEmitter;
  
  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {
    super();
  }
  
  /**
   * Get the singleton instance of the metrics event emitter.
   * @returns The MetricsEventEmitter instance
   */
  public static getInstance(): MetricsEventEmitter {
    if (!MetricsEventEmitter.instance) {
      MetricsEventEmitter.instance = new MetricsEventEmitter();
    }
    return MetricsEventEmitter.instance;
  }
  
  /**
   * Emit event when metrics have been calculated.
   * @param metrics The calculated metrics data
   * @param source The source of the metrics (e.g., "manual", "scheduled")
   */
  notifyMetricsCalculated(metrics: Record<string, number[]>, source: string): void {
    this.emit('metrics:calculated', { metrics, source });
  }
  
  /**
   * Emit event to display metrics in a specific UI element.
   * @param target The target HTML element
   * @param metrics The metrics data to display
   */
  requestMetricsDisplay(target: HTMLElement, metrics: Record<string, number[]>): void {
    this.emit('metrics:display', { target, metrics });
  }
  
  /**
   * Emit event when a metrics filter is applied.
   * @param filter The filter being applied
   */
  notifyFilterApplied(filter: any): void {
    this.emit('metrics:filter', { filter });
  }
  
  /**
   * Emit event when a metric value changes.
   * @param name The name of the metric
   * @param oldValue The previous value
   * @param newValue The new value
   * @param source The source of the change
   */
  notifyMetricValueChanged(name: string, oldValue: number, newValue: number, source: string): void {
    this.emit('metrics:valueChanged', { name, oldValue, newValue, source });
  }
} 
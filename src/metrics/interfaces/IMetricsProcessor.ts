import { DreamMetricData } from '../../../types';

/**
 * Interface for the main metrics processing service.
 * Responsible for extracting, processing, and analyzing dream metrics.
 */
export interface IMetricsProcessor {
  /**
   * Process metrics text from a dream entry callout.
   * Parses comma-separated metric pairs and converts to numerical values.
   * 
   * @param metricsText The raw metrics text from a dream entry callout
   * @param globalMetrics The global metrics record to update (optional)
   * @returns Record of processed metrics for this dream entry
   */
  processMetricsText(
    metricsText: string, 
    globalMetrics?: Record<string, number[]>
  ): Record<string, number>;
  
  /**
   * Process a complete dream entry to extract all metrics.
   * This includes explicit metrics and derived ones like word count.
   * 
   * @param entry The dream entry data
   * @returns The processed entry with complete metrics
   */
  processEntry(entry: DreamMetricData): DreamMetricData;
  
  /**
   * Process multiple dream entries and aggregate their metrics.
   * 
   * @param entries Array of dream entries to process
   * @returns Object containing aggregated metrics and processed entries
   */
  processDreamEntries(
    entries: DreamMetricData[]
  ): {
    metrics: Record<string, number[]>;
    processedEntries: DreamMetricData[];
  };
  
  /**
   * Calculate summary statistics for metrics (min, max, avg, etc.).
   * 
   * @param metrics Metrics data to analyze
   * @returns Summary statistics for each metric
   */
  calculateSummaryStatistics(
    metrics: Record<string, number[]>
  ): Record<string, { min: number; max: number; avg: number; count: number }>;
  
  /**
   * Generate a metrics summary in string format.
   * 
   * @param metrics The metrics to summarize
   * @returns Formatted summary string
   */
  getMetricsSummary(metrics: Record<string, number[]>): string;
  
  /**
   * Calculate time-based metrics analysis (by month, day of week, etc.).
   * 
   * @param entries Dream entries to analyze
   * @returns Time-based metrics analysis
   */
  getTimeBasedMetrics(entries: DreamMetricData[]): Record<string, any>;
  
  /**
   * Extract metrics from visible table rows in the UI.
   * 
   * @param container HTML element containing the table rows
   * @returns Collected metrics from visible rows
   */
  collectVisibleRowMetrics(container: HTMLElement): Record<string, number[]>;
} 
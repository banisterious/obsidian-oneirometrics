import { DreamMetric } from '../../types';

/**
 * Interface for analyzing dream journal content.
 * Provides methods for cleaning content and extracting metrics.
 */
export interface IDreamAnalyzer {
  /**
   * Process and clean dream content by removing markdown artifacts,
   * callouts, and other non-essential elements.
   * @param content Raw dream journal content
   * @returns Cleaned dream content
   */
  processDreamContent(content: string): string;
  
  /**
   * Extract metrics from metrics text using a comma-separated format.
   * @param metricsText Text containing metrics in format "name: value, name2: value2"
   * @param availableMetrics Dictionary of available metrics by name
   * @param existingMetrics Optional dictionary to update with new metrics 
   * @returns Dictionary of metric names to values
   */
  extractMetrics(
    metricsText: string, 
    availableMetrics: Record<string, DreamMetric>,
    existingMetrics?: Record<string, number[]>
  ): Record<string, number>;
  
  /**
   * Calculate summary statistics for a set of metrics.
   * @param metrics Dictionary of metric names to arrays of values
   * @returns Dictionary with summary statistics
   */
  calculateMetricsSummary(metrics: Record<string, number[]>): Record<string, {
    min: number;
    max: number;
    avg: number;
    count: number;
  }>;
  
  /**
   * Find patterns in dream metrics data.
   * @param metrics Dictionary of metric names to arrays of values
   * @returns Dictionary with pattern analysis
   */
  findMetricsPatterns(metrics: Record<string, number[]>): Record<string, {
    trends: string;
    correlations: Array<{metric: string, strength: number}>;
  }>;
} 
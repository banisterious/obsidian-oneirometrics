import { DreamMetricData } from '../../../types';

/**
 * Statistical values for a single metric
 */
export interface MetricStats {
  /**
   * Metric identifier
   */
  key: string;
  
  /**
   * Display name of the metric
   */
  name: string;
  
  /**
   * Average value across all entries
   */
  average: number;
  
  /**
   * Median value across all entries
   */
  median: number;
  
  /**
   * Minimum value found
   */
  min: number;
  
  /**
   * Maximum value found
   */
  max: number;
  
  /**
   * Standard deviation
   */
  stdDev: number;
  
  /**
   * Total count of entries with this metric
   */
  count: number;
  
  /**
   * Values trend over time (increases, decreases, or fluctuates)
   */
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating' | 'unknown';
  
  /**
   * Description of the metric (if available)
   */
  description?: string;
}

/**
 * Histogram bucket for visualization
 */
export interface HistogramBucket {
  /**
   * Starting value of the range (inclusive)
   */
  start: number;
  
  /**
   * Ending value of the range (exclusive)
   */
  end: number;
  
  /**
   * Count of entries in this range
   */
  count: number;
}

/**
 * Time series data point for trends
 */
export interface TimeSeriesPoint {
  /**
   * Date of the data point (typically month/year)
   */
  date: Date;
  
  /**
   * Average value for this time period
   */
  value: number;
  
  /**
   * Number of entries in this time period
   */
  count: number;
}

/**
 * Props for the SummaryView component
 */
export interface SummaryViewProps {
  /**
   * Dream entries to analyze
   */
  entries: DreamMetricData[];
  
  /**
   * Statistics for each metric
   */
  metricStats: MetricStats[];
  
  /**
   * Currently selected metric for detailed view
   */
  selectedMetricKey: string | null;
  
  /**
   * Histogram data for the selected metric
   */
  histogram: HistogramBucket[];
  
  /**
   * Time series data for the selected metric
   */
  timeSeries: TimeSeriesPoint[];
  
  /**
   * Total number of dream entries
   */
  totalEntries: number;
  
  /**
   * Date range of the data
   */
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
}

/**
 * Callbacks for the SummaryView component
 */
export interface SummaryViewCallbacks {
  /**
   * Called when a metric is selected
   */
  onMetricSelect?: (metricKey: string) => void;
  
  /**
   * Called when user requests to export data
   */
  onExportRequest?: (format: 'csv' | 'json') => void;
  
  /**
   * Called when user changes the visualization type
   */
  onVisualizationChange?: (type: 'histogram' | 'timeSeries' | 'table') => void;
} 
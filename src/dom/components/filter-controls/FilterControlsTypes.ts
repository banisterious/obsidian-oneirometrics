import { DreamMetricData } from '../../../types';

/**
 * Date range filter state
 */
export interface DateRange {
  /**
   * Start date for filtering
   */
  startDate: Date | null;
  
  /**
   * End date for filtering
   */
  endDate: Date | null;
}

/**
 * Predefined date range options
 */
export enum DateRangePreset {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  THIS_WEEK = 'thisWeek',
  LAST_WEEK = 'lastWeek',
  THIS_MONTH = 'thisMonth',
  LAST_MONTH = 'lastMonth',
  LAST_30_DAYS = 'last30Days',
  LAST_90_DAYS = 'last90Days',
  THIS_YEAR = 'thisYear',
  ALL_TIME = 'allTime'
}

/**
 * Filter criteria for metrics
 */
export interface MetricFilter {
  key: string;
  min?: number;
  max?: number;
}

/**
 * Props for the FilterControls component
 */
export interface FilterControlsProps {
  /**
   * Current date range filter
   */
  dateRange: DateRange;
  
  /**
   * Active metric filters
   */
  metricFilters: MetricFilter[];
  
  /**
   * Available metrics for filtering
   */
  availableMetrics: Record<string, { name: string, description?: string }>;
  
  /**
   * Total entries before filtering
   */
  totalEntries: number;
  
  /**
   * Filtered entries count
   */
  filteredEntries: number;
}

/**
 * Event handlers for the FilterControls component
 */
export interface FilterControlsCallbacks {
  /**
   * Called when the date range changes
   */
  onDateRangeChange?: (dateRange: DateRange) => void;
  
  /**
   * Called when a preset date range is selected
   */
  onDateRangePresetSelect?: (preset: DateRangePreset) => void;
  
  /**
   * Called when metric filters change
   */
  onMetricFilterChange?: (filters: MetricFilter[]) => void;
  
  /**
   * Called when filters are cleared
   */
  onClearFilters?: () => void;
}

/**
 * Filter result containing filtered entries and stats
 */
export interface FilterResult {
  /**
   * Filtered dream entries
   */
  entries: DreamMetricData[];
  
  /**
   * Total count before filtering
   */
  totalCount: number;
  
  /**
   * Filtered count after applying filters
   */
  filteredCount: number;
} 
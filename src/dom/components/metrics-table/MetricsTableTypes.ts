import { DreamMetricData } from '../../../types';

/**
 * Configuration for the MetricsTable component
 */
export interface MetricsTableConfig {
  /**
   * Number of visible rows to display at once
   * For performance optimization
   */
  visibleRows: number;
  
  /**
   * Height of each row in pixels
   */
  rowHeight: number;
}

/**
 * Props for the MetricsTable component
 */
export interface MetricsTableProps {
  /**
   * Dream entries to display in the table
   */
  entries: DreamMetricData[];
  
  /**
   * Metrics to display as columns
   */
  metrics: Record<string, { name: string, description?: string }>;
  
  /**
   * Configuration for the table
   */
  config?: Partial<MetricsTableConfig>;
  
  /**
   * IDs of rows that are expanded
   */
  expandedRows?: Set<string>;
  
  /**
   * ID of row to scroll to
   */
  scrollToRowId?: string | null;
}

/**
 * Event handlers for the MetricsTable component
 */
export interface MetricsTableCallbacks {
  /**
   * Called when the expand/collapse button is clicked
   */
  onToggleExpand?: (id: string, isExpanded: boolean) => void;
  
  /**
   * Called when a row is clicked
   */
  onRowClick?: (entry: DreamMetricData) => void;
  
  /**
   * Called when a header is clicked for sorting
   */
  onHeaderClick?: (metricKey: string) => void;
} 
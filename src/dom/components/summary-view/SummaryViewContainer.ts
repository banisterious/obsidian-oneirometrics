import { App, Notice } from 'obsidian';
import { DreamMetricsState } from '../../../state/DreamMetricsState';
import { DreamMetricData } from '../../../types';
import { SummaryViewView } from './SummaryViewView';
import {
  SummaryViewProps,
  MetricStats,
  HistogramBucket,
  TimeSeriesPoint
} from './SummaryViewTypes';
import { OneiroMetricsEvents } from '../../../events';

/**
 * Interface for filtered entries event data
 */
interface FilteredEntriesEventData {
  entries: DreamMetricData[];
  totalCount: number;
  filteredCount: number;
}

/**
 * Container component for the summary view
 * 
 * This component handles the business logic for analyzing and summarizing
 * dream metrics data, while delegating rendering to the SummaryViewView component.
 */
export class SummaryViewContainer {
  // Dependencies
  private app: App;
  private state: DreamMetricsState;
  private events: OneiroMetricsEvents;
  
  // Component references
  private view: SummaryViewView;
  
  // Component state
  private entries: DreamMetricData[] = [];
  private metricStats: MetricStats[] = [];
  private selectedMetricKey: string | null = null;
  private histogram: HistogramBucket[] = [];
  private timeSeries: TimeSeriesPoint[] = [];
  private dateRange: { startDate: Date | null, endDate: Date | null } = { 
    startDate: null, 
    endDate: null 
  };
  
  /**
   * Constructor
   * @param app Obsidian app instance
   * @param container DOM element to render into
   * @param state Plugin state
   */
  constructor(
    app: App, 
    container: HTMLElement, 
    state: DreamMetricsState
  ) {
    this.app = app;
    this.state = state;
    this.events = OneiroMetricsEvents.getInstance();
    
    // Get initial data
    this.entries = this.state.getDreamEntries();
    
    // Calculate summary statistics
    this.calculateMetricStats();
    
    // Select first metric by default if available
    if (this.metricStats.length > 0) {
      this.selectedMetricKey = this.metricStats[0].key;
      this.updateVisualizations();
    }
    
    // Create initial props
    const props: SummaryViewProps = {
      entries: this.entries,
      metricStats: this.metricStats,
      selectedMetricKey: this.selectedMetricKey,
      histogram: this.histogram,
      timeSeries: this.timeSeries,
      totalEntries: this.entries.length,
      dateRange: this.dateRange
    };
    
    // Create view component
    this.view = new SummaryViewView(props, {
      onMetricSelect: this.handleMetricSelect.bind(this),
      onExportRequest: this.handleExportRequest.bind(this),
      onVisualizationChange: this.handleVisualizationChange.bind(this)
    });
    
    // Render the view
    this.view.render(container);
    
    // Subscribe to events
    this.subscribeToEvents();
  }
  
  /**
   * Clean up resources used by the component
   */
  public cleanup(): void {
    this.view.cleanup();
  }
  
  /**
   * Subscribe to application events
   */
  private subscribeToEvents(): void {
    // Listen for filtered entries using the events system
    this.events.on('entries:filtered', (data: FilteredEntriesEventData) => {
      this.entries = data.entries;
      this.calculateMetricStats();
      
      if (this.selectedMetricKey) {
        this.updateVisualizations();
      }
      
      // Update view
      this.view.update({
        entries: this.entries,
        metricStats: this.metricStats,
        histogram: this.histogram,
        timeSeries: this.timeSeries,
        totalEntries: this.entries.length
      });
    });
    
    // Listen for date range changes
    this.events.on('dateRange:updated', (range: { startDate: Date | null, endDate: Date | null }) => {
      this.dateRange = range;
      
      // Update view
      this.view.update({
        dateRange: this.dateRange
      });
    });
  }
  
  /**
   * Handle metric selection
   * @param metricKey Selected metric key
   */
  private handleMetricSelect(metricKey: string): void {
    this.selectedMetricKey = metricKey;
    this.updateVisualizations();
    
    // Update view
    this.view.update({
      selectedMetricKey: this.selectedMetricKey,
      histogram: this.histogram,
      timeSeries: this.timeSeries
    });
  }
  
  /**
   * Handle export request
   * @param format Export format (csv or json)
   */
  private handleExportRequest(format: 'csv' | 'json'): void {
    if (this.entries.length === 0) {
      // Show notification if no data to export
      new Notice('No data to export');
      return;
    }
    
    if (format === 'csv') {
      this.exportToCsv();
    } else {
      this.exportToJson();
    }
  }
  
  /**
   * Handle visualization type change
   * @param type Visualization type
   */
  private handleVisualizationChange(type: 'histogram' | 'timeSeries' | 'table'): void {
    // Nothing to do here - the view handles the visualization change internally
    console.log(`Changed visualization to ${type}`);
  }
  
  /**
   * Calculate statistics for all metrics
   */
  private calculateMetricStats(): void {
    // Get metrics to calculate
    const metricsDefinition = this.state.getMetrics();
    
    // Reset stats
    this.metricStats = [];
    
    // Process each metric
    Object.entries(metricsDefinition).forEach(([key, metadata]) => {
      // Extract all values for this metric
      const values = this.entries
        .filter(entry => entry.metrics && key in entry.metrics)
        .map(entry => entry.metrics[key]);
      
      // Skip if no values
      if (values.length === 0) return;
      
      // Calculate statistics
      const average = this.calculateAverage(values);
      const median = this.calculateMedian(values);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const stdDev = this.calculateStdDev(values, average);
      const trend = this.calculateTrend(key);
      
      // Create metric stats
      const stats: MetricStats = {
        key,
        name: metadata.name,
        description: metadata.description,
        average,
        median,
        min,
        max,
        stdDev,
        count: values.length,
        trend
      };
      
      // Add to stats array
      this.metricStats.push(stats);
    });
    
    // Sort by name
    this.metricStats.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  /**
   * Update visualizations for the selected metric
   */
  private updateVisualizations(): void {
    if (!this.selectedMetricKey) return;
    
    // Update histogram
    this.updateHistogram();
    
    // Update time series
    this.updateTimeSeries();
  }
  
  /**
   * Update histogram for the selected metric
   */
  private updateHistogram(): void {
    if (!this.selectedMetricKey) return;
    
    // Extract values for the selected metric
    const values = this.entries
      .filter(entry => entry.metrics && this.selectedMetricKey! in entry.metrics)
      .map(entry => entry.metrics[this.selectedMetricKey!]);
    
    // Reset histogram
    this.histogram = [];
    
    if (values.length === 0) return;
    
    // Find min and max values
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // If min and max are the same, create a single bucket
    if (min === max) {
      this.histogram = [{
        start: min - 0.5,
        end: max + 0.5,
        count: values.length
      }];
      return;
    }
    
    // Determine number of buckets (between 5 and 10)
    // More buckets for larger datasets
    const numBuckets = Math.min(10, Math.max(5, Math.ceil(Math.sqrt(values.length) / 2)));
    
    // Calculate bucket size
    const range = max - min;
    const bucketSize = range / numBuckets;
    
    // Create empty buckets
    for (let i = 0; i < numBuckets; i++) {
      const start = min + (i * bucketSize);
      const end = min + ((i + 1) * bucketSize);
      
      this.histogram.push({
        start,
        end,
        count: 0
      });
    }
    
    // Count values in each bucket
    values.forEach(value => {
      // Find bucket index
      const bucketIndex = Math.min(
        numBuckets - 1,
        Math.floor((value - min) / bucketSize)
      );
      
      // Increment count
      this.histogram[bucketIndex].count++;
    });
  }
  
  /**
   * Update time series for the selected metric
   */
  private updateTimeSeries(): void {
    if (!this.selectedMetricKey) return;
    
    // Reset time series
    this.timeSeries = [];
    
    // Filter entries with the selected metric
    const relevantEntries = this.entries
      .filter(entry => entry.metrics && this.selectedMetricKey! in entry.metrics);
    
    if (relevantEntries.length === 0) return;
    
    // Group entries by month/year
    const entriesByMonth: Record<string, DreamMetricData[]> = {};
    
    relevantEntries.forEach(entry => {
      try {
        const date = new Date(entry.date);
        const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!entriesByMonth[yearMonth]) {
          entriesByMonth[yearMonth] = [];
        }
        
        entriesByMonth[yearMonth].push(entry);
      } catch (e) {
        console.error('Error processing date:', entry.date, e);
      }
    });
    
    // Calculate average for each month
    Object.entries(entriesByMonth).forEach(([yearMonth, monthEntries]) => {
      const [year, month] = yearMonth.split('-').map(Number);
      const values = monthEntries.map(entry => entry.metrics[this.selectedMetricKey!]);
      const average = this.calculateAverage(values);
      
      this.timeSeries.push({
        date: new Date(year, month - 1, 15), // Middle of the month
        value: average,
        count: values.length
      });
    });
    
    // Sort by date
    this.timeSeries.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  /**
   * Calculate the trend for a metric
   * @param metricKey Metric key
   * @returns Trend description
   */
  private calculateTrend(metricKey: string): 'increasing' | 'decreasing' | 'stable' | 'fluctuating' | 'unknown' {
    // Get entries with this metric, sorted by date
    const relevantEntries = this.entries
      .filter(entry => entry.metrics && metricKey in entry.metrics)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Need at least 3 entries to determine trend
    if (relevantEntries.length < 3) {
      return 'unknown';
    }
    
    // Extract values
    const values = relevantEntries.map(entry => entry.metrics[metricKey]);
    
    // Calculate differences between consecutive values
    const differences = [];
    for (let i = 1; i < values.length; i++) {
      differences.push(values[i] - values[i - 1]);
    }
    
    // Count positive and negative differences
    const positiveCount = differences.filter(diff => diff > 0).length;
    const negativeCount = differences.filter(diff => diff < 0).length;
    const zeroCount = differences.filter(diff => diff === 0).length;
    
    const totalDiffs = differences.length;
    
    // If most differences are positive, trend is increasing
    if (positiveCount > 0.6 * totalDiffs) {
      return 'increasing';
    }
    
    // If most differences are negative, trend is decreasing
    if (negativeCount > 0.6 * totalDiffs) {
      return 'decreasing';
    }
    
    // If most differences are zero, trend is stable
    if (zeroCount > 0.6 * totalDiffs) {
      return 'stable';
    }
    
    // Otherwise, trend is fluctuating
    return 'fluctuating';
  }
  
  /**
   * Calculate the average of an array of numbers
   * @param values Array of numbers
   * @returns Average value
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  
  /**
   * Calculate the median of an array of numbers
   * @param values Array of numbers
   * @returns Median value
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    // Sort values
    const sorted = [...values].sort((a, b) => a - b);
    
    // Get middle value
    const middle = Math.floor(sorted.length / 2);
    
    // If odd number of values, return middle value
    if (sorted.length % 2 === 1) {
      return sorted[middle];
    }
    
    // If even number of values, return average of two middle values
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  /**
   * Calculate standard deviation
   * @param values Array of numbers
   * @param average Average value (optional, will be calculated if not provided)
   * @returns Standard deviation
   */
  private calculateStdDev(values: number[], average?: number): number {
    if (values.length <= 1) return 0;
    
    // Calculate average if not provided
    const avg = average !== undefined ? average : this.calculateAverage(values);
    
    // Calculate sum of squared differences
    const sumSquaredDiff = values.reduce((sum, value) => {
      const diff = value - avg;
      return sum + (diff * diff);
    }, 0);
    
    // Calculate variance
    const variance = sumSquaredDiff / (values.length - 1);
    
    // Return standard deviation
    return Math.sqrt(variance);
  }
  
  /**
   * Export data to CSV
   */
  private exportToCsv(): void {
    // Only export if there's a metric selected
    if (!this.selectedMetricKey) {
      new Notice('Please select a metric to export');
      return;
    }
    
    try {
      // Get selected metric
      const metric = this.metricStats.find(m => m.key === this.selectedMetricKey);
      if (!metric) throw new Error('Selected metric not found');
      
      // Filter entries to those that have the selected metric
      const relevantEntries = this.entries
        .filter(entry => entry.metrics && this.selectedMetricKey! in entry.metrics)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Create CSV header
      let csv = `Date,Entry,${metric.name}\n`;
      
      // Add rows
      relevantEntries.forEach(entry => {
        const date = new Date(entry.date).toISOString().split('T')[0];
        const title = (entry.title || 'Untitled').replace(/,/g, '');
        const value = entry.metrics[this.selectedMetricKey!];
        
        csv += `${date},"${title}",${value}\n`;
      });
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${metric.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      new Notice(`Exported ${relevantEntries.length} entries to CSV`);
    } catch (e) {
      console.error('Error exporting CSV:', e);
      new Notice('Error exporting CSV: ' + e.message);
    }
  }
  
  /**
   * Export data to JSON
   */
  private exportToJson(): void {
    // Only export if there's a metric selected
    if (!this.selectedMetricKey) {
      new Notice('Please select a metric to export');
      return;
    }
    
    try {
      // Get selected metric
      const metric = this.metricStats.find(m => m.key === this.selectedMetricKey);
      if (!metric) throw new Error('Selected metric not found');
      
      // Filter entries to those that have the selected metric
      const relevantEntries = this.entries
        .filter(entry => entry.metrics && this.selectedMetricKey! in entry.metrics)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Create export data
      const exportData = {
        metric: {
          key: metric.key,
          name: metric.name,
          description: metric.description
        },
        stats: {
          average: metric.average,
          median: metric.median,
          min: metric.min,
          max: metric.max,
          stdDev: metric.stdDev,
          count: metric.count,
          trend: metric.trend
        },
        entries: relevantEntries.map(entry => ({
          date: entry.date,
          title: entry.title,
          value: entry.metrics[this.selectedMetricKey!]
        })),
        histogram: this.histogram,
        timeSeries: this.timeSeries.map(point => ({
          date: point.date.toISOString().split('T')[0],
          value: point.value,
          count: point.count
        })),
        exportDate: new Date().toISOString()
      };
      
      // Convert to JSON
      const json = JSON.stringify(exportData, null, 2);
      
      // Create download link
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${metric.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      new Notice(`Exported ${relevantEntries.length} entries to JSON`);
    } catch (e) {
      console.error('Error exporting JSON:', e);
      new Notice('Error exporting JSON: ' + e.message);
    }
  }
} 
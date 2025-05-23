import { BaseComponent } from '../BaseComponent';
import { DreamMetricData } from '../../../types';
import {
  SummaryViewProps,
  SummaryViewCallbacks,
  MetricStats,
  HistogramBucket,
  TimeSeriesPoint
} from './SummaryViewTypes';

/**
 * View component for the dream metrics summary
 * 
 * This component displays summary statistics and visualizations
 * for dream metrics data.
 */
export class SummaryViewView extends BaseComponent {
  // Component state
  private props: SummaryViewProps;
  private callbacks: SummaryViewCallbacks;
  
  // DOM references
  private summaryContainer: HTMLElement | null = null;
  private metricsListContainer: HTMLElement | null = null;
  private detailsContainer: HTMLElement | null = null;
  private visualizationContainer: HTMLElement | null = null;
  private statsContainer: HTMLElement | null = null;
  private visualizationType: 'histogram' | 'timeSeries' | 'table' = 'histogram';
  
  /**
   * Constructor
   * @param props Initial props for the component
   * @param callbacks Event callbacks for the component
   */
  constructor(props: SummaryViewProps, callbacks: SummaryViewCallbacks = {}) {
    super();
    this.props = props;
    this.callbacks = callbacks;
  }
  
  /**
   * Called when the component is rendered
   */
  protected onRender(): void {
    if (!this.containerEl) return;
    
    this.summaryContainer = this.containerEl.createDiv({ cls: 'oom-summary-container' });
    
    // Create header with overall stats
    this.renderHeader(this.summaryContainer);
    
    // Create two-column layout
    const contentContainer = this.summaryContainer.createDiv({ cls: 'oom-summary-content' });
    
    // Left column - metrics list
    this.metricsListContainer = contentContainer.createDiv({ cls: 'oom-metrics-list' });
    this.renderMetricsList(this.metricsListContainer);
    
    // Right column - details and visualization
    this.detailsContainer = contentContainer.createDiv({ cls: 'oom-details-container' });
    this.renderDetailsView(this.detailsContainer);
  }
  
  /**
   * Called when the component is updated
   * @param data New data for the component
   */
  protected onUpdate(data: Partial<SummaryViewProps>): void {
    // Update props
    this.props = { ...this.props, ...data };
    
    // Update UI based on changed props
    if ('metricStats' in data) {
      this.renderMetricsList(this.metricsListContainer);
    }
    
    if ('selectedMetricKey' in data || 'histogram' in data || 'timeSeries' in data) {
      this.renderDetailsView(this.detailsContainer);
    }
    
    if ('totalEntries' in data || 'dateRange' in data) {
      this.renderHeader(this.summaryContainer);
    }
  }
  
  /**
   * Render the header with overall stats
   * @param container Container element
   */
  private renderHeader(container: HTMLElement | null): void {
    if (!container) return;
    
    // Clear existing header
    const existingHeader = container.querySelector('.oom-summary-header');
    if (existingHeader) existingHeader.remove();
    
    const headerContainer = container.createDiv({ cls: 'oom-summary-header' });
    
    // Title
    headerContainer.createEl('h2', { text: 'Dream Metrics Summary', cls: 'oom-summary-title' });
    
    // Stats container
    const statsContainer = headerContainer.createDiv({ cls: 'oom-summary-stats' });
    
    // Entry count
    const entryCountContainer = statsContainer.createDiv({ cls: 'oom-stat-container' });
    entryCountContainer.createEl('span', { text: 'Total Entries:', cls: 'oom-stat-label' });
    entryCountContainer.createEl('span', { text: `${this.props.totalEntries}`, cls: 'oom-stat-value' });
    
    // Date range
    const dateRangeContainer = statsContainer.createDiv({ cls: 'oom-stat-container' });
    dateRangeContainer.createEl('span', { text: 'Date Range:', cls: 'oom-stat-label' });
    
    const dateRangeText = this.formatDateRange(this.props.dateRange.startDate, this.props.dateRange.endDate);
    dateRangeContainer.createEl('span', { text: dateRangeText, cls: 'oom-stat-value' });
    
    // Export buttons
    const actionsContainer = headerContainer.createDiv({ cls: 'oom-actions-container' });
    
    const exportCsvButton = actionsContainer.createEl('button', {
      text: 'Export CSV',
      cls: 'oom-button oom-button--small'
    });
    
    const exportJsonButton = actionsContainer.createEl('button', {
      text: 'Export JSON',
      cls: 'oom-button oom-button--small'
    });
    
    // Add event listeners
    exportCsvButton.addEventListener('click', () => {
      this.callbacks.onExportRequest?.('csv');
    });
    
    exportJsonButton.addEventListener('click', () => {
      this.callbacks.onExportRequest?.('json');
    });
  }
  
  /**
   * Render the metrics list
   * @param container Container element
   */
  private renderMetricsList(container: HTMLElement | null): void {
    if (!container) return;
    
    // Clear existing content
    container.empty();
    
    // Header
    container.createEl('h3', { text: 'Available Metrics', cls: 'oom-metrics-list-title' });
    
    // Create metric items
    if (this.props.metricStats.length === 0) {
      container.createEl('p', { text: 'No metrics available', cls: 'oom-empty-state' });
      return;
    }
    
    const metricsList = container.createEl('ul', { cls: 'oom-metrics-list-items' });
    
    this.props.metricStats.forEach(metric => {
      const listItem = metricsList.createEl('li', { 
        cls: 'oom-metric-list-item' + 
             (this.props.selectedMetricKey === metric.key ? ' oom-metric-list-item--selected' : '')
      });
      
      // Metric name with count
      const metricName = listItem.createDiv({ cls: 'oom-metric-name-container' });
      metricName.createEl('span', { text: metric.name, cls: 'oom-metric-name' });
      metricName.createEl('span', { text: `(${metric.count})`, cls: 'oom-metric-count' });
      
      // Quick stats
      const quickStats = listItem.createDiv({ cls: 'oom-quick-stats' });
      
      // Average
      const avgContainer = quickStats.createDiv({ cls: 'oom-quick-stat' });
      avgContainer.createEl('span', { text: 'Avg:', cls: 'oom-quick-stat-label' });
      avgContainer.createEl('span', { text: metric.average.toFixed(1), cls: 'oom-quick-stat-value' });
      
      // Trend indicator
      const trendContainer = quickStats.createDiv({ cls: 'oom-quick-stat' });
      trendContainer.createEl('span', { text: 'Trend:', cls: 'oom-quick-stat-label' });
      
      const trendEl = trendContainer.createEl('span', { cls: 'oom-trend-indicator' });
      this.renderTrendIndicator(trendEl, metric.trend);
      
      // Add event listener
      listItem.addEventListener('click', () => {
        this.callbacks.onMetricSelect?.(metric.key);
      });
    });
  }
  
  /**
   * Render the details view for selected metric
   * @param container Container element
   */
  private renderDetailsView(container: HTMLElement | null): void {
    if (!container) return;
    
    // Clear existing content
    container.empty();
    
    // If no metric selected, show placeholder
    if (!this.props.selectedMetricKey) {
      container.createEl('div', { 
        text: 'Select a metric to view details',
        cls: 'oom-empty-state oom-empty-state--large'
      });
      return;
    }
    
    // Find the selected metric
    const selectedMetric = this.props.metricStats.find(
      metric => metric.key === this.props.selectedMetricKey
    );
    
    if (!selectedMetric) {
      container.createEl('div', { 
        text: 'Metric not found',
        cls: 'oom-empty-state oom-empty-state--error'
      });
      return;
    }
    
    // Metric header
    const metricHeader = container.createDiv({ cls: 'oom-metric-header' });
    metricHeader.createEl('h3', { text: selectedMetric.name, cls: 'oom-metric-title' });
    
    if (selectedMetric.description) {
      metricHeader.createEl('p', { 
        text: selectedMetric.description,
        cls: 'oom-metric-description'
      });
    }
    
    // Visualization type selector
    const visualizationSelector = container.createDiv({ cls: 'oom-visualization-selector' });
    
    // Create selector buttons
    const histogramButton = visualizationSelector.createEl('button', {
      text: 'Histogram',
      cls: `oom-button oom-button--tab ${this.visualizationType === 'histogram' ? 'oom-button--active' : ''}`
    });
    
    const timeSeriesButton = visualizationSelector.createEl('button', {
      text: 'Time Series',
      cls: `oom-button oom-button--tab ${this.visualizationType === 'timeSeries' ? 'oom-button--active' : ''}`
    });
    
    const tableButton = visualizationSelector.createEl('button', {
      text: 'Table',
      cls: `oom-button oom-button--tab ${this.visualizationType === 'table' ? 'oom-button--active' : ''}`
    });
    
    // Visualization container
    this.visualizationContainer = container.createDiv({ cls: 'oom-visualization-container' });
    
    // Stats container
    this.statsContainer = container.createDiv({ cls: 'oom-detailed-stats' });
    this.renderDetailedStats(this.statsContainer, selectedMetric);
    
    // Render appropriate visualization
    this.renderVisualization(this.visualizationContainer, selectedMetric);
    
    // Add event listeners for visualization type buttons
    histogramButton.addEventListener('click', () => {
      this.visualizationType = 'histogram';
      this.callbacks.onVisualizationChange?.('histogram');
      
      // Update active state
      histogramButton.classList.add('oom-button--active');
      timeSeriesButton.classList.remove('oom-button--active');
      tableButton.classList.remove('oom-button--active');
      
      this.renderVisualization(this.visualizationContainer, selectedMetric);
    });
    
    timeSeriesButton.addEventListener('click', () => {
      this.visualizationType = 'timeSeries';
      this.callbacks.onVisualizationChange?.('timeSeries');
      
      // Update active state
      histogramButton.classList.remove('oom-button--active');
      timeSeriesButton.classList.add('oom-button--active');
      tableButton.classList.remove('oom-button--active');
      
      this.renderVisualization(this.visualizationContainer, selectedMetric);
    });
    
    tableButton.addEventListener('click', () => {
      this.visualizationType = 'table';
      this.callbacks.onVisualizationChange?.('table');
      
      // Update active state
      histogramButton.classList.remove('oom-button--active');
      timeSeriesButton.classList.remove('oom-button--active');
      tableButton.classList.add('oom-button--active');
      
      this.renderVisualization(this.visualizationContainer, selectedMetric);
    });
  }
  
  /**
   * Render detailed statistics for a metric
   * @param container Container element
   * @param metric Metric data
   */
  private renderDetailedStats(container: HTMLElement | null, metric: MetricStats): void {
    if (!container) return;
    
    // Clear existing content
    container.empty();
    
    // Stats grid
    const statsGrid = container.createDiv({ cls: 'oom-stats-grid' });
    
    // Average
    const avgContainer = statsGrid.createDiv({ cls: 'oom-stat-item' });
    avgContainer.createEl('span', { text: 'Average:', cls: 'oom-stat-label' });
    avgContainer.createEl('span', { text: metric.average.toFixed(2), cls: 'oom-stat-value' });
    
    // Median
    const medianContainer = statsGrid.createDiv({ cls: 'oom-stat-item' });
    medianContainer.createEl('span', { text: 'Median:', cls: 'oom-stat-label' });
    medianContainer.createEl('span', { text: metric.median.toFixed(2), cls: 'oom-stat-value' });
    
    // Min
    const minContainer = statsGrid.createDiv({ cls: 'oom-stat-item' });
    minContainer.createEl('span', { text: 'Minimum:', cls: 'oom-stat-label' });
    minContainer.createEl('span', { text: metric.min.toFixed(2), cls: 'oom-stat-value' });
    
    // Max
    const maxContainer = statsGrid.createDiv({ cls: 'oom-stat-item' });
    maxContainer.createEl('span', { text: 'Maximum:', cls: 'oom-stat-label' });
    maxContainer.createEl('span', { text: metric.max.toFixed(2), cls: 'oom-stat-value' });
    
    // Standard Deviation
    const stdDevContainer = statsGrid.createDiv({ cls: 'oom-stat-item' });
    stdDevContainer.createEl('span', { text: 'Std Dev:', cls: 'oom-stat-label' });
    stdDevContainer.createEl('span', { text: metric.stdDev.toFixed(2), cls: 'oom-stat-value' });
    
    // Count
    const countContainer = statsGrid.createDiv({ cls: 'oom-stat-item' });
    countContainer.createEl('span', { text: 'Count:', cls: 'oom-stat-label' });
    countContainer.createEl('span', { text: metric.count.toString(), cls: 'oom-stat-value' });
    
    // Trend
    const trendContainer = statsGrid.createDiv({ cls: 'oom-stat-item' });
    trendContainer.createEl('span', { text: 'Trend:', cls: 'oom-stat-label' });
    
    const trendValueContainer = trendContainer.createEl('span', { cls: 'oom-stat-value' });
    
    // Add trend indicator
    this.renderTrendIndicator(trendValueContainer, metric.trend);
    trendValueContainer.appendChild(document.createTextNode(` ${this.formatTrendText(metric.trend)}`));
  }
  
  /**
   * Render visualization based on selected type
   * @param container Container element
   * @param metric Metric data
   */
  private renderVisualization(container: HTMLElement | null, metric: MetricStats): void {
    if (!container) return;
    
    // Clear existing content
    container.empty();
    
    // Render appropriate visualization
    switch (this.visualizationType) {
      case 'histogram':
        this.renderHistogram(container, this.props.histogram, metric);
        break;
      
      case 'timeSeries':
        this.renderTimeSeries(container, this.props.timeSeries, metric);
        break;
      
      case 'table':
        this.renderDataTable(container, this.props.entries, metric);
        break;
    }
  }
  
  /**
   * Render a histogram visualization
   * @param container Container element
   * @param buckets Histogram buckets
   * @param metric Metric data
   */
  private renderHistogram(
    container: HTMLElement, 
    buckets: HistogramBucket[], 
    metric: MetricStats
  ): void {
    if (buckets.length === 0) {
      container.createEl('div', { 
        text: 'No data available for histogram',
        cls: 'oom-empty-state'
      });
      return;
    }
    
    // Find the maximum count for scaling
    const maxCount = Math.max(...buckets.map(bucket => bucket.count));
    
    // Create a header for the histogram
    container.createEl('h4', { text: `Distribution of ${metric.name}`, cls: 'oom-visualization-title' });
    
    // Create histogram container
    const histogramContainer = container.createDiv({ cls: 'oom-histogram' });
    
    // Create bars
    buckets.forEach(bucket => {
      const barContainer = histogramContainer.createDiv({ cls: 'oom-histogram-bar-container' });
      
      // Create the bar with height based on count
      const height = (bucket.count / maxCount) * 100;
      const bar = barContainer.createDiv({ cls: 'oom-histogram-bar' });
      bar.style.height = `${height}%`;
      
      // Add count as text inside the bar
      if (bucket.count > 0) {
        bar.createEl('span', { text: bucket.count.toString(), cls: 'oom-histogram-count' });
      }
      
      // Add label below the bar
      const label = barContainer.createDiv({ cls: 'oom-histogram-label' });
      label.textContent = `${bucket.start.toFixed(0)}-${bucket.end.toFixed(0)}`;
    });
  }
  
  /**
   * Render a time series visualization
   * @param container Container element
   * @param points Time series data points
   * @param metric Metric data
   */
  private renderTimeSeries(
    container: HTMLElement, 
    points: TimeSeriesPoint[], 
    metric: MetricStats
  ): void {
    if (points.length === 0) {
      container.createEl('div', { 
        text: 'No data available for time series',
        cls: 'oom-empty-state'
      });
      return;
    }
    
    // Create a header for the time series
    container.createEl('h4', { text: `${metric.name} Over Time`, cls: 'oom-visualization-title' });
    
    // Find min and max values for scaling
    const values = points.map(point => point.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;
    
    // Create time series container
    const timeSeriesContainer = container.createDiv({ cls: 'oom-time-series' });
    
    // Create line chart
    const chartContainer = timeSeriesContainer.createDiv({ cls: 'oom-line-chart' });
    
    // Add points
    points.forEach((point, index) => {
      // Calculate position
      const x = (index / (points.length - 1)) * 100;
      const normalizedValue = valueRange === 0 ? 0.5 : (point.value - minValue) / valueRange;
      const y = 100 - (normalizedValue * 100);
      
      // Create point
      const pointEl = chartContainer.createDiv({ cls: 'oom-chart-point' });
      pointEl.style.left = `${x}%`;
      pointEl.style.top = `${y}%`;
      
      // Add tooltip with value
      pointEl.setAttribute('title', `${this.formatDate(point.date)}: ${point.value.toFixed(2)} (n=${point.count})`);
      
      // Connect points with lines (except first point)
      if (index > 0) {
        const prevPoint = points[index - 1];
        const prevX = ((index - 1) / (points.length - 1)) * 100;
        const prevNormalizedValue = valueRange === 0 ? 0.5 : (prevPoint.value - minValue) / valueRange;
        const prevY = 100 - (prevNormalizedValue * 100);
        
        // Create line
        const line = chartContainer.createDiv({ cls: 'oom-chart-line' });
        
        // Calculate line position and angle
        const deltaX = x - prevX;
        const deltaY = y - prevY;
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Position the line
        line.style.left = `${prevX}%`;
        line.style.top = `${prevY}%`;
        line.style.width = `${length}%`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.transformOrigin = '0 0';
      }
    });
    
    // Add x-axis labels
    const xAxisContainer = timeSeriesContainer.createDiv({ cls: 'oom-chart-x-axis' });
    
    // Add labels for first, middle, and last point
    const firstDate = points[0].date;
    const lastDate = points[points.length - 1].date;
    const middleDate = points[Math.floor(points.length / 2)].date;
    
    const firstLabel = xAxisContainer.createDiv({ 
      text: this.formatDate(firstDate),
      cls: 'oom-chart-axis-label'
    });
    firstLabel.style.left = '0%';
    
    const middleLabel = xAxisContainer.createDiv({ 
      text: this.formatDate(middleDate),
      cls: 'oom-chart-axis-label'
    });
    middleLabel.style.left = '50%';
    
    const lastLabel = xAxisContainer.createDiv({ 
      text: this.formatDate(lastDate),
      cls: 'oom-chart-axis-label'
    });
    lastLabel.style.left = '100%';
    
    // Add y-axis labels
    const yAxisContainer = timeSeriesContainer.createDiv({ cls: 'oom-chart-y-axis' });
    
    // Add min, max, and middle labels
    const minLabel = yAxisContainer.createDiv({ 
      text: minValue.toFixed(1),
      cls: 'oom-chart-axis-label'
    });
    minLabel.style.bottom = '0%';
    
    const midLabel = yAxisContainer.createDiv({ 
      text: ((minValue + maxValue) / 2).toFixed(1),
      cls: 'oom-chart-axis-label'
    });
    midLabel.style.bottom = '50%';
    
    const maxLabel = yAxisContainer.createDiv({ 
      text: maxValue.toFixed(1),
      cls: 'oom-chart-axis-label'
    });
    maxLabel.style.bottom = '100%';
  }
  
  /**
   * Render a data table for the selected metric
   * @param container Container element
   * @param entries Dream entries
   * @param metric Metric data
   */
  private renderDataTable(
    container: HTMLElement, 
    entries: DreamMetricData[], 
    metric: MetricStats
  ): void {
    // Create a header for the table
    container.createEl('h4', { text: `Data Table for ${metric.name}`, cls: 'oom-visualization-title' });
    
    // Filter entries to include only those with the selected metric
    const relevantEntries = entries.filter(entry => entry.metrics && metric.key in entry.metrics);
    
    if (relevantEntries.length === 0) {
      container.createEl('div', { 
        text: 'No data available for this metric',
        cls: 'oom-empty-state'
      });
      return;
    }
    
    // Create table
    const table = container.createEl('table', { cls: 'oom-data-table' });
    
    // Create header row
    const thead = table.createEl('thead');
    const headerRow = thead.createEl('tr');
    headerRow.createEl('th', { text: 'Date' });
    headerRow.createEl('th', { text: 'Entry' });
    headerRow.createEl('th', { text: 'Value' });
    
    // Create body
    const tbody = table.createEl('tbody');
    
    // Add rows for each entry
    relevantEntries
      // Sort by date (newest first)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      // Take only the first 50 entries to avoid performance issues
      .slice(0, 50)
      .forEach(entry => {
        const row = tbody.createEl('tr');
        
        // Date column
        row.createEl('td', { text: this.formatDate(new Date(entry.date)) });
        
        // Entry name column
        row.createEl('td', { text: entry.title || 'Untitled' });
        
        // Metric value column
        row.createEl('td', { 
          text: entry.metrics[metric.key].toFixed(2),
          cls: 'oom-table-value'
        });
      });
    
    // Add note if we're showing a limited set
    if (relevantEntries.length > 50) {
      container.createEl('p', { 
        text: `Showing 50 of ${relevantEntries.length} entries. Export the data to see all entries.`,
        cls: 'oom-table-note'
      });
    }
  }
  
  /**
   * Render a trend indicator
   * @param container Container element
   * @param trend Trend value
   */
  private renderTrendIndicator(container: HTMLElement, trend: string): void {
    let symbol = '';
    let cls = '';
    
    switch (trend) {
      case 'increasing':
        symbol = '↑';
        cls = 'oom-trend-up';
        break;
      
      case 'decreasing':
        symbol = '↓';
        cls = 'oom-trend-down';
        break;
      
      case 'stable':
        symbol = '→';
        cls = 'oom-trend-stable';
        break;
      
      case 'fluctuating':
        symbol = '↕';
        cls = 'oom-trend-fluctuating';
        break;
      
      case 'unknown':
      default:
        symbol = '•';
        cls = 'oom-trend-unknown';
        break;
    }
    
    container.textContent = symbol;
    container.classList.add(cls);
  }
  
  /**
   * Format a trend value as text
   * @param trend Trend value
   * @returns Formatted trend text
   */
  private formatTrendText(trend: string): string {
    switch (trend) {
      case 'increasing':
        return 'Increasing';
      
      case 'decreasing':
        return 'Decreasing';
      
      case 'stable':
        return 'Stable';
      
      case 'fluctuating':
        return 'Fluctuating';
      
      case 'unknown':
      default:
        return 'Unknown';
    }
  }
  
  /**
   * Format a date range for display
   * @param startDate Start date
   * @param endDate End date
   * @returns Formatted date range text
   */
  private formatDateRange(startDate: Date | null, endDate: Date | null): string {
    if (!startDate && !endDate) {
      return 'All time';
    }
    
    if (startDate && !endDate) {
      return `From ${this.formatDate(startDate)}`;
    }
    
    if (!startDate && endDate) {
      return `Until ${this.formatDate(endDate)}`;
    }
    
    return `${this.formatDate(startDate!)} - ${this.formatDate(endDate!)}`;
  }
  
  /**
   * Format a date for display
   * @param date Date to format
   * @returns Formatted date string
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
} 
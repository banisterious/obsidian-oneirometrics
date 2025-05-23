import { App } from 'obsidian';
import { DreamMetricsState } from '../../../state/DreamMetricsState';
import { DreamMetricData } from '../../../types';
import { FilterControlsView } from './FilterControlsView';
import {
  FilterControlsProps,
  DateRange,
  DateRangePreset,
  MetricFilter,
  FilterResult
} from './FilterControlsTypes';
import { OneiroMetricsEvents } from '../../../events';
import { IPluginAPI } from '../../../plugin/IPluginAPI';

/**
 * Container component for filter controls
 * 
 * This component handles the business logic for filtering dream entries,
 * while delegating rendering to the FilterControlsView component.
 */
export class FilterControlsContainer {
  // Dependencies
  private pluginApi: IPluginAPI;
  private state: DreamMetricsState;
  private events: OneiroMetricsEvents;
  
  // Component references
  private view: FilterControlsView;
  
  // Component state
  private dateRange: DateRange = { startDate: null, endDate: null };
  private metricFilters: MetricFilter[] = [];
  private allEntries: DreamMetricData[] = [];
  private filteredEntries: DreamMetricData[] = [];
  
  /**
   * Constructor
   * @param pluginApi Plugin API for accessing plugin functionality
   * @param container DOM element to render into
   * @param state Plugin state
   */
  constructor(
    pluginApi: IPluginAPI, 
    container: HTMLElement, 
    state: DreamMetricsState
  ) {
    this.pluginApi = pluginApi;
    this.state = state;
    this.events = OneiroMetricsEvents.getInstance();
    
    // Get initial data
    this.allEntries = this.state.getDreamEntries();
    this.filteredEntries = [...this.allEntries];
    
    // Create initial props
    const props: FilterControlsProps = {
      dateRange: this.dateRange,
      metricFilters: this.metricFilters,
      availableMetrics: this.state.getMetrics(),
      totalEntries: this.allEntries.length,
      filteredEntries: this.filteredEntries.length
    };
    
    // Create view component
    this.view = new FilterControlsView(props, {
      onDateRangeChange: this.handleDateRangeChange.bind(this),
      onDateRangePresetSelect: this.handleDateRangePresetSelect.bind(this),
      onMetricFilterChange: this.handleMetricFilterChange.bind(this),
      onClearFilters: this.handleClearFilters.bind(this)
    });
    
    // Render the view
    this.view.render(container);
    
    // Subscribe to state changes
    this.subscribeToStateChanges();
  }
  
  /**
   * Clean up resources used by the component
   */
  public cleanup(): void {
    this.view.cleanup();
  }
  
  /**
   * Subscribe to state changes
   */
  private subscribeToStateChanges(): void {
    // Update when entries change in the state
    this.events.on('entries:updated', () => {
      this.allEntries = this.state.getDreamEntries();
      this.applyFilters();
    });
    
    // Update when metrics definitions change
    this.events.on('metrics:updated', () => {
      this.view.update({
        availableMetrics: this.state.getMetrics()
      });
    });
  }
  
  /**
   * Handle date range change from the view
   * @param dateRange New date range
   */
  private handleDateRangeChange(dateRange: DateRange): void {
    this.dateRange = dateRange;
    this.applyFilters();
  }
  
  /**
   * Handle preset date range selection
   * @param preset Selected preset
   */
  private handleDateRangePresetSelect(preset: DateRangePreset): void {
    // Calculate date range based on preset
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    
    switch (preset) {
      case DateRangePreset.TODAY:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now);
        break;
        
      case DateRangePreset.YESTERDAY:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case DateRangePreset.THIS_WEEK:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        break;
        
      case DateRangePreset.LAST_WEEK:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() - 7); // Start of last week
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case DateRangePreset.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now);
        break;
        
      case DateRangePreset.LAST_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        endDate.setHours(23, 59, 59, 999);
        break;
        
      case DateRangePreset.LAST_30_DAYS:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        break;
        
      case DateRangePreset.LAST_90_DAYS:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        break;
        
      case DateRangePreset.THIS_YEAR:
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now);
        break;
        
      case DateRangePreset.ALL_TIME:
        startDate = null;
        endDate = null;
        break;
    }
    
    // Update date range and apply filters
    this.dateRange = { startDate, endDate };
    
    // Update view with new date range
    this.view.update({ dateRange: this.dateRange });
    
    // Apply filters
    this.applyFilters();
  }
  
  /**
   * Handle metric filter changes from the view
   * @param filters Updated metric filters
   */
  private handleMetricFilterChange(filters: MetricFilter[]): void {
    this.metricFilters = filters;
    this.applyFilters();
  }
  
  /**
   * Handle clear filters button click
   */
  private handleClearFilters(): void {
    // Clear all filters
    this.dateRange = { startDate: null, endDate: null };
    this.metricFilters = [];
    
    // Update view
    this.view.update({
      dateRange: this.dateRange,
      metricFilters: this.metricFilters
    });
    
    // Apply (clear) filters
    this.applyFilters();
  }
  
  /**
   * Apply all current filters and update the state
   */
  private applyFilters(): void {
    const result = this.filterEntries(this.allEntries, this.dateRange, this.metricFilters);
    
    // Update filtered entries
    this.filteredEntries = result.entries;
    
    // Update stats in view
    this.view.update({
      totalEntries: result.totalCount,
      filteredEntries: result.filteredCount
    });
    
    // Publish filtered entries to other components
    // We use Obsidian's event system to notify other components
    this.pluginApi.getApp().workspace.trigger('oneirometrics:entries-filtered', {
      entries: this.filteredEntries,
      totalCount: result.totalCount,
      filteredCount: result.filteredCount
    });
  }
  
  /**
   * Filter entries based on date range and metric filters
   * @param entries All entries to filter
   * @param dateRange Date range filter
   * @param metricFilters Metric value filters
   * @returns Filtered entries and counts
   */
  private filterEntries(
    entries: DreamMetricData[], 
    dateRange: DateRange, 
    metricFilters: MetricFilter[]
  ): FilterResult {
    const totalCount = entries.length;
    
    // No filters case - return all entries
    if (!dateRange.startDate && !dateRange.endDate && metricFilters.length === 0) {
      return {
        entries,
        totalCount,
        filteredCount: totalCount
      };
    }
    
    // Apply filters
    const filteredEntries = entries.filter(entry => {
      // Date filtering
      if (dateRange.startDate || dateRange.endDate) {
        try {
          // Convert to Date objects
          const entryDate = new Date(entry.date);
          
          // Check start date
          if (dateRange.startDate) {
            const startDate = new Date(dateRange.startDate);
            // Set to beginning of day
            startDate.setHours(0, 0, 0, 0);
            
            if (entryDate < startDate) {
              return false;
            }
          }
          
          // Check end date
          if (dateRange.endDate) {
            const endDate = new Date(dateRange.endDate);
            // Set to end of day
            endDate.setHours(23, 59, 59, 999);
            
            if (entryDate > endDate) {
              return false;
            }
          }
        } catch (e) {
          console.error('Error filtering by date:', e);
          return false;
        }
      }
      
      // Metric filtering
      for (const filter of metricFilters) {
        const value = entry.metrics[filter.key];
        
        // Skip if metric not present
        if (value === undefined) continue;
        
        // Check min value
        if (filter.min !== undefined && value < filter.min) {
          return false;
        }
        
        // Check max value
        if (filter.max !== undefined && value > filter.max) {
          return false;
        }
      }
      
      // Entry passes all filters
      return true;
    });
    
    return {
      entries: filteredEntries,
      totalCount,
      filteredCount: filteredEntries.length
    };
  }
} 
import { BaseComponent } from '../BaseComponent';
import {
  FilterControlsProps,
  FilterControlsCallbacks,
  DateRangePreset,
  DateRange,
  MetricFilter
} from './FilterControlsTypes';

/**
 * View component for filter controls
 * 
 * This component handles the rendering of filter controls for dream entries,
 * including date range selection and metric value filtering.
 */
export class FilterControlsView extends BaseComponent {
  // Component state
  private props: FilterControlsProps;
  private callbacks: FilterControlsCallbacks;
  
  // DOM references
  private dateRangeContainer: HTMLElement | null = null;
  private startDateInput: HTMLInputElement | null = null;
  private endDateInput: HTMLInputElement | null = null;
  private presetButtons: Record<DateRangePreset, HTMLElement | null> = {
    [DateRangePreset.TODAY]: null,
    [DateRangePreset.YESTERDAY]: null,
    [DateRangePreset.THIS_WEEK]: null,
    [DateRangePreset.LAST_WEEK]: null,
    [DateRangePreset.THIS_MONTH]: null,
    [DateRangePreset.LAST_MONTH]: null,
    [DateRangePreset.LAST_30_DAYS]: null,
    [DateRangePreset.LAST_90_DAYS]: null,
    [DateRangePreset.THIS_YEAR]: null,
    [DateRangePreset.ALL_TIME]: null
  };
  private metricFiltersContainer: HTMLElement | null = null;
  private filterStats: HTMLElement | null = null;
  
  /**
   * Constructor
   * @param props Initial props for the component
   * @param callbacks Event callbacks for the component
   */
  constructor(props: FilterControlsProps, callbacks: FilterControlsCallbacks = {}) {
    super();
    this.props = props;
    this.callbacks = callbacks;
  }
  
  /**
   * Called when the component is rendered
   */
  protected onRender(): void {
    if (!this.containerEl) return;

    const filterContainer = this.containerEl.createDiv({ cls: 'oom-filter-container' });
    
    // Create filter sections
    this.renderDateRangeSection(filterContainer);
    this.renderQuickFiltersSection(filterContainer);
    this.renderMetricFiltersSection(filterContainer);
    this.renderFilterStatsSection(filterContainer);
    
    // Set initial state
    this.updateDateInputs();
    this.updateFilterStats();
  }
  
  /**
   * Called when the component is updated
   * @param data New data for the component
   */
  protected onUpdate(data: Partial<FilterControlsProps>): void {
    // Update props
    this.props = { ...this.props, ...data };
    
    // Update UI based on changed props
    if ('dateRange' in data) {
      this.updateDateInputs();
    }
    
    if ('metricFilters' in data) {
      this.updateMetricFilters();
    }
    
    if ('totalEntries' in data || 'filteredEntries' in data) {
      this.updateFilterStats();
    }
  }
  
  /**
   * Render the date range input section
   * @param container Parent container
   */
  private renderDateRangeSection(container: HTMLElement): void {
    this.dateRangeContainer = container.createDiv({ cls: 'oom-date-range-container' });
    
    // Start date input
    const startDateContainer = this.dateRangeContainer.createDiv({ cls: 'oom-date-input-container' });
    startDateContainer.createEl('label', { text: 'Start Date' });
    this.startDateInput = startDateContainer.createEl('input', {
      type: 'date',
      attr: {
        'aria-label': 'Start date for dream entries'
      }
    });
    
    // End date input
    const endDateContainer = this.dateRangeContainer.createDiv({ cls: 'oom-date-input-container' });
    endDateContainer.createEl('label', { text: 'End Date' });
    this.endDateInput = endDateContainer.createEl('input', {
      type: 'date',
      attr: {
        'aria-label': 'End date for dream entries'
      }
    });
    
    // Add event listeners
    this.startDateInput.addEventListener('change', this.handleStartDateChange.bind(this));
    this.endDateInput.addEventListener('change', this.handleEndDateChange.bind(this));
  }
  
  /**
   * Render the quick filters section
   * @param container Parent container
   */
  private renderQuickFiltersSection(container: HTMLElement): void {
    const quickFiltersContainer = container.createDiv({ cls: 'oom-quick-filters' });
    
    // Define preset buttons to show
    const presets = [
      { preset: DateRangePreset.TODAY, label: 'Today' },
      { preset: DateRangePreset.THIS_WEEK, label: 'This Week' },
      { preset: DateRangePreset.THIS_MONTH, label: 'This Month' },
      { preset: DateRangePreset.LAST_30_DAYS, label: 'Last 30 Days' },
      { preset: DateRangePreset.THIS_YEAR, label: 'This Year' },
      { preset: DateRangePreset.ALL_TIME, label: 'All Time' }
    ];
    
    // Create preset buttons
    presets.forEach(({ preset, label }) => {
      const button = quickFiltersContainer.createEl('button', {
        text: label,
        cls: 'oom-button oom-button--secondary'
      });
      
      button.addEventListener('click', () => {
        this.handlePresetClick(preset);
      });
      
      this.presetButtons[preset] = button;
    });
    
    // Add clear button
    const clearButton = quickFiltersContainer.createEl('button', {
      text: 'Clear',
      cls: 'oom-button oom-button--secondary'
    });
    
    clearButton.addEventListener('click', this.handleClearClick.bind(this));
  }
  
  /**
   * Render the metric filters section
   * @param container Parent container
   */
  private renderMetricFiltersSection(container: HTMLElement): void {
    this.metricFiltersContainer = container.createDiv({ cls: 'oom-metric-filters' });
    
    // Metric filters heading
    this.metricFiltersContainer.createEl('h3', { 
      text: 'Metric Filters',
      cls: 'oom-filter-heading'
    });
    
    // Create metric filter inputs
    this.updateMetricFilters();
  }
  
  /**
   * Render the filter stats section
   * @param container Parent container
   */
  private renderFilterStatsSection(container: HTMLElement): void {
    this.filterStats = container.createDiv({ cls: 'oom-filter-stats' });
    this.updateFilterStats();
  }
  
  /**
   * Update the date input fields based on current dateRange
   */
  private updateDateInputs(): void {
    if (!this.startDateInput || !this.endDateInput) return;
    
    const { startDate, endDate } = this.props.dateRange;
    
    this.startDateInput.value = startDate ? this.formatDateForInput(startDate) : '';
    this.endDateInput.value = endDate ? this.formatDateForInput(endDate) : '';
  }
  
  /**
   * Update the metric filter inputs
   */
  private updateMetricFilters(): void {
    if (!this.metricFiltersContainer) return;
    
    // Clear existing filters
    this.metricFiltersContainer.querySelectorAll('.oom-metric-filter').forEach(el => el.remove());
    
    // Only show container if there are metrics
    const hasMetrics = Object.keys(this.props.availableMetrics).length > 0;
    this.metricFiltersContainer.style.display = hasMetrics ? 'block' : 'none';
    if (!hasMetrics) return;
    
    // Create filters for each available metric
    Object.entries(this.props.availableMetrics).forEach(([key, metric]) => {
      const filterContainer = this.metricFiltersContainer?.createDiv({ cls: 'oom-metric-filter' });
      if (!filterContainer) return;
      
      // Create header with metric name
      filterContainer.createEl('h4', { text: metric.name });
      
      // Create range inputs
      const rangeContainer = filterContainer.createDiv({ cls: 'oom-metric-range' });
      
      // Min input
      const minContainer = rangeContainer.createDiv({ cls: 'oom-range-input' });
      minContainer.createEl('label', { text: 'Min' });
      const minInput = minContainer.createEl('input', {
        type: 'number',
        attr: {
          'aria-label': `Minimum value for ${metric.name}`,
          'data-metric-key': key,
          'data-range-type': 'min'
        }
      });
      
      // Max input
      const maxContainer = rangeContainer.createDiv({ cls: 'oom-range-input' });
      maxContainer.createEl('label', { text: 'Max' });
      const maxInput = maxContainer.createEl('input', {
        type: 'number',
        attr: {
          'aria-label': `Maximum value for ${metric.name}`,
          'data-metric-key': key,
          'data-range-type': 'max'
        }
      });
      
      // Set initial values from current filters
      const currentFilter = this.props.metricFilters.find(f => f.key === key);
      if (currentFilter) {
        if (currentFilter.min !== undefined) {
          minInput.value = currentFilter.min.toString();
        }
        if (currentFilter.max !== undefined) {
          maxInput.value = currentFilter.max.toString();
        }
      }
      
      // Add event listeners
      minInput.addEventListener('change', this.handleMetricFilterChange.bind(this));
      maxInput.addEventListener('change', this.handleMetricFilterChange.bind(this));
    });
  }
  
  /**
   * Update the filter stats display
   */
  private updateFilterStats(): void {
    if (!this.filterStats) return;
    
    const { totalEntries, filteredEntries } = this.props;
    
    this.filterStats.innerHTML = '';
    
    if (totalEntries === filteredEntries) {
      this.filterStats.textContent = `Showing all ${totalEntries} entries`;
    } else {
      this.filterStats.textContent = `Showing ${filteredEntries} of ${totalEntries} entries`;
    }
    
    // Add visual indicator for filtered state
    this.filterStats.classList.toggle('oom-filtered', totalEntries !== filteredEntries);
  }
  
  /**
   * Format a date for use in date input fields
   * @param date Date to format
   * @returns Date string in YYYY-MM-DD format
   */
  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Handle start date input change
   * @param e Change event
   */
  private handleStartDateChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    const startDate = target.value ? new Date(target.value) : null;
    
    // Notify container component
    this.callbacks.onDateRangeChange?.({
      startDate,
      endDate: this.props.dateRange.endDate
    });
  }
  
  /**
   * Handle end date input change
   * @param e Change event
   */
  private handleEndDateChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    const endDate = target.value ? new Date(target.value) : null;
    
    // Notify container component
    this.callbacks.onDateRangeChange?.({
      startDate: this.props.dateRange.startDate,
      endDate
    });
  }
  
  /**
   * Handle preset button click
   * @param preset Date range preset
   */
  private handlePresetClick(preset: DateRangePreset): void {
    // Notify container component
    this.callbacks.onDateRangePresetSelect?.(preset);
  }
  
  /**
   * Handle clear button click
   */
  private handleClearClick(): void {
    // Notify container component
    this.callbacks.onClearFilters?.();
  }
  
  /**
   * Handle metric filter input change
   * @param e Change event
   */
  private handleMetricFilterChange(e: Event): void {
    const target = e.target as HTMLInputElement;
    const key = target.getAttribute('data-metric-key');
    const type = target.getAttribute('data-range-type');
    const value = target.value ? parseFloat(target.value) : undefined;
    
    if (!key || !type) return;
    
    // Find existing filter or create new one
    const existingFilterIndex = this.props.metricFilters.findIndex(f => f.key === key);
    const updatedFilters = [...this.props.metricFilters];
    
    if (existingFilterIndex >= 0) {
      // Update existing filter
      const updatedFilter = { ...updatedFilters[existingFilterIndex] };
      
      if (type === 'min') {
        updatedFilter.min = value;
      } else if (type === 'max') {
        updatedFilter.max = value;
      }
      
      // Remove filter if both min and max are undefined
      if (updatedFilter.min === undefined && updatedFilter.max === undefined) {
        updatedFilters.splice(existingFilterIndex, 1);
      } else {
        updatedFilters[existingFilterIndex] = updatedFilter;
      }
    } else if (value !== undefined) {
      // Add new filter
      const newFilter: MetricFilter = { key };
      
      if (type === 'min') {
        newFilter.min = value;
      } else if (type === 'max') {
        newFilter.max = value;
      }
      
      updatedFilters.push(newFilter);
    }
    
    // Notify container component
    this.callbacks.onMetricFilterChange?.(updatedFilters);
  }
} 
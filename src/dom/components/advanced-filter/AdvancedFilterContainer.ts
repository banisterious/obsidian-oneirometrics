import { App } from 'obsidian';
import { AdvancedFilterView } from './AdvancedFilterView';
import { DreamMetricsState } from '../../../state/DreamMetricsState';
import { DreamMetricData } from '../../../types';
import { 
  AdvancedFilterProps, 
  AdvancedFilterCallbacks,
  FilterGroup,
  FilterCondition,
  FilterFieldType,
  FilterOperator,
  LogicalOperator,
  FilterPreset,
  FilterResult
} from './AdvancedFilterTypes';
import { DateRange } from '../filter-controls';
import { OneiroMetricsEvents, EventType, EventData } from '../../../events';
import { IPluginAPI } from '../../../plugin/IPluginAPI';
import { StateAdapter } from '../../../state/adapters/StateAdapter';

/**
 * Container component for the advanced filter
 * 
 * This component handles the business logic for the advanced filter,
 * while delegating rendering to the AdvancedFilterView component.
 */
export class AdvancedFilterContainer {
  // Dependencies
  private pluginApi: IPluginAPI;
  private state: DreamMetricsState;
  private events: OneiroMetricsEvents;
  private stateAdapter: StateAdapter;
  
  // Component references
  private view: AdvancedFilterView;
  
  // Component state
  private entries: DreamMetricData[] = [];
  private availableFields: AdvancedFilterProps['availableFields'] = {};
  private availableMetrics: AdvancedFilterProps['availableMetrics'] = {};
  private filterGroup: FilterGroup = {
    operator: LogicalOperator.AND,
    conditions: [],
    enabled: true
  };
  private presets: FilterPreset[] = [];
  private selectedPresetId: string | undefined;
  private dateRange: DateRange | undefined;
  
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
    
    // Initialize state adapter
    this.stateAdapter = new StateAdapter(state, pluginApi as any);
    
    // Initialize entries from state
    this.entries = this.state.getDreamEntries();
    
    // Ensure each entry has a unique ID
    this.entries = this.entries.map(entry => {
      if (!entry.id) {
        // Generate an ID if not present
        entry.id = `entry-${entry.date}-${Math.random().toString(36).substring(2, 11)}`;
      }
      return entry;
    });
    
    // Initialize available fields and metrics
    this.initializeAvailableFields();
    this.initializeAvailableMetrics();
    
    // Create default filter group if none exists
    this.createDefaultFilterGroup();
    
    // Load saved presets
    this.loadPresets();
    
    // Create view component
    const callbacks: AdvancedFilterCallbacks = {
      onApplyFilter: this.handleApplyFilter.bind(this),
      onResetFilter: this.handleResetFilter.bind(this),
      onAddCondition: this.handleAddCondition.bind(this),
      onRemoveCondition: this.handleRemoveCondition.bind(this),
      onUpdateCondition: this.handleUpdateCondition.bind(this),
      onAddGroup: this.handleAddGroup.bind(this),
      onRemoveGroup: this.handleRemoveGroup.bind(this),
      onChangeOperator: this.handleChangeOperator.bind(this),
      onSelectPreset: this.handleSelectPreset.bind(this),
      onSavePreset: this.handleSavePreset.bind(this),
      onDeletePreset: this.handleDeletePreset.bind(this),
      onDateRangeChange: this.handleDateRangeChange.bind(this)
    };
    
    this.view = new AdvancedFilterView(
      {
        filterGroup: this.filterGroup,
        availableFields: this.availableFields,
        availableMetrics: this.availableMetrics,
        presets: this.presets,
        selectedPresetId: this.selectedPresetId,
        dateRange: this.dateRange
      },
      callbacks
    );
    
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
   * Initialize available fields
   */
  private initializeAvailableFields(): void {
    // Add built-in fields
    this.availableFields = {
      title: {
        name: 'Title',
        type: FilterFieldType.TEXT,
        description: 'Entry title or filename'
      },
      content: {
        name: 'Content',
        type: FilterFieldType.TEXT,
        description: 'Full entry content'
      },
      date: {
        name: 'Date',
        type: FilterFieldType.DATE,
        description: 'Entry date'
      },
      path: {
        name: 'Path',
        type: FilterFieldType.TEXT,
        description: 'File path'
      },
      hasMetrics: {
        name: 'Has Metrics',
        type: FilterFieldType.BOOLEAN,
        description: 'Whether entry has any metrics'
      },
      tags: {
        name: 'Tags',
        type: FilterFieldType.TAG,
        description: 'Entry tags'
      }
    };
  }
  
  /**
   * Initialize available metrics
   */
  private initializeAvailableMetrics(): void {
    const metrics = this.state.getMetrics();
    
    // Convert metrics to available metrics format
    this.availableMetrics = Object.entries(metrics).reduce((result, [key, metric]) => {
      result[key] = {
        name: metric.name,
        description: metric.description
      };
      return result;
    }, {} as AdvancedFilterProps['availableMetrics']);
  }
  
  /**
   * Create a default filter group
   */
  private createDefaultFilterGroup(): void {
    // Create a simple default filter with one condition
    this.filterGroup = {
      operator: LogicalOperator.AND,
      conditions: [
        {
          field: 'content',
          fieldType: FilterFieldType.TEXT,
          operator: FilterOperator.CONTAINS,
          value: '',
          enabled: true
        }
      ],
      enabled: true
    };
  }
  
  /**
   * Load saved presets from the state
   */
  private loadPresets(): void {
    try {
      // Use state adapter instead of direct state access
      const savedPresets = this.stateAdapter.get<FilterPreset[]>('advancedFilterPresets');
      
      if (savedPresets && Array.isArray(savedPresets)) {
        this.presets = savedPresets;
      }
    } catch (error) {
      console.error('Failed to load filter presets', error);
    }
  }
  
  /**
   * Save presets to the state
   */
  private savePresets(): void {
    try {
      // Use state adapter instead of direct state access
      this.stateAdapter.set('advancedFilterPresets', this.presets);
    } catch (error) {
      console.error('Failed to save filter presets', error);
      this.pluginApi.createNotice('Failed to save filter presets');
    }
  }
  
  /**
   * Subscribe to application events
   */
  private subscribeToEvents(): void {
    // Subscribe to date range updates
    this.events.on('dateRange:updated', (range: DateRange) => {
      this.dateRange = range;
      this.view.update({ dateRange: range });
    });
  }
  
  /**
   * Handle apply filter button click
   * @param filter Filter group to apply
   */
  private handleApplyFilter(filter: FilterGroup): void {
    // Apply filter to all entries
    const result = this.applyFilter(filter);
    
    // Update filter state
    this.filterGroup = filter;
    
    // Show notification
    if (result.success) {
      this.pluginApi.createNotice(`Filter applied: ${result.matchCount} of ${result.totalCount} entries match`);
      
      // Emit filtered entries event
      this.events.emit('entries:filtered', {
        // Filter out entries without an id and use non-null assertion for those that have one
        entries: this.entries.filter(entry => entry.id != null)
          .filter(entry => result.matches.includes(entry.id!)),
        totalCount: this.entries.length,
        filteredCount: result.matchCount
      });
    } else if (result.error) {
      this.pluginApi.createNotice(`Error applying filter: ${result.error}`);
    }
  }
  
  /**
   * Apply filter to entries
   * @param filter Filter group to apply
   * @returns Filter result
   */
  private applyFilter(filter: FilterGroup): FilterResult {
    try {
      // If no conditions, return all entries
      if (filter.conditions.length === 0) {
        return {
          success: true,
          matchCount: this.entries.length,
          totalCount: this.entries.length,
          // Map to get ids, ensuring all entries have ids
          matches: this.entries
            .filter(entry => entry.id != null)
            .map(entry => entry.id!)
        };
      }
      
      // Apply date range if specified
      let filteredEntries = this.dateRange 
        ? this.filterByDateRange(this.entries, this.dateRange)
        : [...this.entries];
      
      // Apply advanced filter
      const matches = filteredEntries
        .filter(entry => this.evaluateFilterGroup(filter, entry))
        .filter(entry => entry.id != null)
        .map(entry => entry.id!);
      
      return {
        success: true,
        matchCount: matches.length,
        totalCount: this.entries.length,
        matches
      };
    } catch (error) {
      console.error('Error applying filter:', error);
      return {
        success: false,
        error: error.message,
        matchCount: 0,
        totalCount: this.entries.length,
        matches: []
      };
    }
  }
  
  /**
   * Filter entries by date range
   * @param entries Entries to filter
   * @param dateRange Date range to apply
   * @returns Filtered entries
   */
  private filterByDateRange(entries: DreamMetricData[], dateRange: DateRange): DreamMetricData[] {
    const { startDate, endDate } = dateRange;
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      
      // Filter by start date
      if (startDate && entryDate < startDate) {
        return false;
      }
      
      // Filter by end date (include the end date by setting to end of day)
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (entryDate > endOfDay) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * Evaluate if an entry matches a filter group
   * @param group Filter group to evaluate
   * @param entry Entry to test
   * @returns Whether entry matches the filter
   */
  private evaluateFilterGroup(group: FilterGroup, entry: DreamMetricData): boolean {
    // Skip if group is disabled
    if (!group.enabled) return true;
    
    // No conditions, always match
    if (group.conditions.length === 0) return true;
    
    // Evaluate each condition based on the logical operator
    if (group.operator === LogicalOperator.AND) {
      // All conditions must match
      return group.conditions.every(condition => {
        if ('conditions' in condition) {
          // Nested group
          return this.evaluateFilterGroup(condition, entry);
        } else {
          // Filter condition
          return this.evaluateCondition(condition, entry);
        }
      });
    } else {
      // Any condition can match
      return group.conditions.some(condition => {
        if ('conditions' in condition) {
          // Nested group
          return this.evaluateFilterGroup(condition, entry);
        } else {
          // Filter condition
          return this.evaluateCondition(condition, entry);
        }
      });
    }
  }
  
  /**
   * Evaluate if an entry matches a filter condition
   * @param condition Filter condition to evaluate
   * @param entry Entry to test
   * @returns Whether entry matches the condition
   */
  private evaluateCondition(condition: FilterCondition, entry: DreamMetricData): boolean {
    // Skip if condition is disabled
    if (!condition.enabled) return true;
    
    // Extract field value based on field type
    let fieldValue: any;
    
    if (condition.field.startsWith('metric:')) {
      // Metric field
      const metricKey = condition.field.substring(7);
      fieldValue = entry.metrics?.[metricKey];
      
      // If entry doesn't have this metric, it doesn't match
      if (fieldValue === undefined) return false;
    } else {
      // Regular field
      switch (condition.field) {
        case 'title':
          fieldValue = entry.title;
          break;
        case 'content':
          fieldValue = entry.content;
          break;
        case 'date':
          fieldValue = entry.date;
          break;
        case 'path':
          fieldValue = entry.path;
          break;
        case 'hasMetrics':
          fieldValue = Boolean(entry.metrics && Object.keys(entry.metrics).length > 0);
          break;
        case 'tags':
          fieldValue = entry.tags?.join(' ') || '';
          break;
        default:
          // Unknown field, doesn't match
          return false;
      }
    }
    
    // Evaluate based on field type and operator
    switch (condition.fieldType) {
      case FilterFieldType.TEXT:
      case FilterFieldType.TAG:
        return this.evaluateTextCondition(condition, String(fieldValue || ''));
        
      case FilterFieldType.NUMBER:
      case FilterFieldType.METRIC:
        return this.evaluateNumberCondition(condition, Number(fieldValue));
        
      case FilterFieldType.DATE:
        return this.evaluateDateCondition(condition, fieldValue);
        
      case FilterFieldType.BOOLEAN:
        return this.evaluateBooleanCondition(condition, Boolean(fieldValue));
        
      default:
        // Unknown field type, doesn't match
        return false;
    }
  }
  
  /**
   * Evaluate a text condition
   * @param condition Text filter condition
   * @param value Field value
   * @returns Whether value matches the condition
   */
  private evaluateTextCondition(
    condition: FilterCondition & { fieldType: FilterFieldType.TEXT | FilterFieldType.TAG },
    value: string
  ): boolean {
    const conditionValue = String(condition.value || '');
    const normalizedValue = value.toLowerCase();
    const normalizedConditionValue = conditionValue.toLowerCase();
    
    switch (condition.operator) {
      case FilterOperator.CONTAINS:
        return normalizedValue.includes(normalizedConditionValue);
        
      case FilterOperator.NOT_CONTAINS:
        return !normalizedValue.includes(normalizedConditionValue);
        
      case FilterOperator.EQUALS:
        return normalizedValue === normalizedConditionValue;
        
      case FilterOperator.NOT_EQUALS:
        return normalizedValue !== normalizedConditionValue;
        
      case FilterOperator.STARTS_WITH:
        return normalizedValue.startsWith(normalizedConditionValue);
        
      case FilterOperator.ENDS_WITH:
        return normalizedValue.endsWith(normalizedConditionValue);
        
      default:
        return false;
    }
  }
  
  /**
   * Evaluate a number condition
   * @param condition Number filter condition
   * @param value Field value
   * @returns Whether value matches the condition
   */
  private evaluateNumberCondition(
    condition: FilterCondition & { fieldType: FilterFieldType.NUMBER | FilterFieldType.METRIC },
    value: number
  ): boolean {
    if (isNaN(value)) return false;
    
    const conditionValue = Number(condition.value);
    if (isNaN(conditionValue)) return false;
    
    switch (condition.operator) {
      case FilterOperator.EQUALS:
        return value === conditionValue;
        
      case FilterOperator.NOT_EQUALS:
        return value !== conditionValue;
        
      case FilterOperator.GREATER_THAN:
        return value > conditionValue;
        
      case FilterOperator.LESS_THAN:
        return value < conditionValue;
        
      case FilterOperator.BETWEEN:
        const secondValue = Number(condition.secondValue);
        if (isNaN(secondValue)) return false;
        
        return value >= conditionValue && value <= secondValue;
        
      default:
        return false;
    }
  }
  
  /**
   * Evaluate a date condition
   * @param condition Date filter condition
   * @param value Field value
   * @returns Whether value matches the condition
   */
  private evaluateDateCondition(
    condition: FilterCondition & { fieldType: FilterFieldType.DATE },
    value: string
  ): boolean {
    try {
      const date = new Date(value);
      const conditionDate = new Date(condition.value);
      
      if (isNaN(date.getTime()) || isNaN(conditionDate.getTime())) return false;
      
      // Normalize dates to start of day
      const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const normalizedConditionDate = new Date(
        conditionDate.getFullYear(), 
        conditionDate.getMonth(), 
        conditionDate.getDate()
      );
      
      switch (condition.operator) {
        case FilterOperator.EQUALS:
          return normalizedDate.getTime() === normalizedConditionDate.getTime();
          
        case FilterOperator.NOT_EQUALS:
          return normalizedDate.getTime() !== normalizedConditionDate.getTime();
          
        case FilterOperator.GREATER_THAN:
          return normalizedDate.getTime() > normalizedConditionDate.getTime();
          
        case FilterOperator.LESS_THAN:
          return normalizedDate.getTime() < normalizedConditionDate.getTime();
          
        case FilterOperator.BETWEEN:
          if (!condition.secondValue) return false;
          
          const secondDate = new Date(condition.secondValue);
          if (isNaN(secondDate.getTime())) return false;
          
          const normalizedSecondDate = new Date(
            secondDate.getFullYear(), 
            secondDate.getMonth(), 
            secondDate.getDate()
          );
          
          return (
            normalizedDate.getTime() >= normalizedConditionDate.getTime() && 
            normalizedDate.getTime() <= normalizedSecondDate.getTime()
          );
          
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Evaluate a boolean condition
   * @param condition Boolean filter condition
   * @param value Field value
   * @returns Whether value matches the condition
   */
  private evaluateBooleanCondition(
    condition: FilterCondition & { fieldType: FilterFieldType.BOOLEAN },
    value: boolean
  ): boolean {
    return value === condition.value;
  }
  
  /**
   * Handle filter reset
   */
  private handleResetFilter(): void {
    // Create new default filter group
    this.createDefaultFilterGroup();
    
    // Reset selected preset
    this.selectedPresetId = undefined;
    
    // Update view
    this.view.update({
      filterGroup: this.filterGroup,
      selectedPresetId: undefined
    });
    
    // Show message
    this.pluginApi.createNotice('Filter reset');
  }
  
  /**
   * Handle adding a condition
   * @param condition Condition to add
   * @param parentGroup Parent group
   */
  private handleAddCondition(condition: FilterCondition, parentGroup: FilterGroup): void {
    // Add condition to parent group
    parentGroup.conditions.push(condition);
    
    // Update view
    this.view.update({ filterGroup: this.filterGroup });
  }
  
  /**
   * Handle removing a condition
   * @param conditionIndex Index of condition to remove
   * @param parentGroup Parent group
   */
  private handleRemoveCondition(conditionIndex: number, parentGroup: FilterGroup): void {
    // Remove condition from parent group
    parentGroup.conditions.splice(conditionIndex, 1);
    
    // Update view
    this.view.update({ filterGroup: this.filterGroup });
  }
  
  /**
   * Handle updating a condition
   * @param conditionIndex Index of condition to update
   * @param condition Updated condition
   * @param parentGroup Parent group
   */
  private handleUpdateCondition(
    conditionIndex: number, 
    condition: FilterCondition, 
    parentGroup: FilterGroup
  ): void {
    // Update condition in parent group
    parentGroup.conditions[conditionIndex] = condition;
    
    // No need to update view, it's already updated by the component
  }
  
  /**
   * Handle adding a group
   * @param group Group to add
   * @param parentGroup Parent group
   */
  private handleAddGroup(group: FilterGroup, parentGroup: FilterGroup): void {
    // Add group to parent group
    parentGroup.conditions.push(group);
    
    // Update view
    this.view.update({ filterGroup: this.filterGroup });
  }
  
  /**
   * Handle removing a group
   * @param groupIndex Index of group to remove
   * @param parentGroup Parent group
   */
  private handleRemoveGroup(groupIndex: number, parentGroup: FilterGroup): void {
    // Remove group from parent group
    parentGroup.conditions.splice(groupIndex, 1);
    
    // Update view
    this.view.update({ filterGroup: this.filterGroup });
  }
  
  /**
   * Handle changing a group's logical operator
   * @param group Group to update
   * @param operator New operator
   */
  private handleChangeOperator(group: FilterGroup, operator: LogicalOperator): void {
    // Update group operator
    group.operator = operator;
    
    // No need to update view, it's already updated by the component
  }
  
  /**
   * Handle selecting a preset
   * @param presetId ID of preset to select
   */
  private handleSelectPreset(presetId: string): void {
    // Find preset
    const preset = this.presets.find(p => p.id === presetId);
    
    if (!preset) {
      console.error(`Preset not found: ${presetId}`);
      return;
    }
    
    // Set selected preset
    this.selectedPresetId = presetId;
    
    // Apply preset filter
    this.filterGroup = { ...preset.filter };
    
    // Apply date range if preset has one
    if (preset.dateRange) {
      this.dateRange = { ...preset.dateRange };
      
      // Emit date range event
      this.events.emit('dateRange:updated', this.dateRange as unknown as EventData);
    }
    
    // Update view
    this.view.update({
      filterGroup: this.filterGroup,
      selectedPresetId: this.selectedPresetId,
      dateRange: this.dateRange
    });
    
    // Show message
    this.pluginApi.createNotice(`Preset "${preset.name}" selected`);
  }
  
  /**
   * Handle saving a preset
   * @param preset Preset to save
   */
  private handleSavePreset(preset: FilterPreset): void {
    // Check if preset with same name exists
    const existingIndex = this.presets.findIndex(p => p.name === preset.name);
    
    if (existingIndex >= 0) {
      // Update existing preset
      this.presets[existingIndex] = {
        ...preset,
        modifiedAt: new Date().toISOString()
      };
      
      // Set selected preset ID
      this.selectedPresetId = preset.id;
    } else {
      // Add new preset
      this.presets.push(preset);
      
      // Set selected preset ID
      this.selectedPresetId = preset.id;
    }
    
    // Save presets
    this.savePresets();
    
    // Update view
    this.view.update({
      presets: this.presets,
      selectedPresetId: this.selectedPresetId
    });
    
    // Show message
    this.pluginApi.createNotice(`Preset "${preset.name}" saved`);
  }
  
  /**
   * Handle deleting a preset
   * @param presetId ID of preset to delete
   */
  private handleDeletePreset(presetId: string): void {
    // Find preset
    const preset = this.presets.find(p => p.id === presetId);
    
    if (!preset) {
      console.error(`Preset not found: ${presetId}`);
      return;
    }
    
    // Remove preset
    this.presets = this.presets.filter(p => p.id !== presetId);
    
    // Reset selected preset if it was this one
    if (this.selectedPresetId === presetId) {
      this.selectedPresetId = undefined;
    }
    
    // Save presets
    this.savePresets();
    
    // Update view
    this.view.update({
      presets: this.presets,
      selectedPresetId: this.selectedPresetId
    });
    
    // Show message
    this.pluginApi.createNotice(`Preset "${preset.name}" deleted`);
  }
  
  /**
   * Handle date range change
   * @param dateRange New date range
   */
  private handleDateRangeChange(dateRange: DateRange): void {
    this.dateRange = dateRange;
    
    // Update view
    this.view.update({
      dateRange
    });
    
    // Emit date range event
    this.events.emit('dateRange:updated', dateRange as unknown as EventData);
  }
} 
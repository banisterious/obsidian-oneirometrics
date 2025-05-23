import { DateRange } from '../filter-controls';

/**
 * Filter condition operators
 */
export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  BETWEEN = 'between',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith'
}

/**
 * Logical operators for combining filter conditions
 */
export enum LogicalOperator {
  AND = 'and',
  OR = 'or'
}

/**
 * Filter field types
 */
export enum FilterFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  METRIC = 'metric',
  TAG = 'tag'
}

/**
 * Base filter condition interface
 */
export interface BaseFilterCondition {
  /**
   * Field to filter on
   */
  field: string;
  
  /**
   * Type of the field
   */
  fieldType: FilterFieldType;
  
  /**
   * Operator to use for comparison
   */
  operator: FilterOperator;
  
  /**
   * Whether this condition is enabled
   */
  enabled: boolean;
}

/**
 * Text filter condition
 */
export interface TextFilterCondition extends BaseFilterCondition {
  fieldType: FilterFieldType.TEXT | FilterFieldType.TAG;
  operator: FilterOperator.EQUALS | FilterOperator.NOT_EQUALS | FilterOperator.CONTAINS | 
            FilterOperator.NOT_CONTAINS | FilterOperator.STARTS_WITH | FilterOperator.ENDS_WITH;
  value: string;
}

/**
 * Number filter condition
 */
export interface NumberFilterCondition extends BaseFilterCondition {
  fieldType: FilterFieldType.NUMBER | FilterFieldType.METRIC;
  operator: FilterOperator.EQUALS | FilterOperator.NOT_EQUALS | 
            FilterOperator.GREATER_THAN | FilterOperator.LESS_THAN | FilterOperator.BETWEEN;
  value: number;
  secondValue?: number; // For BETWEEN operator
}

/**
 * Date filter condition
 */
export interface DateFilterCondition extends BaseFilterCondition {
  fieldType: FilterFieldType.DATE;
  operator: FilterOperator.EQUALS | FilterOperator.NOT_EQUALS |
            FilterOperator.GREATER_THAN | FilterOperator.LESS_THAN | FilterOperator.BETWEEN;
  value: string; // ISO date string
  secondValue?: string; // For BETWEEN operator
}

/**
 * Boolean filter condition
 */
export interface BooleanFilterCondition extends BaseFilterCondition {
  fieldType: FilterFieldType.BOOLEAN;
  operator: FilterOperator.EQUALS;
  value: boolean;
}

/**
 * Union type for all filter conditions
 */
export type FilterCondition = 
  | TextFilterCondition
  | NumberFilterCondition
  | DateFilterCondition
  | BooleanFilterCondition;

/**
 * Filter group for combining multiple conditions
 */
export interface FilterGroup {
  /**
   * Logical operator to combine conditions
   */
  operator: LogicalOperator;
  
  /**
   * List of conditions in this group
   */
  conditions: (FilterCondition | FilterGroup)[];
  
  /**
   * Whether this group is enabled
   */
  enabled: boolean;
}

/**
 * Saved filter preset
 */
export interface FilterPreset {
  /**
   * Unique identifier for the preset
   */
  id: string;
  
  /**
   * Name of the preset
   */
  name: string;
  
  /**
   * Description of the preset
   */
  description?: string;
  
  /**
   * Filter group containing the conditions
   */
  filter: FilterGroup;
  
  /**
   * Date range to apply alongside the filter
   */
  dateRange?: DateRange;
  
  /**
   * Date when the preset was created
   */
  createdAt: string;
  
  /**
   * Date when the preset was last modified
   */
  modifiedAt: string;
}

/**
 * Filter query result
 */
export interface FilterResult {
  /**
   * Whether the filter was applied successfully
   */
  success: boolean;
  
  /**
   * Number of entries that match the filter
   */
  matchCount: number;
  
  /**
   * Total number of entries processed
   */
  totalCount: number;
  
  /**
   * IDs of matching entries
   */
  matches: string[];
  
  /**
   * Error message if the filter failed
   */
  error?: string;
}

/**
 * Props for the AdvancedFilter component
 */
export interface AdvancedFilterProps {
  /**
   * Available fields to filter on
   */
  availableFields: {
    [key: string]: {
      name: string;
      type: FilterFieldType;
      description?: string;
    }
  };
  
  /**
   * Available metrics to filter on
   */
  availableMetrics: {
    [key: string]: {
      name: string;
      description?: string;
    }
  };
  
  /**
   * Current filter group
   */
  filterGroup: FilterGroup;
  
  /**
   * Available filter presets
   */
  presets: FilterPreset[];
  
  /**
   * Currently selected preset ID
   */
  selectedPresetId?: string;
  
  /**
   * Whether simplified mode is enabled (less complex UI)
   */
  simplifiedMode?: boolean;
  
  /**
   * Date range to apply alongside the filter
   */
  dateRange?: DateRange;
}

/**
 * Callbacks for the AdvancedFilter component
 */
export interface AdvancedFilterCallbacks {
  /**
   * Called when the filter is applied
   */
  onApplyFilter?: (filter: FilterGroup) => void;
  
  /**
   * Called when the filter is reset
   */
  onResetFilter?: () => void;
  
  /**
   * Called when a filter condition is added
   */
  onAddCondition?: (condition: FilterCondition, parentGroup: FilterGroup) => void;
  
  /**
   * Called when a filter condition is removed
   */
  onRemoveCondition?: (conditionIndex: number, parentGroup: FilterGroup) => void;
  
  /**
   * Called when a filter condition is updated
   */
  onUpdateCondition?: (conditionIndex: number, condition: FilterCondition, parentGroup: FilterGroup) => void;
  
  /**
   * Called when a filter group is added
   */
  onAddGroup?: (group: FilterGroup, parentGroup: FilterGroup) => void;
  
  /**
   * Called when a filter group is removed
   */
  onRemoveGroup?: (groupIndex: number, parentGroup: FilterGroup) => void;
  
  /**
   * Called when the logical operator is changed
   */
  onChangeOperator?: (group: FilterGroup, operator: LogicalOperator) => void;
  
  /**
   * Called when a preset is selected
   */
  onSelectPreset?: (presetId: string) => void;
  
  /**
   * Called when a preset is saved
   */
  onSavePreset?: (preset: FilterPreset) => void;
  
  /**
   * Called when a preset is deleted
   */
  onDeletePreset?: (presetId: string) => void;
  
  /**
   * Called when the date range changes
   */
  onDateRangeChange?: (dateRange: DateRange) => void;
} 
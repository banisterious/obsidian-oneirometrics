// Export the component interfaces
export type { IComponent } from './IComponent';

// Export the base component
export { BaseComponent } from './BaseComponent';

// Export metrics table components
export { MetricsTableContainer, MetricsTableView } from './metrics-table';
export type { MetricsTableProps, MetricsTableCallbacks, MetricsTableConfig } from './metrics-table';

// Export filter controls components
export { FilterControlsContainer, FilterControlsView, DateRangePreset } from './filter-controls';
export type { 
  FilterControlsProps, 
  FilterControlsCallbacks, 
  DateRange, 
  MetricFilter, 
  FilterResult 
} from './filter-controls';

// Export summary view components
export { SummaryViewContainer, SummaryViewView } from './summary-view';
export type {
  SummaryViewProps,
  SummaryViewCallbacks,
  MetricStats,
  HistogramBucket,
  TimeSeriesPoint
} from './summary-view';

// Export expandable content components
export { ExpandableContentContainer, ExpandableContentView } from './expandable-content';
export type {
  ExpandableContentProps,
  ExpandableContentCallbacks
} from './expandable-content';

// Export advanced filter components
export { 
  AdvancedFilterContainer, 
  AdvancedFilterView,
  FilterOperator,
  LogicalOperator,
  FilterFieldType
} from './advanced-filter';
export type {
  AdvancedFilterProps,
  AdvancedFilterCallbacks,
  FilterCondition,
  FilterGroup,
  FilterPreset
} from './advanced-filter';

// Export dashboard components
export {
  DashboardContainer,
  DashboardView
} from './dashboard';
export type {
  DashboardProps,
  DashboardCallbacks,
  DashboardStat,
  QuickAction,
  RecentActivity
} from './dashboard';

// Export tabs components
export {
  TabsContainer,
  TabsView,
  TabsEvent
} from './tabs';
export type {
  TabItem,
  TabsProps,
  TabsCallbacks,
  TabsConfig
} from './tabs';

// Export dream journal manager components
export {
  DreamJournalManagerContainer,
  DreamJournalManagerView
} from './dream-journal-manager';
export type {
  DreamJournalManagerProps,
  DreamJournalManagerCallbacks,
  JournalManagerTab,
  SelectionMode,
  ScrapeProgress
} from './dream-journal-manager';

// As more components are implemented, they will be exported here
// For example:
// export { ExpandableContent } from './expandable-content/ExpandableContent'; 
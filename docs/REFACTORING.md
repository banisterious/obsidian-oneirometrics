# OneiroMetrics Refactoring Plan

## Overview
This document tracks the progress and plans for the OneiroMetrics plugin refactoring effort, which aims to improve code organization, maintainability, and reliability.

## Current Status (May 2025)

### Completed Components ✅
1. **State Management**
   - Created `DreamMetricsState` class
   - Implemented centralized state management
   - Added state persistence
   - Added event subscription system

2. **DOM Management**
   - Created `DreamMetricsDOM` class
   - Implemented table rendering
   - Added responsive design
   - Added accessibility features

3. **Event Handling**
   - Created `DreamMetricsEvents` class
   - Implemented event delegation
   - Added keyboard navigation
   - Added mutation observer

4. **Metrics Processing**
   - Created `DreamMetricsProcessor` class
   - Implemented metric calculations
   - Added time-based metrics
   - Added summary generation

5. **Filtering System**
   - Implemented `DateRangeFilter` class
   - Added date range selection UI
   - Added quick filters (This Week, This Month, Last 30 Days)
   - Implemented `TimeFilterDialog` class
   - Added time range selection with hour/minute inputs
   - Added quick time filters (Morning, Afternoon, Evening, Night)
   - Created `TimeFilterState` for time filter management

### In Progress 🚧
1. **Testing Infrastructure**
   - Unit test setup
   - Integration tests
   - Performance benchmarks
   - Accessibility testing

2. **Documentation Updates**
   - API documentation
   - Usage examples
   - Migration guides
   - Performance guidelines

### Pending 📝
1. **Advanced Features**
   - Pattern recognition
   - Statistical analysis
   - Advanced visualizations
   - Mobile optimization

## Architecture Changes

### Before
- Monolithic plugin class
- Scattered state management
- Direct DOM manipulation
- Inconsistent event handling

### After
- Modular component architecture
- Centralized state management
- Abstracted DOM operations
- Unified event system
- Comprehensive filtering system

## Implementation Details

### State Management
```typescript
class DreamMetricsState {
    private expandedStates: Map<string, boolean>;
    private metrics: Record<string, DreamMetric>;
    private dreamEntries: DreamMetricData[];
    private listeners: Set<() => void>;

    // State management methods
    toggleExpandedState(contentId: string, isExpanded: boolean): void;
    updateMetrics(metrics: Record<string, DreamMetric>): void;
    updateDreamEntries(entries: DreamMetricData[]): void;
    
    // Event handling
    subscribe(listener: () => void): () => void;
    notifyListeners(): void;
    
    // Persistence
    saveSettings(): void;
    loadSettings(): void;
}
```

### Build Process Changes
- The build process now requires esbuild 0.20+ due to the use of the `context` API. This change was introduced to improve build performance and compatibility with modern TypeScript features.

### Filtering System
```typescript
// Date Range Filter
class DateRangeFilter {
    private state: DreamMetricsState;
    private startDate: Date | null;
    private endDate: Date | null;

    render(container: HTMLElement): void;
    private setDateRange(start: Date, end: Date): void;
    private clearFilter(): void;
    private applyFilter(): void;
}

// Time Filter
class TimeFilterDialog extends Modal {
    private timeFilterState: TimeFilterState;
    private timeRange: TimeRange | null;

    onOpen(): void;
    onClose(): void;
}

class TimeFilterState {
    private state: DreamMetricsState;
    private timeRange: TimeRange | null;
    private originalEntries: DreamMetricData[];

    setTimeRange(timeRange: TimeRange | null): void;
    getTimeRange(): TimeRange | null;
    clearFilter(): void;
}
```

### DOM Management
```typescript
class DreamMetricsDOM {
    private container: HTMLElement;
    private state: DreamMetricsState;
    private dateRangeFilter: DateRangeFilter;
    private timeFilterState: TimeFilterState;

    // Rendering methods
    render(): void;
    renderFilters(): void;
    renderMetricsTable(): void;
    renderTableHeader(table: HTMLElement): void;
    renderTableBody(table: HTMLElement): void;
    
    // UI components
    updateContentVisibility(id: string, isExpanded: boolean): void;
    
    // Cleanup
    cleanup(): void;
}
```

### Event Handling
```typescript
class DreamMetricsEvents {
    private state: DreamMetricsState;
    private dom: DreamMetricsDOM;
    private isAttached: boolean;

    // Event attachment
    attachEventListeners(): void;
    attachExpandButtonListeners(): void;
    attachFilterListeners(): void;
    attachKeyboardListeners(): void;
    
    // Event handlers
    handleExpandButtonClick(event: MouseEvent): void;
    handleFilterChange(event: Event): void;
    
    // Cleanup
    cleanup(): void;
}
```

### Metrics Processing
```typescript
class DreamMetricsProcessor {
    private settings: DreamMetricsSettings;

    // Processing methods
    processDreamEntries(entries: DreamMetricData[]): {
        metrics: Record<string, number>;
        processedEntries: DreamMetricData[];
    };
    
    // Analysis methods
    getMetricsSummary(metrics: Record<string, number>): string;
    getTimeBasedMetrics(entries: DreamMetricData[]): {
        byMonth: Record<string, number>;
        byDayOfWeek: Record<string, number>;
        byHour: Record<string, number>;
    };
}
```

## Next Steps

### Immediate Priorities
1. Set up testing infrastructure
2. Add comprehensive unit tests
3. Implement integration tests
4. Complete documentation updates

### Short-term Goals
1. Add performance benchmarks
2. Implement accessibility testing
3. Add advanced visualizations
4. Improve mobile experience

### Long-term Goals
1. Add pattern recognition
2. Implement statistical analysis
3. Add advanced filtering options
4. Optimize performance

## Migration Guide

### For Developers
1. Update imports to use new component structure
2. Replace direct DOM manipulation with DOM class methods
3. Use state management for data updates
4. Implement event handling through Events class
5. Utilize new filtering system for date and time filtering

### For Users
1. No action required
2. All existing functionality remains unchanged
3. New filtering features are available:
   - Date range selection with quick filters
   - Time range filtering with preset options
   - Combined date and time filtering
4. Performance improvements will be automatic

## Testing Strategy

### Unit Tests
- State management tests
- DOM manipulation tests
- Event handling tests
- Metrics processing tests
- Filter system tests

### Integration Tests
- Component interaction tests
- End-to-end workflow tests
- Performance benchmarks
- Accessibility tests

### Performance Testing
- Load time measurements
- Memory usage monitoring
- DOM manipulation efficiency
- Event handling performance
- Filter operation performance

## Documentation Updates

### API Documentation
- Component interfaces
- Method signatures
- Event system
- State management
- Filter system

### Usage Examples
- Basic usage
- Advanced features
- Customization options
- Best practices
- Filter usage examples

### Migration Guides
- Developer migration
- User migration
- Feature deprecation
- Breaking changes

## Performance Considerations

### Optimizations
1. Efficient DOM updates
2. Smart state management
3. Event delegation
4. Lazy loading
5. Filter operation optimization

### Monitoring
1. Performance metrics
2. Memory usage
3. Load times
4. User interactions
5. Filter operation times

## Accessibility Improvements

### Keyboard Navigation
- Full keyboard support
- Focus management
- ARIA attributes
- Screen reader compatibility
- Filter accessibility

### Visual Accessibility
- High contrast support
- Font scaling
- Color blindness support
- Motion reduction
- Filter UI accessibility

## Future Considerations

### Potential Enhancements
1. Advanced visualizations
2. Pattern recognition
3. Statistical analysis
4. Mobile optimization
5. Advanced filtering options

### Technical Debt
1. Legacy code cleanup
2. Documentation updates
3. Test coverage
4. Performance optimization
5. Filter system refinements 
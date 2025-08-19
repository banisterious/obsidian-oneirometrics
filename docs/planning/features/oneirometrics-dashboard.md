# OneiroMetrics Dashboard Migration Plan

- **Document Version:** 1.3
- **Date:** August 2025
- **Author:** John Banister
- **Status:** ✅ Implementation Complete

## Executive Summary

This document outlines the migration plan to transform the current OneiroMetrics Note (static HTML in markdown) into a performant, interactive OneiroMetrics Dashboard using Obsidian's ItemView architecture. This migration will dramatically improve performance, user experience, and maintainability.

## Current State Analysis

### Problems with Current Implementation

1. **Performance Issues**
   - Full HTML regeneration on every update (~2-5 seconds for 100+ entries)
   - Entire note must be re-parsed by Obsidian's markdown renderer
   - No incremental updates possible
   - Memory inefficient with large datasets

2. **User Experience Limitations**
   - Manual "Rescrape Metrics" required for any update
   - Page jumps/scrolls on refresh
   - No real-time filtering or search
   - Limited interactivity

3. **Technical Debt**
   - HTML string concatenation is error-prone
   - Difficult to maintain and debug
   - No proper state management
   - Event handling is fragile

## Proposed Solution: OneiroMetrics Dashboard

### Core Architecture Changes

#### 1. ItemView Implementation

Create a dedicated `OneiroMetricsDashboardView` class extending Obsidian's `ItemView`:

```typescript
export const ONEIROMETRICS_DASHBOARD_VIEW_TYPE = 'oneirometrics-dashboard';

export class OneiroMetricsDashboardView extends ItemView {
    private state: DashboardState;
    private parser: DreamEntryParser;
    
    getViewType(): string {
        return ONEIROMETRICS_DASHBOARD_VIEW_TYPE;
    }
    
    getDisplayText(): string {
        return 'OneiroMetrics Dashboard';
    }
    
    getIcon(): string {
        return 'chart-line'; // or custom icon
    }
}
```

**Benefits:**
- Native Obsidian integration
- Proper lifecycle management
- State preservation
- Efficient rendering

#### 2. State Management System

Implement a reactive state management pattern:

```typescript
interface DashboardState {
    entries: DreamMetricData[];
    filteredEntries: DreamMetricData[];
    currentFilter: DateFilter;
    sortColumn: string;
    sortDirection: 'asc' | 'desc';
    searchQuery: string;
    searchResults: SearchResult[];
    expandedRows: Set<string>;
    viewPreferences: ViewPreferences;
}
```

**Benefits:**
- Single source of truth
- Predictable updates
- Easy debugging
- Enables undo/redo

#### 3. Native UI Components

Leverage Obsidian's built-in components:

```typescript
// Search implementation
const searchComponent = new SearchComponent(searchContainer);
searchComponent.setPlaceholder('Search dream entries...');
searchComponent.onChange((value) => {
    this.performSearch(value);
});

// Dropdown implementation
const filterDropdown = new DropdownComponent(filterContainer);
filterDropdown.addOption('all', 'All Time');
filterDropdown.addOption('thisMonth', 'This Month');
// etc.
```

**Benefits:**
- Consistent with Obsidian's UI
- Accessibility built-in
- Theme compatibility
- Keyboard navigation

### Implementation Phases

#### Phase 1: Foundation (Week 1-2) - COMPLETED
1. Create `OneiroMetricsDashboardView` class - DONE
2. Register view type in plugin - DONE
3. Add command to open dashboard - DONE
4. Implement basic table rendering - DONE
5. Set up state management - DONE

#### Phase 2: Data Layer (Week 2-3) - IN-PROGRESS
1. Adapt existing `DreamEntryParser` - DONE
2. Create efficient data structures - DONE
3. Implement caching layer - PENDING
4. Add incremental update support - PENDING

#### Phase 3: Interactivity (Week 3-4) - PARTIAL
1. Add live search functionality - DONE
2. Implement column sorting - DONE
3. Add date filtering - DONE
4. Create expand/collapse for content - DONE

#### Phase 4: Polish & Migration (Week 4-5) - PARTIAL
1. Add loading states - DONE
2. Implement error handling - DONE
3. Create migration command - PENDING
4. Update documentation - PENDING

### Performance Targets

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Initial Load | 2-5s | <500ms | 4-10x |
| Filter/Search | 2-5s | <50ms | 40-100x |
| Sort | 2-5s | <20ms | 100-250x |
| Memory Usage | ~50MB | ~10MB | 5x |

### Migration Strategy

#### 1. Parallel Implementation
- Keep existing OneiroMetrics Note functional
- Develop dashboard alongside
- No breaking changes initially

#### 2. Gradual Rollout
- Add "Open Dashboard (Beta)" command
- Gather user feedback
- Iterate on performance

#### 3. Transition Plan
- Provide migration command
- Auto-convert settings
- Deprecate old approach gradually

### Technical Implementation Details

#### Data Flow Architecture

```
Dream Entries (Vault)
        ↓
   Parser Service
        ↓
   State Manager
        ↓
   View Components
        ↓
   User Interface
```

#### Key Components

1. **DashboardParser**
   - Reuse existing parsing logic
   - Add caching layer
   - Support incremental updates

2. **StateManager**
   - Handle all state mutations
   - Emit change events
   - Manage history

3. **TableRenderer**
   - Virtual scrolling for large datasets
   - Efficient DOM updates
   - Smooth animations

4. **SearchEngine**
   - In-memory search index
   - Fuzzy matching support
   - Highlight results

### Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing workflows | High | Maintain backward compatibility |
| Performance regression | Medium | Comprehensive benchmarking |
| Theme compatibility | Low | Use native components |
| Data loss | High | Implement robust backup |
| Loss of virtual scrolling performance | High | Port existing virtualization logic |
| Chart functionality regression | High | Reuse Chart.js configurations |
| State management inconsistencies | Medium | Implement comprehensive state migration |

## Critical Functionality to Preserve

### Metrics Table Core Features
Based on analysis of `DreamMetricsDOM.ts` and `TableGenerator.ts`:

1. **Virtual Scrolling System**
   - Current implementation uses CSS custom properties for dynamic row positioning
   - Handles 20 visible rows at a time with 50px row height
   - Smooth scrolling with RAF-based debouncing
   - Must preserve: `--oom-total-rows`, `--oom-row-height`, `--oom-row-index` CSS variables

2. **Row Expansion/Collapse**
   - Tracks expanded state in `expandedRows: Set<string>`
   - Smooth content reveal with "Read more"/"Show less" toggle
   - Preserves scroll position when expanding
   - Links to source files with proper Obsidian internal-link formatting

3. **Date Handling & Sorting**
   - Chronological ordering (oldest first)
   - Multiple date formats supported via `parseDate()` utility
   - Date attributes stored as: `data-date`, `data-date-raw`, `data-iso-date`

4. **Dynamic Metric Columns**
   - Respects enabled/disabled metrics from settings
   - Follows `RECOMMENDED_METRICS_ORDER` for column ordering
   - Metric headers with descriptions in tooltips

### Chart System Features
Based on analysis of `MetricsChartTabs.ts`:

1. **Six Chart Types**
   - Statistics: Sortable summary table with export
   - Trends: Line/area charts with decomposition
   - Compare: Bar charts, box plots, violin plots
   - Correlations: Scatter plots, correlation matrices
   - Heatmap: Calendar visualization
   - Insights: Advanced analytics

2. **Accessibility Features**
   - Full ARIA support with roles and descriptions
   - Keyboard navigation (Arrow keys, Home/End)
   - Screen reader announcements for tab changes
   - Proper focus management

3. **Export Pipeline**
   - CSV export for each chart type
   - Type-specific export options
   - Uses `CSVExportPipeline` class

## Regression Testing Strategy

### 1. Feature Parity Tests
Create automated tests to verify all existing features work identically:

```typescript
// Example test structure for TestSuiteModal.ts
interface DashboardRegressionTests {
  tableTests: {
    virtualScrolling: () => boolean;
    rowExpansion: () => boolean;
    dateFiltering: () => boolean;
    metricOrdering: () => boolean;
  };
  chartTests: {
    tabNavigation: () => boolean;
    chartRendering: () => boolean;
    dataAccuracy: () => boolean;
    exportFunctionality: () => boolean;
  };
}
```

### 2. Performance Benchmarks
Establish baseline metrics before migration:
- Initial render time for 100, 500, 1000 entries
- Scroll performance (FPS during scroll)
- Tab switch latency
- Memory usage over time

### 3. Visual Regression Testing
- Screenshot comparisons of table layouts
- Chart rendering consistency
- Theme compatibility checks

### 4. State Preservation Tests
- Filter persistence across sessions
- Expanded row state retention
- Active chart tab memory
- Custom date range storage

## Additional Critical Features Discovered

### Filter System Complexity
Based on analysis of `FilterManager.ts` and `DateFilter.ts`:

1. **Multi-layer Persistence**
   - Settings storage: `settings.lastAppliedFilter`
   - LocalStorage backup: `oom-last-applied-filter`
   - Global variable: `window.customDateRange`
   - Session state: `oomIntendedFilter`

2. **Date Navigation Integration**
   - `forceApplyDateFilter()` for external date selection
   - Date format normalization (YYYY-MM-DD)
   - Timezone-aware date handling
   - Integration with DateNavigator modal

3. **Filter Types**
   - Standard ranges: today, yesterday, thisWeek, thisMonth, etc.
   - Custom date ranges with start/end dates
   - "All Time" default option
   - Filter count display ("X entries visible")

## Implementation Progress Report

### Completed Features (as of August 18, 2025)

#### ✅ Core Dashboard Infrastructure
- Created `OneiroMetricsDashboardView` extending ItemView
- Registered view type `oneirometrics-dashboard` in plugin
- Added "Open OneiroMetrics Dashboard" command
- Implemented state management with `DashboardState` interface
- Added CSS styling file at `styles/dashboard.css`

#### ✅ Data Integration
- Integrated with `UniversalMetricsCalculator` for dream entry extraction
- Supports both frontmatter and callout-based metrics extraction
- Handles all selection modes: folder, automatic, notes, manual
- Properly excludes configured subfolders and notes
- Extracts text-based metrics (themes, characters, etc.) correctly

#### ✅ Table Rendering
- Basic table structure with date, title, content, and metric columns
- Clickable title links that open source files
- Right-click context menu with multiple open options:
  - Open in new tab
  - Open to the right/left
  - Open in new window
  - Reveal in navigation
- Content preview with expand/collapse functionality
- Proper handling of text metrics with bracket removal

#### ✅ Interactive Features
- Live search functionality using Obsidian's `prepareSimpleSearch`
- Date filtering with preset ranges (today, last 30 days, etc.)
- Column sorting (date, title, metrics)
- Filter count display showing visible/total entries
- Refresh button with loading states

#### ✅ UI/UX Improvements
- Loading overlay with spinner during data operations
- Error handling with user-friendly messages
- Empty state messaging
- Last update timestamp display
- Theme-compatible styling using CSS variables

### Known Issues Fixed
- ✅ Worker pool errors in dashboard context
- ✅ Settings persistence for DateHandlingConfig fields
- ✅ Automatic selection mode file discovery
- ✅ Text metric display (was showing 0 instead of values)
- ✅ Square bracket removal from YAML array values
- ✅ Metric name validation to allow forward slashes
- ✅ Malformed array handling from frontmatter

### Pending Features

#### ✅ Performance Optimizations - MOSTLY COMPLETE
- [x] Incremental updates (only update changed rows) - DONE
- [x] Virtual scrolling for large datasets - DONE
- [ ] Caching layer for parsed entries
- [ ] Lazy loading of content

#### 🔄 Features Requiring Migration from Existing Code

##### Sorting Functionality - MIGRATION NEEDED
- **Current Implementation**: `DreamMetricsDOM.ts` and `TableGenerator.ts`
- **Features to migrate**:
  - Click headers to sort
  - Visual sort indicators (⇅, ↑, ↓)
  - Multi-column sorting support
  - Sort state persistence
- **Effort**: Low - Logic exists, needs adaptation for virtual scrolling

##### Search and Filtering - MIGRATION NEEDED
- **Current Implementation**: `FilterManager.ts`, `FilterUI.ts`, `DateFilter.ts`
- **Features to migrate**:
  - Live search with highlighting
  - Date range filters (today, yesterday, this week, etc.)
  - Custom date range picker
  - Filter persistence across sessions
  - Filter count display
- **Effort**: Medium - Need to integrate with dashboard state management

##### Export Functionality - MIGRATION NEEDED
- **Current Implementation**: `csv-export-service.ts`
- **Features to migrate**:
  - CSV export with all columns
  - JSON export support
  - Date range exports
  - Selected columns export
- **Effort**: Low - Straightforward adaptation needed

##### Metric Aggregation & Charts - MAJOR MIGRATION NEEDED
- **Current Implementation**: `MetricsChartTabs.ts`, `ChartTabsManager.ts`
- **Features to migrate**:
  - 6 chart types (Statistics, Trends, Compare, Correlations, Heatmap, Insights)
  - Chart.js integration
  - Chart-specific export functionality
  - Accessibility features (ARIA, keyboard nav)
  - Chart state persistence
- **Effort**: High - Complex system requiring significant integration work

#### 🔄 New Features (Not in Current Implementation)
- [ ] Batch operations (select multiple entries)
- [ ] Advanced metric filtering
- [ ] Real-time updates when files change
- [ ] Metric threshold alerts

#### 🔄 Migration Tools
- [ ] Command to migrate from static HTML
- [ ] Settings migration utility
- [ ] Backward compatibility layer
- [ ] Documentation updates

### Technical Debt Addressed
- Removed dependency on Obsidian App instance in worker context
- Improved structured logging throughout
- Proper TypeScript typing for all interfaces
- Clean separation of concerns between view and data layers

## Migration Priority Recommendations

### Recommended Migration Order

1. **Sorting Functionality** (1-2 days)
   - Low effort, high impact
   - Essential for usability
   - Good foundation for other features

2. **Export Functionality** (1-2 days)
   - Low effort, high value
   - Users need to export their data
   - Can reuse existing CSV service

3. **Search and Filtering** (3-4 days)
   - Medium effort, critical feature
   - Already partially implemented
   - Need to integrate FilterManager

4. **Metric Aggregation & Charts** (5-7 days)
   - High effort, high value
   - Most complex migration
   - Consider phased approach per chart type

### Features That Can Wait
- Batch operations (new feature)
- Advanced metric filtering (enhancement)
- Metric threshold alerts (new feature)
- Migration tools (can run both versions in parallel)

## Implementation Recommendations

### 1. Phased Migration Approach

#### Phase 0: Pre-migration (Week 0)
1. **Create comprehensive test suite**
   - Add regression tests to TestSuiteModal.ts
   - Document all current behaviors
   - Capture performance baselines
   - Screenshot all views/states

2. **Build compatibility layer**
   - Create adapter classes for existing APIs
   - Implement legacy event handlers
   - Ensure backward compatibility

#### Modified Phase 1: Foundation with Compatibility (Week 1-2)
1. Create `OneiroMetricsDashboardView` with legacy support
2. **Port existing DOM structure** first (don't redesign yet)
3. Implement dual-rendering mode:
   ```typescript
   class OneiroMetricsDashboardView extends ItemView {
     private legacyMode: boolean = true;
     private legacyDOM: DreamMetricsDOM;
     private modernRenderer: DashboardRenderer;
     
     async onOpen() {
       if (this.legacyMode) {
         // Use existing rendering logic
         this.legacyDOM = new DreamMetricsDOM(...);
         this.legacyDOM.render();
       } else {
         // Use new optimized renderer
         this.modernRenderer.render();
       }
     }
   }
   ```

### 2. Feature-by-Feature Migration

Instead of rebuilding from scratch, migrate features individually:

1. **Virtual Scrolling Migration**
   - Extract current implementation into reusable module
   - Test thoroughly before switching
   - Keep CSS custom properties approach

2. **Chart System Migration**
   - Reuse existing Chart.js configurations
   - Port tab management logic as-is
   - Maintain export pipeline compatibility

3. **Filter System Migration**
   - Preserve all persistence layers
   - Keep global variable compatibility
   - Maintain event system

### 3. Testing Strategy

#### Automated Testing
```typescript
// Add to TestSuiteModal.ts
class DashboardMigrationTests {
  async testTableRendering() {
    // Compare old vs new HTML structure
    const oldHTML = await this.renderLegacyTable(testData);
    const newHTML = await this.renderDashboardTable(testData);
    return this.compareStructures(oldHTML, newHTML);
  }
  
  async testFilterPersistence() {
    // Test all persistence layers work
    await this.setFilter('last30');
    await this.reloadPlugin();
    return this.getActiveFilter() === 'last30';
  }
  
  async testVirtualScrollPerformance() {
    // Measure scroll FPS
    const metrics = await this.measureScrollPerformance(1000);
    return metrics.fps >= 30;
  }
}
```

#### Manual Testing Checklist
- [ ] All date filters work correctly
- [ ] Row expansion maintains state
- [ ] Charts render identically
- [ ] Keyboard navigation works
- [ ] Theme compatibility verified
- [ ] Export functions work
- [ ] Links navigate correctly
- [ ] Performance meets targets

### 4. Rollback Plan

1. **Feature flags for gradual rollout**
   ```typescript
   settings.useDashboardView = false; // Default to legacy
   ```

2. **Keep legacy code intact** during migration
   - Don't delete old implementations
   - Maintain dual code paths
   - Allow instant rollback

3. **User opt-in beta**
   - "Try new dashboard (Beta)" command
   - Feedback collection mechanism
   - Easy switch back option

### Success Metrics

1. **Performance**
   - 90% of operations complete in <100ms
   - Initial load <500ms for 1000 entries
   - Memory usage <20MB

2. **User Satisfaction**
   - Reduce "Rescrape" clicks by 95%
   - Increase daily active usage by 50%
   - Positive feedback from beta testers

3. **Code Quality**
   - 80% test coverage
   - TypeScript strict mode
   - Zero runtime errors in production

### Dependencies

- Obsidian API 1.0+
- TypeScript 5.0+
- Existing OneiroMetrics codebase

### Next Steps

1. **Approval**: Review and approve this plan
2. **Team Assignment**: Assign to `oneirometrics-ui-builder` agent
3. **Prototype**: Create proof-of-concept
4. **Feedback**: Share with community for input
5. **Implementation**: Begin Phase 1

## Appendix A: Code Examples

### Example: Live Search Implementation

```typescript
private performSearch(query: string): void {
    if (!query) {
        this.state.filteredEntries = [...this.state.entries];
        this.renderTable();
        return;
    }
    
    const searchFn = prepareSimpleSearch(query);
    this.state.filteredEntries = this.state.entries.filter(entry => {
        return searchFn(entry.content).score > 0 || 
               searchFn(entry.title).score > 0;
    });
    
    this.renderTable();
}
```

### Example: Efficient Table Update

```typescript
private updateTableRow(entry: DreamMetricData): void {
    const row = this.tableBody.querySelector(`tr[data-id="${entry.id}"]`);
    if (!row) return;
    
    // Update only changed cells
    if (entry.hasContentChanged) {
        const contentCell = row.querySelector('.content-cell');
        this.updateContentCell(contentCell, entry);
    }
    
    // Update metrics
    entry.changedMetrics.forEach(metric => {
        const metricCell = row.querySelector(`.metric-${metric}`);
        this.updateMetricCell(metricCell, entry.metrics[metric]);
    });
}
```

## Appendix B: UI Mockups

[To be added: Visual mockups of the new dashboard interface]

## Appendix C: Performance Benchmarks

[To be added: Detailed performance comparison data]

## Risk Mitigation Recommendations Summary

### High-Priority Risks to Mitigate

1. **Data Loss Prevention**
   - Implement automatic backups before migration
   - Create data validation tests
   - Provide manual export option before switching

2. **Performance Regression Prevention**
   - Keep virtual scrolling implementation
   - Maintain current row height (50px) and visible rows (20)
   - Use same RAF-based scroll debouncing
   - Preserve CSS custom properties approach

3. **Feature Parity Assurance**
   - Create side-by-side comparison tests
   - Document every user interaction
   - Test with real user data sets
   - Verify all keyboard shortcuts work

4. **User Trust Maintenance**
   - Clear communication about changes
   - Opt-in beta period
   - Easy rollback mechanism
   - Preserve exact visual appearance initially

### Technical Debt Considerations

1. **Don't Fix What Isn't Broken**
   - Virtual scrolling works well - keep it
   - Chart.js integration is solid - reuse it
   - Filter persistence is complex but functional - port as-is

2. **Incremental Improvements Only**
   - Focus on ItemView benefits (lifecycle, state)
   - Don't redesign UI in first phase
   - Performance optimizations come after stability

3. **Maintain Compatibility**
   - Keep global variables for now
   - Preserve event system
   - Support existing CSS classes
   - Don't break third-party integrations

### Migration Success Criteria

1. **Zero Functional Regression**
   - All current features work identically
   - No performance degradation
   - No visual differences initially

2. **Smooth Transition**
   - Users can switch back anytime
   - Settings preserved perfectly
   - No data migration required

3. **Clear Benefits**
   - Faster subsequent updates (after initial load)
   - Better memory management
   - More stable state handling

---

## Future Enhancements

### CSS Polish for EnhancedDateNavigatorModal
- The EnhancedDateNavigatorModal has been successfully integrated into the dashboard
- Month/Dual Month/Quarter view functionality is working
- CSS polish needed for better visual presentation in dashboard context:
  - Layout adjustments for month/dual/quarter views
  - Proper spacing and alignment
  - Theme compatibility improvements
  - Mobile responsiveness for the modal

### Performance Optimizations (Nice to Have)
The dashboard already includes several key performance optimizations:
- ✅ Virtual scrolling for efficient rendering of large datasets
- ✅ Incremental updates to minimize re-rendering
- ✅ Debounced search to prevent excessive updates
- ✅ Efficient state management with Maps for O(1) lookups
- ✅ Performance tracking and metrics

Additional optimizations that could be added if needed:
- **Caching parsed entries** - Could save ~100-200ms on refresh for very large vaults
- **Lazy loading content previews** - Further memory optimization for massive datasets
- **Web Workers for parsing** - Could help with vaults containing 10,000+ entries
- **Memoization of expensive calculations** - For complex metric aggregations

These optimizations are not critical as the current implementation handles typical use cases (100-5000 entries) very efficiently.

## Implementation Status (as of January 2025)

### ✅ Completed Features
- **Core Dashboard Infrastructure**: View registration, state management, UI framework
- **Data Integration**: Direct extraction via UniversalMetricsCalculator, all selection modes supported
- **Table Rendering**: Virtual scrolling, clickable titles, content preview/expand, proper metric display
- **Search & Filtering**: Live search, date filters, custom date ranges with EnhancedDateNavigatorModal
- **Sorting**: Column header sorting with visual indicators, state persistence
- **Charts Integration**: All 6 chart types (Statistics, Trends, Compare, Correlations, Heatmap, Insights)
- **Export Functionality**: CSV/JSON export with dropdown menu, respects filters and sorting
- **Incremental Updates**: Efficient row-level updates for changed entries
- **Filter Persistence**: Settings and localStorage backup for filter state
- **Error Handling**: Graceful degradation with user-friendly messages
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

### 🐛 Fixed Issues
- Word count calculation now properly displays in table and statistics
- Text metrics (themes, characters) display correctly as lists
- Square brackets properly removed from YAML arrays
- Custom date range modal integrated with advanced features
- Double scrollbar issue resolved
- Column widths properly sized for content

### 📋 Migration from Metrics Note Complete
All major features from the static Metrics Note have been successfully migrated to the dynamic dashboard with improved performance and user experience.

**Document Status**: This is a living document tracking the OneiroMetrics Dashboard implementation.
**Last Updated**: Implementation complete with all major features migrated and working.

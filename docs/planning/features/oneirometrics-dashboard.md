# OneiroMetrics Dashboard Migration Plan

- **Document Version:** 1.0
- **Date:** August 11, 2025
- **Author:** John Banister
- **Status:** Draft

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

#### Phase 1: Foundation (Week 1-2)
1. Create `OneiroMetricsDashboardView` class
2. Register view type in plugin
3. Add command to open dashboard
4. Implement basic table rendering
5. Set up state management

#### Phase 2: Data Layer (Week 2-3)
1. Adapt existing `DreamEntryParser`
2. Create efficient data structures
3. Implement caching layer
4. Add incremental update support

#### Phase 3: Interactivity (Week 3-4)
1. Add live search functionality
2. Implement column sorting
3. Add date filtering
4. Create expand/collapse for content

#### Phase 4: Polish & Migration (Week 4-5)
1. Add loading states
2. Implement error handling
3. Create migration command
4. Update documentation

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

---

**Document Status**: This is a living document that will be updated as the implementation progresses.

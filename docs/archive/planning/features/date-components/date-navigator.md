# ⚠️ **ARCHIVED DOCUMENT** ⚠️

**Archive Date**: 2025-06-06  
**Status**: This document has been **ARCHIVED** and consolidated into a unified planning document.

**🔗 Current Document**: [`docs/archive/planning/features/2025-completed/date-calendar-unified.md`](../../2025-completed/date-calendar-unified.md)

**⚠️ DO NOT USE for development planning.** This archived document contains outdated information and conflicting completion status. Always refer to the unified document for current planning and implementation status.

---

# Date Navigator Implementation Plan

## 📊 **Implementation Status Overview**

| Phase | Status | Completion |
|-------|--------|------------|
| **Phase 1**: Basic Structure | ✅ Complete | 100% |
| **Phase 2**: Dream Entry Integration | ✅ Complete | 100% |
| **Phase 3**: UI Polish & State Management | ✅ Complete | 100% |
| **Phase 4**: Metrics & Accessibility | ⚠️ Partial | 60% |
| **Phase 5**: Enhanced Features | ❌ Not Started | 0% |

**Overall Progress: 76% Complete** - Core functionality fully implemented, advanced features pending

---

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Core Functionality](#core-functionality)
  - [User Benefits](#user-benefits)
- [Technical Specifications](#technical-specifications)
  - [Data Structure](#data-structure)
  - [Component Architecture](#component-architecture)
  - [Event Handling](#event-handling)
- [UI Implementation](#ui-implementation)
  - [Month Grid Layout](#month-grid-layout)
  - [Day Cell Design](#day-cell-design)
  - [Enhanced Visual Design](#enhanced-visual-design)
  - [CSS Implementation](#css-implementation)

---

## Overview

The Date Navigator feature provides a calendar-style visualization of dream journal entries, allowing users to see their dream activity patterns at a glance and quickly filter data by selecting specific days. This document outlines the detailed implementation plan, technical specifications, and UI/UX considerations for the Date Navigator feature within the OneiroMetrics plugin.

## Features

### Core Functionality
- Calendar-style month grid with day cells
- Visual indicators for dream journal entries
- Day selection for filtering
- Month/year navigation
- Integration with existing date filter system
- Metric visualization on day cells

### User Benefits
- Quick visual overview of dream patterns across a month
- Easy identification of days with dream entries
- Simplified filtering by clicking directly on days
- Intuitive navigation between months and years
- Visual indicators for dream activity metrics
- Seamless integration with existing filtering capabilities

## Technical Specifications

### Data Structure

```typescript
// Core interfaces
interface DateNavigator {
    currentMonth: Date;
    days: Day[];
    navigation: MonthNavigation;
    metrics: DayMetricsSummary;
}

interface Day {
    date: Date;
    hasDreamEntry: boolean;
    entries: DreamEntry[];
    metrics: MetricSummary;
    isSelected: boolean;
    isToday: boolean;
    isCurrentMonth: boolean;
}

interface MonthNavigation {
    currentView: Date;
    canNavigateBack: boolean;
    canNavigateForward: boolean;
}

interface MetricSummary {
    count: number;
    key: string;
    value: number;
    indicator: 'high' | 'medium' | 'low' | 'none';
}

// State management
interface DateNavigatorState {
    currentMonth: Date;
    selectedDay: Date | null;
    dreamEntries: Map<string, DreamEntry[]>; // Key: YYYY-MM-DD
    metrics: Map<string, MetricSummary>; // Key: YYYY-MM-DD
    filterActive: boolean;
}
```

### Component Architecture

1. **DateNavigatorContainer**
   - Main component that manages state and handles events
   - Renders the MonthHeader, MonthGrid, and controls
   - Connects to the global filter state

2. **MonthHeader**
   - Displays month name and year
   - Contains navigation controls
   - Handles month/year selection

3. **MonthGrid**
   - Renders the calendar grid
   - Manages layout of day cells
   - Handles grid-level events

4. **DayCell**
   - Renders individual day information
   - Displays dream indicators and metrics
   - Handles day selection events

5. **MonthNavigation**
   - Previous/Next month buttons
   - Today button
   - Month/year selectors

### Event Handling

1. **Day Selection**
   - Click on day cell -> Select day and update filter
   - Click on selected day -> Deselect and clear filter
   - Shift+Click (future) -> Range selection

2. **Month Navigation**
   - Previous button -> Go to previous month
   - Next button -> Go to next month
   - Today button -> Go to current month
   - Month selector -> Open month dropdown
   - Year selector -> Open year dropdown

3. **Filter Integration**
   - Day selection updates global filter state
   - Global filter changes update selected days
   - Clear selection button resets filter

## UI Implementation

### Month Grid Layout

```
+-------------------------------------------+
| Date Navigator - May 2025            <> v |
+----+----+----+----+----+----+----+
| Su | Mo | Tu | We | Th | Fr | Sa |
+----+----+----+----+----+----+----+
|    |    |    | 1  | 2  | 3  | 4  |
+----+----+----+----+----+----+----+
| 5  | 6  | 7  | 8  | 9  | 10 | 11 |
+----+----+----+----+----+----+----+
| 12 | 13 | 14 | 15 | 16 | 17 | 18 |
+----+----+----+----+----+----+----+
| 19 | 20 | 21*| 22 | 23 | 24 | 25 |
+----+----+----+----+----+----+----+
| 26 | 27 | 28 | 29 | 30 | 31 |    |
+----+----+----+----+----+----+----+
```

### Day Cell Design

```
+------------------+
| 21               | ← Date number
|                  |
| ●●●              | ← Dream indicators (3 entries)
|                  |
| [★★★☆☆]          | ← Metric visualization (3/5 rating)
|                  |
| 📝 Preview       | ← Content preview (on hover)
+------------------+
```

### Enhanced Visual Design

#### Visual Hierarchy Improvements
- Use subtle background color gradients based on dream entry count
- Vary opacity or size of indicators based on metric values
- Apply consistent color coding:
  - Days with entries: subtle accent color
  - Days without entries: neutral background
  - Current day: prominent border
  - Selected day: filled background
  - Days from other months: muted appearance

#### Interactive Elements
- Hover state with expanded preview tooltip
- Active state with clear selection indication
- Focus indicators for keyboard navigation
- Visual feedback when filtering is active (e.g., persistent filter badge)

### CSS Implementation

```css
/* Base styles for date navigator container */
.oom-date-navigator {
    --month-bg: var(--background-primary);
    --month-border: var(--background-modifier-border);
    --month-text: var(--text-normal);
    --month-header: var(--text-accent);
    --day-bg: var(--background-primary);
    --day-border: var(--background-modifier-border);
    --day-text: var(--text-normal);
    --day-today: var(--interactive-accent);
    --day-selected: var(--interactive-accent-hover);
    --day-dream: var(--text-accent);
    --day-no-dream: var(--text-muted);
    --day-other-month: var(--background-secondary);
    --day-hover: var(--background-modifier-hover);
    --day-with-entry-bg: rgba(var(--interactive-accent-rgb), 0.1);
    
    display: flex;
    flex-direction: column;
    border: 1px solid var(--month-border);
    border-radius: 4px;
    overflow: hidden;
}

/* Month header styles */
.oom-month-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--background-secondary-alt);
    border-bottom: 1px solid var(--month-border);
}

/* Month grid styles */
.oom-month-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background-color: var(--month-border);
}

/* Day cell styles */
.oom-day-cell {
    min-height: 80px;
    padding: 4px;
    background-color: var(--day-bg);
    position: relative;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    transition: all 0.15s ease;
}

.oom-day-cell:hover {
    background-color: var(--day-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    z-index: 1;
}

/* Day number */
.oom-day-number {
    font-weight: var(--font-bold);
    margin-bottom: 4px;
}

/* Dream indicators */
.oom-dream-indicators {
    display: flex;
    gap: 2px;
    margin-bottom: 4px;
}

.oom-dream-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--day-dream);
}

/* State styling */
.oom-day-cell.is-today {
    border: 2px solid var(--day-today);
}

.oom-day-cell.is-selected {
    background-color: var(--day-selected);
}

.oom-day-cell.other-month {
    background-color: var(--day-other-month);
    color: var(--day-no-dream);
}

.oom-day-cell.has-entries {
    background-color: var(--day-with-entry-bg);
}

/* Dream preview tooltip */
.oom-day-preview {
    position: absolute;
    display: none;
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
    padding: 8px;
    width: 220px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 10;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    max-height: 150px;
    overflow-y: auto;
}

.oom-day-cell:hover .oom-day-preview {
    display: block;
}

/* Navigation controls */
.oom-month-controls {
    display: flex;
    gap: 8px;
    align-items: center;
}

.oom-month-button {
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--text-normal);
    cursor: pointer;
    padding: 4px 8px;
}

.oom-month-button:hover {
    background-color: var(--background-modifier-hover);
}

/* Metric visualization */
.oom-day-metrics {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: auto;
    font-size: 0.8em;
}

/* Year navigation context */
.oom-year-context {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 8px;
    padding: 4px;
    font-size: 0.8em;
    border-top: 1px solid var(--background-modifier-border);
}

.oom-month-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin: 0 2px;
    background-color: var(--text-muted);
}

.oom-month-dot.active {
    background-color: var(--text-accent);
    width: 8px;
    height: 8px;
}

.oom-month-dot.has-entries {
    background-color: var(--day-dream);
}

/* Filter indicator */
.oom-filter-indicator {
    display: inline-flex;
    align-items: center;
    font-size: 0.8em;
    padding: 2px 6px;
    border-radius: 4px;
    background-color: var(--interactive-accent);
    color: var(--text-on-accent);
    margin-left: 8px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .oom-day-cell {
        min-height: 60px;
        padding: 2px;
    }
    
    .oom-dream-dot {
        width: 6px;
        height: 6px;
    }
    
    .oom-day-preview {
        width: 180px;
        left: 0;
        transform: none;
    }
}
```

## Implementation Phases

### Phase 1: Basic Structure (Days 1-3) ✅ **COMPLETED 2024-12-XX**
- [x] Create DateNavigator component with basic layout
- [x] Implement day grid generation with correct dates
- [x] Add basic styling for month grid and day cells
- [x] Implement current month calculation and display
- [x] Add today highlighting

### Phase 2: Dream Entry Integration (Days 4-7) ✅ **COMPLETED 2024-12-XX**
- [x] Connect to dream entry data source
- [x] Implement dream entry indicators on day cells
- [x] Create filter integration for day selection
- [x] Add selected state styling
- [x] Implement basic navigation between months

### Phase 3: UI Polish and State Management (Days 8-10) ✅ **COMPLETED 2024-12-XX**
- [x] Improve navigation controls with month/year selectors
- [x] Add animations for month transitions
- [x] Implement state persistence across sessions
- [x] Add responsive layouts for different screen sizes
- [x] Implement performance optimizations

### Phase 4: Metrics Visualization and Accessibility (Days 11-14) ⚠️ **PARTIALLY COMPLETED**
- [x] Add metric visualization to day cells
- [ ] Implement comprehensive keyboard navigation (arrow keys, etc.)
- [ ] Add complete screen reader support with ARIA labels
- [ ] Finalize accessibility features (high contrast, reduced motion)
- [x] Complete documentation and testing

### Phase 5: Enhanced Features (Future) ❌ **NOT IMPLEMENTED**
- [ ] Add hover previews for dream content
- [ ] Implement heat map visualization mode
- [ ] Add year context navigation strip
- [ ] Implement advanced selection options (range selection, patterns)
- [ ] Add filtering history and quick jumps

## Current Implementation Status

### ✅ **Completed Features**
- **Core Calendar Component**: Full `DateNavigator` class with month grid generation
- **Modal Integration**: `DateNavigatorModal` for standalone date selection
- **View Integration**: `DateNavigatorView` for Obsidian workspace integration
- **Comprehensive Styling**: Complete CSS implementation matching design specifications
- **Filter System Integration**: Full integration with existing `DateFilter` and `FilterUI` classes
- **Dream Entry Display**: Automatic loading and display of dream entries on calendar days
- **Navigation Controls**: Month/year navigation, today button, clear selection
- **State Management**: Proper state persistence and session handling
- **Performance Optimizations**: Efficient DOM updates and data caching
- **User Documentation**: Complete user guide in `docs/user/guides/date-navigator.md`

### ⚠️ **Partially Implemented**
- **Accessibility**: Basic keyboard support implemented, but comprehensive ARIA labels and screen reader optimization needed
- **Metrics Visualization**: Basic entry indicators implemented, but advanced metric visualizations could be enhanced

### ❌ **Not Implemented**
- **Multiple View Modes**: Only CALENDAR mode implemented (LIST and TIMELINE modes not built)
- **Advanced Selection Features**: Range selection, pattern selection, saved selections
- **Heat Map Mode**: Color intensity visualization for metrics
- **Hover Previews**: Detailed dream content previews on hover
- **Year Context Strip**: Timeline showing months with entries
- **Advanced Navigation**: Smart jumps, filtering history, keyboard shortcuts beyond basic navigation

## Technical Implementation Details

### **Architecture**
- **Main Class**: `DateNavigator` in `src/dom/date-navigator/DateNavigator.ts`
- **Modal Interface**: `DateNavigatorModal` in `src/dom/DateNavigatorModal.ts`
- **View Integration**: `DateNavigatorView` in `src/dom/date-navigator/DateNavigatorView.ts`
- **Styling**: Complete CSS in `src/dom/date-navigator/DateNavigatorStyles.css`

### **Integration Points**
- **Filter System**: Integrated with `DateFilter` class for seamless filtering
- **State Management**: Connected to `DreamMetricsState` for data consistency
- **Obsidian Integration**: Proper workspace and modal integration
- **Data Pipeline**: Automatic dream entry discovery and display

### **Performance Features**
- **Efficient Rendering**: Optimized DOM updates with minimal reflows
- **Data Caching**: Smart caching of dream entries per month
- **Chunked Processing**: Large dataset handling with performance monitoring
- **Memory Management**: Proper cleanup and garbage collection

## Integration Points

### Filter System Integration
1. **Day Selection -> Filter Update**
   - When a day is selected in the Date Navigator, update the global date filter
   - Set the filter range to the selected day (both start and end date)
   - Update UI to reflect filtered state

2. **Filter Change -> Date Navigator Update**
   - When date filter changes externally, update Date Navigator selected day
   - Navigate to the month containing the filtered date
   - Highlight the selected day(s)

3. **Quick Filter Buttons -> Date Navigator Update**
   - Quick filter buttons (Today, This Week, etc.) update Date Navigator selection
   - Navigate to appropriate month
   - Highlight relevant day(s)

### Filter System Improvements
1. **Unified Filter Approach**
   - Rename "Custom Range" to "Choose Dates..." for better clarity
   - Create a single dropdown menu that includes:
     - Quick filter presets at the top (All Time, Today, This Week, etc.)
     - "Choose Dates..." option at the bottom that opens the date selection modal
     - Clear visual separation between preset options and custom option
   - Make the Date Navigator accessible through this unified interface
   - Ensure consistent state indication across all filtering methods

2. **Visual Integration**
   - Use consistent design language across all filter methods
   - Show active filter state clearly in all views (dropdown, modal, and Date Navigator)
   - Provide visual feedback when filter changes are applied
   - Implement smooth transitions between filter methods

3. **Filtering Workflow Improvements**
   - Allow users to start with a preset and then modify it
   - Remember recently used custom date ranges
   - Display currently active filter prominently
   - Provide one-click option to clear filters

### Obsidian Integration
1. **File System Integration**
   - Access dream journal entries through Obsidian's vault API
   - Maintain cache of parsed entries for performance
   - Respect Obsidian's file operations model

2. **UI Integration**
   - Follow Obsidian's design patterns and CSS variables
   - Support both light and dark themes
   - Match Obsidian's animation and transition styles
   - Support mobile and desktop interfaces

3. **Workspace Integration**
   - Allow Date Navigator to respond to workspace changes
   - Maintain state during note switching
   - Support connection to other Obsidian panes

### Data Integration
1. **Dream Entry Data -> Day Indicators**
   - Query dream entries for visible month
   - Map entries to days
   - Update day cell indicators

2. **Metrics Data -> Day Visualization**
   - Calculate metrics for each day with entries
   - Update metric visualization on day cells
   - Apply appropriate styling based on metric values

## Enhanced UI/UX Features

### Visual Hierarchy Enhancements
- **Glanceable Information**: Use color intensity and size variation to make important metrics immediately visible
- **Content Density Indicators**: Subtle background variations to show content density or importance
- **Status Indicators**: Clear visual indicators for today, selected day, and days with entries
- **Timeline Context**: Add a year-view strip below the month to show context and allow quick navigation

### Interaction Refinements
- **Content Preview**: Show a preview of dream entry content on hover/focus
- **Hover States**: Add hover effects that reveal more information without requiring clicks
- **Selection Feedback**: Clear visual feedback when a selection is active
- **Filter Indicators**: Persistent indicators when filtering is active

### Navigation Enhancements
- **Jump to Date**: Quick access feature to jump to a specific date
- **Year Context**: Timeline showing months with entries for easier navigation
- **Smart Navigation**: Remember last viewed month/selection when returning to view
- **Keyboard Shortcuts**: Comprehensive keyboard navigation with documented shortcuts

## Advanced Feature Enhancements

### Visualization Options
- **Heat Map Mode**: Color intensity visualization for metric values across the month
- **Theme Patterns**: Small icons or color coding for recurring dream themes
- **Trend Mini-graphs**: Tiny sparklines showing metric trends within day cells
- **Activity Patterns**: Highlight patterns like weekday/weekend differences

### Selection and Filtering
- **Pattern Selection**: "Select all Mondays" or "Select days with specific metrics"
- **Saved Selections**: Save and name frequently used date patterns
- **Filter Combinations**: Combine day selection with other filter types
- **Selection History**: Navigate through previous selections

### State and Context
- **Year-at-a-glance**: Miniature year view showing activity patterns
- **Adjacent Month Preview**: Preview of adjacent months' dream activity
- **Filter Status**: Clear indication of current filtering state
- **Persistence**: Remember view state between sessions

## Testing Plan

### Unit Tests
- [ ] Date calculations and grid generation
- [ ] State management
- [ ] Navigation logic
- [ ] Filter integration

### Integration Tests
- [ ] Dream entry data integration
- [ ] Filter system interaction
- [ ] State persistence
- [ ] UI component interaction

### User Testing
- [ ] Day selection usability
- [ ] Navigation intuitiveness
- [ ] Metric visualization clarity
- [ ] Filter integration functionality
- [ ] Accessibility evaluation
- [ ] Mobile usability

## Accessibility Considerations

### Keyboard Navigation
- Arrow keys to navigate between days
- Enter to select day
- Escape to clear selection
- Tab navigation between controls
- Home/End to jump to start/end of month
- Page Up/Down to navigate between months

### Screen Reader Support
- Announce month changes
- Describe day cell contents
- Indicate selected state
- Announce dream entry presence
- Describe metric values
- Provide context information

### Additional Accessibility Features
- High contrast mode support
- Reduced motion option
- Scalable UI elements
- Sufficient color contrast
- Text alternatives for visual indicators

## Technical Challenges and Solutions

1. **Performance Optimization**
   - Challenge: Rendering and updating many day cells efficiently
   - Solution: Virtual rendering, memoization, and efficient DOM updates
   - Obsidian-specific: Use efficient DOM operations and avoid unnecessary re-renders

2. **State Management with Obsidian**
   - Challenge: Maintaining state within Obsidian's plugin architecture
   - Solution: Leverage plugin data storage for persistent state
   - Obsidian-specific: Use plugin settings for persistent data and in-memory state for session data

3. **Date Calculations**
   - Challenge: Correct handling of month boundaries and week calculations
   - Solution: Robust date utility functions with thorough testing
   - Obsidian-specific: Account for user timezone and date format preferences

4. **Responsive Design**
   - Challenge: Maintaining usability across device sizes
   - Solution: Responsive CSS with breakpoints and content prioritization
   - Obsidian-specific: Test with Obsidian mobile app and various desktop window sizes

5. **Theme Compatibility**
   - Challenge: Supporting various Obsidian themes
   - Solution: Use Obsidian CSS variables for all styling
   - Obsidian-specific: Test with popular community themes and both light/dark modes

## Conclusion

The Date Navigator feature provides a powerful visual tool for navigating and understanding dream journal entries over time. By implementing this feature, users will gain a more intuitive way to explore their dream patterns and quickly filter their data by specific days. The enhanced UI/UX features will make the experience more engaging and efficient, while maintaining compatibility with Obsidian's plugin architecture and design patterns.

## Resources

- Obsidian API Documentation: https://github.com/obsidianmd/obsidian-api
- Technical Documentation: [Date & Calendar Features](../../2025-completed/date-calendar-unified.md)
- Accessibility Guidelines: [docs/developer/implementation/accessibility.md]
- Related Features: [Custom Date Filter, Date Comparison Tools] 
# ⚠️ **ARCHIVED DOCUMENT** ⚠️

**Archive Date**: 2025-06-06  
**Status**: This document has been **ARCHIVED** and consolidated into a unified planning document.

**🔗 Current Document**: [`docs/planning/features/date-calendar-unified.md`](../../features/date-calendar-unified.md)

**⚠️ DO NOT USE for development planning.** This archived document contains outdated information and conflicting completion status. Always refer to the unified document for current planning and implementation status.

---

# Month View Implementation Plan

## 📊 **Implementation Status Overview**

| Phase | Status | Completion |
|-------|--------|------------|
| **Phase 1**: Basic Structure | ✅ Complete | 100% |
| **Phase 2**: Dream Entry Integration | ✅ Complete | 100% |
| **Phase 3**: UI Polish & State Management | ✅ Complete | 100% |
| **Phase 4**: Metrics & Accessibility | ⚠️ Partial | 70% |
| **Phase 5**: Enhanced Features | ⚠️ Partial | 30% |

**Overall Progress: 80% Complete** - Core month view fully functional, advanced features partially implemented

---

## ✅ **Completed Features**

### **Core Month View Functionality (100% Complete)**
- **Calendar Layout**: Full `DateNavigator` implementation with month grid display
- **Dream Entry Visualization**: Visual indicators (dots and stars) showing dream entries and quality
- **Month/Year Navigation**: Complete navigation with prev/next buttons and today button
- **Day Selection**: Click-to-filter functionality with visual selection feedback
- **Filter Integration**: Seamless connection with existing `DateFilter` and `FilterUI` systems
- **State Management**: Proper persistence and session state handling
- **Responsive Design**: Mobile and desktop optimized layouts

### **UI Components Implementation**
- **Month Header**: Implemented via `createMonthHeader()` in `DateNavigator`
- **Month Grid**: Implemented via `createMonthGrid()` with 7-day grid layout
- **Day Cells**: Full day cell implementation with dream indicators and selection states
- **Navigation Controls**: Previous/next month buttons, today button functionality
- **CSS Styling**: Complete stylesheet with theme integration (`DateNavigatorStyles.css`)

## ⚠️ **Partially Implemented**

### **Metrics Visualization (70% Complete)**
- ✅ **Basic Indicators**: Dream entry dots and quality stars implemented
- ✅ **Entry Count Display**: Visual representation of dream entry quantity
- ❌ **Advanced Metric Types**: No heat map mode or metric intensity visualization
- ❌ **Theme Pattern Icons**: No visual icons for recurring dream themes
- ❌ **Mini-graphs**: No sparklines or trend indicators in day cells

### **Accessibility Features (70% Complete)**
- ✅ **Basic Keyboard Support**: Tab navigation and basic keyboard events
- ✅ **ARIA Labels**: Navigation buttons have proper accessibility attributes
- ❌ **Advanced Keyboard Navigation**: No arrow key navigation between days
- ❌ **Screen Reader Optimization**: Limited screen reader announcements
- ❌ **High Contrast Support**: No specialized high contrast mode

### **Enhanced Features (30% Complete)**
- ❌ **Hover Previews**: No dream content preview on hover
- ❌ **Year Context Strip**: No year-at-a-glance navigation
- ❌ **Advanced Selection**: No range selection or pattern-based selection
- ❌ **Filter History**: No saved selections or quick jumps
- ✅ **Performance Optimization**: Efficient DOM updates and data caching

## ❌ **Not Implemented**

### **Advanced Visualization Options**
- ❌ **Heat Map Mode**: No color intensity visualization for metrics
- ❌ **Theme Pattern Display**: No visual coding for recurring dream themes
- ❌ **Trend Mini-graphs**: No sparklines showing metric trends in cells
- ❌ **Activity Pattern Highlighting**: No weekday/weekend pattern visualization

### **Enhanced Interaction Features**
- ❌ **Pattern Selection**: No "select all Mondays" or similar pattern selection
- ❌ **Saved Selections**: No ability to save and name frequently used date patterns
- ❌ **Advanced Filter Combinations**: Limited combination with other filter types
- ❌ **Selection History**: No navigation through previous selections

## 🔧 **Technical Implementation Details**

### **Implemented Architecture**
- **Main Component**: `DateNavigator` class (`src/dom/date-navigator/DateNavigator.ts` and `src/dom/DateNavigator.ts`)
- **Modal Integration**: `DateNavigatorModal` for standalone month view access
- **Styling**: Complete CSS implementation (`src/dom/date-navigator/DateNavigatorStyles.css`)
- **Data Management**: Efficient month-based entry caching and state management
- **Filter Integration**: Full integration with `FilterUI` and `TimeFilterManager`

### **Component Mapping**
**Note**: The implementation uses different naming than originally planned:

| **Planned Component** | **Actual Implementation** |
|----------------------|---------------------------|
| `MonthViewContainer` | `DateNavigator` class |
| `MonthHeader` | `createMonthHeader()` method |
| `MonthGrid` | `createMonthGrid()` method |
| `DayCell` | `createDayCell()` method |
| `MonthNavigation` | Integrated navigation controls |

### **Performance Features**
- **Efficient Rendering**: Optimized DOM updates with element caching
- **Smart Data Management**: Month-based dream entry caching
- **Responsive Updates**: Debounced filter updates and visual state changes
- **Memory Management**: Proper cleanup and garbage collection

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

The Month View feature provides a calendar-style visualization of dream journal entries, allowing users to see their dream activity patterns at a glance and quickly filter data by selecting specific days. This document outlines the detailed implementation plan, technical specifications, and UI/UX considerations for the Month View feature within the OneiroMetrics plugin.

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
// Core interfaces (actual implementation)
interface DateNavigatorState {
    currentMonth: Date;
    days: DayInfo[];
    selectedDate: Date | null;
    dreamEntries: Map<string, DreamEntry[]>; // Key: YYYY-MM-DD
}

interface DayInfo {
    date: Date;
    hasDreamEntry: boolean;
    entries: DreamEntry[];
    isSelected: boolean;
    isToday: boolean;
    isCurrentMonth: boolean;
    qualityScore?: number;
}

interface DateNavigatorOptions {
    container: HTMLElement;
    onDateSelect?: (date: Date) => void;
    filterManager?: TimeFilterManager;
}

// State management (actual implementation)
interface DateNavigatorView {
    currentMonth: Date;
    selectedDate: Date | null;
    dreamEntries: Map<string, DreamEntry[]>; // Key: YYYY-MM-DD
    filterActive: boolean;
    container: HTMLElement;
}
```

### Component Architecture

1. **DateNavigator** (Main Component)
   - Main component that manages state and handles events
   - Renders the month header, month grid, and controls via methods
   - Connects to the global filter state

2. **createMonthHeader()** Method
   - Displays month name and year
   - Contains navigation controls
   - Handles month/year selection

3. **createMonthGrid()** Method
   - Renders the calendar grid
   - Manages layout of day cells
   - Handles grid-level events

4. **createDayCell()** Method
   - Renders individual day information
   - Displays dream indicators and metrics
   - Handles day selection events

5. **Navigation Controls** (Integrated)
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
| Month View - May 2025                <> v |
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
.oom-date-navigator-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--background-secondary-alt);
    border-bottom: 1px solid var(--month-border);
}

/* Month grid styles */
.oom-date-navigator-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background-color: var(--month-border);
}

/* Day cell styles */
.oom-date-navigator-day {
    min-height: 80px;
    padding: 4px;
    background-color: var(--day-bg);
    position: relative;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    transition: all 0.15s ease;
}

.oom-date-navigator-day:hover {
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

.oom-dream-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--day-dream);
}

/* State styling */
.oom-date-navigator-day.is-today {
    border: 2px solid var(--day-today);
}

.oom-date-navigator-day.is-selected {
    background-color: var(--day-selected);
}

.oom-date-navigator-day.other-month {
    background-color: var(--day-other-month);
    color: var(--day-no-dream);
}

.oom-date-navigator-day.has-entries {
    background-color: var(--day-with-entry-bg);
}

/* Navigation controls */
.oom-date-navigator-controls {
    display: flex;
    gap: 8px;
    align-items: center;
}

.oom-date-navigator-button {
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--text-normal);
    cursor: pointer;
    padding: 4px 8px;
}

.oom-date-navigator-button:hover {
    background-color: var(--background-modifier-hover);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .oom-date-navigator-day {
        min-height: 60px;
        padding: 2px;
    }
    
    .oom-dream-indicator {
        width: 6px;
        height: 6px;
    }
}
```

## Implementation Phases

### Phase 1: Basic Structure (Days 1-3) ✅ **COMPLETED 2024-12-XX**
- [x] Create MonthView component with basic layout
- [x] Implement day grid generation with correct dates
- [x] Add basic styling for month grid and day cells
- [x] Implement current month calculation and display
- [x] Add today highlighting

**Implementation**: Complete `DateNavigator` component with full calendar layout, proper date grid generation using `generateDaysForMonth()`, comprehensive CSS styling, and today highlighting functionality.

### Phase 2: Dream Entry Integration (Days 4-7) ✅ **COMPLETED 2024-12-XX**
- [x] Connect to dream entry data source
- [x] Implement dream entry indicators on day cells
- [x] Create filter integration for day selection
- [x] Add selected state styling
- [x] Implement basic navigation between months

**Implementation**: Full integration with dream entry data sources, visual indicators (dots and stars) for dream entries and quality levels, complete filter system integration with `FilterUI`, selected day styling, and month navigation controls.

### Phase 3: UI Polish and State Management (Days 8-10) ✅ **COMPLETED 2024-12-XX**
- [x] Improve navigation controls with month/year selectors
- [x] Add animations for month transitions
- [x] Implement state persistence across sessions
- [x] Add responsive layouts for different screen sizes
- [x] Implement performance optimizations

**Implementation**: Enhanced navigation with prev/next buttons and today button, smooth transitions, persistent state management, responsive design for mobile and desktop, efficient DOM updates and caching.

### Phase 4: Metrics Visualization and Accessibility (Days 11-14) ⚠️ **PARTIALLY COMPLETED** (70%)
- [x] Add metric visualization to day cells
- [ ] Implement comprehensive keyboard navigation (arrow keys between days)
- [ ] Add complete screen reader support with announcements
- [ ] Finalize accessibility features (high contrast, reduced motion)
- [x] Complete documentation and testing

**Implementation**: Basic metric visualization with dream entry indicators implemented. Accessibility needs enhancement for full keyboard navigation and screen reader optimization.

### Phase 5: Enhanced Features (Future) ⚠️ **PARTIALLY COMPLETED** (30%)
- [ ] Add hover previews for dream content
- [ ] Implement heat map visualization mode
- [ ] Add year context navigation strip
- [ ] Implement advanced selection options (range selection, patterns)
- [ ] Add filtering history and quick jumps

**Implementation**: Performance optimizations completed, but advanced UI features like hover previews, heat map mode, year context strip, and advanced selection options remain unimplemented.

## Integration Points

### Filter System Integration
1. **Day Selection -> Filter Update**
   - When a day is selected in Month View, update the global date filter
   - Set the filter range to the selected day (both start and end date)
   - Update UI to reflect filtered state

2. **Filter Change -> Month View Update**
   - When date filter changes externally, update MonthView selected day
   - Navigate to the month containing the filtered date
   - Highlight the selected day(s)

3. **Quick Filter Buttons -> Month View Update**
   - Quick filter buttons (Today, This Week, etc.) update Month View selection
   - Navigate to appropriate month
   - Highlight relevant day(s)

### Filter System Improvements
1. **Unified Filter Approach**
   - Rename "Custom Range" to "Choose Dates..." for better clarity
   - Create a single dropdown menu that includes:
     - Quick filter presets at the top (All Time, Today, This Week, etc.)
     - "Choose Dates..." option at the bottom that opens the date selection modal
     - Clear visual separation between preset options and custom option
   - Make the Month View accessible through this unified interface
   - Ensure consistent state indication across all filtering methods

2. **Visual Integration**
   - Use consistent design language across all filter methods
   - Show active filter state clearly in all views (dropdown, modal, and Month View)
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
   - Allow Month View to respond to workspace changes
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

The Month View feature provides a powerful visual tool for navigating and understanding dream journal entries over time. By implementing this feature, users will gain a more intuitive way to explore their dream patterns and quickly filter their data by specific days. The enhanced UI/UX features will make the experience more engaging and efficient, while maintaining compatibility with Obsidian's plugin architecture and design patterns.

## Resources

- Obsidian API Documentation: https://github.com/obsidianmd/obsidian-api
- Technical Documentation: [Date & Calendar Features](../../../planning/features/date-calendar-unified.md)
- Accessibility Guidelines: [docs/developer/implementation/accessibility.md]
- Related Features: [Custom Date Filter, Date Comparison Tools] 
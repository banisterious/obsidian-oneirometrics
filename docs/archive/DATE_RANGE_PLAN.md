# Custom Date Filter Plan

## Table of Contents
- [Overview](#overview)
- [Current State](#current-state)
- [Objectives](#objectives)
- [Implementation Plan](#implementation-plan)
  - [UI Changes](#ui-changes)
  - [Event Handling](#event-handling)
  - [State Management](#state-management)
  - [Fallbacks & Edge Cases](#fallbacks--edge-cases)
- [Accessibility](#accessibility)
- [Testing](#testing)
- [Future Enhancements](#future-enhancements)
- [Changelog](#changelog)
- [Multi-month Calendar View Specification](#multi-month-calendar-view-specification)
- [Date Range Comparison Specification](#date-range-comparison-specification)
- [Comparison User Flow](#comparison-user-flow)

---

## Overview
Enhance the existing date range filtering in OneiroMetrics by adding a "Custom Date Filter" feature, while preserving the current dropdown and table UI.

---

## Current State
- Static HTML/markdown table and dropdown for quick date ranges.
- Filtering logic based on dropdown selection.

---

## Objectives
- Add a "Custom Date Filter" button next to the existing dropdown.
- Open a modal for selecting a custom date range.
- Filter the table dynamically based on the selected custom range.
- Maintain all existing functionality and UX.

---

## Implementation Plan

### UI Changes
- Add a new button: "Custom Date Filter" (or "Select Range") next to the dropdown.
- Modal dialog for selecting start and end dates.

### Event Handling
- Button click opens the modal.
- On modal confirmation, update the table to show only entries within the selected range.

### State Management
- Store the selected custom range in memory (not persisted).
- When a custom range is active, visually indicate it (e.g., highlight the button or show a label).

### Fallbacks & Edge Cases
- If the user cancels the modal, do not change the filter.
- If the user clears the custom range, revert to the dropdown's selected value.

---

## Accessibility
### Keyboard Navigation
- Full keyboard support for all interactive elements
- Logical tab order through the filter interface
- Arrow keys for date selection in the calendar
- Enter/Space key support for button activation
- Clear focus indicators with custom styling
- ESC closes the picker
- Modal traps focus while open and returns focus to the triggering button when closed

### ARIA Implementation
- Proper ARIA labels for date inputs (e.g., "Start date for dream entries")
- Button roles correctly assigned
- Live regions for dynamic content updates
- Screen reader announcements for calendar and selected dates
- Error announcements for invalid inputs
- All interactive elements have descriptive labels (e.g., aria-label, aria-labelledby)

### High Contrast Mode Support
- Special styles for forced-colors mode
- Enhanced border visibility
- Improved focus indicators
- Text color adjustments for better contrast
- Custom outline styles for focus states
- Ensure color contrast meets WCAG AA standards for all UI elements

### Reduced Motion
- Respects user's motion preferences
- Disables transitions when `prefers-reduced-motion` is active
- Smooth fallbacks for animations
- No essential information conveyed through motion

### Focus Management
- Modal focus trapping when open
- Focus returns to triggering button when closed
- Clear focus indicators with custom styling
- Logical focus order through the interface

### Screen Reader Support
- Descriptive labels for all interactive elements
- Proper heading structure
- Announcements for dynamic content
- Clear button and control descriptions
- Status updates for filter changes

### Touch Accessibility
- Large touch targets (minimum 44x44px)
- Adequate spacing between interactive elements
- Clear visual feedback for touch interactions
- Optimized for both touch and mouse input

### Color and Contrast
- WCAG AA compliant color contrast
- Theme-aware color schemes
- High contrast mode support
- Clear visual indicators for states

### Responsive Design
- Mobile-friendly layouts
- Touch-optimized controls
- Readable text sizes
- Adequate spacing for touch targets

### Error Handling
- Clear error messages
- Screen reader announcements for errors
- Visual error indicators
- Keyboard-accessible error recovery

## Multi-month Calendar View Specification

### Overview
The multi-month calendar view enhances the Custom Date Filter by displaying multiple months simultaneously, allowing users to select date ranges across different months with a more intuitive visual interface.

### Technical Architecture

#### Core Components
```typescript
interface CalendarView {
    months: Month[];
    selectedRange: DateRange;
    navigation: CalendarNavigation;
}

interface Month {
    year: number;
    month: number;
    weeks: Week[];
    isCurrentMonth: boolean;
}

interface Week {
    weekNumber: number;
    days: Day[];
}

interface Day {
    date: Date;
    isToday: boolean;
    isSelected: boolean;
    isInRange: boolean;
    isDisabled: boolean;
}

interface CalendarNavigation {
    currentView: Date;
    canNavigateBack: boolean;
    canNavigateForward: boolean;
}
```

#### State Management
```typescript
interface CalendarState {
    selectedStartDate: Date | null;
    selectedEndDate: Date | null;
    hoveredDate: Date | null;
    viewStartDate: Date;
    numberOfMonths: number;
    weekNumbersEnabled: boolean;
}
```

### UI Components

#### Calendar Grid
- Responsive grid layout showing 2-3 months
- Month headers with year and month name
- Week day headers (Sun-Sat)
- Week numbers (optional)
- Date cells with:
  - Today's date indicator
  - Selected range highlighting
  - Hover states
  - Disabled state for invalid dates

#### Navigation Controls
- Previous/Next month group buttons
- Current month/year display
- Quick jump to today
- Month/year selector dropdown

#### Selection Interface
- Click and drag for range selection
- Click to select single date
- Keyboard navigation support
- Touch-friendly selection

### Accessibility Features

#### Keyboard Navigation
- Arrow keys to move between dates
- Enter/Space to select date
- Tab navigation between months
- Shift + Arrow keys for range selection
- Escape to close calendar
- Home/End to jump to start/end of month

#### ARIA Implementation
```html
<div role="application" aria-label="Date Range Calendar">
    <div role="grid" aria-label="Calendar">
        <div role="row" aria-label="Week 1">
            <div role="gridcell" aria-selected="true">1</div>
        </div>
    </div>
</div>
```

#### Screen Reader Support
- Announce selected dates
- Announce range selection
- Announce navigation changes
- Announce today's date
- Announce disabled dates

### Responsive Design

#### Desktop Layout
- 3 months displayed horizontally
- Full calendar grid visible
- Hover effects for dates
- Detailed tooltips

#### Tablet Layout
- 2 months displayed horizontally
- Compact week day headers
- Touch-optimized date cells
- Simplified tooltips

#### Mobile Layout
- 1 month displayed
- Swipe navigation between months
- Larger touch targets
- Minimal tooltips

### Mobile Optimization

#### Touch Interface
- Minimum touch target size of 44x44px for all interactive elements
- Swipe gestures for month navigation:
  - Left/right swipe to change months
  - Vertical swipe to scroll content
  - Double-tap to select date
- Touch feedback:
  - Visual feedback on touch (ripple effect)
  - Haptic feedback where supported
  - Clear touch states (active, pressed)

#### Layout Optimization
- Single column layout for all controls
- Full-width date inputs
- Stacked quick filter buttons
- Collapsible sections for better space usage
- Bottom sheet style modal for better reachability
- Optimized spacing for touch:
  - Minimum 8px between touch targets
  - 16px padding around containers
  - 24px margins between sections

#### Performance
- Reduced animations on mobile
- Optimized rendering for touch events
- Lazy loading of month data
- Efficient DOM updates
- Debounced touch events
- Memory-efficient date calculations

#### Mobile-Specific Features
- Native date picker fallback option
- Quick actions in bottom sheet:
  - "Today" button
  - "Clear" button
  - "Apply" button
- Pull-to-refresh for updating data
- Bottom sheet gestures:
  - Swipe down to dismiss
  - Swipe up to expand
  - Tap outside to close

#### Mobile Accessibility
- Larger text sizes for better readability
- High contrast mode optimization
- Voice control support
- Screen reader optimizations:
  - Touch-specific announcements
  - Gesture instructions
  - Clear state changes
- Reduced motion support

#### Mobile Testing
- Device testing:
  - Various screen sizes
  - Different aspect ratios
  - Different pixel densities
- Touch testing:
  - Single touch
  - Multi-touch
  - Gesture recognition
- Performance testing:
  - Touch response time
  - Animation smoothness
  - Memory usage
- Accessibility testing:
  - Screen reader compatibility
  - Voice control
  - High contrast mode

### Performance Considerations

#### Rendering Optimization
- Virtual scrolling for month navigation
- Lazy loading of month data
- Efficient DOM updates
- Debounced range selection

#### State Management
- Memoized calculations
- Efficient date comparisons
- Optimized range selection
- Minimal re-renders

### Theme Integration

#### CSS Variables
```css
.oom-calendar {
    --calendar-bg: var(--background-primary);
    --calendar-border: var(--background-modifier-border);
    --calendar-text: var(--text-normal);
    --calendar-today: var(--interactive-accent);
    --calendar-selected: var(--interactive-accent-hover);
    --calendar-range: var(--interactive-accent-hover);
    --calendar-disabled: var(--text-muted);
}
```

#### Theme Compatibility
- Light/dark mode support
- High contrast mode
- Custom theme variables
- Consistent with Obsidian UI

### Error Handling

#### Edge Cases
- Invalid date ranges
- Navigation limits
- Selection constraints
- State recovery

#### User Feedback
- Clear error messages
- Visual indicators
- Helpful tooltips
- Recovery options

### Testing Requirements

#### Unit Tests
- Date calculations
- Range selection
- Navigation logic
- State management

#### Integration Tests
- Theme compatibility
- Accessibility features
- Responsive behavior
- Performance metrics

#### User Testing
- Range selection ease
- Navigation intuitiveness
- Mobile usability
- Accessibility compliance

### Implementation Phases

#### Phase 1: Core Calendar
- Basic multi-month display
- Date selection
- Range selection
- Navigation controls

#### Phase 2: Enhanced Features
- Week numbers
- Today indicator
- Range highlighting
- Keyboard navigation

#### Phase 3: Polish
- Animations
- Theme integration
- Performance optimization
- Accessibility improvements

## Date Range Comparison Specification

### Overview
The Date Range Comparison feature allows users to compare dream entries and metrics across different time periods, enabling pattern recognition and trend analysis.

### Core Features

#### Comparison Types
1. **Time Period Comparison**
   - Compare current period with previous period
   - Compare custom date ranges
   - Compare multiple periods simultaneously
   - Example: Compare dreams from January 2024 with January 2023

2. **Metric Analysis**
   - Compare dream frequency
   - Compare average dream length
   - Compare metric distributions
   - Compare theme occurrences
   - Compare emotional patterns

3. **Visual Comparison**
   - Side-by-side calendar views
   - Overlapping date ranges
   - Comparative charts and graphs
   - Pattern highlighting

### Technical Implementation

#### Data Structure
```typescript
interface DateRangeComparison {
    primaryRange: DateRange;
    comparisonRanges: DateRange[];
    metrics: ComparisonMetrics;
    patterns: ComparisonPatterns;
}

interface ComparisonMetrics {
    dreamCount: number;
    averageLength: number;
    themeFrequency: Map<string, number>;
    emotionalDistribution: Map<string, number>;
}

interface ComparisonPatterns {
    recurringThemes: string[];
    emotionalTrends: TrendData[];
    temporalPatterns: PatternData[];
}
```

#### Comparison Logic
- Date range overlap detection
- Metric normalization for different period lengths
- Pattern matching algorithms
- Statistical analysis tools

### UI Components

#### Comparison Controls
- Range selection interface
- Comparison type selector
- Metric selection
- Pattern visualization options

#### Visualization
- Comparative calendar views
- Metric comparison charts
- Pattern highlighting
- Trend indicators

### Analysis Features

#### Pattern Detection
- Theme recurrence analysis
- Emotional pattern matching
- Temporal pattern recognition
- Statistical significance testing

#### Trend Analysis
- Metric trend visualization
- Pattern evolution tracking
- Seasonal pattern detection
- Long-term trend analysis

### Export and Reporting

#### Export Options
- Comparison data export
- Visual report generation
- Statistical analysis export
- Pattern report generation

#### Report Types
- Comparative summaries
- Pattern analysis reports
- Trend reports
- Statistical analysis reports

### Implementation Phases

#### Phase 1: Basic Comparison
- Two-range comparison
- Basic metric comparison
- Simple visualization
- Export functionality

#### Phase 2: Advanced Analysis
- Multiple range comparison
- Pattern detection
- Trend analysis
- Advanced visualization

#### Phase 3: Enhanced Features
- Custom comparison metrics
- Advanced pattern recognition
- Interactive visualizations
- Comprehensive reporting

### Testing Requirements

#### Unit Testing
- Date range comparison logic
- Metric calculation accuracy
- Pattern detection algorithms
- Export functionality

#### Integration Testing
- UI component interaction
- Data flow validation
- Performance testing
- Export/import testing

#### User Testing
- Comparison workflow
- Visualization clarity
- Pattern recognition accuracy
- Report usefulness

## Comparison User Flow

### Step 1: Initial Selection
1. User opens Custom Date Filter modal
2. User selects their primary date range
3. User clicks "Compare" button
4. Modal expands to show comparison interface

### Step 2: Comparison Setup
```
+------------------------------------------+
|  Custom Date Filter                      |
|  +------------------------------------+  |
|  |  Primary Range                     |  |
|  |  [Start Date] [End Date]          |  |
|  +------------------------------------+  |
|  |  Comparison Type                   |  |
|  |  ○ Previous Period                 |  |
|  |  ○ Custom Range                    |  |
|  |  ○ Multiple Periods                |  |
|  +------------------------------------+  |
|  |  Comparison Range                  |  |
|  |  [Start Date] [End Date]          |  |
|  +------------------------------------+  |
|  |  [Compare] [Cancel]               |  |
|  +------------------------------------+  |
+------------------------------------------+
```

### Step 3: Comparison View
After clicking "Compare", a new view appears showing:

1. **Side-by-Side Calendar View**
   - Primary range calendar
   - Comparison range calendar
   - Highlighted matching dates
   - Pattern indicators

2. **Metrics Comparison Panel**
   ```
   +------------------------------------------+
   |  Comparison Results                      |
   |  +------------------------------------+  |
   |  |  Dream Frequency                   |  |
   |  |  Primary: 15 dreams                |  |
   |  |  Comparison: 12 dreams             |  |
   |  +------------------------------------+  |
   |  |  Average Length                    |  |
   |  |  Primary: 450 words                |  |
   |  |  Comparison: 380 words             |  |
   |  +------------------------------------+  |
   |  |  Common Themes                     |  |
   |  |  • Flying (80% vs 60%)            |  |
   |  |  • Water (40% vs 35%)             |  |
   |  +------------------------------------+  |
   |  |  [Export] [New Comparison]        |  |
   |  +------------------------------------+  |
   +------------------------------------------+
   ```

3. **Pattern Analysis**
   - Recurring themes
   - Emotional patterns
   - Temporal patterns
   - Statistical significance

### Step 4: Interaction Options
1. **Modify Ranges**
   - Adjust either range
   - See live updates to comparison
   - Save ranges as favorites

2. **Analysis Tools**
   - Toggle different metrics
   - Filter by specific themes
   - Adjust visualization

3. **Export Options**
   - Export comparison data
   - Generate report
   - Save as favorite comparison

### Step 5: Navigation
- Back button to return to filter setup
- New Comparison button to start fresh
- Export button to save results
- Close button to return to main view

### Mobile Considerations
- Stacked layout for small screens
- Swipe navigation between views
- Collapsible sections
- Touch-optimized controls
- Simplified metrics display

### Accessibility Features
- Keyboard navigation
- Screen reader support
- High contrast mode
- Reduced motion
- Clear focus indicators

---

## Testing
- Manual testing checklist:
  - Button appears and is clickable.
  - Modal opens and closes as expected.
  - Table updates correctly for custom and dropdown ranges.
  - Accessibility features work (keyboard, screen reader).
  - Focus is returned to the button after modal closes.
  - Error handling for invalid or out-of-range dates.
  - Test with different date formats and locales (if supported).
  - Test persistence and clearing of custom range selection.
  - Test responsiveness on different screen sizes (desktop, tablet, mobile).
- (Optional) Automated tests for modal logic and filtering.
- Test with various themes and in both light/dark modes.
- Test with screen readers (NVDA, VoiceOver, etc.).
- Test ESC, Tab, and arrow key navigation.

---

## Future Enhancements
- Persist custom ranges between sessions.
- Allow saving favorite custom ranges.
- Additional accessibility or UX improvements.

## Phase 1 Completion (May 2025)
- Phase 1 of the Filters Expansion is complete:
  - Custom Date Filter modal for selecting start/end dates
  - Favorites system: save, select, and delete custom date ranges
  - UI/UX improvements: visual hierarchy, compact favorites list, Lucide icons, improved modal layout, and button prominence
  - Accessibility and keyboard navigation improvements
  - Responsive modal width and layout
- See CHANGELOG.md for details.

## Phase 2 (Planned Future Enhancements)
- User-defined custom presets in the dropdown
- Calendar improvements (multi-month view, week numbers, preview optimization)
- Further UI/UX polish (favorites editing, tooltips, empty state, etc.)
- Additional accessibility enhancements
- Advanced filtering and analytics features

---

## Changelog
- (Track major changes to the plan or implementation here.)

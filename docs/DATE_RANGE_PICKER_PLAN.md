# Table Custom Date Range Picker Planning Document

## 1. Goals & Requirements
- Integrate a custom date range picker (using Flatpickr or similar) for filtering the metrics table.
- Ensure full accessibility (keyboard navigation, ARIA, ESC to close, screen reader support).
- Responsive design for mobile, tablet, and desktop.
- Seamless integration with existing table filtering logic.
- Theming and style compatibility with Obsidian and plugin UI.

## 2. User Experience Flow
- User clicks the "Custom Range" button next to the date filter dropdown.
- Flatpickr calendar widget appears as a popup overlay (not inline, does not push table down).
- User selects a start and end date (or a single day).
- User can navigate the calendar with keyboard (Tab, arrows, Enter, ESC to close).
- On selection, the table is filtered to show only entries within the selected range.
- User can close the picker by pressing ESC or clicking outside.

## 3. Technical Design
- Use Flatpickr in "range" mode for start/end date selection.
- Configure Flatpickr for accessibility (focus trap, ARIA attributes).
- Attach Flatpickr to a hidden input or trigger from the "Custom Range" button.
- On date selection, update plugin state and re-filter the table.
- Ensure Flatpickr popup is styled to match plugin/Obsidian theme.
- Clean up Flatpickr instance on close to avoid memory leaks.

### State Management Implementation

```typescript
interface DateRangePickerState {
  // Date selection state
  selectedRange: {
    start: Date | null;
    end: Date | null;
  };
  
  // View state
  currentView: {
    month: number;
    year: number;
    viewMode: 'month' | 'week';
  };
  
  // UI state
  isOpen: boolean;
  isDragging: boolean;
  isYearPickerOpen: boolean;
  
  // Theme state
  currentTheme: string;
  isDarkMode: boolean;
  
  // Filter integration
  filterState: {
    isActive: boolean;
    lastPreset: string | null;
  };
}

class DateRangePickerStateManager {
  private state: DateRangePickerState;
  private listeners: Set<(state: DateRangePickerState) => void>;
  
  constructor() {
    this.state = this.getInitialState();
    this.listeners = new Set();
  }
  
  private getInitialState(): DateRangePickerState {
    return {
      selectedRange: {
        start: null,
        end: null
      },
      currentView: {
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        viewMode: 'month'
      },
      isOpen: false,
      isDragging: false,
      isYearPickerOpen: false,
      currentTheme: document.body.getAttribute('data-theme') || 'default',
      isDarkMode: document.body.classList.contains('theme-dark'),
      filterState: {
        isActive: false,
        lastPreset: null
      }
    };
  }
  
  // State updates
  public updateSelectedRange(start: Date | null, end: Date | null) {
    this.state.selectedRange = { start, end };
    this.notifyListeners();
  }
  
  public updateView(month: number, year: number, viewMode: 'month' | 'week') {
    this.state.currentView = { month, year, viewMode };
    this.notifyListeners();
  }
  
  public setOpen(isOpen: boolean) {
    this.state.isOpen = isOpen;
    this.notifyListeners();
  }
  
  // Filter integration
  public updateFilterState(isActive: boolean, lastPreset: string | null) {
    this.state.filterState = { isActive, lastPreset };
    this.notifyListeners();
  }
  
  // Theme handling
  public updateTheme(theme: string, isDarkMode: boolean) {
    this.state.currentTheme = theme;
    this.state.isDarkMode = isDarkMode;
    this.notifyListeners();
  }
  
  // State persistence
  public saveState() {
    localStorage.setItem('oom-date-picker-state', JSON.stringify(this.state));
  }
  
  public loadState() {
    const saved = localStorage.getItem('oom-date-picker-state');
    if (saved) {
      this.state = { ...this.getInitialState(), ...JSON.parse(saved) };
      this.notifyListeners();
    }
  }
  
  // Event handling
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }
  
  public subscribe(listener: (state: DateRangePickerState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
```

#### State Management Features
- **Date Selection State**
  - Track selected date range
  - Handle range validation
  - Persist selection across sessions
  - Clear selection functionality

- **View State**
  - Current month/year
  - View mode (month/week)
  - Calendar navigation history
  - View mode persistence

- **UI State**
  - Picker open/closed
  - Dragging state
  - Year picker visibility
  - Loading states

- **Theme State**
  - Current theme
  - Dark/light mode
  - Theme change detection
  - Theme persistence

- **Filter Integration**
  - Active filter state
  - Last used preset
  - Filter history
  - Clear filter functionality

- **State Persistence**
  - Local storage integration
  - State restoration
  - State migration
  - State cleanup

### Mobile Responsiveness Implementation

```css
/* Base mobile styles */
.oom-date-picker {
  /* Default styles */
}

/* Mobile breakpoint */
@media screen and (max-width: var(--oom-breakpoint-mobile)) {
  .oom-date-picker {
    width: 100%;
    max-width: 100vw;
    margin: 0;
    border-radius: 0;
  }

  .oom-date-picker__calendar {
    width: 100%;
    padding: var(--oom-spacing-xs);
  }

  .oom-date-picker__day {
    min-width: 44px;
    min-height: 44px;
    font-size: var(--oom-font-size-mobile);
  }

  .oom-date-picker__controls {
    flex-direction: column;
    gap: var(--oom-spacing-xs);
    padding: var(--oom-spacing-xs);
  }

  .oom-date-picker__button {
    width: 100%;
    min-height: 44px;
    padding: var(--oom-spacing-sm);
  }
}

/* Touch device optimizations */
@media (hover: none) {
  .oom-date-picker__day {
    /* Larger touch targets */
    min-width: 48px;
    min-height: 48px;
  }

  .oom-date-picker__day--selected {
    /* Enhanced touch feedback */
    transform: scale(0.95);
  }

  .oom-date-picker__controls {
    /* Prevent accidental touches */
    padding: var(--oom-spacing-sm);
  }
}

/* Keyboard visible on mobile */
@media screen and (max-height: 400px) {
  .oom-date-picker {
    max-height: 100vh;
    overflow-y: auto;
  }

  .oom-date-picker__calendar {
    /* Compact layout when keyboard is visible */
    padding: var(--oom-spacing-xs);
  }
}
```

#### Mobile-Specific Features
- **Touch Gestures**
  - **Month Navigation**
    - Swipe left/right to change months
    - Velocity-based animation
    - Haptic feedback on month change
    - Visual indicator for swipe direction
    - Snap to month on release

  - **Year Selection**
    - Long press (500ms) on month/year header
    - Year picker appears as overlay
    - Swipe up/down to scroll years
    - Tap to select year
    - Haptic feedback on selection

  - **Date Range Selection**
    - Double tap to start range selection
    - Drag to extend range
    - Visual feedback during drag
    - Haptic feedback on range completion
    - Tap outside to cancel

  - **Calendar Navigation**
    - Pinch to zoom between month/week view
    - Two-finger swipe for quick year navigation
    - Three-finger tap to reset view
    - Edge swipe to show/hide controls

  - **Gesture Implementation**
    ```typescript
    class DateRangePickerGestures {
      private touchStartX: number;
      private touchStartY: number;
      private currentMonth: number;
      
      // Month navigation
      private handleSwipe(e: TouchEvent) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        
        if (Math.abs(deltaX) > 50) { // Threshold
          if (deltaX > 0) {
            this.previousMonth();
          } else {
            this.nextMonth();
          }
          this.triggerHapticFeedback();
        }
      }

      // Year selection
      private handleLongPress(e: TouchEvent) {
        const touch = e.touches[0];
        const target = e.target as HTMLElement;
        
        if (target.classList.contains('oom-date-picker__header')) {
          this.showYearPicker();
          this.triggerHapticFeedback();
        }
      }

      // Range selection
      private handleRangeSelection(e: TouchEvent) {
        const touch = e.touches[0];
        const date = this.getDateFromTouch(touch);
        
        if (this.isRangeStart) {
          this.extendRange(date);
          this.triggerHapticFeedback();
        }
      }
    }
    ```

  - **Gesture Feedback**
    - Visual feedback during gestures
    - Haptic feedback on important actions
    - Audio feedback (optional, configurable)
    - Clear visual indicators for gesture state

  - **Gesture Accessibility**
    - Alternative methods for all gestures
    - Clear visual instructions
    - Configurable gesture sensitivity
    - Fallback for unsupported gestures

- **Layout Adaptations**
  - Full-width calendar on mobile
  - Stacked controls for better reachability
  - Optimized spacing for touch
  - Responsive typography

- **Performance Considerations**
  - Debounced touch events
  - Hardware-accelerated animations
  - Efficient DOM updates
  - Memory management for touch handlers

- **Accessibility on Mobile**
  - Maintain keyboard navigation
  - Support for screen readers
  - Clear touch feedback
  - Proper focus management

## 4. Performance Optimizations

### Calendar View Virtualization
- Implement virtualization for calendar view when showing more than 2 months
- Default to showing 2 months at a time for optimal UX
- Lazy-load month data when scrolling
- Add loading indicator for month transitions
- Optimize DOM updates for smooth scrolling

### State Management & Persistence
- Implement compressed state format for date ranges
- Store only essential data:
  - Start/end dates
  - Current view state
  - Active filters
- Add state versioning for future compatibility
- Implement state cleanup for old/invalid ranges
- Use efficient serialization format

### Touch Event Optimization
- Use 150ms debounce for touch events
- Implement gesture cancellation for conflicting gestures
- Add velocity-based gesture recognition
- Include fallback for low-performance devices
- Optimize touch event handlers for performance

### Memory Management
- Clean up event listeners on component unmount
- Implement proper garbage collection for date objects
- Optimize DOM node creation and updates
- Use efficient data structures for date calculations
- Implement proper cleanup for theme change handlers

## 5. Accessibility Checklist
- **Keyboard Navigation**
  - Logical tab order: Trigger button → Calendar → Date cells → Action buttons
  - Arrow keys navigate between dates
  - Enter/Space to select dates
  - ESC to close the picker
  - Focus trap within calendar when open

- **ARIA Attributes**
  - `role="dialog"` for calendar popup
  - `aria-label` for trigger button (e.g., "Choose date range")
  - `aria-expanded` on trigger button
  - `aria-selected` for selected dates
  - `aria-live` region for announcing selections
  - `aria-describedby` for helper text

- **Screen Reader Support**
  - Announce when picker opens
  - Announce selected date range
  - Announce when a date is selected
  - Announce when picker closes
  - Clear labels for all interactive elements

- **Focus Management**
  - Focus returns to trigger button when closing
  - Focus trapped within calendar when open
  - Focus moves to first date cell when opening
  - Focus moves to Apply button after range selection

- **Visual Indicators**
  - Clear focus styles for all interactive elements
  - High contrast for selected dates
  - Clear visual distinction between start and end dates
  - Clear indication of current focus position
  - Multiple visual cues (not just color) for selected dates and ranges
  - Support for high contrast mode
  - Theme-aware styling that adapts to Obsidian's current theme

- **Color Blindness Support**
  - Use patterns or icons in addition to color for selected dates
  - Ensure sufficient contrast ratios for all color combinations
  - Test with color blindness simulators (protanopia, deuteranopia, tritanopia)
  - Support for forced-colors media query
  - Clear visual distinction between interactive and non-interactive elements
  - Alternative indicators for date ranges (e.g., borders, patterns, or icons)

- **Theme Support**
  - **Obsidian Default Theme**
    - Support for both light and dark modes
    - Use Obsidian's CSS variables for colors and styling
    - Match Obsidian's default UI components
    - Respect user's theme preference

  - **Minimal Theme**
    - Support for Minimal's light and dark modes
    - Use Minimal's CSS variables and design patterns
    - Match Minimal's UI component styling
    - Support for Minimal's color schemes

  - **ITS Theme**
    - Support for ITS light and dark modes
    - Use ITS theme variables and styling
    - Match ITS UI component design
    - Support for ITS color schemes

  - **Theme Detection & Adaptation**
    - Detect current theme automatically
    - Apply appropriate styles based on theme
    - Handle theme switching gracefully
    - Fallback styles for unknown themes

  - **Theme Implementation Details**
    ```css
    /* Base styles with our namespace */
    .oom-date-picker {
      --oom-fp-bg: var(--background-primary);
      --oom-fp-text: var(--text-normal);
      --oom-fp-accent: var(--interactive-accent);
      --oom-fp-accent-hover: var(--interactive-accent-hover);
    }

    /* Theme-specific overrides */
    .oom-date-picker.theme-default {
      --oom-fp-bg: var(--background-primary);
      --oom-fp-text: var(--text-normal);
    }

    .oom-date-picker.theme-minimal {
      --oom-fp-bg: var(--minimal-bg);
      --oom-fp-text: var(--minimal-text);
    }

    .oom-date-picker.theme-its {
      --oom-fp-bg: var(--its-bg);
      --oom-fp-text: var(--its-text);
    }

    /* Specific component classes */
    .oom-date-picker__calendar {
      /* Calendar container styles */
    }

    .oom-date-picker__day {
      /* Day cell styles */
    }

    .oom-date-picker__day--selected {
      /* Selected day styles */
    }

    .oom-date-picker__day--in-range {
      /* In-range day styles */
    }

    .oom-date-picker__controls {
      /* Control buttons styles */
    }
    ```

## Expand/Collapse and Sorting Compatibility

### Requirements
- The integration of the custom date range picker must not break or interfere with:
  - The expand/collapse ("Show more") button for dream content
  - Table sorting (if present)

### Safeguards
1. **Event Delegation**
   - Use event delegation for expand/collapse buttons so event listeners remain effective after filtering or re-rendering.
   - Attach listeners to a parent container rather than individual rows.

2. **Preserve Button State**
   - When filtering, hide/show rows instead of removing/recreating them to maintain expand/collapse state.
   - If rows are re-rendered, restore the expanded/collapsed state using a state map or data attributes.

3. **Table Sorting Compatibility**
   - Filtering should operate on the currently sorted data and not reset the sort order.
   - Sorting logic should be independent of filtering logic.
   - After filtering, do not re-sort unless explicitly requested by the user.

4. **Testing Checklist**
   - Test expand/collapse before and after filtering.
   - Test sorting before and after filtering.
   - Test expand/collapse after sorting and filtering in any order.

### Implementation Notes
- Ensure that any DOM updates for filtering do not remove or replace interactive elements unnecessarily.
- Maintain a clear separation of concerns between filtering, sorting, and expand/collapse logic.
- Document any edge cases or known limitations during development and testing.

## User Experience Enhancements

### Quick Selection Presets
- **Common Ranges**
  - Last 7 days
  - Last 30 days
  - This month
  - Last month
  - This year
  - Last year
  - Custom range (opens picker)

- **Preset Implementation**
  ```typescript
  interface DateRangePreset {
    label: string;
    getRange: () => { start: Date; end: Date };
    icon?: string;  // Lucide icon name
  }

  const dateRangePresets: DateRangePreset[] = [
    {
      label: "Last 7 days",
      getRange: () => ({
        start: subDays(new Date(), 7),
        end: new Date()
      }),
      icon: "calendar-days"
    },
    // ... other presets
  ];
  ```

### Mini Calendar Preview
- Show a small calendar preview in the filter dropdown
- Highlight current date range
- Allow quick month navigation
- Provide visual feedback for hovered dates
- Maintain theme consistency

#### Mini Calendar Implementation
```typescript
interface MiniCalendarProps {
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  onMonthChange: (date: Date) => void;
  currentMonth: Date;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedRange,
  onRangeChange,
  onMonthChange,
  currentMonth
}) => {
  // Calendar grid layout
  const calendarGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
    padding: '8px',
    width: '280px'
  };

  // Day cell styling
  const dayCell = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    cursor: 'pointer',
    position: 'relative' as const,
    '&:hover': {
      backgroundColor: 'var(--interactive-hover)'
    }
  };

  // Range selection styling
  const rangeSelection = {
    '&.in-range': {
      backgroundColor: 'var(--interactive-accent-hover)',
      borderRadius: '0',
      '&:first-of-type': {
        borderTopLeftRadius: '16px',
        borderBottomLeftRadius: '16px'
      },
      '&:last-of-type': {
        borderTopRightRadius: '16px',
        borderBottomRightRadius: '16px'
      }
    },
    '&.range-start, &.range-end': {
      backgroundColor: 'var(--interactive-accent)',
      color: 'var(--text-on-accent)',
      '&:hover': {
        backgroundColor: 'var(--interactive-accent-hover)'
      }
    }
  };

  return (
    <div className="oom-mini-calendar">
      {/* Month navigation header */}
      <div className="oom-mini-calendar__header">
        <button onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
          <LucideIcon name="chevron-left" />
        </button>
        <span>{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
          <LucideIcon name="chevron-right" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="oom-mini-calendar__weekdays">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="oom-mini-calendar__weekday">{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="oom-mini-calendar__grid">
        {getDaysInMonth(currentMonth).map((date, index) => (
          <div
            key={index}
            className={clsx(
              'oom-mini-calendar__day',
              isSameDay(date, selectedRange.start) && 'range-start',
              isSameDay(date, selectedRange.end) && 'range-end',
              isWithinRange(date, selectedRange) && 'in-range'
            )}
            onClick={() => handleDateClick(date)}
          >
            {format(date, 'd')}
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### CSS Implementation
```css
.oom-mini-calendar {
  --oom-calendar-size: 280px;
  --oom-day-size: 32px;
  --oom-calendar-padding: 8px;
  --oom-calendar-gap: 2px;
  
  width: var(--oom-calendar-size);
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-s);
}

.oom-mini-calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--oom-calendar-padding);
  border-bottom: 1px solid var(--background-modifier-border);
}

.oom-mini-calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--oom-calendar-gap);
  padding: var(--oom-calendar-padding);
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.oom-mini-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--oom-calendar-gap);
  padding: var(--oom-calendar-padding);
}

.oom-mini-calendar__day {
  width: var(--oom-day-size);
  height: var(--oom-day-size);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  font-size: var(--font-sm);
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--interactive-hover);
  }
  
  &.in-range {
    background: var(--interactive-accent-hover);
    border-radius: 0;
    
    &:first-of-type {
      border-top-left-radius: 16px;
      border-bottom-left-radius: 16px;
    }
    
    &:last-of-type {
      border-top-right-radius: 16px;
      border-bottom-right-radius: 16px;
    }
  }
  
  &.range-start,
  &.range-end {
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    
    &:hover {
      background: var(--interactive-accent-hover);
    }
  }
}
```

#### Integration with Filter Dropdown
```typescript
const DateRangeFilter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>({
    start: null,
    end: null
  });

  return (
    <div className="oom-date-filter">
      <button 
        className="oom-date-filter__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <LucideIcon name="calendar" />
        <span>
          {selectedRange.start && selectedRange.end
            ? `${format(selectedRange.start, 'MMM d')} - ${format(selectedRange.end, 'MMM d')}`
            : 'Select date range'}
        </span>
        <LucideIcon name={isOpen ? 'chevron-up' : 'chevron-down'} />
      </button>

      {isOpen && (
        <div className="oom-date-filter__dropdown">
          {/* Quick selection presets */}
          <div className="oom-date-filter__presets">
            {dateRangePresets.map(preset => (
              <button
                key={preset.label}
                onClick={() => setSelectedRange(preset.getRange())}
              >
                <LucideIcon name={preset.icon} />
                {preset.label}
              </button>
            ))}
          </div>

          {/* Mini calendar */}
          <MiniCalendar
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            onMonthChange={setCurrentMonth}
            currentMonth={currentMonth}
          />

          {/* Action buttons */}
          <div className="oom-date-filter__actions">
            <button onClick={() => setSelectedRange({ start: null, end: null })}>
              Clear
            </button>
            <button onClick={() => setIsOpen(false)}>
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

### Enhanced Styling Details
```css
/* Dropdown and Presets Styling */
.oom-date-filter {
  position: relative;
  display: inline-block;
}

.oom-date-filter__trigger {
  display: flex;
  align-items: center;
  gap: var(--size-2-2);
  padding: var(--size-2-2) var(--size-2-3);
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-s);
  color: var(--text-normal);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--background-primary-alt);
    border-color: var(--interactive-accent);
  }
  
  &:focus-visible {
    outline: 2px solid var(--interactive-accent);
    outline-offset: 2px;
  }
}

.oom-date-filter__dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--size-2-2);
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-m);
  box-shadow: var(--shadow-l);
  z-index: var(--layer-popover);
  min-width: 320px;
  animation: oom-dropdown-enter 0.2s ease;
}

.oom-date-filter__presets {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--size-2-2);
  padding: var(--size-2-2);
  border-bottom: 1px solid var(--background-modifier-border);
  
  button {
    display: flex;
    align-items: center;
    gap: var(--size-2-2);
    padding: var(--size-2-2);
    background: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    color: var(--text-normal);
    font-size: var(--font-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--background-primary-alt);
      border-color: var(--interactive-accent);
    }
    
    &:focus-visible {
      outline: 2px solid var(--interactive-accent);
      outline-offset: 2px;
    }
  }
}

.oom-date-filter__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--size-2-2);
  padding: var(--size-2-2);
  border-top: 1px solid var(--background-modifier-border);
  
  button {
    padding: var(--size-2-2) var(--size-2-3);
    border-radius: var(--radius-s);
    font-size: var(--font-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &[data-action="clear"] {
      background: var(--background-primary);
      border: 1px solid var(--background-modifier-border);
      color: var(--text-normal);
      
      &:hover {
        background: var(--background-primary-alt);
        border-color: var(--text-error);
        color: var(--text-error);
      }
    }
    
    &[data-action="apply"] {
      background: var(--interactive-accent);
      border: 1px solid var(--interactive-accent);
      color: var(--text-on-accent);
      
      &:hover {
        background: var(--interactive-accent-hover);
        border-color: var(--interactive-accent-hover);
      }
    }
  }
}

@keyframes oom-dropdown-enter {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Enhanced Accessibility Features
```typescript
// Additional ARIA attributes and roles
const DateRangeFilter: React.FC = () => {
  // ... existing state ...

  return (
    <div 
      className="oom-date-filter"
      role="combobox"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-controls="date-range-picker"
    >
      <button 
        className="oom-date-filter__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Select date range"
        aria-describedby="date-range-description"
      >
        {/* ... existing button content ... */}
      </button>

      {isOpen && (
        <div 
          id="date-range-picker"
          className="oom-date-filter__dropdown"
          role="dialog"
          aria-label="Date range picker"
          aria-modal="true"
        >
          <div 
            id="date-range-description"
            className="oom-date-filter__description"
            aria-live="polite"
          >
            {selectedRange.start && selectedRange.end
              ? `Selected range: ${format(selectedRange.start, 'MMMM d, yyyy')} to ${format(selectedRange.end, 'MMMM d, yyyy')}`
              : 'No date range selected'}
          </div>

          <div 
            className="oom-date-filter__presets"
            role="group"
            aria-label="Quick selection presets"
          >
            {dateRangePresets.map(preset => (
              <button
                key={preset.label}
                onClick={() => setSelectedRange(preset.getRange())}
                aria-label={`Select ${preset.label}`}
              >
                <LucideIcon name={preset.icon} aria-hidden="true" />
                {preset.label}
              </button>
            ))}
          </div>

          <MiniCalendar
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
            onMonthChange={setCurrentMonth}
            currentMonth={currentMonth}
            aria-label="Calendar"
          />

          <div 
            className="oom-date-filter__actions"
            role="group"
            aria-label="Date range actions"
          >
            <button 
              onClick={() => setSelectedRange({ start: null, end: null })}
              data-action="clear"
              aria-label="Clear date range"
            >
              Clear
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              data-action="apply"
              aria-label="Apply date range"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

#### Enhanced Range Selection Interactions
```typescript
interface RangeSelectionState {
  isSelecting: boolean;
  startDate: Date | null;
  endDate: Date | null;
  hoverDate: Date | null;
}

const useRangeSelection = () => {
  const [state, setState] = useState<RangeSelectionState>({
    isSelecting: false,
    startDate: null,
    endDate: null,
    hoverDate: null
  });

  const handleDateMouseEnter = (date: Date) => {
    if (state.isSelecting && state.startDate) {
      setState(prev => ({ ...prev, hoverDate: date }));
    }
  };

  const handleDateMouseLeave = () => {
    if (state.isSelecting) {
      setState(prev => ({ ...prev, hoverDate: null }));
    }
  };

  const handleDateClick = (date: Date) => {
    if (!state.isSelecting) {
      // Start new selection
      setState({
        isSelecting: true,
        startDate: date,
        endDate: null,
        hoverDate: null
      });
    } else if (state.startDate) {
      // Complete selection
      const [start, end] = [state.startDate, date].sort((a, b) => a.getTime() - b.getTime());
      setState({
        isSelecting: false,
        startDate: start,
        endDate: end,
        hoverDate: null
      });
      return { start, end };
    }
  };

  const getPreviewRange = () => {
    if (!state.isSelecting || !state.startDate || !state.hoverDate) {
      return null;
    }
    const [start, end] = [state.startDate, state.hoverDate].sort((a, b) => a.getTime() - b.getTime());
    return { start, end };
  };

  return {
    state,
    handleDateMouseEnter,
    handleDateMouseLeave,
    handleDateClick,
    getPreviewRange
  };
};

// Usage in MiniCalendar component
const MiniCalendar: React.FC<MiniCalendarProps> = (props) => {
  const {
    state,
    handleDateMouseEnter,
    handleDateMouseLeave,
    handleDateClick,
    getPreviewRange
  } = useRangeSelection();

  const previewRange = getPreviewRange();
  const displayRange = previewRange || props.selectedRange;

  return (
    <div className="oom-mini-calendar">
      {/* ... existing calendar header and weekdays ... */}
      
      <div className="oom-mini-calendar__grid">
        {getDaysInMonth(props.currentMonth).map((date, index) => {
          const isInPreviewRange = previewRange && isWithinRange(date, previewRange);
          const isInSelectedRange = !previewRange && isWithinRange(date, props.selectedRange);
          
          return (
            <div
              key={index}
              className={clsx(
                'oom-mini-calendar__day',
                isSameDay(date, displayRange.start) && 'range-start',
                isSameDay(date, displayRange.end) && 'range-end',
                (isInPreviewRange || isInSelectedRange) && 'in-range'
              )}
              onClick={() => handleDateClick(date)}
              onMouseEnter={() => handleDateMouseEnter(date)}
              onMouseLeave={handleDateMouseLeave}
              role="button"
              tabIndex={0}
              aria-selected={isInPreviewRange || isInSelectedRange}
              aria-label={format(date, 'MMMM d, yyyy')}
            >
              {format(date, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

## Testing & QA Strategy

### Unit Testing
```typescript
describe('DateRangePicker', () => {
  describe('Range Selection', () => {
    it('should handle single date selection', () => {
      // Test implementation
    });

    it('should handle date range selection', () => {
      // Test implementation
    });

    it('should sort dates correctly', () => {
      // Test implementation
    });

    it('should handle invalid date ranges', () => {
      // Test implementation
    });
  });

  describe('State Management', () => {
    it('should persist state correctly', () => {
      // Test implementation
    });

    it('should restore state on reload', () => {
      // Test implementation
    });

    it('should handle theme changes', () => {
      // Test implementation
    });
  });

  describe('Accessibility', () => {
    it('should maintain focus trap', () => {
      // Test implementation
    });

    it('should announce selections', () => {
      // Test implementation
    });

    it('should handle keyboard navigation', () => {
      // Test implementation
    });
  });
});
```

### Integration Testing
- **Table Integration**
  - Test filtering with existing table
  - Verify sorting compatibility
  - Check expand/collapse functionality
  - Validate state persistence

- **Theme Integration**
  - Test with Obsidian default theme
  - Test with Minimal theme
  - Test with ITS theme
  - Verify dark/light mode switching

- **Mobile Integration**
  - Test touch interactions
  - Verify responsive layout
  - Check keyboard handling
  - Test screen reader support

### Performance Testing
- **Load Testing**
  - Test with large date ranges
  - Verify memory usage
  - Check render performance
  - Monitor state updates

- **Interaction Testing**
  - Test rapid date selection
  - Verify animation performance
  - Check touch response time
  - Monitor DOM updates

### Accessibility Testing
- **Screen Reader Testing**
  - Test with NVDA
  - Test with VoiceOver
  - Test with JAWS
  - Verify announcements

- **Keyboard Testing**
  - Test tab navigation
  - Test arrow key navigation
  - Test keyboard shortcuts
  - Verify focus management

- **Visual Testing**
  - Test high contrast mode
  - Test color blindness modes
  - Verify focus indicators
  - Check text contrast

### Mobile Testing
- **Device Testing**
  - Test on iOS devices
  - Test on Android devices
  - Test on tablets
  - Test on different screen sizes

- **Touch Testing**
  - Test swipe gestures
  - Test long press
  - Test double tap
  - Test pinch zoom

### Cross-browser Testing
- **Browser Compatibility**
  - Test on Chrome
  - Test on Firefox
  - Test on Safari
  - Test on Edge

### Test Automation
```typescript
// Jest configuration
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// Playwright configuration
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Chrome',
      use: { browserName: 'chromium' },
    },
    {
      name: 'Firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'Safari',
      use: { browserName: 'webkit' },
    },
  ],
};

export default config;
```

### Test Coverage Requirements
- **Unit Tests**: 80% coverage
- **Integration Tests**: Key user flows
- **Accessibility Tests**: WCAG 2.1 AA compliance
- **Performance Tests**: < 100ms interaction time
- **Mobile Tests**: All touch gestures
- **Cross-browser Tests**: Latest 2 versions

### Testing Tools
- **Unit Testing**
  - Use Obsidian's built-in testing framework
  - Test utility functions in isolation
  - Test date range calculations
  - Test state management logic

- **Integration Testing**
  - Manual testing in Obsidian
  - Test with different Obsidian versions
  - Test with different vault sizes
  - Test with different theme settings

- **Accessibility Testing**
  - Manual testing with screen readers
  - Test keyboard navigation
  - Test with Obsidian's theme system
  - Verify ARIA attributes

- **Performance Testing**
  - Use Obsidian's performance monitoring
  - Test with large vaults
  - Monitor memory usage within Obsidian
  - Test with different date range sizes

- **Visual Testing**
  - Test with Obsidian's theme system
  - Verify compatibility with popular themes
  - Test in both light and dark modes
  - Test with different font sizes

### Testing Environment Setup
- **Development Vault**
  - Create a dedicated test vault
  - Include sample dream entries
  - Set up different theme configurations
  - Configure test data with various date ranges

- **Testing Workflow**
  1. Enable developer mode in Obsidian
  2. Load plugin in test vault
  3. Use hot reload for quick testing
  4. Test with different Obsidian versions
  5. Test with different theme settings
  6. Monitor performance in DevTools

- **Test Data Preparation**
  - Create sample dream entries
  - Set up various date ranges
  - Include edge cases
  - Prepare different theme configurations

### Test Documentation
- **Test Cases**
  - Document all test scenarios
  - Include setup instructions
  - Document expected results
  - Include edge cases

- **Test Reports**
  - Generate coverage reports
  - Document test results
  - Track performance metrics
  - Monitor accessibility scores

### Continuous Integration
- **GitHub Actions**
  ```yaml
  name: Test
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - uses: actions/setup-node@v2
          with:
            node-version: '16'
        - run: npm ci
        - name: Run unit tests
          run: npm test
        - name: Build plugin
          run: npm run build
        - name: Verify build
          run: |
            if [ ! -f "main.js" ]; then
              echo "Build failed: main.js not found"
              exit 1
            fi
        - name: Check for common issues
          run: |
            # Check for console.log statements
            if grep -r "console.log" src/; then
              echo "Found console.log statements in source code"
              exit 1
            fi
            # Check for TODO comments
            if grep -r "TODO" src/; then
              echo "Found TODO comments in source code"
              exit 1
            fi
        - name: Verify manifest
          run: |
            if [ ! -f "manifest.json" ]; then
              echo "manifest.json not found"
              exit 1
            fi
            # Verify manifest structure
            node -e "
              const manifest = require('./manifest.json');
              const required = ['id', 'name', 'version', 'minAppVersion', 'description'];
              const missing = required.filter(field => !manifest[field]);
              if (missing.length > 0) {
                console.error('Missing required fields in manifest:', missing);
                process.exit(1);
              }
            "
        - name: Check dependencies
          run: |
            # Verify all dependencies are compatible with Obsidian
            node -e "
              const pkg = require('./package.json');
              const obsidianVersion = pkg.dependencies.obsidian;
              if (!obsidianVersion) {
                console.error('obsidian dependency not found');
                process.exit(1);
              }
            "

    lint:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - uses: actions/setup-node@v2
          with:
            node-version: '16'
        - run: npm ci
        - name: Run ESLint
          run: npm run lint
        - name: Check TypeScript
          run: npm run type-check

    release:
      needs: [test, lint]
      if: startsWith(github.ref, 'refs/tags/')
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - uses: actions/setup-node@v2
          with:
            node-version: '16'
        - run: npm ci
        - name: Create release
          run: |
            # Create release zip
            zip -r release.zip main.js manifest.json styles.css
            # Upload release
            gh release create ${GITHUB_REF#refs/tags/} release.zip
```

### Local Testing Environment
- **Development Setup**
  - Local Obsidian vault for testing
  - Hot reload enabled
  - Debug logging enabled
  - Test data prepared

- **Testing Workflow**
  1. Run unit tests locally
  2. Build plugin
  3. Load in test vault
  4. Manual testing
  5. Performance monitoring
  6. Theme compatibility checks

- **Test Data**
  - Sample dream entries
  - Various date ranges
  - Different theme configurations
  - Edge cases and error conditions

### Release Testing
- **Pre-release Checklist**
  - All tests passing
  - No console.log statements
  - No TODO comments
  - Manifest validated
  - Dependencies checked
  - Build verified
  - Performance tested
  - Accessibility verified

- **Release Process**
  1. Update version numbers
  2. Update changelog
  3. Create release branch
  4. Run full test suite
  5. Build release package
  6. Test in clean vault
  7. Create GitHub release
  8. Update documentation

### Performance Budgets
- **Load Time**: < 2s
- **Time to Interactive**: < 3s
- **First Input Delay**: < 100ms
- **Cumulative Layout Shift**: < 0.1
- **Memory Usage**: < 50MB
- **Animation Frame Rate**: 60fps

### Accessibility Requirements
- **WCAG 2.1 AA Compliance**
  - Keyboard navigation
  - Screen reader support
  - Color contrast
  - Focus management
  - ARIA attributes
  - Error handling

### Mobile Requirements
- **Touch Targets**: > 44x44px
- **Response Time**: < 100ms
- **Gesture Support**: All planned gestures
- **Orientation Support**: Both portrait and landscape
- **Keyboard Support**: Virtual keyboard handling
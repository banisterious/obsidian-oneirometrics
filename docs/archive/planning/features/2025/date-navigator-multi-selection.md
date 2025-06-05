# Date Navigator Multi-Selection Plan

> **📁 ARCHIVED DOCUMENT** ✅  
> **Date Archived**: January 2025  
> **Status**: Implementation completed successfully - **EXCEEDED EXPECTATIONS**  
> **Outcome**: Multi-selection, range selection, and advanced UI controls fully implemented in DateSelectionModal  
> **Location**: `src/dom/modals/DateSelectionModal.ts`  
> **Key Features Delivered**: Multi-select mode, range mode, Ctrl/Cmd+click support, visual indicators, year/month navigation, text input controls, and robust filter integration

## Overview

This document outlines the planned implementation for multi-date selection in the Date Navigator feature. The current implementation allows only single-date selection, but future versions will expand this to support:

1. Multiple individual date selections
2. Date range selections
3. Multi-month selections

These enhancements will improve the filtering capabilities for dream journal analysis.

## Current Implementation

The current Date Navigator allows:
- Single date selection
- Toggling selection on/off
- Explicit filter application via the Apply Filter button

The Apply Filter button was specifically added with multi-selection in mind, creating a clear separation between selection and filter application.

## Known Issues

### Opening Outside of Metrics Note

Currently, the Date Navigator can be opened when not viewing a Metrics note, which may lead to confusion as applied filters would have no visible effect. Potential solutions include:

1. **Context Awareness**: Only enable the command when a Metrics note is active
2. **User Warning**: Show a warning/notice when opened outside a Metrics note context
3. **Auto-Navigation**: Automatically open the most recent Metrics note when the navigator is opened
4. **Standalone Mode**: Create a view-only mode that doesn't modify filters but allows date browsing

This issue will be addressed in a future update.

## Planned Selection Types

### 1. Multiple Individual Dates

Users will be able to select multiple non-consecutive dates:

```typescript
// Planned implementation for multiple day selection
private selectedDays: Set<string> = new Set(); // Using formatted date strings

public selectDay(date: Date): void {
    const dateKey = this.formatDateKey(date);
    
    if (this.selectedDays.has(dateKey)) {
        // Deselect if already selected
        this.selectedDays.delete(dateKey);
    } else {
        // Add new selection
        this.selectedDays.add(dateKey);
    }
    
    this.updateMonthGrid();
}

public getSelectedDays(): Date[] {
    return Array.from(this.selectedDays).map(key => this.parseDateKey(key)).filter(Boolean) as Date[];
}
```

### 2. Date Range Selection

Users will be able to select a range of dates using Shift+click or drag:

```typescript
// Planned implementation for range selection
private rangeStartDate: Date | null = null;

public startRangeSelection(date: Date): void {
    this.rangeStartDate = date;
    this.selectedDays.clear();
    this.selectedDays.add(this.formatDateKey(date));
    this.updateMonthGrid();
}

public completeRangeSelection(endDate: Date): void {
    if (!this.rangeStartDate) return;
    
    // Get all dates in range
    const datesInRange = this.getDatesInRange(this.rangeStartDate, endDate);
    
    // Add all to selection
    datesInRange.forEach(date => {
        this.selectedDays.add(this.formatDateKey(date));
    });
    
    this.rangeStartDate = null;
    this.updateMonthGrid();
}
```

### 3. Month Selection

Users will be able to select an entire month at once:

```typescript
// Planned implementation for month selection
public selectEntireMonth(month: Date): void {
    const firstDay = startOfMonth(month);
    const lastDay = endOfMonth(month);
    
    // Get all dates in month
    const datesInMonth = this.getDatesInRange(firstDay, lastDay);
    
    // Clear existing selection
    this.selectedDays.clear();
    
    // Add all month dates to selection
    datesInMonth.forEach(date => {
        this.selectedDays.add(this.formatDateKey(date));
    });
    
    this.updateMonthGrid();
}
```

## UI Changes Needed

To support multi-selection, the UI will need the following changes:

1. **Visual Indicators**
   - Different style for individually selected days
   - Visual connection between days in a range
   - Clear indication of selection mode (individual vs. range)

2. **Selection Controls**
   - Mode toggle (single/multiple/range)
   - Select All/None buttons
   - Selection count indicator

3. **Enhanced Filter Application**
   - Apply Filter button stays as the primary action
   - Filter display showing selection count
   - Option to save selections as named filters

4. **Keyboard Support**
   - Shift+Click for ranges
   - Ctrl/Command+Click for individual additions
   - Arrow keys for navigation
   - Space to toggle selection

## Filter Integration

The TimeFilterManager will need to be enhanced to support non-consecutive date selections:

```typescript
// Planned TimeFilterManager enhancements
public setMultipleDates(dates: Date[]): void {
    if (!dates.length) return this.clearFilter();
    
    // Sort dates
    const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());
    
    // Set custom filter
    this.currentFilter = {
        type: 'custom-dates',
        dates: sortedDates,
        description: `${sortedDates.length} selected dates`
    };
    
    // Apply filter
    this.applyFilter();
}
```

## User Experience Flow

1. User opens Date Navigator modal
2. User selects dates using preferred selection method:
   - Click individual dates
   - Shift+click to select range
   - Use month selection button
3. Selection is visually indicated in the calendar
4. User clicks "Apply Filter" to apply the current selection
5. Modal closes and filter is applied to dream journal entries

## Implementation Phases

1. **Phase 1: Multi-Individual Selection**
   - Implement basic multi-selection logic
   - Update UI to show multiple selections
   - Modify Apply button to handle multiple dates

2. **Phase 2: Range Selection**
   - Add shift+click and drag behavior
   - Implement visual range indicators
   - Add keyboard support

3. **Phase 3: Advanced Controls**
   - Add month/year selection
   - Implement selection mode toggles
   - Create saved selection functionality

## Conclusion

The multi-selection capabilities will significantly enhance the Date Navigator's utility for analyzing dream patterns across multiple dates. By implementing the Apply Filter pattern now, we've laid the groundwork for these future enhancements while maintaining a clear and intuitive user experience. 
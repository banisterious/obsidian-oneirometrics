# Date Range Picker Implementation Plan

## Overview
This document outlines the implementation plan for the date range picker functionality in the OneiroMetrics plugin.

## Table of Contents
1. [Core Functionality](#core-functionality)
   - [Data Handling](#data-handling)
   - [User Interface](#user-interface)
   - [Refresh Functionality](#refresh-functionality)
2. [Implementation Notes](#implementation-notes)
   - [Data Handling](#data-handling-1)
   - [User Experience](#user-experience)
   - [Error Handling](#error-handling)

## Core Functionality

### Data Handling

#### Date Format Standardization
- The OneiroMetrics Note will consistently use the format "MM D, YYYY" (e.g., "Jan 6, 2025") in the Date column
- This format will be used for all date storage and data processing
- Users can choose their preferred display format without affecting the underlying data

#### Correction Location
All date corrections are made exclusively to the data stored in the OneiroMetrics Note. The original Selected Notes (source notes being analyzed) remain completely untouched. This is because:

1. The OneiroMetrics Note contains the processed and structured data in table format
2. Corrections are about how we interpret and display the data, not about modifying source material
3. The Selected Notes serve as the source of truth and should remain unchanged

#### Correction Process
When corrections are made:
1. Changes are applied only to the table data in the OneiroMetrics Note
2. The original Selected Notes are not accessed or modified
3. The OneiroMetrics table view automatically updates to reflect the corrections

### User Interface

#### Date Picker Component
- Simple date range selection interface
- Clear display of selected date range
- Option to clear/reset selection
- Display format selector (dropdown with options like MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- Quick filters for common ranges:
  - Today
  - Yesterday
  - This Week
  - Last Week
  - This Month
  - Last Month
- Custom date range management:
  - Save current selection as a custom range
  - List of saved custom ranges
  - Edit/delete saved ranges
  - Persist saved ranges between sessions

#### User Feedback
When corrections are made to the OneiroMetrics Note data, users should be clearly informed that:
1. Changes are only made to the processed data in the OneiroMetrics Note
2. The original Selected Notes remain unchanged
3. They may want to review and correct the dates in their source notes

Example notification:
```
Changes have been applied to the OneiroMetrics Note data.
Note: These changes do not modify your original notes.

Affected source notes:
- Note1.md
- Note2.md

Consider reviewing these notes to correct the original dates.
```

### Refresh Functionality

#### Basic Implementation
```typescript
class DateRangeManager {
  async refreshData() {
    try {
      // Show simple progress indicator
      this.showProgress('Refreshing data...');
      
      // Update data from source notes
      await this.updateMetricsData();
      
      // Update date range picker
      await this.updateDateRangeState();
      
      // Show completion message
      this.showCompletion();
    } catch (error) {
      this.showError('Failed to refresh data');
    }
  }

  private async updateMetricsData() {
    // Update metrics from source notes
    // Preserve any active date range selection
  }

  private async updateDateRangeState() {
    // Update date range picker with new data
    // If current selection becomes invalid:
    // 1. Show warning that no data exists for selected range
    // 2. Offer to adjust to nearest valid range
    // 3. Allow user to clear selection and choose new range
  }
}
```

#### User Interface
The refresh functionality should be accessible through:
1. A "Refresh Data" button in the correction notification
2. A refresh option in the date range picker menu

## Implementation Notes

### Data Handling
- Use Obsidian's API to modify the OneiroMetrics Note content
- Keep changes simple and focused on date data
- Maintain clear separation between processed data and source notes
- Store custom date ranges in plugin settings

### User Experience
- Keep the interface simple and intuitive
- Provide clear feedback about changes
- Make it easy to access affected source notes
- Support multiple date display formats while maintaining consistent storage format
- Persist user preferences for display format and custom ranges

### Error Handling
- Show clear error messages if refresh fails
- Allow users to retry failed operations
- Keep error recovery simple and straightforward
- Handle invalid date ranges gracefully with clear user guidance
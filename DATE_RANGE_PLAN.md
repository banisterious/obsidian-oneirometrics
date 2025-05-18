# Date Range Plan

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

---

## Overview
Enhance the existing date range filtering in OneiroMetrics by adding a "Custom Range" feature, while preserving the current dropdown and table UI.

---

## Current State
- Static HTML/markdown table and dropdown for quick date ranges.
- Filtering logic based on dropdown selection.

---

## Objectives
- Add a "Custom Range" button next to the existing dropdown.
- Open a modal for selecting a custom date range.
- Filter the table dynamically based on the selected custom range.
- Maintain all existing functionality and UX.

---

## Implementation Plan

### UI Changes
- Add a new button: "Custom Range" (or "Select Range") next to the dropdown.
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
- **Error Handling:**
  - Show clear error messages if refresh or filtering fails.
  - Allow users to retry failed operations.
  - Handle invalid date ranges gracefully with clear user guidance.

---

## Accessibility
- Ensure the new button and modal are keyboard accessible.
- Modal should have proper focus management and ARIA labels.
- **User Experience:**
  - Keep the interface simple and intuitive.
  - Provide clear feedback about changes (e.g., notifications when corrections are made).
  - Make it easy to access affected source notes (if relevant).
  - Support multiple date display formats while maintaining consistent storage format.
  - Persist user preferences for display format and custom ranges.

---

## Testing
- **Unit Tests:**
  - Test date format conversions
  - Test date range calculations
  - Test refresh functionality
- **Integration Tests:**
  - Test interaction with existing UI components
  - Test data flow through the system
  - Test error handling scenarios
- **Performance Tests:**
  - Test with large datasets
  - Test refresh operations
  - Test UI responsiveness
- **Manual testing checklist:**
  - Button appears and is clickable.
  - Modal opens and closes as expected.
  - Table updates correctly for custom and dropdown ranges.
  - Accessibility features work (keyboard, screen reader).
- (Optional) Automated tests for modal logic and filtering.

---

## Future Enhancements
- Persist custom ranges between sessions.
- Allow saving favorite custom ranges.
- Additional accessibility or UX improvements.
- **Possible TODO:** Allow user-defined custom presets to appear in the dropdown alongside built-in presets.
- **Risk Assessment & Mitigations:**
  - Data processing: Maintain backward compatibility with existing date formats.
  - UI components: Isolate new features to avoid conflicts.
  - Performance: Implement efficient date range filtering.
  - Data consistency: Use atomic updates for refresh operations.

---

## Changelog
- (Track major changes to the plan or implementation here.) 
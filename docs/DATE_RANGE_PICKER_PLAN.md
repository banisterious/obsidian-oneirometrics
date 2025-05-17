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

## 4. Accessibility Checklist
- Tab order is logical and intuitive.
- All controls are reachable by keyboard.
- ESC closes the picker.
- ARIA attributes are set for calendar and controls.
- Focus returns to the "Custom Range" button after closing.
- Screen reader announces calendar and selected dates.

## 5. Testing Plan
- Manual testing on desktop and mobile (touch and keyboard).
- Automated tests for date selection, filter application, and keyboard navigation.
- Test with various themes and in both light/dark modes.
- Test with screen readers (NVDA, VoiceOver, etc.).
- Test ESC, Tab, and arrow key navigation.

## 6. Open Questions / Decisions
- Should we allow single-day selection as a special case of range (start = end)?
- Should the picker remember the last selected range?
- Should we provide a "Clear" button to reset the filter?
- How should the selected range be displayed in the UI after selection?
- Any additional accessibility or localization needs?

## 7. Open Questions & Edge Cases
- **State Management:**
  - Where and how should the selected date range be stored? (plugin settings, in-memory, etc.)
  - Should the selected range persist across Obsidian restarts or just per session?
  - How should the picker state interact with other filters (e.g., preset dropdown)?
- **UI Feedback & Display:**
  - How should the selected custom range be displayed after selection (label, chip, etc.)?
  - Should there be a visible indicator when a custom range is active?
  - What happens if the user selects a range and then reopens the picker—should it show the previous selection?
- **Edge Cases & Error Handling:**
  - What if the user selects an invalid range (end before start)?
  - How should the UI handle clearing the custom range (reset to "All Time" or previous preset)?
  - What if the user cancels the picker without making a selection?
- **Localization & Formatting:**
  - Should the date format be configurable or locale-aware?
  - How will the picker handle different time zones?
- **Integration with Other Features:**
  - How does the custom range interact with the preset dropdown? (e.g., does selecting a preset clear the custom range?)
  - Should the picker be available in all table contexts (main note, modal, etc.)?
- **Accessibility Enhancements:**
  - Should there be explicit ARIA live region updates when the range changes?
  - How will focus be managed if the user tabs out of the picker?
  - Should there be keyboard shortcuts for quickly opening/closing the picker?
- **Performance Considerations:**
  - Will filtering large datasets by custom range be performant?
  - Should there be a loading indicator if filtering takes noticeable time?
- **Styling & Theming:**
  - Should the Flatpickr popup inherit Obsidian's theme variables (colors, fonts)?
  - How will the picker look in dark mode vs. light mode?
- **Testing & QA:**
  - Should there be automated tests for keyboard navigation and ARIA attributes?
  - How will you test on mobile devices and with screen readers?
- **Documentation & User Guidance:**
  - Should there be a tooltip or help text for the "Custom Range" button?
  - Will you document the feature in the user guide or provide a short in-app explanation?

---

*This document will be updated as design and implementation progress.* 
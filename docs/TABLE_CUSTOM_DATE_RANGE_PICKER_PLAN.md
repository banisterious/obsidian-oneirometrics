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

---

*This document will be updated as design and implementation progress.* 
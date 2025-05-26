# OneiroMetrics Testing Guide

## Overview

This document outlines the testing procedures and requirements for the OneiroMetrics plugin. For specialized testing guides, see:
- [UI Testing Guide](./ui-testing.md)
- [Accessibility Testing Guide](./accessibility-testing.md)
- [Adapter Testing Patterns](./adapter-testing-patterns.md)

## Testing Categories

- View Mode Testing
- Setup Testing
- Settings Testing
- Metrics Scraping
- Metrics Table
- Content Display
- Expand/Collapse, Scroll, and Table Performance
- Templater Integration Testing
- Custom Date Filter UI Testing
- Filtering and Sorting
- Styling and UI (see [UI Testing](./ui-testing.md))
- Accessibility (see [Accessibility Testing](./accessibility-testing.md))
- Error Handling
- Performance
- Theme Compatibility
- Backup System Testing

For detailed UI and accessibility test checklists, refer to the dedicated guides linked above.

## Testing Categories

### 1. View Mode Testing
- [x] Verify Reading View requirement warnings ✅ 2025-05-21
- [ ] Test Live Preview mode limitations
- [ ] Check view mode switching behavior
- [ ] Validate warning notifications
- [ ] Test theme compatibility in both modes

See [View Mode Requirements](../../user/guides/view-mode.md) for detailed testing procedures and best practices.

### 2. Setup Testing

- [x] Plugin installs correctly in Obsidian
- [ ] Plugin appears in the community plugins list
- [x] Plugin can be enabled/disabled without errors
- [x] Plugin settings are accessible
- [x] Plugin icon appears in the ribbon

### Settings Testing

> This section covers only the test cases for settings. For user instructions, see [usage.md](../../user/guides/usage.md). For technical details, see [specification.md](../architecture/specification.md).

- [x] OneiroMetrics Note path can be set and saved
- [x] Selected notes can be added and removed using multi-chip autocomplete in both Settings and the modal
- [x] Chips are pre-populated from Settings in the modal
- [x] Removing a chip updates the selected notes
- [x] Adding a chip via autocomplete works as expected
- [x] Modal and Settings selected notes stay in sync
- [x] Callout name can be modified
- [x] Settings persist after Obsidian restart
- [x] Invalid paths are handled gracefully
- [x] File suggestions work in the OneiroMetrics Note path field
- [x] File suggestions work for paths with spaces and special characters (e.g., 'Journals/Dream Diary/Dream Diary.md')
- [x] Year-based paths are suggested correctly (e.g., typing '2025' suggests 'Journals/2025/2025.md')
- [x] "Scrape Notes" vs "Scrape Folder" toggle works correctly
- [x] "Choose Notes" label is displayed correctly
- [x] Lost Segments label shows "Any integer" (not "Range 0-10")
- [x] Metrics Table font size is consistent for all columns, especially Confidence Score
- [x] Lucide icons render as SVGs for all metrics in the settings UI (not as plain text or HTML)
- [ ] Readable Line Length toggle works and affects table width (test in both plugin settings and directly in the OneiroMetrics Note; toggles are always in sync)
- [x] Metrics Description section displays all metrics, icons, descriptions, and ranges
- [x] Metrics Description section renders Markdown as formatted HTML (not as raw text or code)
- [ ] Callout Metadata Support: 'hide' hides the metrics section, 'compact' condenses it, 'summary' highlights it. Settings and documentation are present in the UI.
- [x] Metrics Export/Import (JSON) works as expected
- [ ] CSV Export button generates a CSV file with summary and detailed structure
- [x] Settings page UI/UX overhaul: Bordered metrics section, clear section dividers, and helper text under section headers are present and visually correct. Default and Optional Metrics are grouped and styled for easier navigation.

### Metrics Scraping

- [x] Scrape button works from modal (notes mode only)
- [x] Scrape command works from command palette
- [x] Progress is shown during scraping with detailed status
- [x] Batch processing works for large datasets
- [x] Errors are handled gracefully
- [x] Backup is created before overwriting
- [x] Confirmation dialog appears before overwriting
- [x] Progress modal shows:
  - [x] Current file being processed
  - [x] Number of entries found
  - [x] Number of callouts found
  - [x] Overall progress bar
- [ ] Folder preview and scraping workflow (in both modal and settings) is now fully functional; Apply/Continue button in folder preview modal provides feedback and triggers scraping. Persistent exclusions per folder and file count sync are implemented and should be tested.

### Metrics Table - Summary Section

- [x] Table renders correctly
- [ ] All metrics are displayed
- [ ] Averages are calculated correctly
- [ ] Min/Max values are correct
- [ ] Count values are accurate
- [ ] Table is responsive on different screen sizes

### Metrics Table - Detailed Section

- [x] Table renders correctly
- [x] All columns are present
- [x] Data is sorted by date by default
- [x] Clickable dream titles work
- [x] Links navigate to correct journal entries
- [x] Word counts are accurate
- [x] Lazy loading works for large datasets
- [x] Table performance is smooth with 100+ entries

### Content Display

- [x] Content preview shows first 200 characters
- [x] Gradient fade effect works in preview
- [x] "Show more" button appears for long content
- [x] "Show less" button appears when expanded
- [x] Paragraph breaks are preserved
- [x] Text wrapping works correctly
- [x] Content is properly formatted
- [x] Font size and colors match theme
- [x] Callout metadata (hide, compact, summary) affect metrics section as described
- [x] Markdown elements are properly stripped
- [x] Show more/less functionality works reliably across all themes
- [x] Debug button for show more listeners is available and functional
- [x] Event listeners are properly attached and cleaned up

### Expand/Collapse, Scroll, and Table Performance (May 2025)
- [x] Clicking 'Show more' or 'Show less' in the Dream Entries table always expands/collapses content with no lag or unregistered clicks
- [x] No duplicate or lost event listeners (check with DevTools and logs)
- [x] Expanding/collapsing a row keeps the view stable (no scroll jump or overscroll)
- [x] Only 12 rows are rendered at a time in the Dream Metrics table (verify with DOM inspection)
- [x] Performance remains smooth with rapid expand/collapse and scrolling
- [x] No '[Violation] setTimeout handler took XXms' warnings in the console during normal use
- [x] Debug button for manual event listener attachment works as expected in development mode
- [x] See [ISSUES.md](../../../ISSUES.md#fixed-issues) and [Performance Testing](./performance-testing.md) for detailed diagnostics and troubleshooting steps

### Templater Integration Testing

#### Template Wizard UI
- [ ] Template wizard opens correctly from command palette
- [x] UI elements are properly aligned and styled
- [x] Step indicators work correctly (1 of 4, 2 of 4, etc.)
- [x] Navigation between steps works as expected
- [x] Cancel button closes the wizard without saving
- [ ] All form elements render correctly in various themes
- [x] Wizard closes properly after template creation

#### Templater Detection
- [ ] Plugin correctly detects if Templater is installed
- [ ] Appropriate UI elements are shown/hidden based on Templater availability
- [ ] Warning is shown when Templater is not installed
- [ ] Link to install Templater works correctly
- [ ] UI adapts when Templater is installed/uninstalled without requiring restart

#### Template Creation
- [ ] Basic information (name, description) is saved correctly
- [ ] Structure selection works and updates preview
- [ ] Templater toggle enables/disables template selection
- [ ] Template file dropdown is populated with available templates
- [ ] Template content is loaded correctly when selected
- [ ] Static preview is generated and displays correctly
- [ ] Template wizard saves both dynamic and static versions

#### Template Conversion
- [ ] Date patterns are correctly converted to placeholders
- [ ] Prompt patterns are correctly converted with default values
- [ ] File properties patterns are correctly converted
- [ ] Complex patterns with conditionals are handled gracefully
- [ ] Error feedback is provided for unconvertible patterns
- [ ] Preview updates in real-time during template editing

#### Template Insertion
- [ ] Template modal opens correctly
- [ ] Template list shows all available templates
- [ ] Preview button shows template content
- [ ] Insert button adds template to editor
- [ ] Templates with Templater syntax process correctly when Templater is installed
- [ ] Fallback to static content works when Templater is not installed
- [ ] Notification is shown when using fallback mechanism
- [ ] Cursor position is correctly set after insertion

#### Placeholder Navigation
- [ ] Cursor automatically moves to first placeholder after insertion
- [ ] Tab key navigates between placeholders
- [ ] Placeholders are visually distinct in the editor
- [ ] Default values are selected for easy replacement
- [ ] Instructions are provided for placeholder navigation

#### Compatibility Testing
- [ ] Testing with Templater installed
  - [ ] Dynamic content resolves correctly
  - [ ] User prompts appear and work
  - [ ] Date formatting works as expected
  - [ ] Conditional content displays correctly
  - [ ] System information is correctly accessed
  - [ ] File properties are correctly included
- [ ] Testing without Templater installed
  - [ ] Static placeholders appear correctly
  - [ ] All placeholders are properly formatted
  - [ ] Cursor navigation between placeholders works
  - [ ] Default values are correctly displayed
  - [ ] Instructions for manual completion are clear

### Custom Date Filter UI Testing

> This section covers the Custom Date Filter UI, a new feature added in a May 2025 update

#### Modal UI Elements
- [x] Custom Date Filter button opens modal correctly
- [x] Modal has correct dimensions and positioning
- [ ] Calendar displays correctly with current month
- [ ] Previous and next month buttons work properly
- [x] Today button highlights current day
- [ ] Start and end date fields update when calendar dates are selected
- [ ] Save button is enabled only when a valid range is selected
- [x] Cancel button closes the modal without saving
- [ ] Reset button clears selection
- [ ] Modal is responsive on different screen sizes

#### Date Selection
- [ ] Clicking on dates selects them correctly
- [ ] First click sets start date
- [ ] Second click sets end date (if after start date)
- [ ] Selected range is highlighted in the calendar
- [ ] Selecting a date before the current start date resets the selection to just that date
- [ ] Date display format matches vault settings
- [ ] Date inputs can be manually typed
- [ ] Invalid date inputs are rejected with feedback
- [ ] Date range spanning multiple months works correctly

#### Favorites System
- [ ] Save button in favorites section is enabled only when name is entered
- [ ] Saved ranges appear in favorites list
- [ ] Clicking a favorite applies that range
- [ ] Delete button removes favorites
- [ ] Favorites persist across sessions
- [ ] Favorites list scrolls if many items are saved
- [ ] Long favorite names are truncated with ellipsis

#### Visual Styling
- [ ] Calendar styling matches Obsidian theme
- [ ] Hover states for calendar days work correctly
- [ ] Selected range has proper highlighting
- [ ] Today indicator is visible
- [ ] Buttons have proper hover and active states
- [ ] Icons render correctly and are aligned
- [ ] Favorites section styling is consistent with the rest of the UI
- [ ] Calendar adjusts to theme changes without requiring restart

#### Accessibility
- [ ] All UI elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Tab order is logical
- [ ] Screen reader announces UI elements correctly (ARIA labels)
- [ ] High contrast mode is supported
- [ ] Color indicators don't rely solely on color (patterns or icons also used)
- [ ] Error messages are accessible
- [ ] Input validation provides accessible feedback

### Filtering and Sorting

- [x] Column sorting works (clickable headers)
- [x] Date filter dropdown appears and functions
- [x] Sorting preserves expanded/collapsed state
- [x] Tables update immediately when filter changes
- [x] 'Today' filter shows correct entries
- [x] 'This Week' filter respects weekStartDay setting
- [x] 'Last Month' filter shows entries from previous month only
- [x] 'All' filter shows all entries
- [x] Custom date filter opens modal and works correctly
- [x] Search filter is case-insensitive
- [x] Filter state persists during session
- [x] Complex filter combinations work correctly
- [x] Sort indicators show current sort direction
- [x] Filter dropdown has clear labels and proper styling

### Error Handling

- [ ] Invalid callout format errors are reported
- [ ] Missing files are handled gracefully
- [ ] Permission issues are reported clearly
- [ ] Network errors during template fetching are handled
- [ ] Invalid settings are prevented with validation
- [ ] Invalid date ranges are rejected with feedback
- [ ] Plugin gracefully degrades when features aren't available
- [ ] Error messages are user-friendly and actionable
- [ ] Console errors are caught and handled
- [ ] Error notifications have appropriate duration and styling

### Performance

- [ ] Initial load time is reasonable
- [ ] Scraping large journals (100+ entries) completes in reasonable time
- [ ] Table rendering is optimized with virtualization
- [ ] Scroll performance is smooth
- [ ] Memory usage is reasonable
- [ ] No memory leaks (check after extended use)
- [ ] UI remains responsive during intensive operations
- [ ] Background operations don't block the UI
- [ ] Progress indicators appear for long operations
- [ ] Large datasets don't cause significant slowdowns

### Theme Compatibility

- [ ] Plugin UI elements match light theme
- [ ] Plugin UI elements match dark theme
- [ ] Plugin UI elements match custom themes
- [ ] No hard-coded colors that clash with themes
- [ ] Icons are visible in all themes
- [ ] Table styles adapt to theme changes
- [ ] Modal dialogs match current theme
- [ ] Text is readable in all tested themes
- [ ] Hover and active states work in all themes
- [ ] Plugin respects user's font choices

### Backup System Testing

- [ ] Backup is created before overwriting
- [ ] Backup file has correct extension (.bak)
- [ ] Backup file contains the original content
- [ ] Multiple backups don't overwrite each other
- [ ] Backup creation doesn't interfere with normal operation
- [ ] Backup creation is logged
- [ ] Backup policy is documented
- [ ] Backups are created in the correct location
- [ ] Backup filenames include timestamps
- [ ] Backup system works across Obsidian restarts

## Bug Reporting Template

When reporting bugs or issues, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Numbered steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
   - Obsidian version
   - Plugin version
   - OS and version
   - Theme in use
6. **Screenshots/Videos**: If applicable
7. **Console Logs**: Open Developer Tools (Ctrl+Shift+I) and include relevant console output
8. **Sample Data**: Minimal example to reproduce the issue (if possible)

## Troubleshooting Guide

### Common Issues and Solutions

#### Table Rendering Issues

1. **Problem**: Table doesn't appear or is incomplete
   **Solution**: Ensure you're in Reading View mode, not Live Preview

2. **Problem**: "Show more" button doesn't expand content
   **Solution**: 
   - Set logging level to Debug in settings
   - Click the "Debug: Attach Show More Listeners" button
   - Check console for errors
   - Try reloading the note

3. **Problem**: Sorting or filtering doesn't update the table
   **Solution**: 
   - Check for console errors
   - Try toggling between filters a few times
   - Reload the note

#### Settings Issues

1. **Problem**: File suggestions don't appear
   **Solution**:
   - Click in another field and then back
   - Try typing more characters
   - Check console for errors

2. **Problem**: Selected notes aren't saved
   **Solution**:
   - Ensure chips are created by pressing Enter
   - Check for console errors about invalid paths
   - Try restarting Obsidian

#### Templater Integration Issues

1. **Problem**: Templates don't process correctly
   **Solution**:
   - Verify Templater is installed and enabled
   - Check template syntax for errors
   - Try using a simpler template to isolate the issue

2. **Problem**: Static placeholders don't appear
   **Solution**:
   - Check template conversion in settings
   - Try recreating the template
   - Verify placeholder format is correct

#### Performance Issues

1. **Problem**: Slow scraping with large journals
   **Solution**:
   - Try scraping fewer notes at once
   - Check for complex callout nesting
   - Monitor memory usage

2. **Problem**: Table is laggy with many entries
   **Solution**:
   - Ensure virtualization is working (only ~12 rows in DOM)
   - Use filters to reduce visible entries
   - Check for console warnings about long tasks

## Manual Testing Checklist

Before submitting changes, run through this basic checklist:

1. **Installation/Update**:
   - [ ] Plugin installs/updates without errors
   - [ ] Settings are preserved when updating

2. **Basic Functionality**:
   - [ ] Scraping works with default settings
   - [ ] Tables render correctly
   - [ ] Expand/collapse works

3. **UI Elements**:
   - [ ] All buttons are visible and work
   - [ ] Modals open and close properly
   - [ ] Inputs accept values and validate

4. **Error Scenarios**:
   - [ ] Invalid paths are handled gracefully
   - [ ] Missing files don't crash the plugin
   - [ ] Invalid inputs show appropriate errors

5. **Performance**:
   - [ ] UI remains responsive
   - [ ] No memory leaks
   - [ ] Large datasets handle reasonably

## Performance Testing

For detailed performance testing procedures, see [Performance Testing Guide](./performance-testing.md).

## Accessibility Testing

For detailed accessibility testing procedures, see [Accessibility Testing Guide](./accessibility-testing.md).

## UI Testing

For detailed UI testing procedures, see [UI Testing Guide](./ui-testing.md). 
# OneiroMetrics Testing Guide

## Overview

This document outlines the testing procedures and requirements for the OneiroMetrics plugin. For specific testing focus areas, see:
- [UI Testing Guide](ui-testing.md)
- [Accessibility Testing Guide](accessibility-testing.md)
- [Performance Testing Guide](performance-testing.md)

## Testing Categories

- [View Mode Testing](#view-mode-testing)
- [Setup and Installation](#setup-testing)
- [Settings Interface](#settings-testing)
- [Metrics Scraping](#metrics-scraping)
- [Metrics Table](#metrics-table)
- [Content Display](#content-display)
- [Performance and Interaction](#expandcollapse-scroll-and-table-performance)
- [Templater Integration](#templater-integration-testing)
- [Custom Date Filter UI](#custom-date-filter-ui-testing)
- [Filtering and Sorting](#filtering-and-sorting)
- [Error Handling](#error-handling)
- [Theme Compatibility](#theme-compatibility)
- [Backup System](#backup-system-testing)

## Detailed Test Procedures

### View Mode Testing
- [ ] Verify Reading View requirement warnings
- [ ] Test Live Preview mode limitations
- [ ] Check view mode switching behavior
- [ ] Validate warning notifications
- [ ] Test theme compatibility in both modes

See [View Mode Requirements](../../user/guides/view-mode.md) for detailed testing procedures and best practices.

### Setup Testing

- [ ] Plugin installs correctly in Obsidian
- [ ] Plugin appears in the community plugins list
- [ ] Plugin can be enabled/disabled without errors
- [ ] Plugin settings are accessible
- [ ] Plugin icon appears in the ribbon

### Settings Testing

> This section covers only the test cases for settings. For user instructions, see the [Usage Guide](../../user/guides/usage.md). For technical details, see the [Technical Specification](../architecture/specification.md).

- [ ] OneiroMetrics Note path can be set and saved
- [ ] Selected notes can be added and removed using multi-chip autocomplete
- [ ] Chips are pre-populated from Settings in the modal
- [ ] Removing a chip updates the selected notes
- [ ] Adding a chip via autocomplete works as expected
- [ ] Modal and Settings selected notes stay in sync
- [ ] Callout name can be modified
- [ ] Settings persist after Obsidian restart
- [ ] Invalid paths are handled gracefully
- [ ] File suggestions work in the OneiroMetrics Note path field
- [ ] File suggestions work for paths with spaces and special characters
- [ ] Year-based paths are suggested correctly
- [ ] "Scrape Notes" vs "Scrape Folder" toggle works correctly
- [ ] "Choose Notes" label is displayed correctly
- [ ] Metrics labels display correctly
- [ ] Metrics Table font size is consistent for all columns
- [ ] Lucide icons render as SVGs for all metrics in the settings UI
- [ ] Readable Line Length toggle works and affects table width
- [ ] Metrics Description section displays all metrics, icons, descriptions, and ranges
- [ ] Metrics Description section renders Markdown as formatted HTML
- [ ] Callout Metadata Support options work correctly
- [ ] Metrics Export/Import (JSON) works as expected
- [ ] CSV Export button generates a CSV file with summary and detailed structure
- [ ] Settings page UI shows proper visual organization

### Metrics Scraping

- [ ] Scrape button works from modal
- [ ] Scrape command works from command palette
- [ ] Progress is shown during scraping with detailed status
- [ ] Batch processing works for large datasets
- [ ] Errors are handled gracefully
- [ ] Backup is created before overwriting
- [ ] Confirmation dialog appears before overwriting
- [ ] Progress modal shows complete status information
- [ ] Folder preview and scraping workflow works correctly

### Metrics Table

#### Summary Section
- [ ] Table renders correctly
- [ ] All metrics are displayed
- [ ] Averages are calculated correctly
- [ ] Min/Max values are correct
- [ ] Count values are accurate
- [ ] Table is responsive on different screen sizes

#### Detailed Section
- [ ] Table renders correctly
- [ ] All columns are present
- [ ] Data is sorted by date by default
- [ ] Clickable dream titles work
- [ ] Links navigate to correct journal entries
- [ ] Word counts are accurate
- [ ] Lazy loading works for large datasets
- [ ] Table performance is smooth with 100+ entries

### Content Display

- [ ] Content preview shows first 200 characters
- [ ] Gradient fade effect works in preview
- [ ] "Show more" button appears for long content
- [ ] "Show less" button appears when expanded
- [ ] Paragraph breaks are preserved
- [ ] Text wrapping works correctly
- [ ] Content is properly formatted
- [ ] Font size and colors match theme
- [ ] Callout metadata affects metrics section as expected
- [ ] Markdown elements are properly stripped
- [ ] Show more/less functionality works reliably across all themes
- [ ] Debug button for show more listeners is available and functional
- [ ] Event listeners are properly attached and cleaned up

### Expand/Collapse, Scroll, and Table Performance
- [ ] Clicking 'Show more' or 'Show less' always expands/collapses content properly
- [ ] No duplicate or lost event listeners
- [ ] Expanding/collapsing a row keeps the view stable
- [ ] Only 12 rows are rendered at a time in the Dream Metrics table
- [ ] Performance remains smooth with rapid expand/collapse and scrolling
- [ ] No setTimeout handler violations in the console during normal use
- [ ] Debug button for manual event listener attachment works as expected

### Templater Integration Testing

#### Template Wizard UI
- [ ] Template wizard opens correctly from command palette
- [ ] UI elements are properly aligned and styled
- [ ] Step indicators work correctly
- [ ] Navigation between steps works as expected
- [ ] Cancel button closes the wizard without saving
- [ ] All form elements render correctly in various themes
- [ ] Wizard closes properly after template creation

#### Templater Detection
- [ ] Plugin correctly detects if Templater is installed
- [ ] Appropriate UI elements are shown/hidden based on Templater availability
- [ ] Warning is shown when Templater is not installed
- [ ] Link to install Templater works correctly
- [ ] UI adapts when Templater is installed/uninstalled without requiring restart

#### Template Creation
- [ ] Basic information is saved correctly
- [ ] Structure selection works and updates preview
- [ ] Templater toggle enables/disables template selection
- [ ] Template file dropdown is populated correctly
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
- [ ] Templates with Templater syntax process correctly
- [ ] Fallback to static content works when needed
- [ ] Notification is shown when using fallback mechanism
- [ ] Cursor position is correctly set after insertion

#### Placeholder Navigation
- [ ] Cursor automatically moves to first placeholder after insertion
- [ ] Tab key navigates between placeholders
- [ ] Placeholders are visually distinct in the editor
- [ ] Default values are selected for easy replacement
- [ ] Instructions are provided for placeholder navigation

### Custom Date Filter UI Testing

- [ ] Calendar Preview
  - [ ] Calendar renders correctly
  - [ ] Current month is displayed
  - [ ] Selected dates are highlighted
  - [ ] Today's date is marked
  - [ ] Clicking dates selects range
  - [ ] Multi-month view works (if implemented)
  - [ ] Week numbers display correctly (if implemented)

- [ ] Accessibility Features
  - [ ] Keyboard navigation works
  - [ ] Screen reader support is implemented
  - [ ] High contrast mode is supported
  - [ ] Reduced motion preferences are respected

- [ ] Mobile Optimization
  - [ ] Layout adapts to screen size
  - [ ] Touch targets are large enough
  - [ ] Buttons are easily tappable
  - [ ] Calendar is usable on small screens
  - [ ] No horizontal scrolling needed

- [ ] Theme Compatibility
  - [ ] Colors match theme
  - [ ] Icons are visible
  - [ ] Text is readable
  - [ ] Borders are visible
  - [ ] Hover states work

- [ ] Performance
  - [ ] Calendar renders quickly
  - [ ] Date selection is responsive
  - [ ] Range updates are smooth
  - [ ] No lag when switching months
  - [ ] Memory usage is reasonable

### Filtering and Sorting

- [ ] Date range filter works with all options
- [ ] Custom Date Filter works correctly
- [ ] Filter container has consistent styling
- [ ] Quick filter buttons work properly
- [ ] Filter feedback provides clear visual indicators
- [ ] Filter performance is responsive
- [ ] Metric filter works correctly
- [ ] Column sorting works for all columns
- [ ] Sort indicators show correct direction

### Error Handling

- [ ] Invalid file paths are handled gracefully
- [ ] Malformed callouts are handled appropriately
- [ ] Missing notes are reported clearly
- [ ] Network errors are handled
- [ ] Error messages are user-friendly
- [ ] Recovery options are provided
- [ ] Logs are generated for debugging
- [ ] Critical errors prevent data loss

### Theme Compatibility

- [ ] Plugin UI matches light theme
- [ ] Plugin UI matches dark theme
- [ ] Plugin UI matches custom themes
- [ ] Text contrast meets accessibility standards
- [ ] Icons are visible in all themes
- [ ] Hover states work in all themes
- [ ] Table styling is consistent
- [ ] Modal styling is consistent

### Backup System Testing

- [ ] Backups are created before overwriting
- [ ] Backup file naming follows the pattern
- [ ] Backup folder is created if it doesn't exist
- [ ] Backup files can be restored
- [ ] Old backups are pruned according to policy
- [ ] Backup success is logged
- [ ] Backup failures are reported
- [ ] Backup system handles large files

## Related Documentation

- [UI Testing](ui-testing.md)
- [Accessibility Testing](accessibility-testing.md)
- [Performance Testing](performance-testing.md)
- [View Mode Requirements](../../user/guides/view-mode.md)
- [Usage Guide](../../user/guides/usage.md)
- [Technical Specification](../architecture/specification.md) 
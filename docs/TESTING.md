## OneiroMetrics Testing Guide

### Setup Testing

- [x] Plugin installs correctly in Obsidian
- [ ] Plugin appears in the community plugins list
- [x] Plugin can be enabled/disabled without errors
- [x] Plugin settings are accessible
- [x] Plugin icon appears in the ribbon

### Settings Testing

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
- [ ] Settings page UI/UX overhaul: Bordered metrics section, clear section dividers, and helper text under section headers are present and visually correct. Default and Optional Metrics are grouped and styled for easier navigation.

### Metrics Scraping

- [x] Scrape button works from modal (notes mode only)
- [ ] Scrape command works from command palette
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

- [ ] Table renders correctly
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
- [x] "Show less" button appears when expanded (if implemented)
- [x] Paragraph breaks are preserved
- [x] Text wrapping works correctly
- [x] Content is properly formatted
- [x] Font size and colors match theme
- [x] Callout metadata (hide, compact, summary) affect metrics section as described
- [x] Markdown elements are properly stripped:
  - [x] Journal page callouts (e.g., [!journal-page|right])
  - [x] Image embeds with dimensions (e.g., !image.png|400)
  - [x] Wiki links
  - [x] HTML tags
  - [x] Horizontal rules
  - [x] Multiple newlines

### Time Filter UI Testing

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
    - [ ] Arrow keys move focus
    - [ ] Enter/Space activates buttons
    - [ ] Tab order is logical
    - [ ] Focus indicators are visible
  - [ ] Screen reader support
    - [ ] ARIA labels are present
    - [ ] Announcements work
    - [ ] Button roles are correct
    - [ ] Live regions update properly
  - [ ] High contrast mode
    - [ ] Colors are visible
    - [ ] Text is readable
    - [ ] Icons are clear
  - [ ] Reduced motion
    - [ ] Animations respect preference
    - [ ] Transitions are smooth

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

- [x] Date range filter works
  - [x] All Time option
  - [x] Last Month option
  - [x] Last Week option
  - [x] Today option
  - [x] Yesterday option
  - [x] This Week option
  - [x] Custom range via calendar
- [x] Duration and relative time indicators
  - [x] Shows length of selected period
  - [x] Indicates if period is current/past/future
  - [x] Updates when range changes
- [x] SVG icons for filter buttons
  - [x] Icons are visible
  - [x] Icons match theme
  - [x] Icons are properly sized
- [x] Metric filter works
  - [x] All Metrics option
  - [x] Individual metric options
- [x] Column sorting works
  - [x] Date column
  - [x] Title column
  - [x] Words column
  - [x] Metric columns
- [x] Sort indicators show correct direction

### Styling and UI

- [x] Tables match Obsidian theme
- [x] Hover effects work on rows
- [ ] Buttons have proper hover states
- [x] Links have proper hover states
- [x] Text is readable
- [x] Spacing is consistent
- [x] UI is responsive
- [ ] No horizontal scrolling on desktop
- [ ] Mobile view is usable
- [ ] Table overrides readable line length setting
- [ ] Table maintains full width regardless of theme settings
- [ ] Column widths are optimized:
  - [ ] Date column (8%)
  - [ ] Dream Title column (15%)
  - [ ] Words column (7%)
  - [ ] Content column (30%)
  - [ ] Metric columns (8% each)
- [ ] Progress modal styling matches theme
- [ ] Suggestion containers use CSS classes instead of inline styles
- [x] No inline styles present (all styles use CSS classes)

### Error Handling

- [ ] Invalid file paths show appropriate errors
- [ ] Missing metrics show appropriate messages
- [ ] Network errors are handled gracefully
- [ ] Permission errors are handled gracefully
- [ ] Invalid data formats are handled gracefully
- [ ] Backup creation errors show appropriate messages
- [ ] User is prompted to proceed without backup if backup fails

### Performance

- [x] Plugin loads quickly
- [x] Tables render quickly
- [ ] Sorting is responsive
- [ ] Filtering is responsive
- [ ] No lag when expanding content
- [ ] Memory usage is reasonable
- [ ] Batch processing improves performance with large datasets
- [ ] Lazy loading improves table performance
- [ ] Progress indicator updates smoothly

### Theme Compatibility

- [x] Works with Light theme
- [ ] Works with Dark theme
- [x] Works with custom themes
- [ ] Colors adapt to theme changes

### Backup System Testing

- [x] Backup is created before table update
- [x] Backup filename includes timestamp
- [x] Backup contains complete note content
- [x] Backup is created in correct location
- [x] Backup can be restored if needed
- [x] Multiple backups are handled correctly
- [x] Backup process doesn't block UI
- [ ] Backup errors are handled gracefully
- [ ] Backup files are visually distinct in file explorer
- [ ] Backup process works with large files
- [ ] Backup is triggered on content changes
- [ ] Backup is triggered before scraping

### Notes for Testing

1. Test with various dream journal entry lengths
2. Test with different metric combinations
3. Test with special characters in content
4. Test with different date ranges
5. Test with different screen sizes
6. Test with different Obsidian themes
7. Test with large datasets (100+ entries)
8. Test backup creation with different file sizes
9. Test progress indicator with various dataset sizes
10. **Visually verify the new Settings page layout, section borders, and helper text descriptions.**

### Bug Reporting Template

When reporting bugs, please include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Obsidian version
6. Plugin version
7. Operating system
8. Any error messages from the console

### Performance Testing

- [x] Test with 100+ dream entries
- [ ] Test with 10+ metrics
- [ ] Test with large content (1000+ words)
- [ ] Monitor memory usage
- [ ] Check load times
- [ ] Verify smooth scrolling
- [ ] Check filter response time
- [ ] Check sort response time
- [ ] Test batch processing performance
- [ ] Test lazy loading performance
- [ ] Monitor progress indicator updates

### Troubleshooting: File Suggestion Issues

If a file path does not appear in suggestions:

- [x] Confirm the file and all parent folders exist in your vault
- [x] Check for typos, extra spaces, or case mismatches
- [x] Try typing the full path, including spaces and special characters
- [x] Try replacing spaces with dashes or underscores
- [x] If the file was recently created or renamed, restart Obsidian or reload the vault
- [x] Ensure the file is not hidden or excluded by Obsidian settings
- [x] If the issue persists, report it with details (see Bug Reporting Template)

### Recent Changes to Test

1. Progress Indicator:
   - [x] Shows current file being processed
   - [x] Shows number of entries found
   - [x] Shows number of callouts found
   - [x] Progress bar updates smoothly
   - [x] Modal styling matches theme

2. Batch Processing:
   - [x] Processes files in batches of 5
   - [x] UI remains responsive during processing
   - [x] Progress updates between batches
   - [x] Handles large datasets efficiently

3. CSS Improvements:
   - [x] All styles use CSS classes
   - [x] No inline styles present
   - [x] Theme compatibility maintained
   - [x] Responsive design preserved

4. Backup System:
   - [ ] Backup triggered on content changes
   - [ ] Backup triggered before scraping
   - [ ] Error handling improved
   - [ ] User confirmation for failed backups

### Testing Methodologies

#### Automated Unit Testing

These tests can be run automatically without Obsidian, focusing on pure functions and data processing.

##### Core Functions

- [ ] Word count calculation
  ```typescript
  test('calculateWordCount', () => {
    expect(calculateWordCount("Hello world")).toBe(2);
    expect(calculateWordCount("")).toBe(0);
    expect(calculateWordCount("  multiple   spaces  ")).toBe(2);
  });
  ```
- [ ] Metric calculations
  ```typescript
  test('calculateAverage', () => {
    expect(calculateAverage([1, 2, 3])).toBe(2);
    expect(calculateAverage([])).toBe(0);
    expect(calculateAverage([5])).toBe(5);
  });
  ```
- [ ] Date formatting
  ```typescript
  test('formatDate', () => {
    expect(formatDate(new Date('2024-01-01'))).toBe('2024-01-01');
    expect(formatDate(null)).toBe('N/A');
  });
  ```

##### Data Processing

- [ ] Markdown stripping
  ```typescript
  test('stripMarkdown', () => {
    expect(stripMarkdown('[[Link]]')).toBe('Link');
    expect(stripMarkdown('![[Embed]]')).toBe('');
    expect(stripMarkdown('![Image|400]')).toBe('');
  });
  ```
- [ ] Content truncation
  ```typescript
  test('truncateContent', () => {
    const longText = 'a'.repeat(300);
    expect(truncateContent(longText).length).toBe(200);
    expect(truncateContent('short')).toBe('short');
  });
  ```
- [ ] CSV Generation
  ```typescript
  test('generateCSV', () => {
    const data = [
      { date: '2024-01-01', title: 'Dream 1', words: 100, content: 'Content 1' },
      { date: '2024-01-02', title: 'Dream 2', words: 200, content: 'Content 2' }
    ];
    const csv = generateCSV(data);
    expect(csv).toContain('date,title,words,content');
    expect(csv).toContain('2024-01-01,Dream 1,100,Content 1');
    expect(csv).toContain('2024-01-02,Dream 2,200,Content 2');
  });

  test('handleSpecialCharacters', () => {
    const data = [
      { title: 'Dream with, comma', content: 'Content with "quotes"' }
    ];
    const csv = generateCSV(data);
    expect(csv).toContain('"Dream with, comma"');
    expect(csv).toContain('"Content with ""quotes"""');
  });
  ```

##### Utility Functions

- [ ] Array operations
- [ ] String manipulation
- [ ] Data validation
- [ ] Type checking

#### Manual Integration Testing

These tests require Obsidian and manual verification.

##### Obsidian API Integration

- [ ] File reading/writing
- [ ] Settings persistence
- [ ] Plugin lifecycle
- [ ] Event handling

##### UI Components

- [x] Modal behavior: persistent exclusions per folder, file count display, and state sync are always accurate and should be tested.
- [ ] Table rendering
- [ ] Progress indicators
- [ ] Suggestion system
- [ ] Theme integration

##### File System Operations

- [ ] Backup creation
- [ ] File path resolution
- [ ] Error handling
- [ ] Permission checks

#### Manual End-to-End Testing

Complete user workflows that require manual verification.

##### User Flows

- [ ] Complete metrics scraping process
- [ ] Settings configuration
- [ ] Backup and restore
- [ ] Table filtering and sorting
- [ ] Content expansion/collapse
- [ ] CSV Export functionality
  - [ ] Export summary metrics
  - [ ] Export detailed dream entries
  - [ ] Export filtered data
  - [ ] Export with selected columns
  - [ ] Proper CSV formatting
  - [ ] Special character handling
  - [ ] Date formatting in CSV
  - [ ] File naming convention
  - [ ] Download location handling
  - [ ] Large dataset export performance

##### Cross-Platform Testing

- [x] Windows compatibility
- [ ] macOS compatibility
- [ ] Linux compatibility
- [ ] Mobile compatibility

##### Performance Testing

- [ ] Large dataset handling
- [ ] Memory usage
- [ ] UI responsiveness
- [ ] Backup performance

#### Test Environment Setup

##### Automated Tests

- [ ] Jest configuration
- [ ] Test data fixtures
- [ ] Mock functions
- [ ] CI/CD pipeline

##### Manual Tests

- [ ] Test vault setup
- [ ] Sample dream journals
- [ ] Various theme configurations
- [ ] Different Obsidian versions

#### Testing Tools

##### Automated Testing

- [ ] Jest for unit tests
- [ ] TypeScript compiler for type checking
- [ ] ESLint for code quality
- [ ] Prettier for code formatting

##### Manual Testing

- [ ] Obsidian Developer Tools
- [ ] Browser DevTools
- [ ] Performance monitoring
- [ ] Error logging

#### Test Coverage Goals

##### Automated Tests

- [ ] Core functions: 90%+
- [ ] Data processing: 85%+
- [ ] Utility functions: 95%+

##### Manual Tests

- [ ] User workflows: 100%
- [ ] Error scenarios: 100%
- [ ] Edge cases: 100%

### Feature Implementation Details

#### CSV Export Feature

##### Core Functionality

```typescript
interface CSVExportOptions {
    includeSummary: boolean;      // Export summary metrics
    includeDetails: boolean;      // Export detailed dream entries
    selectedColumns: string[];    // Columns to include
    dateFormat: string;          // Date format for export
    delimiter: string;           // CSV delimiter (default: ',')
    includeHeaders: boolean;     // Include column headers
    filterCriteria?: {           // Optional filtering
        dateRange?: DateRange;
        metrics?: string[];
    };
}

interface CSVExportResult {
    content: string;             // CSV content
    filename: string;            // Generated filename
    rowCount: number;           // Number of rows exported
    timestamp: string;          // Export timestamp
}
```

##### Export Types

1. **Summary Export**
   - Overall metrics
   - Averages
   - Min/Max values
   - Counts
   - Date range

2. **Detailed Export**
   - Individual dream entries
   - All metrics per entry
   - Full content or preview
   - Links to source files

3. **Filtered Export**
   - Date range selection
   - Metric selection
   - Column selection
   - Custom filters

##### File Handling

- [ ] Automatic filename generation
  ```typescript
  function generateExportFilename(type: 'summary' | 'detailed' | 'filtered'): string {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    return `oneirometrics-${type}-${date}-${time}.csv`;
  }
  ```
- [ ] Download location handling
- [ ] File size optimization
- [ ] Progress tracking for large exports

##### Data Processing

- [ ] Special character handling
  ```typescript
  function escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
  ```
- [ ] Date formatting
- [ ] Number formatting
- [ ] Content truncation
- [ ] Link processing

##### UI Components

- [ ] Export button in table header
- [ ] Export options modal
  - Column selection
  - Date range selection
  - Export type selection
  - Format options
- [ ] Progress indicator
- [ ] Success/error notifications

##### Performance Considerations

- [ ] Chunked processing for large datasets
- [ ] Memory usage optimization
- [ ] Background processing
- [ ] Progress updates
- [ ] Cancellation support

##### Error Handling

- [ ] File system errors
- [ ] Memory limits
- [ ] Invalid data
- [ ] User cancellation
- [ ] Timeout handling

##### Testing Requirements

- [ ] Unit tests for CSV generation
- [ ] Integration tests for file handling
- [ ] Performance tests for large datasets
- [ ] UI component tests
- [ ] Error handling tests

##### Example Usage

```typescript
// Basic export
const result = await exportToCSV({
    includeSummary: true,
    includeDetails: true,
    selectedColumns: ['date', 'title', 'words', 'content'],
    dateFormat: 'YYYY-MM-DD',
    delimiter: ',',
    includeHeaders: true
});

// Filtered export
const filteredResult = await exportToCSV({
    includeSummary: false,
    includeDetails: true,
    selectedColumns: ['date', 'title', 'words'],
    filterCriteria: {
        dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
        },
        metrics: ['lucidity', 'vividness']
    }
});
```

## June 2024: New Features & Fixes

### Dream Metrics Callout Customizations
- Go to plugin settings and locate the 'Dream Metrics Callout Customizations' section above Metrics Descriptions.
- Verify the bordered section and pseudo-heading are present.
- Confirm the 'Current Callout Structure' box is read-only, live-updating, and selectable.
- Enter metadata in the 'Callout Metadata' field and verify the callout structure updates.
- Toggle 'Single-Line Callout Structure' and confirm the callout structure updates to a single line.

### Metrics Description Table Styling
- In settings, verify that all tables in the Metrics Descriptions section have a light gray border and improved readability.

### Readable Line Length Toggle Debugging
- In the OneiroMetrics Note UI, toggle 'Override Readable Line Length for this table'.
- Confirm a Notice appears with the new value.
- Open the developer console and check for logs indicating whether the full-width style is being applied or removed.
- Verify that the table width changes as expected when toggling.
- If not, note the console output for further debugging.

## June 2025: New Features & Fixes

### Selected Notes UI
- Verify the search field is above the chips area.
- Confirm the chips area is hidden when no notes are selected and only appears when notes are selected.
- Ensure the UI is less confusing and more intuitive.

### Callout Structure Box Wrapping
- Confirm the callout structure preview wraps text and does not overflow the box, even for long single-line callouts.

### Backup Filename Date
- Verify that backup files use the correct local date and time in their filenames (not UTC).

### Readable Line Length Override
- Toggle the override and confirm the table always expands to full width, regardless of Obsidian's core setting or theme constraints.

### June 2025: Additional Features & Fixes
- Chips area for selected notes is visually flat (no border, background, or box-shadow).
- Backup files use the .bak extension instead of .md.
- Open Metrics Note button is present in the modal, only enabled when the note exists, and opens the note in Obsidian.

## Planned Features to Test

- [ ] Open Project Button
  - [ ] Verify the "Open Project" button appears in the modal.
  - [ ] Button is only enabled when the OneiroMetrics Note can be opened.
  - [ ] Clicking the button opens the correct OneiroMetrics Note.
- [ ] Backup File Extension
  - [ ] Confirm that backup files are created with a .bak extension instead of .md.

### Flexible Note/Folder Selection & File Preview
- [ ] Folder selection: Select a folder, verify 200-file cap, helper text, and label
- [ ] File preview modal: Opens before scraping, shows correct files, supports filter, sort (name/date), select/deselect, persistent exclusions, and batch actions
- [ ] Persistent exclusions: Exclusions are remembered per folder if checkbox is checked, and not if unchecked
- [ ] Select All / Deselect All: Buttons work as expected in preview modal
- [ ] Progress bar/spinner: Appears during file gathering and scraping
- [ ] Success/failure toasts: Show correct file counts and errors
- [ ] Inline status: Appears after "Update Metrics" in OneiroMetrics Note
- [ ] "Update Metrics" button: Triggers preview modal and scrape as expected
- [ ] All features work in both settings and OneiroMetrics Note workflows

### New Features & Fixes
- [ ] Folder preview modal reliably displays a file list with checkboxes styled for theme compatibility.
- [ ] Continue button in folder preview modal enables scraping only selected files.
- [ ] File count is displayed above file list in folder preview modal.
- [ ] No debug/test elements are present in the modal.

### Debug Logging & Note Update Troubleshooting

- [ ] Check for debug Notices in Obsidian (e.g., [DEBUG] updateProjectNote called for: ...)
- [ ] Confirm the OneiroMetrics Note Path in settings matches the file you are viewing
- [ ] Open the note in the editor and look for the <!-- OOM METRICS START --> marker in the raw Markdown
- [ ] Check the console for logs about dream entry extraction and metrics
- [ ] If no entries are found, add granular debug logs in the extraction loop to print each entry (date, title, metrics)
- [ ] Confirm that updateProjectNote is called with the correct number of entries and the expected content

This checklist helps ensure the plugin is updating the correct note and extracting dream entries as expected.

- [x] Parser blockStack logic fixed: Dream-diary and dream-metrics callouts are now robustly extracted from nested callouts. Granular debug logging was used to verify correct extraction and nesting during troubleshooting.
- [ ] Verify that callout metadata (including 'hide', 'compact', 'summary', and arbitrary values) is not reflected as CSS classes on the Statistics or Dream Entry tables. Only standard classes should be present.

## Logging and Debug Output

- Excessive debug logging should be avoided in production builds.
- Tests should confirm that only essential logs are present during normal operation.
- Debug logs for backup and extraction logic should be temporary and removed after troubleshooting.

## Current Status

- **Table regeneration/update issues:** Still being debugged; sometimes tables are not updated or are duplicated.
- **Button responsiveness:** Show more and Update Metrics buttons are mostly fixed, but modal feedback and reliability are still being improved.
- **Markdown/HTML stripping:** Resolved; content column is clean.
- **Logging:** Logging policy added; plan to reduce debug output.
- **Current focus:** Ensuring reliable table updates and user feedback after scraping.

# Testing Guide

## Version 0.3.0 Testing Requirements

### Core Functionality Testing

#### Metric Icon Picker
- [ ] Verify icon selection in Metric Editor Modal
- [ ] Test keyboard navigation in icon picker
- [ ] Confirm icon persistence after save
- [ ] Check icon rendering in tables and settings

#### CSV Export/Import
- [ ] Test metrics configuration export/import
- [ ] Verify metrics data CSV export
- [ ] Check CSV formatting and data integrity
- [ ] Test with various metric configurations

#### 'This Week' Filter
- [ ] Verify week start day setting
- [ ] Test filter with different date ranges
- [ ] Check filter persistence
- [ ] Verify filter updates table correctly

#### Readable Line Length Widget
- [ ] Test toggle in settings
- [ ] Test toggle in project note
- [ ] Verify sync between settings and note
- [ ] Check table width changes

### UI/UX Testing

#### Table Functionality
- [ ] Verify column sorting
- [ ] Test date and metric filtering
- [ ] Check expand/collapse content
- [ ] Verify table width adjustments
- [ ] Test mobile responsiveness

#### Modal Testing
- [ ] Test file/folder selection
- [ ] Verify autocomplete functionality
- [ ] Check backup creation
- [ ] Test Open Metrics Note button
- [ ] Verify progress indicators

#### Theme Compatibility
- [ ] Test with light themes
- [ ] Test with dark themes
- [ ] Verify custom theme support
- [ ] Check mobile theme rendering

### Performance Testing

#### Table Performance
- [ ] Test with large datasets
- [ ] Verify sorting performance
- [ ] Check filtering response time
- [ ] Test content expansion speed

#### Memory Usage
- [ ] Monitor memory during operations
- [ ] Check for memory leaks
- [ ] Verify cleanup after operations
- [ ] Test long-running sessions

### Error Handling

#### Backup System
- [ ] Test backup creation
- [ ] Verify backup restoration
- [ ] Check error handling
- [ ] Test backup file naming

#### Data Validation
- [ ] Test invalid metric values
- [ ] Verify error messages
- [ ] Check data persistence
- [ ] Test recovery from errors

### Accessibility Testing

#### Keyboard Navigation
- [ ] Test all interactive elements
- [ ] Verify focus management
- [ ] Check keyboard shortcuts
- [ ] Test screen reader compatibility

#### Visual Accessibility
- [ ] Verify color contrast
- [ ] Check text scaling
- [ ] Test high contrast mode
- [ ] Verify focus indicators

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Console logs
6. Obsidian version
7. Plugin version
8. Theme being used

## Test Environment

- Obsidian version: 0.15.0 or higher
- Operating systems: Windows, macOS, Linux
- Mobile devices: iOS, Android
- Various screen sizes and resolutions

## Automated Testing

- [ ] Unit tests for core functions
- [ ] Integration tests for Obsidian API
- [ ] End-to-end tests for workflows
- [ ] Performance benchmarks

## Styling and UI Testing

### Button System Testing
1. **Base Button Styles**
   - Verify `.oom-button` base styles are applied correctly
   - Check hover and focus states
   - Confirm proper spacing and alignment
   - Test in both light and dark themes

2. **Button Variants**
   - Test `.oom-button--primary` for primary actions
   - Test `.oom-button--secondary` for secondary actions
   - Test `.oom-button--expand` for expand/collapse functionality
   - Test `.oom-button--batch` for batch actions
   - Verify each variant has appropriate hover/focus states

3. **Button Interactions**
   - Test click handlers for all button types
   - Verify proper event propagation
   - Check keyboard navigation (Tab, Enter, Space)
   - Test screen reader compatibility
   - Verify proper ARIA attributes

4. **Button States**
   - Test disabled state styling
   - Verify loading state indicators
   - Check active/pressed states
   - Test focus ring visibility
   - Verify proper color contrast

5. **Button Accessibility**
   - Verify proper ARIA labels
   - Test keyboard navigation
   - Check screen reader announcements
   - Verify focus management
   - Test color contrast ratios

### Table Testing

## Recent Changes
- **New Optional Metrics Added:**
  - Dream Theme (Categorical/Keywords)
  - Lucidity Level (Score 1-5)
  - Dream Coherence (Score 1-5)
  - Setting Familiarity (Score 1-5)
  - Ease of Recall (Score 1-5)
  - Recall Stability (Score 1-5)

- **Metric Order Updated:**
  - **Default Metrics:** Sensory Detail, Emotional Recall, Descriptiveness, Characters Role, Confidence Score
  - **Optional Metrics:** Characters Count, Familiar Count, Unfamiliar Count, Characters List, Dream Theme, Lucidity Level, Dream Coherence, Setting Familiarity, Ease of Recall, Recall Stability

- **UI Enhancements:**
  - Optional metrics are now displayed in a collapsible section, improving usability and reducing visual clutter.

## Testing New Features
- **Optional Metrics:**
  - Verify that all new optional metrics are displayed correctly in the settings panel.
  - Test the collapsible section to ensure it toggles visibility as expected.
  - Check that the metrics can be enabled/disabled and edited without issues.

- **Metric Order:**
  - Confirm that the default and optional metrics are displayed in the specified order.

- **UI Enhancements:**
  - Test the collapsible section for optional metrics to ensure it functions correctly and improves usability.

## General Testing Guidelines
- Ensure all features work as expected across different environments and devices.
- Report any issues or bugs encountered during testing.

## Contributing
If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## UI Improvements
- **Metrics Descriptions Modal:** A dedicated modal now displays all metric descriptions (default and optional) with a landscape layout, improved table borders, and Lucide icons integrated into headings. This modal is accessible via a 'Metrics Descriptions' button in the settings page.

### Recent Fixes Testing (May 12, 2025)

#### Time Filter Integration
- [ ] Event Handling
  - [ ] Filter updates when file is modified
  - [ ] Filter updates on layout changes
  - [ ] Filter updates on workspace resize
  - [ ] Filter updates on active leaf change
  - [ ] Filter state persists between tab switches
  - [ ] Console shows proper event logging

#### Date Display
- [ ] Date Parsing
  - [ ] YYYY-MM-DD format displays correctly
  - [ ] Block reference format (^YYYYMMDD) displays correctly
  - [ ] Journal date format displays correctly
  - [ ] Invalid dates show appropriate error handling
  - [ ] Console shows date parsing attempts
  - [ ] Date sorting works correctly

#### Expand/Collapse Functionality
- [ ] Button Behavior
  - [ ] Buttons toggle content visibility
  - [ ] Button text updates correctly
  - [ ] ARIA attributes update properly
  - [ ] Content expands/collapses smoothly
  - [ ] Multiple buttons work independently
  - [ ] Console shows button interaction logs

#### Logging Verification
- [ ] Console Logs
  - [ ] Date parsing attempts are logged
  - [ ] Filter updates are logged
  - [ ] Button interactions are logged
  - [ ] Content visibility changes are logged
  - [ ] Table updates are logged
  - [ ] Error states are properly logged

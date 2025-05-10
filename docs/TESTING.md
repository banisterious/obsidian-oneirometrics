## OneiroMetrics Testing Guide

### Setup Testing

- [x] Plugin installs correctly in Obsidian
- [x] Plugin appears in the community plugins list
- [x] Plugin can be enabled/disabled without errors
- [x] Plugin settings are accessible
- [x] Plugin icon appears in the ribbon

### Settings Testing

- [x] Project note path can be set and saved
- [x] Selected notes can be added and removed using multi-chip autocomplete in both Settings and the modal
- [x] Chips are pre-populated from Settings in the modal
- [x] Removing a chip updates the selected notes
- [x] Adding a chip via autocomplete works as expected
- [x] Modal and Settings selected notes stay in sync
- [x] Callout name can be modified
- [x] Settings persist after Obsidian restart
- [x] Invalid paths are handled gracefully
- [x] File suggestions work in the project note path field
- [x] File suggestions work for paths with spaces and special characters (e.g., 'Journals/Dream Diary/Dream Diary.md')
- [x] Year-based paths are suggested correctly (e.g., typing '2025' suggests 'Journals/2025/2025.md')
- [x] "Scrape Notes" vs "Scrape Folder" toggle works correctly
- [x] "Choose Notes" label is displayed correctly
- [x] Lost Segments label shows "Any integer" (not "Range 0-10")
- [x] Metrics Table font size is consistent for all columns, especially Confidence Score

### Metrics Scraping

- [x] Scrape button works from modal
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

### Metrics Table - Summary Section

- [x] Table renders correctly
- [x] All metrics are displayed
- [x] Averages are calculated correctly
- [x] Min/Max values are correct
- [x] Count values are accurate
- [x] Table is responsive on different screen sizes

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
- [ ] Markdown elements are properly stripped:
  - [ ] Journal page callouts (e.g., [!journal-page|right])
  - [ ] Image embeds with dimensions (e.g., !image.png|400)
  - [ ] Wiki links
  - [ ] HTML tags
  - [ ] Horizontal rules
  - [ ] Multiple newlines

### Filtering and Sorting

- [x] Date range filter works
  - [x] All Time option
  - [x] Last Month option
  - [x] Last Week option
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
- [x] Buttons have proper hover states
- [x] Links have proper hover states
- [x] Text is readable
- [x] Spacing is consistent
- [x] UI is responsive
- [x] No horizontal scrolling on desktop
- [x] Mobile view is usable
- [x] Table overrides readable line length setting
- [x] Table maintains full width regardless of theme settings
- [x] Column widths are optimized:
  - [x] Date column (8%)
  - [x] Dream Title column (15%)
  - [x] Words column (7%)
  - [x] Content column (30%)
  - [x] Metric columns (8% each)
- [x] Progress modal styling matches theme
- [x] Suggestion containers use CSS classes instead of inline styles

### Error Handling

- [x] Invalid file paths show appropriate errors
- [x] Missing metrics show appropriate messages
- [x] Network errors are handled gracefully
- [x] Permission errors are handled gracefully
- [x] Invalid data formats are handled gracefully
- [ ] Backup creation errors show appropriate messages
- [ ] User is prompted to proceed without backup if backup fails

### Performance

- [x] Plugin loads quickly
- [x] Tables render quickly
- [x] Sorting is responsive
- [x] Filtering is responsive
- [x] No lag when expanding content
- [x] Memory usage is reasonable
- [x] Batch processing improves performance with large datasets
- [x] Lazy loading improves table performance
- [x] Progress indicator updates smoothly

### Browser Compatibility

- [x] Works in Chrome
- [x] Works in Firefox
- [x] Works in Safari
- [x] Works in Edge

### Theme Compatibility

- [x] Works with Light theme
- [x] Works with Dark theme
- [x] Works with custom themes
- [x] Colors adapt to theme changes

### Backup System Testing

- [ ] Backup is created before table update
- [x] Backup filename includes timestamp
- [x] Backup contains complete note content
- [x] Backup is created in correct location
- [x] Backup can be restored if needed
- [x] Multiple backups are handled correctly
- [x] Backup process doesn't block UI
- [ ] Backup errors are handled gracefully
- [x] Backup files are visually distinct in file explorer
- [x] Backup process works with large files
- [x] Backup is triggered on content changes
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
- [x] Test with 10+ metrics
- [x] Test with large content (1000+ words)
- [x] Monitor memory usage
- [x] Check load times
- [x] Verify smooth scrolling
- [x] Check filter response time
- [x] Check sort response time
- [x] Test batch processing performance
- [x] Test lazy loading performance
- [x] Monitor progress indicator updates

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

- [ ] Modal behavior
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

- [ ] Windows compatibility
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

# OneiroMetrics Testing Guide

## Setup Testing
- [ ] Plugin installs correctly in Obsidian
- [ ] Plugin appears in the community plugins list
- [ ] Plugin can be enabled/disabled without errors
- [ ] Plugin settings are accessible
- [ ] Plugin icon appears in the ribbon

## Settings Testing
- [ ] Project note path can be set and saved
- [ ] Selected notes can be added and removed using multi-chip autocomplete in both Settings and the modal
- [ ] Chips are pre-populated from Settings in the modal
- [ ] Removing a chip updates the selected notes
- [ ] Adding a chip via autocomplete works as expected
- [ ] Modal and Settings selected notes stay in sync
- [ ] Callout name can be modified
- [ ] Settings persist after Obsidian restart
- [ ] Invalid paths are handled gracefully
- [ ] File suggestions work in the project note path field
- [ ] File suggestions work for paths with spaces and special characters (e.g., 'Journals/Dream Diary/Dream Diary.md')
- [ ] Year-based paths are suggested correctly (e.g., typing '2025' suggests 'Journals/2025/2025.md')
- [ ] "Scrape Notes" vs "Scrape Folder" toggle works correctly
- [ ] "Choose Notes" label is displayed correctly

## Metrics Scraping
- [ ] Scrape button works from modal
- [ ] Scrape command works from command palette
- [ ] Progress is shown during scraping with detailed status
- [ ] Batch processing works for large datasets
- [ ] Errors are handled gracefully
- [ ] Backup is created before overwriting
- [ ] Confirmation dialog appears before overwriting
- [ ] Progress modal shows:
  - [ ] Current file being processed
  - [ ] Number of entries found
  - [ ] Number of callouts found
  - [ ] Overall progress bar

## Metrics Table - Summary Section
- [ ] Table renders correctly
- [ ] All metrics are displayed
- [ ] Averages are calculated correctly
- [ ] Min/Max values are correct
- [ ] Count values are accurate
- [ ] Table is responsive on different screen sizes

## Metrics Table - Detailed Section
- [ ] Table renders correctly
- [ ] All columns are present
- [ ] Data is sorted by date by default
- [ ] Clickable dream titles work
- [ ] Links navigate to correct journal entries
- [ ] Word counts are accurate
- [ ] Lazy loading works for large datasets
- [ ] Table performance is smooth with 100+ entries

## Content Display
- [ ] Content preview shows first 200 characters
- [ ] Gradient fade effect works in preview
- [ ] "Show more" button appears for long content
- [ ] "Show less" button appears when expanded
- [ ] Paragraph breaks are preserved
- [ ] Text wrapping works correctly
- [ ] Content is properly formatted
- [ ] Font size and colors match theme
- [ ] Markdown elements are properly stripped:
  - [ ] Journal page callouts (e.g., [!journal-page|right])
  - [ ] Image embeds with dimensions (e.g., !image.png|400)
  - [ ] Wiki links
  - [ ] HTML tags
  - [ ] Horizontal rules
  - [ ] Multiple newlines

## Filtering and Sorting
- [ ] Date range filter works
  - [ ] All Time option
  - [ ] Last Month option
  - [ ] Last Week option
- [ ] Metric filter works
  - [ ] All Metrics option
  - [ ] Individual metric options
- [ ] Column sorting works
  - [ ] Date column
  - [ ] Title column
  - [ ] Words column
  - [ ] Metric columns
- [ ] Sort indicators show correct direction

## Styling and UI
- [ ] Tables match Obsidian theme
- [ ] Hover effects work on rows
- [ ] Buttons have proper hover states
- [ ] Links have proper hover states
- [ ] Text is readable
- [ ] Spacing is consistent
- [ ] UI is responsive
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

## Error Handling
- [ ] Invalid file paths show appropriate errors
- [ ] Missing metrics show appropriate messages
- [ ] Network errors are handled gracefully
- [ ] Permission errors are handled gracefully
- [ ] Invalid data formats are handled gracefully
- [ ] Backup creation errors show appropriate messages
- [ ] User is prompted to proceed without backup if backup fails

## Performance
- [ ] Plugin loads quickly
- [ ] Tables render quickly
- [ ] Sorting is responsive
- [ ] Filtering is responsive
- [ ] No lag when expanding content
- [ ] Memory usage is reasonable
- [ ] Batch processing improves performance with large datasets
- [ ] Lazy loading improves table performance
- [ ] Progress indicator updates smoothly

## Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

## Theme Compatibility
- [ ] Works with Light theme
- [ ] Works with Dark theme
- [ ] Works with custom themes
- [ ] Colors adapt to theme changes

## Backup System Testing
- [ ] Backup is created before table update
- [ ] Backup filename includes timestamp
- [ ] Backup contains complete note content
- [ ] Backup is created in correct location
- [ ] Backup can be restored if needed
- [ ] Multiple backups are handled correctly
- [ ] Backup process doesn't block UI
- [ ] Backup errors are handled gracefully
- [ ] Backup files are visually distinct in file explorer
- [ ] Backup process works with large files
- [ ] Backup is triggered on content changes
- [ ] Backup is triggered before scraping

## Notes for Testing
1. Test with various dream journal entry lengths
2. Test with different metric combinations
3. Test with special characters in content
4. Test with different date ranges
5. Test with different screen sizes
6. Test with different Obsidian themes
7. Test with large datasets (100+ entries)
8. Test backup creation with different file sizes
9. Test progress indicator with various dataset sizes

## Bug Reporting Template
When reporting bugs, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Obsidian version
6. Plugin version
7. Operating system
8. Any error messages from the console

## Performance Testing
- [ ] Test with 100+ dream entries
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

## Troubleshooting: File Suggestion Issues

If a file path does not appear in suggestions:
- [ ] Confirm the file and all parent folders exist in your vault
- [ ] Check for typos, extra spaces, or case mismatches
- [ ] Try typing the full path, including spaces and special characters
- [ ] Try replacing spaces with dashes or underscores
- [ ] If the file was recently created or renamed, restart Obsidian or reload the vault
- [ ] Ensure the file is not hidden or excluded by Obsidian settings
- [ ] If the issue persists, report it with details (see Bug Reporting Template)

## Recent Changes to Test
1. Progress Indicator:
   - [ ] Shows current file being processed
   - [ ] Shows number of entries found
   - [ ] Shows number of callouts found
   - [ ] Progress bar updates smoothly
   - [ ] Modal styling matches theme

2. Batch Processing:
   - [ ] Processes files in batches of 5
   - [ ] UI remains responsive during processing
   - [ ] Progress updates between batches
   - [ ] Handles large datasets efficiently

3. CSS Improvements:
   - [ ] All styles use CSS classes
   - [ ] No inline styles present
   - [ ] Theme compatibility maintained
   - [ ] Responsive design preserved

4. Backup System:
   - [ ] Backup triggered on content changes
   - [ ] Backup triggered before scraping
   - [ ] Error handling improved
   - [ ] User confirmation for failed backups

## Testing Methodologies

### Automated Unit Testing
These tests can be run automatically without Obsidian, focusing on pure functions and data processing.

#### Core Functions
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

#### Data Processing
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

#### Utility Functions
- [ ] Array operations
- [ ] String manipulation
- [ ] Data validation
- [ ] Type checking

### Manual Integration Testing
These tests require Obsidian and manual verification.

#### Obsidian API Integration
- [ ] File reading/writing
- [ ] Settings persistence
- [ ] Plugin lifecycle
- [ ] Event handling

#### UI Components
- [ ] Modal behavior
- [ ] Table rendering
- [ ] Progress indicators
- [ ] Suggestion system
- [ ] Theme integration

#### File System Operations
- [ ] Backup creation
- [ ] File path resolution
- [ ] Error handling
- [ ] Permission checks

### Manual End-to-End Testing
Complete user workflows that require manual verification.

#### User Flows
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

#### Cross-Platform Testing
- [ ] Windows compatibility
- [ ] macOS compatibility
- [ ] Linux compatibility
- [ ] Mobile compatibility

#### Performance Testing
- [ ] Large dataset handling
- [ ] Memory usage
- [ ] UI responsiveness
- [ ] Backup performance

### Test Environment Setup

#### Automated Tests
- [ ] Jest configuration
- [ ] Test data fixtures
- [ ] Mock functions
- [ ] CI/CD pipeline

#### Manual Tests
- [ ] Test vault setup
- [ ] Sample dream journals
- [ ] Various theme configurations
- [ ] Different Obsidian versions

### Testing Tools

#### Automated Testing
- [ ] Jest for unit tests
- [ ] TypeScript compiler for type checking
- [ ] ESLint for code quality
- [ ] Prettier for code formatting

#### Manual Testing
- [ ] Obsidian Developer Tools
- [ ] Browser DevTools
- [ ] Performance monitoring
- [ ] Error logging

### Test Coverage Goals

#### Automated Tests
- [ ] Core functions: 90%+
- [ ] Data processing: 85%+
- [ ] Utility functions: 95%+

#### Manual Tests
- [ ] User workflows: 100%
- [ ] Error scenarios: 100%
- [ ] Edge cases: 100%

## Feature Implementation Details

### CSV Export Feature

#### Core Functionality
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

#### Export Types
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

#### File Handling
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

#### Data Processing
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

#### UI Components
- [ ] Export button in table header
- [ ] Export options modal
  - Column selection
  - Date range selection
  - Export type selection
  - Format options
- [ ] Progress indicator
- [ ] Success/error notifications

#### Performance Considerations
- [ ] Chunked processing for large datasets
- [ ] Memory usage optimization
- [ ] Background processing
- [ ] Progress updates
- [ ] Cancellation support

#### Error Handling
- [ ] File system errors
- [ ] Memory limits
- [ ] Invalid data
- [ ] User cancellation
- [ ] Timeout handling

#### Testing Requirements
- [ ] Unit tests for CSV generation
- [ ] Integration tests for file handling
- [ ] Performance tests for large datasets
- [ ] UI component tests
- [ ] Error handling tests

#### Example Usage
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
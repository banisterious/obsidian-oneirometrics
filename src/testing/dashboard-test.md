# OneiroMetrics Dashboard Testing Guide

## Phase 2 Implementation Complete

The OneiroMetrics Dashboard now includes data extraction functionality that:

1. **Extracts dream entries without HTML generation**: Uses the UniversalMetricsCalculator's parsing methods directly
2. **Respects configuration toggles**: 
   - Plain text dreams (when enabled)
   - Callout-based structures (when enabled)  
   - Frontmatter properties (when configured)
3. **Displays actual data in the table**:
   - Date column (formatted)
   - Title column
   - Content preview (expandable with toggle)
   - Metric columns for all enabled metrics
   - Source file links (clickable to open file)

## Testing Steps

1. **Open the Dashboard**:
   - Use Command Palette: "OneiroMetrics: Open dashboard"
   - Or click the dashboard icon in the ribbon

2. **Load Data**:
   - Click the "Refresh" button
   - The dashboard will scan configured files/folders
   - Table will populate with dream entries

3. **Verify Features**:
   - **Sorting**: Click column headers to sort
   - **Filtering**: Use the date filter dropdown
   - **Search**: Type in the search box to filter entries
   - **Expand Content**: Click the arrow (▶) to expand/collapse content
   - **Open Source**: Click the source file link to open the file

## Known Issues to Debug

- If metrics aren't showing:
  1. Check that metrics are enabled in settings
  2. Verify frontmatter properties are configured correctly
  3. Check that the callout structure matches settings
  4. Use the dashboard to see what data is actually being extracted

## Implementation Details

- **Data Extraction**: `loadDreamEntriesLegacy()` creates a UniversalMetricsCalculator instance
- **Entry Parsing**: Uses `parseJournalEntries()` method from the calculator
- **Table Rendering**: `renderTableLegacy()` creates a simple HTML table
- **Event Handling**: `attachTableEventHandlers()` manages expand/collapse and sorting
- **CSS Classes**: All use "oom-" prefix for proper scoping

## Next Steps

- Add metric aggregation statistics
- Implement data export functionality
- Add chart visualizations
- Optimize for large datasets with virtual scrolling
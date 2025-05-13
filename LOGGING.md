# OneiroMetrics Logging System

## Overview
The logging system provides detailed information about the plugin's operation, helping with debugging and monitoring.

## Log Categories

### Date Handling
```typescript
// Date parsing attempts
console.log(`[OneiroMetrics] Processing date for table: ${date}`);
console.log(`[OneiroMetrics] Found YYYY-MM-DD format: ${year}-${month}-${day}`);
console.log(`[OneiroMetrics] Successfully formatted date: ${formattedDate}`);

// Date parsing errors
console.error(`[OneiroMetrics] Failed to parse date components: ${year}-${month}-${day}`);
console.error(`[OneiroMetrics] Date format not recognized: ${date}`);
```

### Time Filter
```typescript
// Filter updates
console.log('[OneiroMetrics] Layout changed, checking for filter updates');
console.log('[OneiroMetrics] New filter detected:', currentFilter.name);
console.log('[OneiroMetrics] Filter date range:', dateRange);
console.log('[OneiroMetrics] Table updated with filter:', currentFilter.name, 'Visible entries:', visibleCount);
```

### Expand/Collapse
```typescript
// Button interactions
console.log('[OneiroMetrics] Expand button clicked');
console.log('[OneiroMetrics] Current expanded state:', isExpanded);
console.log('[OneiroMetrics] Content visibility toggled:', {
    previewDisplay: preview.style.display,
    fullDisplay: full.style.display,
    buttonState: newButton.getAttribute('aria-expanded')
});
```

### Table Operations
```typescript
// Table updates
console.log('[OneiroMetrics] Generating table with ${dreamEntries.length} entries');
console.log('[OneiroMetrics] Using cached table data');
console.log('[OneiroMetrics] Table generation complete');
```

## Log Format
All logs follow the format: `[OneiroMetrics] <message>`

## Debug Information
- Date parsing attempts and results
- Filter updates and changes
- Button interactions
- Content visibility toggling
- Table updates and modifications

## Error Handling
- Invalid date formats
- Missing elements
- Failed operations

## Usage
Check the browser console (DevTools) for detailed logs during plugin operation. 
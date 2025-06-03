# Test Enhanced Date Parsing

This is a test file to verify that the enhanced date parsing works correctly with different dateHandling configurations.

## Test Cases

### Header Date Format Test
```javascript
// Test case 1: Header date format
const journalLines = ['[!journal] January 6, 2025'];
const dateHandling = {
    placement: 'header',
    headerFormat: 'MMMM d, yyyy',
    fieldFormat: 'Date:',
    includeBlockReferences: false,
    blockReferenceFormat: '^YYYYMMDD'
};
// Expected result: '2025-01-06'
```

### Field Date Format Test
```javascript
// Test case 2: Field date format
const journalLines = [
    '[!dream-diary]',
    'Date: 2025-01-06',
    'Content goes here...'
];
const dateHandling = {
    placement: 'field',
    headerFormat: 'MMMM d, yyyy',
    fieldFormat: 'Date:',
    includeBlockReferences: false,
    blockReferenceFormat: '^YYYYMMDD'
};
// Expected result: '2025-01-06'
```

### Block Reference Test
```javascript
// Test case 3: Block reference format
const journalLines = ['[!journal] Some title ^20250106'];
const dateHandling = {
    placement: 'field',
    headerFormat: 'MMMM d, yyyy',
    fieldFormat: 'Date:',
    includeBlockReferences: true,
    blockReferenceFormat: '^YYYYMMDD'
};
// Expected result: '2025-01-06'
```

### Backward Compatibility Test
```javascript
// Test case 4: Legacy format (no dateHandling provided)
const journalLines = ['[!journal] Monday, January 6, 2025'];
// No dateHandling config provided - should fall back to legacy parsing
// Expected result: '2025-01-06'
```

These tests should be run in the OneiroMetrics testing environment to verify the comprehensive date handling system works correctly. 
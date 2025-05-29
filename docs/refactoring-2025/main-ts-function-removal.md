# Refactoring Plan - main.ts Functions Removal

The following functions have been extracted to the TableManager class and should be removed from main.ts:

1. **initializeTableRowClasses** (lines 2063-2250)
2. **collectVisibleRowMetrics** (lines 2251-2363)
3. **updateSummaryTable** (lines 2364-2365, currently empty)

Attempts to remove these functions using the edit_file tool and PowerShell automation have failed due to the file size and complexity. Manual editing will be required.

## Manual Removal Instructions

To manually remove these functions:

1. Open main.ts in a text editor
2. Remove the function `initializeTableRowClasses` (approximately lines 2063-2250)
   - Start from the line with `// REMOVE: This function has been extracted to TableManager and should be removed`
   - Delete everything up to and including the closing `}` of the function
   
3. Remove the function `collectVisibleRowMetrics` (approximately lines 2251-2363)
   - Start from the line with `// REMOVE: This function has been extracted to TableManager and should be removed`
   - Delete everything up to and including the closing `}` of the function
   
4. Remove the function `updateSummaryTable` (approximately lines 2364-2365)
   - Start from the line with `// REMOVE: This function has been extracted to TableManager and should be removed`
   - Delete everything up to and including the closing `}` of the function

After removing these functions, ensure that there are no lingering references to them in the codebase. All calls should now use the TableManager instance methods:

```typescript
this.tableManager.initializeTableRowClasses();
this.tableManager.collectVisibleRowMetrics(element);
this.tableManager.updateSummaryTable(element, metrics);
```

## Implementation Status

| Function | Extracted To | Status | Date | Notes |
|----------|-------------|--------|------|-------|
| initializeTableRowClasses | TableManager.initializeTableRowClasses | ✅ Extracted<br>❌ Not Removed | 2025-05-29 | Extracted but original remains |
| collectVisibleRowMetrics | TableManager.collectVisibleRowMetrics | ✅ Extracted<br>❌ Not Removed | 2025-05-29 | Extracted but original remains |
| updateSummaryTable | TableManager.updateSummaryTable | ✅ Extracted<br>✅ Emptied<br>❌ Not Removed | 2025-05-29 | Function body emptied but shell remains |

## Results of Automated Removal Attempts

Multiple approaches were tried to automate the removal:

1. Using the edit_file tool directly - Failed due to file size limitations
2. Using PowerShell regex replacement - Failed due to complex multiline matching
3. Using PowerShell line extraction - Failed due to line ending inconsistencies

The recommendation is to proceed with manual editing in a proper code editor with the ability to handle large files.

## Next Steps

1. Manually remove these functions from main.ts
2. Update any remaining references to use the TableManager methods
3. Test to ensure all functionality works correctly
4. Update this document when completed 
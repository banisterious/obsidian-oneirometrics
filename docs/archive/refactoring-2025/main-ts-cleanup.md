# Refactoring Plan - main.ts

> **📁 ARCHIVED DOCUMENT** ✅  
> **Date Archived**: January 2025  
> **Status**: Cleanup completed successfully  
> **Outcome**: All 3 functions successfully moved to TableManager as planned  
> **Verification**: Functions no longer exist in main.ts, properly delegated to TableManager

Functions to remove:

1. initializeTableRowClasses ✅ **COMPLETED** - Now called via `this.tableManager.initializeTableRowClasses()`
2. collectVisibleRowMetrics ✅ **COMPLETED** - Successfully moved to TableManager
3. updateSummaryTable ✅ **COMPLETED** - Successfully moved to TableManager

All have been moved to TableManager.

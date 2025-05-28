# main.ts Refactoring Plan

## Overview

This document outlines the plan for breaking down the large main.ts file (5890 lines) into smaller, more maintainable modules. This is a critical part of the code cleanup plan.

## Current State

The `main.ts` file currently contains:

1. UI Components (modals, tables, DOM manipulation)
2. Metrics Processing (calculation, aggregation)
3. Event Handlers (button clicks, interactions)
4. Settings Management (loading, saving)
5. Utility Functions (date handling, formatting)

## Refactoring Progress

| Component | Description | Status | Date | Notes |
|-----------|-------------|--------|------|-------| 
| Date Functions | Date validation, parsing, formatting | ✅ Complete | 2025-05-26 | Moved to src/utils/date-utils.ts |
| Logging | Debug logging statements | ✅ Complete | 2025-05-28 | Converted to structured logging |
| UI Components | Modal generation, tables | 🔄 80% Complete | 2025-05-29 | Extracted TableGenerator, ContentToggler, and FilterUI |
| Metrics Processing | Calculation, organization | 🔄 70% Complete | 2025-05-29 | Moved to src/metrics/MetricsProcessor.ts |
| Event Handlers | Button clicks, interactions | ✅ Complete | 2025-05-28 | Created ProjectNoteEvents and FilterEvents classes |
| Settings | Loading, saving | ✅ Complete | 2025-05-30 | Implemented SettingsManager class for centralized settings handling |

## Next Steps

### 1. Complete Metrics Processing (30% remaining)

- ✅ Moved the following methods from main.ts to MetricsProcessor.ts:
  - ✅ `processMetrics()` (line ~1658)
  - ✅ `processDreamContent()` (line ~1641)
- Remaining: Content parsing logic from scrapeMetrics() 

### 2. Continue UI Components Refactoring (20% remaining)

- ✅ Created TableGenerator class in src/dom/tables/:
  - ✅ Moved `generateSummaryTable()` (line ~1907)
  - ✅ Moved `generateMetricsTable()` (line ~2072)

- ✅ Created ContentToggler class in src/dom/content/:
  - ✅ Moved `updateContentVisibility()` (line ~3086)
  - ✅ Moved `toggleContentVisibility()` (line ~5641)
  - ✅ Moved `expandAllContentSections()` (line ~5752)

- ✅ Created FilterUI class in src/dom/filters/:
  - ✅ Moved `applyFilters()` (line ~2504)
  - ✅ Moved `applyFilterToDropdown()` (line ~3792)
  - ✅ Moved `forceApplyFilterDirect()` (line ~3891)
  - ✅ Moved `forceApplyDateFilter()` (line ~4630)
  - ✅ Moved `applyCustomDateRangeFilter()` (line ~4729)

### 3. Complete Event Handlers Refactoring

- ✅ Created ProjectNoteEvents class in src/events/:
  - ✅ Moved `attachProjectNoteEventListeners()` (line ~2276)
  - ✅ Extracted helper methods for button events, debug functionality, and content toggles
  - ✅ Added proper error handling and logging

- ✅ Created FilterEvents class in src/events/:
  - ✅ Extracted filter-related event handlers
  - ✅ Moved custom range modal functionality (line ~4491)
  - ✅ Moved date range helper functions
  - ✅ Integrated with FilterUI class

### 4. Settings Management Refactoring (Complete)

- ✅ Implemented SettingsManager in src/state/SettingsManager.ts:
  - ✅ Moved `saveSettings()` (line ~963)
  - ✅ Moved `loadSettings()` (line ~984)
  - ✅ Integrated with SettingsAdapter
  - ✅ Updated plugin to use SettingsManager for all settings operations
  - ✅ Added methods for updating settings safely
  - ✅ Added proper error handling and logging

## Implementation Approach

For each component:

1. Create the new file with appropriate structure and imports
2. Move the code from main.ts to the new file
3. Update main.ts to use the new component
4. Test to ensure functionality is preserved
5. Add proper error handling and logging
6. Document the changes in the code-cleanup-plan.md

## Success Criteria

- Reduce main.ts to under 1000 lines
- All functionality works as before
- Improved error handling
- Better code organization
- Maintainable component structure

## Timeline

| Component | Target Completion | Priority |
|-----------|-------------------|----------|
| Metrics Processing | 2025-06-01 | High |
| UI Components | 2025-06-07 | High |
| Event Handlers | 2025-06-14 | Medium |
| Settings Management | ✅ 2025-05-30 | Medium | 
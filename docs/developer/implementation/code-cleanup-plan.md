# Code Cleanup Plan

## Table of Contents
- [Executive Summary](#executive-summary)
- [Key Milestones](#key-milestones)
- [Types of Dead Code](#types-of-dead-code)
- [Implementation Strategy](#implementation-strategy)
- [Priority Areas](#priority-areas)
- [Implementation Plan](#implementation-plan)
  - [Phase 1: Logging Cleanup](#phase-1-logging-cleanup)
  - [Phase 2: Import Cleanup](#phase-2-import-cleanup)
    - [Main.ts Import Optimization](#21-maints-import-optimization-2025-05-30)
  - [Phase 3: Transitional Code Removal](#phase-3-transitional-code-removal)
    - [Extract Large Methods from DreamMetricsPlugin Class](#31-extract-large-methods-from-dreammetricsplugin-class)
    - [Extract Standalone Utility Functions](#32-extract-standalone-utility-functions)
      - [Additional Standalone Functions Identified](#321-additional-standalone-functions-identified-for-extraction-2025-05-30)
      - [Large Configuration Objects for Extraction](#322-large-configuration-objects-for-extraction)
      - [Wrapper Methods That Just Delegate](#323-wrapper-methods-that-just-delegate)
      - [Global Variables and State for Encapsulation](#324-global-variables-and-state-for-encapsulation)
    - [Additional main.ts Line Count Reduction](#33-additional-maints-line-count-reduction)
  - [Phase 4: Unused Code Elimination](#phase-4-unused-code-elimination)
    - [Main.ts Dead Code Summary](#41-maints-dead-code-summary-2025-05-30)
      - [Critical Priority Items](#411-critical-priority-items-largest-impact)
      - [Additional Large Extraction Opportunities (new Analysis - 2025-05-30)](#412-additional-large-extraction-opportunities-new-analysis-2025-05-30)
      - [Implementation Roadmap](#414-implementation-roadmap)
      - [Success Metrics](#415-success-metrics)
  - [Phase 5: TypeScript Adapter Cleanup](#phase-5-typescript-adapter-cleanup)
- [Success Criteria](#success-criteria)
- [Next Steps](#next-steps)
- [Progress Tracking](#progress-tracking)

## Related Documents
- [Post-Refactoring Roadmap](post-refactoring-roadmap.md) - Overall roadmap for post-refactoring improvements
- [Defensive Coding Implementation Plan](../../planning/tasks/defensive-coding-implementation.md) - Implementation plan for defensive coding patterns
- [API Integration Hardening Plan](../../planning/tasks/api-integration-hardening-plan.md) - Specific plan for hardening API integrations

## Executive Summary

This document outlines the plan for systematically eliminating dead code as part of the Phase 1: Code Cleanup in the Post-Refactoring Roadmap.

## Key Milestones

| Milestone | Status | Date | Description |
|-----------|--------|------|-------------|
| Adapter Migration | ✅ Complete | 2025-05-26 | All adapter modules have permanent implementations |
| Type System Migration | ✅ Complete | 2025-05-25 | All imports now use domain-specific type modules |
| Logging System Refactoring | ✅ Complete | 2025-05-28 | Replaced all console.log with structured logging (100%) |
| main.ts Cleanup | ✅ Complete | 2025-05-28 | Refactored core functionality into modules (100%) |
| Date Utils Refactoring | ✅ Complete | 2025-05-26 | Centralized date handling functions |
| TypeScript Error Resolution | 🔄 In Progress | 2025-05-28 | Fixing remaining TypeScript errors |
| Performance Optimization | ⬜ Not Started | - | Optimizing key operations for better performance |

## Types of Dead Code

Our analysis identified several categories of dead code in the codebase:

1. **Debug Console.log Statements**
   - Numerous `console.log` statements used for debugging
   - Should be replaced with proper logging using the LoggingService

2. **Commented-Out Code**
   - Code blocks that are commented out but kept "just in case"
   - Redundant with version control, should be removed

3. **Redundant Imports**
   - Multiple import statements from the same module
   - Can be consolidated for better readability and reduced bundle size

4. **Transitional Code**
   - Code kept during transitions (e.g., from types.ts refactoring)
   - Can now be fully migrated and the transitional code removed

5. **Unused Functions and Variables**
   - Functions and variables that are defined but never used
   - Should be identified and removed

6. **Outdated TODOs**
   - TODO comments for tasks that have been completed or abandoned
   - Should be addressed or removed

## Implementation Strategy

We will adopt a systematic approach to eliminate dead code:

1. **Audit and Document**
   - Run automated tools to identify dead code
   - Document findings for review
   - Prioritize areas with highest dead code concentration

2. **Iterative Cleanup**
   - Work module by module
   - Focus on one type of dead code at a time
   - Create automated tests where necessary
   - Verify each change with manual testing

3. **Validation**
   - Ensure functionality is preserved
   - Update documentation to reflect changes
   - Run the test suite to catch regressions

4. **Documentation**
   - Maintain detailed progress notes in this document for developers
   - Keep CHANGELOG.md entries concise and focused on user-facing changes
   - Document internal implementation details here rather than in CHANGELOG

## Priority Areas

Based on initial analysis, these areas have the highest concentration of dead code:

1. **Main.ts**
   - Contains multiple console.log statements
   - Has potentially unused legacy functions

2. **Types Files**
   - Old type definitions in multiple files
   - Bridge code that should be consolidated

3. **Events and DOM Components**
   - Debug logging that should use LoggingService
   - Potentially redundant event handlers

4. **Journal Check Module**
   - Transitional code from "Linting" to "Journal Structure Check"
   - Redundant imports and unused functions

## Implementation Plan

### Phase 1: Logging Cleanup ✅ COMPLETED

1. Replace `console.log` statements with appropriate `LoggingService` calls ✅
   - Use proper log levels (debug, info, warn, error) ✅
   - Add context information for better debugging ✅
   - Keep only essential logging, remove purely diagnostic logs ✅

2. Consolidate debug logging patterns ✅
   - Use consistent format for similar operations ✅
   - Add timing information for performance-sensitive operations ✅

**Progress (2025-05-23):**
- Created a global logger instance to support console.log replacement in non-class functions
- Initialized the global logger in the plugin's onload method
- Replaced console.log statements with proper logger.debug calls in:
  - main.ts (core plugin functionality)
  - src/events/DreamMetricsEvents.ts (event handling)
  - src/dom/DreamMetricsDOM.ts (DOM manipulation)
- Standardized logging format with category and structured data parameters
- Added missing NavigatorViewMode enum to fix TypeScript errors
- Used optional chaining with logger calls to prevent errors when logger is not initialized

**Progress (2025-05-27):**
- Replaced numerous console.log statements with structured logging across main.ts:
  - Updated scrapeMetrics method with proper logging levels and categories
  - Updated updateProjectNote method to use structured logging for better debugging
  - Updated backupProjectNote method with appropriate log levels
  - Updated processMetrics method with detailed structured logging
  - Updated generateMetricsTable and other UI-related methods
  - Updated settings-related methods (loadSettings, saveSettings)
  - Added the globalLogger to onunload method
- Fixed duplicate DEFAULT_LINTING_SETTINGS declaration that was causing build errors
- Renamed to DEFAULT_JOURNAL_STRUCTURE_SETTINGS for clarity
- Updated esbuild dependency to version 0.25.4 to address security vulnerability
- Verified that the build process works with the updated dependency
- Implemented structured logging using the following consistent categories:
  - 'Scrape' - For data collection processes
  - 'Metrics' - For metrics calculations
  - 'MetricsNote' - For metrics note updates
  - 'Backup' - For backup operations
  - 'Settings' - For settings operations
  - 'UI' - For user interface operations
  - 'Plugin' - For plugin lifecycle events
- Used consistent log levels across the application:
  - error - For errors that prevent operations
  - warn - For potential issues that don't prevent operation
  - info - For important operations completion
  - debug - For detailed diagnostic information

**Progress (2025-05-28):**
- Continued replacing console.log statements with structured logging:
  - Renamed 'ProjectNote' category to 'MetricsNote' to align with UI terminology
  - Converted UI-related debug logs using the 'UI' category
  - Replaced filter-related logs with the 'Filter' category
  - Added structured data parameters for better debugging context
  - Ensured consistent use of log levels (error, warn, info, debug)
  - Improved error objects with proper typing
- Standardized button interaction logging with consistent patterns
- Improved event listener logging with detailed context
- Added more descriptive messages for debugging UI interactions
- Added structured object data for complex debugging scenarios

**Progress (2025-05-28):**
- Completed significant logging refactoring across debug and test functions:
  - Updated debugTableData function with structured logging
  - Converted testContentParserDirectly function to use globalLogger
  - Refactored forceApplyDateFilter with proper structured logging
  - Updated saveFavoriteRange, deleteFavoriteRange with the Filter category
  - Converted toggleContentVisibility function to use UI category
  - Refactored expandAllContentSections with structured debug logging
  - Updated openCustomRangeModal with proper logging categories
  - Added structured data parameters to plugin lifecycle methods (onload, onunload)
  - Refactored generateMetricsTable with Table category
- Standardized error handling in all log statements:
  - Used proper Error objects with the error log level
  - Added contextual information to error messages
  - Included relevant state data in error logs for better debugging
- Improved debug logging categories for better filtering:
  - Added 'Debug' category for diagnostic functions
  - Used 'Filter' category for date filtering operations
  - Applied 'Table' category for table generation and processing
  - Employed 'UI' category for DOM manipulation operations
- Began UI component cleanup:
  - Removed the deprecated OneiroMetricsModal class
  - Created backup at src/dom/modals/OneiroMetricsModal.bak.ts for easy restoration if needed
  - Updated showMetrics() to directly use scrapeMetrics() or dreamJournalManager
  - Added fallback mechanism for safely opening Journal Manager UI
  - Simplified metrics scraping flow by removing unnecessary modal step
- Next Steps:
  - Complete remaining console.log statements in main.ts
  - Add log level controls in settings to filter debug messages
  - Implement log rotation configuration
  - Add unit tests for logging functionality

**Progress (2025-05-28):**
- Continued UI component cleanup:
  - Removed the unused ConfirmModal class
  - Created backup at src/dom/modals/ConfirmModal.bak.ts for reference
  - Removed unused confirmOverwrite() method
  - Kept confirmProceedWithoutBackup() method which is still in use
  - Added documentation comments to mark where code was removed
- Documented backed up classes:
  - Created a tracking table in the refactoring roadmap
  - Listed all classes that were backed up for future reference
- Moved scrapeMetrics functionality to dedicated module:
  - Created src/metrics/MetricsProcessor.ts to handle metrics logic
  - Disabled the problematic progress modal temporarily
  - Replaced with simple notices for status updates
  - Future task: rebuild proper progress UI with simpler design
- Backed up classes:

| Class Name | Original Location | Backup Location | Removal Date | Status | Notes |
|------------|------------------|-----------------|--------------|--------|-------|
| OneiroMetricsModal | main.ts | src/dom/modals/OneiroMetricsModal.bak.ts | June 2025 | Removed | Replaced by DreamJournalManager and direct calls to scrapeMetrics |
| ConfirmModal | main.ts | src/dom/modals/ConfirmModal.bak.ts | June 2025 | Removed | Generic confirmation dialog that was defined but not actually used in the codebase |

**Progress (2025-05-29):**
- Created new branch for dead code cleanup: refactoring/2025-dead-code
- Started with removing unused imports from key files:
  - src/api/resilience/examples/ApiResilienceDemo.ts - removed ApiRequestOptions and OfflineSupport
  - src/dom/DateNavigator.ts - removed App, MarkdownView, TFile, getSourceFile, getSourceId, and isObjectSource
  - src/dom/filters/FilterUI.ts - removed safeLogger which was imported but never used
  - src/dom/DreamMetricsDOM.ts - removed DreamMetricData, getSourceId, isObjectSource, debounce, and format
- Created a utility script (utils/clean-unused-imports.ps1) to help with the cleanup process:
  - Can identify and remove unused imports from multiple files
  - Provides different output modes: summary, patch, or edit
  - Can handle both single-line and multi-line import statements
- The utility found 121 potentially unused imports across 60 files, providing a clear roadmap for additional cleanup
- Fixed an issue with the clean-unused-imports.ps1 script related to variable delimiters
- Identified unused imports in main.ts:
  - Removed attachEvent, createEventHandler, createClickHandler, debounceEventHandler, and throttleEventHandler from EventHandling imports
  - Identified createFolderAutocomplete and createSelectedNotesAutocomplete imports for potential removal after verification
  - Identified CustomDateRangeModal import for potential removal after verification
- Verified via grep search that these imports are not used directly in main.ts
- Continued removing unused imports from more files:
  - Analyzed CustomDateRangeModal.ts - No unused imports found
  - Analyzed DreamMetricsDOM.ts - No unused imports found
  - Analyzed ApiResilienceDemo.ts - No unused imports found
  - Analyzed DateNavigator.ts - No unused imports found
  - Analyzed FilterEvents.ts - No unused imports found
  - Analyzed ProjectNoteEvents.ts - No unused imports found
  - Analyzed MetricsProcessor.ts - No unused imports found
  - Analyzed settings.ts - No unused imports found
  - Attempted to remove unused imports from main.ts - Tool identified potential unused imports but editing was unsuccessful

#### Next Steps for Import Cleanup:
- Need to verify if the unused imports in main.ts are truly unused, as the tool reported possible unused imports but might include false positives
- Consider focusing on the remaining high-impact files identified by the analysis tool
- Use the utility script with more specific file targeting

### Phase 2: Import Cleanup

1. Consolidate multiple imports from the same module
   - Group imports alphabetically
   - Remove unused imports
   - Use appropriate import syntax (named vs default)

2. Standardize import patterns
   - Consistent order (external, internal, types)
   - Consistent syntax (destructuring vs namespace)

#### 2.1 Main.ts Import Optimization (2025-05-30)

**Excessive Import Analysis - Additional Cleanup Opportunities:**

Current main.ts has extensive import statements that could be consolidated:

| Improvement Type | Estimated Lines | Priority | Status | Notes |
|------------------|-----------------|----------|--------|-------|
| Consolidate same-module imports | ~15 | Medium | ⏳ Planned | Multiple imports from same modules can be combined |
| Remove test-related imports | ~20 | Medium | ⏳ Planned | Test imports should only be conditional/development |
| Remove wrapper function imports | ~10 | Medium | ⏳ Planned | After wrapper methods are removed |
| Consolidate utility imports | ~5 | Low | ⏳ Planned | Group utility functions better |

**Test-related imports that could be conditional:**
- Multiple `run*Tests` imports (lines 181-190)
- `openContentParserTestModal`, `openDateUtilsTestModal`, etc.
- `DefensiveUtilsTestModal`

**Estimated Line Savings from Import Cleanup: ~50 lines**

**Progress (2025-05-23):**
- Reorganized imports in main.ts:
  - Grouped imports by external/internal sources
  - Ordered imports by category (external libraries, types, services, UI components)
  - Used consistent destructuring pattern with alphabetical order
  - Added clear section comments for improved readability
- Created a barrel export file for journal_check/ui components
  - Simplified importing multiple components from the same module
  - Added proper JSDoc documentation
  - Used consistent export pattern
- Reduced vertical space used by imports through better organization

### Phase 3: Transitional Code Removal

#### 3.1 Extract Large Methods from DreamMetricsPlugin Class

The main.ts file remains over 5,000 lines long, with many large methods inside the DreamMetricsPlugin class that should be extracted into separate modules. This will significantly reduce the size of main.ts and improve code organization and maintainability.

| Method Name | Lines | Target Module | Status | Date | Notes |
|-------------|-------|--------------|--------|------|-------|
| onload | ~400 | src/plugin/PluginLoader.ts | ✅ Complete | 2025-05-29 | Created PluginLoader class to handle plugin initialization |
| scrapeMetrics | ~350 | src/metrics/MetricsCollector.ts | ✅ Complete | 2025-05-29 | Created MetricsCollector class to handle metrics collection |
| generateMetricsTable | ~300 | src/dom/tables/TableGenerator.ts | ✅ Complete | 2025-05-29 | Created TableGenerator class to handle metrics table generation |
| updateProjectNote | ~250 | src/state/ProjectNoteManager.ts | ✅ Complete | 2025-05-29 | Created ProjectNoteManager class to handle project note operations |
| backupProjectNote | ~120 | src/state/ProjectNoteManager.ts | ✅ Complete | 2025-05-29 | Included in ProjectNoteManager class |
| confirmProceedWithoutBackup | ~50 | src/state/ProjectNoteManager.ts | ✅ Complete | 2025-05-29 | Included in ProjectNoteManager class |
| processMetrics | ~200 | src/metrics/MetricsProcessor.ts | ✅ Complete | 2025-05-29 | Updated main.ts to use MetricsProcessor implementation |
| buildFilterControls | ~180 | src/dom/filters/FilterControls.ts | ✅ Complete | 2025-05-29 | Created FilterControls class to handle filter UI generation |
| toggleContentVisibility | ~100 | src/dom/content/ContentToggler.ts | ✅ Complete | 2025-05-29 | Updated main.ts to use ContentToggler implementation |
| expandAllContentSections | ~80 | src/dom/content/ContentToggler.ts | ✅ Complete | 2025-05-29 | Updated main.ts to use ContentToggler implementation |
| updateRibbonIcons | ~30 | src/dom/RibbonManager.ts | ✅ Complete | 2025-05-29 | Created RibbonManager class to handle ribbon icons |
| removeRibbonIcons | ~20 | src/dom/RibbonManager.ts | ✅ Complete | 2025-05-29 | Included in RibbonManager class |
| addRibbonIcons | ~40 | src/dom/RibbonManager.ts | ✅ Complete | 2025-05-29 | Included in RibbonManager class |
| forceApplyDateFilter | ~75 | src/dom/filters/DateFilter.ts | ✅ Complete | 2025-05-29 | Created DateFilter class to handle date-based filtering |

**Extraction Process:**
1. Create a new file for each extracted module
2. Move the method code to the new file
3. Update imports and dependencies
4. Create a class to encapsulate related functionality
5. Update main.ts to use the new module
6. Test thoroughly to ensure functionality is maintained

#### 3.2 Extract Standalone Utility Functions

In addition to large methods, there are many standalone utility functions that should be extracted from main.ts and other files into dedicated utility modules.

| Function Name | Lines | Source File | Target Module | Priority | Status | Notes |
|---------------|-------|-------------|--------------|----------|--------|-------|
| debugTableData | ~60 | main.ts | src/utils/debugging.ts | ✅ Complete | 2025-05-29 | Debug table data |
| testContentParserDirectly | ~80 | main.ts | src/testing/ContentParser.ts | ✅ Complete | 2025-05-29 | Test content parser |
| validateDate | ~20 | main.ts | src/utils/date-utils.ts | ✅ Complete | 2025-05-29 | Validate date string |
| parseDate | ~25 | main.ts | src/utils/date-utils.ts | ✅ Complete | 2025-05-29 | Parse date string |
| formatDate | ~15 | main.ts | src/utils/date-utils.ts | ✅ Complete | 2025-05-29 | Format date object |
| processDreamContent | ~100 | main.ts | src/metrics/MetricsProcessor.ts | ✅ Complete | 2025-05-29 | Updated main.ts to use MetricsProcessor implementation |
| generateUniqueId | ~10 | main.ts | src/utils/id-generator.ts | ✅ Complete | 2025-05-29 | Generate unique ID |
| cleanContent | ~30 | main.ts | src/utils/content-cleaner.ts | ✅ Complete | 2025-05-29 | Clean content text |
| validateMetricFormat | ~25 | main.ts | src/utils/validation.ts | ✅ Complete | 2025-05-29 | Validate metric format |
| processTagString | ~20 | main.ts | src/utils/tag-processor.ts | ✅ Complete | 2025-05-29 | Process tag string |
| formatMetricValue | ~15 | main.ts | src/utils/formatters.ts | ✅ Complete | 2025-05-29 | Format metric value |

**Extraction Process:**
1. Identify standalone utility functions that don't depend on class instance state
2. Create appropriate utility modules based on function purpose
3. Move functions to the new modules
4. Update imports and references in all files that use these functions
5. Test thoroughly to ensure functionality is maintained

#### 3.2.1 Additional Standalone Functions Identified for Extraction (2025-05-30)

**Current main.ts Analysis - Remaining Standalone Functions:**

| Function Name | Lines | Current Location | Target Module | Priority | Status | Notes |
|---------------|-------|------------------|--------------|----------|--------|-------|
| getDreamEntryDate | ~50 | main.ts (1721) | src/utils/date-utils.ts | High | ✅ Completed | Moved to date utilities |
| saveLastCustomRange | ~5 | main.ts (1771) | src/utils/storage-helpers.ts | Medium | ✅ Completed | Custom date range persistence |
| loadLastCustomRange | ~16 | main.ts (1776) | src/utils/storage-helpers.ts | Medium | ✅ Completed | Custom date range loading |
| saveFavoriteRange | ~7 | main.ts (1792) | src/utils/storage-helpers.ts | Medium | ✅ Completed | Favorite range persistence |
| loadFavoriteRanges | ~10 | main.ts (1799) | src/utils/storage-helpers.ts | Medium | ✅ Completed | Favorite range loading |
| deleteFavoriteRange | ~12 | main.ts (1809) | src/utils/storage-helpers.ts | Medium | ✅ Completed | Favorite range deletion |
| forceApplyDateFilter | ~19 | main.ts (1821) | src/dom/filters/DateFilter.ts | High | ✅ Completed | Legacy wrapper, removed in favor of DateFilter class |
| applyCustomDateRangeFilter | ~250 | main.ts (1840) | src/dom/filters/CustomDateRangeFilter.ts | **Critical** | ✅ Completed | **Massive function**, largest single opportunity |

**Estimated Line Savings from Function Extraction: ~370 lines**

**Progress Update (2025-05-30):** Successfully completed all Critical Priority extractions plus first major opportunity:
- ✅ **applyCustomDateRangeFilter** (~250 lines) → src/dom/filters/CustomDateRangeFilter.ts 
- ✅ **DEFAULT_LINTING_SETTINGS** (~95 lines) → src/types/journal-check.ts
- ✅ **getDreamEntryDate** (~50 lines) → src/utils/date-utils.ts
- ✅ **Storage helpers** (~50 lines) → src/utils/storage-helpers.ts
- ✅ **forceApplyDateFilter** (~19 lines) → REMOVED (redundant wrapper, functionality in DateFilter class)
- ✅ **insertTemplate** (~205 lines) → src/templates/TemplateManager.ts
- ✅ **Dead code cleanup** (~7 lines) → Removed unused imports and orphaned comments

**Total Lines Extracted: ~676 lines**
**New main.ts size: 1,377 lines (reduced from 2,053 lines)**
**Reduction percentage: ~33%**

#### 3.2.2 Large Configuration Objects for Extraction

| Object Name | Lines | Current Location | Target Module | Priority | Status | Notes |
|-------------|-------|------------------|--------------|----------|--------|-------|
| DEFAULT_LINTING_SETTINGS | ~95 | main.ts (200-295) | src/types/journal-check-defaults.ts | High | ✅ Completed | Moved to src/types/journal-check.ts as DEFAULT_JOURNAL_STRUCTURE_SETTINGS |

**Estimated Line Savings from Configuration Extraction: ~95 lines**

#### 3.2.3 Wrapper Methods That Just Delegate

Many methods in the plugin class are thin wrappers that should be removed, with callers updated to use services directly:

| Method Name | Lines | Current Location | Delegates To | Priority | Status | Notes |
|-------------|-------|------------------|--------------|----------|--------|-------|
| processDreamContent | ~5 | main.ts | MetricsProcessor | Medium | ⏳ Planned | Just calls MetricsProcessor |
| processMetrics | ~5 | main.ts | MetricsProcessor | Medium | ⏳ Planned | Just calls MetricsProcessor |
| generateSummaryTable | ~5 | main.ts | TableGenerator | Medium | ⏳ Planned | Just calls TableGenerator |
| generateMetricsTable | ~5 | main.ts | TableGenerator | Medium | ⏳ Planned | Just calls TableGenerator |
| validateDate | ~5 | main.ts | date-utils | Low | ⏳ Planned | Just calls utility function |
| parseDate | ~10 | main.ts | date-utils | Low | ⏳ Planned | Just calls utility function with fallback |
| formatDate | ~5 | main.ts | date-utils | Low | ⏳ Planned | Just calls utility function |
| applyFilters | ~5 | main.ts | FilterManager | Medium | ⏳ Planned | Just calls FilterManager |
| applyFilterToDropdown | ~5 | main.ts | FilterManager | Medium | ⏳ Planned | Just calls FilterManager |
| forceApplyFilterDirect | ~5 | main.ts | FilterManager | Medium | ⏳ Planned | Just calls FilterManager |

**Estimated Line Savings from Wrapper Method Removal: ~50 lines**

#### 3.2.4 Global Variables and State for Encapsulation

| Variable Name | Lines | Current Location | Target Solution | Priority | Status | Notes |
|---------------|-------|------------------|-----------------|----------|--------|-------|
| globalContentToggler | ~1 | main.ts | Encapsulate in service | Medium | ⏳ Planned | Should be managed by plugin instance |
| globalTableGenerator | ~1 | main.ts | Encapsulate in service | Medium | ⏳ Planned | Should be managed by plugin instance |
| customDateRange | ~1 | main.ts | Move to FilterManager | Medium | ⏳ Planned | Filter-specific state |

**Estimated Line Savings from Global Variable Cleanup: ~10 lines**

**Total Estimated Line Savings from Section 3.2 Improvements: ~525 lines**

#### 3.3 Additional main.ts Line Count Reduction

To further reduce the size and complexity of main.ts, we can extract additional components and modules. This phase focuses on isolating coherent groups of functionality into dedicated classes that follow the single responsibility principle.

| Component Name | Lines | Source Section | Target Module | Status | Date | Notes |
|----------------|-------|---------------|--------------|--------|------|-------|
| FilterManager | ~430 | applyFilters (897-1329) | src/dom/filters/FilterManager.ts | ✅ Complete | 2025-05-29 | Extracted all filter-related functionality into a dedicated class with proper structure and error handling |
| FilterDisplayManager | ~180 | updateFilterDisplay (3334-3466) | src/dom/filters/FilterDisplayManager.ts | ✅ Complete | 2025-05-29 | Created dedicated class for filter display management with consistent styling, proper error handling, and support for various filter types including date filters and custom ranges |
| TableManager | ~340 | Combined table operations | src/dom/tables/TableManager.ts | ✅ Complete | 2025-05-29 | Extracted table initialization, metrics collection, and summary table updating with proper error handling, performance optimizations, and support for various table formats |
| EventManager | ~220 | attachProjectNoteEventListeners (669-896) | src/events/EventHandler.ts | ✅ Complete | 2025-05-29 | Created EventHandler to manage all DOM event attachments including buttons, filters, and content toggles with robust error handling and centralized event management |
| DebugTools | ~320 | Debug functions (1880-2200) | src/debug/DebugTools.ts | ✅ Complete | 2025-05-29 | Extracted debug tools and functions into a dedicated class for better organization and to remove debug code from main.ts |
| ModalsManager | ~150 | Modal creation & management | src/dom/modals/ModalsManager.ts | ✅ Complete | 2025-05-29 | Centralized modal creation and management with a common interface, tracking of active modals, and standardized modal utilities |
| TableInitializer | ~140 | initializeTableRowClasses (3467-3653) | src/dom/tables/TableManager.ts | ✅ Complete | 2025-05-29 | Implemented as part of TableManager with improved performance for large tables and optimized date attribute handling |
| MetricsCollector | ~180 | collectVisibleRowMetrics (3654-3765) | src/metrics/MetricsCollector.ts | ✅ Complete | 2025-05-29 | Collection of metrics from DOM with robust error handling |
| TableStatisticsUpdater | ~120 | updateSummaryTable (3766-3880) | src/metrics/TableStatisticsUpdater.ts | ✅ Complete | 2025-05-29 | Updating summary table UI with calculated statistics |
| GlobalHelpers | ~120 | safeSettingsAccess, getIcon, etc. | src/utils/GlobalHelpers.ts | ✅ Complete | 2025-05-29 | Extracted utility functions used globally throughout the codebase into a centralized module |
| WindowExtensions | ~100 | window.forceApplyDateFilter, etc. | src/dom/WindowExtensions.ts | ✅ Complete | 2025-05-29 | Removed redundant window.forceApplyDateFilter implementation, relying on DateFilter class implementation |

**Implementation Approach:**
1. Create a new class for each component with proper interfaces and documentation
2. Extract the functionality from main.ts to the new class
3. Add necessary imports and dependencies in the new module
4. Update main.ts to initialize and use the new component
5. Remove the original code from main.ts once tests confirm the new component works correctly
6. Update any dependent components to use the new module directly instead of through main.ts

**Benefits of Additional Extraction:**
- Improved code organization and maintainability
- Better separation of concerns
- Easier testing of isolated components
- Reduced cognitive load when working with main.ts
- Simplified debugging of specific functionality
- Support for parallel development on different components

**Example Component Design: FilterManager**
```typescript
// src/dom/filters/FilterManager.ts
import { App, Notice } from 'obsidian';
import { ILogger } from '../../logging/LoggerTypes';
import { DreamMetricsSettings } from '../../types/core';

export class FilterManager {
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private saveSettings: () => Promise<void>,
        private logger?: ILogger
    ) { }
    
    public applyFilters(previewEl: HTMLElement): void {
        // Implementation extracted from main.ts
    }
    
    public applyFilterToDropdown(filterDropdown: HTMLSelectElement, previewEl: HTMLElement): boolean {
        // Implementation extracted from main.ts
    }
    
    public forceApplyFilterDirect(previewEl: HTMLElement, startDate: string, endDate: string): void {
        // Implementation extracted from main.ts
    }
}
```

### Phase 4: Unused Code Elimination

1. Identify and remove unused functions
   - Run static analysis tools
   - Verify before removal

2. Address TODOs
   - Implement needed functionality
   - Move to ISSUES.md if deferred
   - Remove if obsolete

**Progress (2025-05-24):**
- Implemented time filter dialog functionality in DreamMetricsEvents.ts
  - Removed TODO and implemented proper integration with CustomDateRangeModal
  - Added applyCustomDateRangeFilter method to DreamMetricsDOM class
  - Added support for saving/loading favorite date ranges
  - Improved error handling and fallback implementation
- Implemented date range selection in DateNavigatorIntegration.ts
  - Removed TODO comment and fully implemented range selection feature
  - Added toggle button for range selection mode
  - Created two-step selection process (start date → end date)
  - Added proper visual feedback with status notifications
  - Integrated with TimeFilterManager for consistent behavior
  - Added defensive code to handle edge cases (date ordering, partial selections)
- Implemented basic sentiment analysis in DreamMetricsProcessor.ts
  - Removed TODO placeholder and added functional implementation
  - Created word-based sentiment analysis with positive/negative word lists
  - Used regex with word boundaries for accurate matching
  - Normalized results to a scale of -1 (negative) to 1 (positive)
  - Added special handling for neutral content with no sentiment markers
- Fixed deprecated type system imports
  - Updated utils/logger.ts to use the consolidated type system
  - Fixed LogLevel type mismatch in logger implementation
  - Ensured compatibility with the new type system structure
- Identified and analyzed potential commented-out code
  - Documented locations in main.ts for future cleanup
  - Evaluated risk of removal for complex initialization code
  - Deferred removal of some commented sections that require further testing
- Updated CHANGELOG.md to document all implemented features
- Identified and fixed unused parameters in constructor arguments

**Progress (2025-05-26):**
- Identified numerous debug console.log statements in main.ts that need to be replaced with structured logging
  - Over 70 instances of debug logging with '[DEBUG]' or '[OOM-DEBUG]' prefixes
  - These statements should be replaced with the structured logging system using globalLogger
  - Most debug statements are in date filtering and content toggling functionalities
- Assessed methods for potential removal
  - `updateTestRibbon()` - Used for testing purposes, should be kept for now
  - `loadStyles()` - Currently empty with comment noting it's kept for backward compatibility
- Removed unused methods from DreamMetricsState
  - Removed unused `saveSettings()` and `loadSettings()` methods with empty implementations
  - Removed unused debug helper `getStateSummary()` method that wasn't called anywhere
- Identified security vulnerabilities in dependencies
  - Found moderate severity vulnerability in esbuild package
  - Current version in package.json (^0.20.0) needs updating to latest (0.25.4)
  - Will require verification that build process works with updated dependency

**Progress (2025-05-27):**
- Replaced numerous console.log statements with structured logging in main.ts
  - Added domain-specific categories (Scrape, Metrics, MetricsNote, Backup, Settings, UI, Plugin)
  - Used consistent log levels (error, warn, info, debug)
  - Added structured data parameters for better debugging context
  - Implemented proper error handling with Error objects
- Updated esbuild dependency to version 0.25.4
  - Fixed security vulnerability in dependencies
  - Verified build process works with updated dependency
  - Fixed duplicate variable declaration causing build errors
- Organized logging with specific categories for better filtering and analysis:
  - 'Scrape': All data collection processes from files
  - 'Metrics': Processing and calculation of metrics
  - 'MetricsNote': Updates to the metrics note
  - 'Backup': File backup operations
  - 'Settings': Settings loading/saving
  - 'UI': User interface interactions
  - 'Plugin': Core plugin lifecycle events
- Next steps:
  - Continue replacing remaining console.log statements with structured logging
  - Add log level controls to ensure debug logs only appear when appropriate
  - Remove unused code identified in previous analysis

**Summary Status (2025-05-27):**
Phase 3 (Transitional Code Removal) is complete with the migration to the consolidated type system. We've made significant progress on Phase 1 (Logging Cleanup) by replacing critical console.log statements with structured logging in main.ts and other core files. Phase 4 (Unused Code Elimination) has started with the removal of unused methods in DreamMetricsState and updating dependencies to address security issues.

The remaining tasks are:
1. Complete replacement of debug console.log statements in UI-related code
2. Remove remaining unused code identified through analysis
3. Add better log-level controls for filtering debug messages
4. Address TypeScript errors that still exist in the codebase

#### 4.1 Main.ts Dead Code Summary (2025-05-30)

**Comprehensive Analysis of Remaining main.ts Cleanup Opportunities:**

Based on detailed analysis of the current main.ts file (2063 lines), the following cleanup opportunities have been identified:

| Category | Estimated Lines Saved | Priority Level | Implementation Phase |
|----------|----------------------|----------------|---------------------|
| **Standalone Utility Functions** | ~370 | High | Phase 3.2.1 |
| **Large Configuration Objects** | ~95 | High | Phase 3.2.2 |
| **Wrapper Methods** | ~50 | Medium | Phase 3.2.3 |
| **Import Consolidation** | ~50 | Medium | Phase 2.1 |
| **Global Variables** | ~10 | Medium | Phase 3.2.4 |
| **Debug/Testing Methods** | ~100 | Low | Phase 4.2 |
| **Deprecated Comments** | ~5 | Low | Phase 4.3 |
| **Total Potential Reduction** | **~680 lines** | - | - |

**Current Size vs. Target:**
- **Current main.ts size**: 1,571 lines (as of 2025-05-30)
- **Previously identified reduction**: ~680 lines
- **Newly identified opportunities**: ~737 lines
- **Total potential reduction**: ~1,417 lines  
- **Target main.ts size**: ~150-200 lines (core plugin class only)
- **Total reduction percentage**: ~90%

**Revised Cleanup Strategy:**
With the newly identified opportunities, main.ts could be reduced to a minimal plugin class containing only:
- Plugin lifecycle methods (onload/onunload)
- Settings delegation to SettingsManager
- Component initialization and wiring
- Essential plugin API implementations

#### 4.1.1 Critical Priority Items (Largest Impact)

1. **applyCustomDateRangeFilter function** ✅ **COMPLETED** - Moved to `src/dom/filters/CustomDateRangeFilter.ts` (~250 lines extracted)
2. **DEFAULT_LINTING_SETTINGS object** ✅ **COMPLETED** - Moved to `src/types/journal-check.ts` as `DEFAULT_JOURNAL_STRUCTURE_SETTINGS` (~95 lines extracted)
3. **getDreamEntryDate function** ✅ **COMPLETED** - Moved to `src/utils/date-utils.ts` (~50 lines extracted)
4. **Storage helper functions** ✅ **COMPLETED** - Moved to `src/utils/storage-helpers.ts` (~50 lines extracted)

#### 4.1.2 Additional Large Extraction Opportunities (New Analysis - 2025-05-30)

**Fresh Analysis Reveals Major Missed Opportunities:**

Upon re-analysis of the current main.ts (1,571 lines), several **major extraction opportunities** were identified that were missed in the original analysis. These represent the largest remaining opportunities for main.ts size reduction:

| Method Name | Lines | Current Location | Target Module | Priority | Status | Notes |
|-------------|-------|------------------|--------------|----------|--------|-------|
| **insertTemplate** | ~205 | main.ts (859-1064) | src/templates/TemplateManager.ts | Critical | ✅ Completed | Template modal creation, Templater integration, preview functionality |
| **showDateNavigator** | ~163 | main.ts (892-1091) | src/dom/date-navigator/DateNavigatorManager.ts | **Critical** | ✅ Completed | **Second largest** - Complex date navigator logic with entry collection, test data generation, modal initialization |
| **applyInitialFilters** | ~200 | main.ts (1290-1489) | src/dom/filters/FilterPersistenceManager.ts | **Critical** | ✅ Completed | Filter persistence and recovery logic with localStorage backup/recovery, DOM waiting, retry mechanisms |
| updateRibbonIcons | ~35 | main.ts (825-859) | Already delegated to RibbonManager | Medium | 🔄 Partial | Method exists but contains fallback logic |
| Log management methods | ~100 | main.ts (621-731) | src/logging/LogFileManager.ts | Medium | ⏳ Planned | Combined: clearDebugLog, backupDebugLog, checkLogFileSize, copyConsoleLogs, getConsoleLog |
| Global wrapper functions | ~18 | main.ts (1544-1561) | Remove/consolidate | Low | ⏳ Planned | applyCustomDateRangeFilter global function wrapper |

**Why These Were Missed in Original Analysis:**
1. **Fresh Perspective**: Analysis of current cleaned-up codebase reveals these methods more clearly  
2. **Context Understanding**: Better recognition of cohesive functionality that can be extracted as dedicated managers

**Newly Identified Line Savings: ~737 lines**

**Combined with Previous Extractions:**
- **Previous Critical Priority Items**: ~464 lines
- **Newly Identified Opportunities**: ~737 lines
- **Total Potential Main.ts Reduction**: ~1,201 lines
- **Target Main.ts Size**: ~370 lines (from current 1,571 lines)
- **Reduction Percentage**: ~76%

#### 4.1.3 Detailed Method Analysis

**insertTemplate Method (Lines 859-1064, ~205 lines):**
- Template selection modal creation and management
- Templater integration and fallback handling  
- Preview functionality with dynamic/static toggle
- Placeholder navigation and cursor positioning
- Complex error handling and user feedback
- **Extraction Strategy**: Create TemplateManager class to handle all template-related operations

**showDateNavigator Method (Lines 892-1091, ~163 lines):** ✅ **COMPLETED**
- Entry collection from multiple sources (state, memoized table data)
- Test data generation for empty datasets
- Complex modal initialization and error handling
- Global state exposure for DateNavigator access
- **Extraction Strategy**: ✅ Created DateNavigatorManager class to handle date navigation functionality

**applyInitialFilters Method (Lines 1290-1489, ~200 lines):** ✅ **COMPLETED**
- Filter persistence and recovery logic
- localStorage backup/recovery mechanisms  
- DOM waiting and retry logic with exponential backoff
- Project note detection and workspace iteration
- Complex state management for filter application
- **Extraction Strategy**: ✅ Created FilterPersistenceManager class to handle filter restoration and persistence

#### 4.1.4 Implementation Roadmap

**Phase A: Quick Wins (High Impact, Low Risk)**
- Move DEFAULT_LINTING_SETTINGS to config file
- Extract storage helper functions to utilities
- Remove wrapper methods and update callers

**Phase B: Major Refactoring (High Impact, Medium Risk)**  
- Extract applyCustomDateRangeFilter to CustomDateRangeFilter
- Move getDreamEntryDate to date utilities
- Consolidate import statements

**Phase C: Final Cleanup (Medium Impact, Low Risk)**
- Remove debug methods
- Clean up global variables
- Remove deprecated comments

#### 4.1.5 Success Metrics

**Current Progress Summary (2025-05-30):**
- **Main.ts Original Size**: 2,053 lines
- **Main.ts Current Size**: 1,034 lines  
- **Total Lines Extracted**: 1,019 lines
- **Current Reduction Percentage**: 50%

**Completed Extractions:**
- ✅ **applyCustomDateRangeFilter** (~250 lines) → `src/dom/filters/CustomDateRangeFilter.ts`
- ✅ **insertTemplate** (~205 lines) → `src/templates/TemplateManager.ts`
- ✅ **applyInitialFilters** (~200 lines) → `src/dom/filters/FilterPersistenceManager.ts`
- ✅ **showDateNavigator** (~163 lines) → `src/dom/date-navigator/DateNavigatorManager.ts`
- ✅ **DEFAULT_LINTING_SETTINGS** (~95 lines) → `src/types/journal-check.ts`
- ✅ **getDreamEntryDate** (~50 lines) → `src/utils/date-utils.ts`
- ✅ **Storage helpers** (~50 lines) → `src/utils/storage-helpers.ts`
- ✅ **forceApplyDateFilter** (~19 lines) → REMOVED (redundant wrapper)
- ✅ **Dead code cleanup** (~7 lines) → REMOVED (unused imports)

**Next Targets:**
- ⏳ **showDateNavigator** (~163 lines) → `DateNavigatorManager`
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
  - [Phase 3: Transitional Code Removal](#phase-3-transitional-code-removal)
    - [Extract Large Methods from DreamMetricsPlugin Class](#extract-large-methods-from-dreammetricsplugin-class)
    - [Extract Standalone Utility Functions](#extract-standalone-utility-functions)
    - [Additional main.ts Line Count Reduction](#additional-maints-line-count-reduction)
  - [Phase 4: Unused Code Elimination](#phase-4-unused-code-elimination)
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

| Function Name | Lines | Source File | Target Module | Status | Date | Notes |
|---------------|-------|-------------|--------------|--------|------|-------|
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

#### 3.3 Additional main.ts Line Count Reduction

To further reduce the size and complexity of main.ts, we can extract additional components and modules. This phase focuses on isolating coherent groups of functionality into dedicated classes that follow the single responsibility principle.

| Component Name | Lines | Source Section | Target Module | Status | Date | Notes |
|----------------|-------|---------------|--------------|--------|------|-------|
| FilterManager | ~430 | applyFilters (897-1329) | src/dom/filters/FilterManager.ts | ✅ Complete | 2025-05-29 | Extracted all filter-related functionality into a dedicated class with proper structure and error handling |
| FilterDisplayManager | ~180 | updateFilterDisplay (3334-3466) | src/dom/filters/FilterDisplayManager.ts | ✅ Complete | 2025-05-31 | Created dedicated class for filter display management with consistent styling, proper error handling, and support for various filter types including date filters and custom ranges |
| TableManager | ~340 | Combined table operations | src/dom/tables/TableManager.ts | ✅ Complete | 2025-05-31 | Extracted table initialization, metrics collection, and summary table updating with proper error handling, performance optimizations, and support for various table formats |
| EventManager | ~220 | attachProjectNoteEventListeners (669-896) | src/events/EventManager.ts | ⬜ Not Started | - | Handle all event attachments in one place |
| DebugTools | ~320 | Debug functions (1880-2200) | src/debug/DebugTools.ts | ✅ Complete | 2025-05-30 | Extracted debug tools and functions into a dedicated class for better organization and to remove debug code from main.ts |
| ModalsManager | ~150 | Modal creation & management | src/dom/modals/ModalsManager.ts | ⬜ Not Started | - | Centralize modal creation and management |
| TableInitializer | ~140 | initializeTableRowClasses (3467-3653) | src/dom/tables/TableInitializer.ts | ⬜ Not Started | - | Handle table initialization |
| MetricsCollector | ~180 | collectVisibleRowMetrics (3654-3765) | src/metrics/MetricsCollector.ts | ⬜ Not Started | - | Collection of metrics from DOM |
| GlobalHelpers | ~120 | safeSettingsAccess, getIcon, etc. | src/utils/GlobalHelpers.ts | ⬜ Not Started | - | Utility functions used globally |
| WindowExtensions | ~100 | window.forceApplyDateFilter, etc. | src/dom/WindowExtensions.ts | ⬜ Not Started | - | Manage window-level extensions |

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

## Success Criteria

The dead code elimination phase will be considered successful when:

1. All `console.log` statements have been replaced with proper logging
2. Redundant imports have been consolidated
3. Transitional code has been removed
4. No unused functions remain in the codebase
5. All TODOs have been addressed or documented in ISSUES.md
6. The codebase passes all tests and functions as expected

## Next Steps

1. Continue replacing remaining console.log statements with structured logging
2. Remove remaining identified unused code
3. Fix TypeScript errors in the codebase
4. Add better log level controls for filtering debug messages
5. Extract additional components identified in Phase 3.3 to further reduce main.ts line count
6. Update documentation to reflect the changes 

**Progress (2025-05-28):**
- Consolidated and fixed type definitions to improve TypeScript compatibility:
  - Created a SelectionMode type to handle 'notes'|'folder' vs 'manual'|'automatic' compatibility 
  - Updated DreamMetricData.source to support both string and object formats
  - Fixed calloutMetadata property to include required type field
  - Added missing properties to DreamMetricsSettings interface
  - Added proper type imports across files
  - Created backwards compatibility aliases where needed
- Fixed build issues despite remaining TypeScript errors:
  - Used appropriate type assertions to handle legacy properties
  - Added helper functions to safely access potentially missing properties
  - Fixed missing dreamTitle variable in dream entry creation
  - Updated properties access to avoid type errors
  - Verified build process works correctly with node esbuild.config.mjs production
- Added documentation for remaining type issues to address in future updates

### Phase 5: TypeScript Adapter Cleanup

1. **Consolidate Helper Utilities**
   - Review helper utilities created during refactoring
   - Identify which should be permanent vs. temporary
   - Create a plan for standardizing utility usage

2. **Clean Up Temporary Code**
   - Identify code added purely for migration
   - Mark temporary compatibility layers
   - Create a schedule for removal

3. **Remove Temporary Compatibility Code**
   - Review adapter utilities
   - Check for remaining dependencies on adapter files
   - Create replacement implementations where needed
   - Remove temporary adapter code when safe

**Progress (2025-05-24):**
- Reviewed the adapter files to identify their usage patterns:
  - src/utils/adapter-functions.ts
  - src/utils/type-adapters.ts
  - src/utils/property-compatibility.ts
  - src/utils/component-migrator.ts
- Added migration notices to all adapter files pointing to typescript-architecture-lessons.md
- Created a phased approach for adapter removal (documented in typescript-architecture-lessons.md)
- Consolidated remaining TypeScript-related documentation:
  - Moved implementation recommendations from post-refactoring-documentation-plan.md to code-cleanup-plan.md
  - Ensured all key information is preserved in active documentation

**Next Steps (Phase 5):**
- Create dependency audit of all adapter file usage
- Create classification table (keep, refactor, remove) for adapter functionality
- Implement permanent replacements for essential adapter functionality
- Update imports one file at a time, starting with non-critical components
- Remove adapter files once all dependencies have been updated 

**Progress (2025-05-25):**
- Refactored date handling functions in main.ts to use centralized utilities
  - Replaced local validateDate, parseDate, and formatDate implementations with imports from src/utils/date-utils.ts
  - Updated method references across the file to use the shared utilities
  - Added proper null handling for parseDate return values
  - Maintained compatibility with existing code through wrapper methods
  - Added import statement for date utilities
  - Verified functionality with testing
- Identified potential areas for further date handling improvements:
  - Add consistent error handling for date parsing failures
  - Standardize date format strings across the codebase
  - Create more robust date range handling utilities

## Progress Tracking

### Main.ts Cleanup Progress

**A detailed plan for main.ts refactoring has been created: [main-ts-refactoring-plan.md](main-ts-refactoring-plan.md)**

| Component | Description | Status | Date | Notes |
|-----------|-------------|--------|------|-------|
| onload | Plugin initialization and setup | ✅ Complete | 2025-06-15 | Moved to src/plugin/PluginLoader.ts |
| Date Functions | Date validation, parsing, formatting | ✅ Complete | 2025-05-26 | Moved to src/utils/date-utils.ts |
| Logging | Debug logging statements | ✅ Complete | 2025-05-28 | Converting to structured logging |
| UI Components | Modal generation, tables | ✅ Complete | 2025-05-28 | Extracted TableGenerator, ContentToggler, FilterUI, DateNavigator, DateRangeService components |
| Metrics Processing | Calculation, organization | ✅ Complete | 2025-05-28 | Moved to src/metrics/MetricsProcessor.ts |
| Event Handlers | Button clicks, interactions | ✅ Complete | 2025-05-28 | Created ProjectNoteEvents and FilterEvents classes |
| Settings Management | Loading, saving | ✅ Complete | 2025-05-28 | Moved to src/state/SettingsManager.ts |
| Ribbon Management | Icon creation and handling | ✅ Complete | 2025-06-15 | Moved to src/dom/RibbonManager.ts |
| Debug Tools | Debugging and testing utilities | ✅ Complete | 2025-05-30 | Moved to src/utils/DebugTools.ts |
| Filter Management | Filter application and control | ✅ Complete | 2025-05-30 | Moved to src/dom/filters/FilterManager.ts |
| Project Note Management | Updating and backing up project notes | ✅ Complete | 2025-06-15 | Moved to src/state/ProjectNoteManager.ts |

### Next Steps (May 29-June 7, 2025)

1. **Complete Metrics Processing (High Priority)**
   - ✅ Implemented `MetricsProcessor.ts` with:
     - ✅ `processMetrics()` method for processing metric text
     - ✅ `processDreamContent()` method for cleaning content
     - ✅ Added comprehensive error handling
   - Remaining: Complete implementation of content parsing logic from scrapeMetrics()

2. **Continue UI Components Refactoring (High Priority)**
   - ✅ Created `TableGenerator` class in src/dom/tables/ with:
     - ✅ `generateSummaryTable()` method from main.ts
     - ✅ `generateMetricsTable()` method from main.ts
     - ✅ Added error handling and caching
   - ✅ Created `ContentToggler` class in src/dom/content/ with:
     - ✅ `updateContentVisibility()` method from main.ts
     - ✅ `toggleContentVisibility()` method from main.ts
     - ✅ `expandAllContentSections()` method from main.ts
     - ✅ Added state persistence with localStorage
   - ✅ Created `FilterUI` class in src/dom/filters/ with:
     - ✅ `applyFilters()` method from main.ts
     - ✅ `applyFilterToDropdown()` method from main.ts
     - ✅ `forceApplyFilterDirect()` method from main.ts
     - ✅ `forceApplyDateFilter()` method from main.ts
     - ✅ `applyCustomDateRangeFilter()` method from main.ts
     - ✅ Added custom date range management

3. **Complete Event Handlers Refactoring (Medium Priority)**
   - ✅ Created `ProjectNoteEvents` class in src/events/ with:
     - ✅ `attachProjectNoteEventListeners()` method from main.ts
     - ✅ `attachButtonEventListeners()` helper method
     - ✅ `attachDebugFunctionality()` helper method
     - ✅ `attachContentToggleEventListeners()` helper method
   - ✅ Created `FilterEvents` class in src/events/ with:
     - ✅ `attachFilterEventListeners()` method 
     - ✅ `openCustomRangeModal()` method from main.ts
     - ✅ `saveLastCustomRange()` and `loadLastCustomRange()` methods
     - ✅ `saveFavoriteRange()` and `loadFavoriteRanges()` methods
     - ✅ Created `CustomDateRangeModal` class in src/dom/modals/

4. **Complete Settings Management Refactoring (Medium Priority)**
   - ✅ Implemented `SettingsManager` class in src/state/SettingsManager.ts:
     - ✅ Moved `saveSettings()` method from main.ts
     - ✅ Moved `loadSettings()` method from main.ts
     - ✅ Integrated with SettingsAdapter for type safety
     - ✅ Added proper error handling for settings operations
     - ✅ Created updateSetting() and updateLogConfig() methods
     - ✅ Added expandedStates management for UI state persistence

5. **Update Documentation (Medium Priority)**
   - ✅ Created detailed main.ts refactoring plan
   - ✅ Updated progress tracking in code-cleanup-plan.md
   - Planned: Update CHANGELOG.md with user-visible changes 

## Cleanup Tracking

This section tracks cleanup items identified by our utility scripts in the `utils/` folder.

### Console.log Statements

| File | Line | Type | Status | Notes |
|------|------|------|--------|-------|
| main.ts | 342 | console.debug | Completed | Replaced with safeLogger.debug |
| main.ts | 447 | console.error | Completed | Replaced with safeLogger.error |
| main.ts | 538 | console.warn | Completed | Replaced with safeLogger.warn |
| main.ts | 1270 | console.log | Completed | Replaced with this.logger?.debug |
| main.ts | 1275 | console.log | Completed | Replaced with this.logger?.debug |
| main.ts | 1280 | console.log | Completed | Replaced with this.logger?.debug |
| main.ts | 1291 | console.log | Completed | Replaced with this.logger?.debug |
| main.ts | 1666 | console.error | Completed | Removed (already had globalLogger?.error) |
| main.ts | 2638 | console.error | Completed | Replaced with this.logger?.error |
| main.ts | 2641 | console.error | Completed | Replaced with this.logger?.error |
| main.ts | 2811 | console.error | Completed | Replaced with this.logger?.error |
| main.ts | 3154 | console.warn | Completed | Replaced with this.logger?.warn |
| main.ts | 3178 | console.error | Completed | Replaced with this.logger?.error |
| main.ts | 3198 | console.error | Completed | Replaced with this.logger?.error |
| main.ts | 3203 | console.error | Completed | Replaced with this.logger?.error |
| main.ts | 3216 | console.error | Completed | Replaced with this.logger?.error |
| main.ts | 3238 | console.error | Completed | Replaced with this.logger?.error |
| main.ts | 3247 | console.error | Completed | Replaced with this.logger?.error |
| main.ts | 3272 | console.error | Completed | Replaced with this.logger?.error |
| settings.ts | 617 | console.error | Completed | Replaced with error() function from logging |
| settings.ts | 761 | console.log | Completed | Replaced with debug() for folder suggestions |
| settings.ts | 762 | console.log | Completed | Replaced with debug() for folder suggestions |
| settings.ts | 1032 | console.log | Completed | Removed (redundant with structured debug call) |
| settings.ts | 1033 | console.log | Completed | Removed (redundant with structured debug call) |
| settings.ts | 1034 | console.log | Completed | Removed (redundant with structured debug call) |
| settings.ts | 1193 | console.log | Completed | Replaced with debug() for folder suggestions |
| settings.ts | 1194 | console.log | Completed | Replaced with debug() for folder suggestions |

#### Console.log Statistics

- Total files with console statements: 28 (down from 33)
- Total console statements: 83 (down from 114)
- By type: console.log (44), console.warn (4), console.error (31), console.info (2), console.debug (2)
- Completed: 
  - 19 statements in main.ts
  - 8 statements in settings.ts
  - 6 statements in src/testing/TestRunner.ts
  - 14 statements in src/testing/EdgeCaseTests.ts
  - 6 statements in src/testing/utils/TypeGuardsTests.ts
  - 3 statements in src/dom/DateNavigator.ts (with linter errors to fix)

#### Notable Console.log Files (Remaining):
- src/logging/adapters/ConsoleAdapter.ts: 7 statements (intentional)
- src/logging/safe-logger.ts: 7 statements (intentional)
- src/testing/JournalCheckTests.ts: 4 statements
- src/journal_check/JournalCheckEngine.ts: 2 statements
- main.ts: 2 statements (remaining)

*Note: For the complete list, run `.\utils\find-console-logs.ps1`*

### Progress Update (2025-05-28)

The console.log cleanup effort has made significant progress:
- Cleaned up 31 console statements across 4 key files
- Reduced total console statements from 114 to 83 (27% reduction)
- Completed cleanup in all major testing files
- Created a comprehensive status document at `docs/developer/implementation/console-log-cleanup-status.md`

### Progress Update (2025-05-30)

Completed extraction of debugging tools into a dedicated DebugTools class. This refactoring removed ~500 lines of debug code from main.ts by consolidating three large debugging methods (debugTableData, debugDateNavigator, testContentParserDirectly) into a well-structured class with proper error handling.

Next steps in the cleanup effort:
1. Fix linter errors in DateNavigator.ts (high priority)
2. Clean up remaining non-logging-system console statements
3. Add documentation to console statements that are intentional parts of the logging system
4. Update logger configuration to properly filter log levels in production builds

### Commented Code Blocks

We found primarily documentation comments related to TypeScript interfaces rather than commented-out code blocks. The commented-code analysis should be run again with adjusted parameters to better identify actual code blocks.

| File | Lines | Type | Status | Notes |
|------|-------|------|--------|-------|
| src/journal_check/types.ts | 1-4 | Multi-line | Pending | Deprecation notice for types file |
| src/types.ts | 1-4 | Multi-line | Pending | Deprecation notice for types file |
| main.ts | 3820-3824 | Multi-line | Pending | Debug function accessible from console |

#### Commented Code Statistics

- Most comments are properly formatted TypeScript documentation (JSDoc style)
- 3 deprecation notices for files being phased out
- Several commented-out code snippets that appear to be examples rather than dead code

*Note: Run `.\utils\find-commented-code.ps1` for the complete list*

### Outdated TODOs

No TODOs were found in the codebase during our scan. This suggests that the team has been diligent about addressing TODOs as part of the refactoring process.

*Note: Run `.\utils\find-outdated-todos.ps1` to verify*

### Unused Imports

| File | Import | Status | Notes |
|------|--------|--------|-------|
| src/dom/filters/FilterUI.ts | TFile | Completed | Removed unused TFile import while keeping safeLogger |
| main.ts | FileView, Menu, Scope, WorkspaceLeaf, ButtonComponent | Completed | Already removed in newer version |
| main.ts | registerSettings | Completed | Already removed in newer version |
| main.ts | FilterUI | Completed | Already removed in newer version |
| main.ts | Multiple date-fns imports | Completed | Already updated in newer version |

#### Unused Imports Statistics

- Total files with unused imports: 60
- Total potentially unused imports: 116
- 9 instances of unused safeLogger import across different files
- 7 instances of unused App from 'obsidian'
- 5 instances of unused TFile from 'obsidian'

#### Notable Files with Unused Imports:
- main.ts: 8 unused imports
- src/dom/DreamMetricsDOM.ts: 5 unused imports
- src/journal_check/ui/DreamJournalManager.ts: 5 unused imports
- src/dom/date-navigator/DateNavigator.ts: 4 unused imports
- src/metrics/MetricsProcessor.ts: 4 unused imports

*Note: For the complete list, run `.\utils\find-unused-imports.ps1`*

### Progress Update (2025-05-29)

Started work on the unused imports cleanup:
- Created new branch `refactoring/2025-dead-code` for dead code cleanup
- Started cleaning up unused imports in key files:
  - src/api/resilience/examples/ApiResilienceDemo.ts - removed ApiRequestOptions and OfflineSupport
  - src/dom/DateNavigator.ts - removed App, MarkdownView, TFile, getSourceFile, getSourceId, and isObjectSource
  - src/dom/filters/FilterUI.ts - removed safeLogger which was imported but never used
  - src/dom/DreamMetricsDOM.ts - removed DreamMetricData, getSourceId, isObjectSource, debounce, and format
- Created utility script `utils/clean-unused-imports.ps1` to help identify and remove unused imports
- Identified 121 potentially unused imports across 60 files that need further cleanup

Next steps for imports cleanup:
- Continue removing unused imports from more files
- Focus on high-impact files like main.ts that have multiple unused imports
- Use the utility script to process multiple files efficiently

## Cleanup Process

To update the status of items in these tracking tables:

1. Identify a batch of related items to clean up (e.g., console.log statements in a specific file)
2. Update the "Status" column to "In Progress"
3. Make the necessary code changes
4. Test thoroughly
5. Commit changes with a message following the format: `cleanup: [area] - [specific change]`
6. Update the "Status" column to "Complete" with the date
7. Run the relevant script again to ensure the items were properly addressed

This systematic approach will help ensure that no cleanup items are missed and that we can track our progress effectively. 

## Cleanup Progress

This document tracks the progress of refactoring the OneiroMetrics plugin codebase.

### 1. Main.ts Line Count Reduction

The main.ts file has grown to over 5,000 lines, making it difficult to maintain. This phase focuses on extracting functionality into separate modules.

### Initial Size

- main.ts: ~5,100 lines

### Component Extraction Plan

  | Component Name | Lines | Source Section | Target Module | Status | Date | Notes |
  |----------------|-------|---------------|--------------|--------|------|-------| 
  | FilterManager | ~430 | applyFilters (897-1329) | src/dom/filters/FilterManager.ts | ✅ Complete | 2025-05-29 | Extracted all filter-related functionality into a dedicated class with proper structure and error handling |
  | FilterDisplayManager | ~180 | updateFilterDisplay (3334-3466) | src/dom/filters/FilterDisplayManager.ts | ✅ Complete | 2025-05-31 | Created dedicated class for filter display management with consistent styling, proper error handling, and support for various filter types including date filters and custom ranges |
  | TableManager | ~340 | Combined table operations | src/dom/tables/TableManager.ts | ✅ Complete | 2025-05-31 | Extracted table initialization, metrics collection, and summary table updating with proper error handling, performance optimizations, and support for various table formats |
  | EventManager | ~220 | attachProjectNoteEventListeners (669-896) | src/events/EventHandler.ts | ⬜ Not Started | - | Handle all event attachments in one place |
  | DebugTools | ~320 | Debug functions (1880-2200) | src/debug/DebugTools.ts | ✅ Complete | 2025-05-30 | Extracted debug tools and functions into a dedicated class for better organization and to remove debug code from main.ts |
  | ModalsManager | ~150 | Modal creation & management | src/dom/modals/ModalsManager.ts | ⬜ Not Started | - | Centralize modal creation and management |
  | TableInitializer | ~140 | initializeTableRowClasses (3467-3653) | src/dom/tables/TableInitializer.ts | ⬜ Not Started | - | Handle table initialization |
  | MetricsCollector | ~180 | collectVisibleRowMetrics (3654-3765) | src/metrics/MetricsCollector.ts | ⬜ Not Started | - | Collection of metrics from DOM |
  | GlobalHelpers | ~120 | safeSettingsAccess, getIcon, etc. | src/utils/GlobalHelpers.ts | ⬜ Not Started | - | Utility functions used globally |
  | WindowExtensions | ~100 | window.forceApplyDateFilter, etc. | src/dom/WindowExtensions.ts | ⬜ Not Started | - | Manage window-level extensions |

### 2. Function Removal After Refactoring

After extracting functionality to dedicated classes, we need to remove the now-redundant functions from main.ts.

  | Function Name | Lines | Target Class | Status | Date | Notes |
  |--------------|-------|-------------|--------|------|-------|
  | initializeTableRowClasses | ~180 | TableManager | ✅ Removed | 2025-05-30 | Moved to TableManager class |
  | collectVisibleRowMetrics | ~112 | TableManager | ✅ Removed | 2025-05-30 | Moved to TableManager class |
  | updateSummaryTable | ~145 | TableManager | ✅ Removed | 2025-05-30 | Moved to TableManager class |
  | updateFilterDisplay | ~133 | FilterManager | ✅ Removed | 2025-05-30 | Moved to FilterManager class |
  | applyFilters | ~10 | FilterManager | ✅ Delegated | 2025-05-29 | Now delegates to FilterManager implementation |
  | applyFilterToDropdown | ~10 | FilterManager | ✅ Delegated | 2025-05-29 | Now delegates to FilterManager implementation |
  | forceApplyFilterDirect | ~10 | FilterManager | ✅ Delegated | 2025-05-29 | Now delegates to FilterManager implementation |
  | clearDebugLog | ~35 | DebugTools | ⬜ Not Started | - | |
  | backupDebugLog | ~20 | DebugTools | ⬜ Not Started | - | |
  | checkLogFileSize | ~18 | DebugTools | ⬜ Not Started | - | |
  | copyConsoleLogs | ~45 | DebugTools | ⬜ Not Started | - | |
  | getConsoleLog | ~23 | DebugTools | ⬜ Not Started | - | |

### 3. Utility Functions to Extract

The following utility functions can be moved to appropriate utility modules:

  | Function Name | Lines | Target Module | Status | Date | Notes |
  |--------------|-------|--------------|--------|------|-------|
  | validateDate | ~4 | src/utils/date-helpers.ts | ⬜ Not Started | - | |
  | parseDate | ~14 | src/utils/date-helpers.ts | ⬜ Not Started | - | |
  | formatDate | ~4 | src/utils/date-helpers.ts | ⬜ Not Started | - | |
  | getDreamEntryDate | ~45 | src/utils/journal-helpers.ts | ⬜ Not Started | - | |
  | openCustomRangeModal | ~26 | src/dom/modals/DateRangeModal.ts | ⬜ Not Started | - | |
  | formatDateForDisplay | ~6 | src/utils/date-helpers.ts | ⬜ Not Started | - | |
  | getIcon | ~23 | src/utils/icon-helpers.ts | ⬜ Not Started | - | |
  | getMetricIcon | ~48 | src/utils/icon-helpers.ts | ⬜ Not Started | - | |
  | toggleContentVisibility | ~4 | src/dom/content/ContentToggler.ts | ⬜ Not Started | - | |
  | expandAllContentSections | ~32 | src/dom/content/ContentToggler.ts | ⬜ Not Started | - | |
  | safeSettingsAccess | ~6 | src/utils/settings-helpers.ts | ⬜ Not Started | - | |

### 4. Current Status

After these refactorings, the main.ts file should be significantly reduced in size and the codebase will be more maintainable.

**Current line counts:**
- Initial main.ts: ~5,100 lines
- Current main.ts: ~3,000 lines
- **Reduction**: ~2,100 lines (~41% smaller)

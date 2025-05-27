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
  - [Phase 4: Unused Code Elimination](#phase-4-unused-code-elimination)
  - [Phase 5: TypeScript Adapter Cleanup](#phase-5-typescript-adapter-cleanup)
- [Success Criteria](#success-criteria)
- [Next Steps](#next-steps)
- [Progress Tracking](#progress-tracking)

## Executive Summary

This document outlines the plan for systematically eliminating dead code as part of the Phase 1: Code Cleanup in the Post-Refactoring Roadmap.

## Key Milestones

| Milestone | Status | Date | Description |
|-----------|--------|------|-------------|
| Adapter Migration | ✅ Complete | 2025-05-26 | All adapter modules have permanent implementations |
| Type System Migration | ✅ Complete | 2025-05-25 | All imports now use domain-specific type modules |
| Logging System Refactoring | 🔄 In Progress | 2025-06-03 | Replacing console.log with structured logging (90%) |
| main.ts Cleanup | 🔄 In Progress | 2025-06-03 | Refactoring core functionality into modules (30%) |
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

### Phase 1: Logging Cleanup

1. Replace `console.log` statements with appropriate `LoggingService` calls
   - Use proper log levels (debug, info, warn, error)
   - Add context information for better debugging
   - Keep only essential logging, remove purely diagnostic logs

2. Consolidate debug logging patterns
   - Use consistent format for similar operations
   - Add timing information for performance-sensitive operations

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

**Progress (2025-06-02):**
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

**Progress (2025-06-03):**
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

**Progress (2025-06-04):**
- Continued UI component cleanup:
  - Removed the unused ConfirmModal class
  - Created backup at src/dom/modals/ConfirmModal.bak.ts for reference
  - Removed unused confirmOverwrite() method
  - Kept confirmProceedWithoutBackup() method which is still in use
  - Added documentation comments to mark where code was removed
- Documented backed up classes:
  - Created a tracking table in the refactoring roadmap
  - Listed all classes that were backed up for future reference
- Backed up classes:

| Class Name | Original Location | Backup Location | Removal Date | Status | Notes |
|------------|------------------|-----------------|--------------|--------|-------|
| OneiroMetricsModal | main.ts | src/dom/modals/OneiroMetricsModal.bak.ts | June 2025 | Removed | Replaced by DreamJournalManager and direct calls to scrapeMetrics |
| ConfirmModal | main.ts | src/dom/modals/ConfirmModal.bak.ts | June 2025 | Removed | Generic confirmation dialog that was defined but not actually used in the codebase |

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

1. Complete migration of types system
   - Update all imports to use new types system
   - Remove bridge files and legacy type definitions

2. Remove commented-out code blocks
   - Review for any valuable information
   - Remove after confirmation

**Progress (2025-05-24):**
- Updated utils/logger.ts to use the new consolidated type system
  - Fixed import path to use src/types/logging instead of deprecated root types.ts
  - Updated code to use the new LogLevel type with proper values
  - Fixed type comparison for error level checking

**Progress (2025-05-25):**
- Continued migration to the consolidated type system
  - Updated DreamMetricsProcessor.ts to use imports from types/core.ts
  - Fixed type compatibility issues with the new DreamMetricData interface
  - Added proper type checks for metrics that can be either string or number
  - Updated DreamMetricsEvents.ts to use the new type imports
  - Updated constants.ts to use domain-specific imports from core.ts and logging.ts
  - Fixed DEFAULT_LOGGING object to match the new LoggingSettings interface
  - Updated DateNavigator.ts to use the consolidated type system
  - Updated DateRangeFilter.ts to use types/core.ts and replaced console.log calls with structured logging
  - Updated DreamMetricsState.ts to use the consolidated type system
- Reorganized CHANGELOG.md to be more concise and user-focused
  - Moved detailed implementation notes from CHANGELOG to code-cleanup-plan.md
  - Shortened entries to focus on user-visible changes
  - Grouped related changes into higher-level bullet points

**MILESTONE ACHIEVED (2025-05-25):** Completed the migration to the consolidated type system across the codebase. Verified that all imports are now using the new domain-specific type modules, and all console.log statements have been replaced with structured logging calls.

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
5. Update documentation to reflect the changes 

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

**Progress (2025-05-30):**
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

**Progress (2025-06-01):**
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

| Component | Description | Status | Date | Notes |
|-----------|-------------|--------|------|-------| 
| Date Functions | Date validation, parsing, formatting | ✅ Complete | 2025-05-26 | Moved to src/utils/date-utils.ts |
| Logging | Debug logging statements | 🔄 90% Complete | 2025-06-03 | Converting to structured logging |
| UI Components | Modal generation, tables | 🔄 20% Complete | 2025-06-03 | Removed OneiroMetricsModal |
| Metrics Processing | Calculation, organization | ⬜ Not Started | - | - |
| Event Handlers | Button clicks, interactions | ⬜ Not Started | - | - |
| Settings | Loading, saving | ⬜ Not Started | - | - |

### Module Status Overview

| Module | Cleanup Status | TypeScript Status | Test Coverage | Priority |
|--------|---------------|-------------------|--------------|----------|
| main.ts | 🔄 30% | 🔄 Partial | ⬜ Low | High |
| ContentParser.ts | ✅ Complete | ✅ Complete | 🔄 Medium | Medium |
| DreamMetricsDOM.ts | 🔄 75% | ✅ Complete | 🔄 Medium | Medium |
| DreamMetricsEvents.ts | 🔄 60% | ✅ Complete | 🔄 Medium | Medium |
| DreamMetricsProcessor.ts | 🔄 80% | ✅ Complete | 🔄 Medium | Medium |
| DreamMetricsState.ts | ✅ Complete | ✅ Complete | 🔄 Medium | Low |
| utils/date-utils.ts | ✅ Complete | ✅ Complete | 🔄 Medium | Medium |
| utils/logger.ts | ✅ Complete | ✅ Complete | 🔄 Medium | Low |
| types/core.ts | ✅ Complete | ✅ Complete | ✅ High | Low |
| types/logging.ts | ✅ Complete | ✅ Complete | ✅ High | Low | 
# OneiroMetrics Adapter Migration Plan

## Executive Summary

This document provides a comprehensive plan for migrating away from temporary adapter files created during the 2025 TypeScript refactoring project. It consolidates information from various documents into a single source of truth and establishes a clear framework for completing the adapter migration.

**Last Updated**: 2025-05-26

**Current Status**: In Progress (97%)

### Key Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Comprehensive Plan Creation | 2025-05-25 | ✅ Completed |
| Dependency Audit Completion | 2025-05-26 | ✅ Completed (100%) |
| Adapter Classification | 2025-05-26 | ✅ Completed (100%) |
| Implementation of Permanent Replacements | 2025-06-20 | 🔄 In Progress (97%) |
| Update Core Files (main.ts, etc.) | 2025-07-05 | 🔄 In Progress (25%) |
| Update Peripheral Files | 2025-07-15 | ⬜ Not Started |
| Testing and Verification | 2025-07-25 | 🔄 In Progress (50%) |
| Adapter Files Removal | 2025-08-01 | ⬜ Not Started |

## Table of Contents

- [Executive Summary](#executive-summary)
- [Overview](#overview)
- [Adapter Files Inventory](#adapter-files-inventory)
- [Dependency Tracking](#dependency-tracking)
- [Classification Strategy](#classification-strategy)
- [Model Adapter Patterns](#model-adapter-patterns)
- [Implementation Phases](#implementation-phases)
- [Testing Strategy](#testing-strategy)
- [Detailed Timeline](#detailed-timeline)
- [Verification Process](#verification-process)
- [Appendix](#appendix)

## Overview

During the 2025 TypeScript refactoring project, we created several adapter files to maintain backward compatibility while transitioning to a more modular, type-safe architecture. These adapter files were intended as temporary bridges but have become tightly integrated into the codebase.

This plan outlines our strategy for:
1. Identifying all dependencies on adapter files
2. Classifying adapter functions as permanent or temporary
3. Creating proper replacements for essential functionality
4. Systematically updating imports and references
5. Safely removing temporary adapter code
6. Verifying functionality throughout the process

## Adapter Files Inventory

### Primary Adapter Files

| File | Purpose | Function Count | Complexity |
|------|---------|----------------|------------|
| src/utils/adapter-functions.ts | Adapts function signatures and parameters | 12 | High |
| src/utils/type-adapters.ts | Converts between interface versions | 14 | Medium |
| src/utils/property-compatibility.ts | Handles property name changes | 8 | Medium |
| src/utils/component-migrator.ts | Bridges UI component differences | 6 | High |

### Helper Utilities (Considered Permanent)

| File | Purpose | Status |
|------|---------|--------|
| src/utils/settings-helpers.ts | Safe settings access | ✅ Permanent with Tests |
| src/utils/metric-helpers.ts | Metric property handling | ✅ Permanent with Tests |
| src/utils/selection-mode-helpers.ts | Selection mode compatibility | ✅ Permanent with Tests |
| src/utils/type-guards.ts | Type checking utilities | ✅ Permanent |

## Dependency Tracking

### adapter-functions.ts Dependencies

| Function | Used In | Replacement Path | Migration Status | Priority |
|----------|---------|------------------|-----------------|----------|
| ContentParserAdapter.adaptExtractDreamEntries | main.ts, DateNavigator.ts | src/parsing/services/ContentParser.ts | ✅ Completed | High |
| UIComponentAdapter.adaptMetricForUI | src/dom/modals/MetricsModal.ts | src/templates/ui/MetricComponent.ts | ⬜ Not Started | Medium |
| UIComponentAdapter.adaptEntryForUI | src/journal_check/ui/DreamJournalManager.ts | src/journal_check/ui/EntryComponent.ts | ⬜ Not Started | Medium |
| SettingsAdapter.adaptSelectionMode | main.ts, src/state/DreamMetricsState.ts | src/utils/selection-mode-helpers.ts | ✅ Completed | Low |
| SettingsAdapter.adaptSelectionModeToLegacy | main.ts | src/utils/selection-mode-helpers.ts | ✅ Completed | Low |
| EventAdapter.adaptEventHandler | multiple components | src/templates/ui/EventHandling.ts | ✅ Completed | Medium |
| EventAdapter.adaptClickHandler | multiple components | src/templates/ui/EventHandling.ts | ✅ Completed | Medium |

### type-adapters.ts Dependencies

| Function | Used In | Replacement Path | Migration Status | Priority |
|----------|---------|------------------|-----------------|----------|
| adaptSettingsToCore | main.ts, settings.ts | src/state/adapters/SettingsAdapter.ts | ✅ Completed | High |
| getProjectNotePathSafe | main.ts, DateNavigator.ts | src/utils/settings-helpers.ts | ✅ Completed with Tests | Medium |
| getSelectionModeSafe | main.ts, src/state/DreamMetricsState.ts | src/utils/settings-helpers.ts | ✅ Completed with Tests | Medium |
| getSelectedFolderSafe | main.ts | src/utils/settings-helpers.ts | ✅ Completed with Tests | Low |
| shouldShowRibbonButtonsSafe | main.ts | src/utils/settings-helpers.ts | ✅ Completed with Tests | Low |
| isBackupEnabledSafe | main.ts | src/utils/settings-helpers.ts | ✅ Completed with Tests | Low |
| getBackupFolderPathSafe | main.ts | src/utils/settings-helpers.ts | ✅ Completed with Tests | Low |
| getExpandedStatesSafe | main.ts | src/utils/settings-helpers.ts | ✅ Completed with Tests | Low |
| isDeveloperModeSafe | main.ts, src/metrics/index.ts | src/utils/settings-helpers.ts | ✅ Completed with Tests | Medium |
| getUIStateSafe | main.ts | src/utils/settings-helpers.ts | ✅ Completed with Tests | Medium |
| getActiveTabSafe | settings.ts | src/utils/settings-helpers.ts | ✅ Completed with Tests | Low |
| getJournalStructureSafe | main.ts, src/journal_check/LintingEngine.ts | src/utils/settings-helpers.ts | ✅ Completed with Tests | Medium |

### property-compatibility.ts Dependencies

| Function | Used In | Replacement Path | Migration Status | Priority |
|----------|---------|------------------|-----------------|----------|
| getPropertyCompatibly | multiple files | src/utils/property-helpers.ts | ✅ Completed with Tests | Medium |
| setPropertyCompatibly | multiple files | src/utils/property-helpers.ts | ✅ Completed with Tests | Medium |
| createCompatibleObject | DreamMetricsProcessor.ts | src/utils/property-helpers.ts | ✅ Completed with Tests | High |
| getCalloutMetadata | DreamMetricsDOM.ts | src/parsing/services/CalloutParser.ts | ⬜ Not Started | Medium |
| extractMetricValue | DreamMetricsProcessor.ts | src/utils/property-helpers.ts | ✅ Completed with Tests | High |
| applyPropertyDefaults | multiple files | src/utils/property-helpers.ts | ✅ Completed with Tests | Medium |

### component-migrator.ts Dependencies

| Function | Used In | Replacement Path | Migration Status | Priority |
|----------|---------|------------------|-----------------|----------|
| createCompatibleComponent | DreamMetricsDOM.ts | src/templates/ui/ComponentFactory.ts | ✅ Completed | High |
| adaptModalConfig | multiple modals | src/dom/modals/ModalFactory.ts | ⬜ Not Started | High |
| convertEventHandlers | multiple components | src/templates/ui/EventHandling.ts | ✅ Completed | Medium |
| createFilterElement | TimeFilterManager.ts | src/filters/FilterFactory.ts | ⬜ Not Started | Medium |

## Classification Strategy

Each adapter function is classified into one of three categories:

### Keep
Functions that should remain as permanent parts of the codebase because they provide essential functionality that will be needed long-term.

**Criteria for "Keep":**
- Used throughout the codebase in critical components
- Provides backward compatibility that will be needed for user data
- Implements functionality that has no better alternative

### Refactor
Functions that should be reimplemented in a more appropriate location with better typing and documentation.

**Criteria for "Refactor":**
- Currently implemented as an adapter but represents core functionality
- Would benefit from improved typing and proper integration
- Should be moved to a more logical module

### Remove
Functions that were created solely for the migration and can be safely removed once dependencies are updated.

**Criteria for "Remove":**
- Created specifically to bridge old and new code during migration
- Has a clear replacement in the new architecture
- Only used in a few specific places that can be easily updated

### Classification Tracking Table

For a complete classification of all adapter functions, see the [Expanded Adapter Function Classification](./adapter-classification-expanded.md) document. Below is a summary of key functions:

| Function | Classification | Rationale | Next Steps |
|----------|----------------|-----------|------------|
| ContentParserAdapter.adaptExtractDreamEntries | Remove | Temporary bridge for parameter mismatches | ✅ Updated ContentParser to handle parameter variations directly |
| UIComponentAdapter.adaptMetricForUI | Refactor | Core functionality, poor location | Move to MetricComponent as a proper method |
| UIComponentAdapter.adaptEntryForUI | Refactor | Core functionality, poor location | Move to EntryComponent as a proper method |
| SettingsAdapter.adaptSelectionMode | Keep | Critical for backward compatibility | Move to selection-mode-helpers.ts |
| adaptSettingsToCore | Refactor | Core functionality, should be in state/adapters | Create proper SettingsAdapter class in state/adapters |
| getProjectNotePathSafe | Keep | Essential for backward compatibility | Already properly placed in settings-helpers.ts |
| getPropertyCompatibly | Refactor | Core functionality for property access | Create proper PropertyAccessor class |
| createCompatibleComponent | Remove | Temporary bridge for component creation | Update component creation in UI modules |

## Model Adapter Patterns

To guide our adapter migration work, we've identified selection-mode-helpers.ts as a model adapter implementation that exemplifies best practices for maintaining compatibility while ensuring type safety and usability.

### Reference Implementation: selection-mode-helpers.ts

The selection-mode-helpers.ts file addresses a critical compatibility issue in the codebase: two different naming conventions for selection modes are used throughout the app:
- Modern/UI naming: 'notes' and 'folder'
- Legacy/internal naming: 'manual' and 'automatic'

This adapter provides a complete set of utilities for working with these dual naming conventions:

```typescript
// Basic type checks
isFolderMode(mode: SelectionMode): boolean
isNotesMode(mode: SelectionMode): boolean

// Equivalence checking
areSelectionModesEquivalent(mode1: SelectionMode, mode2: SelectionMode): boolean

// UI presentation
getSelectionModeLabel(mode: SelectionMode): string
getSelectionModeDescription(mode: SelectionMode): string

// Normalization
normalizeSelectionMode(mode: SelectionMode): 'manual' | 'automatic'
normalizeLegacySelectionMode(mode: SelectionMode): 'notes' | 'folder'
getCompatibleSelectionMode(mode: string, format: 'ui' | 'internal'): string
```

### Key Characteristics of Successful Adapters

Based on our analysis of selection-mode-helpers.ts, we've identified these key characteristics that make it a successful adapter pattern:

1. **Narrow focus**: Addresses a single, specific compatibility issue
2. **Comprehensive coverage**: Provides all operations needed for the domain (checking, converting, displaying)
3. **Well-documented**: Each function has clear JSDoc comments explaining purpose and parameters
4. **Type safety**: Uses proper TypeScript types throughout
5. **Abstraction**: Hides the complexity of dual naming systems from consuming code
6. **Zero dependencies**: Only depends on core types, not on other adapters
7. **Symmetrical API**: Provides both "get" and "normalize" operations for bidirectional compatibility

### Usage Patterns to Adopt

When implementing new adapter functions or refactoring existing ones, follow these patterns:

```typescript
// AVOID direct comparisons with multiple values:
if (mode === 'notes' || mode === 'manual') {
  // ...
}

// PREFER adapter functions:
if (isNotesMode(mode)) {
  // ...
}

// AVOID direct property access with fallbacks:
const projectPath = settings.projectNote || settings.projectNotePath || '';

// PREFER helper functions:
const projectPath = getProjectNotePath(settings);
```

### Adapter Design Guidelines

When creating or refactoring adapters, follow these guidelines:

1. **Function naming**:
   - Use descriptive names that indicate purpose
   - Use prefixes like "is", "get", "normalize" to indicate function type

2. **Parameter consistency**:
   - Keep parameter order consistent across related functions
   - Use explicit type annotations for parameters and return values

3. **Documentation**:
   - Include JSDoc comments for all exported functions
   - Document parameters and return values
   - Explain any non-obvious behavior or edge cases

4. **Error handling**:
   - Provide reasonable defaults for missing or invalid values
   - Use type guards to ensure type safety

5. **Testing**:
   - Create unit tests for all adapter functions
   - Test with various input combinations including edge cases

By following these patterns and guidelines, we'll create adapters that are maintainable, type-safe, and facilitate the gradual migration to our new architecture.

## Implementation Phases

### Phase 1: Create Permanent Replacements (Target: 2025-06-20)
- Implement permanent replacements for adapter functions classified as "Keep" or "Refactor"
- Document the new implementations thoroughly
- Add tests for the new implementations
- Update exports in barrel files

#### Task Tracking for Phase 1

| Task | Status | Target Date | Dependencies |
|------|--------|-------------|--------------|
| Create SettingsAdapter class | ✅ Completed | 2025-05-26 | None |
| Implement EventHandling module | ✅ Completed | 2025-06-15 | None |
| Create PropertyAccessor class | ✅ Completed | 2025-05-26 | None |
| Implement ComponentFactory | ✅ Completed | 2025-06-15 | None |
| Update ContentParser for parameter variations | ✅ Completed | 2025-05-26 | None |

### Phase 2: Update Core Files (Target: 2025-07-05)
- Update imports in critical files (main.ts, settings.ts, etc.)
- Replace direct usage of adapter functions with new implementations
- Test thoroughly after each file update
- Address any TypeScript errors that arise

#### Task Tracking for Phase 2

| Task | Status | Target Date | Dependencies |
|------|--------|-------------|--------------|
| Update main.ts settings handling | 🔄 In Progress | 2025-06-25 | ✅ SettingsAdapter |
| Update main.ts event handling | ⬜ Not Started | 2025-06-28 | ✅ EventHandling |
| Update settings.ts | ⬜ Not Started | 2025-07-01 | ✅ SettingsAdapter |
| Update DreamMetricsState.ts | ⬜ Not Started | 2025-07-03 | ✅ SettingsAdapter |

### Phase 3: Update Peripheral Files (Target: 2025-07-15)
- Update imports in non-critical components
- Start with simpler files first
- Test functionality after each update
- Track progress in dependency tables

#### Task Tracking for Phase 3

| Task | Status | Target Date | Dependencies |
|------|--------|-------------|--------------|
| Update UI components | ⬜ Not Started | 2025-07-10 | ComponentFactory |
| Update service modules | ⬜ Not Started | 2025-07-12 | All Phase 1 items |
| Update utility modules | ⬜ Not Started | 2025-07-14 | PropertyAccessor |

### Phase 4: Testing and Verification (Target: 2025-07-25)
- Run comprehensive tests on the updated codebase
- Verify all features still work as expected
- Address any issues discovered
- Prepare for adapter file removal

#### Task Tracking for Phase 4

| Task | Status | Target Date | Dependencies |
|------|--------|-------------|--------------|
| Run unit tests | 🔄 In Progress | 2025-07-18 | Phases 1-3 |
| Manual feature testing | ⬜ Not Started | 2025-07-20 | Phases 1-3 |
| Performance testing | ⬜ Not Started | 2025-07-22 | Phases 1-3 |
| Documentation verification | ⬜ Not Started | 2025-07-24 | Phases 1-3 |

### Phase 5: Adapter Files Removal (Target: 2025-08-01)
- Create stub files that re-export from new locations
- Replace adapter files with stubs
- Test thoroughly
- Remove or hide test commands from the command palette 
- Eventually remove stubs entirely

#### Task Tracking for Phase 5

| Task | Status | Target Date | Dependencies |
|------|--------|-------------|--------------|
| Create adapter-functions.ts stub | ⬜ Not Started | 2025-07-27 | Phase 4 |
| Create type-adapters.ts stub | ⬜ Not Started | 2025-07-28 | Phase 4 |
| Create property-compatibility.ts stub | ⬜ Not Started | 2025-07-29 | Phase 4 |
| Create component-migrator.ts stub | ⬜ Not Started | 2025-07-30 | Phase 4 |
| Remove/hide test commands | ⬜ Not Started | 2025-07-31 | All tests passing |
| Final verification | ⬜ Not Started | 2025-08-01 | All stubs created |

#### Handling Test Commands

To keep the command palette clean while still allowing developers to run tests, we'll implement one of the following approaches:

1. **Developer Mode Toggle**: Only show test commands when developer mode is enabled in settings
   - Modify the command registration to check `this.settings.developerMode` before registering test commands
   - Add documentation for how to enable developer mode to access tests

2. **Consolidated Test Command**: Replace individual test commands with a single "Run All Tests" command
   - Create a test selection UI modal that appears when the command is run
   - Allow users to select which test suite to run from the modal

3. **Test Plugin**: Move test commands to a separate companion plugin
   - Create a dedicated testing plugin that references the main plugin
   - Install only during development, not in production releases

## Testing Strategy

### Unit Testing
- Create unit tests for all new implementations
- Ensure they match the behavior of the adapter functions
- Test with a variety of inputs, including edge cases

### Integration Testing
- Test components that interact with the new implementations
- Verify that all features work as expected
- Check for performance issues

### Regression Testing
- Run the existing test suite
- Verify no new bugs have been introduced
- Check functionality with real user data

### Manual Testing
- Test all UI components and user interactions
- Verify that the plugin works as expected in Obsidian
- Check compatibility with different Obsidian versions
- Use Obsidian commands to test adapters directly in the app environment

### Testing Commands
- Added commands to main.ts to run adapter tests from within Obsidian
- Created specific testing scripts for complex adapters
- Added direct testing methods for adapter functionality verification
- Commands appear in the Obsidian command palette with "Run X Tests" naming

## Detailed Timeline

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 2025-05-25 | Planning | Comprehensive plan, initial dependency audit |
| 2025-06-01 | Dependency Audit | Complete dependency mapping |
| 2025-06-08 | Classification | Completed classification table |
| 2025-06-15 | Implementation | Core replacements for critical adapters |
| 2025-06-22 | Core Files | Update main.ts adapter usage |
| 2025-06-29 | Core Files | Complete critical file updates |
| 2025-07-06 | Peripheral Files | Update UI components |
| 2025-07-13 | Peripheral Files | Complete all file updates |
| 2025-07-20 | Testing | Comprehensive testing |
| 2025-07-27 | Removal | Create adapter stubs |
| 2025-08-03 | Completion | Final verification and cleanup |

## Verification Process

Before considering the adapter migration complete, we will perform these verification steps:

1. **Compile with Strict Checks**
   - Run full TypeScript compilation with strict settings enabled
   - Verify zero TypeScript errors

2. **Test Suite Execution**
   - Run the complete test suite
   - Ensure all tests pass with no regression

3. **Manual Testing**
   - Manually test all critical plugin functionality
   - Verify proper functioning in both light and dark themes
   - Test across different operating systems if applicable

4. **Performance Verification**
   - Check that performance metrics match or exceed pre-migration baselines
   - Test with large datasets to ensure no performance regressions

### Verification Checklist

| Verification Task | Status | Date | Notes |
|-------------------|--------|------|-------|
| TypeScript compilation | ⬜ Not Started | - | - |
| Unit tests | 🔄 In Progress | 2025-06-15 | Created and validated tests for settings-helpers.ts (22 tests), metric-helpers.ts (11 tests), selection-mode-helpers.ts (9 tests), type-guards.ts (10 tests), property-helpers.ts (10 tests), ContentParser parameter variations (7 tests), SettingsAdapter (11 tests), EventHandling (10 tests), and ComponentFactory (5 tests) |
| Integration tests | ⬜ Not Started | - | - |
| Manual testing | 🔄 In Progress | 2025-06-15 | Verified ContentParser parameter variations and ComponentFactory in Obsidian environment with real test data |
| Performance testing | ⬜ Not Started | - | - |
| Documentation review | 🔄 In Progress | 2025-05-26 | Created adapter-testing-patterns.md and adapter-testing-integration.md |
| Final approval | ⬜ Not Started | - | - |

## Appendix

### References

- [TypeScript Architecture and Lessons](../architecture/typescript-architecture-lessons.md)
- [Post-Refactoring Roadmap](./post-refactoring-roadmap.md)
- [Post-Refactoring Cleanup Checklist](../../archive/refactoring-2025/post-refactoring-cleanup-checklist.md)
- [TypeScript Interface Standards](./typescript-interface-standards.md)
- [TypeScript Helper Utilities Guide](./typescript-helper-utilities.md)
- [Adapter Testing Patterns](./testing/adapter-testing-patterns.md)
- [Adapter Testing Integration Guide](./adapter-testing-integration.md)
- [TypeScript Best Practices Guide](./typescript-best-practices.md)
- [TypeScript Adapter Pattern Guide](./typescript-adapter-patterns.md)
- [TypeScript Unified Interface Plan](./typescript-unified-interface-plan.md)
- [Expanded Adapter Function Classification](./adapter-classification-expanded.md)

### Dependency Analysis Methodology

To identify adapter file dependencies, we use a combination of:
1. Static code analysis using grep/search
2. Manual code review for context
3. Automated TypeScript dependency tracking

For each adapter function, we document:
- Files that import it
- How it's used in those files
- What would be required to replace it
- Potential risks in migration

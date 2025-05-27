# OneiroMetrics Post-Refactoring Roadmap

> **Note: Adapter Migration Complete** - May 26, 2025  
> The adapter migration plan has been fully implemented. All adapter modules have been replaced with permanent implementations, and legacy adapter files now redirect to their permanent replacements with proper deprecation notices.
> See the [Adapter Migration Plan (Archived)](../../archive/refactoring-2025/adapter-migration-plan.md) for historical details.

## Executive Summary
**Status**: In Progress

**Last Updated**: 2025-06-03

**Key Milestones**: 
- Documentation reorganization: ✅ Completed
- Legacy documentation archived: ✅ Completed
- TypeScript Architecture document: ✅ Completed
- Adapter migration plan: ✅ Completed (100%)
- Code cleanup (main.ts): 🔄 In Progress (15%)
  - Date functions refactored: ✅ Completed
  - Logging refactoring: 🔄 In Progress (90%)
  - UI interaction logs standardized: ✅ Completed (100%)
  - Filter-related logs standardized: ✅ Completed (100%)
- Comprehensive testing: ⬜ Not Started
- Performance optimization: ⬜ Not Started

This document outlines the roadmap for OneiroMetrics development after the completion of the 2025 refactoring project. It focuses on further improvements to build upon the newly refactored architecture.

## Table of Contents

- [Executive Summary](#executive-summary)
- [Overview](#overview)
- [Phase 1: Code Cleanup and Adapter Migration](#phase-1-code-cleanup-and-adapter-migration)
  - [Tasks](#tasks)
  - [Current Progress](#current-progress)
  - [Adapter Files Dependency Tracking](#adapter-files-dependency-tracking)
- [Comprehensive Testing Initiative](#comprehensive-testing-initiative)
  - [Testing Priorities](#testing-priorities)
  - [Testing Approach](#testing-approach)
  - [Testing Documentation](#testing-documentation)
  - [Merge Criteria](#merge-criteria)
  - [Testing Timeline](#testing-timeline)
  - [Success Criteria](#success-criteria)
  - [Integration with Existing Work](#integration-with-existing-work)
- [Phase 2: TypeScript Improvements and Performance Optimization](#phase-2-typescript-improvements-and-performance-optimization)
  - [TypeScript Improvement Tasks](#typescript-improvement-tasks)
  - [Performance Optimization Tasks](#performance-optimization-tasks)
- [Phase 3: Documentation Enhancement](#phase-3-documentation-enhancement)
  - [Tasks](#tasks-1)
- [Phase 4: Advanced Optimization](#phase-4-advanced-optimization)
  - [Tasks](#tasks-2)
- [Post-Refactoring Management TODOs](#post-refactoring-management-todos)
  - [Priority Tasks (Next 1-2 Days)](#priority-tasks-next-1-2-days)
  - [Additional Tasks](#additional-tasks)
- [Timeline and Priorities](#timeline-and-priorities)
- [Success Metrics](#success-metrics)
- [Post-Refactoring Cleanup](#post-refactoring-cleanup)
- [Post-Refactoring Priorities](#post-refactoring-priorities)
- [Weekly Status Updates](#weekly-status-updates)
- [Milestone Tracking](#milestone-tracking)

## Overview

With the major architectural refactoring complete, OneiroMetrics now has a modular, maintainable codebase with clear separation of concerns. This roadmap details the next steps to further improve the plugin in terms of performance, user experience, and developer satisfaction.

The post-refactoring improvements are organized into four sequential phases, each building upon the previous one. These improvements aim to leverage the new architecture while addressing remaining technical debt and enhancing user experience.

## Phase 1: Code Cleanup and Adapter Migration

**Goal:** Ensure consistency, quality, and modularity across the codebase following the major refactoring.

### Tasks:

1. **Naming Standardization**
   - [ ] Ensure consistent naming conventions across all modules
   - [ ] Rename any remaining ambiguous variables and functions
   - [ ] Update file names to better reflect their contents

2. **Code Style Consistency**
   - [ ] Apply consistent indentation and formatting
   - [ ] Standardize comment style and documentation
   - [ ] Run linting tools across the entire codebase

3. **Dead Code Elimination**
   - [ ] Remove commented-out code sections
   - [ ] Delete unused functions and variables
   - [ ] Clean up redundant imports

4. **Type Definition Refinement**
   - [ ] Strengthen type definitions
   - [ ] Eliminate any remaining `any` types
   - [ ] Add explicit return types to all functions

5. **TypeScript Error Resolution**
   - [x] Fix approximately 150+ TypeScript errors across the codebase
   - [x] Address interface definition inconsistencies (see archived docs in `docs/archive/refactoring-2025/`)
   - [x] Resolve type compatibility issues with SelectionMode and LogLevel
   - [x] Fix missing or incorrectly referenced properties in interfaces
   - [x] Install missing dependencies
   - [x] Address object property access issues
   - [x] Follow standardized interface patterns in [typescript-interface-standards.md](./typescript-interface-standards.md)

6. **Dependency Audit and Adapter Migration**
   - [ ] Identify all places using adapter files (adapter-functions.ts, type-adapters.ts, etc.)
   - [ ] Map legacy functions in main.ts to their module counterparts
   - [ ] Classify adapter functions with a keep/refactor/remove strategy
   - [ ] Document dependencies between components for safe migration

7. **Main.ts Cleanup**
   - [ ] Identify deprecated code in main.ts that duplicates module functionality
   - [ ] Replace direct usage of legacy functions with module counterparts
   - [ ] Remove unnecessary code superseded by the modular architecture
   - [ ] Ensure proper initialization and integration with modules

8. **Adapter Migration Implementation**
   - [ ] Implement permanent replacements for essential adapter functionality
   - [ ] Update imports one file at a time, starting with non-critical components
   - [ ] Verify functionality after each migration step
   - [ ] Remove temporary adapter code once dependencies are updated

### Current Progress:

- ✅ Created documentation of TypeScript issues (now archived in `docs/archive/refactoring-2025/`)
- ✅ Added `build:force` script to bypass TypeScript errors during development
- ✅ Added missing `ts-debounce` dependency
- ✅ Modified tsconfig.json to allow development to continue
- ✅ Updated the root-level types.ts file to ensure better compatibility
- ✅ Created TypeScript interface standards in `typescript-interface-standards.md`
- ✅ Created type guard utilities for safer property access
- ✅ Added mapping functions for SelectionMode type compatibility
- ✅ Fixed calloutMetadata array type definition
- ✅ Added backward compatibility helpers for logging configuration
- ✅ Created settings-helpers.ts with utilities for safe settings access
- ✅ Made DreamMetricsSettings properties required to match usage throughout codebase
- ✅ Created metric-helpers.ts with utilities for handling legacy metric properties
- ✅ Added proper documentation for deprecated properties
- ✅ Fixed callout-utils.ts to handle both array and single object formats
- ✅ Enhanced selection-mode-helpers.ts with more comprehensive comparison functions
- ✅ Expanded settings-helpers.ts with additional utility functions
- ✅ Created TestRunner stub in testing directory
- ✅ Created ContentParser, state, and template stubs to satisfy imports
- ✅ Updated build-force.cmd script to bypass TypeScript errors for Windows users
- ✅ Created type-adapters.ts to help safely adapt between legacy and new type systems
- ✅ Completed ContentParser implementation with full error handling and robust functionality
- ✅ Fixed test function signatures to support both sync and async tests with improved error handling
- ✅ Created a comprehensive TypeScript Architecture and Lessons document
- 🔄 Conducting dependency audit for adapter files (20% complete)
- ⬜ Classify adapter functions (keep/refactor/remove)
- 🔄 Clean up main.ts by replacing legacy functions with module counterparts (15% complete)
- ⬜ Systematically update main codebase files using the new utilities

### Adapter Files Dependency Tracking

| Adapter File | Used In | Function Dependencies | Migration Status | Complexity |
|--------------|---------|------------------------|-----------------|------------|
| adapter-functions.ts | main.ts, DateNavigator.ts | getProjectNotePath, adaptSettingsToCore, convertSourceToFormat | ✅ Completed | High |
| type-adapters.ts | main.ts, DreamMetricsState.ts | getSelectionModeSafe, getProjectNotePathSafe, isBackupEnabledSafe | ✅ Completed | Medium |
| property-compatibility.ts | DreamMetricsProcessor.ts | getCalloutMetadata, extractMetricValue, applyPropertyDefaults | ✅ Completed | Medium |
| component-migrator.ts | DreamMetricsDOM.ts, TimeFilterManager.ts | createFilterElement, adaptModalConfig, convertEventHandlers | ✅ Completed | High |
| selection-mode-helpers.ts | multiple files | isFolderMode, isNotesMode, areSelectionModesEquivalent | ✅ Permanent | Low |
| settings-helpers.ts | multiple files | getProjectNotePath, getSelectionMode, getBackupFolderPath | ✅ Permanent | Low |
| metric-helpers.ts | multiple files | isMetricEnabled, getMetricRange, standardizeMetric | ✅ Permanent | Low |

## Comprehensive Testing Initiative

**Goal:** Verify the integrity and functionality of the refactored codebase through systematic testing of all components and user-facing features.

### Testing Priorities:

1. **Settings System Testing**
   - Verify settings persistence and retrieval
   - Test settings migration between versions
   - Validate settings adaptation via adaptSettingsToCore
   - Test default values application
   - Verify UI interactions with settings components
   - Test all settings helper functions

2. **Systematic Functional Testing**
   - Create a comprehensive test matrix of all user features
   - Test each feature systematically in actual Obsidian environments
   - Verify all UI components render correctly
   - Test all user interaction flows from start to finish

3. **Edge Case Testing**
   - Test with large journals (1000+ entries)
   - Test with various date formats and range selections
   - Verify behavior with malformed or incomplete journal entries
   - Test functionality with missing or corrupted settings

4. **Cross-Environment Verification**
   - Test on multiple platforms (Windows, macOS, Linux)
   - Test with different Obsidian versions (current stable, previous, insider builds)
   - Validate functionality with various plugin configurations
   - Test with different vault sizes and structures

### Testing Approach:

#### Settings System Tests

| Test Category | Test Cases | Priority | Status |
|--------------|------------|----------|--------|
| Default Settings | Verify default settings applied on first run | High | ⬜ Not Started |
| Settings Persistence | Test saving and loading settings | High | ⬜ Not Started |
| Settings Migration | Test migration from older versions | High | ⬜ Not Started |
| Settings UI | Test all settings UI components | Medium | ⬜ Not Started |
| Helper Functions | Test all settings helper functions | High | ⬜ Not Started |
| Backward Compatibility | Test compatibility with old settings format | Medium | ⬜ Not Started |
| Error Handling | Test recovery from corrupted settings | Medium | ⬜ Not Started |

#### Functional Test Matrix

| Feature Category | Test Cases | Priority | Status |
|------------------|------------|----------|--------|
| Dream Journal Management | Dream entry creation and editing | High | ⬜ Not Started |
|                          | Journal structure validation | High | ⬜ Not Started |
|                          | Template application | High | ⬜ Not Started |
| Metrics Tracking | Metrics calculation and display | High | ⬜ Not Started |
|                  | Custom metrics creation | Medium | ⬜ Not Started |
|                  | Metrics visualization | Medium | ⬜ Not Started |
| Date Navigation | Calendar view functionality | High | ⬜ Not Started |
|                 | Date range selection | High | ⬜ Not Started |
|                 | Custom date range creation | Medium | ⬜ Not Started |
| Backup System | Manual backup creation | Medium | ⬜ Not Started |
|               | Automatic backup scheduling | Medium | ⬜ Not Started |
|               | Backup restoration | High | ⬜ Not Started |
| Integration Features | Templater integration | Medium | ⬜ Not Started |
|                      | Calendar plugin compatibility | Medium | ⬜ Not Started |
|                      | Dataview compatibility | Low | ⬜ Not Started |

### Testing Documentation:

Each test should be documented with:
- Specific test steps to reproduce
- Expected outcome
- Actual outcome
- Environment details
- Version information

**Comprehensive test documentation is maintained in the [Testing Documentation Index](./testing/index.md), which contains links to detailed test plans for each component and feature area.**

### Merge Criteria:

**The criteria for merging the `refactoring/2025-typescript` branch back to the `main` branch has moved from a time-based approach to a test-completion-based approach.** The detailed merge criteria, including core test requirements and approval process, are documented in [Testing Documentation - Merge Criteria](./testing/index.md#merge-criteria).

> **Note:** The `refactoring/2025-typescript` branch is the current active development branch for the TypeScript refactoring effort, superseding the earlier `refactoring/2025` branch. All testing and merge criteria apply specifically to the `refactoring/2025-typescript` branch.

### Testing Timeline:

- Settings System Tests: 1 week
- Core Functionality Tests: 2 weeks
- Extended Feature Tests: 1 week
- Cross-Environment Tests: 1 week
- Bug fixing and verification: 1 week

### Success Criteria:

- All critical and high-priority tests passed
- No critical bugs remaining in core functionality
- Settings system fully verified across platforms
- All user workflows validated end-to-end
- Thorough documentation of test results

### Integration with Existing Work:

This testing initiative complements the TypeScript error resolution work by ensuring that the syntactic correctness of the code (addressed by TypeScript) is matched by functional correctness (addressed by this testing). The testing will also generate real-world examples that can be used in the documentation enhancement phase.

Detailed test plans have been created for key components:
- [Settings Component Test Plan](./testing/settings-test-plan.md) - Comprehensive testing of the settings system
- [Dream Journal Management Test Plan](./testing/journal-management-test-plan.md) - End-to-end testing of journal functionality

Additional test plans will be created for other components following the same structure and approach.

## Phase 2: TypeScript Improvements and Performance Optimization

**Goal:** Enhance the overall performance, type safety, and responsiveness of the plugin.

### TypeScript Improvement Tasks:

1. **Fix Remaining TypeScript Errors**
   - Address type inconsistencies in interfaces
   - Implement proper type guards where needed
   - Fix incorrect property access patterns
   - Ensure consistent typing across components

2. **Enhance Type Safety**
   - Add stronger typing to function parameters and returns
   - Replace any types with more specific definitions
   - Document complex type relationships
   - Implement proper nullable handling

3. **Type System Architecture Refinement**
   - Standardize type imports across codebase
   - Create consolidated type libraries for related domains
   - Improve interface inheritance patterns
   - Document type relationships with diagrams

### Performance Optimization Tasks:

1. **CSS Optimization**
   - Optimize CSS selectors for performance
   - Reduce specificity conflicts
   - Minimize redundant styles
   - Improve animation performance

2. **Data Processing Optimization**
   - Implement lazy loading for large datasets
   - Add caching for frequently accessed data
   - Optimize validation engine for faster processing
   - Refine data structures for better memory usage

3. **UI Rendering Improvements**
   - Reduce unnecessary DOM manipulations
   - Optimize component rendering cycles
   - Implement virtual scrolling for large lists
   - Improve modal rendering performance

4. **File Operation Optimization**
   - Batch file operations when possible
   - Implement more efficient file reading strategies
   - Add progressive loading for large files
   - Optimize search and filtering operations

5. **UI-Specific Optimizations**
   - Calendar preview optimization
   - Time filter state management improvements
   - Date range selector performance enhancements
   - Metrics visualization efficiency improvements

## Phase 3: Documentation Enhancement

**Goal:** Provide comprehensive, accessible documentation for users and developers.

### Tasks:

1. **User Documentation**
   - Create step-by-step tutorials for common workflows
   - Develop visual guides with annotated screenshots
   - Write clear explanations of all features and options
   - Create video tutorials for complex features

2. **Developer Documentation**
   - Document architecture with updated diagrams
   - Provide contributing guidelines
   - Create API documentation
   - Add code examples for plugin extension

3. **Visual Documentation**
   - Create and update architecture diagrams
   - Add workflow diagrams for complex processes
   - Design user flow diagrams
   - Create component hierarchy visualizations

4. **Documentation Integration**
   - Implement in-app help system
   - Add contextual documentation
   - Create a searchable documentation portal
   - Link external resources and community content

## Phase 4: Advanced Optimization

**Goal:** Implement cutting-edge improvements that leverage the new architecture.

### Tasks:

1. **Advanced State Management**
   - Implement reactive state management
   - Add state persistence improvements
   - Create better state debugging tools
   - Optimize state update propagation

2. **Testing Infrastructure Enhancement**
   - Expand unit test coverage to 90%+
   - Add automated UI testing
   - Implement visual regression testing
   - Create performance benchmark tests

3. **Accessibility Improvements**
   - Ensure WCAG 2.1 AA compliance
   - Improve keyboard navigation
   - Enhance screen reader support
   - Add high contrast mode support

4. **Mobile Experience Optimization**
   - Refine touch interactions
   - Optimize for small screens
   - Improve performance on mobile devices
   - Create mobile-specific UI adaptations

5. **Integration Enhancements**
   - Improve Templater integration
   - Add Dataview compatibility
   - Enhance Calendar plugin integration
   - Create API for third-party plugin integration

## Post-Refactoring Management TODOs

**Goal:** Enhance the management of the post-refactoring phase and prepare for successful branch merging.

### Priority Tasks (Next 1-2 Days):

- [ ] **Test Tracking Dashboard**
  - Create a visual dashboard (markdown file or Obsidian canvas) to track test completion
  - Include progress bars or checklists for each test category
  - Link to the relevant test plan documents
  - Update daily during the testing phase

- [ ] **Branch Protection Rules**
  - Set up protection rules for the `main` branch
  - Require reviews before merging the `refactoring/2025-typescript` branch
  - Enforce test completion requirements via GitHub branch rules

- [ ] **Automated Testing Setup**
  - Implement initial automated tests for core components
  - Focus on the four merge criteria areas: Settings, Scraping, Tables, Filters
  - Create simple assertion-based tests for critical functions
  - Document test setup for contributors

- [ ] **User Communication Plan**
  - Draft announcement for the upcoming merged changes
  - Prepare release notes for the first post-refactoring release
  - Create a user-friendly explanation of the improvements
  - Plan communication channels and timing

### Additional Tasks:

- [ ] **Documentation Review**
  - Schedule a final documentation review before merging
  - Ensure consistency across all documents
  - Check for outdated references or examples
  - Verify technical accuracy of all documentation

- [ ] **Refactoring Retrospective**
  - Plan a retrospective session to document lessons learned
  - Create a template for capturing feedback
  - Document what went well and areas for improvement
  - Create recommendations for future major changes

- [ ] **Regular Status Updates**
  - Establish a regular cadence for CHANGELOG updates
  - Add brief status updates as testing milestones are reached
  - Keep users informed of progress without promising specific dates
  - Include screenshots of any visible improvements

## Timeline and Priorities

The implementation timeline is structured to deliver meaningful improvements at regular intervals:

| Phase | Estimated Duration | Priority | Dependencies | Current Status |
|-------|-------------------|----------|--------------|----------------|
| Code Cleanup and Adapter Migration | 3 weeks | Critical | None | 🔄 In Progress (25%) |
| Comprehensive Testing | 6 weeks | Critical | Code Cleanup and Adapter Migration | ⬜ Not Started |
| TypeScript Improvements and Performance Optimization | 5 weeks | High | Code Cleanup and Adapter Migration, Comprehensive Testing | ⬜ Not Started |
| Documentation Enhancement | 3 weeks | Medium | Code Cleanup and Adapter Migration, Comprehensive Testing | ⬜ Not Started |
| Advanced Optimization | 6 weeks | Medium | TypeScript Improvements and Performance Optimization | ⬜ Not Started |

**Key Milestones:**
- Code cleanup and adapter migration completion: +3 weeks
- Comprehensive testing completion: +9 weeks
- TypeScript improvements and performance optimization release: +14 weeks
- Documentation portal launch: +17 weeks
- Advanced features release: +23 weeks

## Success Metrics

The success of these improvements will be measured through:

1. **Performance Metrics**
   - Startup time: 50% reduction
   - UI rendering time: 40% improvement
   - Memory usage: 30% reduction
   - File processing speed: 60% improvement

2. **User Satisfaction**
   - Feature usage analytics
   - User feedback ratings
   - Support request reduction
   - Community engagement

3. **Developer Experience**
   - Time to onboard new contributors
   - Pull request quality and acceptance rate
   - Bug report reduction
   - Documentation completeness score

4. **Code Quality**
   - Test coverage percentage
   - Static analysis scores
   - Technical debt reduction
   - Maintainability index improvement

## Post-Refactoring Cleanup

Once the refactoring process is fully completed and the improvements outlined in this roadmap are implemented, the following cleanup tasks should be performed:

1. **Documentation Cleanup**
   - ✅ Archive all refactoring-related documentation to the docs/archive/refactoring-2025 directory
   - ✅ Moved temporary refactoring guides to `docs/archive/refactoring-2025/`
   - ✅ Created consolidated TypeScript architecture lessons document
   - ✅ Updated adapter files with migration notices
   - ✅ Created a phased approach for adapter migration
   - ⬜ Archive component migration guides and examples once all components are migrated
   - ⬜ Keep only the documentation needed for ongoing development and maintenance
   - ⬜ Follow the detailed steps in [TypeScript Architecture and Lessons](../../architecture/typescript-architecture-lessons.md#cleanup-and-verification-checklist)

2. **Code Cleanup**
   - ⬜ Remove temporary adapter functions and compatibility layers after dependency audit
   - ⬜ Clean up main.ts to use proper module functions
   - ⬜ Consolidate helper functions that have overlapping functionality
   - ⬜ Remove deprecated APIs after ensuring no components depend on them
   - ⬜ Complete adapter migration using the phased approach
   - ⬜ Use the [cleanup checklist](../../architecture/typescript-architecture-lessons.md#cleanup-and-verification-checklist) to track progress

## Post-Refactoring Priorities

### Critical Issues

These issues must be addressed before merging to main branch:

- [x] HTML rendering issues in metrics notes - Fixed with proper HTML content wrapping
- [x] Filter display issues (incorrect filter counts) - Fixed with improved visibility calculation
- [x] "Read More" button not working on first load - Fixed with MutationObserver implementation
- [x] Summary table not updating when filters are applied - Fixed by ensuring metrics recalculation after filtering
- [x] Date Navigator command not working properly - Fixed with proper dream entry loading, error handling, and modal styling
- [x] Filter persistence between Obsidian reloads

### Future Enhancements

These enhancements are planned for after the refactoring branch is merged:

- [ ] **Date Navigator UX Enhancement**
  - Implement auto-apply filter when clicking on a day with dream entries
  - Remove the need for explicitly clicking the Apply button
  - Improve user flow and reduce friction
  - Restore missing star icons for days that have dream entries
  - Estimated effort: Low (1-2 hours)
- [ ] **Metric value filtering**
  - Ensure that metric value filters are present and working

## Weekly Status Updates

| Date | Progress Summary | Completed Items | Blockers | Next Steps |
|------|-----------------|----------------|----------|------------|
| 2025-05-25 | Completed documentation cleanup and archiving; Started adapter dependency audit | Created consolidated TypeScript Architecture and Lessons document; Archived all refactoring documentation; Added migration notices to adapter files; Created phased adapter migration plan | None | Continue adapter dependency audit; Begin cleanup of main.ts; Conduct adapter functions classification |
| 2025-05-25 | Improved type definitions and fixed build issues | Created SelectionMode type for compatibility; Updated DreamMetricData.source to support both formats; Fixed calloutMetadata property typing; Added missing properties to interfaces; Created backwards compatibility aliases | None | Complete documentation reorganization; Archive refactoring documentation; Start adapter migration plan |
| 2025-05-25 | Replaced console.log statements with structured logging in main.ts; Updated dependencies | Added domain-specific logging categories; Used consistent log levels; Fixed security vulnerability in esbuild dependency; Fixed duplicate variable declaration causing build errors | None | Continue type definition refinement; Update remaining log statements |
| 2025-05-25 | Created type-specific adapter and helper utilities; Improved TypeScript compatibility | Created settings-helpers.ts, metric-helpers.ts, and selection-mode-helpers.ts; Added type guards for safer property access; Created backward compatibility layers | None | Replace console.log statements with structured logging; Address remaining TypeScript errors |

## Milestone Tracking

| Milestone | Target Date | Status | Notes |
|-----------|------------|--------|-------|
| TypeScript Errors Fixed | 2025-05-25 | ✅ Completed | Created helper utilities and adapter functions for type safety |
| Documentation Cleanup | 2025-05-25 | ✅ Completed | Consolidated and archived all refactoring documentation |
| Adapter Dependency Audit | 2025-05-30 | 🔄 In Progress | Mapping usage across codebase and identifying migration paths |
| main.ts Cleanup | 2025-06-10 | 🔄 In Progress | Replacing legacy code with module functions |
| Adapter Migration Implementation | 2025-06-05 | ⬜ Not Started | |
| Comprehensive Testing Complete | 2025-06-12 | ⬜ Not Started | |
| TypeScript Improvements | 2025-06-15 | ⬜ Not Started | |
| Performance Optimization | 2025-06-20 | ⬜ Not Started | |
| Documentation Portal | 2025-06-30 | ⬜ Not Started | |
| Advanced Features | 2025-07-03 | ⬜ Not Started | |

---

*This roadmap is a living document and may be revised as development progresses and new priorities emerge.* 

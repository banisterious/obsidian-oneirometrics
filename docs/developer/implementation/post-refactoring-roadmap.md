# OneiroMetrics Post-Refactoring Roadmap

This document outlines the roadmap for OneiroMetrics development after the completion of the 2025 refactoring project. It focuses on further improvements to build upon the newly refactored architecture.

## Table of Contents

- [Overview](#overview)
- [Phase 1: Code Cleanup](#phase-1-code-cleanup)
- [Comprehensive Testing Initiative](#comprehensive-testing-initiative)
- [Phase 2: Performance Optimization](#phase-2-performance-optimization)
- [Phase 3: Documentation Enhancement](#phase-3-documentation-enhancement)
- [Phase 4: Advanced Optimization](#phase-4-advanced-optimization)
- [Post-Refactoring Management TODOs](#post-refactoring-management-todos)
- [Timeline and Priorities](#timeline-and-priorities)
- [Success Metrics](#success-metrics)
- [Post-Refactoring Priorities](#post-refactoring-priorities)

## Overview

With the major architectural refactoring complete, OneiroMetrics now has a modular, maintainable codebase with clear separation of concerns. This roadmap details the next steps to further improve the plugin in terms of performance, user experience, and developer satisfaction.

The post-refactoring improvements are organized into four sequential phases, each building upon the previous one. These improvements aim to leverage the new architecture while addressing remaining technical debt and enhancing user experience.

## Phase 1: Code Cleanup

**Goal:** Ensure consistency and quality across the codebase following the major refactoring.

### Tasks:

1. **Naming Standardization**
   - Ensure consistent naming conventions across all modules
   - Rename any remaining ambiguous variables and functions
   - Update file names to better reflect their contents

2. **Code Style Consistency**
   - Apply consistent indentation and formatting
   - Standardize comment style and documentation
   - Run linting tools across the entire codebase

3. **Dead Code Elimination**
   - Remove commented-out code sections
   - Delete unused functions and variables
   - Clean up redundant imports

4. **Type Definition Refinement**
   - Strengthen type definitions
   - Eliminate any remaining `any` types
   - Add explicit return types to all functions

5. **TypeScript Error Resolution**
   - Fix approximately 150+ TypeScript errors across the codebase
   - Address interface definition inconsistencies (see [typescript-issues.md](./typescript-issues.md))
   - Resolve type compatibility issues with SelectionMode and LogLevel
   - Fix missing or incorrectly referenced properties in interfaces
   - Install missing dependencies
   - Address object property access issues
   - Follow step-by-step plan in [typescript-issues-next-steps.md](./typescript-issues-next-steps.md)

### Current Progress:

- ✅ Created documentation of TypeScript issues in `typescript-issues.md`
- ✅ Added `build:force` script to bypass TypeScript errors during development
- ✅ Added missing `ts-debounce` dependency
- ✅ Modified tsconfig.json to allow development to continue
- ✅ Updated the root-level types.ts file to ensure better compatibility
- ✅ Created detailed plan for addressing TypeScript issues in `typescript-issues-next-steps.md`
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
- ⬜ Systematically update main codebase files using the new utilities

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

**The criteria for merging the `refactoring/2025-typescript` branch back to the `main` branch has moved from a time-based approach to a test-completion-based approach.** The detailed merge criteria, including core test requirements and approval process, are documented in [Refactoring Merge Criteria](./refactoring-merge-criteria.md).

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

## Phase 2: Performance Optimization

**Goal:** Enhance the overall performance and responsiveness of the plugin.

### Tasks:

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

| Phase | Estimated Duration | Priority | Dependencies |
|-------|-------------------|----------|--------------|
| Code Cleanup | 2 weeks | High | None |
| Comprehensive Testing | 6 weeks | Critical | Code Cleanup |
| Performance Optimization | 4 weeks | High | Code Cleanup, Comprehensive Testing |
| Documentation Enhancement | 3 weeks | Medium | Code Cleanup, Comprehensive Testing |
| Advanced Optimization | 6 weeks | Medium | Performance Optimization |

**Key Milestones:**
- Code cleanup completion: +2 weeks
- Comprehensive testing completion: +8 weeks
- Performance optimization release: +12 weeks
- Documentation portal launch: +15 weeks
- Advanced features release: +21 weeks

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
   - TODO: Archive all refactoring-related documentation to the docs/archive/legacy directory
   - Move temporary guides like typescript-issues.md and typescript-issues-next-steps.md to the archive
   - Archive component migration guides and examples once all components are migrated
   - Keep only the documentation needed for ongoing development and maintenance
   - Follow the detailed steps in [Post-Refactoring Cleanup Checklist](./post-refactoring-cleanup-checklist.md)

2. **Code Cleanup**
   - Remove temporary adapter functions and compatibility layers 
   - Clean up any remaining migration utilities that are no longer needed
   - Consolidate helper functions that have overlapping functionality
   - Remove deprecated APIs after ensuring no components depend on them
   - Use the [cleanup checklist](./post-refactoring-cleanup-checklist.md) to track progress

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

---

*This roadmap is a living document and may be revised as development progresses and new priorities emerge.* 
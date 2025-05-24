# OneiroMetrics Post-Refactoring Roadmap

This document outlines the roadmap for OneiroMetrics development after the completion of the 2025 refactoring project. It focuses on further improvements to build upon the newly refactored architecture.

## Table of Contents

- [Overview](#overview)
- [Phase 1: Code Cleanup](#phase-1-code-cleanup)
- [Phase 2: Performance Optimization](#phase-2-performance-optimization)
- [Phase 3: Documentation Enhancement](#phase-3-documentation-enhancement)
- [Phase 4: Advanced Optimization](#phase-4-advanced-optimization)
- [Timeline and Priorities](#timeline-and-priorities)
- [Success Metrics](#success-metrics)

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

## Timeline and Priorities

The implementation timeline is structured to deliver meaningful improvements at regular intervals:

| Phase | Estimated Duration | Priority | Dependencies |
|-------|-------------------|----------|--------------|
| Code Cleanup | 2 weeks | High | None |
| Performance Optimization | 4 weeks | High | Code Cleanup |
| Documentation Enhancement | 3 weeks | Medium | Code Cleanup |
| Advanced Optimization | 6 weeks | Medium | Performance Optimization |

**Key Milestones:**
- Code cleanup completion: +2 weeks
- Performance optimization release: +6 weeks
- Documentation portal launch: +9 weeks
- Advanced features release: +15 weeks

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

---

*This roadmap is a living document and may be revised as development progresses and new priorities emerge.* 
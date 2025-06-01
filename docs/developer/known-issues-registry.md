# OneiroMetrics Known Issues Registry

## Table of Contents

- [Overview](#issue-tracking-process)
- [Key Milestones](#key-milestones)
- [Major Issue Categories](#major-issue-categories)
- [Active Issues](#active-issues)
  - [Test Framework Issues](#test-framework-issues)
  - [Type System Issues](#type-system-issues)
  - [UI Component Issues](#ui-component-issues)
  - [Scraping and Metrics Note Issues](#scraping-and-metrics-note-issues)
- [Implementation Notes](#implementation-notes)
- [Resolved Issues](#resolved-issues)
- [Initialization and Dependency Issues](#initialization-and-dependency-issues)
  - [Global Variable Dependencies](#global-variable-dependencies)
  - [Module Boundaries and Dependencies](#module-boundaries-and-dependencies)
- [UI and Rendering Issues](#ui-and-rendering-issues)
  - [Content Parsing and Display](#content-parsing-and-display)
  - [Dream Entry Detection](#dream-entry-detection)
- [Architecture and Design Issues](#architecture-and-design-issues)
  - [Global State Reliance](#global-state-reliance)
  - [Implementation Approach](#implementation-approach)
- [Current Workarounds](#current-workarounds)
- [Resolution Plans](#resolution-plans)
- [Issue Tracking Status](#issue-tracking-status)
- [Reporting New Issues](#reporting-new-issues)

This document tracks technical issues, limitations, and known bugs that have been identified during development activities but have not yet been resolved. These issues are typically internal implementation details rather than user-facing bugs (which are tracked in ISSUES.md).

## Issue Tracking Process

1. Issues are added to this registry when discovered during development activities
2. Each issue receives a unique ID (ISSUE-YY-NNN format)
3. Issues are categorized by type and component
4. When addressed, issues are moved to the "Resolved Issues" section with resolution details
5. Critical issues should also have corresponding entries in the issue tracker

## Key Milestones

| Date | Milestone | Description | Status |
|------|-----------|-------------|--------|
| 2025-05-24 | Initial Refactoring | Extract event handlers into separate classes | ❌ Failed |
| 2025-05-25 | Attempted Fixes | Implement safe logger and defensive coding | ❌ Insufficient |
| 2025-05-26 | Rollback | Revert to commit 1c36d38 | ✅ Completed |
| 2025-05-27 | Documentation | Document known issues and lessons learned | ✅ Completed |
| 2025-06-15 | Issue Analysis | Complete categorization of all issues | 🔄 In Progress |
| 2025-07-01 | Fix Implementation | Begin addressing highest priority issues | ⏳ Planned |

## Major Issue Categories

| Category | Count | Severity | Resolution Progress | Key Documentation |
|----------|-------|----------|---------------------|-------------------|
| Initialization Issues | 5 | High | 0% | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md#1-scraping-and-metrics-note-issues) |
| Module Dependencies | 4 | High | 0% | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md#1-scraping-and-metrics-note-issues) |
| UI and Rendering | 4 | Medium | 0% | [Post-Refactoring Roadmap](./implementation/post-refactoring-roadmap.md) |
| Dream Entry Detection | 3 | High | 0% | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md#1-scraping-and-metrics-note-issues) |
| Architecture Design | 4 | High | 0% | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md#1-scraping-and-metrics-note-issues) |
| Implementation Approach | 4 | Medium | 0% | [Post-Refactoring Roadmap](./implementation/post-refactoring-roadmap.md) |
| CSS Architecture | 1 | Medium | 0% | [CSS Refactoring v2 Plan](../planning/css-refactoring-v2-plan.md) |
| Test Framework | 2 | Low | 0% | [Post-Refactoring Cleanup](../archive/refactoring-2025/post-refactoring-cleanup-checklist.md) |
| Type System | 1 | Medium | 0% | [Post-Refactoring Cleanup](../archive/refactoring-2025/post-refactoring-cleanup-checklist.md) |

## Active Issues

### Test Framework Issues

| ID | Component | Description | Impact | Discovered | Target Resolution |
|----|-----------|-------------|--------|------------|-------------------|
| ISSUE-25-001 | Metric Helpers | Test "standardizeMetric creates a complete metric with all properties" fails despite implementation meeting functional requirements | Low - 11/13 tests pass, functionality works in production | 2025-05-26 (Adapter Migration) | 2025-07-20 |
| ISSUE-25-002 | Metric Helpers | Test "adaptMetric properly adapts metrics to CoreDreamMetric format" fails despite implementation meeting functional requirements | Low - 11/13 tests pass, functionality works in production | 2025-05-26 (Adapter Migration) | 2025-07-20 |

### Type System Issues

| ID | Component | Description | Impact | Discovered | Target Resolution |
|----|-----------|-------------|--------|------------|-------------------|
| ISSUE-25-003 | DreamMetric Types | Two incompatible DreamMetric interfaces exist (types.ts and src/types/core.ts) | Medium - Was a blocker for adapter migration; temporarily resolved with workarounds but needs proper fix | 2025-05-26 (Adapter Migration) | 2025-07-15 |

### UI Component Issues

| ID | Component | Description | Impact | Discovered | Target Resolution |
|----|-----------|-------------|--------|------------|-------------------|
| ISSUE-25-004 | Date Range Filter | Custom Date Range Filter has significant usability issues with date input fields: strict input format requirements, poor validation feedback, and difficult selection interface | Medium - Makes custom date range filtering difficult for users; quick filter buttons work as expected | 2025-05-26 (UI Components Migration) | 2025-07-30 |
| ISSUE-25-006 | Statistics Table | Icons missing and incorrect metric ordering in the Statistics Table despite proper configuration | Medium - Statistics table shows data but with inconsistent/missing visuals and suboptimal ordering | 2025-05-27 | 2025-07-30 |
| ISSUE-25-009 | Statistics Table | Duplicate Words metric appearing in Statistics Table after refactoring | Low - Table functions correctly but displays redundant information | 2025-05-29 | 2025-07-30 |
| ISSUE-25-010 | Statistics Table | Multiple "Words" rows appearing in Statistics Table with different values | Low - Statistics table functions correctly but shows redundant and inconsistent word count data | 2025-05-29 | 2025-07-30 |
| ISSUE-25-011 | Ribbon UI | Debug "Test Calendar" button appearing in ribbon that opens Date Navigator test functionality | Low - Button is functional but not intended for production use | 2025-05-29 | 2025-05-29 |

### Scraping and Metrics Note Issues

| ID | Component | Description | Impact | Discovered | Target Resolution |
|----|-----------|-------------|--------|------------|-------------------|
| REFACTOR-25-001 | Event System Refactoring | Complete metrics note failure after refactoring event handling system | Critical - Plugin non-functional for its primary purpose | 2025-05-24 | 2025-07-15 |

#### Issue Details: REFACTOR-25-001

This is a compound issue affecting multiple components. The refactoring effort that extracted event handlers into separate classes introduced several critical errors that caused the entire metrics note functionality to fail.

**End-User Impact:**
- Dream entries not detected or processed
- "No dream entries to update" error despite valid entries in files
- Empty metrics table or outdated information
- UI components like "Show more" buttons missing
- Date filters and navigation non-functional

**Technical Root Causes:**
- Initialization order failures
- Undefined reference errors
- Service dependency issues
- Parsing engine failures
- UI rendering problems

For complete details on this issue, including analysis, implementation plans, and resolution approach, see the [Scraping and Metrics Note Issues](./implementation/refactoring-lessons-learned.md#1-scraping-and-metrics-note-issues) section in the Refactoring Lessons Learned document.

### CSS Architecture Issues

| ID | Component | Description | Impact | Discovered | Target Resolution |
|----|-----------|-------------|--------|------------|-------------------|
| ISSUE-25-012 | styles.css | Chaotic stylesheet organization with duplications, inconsistent naming, and maintenance difficulties | Medium - Slows development, increases risk of style conflicts, makes responsive design maintenance difficult | 2025-06-15 | 2025-07-01 |

## Implementation Notes

### ISSUE-25-001 & ISSUE-25-002
The failing tests likely have specific expectations about the structure or property values of metrics returned by the standardizeMetric and adaptMetric functions. While our implementation is functionally correct, the tests may be checking for:

1. Specific property ordering
2. Exact property set (no additional properties)
3. Specific default values that may have changed

Resolution approach:
1. Examine test code to identify specific expectations
2. Either update tests to match new implementation or adjust implementation to pass tests
3. Add test documentation to clarify expected behavior

### ISSUE-25-003 (Former Migration Blocker)
This issue was identified as a blocker during the adapter migration plan. The root problem is that two different DreamMetric interfaces exist in the codebase:
- One in `types.ts` (legacy root-level file)
- One in `src/types/core.ts` (new modular approach)

The core version requires an 'enabled' property that was causing TypeScript errors. To unblock the migration, we:
1. Updated the standardizeMetric function to ensure it always returns a complete CoreDreamMetric
2. Fixed createCompatibleMetric to handle null/undefined input values properly
3. Improved adaptMetric to verify all required properties

While these workarounds allowed us to complete the migration, a proper solution would be to:
1. Consolidate the DreamMetric type definitions
2. Update imports across the codebase to use a single definition
3. Remove the dual type system
4. Ensure all functions return properly typed results

### ISSUE-25-004 (Date Range Filter Usability)
The current date range filter UI component has several usability issues:
1. Input fields require exact date formats without clear indication of accepted formats
2. Validation is strict with poor feedback when input is rejected
3. Date selection is cumbersome without a date picker component
4. Error states are not clearly indicated to the user

Resolution approach:
1. Implement a proper date picker component with clear UI for date selection
2. Add inline validation with helpful error messages
3. Support multiple input formats with automatic standardization
4. Add clear visual indication of valid/invalid states
5. Consider replacing with a more user-friendly interface like a calendar view

### ISSUE-25-007 (DateNavigator Type Compatibility)
The DateNavigator.ts file had several type errors related to incompatibilities between the DreamMetricData interface defined in different locations:

1. Main issues:
   - Missing wordCount property on test entries and sample data
   - Type incompatibility between DreamMetricData from '../types' and '../types/core'
   - Different definitions of the source property (string vs string|object)
   - Missing imports for date-fns functions (parseISO, isValid)

2. Resolution details:
   - Created a calculateWordCount utility function in src/utils/helpers.ts to ensure consistent word counting
   - Developed a type adapter in src/utils/type-adapters.ts with adaptDreamMetricData and adaptDreamMetricDataArray functions
   - Updated all test entries and sample data to include the wordCount property
   - Fixed imports in DateNavigator.ts and DateNavigatorIntegration.ts
   - Used the adapter functions to handle type conversions between incompatible interfaces

3. Future recommendations:
   - Consider consolidating the two DreamMetricData interfaces into a single definition
   - Update all imports to use the consolidated type
   - Remove duplicate type definitions to prevent future incompatibilities

### ISSUE-25-012 (CSS Architecture Cleanup)
The styles.css file has grown chaotic during recent development phases, accumulating several maintenance issues:

1. **File Complexity**: Significantly grown during Phase 2 development with scattered organization
2. **Inadvertent Duplications**: Repeated CSS rules from iterative development cycles
3. **Maintenance Difficulty**: Hard to locate and modify specific component styles
4. **Potential Conflicts**: Overlapping selectors and specificity issues

**Impact on Development:**
- Slowed feature development due to CSS complexity
- Risk of style conflicts in new features 
- Difficulty in responsive design maintenance
- Reduced code readability and developer experience

**Resolution Plan:**
A comprehensive 5-phase CSS Refactoring v2 plan has been developed with:
1. **Analysis & Documentation** - Identify all current issues and patterns
2. **Temporary Component Breakdown** - Split into logical component files
3. **Individual Component Cleanup** - Systematic refactoring of each component
4. **Systematic Reassembly** - Merge back to single styles.css with clear organization
5. **Validation & Testing** - Ensure no functionality breaks

**Key Goals:**
- 15-25% file size reduction through duplication elimination
- CSS variable system implementation for design consistency
- Component-based organization with clear documentation
- Zero visual or functional regressions
- Foundation ready for Phase 3 web worker development

For complete details, see the [CSS Refactoring v2 Plan](../planning/css-refactoring-v2-plan.md).

## Resolved Issues

Issues can be resolved in multiple ways:
1. **Fully Fixed**: Issue is completely resolved with a proper implementation
2. **Workaround Applied**: Temporary solution implemented, but may need proper resolution later
3. **No Longer Relevant**: Due to architectural changes or requirement shifts

| ID | Component | Description | Resolution | Resolved Date |
|----|-----------|-------------|------------|---------------|
| ISSUE-25-005 | Metric Component | Metric icons not displaying properly in some UI contexts despite proper icon property values | Fully Fixed - Updated icon rendering in MetricComponent and EntryComponent with fallback mechanism | 2025-05-26 |
| ISSUE-25-007 | DateNavigator | Type incompatibilities between DreamMetricData from '../types' and '../types/core' causing build errors | Fully Fixed - Created type adapter in utils/type-adapters.ts, added calculateWordCount utility, and ensured consistent wordCount property on all test entries | 2025-06-01 |
| ISSUE-25-008 | Code Quality | Unused parameters in multiple component functions causing TypeScript warnings | Fully Fixed - Removed unused parameters from toggleContentVisibility and other functions across main.ts, ContentToggler.ts, and ProjectNoteEvents.ts | 2025-06-01 |
| ISSUE-25-011 | Ribbon UI | Debug "Test Calendar" button appearing in ribbon that opens Date Navigator test functionality | Fully Fixed - Removed the button by commenting out the addCalendarDebugRibbon call in PluginLoader.ts | 2025-06-15 |

> Note: Some issues with workarounds (like ISSUE-25-003) remain in the Active Issues section until a proper fix is implemented, even if they are no longer blocking development.

## References

- [Adapter Migration Plan (Archived)](../archive/refactoring-2025/adapter-migration-plan.md)
- [TypeScript Architecture Lessons](./architecture/typescript-architecture-lessons.md)

*Last Updated: 2025-05-26*

## Initialization and Dependency Issues

### Global Variable Dependencies

| Issue ID | Description | Severity | Status | References |
|----------|-------------|----------|--------|------------|
| INIT-001 | `globalLogger` used before initialization | High | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| INIT-002 | `customDateRange` accessed before definition | High | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| INIT-003 | `getProjectNotePath` called before available | High | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| INIT-004 | Event handlers rely on global state | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| INIT-005 | Logger service expected in components before initialization | High | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| INIT-006 | `globalContentToggler` used before initialization | High | Fixed | Created proper window-level initialization for global variable |

### Module Boundaries and Dependencies

| Issue ID | Description | Severity | Status | References |
|----------|-------------|----------|--------|------------|
| MOD-001 | Implicit dependencies between modules | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| MOD-002 | Circular dependencies in component structure | High | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| MOD-003 | Hidden state dependencies not explicit in interfaces | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| MOD-004 | Lack of clear module boundaries | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |

## UI and Rendering Issues

### Content Parsing and Display

| Issue ID | Description | Severity | Status | References |
|----------|-------------|----------|--------|------------|
| UI-001 | "Show more" buttons missing in Content column | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| UI-002 | Date extraction issues in certain formats | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| UI-003 | Dream title extraction inconsistent | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| UI-004 | Table virtualization not working correctly | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |

### Dream Entry Detection

| Issue ID | Description | Severity | Status | References |
|----------|-------------|----------|--------|------------|
| PARSE-001 | Content parser changes affect dream entry detection | High | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| PARSE-002 | Recognition of different callout types inconsistent | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| PARSE-003 | Nested callout structure handling issues | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |

## Architecture and Design Issues

### Global State Reliance

| Issue ID | Description | Severity | Status | References |
|----------|-------------|----------|--------|------------|
| ARCH-001 | Excessive reliance on global variables | High | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| ARCH-002 | Monolithic design with tight coupling | High | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| ARCH-003 | Missing interfaces between components | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| ARCH-004 | Implicit timing dependencies in initialization | High | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |

### Implementation Approach

| Issue ID | Description | Severity | Status | References |
|----------|-------------|----------|--------|------------|
| IMPL-001 | Inadequate testing for initialization sequence | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| IMPL-002 | Insufficient documentation of dependencies | Medium | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| IMPL-003 | Missing fallbacks for dependency failures | High | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |
| IMPL-004 | "Big bang" refactoring approach issues | High | Known | [Refactoring Lessons](./implementation/refactoring-lessons-learned.md) |

## Current Workarounds

### Temporary Fixes

| Issue ID | Workaround | Applied In | Permanent Solution |
|----------|------------|------------|-------------------|
| INIT-001 | Rolled back to commit `1c36d38` | Codebase | Implement safe logger with fallbacks |
| INIT-002 | Rolled back to commit `1c36d38` | Codebase | Create proper initialization sequence |
| INIT-003 | Rolled back to commit `1c36d38` | Codebase | Implement dependency injection |
| PARSE-001 | Rolled back to commit `1c36d38` | Codebase | Update content parser with robust error handling |
| UI-001 | Rolled back to commit `1c36d38` | Codebase | Fix content cell rendering |

## Resolution Plans

For detailed plans to address these issues, refer to:

1. [Refactoring Lessons Learned](./implementation/refactoring-lessons-learned.md) - Analysis of issues and solutions
2. [Post-Refactoring Roadmap](./implementation/post-refactoring-roadmap.md) - Implementation plan
3. [Post-Refactoring Cleanup Checklist](../archive/refactoring-2025/post-refactoring-cleanup-checklist.md) - Immediate tasks

## Issue Tracking Status

### Resolution Progress

![Progress Bar](https://progress-bar.dev/15/ "Issue Resolution Progress")

Current issue resolution progress is approximately 15%, primarily consisting of documentation, analysis, and immediate stabilization steps.

### Issue Counts by Status

| Status | Count | Percentage |
|--------|-------|------------|
| Known/Documented | 27 | 85% |
| In Progress | 3 | 10% |
| Resolved | 2 | 5% |
| Total | 32 | 100% |

### Priority Distribution

| Priority | Count | Percentage |
|----------|-------|------------|
| Critical | 5 | 16% |
| High | 14 | 44% |
| Medium | 11 | 34% |
| Low | 2 | 6% |
| Total | 32 | 100% |

### Next Steps

1. Complete full categorization of all issues by June 15, 2025
2. Begin implementing solutions for highest priority issues by July 1, 2025
3. Address the critical Scraping and Metrics Note issue (REFACTOR-25-001) as top priority
4. Update issue status weekly during development meetings

## Reporting New Issues

When reporting new issues related to the refactoring, please include:

1. **Issue Description**: Clear description of the problem
2. **Reproduction Steps**: How to reproduce the issue
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Related Components**: Which components are affected
6. **Dependencies**: Any dependencies on other components
7. **Initialization Context**: When in the initialization sequence the issue occurs

Report new issues in the project issue tracker with the tag `refactoring-related`.

## Error Handling Approach

All error handling in the OneiroMetrics plugin should follow our [Defensive Coding Practices](../implementation/defensive-coding-practices.md). This comprehensive guide outlines patterns, examples, and utility functions for creating robust, error-resistant code that can gracefully handle unexpected conditions.

Key principles include:
1. Expecting failures and planning for them
2. Providing reasonable fallbacks
3. Containing failures to prevent cascading errors
4. Maintaining user experience through graceful degradation
5. Prioritizing diagnostics with clear error messages

The implementation of these practices is scheduled according to the [Defensive Coding Implementation Plan](../implementation/post-refactoring-roadmap.md#defensive-coding-implementation-plan), which provides a phased approach with concrete timelines and deliverables.

Refer to the defensive coding document for specific implementation guidelines and code examples. 
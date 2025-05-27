# OneiroMetrics Known Issues Registry

This document tracks technical issues, limitations, and known bugs that have been identified during development activities but have not yet been resolved. These issues are typically internal implementation details rather than user-facing bugs (which are tracked in ISSUES.md).

## Issue Tracking Process

1. Issues are added to this registry when discovered during development activities
2. Each issue receives a unique ID (ISSUE-YY-NNN format)
3. Issues are categorized by type and component
4. When addressed, issues are moved to the "Resolved Issues" section with resolution details
5. Critical issues should also have corresponding entries in the issue tracker

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

## Resolved Issues

Issues can be resolved in multiple ways:
1. **Fully Fixed**: Issue is completely resolved with a proper implementation
2. **Workaround Applied**: Temporary solution implemented, but may need proper resolution later
3. **No Longer Relevant**: Due to architectural changes or requirement shifts

| ID | Component | Description | Resolution | Resolved Date |
|----|-----------|-------------|------------|---------------|
| ISSUE-25-005 | Metric Component | Metric icons not displaying properly in some UI contexts despite proper icon property values | Fully Fixed - Updated icon rendering in MetricComponent and EntryComponent with fallback mechanism | 2025-05-26 |

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
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
| | | | | |

> Note: Some issues with workarounds (like ISSUE-25-003) remain in the Active Issues section until a proper fix is implemented, even if they are no longer blocking development.

## References

- [Adapter Migration Plan](./implementation/adapter-migration-plan.md)
- [TypeScript Architecture Lessons](./architecture/typescript-architecture-lessons.md)

*Last Updated: 2025-05-26* 
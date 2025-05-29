# Console.log Cleanup Status

## Overview

This document tracks the progress of replacing console.log statements with structured logging throughout the OneiroMetrics codebase. The goal is to use the structured logging system designed in accordance with the architecture requirements documented in `docs/developer/implementation/logging.md`.

## Current Status (2025-05-28)

| Category | Initial Count | Current Count | Remaining | Progress |
|----------|---------------|---------------|-----------|----------|
| console.log | 65 | 44 | 21 | 68% |
| console.warn | 8 | 4 | 4 | 50% |
| console.error | 37 | 31 | 6 | 84% |
| console.info | 2 | 2 | 0 | 100% |
| console.debug | 2 | 2 | 0 | 100% |
| **Total** | 114 | 83 | 31 | 73% |

## Recently Cleaned Files

| File | Initial Count | Current Count | Status |
|------|---------------|---------------|--------|
| src/testing/TestRunner.ts | 6 | 0 | ✅ Complete |
| src/testing/EdgeCaseTests.ts | 14 | 0 | ✅ Complete |
| src/testing/utils/TypeGuardsTests.ts | 6 | 0 | ✅ Complete |
| src/dom/DateNavigator.ts | 3 | 0 | ⚠️ Completed with linter errors |

## Remaining Files with Console Statements

| File | Count | Priority | Notes |
|------|-------|----------|-------|
| src/logging/adapters/ConsoleAdapter.ts | 7 | Low | Intentional part of logging system |
| src/logging/safe-logger.ts | 7 | Low | Intentional fallback mechanism |
| src/testing/JournalCheckTests.ts | 4 | Medium | Testing module |
| main.ts | 2 | Medium | Debug utility functions |
| src/journal_check/JournalCheckEngine.ts | 2 | Medium | Core functionality |

## Implementation Notes

When replacing console.log statements, follow these patterns:

1. **Import the logger**:
   ```typescript
   import { getLogger } from '../logging';
   ```

2. **Create a logger instance**:
   ```typescript
   const logger = getLogger('ComponentName');
   ```

3. **Replace console.log with appropriate level**:
   ```typescript
   // Before
   console.log(`Test '${test.name}' completed`);
   
   // After
   logger.debug('Category', `Test '${test.name}' completed`);
   ```

4. **Use consistent categories**:
   - 'Test' - For test-related logging
   - 'EdgeCase' - For edge case testing
   - 'UI' - For UI components
   - 'DOM' - For DOM manipulation
   - 'Parser' - For content parsing
   - 'Metrics' - For metrics operations
   - 'Settings' - For settings operations

5. **Include relevant context data**:
   ```typescript
   logger.debug('Category', 'Message', { contextData });
   ```

## Known Issues

### DateNavigator.ts Linter Errors

The DateNavigator.ts file has been updated to use the structured logging system, but there are linter errors:

1. Import path issues:
   - Cannot find module '../../types/core' or its corresponding type declarations
   
2. Date-fns function issues:
   - Cannot find name 'parseISO'
   - Cannot find name 'isValid'

These errors need to be resolved by:
1. Checking the correct import paths for the project structure
2. Ensuring date-fns functions are properly imported and available

## Next Steps

1. **Fix DateNavigator.ts Linter Errors** (High Priority)
   - Resolve import path issues
   - Ensure date-fns functions are properly imported

2. **Update JournalCheckTests.ts** (Medium Priority)
   - Replace 4 console statements with structured logging
   - Follow pattern established in other test files

3. **Update JournalCheckEngine.ts** (Medium Priority)
   - Replace 2 console statements with structured logging
   - Ensure proper error handling

4. **Document Intentional Exceptions** (Low Priority)
   - Add comments to ConsoleAdapter.ts and safe-logger.ts
   - Clearly mark these as intentional parts of the logging system

## Conclusion

The console.log cleanup has made significant progress, with all console statements in critical testing components now using the structured logging system. We've cleaned up 26 console statements across multiple files, with 31 remaining.

The most critical remaining step is resolving the linter errors in DateNavigator.ts to ensure the code builds successfully. Following that, we can continue with the remaining files that have fewer console statements.

Following the completion of this cleanup, we should update the logger configuration to properly filter log levels in production builds. 
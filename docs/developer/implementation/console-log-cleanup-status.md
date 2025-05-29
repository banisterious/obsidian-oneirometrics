# Console.log Cleanup Status

## Overview

This document tracks the progress of replacing console.log statements with structured logging throughout the OneiroMetrics codebase. The goal is to use the structured logging system designed in accordance with the architecture requirements documented in `docs/developer/implementation/logging.md`.

## Current Status (2025-05-28)

| Category | Initial Count | Current Count | Remaining | Progress |
|----------|---------------|---------------|-----------|----------|
| console.log | 65 | 38 | 27 | 58% |
| console.warn | 8 | 3 | 5 | 63% |
| console.error | 37 | 30 | 7 | 81% |
| console.info | 2 | 2 | 0 | 100% |
| console.debug | 2 | 2 | 0 | 100% |
| **Total** | 114 | 75 | 39 | 66% |

## Recently Cleaned Files

| File | Initial Count | Current Count | Status |
|------|---------------|---------------|--------|
| src/testing/TestRunner.ts | 6 | 0 | ✅ Complete |
| src/testing/EdgeCaseTests.ts | 14 | 0 | ✅ Complete |
| src/testing/utils/TypeGuardsTests.ts | 6 | 0 | ✅ Complete |
| src/dom/DateNavigator.ts | 3 | 0 | ⚠️ Completed with linter errors |
| src/journal_check/ui/EntryComponent.ts | 1 | 0 | ✅ Complete |
| src/journal_check/ui/TemplateWizard.ts | 5 | 0 | ✅ Complete |
| main.ts | 2 | 0 | ✅ Complete (using globalLogger) |

## Intentional Console Usage

The following files contain intentional console statements that should **NOT** be replaced with structured logging:

| File | Count | Reason |
|------|-------|--------|
| src/logging/adapters/ConsoleAdapter.ts | 7 | **INTENTIONAL**: This is the implementation of the console output adapter for the structured logging system. These console statements are the final destination for log messages. |
| src/logging/safe-logger.ts | 7 | **INTENTIONAL**: This is a fallback mechanism for when the structured logging system is not yet initialized or fails. It ensures logging works during startup and system failures. |
| src/journal_check/types.ts | 1 | **INTENTIONAL**: This is a deprecation warning that runs on import, before the logging system may be initialized. |

## Global Logger Pattern

The main.ts file uses a special pattern with a `globalLogger` variable that provides logging capabilities for global utility functions outside the plugin class. This is implemented as follows:

1. Initialize with safe logger at the top of the file:
   ```typescript
   let globalLogger: any = safeLogger;
   ```

2. During plugin initialization, replace with the structured logger:
   ```typescript
   // Inside onload()
   globalLogger = this.logger;
   ```

3. This pattern has been documented at the top of main.ts file to explain its purpose.

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
   - 'Template' - For template operations

5. **Include relevant context data**:
   ```typescript
   logger.debug('Category', 'Message', { contextData });
   ```

## Known Issues

### DateNavigator.ts Linter Errors

The DateNavigator.ts file has been updated to use the structured logging system, and we've fixed the missing date-fns imports (parseISO and isValid). However, there are still type-related linter errors regarding the DreamMetricData type and missing wordCount properties. These need more significant changes to resolve.

### main.ts DreamMetricData Type Error

There's a type error in main.ts related to the DreamMetricData interface, where test data entries are missing the required wordCount property. This would require modifying test data generation to include wordCount, but would be a more invasive change.

## Next Steps

1. **Fix DateNavigator.ts and main.ts Linter Errors** (Medium Priority)
   - Resolve type incompatibility issues between different DreamMetricData versions
   - Add wordCount to test entries

## Conclusion

The console.log cleanup has made significant progress, with 39 out of 114 console statements now using the structured logging system across multiple files. We've cleaned up test modules, the DateNavigator, UI components, and updated the main.ts file to use proper structured logging through the globalLogger pattern.

We've also properly documented the intentional console statements in the logging system components to ensure they aren't targeted for replacement in future cleanup efforts. 
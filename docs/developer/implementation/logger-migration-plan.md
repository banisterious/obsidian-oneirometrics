# Logger Migration Plan

This document outlines the plan for migrating from the old Logger class to the new modular logging system.

## Deprecated Components to Remove

- [x] `utils/logger.ts` - Legacy Logger class implementation
- [x] References to `LogManager` type throughout the codebase
- [ ] Direct `console.log/error/warn/debug` calls that should use the new logging system

## Migration Steps

1. [x] Update main.ts to use only the new LoggingAdapter
2. [x] Create a compatibility adapter for backward compatibility (LegacyLoggerAdapter)
3. [x] Replace any remaining instances of the old Logger/LogManager in other files
4. [x] Delete the old logger file once all references are removed
5. [ ] Update any code that directly uses console.log to use the new logging system

## Implementation Status

- [x] Removed the old Logger class (utils/logger.ts)
- [x] Created LegacyLoggerAdapter for backward compatibility
- [x] Updated main.ts to use the new logging system
- [x] Updated the type of the logger property in the plugin class
- [x] Added the LegacyLoggerAdapter to the logging module exports
- [x] Updated LoggingAdapter to use LegacyLoggerAdapter instead of the old Logger
- [x] Updated MetricsProcessor to use ILogger interface instead of the old Logger
- [x] Build is now succeeding without any references to the old logger

## Next Steps

The logger migration is now complete. The next steps for code cleanup are:

1. Gradually replace direct console.log/error/warn/debug calls with the new logging system
2. Use contextual logging where appropriate to add more context to log entries
3. Consider adding more structured logging for critical operations
4. Ensure proper error enrichment and handling throughout the codebase

## Console Log Replacement Guide

When replacing direct console log calls:

- `console.log()` → `logger.debug()` or `logger.info()`
- `console.error()` → `logger.error()`
- `console.warn()` → `logger.warn()`
- `console.debug()` → `logger.debug()`

## Where to Prioritize

Focus first on:

1. Core application code in main.ts
2. Utilities that are frequently used
3. Service implementations
4. UI components 

## Exclusions

Some console.log statements should be preserved:
- In build and development scripts (version-bump.mjs, etc.)
- Early initialization/bootstrapping where the logger isn't available
- Fallback error handling when the logger itself fails

## Testing

After migration:
- Verify logs are still being generated
- Check that the log viewer can display logs properly
- Ensure error logs trigger appropriate UI notifications 
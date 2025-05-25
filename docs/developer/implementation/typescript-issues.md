# TypeScript Issues - Phase 1 Code Cleanup

This document outlines the TypeScript issues identified during Phase 1 of the post-refactoring roadmap. These issues will need to be addressed systematically as part of the Code Cleanup phase.

## Current Status

As of May 23, 2025, there are approximately 150+ TypeScript errors in the codebase. While these errors don't prevent the plugin from functioning (thanks to the relaxed `tsconfig.json` settings), they should be resolved to ensure code quality and maintainability.

For the time being, we've added a `build:force` script in `package.json` that bypasses TypeScript type checking during the build process to allow development to continue while these issues are being addressed.

## Main Issues

### 1. Interface Definition Inconsistencies

The main issue is that there are multiple incompatible definitions for the same interfaces across different files:

- **DreamMetricsSettings**: The interfaces in `types.ts` and `src/types/core.ts` have different properties.
- **DreamMetric**: Missing properties like `enabled`, issues with `range` vs `minValue`/`maxValue`.
- **LogLevel**: Different property names ('errors' vs 'error') between `src/types/logging.ts` and `src/logging/LoggingInterfaces.ts`.

### 2. SelectionMode Type Conflicts

The `selectionMode` property type is inconsistent:
- In some places, it's defined as `'notes' | 'folder'`
- In other places, it's defined as `'manual' | 'automatic'`

This causes numerous type errors when checking equality or assignment.

### 3. Property Access Issues

Many errors stem from attempts to access properties that don't exist in the interface definitions:
- `selectedFolder` not defined in `DreamMetricsSettings`
- `projectNote` not defined in `DreamMetricsSettings`
- `backupEnabled` not defined in `DreamMetricsSettings`
- `enabled` not defined in `DreamMetric`

### 4. Logging Configuration Inconsistencies

Inconsistent naming between `maxLogSize` and `maxSize` across the codebase:
- Some modules use `maxLogSize` while others use `maxSize`
- Both properties exist in type definitions but aren't consistently used

### 5. Missing Dependencies

- The package `ts-debounce` was missing and has been installed
- There may be others like `TestRunner` in the testing directory

### 6. Object Property Access Errors

Particularly in code that handles nested objects like `entry.source.file` where the `source` property can be either a string or an object with `file` and `id` properties.

## Fixing Strategy

### Priority 1: Core Type Definitions

1. Update `src/types/core.ts` to include all properties being used in the codebase
2. Ensure LogLevel is consistent between `src/types/logging.ts` and `src/logging/LoggingInterfaces.ts`
3. Create backward compatibility types/interfaces for SelectionMode

### Priority 2: Property Access Issues

1. Update all component code to use the correct property names
2. Add type assertions or type guards where needed for optional properties

### Priority 3: Logging Configuration

1. Standardize on `maxSize` across the codebase
2. Update all configuration code to handle both properties for backward compatibility

### Priority 4: Source Object Handling

1. Add proper type guards for the `source` property in `DreamMetricData`
2. Update code that accesses properties of `source` to handle both string and object types

## Progress Tracking

- ✅ Added ts-debounce dependency
- ✅ Created backward compatibility for `maxSize`/`maxLogSize`
- ✅ Updated LogLevel type to use 'error' instead of 'errors'
- ✅ Created utility functions to handle source property type checking
- ✅ Created mapping functions for SelectionMode type compatibility
- ✅ Fixed calloutMetadata type in DreamMetricData to be properly recognized as an array
- ✅ Created settings helper utilities to safely access DreamMetricsSettings properties
- ✅ Made DreamMetricsSettings properties like backupEnabled and backupFolderPath required
- ✅ Added showTestRibbonButton property to DreamMetricsSettings for backward compatibility
- ✅ Created metric helper utilities to safely handle DreamMetric properties
- ✅ Improved documentation for deprecated properties
- ✅ Fixed callout-utils.ts to handle both array and single object calloutMetadata format
- ✅ Created enhanced selection mode helper functions in selection-mode-helpers.ts
- ✅ Added getters/setters for all problematic settings properties
- ✅ Created TestRunner stub implementation
- ✅ Created ContentParser stub implementation
- ✅ Created state-related stubs (ObservableState, MutableState, StateSelector, etc.)
- ✅ Created template-related stubs (interfaces.ts, types.ts)
- ✅ Ensured build:force script works to bypass TypeScript errors
- ⬜ Complete ContentParser stub to add all missing methods
- ⬜ Fix test function signatures (convert to async/Promise)
- ⬜ Systematically update the main codebase to use the new helper utilities

## Next Steps

Now that we have created the necessary stub implementations and utility files, we need to take a systematic approach to update all files that have TypeScript errors:

1. **Update Main Files**:
   - Focus on `main.ts` first - update it to use the helper functions from `settings-helpers.ts` for accessing settings properties
   - Update `settings.ts` to use both `settings-helpers.ts` and `metric-helpers.ts` for safely accessing properties

2. **Update DOM Component Files**:
   - Address issues in `src/dom/DreamMetricsDOM.ts` by using the type guards from `type-guards.ts` for safely accessing source properties

3. **Update Journal Check Files**:
   - Fix the selection mode issues in `src/journal_check/ui/DreamJournalManager.ts` using the `selection-mode-helpers.ts` functions

4. **Update Test Files**:
   - Convert test callbacks to use `async`/`await` and return `Promise<boolean>` 
   - Update test implementations to use the helper utility functions

5. **Final Cleanup**:
   - Address any remaining TypeScript errors
   - Test the plugin functionality to ensure all features work correctly

This systematic approach will allow us to track progress effectively and ensure we don't miss any areas that need updates.

## Build Process

To bypass TypeScript errors during development, use the following command:

```bash
npm run build:force
```

This will build the plugin without running the TypeScript compiler, allowing development to continue while these issues are gradually resolved.

You can also use the provided `build-force.cmd` batch file on Windows systems.

## Final Note

Resolving these TypeScript errors is essential for long-term maintainability of the codebase. However, it's also important to balance this work with delivering user-facing features. The approach taken is to allow development to continue with the `build:force` option while systematically addressing the TypeScript issues as part of the Code Cleanup phase.

## Related Documents

- See [Post-Refactoring Roadmap](./post-refactoring-roadmap.md) for the overall plan
- See [Type System Documentation](./type-system.md) for the desired state of the type system 
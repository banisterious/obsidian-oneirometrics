# TypeScript Issues - Next Steps

This document provides concrete steps for continuing the work on resolving TypeScript errors in the OneiroMetrics codebase. It follows the documentation in `typescript-issues.md` and provides specific file-by-file instructions.

## Current Issues (May 2025)

As of May 23, 2025, we've identified the following critical TypeScript errors that need immediate attention:

1. **DreamMetricsSettings Interface Incompatibility**:
   - Two different interfaces with the same name exist (`./types` vs `src/types/core`)
   - The core version is missing properties that the original has: 
     ```
     Type 'DreamMetricsSettings' is missing properties: projectNote, selectedFolder, showRibbonButtons, backupEnabled, backupFolderPath
     ```
   - This causes errors when passing settings to helper functions that expect the core version

2. **Constructor Parameter Mismatches**:
   - Multiple components expect different numbers of parameters than they're receiving:
     ```
     // Examples:
     Expected 1 arguments, but got 0. (DreamMetricsState)
     Expected 1 arguments, but got 3. (TemplaterIntegration)
     Expected 3-4 arguments, but got 2. (TemplateWizard)
     Expected 1 arguments, but got 2. (DateNavigatorView)
     Expected 3 arguments, but got 2. (DateNavigatorIntegration)
     ```

3. **Missing Helper Functions**:
   - References to non-existent functions like `getCompatibleSelectionMode`
   - Type errors with SelectionMode when passing string values

4. **Property Access Issues**:
   - Direct access to properties that don't exist on the type:
     ```
     Property 'expandedStates' does not exist on type 'DreamMetricsSettings'
     Property 'projectNote' does not exist on type 'DreamMetricsSettings'
     ```

## Progress Report (May 2025)

Several key fixes have been implemented to address TypeScript errors:

1. ✅ Created utilities for handling source property type checking (src/utils/type-guards.ts)
2. ✅ Created mapping functions for SelectionMode type compatibility in core.ts
3. ✅ Fixed callout metadata type system with dedicated types (src/types/callout-types.ts)
4. ✅ Updated LoggingAdapter to handle both maxSize and maxLogSize for backward compatibility
5. ✅ Added proper type exports in the types barrel file
6. ✅ Created settings-helpers.ts with utilities for safe settings access
7. ✅ Created metric-helpers.ts with utilities for handling legacy DreamMetric properties
8. ✅ Made DreamMetricsSettings interface more comprehensive with required properties
9. ✅ Added appropriate JSDoc comments to clarify deprecated properties
10. ✅ Created type-adapters.ts for safely handling compatibility between legacy and new types

### Remaining Issues (149 errors in 12 files):

1. **Property Access Errors**: The majority of errors are related to accessing properties that don't match the updated type definitions:
   - 51 errors in main.ts
   - 39 errors in settings.ts
   - 9 errors in DreamJournalManager.ts

2. **Type Mismatch Issues**:
   - SelectionMode type conflicts ('notes'|'folder' vs 'manual'|'automatic')
   - Source property access errors (string vs object with file property)
   - CalloutMetadata array type errors

3. **Missing Module Errors** (in testing directory):
   - 10 errors in StateManagementTests.ts
   - Other test files missing TestRunner module

### Updated Strategy

We need to take a two-pronged approach:

1. **Systematic Fixes**:
   - Go through each file with a large number of errors (main.ts, settings.ts) and update them to use our new helper utilities
   - Update code to use type guards when accessing properties that may have different shapes

2. **Update Imports and Dependencies**:
   - Create missing modules or update paths in the testing directory
   - Fix module imports in test files

### Next Steps (Prioritized)

1. **Fix Interface Incompatibility**:
   - Create a consistent DreamMetricsSettings interface by consolidating types from `./types` and `src/types/core`
   - Use adapter functions consistently throughout the codebase for accessing settings properties
   - Fix `expandedStates` property access by adding it to the core interface

2. **Update Constructor Parameters**:
   - Add explicit type definitions for each component constructor
   - Fix parameter mismatches in:
     - DreamMetricsState constructor
     - TemplaterIntegration constructor
     - TemplateWizard constructor
     - DateNavigatorView constructor
     - DateNavigatorIntegration constructor

3. **Add Missing Helper Functions**:
   - Implement `getCompatibleSelectionMode` in selection-mode-helpers.ts or document where it should be imported from
   - Add correct typing for selection mode parameters

4. **Update Component Class Implementations**:
   - Fix the main plugin file (main.ts) to use our helper utilities for settings access
   - Fix settings.ts to use the metric-helpers.ts utilities for DreamMetric properties
   - Update DreamJournalManager.ts to use correct property access

5. **Create or Fix Missing Components**:
   - Create or implement proper TestRunner module for testing directory
   - Fix remaining DOM component errors with type guards

### Approach Recommendation

Rather than trying to fix all 149 errors at once, we should focus on making the main plugin functional first:

1. Fix main.ts, settings.ts and core UI components
2. Make the testing directory changes as a separate task
3. Consider temporarily disabling the testing files if needed to get the core functionality working

## Immediate Next Steps

### 1. Fix DreamMetricsSettings Interface

Create an extended interface in `src/types/core.ts` that includes all properties:

```typescript
// In src/types/core.ts
export interface DreamMetricsSettings {
    // Common required properties
    projectNote: string;
    selectedNotes: string[];
    selectedFolder: string;
    selectionMode: SelectionMode;
    calloutName: string;
    metrics: Record<string, DreamMetric>;
    
    // UI Settings
    showRibbonButtons: boolean;
    
    // Backup settings
    backupEnabled: boolean;
    backupFolderPath: string;
    
    // Logging settings
    logging: LoggingConfig;
    
    // Additional properties
    expandedStates?: Record<string, boolean>;
    journalStructure?: JournalStructureSettings;
    linting?: LintingSettings;
    
    // Legacy properties (marked as deprecated)
    /** @deprecated Use projectNote instead */
    projectNotePath?: string;
    /** @deprecated Use showRibbonButtons instead */
    showTestRibbonButton?: boolean;
}
```

Then update `adaptSettingsToCore` function in `type-adapters.ts` to ensure all properties are included.

### 2. Fix Constructor Parameter Mismatches

For each constructor parameter mismatch, implement proper class definitions with correct parameter types.

Example for DreamMetricsState:

```typescript
// In src/state/DreamMetricsState.ts
export class DreamMetricsState {
    // Add any required properties
    
    constructor(initialState?: Partial<StateData>) {
        // Implement constructor with optional parameter
    }
    
    // Rest of class implementation
}
```

### 3. Fix Type Guards and Property Access

Systematically update property access throughout the codebase to use helper functions:

```typescript
// Instead of:
const projectNote = this.settings.projectNote;

// Use:
const projectNote = getProjectNotePath(this.settings);
```

```typescript
// Instead of:
if (metric.enabled) {

// Use:
if (isMetricEnabled(metric)) {
```

### 4. Add Missing Helper Functions

Implement the missing `getCompatibleSelectionMode` function:

```typescript
// In src/utils/selection-mode-helpers.ts
/**
 * Converts between different SelectionMode representations based on context
 * @param mode The selection mode to convert
 * @param format The format to convert to ('ui' or 'internal')
 * @returns The selection mode in the requested format
 */
export function getCompatibleSelectionMode(
    mode: string, 
    format: 'ui' | 'internal'
): string {
    if (format === 'ui') {
        if (mode === 'manual') return 'notes';
        if (mode === 'automatic') return 'folder';
        return mode;
    } else {
        if (mode === 'notes') return 'manual';
        if (mode === 'folder') return 'automatic';
        return mode;
    }
}
```

## Progress Tracking

We have created checkbox items to track progress on fixing these issues:

### Interface Fixes
- [x] Update DreamMetricsSettings in core.ts to include all properties
- [x] Fix type imports to consistently use the same DreamMetricsSettings interface
- [x] Add expandedStates property to core interface

### Constructor Parameter Fixes
- [x] Fix DreamMetricsState constructor
- [x] Fix TemplaterIntegration constructor
- [x] Fix TemplateWizard constructor
- [x] Fix DateNavigatorView constructor
- [x] Fix DateNavigatorIntegration constructor

### Helper Functions and Type Guards
- [x] Implement or fix getCompatibleSelectionMode
- [x] Add proper typing for selection mode parameters
- [ ] Update main.ts to use property access helper functions
- [ ] Update settings.ts to use property access helper functions

We'll continue to track progress against these items as we implement fixes. 
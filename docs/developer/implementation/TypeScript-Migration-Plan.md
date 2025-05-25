# TypeScript Migration Plan for OneiroMetrics (OOM)

## Overview of Issues
Based on our analysis, the 134+ TypeScript errors can be grouped into several major categories:

1. **Settings Interface Inconsistencies** - Properties defined in newer `src/types/core.ts` not recognized in code using the older `src/types.ts`.
2. **Source Property Type Mismatch** - The `source` property has evolved from string to object.
3. **SelectionMode Type Conflicts** - Incompatible enums (`'notes'|'folder'` vs `'manual'|'automatic'`).
4. **Property Access Issues** - Missing properties in interfaces (e.g., `projectNote`, `selectedFolder`).
5. **Helper Function Import Issues** - Created helpers not being properly imported.
6. **Testing Framework Issues** - Incorrect function signatures and parameter counts.

## Phase 1: Create Compatibility Layer

**Goal**: Ensure the helper functions work correctly and are available throughout the codebase.

1. Add a barrel file for helpers:
   - Create `src/utils/index.ts` to re-export all helper functions
   - Use a more robust import mechanism

2. Fix `main.ts` import issues:
   - Add helper imports at the top of the file
   - Replace direct property access with helper functions

```typescript
// At the top of main.ts
import { 
  getProjectNotePath, 
  setProjectNotePath,
  getSelectedFolder, 
  setSelectedFolder,
  getSelectionMode,
  setSelectionMode,
  isBackupEnabled,
  getBackupFolderPath,
  getLogMaxSize
} from './src/utils';
```

## Phase 2: Fix Core Interface Issues

**Goal**: Resolve the fundamental type inconsistencies.

1. Update the `DreamMetric` interface:
   - Ensure `enabled` property is defined in both interfaces
   - Add type-guard for legacy properties

2. Fix `DreamMetricData` source property issues:
   - Create source property helpers to handle both string and object formats
   - Add type-guards for source object

```typescript
// Add to type-guards.ts
export function getSourceFile(entry: DreamMetricData): string {
  if (typeof entry.source === 'string') {
    return entry.source;
  }
  return entry.source?.file || '';
}

export function getSourceId(entry: DreamMetricData): string {
  if (typeof entry.source === 'string') {
    return '';
  }
  return entry.source?.id || '';
}

export function isObjectSource(entry: DreamMetricData): boolean {
  return typeof entry.source !== 'string';
}
```

3. Create proper `SelectionMode` type compatibility:
   - Ensure selection mode helpers work for both string formats
   - Fix comparison operations

## Phase 3: Address Backup & Project Note Issues

**Goal**: Fix all property access issues related to backup and project notes.

1. Fix all `projectNote` property access issues:
   - Replace all direct accesses with `getProjectNotePath` helper

```typescript
// Replace
this.settings.projectNote

// With
getProjectNotePath(this.settings)
```

2. Fix backup-related properties:
   - Replace direct `backupEnabled` access with `isBackupEnabled` helper
   - Replace direct `backupFolderPath` access with `getBackupFolderPath` helper

```typescript
// Replace
if (!this.settings.backupEnabled) {

// With
if (!isBackupEnabled(this.settings)) {
```

## Phase 4: Fix UI Component Issues

**Goal**: Ensure DOM components work correctly with the correct types.

1. Fix the `DreamMetricsDOM.ts` file:
   - Ensure source property is handled correctly
   - Fix callout metadata type issues

2. Fix enabled property access in metrics:
   - Add necessary type guards for metric properties

```typescript
// Add to type-guards.ts
export function isMetricEnabled(metric: DreamMetric): boolean {
  return 'enabled' in metric ? metric.enabled : true;
}

// Then replace
if (metric.enabled) {

// With
if (isMetricEnabled(metric)) {
```

## Phase 5: Fix Test Framework Issues

**Goal**: Address test function signature mismatches.

1. Update ContentParser test files:
   - Fix parameter counts in extractDreamEntries calls
   - Update function signatures to use Promise where needed

2. Fix StateManagement tests:
   - Update argument types to match expected interfaces

## Implementation Strategy

For each phase, we'll:
1. Make the necessary changes
2. Run TypeScript compiler to check progress
3. Fix any new issues that arise
4. Document what was fixed and what remains

This approach will gradually reduce the error count while ensuring critical functionality continues to work.

## Code Examples for Implementation

### Phase 1 Implementation

**Fixing the imports in main.ts**:
```typescript
// Remove or comment out this line
// import { getSelectionMode } from './src/utils/settings-helpers';

// Add proper import at the top of the file
import { 
  getProjectNotePath, 
  getSelectedFolder, 
  setSelectedFolder,
  getSelectionMode,
  setSelectionMode,
  isBackupEnabled,
  getBackupFolderPath,
  getLogMaxSize
} from './src/utils';
```

### Phase 2 Implementation

**Updating the type-guards.ts file**:
```typescript
import { DreamMetricData, DreamMetric } from '../types/core';
import { CalloutMetadata } from '../types/callout-types';

/**
 * Type guards and helper functions for safe property access
 */

/**
 * Safely gets the file path from a DreamMetricData entry's source property
 */
export function getSourceFile(entry: DreamMetricData): string {
  if (typeof entry.source === 'string') {
    return entry.source;
  }
  return entry.source?.file || '';
}

/**
 * Safely gets the ID from a DreamMetricData entry's source property
 */
export function getSourceId(entry: DreamMetricData): string {
  if (typeof entry.source === 'string') {
    return '';
  }
  return entry.source?.id || '';
}

/**
 * Checks if the entry's source is an object (rather than a string)
 */
export function isObjectSource(entry: DreamMetricData): boolean {
  return typeof entry.source !== 'string';
}

/**
 * Safely checks if a metric is enabled
 */
export function isMetricEnabled(metric: DreamMetric): boolean {
  return 'enabled' in metric ? metric.enabled : true;
}
```

### Phase 3 Implementation

**Example fixes for project note in main.ts:**
```typescript
// Replace this
const file = this.app.vault.getAbstractFileByPath(this.settings.projectNote);

// With this
const projPath = getProjectNotePath(this.settings);
const file = this.app.vault.getAbstractFileByPath(projPath);
```

```typescript
// Replace this
if (file.path === this.settings.projectNote) {

// With this
const projPath = getProjectNotePath(this.settings);
if (file.path === projPath) {
```

### Phase 4 Implementation

**Fix for the enabled property in main.ts:**
```typescript
// Replace
for (const metric of Object.values(this.settings.metrics)) {
  if (metric.enabled) {
    // ...
  }
}

// With
import { isMetricEnabled } from './src/utils';

for (const metric of Object.values(this.settings.metrics)) {
  if (isMetricEnabled(metric)) {
    // ...
  }
}
``` 
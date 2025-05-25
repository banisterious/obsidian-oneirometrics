# DreamMetrics TypeScript Interface Standardization Plan

This document outlines the steps needed to standardize the DreamMetricsSettings interface and fix our TypeScript errors.

## Current Problem

We currently have two versions of `DreamMetricsSettings` interface in different locations:
1. `./types.ts` - The original interface used throughout most of the codebase
2. `src/types/core.ts` - The newer, more structured interface used by helpers and adapters

This causes TypeScript errors when functions expect one version but receive another. Helper functions expect the core version, while most of the codebase passes the original version.

## Proposed Solution

We will take a staged approach to solving this issue:

### 1. Create a Unified Interface

**Location**: `src/types/core.ts`

```typescript
// Current core interface:
export interface DreamMetricsSettings {
    projectNote: string;
    selectedNotes: string[];
    selectedFolder: string;
    selectionMode: SelectionMode;
    calloutName: string;
    metrics: Record<string, DreamMetric>;
    showRibbonButtons: boolean;
    backupEnabled: boolean;
    backupFolderPath: string;
    logging: LoggingConfig;
    // Missing properties that need to be added:
    expandedStates?: Record<string, boolean>;
    uiState?: UIState;
    journalStructure?: JournalStructureSettings;
    linting?: LintingSettings;
    developerMode?: DeveloperModeSettings;
    
    // Legacy properties (keep for compatibility)
    projectNotePath?: string;
    showTestRibbonButton?: boolean;
}
```

### 2. Update Root Interface to Extend Core

**Location**: `./types.ts`

```typescript
// Update the root interface to extend the core interface
import { DreamMetricsSettings as CoreDreamMetricsSettings } from './src/types/core';

// Extend the core interface with any additional properties needed
export interface DreamMetricsSettings extends CoreDreamMetricsSettings {
    // Any additional properties specific to the root interface
}
```

### 3. Update Helper Functions

Ensure all helper functions accept either interface version:

```typescript
// In settings-helpers.ts
import { DreamMetricsSettings } from '../types/core';

export function getProjectNotePath(settings: any): string {
    // Accept any type, but cast internally
    const typedSettings = settings as Partial<DreamMetricsSettings>;
    return typedSettings.projectNote || typedSettings.projectNotePath || '';
}
```

### 4. Create a Strong Adapter Function

```typescript
// In type-adapters.ts
import { DreamMetricsSettings as CoreDreamMetricsSettings } from '../types/core';

export function adaptToCoreDreamMetricsSettings(settings: any): CoreDreamMetricsSettings {
    // Complete standardization function to ensure all properties exist
    // with correct types and default values
    return {
        projectNote: settings.projectNote || settings.projectNotePath || '',
        selectedNotes: settings.selectedNotes || [],
        selectedFolder: settings.selectedFolder || '',
        selectionMode: settings.selectionMode || 'notes',
        calloutName: settings.calloutName || 'dream',
        metrics: settings.metrics || {},
        showRibbonButtons: settings.showRibbonButtons || !!settings.showTestRibbonButton || false,
        backupEnabled: settings.backupEnabled || false,
        backupFolderPath: settings.backupFolderPath || './backups',
        logging: {
            level: settings.logging?.level || 'info',
            maxSize: settings.logging?.maxSize || settings.logging?.maxLogSize || 1024 * 1024,
            maxBackups: settings.logging?.maxBackups || 3
        },
        // Add optional properties if they exist
        expandedStates: settings.expandedStates || {},
        uiState: settings.uiState || {},
        journalStructure: settings.journalStructure || settings.linting || {},
        linting: settings.linting || {},
        developerMode: settings.developerMode || { enabled: false }
    };
}
```

### 5. Update Plugin To Use Adapter

```typescript
// In main.ts
async loadSettings() {
    const data = await this.loadData();
    // Use the strong adapter to ensure correct type conversion
    this.settings = adaptToCoreDreamMetricsSettings(data || {});
    
    // Rest of method
}
```

## Implementation Steps

1. **Update Core Interface** (src/types/core.ts)
   - Add all missing properties from the root interface
   - Document each property with JSDoc comments
   - Mark legacy properties as deprecated

2. **Update Root Interface** (./types.ts)
   - Make it extend the core interface
   - Remove duplicate property definitions
   - Keep any necessary specific extensions

3. **Create Strong Adapter** (src/utils/type-adapters.ts)
   - Implement the `adaptToCoreDreamMetricsSettings` function
   - Ensure it handles all properties with proper defaults
   - Add comprehensive error handling

4. **Update Settings Loading**
   - Modify the plugin's `loadSettings` method to use the strong adapter
   - Add error handling for invalid settings data

5. **Fix Helper Functions**
   - Update all helper functions to handle both interface versions
   - Use type guards for safer property access
   - Add consistent error handling

6. **Update Documentation**
   - Document the interface standardization approach
   - Update any code examples to use the new pattern
   - Add clear guidance on which interface to use for new code

## Implementation Timeline

- **Day 1**: Update interfaces and create strong adapter
- **Day 2**: Update plugin code and fix major TypeScript errors
- **Day 3**: Update helper functions and fix remaining errors
- **Day 4**: Test changes and verify error reduction
- **Day 5**: Update documentation and submit final PR

## Success Criteria

1. TypeScript compiles with significantly fewer errors (~10 or less)
2. All helper functions accept both interface versions
3. Plugin uses the standardized interface throughout
4. Documentation clearly explains the interface approach

## Potential Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking changes to interface | Medium | High | Add thorough tests for all changed components |
| Helper functions not handling both versions | Medium | Medium | Update helpers gradually and test each one |
| Confusion about which interface to use | High | Medium | Clear documentation and code examples |
| Performance impact from type adaptation | Low | Low | Profile and optimize adapter functions if needed |

The standardization of our interfaces will help us resolve the TypeScript errors and provide a more maintainable codebase going forward. 
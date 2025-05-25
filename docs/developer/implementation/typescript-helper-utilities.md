# TypeScript Helper Utilities Guide

## Overview

This document provides a comprehensive guide to the helper utility functions in the OneiroMetrics codebase. These utilities ensure type safety, backward compatibility, and consistent behavior when accessing or modifying properties throughout the application.

## Table of Contents

- [Core Utility Libraries](#core-utility-libraries)
- [Settings Helpers](#settings-helpers)
- [Metric Helpers](#metric-helpers)
- [Selection Mode Helpers](#selection-mode-helpers)
- [Usage Patterns](#usage-patterns)
- [Best Practices](#best-practices)
- [Extending the Utilities](#extending-the-utilities)

## Core Utility Libraries

OneiroMetrics uses three main helper utility libraries:

1. **settings-helpers.ts**: Safe access to configuration settings with backward compatibility
2. **metric-helpers.ts**: Type-safe handling of metric objects and their properties
3. **selection-mode-helpers.ts**: Compatibility layer for selection mode values

These utilities work together to create a robust interface between application code and data structures, handling changes in data models while maintaining a consistent API.

## Settings Helpers

The `settings-helpers.ts` module provides functions for safely accessing and modifying settings properties, with built-in backward compatibility.

### Key Functions

```typescript
// Get the project note path, handling both new and legacy property names
getProjectNotePath(settings: DreamMetricsSettings): string

// Set the project note path, updating both new and legacy properties
setProjectNotePath(settings: DreamMetricsSettings, path: string): void

// Get the selection mode, normalizing different formats
getSelectionMode(settings: DreamMetricsSettings): 'notes' | 'folder'

// Set the selection mode, ensuring compatibility
setSelectionMode(settings: DreamMetricsSettings, mode: 'notes' | 'folder'): void

// Get whether ribbon buttons should be shown
shouldShowRibbonButtons(settings: DreamMetricsSettings): boolean
```

### Usage Example

```typescript
// Import the helpers
import { 
  getProjectNotePath, 
  getSelectionMode, 
  shouldShowRibbonButtons 
} from './src/utils/settings-helpers';

// Use helpers to safely access properties
function setupUI(settings: DreamMetricsSettings) {
  // Access properties safely
  const projectPath = getProjectNotePath(settings);
  const selectionMode = getSelectionMode(settings);
  const showButtons = shouldShowRibbonButtons(settings);

  // Use the properties...
  if (selectionMode === 'folder') {
    // Handle folder mode
  } else {
    // Handle notes mode
  }
}
```

## Metric Helpers

The `metric-helpers.ts` module provides utilities for safely working with metric objects, handling multiple formats and ensuring backward compatibility.

### Key Functions

```typescript
// Check if a metric is enabled
isMetricEnabled(metric: DreamMetric | any, defaultValue?: boolean): boolean

// Get the minimum value of a metric
getMetricMinValue(metric: DreamMetric | any): number

// Get the maximum value of a metric
getMetricMaxValue(metric: DreamMetric | any): number

// Get a standardized metric object
standardizeMetric(metric: Partial<DreamMetric>): DreamMetric

// Create a metric compatible with the core interface
createCompatibleMetric(metric: any): CoreDreamMetric

// Get formatted value of a metric
getFormattedMetricValue(metric: DreamMetric | any, value: number | string): string

// Get aggregated value from multiple metric values
getAggregatedMetricValue(metric: DreamMetric | any, values: (number | string)[]): number
```

### Usage Example

```typescript
// Import the helpers
import { 
  isMetricEnabled, 
  getMetricMinValue, 
  getMetricMaxValue, 
  getFormattedMetricValue 
} from './src/utils/metric-helpers';

// Render a metric safely
function renderMetric(metric: any, value: number) {
  // Only render if the metric is enabled
  if (!isMetricEnabled(metric)) {
    return null;
  }

  // Get safe min/max values
  const min = getMetricMinValue(metric);
  const max = getMetricMaxValue(metric);
  
  // Format the value
  const formattedValue = getFormattedMetricValue(metric, value);
  
  // Render the metric...
  return `${metric.name}: ${formattedValue} (${min}-${max})`;
}
```

## Selection Mode Helpers

The `selection-mode-helpers.ts` module provides utilities for handling selection modes, which have two equivalent representations in the codebase.

### Key Functions

```typescript
// Check if a selection mode is folder-based
isFolderMode(mode: SelectionMode): boolean

// Check if a selection mode is notes-based
isNotesMode(mode: SelectionMode): boolean

// Compare two selection modes for equivalence
areSelectionModesEquivalent(mode1: SelectionMode, mode2: SelectionMode): boolean

// Convert between UI and internal representations
getCompatibleSelectionMode(mode: string, format: 'ui' | 'internal'): string

// Get a user-friendly label for a selection mode
getSelectionModeLabel(mode: SelectionMode): string
```

### Usage Example

```typescript
// Import the helpers
import { 
  isFolderMode, 
  getSelectionModeLabel, 
  getCompatibleSelectionMode 
} from './src/utils/selection-mode-helpers';

// Safely work with selection modes
function updateSelectionUI(mode: SelectionMode) {
  // Check the mode type
  if (isFolderMode(mode)) {
    // Handle folder mode UI
    showFolderSelector();
  } else {
    // Handle notes mode UI
    showNotesList();
  }
  
  // Get a friendly label
  const modeLabel = getSelectionModeLabel(mode);
  updateModeDisplay(modeLabel);
  
  // Ensure compatible format for API calls
  const apiMode = getCompatibleSelectionMode(mode, 'internal');
  saveSettings({ selectionMode: apiMode });
}
```

## Usage Patterns

### Accessing Properties Safely

When accessing properties that might have different names or formats in different versions:

```typescript
// AVOID direct property access:
const projectPath = settings.projectNote || settings.projectNotePath || '';

// PREFER helper function:
const projectPath = getProjectNotePath(settings);
```

### Checking Types Safely

When checking object types or states:

```typescript
// AVOID complex conditional checks:
if (metric && 
   (metric.enabled === true || 
    (metric.enabled === undefined && !metric.disabled))) {
  // ...
}

// PREFER helper function:
if (isMetricEnabled(metric)) {
  // ...
}
```

### Setting Values Consistently

When updating objects:

```typescript
// AVOID manually handling backward compatibility:
settings.projectNote = path;
if (settings.projectNotePath !== undefined) {
  settings.projectNotePath = path;
}

// PREFER helper function:
setProjectNotePath(settings, path);
```

## Best Practices

### 1. Always Use Helpers for Property Access

When accessing potentially variable properties, always use helper functions rather than direct property access. This ensures that your code will continue to work even if the property names or structures change.

### 2. Use Type Guards for Conditional Logic

Use the helper functions as type guards in conditional statements rather than crafting complex conditions. This improves readability and ensures consistent behavior.

### 3. Use Normalization Functions

When working with values that might have different formats, use normalization functions to ensure consistent handling.

### 4. Preserve Backward Compatibility

When adding new helper functions, ensure they handle both current and legacy formats, allowing for gradual migration.

### 5. Document Helper Functions

Add clear JSDoc comments to helper functions explaining what they do and any side effects they might have.

## Extending the Utilities

### Adding New Helper Functions

When adding new helper functions:

1. Place them in the appropriate module based on the property they handle
2. Ensure they handle both current and legacy formats
3. Add comprehensive JSDoc comments
4. Consider both getter and setter functions for symmetry

### Example: Adding a New Settings Helper

```typescript
/**
 * Gets the custom theme setting
 * @param settings The settings object
 * @returns The custom theme name or undefined
 */
export function getCustomTheme(settings: DreamMetricsSettings): string | undefined {
  // Handle both current and legacy property names
  return settings.customTheme || settings.theme;
}

/**
 * Sets the custom theme
 * @param settings The settings object
 * @param theme The theme name
 */
export function setCustomTheme(settings: DreamMetricsSettings, theme: string): void {
  // Update both current and legacy properties
  settings.customTheme = theme;
  settings.theme = theme; // For backward compatibility
}
```

By consistently using these helper utilities throughout the codebase, we ensure robust, maintainable code that can adapt to changing data structures while maintaining backward compatibility. 
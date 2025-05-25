# TypeScript Interface Standards Guide

This document outlines the standard patterns for interface design in the OneiroMetrics codebase. Following these standards ensures consistency across the codebase and minimizes compatibility issues.

## Table of Contents

- [Core Principles](#core-principles)
- [Interface Organization](#interface-organization)
- [Naming Conventions](#naming-conventions)
- [Property Patterns](#property-patterns)
- [Interface Extension](#interface-extension)
- [Type Guards](#type-guards)
- [Deprecated Properties](#deprecated-properties)
- [Documentation Standards](#documentation-standards)
- [Best Practices](#best-practices)

## Core Principles

1. **Explicit Over Implicit**: Explicitly declare types rather than relying on inference
2. **Consistency**: Use consistent naming and structure across similar interfaces
3. **Documentation**: Document the purpose and usage of each interface
4. **Compatibility**: Design with backward compatibility in mind
5. **Single Responsibility**: Each interface should have a clear, single purpose

## Interface Organization

### Type Hierarchy

Organize types in a clear hierarchy:

1. **Core Types**: Fundamental types used throughout the application
   - Located in `src/types/core.ts`
   - Example: `DreamMetricData`, `CoreDreamMetricsSettings`

2. **Domain-Specific Types**: Types specific to a particular domain
   - Located in domain-specific files (e.g., `src/types/metrics.ts`)
   - Example: `MetricDisplayOptions`, `JournalParsingOptions`

3. **Component Types**: Types specific to UI components
   - Located with their components or in `src/types/components.ts`
   - Example: `MetricsPanelProps`, `DreamTableOptions`

4. **Utility Types**: Helper types and type utilities
   - Located in `src/types/utilities.ts`
   - Example: `DeepPartial<T>`, `Nullable<T>`

### File Structure

```
src/
  types/
    core.ts           # Core application types
    declarations.ts   # Global type declarations
    metrics.ts        # Metrics-specific types
    journal.ts        # Journal-specific types
    components.ts     # UI component types
    utilities.ts      # Utility types
    index.ts          # Re-exports all types
```

## Naming Conventions

### Interface Names

- Use PascalCase for interface names
- Be descriptive and specific
- Avoid generic names (e.g., `Data`, `Options`)
- Use consistent prefixes for related interfaces
- Suffix interface with descriptive type (e.g., `Props`, `State`, `Config`)

**Good Examples**:
```typescript
interface DreamMetricsSettings { ... }
interface MetricDisplayOptions { ... }
interface JournalEntryData { ... }
```

**Poor Examples**:
```typescript
interface data { ... }  // Lowercase, too generic
interface DMSettings { ... }  // Abbreviation not clear
interface MetricStuff { ... }  // Too vague
```

### Property Names

- Use camelCase for property names
- Be descriptive and consistent
- Group related properties logically
- Avoid abbreviations unless widely understood

**Good Examples**:
```typescript
interface DreamMetric {
  name: string;
  icon: string;
  description: string;
  minValue: number;
  maxValue: number;
  enabled: boolean;
}
```

**Poor Examples**:
```typescript
interface DreamMetric {
  n: string;  // Too abbreviated
  i: string;  // Too abbreviated
  desc: string;  // Inconsistent abbreviation
  min_val: number;  // Snake case, inconsistent
  mVal: number;  // Inconsistent naming pattern
  isEnabled: boolean;  // Inconsistent with other boolean properties
}
```

## Property Patterns

### Required vs. Optional Properties

- Make properties required by default
- Only mark properties as optional when truly optional
- Consider using default values instead of optional properties

**Example**:
```typescript
// Prefer this:
interface MetricConfig {
  name: string;
  range: { min: number; max: number };
}

// Over this:
interface MetricConfig {
  name?: string;
  range?: { min?: number; max?: number };
}
```

### Property Types

- Use specific types rather than `any`
- Use union types for properties that can have multiple types
- Use consistent types for similar properties across interfaces
- Use enums for properties with a fixed set of values

**Example**:
```typescript
// Prefer this:
type LogLevel = 'debug' | 'info' | 'warning' | 'error';

interface LoggingConfig {
  level: LogLevel;
  maxSize: number;
}

// Over this:
interface LoggingConfig {
  level: any;  // Too permissive
  maxSize: number;
}
```

## Interface Extension

### When to Extend

- Extend interfaces when creating a more specific version of a base interface
- Extend interfaces when adding properties to an existing interface
- Do not extend unrelated interfaces just to reuse properties

### Extension Pattern

```typescript
// Base interface
interface CoreMetric {
  name: string;
  value: number;
}

// Extended interface
interface DetailedMetric extends CoreMetric {
  description: string;
  category: string;
}
```

### Multiple Extensions

When an interface needs to combine multiple existing interfaces:

```typescript
interface DisplayOptions {
  visible: boolean;
  style: CSSProperties;
}

interface InteractionOptions {
  onClick: () => void;
  onHover: () => void;
}

// Combining multiple interfaces
interface MetricComponentProps extends DisplayOptions, InteractionOptions {
  metric: CoreMetric;
}
```

## Type Guards

### Consistent Type Guard Pattern

Use consistent patterns for type guards:

```typescript
// Type guard for CoreMetric
function isCoreMetic(obj: any): obj is CoreMetric {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    typeof obj.value === 'number'
  );
}
```

### Type Guard Documentation

Document the purpose and expected usage of type guards:

```typescript
/**
 * Checks if an object is a valid CoreMetric
 * @param obj The object to check
 * @returns True if the object is a valid CoreMetric
 */
function isCoreMetic(obj: any): obj is CoreMetric {
  // implementation
}
```

## Deprecated Properties

### Marking Deprecated Properties

Use JSDoc to mark deprecated properties:

```typescript
interface DreamMetricsSettings {
  /** Current project note path */
  projectNote: string;
  
  /** 
   * @deprecated Use projectNote instead
   * Legacy project note path property
   */
  projectNotePath: string;
}
```

### Handling Deprecated Properties

Create helper functions to handle deprecated properties:

```typescript
/**
 * Gets the project note path from settings
 * @param settings The settings object
 * @returns The project note path
 */
function getProjectNotePath(settings: any): string {
  return settings.projectNote || settings.projectNotePath || '';
}
```

## Documentation Standards

### Interface Documentation

Document each interface with a clear description:

```typescript
/**
 * Configuration for dream metrics display
 * Defines how metrics are shown in the UI
 */
interface MetricDisplayConfig {
  /** Show metric icons */
  showIcons: boolean;
  
  /** Show metric descriptions */
  showDescriptions: boolean;
  
  /** Sort metrics by this property */
  sortBy: 'name' | 'value' | 'category';
}
```

### Property Documentation

Document each property with a clear description:

```typescript
interface LoggingConfig {
  /** Logging level (debug, info, warning, error) */
  level: LogLevel;
  
  /** Maximum log file size in bytes */
  maxSize: number;
  
  /** Maximum number of backup logs to keep */
  maxBackups: number;
}
```

## Best Practices

### Do's

1. **Do** keep interfaces focused on a single responsibility
2. **Do** document interfaces and properties thoroughly
3. **Do** use consistent naming conventions
4. **Do** organize related interfaces together
5. **Do** use specific types rather than `any`
6. **Do** create helper functions for accessing potentially missing properties
7. **Do** use type guards to validate object shapes

### Don'ts

1. **Don't** create overly large interfaces
2. **Don't** use inconsistent property names
3. **Don't** use `any` type unless absolutely necessary
4. **Don't** duplicate interface properties across multiple interfaces
5. **Don't** extend unrelated interfaces
6. **Don't** use abbreviations in interface or property names
7. **Don't** access properties directly without type guards when the shape might vary

## Example: Comprehensive Interface Design

```typescript
/**
 * Core dream metric data structure
 * Represents the fundamental properties of a dream metric
 */
interface CoreDreamMetric {
  /** Unique identifier for the metric */
  id: string;
  
  /** Display name of the metric */
  name: string;
  
  /** Icon to represent the metric */
  icon: string;
  
  /** Whether the metric is enabled */
  enabled: boolean;
}

/**
 * Extended dream metric with display options
 * Used for rendering metrics in the UI
 */
interface DisplayableDreamMetric extends CoreDreamMetric {
  /** Detailed description of the metric */
  description: string;
  
  /** Value range for the metric */
  range: {
    /** Minimum allowed value */
    min: number;
    
    /** Maximum allowed value */
    max: number;
  };
  
  /** Display options for the metric */
  display: {
    /** Color to use for the metric */
    color?: string;
    
    /** Format to display the value */
    format?: 'number' | 'percentage' | 'stars';
  };
}

/**
 * Type guard for CoreDreamMetric
 * @param obj Object to check
 * @returns True if the object is a valid CoreDreamMetric
 */
function isCoreDreamMetric(obj: any): obj is CoreDreamMetric {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.icon === 'string' &&
    typeof obj.enabled === 'boolean'
  );
}

/**
 * Type guard for DisplayableDreamMetric
 * @param obj Object to check
 * @returns True if the object is a valid DisplayableDreamMetric
 */
function isDisplayableDreamMetric(obj: any): obj is DisplayableDreamMetric {
  return (
    isCoreDreamMetric(obj) &&
    typeof obj.description === 'string' &&
    obj.range !== undefined &&
    typeof obj.range.min === 'number' &&
    typeof obj.range.max === 'number'
  );
}

/**
 * Safely gets a dream metric property
 * @param metric The metric object (may be in any format)
 * @param property The property to get
 * @param defaultValue Default value if property doesn't exist
 * @returns The property value or default
 */
function getMetricProperty<T>(
  metric: any,
  property: string,
  defaultValue: T
): T {
  if (!metric || metric[property] === undefined) {
    return defaultValue;
  }
  return metric[property] as T;
}
``` 
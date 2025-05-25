# TypeScript Best Practices Guide

## Overview

This document provides best practices for TypeScript development in the OneiroMetrics plugin. Following these guidelines will ensure code consistency, type safety, and maintainability.

## Table of Contents

- [Type Safety](#type-safety)
- [Interface Design](#interface-design)
- [Adapter Pattern Usage](#adapter-pattern-usage)
- [Property Access](#property-access)
- [Error Handling](#error-handling)
- [Component Development](#component-development)
- [Testing TypeScript Code](#testing-typescript-code)
- [Migration Considerations](#migration-considerations)

## Type Safety

### Use Explicit Types

Always use explicit type annotations for function parameters and return types:

```typescript
// AVOID implicit typing:
function getMetricValue(metric, entry) {
  return entry[metric.key] || 0;
}

// PREFER explicit typing:
function getMetricValue(metric: DreamMetric, entry: JournalEntry): number {
  return entry[metric.key] || 0;
}
```

### Avoid `any` Type

Avoid using the `any` type whenever possible:

```typescript
// AVOID:
function processData(data: any): any {
  // ...
}

// PREFER:
function processData(data: JournalEntry): ProcessedEntry {
  // ...
}
```

When working with unknown data (like from APIs), use `unknown` instead of `any`:

```typescript
function parseApiResponse(response: unknown): JournalEntry {
  // Validate and transform the response...
  if (!isJournalEntry(response)) {
    throw new Error('Invalid journal entry');
  }
  return response;
}
```

### Use Type Guards

Create and use type guards to validate object shapes at runtime:

```typescript
// Type guard for JournalEntry
function isJournalEntry(obj: unknown): obj is JournalEntry {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'date' in obj &&
    'content' in obj
  );
}

// Usage
function processEntry(obj: unknown) {
  if (isJournalEntry(obj)) {
    // TypeScript knows obj is JournalEntry inside this block
    console.log(obj.date);
  }
}
```

### Prefer Interfaces for Public APIs

Use interfaces for public APIs and exported types:

```typescript
// PREFER:
export interface DreamMetric {
  name: string;
  key: string;
  description: string;
  range: { min: number; max: number };
  enabled: boolean;
}

// AVOID exporting implementation details:
export class DreamMetricImpl implements DreamMetric {
  // Internal implementation...
}
```

### Use Utility Types

Leverage TypeScript utility types for common type transformations:

```typescript
// Make all properties optional
type PartialDreamMetric = Partial<DreamMetric>;

// Extract specific properties
type MetricRange = Pick<DreamMetric, 'range'>;

// Omit specific properties
type MetricWithoutRange = Omit<DreamMetric, 'range'>;

// Read-only version
type ReadonlyMetric = Readonly<DreamMetric>;
```

## Interface Design

### Design for Evolution

Create interfaces that can evolve over time:

```typescript
// Base interface with core properties
export interface CoreDreamMetric {
  name: string;
  key: string;
}

// Extended interface with additional properties
export interface DreamMetric extends CoreDreamMetric {
  description: string;
  range: { min: number; max: number };
  enabled: boolean;
}
```

### Use Optional Properties Carefully

Only mark properties as optional when they are truly optional:

```typescript
// AVOID unnecessary optionals:
interface DreamMetric {
  name?: string; // Name should be required
  key?: string;  // Key should be required
  description?: string; // This could be optional
}

// PREFER:
interface DreamMetric {
  name: string;
  key: string;
  description?: string;
}
```

### Use Readonly for Immutable Data

Mark properties that shouldn't be modified as readonly:

```typescript
interface DreamMetric {
  readonly name: string;
  readonly key: string;
  description: string;
  enabled: boolean;
}
```

### Avoid Interface Bloat

Keep interfaces focused on a single responsibility:

```typescript
// AVOID:
interface DreamMetric {
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  journalEntries: JournalEntry[]; // Doesn't belong here
  calculateAverage(): number;      // Doesn't belong here
}

// PREFER:
interface DreamMetric {
  name: string;
  key: string;
  description: string;
  enabled: boolean;
}

interface MetricProcessor {
  calculateAverage(metric: DreamMetric, entries: JournalEntry[]): number;
}
```

## Adapter Pattern Usage

### Always Use Adapter Functions

When working with potentially variable data structures, use adapter functions:

```typescript
// AVOID direct manipulation:
function processSettings(settings: any) {
  // Directly accessing potentially undefined properties
  const projectNote = settings.projectNote || settings.projectNotePath || '';
  // ...
}

// PREFER adapter functions:
function processSettings(settings: any) {
  // Using helper to safely get the property
  const projectNote = getProjectNotePath(settings);
  // ...
}
```

### Keep Adapters Pure

Adapter functions should not modify input objects:

```typescript
// AVOID modifying input:
function normalizeSettings(settings: any): DreamMetricsSettings {
  settings.projectNote = settings.projectNote || settings.projectNotePath || '';
  return settings;
}

// PREFER creating new objects:
function normalizeSettings(settings: any): DreamMetricsSettings {
  return {
    ...settings,
    projectNote: getProjectNotePath(settings),
    // Other normalized properties...
  };
}
```

### Provide Sensible Defaults

Always provide sensible defaults in adapter functions:

```typescript
function getMetricRange(metric: any): Range {
  if (!metric) return { min: 1, max: 5 };
  
  // Handle both modern and legacy formats
  if (metric.range) return metric.range;
  
  return {
    min: metric.min !== undefined ? metric.min : 1,
    max: metric.max !== undefined ? metric.max : 5
  };
}
```

## Property Access

### Use Null Coalescing and Optional Chaining

Use the null coalescing operator (`??`) and optional chaining (`?.`) for safe property access:

```typescript
// AVOID nested conditionals:
let description = '';
if (metric && metric.description) {
  description = metric.description;
}

// PREFER optional chaining:
const description = metric?.description ?? '';
```

### Use Helper Functions for Complex Conditionals

Extract complex property access patterns into helper functions:

```typescript
// AVOID repeating complex access patterns:
if (settings && settings.metrics && settings.metrics[name] && settings.metrics[name].enabled) {
  // ...
}

// PREFER helper functions:
function isMetricEnabled(settings: any, name: string): boolean {
  return !!settings?.metrics?.[name]?.enabled;
}

// Usage
if (isMetricEnabled(settings, 'clarity')) {
  // ...
}
```

## Error Handling

### Use Type-Safe Error Handling

Implement type-safe error handling:

```typescript
// Define error types
interface ValidationError {
  type: 'validation';
  field: string;
  message: string;
}

interface NetworkError {
  type: 'network';
  status: number;
  message: string;
}

type AppError = ValidationError | NetworkError;

// Handle errors with type checking
function handleError(error: AppError): void {
  switch (error.type) {
    case 'validation':
      console.error(`Validation error in ${error.field}: ${error.message}`);
      break;
    case 'network':
      console.error(`Network error (${error.status}): ${error.message}`);
      break;
  }
}
```

### Prefer Result Objects Over Exceptions

For recoverable errors, consider using result objects instead of exceptions:

```typescript
interface Success<T> {
  success: true;
  data: T;
}

interface Failure {
  success: false;
  error: string;
}

type Result<T> = Success<T> | Failure;

function parseMetric(input: unknown): Result<DreamMetric> {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Invalid input' };
  }
  
  // Validation and parsing...
  
  return { 
    success: true, 
    data: /* parsed metric */ 
  };
}

// Usage
const result = parseMetric(input);
if (result.success) {
  // Use result.data
} else {
  // Handle result.error
}
```

## Component Development

### Use Interfaces for Component Props

Define interfaces for component props:

```typescript
interface MetricDisplayProps {
  metric: DreamMetric;
  value: number;
  showLabel?: boolean;
}

function MetricDisplay({ metric, value, showLabel = true }: MetricDisplayProps) {
  // Component implementation...
}
```

### Prefer Composition Over Inheritance

Use composition and interfaces instead of class inheritance for components:

```typescript
// AVOID inheritance:
class BaseComponent {
  // Shared logic...
}

class MetricComponent extends BaseComponent {
  // Specific logic...
}

// PREFER composition:
interface Component {
  render(): HTMLElement;
}

function createMetricComponent(metric: DreamMetric): Component {
  // Component implementation...
  return {
    render() {
      // Render logic...
    }
  };
}
```

## Testing TypeScript Code

### Write Type-Safe Tests

Ensure tests are type-safe:

```typescript
// Test helper function with proper types
function createTestMetric(overrides?: Partial<DreamMetric>): DreamMetric {
  return {
    name: 'Test Metric',
    key: 'test',
    description: 'A test metric',
    range: { min: 1, max: 5 },
    enabled: true,
    ...overrides
  };
}

// Test with proper type assertions
test('getMetricAverage returns correct value', () => {
  const metric = createTestMetric();
  const entries = [/* test data */];
  const result = getMetricAverage(metric, entries);
  expect(result).toBeGreaterThanOrEqual(metric.range.min);
  expect(result).toBeLessThanOrEqual(metric.range.max);
});
```

### Test Type Guards and Adapters

Write tests for type guards and adapter functions:

```typescript
test('isJournalEntry correctly identifies valid entries', () => {
  const validEntry = { date: '2023-01-01', content: 'Test entry' };
  const invalidEntry = { content: 'Missing date' };
  
  expect(isJournalEntry(validEntry)).toBe(true);
  expect(isJournalEntry(invalidEntry)).toBe(false);
});
```

## Migration Considerations

### Mark Legacy Code

Use JSDoc comments to mark legacy code:

```typescript
/**
 * @deprecated Use getProjectNotePath helper instead
 */
function getLegacyProjectNote(settings: any): string {
  return settings.projectNote || '';
}
```

### Plan for Deprecation

Create a deprecation plan for legacy patterns:

```typescript
/**
 * @deprecated Use the adapter pattern instead
 * @see adaptToCoreDreamMetricsSettings
 * @removal-date 2025-08-01
 */
```

### Document Migration Paths

Provide clear migration paths for developers:

```typescript
/**
 * @deprecated Use the new MetricsProvider instead
 * @migration
 * // Old approach
 * const metrics = getMetrics(settings);
 * 
 * // New approach
 * const metricsProvider = new MetricsProvider(settings);
 * const metrics = metricsProvider.getMetrics();
 */
```

## Conclusion

Following these TypeScript best practices will ensure code consistency, type safety, and maintainability in the OneiroMetrics plugin. For specific implementation patterns, refer to the [TypeScript Adapter Pattern Guide](./typescript-adapter-patterns.md) and [TypeScript Helper Utilities Guide](./typescript-helper-utilities.md). 
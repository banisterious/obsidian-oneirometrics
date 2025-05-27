# Defensive Coding Practices

## Overview

This document outlines comprehensive defensive coding practices for the OneiroMetrics plugin. These practices build upon the Service Registry Pattern to create robust, error-resistant code that can withstand unexpected conditions and provide graceful degradation when failures occur.

## Table of Contents

- [Principles](#principles)
- [Defensive Patterns](#defensive-patterns)
  - [Safe Property Access](#safe-property-access)
  - [Null Object Pattern](#null-object-pattern)
  - [Error Boundaries](#error-boundaries)
  - [Function Wrappers](#function-wrappers)
  - [Type Guards](#type-guards)
- [Implementation Guidelines](#implementation-guidelines)
- [Code Examples](#code-examples)
- [Testing Defensive Code](#testing-defensive-code)
- [Integration with Service Registry](#integration-with-service-registry)

## Principles

1. **Expect Failure**: Assume that any operation can fail and plan for it
2. **Provide Fallbacks**: Always have a reasonable default behavior when the primary path fails
3. **Contain Failures**: Prevent cascading failures by isolating error-prone code
4. **Maintain User Experience**: Degrade functionality gracefully rather than crashing
5. **Prioritize Diagnostics**: Make troubleshooting easy with clear error messages and context

## Defensive Patterns

### Safe Property Access

Pattern for safely accessing potentially undefined properties with fallbacks:

```typescript
// Bad: Direct property access
const name = user.profile.name;

// Good: Safe property access with fallback
const name = user?.profile?.name || 'Unknown User';

// Better: Helper function with typing
function getSafe<T, R>(obj: T, getter: (obj: T) => R, fallback: R): R {
  try {
    const result = getter(obj);
    return result === undefined || result === null ? fallback : result;
  } catch (e) {
    return fallback;
  }
}

const name = getSafe(user, u => u.profile.name, 'Unknown User');
```

### Null Object Pattern

Provide default implementations for interfaces that do no-op operations:

```typescript
interface LoggingService {
  log(level: string, message: string): void;
  error(message: string, error?: Error): void;
}

// Null object implementation
class NullLogger implements LoggingService {
  log(level: string, message: string): void { /* no-op */ }
  error(message: string, error?: Error): void { /* no-op */ }
}

// Usage
const logger = serviceRegistry.getService<LoggingService>('logger') || new NullLogger();
```

### Error Boundaries

Contain errors within specific boundaries to prevent system-wide failures:

```typescript
class ErrorBoundary {
  private fallbackUI: HTMLElement;
  private contentUI: HTMLElement;
  
  constructor(container: HTMLElement, fallbackContent: string) {
    this.fallbackUI = document.createElement('div');
    this.fallbackUI.className = 'oom-error-boundary-fallback';
    this.fallbackUI.textContent = fallbackContent;
    
    this.contentUI = document.createElement('div');
    this.contentUI.className = 'oom-error-boundary-content';
    
    container.appendChild(this.contentUI);
  }
  
  public renderContent(renderFn: () => void): void {
    try {
      renderFn();
    } catch (e) {
      this.handleError(e);
    }
  }
  
  private handleError(error: any): void {
    console.error('Error in UI component:', error);
    
    // Replace content with fallback
    this.contentUI.replaceWith(this.fallbackUI);
    
    // Log detailed error information
    const logger = serviceRegistry.getService<LoggingService>('logger');
    logger?.error('UI Rendering Error', { 
      error, 
      component: this.contentUI.className 
    });
  }
}

// Usage
const boundary = new ErrorBoundary(container, 'Could not load metrics. Please try again later.');
boundary.renderContent(() => {
  // Complex rendering logic that might fail
  renderMetricsTable(data);
});
```

### Function Wrappers

Wrap functions to add automatic error handling and logging:

```typescript
function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  fallback: ReturnType<T>,
  errorHandler?: (error: any) => void
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    try {
      return fn(...args);
    } catch (e) {
      if (errorHandler) {
        errorHandler(e);
      }
      return fallback;
    }
  };
}

// Usage
const safeParseDate = withErrorHandling(
  (dateStr: string) => new Date(dateStr),
  new Date(),
  (e) => console.error(`Date parsing error: ${e.message}`)
);
```

### Type Guards

Runtime type checking to validate data before processing:

```typescript
function isDreamEntry(obj: any): obj is DreamEntry {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.date === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.content === 'string'
  );
}

// Usage
function processDreamEntry(entry: any): void {
  if (!isDreamEntry(entry)) {
    console.error('Invalid dream entry:', entry);
    return;
  }
  
  // Now TypeScript knows it's a valid DreamEntry
  updateMetrics(entry.date, entry.title, entry.content);
}
```

## Implementation Guidelines

1. **Start with Critical Paths**: Apply defensive coding first to user-facing features and data processing
2. **Use TypeScript Features**: Leverage union types, optional chaining, and nullish coalescing
3. **Create Utility Libraries**: Build reusable defensive coding utilities
4. **Document Assumptions**: Make implicit assumptions explicit in comments
5. **Add Recovery Logic**: Include code to recover from common failure modes

## Code Examples

### Safe Service Resolution

```typescript
// Safe service resolution with fallback
function getService<T>(serviceId: string, fallback: T): T {
  try {
    const service = serviceRegistry.getService<T>(serviceId);
    return service || fallback;
  } catch (e) {
    console.error(`Error resolving service ${serviceId}:`, e);
    return fallback;
  }
}

// Usage
const logger = getService<LoggingService>('logger', new ConsoleLogger());
```

### Safe DOM Operations

```typescript
// Safe DOM query with fallback
function queryElement(selector: string, fallbackElement?: HTMLElement): HTMLElement {
  try {
    const element = document.querySelector(selector);
    if (element) {
      return element as HTMLElement;
    }
  } catch (e) {
    console.error(`Error querying for ${selector}:`, e);
  }
  
  // Return fallback or create an invisible div
  return fallbackElement || createInvisibleFallbackElement();
}

function createInvisibleFallbackElement(): HTMLElement {
  const div = document.createElement('div');
  div.style.display = 'none';
  document.body.appendChild(div);
  return div;
}
```

### Robust Event Handling

```typescript
// Safe event handler registration
function safeAddEventListener(
  element: HTMLElement | null,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
): () => void {
  if (!element) {
    return () => {}; // No-op cleanup function
  }
  
  try {
    const wrappedHandler = ((e: Event) => {
      try {
        handler(e);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }) as EventListener;
    
    element.addEventListener(event, wrappedHandler, options);
    
    // Return cleanup function
    return () => {
      try {
        element.removeEventListener(event, wrappedHandler, options);
      } catch (e) {
        console.error(`Error removing event listener for ${event}:`, e);
      }
    };
  } catch (e) {
    console.error(`Error adding event listener for ${event}:`, e);
    return () => {}; // No-op cleanup function
  }
}

// Usage
const cleanup = safeAddEventListener(
  document.getElementById('expand-button'),
  'click',
  handleExpand
);

// Later cleanup
cleanup();
```

## Testing Defensive Code

Defensive code requires specific testing approaches:

1. **Error Injection**: Deliberately inject errors to test recovery paths
2. **Boundary Testing**: Test with null, undefined, and unexpected values
3. **Component Isolation**: Test components in isolation with mocked dependencies
4. **Fault Simulation**: Simulate service failures and network errors
5. **Recovery Testing**: Verify systems recover after failures

Example test:

```typescript
describe('Safe Property Access', () => {
  it('should return fallback when property path is invalid', () => {
    const obj = { a: { b: 'value' } };
    
    // Test valid path
    expect(getSafe(obj, o => o.a.b, 'fallback')).toEqual('value');
    
    // Test invalid path
    expect(getSafe(obj, o => o.a.c.d, 'fallback')).toEqual('fallback');
    
    // Test null object
    expect(getSafe(null, o => o.a.b, 'fallback')).toEqual('fallback');
  });
});
```

## Integration with Service Registry

The Defensive Coding practices integrate with the Service Registry Pattern to provide several benefits:

1. **Safe Service Resolution**: Get services with fallbacks when not available
2. **Service Mocking**: Easily replace services with test doubles
3. **Lifecycle Management**: Safely initialize and destroy services
4. **Error Isolation**: Contain service errors to prevent cascading failures

Example integration:

```typescript
// Enhanced Service Registry with defensive features
class DefensiveServiceRegistry {
  private registry: Map<string, any> = new Map();
  private fallbacks: Map<string, any> = new Map();
  
  register<T>(id: string, service: T): void {
    this.registry.set(id, service);
  }
  
  registerFallback<T>(id: string, fallback: T): void {
    this.fallbacks.set(id, fallback);
  }
  
  getService<T>(id: string): T | null {
    try {
      return this.registry.get(id) as T || this.fallbacks.get(id) as T || null;
    } catch (e) {
      console.error(`Error retrieving service ${id}:`, e);
      return this.fallbacks.get(id) as T || null;
    }
  }
  
  safeCall<T, R>(
    serviceId: string,
    method: string,
    args: any[],
    fallback: R
  ): R {
    try {
      const service = this.getService<T>(serviceId);
      if (!service) return fallback;
      
      const fn = (service as any)[method];
      if (typeof fn !== 'function') return fallback;
      
      return fn.apply(service, args);
    } catch (e) {
      console.error(`Error calling ${serviceId}.${method}:`, e);
      return fallback;
    }
  }
}

// Usage
const registry = new DefensiveServiceRegistry();
registry.register('logger', new ProductionLogger());
registry.registerFallback('logger', new ConsoleLogger());

// Safe service method call
const result = registry.safeCall<LoggingService, boolean>(
  'logger',
  'logMetric',
  ['dream_count', 42],
  false
);
```

This integration ensures that services are used safely throughout the application, with proper fallbacks and error handling when necessary.

## Conclusion

Implementing these defensive coding practices will significantly improve the robustness of the OneiroMetrics plugin. By combining the Service Registry Pattern with comprehensive defensive coding, we create a system that can withstand unexpected conditions, gracefully degrade when necessary, and provide a consistent user experience even when failures occur.

Future enhancements to these practices should include:

1. **Circuit Breakers**: Prevent repeated calls to failing services
2. **Health Checks**: Proactively monitor system health
3. **Self-Healing**: Automatic recovery from certain failure modes
4. **Feature Flags**: Dynamic enabling/disabling of features based on system health
5. **Telemetry**: Capture performance metrics to identify potential issues before they cause failures 
# Refactoring Lessons Learned

## Overview

This document captures key lessons learned during the 2025 refactoring effort of the OOMP (OneiroMetrics) plugin, specifically related to the extraction of event handlers into separate classes. It outlines what went wrong, why those issues occurred, and provides a roadmap for implementing similar refactoring properly in the future.

## What Went Wrong

### 1. Initialization Order Issues

- **Global Variables**: Variables like `globalLogger` and `customDateRange` were used before initialization
- **Function Dependencies**: Functions like `getProjectNotePath` were referenced before they were available
- **Service Dependencies**: Logger service was expected in components before it was fully initialized

### 2. Cross-Module Dependencies

- **Implicit Dependencies**: New modules had implicit dependencies on main.ts internals
- **Hidden State**: Dependencies on global state weren't made explicit in module interfaces
- **Circular References**: Some modules ended up with circular dependency issues

### 3. Dream Entry Detection Problems

- **Content Parser Changes**: Changes to the content parser affected dream entry detection
- **Callout Type Recognition**: Recognition of different callout types (`dream`, `diary`, etc.) was affected
- **Nested Structure Handling**: Processing of nested callouts was disrupted

### 4. UI Component Issues

- **Content Cell Rendering**: "Show more" buttons were missing in the Content column
- **Data Extraction**: Date, Dream Title, and Content columns showed incorrect data
- **Table Virtualization**: Virtualization features weren't working properly

## Root Causes Analysis

### 1. Architectural Design Issues

- **Global State Reliance**: Excessive reliance on global variables and functions
- **Monolithic Design**: Too much functionality in main.ts with tight coupling
- **Missing Interfaces**: Lack of clear interfaces between components
- **Implicit Timing Dependencies**: Components assumed certain initialization order

### 2. Implementation Approach Problems

- **Big-Bang Refactoring**: Tried to move too much functionality at once
- **Inadequate Testing**: Lack of tests for initialization sequence and error cases
- **Insufficient Documentation**: Dependencies and initialization requirements not documented
- **Missing Fallbacks**: No graceful degradation when dependencies unavailable

## Future Implementation Plan

### Phase 1: Preparation and Documentation

1. **Map Dependencies**
   - Document all global variables and their usage
   - Create dependency graph between components
   - Identify initialization order requirements

2. **Create Test Suite**
   - Add tests for critical functionality
   - Create tests for initialization sequence
   - Add tests for graceful degradation

3. **Design Interfaces**
   - Define clear interfaces between components
   - Document required vs. optional dependencies
   - Create service locator pattern for components

### Phase 2: Incremental Refactoring

1. **Create Safe Helper Utilities**
   - Implement robust logging with fallbacks
   - Create safe versions of critical utilities
   - Add defensive coding patterns with null checks

2. **Refactor in Small Steps**
   - Extract one component at a time
   - Verify functionality after each extraction
   - Keep working version until new version is validated

3. **Implement Dependency Injection**
   - Move from global state to explicit dependencies
   - Create service locator/registry pattern
   - Add proper initialization sequence

### Phase 3: Specific Component Implementation

1. **Events System**
   - Create proper event manager class
   - Implement safe event registration pattern
   - Handle missing dependencies gracefully

2. **Content Parsing**
   - Update content parser with robust error handling
   - Add support for various callout formats
   - Improve dream entry detection with fallbacks

3. **UI Components**
   - Fix table rendering and virtualization
   - Improve content cell rendering
   - Fix "Show more" button implementation

## Implementation Guidelines

### Safe Initialization Pattern

```typescript
// Example of safe initialization pattern
export class SafeComponent {
  private logger: LoggingService | null = null;
  
  constructor(dependencies: ComponentDependencies) {
    // Safe dependency assignment with fallbacks
    this.logger = dependencies.logger || {
      log: () => console.log('[FALLBACK]', ...arguments),
      error: () => console.error('[FALLBACK]', ...arguments)
    };
  }
  
  // Methods use safe access patterns
  public doSomething(): void {
    this.logger?.log('Component', 'Doing something');
    // Implementation...
  }
}
```

### Dependency Injection Approach

```typescript
// Example of dependency injection approach
export class DependencyRegistry {
  private static instance: DependencyRegistry;
  private services: Map<string, any> = new Map();
  
  public static getInstance(): DependencyRegistry {
    if (!DependencyRegistry.instance) {
      DependencyRegistry.instance = new DependencyRegistry();
    }
    return DependencyRegistry.instance;
  }
  
  public register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }
  
  public get<T>(name: string): T | null {
    return this.services.get(name) || null;
  }
}

// Usage
const registry = DependencyRegistry.getInstance();
registry.register('logger', new LoggingService());

// In components
const logger = registry.get('logger') || createFallbackLogger();
```

### Robust Error Handling

```typescript
// Example of robust error handling
export function getProjectNotePath(settings: any): string {
  try {
    // Defensive checks
    if (!settings) return 'DreamMetrics.md'; // Default
    
    // Primary path
    if (typeof settings.projectNotePath === 'string') {
      return settings.projectNotePath;
    }
    
    // Fallback paths
    if (typeof settings.projectNote === 'string') {
      return settings.projectNote;
    }
    
    // Default fallback
    return 'DreamMetrics.md';
  } catch (e) {
    console.error('Error getting project note path:', e);
    return 'DreamMetrics.md'; // Safe default
  }
}
```

## Testing Requirements

For each refactored component, tests should verify:

1. **Initialization**: Component initializes correctly with all dependencies
2. **Fallback Behavior**: Component works with missing dependencies
3. **Error Handling**: Component handles errors gracefully
4. **Functionality**: Component performs its core functions correctly

## Roadmap and Timeline

| Phase | Component | Target Date | Priority | Dependencies |
|-------|-----------|-------------|----------|--------------|
| 1 | Dependency Mapping | Week 1 | High | None |
| 1 | Test Suite Creation | Week 1-2 | High | None |
| 1 | Interface Design | Week 2 | High | Dependency Mapping |
| 2 | Safe Helper Utilities | Week 3 | High | Interface Design |
| 2 | Logger Refactoring | Week 3 | High | Safe Helper Utilities |
| 2 | Event System Refactoring | Week 4 | Medium | Logger Refactoring |
| 3 | Content Parser Updates | Week 5 | Medium | Safe Helper Utilities |
| 3 | UI Component Fixes | Week 6 | Medium | Event System Refactoring |
| 3 | Final Integration | Week 7 | High | All Components |

## Success Criteria

The refactoring will be considered successful when:

1. All functionality works correctly, including dream entry detection
2. UI components render properly, including "Show more" buttons
3. No initialization errors occur during plugin startup
4. Components handle missing dependencies gracefully
5. The codebase is more maintainable with clear component boundaries

## Conclusion

This plan provides a structured approach to implementing the refactoring that avoids the pitfalls encountered in the previous attempt. By focusing on initialization order, making dependencies explicit, and implementing robust error handling, we can achieve the architectural improvements while maintaining functionality. 
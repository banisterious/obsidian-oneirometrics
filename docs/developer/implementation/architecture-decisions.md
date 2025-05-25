# OneiroMetrics Architecture Decisions

This document tracks important architecture decisions that were made during the refactoring process. Each question includes options with pros and cons that guided decision-making. All implementation details for these decisions have been incorporated into the comprehensive refactoring plan (now archived in `docs/archive/refactoring-2025/`). For the current architecture overview, please refer to the architecture documentation in `docs/developer/architecture/overview.md`.

## 1. Interface Design Strategy - DECIDED

**Question:** How should we design interfaces to break circular dependencies?

**Options:**

1. **TypeScript Interfaces**
   - Pros: Lightweight, no runtime overhead, flexible implementation
   - Cons: No default implementations, no runtime type checking
   
2. **Abstract Classes**
   - Pros: Can include default implementations, enforces inheritance
   - Cons: Single inheritance limitation, runtime overhead
   
3. **Hybrid Approach**
   - Pros: Uses interfaces for contracts and abstract classes for shared functionality
   - Cons: More complex architecture, potential confusion
   
4. **Dependency Injection Container**
   - Pros: Centralized dependency management, easier testing
   - Cons: Adds complexity, overkill for smaller plugins

**Decision:** We will use TypeScript interfaces for component contracts, particularly focusing on extracting the plugin functionality into interfaces that components can depend on rather than depending directly on the plugin. This provides the most flexibility while breaking circular dependencies.

**Implementation:** See refactoring plan section 2.1 (Extract Core Services).

## 2. State Management Architecture - DECIDED

**Question:** What state management approach should we adopt?

**Options:**

1. **Custom Observable Pattern**
   - Pros: Lightweight, tailored to needs, no external dependencies
   - Cons: Requires implementation effort, potential for inconsistencies
   
2. **Redux-like Pattern**
   - Pros: Predictable state changes, easy debugging, centralized state
   - Cons: Verbose, potential performance issues with large state
   
3. **MobX-inspired Reactive Approach**
   - Pros: Automatic tracking of dependencies, less boilerplate
   - Cons: More "magic", harder to follow state changes
   
4. **Enhance Current DreamMetricsState**
   - Pros: Builds on existing code, minimal changes
   - Cons: May perpetuate existing design limitations

**Decision:** We will enhance the current DreamMetricsState with a more robust observable pattern, dividing it into separate state domains (metrics, UI, settings). This builds on existing code while improving architecture.

**Implementation:** See refactoring plan section 2.3 (Refactor State Management).

## 3. Event Communication System - DECIDED

**Question:** What event system will replace direct references between components?

**Options:**

1. **Centralized Event Bus**
   - Pros: Simple to implement, consistent pattern
   - Cons: Can lead to "event spaghetti", hard to track
   
2. **Typed Event Emitters**
   - Pros: Type safety, clear contracts
   - Cons: More verbose, requires more setup
   
3. **Obsidian Events Integration**
   - Pros: Consistent with platform, familiar
   - Cons: Limited to Obsidian's capabilities
   
4. **Observer Pattern with Direct Subscriptions**
   - Pros: Clear relationships, easy to reason about
   - Cons: More coupled than a central bus

**Decision:** We will implement typed event emitters for specific functional areas of the plugin (metrics, UI, journal structure, etc.), providing type safety while maintaining clear separation of concerns.

**Implementation:** See refactoring plan section 2.1 (Extract Core Services) and 3.3 (UI Components).

## 4. Internal API Design - DECIDED

**Question:** How should we structure the internal API between components?

**Options:**

1. **Flat API Structure**
   - Pros: Simple, direct access to all functionality
   - Cons: Poor encapsulation, unclear boundaries
   
2. **Modular Service-Based Structure**
   - Pros: Clear responsibilities, better encapsulation
   - Cons: More code to manage services
   
3. **Hierarchical API Structure**
   - Pros: Logical organization, clear parent-child relationships
   - Cons: Potential for deep nesting, complex navigation

**Decision:** OneiroMetrics will not expose an external API for other plugins. For internal component communication, we will use a modular service-based structure with clear boundaries between functional areas.

**Implementation:** See refactoring plan section 2.1 (Extract Core Services) and 4.1 (Rebuild Main Plugin Class).

## 5. Error Handling and Logging - DECIDED

**Question:** How will error handling be standardized across components?

**Options:**

1. **Centralized Error Handler**
   - Pros: Consistent handling, centralized reporting
   - Cons: Potential bottleneck, tight coupling
   
2. **Domain-Specific Error Handlers**
   - Pros: Tailored to domain needs, more contextual
   - Cons: Potential inconsistencies, duplicated code
   
3. **Error Bubbling with Context**
   - Pros: Errors include context as they bubble up
   - Cons: More complex error objects, verbose
   
4. **Result Objects (Success/Error)**
   - Pros: Explicit error handling, no exceptions
   - Cons: Verbose, requires discipline

**Decision:** We will implement error bubbling with context enrichment, where errors gain additional context as they propagate up through the component hierarchy. This preserves original error information while adding valuable context.

**Implementation:** See refactoring plan sections 2.1 (Extract Core Services) and 5.1 (Unit Testing).

## 6. UI Component Architecture - DECIDED

**Question:** How should we structure UI components?

**Options:**

1. **Current DOM-Centric Approach**
   - Pros: Familiar, works well with Obsidian
   - Cons: Hard to test, tight coupling with DOM
   
2. **Component System with Templates**
   - Pros: More maintainable, easier testing
   - Cons: Overhead of implementing a framework
   
3. **Web Components**
   - Pros: Standard-based, encapsulation
   - Cons: Browser compatibility, learning curve
   
4. **Presentation/Container Split**
   - Pros: Separates logic from presentation
   - Cons: More files, potentially over-engineered

**Decision:** We will adopt a presentation/container component split for complex UI components, while keeping simpler components as they are. This approach improves testability and separation of concerns without over-engineering.

**Implementation:** See refactoring plan section 3.3 (UI Components) and implementation examples.

## 7. Performance Considerations - DECIDED

**Question:** How will we ensure performance during and after refactoring?

**Options:**

1. **Performance Benchmarking Suite**
   - Pros: Objective measurement, regression detection
   - Cons: Development overhead, potentially flaky tests
   
2. **Manual Performance Testing**
   - Pros: Low overhead, focuses on user experience
   - Cons: Subjective, not reproducible
   
3. **Performance Budgets**
   - Pros: Clear targets, prevents creep
   - Cons: Arbitrary limits, may constrain development
   
4. **User-Focused Metrics**
   - Pros: Focuses on what matters to users
   - Cons: Harder to measure consistently

**Decision:** We will implement a user-focused performance strategy with developer-only UIs for performance metrics. Given the constraints of the Obsidian plugin environment, we'll focus on monitoring critical operations rather than automated benchmarking.

**Implementation:** See refactoring plan section 5.2 (Performance Optimization).

## 8. Migration Strategy Details - DECIDED

**Question:** What's our specific approach to handling breaking changes?

**Options:**

1. **Adapter Layer**
   - Pros: Maintains API compatibility
   - Cons: Technical debt, performance overhead
   
2. **Versioned API**
   - Pros: Clean breaks, clear expectations
   - Cons: Maintenance burden, user confusion
   
3. **Feature Flags**
   - Pros: Gradual rollout, easy rollback
   - Cons: Code complexity, testing burden
   
4. **Documentation-Heavy Approach**
   - Pros: Low code overhead, education-focused
   - Cons: Reliant on users reading documentation

**Decision:** We will use the interface stability approach with adapter classes for complex components as detailed in our refactoring plan. This approach maintains backward compatibility through well-defined interfaces while allowing internal restructuring.

**Implementation:** See refactoring plan section 2.4 (Backward Compatibility Approach) and Q2 (Backward Compatibility Strategy). 
# State Management System

This directory contains the implementation of the OneiroMetrics state management system. The system is designed following the observable pattern and provides a unidirectional data flow that makes state changes predictable and easier to debug.

## Core Concepts

- **Observable State**: The foundation of the system, allowing components to subscribe to state changes.
- **State Selectors**: Allow components to subscribe to specific parts of the state rather than the entire state.
- **Actions and Dispatchers**: Implement unidirectional data flow where state changes happen through explicit actions.
- **Adapters**: Bridge between legacy code and the new state management system.

## Architecture

The state management system is built with layered architecture:

1. **Core Interfaces** (`StateInterfaces.ts`): Define the contract for all state classes
2. **Base Implementation** (`ObservableState.ts`, etc.): Provide reusable implementation of the interfaces
3. **Application-Specific State** (`MetricsState.ts`): Implement domain-specific state
4. **Legacy Compatibility** (`MetricsStateAdapter.ts`): Bridge to legacy code

## Class Hierarchy

```
ObservableState
├── MutableState
│   └── PersistableState
│       └── MetricsState
└── StateSelector
```

## Usage Examples

### Basic State Management

```typescript
// Create a mutable state
const state = new MutableState({ count: 0, name: 'Example' });

// Subscribe to state changes
const unsubscribe = state.subscribe(changes => {
  console.log('State changed:', changes);
});

// Update state
state.setState({ count: 1 });

// Unsubscribe when done
unsubscribe();
```

### Using Selectors

```typescript
// Create a selector for a specific part of state
const countSelector = new StateSelector(state, 'count');

// Subscribe to only that part
countSelector.subscribe(selected => {
  console.log('Count changed:', selected.count);
});
```

### Using Dispatcher

```typescript
// Create a dispatcher for structured state changes
const dispatcher = new StateDispatcher(state);

// Register reducers for specific actions
dispatcher.registerReducer('increment', (state, amount = 1) => ({
  count: state.count + amount
}));

// Dispatch actions to change state
dispatcher.dispatch('increment', 2);
```

### Working with MetricsState

See `StateUsageExample.ts` for a complete example of using the metrics state in a component.

## Migration Guide

When migrating from the old `DreamMetricsState` to the new state management system:

1. Replace constructor calls to `DreamMetricsState` with `MetricsStateAdapter`
2. For new components, use `MetricsState.getInstance()` directly
3. Prefer subscribing to specific parts of state using selectors
4. Use dispatched actions instead of direct setters

## Best Practices

1. **Immutability**: Never mutate state objects directly
2. **Single Source of Truth**: Keep state centralized in the MetricsState
3. **Unidirectional Data Flow**: Changes flow in one direction through actions
4. **Clean Subscriptions**: Always unsubscribe when components are destroyed
5. **Minimal State Updates**: Only update what has changed 
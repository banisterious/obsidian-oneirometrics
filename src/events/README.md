# OneiroMetrics Event System

## Overview

The event system provides a type-safe, pub/sub mechanism for communication between different components of the OneiroMetrics plugin. It uses a modular approach with separate emitters for different functional areas.

## Table of Contents
- [Core Components](#core-components)
- [Event Types](#event-types)
- [Using Events](#using-events)
  - [Subscribing to Events](#subscribing-to-events)
  - [Emitting Events](#emitting-events)
  - [Managing Subscriptions](#managing-subscriptions)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Core Components

- `EventEmitter`: Base class that provides the pub/sub functionality.
- `EventManager`: A singleton that provides access to all emitters through a single point.
- Specialized emitters:
  - `MetricsEventEmitter`: For metrics calculation and display events.
  - `UIEventEmitter`: For UI interactions and updates.
  - `JournalEventEmitter`: For journal entry processing events.
  - `SystemEventEmitter`: For plugin-level and system events.

## Event Types

Each functional area defines its own event types:

- **Metrics Events**: `metrics:calculated`, `metrics:display`, `metrics:filter`, `metrics:valueChanged`
- **UI Events**: `ui:modalOpened`, `ui:modalClosed`, `ui:viewChanged`, `ui:contentToggled`
- **Journal Events**: `journal:entryProcessed`, `journal:entryFailed`, `journal:scanCompleted`, `journal:entryModified`
- **System Events**: `system:settingChanged`, `system:pluginLoaded`, `system:pluginUnloaded`, `system:error`

## Using Events

### Subscribing to Events

To listen for events, use the `on` method of the appropriate emitter:

```typescript
import { EventManager } from 'src/events';

class MyComponent {
  private subscriptions: Array<() => void> = [];
  
  constructor() {
    // Get the event manager instance
    const events = EventManager.getInstance();
    
    // Subscribe to a metrics event
    this.subscriptions.push(
      events.metrics.on('metrics:calculated', this.handleMetricsCalculated.bind(this))
    );
    
    // Subscribe to a UI event
    this.subscriptions.push(
      events.ui.on('ui:modalOpened', this.handleModalOpened.bind(this))
    );
  }
  
  private handleMetricsCalculated(payload: { metrics: Record<string, number[]>; source: string }) {
    console.log(`Metrics calculated from ${payload.source}:`, payload.metrics);
  }
  
  private handleModalOpened(payload: { modalType: string; modal: Modal }) {
    console.log(`Modal opened: ${payload.modalType}`);
  }
  
  // Clean up when component is destroyed
  destroy() {
    // Unsubscribe from all events
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
}
```

### Emitting Events

To emit events, use the convenience methods on the appropriate emitter:

```typescript
import { EventManager } from 'src/events';

class MetricsProcessor {
  processMetrics(metrics: Record<string, number[]>) {
    // Process metrics...
    
    // Emit an event to notify other components
    const events = EventManager.getInstance();
    events.metrics.notifyMetricsCalculated(metrics, 'manual');
  }
}
```

### Managing Subscriptions

Always store the unsubscribe functions returned by the `on` method and call them when your component is destroyed:

```typescript
class MyComponent {
  private unsubscribeFromMetricsEvent: () => void;
  
  initialize() {
    const events = EventManager.getInstance();
    this.unsubscribeFromMetricsEvent = events.metrics.on('metrics:calculated', this.handleMetrics);
  }
  
  destroy() {
    if (this.unsubscribeFromMetricsEvent) {
      this.unsubscribeFromMetricsEvent();
    }
  }
}
```

## Best Practices

1. **Always unsubscribe**: Store unsubscribe functions and call them when components are destroyed to prevent memory leaks.
2. **Use strong typing**: Take advantage of TypeScript to ensure type safety in event payloads.
3. **Keep payloads serializable**: Event payloads should be JSON-serializable to allow for future extensions like event logging or persistence.
4. **Use meaningful event names**: Follow the `namespace:action` naming convention.
5. **Don't overuse events**: For direct component-to-component communication, consider using direct method calls instead.

## Examples

### Error Handling with Event System

```typescript
import { EventManager } from 'src/events';

try {
  // Some operation that might fail
  processJournalEntry(entry);
} catch (error) {
  // Notify of the error through the event system
  EventManager.getInstance().system.notifyError(
    error as Error,
    'JournalProcessor.processJournalEntry'
  );
}

// Set up error handling somewhere else in the application
EventManager.getInstance().system.on('system:error', ({ error, context }) => {
  console.error(`Error in ${context}:`, error);
  // Show a notification to the user
  new Notice(`An error occurred in ${context}: ${error.message}`);
});
```

### Coordinating Between Components

```typescript
// Component A: UI Controller
class FilterController {
  applyFilter(filter: MetricsFilter) {
    // Apply the filter and notify other components
    EventManager.getInstance().metrics.notifyFilterApplied(filter);
  }
}

// Component B: Visualization
class MetricsVisualization {
  constructor() {
    // Listen for filter changes
    EventManager.getInstance().metrics.on('metrics:filter', ({ filter }) => {
      this.updateVisualization(filter);
    });
  }
  
  private updateVisualization(filter: MetricsFilter) {
    // Update visualization based on the filter
  }
}
``` 
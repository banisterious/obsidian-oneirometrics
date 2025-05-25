# TypeScript UI Component Migration

This guide explains how to migrate existing UI components to use the new TypeScript component architecture in OneiroMetrics.

## Overview

The TypeScript migration introduces a standardized component architecture with type safety, consistent event handling, and improved DOM manipulation. This guide provides step-by-step instructions for migrating your existing UI components to take advantage of these improvements.

## Component Architecture

The new component architecture consists of:

1. **BaseComponent** - A foundation class with standardized lifecycle methods
2. **EventableComponent** - Extends BaseComponent with event handling capabilities
3. **DOM Helpers** - Type-safe wrappers for DOM manipulation
4. **Adapter Functions** - Utility functions for handling parameter mismatches
5. **Component Migrator** - Tools to simplify migration of existing components

## Migration Options

There are three approaches to migrating your components:

1. **Component Wrapper** - Wrap your existing component without changing its implementation
2. **Component Extension** - Extend a base component class to inherit new functionality
3. **Complete Rewrite** - Rewrite the component using the new architecture (best for complex components)

## Option 1: Component Wrapper

Use the component wrapper approach for simple components that don't need significant changes:

```typescript
import { wrapLegacyComponent } from '../../utils/component-migrator';

// Original component function
function createMetricChart(container, metrics) {
  // ...implementation
  return {
    render,
    updateData
  };
}

// Wrapped component with proper typing
const MetricChart = wrapLegacyComponent(createMetricChart);

// Usage with proper typing
const chart = MetricChart({
  container: document.getElementById('chart'),
  metrics: typedMetrics
});
```

## Option 2: Component Extension

For components that would benefit from the new lifecycle methods:

```typescript
import { BaseComponent } from '../../templates/ui/BaseComponent';
import { DreamMetric } from '../../types/core';

interface MetricListProps {
  container: HTMLElement;
  metrics: DreamMetric[];
}

class MetricList extends BaseComponent {
  private metrics: DreamMetric[] = [];
  
  constructor(props: Partial<MetricListProps>) {
    super(props);
    
    this.metrics = props.metrics || [];
    this.container.classList.add('metric-list');
  }
  
  render(): void {
    super.render();
    
    // Render implementation using DOM helpers
    this.container.innerHTML = '';
    
    this.metrics.forEach(metric => {
      const item = this.createElement('div', { 
        className: 'metric-item',
        'data-metric': metric.name
      });
      
      const icon = this.createElement('span', { 
        className: 'metric-icon' 
      }, metric.icon);
      
      const name = this.createElement('span', { 
        className: 'metric-name' 
      }, metric.name);
      
      item.appendChild(icon);
      item.appendChild(name);
    });
  }
  
  updateMetrics(metrics: DreamMetric[]): void {
    this.metrics = metrics;
    this.render();
  }
}
```

## Option 3: Using Component Migrator

The component migrator provides various utilities to help with migration:

1. **wrapLegacyComponent** - Wraps a function-based component
2. **transformToComponentClass** - Transforms a class constructor to a component class
3. **migrateToEventable** - Adds event handling capabilities to a component
4. **adaptLegacyEvents** - Adapts event handling in legacy components

Example of migrating a component with events:

```typescript
import { 
  wrapLegacyComponent, 
  migrateToEventable 
} from '../../utils/component-migrator';

// Original component
function createJournal(container, entries) {
  // ...implementation
  return {
    render,
    updateEntries
  };
}

// Wrap and add event handling
const Journal = wrapLegacyComponent(createJournal);
const journal = Journal({ container, entries });
const eventableJournal = migrateToEventable(journal, ['entrySelect', 'entryAdd']);

// Type-safe event handling
eventableJournal.on('entrySelect', (entry) => {
  console.log('Selected entry:', entry.title);
});
```

## DOM Helpers

Replace direct DOM manipulation with type-safe DOM helpers:

```typescript
import { 
  createElement, 
  findElement, 
  addClass, 
  removeClass 
} from '../../utils/dom-helpers';

// Instead of:
const div = document.createElement('div');
div.className = 'metric-container';
div.textContent = metric.name;

// Use:
const div = createElement('div', {
  className: 'metric-container'
}, metric.name);

// Instead of:
const element = container.querySelector('.metric-item');
if (element) element.classList.add('selected');

// Use:
const element = findElement('.metric-item', container);
addClass(element, 'selected');
```

## Event Adapter

Use the EventAdapter to handle event type mismatches:

```typescript
import { EventAdapter } from '../../utils/adapter-functions';

// Instead of:
element.addEventListener('click', this.handleClick);

// Use:
element.addEventListener('click', 
  EventAdapter.adaptClickHandler(this.handleClick.bind(this))
);
```

## Migration Checklist

1. Identify the component's type (functional or class-based)
2. Choose the appropriate migration strategy
3. Add proper type definitions for parameters and return values
4. Replace direct DOM manipulation with DOM helpers
5. Adapt event handling with appropriate adapters
6. Test the component in isolation
7. Integrate with the rest of the application

## Examples

See the [component-migration-example.ts](./examples/component-migration-example.ts) file for complete examples of different migration approaches.

## Testing Migrated Components

After migration, test your components:

1. Verify TypeScript compilation without errors
2. Test rendering with different parameters
3. Test event handling with various events
4. Verify DOM interaction works correctly
5. Test integration with other components

## Best Practices

1. Maintain backward compatibility where possible
2. Add proper JSDoc documentation to new components
3. Keep component interfaces consistent
4. Split large components into smaller, focused ones
5. Use StandardComponentProps for consistent parameter handling

## Need Help?

If you encounter issues during migration, check:

- [TypeScript Migration Plan](../../../TypeScript-Migration-Plan.md)
- [UI Component Architecture](./ui-component-architecture.md)
- [DOM Helper Documentation](./dom-helpers.md)

Or contact the development team for assistance. 
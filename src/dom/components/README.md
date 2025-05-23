# OneiroMetrics UI Components

This directory contains UI components following the container/presentation pattern as defined in the 2025 refactoring plan. 

## Component Architecture

The UI components in OneiroMetrics follow a structured container/presentation pattern:

### 1. Presentation Components
- Handle rendering and direct user interactions
- Do not have direct dependencies on application state or services
- Receive data via props and notify of changes via callbacks
- Pure UI rendering logic - minimal business logic

### 2. Container Components
- Coordinate between application state and presentation components
- Connect to state, services, and handle business logic
- Set up event subscriptions and clean them up
- Pass data to presentation components and handle callbacks

## Directory Structure

Each component set is organized in its own directory:

```
components/
├── metrics-table/
│   ├── index.ts                  # Exports for the component
│   ├── MetricsTableContainer.ts  # Container component with business logic
│   ├── MetricsTableView.ts       # Presentation component for rendering
│   └── MetricsTableTypes.ts      # TypeScript types for the component
├── summary-view/
│   └── ... (similar structure)
├── filter-controls/
│   └── ... (similar structure)
├── expandable-content/
│   └── ... (similar structure)
├── BaseComponent.ts              # Base implementation of IComponent
├── IComponent.ts                 # Interface that all components implement
├── index.ts                      # Main exports
└── README.md                     # This documentation
```

## Common Patterns

### Component Lifecycle
1. **Construction**: Initialize component with required dependencies
2. **Render**: Called when the component needs to render to a container
3. **Update**: Called when the component's data changes
4. **Cleanup**: Called when the component is being removed

### Event Handling
- Container components subscribe to application events
- Presentation components use DOM events
- All event listeners should be cleaned up in the `cleanup()` method

### State Management
- Container components own and manage state
- State changes are pushed to presentation components via updates
- Presentation components don't modify state directly; they call callbacks

## Usage Example

```typescript
// In a plugin file
import { MetricsTableContainer } from './dom/components';

export class YourPlugin extends Plugin {
  onload() {
    // Create and render the component
    const container = document.createElement('div');
    this.metricsTable = new MetricsTableContainer(
      this.app, 
      container, 
      this.state
    );
    
    // Add it to the DOM
    document.body.appendChild(container);
  }
  
  onunload() {
    // Clean up the component
    if (this.metricsTable) {
      this.metricsTable.cleanup();
    }
  }
}
```

## Adding New Components

When creating a new component:

1. Create a new directory for your component group
2. Create Types, View, and Container files 
3. Export the components through an index.ts file
4. Update the main components/index.ts to expose the new components

Follow the existing patterns for consistency and maintainability. 
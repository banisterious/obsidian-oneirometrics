# Global Dependencies Map

## Overview

This document provides a comprehensive mapping of global dependencies in the OneiroMetrics plugin codebase. It serves as a reference for understanding the initialization sequence, component interactions, and refactoring opportunities. This map aligns with the architecture described in the [Architecture Overview](../architecture/overview.md) and [Architecture Specification](../architecture/specification.md).

## Core Global Variables

### Plugin State

| Variable | Type | Defined In | Initialized In | Used In | Notes |
|----------|------|------------|---------------|---------|-------|
| `globalLogger` | `LoggingAdapter` | main.ts | main.ts:onload | Throughout codebase | Initialized with safeLogger during early loading |
| `customDateRange` | `{ start: string, end: string } \| null` | main.ts | main.ts | Date filters, UI components | Used for date range filtering |
| `window.oneiroMetricsPlugin` | `DreamMetricsPlugin` | main.ts | main.ts:onload | Global functions, UI components | Exposes plugin instance to window for test access |

### Settings and Configuration

| Variable | Type | Defined In | Initialized In | Used In | Notes |
|----------|------|------------|---------------|---------|-------|
| `DreamMetricsPlugin.settings` | `DreamMetricsSettings` | main.ts | main.ts:loadSettings | Settings UI, scraping, metrics | Core configuration object |
| `DEFAULT_METRICS` | `DreamMetric[]` | types.ts | types.ts | Settings initialization | Default metrics configuration |
| `DEFAULT_LOGGING` | `LoggingConfig` | types.ts | types.ts | Logger initialization | Default logging configuration |
| `DEFAULT_JOURNAL_STRUCTURE_SETTINGS` | `JournalStructureSettings` | src/types/journal-check.ts | src/types/journal-check.ts | Journal structure initialization | Default journal structure |

### UI State

| Variable | Type | Defined In | Initialized In | Used In | Notes |
|----------|------|------------|---------------|---------|-------|
| `DreamMetricsPlugin.timeline` | `Timeline` | main.ts | main.ts:onload | Timeline visualization | Timeline state and configuration |
| `DreamMetricsPlugin.calendar` | `CalendarView` | main.ts | main.ts:onload | Calendar UI | Calendar state and configuration |
| `DreamMetricsPlugin.expandedStates` | `Set<string>` | main.ts | main.ts:onload | Content cells | Tracks expanded/collapsed state of content cells |

## Service Dependencies

### Core Services

| Service | Initialized In | Dependencies | Used By | Notes |
|---------|---------------|--------------|---------|-------|
| `DreamMetricsPlugin.logger` | main.ts:onload | settings | All components | Logging service for the entire plugin |
| `DreamMetricsPlugin.lintingEngine` | main.ts:onload | settings | Journal check, template wizard | Validates journal entries against templates |
| `DreamMetricsPlugin.templaterIntegration` | main.ts:onload | app | Template wizard, journal structure | Manages Templater plugin integration |
| `DreamMetricsPlugin.state` | main.ts:onload | settings, app | UI components, metrics processing | Central state management |

### Component Services

| Service | Initialized In | Dependencies | Used By | Notes |
|---------|---------------|--------------|---------|-------|
| `DreamMetricsPlugin.dreamJournalManager` | main.ts:onload | lintingEngine, settings, app | Journal UI, template wizard | Manages journal entry creation and validation |
| `DreamMetricsPlugin.dateNavigator` | main.ts:onload | app, settings | Date navigation UI | Manages date navigation and selection |
| `DreamMetricsPlugin.timeFilterManager` | main.ts:onload | app, settings | Filtering UI | Manages time-based filters |

## Initialization Sequence

The following diagram shows the current initialization sequence and dependencies between components:

```
1. Plugin Constructor
   |
   +--> 2. onload()
         |
         +--> 3. Initialize safeLogger (early logging)
         |
         +--> 4. loadSettings()
         |     |
         |     +--> Settings adapter utilities
         |
         +--> 5. Initialize core services
         |     |
         |     +--> logger (depends on settings)
         |     |
         |     +--> lintingEngine (depends on settings)
         |     |
         |     +--> state (depends on settings, app)
         |
         +--> 6. Initialize UI components
         |     |
         |     +--> dreamJournalManager (depends on lintingEngine, settings)
         |     |
         |     +--> dateNavigator (depends on app, settings)
         |     |
         |     +--> timeFilterManager (depends on app, settings)
         |
         +--> 7. Register event listeners
         |
         +--> 8. Register commands
         |
         +--> 9. Add ribbon icons
         |
         +--> 10. Initialize settings tab
```

## Dependency Graph

Below is a directed graph showing relationships between major components:

```
                           +----------------+
                           | DreamMetrics   |
                           | Plugin         |
                           +-------+--------+
                                   |
                                   v
        +---------------------+----+----+---------------------+
        |                     |         |                     |
        v                     v         v                     v
+-------+--------+   +--------+-------+ | +------------------+--+
| LoggingService  |   | SettingsManager| | | State Management   |
+----------------+   +----------------+ | +-------------------+ |
                                        |                       |
                                        v                       v
                        +---------------+-+     +---------------+-+
                        | UI Components   |     | Services         |
                        +-----------------+     +-----------------+
                           |         |             |          |
                           v         v             v          v
                    +------+---+ +---+-------+ +---+------+ +-+------------+
                    | Metrics  | | Content   | | Scraping | | Journal      |
                    | Tables   | | Cells     | | Engine   | | Structure    |
                    +----------+ +-----------+ +----------+ +--------------+
```

## Global Functions

The following global functions are defined outside of classes and accessed throughout the codebase:

| Function | Defined In | Used In | Dependencies | Notes |
|----------|------------|---------|--------------|-------|
| `getDreamEntryDate` | main.ts | Metrics processing | none | Extracts date from journal entries |
| `openCustomRangeModal` | main.ts | UI components | app | Opens date range selection modal |
| `saveLastCustomRange` | main.ts | Date filters | none | Saves custom date range |
| `loadLastCustomRange` | main.ts | Date filters | none | Loads saved custom date range |
| `forceApplyDateFilter` | main.ts | Date navigation | customDateRange | Applies date filter to metrics note |
| `applyCustomDateRangeFilter` | main.ts | Date filters | customDateRange | Applies custom date range filter |
| `updateFilterDisplay` | main.ts | UI components | none | Updates filter status display |
| `collectVisibleRowMetrics` | main.ts | Metrics tables | none | Collects metrics from visible table rows |
| `updateSummaryTable` | main.ts | Metrics tables | none | Updates the summary metrics table |
| `formatDateForDisplay` | main.ts | UI components | none | Formats dates for display |
| `toggleContentVisibility` | main.ts | Content cells | DreamMetricsPlugin.expandedStates | Toggles content cell expansion |
| `expandAllContentSections` | main.ts | UI components | none | Expands all content cells |

## Safe Access Patterns

To mitigate initialization order issues, the following safe access patterns have been implemented:

1. **Safe Logger System**
   - All early logging uses the `safeLogger` instance
   - The `globalLogger` is initialized with `safeLogger` first
   |
   +--> 4. loadSettings()
         |
         +--> Settings adapter utilities
         |
         +--> 5. Initialize core services
         |     |
         |     +--> logger (depends on settings)
         |     |
         |     +--> lintingEngine (depends on settings)
         |     |
         |     +--> state (depends on settings, app)
         |
         +--> 6. Initialize UI components
         |     |
         |     +--> dreamJournalManager (depends on lintingEngine, settings)
         |     |
         |     +--> dateNavigator (depends on app, settings)
         |     |
         |     +--> timeFilterManager (depends on app, settings)
         |
         +--> 7. Register event listeners
         |
         +--> 8. Register commands
         |
         +--> 9. Add ribbon icons
         |
         +--> 10. Initialize settings tab
```

## Dependency Graph

Below is a directed graph showing relationships between major components:

```
                           +----------------+
                           | DreamMetrics   |
                           | Plugin         |
                           +-------+--------+
                                   |
                                   v
        +---------------------+----+----+---------------------+
        |                     |         |                     |
        v                     v         v                     v
+-------+--------+   +--------+-------+ | +------------------+--+
| LoggingService  |   | SettingsManager| | | State Management   |
+----------------+   +----------------+ | +-------------------+ |
                                        |                       |
                                        v                       v
                        +---------------+-+     +---------------+-+
                        | UI Components   |     | Services         |
                        +-----------------+     +-----------------+
                           |         |             |          |
                           v         v             v          v
                    +------+---+ +---+-------+ +---+------+ +-+------------+
                    | Metrics  | | Content   | | Scraping | | Journal      |
                    | Tables   | | Cells     | | Engine   | | Structure    |
                    +----------+ +-----------+ +----------+ +--------------+
```

## Global Functions

The following global functions are defined outside of classes and accessed throughout the codebase:

| Function | Defined In | Used In | Dependencies | Notes |
|----------|------------|---------|--------------|-------|
| `getDreamEntryDate` | main.ts | Metrics processing | none | Extracts date from journal entries |
| `openCustomRangeModal` | main.ts | UI components | app | Opens date range selection modal |
| `saveLastCustomRange` | main.ts | Date filters | none | Saves custom date range |
| `loadLastCustomRange` | main.ts | Date filters | none | Loads saved custom date range |
| `forceApplyDateFilter` | main.ts | Date navigation | customDateRange | Applies date filter to metrics note |
| `applyCustomDateRangeFilter` | main.ts | Date filters | customDateRange | Applies custom date range filter |
| `updateFilterDisplay` | main.ts | UI components | none | Updates filter status display |
| `collectVisibleRowMetrics` | main.ts | Metrics tables | none | Collects metrics from visible table rows |
| `updateSummaryTable` | main.ts | Metrics tables | none | Updates the summary metrics table |
| `formatDateForDisplay` | main.ts | UI components | none | Formats dates for display |
| `toggleContentVisibility` | main.ts | Content cells | DreamMetricsPlugin.expandedStates | Toggles content cell expansion |
| `expandAllContentSections` | main.ts | UI components | none | Expands all content cells |

## Safe Access Patterns

To mitigate initialization order issues, the following safe access patterns have been implemented:

1. **Safe Logger System**
   - All early logging uses the `safeLogger` instance
   - The `globalLogger` is initialized with `safeLogger` first
   - The logger adapter provides fallback mechanisms
   - Completed and documented in `src/logging/index.ts`

2. **Defensive Date Utilities**
   - Date utilities have been refactored with defensive coding
   - All functions handle null, undefined, and invalid inputs
   - Validation and fallback mechanisms are in place
   - Completed and documented in `src/utils/date-utils.ts`

## Recommended Dependency Improvements

Based on the architecture and current dependency patterns, the following improvements are recommended:

1. **Service Registry Pattern**
   - Implement the service registry pattern described in the Architecture Specification
   - Replace direct references to global services with registry lookups
   - Add fallback mechanisms for missing services
   - Example implementation:

```typescript
// Create a service registry
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, any> = new Map();
  
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }
  
  public register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }
  
  public get<T>(name: string): T | null {
    return this.services.get(name) || null;
  }
}
```

2. **Component Interface Definitions**
   - Define clear interfaces for each component
   - Document required dependencies and initialization requirements
   - Use these interfaces to enforce dependency contracts
   - Example:

```typescript
export interface LoggingService {
  log(category: string, message: string, ...data: any[]): void;
  warn(category: string, message: string, ...data: any[]): void;
  error(category: string, message: string, error?: Error): void;
  debug(category: string, message: string, ...data: any[]): void;
}

export interface LoggingServiceDependencies {
  settings: Pick<DreamMetricsSettings, 'logging'>;
  app: App;
}
```

3. **Initialization Phase Management**
   - Implement explicit initialization phases
   - Ensure dependencies are initialized in the correct order
   - Add validation checks before accessing dependencies
   - Example:

```typescript
export enum InitPhase {
  EARLY = 'early',
  CORE_SERVICES = 'core_services',
  UI_COMPONENTS = 'ui_components',
  COMMANDS = 'commands',
  COMPLETE = 'complete'
}

export class InitializationManager {
  private currentPhase: InitPhase = InitPhase.EARLY;
  private phaseListeners: Map<InitPhase, Array<() => Promise<void>>> = new Map();
  
  public async advanceTo(phase: InitPhase): Promise<void> {
    if (this.phaseOrder.indexOf(phase) <= this.phaseOrder.indexOf(this.currentPhase)) {
      return; // Already at or past this phase
    }
    
    // Execute all phase listeners
    const listeners = this.phaseListeners.get(phase) || [];
    await Promise.all(listeners.map(listener => listener()));
    
    this.currentPhase = phase;
  }
  
  public onPhase(phase: InitPhase, listener: () => Promise<void>): void {
    if (!this.phaseListeners.has(phase)) {
      this.phaseListeners.set(phase, []);
    }
    this.phaseListeners.get(phase)!.push(listener);
  }
  
  private phaseOrder = [
    InitPhase.EARLY,
    InitPhase.CORE_SERVICES,
    InitPhase.UI_COMPONENTS,
    InitPhase.COMMANDS,
    InitPhase.COMPLETE
  ];
}
```

## Conclusion

This global dependencies map provides a comprehensive overview of the current state of dependencies in the OneiroMetrics plugin. By understanding these dependencies, we can implement the improvements outlined in the Post-Refactoring Roadmap in a way that maintains plugin functionality while improving code maintainability and reliability.

The safe logger implementation and defensive date utilities are significant steps toward a more robust architecture. The next logical steps are implementing the service registry pattern and defining clear component interfaces to further reduce dependency on global state.

For further details on the implementation plan, refer to the [Post-Refactoring Roadmap](./post-refactoring-roadmap.md) and [Refactoring Lessons Learned](./refactoring-lessons-learned.md) documents. 
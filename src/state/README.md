# State Management System

The OOM plugin uses a unidirectional data flow state management pattern, similar to Redux but lighter weight and tailored to the Obsidian plugin environment.

## Core Components

### Base State System

The state management system is built on several key components:

- **ObservableState**: Base implementation of the observable pattern
- **MutableState**: Extension of observable state with methods for state updates
- **StateSelector**: Component for selecting specific parts of state
- **SelectorObservable**: Observable for specific state slices

### Domain-Specific State

- **MetricsState**: Application-specific state for metrics data
- **MetricsStateAdapter**: Adapter for backward compatibility with legacy code

### Persistence

- **LocalStoragePersistence**: Persists state to localStorage (for development)
- **ObsidianStorageAdapter**: Persists state using Obsidian's data API

### Migration Utilities

- **SettingsMigratorV1toV2**: Migrates settings from v1 to v2 format
- **LegacySettingsToStateConverter**: Converts legacy settings to new state format
- **DataBackupService**: Provides backup and restore functionality for user data

## Directory Structure

```
src/state/
├── interfaces/         # Core interfaces
│   ├── IObservableState.ts
│   ├── IMutableState.ts
│   ├── IStatePersistence.ts
│   ├── IStateSelector.ts
│   └── index.ts
├── core/              # Core implementations
│   ├── ObservableState.ts
│   ├── MutableState.ts
│   ├── StateSelector.ts
│   ├── SelectorObservable.ts
│   ├── LocalStoragePersistence.ts
│   └── index.ts
├── adapters/          # Backward compatibility
│   ├── ObsidianStorageAdapter.ts
│   ├── MetricsStateAdapter.ts
│   ├── SettingsMigrator.ts
│   ├── DataBackupService.ts
│   └── index.ts
├── metrics/           # Domain-specific state
│   ├── interfaces/
│   │   ├── IMetricsState.ts
│   │   └── index.ts
│   ├── MetricsState.ts
│   └── index.ts
├── index.ts           # Public exports
└── README.md          # This file
```

## Migration Guide

When migrating from the old `DreamMetricsState` to the new state management system:

1. Replace constructor calls to `DreamMetricsState` with `MetricsStateAdapter`:

```typescript
// Old code
const state = new DreamMetricsState(settings);

// New code
const stateAdapter = new MetricsStateAdapter(settings);
```

2. For new UI components, use the new `MetricsState` directly:

```typescript
// Create a metrics state instance
const metricsState = new MetricsState(initialState);

// Subscribe to state changes
const unsubscribe = metricsState.subscribe(state => {
  // Update UI based on new state
});
```

3. Use selectors for observing specific parts of state:

```typescript
// Create a selector for metrics
const metricsSelector = new StateSelector<IMetricsState, Record<string, DreamMetric>>(
  state => state.metrics
);

// Create an observable for the selected state
const metricsObservable = metricsSelector.observe(metricsState);

// Subscribe to changes in the metrics only
const unsubscribe = metricsObservable.subscribe(metrics => {
  // Update UI with new metrics
});
```

## Settings Migration

The plugin now supports automatic migration of settings between versions:

1. When loading settings, we check for outdated formats:

```typescript
async loadSettings(): Promise<void> {
  const data = await this.loadData();
  const migrators = [new SettingsMigratorV1toV2()];
  
  let settings = data || {};
  
  // Check if migration is needed
  for (const migrator of migrators) {
    if (migrator.canMigrate(settings)) {
      // Backup original settings
      await this.backupService.backupSettings(settings);
      
      // Apply migration
      settings = migrator.migrate(settings);
    }
  }
  
  this.settings = settings;
}
```

2. The settings are automatically backed up before migration:

```typescript
async backupSettings(settings: any): Promise<void> {
  // Create timestamped backup file
  // ...
}
```

3. If problems occur, settings can be restored from backup:

```typescript
async restoreFromBackup(backupId?: string): Promise<any | null> {
  // Restore settings from backup file
  // ...
}
```

## Best Practices

1. **Keep state normalized**: Avoid deeply nested state objects.
2. **Use selectors**: Create selectors that select only the specific parts of state a component needs.
3. **Subscribe judiciously**: Unsubscribe when components are unmounted.
4. **Use the appropriate update method**: Use `setState` for simple updates, `updateState` for updates that depend on the current state.
5. **Persist state only when necessary**: Don't persist transient UI state. 
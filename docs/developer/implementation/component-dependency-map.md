# OneiroMetrics Component Dependency Map

This document maps the dependencies between major components identified in the component inventory. Understanding these dependencies is critical for planning the extraction order during refactoring.

## Core Components and Their Dependencies

### 1. DreamMetricsPlugin (main.ts)
- **Depends on:**
  - DreamMetricsSettingTab (settings.ts)
  - LintingEngine (src/journal_check/LintingEngine.ts)
  - TemplaterIntegration (src/journal_check/TemplaterIntegration.ts)
  - TimeFilterManager (src/timeFilters.ts)
  - DateNavigatorIntegration (src/dom/DateNavigatorIntegration.ts)
  - Logger (utils/logger.ts)
  - DreamMetricsState (src/state/DreamMetricsState.ts)
  - Various modal classes (OneiroMetricsModal, ConfirmModal, etc.)
  - Utility functions (processDreamContent, processMetrics, etc.)

### 2. OneiroMetricsModal (main.ts)
- **Depends on:**
  - DreamMetricsPlugin (main.ts)
  - autocomplete.ts functions

### 3. ConfirmModal (main.ts)
- **Depends on:**
  - No significant dependencies, just Obsidian Modal API

### 4. DreamJournalManager (src/journal_check/ui/DreamJournalManager.ts)
- **Depends on:**
  - DreamMetricsPlugin (main.ts)
  - TemplaterIntegration (src/journal_check/TemplaterIntegration.ts)
  - TemplateWizard (src/journal_check/ui/TemplateWizard.ts)
  - autocomplete.ts functions

### 5. LintingEngine (src/journal_check/LintingEngine.ts)
- **Depends on:**
  - DreamMetricsPlugin (main.ts)
  - ContentParser (src/journal_check/ContentParser.ts)
  - TemplaterIntegration (src/journal_check/TemplaterIntegration.ts)

### 6. DateNavigatorModal (src/dom/DateNavigatorModal.ts)
- **Depends on:**
  - DateNavigator (src/dom/DateNavigator.ts)
  - DreamMetricsState (src/state/DreamMetricsState.ts)
  - DateNavigatorIntegration (src/dom/DateNavigatorIntegration.ts)
  - TimeFilterManager (src/timeFilters.ts)

### 7. DreamMetricsState (src/state/DreamMetricsState.ts)
- **Depends on:**
  - Types from types.ts
  - No other component dependencies

### 8. autocomplete.ts
- **Depends on:**
  - Obsidian API
  - No other component dependencies

## Dependency Graph Visualization

```
DreamMetricsPlugin
├── DreamMetricsSettingTab
├── LintingEngine
│   ├── ContentParser
│   └── TemplaterIntegration
├── TimeFilterManager
├── DateNavigatorIntegration
│   ├── DateNavigator
│   └── DreamMetricsState
├── Logger
├── OneiroMetricsModal
│   └── autocomplete.ts functions
├── ConfirmModal
├── DreamJournalManager
│   ├── TemplaterIntegration
│   ├── TemplateWizard
│   └── autocomplete.ts functions
└── Various utility functions
    ├── processDreamContent
    ├── processMetrics
    └── Others
```

## Circular Dependencies

Several circular dependencies exist in the current architecture:

1. **DreamMetricsPlugin ↔ LintingEngine:** LintingEngine takes a plugin reference in its constructor.
2. **DreamMetricsPlugin ↔ DreamJournalManager:** DreamJournalManager takes a plugin reference.
3. **DreamMetricsPlugin ↔ OneiroMetricsModal:** OneiroMetricsModal takes a plugin reference and the plugin uses the modal.

These circular dependencies will need to be resolved during refactoring, likely by:
1. Implementing proper dependency injection
2. Creating interfaces to break circular dependencies
3. Using event-based communication instead of direct references

## Recommended Extraction Order

Based on the dependency analysis, the following extraction order minimizes refactoring complexity:

### Phase 1: Low-Dependency Components
1. **DreamMetricsState** (src/state/DreamMetricsState.ts)
2. **autocomplete.ts** functions
3. **ContentParser** (src/journal_check/ContentParser.ts)
4. **Logger** (utils/logger.ts)
5. **ConfirmModal** → src/dom/modals/ConfirmModal.ts

### Phase 2: Utility Extraction
1. **Utility functions** from main.ts:
   - Content processing → src/parsing/ContentProcessor.ts
   - Metrics processing → src/metrics/MetricsService.ts
   - Date utilities → src/utils/DateUtils.ts
   - Project note generation → src/dom/tables/TableGenerator.ts
   - Backup operations → src/file-ops/BackupService.ts

### Phase 3: UI Components
1. **OneiroMetricsModal** → src/dom/modals/ScrapeModal.ts
2. **DateNavigator** components
3. **TemplateWizard** refactoring

### Phase 4: Core Services
1. **LintingEngine** → src/journal_check/JournalStructureValidator.ts
2. **TimeFilterManager** → src/filters/DateFilterManager.ts
3. **TemplaterIntegration** improvements

### Phase 5: Main Plugin Refactoring
1. **DreamMetricsPlugin** core refactoring

## Implementation Notes

When implementing this extraction plan:

1. **Create interfaces first:** Define interfaces for components before extraction to maintain compatibility
2. **Use adapter pattern:** Create adapters for existing code to minimize changes to dependent components
3. **Incremental testing:** Test each extracted component thoroughly before moving to the next
4. **Maintain backward compatibility:** Ensure all existing functionality continues to work after each extraction
5. **Document dependencies:** Update this dependency map as components are extracted
6. **Focus on breaking circular dependencies:** Prioritize architectural improvements that eliminate circular references 
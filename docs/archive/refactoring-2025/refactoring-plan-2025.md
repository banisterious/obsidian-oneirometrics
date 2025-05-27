# Refactoring Plan 2025

## May 2025 Update - Post-Refactoring Progress

As of May 23, 2025, we've completed the major refactoring effort and have moved into the post-refactoring phase. Our primary focus is now on resolving the remaining TypeScript errors and consolidating our type system.

### Backed Up Classes

The following classes have been backed up during the refactoring process. These classes were identified as unused or deprecated but preserved in backup files for reference if needed:

| Class Name | Original Location | Backup Location | Removal Date | Status | Notes |
|------------|------------------|-----------------|--------------|--------|-------|
| OneiroMetricsModal | main.ts | src/dom/modals/OneiroMetricsModal.bak.ts | June 2025 | Removed | Replaced by DreamJournalManager and direct calls to scrapeMetrics |
| ConfirmModal | main.ts | src/dom/modals/ConfirmModal.bak.ts | June 2025 | Removed | Generic confirmation dialog that was defined but not actually used in the codebase |

### Recent Progress Update (May 24)

Today we implemented key fixes to address TypeScript errors:

- ✅ **Fixed DreamMetricsSettings Interface**: Updated interface in core.ts to include all required properties like expandedStates, uiState, and developerMode
- ✅ **Implemented Missing Helper Functions**: Added getCompatibleSelectionMode to selection-mode-helpers.ts
- ✅ **Enhanced Type Adapters**: Updated type-adapters.ts to properly handle additional properties in settings
- ✅ **Added Safe Property Access Functions**: Created additional helper functions for safe property access
- ✅ **Fixed DreamMetricsState Constructor**: Updated to accept optional settings parameter with default values
- ✅ **Fixed TemplaterIntegration Constructor**: Updated to accept all three parameters (app, plugin, settings)
- ✅ **Fixed TemplateWizard Constructor**: Updated to handle optional templaterIntegration parameter
- ✅ **Fixed DateNavigatorView Constructor**: Updated to accept optional plugin parameter
- ✅ **Fixed DateNavigatorIntegration Constructor**: Updated to handle multiple constructor patterns

Type error count has decreased from ~149 to ~75, with major fixes in interface compatibility and constructor parameter mismatches. All constructor parameter count mismatches have been resolved.

### Architecture Documentation Updates Needed

The adapter utilities and patterns we've implemented during this refactoring process have become permanent parts of our architecture. These components provide important abstraction layers and type safety mechanisms that should be properly documented. We need to update the architectural documentation with:

1. **Type Adapter Layer**
   - Document the `type-adapters.ts` as a permanent architectural component
   - Explain its role in bridging different interface versions and ensuring type safety
   - Provide examples of how to use these adapters when accessing properties

2. **Helper Utilities**
   - Add `settings-helpers.ts`, `metric-helpers.ts`, and `selection-mode-helpers.ts` to architecture diagrams
   - Document the standard patterns for property access through these utilities
   - Update code style guidelines to mandate using these helpers for property access

3. **Flexible Constructor Patterns**
   - Document the new constructor patterns that allow multiple initialization methods
   - Provide examples of the plugin-based initialization pattern
   - Explain how optional parameters and default values should be handled

4. **Interface Compatibility Layer**
   - Document the strategy for maintaining compatible interfaces
   - Explain the relationship between types in root directory and src/types/core

These documentation updates should be completed by June 15, 2025 to ensure that all developers have clear guidance on these new architectural patterns.

### Post-Refactoring Achievements

1. **Type System Improvements**:
   - Created adapter utilities in type-adapters.ts to bridge legacy and new type systems
   - Implemented helper functions for safe property access
   - Added proper type guards for source property handling
   - Fixed ContentParser implementation with comprehensive error handling

2. **UI & Testing Improvements**:
   - Enhanced TestRunner to support both synchronous and asynchronous tests
   - Improved UI components with better typing
   - Fixed DOM rendering performance issues
   - Implemented proper error handling in UI components

3. **Documentation**:
   - Created comprehensive TypeScript error documentation
   - Established a clear plan for addressing remaining type issues
   - Updated migration status tracking

### Current Status

- **Major Components Refactored**: ✅ Complete
- **Type System Consolidation**: 🔄 In Progress (80% complete)
- **TypeScript Errors**: ~75 errors (down from ~149)
- **Test Coverage**: Maintained at 87%

### Next Steps

1. **Fix Constructor Parameter Mismatches** (Immediate Priority):
   - Fix parameter mismatches in:
     - DreamMetricsState constructor
     - TemplaterIntegration constructor
     - TemplateWizard constructor
     - DateNavigatorView constructor
     - DateNavigatorIntegration constructor

2. **Update Core Files** (High Priority):
   - Fix main.ts and settings.ts using adapter utilities
   - Update component implementations with proper typing
   - Replace direct property access with helper functions

3. **Complete Testing System** (Medium Priority):
   - Fix testing module imports
   - Update test files to use the new type system

See the [typescript-issues-next-steps.md](./typescript-issues-next-steps.md) document for a detailed plan on addressing the remaining TypeScript errors.

## Original Refactoring Plan (January 2025)

# OneiroMetrics Refactoring Plan (May 2025)

## Table of Contents

- [Current State Assessment](#current-state-assessment)
- [Refactoring Goals](#refactoring-goals)
- [Phase 1: Preparation and Planning](#phase-1-preparation-and-planning-1-week)
  - [1.1 Create Component Inventory](#11-create-component-inventory)
  - [1.2 Define New Architecture](#12-define-new-architecture)
  - [1.3 Set Up Testing Infrastructure](#13-set-up-testing-infrastructure)
  - [1.4 Dependency Analysis Strategy](#14-dependency-analysis-strategy)
- [Phase 2: Core Infrastructure Refactoring](#phase-2-core-infrastructure-refactoring-2-weeks)
  - [2.1 Extract Core Services](#21-extract-core-services)
  - [2.2 Reorganize Modal Components](#22-reorganize-modal-components)
  - [2.3 Refactor State Management](#23-refactor-state-management)
  - [2.4 Backward Compatibility Approach](#24-backward-compatibility-approach)
- [Phase 3: Feature Module Extraction](#phase-3-feature-module-extraction-3-weeks)
  - [3.1 Dream Journal Analysis](#31-dream-journal-analysis)
  - [3.2 Template System](#32-template-system)
  - [3.3 UI Components](#33-ui-components)
  - [3.4 Data Processing Pipeline](#34-data-processing-pipeline)
  - [3.5 Component Extraction Order](#35-component-extraction-order)
  - [3.6 CSS Refactoring](#36-css-refactoring)
- [Phase 4: Main Plugin Refactoring](#phase-4-main-plugin-refactoring-1-week)
  - [4.1 Rebuild Main Plugin Class](#41-rebuild-main-plugin-class)
  - [4.2 Command Registration](#42-command-registration)
  - [4.3 Settings Management](#43-settings-management)
- [Phase 5: Testing and Finalization](#phase-5-testing-and-finalization-2-weeks)
  - [5.1 Unit Testing](#51-unit-testing)
  - [5.2 Performance Optimization](#52-performance-optimization)
  - [5.3 Documentation](#53-documentation)
  - [5.4 Regression Testing Strategy](#54-regression-testing-strategy)
- [Implementation Strategy](#implementation-strategy)
  - [Incremental Approach](#incremental-approach)
  - [Modular Structure](#modular-structure)
  - [Testing Guidelines](#testing-guidelines)
  - [Version Control Strategy](#version-control-strategy)
  - [Documentation Approach](#documentation-approach)
  - [Feature Management During Refactoring](#feature-management-during-refactoring)
- [Timeline and Milestones](#timeline-and-milestones)
  - [Release Strategy](#release-strategy)
- [Risk Assessment](#risk-assessment)
  - [Potential Challenges](#potential-challenges)
  - [Mitigation Strategies](#mitigation-strategies)
  - [User Impact Management](#user-impact-management)
- [Implementation Examples](#implementation-examples)
  - [Example 1: Modal Extraction](#example-1-modal-extraction)
  - [Example 2: Metrics Service Extraction](#example-2-metrics-service-extraction)
  - [Example 3: Further Extraction Strategies](#example-3-further-extraction-strategies)
- [Pre-Implementation Questions](#pre-implementation-questions)
  - [Q1: Technical Dependencies](#q1-technical-dependencies)
  - [Q2: Backward Compatibility Strategy](#q2-backward-compatibility-strategy)
  - [Q3: Feature Freeze Requirements](#q3-feature-freeze-requirements)
  - [Q4: User Impact Assessment](#q4-user-impact-assessment)
  - [Q5: Incremental Deployment Strategy](#q5-incremental-deployment-strategy)
  - [Q6: Extraction Priorities](#q6-extraction-priorities)
  - [Q7: Test Coverage Requirements](#q7-test-coverage-requirements)
  - [Q8: Version Control Strategy](#q8-version-control-strategy)
  - [Q9: Regression Testing Approach](#q9-regression-testing-approach)
  - [Q10: Documentation Update Plan](#q10-documentation-update-plan)
- [Conclusion](#conclusion)

## Current State Assessment

As of May 22, 2025, the OneiroMetrics plugin has several architectural issues that need to be addressed:

1. **Monolithic Main File**: The `main.ts` file is 3,757 lines long, making it difficult to maintain, understand, and extend.
2. **Poor Code Organization**: Despite having a modular directory structure, too much functionality remains in the main file.
3. **Mixed Responsibilities**: The main plugin class handles UI rendering, data processing, event handling, and business logic.
4. **Complex Modal Logic**: Modal implementations are embedded in the main file rather than in dedicated components.
5. **Limited Testability**: Tightly coupled code makes it difficult to write unit tests for individual components.

> **Note:** This refactoring plan implements the architectural decisions documented in [Architecture Decisions](./architecture-decisions.md). Please refer to that document for the rationale behind key architectural choices.

## Refactoring Goals

1. Reduce `main.ts` to less than 500 lines
2. Improve code organization and maintainability
3. Establish clear separation of concerns
4. Strengthen type safety and error handling
5. Enable better testability of components
6. Preserve all existing functionality and user experience

## Phase 1: Preparation and Planning (1 week)

### 1.1 Create Component Inventory
- Identify all classes, functions, and logical groups in `main.ts`
- Map their dependencies and relationships
- Document external API dependencies

#### 1.1.1 TypeScript File Inventory

The following inventory captures all significant TypeScript files in the codebase along with their purpose:

| File Name | Location | Line Count | Description |
|-----------|----------|------------|-------------|
| main.ts | Root | 3,572 | Main plugin file containing most functionality |
| JournalStructureModal.ts | src/journal_check/ui | 928 | UI for displaying and editing journal structure |
| TemplateWizard.ts | src/journal_check/ui | 868 | Wizard interface for template creation and management |
| DreamJournalManager.ts | src/journal_check/ui | 855 | Manages dream journal entry workflows |
| DateNavigator.ts | src/dom | 732 | Date selection and navigation interface component |
| LintingEngine.ts | src/journal_check | 511 | Analyzes and validates journal entries structure |
| DateNavigatorModal.ts | src/dom | 437 | Modal dialog for date navigation interface |
| TemplaterIntegration.ts | src/journal_check | 367 | Integration with Templater plugin |
| CustomDateRangeModal.ts | src | ~330 | Modal for selecting custom date ranges |
| autocomplete.ts | Root | 317 | File and folder autocomplete utilities for UI components |
| DreamMetricsEvents.ts | src/events | 317 | Event handling for metrics-related operations |
| TestModal.ts | src/journal_check/ui | 309 | Modal dialog for test operations |
| timeFilters.ts | src | ~270 | Date-based filtering system (day/week/month granularity) |
| DateNavigatorView.ts | src/dom | ~300 | Rendering logic for date navigator component |
| DateNavigatorIntegration.ts | src/dom | ~250 | Integration of date navigator with other components |
| DreamMetricsDOM.ts | src/dom | ~200 | DOM manipulation utilities for metrics display |
| DateRangeFilter.ts | src/filters | ~180 | Filter implementation for date range selections |
| ContentParser.ts | src/journal_check | ~150 | Parses journal content into structured data |
| DreamMetricsProcessor.ts | src/metrics | 129 | Processes and analyzes dream metrics data |
| logger.ts | utils | 108 | Logging system with file rotation and log levels |
| types.ts | Root | ~120 | Core type definitions used throughout the plugin |
| settings.ts | Root | ~100 | Plugin settings definitions and management |
| DreamMetricsState.ts | src/state | 71 | State management for dream metrics data |
| FilterManager.ts | src | 73 | Manages filter state and date range selection |
| constants.ts | src | 24 | Default metrics and logging configuration |
| types.ts | src | 52 | Type definitions specific to the src modules |
| events.ts | src | 16 | Singleton event bus for application-wide events |

Additionally, the following CSS files require refactoring:

| File Name | Location | Line Count | Description | Refactoring Needed |
|-----------|----------|------------|-------------|-------------------|
| DateNavigatorStyles.css | src/dom | ~507 | Date navigator component styles | Should be consolidated into styles.css |

This inventory highlights multiple candidates for refactoring beyond the main.ts file, particularly UI components with high line counts that would benefit from further modularization.

#### 1.1.2 Specific Naming Improvements 

During refactoring, several files should be renamed to better reflect their purpose:

1. **timeFilters.ts → dateFilters.ts**: The current name suggests time-based filtering (hours, minutes, seconds), but the file actually handles date-based filtering (days, weeks, months) without time components. Along with the file rename, these related changes should be made:
   - `TimeFilter` interface → `DateFilter`
   - `TimeFilterManager` class → `DateFilterManager`
   - `TIME_FILTERS` constant → `DATE_FILTERS`
   - Any related method names should use "date" terminology instead of "time"

These naming improvements will provide better clarity about each component's purpose and align with existing naming patterns like DateNavigator and DateRangeFilter.

### 1.2 Define New Architecture
- Establish module boundaries and interfaces
- Create folder structure for new modules
- Define communication patterns between modules

### 1.3 Set Up Testing Infrastructure
- Choose testing framework and approach
- Set up basic test harness
- Create initial smoke tests for critical paths

### 1.4 Dependency Analysis Strategy

Based on our pre-implementation analysis, we will use a hybrid approach with initial manual dependency mapping supplemented by a lightweight Obsidian-specific analysis tool:

- Begin with a manual high-level dependency map of the main components
- Develop a simple script to scan for Obsidian API usage patterns
- Maintain a living document of component dependencies
- Use this dependency map to validate extraction order decisions

This approach combines human insight with automated detection while accounting for Obsidian-specific patterns that generic tools might miss.

## Phase 2: Core Infrastructure Refactoring (2 weeks)

### 2.1 Extract Core Services
- Move the following to dedicated service modules:
  - Metrics processing (`src/metrics/`)
  - Content parsing (`src/parsing/`)
  - File operations (`src/file-operations/`)
  - Event management (`src/events/`)
  - Logging system (`src/logging/`)

#### 2.1.1 Interface Design Implementation

To break circular dependencies and improve component isolation, we will implement a TypeScript interface-based approach:

1. **Component Interface Creation**
   - Define interfaces for each major component:
     ```typescript
     // Example: Metrics Service Interface
     export interface IMetricsService {
       processMetrics(text: string): Record<string, number[]>;
       calculateSummaryStatistics(metrics: Record<string, number[]>): SummaryStats;
       generateMetricsTable(metrics: Record<string, number[]>): HTMLElement;
     }
     
     // Example: Content Processor Interface
     export interface IContentProcessor {
       processDreamContent(content: string): string;
       extractMetricsFromText(text: string): Record<string, number[]>;
       sanitizeContent(content: string): string;
     }
     ```

2. **Plugin API Interface**
   - Extract a plugin interface that exposes only necessary methods:
     ```typescript
     export interface IPluginAPI {
       // Settings access
       getSettings(): PluginSettings;
       saveSettings(): Promise<void>;
       
       // File access
       getActiveFile(): TFile | null;
       getFilePath(file: TFile): string;
       
       // UI access
       createNotice(message: string, timeout?: number): void;
       
       // Event handling
       registerEvent(event: EventRef): void;
     }
     ```

3. **Dependency Direction**
   - Update components to depend on interfaces rather than concrete implementations:
     ```typescript
     // Before:
     constructor(plugin: DreamMetricsPlugin) {
       this.plugin = plugin;
     }
     
     // After:
     constructor(pluginApi: IPluginAPI, metricsService: IMetricsService) {
       this.pluginApi = pluginApi;
       this.metricsService = metricsService;
     }
     ```

4. **Circular Dependency Breaking**
   - Focus first on breaking the highest-priority circular dependencies:
     - Plugin → Modal → Plugin
     - State → UI Components → State
     - Content Processor → Metrics Service → Content Processor

5. **Implementation Order**
   - Define all interfaces first, before implementation
   - Implement one service at a time, with tests
   - Update dependent components to use the new interfaces
   - Verify correct operation after each component is updated

#### 2.1.2 Event Communication System Implementation

To improve component communication while maintaining separation of concerns, we will implement typed event emitters for specific functional areas:

1. **Base Event Emitter with Type Safety**
   - Create a generic event emitter base class:
     ```typescript
     export type EventListener<T> = (payload: T) => void;
     
     export class EventEmitter<EventMap extends Record<string, any>> {
       private listeners: {
         [K in keyof EventMap]?: Array<EventListener<EventMap[K]>>;
       } = {};
       
       on<K extends keyof EventMap>(
         event: K, 
         listener: EventListener<EventMap[K]>
       ): () => void {
         if (!this.listeners[event]) {
           this.listeners[event] = [];
         }
         
         this.listeners[event]?.push(listener);
         
         return () => this.off(event, listener);
       }
       
       off<K extends keyof EventMap>(
         event: K, 
         listener: EventListener<EventMap[K]>
       ): void {
         if (!this.listeners[event]) return;
         
         this.listeners[event] = this.listeners[event]?.filter(
           l => l !== listener
         ) as any;
       }
       
       emit<K extends keyof EventMap>(
         event: K, 
         payload: EventMap[K]
       ): void {
         if (!this.listeners[event]) return;
         
         this.listeners[event]?.forEach(listener => {
           try {
             listener(payload);
           } catch (error) {
             console.error(`Error in event listener for ${String(event)}:`, error);
           }
         });
       }
       
       clear(): void {
         this.listeners = {};
       }
     }
     ```

2. **Specific Event Types and Payloads**
   - Define event types for each functional area:
     ```typescript
     // Metrics events
     export interface MetricsEvents {
       'metrics:calculated': { metrics: Record<string, number[]>, source: string };
       'metrics:display': { target: HTMLElement, metrics: Record<string, number[]> };
       'metrics:filter': { filter: MetricsFilter };
     }
     
     // UI events
     export interface UIEvents {
       'ui:modalOpened': { modalType: string, modal: Modal };
       'ui:modalClosed': { modalType: string };
       'ui:viewChanged': { view: string, previousView: string };
     }
     
     // Journal events
     export interface JournalEvents {
       'journal:entryProcessed': { path: string, date: string, content: string };
       'journal:entryFailed': { path: string, error: Error };
       'journal:scanCompleted': { totalEntries: number, processedEntries: number };
     }
     ```

3. **Functional Area Event Emitters**
   - Implement specific emitters for each area:
     ```typescript
     export class MetricsEventEmitter extends EventEmitter<MetricsEvents> {
       // Specific methods for metrics events if needed
       notifyMetricsCalculated(metrics: Record<string, number[]>, source: string): void {
         this.emit('metrics:calculated', { metrics, source });
       }
     }
     
     export class UIEventEmitter extends EventEmitter<UIEvents> {
       // UI-specific methods
     }
     
     export class JournalEventEmitter extends EventEmitter<JournalEvents> {
       // Journal-specific methods
     }
     ```

4. **Subscription Management**
   - Add proper subscription cleanup to prevent memory leaks:
     ```typescript
     // Example usage in a component
     export class MetricsVisualization {
       private subscriptions: Array<() => void> = [];
       
       constructor(private metricsEvents: MetricsEventEmitter) {
         // Subscribe to events
         this.subscriptions.push(
           metricsEvents.on('metrics:calculated', this.handleMetricsCalculated.bind(this))
         );
       }
       
       // Clean up subscriptions when component is destroyed
       destroy(): void {
         this.subscriptions.forEach(unsubscribe => unsubscribe());
         this.subscriptions = [];
       }
       
       private handleMetricsCalculated(payload: MetricsEvents['metrics:calculated']): void {
         // Handle the event
       }
     }
     ```

5. **Event Documentation**
   - Document all events and their payloads for developer reference:
     ```typescript
     /**
      * Event: metrics:calculated
      * Emitted when metrics have been calculated from dream journal entries.
      * 
      * Payload:
      * - metrics: Record<string, number[]> - The calculated metrics data
      * - source: string - Source of the metrics (e.g., "manual", "scheduled")
      * 
      * Usage:
      * metricsEvents.on('metrics:calculated', ({metrics, source}) => {
      *   // Handle newly calculated metrics
      * });
      */
     ```

#### 2.1.3 Error Handling Implementation

To standardize error handling across components, we will implement error bubbling with context enrichment:

1. **Error Context Interface**
   - Create a standard interface for adding metadata to errors:
     ```typescript
     export interface ErrorContext {
       component: string;
       operation: string;
       timestamp: number;
       metadata?: Record<string, any>;
     }
     
     export interface EnrichedError extends Error {
       context?: ErrorContext;
       originalError?: Error;
     }
     ```

2. **Error Wrapping Utilities**
   - Implement utility functions for wrapping errors with context:
     ```typescript
     export function enrichError(
       error: Error, 
       context: Partial<ErrorContext>
     ): EnrichedError {
       const enriched = error as EnrichedError;
       enriched.context = {
         component: context.component || 'unknown',
         operation: context.operation || 'unknown',
         timestamp: context.timestamp || Date.now(),
         metadata: context.metadata || {}
       };
       return enriched;
     }
     
     export function wrapError(
       originalError: Error, 
       message: string, 
       context: Partial<ErrorContext>
     ): EnrichedError {
       const wrapped = new Error(message) as EnrichedError;
       wrapped.originalError = originalError;
       wrapped.stack = `${wrapped.stack}\nCaused by: ${originalError.stack}`;
       wrapped.context = {
         component: context.component || 'unknown',
         operation: context.operation || 'unknown',
         timestamp: context.timestamp || Date.now(),
         metadata: context.metadata || {}
       };
       return wrapped;
     }
     ```

3. **Standard Error Types**
   - Define standard error types for different areas of the application:
     ```typescript
     export class ValidationError extends Error {
       constructor(message: string, public details?: any) {
         super(message);
         this.name = 'ValidationError';
       }
     }
     
     export class ParseError extends Error {
       constructor(message: string, public source?: string) {
         super(message);
         this.name = 'ParseError';
       }
     }
     
     export class ServiceError extends Error {
       constructor(message: string, public service: string) {
         super(message);
         this.name = 'ServiceError';
       }
     }
     
     export class UIError extends Error {
       constructor(message: string, public component: string) {
         super(message);
         this.name = 'UIError';
       }
     }
     ```

4. **Consistent Error Logging**
   - Implement consistent error logging through the logger service:
     ```typescript
     export class LoggerService {
       private level: LogLevel;
       
       constructor(level: LogLevel = LogLevel.INFO) {
         this.level = level;
       }
       
       error(message: string, error?: Error): void {
         if (this.level <= LogLevel.ERROR) {
           if (error && 'context' in error) {
             const enrichedError = error as EnrichedError;
             console.error(
               `[ERROR] ${message}`, 
               `\nComponent: ${enrichedError.context?.component}`, 
               `\nOperation: ${enrichedError.context?.operation}`,
               `\nTimestamp: ${new Date(enrichedError.context?.timestamp || 0).toISOString()}`,
               `\nMetadata:`, enrichedError.context?.metadata,
               `\nOriginal error:`, enrichedError.originalError || error
             );
           } else {
             console.error(`[ERROR] ${message}`, error);
           }
         }
       }
       
       // Other logging methods...
     }
     ```

5. **Error Boundaries**
   - Add error boundaries at key points in the component hierarchy:
     ```typescript
     export abstract class ErrorBoundaryComponent {
       protected handleError(error: Error, fallback: () => void): void {
         const enriched = enrichError(error, {
           component: this.constructor.name,
           operation: 'render'
         });
         
         LoggerService.getInstance().error('Component error', enriched);
         
         // Show user-friendly message
         new Notice('An error occurred. Check console for details.');
         
         // Try to recover with fallback behavior
         try {
           fallback();
         } catch (fallbackError) {
           // Last resort if fallback also fails
           console.error('Fallback also failed:', fallbackError);
         }
       }
       
       protected wrapOperation<T>(
         operation: string, 
         callback: () => T, 
         fallback: () => T
       ): T {
         try {
           return callback();
         } catch (error) {
           const enriched = enrichError(error as Error, {
             component: this.constructor.name,
             operation
           });
           
           LoggerService.getInstance().error(`Operation ${operation} failed`, enriched);
           return fallback();
         }
       }
     }
     ```

6. **Obsidian Notice Integration**
   - Integrate with Obsidian's Notice API for user-facing error messages:
     ```typescript
     export function showUserError(message: string, error?: Error, timeout = 5000): void {
       if (error) {
         // Log the full error details
         LoggerService.getInstance().error(message, error);
       }
       
       // Show user-friendly message
       new Notice(message, timeout);
     }
     
     export function showValidationError(message: string, details?: any): void {
       new Notice(`Validation Error: ${message}`, 4000);
       
       if (details) {
         LoggerService.getInstance().warn(`Validation failed: ${message}`, {
           details
         });
       }
     }
     ```

### 2.2 Reorganize Modal Components
- Move all modals to the `src/dom/modals/` directory:
  - `OneiroMetricsModal` → `src/dom/modals/ScrapeModal.ts`
  - `ConfirmModal` → `src/dom/modals/ConfirmModal.ts`
  - Any other embedded modals

### 2.3 Refactor State Management
- Enhance `DreamMetricsState` with proper reactive state management
- Implement observer pattern for state changes
- Create dedicated state slices for different functionality areas

#### 2.3.1 State Management Implementation

To improve the state management architecture, we will enhance the current DreamMetricsState with a more robust observable pattern:

1. **Domain-Specific State Classes**
   - Create separate state classes for different domains:
     ```typescript
     // Base state class with common functionality
     abstract class BaseState<T> {
       protected state: T;
       protected listeners: StateChangeListener<T>[] = [];
       
       subscribe(listener: StateChangeListener<T>): () => void {
         this.listeners.push(listener);
         return () => this.unsubscribe(listener);
       }
       
       unsubscribe(listener: StateChangeListener<T>): void {
         this.listeners = this.listeners.filter(l => l !== listener);
       }
       
       protected notify(changes: Partial<T>): void {
         this.listeners.forEach(listener => listener(changes));
       }
     }
     
     // Example domain-specific state classes
     export class MetricsState extends BaseState<MetricsStateData> { ... }
     export class UIState extends BaseState<UIStateData> { ... }
     export class SettingsState extends BaseState<PluginSettings> { ... }
     ```

2. **Observable Pattern Implementation**
   - Implement a common base observable pattern for all state classes:
     ```typescript
     export type StateChangeListener<T> = (changes: Partial<T>) => void;
     
     export interface IObservableState<T> {
       subscribe(listener: StateChangeListener<T>): () => void;
       unsubscribe(listener: StateChangeListener<T>): void;
       getState(): Readonly<T>;
     }
     ```

3. **Specific State Change Notifications**
   - Enable subscribing to specific state changes:
     ```typescript
     // Select specific parts of state to observe
     export function selectState<T, K extends keyof T>(
       state: IObservableState<T>,
       selector: K | K[],
       onChange: (selected: Pick<T, K>) => void
     ): () => void {
       const listener: StateChangeListener<T> = (changes) => {
         const keys = Array.isArray(selector) ? selector : [selector];
         if (keys.some(key => key in changes)) {
           const selected = keys.reduce((acc, key) => {
             acc[key] = state.getState()[key];
             return acc;
           }, {} as Pick<T, K>);
           onChange(selected);
         }
       };
       
       return state.subscribe(listener);
     }
     ```

4. **State Persistence**
   - Add serialization/deserialization for state persistence:
     ```typescript
     export interface IPersistableState<T> extends IObservableState<T> {
       serialize(): string;
       deserialize(data: string): void;
     }
     
     // Implementation example
     serialize(): string {
       return JSON.stringify(this.state);
     }
     
     deserialize(data: string): void {
       try {
         const parsed = JSON.parse(data);
         this.setState(parsed);
       } catch (e) {
         console.error("Failed to deserialize state:", e);
       }
     }
     ```

5. **Immutable State Access**
   - Create accessor methods that enforce immutability:
     ```typescript
     getState(): Readonly<T> {
       return Object.freeze({...this.state});
     }
     
     setState(newState: Partial<T>): void {
       const prevState = {...this.state};
       this.state = {...this.state, ...newState};
       this.notify(newState);
     }
     
     // For nested updates with immutability
     updateNestedState<K extends keyof T>(
       key: K, 
       updater: (currentValue: T[K]) => T[K]
     ): void {
       const newValue = updater(this.state[key]);
       this.setState({ [key]: newValue } as Partial<T>);
     }
     ```

### 2.4 Backward Compatibility Approach

To ensure backward compatibility throughout the refactoring process, we will:

- Use the interface stability approach with adapter classes for complex components
- Define stable public interfaces for key components before extraction
- Implement adapter classes that maintain the same public API while delegating to new implementations
- Maintain settings compatibility with data migration utilities
- Preserve user data with automatic backup and validation tools

#### 2.4.1 Migration Strategy Implementation

For handling breaking changes during refactoring, we will implement the following approach:

1. **Interface Stability**
   - Define stable public interfaces for all key components:
     ```typescript
     // Example: Before extracting metrics processing functionality
     export interface IMetricsProcessor {
       processMetrics(text: string): Record<string, number>;
       calculateSummaryStatistics(metrics: Record<string, number[]>): SummaryStats;
       generateMetricsTable(metrics: Record<string, number[]>): HTMLElement;
     }
     ```

2. **Adapter Pattern Implementation**
   - Create adapter classes that maintain the same public API while delegating to new implementations:
     ```typescript
     // Old API interface that external code depends on
     export interface ILegacyMetricsProcessor {
       processMetrics(text: string): Record<string, number>;
     }
     
     // New implementation with improved design
     export class ModernMetricsService {
       parseMetricsText(text: string, options?: ParseOptions): MetricsResult {
         // New, improved implementation
         const result: MetricsResult = {
           metrics: {},
           warnings: []
         };
         
         // ... implementation ...
         
         return result;
       }
     }
     
     // Adapter maintains backward compatibility
     export class MetricsProcessorAdapter implements ILegacyMetricsProcessor {
       private modernService: ModernMetricsService;
       
       constructor(modernService: ModernMetricsService) {
         this.modernService = modernService;
       }
       
       processMetrics(text: string): Record<string, number> {
         // Adapt new implementation to old interface
         const result = this.modernService.parseMetricsText(text);
         
         // Transform new result format to old format
         const legacyResult: Record<string, number> = {};
         Object.entries(result.metrics).forEach(([key, values]) => {
           // Take the last value from each metric array as the current value
           if (values.length > 0) {
             legacyResult[key] = values[values.length - 1];
           }
         });
         
         return legacyResult;
       }
     }
     ```

3. **Settings Migration Utilities**
   - Create tools for migrating settings formats:
     ```typescript
     export interface SettingsMigrator {
       canMigrate(settings: any): boolean;
       migrate(settings: any): any;
     }
     
     export class SettingsMigrationV1toV2 implements SettingsMigrator {
       canMigrate(settings: any): boolean {
         // Check if settings are in the old format (v1)
         return settings && !settings.version;
       }
       
       migrate(oldSettings: any): any {
         // Create new settings format
         const newSettings = {
           version: 2,
           metrics: {},
           ui: {},
           journal: {}
         };
         
         // Migrate settings from old to new format
         if (oldSettings.metricsEnabled !== undefined) {
           newSettings.metrics.enabled = oldSettings.metricsEnabled;
         }
         
         if (oldSettings.dateFormat) {
           newSettings.ui.dateFormat = oldSettings.dateFormat;
         }
         
         // ... migrate other settings ...
         
         return newSettings;
       }
     }
     
     // Usage in plugin
     loadSettings(): Promise<void> {
       return this.loadData()
         .then(data => {
           // Check if migration is needed
           const migrators: SettingsMigrator[] = [
             new SettingsMigrationV1toV2()
           ];
           
           let settings = data || {};
           
           // Apply migrations if needed
           for (const migrator of migrators) {
             if (migrator.canMigrate(settings)) {
               // Backup original settings
               this.backupSettings(settings);
               
               // Apply migration
               settings = migrator.migrate(settings);
             }
           }
           
           this.settings = settings;
         });
     }
     ```

4. **User Data Protection**
   - Implement backup and validation for user data:
     ```typescript
     export class DataBackupService {
       private plugin: DreamMetricsPlugin;
       
       constructor(plugin: DreamMetricsPlugin) {
         this.plugin = plugin;
       }
       
       async backupSettings(settings: any): Promise<void> {
         try {
           // Create backup file name with timestamp
           const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
           const backupFileName = `dream-metrics-settings-backup-${timestamp}.json`;
           
           // Get plugin data directory
           const dataDir = this.plugin.app.vault.configDir + '/plugins/dream-metrics/backups';
           
           // Ensure directory exists
           if (!await this.plugin.app.vault.adapter.exists(dataDir)) {
             await this.plugin.app.vault.adapter.mkdir(dataDir);
           }
           
           // Write backup file
           await this.plugin.app.vault.adapter.write(
             `${dataDir}/${backupFileName}`,
             JSON.stringify(settings, null, 2)
           );
           
           console.log(`Settings backup created: ${backupFileName}`);
         } catch (error) {
           console.error('Failed to backup settings:', error);
         }
       }
       
       async validateSettings(settings: any): Promise<boolean> {
         // Perform validation on settings object
         try {
           // Check required fields
           if (!settings) return false;
           
           // Validate settings structure based on version
           if (settings.version === 2) {
             return (
               typeof settings.metrics === 'object' &&
               typeof settings.ui === 'object' &&
               typeof settings.journal === 'object'
             );
           } else {
             // Legacy format validation
             return true; // Assume valid for legacy format
           }
         } catch (error) {
           console.error('Settings validation failed:', error);
           return false;
         }
       }
     }
     ```

5. **Thorough Testing**
   - Implement comprehensive testing for data migration:
     ```typescript
     describe('Settings Migration', () => {
       it('should correctly migrate v1 settings to v2', () => {
         // Arrange
         const v1Settings = {
           metricsEnabled: true,
           dateFormat: 'YYYY-MM-DD',
           selectedNotes: ['note1.md', 'note2.md'],
           journalFile: 'journal.md'
         };
         
         const migrator = new SettingsMigrationV1toV2();
         
         // Act
         const result = migrator.migrate(v1Settings);
         
         // Assert
         expect(result.version).toBe(2);
         expect(result.metrics.enabled).toBe(true);
         expect(result.ui.dateFormat).toBe('YYYY-MM-DD');
         expect(result.journal.selectedNotes).toEqual(['note1.md', 'note2.md']);
         expect(result.journal.file).toBe('journal.md');
       });
       
       it('should handle missing fields in v1 settings', () => {
         // Arrange
         const incompleteV1Settings = {
           metricsEnabled: true
           // Missing other fields
         };
         
         const migrator = new SettingsMigrationV1toV2();
         
         // Act
         const result = migrator.migrate(incompleteV1Settings);
         
         // Assert
         expect(result.version).toBe(2);
         expect(result.metrics.enabled).toBe(true);
         // Should have default values for missing fields
         expect(result.ui.dateFormat).toBe('YYYY-MM-DD'); // default
       });
     });
     ```

6. **Version Update Strategy**
   - Prepare for a clean major version update:
     - Increment to v2.0.0 for the refactored codebase
     - Create comprehensive release notes documenting architecture changes
     - Provide guidance for users on potential changes
     - Include fallback instructions if issues are encountered

## Phase 3: Feature Module Extraction (3 weeks)

### 3.1 Dream Journal Analysis
- Create a `src/analysis/` module for dream content analysis
- Move metrics calculation and processing functions
- Extract the content cleaning and sanitization logic

### 3.2 Template System
- Consolidate template-related code in `src/templates/`
- Extract template processing from main file
- Improve error handling for template operations

### 3.3 UI Components
- Move table generation and rendering to `src/dom/components/`
- Create components for:
  - Metrics tables
  - Summary views
  - Filter controls
  - Expandable content sections

#### 3.3.1 UI Component Architecture Implementation

To improve testability and separation of concerns for complex UI components, we will implement a presentation/container component split:

1. **Identifying Complex Components**
   - Focus on complex UI components that would benefit most from this pattern:
     - `DateNavigatorModal` and related components
     - `MetricsVisualization` components
     - `SettingsTabs` and settings UI elements
     - `DreamJournalManager` UI components

2. **Standardized Component Communication**
   - Create standardized interfaces for component communication:
     ```typescript
     // Example: Props interface for DateNavigatorView
     export interface DateNavigatorViewProps {
       selectedDate: Date;
       highlightedDates: Date[];
       onDateSelect: (date: Date) => void;
       onMonthChange: (month: number, year: number) => void;
       onConfirm: () => void;
       onCancel: () => void;
     }
     
     // Example: Callback interface for MetricsVisualization
     export interface MetricsVisualizationCallbacks {
       onFilterChange: (filter: MetricsFilter) => void;
       onMetricSelect: (metricName: string) => void;
       onTimeRangeChange: (range: DateRange) => void;
     }
     ```

3. **Component Separation**
   - Refactor complex components by separating logic (container) from presentation:
     ```typescript
     // Before: Mixed presentation and logic
     export class DateNavigatorModal extends Modal {
       constructor(app: App, plugin: DreamMetricsPlugin) {
         super(app);
         this.plugin = plugin;
         // Mixed presentation setup and business logic
       }
       
       onOpen() {
         // Rendering logic
         // Event handling
         // Date calculation
         // DOM manipulation
       }
     }
     
     // After: Separated container and presentation
     // Container component (handles logic)
     export class DateNavigatorContainer {
       private view: DateNavigatorView;
       private selectedDate: Date;
       
       constructor(
         initialDate: Date, 
         private onDateSelected: (date: Date) => void
       ) {
         this.selectedDate = initialDate;
         this.view = new DateNavigatorView({
           selectedDate: this.selectedDate,
           highlightedDates: [],
           onDateSelect: this.handleDateSelect.bind(this),
           onMonthChange: this.handleMonthChange.bind(this),
           onConfirm: this.handleConfirm.bind(this),
           onCancel: this.handleCancel.bind(this)
         });
       }
       
       // Business logic methods
       private handleDateSelect(date: Date) {
         this.selectedDate = date;
         this.updateView();
       }
       
       private updateView() {
         this.view.update({
           selectedDate: this.selectedDate,
           highlightedDates: this.getHighlightedDates()
         });
       }
       
       private getHighlightedDates(): Date[] {
         // Business logic to determine highlighted dates
         return [];
       }
     }
     
     // Presentation component (handles rendering)
     export class DateNavigatorView {
       private containerEl: HTMLElement;
       private props: DateNavigatorViewProps;
       
       constructor(props: DateNavigatorViewProps) {
         this.props = props;
         this.containerEl = createDiv('date-navigator');
         this.render();
       }
       
       update(newProps: Partial<DateNavigatorViewProps>) {
         this.props = { ...this.props, ...newProps };
         this.render();
       }
       
       private render() {
         // Pure rendering logic - no business logic
         this.containerEl.empty();
         // Create UI elements based on props
         // Attach event handlers that call props callbacks
       }
     }
     ```

4. **Data Flow Patterns**
   - Implement clear data flow patterns between containers and presentation:
     - Container components own and manage state
     - Presentation components receive data via props
     - User interactions trigger callbacks defined by container
     - Container updates state and passes new props to presentation
     - Presentation rerenders with new props

5. **Component Organization**
   - Define conventions for component file organization and naming:
     ```
     src/dom/components/
       date-navigator/
         DateNavigatorContainer.ts
         DateNavigatorView.ts
         DateNavigatorTypes.ts
       metrics-visualization/
         MetricsVisualizationContainer.ts
         MetricsVisualizationView.ts
         MetricsVisualizationTypes.ts
     ```

6. **Simplicity for Simpler Components**
   - Keep simpler UI components in their current form when the split would add unnecessary complexity:
     - Simple modals with minimal logic
     - Notification components
     - Static UI elements
     - Components with fewer than ~100 lines of code

### 3.4 Data Processing Pipeline
- Create a clear pipeline for data flow:
  1. Data acquisition
  2. Validation and normalization
  3. Analysis and processing
  4. Persistence
  5. Presentation

### 3.5 Component Extraction Order

Following our dependency-based prioritization approach, components will be extracted in this order:

1. First extraction wave - independent utility components:
   - Standalone utility functions (date formatting, content processing)
   - Modal components (OneiroMetricsModal, ConfirmModal)
   - Simple data processing functions (processDreamContent, processMetrics)
   - Logging system (already partially modularized)

2. Second extraction wave - service modules:
   - File operation utilities
   - Event handling systems
   - Content parsing services
   - Table generation functions

3. Third extraction wave - state management components
4. Final extraction - core plugin functionality

This reduces refactoring risk by starting with the most isolated components first, creating early successes and momentum.

### 3.6 CSS Refactoring

As part of the UI components extraction, we'll conduct a comprehensive CSS refactoring effort:

1. Audit inline styles:
   - Systematically identify all inline styles in the codebase
   - Document each instance with its associated component
   - Categorize styles by purpose (layout, appearance, animation, etc.)
   - Prioritize based on usage frequency and impact

2. Consolidate styles in styles.css:
   - Create a well-organized structure within styles.css:
     ```css
     /* Component: Modal Dialogs */
     .oom-modal { ... }
     .oom-modal-header { ... }
     
     /* Component: Metrics Tables */
     .oom-table { ... }
     .oom-table-cell { ... }
     ```
   - Implement CSS custom properties (variables) for consistent values
   - Add clear comments documenting the purpose of each style section

3. Migration strategy:
   - Replace inline styles in batches, aligned with component extraction
   - Test visual consistency after each batch of changes
   - Maintain a checklist of migrated styles to track progress
   - Document any style dependencies between components

4. CSS organization principles:
   - Group styles by component
   - Use BEM (Block Element Modifier) naming convention for clarity
   - Implement responsive design patterns consistently
   - Minimize style specificity to reduce cascade issues
   - Ensure dark/light theme compatibility

This systematic approach will improve maintainability, reduce code duplication, and enable consistent styling across components.

## Phase 4: Main Plugin Refactoring (1 week)

### 4.1 Rebuild Main Plugin Class
- Refactor `DreamMetricsPlugin` to be a thin coordinator
- Implement dependency injection for services
- Reduce direct DOM manipulation
- Use event-driven architecture for UI updates

### 4.2 Command Registration
- Create a dedicated command registry
- Move command definitions and handlers to appropriate modules

### 4.3 Settings Management
- Improve settings organization
- Add runtime validation for settings
- Implement modular settings sections

## Phase 5: Testing and Finalization (2 weeks)

### 5.1 Unit Testing
- Write unit tests for core services
- Implement integration tests for key workflows
- Add snapshot tests for UI components

#### 5.1.1 Error Handling Testing

As part of our testing strategy, we will specifically address error handling:

1. **Error Propagation Tests**
   - Verify that errors are properly enriched with context as they bubble up:
     ```typescript
     describe('Error handling', () => {
       it('should enrich errors with context', () => {
         // Arrange
         const originalError = new Error('Original error');
         
         // Act
         const enriched = enrichError(originalError, {
           component: 'TestComponent',
           operation: 'testOperation'
         });
         
         // Assert
         expect(enriched.message).toBe('Original error');
         expect(enriched.context?.component).toBe('TestComponent');
         expect(enriched.context?.operation).toBe('testOperation');
         expect(enriched.context?.timestamp).toBeDefined();
       });
       
       it('should wrap errors and preserve stack traces', () => {
         // Arrange
         const originalError = new Error('Database error');
         
         // Act
         const wrapped = wrapError(originalError, 'Failed to load metrics', {
           component: 'MetricsService',
           operation: 'loadMetrics'
         });
         
         // Assert
         expect(wrapped.message).toBe('Failed to load metrics');
         expect(wrapped.originalError).toBe(originalError);
         expect(wrapped.stack).toContain('Caused by: Error: Database error');
       });
     });
     ```

2. **Error Boundary Tests**
   - Test that error boundaries properly catch and handle errors:
     ```typescript
     describe('ErrorBoundaryComponent', () => {
       let component: TestErrorBoundary;
       let loggerSpy: jest.SpyInstance;
       
       beforeEach(() => {
         component = new TestErrorBoundary();
         loggerSpy = jest.spyOn(LoggerService.getInstance(), 'error');
       });
       
       it('should catch errors and execute fallback', () => {
         // Arrange
         const error = new Error('Test error');
         const throwingOperation = () => { throw error; };
         const fallback = jest.fn();
         
         // Act
         component.testHandleError(error, fallback);
         
         // Assert
         expect(fallback).toHaveBeenCalled();
         expect(loggerSpy).toHaveBeenCalledWith('Component error', expect.any(Object));
       });
       
       it('should wrap operations and use fallback on error', () => {
         // Arrange
         const throwingOperation = () => { throw new Error('Operation failed'); };
         const fallback = jest.fn().mockReturnValue('fallback result');
         
         // Act
         const result = component.testWrapOperation('testOp', throwingOperation, fallback);
         
         // Assert
         expect(result).toBe('fallback result');
         expect(fallback).toHaveBeenCalled();
         expect(loggerSpy).toHaveBeenCalledWith(
           'Operation testOp failed',
           expect.any(Object)
         );
       });
     });
     ```

3. **Error Type Tests**
   - Verify custom error types work as expected:
     ```typescript
     describe('Custom error types', () => {
       it('should create ValidationError with details', () => {
         // Arrange & Act
         const details = { field: 'date', message: 'Invalid date format' };
         const error = new ValidationError('Validation failed', details);
         
         // Assert
         expect(error.name).toBe('ValidationError');
         expect(error.details).toEqual(details);
       });
       
       it('should create ServiceError with service name', () => {
         // Arrange & Act
         const error = new ServiceError('Failed to process metrics', 'MetricsService');
         
         // Assert
         expect(error.name).toBe('ServiceError');
         expect(error.service).toBe('MetricsService');
       });
     });
     ```

4. **Logger Integration Tests**
   - Test that errors are properly logged with context:
     ```typescript
     describe('Logger error handling', () => {
       let consoleErrorSpy: jest.SpyInstance;
       let logger: LoggerService;
       
       beforeEach(() => {
         consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
         logger = new LoggerService(LogLevel.DEBUG);
       });
       
       afterEach(() => {
         consoleErrorSpy.mockRestore();
       });
       
       it('should log enriched errors with full context', () => {
         // Arrange
         const originalError = new Error('Database connection failed');
         const enriched = enrichError(originalError, {
           component: 'DatabaseService',
           operation: 'connect',
           metadata: { host: 'localhost', port: 5432 }
         });
         
         // Act
         logger.error('Failed to initialize database', enriched);
         
         // Assert
         expect(consoleErrorSpy).toHaveBeenCalled();
         expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR] Failed to initialize database');
         expect(consoleErrorSpy.mock.calls[0][1]).toContain('Component: DatabaseService');
       });
     });
     ```

### 5.2 Performance Optimization
- Measure and improve startup time
- Optimize rendering performance
- Reduce memory usage

#### 5.2.1 Performance Monitoring Implementation

To ensure performance during and after refactoring, we will implement a user-focused performance strategy with developer tooling:

1. **Performance-Critical Operations**
   - Identify key operations that impact user experience:
     - Journal parsing (especially with large journals)
     - Metrics calculation (particularly for long time periods)
     - UI rendering during updates and data filtering
     - Modal initialization and content loading
     - Data persistence operations

2. **Timing Measurement Implementation**
   - Implement simple timing measurements using `performance.now()`:
     ```typescript
     export class PerformanceMonitor {
       private static instance: PerformanceMonitor;
       private measurements: Record<string, PerformanceMeasurement[]> = {};
       private isEnabled: boolean = false;
       
       static getInstance(): PerformanceMonitor {
         if (!PerformanceMonitor.instance) {
           PerformanceMonitor.instance = new PerformanceMonitor();
         }
         return PerformanceMonitor.instance;
       }
       
       enable(): void {
         this.isEnabled = true;
       }
       
       disable(): void {
         this.isEnabled = false;
       }
       
       startMeasurement(operation: string, metadata?: Record<string, any>): () => void {
         if (!this.isEnabled) return () => {};
         
         const start = performance.now();
         return () => {
           const end = performance.now();
           const duration = end - start;
           
           if (!this.measurements[operation]) {
             this.measurements[operation] = [];
           }
           
           this.measurements[operation].push({
             timestamp: Date.now(),
             duration,
             metadata
           });
           
           // Keep only the last 100 measurements per operation
           if (this.measurements[operation].length > 100) {
             this.measurements[operation].shift();
           }
           
           console.debug(`[Performance] ${operation}: ${duration.toFixed(2)}ms`);
         };
       }
       
       getMeasurements(operation?: string): Record<string, PerformanceMeasurement[]> {
         if (operation) {
           return { [operation]: this.measurements[operation] || [] };
         }
         return {...this.measurements};
       }
       
       getAverageDuration(operation: string): number {
         const measurements = this.measurements[operation];
         if (!measurements || measurements.length === 0) {
           return 0;
         }
         
         const sum = measurements.reduce((acc, m) => acc + m.duration, 0);
         return sum / measurements.length;
       }
       
       clearMeasurements(operation?: string): void {
         if (operation) {
           this.measurements[operation] = [];
         } else {
           this.measurements = {};
         }
       }
     }
     
     export interface PerformanceMeasurement {
       timestamp: number;
       duration: number;
       metadata?: Record<string, any>;
     }
     ```

3. **Developer UI for Performance Metrics**
   - Create a developer-only UI panel for visualizing performance data:
     ```typescript
     export class PerformanceDebugView extends Modal {
       constructor(app: App) {
         super(app);
       }
       
       onOpen() {
         const {contentEl} = this;
         contentEl.empty();
         
         contentEl.createEl('h2', {text: 'Performance Metrics'});
         
         const monitor = PerformanceMonitor.getInstance();
         const measurements = monitor.getMeasurements();
         
         // Create operation tabs
         const tabContainer = contentEl.createEl('div', {cls: 'performance-tabs'});
         const contentContainer = contentEl.createEl('div', {cls: 'performance-content'});
         
         Object.keys(measurements).forEach((operation, index) => {
           const operationMeasurements = measurements[operation];
           const avgDuration = monitor.getAverageDuration(operation);
           
           // Create tab
           const tab = tabContainer.createEl('div', {
             cls: 'performance-tab',
             text: `${operation} (${avgDuration.toFixed(2)}ms avg)`
           });
           
           // Create content panel
           const panel = contentContainer.createEl('div', {
             cls: 'performance-panel'
           });
           
           if (index === 0) {
             tab.addClass('active');
             panel.addClass('active');
           }
           
           // Add event listener
           tab.addEventListener('click', () => {
             tabContainer.querySelectorAll('.performance-tab').forEach(t => 
               t.removeClass('active')
             );
             contentContainer.querySelectorAll('.performance-panel').forEach(p => 
               p.removeClass('active')
             );
             tab.addClass('active');
             panel.addClass('active');
           });
           
           // Create table of measurements
           const table = panel.createEl('table', {cls: 'performance-table'});
           
           // Header row
           const thead = table.createEl('thead');
           const headerRow = thead.createEl('tr');
           headerRow.createEl('th', {text: '#'});
           headerRow.createEl('th', {text: 'Time'});
           headerRow.createEl('th', {text: 'Duration (ms)'});
           headerRow.createEl('th', {text: 'Metadata'});
           
           // Body rows
           const tbody = table.createEl('tbody');
           operationMeasurements.forEach((measurement, idx) => {
             const row = tbody.createEl('tr');
             row.createEl('td', {text: String(idx + 1)});
             row.createEl('td', {
               text: new Date(measurement.timestamp).toLocaleTimeString()
             });
             row.createEl('td', {text: measurement.duration.toFixed(2)});
             row.createEl('td', {
               text: measurement.metadata ? 
                 JSON.stringify(measurement.metadata) : '-'
             });
           });
         });
       }
     }
     ```

4. **Toggleable Performance Logging**
   - Add a developer setting to enable detailed performance logging:
     ```typescript
     // In settings.ts
     interface DeveloperSettings {
       enablePerformanceMonitoring: boolean;
       logPerformanceToConsole: boolean;
       performanceLogLevel: 'debug' | 'info';
     }
     
     // Usage in plugin
     if (this.settings.developer.enablePerformanceMonitoring) {
       PerformanceMonitor.getInstance().enable();
     }
     
     // Add to settings tab
     new Setting(containerEl)
       .setName('Enable Performance Monitoring')
       .setDesc('Track and display performance metrics (developer feature)')
       .addToggle(toggle => toggle
         .setValue(this.plugin.settings.developer.enablePerformanceMonitoring)
         .onChange(async (value) => {
           this.plugin.settings.developer.enablePerformanceMonitoring = value;
           await this.plugin.saveSettings();
           
           if (value) {
             PerformanceMonitor.getInstance().enable();
           } else {
             PerformanceMonitor.getInstance().disable();
           }
         }));
     ```

5. **Informal Performance Budgets**
   - Establish guidelines for performance targets:
     - Journal loading: < 500ms for 100 entries
     - Metrics calculation: < 1000ms for 1000 entries
     - UI rendering: < 100ms for updates
     - Filter operations: < 200ms for applying filters
     - Plugin initialization: < 300ms

6. **Before/After Comparisons**
   - Create a process for comparing performance between versions:
     ```typescript
     export function comparePerformance(
       beforeData: Record<string, PerformanceMeasurement[]>,
       afterData: Record<string, PerformanceMeasurement[]>
     ): PerformanceComparison {
       const comparison: PerformanceComparison = {
         operations: {},
         summary: {
           improved: 0,
           degraded: 0,
           unchanged: 0
         }
       };
       
       // Combine all operation keys
       const operations = new Set([
         ...Object.keys(beforeData),
         ...Object.keys(afterData)
       ]);
       
       operations.forEach(operation => {
         const beforeMeasurements = beforeData[operation] || [];
         const afterMeasurements = afterData[operation] || [];
         
         const beforeAvg = beforeMeasurements.length > 0 ?
           beforeMeasurements.reduce((sum, m) => sum + m.duration, 0) / 
           beforeMeasurements.length : 0;
           
         const afterAvg = afterMeasurements.length > 0 ?
           afterMeasurements.reduce((sum, m) => sum + m.duration, 0) / 
           afterMeasurements.length : 0;
         
         const percentChange = beforeAvg > 0 ?
           ((afterAvg - beforeAvg) / beforeAvg) * 100 : 0;
         
         comparison.operations[operation] = {
           beforeAvg,
           afterAvg,
           percentChange,
           status: percentChange < -5 ? 'improved' :
                  percentChange > 5 ? 'degraded' : 'unchanged'
         };
         
         comparison.summary[comparison.operations[operation].status]++;
       });
       
       return comparison;
     }
     
     interface PerformanceComparison {
       operations: Record<string, {
         beforeAvg: number;
         afterAvg: number;
         percentChange: number;
         status: 'improved' | 'degraded' | 'unchanged';
       }>;
       summary: {
         improved: number;
         degraded: number;
         unchanged: number;
       };
     }
     ```

7. **Event System Performance Monitoring**
   - Add event tracking to monitor propagation delays:
     ```typescript
     // Add performance monitoring to EventEmitter
     emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
       if (!this.listeners[event]) return;
       
       const endMeasurement = PerformanceMonitor.getInstance()
         .startMeasurement('event:emit', {
           event: String(event),
           listenerCount: this.listeners[event]?.length || 0
         });
       
       this.listeners[event]?.forEach(listener => {
         const endListenerMeasurement = PerformanceMonitor.getInstance()
           .startMeasurement('event:listener', {
             event: String(event),
             listener: listener.name || 'anonymous'
           });
           
         try {
           listener(payload);
         } catch (error) {
           console.error(`Error in event listener for ${String(event)}:`, error);
         } finally {
           endListenerMeasurement();
         }
       });
       
       endMeasurement();
     }
     ```

### 5.3 Documentation

```docs/developer/implementation/refactoring-plan-2025.md
```

## Conclusion

This refactoring plan provides a structured approach to transforming the OneiroMetrics plugin from a monolithic codebase to a modular, maintainable architecture. By following this plan, we can improve code quality, enable future extensions, and ensure long-term sustainability while preserving the existing user experience.

The implementation examples demonstrate how specific components will be extracted and restructured, providing concrete guidance for the refactoring process.

The decisions made during pre-implementation analysis have been integrated throughout the plan, providing clear direction for:
- Technical dependency mapping and analysis
- Backward compatibility and interface stability
- Feature management during refactoring
- User impact assessment and communication
- Component extraction prioritization
- Testing strategy and requirements
- Version control approach
- Documentation maintenance

### Post-Refactoring Cleanup

Once the refactoring is complete and the new architecture is stable, we should perform a thorough cleanup to remove temporary artifacts and documentation created specifically for the refactoring process. This includes:

1. **Document Archiving**
   - After refactoring is complete, all refactoring-specific documentation should be archived to the `docs/archive/legacy` directory
   - This includes this refactoring plan, the TypeScript migration guides, component migration examples, and other temporary documentation
   - A comprehensive list of documents to archive is maintained in the [Post-Refactoring Roadmap](./post-refactoring-roadmap.md) under the "Post-Refactoring Cleanup" section
   - Use the [Post-Refactoring Cleanup Checklist](./post-refactoring-cleanup-checklist.md) to methodically track the cleanup process

2. **Code Cleanup**
   - Remove temporary adapter functions and compatibility layers that were created solely for the refactoring
   - Clean up migration utilities after all components have been properly migrated
   - Remove deprecated functions and APIs after ensuring nothing depends on them
   - Follow the detailed steps in the [cleanup checklist](./post-refactoring-cleanup-checklist.md)

This post-refactoring cleanup ensures that future developers will have a clean codebase without the transitional scaffolding that was necessary during refactoring.

This comprehensive approach ensures the refactoring will proceed methodically with appropriate attention to technical quality, user impact, and long-term maintainability. 
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
  - [2.2 Reorganize Modal Components ✅](#22-reorganize-modal-components-✅)
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
- [Implementation Progress Tracking](#implementation-progress-tracking)

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
| BaseModal.ts | src/dom/modals | 177 | Base modal class implementing common functionality |
| ConfirmModal.ts | src/dom/modals | 99 | Modal for confirming actions with Yes/No options |
| AlertModal.ts | src/dom/modals | 82 | Modal for displaying alerts with an OK button |
| IModal.ts | src/dom/modals | 44 | Interface defining modal component contracts |
| IMetricsProcessor.ts | src/metrics/interfaces | 76 | Interface for metrics processing |
| MetricsProcessor.ts | src/metrics/services | 310 | Implementation of metrics processing |
| IContentParser.ts | src/parsing/interfaces | 61 | Interface for content parsing |
| ContentParser.ts | src/parsing/services | 191 | Implementation of content parsing |
| IFileOperations.ts | src/file-operations/interfaces | 73 | Interface for file operations |
| FileOperations.ts | src/file-operations/services | 190 | Implementation of file operations |
| constants.ts | src | 24 | Default metrics and logging configuration |
| types.ts | src | 52 | Type definitions specific to the src modules |
| events.ts | src | 16 | Singleton event bus for application-wide events |

Additionally, the following CSS files require refactoring:

| File Name | Location | Line Count | Description | Refactoring Needed |
|-----------|----------|------------|-------------|-------------------|
| DateNavigatorStyles.css | src/dom | ~507 | Date navigator component styles | Should be consolidated into styles.css |

This inventory highlights multiple candidates for refactoring beyond the main.ts file, particularly UI components with high line counts that would benefit from further modularization.

### Post-Refactoring Inventory Updates

As part of our refactoring effort, we have created the following new files:

| File Name | Location | Line Count | Description |
|-----------|----------|------------|-------------|
| IModal.ts | src/dom/modals | 44 | Interface defining modal component contracts |
| BaseModal.ts | src/dom/modals | 177 | Base modal class implementing common functionality |
| ConfirmModal.ts | src/dom/modals | 99 | Modal for confirming actions with Yes/No options |
| AlertModal.ts | src/dom/modals | 82 | Modal for displaying alerts with an OK button |
| index.ts | src/dom/modals | 16 | Exports for modal components |
| IMetricsProcessor.ts | src/metrics/interfaces | 76 | Interface for metrics processing |
| MetricsProcessor.ts | src/metrics/services | 310 | Implementation of metrics processing |
| index.ts | src/metrics | 11 | Exports for metrics module |
| index.ts | src/metrics/interfaces | 1 | Exports for metrics interfaces |
| index.ts | src/metrics/services | 1 | Exports for metrics implementations |
| IContentParser.ts | src/parsing/interfaces | 61 | Interface for content parsing |
| ContentParser.ts | src/parsing/services | 191 | Implementation of content parsing |
| index.ts | src/parsing | 11 | Exports for parsing module |
| index.ts | src/parsing/interfaces | 1 | Exports for parsing interfaces |
| index.ts | src/parsing/services | 1 | Exports for parsing implementations |
| IFileOperations.ts | src/file-operations/interfaces | 73 | Interface for file operations |
| FileOperations.ts | src/file-operations/services | 190 | Implementation of file operations |
| index.ts | src/file-operations | 12 | Exports for file operations module |
| index.ts | src/file-operations/interfaces | 1 | Exports for file operations interfaces |
| index.ts | src/file-operations/services | 1 | Exports for file operations implementations |

This structured approach has helped organize the codebase into clear modules with separation of concerns, following the interface-first design pattern.

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

Based on the pre-implementation analysis, I will use a hybrid approach with initial manual dependency mapping supplemented by a lightweight Obsidian-specific analysis tool:

- Begin with a manual high-level dependency map of the main components
- Develop a simple script to scan for Obsidian API usage patterns
- Maintain a living document of component dependencies
- Use this dependency map to validate extraction order decisions

This approach combines human insight with automated detection while accounting for Obsidian-specific patterns that generic tools might miss.

## Phase 2: Core Infrastructure Refactoring (2 weeks)

### 2.1 Extract Core Services
- Move the following to dedicated service modules:
  - Metrics processing (`src/metrics/`) ✅
  - Content parsing (`src/parsing/`) ✅
  - File operations (`src/file-operations/`) ✅
  - Event management (`src/events/`) ✅
  - Logging system (`src/logging/`) ✅
  - State management (`src/state/`) ✅

#### 2.1.1 Interface Design Implementation

To break circular dependencies and improve component isolation, I will implement a TypeScript interface-based approach:

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

To improve component communication while maintaining separation of concerns, I will implement typed event emitters for specific functional areas:

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

To standardize error handling across components, I will implement error bubbling with context enrichment:

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

### 2.2 Reorganize Modal Components ✅
- Create dedicated modal components directory ✅
- Extract common modal functionality ✅
- Standardize modal interfaces ✅

The modal components have been reorganized into a clean, modular structure:
- Created a base `IModal` interface that defines the contract for all modals
- Implemented a `BaseModal` class that extends Obsidian's Modal and implements our interface
- Created specific modal implementations (ConfirmModal, AlertModal) that extend the base class
- Added static helper methods for common use cases (e.g., `ConfirmModal.show()`)
- Implemented consistent styling using "oom-" prefixed CSS classes
- Ensured compatibility with Obsidian's Modal API

All new modals should now extend the `BaseModal` class to ensure consistent behavior and styling.

### 2.3 Refactor State Management
- Implement the observable pattern for state management
- Create typed interfaces and base classes for state
- Reorganize metrics state and UI state
- Implement state selectors for component-specific state
- Add state persistence through interfaces
- Create backwards compatibility adapters

#### 2.3.1 State Management Implementation

The state management system has been refactored following the observable pattern with a unidirectional data flow. The implementation includes:

1. **Core State Management Interfaces**
   - `IObservableState`: Base interface for subscribing to state changes
   - `IMutableState`: Interface for updating state
   - `IPersistableState`: Interface for serializing and deserializing state
   - `IStateSelector`: Interface for selecting specific parts of state
   - `IStateDispatcher`: Interface for action-based state changes

2. **Base State Classes**
   - `ObservableState`: Base implementation of observer pattern
   - `MutableState`: Implementation of direct state updates
   - `PersistableState`: Implementation of state persistence
   - `StateSelector`: Implementation for watching specific state keys
   - `StateDispatcher`: Implementation for action-based state updates

3. **Metrics-Specific State**
   - `MetricsState`: Application-specific state with action handlers
   - `MetricsStateAdapter`: Backward compatibility layer for legacy code

4. **Directory Structure**
   ```
   src/state/
   ├── StateInterfaces.ts    # Core interfaces for state management
   ├── ObservableState.ts    # Base observable state implementation
   ├── MutableState.ts       # State that can be directly modified
   ├── PersistableState.ts   # State that can be saved/loaded
   ├── StateSelector.ts      # Component for selecting parts of state
   ├── StateDispatcher.ts    # Action-based state updates
   ├── MetricsState.ts       # Application-specific state
   ├── MetricsStateAdapter.ts # Backward compatibility adapter
   ├── index.ts              # Public exports
   ├── StateUsageExample.ts  # Example usage patterns
   └── README.md             # Documentation
   ```

5. **Migration to New System**
   - All new components should use `MetricsState` directly
   - Legacy components can use `MetricsStateAdapter` during transition
   - State operations are now tracked through actions for better debugging
   - Components use selectors to watch specific state portions

### 2.4 Backward Compatibility Approach

To ensure backward compatibility throughout the refactoring process, I will:

- Use the interface stability approach with adapter classes for complex components
- Define stable public interfaces for key components before extraction
- Implement adapter classes that maintain the same public API while delegating to new implementations
- Maintain settings compatibility with data migration utilities
- Preserve user data with automatic backup and validation tools

#### 2.4.1 Migration Strategy Implementation

For handling breaking changes during refactoring, I will implement the following approach:

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

To improve testability and separation of concerns for complex UI components, I will implement a presentation/container component split:

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

Following the dependency-based prioritization approach, components will be extracted in this order:

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

As part of the UI components extraction, will conduct a comprehensive CSS refactoring effort:

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

### 5.2 Performance Optimization
- Analyze performance bottlenecks
- Optimize critical path operations
- Implement progressive loading for large datasets

### 5.3 Documentation
- Update API documentation
- Create architecture diagrams
- Write migration guides for plugin users
- Document extension points for future development

### 5.4 Regression Testing Strategy
- Create comprehensive test suites
- Implement automated smoke tests
- Conduct manual verification of key user workflows
- Perform cross-validation against the previous version

## Implementation Progress Tracking

This section serves as a living record of the refactoring progress. It will be updated as I complete each milestone.

### Status Overview (as of 2025-05-22)

| Phase | Section | Status | Completion Date |
|-------|---------|--------|----------------|
| 1     | 1.1 Component Inventory | ✅ Complete | 2025-05-20 |
| 1     | 1.2 Define New Architecture | ✅ Complete | 2025-05-20 |
| 1     | 1.3 Testing Infrastructure | ✅ Complete | 2025-05-21 |
| 1     | 1.4 Dependency Analysis | ✅ Complete | 2025-05-21 |
| 2     | 2.1 Extract Core Services | ✅ Complete | 2025-05-22 |
| 2     | 2.2 Reorganize Modal Components | ✅ Complete | 2025-05-22 |
| 2     | 2.3 Refactor State Management | ⏳ Not Started | - |
| 2     | 2.4 Backward Compatibility | ⏳ Not Started | - |
| 3     | 3.1-3.6 Feature Module Extraction | ⏳ Not Started | - |
| 4     | 4.1-4.3 Main Plugin Refactoring | ⏳ Not Started | - |
| 5     | 5.1-5.4 Testing and Finalization | ⏳ Not Started | - |

### Detailed Progress

#### Phase 2.1: Extract Core Services
- ✅ **Event Management System** (`src/events/`) - Completed 2025-05-21
- ✅ **Logging System** (`src/logging/`) - Completed 2025-05-21
- ✅ **State Management System** (`src/state/`) - Completed 2025-05-21
- ✅ **Metrics Module** (`src/metrics/`) - Completed 2025-05-22
  - Created interface-first structure with `IMetricsProcessor` 
  - Implemented key functionality for metrics analysis
- ✅ **Parsing Module** (`src/parsing/`) - Completed 2025-05-22
  - Created interface-first structure with `IContentParser`
  - Implemented methods for content extraction and processing
- ✅ **File Operations Module** (`src/file-operations/`) - Completed 2025-05-22
  - Created interface-first structure with `IFileOperations`
  - Implemented file management and backup services

#### Phase 2.2: Reorganize Modal Components
- ✅ **Modal Interface** (`src/dom/modals/IModal.ts`) - Completed 2025-05-22
  - Defined consistent contract for all modal dialogs
  - Created compatibility with Obsidian's Modal class
- ✅ **Base Modal Class** (`src/dom/modals/BaseModal.ts`) - Completed 2025-05-22
  - Implemented IModal interface
  - Added enhanced functionality like title and content management
  - Created proper lifecycle management
- ✅ **Modal Components** - Completed 2025-05-22
  - Implemented ConfirmModal for Yes/No confirmations
  - Implemented AlertModal for notifications
  - Created consistent styling using "oom-" prefixed CSS classes
  - Added static helper methods for common use cases

#### Next Target
- 🎯 **Section 2.3: Refactor State Management** - Planned for 2025-05-23

#### Phase 2.3: Refactor State Management
- ⏳ Not Started | -

#### Phase 2.4: Backward Compatibility
- ⏳ Not Started | -

## Implementation Strategy

### Incremental Approach
### Modular Structure
### Testing Guidelines
### Version Control Strategy
### Documentation Approach
### Feature Management During Refactoring

## Timeline and Milestones

### Release Strategy

## Risk Assessment

### Potential Challenges
### Mitigation Strategies
### User Impact Management

## Implementation Examples

### Example 1: Modal Extraction
### Example 2: Metrics Service Extraction
### Example 3: Further Extraction Strategies

## Pre-Implementation Questions

### Q1: Technical Dependencies
### Q2: Backward Compatibility Strategy
### Q3: Feature Freeze Requirements
### Q4: User Impact Assessment
### Q5: Incremental Deployment Strategy
### Q6: Extraction Priorities
### Q7: Test Coverage Requirements
### Q8: Version Control Strategy
### Q9: Regression Testing Approach
### Q10: Documentation Update Plan

## Conclusion

## Implementation Progress Tracking
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
| DreamMetricsEvents.ts | src/events | 317 | Event handling for metrics-related operations |
| CustomDateRangeModal.ts | src/filters | 317 | Modal for selecting custom date ranges |
| TestModal.ts | src/journal_check/ui | 309 | Modal dialog for test operations |
| DateNavigatorView.ts | src/dom | ~300 | Rendering logic for date navigator component |
| DateNavigatorIntegration.ts | src/dom | ~250 | Integration of date navigator with other components |
| DreamMetricsDOM.ts | src/dom | ~200 | DOM manipulation utilities for metrics display |
| DateRangeFilter.ts | src/filters | ~180 | Filter implementation for date range selections |
| timeFilters.ts | src | ~270 | Date-based filtering system (day/week/month granularity) |
| ContentParser.ts | src/journal_check | ~150 | Parses journal content into structured data |
| types.ts | Root | ~120 | Core type definitions used throughout the plugin |
| settings.ts | Root | ~100 | Plugin settings definitions and management |

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

### 2.2 Reorganize Modal Components
- Move all modals to the `src/dom/modals/` directory:
  - `OneiroMetricsModal` → `src/dom/modals/ScrapeModal.ts`
  - `ConfirmModal` → `src/dom/modals/ConfirmModal.ts`
  - Any other embedded modals

### 2.3 Refactor State Management
- Enhance `DreamMetricsState` with proper reactive state management
- Implement observer pattern for state changes
- Create dedicated state slices for different functionality areas

### 2.4 Backward Compatibility Approach

To ensure backward compatibility throughout the refactoring process, we will:

- Use the interface stability approach with adapter classes for complex components
- Define stable public interfaces for key components before extraction
- Implement adapter classes that maintain the same public API while delegating to new implementations
- Maintain settings compatibility with data migration utilities
- Preserve user data with automatic backup and validation tools

This approach minimizes user-visible changes during refactoring while allowing for incremental component replacement.

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

### 5.2 Performance Optimization
- Measure and improve startup time
- Optimize rendering performance
- Reduce memory usage

### 5.3 Documentation
- Update technical documentation using the continuous documentation approach
- Create architecture diagrams
- Document module boundaries and interfaces
- Document component interfaces and usage examples
- Ensure all documentation reflects the refactored architecture

### 5.4 Regression Testing Strategy

To ensure refactoring doesn't break existing functionality, we will use a structured manual testing approach:

- Create comprehensive test scenarios for all core plugin functionality
- Establish a regression testing checklist for verification after each significant change
- Prepare a dedicated test vault with sample journal entries covering all use cases
- Integrate testing into our workflow with clear checkpoints throughout the refactoring process

This approach focuses on practical verification of actual user experience within Obsidian.

## Implementation Strategy

### Incremental Approach
1. Start with high-impact, low-risk extractions
2. Use the "strangler pattern" to gradually replace functionality
3. Keep main.ts working throughout the refactoring process
4. Implement one module at a time with thorough testing

### Modular Structure
```
src/
  analysis/       # Dream content analysis
  dom/            # UI components and DOM manipulation
    components/   # Reusable UI components
    modals/       # Modal dialogs
    views/        # Main view components
  events/         # Event system and dispatchers
  file-ops/       # File operations and vault access
  journal_check/  # Journal validation and checking
  metrics/        # Metrics collection and processing
  parsing/        # Content parsing and extraction
  state/          # State management
  templates/      # Template system
  utils/          # Utility functions
```

### Testing Guidelines
- Each module should have corresponding test files
- Use mocks for Obsidian API dependencies
- Implement both unit and integration tests
- Establish CI/CD pipeline for continuous testing

### Version Control Strategy

The refactoring will use a development branch approach with a single long-lived refactoring branch:

- Create a single `refactoring` branch from `main`
- Perform all refactoring work in this branch
- Only merge back to `main` when the entire refactoring is complete
- Use atomic commits with descriptive messages following a consistent format
- Create tags at the completion of each major phase as "savepoints"

This approach simplifies branch management while keeping all refactoring work isolated from the main branch.

### Documentation Approach

Documentation will be updated continuously alongside code changes:

- Store documentation in version control alongside code
- Update relevant documentation in the same commit as code changes
- Use markdown for all documentation for consistency
- Maintain documentation of module structure, interfaces, data flows, and architectural decisions
- Use a documentation update checklist for each component extraction
- Create documentation templates for common components

This ensures documentation remains current throughout the refactoring process and captures architectural decisions while context is fresh.

### Feature Management During Refactoring

During the refactoring process, we will implement a partial feature freeze with branch-based development for non-critical features:

- Only critical bug fixes, compatibility updates, and documentation will be allowed during refactoring
- Changes will be evaluated using a "Refactoring Impact Assessment" template
- Critical fixes will go to both `main` and `refactoring` branches
- Non-critical features will be developed in feature branches to be integrated later
- The freeze will begin at Phase 2 and end when refactoring is complete

This maintains focus on refactoring while allowing critical work to continue.

## Timeline and Milestones

1. **Week 1-2**: Complete Phases 1 & 2
   - Architecture definition
   - Core services extraction
   - Initial testing setup

2. **Week 3-5**: Complete Phase 3
   - Feature module extraction
   - Component refactoring
   - Initial integration tests

3. **Week 6**: Complete Phase 4
   - Main plugin refactoring
   - Command and settings reorganization

4. **Week 7-9**: Complete Phase 5
   - Comprehensive testing
   - Performance optimization
   - Documentation updates

### Release Strategy

We will use a big bang release approach to deploy all refactored components at once:

- Complete all refactoring work on the dedicated `refactoring` branch
- Perform full regression testing on the entire refactored codebase
- Increment to a new major version number (e.g., v2.0.0)
- Establish clear "go/no-go" criteria for the release
- Prepare comprehensive release notes documenting architectural changes

This approach creates a clean break between old and new architecture while simplifying deployment.

## Risk Assessment

### Potential Challenges
- Maintaining backward compatibility during refactoring
- Handling complex state dependencies
- Obsidian API limitations
- Edge cases in user data

### Mitigation Strategies
- Progressive feature flags
- Careful interface design
- Comprehensive testing
- Regular user feedback cycles

### User Impact Management

Given the plugin's current limited user base, we'll focus on transparent communication:

- Add a dedicated section in README.md about the ongoing refactoring
- Use GitHub release notes as the primary communication channel
- Tag releases during refactoring as "Technical Preview" versions
- Document the technical goals and expected benefits
- Take advantage of the early stage to establish better architecture without complex transition strategies

This approach focuses resources on technical improvements rather than complex rollout strategies.

## Implementation Examples

To illustrate the refactoring approach more concretely, this section provides practical examples of how specific components will be extracted from the main file.

### Example 1: Modal Extraction

This example shows how the `OneiroMetricsModal` component will be extracted from `main.ts` into its own module.

#### Current Implementation (in main.ts)

```typescript
class OneiroMetricsModal extends Modal {
    private plugin: DreamMetricsPlugin;
    private selectionMode: 'notes' | 'folder';
    private selectedNotes: string[];
    private selectedFolder: string;
    private progressContent: HTMLElement;
    private statusText: HTMLElement;
    private progressBar: HTMLElement;
    private progressFill: HTMLElement;
    private detailsText: HTMLElement;
    private scrapeButton: HTMLButtonElement;
    private isScraping: boolean = false;
    private noteDismissed: boolean = false;
    public hasScraped: boolean = false;
    public openNoteButton: HTMLButtonElement;
    public static activeModal: OneiroMetricsModal | null = null;

    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app);
        this.plugin = plugin;
        this.selectionMode = plugin.settings.selectionMode || 'notes';
        this.selectedNotes = plugin.settings.selectedNotes || [];
        this.selectedFolder = plugin.settings.selectedFolder || '';
    }

    // ...rest of implementation...
    
    onOpen() {
        // ...implementation...
    }
    
    onClose() {
        // ...implementation...
    }
}
```

#### Refactored Implementation

##### 1. Create New File: src/dom/modals/ScrapeModal.ts

```typescript
import { App, Modal, Notice, TFile } from 'obsidian';
import type { DreamMetricsPlugin } from '../../../main';
import { createSelectedNotesAutocomplete, createFolderAutocomplete } from '../../../autocomplete';
import { ModalEvents } from '../../events/ModalEvents';

/**
 * Modal for initiating dream journal scraping operations
 */
export class ScrapeModal extends Modal {
    private plugin: DreamMetricsPlugin;
    private selectionMode: 'notes' | 'folder';
    private selectedNotes: string[];
    private selectedFolder: string;
    private progressContent: HTMLElement;
    private statusText: HTMLElement;
    private progressBar: HTMLElement;
    private progressFill: HTMLElement;
    private detailsText: HTMLElement;
    private scrapeButton: HTMLButtonElement;
    private isScraping: boolean = false;
    private noteDismissed: boolean = false;
    public hasScraped: boolean = false;
    public openNoteButton: HTMLButtonElement;
    
    // Track the active instance for plugin access
    public static activeModal: ScrapeModal | null = null;

    // Events that can be subscribed to
    public events = {
        onScrapeStart: new ModalEvents<void>(),
        onScrapeComplete: new ModalEvents<void>(),
        onSettingsOpen: new ModalEvents<void>()
    };

    constructor(app: App, plugin: DreamMetricsPlugin) {
        super(app);
        this.plugin = plugin;
        this.selectionMode = plugin.settings.selectionMode || 'notes';
        this.selectedNotes = plugin.settings.selectedNotes || [];
        this.selectedFolder = plugin.settings.selectedFolder || '';
    }

    /**
     * Update the progress UI with current status
     */
    public updateProgress(percent: number, statusText: string, detailsText?: string): void {
        if (this.progressFill && this.statusText) {
            this.progressFill.style.width = `${percent}%`;
            this.statusText.setText(statusText);
            
            if (detailsText && this.detailsText) {
                this.detailsText.setText(detailsText);
            }
        }
    }

    /**
     * Enable the "Open OneiroMetrics" button after scraping
     */
    public enableOpenButton(): void {
        if (this.openNoteButton) {
            this.openNoteButton.disabled = false;
            this.openNoteButton.title = 'Open the OneiroMetrics note';
            this.openNoteButton.addClass('enabled');
        }
    }

    /**
     * Reset the scrape button state
     */
    public resetScrapeButton(): void {
        if (this.scrapeButton) {
            this.scrapeButton.disabled = false;
            this.isScraping = false;
        }
    }

    onOpen() {
        ScrapeModal.activeModal = this;
        const { contentEl } = this;
        
        // Reset scrape state when modal is opened
        this.hasScraped = false;
        
        // Configure modal container
        this.modalEl.style.width = '600px';
        this.modalEl.style.maxHeight = '80vh';
        this.modalEl.addClass('oom-modal');
        
        // Clear and set up content container
        contentEl.empty();
        contentEl.className = 'modal-content oom-modal';

        // Create title
        contentEl.createEl('h2', { text: 'OneiroMetrics Dream Scrape', cls: 'oom-modal-title' });

        // Add dismissible note
        if (!this.noteDismissed) {
            const noteEl = contentEl.createEl('div', { cls: 'oom-modal-note' });
            noteEl.createEl('strong', { text: 'Note: ' });
            noteEl.createEl('span', { 
                text: 'This is where you kick off the "scraping" process, which searches your selected notes or folder and gathers up dream entries and metrics. Click the Scrape button to begin, or change your files/folder selection, below.'
            });
        }

        this.buildSelectionModeRow(contentEl);
        this.buildSelectorRow(contentEl);
        this.buildActionRow(contentEl);
        this.buildProgressRow(contentEl);
    }

    // Additional methods...
}
```

##### 2. Create Events Module: src/events/ModalEvents.ts

```typescript
/**
 * Simple event system for modal components
 */
export class ModalEvents<T = void> {
    private listeners: Array<(data: T) => void> = [];
    
    /**
     * Add an event listener
     */
    public subscribe(callback: (data: T) => void): () => void {
        this.listeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    
    /**
     * Trigger the event
     */
    public emit(data: T): void {
        this.listeners.forEach(listener => listener(data));
    }
    
    /**
     * Remove all listeners
     */
    public clear(): void {
        this.listeners = [];
    }
}
```

##### 3. Update Main Plugin File

```typescript
// Import the new modal
import { ScrapeModal } from './src/dom/modals/ScrapeModal';

export default class DreamMetricsPlugin extends Plugin {
    // Other plugin code...
    
    /**
     * Open the scrape modal
     */
    openScrapeModal(): void {
        const modal = new ScrapeModal(this.app, this);
        
        // Set up event listeners
        const unsubscribe = modal.events.onScrapeStart.subscribe(() => {
            this.scrapeMetrics();
        });
        
        // Clean up on modal close
        const originalOnClose = modal.onClose;
        modal.onClose = () => {
            unsubscribe();
            originalOnClose.call(modal);
        };
        
        modal.open();
    }
    
    // Rest of plugin implementation...
}
```

#### Benefits of This Approach

1. **Separation of Concerns**: The modal is now self-contained and focused on UI responsibilities
2. **Improved Maintainability**: Smaller, focused files are easier to understand and modify
3. **Enhanced Testability**: The modal can be tested in isolation
4. **Event-Driven Communication**: Clear interfaces between components
5. **Type Safety**: Better type checking with explicit interfaces
6. **Code Reuse**: Modal can be reused in different contexts

### Example 2: Metrics Service Extraction

Another critical component to extract is the metrics processing logic. This example shows how to move metric processing from main.ts to a dedicated service.

#### Current Implementation (in main.ts)

```typescript
private processMetrics(metricsText: string, metrics: Record<string, number[]>): Record<string, number> {
    const result: Record<string, number> = {};
    const metricsRegex = /([^:,]+):\s*(\d+(?:\.\d+)?)/g;
    let match;
    
    while ((match = metricsRegex.exec(metricsText)) !== null) {
        const metricName = match[1].trim();
        const metricValue = parseFloat(match[2]);
        
        if (!isNaN(metricValue)) {
            result[metricName] = metricValue;
            
            // Record for summary statistics
            if (!metrics[metricName]) {
                metrics[metricName] = [];
            }
            metrics[metricName].push(metricValue);
        }
    }
    
    return result;
}

private processDreamContent(content: string): string {
    // Remove markdown formatting
    content = content.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
    content = content.replace(/\*(.*?)\*/g, '$1');     // Italic
    content = content.replace(/~~(.*?)~~/g, '$1');     // Strikethrough
    content = content.replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Links
    content = content.replace(/^\s*#{1,6}\s+(.*)$/gm, '$1'); // Headings
    content = content.replace(/^>\s*(.*?)$/gm, '$1');  // Blockquotes
    
    // Truncate to a reasonable preview length
    if (content.length > 300) {
        content = content.substring(0, 297) + '...';
    }
    
    return content;
}
```

#### Refactored Implementation

##### 1. Create New Files: src/metrics/MetricsService.ts

```typescript
import { DreamMetric } from '../../types';

/**
 * Service for processing and managing dream metrics
 */
export class MetricsService {
    /**
     * Process raw metrics text and extract numeric values
     * 
     * @param metricsText The raw metrics text from a callout
     * @param aggregateMetrics Optional record to update with aggregate metrics data
     * @returns A record of metric names to their values
     */
    public processMetrics(
        metricsText: string, 
        aggregateMetrics?: Record<string, number[]>
    ): Record<string, number> {
        const result: Record<string, number> = {};
        const metricsRegex = /([^:,]+):\s*(\d+(?:\.\d+)?)/g;
        let match;
        
        while ((match = metricsRegex.exec(metricsText)) !== null) {
            const metricName = match[1].trim();
            const metricValue = parseFloat(match[2]);
            
            if (!isNaN(metricValue)) {
                result[metricName] = metricValue;
                
                // Record for summary statistics if provided
                if (aggregateMetrics) {
                    if (!aggregateMetrics[metricName]) {
                        aggregateMetrics[metricName] = [];
                    }
                    aggregateMetrics[metricName].push(metricValue);
                }
            }
        }
        
        return result;
    }
    
    /**
     * Generate summary statistics for a set of metrics
     * 
     * @param metrics Record of metric names to arrays of values
     * @returns Summary statistics including average, min, max, and count
     */
    public generateSummaryStatistics(
        metrics: Record<string, number[]>
    ): Record<string, { avg: number, min: number, max: number, count: number }> {
        const result: Record<string, { avg: number, min: number, max: number, count: number }> = {};
        
        for (const metricName in metrics) {
            const values = metrics[metricName];
            if (values.length) {
                const sum = values.reduce((a, b) => a + b, 0);
                const avg = Math.round((sum / values.length) * 10) / 10;
                const min = Math.min(...values);
                const max = Math.max(...values);
                
                result[metricName] = {
                    avg,
                    min,
                    max,
                    count: values.length
                };
            }
        }
        
        return result;
    }
    
    /**
     * Validate a metric value against its defined range
     * 
     * @param metricName The name of the metric
     * @param value The value to validate
     * @param metrics A map of available metrics definitions
     * @returns Whether the value is valid for the given metric
     */
    public validateMetricValue(
        metricName: string, 
        value: number, 
        metrics: Record<string, DreamMetric>
    ): boolean {
        const metric = metrics[metricName];
        if (!metric) return false;
        
        return value >= metric.range.min && value <= metric.range.max;
    }
}
```

##### 2. Create New Files: src/parsing/ContentProcessor.ts

```typescript
/**
 * Service for processing and sanitizing dream content
 */
export class ContentProcessor {
    /**
     * Clean and format dream content for display
     * 
     * @param content The raw dream content
     * @param maxLength Maximum length for preview content
     * @returns Sanitized content
     */
    public processDreamContent(content: string, maxLength: number = 300): string {
        // Remove markdown formatting
        content = this.removeMarkdownFormatting(content);
        
        // Truncate to a reasonable preview length
        if (content.length > maxLength) {
            content = content.substring(0, maxLength - 3) + '...';
        }
        
        return content;
    }
    
    /**
     * Remove markdown formatting from text
     * 
     * @param text Text with markdown formatting
     * @returns Clean text
     */
    private removeMarkdownFormatting(text: string): string {
        // Remove bold formatting
        text = text.replace(/\*\*(.*?)\*\*/g, '$1');
        
        // Remove italic formatting
        text = text.replace(/\*(.*?)\*/g, '$1');
        
        // Remove strikethrough
        text = text.replace(/~~(.*?)~~/g, '$1');
        
        // Remove links, keeping only the link text
        text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
        
        // Remove headings
        text = text.replace(/^\s*#{1,6}\s+(.*)$/gm, '$1');
        
        // Remove blockquotes
        text = text.replace(/^>\s*(.*?)$/gm, '$1');
        
        // Remove code blocks
        text = text.replace(/```[\s\S]*?```/g, '');
        
        // Remove inline code
        text = text.replace(/`(.*?)`/g, '$1');
        
        return text;
    }
    
    /**
     * Extract only text content from HTML
     * 
     * @param html HTML string
     * @returns Plain text content
     */
    public extractTextFromHtml(html: string): string {
        // Create temporary element to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Extract text content
        const text = temp.textContent || temp.innerText || '';
        
        // Clean up
        return text.trim();
    }
}
```

##### 3. Update Main Plugin File

```typescript
import { MetricsService } from './src/metrics/MetricsService';
import { ContentProcessor } from './src/parsing/ContentProcessor';

export default class DreamMetricsPlugin extends Plugin {
    private metricsService: MetricsService;
    private contentProcessor: ContentProcessor;
    
    async onload() {
        // Initialize services
        this.metricsService = new MetricsService();
        this.contentProcessor = new ContentProcessor();
        
        // Rest of onload...
    }
    
    async scrapeMetrics() {
        // Instead of using the embedded methods, use the services
        const metricsData: Record<string, number[]> = {};
        const dreamEntries: DreamMetricData[] = [];
        
        // Process files...
        
        // When processing metrics text:
        const metrics = this.metricsService.processMetrics(metricsText, metricsData);
        
        // When processing dream content:
        const cleanContent = this.contentProcessor.processDreamContent(content);
        
        // Generate summary statistics:
        const summaryStats = this.metricsService.generateSummaryStatistics(metricsData);
        
        // Update project note...
    }
    
    // Rest of plugin implementation...
}
```

#### Benefits of This Service-Based Approach

1. **Focused Responsibility**: Each service has a single responsibility
2. **Enhanced Reusability**: Services can be used by multiple components
3. **Improved Testability**: Services are easily unit testable
4. **Cleaner Abstraction**: Main plugin focuses on coordination, not implementation
5. **Better Maintainability**: Changes to processing logic only affect the relevant service
6. **Future Extensibility**: New processing features can be added to services without changing consumer code

### Example 3: Further Extraction Strategies

As the refactoring progresses, similar extraction patterns will be applied to:

1. **File Operations Service**: For reading, writing, and backing up files
2. **Table Generation Components**: For creating and updating metric tables
3. **Filter Management**: For date filtering and range selection
4. **Settings Management**: For handling plugin configuration

Each extraction will follow similar principles:
- Identify clear component boundaries
- Extract to appropriate modules
- Create clean interfaces
- Implement event-driven communication
- Reduce dependencies between components

## Pre-Implementation Questions

Before beginning the implementation of this refactoring plan, the following questions should be addressed to ensure a smooth process. Each question includes options and recommendations to guide the decision-making process.

### Q1: Technical Dependencies

**Question:** How should we identify and manage the technical dependencies between components during extraction?

**Options:**
1. **Manual dependency mapping**: Developers identify dependencies through code analysis.
2. **Automated dependency analysis**: Use tools to generate dependency graphs.
3. **Incremental discovery**: Map dependencies for each component just before extraction.
4. **Obsidian-specific custom analysis**: Creating tailored tooling that understands Obsidian plugin architecture.

**Decision:** Use a hybrid approach with initial manual dependency mapping supplemented by a lightweight Obsidian-specific analysis tool.

**Implementation details:**
1. Begin with a manual high-level dependency map of the main components
- Create a visual diagram documenting relationships between:
  - Modal components
  - Service classes
  - Data processing functions
  - UI rendering systems
- Identify both direct dependencies (imports) and indirect dependencies (shared state)

2. Develop a simple Obsidian-specific analysis script that:
- Scans for Obsidian API usage patterns (e.g., `this.app`, `this.plugin`)
- Identifies plugin lifecycle hooks and their consumers
- Maps event emitters and subscribers
- Highlights potential circular dependencies

3. Maintain the dependency documentation as a living document:
- Update the diagram after each component extraction
- Include the dependency map in technical documentation
- Use the map to validate extraction order decisions

**Benefits of this approach:**
- Combines human insight with automated detection
- Accounts for Obsidian-specific patterns that generic tools might miss
- Provides immediate value without significant tooling investment
- Creates useful documentation for current and future developers
- Helps identify non-obvious dependencies that could complicate extraction

**Next actions:**
1. Create initial manual dependency map for the first set of components to be extracted
2. Develop simple script to scan for Obsidian-specific API usage patterns
3. Establish standard for documenting dependencies in component extraction PRs

### Q2: Backward Compatibility Strategy

**Question:** How will we ensure backward compatibility throughout the refactoring process?

**Options:**
1. **Shadow implementation**: Maintain old implementations while building new ones, switching over when complete.
2. **Feature flags**: Use feature flags to toggle between old and new implementations.
3. **Interface stability**: Keep public interfaces stable while refactoring internals.

**Decision:** Use the interface stability approach with adapter classes for complex components.

**Implementation details:**
1. Define stable public interfaces for key components:
   - Document all public methods and properties that are accessed by other parts of the plugin
   - Create formal TypeScript interfaces for each major component being refactored
   - Implement backward compatibility checks in the build process

2. Implement the adapter pattern for complex components:
   - Create adapter classes that maintain the same public API
   - Internally, adapters delegate to the new implementation
   - Example: 
     ```typescript
     // Old API that external code depends on
     class OriginalMetricsProcessor {
         processMetrics(text: string): Record<string, number> { /* ... */ }
     }
     
     // New implementation with improved design
     class ModernMetricsService {
         parseMetricsText(text: string, options?: ParseOptions): MetricsResult { /* ... */ }
     }
     
     // Adapter maintains backward compatibility
     class MetricsProcessorAdapter extends OriginalMetricsProcessor {
         private modernService = new ModernMetricsService();
         
         processMetrics(text: string): Record<string, number> {
             // Adapt new implementation to old interface
             const result = this.modernService.parseMetricsText(text);
             return result.metrics;
         }
     }
     ```

3. Maintain settings compatibility:
   - Create data migration utilities for any changes to settings format
   - Support both old and new settings formats during transition
   - Add deprecation warnings for settings that will change in future

4. User data preservation strategy:
   - Implement automatic backup of user data before applying migrations
   - Create validation tools to ensure data integrity after migration
   - Test migration paths thoroughly with sample data sets

**Benefits of this approach:**
- Minimizes user-visible changes during refactoring
- Allows for incremental component replacement
- Provides clear interfaces for both old and new code
- Reduces risk by isolating changes
- Creates a clean transition path without disruption

**Next actions:**
1. Document existing public interfaces for initial extraction targets
2. Create interface definitions and add to source control
3. Implement first adapter class for the OneiroMetricsModal extraction

**API versioning decision:** We will not implement formal API versioning at this time, but will maintain interface stability through adapter classes. We will revisit API versioning as a separate task after refactoring is complete.

### Q3: Feature Freeze Requirements

**Question:** Do we need a feature freeze during refactoring, and if so, what are its parameters?

**Options:**
1. **Complete feature freeze**: No new features until refactoring is complete.
2. **Partial freeze**: Only critical features/fixes allowed during refactoring.
3. **Branch-based development**: New features developed in separate branches to be integrated after refactoring.

**Decision:** Implement a partial freeze with branch-based development for non-critical features.

**Implementation details:**
1. Establish clear criteria for changes allowed during refactoring:
   - **Critical bug fixes**: Security issues, data loss prevention, crashes
   - **Compatibility updates**: Required changes for new Obsidian versions
   - **Documentation improvements**: Non-code changes to documentation

2. Define process for evaluating change requests:
   - Create a "Refactoring Impact Assessment" template for proposed changes
   - Require impact assessment to answer:
     - How critical is this change? (High/Medium/Low)
     - Which components does it affect?
     - What is the risk to refactoring work?
     - Can it be deferred until after refactoring?
   - Changes with "High" criticality and "Low" refactoring impact get approved
   - Other changes are developed in feature branches to be integrated later

3. Branch management strategy:
   - Maintain the `refactoring` branch as the main integration target
   - Critical fixes go to both `main` and `refactoring` branches
   - Non-critical features are developed in `feature/*` branches
   - Feature branches start from `main` but aren't merged until after refactoring
   - Track deferred features in a dedicated project board

4. Timeline considerations:
   - Partial freeze begins at the start of Phase 2 (Core Infrastructure Refactoring)
   - Critical-only period during Phase 3 (Feature Module Extraction)
   - End freeze when refactoring branch is merged back to main

**Benefits of this approach:**
- Maintains focus on refactoring without blocking critical work
- Provides clear decision framework for new changes
- Allows parallel development for non-critical features
- Reduces merge conflicts during refactoring
- Keeps project momentum without derailing refactoring effort

**Next actions:**
1. Create the Refactoring Impact Assessment template
2. Set up project board for tracking deferred features
3. Communicate freeze parameters to all developers
4. Schedule regular review meetings to assess change requests

### Q4: User Impact Assessment

**Question:** What user-facing impacts might occur during refactoring, and how will we manage them?

**Options:**
1. **Zero impact goal**: Structure refactoring to ensure users experience no changes.
2. **Staged rollout**: Release refactored components to beta users first.
3. **Transparent communication**: Clearly communicate potential issues to users.

**Decision:** Focus on transparent communication (Option 3), given the plugin's current limited user base.

**Implementation details:**
1. Create transparent documentation about the refactoring:
   - Add a dedicated section in README.md about the ongoing refactoring
   - Document the technical goals and expected benefits
   - Maintain a "Current Status" section that's updated with each release

2. Simplify the communication approach:
   - Use GitHub release notes as the primary communication channel
   - Tag releases during refactoring as "Technical Preview" versions
   - Provide clear documentation of any known issues or changes

3. Leverage the small user base as an advantage:
   - Invite early adopters to provide direct feedback
   - Create an informal beta testing group if interest emerges
   - Use the low-profile nature to make more ambitious refactoring choices

4. Prepare for future growth:
   - Document all decisions for future maintainers
   - Focus on creating a solid foundation rather than backward compatibility
   - Prioritize clean interfaces that will support future users

**Benefits of this approach:**
- Focuses resources on technical improvements rather than complex rollout strategies
- Takes advantage of the early stage to establish better architecture
- Avoids unnecessary complexity in managing user transitions
- Creates transparent history of the project's evolution
- Sets foundation for more formal processes as user base grows

**Next actions:**
1. Create the refactoring documentation section in README.md
2. Set up a simple feedback mechanism for early users
3. Establish a release notes template for refactoring updates

### Q5: Incremental Deployment Strategy

**Question:** How should the refactored code be deployed to users?

**Options:**
1. **Big bang release**: Deploy all refactored components in one major version update.
2. **Incremental releases**: Release refactored components as they're completed.
3. **Opt-in beta program**: Allow users to test refactored components before general release.

**Decision:** Use a big bang release approach (Option 1) to deploy all refactored components at once.

**Implementation details:**
1. Comprehensive preparation for the release:
   - Complete all refactoring work on a dedicated long-lived branch
   - Perform full regression testing on the entire refactored codebase
   - Create thorough release notes documenting all architectural changes
   - Develop comprehensive migration tools for any data format changes

2. Version strategy:
   - Increment to a new major version number (e.g., v2.0.0)
   - Create a clear cut-off point between old and new architecture
   - Ensure the version bump is clearly visible to users and in documentation

3. Release readiness criteria:
   - Establish clear "go/no-go" criteria for the release
   - Require all tests to pass on the refactored branch
   - Verify all critical user flows work as expected
   - Complete all documentation updates before release

4. Post-release support:
   - Maintain ability to create critical fixes for the previous version if needed
   - Focus team resources on the new version after release
   - Create a quick-response plan for addressing any critical issues after release

**Benefits of this approach:**
- Simplifies the deployment strategy
- Avoids maintaining multiple versions of components
- Creates a clean break from old to new architecture
- Allows for more comprehensive testing of the entire system
- Fits well with the plugin's current limited user base
- Avoids complex compatibility layers between old and new components

**Next actions:**
1. Create the refactoring branch in the repository
2. Establish the release readiness criteria
3. Set up the comprehensive testing plan for the final release
4. Begin documenting expected changes for the release notes

### Q6: Extraction Priorities

**Question:** Which specific components have the highest extraction priority?

**Options:**
1. **Complexity-based prioritization**: Extract the most complex components first.
2. **Dependency-based prioritization**: Extract components with fewest dependencies first.
3. **Impact-based prioritization**: Extract components with highest user impact first.

**Decision:** Use dependency-based prioritization (Option 2) to extract components with the fewest dependencies first.

**Implementation details:**
1. First extraction wave - independent utility components:
   - Standalone utility functions (e.g., date formatting, content processing)
   - Modal components (OneiroMetricsModal, ConfirmModal)
   - Simple data processing functions (processDreamContent, processMetrics)
   - Logging system (already partially modularized)

2. Second extraction wave - service modules:
   - File operation utilities
   - Event handling systems
   - Content parsing services
   - Table generation functions

3. Third extraction wave - state management:
   - Data filtering system
   - Settings management
   - Project state management
   - Component interaction orchestration

4. Final extraction - core plugin functionality:
   - Plugin lifecycle management
   - Command registration and handling
   - Central coordination logic
   - Public API surface

**Component-specific extraction order:**
1. ModalSystem: OneiroMetricsModal → ConfirmModal → other modals
2. ContentProcessing: processDreamContent → processMetrics → generateSummaryTable
3. UIComponents: table generation → expandable sections → filters
4. CoreServices: file operations → event system → state management

**Benefits of this approach:**
- Reduces refactoring risk by starting with the most isolated components
- Creates early successes and momentum for the refactoring effort
- Establishes patterns for extraction that can be reused for more complex components
- Allows for incremental testing of extracted components
- Aligns with the strangler pattern mentioned in the implementation strategy
- Builds a foundation of well-tested modules before tackling core functionality

**Next actions:**
1. Create detailed dependency map for components in the first extraction wave
2. Establish extraction templates and patterns (folder structure, naming conventions)
3. Begin extraction of the modal components as described in Example 1
4. Create unit tests for the first wave of utility functions to be extracted

### Q7: Test Coverage Requirements

**Question:** What test coverage thresholds are required for refactored code?

**Options:**
1. **Comprehensive coverage**: 80%+ coverage for all code.
2. **Critical path coverage**: Focus testing on the most critical functionality.
3. **Incremental improvement**: Set coverage thresholds slightly above existing levels.

**Decision:** Use critical path coverage (Option 2) with a practical manual testing approach suited for Obsidian plugin development by a solo developer.

**Implementation details:**
1. Manual testing workflow for critical functionality:
   - Create a test vault dedicated to plugin testing
   - Document step-by-step test scenarios for critical features
   - Establish testing checklists for key user workflows:
     - Dream journal entry creation
     - Metrics calculation and display
     - Project note generation and updates
     - Template usage and management
   - Test each refactored component directly in Obsidian as it's completed

2. Pragmatic automated testing where feasible:
   - Add basic unit tests for easily testable utility functions
   - Focus on functions that process data or perform calculations
   - Use simple test harnesses that can run outside of Obsidian
   - Prioritize testing code with complex logic or important data handling

3. Test documentation as a primary deliverable:
   - Create a `TESTING.md` document with detailed test procedures
   - Include screenshots of expected results where appropriate
   - Document edge cases and potential failure modes
   - Update test documentation alongside code changes

4. Tiered testing priorities:
   - **Essential (must test thoroughly)**: Data processing, metrics calculation, settings management
   - **Important (test main workflows)**: UI components, modal interactions, project note generation
   - **Basic (smoke test)**: Visual elements, formatting utilities, documentation helpers

**Benefits of this approach:**
- Practical for a solo developer workflow
- Focuses testing effort on the most critical functionality
- Creates reusable test documentation for future development
- Balances manual and automated testing appropriately
- Acknowledges the realities of Obsidian plugin development
- Prevents testing overhead from stalling refactoring progress

**Next actions:**
1. Create the dedicated test vault with sample dream journal entries
2. Document the critical test scenarios in TESTING.md
3. Establish a testing checklist template for component extraction
4. Set up a minimal test harness for key utility functions

### Q8: Version Control Strategy

**Question:** What branching and merging strategy should be used for the refactoring?

**Options:**
1. **Feature branches**: Create branches for each component extraction.
2. **Development branch**: Perform all refactoring in a single long-lived branch.
3. **Trunk-based development**: Make small, incremental changes to main branch.

**Decision:** Use a development branch approach (Option 2) with a single long-lived refactoring branch.

**Implementation details:**
1. Branch structure:
   - Create a single `refactoring` branch from `main`
   - Perform all refactoring work in this branch
   - Only merge back to `main` when the entire refactoring is complete
   - Use the commit history to document progress rather than multiple branches

2. Commit strategy:
   - Use atomic commits focused on specific changes
   - Group commits logically by component or feature
   - Use descriptive commit messages with consistent format:
     ```
     extract: [component name] - Brief description
     
     - Detailed description of changes
     - Mention any implementation details or decisions
     - Reference any relevant documentation
     ```
   - Include refactoring stage in commit message (e.g., "Phase 1: Extract modal components")

3. Documentation within commits:
   - Document why decisions were made, not just what changed
   - Include reference to this refactoring plan when appropriate
   - Link to relevant architectural discussions or examples
   - Note any deviations from the plan and the reasoning

4. Quality checkpoints:
   - Create tags at the completion of each major phase
   - Ensure the plugin builds and works at each checkpoint
   - Consider each phase a "savepoint" in the refactoring process
   - Document testing performed at each checkpoint

**Benefits of this approach:**
- Simplifies branch management for a solo developer
- Keeps all refactoring work isolated from the main branch
- Maintains a clean history of the refactoring process
- Aligns well with the chosen "big bang release" deployment strategy
- Makes it easier to track progress through the refactoring plan
- Reduces context switching between branches

**Next actions:**
1. Create the `refactoring` branch from current `main`
2. Add initial refactoring plan documentation to the branch
3. Establish commit message template for the refactoring work
4. Set up initial phase checkpoint tag

### Q9: Regression Testing Approach

**Question:** How will we ensure that refactoring doesn't break existing functionality?

**Options:**
1. **Manual testing**: Follow test scripts for critical functionality.
2. **Automated end-to-end tests**: Create comprehensive automated tests.
3. **User beta testing**: Rely on user feedback to catch regression issues.

**Decision:** Use manual testing (Option 1) with structured test scripts for critical functionality.

**Implementation details:**
1. Create comprehensive test scenarios:
   - Document all core plugin functionality with step-by-step test procedures
   - Focus on critical user flows that must continue to work correctly:
     - Creating and editing dream journal entries
     - Extracting metrics from journal entries
     - Generating and updating project notes
     - Using templates for journal entries
   - Include test cases for edge cases and error handling

2. Establish a regression testing checklist:
   - Create a checklist of core features to test after each significant refactoring step
   - Include verification of UI elements, data processing, and file operations
   - Use a structured format for tracking test results:
     ```
     ## Core Functionality Test Checklist
     
     | Feature | Steps | Expected Result | Status | Notes |
     |---------|-------|-----------------|--------|-------|
     | Dream metrics extraction | 1. Open test note<br>2. Add callout with metrics<br>3. Run extraction | Metrics appear in project note | ✅ | |
     ```

3. Test vault preparation:
   - Create a dedicated test vault with sample journal entries
   - Include examples of all supported formats and edge cases
   - Maintain consistent test data throughout the refactoring process
   - Document the structure and purpose of test files

4. Testing workflow integration:
   - Perform structured testing at each checkpoint in the refactoring process
   - Document test results directly in commit messages
   - Address any regressions immediately before proceeding
   - Retest affected features after fixing regressions

**Benefits of this approach:**
- Practical for a solo developer without a testing team
- Focuses on actual user experience within Obsidian
- Creates valuable documentation of expected behavior
- Avoids overhead of maintaining complex automated tests
- Builds confidence in the refactoring process
- Provides clear verification of continued functionality

**Next actions:**
1. Create the regression testing checklist document
2. Set up the dedicated test vault with sample journal entries
3. Document test scenarios for core functionality
4. Establish the testing workflow to integrate with refactoring checkpoints

### Q10: Documentation Update Plan

**Question:** How will technical documentation be kept in sync with code changes?

**Options:**
1. **Post-refactoring update**: Update all documentation after refactoring is complete.
2. **Continuous documentation**: Update documentation alongside code changes.
3. **Auto-generated documentation**: Use tools to generate documentation from code.

**Decision:** Use continuous documentation (Option 2) to update documentation alongside code changes.

**Implementation details:**
1. Documentation-as-code workflow:
   - Store documentation in version control alongside code
   - Update relevant documentation in the same commit as code changes
   - Use markdown for all documentation for consistency and ease of updating
   - Establish a clear documentation structure that mirrors code organization

2. Key documentation to maintain:
   - Module structure and responsibilities
   - Public interfaces between components
   - Data flow diagrams for key processes
   - Configuration options and formats
   - Test scenarios and expected results
   - Architectural decisions and rationales

3. Documentation update checklist:
   - For each component extraction, update:
     - Component interface documentation
     - Architecture overview diagrams
     - Module dependency documentation
     - Usage examples where relevant
   - Use a simple checklist in commit messages:
     ```
     - [x] Updated interface documentation
     - [x] Updated architecture diagram
     - [x] Updated usage examples
     ```

4. Practical implementation for a solo developer:
   - Create documentation templates for common components
   - Set aside dedicated time for documentation after each significant change
   - Use simple tools (markdown, basic diagrams) to reduce overhead
   - Focus on documenting what will be most useful for future maintenance

**Benefits of this approach:**
- Documentation remains current throughout the refactoring process
- Reduces the burden of large documentation updates at the end
- Captures architectural decisions while context is fresh
- Serves as a developer note system during complex refactoring
- Creates a valuable record of the transformation process
- Provides reference material for future development

**Next actions:**
1. Create templates for component documentation
2. Update the architecture overview diagram to reflect planned changes
3. Establish standard locations for different types of documentation
4. Add documentation review to the checkpoint process

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

This comprehensive approach ensures the refactoring will proceed methodically with appropriate attention to technical quality, user impact, and long-term maintainability. 
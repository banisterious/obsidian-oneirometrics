# Additional OneiroMetrics Component Inventory

This document contains inventories of several significant TypeScript files in the OneiroMetrics codebase, complementing the main component inventory of `main.ts`.

## 1. LintingEngine.ts (src/journal_check/LintingEngine.ts)

### Overview
The LintingEngine (later renamed to JournalStructureValidator) is responsible for validating dream journal entries against defined structures, rules, and templates. It has 511 lines of code.

### Class: LintingEngine
- **Purpose**: Core engine for validating dream journal entries against defined structures
- **Properties**:
  - `rules`: Array of LintingRule objects
  - `structures`: Array of CalloutStructure objects
  - `templates`: Array of JournalTemplate objects
  - `contentParser`: Instance of ContentParser
  - `templaterIntegration`: Instance of TemplaterIntegration or null
  - `plugin`: Reference to main plugin instance
  - `settings`: Linting settings
- **Methods**:
  - `constructor(plugin: DreamMetricsPlugin, settings: LintingSettings)`: Initializes the engine
  - `validate(content: string, templateId?: string)`: Validates content against all enabled rules
  - `applyQuickFix(content: string, result: ValidationResult, fixIndex: number)`: Applies a quick fix to content
  - `getTemplateForContent(content: string)`: Gets a template that best matches the content structure
  - `private detectStructure(content: string)`: Detects which structure the content most likely follows
  - `private validateRule(content: string, rule: LintingRule)`: Validates content against a specific rule
  - `private validateStructure(content: string, calloutBlocks: any[], structure: CalloutStructure)`: Validates content against a structure
  - `private validateNestedStructure(content: string, calloutBlocks: any[], structure: CalloutStructure)`: Validates content with nested callouts
  - `private isBlockNestedProperly(block: any, parentBlock: any)`: Checks if a block is nested properly
  - `private validateCalloutContent(content: string, block: any, structure: CalloutStructure)`: Validates callout content
  - `private createStructureResult(id: string, message: string, content: string, start: number, end: number, severity: string, quickFixes?: QuickFix[])`: Creates a validation result for structure issues
  - `private createResult(rule: LintingRule, content: string, start: number, end: number, quickFixes?: QuickFix[])`: Creates a validation result
  - `private createAddRootCalloutFix(structure: CalloutStructure)`: Creates a quick fix for adding a root callout
  - `private createAddChildCalloutFix(structure: CalloutStructure, calloutType: string)`: Creates a quick fix for adding a child callout
  - `private createAddMetricsCalloutFix(structure: CalloutStructure)`: Creates a quick fix for adding a metrics callout
  - `private createFixNestingFix(block: any, rootCallout: any)`: Creates a quick fix for fixing nesting issues

### Dependencies
- DreamMetricsPlugin from main.ts
- Types from ./types
- ContentParser from ./ContentParser
- TemplaterIntegration from ./TemplaterIntegration

### Extraction Recommendations
- This class should be renamed to JournalStructureValidator for clarity
- Extract validation logic into separate strategy classes based on structure type
- Move quick fix generation to a dedicated QuickFixGenerator class
- Create a dedicated ValidationResultFactory for result creation

## 2. DreamJournalManager.ts (src/journal_check/ui/DreamJournalManager.ts)

### Overview
The DreamJournalManager provides a unified interface for managing all aspects of dream journaling, including scraping, structure validation, and template management. It has 856 lines of code.

### Class: DreamJournalManager
- **Purpose**: Unified interface for managing dream journal entries and settings
- **Properties**:
  - `mainContentEl`: Main content element
  - `templaterIntegration`: Reference to TemplaterIntegration
  - `sections`: Object mapping section IDs to HTML elements
  - `plugin`: Reference to the main plugin instance
  - `initialTab`: Initial tab to display
  - Dream scraping properties (duplicating OneiroMetricsModal functionality):
    - `selectionMode`: 'notes' or 'folder'
    - `selectedNotes`: Array of selected note paths
    - `selectedFolder`: Selected folder path
    - `progressContent`, `statusText`, `progressBar`, `progressFill`, `detailsText`: UI components
    - `scrapeButton`: Button to initiate scraping
    - `isScraping`: Flag indicating whether scraping is in progress
    - `noteDismissed`: Flag for dismissible note state
    - `hasScraped`: Flag indicating whether scraping has been performed
    - `openNoteButton`: Button to open the metrics note
    - `static activeModal`: Reference to the currently active modal instance
- **Methods**:
  - `constructor(app: App, plugin: DreamMetricsPlugin, initialTab: string)`: Initializes the modal
  - `onOpen()`: Sets up the UI when the modal opens
  - `onClose()`: Cleans up when the modal is closed
  - `private buildSidebar(containerEl: HTMLElement)`: Builds the sidebar navigation
  - `private showSection(sectionId: string)`: Shows the specified section and hides all others
  - `private createCollapsibleSection(containerEl: HTMLElement, title: string, expanded: boolean)`: Creates a collapsible section
  - `private createQuickActionButton(containerEl: HTMLElement, label: string, icon: string, callback: () => void)`: Creates a quick action button
  - `private buildDashboardSection()`: Builds the dashboard section
  - `private buildDreamScrapeSection()`: Builds the dream scrape section
  - `private buildJournalStructureSection()`: Builds the journal structure section
  - `private buildTemplatesSection()`: Builds the templates section
  - `private buildContentIsolationSection()`: Builds the content isolation section
  - `private buildInterfaceSection()`: Builds the interface section
  - `private getDefaultLintingSettings()`: Gets default linting settings
  - `public updateProgress(current: number, total: number, message: string, details: string)`: Updates the progress display

### Dependencies
- Obsidian components (App, Modal, Setting, etc.)
- DreamMetricsPlugin from main.ts
- Types from ../types
- TemplaterIntegration from ../TemplaterIntegration
- TemplateWizard from ./TemplateWizard
- Autocomplete functions from autocomplete.ts

### Extraction Recommendations
- Extract each section into a separate component (Dashboard, DreamScrapePanel, JournalStructurePanel, etc.)
- Create a common TabManager to handle tab switching and sidebar
- Separate Dream Scrape functionality from UI representation
- Create a ProgressManager to handle progress updates

## 3. DateNavigatorModal.ts (src/dom/DateNavigatorModal.ts)

### Overview
The DateNavigatorModal provides a hierarchical date navigation interface with year, month, and day views. It has 437 lines of code.

### Enums
- **NavigatorViewMode**: Defines view modes for hierarchical navigation
  - `YEAR_VIEW`: Year selection view
  - `MONTH_VIEW`: Month selection view
  - `DAY_VIEW`: Day selection view (calendar)

### Class: DateNavigatorModal
- **Purpose**: Modal dialog for date navigation and filtering
- **Properties**:
  - `dateNavigator`: Instance of DateNavigator
  - `integration`: Instance of DateNavigatorIntegration
  - `state`: DreamMetricsState instance
  - `timeFilterManager`: TimeFilterManager instance
  - `currentViewMode`: Current view mode (year, month, or day)
  - `selectedYear`, `selectedMonth`, `selectedDay`: Selected date components
  - `selectedDate`: Selected date object
  - `breadcrumbContainer`: Breadcrumb navigation container
  - `viewContainer`: Container for different views
  - `yearViewContainer`, `monthViewContainer`, `dayViewContainer`: Containers for specific views
  - `static activeModal`: Reference to the currently active modal instance
- **Methods**:
  - `constructor(app: App, state: DreamMetricsState, timeFilterManager: TimeFilterManager)`: Initializes the modal
  - `onOpen()`: Sets up the UI when the modal opens
  - `navigateToToday()`: Navigates to today's date
  - `navigateToMonth(date: Date)`: Navigates to a specific month
  - `selectDay(date: Date)`: Selects a specific day
  - `setViewMode(mode: NavigatorViewMode)`: Sets the current view mode and updates UI
  - `private renderYearView()`: Renders the year selection view
  - `private renderMonthView()`: Renders the month selection view
  - `private updateBreadcrumbs()`: Updates the breadcrumb navigation
  - `onClose()`: Cleans up when the modal is closed
  - `private handleDateSelection`: Event handler for date selection

### Dependencies
- Obsidian components (App, Modal, Notice)
- DateNavigator from ./DateNavigator
- DreamMetricsState from ../state/DreamMetricsState
- DateNavigatorIntegration from ./DateNavigatorIntegration
- TimeFilterManager from ../timeFilters
- date-fns functions (startOfDay, endOfDay, startOfYear, getYear)

### Extraction Recommendations
- Create separate view components for each view mode (YearView, MonthView, DayView)
- Extract breadcrumb navigation into a reusable component
- Create a DateSelectionManager to handle date selection logic
- Move filter application logic to a separate service
- Implement proper state management for view transitions 

## 4. autocomplete.ts (root)

### Overview
The autocomplete.ts file provides reusable functions for creating autocomplete components for selecting notes and folders. It has 317 lines of code.

### Functions

#### `createSelectedNotesAutocomplete`
- **Purpose**: Creates a multi-selection autocomplete component for selecting notes
- **Parameters**:
  - `options`: Object containing initialization parameters:
    - `app`: Obsidian App instance
    - `plugin`: Plugin instance
    - `containerEl`: Container HTML element
    - `selectedNotes`: Array of selected note paths
    - `onChange`: Callback function for selection changes
- **Internal Functions**:
  - `renderChips()`: Renders selected notes as chips
  - `hideSuggestions()`: Hides suggestion dropdown
  - `showSuggestions()`: Shows suggestion dropdown
- **Event Handlers**:
  - Input event: Filters and displays matching notes
  - Click event: Handles selecting suggestions and UI interactions
  - Keydown event: Handles keyboard navigation and selection
- **Returns**: Object containing input, chipsContainer, and suggestionContainer elements

#### `createFolderAutocomplete`
- **Purpose**: Creates an autocomplete component for selecting a folder
- **Parameters**:
  - `options`: Object containing initialization parameters:
    - `app`: Obsidian App instance
    - `plugin`: Plugin instance
    - `containerEl`: Container HTML element
    - `selectedFolder`: Currently selected folder path
    - `onChange`: Callback function for folder selection changes
- **Internal Functions**:
  - `getFolders()`: Gets a list of folders in the vault
  - `hideSuggestions()`: Hides suggestion dropdown
  - `showSuggestions(query: string)`: Shows suggestions filtered by query
- **Event Handlers**:
  - Input event: Filters and displays matching folders
  - Focus/Blur events: Shows/hides suggestions
  - Click events: Handles selection and UI interactions
- **Returns**: No explicit return value

### Dependencies
- Obsidian components (App, TFile, TFolder, Plugin)

### Extraction Recommendations
- Create a generic AutocompleteFactory class with specialized implementations
- Extract common DOM manipulation logic to a separate utility
- Create proper TypeScript interfaces for all parameters and return types
- Implement better event management with proper cleanup
- Add accessibility features for keyboard navigation and screen readers

## 5. DreamMetricsState.ts (src/state/DreamMetricsState.ts)

### Overview
The DreamMetricsState class provides state management for dream metrics data, enabling reactive updates and persistence. It has 71 lines of code.

### Class: DreamMetricsState
- **Purpose**: Manages state for dream metrics data and UI state
- **Properties**:
  - `expandedStates`: Map of content IDs to expanded state (boolean)
  - `metrics`: Record of metric IDs to DreamMetric objects
  - `dreamEntries`: Array of DreamMetricData objects
  - `listeners`: Set of callback functions for state changes
  - `settings`: DreamMetricsSettings object
- **Methods**:
  - `constructor(settings: DreamMetricsSettings)`: Initializes the state
  - `toggleExpandedState(contentId: string, isExpanded: boolean)`: Updates a content's expanded state
  - `getExpandedState(contentId: string)`: Gets a content's expanded state
  - `updateMetrics(metrics: Record<string, DreamMetric>)`: Updates metrics data
  - `updateDreamEntries(entries: DreamMetricData[])`: Updates dream entries data
  - `getMetrics()`: Gets all metrics data
  - `getDreamEntries()`: Gets all dream entries
  - `subscribe(listener: () => void)`: Adds a state change listener and returns unsubscribe function
  - `private notifyListeners()`: Notifies all listeners of state changes
  - `getStateSummary()`: Gets a JSON summary of the current state (for debugging)
  - `saveSettings()`: Saves settings (implementation placeholder)
  - `loadSettings()`: Loads settings (implementation placeholder)

### Dependencies
- Types from ../types (DreamMetric, DreamMetricData, DreamMetricsSettings)

### Extraction Recommendations
- Implement a proper state management pattern (Redux, MobX, or custom Observable)
- Add persistence layer with proper serialization/deserialization
- Create separate state slices for different domains (metrics, entries, UI state)
- Add undo/redo functionality
- Implement better type safety and immutability 
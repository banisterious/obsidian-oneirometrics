// Copyright (c) 2025 John Banister
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// Import the safe logger immediately at the top
import safeLogger, { getSafeLogger, SafeLogger, initializeSafeLogger } from './src/logging/safe-logger';

// Import getLogger but not LoggingAdapter since it's imported elsewhere
import { getLogger } from './src/logging';

/**
 * IMPORTANT: This file uses a globalLogger pattern for backward compatibility 
 * with older parts of the codebase and to support global utility functions.
 * 
 * The globalLogger is initialized with safeLogger first for early logging,
 * then upgraded to the full structured logging system once the plugin is loaded.
 * 
 * New code should use the structured logging system directly via:
 *   import { getLogger } from './src/logging';
 *   const logger = getLogger('ComponentName');
 */

// Create a global logger instance for functions outside the plugin class
// Initialize with safe logger first, but will be replaced with structured logger during plugin initialization
let globalLogger: any = safeLogger;

// Import test modals
import { openContentParserTestModal, openDateUtilsTestModal, openServiceRegistryTestModal } from './src/testing';
import { DefensiveUtilsTestModal } from './src/testing/utils/defensive-utils-test-modal';

// Import Service Registry
import { 
  ServiceRegistry, 
  getServiceRegistry, 
  registerService, 
  getService, 
  SERVICE_NAMES 
} from './src/state/ServiceRegistry';

// Import log viewer UI components
import { initializeLogUI } from './src/logging/ui';

// External imports (Obsidian)
import { 
  App, 
  Editor, 
  FileSystemAdapter, 
  MarkdownView, 
  MetadataCache, 
  Modal, 
  Notice, 
  Plugin, 
  Setting, 
  TFile, 
  TFolder, 
  Vault, 
  parseYaml,
  parseFrontMatterEntry,
  parseFrontMatterTags,
  MarkdownRenderer,
  MarkdownPreviewView,
  PluginSettingTab,
  addIcon
} from 'obsidian';

// External libraries
import { 
  format,
  addDays
} from 'date-fns';

// Internal imports - Types
import { 
  DEFAULT_LOGGING, 
  DEFAULT_METRICS, 
  DreamMetric, 
  DreamMetricData, 
  DreamMetricsSettings, 
  LogLevel,
  JournalStructureSettings,
  SelectionMode,
  CalloutMetadata
} from './types';

// Internal imports - Helper functions
import {
  getProjectNotePath,
  setProjectNotePath,
  getSelectedFolder,
  setSelectedFolder,
  getSelectionMode,
  setSelectionMode,
  isBackupEnabled,
  getBackupFolderPath,
  getLogMaxSize,
  shouldShowRibbonButtons,
  setShowRibbonButtons,
  getJournalStructure,
  setJournalStructure
} from './src/utils/settings-helpers';

import {
  validateDate,
  parseDate,
  formatDate
} from './src/utils/date-utils';

import {
  isMetricEnabled,
  setMetricEnabled,
  getMetricMinValue,
  getMetricMaxValue,
  setMetricRange,
  getMetricRange,
  standardizeMetric
} from './src/utils/metric-helpers';

import {
  getSourceFile,
  getSourceId,
  isObjectSource,
  createSource,
  isCalloutMetadataArray
} from './src/utils/type-guards';

import {
  isFolderMode,
  isNotesMode,
  areSelectionModesEquivalent,
  getSelectionModeLabel,
  normalizeSelectionMode
} from './src/utils/selection-mode-helpers';

// Import the SettingsAdapter from state/adapters
import { SettingsAdapter, createAndRegisterSettingsAdapter } from './src/state/adapters/SettingsAdapter';
import { SettingsManager } from './src/state/SettingsManager';
import { MetricsProcessor, DreamMetricsProcessor, MetricsCollector } from './src/metrics';

// Import EventHandling utilities for event handling
import { attachClickEvent } from './src/templates/ui/EventHandling';

// For backward compatibility with legacy types
import { LintingSettings, Timeline, CalendarView, ActiveJournal } from './types';

// Internal imports - Settings
import { DreamMetricsSettingTab, lucideIconMap, RECOMMENDED_METRICS_ORDER, DISABLED_METRICS_ORDER, sortMetricsByOrder } from './settings';
import { createFolderAutocomplete, createSelectedNotesAutocomplete } from './autocomplete';

// Internal imports - Logging
import { LoggingAdapter } from './src/logging';

// Internal imports - UI Components
import { CustomDateRangeModal } from './src/dom/modals';
import {
    DateNavigatorModal,
    NavigatorViewMode,
    DateNavigatorView,
    DATE_NAVIGATOR_VIEW_TYPE,
    DateNavigatorIntegration
} from './src/dom/date-navigator';
import { DateRangeService, DateFilter } from './src/dom/filters';

// Import UI components from journal_check/ui using individual imports instead of barrel file
import { 
  DreamJournalManager 
} from './src/journal_check/ui/DreamJournalManager';
import { JournalStructureModal } from './src/journal_check/ui/JournalStructureModal';
import { TestModal } from './src/journal_check/ui/TestModal';
import { TemplateWizard } from './src/journal_check/ui/TemplateWizard';

// Internal imports - Services
import { LintingEngine } from './src/journal_check/LintingEngine';
import { TemplaterIntegration } from './src/journal_check/TemplaterIntegration';
import { TimeFilterManager } from './src/timeFilters';
import { DreamMetricsState } from './src/state/DreamMetricsState';

import { ContentParser } from './src/parsing/services/ContentParser';
import { DateUtilsTestModal } from './src/testing/utils/DateUtilsTestModal';

// Import the DEFAULT_JOURNAL_STRUCTURE_SETTINGS constant directly from the source
import { DEFAULT_JOURNAL_STRUCTURE_SETTINGS } from './src/types/journal-check';

// Add near the top with other imports
import { runSettingsHelpersTests } from './src/testing/utils/SettingsHelpersTests';
import { runMetricHelpersTests } from './src/testing/utils/MetricHelpersTests';
import { runSelectionModeHelperTests } from './src/testing/utils/SelectionModeHelpersTests';
import { runTypeGuardsTests } from './src/testing/utils/TypeGuardsTests';
import { runPropertyHelpersTests } from './src/testing/utils/PropertyHelpersTests';
import { runContentParserParameterTests } from './src/testing/run-content-parser-tests';
import { runSettingsAdapterTests } from './src/testing/utils/SettingsAdapterTests';
import { runEventHandlingTests } from './src/testing/utils/EventHandlingTests';
import { runComponentFactoryTests } from './src/testing/utils/ComponentFactoryTests';
import { runDreamMetricsStateTests } from './src/testing/DreamMetricsStateTests';

import { MetricsTabsModal } from './src/dom/modals/MetricsTabsModal';

// Move this to the top of the file, before any functions that use it
let customDateRange: { start: string, end: string } | null = null;

// Default settings for linting functionality
const DEFAULT_LINTING_SETTINGS: LintingSettings = {
    enabled: true,
    rules: [
        {
            id: 'dream-callout-required',
            name: 'Dream Callout Required',
            description: 'Requires the dream callout in journal entries',
            type: 'structure',
            severity: 'error',
            enabled: true,
            pattern: '> \\[!dream\\]',
            message: 'Dream journal entries must include a dream callout',
            priority: 10
        }
    ],
    structures: [
        {
            id: 'default-dream-structure',
            name: 'Default Dream Structure',
            description: 'Standard dream journal structure with required callouts',
            type: 'flat',
            rootCallout: 'dream',
            childCallouts: ['symbols', 'reflections', 'interpretation'],
            metricsCallout: 'metrics',
            dateFormat: ['YYYY-MM-DD'],
            requiredFields: ['dream'],
            optionalFields: ['symbols', 'reflections', 'interpretation', 'metrics']
        },
        {
            id: 'nested-dream-structure',
            name: 'Nested Dream Structure',
            description: 'Nested dream journal structure with all callouts inside the root callout',
            type: 'nested',
            rootCallout: 'dream',
            childCallouts: ['symbols', 'reflections', 'interpretation', 'metrics'],
            metricsCallout: 'metrics',
            dateFormat: ['YYYY-MM-DD'],
            requiredFields: ['dream', 'reflections'],
            optionalFields: ['symbols', 'interpretation', 'metrics']
        }
    ],
    templates: [
        {
            id: 'default-template',
            name: 'Standard Dream Journal',
            description: 'Default template for dream journal entries',
            structure: 'default-dream-structure',
            content: `# Dream Journal Entry

> [!dream]
> Enter your dream here.

> [!symbols]
> - Symbol 1: Meaning
> - Symbol 2: Meaning

> [!reflections]
> Add your reflections here.

> [!metrics]
> Clarity: 7
> Vividness: 8
> Coherence: 6
`,
            isTemplaterTemplate: false
        }
    ],
    templaterIntegration: {
        enabled: false,
        folderPath: 'templates/dreams',
        defaultTemplate: 'templates/dreams/default.md'
    },
    contentIsolation: {
        ignoreImages: true,
        ignoreLinks: false,
        ignoreFormatting: true,
        ignoreHeadings: false,
        ignoreCodeBlocks: true,
        ignoreFrontmatter: true,
        ignoreComments: true,
        customIgnorePatterns: []
    },
    userInterface: {
        showInlineValidation: true,
        severityIndicators: {
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        },
        quickFixesEnabled: true
    }
};

/**
 * @deprecated The OneiroMetricsModal class has been removed and its functionality 
 * replaced by DreamJournalManager and direct calls to scrapeMetrics.
 * A backup of this code is available at src/dom/modals/OneiroMetricsModal.bak.ts 
 * in case restoration is needed.
 */

// Import ContentToggler
import { ContentToggler } from './src/dom/content';
import { TableGenerator } from './src/dom/tables';

// Global instance for functions that need access to ContentToggler
let globalContentToggler: ContentToggler;
// Global instance for table generation
let globalTableGenerator: TableGenerator;

// Import ProjectNoteManager
import { ProjectNoteManager } from './src/state/ProjectNoteManager';

// Import RibbonManager
import { RibbonManager } from './src/dom/RibbonManager';

// Import the PluginLoader
import { PluginLoader } from './src/plugin/PluginLoader';

export default class DreamMetricsPlugin extends Plugin {
    settings: DreamMetricsSettings;
    ribbonIconEl: HTMLElement;
    statusBarItemEl: HTMLElement;
    timeline: Timeline;
    calendar: CalendarView;
    
    // Use a more specific type for logger
    logger: LoggingAdapter;
    
    lintingEngine: LintingEngine;
    templaterIntegration: TemplaterIntegration;
    
    // Dream journal manager reference
    activeJournal: ActiveJournal | null = null;
    private dreamJournalManager: DreamJournalManager;
    private dateNavigator: DateNavigatorIntegration;
    private timeFilterManager: TimeFilterManager;
    
    state: DreamMetricsState;
    
    loadedSettings: boolean = false;
    ribbons: Map<string, HTMLElement> = new Map();
    onlyActiveFile: boolean = false;
    expandedStates: Set<string>;
    private ribbonIcons: HTMLElement[] = [];
    private container: HTMLElement | null = null;
    private journalManagerRibbonEl: HTMLElement | null = null;
    private memoizedTableData = new Map<string, any>();
    private cleanupFunctions: (() => void)[] = [];
    private dateNavigatorIntegration: DateNavigatorIntegration | null = null;
    private currentSortDirection: { [key: string]: 'asc' | 'desc' } = {};
    private settingsManager: SettingsManager;
    public dateRangeService: DateRangeService;
    private projectNoteManager: ProjectNoteManager;
    private ribbonManager: RibbonManager;
    private dateFilter: DateFilter;

    async onload() {
        // Create a new PluginLoader and delegate the initialization to it
        const pluginLoader = new PluginLoader(this, this.app);
        
        try {
            // Initialize the plugin using the PluginLoader
            await pluginLoader.initialize();
            
            // Log successful initialization
            if (globalLogger) {
                globalLogger.info('Plugin', 'OneiroMetrics plugin loaded successfully');
            }
        } catch (error) {
            // Log any errors during initialization
            console.error('Failed to initialize OneiroMetrics plugin:', error);
            if (globalLogger) {
                globalLogger.error('Plugin', 'Failed to initialize OneiroMetrics plugin', 
                    error instanceof Error ? error : new Error(String(error)));
            }
            
            // Show error notification to user
            new Notice('Failed to initialize OneiroMetrics plugin: ' + (error instanceof Error ? error.message : String(error)));
        }

        // Initialize DateFilter
        this.dateFilter = new DateFilter(this.app, this.settings, this.saveSettings.bind(this), this.logger);
        this.dateFilter.registerGlobalHandler();
    }

    onunload() {
        safeLogger.info('Plugin', 'Unloading Dream Metrics plugin');
        
        // Remove ribbon icons - safely check if ribbonManager exists
        if (this.ribbonManager) {
            this.ribbonManager.removeRibbonIcons();
        } else {
            // Fallback: clean up ribbon icons directly
            this.ribbonIcons.forEach(icon => icon.remove());
            this.ribbonIcons = [];
            
            if (this.journalManagerRibbonEl) {
                this.journalManagerRibbonEl.remove();
                this.journalManagerRibbonEl = null;
            }
        }
        
        // Clean up any registered event listeners and observers
        for (const cleanup of this.cleanupFunctions) {
            cleanup();
        }
        
        // Clear any cached data
        this.memoizedTableData.clear();
        
        // Save the expanded states before unloading
        if (this.loadedSettings) {
            const expandedStatesRecord: Record<string, boolean> = {};
            for (const id of this.expandedStates) {
                expandedStatesRecord[id] = true;
            }
            this.settings.expandedStates = expandedStatesRecord;
            this.saveSettings();
        }
    }

    async saveSettings() {
        await this.settingsManager.saveSettings();
        
        // Update ribbon icons after saving settings, only if ribbonManager exists
        if (this.ribbonManager) {
            this.ribbonManager.updateRibbonIcons();
        }
    }

    async loadSettings() {
        await this.settingsManager.loadSettings();
        this.settings = this.settingsManager.settings;
        this.expandedStates = this.settingsManager.expandedStates;
        this.loadedSettings = this.settingsManager.loadedSettings;
        
        // Initialize the logger with safe property access
        if (!globalLogger) {
            const logLevel = this.settings.logging?.level || 'info';
            const maxSize = getLogMaxSize(this.settings);
            const maxBackups = this.settings.logging?.maxBackups || 3;
            
            // Fix the constructor to use the correct signature
            this.logger = new LoggingAdapter(this.app);
            // Then configure it separately
            this.logger.configure(logLevel as LogLevel, maxSize, maxBackups);
            globalLogger = this.logger;
        } else {
            this.logger = globalLogger;
        }
        
        // Initialize other components with consistent settings access
        
        // Create proper settings object for DreamMetricsState
        const stateSettings = {
            projectNote: getProjectNotePath(this.settings),
            selectedNotes: this.settings.selectedNotes || [],
            selectedFolder: getSelectedFolder(this.settings),
            selectionMode: getSelectionMode(this.settings),
            calloutName: this.settings.calloutName || 'dream',
            metrics: this.settings.metrics || {},
            showRibbonButtons: shouldShowRibbonButtons(this.settings),
            backupEnabled: isBackupEnabled(this.settings),
            backupFolderPath: getBackupFolderPath(this.settings),
            logging: {
                level: this.settings.logging?.level || 'info'
            }
        };
        
        // Initialize state management with proper constructor parameters
        this.state = new DreamMetricsState(stateSettings);
        
        // Initialize the time filter manager with proper parameters
        this.timeFilterManager = new TimeFilterManager();
        
        // TimeFilterManager is already registered in onload, no need to register again here
        // registerService(SERVICE_NAMES.TIME_FILTER, this.timeFilterManager);
        
        // Create proper settings object for TemplaterIntegration
        const templaterSettings = {
            enabled: true,
            templateFolder: this.settings.journalStructure?.templaterIntegration?.folderPath || 'templates/dreams',
            defaultTemplate: this.settings.journalStructure?.templaterIntegration?.defaultTemplate || ''
        };
        
        // Use type-safe property access for integration components
        this.templaterIntegration = new TemplaterIntegration(
            this.app,
            this,
            templaterSettings
        );
        
        // Use proper constructor parameters for DateNavigatorIntegration
        this.dateNavigator = new DateNavigatorIntegration(
            this.app,
            this
        );
        
        // Initialize the linting engine with safe property access
        const journalStructure = getJournalStructure(this.settings);
        this.lintingEngine = new LintingEngine(this, journalStructure || DEFAULT_JOURNAL_STRUCTURE_SETTINGS);
        
        // Initialize UI components
        this.dreamJournalManager = new DreamJournalManager(this.app, this);
    }

    /**
     * Validate the structure of the current file
     */
    private async validateCurrentFile() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No file is active');
            return;
        }
        
        // Get the content of the file
        const content = await this.app.vault.read(activeFile);
        
        // Validate content
        const results = this.lintingEngine.validate(content);
        
        // If no issues, show a success notice
        if (results.length === 0) {
            new Notice('No structure issues found! 🎉');
            return;
        }
        
        // Otherwise, show the validation modal with the results
        const modal = new TestModal(this.app, this);
        modal.open();
    }
    
    public async showMetrics() {
        // This method previously opened the OneiroMetricsModal
        // Now we directly start the scraping process
        
        globalLogger?.info('Plugin', 'showMetrics called - directly launching scrapeMetrics');
        
        // Attempt to use the journal manager if available
        if (this.dreamJournalManager) {
            // Use type assertion to access potential methods without TypeScript errors
            const journalManager = this.dreamJournalManager as any;
            
            try {
                // Try various possible method names that might exist
                if (typeof journalManager.show === 'function') {
                    journalManager.show();
                    return;
                } else if (typeof journalManager.open === 'function') {
                    journalManager.open();
                    return;
                } else if (typeof journalManager.openUI === 'function') {
                    journalManager.openUI();
                    return;
                } else if (typeof journalManager.display === 'function') {
                    journalManager.display();
                    return;
                }
                
                // Log that we couldn't find a suitable method
                globalLogger?.warn('Plugin', 'Journal Manager available but no suitable open method found');
            } catch (error) {
                globalLogger?.error('Plugin', 'Failed to open Journal Manager', error as Error);
            }
        }
        
        // Fall back to direct scraping
        this.scrapeMetrics();
    }

    async scrapeMetrics() {
        try {
            // Create a metrics collector instance
            const metricsCollector = new MetricsCollector(this.app, this, this.logger);
            
            // Call the collector's scrapeMetrics method
            await metricsCollector.scrapeMetrics();
        } catch (error) {
            this.logger?.error('Scrape', 'Error in scrapeMetrics', error as Error);
            new Notice(`Error scraping metrics: ${error.message}`);
        }
    }

    private processDreamContent(content: string): string {
        // Use the MetricsProcessor implementation
        const metricsProcessor = new MetricsProcessor(this.app, this, this.logger);
        return metricsProcessor.processDreamContent(content);
    }

    private processMetrics(metricsText: string, metrics: Record<string, number[]>): Record<string, number> {
        // Use the MetricsProcessor implementation
        const metricsProcessor = new MetricsProcessor(this.app, this, this.logger);
        return metricsProcessor.processMetrics(metricsText, metrics);
    }

    /**
     * Update the project note with metrics data
     * 
     * @param metrics - Record of metrics data to update
     * @param dreamEntries - Array of dream entries to include
     */
    public async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): Promise<void> {
        return this.projectNoteManager.updateProjectNote(metrics, dreamEntries);
    }

    private generateSummaryTable(metrics: Record<string, number[]>): string {
        // Use the TableGenerator implementation
        return globalTableGenerator.generateSummaryTable(metrics);
    }

    private generateMetricsTable(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): string {
        // Use the TableGenerator implementation
        return globalTableGenerator.generateMetricsTable(metrics, dreamEntries);
    }

    // Using the centralized date utils from src/utils/date-utils.ts
    // These methods are wrappers that provide compatibility with existing code
    // while delegating to the shared utility functions
    
    private validateDate(date: Date): boolean {
        return validateDate(date);
    }

    private parseDate(dateStr: string): Date {
        const startTime = performance.now();
        this.logger.log('Date', `Processing date: ${dateStr}`);
        
        // Use the shared parseDate utility, but handle null result by returning current date
        const parsedDate = parseDate(dateStr);
        if (parsedDate) {
            return parsedDate;
        } else {
            this.logger.error('Date', `Failed to parse date: ${dateStr}`, new Error('Date parsing failed'));
            return new Date();
        }
    }

    private formatDate(date: Date): string {
        return formatDate(date, 'MMM d, yyyy');
    }

        private updateProjectNoteView(currentLogLevel?: string) {
        // Only update if the current file is a project note
        
        // Setup event listeners for project notes
        this.attachProjectNoteEventListeners();
        
        // Initialize the table row classes for improved filtering
        // Defer initialization to avoid blocking initial render
        setTimeout(() => {
            initializeTableRowClasses();
        }, 250);
        
        // Apply debug mode classes if needed
        // Use the currentLogLevel or fall back to the settings
        const logLevel = currentLogLevel || this.settings.logging?.level || 'off';
        
        if (logLevel === 'debug' || logLevel === 'trace') {
            document.body.addClass('oom-debug-mode');
        } else {
            document.body.removeClass('oom-debug-mode');
        }
    }
    


    private getContentStateId(contentCell: HTMLElement): string {
        const date = contentCell.closest('.oom-dream-row')?.getAttribute('data-date');
        const title = contentCell.closest('.oom-dream-row')?.querySelector('.oom-dream-title')?.textContent;
        return `${date}-${title}`.replace(/[^a-zA-Z0-9-]/g, '');
    }

    private attachProjectNoteEventListeners() {
        globalLogger?.debug('UI', 'Attaching metrics note event listeners');
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view || view.getMode() !== 'preview') return;
        
        const previewEl = view.previewMode?.containerEl;
        if (!previewEl) {
            globalLogger?.warn('UI', 'No preview element found for attaching event listeners');
            return;
        }
        
        // CRITICAL FIX: Robust, failsafe filter application in event listeners
        // Check if filters are already applied before trying again
        if ((window as any).oomFiltersApplied) {
            globalLogger?.info('Filter', 'Filters already applied, skipping filter application in event listeners');
        }
        
        // Helper function to safely attach click event with console warning for debugging
        const attachClickEvent = (element: Element | null, callback: () => void, elementName: string) => {
            if (!element) {
                globalLogger?.warn('UI', `${elementName} not found`);
                return false;
            }
            
            try {
                // Remove existing listeners by cloning
                const newElement = element.cloneNode(true) as HTMLElement;
                newElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    callback();
                });
                element.parentNode?.replaceChild(newElement, element);
                globalLogger?.debug('UI', `Attached event listener to ${elementName}`);
                return true;
            } catch (error) {
                globalLogger?.error('UI', `Error attaching event to ${elementName}`, error as Error);
                return false;
            }
        };
        
        // Try multiple ways to find the buttons, falling back to more general selectors
        const findButton = (id: string, className: string, fallbackSelector: string): HTMLElement | null => {
            // Try by ID first (most specific)
            const buttonById = document.getElementById(id);
            if (buttonById) return buttonById as HTMLElement;
            
            // Try by class in preview element
            const buttonByClass = previewEl.querySelector(`.${className}`);
            if (buttonByClass) return buttonByClass as HTMLElement;
            
            // Try fallback selector as last resort
            const buttonByFallback = previewEl.querySelector(fallbackSelector);
            if (buttonByFallback) return buttonByFallback as HTMLElement;
            
            return null;
        };
        
        // Find the rescrape button with multiple fallbacks
        const rescrapeBtn = findButton(
            'oom-rescrape-button', 
            'oom-rescrape-button', 
            'button.mod-cta:not(.oom-settings-button):not(.oom-date-navigator-button)'
        );
        
        attachClickEvent(rescrapeBtn, () => {
            globalLogger?.debug('UI', 'Rescrape button clicked');
            new Notice('Rescraping metrics...');
            this.scrapeMetrics();
        }, 'Rescrape button');
        
        // Find the settings button with multiple fallbacks
        const settingsBtn = findButton(
            'oom-settings-button', 
            'oom-settings-button', 
            'button.mod-cta:not(.oom-rescrape-button):not(.oom-date-navigator-button)'
        );
        
        attachClickEvent(settingsBtn, () => {
            globalLogger?.debug('UI', 'Settings button clicked');
            new Notice('Opening settings...');
            (this.app as any).setting.open();
            (this.app as any).setting.openTabById('oneirometrics');
        }, 'Settings button');
        
        // Find the date navigator button with multiple fallbacks
        const dateNavigatorBtn = findButton(
            'oom-date-navigator-button', 
            'oom-date-navigator-button', 
            'button.mod-cta:not(.oom-rescrape-button):not(.oom-settings-button)'
        );
        
        attachClickEvent(dateNavigatorBtn, () => {
            globalLogger?.debug('UI', 'Date navigator button clicked');
            new Notice('Opening date navigator...');
            this.showDateNavigator();
        }, 'Date navigator button');
        
        // Add event listeners for debug buttons
        const debugBtn = previewEl.querySelector('.oom-debug-attach-listeners');
        if (debugBtn) {
            // Remove existing listeners
            const newDebugBtn = debugBtn.cloneNode(true);
            newDebugBtn.addEventListener('click', () => {
                new Notice('Manually attaching Show More listeners...');
                this.attachProjectNoteEventListeners();
            });
            debugBtn.parentNode?.replaceChild(newDebugBtn, debugBtn);
        }
        
        // Add debug expand all button in debug mode
        if (this.settings.logging?.level === 'debug' || this.settings.logging?.level === 'trace') {
            const expandAllDebugBtn = previewEl.querySelector('.oom-debug-expand-all');
            if (!expandAllDebugBtn) {
                // Create a new debug button if it doesn't exist
                const debugBtnContainer = previewEl.querySelector('.oom-filter-controls');
                if (debugBtnContainer) {
                    const newDebugBtn = document.createElement('button');
                    newDebugBtn.className = 'oom-button oom-debug-expand-all';
                    newDebugBtn.innerHTML = '<span class="oom-button-text">Debug: Expand All Content</span>';
                    newDebugBtn.style.backgroundColor = 'var(--color-red)';
                    newDebugBtn.style.color = 'white';
                    newDebugBtn.style.marginLeft = '8px';
                    newDebugBtn.addEventListener('click', () => {
                        new Notice('Expanding all content sections for debugging...');
                        expandAllContentSections(previewEl);
                    });
                    debugBtnContainer.appendChild(newDebugBtn);
                }
            }
        }

        // Find date range filter with multiple attempts
        const findDateRangeFilter = (): HTMLSelectElement | null => {
            // Try by ID first
            const filterById = document.getElementById('oom-date-range-filter');
            if (filterById) return filterById as HTMLSelectElement;
            
            // Try by class in preview element
            const filterByClass = previewEl.querySelector('.oom-select');
            if (filterByClass) return filterByClass as HTMLSelectElement;
            
            // Try more generic selector
            const filterBySelector = previewEl.querySelector('select[id*="date-range"]');
            if (filterBySelector) return filterBySelector as HTMLSelectElement;
            
            return null;
        };
        
        const dateRangeFilter = findDateRangeFilter();
        if (dateRangeFilter) {
            globalLogger?.debug('UI', 'Found date range filter', { element: dateRangeFilter?.tagName });
            // First remove any existing event listeners by cloning the node
            const newDateRangeFilter = dateRangeFilter.cloneNode(true) as HTMLSelectElement;
            newDateRangeFilter.addEventListener('change', () => {
                globalLogger?.debug('UI', 'Date range filter changed', { value: newDateRangeFilter?.value });
                
                // Clear any custom date range when using dropdown
                customDateRange = null;
                
                // Reset any active state on custom range button - do this in a requestAnimationFrame
                // to avoid forced reflow
                const customRangeBtn = document.getElementById('oom-custom-range-btn');
                if (customRangeBtn) {
                    requestAnimationFrame(() => {
                        customRangeBtn.classList.remove('active');
                    });
                }
                
                // Apply the filter in a delayed manner to avoid UI jank
                setTimeout(() => this.applyFilters(previewEl), 50);
            });
            dateRangeFilter.parentNode?.replaceChild(newDateRangeFilter, dateRangeFilter);
            globalLogger?.debug('UI', 'Attached event listener to date range filter');
        } else {
            globalLogger?.warn('UI', 'Date range filter not found');
        }

        // Existing show more/less button handlers
        const buttons = previewEl.querySelectorAll('.oom-button--expand');
        globalLogger?.debug('UI', 'Found show more/less buttons', { count: buttons?.length });
        buttons.forEach((button) => {
            // Remove any existing click listeners by replacing the node
            const newButton = button.cloneNode(true) as HTMLElement;
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                globalLogger?.debug('UI', 'Show more/less button clicked');
                
                // Use the dedicated function to handle content visibility toggle
                toggleContentVisibility(newButton);
            });
            button.parentNode?.replaceChild(newButton, button);
        });

        // Find custom range button with fallbacks
        const findCustomRangeBtn = (): HTMLElement | null => {
            // Try by ID first
            const btnById = document.getElementById('oom-custom-range-btn');
            if (btnById) return btnById as HTMLElement;
            
            // Try by class within the filter controls
            const filterControls = previewEl.querySelector('.oom-filter-controls') || previewEl;
            const btnByClass = filterControls.querySelector('.oom-button:not(.oom-button--expand)');
            if (btnByClass) return btnByClass as HTMLElement;
            
            return null;
        };
        
        const customRangeBtn = findCustomRangeBtn();
        if (customRangeBtn) {
            globalLogger?.debug('UI', 'Found custom range button');
            // Clone the button to remove any existing listeners
            const newCustomRangeBtn = customRangeBtn.cloneNode(true) as HTMLElement;
            newCustomRangeBtn.addEventListener('click', () => {
                globalLogger?.debug('UI', 'Custom range button clicked');
                openCustomRangeModal(this.app);
            });
            customRangeBtn.parentNode?.replaceChild(newCustomRangeBtn, customRangeBtn);
            globalLogger?.debug('UI', 'Attached event listener to custom range button');
        } else {
            globalLogger?.warn('UI', 'Custom range button not found');
        }
        
        globalLogger?.debug('UI', 'Finished attaching metrics note event listeners');
    }

    private applyFilters(previewEl: HTMLElement) {
        globalLogger?.debug('Filter', 'applyFilters called');

        // Get important elements early before any DOM operations
        const tableContainer = previewEl.querySelector('.oom-table-container');
        const rows = previewEl.querySelectorAll('.oom-dream-row');
        
        // If no rows found, table might not be ready yet
        if (!rows.length) {
            globalLogger?.warn('Filter', 'No rows found in table, may need to retry later');
        }
        
        // Get the selected filter value
        const filterDropdown = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
        if (!filterDropdown) {
            globalLogger?.warn('Filter', 'Filter dropdown not found, unable to apply filter');
            return;
        }
        
        // CRITICAL FIX: Check for an intended filter passed directly from applyFilterToDropdown
        // This prevents filters from being overridden during the filter application process
        const intendedFilter = (window as any).oomIntendedFilter;
        const dateRange = intendedFilter || filterDropdown.value || 'all';
        
        // If we're using an intended filter, update the dropdown to match
        if (intendedFilter && filterDropdown.value !== intendedFilter) {
            filterDropdown.value = intendedFilter;
            globalLogger?.info('Filter', `Corrected dropdown value to match intended filter: ${intendedFilter}`);
        }
        
        // Clear the intended filter after use
        (window as any).oomIntendedFilter = null;
        globalLogger?.debug('Filter', `Applying filter: ${dateRange}`);
        
        // Save filter selection to settings for persistence
        this.settings.lastAppliedFilter = dateRange;
        
        // Clear customDateRange if we're not using a custom filter
        if (dateRange !== 'custom') {
            this.settings.customDateRange = undefined;
            customDateRange = null;
        } else if (customDateRange) {
            // If this is a custom filter, make sure we save the custom date range
            this.settings.customDateRange = { ...customDateRange };
        }
        
        // CRITICAL FIX: Save filter persistence data to localStorage as a backup
        try {
            localStorage.setItem('oom-last-applied-filter', dateRange);
            if (dateRange === 'custom' && customDateRange) {
                localStorage.setItem('oom-custom-date-range', JSON.stringify(customDateRange));
            } else {
                localStorage.removeItem('oom-custom-date-range');
            }
            globalLogger?.info('Filter', `Saved filter settings to localStorage: ${dateRange}`);
        } catch (e) {
            globalLogger?.error('Filter', 'Failed to save filter settings to localStorage', e);
        }
        
        // CRITICAL FIX: Force immediate settings save to ensure persistence
        // Save to both settings and localStorage for redundancy
        this.saveSettings()
            .then(() => {
                globalLogger?.info('Filter', 'Successfully saved filter setting to Obsidian settings');
                // Update flag to indicate filter has been successfully saved
                (window as any).oomFiltersSaved = true;
            })
            .catch(err => {
                globalLogger?.error('Filter', 'Failed to save filter setting to Obsidian settings', err);
            });
            
        // Also save filter settings to disk as an additional safety measure
        try {
            // Use the specific plugin's method to save data, which is properly typed
            this.saveData({
                ...this.settings,
                lastAppliedFilter: dateRange,
                customDateRange: dateRange === 'custom' ? customDateRange : undefined
            });
            globalLogger?.info('Filter', 'Force-saved filter settings to disk');
        } catch (e) {
            globalLogger?.error('Filter', 'Failed to force-save filter settings to disk', e);
        }
        
        // Apply will-change to the table container for better performance
        if (tableContainer) {
            tableContainer.setAttribute('style', 'will-change: contents;');
        }
        
        this.logger.log('Filter', `Applying filter: ${dateRange}`, {
            totalRows: rows.length
        });

        // Prepare date ranges before any DOM operations
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        const last6months = new Date(today);
        last6months.setMonth(today.getMonth() - 6);
        const last12months = new Date(today);
        last12months.setFullYear(today.getFullYear() - 1);
        
        // Process in chunks to avoid UI freezing
        const CHUNK_SIZE = 20;
        const totalRows = rows.length;
        let currentChunk = 0;
        
        // Prep counters
        let visibleCount = 0;
        let invalidDates = 0;
        let outOfRangeDates = 0;
        
        globalLogger?.debug('Filter', 'Starting filter process', { totalRows, dateRange });

        // Show a loading indicator for large tables
        let loadingIndicator: HTMLElement | null = null;
        if (totalRows > 50) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'oom-loading-indicator';
            loadingIndicator.textContent = 'Filtering entries...';
            loadingIndicator.style.position = 'fixed';
            loadingIndicator.style.top = '10px';
            loadingIndicator.style.right = '10px';
            loadingIndicator.style.background = 'var(--background-primary)';
            loadingIndicator.style.color = 'var(--text-normal)';
            loadingIndicator.style.padding = '8px 12px';
            loadingIndicator.style.borderRadius = '4px';
            loadingIndicator.style.boxShadow = '0 2px 8px var(--background-modifier-box-shadow)';
            loadingIndicator.style.zIndex = '1000';
            document.body.appendChild(loadingIndicator);
        }
        
        // First, pre-compute all row visibility states without touching the DOM
        const rowVisibility: boolean[] = [];
        
        for (let i = 0; i < totalRows; i++) {
            const rowEl = rows[i] as HTMLElement;
            let date = rowEl.getAttribute('data-date');
            
            // Emergency fix for missing date attributes
            if (!date) {
                this.logger.warn('Filter', `Row ${i} has no date attribute, attempting to fix`);
                
                // Try to extract date from the date column
                const dateCell = rowEl.querySelector('.column-date');
                if (dateCell && dateCell.textContent) {
                    const dateText = dateCell.textContent.trim();
                    try {
                        // Parse the displayed date back to YYYY-MM-DD format
                        const dateObj = new Date(dateText);
                        if (!isNaN(dateObj.getTime())) {
                            date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
                            globalLogger?.debug('Filter', `Fixed missing date attribute on row ${i} with date`, { rowIndex: i, date });
                            rowEl.setAttribute('data-date', date);
                            dateCell.setAttribute('data-date', date);
                        }
                    } catch (e) {
                        globalLogger?.error('Filter', 'Failed to fix date attribute for row', { rowIndex: i, error: e as Error });
                    }
                }
                
                // If still no date after fix attempt, skip this row
                if (!date) {
                    this.logger.warn('Filter', `Unable to fix missing date attribute on row ${i}`);
                    rowVisibility.push(false);
                    continue;
                }
            }

            const dreamDate = parseDate(date) || new Date();
            if (isNaN(dreamDate.getTime())) {
                this.logger.error('Filter', `Invalid date for row ${i}: ${date}`);
                invalidDates++;
                rowVisibility.push(false);
                continue;
            }

            let isVisible = true;
            // Only compute visibility based on the selected date range
            // We've already calculated the date ranges above
            switch (dateRange) {
                case 'all':
                    isVisible = true;
                    break;
                case 'today':
                    isVisible = dreamDate >= today && dreamDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
                    break;
                case 'yesterday':
                    isVisible = dreamDate >= yesterday && dreamDate < today;
                    break;
                case 'thisWeek':
                    isVisible = dreamDate >= startOfWeek && dreamDate <= now;
                    break;
                case 'thisMonth':
                    isVisible = dreamDate >= startOfMonth && dreamDate <= now;
                    break;
                case 'last30':
                    isVisible = dreamDate >= last30 && dreamDate <= now;
                    break;
                case 'last6months':
                    isVisible = dreamDate >= last6months && dreamDate <= now;
                    break;
                case 'thisYear':
                    isVisible = dreamDate >= startOfYear && dreamDate <= now;
                    break;
                case 'last12months':
                    isVisible = dreamDate >= last12months && dreamDate <= now;
                    break;
                default:
                    isVisible = true;
            }

            if (isVisible) {
                visibleCount++;
                this.logger.log('Filter', `Row ${i} visible`, {
                    date: dreamDate.toISOString(),
                    title: rowEl.querySelector('.oom-dream-title')?.textContent
                });
            } else {
                outOfRangeDates++;
            }
            
            rowVisibility.push(isVisible);
        }
        
        // Create a function to process chunks of rows
        const processNextChunk = () => {
            const start = currentChunk * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalRows);
            
            // Update loading indicator if present
            if (loadingIndicator) {
                const percent = Math.floor((currentChunk * CHUNK_SIZE / totalRows) * 100);
                loadingIndicator.textContent = `Filtering entries... ${percent}%`;
            }
            
            // Batch all DOM operations inside requestAnimationFrame
            requestAnimationFrame(() => {
                // Apply visibility to this chunk of rows
                for (let i = start; i < end; i++) {
                    const rowEl = rows[i] as HTMLElement;
                    const isVisible = rowVisibility[i];
                    
                    // Ensure row has a data-date attribute
                    if (!rowEl.hasAttribute('data-date')) {
                        const dateCell = rowEl.querySelector('.column-date');
                        if (dateCell && dateCell.textContent) {
                            try {
                                const dateObj = new Date(dateCell.textContent.trim());
                                if (!isNaN(dateObj.getTime())) {
                                    // Format as YYYY-MM-DD
                                    const dateStr = dateObj.toISOString().split('T')[0];
                                    rowEl.setAttribute('data-date', dateStr);
                                    globalLogger?.debug('Filter', `Added missing date attribute to row ${i}`);
                                }
                            } catch (e) {
                                globalLogger?.warn('Filter', `Could not add date attribute to row ${i}`, e as Error);
                            }
                        }
                    }
                    
                    if (isVisible) {
                        rowEl.classList.remove('oom-row--hidden');
                        rowEl.classList.add('oom-row--visible');
                    } else {
                        rowEl.classList.add('oom-row--hidden');
                        rowEl.classList.remove('oom-row--visible');
                    }
                }
                
                // Move to next chunk or finish
                currentChunk++;
                
                if (currentChunk * CHUNK_SIZE < totalRows) {
                    // Schedule next chunk with a slight delay to allow rendering
                    setTimeout(() => processNextChunk(), 5);
                } else {
                    // All done, update UI
                    if (loadingIndicator) {
                        document.body.removeChild(loadingIndicator);
                    }
                    
                    // Reset will-change property once filtering is complete
                    if (tableContainer) {
                        requestAnimationFrame(() => {
                            tableContainer.removeAttribute('style');
                        });
                    }
                    
                    // Update summary table with filtered metrics
                    const filteredMetrics = collectVisibleRowMetrics(previewEl);
                    updateSummaryTable(previewEl, filteredMetrics);
                    
                    // Update filter display in the next animation frame
                    requestAnimationFrame(() => {
                        updateFilterDisplayWithDetails(dateRange, visibleCount, totalRows, invalidDates, outOfRangeDates);
                    });
                }
            });
        };
        
        // Delay the start of processing slightly to avoid UI jank
        setTimeout(() => processNextChunk(), 20);
        
        // This function updates the filter display with detailed information
        function updateFilterDisplayWithDetails(
            filterType: string, 
            visible: number, 
            total: number, 
            invalid: number, 
            outOfRange: number
        ) {
            globalLogger?.debug('Filter', 'Filter application complete', {
                filterType,
                visible,
                total,
                invalid,
                outOfRange
            });
            
            // Mark filters as successfully applied
            (window as any).oomFiltersApplied = true;
            (window as any).oomFiltersPending = false;
            
            // Log success at INFO level
            globalLogger?.info('Filter', `Filter successfully applied: ${filterType}`, {
                visible,
                total,
                success: true
            });
            
            // Show notification to user
            if (visible > 0) {
                new Notice(`OneiroMetrics: Applied filter - showing ${visible} of ${total} entries`);
            }
            
            const filterDisplay = previewEl.querySelector('#oom-time-filter-display') as HTMLElement;
            if (!filterDisplay) {
                globalLogger?.warn('Filter', 'Filter display element not found');
                return;
            }
            
            // Temporarily set will-change for better performance
            filterDisplay.style.willChange = 'contents';
            
            const hiddenCount = total - visible;
            const colorClass = visible === total 
                ? 'oom-filter--all-visible' 
                : visible > 0 
                    ? 'oom-filter--partially-visible' 
                    : 'oom-filter--none-visible';
                    
            // Map filter keys to human-friendly labels
            const filterLabels: Record<string, string> = {
                all: 'All Time',
                today: 'Today',
                yesterday: 'Yesterday',
                thisWeek: 'This Week',
                thisMonth: 'This Month',
                last30: 'Last 30 Days',
                last6months: 'Last 6 Months',
                thisYear: 'This Year',
                last12months: 'Last 12 Months',
            };
            
            const displayLabel = filterLabels[filterType] || filterType;
            
            // Build HTML content in a single string to minimize DOM operations
            let htmlContent = '';
            
            htmlContent += `<span class="oom-filter-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-calendar-range">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <path d="M16 2v4"/>
                    <path d="M8 2v4"/>
                    <path d="M3 10h18"/>
                    <path d="M17 14h-6"/>
                    <path d="M13 18H7"/>
                </svg>
            </span>`;
            
            htmlContent += `<span class="oom-filter-text ${colorClass}">
                ${displayLabel} (${visible} entries)
                ${hiddenCount > 0 ? `<span class="oom-filter-hidden">- ${hiddenCount} hidden</span>` : ''}
            </span>`;
            
            // Set detailed title attribute
            const titleInfo = `Total Entries: ${total}
Visible: ${visible}
Hidden: ${hiddenCount}
Invalid Dates: ${invalid}
Out of Range: ${outOfRange}
Filter Type: ${filterType}
Applied: ${new Date().toLocaleTimeString()}`;
            
            // Use requestAnimationFrame for smooth transition
            requestAnimationFrame(() => {
                // First, remove the transition for immediate change
                filterDisplay.style.transition = 'none';
                filterDisplay.classList.remove('oom-filter-display--updated');
                
                // Force a reflow to ensure the removal of the class takes effect immediately
                void filterDisplay.offsetHeight;
                
                // Apply all changes at once
                filterDisplay.innerHTML = htmlContent;
                filterDisplay.setAttribute('title', titleInfo);
                
                // Add animation back in the next frame
                setTimeout(() => {
                    // Reset will-change property
                    filterDisplay.style.willChange = 'auto';
                    
                    // Restore transition and add the updated class
                    filterDisplay.style.removeProperty('transition');
                    filterDisplay.classList.add('oom-filter-display--updated');
                    
                    // Remove class after transition completes
                    setTimeout(() => {
                        filterDisplay.classList.remove('oom-filter-display--updated');
                    }, 1000);
                }, 20);
            });
        }
    }

    private async clearDebugLog() {
        try {
            const logPath = 'logs/oom-debug-log.txt';
            const logFile = this.app.vault.getAbstractFileByPath(logPath);
            
            if (logFile instanceof TFile) {
                // Create backup before clearing
                const backupPath = `logs/oom-debug-log.backup-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
                const content = await this.app.vault.read(logFile);
                await this.app.vault.create(backupPath, content);
                
                // Clear the log file
                await this.app.vault.modify(logFile, '');
                this.logger.log('Log', 'Debug log cleared and backed up');
                
                // Clean up old backups (keep last 5)
                const backupFiles = this.app.vault.getMarkdownFiles()
                    .filter(f => f.path.startsWith('logs/oom-debug-log.backup-'))
                    .sort((a, b) => b.stat.mtime - a.stat.mtime);
                
                for (let i = 5; i < backupFiles.length; i++) {
                    await this.app.vault.delete(backupFiles[i]);
                }
            }
        } catch (error) {
            this.logger.error('Log', 'Failed to clear debug log', error as Error);
            new Notice('Failed to clear debug log. See console for details.');
        }
    }

    private async backupDebugLog() {
        try {
            const logPath = 'logs/oom-debug-log.txt';
            const logFile = this.app.vault.getAbstractFileByPath(logPath);
            
            if (logFile instanceof TFile) {
                const backupPath = `logs/oom-debug-log.backup-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
                const content = await this.app.vault.read(logFile);
                await this.app.vault.create(backupPath, content);
                this.logger.log('Log', 'Debug log backed up');
                new Notice('Debug log backed up successfully');
            }
        } catch (error) {
            this.logger.error('Log', 'Failed to backup debug log', error as Error);
            new Notice('Failed to backup debug log. See console for details.');
        }
    }

    private async checkLogFileSize() {
        try {
            const logPath = 'logs/oom-debug-log.txt';
            const logFile = this.app.vault.getAbstractFileByPath(logPath);
            
            if (logFile instanceof TFile) {
                const MAX_SIZE = 1024 * 1024; // 1MB
                if (logFile.stat.size > MAX_SIZE) {
                    await this.clearDebugLog();
                    new Notice('Debug log exceeded size limit and was cleared');
                }
            }
        } catch (error) {
            this.logger.error('Log', 'Failed to check log file size', error as Error);
        }
    }

    private async copyConsoleLogs() {
        try {
            // Get the console log content
            const consoleLog = await this.getConsoleLog();
            if (!consoleLog) {
                new Notice('No console logs found');
                return;
            }

            // Filter for OneiroMetrics entries
            const filteredLogs = consoleLog
                .split('\n')
                .filter(line => line.includes('[OneiroMetrics]'))
                .join('\n');

            if (!filteredLogs) {
                new Notice('No OneiroMetrics logs found in console');
                return;
            }

            // Get or create the log file
            const logPath = 'logs/oom-debug-log.txt';
            let logFile = this.app.vault.getAbstractFileByPath(logPath);
            
            if (!logFile) {
                logFile = await this.app.vault.create(logPath, '');
            }

            // Add timestamp and separator
            const timestamp = new Date().toISOString();
            const separator = '\n\n' + '-'.repeat(80) + '\n';
            const newContent = `${separator}Console Log Capture - ${timestamp}\n${separator}\n${filteredLogs}\n`;

            // Append to existing content
            const existingContent = await this.app.vault.read(logFile as TFile);
            await this.app.vault.modify(logFile as TFile, existingContent + newContent);

            new Notice('Console logs copied to debug file');
            this.logger.log('Log', 'Console logs copied to debug file');
        } catch (error) {
            this.logger.error('Log', 'Failed to copy console logs', error as Error);
            new Notice('Failed to copy console logs. See console for details.');
        }
    }

    private async getConsoleLog(): Promise<string | null> {
        try {
            // This is a workaround since we can't directly access the console log
            // We'll use the developer tools API to get the log
            const devTools = (window as any).devTools;
            if (!devTools) {
                new Notice('Developer Tools not available. Please open them first (Ctrl+Shift+I)');
                return null;
            }

            // Get the console log from the developer tools
            const consoleLog = await devTools.getConsoleLog();
            return consoleLog;
        } catch (error) {
            this.logger.error('Log', 'Failed to get console log', error as Error);
            return null;
        }
    }

    /**
     * Set the log level for the plugin
     * @param level The log level to set
     */
    setLogLevel(level: LogLevel) {
        // Update the logger
        this.logger.configure(level);
        
        // Update settings
        this.settingsManager.updateLogConfig(
            level,
            this.settings.logging?.maxSize || 1024 * 1024,
            this.settings.logging?.maxBackups || 3
        );
        
        // Save settings
        this.saveSettings();
        
        // Update UI if needed
        this.updateProjectNoteView(level);
    }

    /**
     * Set the log configuration for the plugin
     * @param level The log level to set
     * @param maxSize Maximum log file size
     * @param maxBackups Maximum number of log backups
     */
    setLogConfig(level: LogLevel, maxSize: number, maxBackups: number) {
        // Update the logger
        this.logger.configure(level, maxSize, maxBackups);
        
        // Update settings through settings manager
        this.settingsManager.updateLogConfig(level, maxSize, maxBackups);
        
        // Save settings
        this.saveSettings();
    }

    private announceToScreenReader(message: string) {
        const ariaLive = document.createElement('div');
        ariaLive.setAttribute('aria-live', 'polite');
        ariaLive.classList.add('sr-only');
        document.body.append(ariaLive);
        ariaLive.textContent = message;
        setTimeout(() => ariaLive.remove(), 1000);
    }

    /**
     * Updates the visibility state of a content section
     * @param id The ID of the content section
     * @param isExpanded Whether the section is expanded
     */
    private updateContentVisibility(id: string, isExpanded: boolean): void {
        try {
            // Update the expanded states using the settings manager
            this.settingsManager.setExpandedState(id, isExpanded);
            
            // Also update our local expandedStates for legacy code
            if (isExpanded) {
                this.expandedStates.add(id);
            } else {
                this.expandedStates.delete(id);
            }
            
            // Save the settings to persist the change
            this.saveSettings().catch(error => {
                this.logger?.error('Settings', 'Failed to save content visibility state', error instanceof Error ? error : new Error(String(error)));
            });
        } catch (error) {
            this.logger?.error('UI', 'Error updating content visibility', error instanceof Error ? error : new Error(String(error)));
        }
    }

    // Method to update ribbon icon based on settings
    updateRibbonIcons() {
        // Only delegate if ribbonManager is initialized
        if (this.ribbonManager) {
            this.ribbonManager.updateRibbonIcons();
        } else {
            // Fallback implementation
            this.logger?.debug('UI', 'RibbonManager not initialized, using fallback implementation');
            // Original implementation from the RibbonManager class
            // Clear existing ribbon icons
            this.ribbonIcons.forEach(icon => icon.remove());
            this.ribbonIcons = [];
            
            // Clear the journalManager ribbon if it exists
            if (this.journalManagerRibbonEl) {
                this.journalManagerRibbonEl.remove();
                this.journalManagerRibbonEl = null;
            }
            
            // Only add ribbon icons if enabled in settings
            if (this.settings?.showRibbonButtons) {
                // Add main metrics ribbon icon
                this.ribbonIcons.push(
                    this.addRibbonIcon('dice', 'OneiroMetrics', () => {
                        this.showMetrics();
                    })
                );
                
                // Add journal manager button with lucide-moon icon
                this.journalManagerRibbonEl = this.addRibbonIcon('lucide-moon', 'Dream Journal Manager', () => {
                    if (this.dreamJournalManager) {
                        // Just use open() method which we know exists
                        this.dreamJournalManager.open();
                    } else {
                        new JournalStructureModal(this.app, this).open();
                    }
                });
                this.ribbonIcons.push(this.journalManagerRibbonEl);
                
                // Add metrics guide button with lucide-scroll-text icon
                const metricsGuideRibbonEl = this.addRibbonIcon('lucide-scroll-text', 'Dream Metrics Reference', () => {
                    this.showMetricsTabsModal();
                });
                this.ribbonIcons.push(metricsGuideRibbonEl);
            }
        }
    }

    /**
     * Insert a journal template into the current editor
     */
    async insertTemplate(editor: Editor) {
        // Get templates from settings
        const templates = this.settings.linting?.templates || [];
        if (templates.length === 0) {
            new Notice('No templates available. Create templates in the OneiroMetrics settings.');
            return;
        }

        // Open template selection modal
        const modal = new Modal(this.app);
        modal.titleEl.setText('Insert Journal Template');
        modal.contentEl.addClass('oom-template-selection-modal');
        
        // Create template list
        for (const template of templates) {
            const templateItem = modal.contentEl.createDiv({ cls: 'oom-template-item' });
            
            // Create template header with name
            const headerEl = templateItem.createDiv({ cls: 'oom-template-header' });
            headerEl.createEl('h3', { text: template.name });
            
            // Get structure info to display structure type
            const structures = this.settings.linting?.structures || [];
            const structure = structures.find(s => s.id === template.structure);
            
            if (structure) {
                // Add structure type indicator with visual cue
                const typeIndicator = headerEl.createEl('span', { 
                    cls: `oom-template-type oom-${structure.type}-type`,
                    attr: { title: structure.type === 'nested' ? 'Nested Structure' : 'Flat Structure' }
                });
                const typeIcon = structure.type === 'nested' ? '📦' : '📄';
                typeIndicator.setText(`${typeIcon} ${structure.type}`);
            }
            
            // Add templater badge if applicable
            if (template.isTemplaterTemplate) {
                const templaterBadge = headerEl.createEl('span', {
                    cls: 'oom-templater-badge',
                    attr: { title: 'Uses Templater for dynamic content' }
                });
                templaterBadge.setText('⚡ Templater');
            }
            
            // Add description if available
            if (template.description) {
                templateItem.createEl('p', { text: template.description, cls: 'oom-template-description' });
            }
            
            // Preview button and insert button in a button container
            const buttonContainer = templateItem.createDiv({ cls: 'oom-template-buttons' });
            
            // Preview button
            const previewButton = buttonContainer.createEl('button', {
                text: 'Preview',
                cls: 'oom-preview-button'
            });
            
            previewButton.addEventListener('click', () => {
                // Toggle preview visibility
                const previewEl = templateItem.querySelector('.oom-template-preview');
                if (previewEl) {
                    previewEl.remove();
                    previewButton.setText('Preview');
                } else {
                    const newPreviewEl = templateItem.createDiv({ cls: 'oom-template-preview' });
                    
                    // Dynamic/static toggle if it's a Templater template
                    if (template.isTemplaterTemplate && template.staticContent) {
                        const toggleContainer = newPreviewEl.createDiv({ cls: 'oom-preview-toggle-container' });
                        const dynamicToggle = toggleContainer.createEl('button', {
                            text: 'Dynamic (Templater)',
                            cls: 'oom-preview-toggle oom-preview-toggle-active'
                        });
                        const staticToggle = toggleContainer.createEl('button', {
                            text: 'Static (Fallback)',
                            cls: 'oom-preview-toggle'
                        });
                        
                        const previewContent = newPreviewEl.createDiv({ cls: 'oom-preview-content' });
                        previewContent.createEl('pre', { text: template.content });
                        
                        dynamicToggle.addEventListener('click', () => {
                            dynamicToggle.addClass('oom-preview-toggle-active');
                            staticToggle.removeClass('oom-preview-toggle-active');
                            previewContent.empty();
                            previewContent.createEl('pre', { text: template.content });
                        });
                        
                        staticToggle.addEventListener('click', () => {
                            staticToggle.addClass('oom-preview-toggle-active');
                            dynamicToggle.removeClass('oom-preview-toggle-active');
                            previewContent.empty();
                            previewContent.createEl('pre', { text: template.staticContent });
                        });
                    } else {
                        // Regular preview for non-Templater templates
                        newPreviewEl.createEl('pre', { text: template.content });
                    }
                    
                    previewButton.setText('Hide Preview');
                }
            });
            
            // Insert button
            const insertButton = buttonContainer.createEl('button', { 
                text: 'Insert',
                cls: 'mod-cta'
            });
            
            insertButton.addEventListener('click', async () => {
                modal.close();
                
                // Get template content
                let content = '';
                let usingFallback = false;
                
                // If it's a Templater template, process it
                if (template.isTemplaterTemplate && template.templaterFile) {
                    if (this.templaterIntegration && this.templaterIntegration.isTemplaterInstalled()) {
                        try {
                            content = await this.templaterIntegration.processTemplaterTemplate(template.templaterFile);
                        } catch (error) {
                            this.logger?.error('Templates', 'Error processing Templater template', error instanceof Error ? error : new Error(String(error)));
                            new Notice('Error processing Templater template');
                            
                            // Fallback to static content if available
                            if (template.staticContent) {
                                content = template.staticContent;
                                usingFallback = true;
                            } else {
                                content = template.content;
                            }
                        }
                    } else {
                        // Templater not installed, use static version
                        if (template.staticContent) {
                            content = template.staticContent;
                        } else {
                            // Generate static content on the fly if not available
                            if (this.templaterIntegration) {
                                content = this.templaterIntegration.convertToStaticTemplate(template.content);
                            } else {
                                content = template.content;
                            }
                        }
                        usingFallback = true;
                        new Notice('Templater plugin is not installed. Using static template with placeholders.');
                    }
                } else {
                    // Regular non-Templater template
                    content = template.content;
                }
                
                // Insert content at cursor position
                const initialCursorPosition = editor.getCursor();
                editor.replaceSelection(content);
                
                // Handle placeholder navigation if using static version
                if (usingFallback && this.templaterIntegration) {
                    // Find placeholders
                    const placeholders = this.templaterIntegration.findPlaceholders(content);
                    
                    if (placeholders.length > 0) {
                        // Navigate to first placeholder
                        const firstPlaceholder = placeholders[0];
                        const lines = content.substring(0, firstPlaceholder.position.start).split('\n');
                        
                        const position = {
                            line: initialCursorPosition.line + lines.length - 1,
                            ch: lines.length > 1 ? lines[lines.length - 1].length : initialCursorPosition.ch + firstPlaceholder.position.start
                        };
                        
                        editor.setCursor(position);
                        
                        // Select the placeholder
                        const endPosition = {
                            line: position.line,
                            ch: position.ch + (firstPlaceholder.position.end - firstPlaceholder.position.start)
                        };
                        
                        editor.setSelection(position, endPosition);
                        
                        // Show instructional notice
                        new Notice(`Fill in the ${placeholders.length} placeholder(s). Press Tab to navigate between them.`);
                    }
                }
                
                // Show confirmation with structure type
                if (structure) {
                    if (usingFallback) {
                        new Notice(`Inserted "${template.name}" (${structure.type} structure) using static placeholders.`);
                    } else {
                        new Notice(`Inserted "${template.name}" (${structure.type} structure)`);
                    }
                } else {
                    new Notice(`Template "${template.name}" inserted`);
                }
            });
        }
        
        modal.open();
    }

    // Add the updateTestRibbon method
    private updateTestRibbon() {
        // Remove all test buttons
        document.querySelectorAll('.oom-ribbon-test-btn').forEach(btn => btn.remove());
        if ((this.settings as any).showTestRibbonButton) {
            const btn = this.addRibbonIcon('wand', 'Test Ribbon Button', () => {
                new Notice('Test button clicked!');
            });
            btn.addClass('oom-ribbon-test-btn');
        }
    }

    /**
     * Loads the CSS styles for the journal structure check feature
     * Note: The CSS styles have been moved to styles.css
     */
    private loadStyles() {
        // Journal structure check styles are now in styles.css
        // This method is kept for backwards compatibility
    }

    /**
     * Opens the settings tab and shows a notice prompting the user to click "View Metrics Descriptions"
     */
    public openMetricsDescriptionsModal(): void {
        try {
            // Import the modal from our refactored module
            const { MetricsDescriptionsModal } = require('./src/dom/modals');
            
            // Create and open the modal
            new MetricsDescriptionsModal(this.app, this).open();
            
            // Log for debugging
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('UI', 'Opened metrics descriptions modal');
            }
        } catch (error) {
            // Fallback to the old method if there's an error
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('UI', 'Error opening metrics descriptions modal, using fallback', error);
            }
            
            (this.app as any).setting.open();
            (this.app as any).setting.openTabById('oneirometrics');
            new Notice('Click on "View Metrics Descriptions" in the settings panel');
        }
    }

    /**
     * Shows the date navigator
     */
    showDateNavigator() {
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('Plugin', 'showDateNavigator called - creating DateNavigatorModal');
            }
            
            // Make sure state and timeFilterManager are available
            if (!this.state) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('Plugin', 'Cannot show DateNavigator: state is undefined');
                }
                new Notice('Error: Dream state not available');
                return;
            }
            
            if (!this.timeFilterManager) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('Plugin', 'Cannot show DateNavigator: timeFilterManager is undefined');
                }
                new Notice('Error: Time filter manager not available');
                return;
            }
            
            // Get all possible dream entries from various sources
            const allEntries: any[] = [];
            
            // Diagnostic log to check if there are entries
            try {
                // 1. Try direct state entries
                const entries = this.state.getDreamEntries();
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('Plugin', `Found ${entries?.length || 0} entries in state.getDreamEntries()`);
                }
                
                if (entries && Array.isArray(entries) && entries.length > 0) {
                    allEntries.push(...entries);
                }
                
                // 2. Try to directly extract data from our tables
                if (this.memoizedTableData && this.memoizedTableData.size > 0) {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('Plugin', `Found ${this.memoizedTableData.size} tables to scan for entries`);
                    }
                    
                    // Look at each table in the memoized data
                    this.memoizedTableData.forEach((tableData, key) => {
                        if (Array.isArray(tableData) && tableData.length > 0) {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].debug('Plugin', `Processing table ${key} with ${tableData.length} rows`);
                            }
                            
                            // Only process tables with rows that have date fields
                            if (tableData[0] && (tableData[0].date || tableData[0].dream_date)) {
                                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                    window['globalLogger'].debug('Plugin', `Table ${key} has valid date format`);
                                }
                                
                                // Extract dream entries from table rows
                                tableData.forEach(row => {
                                    if (row && (row.date || row.dream_date)) {
                                        const dateField = row.date || row.dream_date;
                                        
                                        // Create a dream entry from this row
                                        const entry = {
                                            date: dateField,
                                            title: row.title || row.dream_title || 'Dream Entry',
                                            content: row.content || row.dream_content || '',
                                            source: `table-${key}`,
                                            metrics: row.metrics || {}
                                        };
                                        
                                        // Add any numeric properties as metrics
                                        Object.keys(row).forEach(field => {
                                            if (typeof row[field] === 'number' && !['id', 'index'].includes(field)) {
                                                if (!entry.metrics) entry.metrics = {};
                                                entry.metrics[field] = row[field];
                                            }
                                        });
                                        
                                        allEntries.push(entry);
                                    }
                                });
                            }
                        }
                    });
                }
                
                // Log what we found
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('Plugin', `Found ${allEntries.length} total entries from all sources`);
                    
                    // Log a sample for debugging
                    if (allEntries.length > 0) {
                        window['globalLogger'].debug('Plugin', 'Sample entry:', allEntries[0]);
                    }
                }
                
                // Create some test entries if none exist
                if (allEntries.length === 0) {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('Plugin', 'No entries found, creating test entries for calendar');
                    }
                    
                    // Create simple test entries for May 2025
                    const testEntries = [];
                    const month = new Date(2025, 4, 1); // May 2025
                    
                    // Add 10 entries on random days
                    for (let i = 0; i < 10; i++) {
                        const day = Math.floor(Math.random() * 28) + 1;
                        const dateStr = `2025-05-${day.toString().padStart(2, '0')}`;
                        
                        testEntries.push({
                            date: dateStr,
                            title: `Test Dream ${i+1}`,
                            content: `Test dream content for ${dateStr}`,
                            source: 'test-generator',
                            metrics: {
                                clarity: Math.floor(Math.random() * 10) + 1,
                                intensity: Math.floor(Math.random() * 10) + 1
                            }
                        });
                    }
                    
                    // Add to our collected entries
                    allEntries.push(...testEntries);
                    
                    // Update the state with these test entries
                    if (typeof this.state.updateDreamEntries === 'function') {
                        this.state.updateDreamEntries(testEntries);
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('Plugin', 'Added test entries to state');
                        }
                    } else {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].error('Plugin', 'Cannot add test entries: updateDreamEntries not available');
                        }
                    }
                }
                
                // Expose entries globally so the DateNavigator can find them
                try {
                    window['dreamEntries'] = allEntries;
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('Plugin', `Exposed ${allEntries.length} entries to window.dreamEntries`);
                    }
                } catch (e) {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].error('Plugin', 'Failed to expose entries globally:', e);
                    }
                }
            } catch (err) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('Plugin', 'Error checking entries:', err);
                }
            }
            
            // Create a new DateNavigatorModal instance
            const modal = new DateNavigatorModal(this.app, this.state, this.timeFilterManager);
            
            // Log the modal initialization for debugging
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('Plugin', 'Opening DateNavigatorModal with state and filter manager');
            }
            
            // Open the modal

                          modal.open();
            
            // Add a notice to help users understand how to use the navigator
            new Notice('Select a date to filter your dream entries');
        } catch (error) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('Plugin', 'Failed to open date navigator:', error);
            }
            new Notice('Error opening Date Navigator. See console for details.');
        }
    }

    async openProjectNote(): Promise<void> {
        const projectNotePath = getProjectNotePath(this.settings);
        
        if (!projectNotePath) {
            new Notice("No project note set. Please set one in settings.");
            return;
        }
        
        try {
            const file = this.app.vault.getAbstractFileByPath(projectNotePath);
            if (file instanceof TFile) {
                await this.app.workspace.openLinkText(projectNotePath, '', false);
            } else {
                new Notice(`Project note not found: ${projectNotePath}`);
            }
        } catch (error) {
            new Notice(`Error opening project note: ${error.message}`);
        }
    }

    /**
     * Applies saved filters when the plugin loads or when a metrics note is opened
     * This is a crucial function for filter persistence between Obsidian reloads
     */
    private applyInitialFilters() {
        try {
            if (globalLogger) {
                globalLogger.info('Filter', 'Running applyInitialFilters - attempt to restore saved filters');
            }
            
            // Ensure settings are initialized
            if (!this.settings) {
                this.logger?.warn('Filter', 'Settings not initialized in applyInitialFilters');
                return;
            }
            
            // HIGHEST PRIORITY FIX: More robust filter persistence
            // Print all relevant info at INFO level for troubleshooting
            if (globalLogger) {
                globalLogger.info('Filter', 'Filter persistence status check', { 
                    applied: (window as any).oomFiltersApplied || false,
                    pending: (window as any).oomFiltersPending || false,
                    savedFilter: this.settings.lastAppliedFilter || 'none',
                    hasCustomRange: this.settings && this.settings.customDateRange ? true : false,
                    currentGlobalCustomRange: customDateRange ? JSON.stringify(customDateRange) : 'none'
                });
            }
            
            // Check if we already successfully applied filters
            if ((window as any).oomFiltersApplied) {
                if (globalLogger) {
                    globalLogger.debug('Filter', 'Filters already applied successfully, skipping');
                }
                return;
            }
        } catch (e) {
            this.logger?.error('Filter', 'Error in applyInitialFilters initialization', e instanceof Error ? e : new Error(String(e)));
            return;
        }
        
        // CRITICAL FIX: Double check that filter settings are consistent and load from backups if needed
        if (this.settings && !this.settings.lastAppliedFilter) {
            // Try to recover from localStorage
            try {
                const savedFilter = localStorage.getItem('oom-last-applied-filter');
                if (savedFilter) {
                    this.settings.lastAppliedFilter = savedFilter;
                    if (globalLogger) {
                        globalLogger.info('Filter', `Last-minute recovery of filter from localStorage: ${savedFilter}`);
                    }
                    
                    // Save this recovery to plugin settings
                    this.saveSettings().catch(err => {
                        if (globalLogger) {
                            globalLogger.error('Filter', 'Failed to save recovered filter', err);
                        } else {
                            this.logger?.error('Filter', 'Failed to save recovered filter', err instanceof Error ? err : new Error(String(err)));
                        }
                    });
                }
            } catch (e) {
                this.logger?.error('Filter', 'Error recovering filter from localStorage', e instanceof Error ? e : new Error(String(e)));
            }
        }
        
        // Ensure customDateRange is set from settings - with proper null checks
        if (this.settings && this.settings.lastAppliedFilter === 'custom') {
            if (this.settings.customDateRange && !customDateRange) {
                try {
                    customDateRange = { ...this.settings.customDateRange };
                    if (globalLogger) {
                        globalLogger.info('Filter', 'Restored custom date range from settings', { range: customDateRange });
                    }
                } catch (e) {
                    this.logger?.error('Filter', 'Error copying customDateRange from settings', e instanceof Error ? e : new Error(String(e)));
                }
            } else if (!this.settings.customDateRange) {
                // Try to recover from localStorage
                try {
                    const savedRangeStr = localStorage.getItem('oom-custom-date-range');
                    if (savedRangeStr) {
                        const savedRange = JSON.parse(savedRangeStr);
                        if (savedRange && savedRange.start && savedRange.end) {
                            this.settings.customDateRange = savedRange;
                            customDateRange = { ...savedRange };
                            if (globalLogger) {
                                globalLogger.info('Filter', 'Last-minute recovery of custom range from localStorage', { 
                                    range: savedRange 
                                });
                            }
                            
                            // Save this recovery
                            this.saveSettings().catch(err => {
                                if (globalLogger) {
                                    globalLogger.error('Filter', 'Failed to save recovered custom range', err);
                                } else {
                                    this.logger?.error('Filter', 'Failed to save recovered custom range', err instanceof Error ? err : new Error(String(err)));
                                }
                            });
                        }
                    }
                } catch (e) {
                    if (globalLogger) {
                        globalLogger.error('Filter', 'Error recovering custom date range in applyInitialFilters', e);
                    } else {
                        this.logger?.error('Filter', 'Error recovering custom date range', e instanceof Error ? e : new Error(String(e)));
                    }
                }
            }
        }
        
        // Find any open metrics notes
        const projectNotePath = getProjectNotePath(this.settings);
        let metricsNoteFound = false;
        
        try {
            // Log saved filter info at INFO level to ensure visibility
            if (this.settings && this.settings.lastAppliedFilter) {
                globalLogger?.debug('Filter', 'Saved filter found', { filter: this.settings.lastAppliedFilter });
                if (globalLogger) {
                    globalLogger.info('Filter', `Found saved filter settings to restore`, {
                        filter: this.settings.lastAppliedFilter,
                        customRange: this.settings && this.settings.customDateRange ? 
                            JSON.stringify(this.settings.customDateRange) : 'none'
                    });
                }
            } else {
                globalLogger?.debug('Filter', 'No saved filter found in settings');
            }
        } catch (e) {
            this.logger?.error('Filter', 'Error checking project note', e instanceof Error ? e : new Error(String(e)));
        }
        
        this.app.workspace.iterateAllLeaves(leaf => {
            if (leaf.view instanceof MarkdownView && leaf.view.file?.path === projectNotePath) {
                metricsNoteFound = true;
                globalLogger?.debug('Filter', 'Metrics note found in workspace');
                globalLogger?.info('Filter', 'Metrics note found in workspace, attempting filter restoration');
                
                // Get the view's preview element
                const previewEl = leaf.view.previewMode?.containerEl;
                if (!previewEl) {
                    globalLogger?.warn('Filter', 'Preview element not available for filter application');
                    return;
                }
                
                // Force initialization of table rows for robust filtering
                initializeTableRowClasses();
                
                // Check if filter is available immediately
                const immediateDropdown = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
                if (immediateDropdown && this.settings.lastAppliedFilter) {
                    globalLogger?.info('Filter', 'Filter dropdown found immediately, applying saved filter');
                    this.applyFilterToDropdown(immediateDropdown, previewEl);
                }
                
                // More aggressive approach: wait for DOM with increasing retry attempts
                [250, 500, 1000, 2000, 4000].forEach(delay => {
                    setTimeout(() => {
                        // Only proceed if filters haven't been successfully applied yet
                        if ((window as any).oomFiltersApplied) {
                            globalLogger?.debug('Filter', `Skipping retry at ${delay}ms, filters already applied`);
                            return;
                        }
                        
                        // Get the filter element
                        const filterDropdown = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
                        if (!filterDropdown) {
                            globalLogger?.warn('Filter', `Filter dropdown not found at ${delay}ms delay`);
                            return;
                        }
                        
                        // Ensure we have a saved filter to apply
                        if (!this.settings.lastAppliedFilter) {
                            globalLogger?.debug('Filter', `No saved filter to apply at ${delay}ms`);
                            return;
                        }
                        
                        // Attempt to apply filters
                        globalLogger?.info('Filter', `Retry filter application at ${delay}ms`);
                        
                        // Force initialize tables before applying filters
                        initializeTableRowClasses();
                        
                        // Apply the filter with high priority
                        this.applyFilterToDropdown(filterDropdown, previewEl);
                    }, delay);
                });
                
                // We only need to process one metrics note
                return;
            }
        });
        
        if (!metricsNoteFound) {
            globalLogger?.debug('Filter', 'No metrics note found in workspace');
            globalLogger?.info('Filter', 'No metrics note found in workspace, filter persistence waiting for note to be opened');
        }
    }
    
    /**
     * Helper method to apply a filter to a dropdown element
     * PRIORITY FIX: More robust filter application for persistence
     */
    private applyFilterToDropdown(filterDropdown: HTMLSelectElement, previewEl: HTMLElement) {
        // Check for saved filter
        if (this.settings.lastAppliedFilter) {
            globalLogger?.info('Filter', `Applying saved filter: ${this.settings.lastAppliedFilter}`, {
                customRange: this.settings.customDateRange ? JSON.stringify(this.settings.customDateRange) : 'none'
            });
            
            try {
                // First ensure all tables are properly initialized
                initializeTableRowClasses();
                
                // Apply date attribute repairs for correct filtering
                const rows = previewEl.querySelectorAll('.oom-dream-row');
                if (rows.length > 0) {
                    globalLogger?.info('Filter', `Found ${rows.length} table rows before applying filter`);
                } else {
                    globalLogger?.warn('Filter', 'No table rows found, may need to wait for DOM');
                    return; // Exit and let next retry handle it
                }
                
                // Set the dropdown value and store the intended filter value
                filterDropdown.value = this.settings.lastAppliedFilter;
                
                // CRITICAL FIX: Store the intended filter value globally to ensure it doesn't get overridden
                const intendedFilter = this.settings.lastAppliedFilter;
                (window as any).oomIntendedFilter = intendedFilter;
                
                globalLogger?.info('Filter', `Setting global intended filter: ${intendedFilter}`);
                
                // Apply the appropriate filter
                if (intendedFilter === 'custom' && this.settings.customDateRange) {
                    // First set global customDateRange
                    customDateRange = this.settings.customDateRange;
                    
                    // Update custom range button state
                    const customRangeBtn = previewEl.querySelector('#oom-custom-range-btn');
                    if (customRangeBtn) {
                        (customRangeBtn as HTMLElement).classList.add('active');
                    }
                    
                    // Try multiple approaches to ensure filter is applied
                    globalLogger?.info('Filter', 'Applying custom date range filter with multiple approaches');
                    
                    // 1. First call the function directly
                    applyCustomDateRangeFilter();
                    
                    // 2. Then force apply directly to DOM as backup
                    this.forceApplyFilterDirect(
                        previewEl, 
                        this.settings.customDateRange.start, 
                        this.settings.customDateRange.end
                    );
                    
                    // 3. Update the filter display manually
                    const filterDisplay = previewEl.querySelector('#oom-time-filter-display');
                    if (filterDisplay) {
                        const range = this.settings.customDateRange;
                        (filterDisplay as HTMLElement).innerHTML = 
                            `<span class="oom-filter-icon">🗓️</span>` +
                            `<span class="oom-filter-text oom-filter--custom-range">` + 
                            `Custom Range: ${range.start} to ${range.end}</span>`;
                    }
                } else {
                    // Apply standard filter
                    this.applyFilters(previewEl);
                }
                
                // Mark as successfully applied
                (window as any).oomFiltersApplied = true;
                (window as any).oomFiltersPending = false;
                
                globalLogger?.info('Filter', `Filter persistence: Successfully applied saved filter`);
                new Notice('OneiroMetrics: Restored your previous filter settings');
                
                // Update summary table after filter application
                setTimeout(() => {
                    try {
                        const filteredMetrics = collectVisibleRowMetrics(previewEl);
                        updateSummaryTable(previewEl, filteredMetrics);
                        globalLogger?.info('Filter', 'Updated summary table after filter application');
                    } catch (e) {
                        globalLogger?.error('Filter', 'Error updating summary table', e as Error);
                    }
                }, 500);
                
                return true;
            } catch (e) {
                globalLogger?.error('Filter', 'Error applying saved filter', e as Error);
                return false;
            }
        } else {
            globalLogger?.debug('Filter', 'No saved filter found in settings');
            return false;
        }
    }
    
    /**
     * Last resort direct DOM manipulation for filter application
     */
    private forceApplyFilterDirect(previewEl: HTMLElement, startDate: string, endDate: string) {
        globalLogger?.debug('Filter', 'Force applying filter directly to DOM');
        try {
            const rows = previewEl.querySelectorAll('.oom-dream-row');
            globalLogger?.debug('Filter', 'Found rows to filter', { count: rows.length });
            
            rows.forEach(row => {
                const dateAttr = row.getAttribute('data-date');
                if (!dateAttr) {
                    (row as HTMLElement).style.display = 'none';
                    return;
                }
                
                if (dateAttr >= startDate && dateAttr <= endDate) {
                    (row as HTMLElement).style.display = '';
                    (row as HTMLElement).classList.add('oom-row--visible');
                    (row as HTMLElement).classList.remove('oom-row--hidden');
                } else {
                    (row as HTMLElement).style.display = 'none';
                    (row as HTMLElement).classList.add('oom-row--hidden');
                    (row as HTMLElement).classList.remove('oom-row--visible');
                }
            });
            
            // Update filter display
            const filterDisplay = previewEl.querySelector('#oom-time-filter-display');
            if (filterDisplay) {
                filterDisplay.innerHTML = `<span class="oom-filter-icon">🔍</span> <span class="oom-filter-text">Custom Range: ${startDate} to ${endDate}</span>`;
            }
        } catch (e) {
            globalLogger?.error('Filter', 'Error in direct filter application', e as Error);
        }
    }

    /**
     * Debug helper function to be called from the developer console
     * This will dump all table data to help diagnose issues with the date navigator
     */
    public debugTableData(): void {
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('Plugin', 'Running debugTableData function');
            }
            
            // Output basic info about available data
            globalLogger?.debug('Debug', '==== DREAM METRICS DEBUG ====');
            globalLogger?.debug('Debug', 'Plugin initialized', { available: !!this });
            globalLogger?.debug('Debug', 'State initialized', { available: !!this.state });
            globalLogger?.debug('Debug', 'State has getDreamEntries', { 
                available: !!(this.state && typeof this.state.getDreamEntries === 'function') 
            });
            
            // Check for direct entries
            if (this.state && typeof this.state.getDreamEntries === 'function') {
                const entries = this.state.getDreamEntries();
                globalLogger?.debug('Debug', 'Direct state entries', { count: entries?.length || 0 });
                if (entries && entries.length > 0) {
                    globalLogger?.debug('Debug', 'Sample entry', { entry: entries[0] });
                }
            }
            
            // Check table data
            if (this.memoizedTableData) {
                globalLogger?.debug('Debug', 'Table data', { count: this.memoizedTableData.size });
                
                // Loop through all tables
                this.memoizedTableData.forEach((data, key) => {
                    globalLogger?.debug('Debug', `Table ${key}`, { rowCount: data?.length || 0 });
                    
                    // Check the first row if available
                    if (data && data.length > 0) {
                        globalLogger?.debug('Debug', `Table ${key} sample`, { row: data[0] });
                        globalLogger?.debug('Debug', `Row fields`, { fields: Object.keys(data[0]) });
                        
                        // Check for date fields
                        const hasDate = data[0].date !== undefined;
                        const hasDreamDate = data[0].dream_date !== undefined;
                        globalLogger?.debug('Debug', 'Date fields availability', { 
                            hasDate, 
                            hasDreamDate 
                        });
                        
                        // Find all date-like fields
                        const dateFields = Object.keys(data[0]).filter(key => 
                            key.includes('date') || 
                            (typeof data[0][key] === 'string' && data[0][key].match(/^\d{4}-\d{2}-\d{2}/))
                        );
                        globalLogger?.debug('Debug', 'Potential date fields', { fields: dateFields });
                        
                        // Show values of these fields
                        dateFields.forEach(field => {
                            globalLogger?.debug('Debug', `Values of field ${field}`, { 
                                values: data.slice(0, 5).map(row => row[field])
                            });
                        });
                        
                        // Check for metrics
                        const numericFields = Object.keys(data[0]).filter(key => 
                            typeof data[0][key] === 'number' && 
                            !['id', 'index'].includes(key)
                        );
                        globalLogger?.debug('Debug', 'Potential metric fields', { fields: numericFields });
                        
                        // Create an example dream entry from this data
                        if (dateFields.length > 0) {
                            globalLogger?.debug('Debug', 'Example entry conversion');
                            const dateField = dateFields[0];
                            const example = {
                                date: data[0][dateField],
                                title: data[0].title || data[0].dream_title || 'Dream Entry',
                                content: data[0].content || data[0].dream_content || '',
                                source: `table-${key}`,
                                metrics: {}
                            };
                            
                            // Add metrics
                            numericFields.forEach(field => {
                                example.metrics[field] = data[0][field];
                            });
                            
                            globalLogger?.debug('Debug', 'Example entry', { entry: example });
                        }
                    }
                });
            } else {
                globalLogger?.debug('Debug', 'No memoizedTableData available');
            }
            
            // DIRECT TABLE SCANNING FROM THE ACTIVE NOTE VIEW
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (activeView) {
                globalLogger?.debug('Debug', '==== ACTIVE NOTE TABLE SCAN ====');
                globalLogger?.debug('Debug', 'Active note', { path: activeView.file?.path || 'Unknown' });
                
                // Get the HTML content from the preview
                const previewEl = activeView.previewMode?.containerEl?.querySelector('.markdown-preview-view');
                if (previewEl) {
                    globalLogger?.debug('Debug', 'Found preview element, scanning for tables');
                    
                    // Find all tables in the preview
                    const tables = previewEl.querySelectorAll('table');
                    globalLogger?.debug('Debug', 'Tables found in active note', { count: tables.length });
                    
                    // Process each table
                    const extractedEntries: any[] = [];
                    
                    tables.forEach((table, tableIndex) => {
                        globalLogger?.debug('Debug', `Processing table`, { index: tableIndex + 1, total: tables.length });
                        
                        // Get headers
                        const headerRow = table.querySelector('thead tr');
                        if (!headerRow) {
                            globalLogger?.debug('Debug', `Table has no header row, skipping`, { tableIndex: tableIndex + 1 });
                            return;
                        }
                        
                        const headers: string[] = [];
                        headerRow.querySelectorAll('th').forEach(th => {
                            headers.push(th.textContent?.trim() || '');
                        });
                        
                        globalLogger?.debug('Debug', `Table headers`, { tableIndex: tableIndex + 1, headers });
                        
                        // Find date column index
                        const dateColumnIndex = headers.findIndex(h => 
                            h.toLowerCase().includes('date') || 
                            h.toLowerCase() === 'when'
                        );
                        
                        if (dateColumnIndex === -1) {
                            globalLogger?.debug('Debug', `Table has no date column, skipping`, { tableIndex: tableIndex + 1 });
                            return;
                        }
                        
                        globalLogger?.debug('Debug', `Date column found`, { 
                            tableIndex: tableIndex + 1, 
                            column: headers[dateColumnIndex], 
                            index: dateColumnIndex 
                        });
                        
                        // Process rows
                        const rows = table.querySelectorAll('tbody tr');
                        globalLogger?.debug('Debug', `Table rows`, { tableIndex: tableIndex + 1, count: rows.length });
                        
                        // Keep track of columns that might contain metrics
                        const potentialMetricColumns: number[] = [];
                        
                        // Process each row
                        rows.forEach((row, rowIndex) => {
                            const cells = row.querySelectorAll('td');
                            if (cells.length < headers.length) {
                                return; // Skip incomplete rows
                            }
                            
                            // Get date value
                            const dateCell = cells[dateColumnIndex];
                            const dateText = dateCell.textContent?.trim() || '';
                            
                            // Skip rows without dates
                            if (!dateText) {
                                return;
                            }
                            
                            // Try to parse the date
                            let parsedDate = '';
                            
                            // Try different date formats
                            try {
                                // Check if it's already in YYYY-MM-DD format
                                if (/^\d{4}-\d{2}-\d{2}/.test(dateText)) {
                                    parsedDate = dateText.substring(0, 10);
                                } else {
                                    // Try to parse as a Date object
                                    const date = new Date(dateText);
                                    if (!isNaN(date.getTime())) {
                                        parsedDate = date.toISOString().split('T')[0];
                                    }
                                }
                            } catch (e) {
                                globalLogger?.debug('Debug', `Error parsing date`, { dateText, error: e });
                            }
                            
                            if (!parsedDate) {
                                globalLogger?.debug('Debug', `Could not parse date, skipping row`, { dateText });
                                return;
                            }
                            
                            // Create an entry object
                            const entry: any = {
                                date: parsedDate,
                                source: `active-note-table-${tableIndex + 1}`,
                                metrics: {}
                            };
                            
                            // Process other cells
                            cells.forEach((cell, cellIndex) => {
                                if (cellIndex === dateColumnIndex) return; // Skip date column
                                
                                const header = headers[cellIndex] || `column${cellIndex}`;
                                const value = cell.textContent?.trim() || '';
                                
                                // Check if this is a title/content column
                                if (header.toLowerCase().includes('title') || 
                                    header.toLowerCase().includes('dream') || 
                                    header.toLowerCase() === 'what') {
                                    entry.title = value;
                                } else if (header.toLowerCase().includes('content') || 
                                           header.toLowerCase().includes('description') || 
                                           header.toLowerCase() === 'notes') {
                                    entry.content = value;
                                } else {
                                    // Try to parse as number for metrics
                                    const numValue = parseFloat(value);
                                    if (!isNaN(numValue)) {
                                        entry.metrics[header.toLowerCase()] = numValue;
                                        
                                        // Track this as a potential metric column
                                        if (!potentialMetricColumns.includes(cellIndex)) {
                                            potentialMetricColumns.push(cellIndex);
                                        }
                                    } else {
                                        // Store as regular property
                                        entry[header.toLowerCase()] = value;
                                    }
                                }
                            });
                            
                            // Make sure we have title and content
                            if (!entry.title) {
                                entry.title = `Dream on ${parsedDate}`;
                            }
                            
                            if (!entry.content) {
                                entry.content = `Dream entry from table ${tableIndex + 1}, row ${rowIndex + 1}`;
                            }
                            
                            // Add to entries
                            extractedEntries.push(entry);
                        });
                        
                        globalLogger?.debug('Debug', 'Potential metric columns', { 
                            tableIndex: tableIndex + 1,
                            columns: potentialMetricColumns.map(i => headers[i])
                        });
                    });
                    
                    globalLogger?.debug('Debug', 'Extracted entries from tables', { count: extractedEntries.length });
                    
                    // Show some sample entries
                    if (extractedEntries.length > 0) {
                        globalLogger?.debug('Debug', 'Sample entries');
                        extractedEntries.slice(0, 3).forEach((entry, i) => {
                            globalLogger?.debug('Debug', `Entry ${i + 1}`, { entry });
                        });
                        
                        // Add these entries to our global dreamEntries
                        if (!window['dreamEntries']) {
                            window['dreamEntries'] = [];
                        }
                        window['dreamEntries'].push(...extractedEntries);
                        globalLogger?.debug('Debug', 'Added entries to window.dreamEntries', { count: extractedEntries.length });
                        
                        // Try to add to state too
                        if (this.state && typeof this.state.updateDreamEntries === 'function') {
                            this.state.updateDreamEntries(extractedEntries);
                            globalLogger?.debug('Debug', 'Added entries to state', { count: extractedEntries.length });
                        }
                    }
                } else {
                    globalLogger?.debug('Debug', 'No preview element found in active note');
                }
                
                // Create a direct test in the current note
                const editor = activeView.editor;
                const position = editor.getCursor();
                
                // Create a test entry for today
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
                
                const testEntry = {
                    date: todayStr,
                    title: 'Test Entry ' + Math.floor(Math.random() * 1000),
                    content: 'This is a test entry created for debugging',
                    source: 'debug-test',
                    wordCount: 8, // Count of words in 'This is a test entry created for debugging'
                    metrics: {
                        clarity: 8,
                        vividness: 9,
                        intensity: 7
                    }
                };
                
                // Insert at cursor
                editor.replaceRange(
                    `\n\n## Debug Test Entry\n\`\`\`json\n${JSON.stringify(testEntry, null, 2)}\n\`\`\`\n`,
                    position
                );
                
                globalLogger?.debug('Debug', 'Created test entry', { entry: testEntry });
                
                // Directly add to global entries
                if (!window['dreamEntries']) {
                    window['dreamEntries'] = [];
                }
                window['dreamEntries'].push(testEntry);
                globalLogger?.debug('Debug', 'Added test entry to window.dreamEntries');
                
                // Try to add to state too
                if (this.state && typeof this.state.updateDreamEntries === 'function') {
                    this.state.updateDreamEntries([testEntry]);
                    globalLogger?.debug('Debug', 'Added test entry to state');
                }
            }
            
            globalLogger?.debug('Debug', '==== END DEBUG ====');
            globalLogger?.debug('Debug', 'Now open the date navigator to see if test entry appears');
            globalLogger?.debug('Debug', 'Type window.oneiroMetricsPlugin.showDateNavigator() to test');
        } catch (error) {
            globalLogger?.error('Debug', 'Error in debugTableData', { error });
        }
    }

    /**
     * Add a debug ribbon icon specifically for testing the calendar
     */
    private addCalendarDebugRibbon(): void {
        // This method is currently disabled to hide the debug ribbon
        // The debug functionality is still accessible via window.oneiroMetricsPlugin.debugDateNavigator()
        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
            window['globalLogger'].debug('Plugin', 'Calendar debug ribbon is disabled');
        }
        
        // No ribbon icon will be added
    }

    /**
     * Debug the date navigator
     * This function is accessible from the console via:
     * window.oneiroMetricsPlugin.debugDateNavigator()
     */
    debugDateNavigator() {
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('Plugin', '===== CALENDAR DEBUG FUNCTION =====');
            }
            
            // First show the date navigator
            this.showDateNavigator();
            
            // Capture the modal that was created
            const dateNavigatorModals = document.querySelectorAll('.dream-metrics-navigator-modal');
            
            if (dateNavigatorModals.length > 0) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('Plugin', `Found ${dateNavigatorModals.length} date navigator modals`);
                }
                
                // Focus on the first modal
                const modal = dateNavigatorModals[0];
                
                // Check for day cells in the modal
                const dayCells = modal.querySelectorAll('.oom-day-cell');
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('Plugin', `Found ${dayCells.length} day cells in modal`);
                }
                
                // Check for day cells with entries
                const dayCellsWithEntries = modal.querySelectorAll('.oom-day-cell.has-entries');
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('Plugin', `Found ${dayCellsWithEntries.length} day cells with entries`);
                    
                    // Check for indicators in cells
                    const dotsElements = modal.querySelectorAll('.oom-dream-indicators');
                    window['globalLogger'].debug('Plugin', `Found ${dotsElements.length} dot indicator elements`);
                    
                    const metricsElements = modal.querySelectorAll('.oom-day-metrics');
                    window['globalLogger'].debug('Plugin', `Found ${metricsElements.length} metrics star elements`);
                }
                
                // IMPORTANT: Find the actual DateNavigator instance
                setTimeout(() => {
                    try {
                        // First, find the modal container
                        const dateNavComponent = this.dateNavigator;
                        if (dateNavComponent && dateNavComponent.dateNavigator) {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].debug('Plugin', 'Found DateNavigator component instance');
                            }
                            
                            // Simple approach - just create test entries for now
                            // We'll revisit this after the refactoring
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].debug('Plugin', 'Creating test entries for calendar visualization');
                            }
                            
                            // Create guaranteed test entries for the calendar
                            dateNavComponent.dateNavigator.createGuaranteedEntriesForCurrentMonth();
                            
                            // Force update UI
                            dateNavComponent.dateNavigator.updateMonthGrid();
                            
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].debug('Plugin', 'Forced creation of guaranteed entries for calendar');
                            }
                        } else {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].warn('Plugin', 'Could not find DateNavigator component instance');
                            }
                        }
                    } catch (err) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].error('Plugin', 'Error accessing DateNavigator component:', err);
                        }
                    }
                }, 100);
            } else {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].warn('Plugin', 'No date navigator modal found in DOM');
                }
            }
            
            // Try another approach - see if the debug function is available globally
            if (window['debugDateNavigator'] && typeof window['debugDateNavigator'] === 'function') {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('Plugin', 'Calling global debugDateNavigator function');
                }
                window['debugDateNavigator']();
            } else {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].warn('Plugin', 'Global debugDateNavigator function not available');
                }
            }
            
            // Run a special debug check on global entries
            const globalEntries = window['dreamEntries'] || [];
            
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('Plugin', `Found ${globalEntries.length} entries in window.dreamEntries`);
                
                // Get entries for current month
                const today = new Date();
                const currentMonthYear = format(today, 'yyyy-MM');
                const entriesForCurrentMonth = globalEntries.filter(entry => 
                    entry && typeof entry.date === 'string' && entry.date.startsWith(currentMonthYear)
                );
                
                window['globalLogger'].debug('Plugin', `Found ${entriesForCurrentMonth.length} entries for current month ${currentMonthYear}`);
                
                // Log sample entries
                if (entriesForCurrentMonth.length > 0) {
                    window['globalLogger'].debug('Plugin', 'Sample entries for current month:');
                    entriesForCurrentMonth.slice(0, 3).forEach((entry, i) => {
                        window['globalLogger'].debug('Plugin', `Entry ${i+1}:`, entry);
                    });
                }
            }
            
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('Plugin', '===== END CALENDAR DEBUG FUNCTION =====');
            }
        } catch (e) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('Plugin', 'Error in debugDateNavigator:', e);
            }
        }
    }

    // Add this method to the plugin class
    private testContentParserDirectly() {
        const logger = getLogger('ContentParserTest');
        
        // Create a ContentParser instance
        const parser = new ContentParser();
        
        // Test note content with a dream callout
        const testContent = `
# Test Note

[!dream] Test Dream
This is a test dream.
Clarity: 4, Vividness: 3

[!memory] Memory Entry
This is a memory.
Emotional Impact: 5, Detail: 4
`;

        // Test parameter variations
        logger.debug('Test', '=== CONTENT PARSER PARAMETER VARIATION TESTS ===');
        
        // Test 1: content only
        const test1 = parser.extractDreamEntries(testContent);
        logger.debug('Test', 'Test 1 (content only)', { result: test1 });
        
        // Test 2: content + callout type
        const test2 = parser.extractDreamEntries(testContent, 'memory');
        logger.debug('Test', 'Test 2 (content, type)', { result: test2 });
        
        // Test 3: content + source
        const test3 = parser.extractDreamEntries(testContent, 'test.md');
        logger.debug('Test', 'Test 3 (content, source)', { result: test3 });
        
        // Test 4: content + type + source
        const test4 = parser.extractDreamEntries(testContent, 'dream', 'test.md');
        logger.debug('Test', 'Test 4 (content, type, source)', { result: test4 });
        
        // Test 5: static factory method
        const parser2 = ContentParser.create();
        const test5 = parser2.extractDreamEntries(testContent);
        logger.debug('Test', 'Test 5 (factory method)', { result: test5 });
        
        return "ContentParser direct tests complete - check logs for results";
    }

    // Add this method to the DreamMetricsPlugin class
    showMetricsTabsModal() {
        new MetricsTabsModal(this.app, this).open();
    }

}

// Helper to extract date for a dream entry
function getDreamEntryDate(journalLines: string[], filePath: string, fileContent: string): string {
    // 1. Block Reference (^YYYYMMDD) on the callout line or the next line
    const blockRefRegex = /\^(\d{8})/;
    for (let i = 0; i < Math.min(2, journalLines.length); i++) {
        const blockRefMatch = journalLines[i].match(blockRefRegex);
        if (blockRefMatch) {
            const dateStr = blockRefMatch[1];
            return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
        }
    }
    // 2. Date in the callout line (e.g., 'Monday, January 6, 2025')
    const calloutLine = journalLines[0] || '';
    const longDateRegex = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})/;
    const longDateMatch = calloutLine.match(longDateRegex);
    if (longDateMatch) {
        const [_, day, year] = longDateMatch;
        const dateObj = new Date(`${longDateMatch[0]}`);
        if (!isNaN(dateObj.getTime())) {
            return dateObj.toISOString().split('T')[0];
        }
    }
    // 3. YAML 'created' field
    const yamlCreatedMatch = fileContent.match(/created:\s*(\d{8})/);
    if (yamlCreatedMatch) {
        const dateStr = yamlCreatedMatch[1];
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    // 4. YAML 'modified' field
    const yamlModifiedMatch = fileContent.match(/modified:\s*(\d{8})/);
    if (yamlModifiedMatch) {
        const dateStr = yamlModifiedMatch[1];
        return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }
    // 5. Folder or filename (for year only, as a fallback)
    // Try to extract year from folder or filename
    const yearRegex = /\b(\d{4})\b/;
    const pathMatch = filePath.match(yearRegex);
    if (pathMatch) {
        return pathMatch[1];
    }
    // 6. Current date
    return new Date().toISOString().split('T')[0];
}

// Function to open the custom date range modal
function openCustomRangeModal(app: App) {
    // Get the plugin instance
    if (window.oneiroMetricsPlugin) {
        // Use the dateRangeService from the plugin instance
        window.oneiroMetricsPlugin.dateRangeService.openCustomRangeModal((range) => {
            if (range) {
                // Apply the custom date range filter
                applyCustomDateRangeFilter();
            }
        });
    } else {
        // Fallback to creating a new service if the plugin instance is not available
        const dateRangeService = new DateRangeService(app);
        dateRangeService.openCustomRangeModal((range) => {
            if (range) {
                // Apply the custom date range filter
                applyCustomDateRangeFilter();
            }
        });
    }
}

// Helper functions for range management
const CUSTOM_RANGE_KEY = 'oneirometrics-last-custom-range';
const SAVED_RANGES_KEY = 'oneirometrics-saved-custom-ranges';

function saveLastCustomRange(range: { start: string, end: string }) {
    localStorage.setItem(CUSTOM_RANGE_KEY, JSON.stringify(range));
    globalLogger?.debug('Filter', 'Saved custom range to localStorage', { range });
}

function loadLastCustomRange(): { start: string, end: string } | null {
    const data = localStorage.getItem(CUSTOM_RANGE_KEY);
    if (!data) {
        globalLogger?.debug('Filter', 'No custom range found in localStorage');
        return null;
    }
    try {
        const range = JSON.parse(data);
        globalLogger?.debug('Filter', 'Loaded custom range from localStorage', { range });
        return range;
    } catch (e) {
        globalLogger?.error('Filter', 'Failed to parse custom range from localStorage', e);
        return null;
    }
}

function saveFavoriteRange(name: string, range: { start: string, end: string }) {
    const saved = loadFavoriteRanges();
    saved[name] = range;
    localStorage.setItem(SAVED_RANGES_KEY, JSON.stringify(saved));
    globalLogger?.debug('Filter', 'Saved favorite range', { name, range });
}

function loadFavoriteRanges(): Record<string, { start: string, end: string }> {
    const data = localStorage.getItem(SAVED_RANGES_KEY);
    if (!data) return {};
    try {
        return JSON.parse(data);
    } catch {
        return {};
    }
}

function deleteFavoriteRange(name: string) {
    const saved = loadFavoriteRanges();
    delete saved[name];
    localStorage.setItem(SAVED_RANGES_KEY, JSON.stringify(saved));
    globalLogger?.debug('Filter', 'Deleted favorite range', { name });
    new Notice(`Deleted favorite: ${name}`);
}

// Find the DateNavigatorModal's Apply button click handler
// In src/dom/DateNavigatorModal.ts, replace with this direct implementation in main.ts

// Utility function to force filtering - called directly from DateNavigatorModal
function forceApplyDateFilter(date: Date) {
    // This function is now just a wrapper for the DateFilter implementation
    // The actual implementation has been moved to DateFilter class
    // This wrapper remains for backward compatibility
    globalLogger?.debug('Filter', 'Legacy forceApplyDateFilter called, forwarding to DateFilter implementation', { date });
    
    // The global instance will be initialized by the DateFilter.registerGlobalHandler() method
    if (window.forceApplyDateFilter) {
        window.forceApplyDateFilter(date);
    } else {
        globalLogger?.error('Filter', 'Global forceApplyDateFilter is not initialized');
        new Notice('Error: DateFilter not initialized. Please reload the plugin.');
    }
}

// The global registration is now handled by DateFilter.registerGlobalHandler()
// (window as any).forceApplyDateFilter = forceApplyDateFilter;

// Phase 1: CSS-based visibility optimization to reduce browser reflows
function applyCustomDateRangeFilter() {
    globalLogger?.debug('Filter', 'Custom date range filter applied', { customDateRange });
    
    if (!customDateRange) {
        globalLogger?.warn('Filter', 'No custom date range found, filter cannot be applied');
        return;
    }
    
    const previewEl = document.querySelector('.oom-metrics-container') as HTMLElement;
    if (!previewEl) {
        globalLogger?.warn('Filter', 'No metrics container found, filter cannot be applied');
        return;
    }
    
    // Ensure table styles are initialized before filtering
    initializeTableRowClasses();
    
    // Performance optimization: Prevent layout thrashing by reading all data at once
    const tableContainer = previewEl.querySelector('.oom-table-container');
    if (tableContainer) {
        // Set will-change to optimize for upcoming changes
        tableContainer.setAttribute('style', 'will-change: transform, contents; contain: content;');
    }
    
    // Store the date range values safely
    const startDateString = customDateRange?.start || '';
    const endDateString = customDateRange?.end || '';
    
    // Ensure we create the dates in a timezone-safe way
    const startYMD = startDateString.split('-').map(n => parseInt(n));
    const endYMD = endDateString.split('-').map(n => parseInt(n));
    
    // Validate the date parts
    if (startYMD.length !== 3 || endYMD.length !== 3 || 
        startYMD.some(isNaN) || endYMD.some(isNaN)) {
        globalLogger?.error('Filter', 'Invalid date format in custom range', {
            startDateString,
            endDateString
        });
        return;
    }
    
    // Create date objects with the exact day boundaries
    const startDate = new Date(startYMD[0], startYMD[1] - 1, startYMD[2], 0, 0, 0, 0);
    const endDate = new Date(endYMD[0], endYMD[1] - 1, endYMD[2], 23, 59, 59, 999);
    
    // Sanity check on the dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        globalLogger?.error('Filter', 'Could not create valid date objects for filter', {
            startYMD, 
            endYMD
        });
        return;
    }
    
    globalLogger?.debug('Filter', 'Using date objects for comparison', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dateRange: `${startDateString} to ${endDateString}`
    });
    
    // Gather all rows for processing
    const rows = previewEl.querySelectorAll('.oom-dream-row');
    const totalRows = rows.length;
    
    // Show a loading indicator for large tables
    let loadingIndicator: HTMLElement | null = null;
    if (totalRows > 50) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'oom-loading-indicator';
        loadingIndicator.textContent = 'Filtering entries...';
        loadingIndicator.style.position = 'fixed';
        loadingIndicator.style.top = '10px';
        loadingIndicator.style.right = '10px';
        loadingIndicator.style.background = 'var(--background-primary)';
        loadingIndicator.style.color = 'var(--text-normal)';
        loadingIndicator.style.padding = '8px 12px';
        loadingIndicator.style.borderRadius = '4px';
        loadingIndicator.style.boxShadow = '0 2px 8px var(--background-modifier-box-shadow)';
        loadingIndicator.style.zIndex = '1000';
        document.body.appendChild(loadingIndicator);
    }
    
    let visibleCount = 0;
    let invalidDates = 0;
    let outOfRangeDates = 0;
    
    // Pre-compute visibility without touching the DOM
    const rowVisibility: boolean[] = [];
    const rowsArray = Array.from(rows);
    
    // Process each row to determine visibility
    rowsArray.forEach((row, index) => {
        let dateAttr = row.getAttribute('data-date');
        
        if (!dateAttr || dateAttr.trim() === '') {
            // Try to fix missing date attribute
            const dateCell = row.querySelector('.column-date');
            if (dateCell && dateCell.textContent) {
                const dateText = dateCell.textContent.trim();
                try {
                    const dateObj = new Date(dateText);
                    if (!isNaN(dateObj.getTime())) {
                        dateAttr = dateObj.toISOString().split('T')[0];
                        globalLogger?.debug('Filter', `Fixed missing date attribute on row ${index}`, { date: dateAttr });
                        row.setAttribute('data-date', dateAttr);
                        dateCell.setAttribute('data-date', dateAttr);
                    }
                } catch (e) {
                    globalLogger?.error('Filter', `Failed to fix date attribute for row ${index}`, e as Error);
                }
            }
            
            if (!dateAttr || dateAttr.trim() === '') {
                globalLogger?.warn('Filter', `Row ${index} missing date attribute and cannot be fixed`);
                rowVisibility.push(false);
                return;
            }
        }
        
        // Check if date is within our range
        const isInRange = dateAttr >= startDateString && dateAttr <= endDateString;
        
        if (isInRange) {
            visibleCount++;
            globalLogger?.debug('Filter', `Row ${index} matches date range: ${dateAttr}`);
        } else {
            outOfRangeDates++;
        }
        
        rowVisibility.push(isInRange);
    });
    
    // Process rows in chunks to avoid UI freezing
    const CHUNK_SIZE = 20;
    let currentChunk = 0;
    
    const processNextChunk = () => {
        const start = currentChunk * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalRows);
        
        // Update loading indicator if present
        if (loadingIndicator) {
            const percent = Math.floor((start / totalRows) * 100);
            loadingIndicator.textContent = `Filtering entries... ${percent}%`;
        }
        
        // Apply visibility changes in a requestAnimationFrame
        requestAnimationFrame(() => {
            for (let i = start; i < end; i++) {
                const rowEl = rowsArray[i] as HTMLElement;
                const isVisible = rowVisibility[i];
                
                if (isVisible) {
                    rowEl.classList.remove('oom-row--hidden');
                    rowEl.classList.add('oom-row--visible');
                    rowEl.style.removeProperty('display');
                } else {
                    rowEl.classList.add('oom-row--hidden');
                    rowEl.classList.remove('oom-row--visible');
                    rowEl.style.display = 'none';
                }
            }
            
            currentChunk++;
            
            if (currentChunk * CHUNK_SIZE < totalRows) {
                // Continue processing chunks
                setTimeout(() => processNextChunk(), 5);
            } else {
                // All done, clean up and update
                if (loadingIndicator) {
                    document.body.removeChild(loadingIndicator);
                }
                
                // Reset will-change property
                if (tableContainer) {
                    requestAnimationFrame(() => {
                        tableContainer.removeAttribute('style');
                    });
                }
                
                // Update metrics with filtered data
                const filteredMetrics = collectVisibleRowMetrics(previewEl);
                updateSummaryTable(previewEl, filteredMetrics);
                
                // Update filter display with counts
                updateFilterDisplay(visibleCount);
                
                // Show notification with filter results
                new Notice(`Custom date filter applied: ${visibleCount} entries visible`);
                
                // Save the filter in plugin settings
                if (window.oneiroMetricsPlugin) {
                    try {
                        window.oneiroMetricsPlugin.settings.lastAppliedFilter = 'custom';
                        window.oneiroMetricsPlugin.settings.customDateRange = customDateRange;
                        window.oneiroMetricsPlugin.saveSettings();
                    } catch (e) {
                        globalLogger?.error('State', 'Failed to save filter setting', e as Error);
                    }
                }
            }
        });
    };
    
    // Start processing after a short delay
    setTimeout(() => processNextChunk(), 10);
}

function updateFilterDisplay(entryCount: number) {
    // Mark filters as successfully applied
    (window as any).oomFiltersApplied = true;
    (window as any).oomFiltersPending = false;
    
    // Log at INFO level to ensure it's visible in logs
    globalLogger?.info('Filter', `Filter display updated with ${entryCount} entries`, { 
        customRange: customDateRange ? 'active' : 'none',
        success: true
    });
    
    globalLogger?.debug('Filter', 'Updating filter display', {
        entryCount,
        customDateRange: customDateRange ? 'active' : 'none'
    });
    
    const filterDisplay = document.getElementById('oom-time-filter-display');
    if (!filterDisplay) {
        globalLogger?.warn('Filter', 'Filter display element not found');
        return;
    }
    
    // Temporarily set will-change to optimize for layout changes
    filterDisplay.style.willChange = 'contents';
    
    // Create a complete HTML string instead of multiple DOM manipulations
    // This is more efficient as it causes only one reflow when inserted
    let htmlContent = '';
    
    // Icon element
    htmlContent += '<span class="oom-filter-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-calendar-range"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M17 14h-6"/><path d="M13 18H7"/></svg></span>';
    
    // Text content with appropriate class
    if (customDateRange) {
        htmlContent += `<span class="oom-filter-text oom-filter--custom-range"> Custom Range: ${customDateRange.start} to ${customDateRange.end} (${entryCount} entries) <span class="oom-filter-clear" title="Clear custom range" tabindex="0" role="button" aria-label="Clear date filter">×</span></span>`;
    } else {
        // Show dropdown label
        const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
        const label = dropdown ? dropdown.options[dropdown.selectedIndex].text : 'All Time';
        htmlContent += `<span class="oom-filter-text oom-filter--all-visible"> ${label} (${entryCount} entries) </span>`;
    }
    
    // Use a single update to minimize reflows
    requestAnimationFrame(() => {
        // First, remove the transition for immediate change
        filterDisplay.style.transition = 'none';
        filterDisplay.classList.remove('oom-filter-display--updated');
        
        // Force a reflow to ensure the removal of the class takes effect immediately
        void filterDisplay.offsetHeight;
        
        // Apply the HTML content in one operation
        filterDisplay.innerHTML = htmlContent;
        
        // Now add event listeners to the clear button if present
        const clearBtn = filterDisplay.querySelector('.oom-filter-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                // Prevent event bubbling for better performance
                e.stopPropagation();
                
                globalLogger?.info('Filter', 'User cleared custom date filter');
                globalLogger?.debug('Events', 'Clear filter button clicked', {
                    previousFilter: customDateRange ? 'custom' : 'none'
                });
                
                customDateRange = null;
                
                // Clear the saved filter in plugin settings
                if (window.oneiroMetricsPlugin) {
                    try {
                        // Update filter settings
                        window.oneiroMetricsPlugin.settings.lastAppliedFilter = 'all';
                        window.oneiroMetricsPlugin.settings.customDateRange = undefined;
                        
                        // Force save to ensure persistence
                        window.oneiroMetricsPlugin.saveSettings().then(() => {
                            globalLogger?.info('Filter', 'Settings saved after clearing filter');
                            globalLogger?.debug('State', 'Settings persisted after filter cleared', {
                                success: true,
                                filter: 'all'
                            });
                            
                            // Show notification
                            new Notice('Filter cleared - showing all entries');
                        }).catch(err => {
                            globalLogger?.error('State', 'Failed to clear filter setting', err as Error);
                        });
                    } catch (e) {
                        globalLogger?.error('State', 'Failed to clear filter setting', e as Error);
                    }
                }
                
                // Batch related DOM operations together
                requestAnimationFrame(() => {
                    const btn = document.getElementById('oom-custom-range-btn');
                    if (btn) btn.classList.remove('active');
                    
                    const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
                    if (dropdown) {
                        dropdown.value = 'all'; // Reset to show all
                        dropdown.dispatchEvent(new Event('change'));
                    }
                });
            });
            
            // Keyboard accessibility
            clearBtn.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    (e.target as HTMLElement).click();
                }
            });
        }
        
        // Add the animation class in the next frame
        setTimeout(() => {
            // Reset will-change property
            filterDisplay.style.willChange = 'auto';
            
            // Restore transition and add the updated class
            filterDisplay.style.removeProperty('transition');
            filterDisplay.classList.add('oom-filter-display--updated');
            
            // Remove class after transition completes
            setTimeout(() => {
                filterDisplay.classList.remove('oom-filter-display--updated');
            }, 1000);
        }, 20);
    });
}

// Add this function to initialize CSS classes for table rows with performance optimizations
function initializeTableRowClasses() {
    // Use a flag to ensure this only runs once per page load
    if ((window as any).__tableRowsInitialized) {
        globalLogger?.debug('UI', 'Table rows already initialized, skipping initialization');
        
        // Even if already initialized, run a repair on date attributes
        runDateAttributeRepair();
        
        return;
    }
    
    // Helper function to repair date attributes on tables
    function runDateAttributeRepair() {
        // Try multiple ways to find rows
        const rowsSelectors = [
            '.oom-dream-row',
            '#oom-dream-entries-table tbody tr',
            '.oom-table tbody tr'
        ];
        
        let rows: NodeListOf<Element> | null = null;
        
        // Try each selector until we find rows
        for (const selector of rowsSelectors) {
            const foundRows = document.querySelectorAll(selector);
            if (foundRows && foundRows.length > 0) {
                rows = foundRows;
                globalLogger?.debug('Filter', `Found rows using selector: ${selector}`, { count: foundRows.length });
                break;
            }
        }
        
        if (!rows || rows.length === 0) {
            globalLogger?.warn('UI', 'No table rows found for date attribute repair');
            return;
        }
        
        let rowsWithoutDates = 0;
        let rowsFixed = 0;
        
        globalLogger?.info('Filter', `Checking date attributes on ${rows.length} rows`);
        globalLogger?.debug('Filter', 'Starting date attribute verification process', { totalRows: rows.length });
        
        rows.forEach((row, index) => {
            const dateAttr = row.getAttribute('data-date');
            if (!dateAttr) {
                rowsWithoutDates++;
                
                // Try to extract date from the date column
                const dateCell = row.querySelector('.column-date');
                if (dateCell && dateCell.textContent) {
                    const dateText = dateCell.textContent.trim();
                    try {
                        // Parse the displayed date back to YYYY-MM-DD format
                        const date = new Date(dateText);
                        if (!isNaN(date.getTime())) {
                            const isoDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
                            globalLogger?.debug('Filter', `Fixing date attribute on row ${index}`, { 
                                rowIndex: index, 
                                date: isoDate,
                                dateText: dateText
                            });
                            globalLogger?.info('Filter', `Fixed missing date attribute on row ${index}`, { date: isoDate });
                            
                            // Apply the fix to multiple attributes for redundancy
                            row.setAttribute('data-date', isoDate);
                            row.setAttribute('data-date-raw', isoDate);
                            row.setAttribute('data-iso-date', isoDate);
                            
                            if (dateCell) {
                                dateCell.setAttribute('data-date', isoDate);
                                dateCell.setAttribute('data-iso-date', isoDate);
                            }
                            rowsFixed++;
                        }
                    } catch (e) {
                        globalLogger?.error('Filter', `Failed to fix date attribute for row ${index}`, e as Error);
                    }
                }
            }
        });
        
        globalLogger?.info('Filter', `Date attribute repair complete`, { missing: rowsWithoutDates, fixed: rowsFixed });
        globalLogger?.debug('Filter', 'Date attribute verification finished', { 
            totalRows: rows.length,
            rowsWithoutDates,
            rowsFixed,
            success: rowsFixed > 0
        });
    }
    
    // Use requestIdleCallback to run this during browser idle time
    // This prevents blocking the main thread during initial page load
    const runWhenIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
    
    runWhenIdle(() => {
        globalLogger?.debug('UI', 'Initializing table row classes during idle time');
        
        // Try multiple ways to find tables
        const tableSelectors = [
            '#oom-dream-entries-table', 
            '.oom-table:not(.oom-stats-table)',
            '.oom-table'
        ];
        
        let tables: NodeListOf<Element> | null = null;
        
        // Try each selector until we find tables
        for (const selector of tableSelectors) {
            const foundTables = document.querySelectorAll(selector);
            if (foundTables && foundTables.length > 0) {
                tables = foundTables;
                globalLogger?.debug('UI', `Found tables using selector: ${selector}`, { count: foundTables.length });
                break;
            }
        }
        
        if (!tables || tables.length === 0) {
            globalLogger?.warn('UI', 'No tables found for row initialization');
            return;
        }
        
        // Process tables one at a time to avoid large reflows
        tables.forEach((table) => {
            // Use DocumentFragment to batch DOM operations
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            
            if (rows.length === 0) {
                globalLogger?.warn('UI', 'No rows found in table');
                return;
            }
            
            globalLogger?.debug('UI', `Initializing table rows`, { count: rows.length });
            
            // Process rows in chunks to avoid long tasks
            const CHUNK_SIZE = 20;
            let currentChunk = 0;
            
            const processNextChunk = () => {
                const start = currentChunk * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, rows.length);
                
                // Use a single requestAnimationFrame to batch operations
                requestAnimationFrame(() => {
                    for (let i = start; i < end; i++) {
                        const row = rows[i];
                        // Add base class to all rows
                        row.classList.add('oom-dream-row');
                        
                        // Default all rows to visible
                        row.classList.add('oom-row--visible');
                        
                        // Make sure hidden class is not present initially
                        row.classList.remove('oom-row--hidden');
                        
                        // Make sure inline style display is removed if it exists
                        (row as HTMLElement).style.removeProperty('display');
                    }
                    
                    // Move to next chunk or finish
                    currentChunk++;
                    
                    if (currentChunk * CHUNK_SIZE < rows.length) {
                        // Schedule next chunk with slight delay
                        setTimeout(processNextChunk, 10);
                    } else {
                        globalLogger?.info('UI', 'Table row initialization complete', { 
                            rowsProcessed: rows.length,
                            performance: 'chunked'
                        });
                    }
                });
            };
            
            // Start processing chunks with slight delay to allow initial render
            setTimeout(processNextChunk, 50);
        });
        
        // Set the flag to prevent reinitialization
        (window as any).__tableRowsInitialized = true;
        
        // Run date attribute repair after initialization
        runDateAttributeRepair();
    }, { timeout: 1000 });
}

// Function to collect metrics data from visible rows only
function collectVisibleRowMetrics(container: HTMLElement): Record<string, number[]> {
    globalLogger?.debug('Metrics', 'Collecting metrics from visible rows');
    
    // CRITICAL FIX: Ensure we're selecting the correct table and rows
    // Get only the main metrics table, not any other tables
    const mainTable = container.querySelector('table:not(.oom-stats-table)');
    if (!mainTable) {
        globalLogger?.warn('Metrics', 'Main table not found for metrics collection');
        return {};
    }
    
    // Get visible rows from the main table only (not the summary stats table)
    const visibleRows = mainTable.querySelectorAll('tbody tr:not(.oom-row--hidden)');
    
    // Log what we found for debugging
    globalLogger?.info('Metrics', `Found ${visibleRows.length} visible rows for metrics collection`);
    
    const metrics: Record<string, number[]> = {};
    
    // Create a proper mapping of column indices to metric names
    const headerMapping: Record<number, string> = {};
    const headerCells = Array.from(mainTable.querySelectorAll('thead th'));
    
    // Log header cells for debugging
    globalLogger?.debug('Metrics', `Found ${headerCells.length} header cells`);
    
    // Map column indices to their header names for accurate data collection
    headerCells.forEach((header, index) => {
        const metricName = header.textContent?.trim() || '';
        if (metricName) {
            headerMapping[index] = metricName;
            globalLogger?.debug('Metrics', `Mapped column ${index} to "${metricName}"`);
        }
    });
    
    // Initialize metrics with empty arrays from main table headers
    headerCells.forEach(header => {
        const metricName = header.textContent?.trim() || '';
        // Only include numeric columns, not text columns like Date, Title, Content
        if (metricName && 
            metricName !== 'Date' && 
            metricName !== 'Dream Title' && 
            metricName !== 'Content') {
            metrics[metricName] = [];
        }
    });
    
    // Always include Words metric
    if (!metrics['Words']) {
        metrics['Words'] = [];
    }
    
    // Collect metrics from visible rows with robust column mapping
    visibleRows.forEach((row) => {
        // Get all cells in the row
        const cells = Array.from(row.querySelectorAll('td'));
        
        // Process each cell using our header mapping
        cells.forEach((cell, cellIndex) => {
            const metricName = headerMapping[cellIndex];
            
            // Skip cells that don't map to a metric or are non-numeric columns
            if (!metricName || 
                metricName === 'Date' || 
                metricName === 'Dream Title' || 
                metricName === 'Content') {
                return;
            }
            
            // Special handling for Words column
            if (metricName === 'Words' && cell.classList.contains('column-words')) {
                const wordsValue = parseInt(cell.textContent?.trim() || '0', 10);
                if (!isNaN(wordsValue)) {
                    metrics['Words'].push(wordsValue);
                }
                return;
            }
            
            // Handle regular metric columns - ensure the cell has the metric-value class
            if (cell.classList.contains('metric-value') || 
                (cell.textContent && !isNaN(parseFloat(cell.textContent.trim())))) {
                
                const value = parseFloat(cell.textContent?.trim() || '0');
                if (!isNaN(value)) {
                    if (!metrics[metricName]) {
                        metrics[metricName] = [];
                    }
                    metrics[metricName].push(value);
                }
            }
        });
    });
    
    // Log detailed metrics information for debugging
    const metricsInfo = Object.entries(metrics).map(([name, values]) => {
        return {
            name,
            count: values.length,
            hasValidData: values.length > 0
        };
    });
    
    globalLogger?.debug('Metrics', 'Finished collecting metrics from visible rows', { 
        metricsFound: Object.keys(metrics).length,
        dataPoints: Object.values(metrics).reduce((sum, arr) => sum + arr.length, 0),
        metrics: metricsInfo
    });
    
    return metrics;
}

// Function to update the summary table with new metrics
function updateSummaryTable(container: HTMLElement, metrics: Record<string, number[]>) {
    globalLogger?.debug('UI', 'Updating summary table with filtered metrics');
    const summarySection = container.querySelector('.oom-stats-section');
    if (!summarySection) {
        globalLogger?.warn('UI', 'No summary section found for metrics update');
        return;
    }
    
    // Set will-change to optimize for upcoming changes
    summarySection.setAttribute('style', 'will-change: contents;');
    
    // Generate new summary table content
    let content = '<h2 class="oom-table-title oom-stats-title">Statistics (Filtered)</h2>';
    content += '<div class="oom-table-container">\n';
    content += '<table class="oom-table oom-stats-table">\n';
    content += '<thead>\n';
    content += '<tr>\n';
    content += '<th>Metric</th>\n';
    content += '<th>Average</th>\n';
    content += '<th>Min</th>\n';
    content += '<th>Max</th>\n';
    content += '<th>Count</th>\n';
    content += '</tr>\n';
    content += '</thead>\n';
    content += '<tbody>\n';

    // CRITICAL FIX: Process metrics in a specific order with data validation
    // This ensures no duplicate or inconsistent metrics in the table
    
    // First, get a clean, deduplicated list of metric names
    // Skip any metrics that aren't properly formatted
    const metricNames = Array.from(new Set(Object.keys(metrics).map(name => name.trim())))
        .filter(name => name && typeof name === 'string' && name.length > 0);
    
    // Log what metrics we found for debugging
    globalLogger?.debug('Metrics', 'Processing metrics for summary table', {
        foundMetrics: metricNames.join(', '),
        count: metricNames.length
    });
    
    // Process metrics in a consistent order - always put Words first
    const orderedMetrics = ['Words'].concat(
        metricNames.filter(name => name !== 'Words').sort()
    );
    
    let hasMetrics = false;
    
    // Process each metric in our controlled order
    for (const name of orderedMetrics) {
        // Skip if this metric doesn't exist in our data
        if (!metrics[name]) continue;
        
        const values = metrics[name];
        if (!values || !Array.isArray(values) || values.length === 0) continue;
        
        // Validate all values are numbers
        const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
        if (validValues.length === 0) continue;
        
        hasMetrics = true;
        const avg = validValues.reduce((a, b) => a + b) / validValues.length;
        const min = Math.min(...validValues);
        const max = Math.max(...validValues);
        let label = name;
        
        if (name === 'Words') {
            const total = validValues.reduce((a, b) => a + b, 0);
            label = `Words <span class="oom-words-total">(total: ${total})</span>`;
        }
        
        content += '<tr>\n';
        content += `<td>${label}</td>\n`;
        content += `<td class="metric-value">${avg.toFixed(2)}</td>\n`;
        content += `<td class="metric-value">${min}</td>\n`;
        content += `<td class="metric-value">${max}</td>\n`;
        content += `<td class="metric-value">${validValues.length}</td>\n`;
        content += '</tr>\n';
    }

    if (!hasMetrics) {
        content += '<tr><td colspan="5" class="oom-no-metrics">No metrics available for filtered results</td></tr>\n';
    }

    content += '</tbody>\n';
    content += '</table>\n';
    content += '</div>\n';
    
    // Update the summary section in a requestAnimationFrame to avoid forced reflows
    requestAnimationFrame(() => {
                    // CRITICAL FIX: Only update the summary section, not any other tables
            // Make sure we're actually updating the right element to avoid duplicate content
            if (summarySection.classList.contains('oom-stats-section')) {
                // First, completely remove all existing content to ensure a fresh start
                summarySection.innerHTML = '';
                
                // Log what we're about to do
                globalLogger?.debug('UI', 'Completely replacing summary section content');
                
                // Force reflow before adding new content to ensure clean replacement
                void (summarySection as HTMLElement).offsetHeight;
                
                // Now add the new content
                summarySection.innerHTML = content;
            
            // Additional verification - check for duplicated tables after update
            setTimeout(() => {
                const allStatsTables = container.querySelectorAll('.oom-stats-table');
                if (allStatsTables.length > 1) {
                    // Found multiple stats tables - something went wrong
                    globalLogger?.error('UI', `Found ${allStatsTables.length} stats tables after update - attempting emergency fix`);
                    
                    // Emergency fix: Keep only the first stats table and remove others
                    allStatsTables.forEach((table, index) => {
                        if (index > 0) {
                            table.remove();
                        }
                    });
                }
            }, 50);
        } else {
            globalLogger?.error('UI', 'Attempted to update incorrect element as summary section', {
                foundElement: summarySection.className
            });
        }
        
        // Remove will-change property after update
        setTimeout(() => {
            summarySection.removeAttribute('style');
        }, 100);
    });
}

// Helper function to format a date for display
function formatDateForDisplay(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

// Function to force apply a date filter, called from DateNavigatorModal
window.forceApplyDateFilter = function(selectedDate: Date) {
    globalLogger?.debug('Filter', 'forceApplyDateFilter called', { date: selectedDate });
    
    if (!selectedDate) {
        globalLogger?.error('Filter', 'No date provided to forceApplyDateFilter');
        new Notice('Cannot apply filter: no date selected.');
        return;
    }
    
    // Save this custom date filter in plugin settings if plugin instance is available
    if (window.oneiroMetricsPlugin) {
        try {
            // Format the date in YYYY-MM-DD format
            const dateStr = selectedDate.toISOString().split('T')[0];
            
            // Save both the filter type and the custom date range
            window.oneiroMetricsPlugin.settings.lastAppliedFilter = 'custom';
            window.oneiroMetricsPlugin.settings.customDateRange = {
                start: dateStr,
                end: dateStr
            };
            
            window.oneiroMetricsPlugin.saveSettings().catch(err => {
                globalLogger?.error('Filter', 'Failed to save custom date filter setting', { error: err });
            });
        } catch (e) {
            globalLogger?.error('Filter', 'Failed to save custom date filter', { error: e });
        }
    }

    // Get the OOM content
    const previewEl = document.querySelector('.oom-metrics-content');
    if (!previewEl) {
        globalLogger?.error('Filter', 'Cannot find .oom-metrics-content element');
        new Notice('Cannot apply filter: OOM content not found.');
        return;
    }

    // Create start and end of day for precise filtering
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    globalLogger?.debug('Filter', 'Filtering for date range', {
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString()
    });

    // Get all rows
    const rows = previewEl.querySelectorAll('.oom-dream-row');
    globalLogger?.debug('Filter', 'Found rows to filter', { count: rows.length });
    
    // For performance, prepare date strings before filtering
    const startStr = startOfDay.toISOString().split('T')[0];
    const endStr = endOfDay.toISOString().split('T')[0];
    
    // Track counts for feedback
    let visibleCount = 0;
    let hiddenCount = 0;
    let invalidDateCount = 0;
    
    // Apply date filter to each row
    rows.forEach(row => {
        const dateCell = row.querySelector('.column-date');
        if (!dateCell || !dateCell.textContent) {
            invalidDateCount++;
            (row as HTMLElement).classList.add('oom-row--hidden');
            (row as HTMLElement).classList.remove('oom-row--visible');
            return;
        }
        
        try {
            // Parse date from cell
            const dateText = dateCell.textContent.trim();
            const rowDate = new Date(dateText);
            const rowDateStr = rowDate.toISOString().split('T')[0];
            
            // Check if the date matches the selected date
            const isVisible = rowDateStr === startStr;
            
            if (isVisible) {
                (row as HTMLElement).classList.remove('oom-row--hidden');
                (row as HTMLElement).classList.add('oom-row--visible');
                visibleCount++;
            } else {
                (row as HTMLElement).classList.add('oom-row--hidden');
                (row as HTMLElement).classList.remove('oom-row--visible');
                hiddenCount++;
            }
        } catch (e) {
            globalLogger?.error('Filter', 'Error processing row date', { 
                dateText: dateCell.textContent, 
                error: e 
            });
            invalidDateCount++;
            (row as HTMLElement).classList.add('oom-row--hidden');
            (row as HTMLElement).classList.remove('oom-row--visible');
        }
    });
    
    globalLogger?.debug('Filter', 'Date filter applied', { 
        visibleCount, 
        hiddenCount, 
        invalidDateCount 
    });
    
    // Update the filter display
    const filterDisplay = previewEl.querySelector('#oom-time-filter-display');
    if (filterDisplay) {
        filterDisplay.textContent = `Filtered by date: ${selectedDate.toLocaleDateString()} (${visibleCount} entries)`;
        filterDisplay.classList.add('oom-filter-active');
    }
    
    // IMPORTANT: Update summary table with filtered metrics
    const filteredMetrics = collectVisibleRowMetrics(previewEl as HTMLElement);
    updateSummaryTable(previewEl as HTMLElement, filteredMetrics);
    
    new Notice(`Date filter applied: ${visibleCount} entries visible`);
}

// Add TypeScript declaration for the window object extension
declare global {
    interface Window {
        forceApplyDateFilter: (selectedDate: Date) => void;
        oneiroMetricsPlugin: DreamMetricsPlugin;
    }
}

// Debug helper - expose content expansion function to window object for console debugging
(window as any).debugContentExpansion = function(showExpanded: boolean = true) {
    globalLogger?.debug('UI', 'Manual content expansion debug triggered', { showExpanded });
    
    // Get the OOM content container
    const previewEl = document.querySelector('.oom-metrics-content') as HTMLElement;
    if (!previewEl) {
        globalLogger?.error('UI', 'Cannot find .oom-metrics-content element');
        return 'Error: Content container not found';
    }
    
    // Find all expand buttons
    const expandButtons = previewEl.querySelectorAll('.oom-button--expand');
    globalLogger?.debug('UI', 'Found content expansion buttons', { count: expandButtons.length });
    
    if (expandButtons.length === 0) {
        return 'No content expansion buttons found';
    }
    
    // Toggle each button to the desired state
    let processed = 0;
    expandButtons.forEach(button => {
        const isCurrentlyExpanded = button.getAttribute('data-expanded') === 'true';
        
        // Only process if the button isn't already in the desired state
        if (showExpanded !== isCurrentlyExpanded) {
            globalLogger?.debug('UI', 'Processing button', { 
                id: button.getAttribute('data-parent-cell'),
                current: isCurrentlyExpanded, 
                target: showExpanded 
            });
            toggleContentVisibility(button as HTMLElement);
            processed++;
        }
    });
    
    // Output summary
    if (processed > 0) {
        return `${processed} content sections ${showExpanded ? 'expanded' : 'collapsed'}`;
    } else {
        return `All content sections already ${showExpanded ? 'expanded' : 'collapsed'}`;
    }
};

// Helper function to safely access settings properties (handles type compatibility during refactoring)
function safeSettingsAccess(settings: any, propName: string, defaultValue: any = undefined) {
    if (!settings) return defaultValue;
    return settings[propName] !== undefined ? settings[propName] : defaultValue;
}

// Helper function for icon rendering
function getIcon(iconName: string): string | null {
    if (!iconName) return null;
    
    // Special case handling for known icons that might have naming inconsistencies
    if (iconName === 'circle-off') iconName = 'circle-minus';
    
    // Check if it's a Lucide icon from our map
    const lucideIcon = lucideIconMap?.[iconName];
    if (lucideIcon) return lucideIcon;
    
    // Try getting from Obsidian's built-in icons
    try {
        const obsidianIcon = getIcon(iconName);
        if (obsidianIcon) return obsidianIcon;
    } catch (e) {
        // Silent fail and continue to fallback
    }
    
    // Return a simple span as fallback
    return `<span class="icon">${iconName}</span>`;
}

// Helper function for icon rendering
function getMetricIcon(iconName: string): string | null {
    if (!iconName) return null;
    
    // Special case handling for known icons that might have naming inconsistencies
    if (iconName === 'circle-off') iconName = 'circle-minus';
    if (iconName === 'circle') iconName = 'circle-dot';
    if (iconName === 'x') iconName = 'x-circle';
    
    // Check if it's a Lucide icon from our map
    let iconHtml = lucideIconMap?.[iconName];
    
    if (iconHtml) {
        // Modify SVG to include width and height attributes
        // Add additional classes for better styling and consistency
        iconHtml = iconHtml
            .replace('<svg ', '<svg width="18" height="18" class="oom-metric-icon" ')
            .replace('stroke-width="2"', 'stroke-width="2.5"');
        
        // Wrap in a container for better positioning
        return `<span class="oom-metric-icon-container">${iconHtml}</span>`;
    }
    
    // If no icon found but we have a name, use a text fallback
    if (iconName) {
        // Simple visual indicator of the icon type
        switch (iconName.toLowerCase()) {
            case 'circle':
            case 'circle-dot':
                return `<span class="oom-icon-text">●</span>`;
            case 'x':
            case 'x-circle':
                return `<span class="oom-icon-text">✕</span>`;
            case 'square':
                return `<span class="oom-icon-text">■</span>`;
            case 'triangle':
                return `<span class="oom-icon-text">▲</span>`;
            case 'star':
                return `<span class="oom-icon-text">★</span>`;
            default:
                return `<span class="oom-icon-text oom-icon-${iconName}">•</span>`;
        }
    }
    
    // Last resort fallback - return nothing
    return null;
}

// These global functions now delegate to the ContentToggler instance
function toggleContentVisibility(button: HTMLElement) {
    globalContentToggler.toggleContentVisibility(button);
}

function expandAllContentSections(previewEl: HTMLElement) {
    globalContentToggler.expandAllContentSections(previewEl);
}

// Copyright (c) 2025 John Banister
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// Import the safe logger immediately at the top
import safeLogger, { getSafeLogger, SafeLogger } from './src/logging/safe-logger';

// External imports (Obsidian)
import { 
  App, 
  Editor, 
  FileSystemAdapter, 
  FileView, 
  MarkdownView, 
  Menu,
  MetadataCache, 
  Modal, 
  Notice, 
  Plugin, 
  Scope, 
  Setting, 
  TFile, 
  TFolder, 
  Vault, 
  WorkspaceLeaf, 
  parseYaml,
  parseFrontMatterEntry,
  parseFrontMatterTags,
  MarkdownRenderer,
  ButtonComponent,
  MarkdownPreviewView
} from 'obsidian';

// External libraries
import { 
  format, 
  startOfDay, 
  endOfDay, 
  addMonths, 
  subMonths, 
  subDays, 
  subWeeks,
  addDays,
  isAfter,
  isBefore,
  isWithinInterval,
  parse,
  isValid,
  formatISO
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
import { SettingsAdapter } from './src/state/adapters/SettingsAdapter';

// Import EventHandling utilities for event handling
import { attachClickEvent, attachEvent, createEventHandler, createClickHandler, debounceEventHandler, throttleEventHandler } from './src/templates/ui/EventHandling';

// For backward compatibility with legacy types
import { LintingSettings, Timeline, CalendarView, ActiveJournal } from './types';

// Internal imports - Settings
import { DreamMetricsSettingTab, lucideIconMap } from './settings';
import { createFolderAutocomplete, createSelectedNotesAutocomplete } from './autocomplete';

// Internal imports - Logging
import { Logger as LogManager } from './utils/logger';
import { LoggingAdapter } from './src/logging';

// Internal imports - UI Components
import { CustomDateRangeModal } from './src/CustomDateRangeModal';
import { DateNavigatorModal, NavigatorViewMode } from './src/dom/DateNavigatorModal';
import { DateNavigatorView, DATE_NAVIGATOR_VIEW_TYPE } from './src/dom/DateNavigatorView';
import { DateNavigatorIntegration } from './src/dom/DateNavigatorIntegration';

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

// Add near the top with other imports
import { runSettingsHelpersTests } from './src/testing/utils/SettingsHelpersTests';
import { runMetricHelpersTests } from './src/testing/utils/MetricHelpersTests';
import { runSelectionModeHelperTests } from './src/testing/utils/SelectionModeHelpersTests';
import { runTypeGuardsTests } from './src/testing/utils/TypeGuardsTests';
import { runPropertyHelpersTests } from './src/testing/utils/PropertyHelpersTests';
import { runContentParserParameterTests } from './src/testing/run-content-parser-tests';
import { ContentParser } from './src/parsing/services/ContentParser';
import { runSettingsAdapterTests } from './src/testing/utils/SettingsAdapterTests';
import { runEventHandlingTests } from './src/testing/utils/EventHandlingTests';
import { runComponentFactoryTests } from './src/testing/utils/ComponentFactoryTests';
import { runDreamMetricsStateTests } from './src/testing/DreamMetricsStateTests';

// Import the DEFAULT_JOURNAL_STRUCTURE_SETTINGS constant directly from the source
import { DEFAULT_JOURNAL_STRUCTURE_SETTINGS } from './src/types/journal-check';

// Move this to the top of the file, before any functions that use it
let customDateRange: { start: string, end: string } | null = null;

// Create a global logger instance for functions outside the plugin class
// Initialize with safe logger first, but keep the type compatible with LoggingAdapter
let globalLogger: any = safeLogger;

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

export default class DreamMetricsPlugin extends Plugin {
    settings: DreamMetricsSettings;
    ribbonIconEl: HTMLElement;
    statusBarItemEl: HTMLElement;
    timeline: Timeline;
    calendar: CalendarView;
    
    // Use a more specific type for logger
    logger: LogManager | LoggingAdapter;
    
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

    async onload() {
        // Initialize mutable state and app state
        this.state = new DreamMetricsState();
        
        // Use safe logger for early logging before the main logger is initialized
        safeLogger.info('Plugin', 'Loading Dream Metrics plugin');
        safeLogger.debug('Plugin', 'Plugin onload called - will setup filter persistence');
        
        // Initialize logs directory for plugin logs
        if (this.app.vault.adapter instanceof FileSystemAdapter) {
            const baseFolder = (this.app.vault.adapter as FileSystemAdapter).getBasePath();
            
            try {
                // Check if logs directory exists
                await this.app.vault.adapter.exists(`${baseFolder}/logs`);
            } catch (error) {
                // If it doesn't exist, try to create it
                try {
                    // @ts-ignore - fs is not in the types
                    await this.app.vault.adapter.mkdir(`${baseFolder}/logs`);
                } catch (mkdirError) {
                    safeLogger.error('Plugin', "Could not create logs directory", mkdirError instanceof Error ? mkdirError : new Error(String(mkdirError)));
                }
            }
        }
        
        // Register event listeners for when the active leaf changes
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                safeLogger.debug('Events', 'Active leaf changed, checking for metrics note view');
                // Delay to ensure content is rendered
                setTimeout(() => {
                    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                    if (view && view.getMode() === 'preview') {
                        const file = view.file;
                        if (file && file.path === getProjectNotePath(this.settings)) {
                            safeLogger.debug('Events', 'Metrics note view detected, attaching event listeners');
                            this.attachProjectNoteEventListeners();
                        }
                    }
                }, 500); // 500ms delay to ensure content is rendered
            })
        );
        
        // Listen for Obsidian's app ready state
        this.app.workspace.onLayoutReady(() => {
            // Use info level to ensure it's visible in logs
            try {
                if (globalLogger) {
                    globalLogger.info('Filter', 'Obsidian layout ready - preparing to apply filter persistence');
                }
                
                // Make sure settings object exists and is initialized
                if (!this.settings) {
                    console.warn("Settings not initialized yet, deferring filter application");
                    // Load settings and try again
                    this.loadSettings().then(() => {
                        setTimeout(() => this.applyInitialFilters(), 1000);
                    });
                    return;
                }
                
                // PRIORITY FIX: Restore filter settings more aggressively - with proper null checks
                if (globalLogger) {
                    globalLogger.info('Filter', 'Saved filter settings:', {
                        filter: this.settings.lastAppliedFilter || 'none',
                        customRange: this.settings && this.settings.customDateRange ? 
                            JSON.stringify(this.settings.customDateRange) : 'none'
                    });
                }
                
                // Set global flag before anything else
                (window as any).oomFiltersPending = true;
                (window as any).oomFiltersApplied = false;
                
                // FIXED: Safely access customDateRange
                if (this.settings && this.settings.customDateRange) {
                    customDateRange = this.settings.customDateRange;
                } else {
                    customDateRange = null;
                }
                
                // CRITICAL FIX: Create a more robust filter application at startup
                // Store intended filter in global state to ensure it persists
                if (this.settings && this.settings.lastAppliedFilter) {
                    (window as any).oomIntendedFilter = this.settings.lastAppliedFilter;
                    if (globalLogger) {
                        globalLogger.info('Filter', `Setting intended filter at startup: ${this.settings.lastAppliedFilter}`);
                    }
                }
                
                // Apply filters with multiple retries at different intervals to ensure they're applied
                // Staggered intervals to catch different loading scenarios
                const intervals = [100, 500, 1000, 2000, 3500, 5000, 7500, 10000];
                intervals.forEach(delay => {
                    setTimeout(() => {
                        if (!(window as any).oomFiltersApplied) {
                            if (globalLogger) {
                                globalLogger.info('Filter', `Attempting filter application at ${delay}ms delay`);
                            }
                            this.applyInitialFilters();
                        }
                    }, delay);
                });
                
                // Also hook into file-open events for when the user opens the metrics note directly
                this.registerEvent(
                    this.app.workspace.on('file-open', (file) => {
                        if (file && file.path === getProjectNotePath(this.settings)) {
                            if (globalLogger) {
                                globalLogger.info('Filter', 'Metrics note opened directly, applying saved filters');
                            }
                            
                            // Reset the filter flags to ensure reapplication
                            (window as any).oomFiltersPending = true;
                            (window as any).oomFiltersApplied = false;
                            
                            // Restore intended filter
                            if (this.settings && this.settings.lastAppliedFilter) {
                                (window as any).oomIntendedFilter = this.settings.lastAppliedFilter;
                            }
                            
                            // Apply with staggered delays
                            [100, 500, 1000, 2500, 5000].forEach(delay => {
                                setTimeout(() => {
                                    if (!(window as any).oomFiltersApplied) {
                                        this.applyInitialFilters();
                                    }
                                }, delay);
                            });
                        }
                    })
                );
            } catch (e) {
                console.error("Error in onLayoutReady:", e);
                // Try to log using globalLogger if available
                if (globalLogger) {
                    globalLogger.error('Plugin', 'Error in onLayoutReady', e as Error);
                }
            }
        });
        
        await this.loadSettings();
        
        // Set global logger for functions outside the plugin class
        // Now that the main logger is initialized, update globalLogger
        globalLogger = this.logger as LoggingAdapter;
        
        // Register the main logger with the safe logger system
        // This allows the safe logger to use the main logger when available
        (window as any).globalLogger = globalLogger;
        
        // Initialize linting engine
        const journalStructure = getJournalStructure(this.settings);
        this.lintingEngine = new LintingEngine(this, journalStructure || DEFAULT_JOURNAL_STRUCTURE_SETTINGS);
        
        // Initialize templater integration
        this.templaterIntegration = new TemplaterIntegration(this.app, this, journalStructure?.templaterIntegration);
        
        // Initialize expanded states set from the settings
        this.expandedStates = new Set();
        if (this.settings.expandedStates) {
            for (const [id, expanded] of Object.entries(this.settings.expandedStates)) {
                if (expanded) {
                    this.expandedStates.add(id);
                }
            }
        }
        
        // Initialize time filter manager
        this.timeFilterManager = new TimeFilterManager();
        
        // Add settings tab
        this.addSettingTab(new DreamMetricsSettingTab(this.app, this));
        
        // Register commands
        this.addCommand({
            id: 'show-metrics',
            name: 'Show Metrics',
            callback: () => {
                this.showMetrics();
            }
        });
        
        this.addCommand({
            id: 'recalculate-metrics',
            name: 'Recalculate Metrics',
            callback: () => {
                this.scrapeMetrics();
            }
        });
        
        this.addCommand({
            id: 'show-date-navigator',
            name: 'Open Date Navigator',
            callback: () => {
                this.showDateNavigator();
            }
        });
        
        this.addCommand({
            id: 'open-project-note',
            name: 'Open Project Note',
            callback: () => {
                this.openProjectNote();
            }
        });
        
        this.addCommand({
            id: 'open-date-range-modal',
            name: 'Set Custom Date Range',
            callback: () => {
                openCustomRangeModal(this.app);
            }
        });
        
        this.addCommand({
            id: 'open-journal-manager',
            name: 'Open Journal Manager',
            callback: () => {
                if (this.dreamJournalManager) {
                    this.dreamJournalManager.open();
                } else {
                    new JournalStructureModal(this.app, this).open();
                }
            }
        });
        
        this.addCommand({
            id: 'insert-dream-template',
            name: 'Insert Dream Journal Template',
            editorCallback: (editor: Editor) => {
                this.insertTemplate(editor);
            }
        });
        
        this.addCommand({
            id: 'open-template-wizard',
            name: 'Open Template Wizard',
            callback: () => {
                new TemplateWizard(this.app, this).open();
            }
        });
        
        // Register API for use by other plugins
        (window as any).oneirometrics = {
            getMetrics: () => this.state.getMetrics(),
            getDreamEntries: () => this.state.getDreamEntries(),
            openDateNavigator: () => this.showDateNavigator(),
            applyDateFilter: (date: Date) => forceApplyDateFilter(date),
            applyDateRangeFilter: (start: Date, end: Date) => {
                customDateRange = {
                    start: format(start, 'yyyy-MM-dd'),
                    end: format(end, 'yyyy-MM-dd')
                };
                saveLastCustomRange(customDateRange);
                applyCustomDateRangeFilter();
            }
        };
        
        // Set plugin instance for global access (used by filter persistence)
        (window as any).oneiroMetricsPlugin = this;
        globalLogger?.debug('State', 'Set global plugin instance for filter persistence');
        
        // Load custom date range from localStorage if available
        customDateRange = loadLastCustomRange();
        
        // Initialize ribbon icons
        this.addRibbonIcons();
        
        // Add debug ribbon for calendar testing
        this.addCalendarDebugRibbon();
        
        // Register date navigator view
        this.registerView(
            DATE_NAVIGATOR_VIEW_TYPE,
            (leaf) => new DateNavigatorView(leaf, this)
        );
        
        // Initialize date navigator for reuse
        this.dateNavigatorIntegration = new DateNavigatorIntegration(this.app, this);
        
        // Assign window object for external access
        (window as any).forceApplyDateFilter = forceApplyDateFilter;
        
        // Initialize dream journal manager
        this.dreamJournalManager = new DreamJournalManager(this.app, this);
        
        // Load CSS styles
        this.loadStyles();
        
        // Check log file size periodically
        this.registerInterval(
            window.setInterval(() => this.checkLogFileSize(), 1000 * 60 * 60) // Check every hour
        );

        // Add with other commands around line 820
        this.addCommand({
            id: 'run-settings-helper-tests',
            name: 'Run Settings Helper Tests',
            callback: () => {
                runSettingsHelpersTests().then(() => {
                    new Notice('Settings helper tests complete - check console for results');
                });
            }
        });
        
        this.addCommand({
            id: 'run-metric-helper-tests',
            name: 'Run Metric Helper Tests',
            callback: () => {
                runMetricHelpersTests().then(() => {
                    new Notice('Metric helper tests complete - check console for results');
                });
            }
        });
        
        this.addCommand({
            id: 'run-selection-mode-helper-tests',
            name: 'Run Selection Mode Helper Tests',
            callback: () => {
                runSelectionModeHelperTests().then(() => {
                    new Notice('Selection mode helper tests complete - check console for results');
                });
            }
        });
        
        this.addCommand({
            id: 'run-type-guards-tests',
            name: 'Run Type Guards Tests',
            callback: () => {
                runTypeGuardsTests().then(() => {
                    new Notice('Type guards tests complete - check console for results');
                });
            }
        });
        
        this.addCommand({
            id: 'run-property-helpers-tests',
            name: 'Run Property Helpers Tests',
            callback: () => {
                runPropertyHelpersTests().then(() => {
                    new Notice('Property helpers tests complete - check console for results');
                });
            }
        });

        // Command to run Content Parser parameter tests
        this.addCommand({
            id: 'run-content-parser-parameter-tests',
            name: 'Run Content Parser Parameter Tests',
            callback: async () => {
                await runContentParserParameterTests();
                new Notice('Content Parser parameter tests complete - check console for results');
            }
        });
        
        // Command to run Settings Adapter tests
        this.addCommand({
            id: 'run-settings-adapter-tests',
            name: 'Run Settings Adapter Tests',
            callback: async () => {
                await runSettingsAdapterTests();
                new Notice('Settings Adapter tests complete - check console for results');
            }
        });
        
        // Command to run EventHandling tests
        this.addCommand({
            id: 'run-event-handling-tests',
            name: 'Run Event Handling Tests',
            callback: async () => {
                await runEventHandlingTests();
                new Notice('Event Handling tests complete - check console for results');
            }
        });
        
        // Command to run ComponentFactory tests
        this.addCommand({
            id: 'run-component-factory-tests',
            name: 'Run ComponentFactory Tests',
            callback: async () => {
                await runComponentFactoryTests();
                new Notice('ComponentFactory tests complete - check console for results');
            }
        });
        
        // Command to run DreamMetricsState tests
        this.addCommand({
            id: 'run-dream-metrics-state-tests',
            name: 'Run DreamMetricsState Tests',
            callback: async () => {
                await runDreamMetricsStateTests();
                new Notice('DreamMetricsState tests complete - check console for results');
            }
        });

        // Add this method to the plugin class
        this.addCommand({
            id: 'test-content-parser-directly',
            name: 'Test Content Parser Directly',
            callback: () => {
                const result = this.testContentParserDirectly();
                new Notice(result);
            }
        });
    }

    onunload() {
        safeLogger.info('Plugin', 'Unloading Dream Metrics plugin');
        
        // Remove ribbon icons
        this.removeRibbonIcons();
        
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
        // Save expandedStates from set to object
        if (this.expandedStates) {
            // Create a new object for expanded states
            const expandedStatesObj: Record<string, boolean> = {};
            
            // Add all expanded states from the set
            this.expandedStates.forEach(id => {
                expandedStatesObj[id] = true;
            });
            
            // Safely set the property
            this.settings.expandedStates = expandedStatesObj;
        }
        
        await this.saveData(this.settings);
        
        // Update ribbon icons after saving settings
        this.updateRibbonIcons();
    }

    async loadSettings() {
        const data = await this.loadData();
        // Apply the SettingsAdapter to ensure all properties exist with correct types
        const settingsAdapter = new SettingsAdapter(data || {});
        this.settings = settingsAdapter.toCoreSettings();
        this.loadedSettings = true;
        
        // CRITICAL FIX: Load and validate filter persistence settings
        try {
            // Validate that the filter settings are present and have valid values
            if (!this.settings.lastAppliedFilter || 
                typeof this.settings.lastAppliedFilter !== 'string' ||
                !['all', 'today', 'yesterday', 'thisWeek', 'thisMonth', 'last30', 
                 'last6months', 'thisYear', 'last12months', 'custom'].includes(this.settings.lastAppliedFilter)) 
            {
                // Try to recover from localStorage
                const savedFilter = localStorage.getItem('oom-last-applied-filter');
                if (savedFilter && ['all', 'today', 'yesterday', 'thisWeek', 'thisMonth', 'last30', 
                                    'last6months', 'thisYear', 'last12months', 'custom'].includes(savedFilter)) {
                    globalLogger?.info('Filter', `Recovered filter from localStorage during loadSettings: ${savedFilter}`);
                    this.settings.lastAppliedFilter = savedFilter;
                } else {
                    // Default to 'thisMonth' for filter persistence
                    globalLogger?.info('Filter', `Setting default filter during loadSettings: thisMonth`);
                    this.settings.lastAppliedFilter = 'thisMonth';
                }
                
                // Save the recovered/default settings
                this.saveSettings().catch(err => {
                    globalLogger?.error('Filter', 'Failed to save recovered filter setting', err);
                });
            }
            
            // If custom date range is selected but no range defined, try to recover or reset
            if (this.settings.lastAppliedFilter === 'custom' && !this.settings.customDateRange) {
                try {
                    // Try to load from localStorage
                    const savedRangeStr = localStorage.getItem('oom-custom-date-range');
                    if (savedRangeStr) {
                        const savedRange = JSON.parse(savedRangeStr);
                        if (savedRange?.start && savedRange?.end) {
                            this.settings.customDateRange = savedRange;
                            globalLogger?.info('Filter', 'Recovered custom date range during loadSettings', savedRange);
                        } else {
                            // If we can't recover a valid custom range, change to thisMonth
                            this.settings.lastAppliedFilter = 'thisMonth';
                            globalLogger?.info('Filter', 'Invalid custom range, defaulting to thisMonth filter');
                        }
                    } else {
                        // If no range in localStorage, change to thisMonth
                        this.settings.lastAppliedFilter = 'thisMonth';
                        globalLogger?.info('Filter', 'No custom range available, defaulting to thisMonth filter');
                    }
                } catch (e) {
                    // On any error, reset to thisMonth
                    this.settings.lastAppliedFilter = 'thisMonth';
                    globalLogger?.error('Filter', 'Error processing custom range during loadSettings', e);
                }
                
                // Save the settings after the recovery attempt
                this.saveSettings().catch(err => {
                    globalLogger?.error('Filter', 'Failed to save recovered filter settings', err);
                });
            }
        } catch (e) {
            globalLogger?.error('Filter', 'Error during filter settings validation', e);
        }
        try {
            // Validate that the filter settings are present and have valid values
            if (!this.settings.lastAppliedFilter || 
                typeof this.settings.lastAppliedFilter !== 'string' ||
                !['all', 'today', 'yesterday', 'thisWeek', 'thisMonth', 'last30', 
                 'last6months', 'thisYear', 'last12months', 'custom'].includes(this.settings.lastAppliedFilter)) {
                
                // Try to recover from localStorage backup first
                const savedFilter = localStorage.getItem('oom-last-applied-filter');
                if (savedFilter) {
                    this.settings.lastAppliedFilter = savedFilter;
                    globalLogger?.info('Filter', `Recovered filter setting from localStorage: ${savedFilter}`);
                } else {
                    // Default to 'all' if no valid filter found
                    this.settings.lastAppliedFilter = 'all';
                    globalLogger?.info('Filter', 'Set default filter: all');
                }
            } else {
                globalLogger?.info('Filter', `Loaded saved filter: ${this.settings.lastAppliedFilter}`);
            }
            
            // Make sure we have a valid customDateRange if the filter is set to 'custom'
            if (this.settings.lastAppliedFilter === 'custom') {
                if (!this.settings.customDateRange || 
                    !this.settings.customDateRange.start || 
                    !this.settings.customDateRange.end) {
                    
                    // Try to recover from localStorage
                    try {
                        const savedRangeStr = localStorage.getItem('oom-custom-date-range');
                        if (savedRangeStr) {
                            const savedRange = JSON.parse(savedRangeStr);
                            if (savedRange && savedRange.start && savedRange.end) {
                                this.settings.customDateRange = savedRange;
                                customDateRange = { ...savedRange };
                                globalLogger?.info('Filter', 'Recovered custom date range from localStorage', { range: savedRange });
                            } else {
                                // If we can't recover the custom range, switch to 'all'
                                this.settings.lastAppliedFilter = 'all';
                                this.settings.customDateRange = undefined;
                                customDateRange = null;
                            }
                        } else {
                            // If no custom range found, switch to 'all'
                            this.settings.lastAppliedFilter = 'all';
                            this.settings.customDateRange = undefined;
                            customDateRange = null;
                        }
                    } catch (e) {
                        // If there's any error, default to 'all'
                        this.settings.lastAppliedFilter = 'all';
                        this.settings.customDateRange = undefined;
                        customDateRange = null;
                        globalLogger?.error('Filter', 'Error recovering custom date range', e);
                    }
                } else {
                    // Valid custom date range exists, synchronize with global variable
                    customDateRange = { ...this.settings.customDateRange };
                    globalLogger?.info('Filter', 'Loaded saved custom date range', { range: this.settings.customDateRange });
                }
            }
        } catch (e) {
            globalLogger?.error('Filter', 'Error validating filter settings', e);
        }
        
        // Ensure all default metrics exist in the settings
        if (!this.settings.metrics || Object.keys(this.settings.metrics).length === 0) {
            this.settings.metrics = {};
            // Convert array to object with name as key
            DEFAULT_METRICS.forEach(metric => {
                this.settings.metrics[metric.name] = {
                    name: metric.name,
                    icon: metric.icon,
                    minValue: metric.minValue,
                    maxValue: metric.maxValue,
                    description: metric.description || '',
                    enabled: metric.enabled,
                    category: metric.category || 'dream',
                    type: metric.type || 'number',
                    format: metric.format || 'number',
                    options: metric.options || [],
                    // Include legacy properties for backward compatibility
                    min: metric.minValue,
                    max: metric.maxValue,
                    step: 1
                };
            });
        } else {
            // Check if any default metrics are missing and add them
            DEFAULT_METRICS.forEach(defaultMetric => {
                if (!this.settings.metrics[defaultMetric.name]) {
                    // Add the missing metric with default values
                    this.settings.metrics[defaultMetric.name] = {
                        name: defaultMetric.name,
                        icon: defaultMetric.icon,
                        minValue: defaultMetric.minValue,
                        maxValue: defaultMetric.maxValue,
                        description: defaultMetric.description || '',
                        enabled: defaultMetric.enabled,
                        category: defaultMetric.category || 'dream',
                        type: defaultMetric.type || 'number',
                        format: defaultMetric.format || 'number',
                        options: defaultMetric.options || [],
                        // Include legacy properties for backward compatibility
                        min: defaultMetric.minValue,
                        max: defaultMetric.maxValue,
                        step: 1
                    };
                }
            });
        }
        
        // Use the expandedStates helper instead of direct access
        this.expandedStates = new Set<string>();
        
        // Get expanded states from settings
        const expandedStatesMap = this.settings.expandedStates || {};
        if (expandedStatesMap) {
            Object.entries(expandedStatesMap).forEach(([id, isExpanded]) => {
                if (isExpanded) {
                    this.expandedStates.add(id);
                }
            });
        }
        
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
        globalLogger?.info('Scrape', 'Starting metrics scrape process');
        // Show progress modal with detailed status
        const progressModal = new Modal(this.app);
        progressModal.titleEl.setText('Scraping Dream Metrics...');
        const progressContent = progressModal.contentEl.createEl('div', { cls: 'oom-progress-content' });
        const statusText = progressContent.createEl('div', { cls: 'oom-status-text' });
        const progressBar = progressContent.createEl('div', { cls: 'oom-progress-bar' });
        const progressFill = progressBar.createEl('div', { cls: 'oom-progress-fill' });
        const detailsText = progressContent.createEl('div', { cls: 'oom-details-text' });
        progressModal.open();
        progressBar.style.height = '8px';
        progressBar.style.background = '#eee';
        progressBar.style.borderRadius = '4px';
        progressBar.style.margin = '1em 0';
        progressFill.style.height = '100%';
        progressFill.style.background = 'var(--interactive-accent, #2563eb)';
        progressFill.style.width = '0%';
        progressFill.style.borderRadius = '4px';
        progressModal.open();

        const metrics: Record<string, number[]> = {};
        const dreamEntries: DreamMetricData[] = [];
        let totalWords = 0;
        let entriesProcessed = 0;
        let calloutsFound = 0;
        let validNotes = 0;
        let foundAnyJournalEntries = false;
        let foundAnyMetrics = false;

        // Import our helper functions to access settings safely
        const { getSelectionMode, getSelectedFolder } = require('./src/utils/settings-helpers');

        // --- Flexible Note/Folder Selection (mirroring settings tab) ---
        new Setting(progressContent)
            .setName('Selection Mode')
            .setDesc('Choose whether to select individual notes or a folder for metrics scraping')
            .addDropdown(drop => {
                drop.addOption('notes', 'Notes');
                drop.addOption('folder', 'Folder');
                // Use helper to get selection mode safely
                const currentMode = getSelectionMode(this.settings);
                drop.setValue(currentMode);
                drop.onChange(async (value) => {
                    const { setSelectionMode } = require('./src/utils/settings-helpers');
                    // Use helper to set selection mode safely
                    setSelectionMode(this.settings, value as 'notes' | 'folder');
                    // Clear irrelevant selection when switching modes
                    if (value === 'folder') {
                        this.settings.selectedNotes = [];
                    } else {
                        const { setSelectedFolder } = require('./src/utils/settings-helpers');
                        setSelectedFolder(this.settings, '');
                    }
                    await this.saveSettings();
                    this.scrapeMetrics();
                });
            });

        // Dynamic label and field
        const currentMode = getSelectionMode(this.settings);
        let selectionLabel = currentMode === 'folder' ? 'Selected Folder' : 'Selected Notes';
        let selectionDesc = currentMode === 'folder'
            ? 'Choose a folder to recursively search for dream metrics (max 200 files)'
            : 'Notes to search for dream metrics (select one or more)';
        let selectionSetting = new Setting(progressContent)
            .setName(selectionLabel)
            .setDesc(selectionDesc);

        if (currentMode === 'folder') {
            // Folder autocomplete (styled like in settings)
            selectionSetting.addSearch(search => {
                const selectedFolder = getSelectedFolder(this.settings);
                search.setPlaceholder('Choose folder...');
                search.setValue(selectedFolder);
                // ... rest of existing code ...
            });
        } else {
            // Multi-chip note autocomplete (existing)
            selectionSetting.addExtraButton(button => { }); // No-op for layout
            const searchFieldContainer = progressContent.createEl('div', { cls: 'oom-multiselect-search-container' });
            const chipsContainer = progressContent.createEl('div', { cls: 'oom-multiselect-chips-container' });
            chipsContainer.style.display = (this.settings.selectedNotes && this.settings.selectedNotes.length > 0) ? '' : 'none';
            import('./autocomplete').then(({ createSelectedNotesAutocomplete }) => {
                createSelectedNotesAutocomplete({
                    app: this.app,
                    plugin: this,
                    containerEl: searchFieldContainer,
                    selectedNotes: this.settings.selectedNotes,
                    onChange: (selected) => {
                        this.settings.selectedNotes = selected;
                        chipsContainer.style.display = (selected && selected.length > 0) ? '' : 'none';
                        this.saveSettings();
                    }
                });
            });
        }

        // After the selection UI, define files for scraping
        let files: string[] = [];
        const mode = getSelectionMode(this.settings);
        const selectedFolderPath = getSelectedFolder(this.settings);
        if (mode === 'folder' && selectedFolderPath) {
            // Recursively gather up to 200 markdown files from the selected folder
            const folder = this.app.vault.getAbstractFileByPath(selectedFolderPath);
            if (folder && folder instanceof TFolder) {
                const gatherFiles = (folder: TFolder, acc: string[]) => {
                    for (const child of folder.children) {
                        if (child instanceof TFile && child.extension === 'md') {
                            acc.push(child.path);
                            if (acc.length >= 200) break;
                        } else if (child instanceof TFolder) {
                            gatherFiles(child, acc);
                            if (acc.length >= 200) break;
                        }
                    }
                };
                const acc: string[] = [];
                gatherFiles(folder, acc);
                files = acc.slice(0, 200);
            }
            // Exclude files if user previewed and unchecked them
            const pluginAny = this as any;
            if (Array.isArray(pluginAny._excludedFilesForNextScrape)) {
                files = files.filter((f: string) => !pluginAny._excludedFilesForNextScrape.includes(f));
            }
        } else {
            // Default: use selectedNotes
            files = this.settings.selectedNotes || [];
        }

        if (!files || files.length === 0) {
            new Notice('No notes selected. Please select at least one note or a folder to scrape.');
            globalLogger?.warn('Scrape', 'No notes selected for processing');
            progressModal.close();
            return;
        }

        // Process files in batches of 5
        const BATCH_SIZE = 5;
        const totalFiles = files.length;
        globalLogger?.debug('Scrape', `Processing ${totalFiles} files in batches of ${BATCH_SIZE}`);

        for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (path) => {
                const file = this.app.vault.getAbstractFileByPath(path);
                if (!(file instanceof TFile)) {
                    globalLogger?.warn('Scrape', `File not found or not a file: ${path}`);
                    return;
                }
                validNotes++;
                try {
                    const content = await this.app.vault.read(file);
                    globalLogger?.debug('Scrape', `Processing file: ${path}`, { contentLength: content.length });

                    // Update progress
                    statusText.setText(`Processing file ${i + 1} of ${totalFiles}: ${path}`);
                    progressFill.style.width = `${((i + 1) / totalFiles) * 100}%`;
                    detailsText.setText(`Found ${entriesProcessed} entries, ${calloutsFound} callouts`);

                    // --- Robust Nested Callout Parsing ---
                    // Split content into lines
                    const lines = content.split('\n');
                    let journals: any[] = [];
                    let currentJournal: any = null;
                    let currentDiary: any = null;
                    let currentMetrics: any = null;
                    let blockLevel = 0;
                    let blockStack: any[] = [];
                    
                    // Helper to get callout type from a line
                    const getCalloutType = (line: string) => {
                        const match = line.match(/^>+\s*\[!(\w[\w-]*)/i);
                        return match ? match[1].toLowerCase() : null;
                    };
                    
                    // Helper to get blockquote level
                    const getBlockLevel = (line: string) => {
                        const match = line.match(/^(>+)/);
                        return match ? match[1].length : 0;
                    };
                    
                    // --- BEGIN IMPROVED STACK LOGIC ---
                    for (let idx = 0; idx < lines.length; idx++) {
                        const line = lines[idx];
                        const level = getBlockLevel(line);
                        const calloutType = getCalloutType(line);
                        
                        // Only pop the stack if the current level is LESS than the top of the stack's level
                        while (blockStack.length > 0 && blockStack[blockStack.length - 1].level > level) {
                            blockStack.pop();
                        }
                        
                        if (calloutType === 'journal-entry') {
                            currentJournal = {
                                lines: [line],
                                level,
                                idx,
                                diaries: []
                            };
                            journals.push(currentJournal);
                            blockStack.push({ type: 'journal-entry', obj: currentJournal, level });
                            calloutsFound++;
                        } else if (calloutType === 'dream-diary') {
                            currentDiary = {
                                lines: [line],
                                level,
                                idx,
                                metrics: []
                            };
                            // Attach to parent journal-entry if present
                            if (blockStack.length > 0 && blockStack[blockStack.length - 1].type === 'journal-entry') {
                                blockStack[blockStack.length - 1].obj.diaries.push(currentDiary);
                            }
                            blockStack.push({ type: 'dream-diary', obj: currentDiary, level });
                            calloutsFound++;
                        } else if (calloutType === 'dream-metrics') {
                            currentMetrics = {
                                lines: [line],
                                level,
                                idx
                            };
                            // Attach to parent dream-diary if present
                            if (blockStack.length > 0 && blockStack[blockStack.length - 1].type === 'dream-diary') {
                                blockStack[blockStack.length - 1].obj.metrics.push(currentMetrics);
                            }
                            blockStack.push({ type: 'dream-metrics', obj: currentMetrics, level });
                            calloutsFound++;
                        } else if (blockStack.length > 0) {
                            // Add line to current block
                            blockStack[blockStack.length - 1].obj.lines.push(line);
                        }
                    }
                    
                    // Now extract data from the parsed structure
                    for (const journal of journals) {
                        if (journal.diaries.length > 0) {
                            foundAnyJournalEntries = true;
                            for (const diary of journal.diaries) {
                                for (const metricsBlock of diary.metrics) {
                                    // Extract metrics text
                                    const metricsText = metricsBlock.lines.map((l: string) => l.replace(/^>+\s*/, '')).join(' ').replace(/\s+/g, ' ').trim();
                                    
                                    // Extract dream content (all lines in diary except metrics blocks)
                                    const diaryContentLines = diary.lines.filter((l: string) => !/^>+\s*\[!dream-diary/i.test(l) && !/^>+\s*\[!dream-metrics/i.test(l));
                                    let dreamContent = diaryContentLines.map((l: string) => l.replace(/^>+\s*/, '').trim()).join(' ').replace(/\s+/g, ' ').trim();
                                    
                                    // Extract date and title from the journal and diary callout lines
                                    const journalLine = journal.lines[0];
                                    const diaryLine = diary.lines[0];
                                    
                                    // More flexible date extraction
                                    let date = getDreamEntryDate([journalLine, lines[journal.idx + 1] || ''], path, content);
                                    if (!date) {
                                        console.error(`[OneiroMetrics] Could not extract date for journal at line: ${journalLine}`);
                                    }
                                    
                                    // More flexible title extraction
                                    let title = '';
                                    let blockId = '';
                                    // Try dream-diary callout format
                                    const titleMatch = diaryLine.match(/\[!dream-diary\](?:\s*\[\[.*?\]\])?\s*(.*?)(?:\s*\[\[|$)/);
                                    if (titleMatch) {
                                        title = titleMatch[1].trim();
                                    }
                                    // Try block reference format
                                    if (!title) {
                                        const blockRefMatch = diaryLine.match(/\[\[.*?\|(.*?)\]\]/);
                                        if (blockRefMatch) {
                                            title = blockRefMatch[1].trim();
                                        }
                                    }
                                    // Try plain text after callout
                                    if (!title) {
                                        const plainTextMatch = diaryLine.match(/\[!dream-diary\](?:\s*\[\[.*?\]\])?\s*(.*)/);
                                        if (plainTextMatch) {
                                            title = plainTextMatch[1].trim();
                                        }
                                    }
                                    // Default if no title found
                                    if (!title) {
                                        title = 'Untitled Dream';
                                    }

                                    // Extract block ID if present
                                    const blockIdMatch = diaryLine.match(/\^(\d{8})/);
                                    if (blockIdMatch) {
                                        blockId = blockIdMatch[1];
                                        console.log(`[OneiroMetrics] Found block ID: ${blockId}`);
                                    }
                                    
                                    // Parse metrics
                                    const dreamMetrics = this.processMetrics(metricsText, metrics);
                                    dreamMetrics['Words'] = dreamContent.split(/\s+/).length;
                                    if (!metrics['Words']) {
                                        metrics['Words'] = [];
                                    }
                                    metrics['Words'].push(dreamMetrics['Words']);
                                    
                                    // Add dream entry
                                    foundAnyMetrics = true;
                                    const dreamTitle = title || 'Untitled Dream';
                                    const dreamEntry: any = {  // Use any temporarily to avoid type errors
                                        date: date ? date.format('YYYY-MM-DD') : 'Unknown date',
                                        title: dreamTitle || 'Untitled Dream',
                                        content: dreamContent,
                                        source: {
                                            file: path,
                                            id: blockId // Store the block ID
                                        },
                                        wordCount: dreamMetrics['Words'],
                                        metrics: dreamMetrics,
                                        calloutMetadata: [{
                                            type: 'dream', // Default type for dream callouts
                                            id: blockId
                                        }]
                                    };
                                    dreamEntries.push(dreamEntry);
                                    entriesProcessed++;
                                }
                            }
                        }
                    }
                    // --- END IMPROVED STACK LOGIC ---
                    // After the blockStack/line-walking loop, before extracting dream entries:
                    console.log('[OneiroMetrics][DEBUG] Parsed callout structure for file:', path, JSON.stringify({ journals, blockStack }, null, 2));
                } catch (error) {
                    globalLogger?.error('Scrape', `Error processing file ${path}:`, error as Error);
                    new Notice(`Error processing file: ${path}`);
                }
            });

            // Wait for batch to complete
            await Promise.all(batchPromises);
        }

        // Final validation and logging
        globalLogger?.info('Scrape', 'Scrape complete', {
            validNotes,
            journalEntriesFound: foundAnyJournalEntries,
            metricsFound: foundAnyMetrics,
            entriesProcessed,
            calloutsFound
        });

        if (validNotes === 0) {
            globalLogger?.warn('Scrape', 'No valid notes found');
            new Notice('No valid notes found. Please check your selected notes.');
            progressModal.close();
            return;
        }
        if (!foundAnyJournalEntries) {
            globalLogger?.warn('Scrape', 'No journal entries found');
            new Notice('No journal entries found in selected notes.');
            progressModal.close();
            return;
        }
        if (!foundAnyMetrics) {
            globalLogger?.warn('Scrape', 'No dream metrics callouts found');
            new Notice('No dream metrics callouts found in selected notes.');
            progressModal.close();
            return;
        }
        if (entriesProcessed === 0) {
            globalLogger?.warn('Scrape', 'No metrics data found');
            new Notice('No metrics data found in selected notes.');
            progressModal.close();
            return;
        }

        // Sort and update
        dreamEntries.sort((a, b) => a.date.localeCompare(b.date));
        globalLogger?.info('Scrape', `Updating project note with ${dreamEntries.length} entries`);
        this.updateProjectNote(metrics, dreamEntries);
        progressModal.close();

        // We used to update the OneiroMetricsModal here
        // This code is no longer needed since we removed the modal
        globalLogger?.debug('Scrape', 'Scraping complete - can now access the metrics note');
    }

    private processDreamContent(content: string): string {
        // Remove callouts and images
        content = content.replace(/\[!.*?\]/g, '')
                       .replace(/!\[\[.*?\]\]/g, '')
                       .replace(/\[\[.*?\]\]/g, '')
                       .trim();
        
        // Remove any remaining markdown artifacts
        content = content.replace(/[#*_~`]/g, '')
                       .replace(/\n{3,}/g, '\n\n')
                       .replace(/^>\s*>/g, '') // Remove nested blockquotes
                       .replace(/^>\s*/gm, '') // Remove single blockquotes
                       .trim();
        
        return content;
    }

    private processMetrics(metricsText: string, metrics: Record<string, number[]>): Record<string, number> {
        const dreamMetrics: Record<string, number> = {};
        const metricPairs = metricsText.split(',').map(pair => pair.trim());
        
        globalLogger?.debug('Metrics', 'Processing metrics text', { text: metricsText });
        
        for (const pair of metricPairs) {
            const [name, value] = pair.split(':').map(s => s.trim());
            if (name && value !== '—' && !isNaN(Number(value))) {
                const numValue = Number(value);
                // Find the matching metric name from settings (case-insensitive)
                const metricName = Object.values(this.settings.metrics).find(
                    m => m.name.toLowerCase() === name.toLowerCase()
                )?.name || name;
                
                dreamMetrics[metricName] = numValue;
                
                // Update global metrics record
                if (!metrics[metricName]) {
                    metrics[metricName] = [];
                }
                metrics[metricName].push(numValue);
                
                globalLogger?.debug('Metrics', `Processed metric: ${metricName} = ${numValue}`);
            }
        }
        
        globalLogger?.debug('Metrics', 'Completed metrics processing', { dreamMetrics });
        return dreamMetrics;
    }

    private async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]) {
        const projectNotePath = getProjectNotePath(this.settings);
        
        globalLogger?.debug('MetricsNote', 'updateProjectNote called', { 
            projectNote: projectNotePath,
            entriesCount: dreamEntries.length 
        });
        
        const projectFile = this.app.vault.getAbstractFileByPath(projectNotePath);
        new Notice(`[DEBUG] updateProjectNote called for: ${projectNotePath}`);
        
        if (!(projectFile instanceof TFile)) {
            globalLogger?.error('MetricsNote', 'Project note not found', { path: projectNotePath });
            new Notice(`[DEBUG] Project note not found: ${projectNotePath}`);
            return;
        }
        
        if (dreamEntries.length === 0) {
            globalLogger?.warn('MetricsNote', 'No dream entries to update', { projectNote: projectNotePath });
            new Notice('[DEBUG] updateProjectNote called with zero dream entries. No update will be performed.');
            return;
        }

        try {
            const existingContent = await this.app.vault.read(projectFile);
            
            // Define markers for the metrics section
            const startMarker = '<!-- OOM METRICS START -->';
            const endMarker = '<!-- OOM METRICS END -->';

            // Generate new content with markers
            const newMetricsContent = startMarker + '\n\n' + this.generateMetricsTable(metrics, dreamEntries) + '\n\n' + endMarker;

            let newContent = '';
            if (existingContent.includes(startMarker) && existingContent.includes(endMarker)) {
                // Replace content between markers
                const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
                newContent = existingContent.replace(regex, newMetricsContent);
            } else {
                // If no markers exist, append to the end of the file
                newContent = existingContent.trim() + '\n\n' + newMetricsContent;
            }

            // Only proceed if content has changed
            if (newContent !== existingContent) {
                await this.app.vault.modify(projectFile, newContent);
                new Notice('Metrics tables updated successfully!');
                globalLogger?.info('MetricsNote', 'Project note updated with new metrics and dream entries');
                
                // Force reload of the project note in all open leaves
                let reloaded = false;
                this.app.workspace.iterateAllLeaves(leaf => {
                    if (leaf.view instanceof MarkdownView && leaf.view.file && leaf.view.file.path === projectNotePath) {
                        leaf.openFile(projectFile, { active: leaf === this.app.workspace.activeLeaf });
                        reloaded = true;
                        globalLogger?.debug('MetricsNote', 'Forced reload of project note in workspace leaf');
                    }
                });
                
                if (!reloaded) {
                    globalLogger?.debug('MetricsNote', 'Project note was not open in any workspace leaf');
                }
                
                // Update view after content change
                this.updateProjectNoteView();
                
                // Apply saved filters after a delay
                setTimeout(() => {
                    globalLogger?.debug('Filter', 'Applying saved filters after project note update');
                    this.applyInitialFilters();
                }, 1500);
                
                // Attach event listeners after table render with multiple attempts to ensure they're attached
                setTimeout(() => {
                    console.log('[OOM-DEBUG] Attempting to attach event listeners (first attempt)');
                    this.attachProjectNoteEventListeners();
                    
                    // Try again after a longer delay to ensure content is fully rendered
                    setTimeout(() => {
                        console.log('[OOM-DEBUG] Attempting to attach event listeners (second attempt)');
                        this.attachProjectNoteEventListeners();
                        
                        // One final attempt to catch any late rendering
                        setTimeout(() => {
                            console.log('[OOM-DEBUG] Attempting to attach event listeners (final attempt)');
                            this.attachProjectNoteEventListeners();
                        }, 1000);
                    }, 500);
                }, 200);
            } else {
                new Notice('[DEBUG] No changes to metrics tables.');
                globalLogger?.debug('MetricsNote', 'No changes detected in project note content');
                
                // Attach event listeners even if no changes
                setTimeout(() => {
                    console.log('[OOM-DEBUG] Attempting to attach event listeners (no changes)');
                    this.attachProjectNoteEventListeners();
                }, 200);
            }
        } catch (error) {
            globalLogger?.error('MetricsNote', 'Failed to update project note', error as Error);
            new Notice(`[ERROR] Failed to update project note: ${error.message}`);
        }
    }

    private async backupProjectNote(file: TFile) {
        if (!isBackupEnabled(this.settings)) {
            const shouldProceed = await this.confirmProceedWithoutBackup();
            if (!shouldProceed) {
                return false;
            }
            return true;
        }
        
        const backupFolderPath = getBackupFolderPath(this.settings);
        
        if (!backupFolderPath) {
            new Notice("Backup folder path not set. Please configure in settings.");
            return false;
        }

        try {
            // Read the file content
            const content = await this.app.vault.read(file);
            
            // Generate timestamp in a more readable format
            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
            
            // Create backup filename with original filename and timestamp
            const fileName = file.basename;
            const backupFilePath = `${backupFolderPath}/${fileName}.backup-${timestamp}.bak`;
            
            // Check if backup folder exists
            const backupFolderObj = this.app.vault.getAbstractFileByPath(backupFolderPath);
            if (!backupFolderObj) {
                try {
                    await this.app.vault.createFolder(backupFolderPath);
                    globalLogger?.info('Backup', `Created backup folder: ${backupFolderPath}`);
                } catch (error) {
                    globalLogger?.error('Backup', 'Error creating backup folder', error as Error);
                    throw new Error(`Failed to create backup folder: ${error.message}`);
                }
            }
            
            // Check if backup file already exists
            const existingBackup = this.app.vault.getAbstractFileByPath(backupFilePath);
            if (existingBackup) {
                globalLogger?.warn('Backup', `Backup file already exists: ${backupFilePath}`);
                throw new Error('Backup file already exists');
            }
            
            // Create the backup file
            await this.app.vault.create(backupFilePath, content);
            globalLogger?.info('Backup', `Created backup at: ${backupFilePath}`);
            
            // Clean up old backups (keep last 5)
            try {
                const backupFiles = this.app.vault.getMarkdownFiles()
                    .filter(f => f.path.startsWith(backupFolderPath) && 
                        f.basename.startsWith(fileName) && 
                        f.basename.includes('.backup-'))
                    .sort((a, b) => b.stat.mtime - a.stat.mtime);
                
                // Delete backups older than the 5 most recent
                for (let i = 5; i < backupFiles.length; i++) {
                    await this.app.vault.delete(backupFiles[i]);
                    globalLogger?.debug('Backup', `Deleted old backup: ${backupFiles[i].path}`);
                }
            } catch (error) {
                globalLogger?.warn('Backup', 'Error cleaning up old backups', error as Error);
                // Don't throw here, as the main backup was successful
            }
            
            new Notice(`Backup created: ${backupFilePath}`);
        } catch (error) {
            globalLogger?.error('Backup', 'Error creating backup', error as Error);
            throw new Error(`Failed to create backup: ${error.message}`);
        }
    }

    private async confirmProceedWithoutBackup(): Promise<boolean> {
        return new Promise((resolve) => {
            const modal = new Modal(this.app);
            modal.titleEl.setText('Backup Failed');
            modal.contentEl.createEl('p', {
                text: 'Failed to create a backup. Would you like to proceed without a backup?'
            });
            
            const buttonContainer = modal.contentEl.createEl('div', {
                cls: 'oom-modal-button-container'
            });
            
            const cancelButton = buttonContainer.createEl('button', {
                text: 'Cancel',
                cls: 'mod-warning'
            });
            cancelButton.addEventListener('click', () => {
                modal.close();
                resolve(false);
            });
            
            const proceedButton = buttonContainer.createEl('button', {
                text: 'Proceed',
                cls: 'mod-cta'
            });
            proceedButton.addEventListener('click', () => {
                modal.close();
                resolve(true);
            });
            
            modal.open();
        });
    }

    private generateSummaryTable(metrics: Record<string, number[]>): string {
        let content = "";
        content += `<div class="oom-table-section oom-stats-section">`;
        content += '<h2 class="oom-table-title oom-stats-title">Statistics</h2>';
        content += '<div class="oom-table-container">\n';
        content += '<table class="oom-table oom-stats-table">\n';
        content += "<thead>\n";
        content += "<tr>\n";
        content += "<th>Metric</th>\n";
        content += "<th>Average</th>\n";
        content += "<th>Min</th>\n";
        content += "<th>Max</th>\n";
        content += "<th>Count</th>\n";
        content += "</tr>\n";
        content += "</thead>\n";
        content += "<tbody>\n";
        
        // Include Words and all configured metrics
        const validMetricNames = [
            "Words",
            ...Object.values(this.settings.metrics).map(m => m.name)
        ];
        
        let hasMetrics = false;
        for (const name of validMetricNames) {
            const values = metrics[name];
            if (!values || values.length === 0) continue;
            
            hasMetrics = true;
            const avg = values.reduce((a, b) => a + b) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            let label = name;
            if (name === "Words") {
                const total = values.reduce((a, b) => a + b, 0);
                label = `Words <span class="oom-words-total">(total: ${total})</span>`;
            } else {
                const metric = Object.values(this.settings.metrics).find(m => m.name === name);
                if (metric?.icon && lucideIconMap[metric.icon]) {
                    label = `<span class="oom-metric-icon-svg oom-metric-icon--start">${lucideIconMap[metric.icon]}</span> ${name}`;
                }
            }
            
            content += "<tr>\n";
            content += `<td>${label}</td>\n`;
            content += `<td class="metric-value">${avg.toFixed(2)}</td>\n`;
            content += `<td class="metric-value">${min}</td>\n`;
            content += `<td class="metric-value">${max}</td>\n`;
            content += `<td class="metric-value">${values.length}</td>\n`;
            content += "</tr>\n";
        }
        
        if (!hasMetrics) {
            content += '<tr><td colspan="5" class="oom-no-metrics">No metrics available</td></tr>\n';
        }
        
        content += "</tbody>\n";
        content += "</table>\n";
        content += "</div>\n"; // Close table-container
        content += "</div>\n"; // Close stats-section
        
        return content;
    }

    private generateMetricsTable(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): string {
        globalLogger?.debug('Table', 'Generating metrics table');
        globalLogger?.debug('Table', 'Table entries', { count: dreamEntries.length });
        let content = "";
        
        const cacheKey = JSON.stringify({ metrics, dreamEntries });
        if (this.memoizedTableData.has(cacheKey)) {
            globalLogger?.debug('Table', 'Using cached table data');
            return this.memoizedTableData.get(cacheKey);
        }
        
        content += "<div data-render-html>\n";
        content += '<h1 class="oneirometrics-title">OneiroMetrics (Dream Metrics)</h1>\n';
        content += '<div class="oom-rescrape-container">\n';
        content += '<button class="mod-cta oom-rescrape-button">Rescrape Metrics</button>\n';
        content += '<button class="mod-cta oom-settings-button">Settings</button>\n';
        content += '<button class="mod-cta oom-date-navigator-button">Date Navigator</button>\n';
        content += "</div>\n";
        
        content += '<div class="oom-metrics-container">\n';
        content += '<div class="oom-metrics-content">\n';
        
        // Add metrics summary table
        content += this.generateSummaryTable(metrics);
        
        // Add Dream Entries heading
        content += '<h2 class="oom-dream-entries-title">Dream Entries</h2>\n';
        
        // Add filter controls
        content += '<div class="oom-filter-controls">\n';
        content += '<div class="oom-filter-group">\n';
        content += '<select id="oom-date-range-filter" class="oom-select">\n';
        content += '<option value="all">All Time</option>\n';
        content += '<option value="today">Today</option>\n';
        content += '<option value="yesterday">Yesterday</option>\n';
        content += '<option value="thisWeek">This Week</option>\n';
        content += '<option value="thisMonth">This Month</option>\n';
        content += '<option value="last30">Last 30 Days</option>\n';
        content += '<option value="last6months">Last 6 Months</option>\n';
        content += '<option value="thisYear">This Year</option>\n';
        content += '<option value="last12months">Last 12 Months</option>\n';
        content += "</select>\n";
        content += '<button id="oom-custom-range-btn" class="oom-button">Custom Range</button>\n';
        content += '<div id="oom-time-filter-display" class="oom-filter-display"></div>\n';
        content += "</div>\n";
        
        // Add dream entries table
        content += '<div class="oom-table-section">\n';
        content += '<table class="oom-table">\n';
        content += "<thead>\n<tr>\n";
        content += '<th class="column-date">Date</th>\n';
        content += '<th class="column-dream-title">Dream Title</th>\n';
        content += '<th class="column-words">Words</th>\n';
        content += '<th class="column-content">Content</th>\n';
        
        // Add metric column headers
        for (const metric of Object.values(this.settings.metrics)) {
            if (isMetricEnabled(metric)) {
                const metricClass = `column-metric-${metric.name.toLowerCase().replace(/\s+/g, "-")}`;
                content += `<th class="${metricClass}">${metric.name}</th>\n`;
            }
        }
        content += "</tr>\n</thead>\n<tbody>\n";
        
        // Sort dream entries by date
        dreamEntries.sort((a, b) => {
            const dateA = parseDate(a.date) || new Date();
            const dateB = parseDate(b.date) || new Date();
            return dateA.getTime() - dateB.getTime();
        });
        
        // Add dream entry rows
        for (const entry of dreamEntries) {
            // Ensure entry.date exists and has a valid format
            if (!entry.date || typeof entry.date !== 'string') {
                console.error('[OOM-ERROR] Entry missing date attribute:', entry);
                globalLogger?.error('Table', 'Entry missing date attribute', { entry });
                continue; // Skip entries without dates
            }
            
            // Log each row being created with its date attribute for debugging
            globalLogger?.info('Table', 'Creating row with date attribute', { date: entry.date });
            
            // Explicitly ensure date attribute is set multiple times for redundancy
            // This ensures filtering will work correctly even if some attributes are missing
            content += `<tr class="oom-dream-row" data-date="${entry.date}" data-date-raw="${entry.date}" data-iso-date="${entry.date}">\n`;
            content += `<td class="column-date" data-date="${entry.date}" data-iso-date="${entry.date}">${formatDate(parseDate(entry.date) || new Date(), 'MMM d, yyyy')}</td>\n`;
            
            // Create a proper link to the source
            const sourceFile = getSourceFile(entry);
            const sourceId = getSourceId(entry);
            content += `<td class="oom-dream-title column-dream-title"><a href="${sourceFile.replace(/\.md$/, "")}#${sourceId}" data-href="${sourceFile.replace(/\.md$/, "")}#${sourceId}" class="internal-link" data-link-type="block" data-link-path="${sourceFile.replace(/\.md$/, "")}" data-link-hash="${sourceId}" title="${entry.title}">${entry.title}</a></td>\n`;
            
            // Add word count
            content += `<td class="column-words">${entry.metrics["Words"] || 0}</td>\n`;
            
            // Process content for display
            let dreamContent = this.processDreamContent(entry.content);
            if (!dreamContent || !dreamContent.trim()) {
                dreamContent = "";
            }
            
            // Create unique ID for content cell
            const cellId = `oom-content-${entry.date}-${entry.title.replace(/[^a-zA-Z0-9]/g, "")}`;
            const preview = dreamContent.length > 200 ? dreamContent.substring(0, 200) + "..." : dreamContent;
            
            // Add content cell with expand/collapse button if needed
            if (dreamContent.length > 200) {
                content += `<td class="oom-dream-content column-content" id="${cellId}"><div class="oom-content-wrapper"><div class="oom-content-preview">${preview}</div><div class="oom-content-full">${dreamContent}</div><button type="button" class="oom-button oom-button--expand oom-button--state-default" aria-expanded="false" aria-controls="${cellId}" data-expanded="false" data-content-id="${cellId}" data-parent-cell="${cellId}"><span class="oom-button-text">Show more</span><span class="oom-button-icon">▼</span><span class="visually-hidden"> full dream content</span></button></div></td>\n`;
            } else {
                content += `<td class="oom-dream-content column-content"><div class="oom-content-wrapper"><div class="oom-content-preview">${dreamContent}</div></div></td>\n`;
            }
            
            // Add metrics columns
            for (const metric of Object.values(this.settings.metrics)) {
                if (isMetricEnabled(metric)) {
                    const metricClass = `column-metric-${metric.name.toLowerCase().replace(/\s+/g, "-")}`;
                    const value = entry.metrics[metric.name];
                    content += `<td class="metric-value ${metricClass}" data-metric="${metric.name}">${value !== undefined ? value : ""}</td>\n`;
                }
            }
            
            content += "</tr>\n";
        }
        
        content += "</tbody>\n</table>\n";
        content += "</div>\n"; // Close table-section
        content += "</div>\n"; // Close filter-controls
        content += "</div>\n"; // Close metrics-content
        content += "</div>\n"; // Close metrics-container
        content += "</div>\n"; // Close data-render-html
        
        const result = content;
        this.memoizedTableData.set(cacheKey, result);
        return result;
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
        } else {
            // Get the filter dropdown
            const savedFilterElement = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
            if (savedFilterElement) {
                // PRIORITY FIX: Get filter from multiple sources in order of preference:
                // 1. Global intended filter (set at startup)
                // 2. Settings
                // 3. localStorage
                // 4. Default to 'thisMonth' instead of 'all' for better UX
                const globalIntendedFilter = (window as any).oomIntendedFilter;
                const savedFilter = globalIntendedFilter || 
                                   this.settings.lastAppliedFilter || 
                                   localStorage.getItem('oom-last-applied-filter') || 
                                   'thisMonth';
                
                globalLogger?.info('Filter', `Preparing to restore filter: ${savedFilter}`, {
                    source: globalIntendedFilter ? 'globalState' :
                           (this.settings.lastAppliedFilter ? 'settings' : 
                           (localStorage.getItem('oom-last-applied-filter') ? 'localStorage' : 'default')),
                    customDateRange: this.settings.customDateRange ? JSON.stringify(this.settings.customDateRange) : 'none'
                });
                
                // Initialize table rows first to ensure proper filtering
                initializeTableRowClasses();
                
                // Set the dropdown value directly and sync to settings
                savedFilterElement.value = savedFilter;
                this.settings.lastAppliedFilter = savedFilter;
                
                // Update global state
                (window as any).oomIntendedFilter = savedFilter;
                
                // Create multiple staggered attempts to apply the filter to ensure it works
                const applyFilterAttempt = (delay: number) => {
                    setTimeout(() => {
                        // Check if filters have already been successfully applied
                        if ((window as any).oomFiltersApplied) {
                            globalLogger?.debug('Filter', `Filters already applied, skipping attempt`, { delay });
                            return;
                        }
                        
                        globalLogger?.debug('Filter', `Applying saved filter`, { filter: savedFilter, delay });
                        
                        // Always reset the dropdown value right before applying (defensive measure)
                        if (savedFilterElement && savedFilterElement.value !== savedFilter) {
                            savedFilterElement.value = savedFilter;
                        }
                        
                        // CRITICAL FIX: Set the global intended filter value before applying filters
                        (window as any).oomIntendedFilter = savedFilter;
                        globalLogger?.info('Filter', `Setting intended filter in event listener: ${savedFilter}`);
                        
                        // Check if it's a custom date filter
                        if (savedFilter === 'custom' && this.settings.customDateRange) {
                            // Restore custom date range filter
                            customDateRange = {...this.settings.customDateRange};
                            
                            // Apply multiple ways to ensure it works
                            applyCustomDateRangeFilter();
                            
                            // Update custom range button state
                            const customRangeBtn = document.getElementById('oom-custom-range-btn');
                            if (customRangeBtn) {
                                customRangeBtn.classList.add('active');
                            }
                            
                            // Force direct application as a fallback
                            this.forceApplyFilterDirect(
                                previewEl, 
                                this.settings.customDateRange.start, 
                                this.settings.customDateRange.end
                            );
                        } else {
                            // Apply standard filter using the specific dropdown method to avoid event conflicts
                            this.applyFilterToDropdown(savedFilterElement, previewEl);
                        }
                    }, delay);
                };
                
                // Try multiple staggered attempts with different delays
                applyFilterAttempt(100);  // Quick attempt
                applyFilterAttempt(500);  // Medium delay
                applyFilterAttempt(1500); // Longer delay for slow renderings
            }
        }

        // Add event listeners for new rescrape/settings/debug buttons
        const rescrapeBtn = previewEl.querySelector('.oom-rescrape-button');
        if (rescrapeBtn) {
            globalLogger?.debug('UI', 'Found rescrape button');
            // Remove existing listeners
            const newRescrapeBtn = rescrapeBtn.cloneNode(true) as HTMLElement;
            attachClickEvent(newRescrapeBtn, () => {
                globalLogger?.debug('UI', 'Rescrape button clicked');
                new Notice('Rescraping metrics...');
                this.scrapeMetrics();
            });
            rescrapeBtn.parentNode?.replaceChild(newRescrapeBtn, rescrapeBtn);
        } else {
            globalLogger?.warn('UI', 'Rescrape button not found');
        }
        
        const settingsBtn = previewEl.querySelector('.oom-settings-button');
        if (settingsBtn) {
            globalLogger?.debug('UI', 'Found settings button');
            // Remove existing listeners
            const newSettingsBtn = settingsBtn.cloneNode(true);
            newSettingsBtn.addEventListener('click', () => {
                globalLogger?.debug('UI', 'Settings button clicked');
                new Notice('Opening settings...');
                (this.app as any).setting.open();
                (this.app as any).setting.openTabById('oneirometrics');
            });
            settingsBtn.parentNode?.replaceChild(newSettingsBtn, settingsBtn);
        } else {
            globalLogger?.warn('UI', 'Settings button not found');
        }
        
        // Add event listener for the Date Navigator button
        const dateNavigatorBtn = previewEl.querySelector('.oom-date-navigator-button');
        if (dateNavigatorBtn) {
            globalLogger?.debug('UI', 'Found date navigator button');
            // Remove existing listeners
            const newDateNavigatorBtn = dateNavigatorBtn.cloneNode(true);
            newDateNavigatorBtn.addEventListener('click', () => {
                globalLogger?.debug('UI', 'Date navigator button clicked');
                new Notice('Opening date navigator...');
                this.showDateNavigator();
            });
            dateNavigatorBtn.parentNode?.replaceChild(newDateNavigatorBtn, dateNavigatorBtn);
        } else {
            globalLogger?.warn('UI', 'Date navigator button not found');
        }
        
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

        // Add date range filter event listener with performance optimizations
        const dateRangeFilter = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
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
                toggleContentVisibility(newButton, previewEl);
            });
            button.parentNode?.replaceChild(newButton, button);
        });

        // Add custom range button event listener
        const customRangeBtn = document.getElementById('oom-custom-range-btn');
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

    setLogLevel(level: LogLevel) {
        console.log('setLogLevel called with:', level);
        this.logger.configure(level);
        this.updateProjectNoteView(level);
    }

    setLogConfig(level: LogLevel, maxSize: number, maxBackups: number) {
        this.logger.configure(level, maxSize, maxBackups);
    }

    private announceToScreenReader(message: string) {
        const ariaLive = document.createElement('div');
        ariaLive.setAttribute('aria-live', 'polite');
        ariaLive.classList.add('sr-only');
        document.body.append(ariaLive);
        ariaLive.textContent = message;
        setTimeout(() => ariaLive.remove(), 1000);
    }

    // Update content visibility
    private updateContentVisibility(id: string, isExpanded: boolean): void {
        if (!this.container) return;
        
        const row = this.container.querySelector(`tr[data-source="${id}"]`);
        if (row) {
            const contentWrapper = row.querySelector('.oom-content-wrapper');
            const previewDiv = row.querySelector('.oom-content-preview');
            const fullDiv = row.querySelector('.oom-content-full');
            const expandButton = row.querySelector('.oom-button--expand');

            if (contentWrapper && previewDiv && fullDiv && expandButton) {
                if (isExpanded) {
                    contentWrapper.classList.add('expanded');
                } else {
                    contentWrapper.classList.remove('expanded');
                }
                expandButton.textContent = isExpanded ? 'Show less' : 'Read more';
                expandButton.setAttribute('data-expanded', isExpanded.toString());
                expandButton.setAttribute('aria-expanded', isExpanded.toString());
            }
        }
    }

    // Method to update ribbon icon based on settings
    updateRibbonIcons() {
        // Remove existing ribbon icons
        this.removeRibbonIcons();
        
        // Only add ribbon icons if enabled
        if (shouldShowRibbonButtons(this.settings)) {
            this.addRibbonIcons();
        }
    }

    private removeRibbonIcons(): void {
        // Remove icons if they exist
        this.ribbonIcons.forEach(icon => {
            icon.remove();
        });
        this.ribbonIcons = [];
        this.journalManagerRibbonEl = null;
    }

    private addRibbonIcons(): void {
        // Check if ribbon icons should be shown - exit early if not
        if (!shouldShowRibbonButtons(this.settings)) {
            this.removeRibbonIcons(); // Make sure to remove any existing icons
            return;
        }
        
        // Add journal manager button
        this.journalManagerRibbonEl = this.addRibbonIcon('moon', 'Dream Journal Manager', () => {
            new DreamJournalManager(this.app, this, 'dashboard').open();
        });
        this.journalManagerRibbonEl.addClass('oom-journal-manager-button');
        this.ribbonIcons.push(this.journalManagerRibbonEl); // Add to the array for proper tracking
        
        this.journalManagerRibbonEl.addEventListener('contextmenu', (evt: MouseEvent) => {
            evt.preventDefault();
            (this.app as any).setting.open('oneirometrics');
        });
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
                            console.error('Error processing Templater template:', error);
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
        (this.app as any).setting.open();
        (this.app as any).setting.openTabById('oneirometrics');
        new Notice('Click on "View Metrics Descriptions" in the settings panel');
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
                console.warn("Settings not initialized in applyInitialFilters");
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
            console.error("Error in applyInitialFilters initialization:", e);
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
                            console.error('Failed to save recovered filter:', err);
                        }
                    });
                }
            } catch (e) {
                console.error('Error recovering filter from localStorage:', e);
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
                    console.error('Error copying customDateRange from settings:', e);
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
                                    console.error('Failed to save recovered custom range:', err);
                                }
                            });
                        }
                    }
                } catch (e) {
                    if (globalLogger) {
                        globalLogger.error('Filter', 'Error recovering custom date range in applyInitialFilters', e);
                    } else {
                        console.error('Error recovering custom date range:', e);
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
            console.error("Error checking project note:", e);
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
        globalLogger?.debug('Debug', '=== CONTENT PARSER PARAMETER VARIATION TESTS ===');
        
        // Test 1: content only
        const test1 = parser.extractDreamEntries(testContent);
        globalLogger?.debug('Debug', 'Test 1 (content only)', { result: test1 });
        
        // Test 2: content + callout type
        const test2 = parser.extractDreamEntries(testContent, 'memory');
        globalLogger?.debug('Debug', 'Test 2 (content, type)', { result: test2 });
        
        // Test 3: content + source
        const test3 = parser.extractDreamEntries(testContent, 'test.md');
        globalLogger?.debug('Debug', 'Test 3 (content, source)', { result: test3 });
        
        // Test 4: content + type + source
        const test4 = parser.extractDreamEntries(testContent, 'dream', 'test.md');
        globalLogger?.debug('Debug', 'Test 4 (content, type, source)', { result: test4 });
        
        // Test 5: static factory method
        const parser2 = ContentParser.create();
        const test5 = parser2.extractDreamEntries(testContent);
        globalLogger?.debug('Debug', 'Test 5 (factory method)', { result: test5 });
        
        return "ContentParser direct tests complete - check logs for results";
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
    const favorites = loadFavoriteRanges();
    globalLogger?.debug('Filter', 'Opening custom range modal', { favorites });
    new CustomDateRangeModal(app, (start: string, end: string, saveName?: string) => {
        if (start && end) {
            // First, update button state before making any layout changes
            requestAnimationFrame(() => {
                const btn = document.getElementById('oom-custom-range-btn');
                if (btn) btn.classList.add('active');
            });
            
            // Batch remaining operations with slight delays to avoid layout thrashing
            setTimeout(() => {
                // Set the customDateRange
                const newRange = { start, end };
                customDateRange = newRange;
                
                // Persist the selection to localStorage but without forcing layout
                setTimeout(() => {
                    saveLastCustomRange(newRange);
                    
                    // Save to plugin settings for persistence between reloads
                    if (window.oneiroMetricsPlugin) {
                        try {
                            window.oneiroMetricsPlugin.settings.lastAppliedFilter = 'custom';
                            window.oneiroMetricsPlugin.settings.customDateRange = newRange;
                            window.oneiroMetricsPlugin.saveSettings().catch(err => {
                                globalLogger?.error('Filter', 'Failed to save custom date range setting', { error: err });
                            });
                        } catch (e) {
                            globalLogger?.error('Filter', 'Failed to save custom date range', { error: e });
                        }
                    }
                    
                    // Save favorite if needed without disrupting the filter application
                    if (saveName) {
                        saveFavoriteRange(saveName, newRange);
                        // Show notification after filtering is complete
                        setTimeout(() => {
                            new Notice(`Saved favorite: ${saveName}`);
                        }, 100);
                    }
                    
                    // Apply the filter with delay for UI responsiveness
                    setTimeout(() => {
                        globalLogger?.debug('Filter', 'Applying custom date range filter', { range: customDateRange });
                        applyCustomDateRangeFilter();
                    }, 50);
                }, 0);
            }, 10);
        } else {
            // Handle clearing the filter
                            customDateRange = null;
                
                // Clear the saved filter in plugin settings
                if (window.oneiroMetricsPlugin) {
                    try {
                        window.oneiroMetricsPlugin.settings.lastAppliedFilter = 'all';
                        window.oneiroMetricsPlugin.settings.customDateRange = undefined;
                        window.oneiroMetricsPlugin.saveSettings().catch(err => {
                            globalLogger?.error('State', 'Failed to clear filter setting', err as Error);
                        });
                    } catch (e) {
                        globalLogger?.error('State', 'Failed to clear filter setting', e as Error);
                    }
                }
                
                // Batch UI updates
                requestAnimationFrame(() => {
                    const btn = document.getElementById('oom-custom-range-btn');
                    if (btn) btn.classList.remove('active');
                    
                    // Trigger date range dropdown to apply the default filter
                    setTimeout(() => {
                        const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
                        if (dropdown) {
                            dropdown.value = 'all'; // Reset to show all
                            dropdown.dispatchEvent(new Event('change'));
                        }
                    }, 10);
                });
        }
    }, favorites, deleteFavoriteRange).open();
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
    globalLogger?.debug('Filter', 'forceApplyDateFilter called', { date });
    
    if (!date || isNaN(date.getTime())) {
        globalLogger?.error('Filter', 'Invalid date provided to forceApplyDateFilter');
        return;
    }
    
    try {
        // Extract year, month, day components directly to avoid timezone issues
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are 0-indexed
        const day = date.getDate();
        
        // Format dates as YYYY-MM-DD strings for consistency
        const start = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const end = start; // For a single day selection, start and end are the same
        
        globalLogger?.debug('Filter', 'Setting date range for filtering', {
            selectedDate: date.toISOString(),
            selectedYear: year, 
            selectedMonth: month, 
            selectedDay: day,
            formattedStart: start,
            formattedEnd: end
        });
        
        // First, set customDateRange to trigger filtering
        // This must happen BEFORE updating the UI to prevent event handlers from clearing it
        customDateRange = { start: start, end: end };
        
        globalLogger?.debug('Filter', 'Setting customDateRange', { customDateRange });
        
        // Save to localStorage for persistence
        localStorage.setItem(CUSTOM_RANGE_KEY, JSON.stringify(customDateRange));
        
        // Create a small delay to ensure customDateRange is set before any event handlers run
        setTimeout(() => {
            // Update UI to show filter is active
            requestAnimationFrame(() => {
                // Update button state
                const btn = document.getElementById('oom-custom-range-btn');
                if (btn) {
                    btn.classList.add('active');
                }
                
                // Update filter info display
                const filterDisplay = document.getElementById('oom-time-filter-display');
                if (filterDisplay) {
                    // Quick update to give immediate feedback
                    const formattedDate = date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                    });
                    filterDisplay.innerHTML = `<span class="oom-filter-icon">🗓️</span> <span class="oom-filter-text">Filtering for: ${formattedDate}</span>`;
                }
                
                // Update dropdown to show "Custom" is selected - AFTER setting customDateRange
                const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
                if (dropdown) {
                    // Add a custom option if it doesn't exist
                    let customOption = dropdown.querySelector('option[value="custom"]') as HTMLOptionElement;
                    if (!customOption) {
                        customOption = document.createElement('option');
                        customOption.value = 'custom';
                        customOption.text = 'Custom Date';
                        dropdown.appendChild(customOption);
                    }
                    
                    // Set the value WITHOUT dispatching a change event
                    dropdown.value = 'custom';
                    
                    // Dispatch a custom event instead that won't trigger our change handler
                    dropdown.dispatchEvent(new CustomEvent('oom-value-set', { 
                        bubbles: true,
                        detail: { isDateNavigator: true }
                    }));
                }
            });
            
            // Apply the filter after UI updates to avoid jank
            setTimeout(() => {
                globalLogger?.debug('Filter', 'Calling applyCustomDateRangeFilter');
                applyCustomDateRangeFilter();
            }, 100);
            
            globalLogger?.debug('Filter', 'Filter applied for date', { date: date.toLocaleDateString() });
        }, 50);
    } catch (error) {
        globalLogger?.error('Filter', 'Error in forceApplyDateFilter', { error });
    }
}

// Expose the function globally so it can be called from DateNavigatorModal
(window as any).forceApplyDateFilter = forceApplyDateFilter;

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
        const rows = document.querySelectorAll('.oom-dream-row');
        if (rows.length > 0) {
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
                                
                                dateCell.setAttribute('data-date', isoDate);
                                dateCell.setAttribute('data-iso-date', isoDate);
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
    }
    
    // Use requestIdleCallback to run this during browser idle time
    // This prevents blocking the main thread during initial page load
    const runWhenIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
    
    runWhenIdle(() => {
        globalLogger?.debug('UI', 'Initializing table row classes during idle time');
        const tables = document.querySelectorAll('.oom-table');
        
        if (tables.length === 0) {
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
    visibleRows.forEach((row, rowIndex) => {
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

// Function to toggle content visibility for a given button - alternative implementation
function toggleContentVisibility(button: HTMLElement, previewEl: HTMLElement) {
    globalLogger?.debug('UI', 'Using alternative content visibility implementation');
    
    try {
        // Get the content cell ID from the button
        const contentCellId = button.getAttribute('data-parent-cell');
        if (!contentCellId) {
            globalLogger?.error('UI', 'No data-parent-cell attribute on button');
            new Notice('Error: Cannot find content to expand');
            return;
        }
        
        const contentCell = document.getElementById(contentCellId);
        if (!contentCell) {
            globalLogger?.error('UI', 'Could not find content cell with ID', { contentCellId });
            new Notice('Error: Content cell not found');
            return;
        }
        
        // Get the current state
        const isExpanded = button.getAttribute('data-expanded') === 'true';
        globalLogger?.debug('UI', 'Current expansion state', { isExpanded });
        
        // Get elements
        const contentWrapper = contentCell.querySelector('.oom-content-wrapper');
        const previewContent = contentCell.querySelector('.oom-content-preview');
        const fullContent = contentCell.querySelector('.oom-content-full');
        
        if (!contentWrapper || !previewContent || !fullContent) {
            globalLogger?.error('UI', 'Missing required content elements');
            return;
        }
        
        // Force browser reflow first
        void contentCell.offsetHeight;
        
        // Direct DOM manipulation approach
        if (!isExpanded) {
            globalLogger?.debug('UI', 'Expanding content', { contentCellId });
            
            // 1. First update button state
            button.setAttribute('data-expanded', 'true');
            button.setAttribute('aria-expanded', 'true');
            const buttonText = button.querySelector('.oom-button-text');
            if (buttonText) buttonText.textContent = 'Show less';
            const buttonIcon = button.querySelector('.oom-button-icon');
            if (buttonIcon) buttonIcon.textContent = '▲';
            
            // 2. Update content wrapper with CSS class
            contentWrapper.classList.add('expanded');
            
            // 3. Create a transition effect by temporarily setting overflow to hidden
            contentCell.style.overflow = 'hidden';
            
            // 4. Set styles directly - use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                (previewContent as HTMLElement).style.display = 'none';
                (fullContent as HTMLElement).style.display = 'block';
                
                // 5. Update the table row height to fit the new content
                const tableRow = contentCell.closest('tr');
                if (tableRow) {
                    (tableRow as HTMLElement).style.height = 'auto';
                    (tableRow as HTMLElement).style.minHeight = 'fit-content';
                }
                
                // 6. Remove overflow constraint after transition
                setTimeout(() => {
                    contentCell.style.overflow = '';
                }, 300);
                
                new Notice('Content expanded');
            });
        } else {
            globalLogger?.debug('UI', 'Collapsing content', { contentCellId });
            
            // 1. First update button state
            button.setAttribute('data-expanded', 'false');
            button.setAttribute('aria-expanded', 'false');
            const buttonText = button.querySelector('.oom-button-text');
            if (buttonText) buttonText.textContent = 'Show more';
            const buttonIcon = button.querySelector('.oom-button-icon');
            if (buttonIcon) buttonIcon.textContent = '▼';
            
            // 2. Update content wrapper with CSS class
            contentWrapper.classList.remove('expanded');
            
            // 3. Set styles directly - use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                (previewContent as HTMLElement).style.display = 'block';
                (fullContent as HTMLElement).style.display = 'none';
                
                new Notice('Content collapsed');
            });
        }
        
        // Store the expanded state in localStorage for persistence
        try {
            const expandedStates = JSON.parse(localStorage.getItem('oom-expanded-states') || '{}');
            expandedStates[contentCellId] = !isExpanded;
            localStorage.setItem('oom-expanded-states', JSON.stringify(expandedStates));
        } catch (e) {
            globalLogger?.error('UI', 'Error saving expanded state', { error: e });
        }
        
    } catch (error) {
        globalLogger?.error('UI', 'Error in toggleContentVisibility', { error });
    }
}

// Helper function to expand all content sections - useful for debugging
function expandAllContentSections(previewEl: HTMLElement) {
    globalLogger?.debug('UI', 'Expanding all content sections for debugging');
    
    const expandButtons = previewEl.querySelectorAll('.oom-button--expand');
    expandButtons.forEach(button => {
        const isExpanded = button.getAttribute('data-expanded') === 'true';
        if (!isExpanded) {
            // Only expand sections that aren't already expanded
            globalLogger?.debug('UI', 'Expanding content section', { 
                contentCellId: button.getAttribute('data-parent-cell') 
            });
            toggleContentVisibility(button as HTMLElement, previewEl);
        }
    });
    
    globalLogger?.debug('UI', 'Finished expanding all content sections');
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
            toggleContentVisibility(button as HTMLElement, previewEl);
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
    // Check if it's a Lucide icon
    const lucideIcon = lucideIconMap?.[iconName];
    if (lucideIcon) return lucideIcon;
    // Return a simple span as fallback
    return `<span class="icon">${iconName}</span>`;
}

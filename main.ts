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
import { MetricsProcessor, DreamMetricsProcessor, MetricsCollector, TableStatisticsUpdater } from './src/metrics';

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
import { ContentToggler } from './src/dom/content/ContentToggler';
import { FilterUI } from './src/dom/filters/FilterUI';
import { TableGenerator, TableManager } from './src/dom/tables';
import { ModalsManager } from './src/dom/modals/ModalsManager';
// Removed duplicate import

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

// Import debugging tools
import { DebugTools } from './src/utils/DebugTools';

// Import FilterManager
import { FilterManager } from './src/dom/filters/FilterManager';

// In the imports section, add the EventHandler import
import { EventHandler } from './src/events/EventHandler';

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
    private debugTools: DebugTools;
    private filterManager: FilterManager;
    private tableManager: TableManager;
    private metricsCollector: MetricsCollector;
    private tableStatisticsUpdater: TableStatisticsUpdater;
    // In the class properties, add a property for the EventHandler
    private eventHandler: EventHandler;

    // Add these properties to the DreamMetricsPlugin class with the other properties
    public contentToggler: ContentToggler;
    private filterUI: FilterUI;

    async onload() {
        // Assign the plugin instance to window.oneiroMetricsPlugin first
        // to ensure any components that depend on it can access it
        (window as any).oneiroMetricsPlugin = this;

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

        // Initialize FilterManager
        this.filterManager = new FilterManager(this.app, this.settings, () => this.saveSettings(), this.saveData.bind(this), this.logger);
        this.filterManager.initialize();

        // Initialize DebugTools
        this.debugTools = new DebugTools(this, this.app, this.logger);
        this.debugTools.registerGlobalDebugFunctions();
        
        // Initialize TableManager
        this.tableManager = new TableManager(this.app, this.settings, this.logger);
        
        // Initialize MetricsCollector and TableStatisticsUpdater
        this.metricsCollector = new MetricsCollector(this.app, this, this.logger);
        this.tableStatisticsUpdater = new TableStatisticsUpdater(this.logger);

        // Initialize these properties in the onload method, before initializing the EventHandler
        // Add these initializations before creating the EventHandler
        this.contentToggler = new ContentToggler(this.logger);
        this.filterUI = new FilterUI(this.app, this.settings, this.saveSettings.bind(this), this.logger);

        // In the onload method, after other manager initializations, initialize the EventHandler
        // Add this code where other managers are initialized
        this.eventHandler = new EventHandler(
            this.app,
            this.settings,
            this.contentToggler, // Assume this exists
            this.filterManager,
            this.filterUI, // Assume this exists or needs to be created
            this.scrapeMetrics.bind(this),
            this.showDateNavigator.bind(this),
            this.saveSettings.bind(this),
            this.logger
        );
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
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view || view.getMode() !== 'preview') {
            this.logger?.debug('UI', 'Not in preview mode, skipping project note view update');
            return;
        }

        const previewEl = view.previewMode?.containerEl;
        if (!previewEl) {
            this.logger?.debug('UI', 'No preview element found, skipping project note view update');
            return;
        }
        
        // Set container for event handlers and content toggler
        this.container = previewEl;
        this.eventHandler.setContainer(previewEl);
        this.contentToggler.setContainer(previewEl);
        
        // Setup event listeners for project notes
        this.eventHandler.attachProjectNoteEventListeners();
        
        // Initialize the table row classes for improved filtering
        // Defer initialization to avoid blocking initial render
        setTimeout(() => {
            this.tableManager.initializeTableRowClasses();
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

    /**
     * Apply filters to the metrics table
     * @param previewEl The preview element containing the metrics table
     */
    private applyFilters(previewEl: HTMLElement) {
        // Delegate to the FilterManager implementation
        this.filterManager.applyFilters(previewEl);
    }

    /**
     * Apply a filter to a dropdown element
     * @param filterDropdown The dropdown element
     * @param previewEl The preview element containing the metrics table
     * @returns Whether the filter was successfully applied
     */
    private applyFilterToDropdown(filterDropdown: HTMLSelectElement, previewEl: HTMLElement) {
        // Delegate to the FilterManager implementation
        return this.filterManager.applyFilterToDropdown(filterDropdown, previewEl);
    }

    /**
     * Force apply a filter directly to the DOM
     * @param previewEl The preview element containing the metrics table
     * @param startDate The start date of the filter range
     * @param endDate The end date of the filter range
     */
    private forceApplyFilterDirect(previewEl: HTMLElement, startDate: string, endDate: string) {
        // Delegate to the FilterManager implementation
        this.filterManager.forceApplyFilterDirect(previewEl, startDate, endDate);
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
                    // Use ModalsManager instead of removed showMetricsTabsModal method
                    const modalsManager = new ModalsManager(this.app, this, this.logger);
                    modalsManager.openMetricsTabsModal();
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
                this.tableManager.initializeTableRowClasses();
                
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
                        this.tableManager.initializeTableRowClasses();
                        
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
     * Debug the table data in the plugin
     * This will dump all table data to help diagnose issues with the date navigator
     */
    public debugTableData(): void {
        // Delegate to the DebugTools implementation
        this.debugTools.debugTableData();
    }

    /**
     * Add a debug ribbon icon specifically for testing the calendar
     */
    private addCalendarDebugRibbon(): void {
        // Add a ribbon icon for testing the calendar
        const ribbonEl = this.addRibbonIcon('calendar-plus', 'Test Calendar', () => {
            this.debugTools.debugDateNavigator();
        });
        this.ribbonIcons.push(ribbonEl);
    }

    /**
     * Debug the date navigator
     * This function is accessible from the console via:
     * window.oneiroMetricsPlugin.debugDateNavigator()
     */
    debugDateNavigator() {
        // Delegate to the DebugTools implementation
        this.debugTools.debugDateNavigator();
    }

    // Add this method to the plugin class
    private testContentParserDirectly() {
        // Delegate to the DebugTools implementation
        return this.debugTools.testContentParserDirectly();
    }

    // Method removed: showMetricsTabsModal() is now handled by ModalsManager
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

// Function removed: openCustomRangeModal(app: App) is now handled by ModalsManager

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
    this.tableManager.initializeTableRowClasses();
    
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
                const filteredMetrics = this.metricsCollector.collectVisibleRowMetrics(previewEl);
                this.tableStatisticsUpdater.updateSummaryTable(previewEl, filteredMetrics);
                
                // Update filter display with counts
                // Removed call to updateFilterDisplay which was moved to FilterManager
                
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

// Helper function to format a date for display
function formatDateForDisplay(date: Date): string {
    return format(date, 'MMM d, yyyy');
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
    if (globalContentToggler) {
        globalContentToggler.toggleContentVisibility(button);
    } else if (window.oneiroMetricsPlugin && window.oneiroMetricsPlugin.contentToggler) {
        // Fallback to plugin instance if global isn't set
        window.oneiroMetricsPlugin.contentToggler.toggleContentVisibility(button);
    } else {
        console.error('[OneiroMetrics] ContentToggler not initialized for toggle operation');
    }
}

function expandAllContentSections(previewEl: HTMLElement) {
    if (globalContentToggler) {
        globalContentToggler.expandAllContentSections(previewEl);
    } else if (window.oneiroMetricsPlugin && window.oneiroMetricsPlugin.contentToggler) {
        // Fallback to plugin instance if global isn't set
        window.oneiroMetricsPlugin.contentToggler.expandAllContentSections(previewEl);
    } else {
        console.error('[OneiroMetrics] ContentToggler not initialized for expand operation');
    }
}


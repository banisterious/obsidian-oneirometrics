// Copyright (c) 2025 John Banister
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// Import the safe logger immediately at the top
import safeLogger from './src/logging/safe-logger';

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

// External imports (Obsidian)
import { 
  App, 
  Editor, 
  MarkdownView, 
  Notice, 
  Plugin, 
  TFile
} from 'obsidian';

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

// Import the SettingsManager (SettingsAdapter and createAndRegisterSettingsAdapter are unused)
import { SettingsManager } from './src/state/SettingsManager';
import { MetricsProcessor, MetricsCollector, TableStatisticsUpdater } from './src/metrics';

// For backward compatibility with legacy types
import { LintingSettings, Timeline, CalendarView, ActiveJournal } from './types';

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
import { TestModal } from './src/journal_check/ui/TestModal';

// Internal imports - Services
import { LintingEngine } from './src/journal_check/LintingEngine';
import { TemplaterIntegration } from './src/journal_check/TemplaterIntegration';
import { TimeFilterManager } from './src/timeFilters';
import { DreamMetricsState } from './src/state/DreamMetricsState';

// Import the DEFAULT_JOURNAL_STRUCTURE_SETTINGS constant directly from the source
import { DEFAULT_JOURNAL_STRUCTURE_SETTINGS } from './src/types/journal-check';

import { MetricsTabsModal } from './src/dom/modals/MetricsTabsModal';

// Move this to the top of the file, before any functions that use it
let customDateRange: { start: string, end: string } | null = null;

// Import ContentToggler
import { ContentToggler } from './src/dom/content/ContentToggler';
import { FilterUI } from './src/dom/filters/FilterUI';
import { TableGenerator, TableManager } from './src/dom/tables';
import { ModalsManager } from './src/dom/modals/ModalsManager';

// Global instance for functions that need access to ContentToggler
let globalContentToggler: ContentToggler;

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
import { CustomDateRangeFilter, type DateRange } from './src/dom/filters/CustomDateRangeFilter';

// In the imports section, add the EventHandler import
import { EventHandler } from './src/events/EventHandler';

// Import the globals and GlobalHelpers
import { setGlobalLogger, setGlobalContentToggler } from './src/globals';
import {
  debugContentExpansion
} from './src/utils/GlobalHelpers';

// Import TemplateManager
import { TemplateManager } from './src/templates/TemplateManager';
import { FilterPersistenceManager } from './src/dom/filters/FilterPersistenceManager';
import { DateNavigatorManager } from './src/dom/date-navigator/DateNavigatorManager';
import { LogFileManager } from './src/logging/LogFileManager';

// Essential helper functions that are actually used
import {
  getProjectNotePath,
  getJournalStructure
} from './src/utils/settings-helpers';

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
    private customDateRangeFilter: CustomDateRangeFilter;
    private tableManager: TableManager;
    private metricsCollector: MetricsCollector;
    private tableStatisticsUpdater: TableStatisticsUpdater;
    // In the class properties, add a property for the EventHandler
    private eventHandler: EventHandler;

    // Add these properties to the DreamMetricsPlugin class with the other properties
    public contentToggler: ContentToggler;
    private filterUI: FilterUI;
    private templateManager: TemplateManager;
    private filterPersistenceManager: FilterPersistenceManager;
    private dateNavigatorManager: DateNavigatorManager;
    private logFileManager: LogFileManager;

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

        // Initialize CustomDateRangeFilter
        this.customDateRangeFilter = new CustomDateRangeFilter(
            this.app,
            this.metricsCollector,
            this.tableStatisticsUpdater,
            this.tableManager
        );

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

        // Add these lines to the onload method to set the global variables
        setGlobalLogger(this.logger);
        setGlobalContentToggler(this.contentToggler);

        // Initialize the linting engine with safe property access
        const journalStructure = getJournalStructure(this.settings);
        this.lintingEngine = new LintingEngine(this, journalStructure || DEFAULT_JOURNAL_STRUCTURE_SETTINGS);

        // Initialize TemplateManager
        this.templateManager = new TemplateManager(
            this.app,
            this.settings,
            this.templaterIntegration,
            this.logger
        );

        // Initialize FilterPersistenceManager
        this.filterPersistenceManager = new FilterPersistenceManager(
            this.app,
            this.settings,
            this.saveSettings.bind(this),
            this.tableManager,
            this.applyFilterToDropdown.bind(this),
            this.logger
        );

        // Initialize DateNavigatorManager
        this.dateNavigatorManager = new DateNavigatorManager(
            this.app,
            this.state,
            this.timeFilterManager,
            this.memoizedTableData,
            this.logger
        );

        // Initialize LogFileManager
        this.logFileManager = new LogFileManager(
            this.app,
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
        
        // Note: Component initialization is handled by PluginLoader.ts
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
        // This method directly starts the scraping process
        globalLogger?.info('Plugin', 'showMetrics called - directly launching scrapeMetrics');
        
        // Direct scraping (DreamJournalManager has been replaced by OneiroMetrics Hub)
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

    /**
     * Update the project note with metrics data
     * 
     * @param metrics - Record of metrics data to update
     * @param dreamEntries - Array of dream entries to include
     */
    public async updateProjectNote(metrics: Record<string, number[]>, dreamEntries: DreamMetricData[]): Promise<void> {
        return this.projectNoteManager.updateProjectNote(metrics, dreamEntries);
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
                // Add OneiroMetrics Hub button with lucide-shell icon
                const metricsHubRibbonEl = this.addRibbonIcon('lucide-shell', 'OneiroMetrics Hub', () => {
                    // Use ModalsManager to open the consolidated hub
                    const modalsManager = new ModalsManager(this.app, this, this.logger);
                    modalsManager.openMetricsTabsModal();
                });
                this.ribbonIcons.push(metricsHubRibbonEl);
            }
        }
    }

    /**
     * Insert a journal template into the current editor
     */
    async insertTemplate(editor: Editor) {
        // Delegate to the TemplateManager implementation
        await this.templateManager.insertTemplate(editor);
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
        // Delegate to DateNavigatorManager
        this.dateNavigatorManager.showDateNavigator();
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
            // Check if filterPersistenceManager is initialized
            if (!this.filterPersistenceManager) {
                this.logger?.warn('Filter', 'FilterPersistenceManager not initialized, skipping initial filters');
                return;
            }
            
            // Delegate to FilterPersistenceManager
            this.filterPersistenceManager.applyInitialFilters();
        } catch (error) {
            this.logger?.error('Filter', 'Error in applyInitialFilters', error instanceof Error ? error : new Error(String(error)));
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

    // Method removed: showMetricsTabsModal() is now handled by ModalsManager
}

// Helper to extract date for a dream entry
// Function removed: getDreamEntryDate() is now imported from src/utils/date-utils.ts

// Function removed: openCustomRangeModal(app: App) is now handled by ModalsManager

// Helper functions for range management - moved to src/utils/storage-helpers.ts
// Functions removed: saveLastCustomRange, loadLastCustomRange, saveFavoriteRange, loadFavoriteRanges, deleteFavoriteRange
// These functions are now imported from src/utils/storage-helpers.ts

// Find the DateNavigatorModal's Apply button click handler
// In src/dom/DateNavigatorModal.ts, replace with this direct implementation in main.ts

// Utility function to force filtering - REMOVED: now handled by DateFilter class
// The forceApplyDateFilter function has been moved to DateFilter class
// Global handler is registered via DateFilter.registerGlobalHandler() in onload()

// The global registration is now handled by DateFilter.registerGlobalHandler()

// Phase 1: CSS-based visibility optimization to reduce browser reflows
function applyCustomDateRangeFilter() {
    globalLogger?.debug('Filter', 'Custom date range filter applied', { customDateRange });
    
    if (!customDateRange) {
        globalLogger?.warn('Filter', 'No custom date range found, filter cannot be applied');
        return;
    }

    // Delegate to the CustomDateRangeFilter class
    if (window.oneiroMetricsPlugin && window.oneiroMetricsPlugin.customDateRangeFilter) {
        window.oneiroMetricsPlugin.customDateRangeFilter.applyCustomDateRangeFilter(customDateRange);
    } else {
        globalLogger?.error('Filter', 'CustomDateRangeFilter not available');
    }
}

// Add TypeScript declaration for the window object extension
declare global {
    interface Window {
        forceApplyDateFilter: (selectedDate: Date) => void;
        oneiroMetricsPlugin: any; // Using 'any' to avoid circular dependencies
        debugContentExpansion: (showExpanded?: boolean) => string;
    }
}

// Debug helper - expose content expansion function to window object for console debugging
(window as any).debugContentExpansion = debugContentExpansion;

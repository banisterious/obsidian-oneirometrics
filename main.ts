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
import {
    DateNavigator,
    DateNavigatorManager,
    DateNavigatorView,
    DATE_NAVIGATOR_VIEW_TYPE
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

import { HubModal } from './src/dom/modals/HubModal';

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
import { PluginInitializer } from './src/plugin/PluginInitializer';

// Import debugging tools
import { DebugTools } from './src/utils/DebugTools';

// Import FilterManager
import { FilterManager } from './src/dom/filters/FilterManager';
import { CustomDateRangeFilter, type DateRange } from './src/dom/filters/CustomDateRangeFilter';

// In the imports section, add the EventHandler import
import { EventHandler } from './src/events/EventHandler';

// Import ScrapeEventEmitter for real-time feedback
import { ScrapeEventEmitter } from './src/events/ScrapeEvents';

// Import the globals and GlobalHelpers
import { setGlobalLogger, setGlobalContentToggler } from './src/globals';
import {
  debugContentExpansion
} from './src/utils/GlobalHelpers';

// Import TemplateManager
import { TemplateManager } from './src/templates/TemplateManager';
import { FilterPersistenceManager } from './src/dom/filters/FilterPersistenceManager';
import { LogFileManager } from './src/logging/LogFileManager';

// Essential helper functions that are actually used
import {
  getProjectNotePath,
  getJournalStructure
} from './src/utils/settings-helpers';

// Import test modals
import { WebWorkerTestModal } from './src/workers/ui/WebWorkerTestModal';
import { MetricsCalculatorTestModal } from './src/workers/ui/MetricsCalculatorTestModal';
import { TemplateTabsModal } from './src/templates/ui/TemplateTabsModal';
import { UnifiedTestSuiteModal } from './src/testing/ui/UnifiedTestSuiteModal';

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
    // private dateNavigator: DateNavigatorIntegration; // Archived - using DateSelectionModal now
    public timeFilterManager: TimeFilterManager;
    
    state: DreamMetricsState;
    
    loadedSettings: boolean = false;
    ribbons: Map<string, HTMLElement> = new Map();
    onlyActiveFile: boolean = false;
    expandedStates: Set<string>;
    private ribbonIcons: HTMLElement[] = [];
    private container: HTMLElement | null = null;
    private journalManagerRibbonEl: HTMLElement | null = null;
    public memoizedTableData = new Map<string, any>();
    private cleanupFunctions: (() => void)[] = [];
    // private dateNavigatorIntegration: DateNavigatorIntegration | null = null; // Archived - using DateSelectionModal now
    private currentSortDirection: { [key: string]: 'asc' | 'desc' } = {};
    private settingsManager: SettingsManager;
    public dateRangeService: DateRangeService;
    private projectNoteManager: ProjectNoteManager;
    private ribbonManager: RibbonManager;
    public dateFilter: DateFilter;
    public debugTools: DebugTools;
    public filterManager: FilterManager;
    public customDateRangeFilter: CustomDateRangeFilter;
    public tableManager: TableManager;
    public metricsCollector: MetricsCollector;
    public tableStatisticsUpdater: TableStatisticsUpdater;
    // In the class properties, add a property for the EventHandler
    public eventHandler: EventHandler;

    // Event emitter for real-time scraping feedback
    public scrapeEventEmitter: ScrapeEventEmitter;

    // Add these properties to the DreamMetricsPlugin class with the other properties
    public contentToggler: ContentToggler;
    public filterUI: FilterUI;
    public templateManager: TemplateManager;
    public filterPersistenceManager: FilterPersistenceManager;
    public dateNavigatorManager: DateNavigatorManager;
    public logFileManager: LogFileManager;

    async onload() {
        // Delegate all initialization logic to PluginInitializer
        const initializer = new PluginInitializer(this, this.app);
        await initializer.initializePlugin();
        
        // Add OneiroMetrics Hub command (always available)
        this.addCommand({
            id: 'open-oneirometrics-hub',
            name: 'Open hub',
            callback: () => {
                const modalsManager = new ModalsManager(this.app, this, this.logger);
                modalsManager.openHubModal();
            }
        });

        // Add Unified Test Suite Modal command (only available when logging is enabled)
        this.addCommand({
            id: 'open-unified-test-suite',
            name: 'Open unified test suite',
            checkCallback: (checking: boolean) => {
                const logLevel = this.settings?.logging?.level || 'off';
                if (logLevel === 'off') return false;
                if (!checking) {
                    new UnifiedTestSuiteModal(this.app, this).open();
                }
                return true;
            }
        });

        // Enhanced Accessibility Commands - Phase 1 Foundation
        this.addAccessibilityCommands();

        // Add Enhanced Date Navigator command (for testing/preview)
        this.addCommand({
            id: 'open-enhanced-date-navigator-preview',
            name: 'Enhanced date navigator (preview)',
            callback: () => {
                const { EnhancedDateNavigatorModal } = require('./src/dom/modals/EnhancedDateNavigatorModal');
                const modal = new EnhancedDateNavigatorModal(this.app, this.timeFilterManager, this);
                modal.open();
            }
        });
    }

    onunload() {
        safeLogger.info('Plugin', 'Unloading Dream Metrics plugin');
        
        // Note: Per Obsidian reviewer feedback, we do not remove ribbon icons
        // as they are automatically cleaned up by Obsidian
        
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
            new Notice('No structure issues found! ðŸŽ‰');
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

    /**
     * Scrape metrics using the modern UniversalMetricsCalculator with automatic fallback
     * 
     * Uses a robust dual-system approach:
     * 1. Primary: UniversalMetricsCalculator (modern system with worker pool)
     * 2. Fallback: MetricsCollector (legacy system, known stable)
     * 
     * Includes timeout protection, folder validation, and comprehensive error handling.
     */
    async scrapeMetrics() {
        // Step 1: Validate project note configuration and existence
        const projectNotePath = this.settings.projectNote;
        
        if (!projectNotePath) {
            this.logger?.warn('Scrape', 'No project note configured - scraping cannot proceed');
            new Notice('⚠️ Please configure your OneiroMetrics note before scraping.');
            return;
        }
        
        const projectFile = this.app.vault.getAbstractFileByPath(projectNotePath);
        if (!projectFile) {
            this.logger?.warn('Scrape', `Project note not found: ${projectNotePath}`);
            new Notice(`⚠️ Project note not found: ${projectNotePath}. Please select an existing file in settings.`);
            return;
        }
        
        // Step 2: Proceed with scraping - Primary attempt: UniversalMetricsCalculator with timeout protection
        let universalSuccess = false;
        
        try {
            this.logger?.info('Scrape', '🔧 Attempting scraping with UniversalMetricsCalculator (modern system)');
            
            // Import the UniversalMetricsCalculator
            const { UniversalMetricsCalculator } = await import('./src/workers/UniversalMetricsCalculator');
            
            // Create universal calculator
            const universalCalculator = new UniversalMetricsCalculator(
                this.app,
                this,
                undefined, // Use default worker pool config
                this.logger
            );
            
            // Wrap in timeout to prevent hanging
            const SCRAPE_TIMEOUT = 120000; // 2 minutes timeout
            const scrapePromise = universalCalculator.scrapeMetrics();
            
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`UniversalMetricsCalculator timeout after ${SCRAPE_TIMEOUT / 1000} seconds`));
                }, SCRAPE_TIMEOUT);
            });
            
            // Race between scraping and timeout
            await Promise.race([scrapePromise, timeoutPromise]);
            
            this.logger?.info('Scrape', '✅ UniversalMetricsCalculator completed successfully');
            universalSuccess = true;
            
        } catch (error) {
            this.logger?.warn('Scrape', '⚠️ UniversalMetricsCalculator failed, will fallback to legacy system', {
                error: (error as Error).message,
                wasTimeout: (error as Error).message.includes('timeout')
            });
            
            // Don't show error notice yet - we'll try fallback first
            universalSuccess = false;
        }
        
        // Fallback to legacy system if Universal failed
        if (!universalSuccess) {
            try {
                this.logger?.info('Scrape', '🔄 Falling back to MetricsCollector (legacy system)');
                this.logger?.info('Scrape', 'Legacy system is known to be stable and reliable');
                
                // Use the existing MetricsCollector instance
                await this.metricsCollector.scrapeMetrics();
                
                this.logger?.info('Scrape', '✅ MetricsCollector (legacy) completed successfully');
                this.logger?.info('Scrape', '💡 Consider investigating UniversalMetricsCalculator issues for future improvements');
                
            } catch (fallbackError) {
                this.logger?.error('Scrape', '❌ Both Universal and Legacy systems failed!', fallbackError as Error);
                new Notice(`Critical Error: Both scraping systems failed. Please check logs for details.`);
            }
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

        // Check if we're viewing the OneiroMetrics project note
        const currentFile = view.file;
        const projectNotePath = getProjectNotePath(this.settings);
        const isProjectNote = currentFile && projectNotePath && currentFile.path === projectNotePath;

        // Find the markdown-preview-view element and manage the oom class
        const markdownPreviewView = previewEl.querySelector('.markdown-preview-view') as HTMLElement;
        if (markdownPreviewView) {
            const hasClass = markdownPreviewView.hasClass('oom-project-note-view');
            
            if (isProjectNote && !hasClass) {
                // Only add if we're viewing the project note and it doesn't already have the class
                markdownPreviewView.addClass('oom-project-note-view');
                this.logger?.debug('UI', 'Added oom-project-note-view class to markdown-preview-view');
            } else if (!isProjectNote && hasClass) {
                // Only remove if we're not viewing the project note and it has the class
                markdownPreviewView.removeClass('oom-project-note-view');
                this.logger?.debug('UI', 'Removed oom-project-note-view class from markdown-preview-view');
            }
        }
        
        // Set container for event handlers and content toggler
        this.container = previewEl;
        
        // Only set container if the services are initialized
        if (this.eventHandler) {
            this.eventHandler.setContainer(previewEl);
            // Setup event listeners for project notes
            this.eventHandler.attachProjectNoteEventListeners();
        }
        
        if (this.contentToggler) {
            this.contentToggler.setContainer(previewEl);
        }
        
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

        // **Attempt to restore charts if viewing OneiroMetrics project note**
        if (isProjectNote) {
            setTimeout(async () => {
                try {
                    await this.attemptChartRestoration();
                } catch (error) {
                    this.logger?.error('UI', 'Chart restoration failed', error as Error);
                }
            }, 500); // Give DOM time to render
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
    public applyFilterToDropdown(filterDropdown: HTMLSelectElement, previewEl: HTMLElement) {
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
        
        // Update settings explicitly
        if (!this.settings.logging) {
            this.settings.logging = {
                level: level,
                maxSize: 1024 * 1024,
                maxBackups: 3
            };
        } else {
            this.settings.logging.level = level;
        }
        
        // Update settings through settings manager
        this.settingsManager.updateLogConfig(
            level,
            this.settings.logging?.maxSize || 1024 * 1024,
            this.settings.logging?.maxBackups || 3
        );
        
        // Save settings explicitly
        this.saveSettings();
        
        // Log the change for debugging
        safeLogger.info('Plugin', `Log level changed to: ${level}`);
        
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
            
            // Add ribbon icons (per Obsidian reviewer feedback, no toggle needed)
            // Add OneiroMetrics Hub button with lucide-shell icon
            const metricsHubRibbonEl = this.addRibbonIcon('lucide-shell', 'OneiroMetrics Hub', () => {
                // Use ModalsManager to open the consolidated hub
                const modalsManager = new ModalsManager(this.app, this, this.logger);
                modalsManager.openHubModal();
            });
            this.ribbonIcons.push(metricsHubRibbonEl);
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
        // Note: Per Obsidian reviewer feedback, we don't use toggles for ribbon buttons
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
                this.logger?.warn('Filter', 'FilterPersistenceManager not initialized, retrying in 100ms');
                // Retry after a short delay to allow initialization to complete
                setTimeout(() => this.applyInitialFilters(), 100);
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
     * Attempt to restore charts from cached data when OneiroMetrics note is viewed
     */
    private async attemptChartRestoration(): Promise<void> {
        this.logger?.debug('UI', 'attemptChartRestoration called');
        
        try {
            // Check if chart tabs placeholder exists (indicates the note has the right structure)
            const placeholder = document.querySelector('#oom-chart-tabs-placeholder') as HTMLElement;
            if (!placeholder) {
                this.logger?.debug('UI', 'No chart placeholder found, note may not have chart structure');
                return;
            }
            
            // Extract dream entries from the DOM table to validate cache
            const dreamEntries = this.extractDreamEntriesFromDOM();
            if (!dreamEntries || dreamEntries.length === 0) {
                this.logger?.debug('UI', 'No dream entries found in DOM');
                this.showChartPlaceholder(placeholder);
                return;
            }
            
            this.logger?.debug('UI', 'Found dream entries in DOM', { count: dreamEntries.length });
            
            // Try to restore charts from cache
            const { ChartDataPersistence } = await import('./src/state/ChartDataPersistence');
            const persistence = new ChartDataPersistence(this.app, this, this.logger);
            
            const cacheStatus = await persistence.getCacheStatus(dreamEntries);
            this.logger?.debug('UI', 'Cache status', cacheStatus);
            
            if (cacheStatus.hasCache && cacheStatus.isValid) {
                this.logger?.debug('UI', 'Attempting to restore charts from cache');
                const cachedData = await persistence.restoreChartData(dreamEntries);
                
                if (cachedData) {
                    this.logger?.debug('UI', 'Successfully restored cached chart data');
                    // Initialize charts with cached data via TableGenerator
                    const tableGenerator = new (await import('./src/dom/tables/TableGenerator')).TableGenerator(
                        this.settings, 
                        this.logger, 
                        this.app, 
                        this
                    );
                    await tableGenerator.initializeChartTabs(cachedData.metrics, dreamEntries);
                    this.logger?.debug('UI', 'Charts restored successfully');
                    return;
                }
            }

            // If we get here, cache is invalid or missing
            this.logger?.debug('UI', 'No valid cache found, showing placeholder');
            this.showChartPlaceholder(placeholder);

        } catch (error) {
            this.logger?.error('UI', 'Chart restoration failed', error as Error);
            
            // Show placeholder on error
            const placeholder = document.querySelector('#oom-chart-tabs-placeholder') as HTMLElement;
            if (placeholder) {
                this.showChartPlaceholder(placeholder);
            }
        }
    }

    /**
     * Extract dream entries from the DOM table for cache validation
     */
    private extractDreamEntriesFromDOM(): DreamMetricData[] {
        this.logger?.debug('UI', 'Extracting dream entries from DOM');
        
        const dreamEntries: DreamMetricData[] = [];
        
        // Find the main table with dream data
        const tableRows = document.querySelectorAll('.oom-table tbody tr');
        this.logger?.debug('UI', 'Found table rows', { count: tableRows.length });
        
        tableRows.forEach((row, index) => {
            try {
                // Extract date from the first cell
                const dateCell = row.querySelector('td:first-child') as HTMLElement;
                const titleCell = row.querySelector('td:nth-child(2)') as HTMLElement;
                
                if (!dateCell || !titleCell) {
                    this.logger?.debug('UI', 'Skipping row - missing date or title', { index });
                    return;
                }
                
                const dateText = dateCell.textContent?.trim();
                const titleText = titleCell.textContent?.trim();
                
                if (!dateText || !titleText) {
                    this.logger?.debug('UI', 'Skipping row - invalid date or title', { index });
                    return;
                }
                
                // Parse the date
                const dreamDate = new Date(dateText);
                if (isNaN(dreamDate.getTime())) {
                    return; // Skip invalid dates
                }
                
                // Extract metrics from remaining cells
                const metricCells = row.querySelectorAll('td:nth-child(n+3)');
                const metrics: { [key: string]: number } = {};
                
                metricCells.forEach((cell, cellIndex) => {
                    const value = parseFloat(cell.textContent?.trim() || '0');
                    if (!isNaN(value)) {
                        // Use generic metric names for now
                        const metricName = `metric_${cellIndex + 1}`;
                        metrics[metricName] = value;
                    }
                });
                
                dreamEntries.push({
                    date: dateText, // Use string instead of Date object
                    title: titleText,
                    content: '', // Not available from DOM
                    metrics,
                    source: `extracted-from-dom#row-${index}`,
                    wordCount: 0 // Not available from DOM extraction
                });
                
            } catch (error) {
                // Skip problematic rows
            }
        });
        
        this.logger?.debug('UI', 'Successfully extracted entries', { count: dreamEntries.length });
        
        // Add accessibility commands
        this.logger?.debug('Accessibility', 'Registering essential accessibility command');
        
        this.addCommand({
            id: 'open-date-navigator-accessible',
            name: 'Open date navigator (accessible)',
            callback: () => {
                this.logger?.debug('Accessibility', 'Opening Date Navigator');
                this.openDateNavigatorAccessible();
            },
        });
        
        this.logger?.debug('Accessibility', 'Essential accessibility command registered successfully');
        
        // Add accessibility validation context for debugging
        const activeFile = this.app.workspace.getActiveFile();
        const projectNotePath = getProjectNotePath(this.settings);
        const isOneiroNoteActive = activeFile && projectNotePath && activeFile.path === projectNotePath;
        const isNavigatorReady = !!this.dateNavigatorManager;
        const isValid = this.validateAccessibilityContext();
        
        this.logger?.debug('Accessibility', 'Date Navigator Accessibility Check', {
            activeFile: activeFile?.path,
            projectNote: projectNotePath,
            isOneiroNoteActive,
            isNavigatorReady,
            isValid
        });
        
        return dreamEntries;
    }

    /**
     * Show a placeholder message when no charts are available
     */
    private showChartPlaceholder(placeholder: HTMLElement): void {
        this.logger?.debug('UI', 'Showing chart placeholder');
        
        placeholder.innerHTML = `
            <div class="oom-chart-placeholder">
                <div class="oom-placeholder-content">
                    <h3>📊 Chart Data Not Available</h3>
                    <p>Charts will appear here after running a metrics scrape.</p>
                    <p><strong>To generate charts:</strong></p>
                    <ol>
                        <li>Click the "Rescrape Metrics" button below</li>
                        <li>Or use the OneiroMetrics Hub (ribbon icon)</li>
                    </ol>
                    <div class="oom-chart-placeholder-actions">
                        <button class="oom-chart-placeholder-hub-btn" type="button">
                            🌙 Open OneiroMetrics Hub
                        </button>
                    </div>
                    <p><em>Charts are automatically cached and will persist between reloads once generated.</em></p>
                </div>
            </div>
        `;

        // Add click handler for Hub button
        const hubBtn = placeholder.querySelector('.oom-chart-placeholder-hub-btn') as HTMLElement;
        if (hubBtn) {
            hubBtn.addEventListener('click', () => {
                try {
                    const { ModalsManager } = require('./src/dom/modals/ModalsManager');
                    const modalsManager = new ModalsManager(this.app, this, null);
                    modalsManager.openHubModal();
                } catch (error) {
                    this.logger?.error('Error opening Hub from chart placeholder:', error);
                    new Notice('Error opening OneiroMetrics Hub');
                }
            });
        }
    }

    /**
     * Add essential accessibility command for Date Navigator
     * Simplified implementation focusing on core functionality
     */
    private addAccessibilityCommands(): void {
        this.logger?.debug('Accessibility', 'Registering essential accessibility command');
        
        // Essential Date Navigator opening command
        this.addCommand({
            id: 'date-nav-open-accessible',
            name: 'Date navigator: open',
            // HOTKEY FIX: Removed default hotkey - let users configure manually
            checkCallback: (checking: boolean) => {
                const isReady = this.validateAccessibilityContext();
                
                if (isReady && !checking) {
                    this.logger?.debug('Accessibility', 'Opening Date Navigator');
                    this.openDateNavigatorAccessible();
                }
                
                return isReady;
            }
        });
        
        this.logger?.debug('Accessibility', 'Essential accessibility command registered successfully');
    }

    /**
     * Validates if the Date Navigator opening command should be available
     * Simplified validation for essential accessibility
     */
    private validateAccessibilityContext(): boolean {
        const activeFile = this.app.workspace.getActiveFile();
        const isOneiroNoteActive = activeFile?.path === this.settings.projectNote;
        const isNavigatorReady = !this.isCurrentlyScraping();
        
        // Only require OneiroNote to be active and not scraping
        const isValid = isOneiroNoteActive && isNavigatorReady;
        
        // DEBUG: Log validation details
        this.logger?.debug('Accessibility', 'Date Navigator Accessibility Check', {
            activeFile: activeFile?.path,
            projectNote: this.settings.projectNote,
            isOneiroNoteActive,
            isNavigatorReady,
            isValid
        });
        
        return isValid;
    }

    /**
     * Checks if scraping is currently in progress
     */
    private isCurrentlyScraping(): boolean {
        // Check for scraping indicators
        return document.querySelector('.oom-progress-container') !== null ||
               document.querySelector('.scraping-in-progress') !== null;
    }

    /**
     * Opens Date Navigator with essential accessibility enhancements
     * Simplified implementation focusing on core functionality
     */
    private openDateNavigatorAccessible(): void {
        try {
            // Provide helpful guidance to screen reader users
            this.announceToScreenReader('Date Navigator opened. Use Tab to navigate buttons, Enter to select, Escape to close.');
            
            // Open the standard date navigator
            this.showDateNavigator();
            
        } catch (error) {
            this.logger?.error('Accessibility', 'Error opening Date Navigator', error as Error);
            new Notice('Error opening Date Navigator');
        }
    }
}

// Helper to extract date for a dream entry
// Function removed: getDreamEntryDate() is now imported from src/utils/date-utils.ts

// Function removed: openCustomRangeModal(app: App) is now handled by ModalsManager

// Helper functions for range management - moved to src/utils/storage-helpers.ts
// Functions removed: saveLastCustomRange, loadLastCustomRange, saveFavoriteRange, loadFavoriteRanges, deleteFavoriteRange
// These functions are now imported from src/utils/storage-helpers.ts

// Legacy comment - DateNavigatorModal has been removed and consolidated into DateSelectionModal

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
interface DebugWindow extends Window {
    debugContentExpansion: (showExpanded?: boolean) => string;
}

(window as DebugWindow).debugContentExpansion = debugContentExpansion;

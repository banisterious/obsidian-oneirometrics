// Copyright (c) 2025 John Banister
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { App, Notice, Modal } from 'obsidian';
import type DreamMetricsPlugin from '../../main';
import { PluginLoader } from './PluginLoader';
import { DateFilter } from '../dom/filters';
import { FilterManager } from '../dom/filters/FilterManager';
import { DebugTools } from '../utils/DebugTools';
import { TableManager } from '../dom/tables';
import { MetricsCollector, TableStatisticsUpdater } from '../metrics';
import { CustomDateRangeFilter } from '../dom/filters/CustomDateRangeFilter';
import { ContentToggler } from '../dom/content/ContentToggler';
import { FilterUI } from '../dom/filters/FilterUI';
import { EventHandler } from '../events/EventHandler';
import { setGlobalLogger, setGlobalContentToggler } from '../globals';
import { LintingEngine } from '../journal_check/LintingEngine';
import { getJournalStructure } from '../utils/settings-helpers';
import { DEFAULT_JOURNAL_STRUCTURE_SETTINGS } from '../types/journal-check';
import { TemplateManager } from '../templates/TemplateManager';
import { FilterPersistenceManager } from '../dom/filters/FilterPersistenceManager';
import { DateNavigatorManager } from '../dom/date-navigator/DateNavigatorManager';
import { LogFileManager } from '../logging/LogFileManager';

// Import ScrapeEventEmitter for real-time feedback
import { ScrapeEventEmitter, SCRAPE_EVENTS } from '../events/ScrapeEvents';

// Import the safe logger for early logging
import safeLogger from '../logging/safe-logger';

/**
 * PluginInitializer handles all the complex manager initialization logic
 * that was previously in the main plugin's onload() method.
 * 
 * This class separates initialization concerns from the main plugin logic,
 * making the codebase more modular and testable.
 */
export class PluginInitializer {
    constructor(
        private plugin: DreamMetricsPlugin,
        private app: App
    ) {}

    /**
     * Initialize all plugin managers and components
     * This replaces the massive onload() method in the main plugin class
     */
    async initializePlugin(): Promise<void> {
        // Step 1: Set up global plugin reference
        this.setupGlobalPluginReference();

        // Step 2: Initialize core plugin using PluginLoader
        await this.initializeCore();

        // Step 3: Initialize all managers in the correct order
        await this.initializeManagers();

        // Step 4: Set up global variables and handlers
        this.setupGlobalVariables();

        safeLogger.info('Plugin', 'PluginInitializer completed all initializations successfully');
    }

    /**
     * Set up the global plugin reference for components that need it
     */
    private setupGlobalPluginReference(): void {
        (window as any).oneiroMetricsPlugin = this.plugin;
    }

    /**
     * Initialize the core plugin using PluginLoader
     */
    private async initializeCore(): Promise<void> {
        const pluginLoader = new PluginLoader(this.plugin, this.app);
        
        try {
            await pluginLoader.initialize();
            
            // Use the plugin's logger once it's initialized, or fall back to safeLogger
            const logger = this.plugin.logger || safeLogger;
            logger.info('Plugin', 'OneiroMetrics plugin loaded successfully');
        } catch (error) {
            console.error('Failed to initialize OneiroMetrics plugin:', error);
            
            // Use safeLogger for error logging since plugin.logger might not be available yet
            safeLogger.error('Plugin', 'Failed to initialize OneiroMetrics plugin', 
                error instanceof Error ? error : new Error(String(error)));
            
            new Notice('Failed to initialize OneiroMetrics plugin: ' + (error instanceof Error ? error.message : String(error)));
            throw error; // Re-throw to stop initialization
        }
    }

    /**
     * Initialize all managers in the correct dependency order
     */
    private async initializeManagers(): Promise<void> {
        // Phase 1: Initialize basic managers without complex dependencies
        this.initializeBasicManagers();

        // Phase 2: Initialize UI and interaction managers
        this.initializeUIManagers();

        // Phase 3: Initialize advanced managers that depend on others
        this.initializeAdvancedManagers();
    }

    /**
     * Initialize basic managers that don't have complex dependencies
     */
    private initializeBasicManagers(): void {
        // Initialize DateFilter
        this.plugin.dateFilter = new DateFilter(
            this.app, 
            this.plugin.settings, 
            this.plugin.saveSettings.bind(this.plugin), 
            this.plugin.logger
        );
        this.plugin.dateFilter.registerGlobalHandler();

        // Initialize FilterManager
        this.plugin.filterManager = new FilterManager(
            this.app, 
            this.plugin.settings, 
            () => this.plugin.saveSettings(), 
            this.plugin.saveData.bind(this.plugin), 
            this.plugin.logger
        );
        this.plugin.filterManager.initialize();

        // Initialize DebugTools
        this.plugin.debugTools = new DebugTools(this.plugin, this.app, this.plugin.logger);
        this.plugin.debugTools.registerGlobalDebugFunctions();
        
        // Initialize TableManager
        this.plugin.tableManager = new TableManager(this.app, this.plugin.settings, this.plugin.logger);
        
        // Initialize MetricsCollector and TableStatisticsUpdater
        this.plugin.metricsCollector = new MetricsCollector(this.app, this.plugin, this.plugin.logger);
        this.plugin.tableStatisticsUpdater = new TableStatisticsUpdater(this.plugin.logger);

        // Initialize ScrapeEventEmitter
        this.plugin.scrapeEventEmitter = new ScrapeEventEmitter();
        
        // Setup global backup warning event handlers to ensure they're always available
        this.setupGlobalBackupWarningHandlers();
    }

    /**
     * Initialize UI and interaction managers
     */
    private initializeUIManagers(): void {
        // Initialize CustomDateRangeFilter
        this.plugin.customDateRangeFilter = new CustomDateRangeFilter(
            this.app,
            this.plugin.metricsCollector,
            this.plugin.tableStatisticsUpdater,
            this.plugin.tableManager
        );

        // Initialize ContentToggler and FilterUI
        this.plugin.contentToggler = new ContentToggler(this.plugin.logger);
        this.plugin.filterUI = new FilterUI(
            this.app, 
            this.plugin.settings, 
            this.plugin.saveSettings.bind(this.plugin), 
            this.plugin.logger
        );

        // Initialize EventHandler with all dependencies
        this.plugin.eventHandler = new EventHandler(
            this.app,
            this.plugin.settings,
            this.plugin.contentToggler,
            this.plugin.filterManager,
            this.plugin.filterUI,
            this.plugin.scrapeMetrics.bind(this.plugin),
            this.plugin.showDateNavigator.bind(this.plugin),
            this.plugin.saveSettings.bind(this.plugin),
            this.plugin.logger
        );
    }

    /**
     * Initialize advanced managers that depend on other managers
     */
    private initializeAdvancedManagers(): void {
        // Initialize LintingEngine
        const journalStructure = getJournalStructure(this.plugin.settings);
        this.plugin.lintingEngine = new LintingEngine(
            this.plugin, 
            journalStructure || DEFAULT_JOURNAL_STRUCTURE_SETTINGS
        );

        // Initialize TemplateManager
        this.plugin.templateManager = new TemplateManager(
            this.app,
            this.plugin.settings,
            this.plugin.templaterIntegration,
            this.plugin.logger
        );

        // Initialize FilterPersistenceManager
        this.plugin.filterPersistenceManager = new FilterPersistenceManager(
            this.app,
            this.plugin.settings,
            this.plugin.saveSettings.bind(this.plugin),
            this.plugin.tableManager,
            this.plugin.applyFilterToDropdown.bind(this.plugin),
            this.plugin.logger
        );

        // Initialize DateNavigatorManager
        this.plugin.dateNavigatorManager = new DateNavigatorManager(
            this.app,
            this.plugin,
            this.plugin.state,
            this.plugin.timeFilterManager,
            this.plugin.memoizedTableData,
            this.plugin.logger
        );

        // Initialize LogFileManager
        this.plugin.logFileManager = new LogFileManager(
            this.app,
            this.plugin.logger
        );
    }

    /**
     * Set up global variables and handlers
     */
    private setupGlobalVariables(): void {
        setGlobalLogger(this.plugin.logger);
        setGlobalContentToggler(this.plugin.contentToggler);
    }

    /**
     * Setup global backup warning event handlers to ensure they're always available
     * This fixes the issue where backup warnings hang when no listeners are present
     */
    private setupGlobalBackupWarningHandlers(): void {
        // Set up a fallback handler that only triggers if no other handlers are present
        // We'll use a timeout to check if the event was handled by other listeners
        this.plugin.scrapeEventEmitter.on(SCRAPE_EVENTS.BACKUP_WARNING, (event) => {
            const { message, data } = event;
            
            // Set a timeout to allow other handlers (like HubModal) to handle the event first
            setTimeout(() => {
                // Check if the event was already handled (we can detect this by checking if callbacks were called)
                if (data?.isHandled !== true) {
                    this.plugin.logger?.debug('BackupWarning', 'Global fallback backup warning handler triggered');
                    
                    if (data?.onProceed && data?.onCancel) {
                        // Mark as handled by our global handler
                        data.isHandled = true;
                        this.showGlobalBackupWarning(message, data.onProceed, data.onCancel);
                    } else {
                        this.plugin.logger?.warn('BackupWarning', 'Backup warning event missing proceed/cancel callbacks', { event });
                        // Default to proceeding if callbacks are missing
                        new Notice('Warning: Backup is disabled. Proceeding with update...');
                        if (data?.onProceed) {
                            data.onProceed();
                        }
                    }
                }
            }, 100); // 100ms delay to allow other handlers to process first
        });
        
        this.plugin.logger?.debug('PluginInit', 'Global backup warning event handlers setup complete');
    }

    /**
     * Show global backup warning modal when no other UI is handling it
     */
    private showGlobalBackupWarning(message: string, onProceed: () => void, onCancel: () => void): void {
        // Create a simple confirmation dialog for backup warning
        class BackupWarningModal extends Modal {
            constructor(app: App, private message: string, private onProceed: () => void, private onCancel: () => void) {
                super(app);
            }
            
            onOpen() {
                const { contentEl } = this;
                contentEl.empty();
                
                // Title
                contentEl.createEl('h2', { 
                    text: 'Backup Warning',
                    cls: 'oom-modal-title'
                });
                
                // Message
                contentEl.createEl('p', { 
                    text: this.message,
                    cls: 'oom-modal-message'
                });
                
                // Button container
                const buttonContainer = contentEl.createEl('div', {
                    cls: 'oom-modal-buttons'
                });
                
                // Proceed button
                const proceedBtn = buttonContainer.createEl('button', {
                    text: 'Proceed',
                    cls: 'mod-cta'
                });
                proceedBtn.onclick = () => {
                    this.close();
                    this.onProceed();
                };
                
                // Cancel button
                const cancelBtn = buttonContainer.createEl('button', {
                    text: 'Cancel',
                    cls: 'mod-muted'
                });
                cancelBtn.onclick = () => {
                    this.close();
                    this.onCancel();
                };
                
                // Focus the proceed button by default
                proceedBtn.focus();
            }
        }
        
        const modal = new BackupWarningModal(this.app, message, onProceed, onCancel);
        modal.open();
    }
} 
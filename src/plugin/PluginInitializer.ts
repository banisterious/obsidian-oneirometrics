// Copyright (c) 2025 John Banister
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { App, Notice } from 'obsidian';
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
import { ScrapeEventEmitter } from '../events/ScrapeEvents';

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
} 
/**
 * PluginLoader
 * 
 * Handles the initialization of the OneiroMetrics plugin
 * Extracts the onload logic from main.ts to make it more modular
 */

import { App, FileSystemAdapter, MarkdownView, Plugin } from 'obsidian';
import { LoggingAdapter } from '../logging/LoggingAdapter';
import { DreamMetricsSettings } from '../types/core';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { TimeFilterManager } from '../timeFilters';
import { TemplaterIntegration } from '../journal_check/TemplaterIntegration';
import { DateNavigatorIntegration } from '../dom/date-navigator/DateNavigatorIntegration';
import { LintingEngine } from '../journal_check/LintingEngine';
import { SettingsManager } from '../state/SettingsManager';
import { DateRangeService } from '../dom/filters/date-range/DateRangeService';
import { RibbonManager } from '../dom/RibbonManager';
import { ProjectNoteManager } from '../state/ProjectNoteManager';
import { ModalsManager } from '../dom/modals/ModalsManager';
import { DEFAULT_METRICS, DEFAULT_LOGGING } from '../constants';
import { DEFAULT_JOURNAL_STRUCTURE_SETTINGS } from '../types/journal-check';
import { initializeLogUI } from '../logging/ui';
import { createAndRegisterSettingsAdapter } from '../state/adapters/SettingsAdapter';
import { SERVICE_NAMES, registerService } from '../state/ServiceRegistry';
import { LogLevel } from '../types/logging';
import {
    getProjectNotePath,
    getSelectionMode,
    getSelectedFolder,
    isBackupEnabled,
    getBackupFolderPath,
    shouldShowRibbonButtons,
    getJournalStructure,
    getLogMaxSize
} from '../utils/settings-helpers';
import { ContentToggler } from '../dom/content';
// Import DreamMetricsSettingTab
import { DreamMetricsSettingTab } from '../../settings';

// Import safeLogger directly from the module
import safeLogger from '../logging/safe-logger';

// Import plugin compatibility utilities
import { initializePluginCompatibility } from '../utils/plugin-compatibility';

// Global logger variable (matches main.ts declaration)
let globalLogger: any = safeLogger;

// Create the global ContentToggler variable
(window as any).globalContentToggler = null; // Initialize with null until properly set

// Global instance for content toggling (used by global functions)
declare global {
    var globalContentToggler: ContentToggler;
}

export class PluginLoader {
    constructor(
        private plugin: Plugin,
        private app: App
    ) {}

    /**
     * Initialize the plugin
     * Extracted from the onload method in main.ts
     */
    public async initialize(): Promise<void> {
        await this.initializeLogging();
        await this.cleanupLogs();
        await this.initializeSettingsManager();
        
        // Initialize plugin compatibility early, before other services
        await this.initializePluginCompatibility();
        
        await this.initializeNullServices();
        await this.initializeServiceRegistry();
        await this.initializeComponents();
        await this.registerEventListeners();
        await this.registerCommands();
        await this.setupRibbonIcons();
        
        // Register the settings tab
        this.plugin.addSettingTab(new DreamMetricsSettingTab(this.app, this.plugin as any));
        
        // Set plugin instance for global access (used by filter persistence)
        // Only set if not already defined to avoid overriding the one set in onload
        if (!(window as any).oneiroMetricsPlugin) {
            (window as any).oneiroMetricsPlugin = this.plugin;
            globalLogger?.debug('State', 'Set global plugin instance for filter persistence');
        }
    }

    /**
     * Initialize compatibility with other plugins
     */
    private async initializePluginCompatibility(): Promise<void> {
        try {
            const plugin = this.plugin as any;
            
            safeLogger.debug('DreamMetricsPlugin', 'Initializing plugin compatibility');
            
            // Use our compatibility utility
            await initializePluginCompatibility(this.app, this.plugin, plugin.settings);
            
            safeLogger.debug('DreamMetricsPlugin', 'Plugin compatibility initialized');
        } catch (e) {
            safeLogger.error('DreamMetricsPlugin', 'Error initializing plugin compatibility', 
                e instanceof Error ? e : new Error(String(e)));
        }
    }

    /**
     * Initialize the logging system
     */
    private async initializeLogging(): Promise<void> {
        // Initialize the logging system immediately
        try {
            safeLogger.debug('DreamMetricsPlugin', 'Initializing plugin...');
            globalLogger = safeLogger;
        } catch (e) {
            safeLogger.debug('DreamMetricsPlugin', 'Initializing plugin...');
        }

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
    }

    /**
     * Clean up old log files as we're disabling file logging
     */
    private async cleanupLogs(): Promise<void> {
        try {
            // Check if logs directory exists
            if (this.app.vault.adapter instanceof FileSystemAdapter) {
                const baseFolder = (this.app.vault.adapter as FileSystemAdapter).getBasePath();
                const logsPath = `${baseFolder}/logs`;
                
                safeLogger.info('Plugin', 'Cleaning up old log files from previous versions');
                
                // Check if logs directory exists
                const exists = await this.app.vault.adapter.exists(logsPath);
                if (!exists) {
                    // No logs directory, nothing to clean up
                    return;
                }
                
                try {
                    // List all files in the logs directory
                    const { files } = await this.app.vault.adapter.list(logsPath);
                    
                    // Log what we found
                    safeLogger.debug('Plugin', `Found ${files.length} log files to clean up`);
                    
                    // Delete each log file
                    for (const file of files) {
                        if (file.endsWith('.txt') || file.endsWith('.log') || file.endsWith('.bak')) {
                            try {
                                await this.app.vault.adapter.remove(`${logsPath}/${file}`);
                                safeLogger.debug('Plugin', `Removed old log file: ${file}`);
                            } catch (removeError) {
                                safeLogger.warn('Plugin', `Could not remove log file: ${file}`);
                            }
                        }
                    }
                    
                    // Try to remove the logs directory
                    try {
                        // Only remove if it's empty
                        const { files: remainingFiles } = await this.app.vault.adapter.list(logsPath);
                        if (remainingFiles.length === 0) {
                            await this.app.vault.adapter.rmdir(logsPath, false);
                            safeLogger.info('Plugin', 'Removed empty logs directory');
                        } else {
                            safeLogger.info('Plugin', `Logs directory not empty (${remainingFiles.length} files), skipping removal`);
                        }
                    } catch (rmdirError) {
                        safeLogger.warn('Plugin', 'Could not remove logs directory');
                    }
                } catch (error) {
                    safeLogger.warn('Plugin', 'Error cleaning up log files');
                }
            }
        } catch (e) {
            safeLogger.warn('Plugin', 'Error in cleanupLogs');
        }
    }

    /**
     * Initialize null services for defensive coding
     */
    private async initializeNullServices(): Promise<void> {
        try {
            safeLogger.debug('DreamMetricsPlugin', 'Initializing null services');
            
            // Import and initialize null services
            try {
                const module = await import('../state/NullServiceRegistrations');
                module.initializeNullServices();
                safeLogger.debug('DreamMetricsPlugin', 'Null services initialized successfully');
            } catch (error) {
                safeLogger.error('DreamMetricsPlugin', 'Failed to initialize null services', error);
            }
        } catch (e) {
            safeLogger.error('DreamMetricsPlugin', 'Error initializing null services', 
                e instanceof Error ? e : new Error(String(e)));
        }
    }

    /**
     * Initialize the settings manager
     */
    private async initializeSettingsManager(): Promise<void> {
        // Access the plugin's settingsManager property
        const plugin = this.plugin as any;
        
        // Initialize settings manager first
        plugin.settingsManager = new SettingsManager(this.plugin);
        await plugin.settingsManager.loadSettings();
        plugin.settings = plugin.settingsManager.settings;
        plugin.expandedStates = plugin.settingsManager.expandedStates;
        plugin.loadedSettings = plugin.settingsManager.loadedSettings;
    }

    /**
     * Initialize the service registry
     */
    private async initializeServiceRegistry(): Promise<void> {
        const plugin = this.plugin as any;
        const settings: DreamMetricsSettings = plugin.settings;

        try {
            safeLogger.debug('DreamMetricsPlugin', 'Initializing Service Registry');
            
            // Log metrics status
            safeLogger.debug('Settings', 'Settings metrics status before registry init', { 
                metricsCount: settings.metrics ? Object.keys(settings.metrics).length : 0,
                metricsAvailable: settings.metrics ? true : false
            });
            
            // Make sure metrics object exists and is initialized
            if (!settings.metrics) {
                settings.metrics = {};
                safeLogger.info('Settings', 'Created empty metrics object');
            }
            
            // Verify each required metric exists
            const requiredMetrics = [
                "Sensory Detail", "Emotional Recall", "Lost Segments", "Descriptiveness", 
                "Confidence Score", "Character Roles", "Characters Count", "Familiar Count", 
                "Unfamiliar Count", "Characters List", "Dream Theme", "Character Clarity/Familiarity", "Lucidity Level", 
                "Dream Coherence", "Environmental Familiarity", "Ease of Recall", "Recall Stability"
            ];
            
            // Check which metrics are missing
            const missingMetrics = requiredMetrics.filter(
                metricName => !settings.metrics[metricName]
            );
            
            safeLogger.debug('Settings', 'Missing metrics before initialization', { 
                missingCount: missingMetrics.length,
                missingMetrics: missingMetrics.length ? missingMetrics.join(', ') : 'None'
            });
            
            // Add any missing metrics from DEFAULT_METRICS
            let metricAdded = false;
            DEFAULT_METRICS.forEach(metric => {
                if (!settings.metrics[metric.name]) {
                    settings.metrics[metric.name] = {
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
                    metricAdded = true;
                    safeLogger.info('Settings', `Added missing metric during init: ${metric.name}`);
                }
            });
            
            // Save settings if any metrics were added
            if (metricAdded) {
                safeLogger.info('Settings', 'Saving settings with newly added metrics');
                await plugin.saveSettings();
            }
            
            // Create and register the settings adapter
            const settingsAdapter = createAndRegisterSettingsAdapter(settings, this.app);
            
            // Always register a basic logger to ensure something is available early
            // This prevents "Service not found: logger" warnings
            registerService(SERVICE_NAMES.LOGGER, safeLogger);
            
            // Log final metrics status
            safeLogger.debug('Settings', 'Final metrics in registry', { 
                metrics: Object.keys(settings.metrics).join(', ')
            });
            
            safeLogger.debug('DreamMetricsPlugin', 'Service Registry initialized with settings and logger');
        } catch (e) {
            safeLogger.error('DreamMetricsPlugin', 'Error initializing Service Registry', e instanceof Error ? e : new Error(String(e)));
        }

        // Initialize the logger with settings from the registry
        try {
            // Create and configure the logger
            const logger = new LoggingAdapter(this.app);
            
            // Use the correct configure method signature
            if (settings.logging) {
                logger.configure(
                    settings.logging.level,
                    settings.logging.maxSize || settings.logging.maxLogSize,
                    settings.logging.maxBackups
                );
            } else {
                logger.configure(
                    DEFAULT_LOGGING.level,
                    DEFAULT_LOGGING.maxSize,
                    DEFAULT_LOGGING.maxBackups
                );
            }
            
            // Update the global logger with the configured instance
            globalLogger = logger;
            plugin.logger = logger;
            
            // Update the logger in the registry with the fully configured version
            registerService(SERVICE_NAMES.LOGGER, logger);
            globalLogger.debug('DreamMetricsPlugin', 'Logger initialized and registered with registry');
            
            // Initialize the log viewer UI
            initializeLogUI(this.plugin);
        } catch (e) {
            safeLogger.error('DreamMetricsPlugin', 'Error initializing logger', 
                e instanceof Error ? e : new Error(String(e)));
        }
    }

    /**
     * Initialize plugin components
     */
    private async initializeComponents(): Promise<void> {
        const plugin = this.plugin as any;
        const settings: DreamMetricsSettings = plugin.settings;
        
        // Initialize mutable state and app state
        plugin.state = new DreamMetricsState();
        
        // Use safe logger for early logging before the main logger is initialized
        safeLogger.info('Plugin', 'Loading Dream Metrics plugin');
        safeLogger.debug('Plugin', 'Plugin onload called - will setup filter persistence');
        
        // Create proper settings object for DreamMetricsState
        const stateSettings = {
            projectNote: getProjectNotePath(settings),
            selectedNotes: settings.selectedNotes || [],
            selectedFolder: getSelectedFolder(settings),
            selectionMode: getSelectionMode(settings),
            calloutName: settings.calloutName || 'dream',
            metrics: settings.metrics || {},
            showRibbonButtons: shouldShowRibbonButtons(settings),
            backupEnabled: isBackupEnabled(settings),
            backupFolderPath: getBackupFolderPath(settings),
            logging: {
                level: settings.logging?.level || 'info'
            }
        };
        
        // Initialize state management with proper constructor parameters
        plugin.state = new DreamMetricsState(stateSettings);
        
        // Initialize the time filter manager with proper parameters
        plugin.timeFilterManager = new TimeFilterManager();
        
        // TimeFilterManager is already registered in onload, no need to register again here
        // registerService(SERVICE_NAMES.TIME_FILTER, this.timeFilterManager);
        
        // Create proper settings object for TemplaterIntegration
        const templaterSettings = {
            enabled: true,
            templateFolder: settings.journalStructure?.templaterIntegration?.folderPath || 'templates/dreams',
            defaultTemplate: settings.journalStructure?.templaterIntegration?.defaultTemplate || ''
        };
        
        // Use type-safe property access for integration components
        plugin.templaterIntegration = new TemplaterIntegration(
            this.app,
            this.plugin,
            templaterSettings
        );
        
        // Use proper constructor parameters for DateNavigatorIntegration
        plugin.dateNavigator = new DateNavigatorIntegration(
            this.app,
            this.plugin
        );
        
        // Initialize the linting engine with safe property access
        const journalStructure = getJournalStructure(settings);
        plugin.lintingEngine = new LintingEngine(this.plugin as any, journalStructure || DEFAULT_JOURNAL_STRUCTURE_SETTINGS);
        
        // Initialize date navigator for reuse
        plugin.dateNavigatorIntegration = new DateNavigatorIntegration(this.app, this.plugin as any);
        
        // Initialize the DateRangeService
        plugin.dateRangeService = new DateRangeService(this.app);
        
        // Initialize the ProjectNoteManager
        plugin.projectNoteManager = new ProjectNoteManager(this.app, settings, plugin.logger);
        
        // Initialize the RibbonManager
        plugin.ribbonManager = new RibbonManager(this.app, settings, this.plugin as any, plugin.logger);
        
        // Initialize the ContentToggler
        const contentToggler = new ContentToggler(plugin.logger);
        globalContentToggler = contentToggler;  // Set the global instance for legacy code
        plugin.contentToggler = contentToggler; // Store on the plugin instance
    }

    /**
     * Register event listeners for the plugin
     */
    private async registerEventListeners(): Promise<void> {
        const plugin = this.plugin as any;
        const settings: DreamMetricsSettings = plugin.settings;

        // Register event listeners for when the active leaf changes
        plugin.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                safeLogger.debug('Events', 'Active leaf changed, checking for metrics note view');
                // Delay to ensure content is rendered
                setTimeout(() => {
                    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                    if (view && view.getMode() === 'preview') {
                        const file = view.file;
                        if (file && file.path === getProjectNotePath(settings)) {
                            safeLogger.debug('Events', 'Metrics note view detected, updating project note view');
                            // Call updateProjectNoteView which properly sets up event handlers
                            if (typeof plugin.updateProjectNoteView === 'function') {
                                plugin.updateProjectNoteView();
                            } else {
                                // Fallback to direct event listener attachment
                                plugin.attachProjectNoteEventListeners();
                            }
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
                
                // Apply initial filters if available
                plugin.applyInitialFilters();
                
                // Also check if metrics note is already open and set up event handlers
                setTimeout(() => {
                    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                    if (activeView && activeView.getMode() === 'preview') {
                        const file = activeView.file;
                        if (file && file.path === getProjectNotePath(settings)) {
                            safeLogger.debug('Events', 'Metrics note already open on startup, updating project note view');
                            if (typeof plugin.updateProjectNoteView === 'function') {
                                plugin.updateProjectNoteView();
                            }
                        }
                    }
                }, 1000);
            } catch (error) {
                if (globalLogger) {
                    globalLogger.error('Filter', 'Failed to apply initial filters', error instanceof Error ? error : new Error(String(error)));
                }
            }
        });
    }

    /**
     * Register plugin commands
     * This is a stub method that will need to be expanded to include all commands
     */
    private async registerCommands(): Promise<void> {
        // This is just a stub - would need to implement all the commands from main.ts
        const plugin = this.plugin as any;
        
        // Example of registering a command
        plugin.addCommand({
            id: 'show-metrics',
            name: 'Show Metrics',
            callback: () => {
                plugin.showMetrics();
            }
        });
        
        // Add Journal Structure modal command
        plugin.addCommand({
            id: 'open-journal-structure',
            name: 'Open Journal Structure Settings',
            callback: () => {
                // Open OneiroMetrics Hub instead (Journal Structure functionality has been migrated)
                const modalsManager = new ModalsManager(plugin.app, plugin, plugin.logger);
                modalsManager.openMetricsTabsModal();
            }
        });
        
        // Add more commands as needed
    }

    /**
     * Setup ribbon icons
     */
    private async setupRibbonIcons(): Promise<void> {
        const plugin = this.plugin as any;
        
        // Wait for Obsidian layout to be ready before adding ribbon icons
        // This ensures our button appears after other plugins have loaded
        this.app.workspace.onLayoutReady(() => {
            // Initialize ribbon icons if the RibbonManager exists
            if (plugin.ribbonManager) {
                plugin.ribbonManager.updateRibbonIcons();
            }
        });
        
        // Remove debug ribbon - no longer needed in production
        // plugin.addCalendarDebugRibbon();
    }
} 
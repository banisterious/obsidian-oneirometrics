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
import { DreamJournalManager } from '../journal_check/ui/DreamJournalManager';
import { SettingsManager } from '../state/SettingsManager';
import { DateRangeService } from '../dom/filters/date-range/DateRangeService';
import { RibbonManager } from '../dom/RibbonManager';
import { ProjectNoteManager } from '../state/ProjectNoteManager';
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
        await this.initializeNullServices();
        await this.initializeSettingsManager();
        await this.initializeServiceRegistry();
        await this.initializeComponents();
        await this.registerEventListeners();
        await this.registerCommands();
        await this.setupRibbonIcons();
        
        // Register the settings tab
        this.plugin.addSettingTab(new DreamMetricsSettingTab(this.app, this.plugin as any));
        
        // Set plugin instance for global access (used by filter persistence)
        (window as any).oneiroMetricsPlugin = this.plugin;
        globalLogger?.debug('State', 'Set global plugin instance for filter persistence');
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
        
        // Initialize UI components
        plugin.dreamJournalManager = new DreamJournalManager(this.app, this.plugin as any);
        
        // Initialize date navigator for reuse
        plugin.dateNavigatorIntegration = new DateNavigatorIntegration(this.app, this.plugin as any);
        
        // Initialize the DateRangeService
        plugin.dateRangeService = new DateRangeService(this.app);
        
        // Initialize the ProjectNoteManager
        plugin.projectNoteManager = new ProjectNoteManager(this.app, settings, plugin.logger);
        
        // Initialize the RibbonManager
        plugin.ribbonManager = new RibbonManager(this.app, settings, this.plugin, plugin.logger);
        
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
                            safeLogger.debug('Events', 'Metrics note view detected, attaching event listeners');
                            plugin.attachProjectNoteEventListeners();
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
        
        // Add more commands as needed
    }

    /**
     * Setup ribbon icons
     */
    private async setupRibbonIcons(): Promise<void> {
        const plugin = this.plugin as any;
        
        // Initialize ribbon icons if the RibbonManager exists
        if (plugin.ribbonManager) {
            plugin.ribbonManager.updateRibbonIcons();
        }
        
        // Remove debug ribbon - no longer needed in production
        // plugin.addCalendarDebugRibbon();
    }
} 
/**
 * SettingsManager.ts
 * 
 * Centralized manager for plugin settings that handles loading, saving, and accessing settings.
 * This class encapsulates all settings-related functionality that was previously in main.ts.
 */

import { Plugin } from 'obsidian';
import { DreamMetricsSettings } from '../../types';
import { DEFAULT_METRICS } from '../constants';
import { LogLevel } from '../types/logging';
import { SettingsAdapter } from './adapters/SettingsAdapter';
import safeLogger from '../logging/safe-logger';

// Import global functions
declare let customDateRange: { start: string, end: string } | null;

/**
 * SettingsManager centralizes all settings operations for the plugin
 * It implements the unified interface plan from the typescript-unified-interface-plan.md document
 */
export class SettingsManager {
    // Store the core settings object
    private _settings: DreamMetricsSettings;
    
    // Track whether settings have been loaded
    private _loadedSettings: boolean = false;
    
    // Store expanded states for content sections
    private _expandedStates: Set<string> = new Set();
    
    // Reference to the plugin instance
    private plugin: Plugin;
    
    /**
     * Create a new SettingsManager
     * @param plugin Reference to the plugin instance
     */
    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this._settings = {} as DreamMetricsSettings;
        this._expandedStates = new Set();
    }
    
    /**
     * Get the current settings
     */
    get settings(): DreamMetricsSettings {
        return this._settings;
    }
    
    /**
     * Get whether settings have been loaded
     */
    get loadedSettings(): boolean {
        return this._loadedSettings;
    }
    
    /**
     * Get the expanded states for content sections
     */
    get expandedStates(): Set<string> {
        return this._expandedStates;
    }
    
    /**
     * Load settings from storage
     */
    async loadSettings(): Promise<void> {
        try {
            // Load data from storage
            const data = await this.plugin.loadData();
            
            // DEBUG: Log loaded data
            safeLogger.debug('SettingsManager', 'loadSettings() - Raw data loaded', {
                hasUnifiedMetrics: !!data?.unifiedMetrics,
                unifiedMetrics: data?.unifiedMetrics
            });
            
            // Apply adapter to ensure all properties exist with correct types
            const settingsAdapter = new SettingsAdapter(data || {});
            this._settings = settingsAdapter.toCoreSettings();
            this._loadedSettings = true;
            
            // DEBUG: Log after adapter processing
            safeLogger.debug('SettingsManager', 'loadSettings() - After adapter processing', {
                hasUnifiedMetrics: !!this._settings.unifiedMetrics,
                unifiedMetrics: this._settings.unifiedMetrics
            });
            
            // Initialize expanded states from settings
            this.initializeExpandedStates();
            
            // Validate filter settings
            this.validateFilterSettings();
            
            // Ensure all default metrics exist
            this.ensureDefaultMetrics();
            
            // Automatically migrate to unified metrics if needed
            await this.ensureUnifiedMetricsConfig();
            
            // DEBUG: Log after migration
            safeLogger.debug('SettingsManager', 'loadSettings() - After migration', {
                hasUnifiedMetrics: !!this._settings.unifiedMetrics,
                unifiedMetrics: this._settings.unifiedMetrics
            });
            
            // Log successful loading
            safeLogger.log('Settings', 'Settings loaded successfully');
        } catch (error) {
            safeLogger.error('Settings', 'Error loading settings', error instanceof Error ? error : new Error(String(error)));
            
            // Initialize with default settings
            this._settings = new SettingsAdapter({}).toCoreSettings();
            this._loadedSettings = false;
        }
    }
    
    /**
     * Save settings to storage
     */
    async saveSettings(): Promise<void> {
        try {
            // DEBUG: Log unified metrics before saving
            safeLogger.debug('SettingsManager', 'saveSettings() - Before save', {
                unifiedMetrics: this._settings.unifiedMetrics
            });
            
            // Save expandedStates from set to settings object
            this.saveExpandedStates();
            
            // Save settings to storage
            await this.plugin.saveData(this._settings);
            
            // DEBUG: Log after saving
            safeLogger.debug('SettingsManager', 'saveSettings() - After save completed');
            
            // Log successful saving
            safeLogger.log('Settings', 'Settings saved successfully');
        } catch (error) {
            safeLogger.error('Settings', 'Error saving settings', error instanceof Error ? error : new Error(String(error)));
        }
    }
    
    /**
     * Update a specific setting value
     * @param key The setting key to update
     * @param value The new value
     */
    updateSetting<K extends keyof DreamMetricsSettings>(
        key: K, 
        value: DreamMetricsSettings[K]
    ): void {
        this._settings[key] = value;
    }
    
    /**
     * Update log configuration
     * @param level Log level
     * @param maxSize Maximum log file size
     * @param maxBackups Maximum number of log backups
     */
    updateLogConfig(level: LogLevel, maxSize: number, maxBackups: number): void {
        if (!this._settings.logging) {
            this._settings.logging = {
                level: level,
                maxSize: maxSize,
                maxBackups: maxBackups
            };
        } else {
            this._settings.logging.level = level;
            this._settings.logging.maxSize = maxSize;
            this._settings.logging.maxBackups = maxBackups;
        }
    }
    
    /**
     * Set an expanded state for a content section
     * @param id Content section ID
     * @param expanded Whether the section is expanded
     */
    setExpandedState(id: string, expanded: boolean): void {
        if (expanded) {
            this._expandedStates.add(id);
        } else {
            this._expandedStates.delete(id);
        }
    }
    
    /**
     * Initialize expanded states from settings
     */
    private initializeExpandedStates(): void {
        this._expandedStates = new Set();
        
        if (this._settings.expandedStates) {
            for (const [id, expanded] of Object.entries(this._settings.expandedStates)) {
                if (expanded) {
                    this._expandedStates.add(id);
                }
            }
        }
    }
    
    /**
     * Save expanded states from set to settings object
     */
    private saveExpandedStates(): void {
        if (this._expandedStates) {
            // Create a new object for expanded states
            const expandedStatesObj: Record<string, boolean> = {};
            
            // Add all expanded states from the set
            this._expandedStates.forEach(id => {
                expandedStatesObj[id] = true;
            });
            
            // Update the settings object
            this._settings.expandedStates = expandedStatesObj;
        }
    }
    
    /**
     * Validate filter settings and set defaults if needed
     */
    private validateFilterSettings(): void {
        try {
            const validFilters = ['all', 'today', 'yesterday', 'thisWeek', 'thisMonth', 'last30', 
                                 'last6months', 'thisYear', 'last12months', 'custom'];
            
            // Check if filter is valid
            if (!this._settings.lastAppliedFilter || 
                typeof this._settings.lastAppliedFilter !== 'string' ||
                !validFilters.includes(this._settings.lastAppliedFilter)) {
                
                // Try to recover from localStorage
                const savedFilter = localStorage.getItem('oom-last-applied-filter');
                if (savedFilter && validFilters.includes(savedFilter)) {
                    safeLogger.log('Settings', `Recovered filter from localStorage: ${savedFilter}`);
                    this._settings.lastAppliedFilter = savedFilter;
                } else {
                    // Default to 'all' if no valid filter found
                    this._settings.lastAppliedFilter = 'all';
                    safeLogger.log('Settings', 'Set default filter: all');
                }
            }
            
            // Check custom date range if filter is 'custom'
            if (this._settings.lastAppliedFilter === 'custom') {
                if (!this._settings.customDateRange || 
                    !this._settings.customDateRange.start || 
                    !this._settings.customDateRange.end) {
                    
                    // Try to recover from localStorage
                    try {
                        const savedRangeStr = localStorage.getItem('oom-custom-date-range');
                        if (savedRangeStr) {
                            const savedRange = JSON.parse(savedRangeStr);
                            if (savedRange && savedRange.start && savedRange.end) {
                                this._settings.customDateRange = savedRange;
                                safeLogger.log('Settings', 'Recovered custom date range from localStorage', savedRange);
                                
                                // Ensure global customDateRange variable is synchronized
                                if (typeof window !== 'undefined') {
                                    (window as any).customDateRange = { ...savedRange };
                                }
                            } else {
                                // If invalid custom range, switch to 'all'
                                this._settings.lastAppliedFilter = 'all';
                                this._settings.customDateRange = undefined;
                                
                                // Clear global customDateRange
                                if (typeof window !== 'undefined') {
                                    (window as any).customDateRange = null;
                                }
                            }
                        } else {
                            // If no custom range, switch to 'all'
                            this._settings.lastAppliedFilter = 'all';
                        }
                    } catch (e) {
                        safeLogger.error('Settings', 'Error parsing custom date range from localStorage', 
                            e instanceof Error ? e : new Error(String(e)));
                        // Default to 'all' if error parsing custom range
                        this._settings.lastAppliedFilter = 'all';
                    }
                }
            }
        } catch (e) {
            safeLogger.error('Settings', 'Error validating filter settings', 
                e instanceof Error ? e : new Error(String(e)));
            // Set safe defaults
            this._settings.lastAppliedFilter = 'all';
        }
    }
    
    /**
     * Ensure all default metrics exist in settings
     */
    private ensureDefaultMetrics(): void {
        if (!this._settings.metrics || Object.keys(this._settings.metrics).length === 0) {
            this._settings.metrics = {};
            
            // Add all default metrics
            DEFAULT_METRICS.forEach(metric => {
                this._settings.metrics[metric.name] = {
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
                    // Include legacy properties for compatibility
                    min: metric.minValue,
                    max: metric.maxValue,
                    step: 1
                };
            });
        } else {
            // Check if any default metrics are missing
            DEFAULT_METRICS.forEach(defaultMetric => {
                if (!this._settings.metrics[defaultMetric.name]) {
                    // Add the missing metric
                    this._settings.metrics[defaultMetric.name] = {
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
                        // Include legacy properties for compatibility
                        min: defaultMetric.minValue,
                        max: defaultMetric.maxValue,
                        step: 1
                    };
                }
            });
        }
    }

    /**
     * Ensure unified metrics configuration exists and migrate if necessary
     */
    private async ensureUnifiedMetricsConfig(): Promise<void> {
        try {
            // Import migration utilities
            const { migrateToUnifiedMetrics, hasUnifiedMetricsConfig } = await import('../utils/settings-migration');
            
            // Check if migration is needed
            if (!hasUnifiedMetricsConfig(this._settings)) {
                safeLogger.log('Settings', 'Unified metrics config not found, performing automatic migration');
                
                // Perform migration
                const migrationResult = migrateToUnifiedMetrics(this._settings);
                
                if (migrationResult.migrated) {
                    safeLogger.log('Settings', 'Automatic unified metrics migration completed successfully');
                    
                    // Save the migrated settings immediately
                    await this.saveSettings();
                    
                    if (migrationResult.warnings && migrationResult.warnings.length > 0) {
                        safeLogger.warn('Settings', 'Migration completed with warnings', { warnings: migrationResult.warnings });
                    }
                } else {
                    safeLogger.debug('Settings', 'No migration needed for unified metrics');
                }
            } else {
                safeLogger.debug('Settings', 'Unified metrics configuration already exists');
            }
        } catch (error) {
            safeLogger.error('Settings', 'Error ensuring unified metrics configuration', error instanceof Error ? error : new Error(String(error)));
        }
    }
} 
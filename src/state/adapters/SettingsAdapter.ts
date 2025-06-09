/**
 * SettingsAdapter Class
 * 
 * This class handles adapting between different settings formats and ensures
 * backward compatibility while providing a clean API for accessing settings.
 */

import { DreamMetricsSettings } from '../../types/core';
import { LogLevel } from '../../types/logging';
import { App } from 'obsidian';
import safeLogger from '../../logging/safe-logger';
import { registerService, SERVICE_NAMES } from '../ServiceRegistry';
import { debug, error } from '../../logging';
import { DateHandlingConfig } from '../../types/core';

/**
 * Adapter for converting between different settings formats and ensuring
 * all required properties are present with appropriate default values.
 */
export class SettingsAdapter {
  private _legacySettings: any = {};
  private settings: DreamMetricsSettings;
  private app: App | null;

  /**
   * Creates a new settings adapter
   * @param settings The initial settings to adapt (legacy or partial format)
   * @param app The Obsidian app instance (optional)
   */
  constructor(settings: any = {}, app?: App) {
    this._legacySettings = settings;
    this.settings = this.toCoreSettings();
    this.app = app || null;
    
    try {
      safeLogger.debug('SettingsAdapter', 'Settings adapter created');
    } catch (err) {
      debug('SettingsAdapter', 'Settings adapter created');
    }
  }

  /**
   * Creates a SettingsAdapter instance from a settings object
   * @param settings The settings object to adapt
   * @param app The Obsidian app instance (optional)
   * @returns A new SettingsAdapter instance
   */
  static fromSettings(settings: any = {}, app?: App): SettingsAdapter {
    return new SettingsAdapter(settings, app);
  }

  /**
   * Adapts legacy settings to the core settings format by filling in
   * missing properties with default values
   * @returns Complete settings object with all required properties
   */
  toCoreSettings(): DreamMetricsSettings {
    const settings = this._legacySettings;
    
    // Create a base settings object with defaults
    const adaptedSettings: DreamMetricsSettings = {
      // Set defaults for required properties that might be missing
      projectNote: settings.projectNote || settings.projectNotePath || '',
      metrics: settings.metrics || {},
      selectedNotes: settings.selectedNotes || [],
      selectedFolder: settings.selectedFolder || '',
      selectionMode: settings.selectionMode || 'notes',
      calloutName: settings.calloutName || 'dream',
      journalCalloutName: settings.journalCalloutName || 'journal',
      dreamDiaryCalloutName: settings.dreamDiaryCalloutName || 'dream-diary',
      
      // Add exclusion settings with proper defaults
      excludedNotes: settings.excludedNotes || [],
      excludedSubfolders: settings.excludedSubfolders || [],
      
      // Preserve unifiedMetrics if it exists
      unifiedMetrics: settings.unifiedMetrics,
      
      dateHandling: this.getDateHandlingConfig(settings),
      singleLineMetrics: settings.singleLineMetrics ?? false,
      showRibbonButtons: settings.showRibbonButtons !== undefined ? settings.showRibbonButtons : (!!settings.showTestRibbonButton || false),
      backupEnabled: settings.backup?.enabled ?? settings.backupEnabled ?? false,
      backupFolderPath: settings.backup?.folderPath ?? settings.backupFolderPath ?? './backups',
      
      // Ensure logging has the correct structure
      logging: {
        level: this.getLogLevel(settings),
        maxSize: settings.logging?.maxSize || settings.logging?.maxLogSize || 1024 * 1024, // 1MB default
        maxBackups: settings.logging?.maxBackups || 3,
      },
      
      // Test data settings
      testDataFolder: settings.testDataFolder || 'Test Data/Dreams',
      testDataTemplate: settings.testDataTemplate || '',
      
      // Performance testing settings
      performanceTesting: {
        enabled: settings.performanceTesting?.enabled ?? false,
        maxFiles: settings.performanceTesting?.maxFiles ?? 0, // 0 = unlimited
        showWarnings: settings.performanceTesting?.showWarnings ?? true
      }
    };
    
    // Handle optional properties with explicit type checking
    this.applyExpandedStates(adaptedSettings, settings);
    this.applyJournalStructure(adaptedSettings, settings);
    this.applyUIState(adaptedSettings, settings);
    this.applyDeveloperMode(adaptedSettings, settings);
    this.applyMetricsVersion(adaptedSettings, settings);
    this.applyBackupSettings(adaptedSettings, settings);
    
    // Preserve legacy properties for backward compatibility
    adaptedSettings.projectNotePath = settings.projectNotePath || settings.projectNote || '';
    adaptedSettings.showTestRibbonButton = settings.showTestRibbonButton || settings.showRibbonButtons || false;
    
    return adaptedSettings;
  }

  /**
   * Gets a properly typed log level from settings
   * @param settings The settings object
   * @returns Valid log level
   */
  private getLogLevel(settings: any): LogLevel {
    const level = settings.logging?.level || 'off';
    if (this.isValidLogLevel(level)) {
      return level;
    }
    return 'off';
  }

  /**
   * Checks if a string is a valid log level
   * @param level The level to check
   * @returns Whether the level is valid
   */
  private isValidLogLevel(level: string): level is LogLevel {
    return ['off', 'error', 'warn', 'info', 'debug', 'trace'].includes(level);
  }

  /**
   * Gets date handling configuration from settings, migrating from legacy boolean if needed
   * @param settings The settings object
   * @returns DateHandlingConfig object
   */
  private getDateHandlingConfig(settings: any): DateHandlingConfig {
    // If new dateHandling config exists, use it
    if (settings.dateHandling) {
      return {
        placement: settings.dateHandling.placement || 'field',
        headerFormat: settings.dateHandling.headerFormat || 'MMMM d, yyyy',
        fieldFormat: settings.dateHandling.fieldFormat || 'Date:',
        includeBlockReferences: settings.dateHandling.includeBlockReferences ?? false,
        blockReferenceFormat: settings.dateHandling.blockReferenceFormat || '^YYYYMMDD'
      };
    }
    
    // Migration from legacy includeDateFields boolean
    if (settings.includeDateFields !== undefined) {
      return {
        placement: settings.includeDateFields ? 'field' : 'none',
        headerFormat: 'MMMM d, yyyy',
        fieldFormat: 'Date:',
        includeBlockReferences: false,
        blockReferenceFormat: '^YYYYMMDD'
      };
    }
    
    // Default configuration (maintains backward compatibility)
    return {
      placement: 'field',
      headerFormat: 'MMMM d, yyyy',
      fieldFormat: 'Date:',
      includeBlockReferences: false,
      blockReferenceFormat: '^YYYYMMDD'
    };
  }

  /**
   * Applies expanded states to settings if they exist
   * @param adaptedSettings The target settings object
   * @param settings The source settings object
   */
  private applyExpandedStates(adaptedSettings: DreamMetricsSettings, settings: any): void {
    if (settings.expandedStates) {
      adaptedSettings.expandedStates = {...settings.expandedStates};
    }
  }

  /**
   * Applies journal structure settings from either journalStructure or linting
   * @param adaptedSettings The target settings object
   * @param settings The source settings object
   */
  private applyJournalStructure(adaptedSettings: DreamMetricsSettings, settings: any): void {
    if (settings.journalStructure) {
      // Deep copy to avoid reference issues
      adaptedSettings.journalStructure = JSON.parse(JSON.stringify(settings.journalStructure));
      
      // If linting is also provided, preserve it
      if (settings.linting) {
        adaptedSettings.linting = JSON.parse(JSON.stringify(settings.linting));
      }
    } else if (settings.linting) {
      // Use linting as journal structure if journalStructure not available
      adaptedSettings.journalStructure = JSON.parse(JSON.stringify(settings.linting));
      adaptedSettings.linting = JSON.parse(JSON.stringify(settings.linting));
    }
  }

  /**
   * Applies UI state settings if they exist
   * @param adaptedSettings The target settings object
   * @param settings The source settings object
   */
  private applyUIState(adaptedSettings: DreamMetricsSettings, settings: any): void {
    if (settings.uiState) {
      adaptedSettings.uiState = {
        activeTab: settings.uiState.activeTab || settings.uiState.lastTab || 'general',
        lastFilter: settings.uiState.lastFilter || 'all',
        customRanges: settings.uiState.customRanges || {},
        layout: settings.uiState.layout || {}
      };
    }
  }

  /**
   * Applies developer mode settings if they exist
   * @param adaptedSettings The target settings object
   * @param settings The source settings object
   */
  private applyDeveloperMode(adaptedSettings: DreamMetricsSettings, settings: any): void {
    if (settings.developerMode) {
      adaptedSettings.developerMode = {
        enabled: settings.developerMode.enabled || false,
        showDebugRibbon: settings.developerMode.showDebugRibbon || settings.developerMode.showDebugInfo || false,
        traceFunctionCalls: settings.developerMode.traceFunctionCalls || settings.developerMode.performanceMonitoring || false,
        experimentalFeatures: settings.developerMode.experimentalFeatures || []
      };
    }
  }

  /**
   * Applies metrics version if it exists
   * @param adaptedSettings The target settings object
   * @param settings The source settings object
   */
  private applyMetricsVersion(adaptedSettings: DreamMetricsSettings, settings: any): void {
    if (settings.metricsVersion) {
      adaptedSettings.metricsVersion = settings.metricsVersion;
    }
  }

  /**
   * Applies backup settings structure
   * @param adaptedSettings The target settings object
   * @param settings The source settings object
   */
  private applyBackupSettings(adaptedSettings: DreamMetricsSettings, settings: any): void {
    if (settings.backup) {
      // Create the backup object with backup.* properties taking precedence
      adaptedSettings.backup = {
        enabled: settings.backup.enabled ?? settings.backupEnabled ?? false,
        folderPath: settings.backup.folderPath ?? settings.backupFolderPath ?? './backups',
        maxBackups: settings.backup.maxBackups || 5,
        frequency: settings.backup.frequency as any || 'onSave'
      };
      
      // Update the main settings properties to match the backup object for consistency
      adaptedSettings.backupEnabled = adaptedSettings.backup.enabled;
      adaptedSettings.backupFolderPath = adaptedSettings.backup.folderPath;
    } else if (settings.backupEnabled !== undefined || settings.backupFolderPath !== undefined) {
      // No backup object, but we have legacy properties
      adaptedSettings.backup = {
        enabled: settings.backupEnabled ?? false,
        folderPath: settings.backupFolderPath ?? './backups',
        maxBackups: 5,
        frequency: 'onSave'
      };
      
      // Ensure consistency
      adaptedSettings.backupEnabled = adaptedSettings.backup.enabled;
      adaptedSettings.backupFolderPath = adaptedSettings.backup.folderPath;
    }
  }
  
  /**
   * Gets a specific property value from settings with fallbacks
   * @param propertyName The property name to get
   * @param defaultValue Optional default value if property doesn't exist
   * @returns The property value or default
   */
  getProperty<T>(propertyName: string, defaultValue?: T): T {
    const coreSettings = this.toCoreSettings();
    
    // Access the property dynamically
    return (coreSettings as any)[propertyName] ?? defaultValue;
  }
  
  /**
   * Gets the project note path with appropriate fallbacks
   * @returns The project note path
   */
  getProjectNotePath(): string {
    return this._legacySettings.projectNote || this._legacySettings.projectNotePath || '';
  }
  
  /**
   * Gets the selection mode with appropriate fallbacks
   * @returns The selection mode
   */
  getSelectionMode(): string {
    return this._legacySettings.selectionMode || 'notes';
  }
  
  /**
   * Gets the selected folder with appropriate fallbacks
   * @returns The selected folder
   */
  getSelectedFolder(): string {
    return this._legacySettings.selectedFolder || '';
  }
  
  /**
   * Checks if ribbon buttons should be shown
   * @returns Whether ribbon buttons should be shown
   */
  shouldShowRibbonButtons(): boolean {
    return this._legacySettings.showRibbonButtons || !!this._legacySettings.showTestRibbonButton || false;
  }
  
  /**
   * Checks if backups are enabled
   * @returns Whether backups are enabled
   */
  isBackupEnabled(): boolean {
    return this._legacySettings.backupEnabled || this._legacySettings.backup?.enabled || false;
  }
  
  /**
   * Gets the backup folder path with appropriate fallbacks
   * @returns The backup folder path
   */
  getBackupFolderPath(): string {
    return this._legacySettings.backupFolderPath || this._legacySettings.backup?.folderPath || './backups';
  }
  
  /**
   * Gets the expanded states with appropriate fallbacks
   * @returns The expanded states
   */
  getExpandedStates(): Record<string, boolean> {
    return this._legacySettings.expandedStates || {};
  }
  
  /**
   * Checks if developer mode is enabled
   * @returns Whether developer mode is enabled
   */
  isDeveloperModeEnabled(): boolean {
    return this._legacySettings.developerMode?.enabled || false;
  }
  
  /**
   * Gets the UI state with appropriate fallbacks
   * @returns The UI state
   */
  getUIState(): any {
    return this._legacySettings.uiState || {};
  }
  
  /**
   * Gets the active tab with appropriate fallbacks
   * @returns The active tab
   */
  getActiveTab(): string {
    return this._legacySettings.uiState?.activeTab || this._legacySettings.uiState?.lastTab || 'general';
  }
  
  /**
   * Gets the journal structure settings with appropriate fallbacks
   * @returns The journal structure settings
   */
  getJournalStructure(): any {
    return this._legacySettings.journalStructure || this._legacySettings.linting || {};
  }

  /**
   * Get the plugin settings
   * 
   * @returns The plugin settings
   */
  public getSettings(): DreamMetricsSettings {
    return this.settings;
  }
  
  /**
   * Update the plugin settings
   * 
   * @param settings The new settings
   */
  public updateSettings(settings: Partial<DreamMetricsSettings>): void {
    // Update settings with new values
    Object.assign(this._legacySettings, settings);
    
    // Regenerate core settings
    this.settings = this.toCoreSettings();
    
    try {
      safeLogger.debug('SettingsAdapter', 'Settings updated');
    } catch (err) {
      debug('SettingsAdapter', 'Settings updated');
    }
  }
  
  /**
   * Get a specific setting value
   * 
   * @param key The setting key
   * @returns The setting value or undefined if not found
   */
  public getSetting<K extends keyof DreamMetricsSettings>(key: K): DreamMetricsSettings[K] {
    return this.settings[key];
  }
  
  /**
   * Get the Obsidian app instance
   * 
   * @returns The Obsidian app instance or null if not provided
   */
  public getApp(): App | null {
    return this.app;
  }
  
  /**
   * Save the settings to disk
   * 
   * @param plugin The plugin instance
   */
  public async saveSettings(plugin: any): Promise<void> {
    if (plugin && typeof plugin.saveData === 'function') {
      // Save the settings to disk
      await plugin.saveData(this._legacySettings);
      
      try {
        safeLogger.debug('SettingsAdapter', 'Settings saved to disk');
      } catch (err) {
        debug('SettingsAdapter', 'Settings saved to disk');
      }
    } else {
      try {
        safeLogger.error('SettingsAdapter', 'Cannot save settings, invalid plugin instance');
      } catch (err) {
        error('SettingsAdapter', 'Cannot save settings, invalid plugin instance');
      }
    }
  }
}

/**
 * Creates and registers a settings adapter in the service registry
 * @param settings The settings to initialize with
 * @param app The Obsidian app instance
 * @returns The created settings adapter
 */
export function createAndRegisterSettingsAdapter(
  settings: DreamMetricsSettings, 
  app: App
): SettingsAdapter {
  try {
    // Create the adapter
    const settingsAdapter = new SettingsAdapter(settings, app);
    
    // Ensure metrics are initialized
    const coreSettings = settingsAdapter.toCoreSettings();
    if (!coreSettings.metrics || Object.keys(coreSettings.metrics).length === 0) {
      // Log the issue
      safeLogger.warn('SettingsAdapter', 'No metrics found in settings during registration');
    }
    
    // Register with the service registry
    registerService(SERVICE_NAMES.SETTINGS, settingsAdapter);
    
    return settingsAdapter;
  } catch (error) {
    safeLogger.error('SettingsAdapter', 'Error creating and registering settings adapter', error);
    // Create a minimal adapter if an error occurs
    const adapter = new SettingsAdapter(settings, app);
    registerService(SERVICE_NAMES.SETTINGS, adapter);
    return adapter;
  }
} 
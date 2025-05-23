import { DreamMetricsSettings } from '../../types';
import { IMetricsState } from '../metrics/interfaces';

/**
 * Interface for settings migrators.
 */
export interface ISettingsMigrator {
  /**
   * Check if the given settings object needs migration.
   * @param settings The settings object to check
   * @returns True if the settings need to be migrated
   */
  canMigrate(settings: any): boolean;
  
  /**
   * Migrate the settings from the old format to the new format.
   * @param oldSettings The old settings object
   * @returns The migrated settings object
   */
  migrate(oldSettings: any): any;
}

/**
 * Migrates settings from v1 to v2 format.
 */
export class SettingsMigratorV1toV2 implements ISettingsMigrator {
  /**
   * Check if settings are in v1 format and need migration to v2.
   * @param settings Settings object to check
   * @returns True if settings need migration
   */
  canMigrate(settings: any): boolean {
    // Check if settings are in the old format (v1)
    return settings && 
      !settings.version && 
      settings.metrics && 
      !settings.state;
  }
  
  /**
   * Migrate settings from v1 to v2 format.
   * @param oldSettings Old settings object
   * @returns Migrated settings object
   */
  migrate(oldSettings: any): any {
    // Create new settings format
    const newSettings = {
      version: 2,
      metrics: oldSettings.metrics || {},
      ui: {
        dateFormat: oldSettings.dateFormat || 'YYYY-MM-DD',
        showRibbonButtons: oldSettings.showRibbonButtons !== false,
        expandedStates: oldSettings.expandedStates || {}
      },
      state: {
        selectedNotes: oldSettings.selectedNotes || [],
        selectionMode: oldSettings.selectionMode || 'notes',
        selectedFolder: oldSettings.folderOptions?.path || '',
        projectNote: oldSettings.projectNotePath || '',
        calloutName: oldSettings.calloutName || '',
        _persistentExclusions: oldSettings._persistentExclusions || {}
      }
    };
    
    return newSettings;
  }
}

/**
 * Migrates settings from DreamMetricsSettings to IMetricsState.
 */
export class LegacySettingsToStateConverter {
  /**
   * Convert legacy settings to new state format.
   * @param settings Legacy settings object
   * @returns New state object
   */
  static convert(settings: DreamMetricsSettings): Partial<IMetricsState> {
    return {
      metrics: settings.metrics,
      selectedNotes: settings.selectedNotes || [],
      selectionMode: 'notes',
      selectedFolder: settings.folderOptions?.path || '',
      projectNote: settings.projectNotePath || '',
      calloutName: settings.calloutName || '',
      expandedStates: {},
      _persistentExclusions: {}
    };
  }
} 
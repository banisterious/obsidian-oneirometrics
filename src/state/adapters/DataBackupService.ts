import { App, Plugin, Notice } from 'obsidian';

/**
 * Service for backing up and validating user data during migrations.
 * Ensures data safety when transitioning between different plugin versions.
 */
export class DataBackupService {
  private plugin: Plugin;
  private app: App;
  
  /**
   * Creates a new DataBackupService instance.
   * @param plugin Plugin instance for access to Obsidian API
   */
  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.app = plugin.app;
  }
  
  /**
   * Create a backup of the current settings.
   * @param settings Settings object to backup
   * @returns Promise that resolves when backup is complete
   */
  async backupSettings(settings: any): Promise<void> {
    try {
      // Create backup file name with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `oneiroMetrics-settings-backup-${timestamp}.json`;
      
      // Get plugin data directory path
      const dataDir = `${this.app.vault.configDir}/plugins/obsidian-oneirometrics/backups`;
      
      // Ensure backups directory exists
      const adapter = this.app.vault.adapter;
      if (!await adapter.exists(dataDir)) {
        await adapter.mkdir(dataDir);
      }
      
      // Write backup file
      await adapter.write(
        `${dataDir}/${backupFileName}`,
        JSON.stringify(settings, null, 2)
      );
      
      console.log(`Settings backup created: ${backupFileName}`);
    } catch (error) {
      console.error('Failed to backup settings:', error);
      new Notice('Failed to create settings backup. Please check the console for details.');
    }
  }
  
  /**
   * Validate the structure of settings object.
   * @param settings Settings object to validate
   * @returns True if settings are valid
   */
  validateSettings(settings: any): boolean {
    // Perform validation on settings object
    try {
      // Check required fields
      if (!settings) return false;
      
      // Basic type checks
      if (typeof settings !== 'object') return false;
      
      // Check structure based on version
      if (settings.version === 2) {
        // v2 format validation
        return Boolean(
          settings.metrics && 
          typeof settings.metrics === 'object' &&
          settings.ui && 
          typeof settings.ui === 'object' &&
          settings.state && 
          typeof settings.state === 'object'
        );
      } else {
        // v1 format validation (minimum fields)
        return Boolean(
          settings.metrics && 
          typeof settings.metrics === 'object'
        );
      }
    } catch (error) {
      console.error('Settings validation failed:', error);
      return false;
    }
  }
  
  /**
   * Restore from backup if available.
   * @param backupId Optional specific backup ID to restore from
   * @returns Promise that resolves with restored settings or null
   */
  async restoreFromBackup(backupId?: string): Promise<any | null> {
    try {
      const adapter = this.app.vault.adapter;
      const dataDir = `${this.app.vault.configDir}/plugins/obsidian-oneirometrics/backups`;
      
      // Check if backups directory exists
      if (!await adapter.exists(dataDir)) {
        return null;
      }
      
      // Get list of backup files
      let backupFiles = await adapter.list(dataDir);
      
      // Filter to only include JSON files
      backupFiles.files = backupFiles.files.filter(file => file.endsWith('.json'));
      
      if (backupFiles.files.length === 0) {
        return null;
      }
      
      // Sort by filename (which includes timestamp)
      backupFiles.files.sort().reverse();
      
      // Get latest backup or specified backup
      let backupPath;
      if (backupId) {
        backupPath = backupFiles.files.find(file => file.includes(backupId));
        if (!backupPath) {
          return null;
        }
      } else {
        // Use most recent backup
        backupPath = backupFiles.files[0];
      }
      
      // Read and parse backup file
      const backupData = await adapter.read(backupPath);
      return JSON.parse(backupData);
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return null;
    }
  }
  
  /**
   * Get list of available backups.
   * @returns Promise that resolves with array of backup info
   */
  async listBackups(): Promise<Array<{ id: string, date: Date }>> {
    try {
      const adapter = this.app.vault.adapter;
      const dataDir = `${this.app.vault.configDir}/plugins/obsidian-oneirometrics/backups`;
      
      // Check if backups directory exists
      if (!await adapter.exists(dataDir)) {
        return [];
      }
      
      // Get list of backup files
      let backupFiles = await adapter.list(dataDir);
      
      // Filter to only include JSON files
      backupFiles.files = backupFiles.files.filter(file => file.endsWith('.json'));
      
      // Extract backup info from filenames
      return backupFiles.files.map(file => {
        const match = file.match(/oneiroMetrics-settings-backup-(.+)\.json$/);
        if (match) {
          const timestamp = match[1].replace(/-/g, ':');
          return {
            id: match[1],
            date: new Date(timestamp)
          };
        }
        return {
          id: file,
          date: new Date(0) // Fallback for unrecognized format
        };
      }).sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }
} 
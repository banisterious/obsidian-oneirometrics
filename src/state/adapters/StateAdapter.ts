import { ObservableState } from '../core/ObservableState';
import { getSafe, isNonEmptyString, withErrorHandling } from '../../utils/defensive-utils';
import safeLogger from '../../logging/safe-logger';

/**
 * Stub implementation of StateAdapter
 * 
 * This is a temporary stub to fix TypeScript errors during migration.
 * It will be replaced with a proper implementation in later phases.
 */

/**
 * Adapts an observable state to persist to plugin settings
 */
export class StateAdapter {
  private state: Record<string, any> = {};
  private pluginApi: any;
  private pluginName: string;

  /**
   * Creates a new state adapter
   * @param stateManager The state manager to adapt
   * @param pluginApi The plugin API for storage
   * @param pluginName Optional name for logging purposes
   */
  constructor(stateManager: any, pluginApi: any, pluginName = 'OOMP') {
    this.pluginApi = pluginApi;
    this.pluginName = pluginName;
    
    // Try to load initial state from plugin settings
    this.loadInitialState();
  }

  /**
   * Loads the initial state from plugin settings
   * @private
   */
  private loadInitialState(): void {
    try {
      if (!this.pluginApi) {
        safeLogger.warn('StateAdapter', 'Plugin API not available for loading state');
        return;
      }

      const settings = this.getSettingsSafely();
      if (settings && settings._stateStorage) {
        this.state = settings._stateStorage;
        safeLogger.debug('StateAdapter', 'Loaded state from plugin settings');
      }
    } catch (error) {
      safeLogger.error('StateAdapter', 'Failed to load state from plugin settings', error);
      // Initialize with empty state as fallback
      this.state = {};
    }
  }

  /**
   * Gets settings from plugin API with error handling
   * @private
   * @returns Settings object or null if unavailable
   */
  private getSettingsSafely(): any {
    try {
      if (this.pluginApi && typeof this.pluginApi.getSettings === 'function') {
        return this.pluginApi.getSettings();
      }
      return null;
    } catch (error) {
      safeLogger.error('StateAdapter', 'Error getting settings from plugin API', error);
      return null;
    }
  }

  /**
   * Gets a value from state
   * @param key The key to retrieve
   * @param defaultValue Optional default value if key doesn't exist
   * @returns The stored value or default
   */
  get<T = any>(key: string, defaultValue?: T): T {
    try {
      if (!isNonEmptyString(key)) {
        safeLogger.warn('StateAdapter', 'Invalid key provided to get()');
        return defaultValue as T;
      }
      
      const value = this.state[key];
      return value !== undefined ? value : defaultValue as T;
    } catch (error) {
      safeLogger.error('StateAdapter', `Error getting value for key: ${key}`, error);
      return defaultValue as T;
    }
  }

  /**
   * Sets a value in state
   * @param key The key to set
   * @param value The value to store
   * @returns True if successful, false otherwise
   */
  set = withErrorHandling(
    (key: string, value: any): boolean => {
      if (!isNonEmptyString(key)) {
        safeLogger.warn('StateAdapter', 'Invalid key provided to set()');
        return false;
      }
      
      this.state[key] = value;
      this.persistState();
      return true;
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to set state value",
      onError: (error) => safeLogger.error('StateAdapter', 'Error setting state value', error)
    }
  );

  /**
   * Checks if a key exists in state
   * @param key The key to check
   * @returns True if the key exists
   */
  has(key: string): boolean {
    try {
      if (!isNonEmptyString(key)) {
        return false;
      }
      return key in this.state;
    } catch (error) {
      safeLogger.error('StateAdapter', `Error checking if key exists: ${key}`, error);
      return false;
    }
  }

  /**
   * Gets all keys in state
   * @returns Array of keys
   */
  keys(): string[] {
    try {
      return Object.keys(this.state);
    } catch (error) {
      safeLogger.error('StateAdapter', 'Error getting state keys', error);
      return [];
    }
  }

  /**
   * Deletes a key from state
   * @param key The key to delete
   * @returns True if successful, false otherwise
   */
  delete = withErrorHandling(
    (key: string): boolean => {
      if (!isNonEmptyString(key) || !(key in this.state)) {
        return false;
      }
      
      delete this.state[key];
      this.persistState();
      return true;
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to delete state key",
      onError: (error) => safeLogger.error('StateAdapter', 'Error deleting state key', error)
    }
  );

  /**
   * Clears all state
   * @returns True if successful, false otherwise
   */
  clear = withErrorHandling(
    (): boolean => {
      this.state = {};
      this.persistState();
      return true;
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to clear state",
      onError: (error) => safeLogger.error('StateAdapter', 'Error clearing state', error)
    }
  );

  /**
   * Persists state to plugin settings
   * @private
   * @returns True if successful, false otherwise
   */
  private persistState(): boolean {
    try {
      if (!this.pluginApi) {
        safeLogger.warn('StateAdapter', 'Plugin API not available for persisting state');
        return false;
      }
      
      const settings = this.getSettingsSafely();
      if (!settings) {
        safeLogger.warn('StateAdapter', 'Could not get settings to persist state');
        return false;
      }
      
      settings._stateStorage = this.state;
      
      if (typeof this.pluginApi.saveSettings === 'function') {
        this.pluginApi.saveSettings();
        safeLogger.debug('StateAdapter', 'State persisted to plugin settings');
        return true;
      } else {
        safeLogger.warn('StateAdapter', 'saveSettings method not available on plugin API');
        return false;
      }
    } catch (error) {
      safeLogger.error('StateAdapter', 'Failed to persist state to plugin settings', error);
      return false;
    }
  }
} 
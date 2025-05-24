import { ObservableState } from '../core/ObservableState';

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

  /**
   * Creates a new state adapter
   * @param stateManager The state manager to adapt
   * @param pluginApi The plugin API for storage
   */
  constructor(stateManager: any, pluginApi: any) {
    this.pluginApi = pluginApi;
    
    // Try to load initial state from plugin settings
    try {
      const settings = pluginApi.getSettings();
      if (settings._stateStorage) {
        this.state = settings._stateStorage;
      }
    } catch (error) {
      console.error('Failed to load state from plugin settings', error);
    }
  }

  /**
   * Gets a value from state
   * @param key The key to retrieve
   * @returns The stored value or undefined
   */
  get(key: string): any {
    return this.state[key];
  }

  /**
   * Sets a value in state
   * @param key The key to set
   * @param value The value to store
   */
  set(key: string, value: any): void {
    this.state[key] = value;
    this.persistState();
  }

  /**
   * Checks if a key exists in state
   * @param key The key to check
   * @returns True if the key exists
   */
  has(key: string): boolean {
    return key in this.state;
  }

  /**
   * Gets all keys in state
   * @returns Array of keys
   */
  keys(): string[] {
    return Object.keys(this.state);
  }

  /**
   * Deletes a key from state
   * @param key The key to delete
   */
  delete(key: string): void {
    delete this.state[key];
    this.persistState();
  }

  /**
   * Clears all state
   */
  clear(): void {
    this.state = {};
    this.persistState();
  }

  /**
   * Persists state to plugin settings
   * @private
   */
  private persistState(): void {
    try {
      const settings = this.pluginApi.getSettings();
      settings._stateStorage = this.state;
      this.pluginApi.saveSettings();
    } catch (error) {
      console.error('Failed to persist state to plugin settings', error);
    }
  }
} 
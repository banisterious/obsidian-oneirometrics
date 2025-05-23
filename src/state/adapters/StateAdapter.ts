import { DreamMetricsState } from '../DreamMetricsState';
import { PluginAdapter } from '../../plugin/PluginAdapter';

/**
 * StateAdapter adds get/set methods to DreamMetricsState for
 * storing and retrieving arbitrary data.
 */
export class StateAdapter {
  private state: DreamMetricsState;
  private pluginApi: PluginAdapter;
  private storage: Map<string, any> = new Map();
  
  /**
   * Creates a new StateAdapter instance.
   * @param state DreamMetricsState instance
   * @param pluginApi Plugin API instance
   */
  constructor(state: DreamMetricsState, pluginApi: PluginAdapter) {
    this.state = state;
    this.pluginApi = pluginApi;
    
    // Initialize with empty storage
    this.loadState();
  }
  
  /**
   * Get a value from the state storage.
   * @param key Key to get value for
   * @returns Value for key or undefined if not found
   */
  get<T>(key: string): T | undefined {
    return this.storage.get(key) as T | undefined;
  }
  
  /**
   * Set a value in the state storage.
   * @param key Key to set value for
   * @param value Value to set
   */
  set<T>(key: string, value: T): void {
    this.storage.set(key, value);
    this.saveState();
  }
  
  /**
   * Delete a value from the state storage.
   * @param key Key to delete
   * @returns True if key was deleted, false if it didn't exist
   */
  delete(key: string): boolean {
    const result = this.storage.delete(key);
    if (result) {
      this.saveState();
    }
    return result;
  }
  
  /**
   * Clear all values from the state storage.
   */
  clear(): void {
    this.storage.clear();
    this.saveState();
  }
  
  /**
   * Get all keys in the state storage.
   * @returns Array of keys
   */
  keys(): string[] {
    return Array.from(this.storage.keys());
  }
  
  /**
   * Check if a key exists in the state storage.
   * @param key Key to check
   * @returns True if key exists, false otherwise
   */
  has(key: string): boolean {
    return this.storage.has(key);
  }
  
  /**
   * Save state to plugin data.
   */
  private saveState(): void {
    try {
      // Convert Map to Record for storage
      const data = Object.fromEntries(this.storage.entries());
      // Store in plugin settings or dedicated state
      const settings = this.pluginApi.getSettings();
      settings._stateStorage = data;
      this.pluginApi.saveSettings();
    } catch (error) {
      console.error('Failed to save state storage:', error);
    }
  }
  
  /**
   * Load state from plugin data.
   */
  private loadState(): void {
    try {
      const settings = this.pluginApi.getSettings();
      const data = settings._stateStorage;
      
      if (data && typeof data === 'object') {
        // Convert Record back to Map
        this.storage = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load state storage:', error);
    }
  }
} 
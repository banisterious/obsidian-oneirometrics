import { Plugin } from 'obsidian';
import { IStatePersistence } from '../interfaces';

/**
 * Adapter for using Obsidian's plugin data storage for state persistence.
 */
export class ObsidianStorageAdapter<T> implements IStatePersistence<T> {
  private plugin: Plugin;
  
  /**
   * Creates a new ObsidianStorageAdapter instance.
   * @param plugin Obsidian plugin instance
   */
  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }
  
  /**
   * Save state to Obsidian's data storage.
   * @param state State to save
   * @returns Promise that resolves when state is saved
   */
  async saveState(state: T): Promise<void> {
    try {
      await this.plugin.saveData(state);
    } catch (error) {
      console.error('Failed to save state to Obsidian storage:', error);
      throw error;
    }
  }
  
  /**
   * Load state from Obsidian's data storage.
   * @returns Promise that resolves with loaded state or null if not found
   */
  async loadState(): Promise<T | null> {
    try {
      const data = await this.plugin.loadData();
      return data as T || null;
    } catch (error) {
      console.error('Failed to load state from Obsidian storage:', error);
      return null;
    }
  }
  
  /**
   * Clear saved state from Obsidian's data storage.
   * @returns Promise that resolves when state is cleared
   */
  async clearState(): Promise<void> {
    // Obsidian doesn't have a specific method to remove data,
    // so we'll save null to effectively clear it
    try {
      await this.plugin.saveData(null);
    } catch (error) {
      console.error('Failed to clear state from Obsidian storage:', error);
      throw error;
    }
  }
} 
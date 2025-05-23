import { IStatePersistence } from '../interfaces';

/**
 * Implementation of state persistence using localStorage.
 * For use in Obsidian plugin environment, this will be wrapped
 * with an adapter that uses Obsidian's data storage.
 */
export class LocalStoragePersistence<T> implements IStatePersistence<T> {
  private storageKey: string;
  
  /**
   * Creates a new LocalStoragePersistence instance.
   * @param storageKey Key to use for storing the state in localStorage
   */
  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }
  
  /**
   * Save state to localStorage.
   * @param state State to save
   * @returns Promise that resolves when state is saved
   */
  async saveState(state: T): Promise<void> {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(this.storageKey, serializedState);
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
      throw error;
    }
  }
  
  /**
   * Load state from localStorage.
   * @returns Promise that resolves with loaded state or null if not found
   */
  async loadState(): Promise<T | null> {
    try {
      const serializedState = localStorage.getItem(this.storageKey);
      if (serializedState === null) {
        return null;
      }
      return JSON.parse(serializedState);
    } catch (error) {
      console.error('Failed to load state from localStorage:', error);
      return null;
    }
  }
  
  /**
   * Clear saved state from localStorage.
   * @returns Promise that resolves when state is cleared
   */
  async clearState(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear state from localStorage:', error);
      throw error;
    }
  }
} 
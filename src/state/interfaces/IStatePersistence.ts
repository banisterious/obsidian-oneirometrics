/**
 * Interface for state persistence.
 * Provides methods to load and save state to/from storage.
 */
export interface IStatePersistence<T> {
  /**
   * Save state to storage.
   * @param state State to save
   * @returns Promise that resolves when state is saved
   */
  saveState(state: T): Promise<void>;
  
  /**
   * Load state from storage.
   * @returns Promise that resolves with loaded state or null if not found
   */
  loadState(): Promise<T | null>;
  
  /**
   * Clear saved state from storage.
   * @returns Promise that resolves when state is cleared
   */
  clearState(): Promise<void>;
} 
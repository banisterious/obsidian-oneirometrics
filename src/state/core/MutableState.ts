import { ObservableState } from './ObservableState';
import { withErrorHandling } from '../../utils/defensive-utils';
import safeLogger from '../../logging/safe-logger';

/**
 * Stub implementation of MutableState
 * 
 * This is a temporary stub to fix TypeScript errors during migration.
 * It will be replaced with a proper implementation in later phases.
 */

/**
 * Represents a mutable observable state with robust error handling
 */
export class MutableState<T extends object> extends ObservableState<T> {
  /**
   * Sets the state to a new value
   * @param newState The new state
   * @returns True if successful, false if an error occurred
   */
  setState = withErrorHandling(
    (newState: T): boolean => {
      if (newState === null || typeof newState !== 'object') {
        safeLogger.warn('MutableState', 'Invalid state provided to setState (not an object)');
        return false;
      }
      
      // Create a defensive copy to prevent external mutations from affecting internal state
      this.state = { ...newState };
      this.notifyListeners();
      return true;
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to set state",
      onError: (error) => safeLogger.error('MutableState', 'Error in setState', error)
    }
  );

  /**
   * Updates the state using a function that receives the current state
   * @param updateFn A function that returns a new state based on the current state
   * @returns True if successful, false if an error occurred
   */
  updateState = withErrorHandling(
    (updateFn: (currentState: T) => T): boolean => {
      if (typeof updateFn !== 'function') {
        safeLogger.warn('MutableState', 'Invalid update function provided to updateState');
        return false;
      }
      
      try {
        // Create a defensive copy for the update function to prevent accidental mutation
        const currentState = { ...this.state };
        const newState = updateFn(currentState);
        
        if (newState === null || typeof newState !== 'object') {
          safeLogger.warn('MutableState', 'Update function returned invalid state (not an object)');
          return false;
        }
        
        // Copy to prevent external mutations
        this.state = { ...newState };
        this.notifyListeners();
        return true;
      } catch (error) {
        safeLogger.error('MutableState', 'Error in update function', error);
        return false;
      }
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to update state",
      onError: (error) => safeLogger.error('MutableState', 'Error in updateState', error)
    }
  );
  
  /**
   * Updates a specific property in the state
   * @param key The property key to update
   * @param value The new value
   * @returns True if successful, false if an error occurred
   */
  updateProperty = withErrorHandling(
    <K extends keyof T>(key: K, value: T[K]): boolean => {
      try {
        // Create a new state object with the updated property
        const newState = {
          ...this.state,
          [key]: value
        };
        
        this.state = newState;
        this.notifyListeners();
        return true;
      } catch (error) {
        safeLogger.error('MutableState', `Error updating property '${String(key)}'`, error);
        return false;
      }
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to update state property",
      onError: (error) => safeLogger.error('MutableState', 'Error in updateProperty', error)
    }
  );
} 
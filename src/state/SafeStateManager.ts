/**
 * SafeStateManager - Enhanced state management with defensive coding patterns
 * 
 * Provides robust state management with validation, transactions, and rollback capabilities
 * to prevent inconsistent states and recover from failed operations.
 */

import { MutableState } from './core/MutableState';
import { withErrorHandling } from '../utils/defensive-utils';
import safeLogger from '../logging/safe-logger';
import { EventBus } from '../events/EventBus';

/**
 * Interface for state validation functions
 */
export interface StateValidator<T> {
  /** Unique identifier for this validator */
  id: string;
  
  /** Validation function that returns true if state is valid */
  validate: (state: T) => boolean;
  
  /** Error message to use when validation fails */
  errorMessage: string;
  
  /** Whether this validator is required (will prevent state updates if it fails) */
  required: boolean;
}

/**
 * Transaction context for grouped operations
 */
export interface StateTransaction<T> {
  /** Transaction ID for tracking */
  id: string;
  
  /** Original state snapshot for rollback */
  originalState: T;
  
  /** Current state in the transaction */
  currentState: T;
  
  /** Whether the transaction has been committed */
  committed: boolean;
  
  /** Whether the transaction has been rolled back */
  rolledBack: boolean;
  
  /** Timestamp when transaction started */
  startTime: number;
}

/**
 * Options for state manager
 */
export interface SafeStateManagerOptions<T> {
  /** Initial state value */
  initialState: T;
  
  /** List of validators to apply to state updates */
  validators?: StateValidator<T>[];
  
  /** Whether to enable transaction support */
  enableTransactions?: boolean;
  
  /** Maximum transaction lifetime in milliseconds (default: 30000) */
  maxTransactionLifetime?: number;
  
  /** Whether to log state changes for debugging */
  debugLogging?: boolean;
}

/**
 * Safe state manager with defensive coding patterns
 */
export class SafeStateManager<T extends object> {
  /** Core state object */
  private state: MutableState<T>;
  
  /** State validators */
  private validators: StateValidator<T>[] = [];
  
  /** Active transactions */
  private transactions: Map<string, StateTransaction<T>> = new Map();
  
  /** Transaction support flag */
  private transactionsEnabled: boolean;
  
  /** Maximum transaction lifetime */
  private maxTransactionLifetime: number;
  
  /** Debug logging flag */
  private debugLogging: boolean;
  
  /** Event bus for notifications */
  private eventBus: EventBus;
  
  /**
   * Creates a new safe state manager
   */
  constructor(options: SafeStateManagerOptions<T>) {
    this.state = new MutableState<T>(options.initialState);
    this.validators = options.validators || [];
    this.transactionsEnabled = options.enableTransactions || false;
    this.maxTransactionLifetime = options.maxTransactionLifetime || 30000; // 30 seconds default
    this.debugLogging = options.debugLogging || false;
    this.eventBus = EventBus.getInstance();
    
    // Set up periodic transaction cleanup
    if (this.transactionsEnabled) {
      this.setupTransactionCleanup();
    }
  }
  
  /**
   * Gets the current state
   */
  getState(): T {
    return this.state.getState();
  }
  
  /**
   * Adds a validator to the state manager
   */
  addValidator(validator: StateValidator<T>): void {
    if (this.validators.some(v => v.id === validator.id)) {
      safeLogger.warn('StateManager', `Validator with ID ${validator.id} already exists, replacing`);
      this.validators = this.validators.filter(v => v.id !== validator.id);
    }
    
    this.validators.push(validator);
  }
  
  /**
   * Removes a validator by ID
   */
  removeValidator(validatorId: string): boolean {
    const initialLength = this.validators.length;
    this.validators = this.validators.filter(v => v.id !== validatorId);
    return initialLength > this.validators.length;
  }
  
  /**
   * Validates a state against all validators
   */
  private validateState = withErrorHandling(
    (state: T): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];
      let valid = true;
      
      for (const validator of this.validators) {
        try {
          const isValid = validator.validate(state);
          
          if (!isValid) {
            errors.push(validator.errorMessage);
            if (validator.required) {
              valid = false;
            }
          }
        } catch (error) {
          safeLogger.error('StateManager', `Error in validator ${validator.id}`, error);
          errors.push(`Validator error: ${validator.errorMessage}`);
          if (validator.required) {
            valid = false;
          }
        }
      }
      
      return { valid, errors };
    },
    {
      fallbackValue: { valid: false, errors: ['Validation failed due to internal error'] },
      errorMessage: "Failed to validate state",
      onError: (error) => safeLogger.error('StateManager', 'Error validating state', error)
    }
  );
  
  /**
   * Updates the state with validation
   */
  setState = withErrorHandling(
    (newState: T): { success: boolean; errors: string[] } => {
      // Validate the new state
      const validation = this.validateState(newState);
      
      if (!validation.valid) {
        if (this.debugLogging) {
          safeLogger.debug('StateManager', 'State validation failed', {
            errors: validation.errors
          });
        }
        
        this.eventBus.publish('state:validation-failed', {
          errors: validation.errors
        });
        
        return { success: false, errors: validation.errors };
      }
      
      // Apply the state update
      const success = this.state.setState(newState);
      
      if (success) {
        if (this.debugLogging) {
          safeLogger.debug('StateManager', 'State updated successfully');
        }
        
        this.eventBus.publish('state:changed', {
          state: newState
        });
      }
      
      return { success, errors: success ? [] : ['Failed to update state'] };
    },
    {
      fallbackValue: { success: false, errors: ['State update failed due to internal error'] },
      errorMessage: "Failed to set state",
      onError: (error) => safeLogger.error('StateManager', 'Error setting state', error)
    }
  );
  
  /**
   * Updates a specific property with validation
   */
  updateProperty = withErrorHandling(
    <K extends keyof T>(key: K, value: T[K]): { success: boolean; errors: string[] } => {
      const currentState = this.state.getState();
      const newState = { ...currentState, [key]: value };
      
      return this.setState(newState);
    },
    {
      fallbackValue: { success: false, errors: ['Property update failed due to internal error'] },
      errorMessage: "Failed to update property",
      onError: (error) => safeLogger.error('StateManager', 'Error updating property', error)
    }
  );
  
  /**
   * Updates the state using a function
   */
  updateState = withErrorHandling(
    (updateFn: (currentState: T) => T): { success: boolean; errors: string[] } => {
      const currentState = this.state.getState();
      
      try {
        const newState = updateFn({ ...currentState });
        return this.setState(newState);
      } catch (error) {
        safeLogger.error('StateManager', 'Error in update function', error);
        return { success: false, errors: ['Update function failed: ' + String(error)] };
      }
    },
    {
      fallbackValue: { success: false, errors: ['State update failed due to internal error'] },
      errorMessage: "Failed to update state with function",
      onError: (error) => safeLogger.error('StateManager', 'Error updating state with function', error)
    }
  );
  
  /**
   * Starts a new transaction for grouped operations
   */
  beginTransaction = withErrorHandling(
    (transactionId?: string): { id: string; success: boolean } => {
      if (!this.transactionsEnabled) {
        safeLogger.warn('StateManager', 'Transactions not enabled but beginTransaction was called');
        return { id: '', success: false };
      }
      
      const id = transactionId || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      if (this.transactions.has(id)) {
        safeLogger.warn('StateManager', `Transaction with ID ${id} already exists`);
        return { id, success: false };
      }
      
      const currentState = this.state.getState();
      
      // Create a deep clone for transaction state
      const transaction: StateTransaction<T> = {
        id,
        originalState: JSON.parse(JSON.stringify(currentState)),
        currentState: JSON.parse(JSON.stringify(currentState)),
        committed: false,
        rolledBack: false,
        startTime: Date.now()
      };
      
      this.transactions.set(id, transaction);
      
      if (this.debugLogging) {
        safeLogger.debug('StateManager', `Transaction ${id} started`);
      }
      
      return { id, success: true };
    },
    {
      fallbackValue: { id: '', success: false },
      errorMessage: "Failed to begin transaction",
      onError: (error) => safeLogger.error('StateManager', 'Error beginning transaction', error)
    }
  );
  
  /**
   * Updates state within a transaction
   */
  updateTransaction = withErrorHandling(
    (transactionId: string, updateFn: (currentState: T) => T): { success: boolean; errors: string[] } => {
      if (!this.transactionsEnabled) {
        return { success: false, errors: ['Transactions not enabled'] };
      }
      
      const transaction = this.transactions.get(transactionId);
      
      if (!transaction) {
        return { success: false, errors: [`Transaction ${transactionId} not found`] };
      }
      
      if (transaction.committed || transaction.rolledBack) {
        return { success: false, errors: [`Transaction ${transactionId} already completed`] };
      }
      
      try {
        // Apply update to transaction's current state
        const newState = updateFn({ ...transaction.currentState });
        
        // Validate the state
        const validation = this.validateState(newState);
        
        if (!validation.valid) {
          return { success: false, errors: validation.errors };
        }
        
        // Update the transaction state
        transaction.currentState = newState;
        
        if (this.debugLogging) {
          safeLogger.debug('StateManager', `Transaction ${transactionId} updated`);
        }
        
        return { success: true, errors: [] };
      } catch (error) {
        safeLogger.error('StateManager', `Error updating transaction ${transactionId}`, error);
        return { success: false, errors: ['Update function failed: ' + String(error)] };
      }
    },
    {
      fallbackValue: { success: false, errors: ['Transaction update failed due to internal error'] },
      errorMessage: "Failed to update transaction",
      onError: (error) => safeLogger.error('StateManager', 'Error updating transaction', error)
    }
  );
  
  /**
   * Commits a transaction, applying changes to the actual state
   */
  commitTransaction = withErrorHandling(
    (transactionId: string): { success: boolean; errors: string[] } => {
      if (!this.transactionsEnabled) {
        return { success: false, errors: ['Transactions not enabled'] };
      }
      
      const transaction = this.transactions.get(transactionId);
      
      if (!transaction) {
        return { success: false, errors: [`Transaction ${transactionId} not found`] };
      }
      
      if (transaction.committed || transaction.rolledBack) {
        return { success: false, errors: [`Transaction ${transactionId} already completed`] };
      }
      
      // Final validation before committing
      const validation = this.validateState(transaction.currentState);
      
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
      
      // Apply the state changes
      const success = this.state.setState(transaction.currentState);
      
      if (success) {
        transaction.committed = true;
        
        if (this.debugLogging) {
          safeLogger.debug('StateManager', `Transaction ${transactionId} committed`);
        }
        
        this.eventBus.publish('state:transaction-committed', {
          transactionId,
          state: transaction.currentState
        });
        
        // Cleanup the transaction
        this.transactions.delete(transactionId);
        
        return { success: true, errors: [] };
      } else {
        return { success: false, errors: ['Failed to apply transaction state'] };
      }
    },
    {
      fallbackValue: { success: false, errors: ['Transaction commit failed due to internal error'] },
      errorMessage: "Failed to commit transaction",
      onError: (error) => safeLogger.error('StateManager', 'Error committing transaction', error)
    }
  );
  
  /**
   * Rolls back a transaction, discarding changes
   */
  rollbackTransaction = withErrorHandling(
    (transactionId: string): boolean => {
      if (!this.transactionsEnabled) {
        return false;
      }
      
      const transaction = this.transactions.get(transactionId);
      
      if (!transaction) {
        safeLogger.warn('StateManager', `Transaction ${transactionId} not found for rollback`);
        return false;
      }
      
      if (transaction.committed || transaction.rolledBack) {
        safeLogger.warn('StateManager', `Transaction ${transactionId} already completed`);
        return false;
      }
      
      transaction.rolledBack = true;
      
      if (this.debugLogging) {
        safeLogger.debug('StateManager', `Transaction ${transactionId} rolled back`);
      }
      
      this.eventBus.publish('state:transaction-rolled-back', {
        transactionId
      });
      
      // Cleanup the transaction
      this.transactions.delete(transactionId);
      
      return true;
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to rollback transaction",
      onError: (error) => safeLogger.error('StateManager', 'Error rolling back transaction', error)
    }
  );
  
  /**
   * Sets up periodic cleanup of stale transactions
   */
  private setupTransactionCleanup(): void {
    const interval = Math.min(this.maxTransactionLifetime / 2, 60000); // At most once per minute
    
    setInterval(() => {
      this.cleanupStaleTransactions();
    }, interval);
  }
  
  /**
   * Cleans up transactions that have exceeded their lifetime
   */
  private cleanupStaleTransactions = withErrorHandling(
    (): void => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [id, transaction] of this.transactions.entries()) {
        if (now - transaction.startTime > this.maxTransactionLifetime) {
          // Automatically roll back stale transactions
          this.rollbackTransaction(id);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0 && this.debugLogging) {
        safeLogger.debug('StateManager', `Cleaned up ${cleanedCount} stale transactions`);
      }
    },
    {
      fallbackValue: undefined,
      errorMessage: "Failed to cleanup stale transactions",
      onError: (error) => safeLogger.error('StateManager', 'Error cleaning up stale transactions', error)
    }
  );
  
  /**
   * Subscribes to state changes
   */
  subscribe(listener: (state: T) => void): () => void {
    return this.state.subscribe(listener);
  }
  
  /**
   * Cleans up resources
   */
  cleanup(): void {
    // Clear all transactions
    this.transactions.clear();
  }
} 
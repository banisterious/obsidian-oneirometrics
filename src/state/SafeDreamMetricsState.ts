/**
 * SafeDreamMetricsState - Enhanced DreamMetricsState with defensive coding patterns
 * 
 * Extends the core state management with validation, transactions, and rollback
 * capabilities to ensure data integrity and prevent crashes from invalid state.
 */

import { DreamMetric, DreamMetricData, DreamMetricsSettings } from '../types/core';
import { SettingsAdapter } from './adapters/SettingsAdapter';
import { SafeStateManager, StateValidator } from './SafeStateManager';
import { withErrorHandling } from '../utils/defensive-utils';
import safeLogger from '../logging/safe-logger';
import { EventBus } from '../events/EventBus';

/**
 * State structure for SafeDreamMetricsState
 */
interface DreamMetricsStateData {
  expandedStates: Map<string, boolean>;
  metrics: Record<string, DreamMetric>;
  dreamEntries: DreamMetricData[];
  settings: DreamMetricsSettings;
}

/**
 * Enhanced DreamMetricsState with defensive coding patterns
 */
export class SafeDreamMetricsState {
  /**
   * Underlying state manager
   */
  private stateManager: SafeStateManager<DreamMetricsStateData>;
  
  /**
   * Settings adapter for normalizing settings
   */
  private settingsAdapter: SettingsAdapter;
  
  /**
   * Event bus for notifications
   */
  private eventBus: EventBus;
  
  /**
   * Creates a new SafeDreamMetricsState instance
   */
  constructor(settings?: Partial<DreamMetricsSettings>) {
    // Create settings adapter and get standardized settings
    this.settingsAdapter = new SettingsAdapter(settings);
    const coreSettings = this.settingsAdapter.toCoreSettings();
    
    // Initialize expanded states from settings
    const expandedStates = new Map<string, boolean>();
    if (coreSettings.expandedStates) {
      Object.entries(coreSettings.expandedStates).forEach(([key, value]) => {
        expandedStates.set(key, value);
      });
    }
    
    // Create initial state
    const initialState: DreamMetricsStateData = {
      expandedStates,
      metrics: coreSettings.metrics || {},
      dreamEntries: [],
      settings: coreSettings
    };
    
    // Create state validators
    const validators = this.createValidators();
    
    // Create state manager with validation and transactions
    this.stateManager = new SafeStateManager<DreamMetricsStateData>({
      initialState,
      validators,
      enableTransactions: true,
      debugLogging: coreSettings.developerMode?.enabled || false
    });
    
    // Get event bus instance
    this.eventBus = EventBus.getInstance();
  }
  
  /**
   * Creates state validators for DreamMetricsState
   */
  private createValidators(): StateValidator<DreamMetricsStateData>[] {
    return [
      {
        id: 'metrics-validator',
        validate: (state) => {
          // Ensure metrics object exists
          return !!state.metrics && typeof state.metrics === 'object';
        },
        errorMessage: 'Metrics must be a valid object',
        required: true
      },
      {
        id: 'settings-validator',
        validate: (state) => {
          // Ensure settings object exists
          return !!state.settings && typeof state.settings === 'object';
        },
        errorMessage: 'Settings must be a valid object',
        required: true
      },
      {
        id: 'entries-validator',
        validate: (state) => {
          // Ensure dream entries is an array
          return Array.isArray(state.dreamEntries);
        },
        errorMessage: 'Dream entries must be an array',
        required: true
      }
    ];
  }
  
  /**
   * Updates the expanded state for a content item
   */
  toggleExpandedState = withErrorHandling(
    (contentId: string, isExpanded: boolean): boolean => {
      const state = this.stateManager.getState();
      
      // Start a transaction for this change
      const { id, success } = this.stateManager.beginTransaction();
      if (!success) {
        safeLogger.warn('DreamMetricsState', 'Failed to begin transaction for toggle expanded state');
        return false;
      }
      
      // Update the expanded state within the transaction
      const updateResult = this.stateManager.updateTransaction(id, (currentState) => {
        // Create a new Map to avoid direct mutation
        const newExpandedStates = new Map(currentState.expandedStates);
        newExpandedStates.set(contentId, isExpanded);
        
        // Update settings for persistence
        const newSettings = { ...currentState.settings };
        if (!newSettings.expandedStates) {
          newSettings.expandedStates = {};
        }
        newSettings.expandedStates[contentId] = isExpanded;
        
        return {
          ...currentState,
          expandedStates: newExpandedStates,
          settings: newSettings
        };
      });
      
      if (!updateResult.success) {
        safeLogger.warn('DreamMetricsState', 'Failed to update expanded state', { errors: updateResult.errors });
        this.stateManager.rollbackTransaction(id);
        return false;
      }
      
      // Commit the transaction
      const commitResult = this.stateManager.commitTransaction(id);
      if (!commitResult.success) {
        safeLogger.warn('DreamMetricsState', 'Failed to commit expanded state update', { errors: commitResult.errors });
        return false;
      }
      
      // Publish event about the change
      this.eventBus.publish('ui:content-expanded', {
        contentId,
        expanded: isExpanded
      });
      
      return true;
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to toggle expanded state",
      onError: (error) => safeLogger.error('DreamMetricsState', 'Error toggling expanded state', error)
    }
  );
  
  /**
   * Gets the expanded state for a content item
   */
  getExpandedState(contentId: string): boolean {
    const state = this.stateManager.getState();
    return state.expandedStates.get(contentId) || false;
  }
  
  /**
   * Updates metrics with validation
   */
  updateMetrics = withErrorHandling(
    (metrics: Record<string, DreamMetric>): boolean => {
      // Validate metrics structure
      if (!metrics || typeof metrics !== 'object') {
        safeLogger.warn('DreamMetricsState', 'Invalid metrics object provided');
        return false;
      }
      
      // Start a transaction for this update
      const { id, success } = this.stateManager.beginTransaction();
      if (!success) {
        safeLogger.warn('DreamMetricsState', 'Failed to begin transaction for metrics update');
        return false;
      }
      
      // Update metrics within transaction
      const updateResult = this.stateManager.updateTransaction(id, (currentState) => {
        return {
          ...currentState,
          metrics,
          settings: {
            ...currentState.settings,
            metrics
          }
        };
      });
      
      if (!updateResult.success) {
        safeLogger.warn('DreamMetricsState', 'Failed to update metrics', { errors: updateResult.errors });
        this.stateManager.rollbackTransaction(id);
        return false;
      }
      
      // Commit the transaction
      const commitResult = this.stateManager.commitTransaction(id);
      if (!commitResult.success) {
        safeLogger.warn('DreamMetricsState', 'Failed to commit metrics update', { errors: commitResult.errors });
        return false;
      }
      
      // Publish metrics changed event
      this.eventBus.publish('metrics:changed', { metrics });
      
      return true;
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to update metrics",
      onError: (error) => safeLogger.error('DreamMetricsState', 'Error updating metrics', error)
    }
  );
  
  /**
   * Updates dream entries with validation
   */
  updateDreamEntries = withErrorHandling(
    (entries: DreamMetricData[]): boolean => {
      // Validate entries
      if (!Array.isArray(entries)) {
        safeLogger.warn('DreamMetricsState', 'Invalid entries array provided');
        return false;
      }
      
      // Start a transaction for this update
      const { id, success } = this.stateManager.beginTransaction();
      if (!success) {
        safeLogger.warn('DreamMetricsState', 'Failed to begin transaction for entries update');
        return false;
      }
      
      // Update entries within transaction
      const updateResult = this.stateManager.updateTransaction(id, (currentState) => {
        return {
          ...currentState,
          dreamEntries: entries
        };
      });
      
      if (!updateResult.success) {
        safeLogger.warn('DreamMetricsState', 'Failed to update entries', { errors: updateResult.errors });
        this.stateManager.rollbackTransaction(id);
        return false;
      }
      
      // Commit the transaction
      const commitResult = this.stateManager.commitTransaction(id);
      if (!commitResult.success) {
        safeLogger.warn('DreamMetricsState', 'Failed to commit entries update', { errors: commitResult.errors });
        return false;
      }
      
      // Publish entries changed event
      this.eventBus.publish('entries:changed', { count: entries.length });
      
      return true;
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to update dream entries",
      onError: (error) => safeLogger.error('DreamMetricsState', 'Error updating dream entries', error)
    }
  );
  
  /**
   * Gets metrics
   */
  getMetrics(): Record<string, DreamMetric> {
    return this.stateManager.getState().metrics;
  }
  
  /**
   * Gets dream entries
   */
  getDreamEntries(): DreamMetricData[] {
    return this.stateManager.getState().dreamEntries;
  }
  
  /**
   * Gets settings
   */
  getSettings(): DreamMetricsSettings {
    return this.stateManager.getState().settings;
  }
  
  /**
   * Gets settings adapter
   */
  getSettingsAdapter(): SettingsAdapter {
    return this.settingsAdapter;
  }
  
  /**
   * Updates settings with validation
   */
  updateSettings = withErrorHandling(
    (settings: Partial<DreamMetricsSettings>): boolean => {
      // Create a new adapter with updated settings
      const currentSettings = this.stateManager.getState().settings;
      this.settingsAdapter = new SettingsAdapter({
        ...currentSettings,
        ...settings
      });
      
      // Get standardized settings
      const newSettings = this.settingsAdapter.toCoreSettings();
      
      // Start a transaction for this update
      const { id, success } = this.stateManager.beginTransaction();
      if (!success) {
        safeLogger.warn('DreamMetricsState', 'Failed to begin transaction for settings update');
        return false;
      }
      
      // Update settings within transaction
      const updateResult = this.stateManager.updateTransaction(id, (currentState) => {
        return {
          ...currentState,
          settings: newSettings,
          metrics: newSettings.metrics || {}
        };
      });
      
      if (!updateResult.success) {
        safeLogger.warn('DreamMetricsState', 'Failed to update settings', { errors: updateResult.errors });
        this.stateManager.rollbackTransaction(id);
        return false;
      }
      
      // Commit the transaction
      const commitResult = this.stateManager.commitTransaction(id);
      if (!commitResult.success) {
        safeLogger.warn('DreamMetricsState', 'Failed to commit settings update', { errors: commitResult.errors });
        return false;
      }
      
      // Publish settings changed event
      this.eventBus.publish('settings:changed', { settings: newSettings });
      
      return true;
    },
    {
      fallbackValue: false,
      errorMessage: "Failed to update settings",
      onError: (error) => safeLogger.error('DreamMetricsState', 'Error updating settings', error)
    }
  );
  
  /**
   * Subscribes to state changes
   */
  subscribe(listener: (state: DreamMetricsStateData) => void): () => void {
    return this.stateManager.subscribe(listener);
  }
} 
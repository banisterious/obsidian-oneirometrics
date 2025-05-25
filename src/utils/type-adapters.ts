/**
 * MIGRATION NOTICE
 * 
 * This file is part of the phased migration plan and will eventually be replaced.
 * Do not add new dependencies on this file. Instead, use the permanent replacements
 * as documented in the TypeScript architecture documentation.
 * 
 * See post-refactoring-cleanup-checklist.md for the detailed migration plan.
 */
/**
 * Type Adapters - Utilities for handling type conversions between legacy and new types
 * 
 * This file provides adapter functions to help transition between legacy type definitions
 * and the new type system. These functions ensure type safety while allowing gradual migration.
 */

import { DreamMetricsSettings as CoreDreamMetricsSettings } from "../types/core";

// Define an interface that captures the shape of the legacy settings object
// without strict type checking, using any for flexibility during migration
interface LegacyDreamMetricsSettings {
  projectNote?: string;
  projectNotePath?: string;
  metrics: Record<string, any>;
  selectedNotes?: string[];
  selectedFolder?: string;
  selectionMode?: string;
  calloutName?: string;
  showRibbonButtons?: boolean;
  showTestRibbonButton?: boolean;
  backupEnabled?: boolean;
  backupFolderPath?: string;
  expandedStates?: Record<string, boolean>;
  journalStructure?: any;
  linting?: any;
  logging?: {
    level?: string;
    maxSize?: number;
    maxLogSize?: number;
    maxBackups?: number;
    logFilePath?: string;
  };
  backup?: {
    enabled?: boolean;
    folderPath?: string;
    maxBackups?: number;
    frequency?: string;
  };
  uiState?: any;
  developerMode?: any;
  metricsVersion?: string;
  [key: string]: any; // Allow any other properties
}

/**
 * Adapts a legacy settings object to match the core settings interface
 * by filling in any missing required properties with default values.
 */
export function adaptSettingsToCore(settings: any): CoreDreamMetricsSettings {
  // Create a base settings object with defaults
  const adaptedSettings: CoreDreamMetricsSettings = {
    // Set defaults for required properties that might be missing
    projectNote: settings.projectNote || settings.projectNotePath || '',
    metrics: settings.metrics || {},
    selectedNotes: settings.selectedNotes || [],
    selectedFolder: settings.selectedFolder || '',
    selectionMode: settings.selectionMode || 'notes',
    calloutName: settings.calloutName || 'dream',
    showRibbonButtons: settings.showRibbonButtons || !!settings.showTestRibbonButton || false,
    backupEnabled: settings.backupEnabled || (settings.backup?.enabled) || false,
    backupFolderPath: settings.backupFolderPath || settings.backup?.folderPath || './backups',
    
    // Ensure logging has the correct structure
    logging: {
      level: settings.logging?.level || 'info',
      maxSize: settings.logging?.maxSize || settings.logging?.maxLogSize || 1024 * 1024, // 1MB default
      maxBackups: settings.logging?.maxBackups || 3,
    }
  };
  
  // Handle optional properties with explicit type checking
  
  // Copy expandedStates if it exists
  if (settings.expandedStates) {
    adaptedSettings.expandedStates = {...settings.expandedStates};
  }
  
  // Copy journalStructure or linting if they exist
  if (settings.journalStructure) {
    adaptedSettings.journalStructure = settings.journalStructure;
  } else if (settings.linting) {
    adaptedSettings.journalStructure = settings.linting;
    adaptedSettings.linting = settings.linting;
  }
  
  // Copy UI state if it exists
  if (settings.uiState) {
    adaptedSettings.uiState = {
      activeTab: settings.uiState.activeTab || settings.uiState.lastTab || 'general',
      lastFilter: settings.uiState.lastFilter || 'all',
      customRanges: settings.uiState.customRanges || {},
      layout: settings.uiState.layout || {}
    };
  }
  
  // Copy developer mode settings if they exist
  if (settings.developerMode) {
    adaptedSettings.developerMode = {
      enabled: settings.developerMode.enabled || false,
      showDebugRibbon: settings.developerMode.showDebugRibbon || settings.developerMode.showDebugInfo || false,
      traceFunctionCalls: settings.developerMode.traceFunctionCalls || settings.developerMode.performanceMonitoring || false,
      experimentalFeatures: settings.developerMode.experimentalFeatures || []
    };
  }
  
  // Copy metricsVersion if it exists
  if (settings.metricsVersion) {
    adaptedSettings.metricsVersion = settings.metricsVersion;
  }
  
  // Handle backup settings structure
  if (settings.backup) {
    adaptedSettings.backup = {
      enabled: settings.backup.enabled || settings.backupEnabled || false,
      folderPath: settings.backup.folderPath || settings.backupFolderPath || './backups',
      maxBackups: settings.backup.maxBackups || 5,
      frequency: settings.backup.frequency as any || 'onSave'
    };
  } else if (settings.backupEnabled) {
    adaptedSettings.backup = {
      enabled: settings.backupEnabled,
      folderPath: settings.backupFolderPath || './backups',
      maxBackups: 5,
      frequency: 'onSave'
    };
  }
  
  // Preserve legacy properties for backward compatibility
  adaptedSettings.projectNotePath = settings.projectNotePath || settings.projectNote || '';
  adaptedSettings.showTestRibbonButton = settings.showTestRibbonButton || settings.showRibbonButtons || false;
  
  // Handle linting settings
  if (settings.linting && !settings.journalStructure) {
    adaptedSettings.linting = settings.linting;
  }
  
  return adaptedSettings;
}

/**
 * Helper to safely get the project note path from settings
 * Compatible with both legacy and new settings objects
 */
export function getProjectNotePathSafe(settings: any): string {
  return settings.projectNote || settings.projectNotePath || '';
}

/**
 * Helper to safely get the selection mode from settings
 * Compatible with both legacy and new settings objects
 */
export function getSelectionModeSafe(settings: any): string {
  return settings.selectionMode || 'notes';
}

/**
 * Helper to safely get the selected folder from settings
 * Compatible with both legacy and new settings objects
 */
export function getSelectedFolderSafe(settings: any): string {
  return settings.selectedFolder || '';
}

/**
 * Helper to safely check if ribbon buttons should be shown
 * Compatible with both legacy and new settings objects
 */
export function shouldShowRibbonButtonsSafe(settings: any): boolean {
  return settings.showRibbonButtons || !!settings.showTestRibbonButton || false;
}

/**
 * Helper to safely check if backups are enabled
 * Compatible with both legacy and new settings objects
 */
export function isBackupEnabledSafe(settings: any): boolean {
  return settings.backupEnabled || settings.backup?.enabled || false;
}

/**
 * Helper to safely get the backup folder path
 * Compatible with both legacy and new settings objects
 */
export function getBackupFolderPathSafe(settings: any): string {
  return settings.backupFolderPath || settings.backup?.folderPath || './backups';
}

/**
 * Helper to safely get the expanded states from settings
 * Compatible with both legacy and new settings objects
 */
export function getExpandedStatesSafe(settings: any): Record<string, boolean> {
  return settings.expandedStates || {};
}

/**
 * Helper to safely check if developer mode is enabled
 * Compatible with both legacy and new settings objects
 */
export function isDeveloperModeSafe(settings: any): boolean {
  return settings.developerMode?.enabled || false;
}

/**
 * Helper to safely get the UI state from settings
 * Compatible with both legacy and new settings objects
 */
export function getUIStateSafe(settings: any): any {
  return settings.uiState || {};
}

/**
 * Helper to safely get the active tab from UI state
 * Compatible with both legacy and new settings objects
 */
export function getActiveTabSafe(settings: any): string {
  return settings.uiState?.activeTab || settings.uiState?.lastTab || 'general';
}

/**
 * Helper to safely get the journal structure settings
 * Compatible with both legacy and new settings objects
 */
export function getJournalStructureSafe(settings: any): any {
  return settings.journalStructure || settings.linting || {};
} 

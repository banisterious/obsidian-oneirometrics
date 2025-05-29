/**
 * TYPE ADAPTERS STUB
 * 
 * This file is a transitional stub that re-exports functions from their
 * permanent locations. It will be removed in a future release.
 * 
 * @deprecated Use the permanent implementations directly instead of this file.
 */

// Re-export settings helpers
import {
  getProjectNotePath,
  getSelectionMode,
  getSelectedFolder,
  shouldShowRibbonButtons,
  isBackupEnabled,
  getBackupFolderPath,
  isDeveloperModeEnabled,
  getUIState,
  getActiveTab,
  getJournalStructure
} from './settings-helpers';

// Re-export SettingsAdapter
import { SettingsAdapter } from '../state/adapters/SettingsAdapter';

/**
 * Legacy function to adapt settings to core format
 * @param settings The settings to adapt
 * @returns Adapted settings
 * @deprecated Use SettingsAdapter instead
 */
export function adaptSettingsToCore(settings: any): any {
  const adapter = new SettingsAdapter(settings);
  return adapter.toCoreSettings();
}

/**
 * Get project note path safely
 * @param settings Settings object
 * @returns Project note path
 * @deprecated Use getProjectNotePath from settings-helpers
 */
export function getProjectNotePathSafe(settings: any): string {
  return getProjectNotePath(settings);
}

/**
 * Get selection mode safely
 * @param settings Settings object
 * @returns Selection mode
 * @deprecated Use getSelectionMode from settings-helpers
 */
export function getSelectionModeSafe(settings: any): string {
  return getSelectionMode(settings);
}

/**
 * Get selected folder safely
 * @param settings Settings object
 * @returns Selected folder
 * @deprecated Use getSelectedFolder from settings-helpers
 */
export function getSelectedFolderSafe(settings: any): string {
  return getSelectedFolder(settings);
}

/**
 * Check if ribbon buttons should be shown safely
 * @param settings Settings object
 * @returns Whether to show ribbon buttons
 * @deprecated Use shouldShowRibbonButtons from settings-helpers
 */
export function shouldShowRibbonButtonsSafe(settings: any): boolean {
  return shouldShowRibbonButtons(settings);
}

/**
 * Check if backup is enabled safely
 * @param settings Settings object
 * @returns Whether backup is enabled
 * @deprecated Use isBackupEnabled from settings-helpers
 */
export function isBackupEnabledSafe(settings: any): boolean {
  return isBackupEnabled(settings);
}

/**
 * Get backup folder path safely
 * @param settings Settings object
 * @returns Backup folder path
 * @deprecated Use getBackupFolderPath from settings-helpers
 */
export function getBackupFolderPathSafe(settings: any): string {
  return getBackupFolderPath(settings);
}

/**
 * Get expanded states safely
 * @param settings Settings object
 * @returns Expanded states
 * @deprecated Use getExpandedStates from settings-helpers
 */
export function getExpandedStatesSafe(settings: any): Record<string, boolean> {
  // Use the adapter's method since settings-helpers doesn't expose this
  const adapter = new SettingsAdapter(settings);
  return adapter.getExpandedStates();
}

/**
 * Check if developer mode is enabled safely
 * @param settings Settings object
 * @returns Whether developer mode is enabled
 * @deprecated Use isDeveloperMode from settings-helpers
 */
export function isDeveloperModeSafe(settings: any): boolean {
  return isDeveloperModeEnabled(settings);
}

/**
 * Get UI state safely
 * @param settings Settings object
 * @returns UI state
 * @deprecated Use getUIState from settings-helpers
 */
export function getUIStateSafe(settings: any): any {
  return getUIState(settings);
}

/**
 * Get active tab safely
 * @param settings Settings object
 * @returns Active tab
 * @deprecated Use getActiveTab from settings-helpers
 */
export function getActiveTabSafe(settings: any): string {
  return getActiveTab(settings);
}

/**
 * Get journal structure safely
 * @param settings Settings object
 * @returns Journal structure
 * @deprecated Use getJournalStructure from settings-helpers
 */
export function getJournalStructureSafe(settings: any): any {
  return getJournalStructure(settings);
}

/**
 * Type adapter functions for safe conversion between similar types
 * with different module origins
 */

import { DreamMetricData as TypesDreamMetricData } from '../types';
import { DreamMetricData as CoreDreamMetricData } from '../types/core';
import { calculateWordCount } from './helpers';

/**
 * Safely converts an array of DreamMetricData objects from one module to another
 * This handles incompatible type definitions between modules
 * 
 * @param entries Array of entries that might be from either module
 * @returns Array of entries compatible with the types module
 */
export function adaptDreamMetricDataArray(entries: any[]): TypesDreamMetricData[] {
    if (!entries || !Array.isArray(entries)) {
        return [];
    }
    
    return entries.map(entry => adaptDreamMetricData(entry));
}

/**
 * Adapts a single DreamMetricData object to be compatible with the types module
 * 
 * @param entry The entry to adapt (from any source)
 * @returns The adapted entry compatible with types module
 */
export function adaptDreamMetricData(entry: any): TypesDreamMetricData {
    if (!entry) {
        // Create a minimal valid entry
        return {
            date: new Date().toISOString().split('T')[0],
            title: 'Unknown Entry',
            content: '',
            source: 'adapter',
            wordCount: 0,
            metrics: {}
        };
    }
    
    // Handle source property which differs between types
    let source = 'unknown';
    if (typeof entry.source === 'string') {
        source = entry.source;
    } else if (entry.source && typeof entry.source === 'object' && entry.source.file) {
        // Handle object format source
        source = entry.source.file;
    }
    
    // Ensure wordCount is present
    let wordCount = entry.wordCount;
    if (wordCount === undefined) {
        wordCount = calculateWordCount(entry.content || '');
    }
    
    // Create a type-compatible object
    return {
        date: entry.date || new Date().toISOString().split('T')[0],
        title: entry.title || 'Untitled Entry',
        content: entry.content || '',
        source,
        wordCount,
        metrics: entry.metrics || {},
        calloutMetadata: entry.calloutMetadata
    };
}

// Export other type adapter functions as needed 
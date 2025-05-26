import { DreamMetricsSettings } from '../types/core';
import { JournalStructureSettings } from '../types/journal-check';
import { LogLevel } from '../types/logging';

/**
 * Helper functions for safely accessing properties in DreamMetricsSettings
 * These functions provide type-safe access while handling compatibility concerns
 */

/**
 * Gets the project note path, handling both projectNote and legacy projectNotePath
 */
export function getProjectNotePath(settings: DreamMetricsSettings): string {
    return settings.projectNote || settings.projectNotePath || '';
}

/**
 * Sets the project note path
 */
export function setProjectNotePath(settings: DreamMetricsSettings, path: string): void {
    settings.projectNote = path;
    // Also keep legacy property in sync for compatibility
    (settings as any).projectNotePath = path;
}

/**
 * Gets the selected folder path
 */
export function getSelectedFolder(settings: DreamMetricsSettings): string {
    return settings.selectedFolder || '';
}

/**
 * Sets the selected folder path
 */
export function setSelectedFolder(settings: DreamMetricsSettings, folder: string): void {
    settings.selectedFolder = folder;
}

/**
 * Safely accesses the selectionMode property, handling different formats
 */
export function getSelectionMode(settings: DreamMetricsSettings): 'notes' | 'folder' {
    // Handle both old and new selection mode formats
    if (settings.selectionMode === 'manual' || settings.selectionMode === 'notes') {
        return 'notes';
    } else if (settings.selectionMode === 'automatic' || settings.selectionMode === 'folder') {
        return 'folder';
    }
    // Default to notes if unspecified
    return 'notes';
}

/**
 * Sets the selection mode, maintaining compatibility with both formats
 */
export function setSelectionMode(settings: DreamMetricsSettings, mode: 'notes' | 'folder'): void {
    // Map to the correct type
    if (mode === 'notes') {
        settings.selectionMode = 'manual';
    } else if (mode === 'folder') {
        settings.selectionMode = 'automatic';
    }
}

/**
 * Safely accesses the logging maxSize property
 */
export function getLogMaxSize(settings: DreamMetricsSettings): number {
    if (!settings.logging) return 1024 * 1024; // 1MB default
    return settings.logging.maxSize || settings.logging.maxLogSize || 1024 * 1024;
}

/**
 * Sets the logging maxSize property
 */
export function setLogMaxSize(settings: DreamMetricsSettings, size: number): void {
    if (!settings.logging) {
        settings.logging = { level: 'info' };
    }
    settings.logging.maxSize = size;
    // Also set legacy property for compatibility
    settings.logging.maxLogSize = size;
}

/**
 * Gets the backup enabled state
 */
export function isBackupEnabled(settings: DreamMetricsSettings): boolean {
    return settings.backupEnabled || false;
}

/**
 * Sets the backup enabled state
 */
export function setBackupEnabled(settings: DreamMetricsSettings, enabled: boolean): void {
    settings.backupEnabled = enabled;
}

/**
 * Gets the backup folder path
 */
export function getBackupFolderPath(settings: DreamMetricsSettings): string {
    return settings.backupFolderPath || '';
}

/**
 * Sets the backup folder path
 */
export function setBackupFolderPath(settings: DreamMetricsSettings, path: string): void {
    settings.backupFolderPath = path;
}

/**
 * Gets the journal structure settings, handling both journalStructure and linting properties
 */
export function getJournalStructure(settings: DreamMetricsSettings): JournalStructureSettings | undefined {
    return settings.journalStructure || settings.linting;
}

/**
 * Sets the journal structure settings
 */
export function setJournalStructure(settings: DreamMetricsSettings, structure: JournalStructureSettings): void {
    settings.journalStructure = structure;
    // Also set linting for compatibility
    settings.linting = structure;
}

/**
 * Gets whether to show ribbon buttons
 */
export function shouldShowRibbonButtons(settings: DreamMetricsSettings): boolean {
    // First check the new property, then fall back to legacy
    if (typeof settings.showRibbonButtons !== 'undefined') {
        return settings.showRibbonButtons;
    }
    // Fall back to legacy property
    return settings.showTestRibbonButton || false;
}

/**
 * Sets whether to show ribbon buttons
 */
export function setShowRibbonButtons(settings: DreamMetricsSettings, show: boolean): void {
    settings.showRibbonButtons = show;
    // Also set legacy property for compatibility
    settings.showTestRibbonButton = show;
}

/**
 * Checks if developer mode is enabled
 */
export function isDeveloperModeEnabled(settings: DreamMetricsSettings): boolean {
    if (!settings.developerMode) return false;
    return settings.developerMode.enabled || false;
}

/**
 * Sets developer mode enabled state
 */
export function setDeveloperModeEnabled(settings: DreamMetricsSettings, enabled: boolean): void {
    if (!settings.developerMode) {
        settings.developerMode = { enabled: false };
    }
    settings.developerMode.enabled = enabled;
}

/**
 * Gets the UI state object
 */
export function getUIState(settings: DreamMetricsSettings): Record<string, any> {
    return settings.uiState || {};
}

/**
 * Sets the UI state object
 */
export function setUIState(settings: DreamMetricsSettings, uiState: Record<string, any>): void {
    settings.uiState = uiState;
}

/**
 * Gets the active tab from UI state
 */
export function getActiveTab(settings: DreamMetricsSettings): string {
    if (!settings.uiState) return 'general';
    return settings.uiState.activeTab || (settings.uiState as any).lastTab || 'general';
}

/**
 * Sets the active tab in UI state
 */
export function setActiveTab(settings: DreamMetricsSettings, tab: string): void {
    if (!settings.uiState) {
        settings.uiState = {};
    }
    settings.uiState.activeTab = tab;
    // Also set legacy property for compatibility
    (settings.uiState as any).lastTab = tab;
}
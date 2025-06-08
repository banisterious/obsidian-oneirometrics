/**
 * Plugin Compatibility Utilities
 * 
 * Helpers to ensure compatibility with other Obsidian plugins
 */

import { App, Plugin, TFolder } from 'obsidian';
import { DreamMetricsSettings } from '../types/core';
import { getProjectNotePath } from './settings-helpers';
import { initializeFolderNotesCompatibility } from '../plugin/FolderNotesAdapter';

/**
 * Initialize compatibility with other plugins like folder-notes
 * This should be called early in the plugin initialization process
 */
export async function initializePluginCompatibility(
    app: App, 
    plugin: Plugin, 
    settings: DreamMetricsSettings
): Promise<void> {
    try {
        // 1. Register any required global variables for other plugins
        registerGlobalCompatibilityVariables(plugin);
        
        // 2. Initialize folder-notes compatibility
        initializeFolderNotesCompatibility(app, plugin);
        
    } catch (error) {
        console.warn('OneiroMetrics: Error initializing plugin compatibility', error);
    }
}



/**
 * Register global variables that other plugins might expect
 */
function registerGlobalCompatibilityVariables(plugin: Plugin): void {
    // Register plugin instance in case other plugins need it
    (window as any).oneiroMetricsPlugin = plugin;
    
    // Add a dummy helper for folder-notes plugin
    (window as any)._oneiroMetrics_folderHelper = {
        isValidMetricsPath: (path: string) => true
    };
    
    // Add placeholder objects for paths that might be accessed
    // This prevents "Cannot read properties of undefined" errors
    (window as any)._oom_safePaths = {
        'Journals': {},
        'Journals/Dream Diary': {},
        'Journals/Dream Diary/Metrics': {},
        '/': {}
    };
} 
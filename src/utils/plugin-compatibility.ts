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
        // 1. Ensure required folders exist
        await ensureRequiredFoldersExist(app, settings);
        
        // 2. Register any required global variables for other plugins
        registerGlobalCompatibilityVariables(plugin);
        
        // 3. Initialize folder-notes compatibility
        initializeFolderNotesCompatibility(app, plugin);
        
    } catch (error) {
        console.warn('OneiroMetrics: Error initializing plugin compatibility', error);
    }
}

/**
 * Ensure all required folders exist for compatibility with other plugins
 */
async function ensureRequiredFoldersExist(app: App, settings: DreamMetricsSettings): Promise<void> {
    // Get project note path and ensure parent folders exist
    const projectNotePath = getProjectNotePath(settings);
    if (projectNotePath) {
        // Extract folder path from the full path
        const folderPath = projectNotePath.substring(0, projectNotePath.lastIndexOf('/'));
        if (folderPath) {
            // Check if folder exists and create if needed
            await ensureFolderExists(app, folderPath);
        }
    }
    
    // For folder-notes compatibility, ensure known paths referenced in errors exist
    const knownPaths = [
        'Journals',
        'Journals/Dream Diary',
        'Journals/Dream Diary/Metrics'
    ];
    
    for (const path of knownPaths) {
        await ensureFolderExists(app, path);
    }
}

/**
 * Ensure a folder exists in the vault, creating it if necessary
 */
async function ensureFolderExists(app: App, folderPath: string): Promise<void> {
    try {
        const folder = app.vault.getAbstractFileByPath(folderPath);
        if (!folder) {
            // Create folder if it doesn't exist
            console.debug(`OneiroMetrics: Creating folder for compatibility: ${folderPath}`);
            // Use recursive creation to handle nested paths
            await createFolderRecursively(app, folderPath);
        }
    } catch (e) {
        // Check if error is due to folder already existing (which is fine)
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (errorMessage.includes('Folder already exists') || errorMessage.includes('already exists')) {
            // This is expected and safe to ignore
            console.debug(`OneiroMetrics: Folder already exists: ${folderPath}`);
        } else {
            // Log other errors as warnings
            console.warn(`OneiroMetrics: Error ensuring folder exists: ${folderPath}`, e);
        }
    }
}

/**
 * Create a folder recursively, handling parent folders if needed
 */
async function createFolderRecursively(app: App, folderPath: string): Promise<void> {
    try {
        await app.vault.createFolder(folderPath);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        
        // If folder already exists, that's fine - just return
        if (errorMessage.includes('Folder already exists') || errorMessage.includes('already exists')) {
            return;
        }
        
        // If folder creation failed, it might be because the parent folder doesn't exist
        const lastSlashIndex = folderPath.lastIndexOf('/');
        if (lastSlashIndex > 0) {
            const parentFolder = folderPath.substring(0, lastSlashIndex);
            // Create parent folder first
            await createFolderRecursively(app, parentFolder);
            // Then try creating the original folder again
            try {
                await app.vault.createFolder(folderPath);
            } catch (retryError) {
                const retryErrorMessage = retryError instanceof Error ? retryError.message : String(retryError);
                // If it still fails due to already existing, that's fine
                if (!(retryErrorMessage.includes('Folder already exists') || retryErrorMessage.includes('already exists'))) {
                    throw retryError;
                }
            }
        } else {
            throw e;
        }
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
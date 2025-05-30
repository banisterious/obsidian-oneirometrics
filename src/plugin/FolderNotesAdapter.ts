/**
 * FolderNotesAdapter
 * 
 * Provides a safe interface for interacting with the folder-notes plugin.
 * This adapter prevents errors when folder-notes is not installed or when
 * it attempts to access paths that don't exist in our structure.
 */

import { App, Plugin, TAbstractFile } from 'obsidian';

/**
 * Interface representing a minimal subset of the folder-notes plugin API
 */
interface FolderNotesPlugin {
    getEl: (path: string) => HTMLElement | null;
    settings: {
        folderNoteType: string;
        defaultNoteFolder: string;
    };
}

/**
 * Extended App interface with plugins property
 */
interface ExtendedApp extends App {
    plugins: {
        enabledPlugins: Set<string>;
        plugins: Record<string, any>;
    };
}

/**
 * Check if the folder-notes plugin is available
 */
export function isFolderNotesAvailable(app: App): boolean {
    const extApp = app as ExtendedApp;
    return extApp.plugins?.plugins?.['folder-notes'] !== undefined;
}

/**
 * Get a safe reference to the folder-notes plugin
 */
export function getFolderNotesPlugin(app: App): FolderNotesPlugin | null {
    try {
        const extApp = app as ExtendedApp;
        return extApp.plugins?.plugins?.['folder-notes'] as FolderNotesPlugin;
    } catch (e) {
        console.warn('OneiroMetrics: Error accessing folder-notes plugin', e);
        return null;
    }
}

/**
 * Add a patch to the folder-notes plugin to prevent errors
 * when accessing paths that don't exist in our structure
 */
export function patchFolderNotesPlugin(app: App): void {
    if (!isFolderNotesAvailable(app)) {
        return;
    }
    
    try {
        const folderNotes = getFolderNotesPlugin(app);
        if (!folderNotes) return;
        
        // Store the original getEl function
        const originalGetEl = folderNotes.getEl;
        
        // Replace with our patched version
        if (originalGetEl) {
            // @ts-ignore - we're monkey patching
            folderNotes.getEl = function(path: string) {
                try {
                    // If path contains 'Journals/Dream Diary' or other OOMP paths,
                    // check if the path exists first
                    if (path && typeof path === 'string' && 
                        (path.includes('Journals/Dream') || 
                         path.includes('Metrics'))) {
                        
                        // Check if path exists in vault
                        const file = app.vault.getAbstractFileByPath(path);
                        if (!file) {
                            // Path doesn't exist, return null instead of causing an error
                            return null;
                        }
                    }
                    
                    // Call the original function
                    return originalGetEl.call(folderNotes, path);
                } catch (e) {
                    console.warn(`OneiroMetrics: Error in patched folder-notes getEl for path: ${path}`, e);
                    return null;
                }
            };
            
            console.debug('OneiroMetrics: Successfully patched folder-notes getEl function');
        }
    } catch (e) {
        console.warn('OneiroMetrics: Error patching folder-notes plugin', e);
    }
}

/**
 * Initialize interaction with the folder-notes plugin
 * This should be called during plugin initialization
 */
export function initializeFolderNotesCompatibility(app: App, plugin: Plugin): void {
    try {
        // 1. Add global handler for folder-notes paths
        (window as any)._oom_folderNotes_safePathHandler = {
            handlePath: (path: string): boolean => {
                // This function will be called by our monkey patch
                // Return true if the path should be handled normally
                // Return false to prevent an error
                
                // Prevent errors for our special paths
                if (path && typeof path === 'string' &&
                    (path.includes('Journals/Dream') || 
                     path.includes('Metrics'))) {
                    
                    // Check if path exists in vault
                    const file = app.vault.getAbstractFileByPath(path);
                    return !!file; // Return true only if file exists
                }
                
                return true; // Handle normally for other paths
            }
        };
        
        // 2. Patch the folder-notes plugin to use our handler
        patchFolderNotesPlugin(app);
        
        // 3. Register event listener using appropriate type
        // The event name is actually a custom event, needs to be handled safely
        try {
            // @ts-ignore - 'plugin-load' is a custom event not in the typings
            app.workspace.on('plugin-load', (loadedPlugin: Plugin) => {
                if (loadedPlugin && loadedPlugin.manifest && loadedPlugin.manifest.id === 'folder-notes') {
                    console.debug('OneiroMetrics: folder-notes plugin loaded, applying patch');
                    patchFolderNotesPlugin(app);
                }
            });
        } catch (e) {
            console.warn('OneiroMetrics: Error registering plugin-load event listener', e);
        }
        
    } catch (e) {
        console.warn('OneiroMetrics: Error initializing folder-notes compatibility', e);
    }
} 
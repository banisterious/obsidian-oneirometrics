import { App, Notice } from 'obsidian';
import safeLogger from '../logging/safe-logger';

/**
 * Storage helper functions for OneiroMetrics
 * Handles localStorage operations for custom date ranges and favorites
 * Uses Obsidian's vault-specific storage to prevent data sharing across vaults
 */

// Storage keys for date range persistence
const CUSTOM_RANGE_KEY = 'oneirometrics-last-custom-range';
const SAVED_RANGES_KEY = 'oneirometrics-saved-custom-ranges';

/**
 * Interface for date range objects
 */
export interface DateRange {
    start: string;
    end: string;
}

/**
 * Save the last used custom date range to vault-specific localStorage
 * 
 * @param app The Obsidian app instance
 * @param range The date range to save
 */
export function saveLastCustomRange(app: App, range: DateRange): void {
    try {
        app.saveLocalStorage(CUSTOM_RANGE_KEY, range);
        safeLogger.debug('Storage', 'Saved custom range to vault-specific localStorage', { range });
    } catch (error) {
        safeLogger.error('Storage', 'Failed to save custom range to vault-specific localStorage', {
            error: error instanceof Error ? error : new Error(String(error)),
            range
        });
    }
}

/**
 * Load the last used custom date range from vault-specific localStorage
 * 
 * @param app The Obsidian app instance
 * @returns The last used date range or null if none exists
 */
export function loadLastCustomRange(app: App): DateRange | null {
    try {
        const range = app.loadLocalStorage(CUSTOM_RANGE_KEY);
        if (!range) {
            safeLogger.debug('Storage', 'No custom range found in vault-specific localStorage');
            return null;
        }
        
        // Validate the loaded range has required properties
        if (typeof range !== 'object' || !range.start || !range.end) {
            safeLogger.warn('Storage', 'Invalid custom range data in vault-specific localStorage', { range });
            return null;
        }
        
        safeLogger.debug('Storage', 'Loaded custom range from vault-specific localStorage', { range });
        return range as DateRange;
    } catch (error) {
        safeLogger.error('Storage', 'Failed to load custom range from vault-specific localStorage', {
            error: error instanceof Error ? error : new Error(String(error))
        });
        return null;
    }
}

/**
 * Save a favorite date range with a given name
 * 
 * @param app The Obsidian app instance
 * @param name The name for the favorite range
 * @param range The date range to save
 */
export function saveFavoriteRange(app: App, name: string, range: DateRange): void {
    try {
        if (!name || name.trim() === '') {
            safeLogger.warn('Storage', 'Cannot save favorite range with empty name');
            return;
        }
        
        const saved = loadFavoriteRanges(app);
        saved[name.trim()] = range;
        app.saveLocalStorage(SAVED_RANGES_KEY, saved);
        safeLogger.debug('Storage', 'Saved favorite range', { name: name.trim(), range });
    } catch (error) {
        safeLogger.error('Storage', 'Failed to save favorite range', {
            error: error instanceof Error ? error : new Error(String(error)),
            name,
            range
        });
    }
}

/**
 * Load all favorite date ranges from vault-specific localStorage
 * 
 * @param app The Obsidian app instance
 * @returns Record of favorite ranges by name
 */
export function loadFavoriteRanges(app: App): Record<string, DateRange> {
    try {
        const ranges = app.loadLocalStorage(SAVED_RANGES_KEY);
        if (!ranges) {
            safeLogger.debug('Storage', 'No favorite ranges found in vault-specific localStorage');
            return {};
        }
        
        // Validate the structure
        if (typeof ranges !== 'object') {
            safeLogger.warn('Storage', 'Invalid favorite ranges data in vault-specific localStorage');
            return {};
        }
        
        // Validate each range has required properties
        const validatedRanges: Record<string, DateRange> = {};
        for (const [name, range] of Object.entries(ranges)) {
            if (range && typeof range === 'object' && 
                (range as any).start && (range as any).end) {
                validatedRanges[name] = range as DateRange;
            } else {
                safeLogger.warn('Storage', 'Skipping invalid favorite range', { name, range });
            }
        }
        
        safeLogger.debug('Storage', 'Loaded favorite ranges from vault-specific localStorage', { count: Object.keys(validatedRanges).length });
        return validatedRanges;
    } catch (error) {
        safeLogger.error('Storage', 'Failed to load favorite ranges from vault-specific localStorage', {
            error: error instanceof Error ? error : new Error(String(error))
        });
        return {};
    }
}

/**
 * Delete a favorite date range by name
 * 
 * @param app The Obsidian app instance
 * @param name The name of the favorite range to delete
 */
export function deleteFavoriteRange(app: App, name: string): void {
    try {
        if (!name || name.trim() === '') {
            safeLogger.warn('Storage', 'Cannot delete favorite range with empty name');
            return;
        }
        
        const saved = loadFavoriteRanges(app);
        const trimmedName = name.trim();
        
        if (!(trimmedName in saved)) {
            safeLogger.warn('Storage', 'Favorite range not found for deletion', { name: trimmedName });
            new Notice(`Favorite range "${trimmedName}" not found`);
            return;
        }
        
        delete saved[trimmedName];
        app.saveLocalStorage(SAVED_RANGES_KEY, saved);
        safeLogger.debug('Storage', 'Deleted favorite range', { name: trimmedName });
        new Notice(`Deleted favorite: ${trimmedName}`);
    } catch (error) {
        safeLogger.error('Storage', 'Failed to delete favorite range', {
            error: error instanceof Error ? error : new Error(String(error)),
            name
        });
        new Notice(`Error deleting favorite range: ${name}`);
    }
}

/**
 * Clear all stored date range data
 * Useful for testing or resetting storage
 * 
 * @param app The Obsidian app instance
 */
export function clearAllStoredRanges(app: App): void {
    try {
        app.saveLocalStorage(CUSTOM_RANGE_KEY, null);
        app.saveLocalStorage(SAVED_RANGES_KEY, null);
        safeLogger.info('Storage', 'Cleared all stored date ranges');
        new Notice('All stored date ranges cleared');
    } catch (error) {
        safeLogger.error('Storage', 'Failed to clear stored ranges', {
            error: error instanceof Error ? error : new Error(String(error))
        });
        new Notice('Error clearing stored ranges');
    }
}

/**
 * Get storage statistics for debugging
 * 
 * @param app The Obsidian app instance
 * @returns Object with storage information
 */
export function getStorageStats(app: App): {
    hasCustomRange: boolean;
    favoriteRangesCount: number;
    customRange: DateRange | null;
    favoriteRanges: Record<string, DateRange>;
} {
    return {
        hasCustomRange: !!loadLastCustomRange(app),
        favoriteRangesCount: Object.keys(loadFavoriteRanges(app)).length,
        customRange: loadLastCustomRange(app),
        favoriteRanges: loadFavoriteRanges(app)
    };
} 
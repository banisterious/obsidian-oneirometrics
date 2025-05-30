import { Notice } from 'obsidian';
import safeLogger from '../logging/safe-logger';

/**
 * Storage helper functions for OneiroMetrics
 * Handles localStorage operations for custom date ranges and favorites
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
 * Save the last used custom date range to localStorage
 * 
 * @param range The date range to save
 */
export function saveLastCustomRange(range: DateRange): void {
    try {
        localStorage.setItem(CUSTOM_RANGE_KEY, JSON.stringify(range));
        safeLogger.debug('Storage', 'Saved custom range to localStorage', { range });
    } catch (error) {
        safeLogger.error('Storage', 'Failed to save custom range to localStorage', {
            error: error instanceof Error ? error : new Error(String(error)),
            range
        });
    }
}

/**
 * Load the last used custom date range from localStorage
 * 
 * @returns The last used date range or null if none exists
 */
export function loadLastCustomRange(): DateRange | null {
    try {
        const data = localStorage.getItem(CUSTOM_RANGE_KEY);
        if (!data) {
            safeLogger.debug('Storage', 'No custom range found in localStorage');
            return null;
        }
        
        const range = JSON.parse(data);
        
        // Validate the loaded range has required properties
        if (!range || typeof range !== 'object' || !range.start || !range.end) {
            safeLogger.warn('Storage', 'Invalid custom range data in localStorage', { data });
            return null;
        }
        
        safeLogger.debug('Storage', 'Loaded custom range from localStorage', { range });
        return range;
    } catch (error) {
        safeLogger.error('Storage', 'Failed to parse custom range from localStorage', {
            error: error instanceof Error ? error : new Error(String(error))
        });
        return null;
    }
}

/**
 * Save a favorite date range with a given name
 * 
 * @param name The name for the favorite range
 * @param range The date range to save
 */
export function saveFavoriteRange(name: string, range: DateRange): void {
    try {
        if (!name || name.trim() === '') {
            safeLogger.warn('Storage', 'Cannot save favorite range with empty name');
            return;
        }
        
        const saved = loadFavoriteRanges();
        saved[name.trim()] = range;
        localStorage.setItem(SAVED_RANGES_KEY, JSON.stringify(saved));
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
 * Load all favorite date ranges from localStorage
 * 
 * @returns Record of favorite ranges by name
 */
export function loadFavoriteRanges(): Record<string, DateRange> {
    try {
        const data = localStorage.getItem(SAVED_RANGES_KEY);
        if (!data) {
            safeLogger.debug('Storage', 'No favorite ranges found in localStorage');
            return {};
        }
        
        const ranges = JSON.parse(data);
        
        // Validate the structure
        if (!ranges || typeof ranges !== 'object') {
            safeLogger.warn('Storage', 'Invalid favorite ranges data in localStorage');
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
        
        safeLogger.debug('Storage', 'Loaded favorite ranges from localStorage', { count: Object.keys(validatedRanges).length });
        return validatedRanges;
    } catch (error) {
        safeLogger.error('Storage', 'Failed to load favorite ranges from localStorage', {
            error: error instanceof Error ? error : new Error(String(error))
        });
        return {};
    }
}

/**
 * Delete a favorite date range by name
 * 
 * @param name The name of the favorite range to delete
 */
export function deleteFavoriteRange(name: string): void {
    try {
        if (!name || name.trim() === '') {
            safeLogger.warn('Storage', 'Cannot delete favorite range with empty name');
            return;
        }
        
        const saved = loadFavoriteRanges();
        const trimmedName = name.trim();
        
        if (!(trimmedName in saved)) {
            safeLogger.warn('Storage', 'Favorite range not found for deletion', { name: trimmedName });
            new Notice(`Favorite range "${trimmedName}" not found`);
            return;
        }
        
        delete saved[trimmedName];
        localStorage.setItem(SAVED_RANGES_KEY, JSON.stringify(saved));
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
 */
export function clearAllStoredRanges(): void {
    try {
        localStorage.removeItem(CUSTOM_RANGE_KEY);
        localStorage.removeItem(SAVED_RANGES_KEY);
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
 * @returns Object with storage information
 */
export function getStorageStats(): {
    hasCustomRange: boolean;
    favoriteRangesCount: number;
    customRange: DateRange | null;
    favoriteRanges: Record<string, DateRange>;
} {
    return {
        hasCustomRange: !!loadLastCustomRange(),
        favoriteRangesCount: Object.keys(loadFavoriteRanges()).length,
        customRange: loadLastCustomRange(),
        favoriteRanges: loadFavoriteRanges()
    };
} 
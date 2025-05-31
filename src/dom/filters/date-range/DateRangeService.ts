/**
 * DateRangeService
 * 
 * A service for managing date range filters.
 * Extracted from main.ts during the refactoring process.
 */

import { App, Notice } from 'obsidian';
import safeLogger from '../../../logging/safe-logger';

// Storage keys for localStorage
const CUSTOM_RANGE_KEY = 'oneirometrics-last-custom-range';
const SAVED_RANGES_KEY = 'oneirometrics-saved-custom-ranges';

export interface DateRange {
    start: string;
    end: string;
}

export class DateRangeService {
    private customDateRange: DateRange | null = null;

    constructor(private app: App) {}

    /**
     * Open a custom date range modal
     * @param onSelect Callback function when a date range is selected
     */
    openCustomRangeModal(onSelect: (range: DateRange | null) => void): void {
        // For now, show a notice that this functionality has been moved to Date Navigator
        new Notice('Custom date range selection has been moved to the Date Navigator. Please use the "Date Navigator" button instead.');
        
        // Call the callback with null to indicate no selection
        onSelect(null);
    }
    
    /**
     * Get the current custom date range
     */
    public getCustomDateRange(): DateRange | null {
        return this.customDateRange;
    }
    
    /**
     * Set a custom date range
     * @param range The date range to set
     */
    public setCustomDateRange(range: DateRange | null): void {
        this.customDateRange = range;
        if (range) {
            this.saveLastCustomRange(range);
        }
    }
    
    /**
     * Save the last custom range to localStorage
     * @param range The range to save
     */
    private saveLastCustomRange(range: DateRange): void {
        localStorage.setItem(CUSTOM_RANGE_KEY, JSON.stringify(range));
        safeLogger.debug('Filter', 'Saved custom range to localStorage', { range });
    }
    
    /**
     * Load the last custom range from localStorage
     */
    private loadLastCustomRange(): DateRange | null {
        const data = localStorage.getItem(CUSTOM_RANGE_KEY);
        if (!data) {
            safeLogger.debug('Filter', 'No custom range found in localStorage');
            return null;
        }
        try {
            const range = JSON.parse(data);
            safeLogger.debug('Filter', 'Loaded custom range from localStorage', { range });
            this.customDateRange = range;
            return range;
        } catch (e) {
            safeLogger.error('Filter', 'Failed to parse custom range from localStorage', e);
            return null;
        }
    }
    
    /**
     * Save a favorite range
     * @param name The name of the favorite
     * @param range The range to save
     */
    public saveFavoriteRange(name: string, range: DateRange): void {
        const saved = this.loadFavoriteRanges();
        saved[name] = range;
        localStorage.setItem(SAVED_RANGES_KEY, JSON.stringify(saved));
        safeLogger.debug('Filter', 'Saved favorite range', { name, range });
    }
    
    /**
     * Load all favorite ranges
     */
    public loadFavoriteRanges(): Record<string, DateRange> {
        const data = localStorage.getItem(SAVED_RANGES_KEY);
        if (!data) return {};
        try {
            return JSON.parse(data);
        } catch {
            return {};
        }
    }
    
    /**
     * Delete a favorite range
     * @param name The name of the favorite to delete
     */
    public deleteFavoriteRange(name: string): void {
        const saved = this.loadFavoriteRanges();
        delete saved[name];
        localStorage.setItem(SAVED_RANGES_KEY, JSON.stringify(saved));
        safeLogger.debug('Filter', 'Deleted favorite range', { name });
        new Notice(`Deleted favorite: ${name}`);
    }
} 
/**
 * DateRangeService
 * 
 * A service for managing date range filters.
 * Extracted from main.ts during the refactoring process.
 */

import { App, Notice } from 'obsidian';
import { CustomDateRangeModal } from '../../modals';
import safeLogger from '../../../logging/safe-logger';

// Storage keys for localStorage
const CUSTOM_RANGE_KEY = 'oneirometrics-last-custom-range';
const SAVED_RANGES_KEY = 'oneirometrics-saved-custom-ranges';

export class DateRangeService {
    private app: App;
    private customDateRange: { start: string, end: string } | null = null;
    
    constructor(app: App) {
        this.app = app;
        this.loadLastCustomRange();
    }
    
    /**
     * Open the custom date range modal
     * @param callback Callback to run after range selection
     */
    public openCustomRangeModal(callback?: (range: { start: string, end: string } | null) => void): void {
        const favorites = this.loadFavoriteRanges();
        safeLogger.debug('Filter', 'Opening custom range modal', { favorites });
        
        new CustomDateRangeModal(this.app, (start: string, end: string, saveName?: string) => {
            if (start && end) {
                // First, update button state before making any layout changes
                requestAnimationFrame(() => {
                    const btn = document.getElementById('oom-custom-range-btn');
                    if (btn) btn.classList.add('active');
                });
                
                // Set the customDateRange
                const newRange = { start, end };
                this.customDateRange = newRange;
                
                // Persist the selection to localStorage
                this.saveLastCustomRange(newRange);
                
                // Save to plugin settings for persistence between reloads
                if (window['oneiroMetricsPlugin']) {
                    try {
                        window['oneiroMetricsPlugin'].settings.lastAppliedFilter = 'custom';
                        window['oneiroMetricsPlugin'].settings.customDateRange = newRange;
                        window['oneiroMetricsPlugin'].saveSettings().catch(err => {
                            safeLogger.error('Filter', 'Failed to save custom date range setting', err);
                        });
                    } catch (e) {
                        safeLogger.error('Filter', 'Failed to save custom date range', e);
                    }
                }
                
                // Save favorite if needed
                if (saveName) {
                    this.saveFavoriteRange(saveName, newRange);
                    // Show notification
                    new Notice(`Saved favorite: ${saveName}`);
                }
                
                // Call the callback with the new range
                if (callback) {
                    callback(newRange);
                }
            } else {
                // Handle clearing the filter
                this.customDateRange = null;
                
                // Clear the saved filter in plugin settings
                if (window['oneiroMetricsPlugin']) {
                    try {
                        window['oneiroMetricsPlugin'].settings.lastAppliedFilter = 'all';
                        window['oneiroMetricsPlugin'].settings.customDateRange = undefined;
                        window['oneiroMetricsPlugin'].saveSettings().catch(err => {
                            safeLogger.error('State', 'Failed to clear filter setting', err);
                        });
                    } catch (e) {
                        safeLogger.error('State', 'Failed to clear filter setting', e);
                    }
                }
                
                // Batch UI updates
                requestAnimationFrame(() => {
                    const btn = document.getElementById('oom-custom-range-btn');
                    if (btn) btn.classList.remove('active');
                    
                    // Trigger date range dropdown to apply the default filter
                    setTimeout(() => {
                        const dropdown = document.getElementById('oom-date-range-filter') as HTMLSelectElement;
                        if (dropdown) {
                            dropdown.value = 'all'; // Reset to show all
                            dropdown.dispatchEvent(new Event('change'));
                        }
                    }, 10);
                });
                
                // Call the callback with null
                if (callback) {
                    callback(null);
                }
            }
        }, favorites, this.deleteFavoriteRange.bind(this)).open();
    }
    
    /**
     * Get the current custom date range
     */
    public getCustomDateRange(): { start: string, end: string } | null {
        return this.customDateRange;
    }
    
    /**
     * Set a custom date range
     * @param range The date range to set
     */
    public setCustomDateRange(range: { start: string, end: string } | null): void {
        this.customDateRange = range;
        if (range) {
            this.saveLastCustomRange(range);
        }
    }
    
    /**
     * Save the last custom range to localStorage
     * @param range The range to save
     */
    private saveLastCustomRange(range: { start: string, end: string }): void {
        localStorage.setItem(CUSTOM_RANGE_KEY, JSON.stringify(range));
        safeLogger.debug('Filter', 'Saved custom range to localStorage', { range });
    }
    
    /**
     * Load the last custom range from localStorage
     */
    private loadLastCustomRange(): { start: string, end: string } | null {
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
    public saveFavoriteRange(name: string, range: { start: string, end: string }): void {
        const saved = this.loadFavoriteRanges();
        saved[name] = range;
        localStorage.setItem(SAVED_RANGES_KEY, JSON.stringify(saved));
        safeLogger.debug('Filter', 'Saved favorite range', { name, range });
    }
    
    /**
     * Load all favorite ranges
     */
    public loadFavoriteRanges(): Record<string, { start: string, end: string }> {
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
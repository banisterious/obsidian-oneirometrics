/**
 * Filter-related events
 * This module defines events related to filtering in the Dream Metrics plugin.
 */

import { App, Modal, Notice } from 'obsidian';
import { debug, info, warn, error } from '../logging';
import { ILogger } from '../logging/LoggerTypes';
import { DreamMetricsSettings } from '../types/core';
import { FilterUI } from '../dom/filters';
import safeLogger from '../logging/safe-logger';
import { withErrorHandling } from '../utils/defensive-utils';
import { DateRangeService } from '../dom/filters/date-range/DateRangeService';
import { TimeFilterManager } from '../timeFilters';

// Constants
const CUSTOM_RANGE_KEY = 'oneirometrics-last-custom-range';
const SAVED_RANGES_KEY = 'oneirometrics-saved-custom-ranges';

export class FilterEvents {
    private container: HTMLElement | null = null;
    
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private filterUI: FilterUI,
        private saveSettings: () => Promise<void>,
        private logger?: ILogger
    ) {}
    
    /**
     * Set the container element for event operations
     * 
     * @param container - The container element
     */
    public setContainer(container: HTMLElement): void {
        this.container = container;
        this.logger?.debug('UI', 'Container set for FilterEvents');
    }
    
    /**
     * Attach filter-related event listeners to the UI
     * 
     * @param previewEl - The preview element containing the filter controls
     */
    public attachFilterEventListeners(previewEl: HTMLElement): void {
        this.logger?.debug('UI', 'Attaching filter event listeners');
        
        // Find date range filter with multiple attempts
        const dateRangeFilter = this.findDateRangeFilter(previewEl);
        if (dateRangeFilter) {
            this.logger?.debug('UI', 'Found date range filter', { element: dateRangeFilter?.tagName });
            // First remove any existing event listeners by cloning the node
            const newDateRangeFilter = dateRangeFilter.cloneNode(true) as HTMLSelectElement;
            newDateRangeFilter.addEventListener('change', () => {
                this.logger?.debug('UI', 'Date range filter changed', { value: newDateRangeFilter?.value });
                
                // Clear any custom date range when using dropdown
                this.filterUI.setCustomDateRange(null);
                
                // Reset any active state on custom range button - do this in a requestAnimationFrame
                // to avoid forced reflow
                const customRangeBtn = document.getElementById('oom-custom-range-btn');
                if (customRangeBtn) {
                    requestAnimationFrame(() => {
                        customRangeBtn.classList.remove('active');
                    });
                }
                
                // Apply the filter in a delayed manner to avoid UI jank
                setTimeout(() => this.filterUI.applyFilters(previewEl), 50);
            });
            dateRangeFilter.parentNode?.replaceChild(newDateRangeFilter, dateRangeFilter);
            this.logger?.debug('UI', 'Attached event listener to date range filter');
        } else {
            this.logger?.warn('UI', 'Date range filter not found');
        }
        
        // Find custom range button with fallbacks
        const customRangeBtn = this.findCustomRangeBtn(previewEl);
        if (customRangeBtn) {
            this.logger?.debug('UI', 'Found custom range button');
            // Clone the button to remove any existing listeners
            const newCustomRangeBtn = customRangeBtn.cloneNode(true) as HTMLElement;
            newCustomRangeBtn.addEventListener('click', () => {
                this.logger?.debug('UI', 'Custom range button clicked');
                this.openCustomRangeModal();
            });
            customRangeBtn.parentNode?.replaceChild(newCustomRangeBtn, customRangeBtn);
            this.logger?.debug('UI', 'Attached event listener to custom range button');
        } else {
            this.logger?.warn('UI', 'Custom range button not found');
        }
        
        this.logger?.debug('UI', 'Finished attaching filter event listeners');
    }
    
    /**
     * Find the date range filter element with multiple fallback strategies
     * 
     * @param previewEl - The preview element to search in
     * @returns The date range filter element, or null if not found
     */
    private findDateRangeFilter(previewEl: HTMLElement): HTMLSelectElement | null {
        // Try by ID first
        const filterById = document.getElementById('oom-date-range-filter');
        if (filterById) return filterById as HTMLSelectElement;
        
        // Try by class in preview element
        const filterByClass = previewEl.querySelector('.oom-select');
        if (filterByClass) return filterByClass as HTMLSelectElement;
        
        // Try more generic selector
        const filterBySelector = previewEl.querySelector('select[id*="date-range"]');
        if (filterBySelector) return filterBySelector as HTMLSelectElement;
        
        return null;
    }
    
    /**
     * Find the custom range button with multiple fallback strategies
     * 
     * @param previewEl - The preview element to search in
     * @returns The custom range button element, or null if not found
     */
    private findCustomRangeBtn(previewEl: HTMLElement): HTMLElement | null {
        // Try by ID first
        const btnById = document.getElementById('oom-custom-range-btn');
        if (btnById) return btnById as HTMLElement;
        
        // Try by class within the filter controls
        const filterControls = previewEl.querySelector('.oom-filter-controls') || previewEl;
        const btnByClass = filterControls.querySelector('.oom-button:not(.oom-button--expand)');
        if (btnByClass) return btnByClass as HTMLElement;
        
        return null;
    }
    
    /**
     * Open the custom date range modal
     */
    public openCustomRangeModal(): void {
        const favorites = this.loadFavoriteRanges();
        this.logger?.debug('Filter', 'Opening custom range modal', { favorites });
        
        new Notice(`Custom range modal not implemented. Please use the notice system instead.`);
    }
    
    /**
     * Save the last used custom date range
     * 
     * @param range - The date range to save
     */
    private saveLastCustomRange(range: { start: string, end: string }): void {
        this.app.saveLocalStorage(CUSTOM_RANGE_KEY, range);
        this.logger?.debug('Filter', 'Saved custom range to vault-specific localStorage', { range });
    }
    
    /**
     * Load the last used custom date range
     * 
     * @returns The saved date range, or null if none exists
     */
    public loadLastCustomRange(): { start: string, end: string } | null {
        const range = this.app.loadLocalStorage(CUSTOM_RANGE_KEY);
        if (!range) {
            this.logger?.debug('Filter', 'No custom range found in vault-specific localStorage');
            return null;
        }
        this.logger?.debug('Filter', 'Loaded custom range from vault-specific localStorage', { range });
        return range;
    }
    
    /**
     * Save a favorite date range
     * 
     * @param name - The name of the favorite
     * @param range - The date range to save
     */
    private saveFavoriteRange(name: string, range: { start: string, end: string }): void {
        const saved = this.loadFavoriteRanges();
        saved[name] = range;
        this.app.saveLocalStorage(SAVED_RANGES_KEY, saved);
        this.logger?.debug('Filter', 'Saved favorite range', { name, range });
    }
    
    /**
     * Load all saved favorite date ranges
     * 
     * @returns Record of saved favorites
     */
    public loadFavoriteRanges(): Record<string, { start: string, end: string }> {
        const ranges = this.app.loadLocalStorage(SAVED_RANGES_KEY);
        if (!ranges || typeof ranges !== 'object') return {};
        return ranges;
    }
    
    /**
     * Delete a favorite date range
     * 
     * @param name - The name of the favorite to delete
     */
    private deleteFavoriteRange(name: string): void {
        const saved = this.loadFavoriteRanges();
        delete saved[name];
        this.app.saveLocalStorage(SAVED_RANGES_KEY, saved);
        this.logger?.debug('Filter', 'Deleted favorite range', { name });
        new Notice(`Deleted favorite: ${name}`);
    }
    
    /**
     * Initialize filter state from settings
     * 
     * @param previewEl - The preview element containing the filter controls
     */
    public initializeFilterState(previewEl: HTMLElement): void {
        // Check for custom date range in settings
        if (this.settings.customDateRange) {
            this.filterUI.setCustomDateRange(this.settings.customDateRange);
        }
        
        // Find the filter dropdown
        const filterDropdown = this.findDateRangeFilter(previewEl);
        if (filterDropdown) {
            // Apply saved filter if available
            this.filterUI.applyFilterToDropdown(filterDropdown, previewEl);
        }
    }
} 
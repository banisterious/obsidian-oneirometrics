/**
 * DateFilter
 * 
 * Handles date-based filtering for dream metrics tables.
 * Extracted from main.ts during the refactoring process.
 */

import { App, Notice } from 'obsidian';
import { DreamMetricsSettings } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';
import { FilterUI } from './FilterUI';

// Constants
const CUSTOM_RANGE_KEY = 'oom-custom-range';
const FILTER_DROPDOWN_ID = 'oom-date-range-filter';
const CUSTOM_RANGE_BUTTON_ID = 'oom-custom-range-btn';
const FILTER_DISPLAY_ID = 'oom-time-filter-display';

/**
 * Interface for date range
 */
export interface DateRange {
    start: string;
    end: string;
}

/**
 * Class to handle date-based filtering operations
 */
export class DateFilter {
    private filterUI: FilterUI;
    
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private saveSettings: () => Promise<void>,
        private logger?: ILogger
    ) {
        this.filterUI = new FilterUI(app, settings, saveSettings, logger);
    }
    
    /**
     * Force apply a date filter for a specific date
     * Used primarily by the DateNavigator component
     * 
     * @param date - The date to filter for
     */
    public forceApplyDateFilter(date: Date): void {
        this.logger?.debug('Filter', 'forceApplyDateFilter called', { date });
        
        if (!date || isNaN(date.getTime())) {
            this.logger?.error('Filter', 'Invalid date provided to forceApplyDateFilter');
            new Notice('Invalid date selected for filtering');
            return;
        }
        
        try {
            // Extract year, month, day components directly to avoid timezone issues
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // JavaScript months are 0-indexed
            const day = date.getDate();
            
            // Format dates as YYYY-MM-DD strings for consistency
            const start = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const end = start; // For a single day selection, start and end are the same
            
            this.logger?.debug('Filter', 'Setting date range for filtering', {
                selectedDate: date.toISOString(),
                selectedYear: year, 
                selectedMonth: month, 
                selectedDay: day,
                formattedStart: start,
                formattedEnd: end
            });
            
            // Use the FilterUI to set the custom date range
            this.filterUI.setCustomDateRange({ start, end });
            
            // Save to localStorage for persistence
            localStorage.setItem(CUSTOM_RANGE_KEY, JSON.stringify({ start, end }));
            
            // Update the plugin settings
            this.settings.lastAppliedFilter = 'custom';
            this.settings.customDateRange = { start, end };
            
            // Save settings to persist the filter
            this.saveSettings().catch(err => {
                this.logger?.error('Filter', 'Failed to save date filter to settings', err instanceof Error ? err : new Error(String(err)));
            });
            
            // Create a small delay to ensure customDateRange is set before any event handlers run
            setTimeout(() => {
                // Update UI to show filter is active
                requestAnimationFrame(() => {
                    // Update button state
                    const btn = document.getElementById(CUSTOM_RANGE_BUTTON_ID);
                    if (btn) {
                        btn.classList.add('active');
                    }
                    
                    // Update filter info display
                    const filterDisplay = document.getElementById(FILTER_DISPLAY_ID);
                    if (filterDisplay) {
                        // Quick update to give immediate feedback
                        const formattedDate = date.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                        });
                        filterDisplay.innerHTML = `<span class="oom-filter-icon">🗓️</span> <span class="oom-filter-text">Filtering for: ${formattedDate}</span>`;
                    }
                    
                    // Update dropdown to show "Custom" is selected
                    const dropdown = document.getElementById(FILTER_DROPDOWN_ID) as HTMLSelectElement;
                    if (dropdown) {
                        // Add a custom option if it doesn't exist
                        let customOption = dropdown.querySelector('option[value="custom"]') as HTMLOptionElement;
                        if (!customOption) {
                            customOption = document.createElement('option');
                            customOption.value = 'custom';
                            customOption.text = 'Custom Date';
                            dropdown.appendChild(customOption);
                        }
                        
                        // Set the value WITHOUT dispatching a change event
                        dropdown.value = 'custom';
                        
                        // Dispatch a custom event instead that won't trigger our change handler
                        dropdown.dispatchEvent(new CustomEvent('oom-value-set', { 
                            bubbles: true,
                            detail: { isDateNavigator: true }
                        }));
                    }
                });
                
                // Apply the filter after UI updates to avoid jank
                setTimeout(() => {
                    this.logger?.debug('Filter', 'Calling applyCustomDateRangeFilter');
                    this.filterUI.applyCustomDateRangeFilter();
                }, 100);
                
                this.logger?.debug('Filter', 'Filter applied for date', { date: date.toLocaleDateString() });
                new Notice(`Filtered for: ${date.toLocaleDateString()}`);
            }, 50);
        } catch (error) {
            this.logger?.error('Filter', 'Error in forceApplyDateFilter', error instanceof Error ? error : new Error(String(error)));
            new Notice('Error applying date filter');
        }
    }
    
    /**
     * Filter for a date range
     * 
     * @param startDate - The start date of the range
     * @param endDate - The end date of the range
     */
    public filterDateRange(startDate: Date, endDate: Date): void {
        this.logger?.debug('Filter', 'filterDateRange called', { startDate, endDate });
        
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            this.logger?.error('Filter', 'Invalid date range provided to filterDateRange');
            new Notice('Invalid date range selected for filtering');
            return;
        }
        
        try {
            // Format dates as YYYY-MM-DD strings
            const start = startDate.toISOString().split('T')[0];
            const end = endDate.toISOString().split('T')[0];
            
            // Call forceApplyDateRange with the formatted dates
            this.forceApplyDateRange(start, end);
        } catch (error) {
            this.logger?.error('Filter', 'Error in filterDateRange', error instanceof Error ? error : new Error(String(error)));
            new Notice('Error applying date range filter');
        }
    }
    
    /**
     * Force apply a date range filter
     * 
     * @param startDateStr - The start date string (YYYY-MM-DD)
     * @param endDateStr - The end date string (YYYY-MM-DD)
     */
    public forceApplyDateRange(startDateStr: string, endDateStr: string): void {
        this.logger?.debug('Filter', 'forceApplyDateRange called', { startDateStr, endDateStr });
        
        try {
            // Use the FilterUI to set the custom date range
            this.filterUI.setCustomDateRange({ start: startDateStr, end: endDateStr });
            
            // Save to localStorage for persistence
            localStorage.setItem(CUSTOM_RANGE_KEY, JSON.stringify({ start: startDateStr, end: endDateStr }));
            
            // Update the plugin settings
            this.settings.lastAppliedFilter = 'custom';
            this.settings.customDateRange = { start: startDateStr, end: endDateStr };
            
            // Save settings to persist the filter
            this.saveSettings().catch(err => {
                this.logger?.error('Filter', 'Failed to save date range filter to settings', err instanceof Error ? err : new Error(String(err)));
            });
            
            // Create a small delay to ensure customDateRange is set before any event handlers run
            setTimeout(() => {
                // Update UI to show filter is active
                requestAnimationFrame(() => {
                    // Update button state
                    const btn = document.getElementById(CUSTOM_RANGE_BUTTON_ID);
                    if (btn) {
                        btn.classList.add('active');
                    }
                    
                    // Update filter info display
                    const filterDisplay = document.getElementById(FILTER_DISPLAY_ID);
                    if (filterDisplay) {
                        filterDisplay.innerHTML = `<span class="oom-filter-icon">🗓️</span> <span class="oom-filter-text">Custom Range: ${startDateStr} to ${endDateStr}</span>`;
                    }
                    
                    // Update dropdown to show "Custom" is selected
                    const dropdown = document.getElementById(FILTER_DROPDOWN_ID) as HTMLSelectElement;
                    if (dropdown) {
                        // Add a custom option if it doesn't exist
                        let customOption = dropdown.querySelector('option[value="custom"]') as HTMLOptionElement;
                        if (!customOption) {
                            customOption = document.createElement('option');
                            customOption.value = 'custom';
                            customOption.text = 'Custom Date';
                            dropdown.appendChild(customOption);
                        }
                        
                        // Set the value WITHOUT dispatching a change event
                        dropdown.value = 'custom';
                        
                        // Dispatch a custom event instead that won't trigger our change handler
                        dropdown.dispatchEvent(new CustomEvent('oom-value-set', { 
                            bubbles: true,
                            detail: { isDateNavigator: true }
                        }));
                    }
                });
                
                // Apply the filter after UI updates to avoid jank
                setTimeout(() => {
                    this.logger?.debug('Filter', 'Calling applyCustomDateRangeFilter');
                    this.filterUI.applyCustomDateRangeFilter();
                }, 100);
                
                this.logger?.debug('Filter', 'Filter applied for date range', { startDateStr, endDateStr });
                new Notice(`Filtered for range: ${startDateStr} to ${endDateStr}`);
            }, 50);
        } catch (error) {
            this.logger?.error('Filter', 'Error in forceApplyDateRange', error instanceof Error ? error : new Error(String(error)));
            new Notice('Error applying date range filter');
        }
    }
    
    /**
     * Register global handler to expose forceApplyDateFilter to window object
     * This is needed for backward compatibility with code that calls window.forceApplyDateFilter
     */
    public registerGlobalHandler(): void {
        // Bind the method to preserve 'this' context
        const boundMethod = this.forceApplyDateFilter.bind(this);
        
        // Expose the method globally
        (window as any).forceApplyDateFilter = boundMethod;
        
        this.logger?.debug('Filter', 'Registered global forceApplyDateFilter handler');
    }
    
    /**
     * Clear any active date filter
     */
    public clearDateFilter(): void {
        this.logger?.debug('Filter', 'Clearing date filter');
        
        // Clear the custom date range
        this.filterUI.setCustomDateRange(null);
        
        // Update settings
        this.settings.lastAppliedFilter = 'all';
        this.settings.customDateRange = undefined;
        
        // Save settings
        this.saveSettings().catch(err => {
            this.logger?.error('Filter', 'Failed to save cleared filter settings', err instanceof Error ? err : new Error(String(err)));
        });
        
        // Update UI
        const btn = document.getElementById(CUSTOM_RANGE_BUTTON_ID);
        if (btn) {
            btn.classList.remove('active');
        }
        
        // Update dropdown
        const dropdown = document.getElementById(FILTER_DROPDOWN_ID) as HTMLSelectElement;
        if (dropdown) {
            dropdown.value = 'all';
            
            // Dispatch the change event to trigger filtering
            const event = new Event('change');
            dropdown.dispatchEvent(event);
        }
        
        new Notice('Date filter cleared');
    }
}

// Add type declaration for window object extension
declare global {
    interface Window {
        forceApplyDateFilter: (date: Date) => void;
    }
} 
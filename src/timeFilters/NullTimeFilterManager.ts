/**
 * Null Object implementation of the TimeFilterManager
 * 
 * This provides a no-op implementation of the TimeFilterManager interface
 * that can be used as a fallback when the real TimeFilterManager is not available.
 * It implements the Null Object Pattern for defensive coding.
 */

import { DateRange, TimeFilter } from '../timeFilters';

/**
 * NullTimeFilterManager implements the same interface as TimeFilterManager
 * but provides safe defaults when methods are called.
 */
export class NullTimeFilterManager {
    // Default no-op handler for filter changes
    public onFilterChange: ((filter: TimeFilter) => void) | null = null;
    
    /**
     * Singleton instance
     */
    private static instance: NullTimeFilterManager;
    
    /**
     * Get the singleton instance
     */
    public static getInstance(): NullTimeFilterManager {
        if (!NullTimeFilterManager.instance) {
            NullTimeFilterManager.instance = new NullTimeFilterManager();
        }
        return NullTimeFilterManager.instance;
    }
    
    /**
     * Private constructor to enforce singleton pattern
     */
    private constructor() {}
    
    /**
     * Set filter - no-op implementation
     */
    setFilter(filterId: string): void {
        // Do nothing
    }
    
    /**
     * Get current filter - returns a default "all time" filter
     */
    getCurrentFilter(): TimeFilter | null {
        return {
            id: 'null-filter',
            name: 'All Time',
            getDateRange: () => ({
                start: new Date(0), // Beginning of time (1970)
                end: new Date()     // Current date
            })
        };
    }
    
    /**
     * Get current range - returns a default date range
     */
    getCurrentRange(): DateRange | null {
        return {
            start: new Date(0), // Beginning of time (1970)
            end: new Date()     // Current date
        };
    }
    
    /**
     * Add custom filter - returns a default filter
     */
    addCustomFilter(start: Date, end: Date): TimeFilter {
        const defaultFilter: TimeFilter = {
            id: `custom-default`,
            name: 'Default Custom Filter',
            getDateRange: () => ({ start, end }),
            isCustom: true
        };
        return defaultFilter;
    }
    
    /**
     * Remove custom filter - no-op implementation
     */
    removeCustomFilter(filterId: string): void {
        // Do nothing
    }
    
    /**
     * Get custom filters - returns an empty array
     */
    getCustomFilters(): TimeFilter[] {
        return [];
    }
    
    /**
     * Clear current filter - no-op implementation
     */
    clearCurrentFilter(): void {
        // Do nothing
    }
    
    /**
     * Set custom range - no-op implementation
     */
    setCustomRange(start: Date, end: Date): void {
        // Do nothing
    }
} 
/**
 * FilterDisplayManager
 * 
 * Manages the display of filter information in the UI
 * Extracted from main.ts and FilterManager.ts to improve code organization
 */

import { App, Notice } from 'obsidian';
import { LoggingAdapter } from '../../logging/LoggingAdapter';

// Import for logging support
import safeLogger, { getSafeLogger } from '../../logging/safe-logger';

// For backward compatibility with the global customDateRange variable
declare global {
    var customDateRange: { start: string, end: string } | null;
    var globalLogger: any;
}

export class FilterDisplayManager {
    constructor(
        private logger?: any // Accept any logger type that has logging methods
    ) { }

    /**
     * Update the filter display with detailed information
     * 
     * @param container The container element where the filter display exists
     * @param filterType The type of filter being applied
     * @param visible Number of visible entries
     * @param total Total number of entries
     * @param invalid Number of entries with invalid dates
     * @param outOfRange Number of entries outside the filter range
     */
    public updateFilterDisplay(
        container: HTMLElement,
        filterType: string,
        visible: number,
        total: number,
        invalid: number = 0,
        outOfRange: number = 0
    ): void {
        // Use local logger if globalLogger is not defined
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        log?.debug?.('FilterDisplay', 'Updating filter display', {
            filterType,
            visible,
            total,
            invalid,
            outOfRange
        });
        
        // Mark filters as successfully applied (for global state management)
        (window as any).oomFiltersApplied = true;
        (window as any).oomFiltersPending = false;
        
        // Find the filter display element
        const filterDisplay = container.querySelector('#oom-time-filter-display') as HTMLElement;
        if (!filterDisplay) {
            log?.warn?.('FilterDisplay', 'Filter display element not found');
            return;
        }
        
        // Create the filter description based on the type
        const filterDescription = this.getFilterDescription(filterType);
        
        // Create HTML for the filter display
        let filterIcon = this.getFilterIcon(filterType);
        let filterDisplayHTML = `
            <span class="oom-filter-icon">${filterIcon}</span>
            <span class="oom-filter-text oom-filter--${filterType}">${filterDescription} (${visible} of ${total} entries)</span>
        `;
        
        // Add details if there were issues
        if (invalid > 0 || outOfRange > 0) {
            filterDisplayHTML += `<span class="oom-filter-details">`;
            
            if (invalid > 0) {
                filterDisplayHTML += `<span class="oom-filter-invalid">${invalid} invalid dates</span>`;
            }
            
            if (outOfRange > 0) {
                if (invalid > 0) filterDisplayHTML += ` | `;
                filterDisplayHTML += `<span class="oom-filter-out-of-range">${outOfRange} out of range</span>`;
            }
            
            filterDisplayHTML += `</span>`;
        }
        
        // Update the display
        filterDisplay.innerHTML = filterDisplayHTML;
        
        // Add active class for styling
        filterDisplay.classList.add('oom-filter-active');
        
        // Log success at INFO level
        log?.info?.('FilterDisplay', `Filter display updated: ${filterType}`, {
            visible,
            total,
            invalid,
            outOfRange,
            percentVisible: total > 0 ? Math.round((visible / total) * 100) : 0
        });
    }
    
    /**
     * Update the filter display for a specific date filter
     * 
     * @param container The container element where the filter display exists
     * @param selectedDate The selected date for filtering
     * @param visibleCount Number of visible entries
     */
    public updateDateFilterDisplay(
        container: HTMLElement,
        selectedDate: Date,
        visibleCount: number
    ): void {
        // Use local logger if globalLogger is not defined
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        // Find the filter display element
        const filterDisplay = container.querySelector('#oom-time-filter-display');
        if (!filterDisplay) {
            log?.warn?.('FilterDisplay', 'Filter display element not found for date filter');
            return;
        }
        
        // Format the display text
        const formattedDate = selectedDate.toLocaleDateString();
        const displayText = `Filtered by date: ${formattedDate} (${visibleCount} entries)`;
        
        // Create the HTML
        const filterDisplayHTML = `
            <span class="oom-filter-icon">📅</span>
            <span class="oom-filter-text oom-filter--date">${displayText}</span>
        `;
        
        // Update the display
        filterDisplay.innerHTML = filterDisplayHTML;
        
        // Add active class for styling
        filterDisplay.classList.add('oom-filter-active');
        
        // Show a notice to the user
        new Notice(`Date filter applied: ${visibleCount} entries visible`);
        
        log?.info?.('FilterDisplay', `Date filter display updated: ${formattedDate}`, {
            date: selectedDate.toISOString(),
            visibleCount
        });
    }
    
    /**
     * Update the filter display for a custom date range
     * 
     * @param container The container element where the filter display exists
     * @param startDate Start date string
     * @param endDate End date string
     * @param visibleCount Number of visible entries (optional)
     */
    public updateCustomRangeDisplay(
        container: HTMLElement,
        startDate: string,
        endDate: string,
        visibleCount?: number
    ): void {
        // Use local logger if globalLogger is not defined
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        // Find the filter display element
        const filterDisplay = container.querySelector('#oom-time-filter-display');
        if (!filterDisplay) {
            log?.warn?.('FilterDisplay', 'Filter display element not found for custom range');
            return;
        }
        
        // Format the display text
        let displayText = `Custom Range: ${startDate} to ${endDate}`;
        if (visibleCount !== undefined) {
            displayText += ` (${visibleCount} entries)`;
        }
        
        // Create the HTML
        const filterDisplayHTML = `
            <span class="oom-filter-icon">🗓️</span>
            <span class="oom-filter-text oom-filter--custom">${displayText}</span>
        `;
        
        // Update the display
        filterDisplay.innerHTML = filterDisplayHTML;
        
        // Add active class for styling
        filterDisplay.classList.add('oom-filter-active');
        
        log?.info?.('FilterDisplay', `Custom range display updated`, {
            startDate,
            endDate,
            visibleCount
        });
    }
    
    /**
     * Get a human-readable description for a filter type
     * 
     * @param filterType The type of filter
     * @returns A human-readable description
     */
    private getFilterDescription(filterType: string): string {
        switch (filterType) {
            case 'all':
                return 'Showing all entries';
            case 'today':
                return 'Today';
            case 'yesterday':
                return 'Yesterday';
            case 'thisWeek':
                return 'This Week';
            case 'thisMonth':
                return 'This Month';
            case 'thisYear':
                return 'This Year';
            case 'last30':
                return 'Last 30 Days';
            case 'last6months':
                return 'Last 6 Months';
            case 'last12months':
                return 'Last 12 Months';
            case 'last7':
                return 'Last 7 Days';
            case 'last90':
                return 'Last 90 Days';
            case 'currentMonth':
                return 'Current Month';
            case 'lastMonth':
                return 'Last Month';
            case 'currentYear':
                return 'Current Year';
            case 'custom':
                if (customDateRange) {
                    return `Custom range: ${customDateRange.start} to ${customDateRange.end}`;
                } else {
                    return 'Custom date range (no dates selected)';
                }
            default:
                return `Filter: ${filterType}`;
        }
    }
    
    /**
     * Get an icon for a filter type
     * 
     * @param filterType The type of filter
     * @returns An emoji icon
     */
    private getFilterIcon(filterType: string): string {
        switch (filterType) {
            case 'all':
                return '📊';
            case 'today':
                return '📅';
            case 'yesterday':
                return '⏪';
            case 'thisWeek':
            case 'thisMonth':
                return '📆';
            case 'thisYear':
            case 'custom':
                return '🗓️';
            case 'last30':
            case 'last6months':
            case 'last12months':
            case 'last7':
            case 'last90':
            case 'currentMonth':
            case 'lastMonth':
            case 'currentYear':
                return '📅';
            default:
                return '🔍';
        }
    }
} 
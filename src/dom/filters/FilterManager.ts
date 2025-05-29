/**
 * FilterManager
 * 
 * Manages the filtering of metrics data in the UI
 * Extracted from main.ts to improve code organization
 */

import { App, Notice, TFile } from 'obsidian';
import { LoggingAdapter } from '../../logging/LoggingAdapter';
import { DreamMetricsSettings } from '../../types/core';
import { parseDate } from '../../utils/date-utils';
import { FilterDisplayManager } from './FilterDisplayManager';

// Import for logging support
import safeLogger, { getSafeLogger } from '../../logging/safe-logger';

// For backward compatibility with the global customDateRange variable
declare global {
    var customDateRange: { start: string, end: string } | null;
    var globalLogger: any;
}

export class FilterManager {
    private filterDisplayManager: FilterDisplayManager;
    
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private saveSettings: () => Promise<void>,
        private saveData: (data: any) => Promise<void>,
        private logger?: any // Accept any logger type that has logging methods
    ) { 
        // Initialize global customDateRange if it doesn't exist
        if (typeof window.customDateRange === 'undefined') {
            window.customDateRange = null;
        }
        
        // Initialize the FilterDisplayManager
        this.filterDisplayManager = new FilterDisplayManager(app, logger);
    }

    /**
     * Apply filters to the metrics table
     * @param previewEl The preview element containing the metrics table
     */
    public applyFilters(previewEl: HTMLElement) {
        // Use local logger if globalLogger is not defined
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        log?.debug?.('Filter', 'applyFilters called');

        // Get important elements early before any DOM operations
        const tableContainer = previewEl.querySelector('.oom-table-container');
        const rows = previewEl.querySelectorAll('.oom-dream-row');
        
        // If no rows found, table might not be ready yet
        if (!rows.length) {
            log?.warn?.('Filter', 'No rows found in table, may need to retry later');
        }
        
        // Get the selected filter value
        const filterDropdown = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
        if (!filterDropdown) {
            log?.warn?.('Filter', 'Filter dropdown not found, unable to apply filter');
            return;
        }
        
        // CRITICAL FIX: Check for an intended filter passed directly from applyFilterToDropdown
        // This prevents filters from being overridden during the filter application process
        const intendedFilter = (window as any).oomIntendedFilter;
        const dateRange = intendedFilter || filterDropdown.value || 'all';
        
        // If we're using an intended filter, update the dropdown to match
        if (intendedFilter && filterDropdown.value !== intendedFilter) {
            filterDropdown.value = intendedFilter;
            log?.info?.('Filter', `Corrected dropdown value to match intended filter: ${intendedFilter}`);
        }
        
        // Clear the intended filter after use
        (window as any).oomIntendedFilter = null;
        log?.debug?.('Filter', `Applying filter: ${dateRange}`);
        
        // Save filter selection to settings for persistence
        this.settings.lastAppliedFilter = dateRange;
        
        // Clear customDateRange if we're not using a custom filter
        if (dateRange !== 'custom') {
            this.settings.customDateRange = undefined;
            customDateRange = null;
        } else if (customDateRange) {
            // If this is a custom filter, make sure we save the custom date range
            this.settings.customDateRange = { ...customDateRange };
        }
        
        // CRITICAL FIX: Save filter persistence data to localStorage as a backup
        try {
            localStorage.setItem('oom-last-applied-filter', dateRange);
            if (dateRange === 'custom' && customDateRange) {
                localStorage.setItem('oom-custom-date-range', JSON.stringify(customDateRange));
            } else {
                localStorage.removeItem('oom-custom-date-range');
            }
            log?.info?.('Filter', `Saved filter settings to localStorage: ${dateRange}`);
        } catch (e) {
            log?.error?.('Filter', 'Failed to save filter settings to localStorage', e);
        }
        
        // CRITICAL FIX: Force immediate settings save to ensure persistence
        // Save to both settings and localStorage for redundancy
        this.saveSettings()
            .then(() => {
                log?.info?.('Filter', 'Successfully saved filter setting to Obsidian settings');
                // Update flag to indicate filter has been successfully saved
                (window as any).oomFiltersSaved = true;
            })
            .catch(err => {
                log?.error?.('Filter', 'Failed to save filter setting to Obsidian settings', err);
            });
            
        // Also save filter settings to disk as an additional safety measure
        try {
            // Use the specific plugin's method to save data, which is properly typed
            this.saveData({
                ...this.settings,
                lastAppliedFilter: dateRange,
                customDateRange: dateRange === 'custom' ? customDateRange : undefined
            });
            log?.info?.('Filter', 'Force-saved filter settings to disk');
        } catch (e) {
            log?.error?.('Filter', 'Failed to force-save filter settings to disk', e);
        }
        
        // Apply will-change to the table container for better performance
        if (tableContainer) {
            tableContainer.setAttribute('style', 'will-change: contents;');
        }
        
        this.logger?.log('Filter', `Applying filter: ${dateRange}`, {
            totalRows: rows.length
        });

        // Prepare date ranges before any DOM operations
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const last30 = new Date(today);
        last30.setDate(today.getDate() - 30);
        const last6months = new Date(today);
        last6months.setMonth(today.getMonth() - 6);
        const last12months = new Date(today);
        last12months.setFullYear(today.getFullYear() - 1);
        
        // Process in chunks to avoid UI freezing
        const CHUNK_SIZE = 20;
        const totalRows = rows.length;
        let currentChunk = 0;
        
        // Prep counters
        let visibleCount = 0;
        let invalidDates = 0;
        let outOfRangeDates = 0;
        
        log?.debug?.('Filter', 'Starting filter process', { totalRows, dateRange });

        // Show a loading indicator for large tables
        let loadingIndicator: HTMLElement | null = null;
        if (totalRows > 50) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'oom-loading-indicator';
            loadingIndicator.textContent = 'Filtering entries...';
            loadingIndicator.style.position = 'fixed';
            loadingIndicator.style.top = '10px';
            loadingIndicator.style.right = '10px';
            loadingIndicator.style.background = 'var(--background-primary)';
            loadingIndicator.style.color = 'var(--text-normal)';
            loadingIndicator.style.padding = '8px 12px';
            loadingIndicator.style.borderRadius = '4px';
            loadingIndicator.style.boxShadow = '0 2px 8px var(--background-modifier-box-shadow)';
            loadingIndicator.style.zIndex = '1000';
            document.body.appendChild(loadingIndicator);
        }
        
        // First, pre-compute all row visibility states without touching the DOM
        const rowVisibility: boolean[] = [];
        
        for (let i = 0; i < totalRows; i++) {
            const rowEl = rows[i] as HTMLElement;
            let date = rowEl.getAttribute('data-date');
            
            // Emergency fix for missing date attributes
            if (!date) {
                this.logger?.warn('Filter', `Row ${i} has no date attribute, attempting to fix`);
                
                // Try to extract date from the date column
                const dateCell = rowEl.querySelector('.column-date');
                if (dateCell && dateCell.textContent) {
                    const dateText = dateCell.textContent.trim();
                    try {
                        // Parse the displayed date back to YYYY-MM-DD format
                        const dateObj = new Date(dateText);
                        if (!isNaN(dateObj.getTime())) {
                            date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
                            log?.debug?.('Filter', `Fixed missing date attribute on row ${i} with date`, { rowIndex: i, date });
                            rowEl.setAttribute('data-date', date);
                            dateCell.setAttribute('data-date', date);
                        }
                    } catch (e) {
                        log?.error?.('Filter', 'Failed to fix date attribute for row', { rowIndex: i, error: e as Error });
                    }
                }
                
                // If still no date after fix attempt, skip this row
                if (!date) {
                    this.logger?.warn('Filter', `Unable to fix missing date attribute on row ${i}`);
                    rowVisibility.push(false);
                    continue;
                }
            }

            const dreamDate = parseDate(date) || new Date();
            if (isNaN(dreamDate.getTime())) {
                this.logger?.error('Filter', `Invalid date for row ${i}: ${date}`);
                invalidDates++;
                rowVisibility.push(false);
                continue;
            }

            let isVisible = true;
            // Only compute visibility based on the selected date range
            // We've already calculated the date ranges above
            switch (dateRange) {
                case 'all':
                    isVisible = true;
                    break;
                case 'today':
                    isVisible = dreamDate >= today && dreamDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
                    break;
                case 'yesterday':
                    isVisible = dreamDate >= yesterday && dreamDate < today;
                    break;
                case 'thisWeek':
                    isVisible = dreamDate >= startOfWeek && dreamDate <= now;
                    break;
                case 'thisMonth':
                    isVisible = dreamDate >= startOfMonth && dreamDate <= now;
                    break;
                case 'last30':
                    isVisible = dreamDate >= last30 && dreamDate <= now;
                    break;
                case 'last6months':
                    isVisible = dreamDate >= last6months && dreamDate <= now;
                    break;
                case 'thisYear':
                    isVisible = dreamDate >= startOfYear && dreamDate <= now;
                    break;
                case 'last12months':
                    isVisible = dreamDate >= last12months && dreamDate <= now;
                    break;
                default:
                    isVisible = true;
            }

            if (isVisible) {
                visibleCount++;
                this.logger?.log('Filter', `Row ${i} visible`, {
                    date: dreamDate.toISOString(),
                    title: rowEl.querySelector('.oom-dream-title')?.textContent
                });
            } else {
                outOfRangeDates++;
            }
            
            rowVisibility.push(isVisible);
        }
        
        // Create a function to process chunks of rows
        const processNextChunk = () => {
            const start = currentChunk * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalRows);
            
            // Update loading indicator if present
            if (loadingIndicator) {
                const percent = Math.floor((currentChunk * CHUNK_SIZE / totalRows) * 100);
                loadingIndicator.textContent = `Filtering entries... ${percent}%`;
            }
            
            // Batch all DOM operations inside requestAnimationFrame
            requestAnimationFrame(() => {
                // Apply visibility to this chunk of rows
                for (let i = start; i < end; i++) {
                    const rowEl = rows[i] as HTMLElement;
                    const isVisible = rowVisibility[i];
                    
                    // Ensure row has a data-date attribute
                    if (!rowEl.hasAttribute('data-date')) {
                        const dateCell = rowEl.querySelector('.column-date');
                        if (dateCell && dateCell.textContent) {
                            try {
                                const dateObj = new Date(dateCell.textContent.trim());
                                if (!isNaN(dateObj.getTime())) {
                                    // Format as YYYY-MM-DD
                                    const dateStr = dateObj.toISOString().split('T')[0];
                                    rowEl.setAttribute('data-date', dateStr);
                                    log?.debug?.('Filter', `Added missing date attribute to row ${i}`);
                                }
                            } catch (e) {
                                log?.warn?.('Filter', `Could not add date attribute to row ${i}`, e as Error);
                            }
                        }
                    }
                    
                    if (isVisible) {
                        rowEl.classList.remove('oom-row--hidden');
                        rowEl.classList.add('oom-row--visible');
                    } else {
                        rowEl.classList.add('oom-row--hidden');
                        rowEl.classList.remove('oom-row--visible');
                    }
                }
                
                // Move to next chunk or finish
                currentChunk++;
                
                if (currentChunk * CHUNK_SIZE < totalRows) {
                    // Schedule next chunk with a slight delay to allow rendering
                    setTimeout(() => processNextChunk(), 5);
                } else {
                    // All done, update UI
                    if (loadingIndicator) {
                        document.body.removeChild(loadingIndicator);
                    }
                    
                    // Reset will-change property once filtering is complete
                    if (tableContainer) {
                        requestAnimationFrame(() => {
                            tableContainer.removeAttribute('style');
                        });
                    }
                    
                    // Update summary table with filtered metrics
                    const filteredMetrics = this.collectVisibleRowMetrics(previewEl);
                    this.updateSummaryTable(previewEl, filteredMetrics);
                    
                    // Update filter display in the next animation frame
                    requestAnimationFrame(() => {
                        this.updateFilterDisplayWithDetails(dateRange, visibleCount, totalRows, invalidDates, outOfRangeDates, previewEl);
                    });
                }
            });
        };
        
        // Delay the start of processing slightly to avoid UI jank
        setTimeout(() => processNextChunk(), 20);
    }

    /**
     * Apply a filter to a dropdown element
     * @param filterDropdown The dropdown element
     * @param previewEl The preview element containing the metrics table
     * @returns Whether the filter was successfully applied
     */
    public applyFilterToDropdown(filterDropdown: HTMLSelectElement, previewEl: HTMLElement): boolean {
        // Use local logger if globalLogger is not defined
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        log?.debug?.('Filter', 'Applying filter from dropdown');
        
        // Flag to know if filters are already being applied
        // This prevents filter-application loop from concurrent calls
        if ((window as any).oomFiltersPending) {
            log?.debug?.('Filter', 'Filters already being applied, skipping this call');
            return false;
        }
        
        // Set flags to indicate filter application is in progress
        (window as any).oomFiltersPending = true;
        (window as any).oomFiltersSaved = false;
        (window as any).oomFiltersApplied = false;
        
        // Get the selected filter value
        const filterValue = filterDropdown.value;
        log?.debug?.('Filter', `Selected filter: ${filterValue}`);
        
        // Set intended filter to ensure dropdown selection is respected
        (window as any).oomIntendedFilter = filterValue;
        
        // Apply the filter
        this.applyFilters(previewEl);
        
        return true;
    }

    /**
     * Force apply a filter directly to the DOM
     * @param previewEl The preview element containing the metrics table
     * @param startDate The start date of the filter range
     * @param endDate The end date of the filter range
     */
    public forceApplyFilterDirect(previewEl: HTMLElement, startDate: string, endDate: string): void {
        // Use local logger if globalLogger is not defined
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        log?.debug?.('Filter', 'Force applying date filter directly', { startDate, endDate });
        
        // Set global custom date range for other parts of the app
        customDateRange = { start: startDate, end: endDate };
        
        // Get the filter dropdown
        const filterDropdown = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
        if (!filterDropdown) {
            log?.error?.('Filter', 'Filter dropdown not found, unable to apply direct filter');
            return;
        }
        
        // Set the dropdown to use a custom range
        filterDropdown.value = 'custom';
        
        // Set the intended filter to ensure it's not overridden
        (window as any).oomIntendedFilter = 'custom';
        
        // Apply the filter
        this.applyFilters(previewEl);
        
        // Use the FilterDisplayManager to update the display
        this.filterDisplayManager.updateCustomRangeDisplay(previewEl, startDate, endDate);
        
        // Log application complete
        log?.info?.('Filter', 'Direct filter application complete', {
            startDate,
            endDate,
            appliedFilter: 'custom'
        });
    }

    /**
     * Initialize the filter system
     */
    public initialize(): void {
        // Use local logger if globalLogger is not defined
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        // Log initialization with a safe approach
        log?.debug?.('Filter', 'Initializing filter system');
        
        // Try to restore filter settings from localStorage as a fallback
        try {
            const lastAppliedFilter = localStorage.getItem('oom-last-applied-filter');
            if (lastAppliedFilter && !this.settings.lastAppliedFilter) {
                this.settings.lastAppliedFilter = lastAppliedFilter;
                log?.info?.('Filter', `Restored last filter from localStorage: ${lastAppliedFilter}`);
            }
            
            const customDateRangeStr = localStorage.getItem('oom-custom-date-range');
            if (customDateRangeStr && !this.settings.customDateRange) {
                try {
                    const parsedRange = JSON.parse(customDateRangeStr);
                    if (parsedRange && parsedRange.start && parsedRange.end) {
                        this.settings.customDateRange = parsedRange;
                        customDateRange = parsedRange;
                        log?.info?.('Filter', 'Restored custom date range from localStorage', parsedRange);
                    }
                } catch (e) {
                    log?.error?.('Filter', 'Failed to parse custom date range from localStorage', e);
                }
            }
        } catch (e) {
            log?.error?.('Filter', 'Failed to restore filter settings from localStorage', e);
        }
        
        // Initialize global filter state
        (window as any).oomFiltersPending = false;
        (window as any).oomFiltersSaved = true;
        (window as any).oomFiltersApplied = false;
        
        // Also initialize the global customDateRange if we have it in settings
        if (this.settings.customDateRange) {
            customDateRange = { ...this.settings.customDateRange };
            log?.info?.('Filter', 'Initialized global customDateRange from settings');
        }
    }

    /**
     * This function updates the filter display with detailed information
     */
    private updateFilterDisplayWithDetails(
        filterType: string, 
        visible: number, 
        total: number, 
        invalid: number, 
        outOfRange: number,
        previewEl: HTMLElement
    ) {
        // Use the FilterDisplayManager to handle display updates
        this.filterDisplayManager.updateFilterDisplay(
            previewEl,
            filterType,
            visible,
            total,
            invalid,
            outOfRange
        );
        
        // Collect metrics from visible rows only
        const metrics = this.collectVisibleRowMetrics(previewEl);
        
        // Update the summary table with these metrics
        this.updateSummaryTable(previewEl, metrics);
    }

    /**
     * Collect metrics data from visible rows
     */
    private collectVisibleRowMetrics(container: HTMLElement): Record<string, number[]> {
        // Use local logger if globalLogger is not defined
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        log?.debug?.('Metrics', 'Collecting metrics from visible rows');
        
        // CRITICAL FIX: Ensure we're selecting the correct table and rows
        // Get only the main metrics table, not any other tables
        const mainTable = container.querySelector('table:not(.oom-stats-table)');
        if (!mainTable) {
            log?.warn?.('Metrics', 'Main table not found for metrics collection');
            return {};
        }
        
        // Get visible rows from the main table only (not the summary stats table)
        const visibleRows = mainTable.querySelectorAll('tr.oom-dream-row:not([style*="display: none"])');
        
        // Log what we found for debugging
        log?.info?.('Metrics', `Found ${visibleRows.length} visible rows for metrics collection`);
        
        const metrics: Record<string, number[]> = {};
        
        // First get header cells to map column indices to metric names
        const headerRow = mainTable.querySelector('thead tr');
        if (!headerRow) return metrics;
        
        const headerCells = headerRow.querySelectorAll('th');
        
        // Log header cells for debugging
        log?.debug?.('Metrics', `Found ${headerCells.length} header cells`);
        
        // Map column indices to their header names for accurate data collection
        const headerMapping: Record<number, string> = {};
        headerCells.forEach((cell, index) => {
            // Get the column name
            const metricName = cell.textContent?.trim();
            if (metricName) {
                headerMapping[index] = metricName;
                log?.debug?.('Metrics', `Mapped column ${index} to "${metricName}"`);
            }
        });
        
        // Now collect the metrics from each visible row
        visibleRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                // Skip if we don't have a header mapping for this column
                if (!headerMapping[index]) return;
                
                const metricName = headerMapping[index];
                const cellValue = cell.textContent?.trim();
                
                // If the cell contains a number, add it to the metrics
                if (cellValue && !isNaN(Number(cellValue))) {
                    if (!metrics[metricName]) {
                        metrics[metricName] = [];
                    }
                    metrics[metricName].push(Number(cellValue));
                }
            });
        });
        
        log?.debug?.('Metrics', 'Finished collecting metrics from visible rows', { 
            metricsFound: Object.keys(metrics).length,
            dataPoints: Object.values(metrics).reduce((sum, arr) => sum + arr.length, 0),
            visibleRows: visibleRows.length
        });
        
        return metrics;
    }

    /**
     * Update the summary table with metrics from visible rows
     */
    private updateSummaryTable(container: HTMLElement, metrics: Record<string, number[]>) {
        // Use local logger if globalLogger is not defined
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        log?.debug?.('UI', 'Updating summary table with filtered metrics');
        const summarySection = container.querySelector('.oom-stats-section');
        if (!summarySection) {
            log?.warn?.('UI', 'No summary section found for metrics update');
            return;
        }
        
        // Get the metric names (column headers)
        const metricNames = Object.keys(metrics);
        
        // Log what metrics we found for debugging
        log?.debug?.('Metrics', 'Processing metrics for summary table', {
            foundMetrics: metricNames.join(', '),
            count: metricNames.length
        });
        
        // Don't try to update if we don't have any metrics
        if (metricNames.length === 0) return;
        
        // CRITICAL FIX: Completely replace the summary table to prevent multiple table issue
        if (summarySection) {
            try {
                // Check if the summary section has the right structure
                if (summarySection.classList.contains('oom-stats-section')) {
                    
                    // Log what we're about to do
                    log?.debug?.('UI', 'Completely replacing summary section content');
                    
                    // Force reflow before adding new content to ensure clean replacement
                    setTimeout(() => {
                        // Build a new summary table HTML
                        let newTableHTML = '<table class="oom-stats-table"><thead><tr><th>Metric</th><th>Count</th><th>Sum</th><th>Min</th><th>Max</th><th>Avg</th></tr></thead><tbody>';
                        
                        // Add rows for each metric
                        metricNames.forEach(metricName => {
                            const values = metrics[metricName];
                            if (values && values.length > 0) {
                                const count = values.length;
                                const sum = values.reduce((a, b) => a + b, 0);
                                const min = Math.min(...values);
                                const max = Math.max(...values);
                                const avg = sum / count;
                                
                                newTableHTML += `<tr><td>${metricName}</td><td>${count}</td><td>${sum.toFixed(1)}</td><td>${min.toFixed(1)}</td><td>${max.toFixed(1)}</td><td>${avg.toFixed(1)}</td></tr>`;
                            }
                        });
                        
                        newTableHTML += '</tbody></table>';
                        
                        // Replace the summary section content with the new table
                        summarySection.innerHTML = newTableHTML;
                        
                        // CRITICAL FIX: Check for and fix multiple stats tables issue
                        // This happens when the summary table gets duplicated due to lifecycle events
                        const allStatsTables = container.querySelectorAll('.oom-stats-table');
                        if (allStatsTables.length > 1) {
                            // Found multiple stats tables - something went wrong
                            log?.error?.('UI', `Found ${allStatsTables.length} stats tables after update - attempting emergency fix`);
                            
                            // Emergency fix: Keep only the first stats table and remove others
                            for (let i = 1; i < allStatsTables.length; i++) {
                                allStatsTables[i].remove();
                            }
                        }
                    }, 50);
                } else {
                    log?.error?.('UI', 'Attempted to update incorrect element as summary section', {
                        foundElement: summarySection.className
                    });
                }
            } catch (e) {
                console.error('Failed to update summary table:', e);
            }
        }
    }
} 
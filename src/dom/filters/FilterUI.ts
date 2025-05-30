/**
 * FilterUI
 * 
 * Handles the filtering functionality for dream metrics tables.
 * Extracted from main.ts during the refactoring process.
 */

import { App, Notice } from 'obsidian';
import { DreamMetricsSettings } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';
import { parseDate } from '../../utils/date-utils';
import { FilterDisplayManager } from './FilterDisplayManager';
import { MetricsCollector, TableStatisticsUpdater } from '../../metrics';
import { TableManager } from '../../dom/tables';

// Constants
const CUSTOM_RANGE_KEY = 'oom-custom-range';

// Global state for custom date range (extracted from main.ts global variable)
let customDateRange: { start: string, end: string } | null = null;

export class FilterUI {
    private container: HTMLElement | null = null;
    private filterDisplayManager: FilterDisplayManager;
    private metricsCollector: MetricsCollector;
    private tableStatisticsUpdater: TableStatisticsUpdater;
    private tableManager: TableManager;
    
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private saveSettings: () => Promise<void>,
        private logger?: ILogger
    ) {
        this.filterDisplayManager = new FilterDisplayManager(logger);
        const plugin = (window as any).oneiroMetricsPlugin;
        this.metricsCollector = new MetricsCollector(app, plugin, logger);
        this.tableStatisticsUpdater = new TableStatisticsUpdater(logger);
        this.tableManager = new TableManager(app, settings, logger);
    }
    
    /**
     * Set the container element for filter operations
     * 
     * @param container - The container element
     */
    public setContainer(container: HTMLElement): void {
        this.container = container;
        this.logger?.debug('UI', 'Container set for FilterUI');
    }
    
    /**
     * Apply filters to the dream metrics table
     * 
     * @param previewEl - The preview element containing the table
     */
    public applyFilters(previewEl: HTMLElement): void {
        this.logger?.debug('Filter', 'applyFilters called');

        // Get important elements early before any DOM operations
        const tableContainer = previewEl.querySelector('.oom-table-container');
        const rows = previewEl.querySelectorAll('.oom-dream-row');
        
        // If no rows found, table might not be ready yet
        if (!rows.length) {
            this.logger?.warn('Filter', 'No rows found in table, may need to retry later');
        }
        
        // Get the selected filter value
        const filterDropdown = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
        if (!filterDropdown) {
            this.logger?.warn('Filter', 'Filter dropdown not found, unable to apply filter');
            return;
        }
        
        // CRITICAL FIX: Check for an intended filter passed directly from applyFilterToDropdown
        // This prevents filters from being overridden during the filter application process
        const intendedFilter = (window as any).oomIntendedFilter;
        const dateRange = intendedFilter || filterDropdown.value || 'all';
        
        // If we're using an intended filter, update the dropdown to match
        if (intendedFilter && filterDropdown.value !== intendedFilter) {
            filterDropdown.value = intendedFilter;
            this.logger?.info('Filter', `Corrected dropdown value to match intended filter: ${intendedFilter}`);
        }
        
        // Clear the intended filter after use
        (window as any).oomIntendedFilter = null;
        this.logger?.debug('Filter', `Applying filter: ${dateRange}`);
        
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
            this.logger?.info('Filter', `Saved filter settings to localStorage: ${dateRange}`);
        } catch (e) {
            this.logger?.error('Filter', 'Failed to save filter settings to localStorage', e as Error);
        }
        
        // CRITICAL FIX: Force immediate settings save to ensure persistence
        // Save to both settings and localStorage for redundancy
        this.saveSettings()
            .then(() => {
                this.logger?.info('Filter', 'Successfully saved filter setting to Obsidian settings');
                // Update flag to indicate filter has been successfully saved
                (window as any).oomFiltersSaved = true;
            })
            .catch(err => {
                this.logger?.error('Filter', 'Failed to save filter setting to Obsidian settings', err as Error);
            });
        
        // Apply will-change to the table container for better performance
        if (tableContainer) {
            tableContainer.setAttribute('style', 'will-change: contents;');
        }
        
        this.logger?.debug('Filter', `Applying filter: ${dateRange}`, {
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
        
        this.logger?.debug('Filter', 'Starting filter process', { totalRows, dateRange });

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
                            this.logger?.debug('Filter', `Fixed missing date attribute on row ${i} with date`, { rowIndex: i, date });
                            rowEl.setAttribute('data-date', date);
                            dateCell.setAttribute('data-date', date);
                        }
                    } catch (e) {
                        this.logger?.error('Filter', 'Failed to fix date attribute for row', { rowIndex: i, error: e as Error });
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
                case 'thisYear':
                    isVisible = dreamDate >= startOfYear && dreamDate <= now;
                    break;
                case 'last30':
                    isVisible = dreamDate >= last30 && dreamDate <= now;
                    break;
                case 'last6months':
                    isVisible = dreamDate >= last6months && dreamDate <= now;
                    break;
                case 'last12months':
                    isVisible = dreamDate >= last12months && dreamDate <= now;
                    break;
                case 'custom':
                    if (customDateRange) {
                        const startDate = parseDate(customDateRange.start);
                        const endDate = parseDate(customDateRange.end);
                        
                        if (startDate && endDate) {
                            // Ensure endDate includes the full day by setting it to end of day
                            endDate.setHours(23, 59, 59, 999);
                            isVisible = dreamDate >= startDate && dreamDate <= endDate;
                        } else {
                            this.logger?.error('Filter', 'Invalid custom date range', { customDateRange });
                            isVisible = true; // Show all if custom date range is invalid
                        }
                    } else {
                        this.logger?.warn('Filter', 'Custom date range selected but no range defined');
                        isVisible = true; // Show all if custom date range is not defined
                    }
                    break;
                default:
                    isVisible = true;
                    break;
            }

            if (!isVisible) {
                outOfRangeDates++;
            } else {
                visibleCount++;
            }

            rowVisibility.push(isVisible);
        }

        // Now update the DOM with the precomputed visibility states
        const processNextChunk = () => {
            const end = Math.min(currentChunk + CHUNK_SIZE, totalRows);
            
            for (let i = currentChunk; i < end; i++) {
                const rowEl = rows[i] as HTMLElement;
                const isVisible = rowVisibility[i];
                
                if (isVisible) {
                    rowEl.style.display = '';
                    rowEl.classList.add('oom-row--visible');
                    rowEl.classList.remove('oom-row--hidden');
                } else {
                    rowEl.style.display = 'none';
                    rowEl.classList.add('oom-row--hidden');
                    rowEl.classList.remove('oom-row--visible');
                }
            }
            
            currentChunk = end;
            
            if (currentChunk < totalRows) {
                requestAnimationFrame(processNextChunk);
            } else {
                // All chunks processed
                this.logger?.info('Filter', 'Filter applied', { 
                    visible: visibleCount, 
                    hidden: totalRows - visibleCount,
                    invalidDates,
                    outOfRangeDates
                });
                
                // Update the filter display
                this.filterDisplayManager.updateFilterDisplay(
                    previewEl,
                    dateRange,
                    visibleCount,
                    totalRows,
                    invalidDates,
                    outOfRangeDates
                );
                
                // Remove loading indicator if it exists
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
                
                // Recalculate metrics based on visible rows
                try {
                    // Use our MetricsCollector and TableStatisticsUpdater classes
                    const filteredMetrics = this.metricsCollector.collectVisibleRowMetrics(previewEl);
                    this.tableStatisticsUpdater.updateSummaryTable(previewEl, filteredMetrics);
                    this.logger?.debug('Filter', 'Updated summary table after filtering');
                } catch (e) {
                    this.logger?.error('Filter', 'Error updating summary table after filtering', e as Error);
                }
                
                // Remove the will-change property to free up resources
                if (tableContainer) {
                    (tableContainer as HTMLElement).style.willChange = 'auto';
                }
            }
        };
        
        // Start processing chunks
        requestAnimationFrame(processNextChunk);
    }
    
    /**
     * Apply filter to dropdown and handle the saved filter state
     * 
     * @param filterDropdown - The filter dropdown element
     * @param previewEl - The preview element containing the table
     * @returns true if a filter was applied, false otherwise
     */
    public applyFilterToDropdown(filterDropdown: HTMLSelectElement, previewEl: HTMLElement): boolean {
        // Check for saved filter
        if (this.settings.lastAppliedFilter) {
            this.logger?.info('Filter', `Applying saved filter: ${this.settings.lastAppliedFilter}`, {
                customRange: this.settings.customDateRange ? JSON.stringify(this.settings.customDateRange) : 'none'
            });
            
            try {
                // First ensure all tables are properly initialized
                this.tableManager.initializeTableRowClasses();
                
                // Apply date attribute repairs for correct filtering
                const rows = previewEl.querySelectorAll('.oom-dream-row');
                if (rows.length > 0) {
                    this.logger?.info('Filter', `Found ${rows.length} table rows before applying filter`);
                } else {
                    this.logger?.warn('Filter', 'No table rows found, may need to wait for DOM');
                    return false; // Exit and let next retry handle it
                }
                
                // Set the dropdown value and store the intended filter value
                filterDropdown.value = this.settings.lastAppliedFilter;
                
                // CRITICAL FIX: Store the intended filter value globally to ensure it doesn't get overridden
                const intendedFilter = this.settings.lastAppliedFilter;
                (window as any).oomIntendedFilter = intendedFilter;
                
                this.logger?.info('Filter', `Setting global intended filter: ${intendedFilter}`);
                
                // Apply the appropriate filter
                if (intendedFilter === 'custom' && this.settings.customDateRange) {
                    // First set global customDateRange
                    customDateRange = this.settings.customDateRange;
                    
                    // Update custom range button state
                    const customRangeBtn = previewEl.querySelector('#oom-custom-range-btn');
                    if (customRangeBtn) {
                        (customRangeBtn as HTMLElement).classList.add('active');
                    }
                    
                    // Try multiple approaches to ensure filter is applied
                    this.logger?.info('Filter', 'Applying custom date range filter with multiple approaches');
                    
                    // 1. First call the function directly
                    this.applyCustomDateRangeFilter();
                    
                    // 2. Then force apply directly to DOM as backup
                    this.forceApplyFilterDirect(
                        previewEl, 
                        this.settings.customDateRange.start, 
                        this.settings.customDateRange.end
                    );
                    
                    // 3. Update the filter display using FilterDisplayManager
                    if (this.settings.customDateRange) {
                        const range = this.settings.customDateRange;
                        this.filterDisplayManager.updateCustomRangeDisplay(previewEl, range.start, range.end);
                    }
                } else {
                    // Apply standard filter
                    this.applyFilters(previewEl);
                }
                
                // Mark as successfully applied
                (window as any).oomFiltersApplied = true;
                (window as any).oomFiltersPending = false;
                
                this.logger?.info('Filter', `Filter persistence: Successfully applied saved filter`);
                new Notice('OneiroMetrics: Restored your previous filter settings');
                
                // Update summary table after filter application
                setTimeout(() => {
                    try {
                        // Use our MetricsCollector and TableStatisticsUpdater classes
                        const filteredMetrics = this.metricsCollector.collectVisibleRowMetrics(previewEl);
                        this.tableStatisticsUpdater.updateSummaryTable(previewEl, filteredMetrics);
                        this.logger?.info('Filter', 'Updated summary table after filter application');
                    } catch (e) {
                        this.logger?.error('Filter', 'Error updating summary table', e as Error);
                    }
                }, 500);
                
                return true;
            } catch (e) {
                this.logger?.error('Filter', 'Error applying saved filter', e as Error);
                return false;
            }
        } else {
            this.logger?.debug('Filter', 'No saved filter found in settings');
            return false;
        }
    }
    
    /**
     * Force apply filter directly to the DOM (last resort method)
     * 
     * @param previewEl - The preview element containing the table
     * @param startDate - Start date string in YYYY-MM-DD format
     * @param endDate - End date string in YYYY-MM-DD format
     */
    public forceApplyFilterDirect(previewEl: HTMLElement, startDate: string, endDate: string): void {
        this.logger?.debug('Filter', 'Force applying filter directly to DOM');
        try {
            const rows = previewEl.querySelectorAll('.oom-dream-row');
            this.logger?.debug('Filter', 'Found rows to filter', { count: rows.length });
            
            let visibleCount = 0;
            
            rows.forEach(row => {
                const dateAttr = row.getAttribute('data-date');
                if (!dateAttr) {
                    (row as HTMLElement).style.display = 'none';
                    return;
                }
                
                if (dateAttr >= startDate && dateAttr <= endDate) {
                    (row as HTMLElement).style.display = '';
                    (row as HTMLElement).classList.add('oom-row--visible');
                    (row as HTMLElement).classList.remove('oom-row--hidden');
                    visibleCount++;
                } else {
                    (row as HTMLElement).style.display = 'none';
                    (row as HTMLElement).classList.add('oom-row--hidden');
                    (row as HTMLElement).classList.remove('oom-row--visible');
                }
            });
            
            // Update filter display using FilterDisplayManager
            this.filterDisplayManager.updateCustomRangeDisplay(previewEl, startDate, endDate, visibleCount);
        } catch (e) {
            this.logger?.error('Filter', 'Error in direct filter application', e as Error);
        }
    }
    
    /**
     * Force apply a date filter to the view
     * 
     * @param date - The date to filter by
     */
    public forceApplyDateFilter(date: Date): void {
        if (!this.container) {
            this.logger?.warn('Filter', 'Container not set, cannot apply date filter');
            return;
        }
        
        this.logger?.debug('Filter', 'Force applying date filter', { date: date.toISOString() });
        
        try {
            const previewEl = this.container;
            const rows = previewEl.querySelectorAll('.oom-dream-row');
            
            this.logger?.debug('Filter', 'Found rows to filter', { count: rows.length });
            
            // Convert the target date to YYYY-MM-DD string for comparison
            const selectedDate = date;
            const startStr = selectedDate.toISOString().split('T')[0];
            
            // Track some metrics for debugging
            let visibleCount = 0;
            let hiddenCount = 0;
            let invalidDateCount = 0;
            
            // Apply the filter
            rows.forEach(row => {
                const dateCell = row.querySelector('.column-date');
                if (!dateCell || !dateCell.textContent) {
                    (row as HTMLElement).style.display = 'none';
                    hiddenCount++;
                    return;
                }
                
                try {
                    // Parse date from cell
                    const dateText = dateCell.textContent.trim();
                    const rowDate = new Date(dateText);
                    const rowDateStr = rowDate.toISOString().split('T')[0];
                    
                    // Check if the date matches the selected date
                    const isVisible = rowDateStr === startStr;
                    
                    if (isVisible) {
                        (row as HTMLElement).classList.remove('oom-row--hidden');
                        (row as HTMLElement).classList.add('oom-row--visible');
                        visibleCount++;
                    } else {
                        (row as HTMLElement).classList.add('oom-row--hidden');
                        (row as HTMLElement).classList.remove('oom-row--visible');
                        hiddenCount++;
                    }
                } catch (e) {
                    this.logger?.error('Filter', 'Error processing row date', { 
                        dateText: dateCell.textContent, 
                        error: e instanceof Error ? e : new Error(String(e))
                    });
                    invalidDateCount++;
                    (row as HTMLElement).classList.add('oom-row--hidden');
                    (row as HTMLElement).classList.remove('oom-row--visible');
                }
            });
            
            this.logger?.debug('Filter', 'Date filter applied', { 
                visibleCount, 
                hiddenCount, 
                invalidDateCount 
            });
            
            // Update the filter display using FilterDisplayManager
            this.filterDisplayManager.updateDateFilterDisplay(previewEl, selectedDate, visibleCount);
            
            // Update summary table with filtered metrics
            try {
                // Use our MetricsCollector and TableStatisticsUpdater classes
                const filteredMetrics = this.metricsCollector.collectVisibleRowMetrics(previewEl);
                this.tableStatisticsUpdater.updateSummaryTable(previewEl, filteredMetrics);
                this.logger?.debug('Filter', 'Updated summary table after date filtering');
            } catch (e) {
                this.logger?.error('Filter', 'Error updating summary table after date filtering', 
                    e instanceof Error ? e : new Error(String(e)));
            }
        } catch (e) {
            this.logger?.error('Filter', 'Error applying date filter', 
                e instanceof Error ? e : new Error(String(e)));
        }
    }
    
    /**
     * Apply a custom date range filter
     */
    public applyCustomDateRangeFilter(): void {
        this.logger?.debug('Filter', 'Custom date range filter applied', { customDateRange });
        
        if (!customDateRange) {
            this.logger?.warn('Filter', 'No custom date range found, filter cannot be applied');
            return;
        }
        
        const previewEl = document.querySelector('.oom-metrics-container') as HTMLElement;
        if (!previewEl) {
            this.logger?.warn('Filter', 'No metrics container found, filter cannot be applied');
            return;
        }
        
        // Ensure table styles are initialized before filtering
        this.tableManager.initializeTableRowClasses();
        
        // Performance optimization: Prevent layout thrashing by reading all data at once
        const tableContainer = previewEl.querySelector('.oom-table-container');
        if (tableContainer) {
            // Set will-change to optimize for upcoming changes
            tableContainer.setAttribute('style', 'will-change: transform, contents; contain: content;');
        }
        
        // Store the date range values safely
        const startDateString = customDateRange?.start || '';
        const endDateString = customDateRange?.end || '';
        
        // Ensure we create the dates in a timezone-safe way
        const startYMD = startDateString.split('-').map(n => parseInt(n));
        const endYMD = endDateString.split('-').map(n => parseInt(n));
        
        // Validate the date parts
        if (startYMD.length !== 3 || endYMD.length !== 3 || 
            startYMD.some(isNaN) || endYMD.some(isNaN)) {
            this.logger?.error('Filter', 'Invalid date format in custom range', {
                startDateString,
                endDateString
            });
            return;
        }
        
        // Create date objects with the exact day boundaries
        const startDate = new Date(startYMD[0], startYMD[1] - 1, startYMD[2], 0, 0, 0, 0);
        const endDate = new Date(endYMD[0], endYMD[1] - 1, endYMD[2], 23, 59, 59, 999);
        
        // Sanity check on the dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            this.logger?.error('Filter', 'Could not create valid date objects for filter', {
                startYMD, 
                endYMD
            });
            return;
        }
        
        this.logger?.debug('Filter', 'Using date objects for comparison', {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            dateRange: `${startDateString} to ${endDateString}`
        });
        
        // Apply the filter directly through the dropdown
        const dropdown = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
        if (dropdown) {
            // Set dropdown to custom first
            dropdown.value = 'custom';
            
            // Then apply the filter
            this.applyFilters(previewEl);
        } else {
            this.logger?.warn('Filter', 'Filter dropdown not found, falling back to direct DOM manipulation');
            
            // If no dropdown, apply filter directly
            this.forceApplyFilterDirect(previewEl, startDateString, endDateString);
        }
    }
    
    /**
     * Get the current custom date range
     * 
     * @returns The current custom date range, or null if none is set
     */
    public getCustomDateRange(): { start: string, end: string } | null {
        return customDateRange;
    }
    
    /**
     * Set the custom date range
     * 
     * @param range - The custom date range to set
     */
    public setCustomDateRange(range: { start: string, end: string } | null): void {
        customDateRange = range;
        
        // Save to settings
        if (range) {
            this.settings.customDateRange = { ...range };
        } else {
            this.settings.customDateRange = undefined;
        }
        
        // Save to localStorage
        if (range) {
            localStorage.setItem(CUSTOM_RANGE_KEY, JSON.stringify(range));
        } else {
            localStorage.removeItem(CUSTOM_RANGE_KEY);
        }
    }
} 
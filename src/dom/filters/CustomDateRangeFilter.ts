// Copyright (c) 2025 John Banister
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { App, Notice } from 'obsidian';
import { getLogger } from '../../logging';
import { MetricsCollector } from '../../metrics/MetricsCollector';
import { TableStatisticsUpdater } from '../../metrics/TableStatisticsUpdater';
import { TableManager } from '../tables/TableManager';

const logger = getLogger('CustomDateRangeFilter');

/**
 * Interface for date range filtering
 */
export interface DateRange {
    start: string;
    end: string;
}

/**
 * CustomDateRangeFilter handles complex date range filtering with performance optimization
 * for large tables, including chunked processing and loading indicators.
 */
export class CustomDateRangeFilter {
    private metricsCollector: MetricsCollector;
    private tableStatisticsUpdater: TableStatisticsUpdater;
    private tableManager: TableManager;

    constructor(
        private app: App,
        metricsCollector: MetricsCollector,
        tableStatisticsUpdater: TableStatisticsUpdater,
        tableManager: TableManager
    ) {
        this.metricsCollector = metricsCollector;
        this.tableStatisticsUpdater = tableStatisticsUpdater;
        this.tableManager = tableManager;
    }

    /**
     * Apply custom date range filter to the metrics table
     * This is a performance-optimized implementation that handles large tables
     * with chunked processing and visual feedback.
     */
    public async applyCustomDateRangeFilter(dateRange: DateRange): Promise<void> {
        logger.debug('Filter', 'Custom date range filter applied', { dateRange });
        
        if (!dateRange) {
            logger.warn('Filter', 'No custom date range found, filter cannot be applied');
            return;
        }
        
        const previewEl = document.querySelector('.oom-metrics-container') as HTMLElement;
        if (!previewEl) {
            logger.warn('Filter', 'No metrics container found, filter cannot be applied');
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
        const startDateString = dateRange?.start || '';
        const endDateString = dateRange?.end || '';
        
        // Validate and create date objects
        const dateValidation = this.validateAndCreateDates(startDateString, endDateString);
        if (!dateValidation.isValid) {
            return;
        }
        
        logger.debug('Filter', 'Using date objects for comparison', {
            startDate: dateValidation.startDate!.toISOString(),
            endDate: dateValidation.endDate!.toISOString(),
            dateRange: `${startDateString} to ${endDateString}`
        });
        
        // Gather all rows for processing
        const rows = previewEl.querySelectorAll('.oom-dream-row');
        const totalRows = rows.length;
        
        // Show loading indicator for large tables
        const loadingIndicator = this.createLoadingIndicator(totalRows);
        
        // Pre-compute visibility without touching the DOM
        const { rowVisibility, visibleCount } = this.computeRowVisibility(
            Array.from(rows), 
            startDateString, 
            endDateString
        );
        
        // Process rows in chunks to avoid UI freezing
        await this.processRowsInChunks(
            Array.from(rows),
            rowVisibility,
            loadingIndicator,
            totalRows
        );
        
        // Cleanup and finalize
        this.finalizeFiltering(
            previewEl,
            tableContainer,
            loadingIndicator,
            visibleCount,
            dateRange
        );
    }

    /**
     * Validate date strings and create date objects
     */
    private validateAndCreateDates(startDateString: string, endDateString: string) {
        // Ensure we create the dates in a timezone-safe way
        const startYMD = startDateString.split('-').map(n => parseInt(n));
        const endYMD = endDateString.split('-').map(n => parseInt(n));
        
        // Validate the date parts
        if (startYMD.length !== 3 || endYMD.length !== 3 || 
            startYMD.some(isNaN) || endYMD.some(isNaN)) {
            logger.error('Filter', 'Invalid date format in custom range', {
                startDateString,
                endDateString
            });
            return { isValid: false };
        }
        
        // Create date objects with the exact day boundaries
        const startDate = new Date(startYMD[0], startYMD[1] - 1, startYMD[2], 0, 0, 0, 0);
        const endDate = new Date(endYMD[0], endYMD[1] - 1, endYMD[2], 23, 59, 59, 999);
        
        // Sanity check on the dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            logger.error('Filter', 'Could not create valid date objects for filter', {
                startYMD, 
                endYMD
            });
            return { isValid: false };
        }
        
        return { isValid: true, startDate, endDate };
    }

    /**
     * Create loading indicator for large tables
     */
    private createLoadingIndicator(totalRows: number): HTMLElement | null {
        if (totalRows <= 50) {
            return null;
        }

        const loadingIndicator = document.createElement('div');
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
        
        return loadingIndicator;
    }

    /**
     * Pre-compute visibility for all rows without touching the DOM
     */
    private computeRowVisibility(
        rowsArray: Element[], 
        startDateString: string, 
        endDateString: string
    ) {
        let visibleCount = 0;
        let invalidDates = 0;
        let outOfRangeDates = 0;
        const rowVisibility: boolean[] = [];
        
        // Process each row to determine visibility
        rowsArray.forEach((row, index) => {
            let dateAttr = row.getAttribute('data-date');
            
            if (!dateAttr || dateAttr.trim() === '') {
                // Try to fix missing date attribute
                const dateCell = row.querySelector('.column-date');
                if (dateCell && dateCell.textContent) {
                    const dateText = dateCell.textContent.trim();
                    try {
                        const dateObj = new Date(dateText);
                        if (!isNaN(dateObj.getTime())) {
                            dateAttr = dateObj.toISOString().split('T')[0];
                            logger.debug(`Fixed missing date attribute on row ${index}`, { date: dateAttr });
                            row.setAttribute('data-date', dateAttr);
                            dateCell.setAttribute('data-date', dateAttr);
                        }
                    } catch (e) {
                        logger.error(`Failed to fix date attribute for row ${index}`, e as Error);
                    }
                }
                
                if (!dateAttr || dateAttr.trim() === '') {
                    logger.warn(`Row ${index} missing date attribute and cannot be fixed`);
                    rowVisibility.push(false);
                    invalidDates++;
                    return;
                }
            }
            
            // Check if date is within our range
            const isInRange = dateAttr >= startDateString && dateAttr <= endDateString;
            
            if (isInRange) {
                visibleCount++;
                logger.debug(`Row ${index} matches date range: ${dateAttr}`);
            } else {
                outOfRangeDates++;
            }
            
            rowVisibility.push(isInRange);
        });

        logger.debug('Row visibility computed', { 
            visibleCount, 
            invalidDates, 
            outOfRangeDates, 
            totalRows: rowsArray.length 
        });
        
        return { rowVisibility, visibleCount };
    }

    /**
     * Process rows in chunks to avoid UI freezing
     */
    private async processRowsInChunks(
        rowsArray: Element[],
        rowVisibility: boolean[],
        loadingIndicator: HTMLElement | null,
        totalRows: number
    ): Promise<void> {
        const CHUNK_SIZE = 20;
        let currentChunk = 0;
        
        return new Promise<void>((resolve) => {
            const processNextChunk = () => {
                const start = currentChunk * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, totalRows);
                
                // Update loading indicator if present
                if (loadingIndicator) {
                    const percent = Math.floor((start / totalRows) * 100);
                    loadingIndicator.textContent = `Filtering entries... ${percent}%`;
                }
                
                // Apply visibility changes in a requestAnimationFrame
                requestAnimationFrame(() => {
                    for (let i = start; i < end; i++) {
                        const rowEl = rowsArray[i] as HTMLElement;
                        const isVisible = rowVisibility[i];
                        
                        if (isVisible) {
                            rowEl.classList.remove('oom-row--hidden');
                            rowEl.classList.add('oom-row--visible');
                            rowEl.style.removeProperty('display');
                        } else {
                            rowEl.classList.add('oom-row--hidden');
                            rowEl.classList.remove('oom-row--visible');
                            rowEl.style.display = 'none';
                        }
                    }
                    
                    currentChunk++;
                    
                    if (currentChunk * CHUNK_SIZE < totalRows) {
                        // Continue processing chunks
                        setTimeout(() => processNextChunk(), 5);
                    } else {
                        // All done
                        resolve();
                    }
                });
            };
            
            // Start processing after a short delay
            setTimeout(() => processNextChunk(), 10);
        });
    }

    /**
     * Finalize the filtering process - cleanup and update metrics
     */
    private finalizeFiltering(
        previewEl: HTMLElement,
        tableContainer: Element | null,
        loadingIndicator: HTMLElement | null,
        visibleCount: number,
        dateRange: DateRange
    ): void {
        // Clean up loading indicator
        if (loadingIndicator && loadingIndicator.parentNode) {
            document.body.removeChild(loadingIndicator);
        }
        
        // Reset will-change property
        if (tableContainer) {
            requestAnimationFrame(() => {
                tableContainer.removeAttribute('style');
            });
        }
        
        // Update metrics with filtered data
        const filteredMetrics = this.metricsCollector.collectVisibleRowMetrics(previewEl);
        this.tableStatisticsUpdater.updateSummaryTable(previewEl, filteredMetrics);
        
        // Show notification with filter results
        new Notice(`Custom date filter applied: ${visibleCount} entries visible`);
        
        // Save the filter in plugin settings
        this.saveFilterSettings(dateRange);
        
        logger.info('Custom date range filter completed', { 
            visibleCount, 
            dateRange 
        });
    }

    /**
     * Save filter settings to plugin
     */
    private saveFilterSettings(dateRange: DateRange): void {
        if (window.oneiroMetricsPlugin) {
            try {
                window.oneiroMetricsPlugin.settings.lastAppliedFilter = 'custom';
                window.oneiroMetricsPlugin.settings.customDateRange = dateRange;
                window.oneiroMetricsPlugin.saveSettings();
                logger.debug('Filter settings saved', { dateRange });
            } catch (e) {
                logger.error('Failed to save filter setting', e as Error);
            }
        }
    }
}

// Export types for external use 
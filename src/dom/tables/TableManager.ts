/**
 * TableManager
 * 
 * Manages table operations for the OneiroMetrics plugin
 * Handles initialization, updates, and data collection from tables
 */

import { App } from 'obsidian';
import { DreamMetricsSettings } from '../../types/core';

// For backward compatibility with global variables
declare global {
    var __tableRowsInitialized: boolean;
    var globalLogger: any;
}

export class TableManager {
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private logger?: any
    ) { }

    /**
     * Initialize the table manager
     */
    public initialize(): void {
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        log?.debug?.('Table', 'Initializing TableManager');
    }

    /**
     * Initialize CSS classes for table rows with performance optimizations
     */
    public initializeTableRowClasses(): void {
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        // Use a flag to ensure this only runs once per page load
        if (window.__tableRowsInitialized) {
            log?.debug?.('UI', 'Table rows already initialized, skipping initialization');
            
            // Even if already initialized, run a repair on date attributes
            this.runDateAttributeRepair();
            
            return;
        }
        
        // Use requestIdleCallback to run this during browser idle time
        // This prevents blocking the main thread during initial page load
        const runWhenIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
        
        runWhenIdle(() => {
            log?.debug?.('UI', 'Initializing table row classes during idle time');
            
            // Try multiple ways to find tables
            const tableSelectors = [
                '#oom-dream-entries-table', 
                '.oom-table:not(.oom-stats-table)',
                '.oom-metrics-table',
                '.oom-table',
                'table:not(.oom-stats-table)'
            ];
            
            let tables: NodeListOf<Element> | null = null;
            
            // Try each selector until we find tables
            for (const selector of tableSelectors) {
                const foundTables = document.querySelectorAll(selector);
                if (foundTables && foundTables.length > 0) {
                    tables = foundTables;
                    log?.debug?.('UI', `Found tables using selector: ${selector}`, { count: foundTables.length });
                    break;
                }
            }
            
            if (!tables || tables.length === 0) {
                log?.warn?.('UI', 'No tables found for row initialization');
                
                // Try again after a short delay in case tables are slow to render
                setTimeout(() => {
                    const allTables = document.querySelectorAll('table');
                    if (allTables && allTables.length > 0) {
                        log?.info?.('UI', `Found ${allTables.length} tables after delay, initializing anyway`);
                        this.initializeTableRowsForElements(allTables);
                    } else {
                        log?.warn?.('UI', 'Still no tables found after delay');
                    }
                }, 1000);
                
                return;
            }
            
            this.initializeTableRowsForElements(tables);
            
            // Set the flag to prevent reinitialization
            window.__tableRowsInitialized = true;
            
            // Run date attribute repair after initialization
            this.runDateAttributeRepair();
        }, { timeout: 2000 }); // Increased timeout for better reliability
    }

    /**
     * Initialize table rows for a collection of table elements
     * 
     * @param tables - Collection of table elements to initialize
     */
    private initializeTableRowsForElements(tables: NodeListOf<Element> | Array<Element>): void {
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        // Process tables one at a time to avoid large reflows
        Array.from(tables).forEach((table, tableIndex) => {
            // Use DocumentFragment to batch DOM operations
            const rows = Array.from(table.querySelectorAll('tbody tr'));
            
            if (rows.length === 0) {
                log?.warn?.('UI', `No rows found in table ${tableIndex}`);
                return;
            }
            
            log?.debug?.('UI', `Initializing rows for table ${tableIndex}`, { count: rows.length });
            
            // Performance optimization: Break large tables into smaller chunks
            // Use smaller chunks for larger tables
            const CHUNK_SIZE = rows.length > 100 ? 10 : rows.length > 50 ? 15 : 20;
            let currentChunk = 0;
            
            // Show a loading indicator for very large tables
            let loadingIndicator: HTMLElement | null = null;
            
            if (rows.length > 200) {
                try {
                    loadingIndicator = document.createElement('div');
                    loadingIndicator.className = 'oom-loading-indicator';
                    loadingIndicator.textContent = `Initializing table...`;
                    document.body.appendChild(loadingIndicator);
                } catch (e) {
                    // Silently ignore errors with the loading indicator
                    log?.debug?.('UI', 'Error creating loading indicator', e as Error);
                }
            }
            
            const processNextChunk = () => {
                const start = currentChunk * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, rows.length);
                
                // Update loading indicator if present
                if (loadingIndicator) {
                    const percent = Math.floor((start / rows.length) * 100);
                    loadingIndicator.textContent = `Initializing table... ${percent}%`;
                }
                
                // Use a single requestAnimationFrame to batch operations
                requestAnimationFrame(() => {
                    for (let i = start; i < end; i++) {
                        const row = rows[i];
                        
                        // Add base class to all rows
                        row.classList.add('oom-dream-row');
                        
                        // Default all rows to visible
                        row.classList.add('oom-row--visible');
                        
                        // Make sure hidden class is not present initially
                        row.classList.remove('oom-row--hidden');
                        
                        // Make sure inline style display is removed if it exists
                        row.classList.remove('oom-display-none');
                        row.classList.add('oom-display-reset');
                        
                        // Initialize date attributes during this pass for efficiency
                        this.initializeDateAttributesForRow(row, i);
                    }
                    
                    // Move to next chunk or finish
                    currentChunk++;
                    
                    if (currentChunk * CHUNK_SIZE < rows.length) {
                        // Schedule next chunk with slight delay
                        // Use larger delays for larger tables to prevent UI freezing
                        const delay = rows.length > 200 ? 20 : rows.length > 100 ? 15 : 10;
                        setTimeout(processNextChunk, delay);
                    } else {
                        // Clean up loading indicator if present
                        if (loadingIndicator) {
                            loadingIndicator.remove();
                        }
                        
                        log?.info?.('UI', 'Table row initialization complete', { 
                            rowsProcessed: rows.length,
                            performance: 'chunked'
                        });
                    }
                });
            };
            
            // Start processing chunks with slight delay to allow initial render
            // Stagger table initialization to avoid overwhelming the browser
            setTimeout(processNextChunk, 50 + tableIndex * 100);
        });
    }

    /**
     * Initialize date attributes for a specific row
     * 
     * @param row - The row element to initialize
     * @param index - The row index for debugging
     */
    private initializeDateAttributesForRow(row: Element, index: number): void {
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        // Skip if already has date attribute
        if (row.getAttribute('data-date')) {
            return;
        }
        
        // Try different methods to extract date
        
        // Method 1: Extract from date column
        const dateCell = row.querySelector('.column-date');
        if (dateCell && dateCell.textContent) {
            const dateText = dateCell.textContent.trim();
            try {
                // Parse the displayed date back to YYYY-MM-DD format
                const date = new Date(dateText);
                if (!isNaN(date.getTime())) {
                    const isoDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
                    row.setAttribute('data-date', isoDate);
                    row.setAttribute('data-date-raw', isoDate);
                    row.setAttribute('data-iso-date', isoDate);
                    
                    if (dateCell) {
                        dateCell.setAttribute('data-date', isoDate);
                        dateCell.setAttribute('data-iso-date', isoDate);
                    }
                    
                    log?.debug?.('Filter', `Initialized date attribute for row ${index}`, { date: isoDate });
                    return;
                }
            } catch (e) {
                // Silent failure, continue to next method
            }
        }
        
        // Method 2: Try to extract from ID attribute
        const rowId = row.getAttribute('id');
        if (rowId) {
            // Look for patterns like "entry-2025-01-15" or "dream-20250115"
            const dateMatch = rowId.match(/[^-](\d{4}-\d{2}-\d{2})/);
            if (dateMatch && dateMatch[1]) {
                const isoDate = dateMatch[1];
                row.setAttribute('data-date', isoDate);
                row.setAttribute('data-date-raw', isoDate);
                row.setAttribute('data-iso-date', isoDate);
                
                log?.debug?.('Filter', `Extracted date from row ID: ${isoDate}`);
                return;
            }
            
            // Try another format like "dream-20250115"
            const compactDateMatch = rowId.match(/(\d{8})/);
            if (compactDateMatch && compactDateMatch[1]) {
                const dateStr = compactDateMatch[1];
                const isoDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
                
                row.setAttribute('data-date', isoDate);
                row.setAttribute('data-date-raw', isoDate);
                row.setAttribute('data-iso-date', isoDate);
                
                log?.debug?.('Filter', `Extracted compact date from row ID: ${isoDate}`);
                return;
            }
        }
        
        // Method 3: Check for any date-like text in the row
        const rowText = row.textContent || '';
        const dateRegex = /\b(\d{4}-\d{2}-\d{2})\b/;
        const dateMatch = rowText.match(dateRegex);
        
        if (dateMatch && dateMatch[1]) {
            const isoDate = dateMatch[1];
            row.setAttribute('data-date', isoDate);
            row.setAttribute('data-date-raw', isoDate);
            row.setAttribute('data-iso-date', isoDate);
            
            log?.debug?.('Filter', `Extracted date from row text: ${isoDate}`);
            return;
        }
    }

    /**
     * Helper function to repair date attributes on tables
     * Now primarily used as a secondary pass to catch any missed rows
     */
    private runDateAttributeRepair(): void {
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        // Skip this if we just initialized the tables (optimization)
        if (window.__tableRowsInitialized) {
            log?.debug?.('Filter', 'Skipping secondary date attribute repair since tables were just initialized');
            return;
        }
        
        // Try multiple ways to find rows
        const rowsSelectors = [
            '.oom-dream-row',
            '#oom-dream-entries-table tbody tr',
            '.oom-table tbody tr'
        ];
        
        let rows: NodeListOf<Element> | null = null;
        
        // Try each selector until we find rows
        for (const selector of rowsSelectors) {
            const foundRows = document.querySelectorAll(selector);
            if (foundRows && foundRows.length > 0) {
                rows = foundRows;
                log?.debug?.('Filter', `Found rows using selector: ${selector}`, { count: foundRows.length });
                break;
            }
        }
        
        if (!rows || rows.length === 0) {
            log?.warn?.('UI', 'No table rows found for date attribute repair');
            return;
        }
        
        let rowsWithoutDates = 0;
        let rowsFixed = 0;
        
        log?.info?.('Filter', `Checking date attributes on ${rows.length} rows`);
        log?.debug?.('Filter', 'Starting date attribute verification process', { totalRows: rows.length });
        
        // Process rows in chunks to avoid blocking the UI
        const CHUNK_SIZE = rows.length > 100 ? 10 : rows.length > 50 ? 15 : 20;
        let currentChunk = 0;
        
        const processNextChunk = () => {
            const start = currentChunk * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, rows.length);
            
            for (let i = start; i < end; i++) {
                const row = rows[i];
                const dateAttr = row.getAttribute('data-date');
                
                if (!dateAttr) {
                    rowsWithoutDates++;
                    this.initializeDateAttributesForRow(row, i);
                    
                    // Check if we successfully fixed it
                    if (row.getAttribute('data-date')) {
                        rowsFixed++;
                    }
                }
            }
            
            // Move to next chunk or finish
            currentChunk++;
            
            if (currentChunk * CHUNK_SIZE < rows.length) {
                // Schedule next chunk with slight delay
                setTimeout(processNextChunk, 10);
            } else {
                // Log completion
                log?.info?.('Filter', `Date attribute repair complete`, { missing: rowsWithoutDates, fixed: rowsFixed });
                log?.debug?.('Filter', 'Date attribute verification finished', { 
                    totalRows: rows.length,
                    rowsWithoutDates,
                    rowsFixed,
                    success: rowsFixed > 0
                });
            }
        };
        
        // Start processing
        processNextChunk();
    }

    /**
     * Collect metrics data from visible rows
     */
    public collectVisibleRowMetrics(container: HTMLElement): Record<string, number[]> {
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
        const visibleRows = mainTable.querySelectorAll('tbody tr:not(.oom-row--hidden)');
        if (!visibleRows || visibleRows.length === 0) {
            log?.warn?.('Metrics', 'No visible rows found for metrics collection');
            return {};
        }
        
        const metrics: Record<string, number[]> = {};
        let processedRows = 0;
        
        visibleRows.forEach((row) => {
            // Process all metric cells in this row
            const metricCells = row.querySelectorAll('td.metric-value');
            if (metricCells && metricCells.length > 0) {
                metricCells.forEach((cell) => {
                    const metricName = cell.getAttribute('data-metric');
                    if (!metricName) return;
                    
                    const valueText = cell.textContent?.trim() || '';
                    const value = parseFloat(valueText);
                    
                    if (!isNaN(value)) {
                        if (!metrics[metricName]) {
                            metrics[metricName] = [];
                        }
                        metrics[metricName].push(value);
                    }
                });
                processedRows++;
            }
        });
        
        log?.debug?.('Metrics', `Collected metrics from ${processedRows} visible rows`, { 
            metrics: Object.keys(metrics).length
        });
        
        return metrics;
    }

    /**
     * Update the summary table with filtered metrics
     */
    public updateSummaryTable(container: HTMLElement, metrics: Record<string, number[]>): void {
        const log = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        log?.debug?.('Table', 'Updating summary table with filtered metrics');
        
        const statsTable = container.querySelector('.oom-stats-table');
        if (!statsTable) {
            log?.warn?.('Table', 'Stats table not found for update');
            return;
        }
        
        // Process each metric type and update the stats table rows
        Object.entries(metrics).forEach(([metricName, values]) => {
            if (!values || values.length === 0) return;
            
            // Find the row for this metric
            const metricRow = statsTable.querySelector(`tr[data-metric="${metricName}"]`);
            if (!metricRow) {
                log?.debug?.('Table', `Metric row not found for ${metricName}`);
                return;
            }
            
            try {
                // Calculate statistics
                const total = values.reduce((sum, val) => sum + val, 0);
                const count = values.length;
                const avg = total / count;
                const min = Math.min(...values);
                const max = Math.max(...values);
                
                // Find cells and update values
                const cells = metricRow.querySelectorAll('td');
                if (cells.length >= 5) {
                    cells[0].textContent = String(count);
                    cells[1].textContent = this.formatMetricValue(total);
                    cells[2].textContent = this.formatMetricValue(avg);
                    cells[3].textContent = this.formatMetricValue(min);
                    cells[4].textContent = this.formatMetricValue(max);
                }
                
                log?.debug?.('Table', `Updated stats for ${metricName}`, { count, total, avg, min, max });
            } catch (error) {
                log?.error?.('Table', `Error updating stats for ${metricName}`, error as Error);
            }
        });
        
        log?.debug?.('Table', 'Summary table update complete');
    }
    
    /**
     * Format a metric value for display
     */
    private formatMetricValue(value: number): string {
        // Format integers as whole numbers
        if (Number.isInteger(value)) {
            return value.toString();
        }
        
        // Format floating point numbers with 2 decimal places
        return value.toFixed(2);
    }
} 
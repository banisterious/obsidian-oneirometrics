/**
 * TableStatisticsUpdater
 * 
 * Handles updating the summary statistics table for metrics display.
 * Part of the modularization effort to extract functionality from main.ts.
 */

import { ILogger } from '../logging/LoggerTypes';

export class TableStatisticsUpdater {
    constructor(
        private logger?: ILogger
    ) {}

    /**
     * Update the summary table with filtered metrics
     * 
     * @param container - The container element containing the stats table
     * @param metrics - Record of metric names to arrays of values
     */
    public updateSummaryTable(container: HTMLElement, metrics: Record<string, number[]>): void {
        const log = this.logger || (typeof globalLogger !== 'undefined' ? globalLogger : null);
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
                log?.error?.('Table', `Error updating stats for ${metricName}`, error instanceof Error ? error : new Error(String(error)));
            }
        });
        
        log?.debug?.('Table', 'Summary table update complete');
    }
    
    /**
     * Format a metric value for display
     * 
     * @param value - The numeric value to format
     * @returns Formatted string representation
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
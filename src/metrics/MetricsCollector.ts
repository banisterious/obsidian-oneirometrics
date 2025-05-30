/**
 * MetricsCollector
 * 
 * Handles collecting metrics from dream journal entries.
 * Extracted from main.ts during the refactoring process.
 */

import { App, Notice, TFile, TFolder } from 'obsidian';
import DreamMetricsPlugin from '../../main';
import { DreamMetricData, DreamMetricsSettings } from '../../types';
import { ILogger } from '../logging/LoggerTypes';
import { getSelectedFolder, getSelectionMode } from '../utils/settings-helpers';
import { MetricsProcessor } from './MetricsProcessor';

export class MetricsCollector {
    private readonly settings: DreamMetricsSettings;
    private metricsProcessor: MetricsProcessor;

    constructor(
        private app: App,
        private plugin: DreamMetricsPlugin,
        private logger?: ILogger
    ) {
        this.settings = plugin.settings;
        this.metricsProcessor = new MetricsProcessor(app, plugin, logger);
    }

    /**
     * Scrape metrics from journal entries
     * 
     * This method:
     * 1. Identifies files to process based on selection mode
     * 2. Processes files in batches to extract metrics
     * 3. Updates the project note with the collected metrics
     */
    public async scrapeMetrics(): Promise<void> {
        this.logger?.info('Scrape', 'Starting metrics collection process');
        
        // Show a notice instead of a modal
        new Notice('Scraping dream metrics... This may take a moment.');

        try {
            // Let the MetricsProcessor handle the actual scraping
            await this.metricsProcessor.scrapeMetrics();
            
            this.logger?.info('Scrape', 'Metrics collection completed successfully');
        } catch (error) {
            this.logger?.error('Scrape', 'Error in scrapeMetrics', error as Error);
            new Notice(`Error scraping metrics: ${error.message}`);
        }
    }

    /**
     * Collect metrics data from visible rows in the DOM
     * 
     * @param container - The container element containing the metrics table
     * @returns A record of metric names to arrays of values
     */
    public collectVisibleRowMetrics(container: HTMLElement): Record<string, number[]> {
        const log = this.logger || (typeof globalLogger !== 'undefined' ? globalLogger : null);
        log?.debug?.('Metrics', 'Collecting metrics from visible rows');
        
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
            metricTypes: Object.keys(metrics).length,
            totalValues: Object.values(metrics).reduce((sum, arr) => sum + arr.length, 0)
        });
        
        return metrics;
    }

    /**
     * Calculate summary statistics for each metric
     * 
     * @param metrics - Record of metric names to arrays of values
     * @returns Record of metric names to summary statistic objects
     */
    public calculateMetricStats(metrics: Record<string, number[]>): Record<string, {
        count: number;
        total: number;
        avg: number;
        min: number;
        max: number;
    }> {
        const stats: Record<string, any> = {};
        
        Object.entries(metrics).forEach(([metricName, values]) => {
            if (!values || values.length === 0) return;
            
            try {
                // Calculate statistics
                const total = values.reduce((sum, val) => sum + val, 0);
                const count = values.length;
                const avg = total / count;
                const min = Math.min(...values);
                const max = Math.max(...values);
                
                stats[metricName] = { count, total, avg, min, max };
                
                this.logger?.debug?.('Metrics', `Calculated stats for ${metricName}`, { 
                    count, 
                    total, 
                    avg: avg.toFixed(2), 
                    min, 
                    max 
                });
            } catch (error) {
                this.logger?.error?.('Metrics', `Error calculating stats for ${metricName}`, error as Error);
            }
        });
        
        return stats;
    }
} 
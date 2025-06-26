import { App, MarkdownView } from 'obsidian';
import type { ILogger } from '../../logging/LoggerTypes';
import type { DreamMetricData, DreamMetricsSettings } from '../../types/core';
import { ChartTabsManager } from './ChartTabsManager';
import { ChartDataPersistence } from '../../state/ChartDataPersistence';

/**
 * Service responsible for chart restoration functionality
 * Extracted from main.ts to improve code organization and maintainability
 */
export class ChartRestorationService {
    private chartTabsManager?: ChartTabsManager;
    private persistence?: ChartDataPersistence;

    constructor(
        private app: App,
        private plugin: any, // DreamMetricsPlugin reference
        private logger?: ILogger,
        private settings?: DreamMetricsSettings
    ) {
        // Initialize chart tabs manager if we have logger
        if (this.logger) {
            this.chartTabsManager = new ChartTabsManager(this.logger, this.app, this.plugin);
        }
        
        // Initialize persistence if app and plugin are provided
        if (this.app && this.plugin) {
            this.persistence = new ChartDataPersistence(this.app, this.plugin, this.logger);
        }
    }

    /**
     * Attempt to restore charts from cached data when OneiroMetrics note is viewed
     * Includes retry logic to wait for DOM structure to be ready
     */
    public async attemptChartRestoration(attempt: number = 0): Promise<boolean> {
        const maxAttempts = 5;
        const baseDelay = 300;
        
        this.logger?.debug('ChartRestoration', `attemptChartRestoration called (attempt ${attempt + 1}/${maxAttempts})`);
        
        try {
            // Check if the note has the required OneiroMetrics DOM structure
            const metricsContainer = document.querySelector('#oom-metrics-container');
            const dreamEntriesTable = document.querySelector('#oom-dream-entries-table');
            const chartPlaceholder = document.querySelector('#oom-chart-tabs-placeholder');
            
            this.logger?.debug('ChartRestoration', 'DOM structure check', {
                hasMetricsContainer: !!metricsContainer,
                hasDreamEntriesTable: !!dreamEntriesTable,
                hasChartPlaceholder: !!chartPlaceholder,
                attempt: attempt + 1
            });
            
            // If DOM structure isn't ready yet, retry with exponential backoff
            if (!metricsContainer || !dreamEntriesTable || !chartPlaceholder) {
                if (attempt < maxAttempts - 1) {
                    const delay = baseDelay * Math.pow(1.5, attempt);
                    this.logger?.debug('ChartRestoration', `DOM not ready, retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
                    
                    setTimeout(() => {
                        this.attemptChartRestoration(attempt + 1);
                    }, delay);
                    return false;
                } else {
                    this.logger?.debug('ChartRestoration', 'Max attempts reached - note does not have OneiroMetrics structure');
                    return false;
                }
            }
            
            this.logger?.debug('ChartRestoration', 'DOM structure ready, proceeding with chart restoration');

            // Get dream entries from the DOM
            const dreamEntries = this.extractDreamEntriesFromDOM();
            if (!dreamEntries || dreamEntries.length === 0) {
                this.logger?.debug('ChartRestoration', 'No dream entries found in DOM');
                this.showChartPlaceholder(chartPlaceholder as HTMLElement);
                return false;
            }

            this.logger?.debug('ChartRestoration', 'Found dream entries in DOM', { count: dreamEntries.length });

            // Check if we have cached chart data
            if (this.persistence) {
                const cacheStatus = await this.persistence.getCacheStatus(dreamEntries);
                this.logger?.debug('ChartRestoration', 'Cache status', cacheStatus);
                
                if (cacheStatus.hasCache && cacheStatus.isValid) {
                    this.logger?.debug('ChartRestoration', 'Attempting to restore charts from cache');
                    
                    try {
                        const chartData = await this.persistence.restoreChartData(dreamEntries);
                        this.logger?.debug('ChartRestoration', 'Successfully restored cached chart data');
                        
                        if (chartData && this.chartTabsManager) {
                            await this.chartTabsManager.initializeChartTabs(
                                chartPlaceholder as HTMLElement,
                                chartData,
                                '' // No statistics table HTML for restoration
                            );
                            this.logger?.debug('ChartRestoration', 'Charts restored successfully');
                            return true;
                        }
                    } catch (error) {
                        this.logger?.error('ChartRestoration', 'Error during chart restoration', error as Error);
                    }
                } else {
                    this.logger?.debug('ChartRestoration', 'No valid cache found, showing placeholder');
                }
            }

            // Show placeholder if restoration failed or no cache
            this.showChartPlaceholder(chartPlaceholder as HTMLElement);
            return false;

        } catch (error) {
            this.logger?.error('ChartRestoration', 'Error during chart restoration', error as Error);
            
            // Show placeholder on error
            const placeholder = document.querySelector('#oom-chart-tabs-placeholder') as HTMLElement;
            if (placeholder) {
                this.showChartPlaceholder(placeholder);
            }
            return false;
        }
    }

    /**
     * Extract dream entries from the DOM table for cache validation
     */
    public extractDreamEntriesFromDOM(): DreamMetricData[] {
        this.logger?.debug('ChartRestoration', 'Extracting dream entries from DOM');
        
        try {
            const dreamEntries: DreamMetricData[] = [];
            const tableRows = document.querySelectorAll('#oom-dream-entries-table tbody tr.oom-dream-row');
            
            this.logger?.debug('ChartRestoration', 'Found table rows', { count: tableRows.length });

            tableRows.forEach((row, index) => {
                try {
                    const dateCell = row.querySelector('.column-date');
                    const titleCell = row.querySelector('.oom-dream-title a');
                    const contentCell = row.querySelector('.oom-dream-content');
                    
                    if (!dateCell || !titleCell) {
                        this.logger?.debug('ChartRestoration', 'Skipping row - missing date or title', { index });
                        return;
                    }

                    const dateAttr = row.getAttribute('data-date');
                    const title = titleCell.textContent?.trim() || '';
                    
                    if (!dateAttr || !title) {
                        this.logger?.debug('ChartRestoration', 'Skipping row - invalid date or title', { index });
                        return;
                    }

                    // Extract metrics from the row
                    const metrics: Record<string, number> = {};
                    const metricCells = row.querySelectorAll('.metric-value');
                    metricCells.forEach(cell => {
                        const metricName = cell.getAttribute('data-metric');
                        const metricValue = cell.textContent?.trim();
                        
                        if (metricName && metricValue && metricValue !== '') {
                            const numValue = parseInt(metricValue, 10);
                            if (!isNaN(numValue)) {
                                metrics[metricName] = numValue;
                            }
                        }
                    });

                    // Extract content (simplified for cache validation)
                    const content = contentCell?.textContent?.trim() || '';

                    const entry: DreamMetricData = {
                        date: dateAttr,
                        title: title,
                        content: content,
                        metrics: metrics,
                        wordCount: metrics['Words'] || 0,
                        source: `extracted-from-dom#entry-${dateAttr}`
                    };

                    dreamEntries.push(entry);
                    
                } catch (error) {
                    this.logger?.error('ChartRestoration', 'Error processing row', { index, error });
                }
            });

            this.logger?.debug('ChartRestoration', 'Successfully extracted entries', { count: dreamEntries.length });
            return dreamEntries;
            
        } catch (error) {
            this.logger?.error('ChartRestoration', 'Error extracting dream entries', error as Error);
            return [];
        }
    }

    /**
     * Show a placeholder message when no charts are available
     */
    private showChartPlaceholder(placeholder: HTMLElement): void {
        this.logger?.debug('ChartRestoration', 'Showing chart placeholder');
        
        placeholder.innerHTML = `
            <div class="oom-chart-placeholder">
                <div class="oom-placeholder-content">
                    <h3>📊 Chart Data Not Available</h3>
                    <p>Charts will appear here after running a metrics scrape.</p>
                    <p><strong>To generate charts:</strong></p>
                    <ol>
                        <li>Click the "Rescrape Metrics" button below</li>
                        <li>Or use the OneiroMetrics Hub (ribbon icon)</li>
                    </ol>
                    <p><em>Charts are automatically cached and will persist between reloads once generated.</em></p>
                </div>
            </div>
        `;
    }
} 
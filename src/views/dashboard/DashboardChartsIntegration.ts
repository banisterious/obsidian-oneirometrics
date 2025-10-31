import { ChartTabsManager } from '../../dom/charts/ChartTabsManager';
import { DreamMetricData } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';
import { App, Plugin } from 'obsidian';

/**
 * DashboardChartsIntegration
 * 
 * Manages the integration of chart tabs within the OneiroMetrics Dashboard.
 * This component acts as a bridge between the dashboard view and the existing
 * chart visualization system, ensuring proper data flow and lifecycle management.
 */
export class DashboardChartsIntegration {
    private chartTabsManager: ChartTabsManager;
    private chartsContainer: HTMLElement | null = null;
    private isInitialized: boolean = false;
    private logger?: ILogger;
    private currentData: DreamMetricData[] = [];
    private statisticsHTML: string = '';
    
    // Performance tracking
    private renderMetrics = {
        lastRenderTime: 0,
        totalRenders: 0,
        averageRenderTime: 0
    };

    constructor(
        private app: App,
        private plugin: Plugin,
        logger?: ILogger
    ) {
        this.logger = logger;
        this.chartTabsManager = new ChartTabsManager(logger, app, plugin);
    }

    /**
     * Initialize the charts section within the dashboard
     */
    public async initialize(container: HTMLElement): Promise<void> {
        const startTime = performance.now();
        
        try {
            this.logger?.debug('DashboardChartsIntegration', 'Initializing charts in dashboard');
            
            // Create charts section structure
            this.createChartsSection(container);
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Track performance
            const renderTime = performance.now() - startTime;
            this.updateRenderMetrics(renderTime);
            
            this.logger?.info('DashboardChartsIntegration', 'Charts section initialized', {
                renderTime: renderTime.toFixed(2) + 'ms'
            });
            
        } catch (error) {
            this.logger?.error('DashboardChartsIntegration', 'Failed to initialize charts', error as Error);
            throw error;
        }
    }

    /**
     * Create the charts section structure in the dashboard
     */
    private createChartsSection(container: HTMLElement): void {
        // Create charts container directly in the provided container
        this.chartsContainer = container.createDiv({ cls: 'oom-dashboard-charts-container' });
        
        // Add placeholder for charts
        const placeholder = this.chartsContainer.createDiv({ 
            cls: 'oom-chart-tabs-placeholder',
            attr: { id: 'oom-chart-tabs-placeholder' }
        });
        placeholder.createEl('p', { 
            text: 'Loading analytics...',
            cls: 'oom-charts-placeholder-text'
        });
        
        // Add resize observer for responsive charts
        this.setupResizeObserver();
    }


    /**
     * Setup resize observer for responsive chart rendering
     */
    private setupResizeObserver(): void {
        if (!this.chartsContainer) return;
        
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === this.chartsContainer) {
                    // Debounce resize handling
                    this.handleResize();
                }
            }
        });
        
        resizeObserver.observe(this.chartsContainer);
    }

    /**
     * Handle container resize events
     */
    private resizeTimeout: number | null = null;
    private handleResize(): void {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            // Trigger chart redraw if needed
            if (this.chartTabsManager && this.isInitialized) {
                this.logger?.debug('DashboardChartsIntegration', 'Handling resize event');
                // Charts will automatically adjust to container size
            }
        }, 250);
    }

    /**
     * Update charts with new data from the dashboard
     */
    public async updateCharts(
        entries: DreamMetricData[],
        enabledMetrics: Record<string, any>
    ): Promise<void> {
        const startTime = performance.now();
        
        try {
            if (!this.isInitialized || !this.chartsContainer) {
                this.logger?.warn('DashboardChartsIntegration', 'Cannot update charts - not initialized');
                return;
            }
            
            this.logger?.debug('DashboardChartsIntegration', 'Updating charts with new data', {
                entriesCount: entries.length,
                metricsCount: Object.keys(enabledMetrics).length
            });
            
            // Store current data
            this.currentData = entries;
            
            // Prepare chart data format
            const chartData = this.prepareChartData(entries, enabledMetrics);
            
            // Generate statistics table HTML
            this.statisticsHTML = this.generateStatisticsTable(entries, enabledMetrics);
            
            // Update or initialize charts
            if (this.chartTabsManager.isActive()) {
                await this.chartTabsManager.updateChartData(chartData, this.statisticsHTML);
            } else {
                await this.chartTabsManager.initializeChartTabs(
                    this.chartsContainer,
                    chartData,
                    this.statisticsHTML
                );
            }
            
            // Remove placeholder if it exists
            const placeholder = this.chartsContainer.querySelector('.oom-charts-placeholder-text');
            if (placeholder) {
                placeholder.remove();
            }
            
            // Track performance
            const renderTime = performance.now() - startTime;
            this.updateRenderMetrics(renderTime);
            
            this.logger?.info('DashboardChartsIntegration', 'Charts updated successfully', {
                renderTime: renderTime.toFixed(2) + 'ms',
                averageRenderTime: this.renderMetrics.averageRenderTime.toFixed(2) + 'ms'
            });
            
        } catch (error) {
            this.logger?.error('DashboardChartsIntegration', 'Failed to update charts', error as Error);
            this.showErrorState('Failed to load charts. Please try refreshing.');
        }
    }

    /**
     * Prepare chart data in the format expected by MetricsChartTabs
     */
    private prepareChartData(
        entries: DreamMetricData[],
        enabledMetrics: Record<string, any>
    ): { metrics: Record<string, number[]>, dreamEntries: DreamMetricData[] } {
        const metrics: Record<string, number[]> = {};
        
        // Extract metric values for each enabled metric
        for (const [key, metric] of Object.entries(enabledMetrics)) {
            if (!metric.enabled) continue;
            
            const values: number[] = [];
            for (const entry of entries) {
                let value = entry.metrics?.[key] || entry.metrics?.[metric.name] || 0;
                
                // Special handling for Words metric - use wordCount property
                if (metric.name === 'Words' && entry.wordCount !== undefined) {
                    value = entry.wordCount;
                }
                
                // Handle different value types
                if (typeof value === 'number') {
                    values.push(value);
                } else if (Array.isArray(value)) {
                    // For array metrics (like themes), use count
                    values.push(value.length);
                } else if (typeof value === 'string') {
                    // Try to parse as number, otherwise use 0
                    const parsed = parseFloat(value);
                    values.push(isNaN(parsed) ? 0 : parsed);
                } else {
                    values.push(0);
                }
            }
            
            metrics[metric.name || key] = values;
        }
        
        return {
            metrics,
            dreamEntries: entries
        };
    }

    /**
     * Generate statistics table HTML
     */
    private generateStatisticsTable(
        entries: DreamMetricData[],
        enabledMetrics: Record<string, any>
    ): string {
        if (entries.length === 0) {
            return '<p class="oom-no-data">No data available for statistics</p>';
        }
        
        let html = '<table class="oom-statistics-table">';
        html += '<thead><tr>';
        html += '<th>Metric</th>';
        html += '<th>Average</th>';
        html += '<th>Min</th>';
        html += '<th>Max</th>';
        html += '<th>Total</th>';
        html += '</tr></thead>';
        html += '<tbody>';
        
        for (const [key, metric] of Object.entries(enabledMetrics)) {
            if (!metric.enabled) continue;
            
            const values: number[] = [];
            for (const entry of entries) {
                let value = entry.metrics?.[key] || entry.metrics?.[metric.name] || 0;
                
                // Special handling for Words metric - use wordCount property
                if (metric.name === 'Words' && entry.wordCount !== undefined) {
                    value = entry.wordCount;
                }
                
                if (typeof value === 'number') {
                    values.push(value);
                } else if (Array.isArray(value)) {
                    values.push(value.length);
                } else if (typeof value === 'string') {
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed)) values.push(parsed);
                }
            }
            
            if (values.length > 0) {
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const min = Math.min(...values);
                const max = Math.max(...values);
                const total = values.reduce((a, b) => a + b, 0);
                
                html += '<tr>';
                html += `<td class="metric-name">${metric.name || key}</td>`;
                html += `<td class="metric-avg">${avg.toFixed(2)}</td>`;
                html += `<td class="metric-min">${min.toFixed(2)}</td>`;
                html += `<td class="metric-max">${max.toFixed(2)}</td>`;
                html += `<td class="metric-total">${total.toFixed(2)}</td>`;
                html += '</tr>';
            }
        }
        
        html += '</tbody></table>';
        
        return html;
    }

    /**
     * Show error state in charts section
     */
    private showErrorState(message: string): void {
        if (!this.chartsContainer) return;
        
        const errorEl = this.chartsContainer.createDiv({ cls: 'oom-charts-error' });
        errorEl.createEl('p', { text: message });
        
        // Auto-remove after 5 seconds
        setTimeout(() => errorEl.remove(), 5000);
    }

    /**
     * Update render performance metrics
     */
    private updateRenderMetrics(renderTime: number): void {
        this.renderMetrics.lastRenderTime = renderTime;
        this.renderMetrics.totalRenders++;
        
        // Calculate running average
        const prevAvg = this.renderMetrics.averageRenderTime;
        const prevTotal = prevAvg * (this.renderMetrics.totalRenders - 1);
        this.renderMetrics.averageRenderTime = (prevTotal + renderTime) / this.renderMetrics.totalRenders;
    }

    /**
     * Get performance metrics for debugging
     */
    public getPerformanceMetrics(): any {
        return {
            ...this.renderMetrics,
            isInitialized: this.isInitialized,
            hasData: this.currentData.length > 0,
            chartsActive: this.chartTabsManager?.isActive() || false
        };
    }

    /**
     * Get the currently active chart tab
     */
    public getActiveTab(): string {
        // Return the active tab from the chart tabs manager
        // Default to 'statistics' if not available
        if (this.chartTabsManager) {
            return this.chartTabsManager.getActiveTab() || 'statistics';
        }
        return 'statistics';
    }
    
    /**
     * Clean up and destroy charts
     */
    public destroy(): void {
        this.logger?.debug('DashboardChartsIntegration', 'Destroying charts integration');
        
        // Clear resize timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        // Destroy chart tabs manager
        if (this.chartTabsManager) {
            this.chartTabsManager.destroy();
        }
        
        // Clear container
        if (this.chartsContainer) {
            this.chartsContainer.empty();
            this.chartsContainer = null;
        }
        
        // Reset state
        this.isInitialized = false;
        this.currentData = [];
        this.statisticsHTML = '';
    }
}
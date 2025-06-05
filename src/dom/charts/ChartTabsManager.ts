import { MetricsChartTabs } from './MetricsChartTabs';
import { DreamMetricData } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';

export interface ChartData {
    metrics: Record<string, number[]>;
    dreamEntries: DreamMetricData[];
}

export class ChartTabsManager {
    private currentChartTabs: MetricsChartTabs | null = null;
    private logger?: ILogger;

    constructor(logger?: ILogger) {
        this.logger = logger;
    }

    /**
     * Initialize chart tabs in the metrics container
     */
    public initializeChartTabs(
        metricsContainer: HTMLElement, 
        chartData: ChartData,
        statisticsTableHTML: string
    ): void {
        try {
            this.logger?.debug('ChartTabsManager', 'Initializing chart tabs');
            
            // Check if chart tabs already exist
            if (metricsContainer.querySelector('.oom-metrics-chart-tabs-container')) {
                this.logger?.debug('ChartTabsManager', 'Chart tabs already exist, updating data');
                this.updateChartData(chartData, statisticsTableHTML);
                return;
            }

            // Create new chart tabs
            this.currentChartTabs = new MetricsChartTabs(
                metricsContainer,
                chartData,
                statisticsTableHTML,
                this.logger
            );

            this.logger?.debug('ChartTabsManager', 'Chart tabs initialized successfully');
        } catch (error) {
            this.logger?.error('ChartTabsManager', 'Failed to initialize chart tabs', { error });
        }
    }

    /**
     * Update chart data for existing tabs
     */
    public updateChartData(chartData: ChartData, statisticsTableHTML: string): void {
        try {
            if (this.currentChartTabs) {
                this.currentChartTabs.updateData(chartData, chartData.dreamEntries, statisticsTableHTML);
                this.logger?.debug('ChartTabsManager', 'Chart data updated');
            }
        } catch (error) {
            this.logger?.error('ChartTabsManager', 'Failed to update chart data', { error });
        }
    }

    /**
     * Show chart tabs (if hidden)
     */
    public showChartTabs(): void {
        if (this.currentChartTabs) {
            this.currentChartTabs.show();
        }
    }

    /**
     * Hide chart tabs
     */
    public hideChartTabs(): void {
        if (this.currentChartTabs) {
            this.currentChartTabs.hide();
        }
    }

    /**
     * Destroy chart tabs and clean up
     */
    public destroy(): void {
        if (this.currentChartTabs) {
            this.currentChartTabs.destroy();
            this.currentChartTabs = null;
        }
    }

    /**
     * Check if chart tabs are currently active
     */
    public isActive(): boolean {
        return this.currentChartTabs !== null;
    }

    /**
     * Get the current active tab name
     */
    public getActiveTab(): string | null {
        return this.currentChartTabs?.getActiveTab() || null;
    }

    /**
     * Switch to a specific tab
     */
    public switchToTab(tabName: string): void {
        if (this.currentChartTabs) {
            this.currentChartTabs.switchToTab(tabName);
        }
    }
} 
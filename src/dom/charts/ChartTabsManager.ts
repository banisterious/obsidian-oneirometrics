import { MetricsChartTabs } from './MetricsChartTabs';
import { DreamMetricData } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';
import { ChartDataPersistence } from '../../state/ChartDataPersistence';
import { App, Plugin } from 'obsidian';

export interface ChartData {
    metrics: Record<string, number[]>;
    dreamEntries: DreamMetricData[];
}

export class ChartTabsManager {
    private currentChartTabs: MetricsChartTabs | null = null;
    private logger?: ILogger;
    private persistence?: ChartDataPersistence;

    constructor(logger?: ILogger, app?: App, plugin?: Plugin) {
        this.logger = logger;
        
        // Initialize persistence if app and plugin are provided
        if (app && plugin) {
            this.persistence = new ChartDataPersistence(app, plugin, logger);
        }
    }

    /**
     * Initialize chart tabs in the metrics container
     * Saves chart data for future restoration after successful creation
     */
    public async initializeChartTabs(
        metricsContainer: HTMLElement, 
        chartData: ChartData,
        statisticsTableHTML: string
    ): Promise<void> {
        try {
            this.logger?.debug('ChartTabsManager', 'initializeChartTabs called', {
                hasContainer: !!metricsContainer,
                metricsKeys: Object.keys(chartData.metrics),
                entriesCount: chartData.dreamEntries.length,
                hasPersistence: !!this.persistence
            });
            
            this.logger?.debug('ChartTabsManager', 'Initializing chart tabs');
            
            // Check if chart tabs already exist
            if (metricsContainer.querySelector('.oom-metrics-chart-tabs-container')) {
                this.logger?.debug('ChartTabsManager', 'Chart tabs already exist, updating data');
                await this.updateChartData(chartData, statisticsTableHTML);
                return;
            }

            // Find the chart tabs placeholder
            const placeholder = metricsContainer.querySelector('#oom-chart-tabs-placeholder') as HTMLElement;
            if (!placeholder) {
                this.logger?.debug('ChartTabsManager', 'No placeholder found');
                this.logger?.warn('ChartTabsManager', 'Chart tabs placeholder not found');
                return;
            }

            this.logger?.debug('ChartTabsManager', 'Creating new chart tabs');
            
            // Clear the placeholder content before creating charts
            placeholder.innerHTML = '';
            
            // Initialize the chart tabs - pass placeholder as container
            this.currentChartTabs = new MetricsChartTabs(
                placeholder,
                chartData, 
                statisticsTableHTML, 
                this.logger
            );
            
            this.logger?.debug('ChartTabsManager', 'Chart tabs created successfully');

            // Save chart data to cache if persistence is available
            if (this.persistence) {
                try {
                    this.logger?.debug('ChartTabsManager', 'Saving chart data to cache');
                    await this.persistence.saveChartData(chartData, chartData.dreamEntries);
                    this.logger?.debug('ChartTabsManager', 'Chart data cached successfully');
                } catch (error) {
                    this.logger?.error('ChartTabsManager', 'Failed to cache chart data', error as Error);
                }
            } else {
                this.logger?.debug('ChartTabsManager', 'No persistence available, charts will not be cached');
            }

        } catch (error) {
            this.logger?.error('ChartTabsManager', 'Failed to initialize chart tabs', error as Error);
        }
    }

    /**
     * Update chart data for existing tabs
     * Also updates the cached data
     */
    public async updateChartData(chartData: ChartData, statisticsTableHTML: string): Promise<void> {
        try {
            if (this.currentChartTabs) {
                this.currentChartTabs.updateData(chartData, chartData.dreamEntries, statisticsTableHTML);
                this.logger?.debug('ChartTabsManager', 'Chart data updated');

                // Update cached data if persistence is available
                if (this.persistence) {
                    try {
                        await this.persistence.saveChartData(chartData, chartData.dreamEntries);
                        this.logger?.debug('ChartTabsManager', 'Updated chart data cached');
                    } catch (error) {
                        this.logger?.warn('ChartTabsManager', 'Failed to cache updated chart data', error);
                        // Non-critical error, continue without caching
                    }
                }
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
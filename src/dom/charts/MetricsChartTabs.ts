import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js/auto';
import { DreamMetricData } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';

export interface ChartTabData {
    metrics: Record<string, number[]>;
    dreamEntries: DreamMetricData[];
}

export class MetricsChartTabs {
    private container: HTMLElement;
    private tabsContainer: HTMLElement;
    private navContainer: HTMLElement;
    private contentContainer: HTMLElement;
    private chartData: ChartTabData;
    private statisticsTableHTML: string;
    private logger?: ILogger;
    private activeTab: string = 'statistics';
    private charts: Map<string, Chart> = new Map();
    private isVisible: boolean = true;

    constructor(
        container: HTMLElement,
        chartData: ChartTabData,
        statisticsTableHTML: string,
        logger?: ILogger,
        activeTab: string = 'statistics'
    ) {
        this.container = container;
        this.chartData = chartData;
        this.statisticsTableHTML = statisticsTableHTML;
        this.logger = logger;
        this.activeTab = activeTab;

        this.initializeStructure();
        this.createTabs();
        this.renderActiveTab();
    }

    /**
     * Initialize the basic DOM structure for chart tabs
     */
    private initializeStructure(): void {
        // Create main container
        this.tabsContainer = document.createElement('div');
        this.tabsContainer.className = 'oom-metrics-chart-tabs-container';

        // Create navigation container
        this.navContainer = document.createElement('div');
        this.navContainer.className = 'oom-metrics-chart-tabs-nav';

        // Create content container
        this.contentContainer = document.createElement('div');
        this.contentContainer.className = 'oom-metrics-chart-tabs-content';

        // Append to main container
        this.tabsContainer.appendChild(this.navContainer);
        this.tabsContainer.appendChild(this.contentContainer);
        this.container.appendChild(this.tabsContainer);
    }

    /**
     * Create tab navigation buttons
     */
    private createTabs(): void {
        const tabs = [
            { id: 'statistics', label: 'Statistics', icon: '📊' },
            { id: 'trends', label: 'Trends', icon: '📈' },
            { id: 'compare', label: 'Compare', icon: '📋' },
            { id: 'correlations', label: 'Correlations', icon: '🔗' },
            { id: 'heatmap', label: 'Heatmap', icon: '🗺️' }
        ];

        tabs.forEach(tab => {
            const tabElement = document.createElement('button');
            tabElement.className = 'oom-metrics-chart-tab';
            tabElement.textContent = `${tab.icon} ${tab.label}`;
            tabElement.dataset.tab = tab.id;
            
            if (tab.id === this.activeTab) {
                tabElement.classList.add('oom-metrics-chart-tab--active');
            }

            tabElement.addEventListener('click', () => this.switchToTab(tab.id));
            this.navContainer.appendChild(tabElement);
        });
    }

    /**
     * Switch to a specific tab
     */
    public switchToTab(tabId: string): void {
        this.logger?.debug('MetricsChartTabs', `Switching to tab: ${tabId}`);
        
        // Update active tab
        this.activeTab = tabId;
        
        // Update tab appearance
        this.updateTabAppearance();
        
        // Render tab content
        this.renderActiveTab();
    }

    /**
     * Update tab button appearance
     */
    private updateTabAppearance(): void {
        this.navContainer.querySelectorAll('.oom-metrics-chart-tab').forEach(tab => {
            tab.classList.remove('oom-metrics-chart-tab--active');
        });

        const activeTabButton = this.navContainer.querySelector(`[data-tab="${this.activeTab}"]`);
        if (activeTabButton) {
            activeTabButton.classList.add('oom-metrics-chart-tab--active');
        }
    }

    /**
     * Render the content for the active tab
     */
    private renderActiveTab(): void {
        this.contentContainer.innerHTML = '';

        switch (this.activeTab) {
            case 'statistics':
                this.renderStatisticsTab();
                break;
            case 'trends':
                this.renderTrendsTab();
                break;
            case 'compare':
                this.renderCompareTab();
                break;
            case 'correlations':
                this.renderCorrelationsTab();
                break;
            case 'heatmap':
                this.renderHeatmapTab();
                break;
            default:
                this.renderPlaceholder('Unknown Tab');
        }
    }

    /**
     * Render statistics tab (existing table)
     */
    private renderStatisticsTab(): void {
        const container = document.createElement('div');
        container.className = 'oom-chart-container';
        container.innerHTML = this.statisticsTableHTML;
        this.contentContainer.appendChild(container);
    }

    /**
     * Render trends tab with line charts
     */
    private renderTrendsTab(): void {
        const container = document.createElement('div');
        container.className = 'oom-chart-container';
        
        const title = document.createElement('h3');
        title.className = 'oom-chart-title';
        title.textContent = 'Metric Trends Over Time';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'oom-chart-canvas';
        
        container.appendChild(title);
        container.appendChild(canvas);
        this.contentContainer.appendChild(container);

        // Create line chart
        this.createTrendsChart(canvas);
    }

    /**
     * Render compare tab with bar charts
     */
    private renderCompareTab(): void {
        const container = document.createElement('div');
        container.className = 'oom-chart-container';
        
        const title = document.createElement('h3');
        title.className = 'oom-chart-title';
        title.textContent = 'Metric Comparison';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'oom-chart-canvas';
        
        container.appendChild(title);
        container.appendChild(canvas);
        this.contentContainer.appendChild(container);

        // Create bar chart
        this.createCompareChart(canvas);
    }

    /**
     * Render correlations tab with scatter plot
     */
    private renderCorrelationsTab(): void {
        const container = document.createElement('div');
        container.className = 'oom-chart-container';
        
        const title = document.createElement('h3');
        title.className = 'oom-chart-title';
        title.textContent = 'Metric Correlations';
        
        const canvas = document.createElement('canvas');
        canvas.className = 'oom-chart-canvas';
        
        container.appendChild(title);
        container.appendChild(canvas);
        this.contentContainer.appendChild(container);

        // Create scatter plot
        this.createCorrelationsChart(canvas);
    }

    /**
     * Render heatmap tab
     */
    private renderHeatmapTab(): void {
        this.renderPlaceholder('Heatmap', 'Heatmap visualization coming soon');
    }

    /**
     * Render placeholder content
     */
    private renderPlaceholder(title: string, description?: string): void {
        const placeholder = document.createElement('div');
        placeholder.className = 'oom-chart-placeholder';
        
        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        
        const descElement = document.createElement('p');
        descElement.textContent = description || 'This chart type is not yet implemented.';
        
        placeholder.appendChild(titleElement);
        placeholder.appendChild(descElement);
        this.contentContainer.appendChild(placeholder);
    }

    /**
     * Create trends line chart
     */
    private createTrendsChart(canvas: HTMLCanvasElement): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        const existingChart = this.charts.get('trends');
        if (existingChart) {
            existingChart.destroy();
        }

        // Prepare data for trends chart
        const datasets = Object.entries(this.chartData.metrics).map(([metricName, values], index) => ({
            label: metricName,
            data: values,
            borderColor: this.getColorForIndex(index),
            backgroundColor: this.getColorForIndex(index, 0.1),
            tension: 0.4
        }));

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.chartData.dreamEntries.map((_, index) => `Entry ${index + 1}`),
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        this.charts.set('trends', chart);
    }

    /**
     * Create compare bar chart
     */
    private createCompareChart(canvas: HTMLCanvasElement): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        const existingChart = this.charts.get('compare');
        if (existingChart) {
            existingChart.destroy();
        }

        // Calculate averages for comparison
        const averages = Object.entries(this.chartData.metrics).map(([metricName, values]) => ({
            label: metricName,
            value: values.reduce((a, b) => a + b, 0) / values.length
        }));

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: averages.map(item => item.label),
                datasets: [{
                    label: 'Average Values',
                    data: averages.map(item => item.value),
                    backgroundColor: averages.map((_, index) => this.getColorForIndex(index, 0.6)),
                    borderColor: averages.map((_, index) => this.getColorForIndex(index)),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        this.charts.set('compare', chart);
    }

    /**
     * Create correlations scatter plot
     */
    private createCorrelationsChart(canvas: HTMLCanvasElement): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        const existingChart = this.charts.get('correlations');
        if (existingChart) {
            existingChart.destroy();
        }

        // For now, create a simple scatter plot between first two metrics
        const metricNames = Object.keys(this.chartData.metrics);
        if (metricNames.length < 2) {
            this.renderPlaceholder('Correlations', 'Need at least 2 metrics for correlation analysis');
            return;
        }

        const xMetric = this.chartData.metrics[metricNames[0]];
        const yMetric = this.chartData.metrics[metricNames[1]];

        const scatterData = xMetric.map((x, index) => ({
            x: x,
            y: yMetric[index] || 0
        }));

        const chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: `${metricNames[0]} vs ${metricNames[1]}`,
                    data: scatterData,
                    backgroundColor: this.getColorForIndex(0, 0.6),
                    borderColor: this.getColorForIndex(0),
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: metricNames[0]
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: metricNames[1]
                        }
                    }
                }
            }
        });

        this.charts.set('correlations', chart);
    }

    /**
     * Get color for chart index
     */
    private getColorForIndex(index: number, alpha: number = 1): string {
        const colors = [
            `rgba(54, 162, 235, ${alpha})`,   // Blue
            `rgba(255, 99, 132, ${alpha})`,   // Red
            `rgba(255, 205, 86, ${alpha})`,   // Yellow
            `rgba(75, 192, 192, ${alpha})`,   // Green
            `rgba(153, 102, 255, ${alpha})`,  // Purple
            `rgba(255, 159, 64, ${alpha})`,   // Orange
        ];
        return colors[index % colors.length];
    }

    /**
     * Update chart data
     */
    public updateData(chartData: ChartTabData, dreamEntries: DreamMetricData[], statisticsTableHTML: string): void {
        this.chartData = chartData;
        this.statisticsTableHTML = statisticsTableHTML;
        this.renderActiveTab();
        this.logger?.debug('MetricsChartTabs', 'Chart data updated');
    }

    /**
     * Show the chart tabs
     */
    public show(): void {
        this.tabsContainer.style.display = 'flex';
        this.isVisible = true;
    }

    /**
     * Hide the chart tabs
     */
    public hide(): void {
        this.tabsContainer.style.display = 'none';
        this.isVisible = false;
    }

    /**
     * Get the current active tab
     */
    public getActiveTab(): string {
        return this.activeTab;
    }

    /**
     * Destroy all charts and clean up
     */
    public destroy(): void {
        // Destroy all charts
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();

        // Remove DOM elements
        if (this.tabsContainer && this.tabsContainer.parentNode) {
            this.tabsContainer.parentNode.removeChild(this.tabsContainer);
        }

        this.logger?.debug('MetricsChartTabs', 'Chart tabs destroyed');
    }
} 
import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js/auto';
import { DreamMetricData } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';
import { CSVExportPipeline, TabType, StatisticsExportOptions, TrendsExportOptions, CompareExportOptions, CorrelationsExportOptions, HeatmapExportOptions } from '../../utils/csv-export-service';

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
    private csvExportPipeline: CSVExportPipeline;

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
        this.csvExportPipeline = new CSVExportPipeline('OneiroMetrics');

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
        
        // Create toolbar with export button
        const toolbar = document.createElement('div');
        toolbar.className = 'oom-chart-toolbar';
        
        const exportButton = this.createExportButton('statistics', 'Export Table Data');
        toolbar.appendChild(exportButton);
        
        // Create content wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'oom-chart-content';
        contentWrapper.innerHTML = this.statisticsTableHTML;
        
        container.appendChild(toolbar);
        container.appendChild(contentWrapper);
        this.contentContainer.appendChild(container);
    }

    /**
     * Render trends tab with line charts
     */
    private renderTrendsTab(): void {
        const container = document.createElement('div');
        container.className = 'oom-chart-container oom-chart-container--loading';
        
        // Create toolbar with export button
        const toolbar = document.createElement('div');
        toolbar.className = 'oom-chart-toolbar';
        
        const title = document.createElement('h3');
        title.className = 'oom-chart-title';
        title.textContent = 'Metric Trends Over Time';
        
        const exportButton = this.createExportButton('trends', 'Export Time Series');
        
        toolbar.appendChild(title);
        toolbar.appendChild(exportButton);
        
        const canvas = document.createElement('canvas');
        canvas.className = 'oom-chart-canvas';
        
        container.appendChild(toolbar);
        container.appendChild(canvas);
        this.contentContainer.appendChild(container);

        // Delay chart creation to ensure container is stable
        setTimeout(() => {
            container.classList.remove('oom-chart-container--loading');
            this.createTrendsChart(canvas);
        }, 50);
    }

    /**
     * Render compare tab with bar charts
     */
    private renderCompareTab(): void {
        const container = document.createElement('div');
        container.className = 'oom-chart-container oom-chart-container--loading';
        
        // Create toolbar with export button
        const toolbar = document.createElement('div');
        toolbar.className = 'oom-chart-toolbar';
        
        const title = document.createElement('h3');
        title.className = 'oom-chart-title';
        title.textContent = 'Metric Comparison';
        
        const exportButton = this.createExportButton('compare', 'Export Comparison Data');
        
        toolbar.appendChild(title);
        toolbar.appendChild(exportButton);
        
        const canvas = document.createElement('canvas');
        canvas.className = 'oom-chart-canvas';
        
        container.appendChild(toolbar);
        container.appendChild(canvas);
        this.contentContainer.appendChild(container);

        // Delay chart creation to ensure container is stable
        setTimeout(() => {
            container.classList.remove('oom-chart-container--loading');
            this.createCompareChart(canvas);
        }, 50);
    }

    /**
     * Render correlations tab with scatter plots
     */
    private renderCorrelationsTab(): void {
        const container = document.createElement('div');
        container.className = 'oom-chart-container oom-chart-container--loading';
        
        // Create toolbar with export button
        const toolbar = document.createElement('div');
        toolbar.className = 'oom-chart-toolbar';
        
        const title = document.createElement('h3');
        title.className = 'oom-chart-title';
        title.textContent = 'Metric Correlations';
        
        const exportButton = this.createExportButton('correlations', 'Export Correlation Matrix');
        
        toolbar.appendChild(title);
        toolbar.appendChild(exportButton);
        
        const canvas = document.createElement('canvas');
        canvas.className = 'oom-chart-canvas';
        
        container.appendChild(toolbar);
        container.appendChild(canvas);
        this.contentContainer.appendChild(container);

        // Delay chart creation to ensure container is stable
        setTimeout(() => {
            container.classList.remove('oom-chart-container--loading');
            this.createCorrelationsChart(canvas);
        }, 50);
    }

    /**
     * Render heatmap tab
     */
    private renderHeatmapTab(): void {
        const container = document.createElement('div');
        container.className = 'oom-chart-container oom-chart-container--loading';
        
        const title = document.createElement('h3');
        title.className = 'oom-chart-title';
        title.textContent = 'Metrics Heatmap';
        
        // Create metric selector
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'oom-heatmap-controls';
        
        const metricSelect = document.createElement('select');
        metricSelect.className = 'oom-metric-selector';
        
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select a metric to visualize...';
        metricSelect.appendChild(defaultOption);
        
        // Populate with available metrics
        Object.keys(this.chartData.metrics).forEach(metricName => {
            const option = document.createElement('option');
            option.value = metricName;
            option.textContent = metricName;
            metricSelect.appendChild(option);
        });
        
        // Create export button for heatmap
        const exportButton = this.createExportButton('heatmap', 'Export Calendar Data');
        
        const heatmapContainer = document.createElement('div');
        heatmapContainer.className = 'oom-heatmap-container';
        
        selectorContainer.appendChild(metricSelect);
        selectorContainer.appendChild(exportButton);
        container.appendChild(title);
        container.appendChild(selectorContainer);
        container.appendChild(heatmapContainer);
        this.contentContainer.appendChild(container);

        // Handle metric selection
        metricSelect.addEventListener('change', () => {
            const selectedMetric = metricSelect.value;
            if (selectedMetric) {
                this.generateCalendarHeatmap(heatmapContainer, selectedMetric);
            } else {
                heatmapContainer.innerHTML = '<div class="oom-heatmap-placeholder">Select a metric to visualize the heatmap</div>';
            }
        });

        // Remove loading state
        setTimeout(() => {
            container.classList.remove('oom-chart-container--loading');
            if (Object.keys(this.chartData.metrics).length > 0) {
                // Auto-select first metric
                metricSelect.value = Object.keys(this.chartData.metrics)[0];
                metricSelect.dispatchEvent(new Event('change'));
            }
        }, 50);
    }

    /**
     * Generate calendar-style heatmap for a specific metric
     */
    private generateCalendarHeatmap(container: HTMLElement, metricName: string): void {
        container.innerHTML = '';
        
        if (!this.chartData.dreamEntries || this.chartData.dreamEntries.length === 0) {
            container.innerHTML = '<div class="oom-heatmap-placeholder">No data available for heatmap</div>';
            return;
        }

        // Prepare data grouped by date
        const dateMetrics = new Map<string, number[]>();
        
        this.chartData.dreamEntries.forEach(entry => {
            if (entry.metrics && entry.metrics[metricName] !== undefined) {
                const dateKey = this.parseDateKey(entry.date);
                if (dateKey) {
                    if (!dateMetrics.has(dateKey)) {
                        dateMetrics.set(dateKey, []);
                    }
                    const metricValue = Number(entry.metrics[metricName]);
                    if (!isNaN(metricValue)) {
                        dateMetrics.get(dateKey)!.push(metricValue);
                    }
                }
            }
        });

        // Calculate averages and find min/max for color scaling
        const dateAverages = new Map<string, number>();
        let minValue = Infinity;
        let maxValue = -Infinity;
        
        dateMetrics.forEach((values, date) => {
            const average = values.reduce((a, b) => a + b, 0) / values.length;
            dateAverages.set(date, average);
            minValue = Math.min(minValue, average);
            maxValue = Math.max(maxValue, average);
        });

        if (dateAverages.size === 0) {
            container.innerHTML = `<div class="oom-heatmap-placeholder">No data available for metric: ${metricName}</div>`;
            return;
        }

        // Generate calendar grid
        this.generateCalendarGrid(container, dateAverages, minValue, maxValue, metricName);
    }

    /**
     * Parse date string to YYYY-MM-DD format
     */
    private parseDateKey(dateStr: string): string | null {
        try {
            // Handle various date formats
            let date: Date;
            
            if (dateStr.includes('T') || dateStr.includes('Z')) {
                // ISO format
                date = new Date(dateStr);
            } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Already in YYYY-MM-DD format
                return dateStr;
            } else {
                // Try parsing as general date
                date = new Date(dateStr);
            }
            
            if (isNaN(date.getTime())) {
                return null;
            }
            
            // Format as YYYY-MM-DD
            return date.toISOString().split('T')[0];
        } catch (error) {
            this.logger?.warn('MetricsChartTabs', 'Failed to parse date', { dateStr, error });
            return null;
        }
    }

    /**
     * Generate calendar grid layout
     */
    private generateCalendarGrid(
        container: HTMLElement,
        dateAverages: Map<string, number>,
        minValue: number,
        maxValue: number,
        metricName: string
    ): void {
        // Find date range
        const dates = Array.from(dateAverages.keys()).sort();
        if (dates.length === 0) return;

        const startDate = new Date(dates[0]);
        const endDate = new Date(dates[dates.length - 1]);
        
        // Create legend
        const legend = document.createElement('div');
        legend.className = 'oom-heatmap-legend';
        legend.innerHTML = `
            <div class="oom-heatmap-legend-title">Intensity Scale for ${metricName}</div>
            <div class="oom-heatmap-legend-scale">
                <span class="oom-heatmap-legend-min">${minValue.toFixed(1)}</span>
                <div class="oom-heatmap-legend-gradient">
                    <div class="oom-heatmap-legend-color-low"></div>
                    <div class="oom-heatmap-legend-color-medium"></div>
                    <div class="oom-heatmap-legend-color-high"></div>
                </div>
                <span class="oom-heatmap-legend-max">${maxValue.toFixed(1)}</span>
            </div>
        `;
        
        // Create months container
        const monthsContainer = document.createElement('div');
        monthsContainer.className = 'oom-heatmap-months';
        
        // Group dates by month
        const monthGroups = new Map<string, string[]>();
        dates.forEach(dateStr => {
            const date = new Date(dateStr);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthGroups.has(monthKey)) {
                monthGroups.set(monthKey, []);
            }
            monthGroups.get(monthKey)!.push(dateStr);
        });

        // Generate each month
        Array.from(monthGroups.keys()).sort().forEach(monthKey => {
            const monthDates = monthGroups.get(monthKey)!;
            const monthDiv = this.generateMonthGrid(monthKey, monthDates, dateAverages, minValue, maxValue, metricName);
            monthsContainer.appendChild(monthDiv);
        });

        container.appendChild(legend);
        container.appendChild(monthsContainer);
    }

    /**
     * Generate grid for a single month
     */
    private generateMonthGrid(
        monthKey: string,
        monthDates: string[],
        dateAverages: Map<string, number>,
        minValue: number,
        maxValue: number,
        metricName: string
    ): HTMLElement {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'oom-heatmap-month';
        
        // Month header
        const [year, month] = monthKey.split('-').map(Number);
        const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const header = document.createElement('div');
        header.className = 'oom-heatmap-month-header';
        header.textContent = monthName;
        
        // Days grid
        const daysGrid = document.createElement('div');
        daysGrid.className = 'oom-heatmap-days-grid';
        
        // Add day labels
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayLabels.forEach(label => {
            const dayLabel = document.createElement('div');
            dayLabel.className = 'oom-heatmap-day-label';
            dayLabel.textContent = label;
            daysGrid.appendChild(dayLabel);
        });
        
        // Generate calendar days for the month
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const startOffset = firstDay.getDay(); // 0 = Sunday
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startOffset; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'oom-heatmap-day oom-heatmap-day-empty';
            daysGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayDiv = document.createElement('div');
            dayDiv.className = 'oom-heatmap-day';
            dayDiv.textContent = String(day);
            
            if (dateAverages.has(dateStr)) {
                const value = dateAverages.get(dateStr)!;
                const intensity = (value - minValue) / (maxValue - minValue);
                
                // Apply intensity-based styling
                dayDiv.classList.add('oom-heatmap-day-data');
                dayDiv.style.setProperty('--intensity', intensity.toString());
                dayDiv.title = `${dateStr}: ${metricName} = ${value.toFixed(2)}`;
                
                // Add intensity class for CSS styling
                if (intensity >= 0.7) {
                    dayDiv.classList.add('oom-heatmap-intensity-high');
                } else if (intensity >= 0.4) {
                    dayDiv.classList.add('oom-heatmap-intensity-medium');
                } else {
                    dayDiv.classList.add('oom-heatmap-intensity-low');
                }
            } else {
                dayDiv.classList.add('oom-heatmap-day-no-data');
                dayDiv.title = `${dateStr}: No data for ${metricName}`;
            }
            
            daysGrid.appendChild(dayDiv);
        }
        
        monthDiv.appendChild(header);
        monthDiv.appendChild(daysGrid);
        
        return monthDiv;
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
                layout: {
                    padding: {
                        top: 10,
                        right: 10,
                        bottom: 10,
                        left: 10
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                // Prevent animation on initial render to avoid sizing issues
                animation: {
                    duration: 0
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
                layout: {
                    padding: {
                        top: 10,
                        right: 10,
                        bottom: 10,
                        left: 10
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                // Prevent animation on initial render to avoid sizing issues
                animation: {
                    duration: 0
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
                layout: {
                    padding: {
                        top: 10,
                        right: 10,
                        bottom: 10,
                        left: 10
                    }
                },
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
                },
                // Prevent animation on initial render to avoid sizing issues
                animation: {
                    duration: 0
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
     * Create export button for a tab
     */
    private createExportButton(tabType: TabType, label: string): HTMLElement {
        const exportButton = document.createElement('button');
        exportButton.className = 'oom-export-button';
        exportButton.innerHTML = `<span class="oom-export-icon">📊</span> ${label}`;
        exportButton.title = `Export ${tabType} data as CSV`;
        
        exportButton.addEventListener('click', async () => {
            await this.handleExportClick(tabType);
        });
        
        return exportButton;
    }

    /**
     * Handle export button click for a specific tab
     */
    private async handleExportClick(tabType: TabType): Promise<void> {
        try {
            this.logger?.debug('MetricsChartTabs', `Exporting ${tabType} data`);
            
            // Prepare tab-specific export options
            const baseOptions = {
                format: 'csv' as const,
                includeMetadata: true,
                normalization: 'none' as const,
                includeCalculated: true
            };

            let csvContent: string;
            let filename: string;

            switch (tabType) {
                case 'statistics':
                    const statsOptions: StatisticsExportOptions = {
                        ...baseOptions,
                        includeQualityScore: true,
                        includeEntryDetails: true,
                        groupBy: 'date'
                    };
                    csvContent = await this.csvExportPipeline.exportStatisticsData(this.chartData.dreamEntries, statsOptions);
                    filename = `oneirometrics-statistics-${new Date().toISOString().split('T')[0]}.csv`;
                    break;

                case 'trends':
                    const trendsOptions: TrendsExportOptions = {
                        ...baseOptions,
                        includeMovingAverages: true,
                        aggregationPeriod: 'daily',
                        includeTrendAnalysis: true
                    };
                    csvContent = await this.csvExportPipeline.exportTrendsData(this.chartData.dreamEntries, trendsOptions);
                    filename = `oneirometrics-trends-${new Date().toISOString().split('T')[0]}.csv`;
                    break;

                case 'compare':
                    const compareOptions: CompareExportOptions = {
                        ...baseOptions,
                        comparisonMetrics: Object.keys(this.chartData.metrics),
                        includeStatistics: true,
                        includeCorrelations: true
                    };
                    csvContent = await this.csvExportPipeline.exportCompareData(this.chartData.dreamEntries, compareOptions);
                    filename = `oneirometrics-compare-${new Date().toISOString().split('T')[0]}.csv`;
                    break;

                case 'correlations':
                    const correlationsOptions: CorrelationsExportOptions = {
                        ...baseOptions,
                        includeConfidenceIntervals: true,
                        minimumSampleSize: 5,
                        includePValues: true
                    };
                    csvContent = await this.csvExportPipeline.exportCorrelationsData(this.chartData.dreamEntries, correlationsOptions);
                    filename = `oneirometrics-correlations-${new Date().toISOString().split('T')[0]}.csv`;
                    break;

                case 'heatmap':
                    const heatmapOptions: HeatmapExportOptions = {
                        ...baseOptions,
                        selectedMetric: this.getSelectedHeatmapMetric() || Object.keys(this.chartData.metrics)[0] || 'Unknown',
                        includeIntensityLevels: true,
                        includeDensityData: true
                    };
                    csvContent = await this.csvExportPipeline.exportHeatmapData(this.chartData.dreamEntries, heatmapOptions);
                    filename = `oneirometrics-heatmap-${new Date().toISOString().split('T')[0]}.csv`;
                    break;

                default:
                    throw new Error(`Unsupported export type: ${tabType}`);
            }

            // Trigger download
            this.csvExportPipeline.triggerDownload(csvContent, filename, tabType);
            
            this.logger?.debug('MetricsChartTabs', `Export completed for ${tabType}`);
            
        } catch (error) {
            this.logger?.error('MetricsChartTabs', `Export failed for ${tabType}`, { error });
            // Show user-friendly error message
            this.showExportError(tabType, error as Error);
        }
    }

    /**
     * Get the currently selected metric in the heatmap tab
     */
    private getSelectedHeatmapMetric(): string | null {
        const metricSelect = this.contentContainer.querySelector('.oom-metric-selector') as HTMLSelectElement;
        return metricSelect?.value || null;
    }

    /**
     * Show error message for failed exports
     */
    private showExportError(tabType: TabType, error: Error): void {
        // Create temporary error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'oom-export-error';
        errorDiv.innerHTML = `
            <div class="oom-export-error-content">
                <span class="oom-export-error-icon">❌</span>
                <span class="oom-export-error-message">Export failed for ${tabType}: ${error.message}</span>
                <button class="oom-export-error-close">×</button>
            </div>
        `;
        
        // Add to current tab content
        this.contentContainer.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
        
        // Manual close button
        const closeButton = errorDiv.querySelector('.oom-export-error-close');
        closeButton?.addEventListener('click', () => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        });
    }
} 
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
            { id: 'heatmap', label: 'Heatmap', icon: '🗺️' },
            { id: 'insights', label: 'Insights', icon: '💡' }
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
            case 'insights':
                this.renderInsightsTab();
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
     * Render heatmap tab with calendar view
     */
    private renderHeatmapTab(): void {
        const container = document.createElement('div');
        container.className = 'oom-chart-container';
        
        // Create toolbar with export button
        const toolbar = document.createElement('div');
        toolbar.className = 'oom-chart-toolbar';
        
        const title = document.createElement('h3');
        title.className = 'oom-chart-title';
        title.textContent = 'Metric Heatmap';
        
        const exportButton = this.createExportButton('heatmap', 'Export Calendar Data');
        
        toolbar.appendChild(title);
        toolbar.appendChild(exportButton);
        
        // Create metric selector
        const selectorWrapper = document.createElement('div');
        selectorWrapper.className = 'oom-heatmap-controls';
        
        const label = document.createElement('label');
        label.textContent = 'Select Metric: ';
        label.className = 'oom-heatmap-label';
        
        const selector = document.createElement('select');
        selector.className = 'oom-heatmap-selector';
        selector.id = 'oom-heatmap-metric-selector';
        
        // Add options for each metric
        const metricNames = Object.keys(this.chartData.metrics);
        metricNames.forEach(metricName => {
            const option = document.createElement('option');
            option.value = metricName;
            option.textContent = metricName;
            selector.appendChild(option);
        });
        
        // Set default selection
        if (metricNames.length > 0) {
            selector.value = metricNames[0];
        }
        
        selectorWrapper.appendChild(label);
        selectorWrapper.appendChild(selector);
        
        // Create calendar container
        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'oom-heatmap-calendar';
        
        container.appendChild(toolbar);
        container.appendChild(selectorWrapper);
        container.appendChild(calendarContainer);
        this.contentContainer.appendChild(container);
        
        // Generate initial heatmap
        if (metricNames.length > 0) {
            this.generateCalendarHeatmap(calendarContainer, metricNames[0]);
        }
        
        // Add event listener for metric selection changes
        selector.addEventListener('change', (event) => {
            const target = event.target as HTMLSelectElement;
            calendarContainer.innerHTML = '';
            this.generateCalendarHeatmap(calendarContainer, target.value);
        });
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
        const metricSelect = this.contentContainer.querySelector('.oom-heatmap-selector') as HTMLSelectElement;
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

    /**
     * Render insights tab with enhanced analytics
     */
    private renderInsightsTab(): void {
        const container = document.createElement('div');
        container.className = 'oom-chart-container';
        
        // Create toolbar with export button
        const toolbar = document.createElement('div');
        toolbar.className = 'oom-chart-toolbar';
        
        const title = document.createElement('h3');
        title.className = 'oom-chart-title';
        title.textContent = 'Data Insights & Analytics';
        
        const exportButton = this.createExportButton('insights', 'Export Insights');
        
        toolbar.appendChild(title);
        toolbar.appendChild(exportButton);
        
        // Create insights content
        const insightsContent = document.createElement('div');
        insightsContent.className = 'oom-insights-content';
        
        // Generate insights
        this.generateInsights(insightsContent);
        
        container.appendChild(toolbar);
        container.appendChild(insightsContent);
        this.contentContainer.appendChild(container);
    }

    /**
     * Generate insights content with enhanced analytics
     */
    private generateInsights(container: HTMLElement): void {
        try {
            // Clear container
            container.innerHTML = '';
            
            if (!this.chartData.dreamEntries || this.chartData.dreamEntries.length === 0) {
                container.innerHTML = '<div class="oom-insights-empty">No data available for analysis</div>';
                return;
            }

            // Create insights sections
            const sections = [
                this.createDataOverviewSection(),
                this.createTrendInsightsSection(),
                this.createOutlierAnalysisSection(),
                this.createCorrelationInsightsSection(),
                this.createPatternRecognitionSection()
            ];

            sections.forEach(section => {
                if (section) {
                    container.appendChild(section);
                }
            });

        } catch (error) {
            this.logger?.error('MetricsChartTabs', 'Error generating insights', error);
            container.innerHTML = '<div class="oom-insights-error">Error generating insights. Please try again.</div>';
        }
    }

    /**
     * Create data overview section
     */
    private createDataOverviewSection(): HTMLElement {
        const section = document.createElement('div');
        section.className = 'oom-insights-section';
        
        const header = document.createElement('h4');
        header.className = 'oom-insights-header';
        header.textContent = '📊 Data Overview';
        
        const content = document.createElement('div');
        content.className = 'oom-insights-content';
        
        const totalEntries = this.chartData.dreamEntries.length;
        const totalMetrics = Object.keys(this.chartData.metrics).length;
        const dateRange = this.getDateRange();
        const avgEntriesPerWeek = this.calculateAverageEntriesPerWeek();
        
        content.innerHTML = `
            <div class="oom-insight-item">
                <span class="oom-insight-label">Total Dream Entries:</span>
                <span class="oom-insight-value">${totalEntries}</span>
            </div>
            <div class="oom-insight-item">
                <span class="oom-insight-label">Tracked Metrics:</span>
                <span class="oom-insight-value">${totalMetrics}</span>
            </div>
            <div class="oom-insight-item">
                <span class="oom-insight-label">Date Range:</span>
                <span class="oom-insight-value">${dateRange}</span>
            </div>
            <div class="oom-insight-item">
                <span class="oom-insight-label">Average Entries per Week:</span>
                <span class="oom-insight-value">${avgEntriesPerWeek.toFixed(1)}</span>
            </div>
        `;
        
        section.appendChild(header);
        section.appendChild(content);
        return section;
    }

    /**
     * Create trend insights section
     */
    private createTrendInsightsSection(): HTMLElement {
        const section = document.createElement('div');
        section.className = 'oom-insights-section';
        
        const header = document.createElement('h4');
        header.className = 'oom-insights-header';
        header.textContent = '📈 Trend Analysis';
        
        const content = document.createElement('div');
        content.className = 'oom-insights-content';
        
        const trendAnalysis = this.analyzeTrends();
        
        content.innerHTML = trendAnalysis.map(trend => `
            <div class="oom-insight-item">
                <span class="oom-insight-label">${trend.metric}:</span>
                <span class="oom-insight-value ${trend.direction === 'improving' ? 'oom-trend-positive' : trend.direction === 'declining' ? 'oom-trend-negative' : 'oom-trend-stable'}">${trend.description}</span>
            </div>
        `).join('');
        
        section.appendChild(header);
        section.appendChild(content);
        return section;
    }

    /**
     * Create outlier analysis section
     */
    private createOutlierAnalysisSection(): HTMLElement {
        const section = document.createElement('div');
        section.className = 'oom-insights-section';
        
        const header = document.createElement('h4');
        header.className = 'oom-insights-header';
        header.textContent = '🎯 Outlier Detection';
        
        const content = document.createElement('div');
        content.className = 'oom-insights-content';
        
        const outliers = this.detectOutliers();
        
        if (outliers.length === 0) {
            content.innerHTML = '<div class="oom-insight-item">No significant outliers detected</div>';
        } else {
            content.innerHTML = outliers.map(outlier => `
                <div class="oom-insight-item">
                    <span class="oom-insight-label">${outlier.date} (${outlier.metric}):</span>
                    <span class="oom-insight-value oom-outlier-${outlier.type}">${outlier.description}</span>
                </div>
            `).join('');
        }
        
        section.appendChild(header);
        section.appendChild(content);
        return section;
    }

    /**
     * Create correlation insights section
     */
    private createCorrelationInsightsSection(): HTMLElement {
        const section = document.createElement('div');
        section.className = 'oom-insights-section';
        
        const header = document.createElement('h4');
        header.className = 'oom-insights-header';
        header.textContent = '🔗 Key Correlations';
        
        const content = document.createElement('div');
        content.className = 'oom-insights-content';
        
        const correlations = this.findStrongCorrelations();
        
        if (correlations.length === 0) {
            content.innerHTML = '<div class="oom-insight-item">No strong correlations found</div>';
        } else {
            content.innerHTML = correlations.map(corr => `
                <div class="oom-insight-item">
                    <span class="oom-insight-label">${corr.metric1} ↔ ${corr.metric2}:</span>
                    <span class="oom-insight-value oom-correlation-${corr.strength}">${corr.description}</span>
                </div>
            `).join('');
        }
        
        section.appendChild(header);
        section.appendChild(content);
        return section;
    }

    /**
     * Create pattern recognition section
     */
    private createPatternRecognitionSection(): HTMLElement {
        const section = document.createElement('div');
        section.className = 'oom-insights-section';
        
        const header = document.createElement('h4');
        header.className = 'oom-insights-header';
        header.textContent = '🔍 Pattern Analysis';
        
        const content = document.createElement('div');
        content.className = 'oom-insights-content';
        
        const patterns = this.recognizePatterns();
        
        content.innerHTML = patterns.map(pattern => `
            <div class="oom-insight-item">
                <span class="oom-insight-label">${pattern.type}:</span>
                <span class="oom-insight-value">${pattern.description}</span>
            </div>
        `).join('');
        
        section.appendChild(header);
        section.appendChild(content);
        return section;
    }

    // Helper methods for insights generation
    private getDateRange(): string {
        if (this.chartData.dreamEntries.length === 0) return 'No data';
        
        const dates = this.chartData.dreamEntries
            .map(entry => new Date(entry.date))
            .filter(date => !isNaN(date.getTime()))
            .sort((a, b) => a.getTime() - b.getTime());
        
        if (dates.length === 0) return 'Invalid dates';
        
        const firstDate = dates[0].toLocaleDateString();
        const lastDate = dates[dates.length - 1].toLocaleDateString();
        
        return firstDate === lastDate ? firstDate : `${firstDate} to ${lastDate}`;
    }

    private calculateAverageEntriesPerWeek(): number {
        if (this.chartData.dreamEntries.length === 0) return 0;
        
        const dates = this.chartData.dreamEntries
            .map(entry => new Date(entry.date))
            .filter(date => !isNaN(date.getTime()))
            .sort((a, b) => a.getTime() - b.getTime());
        
        if (dates.length === 0) return 0;
        
        const daysBetween = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
        const weeks = Math.max(daysBetween / 7, 1); // At least 1 week
        
        return this.chartData.dreamEntries.length / weeks;
    }

    private analyzeTrends(): Array<{metric: string, direction: string, description: string}> {
        const trends: Array<{metric: string, direction: string, description: string}> = [];
        
        Object.entries(this.chartData.metrics).forEach(([metricName, values]) => {
            if (values.length < 3) return; // Need at least 3 points for trend
            
            const numericValues = values.filter(v => typeof v === 'number') as number[];
            if (numericValues.length < 3) return;
            
            const slope = this.calculateSlope(numericValues);
            const recent = numericValues.slice(-5); // Last 5 values
            const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
            const older = numericValues.slice(0, Math.min(5, numericValues.length - 5));
            const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
            
            let direction = 'stable';
            let description = 'No significant trend';
            
            if (Math.abs(slope) > 0.1) { // Threshold for significant trend
                if (slope > 0) {
                    direction = 'improving';
                    description = `Improving trend (+${(recentAvg - olderAvg).toFixed(2)} recently)`;
                } else {
                    direction = 'declining';
                    description = `Declining trend (${(recentAvg - olderAvg).toFixed(2)} recently)`;
                }
            }
            
            trends.push({ metric: metricName, direction, description });
        });
        
        return trends;
    }

    private calculateSlope(values: number[]): number {
        const n = values.length;
        const sumX = (n * (n - 1)) / 2; // Sum of indices 0,1,2...n-1
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
        const sumXX = values.reduce((sum, _, x) => sum + x * x, 0);
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    private detectOutliers(): Array<{date: string, metric: string, type: string, description: string}> {
        const outliers: Array<{date: string, metric: string, type: string, description: string}> = [];
        
        Object.entries(this.chartData.metrics).forEach(([metricName, values]) => {
            const numericValues = values.filter(v => typeof v === 'number') as number[];
            if (numericValues.length < 5) return; // Need enough data points
            
            const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
            const stdDev = Math.sqrt(numericValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / numericValues.length);
            
            numericValues.forEach((value, index) => {
                const zScore = Math.abs((value - mean) / stdDev);
                if (zScore > 2.5) { // 2.5 standard deviations
                    const entryDate = this.chartData.dreamEntries[index]?.date || `Entry ${index + 1}`;
                    const type = value > mean ? 'high' : 'low';
                    const description = `Unusually ${type} value (${value.toFixed(2)})`;
                    outliers.push({ date: entryDate, metric: metricName, type, description });
                }
            });
        });
        
        return outliers.slice(0, 10); // Limit to top 10 outliers
    }

    private findStrongCorrelations(): Array<{metric1: string, metric2: string, strength: string, description: string}> {
        const correlations: Array<{metric1: string, metric2: string, strength: string, description: string}> = [];
        const metricNames = Object.keys(this.chartData.metrics);
        
        for (let i = 0; i < metricNames.length; i++) {
            for (let j = i + 1; j < metricNames.length; j++) {
                const metric1 = metricNames[i];
                const metric2 = metricNames[j];
                const values1 = this.chartData.metrics[metric1].filter(v => typeof v === 'number') as number[];
                const values2 = this.chartData.metrics[metric2].filter(v => typeof v === 'number') as number[];
                
                if (values1.length !== values2.length || values1.length < 3) continue;
                
                const correlation = this.calculatePearsonCorrelation(values1, values2);
                const absCorr = Math.abs(correlation);
                
                if (absCorr > 0.5) { // Strong correlation threshold
                    const strength = absCorr > 0.7 ? 'strong' : 'moderate';
                    const direction = correlation > 0 ? 'positive' : 'negative';
                    const description = `${strength} ${direction} correlation (r=${correlation.toFixed(3)})`;
                    correlations.push({ metric1, metric2, strength, description });
                }
            }
        }
        
        return correlations.slice(0, 8); // Limit to top 8 correlations
    }

    private calculatePearsonCorrelation(x: number[], y: number[]): number {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    private recognizePatterns(): Array<{type: string, description: string}> {
        const patterns: Array<{type: string, description: string}> = [];
        
        // Analyze entry frequency patterns
        const entryFrequency = this.analyzeEntryFrequency();
        if (entryFrequency) patterns.push(entryFrequency);
        
        // Analyze cyclical patterns
        const cyclicalPatterns = this.analyzeCyclicalPatterns();
        patterns.push(...cyclicalPatterns);
        
        // Analyze metric consistency
        const consistencyPattern = this.analyzeMetricConsistency();
        if (consistencyPattern) patterns.push(consistencyPattern);
        
        return patterns;
    }

    private analyzeEntryFrequency(): {type: string, description: string} | null {
        if (this.chartData.dreamEntries.length < 7) return null;
        
        const dates = this.chartData.dreamEntries.map(entry => new Date(entry.date).getDay());
        const dayCounts = Array(7).fill(0);
        dates.forEach(day => dayCounts[day]++);
        
        const maxDay = dayCounts.indexOf(Math.max(...dayCounts));
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        return {
            type: 'Entry Frequency',
            description: `Most dreams recorded on ${dayNames[maxDay]}s (${dayCounts[maxDay]} entries)`
        };
    }

    private analyzeCyclicalPatterns(): Array<{type: string, description: string}> {
        const patterns: Array<{type: string, description: string}> = [];
        
        Object.entries(this.chartData.metrics).forEach(([metricName, values]) => {
            const numericValues = values.filter(v => typeof v === 'number') as number[];
            if (numericValues.length < 14) return; // Need at least 2 weeks of data
            
            // Simple pattern detection: check for weekly cycles
            const weeklyPattern = this.detectWeeklyPattern(numericValues);
            if (weeklyPattern) {
                patterns.push({
                    type: `${metricName} Weekly Pattern`,
                    description: weeklyPattern
                });
            }
        });
        
        return patterns.slice(0, 3); // Limit to 3 patterns
    }

    private detectWeeklyPattern(values: number[]): string | null {
        if (values.length < 14) return null;
        
        // Group by week day (assuming daily entries)
        const weeks = Math.floor(values.length / 7);
        if (weeks < 2) return null;
        
        const weeklyAverages: number[] = [];
        for (let week = 0; week < weeks; week++) {
            const weekValues = values.slice(week * 7, (week + 1) * 7);
            const avg = weekValues.reduce((a, b) => a + b, 0) / weekValues.length;
            weeklyAverages.push(avg);
        }
        
        const overallAvg = weeklyAverages.reduce((a, b) => a + b, 0) / weeklyAverages.length;
        const variation = Math.sqrt(weeklyAverages.reduce((sq, avg) => sq + Math.pow(avg - overallAvg, 2), 0) / weeklyAverages.length);
        
        if (variation > overallAvg * 0.2) { // 20% variation threshold
            return `Shows weekly variation (CV: ${(variation / overallAvg * 100).toFixed(1)}%)`;
        }
        
        return null;
    }

    private analyzeMetricConsistency(): {type: string, description: string} | null {
        const metricNames = Object.keys(this.chartData.metrics);
        if (metricNames.length === 0) return null;
        
        const consistencyScores = metricNames.map(metricName => {
            const values = this.chartData.metrics[metricName].filter(v => typeof v === 'number') as number[];
            if (values.length < 3) return { metric: metricName, score: 0 };
            
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
            const cv = Math.sqrt(variance) / mean; // Coefficient of variation
            const consistency = Math.max(0, 1 - cv); // Higher = more consistent
            
            return { metric: metricName, score: consistency };
        });
        
        const mostConsistent = consistencyScores.reduce((best, current) => 
            current.score > best.score ? current : best
        );
        
        return {
            type: 'Metric Consistency',
            description: `${mostConsistent.metric} shows highest consistency (${(mostConsistent.score * 100).toFixed(1)}%)`
        };
    }
} 
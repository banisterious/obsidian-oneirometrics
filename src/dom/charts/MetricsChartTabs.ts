import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js/auto';
import { DreamMetricData } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';
import { CSVExportPipeline, TabType, StatisticsExportOptions, TrendsExportOptions, CompareExportOptions, CorrelationsExportOptions, HeatmapExportOptions, InsightsExportOptions } from '../../utils/csv-export-service';

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

        // Add ARIA attributes to navigation container
        this.navContainer.setAttribute('role', 'tablist');

        // Add ARIA attributes to content container
        this.contentContainer.setAttribute('role', 'tabpanel');
        this.contentContainer.setAttribute('aria-live', 'polite');

        tabs.forEach((tab, index) => {
            const tabElement = document.createElement('button');
            tabElement.className = 'oom-metrics-chart-tab';
            tabElement.textContent = `${tab.icon} ${tab.label}`;
            tabElement.dataset.tab = tab.id;
            
            // Add accessibility attributes
            tabElement.setAttribute('role', 'tab');
            tabElement.setAttribute('aria-controls', `oom-tabpanel-${tab.id}`);
            tabElement.setAttribute('aria-selected', tab.id === this.activeTab ? 'true' : 'false');
            tabElement.setAttribute('aria-describedby', `oom-tab-desc-${tab.id}`);
            tabElement.setAttribute('tabindex', tab.id === this.activeTab ? '0' : '-1');
            tabElement.id = `oom-tab-${tab.id}`;
            
            // Add screen reader description
            const description = this.getTabDescription(tab.id);
            tabElement.title = description;
            
            if (tab.id === this.activeTab) {
                tabElement.classList.add('oom-metrics-chart-tab--active');
            }

            // Add click handler
            tabElement.addEventListener('click', () => this.switchToTab(tab.id));
            
            // Add keyboard navigation
            tabElement.addEventListener('keydown', (event) => this.handleTabKeydown(event, tabs, index));
            
            this.navContainer.appendChild(tabElement);
        });

        // Set up content container with proper ARIA attributes
        this.contentContainer.id = `oom-tabpanel-${this.activeTab}`;
        this.contentContainer.setAttribute('aria-labelledby', `oom-tab-${this.activeTab}`);
    }

    /**
     * Get descriptive text for screen readers
     */
    private getTabDescription(tabId: string): string {
        const descriptions = {
            'statistics': 'View statistical summary table of dream metrics with sortable columns and export options',
            'trends': 'Analyze metric trends over time with line charts, area charts, and trend decomposition',
            'compare': 'Compare metrics using bar charts, box plots, and violin plots to understand distributions',
            'correlations': 'Explore relationships between metrics using correlation matrices, scatter plots, and network graphs',
            'heatmap': 'View metric intensity over time using calendar heatmap visualization',
            'insights': 'Access comprehensive analytics including trend analysis, outlier detection, and pattern recognition'
        };
        return descriptions[tabId] || `View ${tabId} analysis`;
    }

    /**
     * Handle keyboard navigation for tabs
     */
    private handleTabKeydown(event: KeyboardEvent, tabs: Array<{id: string, label: string, icon: string}>, currentIndex: number): void {
        let targetIndex = currentIndex;
        
        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                targetIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                targetIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'Home':
                event.preventDefault();
                targetIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                targetIndex = tabs.length - 1;
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                this.switchToTab(tabs[currentIndex].id);
                return;
            default:
                return;
        }
        
        // Focus and activate the target tab
        this.switchToTab(tabs[targetIndex].id);
        const targetTab = this.navContainer.querySelector(`[data-tab="${tabs[targetIndex].id}"]`) as HTMLElement;
        if (targetTab) {
            targetTab.focus();
        }
    }

    /**
     * Switch to a specific tab
     */
    public switchToTab(tabId: string): void {
        this.logger?.debug('MetricsChartTabs', `Switching to tab: ${tabId}`);
        
        // Update active tab
        this.activeTab = tabId;
        
        // Update tab appearance and accessibility
        this.updateTabAppearance();
        
        // Update content container ARIA attributes
        this.contentContainer.id = `oom-tabpanel-${tabId}`;
        this.contentContainer.setAttribute('aria-labelledby', `oom-tab-${tabId}`);
        
        // Render tab content
        this.renderActiveTab();
        
        // Announce tab change to screen readers
        this.announceTabChange(tabId);
    }

    /**
     * Update tab button appearance and accessibility
     */
    private updateTabAppearance(): void {
        this.navContainer.querySelectorAll('.oom-metrics-chart-tab').forEach(tab => {
            const tabElement = tab as HTMLElement;
            const isActive = tabElement.dataset.tab === this.activeTab;
            
            // Update visual state
            tabElement.classList.toggle('oom-metrics-chart-tab--active', isActive);
            
            // Update accessibility attributes
            tabElement.setAttribute('aria-selected', isActive ? 'true' : 'false');
            tabElement.setAttribute('tabindex', isActive ? '0' : '-1');
        });
    }

    /**
     * Announce tab change to screen readers
     */
    private announceTabChange(tabId: string): void {
        const tabElement = this.navContainer.querySelector(`[data-tab="${tabId}"]`) as HTMLElement;
        if (tabElement) {
            const announcement = `Switched to ${tabElement.textContent?.replace(/[^\w\s]/g, '').trim()} tab. ${this.getTabDescription(tabId)}`;
            
            // Create temporary announcement element
            const announcer = document.createElement('div');
            announcer.setAttribute('aria-live', 'assertive');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'oom-sr-only';
            announcer.textContent = announcement;
            
            document.body.appendChild(announcer);
            
            // Remove after announcement
            setTimeout(() => {
                if (announcer.parentNode) {
                    announcer.parentNode.removeChild(announcer);
                }
            }, 1000);
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

        // Announce data summary after a brief delay to allow content to render
        setTimeout(() => {
            this.announceChartDataSummary(this.activeTab);
        }, 500);
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
        
        // Create toolbar with export button and chart options
        const toolbar = document.createElement('div');
        toolbar.className = 'oom-chart-toolbar';
        
        const title = document.createElement('h3');
        title.className = 'oom-chart-title';
        title.textContent = 'Metric Trends Over Time';
        
        // Add chart type selector
        const chartTypeSelector = document.createElement('div');
        chartTypeSelector.className = 'oom-chart-type-selector';
        
        const selectorLabel = document.createElement('label');
        selectorLabel.textContent = 'View: ';
        selectorLabel.className = 'oom-chart-selector-label';
        selectorLabel.htmlFor = 'oom-trends-chart-selector';
        
        const selector = document.createElement('select');
        selector.className = 'oom-chart-selector';
        selector.id = 'oom-trends-chart-selector';
        selector.setAttribute('aria-describedby', 'oom-trends-selector-desc');
        selector.innerHTML = `
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
            <option value="scatter">Scatter with Trends</option>
            <option value="decomposition">Trend Decomposition</option>
        `;
        
        // Add screen reader description
        const selectorDesc = document.createElement('div');
        selectorDesc.id = 'oom-trends-selector-desc';
        selectorDesc.className = 'oom-sr-only';
        selectorDesc.textContent = 'Choose how to visualize metric trends over time. Use arrow keys to change selection.';
        
        chartTypeSelector.appendChild(selectorLabel);
        chartTypeSelector.appendChild(selector);
        chartTypeSelector.appendChild(selectorDesc);
        
        // Add smoothing toggle
        const smoothingToggle = document.createElement('div');
        smoothingToggle.className = 'oom-chart-toggle';
        
        const smoothingCheckbox = document.createElement('input');
        smoothingCheckbox.type = 'checkbox';
        smoothingCheckbox.id = 'oom-trends-smoothing';
        smoothingCheckbox.checked = true;
        smoothingCheckbox.setAttribute('aria-describedby', 'oom-smoothing-desc');
        
        const smoothingLabel = document.createElement('label');
        smoothingLabel.htmlFor = 'oom-trends-smoothing';
        smoothingLabel.textContent = 'Smooth Lines';
        
        // Add description for smoothing toggle
        const smoothingDesc = document.createElement('div');
        smoothingDesc.id = 'oom-smoothing-desc';
        smoothingDesc.className = 'oom-sr-only';
        smoothingDesc.textContent = 'Toggle smooth curved lines versus sharp angular lines in chart visualization.';
        
        smoothingToggle.appendChild(smoothingCheckbox);
        smoothingToggle.appendChild(smoothingLabel);
        smoothingToggle.appendChild(smoothingDesc);
        
        const exportButton = this.createExportButton('trends', 'Export Time Series');
        
        toolbar.appendChild(title);
        toolbar.appendChild(chartTypeSelector);
        toolbar.appendChild(smoothingToggle);
        toolbar.appendChild(exportButton);
        
        const canvas = document.createElement('canvas');
        canvas.className = 'oom-chart-canvas';
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'Metric trends over time chart');
        canvas.setAttribute('aria-describedby', 'oom-trends-chart-desc');
        
        // Add chart description for screen readers
        const chartDesc = document.createElement('div');
        chartDesc.id = 'oom-trends-chart-desc';
        chartDesc.className = 'oom-sr-only';
        chartDesc.textContent = 'Interactive chart showing how your dream metrics change over time. Chart type and smoothing can be adjusted using controls above.';
        
        container.appendChild(toolbar);
        container.appendChild(canvas);
        container.appendChild(chartDesc);
        this.contentContainer.appendChild(container);

        // Delay chart creation to ensure container is stable
        setTimeout(() => {
            container.classList.remove('oom-chart-container--loading');
            this.createTrendsChart(canvas, selector.value as 'line' | 'area' | 'scatter' | 'decomposition', smoothingCheckbox.checked);
        }, 50);
        
        // Add event listeners
        selector.addEventListener('change', () => {
            this.createTrendsChart(canvas, selector.value as 'line' | 'area' | 'scatter' | 'decomposition', smoothingCheckbox.checked);
            // Announce chart type change
            const selectedOption = selector.options[selector.selectedIndex];
            this.createAccessibilityAnnouncement(`Chart changed to ${selectedOption.text}. ${this.createChartDataSummary('trends')}`, 'polite');
        });
        
        smoothingCheckbox.addEventListener('change', () => {
            this.createTrendsChart(canvas, selector.value as 'line' | 'area' | 'scatter' | 'decomposition', smoothingCheckbox.checked);
        });
    }

    /**
     * Render compare tab with bar charts
     */
    private renderCompareTab(): void {
        const container = document.createElement('div');
        container.className = 'oom-chart-container oom-chart-container--loading';
        
        // Create toolbar with export button and chart type selector
        const toolbar = document.createElement('div');
        toolbar.className = 'oom-chart-toolbar';
        
        const title = document.createElement('h3');
        title.className = 'oom-chart-title';
        title.textContent = 'Metric Comparison';
        
        // Add chart type selector
        const chartTypeSelector = document.createElement('div');
        chartTypeSelector.className = 'oom-chart-type-selector';
        
        const selectorLabel = document.createElement('label');
        selectorLabel.textContent = 'Chart Type: ';
        selectorLabel.className = 'oom-chart-selector-label';
        selectorLabel.htmlFor = 'oom-compare-chart-selector';
        
        const selector = document.createElement('select');
        selector.className = 'oom-chart-selector';
        selector.id = 'oom-compare-chart-selector';
        selector.setAttribute('aria-describedby', 'oom-compare-selector-desc');
        selector.innerHTML = `
            <option value="bar">Bar Chart (Averages)</option>
            <option value="box">Box Plot (Distributions)</option>
            <option value="violin">Violin Plot (Density)</option>
        `;
        
        // Add screen reader description
        const selectorDesc = document.createElement('div');
        selectorDesc.id = 'oom-compare-selector-desc';
        selectorDesc.className = 'oom-sr-only';
        selectorDesc.textContent = 'Choose comparison visualization type. Bar charts show averages, box plots show quartiles and outliers, violin plots show data density distributions.';
        
        chartTypeSelector.appendChild(selectorLabel);
        chartTypeSelector.appendChild(selector);
        chartTypeSelector.appendChild(selectorDesc);
        
        const exportButton = this.createExportButton('compare', 'Export Comparison Data');
        
        toolbar.appendChild(title);
        toolbar.appendChild(chartTypeSelector);
        toolbar.appendChild(exportButton);
        
        const canvas = document.createElement('canvas');
        canvas.className = 'oom-chart-canvas';
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'Metric comparison chart');
        canvas.setAttribute('aria-describedby', 'oom-compare-chart-desc');
        
        // Add chart description for screen readers
        const chartDesc = document.createElement('div');
        chartDesc.id = 'oom-compare-chart-desc';
        chartDesc.className = 'oom-sr-only';
        chartDesc.textContent = 'Interactive chart comparing dream metrics using different visualization types. Chart type can be changed using the selector above to show averages, distributions, or density plots.';
        
        container.appendChild(toolbar);
        container.appendChild(canvas);
        container.appendChild(chartDesc);
        this.contentContainer.appendChild(container);

        // Delay chart creation to ensure container is stable
        setTimeout(() => {
            container.classList.remove('oom-chart-container--loading');
            this.createCompareChart(canvas, selector.value as 'bar' | 'box' | 'violin');
        }, 50);
        
        // Add event listener for chart type changes
        selector.addEventListener('change', () => {
            this.createCompareChart(canvas, selector.value as 'bar' | 'box' | 'violin');
            // Announce chart type change
            const selectedOption = selector.options[selector.selectedIndex];
            this.createAccessibilityAnnouncement(`Chart changed to ${selectedOption.text}. ${this.createChartDataSummary('compare')}`, 'polite');
        });
    }

    /**
     * Render correlations tab with scatter plots
     */
    private renderCorrelationsTab(): void {
        const container = document.createElement('div');
        container.className = 'oom-chart-container oom-chart-container--loading';
        
        // Create toolbar with export button and visualization options
        const toolbar = document.createElement('div');
        toolbar.className = 'oom-chart-toolbar';
        
        const title = document.createElement('h3');
        title.className = 'oom-chart-title';
        title.textContent = 'Metric Correlations';
        
        // Add visualization type selector
        const vizTypeSelector = document.createElement('div');
        vizTypeSelector.className = 'oom-chart-type-selector';
        
        const vizLabel = document.createElement('label');
        vizLabel.textContent = 'Visualization: ';
        vizLabel.className = 'oom-chart-selector-label';
        vizLabel.htmlFor = 'oom-correlations-viz-selector';
        
        const vizSelector = document.createElement('select');
        vizSelector.className = 'oom-chart-selector';
        vizSelector.id = 'oom-correlations-viz-selector';
        vizSelector.setAttribute('aria-describedby', 'oom-viz-selector-desc');
        vizSelector.innerHTML = `
            <option value="matrix">Correlation Matrix</option>
            <option value="scatter">Scatter Plots</option>
            <option value="network">Network Graph</option>
        `;
        
        // Add description for visualization selector
        const vizSelectorDesc = document.createElement('div');
        vizSelectorDesc.id = 'oom-viz-selector-desc';
        vizSelectorDesc.className = 'oom-sr-only';
        vizSelectorDesc.textContent = 'Choose visualization type for correlation analysis. Matrix shows all correlations, scatter shows pairwise relationships, network shows connections.';
        
        vizTypeSelector.appendChild(vizLabel);
        vizTypeSelector.appendChild(vizSelector);
        vizTypeSelector.appendChild(vizSelectorDesc);
        
        // Add correlation threshold slider
        const thresholdControl = document.createElement('div');
        thresholdControl.className = 'oom-correlation-threshold';
        
        const thresholdLabel = document.createElement('label');
        thresholdLabel.textContent = 'Min Correlation: ';
        thresholdLabel.className = 'oom-threshold-label';
        thresholdLabel.htmlFor = 'oom-correlation-threshold-slider';
        
        const thresholdSlider = document.createElement('input');
        thresholdSlider.type = 'range';
        thresholdSlider.min = '0';
        thresholdSlider.max = '1';
        thresholdSlider.step = '0.1';
        thresholdSlider.value = '0.3';
        thresholdSlider.className = 'oom-threshold-slider';
        thresholdSlider.id = 'oom-correlation-threshold-slider';
        thresholdSlider.setAttribute('aria-describedby', 'oom-threshold-desc');
        thresholdSlider.setAttribute('aria-valuemin', '0');
        thresholdSlider.setAttribute('aria-valuemax', '1');
        thresholdSlider.setAttribute('aria-valuenow', '0.3');
        thresholdSlider.setAttribute('aria-valuetext', 'Minimum correlation threshold: 0.3');
        
        const thresholdValue = document.createElement('span');
        thresholdValue.className = 'oom-threshold-value';
        thresholdValue.textContent = '0.3';
        thresholdValue.setAttribute('aria-live', 'polite');
        thresholdValue.id = 'oom-threshold-value-display';
        
        // Add description for threshold slider
        const thresholdDesc = document.createElement('div');
        thresholdDesc.id = 'oom-threshold-desc';
        thresholdDesc.className = 'oom-sr-only';
        thresholdDesc.textContent = 'Set minimum correlation strength to display. Range from 0 (show all) to 1 (only perfect correlations). Use left and right arrow keys to adjust.';
        
        thresholdControl.appendChild(thresholdLabel);
        thresholdControl.appendChild(thresholdSlider);
        thresholdControl.appendChild(thresholdValue);
        thresholdControl.appendChild(thresholdDesc);
        
        const exportButton = this.createExportButton('correlations', 'Export Correlation Matrix');
        
        toolbar.appendChild(title);
        toolbar.appendChild(vizTypeSelector);
        toolbar.appendChild(thresholdControl);
        toolbar.appendChild(exportButton);
        
        const canvas = document.createElement('canvas');
        canvas.className = 'oom-chart-canvas';
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', 'Metric correlations visualization');
        canvas.setAttribute('aria-describedby', 'oom-correlations-chart-desc');
        
        // Add chart description for screen readers
        const chartDesc = document.createElement('div');
        chartDesc.id = 'oom-correlations-chart-desc';
        chartDesc.className = 'oom-sr-only';
        chartDesc.textContent = 'Interactive visualization showing relationships between dream metrics. Visualization type and correlation threshold can be adjusted using controls above.';
        
        container.appendChild(toolbar);
        container.appendChild(canvas);
        container.appendChild(chartDesc);
        this.contentContainer.appendChild(container);

        // Delay chart creation to ensure container is stable
        setTimeout(() => {
            container.classList.remove('oom-chart-container--loading');
            this.createCorrelationsChart(canvas, vizSelector.value as 'matrix' | 'scatter' | 'network', parseFloat(thresholdSlider.value));
        }, 50);
        
        // Add event listeners
        vizSelector.addEventListener('change', () => {
            this.createCorrelationsChart(canvas, vizSelector.value as 'matrix' | 'scatter' | 'network', parseFloat(thresholdSlider.value));
            // Announce visualization change
            const selectedOption = vizSelector.options[vizSelector.selectedIndex];
            this.createAccessibilityAnnouncement(`Visualization changed to ${selectedOption.text}. ${this.createChartDataSummary('correlations')}`, 'polite');
        });
        
        thresholdSlider.addEventListener('input', () => {
            const newValue = thresholdSlider.value;
            thresholdValue.textContent = newValue;
            
            // Update ARIA attributes
            thresholdSlider.setAttribute('aria-valuenow', newValue);
            thresholdSlider.setAttribute('aria-valuetext', `Minimum correlation threshold: ${newValue}`);
            
            // Update the chart
            this.createCorrelationsChart(canvas, vizSelector.value as 'matrix' | 'scatter' | 'network', parseFloat(newValue));
            
            // Announce threshold change
            this.createAccessibilityAnnouncement(`Correlation threshold set to ${newValue}. Showing correlations above this threshold.`, 'polite');
        });
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
        label.htmlFor = 'oom-heatmap-metric-selector';
        
        const selector = document.createElement('select');
        selector.className = 'oom-heatmap-selector';
        selector.id = 'oom-heatmap-metric-selector';
        selector.setAttribute('aria-describedby', 'oom-heatmap-selector-desc');
        
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
        
        // Add screen reader description
        const selectorDesc = document.createElement('div');
        selectorDesc.id = 'oom-heatmap-selector-desc';
        selectorDesc.className = 'oom-sr-only';
        selectorDesc.textContent = 'Choose which metric to display in the calendar heatmap. The heatmap shows metric intensity over time with color coding.';
        
        selectorWrapper.appendChild(label);
        selectorWrapper.appendChild(selector);
        selectorWrapper.appendChild(selectorDesc);
        
        // Create calendar container
        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'oom-heatmap-calendar';
        calendarContainer.setAttribute('role', 'img');
        calendarContainer.setAttribute('aria-label', 'Calendar heatmap visualization');
        calendarContainer.setAttribute('aria-describedby', 'oom-heatmap-desc');
        calendarContainer.setAttribute('aria-live', 'polite');
        
        // Add heatmap description for screen readers
        const heatmapDesc = document.createElement('div');
        heatmapDesc.id = 'oom-heatmap-desc';
        heatmapDesc.className = 'oom-sr-only';
        heatmapDesc.textContent = 'Calendar heatmap showing metric intensity by date. Darker colors indicate higher values. Hover over dates for specific values.';
        
        container.appendChild(toolbar);
        container.appendChild(selectorWrapper);
        container.appendChild(calendarContainer);
        container.appendChild(heatmapDesc);
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
            
            // Announce metric change
            this.createAccessibilityAnnouncement(`Heatmap changed to show ${target.value} metric. ${this.createChartDataSummary('heatmap')}`, 'polite');
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
                // INTENTIONAL: Dynamic heatmap intensity - cannot be predetermined in CSS
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
    private createTrendsChart(canvas: HTMLCanvasElement, chartType: 'line' | 'area' | 'scatter' | 'decomposition', smoothLines: boolean): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        const existingChart = this.charts.get('trends');
        if (existingChart) {
            existingChart.destroy();
        }

        switch (chartType) {
            case 'line':
                this.createLineChart(ctx, smoothLines, false);
                break;
            case 'area':
                this.createLineChart(ctx, smoothLines, true);
                break;
            case 'scatter':
                this.createScatterWithTrendsChart(ctx);
                break;
            case 'decomposition':
                this.createTrendDecompositionChart(ctx);
                break;
        }
    }

    /**
     * Create line/area chart for trends
     */
    private createLineChart(ctx: CanvasRenderingContext2D, smoothLines: boolean, fillArea: boolean): void {
        // Prepare data for trends chart
        const datasets = Object.entries(this.chartData.metrics).map(([metricName, values], index) => ({
            label: metricName,
            data: values,
            borderColor: this.getColorForIndex(index),
            backgroundColor: fillArea ? this.getColorForIndex(index, 0.3) : this.getColorForIndex(index, 0.1),
            tension: smoothLines ? 0.4 : 0,
            fill: fillArea,
            pointRadius: smoothLines ? 2 : 4,
            pointHoverRadius: 6
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
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Values'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Entries'
                        }
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });

        this.charts.set('trends', chart);
        
        // Update chart accessibility
        const chartType = fillArea ? 'area' : smoothLines ? 'smooth line' : 'line';
        this.updateChartAccessibility(ctx.canvas, 'trends', chartType);
    }

    /**
     * Create scatter plot with trend lines
     */
    private createScatterWithTrendsChart(ctx: CanvasRenderingContext2D): void {
        const datasets: any[] = [];
        
        Object.entries(this.chartData.metrics).forEach(([metricName, values], index) => {
            // Scatter points
            const scatterData = values.map((value, entryIndex) => ({
                x: entryIndex + 1,
                y: value
            }));
            
            datasets.push({
                label: `${metricName} (Data)`,
                data: scatterData,
                backgroundColor: this.getColorForIndex(index, 0.6),
                borderColor: this.getColorForIndex(index),
                type: 'scatter',
                pointRadius: 4,
                showLine: false
            });
            
            // Trend line
            const trendLine = this.calculateTrendLine(values);
            datasets.push({
                label: `${metricName} (Trend)`,
                data: trendLine.map((value, entryIndex) => ({
                    x: entryIndex + 1,
                    y: value
                })),
                borderColor: this.getColorForIndex(index),
                backgroundColor: 'transparent',
                type: 'line',
                pointRadius: 0,
                borderWidth: 2,
                tension: 0
            });
        });

        const chart = new Chart(ctx, {
            type: 'scatter',
            data: {
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
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Values'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Entry Number'
                        }
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });

        this.charts.set('trends', chart);
    }

    /**
     * Create trend decomposition chart showing original, trend, and residuals
     */
    private createTrendDecompositionChart(ctx: CanvasRenderingContext2D): void {
        // For simplicity, we'll show the first metric's decomposition
        const metricNames = Object.keys(this.chartData.metrics);
        if (metricNames.length === 0) return;
        
        const firstMetric = metricNames[0];
        const values = this.chartData.metrics[firstMetric];
        
        // Calculate trend using moving average
        const trend = this.calculateMovingAverageTrend(values, 5);
        const residuals = values.map((value, index) => value - trend[index]);
        
        const datasets = [
            {
                label: 'Original',
                data: values,
                borderColor: this.getColorForIndex(0),
                backgroundColor: this.getColorForIndex(0, 0.1),
                tension: 0.4
            },
            {
                label: 'Trend',
                data: trend,
                borderColor: this.getColorForIndex(1),
                backgroundColor: this.getColorForIndex(1, 0.1),
                tension: 0.4,
                borderWidth: 3
            },
            {
                label: 'Residuals',
                data: residuals,
                borderColor: this.getColorForIndex(2),
                backgroundColor: this.getColorForIndex(2, 0.1),
                tension: 0.2
            }
        ];

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
                    },
                    title: {
                        display: true,
                        text: `Trend Decomposition: ${firstMetric}`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Values'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Entries'
                        }
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });

        this.charts.set('trends', chart);
    }

    /**
     * Calculate linear trend line for a series of values
     */
    private calculateTrendLine(values: number[]): number[] {
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
        const sumXX = values.reduce((sum, _, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return values.map((_, index) => slope * index + intercept);
    }

    /**
     * Calculate moving average trend
     */
    private calculateMovingAverageTrend(values: number[], windowSize: number): number[] {
        const trend: number[] = [];
        const halfWindow = Math.floor(windowSize / 2);
        
        for (let i = 0; i < values.length; i++) {
            const start = Math.max(0, i - halfWindow);
            const end = Math.min(values.length - 1, i + halfWindow);
            const window = values.slice(start, end + 1);
            const average = window.reduce((a, b) => a + b, 0) / window.length;
            trend.push(average);
        }
        
        return trend;
    }

    /**
     * Create compare bar chart
     */
    private createCompareChart(canvas: HTMLCanvasElement, chartType: 'bar' | 'box' | 'violin'): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        const existingChart = this.charts.get('compare');
        if (existingChart) {
            existingChart.destroy();
        }

        if (chartType === 'bar') {
            this.createBarChart(ctx);
        } else if (chartType === 'box') {
            this.createBoxPlotChart(ctx);
        } else if (chartType === 'violin') {
            this.createViolinPlotChart(ctx);
        }
    }

    /**
     * Create standard bar chart for comparison
     */
    private createBarChart(ctx: CanvasRenderingContext2D): void {
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
                animation: {
                    duration: 0
                }
            }
        });

        this.charts.set('compare', chart);
        
        // Update chart accessibility
        this.updateChartAccessibility(ctx.canvas, 'compare', 'bar');
    }

    /**
     * Create box plot visualization using multiple bar datasets
     */
    private createBoxPlotChart(ctx: CanvasRenderingContext2D): void {
        const boxPlotData = Object.entries(this.chartData.metrics).map(([metricName, values]) => {
            const sortedValues = [...values].sort((a, b) => a - b);
            const q1 = this.calculateQuantile(sortedValues, 0.25);
            const median = this.calculateQuantile(sortedValues, 0.5);
            const q3 = this.calculateQuantile(sortedValues, 0.75);
            const min = Math.min(...values);
            const max = Math.max(...values);
            const iqr = q3 - q1;
            
            // Calculate outliers (values beyond 1.5 * IQR from Q1/Q3)
            const lowerFence = q1 - 1.5 * iqr;
            const upperFence = q3 + 1.5 * iqr;
            const outliers = values.filter(v => v < lowerFence || v > upperFence);
            
            return {
                label: metricName,
                min: min,
                q1: q1,
                median: median,
                q3: q3,
                max: max,
                outliers: outliers
            };
        });

        const labels = boxPlotData.map(item => item.label);
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Q1-Q3 (IQR)',
                        data: boxPlotData.map(item => item.q3 - item.q1),
                        backgroundColor: labels.map((_, index) => this.getColorForIndex(index, 0.6)),
                        borderColor: labels.map((_, index) => this.getColorForIndex(index)),
                        borderWidth: 2,
                        base: boxPlotData.map(item => item.q1)
                    },
                    {
                        label: 'Median',
                        data: boxPlotData.map(item => 0.1), // Small height for median line
                        backgroundColor: '#000000',
                        borderColor: '#000000',
                        borderWidth: 3,
                        base: boxPlotData.map(item => item.median - 0.05)
                    }
                ]
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
                    },
                    tooltip: {
                        callbacks: {
                            afterBody: (context) => {
                                const index = context[0].dataIndex;
                                const item = boxPlotData[index];
                                return [
                                    `Min: ${item.min.toFixed(2)}`,
                                    `Q1: ${item.q1.toFixed(2)}`,
                                    `Median: ${item.median.toFixed(2)}`,
                                    `Q3: ${item.q3.toFixed(2)}`,
                                    `Max: ${item.max.toFixed(2)}`,
                                    `Outliers: ${item.outliers.length}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Values'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Metrics'
                        }
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });

        this.charts.set('compare', chart);
        
        // Update chart accessibility
        this.updateChartAccessibility(ctx.canvas, 'compare', 'box plot');
    }

    /**
     * Create violin plot visualization using line chart
     */
    private createViolinPlotChart(ctx: CanvasRenderingContext2D): void {
        // For violin plots, we'll create a density distribution for each metric
        const violinData = Object.entries(this.chartData.metrics).map(([metricName, values], index) => {
            const densityData = this.calculateKernelDensity(values);
            return {
                label: metricName,
                data: densityData,
                borderColor: this.getColorForIndex(index),
                backgroundColor: this.getColorForIndex(index, 0.3),
                fill: true,
                tension: 0.4
            };
        });

        // Create value range for x-axis
        const allValues = Object.values(this.chartData.metrics).flat();
        const minVal = Math.min(...allValues);
        const maxVal = Math.max(...allValues);
        const range = maxVal - minVal;
        const step = range / 50;
        const xLabels = Array.from({length: 51}, (_, i) => (minVal + i * step).toFixed(2));

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: xLabels,
                datasets: violinData
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
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Density'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Value Range'
                        }
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });

        this.charts.set('compare', chart);
        
        // Update chart accessibility
        this.updateChartAccessibility(ctx.canvas, 'compare', 'violin plot');
    }

    /**
     * Calculate quantile value for box plots
     */
    private calculateQuantile(sortedValues: number[], quantile: number): number {
        const index = quantile * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        
        if (lower === upper) {
            return sortedValues[lower];
        }
        
        const weight = index - lower;
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }

    /**
     * Calculate kernel density estimation for violin plots
     */
    private calculateKernelDensity(values: number[]): number[] {
        const bandwidth = this.calculateBandwidth(values);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal;
        const step = range / 50;
        
        const densityPoints: number[] = [];
        
        for (let i = 0; i <= 50; i++) {
            const x = minVal + i * step;
            let density = 0;
            
            for (const value of values) {
                const u = (x - value) / bandwidth;
                density += this.gaussianKernel(u);
            }
            
            density = density / (values.length * bandwidth);
            densityPoints.push(density);
        }
        
        return densityPoints;
    }

    /**
     * Calculate bandwidth for kernel density estimation
     */
    private calculateBandwidth(values: number[]): number {
        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((sq, val) => sq + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        
        // Silverman's rule of thumb
        return 1.06 * stdDev * Math.pow(n, -1/5);
    }

    /**
     * Gaussian kernel function
     */
    private gaussianKernel(u: number): number {
        return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
    }

    /**
     * Create correlations scatter plot
     */
    private createCorrelationsChart(canvas: HTMLCanvasElement, vizType: 'matrix' | 'scatter' | 'network', minCorrelation: number): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        const existingChart = this.charts.get('correlations');
        if (existingChart) {
            existingChart.destroy();
        }

        switch (vizType) {
            case 'matrix':
                this.createCorrelationMatrixChart(ctx, minCorrelation);
                break;
            case 'scatter':
                this.createCorrelationScatterChart(ctx);
                break;
            case 'network':
                this.createCorrelationNetworkChart(ctx, minCorrelation);
                break;
        }
    }

    /**
     * Create correlation matrix heatmap
     */
    private createCorrelationMatrixChart(ctx: CanvasRenderingContext2D, minCorrelation: number): void {
        const metricNames = Object.keys(this.chartData.metrics);
        if (metricNames.length < 2) {
            this.renderPlaceholder('Correlations', 'Need at least 2 metrics for correlation analysis');
            return;
        }

        // Calculate correlation matrix
        const correlationMatrix: number[][] = [];
        const labels: string[] = [];
        const data: Array<{x: number, y: number, v: number}> = [];
        
        for (let i = 0; i < metricNames.length; i++) {
            correlationMatrix[i] = [];
            for (let j = 0; j < metricNames.length; j++) {
                const values1 = this.chartData.metrics[metricNames[i]];
                const values2 = this.chartData.metrics[metricNames[j]];
                
                if (i === j) {
                    correlationMatrix[i][j] = 1.0;
                } else {
                    const minLength = Math.min(values1.length, values2.length);
                    const pairedValues1 = values1.slice(0, minLength);
                    const pairedValues2 = values2.slice(0, minLength);
                    
                    if (pairedValues1.length >= 3) {
                        correlationMatrix[i][j] = this.calculatePearsonCorrelation(pairedValues1, pairedValues2);
                    } else {
                        correlationMatrix[i][j] = 0;
                    }
                }
                
                // Only include correlations above threshold
                if (Math.abs(correlationMatrix[i][j]) >= minCorrelation || i === j) {
                    data.push({
                        x: j,
                        y: metricNames.length - 1 - i, // Flip Y to match matrix orientation
                        v: correlationMatrix[i][j]
                    });
                }
            }
        }

        // Create matrix visualization using scatter plot with sized points
        const datasets = [{
            label: 'Correlation Strength',
            data: data.map(point => ({
                x: point.x,
                y: point.y,
                correlation: point.v
            })),
            backgroundColor: data.map(point => {
                const intensity = Math.abs(point.v);
                const red = point.v < 0 ? Math.floor(255 * intensity) : 0;
                const blue = point.v > 0 ? Math.floor(255 * intensity) : 0;
                return `rgba(${red}, 0, ${blue}, 0.7)`;
            }),
            borderColor: '#333333',
            pointRadius: data.map(point => Math.abs(point.v) * 15 + 5), // Size based on correlation strength
        }];

        const chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context: any) => {
                                const point = context.raw;
                                const metric1 = metricNames[Math.round(point.x)];
                                const metric2 = metricNames[metricNames.length - 1 - Math.round(point.y)];
                                return `${metric1} ↔ ${metric2}: r = ${point.correlation.toFixed(3)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: -0.5,
                        max: metricNames.length - 0.5,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => metricNames[value as number] || ''
                        },
                        title: {
                            display: true,
                            text: 'Metrics'
                        }
                    },
                    y: {
                        type: 'linear',
                        min: -0.5,
                        max: metricNames.length - 0.5,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => metricNames[metricNames.length - 1 - (value as number)] || ''
                        },
                        title: {
                            display: true,
                            text: 'Metrics'
                        }
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });

        this.charts.set('correlations', chart);
    }

    /**
     * Create scatter plot visualization for correlations
     */
    private createCorrelationScatterChart(ctx: CanvasRenderingContext2D): void {
        const metricNames = Object.keys(this.chartData.metrics);
        if (metricNames.length < 2) {
            this.renderPlaceholder('Correlations', 'Need at least 2 metrics for correlation analysis');
            return;
        }

        // For now, create a scatter plot between first two metrics
        const xMetric = this.chartData.metrics[metricNames[0]];
        const yMetric = this.chartData.metrics[metricNames[1]];

        const scatterData = xMetric.map((x, index) => ({
            x: x,
            y: yMetric[index] || 0
        }));

        // Calculate trend line
        const trendLine = this.calculateTrendLine(yMetric);
        const trendData = xMetric.map((x, index) => ({
            x: x,
            y: trendLine[index]
        }));

        const correlation = this.calculatePearsonCorrelation(xMetric, yMetric);

        const chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: `${metricNames[0]} vs ${metricNames[1]}`,
                        data: scatterData,
                        backgroundColor: this.getColorForIndex(0, 0.6),
                        borderColor: this.getColorForIndex(0),
                        pointRadius: 4
                    },
                    {
                        label: `Trend Line (r=${correlation.toFixed(3)})`,
                        data: trendData,
                        type: 'line',
                        borderColor: this.getColorForIndex(1),
                        backgroundColor: 'transparent',
                        pointRadius: 0,
                        borderWidth: 2,
                        tension: 0
                    }
                ]
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
                animation: {
                    duration: 0
                }
            }
        });

        this.charts.set('correlations', chart);
    }

    /**
     * Create network graph visualization for correlations
     */
    private createCorrelationNetworkChart(ctx: CanvasRenderingContext2D, minCorrelation: number): void {
        const metricNames = Object.keys(this.chartData.metrics);
        if (metricNames.length < 2) {
            this.renderPlaceholder('Correlations', 'Need at least 2 metrics for correlation analysis');
            return;
        }

        // Calculate significant correlations
        const connections: Array<{x1: number, y1: number, x2: number, y2: number, strength: number}> = [];
        const nodePositions: Array<{x: number, y: number, label: string}> = [];
        
        // Position nodes in a circle
        const centerX = 50;
        const centerY = 50;
        const radius = 30;
        
        metricNames.forEach((metricName, index) => {
            const angle = (index / metricNames.length) * 2 * Math.PI;
            nodePositions.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
                label: metricName
            });
        });

        // Calculate correlations and create connections
        for (let i = 0; i < metricNames.length; i++) {
            for (let j = i + 1; j < metricNames.length; j++) {
                const values1 = this.chartData.metrics[metricNames[i]];
                const values2 = this.chartData.metrics[metricNames[j]];
                
                const minLength = Math.min(values1.length, values2.length);
                const pairedValues1 = values1.slice(0, minLength);
                const pairedValues2 = values2.slice(0, minLength);
                
                if (pairedValues1.length >= 3) {
                    const correlation = this.calculatePearsonCorrelation(pairedValues1, pairedValues2);
                    
                    if (Math.abs(correlation) >= minCorrelation) {
                        connections.push({
                            x1: nodePositions[i].x,
                            y1: nodePositions[i].y,
                            x2: nodePositions[j].x,
                            y2: nodePositions[j].y,
                            strength: correlation
                        });
                    }
                }
            }
        }

        // Create network visualization using line chart with custom drawing
        const connectionDatasets = connections.map((conn, index) => ({
            label: `Connection ${index}`,
            data: [
                { x: conn.x1, y: conn.y1 },
                { x: conn.x2, y: conn.y2 }
            ],
            borderColor: conn.strength > 0 ? 'rgba(0, 100, 255, 0.7)' : 'rgba(255, 100, 0, 0.7)',
            borderWidth: Math.abs(conn.strength) * 5,
            pointRadius: 0,
            showLine: true,
            fill: false,
            tension: 0
        }));

        // Add nodes as scatter points
        const nodeDataset = {
            label: 'Metrics',
            data: nodePositions.map(pos => ({ x: pos.x, y: pos.y })),
            backgroundColor: nodePositions.map((_, index) => this.getColorForIndex(index, 0.8)),
            borderColor: '#333333',
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false
        };

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [...connectionDatasets, nodeDataset]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        filter: (tooltipItem) => {
                            // Only show tooltips for nodes (last dataset)
                            return tooltipItem.datasetIndex === connectionDatasets.length;
                        },
                        callbacks: {
                            label: (context) => {
                                const nodeIndex = context.dataIndex;
                                return nodePositions[nodeIndex]?.label || '';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: false,
                        min: 0,
                        max: 100
                    },
                    y: {
                        display: false,
                        min: 0,
                        max: 100
                    }
                },
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
        this.tabsContainer.classList.add('oom-show-flex');
        this.tabsContainer.classList.remove('oom-display-none');
        this.isVisible = true;
    }

    /**
     * Hide the chart tabs
     */
    public hide(): void {
        this.tabsContainer.classList.add('oom-display-none');
        this.tabsContainer.classList.remove('oom-show-flex');
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
        exportButton.innerHTML = `<span class="oom-export-icon" aria-hidden="true">📊</span> ${label}`;
        exportButton.title = `Export ${tabType} data as CSV`;
        exportButton.setAttribute('aria-describedby', `oom-export-desc-${tabType}`);
        
        // Add screen reader description
        const exportDesc = document.createElement('div');
        exportDesc.id = `oom-export-desc-${tabType}`;
        exportDesc.className = 'oom-sr-only';
        exportDesc.textContent = `Export current ${tabType} data and analysis as a CSV file for use in external applications.`;
        
        exportButton.addEventListener('click', async () => {
            // Add loading state for accessibility
            exportButton.setAttribute('aria-busy', 'true');
            exportButton.textContent = 'Exporting...';
            
            try {
                await this.handleExportClick(tabType);
                
                // Announce successful export
                this.announceExportSuccess(tabType);
            } catch (error) {
                // Announce export error
                this.announceExportError(tabType, error as Error);
            } finally {
                // Reset button state
                exportButton.setAttribute('aria-busy', 'false');
                exportButton.innerHTML = `<span class="oom-export-icon" aria-hidden="true">📊</span> ${label}`;
            }
        });
        
        // Create container for button and description
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'oom-export-button-container';
        buttonContainer.appendChild(exportButton);
        buttonContainer.appendChild(exportDesc);
        
        return buttonContainer;
    }

    /**
     * Announce successful export to screen readers
     */
    private announceExportSuccess(tabType: TabType): void {
        const announcement = `${tabType} data exported successfully. CSV file should be available in your downloads.`;
        this.createAccessibilityAnnouncement(announcement, 'polite');
    }

    /**
     * Announce export error to screen readers
     */
    private announceExportError(tabType: TabType, error: Error): void {
        const announcement = `Export failed for ${tabType} data. Error: ${error.message}`;
        this.createAccessibilityAnnouncement(announcement, 'assertive');
    }

    /**
     * Create accessibility announcement
     */
    private createAccessibilityAnnouncement(message: string, priority: 'polite' | 'assertive'): void {
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', priority);
        announcer.setAttribute('aria-atomic', 'true');
        announcer.className = 'oom-sr-only';
        announcer.textContent = message;
        
        document.body.appendChild(announcer);
        
        // Remove after announcement
        setTimeout(() => {
            if (announcer.parentNode) {
                announcer.parentNode.removeChild(announcer);
            }
        }, 3000);
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

                case 'insights':
                    const insightsOptions: InsightsExportOptions = {
                        ...baseOptions,
                        includeDataOverview: true,
                        includeTrendAnalysis: true,
                        includeOutlierDetection: true,
                        includeCorrelations: true,
                        includePatterns: true
                    };
                    csvContent = await this.csvExportPipeline.exportInsightsData(this.chartData.dreamEntries, insightsOptions);
                    filename = `oneirometrics-insights-${new Date().toISOString().split('T')[0]}.csv`;
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
                const values1 = this.chartData.metrics[metric1];
                const values2 = this.chartData.metrics[metric2];
                
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

    /**
     * Create accessibility data summary for charts
     */
    private createChartDataSummary(tabId: string): string {
        try {
            const metricNames = Object.keys(this.chartData.metrics);
            const totalEntries = this.chartData.dreamEntries.length;
            
            if (metricNames.length === 0 || totalEntries === 0) {
                return `No data available for ${tabId} analysis.`;
            }
            
            let summary = `${tabId} data summary: ${totalEntries} dream entries with ${metricNames.length} metrics. `;
            
            switch (tabId) {
                case 'trends':
                    const trendingSummary = this.getTrendsSummary();
                    summary += trendingSummary;
                    break;
                    
                case 'compare':
                    const compareSummary = this.getCompareSummary();
                    summary += compareSummary;
                    break;
                    
                case 'correlations':
                    const correlationsSummary = this.getCorrelationsSummary();
                    summary += correlationsSummary;
                    break;
                    
                case 'heatmap':
                    const heatmapSummary = this.getHeatmapSummary();
                    summary += heatmapSummary;
                    break;
                    
                case 'insights':
                    const insightsSummary = this.getInsightsSummary();
                    summary += insightsSummary;
                    break;
                    
                default:
                    summary += `Metrics tracked: ${metricNames.join(', ')}.`;
            }
            
            return summary;
        } catch (error) {
            this.logger?.warn('MetricsChartTabs', 'Error creating chart data summary', error);
            return `Chart data summary unavailable for ${tabId}.`;
        }
    }

    /**
     * Get trends data summary for accessibility
     */
    private getTrendsSummary(): string {
        const trends = this.analyzeTrends();
        if (trends.length === 0) return 'No trend data available.';
        
        const improving = trends.filter(t => t.direction === 'improving').length;
        const declining = trends.filter(t => t.direction === 'declining').length;
        const stable = trends.filter(t => t.direction === 'stable').length;
        
        return `Trend analysis shows ${improving} improving metrics, ${declining} declining metrics, and ${stable} stable metrics.`;
    }

    /**
     * Get compare data summary for accessibility
     */
    private getCompareSummary(): string {
        const metricNames = Object.keys(this.chartData.metrics);
        const averages = metricNames.map(name => {
            const values = this.chartData.metrics[name];
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            return { name, avg };
        });
        
        const highest = averages.reduce((max, current) => current.avg > max.avg ? current : max);
        const lowest = averages.reduce((min, current) => current.avg < min.avg ? current : min);
        
        return `Comparison shows ${highest.name} has highest average (${highest.avg.toFixed(2)}), ${lowest.name} has lowest (${lowest.avg.toFixed(2)}).`;
    }

    /**
     * Get correlations data summary for accessibility
     */
    private getCorrelationsSummary(): string {
        const correlations = this.findStrongCorrelations();
        if (correlations.length === 0) {
            return 'No strong correlations found between metrics.';
        }
        
        const strongCount = correlations.filter(c => c.strength === 'strong').length;
        const moderateCount = correlations.filter(c => c.strength === 'moderate').length;
        
        return `Found ${strongCount} strong and ${moderateCount} moderate correlations between metrics.`;
    }

    /**
     * Get heatmap data summary for accessibility
     */
    private getHeatmapSummary(): string {
        const selectedMetric = this.getSelectedHeatmapMetric() || Object.keys(this.chartData.metrics)[0];
        if (!selectedMetric) return 'No metric selected for heatmap.';
        
        const values = this.chartData.metrics[selectedMetric];
        if (!values || values.length === 0) return `No data for ${selectedMetric} metric.`;
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        
        return `Heatmap for ${selectedMetric}: range ${min.toFixed(2)} to ${max.toFixed(2)}, average ${avg.toFixed(2)}.`;
    }

    /**
     * Get insights data summary for accessibility
     */
    private getInsightsSummary(): string {
        const outliers = this.detectOutliers();
        const correlations = this.findStrongCorrelations();
        const trends = this.analyzeTrends();
        
        return `Insights analysis found ${outliers.length} outliers, ${correlations.length} significant correlations, analyzed trends for ${trends.length} metrics.`;
    }

    /**
     * Announce chart data summary to screen readers
     */
    private announceChartDataSummary(tabId: string): void {
        const summary = this.createChartDataSummary(tabId);
        this.createAccessibilityAnnouncement(summary, 'polite');
    }

    /**
     * Update chart canvas accessibility attributes
     */
    private updateChartAccessibility(canvas: HTMLCanvasElement, tabId: string, chartType?: string): void {
        if (!canvas) return;
        
        try {
            // Update aria-label based on tab and chart type
            let ariaLabel = `${tabId} chart`;
            if (chartType) {
                ariaLabel = `${tabId} ${chartType} chart`;
            }
            
            canvas.setAttribute('aria-label', ariaLabel);
            
            // Create dynamic description based on current data
            const summary = this.createChartDataSummary(tabId);
            const description = `${ariaLabel}. ${summary}`;
            
            // Update or create description element
            const descId = `${canvas.id || tabId}-chart-desc`;
            let descElement = document.getElementById(descId);
            
            if (!descElement) {
                descElement = document.createElement('div');
                descElement.id = descId;
                descElement.className = 'oom-sr-only';
                canvas.parentNode?.appendChild(descElement);
            }
            
            descElement.textContent = description;
            canvas.setAttribute('aria-describedby', descId);
            
        } catch (error) {
            this.logger?.warn('MetricsChartTabs', 'Error updating chart accessibility', error);
        }
    }

    /**
     * Set focus to the active tab for keyboard users
     */
    public focusActiveTab(): void {
        const activeTabElement = this.navContainer.querySelector(`[data-tab="${this.activeTab}"]`) as HTMLElement;
        if (activeTabElement) {
            activeTabElement.focus();
        }
    }

    /**
     * Set focus to the main content area of the active tab
     */
    public focusTabContent(): void {
        // Find the first focusable element in the content area
        const focusableElements = this.contentContainer.querySelectorAll(
            'button, select, input, canvas, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            (focusableElements[0] as HTMLElement).focus();
        } else {
            // If no focusable elements, focus the content container itself
            this.contentContainer.setAttribute('tabindex', '0');
            this.contentContainer.focus();
            // Remove tabindex after focus to avoid affecting tab order
            setTimeout(() => {
                this.contentContainer.removeAttribute('tabindex');
            }, 100);
        }
    }
} 
import { Modal, App, ButtonComponent, DropdownComponent, ToggleComponent, Notice } from 'obsidian';
import type DreamMetricsPlugin from '../../../main';
import type { DreamMetricData } from '../../../types';
import { CSVExportPipeline, ExportFormat, StatisticsExportOptions, TabType, DateRange } from '../../utils/csv-export-service';

export class DashboardExportModal extends Modal {
    private plugin: DreamMetricsPlugin;
    private filteredEntries: DreamMetricData[];
    private allEntries: DreamMetricData[];
    private currentFilter: string;
    private customDateRange?: { start: string; end: string };
    private csvExportPipeline: CSVExportPipeline;
    
    // Export settings
    private exportSettings = {
        format: 'csv' as ExportFormat,
        dataScope: 'filtered' as 'filtered' | 'all',
        includeMetadata: true,
        includeQualityScore: true,
        includeEntryDetails: true,
        exportType: 'table' as 'table' | 'charts',
        chartTab: 'statistics' as TabType
    };
    
    constructor(
        app: App,
        plugin: DreamMetricsPlugin,
        filteredEntries: DreamMetricData[],
        allEntries: DreamMetricData[],
        currentFilter: string,
        customDateRange: { start: string; end: string } | undefined,
        csvExportPipeline: CSVExportPipeline
    ) {
        super(app);
        this.plugin = plugin;
        this.filteredEntries = filteredEntries;
        this.allEntries = allEntries;
        this.currentFilter = currentFilter;
        this.customDateRange = customDateRange;
        this.csvExportPipeline = csvExportPipeline;
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Modal title
        contentEl.createEl('h2', { text: 'Export Dashboard Data' });
        
        // Export type selection
        const exportTypeContainer = contentEl.createDiv({ cls: 'oom-export-type-container' });
        exportTypeContainer.createEl('h3', { text: 'Export Type' });
        
        const exportTypeDropdown = new DropdownComponent(exportTypeContainer);
        exportTypeDropdown.addOption('table', 'Table Data');
        exportTypeDropdown.addOption('charts', 'Chart Data');
        exportTypeDropdown.setValue(this.exportSettings.exportType);
        exportTypeDropdown.onChange((value) => {
            this.exportSettings.exportType = value as 'table' | 'charts';
            this.updateModalContent();
        });
        
        // Data scope selection
        const dataScopeContainer = contentEl.createDiv({ cls: 'oom-export-scope-container' });
        dataScopeContainer.createEl('h3', { text: 'Data Scope' });
        
        const scopeInfo = dataScopeContainer.createDiv({ cls: 'oom-export-info' });
        this.updateScopeInfo(scopeInfo);
        
        const dataScopeDropdown = new DropdownComponent(dataScopeContainer);
        dataScopeDropdown.addOption('filtered', `Current View (${this.filteredEntries.length} entries)`);
        dataScopeDropdown.addOption('all', `All Data (${this.allEntries.length} entries)`);
        dataScopeDropdown.setValue(this.exportSettings.dataScope);
        dataScopeDropdown.onChange((value) => {
            this.exportSettings.dataScope = value as 'filtered' | 'all';
            this.updateScopeInfo(scopeInfo);
        });
        
        // Format selection
        const formatContainer = contentEl.createDiv({ cls: 'oom-export-format-container' });
        formatContainer.createEl('h3', { text: 'Export Format' });
        
        const formatDropdown = new DropdownComponent(formatContainer);
        formatDropdown.addOption('csv', 'CSV (Comma-Separated Values)');
        formatDropdown.addOption('json', 'JSON (JavaScript Object Notation)');
        formatDropdown.setValue(this.exportSettings.format);
        formatDropdown.onChange((value) => {
            this.exportSettings.format = value as ExportFormat;
        });
        
        // Chart tab selection (only shown when exporting charts)
        if (this.exportSettings.exportType === 'charts') {
            const chartTabContainer = contentEl.createDiv({ cls: 'oom-export-chart-tab-container' });
            chartTabContainer.createEl('h3', { text: 'Chart Tab' });
            
            const chartTabDropdown = new DropdownComponent(chartTabContainer);
            chartTabDropdown.addOption('statistics', 'Statistics');
            chartTabDropdown.addOption('trends', 'Trends');
            chartTabDropdown.addOption('compare', 'Compare');
            chartTabDropdown.addOption('correlations', 'Correlations');
            chartTabDropdown.addOption('heatmap', 'Heatmap');
            chartTabDropdown.addOption('insights', 'Insights');
            chartTabDropdown.setValue(this.exportSettings.chartTab);
            chartTabDropdown.onChange((value) => {
                this.exportSettings.chartTab = value as TabType;
            });
        }
        
        // Options
        const optionsContainer = contentEl.createDiv({ cls: 'oom-export-options-container' });
        optionsContainer.createEl('h3', { text: 'Options' });
        
        // Include metadata toggle
        const metadataContainer = optionsContainer.createDiv({ cls: 'oom-export-option' });
        const metadataToggle = new ToggleComponent(metadataContainer);
        metadataToggle.setValue(this.exportSettings.includeMetadata);
        metadataToggle.onChange((value) => {
            this.exportSettings.includeMetadata = value;
        });
        metadataContainer.createEl('span', { 
            text: 'Include metadata (export date, filters, etc.)',
            cls: 'oom-export-option-label'
        });
        
        // Include quality score toggle (table export only)
        if (this.exportSettings.exportType === 'table') {
            const qualityContainer = optionsContainer.createDiv({ cls: 'oom-export-option' });
            const qualityToggle = new ToggleComponent(qualityContainer);
            qualityToggle.setValue(this.exportSettings.includeQualityScore);
            qualityToggle.onChange((value) => {
                this.exportSettings.includeQualityScore = value;
            });
            qualityContainer.createEl('span', { 
                text: 'Include quality scores',
                cls: 'oom-export-option-label'
            });
            
            // Include entry details toggle
            const detailsContainer = optionsContainer.createDiv({ cls: 'oom-export-option' });
            const detailsToggle = new ToggleComponent(detailsContainer);
            detailsToggle.setValue(this.exportSettings.includeEntryDetails);
            detailsToggle.onChange((value) => {
                this.exportSettings.includeEntryDetails = value;
            });
            detailsContainer.createEl('span', { 
                text: 'Include entry details (title, content length)',
                cls: 'oom-export-option-label'
            });
        }
        
        // Export preview
        const previewContainer = contentEl.createDiv({ cls: 'oom-export-preview-container' });
        previewContainer.createEl('h3', { text: 'Preview' });
        const previewInfo = previewContainer.createDiv({ cls: 'oom-export-preview-info' });
        this.updatePreviewInfo(previewInfo);
        
        // Action buttons
        const buttonContainer = contentEl.createDiv({ cls: 'oom-export-buttons' });
        
        // Cancel button
        new ButtonComponent(buttonContainer)
            .setButtonText('Cancel')
            .onClick(() => {
                this.close();
            });
        
        // Export button
        new ButtonComponent(buttonContainer)
            .setButtonText('Export')
            .setCta()
            .onClick(async () => {
                await this.performExport();
                this.close();
            });
    }
    
    private updateModalContent() {
        // Re-render the modal with updated settings
        this.onOpen();
    }
    
    private updateScopeInfo(container: HTMLElement) {
        container.empty();
        
        if (this.exportSettings.dataScope === 'filtered') {
            const filterText = this.currentFilter === 'custom' && this.customDateRange
                ? `Custom range: ${this.customDateRange.start} to ${this.customDateRange.end}`
                : `Filter: ${this.currentFilter}`;
            container.createEl('div', { 
                text: filterText,
                cls: 'oom-export-scope-detail'
            });
        } else {
            container.createEl('div', { 
                text: 'All available dream entries',
                cls: 'oom-export-scope-detail'
            });
        }
    }
    
    private updatePreviewInfo(container: HTMLElement) {
        container.empty();
        
        const entries = this.exportSettings.dataScope === 'filtered' 
            ? this.filteredEntries 
            : this.allEntries;
        
        const info = [];
        info.push(`• ${entries.length} entries will be exported`);
        info.push(`• Format: ${this.exportSettings.format.toUpperCase()}`);
        
        if (this.exportSettings.exportType === 'table') {
            const enabledMetrics = this.getEnabledMetrics();
            info.push(`• ${enabledMetrics.length} metrics included`);
            
            if (this.exportSettings.includeMetadata) {
                info.push(`• Metadata will be included`);
            }
            if (this.exportSettings.includeQualityScore) {
                info.push(`• Quality scores will be calculated`);
            }
            if (this.exportSettings.includeEntryDetails) {
                info.push(`• Entry details will be included`);
            }
        } else {
            info.push(`• Chart type: ${this.exportSettings.chartTab}`);
        }
        
        // Estimate file size
        const estimatedSize = this.estimateFileSize(entries);
        info.push(`• Estimated size: ${estimatedSize}`);
        
        container.createEl('div', { 
            text: info.join('\n'),
            cls: 'oom-export-preview-text'
        });
    }
    
    private estimateFileSize(entries: DreamMetricData[]): string {
        // Rough estimation based on average entry size
        const avgEntrySize = this.exportSettings.format === 'json' ? 500 : 200; // bytes
        const totalBytes = entries.length * avgEntrySize;
        
        if (totalBytes < 1024) {
            return `${totalBytes} bytes`;
        } else if (totalBytes < 1024 * 1024) {
            return `${(totalBytes / 1024).toFixed(1)} KB`;
        } else {
            return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
        }
    }
    
    private getEnabledMetrics(): string[] {
        return Object.entries(this.plugin.settings.metrics)
            .filter(([_, metric]) => metric.enabled)
            .map(([key, _]) => key);
    }
    
    private async performExport() {
        try {
            const entries = this.exportSettings.dataScope === 'filtered' 
                ? this.filteredEntries 
                : this.allEntries;
            
            if (entries.length === 0) {
                new Notice('No data to export');
                return;
            }
            
            let exportContent: string;
            let filename: string;
            
            if (this.exportSettings.exportType === 'table') {
                // Export table data
                const options: StatisticsExportOptions = {
                    format: this.exportSettings.format,
                    includeMetadata: this.exportSettings.includeMetadata,
                    dateRange: this.customDateRange ? {
                        start: this.customDateRange.start,
                        end: this.customDateRange.end
                    } as DateRange : undefined,
                    selectedMetrics: this.getEnabledMetrics(),
                    normalization: 'none',
                    includeCalculated: true,
                    includeQualityScore: this.exportSettings.includeQualityScore,
                    includeEntryDetails: this.exportSettings.includeEntryDetails,
                    groupBy: 'date'
                };
                
                exportContent = await this.csvExportPipeline.exportStatisticsData(entries, options);
                
                const timestamp = new Date().toISOString().split('T')[0];
                const scopeSuffix = this.exportSettings.dataScope === 'filtered' ? '-filtered' : '-all';
                filename = `oneirometrics-dashboard${scopeSuffix}-${timestamp}.${this.exportSettings.format}`;
                
            } else {
                // Export chart data
                const tabOptions = this.getChartExportOptions();
                exportContent = await this.csvExportPipeline.exportChartData(
                    entries,
                    this.exportSettings.chartTab,
                    tabOptions
                );
                
                const timestamp = new Date().toISOString().split('T')[0];
                filename = `oneirometrics-${this.exportSettings.chartTab}-${timestamp}.${this.exportSettings.format}`;
            }
            
            // Trigger download
            this.csvExportPipeline.triggerDownload(
                exportContent, 
                filename, 
                this.exportSettings.exportType === 'table' ? 'statistics' : this.exportSettings.chartTab
            );
            
            new Notice(`Successfully exported ${entries.length} entries`);
            
        } catch (error) {
            this.plugin.logger?.error('DashboardExportModal', 'Export failed', error);
            new Notice('Export failed: ' + error.message);
        }
    }
    
    private getChartExportOptions(): any {
        // Base options
        const baseOptions = {
            format: this.exportSettings.format,
            includeMetadata: this.exportSettings.includeMetadata,
            dateRange: this.customDateRange ? {
                start: this.customDateRange.start,
                end: this.customDateRange.end
            } as DateRange : undefined,
            selectedMetrics: this.getEnabledMetrics(),
            normalization: 'none' as const,
            includeCalculated: true,
            tabType: this.exportSettings.chartTab,
            dataStructure: this.getDataStructureForTab(this.exportSettings.chartTab)
        };
        
        // Add tab-specific options
        switch (this.exportSettings.chartTab) {
            case 'trends':
                return {
                    ...baseOptions,
                    includeMovingAverages: true,
                    aggregationPeriod: 'daily' as const,
                    includeTrendAnalysis: true
                };
            case 'compare':
                return {
                    ...baseOptions,
                    comparisonMetrics: this.getEnabledMetrics(),
                    includeStatistics: true,
                    includeCorrelations: true
                };
            case 'correlations':
                return {
                    ...baseOptions,
                    includeConfidenceIntervals: true,
                    minimumSampleSize: 3,
                    includePValues: true
                };
            case 'heatmap':
                return {
                    ...baseOptions,
                    selectedMetric: this.getEnabledMetrics()[0] || 'wordCount',
                    includeIntensityLevels: true,
                    includeDensityData: true
                };
            case 'insights':
                return {
                    ...baseOptions,
                    includeDataOverview: true,
                    includeTrendAnalysis: true,
                    includeOutlierDetection: true,
                    includeCorrelations: true,
                    includePatterns: true
                };
            default:
                return baseOptions;
        }
    }
    
    private getDataStructureForTab(tabType: TabType): 'raw' | 'aggregated' | 'statistical' | 'calendar' {
        switch (tabType) {
            case 'statistics': return 'raw';
            case 'trends': return 'aggregated';
            case 'compare': return 'statistical';
            case 'correlations': return 'statistical';
            case 'heatmap': return 'calendar';
            case 'insights': return 'statistical';
            default: return 'raw';
        }
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
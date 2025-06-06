/**
 * CSV Export Service for OneiroMetrics
 * Provides tab-integrated export functionality for chart data
 */

import { DreamMetricData } from '../types/core';

// Export format options
export type ExportFormat = 'csv' | 'json' | 'xlsx';
export type TabType = 'statistics' | 'trends' | 'compare' | 'correlations' | 'heatmap';
export type DataStructure = 'raw' | 'aggregated' | 'statistical' | 'calendar';
export type NormalizationType = 'none' | 'minMax' | 'zScore';

// Date range interface
export interface DateRange {
    start: string; // YYYY-MM-DD format
    end: string;   // YYYY-MM-DD format
}

// Base export options
export interface BaseExportOptions {
    format: ExportFormat;
    includeMetadata: boolean;
    dateRange?: DateRange;
    selectedMetrics?: string[];
    normalization: NormalizationType;
    includeCalculated: boolean; // Quality scores, derived metrics
}

// Tab-specific export options
export interface TabExportOptions extends BaseExportOptions {
    tabType: TabType;
    dataStructure: DataStructure;
}

// Specific export option types for each tab
export interface StatisticsExportOptions extends BaseExportOptions {
    includeQualityScore: boolean;
    includeEntryDetails: boolean;
    groupBy?: 'date' | 'metric';
}

export interface TrendsExportOptions extends BaseExportOptions {
    includeMovingAverages: boolean;
    aggregationPeriod: 'daily' | 'weekly' | 'monthly';
    includeTrendAnalysis: boolean;
}

export interface CompareExportOptions extends BaseExportOptions {
    comparisonMetrics: string[];
    includeStatistics: boolean;
    includeCorrelations: boolean;
}

export interface CorrelationsExportOptions extends BaseExportOptions {
    includeConfidenceIntervals: boolean;
    minimumSampleSize: number;
    includePValues: boolean;
}

export interface HeatmapExportOptions extends BaseExportOptions {
    selectedMetric: string;
    includeIntensityLevels: boolean;
    includeDensityData: boolean;
}

// Export result structure
export interface ExportResult {
    content: string;
    filename: string;
    rowCount: number;
    timestamp: string;
    exportType: TabType;
}

// Export data structure
export interface ExportData {
    headers: string[];
    rows: string[][];
    metadata: ExportMetadata;
}

export interface ExportMetadata {
    exportDate: string;
    exportType: TabType;
    dataSource: string;
    rowCount: number;
    selectedMetrics: string[];
    dateRange?: DateRange;
    normalization: NormalizationType;
    version: string;
}

/**
 * Core CSV Export Service Interface
 */
export interface CSVExportService {
    // Core export functionality
    exportMetricsData(data: DreamMetricData[], options: BaseExportOptions): Promise<string>;
    exportCalendarData(data: DreamMetricData[], dateRange: DateRange, options: HeatmapExportOptions): Promise<string>;
    exportChartData(data: DreamMetricData[], tabType: TabType, options: TabExportOptions): Promise<string>;
    
    // Batch export capabilities
    exportAllData(data: DreamMetricData[], options: BaseExportOptions): Promise<ExportResult[]>;
    exportFilteredData(data: DreamMetricData[], filters: any[], options: BaseExportOptions): Promise<string>;
}

/**
 * Tab-Specific Exporter Interface
 */
export interface TabSpecificExporter {
    exportStatisticsData(data: DreamMetricData[], options: StatisticsExportOptions): Promise<string>;
    exportTrendsData(data: DreamMetricData[], options: TrendsExportOptions): Promise<string>;
    exportCompareData(data: DreamMetricData[], options: CompareExportOptions): Promise<string>;
    exportCorrelationsData(data: DreamMetricData[], options: CorrelationsExportOptions): Promise<string>;
    exportHeatmapData(data: DreamMetricData[], options: HeatmapExportOptions): Promise<string>;
}

/**
 * CSV Export Pipeline Implementation
 */
export class CSVExportPipeline implements CSVExportService, TabSpecificExporter {
    
    constructor(private appName: string = 'OneiroMetrics') {}

    // Core export methods
    async exportMetricsData(data: DreamMetricData[], options: BaseExportOptions): Promise<string> {
        const exportData = await this.prepareExportData(data, options);
        return this.formatAsCSV(exportData, 'statistics');
    }

    async exportCalendarData(data: DreamMetricData[], dateRange: DateRange, options: HeatmapExportOptions): Promise<string> {
        const exportData = await this.prepareCalendarData(data, dateRange, options);
        return this.formatAsCSV(exportData, 'heatmap');
    }

    async exportChartData(data: DreamMetricData[], tabType: TabType, options: TabExportOptions): Promise<string> {
        const exportData = await this.prepareTabSpecificData(data, tabType, options);
        return this.formatAsCSV(exportData, tabType);
    }

    async exportAllData(data: DreamMetricData[], options: BaseExportOptions): Promise<ExportResult[]> {
        const results: ExportResult[] = [];
        const tabTypes: TabType[] = ['statistics', 'trends', 'compare', 'correlations', 'heatmap'];

        for (const tabType of tabTypes) {
            const tabOptions: TabExportOptions = {
                ...options,
                tabType,
                dataStructure: this.getDataStructureForTab(tabType)
            };
            
            const content = await this.exportChartData(data, tabType, tabOptions);
            const filename = this.generateFilename(tabType, options.format);
            
            results.push({
                content,
                filename,
                rowCount: content.split('\n').length - 1, // Subtract header
                timestamp: new Date().toISOString(),
                exportType: tabType
            });
        }

        return results;
    }

    async exportFilteredData(data: DreamMetricData[], filters: any[], options: BaseExportOptions): Promise<string> {
        const filteredData = this.applyFilters(data, filters);
        return this.exportMetricsData(filteredData, options);
    }

    // Tab-specific export methods
    async exportStatisticsData(data: DreamMetricData[], options: StatisticsExportOptions): Promise<string> {
        const exportData = await this.prepareStatisticsData(data, options);
        return this.formatAsCSV(exportData, 'statistics');
    }

    async exportTrendsData(data: DreamMetricData[], options: TrendsExportOptions): Promise<string> {
        const exportData = await this.prepareTrendsData(data, options);
        return this.formatAsCSV(exportData, 'trends');
    }

    async exportCompareData(data: DreamMetricData[], options: CompareExportOptions): Promise<string> {
        const exportData = await this.prepareCompareData(data, options);
        return this.formatAsCSV(exportData, 'compare');
    }

    async exportCorrelationsData(data: DreamMetricData[], options: CorrelationsExportOptions): Promise<string> {
        const exportData = await this.prepareCorrelationsData(data, options);
        return this.formatAsCSV(exportData, 'correlations');
    }

    async exportHeatmapData(data: DreamMetricData[], options: HeatmapExportOptions): Promise<string> {
        const exportData = await this.prepareHeatmapData(data, options);
        return this.formatAsCSV(exportData, 'heatmap');
    }

    // Helper methods (implementation stubs for now)
    private async prepareExportData(data: DreamMetricData[], options: BaseExportOptions): Promise<ExportData> {
        // TODO: Implement generic data preparation
        throw new Error('prepareExportData not implemented yet');
    }

    private async prepareCalendarData(data: DreamMetricData[], dateRange: DateRange, options: HeatmapExportOptions): Promise<ExportData> {
        // TODO: Implement calendar data preparation
        throw new Error('prepareCalendarData not implemented yet');
    }

    private async prepareTabSpecificData(data: DreamMetricData[], tabType: TabType, options: TabExportOptions): Promise<ExportData> {
        switch (tabType) {
            case 'statistics':
                return this.prepareStatisticsData(data, options as unknown as StatisticsExportOptions);
            case 'trends':
                return this.prepareTrendsData(data, options as unknown as TrendsExportOptions);
            case 'compare':
                return this.prepareCompareData(data, options as unknown as CompareExportOptions);
            case 'correlations':
                return this.prepareCorrelationsData(data, options as unknown as CorrelationsExportOptions);
            case 'heatmap':
                return this.prepareHeatmapData(data, options as unknown as HeatmapExportOptions);
            default:
                throw new Error(`Unsupported tab type: ${tabType}`);
        }
    }

    private async prepareStatisticsData(data: DreamMetricData[], options: StatisticsExportOptions): Promise<ExportData> {
        // Prepare headers based on available metrics
        const headers = ['Date', 'Entry_ID', 'Words'];
        const metricNames = new Set<string>();
        
        // Collect all unique metric names
        data.forEach(entry => {
            if (entry.metrics) {
                Object.keys(entry.metrics).forEach(metric => metricNames.add(metric));
            }
        });
        
        // Add metric columns
        const sortedMetrics = Array.from(metricNames).sort();
        headers.push(...sortedMetrics);
        
        // Add quality score if requested
        if (options.includeQualityScore) {
            headers.push('Quality_Score');
        }
        
        // Add entry details if requested
        if (options.includeEntryDetails) {
            headers.push('Title', 'Content_Length', 'Source');
        }
        
        // Prepare rows
        const rows: string[][] = [];
        
        data.forEach((entry, index) => {
            const row: string[] = [];
            
            // Basic columns
            row.push(entry.date || '');
            row.push(this.generateEntryId(entry, index));
            row.push(String(entry.wordCount || 0));
            
            // Metric columns
            sortedMetrics.forEach(metricName => {
                const value = entry.metrics?.[metricName];
                row.push(value !== undefined ? String(value) : '');
            });
            
            // Quality score calculation if requested
            if (options.includeQualityScore && entry.metrics) {
                const qualityScore = this.calculateQualityScore(entry.metrics, sortedMetrics);
                row.push(qualityScore.toFixed(2));
            }
            
            // Entry details if requested
            if (options.includeEntryDetails) {
                row.push(entry.title || '');
                row.push(String(entry.content?.length || 0));
                row.push(typeof entry.source === 'string' ? entry.source : entry.source?.file || '');
            }
            
            rows.push(row);
        });
        
        // Sort by date if groupBy is 'date'
        if (options.groupBy === 'date') {
            rows.sort((a, b) => a[0].localeCompare(b[0])); // Compare date column
        }
        
        // Create metadata
        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            exportType: 'statistics',
            dataSource: 'Dream Journal Entries',
            rowCount: rows.length,
            selectedMetrics: sortedMetrics,
            dateRange: options.dateRange,
            normalization: options.normalization,
            version: '1.0'
        };
        
        return { headers, rows, metadata };
    }

    /**
     * Generate a unique entry ID from dream entry data
     */
    private generateEntryId(entry: DreamMetricData, index: number): string {
        // Try to use source file info to create meaningful ID
        if (typeof entry.source === 'object' && entry.source.id) {
            return entry.source.id;
        }
        
        // Use date + index if available
        if (entry.date) {
            const dateStr = entry.date.replace(/[-T:\.Z]/g, '').substring(0, 8); // YYYYMMDD
            return `${dateStr}_${index + 1}`;
        }
        
        // Fallback to simple index
        return `entry_${index + 1}`;
    }

    /**
     * Calculate a quality score based on metrics
     */
    private calculateQualityScore(metrics: Record<string, number | string>, metricNames: string[]): number {
        const numericMetrics = metricNames
            .map(name => metrics[name])
            .filter(value => typeof value === 'number') as number[];
        
        if (numericMetrics.length === 0) {
            return 0;
        }
        
        // Simple average-based quality score
        const sum = numericMetrics.reduce((acc, val) => acc + val, 0);
        return sum / numericMetrics.length;
    }

    private async prepareTrendsData(data: DreamMetricData[], options: TrendsExportOptions): Promise<ExportData> {
        // Prepare headers
        const headers = ['Date', 'Metric', 'Daily_Value', 'Entry_Count'];
        
        if (options.includeMovingAverages) {
            headers.push('7Day_Moving_Avg', '30Day_Moving_Avg');
        }
        
        if (options.includeTrendAnalysis) {
            headers.push('Trend_Direction', 'Trend_Strength', 'Weekly_Change');
        }
        
        // Collect all metrics
        const metricNames = new Set<string>();
        data.forEach(entry => {
            if (entry.metrics) {
                Object.keys(entry.metrics).forEach(metric => metricNames.add(metric));
            }
        });
        
        // Group by date and metric
        const dateMetricData = new Map<string, Map<string, number[]>>();
        
        data.forEach(entry => {
            const dateKey = this.parseDateToKey(entry.date);
            if (!dateKey || !entry.metrics) return;
            
            if (!dateMetricData.has(dateKey)) {
                dateMetricData.set(dateKey, new Map());
            }
            
            const dayMetrics = dateMetricData.get(dateKey)!;
            
            Object.entries(entry.metrics).forEach(([metric, value]) => {
                const numValue = Number(value);
                if (isNaN(numValue)) return;
                
                if (!dayMetrics.has(metric)) {
                    dayMetrics.set(metric, []);
                }
                dayMetrics.get(metric)!.push(numValue);
            });
        });
        
        // Calculate daily averages for each metric
        const dailyAverages = new Map<string, Map<string, number>>();
        dateMetricData.forEach((dayMetrics, date) => {
            const dayAverages = new Map<string, number>();
            dayMetrics.forEach((values, metric) => {
                const average = values.reduce((a, b) => a + b, 0) / values.length;
                dayAverages.set(metric, average);
            });
            dailyAverages.set(date, dayAverages);
        });
        
        // Sort dates for time series processing
        const sortedDates = Array.from(dateMetricData.keys()).sort();
        
        // Prepare rows
        const rows: string[][] = [];
        
        // Process each metric across all dates
        Array.from(metricNames).sort().forEach(metricName => {
            const metricTimeSeries: { date: string; value: number; count: number }[] = [];
            
            sortedDates.forEach(date => {
                const dayMetrics = dateMetricData.get(date);
                const dayAverages = dailyAverages.get(date);
                
                if (dayMetrics?.has(metricName) && dayAverages?.has(metricName)) {
                    metricTimeSeries.push({
                        date,
                        value: dayAverages.get(metricName)!,
                        count: dayMetrics.get(metricName)!.length
                    });
                }
            });
            
            // Calculate moving averages and trends for this metric
            metricTimeSeries.forEach((point, index) => {
                const row: string[] = [];
                row.push(point.date);
                row.push(metricName);
                row.push(point.value.toFixed(2));
                row.push(String(point.count));
                
                if (options.includeMovingAverages) {
                    const ma7 = this.calculateMovingAverage(metricTimeSeries, index, 7);
                    const ma30 = this.calculateMovingAverage(metricTimeSeries, index, 30);
                    row.push(ma7.toFixed(2));
                    row.push(ma30.toFixed(2));
                }
                
                if (options.includeTrendAnalysis) {
                    const trendData = this.calculateTrendData(metricTimeSeries, index);
                    row.push(trendData.direction);
                    row.push(trendData.strength.toFixed(2));
                    row.push(trendData.weeklyChange.toFixed(2));
                }
                
                rows.push(row);
            });
        });
        
        // Create metadata
        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            exportType: 'trends',
            dataSource: 'Time Series Analysis',
            rowCount: rows.length,
            selectedMetrics: Array.from(metricNames).sort(),
            dateRange: options.dateRange,
            normalization: options.normalization,
            version: '1.0'
        };
        
        return { headers, rows, metadata };
    }

    /**
     * Calculate moving average for a time series
     */
    private calculateMovingAverage(
        series: { date: string; value: number; count: number }[], 
        currentIndex: number, 
        windowSize: number
    ): number {
        const start = Math.max(0, currentIndex - windowSize + 1);
        const end = currentIndex + 1;
        const window = series.slice(start, end);
        
        if (window.length === 0) return 0;
        
        const sum = window.reduce((acc, point) => acc + point.value, 0);
        return sum / window.length;
    }

    /**
     * Calculate trend direction and strength
     */
    private calculateTrendData(
        series: { date: string; value: number; count: number }[], 
        currentIndex: number
    ): { direction: string; strength: number; weeklyChange: number } {
        // Use last 7 days for trend calculation
        const windowSize = 7;
        const start = Math.max(0, currentIndex - windowSize + 1);
        const window = series.slice(start, currentIndex + 1);
        
        if (window.length < 2) {
            return { direction: 'stable', strength: 0, weeklyChange: 0 };
        }
        
        // Calculate linear regression slope
        const n = window.length;
        const sumX = (n * (n - 1)) / 2; // Sum of indices 0,1,2,...,n-1
        const sumY = window.reduce((acc, point) => acc + point.value, 0);
        const sumXY = window.reduce((acc, point, index) => acc + index * point.value, 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        
        // Determine direction and strength
        const strength = Math.abs(slope);
        let direction: string;
        
        if (Math.abs(slope) < 0.1) {
            direction = 'stable';
        } else if (slope > 0) {
            direction = 'increasing';
        } else {
            direction = 'decreasing';
        }
        
        // Calculate weekly change (current vs 7 days ago)
        const weeklyChange = currentIndex >= 6 ? 
            window[window.length - 1].value - window[0].value : 0;
        
        return { direction, strength, weeklyChange };
    }

    private async prepareCompareData(data: DreamMetricData[], options: CompareExportOptions): Promise<ExportData> {
        // Prepare headers
        const headers = ['Metric', 'Count', 'Mean', 'Std_Dev', 'Min', 'Max', 'Median'];
        
        if (options.includeStatistics) {
            headers.push('Q1', 'Q3', 'IQR', 'Skewness', 'Kurtosis');
        }
        
        if (options.includeCorrelations) {
            headers.push('Top_Correlation_Metric', 'Top_Correlation_Value');
        }
        
        // Collect metrics data
        const metricData = new Map<string, number[]>();
        
        data.forEach(entry => {
            if (!entry.metrics) return;
            
            Object.entries(entry.metrics).forEach(([metric, value]) => {
                const numValue = Number(value);
                if (isNaN(numValue)) return;
                
                if (!metricData.has(metric)) {
                    metricData.set(metric, []);
                }
                metricData.get(metric)!.push(numValue);
            });
        });
        
        // Filter by comparison metrics if specified
        const metricsToCompare = options.comparisonMetrics.length > 0 ? 
            options.comparisonMetrics.filter(metric => metricData.has(metric)) :
            Array.from(metricData.keys());
        
        // Calculate correlations between all metrics if requested
        const correlationMatrix = options.includeCorrelations ? 
            this.buildCorrelationMatrix(metricData, metricsToCompare) : new Map();
        
        // Prepare rows
        const rows: string[][] = [];
        
        metricsToCompare.forEach(metric => {
            const values = metricData.get(metric)!;
            if (values.length === 0) return;
            
            const stats = this.calculateDescriptiveStatistics(values);
            
            const row: string[] = [];
            row.push(metric);
            row.push(String(values.length));
            row.push(stats.mean.toFixed(3));
            row.push(stats.stdDev.toFixed(3));
            row.push(stats.min.toFixed(3));
            row.push(stats.max.toFixed(3));
            row.push(stats.median.toFixed(3));
            
            if (options.includeStatistics) {
                row.push(stats.q1.toFixed(3));
                row.push(stats.q3.toFixed(3));
                row.push(stats.iqr.toFixed(3));
                row.push(stats.skewness.toFixed(3));
                row.push(stats.kurtosis.toFixed(3));
            }
            
            if (options.includeCorrelations) {
                const topCorrelation = this.getTopCorrelation(metric, correlationMatrix);
                row.push(topCorrelation.metric);
                row.push(topCorrelation.value.toFixed(4));
            }
            
            rows.push(row);
        });
        
        // Create metadata
        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            exportType: 'compare',
            dataSource: 'Comparative Metrics Analysis',
            rowCount: rows.length,
            selectedMetrics: metricsToCompare,
            dateRange: options.dateRange,
            normalization: options.normalization,
            version: '1.0'
        };
        
        return { headers, rows, metadata };
    }

    /**
     * Calculate descriptive statistics for a dataset
     */
    private calculateDescriptiveStatistics(values: number[]): {
        mean: number;
        stdDev: number;
        min: number;
        max: number;
        median: number;
        q1: number;
        q3: number;
        iqr: number;
        skewness: number;
        kurtosis: number;
    } {
        const sorted = [...values].sort((a, b) => a - b);
        const n = values.length;
        
        // Basic statistics
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
        const stdDev = Math.sqrt(variance);
        const min = sorted[0];
        const max = sorted[n - 1];
        
        // Quantiles
        const median = this.calculateQuantile(sorted, 0.5);
        const q1 = this.calculateQuantile(sorted, 0.25);
        const q3 = this.calculateQuantile(sorted, 0.75);
        const iqr = q3 - q1;
        
        // Skewness and kurtosis
        const skewness = this.calculateSkewness(values, mean, stdDev);
        const kurtosis = this.calculateKurtosis(values, mean, stdDev);
        
        return { mean, stdDev, min, max, median, q1, q3, iqr, skewness, kurtosis };
    }

    /**
     * Calculate quantile value
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
     * Calculate skewness
     */
    private calculateSkewness(values: number[], mean: number, stdDev: number): number {
        if (stdDev === 0) return 0;
        
        const n = values.length;
        const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 3), 0);
        
        return (n / ((n - 1) * (n - 2))) * sum;
    }

    /**
     * Calculate kurtosis (excess kurtosis)
     */
    private calculateKurtosis(values: number[], mean: number, stdDev: number): number {
        if (stdDev === 0) return 0;
        
        const n = values.length;
        const sum = values.reduce((acc, val) => acc + Math.pow((val - mean) / stdDev, 4), 0);
        
        return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - 
               (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
    }

    /**
     * Build correlation matrix between metrics
     */
    private buildCorrelationMatrix(
        metricData: Map<string, number[]>,
        metrics: string[]
    ): Map<string, Map<string, number>> {
        const correlationMatrix = new Map<string, Map<string, number>>();
        
        metrics.forEach(metricA => {
            const correlations = new Map<string, number>();
            
            metrics.forEach(metricB => {
                if (metricA === metricB) {
                    correlations.set(metricB, 1.0);
                } else {
                    const valuesA = metricData.get(metricA)!;
                    const valuesB = metricData.get(metricB)!;
                    
                    const minLength = Math.min(valuesA.length, valuesB.length);
                    const pairedA = valuesA.slice(0, minLength);
                    const pairedB = valuesB.slice(0, minLength);
                    
                    if (pairedA.length >= 3) {
                        const correlation = this.calculateCorrelation(pairedA, pairedB);
                        correlations.set(metricB, correlation.coefficient);
                    } else {
                        correlations.set(metricB, 0);
                    }
                }
            });
            
            correlationMatrix.set(metricA, correlations);
        });
        
        return correlationMatrix;
    }

    /**
     * Get the top correlation for a given metric
     */
    private getTopCorrelation(
        metric: string, 
        correlationMatrix: Map<string, Map<string, number>>
    ): { metric: string; value: number } {
        const correlations = correlationMatrix.get(metric);
        if (!correlations) {
            return { metric: 'N/A', value: 0 };
        }
        
        let topMetric = 'N/A';
        let topValue = 0;
        
        correlations.forEach((value, otherMetric) => {
            if (otherMetric !== metric && Math.abs(value) > Math.abs(topValue)) {
                topMetric = otherMetric;
                topValue = value;
            }
        });
        
        return { metric: topMetric, value: topValue };
    }

    private async prepareCorrelationsData(data: DreamMetricData[], options: CorrelationsExportOptions): Promise<ExportData> {
        // Prepare headers
        const headers = ['Metric_A', 'Metric_B', 'Correlation_Coefficient', 'Sample_Size'];
        
        if (options.includePValues) {
            headers.push('P_Value', 'Significance');
        }
        
        if (options.includeConfidenceIntervals) {
            headers.push('CI_Lower_95', 'CI_Upper_95');
        }
        
        // Collect metrics and their values
        const metricData = new Map<string, number[]>();
        
        data.forEach(entry => {
            if (!entry.metrics) return;
            
            Object.entries(entry.metrics).forEach(([metric, value]) => {
                const numValue = Number(value);
                if (isNaN(numValue)) return;
                
                if (!metricData.has(metric)) {
                    metricData.set(metric, []);
                }
                metricData.get(metric)!.push(numValue);
            });
        });
        
        // Filter metrics that have enough data points
        const validMetrics = Array.from(metricData.entries())
            .filter(([_, values]) => values.length >= options.minimumSampleSize)
            .map(([metric, _]) => metric)
            .sort();
        
        // Prepare rows
        const rows: string[][] = [];
        
        // Calculate correlations for all pairs
        for (let i = 0; i < validMetrics.length; i++) {
            for (let j = i + 1; j < validMetrics.length; j++) {
                const metricA = validMetrics[i];
                const metricB = validMetrics[j];
                
                const valuesA = metricData.get(metricA)!;
                const valuesB = metricData.get(metricB)!;
                
                // Ensure we have paired data
                const minLength = Math.min(valuesA.length, valuesB.length);
                const pairedA = valuesA.slice(0, minLength);
                const pairedB = valuesB.slice(0, minLength);
                
                if (pairedA.length < options.minimumSampleSize) continue;
                
                const correlation = this.calculateCorrelation(pairedA, pairedB);
                
                const row: string[] = [];
                row.push(metricA);
                row.push(metricB);
                row.push(correlation.coefficient.toFixed(4));
                row.push(String(pairedA.length));
                
                if (options.includePValues) {
                    const pValue = this.calculatePValue(correlation.coefficient, pairedA.length);
                    const significance = this.getSignificanceLevel(pValue);
                    row.push(pValue.toFixed(6));
                    row.push(significance);
                }
                
                if (options.includeConfidenceIntervals) {
                    const ci = this.calculateConfidenceInterval(correlation.coefficient, pairedA.length);
                    row.push(ci.lower.toFixed(4));
                    row.push(ci.upper.toFixed(4));
                }
                
                rows.push(row);
            }
        }
        
        // Create metadata
        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            exportType: 'correlations',
            dataSource: 'Correlation Matrix Analysis',
            rowCount: rows.length,
            selectedMetrics: validMetrics,
            dateRange: options.dateRange,
            normalization: options.normalization,
            version: '1.0'
        };
        
        return { headers, rows, metadata };
    }

    /**
     * Calculate Pearson correlation coefficient
     */
    private calculateCorrelation(x: number[], y: number[]): { coefficient: number } {
        const n = x.length;
        if (n < 2) return { coefficient: 0 };
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
        const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
        const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        
        if (denominator === 0) return { coefficient: 0 };
        
        return { coefficient: numerator / denominator };
    }

    /**
     * Calculate p-value for correlation coefficient
     */
    private calculatePValue(r: number, n: number): number {
        if (n < 3) return 1;
        
        // Calculate t-statistic
        const df = n - 2;
        const t = Math.abs(r) * Math.sqrt(df / (1 - r * r));
        
        // Approximate p-value using simplified t-distribution
        // This is a rough approximation - for precise values, would need a proper t-distribution CDF
        if (t > 3.0) return 0.001;
        if (t > 2.6) return 0.01;
        if (t > 2.0) return 0.05;
        if (t > 1.3) return 0.1;
        return 0.2;
    }

    /**
     * Get significance level based on p-value
     */
    private getSignificanceLevel(pValue: number): string {
        if (pValue < 0.001) return '***';
        if (pValue < 0.01) return '**';
        if (pValue < 0.05) return '*';
        if (pValue < 0.1) return '.';
        return 'ns';
    }

    /**
     * Calculate 95% confidence interval for correlation coefficient
     */
    private calculateConfidenceInterval(r: number, n: number): { lower: number; upper: number } {
        if (n < 4) return { lower: -1, upper: 1 };
        
        // Fisher's z-transformation
        const z = 0.5 * Math.log((1 + r) / (1 - r));
        const se = 1 / Math.sqrt(n - 3);
        const zCritical = 1.96; // 95% confidence interval
        
        const zLower = z - zCritical * se;
        const zUpper = z + zCritical * se;
        
        // Transform back to correlation scale
        const lower = (Math.exp(2 * zLower) - 1) / (Math.exp(2 * zLower) + 1);
        const upper = (Math.exp(2 * zUpper) - 1) / (Math.exp(2 * zUpper) + 1);
        
        return { 
            lower: Math.max(-1, Math.min(1, lower)), 
            upper: Math.max(-1, Math.min(1, upper)) 
        };
    }

    private async prepareHeatmapData(data: DreamMetricData[], options: HeatmapExportOptions): Promise<ExportData> {
        const selectedMetric = options.selectedMetric;
        
        // Prepare headers
        const headers = ['Date', 'Metric', 'Raw_Value', 'Entry_Count'];
        
        if (options.includeIntensityLevels) {
            headers.push('Normalized_Value', 'Intensity_Level');
        }
        
        if (options.includeDensityData) {
            headers.push('Daily_Density', 'Weekly_Average', 'Monthly_Average');
        }
        
        // Group data by date and calculate values
        const dateMetrics = new Map<string, number[]>();
        
        data.forEach(entry => {
            if (entry.metrics && entry.metrics[selectedMetric] !== undefined) {
                const dateKey = this.parseDateToKey(entry.date);
                if (dateKey) {
                    if (!dateMetrics.has(dateKey)) {
                        dateMetrics.set(dateKey, []);
                    }
                    const metricValue = Number(entry.metrics[selectedMetric]);
                    if (!isNaN(metricValue)) {
                        dateMetrics.get(dateKey)!.push(metricValue);
                    }
                }
            }
        });
        
        // Calculate min/max for normalization
        const allValues = Array.from(dateMetrics.values()).flat();
        const minValue = Math.min(...allValues);
        const maxValue = Math.max(...allValues);
        const valueRange = maxValue - minValue;
        
        // Generate density calculations if requested
        const densityData = options.includeDensityData ? 
            this.calculateDensityData(dateMetrics) : new Map();
        
        // Prepare rows
        const rows: string[][] = [];
        const sortedDates = Array.from(dateMetrics.keys()).sort();
        
        sortedDates.forEach(dateKey => {
            const values = dateMetrics.get(dateKey)!;
            const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
            const entryCount = values.length;
            
            const row: string[] = [];
            row.push(dateKey);
            row.push(selectedMetric);
            row.push(avgValue.toFixed(2));
            row.push(String(entryCount));
            
            if (options.includeIntensityLevels) {
                const normalizedValue = valueRange > 0 ? (avgValue - minValue) / valueRange : 0;
                const intensityLevel = this.getIntensityLevel(normalizedValue);
                
                row.push(normalizedValue.toFixed(3));
                row.push(intensityLevel);
            }
            
            if (options.includeDensityData) {
                const density = densityData.get(dateKey);
                row.push(String(density?.daily || 0));
                row.push(density?.weekly?.toFixed(2) || '0.00');
                row.push(density?.monthly?.toFixed(2) || '0.00');
            }
            
            rows.push(row);
        });
        
        // Create metadata
        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            exportType: 'heatmap',
            dataSource: `Calendar Heatmap - ${selectedMetric}`,
            rowCount: rows.length,
            selectedMetrics: [selectedMetric],
            dateRange: options.dateRange,
            normalization: options.normalization,
            version: '1.0'
        };
        
        return { headers, rows, metadata };
    }

    /**
     * Parse date string to YYYY-MM-DD format
     */
    private parseDateToKey(dateStr: string): string | null {
        try {
            let date: Date;
            
            if (dateStr.includes('T') || dateStr.includes('Z')) {
                date = new Date(dateStr);
            } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateStr;
            } else {
                date = new Date(dateStr);
            }
            
            if (isNaN(date.getTime())) {
                return null;
            }
            
            return date.toISOString().split('T')[0];
        } catch {
            return null;
        }
    }

    /**
     * Get intensity level based on normalized value
     */
    private getIntensityLevel(normalizedValue: number): string {
        if (normalizedValue >= 0.7) return 'high';
        if (normalizedValue >= 0.4) return 'medium';
        return 'low';
    }

    /**
     * Calculate density data for dates
     */
    private calculateDensityData(dateMetrics: Map<string, number[]>): Map<string, { daily: number; weekly: number; monthly: number }> {
        const densityData = new Map<string, { daily: number; weekly: number; monthly: number }>();
        const sortedDates = Array.from(dateMetrics.keys()).sort();
        
        sortedDates.forEach((dateKey, index) => {
            const currentDate = new Date(dateKey);
            const currentEntryCount = dateMetrics.get(dateKey)!.length;
            
            // Daily density is just the entry count for that day
            const dailyDensity = currentEntryCount;
            
            // Weekly density: average entries over 7-day window centered on current date
            const weekStart = Math.max(0, index - 3);
            const weekEnd = Math.min(sortedDates.length - 1, index + 3);
            const weekDates = sortedDates.slice(weekStart, weekEnd + 1);
            const weeklyEntries = weekDates.reduce((sum, date) => sum + dateMetrics.get(date)!.length, 0);
            const weeklyDensity = weeklyEntries / weekDates.length;
            
            // Monthly density: average entries for same month
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            const monthDates = sortedDates.filter(date => {
                const d = new Date(date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            const monthlyEntries = monthDates.reduce((sum, date) => sum + dateMetrics.get(date)!.length, 0);
            const monthlyDensity = monthlyEntries / monthDates.length;
            
            densityData.set(dateKey, {
                daily: dailyDensity,
                weekly: weeklyDensity,
                monthly: monthlyDensity
            });
        });
        
        return densityData;
    }

    private formatAsCSV(data: ExportData, tabContext: TabType): string {
        // Create header row
        const csvRows: string[] = [];
        
        // Add metadata as comments if requested
        if (data.metadata) {
            csvRows.push(`# ${this.appName} Export - ${data.metadata.exportType}`);
            csvRows.push(`# Generated: ${data.metadata.exportDate}`);
            csvRows.push(`# Data Source: ${data.metadata.dataSource}`);
            csvRows.push(`# Rows: ${data.metadata.rowCount}`);
            if (data.metadata.selectedMetrics.length > 0) {
                csvRows.push(`# Metrics: ${data.metadata.selectedMetrics.join(', ')}`);
            }
            csvRows.push(''); // Empty line separator
        }

        // Add headers
        csvRows.push(this.escapeCSVRow(data.headers));

        // Add data rows
        data.rows.forEach(row => {
            csvRows.push(this.escapeCSVRow(row));
        });

        return csvRows.join('\n');
    }

    private escapeCSVRow(row: string[]): string {
        return row.map(cell => this.escapeCSVCell(cell)).join(',');
    }

    private escapeCSVCell(value: string): string {
        const str = String(value || '');
        // Escape quotes and wrap in quotes if needed
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    private generateFilename(tabType: TabType, format: ExportFormat): string {
        const timestamp = new Date().toISOString().split('T')[0];
        const timeString = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        return `oneirometrics-${tabType}-${timestamp}-${timeString}.${format}`;
    }

    private getDataStructureForTab(tabType: TabType): DataStructure {
        switch (tabType) {
            case 'statistics': return 'raw';
            case 'trends': return 'aggregated';
            case 'compare': return 'statistical';
            case 'correlations': return 'statistical';
            case 'heatmap': return 'calendar';
            default: return 'raw';
        }
    }

    private applyFilters(data: DreamMetricData[], filters: any[]): DreamMetricData[] {
        // TODO: Implement filtering logic
        return data;
    }

    public triggerDownload(csvContent: string, filename: string, tabType: TabType): void {
        // Create blob with CSV content
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Clean up
        URL.revokeObjectURL(url);
    }
} 
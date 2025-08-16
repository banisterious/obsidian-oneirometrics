/**
 * EnhancedMetricsExtractor
 * 
 * Extracts dream metrics from both frontmatter and callout sources,
 * handling conflict resolution and merging.
 */

import { App, TFile } from 'obsidian';
import { FrontmatterPropertyParser } from './FrontmatterPropertyParser';
import { FrontmatterMetricSource } from './FrontmatterMetricSource';
import { ExtractedMetrics, FrontmatterMetricConfig, MetricConflict } from '../../types/frontmatter';
import { DreamMetric, DreamMetricsSettings } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';
import { MetricsEntry } from '../../workers/types';

export class EnhancedMetricsExtractor {
    private frontmatterParser: FrontmatterPropertyParser;
    private frontmatterSource: FrontmatterMetricSource;
    
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private logger: ILogger
    ) {
        this.frontmatterParser = new FrontmatterPropertyParser(app, logger);
        
        // Build frontmatter config from metrics that have frontmatterProperty set
        const frontmatterConfigs = this.buildFrontmatterConfigs();
        
        if (frontmatterConfigs.length > 0) {
            this.frontmatterSource = new FrontmatterMetricSource(
                this.frontmatterParser,
                frontmatterConfigs,
                app,
                logger,
                this.settings.metrics
            );
        }
    }

    /**
     * Build frontmatter configurations from metrics that have frontmatterProperty set
     */
    private buildFrontmatterConfigs(): FrontmatterMetricConfig[] {
        const configs: FrontmatterMetricConfig[] = [];
        
        for (const [metricName, metric] of Object.entries(this.settings.metrics)) {
            if (metric.frontmatterProperty && metric.enabled) {
                // Determine if this metric expects array values
                const isArrayMetric = metric.format === 'list' || 
                                    metric.format === 'tags' ||
                                    metric.type === 'string' ||
                                    metricName.toLowerCase().includes('list') ||
                                    metricName.toLowerCase().includes('theme');
                
                configs.push({
                    metricName: metricName,
                    propertyName: metric.frontmatterProperty,
                    format: isArrayMetric ? 'array' : 'single',
                    enabled: true,
                    priority: 50, // Default priority
                    autoDetectType: true,
                    coerceType: true
                });
            }
        }
        
        return configs;
    }

    /**
     * Extract metrics from a file, combining frontmatter and callout sources
     */
    async extractMetricsFromFile(
        file: TFile, 
        calloutMetrics: ExtractedMetrics | null
    ): Promise<{
        metrics: ExtractedMetrics,
        conflicts: MetricConflict[]
    }> {
        const conflicts: MetricConflict[] = [];
        let finalMetrics: ExtractedMetrics = {};

        // Extract from frontmatter if enabled
        let frontmatterMetrics: ExtractedMetrics = {};
        if (this.settings.frontmatter?.enabled && this.frontmatterSource) {
            try {
                frontmatterMetrics = await this.frontmatterSource.extractMetrics(file);
                this.logger.debug('EnhancedExtractor', 
                    `Extracted frontmatter metrics from ${file.path}`, 
                    frontmatterMetrics
                );
            } catch (error) {
                this.logger.error('EnhancedExtractor', 
                    `Failed to extract frontmatter metrics from ${file.path}`, 
                    error
                );
            }
        }

        // If no callout metrics, just return frontmatter
        if (!calloutMetrics || Object.keys(calloutMetrics).length === 0) {
            return { 
                metrics: frontmatterMetrics, 
                conflicts: [] 
            };
        }

        // If no frontmatter metrics, just return callout
        if (Object.keys(frontmatterMetrics).length === 0) {
            return { 
                metrics: calloutMetrics, 
                conflicts: [] 
            };
        }

        // Merge metrics and detect conflicts
        const allMetricNames = new Set([
            ...Object.keys(frontmatterMetrics),
            ...Object.keys(calloutMetrics)
        ]);

        for (const metricName of allMetricNames) {
            // Skip metadata fields
            if (metricName.startsWith('_')) {
                continue;
            }

            const fmValue = frontmatterMetrics[metricName];
            const calloutValue = calloutMetrics[metricName];

            if (fmValue !== undefined && calloutValue !== undefined) {
                // Both sources have this metric - potential conflict
                if (this.valuesEqual(fmValue, calloutValue)) {
                    // Same value, no conflict
                    finalMetrics[metricName] = fmValue;
                } else {
                    // Conflict detected
                    const conflict: MetricConflict = {
                        metric: metricName,
                        frontmatterValue: fmValue,
                        calloutValue: calloutValue,
                        severity: this.calculateSeverity(metricName, fmValue, calloutValue),
                        suggestedResolution: this.getSuggestedResolution(metricName)
                    };
                    conflicts.push(conflict);

                    // Resolve conflict - prefer frontmatter if property is configured
                    finalMetrics[metricName] = this.resolveConflict(
                        fmValue, 
                        calloutValue, 
                        conflict.suggestedResolution === 'frontmatter' ? 'frontmatter' : 'callout'
                    );
                }
            } else if (fmValue !== undefined) {
                // Only frontmatter has this metric
                finalMetrics[metricName] = fmValue;
            } else if (calloutValue !== undefined) {
                // Only callout has this metric
                finalMetrics[metricName] = calloutValue;
            }
        }

        // Add source metadata
        if (conflicts.length > 0) {
            finalMetrics._source = 'both';
        } else if (Object.keys(frontmatterMetrics).length > 0 && Object.keys(calloutMetrics).length > 0) {
            finalMetrics._source = 'both';
        } else if (Object.keys(frontmatterMetrics).length > 0) {
            finalMetrics._source = 'frontmatter';
        } else {
            finalMetrics._source = 'callout';
        }

        return { metrics: finalMetrics, conflicts };
    }

    /**
     * Check if two values are equal
     */
    private valuesEqual(a: any, b: any): boolean {
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            return a.every((val, idx) => val === b[idx]);
        }
        return a === b;
    }

    /**
     * Calculate conflict severity
     */
    private calculateSeverity(
        metric: string, 
        fmValue: any, 
        calloutValue: any
    ): 'low' | 'medium' | 'high' {
        // Numeric metrics with large differences are high severity
        if (typeof fmValue === 'number' && typeof calloutValue === 'number') {
            const diff = Math.abs(fmValue - calloutValue);
            const avg = (fmValue + calloutValue) / 2;
            
            if (avg === 0) return 'low';
            
            const percentDiff = diff / avg;
            if (percentDiff > 0.5) return 'high';
            if (percentDiff > 0.2) return 'medium';
        }

        // Array differences
        if (Array.isArray(fmValue) || Array.isArray(calloutValue)) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Get suggested resolution based on metric configuration
     */
    private getSuggestedResolution(metricName: string): 'frontmatter' | 'callout' {
        // Since we're not using the old frontmatter settings structure,
        // let's check if the metric has a frontmatter property defined
        const metric = this.settings.metrics[metricName];
        
        if (metric && metric.frontmatterProperty) {
            return 'frontmatter';
        }
        
        return 'callout';
    }

    /**
     * Resolve a conflict based on the configured strategy
     */
    private resolveConflict(
        fmValue: any, 
        calloutValue: any, 
        strategy: 'frontmatter' | 'callout' | 'newest' | 'manual'
    ): any {
        switch (strategy) {
            case 'frontmatter':
                return fmValue;
            case 'callout':
                return calloutValue;
            case 'newest':
                // For now, default to frontmatter
                // In a full implementation, we'd check timestamps
                return fmValue;
            case 'manual':
                // For now, default to frontmatter
                // In a full implementation, we'd prompt the user
                return fmValue;
            default:
                return fmValue;
        }
    }

    /**
     * Convert extracted metrics to the format expected by MetricsEntry
     */
    convertToMetricsEntryFormat(
        extractedMetrics: ExtractedMetrics,
        existingEntry: Partial<MetricsEntry>
    ): Partial<MetricsEntry> {
        // Convert metric names to match expected format
        const convertedMetrics: Record<string, number> = {};
        
        for (const [key, value] of Object.entries(extractedMetrics)) {
            if (key.startsWith('_')) continue;
            
            // Convert to number if possible
            if (typeof value === 'number') {
                convertedMetrics[key] = value;
            } else if (typeof value === 'string') {
                const num = parseFloat(value);
                if (!isNaN(num)) {
                    convertedMetrics[key] = num;
                }
            } else if (Array.isArray(value)) {
                // For arrays, we might want to use the length or first value
                // This depends on the metric type
                convertedMetrics[key] = value.length;
            }
        }

        return {
            ...existingEntry,
            metrics: convertedMetrics,
            metadata: {
                ...existingEntry.metadata,
                metricsSource: extractedMetrics._source
            }
        };
    }
}
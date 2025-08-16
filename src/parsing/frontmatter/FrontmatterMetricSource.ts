/**
 * FrontmatterMetricSource
 * 
 * Implements the MetricSource interface for extracting dream metrics
 * from frontmatter properties.
 */

import { App, TFile } from 'obsidian';
import { FrontmatterPropertyParser } from './FrontmatterPropertyParser';
import { FrontmatterMetricConfig, ExtractedMetrics } from '../../types/frontmatter';
import { DreamMetric } from '../../types/core';
import { ILogger } from '../../logging/LoggerTypes';

export interface MetricSource {
    type: 'frontmatter' | 'callout' | 'hybrid';
    getPriority(): number;
    extractMetrics(file: TFile): Promise<ExtractedMetrics>;
    updateMetrics(file: TFile, metrics: ExtractedMetrics): Promise<void>;
}

export class FrontmatterMetricSource implements MetricSource {
    readonly type = 'frontmatter' as const;

    constructor(
        private parser: FrontmatterPropertyParser,
        private config: FrontmatterMetricConfig[],
        private app: App,
        private logger: ILogger,
        private metricsDefinitions: Record<string, DreamMetric>
    ) {}

    /**
     * Get the average priority of all configured metrics
     */
    getPriority(): number {
        if (this.config.length === 0) return 50;
        
        const total = this.config.reduce((sum, c) => sum + c.priority, 0);
        return total / this.config.length;
    }

    /**
     * Extract metrics from a file's frontmatter
     */
    async extractMetrics(file: TFile): Promise<ExtractedMetrics> {
        try {
            const parseResult = await this.parser.parseFromFile(file);
            
            if (!parseResult.success) {
                this.logger.warn('FrontmatterMetricSource', 
                    `Failed to parse frontmatter from ${file.path}`, 
                    parseResult.errors
                );
                return this.createEmptyMetrics();
            }

            const frontmatter = parseResult.data;
            const metrics: ExtractedMetrics = this.createEmptyMetrics();

            // Extract configured metrics
            for (const metricConfig of this.config) {
                if (!metricConfig.enabled) continue;

                const propertyValue = frontmatter[metricConfig.propertyName];
                if (propertyValue === undefined || propertyValue === null) continue;

                const convertedValue = this.convertValue(propertyValue, metricConfig);
                if (convertedValue !== undefined) {
                    metrics[metricConfig.metricName] = convertedValue;
                }
            }

            // Add metadata
            metrics._source = 'frontmatter';
            metrics._extractedAt = new Date().toISOString();

            return metrics;
        } catch (error) {
            this.logger.error('FrontmatterMetricSource', 
                `Error extracting metrics from ${file.path}`, 
                error
            );
            return this.createEmptyMetrics();
        }
    }

    /**
     * Update metrics in a file's frontmatter
     */
    async updateMetrics(file: TFile, metrics: ExtractedMetrics): Promise<void> {
        try {
            const content = await this.app.vault.read(file);
            const parseResult = await this.parser.parseFromFile(file);
            
            const frontmatter = parseResult.success ? parseResult.data : {};

            // Update frontmatter with metric values
            for (const metricConfig of this.config) {
                if (!metricConfig.enabled) continue;

                const metricValue = metrics[metricConfig.metricName];
                if (metricValue !== undefined && metricValue !== null) {
                    frontmatter[metricConfig.propertyName] = this.formatValue(
                        metricValue, 
                        metricConfig
                    );
                }
            }

            // Update the file
            const updatedContent = this.parser.update(content, frontmatter);
            await this.app.vault.modify(file, updatedContent);

            this.logger.debug('FrontmatterMetricSource', 
                `Updated frontmatter metrics in ${file.path}`
            );
        } catch (error) {
            this.logger.error('FrontmatterMetricSource', 
                `Failed to update metrics in ${file.path}`, 
                error
            );
            throw error;
        }
    }

    /**
     * Convert a frontmatter value to the expected metric format
     */
    private convertValue(value: any, config: FrontmatterMetricConfig): any {
        // Auto-detect type if enabled
        if (config.autoDetectType) {
            if (Array.isArray(value)) {
                return value;
            } else if (typeof value === 'string' && value.includes(',')) {
                // Handle comma-separated values
                return value.split(',').map(v => v.trim());
            }
            return value;
        }

        // Use configured format
        if (config.format === 'array') {
            if (Array.isArray(value)) {
                return value;
            } else if (config.coerceType && value !== undefined && value !== null) {
                // Convert single value to array if coercion enabled
                return [value];
            }
            return value;
        }

        // For single format, extract first item if array provided
        if (config.format === 'single' && Array.isArray(value)) {
            return value[0];
        }

        // Ensure numeric values for numeric metrics
        const metricDef = this.metricsDefinitions[config.metricName];
        if (metricDef && metricDef.type === 'number' && typeof value === 'string') {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                return num;
            }
        }

        return value;
    }

    /**
     * Format a metric value for storage in frontmatter
     */
    private formatValue(value: any, config: FrontmatterMetricConfig): any {
        if (config.format === 'array' && !Array.isArray(value)) {
            // Convert to array if needed
            return config.coerceType ? [value] : value;
        }

        if (config.format === 'single' && Array.isArray(value)) {
            // Take first element for single format
            return value[0];
        }

        return value;
    }

    /**
     * Create empty metrics object with all known metrics initialized
     */
    private createEmptyMetrics(): ExtractedMetrics {
        const metrics: ExtractedMetrics = {};

        // Initialize all known metrics to null
        for (const [metricName, metricDef] of Object.entries(this.metricsDefinitions)) {
            if (metricDef.enabled) {
                metrics[metricName] = null;
            }
        }

        return metrics;
    }
}
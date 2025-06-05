/**
 * MetricsDiscoveryService - Dynamic Metrics Discovery and Management
 * 
 * This service provides unified metrics discovery and management across
 * all OneiroMetrics components, eliminating hardcoded metric lists.
 */

import { DreamMetric, DreamMetricData, DreamMetricsSettings } from '../types/core';
import { App } from 'obsidian';
import { getLogger } from '../logging';

export interface MetricDiscoveryResult {
    /** All discovered metrics from content */
    discovered: DreamMetric[];
    /** Metrics that are unknown/new */
    unknown: DreamMetric[];
    /** Valid metrics according to current configuration */
    valid: DreamMetric[];
    /** Deprecated metrics that should be migrated */
    deprecated: DreamMetric[];
}

export interface MetricValidationOptions {
    /** Whether to include disabled metrics in results */
    includeDisabled?: boolean;
    /** Whether to auto-enable discovered metrics */
    autoEnable?: boolean;
    /** Categories to filter by */
    categories?: string[];
    /** Custom validation function */
    validator?: (metric: DreamMetric) => boolean;
}

export class MetricsDiscoveryService {
    private static instance: MetricsDiscoveryService;
    private metricCache = new Map<string, DreamMetric>();
    private discoveryCache = new Map<string, MetricDiscoveryResult>();
    private lastCacheUpdate = 0;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private logger = getLogger('MetricsDiscoveryService');
    
    constructor(
        private app: App,
        private settings: DreamMetricsSettings
    ) {}
    
    static getInstance(app: App, settings: DreamMetricsSettings): MetricsDiscoveryService {
        if (!MetricsDiscoveryService.instance) {
            MetricsDiscoveryService.instance = new MetricsDiscoveryService(app, settings);
        }
        return MetricsDiscoveryService.instance;
    }
    
    /**
     * Discover all metrics from the given dream entries
     */
    async discoverMetrics(
        entries: DreamMetricData[],
        options: MetricValidationOptions = {}
    ): Promise<MetricDiscoveryResult> {
        const cacheKey = this.generateCacheKey(entries, options);
        
        // Check cache first
        if (this.isCacheValid() && this.discoveryCache.has(cacheKey)) {
            this.logger.debug('Metrics', 'Using cached discovery result');
            return this.discoveryCache.get(cacheKey)!;
        }
        
        this.logger.debug('Metrics', `Discovering metrics from ${entries.length} entries`);
        
        const discovered = new Map<string, DreamMetric>();
        const unknown: DreamMetric[] = [];
        
        // Extract all unique metrics from entries
        for (const entry of entries) {
            if (!entry.metrics) continue;
            
            for (const [metricName, value] of Object.entries(entry.metrics)) {
                if (discovered.has(metricName)) continue;
                
                const metric = this.createMetricFromData(metricName, value, entry);
                discovered.set(metricName, metric);
                
                // Check if this is a known metric
                if (!this.isKnownMetric(metricName)) {
                    unknown.push(metric);
                }
            }
        }
        
        const discoveredArray = Array.from(discovered.values());
        const valid = this.validateMetrics(discoveredArray, options);
        const deprecated = this.findDeprecatedMetrics(discoveredArray);
        
        const result: MetricDiscoveryResult = {
            discovered: discoveredArray,
            unknown,
            valid,
            deprecated
        };
        
        // Cache the result
        this.discoveryCache.set(cacheKey, result);
        this.lastCacheUpdate = Date.now();
        
        this.logger.debug('Metrics', `Discovery complete: ${discoveredArray.length} total, ${unknown.length} unknown, ${valid.length} valid`);
        
        return result;
    }
    
    /**
     * Get all configured metrics with their current state
     */
    getConfiguredMetrics(options: MetricValidationOptions = {}): DreamMetric[] {
        const metrics = Object.values(this.settings.metrics || {});
        return this.validateMetrics(metrics, options);
    }
    
    /**
     * Check if a metric is enabled in the current configuration
     */
    isMetricEnabled(metricName: string): boolean {
        const metric = this.settings.metrics?.[metricName];
        return metric?.enabled === true;
    }
    
    /**
     * Get available metrics for a specific component (calendar, charts, etc.)
     */
    getAvailableMetrics(
        component: 'calendar' | 'charts' | 'table' | 'all',
        options: MetricValidationOptions = {}
    ): DreamMetric[] {
        const allMetrics = this.getConfiguredMetrics(options);
        
        // Component-specific filtering could be added here
        switch (component) {
            case 'calendar':
                // Calendar prefers numeric metrics for visualization
                return allMetrics.filter(m => m.type === 'number' || !m.type);
            case 'charts':
                // Charts can handle various metric types
                return allMetrics;
            case 'table':
                // Tables can display all metric types
                return allMetrics;
            case 'all':
            default:
                return allMetrics;
        }
    }
    
    /**
     * Update the settings with new metric configuration
     */
    async updateMetricConfiguration(
        metrics: DreamMetric[],
        mergeStrategy: 'replace' | 'merge' | 'add' = 'merge'
    ): Promise<void> {
        this.logger.debug('Metrics', `Updating metric configuration with ${metrics.length} metrics (strategy: ${mergeStrategy})`);
        
        let updatedMetrics: Record<string, DreamMetric>;
        
        switch (mergeStrategy) {
            case 'replace':
                updatedMetrics = {};
                break;
            case 'merge':
                updatedMetrics = { ...this.settings.metrics };
                break;
            case 'add':
                updatedMetrics = { ...this.settings.metrics };
                break;
        }
        
        // Apply new metrics
        for (const metric of metrics) {
            if (mergeStrategy === 'add' && updatedMetrics[metric.name]) {
                continue; // Skip existing metrics in add mode
            }
            updatedMetrics[metric.name] = metric;
        }
        
        // Update settings
        this.settings.metrics = updatedMetrics;
        
        // Clear caches
        this.clearCaches();
        
        this.logger.debug('Metrics', `Configuration updated with ${Object.keys(updatedMetrics).length} total metrics`);
    }
    
    /**
     * Validate and normalize a metric configuration
     */
    validateMetric(metric: DreamMetric): { valid: boolean; errors: string[]; normalized?: DreamMetric } {
        const errors: string[] = [];
        const normalized = { ...metric };
        
        // Required fields
        if (!metric.name?.trim()) {
            errors.push('Metric name is required');
        }
        
        // Validate numeric ranges
        if (typeof metric.minValue === 'number' && typeof metric.maxValue === 'number') {
            if (metric.minValue >= metric.maxValue) {
                errors.push('minValue must be less than maxValue');
            }
        }
        
        // Normalize legacy properties
        if (metric.range && !metric.minValue && !metric.maxValue) {
            normalized.minValue = metric.range.min;
            normalized.maxValue = metric.range.max;
        }
        
        if (metric.min !== undefined && normalized.minValue === undefined) {
            normalized.minValue = metric.min;
        }
        
        if (metric.max !== undefined && normalized.maxValue === undefined) {
            normalized.maxValue = metric.max;
        }
        
        // Set defaults
        normalized.enabled = normalized.enabled !== false;
        normalized.type = normalized.type || 'number';
        normalized.format = normalized.format || normalized.type;
        normalized.category = normalized.category || 'dream';
        
        return {
            valid: errors.length === 0,
            errors,
            normalized: errors.length === 0 ? normalized : undefined
        };
    }
    
    /**
     * Get metric display configuration for UI components
     */
    getMetricDisplayConfig(metricName: string): {
        displayName: string;
        icon: string;
        description: string;
        enabled: boolean;
        category: string;
    } | null {
        const metric = this.settings.metrics?.[metricName];
        if (!metric) return null;
        
        return {
            displayName: metric.name,
            icon: metric.icon || 'bar-chart',
            description: metric.description || `${metric.name} metric`,
            enabled: metric.enabled,
            category: metric.category || 'dream'
        };
    }
    
    /**
     * Clear all caches
     */
    clearCaches(): void {
        this.metricCache.clear();
        this.discoveryCache.clear();
        this.lastCacheUpdate = 0;
        this.logger.debug('Metrics', 'Caches cleared');
    }
    
    // Private helper methods
    private createMetricFromData(name: string, value: any, entry: DreamMetricData): DreamMetric {
        const existingMetric = this.settings.metrics?.[name];
        
        if (existingMetric) {
            return existingMetric;
        }
        
        // Create new metric based on data type
        const metric: DreamMetric = {
            name,
            icon: this.inferIcon(name),
            minValue: typeof value === 'number' ? 1 : 0,
            maxValue: typeof value === 'number' ? 5 : 100,
            enabled: false, // New metrics are disabled by default
            category: this.inferCategory(name),
            type: typeof value === 'number' ? 'number' : 'string',
            format: typeof value === 'number' ? 'number' : 'text',
            description: `Auto-discovered metric: ${name}`
        };
        
        return metric;
    }
    
    private isKnownMetric(name: string): boolean {
        return this.settings.metrics?.[name] !== undefined;
    }
    
    private validateMetrics(metrics: DreamMetric[], options: MetricValidationOptions): DreamMetric[] {
        return metrics.filter(metric => {
            // Check enabled state
            if (!options.includeDisabled && !metric.enabled) {
                return false;
            }
            
            // Check categories
            if (options.categories && !options.categories.includes(metric.category || 'dream')) {
                return false;
            }
            
            // Custom validator
            if (options.validator && !options.validator(metric)) {
                return false;
            }
            
            return true;
        });
    }
    
    private findDeprecatedMetrics(metrics: DreamMetric[]): DreamMetric[] {
        // Define deprecated metric patterns
        const deprecatedPatterns = [
            /^old_/i,
            /^legacy_/i,
            /deprecated/i
        ];
        
        return metrics.filter(metric => 
            deprecatedPatterns.some(pattern => pattern.test(metric.name))
        );
    }
    
    private inferIcon(name: string): string {
        const iconMap: Record<string, string> = {
            'sensory': 'eye',
            'emotional': 'heart',
            'confidence': 'shield',
            'clarity': 'glasses',
            'lucid': 'lightbulb',
            'recall': 'brain',
            'character': 'users',
            'theme': 'tag',
            'coherence': 'link',
            'detail': 'zoom-in'
        };
        
        const lowerName = name.toLowerCase();
        for (const [key, icon] of Object.entries(iconMap)) {
            if (lowerName.includes(key)) {
                return icon;
            }
        }
        
        return 'bar-chart'; // default icon
    }
    
    private inferCategory(name: string): string {
        const categoryMap: Record<string, string> = {
            'character': 'character',
            'theme': 'theme',
            'emotion': 'emotional',
            'sensory': 'sensory',
            'lucid': 'awareness'
        };
        
        const lowerName = name.toLowerCase();
        for (const [key, category] of Object.entries(categoryMap)) {
            if (lowerName.includes(key)) {
                return category;
            }
        }
        
        return 'dream'; // default category
    }
    
    private generateCacheKey(entries: DreamMetricData[], options: MetricValidationOptions): string {
        const entriesHash = entries.length + '_' + entries.slice(0, 3).map(e => e.source).join('|');
        const optionsHash = JSON.stringify(options);
        return `${entriesHash}_${optionsHash}`;
    }
    
    private isCacheValid(): boolean {
        return Date.now() - this.lastCacheUpdate < this.CACHE_TTL;
    }
} 
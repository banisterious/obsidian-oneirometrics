/**
 * Settings Migration Utilities
 * 
 * Handles migration of settings to support the unified metrics infrastructure
 * while maintaining backward compatibility.
 */

import { DreamMetricsSettings, DreamMetric } from '../types/core';
import { getLogger } from '../logging';

const logger = getLogger('SettingsMigration');

export interface MigrationResult {
    /** Whether migration was performed */
    migrated: boolean;
    /** Version migrated from */
    fromVersion?: string;
    /** Version migrated to */
    toVersion: string;
    /** Any warnings or issues encountered */
    warnings: string[];
    /** Backup of original settings (for rollback) */
    backup?: Partial<DreamMetricsSettings>;
}

/**
 * Current configuration version
 */
export const CURRENT_CONFIG_VERSION = '1.0.0';

/**
 * Default unified metrics configuration
 */
export const DEFAULT_UNIFIED_METRICS_CONFIG = {
    autoDiscovery: false, // Conservative default
    visualizationThresholds: {
        low: 0.33,   // Bottom third
        medium: 0.67, // Middle third  
        high: 1.0    // Top third
    },
    preferredMetrics: {
        calendar: ['Sensory Detail', 'Emotional Recall', 'Confidence Score'],
        charts: ['Sensory Detail', 'Emotional Recall', 'Lost Segments', 'Descriptiveness'],
        table: [] // Empty = show all enabled metrics
    },
    discovery: {
        autoEnable: false, // Conservative default
        categories: [], // Empty = all categories
        maxNewMetrics: 10
    },
    configVersion: CURRENT_CONFIG_VERSION
};

/**
 * Migrate settings to include unified metrics configuration
 */
export function migrateToUnifiedMetrics(settings: DreamMetricsSettings): MigrationResult {
    const result: MigrationResult = {
        migrated: false,
        toVersion: CURRENT_CONFIG_VERSION,
        warnings: []
    };
    
    // Check if migration is needed
    const currentVersion = settings.unifiedMetrics?.configVersion;
    
    if (currentVersion === CURRENT_CONFIG_VERSION) {
        logger.debug('Settings', 'No migration needed - already at current version');
        return result;
    }
    
    // Create backup
    result.backup = { ...settings };
    result.fromVersion = currentVersion || 'pre-unified';
    
    logger.info('Settings', `Migrating settings from ${result.fromVersion} to ${CURRENT_CONFIG_VERSION}`);
    
    // Initialize unified metrics configuration if it doesn't exist
    if (!settings.unifiedMetrics) {
        settings.unifiedMetrics = { ...DEFAULT_UNIFIED_METRICS_CONFIG };
        result.migrated = true;
        logger.debug('Settings', 'Created new unified metrics configuration');
    } else {
        // Merge with defaults to ensure all properties exist
        settings.unifiedMetrics = {
            ...DEFAULT_UNIFIED_METRICS_CONFIG,
            ...settings.unifiedMetrics,
            configVersion: CURRENT_CONFIG_VERSION
        };
        result.migrated = true;
        logger.debug('Settings', 'Updated existing unified metrics configuration');
    }
    
    // Migrate preferred metrics from existing enabled metrics
    if (settings.metrics && Object.keys(settings.metrics).length > 0) {
        const enabledMetrics = Object.values(settings.metrics)
            .filter(metric => metric.enabled)
            .map(metric => metric.name);
        
        // Populate preferred metrics if not already set
        if (settings.unifiedMetrics.preferredMetrics.calendar.length === 0) {
            // Use first 3 enabled metrics for calendar
            settings.unifiedMetrics.preferredMetrics.calendar = enabledMetrics.slice(0, 3);
        }
        
        if (settings.unifiedMetrics.preferredMetrics.charts.length === 0) {
            // Use first 4 enabled metrics for charts
            settings.unifiedMetrics.preferredMetrics.charts = enabledMetrics.slice(0, 4);
        }
        
        logger.debug('Settings', `Migrated ${enabledMetrics.length} enabled metrics to preferred metrics`);
    }
    
    // Validate migrated configuration
    const validationResult = validateUnifiedMetricsConfig(settings.unifiedMetrics);
    if (!validationResult.valid) {
        result.warnings.push(...validationResult.errors);
        logger.warn('Settings', 'Migration completed with warnings', { warnings: result.warnings });
    }
    
    if (result.migrated) {
        logger.info('Settings', 'Settings migration completed successfully');
    }
    
    return result;
}

/**
 * Validate unified metrics configuration
 */
export function validateUnifiedMetricsConfig(config: NonNullable<DreamMetricsSettings['unifiedMetrics']>): {
    valid: boolean;
    errors: string[];
    normalized?: NonNullable<DreamMetricsSettings['unifiedMetrics']>;
} {
    const errors: string[] = [];
    const normalized = { ...config };
    
    // Validate thresholds
    const thresholds = normalized.visualizationThresholds;
    if (thresholds.low < 0 || thresholds.low > 1) {
        errors.push('Low threshold must be between 0 and 1');
        normalized.visualizationThresholds.low = Math.max(0, Math.min(1, thresholds.low));
    }
    
    if (thresholds.medium < 0 || thresholds.medium > 1) {
        errors.push('Medium threshold must be between 0 and 1');
        normalized.visualizationThresholds.medium = Math.max(0, Math.min(1, thresholds.medium));
    }
    
    if (thresholds.high < 0 || thresholds.high > 1) {
        errors.push('High threshold must be between 0 and 1');
        normalized.visualizationThresholds.high = Math.max(0, Math.min(1, thresholds.high));
    }
    
    if (thresholds.low >= thresholds.medium) {
        errors.push('Low threshold must be less than medium threshold');
        normalized.visualizationThresholds.low = Math.max(0, thresholds.medium - 0.1);
    }
    
    if (thresholds.medium >= thresholds.high) {
        errors.push('Medium threshold must be less than high threshold');
        normalized.visualizationThresholds.medium = Math.max(thresholds.low + 0.1, thresholds.high - 0.1);
    }
    
    // Validate discovery settings
    if (normalized.discovery.maxNewMetrics < 0) {
        errors.push('Maximum new metrics must be non-negative');
        normalized.discovery.maxNewMetrics = 10;
    }
    
    return {
        valid: errors.length === 0,
        errors,
        normalized: errors.length === 0 ? normalized : undefined
    };
}

/**
 * Get metrics for a specific component using unified configuration
 */
export function getComponentMetrics(
    settings: DreamMetricsSettings,
    component: 'calendar' | 'charts' | 'table',
    fallbackToEnabled = true
): DreamMetric[] {
    if (!settings.unifiedMetrics || !settings.metrics) {
        return [];
    }
    
    const preferredNames = settings.unifiedMetrics.preferredMetrics[component];
    const allMetrics = Object.values(settings.metrics);
    
    // If no preferred metrics defined or table component, use all enabled metrics
    if (preferredNames.length === 0 || component === 'table') {
        return allMetrics.filter(metric => metric.enabled);
    }
    
    // Get preferred metrics that exist and are enabled
    const preferredMetrics: DreamMetric[] = [];
    for (const name of preferredNames) {
        const metric = settings.metrics[name];
        if (metric && metric.enabled) {
            preferredMetrics.push(metric);
        }
    }
    
    // Fallback to all enabled metrics if no preferred metrics found
    if (preferredMetrics.length === 0 && fallbackToEnabled) {
        return allMetrics.filter(metric => metric.enabled);
    }
    
    return preferredMetrics;
}

/**
 * Get visualization threshold for a metric value
 */
export function getMetricThreshold(
    value: number,
    minValue: number,
    maxValue: number,
    thresholds: NonNullable<DreamMetricsSettings['unifiedMetrics']>['visualizationThresholds']
): 'low' | 'medium' | 'high' {
    // Normalize value to 0-1 range
    const normalized = (value - minValue) / (maxValue - minValue);
    
    if (normalized <= thresholds.low) {
        return 'low';
    } else if (normalized <= thresholds.medium) {
        return 'medium';
    } else {
        return 'high';
    }
}

/**
 * Check if unified metrics configuration is available and valid
 */
export function hasUnifiedMetricsConfig(settings: DreamMetricsSettings): boolean {
    return settings.unifiedMetrics?.configVersion === CURRENT_CONFIG_VERSION;
}

/**
 * Get default configuration for components that don't have unified config yet
 */
export function getDefaultComponentConfig(component: 'calendar' | 'charts' | 'table'): {
    preferredMetrics: string[];
    behavior: string;
} {
    switch (component) {
        case 'calendar':
            return {
                preferredMetrics: ['Sensory Detail', 'Emotional Recall', 'Confidence Score'],
                behavior: 'Show configurable metrics with visual intensity mapping'
            };
        case 'charts':
            return {
                preferredMetrics: ['Sensory Detail', 'Emotional Recall', 'Lost Segments', 'Descriptiveness'],
                behavior: 'Display selected metrics in heatmap with color intensity'
            };
        case 'table':
            return {
                preferredMetrics: [], // All enabled
                behavior: 'Show all enabled metrics in tabular format'
            };
    }
} 
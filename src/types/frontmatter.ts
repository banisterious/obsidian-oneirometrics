/**
 * Frontmatter types for OneiroMetrics
 * 
 * This file contains type definitions for frontmatter property support,
 * allowing dream metrics to be stored in note frontmatter.
 */

import { DreamMetric } from './core';

/**
 * Configuration for a single frontmatter metric mapping
 */
export interface FrontmatterMetricConfig {
    /** Internal metric identifier */
    metricName: string;
    
    /** Frontmatter property name */
    propertyName: string;
    
    /** Expected value format */
    format: 'single' | 'array';
    
    /** Array formatting style (for array types) */
    arrayFormat?: 'compact' | 'expanded';
    
    /** Whether this mapping is enabled */
    enabled: boolean;
    
    /** Resolution priority (1-100, higher takes precedence) */
    priority: number;
    
    /** Auto-detect if property is array/single */
    autoDetectType?: boolean;
    
    /** Convert single values to arrays if needed */
    coerceType?: boolean;
}

/**
 * Frontmatter configuration settings
 */
export interface FrontmatterSettings {
    /** Whether frontmatter support is enabled */
    enabled: boolean;
    
    /** Individual metric configurations */
    metricConfigs: FrontmatterMetricConfig[];
    
    /** Default conflict resolution mode */
    conflictResolution: 'frontmatter' | 'callout' | 'newest' | 'manual';
    
    /** Whether to preserve callouts when syncing */
    preserveCallouts: boolean;
    
    /** Whether to sync changes between sources */
    syncChanges: boolean;
    
    /** Whether to warn on conflicts */
    warnOnConflicts: boolean;
    
    /** Configuration version for migrations */
    configVersion: string;
}

/**
 * Parsed frontmatter data
 */
export interface FrontmatterData {
    [key: string]: any;
}

/**
 * Result of frontmatter parsing
 */
export interface FrontmatterParseResult {
    /** The parsed frontmatter data */
    data: FrontmatterData;
    
    /** Whether parsing was successful */
    success: boolean;
    
    /** Any errors encountered during parsing */
    errors?: string[];
    
    /** The raw YAML content */
    raw?: string;
}

/**
 * Validation result for frontmatter data
 */
export interface ValidationResult {
    /** Whether the validation passed */
    valid: boolean;
    
    /** List of validation errors */
    errors: string[];
    
    /** List of validation warnings */
    warnings: string[];
}

/**
 * Metric source information
 */
export type MetricSource = 'frontmatter' | 'callout' | 'both' | 'unknown';

/**
 * Map of metric names to their sources
 */
export interface MetricSourceMap {
    [metricName: string]: MetricSource;
}

/**
 * Conflict information for a metric
 */
export interface MetricConflict {
    /** The metric name */
    metric: string;
    
    /** Value from frontmatter */
    frontmatterValue: any;
    
    /** Value from callout */
    calloutValue: any;
    
    /** Severity of the conflict */
    severity: 'low' | 'medium' | 'high';
    
    /** Suggested resolution */
    suggestedResolution: 'frontmatter' | 'callout';
}

/**
 * Result of conflict detection
 */
export interface ConflictReport {
    /** File path */
    file: string;
    
    /** List of conflicts found */
    conflicts: MetricConflict[];
    
    /** Overall severity */
    overallSeverity: 'low' | 'medium' | 'high';
}

/**
 * Security validation result
 */
export interface SecurityValidationResult {
    /** Whether the value is safe */
    safe: boolean;
    
    /** Reason if unsafe */
    reason?: string;
}

/**
 * Options for bulk migration
 */
export interface MigrationOptions {
    /** Whether to remove callouts after migration */
    removeCallouts: boolean;
    
    /** Whether to create backups before migration */
    createBackup: boolean;
    
    /** Whether to validate data after migration */
    validateAfter: boolean;
    
    /** Specific metrics to migrate (empty = all) */
    metricsToMigrate: string[];
    
    /** Whether to skip files with conflicts */
    skipConflicts: boolean;
}

/**
 * Result of bulk migration
 */
export interface MigrationResult {
    /** Number of successfully migrated files */
    successful: number;
    
    /** Number of failed migrations */
    failed: number;
    
    /** Number of skipped files */
    skipped: number;
    
    /** Details of errors encountered */
    errors: Array<{
        file: string;
        error: string;
    }>;
}

/**
 * Raw metric values extracted from frontmatter
 */
export interface ExtractedMetrics {
    /** Metric values keyed by metric name */
    [metricName: string]: any;
    
    /** Source of the metrics */
    _source?: MetricSource;
    
    /** Timestamp of extraction */
    _extractedAt?: string;
}
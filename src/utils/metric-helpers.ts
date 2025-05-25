import { DreamMetric } from '../types';
import { DreamMetric as CoreDreamMetric } from '../types/core';

/**
 * Helper functions for safely accessing DreamMetric properties
 * with type checking and backward compatibility
 */

/**
 * Safely gets the enabled state of a metric
 * @param metric - The metric to check
 * @param defaultValue - Default value if enabled property doesn't exist
 * @returns The enabled state
 */
export function isMetricEnabled(metric: DreamMetric | CoreDreamMetric | any, defaultValue: boolean = false): boolean {
    if (!metric) return defaultValue;
    
    // Handle the case where it's explicitly set
    if (typeof metric.enabled === 'boolean') {
        return metric.enabled;
    }
    
    // Legacy fallback: if not disabled, assume enabled
    if (metric.disabled === true) {
        return false;
    }
    
    return defaultValue;
}

/**
 * Safely sets the enabled state on a metric
 * @param metric - The metric to update
 * @param enabled - Whether the metric should be enabled
 * @returns The updated metric
 */
export function setMetricEnabled(metric: DreamMetric | CoreDreamMetric | any, enabled: boolean): any {
    if (!metric) return null;
    
    // Create a copy to avoid mutating the original
    const result = { ...metric };
    
    // Set the enabled property
    result.enabled = enabled;
    
    // For backward compatibility, also set disabled
    result.disabled = !enabled;
    
    return result;
}

/**
 * Gets the minimum value of a metric
 * @param metric The dream metric
 * @returns The minimum value
 */
export function getMetricMinValue(metric: DreamMetric | CoreDreamMetric | any): number {
  // Look for minValue first, then fallback to range.min, then min, then default to 1
  if (typeof metric.minValue === 'number') {
    return metric.minValue;
  }
  
  if (metric.range && typeof metric.range.min === 'number') {
    return metric.range.min;
  }
  
  if (typeof metric.min === 'number') {
    return metric.min;
  }
  
  return 1;
}

/**
 * Gets the maximum value of a metric
 * @param metric The dream metric
 * @returns The maximum value
 */
export function getMetricMaxValue(metric: DreamMetric | CoreDreamMetric | any): number {
  // Look for maxValue first, then fallback to range.max, then max, then default to 5
  if (typeof metric.maxValue === 'number') {
    return metric.maxValue;
  }
  
  if (metric.range && typeof metric.range.max === 'number') {
    return metric.range.max;
  }
  
  if (typeof metric.max === 'number') {
    return metric.max;
  }
  
  return 5;
}

/**
 * Sets the minimum and maximum values of a metric
 * @param metric The dream metric to modify
 * @param min The minimum value
 * @param max The maximum value
 */
export function setMetricRange(metric: DreamMetric | CoreDreamMetric | any, min: number, max: number): void {
  // Set all properties for backward compatibility
  metric.minValue = min;
  metric.maxValue = max;
  
  // Legacy range property
  if (metric.range) {
    metric.range.min = min;
    metric.range.max = max;
  } else {
    metric.range = { min, max };
  }
  
  // Legacy min/max properties
  metric.min = min;
  metric.max = max;
}

/**
 * Gets the range of a metric as an object
 * @param metric The dream metric
 * @returns The range object with min and max properties
 */
export function getMetricRange(metric: DreamMetric | CoreDreamMetric | any): { min: number, max: number } {
  return {
    min: getMetricMinValue(metric),
    max: getMetricMaxValue(metric)
  };
}

/**
 * Helper functions for working with DreamMetric objects
 * to ensure type safety and backward compatibility
 */

/**
 * Creates a fully standardized DreamMetric from potentially legacy format
 * @param metric Potentially partial or legacy metric format
 * @returns A standardized DreamMetric with all required fields
 */
export function standardizeMetric(metric: Partial<DreamMetric | CoreDreamMetric> & Record<string, any>): DreamMetric & Record<string, any> {
  // Set default values
  const standardized: DreamMetric & Record<string, any> = {
    name: metric.name || 'Unnamed Metric',
    icon: metric.icon || 'help-circle',
    minValue: getMetricMinValue(metric as DreamMetric),
    maxValue: getMetricMaxValue(metric as DreamMetric),
    enabled: isMetricEnabled(metric as DreamMetric),
    description: metric.description || '',
    category: metric.category || 'general',
    type: metric.type || 'number',
    format: metric.format || 'number',
  };
  
  // Copy any other properties
  if (metric.options) {
    standardized.options = [...metric.options];
  }
  
  // Preserve but normalize legacy properties for backward compatibility
  if (metric.range || metric.min !== undefined || metric.max !== undefined) {
    standardized.range = {
      min: standardized.minValue,
      max: standardized.maxValue
    };
  }
  
  if (metric.min !== undefined) {
    standardized.min = standardized.minValue;
  }
  
  if (metric.max !== undefined) {
    standardized.max = standardized.maxValue;
  }
  
  if (metric.step !== undefined) {
    standardized.step = metric.step;
  }
  
  return standardized;
}

/**
 * Creates a metric that conforms to the core interface requirements
 * @param metric - Source metric object (or partial)
 * @returns A metric object with all required properties
 */
export function createCompatibleMetric(metric: Partial<DreamMetric | CoreDreamMetric> | any): CoreDreamMetric {
    // Create an object with the core properties, then cast to CoreDreamMetric
    // Using the unknown intermediate cast to avoid type checking errors
    const compatibleMetric = {
        name: metric.name || '',
        label: metric.label || metric.name || '',
        description: metric.description || '',
        type: metric.type || 'number',
        enabled: isMetricEnabled(metric, true),
        default: metric.default !== undefined ? metric.default : 0,
        min: metric.min !== undefined ? metric.min : 0,
        max: metric.max !== undefined ? metric.max : 100,
        step: metric.step !== undefined ? metric.step : 1,
        format: metric.format || '{}',
        group: metric.group || 'general',
        color: metric.color || '#000000',
        icon: metric.icon || '',
        aggregate: metric.aggregate || 'average',
        options: metric.options || {},
    };
    
    // Use a two-step type assertion to avoid TypeScript errors
    return compatibleMetric as unknown as CoreDreamMetric;
}

/**
 * Adapts a DreamMetric to ensure compatibility
 * @param metric The source metric
 * @returns A compatible metric
 */
export function adaptMetric(metric: DreamMetric | CoreDreamMetric | any): CoreDreamMetric {
    if (!metric) return createCompatibleMetric({});
    
    // If it's already a core metric (has all required properties), return it
    if (typeof metric.enabled === 'boolean') {
        return metric as CoreDreamMetric;
    }
    
    // Otherwise create a compatible version
    return createCompatibleMetric(metric);
}

// Additional helper exports
export * from "./metric-value-helpers";

// Export existing utilities if any 
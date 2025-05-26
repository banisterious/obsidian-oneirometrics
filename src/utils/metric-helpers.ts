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
export function standardizeMetric(metric: Partial<DreamMetric | CoreDreamMetric> & Record<string, any>): CoreDreamMetric {
  // Handle null or undefined input
  const input = metric || {};
  
  // Create a new object with expected properties in expected order
  const result: CoreDreamMetric = {
    name: input.name || 'Unnamed Metric',
    icon: input.icon || 'help-circle',
    minValue: getMetricMinValue(input),
    maxValue: getMetricMaxValue(input),
    enabled: isMetricEnabled(input),
    description: input.description || ''
  };
  
  // Add optional properties
  if (input.category) result.category = input.category;
  if (input.type) result.type = input.type;
  if (input.format) result.format = input.format;
  if (input.options) result.options = Array.isArray(input.options) ? [...input.options] : [input.options];
  
  // Add legacy properties if they exist in the input
  if (input.range || input.min !== undefined || input.max !== undefined) {
    result.range = {
      min: result.minValue,
      max: result.maxValue
    };
  }
  
  if (input.min !== undefined) result.min = result.minValue;
  if (input.max !== undefined) result.max = result.maxValue;
  if (input.step !== undefined) result.step = input.step;
  
  // Copy any other properties from the original
  for (const key in input) {
    if (!(key in result) && input[key] !== undefined) {
      (result as any)[key] = input[key];
    }
  }
  
  return result;
}

/**
 * Creates a metric that conforms to the core interface requirements
 * @param metric - Source metric object (or partial)
 * @returns A metric object with all required properties
 */
export function createCompatibleMetric(metric: Partial<DreamMetric | CoreDreamMetric> | any): CoreDreamMetric {
    // Handle null or undefined input
    if (!metric) {
        metric = {}; // Use empty object instead of null
    }
    
    // Create an object with the core properties, then cast to CoreDreamMetric
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
        minValue: getMetricMinValue(metric), // Ensure minValue is set for consistency
        maxValue: getMetricMaxValue(metric), // Ensure maxValue is set for consistency
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
  // Handle null or undefined input
  if (!metric) {
    return createCompatibleMetric({});
  }
  
  // Check if it already has all required properties
  const hasAllRequiredProps = 
    typeof metric.name === 'string' && 
    typeof metric.enabled === 'boolean' &&
    (typeof metric.minValue === 'number' || typeof metric.min === 'number' || 
     (metric.range && typeof metric.range.min === 'number')) &&
    (typeof metric.maxValue === 'number' || typeof metric.max === 'number' || 
     (metric.range && typeof metric.range.max === 'number'));
  
  if (hasAllRequiredProps) {
    // If it has all required properties, standardize it
    return standardizeMetric(metric);
  }
  
  // Otherwise create a completely new metric
  return createCompatibleMetric(metric);
}

// Additional helper exports
export * from "./metric-value-helpers";

// Export existing utilities if any 
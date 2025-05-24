import { DreamMetric } from '../types';

/**
 * Helper functions for safely accessing DreamMetric properties
 * with type checking and backward compatibility
 */

/**
 * Gets the enabled state of a metric
 * @param metric The dream metric
 * @returns Whether the metric is enabled
 */
export function isMetricEnabled(metric: DreamMetric): boolean {
  return (metric as any).enabled === true;
}

/**
 * Sets the enabled state of a metric
 * @param metric The dream metric to modify
 * @param enabled Whether the metric should be enabled
 */
export function setMetricEnabled(metric: DreamMetric, enabled: boolean): void {
  (metric as any).enabled = enabled;
}

/**
 * Gets the minimum value of a metric
 * @param metric The dream metric
 * @returns The minimum value
 */
export function getMetricMinValue(metric: DreamMetric): number {
  // Look for minValue first, then fallback to range.min, then min, then default to 1
  if (metric.minValue !== undefined) {
    return metric.minValue;
  }
  
  if ((metric as any).range && typeof (metric as any).range.min === 'number') {
    return (metric as any).range.min;
  }
  
  if ((metric as any).min !== undefined) {
    return (metric as any).min;
  }
  
  return 1;
}

/**
 * Gets the maximum value of a metric
 * @param metric The dream metric
 * @returns The maximum value
 */
export function getMetricMaxValue(metric: DreamMetric): number {
  // Look for maxValue first, then fallback to range.max, then max, then default to 5
  if (metric.maxValue !== undefined) {
    return metric.maxValue;
  }
  
  if ((metric as any).range && typeof (metric as any).range.max === 'number') {
    return (metric as any).range.max;
  }
  
  if ((metric as any).max !== undefined) {
    return (metric as any).max;
  }
  
  return 5;
}

/**
 * Sets the minimum and maximum values of a metric
 * @param metric The dream metric to modify
 * @param min The minimum value
 * @param max The maximum value
 */
export function setMetricRange(metric: DreamMetric, min: number, max: number): void {
  // Set all properties for backward compatibility
  metric.minValue = min;
  metric.maxValue = max;
  
  // Legacy range property
  if ((metric as any).range) {
    (metric as any).range.min = min;
    (metric as any).range.max = max;
  } else {
    (metric as any).range = { min, max };
  }
  
  // Legacy min/max properties
  (metric as any).min = min;
  (metric as any).max = max;
}

/**
 * Gets the range of a metric as an object
 * @param metric The dream metric
 * @returns The range object with min and max properties
 */
export function getMetricRange(metric: DreamMetric): { min: number, max: number } {
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
export function standardizeMetric(metric: Partial<DreamMetric> & Record<string, any>): DreamMetric & Record<string, any> {
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
    (standardized as any).range = {
      min: standardized.minValue,
      max: standardized.maxValue
    };
  }
  
  if (metric.min !== undefined) {
    (standardized as any).min = standardized.minValue;
  }
  
  if (metric.max !== undefined) {
    (standardized as any).max = standardized.maxValue;
  }
  
  if (metric.step !== undefined) {
    (standardized as any).step = metric.step;
  }
  
  return standardized;
} 
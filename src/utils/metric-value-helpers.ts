/**
 * Utility functions for working with metric values
 */

import { DreamMetric } from "../types";
import { DreamMetric as CoreDreamMetric } from "../types/core";

/**
 * Gets the formatted value of a metric
 * @param metric - The metric with formatting information
 * @param value - The value to format
 * @returns The formatted value
 */
export function getFormattedMetricValue(metric: DreamMetric | CoreDreamMetric | any, value: number | string): string {
    if (!metric) return String(value);
    
    const format = metric.format || '{}';
    return format.replace('{}', String(value));
}

/**
 * Gets the aggregated value from an array of values
 * @param metric - The metric with aggregation information
 * @param values - The values to aggregate
 * @returns The aggregated value
 */
export function getAggregatedMetricValue(metric: DreamMetric | CoreDreamMetric | any, values: (number | string)[]): number {
    if (!metric || !values || values.length === 0) return 0;
    
    // Convert all values to numbers, filtering out non-numeric
    const numericValues = values
        .map(v => typeof v === 'string' ? parseFloat(v) : v)
        .filter(v => !isNaN(v));
    
    if (numericValues.length === 0) return 0;
    
    // Get the aggregation method (default to average)
    const aggregateMethod = metric.aggregate || 'average';
    
    switch(aggregateMethod) {
        case 'sum':
            return numericValues.reduce((sum, val) => sum + val, 0);
        case 'average':
            return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        case 'min':
            return Math.min(...numericValues);
        case 'max':
            return Math.max(...numericValues);
        case 'median': {
            const sorted = [...numericValues].sort((a, b) => a - b);
            const middle = Math.floor(sorted.length / 2);
            if (sorted.length % 2 === 0) {
                return (sorted[middle - 1] + sorted[middle]) / 2;
            }
            return sorted[middle];
        }
        case 'mode': {
            const counts = numericValues.reduce((acc, val) => {
                acc[val] = (acc[val] || 0) + 1;
                return acc;
            }, {} as Record<number, number>);
            
            let mode = numericValues[0];
            let maxCount = 0;
            
            for (const [value, count] of Object.entries(counts)) {
                if (count > maxCount) {
                    maxCount = count;
                    mode = parseFloat(value);
                }
            }
            
            return mode;
        }
        case 'last':
            return numericValues[numericValues.length - 1];
        default:
            return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
    }
} 
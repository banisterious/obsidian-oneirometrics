/**
 * metrics/index.ts
 * 
 * Barrel file for exporting metrics-related components
 */

export { MetricsProcessor } from './MetricsProcessor';
export { getDreamEntryDate } from '../utils/date-utils';
export { DreamMetricsProcessor } from './DreamMetricsProcessor';
export { MetricsCollector } from './MetricsCollector';
export { TableStatisticsUpdater } from './TableStatisticsUpdater';
export { MetricsDiscoveryService, type MetricDiscoveryResult, type MetricValidationOptions } from './MetricsDiscoveryService'; 
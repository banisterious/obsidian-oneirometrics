/**
 * Barrel file for utility functions
 * Provides centralized exports for all helper functions
 */

// Re-export all helpers from settings-helpers.ts
export * from './settings-helpers';

// Re-export all helpers from type-guards.ts
export * from './type-guards';

// Re-export property helpers from the permanent implementation
export { 
  getPropertyValue,
  setPropertyValue,
  createPropertyProxy,
  applyPropertyDefaults,
  extractMetricValue
} from './property-helpers';

// Re-export metric helpers (except for isMetricEnabled which conflicts with type-guards)
export {
  setMetricEnabled,
  getMetricMinValue,
  getMetricMaxValue,
  setMetricRange,
  getMetricRange,
  standardizeMetric,
  createCompatibleMetric,
  adaptMetric
} from './metric-helpers';

// Re-export selection mode helpers
export * from './selection-mode-helpers';

// Re-export DOM helper functions
export * from './dom-helpers';

// Re-export async helper functions
export * from './async-helpers';

// Re-export metric value helpers
export * from './metric-value-helpers';

// Re-export callout utilities
export * from './callout-utils';

// Legacy adapter exports - these will be removed in future updates
// MIGRATION NOTICE: New code should use the permanent utilities above

// Re-export all property compatibility utilities (legacy)
// These will be deprecated - prefer property-helpers equivalents
export {
  getCompatibleProperty,
  setCompatibleProperty
} from './property-compatibility';

// Re-export all adapter functions
export * from './adapter-functions';

// Re-export UI component adapters
export * from './ui-component-adapter';

// Re-export component migration utilities
export * from './component-migrator';

// Re-export type adapters
export * from './type-adapters';

// Add other utility exports as needed
// This simplifies imports throughout the codebase 
/**
 * @deprecated This file is being phased out. Import types from src/types instead.
 * Example: import { DreamMetric, LogLevel } from './src/types';
 */

import * as NewTypes from './src/types';
import { DreamMetricsSettings as CoreDreamMetricsSettings, SelectionMode as CoreSelectionMode } from './src/types/core';

// Log deprecation warning at runtime if this file is imported
console.warn(
  "DEPRECATION WARNING: Importing from root-level types.ts is deprecated. " +
  "Import from src/types instead. This file will be removed in a future version."
);

// Re-export all types from the new location for backward compatibility
export * from './src/types';

// Legacy type aliases to maintain compatibility
export type LogLevel = NewTypes.LogLevel;
export type DreamMetric = NewTypes.DreamMetric;
export type DreamMetricData = NewTypes.DreamMetricData;

// Make DreamMetricsSettings extend the core interface for proper compatibility
export interface DreamMetricsSettings extends CoreDreamMetricsSettings {
  /**
   * @deprecated - This interface extends CoreDreamMetricsSettings from src/types/core.
   * For new code, use DreamMetricsSettings from src/types instead.
   */
}

export type SelectionMode = CoreSelectionMode;

// Match the old LintingSettings name with the new JournalStructureSettings type
export type LintingSettings = NewTypes.JournalStructureSettings;
export type LoggingSettings = NewTypes.LoggingSettings;

// Define placeholder interfaces for Timeline and CalendarView
export interface Timeline {}
export interface CalendarView {}

// Define ActiveJournal interface for backward compatibility
export interface ActiveJournal {
  id?: string;
  path?: string;
  content?: string;
  date?: Date;
  title?: string;
}

// Export constants from the new location instead of defining temporary values
export const DEFAULT_METRICS = NewTypes.DEFAULT_METRICS;
export const DEFAULT_LOGGING = NewTypes.DEFAULT_LOGGING;
// Don't export DEFAULT_JOURNAL_STRUCTURE_SETTINGS to avoid duplicate declaration
// export const DEFAULT_JOURNAL_STRUCTURE_SETTINGS = {} as any; 
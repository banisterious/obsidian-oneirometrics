/**
 * OneiroMetrics Type System
 * 
 * This file exports all types from the OneiroMetrics type modules.
 * Import types from this file rather than from individual modules
 * to ensure consistency and maintainability.
 * 
 * Example: import { DreamMetric, LogLevel } from '../types';
 */

// Core types
export type {
  DreamMetric,
  DreamMetricData,
  DreamMetricsSettings,
  SelectionMode
} from './core';

export {
  DEFAULT_METRICS
} from './core';

// Logging types
export type {
  LogLevel,
  LoggingSettings
} from './logging';

export {
  LogLevelValue,
  DEFAULT_LOGGING
} from './logging';

// Callout types
export type {
  CalloutMetadata,
  CalloutMetadataArray
} from './callout-types';

// Journal Structure Check types (formerly Linting)
export type {
  JournalStructureSettings,
  JournalStructureRule,
  CalloutStructure,
  JournalTemplate,
  ContentIsolationSettings,
  ValidationResult,
  QuickFix,
  CalloutBlock,
  MetricEntry,
  TemplaterVariable,
  TestResult
} from './journal-check';

export {
  DEFAULT_JOURNAL_STRUCTURE_SETTINGS
} from './journal-check';

// Import for re-export as legacy alias
import type { JournalStructureSettings } from './journal-check';

// Legacy type aliases for backward compatibility
export type LintingSettings = JournalStructureSettings;

// Placeholder interfaces for legacy code
export interface Timeline {}
export interface CalendarView {}

// ActiveJournal interface for backward compatibility
export interface ActiveJournal {
  id?: string;
  path?: string;
  content?: string;
  date?: Date;
  title?: string;
}

/**
 * @deprecated Use type imports from './types' instead of from the root types.ts.
 * This will be removed in a future version.
 */
export const TYPES_DEPRECATION_NOTICE =
  "Warning: Importing from root-level types.ts is deprecated. " +
  "Import from src/types instead."; 
/**
 * @deprecated This file is being phased out. Import types from types/index.ts instead.
 * Example: import { DreamMetric, LogLevel } from './types';
 */

// Re-export all types from the new location
export * from './types/index';

// Log deprecation warning
console.warn(
  "DEPRECATION WARNING: Importing from src/types.ts is deprecated. " +
  "Import from src/types/ instead. This file will be removed in a future version."
);

import { LintingSettings } from './journal_check/types';

export interface DreamMetricData {
    date: string;
    title: string;
    content: string;
    source: string;
    wordCount: number;
    metrics: Record<string, number>;
    calloutMetadata?: {
        type: string;
        id?: string;
    };
}

export interface DreamMetricsSettings {
    projectNotePath: string;
    metrics: Record<string, DreamMetric>;
    selectedNotes: string[];
    folderOptions: {
        enabled: boolean;
        path: string;
    };
    selectionMode: 'manual' | 'automatic';
    calloutName: string;
    backup: {
        enabled: boolean;
        maxBackups: number;
    };
    logging: {
        level: LogLevel;
        maxSize?: number;
        maxBackups?: number;
    };
    linting: LintingSettings;
}

export interface DreamMetric {
    name: string;
    icon: string;
    minValue: number;
    maxValue: number;
    description?: string;
}

export interface LoggingSettings {
    level: LogLevel;
    maxSize?: number;
    maxBackups?: number;
}

export type LogLevel = 'off' | 'error' | 'warn' | 'info' | 'debug'; 
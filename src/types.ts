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
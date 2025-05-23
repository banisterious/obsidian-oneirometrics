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
    id?: string;
    path?: string;
    tags?: string[];
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
    _stateStorage?: Record<string, any>; // For storing arbitrary state data
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

// Temporary interfaces to fix build errors
export interface Timeline {
    // Placeholder interface to fix build errors
}

export interface CalendarView {
    // Placeholder interface to fix build errors
}

export interface ActiveJournal {
    // Placeholder interface to fix build errors
} 
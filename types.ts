import { LintingSettings } from './src/journal_check/types';

export type LogLevel = 'off' | 'errors' | 'warn' | 'info' | 'debug' | 'trace';

export interface DreamMetric {
    name: string;
    icon: string;
    range: {
        min: number;
        max: number;
    };
    description: string;
    enabled: boolean;
    type: string;
    category: string;
    format: string;
    options: string[];
    min: number;
    max: number;
    step: number;
}

export interface DreamMetricsSettings {
    projectNote: string;
    showRibbonButtons: boolean;
    metrics: Record<string, DreamMetric>;
    selectedNotes: string[];
    calloutName: string;
    selectionMode: 'notes' | 'folder';
    selectedFolder: string;
    expandedStates: Record<string, boolean>;
    backupEnabled: boolean;
    backupFolderPath: string;
    _persistentExclusions: Record<string, boolean>;
    logging: {
        level: LogLevel;
        maxLogSize: number;
        maxBackups: number;
    };
    linting?: LintingSettings;
}

export interface DreamMetricData {
    date: string;
    title: string;
    content: string;
    source: {
        file: string;
        id: string;
    };
    metrics: { [key: string]: number | string };
    calloutMetadata?: string[];
}

export const DEFAULT_METRICS: DreamMetric[] = [
    {
        name: "Sensory Detail",
        description: "Level of sensory information recalled from the dream",
        type: "number",
        category: "dream",
        format: "number",
        enabled: true,
        icon: "eye",
        range: { min: 1, max: 5 },
        options: [],
        min: 1,
        max: 5,
        step: 1
    },
    {
        name: "Emotional Recall",
        description: "Level of emotional detail recalled from the dream",
        type: "number",
        category: "dream",
        format: "number",
        enabled: true,
        icon: "heart",
        range: { min: 1, max: 5 },
        options: [],
        min: 1,
        max: 5,
        step: 1
    },
    {
        name: "Lost Segments",
        description: "Number of distinct instances where parts of the dream are missing or forgotten",
        type: "number",
        category: "dream",
        format: "number",
        enabled: true,
        icon: "circle-minus",
        range: { min: 0, max: 10 },
        options: [],
        min: 0,
        max: 10,
        step: 1
    },
    {
        name: "Descriptiveness",
        description: "Level of detail in the dream description",
        type: "number",
        category: "dream",
        format: "number",
        enabled: true,
        icon: "pen-tool",
        range: { min: 1, max: 5 },
        options: [],
        min: 1,
        max: 5,
        step: 1
    },
    {
        name: "Confidence Score",
        description: "Confidence level in the completeness of dream recall",
        type: "number",
        category: "dream",
        format: "number",
        enabled: true,
        icon: "check-circle",
        range: { min: 1, max: 5 },
        options: [],
        min: 1,
        max: 5,
        step: 1
    },
    {
        name: "Characters Role",
        description: "Significance of familiar characters in the dream narrative",
        type: "number",
        category: "character",
        format: "number",
        enabled: true,
        icon: "user-cog",
        range: { min: 1, max: 5 },
        options: [],
        min: 1,
        max: 5,
        step: 1
    },
    {
        name: "Characters Count",
        description: "Total number of characters in the dream",
        type: "number",
        category: "character",
        format: "number",
        enabled: false,
        icon: "users",
        range: { min: 0, max: 20 },
        options: [],
        min: 0,
        max: 20,
        step: 1
    },
    {
        name: "Familiar Count",
        description: "Number of familiar characters in the dream",
        type: "number",
        category: "character",
        format: "number",
        enabled: false,
        icon: "user-check",
        range: { min: 0, max: 20 },
        options: [],
        min: 0,
        max: 20,
        step: 1
    },
    {
        name: "Unfamiliar Count",
        description: "Number of unfamiliar characters in the dream",
        type: "number",
        category: "character",
        format: "number",
        enabled: false,
        icon: "user-x",
        range: { min: 0, max: 20 },
        options: [],
        min: 0,
        max: 20,
        step: 1
    },
    {
        name: "Characters List",
        description: "List of all characters that appeared in the dream",
        type: "string",
        category: "character",
        format: "string",
        enabled: false,
        icon: "users-round",
        range: { min: 0, max: 0 },
        options: [],
        min: 0,
        max: 0,
        step: 1
    },
    {
        name: "Dream Theme",
        description: "Dominant themes or subjects in the dream",
        type: "string",
        category: "theme",
        format: "string",
        enabled: false,
        icon: "sparkles",
        range: { min: 0, max: 0 },
        options: [],
        min: 0,
        max: 0,
        step: 1
    },
    {
        name: "Lucidity Level",
        description: "Level of awareness that you are dreaming",
        type: "number",
        category: "dream",
        format: "number",
        enabled: false,
        icon: "wand-2",
        range: { min: 1, max: 5 },
        options: [],
        min: 1,
        max: 5,
        step: 1
    },
    {
        name: "Dream Coherence",
        description: "How well-connected and logical the dream narrative is",
        type: "number",
        category: "dream",
        format: "number",
        enabled: false,
        icon: "link",
        range: { min: 1, max: 5 },
        options: [],
        min: 1,
        max: 5,
        step: 1
    },
    {
        name: "Setting Familiarity",
        description: "How familiar the dream setting is to you",
        type: "number",
        category: "dream",
        format: "number",
        enabled: false,
        icon: "glasses",
        range: { min: 1, max: 5 },
        options: [],
        min: 1,
        max: 5,
        step: 1
    },
    {
        name: "Ease of Recall",
        description: "How easily the dream came to mind upon waking",
        type: "number",
        category: "dream",
        format: "number",
        enabled: false,
        icon: "zap",
        range: { min: 1, max: 5 },
        options: [],
        min: 1,
        max: 5,
        step: 1
    },
    {
        name: "Recall Stability",
        description: "How well the dream memory has held up over time",
        type: "number",
        category: "dream",
        format: "number",
        enabled: false,
        icon: "layers",
        range: { min: 1, max: 5 },
        options: [],
        min: 1,
        max: 5,
        step: 1
    }
];
console.log('[OneiroMetrics] DEFAULT_METRICS at definition:', DEFAULT_METRICS.map(m => `${m.name}: ${m.enabled}`));

export const DEFAULT_LOGGING = {
    level: 'off' as LogLevel,
    maxLogSize: 5 * 1024 * 1024, // 5MB
    maxBackups: 5
}; 
export interface DreamMetric {
    name: string;
    range: {
        min: number;
        max: number;
    };
    description: string;
    icon?: string;  // Optional Lucide icon name
    enabled: boolean;  // Whether the metric is enabled by default
}

export type LogLevel = 'off' | 'errors' | 'debug';

export interface DreamMetricsSettings {
    projectNotePath: string;
    metrics: DreamMetric[];
    selectedNotes: string[];
    calloutName: string;
    backupEnabled: boolean;
    backupFolderPath: string;
    weekStartDay: number; // 0 = Sunday, 1 = Monday
    readableLineLengthOverride: boolean; // true = full width, false = Obsidian default
    defaultCalloutMetadata?: string;
    // Flexible Note/Folder Selection
    selectionMode?: "notes" | "folder"; // 'notes' (default) or 'folder'
    selectedFolder?: string; // path to selected folder if in folder mode
    // Persistent file exclusions per folder
    _persistentExclusions?: { [folderPath: string]: string[] };
    // Enabled metrics configuration
    enabledMetrics: { [metricName: string]: boolean };
    expandedStates?: string[]; // Array of content IDs that are expanded
    logging: {
        level: LogLevel;
        maxLogSize: number;  // in bytes
        maxBackups: number;
    };
}

// Default logging configuration
export const DEFAULT_LOGGING = {
    level: 'off' as LogLevel,
    maxLogSize: 10000,
    maxBackups: 5
};

export interface DreamMetricData {
    date: string;
    title: string;
    content: string;
    source: {
        file: string;
        id: string;
    };
    metrics: {
        [key: string]: number;
    };
    calloutMetadata?: string[];
}

export const DEFAULT_METRICS: DreamMetric[] = [
    {
        name: "Sensory Detail",
        range: { min: 1, max: 5 },
        description: "Level of sensory information recalled from the dream",
        icon: "eye",
        enabled: true
    },
    {
        name: "Emotional Recall",
        range: { min: 1, max: 5 },
        description: "Level of emotional detail recalled from the dream",
        icon: "heart",
        enabled: true
    },
    {
        name: "Descriptiveness",
        range: { min: 1, max: 5 },
        description: "Level of detail in the dream description",
        icon: "pen-tool",
        enabled: true
    },
    {
        name: "Confidence Score",
        range: { min: 1, max: 5 },
        description: "Confidence level in the completeness of dream recall",
        icon: "check-circle",
        enabled: true
    },
    {
        name: "Characters Role",
        range: { min: 1, max: 5 },
        description: "Significance of familiar characters in the dream narrative",
        icon: "user-cog",
        enabled: true
    },
    {
        name: "Characters Count",
        range: { min: 0, max: 0 },
        description: "Total number of characters in the dream",
        icon: "users",
        enabled: false
    },
    {
        name: "Familiar Count",
        range: { min: 0, max: 0 },
        description: "Number of familiar characters in the dream",
        icon: "user-check",
        enabled: false
    },
    {
        name: "Unfamiliar Count",
        range: { min: 0, max: 0 },
        description: "Number of unfamiliar characters in the dream",
        icon: "user-x",
        enabled: false
    },
    {
        name: "Characters List",
        range: { min: 0, max: 0 },
        description: "List of all characters that appeared in the dream",
        icon: "users-round",
        enabled: false
    },
    {
        name: "Dream Theme",
        range: { min: 0, max: 0 },
        description: "Dominant themes or subjects in the dream",
        icon: "sparkles",
        enabled: false
    },
    {
        name: "Lucidity Level",
        range: { min: 1, max: 5 },
        description: "Level of awareness that you are dreaming",
        icon: "wand-2",
        enabled: false
    },
    {
        name: "Dream Coherence",
        range: { min: 1, max: 5 },
        description: "How well-connected and logical the dream narrative is",
        icon: "link",
        enabled: false
    },
    {
        name: "Setting Familiarity",
        range: { min: 1, max: 5 },
        description: "How familiar the dream setting is to you",
        icon: "glasses",
        enabled: false
    },
    {
        name: "Ease of Recall",
        range: { min: 1, max: 5 },
        description: "How easily the dream came to mind upon waking",
        icon: "zap",
        enabled: false
    },
    {
        name: "Recall Stability",
        range: { min: 1, max: 5 },
        description: "How well the dream memory has held up over time",
        icon: "layers",
        enabled: false
    }
]; 
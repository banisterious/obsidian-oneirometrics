export interface DreamMetric {
    name: string;
    range: {
        min: number;
        max: number;
    };
    description: string;
    icon?: string;  // Optional Lucide icon name
}

export interface DreamMetricsSettings {
    projectNotePath: string;
    metrics: DreamMetric[];
    selectedNotes: string[];
    calloutName: string;
    backupEnabled: boolean;
    backupFolderPath: string;
}

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
}

export const DEFAULT_METRICS: DreamMetric[] = [
    {
        name: "Sensory Detail",
        range: { min: 1, max: 5 },
        description: "Level of sensory information recalled from the dream",
        icon: "eye"
    },
    {
        name: "Emotional Recall",
        range: { min: 1, max: 5 },
        description: "Level of emotional detail recalled from the dream",
        icon: "heart"
    },
    {
        name: "Lost Segments",
        range: { min: 0, max: 10 },
        description: "Number of distinct instances where parts of the dream are missing or forgotten",
        icon: "circle-minus"
    },
    {
        name: "Descriptiveness",
        range: { min: 1, max: 5 },
        description: "Level of detail in the dream description",
        icon: "pen-tool"
    },
    {
        name: "Confidence Score",
        range: { min: 1, max: 5 },
        description: "Confidence level in the completeness of dream recall",
        icon: "check-circle"
    },
    {
        name: "Familiar People",
        range: { min: 1, max: 5 },
        description: "Presence and significance of people you know from your waking life in your dreams",
        icon: "users-round"
    }
]; 
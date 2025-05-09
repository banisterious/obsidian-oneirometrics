export interface DreamMetric {
    name: string;
    range: {
        min: number;
        max: number;
    };
    description: string;
}

export interface DreamMetricsSettings {
    projectNotePath: string;
    metrics: DreamMetric[];
    selectedNotes: string[];
    calloutName: string;
}

export interface DreamMetricData {
    date: string;
    title: string;
    metrics: {
        [key: string]: number;
    };
}

export const DEFAULT_METRICS: DreamMetric[] = [
    {
        name: "Sensory Detail",
        range: { min: 1, max: 5 },
        description: "Level of sensory information recalled from the dream"
    },
    {
        name: "Emotional Recall",
        range: { min: 1, max: 5 },
        description: "Level of emotional detail recalled from the dream"
    },
    {
        name: "Lost Segments",
        range: { min: 0, max: 10 },
        description: "Number of distinct instances where parts of the dream are missing or forgotten"
    },
    {
        name: "Descriptiveness",
        range: { min: 1, max: 5 },
        description: "Level of detail in the dream description"
    },
    {
        name: "Confidence Score",
        range: { min: 1, max: 5 },
        description: "Confidence level in the completeness of dream recall"
    }
]; 
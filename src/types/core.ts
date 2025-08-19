/**
 * Core types for the OneiroMetrics plugin
 * 
 * This file contains the main type definitions used throughout the plugin,
 * including interfaces for dream metrics, settings, and dream data.
 */

import { LogLevel } from './logging';
import { JournalStructureSettings } from './journal-check';
import { CalloutMetadata, CalloutMetadataArray } from './callout-types';

// Create a type alias for backward compatibility
type LintingSettings = JournalStructureSettings;

// Create a backward compatibility union type for selectionMode
export type SelectionMode = 'notes' | 'folder' | 'manual' | 'automatic';

/**
 * Maps between the different SelectionMode values for compatibility
 * 'notes' maps to 'manual' and 'folder' maps to 'automatic'
 * @param mode The selection mode to map
 * @returns The mapped selection mode
 */
export function mapSelectionMode(mode: SelectionMode): 'manual' | 'automatic' {
  if (mode === 'notes') return 'manual';
  if (mode === 'folder') return 'automatic';
  return mode as 'manual' | 'automatic';
}

/**
 * Maps legacy SelectionMode values to newer values
 * 'manual' maps to 'notes' and 'automatic' maps to 'folder'
 * @param mode The selection mode to map
 * @returns The mapped selection mode
 */
export function mapLegacySelectionMode(mode: SelectionMode): 'notes' | 'folder' {
  if (mode === 'manual') return 'notes';
  if (mode === 'automatic') return 'folder';
  return mode as 'notes' | 'folder';
}

/**
 * Interface representing metadata about a dream metric
 */
export interface DreamMetric {
    /** The display name of the metric */
    name: string;
    
    /** The Lucide icon identifier for the metric */
    icon: string;
    
    /** The minimum allowed value for this metric (not applicable for text metrics) */
    minValue?: number;
    
    /** The maximum allowed value for this metric (not applicable for text metrics) */
    maxValue?: number;
    
    /** Optional description of what the metric measures and how to score it */
    description?: string;
    
    /** Whether this metric is enabled/visible in UI components */
    enabled: boolean;
    
    /** The category this metric belongs to (dream, character, theme, etc.) */
    category?: string;
    
    /** The data type of the metric (number, string, etc.) */
    type?: string;
    
    /** The display format of the metric */
    format?: string;
    
    /** For list-type metrics, available options */
    options?: string[];
    
    /** 
     * @deprecated Legacy min/max range representation
     * Use minValue and maxValue instead
     */
    range?: { min: number, max: number };
    
    /** 
     * @deprecated Legacy min value
     * Use minValue instead 
     */
    min?: number;
    
    /** 
     * @deprecated Legacy max value
     * Use maxValue instead 
     */
    max?: number;
    
    /** 
     * @deprecated Legacy step value
     * Will be replaced with a more appropriate concept in future versions 
     */
    step?: number;
    
    /** Frontmatter property name for this metric */
    frontmatterProperty?: string;
}

/**
 * Interface representing a parsed dream entry with metrics
 */
export interface DreamMetricData {
    /** The date of the dream entry, in string format */
    date: string;
    
    /** The title of the dream entry */
    title: string;
    
    /** The full content of the dream entry */
    content: string;
    
    /** The source of this dream entry (file path or identifier) */
    source: string | {
        /** The file path containing this dream entry */
        file: string;
        
        /** Optional identifier for the dream entry */
        id?: string;
    };
    
    /** The word count of the dream content */
    wordCount?: number;
    
    /** Record of metrics extracted from the dream entry */
    metrics: Record<string, number | string | string[]>;
    
    /** Optional metadata from the callout containing the dream entry */
    calloutMetadata?: CalloutMetadata[] | CalloutMetadata;
}

/**
 * Date placement options for callouts
 */
export type DatePlacement = 'none' | 'header' | 'field' | 'frontmatter';

/**
 * Date handling configuration
 */
export interface DateHandlingConfig {
    /** Where to place dates in callouts */
    placement: DatePlacement;
    
    /** Date format for headers (when placement is 'header') */
    headerFormat?: string;
    
    /** Date format for fields (when placement is 'field') */
    fieldFormat?: string;
    
    /** Frontmatter property name for date (when placement is 'frontmatter') */
    frontmatterProperty?: string;
    
    /** Whether to include block references with dates */
    includeBlockReferences?: boolean;
    
    /** Block reference format (e.g., '^YYYYMMDD') */
    blockReferenceFormat?: string;
    
    /** Whether to store dream titles in frontmatter properties */
    dreamTitleInProperties?: boolean;
    
    /** Frontmatter property name for dream title */
    dreamTitleProperty?: string;
    
    /** Whether to parse plain text dream entries without callout structures */
    plainTextDreams?: boolean;
    
    /** Whether to parse callout-based dream entries */
    calloutBasedDreams?: boolean;
}

/**
 * Interface representing the plugin settings
 */
export interface DreamMetricsSettings {
    /** Path to the metrics project note */
    projectNote: string;
    
    /** @deprecated Use projectNote instead. Will be removed in a future version. */
    projectNotePath?: string;
    
    /** Record of configured metrics */
    metrics: Record<string, DreamMetric>;
    
    /** Unified metrics configuration for enhanced functionality */
    unifiedMetrics?: {
        /** Whether to enable auto-discovery of new metrics from content */
        autoDiscovery: boolean;
        
        /** Thresholds for metric visualization in calendar and charts */
        visualizationThresholds: {
            /** Low threshold (0.0-1.0) - below this shows as low intensity */
            low: number;
            /** Medium threshold (0.0-1.0) - between low and medium shows as medium intensity */
            medium: number;
            /** High threshold (0.0-1.0) - above medium shows as high intensity */
            high: number;
        };
        
        /** Preferred metrics for different visualization components */
        preferredMetrics: {
            /** Metrics to display in calendar view by default */
            calendar: string[];
            /** Metrics to display in chart heatmap by default */
            charts: string[];
            /** Metrics to display in table view by default */
            table: string[];
        };
        
        /** Settings for metric discovery behavior */
        discovery: {
            /** Whether to automatically enable newly discovered metrics */
            autoEnable: boolean;
            /** Categories to auto-discover (empty array = all categories) */
            categories: string[];
            /** Maximum number of metrics to auto-discover per session */
            maxNewMetrics: number;
        };
        
        /** Configuration version for migration purposes */
        configVersion: string;
    };
    
    /** List of selected note paths to include in processing */
    selectedNotes: string[];
    
    /** Path to selected folder */
    selectedFolder: string;
    
    /** List of notes to exclude when using folder selection mode */
    excludedNotes?: string[];
    
    /** List of subfolders to exclude when using folder selection mode */
    excludedSubfolders?: string[];
    
    /** Folder options for automatic processing */
    folderOptions?: {
        /** Whether folder mode is enabled */
        enabled: boolean;
        
        /** Path to the folder containing dream journals */
        path: string;
    };
    
    /** How notes are selected, either by picking individual notes or a folder */
    selectionMode: SelectionMode;
    
    /** Configuration for callout/block detection */
    calloutSettings?: {
        /** Name of the callout to search for */
        name: string;
        
        /** Whether to require specific callout for dream entries */
        required: boolean;
    };
    
    /** Callout name to identify dream entries */
    calloutName: string;
    
    /** Journal callout name (default: 'journal') */
    journalCalloutName?: string;
    
    /** Dream diary callout name (default: 'dream-diary') */
    dreamDiaryCalloutName?: string;
    
    /** Metrics callout name (default: 'dream-metrics') */
    metricsCalloutName?: string;
    
    /** Date handling configuration */
    dateHandling?: DateHandlingConfig;
    
    /** Whether to show all metrics on a single line in callout structures */
    singleLineMetrics?: boolean;
    
    /** Whether to show ribbon button in the sidebar */
    showRibbonButtons: boolean;
    
    /** @deprecated Use showRibbonButtons instead */
    showTestRibbonButton?: boolean;
    
    /** Whether backup functionality is enabled */
    backupEnabled: boolean;
    
    /** Path to the backup folder */
    backupFolderPath: string;
    
    /** Last applied filter value to persist filter selection between reloads */
    lastAppliedFilter?: string;
    
    /** Custom date range for filter persistence */
    customDateRange?: { start: string, end: string };
    
    /** Dashboard sort preferences */
    dashboardSort?: {
        /** Column to sort by */
        column: string;
        /** Sort direction */
        direction: 'asc' | 'desc';
    };
    
    /** Configuration for logging */
    logging: {
        /** Log level */
        level: LogLevel;
        
        /** Maximum log file size in bytes */
        maxSize?: number;
        
        /** Legacy property for backward compatibility */
        maxLogSize?: number;
        
        /** Maximum number of log backups to retain */
        maxBackups?: number;
        
        /** @deprecated Legacy log file path */
        logFilePath?: string;
    };
    
    /** Journal structure validation settings */
    journalStructure?: JournalStructureSettings;
    
    /** @deprecated Use journalStructure instead */
    linting?: LintingSettings;
    
    /** UI state for persisting UI configurations across sessions */
    uiState?: {
        /** Active tab in settings */
        activeTab?: string;
        
        /** Last used filter settings */
        lastFilter?: string;
        
        /** Custom date ranges */
        customRanges?: Record<string, {start: string, end: string}>;
        
        /** UI layout preferences */
        layout?: Record<string, any>;
    };
    
    /** Expanded states for content sections */
    expandedStates?: Record<string, boolean>;
    
    /** Frontmatter property support configuration */
    frontmatter?: {
        /** Whether frontmatter support is enabled */
        enabled: boolean;
        
        /** Individual metric configurations */
        metricConfigs: Array<{
            metricName: string;
            propertyName: string;
            format: 'single' | 'array';
            enabled: boolean;
            priority: number;
            autoDetectType?: boolean;
            coerceType?: boolean;
        }>;
        
        /** Default conflict resolution mode */
        conflictResolution: 'frontmatter' | 'callout' | 'newest' | 'manual';
        
        /** Whether to preserve callouts when syncing */
        preserveCallouts: boolean;
        
        /** Configuration version for migrations */
        configVersion: string;
    };
    
    /** Developer mode settings */
    developerMode?: {
        /** Whether developer mode is enabled */
        enabled: boolean;
        
        /** Show debug ribbon button */
        showDebugRibbon?: boolean;
        
        /** Whether to trace function calls */
        traceFunctionCalls?: boolean;
        
        /** Experimental features to enable */
        experimentalFeatures?: string[];
    };
    
    /** Version of the metrics format */
    metricsVersion?: string;
    
    /** Backup settings */
    backup?: {
        /** Whether to automatically backup before changes */
        enabled: boolean;
        
        /** Path to store backups */
        folderPath: string;
        
        /** Maximum number of backups to keep */
        maxBackups?: number;
        
        /** Frequency of automatic backups */
        frequency?: 'onEdit' | 'onSave' | 'daily' | 'hourly';
    };
    
    /** Test data settings */
    testDataFolder?: string;
    
    /** Template file to use for test data generation */
    testDataTemplate?: string;
    
    /** Performance testing settings */
    performanceTesting?: {
        /** Whether performance testing mode is enabled (disables normal file limits) */
        enabled: boolean;
        
        /** Maximum files to process in performance mode (0 = unlimited) */
        maxFiles: number;
        
        /** Show warnings when performance mode is active */
        showWarnings: boolean;
    };

    /** Whether the onboarding banner has been dismissed */
    onboardingDismissed?: boolean;
}

/**
 * Default metrics configuration
 */
export const DEFAULT_METRICS: DreamMetric[] = [
    {
        name: "Sensory Detail",
        description: "The richness and vividness of the sensory information you recall from your dream.",
        icon: "eye",
        minValue: 1,
        maxValue: 5,
        enabled: true,
        category: "dream",
        type: "number",
        format: "number"
    },
    {
        name: "Emotional Recall",
        description: "Focuses on your ability to remember and articulate the emotions you experienced within the dream.",
        icon: "heart",
        minValue: 1,
        maxValue: 5,
        enabled: true,
        category: "dream",
        type: "number",
        format: "number"
    },
    {
        name: "Lost Segments",
        description: "The number of distinct instances where you have a clear feeling or awareness that a part of the dream is missing or has been forgotten.",
        icon: "circle-off",
        minValue: 0,
        maxValue: 10,
        enabled: true,
        category: "dream",
        type: "number",
        format: "number"
    },
    {
        name: "Descriptiveness",
        description: "Assesses the level of detail and elaboration in your written dream capture, beyond just sensory details.",
        icon: "pen-tool",
        minValue: 1,
        maxValue: 5,
        enabled: true,
        category: "dream",
        type: "number",
        format: "number"
    },
    {
        name: "Character Roles",
        description: "The presence and significance of all individuals (both familiar and unfamiliar) appearing in your dream's narrative.",
        icon: "user-cog",
        minValue: 1,
        maxValue: 5,
        enabled: false,
        category: "dream",
        type: "number",
        format: "number"
    },
    {
        name: "Confidence Score",
        description: "Subjective metric reflecting your overall sense of how complete and accurate your dream recall feels immediately after waking.",
        icon: "check-circle",
        minValue: 1,
        maxValue: 5,
        enabled: true,
        category: "dream",
        type: "number",
        format: "number"
    },
    {
        name: "Characters Count",
        description: "Represents the total number of characters in your dream. (Automatically calculated as the sum of Familiar Count and Unfamiliar Count.)",
        icon: "users",
        minValue: 0,
        maxValue: 30,
        enabled: false,
        category: "characters",
        type: "number",
        format: "number"
    },
    {
        name: "Familiar Count",
        description: "The number of characters you know from your waking life that appear in the dream. Includes people, pets, or any other familiar beings.",
        icon: "user-check",
        minValue: 0,
        maxValue: 20,
        enabled: false,
        category: "characters",
        type: "number",
        format: "number"
    },
    {
        name: "Unfamiliar Count",
        description: "Tracks the number of characters you don't know from your waking life that appear in the dream. Includes strangers, fictional characters, or any other unfamiliar beings.",
        icon: "user-x",
        minValue: 0,
        maxValue: 20,
        enabled: false,
        category: "characters",
        type: "number",
        format: "number"
    },
    {
        name: "Characters List",
        description: "Allows you to list all characters that appeared in your dream.",
        icon: "users-round",
        minValue: 0,
        maxValue: 0,
        enabled: false,
        category: "characters",
        type: "string",
        format: "list"
    },
    {
        name: "Dream Themes",
        description: "The dominant subjects, ideas, or emotional undercurrents present in your dream.",
        icon: "sparkles",
        minValue: 0,
        maxValue: 0,
        enabled: false,
        category: "theme",
        type: "string",
        format: "tags"
    },
    {
        name: "Symbolic Content",
        description: "Note specific objects, figures, actions, or animals in the dream that felt meaningful or symbolic.",
        icon: "sparkles",
        minValue: 0,
        maxValue: 0,
        enabled: false,
        category: "dream",
        type: "string",
        format: "text"
    },
    {
        name: "Character Clarity/Familiarity",
        description: "The distinctness and recognizability of the individual characters (both familiar and unfamiliar) appearing in your dream.",
        icon: "glasses",
        minValue: 1,
        maxValue: 5,
        enabled: false,
        category: "characters",
        type: "number",
        format: "number"
    },
    {
        name: "Lucidity Level",
        description: "Tracks your degree of awareness that you are dreaming while the dream is in progress.",
        icon: "wand-2",
        minValue: 1,
        maxValue: 5,
        enabled: false,
        category: "dream",
        type: "number",
        format: "number"
    },
    {
        name: "Dream Coherence",
        description: "Assesses the logical consistency and narrative flow of your dream.",
        icon: "link",
        minValue: 1,
        maxValue: 5,
        enabled: false,
        category: "dream",
        type: "number",
        format: "number"
    },
    {
        name: "Environmental Familiarity",
        description: "Tracks the degree to which the locations and environments in your dream are recognizable from your waking life.",
        icon: "glasses",
        minValue: 1,
        maxValue: 5,
        enabled: false,
        category: "dream",
        type: "number",
        format: "number"
    },
    {
        name: "Time Distortion",
        description: "Rate how unusually time behaved in the dream's narrative.",
        icon: "clock",
        minValue: 1,
        maxValue: 5,
        enabled: false,
        category: "dream",
        type: "number",
        format: "number"
    },
    {
        name: "Ease of Recall",
        description: "Assesses how readily and effortlessly you can remember the dream upon waking.",
        icon: "zap",
        minValue: 1,
        maxValue: 5,
        enabled: false,
        category: "dream",
        type: "number",
        format: "number"
    },
    {
        name: "Recall Stability",
        description: "Assesses how well your memory of the dream holds up in the minutes immediately following waking.",
        icon: "layers",
        minValue: 1,
        maxValue: 5,
        enabled: false,
        category: "dream",
        type: "number",
        format: "number"
    }
];

/**
 * Returns a compatible selection mode value
 * This function converts between UI and internal representations of selection modes
 * @param mode The current selection mode
 * @param format The format to convert to: 'ui' (notes/folder) or 'internal' (manual/automatic)
 * @returns A compatible selection mode string
 */
export function getCompatibleSelectionMode(
    mode: string, 
    format: 'ui' | 'internal'
): string {
    if (format === 'ui') {
        if (mode === 'manual') return 'notes';
        if (mode === 'automatic') return 'folder';
        return mode;
    } else {
        if (mode === 'notes') return 'manual';
        if (mode === 'folder') return 'automatic';
        return mode;
    }
} 
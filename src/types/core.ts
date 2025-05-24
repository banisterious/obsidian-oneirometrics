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
    
    /** The minimum allowed value for this metric */
    minValue: number;
    
    /** The maximum allowed value for this metric */
    maxValue: number;
    
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
    metrics: Record<string, number | string>;
    
    /** Optional metadata from the callout containing the dream entry */
    calloutMetadata?: CalloutMetadata[] | CalloutMetadata;
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
    
    /** List of selected note paths to include in processing */
    selectedNotes: string[];
    
    /** Path to selected folder */
    selectedFolder: string;
    
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
    
    /** Whether to show ribbon buttons in the sidebar */
    showRibbonButtons: boolean;
    
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
    
    /** Linting settings (legacy or alternative name for journal structure) */
    linting?: LintingSettings;
    
    /** Backup settings */
    backupEnabled: boolean;
    
    /** Path to folder for storing backups */
    backupFolderPath: string;
    
    /** Version of the metrics system (for migrations) */
    metricsVersion?: string;
    
    /** Map of expanded UI states */
    expandedStates?: Record<string, boolean>;
    
    /** 
     * Whether to show the test ribbon button 
     * @deprecated Use showRibbonButtons instead
     */
    showTestRibbonButton?: boolean;
    
    /** 
     * UI state and presentation preferences
     */
    uiState?: {
        /** Last selected tab in settings */
        lastTab?: string;
        /** Custom CSS overrides */
        customCss?: string;
        /** Theme preferences */
        theme?: 'light' | 'dark' | 'system';
        /** Other UI state properties */
        [key: string]: any;
    };
    
    /**
     * Developer mode settings - only used in development
     */
    developerMode?: {
        /** Enable developer mode features */
        enabled?: boolean;
        /** Enable performance monitoring */
        performanceMonitoring?: boolean;
        /** Show debug info in UI */
        showDebugInfo?: boolean;
    };
}

/**
 * Default metrics configuration
 */
export const DEFAULT_METRICS: DreamMetric[] = [
    {
        name: "Sensory Detail",
        description: "Level of sensory information recalled from the dream",
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
        description: "Level of emotional detail recalled from the dream",
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
        description: "Number of distinct instances where parts of the dream are missing or forgotten",
        icon: "circle-off",
        minValue: 0,
        maxValue: 10,
        enabled: true,
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
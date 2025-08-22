/**
 * Type definitions for the Dream Taxonomy feature
 * 
 * Provides a hierarchical three-tier classification system for organizing dream themes:
 * - Clusters: Broad thematic domains (e.g., "Action & Agency", "Identity & Consciousness")
 * - Vectors: Specific aspects within clusters (e.g., "Mission & Strategy", "Transformation & Change")
 * - Themes: Individual dream elements (e.g., "Ambition", "Challenge", "Choice")
 */

/**
 * Represents a high-level thematic cluster in the dream taxonomy
 * Clusters are the broadest categorization level
 */
export interface TaxonomyCluster {
    /** Unique identifier for the cluster */
    id: string;
    
    /** Display name of the cluster */
    name: string;
    
    /** Optional description explaining the cluster's scope */
    description?: string;
    
    /** Color for visual representation (hex format) */
    color: string;
    
    /** Vectors contained within this cluster */
    vectors: TaxonomyVector[];
    
    /** Optional custom position for visualization layouts */
    position?: { x: number; y: number };
    
    /** Whether the cluster is expanded in the UI */
    isExpanded?: boolean;
    
    /** Custom metadata for extensibility */
    customMetadata?: Record<string, any>;
}

/**
 * Represents a subcategory within a cluster
 * Vectors group related themes within a broader cluster context
 */
export interface TaxonomyVector {
    /** Unique identifier for the vector */
    id: string;
    
    /** Display name of the vector */
    name: string;
    
    /** Optional description explaining the vector's focus */
    description?: string;
    
    /** Themes contained within this vector */
    themes: TaxonomyTheme[];
    
    /** Reference to parent cluster ID */
    parentClusterId: string;
    
    /** Optional icon for visual representation */
    icon?: string;
    
    /** Whether the vector is expanded in the UI */
    isExpanded?: boolean;
    
    /** Display order within the parent cluster */
    sortOrder?: number;
}

/**
 * Represents an individual dream theme or element
 * Themes are the most granular level of classification
 */
export interface TaxonomyTheme {
    /** Unique identifier for the theme */
    id: string;
    
    /** Display name of the theme */
    name: string;
    
    /** Alternative names or spellings for the theme */
    aliases?: string[];
    
    /** Vector IDs this theme belongs to (supports multi-vector assignment) */
    vectorIds: string[];
    
    /** Optional description or examples */
    description?: string;
    
    /** Usage count in dream entries */
    usageCount?: number;
    
    /** Last used date */
    lastUsed?: Date;
    
    /** Custom metadata for extensibility */
    customMetadata?: Record<string, any>;
}

/**
 * Complete taxonomy structure
 */
export interface DreamTaxonomy {
    /** Version of the taxonomy schema */
    version: string;
    
    /** All clusters in the taxonomy */
    clusters: TaxonomyCluster[];
    
    /** Timestamp of last modification */
    lastModified: Date;
    
    /** Source of the taxonomy (e.g., "default", "custom", "imported") */
    source: string;
    
    /** Optional metadata about the taxonomy */
    metadata?: {
        author?: string;
        description?: string;
        createdAt?: Date;
        totalThemes?: number;
        totalVectors?: number;
        totalClusters?: number;
    };
}

/**
 * Settings for the Dream Taxonomy feature
 */
export interface DreamTaxonomySettings {
    /** Whether to use custom taxonomy or default */
    useCustomTaxonomy: boolean;
    
    /** Path to custom taxonomy file */
    customTaxonomyPath?: string;
    
    /** Whether to show theme counts in the tree */
    showThemeCounts: boolean;
    
    /** Whether to show unused themes */
    showUnusedThemes: boolean;
    
    /** Default expansion state for clusters */
    defaultClusterExpanded: boolean;
    
    /** Default expansion state for vectors */
    defaultVectorExpanded: boolean;
    
    /** Whether to enable drag-and-drop editing */
    enableDragDrop: boolean;
    
    /** Whether to auto-save changes */
    autoSave: boolean;
    
    /** Auto-save delay in milliseconds */
    autoSaveDelay: number;
}

/**
 * Statistics for taxonomy usage
 */
export interface TaxonomyStats {
    totalClusters: number;
    totalVectors: number;
    totalThemes: number;
    uncategorizedThemes: number;
    mostUsedThemes: Array<{ themeId: string; count: number }>;
    leastUsedThemes: Array<{ themeId: string; count: number }>;
    clusterDistribution: Array<{ clusterId: string; themeCount: number }>;
}

/**
 * Events emitted by the taxonomy system
 */
export interface TaxonomyEvents {
    onTaxonomyChanged: (taxonomy: DreamTaxonomy) => void;
    onThemeSelected: (theme: TaxonomyTheme) => void;
    onThemeMoved: (theme: TaxonomyTheme, fromVector: string, toVector: string) => void;
    onClusterCreated: (cluster: TaxonomyCluster) => void;
    onVectorCreated: (vector: TaxonomyVector) => void;
    onThemeCreated: (theme: TaxonomyTheme) => void;
}
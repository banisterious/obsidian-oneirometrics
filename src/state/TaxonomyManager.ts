/**
 * TaxonomyManager - Service for managing Dream Taxonomy data persistence and operations
 * 
 * This service provides comprehensive CRUD operations, data persistence, migration support,
 * and validation for the Dream Taxonomy system. It follows the established state management
 * patterns of the OneiroMetrics plugin and integrates with the existing service registry.
 */

import { App, TFile, Notice } from 'obsidian';
import { 
    DreamTaxonomy, 
    TaxonomyCluster, 
    TaxonomyVector, 
    TaxonomyTheme,
    TaxonomyStats,
    DreamTaxonomySettings
} from '../types/taxonomy';
import { DreamMetricsSettings } from '../types/core';
import { getDefaultTaxonomy } from '../data/default-taxonomy';
import { SafeStateManager, StateValidator } from './SafeStateManager';
import { ServiceRegistry, SERVICE_NAMES } from './ServiceRegistry';
import { withErrorHandling } from '../utils/defensive-utils';
import safeLogger from '../logging/safe-logger';
import { EventBus } from '../events/EventBus';
import type DreamMetricsPlugin from '../../main';

/**
 * Taxonomy state interface
 */
interface TaxonomyState {
    /** Current taxonomy data */
    taxonomy: DreamTaxonomy;
    
    /** User customizations to the default taxonomy */
    customizations: {
        /** Custom themes added by user */
        customThemes: TaxonomyTheme[];
        
        /** Custom vectors added by user */
        customVectors: TaxonomyVector[];
        
        /** Custom clusters added by user */
        customClusters: TaxonomyCluster[];
        
        /** Theme reassignments (theme ID to new vector IDs) */
        themeReassignments: Record<string, string[]>;
        
        /** Deleted items (for migration tracking) */
        deletedItems: {
            themes: string[];
            vectors: string[];
            clusters: string[];
        };
    };
    
    /** Migration history */
    migrations: {
        /** Last migration version applied */
        lastVersion: string;
        
        /** Migration timestamps */
        history: Array<{
            version: string;
            timestamp: Date;
            success: boolean;
            details?: string;
        }>;
    };
    
    /** Usage statistics */
    usageStats: {
        /** Theme usage counts */
        themeUsage: Record<string, number>;
        
        /** Last update timestamp */
        lastUpdated: Date;
    };
}

/**
 * Options for TaxonomyManager initialization
 */
export interface TaxonomyManagerOptions {
    /** Obsidian app instance */
    app: App;
    
    /** Plugin instance */
    plugin: DreamMetricsPlugin;
    
    /** Plugin settings */
    settings: DreamMetricsSettings;
    
    /** Whether to enable debug logging */
    debugMode?: boolean;
}

/**
 * Service for managing Dream Taxonomy data
 */
export class TaxonomyManager {
    /** State manager for taxonomy data */
    private stateManager: SafeStateManager<TaxonomyState>;
    
    /** Event bus for notifications */
    private eventBus: EventBus;
    
    /** Cache for quick lookups */
    private cache: {
        themeById: Map<string, TaxonomyTheme>;
        vectorById: Map<string, TaxonomyVector>;
        clusterById: Map<string, TaxonomyCluster>;
        themesByVector: Map<string, TaxonomyTheme[]>;
        vectorsByCluster: Map<string, TaxonomyVector[]>;
        lastBuilt: number;
    } | null = null;

    /** Debounce timer for saving */
    private saveTimer: number | null = null;

    /** Save delay in milliseconds */
    private readonly SAVE_DELAY = 2000;
    
    constructor(private options: TaxonomyManagerOptions) {
        this.eventBus = EventBus.getInstance();
        
        // Initialize state manager with validators
        this.stateManager = new SafeStateManager<TaxonomyState>({
            initialState: this.createInitialState(),
            validators: this.createValidators(),
            enableTransactions: true,
            debugLogging: options.debugMode || false
        });
        
        // Register with service registry
        this.registerService();
        
        // Load saved state
        this.loadState();
        
        // Subscribe to state changes for auto-save
        this.stateManager.subscribe((state) => {
            this.debouncedSave();
            this.invalidateCache();
            this.eventBus.publish('taxonomy:changed', { taxonomy: state.taxonomy });
        });
    }
    
    /**
     * Register this service with the service registry
     */
    private registerService(): void {
        const registry = ServiceRegistry.getInstance();
        registry.register('taxonomyManager', this);
        safeLogger.debug('TaxonomyManager', 'Registered with service registry');
    }
    
    /**
     * Create initial state
     */
    private createInitialState(): TaxonomyState {
        const defaultTaxonomy = getDefaultTaxonomy();
        
        return {
            taxonomy: defaultTaxonomy,
            customizations: {
                customThemes: [],
                customVectors: [],
                customClusters: [],
                themeReassignments: {},
                deletedItems: {
                    themes: [],
                    vectors: [],
                    clusters: []
                }
            },
            migrations: {
                lastVersion: '1.0.0',
                history: []
            },
            usageStats: {
                themeUsage: {},
                lastUpdated: new Date()
            }
        };
    }
    
    /**
     * Create state validators
     */
    private createValidators(): StateValidator<TaxonomyState>[] {
        return [
            {
                id: 'taxonomy-structure',
                validate: (state) => {
                    // Ensure taxonomy has required structure
                    return state.taxonomy &&
                           Array.isArray(state.taxonomy.clusters) &&
                           typeof state.taxonomy.version === 'string';
                },
                errorMessage: 'Invalid taxonomy structure',
                required: true
            },
            {
                id: 'unique-ids',
                validate: (state) => {
                    // Check for unique IDs across all entities
                    const allIds = new Set<string>();
                    
                    for (const cluster of state.taxonomy.clusters) {
                        if (allIds.has(cluster.id)) return false;
                        allIds.add(cluster.id);
                        
                        for (const vector of cluster.vectors) {
                            if (allIds.has(vector.id)) return false;
                            allIds.add(vector.id);
                            
                            for (const theme of vector.themes) {
                                if (allIds.has(theme.id)) return false;
                                allIds.add(theme.id);
                            }
                        }
                    }
                    
                    return true;
                },
                errorMessage: 'Duplicate IDs found in taxonomy',
                required: true
            },
            {
                id: 'referential-integrity',
                validate: (state) => {
                    // Check that all references are valid
                    const vectorIds = new Set<string>();
                    const clusterIds = new Set<string>();
                    
                    for (const cluster of state.taxonomy.clusters) {
                        clusterIds.add(cluster.id);
                        for (const vector of cluster.vectors) {
                            vectorIds.add(vector.id);
                        }
                    }
                    
                    // Check vector parent references
                    for (const cluster of state.taxonomy.clusters) {
                        for (const vector of cluster.vectors) {
                            if (vector.parentClusterId !== cluster.id) {
                                return false;
                            }
                        }
                    }
                    
                    // Check theme vector references
                    for (const cluster of state.taxonomy.clusters) {
                        for (const vector of cluster.vectors) {
                            for (const theme of vector.themes) {
                                for (const vectorId of theme.vectorIds) {
                                    if (!vectorIds.has(vectorId)) {
                                        return false;
                                    }
                                }
                            }
                        }
                    }
                    
                    return true;
                },
                errorMessage: 'Referential integrity violation in taxonomy',
                required: false
            }
        ];
    }
    
    /**
     * Load state from plugin settings
     */
    private loadState = withErrorHandling(
        (): void => {
            const settings = this.options.settings;
            
            // Check if taxonomy data exists in settings
            if (settings.dreamTaxonomy) {
                try {
                    const savedState = settings.dreamTaxonomy as any;
                    
                    // Validate and merge with current state
                    const mergedState = this.mergeWithDefault(savedState);
                    
                    // Apply migrations if needed
                    const migratedState = this.applyMigrations(mergedState);
                    
                    // Update state
                    this.stateManager.setState(migratedState);
                    
                    safeLogger.info('TaxonomyManager', 'Loaded taxonomy state from settings');
                } catch (error) {
                    safeLogger.error('TaxonomyManager', 'Error loading saved state', error);
                    // Keep default state on error
                }
            } else {
                safeLogger.debug('TaxonomyManager', 'No saved taxonomy state found, using defaults');
            }
        },
        {
            fallbackValue: undefined,
            errorMessage: 'Failed to load taxonomy state',
            onError: (error) => safeLogger.error('TaxonomyManager', 'Error loading state', error)
        }
    );
    
    /**
     * Save state to plugin settings
     */
    private saveState = withErrorHandling(
        async (): Promise<void> => {
            const state = this.stateManager.getState();
            const settings = this.options.settings;
            
            // Save to settings
            (settings as any).dreamTaxonomy = {
                ...state,
                lastSaved: new Date().toISOString()
            };
            
            // Save plugin settings
            await this.options.plugin.saveSettings();
            
            safeLogger.debug('TaxonomyManager', 'Saved taxonomy state to settings');
        },
        {
            fallbackValue: undefined,
            errorMessage: 'Failed to save taxonomy state',
            onError: (error) => safeLogger.error('TaxonomyManager', 'Error saving state', error)
        }
    );
    
    /**
     * Debounced save to prevent excessive writes
     */
    private debouncedSave(): void {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        
        this.saveTimer = setTimeout(() => {
            this.saveState();
            this.saveTimer = null;
        }, this.SAVE_DELAY);
    }
    
    /**
     * Merge saved state with default taxonomy
     */
    private mergeWithDefault(savedState: any): TaxonomyState {
        const defaultState = this.createInitialState();
        
        // Deep merge logic here
        // This ensures new default themes/vectors/clusters are added
        // while preserving user customizations
        
        return {
            ...defaultState,
            ...savedState,
            taxonomy: {
                ...defaultState.taxonomy,
                ...savedState.taxonomy,
                clusters: this.mergeClusters(
                    defaultState.taxonomy.clusters,
                    savedState.taxonomy?.clusters || []
                )
            }
        };
    }
    
    /**
     * Merge clusters preserving customizations
     */
    private mergeClusters(defaultClusters: TaxonomyCluster[], savedClusters: TaxonomyCluster[]): TaxonomyCluster[] {
        const clusterMap = new Map<string, TaxonomyCluster>();
        
        // Add default clusters
        for (const cluster of defaultClusters) {
            clusterMap.set(cluster.id, { ...cluster });
        }
        
        // Merge saved clusters
        for (const saved of savedClusters) {
            const existing = clusterMap.get(saved.id);
            if (existing) {
                // Merge vectors
                existing.vectors = this.mergeVectors(existing.vectors, saved.vectors);
                // Preserve user customizations
                existing.color = saved.color;
                existing.position = saved.position;
                existing.isExpanded = saved.isExpanded;
                existing.customMetadata = saved.customMetadata;
            } else {
                // Custom cluster
                clusterMap.set(saved.id, saved);
            }
        }
        
        return Array.from(clusterMap.values());
    }
    
    /**
     * Merge vectors preserving customizations
     */
    private mergeVectors(defaultVectors: TaxonomyVector[], savedVectors: TaxonomyVector[]): TaxonomyVector[] {
        const vectorMap = new Map<string, TaxonomyVector>();
        
        // Add default vectors
        for (const vector of defaultVectors) {
            vectorMap.set(vector.id, { ...vector });
        }
        
        // Merge saved vectors
        for (const saved of savedVectors) {
            const existing = vectorMap.get(saved.id);
            if (existing) {
                // Merge themes
                existing.themes = this.mergeThemes(existing.themes, saved.themes);
                // Preserve customizations
                existing.icon = saved.icon;
                existing.isExpanded = saved.isExpanded;
                existing.sortOrder = saved.sortOrder;
            } else {
                // Custom vector
                vectorMap.set(saved.id, saved);
            }
        }
        
        return Array.from(vectorMap.values());
    }
    
    /**
     * Merge themes preserving customizations
     */
    private mergeThemes(defaultThemes: TaxonomyTheme[], savedThemes: TaxonomyTheme[]): TaxonomyTheme[] {
        const themeMap = new Map<string, TaxonomyTheme>();
        
        // Add default themes
        for (const theme of defaultThemes) {
            themeMap.set(theme.id, { ...theme });
        }
        
        // Merge saved themes
        for (const saved of savedThemes) {
            const existing = themeMap.get(saved.id);
            if (existing) {
                // Preserve usage stats and customizations
                existing.usageCount = saved.usageCount;
                existing.lastUsed = saved.lastUsed;
                existing.aliases = saved.aliases;
                existing.customMetadata = saved.customMetadata;
                existing.vectorIds = saved.vectorIds; // Preserve reassignments
            } else {
                // Custom theme
                themeMap.set(saved.id, saved);
            }
        }
        
        return Array.from(themeMap.values());
    }
    
    /**
     * Apply any necessary migrations
     */
    private applyMigrations(state: TaxonomyState): TaxonomyState {
        const currentVersion = state.taxonomy.version;
        const lastMigration = state.migrations.lastVersion;
        
        // Check if migration is needed
        if (this.compareVersions(currentVersion, lastMigration) > 0) {
            safeLogger.info('TaxonomyManager', `Migrating from ${lastMigration} to ${currentVersion}`);
            
            // Apply migrations based on version
            // Add migration logic here as needed
            
            // Update migration history
            state.migrations.history.push({
                version: currentVersion,
                timestamp: new Date(),
                success: true
            });
            state.migrations.lastVersion = currentVersion;
        }
        
        return state;
    }
    
    /**
     * Compare version strings
     */
    private compareVersions(v1: string, v2: string): number {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        
        return 0;
    }
    
    /**
     * Invalidate the cache
     */
    private invalidateCache(): void {
        this.cache = null;
    }
    
    /**
     * Build or get the cache
     */
    private getCache() {
        if (!this.cache || Date.now() - this.cache.lastBuilt > 60000) {
            this.buildCache();
        }
        return this.cache!;
    }
    
    /**
     * Build the cache for quick lookups
     */
    private buildCache(): void {
        const state = this.stateManager.getState();
        const themeById = new Map<string, TaxonomyTheme>();
        const vectorById = new Map<string, TaxonomyVector>();
        const clusterById = new Map<string, TaxonomyCluster>();
        const themesByVector = new Map<string, TaxonomyTheme[]>();
        const vectorsByCluster = new Map<string, TaxonomyVector[]>();
        
        for (const cluster of state.taxonomy.clusters) {
            clusterById.set(cluster.id, cluster);
            vectorsByCluster.set(cluster.id, cluster.vectors);
            
            for (const vector of cluster.vectors) {
                vectorById.set(vector.id, vector);
                themesByVector.set(vector.id, vector.themes);
                
                for (const theme of vector.themes) {
                    themeById.set(theme.id, theme);
                }
            }
        }
        
        this.cache = {
            themeById,
            vectorById,
            clusterById,
            themesByVector,
            vectorsByCluster,
            lastBuilt: Date.now()
        };
    }
    
    // ========== PUBLIC API ==========
    
    /**
     * Get the current taxonomy
     */
    public getTaxonomy(): DreamTaxonomy {
        return this.stateManager.getState().taxonomy;
    }
    
    /**
     * Get a theme by ID
     */
    public getThemeById(themeId: string): TaxonomyTheme | null {
        const cache = this.getCache();
        return cache.themeById.get(themeId) || null;
    }
    
    /**
     * Get a vector by ID
     */
    public getVectorById(vectorId: string): TaxonomyVector | null {
        const cache = this.getCache();
        return cache.vectorById.get(vectorId) || null;
    }
    
    /**
     * Get a cluster by ID
     */
    public getClusterById(clusterId: string): TaxonomyCluster | null {
        const cache = this.getCache();
        return cache.clusterById.get(clusterId) || null;
    }
    
    /**
     * Search for themes by name or alias
     */
    public searchThemes(query: string): TaxonomyTheme[] {
        const cache = this.getCache();
        const lowerQuery = query.toLowerCase();
        const results: TaxonomyTheme[] = [];
        
        for (const theme of cache.themeById.values()) {
            if (theme.name.toLowerCase().includes(lowerQuery) ||
                theme.aliases?.some(alias => alias.toLowerCase().includes(lowerQuery))) {
                results.push(theme);
            }
        }
        
        return results;
    }
    
    /**
     * Add a custom theme
     */
    public addTheme = withErrorHandling(
        (name: string, vectorId: string, description?: string): TaxonomyTheme | null => {
            const transactionId = this.stateManager.beginTransaction().id;
            
            try {
                const state = this.stateManager.getState();
                const themeId = `theme_custom_${Date.now()}`;
                
                const newTheme: TaxonomyTheme = {
                    id: themeId,
                    name,
                    vectorIds: [vectorId],
                    description,
                    usageCount: 0
                };
                
                // Find the vector and add the theme
                let added = false;
                const updatedClusters = state.taxonomy.clusters.map(cluster => ({
                    ...cluster,
                    vectors: cluster.vectors.map(vector => {
                        if (vector.id === vectorId) {
                            added = true;
                            return {
                                ...vector,
                                themes: [...vector.themes, newTheme]
                            };
                        }
                        return vector;
                    })
                }));
                
                if (!added) {
                    this.stateManager.rollbackTransaction(transactionId);
                    return null;
                }
                
                // Update state
                this.stateManager.updateTransaction(transactionId, (current) => ({
                    ...current,
                    taxonomy: {
                        ...current.taxonomy,
                        clusters: updatedClusters
                    },
                    customizations: {
                        ...current.customizations,
                        customThemes: [...current.customizations.customThemes, newTheme]
                    }
                }));
                
                this.stateManager.commitTransaction(transactionId);
                
                this.eventBus.publish('taxonomy:theme-added', { theme: newTheme });
                
                return newTheme;
            } catch (error) {
                this.stateManager.rollbackTransaction(transactionId);
                throw error;
            }
        },
        {
            fallbackValue: null,
            errorMessage: 'Failed to add theme',
            onError: (error) => safeLogger.error('TaxonomyManager', 'Error adding theme', error)
        }
    );
    
    /**
     * Move a theme to a different vector
     */
    public moveTheme = withErrorHandling(
        (themeId: string, targetVectorId: string): boolean => {
            const transactionId = this.stateManager.beginTransaction().id;
            
            try {
                const state = this.stateManager.getState();
                let theme: TaxonomyTheme | null = null;
                let moved = false;
                
                // Find and remove theme from current vector(s)
                const updatedClusters = state.taxonomy.clusters.map(cluster => ({
                    ...cluster,
                    vectors: cluster.vectors.map(vector => {
                        const filteredThemes = vector.themes.filter(t => {
                            if (t.id === themeId) {
                                theme = t;
                                return false;
                            }
                            return true;
                        });
                        
                        // Add to target vector
                        if (vector.id === targetVectorId && theme) {
                            moved = true;
                            return {
                                ...vector,
                                themes: [...filteredThemes, { ...theme, vectorIds: [targetVectorId] }]
                            };
                        }
                        
                        return {
                            ...vector,
                            themes: filteredThemes
                        };
                    })
                }));
                
                if (!moved || !theme) {
                    this.stateManager.rollbackTransaction(transactionId);
                    return false;
                }
                
                // Update state
                this.stateManager.updateTransaction(transactionId, (current) => ({
                    ...current,
                    taxonomy: {
                        ...current.taxonomy,
                        clusters: updatedClusters
                    },
                    customizations: {
                        ...current.customizations,
                        themeReassignments: {
                            ...current.customizations.themeReassignments,
                            [themeId]: [targetVectorId]
                        }
                    }
                }));
                
                this.stateManager.commitTransaction(transactionId);
                
                this.eventBus.publish('taxonomy:theme-moved', {
                    theme,
                    targetVectorId
                });
                
                return true;
            } catch (error) {
                this.stateManager.rollbackTransaction(transactionId);
                throw error;
            }
        },
        {
            fallbackValue: false,
            errorMessage: 'Failed to move theme',
            onError: (error) => safeLogger.error('TaxonomyManager', 'Error moving theme', error)
        }
    );
    
    /**
     * Delete a custom theme
     */
    public deleteTheme = withErrorHandling(
        (themeId: string): boolean => {
            const transactionId = this.stateManager.beginTransaction().id;
            
            try {
                const state = this.stateManager.getState();
                
                // Check if it's a custom theme
                const isCustom = state.customizations.customThemes.some(t => t.id === themeId);
                if (!isCustom) {
                    safeLogger.warn('TaxonomyManager', 'Cannot delete default theme');
                    this.stateManager.rollbackTransaction(transactionId);
                    return false;
                }
                
                // Remove theme from all vectors
                const updatedClusters = state.taxonomy.clusters.map(cluster => ({
                    ...cluster,
                    vectors: cluster.vectors.map(vector => ({
                        ...vector,
                        themes: vector.themes.filter(t => t.id !== themeId)
                    }))
                }));
                
                // Update state
                this.stateManager.updateTransaction(transactionId, (current) => ({
                    ...current,
                    taxonomy: {
                        ...current.taxonomy,
                        clusters: updatedClusters
                    },
                    customizations: {
                        ...current.customizations,
                        customThemes: current.customizations.customThemes.filter(t => t.id !== themeId),
                        deletedItems: {
                            ...current.customizations.deletedItems,
                            themes: [...current.customizations.deletedItems.themes, themeId]
                        }
                    }
                }));
                
                this.stateManager.commitTransaction(transactionId);
                
                this.eventBus.publish('taxonomy:theme-deleted', { themeId });
                
                return true;
            } catch (error) {
                this.stateManager.rollbackTransaction(transactionId);
                throw error;
            }
        },
        {
            fallbackValue: false,
            errorMessage: 'Failed to delete theme',
            onError: (error) => safeLogger.error('TaxonomyManager', 'Error deleting theme', error)
        }
    );
    
    /**
     * Update theme usage statistics
     */
    public updateThemeUsage = withErrorHandling(
        (themeId: string, increment: number = 1): void => {
            const state = this.stateManager.getState();
            
            // Update usage count in taxonomy
            const updatedClusters = state.taxonomy.clusters.map(cluster => ({
                ...cluster,
                vectors: cluster.vectors.map(vector => ({
                    ...vector,
                    themes: vector.themes.map(theme => {
                        if (theme.id === themeId) {
                            return {
                                ...theme,
                                usageCount: (theme.usageCount || 0) + increment,
                                lastUsed: new Date()
                            };
                        }
                        return theme;
                    })
                }))
            }));
            
            // Update usage stats
            const updatedUsageStats = {
                ...state.usageStats,
                themeUsage: {
                    ...state.usageStats.themeUsage,
                    [themeId]: (state.usageStats.themeUsage[themeId] || 0) + increment
                },
                lastUpdated: new Date()
            };
            
            this.stateManager.updateState((current) => ({
                ...current,
                taxonomy: {
                    ...current.taxonomy,
                    clusters: updatedClusters
                },
                usageStats: updatedUsageStats
            }));
        },
        {
            fallbackValue: undefined,
            errorMessage: 'Failed to update theme usage',
            onError: (error) => safeLogger.error('TaxonomyManager', 'Error updating theme usage', error)
        }
    );
    
    /**
     * Get taxonomy statistics
     */
    public getStats(): TaxonomyStats {
        const state = this.stateManager.getState();
        const taxonomy = state.taxonomy;
        
        let totalThemes = 0;
        let totalVectors = 0;
        const clusterDistribution: Array<{ clusterId: string; themeCount: number }> = [];
        
        for (const cluster of taxonomy.clusters) {
            let clusterThemeCount = 0;
            totalVectors += cluster.vectors.length;
            
            for (const vector of cluster.vectors) {
                totalThemes += vector.themes.length;
                clusterThemeCount += vector.themes.length;
            }
            
            clusterDistribution.push({
                clusterId: cluster.id,
                themeCount: clusterThemeCount
            });
        }
        
        // Get most and least used themes
        const themeUsage = Object.entries(state.usageStats.themeUsage)
            .map(([themeId, count]) => ({ themeId, count }))
            .sort((a, b) => b.count - a.count);
        
        const mostUsedThemes = themeUsage.slice(0, 10);
        const leastUsedThemes = themeUsage.filter(t => t.count > 0).slice(-10).reverse();
        
        // Count uncategorized themes (custom themes not in default structure)
        const uncategorizedThemes = state.customizations.customThemes.length;
        
        return {
            totalClusters: taxonomy.clusters.length,
            totalVectors,
            totalThemes,
            uncategorizedThemes,
            mostUsedThemes,
            leastUsedThemes,
            clusterDistribution
        };
    }
    
    /**
     * Export taxonomy to JSON
     */
    public exportTaxonomy(): string {
        const state = this.stateManager.getState();
        return JSON.stringify({
            taxonomy: state.taxonomy,
            customizations: state.customizations,
            usageStats: state.usageStats,
            exportDate: new Date().toISOString(),
            version: state.taxonomy.version
        }, null, 2);
    }
    
    /**
     * Import taxonomy from JSON
     */
    public importTaxonomy = withErrorHandling(
        (jsonData: string): boolean => {
            try {
                const imported = JSON.parse(jsonData);
                
                if (!imported.taxonomy || !imported.version) {
                    throw new Error('Invalid taxonomy format');
                }
                
                // Validate the imported data
                const testState = {
                    ...this.stateManager.getState(),
                    taxonomy: imported.taxonomy,
                    customizations: imported.customizations || this.stateManager.getState().customizations
                };
                
                // Check validators
                const validators = this.createValidators();
                for (const validator of validators) {
                    if (!validator.validate(testState)) {
                        throw new Error(validator.errorMessage);
                    }
                }
                
                // Apply the import
                this.stateManager.setState(testState);
                
                new Notice('Taxonomy imported successfully');
                return true;
            } catch (error) {
                new Notice(`Failed to import taxonomy: ${error.message}`);
                return false;
            }
        },
        {
            fallbackValue: false,
            errorMessage: 'Failed to import taxonomy',
            onError: (error) => safeLogger.error('TaxonomyManager', 'Error importing taxonomy', error)
        }
    );
    
    /**
     * Reset to default taxonomy
     */
    public resetToDefault(): void {
        const defaultState = this.createInitialState();
        this.stateManager.setState(defaultState);
        new Notice('Taxonomy reset to defaults');
    }
    
    /**
     * Migrate existing flat themes to hierarchical structure
     */
    public migrateExistingThemes = withErrorHandling(
        async (existingThemes: string[]): Promise<void> => {
            const transactionId = this.stateManager.beginTransaction().id;
            
            try {
                safeLogger.info('TaxonomyManager', `Migrating ${existingThemes.length} existing themes`);
                
                // Group themes by potential categories
                const uncategorizedVector = 'vector_uncategorized';
                const uncategorizedCluster = 'cluster_uncategorized';
                
                // Create uncategorized cluster if it doesn't exist
                const state = this.stateManager.getState();
                let hasUncategorized = state.taxonomy.clusters.some(c => c.id === uncategorizedCluster);
                
                if (!hasUncategorized) {
                    const newCluster: TaxonomyCluster = {
                        id: uncategorizedCluster,
                        name: 'Uncategorized',
                        color: '#95a5a6',
                        description: 'Themes that need to be categorized',
                        vectors: [{
                            id: uncategorizedVector,
                            name: 'Uncategorized Themes',
                            parentClusterId: uncategorizedCluster,
                            themes: []
                        }]
                    };
                    
                    this.stateManager.updateTransaction(transactionId, (current) => ({
                        ...current,
                        taxonomy: {
                            ...current.taxonomy,
                            clusters: [...current.taxonomy.clusters, newCluster]
                        }
                    }));
                }
                
                // Add existing themes to uncategorized
                const newThemes: TaxonomyTheme[] = existingThemes.map(themeName => ({
                    id: `theme_migrated_${themeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                    name: themeName,
                    vectorIds: [uncategorizedVector],
                    usageCount: 0
                }));
                
                this.stateManager.updateTransaction(transactionId, (current) => {
                    const updatedClusters = current.taxonomy.clusters.map(cluster => {
                        if (cluster.id === uncategorizedCluster) {
                            return {
                                ...cluster,
                                vectors: cluster.vectors.map(vector => {
                                    if (vector.id === uncategorizedVector) {
                                        return {
                                            ...vector,
                                            themes: [...vector.themes, ...newThemes]
                                        };
                                    }
                                    return vector;
                                })
                            };
                        }
                        return cluster;
                    });
                    
                    return {
                        ...current,
                        taxonomy: {
                            ...current.taxonomy,
                            clusters: updatedClusters
                        },
                        migrations: {
                            ...current.migrations,
                            history: [
                                ...current.migrations.history,
                                {
                                    version: current.taxonomy.version,
                                    timestamp: new Date(),
                                    success: true,
                                    details: `Migrated ${existingThemes.length} themes`
                                }
                            ]
                        }
                    };
                });
                
                this.stateManager.commitTransaction(transactionId);
                
                new Notice(`Migrated ${existingThemes.length} themes to taxonomy`);
                safeLogger.info('TaxonomyManager', 'Theme migration completed');
            } catch (error) {
                this.stateManager.rollbackTransaction(transactionId);
                throw error;
            }
        },
        {
            fallbackValue: undefined,
            errorMessage: 'Failed to migrate themes',
            onError: (error) => {
                safeLogger.error('TaxonomyManager', 'Error migrating themes', error);
                new Notice('Failed to migrate themes. Check console for details.');
            }
        }
    );
    
    /**
     * Clean up resources
     */
    public cleanup(): void {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveState(); // Final save
        }
        
        this.stateManager.cleanup();
        this.invalidateCache();
        
        safeLogger.debug('TaxonomyManager', 'Cleaned up resources');
    }
}

/**
 * Factory function to create and register TaxonomyManager
 */
export function createTaxonomyManager(options: TaxonomyManagerOptions): TaxonomyManager {
    return new TaxonomyManager(options);
}

/**
 * Get TaxonomyManager from service registry
 */
export function getTaxonomyManager(): TaxonomyManager | null {
    const registry = ServiceRegistry.getInstance();
    return registry.get<TaxonomyManager>('taxonomyManager');
}
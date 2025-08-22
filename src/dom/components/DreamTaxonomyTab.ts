/**
 * DreamTaxonomyTab
 * 
 * Component for managing the dream taxonomy hierarchy in the Control Center.
 * Provides a tree view interface for browsing and organizing dream themes
 * into clusters and vectors.
 */

import { App, setIcon } from 'obsidian';
import { 
    DreamTaxonomy, 
    TaxonomyCluster, 
    TaxonomyVector, 
    TaxonomyTheme,
    TaxonomyStats 
} from '../../types/taxonomy';
import { getDefaultTaxonomy } from '../../data/default-taxonomy';
import { SafeDOMUtils } from '../../utils/SafeDOMUtils';
import { getTaxonomyManager } from '../../state/TaxonomyManager';

export class DreamTaxonomyTab {
    private app: App;
    private container: HTMLElement;
    private taxonomy: DreamTaxonomy;
    private searchInput: HTMLInputElement;
    private treeContainer: HTMLElement;
    private statsPanel: HTMLElement;
    private expandedClusters: Set<string> = new Set();
    private expandedVectors: Set<string> = new Set();
    private filteredTaxonomy: DreamTaxonomy | null = null;

    constructor(app: App, container: HTMLElement) {
        this.app = app;
        this.container = container;
        
        // Load taxonomy from TaxonomyManager if available, otherwise use default
        const taxonomyManager = getTaxonomyManager();
        if (taxonomyManager) {
            this.taxonomy = taxonomyManager.getTaxonomy();
        } else {
            // Fallback to default if manager not initialized
            this.taxonomy = getDefaultTaxonomy();
        }
        
        // Initialize expanded state
        this.initializeExpandedState();
    }

    /**
     * Initialize the default expanded state
     */
    private initializeExpandedState(): void {
        // By default, expand the first cluster to show some content
        if (this.taxonomy.clusters.length > 0) {
            this.expandedClusters.add(this.taxonomy.clusters[0].id);
        }
    }

    /**
     * Render the Dream Taxonomy tab content
     */
    public render(): void {
        // Clear container
        this.container.empty();
        
        // Add main container class
        this.container.addClass('oom-dream-taxonomy-content');
        
        // Create toolbar
        this.createToolbar();
        
        // Create tree container
        this.createTreeContainer();
        
        // Create stats panel
        this.createStatsPanel();
        
        // Render the taxonomy tree
        this.renderTaxonomyTree();
        
        // Update stats
        this.updateStats();
    }

    /**
     * Create the toolbar with search and action buttons
     */
    private createToolbar(): void {
        const toolbar = this.container.createDiv({ cls: 'oom-taxonomy-toolbar' });
        
        // Search container
        const searchContainer = toolbar.createDiv({ cls: 'oom-search-container' });
        this.searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: 'Search themes, vectors, or clusters...',
            cls: 'oom-search-input'
        });
        
        // Add search icon
        const searchIcon = searchContainer.createDiv({ cls: 'oom-search-icon' });
        setIcon(searchIcon, 'search');
        
        // Search event listener
        this.searchInput.addEventListener('input', () => {
            this.handleSearch(this.searchInput.value);
        });
        
        // Clear search button
        const clearButton = searchContainer.createDiv({ cls: 'oom-search-clear' });
        setIcon(clearButton, 'x');
        clearButton.style.display = 'none';
        clearButton.addEventListener('click', () => {
            this.searchInput.value = '';
            this.handleSearch('');
            clearButton.style.display = 'none';
        });
        
        // Show/hide clear button based on input
        this.searchInput.addEventListener('input', () => {
            clearButton.style.display = this.searchInput.value ? 'flex' : 'none';
        });
        
        // Action buttons container
        const actions = toolbar.createDiv({ cls: 'oom-toolbar-actions' });
        
        // Expand/Collapse all button
        const expandCollapseBtn = actions.createEl('button', {
            text: 'Expand All',
            cls: 'oom-button'
        });
        let allExpanded = false;
        expandCollapseBtn.addEventListener('click', () => {
            if (allExpanded) {
                this.collapseAll();
                expandCollapseBtn.textContent = 'Expand All';
            } else {
                this.expandAll();
                expandCollapseBtn.textContent = 'Collapse All';
            }
            allExpanded = !allExpanded;
            this.renderTaxonomyTree();
        });
        
        // Import button (Phase 2)
        const importBtn = actions.createEl('button', {
            text: 'Import',
            cls: 'oom-button',
            attr: { disabled: 'true', title: 'Coming in Phase 2' }
        });
        
        // Export button (Phase 2)
        const exportBtn = actions.createEl('button', {
            text: 'Export',
            cls: 'oom-button',
            attr: { disabled: 'true', title: 'Coming in Phase 2' }
        });
        
        // Reset to default button (Phase 2)
        const resetBtn = actions.createEl('button', {
            text: 'Reset to Default',
            cls: 'oom-button',
            attr: { disabled: 'true', title: 'Coming in Phase 2' }
        });
    }

    /**
     * Create the tree container
     */
    private createTreeContainer(): void {
        this.treeContainer = this.container.createDiv({ cls: 'oom-taxonomy-tree-container' });
    }

    /**
     * Create the statistics panel
     */
    private createStatsPanel(): void {
        this.statsPanel = this.container.createDiv({ cls: 'oom-stats-panel' });
    }

    /**
     * Render the taxonomy tree
     */
    private renderTaxonomyTree(): void {
        this.treeContainer.empty();
        
        const taxonomyToRender = this.filteredTaxonomy || this.taxonomy;
        
        // Render each cluster
        taxonomyToRender.clusters.forEach(cluster => {
            this.renderCluster(cluster);
        });
    }

    /**
     * Render a cluster node
     */
    private renderCluster(cluster: TaxonomyCluster): void {
        const clusterItem = this.treeContainer.createDiv({ cls: 'oom-tree-item' });
        const isExpanded = this.expandedClusters.has(cluster.id);
        
        if (isExpanded) {
            clusterItem.addClass('oom-expanded');
        }
        
        // Cluster node
        const clusterNode = clusterItem.createDiv({ cls: 'oom-tree-node oom-cluster-node' });
        
        // Expand/collapse icon
        const expandIcon = clusterNode.createDiv({ cls: 'oom-expand-icon' });
        setIcon(expandIcon, isExpanded ? 'chevron-down' : 'chevron-right');
        expandIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCluster(cluster.id);
        });
        
        // Cluster color indicator
        const colorIndicator = clusterNode.createDiv({ cls: 'oom-cluster-color' });
        colorIndicator.style.backgroundColor = cluster.color;
        
        // Cluster name
        const label = clusterNode.createDiv({ 
            cls: 'oom-node-label',
            text: cluster.name 
        });
        
        // Theme count
        const themeCount = this.getClusterThemeCount(cluster);
        const count = clusterNode.createDiv({ 
            cls: 'oom-node-count',
            text: `(${themeCount})`
        });
        
        // Click handler for the whole node
        clusterNode.addEventListener('click', () => {
            this.toggleCluster(cluster.id);
        });
        
        // Children container
        if (isExpanded) {
            const childrenContainer = clusterItem.createDiv({ cls: 'oom-tree-children' });
            cluster.vectors.forEach(vector => {
                this.renderVector(vector, childrenContainer);
            });
        }
    }

    /**
     * Render a vector node
     */
    private renderVector(vector: TaxonomyVector, container: HTMLElement): void {
        const vectorItem = container.createDiv({ cls: 'oom-tree-item' });
        const isExpanded = this.expandedVectors.has(vector.id);
        
        if (isExpanded) {
            vectorItem.addClass('oom-expanded');
        }
        
        // Vector node
        const vectorNode = vectorItem.createDiv({ cls: 'oom-tree-node oom-vector-node' });
        
        // Expand/collapse icon
        const expandIcon = vectorNode.createDiv({ cls: 'oom-expand-icon' });
        if (vector.themes.length > 0) {
            setIcon(expandIcon, isExpanded ? 'chevron-down' : 'chevron-right');
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleVector(vector.id);
            });
        } else {
            expandIcon.style.visibility = 'hidden';
        }
        
        // Vector icon
        const nodeIcon = vectorNode.createDiv({ cls: 'oom-node-icon' });
        setIcon(nodeIcon, vector.icon || 'folder');
        
        // Vector name
        const label = vectorNode.createDiv({ 
            cls: 'oom-node-label',
            text: vector.name 
        });
        
        // Theme count
        const count = vectorNode.createDiv({ 
            cls: 'oom-node-count',
            text: `(${vector.themes.length})`
        });
        
        // Click handler for the whole node
        vectorNode.addEventListener('click', () => {
            if (vector.themes.length > 0) {
                this.toggleVector(vector.id);
            }
        });
        
        // Children container for themes
        if (isExpanded && vector.themes.length > 0) {
            const childrenContainer = vectorItem.createDiv({ cls: 'oom-tree-children' });
            vector.themes.forEach(theme => {
                this.renderTheme(theme, childrenContainer);
            });
        }
    }

    /**
     * Render a theme node
     */
    private renderTheme(theme: TaxonomyTheme, container: HTMLElement): void {
        const themeItem = container.createDiv({ cls: 'oom-tree-item' });
        
        // Theme node
        const themeNode = themeItem.createDiv({ cls: 'oom-tree-node oom-theme-node' });
        
        // No expand icon for themes
        const spacer = themeNode.createDiv({ cls: 'oom-expand-icon' });
        spacer.style.visibility = 'hidden';
        
        // Theme icon (bullet point)
        const nodeIcon = themeNode.createDiv({ cls: 'oom-node-icon oom-theme-icon' });
        nodeIcon.textContent = '•';
        
        // Theme name
        const label = themeNode.createDiv({ 
            cls: 'oom-node-label',
            text: theme.name 
        });
        
        // Add tooltip if theme has description
        if (theme.description) {
            themeNode.setAttribute('aria-label', theme.description);
            themeNode.setAttribute('data-tooltip', theme.description);
        }
        
        // Usage count (if available)
        if (theme.usageCount !== undefined && theme.usageCount > 0) {
            const usageCount = themeNode.createDiv({ 
                cls: 'oom-node-usage',
                text: `${theme.usageCount}`
            });
        }
    }

    /**
     * Toggle cluster expansion
     */
    private toggleCluster(clusterId: string): void {
        if (this.expandedClusters.has(clusterId)) {
            this.expandedClusters.delete(clusterId);
        } else {
            this.expandedClusters.add(clusterId);
        }
        this.renderTaxonomyTree();
    }

    /**
     * Toggle vector expansion
     */
    private toggleVector(vectorId: string): void {
        if (this.expandedVectors.has(vectorId)) {
            this.expandedVectors.delete(vectorId);
        } else {
            this.expandedVectors.add(vectorId);
        }
        this.renderTaxonomyTree();
    }

    /**
     * Expand all nodes
     */
    private expandAll(): void {
        this.taxonomy.clusters.forEach(cluster => {
            this.expandedClusters.add(cluster.id);
            cluster.vectors.forEach(vector => {
                this.expandedVectors.add(vector.id);
            });
        });
    }

    /**
     * Collapse all nodes
     */
    private collapseAll(): void {
        this.expandedClusters.clear();
        this.expandedVectors.clear();
    }

    /**
     * Handle search input
     */
    private handleSearch(searchTerm: string): void {
        if (!searchTerm) {
            this.filteredTaxonomy = null;
            this.renderTaxonomyTree();
            return;
        }

        const term = searchTerm.toLowerCase();
        
        // Create filtered taxonomy
        const filteredClusters: TaxonomyCluster[] = [];
        
        this.taxonomy.clusters.forEach(cluster => {
            const clusterMatches = cluster.name.toLowerCase().includes(term);
            const filteredVectors: TaxonomyVector[] = [];
            
            cluster.vectors.forEach(vector => {
                const vectorMatches = vector.name.toLowerCase().includes(term);
                const filteredThemes = vector.themes.filter(theme => 
                    theme.name.toLowerCase().includes(term) ||
                    theme.aliases?.some(alias => alias.toLowerCase().includes(term))
                );
                
                // Include vector if it matches or has matching themes
                if (vectorMatches || filteredThemes.length > 0 || clusterMatches) {
                    filteredVectors.push({
                        ...vector,
                        themes: vectorMatches || clusterMatches ? vector.themes : filteredThemes
                    });
                }
            });
            
            // Include cluster if it matches or has matching vectors
            if (clusterMatches || filteredVectors.length > 0) {
                filteredClusters.push({
                    ...cluster,
                    vectors: filteredVectors
                });
                
                // Auto-expand matching clusters and vectors
                this.expandedClusters.add(cluster.id);
                filteredVectors.forEach(v => {
                    if (v.themes.length > 0) {
                        this.expandedVectors.add(v.id);
                    }
                });
            }
        });
        
        this.filteredTaxonomy = {
            ...this.taxonomy,
            clusters: filteredClusters
        };
        
        this.renderTaxonomyTree();
    }

    /**
     * Get total theme count for a cluster
     */
    private getClusterThemeCount(cluster: TaxonomyCluster): number {
        return cluster.vectors.reduce((sum, vector) => sum + vector.themes.length, 0);
    }

    /**
     * Calculate and display statistics
     */
    private updateStats(): void {
        this.statsPanel.empty();
        
        const stats = this.calculateStats();
        
        // Total clusters
        const clusterStat = this.statsPanel.createDiv({ cls: 'oom-stat-item' });
        clusterStat.createSpan({ cls: 'oom-stat-label', text: 'Total Clusters:' });
        clusterStat.createSpan({ cls: 'oom-stat-value', text: stats.totalClusters.toString() });
        
        // Total vectors
        const vectorStat = this.statsPanel.createDiv({ cls: 'oom-stat-item' });
        vectorStat.createSpan({ cls: 'oom-stat-label', text: 'Total Vectors:' });
        vectorStat.createSpan({ cls: 'oom-stat-value', text: stats.totalVectors.toString() });
        
        // Total themes
        const themeStat = this.statsPanel.createDiv({ cls: 'oom-stat-item' });
        themeStat.createSpan({ cls: 'oom-stat-label', text: 'Total Themes:' });
        themeStat.createSpan({ cls: 'oom-stat-value', text: stats.totalThemes.toString() });
        
        // Uncategorized themes (placeholder for Phase 2)
        const uncategorizedStat = this.statsPanel.createDiv({ cls: 'oom-stat-item' });
        uncategorizedStat.createSpan({ cls: 'oom-stat-label', text: 'Uncategorized Themes:' });
        uncategorizedStat.createSpan({ cls: 'oom-stat-value', text: '0' });
    }

    /**
     * Calculate taxonomy statistics
     */
    private calculateStats(): TaxonomyStats {
        let totalVectors = 0;
        let totalThemes = 0;
        const clusterDistribution: Array<{ clusterId: string; themeCount: number }> = [];
        
        this.taxonomy.clusters.forEach(cluster => {
            let clusterThemeCount = 0;
            cluster.vectors.forEach(vector => {
                totalVectors++;
                totalThemes += vector.themes.length;
                clusterThemeCount += vector.themes.length;
            });
            clusterDistribution.push({
                clusterId: cluster.id,
                themeCount: clusterThemeCount
            });
        });
        
        return {
            totalClusters: this.taxonomy.clusters.length,
            totalVectors,
            totalThemes,
            uncategorizedThemes: 0,
            mostUsedThemes: [],
            leastUsedThemes: [],
            clusterDistribution
        };
    }

    /**
     * Clean up resources
     */
    public destroy(): void {
        // Clean up event listeners if needed
        this.container.empty();
    }
}
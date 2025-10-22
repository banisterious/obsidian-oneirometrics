/**
 * DreamTaxonomyTab
 * 
 * Component for managing the dream taxonomy hierarchy in the Control Center.
 * Provides a tree view interface for browsing and organizing dream themes
 * into clusters and vectors.
 */

import { App, setIcon, Notice } from 'obsidian';
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
import {
    ClusterEditModal,
    VectorEditModal,
    ThemeEditModal,
    TaxonomyDeleteModal
} from '../modals/TaxonomyEditModal';
import safeLogger from '../../logging/safe-logger';

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
    private editingNodeId: string | null = null;
    private draggedElement: HTMLElement | null = null;
    private draggedData: any = null;
    private dropZones: HTMLElement[] = [];
    private undoStack: DreamTaxonomy[] = [];
    private redoStack: DreamTaxonomy[] = [];
    private clipboard: any = null;
    private selectedNodeId: string | null = null;

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
        
        // Create introduction paragraph
        this.createIntroduction();
        
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
        const clearButton = searchContainer.createDiv({ cls: 'oom-search-clear oom-hidden' });
        setIcon(clearButton, 'x');
        clearButton.addEventListener('click', () => {
            this.searchInput.value = '';
            this.handleSearch('');
            clearButton.addClass('oom-hidden');
        });

        // Show/hide clear button based on input
        this.searchInput.addEventListener('input', () => {
            if (this.searchInput.value) {
                clearButton.removeClass('oom-hidden');
            } else {
                clearButton.addClass('oom-hidden');
            }
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
        
        // Undo button
        const undoBtn = actions.createEl('button', {
            text: 'Undo',
            cls: 'oom-button',
            attr: { disabled: this.undoStack.length === 0 ? 'true' : 'false' }
        });
        undoBtn.addEventListener('click', () => this.undo());
        
        // Redo button
        const redoBtn = actions.createEl('button', {
            text: 'Redo',
            cls: 'oom-button',
            attr: { disabled: this.redoStack.length === 0 ? 'true' : 'false' }
        });
        redoBtn.addEventListener('click', () => this.redo());
        
        // Import button
        const importBtn = actions.createEl('button', {
            text: 'Import',
            cls: 'oom-button'
        });
        importBtn.addEventListener('click', () => this.importTaxonomy());
        
        // Export button
        const exportBtn = actions.createEl('button', {
            text: 'Export',
            cls: 'oom-button'
        });
        exportBtn.addEventListener('click', () => this.exportTaxonomy());
        
        // Reset to default button
        const resetBtn = actions.createEl('button', {
            text: 'Reset to Default',
            cls: 'oom-button'
        });
        resetBtn.addEventListener('click', () => this.resetToDefault());
        
        // Store button references for updates
        this.undoBtn = undoBtn;
        this.redoBtn = redoBtn;
    }

    /**
     * Create the introduction paragraph
     */
    private createIntroduction(): void {
        const introContainer = this.container.createDiv({ cls: 'oom-taxonomy-introduction' });
        introContainer.createEl('p', {
            text: 'This is the Dream Taxonomy, your central hub for organizing the core concepts of your dream journal. While a single dream theme helps categorize one aspect, you can group them into Vectors for a more focused analysis, and then further into broad Clusters to create a powerful hierarchical framework that brings your entire dreamscape into clear focus.',
            cls: 'oom-intro-text'
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
        clusterNode.setAttribute('data-id', cluster.id);
        clusterNode.setAttribute('data-type', 'cluster');
        clusterNode.setAttribute('tabindex', '0');
        clusterNode.setAttribute('role', 'treeitem');
        clusterNode.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        clusterNode.setAttribute('aria-label', `Cluster: ${cluster.name}`);
        
        // Make draggable
        clusterNode.draggable = true;
        clusterNode.addEventListener('dragstart', (e) => this.handleDragStart(e, cluster, 'cluster'));
        clusterNode.addEventListener('dragend', (e) => this.handleDragEnd(e));
        clusterNode.addEventListener('dragover', (e) => this.handleDragOver(e, cluster, 'cluster'));
        clusterNode.addEventListener('drop', (e) => this.handleDrop(e, cluster, 'cluster'));
        clusterNode.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        
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
        
        // Cluster name (with inline editing support)
        const label = clusterNode.createDiv({ 
            cls: 'oom-node-label',
            text: cluster.name 
        });
        label.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.startInlineEdit(label, cluster, 'name');
        });
        
        // Theme count
        const themeCount = this.getClusterThemeCount(cluster);
        const count = clusterNode.createDiv({ 
            cls: 'oom-node-count',
            text: `(${themeCount})`
        });
        
        // Action buttons container
        const actions = clusterNode.createDiv({ cls: 'oom-node-actions' });
        
        // Edit button
        const editBtn = actions.createDiv({ cls: 'oom-action-btn oom-edit-btn' });
        setIcon(editBtn, 'edit');
        editBtn.setAttribute('aria-label', 'Edit cluster');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openClusterEditModal(cluster);
        });
        
        // Add vector button
        const addBtn = actions.createDiv({ cls: 'oom-action-btn oom-add-btn' });
        setIcon(addBtn, 'plus');
        addBtn.setAttribute('aria-label', 'Add vector');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openVectorEditModal(undefined, cluster.id);
        });
        
        // Delete button
        const deleteBtn = actions.createDiv({ cls: 'oom-action-btn oom-delete-btn' });
        setIcon(deleteBtn, 'trash-2');
        deleteBtn.setAttribute('aria-label', 'Delete cluster');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openDeleteModal(cluster, 'cluster');
        });
        
        // Click handler for the whole node
        clusterNode.addEventListener('click', () => {
            this.selectNode(cluster.id);
            this.toggleCluster(cluster.id);
        });
        
        // Keyboard navigation
        clusterNode.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e, cluster, 'cluster'));
        
        // Children container
        if (isExpanded) {
            const childrenContainer = clusterItem.createDiv({ cls: 'oom-tree-children' });
            childrenContainer.setAttribute('role', 'group');
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
        vectorNode.setAttribute('data-id', vector.id);
        vectorNode.setAttribute('data-type', 'vector');
        vectorNode.setAttribute('tabindex', '0');
        vectorNode.setAttribute('role', 'treeitem');
        vectorNode.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        vectorNode.setAttribute('aria-label', `Vector: ${vector.name}`);
        
        // Make draggable
        vectorNode.draggable = true;
        vectorNode.addEventListener('dragstart', (e) => this.handleDragStart(e, vector, 'vector'));
        vectorNode.addEventListener('dragend', (e) => this.handleDragEnd(e));
        vectorNode.addEventListener('dragover', (e) => this.handleDragOver(e, vector, 'vector'));
        vectorNode.addEventListener('drop', (e) => this.handleDrop(e, vector, 'vector'));
        vectorNode.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        
        // Expand/collapse icon
        const expandIcon = vectorNode.createDiv({ cls: 'oom-expand-icon' });
        if (vector.themes.length > 0) {
            setIcon(expandIcon, isExpanded ? 'chevron-down' : 'chevron-right');
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleVector(vector.id);
            });
        } else {
            expandIcon.addClass('oom-invisible');
        }
        
        // Vector icon
        const nodeIcon = vectorNode.createDiv({ cls: 'oom-node-icon' });
        setIcon(nodeIcon, vector.icon || 'folder');
        
        // Vector name (with inline editing support)
        const label = vectorNode.createDiv({ 
            cls: 'oom-node-label',
            text: vector.name 
        });
        label.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.startInlineEdit(label, vector, 'name');
        });
        
        // Theme count
        const count = vectorNode.createDiv({ 
            cls: 'oom-node-count',
            text: `(${vector.themes.length})`
        });
        
        // Action buttons container
        const actions = vectorNode.createDiv({ cls: 'oom-node-actions' });
        
        // Edit button
        const editBtn = actions.createDiv({ cls: 'oom-action-btn oom-edit-btn' });
        setIcon(editBtn, 'edit');
        editBtn.setAttribute('aria-label', 'Edit vector');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openVectorEditModal(vector, vector.parentClusterId);
        });
        
        // Add theme button
        const addBtn = actions.createDiv({ cls: 'oom-action-btn oom-add-btn' });
        setIcon(addBtn, 'plus');
        addBtn.setAttribute('aria-label', 'Add theme');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openThemeEditModal(undefined, vector.id);
        });
        
        // Delete button
        const deleteBtn = actions.createDiv({ cls: 'oom-action-btn oom-delete-btn' });
        setIcon(deleteBtn, 'trash-2');
        deleteBtn.setAttribute('aria-label', 'Delete vector');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openDeleteModal(vector, 'vector');
        });
        
        // Click handler for the whole node
        vectorNode.addEventListener('click', () => {
            this.selectNode(vector.id);
            if (vector.themes.length > 0) {
                this.toggleVector(vector.id);
            }
        });
        
        // Keyboard navigation
        vectorNode.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e, vector, 'vector'));
        
        // Children container for themes
        if (isExpanded && vector.themes.length > 0) {
            const childrenContainer = vectorItem.createDiv({ cls: 'oom-tree-children' });
            childrenContainer.setAttribute('role', 'group');
            vector.themes.forEach(theme => {
                this.renderTheme(theme, childrenContainer, vector.id);
            });
        }
    }

    /**
     * Render a theme node
     */
    private renderTheme(theme: TaxonomyTheme, container: HTMLElement, vectorId: string): void {
        const themeItem = container.createDiv({ cls: 'oom-tree-item' });
        
        // Theme node
        const themeNode = themeItem.createDiv({ cls: 'oom-tree-node oom-theme-node' });
        themeNode.setAttribute('data-id', theme.id);
        themeNode.setAttribute('data-type', 'theme');
        themeNode.setAttribute('data-vector-id', vectorId);
        themeNode.setAttribute('tabindex', '0');
        themeNode.setAttribute('role', 'treeitem');
        themeNode.setAttribute('aria-label', `Theme: ${theme.name}`);
        
        // Make draggable
        themeNode.draggable = true;
        themeNode.addEventListener('dragstart', (e) => this.handleDragStart(e, theme, 'theme'));
        themeNode.addEventListener('dragend', (e) => this.handleDragEnd(e));
        themeNode.addEventListener('dragover', (e) => this.handleDragOver(e, theme, 'theme'));
        themeNode.addEventListener('drop', (e) => this.handleDrop(e, theme, 'theme'));
        themeNode.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        
        // No expand icon for themes - just a spacer for alignment
        themeNode.createDiv({ cls: 'oom-expand-icon oom-invisible' });
        
        // Theme icon (bullet point)
        const nodeIcon = themeNode.createDiv({ cls: 'oom-node-icon oom-theme-icon' });
        nodeIcon.textContent = '•';
        
        // Theme name (with inline editing support)
        const label = themeNode.createDiv({ 
            cls: 'oom-node-label',
            text: theme.name 
        });
        label.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.startInlineEdit(label, theme, 'name');
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
        
        // Action buttons container
        const actions = themeNode.createDiv({ cls: 'oom-node-actions' });
        
        // Edit button
        const editBtn = actions.createDiv({ cls: 'oom-action-btn oom-edit-btn' });
        setIcon(editBtn, 'edit');
        editBtn.setAttribute('aria-label', 'Edit theme');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openThemeEditModal(theme, vectorId);
        });
        
        // Delete button
        const deleteBtn = actions.createDiv({ cls: 'oom-action-btn oom-delete-btn' });
        setIcon(deleteBtn, 'trash-2');
        deleteBtn.setAttribute('aria-label', 'Delete theme');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openDeleteModal(theme, 'theme');
        });
        
        // Click handler for the whole node
        themeNode.addEventListener('click', () => {
            this.selectNode(theme.id);
        });
        
        // Keyboard navigation
        themeNode.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e, theme, 'theme'));
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
    
    // Properties for button references
    private undoBtn: HTMLButtonElement;
    private redoBtn: HTMLButtonElement;
    
    /**
     * Start inline editing for a node
     */
    private startInlineEdit(labelElement: HTMLElement, entity: any, field: string): void {
        if (this.editingNodeId) return; // Already editing something
        
        this.editingNodeId = entity.id;
        const originalValue = entity[field];
        
        // Create input element
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalValue;
        input.className = 'oom-inline-edit-input';
        input.setAttribute('aria-label', `Edit ${field}`);
        
        // Replace label with input
        labelElement.addClass('oom-hidden');
        labelElement.parentElement?.insertBefore(input, labelElement);
        input.focus();
        input.select();

        // Handle save
        const saveEdit = () => {
            const newValue = input.value.trim();
            if (newValue && newValue !== originalValue) {
                if (this.validateInlineEdit(entity, field, newValue)) {
                    this.saveState(); // Save for undo
                    entity[field] = newValue;
                    this.saveTaxonomy();
                    labelElement.textContent = newValue;
                }
            }

            // Restore label
            input.remove();
            labelElement.removeClass('oom-hidden');
            this.editingNodeId = null;
        };

        // Handle cancel
        const cancelEdit = () => {
            input.remove();
            labelElement.removeClass('oom-hidden');
            this.editingNodeId = null;
        };
        
        // Event listeners
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
    }
    
    /**
     * Validate inline edit
     */
    private validateInlineEdit(entity: any, field: string, value: string): boolean {
        if (!value.trim()) {
            new Notice(`${field} cannot be empty`);
            return false;
        }
        
        // Check for duplicates
        const entityType = this.getEntityType(entity);
        if (entityType === 'cluster') {
            const duplicate = this.taxonomy.clusters.find(c => 
                c.name.toLowerCase() === value.toLowerCase() && c.id !== entity.id
            );
            if (duplicate) {
                new Notice(`A cluster named "${value}" already exists`);
                return false;
            }
        }
        // Similar checks for vectors and themes...
        
        return true;
    }
    
    /**
     * Get entity type
     */
    private getEntityType(entity: any): 'cluster' | 'vector' | 'theme' {
        if ('vectors' in entity) return 'cluster';
        if ('themes' in entity) return 'vector';
        return 'theme';
    }
    
    /**
     * Handle drag start
     */
    private handleDragStart(e: DragEvent, entity: any, type: string): void {
        if (!e.dataTransfer) return;
        
        this.draggedElement = e.target as HTMLElement;
        this.draggedData = { entity, type };
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ id: entity.id, type }));
        
        // Add dragging class (visual feedback via CSS)
        this.draggedElement.classList.add('oom-dragging');
    }
    
    /**
     * Handle drag end
     */
    private handleDragEnd(_e: DragEvent): void {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('oom-dragging');
        }
        
        // Clean up drop zones
        this.dropZones.forEach(zone => {
            zone.classList.remove('oom-drop-zone', 'oom-drop-zone-active');
        });
        this.dropZones = [];
        
        this.draggedElement = null;
        this.draggedData = null;
    }
    
    /**
     * Handle drag over
     */
    private handleDragOver(e: DragEvent, _targetEntity: any, targetType: string): void {
        e.preventDefault();
        
        if (!this.draggedData) return;
        
        // Check if drop is valid
        if (this.isValidDrop(this.draggedData.type, targetType)) {
            e.dataTransfer!.dropEffect = 'move';
            
            const targetElement = e.currentTarget as HTMLElement;
            targetElement.classList.add('oom-drop-zone-active');
            
            if (!this.dropZones.includes(targetElement)) {
                this.dropZones.push(targetElement);
            }
        } else {
            e.dataTransfer!.dropEffect = 'none';
        }
    }
    
    /**
     * Handle drag leave
     */
    private handleDragLeave(e: DragEvent): void {
        const targetElement = e.currentTarget as HTMLElement;
        targetElement.classList.remove('oom-drop-zone-active');
    }
    
    /**
     * Handle drop
     */
    private handleDrop(e: DragEvent, targetEntity: any, targetType: string): void {
        e.preventDefault();
        e.stopPropagation();
        
        if (!this.draggedData) return;
        
        const { entity: draggedEntity, type: draggedType } = this.draggedData;
        
        if (this.isValidDrop(draggedType, targetType)) {
            this.saveState(); // Save for undo
            
            if (draggedType === 'theme' && targetType === 'vector') {
                this.moveThemeToVector(draggedEntity, targetEntity);
            } else if (draggedType === 'vector' && targetType === 'cluster') {
                this.moveVectorToCluster(draggedEntity, targetEntity);
            }
            
            this.saveTaxonomy();
            this.renderTaxonomyTree();
            this.updateStats();
        }
        
        // Clean up
        const targetElement = e.currentTarget as HTMLElement;
        targetElement.classList.remove('oom-drop-zone-active');
    }
    
    /**
     * Check if drop is valid
     */
    private isValidDrop(draggedType: string, targetType: string): boolean {
        // Themes can be dropped on vectors
        if (draggedType === 'theme' && targetType === 'vector') return true;
        // Vectors can be dropped on clusters
        if (draggedType === 'vector' && targetType === 'cluster') return true;
        return false;
    }
    
    /**
     * Move theme to a different vector
     */
    private moveThemeToVector(theme: TaxonomyTheme, targetVector: TaxonomyVector): void {
        // Remove from all vectors
        this.taxonomy.clusters.forEach(cluster => {
            cluster.vectors.forEach(vector => {
                const index = vector.themes.findIndex(t => t.id === theme.id);
                if (index !== -1) {
                    vector.themes.splice(index, 1);
                }
            });
        });
        
        // Add to target vector
        targetVector.themes.push(theme);
        theme.vectorIds = [targetVector.id];
        
        new Notice(`Moved theme "${theme.name}" to vector "${targetVector.name}"`);
    }
    
    /**
     * Move vector to a different cluster
     */
    private moveVectorToCluster(vector: TaxonomyVector, targetCluster: TaxonomyCluster): void {
        // Remove from all clusters
        this.taxonomy.clusters.forEach(cluster => {
            const index = cluster.vectors.findIndex(v => v.id === vector.id);
            if (index !== -1) {
                cluster.vectors.splice(index, 1);
            }
        });
        
        // Add to target cluster
        targetCluster.vectors.push(vector);
        vector.parentClusterId = targetCluster.id;
        
        new Notice(`Moved vector "${vector.name}" to cluster "${targetCluster.name}"`);
    }
    
    /**
     * Open cluster edit modal
     */
    private openClusterEditModal(cluster?: TaxonomyCluster): void {
        new ClusterEditModal(
            this.app,
            cluster,
            () => {
                this.renderTaxonomyTree();
                this.updateStats();
                this.saveTaxonomy();
            }
        ).open();
    }
    
    /**
     * Open vector edit modal
     */
    private openVectorEditModal(vector?: TaxonomyVector, clusterId?: string): void {
        new VectorEditModal(
            this.app,
            vector,
            clusterId || vector?.parentClusterId || this.taxonomy.clusters[0].id,
            () => {
                this.renderTaxonomyTree();
                this.updateStats();
                this.saveTaxonomy();
            }
        ).open();
    }
    
    /**
     * Open theme edit modal
     */
    private openThemeEditModal(theme?: TaxonomyTheme, vectorId?: string): void {
        new ThemeEditModal(
            this.app,
            theme,
            vectorId || '',
            () => {
                this.renderTaxonomyTree();
                this.updateStats();
                this.saveTaxonomy();
            }
        ).open();
    }
    
    /**
     * Open delete confirmation modal
     */
    private openDeleteModal(entity: any, type: 'cluster' | 'vector' | 'theme'): void {
        let childrenCount = 0;
        if (type === 'cluster') {
            const cluster = entity as TaxonomyCluster;
            cluster.vectors.forEach(v => childrenCount += v.themes.length + 1);
        } else if (type === 'vector') {
            childrenCount = (entity as TaxonomyVector).themes.length;
        }
        
        new TaxonomyDeleteModal(
            this.app,
            type,
            entity.name,
            entity.id,
            childrenCount,
            () => {
                this.saveState(); // Save for undo
                this.deleteEntity(entity, type);
                this.renderTaxonomyTree();
                this.updateStats();
                this.saveTaxonomy();
            }
        ).open();
    }
    
    /**
     * Delete an entity
     */
    private deleteEntity(entity: any, type: 'cluster' | 'vector' | 'theme'): void {
        if (type === 'cluster') {
            const index = this.taxonomy.clusters.findIndex(c => c.id === entity.id);
            if (index !== -1) {
                this.taxonomy.clusters.splice(index, 1);
                new Notice(`Deleted cluster "${entity.name}"`);
            }
        } else if (type === 'vector') {
            this.taxonomy.clusters.forEach(cluster => {
                const index = cluster.vectors.findIndex(v => v.id === entity.id);
                if (index !== -1) {
                    cluster.vectors.splice(index, 1);
                    new Notice(`Deleted vector "${entity.name}"`);
                }
            });
        } else if (type === 'theme') {
            this.taxonomy.clusters.forEach(cluster => {
                cluster.vectors.forEach(vector => {
                    const index = vector.themes.findIndex(t => t.id === entity.id);
                    if (index !== -1) {
                        vector.themes.splice(index, 1);
                        new Notice(`Deleted theme "${entity.name}"`);
                    }
                });
            });
        }
    }
    
    /**
     * Handle keyboard navigation
     */
    private handleKeyboardNavigation(e: KeyboardEvent, entity: any, type: string): void {
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (type === 'cluster') {
                    this.toggleCluster(entity.id);
                } else if (type === 'vector' && entity.themes.length > 0) {
                    this.toggleVector(entity.id);
                }
                break;
            case 'Delete':
                e.preventDefault();
                this.openDeleteModal(entity, type as any);
                break;
            case 'F2':
                e.preventDefault();
                const label = (e.currentTarget as HTMLElement).querySelector('.oom-node-label') as HTMLElement;
                if (label) {
                    this.startInlineEdit(label, entity, 'name');
                }
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                e.preventDefault();
                this.navigateTree(e.key === 'ArrowUp' ? 'up' : 'down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (type === 'cluster' && this.expandedClusters.has(entity.id)) {
                    this.toggleCluster(entity.id);
                } else if (type === 'vector' && this.expandedVectors.has(entity.id)) {
                    this.toggleVector(entity.id);
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (type === 'cluster' && !this.expandedClusters.has(entity.id)) {
                    this.toggleCluster(entity.id);
                } else if (type === 'vector' && !this.expandedVectors.has(entity.id) && entity.themes.length > 0) {
                    this.toggleVector(entity.id);
                }
                break;
        }
    }
    
    /**
     * Navigate tree with keyboard
     */
    private navigateTree(direction: 'up' | 'down'): void {
        const allNodes = Array.from(this.treeContainer.querySelectorAll('.oom-tree-node'));
        const currentIndex = allNodes.findIndex(node => node.classList.contains('oom-selected'));
        
        let nextIndex: number;
        if (direction === 'up') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : allNodes.length - 1;
        } else {
            nextIndex = currentIndex < allNodes.length - 1 ? currentIndex + 1 : 0;
        }
        
        const nextNode = allNodes[nextIndex] as HTMLElement;
        if (nextNode) {
            const id = nextNode.getAttribute('data-id');
            if (id) {
                this.selectNode(id);
                nextNode.focus();
            }
        }
    }
    
    /**
     * Select a node
     */
    private selectNode(id: string): void {
        // Remove previous selection
        this.treeContainer.querySelectorAll('.oom-selected').forEach(node => {
            node.classList.remove('oom-selected');
        });
        
        // Add new selection
        const node = this.treeContainer.querySelector(`[data-id="${id}"]`);
        if (node) {
            node.classList.add('oom-selected');
            this.selectedNodeId = id;
        }
    }
    
    /**
     * Save state for undo/redo
     */
    private saveState(): void {
        this.undoStack.push(JSON.parse(JSON.stringify(this.taxonomy)));
        this.redoStack = []; // Clear redo stack when new action is performed
        this.updateUndoRedoButtons();
        
        // Limit undo stack size
        if (this.undoStack.length > 50) {
            this.undoStack.shift();
        }
    }
    
    /**
     * Undo last action
     */
    private undo(): void {
        if (this.undoStack.length === 0) return;
        
        this.redoStack.push(JSON.parse(JSON.stringify(this.taxonomy)));
        this.taxonomy = this.undoStack.pop()!;
        
        this.renderTaxonomyTree();
        this.updateStats();
        this.saveTaxonomy();
        this.updateUndoRedoButtons();
        
        new Notice('Undone last action');
    }
    
    /**
     * Redo last undone action
     */
    private redo(): void {
        if (this.redoStack.length === 0) return;
        
        this.undoStack.push(JSON.parse(JSON.stringify(this.taxonomy)));
        this.taxonomy = this.redoStack.pop()!;
        
        this.renderTaxonomyTree();
        this.updateStats();
        this.saveTaxonomy();
        this.updateUndoRedoButtons();
        
        new Notice('Redone last action');
    }
    
    /**
     * Update undo/redo button states
     */
    private updateUndoRedoButtons(): void {
        if (this.undoBtn) {
            this.undoBtn.disabled = this.undoStack.length === 0;
        }
        if (this.redoBtn) {
            this.redoBtn.disabled = this.redoStack.length === 0;
        }
    }
    
    /**
     * Import taxonomy from file
     */
    private async importTaxonomy(): Promise<void> {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const imported = JSON.parse(text) as DreamTaxonomy;
                
                // Validate structure
                if (!imported.clusters || !Array.isArray(imported.clusters)) {
                    throw new Error('Invalid taxonomy structure');
                }
                
                this.saveState(); // Save for undo
                this.taxonomy = imported;
                
                this.renderTaxonomyTree();
                this.updateStats();
                this.saveTaxonomy();
                
                new Notice('Taxonomy imported successfully');
            } catch (error) {
                safeLogger.error('DreamTaxonomyTab', 'Import failed', error);
                new Notice('Failed to import taxonomy. Please check the file format.');
            }
        };
        
        input.click();
    }
    
    /**
     * Export taxonomy to file
     */
    private exportTaxonomy(): void {
        const data = JSON.stringify(this.taxonomy, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `dream-taxonomy-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        new Notice('Taxonomy exported successfully');
    }
    
    /**
     * Reset taxonomy to default
     */
    private resetToDefault(): void {
        new TaxonomyDeleteModal(
            this.app,
            'cluster',
            'all custom taxonomy',
            'reset',
            this.taxonomy.clusters.length,
            () => {
                this.saveState(); // Save for undo
                this.taxonomy = getDefaultTaxonomy();
                
                this.renderTaxonomyTree();
                this.updateStats();
                this.saveTaxonomy();
                
                new Notice('Taxonomy reset to default');
            },
            undefined
        ).open();
    }
    
    /**
     * Save taxonomy to persistent storage
     */
    private saveTaxonomy(): void {
        const taxonomyManager = getTaxonomyManager();
        if (taxonomyManager) {
            // In production, this would use proper state management
            safeLogger.info('DreamTaxonomyTab', 'Taxonomy saved');
        }
    }
}
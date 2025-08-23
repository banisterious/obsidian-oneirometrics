/**
 * OneirographView - Interactive force-directed graph visualization for dream data
 * 
 * This view creates a visual "galaxy" of dream entries organized by taxonomy clusters,
 * providing an intuitive way to explore relationships and patterns in dream data.
 */

import { ItemView, WorkspaceLeaf, ButtonComponent } from 'obsidian';
import * as d3 from 'd3';
import type DreamMetricsPlugin from '../../../main';
import { DreamMetricData } from '../../types/core';
import { TaxonomyCluster, TaxonomyVector, TaxonomyTheme } from '../../types/taxonomy';
import { ForceSimulation } from './ForceSimulation';
import { CanvasRenderer } from './CanvasRenderer';
import { OneirographInteractions } from './OneirographInteractions';
import safeLogger from '../../logging/safe-logger';

export const ONEIROGRAPH_VIEW_TYPE = 'oneirometrics-oneirograph';

/**
 * Node representation in the force simulation
 */
export interface OneirographNode extends d3.SimulationNodeDatum {
    id: string;
    type: 'dream' | 'cluster' | 'vector';
    data: DreamMetricData | TaxonomyCluster | TaxonomyVector;
    clusterId?: string;
    vectorIds?: string[];
    radius: number;
    color: string;
    label: string;
    date?: Date;
    themes?: string[];
    // D3 simulation properties (defined by d3.SimulationNodeDatum)
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
}

/**
 * Link representation between nodes
 */
export interface OneirographLink extends d3.SimulationLinkDatum<OneirographNode> {
    source: OneirographNode | string;
    target: OneirographNode | string;
    strength: number;
    type: 'cluster' | 'vector' | 'theme';
}

/**
 * View state for managing UI and data
 */
interface OneirographState {
    nodes: OneirographNode[];
    links: OneirographLink[];
    clusters: Map<string, TaxonomyCluster>;
    vectors: Map<string, TaxonomyVector>;
    themes: Map<string, TaxonomyTheme>;
    dreams: DreamMetricData[];
    selectedCluster: string | null;
    selectedNode: OneirographNode | null;
    zoomLevel: number;
    panPosition: { x: number; y: number };
    showLabels: boolean;
    showConnections: boolean;
    performanceMode: boolean;
    isLoading: boolean;
    // Phase 4: Expand/collapse state
    expandedClusters: Set<string>;
    expandedVectors: Set<string>;
    collapsedView: boolean; // true = start collapsed, false = show all
    // Phase 4: Dream content expansion
    selectedDream: DreamMetricData | null;
    // Phase 4: Search and filtering
    searchQuery: string;
    filteredNodeIds: Set<string>;
    activeFilters: {
        dateRange?: { start: Date; end: Date };
        themes?: string[];
        clusters?: string[];
        vectors?: string[];
    };
    dreamContentVisible: boolean;
}

/**
 * Main view class for the Oneirograph visualization
 */
export class OneirographView extends ItemView {
    private plugin: DreamMetricsPlugin;
    private state: OneirographState;
    public containerEl: HTMLElement;
    private canvasEl: HTMLCanvasElement;
    private overlayEl: HTMLElement;
    private controlsEl: HTMLElement;
    private activeFiltersContainer: HTMLElement | null = null;
    private searchPanel: HTMLElement | null = null;
    private searchPanelContent: HTMLElement | null = null;
    private searchToggleButton: ButtonComponent | null = null;
    private forceSimulation: ForceSimulation;
    private renderer: CanvasRenderer;
    private interactions: OneirographInteractions;
    private animationFrame: number | null = null;
    private resizeObserver: ResizeObserver | null = null;
    
    // Performance monitoring
    private frameCounter = 0;
    private lastFpsTime = 0;
    private currentFps = 0;
    
    constructor(leaf: WorkspaceLeaf, plugin: DreamMetricsPlugin) {
        super(leaf);
        this.plugin = plugin;
        
        // Initialize state
        this.state = {
            nodes: [],
            links: [],
            clusters: new Map(),
            vectors: new Map(),
            themes: new Map(),
            dreams: [],
            selectedCluster: null,
            selectedNode: null,
            zoomLevel: 1,
            panPosition: { x: 0, y: 0 },
            showLabels: true,
            showConnections: true,
            performanceMode: false,
            isLoading: true,
            // Phase 4: Expand/collapse state
            expandedClusters: new Set(),
            expandedVectors: new Set(),
            collapsedView: false, // Start in expanded mode to show all nodes by default
            // Phase 4: Dream content expansion
            selectedDream: null,
            dreamContentVisible: false,
            // Phase 4: Search and filtering
            searchQuery: '',
            filteredNodeIds: new Set(),
            activeFilters: {}
        };
    }
    
    getViewType(): string {
        return ONEIROGRAPH_VIEW_TYPE;
    }
    
    getDisplayText(): string {
        return 'Oneirograph';
    }
    
    getIcon(): string {
        return 'network';
    }
    
    async onOpen() {
        try {
            // Create main container
            this.containerEl = this.contentEl.createDiv({ cls: 'oom-oneirograph-container' });
            
            // Create loading indicator
            this.showLoading();
            
            // Create canvas for rendering
            this.createCanvas();
            
            // Create overlay for HTML elements
            this.createOverlay();
            
            // Create controls panel
            this.createControls();
            
            // Initialize components
            this.initializeComponents();
            
            // Load data
            await this.loadData();
            
            // Start rendering
            this.startRendering();
            
            // Setup resize observer
            this.setupResizeObserver();
            
            // Setup keyboard navigation
            this.setupKeyboardNavigation();
            
            safeLogger.info('Oneirograph', 'View opened successfully');
        } catch (error) {
            safeLogger.error('Oneirograph', 'Failed to open view', error);
            this.showError('Failed to initialize Oneirograph');
        }
    }
    
    async onClose() {
        try {
            // Stop animation
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            
            // Clean up resize observer
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
            
            // Clean up components
            if (this.forceSimulation) {
                this.forceSimulation.destroy();
            }
            
            if (this.interactions) {
                this.interactions.destroy();
            }
            
            // Clear DOM
            this.contentEl.empty();
            
            safeLogger.info('Oneirograph', 'View closed');
        } catch (error) {
            safeLogger.error('Oneirograph', 'Error closing view', error);
        }
    }
    
    /**
     * Create the main canvas element
     */
    private createCanvas() {
        const canvasContainer = this.containerEl.createDiv({ cls: 'oom-oneirograph-canvas-container' });
        this.canvasEl = canvasContainer.createEl('canvas', { cls: 'oom-oneirograph-canvas' });
        
        // Set canvas size
        this.updateCanvasSize();
        
        // Get context for rendering
        const ctx = this.canvasEl.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }
    }
    
    /**
     * Create overlay for HTML elements (tooltips, labels, etc.)
     */
    private createOverlay() {
        this.overlayEl = this.containerEl.createDiv({ cls: 'oom-oneirograph-overlay' });
    }
    
    /**
     * Create controls panel
     */
    private createControls() {
        this.controlsEl = this.containerEl.createDiv({ cls: 'oom-oneirograph-controls' });
        
        // Zoom controls
        const zoomContainer = this.controlsEl.createDiv({ cls: 'oom-oneirograph-zoom-controls' });
        
        new ButtonComponent(zoomContainer)
            .setIcon('zoom-in')
            .setTooltip('Zoom In')
            .onClick(() => this.zoomIn());
        
        new ButtonComponent(zoomContainer)
            .setIcon('zoom-out')
            .setTooltip('Zoom Out')
            .onClick(() => this.zoomOut());
        
        new ButtonComponent(zoomContainer)
            .setIcon('maximize-2')
            .setTooltip('Reset View')
            .onClick(() => this.resetView());
        
        // Display options
        const optionsContainer = this.controlsEl.createDiv({ cls: 'oom-oneirograph-options' });
        
        const labelsToggle = optionsContainer.createDiv({ cls: 'oom-oneirograph-option' });
        labelsToggle.createSpan({ text: 'Show Labels' });
        const labelsCheckbox = labelsToggle.createEl('input', { type: 'checkbox' });
        labelsCheckbox.checked = this.state.showLabels;
        labelsCheckbox.addEventListener('change', () => {
            this.state.showLabels = labelsCheckbox.checked;
            this.render();
        });
        
        const connectionsToggle = optionsContainer.createDiv({ cls: 'oom-oneirograph-option' });
        connectionsToggle.createSpan({ text: 'Show Connections' });
        const connectionsCheckbox = connectionsToggle.createEl('input', { type: 'checkbox' });
        connectionsCheckbox.checked = this.state.showConnections;
        connectionsCheckbox.addEventListener('change', () => {
            this.state.showConnections = connectionsCheckbox.checked;
            this.render();
        });
        
        // Phase 4: Collapsed view toggle
        const collapsedToggle = optionsContainer.createDiv({ cls: 'oom-oneirograph-option' });
        collapsedToggle.createSpan({ text: 'Collapsed View' });
        const collapsedCheckbox = collapsedToggle.createEl('input', { type: 'checkbox' });
        collapsedCheckbox.checked = this.state.collapsedView; // Will be false initially
        collapsedCheckbox.addEventListener('change', () => {
            this.state.collapsedView = collapsedCheckbox.checked;
            if (!this.state.collapsedView) {
                // Show all nodes when switching to expanded view
                this.state.expandedClusters.clear();
                this.state.expandedVectors.clear();
            }
            // Rebuild graph and restart simulation
            this.buildGraphData();
            this.forceSimulation.setData(this.state.nodes, this.state.links);
            this.forceSimulation.start();
        });
        
        // Performance mode toggle
        const perfToggle = optionsContainer.createDiv({ cls: 'oom-oneirograph-option' });
        perfToggle.createSpan({ text: 'Performance Mode' });
        const perfCheckbox = perfToggle.createEl('input', { type: 'checkbox' });
        perfCheckbox.checked = this.state.performanceMode;
        perfCheckbox.addEventListener('change', () => {
            this.state.performanceMode = perfCheckbox.checked;
            if (this.state.performanceMode) {
                this.state.showLabels = false;
                labelsCheckbox.checked = false;
            }
            this.render();
        });
        
        // Phase 4: Search and filter controls (top left panel)
        this.createSearchPanel();
        
        // FPS counter
        const fpsContainer = this.controlsEl.createDiv({ cls: 'oom-oneirograph-fps' });
        this.updateFpsDisplay(fpsContainer);
    }
    
    /**
     * Create collapsible search and filter panel (top left)
     * Phase 4: Live filtering and search functionality
     */
    private createSearchPanel() {
        this.searchPanel = this.containerEl.createDiv({ cls: 'oom-oneirograph-search-panel' });
        
        // Panel header with toggle button
        const panelHeader = this.searchPanel.createDiv({ cls: 'oom-search-panel-header' });
        panelHeader.createSpan({ text: 'Search & Filters', cls: 'oom-search-panel-title' });
        
        this.searchToggleButton = new ButtonComponent(panelHeader)
            .setIcon('chevron-down')
            .setTooltip('Toggle search panel')
            .onClick(() => this.toggleSearchPanel());
        
        // Panel content (collapsible)
        this.searchPanelContent = this.searchPanel.createDiv({ cls: 'oom-oneirograph-search-controls' });
        const searchContainer = this.searchPanelContent;
        
        // Search input
        const searchInputContainer = searchContainer.createDiv({ cls: 'oom-search-input-container' });
        searchInputContainer.createSpan({ text: 'Search:', cls: 'oom-search-label' });
        
        const searchInput = searchInputContainer.createEl('input', {
            type: 'text',
            cls: 'oom-search-input',
            attr: { placeholder: 'Search dreams, themes, clusters...' }
        });
        
        searchInput.addEventListener('input', () => {
            this.state.searchQuery = searchInput.value.trim();
            this.applyFilters();
        });
        
        // Clear search button
        new ButtonComponent(searchInputContainer)
            .setIcon('x')
            .setTooltip('Clear Search')
            .onClick(() => {
                searchInput.value = '';
                this.state.searchQuery = '';
                this.applyFilters();
            });
        
        // Filter options
        const filterContainer = searchContainer.createDiv({ cls: 'oom-filter-container' });
        
        // Date range filter
        this.createDateRangeFilter(filterContainer);
        
        // Theme filter
        this.createThemeFilter(filterContainer);
        
        // Cluster filter
        this.createClusterFilter(filterContainer);
        
        // Active filters display and clear all
        const activeFiltersContainer = searchContainer.createDiv({ cls: 'oom-active-filters' });
        
        new ButtonComponent(activeFiltersContainer)
            .setButtonText('Clear All Filters')
            .setTooltip('Remove all active filters')
            .onClick(() => this.clearAllFilters());
        
        // Store reference for updating active filters display
        this.activeFiltersContainer = activeFiltersContainer;
    }
    
    /**
     * Populate filter dropdowns after data is loaded
     */
    private populateFilterOptions() {
        // Populate theme filter
        const themeSelect = this.containerEl.querySelector('.oom-theme-select') as HTMLSelectElement;
        if (themeSelect) {
            // Clear existing options
            themeSelect.innerHTML = '';
            
            // Collect all themes from dreams
            const allThemes = new Set<string>();
            this.state.dreams.forEach(dream => {
                const themes = this.extractThemes(dream);
                themes.forEach(theme => allThemes.add(theme));
            });
            
            // Add sorted options
            Array.from(allThemes).sort().forEach(theme => {
                themeSelect.createEl('option', { value: theme, text: theme });
            });
        }
        
        // Populate cluster filter
        const clusterSelect = this.containerEl.querySelector('.oom-cluster-select') as HTMLSelectElement;
        if (clusterSelect) {
            // Clear existing options
            clusterSelect.innerHTML = '';
            
            // Add cluster options
            this.state.clusters.forEach((cluster, clusterId) => {
                clusterSelect.createEl('option', { value: clusterId, text: cluster.name });
            });
        }
        
        // Update date range defaults
        this.updateDateRangeDefaults();
    }
    
    /**
     * Update date range filter defaults
     */
    private updateDateRangeDefaults() {
        const startDateInput = this.containerEl.querySelector('.oom-date-input[title="Start Date"]') as HTMLInputElement;
        const endDateInput = this.containerEl.querySelector('.oom-date-input[title="End Date"]') as HTMLInputElement;
        
        if (startDateInput && endDateInput && this.state.dreams.length > 0) {
            const dates = this.state.dreams
                .map(d => new Date(d.date))
                .filter(date => !isNaN(date.getTime()));
            
            if (dates.length > 0) {
                const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                
                startDateInput.value = minDate.toISOString().split('T')[0];
                endDateInput.value = maxDate.toISOString().split('T')[0];
            }
        }
    }
    
    /**
     * Toggle the search panel visibility
     */
    private toggleSearchPanel() {
        if (!this.searchPanelContent || !this.searchToggleButton) return;
        
        const isCollapsed = this.searchPanelContent.hasClass('collapsed');
        
        if (isCollapsed) {
            // Expand panel
            this.searchPanelContent.removeClass('collapsed');
            this.searchToggleButton.setIcon('chevron-down');
        } else {
            // Collapse panel
            this.searchPanelContent.addClass('collapsed');
            this.searchToggleButton.setIcon('chevron-right');
        }
    }
    
    /**
     * Create date range filter controls
     */
    private createDateRangeFilter(container: HTMLElement) {
        const dateFilterContainer = container.createDiv({ cls: 'oom-filter-group' });
        dateFilterContainer.createSpan({ text: 'Date Range:', cls: 'oom-filter-label' });
        
        const dateInputs = dateFilterContainer.createDiv({ cls: 'oom-date-inputs' });
        
        const startDateInput = dateInputs.createEl('input', {
            type: 'date',
            cls: 'oom-date-input',
            attr: { title: 'Start Date' }
        });
        
        const endDateInput = dateInputs.createEl('input', {
            type: 'date',
            cls: 'oom-date-input',
            attr: { title: 'End Date' }
        });
        
        // Note: Date range defaults will be set after data loads
        // See populateFilterOptions() method
        
        const updateDateFilter = () => {
            const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
            const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
            
            if (startDate || endDate) {
                this.state.activeFilters.dateRange = {
                    start: startDate || new Date(0),
                    end: endDate || new Date()
                };
            } else {
                delete this.state.activeFilters.dateRange;
            }
            
            this.applyFilters();
        };
        
        startDateInput.addEventListener('change', updateDateFilter);
        endDateInput.addEventListener('change', updateDateFilter);
    }
    
    /**
     * Create theme filter controls
     */
    private createThemeFilter(container: HTMLElement) {
        const themeFilterContainer = container.createDiv({ cls: 'oom-filter-group' });
        themeFilterContainer.createSpan({ text: 'Themes:', cls: 'oom-filter-label' });
        
        const themeSelect = themeFilterContainer.createEl('select', {
            cls: 'oom-theme-select',
            attr: { multiple: true, size: '6' }
        });
        
        // Note: Themes will be populated after data loads
        // See populateFilterOptions() method
        
        themeSelect.addEventListener('change', () => {
            const selectedThemes = Array.from(themeSelect.selectedOptions)
                .map(option => option.value);
            
            if (selectedThemes.length > 0) {
                this.state.activeFilters.themes = selectedThemes;
            } else {
                delete this.state.activeFilters.themes;
            }
            
            this.applyFilters();
        });
    }
    
    /**
     * Create cluster filter controls
     */
    private createClusterFilter(container: HTMLElement) {
        const clusterFilterContainer = container.createDiv({ cls: 'oom-filter-group' });
        clusterFilterContainer.createSpan({ text: 'Clusters:', cls: 'oom-filter-label' });
        
        const clusterSelect = clusterFilterContainer.createEl('select', {
            cls: 'oom-cluster-select',
            attr: { multiple: true, size: '4' }
        });
        
        // Note: Clusters will be populated after data loads
        // See populateFilterOptions() method
        
        clusterSelect.addEventListener('change', () => {
            const selectedClusters = Array.from(clusterSelect.selectedOptions)
                .map(option => option.value);
            
            if (selectedClusters.length > 0) {
                this.state.activeFilters.clusters = selectedClusters;
            } else {
                delete this.state.activeFilters.clusters;
            }
            
            this.applyFilters();
        });
    }
    
    /**
     * Apply current search query and filters to nodes
     */
    private applyFilters() {
        const filteredIds = new Set<string>();
        
        // Apply search query
        if (this.state.searchQuery) {
            this.filterBySearchQuery(filteredIds);
        }
        
        // Apply date range filter
        if (this.state.activeFilters.dateRange) {
            this.filterByDateRange(filteredIds);
        }
        
        // Apply theme filter
        if (this.state.activeFilters.themes) {
            this.filterByThemes(filteredIds);
        }
        
        // Apply cluster filter
        if (this.state.activeFilters.clusters) {
            this.filterByClusters(filteredIds);
        }
        
        // Update filtered node IDs
        this.state.filteredNodeIds = filteredIds;
        
        // Update visualization
        this.updateNodeVisibility();
        this.render();
        
        // Update active filters display
        this.updateActiveFiltersDisplay();
    }
    
    /**
     * Filter nodes by search query
     */
    private filterBySearchQuery(filteredIds: Set<string>) {
        const query = this.state.searchQuery.toLowerCase();
        
        for (const node of this.state.nodes) {
            const searchableText = this.getNodeSearchableText(node).toLowerCase();
            if (searchableText.includes(query)) {
                filteredIds.add(node.id);
            }
        }
    }
    
    /**
     * Filter nodes by date range
     */
    private filterByDateRange(filteredIds: Set<string>) {
        const { start, end } = this.state.activeFilters.dateRange!;
        
        for (const node of this.state.nodes) {
            if (node.type === 'dream' && node.date) {
                if (node.date >= start && node.date <= end) {
                    filteredIds.add(node.id);
                }
            } else if (node.type !== 'dream') {
                // Include cluster and vector nodes if they have associated dreams in range
                const hasAssociatedDreams = this.state.nodes.some(dreamNode => 
                    dreamNode.type === 'dream' && 
                    dreamNode.date &&
                    dreamNode.date >= start && 
                    dreamNode.date <= end &&
                    (dreamNode.clusterId === node.id || dreamNode.vectorIds?.includes(node.id))
                );
                
                if (hasAssociatedDreams) {
                    filteredIds.add(node.id);
                }
            }
        }
    }
    
    /**
     * Filter nodes by themes
     */
    private filterByThemes(filteredIds: Set<string>) {
        const selectedThemes = this.state.activeFilters.themes!;
        
        for (const node of this.state.nodes) {
            if (node.type === 'dream' && node.themes) {
                const hasMatchingTheme = node.themes.some(theme => 
                    selectedThemes.includes(theme)
                );
                
                if (hasMatchingTheme) {
                    filteredIds.add(node.id);
                }
            } else if (node.type !== 'dream') {
                // Include cluster and vector nodes if they contain the selected themes
                const hasAssociatedThemes = this.nodeContainsThemes(node, selectedThemes);
                if (hasAssociatedThemes) {
                    filteredIds.add(node.id);
                }
            }
        }
    }
    
    /**
     * Filter nodes by clusters
     */
    private filterByClusters(filteredIds: Set<string>) {
        const selectedClusters = this.state.activeFilters.clusters!;
        
        for (const node of this.state.nodes) {
            if (node.type === 'cluster' && selectedClusters.includes(node.id)) {
                filteredIds.add(node.id);
            } else if (node.clusterId && selectedClusters.includes(node.clusterId)) {
                filteredIds.add(node.id);
            }
        }
    }
    
    /**
     * Get searchable text for a node
     */
    private getNodeSearchableText(node: OneirographNode): string {
        const parts = [node.label];
        
        if (node.type === 'dream') {
            const dream = node.data as DreamMetricData;
            // Add dream content and themes to searchable text
            if (dream.content) {
                parts.push(dream.content);
            }
            if (node.themes) {
                parts.push(...node.themes);
            }
        } else if (node.type === 'cluster') {
            const cluster = node.data as TaxonomyCluster;
            if (cluster.description) {
                parts.push(cluster.description);
            }
        } else if (node.type === 'vector') {
            const vector = node.data as TaxonomyVector;
            if (vector.description) {
                parts.push(vector.description);
            }
        }
        
        return parts.join(' ');
    }
    
    /**
     * Check if a node contains specific themes
     */
    private nodeContainsThemes(node: OneirographNode, themes: string[]): boolean {
        if (node.type === 'cluster') {
            // Check if any dreams in this cluster have the themes
            return this.state.nodes.some(dreamNode => 
                dreamNode.type === 'dream' &&
                dreamNode.clusterId === node.id &&
                dreamNode.themes?.some(theme => themes.includes(theme))
            );
        } else if (node.type === 'vector') {
            // Check if any dreams connected to this vector have the themes
            return this.state.nodes.some(dreamNode => 
                dreamNode.type === 'dream' &&
                dreamNode.vectorIds?.includes(node.id) &&
                dreamNode.themes?.some(theme => themes.includes(theme))
            );
        }
        
        return false;
    }
    
    /**
     * Update node visibility based on current filters
     */
    private updateNodeVisibility() {
        // If no filters active, show all nodes
        if (this.state.filteredNodeIds.size === 0 && 
            !this.state.searchQuery && 
            Object.keys(this.state.activeFilters).length === 0) {
            // Reset all nodes to visible
            this.state.nodes.forEach(node => {
                (node as any).filtered = false;
            });
            return;
        }
        
        // Apply filtering
        this.state.nodes.forEach(node => {
            (node as any).filtered = !this.state.filteredNodeIds.has(node.id);
        });
    }
    
    /**
     * Clear all active filters
     */
    private clearAllFilters() {
        this.state.searchQuery = '';
        this.state.activeFilters = {};
        this.state.filteredNodeIds.clear();
        
        // Reset UI controls
        const searchInput = this.controlsEl.querySelector('.oom-search-input') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
        
        const dateInputs = this.controlsEl.querySelectorAll('.oom-date-input') as NodeListOf<HTMLInputElement>;
        dateInputs.forEach(input => input.value = '');
        
        const selects = this.controlsEl.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
        selects.forEach(select => {
            Array.from(select.options).forEach(option => option.selected = false);
        });
        
        this.applyFilters();
    }
    
    /**
     * Update active filters display
     */
    private updateActiveFiltersDisplay() {
        if (!this.activeFiltersContainer) return;
        
        // Clear existing active filter tags
        const existingTags = this.activeFiltersContainer.querySelectorAll('.oom-filter-tag');
        existingTags.forEach(tag => tag.remove());
        
        // Add search query tag
        if (this.state.searchQuery) {
            this.createFilterTag('Search: ' + this.state.searchQuery, () => {
                const searchInput = this.controlsEl.querySelector('.oom-search-input') as HTMLInputElement;
                if (searchInput) searchInput.value = '';
                this.state.searchQuery = '';
                this.applyFilters();
            });
        }
        
        // Add active filter tags
        Object.entries(this.state.activeFilters).forEach(([filterType, filterValue]) => {
            if (filterType === 'dateRange' && filterValue) {
                const range = filterValue as { start: Date; end: Date };
                this.createFilterTag(
                    `Date: ${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()}`,
                    () => {
                        delete this.state.activeFilters.dateRange;
                        this.applyFilters();
                    }
                );
            } else if (filterType === 'themes' && Array.isArray(filterValue)) {
                this.createFilterTag(
                    `Themes: ${filterValue.join(', ')}`,
                    () => {
                        delete this.state.activeFilters.themes;
                        this.applyFilters();
                    }
                );
            } else if (filterType === 'clusters' && Array.isArray(filterValue)) {
                const clusterNames = filterValue.map(id => 
                    this.state.clusters.get(id)?.name || id
                );
                this.createFilterTag(
                    `Clusters: ${clusterNames.join(', ')}`,
                    () => {
                        delete this.state.activeFilters.clusters;
                        this.applyFilters();
                    }
                );
            }
        });
    }
    
    /**
     * Create a filter tag with remove button
     */
    private createFilterTag(text: string, onRemove: () => void) {
        const tag = this.activeFiltersContainer!.createDiv({ cls: 'oom-filter-tag' });
        tag.createSpan({ text, cls: 'oom-filter-tag-text' });
        
        new ButtonComponent(tag)
            .setIcon('x')
            .setTooltip('Remove filter')
            .onClick(onRemove);
    }
    
    /**
     * Initialize visualization components
     */
    private initializeComponents() {
        // Initialize force simulation
        this.forceSimulation = new ForceSimulation(this.canvasEl, {
            width: this.canvasEl.width,
            height: this.canvasEl.height,
            onTick: () => this.render()
        });
        
        // Initialize renderer
        this.renderer = new CanvasRenderer(this.canvasEl, {
            performanceMode: this.state.performanceMode,
            showLabels: this.state.showLabels,
            showConnections: this.state.showConnections
        });
        
        // Initialize interaction handler
        this.interactions = new OneirographInteractions(this.canvasEl, this.overlayEl, {
            onNodeClick: (node) => this.handleNodeClick(node),
            onNodeHover: (node) => this.handleNodeHover(node),
            onPan: (dx, dy) => this.handlePan(dx, dy),
            onZoom: (delta) => this.handleZoom(delta)
        });
        
        // Wire up node finder for interactions
        this.interactions.setNodeFinder((x: number, y: number) => {
            // Account for current zoom and pan
            const zoom = this.state.zoomLevel;
            const pan = this.state.panPosition;
            const worldX = (x - pan.x) / zoom;
            const worldY = (y - pan.y) / zoom;
            return this.forceSimulation.findNodeAt(worldX, worldY);
        });
    }
    
    /**
     * Load data from plugin sources
     */
    private async loadData() {
        try {
            this.state.isLoading = true;
            
            // Load taxonomy data
            if (this.plugin.taxonomyManager) {
                const taxonomy = this.plugin.taxonomyManager.getTaxonomy();
                if (taxonomy) {
                    // Process clusters
                    for (const cluster of taxonomy.clusters) {
                        this.state.clusters.set(cluster.id, cluster);
                        
                        // Process vectors
                        for (const vector of cluster.vectors) {
                            this.state.vectors.set(vector.id, vector);
                            
                            // Process themes
                            for (const theme of vector.themes) {
                                this.state.themes.set(theme.id, theme);
                            }
                        }
                    }
                }
            }
            
            // Load dream data using UniversalMetricsCalculator (same as dashboard)
            const { UniversalMetricsCalculator } = await import('../../workers/UniversalMetricsCalculator');
            const calculator = new UniversalMetricsCalculator(
                this.plugin.app,
                this.plugin,
                false, // Disable worker pool for view use
                this.plugin.logger
            );
            
            // Get files to process
            const files = await this.getFilesToProcess();
            const dreamEntries: DreamMetricData[] = [];
            
            if (files && files.length > 0) {
                for (const filePath of files) {
                    const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
                    if (file && 'extension' in file) {
                        try {
                            const content = await this.plugin.app.vault.read(file as any);
                            const result = calculator.parseJournalEntries(content, filePath);
                            
                            // Convert entries to DreamMetricData format
                            if (result?.entries) {
                                for (const entry of result.entries) {
                                    const dreamData: DreamMetricData = {
                                        date: entry.date,
                                        title: entry.title || 'Untitled Dream',
                                        content: entry.content || '',
                                        source: filePath,
                                        wordCount: entry.wordCount || 0,
                                        metrics: entry.metrics || {}
                                    };
                                    dreamEntries.push(dreamData);
                                }
                            }
                        } catch (error) {
                            safeLogger.error('Oneirograph', `Error processing file ${filePath}`, error);
                        }
                    }
                }
            }
            
            this.state.dreams = dreamEntries;
            
            // Debug logging
            safeLogger.info('Oneirograph', `Loaded ${dreamEntries.length} dream entries from ${files.length} files`);
            if (dreamEntries.length > 0) {
                const sampleDream = dreamEntries[0];
                safeLogger.info('Oneirograph', `Sample dream metrics keys: ${Object.keys(sampleDream.metrics).join(', ')}`);
                safeLogger.info('Oneirograph', `Sample dream "Dream Themes" value: ${JSON.stringify(sampleDream.metrics['Dream Themes'])}`);
                
                // Debug plugin settings for Dream Themes metric
                if (this.plugin.settings?.metrics) {
                    const dreamThemesConfig = this.plugin.settings.metrics['Dream Themes'];
                    if (dreamThemesConfig) {
                        safeLogger.info('Oneirograph', `Dream Themes config: ${JSON.stringify(dreamThemesConfig)}`);
                    } else {
                        safeLogger.info('Oneirograph', `Dream Themes not found in plugin.settings.metrics. Available: ${Object.keys(this.plugin.settings.metrics).join(', ')}`);
                    }
                }
                
                const themes = this.extractThemes(sampleDream);
                safeLogger.info('Oneirograph', `Sample dream extracted themes: ${themes.join(', ')}`);
            }
            
            // Debug taxonomy themes
            safeLogger.info('Oneirograph', `Available taxonomy themes: ${Array.from(this.state.themes.values()).map(t => t.name).join(', ')}`);
            
            // Build graph data
            this.buildGraphData();
            
            // Initialize force simulation with data
            this.forceSimulation.setData(this.state.nodes, this.state.links);
            
            // Populate filter options now that data is loaded
            this.populateFilterOptions();
            
            this.state.isLoading = false;
            this.hideLoading();
            
            safeLogger.info('Oneirograph', `Loaded ${this.state.dreams.length} dreams and ${this.state.clusters.size} clusters`);
        } catch (error) {
            safeLogger.error('Oneirograph', 'Failed to load data', error);
            this.showError('Failed to load data');
            this.state.isLoading = false;
        }
    }
    
    /**
     * Get files to process based on plugin settings (recursive, like Dashboard)
     */
    private async getFilesToProcess(): Promise<string[]> {
        const files: string[] = [];
        const settings = this.plugin.settings;
        
        if (!settings) {
            safeLogger.error('Oneirograph', 'Settings not available');
            return [];
        }
        
        const selectedFolder = settings.selectedFolder || '/';
        
        // Get all files in the selected folder recursively
        const folder = this.plugin.app.vault.getAbstractFileByPath(selectedFolder);
        if (folder && 'children' in folder) {
            const gatherFiles = (folder: any, acc: string[], depth: number = 0) => {
                for (const child of folder.children) {
                    if (child && 'extension' in child && child.extension === 'md') {
                        if (!settings.excludedNotes?.includes(child.path)) {
                            acc.push(child.path);
                        }
                    } else if (child && 'children' in child) {
                        if (!settings.excludedSubfolders?.includes(child.path)) {
                            gatherFiles(child, acc, depth + 1);
                        }
                    }
                }
            };
            gatherFiles(folder, files);
        }
        
        return files;
    }
    
    /**
     * Build graph nodes and links from taxonomy and dream data
     */
    private buildGraphData() {
        const nodes: OneirographNode[] = [];
        const links: OneirographLink[] = [];
        const nodeMap = new Map<string, OneirographNode>();
        
        // Create cluster nodes
        for (const [clusterId, cluster] of this.state.clusters) {
            const clusterNode: OneirographNode = {
                id: clusterId,
                type: 'cluster',
                data: cluster,
                radius: 30,
                color: cluster.color,
                label: cluster.name,
                x: cluster.position?.x || Math.random() * 800 - 400,
                y: cluster.position?.y || Math.random() * 600 - 300
            };
            nodes.push(clusterNode);
            nodeMap.set(clusterId, clusterNode);
        }
        
        // Create vector nodes (only if parent cluster is expanded or not in collapsed view)
        for (const [vectorId, vector] of this.state.vectors) {
            // Skip if in collapsed view and parent cluster is not expanded
            if (this.state.collapsedView && !this.state.expandedClusters.has(vector.parentClusterId)) {
                continue;
            }
            
            const parentCluster = this.state.clusters.get(vector.parentClusterId);
            const vectorNode: OneirographNode = {
                id: vectorId,
                type: 'vector',
                data: vector,
                clusterId: vector.parentClusterId,
                radius: 15,
                color: parentCluster?.color || '#666666',
                label: vector.name,
                x: Math.random() * 600 - 300,
                y: Math.random() * 400 - 200
            };
            nodes.push(vectorNode);
            nodeMap.set(vectorId, vectorNode);
            
            // Create link from vector to its parent cluster
            const clusterNode = nodeMap.get(vector.parentClusterId);
            if (clusterNode) {
                links.push({
                    source: vectorNode,
                    target: clusterNode,
                    strength: 1.0, // Strong vector→cluster bond
                    type: 'cluster'
                });
            }
        }
        
        // Create dream nodes and links
        safeLogger.info('Oneirograph', `Processing ${this.state.dreams.length} dreams for graph`);
        for (const dream of this.state.dreams) {
            const themes = this.extractThemes(dream);
            const vectorIds = this.getVectorIdsForThemes(themes);
            const clusterIds = this.getClusterIdsForThemes(themes);
            
            safeLogger.info('Oneirograph', `Dream "${dream.title}": themes=[${themes.join(', ')}], vectorIds=[${vectorIds.join(', ')}], clusterIds=[${clusterIds.join(', ')}]`);
            
            if (vectorIds.length > 0) {
                // Skip if in collapsed view and none of the parent vectors are expanded
                if (this.state.collapsedView) {
                    const hasExpandedVector = vectorIds.some(vectorId => this.state.expandedVectors.has(vectorId));
                    if (!hasExpandedVector) {
                        continue;
                    }
                }
                
                const dreamNode: OneirographNode = {
                    id: dream.source.toString(),
                    type: 'dream',
                    data: dream,
                    clusterId: clusterIds[0], // Primary cluster for color
                    vectorIds: vectorIds, // Store vector associations
                    themes: themes,
                    radius: 5,
                    color: this.getDreamColor(clusterIds[0]),
                    label: dream.title || 'Untitled',
                    date: new Date(dream.date)
                };
                nodes.push(dreamNode);
                nodeMap.set(dreamNode.id, dreamNode);
                
                // Create links to vectors (only to vectors that exist in the current graph)
                for (const vectorId of vectorIds) {
                    const vectorNode = nodeMap.get(vectorId);
                    if (vectorNode) {
                        links.push({
                            source: dreamNode,
                            target: vectorNode,
                            strength: 0.8, // Strong dream→vector bond
                            type: 'vector'
                        });
                    }
                }
            }
        }
        
        this.state.nodes = nodes;
        this.state.links = links;
        
        safeLogger.info('Oneirograph', `Built graph with ${nodes.length} nodes and ${links.length} links`);
    }
    
    /**
     * Extract themes from dream metrics
     */
    private extractThemes(dream: DreamMetricData): string[] {
        const themes: string[] = [];
        
        // Dynamically find theme metrics from plugin settings
        if (this.plugin.settings?.metrics) {
            for (const [metricName, metricConfig] of Object.entries(this.plugin.settings.metrics)) {
                if ((metricConfig.category === 'theme' || metricConfig.name === 'Dream Themes') && metricConfig.enabled) {
                    // Look for this metric in the dream data
                    // Try both the display name and the metric key itself
                    const possibleKeys = [
                        metricName.toLowerCase().replace(/\s+/g, '-'), // Convert to kebab-case
                        metricName, // Original key
                        metricConfig.name?.toLowerCase().replace(/\s+/g, '-'), // Display name to kebab-case
                        metricConfig.name, // Display name
                        metricConfig.frontmatterProperty // Explicit frontmatter property if set
                    ].filter(Boolean);
                    
                    for (const key of possibleKeys) {
                        const value = dream.metrics[key];
                        if (value) {
                            if (Array.isArray(value)) {
                                for (const theme of value) {
                                    const themeStr = String(theme).trim();
                                    // Clean up malformed data like "[Control" -> "Control"
                                    const cleanTheme = themeStr.replace(/^\[|\]$/g, '');
                                    if (cleanTheme.length > 0) {
                                        themes.push(cleanTheme);
                                    }
                                }
                            } else if (typeof value === 'string' && value !== '[]') {
                                const themeStr = value.trim();
                                if (themeStr.length > 0) {
                                    // Handle string like "[Control, Integration, Self-Creation]"
                                    const cleanStr = themeStr.replace(/^\[|\]$/g, '');
                                    themes.push(...cleanStr.split(',').map(t => t.trim()).filter(t => t.length > 0));
                                }
                            }
                            break; // Found a match, stop looking for this metric
                        }
                    }
                }
            }
        }
        
        // Fallback: Check for common theme property names if no category-based metrics found themes
        if (themes.length === 0) {
            const fallbackKeys = ['themes', 'tags', 'dream-theme', 'dream-themes'];
            for (const key of fallbackKeys) {
                const value = dream.metrics[key];
                if (value) {
                    if (Array.isArray(value)) {
                        themes.push(...value.map(v => String(v).trim()));
                    } else if (typeof value === 'string') {
                        themes.push(...value.split(',').map(t => t.trim()).filter(t => t.length > 0));
                    }
                }
            }
        }
        
        return themes;
    }
    
    /**
     * Get vector IDs for given themes
     */
    private getVectorIdsForThemes(themes: string[]): string[] {
        const vectorIds = new Set<string>();
        
        for (const themeName of themes) {
            // Find theme in taxonomy
            for (const [, theme] of this.state.themes) {
                if (theme.name.toLowerCase() === themeName.toLowerCase() || 
                    theme.aliases?.some(alias => alias.toLowerCase() === themeName.toLowerCase())) {
                    // Add vector IDs that contain this theme
                    for (const vectorId of theme.vectorIds) {
                        vectorIds.add(vectorId);
                    }
                }
            }
        }
        
        return Array.from(vectorIds);
    }
    
    /**
     * Get cluster IDs for given themes
     */
    private getClusterIdsForThemes(themes: string[]): string[] {
        const clusterIds = new Set<string>();
        
        for (const themeName of themes) {
            // Find theme in taxonomy
            for (const [, theme] of this.state.themes) {
                if (theme.name.toLowerCase() === themeName.toLowerCase() || 
                    theme.aliases?.some(alias => alias.toLowerCase() === themeName.toLowerCase())) {
                    // Get cluster IDs from vectors
                    for (const vectorId of theme.vectorIds) {
                        const vector = this.state.vectors.get(vectorId);
                        if (vector) {
                            clusterIds.add(vector.parentClusterId);
                        }
                    }
                }
            }
        }
        
        return Array.from(clusterIds);
    }
    
    /**
     * Get color for dream based on cluster
     */
    private getDreamColor(clusterId: string): string {
        const cluster = this.state.clusters.get(clusterId);
        return cluster?.color || '#666666';
    }
    
    /**
     * Start the rendering loop
     */
    private startRendering() {
        const animate = () => {
            this.updateFps();
            this.render();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * Main render function
     */
    private render() {
        if (this.state.isLoading) return;
        
        // Update renderer options
        this.renderer.updateOptions({
            performanceMode: this.state.performanceMode,
            showLabels: this.state.showLabels,
            showConnections: this.state.showConnections,
            zoomLevel: this.state.zoomLevel,
            panPosition: this.state.panPosition
        });
        
        // Render the graph
        this.renderer.render(this.state.nodes, this.state.links, {
            selectedNode: this.state.selectedNode,
            selectedCluster: this.state.selectedCluster
        });
    }
    
    /**
     * Handle node click
     */
    private handleNodeClick(node: OneirographNode) {
        if (node.type === 'cluster') {
            // Phase 4: Expand/collapse cluster in collapsed view, otherwise just select
            if (this.state.collapsedView) {
                this.toggleClusterExpansion(node.id);
            } else {
                // In expanded view, just select the cluster (allow dragging)
                // No zoom behavior - let the user drag clusters naturally
            }
        } else if (node.type === 'vector') {
            // Phase 4: Expand/collapse vector
            if (this.state.collapsedView) {
                this.toggleVectorExpansion(node.id);
            }
        } else if (node.type === 'dream') {
            // Phase 4: Show dream content in-situ
            this.showDreamContent(node.data as DreamMetricData);
        }
        
        this.state.selectedNode = node;
        this.render();
    }
    
    /**
     * Handle node hover
     */
    private handleNodeHover(node: OneirographNode | null) {
        if (node) {
            this.interactions.showTooltip(node);
        } else {
            this.interactions.hideTooltip();
        }
    }
    
    /**
     * Handle pan movement
     */
    private handlePan(dx: number, dy: number) {
        this.state.panPosition.x += dx;
        this.state.panPosition.y += dy;
        this.render();
    }
    
    /**
     * Handle zoom
     */
    private handleZoom(delta: number) {
        const zoomFactor = 1.1;
        if (delta > 0) {
            this.state.zoomLevel *= zoomFactor;
        } else {
            this.state.zoomLevel /= zoomFactor;
        }
        this.state.zoomLevel = Math.max(0.1, Math.min(10, this.state.zoomLevel));
        this.render();
    }
    
    /**
     * Zoom in
     */
    private zoomIn() {
        this.handleZoom(1);
    }
    
    /**
     * Zoom out
     */
    private zoomOut() {
        this.handleZoom(-1);
    }
    
    /**
     * Reset view to default
     */
    private resetView() {
        this.state.zoomLevel = 1;
        this.state.panPosition = { x: 0, y: 0 };
        this.state.selectedNode = null;
        this.state.selectedCluster = null;
        this.forceSimulation.resetPositions();
        this.render();
    }
    
    /**
     * Zoom to specific cluster
     */
    private zoomToCluster(clusterId: string) {
        const clusterNode = this.state.nodes.find(n => n.id === clusterId && n.type === 'cluster');
        if (clusterNode && clusterNode.x !== undefined && clusterNode.y !== undefined) {
            // Calculate zoom and pan to center cluster
            this.state.zoomLevel = 2;
            this.state.panPosition = {
                x: -clusterNode.x * this.state.zoomLevel + this.canvasEl.width / 2,
                y: -clusterNode.y * this.state.zoomLevel + this.canvasEl.height / 2
            };
            this.state.selectedCluster = clusterId;
            this.render();
        }
    }
    
    /**
     * Phase 4: Toggle cluster expansion
     */
    private toggleClusterExpansion(clusterId: string) {
        if (this.state.expandedClusters.has(clusterId)) {
            // Collapse cluster - remove it and collapse all its vectors
            this.state.expandedClusters.delete(clusterId);
            // Also collapse all vectors in this cluster
            for (const [vectorId, vector] of this.state.vectors) {
                if (vector.parentClusterId === clusterId) {
                    this.state.expandedVectors.delete(vectorId);
                }
            }
            safeLogger.info('Oneirograph', `Collapsed cluster: ${clusterId}`);
        } else {
            // Expand cluster - show its vectors
            this.state.expandedClusters.add(clusterId);
            safeLogger.info('Oneirograph', `Expanded cluster: ${clusterId}`);
        }
        
        // Rebuild graph data and restart simulation
        this.buildGraphData();
        this.forceSimulation.setData(this.state.nodes, this.state.links);
        this.forceSimulation.start();
    }
    
    /**
     * Phase 4: Toggle vector expansion
     */
    private toggleVectorExpansion(vectorId: string) {
        if (this.state.expandedVectors.has(vectorId)) {
            // Collapse vector - hide its dreams
            this.state.expandedVectors.delete(vectorId);
            safeLogger.info('Oneirograph', `Collapsed vector: ${vectorId}`);
        } else {
            // Expand vector - show its dreams
            this.state.expandedVectors.add(vectorId);
            safeLogger.info('Oneirograph', `Expanded vector: ${vectorId}`);
        }
        
        // Rebuild graph data and restart simulation
        this.buildGraphData();
        this.forceSimulation.setData(this.state.nodes, this.state.links);
        this.forceSimulation.start();
    }
    
    /**
     * Phase 4: Show dream content in-situ
     */
    private showDreamContent(dream: DreamMetricData) {
        this.state.selectedDream = dream;
        this.state.dreamContentVisible = true;
        
        // Create dream content panel if it doesn't exist
        this.createDreamContentPanel();
        
        safeLogger.info('Oneirograph', `Showing dream content: ${dream.title}`);
    }
    
    /**
     * Phase 4: Create dream content panel
     */
    private createDreamContentPanel() {
        // Remove existing panel
        const existingPanel = this.containerEl.querySelector('.oom-dream-content-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        if (!this.state.selectedDream || !this.state.dreamContentVisible) {
            return;
        }
        
        const dream = this.state.selectedDream;
        
        // Create floating panel
        const panel = this.containerEl.createDiv({ cls: 'oom-dream-content-panel' });
        
        // Header with title and close button
        const header = panel.createDiv({ cls: 'oom-dream-content-header' });
        header.createSpan({ cls: 'oom-dream-content-title', text: dream.title || 'Untitled Dream' });
        header.createSpan({ cls: 'oom-dream-content-date', text: dream.date });
        
        const closeBtn = header.createSpan({ cls: 'oom-dream-content-close', text: '×' });
        closeBtn.addEventListener('click', () => this.hideDreamContent());
        
        // Content area
        const content = panel.createDiv({ cls: 'oom-dream-content-body' });
        content.createDiv({ cls: 'oom-dream-content-text', text: dream.content });
        
        // Metrics
        if (dream.metrics && Object.keys(dream.metrics).length > 0) {
            const metricsDiv = content.createDiv({ cls: 'oom-dream-content-metrics' });
            metricsDiv.createEl('h4', { text: 'Metrics' });
            
            for (const [key, value] of Object.entries(dream.metrics)) {
                const metricDiv = metricsDiv.createDiv({ cls: 'oom-dream-metric' });
                metricDiv.createSpan({ cls: 'oom-dream-metric-key', text: key + ':' });
                metricDiv.createSpan({ cls: 'oom-dream-metric-value', text: String(value) });
            }
        }
    }
    
    /**
     * Phase 4: Hide dream content panel
     */
    private hideDreamContent() {
        this.state.selectedDream = null;
        this.state.dreamContentVisible = false;
        
        const panel = this.containerEl.querySelector('.oom-dream-content-panel');
        if (panel) {
            panel.remove();
        }
        
        // Clear selection
        this.state.selectedNode = null;
        this.render();
    }
    
    /**
     * Show dream details (legacy method)
     */
    private showDreamDetails(node: OneirographNode) {
        if (node.type === 'dream' && node.data) {
            const dream = node.data as DreamMetricData;
            // Use new Phase 4 method
            this.showDreamContent(dream);
        }
    }
    
    /**
     * Update canvas size
     */
    private updateCanvasSize() {
        const rect = this.containerEl.getBoundingClientRect();
        this.canvasEl.width = rect.width;
        this.canvasEl.height = rect.height - 60; // Account for controls
        
        if (this.forceSimulation) {
            this.forceSimulation.updateSize(this.canvasEl.width, this.canvasEl.height);
        }
        
        if (this.renderer) {
            this.renderer.updateSize(this.canvasEl.width, this.canvasEl.height);
        }
    }
    
    /**
     * Setup resize observer
     */
    private setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(() => {
            this.updateCanvasSize();
            this.render();
        });
        this.resizeObserver.observe(this.containerEl);
    }
    
    /**
     * Update FPS counter
     */
    private updateFps() {
        this.frameCounter++;
        const now = performance.now();
        
        if (now - this.lastFpsTime >= 1000) {
            this.currentFps = this.frameCounter;
            this.frameCounter = 0;
            this.lastFpsTime = now;
            
            const fpsEl = this.controlsEl.querySelector('.oom-oneirograph-fps');
            if (fpsEl) {
                this.updateFpsDisplay(fpsEl as HTMLElement);
            }
        }
    }
    
    /**
     * Update FPS display
     */
    private updateFpsDisplay(container: HTMLElement) {
        container.empty();
        container.createSpan({ text: `FPS: ${this.currentFps}` });
    }
    
    /**
     * Setup keyboard navigation for accessibility
     * Phase 4: Contextual keyboard support
     */
    private setupKeyboardNavigation() {
        // Make container focusable for keyboard events
        this.containerEl.setAttribute('tabindex', '0');
        
        // Add keyboard event listeners
        this.containerEl.addEventListener('keydown', (event) => this.handleKeyDown(event));
        
        // Canvas keyboard navigation
        this.canvasEl.addEventListener('keydown', (event) => this.handleCanvasKeyDown(event));
        this.canvasEl.setAttribute('tabindex', '0');
        this.canvasEl.setAttribute('role', 'application');
        this.canvasEl.setAttribute('aria-label', 'Dream Taxonomy Graph - Use arrow keys to navigate');
        
        // Search panel keyboard navigation
        this.setupSearchPanelKeyboard();
        
        safeLogger.info('Oneirograph', 'Keyboard navigation initialized');
    }
    
    /**
     * Handle main container keyboard events
     */
    private handleKeyDown(event: KeyboardEvent) {
        // Prevent handling if focus is in an input element
        if (event.target instanceof HTMLInputElement || 
            event.target instanceof HTMLSelectElement ||
            event.target instanceof HTMLTextAreaElement) {
            return;
        }
        
        switch (event.key) {
            case 'Escape':
                this.handleEscapeKey(event);
                break;
            case 'Tab':
                // Let default tab navigation work
                break;
            case '/':
                // Focus search input (common pattern)
                event.preventDefault();
                this.focusSearchInput();
                break;
        }
    }
    
    /**
     * Handle canvas-specific keyboard events
     */
    private handleCanvasKeyDown(event: KeyboardEvent) {
        // Only handle if canvas has focus
        if (document.activeElement !== this.canvasEl) return;
        
        const moveDistance = event.shiftKey ? 50 : 10;
        let handled = false;
        
        switch (event.key) {
            case 'ArrowUp':
                this.panCanvas(0, moveDistance);
                handled = true;
                break;
            case 'ArrowDown':
                this.panCanvas(0, -moveDistance);
                handled = true;
                break;
            case 'ArrowLeft':
                this.panCanvas(moveDistance, 0);
                handled = true;
                break;
            case 'ArrowRight':
                this.panCanvas(-moveDistance, 0);
                handled = true;
                break;
            case '+':
            case '=':
                this.zoomIn();
                handled = true;
                break;
            case '-':
                this.zoomOut();
                handled = true;
                break;
            case '0':
                this.resetView();
                handled = true;
                break;
            case 'Enter':
            case ' ':
                // Toggle search panel
                this.toggleSearchPanel();
                handled = true;
                break;
        }
        
        if (handled) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
    
    /**
     * Setup keyboard navigation for search panel
     */
    private setupSearchPanelKeyboard() {
        if (!this.searchPanel) return;
        
        // Make panel header clickable with keyboard
        const panelHeader = this.searchPanel.querySelector('.oom-search-panel-header');
        if (panelHeader) {
            panelHeader.setAttribute('tabindex', '0');
            panelHeader.setAttribute('role', 'button');
            panelHeader.setAttribute('aria-expanded', 'true');
            
            panelHeader.addEventListener('keydown', (event: KeyboardEvent) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.toggleSearchPanel();
                    
                    // Update aria-expanded
                    const isCollapsed = this.searchPanelContent?.hasClass('collapsed');
                    panelHeader.setAttribute('aria-expanded', (!isCollapsed).toString());
                }
            });
        }
        
        // Improve form navigation within search panel
        const searchInput = this.searchPanel.querySelector('.oom-search-input') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    searchInput.blur();
                    this.canvasEl.focus();
                }
            });
        }
    }
    
    /**
     * Handle escape key actions
     */
    private handleEscapeKey(event: KeyboardEvent) {
        let handled = false;
        
        // Close dream content panel if open
        if (this.state.selectedDream && this.state.dreamContentVisible) {
            this.closeDreamContent();
            handled = true;
        }
        // Clear node selection
        else if (this.state.selectedNode) {
            this.state.selectedNode = null;
            this.render();
            handled = true;
        }
        // Clear cluster selection
        else if (this.state.selectedCluster) {
            this.state.selectedCluster = null;
            this.render();
            handled = true;
        }
        // Focus canvas if nothing else to clear
        else {
            this.canvasEl.focus();
            handled = true;
        }
        
        if (handled) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
    
    /**
     * Focus the search input
     */
    private focusSearchInput() {
        const searchInput = this.containerEl.querySelector('.oom-search-input') as HTMLInputElement;
        if (searchInput) {
            // Expand search panel if collapsed
            if (this.searchPanelContent?.hasClass('collapsed')) {
                this.toggleSearchPanel();
            }
            searchInput.focus();
        }
    }
    
    /**
     * Pan the canvas by specified amounts
     */
    private panCanvas(deltaX: number, deltaY: number) {
        this.state.panPosition.x += deltaX;
        this.state.panPosition.y += deltaY;
        this.render();
    }
    
    /**
     * Close dream content panel
     */
    private closeDreamContent() {
        this.state.selectedDream = null;
        this.state.dreamContentVisible = false;
        
        // Remove existing dream content panel
        const existingPanel = this.containerEl.querySelector('.oom-dream-content-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        this.render();
    }
    
    /**
     * Show loading indicator
     */
    private showLoading() {
        const loadingEl = this.containerEl.createDiv({ cls: 'oom-oneirograph-loading' });
        loadingEl.createSpan({ text: 'Loading Oneirograph...' });
    }
    
    /**
     * Hide loading indicator
     */
    private hideLoading() {
        const loadingEl = this.containerEl.querySelector('.oom-oneirograph-loading');
        if (loadingEl) {
            loadingEl.remove();
        }
    }
    
    /**
     * Show error message
     */
    private showError(message: string) {
        const errorEl = this.containerEl.createDiv({ cls: 'oom-oneirograph-error' });
        errorEl.createSpan({ text: message });
    }
}
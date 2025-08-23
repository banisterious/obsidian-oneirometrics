/**
 * OneirographView - Interactive force-directed graph visualization for dream data
 * 
 * This view creates a visual "galaxy" of dream entries organized by taxonomy clusters,
 * providing an intuitive way to explore relationships and patterns in dream data.
 */

import { ItemView, WorkspaceLeaf, Notice, ButtonComponent, SliderComponent } from 'obsidian';
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
            isLoading: true
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
        
        // FPS counter
        const fpsContainer = this.controlsEl.createDiv({ cls: 'oom-oneirograph-fps' });
        this.updateFpsDisplay(fpsContainer);
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
            
            // Build graph data
            this.buildGraphData();
            
            // Initialize force simulation with data
            this.forceSimulation.setData(this.state.nodes, this.state.links);
            
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
     * Get files to process based on plugin settings
     */
    private async getFilesToProcess(): Promise<string[]> {
        const files: string[] = [];
        const selectedFolder = this.plugin.settings.selectedFolder || '/';
        
        // Get all files in the selected folder
        const folder = this.plugin.app.vault.getAbstractFileByPath(selectedFolder);
        if (folder && 'children' in folder) {
            const folderObj = folder as any;
            for (const child of folderObj.children) {
                if ('extension' in child && child.extension === 'md') {
                    files.push(child.path);
                }
            }
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
        
        // Create dream nodes and links
        for (const dream of this.state.dreams) {
            const themes = this.extractThemes(dream);
            const clusterIds = this.getClusterIdsForThemes(themes);
            
            if (clusterIds.length > 0) {
                const dreamNode: OneirographNode = {
                    id: dream.source.toString(),
                    type: 'dream',
                    data: dream,
                    clusterId: clusterIds[0], // Primary cluster
                    themes: themes,
                    radius: 5,
                    color: this.getDreamColor(clusterIds[0]),
                    label: dream.title || 'Untitled',
                    date: new Date(dream.date)
                };
                nodes.push(dreamNode);
                nodeMap.set(dreamNode.id, dreamNode);
                
                // Create links to clusters
                for (const clusterId of clusterIds) {
                    const clusterNode = nodeMap.get(clusterId);
                    if (clusterNode) {
                        links.push({
                            source: dreamNode,
                            target: clusterNode,
                            strength: 0.1,
                            type: 'cluster'
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
        
        // Dynamically find metrics with category "theme" from plugin settings
        if (this.plugin.settings?.metrics) {
            for (const [metricName, metricConfig] of Object.entries(this.plugin.settings.metrics)) {
                if (metricConfig.category === 'theme' && metricConfig.enabled) {
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
                                themes.push(...value.map(v => String(v).trim()));
                            } else if (typeof value === 'string') {
                                themes.push(...value.split(',').map(t => t.trim()).filter(t => t.length > 0));
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
            this.zoomToCluster(node.id);
        } else if (node.type === 'dream') {
            this.showDreamDetails(node);
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
     * Show dream details
     */
    private showDreamDetails(node: OneirographNode) {
        if (node.type === 'dream' && node.data) {
            const dream = node.data as DreamMetricData;
            // TODO: Implement dream details panel
            new Notice(`Dream: ${dream.title || 'Untitled'} - ${dream.date}`);
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
/**
 * CanvasRenderer - Efficient canvas-based rendering for Oneirograph
 * 
 * Handles all drawing operations for the graph visualization, optimized for
 * performance with techniques like dirty rectangles, layering, and LOD.
 */

import { OneirographNode, OneirographLink } from './OneirographView';
import * as d3 from 'd3';
import safeLogger from '../../logging/safe-logger';

export interface RendererOptions {
    performanceMode: boolean;
    showLabels: boolean;
    showConnections: boolean;
    zoomLevel?: number;
    panPosition?: { x: number; y: number };
}

export interface RenderState {
    selectedNode: OneirographNode | null;
    selectedCluster: string | null;
}

/**
 * Canvas renderer for efficient graph visualization
 */
export class CanvasRenderer {
    private ctx: CanvasRenderingContext2D;
    private width: number;
    private height: number;
    private options: RendererOptions;
    private devicePixelRatio: number;
    
    // Rendering layers (for optimization)
    private backgroundCanvas: HTMLCanvasElement;
    private backgroundCtx: CanvasRenderingContext2D;
    private needsBackgroundRedraw = true;
    
    // Color scheme
    private readonly BACKGROUND_COLOR = 'var(--background-primary)';
    private readonly GRID_COLOR = 'var(--background-modifier-border)';
    private readonly TEXT_COLOR = 'var(--text-normal)';
    private readonly TEXT_MUTED = 'var(--text-muted)';
    private readonly SELECTION_COLOR = 'var(--interactive-accent)';
    private readonly LINK_COLOR = 'var(--text-faint)';
    
    // Rendering parameters
    private readonly MIN_LABEL_ZOOM = 0.5;
    private readonly MIN_NODE_SIZE = 2;
    private readonly MAX_NODE_SIZE = 50;
    private readonly GLOW_RADIUS = 20;
    
    constructor(canvas: HTMLCanvasElement, options: RendererOptions) {
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }
        
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
        this.options = options;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        
        // Create background layer
        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCanvas.width = this.width;
        this.backgroundCanvas.height = this.height;
        const bgCtx = this.backgroundCanvas.getContext('2d');
        if (!bgCtx) {
            throw new Error('Failed to get background canvas context');
        }
        this.backgroundCtx = bgCtx;
        
        // Setup canvas for high DPI displays
        this.setupHighDPI(canvas);
        
        safeLogger.info('Oneirograph', 'Canvas renderer initialized');
    }
    
    /**
     * Setup canvas for high DPI displays
     */
    private setupHighDPI(canvas: HTMLCanvasElement) {
        if (this.devicePixelRatio > 1) {
            canvas.style.width = `${this.width}px`;
            canvas.style.height = `${this.height}px`;
            canvas.width = this.width * this.devicePixelRatio;
            canvas.height = this.height * this.devicePixelRatio;
            this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
        }
    }
    
    /**
     * Update renderer options
     */
    updateOptions(options: Partial<RendererOptions>) {
        const oldPerformanceMode = this.options.performanceMode;
        this.options = { ...this.options, ...options };
        
        // Mark background for redraw if performance mode changed
        if (oldPerformanceMode !== this.options.performanceMode) {
            this.needsBackgroundRedraw = true;
        }
    }
    
    /**
     * Update canvas size
     */
    updateSize(width: number, height: number) {
        this.width = width;
        this.height = height;
        
        // Update background canvas
        this.backgroundCanvas.width = width;
        this.backgroundCanvas.height = height;
        this.needsBackgroundRedraw = true;
        
        // Re-setup high DPI
        if (this.devicePixelRatio > 1) {
            this.ctx.canvas.style.width = `${width}px`;
            this.ctx.canvas.style.height = `${height}px`;
            this.ctx.canvas.width = width * this.devicePixelRatio;
            this.ctx.canvas.height = height * this.devicePixelRatio;
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
        }
    }
    
    /**
     * Main render function
     */
    render(nodes: OneirographNode[], links: OneirographLink[], state: RenderState) {
        const zoom = this.options.zoomLevel || 1;
        const pan = this.options.panPosition || { x: 0, y: 0 };
        
        // Clear canvas
        this.clear();
        
        // Apply transformations
        this.ctx.save();
        this.ctx.translate(pan.x, pan.y);
        this.ctx.scale(zoom, zoom);
        
        // Draw background grid (cached)
        if (this.needsBackgroundRedraw) {
            this.drawBackgroundGrid();
            this.needsBackgroundRedraw = false;
        }
        this.ctx.globalAlpha = 0.3;
        this.ctx.drawImage(this.backgroundCanvas, -pan.x / zoom, -pan.y / zoom);
        this.ctx.globalAlpha = 1;
        
        // Draw in layers for optimal performance
        if (!this.options.performanceMode) {
            // Draw cluster boundaries (convex hulls)
            this.drawClusterBoundaries(nodes);
        }
        
        // Draw connections
        if (this.options.showConnections) {
            this.drawLinks(links, nodes, state);
        }
        
        // Draw nodes
        this.drawNodes(nodes, state);
        
        // Draw labels
        if (this.options.showLabels && zoom >= this.MIN_LABEL_ZOOM) {
            this.drawLabels(nodes, state);
        }
        
        // Restore context
        this.ctx.restore();
        
        // Draw UI overlays (not affected by zoom/pan)
        this.drawOverlays(state);
    }
    
    /**
     * Clear the canvas
     */
    private clear() {
        // Use computed style to get actual background color
        const bgColor = getComputedStyle(document.body).getPropertyValue('--background-primary') || '#ffffff';
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    /**
     * Draw background grid
     */
    private drawBackgroundGrid() {
        const gridSize = 50;
        const gridColor = getComputedStyle(document.body).getPropertyValue('--background-modifier-border') || '#e0e0e0';
        
        this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        this.backgroundCtx.strokeStyle = gridColor;
        this.backgroundCtx.lineWidth = 0.5;
        this.backgroundCtx.globalAlpha = 0.2;
        
        // Vertical lines
        for (let x = 0; x <= this.backgroundCanvas.width; x += gridSize) {
            this.backgroundCtx.beginPath();
            this.backgroundCtx.moveTo(x, 0);
            this.backgroundCtx.lineTo(x, this.backgroundCanvas.height);
            this.backgroundCtx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.backgroundCanvas.height; y += gridSize) {
            this.backgroundCtx.beginPath();
            this.backgroundCtx.moveTo(0, y);
            this.backgroundCtx.lineTo(this.backgroundCanvas.width, y);
            this.backgroundCtx.stroke();
        }
        
        this.backgroundCtx.globalAlpha = 1;
    }
    
    /**
     * Draw cluster boundaries using convex hulls
     */
    private drawClusterBoundaries(nodes: OneirographNode[]) {
        const clusterGroups = new Map<string, OneirographNode[]>();
        
        // Group nodes by cluster
        for (const node of nodes) {
            if (node.type === 'dream' && node.clusterId) {
                const group = clusterGroups.get(node.clusterId) || [];
                group.push(node);
                clusterGroups.set(node.clusterId, group);
            }
        }
        
        // Draw convex hull for each cluster
        for (const [clusterId, clusterNodes] of clusterGroups) {
            if (clusterNodes.length < 3) continue;
            
            // Get cluster node for color
            const clusterNode = nodes.find(n => n.type === 'cluster' && n.id === clusterId);
            if (!clusterNode) continue;
            
            // Calculate convex hull
            const points: [number, number][] = clusterNodes
                .filter(n => n.x !== undefined && n.y !== undefined)
                .map(n => [n.x!, n.y!]);
            
            if (points.length < 3) continue;
            
            const hull = d3.polygonHull(points);
            if (!hull) continue;
            
            // Draw filled hull
            this.ctx.fillStyle = clusterNode.color;
            this.ctx.globalAlpha = 0.05;
            this.ctx.beginPath();
            hull.forEach((point, i) => {
                if (i === 0) {
                    this.ctx.moveTo(point[0], point[1]);
                } else {
                    this.ctx.lineTo(point[0], point[1]);
                }
            });
            this.ctx.closePath();
            this.ctx.fill();
            
            // Draw hull border
            this.ctx.strokeStyle = clusterNode.color;
            this.ctx.globalAlpha = 0.2;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    /**
     * Draw links between nodes
     */
    private drawLinks(links: OneirographLink[], nodes: OneirographNode[], state: RenderState) {
        const linkColor = getComputedStyle(document.body).getPropertyValue('--text-faint') || '#999999';
        
        for (const link of links) {
            const source = typeof link.source === 'string' 
                ? nodes.find(n => n.id === link.source)
                : link.source;
            const target = typeof link.target === 'string'
                ? nodes.find(n => n.id === link.target)
                : link.target;
            
            if (!source || !target || 
                source.x === undefined || source.y === undefined ||
                target.x === undefined || target.y === undefined) continue;
            
            // Determine link opacity based on selection
            let opacity = 0.1;
            if (state.selectedNode) {
                if (source.id === state.selectedNode.id || target.id === state.selectedNode.id) {
                    opacity = 0.5;
                }
            } else if (state.selectedCluster) {
                if (source.clusterId === state.selectedCluster || target.clusterId === state.selectedCluster) {
                    opacity = 0.3;
                }
            }
            
            // Draw link
            this.ctx.strokeStyle = linkColor;
            this.ctx.globalAlpha = opacity;
            this.ctx.lineWidth = Math.max(0.5, link.strength * 5);
            this.ctx.beginPath();
            this.ctx.moveTo(source.x, source.y);
            this.ctx.lineTo(target.x, target.y);
            this.ctx.stroke();
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    /**
     * Draw nodes
     */
    private drawNodes(nodes: OneirographNode[], state: RenderState) {
        const zoom = this.options.zoomLevel || 1;
        
        for (const node of nodes) {
            if (node.x === undefined || node.y === undefined) continue;
            
            // Calculate node size based on type and zoom
            let radius = node.radius;
            if (this.options.performanceMode) {
                radius = Math.max(this.MIN_NODE_SIZE, Math.min(this.MAX_NODE_SIZE, radius * zoom));
            }
            
            // Check if node is selected or highlighted
            const isSelected = state.selectedNode?.id === node.id;
            const isInSelectedCluster = state.selectedCluster && node.clusterId === state.selectedCluster;
            
            // Draw glow for selected nodes
            if (isSelected) {
                const gradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius + this.GLOW_RADIUS);
                gradient.addColorStop(0, node.color);
                gradient.addColorStop(0.5, node.color + '40');
                gradient.addColorStop(1, node.color + '00');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, radius + this.GLOW_RADIUS, 0, 2 * Math.PI);
                this.ctx.fill();
            }
            
            // Draw node
            this.ctx.fillStyle = node.color;
            this.ctx.globalAlpha = isInSelectedCluster ? 1 : (state.selectedCluster ? 0.3 : 1);
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Draw border for cluster nodes
            if (node.type === 'cluster') {
                this.ctx.strokeStyle = isSelected ? 
                    getComputedStyle(document.body).getPropertyValue('--interactive-accent') || '#4CAF50' :
                    getComputedStyle(document.body).getPropertyValue('--text-muted') || '#666666';
                this.ctx.lineWidth = isSelected ? 3 : 2;
                this.ctx.stroke();
            }
            
            this.ctx.globalAlpha = 1;
        }
    }
    
    /**
     * Draw labels for nodes
     */
    private drawLabels(nodes: OneirographNode[], state: RenderState) {
        const zoom = this.options.zoomLevel || 1;
        const textColor = getComputedStyle(document.body).getPropertyValue('--text-normal') || '#000000';
        const mutedColor = getComputedStyle(document.body).getPropertyValue('--text-muted') || '#666666';
        
        this.ctx.font = `${Math.max(10, 12 / zoom)}px var(--font-interface)`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (const node of nodes) {
            if (node.x === undefined || node.y === undefined) continue;
            
            // Only show labels for cluster nodes and selected nodes
            if (node.type === 'cluster' || state.selectedNode?.id === node.id) {
                // Draw label background
                const label = node.label;
                const metrics = this.ctx.measureText(label);
                const padding = 4;
                const bgHeight = 20 / zoom;
                
                this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--background-primary') || '#ffffff';
                this.ctx.globalAlpha = 0.8;
                this.ctx.fillRect(
                    node.x - metrics.width / 2 - padding,
                    node.y + node.radius + 5 / zoom,
                    metrics.width + padding * 2,
                    bgHeight
                );
                
                // Draw label text
                this.ctx.globalAlpha = 1;
                this.ctx.fillStyle = node.type === 'cluster' ? textColor : mutedColor;
                this.ctx.fillText(label, node.x, node.y + node.radius + 15 / zoom);
            }
        }
    }
    
    /**
     * Draw UI overlays
     */
    private drawOverlays(state: RenderState) {
        // Draw selection info
        if (state.selectedNode) {
            const info = `Selected: ${state.selectedNode.label}`;
            this.ctx.font = '14px var(--font-interface)';
            this.ctx.textAlign = 'left';
            this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-normal') || '#000000';
            
            const metrics = this.ctx.measureText(info);
            const padding = 10;
            
            // Draw background
            this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--background-secondary') || '#f0f0f0';
            this.ctx.fillRect(10, 10, metrics.width + padding * 2, 30);
            
            // Draw text
            this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-normal') || '#000000';
            this.ctx.fillText(info, 10 + padding, 25);
        }
    }
}
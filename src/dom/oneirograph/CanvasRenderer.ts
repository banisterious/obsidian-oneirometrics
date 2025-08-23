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
            // Phase 4: Draw vector sub-cluster boundaries
            this.drawVectorBoundaries(nodes);
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
     * Phase 4: Draw vector boundaries using sub-clustering
     */
    private drawVectorBoundaries(nodes: OneirographNode[]) {
        // Group vector nodes by their parent cluster and calculate sub-clusters
        const clusterVectorMap = new Map<string, OneirographNode[]>();
        
        // First, group vectors by cluster
        for (const node of nodes) {
            if (node.type === 'vector' && node.clusterId) {
                const existing = clusterVectorMap.get(node.clusterId) || [];
                existing.push(node);
                clusterVectorMap.set(node.clusterId, existing);
            }
        }
        
        // For each cluster, create sub-clusters of vectors based on proximity
        for (const [clusterId, vectorNodes] of clusterVectorMap) {
            if (vectorNodes.length < 2) continue;
            
            // Find the cluster node for color reference
            const clusterNode = nodes.find(n => n.type === 'cluster' && n.id === clusterId);
            if (!clusterNode) continue;
            
            // Create sub-clusters using proximity-based grouping
            const subClusters = this.createVectorSubClusters(vectorNodes, clusterNode);
            
            // Draw boundary for each sub-cluster
            for (const subCluster of subClusters) {
                if (subCluster.length < 2) continue;
                
                // Include dreams connected to these vectors for boundary calculation
                const boundaryNodes = [...subCluster];
                for (const vectorNode of subCluster) {
                    const connectedDreams = nodes.filter(n => 
                        n.type === 'dream' && 
                        n.vectorIds?.includes(vectorNode.id) &&
                        n.x !== undefined && n.y !== undefined
                    );
                    boundaryNodes.push(...connectedDreams);
                }
                
                if (boundaryNodes.length < 3) continue;
                
                this.drawVectorSubClusterBoundary(boundaryNodes, clusterNode.color);
            }
        }
    }
    
    /**
     * Create vector sub-clusters based on spatial proximity
     */
    private createVectorSubClusters(vectorNodes: OneirographNode[], clusterNode: OneirographNode): OneirographNode[][] {
        const subClusters: OneirographNode[][] = [];
        const processed = new Set<string>();
        const proximityThreshold = 120; // Distance threshold for grouping
        
        for (const node of vectorNodes) {
            if (processed.has(node.id)) continue;
            if (node.x === undefined || node.y === undefined) continue;
            
            const subCluster: OneirographNode[] = [node];
            processed.add(node.id);
            
            // Find nearby vectors
            for (const otherNode of vectorNodes) {
                if (processed.has(otherNode.id)) continue;
                if (otherNode.x === undefined || otherNode.y === undefined) continue;
                
                const dx = node.x - otherNode.x;
                const dy = node.y - otherNode.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= proximityThreshold) {
                    subCluster.push(otherNode);
                    processed.add(otherNode.id);
                }
            }
            
            subClusters.push(subCluster);
        }
        
        return subClusters;
    }
    
    /**
     * Draw boundary around a vector sub-cluster
     */
    private drawVectorSubClusterBoundary(nodes: OneirographNode[], clusterColor: string) {
        const points: [number, number][] = nodes
            .filter(n => n.x !== undefined && n.y !== undefined)
            .map(n => [n.x!, n.y!]);
        
        if (points.length < 3) return;
        
        const hull = d3.polygonHull(points);
        if (!hull) return;
        
        // Expand hull slightly for padding
        const expandedHull = this.expandHull(hull, 15);
        
        // Draw filled boundary with low opacity
        this.ctx.fillStyle = clusterColor;
        this.ctx.globalAlpha = 0.08;
        this.ctx.beginPath();
        expandedHull.forEach((point, i) => {
            if (i === 0) {
                this.ctx.moveTo(point[0], point[1]);
            } else {
                this.ctx.lineTo(point[0], point[1]);
            }
        });
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw border with dashed line to distinguish from cluster boundaries
        this.ctx.strokeStyle = clusterColor;
        this.ctx.globalAlpha = 0.3;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]); // Dashed line
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset to solid line
        
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Expand convex hull outward by a given distance
     */
    private expandHull(hull: [number, number][], expandBy: number): [number, number][] {
        if (hull.length < 3) return hull;
        
        // Calculate centroid
        const centroidX = hull.reduce((sum, p) => sum + p[0], 0) / hull.length;
        const centroidY = hull.reduce((sum, p) => sum + p[1], 0) / hull.length;
        
        // Expand each point outward from centroid
        return hull.map(([x, y]) => {
            const dx = x - centroidX;
            const dy = y - centroidY;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            
            const expandFactor = (distance + expandBy) / distance;
            return [
                centroidX + dx * expandFactor,
                centroidY + dy * expandFactor
            ] as [number, number];
        });
    }
    
    /**
     * Draw explicit connection lines between nodes
     * Phase 4: Enhanced with hierarchical styling and better visibility
     */
    private drawLinks(links: OneirographLink[], nodes: OneirographNode[], state: RenderState) {
        const linkColor = getComputedStyle(document.body).getPropertyValue('--text-faint') || '#999999';
        const accentColor = getComputedStyle(document.body).getPropertyValue('--interactive-accent') || '#007acc';
        
        // Sort links by type for consistent drawing order
        const sortedLinks = [...links].sort((a, b) => {
            const order = { cluster: 1, vector: 2, theme: 3 };
            return (order[a.type as keyof typeof order] || 4) - (order[b.type as keyof typeof order] || 4);
        });
        
        for (const link of sortedLinks) {
            const source = typeof link.source === 'string' 
                ? nodes.find(n => n.id === link.source)
                : link.source;
            const target = typeof link.target === 'string'
                ? nodes.find(n => n.id === link.target)
                : link.target;
            
            if (!source || !target || 
                source.x === undefined || source.y === undefined ||
                target.x === undefined || target.y === undefined) continue;
            
            // Skip links involving filtered nodes (Phase 4: Live filtering)
            if ((source as any).filtered || (target as any).filtered) continue;
            
            // Determine link styling based on type and selection
            const linkStyle = this.getLinkStyle(link, source, target, state);
            
            this.ctx.strokeStyle = linkStyle.color;
            this.ctx.globalAlpha = linkStyle.opacity;
            this.ctx.lineWidth = linkStyle.width;
            
            // Apply dash pattern for vector connections
            if (link.type === 'vector') {
                this.ctx.setLineDash([5, 3]);
            } else if (link.type === 'theme') {
                this.ctx.setLineDash([2, 2]);
            } else {
                this.ctx.setLineDash([]);
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(source.x, source.y);
            this.ctx.lineTo(target.x, target.y);
            this.ctx.stroke();
            
            // Draw arrowhead for hierarchical relationships
            if (linkStyle.showArrow) {
                this.drawArrowhead(source.x, source.y, target.x, target.y, linkStyle.width);
            }
        }
        
        // Reset line dash and alpha
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Get styling for a specific link based on type and state
     */
    private getLinkStyle(link: OneirographLink, source: OneirographNode, target: OneirographNode, state: RenderState) {
        const linkColor = getComputedStyle(document.body).getPropertyValue('--text-faint') || '#999999';
        const accentColor = getComputedStyle(document.body).getPropertyValue('--interactive-accent') || '#007acc';
        
        // Base styling by link type
        let baseStyle = {
            color: linkColor,
            opacity: 0.2,
            width: 1,
            showArrow: false
        };
        
        switch (link.type) {
            case 'cluster':
                baseStyle = {
                    color: accentColor,
                    opacity: 0.4,
                    width: 2,
                    showArrow: true
                };
                break;
            case 'vector':
                baseStyle = {
                    color: linkColor,
                    opacity: 0.3,
                    width: 1.5,
                    showArrow: true
                };
                break;
            case 'theme':
                baseStyle = {
                    color: linkColor,
                    opacity: 0.15,
                    width: 1,
                    showArrow: false
                };
                break;
        }
        
        // Enhanced visibility for selected nodes
        if (state.selectedNode) {
            if (source.id === state.selectedNode.id || target.id === state.selectedNode.id) {
                return {
                    ...baseStyle,
                    opacity: Math.min(baseStyle.opacity * 3, 0.8),
                    width: baseStyle.width + 1,
                    color: accentColor
                };
            }
        } else if (state.selectedCluster) {
            if (source.clusterId === state.selectedCluster || target.clusterId === state.selectedCluster) {
                return {
                    ...baseStyle,
                    opacity: Math.min(baseStyle.opacity * 2, 0.6),
                    width: baseStyle.width + 0.5
                };
            }
        }
        
        return baseStyle;
    }
    
    /**
     * Draw arrowhead for directional links
     */
    private drawArrowhead(sourceX: number, sourceY: number, targetX: number, targetY: number, lineWidth: number) {
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        // Normalize direction vector
        const unitX = dx / distance;
        const unitY = dy / distance;
        
        // Calculate arrowhead size based on line width
        const arrowLength = Math.max(8, lineWidth * 4);
        const arrowWidth = Math.max(4, lineWidth * 2);
        
        // Position arrowhead just before the target node
        const offsetDistance = 15; // Distance from target node edge
        const arrowX = targetX - unitX * offsetDistance;
        const arrowY = targetY - unitY * offsetDistance;
        
        // Calculate arrowhead points
        const perpX = -unitY;
        const perpY = unitX;
        
        const tipX = arrowX;
        const tipY = arrowY;
        const leftX = arrowX - unitX * arrowLength + perpX * arrowWidth;
        const leftY = arrowY - unitY * arrowLength + perpY * arrowWidth;
        const rightX = arrowX - unitX * arrowLength - perpX * arrowWidth;
        const rightY = arrowY - unitY * arrowLength - perpY * arrowWidth;
        
        // Draw filled arrowhead
        this.ctx.beginPath();
        this.ctx.moveTo(tipX, tipY);
        this.ctx.lineTo(leftX, leftY);
        this.ctx.lineTo(rightX, rightY);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * Draw nodes
     */
    private drawNodes(nodes: OneirographNode[], state: RenderState) {
        const zoom = this.options.zoomLevel || 1;
        
        for (const node of nodes) {
            if (node.x === undefined || node.y === undefined) continue;
            
            // Skip filtered nodes (Phase 4: Live filtering)
            if ((node as any).filtered) continue;
            
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
            
            // Skip filtered nodes (Phase 4: Live filtering)
            if ((node as any).filtered) continue;
            
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
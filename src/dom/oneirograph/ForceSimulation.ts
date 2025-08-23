/**
 * ForceSimulation - D3.js force-directed graph simulation for Oneirograph
 * 
 * Manages the physics simulation that positions nodes based on forces like
 * clustering, repulsion, and chronological ordering.
 */

import * as d3 from 'd3';
import { OneirographNode, OneirographLink } from './OneirographView';
import safeLogger from '../../logging/safe-logger';

export interface ForceSimulationOptions {
    width: number;
    height: number;
    onTick?: () => void;
    useWebWorker?: boolean;
}

/**
 * Force simulation wrapper for managing node positioning
 */
export class ForceSimulation {
    private simulation: d3.Simulation<OneirographNode, OneirographLink>;
    private nodes: OneirographNode[] = [];
    private links: OneirographLink[] = [];
    private width: number;
    private height: number;
    private onTick?: () => void;
    
    // Force strengths
    private readonly CLUSTER_STRENGTH = 0.3;
    private readonly LINK_STRENGTH = 0.1;
    private readonly CHARGE_STRENGTH = -100;
    private readonly COLLISION_RADIUS_FACTOR = 1.5;
    private readonly CENTER_FORCE = 0.05;
    
    constructor(canvas: HTMLCanvasElement, options: ForceSimulationOptions) {
        this.width = options.width;
        this.height = options.height;
        this.onTick = options.onTick;
        
        // Initialize D3 force simulation
        this.simulation = d3.forceSimulation<OneirographNode, OneirographLink>()
            .force('center', d3.forceCenter(this.width / 2, this.height / 2).strength(this.CENTER_FORCE))
            .force('charge', d3.forceManyBody().strength(this.CHARGE_STRENGTH))
            .force('collision', d3.forceCollide<OneirographNode>().radius(d => d.radius * this.COLLISION_RADIUS_FACTOR))
            .alphaDecay(0.02)
            .velocityDecay(0.4);
        
        // Set up tick handler
        this.simulation.on('tick', () => {
            this.constrainNodes();
            if (this.onTick) {
                this.onTick();
            }
        });
        
        safeLogger.info('Oneirograph', 'Force simulation initialized');
    }
    
    /**
     * Set or update the simulation data
     */
    setData(nodes: OneirographNode[], links: OneirographLink[]) {
        this.nodes = nodes;
        this.links = links;
        
        // Update simulation nodes
        this.simulation.nodes(this.nodes);
        
        // Create link force
        const linkForce = d3.forceLink<OneirographNode, OneirographLink>(this.links)
            .id(d => d.id)
            .distance(d => this.getLinkDistance(d))
            .strength(d => d.strength || this.LINK_STRENGTH);
        
        this.simulation.force('link', linkForce);
        
        // Add custom forces
        this.addClusterForce();
        this.addChronologicalForce();
        this.addThematicForce();
        
        // Restart simulation
        this.simulation.alpha(1).restart();
        
        safeLogger.info('Oneirograph', `Simulation updated with ${nodes.length} nodes and ${links.length} links`);
    }
    
    /**
     * Add custom cluster force to group nodes by cluster
     */
    private addClusterForce() {
        const clusterCenters = new Map<string, { x: number; y: number; count: number }>();
        
        // Calculate cluster centers
        for (const node of this.nodes) {
            if (node.type === 'cluster') {
                clusterCenters.set(node.id, {
                    x: node.x || this.width / 2,
                    y: node.y || this.height / 2,
                    count: 0
                });
            }
        }
        
        // Custom cluster force
        const clusterForce = (alpha: number) => {
            for (const node of this.nodes) {
                if (node.type === 'dream' && node.clusterId) {
                    const center = clusterCenters.get(node.clusterId);
                    if (center && node.x !== undefined && node.y !== undefined) {
                        // Apply force towards cluster center
                        const dx = (center.x - node.x) * alpha * this.CLUSTER_STRENGTH;
                        const dy = (center.y - node.y) * alpha * this.CLUSTER_STRENGTH;
                        
                        node.vx = (node.vx || 0) + dx;
                        node.vy = (node.vy || 0) + dy;
                    }
                }
            }
        };
        
        this.simulation.force('cluster', clusterForce);
    }
    
    /**
     * Add chronological force to position dreams by date
     */
    private addChronologicalForce() {
        // Get date range
        const dreamNodes = this.nodes.filter(n => n.type === 'dream' && n.date);
        if (dreamNodes.length === 0) return;
        
        const dates = dreamNodes.map(n => n.date!.getTime());
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const dateRange = maxDate - minDate || 1;
        
        // Chronological force - subtle vertical positioning by date
        const chronoForce = (alpha: number) => {
            for (const node of dreamNodes) {
                if (node.date && node.y !== undefined) {
                    // Map date to vertical position (newer at top)
                    const dateRatio = (node.date.getTime() - minDate) / dateRange;
                    const targetY = this.height * (0.2 + dateRatio * 0.6); // Use middle 60% of height
                    
                    const dy = (targetY - node.y) * alpha * 0.1; // Weak force
                    node.vy = (node.vy || 0) + dy;
                }
            }
        };
        
        this.simulation.force('chronological', chronoForce);
    }
    
    /**
     * Add thematic force to group dreams with similar themes
     */
    private addThematicForce() {
        // Build theme similarity map
        const themeSimilarity = new Map<string, Map<string, number>>();
        
        for (const node1 of this.nodes) {
            if (node1.type === 'dream' && node1.themes) {
                const similarityMap = new Map<string, number>();
                
                for (const node2 of this.nodes) {
                    if (node2.type === 'dream' && node2.themes && node1.id !== node2.id) {
                        // Calculate Jaccard similarity
                        const themes1 = new Set(node1.themes);
                        const themes2 = new Set(node2.themes);
                        const intersection = new Set([...themes1].filter(x => themes2.has(x)));
                        const union = new Set([...themes1, ...themes2]);
                        
                        if (union.size > 0) {
                            const similarity = intersection.size / union.size;
                            if (similarity > 0.2) { // Only consider significant similarities
                                similarityMap.set(node2.id, similarity);
                            }
                        }
                    }
                }
                
                themeSimilarity.set(node1.id, similarityMap);
            }
        }
        
        // Apply thematic attraction force
        const thematicForce = (alpha: number) => {
            for (const [nodeId, similarities] of themeSimilarity) {
                const node1 = this.nodes.find(n => n.id === nodeId);
                if (!node1 || node1.x === undefined || node1.y === undefined) continue;
                
                for (const [otherId, similarity] of similarities) {
                    const node2 = this.nodes.find(n => n.id === otherId);
                    if (!node2 || node2.x === undefined || node2.y === undefined) continue;
                    
                    // Apply weak attraction based on similarity
                    const dx = node2.x - node1.x;
                    const dy = node2.y - node1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    
                    const force = similarity * alpha * 0.05; // Very weak force
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;
                    
                    node1.vx = (node1.vx || 0) + fx;
                    node1.vy = (node1.vy || 0) + fy;
                    node2.vx = (node2.vx || 0) - fx;
                    node2.vy = (node2.vy || 0) - fy;
                }
            }
        };
        
        this.simulation.force('thematic', thematicForce);
    }
    
    /**
     * Get link distance based on link type
     */
    private getLinkDistance(link: OneirographLink): number {
        switch (link.type) {
            case 'cluster':
                return 100;
            case 'vector':
                return 60;
            case 'theme':
                return 40;
            default:
                return 80;
        }
    }
    
    /**
     * Constrain nodes to canvas bounds
     */
    private constrainNodes() {
        const padding = 50;
        
        for (const node of this.nodes) {
            if (node.x !== undefined) {
                node.x = Math.max(padding, Math.min(this.width - padding, node.x));
            }
            if (node.y !== undefined) {
                node.y = Math.max(padding, Math.min(this.height - padding, node.y));
            }
        }
    }
    
    /**
     * Update simulation size
     */
    updateSize(width: number, height: number) {
        this.width = width;
        this.height = height;
        
        // Update center force
        this.simulation.force('center', d3.forceCenter(width / 2, height / 2).strength(this.CENTER_FORCE));
        
        // Restart simulation with low alpha to adjust positions
        this.simulation.alpha(0.3).restart();
    }
    
    /**
     * Reset node positions
     */
    resetPositions() {
        // Reset cluster positions in a circle
        const clusterNodes = this.nodes.filter(n => n.type === 'cluster');
        const angleStep = (2 * Math.PI) / clusterNodes.length;
        const radius = Math.min(this.width, this.height) * 0.3;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        clusterNodes.forEach((node, i) => {
            node.x = centerX + radius * Math.cos(i * angleStep);
            node.y = centerY + radius * Math.sin(i * angleStep);
            node.vx = 0;
            node.vy = 0;
        });
        
        // Reset dream positions near their clusters
        for (const node of this.nodes) {
            if (node.type === 'dream' && node.clusterId) {
                const cluster = clusterNodes.find(c => c.id === node.clusterId);
                if (cluster && cluster.x !== undefined && cluster.y !== undefined) {
                    const angle = Math.random() * 2 * Math.PI;
                    const distance = 50 + Math.random() * 50;
                    node.x = cluster.x + distance * Math.cos(angle);
                    node.y = cluster.y + distance * Math.sin(angle);
                    node.vx = 0;
                    node.vy = 0;
                }
            }
        }
        
        // Restart simulation
        this.simulation.alpha(1).restart();
    }
    
    /**
     * Start the simulation
     */
    start() {
        this.simulation.restart();
    }
    
    /**
     * Stop the simulation
     */
    stop() {
        this.simulation.stop();
    }
    
    /**
     * Get current alpha value (simulation "heat")
     */
    getAlpha(): number {
        return this.simulation.alpha();
    }
    
    /**
     * Find node at position
     */
    findNodeAt(x: number, y: number, radius: number = 10): OneirographNode | null {
        for (const node of this.nodes) {
            if (node.x !== undefined && node.y !== undefined) {
                const dx = x - node.x;
                const dy = y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= node.radius + radius) {
                    return node;
                }
            }
        }
        return null;
    }
    
    /**
     * Clean up and destroy the simulation
     */
    destroy() {
        this.simulation.stop();
        this.simulation.on('tick', null);
        this.nodes = [];
        this.links = [];
        safeLogger.info('Oneirograph', 'Force simulation destroyed');
    }
}
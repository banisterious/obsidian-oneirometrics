/**
 * OneirographInteractions - Handle user interactions for the Oneirograph
 * 
 * Manages mouse events, touch events, and keyboard shortcuts for navigating
 * and interacting with the graph visualization.
 */

import { OneirographNode } from './OneirographView';
import { ForceSimulation } from './ForceSimulation';
import safeLogger from '../../logging/safe-logger';

export interface InteractionCallbacks {
    onNodeClick?: (node: OneirographNode) => void;
    onNodeHover?: (node: OneirographNode | null) => void;
    onPan?: (dx: number, dy: number) => void;
    onZoom?: (delta: number) => void;
}

/**
 * Interaction handler for the Oneirograph
 */
export class OneirographInteractions {
    private canvas: HTMLCanvasElement;
    private overlay: HTMLElement;
    private callbacks: InteractionCallbacks;
    private tooltipEl: HTMLElement | null = null;
    
    // Interaction state
    private isDragging = false;
    private isPanning = false;
    private lastMousePos = { x: 0, y: 0 };
    private currentMousePos = { x: 0, y: 0 };
    private hoveredNode: OneirographNode | null = null;
    
    // Touch support
    private touchStartDistance = 0;
    private lastTouchCenter = { x: 0, y: 0 };
    
    // Event listeners (for cleanup)
    private boundHandlers: Map<string, EventListener> = new Map();
    
    constructor(canvas: HTMLCanvasElement, overlay: HTMLElement, callbacks: InteractionCallbacks) {
        this.canvas = canvas;
        this.overlay = overlay;
        this.callbacks = callbacks;
        
        this.setupEventListeners();
        this.createTooltip();
        
        safeLogger.info('Oneirograph', 'Interactions initialized');
    }
    
    /**
     * Setup all event listeners
     */
    private setupEventListeners() {
        // Mouse events
        this.addEventHandler('mousedown', this.handleMouseDown.bind(this));
        this.addEventHandler('mousemove', this.handleMouseMove.bind(this));
        this.addEventHandler('mouseup', this.handleMouseUp.bind(this));
        this.addEventHandler('wheel', this.handleWheel.bind(this));
        this.addEventHandler('dblclick', this.handleDoubleClick.bind(this));
        
        // Touch events for mobile
        this.addEventHandler('touchstart', this.handleTouchStart.bind(this));
        this.addEventHandler('touchmove', this.handleTouchMove.bind(this));
        this.addEventHandler('touchend', this.handleTouchEnd.bind(this));
        
        // Keyboard events
        this.addEventHandler('keydown', this.handleKeyDown.bind(this), document);
        
        // Context menu
        this.addEventHandler('contextmenu', this.handleContextMenu.bind(this));
    }
    
    /**
     * Add event handler and store for cleanup
     */
    private addEventHandler(event: string, handler: EventListener, target: EventTarget = this.canvas) {
        target.addEventListener(event, handler);
        this.boundHandlers.set(`${event}-${target === this.canvas ? 'canvas' : 'document'}`, handler);
    }
    
    /**
     * Create tooltip element
     */
    private createTooltip() {
        this.tooltipEl = this.overlay.createDiv({ cls: 'oom-oneirograph-tooltip' });
        this.tooltipEl.style.display = 'none';
        this.tooltipEl.style.position = 'absolute';
        this.tooltipEl.style.pointerEvents = 'none';
        this.tooltipEl.style.zIndex = '1000';
    }
    
    /**
     * Handle mouse down
     */
    private handleMouseDown(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.lastMousePos = { x, y };
        
        // Check if clicking on a node
        const node = this.findNodeAt(x, y);
        if (node) {
            if (e.button === 0) { // Left click
                this.callbacks.onNodeClick?.(node);
            }
        } else {
            // Start panning
            if (e.button === 0) {
                this.isPanning = true;
                this.canvas.style.cursor = 'grabbing';
            }
        }
        
        e.preventDefault();
    }
    
    /**
     * Handle mouse move
     */
    private handleMouseMove(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.currentMousePos = { x, y };
        
        if (this.isPanning) {
            // Pan the view
            const dx = x - this.lastMousePos.x;
            const dy = y - this.lastMousePos.y;
            this.callbacks.onPan?.(dx, dy);
            this.lastMousePos = { x, y };
        } else {
            // Check for hover
            const node = this.findNodeAt(x, y);
            if (node !== this.hoveredNode) {
                this.hoveredNode = node;
                this.callbacks.onNodeHover?.(node);
                
                if (node) {
                    this.canvas.style.cursor = 'pointer';
                    this.updateTooltip(node, x, y);
                } else {
                    this.canvas.style.cursor = 'grab';
                    this.hideTooltip();
                }
            } else if (node) {
                // Update tooltip position
                this.updateTooltipPosition(x, y);
            }
        }
    }
    
    /**
     * Handle mouse up
     */
    private handleMouseUp(e: MouseEvent) {
        this.isPanning = false;
        this.isDragging = false;
        this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'grab';
    }
    
    /**
     * Handle mouse wheel for zoom
     */
    private handleWheel(e: WheelEvent) {
        e.preventDefault();
        
        // Zoom based on wheel delta
        const delta = -Math.sign(e.deltaY);
        this.callbacks.onZoom?.(delta);
    }
    
    /**
     * Handle double click for zoom to fit
     */
    private handleDoubleClick(e: MouseEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const node = this.findNodeAt(x, y);
        if (node && node.type === 'cluster') {
            // Zoom to cluster handled by view
            this.callbacks.onNodeClick?.(node);
        }
    }
    
    /**
     * Handle touch start for mobile
     */
    private handleTouchStart(e: TouchEvent) {
        if (e.touches.length === 1) {
            // Single touch - start pan
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.lastTouchCenter = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
            this.isPanning = true;
        } else if (e.touches.length === 2) {
            // Two touches - start pinch zoom
            this.isPanning = false;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            this.touchStartDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            // Calculate center point
            const rect = this.canvas.getBoundingClientRect();
            this.lastTouchCenter = {
                x: ((touch1.clientX + touch2.clientX) / 2) - rect.left,
                y: ((touch1.clientY + touch2.clientY) / 2) - rect.top
            };
        }
        
        e.preventDefault();
    }
    
    /**
     * Handle touch move for mobile
     */
    private handleTouchMove(e: TouchEvent) {
        if (e.touches.length === 1 && this.isPanning) {
            // Pan
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            const dx = x - this.lastTouchCenter.x;
            const dy = y - this.lastTouchCenter.y;
            
            this.callbacks.onPan?.(dx, dy);
            this.lastTouchCenter = { x, y };
        } else if (e.touches.length === 2) {
            // Pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            
            if (this.touchStartDistance > 0) {
                const scale = distance / this.touchStartDistance;
                const delta = scale > 1 ? 1 : -1;
                this.callbacks.onZoom?.(delta);
                this.touchStartDistance = distance;
            }
            
            // Update center for panning
            const rect = this.canvas.getBoundingClientRect();
            const newCenter = {
                x: ((touch1.clientX + touch2.clientX) / 2) - rect.left,
                y: ((touch1.clientY + touch2.clientY) / 2) - rect.top
            };
            
            const dx = newCenter.x - this.lastTouchCenter.x;
            const dy = newCenter.y - this.lastTouchCenter.y;
            this.callbacks.onPan?.(dx, dy);
            this.lastTouchCenter = newCenter;
        }
        
        e.preventDefault();
    }
    
    /**
     * Handle touch end for mobile
     */
    private handleTouchEnd(e: TouchEvent) {
        if (e.touches.length === 0) {
            this.isPanning = false;
            this.touchStartDistance = 0;
        }
    }
    
    /**
     * Handle keyboard shortcuts
     */
    private handleKeyDown(e: KeyboardEvent) {
        // Only handle if canvas is focused or no input is focused
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            return;
        }
        
        switch (e.key) {
            case '+':
            case '=':
                this.callbacks.onZoom?.(1);
                break;
            case '-':
            case '_':
                this.callbacks.onZoom?.(-1);
                break;
            case 'ArrowUp':
                this.callbacks.onPan?.(0, 10);
                break;
            case 'ArrowDown':
                this.callbacks.onPan?.(0, -10);
                break;
            case 'ArrowLeft':
                this.callbacks.onPan?.(10, 0);
                break;
            case 'ArrowRight':
                this.callbacks.onPan?.(-10, 0);
                break;
        }
    }
    
    /**
     * Handle context menu
     */
    private handleContextMenu(e: MouseEvent) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const node = this.findNodeAt(x, y);
        if (node) {
            // TODO: Show context menu for node
            safeLogger.info('Oneirograph', `Context menu for node: ${node.id}`);
        }
    }
    
    /**
     * Find node at canvas position
     * This is a placeholder - actual implementation should use ForceSimulation
     */
    private findNodeAt(x: number, y: number): OneirographNode | null {
        // This will be implemented by the view using ForceSimulation.findNodeAt
        // For now, return null
        return null;
    }
    
    /**
     * Show tooltip for node
     */
    public showTooltip(node: OneirographNode) {
        if (!this.tooltipEl) return;
        
        let content = '';
        if (node.type === 'cluster') {
            content = `
                <div class="oom-oneirograph-tooltip-title">${node.label}</div>
                <div class="oom-oneirograph-tooltip-type">Cluster</div>
            `;
        } else if (node.type === 'dream') {
            const dream = node.data as any;
            content = `
                <div class="oom-oneirograph-tooltip-title">${node.label}</div>
                <div class="oom-oneirograph-tooltip-date">${dream.date}</div>
                ${node.themes ? `<div class="oom-oneirograph-tooltip-themes">Themes: ${node.themes.slice(0, 3).join(', ')}${node.themes.length > 3 ? '...' : ''}</div>` : ''}
            `;
        }
        
        this.tooltipEl.innerHTML = content;
        this.tooltipEl.style.display = 'block';
        
        // Position tooltip
        this.updateTooltipPosition(this.currentMousePos.x, this.currentMousePos.y);
    }
    
    /**
     * Update tooltip position
     */
    private updateTooltip(node: OneirographNode, x: number, y: number) {
        this.showTooltip(node);
        this.updateTooltipPosition(x, y);
    }
    
    /**
     * Update tooltip position
     */
    private updateTooltipPosition(x: number, y: number) {
        if (!this.tooltipEl || this.tooltipEl.style.display === 'none') return;
        
        const offset = 10;
        const rect = this.tooltipEl.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Adjust position to keep tooltip within canvas bounds
        let left = x + offset;
        let top = y + offset;
        
        if (left + rect.width > canvasRect.width) {
            left = x - rect.width - offset;
        }
        
        if (top + rect.height > canvasRect.height) {
            top = y - rect.height - offset;
        }
        
        this.tooltipEl.style.left = `${left}px`;
        this.tooltipEl.style.top = `${top}px`;
    }
    
    /**
     * Hide tooltip
     */
    public hideTooltip() {
        if (this.tooltipEl) {
            this.tooltipEl.style.display = 'none';
        }
    }
    
    /**
     * Set the node finder function
     * This allows the view to provide the actual implementation
     */
    public setNodeFinder(finder: (x: number, y: number) => OneirographNode | null) {
        this.findNodeAt = finder;
    }
    
    /**
     * Clean up event listeners
     */
    destroy() {
        // Remove canvas event listeners
        const canvasEvents = ['mousedown', 'mousemove', 'mouseup', 'wheel', 'dblclick', 
                              'touchstart', 'touchmove', 'touchend', 'contextmenu'];
        for (const event of canvasEvents) {
            const handler = this.boundHandlers.get(`${event}-canvas`);
            if (handler) {
                this.canvas.removeEventListener(event, handler);
            }
        }
        
        // Remove document event listeners
        const handler = this.boundHandlers.get('keydown-document');
        if (handler) {
            document.removeEventListener('keydown', handler);
        }
        
        // Remove tooltip
        if (this.tooltipEl) {
            this.tooltipEl.remove();
            this.tooltipEl = null;
        }
        
        this.boundHandlers.clear();
        
        safeLogger.info('Oneirograph', 'Interactions destroyed');
    }
}
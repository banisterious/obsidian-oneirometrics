import type { DreamMetricData } from '../../../types';
import type DreamMetricsPlugin from '../../../main';
import { TFile, Menu } from 'obsidian';

/**
 * VirtualScroller
 * 
 * High-performance virtual scrolling implementation for the OneiroMetrics Dashboard.
 * Efficiently handles large datasets (10,000+ entries) while maintaining 60fps scrolling.
 * 
 * Features:
 * - Virtual DOM rendering with only visible rows in DOM
 * - RAF-based smooth scrolling with debouncing
 * - CSS custom properties for dynamic positioning
 * - Memory-efficient row recycling
 * - Seamless integration with sorting, filtering, and expand/collapse
 */

interface VirtualScrollerOptions {
    container: HTMLElement;
    entries: DreamMetricData[];
    rowHeight: number;
    visibleRows: number;
    enabledMetrics: Array<{ key: string; name: string }>;
    expandedRows: Set<string>;
    plugin: DreamMetricsPlugin;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    onRowExpand?: (id: string, isExpanded: boolean) => void;
    onRowClick?: (entry: DreamMetricData) => void;
    onSort?: (column: string) => void;
}

interface RenderedRow {
    element: HTMLTableRowElement;
    index: number;
    entry: DreamMetricData | null;
}

export class VirtualScroller {
    private container: HTMLElement;
    private tableEl: HTMLTableElement | null = null;
    private tbodyEl: HTMLTableSectionElement | null = null;
    private scrollContainer: HTMLElement | null = null;
    private virtualSpacerTop: HTMLElement | null = null;
    private virtualSpacerBottom: HTMLElement | null = null;
    
    private entries: DreamMetricData[] = [];
    private rowHeight: number;
    private visibleRows: number;
    private enabledMetrics: Array<{ key: string; name: string }>;
    private expandedRows: Set<string>;
    private plugin: DreamMetricsPlugin;
    private sortColumn: string;
    private sortDirection: 'asc' | 'desc';
    
    // Callbacks
    private onRowExpand?: (id: string, isExpanded: boolean) => void;
    private onRowClick?: (entry: DreamMetricData) => void;
    private onSort?: (column: string) => void;
    
    // Virtual scrolling state
    private scrollTop: number = 0;
    private startIndex: number = 0;
    private endIndex: number = 0;
    private bufferSize: number = 5; // Extra rows to render above/below viewport
    private renderedRows: Map<number, RenderedRow> = new Map();
    private rowPool: HTMLTableRowElement[] = [];
    private maxPoolSize: number = 50;
    
    // Performance optimization
    private scrollRAF: number | null = null;
    private isScrolling: boolean = false;
    private lastScrollTime: number = 0;
    private scrollDebounceMs: number = 16; // ~60fps
    
    // Metrics tracking
    private renderCount: number = 0;
    private totalRenderTime: number = 0;
    
    constructor(options: VirtualScrollerOptions) {
        this.container = options.container;
        this.entries = options.entries;
        this.rowHeight = options.rowHeight;
        this.visibleRows = options.visibleRows;
        this.enabledMetrics = options.enabledMetrics;
        this.expandedRows = options.expandedRows;
        this.plugin = options.plugin;
        this.sortColumn = options.sortColumn || 'date';
        this.sortDirection = options.sortDirection || 'asc';
        this.onRowExpand = options.onRowExpand;
        this.onRowClick = options.onRowClick;
        this.onSort = options.onSort;
        
        this.initialize();
    }
    
    private initialize(): void {
        // Clear container and set up structure
        this.container.empty();
        this.container.addClass('oom-virtual-scroll-container');
        
        // Create scroll container
        this.scrollContainer = this.container.createEl('div', { 
            cls: 'oom-scroll-viewport'
        });
        
        // Set viewport height
        const viewportHeight = this.rowHeight * this.visibleRows;
        this.scrollContainer.style.height = `${viewportHeight}px`;
        this.scrollContainer.style.overflowY = 'auto';
        this.scrollContainer.style.position = 'relative';
        
        // Create table structure
        this.tableEl = this.scrollContainer.createEl('table', { 
            cls: 'oom-metrics-table oom-virtual-table' 
        });
        
        // Render table header
        this.renderTableHeader();
        
        // Create tbody with virtual spacers
        this.tbodyEl = this.tableEl.createEl('tbody');
        this.tbodyEl.style.position = 'relative';
        
        // Create virtual spacers for maintaining scroll height
        this.virtualSpacerTop = this.tbodyEl.createEl('tr', { 
            cls: 'oom-virtual-spacer-top' 
        });
        this.virtualSpacerTop.style.height = '0px';
        this.virtualSpacerTop.style.display = 'block';
        
        this.virtualSpacerBottom = this.tbodyEl.createEl('tr', { 
            cls: 'oom-virtual-spacer-bottom' 
        });
        const totalHeight = this.entries.length * this.rowHeight;
        this.virtualSpacerBottom.style.height = `${totalHeight}px`;
        this.virtualSpacerBottom.style.display = 'block';
        
        // Initial render
        this.updateVisibleRange();
        this.renderVisibleRows();
        
        // Attach scroll handler
        this.attachScrollHandler();
        
        // Set CSS custom properties
        this.updateCSSVariables();
    }
    
    private renderTableHeader(): void {
        const thead = this.tableEl!.createEl('thead');
        const headerRow = thead.createEl('tr');
        
        // Date column with sort indicator
        const dateHeader = headerRow.createEl('th', { 
            text: 'Date',
            cls: this.getHeaderClass('date') + ' oom-header-date',
            attr: { 'data-column': 'date' }
        });
        
        // Title column with sort indicator
        const titleHeader = headerRow.createEl('th', { 
            text: 'Title',
            cls: this.getHeaderClass('title') + ' oom-header-title',
            attr: { 'data-column': 'title' }
        });
        
        // Content column
        headerRow.createEl('th', { 
            text: 'Content',
            cls: 'oom-header-content'
        });
        
        // Metric columns with sort indicators
        const metricHeaders: HTMLElement[] = [];
        for (const metric of this.enabledMetrics) {
            const metricHeader = headerRow.createEl('th', { 
                text: metric.name,
                cls: this.getHeaderClass(metric.key) + ` oom-header-metric metric-${metric.key}`,
                attr: { 'data-column': metric.key }
            });
            metricHeaders.push(metricHeader);
        }
        
        // Attach sort handlers to sortable columns
        this.attachSortHandlers(dateHeader, 'date');
        this.attachSortHandlers(titleHeader, 'title');
        metricHeaders.forEach((header, index) => {
            this.attachSortHandlers(header, this.enabledMetrics[index].key);
        });
    }
    
    private attachSortHandlers(header: HTMLElement, column: string): void {
        header.addEventListener('click', (e) => {
            e.preventDefault();
            this.onSort?.(column);
        });
        
        // Add visual feedback on hover
        header.style.cursor = 'pointer';
    }
    
    private attachScrollHandler(): void {
        if (!this.scrollContainer) return;
        
        this.scrollContainer.addEventListener('scroll', () => {
            this.handleScroll();
        }, { passive: true });
    }
    
    private handleScroll(): void {
        if (!this.scrollContainer) return;
        
        const currentTime = performance.now();
        const timeSinceLastScroll = currentTime - this.lastScrollTime;
        
        // Cancel pending RAF if exists
        if (this.scrollRAF !== null) {
            cancelAnimationFrame(this.scrollRAF);
        }
        
        // Immediate update for small movements or first scroll
        if (timeSinceLastScroll > this.scrollDebounceMs || !this.isScrolling) {
            this.isScrolling = true;
            this.updateOnScroll();
            this.lastScrollTime = currentTime;
        } else {
            // Debounce with RAF for smooth scrolling
            this.scrollRAF = requestAnimationFrame(() => {
                this.updateOnScroll();
                this.lastScrollTime = performance.now();
                this.scrollRAF = null;
                this.isScrolling = false;
            });
        }
    }
    
    private updateOnScroll(): void {
        if (!this.scrollContainer) return;
        
        const newScrollTop = this.scrollContainer.scrollTop;
        const scrollDelta = Math.abs(newScrollTop - this.scrollTop);
        
        // Only update if scrolled more than half a row
        if (scrollDelta > this.rowHeight / 2) {
            this.scrollTop = newScrollTop;
            this.updateVisibleRange();
            this.renderVisibleRows();
        }
    }
    
    private updateVisibleRange(): void {
        const scrollTop = this.scrollTop;
        const viewportHeight = this.rowHeight * this.visibleRows;
        
        // Calculate visible range with buffer
        this.startIndex = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.bufferSize);
        this.endIndex = Math.min(
            this.entries.length,
            Math.ceil((scrollTop + viewportHeight) / this.rowHeight) + this.bufferSize
        );
        
        // Update spacers
        if (this.virtualSpacerTop) {
            const topHeight = this.startIndex * this.rowHeight;
            this.virtualSpacerTop.style.height = `${topHeight}px`;
        }
        
        if (this.virtualSpacerBottom) {
            const bottomHeight = Math.max(0, (this.entries.length - this.endIndex) * this.rowHeight);
            this.virtualSpacerBottom.style.height = `${bottomHeight}px`;
        }
    }
    
    private renderVisibleRows(): void {
        const startTime = performance.now();
        
        if (!this.tbodyEl) return;
        
        // Track which indices are currently needed
        const neededIndices = new Set<number>();
        for (let i = this.startIndex; i < this.endIndex; i++) {
            neededIndices.add(i);
        }
        
        // Remove rows that are no longer visible
        const rowsToRemove: number[] = [];
        this.renderedRows.forEach((row, index) => {
            if (!neededIndices.has(index)) {
                rowsToRemove.push(index);
                this.recycleRow(row.element);
            }
        });
        rowsToRemove.forEach(index => this.renderedRows.delete(index));
        
        // Add new visible rows
        for (let i = this.startIndex; i < this.endIndex; i++) {
            if (!this.renderedRows.has(i)) {
                const entry = this.entries[i];
                if (entry) {
                    const rowEl = this.createOrReuseRow(entry, i);
                    this.renderedRows.set(i, { element: rowEl, index: i, entry });
                    
                    // Insert row in correct position
                    this.insertRowAtCorrectPosition(rowEl, i);
                }
            }
        }
        
        // Update render metrics
        const renderTime = performance.now() - startTime;
        this.renderCount++;
        this.totalRenderTime += renderTime;
        
        if (this.renderCount % 100 === 0) {
            this.plugin.logger?.debug('VirtualScroller', 'Performance metrics', {
                averageRenderTime: (this.totalRenderTime / this.renderCount).toFixed(2),
                visibleRows: this.endIndex - this.startIndex,
                totalEntries: this.entries.length,
                poolSize: this.rowPool.length
            });
        }
    }
    
    private createOrReuseRow(entry: DreamMetricData, index: number): HTMLTableRowElement {
        // Try to get a row from the pool
        let row = this.rowPool.pop();
        
        if (!row) {
            row = document.createElement('tr');
            row.className = 'oom-dream-row';
        }
        
        // Clear and populate row
        row.innerHTML = '';
        row.setAttribute('data-index', String(index));
        row.setAttribute('data-id', `${entry.date}_${entry.title}`);
        
        // Date cell
        const dateCell = row.createEl('td', { 
            text: entry.date,
            cls: 'oom-date-cell'
        });
        
        // Title cell with click handler
        const titleCell = row.createEl('td', { cls: 'oom-title-cell' });
        const titleLink = titleCell.createEl('a', { 
            text: entry.title,
            cls: 'oom-title-link',
            href: '#'
        });
        
        this.attachTitleHandlers(titleLink, entry);
        
        // Content cell with expand/collapse
        const contentCell = row.createEl('td', { cls: 'oom-content-cell' });
        this.renderContentCell(contentCell, entry);
        
        // Metric cells
        for (const metric of this.enabledMetrics) {
            const value = entry.metrics[metric.key] || entry.metrics[metric.name] || 0;
            const metricCell = row.createEl('td', { 
                cls: `metric-${metric.key}` 
            });
            
            // Check if this is a text metric that should be displayed as a list
            if (metric.name === 'Dream Themes' || metric.name === 'Characters List' || metric.name === 'Symbolic Content') {
                this.renderMetricAsList(metricCell, value, metric.name);
            } else {
                const displayValue = this.formatMetricValue(value, metric.name);
                metricCell.textContent = displayValue;
            }
        }
        
        return row;
    }
    
    private renderContentCell(cell: HTMLElement, entry: DreamMetricData): void {
        const container = cell.createEl('div', { cls: 'oom-content-container' });
        const entryId = `${entry.date}_${entry.title}`;
        const isExpanded = this.expandedRows.has(entryId);
        
        // Expand toggle
        const expandToggle = container.createEl('span', { 
            cls: 'oom-expand-toggle',
            text: isExpanded ? '▼' : '▶'
        });
        
        // Content preview - show more meaningful content (400 chars)
        const contentPreview = container.createEl('div', { 
            cls: 'oom-content-preview',
            text: entry.content.substring(0, 400) + (entry.content.length > 400 ? '...' : '')
        });
        
        // Full content (conditionally visible)
        const contentFull = container.createEl('div', { 
            cls: 'oom-content-full',
            text: entry.content
        });
        
        if (!isExpanded) {
            contentFull.style.display = 'none';
        } else {
            contentPreview.style.display = 'none';
        }
        
        // Store references on the element for the handler to use
        (expandToggle as any)._contentPreview = contentPreview;
        (expandToggle as any)._contentFull = contentFull;
        (expandToggle as any)._entryId = entryId;
        
        // Attach expand handler using arrow function to preserve 'this' context
        const clickHandler = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Get stored references
            const toggle = e.currentTarget as HTMLElement;
            const storedEntryId = (toggle as any)._entryId;
            const storedPreview = (toggle as any)._contentPreview;
            const storedFull = (toggle as any)._contentFull;
            
            // Always check current state from expandedRows
            const currentlyExpanded = this.expandedRows.has(storedEntryId);
            const newExpanded = !currentlyExpanded;
            
            if (newExpanded) {
                this.expandedRows.add(storedEntryId);
                toggle.textContent = '▼';
                storedFull.style.display = 'block';
                storedPreview.style.display = 'none';
            } else {
                this.expandedRows.delete(storedEntryId);
                toggle.textContent = '▶';
                storedFull.style.display = 'none';
                storedPreview.style.display = 'block';
            }
            
            this.onRowExpand?.(storedEntryId, newExpanded);
        };
        
        // Remove any existing handler before adding new one
        (expandToggle as any)._clickHandler = clickHandler;
        expandToggle.addEventListener('click', clickHandler);
    }
    
    private attachTitleHandlers(titleLink: HTMLElement, entry: DreamMetricData): void {
        // Click handler
        titleLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.onRowClick?.(entry);
            
            const sourcePath = this.getSourcePath(entry);
            if (sourcePath) {
                const file = this.plugin.app.vault.getAbstractFileByPath(sourcePath);
                if (file instanceof TFile) {
                    this.plugin.app.workspace.getLeaf().openFile(file);
                }
            }
        });
        
        // Context menu handler
        titleLink.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const sourcePath = this.getSourcePath(entry);
            if (!sourcePath) return;
            
            const file = this.plugin.app.vault.getAbstractFileByPath(sourcePath);
            if (!(file instanceof TFile)) return;
            
            const menu = new Menu();
            
            menu.addItem((item) => {
                item.setTitle('Open in new tab')
                    .setIcon('file-plus')
                    .onClick(() => {
                        this.plugin.app.workspace.getLeaf('tab').openFile(file);
                    });
            });
            
            menu.addItem((item) => {
                item.setTitle('Open to the right')
                    .setIcon('separator-vertical')
                    .onClick(() => {
                        this.plugin.app.workspace.getLeaf('split').openFile(file);
                    });
            });
            
            menu.addItem((item) => {
                item.setTitle('Open in new window')
                    .setIcon('maximize')
                    .onClick(() => {
                        this.plugin.app.workspace.getLeaf('window').openFile(file);
                    });
            });
            
            menu.addSeparator();
            
            menu.addItem((item) => {
                item.setTitle('Reveal in navigation')
                    .setIcon('folder-open')
                    .onClick(() => {
                        const fileExplorer = this.plugin.app.workspace.getLeavesOfType('file-explorer')[0];
                        if (fileExplorer) {
                            (fileExplorer.view as any).revealInFolder(file);
                        }
                    });
            });
            
            menu.showAtMouseEvent(e);
        });
    }
    
    private getSourcePath(entry: DreamMetricData): string {
        const source = entry.source;
        if (typeof source === 'string') {
            return source;
        } else if (source && typeof source === 'object') {
            const sourceObj = source as { file: string; id?: string };
            return sourceObj.file;
        }
        return '';
    }
    
    private renderMetricAsList(cell: HTMLElement, value: any, metricName: string): void {
        // Parse the value into an array of items
        let items: string[] = [];
        
        if (Array.isArray(value)) {
            items = value.map((item, index) => {
                let cleaned = String(item);
                // Remove brackets from first and last elements if present
                if (index === 0) cleaned = cleaned.replace(/^\[/, '');
                if (index === value.length - 1) cleaned = cleaned.replace(/\]$/, '');
                return cleaned.trim();
            }).filter(item => item && item !== '0');
        } else if (typeof value === 'string' && value !== '0' && value !== '') {
            // Parse string value, removing brackets and splitting by comma
            const processed = value
                .replace(/^\[|\]$/g, '')  // Remove outer brackets
                .replace(/^["']|["']$/g, '') // Remove quotes if present
                .trim();
            
            if (processed) {
                // Split by comma and clean each item
                items = processed.split(',').map(item => item.trim()).filter(item => item);
            }
        }
        
        // If we have items, create a bulleted list
        if (items.length > 0) {
            const list = cell.createEl('ul', { cls: 'oom-metric-list' });
            items.forEach(item => {
                list.createEl('li', { text: item });
            });
        } else {
            // If no items, leave cell empty
            cell.textContent = '';
        }
    }
    
    private formatMetricValue(value: any, metricName: string): string {
        // Note: Text metrics are now handled by renderMetricAsList
        // This method handles numeric and other non-list metrics
        return String(value);
    }
    
    private insertRowAtCorrectPosition(row: HTMLTableRowElement, index: number): void {
        if (!this.tbodyEl || !this.virtualSpacerBottom) return;
        
        // Find the correct position to insert the row
        let insertBefore: Element | null = null;
        
        // Look for the first row with a higher index
        const existingRows = this.tbodyEl.querySelectorAll('tr[data-index]');
        for (let i = 0; i < existingRows.length; i++) {
            const existingRow = existingRows[i];
            const existingIndex = parseInt(existingRow.getAttribute('data-index') || '0');
            if (existingIndex > index) {
                insertBefore = existingRow;
                break;
            }
        }
        
        // If no row with higher index found, insert before bottom spacer
        if (!insertBefore) {
            insertBefore = this.virtualSpacerBottom;
        }
        
        this.tbodyEl.insertBefore(row, insertBefore);
    }
    
    private recycleRow(row: HTMLTableRowElement): void {
        if (this.rowPool.length < this.maxPoolSize) {
            // Clear row content but keep the element for reuse
            row.innerHTML = '';
            row.removeAttribute('data-index');
            row.removeAttribute('data-id');
            this.rowPool.push(row);
        }
        
        // Remove from DOM
        row.remove();
    }
    
    private updateCSSVariables(): void {
        this.container.style.setProperty('--oom-total-rows', String(this.entries.length));
        this.container.style.setProperty('--oom-row-height', `${this.rowHeight}px`);
        this.container.style.setProperty('--oom-visible-rows', String(this.visibleRows));
    }
    
    /**
     * Get the appropriate CSS class for a table header based on sort state
     */
    private getHeaderClass(column: string): string {
        let classes = 'sortable';
        
        if (this.sortColumn === column) {
            classes += this.sortDirection === 'asc' ? ' sorted-asc' : ' sorted-desc';
        }
        
        return classes;
    }
    
    /**
     * Update sort state and re-render headers
     */
    public updateSortState(column: string, direction: 'asc' | 'desc'): void {
        this.sortColumn = column;
        this.sortDirection = direction;
        
        // Update header classes
        const headers = this.tableEl?.querySelectorAll('th.sortable');
        if (headers) {
            headers.forEach(header => {
                const col = header.getAttribute('data-column');
                if (!col) return;
                
                // Remove existing sort classes
                header.classList.remove('sorted-asc', 'sorted-desc');
                
                // Add appropriate sort class if this is the sorted column
                if (col === this.sortColumn) {
                    header.classList.add(this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
                }
            });
        }
    }
    
    // Public methods for updating data
    
    public updateEntries(entries: DreamMetricData[], sortColumn?: string, sortDirection?: 'asc' | 'desc'): void {
        this.entries = entries;
        
        // Update sort state if provided
        if (sortColumn !== undefined && sortDirection !== undefined) {
            this.updateSortState(sortColumn, sortDirection);
        }
        
        // Reset scroll position
        if (this.scrollContainer) {
            this.scrollContainer.scrollTop = 0;
        }
        this.scrollTop = 0;
        
        // Clear rendered rows
        this.renderedRows.clear();
        if (this.tbodyEl) {
            // Remove all rows except spacers
            this.tbodyEl.querySelectorAll('tr[data-index]').forEach(row => row.remove());
        }
        
        // Update spacers and re-render
        this.updateVisibleRange();
        this.renderVisibleRows();
        this.updateCSSVariables();
    }
    
    public updateMetrics(enabledMetrics: Array<{ key: string; name: string }>): void {
        this.enabledMetrics = enabledMetrics;
        
        // Need to re-render header and all visible rows
        if (this.tableEl) {
            const thead = this.tableEl.querySelector('thead');
            if (thead) thead.remove();
            this.renderTableHeader();
        }
        
        // Re-render visible rows with new metrics
        this.renderedRows.clear();
        if (this.tbodyEl) {
            this.tbodyEl.querySelectorAll('tr[data-index]').forEach(row => row.remove());
        }
        this.renderVisibleRows();
    }
    
    public scrollToEntry(entryId: string): void {
        const index = this.entries.findIndex(e => `${e.date}_${e.title}` === entryId);
        if (index !== -1 && this.scrollContainer) {
            const targetScrollTop = index * this.rowHeight - (this.visibleRows * this.rowHeight / 2);
            this.scrollContainer.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth'
            });
        }
    }
    
    public destroy(): void {
        // Cancel any pending scroll updates
        if (this.scrollRAF !== null) {
            cancelAnimationFrame(this.scrollRAF);
        }
        
        // Clear references
        this.renderedRows.clear();
        this.rowPool = [];
        
        // Remove event listeners are handled by Obsidian when container is cleared
        this.container.empty();
    }
    
    public getPerformanceMetrics(): { averageRenderTime: number; totalRenders: number } {
        return {
            averageRenderTime: this.renderCount > 0 ? this.totalRenderTime / this.renderCount : 0,
            totalRenders: this.renderCount
        };
    }
}
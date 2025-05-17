import { App } from 'obsidian';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { DateRangeFilter } from '../filters/DateRangeFilter';
import { OneiroMetricsEvents } from '../events';
import { DreamMetricData } from '../types';

export class DreamMetricsDOM {
    private container: HTMLElement;
    private state: DreamMetricsState;
    private app: App;
    private cleanupFunctions: (() => void)[] = [];
    private dateRangeFilter: DateRangeFilter;
    private VISIBLE_ROWS = 20;
    private ROW_HEIGHT = 50; // px
    private scrollToRowId: string | null = null;
    private expandedRows: Set<string> = new Set();
    private events: OneiroMetricsEvents;

    constructor(app: App, container: HTMLElement, state: DreamMetricsState) {
        this.app = app;
        this.container = container;
        this.state = state;
        this.dateRangeFilter = new DateRangeFilter(state);
        this.events = OneiroMetricsEvents.getInstance();
    }

    public render(): void {
        console.log('[DEBUG] DreamMetricsDOM.render called');
        this.app.workspace.trigger('oneirometrics:debug', {
            event: 'DreamMetricsDOM render called',
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        });
        this.container.empty();
        this.container.addClass('oom-container');

        // Render filters
        this.renderFilters();

        // Render metrics table
        this.renderMetricsTable();
    }

    private renderFilters(): void {
        const filterContainer = this.container.createDiv('oom-filter-container');
        
        // Render date range filter
        this.dateRangeFilter.render(filterContainer);
    }

    private renderMetricsTable(): void {
        this.app.workspace.trigger('oneirometrics:debug', {
            event: 'renderMetricsTable called',
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        });

        // Use requestAnimationFrame to batch DOM updates
        requestAnimationFrame(() => {
            const tableContainer = this.container.createDiv('oom-table-container');
            const table = tableContainer.createEl('table', { cls: 'oom-table' });
            
            // Render table header
            this.renderTableHeader(table);
            
            // Render table body
            this.renderTableBody(table);
        });
    }

    private renderTableHeader(table: HTMLElement): void {
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');
        
        // Add date column
        headerRow.createEl('th', { text: 'Date' });
        
        // Add metrics columns
        const metrics = this.state.getMetrics();
        Object.entries(metrics).forEach(([key, metric]) => {
            const th = headerRow.createEl('th');
            th.textContent = metric.name;
            if (metric.description) {
                th.setAttribute('title', metric.description);
            }
        });
    }

    private renderTableBody(table: HTMLElement): void {
        this.app.workspace.trigger('oneirometrics:debug', {
            event: 'renderTableBody called',
            timestamp: new Date().toISOString(),
            stack: new Error().stack,
            expandedRows: Array.from(this.expandedRows)
        });

        // Remove any existing tbody
        const oldTbody = table.querySelector('tbody');
        if (oldTbody) oldTbody.remove();

        // Create new tbody
        const tbody = table.createEl('tbody');
        const entries = this.state.getDreamEntries();
        const totalRows = entries.length;

        // Create a single container for all rows
        const rowsContainer = document.createElement('div');
        rowsContainer.style.position = 'relative';
        rowsContainer.style.height = `${totalRows * this.ROW_HEIGHT}px`;
        tbody.appendChild(rowsContainer);

        // Create a single row template
        const rowTemplate = document.createElement('tr');
        rowTemplate.className = 'oom-dream-row';
        rowTemplate.style.position = 'absolute';
        rowTemplate.style.width = '100%';
        rowTemplate.style.height = `${this.ROW_HEIGHT}px`;
        rowTemplate.style.display = 'none';
        rowsContainer.appendChild(rowTemplate);

        // Debounce scroll handler with RAF
        let scrollTimeout: number | null = null;
        let isScrolling = false;
        let lastScrollTop = 0;
        let currentStartIdx = 0;

        const debouncedScroll = () => {
            if (scrollTimeout) {
                window.cancelAnimationFrame(scrollTimeout);
            }
            if (!isScrolling) {
                isScrolling = true;
                scrollTimeout = window.requestAnimationFrame(() => {
                    const container = table.parentElement as HTMLElement;
                    if (container) {
                        const scrollTop = container.scrollTop;
                        const newStartIdx = Math.floor(scrollTop / this.ROW_HEIGHT);
                        
                        // Only update if we've scrolled at least one row
                        if (newStartIdx !== currentStartIdx) {
                            currentStartIdx = newStartIdx;
                            updateVisibleRows();
                        }
                    }
                    isScrolling = false;
                    scrollTimeout = null;
                });
            }
        };

        // Helper to update visible rows
        const updateVisibleRows = () => {
            const endIdx = Math.min(currentStartIdx + this.VISIBLE_ROWS, totalRows);
            const fragment = document.createDocumentFragment();

            // Create visible rows
            for (let i = currentStartIdx; i < endIdx; i++) {
                const entry = entries[i];
                const row = rowTemplate.cloneNode(true) as HTMLElement;
                row.style.display = 'table-row';
                row.style.top = `${i * this.ROW_HEIGHT}px`;
                row.setAttribute('data-source', entry.source);

                // Add date cell
                const dateCell = document.createElement('td');
                dateCell.textContent = new Date(entry.date).toLocaleDateString();
                row.appendChild(dateCell);

                // Add metric cells
                const metrics = this.state.getMetrics();
                Object.entries(metrics).forEach(([key, metric]) => {
                    const cell = document.createElement('td');
                    const value = entry.metrics[key];
                    cell.textContent = value !== undefined ? value.toString() : '-';
                    row.appendChild(cell);
                });

                // Add content cell
                const contentCell = document.createElement('td');
                contentCell.className = 'oom-content-cell';
                
                const contentWrapper = document.createElement('div');
                contentWrapper.className = 'oom-content-wrapper';
                
                const preview = document.createElement('div');
                preview.className = 'oom-content-preview';
                preview.textContent = entry.content.substring(0, 100) + '...';
                contentWrapper.appendChild(preview);
                
                const fullContent = document.createElement('div');
                fullContent.className = 'oom-content-full';
                fullContent.textContent = entry.content;
                contentWrapper.appendChild(fullContent);
                
                contentCell.appendChild(contentWrapper);

                const expandButton = document.createElement('button');
                expandButton.className = 'oom-button oom-button--expand';
                expandButton.textContent = this.expandedRows.has(entry.source) ? 'Show less' : 'Read more';
                expandButton.setAttribute('data-content-id', entry.source);
                expandButton.setAttribute('data-expanded', this.expandedRows.has(entry.source) ? 'true' : 'false');
                expandButton.setAttribute('aria-expanded', this.expandedRows.has(entry.source) ? 'true' : 'false');
                expandButton.setAttribute('aria-label', 'Toggle dream content visibility');

                // Attach expand/collapse event listener
                expandButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isExpanded = expandButton.getAttribute('data-expanded') === 'true';
                    this.updateContentVisibility(entry.source, !isExpanded);
                });

                contentCell.appendChild(expandButton);
                row.appendChild(contentCell);

                if (this.expandedRows.has(entry.source)) {
                    contentWrapper.classList.add('expanded');
                }

                fragment.appendChild(row);
            }

            // Update DOM in a single operation
            rowsContainer.innerHTML = '';
            rowsContainer.appendChild(fragment);

            // Handle scroll to row if needed
            if (this.scrollToRowId) {
                const row = rowsContainer.querySelector(`tr[data-source="${this.scrollToRowId}"]`);
                const container = table.parentElement as HTMLElement;
                if (row instanceof HTMLElement && container) {
                    const idx = entries.findIndex(e => e.source === this.scrollToRowId);
                    if (idx !== -1) {
                        const containerHeight = container.clientHeight;
                        const scrollTop = Math.max(0, idx * this.ROW_HEIGHT - containerHeight / 2);
                        container.scrollTo({ top: scrollTop, behavior: 'smooth' });
                    }
                }
                this.scrollToRowId = null;
            }
        };

        // Attach scroll handler to the table's container
        const container = table.parentElement as HTMLElement;
        if (container) {
            container.onscroll = debouncedScroll;
            container.style.overflowY = 'auto';
            container.style.maxHeight = `${this.ROW_HEIGHT * this.VISIBLE_ROWS}px`;
        }

        // Initial render
        updateVisibleRows();
    }

    public updateContentVisibility(id: string, isExpanded: boolean): void {
        this.app.workspace.trigger('oneirometrics:debug', {
            event: 'updateContentVisibility called',
            timestamp: new Date().toISOString(),
            id,
            isExpanded,
            stack: new Error().stack,
            expandedRows: Array.from(this.expandedRows)
        });

        // Only update the affected row, not the whole table
        if (isExpanded) {
            this.expandedRows.add(id);
            this.scrollToRowId = id;
        } else {
            this.expandedRows.delete(id);
        }
        const row = this.container.querySelector(`tr[data-source="${id}"]`);
        if (row) {
            const contentWrapper = row.querySelector('.oom-content-wrapper');
            const previewDiv = row.querySelector('.oom-content-preview');
            const fullDiv = row.querySelector('.oom-content-full');
            const expandButton = row.querySelector('.oom-button--expand');

            if (contentWrapper && previewDiv && fullDiv && expandButton) {
                if (isExpanded) {
                    contentWrapper.classList.add('expanded');
                } else {
                    contentWrapper.classList.remove('expanded');
                }
                expandButton.textContent = isExpanded ? 'Show less' : 'Read more';
                expandButton.setAttribute('data-expanded', isExpanded.toString());
                expandButton.setAttribute('aria-expanded', isExpanded.toString());
            }
        }
    }

    public cleanup(): void {
        this.app.workspace.trigger('oneirometrics:debug', {
            event: 'cleanup called',
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        });
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
    }

    public applyFilters(previewEl: HTMLElement): void {
        console.log('[DEBUG] DreamMetricsDOM.applyFilters called', previewEl);
        if ((window as any).oneiroMetricsPlugin && typeof (window as any).oneiroMetricsPlugin.applyFilters === 'function') {
            (window as any).oneiroMetricsPlugin.applyFilters(previewEl);
        } else {
            console.warn('applyFilters: Could not find main plugin filtering logic.');
        }
    }
} 
import { App } from 'obsidian';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { DateRangeFilter } from '../filters/DateRangeFilter';
import { OneiroMetricsEvents } from '../events';
import { getSourceFile } from '../utils/type-guards';
import { warn } from '../logging';
import safeLogger from '../logging/safe-logger';

// Import the global logger from main.ts - will be initialized when plugin loads
declare const globalLogger: any;

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
        globalLogger?.debug('DOM', 'DreamMetricsDOM.render called');
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
        rowsContainer.className = 'oom-virtualized-rows-container';
        rowsContainer.style.setProperty('--oom-total-rows', totalRows.toString());
        rowsContainer.style.setProperty('--oom-row-height', `${this.ROW_HEIGHT}px`);
        tbody.appendChild(rowsContainer);

        // Create a single row template
        const rowTemplate = document.createElement('tr');
        rowTemplate.className = 'oom-dream-row oom-virtualized-table-template';
        rowTemplate.style.setProperty('--oom-row-height', `${this.ROW_HEIGHT}px`);
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
                row.className = 'oom-dream-row oom-virtualized';
                row.style.setProperty('--oom-row-index', i.toString());
                row.style.setProperty('--oom-row-height', `${this.ROW_HEIGHT}px`);
                row.style.setProperty('--oom-row-display', 'table-row');
                row.setAttribute('data-source', getSourceFile(entry));

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
                expandButton.className = 'oom-button oom-button--expand u-padding--xs';
                const sourceId = getSourceFile(entry);
                expandButton.textContent = this.expandedRows.has(sourceId) ? 'Show less' : 'Read more';
                expandButton.setAttribute('data-content-id', sourceId);
                expandButton.setAttribute('data-expanded', this.expandedRows.has(sourceId) ? 'true' : 'false');
                expandButton.setAttribute('aria-expanded', this.expandedRows.has(sourceId) ? 'true' : 'false');
                expandButton.setAttribute('aria-label', 'Toggle dream content visibility');

                // Attach expand/collapse event listener
                expandButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isExpanded = expandButton.getAttribute('data-expanded') === 'true';
                    this.updateContentVisibility(sourceId, !isExpanded);
                });

                contentCell.appendChild(expandButton);
                row.appendChild(contentCell);

                if (this.expandedRows.has(sourceId)) {
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
                    const idx = entries.findIndex(e => getSourceFile(e) === this.scrollToRowId);
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
            container.style.setProperty('--oom-visible-rows', this.VISIBLE_ROWS.toString());
            container.style.setProperty('--oom-row-height', `${this.ROW_HEIGHT}px`);
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
        globalLogger?.debug('DOM', 'DreamMetricsDOM.applyFilters called', { element: previewEl });
        this.app.workspace.trigger('oneirometrics:debug', {
            event: 'DreamMetricsDOM applyFilters called',
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        });
        if ((window as any).oneiroMetricsPlugin && typeof (window as any).oneiroMetricsPlugin.applyFilters === 'function') {
            (window as any).oneiroMetricsPlugin.applyFilters(previewEl);
        } else {
            try {
                safeLogger.warn('DreamMetricsDOM', 'Could not find main plugin filtering logic');
            } catch (e) {
                warn('DreamMetricsDOM', 'Could not find main plugin filtering logic');
            }
        }
    }
    
    /**
     * Apply a custom date range filter to the entries
     * @param previewEl The container element with the entries
     * @param dateRange The custom date range to apply
     */
    public applyCustomDateRangeFilter(previewEl: HTMLElement, dateRange: { start: string, end: string }): void {
        globalLogger?.debug('DOM', 'DreamMetricsDOM.applyCustomDateRangeFilter called', { 
            element: previewEl, 
            dateRange 
        });
        
        this.app.workspace.trigger('oneirometrics:debug', {
            event: 'DreamMetricsDOM applyCustomDateRangeFilter called',
            timestamp: new Date().toISOString(),
            dateRange,
            stack: new Error().stack
        });
        
        // Check if the global custom date range filter function exists
        if ((window as any).customDateRange && (window as any).applyCustomDateRangeFilter) {
            // Set the global customDateRange variable
            (window as any).customDateRange = dateRange;
            
            // Call the global filter function
            (window as any).applyCustomDateRangeFilter();
        } else if ((window as any).oneiroMetricsPlugin && typeof (window as any).oneiroMetricsPlugin.applyCustomDateRangeFilter === 'function') {
            // Alternative: use the plugin's method directly
            (window as any).oneiroMetricsPlugin.applyCustomDateRangeFilter(dateRange);
        } else {
            // Fallback implementation if global function isn't available
            globalLogger?.warn('DOM', 'Could not find global applyCustomDateRangeFilter function, using fallback');
            
            try {
                // Parse the date strings to Date objects
                const startDate = new Date(dateRange.start);
                const endDate = new Date(dateRange.end);
                
                // Set end date to end of day
                endDate.setHours(23, 59, 59, 999);
                
                // Get all rows
                const rows = previewEl.querySelectorAll('.oom-dream-row');
                
                let visibleCount = 0;
                
                // Process each row
                rows.forEach(row => {
                    const dateCell = row.querySelector('.column-date');
                    if (!dateCell || !dateCell.textContent) return;
                    
                    try {
                        // Parse date from cell
                        const dateText = dateCell.textContent.trim();
                        const rowDate = new Date(dateText);
                        
                        // Check if the date is within the range
                        const isVisible = rowDate >= startDate && rowDate <= endDate;
                        
                        // Update row visibility
                        if (isVisible) {
                            (row as HTMLElement).classList.remove('oom-row--hidden');
                            (row as HTMLElement).classList.add('oom-row--visible');
                            visibleCount++;
                        } else {
                            (row as HTMLElement).classList.add('oom-row--hidden');
                            (row as HTMLElement).classList.remove('oom-row--visible');
                        }
                    } catch (error) {
                        globalLogger?.error('DOM', 'Error processing row date', error);
                    }
                });
                
                // Update filter display
                const filterDisplay = previewEl.querySelector('#oom-time-filter-display');
                if (filterDisplay) {
                    (filterDisplay as HTMLElement).textContent = `Custom Range: ${dateRange.start} to ${dateRange.end} (${visibleCount} entries)`;
                }
                
                // Also show a notice
                if ((window as any).Notice) {
                    new (window as any).Notice(`Custom date filter applied: ${visibleCount} entries visible`);
                }
            } catch (error) {
                globalLogger?.error('DOM', 'Error applying custom date range filter', error);
            }
        }
    }
} 
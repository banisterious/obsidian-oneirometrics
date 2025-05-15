import { App } from 'obsidian';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricData } from '../types';
import { DateRangeFilter } from '../filters/DateRangeFilter';
import { TimeFilterDialog } from '../filters/TimeFilterDialog';
import { TimeFilterState } from '../filters/TimeFilterState';

export class DreamMetricsDOM {
    private container: HTMLElement;
    private state: DreamMetricsState;
    private app: App;
    private cleanupFunctions: (() => void)[] = [];
    private dateRangeFilter: DateRangeFilter;
    private timeFilterState: TimeFilterState;
    private VISIBLE_ROWS = 12;
    private ROW_HEIGHT = 40; // px
    private scrollToRowId: string | null = null;
    private expandedRows: Set<string> = new Set();

    constructor(container: HTMLElement, state: DreamMetricsState, app: App) {
        this.app.workspace.trigger('oneirometrics:debug', {
            event: 'DreamMetricsDOM constructor called',
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        });
        this.container = container;
        this.state = state;
        this.app = app;
        this.dateRangeFilter = new DateRangeFilter(state);
        this.timeFilterState = new TimeFilterState(state);
    }

    public render(): void {
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

        // Subscribe to state changes
        // this.state.subscribe(() => {
        //     this.renderMetricsTable();
        // });
        // (Commented out for diagnostics: prevents automatic table re-renders on state changes)
    }

    private renderFilters(): void {
        const filterContainer = this.container.createDiv('oom-filter-container');
        
        // Render date range filter
        this.dateRangeFilter.render(filterContainer);
        
        // Add time filter button
        const timeFilterButton = filterContainer.createEl('button', {
            text: 'Time Filter',
            cls: 'oom-button oom-button--secondary'
        });
        
        timeFilterButton.addEventListener('click', () => {
            const dialog = new TimeFilterDialog(this.app, this.timeFilterState);
            dialog.open();
        });
    }

    private renderMetricsTable(): void {
        this.app.workspace.trigger('oneirometrics:debug', {
            event: 'renderMetricsTable called',
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        });
        const tableContainer = this.container.createDiv('oom-table-container');
        const table = tableContainer.createEl('table', { cls: 'oom-table' });
        
        // Render table header
        this.renderTableHeader(table);
        
        // Render table body
        this.renderTableBody(table);
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

        const tbody = table.createEl('tbody');
        const entries = this.state.getDreamEntries();
        const totalRows = entries.length;

        // Spacer rows
        const spacerTop = document.createElement('tr');
        const spacerBottom = document.createElement('tr');

        // Debounce scroll handler
        let scrollTimeout: number | null = null;
        const debouncedScroll = () => {
            this.app.workspace.trigger('oneirometrics:debug', {
                event: 'Scroll event fired',
                timestamp: new Date().toISOString(),
                scrollTimeout: scrollTimeout !== null,
                stack: new Error().stack
            });
            if (scrollTimeout) {
                window.clearTimeout(scrollTimeout);
            }
            scrollTimeout = window.setTimeout(() => {
                renderVisibleRows();
                scrollTimeout = null;
            }, 16); // ~60fps
        };

        // Helper to render visible rows
        const renderVisibleRows = () => {
            this.app.workspace.trigger('oneirometrics:debug', {
                event: 'renderVisibleRows called',
                timestamp: new Date().toISOString(),
                scrollToRowId: this.scrollToRowId,
                stack: new Error().stack
            });

            tbody.innerHTML = '';
            const container = table.parentElement as HTMLElement;
            const scrollTop = container ? container.scrollTop : 0;
            const startIdx = Math.floor(scrollTop / this.ROW_HEIGHT);
            const endIdx = Math.min(startIdx + this.VISIBLE_ROWS, totalRows);

            // Spacer above
            spacerTop.style.height = `${startIdx * this.ROW_HEIGHT}px`;
            tbody.appendChild(spacerTop);

            // Only process visible rows (startIdx to endIdx)
            for (let i = startIdx; i < endIdx; i++) {
                const entry = entries[i];
                const row = tbody.createEl('tr', { 
                    cls: 'oom-dream-row',
                    attr: { 'data-source': entry.source }
                });
                // Add date cell
                const dateCell = row.createEl('td');
                dateCell.textContent = new Date(entry.date).toLocaleDateString();
                // Add metric cells
                const metrics = this.state.getMetrics();
                Object.entries(metrics).forEach(([key, metric]) => {
                    const cell = row.createEl('td');
                    const value = entry.metrics[key];
                    cell.textContent = value !== undefined ? value.toString() : '-';
                });
                // Add content cell
                const contentCell = row.createEl('td', { cls: 'oom-content-cell' });
                const contentWrapper = contentCell.createDiv('oom-content-wrapper');
                const preview = contentWrapper.createDiv('oom-content-preview');
                preview.textContent = entry.content.substring(0, 100) + '...';
                const fullContent = contentWrapper.createDiv('oom-content-full');
                fullContent.textContent = entry.content;
                const expandButton = contentCell.createEl('button', {
                    cls: 'oom-button oom-button--expand',
                    text: this.expandedRows.has(entry.source) ? 'Show less' : 'Read more',
                    attr: {
                        'data-content-id': entry.source,
                        'data-expanded': this.expandedRows.has(entry.source) ? 'true' : 'false',
                        'aria-expanded': this.expandedRows.has(entry.source) ? 'true' : 'false',
                        'aria-label': 'Toggle dream content visibility'
                    }
                });

                // Attach expand/collapse event listener ONLY to this new button
                expandButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isExpanded = expandButton.getAttribute('data-expanded') === 'true';
                    this.updateContentVisibility(entry.source, !isExpanded);
                });

                if (this.expandedRows.has(entry.source)) {
                    contentWrapper.classList.add('expanded');
                }
            }
            // Spacer below
            spacerBottom.style.height = `${(totalRows - endIdx) * this.ROW_HEIGHT}px`;
            tbody.appendChild(spacerBottom);

            // --- PATCH: Scroll to row if requested ---
            if (this.scrollToRowId) {
                const row = tbody.querySelector(`tr[data-source="${this.scrollToRowId}"]`);
                const container = table.parentElement as HTMLElement;
                if (row instanceof HTMLElement && container) {
                    const rowRect = row.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    if (rowRect.bottom > containerRect.bottom) {
                        const scrollDelta = rowRect.bottom - containerRect.bottom;
                        const maxScroll = container.scrollHeight - container.clientHeight;
                        let newScrollTop = container.scrollTop + scrollDelta;
                        if (newScrollTop > maxScroll) newScrollTop = maxScroll;
                        container.scrollTo({ top: newScrollTop, behavior: 'smooth' });
                    } else if (rowRect.top < containerRect.top) {
                        container.scrollTo({ top: container.scrollTop + (rowRect.top - containerRect.top), behavior: 'smooth' });
                    }
                }
                this.scrollToRowId = null;
            }
            // --- END PATCH ---
        };

        // Attach scroll handler to the table's container
        const container = table.parentElement as HTMLElement;
        if (container) {
            container.onscroll = debouncedScroll;
            // Ensure container is scrollable and has fixed height
            container.style.overflowY = 'auto';
            container.style.maxHeight = `${this.ROW_HEIGHT * this.VISIBLE_ROWS}px`;
        }

        // Initial render
        renderVisibleRows();
        // NOTE: No global event listener attachment outside of renderVisibleRows.
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
        // Do NOT trigger a full table re-render here
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
} 
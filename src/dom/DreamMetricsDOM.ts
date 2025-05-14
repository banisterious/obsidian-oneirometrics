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

    constructor(container: HTMLElement, state: DreamMetricsState, app: App) {
        this.container = container;
        this.state = state;
        this.app = app;
        this.dateRangeFilter = new DateRangeFilter(state);
        this.timeFilterState = new TimeFilterState(state);
    }

    public render(): void {
        this.container.empty();
        this.container.addClass('oom-container');

        // Render filters
        this.renderFilters();

        // Render metrics table
        this.renderMetricsTable();

        // Subscribe to state changes
        this.state.subscribe(() => {
            this.renderMetricsTable();
        });
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
        const tbody = table.createEl('tbody');
        const entries = this.state.getDreamEntries();
        
        entries.forEach(entry => {
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
            
            // Create content wrapper
            const contentWrapper = contentCell.createDiv('oom-content-wrapper');
            
            // Create preview content
            const preview = contentWrapper.createDiv('oom-content-preview');
            preview.textContent = entry.content.substring(0, 100) + '...';
            
            // Create full content (initially hidden)
            const fullContent = contentWrapper.createDiv('oom-content-full');
            fullContent.textContent = entry.content;
            
            // Create expand button
            const expandButton = contentCell.createEl('button', {
                cls: 'oom-button oom-button--expand',
                text: 'Read more',
                attr: {
                    'data-content-id': entry.source,
                    'data-expanded': 'false',
                    'aria-expanded': 'false',
                    'aria-label': 'Toggle dream content visibility'
                }
            });
        });
    }

    public updateContentVisibility(id: string, isExpanded: boolean): void {
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
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];
    }
} 
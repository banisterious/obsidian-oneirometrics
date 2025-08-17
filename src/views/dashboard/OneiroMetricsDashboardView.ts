import { ItemView, WorkspaceLeaf, SearchComponent, DropdownComponent, Notice, prepareSimpleSearch, TFile } from 'obsidian';
import type OneiroMetricsPlugin from '../../../main';
import type { DreamMetricData } from '../../../types';
import type { DreamMetricsSettings } from '../../../types';

// Date filter types
type DateFilter = 'all' | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'last30' | 'last90' | 'thisYear' | 'custom';
import { DreamMetricsDOM } from '../../dom/DreamMetricsDOM';
import { TableGenerator } from '../../dom/tables/TableGenerator';
import { FilterManager } from '../../dom/filters/FilterManager';
import { ContentToggler } from '../../dom/content/ContentToggler';

export const ONEIROMETRICS_DASHBOARD_VIEW_TYPE = 'oneirometrics-dashboard';

interface DashboardState {
    entries: DreamMetricData[];
    filteredEntries: DreamMetricData[];
    currentFilter: DateFilter;
    sortColumn: string;
    sortDirection: 'asc' | 'desc';
    searchQuery: string;
    expandedRows: Set<string>;
    isLoading: boolean;
    lastUpdate: number;
}

interface ViewPreferences {
    showMetrics: boolean;
    compactMode: boolean;
    rowHeight: number;
    visibleRows: number;
}

export class OneiroMetricsDashboardView extends ItemView {
    private plugin: OneiroMetricsPlugin;
    private state: DashboardState;
    private preferences: ViewPreferences;
    public containerEl: HTMLElement;
    private searchComponent: SearchComponent;
    private filterDropdown: DropdownComponent;
    
    // Legacy compatibility - will be replaced with optimized renderer
    private legacyMode: boolean = true;
    private legacyDOM: DreamMetricsDOM | null = null;
    private tableGenerator: TableGenerator | null = null;
    private contentToggler: ContentToggler;
    
    constructor(leaf: WorkspaceLeaf, plugin: OneiroMetricsPlugin) {
        super(leaf);
        this.plugin = plugin;
        
        // Initialize state
        this.state = {
            entries: [],
            filteredEntries: [],
            currentFilter: (this.plugin.settings?.lastAppliedFilter || 'all') as DateFilter,
            sortColumn: 'date',
            sortDirection: 'asc',
            searchQuery: '',
            expandedRows: new Set(),
            isLoading: false,
            lastUpdate: Date.now()
        };
        
        // Initialize preferences from settings
        this.preferences = {
            showMetrics: true,
            compactMode: false,
            rowHeight: 50, // Match existing implementation
            visibleRows: 20 // Match existing implementation
        };
        
        // Initialize content toggler
        this.contentToggler = new ContentToggler(this.plugin.logger);
    }
    
    getViewType(): string {
        return ONEIROMETRICS_DASHBOARD_VIEW_TYPE;
    }
    
    getDisplayText(): string {
        return 'OneiroMetrics Dashboard';
    }
    
    getIcon(): string {
        return 'chart-line';
    }
    
    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oneirometrics-dashboard');
        
        // Create main container
        this.containerEl = contentEl.createDiv({ cls: 'oom-dashboard-container' });
        
        // Show loading state
        this.showLoading();
        
        // Initialize the dashboard
        await this.initializeDashboard();
    }
    
    async onClose() {
        // Cleanup
        this.containerEl?.empty();
    }
    
    private async initializeDashboard() {
        try {
            // For now, we'll start with a simple structure
            // Phase 1: Basic rendering with existing data
            this.createHeader();
            this.createControls();
            this.createTableContainer();
            
            // Load initial data
            await this.loadDreamEntries();
            
            // Render the table
            this.renderTable();
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showError('Failed to initialize dashboard');
        } finally {
            this.hideLoading();
        }
    }
    
    private createHeader() {
        const header = this.containerEl.createDiv({ cls: 'oom-dashboard-header' });
        header.createEl('h2', { text: 'Dream Metrics Dashboard' });
        
        // Add last update time
        const updateInfo = header.createDiv({ cls: 'oom-update-info' });
        this.updateLastUpdateTime(updateInfo);
    }
    
    private createControls() {
        const controls = this.containerEl.createDiv({ cls: 'oom-dashboard-controls' });
        
        // Search component
        const searchContainer = controls.createDiv({ cls: 'oom-search-container' });
        this.searchComponent = new SearchComponent(searchContainer);
        this.searchComponent.setPlaceholder('Search dream entries...');
        this.searchComponent.onChange((value) => {
            this.handleSearch(value);
        });
        
        // Filter dropdown
        const filterContainer = controls.createDiv({ cls: 'oom-filter-container' });
        this.filterDropdown = new DropdownComponent(filterContainer);
        this.filterDropdown.addOption('all', 'All Time');
        this.filterDropdown.addOption('today', 'Today');
        this.filterDropdown.addOption('yesterday', 'Yesterday');
        this.filterDropdown.addOption('thisWeek', 'This Week');
        this.filterDropdown.addOption('lastWeek', 'Last Week');
        this.filterDropdown.addOption('thisMonth', 'This Month');
        this.filterDropdown.addOption('lastMonth', 'Last Month');
        this.filterDropdown.addOption('last30', 'Last 30 Days');
        this.filterDropdown.addOption('last90', 'Last 90 Days');
        this.filterDropdown.addOption('thisYear', 'This Year');
        
        this.filterDropdown.onChange((value) => {
            this.handleFilterChange(value as DateFilter);
        });
        
        // Refresh button
        const refreshBtn = controls.createEl('button', {
            text: 'Refresh',
            cls: 'oom-refresh-button'
        });
        refreshBtn.addEventListener('click', () => this.refresh());
    }
    
    private createTableContainer() {
        const tableContainer = this.containerEl.createDiv({ cls: 'oom-table-container' });
        // Table will be rendered here
    }
    
    private async loadDreamEntries() {
        try {
            this.plugin.logger?.debug('Dashboard', 'Loading dream entries...');
            
            // Check if we're in legacy mode
            if (this.legacyMode) {
                // Use existing infrastructure
                await this.loadDreamEntriesLegacy();
            } else {
                // Future optimized implementation
                // Phase 2: Direct integration with UniversalMetricsCalculator
                this.state.entries = [];
                this.state.filteredEntries = [];
            }
        } catch (error) {
            this.plugin.logger?.error('Dashboard', 'Failed to load dream entries', error);
            this.showError('Failed to load dream entries');
        }
    }
    
    private async loadDreamEntriesLegacy() {
        // For now, just show a message that data loading is in progress
        // The full implementation will come in Phase 2
        this.plugin.logger?.info('Dashboard', 'Dashboard is in beta - data loading coming soon');
        
        // Show a placeholder message
        const tableContainer = this.containerEl.querySelector('.oom-table-container');
        if (tableContainer) {
            tableContainer.empty();
            const placeholder = tableContainer.createDiv({ cls: 'oom-dashboard-placeholder' });
            placeholder.createEl('h3', { text: 'OneiroMetrics Dashboard (Beta)' });
            placeholder.createEl('p', { text: 'The dashboard is currently in development.' });
            placeholder.createEl('p', { text: 'To view your dream metrics:' });
            const list = placeholder.createEl('ul');
            list.createEl('li', { text: 'Use the "Dream Scrape" command to update your metrics' });
            list.createEl('li', { text: 'Open your OneiroMetrics note to view the current data' });
            placeholder.createEl('p', { 
                text: 'The dashboard will soon provide live updates without needing to regenerate the HTML table.',
                cls: 'oom-muted'
            });
        }
        
        // Set empty entries for now
        this.state.entries = [];
        this.state.filteredEntries = [];
    }
    
    private parseMetricsFromContent(content: string): DreamMetricData[] {
        const entries: DreamMetricData[] = [];
        
        // Look for the metrics table in the content
        const tableMatch = content.match(/<!-- METRICS_TABLE_START -->([\s\S]*?)<!-- METRICS_TABLE_END -->/);
        if (!tableMatch) {
            this.plugin.logger?.debug('Dashboard', 'No metrics table found in content');
            return entries;
        }
        
        // Parse the table rows
        const tableContent = tableMatch[1];
        const rowRegex = /<tr[^>]*data-date="([^"]+)"[^>]*data-title="([^"]+)"[^>]*>([\s\S]*?)<\/tr>/g;
        let match;
        
        while ((match = rowRegex.exec(tableContent)) !== null) {
            const date = match[1];
            const title = match[2];
            const rowHtml = match[3];
            
            // Extract metrics from the row
            const metrics: Record<string, number> = {};
            const metricRegex = /<td[^>]*class="metric-([^"]+)"[^>]*>([^<]+)<\/td>/g;
            let metricMatch;
            
            while ((metricMatch = metricRegex.exec(rowHtml)) !== null) {
                const metricKey = metricMatch[1];
                const value = parseFloat(metricMatch[2]);
                if (!isNaN(value)) {
                    metrics[metricKey] = value;
                }
            }
            
            // Extract content
            const contentMatch = rowHtml.match(/<div[^>]*class="content-preview"[^>]*>([\s\S]*?)<\/div>/);
            const content = contentMatch ? contentMatch[1].replace(/<[^>]*>/g, '') : '';
            
            entries.push({
                date,
                title,
                content,
                source: title, // Use title as source for now
                metrics
            } as DreamMetricData);
        }
        
        return entries;
    }
    
    private renderTable() {
        const tableContainer = this.containerEl.querySelector('.oom-table-container') as HTMLElement;
        if (!tableContainer) return;
        
        // Check if we're showing the beta placeholder
        const placeholder = tableContainer.querySelector('.oom-dashboard-placeholder');
        if (placeholder) {
            // Keep the placeholder visible, don't clear it
            return;
        }
        
        tableContainer.empty();
        
        if (this.state.filteredEntries.length === 0) {
            tableContainer.createEl('p', { 
                text: 'No dream entries found. Click "Refresh" or run "Dream Scrape" command to populate data.',
                cls: 'oom-empty-state'
            });
            return;
        }
        
        // Legacy mode: Use existing table rendering infrastructure
        if (this.legacyMode) {
            this.renderTableLegacy(tableContainer);
        } else {
            // Future optimized implementation
            this.renderTableOptimized(tableContainer);
        }
    }
    
    private renderTableLegacy(container: HTMLElement) {
        try {
            // Initialize table generator if not already done
            if (!this.tableGenerator) {
                this.tableGenerator = new TableGenerator(
                    this.plugin.settings,
                    this.plugin.logger
                );
            }
            
            // Create table HTML using existing infrastructure
            // The generateMetricsTable expects metrics data and entries
            const metricsData: Record<string, number[]> = {};
            
            // Convert entries to the format expected by TableGenerator
            for (const entry of this.state.filteredEntries) {
                for (const [key, value] of Object.entries(entry.metrics || {})) {
                    if (!metricsData[key]) {
                        metricsData[key] = [];
                    }
                    if (typeof value === 'number') {
                        metricsData[key].push(value);
                    }
                }
            }
            
            const tableHTML = this.tableGenerator.generateMetricsTable(
                metricsData,
                this.state.filteredEntries
            );
            
            // Insert table HTML
            container.innerHTML = tableHTML;
            
            // Add virtual scrolling support
            container.addClass('virtual-scroll');
            container.style.setProperty('--oom-total-rows', String(this.state.filteredEntries.length));
            container.style.setProperty('--oom-row-height', `${this.preferences.rowHeight}px`);
            container.style.setProperty('--oom-visible-rows', String(this.preferences.visibleRows));
            
            // Attach event handlers
            this.attachTableEventHandlers(container);
            
        } catch (error) {
            this.plugin.logger?.error('Dashboard', 'Failed to render table', error);
            container.createEl('p', { 
                text: 'Failed to render table. Please check the console for errors.',
                cls: 'oom-error-message'
            });
        }
    }
    
    private renderTableOptimized(container: HTMLElement) {
        // Phase 2: Future optimized implementation with incremental updates
        container.createEl('p', { 
            text: 'Optimized renderer coming soon...',
            cls: 'oom-empty-state'
        });
    }
    
    private attachTableEventHandlers(container: HTMLElement) {
        // Content expansion handlers
        container.querySelectorAll('.oom-expand-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const row = (e.target as HTMLElement).closest('tr');
                if (row) {
                    const id = row.getAttribute('data-id');
                    if (id) {
                        this.toggleRowExpansion(id);
                    }
                }
            });
        });
        
        // Sort handlers
        container.querySelectorAll('th.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-column');
                if (column) {
                    this.handleSort(column);
                }
            });
        });
    }
    
    private toggleRowExpansion(id: string) {
        if (this.state.expandedRows.has(id)) {
            this.state.expandedRows.delete(id);
        } else {
            this.state.expandedRows.add(id);
        }
        
        // Update the row visually
        const row = this.containerEl.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.toggleClass('oom-row-expanded', this.state.expandedRows.has(id));
            
            // Use content toggler for smooth expansion
            const contentCell = row.querySelector('.oom-content-cell');
            if (contentCell) {
                // For now, just toggle visibility class
                contentCell.toggleClass('oom-content-expanded', this.state.expandedRows.has(id));
                contentCell.toggleClass('oom-content-preview', !this.state.expandedRows.has(id));
            }
        }
    }
    
    private handleSort(column: string) {
        if (this.state.sortColumn === column) {
            // Toggle direction
            this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            // New column, default to ascending
            this.state.sortColumn = column;
            this.state.sortDirection = 'asc';
        }
        
        // Sort the filtered entries
        this.sortEntries();
        
        // Re-render the table
        this.renderTable();
    }
    
    private sortEntries() {
        const column = this.state.sortColumn;
        const direction = this.state.sortDirection;
        
        this.state.filteredEntries.sort((a, b) => {
            let aVal: any = '';
            let bVal: any = '';
            
            if (column === 'date') {
                aVal = new Date(a.date || '').getTime();
                bVal = new Date(b.date || '').getTime();
            } else if (column === 'title') {
                aVal = a.title || '';
                bVal = b.title || '';
            } else if (column in (a.metrics || {})) {
                aVal = a.metrics?.[column] || 0;
                bVal = b.metrics?.[column] || 0;
            }
            
            if (direction === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
    }
    
    private handleSearch(query: string) {
        this.state.searchQuery = query;
        this.applyFilters();
    }
    
    private handleFilterChange(filter: DateFilter) {
        this.state.currentFilter = filter;
        this.applyFilters();
    }
    
    private applyFilters() {
        let filtered = [...this.state.entries];
        
        // Apply date filter
        if (this.state.currentFilter !== 'all') {
            filtered = this.applyDateFilter(filtered, this.state.currentFilter);
        }
        
        // Apply search filter
        if (this.state.searchQuery) {
            filtered = this.applySearchFilter(filtered, this.state.searchQuery);
        }
        
        this.state.filteredEntries = filtered;
        
        // Update filter count display
        this.updateFilterCount();
        
        // Re-render the table
        this.renderTable();
    }
    
    private applyDateFilter(entries: DreamMetricData[], filter: DateFilter): DreamMetricData[] {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return entries.filter(entry => {
            if (!entry.date) return false;
            const entryDate = new Date(entry.date);
            
            switch (filter) {
                case 'today':
                    return entryDate >= today;
                case 'yesterday':
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    return entryDate >= yesterday && entryDate < today;
                case 'thisWeek':
                    const weekStart = new Date(today);
                    weekStart.setDate(weekStart.getDate() - today.getDay());
                    return entryDate >= weekStart;
                case 'lastWeek':
                    const lastWeekEnd = new Date(today);
                    lastWeekEnd.setDate(lastWeekEnd.getDate() - today.getDay());
                    const lastWeekStart = new Date(lastWeekEnd);
                    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
                    return entryDate >= lastWeekStart && entryDate < lastWeekEnd;
                case 'thisMonth':
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    return entryDate >= monthStart;
                case 'lastMonth':
                    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
                    return entryDate >= lastMonthStart && entryDate < lastMonthEnd;
                case 'last30':
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return entryDate >= thirtyDaysAgo;
                case 'last90':
                    const ninetyDaysAgo = new Date(today);
                    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                    return entryDate >= ninetyDaysAgo;
                case 'thisYear':
                    const yearStart = new Date(today.getFullYear(), 0, 1);
                    return entryDate >= yearStart;
                default:
                    return true;
            }
        });
    }
    
    private applySearchFilter(entries: DreamMetricData[], query: string): DreamMetricData[] {
        if (!query) return entries;
        
        const searchFn = prepareSimpleSearch(query);
        
        return entries.filter(entry => {
            // Search in title
            if (entry.title && searchFn(entry.title).score > 0) {
                return true;
            }
            
            // Search in content
            if (entry.content && searchFn(entry.content).score > 0) {
                return true;
            }
            
            // Search in source if available  
            if (entry.source && typeof entry.source === 'string') {
                if (searchFn(entry.source).score > 0) {
                    return true;
                }
            }
            
            return false;
        });
    }
    
    private updateFilterCount() {
        const count = this.state.filteredEntries.length;
        const total = this.state.entries.length;
        
        // Update the header with count
        const header = this.containerEl.querySelector('.oom-dashboard-header h2');
        if (header) {
            if (count < total) {
                header.textContent = `Dream Metrics Dashboard (${count} of ${total} entries)`;
            } else {
                header.textContent = `Dream Metrics Dashboard (${total} entries)`;
            }
        }
    }
    
    private async refresh() {
        this.showLoading();
        
        try {
            // Show notice
            new Notice('Dashboard refresh initiated (beta mode)');
            
            // Load fresh data
            await this.loadDreamEntries();
            
            // Apply current filters
            this.applyFilters();
            
            // Update last update time
            this.state.lastUpdate = Date.now();
            const updateInfo = this.containerEl.querySelector('.oom-update-info');
            if (updateInfo) {
                this.updateLastUpdateTime(updateInfo as HTMLElement);
            }
            
            // Since we're in beta, show a different message
            new Notice('Dashboard refreshed. Full data loading coming in next update.');
        } catch (error) {
            this.plugin.logger?.error('Dashboard', 'Refresh failed', error);
            new Notice('Failed to refresh dream metrics');
        } finally {
            this.hideLoading();
        }
    }
    
    private showLoading() {
        this.state.isLoading = true;
        this.containerEl.addClass('is-loading');
        
        // Add loading overlay
        const loadingOverlay = this.containerEl.createDiv({ cls: 'oom-loading-overlay' });
        loadingOverlay.createDiv({ cls: 'oom-loading-spinner' });
        loadingOverlay.createEl('p', { text: 'Loading dream entries...' });
    }
    
    private hideLoading() {
        this.state.isLoading = false;
        this.containerEl.removeClass('is-loading');
        
        // Remove loading overlay
        const loadingOverlay = this.containerEl.querySelector('.oom-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
    
    private showError(message: string) {
        const errorContainer = this.containerEl.createDiv({ cls: 'oom-error-container' });
        errorContainer.createEl('p', { text: message, cls: 'oom-error-message' });
    }
    
    private updateLastUpdateTime(element: HTMLElement) {
        const now = new Date(this.state.lastUpdate);
        const timeStr = now.toLocaleTimeString();
        const dateStr = now.toLocaleDateString();
        element.setText(`Last updated: ${dateStr} at ${timeStr}`);
    }
}
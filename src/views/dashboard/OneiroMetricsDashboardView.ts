import { ItemView, WorkspaceLeaf, SearchComponent, DropdownComponent, Notice, prepareSimpleSearch, TFile, App } from 'obsidian';
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
        this.plugin.logger?.info('Dashboard', 'Loading dream entries using UniversalMetricsCalculator');
        
        try {
            // Create a UniversalMetricsCalculator instance for the dashboard
            // Pass false as poolConfig to prevent worker pool initialization
            const { UniversalMetricsCalculator } = await import('../../workers/UniversalMetricsCalculator');
            const calculator = new UniversalMetricsCalculator(
                this.app,
                this.plugin,
                false, // Disable worker pool for dashboard use
                this.plugin.logger
            );
            
            // Get files to process based on current settings
            this.plugin.logger?.debug('Dashboard', 'About to get files to process');
            const files = await this.getFilesToProcess();
            this.plugin.logger?.debug('Dashboard', 'Got files result', { 
                filesFound: files?.length || 0,
                filesArray: files 
            });
            
            if (!files || files.length === 0) {
                this.plugin.logger?.info('Dashboard', 'No files found to process');
                this.state.entries = [];
                this.state.filteredEntries = [];
                return;
            }
            
            this.plugin.logger?.info('Dashboard', `Processing ${files.length} files for dashboard`);
            
            // Extract dream entries from files
            const dreamEntries: DreamMetricData[] = [];
            
            for (const filePath of files) {
                const file = this.app.vault.getAbstractFileByPath(filePath);
                if (!(file instanceof TFile)) continue;
                
                try {
                    const content = await this.app.vault.read(file);
                    
                    // Parse entries using the calculator's methods
                    const { entries } = await this.extractEntriesFromFile(content, filePath, calculator);
                    
                    // Convert to DreamMetricData format
                    for (const entry of entries) {
                        const dreamData: DreamMetricData = {
                            date: entry.date,
                            title: entry.title || 'Untitled Dream',
                            content: entry.content || '',
                            source: filePath,
                            wordCount: entry.wordCount || 0,
                            metrics: entry.metrics || {}
                        };
                        dreamEntries.push(dreamData);
                    }
                } catch (error) {
                    this.plugin.logger?.error('Dashboard', `Error processing file ${filePath}`, error);
                }
            }
            
            this.plugin.logger?.info('Dashboard', `Extracted ${dreamEntries.length} dream entries`);
            
            // Update state with the extracted entries
            this.state.entries = dreamEntries;
            this.state.filteredEntries = dreamEntries;
            
        } catch (error) {
            this.plugin.logger?.error('Dashboard', 'Failed to load dream entries', error);
            this.showError('Failed to load dream entries');
            this.state.entries = [];
            this.state.filteredEntries = [];
        }
    }
    
    private async getFilesToProcess(): Promise<string[]> {
        const settings = this.plugin.settings;
        let files: string[] = [];
        
        // Check if settings exist
        if (!settings) {
            this.plugin.logger?.error('Dashboard', 'Settings not available');
            return [];
        }
        
        this.plugin.logger?.debug('Dashboard', 'Getting files to process', {
            hasSettings: !!settings,
            selectionMode: settings.selectionMode,
            selectedFolder: settings.selectedFolder,
            selectedNotesCount: settings.selectedNotes?.length || 0,
            excludedNotesCount: settings.excludedNotes?.length || 0,
            excludedSubfoldersCount: settings.excludedSubfolders?.length || 0
        });
        
        // Handle all selection modes: 'folder', 'automatic', 'notes', 'manual'
        if ((settings.selectionMode === 'folder' || settings.selectionMode === 'automatic') && settings.selectedFolder) {
            // Get files from folder
            const folder = this.app.vault.getAbstractFileByPath(settings.selectedFolder);
            this.plugin.logger?.debug('Dashboard', 'Folder lookup result', {
                folderPath: settings.selectedFolder,
                folderExists: !!folder,
                hasChildren: folder && 'children' in folder
            });
            
            if (folder && 'children' in folder) {
                const gatherFiles = (folder: any, acc: string[]) => {
                    for (const child of folder.children) {
                        if (child && 'extension' in child && child.extension === 'md') {
                            if (!settings.excludedNotes?.includes(child.path)) {
                                acc.push(child.path);
                            }
                        } else if (child && 'children' in child) {
                            if (!settings.excludedSubfolders?.includes(child.path)) {
                                gatherFiles(child, acc);
                            }
                        }
                    }
                };
                gatherFiles(folder, files);
            }
        } else if ((settings.selectionMode === 'notes' || settings.selectionMode === 'manual') && settings.selectedNotes) {
            files = settings.selectedNotes;
        }
        
        this.plugin.logger?.debug('Dashboard', 'Files found for processing', {
            fileCount: files.length,
            files: files.slice(0, 5) // Show first 5 files for debugging
        });
        
        return files;
    }
    
    private async extractEntriesFromFile(content: string, filePath: string, calculator: any): Promise<{ entries: any[] }> {
        // Use the calculator's parseJournalEntries method
        const result = calculator.parseJournalEntries(content, filePath);
        return { entries: result.entries || [] };
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
            // Create a simple table directly without TableGenerator for now
            const table = container.createEl('table', { cls: 'oom-dashboard-table' });
            
            // Create table header
            const thead = table.createEl('thead');
            const headerRow = thead.createEl('tr');
            
            // Basic columns
            headerRow.createEl('th', { text: 'Date', cls: 'sortable', attr: { 'data-column': 'date' } });
            headerRow.createEl('th', { text: 'Title', cls: 'sortable', attr: { 'data-column': 'title' } });
            headerRow.createEl('th', { text: 'Content', cls: 'oom-content-header' });
            
            // Add metric columns for enabled metrics
            const enabledMetrics = Object.entries(this.plugin.settings.metrics)
                .filter(([_, metric]) => metric.enabled)
                .map(([key, metric]) => ({ key, name: metric.name }));
            
            for (const metric of enabledMetrics) {
                headerRow.createEl('th', { 
                    text: metric.name, 
                    cls: 'sortable metric-header', 
                    attr: { 'data-column': metric.key } 
                });
            }
            
            headerRow.createEl('th', { text: 'Source', cls: 'oom-source-header' });
            
            // Create table body
            const tbody = table.createEl('tbody');
            
            // Render rows
            for (const entry of this.state.filteredEntries) {
                const row = tbody.createEl('tr', { 
                    attr: { 
                        'data-id': `${entry.date}_${entry.title}`,
                        'data-date': entry.date,
                        'data-title': entry.title
                    }
                });
                
                // Date cell
                row.createEl('td', { 
                    text: entry.date,
                    cls: 'oom-date-cell'
                });
                
                // Title cell
                row.createEl('td', { 
                    text: entry.title,
                    cls: 'oom-title-cell'
                });
                
                // Content cell with expand/collapse
                const contentCell = row.createEl('td', { cls: 'oom-content-cell' });
                const contentContainer = contentCell.createEl('div', { cls: 'oom-content-container' });
                
                // Add expand toggle
                const expandToggle = contentContainer.createEl('span', { 
                    cls: 'oom-expand-toggle',
                    text: '▶'
                });
                
                // Add content preview
                const contentPreview = contentContainer.createEl('div', { 
                    cls: 'oom-content-preview',
                    text: entry.content.substring(0, 150) + (entry.content.length > 150 ? '...' : '')
                });
                
                // Add full content (hidden by default)
                const contentFull = contentContainer.createEl('div', { 
                    cls: 'oom-content-full',
                    text: entry.content,
                    attr: { style: 'display: none;' }
                });
                
                // Metric cells
                for (const metric of enabledMetrics) {
                    const value = entry.metrics[metric.key] || entry.metrics[metric.name] || 0;
                    row.createEl('td', { 
                        text: String(value),
                        cls: `metric-${metric.key}` 
                    });
                }
                
                // Source cell with link
                const sourceCell = row.createEl('td', { cls: 'oom-source-cell' });
                const sourceLink = sourceCell.createEl('a', { 
                    text: entry.source.split('/').pop() || 'Unknown',
                    cls: 'oom-source-link',
                    href: '#'
                });
                sourceLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Open the source file
                    const file = this.app.vault.getAbstractFileByPath(entry.source);
                    if (file instanceof TFile) {
                        this.app.workspace.getLeaf().openFile(file);
                    }
                });
            }
            
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
                const toggleEl = e.target as HTMLElement;
                const contentContainer = toggleEl.parentElement;
                if (contentContainer) {
                    const preview = contentContainer.querySelector('.oom-content-preview') as HTMLElement;
                    const full = contentContainer.querySelector('.oom-content-full') as HTMLElement;
                    
                    if (full && preview) {
                        if (full.style.display === 'none') {
                            // Expand
                            full.style.display = 'block';
                            preview.style.display = 'none';
                            toggleEl.textContent = '▼'; // Down arrow
                        } else {
                            // Collapse
                            full.style.display = 'none';
                            preview.style.display = 'block';
                            toggleEl.textContent = '▶'; // Right arrow
                        }
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
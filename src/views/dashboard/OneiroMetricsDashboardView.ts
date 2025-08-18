import { ItemView, WorkspaceLeaf, SearchComponent, DropdownComponent, Notice, prepareSimpleSearch, TFile, App, Menu } from 'obsidian';
import type DreamMetricsPlugin from '../../../main';
import type { DreamMetricData } from '../../../types';
import type { DreamMetricsSettings } from '../../../types';

// Date filter types
type DateFilter = 'all' | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'last30' | 'last90' | 'thisYear' | 'custom';
import { DreamMetricsDOM } from '../../dom/DreamMetricsDOM';
import { TableGenerator } from '../../dom/tables/TableGenerator';
import { FilterManager } from '../../dom/filters/FilterManager';
import { ContentToggler } from '../../dom/content/ContentToggler';
import { VirtualScroller } from './VirtualScroller';

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
    entriesMap: Map<string, DreamMetricData>; // For quick lookups
    pendingUpdates: Set<string>; // Track entries that need updating
}

interface ViewPreferences {
    showMetrics: boolean;
    compactMode: boolean;
    rowHeight: number;
    visibleRows: number;
}

export class OneiroMetricsDashboardView extends ItemView {
    private plugin: DreamMetricsPlugin;
    private state: DashboardState;
    private preferences: ViewPreferences;
    public containerEl: HTMLElement;
    private searchComponent: SearchComponent;
    private filterDropdown: DropdownComponent;
    
    // Virtual scrolling is enabled by default - set to true to use legacy mode
    private legacyMode: boolean = false; // Virtual scrolling is enabled by default
    private legacyDOM: DreamMetricsDOM | null = null;
    private tableGenerator: TableGenerator | null = null;
    private contentToggler: ContentToggler;
    public virtualScroller: VirtualScroller | null = null;
    
    // File watcher and performance monitoring
    private fileWatcherRef: any = null;
    private performanceMetrics: {
        lastFullRender: number;
        lastIncrementalUpdate: number;
        fullRenderCount: number;
        incrementalUpdateCount: number;
        averageFullRenderTime: number;
        averageIncrementalTime: number;
        timeSaved: number;
    } = {
        lastFullRender: 0,
        lastIncrementalUpdate: 0,
        fullRenderCount: 0,
        incrementalUpdateCount: 0,
        averageFullRenderTime: 0,
        averageIncrementalTime: 0,
        timeSaved: 0
    };
    
    constructor(leaf: WorkspaceLeaf, plugin: DreamMetricsPlugin) {
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
            lastUpdate: Date.now(),
            entriesMap: new Map(),
            pendingUpdates: new Set()
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
    
    /**
     * Get virtual scroller instance for testing and debugging
     */
    public getVirtualScroller(): VirtualScroller | null {
        return this.virtualScroller;
    }
    
    /**
     * Check if virtual scrolling is enabled
     */
    public isVirtualScrollingEnabled(): boolean {
        return !this.legacyMode && this.virtualScroller !== null;
    }
    
    /**
     * Get dashboard performance metrics
     */
    public getDashboardMetrics(): any {
        return {
            ...this.performanceMetrics,
            virtualScrollerMetrics: this.virtualScroller?.getPerformanceMetrics() || null,
            entriesCount: this.state.entries.length,
            filteredEntriesCount: this.state.filteredEntries.length,
            isVirtualScrolling: this.isVirtualScrollingEnabled()
        };
    }
    
    // Public method to show performance stats - can be called from plugin commands
    public showPerformanceStats() {
        if (this.performanceMetrics.fullRenderCount === 0 && 
            this.performanceMetrics.incrementalUpdateCount === 0) {
            new Notice('No performance data available yet. Try making some changes to dream entries.');
            return;
        }
        
        const stats = [
            `OneiroMetrics Dashboard Performance:`,
            `• Full renders: ${this.performanceMetrics.fullRenderCount} (avg: ${this.performanceMetrics.averageFullRenderTime.toFixed(1)}ms)`,
            `• Incremental updates: ${this.performanceMetrics.incrementalUpdateCount} (avg: ${this.performanceMetrics.averageIncrementalTime.toFixed(1)}ms)`,
            `• Total time saved: ${(this.performanceMetrics.timeSaved / 1000).toFixed(1)}s`
        ];
        
        if (this.performanceMetrics.averageFullRenderTime > 0) {
            const efficiency = ((1 - this.performanceMetrics.averageIncrementalTime / 
                              this.performanceMetrics.averageFullRenderTime) * 100).toFixed(1);
            stats.push(`• Efficiency gain: ${efficiency}%`);
        }
        
        new Notice(stats.join('\n'), 8000);
        
        // Also log detailed stats
        this.logPerformanceMetrics();
    }
    
    // Public method to manually trigger incremental update - useful for testing
    public async triggerIncrementalUpdate() {
        const startTime = performance.now();
        
        this.plugin.logger?.info('Dashboard', 'Manual incremental update triggered');
        
        // Re-load entries and perform incremental update
        const newEntries = await this.loadDreamEntriesQuiet();
        this.updateEntriesIncremental(newEntries);
        
        const updateTime = performance.now() - startTime;
        this.trackIncrementalPerformance(updateTime);
        
        new Notice(`Incremental update completed in ${updateTime.toFixed(1)}ms`);
    }
    
    // Public method to test virtual scrolling performance
    public testVirtualScrolling() {
        // Check if virtual scrolling is active
        const isVirtualActive = !this.legacyMode && this.virtualScroller !== null;
        
        if (!isVirtualActive) {
            const info = [
                `Virtual Scrolling Status: INACTIVE`,
                `• Mode: ${this.legacyMode ? 'Legacy Mode (virtual disabled)' : 'Not initialized'}`,
                `• Total entries: ${this.state.filteredEntries.length}`,
                `• Recommendation: Virtual scrolling should be active for ${this.state.filteredEntries.length} entries`
            ];
            new Notice(info.join('\n'), 8000);
            return;
        }
        
        const metrics = this.virtualScroller!.getPerformanceMetrics();
        const scrollViewport = this.containerEl.querySelector('.oom-scroll-viewport') as HTMLElement;
        
        // Get detailed information about rendered rows
        const visibleRows = scrollViewport?.querySelectorAll('.oom-dream-row').length || 0;
        const topSpacer = scrollViewport?.querySelector('.oom-virtual-spacer-top') as HTMLElement;
        const bottomSpacer = scrollViewport?.querySelector('.oom-virtual-spacer-bottom') as HTMLElement;
        
        // Calculate performance rating
        const performanceRating = this.getPerformanceRating(metrics.averageRenderTime);
        
        const info = [
            `Virtual Scrolling Status: ACTIVE ✓`,
            ``,
            `Configuration:`,
            `• Total entries: ${this.state.filteredEntries.length}`,
            `• Configured visible rows: ${this.preferences.visibleRows}`,
            `• Row height: ${this.preferences.rowHeight}px`,
            `• Viewport height: ${this.preferences.rowHeight * this.preferences.visibleRows}px`,
            ``,
            `Current State:`,
            `• Actual rendered rows: ${visibleRows}`,
            `• Top spacer: ${topSpacer?.style.height || '0px'}`,
            `• Bottom spacer: ${bottomSpacer?.style.height || '0px'}`,
            `• Scroll container: ${scrollViewport ? 'Found ✓' : 'Not found ✗'}`,
            `• Container height: ${scrollViewport?.offsetHeight || 0}px`,
            ``,
            `Performance:`,
            `• Average render time: ${metrics.averageRenderTime.toFixed(2)}ms`,
            `• Total renders: ${metrics.totalRenders}`,
            `• Performance rating: ${performanceRating}`,
            `• Memory efficiency: ${this.calculateMemoryEfficiency(visibleRows, this.state.filteredEntries.length)}`
        ];
        
        new Notice(info.join('\n'), 12000);
        
        this.plugin.logger?.info('Dashboard', 'Virtual scrolling test complete', {
            isActive: true,
            legacyMode: this.legacyMode,
            totalEntries: this.state.filteredEntries.length,
            configuredVisibleRows: this.preferences.visibleRows,
            actualVisibleRows: visibleRows,
            rowHeight: this.preferences.rowHeight,
            metrics,
            viewportFound: !!scrollViewport,
            viewportHeight: scrollViewport?.offsetHeight || 0,
            topSpacerHeight: topSpacer?.style.height,
            bottomSpacerHeight: bottomSpacer?.style.height,
            performanceRating
        });
    }
    
    private getPerformanceRating(avgRenderTime: number): string {
        if (avgRenderTime === 0) return 'No data yet';
        if (avgRenderTime < 16.67) return 'Excellent (60+ FPS)';
        if (avgRenderTime < 33.33) return 'Good (30-60 FPS)';
        if (avgRenderTime < 50) return 'Fair (20-30 FPS)';
        return 'Poor (<20 FPS)';
    }
    
    private calculateMemoryEfficiency(visibleRows: number, totalEntries: number): string {
        if (totalEntries === 0) return 'N/A';
        const efficiency = ((visibleRows / totalEntries) * 100).toFixed(1);
        const saved = 100 - parseFloat(efficiency);
        return `${saved.toFixed(1)}% memory saved (${visibleRows}/${totalEntries} rows in DOM)`;
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
        
        // Set up file watcher for automatic updates
        this.setupFileWatcher();
    }
    
    async onClose() {
        // Clean up virtual scroller
        if (this.virtualScroller) {
            this.virtualScroller.destroy();
            this.virtualScroller = null;
        }
        
        // Cleanup file watcher
        this.cleanupFileWatcher();
        
        // Log performance metrics before closing
        this.logPerformanceMetrics();
        
        // Cleanup DOM
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
        const startTime = performance.now();
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
            this.updateEntriesIncremental(dreamEntries);
            
            // Track initial load as incremental update if entries already existed
            if (this.state.entries.length > 0) {
                const loadTime = performance.now() - startTime;
                this.trackIncrementalPerformance(loadTime);
            }
            
        } catch (error) {
            this.plugin.logger?.error('Dashboard', 'Failed to load dream entries', error);
            this.showError('Failed to load dream entries');
            this.state.entries = [];
            this.state.filteredEntries = [];
            this.state.entriesMap.clear();
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
        const startTime = performance.now();
        
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
        
        // Use virtual scrolling by default, legacy mode as fallback
        if (this.legacyMode) {
            this.plugin.logger?.debug('Dashboard', 'Using legacy table rendering');
            this.renderTableLegacy(tableContainer);
        } else {
            this.plugin.logger?.debug('Dashboard', 'Using virtual scrolling rendering');
            this.renderTableOptimized(tableContainer);
        }
        
        // Track performance for full renders
        const renderTime = performance.now() - startTime;
        this.trackFullRenderPerformance(renderTime);
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
                // Display "Themes" instead of "Dream Themes" in the header
                const displayName = metric.name === 'Dream Themes' ? 'Themes' : metric.name;
                headerRow.createEl('th', { 
                    text: displayName, 
                    cls: 'sortable metric-header', 
                    attr: { 'data-column': metric.key } 
                });
            }
            
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
                
                // Title cell - make it clickable
                const titleCell = row.createEl('td', { cls: 'oom-title-cell' });
                const titleLink = titleCell.createEl('a', { 
                    text: entry.title,
                    cls: 'oom-title-link',
                    href: '#'
                });
                // Helper function to get source path
                const getSourcePath = (): string => {
                    const source = entry.source;
                    if (typeof source === 'string') {
                        return source;
                    } else if (source && typeof source === 'object') {
                        const sourceObj = source as { file: string; id?: string };
                        return sourceObj.file;
                    }
                    return '';
                };
                
                titleLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sourcePath = getSourcePath();
                    if (sourcePath) {
                        const file = this.app.vault.getAbstractFileByPath(sourcePath);
                        if (file instanceof TFile) {
                            this.app.workspace.getLeaf().openFile(file);
                        }
                    }
                });
                
                // Add right-click context menu
                titleLink.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    const sourcePath = getSourcePath();
                    if (!sourcePath) return;
                    
                    const file = this.app.vault.getAbstractFileByPath(sourcePath);
                    if (!(file instanceof TFile)) return;
                    
                    const menu = new Menu();
                    
                    menu.addItem((item) => {
                        item.setTitle('Open in new tab')
                            .setIcon('file-plus')
                            .onClick(() => {
                                this.app.workspace.getLeaf('tab').openFile(file);
                            });
                    });
                    
                    menu.addItem((item) => {
                        item.setTitle('Open to the right')
                            .setIcon('separator-vertical')
                            .onClick(() => {
                                this.app.workspace.getLeaf('split').openFile(file);
                            });
                    });
                    
                    menu.addItem((item) => {
                        item.setTitle('Open to the left')
                            .setIcon('separator-vertical')
                            .onClick(() => {
                                const leaf = this.app.workspace.getLeaf('split');
                                this.app.workspace.setActiveLeaf(leaf, { focus: true });
                                const leftLeaf = this.app.workspace.getLeaf('split');
                                leftLeaf.openFile(file);
                            });
                    });
                    
                    menu.addItem((item) => {
                        item.setTitle('Open in new window')
                            .setIcon('maximize')
                            .onClick(() => {
                                this.app.workspace.getLeaf('window').openFile(file);
                            });
                    });
                    
                    menu.addSeparator();
                    
                    menu.addItem((item) => {
                        item.setTitle('Reveal in navigation')
                            .setIcon('folder-open')
                            .onClick(() => {
                                const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
                                if (fileExplorer) {
                                    (fileExplorer.view as any).revealInFolder(file);
                                }
                            });
                    });
                    
                    menu.showAtMouseEvent(e);
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
                    let displayValue = String(value);
                    
                    // Special handling for Dream Themes and other list/tag type metrics
                    if (metric.name === 'Dream Themes' || metric.name === 'Characters List' || metric.name === 'Symbolic Content') {
                        
                        // If the value is an array, join it with commas
                        if (Array.isArray(value)) {
                            // Handle malformed arrays where first element starts with [ and last ends with ]
                            const cleanedArray = value.map((item, index) => {
                                let cleaned = String(item);
                                // Remove opening bracket from first element
                                if (index === 0) {
                                    cleaned = cleaned.replace(/^\[/, '');
                                }
                                // Remove closing bracket from last element
                                if (index === value.length - 1) {
                                    cleaned = cleaned.replace(/\]$/, '');
                                }
                                return cleaned.trim();
                            });
                            displayValue = cleanedArray.join(', ');
                        } else if (typeof value === 'string' && value !== '0' && value !== '') {
                            // If it's already a string and not just '0' or empty
                            // Strip square brackets if present (from YAML array syntax)
                            // Also handle cases where there might be quotes inside brackets
                            const processed = (value as string)
                                .replace(/^\[|\]$/g, '') // Remove outer brackets
                                .replace(/^["']|["']$/g, '') // Remove quotes if present
                                .trim();
                            
                            displayValue = processed;
                            
                        } else if (String(value) === '0' || String(value) === '' || value === 0) {
                            // If it's 0 or empty string (checking both as string and number), show as empty
                            displayValue = '';
                        }
                    }
                    
                    row.createEl('td', { 
                        text: displayValue,
                        cls: `metric-${metric.key}` 
                    });
                }
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
        // Virtual scrolling implementation
        const startTime = performance.now();
        
        try {
            // Clean up existing virtual scroller if any
            if (this.virtualScroller) {
                this.virtualScroller.destroy();
                this.virtualScroller = null;
            }
            
            // Get enabled metrics from settings
            const enabledMetrics = Object.values(this.plugin.settings.metrics)
                .filter(m => m.enabled)
                .map(m => ({ key: m.name.toLowerCase().replace(/\s+/g, '-'), name: m.name }));
            
            // Initialize virtual scroller
            this.virtualScroller = new VirtualScroller({
                container,
                entries: this.state.filteredEntries,
                rowHeight: this.preferences.rowHeight,
                visibleRows: this.preferences.visibleRows,
                enabledMetrics,
                expandedRows: this.state.expandedRows,
                plugin: this.plugin,
                onRowExpand: (id, isExpanded) => {
                    // Update state when row is expanded/collapsed
                    if (isExpanded) {
                        this.state.expandedRows.add(id);
                    } else {
                        this.state.expandedRows.delete(id);
                    }
                    // Track in performance metrics
                    this.plugin.logger?.debug('Dashboard', 'Row expansion toggled', { id, isExpanded });
                },
                onRowClick: (entry) => {
                    // Optional: Track clicked entries or perform other actions
                    this.plugin.logger?.debug('Dashboard', 'Row clicked', { entry });
                },
                onSort: (column) => {
                    // Handle sorting
                    this.handleSort(column);
                }
            });
            
            // Track performance
            const renderTime = performance.now() - startTime;
            this.performanceMetrics.lastFullRender = renderTime;
            this.performanceMetrics.fullRenderCount++;
            this.performanceMetrics.averageFullRenderTime = 
                (this.performanceMetrics.averageFullRenderTime * (this.performanceMetrics.fullRenderCount - 1) + renderTime) 
                / this.performanceMetrics.fullRenderCount;
            
            this.plugin.logger?.info('Dashboard', 'Virtual scrolling initialized', {
                renderTime: renderTime.toFixed(2),
                totalEntries: this.state.filteredEntries.length,
                enabledMetrics: enabledMetrics.length,
                viewportHeight: this.preferences.rowHeight * this.preferences.visibleRows,
                performanceMetrics: this.virtualScroller.getPerformanceMetrics()
            });
            
        } catch (error) {
            this.plugin.logger?.error('Dashboard', 'Failed to initialize virtual scrolling', error);
            // Fallback to legacy mode
            this.legacyMode = true;
            this.renderTableLegacy(container);
        }
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
        
        // Update the view based on current mode
        if (this.virtualScroller && !this.legacyMode) {
            // For virtual scroller, just update entries
            this.virtualScroller.updateEntries(this.state.filteredEntries);
        } else {
            // When sort changes in legacy mode, we need a full re-render since order changed
            // Clear pending updates to force full render
            this.state.pendingUpdates.clear();
            
            // Re-render the table
            this.renderTable();
        }
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
        
        // Update virtual scroller if it exists
        if (this.virtualScroller) {
            this.virtualScroller.updateEntries(this.state.filteredEntries);
        } else {
            // When filters change, we need a full re-render since visible entries changed
            // Clear pending updates to force full render
            this.state.pendingUpdates.clear();
            
            // Re-render the table
            this.renderTable();
        }
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
            new Notice('Refreshing dashboard...');
            
            // Load fresh data - incremental updates will be handled automatically
            await this.loadDreamEntries();
            
            // Update last update time
            this.state.lastUpdate = Date.now();
            const updateInfo = this.containerEl.querySelector('.oom-update-info');
            if (updateInfo) {
                this.updateLastUpdateTime(updateInfo as HTMLElement);
            }
            
            // Show completion notice with update summary
            const updateCount = this.state.pendingUpdates.size;
            if (updateCount > 0) {
                new Notice(`Dashboard refreshed: ${updateCount} entries updated`);
            } else {
                new Notice('Dashboard refreshed: No changes detected');
            }
            
            // Clear pending updates
            this.state.pendingUpdates.clear();
            
            // If using virtual scroller, update it directly for better performance
            if (this.virtualScroller && !this.legacyMode) {
                this.virtualScroller.updateEntries(this.state.filteredEntries);
                
                // Log performance metrics
                const metrics = this.virtualScroller.getPerformanceMetrics();
                this.plugin.logger?.debug('Dashboard', 'Virtual scroller performance', {
                    averageRenderTime: metrics.averageRenderTime.toFixed(2),
                    totalRenders: metrics.totalRenders
                });
            }
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
    
    // Incremental update methods
    private updateEntriesIncremental(newEntries: DreamMetricData[]) {
        this.plugin.logger?.debug('Dashboard', 'Starting incremental update', {
            newEntriesCount: newEntries.length,
            existingEntriesCount: this.state.entries.length
        });
        
        // Create a map of new entries for quick lookup
        const newEntriesMap = new Map<string, DreamMetricData>();
        for (const entry of newEntries) {
            const id = this.getEntryId(entry);
            newEntriesMap.set(id, entry);
        }
        
        // Find entries that need updating
        const toUpdate = new Set<string>();
        const toAdd: DreamMetricData[] = [];
        const toRemove = new Set<string>();
        
        // Check existing entries
        for (const [id, existingEntry] of this.state.entriesMap) {
            const newEntry = newEntriesMap.get(id);
            if (!newEntry) {
                // Entry was removed
                toRemove.add(id);
            } else if (this.hasEntryChanged(existingEntry, newEntry)) {
                // Entry was modified
                toUpdate.add(id);
            }
        }
        
        // Check for new entries
        for (const [id, newEntry] of newEntriesMap) {
            if (!this.state.entriesMap.has(id)) {
                toAdd.push(newEntry);
            }
        }
        
        this.plugin.logger?.info('Dashboard', 'Incremental update analysis', {
            toUpdate: toUpdate.size,
            toAdd: toAdd.length,
            toRemove: toRemove.size
        });
        
        // Apply updates
        if (toUpdate.size > 0 || toAdd.length > 0 || toRemove.size > 0) {
            // Update the entries map
            for (const id of toRemove) {
                this.state.entriesMap.delete(id);
            }
            
            for (const entry of toAdd) {
                const id = this.getEntryId(entry);
                this.state.entriesMap.set(id, entry);
            }
            
            for (const id of toUpdate) {
                const newEntry = newEntriesMap.get(id);
                if (newEntry) {
                    this.state.entriesMap.set(id, newEntry);
                }
            }
            
            // Rebuild the entries array
            this.state.entries = Array.from(this.state.entriesMap.values());
            
            // Store pending updates for incremental rendering
            this.state.pendingUpdates = new Set([...toUpdate, ...toAdd.map(e => this.getEntryId(e))]);
            
            // Re-apply filters and sorting
            this.applyFilters();
            
            // If table exists, update incrementally
            if (this.isTableRendered()) {
                this.applyIncrementalUpdates(toUpdate, toAdd, toRemove);
            } else {
                // First render, do full render
                this.renderTable();
            }
        } else {
            this.plugin.logger?.debug('Dashboard', 'No changes detected, skipping update');
        }
    }
    
    private getEntryId(entry: DreamMetricData): string {
        return `${entry.date}_${entry.title}`;
    }
    
    private hasEntryChanged(oldEntry: DreamMetricData, newEntry: DreamMetricData): boolean {
        // Check if content changed
        if (oldEntry.content !== newEntry.content) return true;
        
        // Check if word count changed
        if (oldEntry.wordCount !== newEntry.wordCount) return true;
        
        // Check if metrics changed
        const oldMetrics = oldEntry.metrics || {};
        const newMetrics = newEntry.metrics || {};
        
        // Check if metric keys are different
        const oldKeys = Object.keys(oldMetrics);
        const newKeys = Object.keys(newMetrics);
        if (oldKeys.length !== newKeys.length) return true;
        
        // Check each metric value
        for (const key of oldKeys) {
            if (!newKeys.includes(key)) return true;
            
            const oldValue = oldMetrics[key];
            const newValue = newMetrics[key];
            
            // Handle array comparison for text metrics
            if (Array.isArray(oldValue) && Array.isArray(newValue)) {
                if (oldValue.length !== newValue.length) return true;
                for (let i = 0; i < oldValue.length; i++) {
                    if (oldValue[i] !== newValue[i]) return true;
                }
            } else if (oldValue !== newValue) {
                return true;
            }
        }
        
        return false;
    }
    
    private isTableRendered(): boolean {
        // Check if virtual scroller is initialized
        if (this.virtualScroller && !this.legacyMode) {
            return true;
        }
        
        // Check for legacy table
        const table = this.containerEl.querySelector('.oom-dashboard-table');
        return !!table;
    }
    
    private applyIncrementalUpdates(toUpdate: Set<string>, toAdd: DreamMetricData[], toRemove: Set<string>) {
        this.plugin.logger?.debug('Dashboard', 'Applying incremental updates');
        
        // If using virtual scroller, just update the entries
        if (this.virtualScroller && !this.legacyMode) {
            // Apply filters to get updated filtered entries
            this.applyFilters();
            
            // Update virtual scroller with new entries
            this.virtualScroller.updateEntries(this.state.filteredEntries);
            
            // Log performance
            const metrics = this.virtualScroller.getPerformanceMetrics();
            this.plugin.logger?.info('Dashboard', 'Virtual scroller incremental update', {
                updated: toUpdate.size,
                added: toAdd.length,
                removed: toRemove.size,
                avgRenderTime: metrics.averageRenderTime.toFixed(2),
                totalRenders: metrics.totalRenders
            });
        } else {
            // Legacy DOM manipulation for non-virtual scrolling mode
            const table = this.containerEl.querySelector('.oom-dashboard-table');
            if (!table) return;
            
            const tbody = table.querySelector('tbody');
            if (!tbody) return;
            
            // Remove deleted entries
            for (const id of toRemove) {
                const row = tbody.querySelector(`tr[data-id="${id}"]`);
                if (row) {
                    row.remove();
                }
            }
            
            // Update modified entries
            for (const id of toUpdate) {
                const entry = this.state.entriesMap.get(id);
                if (!entry) continue;
                
                // Check if entry is in filtered results
                const isVisible = this.state.filteredEntries.some(e => this.getEntryId(e) === id);
                if (!isVisible) continue;
                
                const row = tbody.querySelector(`tr[data-id="${id}"]`);
                if (row) {
                    this.updateTableRow(row as HTMLTableRowElement, entry);
                }
            }
            
            // Add new entries (if they pass filters)
            for (const entry of toAdd) {
                const id = this.getEntryId(entry);
                const isVisible = this.state.filteredEntries.some(e => this.getEntryId(e) === id);
                if (isVisible) {
                    const newRow = this.createTableRow(entry);
                    
                    // Find the correct position based on current sort
                    const rows = Array.from(tbody.querySelectorAll('tr'));
                    let insertBefore: Element | null = null;
                    
                    for (const row of rows) {
                        const rowEntry = this.getEntryFromRow(row as HTMLTableRowElement);
                        if (rowEntry && this.compareEntries(entry, rowEntry) < 0) {
                            insertBefore = row;
                            break;
                        }
                    }
                    
                    if (insertBefore) {
                        tbody.insertBefore(newRow, insertBefore);
                    } else {
                        tbody.appendChild(newRow);
                    }
                }
            }
        }
        
        // Update filter count
        this.updateFilterCount();
        
        this.plugin.logger?.info('Dashboard', 'Incremental updates applied');
    }
    
    private updateTableRow(row: HTMLTableRowElement, entry: DreamMetricData) {
        // Update content cell
        const contentContainer = row.querySelector('.oom-content-container');
        if (contentContainer) {
            const preview = contentContainer.querySelector('.oom-content-preview');
            const full = contentContainer.querySelector('.oom-content-full');
            
            if (preview) {
                preview.textContent = entry.content.substring(0, 150) + (entry.content.length > 150 ? '...' : '');
            }
            if (full) {
                full.textContent = entry.content;
            }
        }
        
        // Update metric cells
        const enabledMetrics = Object.entries(this.plugin.settings.metrics)
            .filter(([_, metric]) => metric.enabled)
            .map(([key, metric]) => ({ key, name: metric.name }));
            
        for (const metric of enabledMetrics) {
            const cell = row.querySelector(`.metric-${metric.key}`);
            if (cell) {
                const value = entry.metrics[metric.key] || entry.metrics[metric.name] || 0;
                cell.textContent = this.formatMetricValue(value, metric.name);
            }
        }
    }
    
    private createTableRow(entry: DreamMetricData): HTMLTableRowElement {
        const row = document.createElement('tr');
        row.setAttribute('data-id', this.getEntryId(entry));
        row.setAttribute('data-date', entry.date);
        row.setAttribute('data-title', entry.title);
        row.classList.add('oom-dashboard-row');
        
        // Date cell
        const dateCell = row.createEl('td', { cls: 'oom-date-cell' });
        const dateLink = dateCell.createEl('a', { 
            text: entry.date,
            cls: 'oom-date-link',
            href: '#'
        });
        
        dateLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const file = this.app.vault.getAbstractFileByPath(entry.source as string);
            if (file instanceof TFile) {
                await this.app.workspace.getLeaf().openFile(file);
            }
        });
        
        // Title cell with context menu
        const titleCell = row.createEl('td', { 
            text: entry.title,
            cls: 'oom-title-cell'
        });
        
        titleCell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const menu = new Menu();
            const file = this.app.vault.getAbstractFileByPath(entry.source as string);
            if (!(file instanceof TFile)) return;
            
            menu.addItem((item) => {
                item.setTitle('Open in new tab')
                    .setIcon('file-plus')
                    .onClick(() => {
                        this.app.workspace.getLeaf('tab').openFile(file);
                    });
            });
            
            menu.addItem((item) => {
                item.setTitle('Open to the right')
                    .setIcon('separator-vertical')
                    .onClick(() => {
                        this.app.workspace.getLeaf('split').openFile(file);
                    });
            });
            
            menu.addItem((item) => {
                item.setTitle('Reveal in navigation')
                    .setIcon('folder-open')
                    .onClick(() => {
                        const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
                        if (fileExplorer) {
                            (fileExplorer.view as any).revealInFolder(file);
                        }
                    });
            });
            
            menu.showAtMouseEvent(e);
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
        
        // Get enabled metrics
        const enabledMetrics = Object.entries(this.plugin.settings.metrics)
            .filter(([_, metric]) => metric.enabled)
            .map(([key, metric]) => ({ key, name: metric.name }));
        
        // Metric cells
        for (const metric of enabledMetrics) {
            const value = entry.metrics[metric.key] || entry.metrics[metric.name] || 0;
            const displayValue = this.formatMetricValue(value, metric.name);
            
            row.createEl('td', { 
                text: displayValue,
                cls: `metric-${metric.key}` 
            });
        }
        
        return row;
    }
    
    private getEntryFromRow(row: HTMLTableRowElement): DreamMetricData | null {
        const id = row.getAttribute('data-id');
        if (!id) return null;
        
        return this.state.entriesMap.get(id) || null;
    }
    
    private compareEntries(a: DreamMetricData, b: DreamMetricData): number {
        const column = this.state.sortColumn;
        const direction = this.state.sortDirection;
        
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
    }
    
    private formatMetricValue(value: any, metricName: string): string {
        // Special handling for Dream Themes and other list/tag type metrics
        if (metricName === 'Dream Themes' || metricName === 'Characters List' || metricName === 'Symbolic Content') {
            
            // If the value is an array, join it with commas
            if (Array.isArray(value)) {
                // Handle malformed arrays where first element starts with [ and last ends with ]
                const cleanedArray = value.map((item, index) => {
                    let cleaned = String(item);
                    // Remove opening bracket from first element
                    if (index === 0) {
                        cleaned = cleaned.replace(/^\[/, '');
                    }
                    // Remove closing bracket from last element
                    if (index === value.length - 1) {
                        cleaned = cleaned.replace(/\]$/, '');
                    }
                    return cleaned.trim();
                });
                return cleanedArray.join(', ');
            } else if (typeof value === 'string' && value !== '0' && value !== '') {
                // If it's already a string and not just '0' or empty
                // Strip square brackets if present (from YAML array syntax)
                // Also handle cases where there might be quotes inside brackets
                const processed = (value as string)
                    .replace(/^\[|\]$/g, '') // Remove outer brackets
                    .replace(/^[\"']|[\"']$/g, '') // Remove quotes if present
                    .trim();
                
                return processed;
                
            } else if (String(value) === '0' || String(value) === '' || value === 0) {
                // If it's 0 or empty string (checking both as string and number), show as empty
                return '';
            }
        }
        
        return String(value);
    }
    
    // File watcher methods
    private setupFileWatcher() {
        this.plugin.logger?.info('Dashboard', 'Setting up file watcher for automatic updates');
        
        // Watch for vault changes
        this.fileWatcherRef = this.app.vault.on('modify', async (file) => {
            // Only process markdown files
            if (!(file instanceof TFile) || file.extension !== 'md') {
                return;
            }
            
            // Check if this file is in the selected folder
            const selectedFolder = this.plugin.settings.selectedFolder || 'Dream Journal';
            if (!file.path.startsWith(selectedFolder)) {
                return;
            }
            
            this.plugin.logger?.debug('Dashboard', 'File modified, triggering incremental update', {
                file: file.path
            });
            
            // Debounce updates to avoid excessive processing
            if (this.updateDebounceTimer) {
                clearTimeout(this.updateDebounceTimer);
            }
            
            this.updateDebounceTimer = setTimeout(async () => {
                await this.handleFileChange(file);
            }, 500);
        });
        
        // Also watch for file deletions
        this.registerEvent(
            this.app.vault.on('delete', async (file) => {
                if (!(file instanceof TFile) || file.extension !== 'md') {
                    return;
                }
                
                const selectedFolder = this.plugin.settings.selectedFolder || 'Dream Journal';
                if (!file.path.startsWith(selectedFolder)) {
                    return;
                }
                
                this.plugin.logger?.debug('Dashboard', 'File deleted, triggering incremental update', {
                    file: file.path
                });
                
                await this.handleFileChange(null, file.path);
            })
        );
        
        // Watch for file creations
        this.registerEvent(
            this.app.vault.on('create', async (file) => {
                if (!(file instanceof TFile) || file.extension !== 'md') {
                    return;
                }
                
                const selectedFolder = this.plugin.settings.selectedFolder || 'Dream Journal';
                if (!file.path.startsWith(selectedFolder)) {
                    return;
                }
                
                this.plugin.logger?.debug('Dashboard', 'File created, triggering incremental update', {
                    file: file.path
                });
                
                // Wait a bit for the file to be fully written
                setTimeout(async () => {
                    await this.handleFileChange(file);
                }, 1000);
            })
        );
        
        // Watch for settings changes that affect metrics
        // Periodically check if metrics configuration has changed
        // Since Obsidian plugins don't have built-in settings change events,
        // we'll check when the view regains focus
        this.registerDomEvent(window, 'focus', () => {
            // Check if metrics configuration changed
            const enabledMetrics = Object.entries(this.plugin.settings.metrics)
                .filter(([_, metric]) => metric.enabled)
                .map(([key]) => key);
            
            if (!this.lastEnabledMetrics) {
                this.lastEnabledMetrics = enabledMetrics;
            } else if (!this.arraysEqual(enabledMetrics, this.lastEnabledMetrics)) {
                this.plugin.logger?.info('Dashboard', 'Metrics configuration changed, re-rendering table');
                this.lastEnabledMetrics = enabledMetrics;
                
                // Clear pending updates to force full render when metrics change
                this.state.pendingUpdates.clear();
                
                // Re-load entries and render
                this.loadDreamEntries().then(() => {
                    this.renderTable();
                });
            }
        });
    }
    
    private cleanupFileWatcher() {
        if (this.fileWatcherRef) {
            this.app.vault.offref(this.fileWatcherRef);
            this.fileWatcherRef = null;
        }
        
        if (this.updateDebounceTimer) {
            clearTimeout(this.updateDebounceTimer);
            this.updateDebounceTimer = null;
        }
    }
    
    private async handleFileChange(file: TFile | null, deletedPath?: string) {
        const startTime = performance.now();
        
        try {
            // Re-load dream entries
            const newEntries = await this.loadDreamEntriesQuiet();
            
            // Perform incremental update
            this.updateEntriesIncremental(newEntries);
            
            // Track performance
            const updateTime = performance.now() - startTime;
            this.trackIncrementalPerformance(updateTime);
            
            // Update last update time
            this.state.lastUpdate = Date.now();
            const updateInfo = this.containerEl.querySelector('.oom-update-info');
            if (updateInfo) {
                this.updateLastUpdateTime(updateInfo as HTMLElement);
            }
            
            this.plugin.logger?.info('Dashboard', 'Incremental update completed', {
                time: updateTime.toFixed(2) + 'ms',
                file: file?.path || deletedPath
            });
            
        } catch (error) {
            this.plugin.logger?.error('Dashboard', 'Failed to handle file change', error);
        }
    }
    
    // Helper method to load entries without showing loading UI
    private async loadDreamEntriesQuiet(): Promise<DreamMetricData[]> {
        try {
            // Re-use the same loading logic as loadDreamEntriesLegacy but without UI updates
            const { UniversalMetricsCalculator } = await import('../../workers/UniversalMetricsCalculator');
            const calculator = new UniversalMetricsCalculator(
                this.app,
                this.plugin,
                false, // Disable worker pool
                this.plugin.logger
            );
            
            const files = await this.getFilesToProcess();
            if (!files || files.length === 0) {
                return [];
            }
            
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
            
            return dreamEntries;
            
        } catch (error) {
            this.plugin.logger?.error('Dashboard', 'Failed to load dream entries quietly', error);
            return [];
        }
    }
    
    // Performance monitoring methods
    private trackFullRenderPerformance(renderTime: number) {
        this.performanceMetrics.lastFullRender = renderTime;
        this.performanceMetrics.fullRenderCount++;
        
        // Update average
        const totalTime = this.performanceMetrics.averageFullRenderTime * 
                         (this.performanceMetrics.fullRenderCount - 1) + renderTime;
        this.performanceMetrics.averageFullRenderTime = 
            totalTime / this.performanceMetrics.fullRenderCount;
        
        this.plugin.logger?.debug('Dashboard', 'Full render performance', {
            time: renderTime.toFixed(2) + 'ms',
            average: this.performanceMetrics.averageFullRenderTime.toFixed(2) + 'ms',
            count: this.performanceMetrics.fullRenderCount
        });
    }
    
    private trackIncrementalPerformance(updateTime: number) {
        this.performanceMetrics.lastIncrementalUpdate = updateTime;
        this.performanceMetrics.incrementalUpdateCount++;
        
        // Update average
        const totalTime = this.performanceMetrics.averageIncrementalTime * 
                         (this.performanceMetrics.incrementalUpdateCount - 1) + updateTime;
        this.performanceMetrics.averageIncrementalTime = 
            totalTime / this.performanceMetrics.incrementalUpdateCount;
        
        // Calculate time saved vs full render
        const estimatedFullRenderTime = this.performanceMetrics.averageFullRenderTime || 100;
        const timeSaved = Math.max(0, estimatedFullRenderTime - updateTime);
        this.performanceMetrics.timeSaved += timeSaved;
        
        this.plugin.logger?.debug('Dashboard', 'Incremental update performance', {
            time: updateTime.toFixed(2) + 'ms',
            average: this.performanceMetrics.averageIncrementalTime.toFixed(2) + 'ms',
            timeSaved: timeSaved.toFixed(2) + 'ms',
            totalTimeSaved: (this.performanceMetrics.timeSaved / 1000).toFixed(2) + 's',
            count: this.performanceMetrics.incrementalUpdateCount
        });
    }
    
    private logPerformanceMetrics() {
        if (this.performanceMetrics.fullRenderCount === 0 && 
            this.performanceMetrics.incrementalUpdateCount === 0) {
            return;
        }
        
        this.plugin.logger?.info('Dashboard', 'Performance metrics summary', {
            fullRenders: {
                count: this.performanceMetrics.fullRenderCount,
                averageTime: this.performanceMetrics.averageFullRenderTime.toFixed(2) + 'ms'
            },
            incrementalUpdates: {
                count: this.performanceMetrics.incrementalUpdateCount,
                averageTime: this.performanceMetrics.averageIncrementalTime.toFixed(2) + 'ms'
            },
            totalTimeSaved: (this.performanceMetrics.timeSaved / 1000).toFixed(2) + ' seconds',
            efficiency: this.performanceMetrics.averageFullRenderTime > 0 ?
                ((1 - this.performanceMetrics.averageIncrementalTime / 
                  this.performanceMetrics.averageFullRenderTime) * 100).toFixed(1) + '%' : 'N/A'
        });
        
        // Show a notice with performance summary if significant time was saved
        if (this.performanceMetrics.timeSaved > 5000) { // More than 5 seconds saved
            new Notice(
                `OneiroMetrics Dashboard saved ${(this.performanceMetrics.timeSaved / 1000).toFixed(1)}s ` +
                `with incremental updates (${this.performanceMetrics.incrementalUpdateCount} updates)`
            );
        }
    }
    
    // Helper methods
    private arraysEqual(a: string[], b: string[]): boolean {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    
    private updateDebounceTimer: NodeJS.Timeout | null = null;
    private lastEnabledMetrics: string[] | null = null;
}
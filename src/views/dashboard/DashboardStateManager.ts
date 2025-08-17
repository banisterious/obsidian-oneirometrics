/**
 * Dashboard State Manager
 * 
 * Manages the state of the OneiroMetrics Dashboard including:
 * - State persistence across sessions
 * - State updates and notifications
 * - Integration with existing filter systems
 */

import { App } from 'obsidian';
import type OneiroMetricsPlugin from '../../../main';
import type { DreamMetricData } from '../../../types';

// Date filter types
type DateFilter = 'all' | 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'last30' | 'last90' | 'thisYear' | 'custom';

export interface DashboardState {
    entries: DreamMetricData[];
    filteredEntries: DreamMetricData[];
    currentFilter: DateFilter;
    sortColumn: string;
    sortDirection: 'asc' | 'desc';
    searchQuery: string;
    expandedRows: Set<string>;
    isLoading: boolean;
    lastUpdate: number;
    viewPreferences: ViewPreferences;
}

export interface ViewPreferences {
    showMetrics: boolean;
    compactMode: boolean;
    rowHeight: number;
    visibleRows: number;
    legacyMode: boolean;
}

export class DashboardStateManager {
    private state: DashboardState;
    private plugin: OneiroMetricsPlugin;
    private app: App;
    private stateChangeCallbacks: Array<(state: DashboardState) => void> = [];
    
    constructor(app: App, plugin: OneiroMetricsPlugin) {
        this.app = app;
        this.plugin = plugin;
        
        // Initialize state from saved data or defaults
        this.state = this.loadState();
    }
    
    /**
     * Load state from plugin data or return defaults
     */
    private loadState(): DashboardState {
        // TODO: Add dashboardState to DreamMetricsSettings type
        const savedState = (this.plugin.settings as any)?.dashboardState;
        
        return {
            entries: [],
            filteredEntries: [],
            currentFilter: savedState?.currentFilter || this.plugin.settings?.lastAppliedFilter || 'all',
            sortColumn: savedState?.sortColumn || 'date',
            sortDirection: savedState?.sortDirection || 'asc',
            searchQuery: savedState?.searchQuery || '',
            expandedRows: new Set(savedState?.expandedRows || []),
            isLoading: false,
            lastUpdate: savedState?.lastUpdate || Date.now(),
            viewPreferences: {
                showMetrics: savedState?.viewPreferences?.showMetrics ?? true,
                compactMode: savedState?.viewPreferences?.compactMode ?? false,
                rowHeight: savedState?.viewPreferences?.rowHeight || 50,
                visibleRows: savedState?.viewPreferences?.visibleRows || 20,
                legacyMode: savedState?.viewPreferences?.legacyMode ?? true
            }
        };
    }
    
    /**
     * Save current state to plugin settings
     */
    async saveState(): Promise<void> {
        if (!this.plugin.settings) return;
        
        // Convert Set to Array for serialization
        const expandedRowsArray = Array.from(this.state.expandedRows);
        
        // Save to settings
        // TODO: Add dashboardState to DreamMetricsSettings type
        (this.plugin.settings as any).dashboardState = {
            currentFilter: this.state.currentFilter,
            sortColumn: this.state.sortColumn,
            sortDirection: this.state.sortDirection,
            searchQuery: this.state.searchQuery,
            expandedRows: expandedRowsArray,
            lastUpdate: this.state.lastUpdate,
            viewPreferences: this.state.viewPreferences
        };
        
        // Also update the lastAppliedFilter for compatibility
        this.plugin.settings.lastAppliedFilter = this.state.currentFilter;
        
        await this.plugin.saveSettings();
    }
    
    /**
     * Get current state
     */
    getState(): DashboardState {
        return this.state;
    }
    
    /**
     * Update state and notify listeners
     */
    async updateState(updates: Partial<DashboardState>): Promise<void> {
        // Merge updates into current state
        this.state = {
            ...this.state,
            ...updates
        };
        
        // Save state
        await this.saveState();
        
        // Notify all listeners
        this.notifyStateChange();
    }
    
    /**
     * Update entries
     */
    setEntries(entries: DreamMetricData[]): void {
        this.state.entries = entries;
        this.state.filteredEntries = [...entries];
        this.notifyStateChange();
    }
    
    /**
     * Update filtered entries
     */
    setFilteredEntries(entries: DreamMetricData[]): void {
        this.state.filteredEntries = entries;
        this.notifyStateChange();
    }
    
    /**
     * Update filter
     */
    async setFilter(filter: DateFilter): Promise<void> {
        this.state.currentFilter = filter;
        await this.saveState();
        this.notifyStateChange();
    }
    
    /**
     * Update search query
     */
    setSearchQuery(query: string): void {
        this.state.searchQuery = query;
        this.notifyStateChange();
    }
    
    /**
     * Toggle row expansion
     */
    toggleRowExpansion(id: string): void {
        if (this.state.expandedRows.has(id)) {
            this.state.expandedRows.delete(id);
        } else {
            this.state.expandedRows.add(id);
        }
        this.notifyStateChange();
    }
    
    /**
     * Update sort settings
     */
    setSort(column: string, direction: 'asc' | 'desc'): void {
        this.state.sortColumn = column;
        this.state.sortDirection = direction;
        this.notifyStateChange();
    }
    
    /**
     * Update loading state
     */
    setLoading(loading: boolean): void {
        this.state.isLoading = loading;
        this.notifyStateChange();
    }
    
    /**
     * Update view preferences
     */
    async updateViewPreferences(prefs: Partial<ViewPreferences>): Promise<void> {
        this.state.viewPreferences = {
            ...this.state.viewPreferences,
            ...prefs
        };
        await this.saveState();
        this.notifyStateChange();
    }
    
    /**
     * Register a callback for state changes
     */
    onStateChange(callback: (state: DashboardState) => void): void {
        this.stateChangeCallbacks.push(callback);
    }
    
    /**
     * Remove a state change callback
     */
    offStateChange(callback: (state: DashboardState) => void): void {
        const index = this.stateChangeCallbacks.indexOf(callback);
        if (index > -1) {
            this.stateChangeCallbacks.splice(index, 1);
        }
    }
    
    /**
     * Notify all listeners of state change
     */
    private notifyStateChange(): void {
        for (const callback of this.stateChangeCallbacks) {
            try {
                callback(this.state);
            } catch (error) {
                this.plugin.logger?.error('DashboardStateManager', 'Error in state change callback', error);
            }
        }
    }
    
    /**
     * Reset state to defaults
     */
    async resetState(): Promise<void> {
        this.state = {
            entries: [],
            filteredEntries: [],
            currentFilter: 'all',
            sortColumn: 'date',
            sortDirection: 'asc',
            searchQuery: '',
            expandedRows: new Set(),
            isLoading: false,
            lastUpdate: Date.now(),
            viewPreferences: {
                showMetrics: true,
                compactMode: false,
                rowHeight: 50,
                visibleRows: 20,
                legacyMode: true
            }
        };
        
        await this.saveState();
        this.notifyStateChange();
    }
}
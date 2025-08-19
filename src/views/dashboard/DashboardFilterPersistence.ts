import { DreamMetricsSettings } from '../../types/core';

/**
 * Simple filter persistence manager for the dashboard
 * Handles saving and loading filter state from settings and localStorage
 */
export class FilterPersistenceManager {
    constructor(
        private settings: DreamMetricsSettings,
        private saveSettings: () => Promise<void>,
        private logger?: any
    ) {}

    /**
     * Save filter state to settings and localStorage
     */
    public saveFilter(filter: string, customDateRange?: { start: string; end: string }) {
        try {
            // Save to settings
            this.settings.lastAppliedFilter = filter;
            if (filter === 'custom' && customDateRange) {
                this.settings.customDateRange = customDateRange;
            } else if (filter !== 'custom') {
                this.settings.customDateRange = undefined;
            }
            
            // Save to settings file
            this.saveSettings().catch(err => {
                this.logger?.error('FilterPersistence', 'Failed to save filter to settings', err);
            });
            
            // Also save to localStorage as backup
            localStorage.setItem('oom-dashboard-filter', filter);
            if (filter === 'custom' && customDateRange) {
                localStorage.setItem('oom-dashboard-custom-range', JSON.stringify(customDateRange));
            } else {
                localStorage.removeItem('oom-dashboard-custom-range');
            }
            
            this.logger?.debug('FilterPersistence', 'Filter saved', { filter, customDateRange });
        } catch (error) {
            this.logger?.error('FilterPersistence', 'Error saving filter', error);
        }
    }

    /**
     * Load filter state from settings or localStorage
     */
    public loadFilter(): { filter: string; customDateRange?: { start: string; end: string } } {
        try {
            // First try settings
            let filter = this.settings.lastAppliedFilter || 'all';
            let customDateRange = this.settings.customDateRange;
            
            // Fallback to localStorage if settings don't have it
            if (filter === 'all') {
                const savedFilter = localStorage.getItem('oom-dashboard-filter');
                if (savedFilter) {
                    filter = savedFilter;
                    this.logger?.debug('FilterPersistence', 'Loaded filter from localStorage', { filter });
                }
            }
            
            // Load custom date range if needed
            if (filter === 'custom' && !customDateRange) {
                const savedRange = localStorage.getItem('oom-dashboard-custom-range');
                if (savedRange) {
                    try {
                        customDateRange = JSON.parse(savedRange);
                        this.logger?.debug('FilterPersistence', 'Loaded custom range from localStorage', { customDateRange });
                    } catch (e) {
                        this.logger?.error('FilterPersistence', 'Failed to parse custom range from localStorage', e);
                    }
                }
            }
            
            this.logger?.debug('FilterPersistence', 'Filter loaded', { filter, customDateRange });
            return { filter, customDateRange };
        } catch (error) {
            this.logger?.error('FilterPersistence', 'Error loading filter', error);
            return { filter: 'all' };
        }
    }

    /**
     * Clear all saved filters
     */
    public clearFilters() {
        try {
            this.settings.lastAppliedFilter = 'all';
            this.settings.customDateRange = undefined;
            
            this.saveSettings().catch(err => {
                this.logger?.error('FilterPersistence', 'Failed to clear filters from settings', err);
            });
            
            localStorage.removeItem('oom-dashboard-filter');
            localStorage.removeItem('oom-dashboard-custom-range');
            
            this.logger?.debug('FilterPersistence', 'Filters cleared');
        } catch (error) {
            this.logger?.error('FilterPersistence', 'Error clearing filters', error);
        }
    }
}
import { App, MarkdownView } from 'obsidian';
import { DreamMetricsSettings } from '../../types/core';
import { TableManager } from '../tables/TableManager';
import { ILogger } from '../../logging/LoggerTypes';
import { getProjectNotePath } from '../../utils/settings-helpers';

declare const globalLogger: ILogger | undefined;
declare let customDateRange: any;

/**
 * Manages filter persistence and restoration across plugin sessions
 * Handles localStorage backup/recovery, DOM waiting logic, and filter state consistency
 */
export class FilterPersistenceManager {
    constructor(
        private app: App,
        private settings: DreamMetricsSettings,
        private saveSettings: () => Promise<void>,
        private tableManager: TableManager,
        private applyFilterToDropdown: (filterDropdown: HTMLSelectElement, previewEl: HTMLElement) => boolean,
        private logger?: ILogger
    ) {}

    /**
     * Apply initial filters to restore saved filter state
     * Handles filter persistence, recovery from localStorage, and DOM waiting with retries
     */
    public applyInitialFilters(): void {
        try {
            globalLogger?.info('Filter', 'FilterPersistenceManager.applyInitialFilters() called');
            
            if (globalLogger) {
                globalLogger.info('Filter', 'Running applyInitialFilters - attempt to restore saved filters');
            }
            
            // Ensure settings are initialized
            if (!this.settings) {
                const errorMsg = 'Settings not initialized in applyInitialFilters';
                this.logger?.warn('Filter', errorMsg);
                globalLogger?.warn('Filter', errorMsg);
                return;
            }
            
            // HIGHEST PRIORITY FIX: More robust filter persistence
            // Print all relevant info at INFO level for troubleshooting
            if (globalLogger) {
                globalLogger.info('Filter', 'Filter persistence status check', { 
                    applied: (window as any).oomFiltersApplied || false,
                    pending: (window as any).oomFiltersPending || false,
                    savedFilter: this.settings.lastAppliedFilter || 'none',
                    hasCustomRange: this.settings && this.settings.customDateRange ? true : false,
                    currentGlobalCustomRange: customDateRange ? JSON.stringify(customDateRange) : 'none'
                });
            }
            
            // Check if we already successfully applied filters
            if ((window as any).oomFiltersApplied) {
                if (globalLogger) {
                    globalLogger.debug('Filter', 'Filters already applied successfully, skipping');
                }
                return;
            }
            
            globalLogger?.info('Filter', 'Proceeding with filter initialization checks');
            
        } catch (e) {
            const errorMsg = 'Error in applyInitialFilters initialization';
            const error = e instanceof Error ? e : new Error(String(e));
            this.logger?.error('Filter', errorMsg, error);
            globalLogger?.error('Filter', errorMsg, error);
            return;
        }
        
        try {
            // CRITICAL FIX: Double check that filter settings are consistent and load from backups if needed
            if (this.settings && !this.settings.lastAppliedFilter) {
                globalLogger?.info('Filter', 'No lastAppliedFilter found, attempting recovery');
                this.recoverFilterFromLocalStorage();
            }
            
            // Ensure customDateRange is set from settings - with proper null checks
            if (this.settings && this.settings.lastAppliedFilter === 'custom') {
                globalLogger?.info('Filter', 'Custom filter detected, restoring custom date range');
                this.restoreCustomDateRange();
            }
            
            // Find and apply filters to any open metrics notes
            globalLogger?.info('Filter', 'Finding and processing metrics notes');
            this.findAndProcessMetricsNotes();
            
            globalLogger?.info('Filter', 'FilterPersistenceManager.applyInitialFilters() completed successfully');
            
        } catch (e) {
            const errorMsg = 'Error in applyInitialFilters processing';
            const error = e instanceof Error ? e : new Error(String(e));
            this.logger?.error('Filter', errorMsg, error);
            globalLogger?.error('Filter', errorMsg, error);
        }
    }

    /**
     * Attempt to recover filter settings from localStorage backup
     */
    private recoverFilterFromLocalStorage(): void {
        try {
            const savedFilter = localStorage.getItem('oom-last-applied-filter');
            if (savedFilter) {
                this.settings.lastAppliedFilter = savedFilter;
                if (globalLogger) {
                    globalLogger.info('Filter', `Last-minute recovery of filter from localStorage: ${savedFilter}`);
                }
                
                // Save this recovery to plugin settings
                this.saveSettings().catch(err => {
                    if (globalLogger) {
                        globalLogger.error('Filter', 'Failed to save recovered filter', err);
                    } else {
                        this.logger?.error('Filter', 'Failed to save recovered filter', err instanceof Error ? err : new Error(String(err)));
                    }
                });
            }
        } catch (e) {
            this.logger?.error('Filter', 'Error recovering filter from localStorage', e instanceof Error ? e : new Error(String(e)));
        }
    }

    /**
     * Restore custom date range from settings or localStorage backup
     */
    private restoreCustomDateRange(): void {
        if (this.settings.customDateRange && !customDateRange) {
            try {
                customDateRange = { ...this.settings.customDateRange };
                if (globalLogger) {
                    globalLogger.info('Filter', 'Restored custom date range from settings', { range: customDateRange });
                }
            } catch (e) {
                this.logger?.error('Filter', 'Error copying customDateRange from settings', e instanceof Error ? e : new Error(String(e)));
            }
        } else if (!this.settings.customDateRange) {
            this.recoverCustomDateRangeFromLocalStorage();
        }
    }

    /**
     * Recover custom date range from localStorage if not available in settings
     */
    private recoverCustomDateRangeFromLocalStorage(): void {
        try {
            const savedRangeStr = localStorage.getItem('oom-custom-date-range');
            if (savedRangeStr) {
                const savedRange = JSON.parse(savedRangeStr);
                if (savedRange && savedRange.start && savedRange.end) {
                    this.settings.customDateRange = savedRange;
                    customDateRange = { ...savedRange };
                    if (globalLogger) {
                        globalLogger.info('Filter', 'Last-minute recovery of custom range from localStorage', { 
                            range: savedRange 
                        });
                    }
                    
                    // Save this recovery
                    this.saveSettings().catch(err => {
                        if (globalLogger) {
                            globalLogger.error('Filter', 'Failed to save recovered custom range', err);
                        } else {
                            this.logger?.error('Filter', 'Failed to save recovered custom range', err instanceof Error ? err : new Error(String(err)));
                        }
                    });
                }
            }
        } catch (e) {
            if (globalLogger) {
                globalLogger.error('Filter', 'Error recovering custom date range in applyInitialFilters', e);
            } else {
                this.logger?.error('Filter', 'Error recovering custom date range', e instanceof Error ? e : new Error(String(e)));
            }
        }
    }

    /**
     * Find open metrics notes and apply saved filters with retry logic
     */
    private findAndProcessMetricsNotes(): void {
        // Find any open metrics notes
        const projectNotePath = getProjectNotePath(this.settings);
        let metricsNoteFound = false;
        
        try {
            // Log saved filter info at INFO level to ensure visibility
            if (this.settings && this.settings.lastAppliedFilter) {
                globalLogger?.debug('Filter', 'Saved filter found', { filter: this.settings.lastAppliedFilter });
                if (globalLogger) {
                    globalLogger.info('Filter', `Found saved filter settings to restore`, {
                        filter: this.settings.lastAppliedFilter,
                        customRange: this.settings && this.settings.customDateRange ? 
                            JSON.stringify(this.settings.customDateRange) : 'none'
                    });
                }
            } else {
                globalLogger?.debug('Filter', 'No saved filter found in settings');
            }
        } catch (e) {
            this.logger?.error('Filter', 'Error checking project note', e instanceof Error ? e : new Error(String(e)));
        }
        
        this.app.workspace.iterateAllLeaves(leaf => {
            if (leaf.view instanceof MarkdownView && leaf.view.file?.path === projectNotePath) {
                metricsNoteFound = true;
                globalLogger?.debug('Filter', 'Metrics note found in workspace');
                globalLogger?.info('Filter', 'Metrics note found in workspace, attempting filter restoration');
                
                // Get the view's preview element
                const previewEl = leaf.view.previewMode?.containerEl;
                if (!previewEl) {
                    globalLogger?.warn('Filter', 'Preview element not available for filter application');
                    return;
                }
                
                this.applyFiltersToNote(previewEl);
                
                // We only need to process one metrics note
                return;
            }
        });
        
        if (!metricsNoteFound) {
            globalLogger?.debug('Filter', 'No metrics note found in workspace');
            globalLogger?.info('Filter', 'No metrics note found in workspace, filter persistence waiting for note to be opened');
        }
    }

    /**
     * Apply filters to a specific metrics note with retry logic
     */
    private applyFiltersToNote(previewEl: HTMLElement): void {
        // Force initialization of table rows for robust filtering
        this.tableManager.initializeTableRowClasses();
        
        // Check if filter is available immediately
        const immediateDropdown = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
        if (immediateDropdown && this.settings.lastAppliedFilter) {
            globalLogger?.info('Filter', 'Filter dropdown found immediately, applying saved filter');
            this.applyFilterToDropdown(immediateDropdown, previewEl);
        }
        
        // More aggressive approach: wait for DOM with increasing retry attempts
        [250, 500, 1000, 2000, 4000].forEach(delay => {
            setTimeout(() => {
                // Only proceed if filters haven't been successfully applied yet
                if ((window as any).oomFiltersApplied) {
                    globalLogger?.debug('Filter', `Skipping retry at ${delay}ms, filters already applied`);
                    return;
                }
                
                // Get the filter element
                const filterDropdown = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
                if (!filterDropdown) {
                    globalLogger?.warn('Filter', `Filter dropdown not found at ${delay}ms delay`);
                    return;
                }
                
                // Ensure we have a saved filter to apply
                if (!this.settings.lastAppliedFilter) {
                    globalLogger?.debug('Filter', `No saved filter to apply at ${delay}ms`);
                    return;
                }
                
                // Attempt to apply filters
                globalLogger?.info('Filter', `Retry filter application at ${delay}ms`);
                
                // Force initialize tables before applying filters
                this.tableManager.initializeTableRowClasses();
                
                // Apply the filter with high priority
                this.applyFilterToDropdown(filterDropdown, previewEl);
            }, delay);
        });
    }
} 
import { App, MarkdownView } from 'obsidian';
import { DreamMetricsSettings } from '../../types/core';
import { TableManager } from '../tables/TableManager';
import { ILogger } from '../../logging/LoggerTypes';
import { getProjectNotePath } from '../../utils/settings-helpers';

declare const globalLogger: ILogger | undefined;

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
            // Use safe logger access
            const logger = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
            
            logger?.info('Filter', 'FilterPersistenceManager.applyInitialFilters() called');
            logger?.info('Filter', 'Running applyInitialFilters - attempt to restore saved filters');
            
            // Ensure settings are initialized
            if (!this.settings) {
                const errorMsg = 'Settings not initialized in applyInitialFilters';
                this.logger?.warn('Filter', errorMsg);
                logger?.warn('Filter', errorMsg);
                return;
            }
            
            // HIGHEST PRIORITY FIX: More robust filter persistence
            // Print all relevant info at INFO level for troubleshooting
            logger?.info('Filter', 'Filter persistence status check', { 
                applied: (window as any).oomFiltersApplied || false,
                pending: (window as any).oomFiltersPending || false,
                savedFilter: this.settings.lastAppliedFilter || 'none',
                hasCustomRange: this.settings && this.settings.customDateRange ? true : false
            });
            
            // Check if we already successfully applied filters
            if ((window as any).oomFiltersApplied) {
                logger?.debug('Filter', 'Filters already applied successfully, skipping');
                return;
            }
            
            logger?.info('Filter', 'Proceeding with filter initialization checks');
            
        } catch (e) {
            const errorMsg = 'Error in applyInitialFilters initialization';
            const errorDetails = {
                message: e instanceof Error ? e.message : String(e),
                stack: e instanceof Error ? e.stack : undefined,
                name: e instanceof Error ? e.name : 'Unknown',
                toString: String(e)
            };
            this.logger?.error('Filter', errorMsg, errorDetails);
            
            // Try to log with globalLogger too, but safely
            try {
                if (typeof globalLogger !== 'undefined' && globalLogger) {
                    globalLogger.error('Filter', errorMsg, errorDetails);
                }
            } catch (logErr) {
                // Silent fail on logging error
            }
            return;
        }
        
        try {
            // Use the same safe logger
            const logger = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
            
            // CRITICAL FIX: Double check that filter settings are consistent and load from backups if needed
            if (this.settings && !this.settings.lastAppliedFilter) {
                logger?.info('Filter', 'No lastAppliedFilter found, attempting recovery');
                this.recoverFilterFromLocalStorage();
            }
            
            // Custom date range handling is now managed by Date Navigator
            if (this.settings && this.settings.lastAppliedFilter === 'custom') {
                logger?.info('Filter', 'Custom filter detected - Date Navigator will handle custom range');
                // Date Navigator now manages custom date ranges, no legacy restore needed
            }
            
            // Find and apply filters to any open metrics notes
            logger?.info('Filter', 'Finding and processing metrics notes');
            this.findAndProcessMetricsNotes();
            
            logger?.info('Filter', 'FilterPersistenceManager.applyInitialFilters() completed successfully');
            
        } catch (e) {
            const errorMsg = 'Error in applyInitialFilters processing';
            const errorDetails = {
                message: e instanceof Error ? e.message : String(e),
                stack: e instanceof Error ? e.stack : undefined,
                name: e instanceof Error ? e.name : 'Unknown',
                toString: String(e)
            };
            this.logger?.error('Filter', errorMsg, errorDetails);
            
            // Try to log with globalLogger too, but safely
            try {
                if (typeof globalLogger !== 'undefined' && globalLogger) {
                    globalLogger.error('Filter', errorMsg, errorDetails);
                }
            } catch (logErr) {
                // Silent fail on logging error
            }
        }
    }

    /**
     * Attempt to recover filter settings from localStorage backup
     */
    private recoverFilterFromLocalStorage(): void {
        try {
            // Use safe logger access
            const logger = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
            
            const savedFilter = localStorage.getItem('oom-last-applied-filter');
            if (savedFilter) {
                this.settings.lastAppliedFilter = savedFilter;
                logger?.info('Filter', `Last-minute recovery of filter from localStorage: ${savedFilter}`);
                
                // Save this recovery to plugin settings
                this.saveSettings().catch(err => {
                    logger?.error('Filter', 'Failed to save recovered filter', err instanceof Error ? err : new Error(String(err)));
                });
            }
        } catch (e) {
            this.logger?.error('Filter', 'Error recovering filter from localStorage', e instanceof Error ? e : new Error(String(e)));
        }
    }

    // Legacy custom date range methods removed - Date Navigator now handles this functionality

    /**
     * Find open metrics notes and apply saved filters with retry logic
     */
    private findAndProcessMetricsNotes(): void {
        // Find any open metrics notes
        const projectNotePath = getProjectNotePath(this.settings);
        let metricsNoteFound = false;
        
        try {
            // Use safe logger access
            const logger = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
            
            // Log saved filter info at INFO level to ensure visibility
            if (this.settings && this.settings.lastAppliedFilter) {
                logger?.debug('Filter', 'Saved filter found', { filter: this.settings.lastAppliedFilter });
                logger?.info('Filter', `Found saved filter settings to restore`, {
                    filter: this.settings.lastAppliedFilter,
                    customRange: this.settings && this.settings.customDateRange ? 
                        JSON.stringify(this.settings.customDateRange) : 'none'
                });
            } else {
                logger?.debug('Filter', 'No saved filter found in settings');
            }
        } catch (e) {
            this.logger?.error('Filter', 'Error checking project note', e instanceof Error ? e : new Error(String(e)));
        }
        
        // Use safe logger access for the workspace iteration
        const logger = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        this.app.workspace.iterateAllLeaves(leaf => {
            if (leaf.view instanceof MarkdownView && leaf.view.file?.path === projectNotePath) {
                metricsNoteFound = true;
                logger?.debug('Filter', 'Metrics note found in workspace');
                logger?.info('Filter', 'Metrics note found in workspace, attempting filter restoration');
                
                // Get the view's preview element
                const previewEl = leaf.view.previewMode?.containerEl;
                if (!previewEl) {
                    logger?.warn('Filter', 'Preview element not available for filter application');
                    return;
                }
                
                this.applyFiltersToNote(previewEl);
                
                // We only need to process one metrics note
                return;
            }
        });
        
        if (!metricsNoteFound) {
            logger?.debug('Filter', 'No metrics note found in workspace');
            logger?.info('Filter', 'No metrics note found in workspace, filter persistence waiting for note to be opened');
        }
    }

    /**
     * Apply filters to a specific metrics note with retry logic
     */
    private applyFiltersToNote(previewEl: HTMLElement): void {
        // Use safe logger access
        const logger = typeof globalLogger !== 'undefined' ? globalLogger : this.logger;
        
        // Force initialization of table rows for robust filtering
        this.tableManager.initializeTableRowClasses();
        
        // Check if filter is available immediately
        const immediateDropdown = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
        if (immediateDropdown && this.settings.lastAppliedFilter) {
            logger?.info('Filter', 'Filter dropdown found immediately, applying saved filter');
            this.applyFilterToDropdown(immediateDropdown, previewEl);
        }
        
        // More aggressive approach: wait for DOM with increasing retry attempts
        [250, 500, 1000, 2000, 4000].forEach(delay => {
            setTimeout(() => {
                // Only proceed if filters haven't been successfully applied yet
                if ((window as any).oomFiltersApplied) {
                    logger?.debug('Filter', `Skipping retry at ${delay}ms, filters already applied`);
                    return;
                }
                
                // Get the filter element
                const filterDropdown = previewEl.querySelector('#oom-date-range-filter') as HTMLSelectElement;
                if (!filterDropdown) {
                    logger?.warn('Filter', `Filter dropdown not found at ${delay}ms delay`);
                    return;
                }
                
                // Ensure we have a saved filter to apply
                if (!this.settings.lastAppliedFilter) {
                    logger?.debug('Filter', `No saved filter to apply at ${delay}ms`);
                    return;
                }
                
                // Attempt to apply filters
                logger?.info('Filter', `Retry filter application at ${delay}ms`);
                
                // Force initialize tables before applying filters
                this.tableManager.initializeTableRowClasses();
                
                // Apply the filter with high priority
                this.applyFilterToDropdown(filterDropdown, previewEl);
            }, delay);
        });
    }
} 
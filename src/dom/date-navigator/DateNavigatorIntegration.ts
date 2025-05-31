import { App, Notice } from 'obsidian';
import { DateNavigator } from './DateNavigator';
import { TimeFilterManager, DateRange } from '../../timeFilters';
import { DreamMetricsState } from '../../state/DreamMetricsState';
import { format } from 'date-fns';
import { getService, registerService, SERVICE_NAMES } from '../../state/ServiceRegistry';
import { error, info, debug, warn } from '../../logging';

// Import web worker manager for Phase 2 integration
import { DateNavigatorWorkerManager } from '../../workers/DateNavigatorWorkerManager';
import safeLogger from '../../logging/safe-logger';

// Safely reference global logger without causing errors if it's not defined
declare global {
    interface Window {
        globalLogger?: any;
    }
}

export class DateNavigatorIntegration {
    private app: App;
    private state: DreamMetricsState;
    private timeFilterManager: TimeFilterManager;
    public dateNavigator: DateNavigator | null = null;
    private container: HTMLElement | null = null;
    private isUpdatingSelection: boolean = false; // Add a flag to prevent recursive updates
    private rangeSelectionMode: boolean = false;
    private rangeStartDate: Date | null = null;
    private rangeEndDate: Date | null = null;
    
    // Phase 2: Web Worker Integration
    private workerManager: DateNavigatorWorkerManager;
    private progressIndicator: HTMLElement | null = null;
    private isProcessing: boolean = false;
    
    constructor(app: App, state: DreamMetricsState | any, filterManager?: TimeFilterManager) {
        this.app = app;
        
        // Handle the case where the second parameter is actually the plugin
        if (state && !(state instanceof DreamMetricsState) && typeof state === 'object') {
            // Extract state and filter manager from plugin
            this.state = state.state || new DreamMetricsState();
            // Use the provided filter manager, or try to get from plugin, or from service registry
            this.timeFilterManager = filterManager || state.timeFilterManager || getService<TimeFilterManager>(SERVICE_NAMES.TIME_FILTER);
        } else {
            // Normal case - state is provided directly
            this.state = state;
            // Use the provided filter manager or try to get from service registry
            this.timeFilterManager = filterManager || getService<TimeFilterManager>(SERVICE_NAMES.TIME_FILTER);
        }
        
        // Phase 2: Initialize Web Worker Manager
        try {
            this.workerManager = new DateNavigatorWorkerManager(this.app);
            safeLogger.info('DateNavigatorIntegration', 'Web worker manager initialized successfully');
        } catch (error) {
            safeLogger.error('DateNavigatorIntegration', 'Failed to initialize web worker manager, will use fallback processing', 
                error instanceof Error ? error : new Error(String(error)));
            // Continue without worker - fallback will be used automatically
        }
        
        // If still no TimeFilterManager, create and register a new one
        if (!this.timeFilterManager) {
            try {
                if (window.globalLogger) {
                    window.globalLogger.info('DateNavigatorIntegration', 'Creating new TimeFilterManager');
                } else {
                    info('DateNavigatorIntegration', 'Creating new TimeFilterManager');
                }
                
                // Create a new TimeFilterManager
                this.timeFilterManager = new TimeFilterManager();
                
                // Register the new TimeFilterManager with the service registry
                try {
                    registerService(SERVICE_NAMES.TIME_FILTER, this.timeFilterManager);
                    info('DateNavigatorIntegration', 'Registered new TimeFilterManager with service registry');
                } catch (e) {
                    error('DateNavigatorIntegration', 'Error registering TimeFilterManager with service registry', e);
                }
            } catch (e) {
                error('DateNavigatorIntegration', 'Error creating TimeFilterManager', e);
            }
        }
        
        // Final check to ensure timeFilterManager is properly initialized
        if (!this.timeFilterManager) {
            error('DateNavigatorIntegration', 'Failed to initialize TimeFilterManager');
            // Create a minimal implementation to prevent errors
            this.timeFilterManager = {
                onFilterChange: () => {},
                getCurrentRange: () => null
            } as unknown as TimeFilterManager; // Use double assertion to bypass type checking
        }
        
        // Set up filter change handler if possible
        if (this.timeFilterManager && typeof this.timeFilterManager.onFilterChange !== 'undefined') {
            try {
                // Define the filter change handler function
                const filterChangeHandler = (filter: any) => {
                    if (filter && typeof filter.getDateRange === 'function') {
                        this.handleFilterChange(filter.getDateRange());
                    } else {
                        warn('DateNavigatorIntegration', 'Filter object is invalid or missing getDateRange method');
                    }
                };
                
                // Safely assign the handler
                this.timeFilterManager.onFilterChange = filterChangeHandler;
                info('DateNavigatorIntegration', 'Successfully set up filter change handler');
            } catch (e) {
                error('DateNavigatorIntegration', 'Error setting up filter change handler', e);
            }
        } else {
            warn('DateNavigatorIntegration', 'Unable to set up filter change handler - timeFilterManager.onFilterChange is not a function');
        }
    }
    
    /**
     * Initialize the Date Navigator in the specified container
     */
    public initialize(container: HTMLElement): DateNavigator {
        this.container = container;
        
        // Create the date navigator
        this.dateNavigator = new DateNavigator(container, this.state);
        
        // Apply any active filter
        try {
            if (this.timeFilterManager && typeof this.timeFilterManager.getCurrentRange === 'function') {
                const currentRange = this.timeFilterManager.getCurrentRange();
                if (currentRange) {
                    this.handleFilterChange(currentRange);
                }
            }
        } catch (e) {
            // Safely log the error
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('DateNavigatorIntegration: Error applying current filter range', e);
                }
            } catch (err) {
                // Silent failure
            }
        }
        
        // Set up selection handler
        this.setupSelectionHandler();

        // Add a range selection toggle button
        this.addRangeSelectionToggle();
        
        // Check if we need to populate entries from plugin
        this.checkAndPopulateEntries();
        
        // Make debug function globally accessible
        try {
            // Add a global function to trigger debug display
            window['debugDateNavigator'] = () => {
                if (this.dateNavigator && typeof this.dateNavigator.debugDisplay === 'function') {
                    this.dateNavigator.debugDisplay();
                } else {
                    error('DateNavigatorIntegration', 'DateNavigator debugDisplay function not available');
                }
            };
        } catch (e) {
            error('DateNavigatorIntegration', 'Error setting up global debug function', e);
        }
        
        return this.dateNavigator;
    }
    
    /**
     * Check if state has entries, and if not, try to get them from plugin
     */
    private checkAndPopulateEntries(): void {
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigatorIntegration', 'Starting entries check');
                window['globalLogger'].debug('DateNavigatorIntegration', 'Checking for entries in state');
            }
            
            // First check if state already has entries
            const stateEntries = this.state?.getDreamEntries?.() || [];
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigatorIntegration', `State has ${stateEntries.length} entries`);
            }
            
            if (stateEntries && stateEntries.length > 0) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigatorIntegration', `State already has ${stateEntries.length} entries`);
                }
                
                // Even if state has entries, let's also try to make sure the DateNavigator has them
                if (this.dateNavigator && stateEntries.length > 0) {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorIntegration', `Explicitly setting ${stateEntries.length} entries from state to DateNavigator`);
                    }
                    this.dateNavigator.setDreamEntries(stateEntries);
                }
                
                return; // State already has entries
            }
            
            // If we're here, we need to check for entries in other places
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigatorIntegration', 'No entries in state, checking for alternative sources');
                window['globalLogger'].debug('DateNavigatorIntegration', 'No entries in state, checking plugin');
            }
            
            // Try to get entries from window.oneiroMetricsPlugin
            if (window['oneiroMetricsPlugin']) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigatorIntegration', 'Found window.oneiroMetricsPlugin, checking for entries');
                }
                
                // Use 'any' type to bypass type checking for the global plugin
                const globalPlugin = window['oneiroMetricsPlugin'] as any;
                
                // Try to get entries from the global plugin instance
                let globalEntries = null;
                
                if (globalPlugin.state && typeof globalPlugin.state.getDreamEntries === 'function') {
                    globalEntries = globalPlugin.state.getDreamEntries();
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorIntegration', `Found ${globalEntries?.length || 0} entries from global plugin state`);
                    }
                } else if (globalPlugin.entries && Array.isArray(globalPlugin.entries)) {
                    // Using any type to bypass type checking
                    globalEntries = globalPlugin.entries;
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorIntegration', `Found ${globalEntries.length} entries from global plugin entries`);
                    }
                }
                
                if (globalEntries && globalEntries.length > 0) {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorIntegration', `Using ${globalEntries.length} entries from global plugin`);
                    }
                    
                    // Update DateNavigator with entries
                    if (this.dateNavigator) {
                        this.dateNavigator.setDreamEntries(globalEntries);
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigatorIntegration', 'Updated entries using global plugin entries');
                        }
                    }
                    
                    return; // Successfully used global plugin entries
                }
            }
            
            // If state was passed as part of plugin, try to get entries from plugin
            if (this.state && !(this.state instanceof DreamMetricsState) && typeof this.state === 'object') {
                // Cast to any to access potential plugin properties
                const plugin: any = this.state;
                
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigatorIntegration', 'State might be plugin, checking its properties');
                }
                
                // Try to get entries directly
                let entries = null;
                
                // Dump available properties for debugging
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigatorIntegration', 'Plugin properties:', Object.keys(plugin));
                    if (plugin.state) {
                        window['globalLogger'].debug('DateNavigatorIntegration', 'Plugin state properties:', Object.keys(plugin.state));
                    }
                }
                
                // Try different potential sources of entries
                if (plugin.entries && Array.isArray(plugin.entries) && plugin.entries.length > 0) {
                    entries = plugin.entries;
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorIntegration', `Found ${entries.length} entries in plugin.entries`);
                    }
                } else if (plugin.state && plugin.state.entries && Array.isArray(plugin.state.entries)) {
                    entries = plugin.state.entries;
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorIntegration', `Found ${entries.length} entries in plugin.state.entries`);
                    }
                } else if (plugin.state && typeof plugin.state.getDreamEntries === 'function') {
                    entries = plugin.state.getDreamEntries();
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorIntegration', `Found ${entries?.length || 0} entries from plugin.state.getDreamEntries()`);
                    }
                } else if (plugin.dreamEntries && Array.isArray(plugin.dreamEntries)) {
                    entries = plugin.dreamEntries;
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorIntegration', `Found ${entries.length} entries in plugin.dreamEntries`);
                    }
                }
                
                // FALLBACK: Try to extract entries from any tables in the UI
                if ((!entries || entries.length === 0) && typeof document !== 'undefined') {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorIntegration', 'No entries found through API, trying to extract from UI tables');
                    }
                    
                    try {
                        const dreamRows = document.querySelectorAll('.oom-dream-row');
                        if (dreamRows && dreamRows.length > 0) {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].debug('DateNavigatorIntegration', `Found ${dreamRows.length} dream rows in tables`);
                            }
                            
                            // Extract entries from rows
                            const tableEntries = [];
                            dreamRows.forEach((row, idx) => {
                                try {
                                    const dateCell = row.querySelector('td:first-child');
                                    const titleCell = row.querySelector('td:nth-child(2)');
                                    
                                    if (dateCell && titleCell) {
                                        const dateText = dateCell.textContent?.trim();
                                        const titleText = titleCell.textContent?.trim();
                                        
                                        if (dateText) {
                                            tableEntries.push({
                                                date: dateText,
                                                title: titleText || 'Unknown title',
                                                content: titleText || 'Unknown content',
                                                source: 'table-extraction',
                                                metrics: {}
                                            });
                                        }
                                    }
                                } catch (rowErr) {
                                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                        window['globalLogger'].error('DateNavigatorIntegration', `Error extracting entry from row ${idx}:`, rowErr);
                                    }
                                }
                            });
                            
                            if (tableEntries.length > 0) {
                                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                    window['globalLogger'].debug('DateNavigatorIntegration', `Extracted ${tableEntries.length} entries from UI tables`);
                                }
                                entries = tableEntries;
                            }
                        }
                    } catch (tableErr) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].error('DateNavigatorIntegration', 'Error extracting entries from tables:', tableErr);
                        }
                    }
                }
                
                // If we found entries, update the state
                if (entries && entries.length > 0) {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorIntegration', `Updating state with ${entries.length} entries`);
                        // Sample the first entry for debugging
                        window['globalLogger'].debug('DateNavigatorIntegration', 'First entry sample:', entries[0]);
                    }
                    
                    // Use the new setDreamEntries method if available
                    if (this.dateNavigator) {
                        this.dateNavigator.setDreamEntries(entries);
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigatorIntegration', 'Updated entries using dateNavigator.setDreamEntries()');
                        }
                    }
                    // If no DateNavigator but state has updateDreamEntries method, use it
                    else if (this.state && typeof (this.state as any).updateDreamEntries === 'function') {
                        (this.state as any).updateDreamEntries(entries);
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigatorIntegration', 'Updated entries using state.updateDreamEntries()');
                        }
                    }
                } else {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].warn('DateNavigatorIntegration', 'Could not find any entries in plugin object');
                    }
                }
            }
        } catch (e) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('DateNavigatorIntegration', 'Error checking for entries', e);
            }
        }
    }
    
    /**
     * Add a toggle button for range selection mode
     */
    private addRangeSelectionToggle(): void {
        if (!this.container) return;
        
        // Create button container
        const buttonContainer = this.container.createDiv('oom-date-navigator-controls');
        
        // Create range selection toggle button
        const rangeToggleBtn = buttonContainer.createEl('button', {
            cls: 'oom-range-selection-toggle',
            text: 'Range Selection: Off',
            attr: {
                'aria-pressed': 'false',
                'title': 'Toggle range selection mode'
            }
        });
        
        // Add click event listener
        rangeToggleBtn.addEventListener('click', () => {
            this.rangeSelectionMode = !this.rangeSelectionMode;
            
            // Update button text and aria state
            rangeToggleBtn.textContent = `Range Selection: ${this.rangeSelectionMode ? 'On' : 'Off'}`;
            rangeToggleBtn.setAttribute('aria-pressed', this.rangeSelectionMode ? 'true' : 'false');
            
            // Toggle active class for styling
            if (this.rangeSelectionMode) {
                rangeToggleBtn.classList.add('oom-range-active');
                
                // Show instruction message when enabling range mode
                new Notice('Select start date then end date to filter a range');
                
                // Reset any existing range selection
                this.rangeStartDate = null;
                this.rangeEndDate = null;
                
                // Safely log - range mode enabled
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', 'Range selection mode enabled');
                    }
                } catch (e) {
                    // Silent failure
                }
            } else {
                rangeToggleBtn.classList.remove('oom-range-active');
                
                // Clear any in-progress range selection
                if (this.rangeStartDate && !this.rangeEndDate) {
                    this.rangeStartDate = null;
                    
                    // Update UI to clear any selection markers
                    if (this.dateNavigator) {
                        this.dateNavigator.clearSelection();
                    }
                }
                
                // Safely log - range mode disabled
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', 'Range selection mode disabled');
                    }
                } catch (e) {
                    // Silent failure
                }
            }
        });
    }
    
    /**
     * Setup the selection handler to connect day selection with the filter system
     */
    private setupSelectionHandler(): void {
        if (!this.dateNavigator) return;
        
        // Override the applyFilter method of the DateNavigator
        const originalApplyFilter = this.dateNavigator.applyFilter;
        this.dateNavigator.applyFilter = async (startDate: Date | null, endDate: Date | null) => {
            // Handle range selection mode first
            if (this.rangeSelectionMode) {
                this.handleRangeSelection(startDate);
                return;
            }
            
            // For standard mode, call the original method first
            originalApplyFilter.call(this.dateNavigator, startDate, endDate);
            
            // Then handle the filter change with worker enhancement
            if (startDate && endDate) {
                await this.applyDateFilter(startDate, endDate);
            } else {
                await this.clearDateFilter();
            }
        };
    }
    
    /**
     * Phase 2: Worker-enhanced date filter application
     */
    private async applyDateFilter(startDate: Date, endDate: Date): Promise<void> {
        // Prevent recursive updates
        if (this.isUpdatingSelection || this.isProcessing) return;
        
        this.isUpdatingSelection = true;
        this.isProcessing = true;
        
        try {
            // Show progress indicator
            this.showProgressIndicator('Applying date filter...');
            
            // Get entries from state for processing
            const stateEntries = this.state?.getDreamEntries?.() || [];
            
            // Convert state entries to worker-compatible format 
            // Note: Using type assertion due to minor differences in type definitions
            // The worker handles these variations internally
            const entries = stateEntries as any[];
            
            safeLogger.debug('DateNavigatorIntegration', 'Starting worker-enhanced date filtering', {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                entriesCount: entries.length
            });
            
            // Process with worker (if available) or fallback to main thread
            if (this.workerManager && entries.length > 0) {
                const result = await this.workerManager.filterByDateRange(
                    entries,
                    startDate.toISOString().split('T')[0],
                    endDate.toISOString().split('T')[0],
                    {
                        includeStatistics: true,
                        onProgress: (progress) => this.updateProgress(progress)
                    }
                );
                
                // Apply visibility results to UI
                this.applyVisibilityResults(result.visibilityMap);
                
                safeLogger.info('DateNavigatorIntegration', 'Worker filtering completed successfully', {
                    visibleResults: result.visibilityMap ? result.visibilityMap.filter(r => r.visible).length : 0,
                    totalResults: result.visibilityMap ? result.visibilityMap.length : 0,
                    statistics: result.statistics
                });
            }
            
            // Update time filter manager with processed results
            if (this.timeFilterManager && typeof this.timeFilterManager.setCustomRange === 'function') {
                this.timeFilterManager.setCustomRange(startDate, endDate);
                
                // Show completion notice with performance info
                const formatDate = (date: Date) => format(date, 'MMM d, yyyy');
                const noticeMessage = this.isSameDay(startDate, endDate) 
                    ? `Filtered to ${formatDate(startDate)}`
                    : `Filtered from ${formatDate(startDate)} to ${formatDate(endDate)}`;
                
                new Notice(noticeMessage);
                
            } else {
                safeLogger.error('DateNavigatorIntegration', 'Cannot set custom range - timeFilterManager is invalid');
                new Notice('Filter could not be applied. Please try again.');
            }
            
        } catch (error) {
            this.handleFilterError(error);
        } finally {
            this.hideProgressIndicator();
            this.isUpdatingSelection = false;
            this.isProcessing = false;
        }
    }
    
    /**
     * Phase 2: Worker-enhanced filter clearing
     */
    private async clearDateFilter(): Promise<void> {
        // Prevent recursive updates
        if (this.isUpdatingSelection || this.isProcessing) return;
        
        this.isUpdatingSelection = true;
        this.isProcessing = true;
        
        try {
            // Clear filter in TimeFilterManager
            if (this.timeFilterManager && typeof this.timeFilterManager.clearCurrentFilter === 'function') {
                this.timeFilterManager.clearCurrentFilter();
                new Notice('Date filter cleared');
                
                safeLogger.debug('DateNavigatorIntegration', 'Date filter cleared successfully');
            } else {
                safeLogger.error('DateNavigatorIntegration', 'Cannot clear filter - timeFilterManager is invalid');
                new Notice('Filter could not be cleared. Please try again.');
            }
            
        } catch (error) {
            this.handleFilterError(error);
        } finally {
            this.isUpdatingSelection = false;
            this.isProcessing = false;
        }
    }
    
    /**
     * Handle date selection during range selection mode
     */
    private async handleRangeSelection(selectedDate: Date | null): Promise<void> {
        if (!selectedDate) return;
        
        // If no start date is selected yet, set it
        if (!this.rangeStartDate) {
            this.rangeStartDate = new Date(selectedDate);
            
            // Safely log - range start date selected
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', 'Range start date selected', { date: this.rangeStartDate });
                }
            } catch (e) {
                // Silent failure
            }
            
            // Show notice
            new Notice(`Range start: ${format(this.rangeStartDate, 'MMM d, yyyy')} - Now select end date`);
            
            // Highlight the selected day
            if (this.dateNavigator) {
                this.dateNavigator.selectDay(this.rangeStartDate);
            }
            
            return;
        }
        
        // If we already have a start date, use the selected date as the end date
        this.rangeEndDate = new Date(selectedDate);
        
        // Safely log - range end date selected
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'Range end date selected', { 
                    start: this.rangeStartDate, 
                    end: this.rangeEndDate 
                });
            }
        } catch (e) {
            // Silent failure
        }
        
        // Ensure start date is before end date
        let start = this.rangeStartDate;
        let end = this.rangeEndDate;
        
        if (start > end) {
            // Swap dates if needed
            [start, end] = [end, start];
        }
        
        // Apply the filter
        if (this.dateNavigator) {
            // Set visualization in the UI
            // In a real implementation, we would update the UI to highlight the range
            
            // Apply filter using worker-enhanced method
            await this.applyDateFilter(start, end);
            
            // Reset range selection
            this.rangeStartDate = null;
            this.rangeEndDate = null;
            
            // Turn off range selection mode
            this.rangeSelectionMode = false;
            
            // Update toggle button
            const rangeToggleBtn = this.container?.querySelector('.oom-range-selection-toggle');
            if (rangeToggleBtn) {
                rangeToggleBtn.textContent = 'Range Selection: Off';
                rangeToggleBtn.setAttribute('aria-pressed', 'false');
                (rangeToggleBtn as HTMLElement).classList.remove('oom-range-active');
            }
        }
    }
    
    /**
     * Handle changes to the filter system and update the DateNavigator
     */
    private handleFilterChange(range: DateRange | null): void {
        if (!this.dateNavigator) return;
        
        // Prevent recursive updates
        if (this.isUpdatingSelection) return;
        
        this.isUpdatingSelection = true;
        
        if (range) {
            // Navigate to the month containing the start date
            this.dateNavigator.navigateToMonth(range.start);
            
            // If it's a single-day filter, select that day
            if (this.isSameDay(range.start, range.end)) {
                // Directly set the selectedDay in the DateNavigator
                const dateNavigator = this.dateNavigator as any; // Type cast to access private field
                if (dateNavigator) {
                    dateNavigator.selectedDay = new Date(range.start); // Direct assignment
                    this.dateNavigator.selectDay(range.start); // Then call selectDay
                }
            } else {
                // For date ranges, ensure we're not in range selection mode
                this.rangeSelectionMode = false;
                
                // Update toggle button if exists
                const rangeToggleBtn = this.container?.querySelector('.oom-range-selection-toggle');
                if (rangeToggleBtn) {
                    rangeToggleBtn.textContent = 'Range Selection: Off';
                    rangeToggleBtn.setAttribute('aria-pressed', 'false');
                    (rangeToggleBtn as HTMLElement).classList.remove('oom-range-active');
                }
            }
        } else {
            // Clear selection in DateNavigator
            this.dateNavigator.clearSelection();
        }
        
        this.isUpdatingSelection = false;
    }
    
    /**
     * Check if two dates represent the same day
     */
    private isSameDay(date1: Date, date2: Date): boolean {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    }
    
    /**
     * Show the Date Navigator in UI
     */
    public show(): void {
        if (this.container) {
            this.container.style.display = 'flex';
        }
    }
    
    /**
     * Hide the Date Navigator from UI
     */
    public hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    
    /**
     * Toggle visibility of the Date Navigator
     */
    public toggle(): void {
        if (this.container) {
            if (this.container.style.display === 'none') {
                this.show();
            } else {
                this.hide();
            }
        }
    }
    
    /**
     * Clean up resources
     */
    public destroy(): void {
        // Phase 2: Dispose of worker manager
        if (this.workerManager) {
            try {
                this.workerManager.dispose();
                safeLogger.debug('DateNavigatorIntegration', 'Worker manager disposed successfully');
            } catch (error) {
                safeLogger.error('DateNavigatorIntegration', 'Error disposing worker manager', 
                    error instanceof Error ? error : new Error(String(error)));
            }
        }
        
        // Hide any active progress indicators
        this.hideProgressIndicator();
        
        // Clean up date navigator
        if (this.dateNavigator) {
            // Check if DateNavigator has a destroy method
            if (typeof (this.dateNavigator as any).destroy === 'function') {
                (this.dateNavigator as any).destroy();
            }
            this.dateNavigator = null;
        }
        
        // Clean up container reference
        this.container = null;
        
        // Clean up global debug function
        try {
            delete window['debugDateNavigator'];
        } catch (e) {
            // Silent failure
        }
        
        safeLogger.debug('DateNavigatorIntegration', 'DateNavigatorIntegration destroyed');
    }

    // Add debug method for direct access
    debug(): void {
        try {
            if (this.dateNavigator && typeof this.dateNavigator.debugDisplay === 'function') {
                this.dateNavigator.debugDisplay();
            } else {
                error('DateNavigatorIntegration', 'DateNavigator debugDisplay function not available');
            }
        } catch (e) {
            error('DateNavigatorIntegration', 'Error in debug function', e);
        }
    }

    // Phase 2: Progress Indicator Methods
    
    /**
     * Show progress indicator for filter processing
     */
    private showProgressIndicator(message: string = 'Processing filters...'): void {
        if (!this.container) return;
        
        this.hideProgressIndicator(); // Remove any existing indicator
        
        this.progressIndicator = document.createElement('div');
        this.progressIndicator.className = 'oom-progress-indicator';
        this.progressIndicator.innerHTML = `
            <div class="progress-content">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text">${message}</div>
                <div class="progress-details"></div>
            </div>
        `;
        
        // Add styles if not already added
        this.addProgressIndicatorStyles();
        
        // Insert at the top of the container
        this.container.insertBefore(this.progressIndicator, this.container.firstChild);
        
        safeLogger.debug('DateNavigatorIntegration', 'Progress indicator shown', { message });
    }
    
    /**
     * Update progress indicator with current progress
     */
    private updateProgress(progress: { progress: number; entriesProcessed: number; currentPhase?: string }): void {
        if (!this.progressIndicator) return;
        
        const progressFill = this.progressIndicator.querySelector('.progress-fill') as HTMLElement;
        const progressText = this.progressIndicator.querySelector('.progress-text') as HTMLElement;
        const progressDetails = this.progressIndicator.querySelector('.progress-details') as HTMLElement;
        
        if (progressFill) {
            progressFill.style.width = `${Math.min(progress.progress, 100)}%`;
        }
        
        if (progressText) {
            const phase = progress.currentPhase ? ` (${progress.currentPhase})` : '';
            progressText.textContent = `Processing filters... ${progress.progress}%${phase}`;
        }
        
        if (progressDetails && progress.entriesProcessed) {
            progressDetails.textContent = `Processed ${progress.entriesProcessed} entries`;
        }
        
        safeLogger.debug('DateNavigatorIntegration', 'Progress updated', progress);
    }
    
    /**
     * Hide progress indicator
     */
    private hideProgressIndicator(): void {
        if (this.progressIndicator && this.progressIndicator.parentNode) {
            this.progressIndicator.parentNode.removeChild(this.progressIndicator);
            this.progressIndicator = null;
            safeLogger.debug('DateNavigatorIntegration', 'Progress indicator hidden');
        }
        this.isProcessing = false;
    }
    
    /**
     * Apply visibility results from worker to the UI
     */
    private applyVisibilityResults(visibilityMap: any[]): void {
        // For DateNavigator, we'll apply filter highlighting/state
        // The actual DOM manipulation will be handled by the DateNavigator component
        if (!this.dateNavigator || !visibilityMap) return;
        
        try {
            // Apply visibility state to DateNavigator
            // This would be component-specific implementation
            safeLogger.debug('DateNavigatorIntegration', 'Applying visibility results', {
                resultsCount: visibilityMap.length,
                visibleCount: visibilityMap.filter(r => r.visible).length
            });
            
            // For now, we'll let the TimeFilterManager handle the actual DOM updates
            // The DateNavigator primarily provides the selection interface
            
        } catch (error) {
            safeLogger.error('DateNavigatorIntegration', 'Failed to apply visibility results', 
                error instanceof Error ? error : new Error(String(error)));
        }
    }
    
    /**
     * Handle filter processing errors
     */
    private handleFilterError(error: any): void {
        safeLogger.error('DateNavigatorIntegration', 'Filter processing failed', 
            error instanceof Error ? error : new Error(String(error)));
        
        this.hideProgressIndicator();
        
        new Notice('Filter processing encountered an issue. Please try again.', 6000);
    }
    
    /**
     * Add CSS styles for progress indicator
     */
    private addProgressIndicatorStyles(): void {
        if (document.querySelector('#oom-progress-styles')) return; // Already added
        
        const style = document.createElement('style');
        style.id = 'oom-progress-styles';
        style.textContent = `
            .oom-progress-indicator {
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 10px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .progress-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: var(--background-modifier-border);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: var(--interactive-accent);
                border-radius: 4px;
                transition: width 0.3s ease;
                width: 0%;
            }
            
            .progress-text {
                font-size: 14px;
                font-weight: 500;
                color: var(--text-normal);
            }
            
            .progress-details {
                font-size: 12px;
                color: var(--text-muted);
            }
        `;
        document.head.appendChild(style);
    }
}
import { App, Notice } from 'obsidian';
import { DateNavigator } from './date-navigator/DateNavigator';
import { TimeFilterManager, DateRange } from '../timeFilters';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricData } from '../types';
import { calculateWordCount } from '../utils/helpers';
import { format, isAfter, isBefore, isEqual, parseISO } from 'date-fns';
import { getService, registerService, SERVICE_NAMES } from '../state/ServiceRegistry';
import { error, info, debug, warn } from '../logging';
import { adaptDreamMetricDataArray } from '../utils/type-adapters';

// Import web worker infrastructure
import { DateNavigatorWorkerManager } from '../workers/DateNavigatorWorkerManager';
import { ProgressIndicator } from '../workers/ui/ProgressIndicator';
import { getLogger } from '../logging';

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
    
    // Web Worker Integration
    private workerManager: DateNavigatorWorkerManager;
    private progressIndicator: ProgressIndicator | null = null;
    private isProcessing = false;
    private logger = getLogger('DateNavigatorIntegration');
    private plugin: any = null; // Store reference to plugin for settings access

    constructor(app: App, state: DreamMetricsState | any, filterManager?: TimeFilterManager) {
        this.app = app;
        
        // Handle the case where the second parameter is actually the plugin
        if (state && !(state instanceof DreamMetricsState) && typeof state === 'object') {
            // Store plugin reference for settings access
            this.plugin = state;
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
        
        // Initialize web worker infrastructure
        this.workerManager = new DateNavigatorWorkerManager(app);
        
        this.logger.info('Initialization', 'DateNavigatorIntegration with web worker support initialized');
        
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
        
        // Create the date navigator with app and settings
        // If no plugin settings available, create a minimal settings object
        const settings = this.plugin?.settings || {
            // Minimal settings fallback for compatibility
            metrics: {},
            enabledMetrics: {},
            disabledMetrics: {},
            metricRanges: {},
            linting: { enabled: false, structures: [] },
            journalStructure: { enabled: false, structures: [] },
            templates: [],
            calloutName: 'dream-metrics',
            journalCalloutName: 'journal',
            dreamDiaryCalloutName: 'dream-diary',
            dateHandling: { 
                placement: 'field' as const,
                format: 'YYYY-MM-DD',
                includeInCallout: false
            },
            logging: { level: 'info' as const, maxLogSize: 1024000, maxBackups: 5 },
            scrapeOptions: {},
            selectedNotes: [],
            selectedFolder: '',
            selectionMode: 'notes' as const,
            unifiedMetrics: undefined // Will use legacy fallback if not configured
        };
        
        this.dateNavigator = new DateNavigator(container, this.state, this.app, settings);
        
        // Create progress indicator for the container
        this.progressIndicator = new ProgressIndicator(container);
        
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
                window['globalLogger'].debug('DateNavigatorIntegration', 'Checking for entries');
            }
            
            // Check if state already has entries through getDreamEntries method
            if (this.state && typeof this.state.getDreamEntries === 'function') {
                const stateEntries = this.state.getDreamEntries();
                if (stateEntries && Array.isArray(stateEntries) && stateEntries.length > 0) {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorIntegration', `Found ${stateEntries.length} entries in state`);
                    }
                    
                    // Even if state has entries, let's also try to make sure the DateNavigator has them
                    if (this.dateNavigator && stateEntries.length > 0) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigatorIntegration', `Explicitly setting ${stateEntries.length} entries from state to DateNavigator`);
                        }
                        // Use the adapter to ensure type compatibility
                        this.dateNavigator.setDreamEntries(adaptDreamMetricDataArray(stateEntries));
                    }
                    
                    return; // State already has entries
                }
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
     * Set up event handlers for date selection with enhanced worker processing
     */
    private setupSelectionHandler(): void {
        if (!this.dateNavigator) return;

        // Override the applyFilter method of the DateNavigator to use enhanced worker processing
        const originalApplyFilter = this.dateNavigator.applyFilter;
        this.dateNavigator.applyFilter = async (startDate: Date | null, endDate: Date | null) => {
            // Call original method first for any internal DateNavigator state updates
            originalApplyFilter.call(this.dateNavigator, startDate, endDate);
            
            if (startDate && endDate) {
                // Prevent recursive updates
                if (this.isUpdatingSelection || this.isProcessing) return;
                
                this.isUpdatingSelection = true;
                
                try {
                    // Use enhanced worker-based filtering
                    await this.applyDateFilter(startDate, endDate);
                    
                    this.logger.debug('Filter', 'Date filter applied successfully via DateNavigator', {
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0]
                    });
                    
                } catch (error) {
                    this.handleFilterError(error as Error);
                } finally {
                    this.isUpdatingSelection = false;
                }
            } else {
                // Clear filter for null dates with worker support
                await this.clearDateFilter();
            }
        };
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
                
                this.logger.debug('Filter', 'Date filter cleared successfully');
            } else {
                this.logger.error('Filter', 'Cannot clear filter - timeFilterManager is invalid');
                new Notice('Filter could not be cleared. Please try again.');
            }
            
        } catch (error) {
            this.handleFilterError(error as Error);
        } finally {
            this.isUpdatingSelection = false;
            this.isProcessing = false;
        }
    }
    
    /**
     * Handle date selection during range selection mode
     */
    private handleRangeSelection(selectedDate: Date | null): void {
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
            
            // Prevent recursive updates
            if (this.isUpdatingSelection) return;
            
            this.isUpdatingSelection = true;
            
            // Make sure timeFilterManager exists and has the required method
            if (this.timeFilterManager && typeof this.timeFilterManager.setCustomRange === 'function') {
                // Set custom filter in TimeFilterManager
                this.timeFilterManager.setCustomRange(start, end);
                
                // Show a notice
                new Notice(`Filtered from ${format(start, 'MMM d, yyyy')} to ${format(end, 'MMM d, yyyy')}`);
            } else {
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].error('DateNavigatorIntegration: Cannot set custom range - timeFilterManager is invalid');
                    }
                } catch (e) {
                    // Silent failure
                }
            }
            
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
            
            this.isUpdatingSelection = false;
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
                
                // For now, highlight the start date as a visual cue
                const dateNavigator = this.dateNavigator as any; // Type cast to access private field
                if (dateNavigator) {
                    dateNavigator.selectedDay = new Date(range.start); // Direct assignment
                    this.dateNavigator.selectDay(range.start); // Then call selectDay
                    
                    // Log the range for debugging - safely
                    try {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', 'Applied filter with range', {
                                start: format(range.start, 'yyyy-MM-dd'),
                                end: format(range.end, 'yyyy-MM-dd')
                            });
                        }
                    } catch (e) {
                        // Silent failure
                    }
                }
            }
        } else {
            // Clear selection
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
        // Remove any event listeners or references
        if (this.timeFilterManager) {
            this.timeFilterManager.onFilterChange = null;
        }
        this.dateNavigator = null;
        this.container = null;
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

    /**
     * Phase 2: Enhanced date filter application with web worker support
     * Replaces synchronous filtering with worker-enhanced processing
     */
    private async applyDateFilter(startDate: Date, endDate: Date): Promise<void> {
        // Prevent multiple operations
        if (this.isProcessing) {
            this.logger.warn('Filter', 'Filter operation already in progress');
            return;
        }
        
        this.isProcessing = true;
        const startTime = performance.now();
        
        try {
            // Show progress indicator
            this.showProgressIndicator('Preparing to filter entries...');
            
            // Get current entries from state
            const entries = this.getAllDreamEntries();
            
            this.logger.info('Filter', 'Starting date filter operation', {
                entriesCount: entries.length,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                useWorkers: true
            });
            
            // Process with worker (fallback to main thread if worker fails)
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
            
            // Update time filter manager with processed results
            if (this.timeFilterManager && typeof this.timeFilterManager.setCustomRange === 'function') {
                this.timeFilterManager.setCustomRange(startDate, endDate);
            }
            
            // Show completion notice with statistics
            this.showFilterResults(result.statistics, startDate, endDate);
            
            const processingTime = performance.now() - startTime;
            this.logger.info('Filter', 'Date filter operation completed successfully', {
                visibleResults: result.visibilityMap.filter(r => r.visible).length,
                totalResults: result.visibilityMap.length,
                processingTime: Math.round(processingTime)
            });
            
        } catch (error) {
            this.handleFilterError(error as Error);
        } finally {
            this.hideProgressIndicator();
            this.isProcessing = false;
        }
    }

    /**
     * Get all dream entries from state
     */
    private getAllDreamEntries(): any[] {
        try {
            if (this.state && typeof this.state.getDreamEntries === 'function') {
                return this.state.getDreamEntries();
            } else {
                this.logger.warn('Filter', 'State does not have expected dream entries methods');
                return [];
            }
        } catch (error) {
            this.logger.error('Filter', 'Error getting dream entries from state', 
                this.logger.enrichError(error as Error, {
                    component: 'DateNavigatorIntegration',
                    operation: 'getAllDreamEntries'
                })
            );
            return [];
        }
    }

    /**
     * Apply visibility results to the UI with optimized DOM manipulation
     */
    private applyVisibilityResults(visibilityMap: Array<{ id: string; visible: boolean }>): void {
        this.logger.debug('UI', 'Applying visibility results to DOM', {
            resultCount: visibilityMap.length
        });

        // Use DocumentFragment for efficient DOM updates
        const changes: Array<{ element: HTMLElement; visible: boolean }> = [];
        
        visibilityMap.forEach(result => {
            const element = document.querySelector(`[data-entry-id="${result.id}"]`) as HTMLElement;
            if (element) {
                changes.push({ element, visible: result.visible });
            }
        });

        // Apply all changes in a single requestAnimationFrame
        requestAnimationFrame(() => {
            changes.forEach(({ element, visible }) => {
                if (visible) {
                    element.classList.remove('oom-row--hidden');
                    element.classList.add('oom-row--visible');
                    element.style.display = 'block';
                } else {
                    element.classList.add('oom-row--hidden');
                    element.classList.remove('oom-row--visible');
                    element.style.display = 'none';
                }
            });
            
            // Update layout metrics after DOM changes
            this.updateLayoutMetrics();
        });
    }

    /**
     * Show progress indicator with message
     */
    private showProgressIndicator(message: string = 'Processing...'): void {
        if (this.progressIndicator) {
            this.progressIndicator.show(message);
        }
    }

    /**
     * Update progress indicator
     */
    private updateProgress(progress: any): void {
        if (this.progressIndicator) {
            this.progressIndicator.updateProgress(progress);
        }
    }

    /**
     * Hide progress indicator
     */
    private hideProgressIndicator(): void {
        if (this.progressIndicator) {
            this.progressIndicator.hide();
        }
    }

    /**
     * Show filter results with statistics
     */
    private showFilterResults(statistics: any, startDate: Date, endDate: Date): void {
        const formatDate = (date: Date) => format(date, 'MMM d, yyyy');
        let message: string;
        
        if (this.isSameDay(startDate, endDate)) {
            message = `Filtered to ${formatDate(startDate)}`;
        } else {
            message = `Filtered from ${formatDate(startDate)} to ${formatDate(endDate)}`;
        }
        
        if (statistics) {
            message += ` (${statistics.visibleEntries} of ${statistics.totalEntries} entries)`;
        }
        
        new Notice(message);
    }

    /**
     * Handle filter errors with user-friendly messages
     */
    private handleFilterError(error: Error): void {
        const enrichedError = this.logger.enrichError(error, {
            component: 'DateNavigatorIntegration',
            operation: 'filter',
            metadata: {
                isProcessing: this.isProcessing,
                hasWorkerManager: !!this.workerManager,
                hasProgressIndicator: !!this.progressIndicator
            }
        });
        
        this.logger.error('Filter', 'Filter operation failed', enrichedError);
        
        new Notice('Filter processing encountered an issue. Please try again.', 6000);
    }

    /**
     * Update layout metrics after filtering
     */
    private updateLayoutMetrics(): void {
        // Trigger any necessary recalculations
        const event = new CustomEvent('oom-filter-applied', {
            bubbles: true,
            detail: { timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }
}
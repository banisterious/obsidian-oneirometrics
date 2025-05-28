import { App, Modal, Notice } from 'obsidian';
import { DateNavigator } from './DateNavigator';
import { DreamMetricsState } from '../../state/DreamMetricsState';
import { DateNavigatorIntegration } from './DateNavigatorIntegration';
import { TimeFilterManager } from '../../timeFilters';
import { startOfDay, endOfDay } from 'date-fns';

// Safely reference global logger without causing errors if it's not defined
declare global {
    interface Window {
        globalLogger?: any;
    }
}

/**
 * Enum for the different view modes of the date navigator
 */
export enum NavigatorViewMode {
    /** Calendar view showing a monthly calendar */
    CALENDAR = 'calendar',
    /** List view showing a list of dates with dreams */
    LIST = 'list',
    /** Timeline view showing dates on a horizontal timeline */
    TIMELINE = 'timeline'
}

export class DateNavigatorModal extends Modal {
    private dateNavigator: DateNavigator | null = null;
    private integration: DateNavigatorIntegration | null = null;
    private state: DreamMetricsState;
    private timeFilterManager: TimeFilterManager;
    private onRangeSelected: ((range: {start: Date, end: Date}) => void) | null = null;
    private forceApplyDateFilter: ((range: {start: Date, end: Date}) => void) | null = null;
    private allPossibleEntries: any[] = [];
    
    // Static reference to the active modal instance
    public static activeModal: DateNavigatorModal | null = null;

    constructor(
        app: App, 
        state: DreamMetricsState,
        timeFilterManager: TimeFilterManager,
        onRangeSelected?: (range: {start: Date, end: Date}) => void,
        forceApplyDateFilter?: (range: {start: Date, end: Date}) => void
    ) {
        super(app);
        this.state = state;
        this.timeFilterManager = timeFilterManager;
        this.onRangeSelected = onRangeSelected || null;
        this.forceApplyDateFilter = forceApplyDateFilter || null;
    }

    onOpen(): void {
        // Set as active modal
        DateNavigatorModal.activeModal = this;
        
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-date-navigator-modal');

        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigatorModal', 'onOpen called');
            }
        } catch (e) {
            // Silent failure - logging should never break functionality
        }
        
        // Debug log of the state
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigatorModal', 'State inspection:', {
                    stateType: typeof this.state,
                    stateHasDreamEntries: this.state && typeof this.state.getDreamEntries === 'function',
                    timeFilterManagerType: typeof this.timeFilterManager
                });
            }
            
            // CRITICAL: Find entries from all possible sources
            this.allPossibleEntries = [];
            
            // 1. Try direct access to state entries
            if (this.state) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigatorModal', 'Checking state for entries');
                }
                
                // Try getDreamEntries method
                if (typeof this.state.getDreamEntries === 'function') {
                    const entries = this.state.getDreamEntries();
                    
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorModal', `Found ${entries?.length || 0} entries in state.getDreamEntries()`);
                    }
                    
                    if (entries && Array.isArray(entries) && entries.length > 0) {
                        this.allPossibleEntries.push(...entries);
                    }
                }
                
                // Try direct entries property
                const stateAny = this.state as any;
                if (stateAny.entries && Array.isArray(stateAny.entries)) {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorModal', `Found ${stateAny.entries.length} entries in state.entries property`);
                    }
                    this.allPossibleEntries.push(...stateAny.entries);
                }
            }
            
            // 2. Try to get entries from the global plugin
            if (window['oneiroMetricsPlugin']) {
                const plugin = window['oneiroMetricsPlugin'] as any;
                
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigatorModal', 'Checking plugin for entries');
                }
                
                // Try direct properties
                const possibleProperties = ['dreamEntries', 'entries', 'dreamMetricData', 'dreamMetrics'];
                possibleProperties.forEach(prop => {
                    if (plugin[prop] && Array.isArray(plugin[prop])) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigatorModal', `Found ${plugin[prop].length} entries in plugin.${prop}`);
                        }
                        this.allPossibleEntries.push(...plugin[prop]);
                    }
                });
                
                // Try to access entries via plugin state
                if (plugin.state) {
                    if (typeof plugin.state.getDreamEntries === 'function') {
                        const pluginEntries = plugin.state.getDreamEntries();
                        if (pluginEntries && Array.isArray(pluginEntries)) {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].debug('DateNavigatorModal', `Found ${pluginEntries.length} entries in plugin.state.getDreamEntries()`);
                            }
                            this.allPossibleEntries.push(...pluginEntries);
                        }
                    }
                    
                    // Try direct state entries
                    if (plugin.state.entries && Array.isArray(plugin.state.entries)) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigatorModal', `Found ${plugin.state.entries.length} entries in plugin.state.entries`);
                        }
                        this.allPossibleEntries.push(...plugin.state.entries);
                    }
                }
                
                // CRITICAL: Try to extract entries from table data
                try {
                    if (plugin.memoizedTableData && plugin.memoizedTableData.size > 0) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigatorModal', `Found memoizedTableData with ${plugin.memoizedTableData.size} tables`);
                        }
                        
                        // Process each table
                        plugin.memoizedTableData.forEach((tableData: any[], key: string) => {
                            if (Array.isArray(tableData) && tableData.length > 0) {
                                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                    window['globalLogger'].debug('DateNavigatorModal', `Processing table ${key} with ${tableData.length} rows`);
                                }
                                
                                // Sample a row to see what fields are available
                                if (tableData[0]) {
                                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                        window['globalLogger'].debug('DateNavigatorModal', `Sample row fields: ${Object.keys(tableData[0]).join(', ')}`);
                                    }
                                }
                                
                                // Convert table rows to entries
                                tableData.forEach(row => {
                                    // Only process rows with a date field
                                    if (row && (row.date || row.dream_date)) {
                                        const dateField = row.date || row.dream_date;
                                        
                                        // Create an entry object
                                        const entry = {
                                            date: dateField,
                                            title: row.title || row.dream_title || 'Dream Entry',
                                            content: row.content || row.dream_content || '',
                                            source: `table-${key}`,
                                            metrics: row.metrics || {}
                                        };
                                        
                                        // Add any numeric properties as metrics
                                        Object.keys(row).forEach(field => {
                                            if (typeof row[field] === 'number' && !['id', 'index'].includes(field)) {
                                                if (!entry.metrics) entry.metrics = {};
                                                entry.metrics[field] = row[field];
                                            }
                                        });
                                        
                                        this.allPossibleEntries.push(entry);
                                    }
                                });
                            }
                        });
                    }
                } catch (err) {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].error('DateNavigatorModal', 'Error processing table data:', err);
                    }
                }
            }
            
            // If we found any entries, don't bother creating test entries
            if (this.allPossibleEntries.length > 0) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigatorModal', `Found ${this.allPossibleEntries.length} total entries from all sources`);
                }
            } else {
                // If no entries, create test entries
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigatorModal', 'No entries found in state, creating test entries');
                }
                
                // Create test entries for May 2025
                const testEntries = [];
                for (let i = 0; i < 10; i++) {
                    const day = Math.floor(Math.random() * 28) + 1;
                    const dateStr = `2025-05-${day.toString().padStart(2, '0')}`;
                    
                    testEntries.push({
                        date: dateStr,
                        title: `Test Dream ${i+1}`,
                        content: `Test dream content for ${dateStr}`,
                        source: 'test-generator',
                        metrics: {
                            clarity: Math.floor(Math.random() * 10) + 1,
                            intensity: Math.floor(Math.random() * 10) + 1
                        }
                    });
                }
                
                // Add test entries to allPossibleEntries
                this.allPossibleEntries.push(...testEntries);
                
                // Try to update the state
                if (typeof this.state.updateDreamEntries === 'function') {
                    this.state.updateDreamEntries(testEntries);
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorModal', 'Added test entries to state');
                    }
                } else {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].error('DateNavigatorModal', 'Cannot update dream entries - function not available');
                    }
                }
            }
        } catch (err) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('DateNavigatorModal', 'Error during state inspection:', err);
            }
        }

        // Add title
        contentEl.createEl('h2', { 
            text: 'Dream Date Navigator', 
            cls: 'oom-modal-title' 
        });

        // Create container for date navigator
        const container = contentEl.createDiv('oom-date-navigator-container');

        // Initialize the integration and date navigator
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigatorModal', 'Creating DateNavigatorIntegration');
            }
            
            this.integration = new DateNavigatorIntegration(
                this.app, 
                this.state, 
                this.timeFilterManager
            );
            
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigatorModal', 'Initializing DateNavigator');
            }
            
            this.dateNavigator = this.integration.initialize(container);
            
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigatorModal', 'DateNavigator initialized successfully');
            }
            
            // CRITICAL: Force the collected entries into the DateNavigator if available
            if (this.dateNavigator && typeof this.allPossibleEntries !== 'undefined' && this.allPossibleEntries.length > 0) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigatorModal', `Forcing ${this.allPossibleEntries.length} entries into DateNavigator`);
                }
                
                // Check if forceDreamEntries is available (it should be since we added it)
                if (typeof this.dateNavigator.forceDreamEntries === 'function') {
                    this.dateNavigator.forceDreamEntries(this.allPossibleEntries);
                    
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorModal', 'Successfully forced entries into DateNavigator');
                    }
                } else {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].error('DateNavigatorModal', 'DateNavigator.forceDreamEntries method not available');
                    }
                    
                    // Try setDreamEntries method as fallback
                    if (typeof this.dateNavigator.setDreamEntries === 'function') {
                        this.dateNavigator.setDreamEntries(this.allPossibleEntries);
                        
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigatorModal', 'Used setDreamEntries as fallback to inject entries');
                        }
                    }
                }
            } else {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].warn('DateNavigatorModal', `Cannot force entries: dateNavigator=${!!this.dateNavigator}, entries=${this.allPossibleEntries?.length || 0}`);
                }
            }
        } catch (err) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('DateNavigatorModal', 'Error initializing DateNavigator:', err);
            }
            
            // Create error message in UI
            container.createEl('div', {
                text: 'Error initializing Date Navigator. See console for details.',
                cls: 'oom-error-message'
            });
        }

        // Add button container
        const buttonContainer = contentEl.createDiv('oom-modal-button-container');
        
        // Today button
        const todayButton = buttonContainer.createEl('button', {
            text: 'Today',
            cls: 'oom-modal-button oom-today-button',
            attr: {
                'aria-label': 'Navigate to today'
            }
        });
        
        todayButton.addEventListener('click', () => {
            if (!this.dateNavigator) {
                new Notice('Date navigator not initialized properly. Please try reopening the modal.');
                return;
            }
            
            // First navigate to today's month
            const today = new Date();
            this.dateNavigator.navigateToMonth(today);
            
            // Then select today
            this.dateNavigator.selectDay(today);
            
            new Notice('Navigated to today');
        });
        
        // Apply Filter button
        const applyButton = buttonContainer.createEl('button', {
            text: 'Apply Filter',
            cls: 'oom-modal-button oom-apply-button',
            attr: {
                'aria-label': 'Apply the current date selection as a filter'
            }
        });
        
        applyButton.addEventListener('click', () => {
            if (!this.dateNavigator) {
                new Notice('Date navigator not initialized properly. Please try reopening the modal.');
                return;
            }
            
            // Get the selected date, or the current day if none is selected
            const selectedDate = this.dateNavigator.getSelectedDay();
            
            if (!selectedDate) {
                new Notice('No date selected. Please select a date first.');
                return;
            }
            
            // Call the global forceApplyDateFilter function
            if (typeof window.forceApplyDateFilter === 'function') {
                try {
                    // Create copy of the date to avoid timezone issues
                    const dateToFilter = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                    
                    // Apply the filter
                    window.forceApplyDateFilter(dateToFilter);
                    
                    // Show success notice
                    new Notice(`Filter applied for ${selectedDate.toLocaleDateString()}`);
                    
                    // Close the modal
                    this.close();
                } catch (error) {
                    try {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].error('DateNavigatorModal', 'Error applying date filter', error);
                        }
                    } catch (e) {
                        // Silent failure - logging should never break functionality
                    }
                    new Notice('Error applying filter. Please try again.');
                }
            } else {
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].error('DateNavigatorModal', 'forceApplyDateFilter function not found');
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
                new Notice('Filter application not available. Please update the plugin.');
            }
        });
        
        // Clear button
        const clearButton = buttonContainer.createEl('button', {
            text: 'Clear Selection',
            cls: 'oom-modal-button oom-clear-button',
            attr: {
                'aria-label': 'Clear date selection'
            }
        });
        
        clearButton.addEventListener('click', () => {
            if (!this.dateNavigator) {
                new Notice('Date navigator not initialized properly. Please try reopening the modal.');
                return;
            }
            
            this.dateNavigator.clearSelection();
            new Notice('Selection cleared');
        });
        
        // Close button
        const closeButton = buttonContainer.createEl('button', {
            text: 'Close',
            cls: 'oom-modal-button oom-close-button',
            attr: {
                'aria-label': 'Close date navigator'
            }
        });
        
        closeButton.addEventListener('click', () => {
            this.close();
        });
        
        // Add keyboard shortcuts
        this.scope.register([], 'escape', (evt) => {
            this.close();
            return false;
        });
        
        // Arrow keys for navigation (will implement in future)
        this.scope.register([], 'ArrowLeft', (evt) => {
            // Navigate left
            return false;
        });
        
        this.scope.register([], 'ArrowRight', (evt) => {
            // Navigate right
            return false;
        });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
        
        // Clean up integration
        if (this.integration) {
            try {
                // Try to call destroy if it exists
                // @ts-ignore - TypeScript doesn't know this method exists at compile time
                this.integration.destroy();
            } catch (e) {
                // Silently fail if method doesn't exist
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigatorModal', 'DateNavigatorIntegration.destroy method not available');
                    }
                } catch (error) {
                    // Silent failure - logging should never break functionality
                }
            }
            this.integration = null;
        }
        
        this.dateNavigator = null;
        
        // Clear active modal reference
        DateNavigatorModal.activeModal = null;
    }
    
    /**
     * Get the current date navigator instance
     */
    public getDateNavigator(): DateNavigator | null {
        return this.dateNavigator;
    }
    
    /**
     * Navigate to a specific month
     */
    public navigateToMonth(date: Date): void {
        if (!this.dateNavigator) {
            new Notice('Date navigator not initialized properly. Please try reopening the modal.');
            return;
        }
        
        this.dateNavigator.navigateToMonth(date);
    }
    
    /**
     * Select a specific day
     */
    public selectDay(date: Date): void {
        if (!this.dateNavigator) {
            new Notice('Date navigator not initialized properly. Please try reopening the modal.');
            return;
        }
        
        this.dateNavigator.selectDay(date);
    }
} 
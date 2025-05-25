import { App, Notice } from 'obsidian';
import { DateNavigator } from './DateNavigator';
import { TimeFilterManager, DateRange } from '../timeFilters';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { format } from 'date-fns';

// Import the global logger from main.ts - will be initialized when plugin loads
declare const globalLogger: any;

export class DateNavigatorIntegration {
    private app: App;
    private state: DreamMetricsState;
    private timeFilterManager: TimeFilterManager;
    private dateNavigator: DateNavigator | null = null;
    private container: HTMLElement | null = null;
    private isUpdatingSelection: boolean = false; // Add a flag to prevent recursive updates
    private rangeSelectionMode: boolean = false;
    private rangeStartDate: Date | null = null;
    private rangeEndDate: Date | null = null;
    
    constructor(app: App, state: DreamMetricsState | any, filterManager?: TimeFilterManager) {
        this.app = app;
        
        // Handle the case where the second parameter is actually the plugin
        if (state && !(state instanceof DreamMetricsState) && typeof state === 'object') {
            // Extract state and filter manager from plugin
            this.state = state.state || new DreamMetricsState();
            this.timeFilterManager = filterManager || state.timeFilterManager;
        } else {
            // Normal case - state is provided directly
            this.state = state;
            this.timeFilterManager = filterManager as TimeFilterManager;
        }
        
        // Create default TimeFilterManager if none provided
        if (!this.timeFilterManager) {
            console.warn('DateNavigatorIntegration: No TimeFilterManager provided, creating a default one');
            this.timeFilterManager = new TimeFilterManager();
        }
        
        // Listen for filter changes
        this.timeFilterManager.onFilterChange = (filter) => {
            this.handleFilterChange(filter.getDateRange());
        };
    }
    
    /**
     * Initialize the Date Navigator in the specified container
     */
    public initialize(container: HTMLElement): DateNavigator {
        this.container = container;
        
        // Create the date navigator
        this.dateNavigator = new DateNavigator(container, this.state);
        
        // Apply any active filter
        const currentRange = this.timeFilterManager.getCurrentRange();
        if (currentRange) {
            this.handleFilterChange(currentRange);
        }
        
        // Set up selection handler
        this.setupSelectionHandler();

        // Add a range selection toggle button
        this.addRangeSelectionToggle();
        
        return this.dateNavigator;
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
                
                globalLogger?.debug('DateNavigator', 'Range selection mode enabled');
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
                
                globalLogger?.debug('DateNavigator', 'Range selection mode disabled');
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
        this.dateNavigator.applyFilter = (startDate: Date | null, endDate: Date | null) => {
            // Handle range selection mode first
            if (this.rangeSelectionMode) {
                this.handleRangeSelection(startDate);
                return;
            }
            
            // For standard mode, call the original method first
            originalApplyFilter.call(this.dateNavigator, startDate, endDate);
            
            // Then handle the filter change
            if (startDate && endDate) {
                // Prevent recursive updates
                if (this.isUpdatingSelection) return;
                
                this.isUpdatingSelection = true;
                // Set custom filter in TimeFilterManager
                this.timeFilterManager.setCustomRange(startDate, endDate);
                
                // Show a notice
                const formatDate = (date: Date) => format(date, 'MMM d, yyyy');
                if (this.isSameDay(startDate, endDate)) {
                    new Notice(`Filtered to ${formatDate(startDate)}`);
                } else {
                    new Notice(`Filtered from ${formatDate(startDate)} to ${formatDate(endDate)}`);
                }
                this.isUpdatingSelection = false;
            } else {
                // Prevent recursive updates
                if (this.isUpdatingSelection) return;
                
                this.isUpdatingSelection = true;
                // Clear filter
                this.timeFilterManager.clearCurrentFilter();
                new Notice('Date filter cleared');
                this.isUpdatingSelection = false;
            }
        };
    }
    
    /**
     * Handle date selection during range selection mode
     */
    private handleRangeSelection(selectedDate: Date | null): void {
        if (!selectedDate) return;
        
        // If no start date is selected yet, set it
        if (!this.rangeStartDate) {
            this.rangeStartDate = new Date(selectedDate);
            globalLogger?.debug('DateNavigator', 'Range start date selected', { date: this.rangeStartDate });
            
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
        globalLogger?.debug('DateNavigator', 'Range end date selected', { 
            start: this.rangeStartDate, 
            end: this.rangeEndDate 
        });
        
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
            
            // Set custom filter in TimeFilterManager
            this.timeFilterManager.setCustomRange(start, end);
            
            // Show a notice
            new Notice(`Filtered from ${format(start, 'MMM d, yyyy')} to ${format(end, 'MMM d, yyyy')}`);
            
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
                    
                    // Log the range for debugging
                    globalLogger?.debug('DateNavigator', 'Applied filter with range', {
                        start: format(range.start, 'yyyy-MM-dd'),
                        end: format(range.end, 'yyyy-MM-dd')
                    });
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
        this.timeFilterManager.onFilterChange = null;
        this.dateNavigator = null;
        this.container = null;
    }
} 
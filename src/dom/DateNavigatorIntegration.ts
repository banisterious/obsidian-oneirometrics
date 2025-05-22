import { App, Notice } from 'obsidian';
import { DateNavigator } from './DateNavigator';
import { TimeFilterManager, DateRange } from '../timeFilters';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { format } from 'date-fns';

export class DateNavigatorIntegration {
    private app: App;
    private state: DreamMetricsState;
    private timeFilterManager: TimeFilterManager;
    private dateNavigator: DateNavigator | null = null;
    private container: HTMLElement | null = null;
    private isUpdatingSelection: boolean = false; // Add a flag to prevent recursive updates
    
    constructor(app: App, state: DreamMetricsState, filterManager: TimeFilterManager) {
        this.app = app;
        this.state = state;
        this.timeFilterManager = filterManager;
        
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
        
        return this.dateNavigator;
    }
    
    /**
     * Setup the selection handler to connect day selection with the filter system
     */
    private setupSelectionHandler(): void {
        if (!this.dateNavigator) return;
        
        // Override the applyFilter method of the DateNavigator
        const originalApplyFilter = this.dateNavigator.applyFilter;
        this.dateNavigator.applyFilter = (startDate: Date | null, endDate: Date | null) => {
            // Call the original method first
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
                // TODO: Implement range selection in a future update
                // For now, just highlight the start date
                // Directly set the selectedDay in the DateNavigator
                const dateNavigator = this.dateNavigator as any; // Type cast to access private field
                if (dateNavigator) {
                    dateNavigator.selectedDay = new Date(range.start); // Direct assignment
                    this.dateNavigator.selectDay(range.start); // Then call selectDay
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
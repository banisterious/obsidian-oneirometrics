import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricData } from '../types/core';
import { createDateRangeFilter, createFilterButton, createFilterGroup } from './FilterFactory';
import { EventableComponent } from '../templates/ui/BaseComponent';

// Import the global logger from main.ts - will be initialized when plugin loads
declare const globalLogger: any;

export class DateRangeFilter {
    private state: DreamMetricsState;
    private startDate: Date | null = null;
    private endDate: Date | null = null;
    private isFiltering = false;
    private dateRangeComponent: EventableComponent | null = null;
    
    constructor(state: DreamMetricsState) {
        this.state = state;
    }

    public render(container: HTMLElement): void {
        const filterContainer = container.createDiv('oom-filter-container');
        
        // Create a filter group for date range filters
        const filterGroup = createFilterGroup({
            id: 'date-range-filter-group',
            className: 'oom-date-range-group',
            container: filterContainer
        });
        
        // Create date range filter
        this.dateRangeComponent = createDateRangeFilter({
            id: 'dream-date-range',
            className: 'oom-dream-date-range',
            container: filterGroup.createElement('div'),
            label: 'Date Range'
        });

        // Subscribe to apply event
        this.dateRangeComponent.on('apply', (range: { start: Date, end: Date }) => {
            this.setDateRange(range.start, range.end);
        });

        // Subscribe to clear event
        this.dateRangeComponent.on('clear', () => {
            this.clearFilter();
        });

        // Quick filter buttons in a group
        const quickFiltersContainer = filterGroup.createElement('div');
        quickFiltersContainer.className = 'oom-quick-filters';
        
        // This week button
        const thisWeekButton = createFilterButton({
            id: 'this-week-filter',
            className: 'oom-button-secondary',
            container: quickFiltersContainer,
            label: 'This Week'
        });
        
        thisWeekButton.on('click', () => {
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            this.setDateRange(startOfWeek, endOfWeek);
            this.updateDateRangeComponent();
        });

        // This month button
        const thisMonthButton = createFilterButton({
            id: 'this-month-filter',
            className: 'oom-button-secondary',
            container: quickFiltersContainer,
            label: 'This Month'
        });
        
        thisMonthButton.on('click', () => {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            
            this.setDateRange(startOfMonth, endOfMonth);
            this.updateDateRangeComponent();
        });

        // Last 30 days button
        const last30DaysButton = createFilterButton({
            id: 'last-30-days-filter',
            className: 'oom-button-secondary',
            container: quickFiltersContainer,
            label: 'Last 30 Days'
        });
        
        last30DaysButton.on('click', () => {
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            thirtyDaysAgo.setHours(0, 0, 0, 0);
            
            this.setDateRange(thirtyDaysAgo, today);
            this.updateDateRangeComponent();
        });
    }

    private setDateRange(start: Date, end: Date): void {
        this.startDate = start;
        this.endDate = end;
        this.applyFilter();
    }

    private clearFilter(): void {
        this.startDate = null;
        this.endDate = null;
        this.applyFilter();
    }

    private updateDateRangeComponent(): void {
        if (this.dateRangeComponent && this.startDate && this.endDate) {
            // Cast to DateRangeFilterComponent to access the setDateRange method
            const dateRangeComponent = this.dateRangeComponent as any;
            if (typeof dateRangeComponent.setDateRange === 'function') {
                dateRangeComponent.setDateRange(this.startDate, this.endDate);
            }
        }
    }

    private formatDateForInput(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private applyFilter(): void {
        // Prevent multiple filtering operations from running simultaneously
        if (this.isFiltering) return;
        this.isFiltering = true;
        
        globalLogger?.debug('Filters', 'Applying date range filter', {
            startDate: this.startDate ? this.startDate.toISOString() : null,
            endDate: this.endDate ? this.endDate.toISOString() : null
        });
        
        const entries = this.state.getDreamEntries();
        
        // Pre-filtering step: Quickly filter out entries outside the month range
        // This significantly improves performance by reducing the data set before detailed filtering
        let candidateEntries = entries;
        if (this.startDate || this.endDate) {
            const startYear = this.startDate ? this.startDate.getFullYear() : 0;
            const startMonth = this.startDate ? this.startDate.getMonth() : 0;
            const endYear = this.endDate ? this.endDate.getFullYear() : 9999;
            const endMonth = this.endDate ? this.endDate.getMonth() : 11;
            
            candidateEntries = entries.filter(entry => {
                // Use string format for quick comparison to avoid time zone issues
                const dateStr = entry.date;
                if (!dateStr) return false;
                
                try {
                    const entryDate = new Date(dateStr);
                    const entryYear = entryDate.getFullYear();
                    const entryMonth = entryDate.getMonth();
                    
                    // Quick month-year check before detailed date comparison
                    const yearMonthInRange = (
                        (entryYear > startYear || (entryYear === startYear && entryMonth >= startMonth)) &&
                        (entryYear < endYear || (entryYear === endYear && entryMonth <= endMonth))
                    );
                    
                    return yearMonthInRange;
                } catch (e) {
                    globalLogger?.error('Filters', 'Error parsing date', {
                        date: dateStr,
                        error: e
                    });
                    return false;
                }
            });
        }
        
        // Detailed filtering with exact date comparison
        const filteredEntries = candidateEntries.filter(entry => {
            if (!entry.date) return false;
            
            try {
                const entryDate = new Date(entry.date);
                
                // Start date check
                if (this.startDate && entryDate < this.startDate) {
                    return false;
                }
                
                // End date check
                if (this.endDate) {
                    // Set end date to end of day for inclusive filtering
                    const endOfDay = new Date(this.endDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    
                    if (entryDate > endOfDay) {
                        return false;
                    }
                }
                
                return true;
            } catch (e) {
                globalLogger?.error('Filters', 'Error filtering by date', {
                    date: entry.date,
                    error: e
                });
                return false;
            }
        });
        
        // Update state with filtered entries
        this.state.updateDreamEntries(filteredEntries);
        
        // Log filtering stats
        globalLogger?.debug('Filters', 'Date filter applied', {
            totalEntries: entries.length,
            candidateEntries: candidateEntries.length,
            filteredEntries: filteredEntries.length
        });
        
        this.isFiltering = false;
    }
} 
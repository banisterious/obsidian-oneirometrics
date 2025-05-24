import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricData } from '../types/core';

// Import the global logger from main.ts - will be initialized when plugin loads
declare const globalLogger: any;

export class DateRangeFilter {
    private state: DreamMetricsState;
    private startDate: Date | null = null;
    private endDate: Date | null = null;
    private isFiltering = false;

    constructor(state: DreamMetricsState) {
        this.state = state;
    }

    public render(container: HTMLElement): void {
        const filterContainer = container.createDiv('oom-filter-container');
        
        // Date range inputs
        const dateRangeContainer = filterContainer.createDiv('oom-date-range-container');
        
        // Start date input
        const startDateContainer = dateRangeContainer.createDiv('oom-date-input-container');
        const startDateLabel = startDateContainer.createEl('label', { text: 'Start Date' });
        const startDateInput = startDateContainer.createEl('input', {
            type: 'date',
            attr: {
                'aria-label': 'Start date for dream entries'
            }
        });
        
        // End date input
        const endDateContainer = dateRangeContainer.createDiv('oom-date-input-container');
        const endDateLabel = endDateContainer.createEl('label', { text: 'End Date' });
        const endDateInput = endDateContainer.createEl('input', {
            type: 'date',
            attr: {
                'aria-label': 'End date for dream entries'
            }
        });

        // Quick filter buttons
        const quickFiltersContainer = filterContainer.createDiv('oom-quick-filters');
        
        // This week button
        const thisWeekButton = quickFiltersContainer.createEl('button', {
            text: 'This Week',
            cls: 'oom-button oom-button--secondary'
        });
        
        // This month button
        const thisMonthButton = quickFiltersContainer.createEl('button', {
            text: 'This Month',
            cls: 'oom-button oom-button--secondary'
        });
        
        // Last 30 days button
        const last30DaysButton = quickFiltersContainer.createEl('button', {
            text: 'Last 30 Days',
            cls: 'oom-button oom-button--secondary'
        });
        
        // Clear button
        const clearButton = quickFiltersContainer.createEl('button', {
            text: 'Clear',
            cls: 'oom-button oom-button--secondary'
        });

        // Event listeners
        startDateInput.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            this.startDate = target.value ? new Date(target.value) : null;
            this.applyFilter();
        });

        endDateInput.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            this.endDate = target.value ? new Date(target.value) : null;
            this.applyFilter();
        });

        thisWeekButton.addEventListener('click', () => {
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);
            
            this.setDateRange(startOfWeek, endOfWeek);
            this.updateInputs(filterContainer);
        });

        thisMonthButton.addEventListener('click', () => {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            
            this.setDateRange(startOfMonth, endOfMonth);
            this.updateInputs(filterContainer);
        });

        last30DaysButton.addEventListener('click', () => {
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            thirtyDaysAgo.setHours(0, 0, 0, 0);
            
            this.setDateRange(thirtyDaysAgo, today);
            this.updateInputs(filterContainer);
        });

        clearButton.addEventListener('click', () => {
            this.clearFilter();
            this.updateInputs(filterContainer);
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

    private updateInputs(container: HTMLElement): void {
        const startDateInput = container.querySelector('input[aria-label="Start date for dream entries"]') as HTMLInputElement;
        const endDateInput = container.querySelector('input[aria-label="End date for dream entries"]') as HTMLInputElement;

        if (startDateInput) {
            startDateInput.value = this.startDate ? this.formatDateForInput(this.startDate) : '';
        }
        if (endDateInput) {
            endDateInput.value = this.endDate ? this.formatDateForInput(this.endDate) : '';
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
                // Convert to ISO date strings for comparison to avoid time zone issues
                const entryDate = new Date(entry.date);
                const entryDateStr = entryDate.toISOString().split('T')[0]; // YYYY-MM-DD format
                
                if (this.startDate) {
                    const startDateStr = this.startDate.toISOString().split('T')[0];
                    if (entryDateStr < startDateStr) return false;
                }
                
                if (this.endDate) {
                    const endDateStr = this.endDate.toISOString().split('T')[0];
                    if (entryDateStr > endDateStr) return false;
                }
                
                return true;
            } catch (e) {
                globalLogger?.error('Filters', 'Error processing entry date', {
                    date: entry.date,
                    error: e
                });
                return false;
            }
        });

        globalLogger?.debug('Filters', `Filtered ${entries.length} entries to ${filteredEntries.length} entries`);
        this.state.updateDreamEntries(filteredEntries);
        this.isFiltering = false;
    }
} 
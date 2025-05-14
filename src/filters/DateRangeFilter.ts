import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricData } from '../types';

export class DateRangeFilter {
    private state: DreamMetricsState;
    private startDate: Date | null = null;
    private endDate: Date | null = null;

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
        const entries = this.state.getDreamEntries();
        const filteredEntries = entries.filter(entry => {
            const entryDate = new Date(entry.date);
            
            if (this.startDate && entryDate < this.startDate) {
                return false;
            }
            
            if (this.endDate && entryDate > this.endDate) {
                return false;
            }
            
            return true;
        });

        this.state.updateDreamEntries(filteredEntries);
    }
} 
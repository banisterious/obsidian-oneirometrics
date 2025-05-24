import { App } from 'obsidian';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { DreamMetricData } from '../types/core';
import { getSourceFile, getSourceId, isObjectSource } from '../utils/type-guards';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addDays,
    subDays,
    addMonths,
    subMonths,
    format,
    isToday,
    isSameMonth,
    isSameDay,
    isWithinInterval,
    startOfDay,
    endOfDay,
    differenceInDays,
    getDaysInMonth,
    getDay,
    parse
} from 'date-fns';

// Core interfaces
export interface Day {
    date: Date;
    hasDreamEntry: boolean;
    entries: DreamMetricData[];
    metrics: MetricSummary;
    isSelected: boolean;
    isToday: boolean;
    isCurrentMonth: boolean;
}

export interface MonthNavigation {
    currentView: Date;
    canNavigateBack: boolean;
    canNavigateForward: boolean;
}

export interface MetricSummary {
    count: number;
    key: string;
    value: number;
    indicator: 'high' | 'medium' | 'low' | 'none';
}

// Main DateNavigator class
export class DateNavigator {
    private container: HTMLElement;
    private state: DreamMetricsState;
    private currentMonth: Date;
    private selectedDay: Date | null = null;
    private dreamEntries: Map<string, DreamMetricData[]> = new Map();
    private metrics: Map<string, MetricSummary> = new Map();
    private filterActive: boolean = false;
    private dayElements: Map<string, HTMLElement> = new Map();
    
    constructor(container: HTMLElement, state: DreamMetricsState) {
        this.container = container;
        this.state = state;
        this.currentMonth = new Date();
        
        // Initialize the date navigator
        this.initialize();
    }
    
    private initialize(): void {
        // Clear the container
        this.container.empty();
        this.container.addClass('oom-date-navigator');
        
        // Create the month header
        this.createMonthHeader();
        
        // Create the month grid
        this.createMonthGrid();
        
        // Load dream entries for the current month
        this.loadEntriesForMonth(this.currentMonth);
        
        // Attach event listeners
        this.attachEventListeners();
    }
    
    private createMonthHeader(): void {
        const headerContainer = this.container.createDiv('oom-month-header');
        
        // Left navigation button
        const prevButton = headerContainer.createEl('button', {
            cls: 'oom-month-button oom-month-prev-button',
            attr: {
                'aria-label': 'Previous month',
                'title': 'Previous month'
            }
        });
        prevButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
        
        // Month title
        const monthTitle = headerContainer.createEl('div', {
            cls: 'oom-month-title',
            text: format(this.currentMonth, 'MMMM yyyy')
        });
        
        // Right navigation button
        const nextButton = headerContainer.createEl('button', {
            cls: 'oom-month-button oom-month-next-button',
            attr: {
                'aria-label': 'Next month',
                'title': 'Next month'
            }
        });
        nextButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
        
        // Today button
        const todayButton = headerContainer.createEl('button', {
            cls: 'oom-month-button oom-today-button',
            text: 'Today',
            attr: {
                'aria-label': 'Go to today',
                'title': 'Go to today'
            }
        });
        
        // Event listeners
        prevButton.addEventListener('click', () => this.navigateMonth(-1));
        nextButton.addEventListener('click', () => this.navigateMonth(1));
        todayButton.addEventListener('click', () => this.navigateToToday());
    }
    
    private createMonthGrid(): void {
        const gridContainer = this.container.createDiv('oom-month-grid');
        
        // Create weekday headers
        const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        weekdays.forEach(day => {
            const dayHeader = gridContainer.createDiv('oom-day-header');
            dayHeader.textContent = day;
        });
        
        // Generate days for the current month view
        const days = this.generateDaysForMonth(this.currentMonth);
        days.forEach(day => {
            const dayCell = this.createDayCell(day);
            gridContainer.appendChild(dayCell);
            
            // Store reference to the element for later updates
            this.dayElements.set(this.formatDateKey(day.date), dayCell);
        });
    }
    
    private createDayCell(day: Day): HTMLElement {
        const dayCell = document.createElement('div');
        dayCell.className = 'oom-day-cell';
        
        if (!day.isCurrentMonth) {
            dayCell.addClass('other-month');
        }
        
        if (day.isToday) {
            dayCell.addClass('is-today');
        }
        
        if (day.isSelected) {
            dayCell.addClass('is-selected');
        }
        
        // Get the most up-to-date dream entries for this day
        const dateKey = this.formatDateKey(day.date);
        const entries = this.dreamEntries.get(dateKey) || [];
        const hasEntries = entries.length > 0;
        
        if (hasEntries) {
            dayCell.addClass('has-entries');
        }
        
        // Day number
        const dayNumber = dayCell.createDiv('oom-day-number');
        dayNumber.textContent = day.date.getDate().toString();
        
        // Dream indicators if applicable
        if (hasEntries) {
            const indicators = dayCell.createDiv('oom-dream-indicators');
            const entryCount = Math.min(entries.length, 5); // Limit to 5 dots
            
            for (let i = 0; i < entryCount; i++) {
                indicators.createDiv('oom-dream-dot');
            }
            
            // Add metrics summary if available
            if (day.metrics && day.metrics.value > 0) {
                const metricsEl = dayCell.createDiv('oom-day-metrics');
                
                // Create a simple visualization based on the indicator value
                let starsHtml = '';
                if (day.metrics.indicator === 'high') {
                    starsHtml = '★★★';
                } else if (day.metrics.indicator === 'medium') {
                    starsHtml = '★★';
                } else if (day.metrics.indicator === 'low') {
                    starsHtml = '★';
                }
                
                if (starsHtml) {
                    metricsEl.innerHTML = starsHtml;
                }
            }
            
            // Add hover preview
            const preview = dayCell.createDiv('oom-day-preview');
            
            // Add preview content if there are dream entries
            if (entries.length > 0) {
                // Try to extract a brief preview from the first entry
                const firstEntry = entries[0];
                if (firstEntry.content) {
                    // Extract first 100 characters for the preview
                    const previewText = firstEntry.content.substring(0, 100) + (firstEntry.content.length > 100 ? '...' : '');
                    preview.createDiv('oom-preview-content').textContent = previewText;
                } else {
                    preview.createDiv('oom-preview-content').textContent = 'Dream entry';
                }
            }
        }
        
        // Make cell interactive
        dayCell.setAttribute('tabindex', '0');
        dayCell.setAttribute('role', 'button');
        dayCell.setAttribute('aria-label', this.generateDayAriaLabel(day));
        
        // Click event for day selection
        dayCell.addEventListener('click', () => {
            // Let the selectDayInternal method handle the assignment
            this.selectDayInternal(day);
        });
        
        // Keyboard event for accessibility
        dayCell.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Let the selectDayInternal method handle the assignment
                this.selectDayInternal(day);
            }
        });
        
        return dayCell;
    }
    
    private generateDaysForMonth(month: Date): Day[] {
        const days: Day[] = [];
        const firstDayOfMonth = startOfMonth(month);
        const lastDayOfMonth = endOfMonth(month);
        const daysInMonth = getDaysInMonth(month);
        
        // Start day of the week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
        const startDay = getDay(firstDayOfMonth);
        
        // Add days from previous month to fill the first week
        const prevMonth = subMonths(month, 1);
        const daysInPrevMonth = getDaysInMonth(prevMonth);
        
        for (let i = startDay - 1; i >= 0; i--) {
            const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i);
            days.push(this.createDayObject(date, false));
        }
        
        // Add days of the current month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(month.getFullYear(), month.getMonth(), i);
            days.push(this.createDayObject(date, true));
        }
        
        // Calculate remaining cells to fill the grid (6 rows of 7 days = 42 cells)
        const remainingDays = 42 - days.length;
        const nextMonth = addMonths(month, 1);
        
        // Add days from the next month
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i);
            days.push(this.createDayObject(date, false));
        }
        
        return days;
    }
    
    private createDayObject(date: Date, isCurrentMonth: boolean): Day {
        const dateKey = this.formatDateKey(date);
        const entries = this.dreamEntries.get(dateKey) || [];
        const metrics = this.metrics.get(dateKey) || {
            count: 0,
            key: '',
            value: 0,
            indicator: 'none'
        };
        
        return {
            date: date,
            hasDreamEntry: entries.length > 0,
            entries: entries,
            metrics: metrics,
            isSelected: this.selectedDay ? this.isSameDay(date, this.selectedDay) : false,
            isToday: isToday(date),
            isCurrentMonth: isCurrentMonth
        };
    }
    
    private loadEntriesForMonth(month: Date): void {
        // Clear existing entries
        this.dreamEntries.clear();
        this.metrics.clear();
        
        // Get all dream entries
        const allEntries = this.state.getDreamEntries();
        
        // Filter entries for the visible month range (including partial weeks)
        const startDate = startOfDay(this.getFirstVisibleDate(month));
        const endDate = endOfDay(this.getLastVisibleDate(month));
        
        // Group entries by date
        allEntries.forEach(entry => {
            const entryDate = new Date(entry.date);
            
            // Check if the entry falls within the visible month range
            if (isWithinInterval(entryDate, { start: startDate, end: endDate })) {
                const dateKey = this.formatDateKey(entryDate);
                
                // Add to dream entries map
                if (!this.dreamEntries.has(dateKey)) {
                    this.dreamEntries.set(dateKey, []);
                }
                this.dreamEntries.get(dateKey)?.push(entry);
                
                // Calculate metrics for the day
                this.calculateDayMetrics(dateKey, this.dreamEntries.get(dateKey) || []);
            }
        });
        
        // Update the UI with the loaded entries
        this.updateMonthGrid();
    }
    
    private calculateDayMetrics(dateKey: string, entries: DreamMetricData[]): void {
        if (entries.length === 0) {
            this.metrics.set(dateKey, {
                count: 0,
                key: '',
                value: 0,
                indicator: 'none'
            });
            return;
        }
        
        // For now, we'll just use the entry count as a simple metric
        // Later, this can be expanded to include actual dream metrics
        
        let indicator: 'high' | 'medium' | 'low' | 'none' = 'none';
        
        if (entries.length >= 3) {
            indicator = 'high';
        } else if (entries.length === 2) {
            indicator = 'medium';
        } else if (entries.length === 1) {
            indicator = 'low';
        }
        
        this.metrics.set(dateKey, {
            count: entries.length,
            key: 'entries',
            value: entries.length,
            indicator: indicator
        });
    }
    
    private updateMonthGrid(): void {
        // Update the month title
        const monthTitle = this.container.querySelector('.oom-month-title');
        if (monthTitle) {
            monthTitle.textContent = format(this.currentMonth, 'MMMM yyyy');
        }
        
        // Update the day cells
        this.dayElements.forEach((element, dateKey) => {
            const date = this.parseDateKey(dateKey);
            
            if (date) {
                const entries = this.dreamEntries.get(dateKey) || [];
                const metrics = this.metrics.get(dateKey) || {
                    count: 0,
                    key: '',
                    value: 0,
                    indicator: 'none'
                };
                
                const dayObj: Day = {
                    date: date,
                    hasDreamEntry: entries.length > 0,
                    entries: entries,
                    metrics: metrics,
                    isSelected: this.selectedDay ? this.isSameDay(date, this.selectedDay) : false,
                    isToday: isToday(date),
                    isCurrentMonth: isSameMonth(date, this.currentMonth)
                };
                
                this.updateDayCell(element, dayObj);
            }
        });
    }
    
    private updateDayCell(element: HTMLElement, day: Day): void {
        // Update classes
        element.removeClass('other-month', 'is-today', 'is-selected', 'has-entries');
        
        if (!day.isCurrentMonth) {
            element.addClass('other-month');
        }
        
        if (day.isToday) {
            element.addClass('is-today');
        }
        
        // Only add is-selected class if this day exactly matches the selectedDay
        if (this.selectedDay && this.isSameDay(day.date, this.selectedDay)) {
            element.addClass('is-selected');
        }
        
        if (day.hasDreamEntry) {
            element.addClass('has-entries');
        }
        
        // Update indicators
        const indicators = element.querySelector('.oom-dream-indicators');
        if (indicators) {
            indicators.remove();
        }
        
        if (day.hasDreamEntry) {
            const newIndicators = element.createDiv('oom-dream-indicators');
            const entryCount = Math.min(day.entries.length, 5); // Limit to 5 dots
            
            for (let i = 0; i < entryCount; i++) {
                newIndicators.createDiv('oom-dream-dot');
            }
        }
        
        // Update metrics
        const metricsEl = element.querySelector('.oom-day-metrics');
        if (metricsEl) {
            metricsEl.remove();
        }
        
        if (day.hasDreamEntry && day.metrics && day.metrics.value > 0) {
            const newMetricsEl = element.createDiv('oom-day-metrics');
            
            let starsHtml = '';
            if (day.metrics.indicator === 'high') {
                starsHtml = '★★★';
            } else if (day.metrics.indicator === 'medium') {
                starsHtml = '★★';
            } else if (day.metrics.indicator === 'low') {
                starsHtml = '★';
            }
            
            if (starsHtml) {
                newMetricsEl.innerHTML = starsHtml;
            }
        }
        
        // Update preview
        const preview = element.querySelector('.oom-day-preview');
        if (preview) {
            preview.remove();
        }
        
        if (day.hasDreamEntry) {
            const newPreview = element.createDiv('oom-day-preview');
            
            if (day.entries.length > 0) {
                const firstEntry = day.entries[0];
                if (firstEntry.content) {
                    const previewText = firstEntry.content.substring(0, 100) + (firstEntry.content.length > 100 ? '...' : '');
                    newPreview.createDiv('oom-preview-content').textContent = previewText;
                } else {
                    newPreview.createDiv('oom-preview-content').textContent = 'Dream entry';
                }
            }
        }
        
        // Update aria label
        element.setAttribute('aria-label', this.generateDayAriaLabel(day));
    }
    
    /**
     * Clear the current day selection
     */
    public clearSelection(): void {
        this.selectedDay = null;
        this.filterActive = false;
        
        // Clear the filter
        this.applyFilter(null, null);
        
        // Update the UI to reflect selection
        this.updateMonthGrid();
    }
    
    /**
     * Select a day by its date
     * @param date The date to select
     */
    public selectDay(date: Date): void {
        // Make a clean copy of the date to avoid reference issues
        const newSelectedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        this.selectedDay = newSelectedDay;
        
        // Update grid to reflect the new selection
        this.updateMonthGrid();
        
        // Find the day object for this date
        const dateKey = this.formatDateKey(date);
        
        // Check if we have entries for this date
        const entries = this.dreamEntries.get(dateKey) || [];
        const metrics = this.metrics.get(dateKey) || {
            count: 0,
            key: '',
            value: 0,
            indicator: 'none'
        };
        
        // Create a day object
        const day: Day = {
            date: newSelectedDay,
            hasDreamEntry: entries.length > 0,
            entries: entries,
            metrics: metrics,
            isSelected: true,
            isToday: isToday(newSelectedDay),
            isCurrentMonth: isSameMonth(newSelectedDay, this.currentMonth)
        };
        
        // Apply filter for the selected day
        this.filterActive = true;
        this.applyFilter(newSelectedDay, newSelectedDay);
    }
    
    /**
     * Navigate to the month containing the specified date
     * @param date The date to navigate to
     */
    public navigateToMonth(date: Date): void {
        // Only navigate if different from current month
        if (!isSameMonth(date, this.currentMonth)) {
            this.currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            
            // Re-render the month grid
            this.container.querySelector('.oom-month-grid')?.remove();
            this.dayElements.clear();
            this.createMonthGrid();
            
            // Load entries for the new month
            this.loadEntriesForMonth(this.currentMonth);
        }
    }
    
    /**
     * Apply date filter
     * @param startDate Start date for the filter
     * @param endDate End date for the filter
     */
    public applyFilter(startDate: Date | null, endDate: Date | null): void {
        // Base implementation - will be overridden by integration
        
        // For now, we'll just log the filter change (only in debug mode)
        if (startDate && endDate) {
            // Debug-only logging
        } else {
            // Debug-only logging
        }
    }
    
    private selectDayInternal(day: Day): void {
        // Toggle selection only if clicking the exact same day that's already selected
        if (this.selectedDay && this.isSameDay(day.date, this.selectedDay)) {
            // Clear the selection
            this.selectedDay = null;
            this.filterActive = false;
            
            // Clear the filter
            this.applyFilter(null, null);
        } else {
            // Ensure that selectedDay is a clean new Date object - important for reference integrity
            this.selectedDay = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());
            this.filterActive = true;
            
            // Apply filter for the selected day (start and end are the same day)
            this.applyFilter(this.selectedDay, this.selectedDay);
        }
        
        // Update the UI to reflect selection
        this.updateMonthGrid();
    }
    
    private navigateMonth(delta: number): void {
        // Calculate new month
        this.currentMonth = delta > 0 
            ? addMonths(this.currentMonth, Math.abs(delta))
            : subMonths(this.currentMonth, Math.abs(delta));
        
        // Re-render the month grid
        this.container.querySelector('.oom-month-grid')?.remove();
        this.dayElements.clear();
        this.createMonthGrid();
        
        // Load entries for the new month
        this.loadEntriesForMonth(this.currentMonth);
    }
    
    private navigateToToday(): void {
        const today = new Date();
        
        // Only navigate if current month is different from today's month
        if (!isSameMonth(today, this.currentMonth)) {
            this.currentMonth = today;
            
            // Re-render the month grid
            this.container.querySelector('.oom-month-grid')?.remove();
            this.dayElements.clear();
            this.createMonthGrid();
            
            // Load entries for the new month
            this.loadEntriesForMonth(this.currentMonth);
        }
        
        // Highlight today
        const todayKey = this.formatDateKey(today);
        const todayElement = this.dayElements.get(todayKey);
        
        if (todayElement) {
            // Scroll to today's element
            todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add a temporary highlight
            todayElement.addClass('highlight-pulse');
            setTimeout(() => {
                todayElement.removeClass('highlight-pulse');
            }, 2000);
        }
    }
    
    // Helper methods
    
    private formatDateKey(date: Date): string {
        return format(date, 'yyyy-MM-dd');
    }
    
    private parseDateKey(key: string): Date | null {
        try {
            return parse(key, 'yyyy-MM-dd', new Date());
        } catch (e) {
            console.error('Failed to parse date key:', key, e);
            return null;
        }
    }
    
    private isSameDay(date1: Date, date2: Date): boolean {
        return this.formatDateKey(date1) === this.formatDateKey(date2);
    }
    
    private getFirstVisibleDate(month: Date): Date {
        const firstDay = startOfMonth(month);
        const firstDayOfWeek = getDay(firstDay);
        
        // If the first day is Sunday (0), we don't need to adjust
        if (firstDayOfWeek === 0) {
            return firstDay;
        }
        
        // Otherwise, go back to the previous Sunday
        return new Date(
            firstDay.getFullYear(),
            firstDay.getMonth(),
            firstDay.getDate() - firstDayOfWeek
        );
    }
    
    private getLastVisibleDate(month: Date): Date {
        const lastDay = endOfMonth(month);
        const lastDayOfWeek = getDay(lastDay);
        
        // If the last day is Saturday (6), we don't need to adjust
        if (lastDayOfWeek === 6) {
            return lastDay;
        }
        
        // Otherwise, go forward to the next Saturday
        return new Date(
            lastDay.getFullYear(),
            lastDay.getMonth(),
            lastDay.getDate() + (6 - lastDayOfWeek)
        );
    }
    
    private generateDayAriaLabel(day: Day): string {
        const dateStr = format(day.date, 'EEEE, MMMM d, yyyy');
        let label = dateStr;
        
        if (day.isToday) {
            label += ' (Today)';
        }
        
        if (day.isSelected) {
            label += ' (Selected)';
        }
        
        // Check for dream entries directly from the map to ensure accuracy
        const dateKey = this.formatDateKey(day.date);
        const entries = this.dreamEntries.get(dateKey) || [];
        
        if (entries.length > 0) {
            label += ` (${entries.length} dream ${entries.length === 1 ? 'entry' : 'entries'})`;
        } else {
            label += ' (No dream entries)';
        }
        
        return label;
    }
    
    private attachEventListeners(): void {
        // Subscribe to state changes
        this.state.subscribe(() => {
            this.loadEntriesForMonth(this.currentMonth);
        });
    }

    /**
     * Get the currently selected day
     * @returns The selected day date or null if no day is selected
     */
    public getSelectedDay(): Date | null {
        return this.selectedDay;
    }
} 
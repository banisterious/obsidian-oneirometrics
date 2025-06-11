import { App } from 'obsidian';
import { DreamMetricsState } from '../../state/DreamMetricsState';
import { DreamMetricData, DreamMetricsSettings } from '../../types/core';
import { DEFAULT_JOURNAL_STRUCTURE_SETTINGS } from '../../types/journal-check';
import { getSourceFile, getSourceId, isObjectSource } from '../../utils/type-guards';
import { MetricsDiscoveryService } from '../../metrics/MetricsDiscoveryService';
import { getComponentMetrics, getMetricThreshold } from '../../utils/settings-migration';
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

// Safely reference global logger without causing errors if it's not defined
// This approach avoids the ReferenceError when the plugin initializes
declare global {
    interface Window {
        globalLogger?: any;
    }
}

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
    private app: App;
    private settings: DreamMetricsSettings;
    private metricsDiscoveryService: MetricsDiscoveryService;
    
    // ✅ NEW: Track which cell should have focus for keyboard navigation
    private focusedDate: Date | null = null;
    
    constructor(container: HTMLElement, state: DreamMetricsState, app?: App, settings?: DreamMetricsSettings) {
        // Debug logging handled by proper logger initialization
        
        this.container = container;
        this.state = state;
        this.app = app;
        this.settings = settings || this.createDefaultSettings();
        this.currentMonth = new Date();
        
        // Initialize metrics discovery service
        if (this.app) {
            this.metricsDiscoveryService = new MetricsDiscoveryService(this.app, this.settings);
        }

        // Use proper logging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'Constructor called', { hasContainer: !!container, hasState: !!state, hasApp: !!app, hasSettings: !!settings });
            }
        } catch (e) {
            // Silent failure
        }
        
        try {
            // Debug logging handled by proper logger initialization
            
            this.initialize();
            
            // Debug logging handled by proper logger initialization
        } catch (error) {
            // Use proper logging for errors
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('DateNavigator', 'Constructor failed', error);
                }
            } catch (e) {
                // Silent failure
            }
            throw error;
        }
    }
    
    /**
     * Create default settings for backward compatibility when app/settings aren't provided
     */
    private createDefaultSettings(): DreamMetricsSettings {
        return {
            projectNote: '',
            metrics: {},
            selectedNotes: [],
            selectedFolder: '',
            selectionMode: 'notes' as const,
            calloutName: 'dream-metrics',
            journalCalloutName: 'journal',
            dreamDiaryCalloutName: 'dream-diary',
            dateHandling: { 
                placement: 'field' as const,
                fieldFormat: 'YYYY-MM-DD',
                includeBlockReferences: false
            },
            showRibbonButtons: false,
            backupEnabled: false,
            backupFolderPath: '',
            logging: { level: 'info' as const, maxSize: 1024000, maxBackups: 5 },
            journalStructure: DEFAULT_JOURNAL_STRUCTURE_SETTINGS,
            linting: DEFAULT_JOURNAL_STRUCTURE_SETTINGS
        };
    }
    
    private initialize(): void {
        // Use proper logging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'initialize() method called');
            }
        } catch (e) {
            // Silent failure
        }
        
        // Clear any existing content
        this.container.innerHTML = '';
        this.container.className = 'oom-date-navigator';
        
        // Use proper logging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'Container cleared and class added');
            }
        } catch (e) {
            // Silent failure
        }
        
        // Use proper logging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'About to create month header');
            }
        } catch (e) {
            // Silent failure
        }
        this.createMonthHeader();
        // Use proper logging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'Month header created');
            }
        } catch (e) {
            // Silent failure
        }
        
        // Add debug test button (for development)
        const debugButton = document.createElement('button');
        debugButton.textContent = 'Debug DateNavigator';
        debugButton.onclick = () => this.debugDisplay();
        debugButton.style.display = 'none'; // Hide by default
        this.container.appendChild(debugButton);
        
        // Use proper logging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'Added debug test button');
            }
        } catch (e) {
            // Silent failure
        }
        
        // Use proper logging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'About to create month grid');
            }
        } catch (e) {
            // Silent failure
        }
        this.createMonthGrid();
        // Use proper logging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'Month grid created');
            }
        } catch (e) {
            // Silent failure
        }
        
        this.attachEventListeners();
    }
    
    private createMonthHeader(): void {
        const headerContainer = this.container.createDiv('oom-month-header');
        
        // Left navigation button
        const prevButton = headerContainer.createEl('button', {
                            cls: 'oom-month-button oom-month-prev-button u-padding--sm',
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
                            cls: 'oom-month-button oom-month-next-button u-padding--sm',
            attr: {
                'aria-label': 'Next month',
                'title': 'Next month'
            }
        });
        nextButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
        
        // Today button
        const todayButton = headerContainer.createEl('button', {
                            cls: 'oom-month-button oom-today-button u-padding--sm',
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
        // Use proper logging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'createMonthGrid() called for month:', this.currentMonth);
            }
        } catch (e) {
            // Silent failure
        }
        
        const grid = document.createElement('div');
        grid.className = 'oom-month-grid';

        // Create weekday headers
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(day => {
            const header = document.createElement('div');
            header.className = 'oom-day-header';
            header.textContent = day;
            grid.appendChild(header);
        });

        // Generate calendar days
        const days = this.generateDaysForMonth(this.currentMonth);
        
        // Use proper logging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'Generated', days.length, 'days for calendar');
                window['globalLogger'].debug('DateNavigator', 'focusedDate is:', this.focusedDate);
                window['globalLogger'].debug('DateNavigator', 'Today is:', new Date().toDateString());
            }
        } catch (e) {
            // Silent failure
        }
        
        let focusableElementSet = false;
        const today = new Date();
        const todayKey = this.formatDateKey(today);
        const hasTodayInView = days.some(day => this.formatDateKey(day.date) === todayKey);
        
        days.forEach((day, index) => {
            // Use proper logging for complex logic
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', 'Processing day:', this.formatDateKey(day.date), {
                        isCurrentMonth: day.isCurrentMonth,
                        hasDreamEntry: day.hasDreamEntry,
                        isToday: day.isToday,
                        isSelected: day.isSelected,
                        entries: day.entries.length
                    });
                }
            } catch (e) {
                // Silent failure
            }
            
            const element = this.createDayCell(day);
            
            // Determine if this cell should have focus
            let shouldFocus = false;
            if (this.focusedDate && this.isSameDay(day.date, this.focusedDate)) {
                // Use proper logging
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', 'shouldFocus=true (matches focusedDate)');
                    }
                } catch (e) {
                    // Silent failure
                }
                shouldFocus = true;
            } else if (!this.focusedDate && day.isToday && day.isCurrentMonth) {
                // Use proper logging
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', 'shouldFocus=true (is today, no focusedDate)');
                    }
                } catch (e) {
                    // Silent failure
                }
                shouldFocus = true;
            } else if (!focusableElementSet && !hasTodayInView && index === 0) {
                // Use proper logging
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', 'shouldFocus=true (first cell, no today visible)');
                    }
                } catch (e) {
                    // Silent failure
                }
                shouldFocus = true;
            }
            
            if (shouldFocus && !focusableElementSet) {
                element.setAttribute('tabindex', '0');
                element.classList.add('oom-focusable-day');
                focusableElementSet = true;
                
                // Use proper logging
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', '✅ Setting tabindex="0" and oom-focusable-day class on date:', this.formatDateKey(day.date));
                    }
                } catch (e) {
                    // Silent failure
                }
            } else {
                element.setAttribute('tabindex', '-1');
            }
            
            // Store element reference
            this.dayElements.set(this.formatDateKey(day.date), element);
            
            grid.appendChild(element);
        });

        this.container.appendChild(grid);
    }
    
    /**
     * ✅ NEW: Add standard ARIA grid keyboard navigation to the calendar
     * Implements the roving tabindex pattern for accessibility
     */
    private addCalendarKeyboardNavigation(gridContainer: HTMLElement): void {
        // Add event delegation to the grid container for all day cell key events
        gridContainer.addEventListener('keydown', (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            
            // Only handle if the target is a day cell with tabindex="0" (currently focused cell)
            if (!target.hasAttribute('data-date') || target.getAttribute('tabindex') !== '0') {
                return;
            }
            
            const currentRow = parseInt(target.getAttribute('data-row') || '0');
            const currentCol = parseInt(target.getAttribute('data-col') || '0');
            
            let newRow = currentRow;
            let newCol = currentCol;
            let preventDefault = true;
            
            switch (event.key) {
                case 'ArrowUp':
                    newRow = Math.max(0, currentRow - 1);
                    break;
                case 'ArrowDown':
                    newRow = Math.min(5, currentRow + 1); // Max 6 rows in calendar grid
                    break;
                case 'ArrowLeft':
                    newCol = Math.max(0, currentCol - 1);
                    break;
                case 'ArrowRight':
                    newCol = Math.min(6, currentCol + 1); // Max 7 columns (Sunday-Saturday)
                    break;
                case 'Home':
                    newCol = 0; // Go to start of row (Sunday)
                    break;
                case 'End':
                    newCol = 6; // Go to end of row (Saturday)
                    break;
                case 'Enter':
                case ' ':
                    // Select the focused date
                    const dateStr = target.getAttribute('data-date');
                    if (dateStr) {
                        const date = this.parseDateKey(dateStr);
                        if (date) {
                            // ✅ NEW: Track focus when user selects with Enter/Space
                            this.focusedDate = date;
                            this.selectDay(date);
                        }
                    }
                    break;
                default:
                    preventDefault = false;
            }
            
            if (preventDefault) {
                event.preventDefault();
                
                // Find the new cell to focus
                const newCell = gridContainer.querySelector(
                    `[data-row="${newRow}"][data-col="${newCol}"]`
                ) as HTMLElement;
                
                if (newCell) {
                    // Update roving tabindex pattern
                    target.setAttribute('tabindex', '-1');
                    newCell.setAttribute('tabindex', '0');
                    newCell.focus();
                    
                    // ✅ NEW: Track the focused date
                    const newDateStr = newCell.getAttribute('data-date');
                    if (newDateStr) {
                        this.focusedDate = this.parseDateKey(newDateStr);
                    }
                    
                    // Announce to screen readers
                    this.announceCalendarNavigation(newCell);
                }
            }
        });
    }
    
    /**
     * ✅ NEW: Announce calendar navigation to screen readers
     */
    private announceCalendarNavigation(cell: HTMLElement): void {
        const dateStr = cell.getAttribute('data-date');
        if (!dateStr) return;
        
        const date = this.parseDateKey(dateStr);
        if (!date) return;
        
        const hasEntries = cell.hasClass('has-entries');
        const isToday = cell.hasClass('is-today');
        const isCurrentMonth = !cell.hasClass('other-month');
        
        // Build announcement
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const dateFormatted = date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: isCurrentMonth ? undefined : 'numeric' // Include year for other months
        });
        
        let announcement = `${dayName}, ${dateFormatted}`;
        
        if (isToday) {
            announcement += ', today';
        }
        
        if (hasEntries) {
            announcement += ', has dream entries';
        } else {
            announcement += ', no entries';
        }
        
        if (!isCurrentMonth) {
            announcement += ', previous or next month';
        }
        
        // Create live region announcement for screen readers
        this.announceToScreenReader(announcement);
    }
    
    /**
     * ✅ NEW: Helper method to announce messages to screen readers
     */
    private announceToScreenReader(message: string): void {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Clean up after announcement
        setTimeout(() => {
            if (announcement.parentNode) {
                document.body.removeChild(announcement);
            }
        }, 1000);
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
            
            // Debug log to verify entries are found - safely check for globalLogger
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Day ${dateKey} has ${entries.length} entries`);
                }
            } catch (e) {
                // Silent failure - logging should never break functionality
            }
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
                    starsHtml = '<span class="oom-star-high">★★★</span>';
                } else if (day.metrics.indicator === 'medium') {
                    starsHtml = '<span class="oom-star-medium">★★</span>';
                } else if (day.metrics.indicator === 'low') {
                    starsHtml = '<span class="oom-star-low">★</span>';
                }
                
                if (starsHtml) {
                    metricsEl.innerHTML = starsHtml;
                    
                    // Add tooltip with metric info
                    const metricName = day.metrics.key || 'entries';
                    const metricValue = day.metrics.value;
                    const metricLabel = metricName === 'entries' ? 'entries' : `${metricName}: ${metricValue}`;
                    metricsEl.setAttribute('title', `${day.metrics.count} dream ${metricLabel}`);
                    metricsEl.setAttribute('aria-label', `${day.metrics.count} dream ${metricLabel}`);
                    
                    // Add a CSS class based on the metric indicator
                    metricsEl.addClass(`oom-metric-${day.metrics.indicator}`);
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
        
        // Set ARIA label for accessibility (role and tabindex set by grid navigation)
        dayCell.setAttribute('aria-label', this.generateDayAriaLabel(day));
        
        // Click event for day selection
        dayCell.addEventListener('click', () => {
            // ✅ NEW: Track focus when user clicks on a day
            this.focusedDate = day.date;
            // Let the selectDayInternal method handle the assignment
            this.selectDayInternal(day);
        });
        
        // ✅ DEBUG: Add focus event listener to track if cells are receiving focus
        dayCell.addEventListener('focus', () => {
            // Use proper logging
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', 'Day cell received focus:', this.formatDateKey(day.date));
                }
            } catch (e) {
                // Silent failure
            }
            
            this.focusedDate = day.date;
            
            // Update roving tabindex
            this.dayElements.forEach((el, dateKey) => {
                if (dateKey === this.formatDateKey(day.date)) {
                    el.setAttribute('tabindex', '0');
                    el.classList.add('oom-focusable-day');
                } else {
                    el.setAttribute('tabindex', '-1');
                    el.classList.remove('oom-focusable-day');
                }
            });
        });
        
        // Note: Keyboard events (Enter/Space) are now handled by the grid-level navigation
        
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
        // Declare allEntries at the top level of the function
        let allEntries: DreamMetricData[] = [];
        
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Loading entries for month: ${format(month, 'MMMM yyyy')}`);
            }
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Loading entries for month: ${format(month, 'MMMM yyyy')}`);
                }
            } catch (e) {
                // Silent failure - logging should never break functionality
            }
            
            // Clear existing entries
            this.dreamEntries.clear();
            this.metrics.clear();
            
            // Get global window.dreamEntries first (highest priority)
            if (window['dreamEntries'] && Array.isArray(window['dreamEntries'])) {
                const windowEntries = window['dreamEntries'];
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `Found ${windowEntries.length} entries in window.dreamEntries`);
                        
                        // DIAGNOSTIC: Log sample entries to verify data format
                        if (windowEntries.length > 0) {
                            window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Sample entry data:', {
                                firstEntryDate: windowEntries[0].date,
                                firstEntryDateType: typeof windowEntries[0].date,
                                isValidDate: !isNaN(new Date(windowEntries[0].date).getTime()),
                                parsedDate: format(new Date(windowEntries[0].date), 'yyyy-MM-dd')
                            });
                        }
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
                
                // Filter entries for this month
                const monthStartStr = format(startOfMonth(month), 'yyyy-MM');
                const inMonthEntries = windowEntries.filter(entry => {
                    if (entry && typeof entry.date === 'string') {
                        return entry.date.startsWith(monthStartStr);
                    }
                    return false;
                });
                
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `${inMonthEntries.length} entries match current month ${monthStartStr}`);
                        
                        // DIAGNOSTIC: Log the exact matching and non-matching dates
                        if (windowEntries.length > 0) {
                            const matchingDates = inMonthEntries.map(e => e.date);
                            const nonMatchingDates = windowEntries
                                .filter(e => !e.date.startsWith(monthStartStr))
                                .map(e => e.date)
                                .slice(0, 5); // Just take the first 5 to avoid log bloat
                                
                            window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Date filtering:', {
                                matchingDates: matchingDates.slice(0, 5), // Sample of matching
                                nonMatchingDates,
                                monthStartStr,
                                currentMonth: format(month, 'yyyy-MM')
                            });
                        }
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
                
                if (inMonthEntries.length > 0) {
                    // Sample a few entries
                    try {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', 'Sample entries:');
                            inMonthEntries.slice(0, 3).forEach((entry, i) => {
                                window['globalLogger'].debug('DateNavigator', `Entry ${i+1}:`, entry);
                            });
                        }
                    } catch (e) {
                        // Silent failure - logging should never break functionality
                    }
                    
                    // Group by day
                    inMonthEntries.forEach(entry => {
                        try {
                            // Use the improved date parsing method
                            const entryDate = this.parseEntryDate(entry.date);
                            if (!entryDate) {
                                try {
                                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                        window['globalLogger'].warn('DateNavigator', `Failed to parse entry date: ${entry.date}`);
                                    }
                                } catch (e) {
                                    // Silent failure
                                }
                                return; // Skip this entry
                            }
                            const dateKey = this.formatDateKey(entryDate);
                            try {
                                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                    window['globalLogger'].debug('DateNavigator', `Processing entry for ${dateKey}`);
                                    
                                    // DIAGNOSTIC: Add detailed date parsing logging
                                    window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Date parsing:', {
                                        originalDate: entry.date,
                                        parsedDate: entryDate.toString(),
                                        isValid: !isNaN(entryDate.getTime()),
                                        dateKey,
                                        year: entryDate.getFullYear(),
                                        month: entryDate.getMonth() + 1,
                                        day: entryDate.getDate()
                                    });
                                }
                            } catch (e) {
                                // Silent failure - logging should never break functionality
                            }
                            
                            if (!this.dreamEntries.has(dateKey)) {
                                this.dreamEntries.set(dateKey, []);
                            }
                            this.dreamEntries.get(dateKey)?.push(entry);
                            
                            // Calculate metrics
                            this.calculateDayMetrics(dateKey, this.dreamEntries.get(dateKey) || []);
                        } catch (e) {
                            try {
                                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                    window['globalLogger'].error('DateNavigator', `Error processing entry date: ${entry.date}`, e);
                                }
                            } catch (err) {
                                // Silent failure - logging should never break functionality
                            }
                        }
                    });
                    
                    // Log how many dates now have entries
                    try {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Now have entries for ${this.dreamEntries.size} dates`);
                            
                            // DIAGNOSTIC: Log the actual map contents
                            const mapContents = {};
                            this.dreamEntries.forEach((entries, dateKey) => {
                                window['globalLogger'].debug('DateNavigator', `Date ${dateKey}: ${entries.length} entries`);
                                mapContents[dateKey] = entries.length;
                            });
                            
                            window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Dream entries map:', mapContents);
                        }
                    } catch (e) {
                        // Silent failure - logging should never break functionality
                    }
                    
                    // Update UI
                    this.updateMonthGrid();
                    return;
                }
            } else {
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', 'No window.dreamEntries found');
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
            }
            
            // The rest of the method remains the same...
            // PRIORITY 1: Try to get entries from tables directly via window object
            try {
                if (window['oneiroMetricsPlugin']) {
                    // Use safer approach to access data - check if plugin exports table data
                    const plugin = window['oneiroMetricsPlugin'] as any;
                    let tableEntries: DreamMetricData[] = [];
                    
                    // Try different possible paths to get data
                    if (plugin.getTableData && typeof plugin.getTableData === 'function') {
                        // Preferred API method if available
                        tableEntries = plugin.getTableData();
                    } else if (plugin.state && plugin.state.entries && Array.isArray(plugin.state.entries)) {
                        // Fallback to state.entries
                        tableEntries = plugin.state.entries;
                    } else if (plugin.memoizedTableData && plugin.memoizedTableData.size > 0) {
                        // Last resort - try to access memoizedTableData directly
                        const tableData = plugin.memoizedTableData;
                        
                        tableData.forEach((data, key) => {
                            if (Array.isArray(data) && data.length > 0) {
                                // Each row is a potential dream entry
                                data.forEach(row => {
                                    if (row && row.date) {
                                        const entry: DreamMetricData = {
                                            date: row.date,
                                            title: row.title || 'Dream Entry',
                                            content: row.content || '',
                                            source: 'table-data',
                                            metrics: row.metrics || {}
                                        };
                                        tableEntries.push(entry);
                                    }
                                });
                            }
                        });
                    }
                    
                    if (tableEntries.length > 0) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Found ${tableEntries.length} entries from table data`);
                        }
                        allEntries = tableEntries;
                        this.processEntriesToDisplay(allEntries, month);
                        return; // Use these entries directly
                    }
                }
            } catch (err) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('DateNavigator', "Error getting entries from tables:", err);
                }
            }
            
            // PRIORITY 2: Get entries from state.getDreamEntries()
            try {
                if (this.state && typeof this.state.getDreamEntries === 'function') {
                    const stateEntries = this.state.getDreamEntries() || [];
                    if (stateEntries.length > 0) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Loaded ${stateEntries.length} entries from state.getDreamEntries()`);
                        }
                        allEntries = stateEntries;
                        this.processEntriesToDisplay(allEntries, month);
                        return; // Use these entries directly
                    }
                } else {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].warn('DateNavigator', "state.getDreamEntries is not a function!");
                    }
                }
            } catch (err) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('DateNavigator', "Error getting entries from state:", err);
                }
            }
            
            // PRIORITY 3: Try to get entries from the global plugin object
            try {
                if (window['oneiroMetricsPlugin'] && window['oneiroMetricsPlugin'].state) {
                    const pluginState = window['oneiroMetricsPlugin'].state;
                    if (typeof pluginState.getDreamEntries === 'function') {
                        const pluginEntries = pluginState.getDreamEntries() || [];
                        if (pluginEntries.length > 0) {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].debug('DateNavigator', `Found ${pluginEntries.length} entries from global plugin state`);
                            }
                            allEntries = pluginEntries;
                            this.processEntriesToDisplay(allEntries, month);
                            return; // Use these entries directly
                        }
                    }
                }
            } catch (err) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('DateNavigator', "Error getting entries from global plugin:", err);
                }
            }
            
            // Additional debug to inspect state object
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `State object inspection:`, {
                        stateType: typeof this.state,
                        stateConstructor: this.state ? this.state.constructor.name : 'null',
                        hasDreamEntries: this.state && typeof this.state.getDreamEntries === 'function',
                        entriesCount: allEntries ? allEntries.length : 0
                    });
                    
                    // Log entry sources if any entries exist in other parts of the app
                    if (this.state && typeof this.state.getDreamEntries === 'function') {
                        // Try to access any other entry-related methods
                        const stateObj = this.state as any; // Type cast to any to avoid TypeScript errors
                        if (typeof stateObj.getAllEntries === 'function') {
                            const allPossibleEntries = stateObj.getAllEntries();
                            window['globalLogger'].debug('DateNavigator', `getAllEntries() found ${allPossibleEntries.length} entries`);
                            if (allPossibleEntries.length > 0) {
                                window['globalLogger'].debug('DateNavigator', `Sample entry from getAllEntries():`, allPossibleEntries[0]);
                                // Use these entries if nothing else was found
                                if (allEntries.length === 0) {
                                    allEntries = allPossibleEntries;
                                    this.processEntriesToDisplay(allEntries, month);
                                    return; // Use these entries directly
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('DateNavigator', "Error during state inspection:", e);
                }
                // Silent failure - logging should never break functionality
            }
        } catch (e) {
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('DateNavigator', "Error during entry loading:", e);
                }
            } catch (error) {
                // Silent failure - logging should never break functionality
            }
            // Continue execution - logging should never break functionality
        }
        
        // Add additional debug information - using proper logging system
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Loading entries for ${format(month, 'MMMM yyyy')}, found ${allEntries.length} total entries`);
                
                if (allEntries.length > 0) {
                    window['globalLogger'].debug('DateNavigator', 'First entry sample:', allEntries[0]);
                    
                    // Check if metrics exist in any entries
                    let entriesWithMetrics = 0;
                    let totalMetricProperties = 0;
                    let totalNumericMetrics = 0;
                    
                    allEntries.forEach(entry => {
                        if (entry.metrics && Object.keys(entry.metrics).length > 0) {
                            entriesWithMetrics++;
                            const metricKeys = Object.keys(entry.metrics);
                            totalMetricProperties += metricKeys.length;
                            
                            // Count numeric metrics
                            metricKeys.forEach(key => {
                                if (typeof entry.metrics[key] === 'number') {
                                    totalNumericMetrics++;
                                }
                            });
                        }
                    });
                    
                    window['globalLogger'].debug('DateNavigator', `Metrics summary: ${entriesWithMetrics}/${allEntries.length} entries have metrics`);
                    window['globalLogger'].debug('DateNavigator', `Found ${totalMetricProperties} total metric properties (${totalNumericMetrics} numeric)`);
                    
                    if (entriesWithMetrics === 0) {
                        window['globalLogger'].warn('DateNavigator', `No entries have metrics! This is why no stars are showing.`);
                    }
                } else {
                    window['globalLogger'].warn('DateNavigator', `No entries found - stars and dots won't appear!`);
                    
                    // EMERGENCY RECOVERY: Try finding entries in the global plugin
                    if (window['oneiroMetricsPlugin']) {
                        window['globalLogger'].debug('DateNavigator', `Trying emergency recovery from global plugin`);
                        
                        const globalPlugin = window['oneiroMetricsPlugin'] as any;
                        if (globalPlugin.state && typeof globalPlugin.state.getDreamEntries === 'function') {
                            const globalEntries = globalPlugin.state.getDreamEntries();
                            if (globalEntries && globalEntries.length > 0) {
                                window['globalLogger'].debug('DateNavigator', `Found ${globalEntries.length} entries in global plugin!`);
                                allEntries = globalEntries;
                            }
                        }
                    }
                    
                    // Emergency fallback - force some entries for testing
                    if (this.state) {
                        const stateObj = this.state as any; // Type cast to any to avoid TypeScript errors
                        if (stateObj.entries && Array.isArray(stateObj.entries) && stateObj.entries.length > 0) {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].debug('DateNavigator', `However, state.entries has ${stateObj.entries.length} entries directly!`);
                                window['globalLogger'].debug('DateNavigator', `First direct entry:`, stateObj.entries[0]);
                            }
                            
                            // Try to use these entries directly
                            const directEntries = stateObj.entries;
                            if (directEntries.length > 0) {
                                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                    window['globalLogger'].debug('DateNavigator', `Using ${directEntries.length} entries directly from state.entries`);
                                }
                                this.processEntriesToDisplay(directEntries, month);
                                return;  // Skip normal processing since we're using direct entries
                            }
                        }
                    }
                    
                    // FALLBACK: Try to synthesize test entries for the current month
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `Attempting to create test entries as last resort`);
                    }
                    const testEntries = this.createTestEntriesForMonth(month);
                    if (testEntries.length > 0) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Created ${testEntries.length} test entries for visual debugging`);
                        }
                        this.processEntriesToDisplay(testEntries, month);
                        return; // Skip normal processing
                    }
                }
            }
        } catch (e) {
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('DateNavigator', "Error during entry analysis:", e);
                }
            } catch (error) {
                // Silent failure - logging should never break functionality
            }
        }
        
        // Filter entries for the visible month range (including partial weeks)
        const startDate = startOfDay(this.getFirstVisibleDate(month));
        const endDate = endOfDay(this.getLastVisibleDate(month));
        
        // Safely log date range
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Visible date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
            }
        } catch (e) {
            // Silent failure - logging should never break functionality
        }
        
        // Process entries for display
        this.processEntriesToDisplay(allEntries, month);
    }
    
    // New helper method to process entries for display
    private processEntriesToDisplay(entries: DreamMetricData[], month: Date): void {
        // Filter entries for the visible month range (including partial weeks)
        const startDate = startOfDay(this.getFirstVisibleDate(month));
        const endDate = endOfDay(this.getLastVisibleDate(month));
        
        // Group entries by date
        let entriesInRange = 0;
        entries.forEach(entry => {
            // Ensure we have a valid date string
            if (!entry.date || typeof entry.date !== 'string') {
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].warn('DateNavigator', 'Entry missing date or invalid date format', entry);
                    }
                } catch (e) {
                    // Silent failure
                }
                return;
            }
            
            // Parse the entry date using improved method
            try {
                const entryDate = this.parseEntryDate(entry.date);
                if (!entryDate) {
                    try {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].warn('DateNavigator', `Failed to parse entry date: ${entry.date}`);
                        }
                    } catch (e) {
                        // Silent failure
                    }
                    return; // Skip this entry
                }
                
                // Check if the entry falls within the visible month range
                if (isWithinInterval(entryDate, { start: startDate, end: endDate })) {
                    entriesInRange++;
                    const dateKey = this.formatDateKey(entryDate);
                    
                    // DIAGNOSTIC: Log this successful match
                    try {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `MATCH: Entry date ${entry.date} parsed to ${format(entryDate, 'yyyy-MM-dd')} is in visible range`);
                        }
                    } catch (e) {
                        // Silent failure
                    }
                    
                    // Add to dream entries map
                    if (!this.dreamEntries.has(dateKey)) {
                        this.dreamEntries.set(dateKey, []);
                    }
                    this.dreamEntries.get(dateKey)?.push(entry);
                    
                    // Calculate metrics for the day
                    this.calculateDayMetrics(dateKey, this.dreamEntries.get(dateKey) || []);
                } else {
                    // DIAGNOSTIC: Log when entries are outside the visible range
                    try {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Entry date ${entry.date} parsed to ${format(entryDate, 'yyyy-MM-dd')} is OUTSIDE visible range (${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')})`);
                        }
                    } catch (e) {
                        // Silent failure
                    }
                }
            } catch (e) {
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].error('DateNavigator', `Error processing entry date: ${entry.date}`, e);
                    }
                } catch (error) {
                    // Silent failure
                }
            }
        });
        
        // Add more detailed debugging about what was loaded
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `After filtering: ${entriesInRange} entries within date range`);
                window['globalLogger'].debug('DateNavigator', `Dream entries map now has ${this.dreamEntries.size} date keys`);
                
                // DIAGNOSTIC: Log the actual map entries for visibility
                if (this.dreamEntries.size > 0) {
                    const entriesByDate = {};
                    this.dreamEntries.forEach((entriesForDate, dateKey) => {
                        entriesByDate[dateKey] = entriesForDate.length;
                    });
                    window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Final entries map:', entriesByDate);
                }
            }
        } catch (e) {
            // Silent failure - logging should never break functionality
        }
        
        // Update the UI with the loaded entries
        this.updateMonthGrid();
    }
    
    private calculateDayMetrics(dateKey: string, entries: DreamMetricData[]): void {
        // Use proper logging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Calculating metrics for day ${dateKey} with ${entries.length} entries`);
            }
        } catch (e) {
            // Silent failure
        }
        
        if (entries.length === 0) {
            this.metrics.set(dateKey, {
                count: 0,
                key: '',
                value: 0,
                indicator: 'none'
            });
            
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `No entries for ${dateKey}, setting indicator to 'none'`);
                }
            } catch (e) {
                // Silent failure
            }
            
            return;
        }
        
        // Phase 2 Enhancement: Use unified metrics configuration
        let indicator: 'high' | 'medium' | 'low' | 'none' = 'none';
        let value = 0;
        let metricKey = 'entries';
        
        // Check if we have unified metrics configuration
        if (this.settings?.unifiedMetrics && this.metricsDiscoveryService) {
            try {
                // Get calendar-specific metrics from unified configuration
                const calendarMetrics = getComponentMetrics(this.settings, 'calendar');
                const thresholds = this.settings.unifiedMetrics.visualizationThresholds;
                
                if (calendarMetrics.length > 0 && thresholds) {
                    try {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Using ${calendarMetrics.length} configured calendar metrics:`, calendarMetrics.map(m => m.name));
                        }
                    } catch (e) {
                        // Silent failure
                    }
                    
                    let totalScore = 0;
                    let metricCount = 0;
                    let bestMetricName = '';
                    let bestMetricScore = 0;
                    
                    // Process each entry for the day
                    entries.forEach(entry => {
                        if (entry.metrics) {
                            // Calculate score only for configured calendar metrics
                            calendarMetrics.forEach(metric => {
                                const metricValue = entry.metrics[metric.name];
                                if (typeof metricValue === 'number') {
                                    // Normalize to 0-1 range using metric's min/max
                                    const normalized = (metricValue - metric.minValue) / (metric.maxValue - metric.minValue);
                                    const clampedNormalized = Math.max(0, Math.min(1, normalized));
                                    
                                    totalScore += clampedNormalized;
                                    metricCount++;
                                    
                                    // Track the best individual metric for display
                                    if (clampedNormalized > bestMetricScore) {
                                        bestMetricScore = clampedNormalized;
                                        bestMetricName = metric.name;
                                    }
                                    
                                    try {
                                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                            window['globalLogger'].debug('DateNavigator', `Metric ${metric.name}: ${metricValue} -> normalized ${clampedNormalized.toFixed(2)}`);
                                        }
                                    } catch (e) {
                                        // Silent failure
                                    }
                                }
                            });
                        }
                    });
                    
                    // Calculate average quality score
                    if (metricCount > 0) {
                        const avgQuality = totalScore / metricCount;
                        
                        // Apply configurable thresholds
                        const qualityLevel = getMetricThreshold(avgQuality, 0, 1, thresholds);
                        
                        // Map quality level to indicator
                        indicator = qualityLevel;
                        value = avgQuality;
                        metricKey = bestMetricName || 'average';
                        
                        try {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].debug('DateNavigator', `Calendar metrics result: avgQuality=${avgQuality.toFixed(2)}, level=${qualityLevel}, bestMetric=${bestMetricName}`);
                            }
                        } catch (e) {
                            // Silent failure
                        }
                    } else {
                        // No metrics found, fall back to entry count
                        indicator = entries.length >= 2 ? 'medium' : 'low';
                        value = entries.length;
                        metricKey = 'entries';
                        
                        try {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].debug('DateNavigator', `No calendar metrics found, using entry count: ${entries.length} entries -> ${indicator}`);
                            }
                        } catch (e) {
                            // Silent failure
                        }
                    }
                } else {
                    // No calendar metrics configured, fall back to entry count
                    indicator = entries.length >= 2 ? 'medium' : 'low';
                    value = entries.length;
                    metricKey = 'entries';
                    
                    try {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `No calendar metrics configured, using entry count fallback: ${entries.length} entries -> ${indicator}`);
                        }
                    } catch (e) {
                        // Silent failure
                    }
                }
            } catch (error) {
                // Error in unified metrics processing, fall back to legacy logic
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].warn('DateNavigator', 'Error processing unified metrics, falling back to legacy logic:', error);
                    }
                } catch (e) {
                    // Silent failure
                }
                
                // Legacy fallback: use entry count
                indicator = entries.length >= 2 ? 'medium' : 'low';
                value = entries.length;
                metricKey = 'entries';
            }
        } else {
            // Legacy fallback: No unified metrics configuration, use entry count
            if (entries.length >= 3) {
                indicator = 'high';
                value = entries.length;
            } else if (entries.length === 2) {
                indicator = 'medium';
                value = entries.length;
            } else if (entries.length === 1) {
                indicator = 'low';
                value = entries.length;
            }
            
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Using legacy entry count logic: ${entries.length} entries -> ${indicator}`);
                }
            } catch (e) {
                // Silent failure
            }
        }
        
        // Ensure the indicator is not 'none' if we have entries
        if (indicator === 'none' && entries.length > 0) {
            indicator = 'low';
            value = entries.length;
            
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Forcing indicator to 'low' because we have ${entries.length} entries but no metrics`);
                }
            } catch (e) {
                // Silent failure
            }
        }
        
        // Final log for the calculated metrics
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Final metrics for ${dateKey}: ${entries.length} entries, indicator: ${indicator}, value: ${value.toFixed(2)}, key: ${metricKey}`);
            }
        } catch (e) {
            // Silent failure
        }
        
        this.metrics.set(dateKey, {
            count: entries.length,
            key: metricKey,
            value: value,
            indicator: indicator
        });
    }
    
    /**
     * Normalize a metric value to a 0-10 scale
     * This helps handle metrics that might use different scales (like 1-5)
     */
    private normalizeMetricValue(value: number): number {
        // If value appears to be on a 0-10 or 1-10 scale, use it directly
        if (value >= 0 && value <= 10) {
            return value;
        }
        
        // If value appears to be on a 1-5 scale, convert to 0-10
        if (value >= 1 && value <= 5) {
            return ((value - 1) / 4) * 10;
        }
        
        // If value is a percentage (0-100), convert to 0-10
        if (value >= 0 && value <= 100) {
            return value / 10;
        }
        
        // Default case: return as is but cap at 10
        return Math.min(value, 10);
    }
    
    public updateMonthGrid(): void {
        // Update the month title
        const monthTitle = this.container.querySelector('.oom-month-title');
        if (monthTitle) {
            monthTitle.textContent = format(this.currentMonth, 'MMMM yyyy');
        }
        
        // Use proper logging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'Updating month grid');
                window['globalLogger'].debug('DateNavigator', `Currently have ${this.dreamEntries.size} dates with entries`);
                window['globalLogger'].debug('DateNavigator', `Currently have ${this.metrics.size} dates with metrics`);
                
                // DIAGNOSTIC: Log all the date keys in dreamEntries map
                if (this.dreamEntries.size > 0) {
                    const allDateKeys = Array.from(this.dreamEntries.keys());
                    window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - All date keys in map:', allDateKeys);
                    
                    // Also check if any dates match the visible range
                    const daysInView = this.generateDaysForMonth(this.currentMonth);
                    const visibleDateKeys = daysInView.map(day => this.formatDateKey(day.date));
                    const matchingDates = allDateKeys.filter(key => visibleDateKeys.includes(key));
                    
                    window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Matching dates in view:', {
                        totalDatesInMap: allDateKeys.length,
                        totalDaysInView: visibleDateKeys.length,
                        matchingDates,
                        matchingCount: matchingDates.length
                    });
                }
            }
        } catch (e) {
            // Silent failure
        }
        
        // Enhanced debugging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Updating month grid for ${format(this.currentMonth, 'MMMM yyyy')}`);
                window['globalLogger'].debug('DateNavigator', `Have entries for ${this.dreamEntries.size} dates`);
                window['globalLogger'].debug('DateNavigator', `Have metrics for ${this.metrics.size} dates`);
            }
        } catch (e) {
            // Silent failure - logging should never break functionality
        }
        
        // Log all dates with entries for debugging
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                if (this.dreamEntries.size > 0) {
                    window['globalLogger'].debug('DateNavigator', 'Dates with entries:');
                    this.dreamEntries.forEach((entries, dateKey) => {
                        window['globalLogger'].debug('DateNavigator', `- ${dateKey}: ${entries.length} entries`);
                    });
                } else {
                    window['globalLogger'].warn('DateNavigator', 'WARNING: No dates have entries! Calendar will be empty.');
                }
            }
        } catch (e) {
            // Silent failure - logging should never break functionality
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
                
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `Updating day ${dateKey} with ${entries.length} entries, indicator: ${metrics.indicator}`);
                        
                        // DIAGNOSTIC: More detailed logging about day cells
                        if (entries.length > 0 || isToday(date)) {
                            window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Day cell details:', {
                                dateKey,
                                entriesCount: entries.length,
                                isToday: isToday(date),
                                isCurrentMonth: isSameMonth(date, this.currentMonth),
                                isSelected: this.selectedDay ? this.isSameDay(date, this.selectedDay) : false,
                                hasDreamEntry: entries.length > 0
                            });
                        }
                    }
                } catch (e) {
                    // Silent failure
                }
                
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
        
        // Get entries for this day
        const dateKey = this.formatDateKey(day.date);
        const entries = this.dreamEntries.get(dateKey) || [];
        const hasEntries = entries.length > 0;
        
        // Enhanced debugging for key dates (today or entries)
        if (day.isToday || hasEntries) {
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Rendering day ${dateKey}:`);
                    window['globalLogger'].debug('DateNavigator', `- isToday: ${day.isToday}`);
                    window['globalLogger'].debug('DateNavigator', `- isCurrentMonth: ${day.isCurrentMonth}`);
                    window['globalLogger'].debug('DateNavigator', `- hasEntries: ${hasEntries}`);
                    window['globalLogger'].debug('DateNavigator', `- entriesCount: ${entries.length}`);
                    
                    // DIAGNOSTIC: Track important properties that affect rendering
                    window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Cell rendering:', {
                        dateKey,
                        dayObject: {
                            hasDreamEntry: day.hasDreamEntry,
                            entriesCount: day.entries.length,
                            metricsIndicator: day.metrics.indicator,
                            isCurrentMonth: day.isCurrentMonth,
                            isSelected: day.isSelected,
                            isToday: day.isToday
                        },
                        element: {
                            classNames: element.className,
                            hasHasEntriesClass: element.classList.contains('has-entries'),
                            childCount: element.childElementCount
                        }
                    });
                    
                    if (hasEntries) {
                        window['globalLogger'].debug('DateNavigator', `- First entry sample:`, entries[0]);
                        window['globalLogger'].debug('DateNavigator', `- Metrics:`, day.metrics);
                    }
                }
            } catch (e) {
                // Silent failure - logging should never break functionality
            }
        }
        
        // Add has-entries class if we have entries
        if (hasEntries) {
            element.addClass('has-entries');
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Adding 'has-entries' class to ${dateKey}`);
                }
            } catch (e) {
                // Silent failure - logging should never break functionality
            }
            
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Day ${dateKey} has ${entries.length} entries, adding 'has-entries' class`);
                }
            } catch (e) {
                // Silent failure
            }
        } else {
            if (day.isToday) {
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `Today (${dateKey}) has NO entries - this is unusual if we ran the debug function`);
                        
                        // DIAGNOSTIC: Double-check the dreamEntries map for today
                        window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Today entry check:', {
                            dateKey,
                            hasKeyInMap: this.dreamEntries.has(dateKey),
                            mapContainsHowManyKeys: this.dreamEntries.size,
                            keysInMap: Array.from(this.dreamEntries.keys()),
                            formattedToday: format(new Date(), 'yyyy-MM-dd')
                        });
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
            }
            
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Day ${dateKey} has no entries`);
                }
            } catch (e) {
                // Silent failure
            }
        }
        
        // Update indicators
        const indicators = element.querySelector('.oom-dream-indicators');
        if (indicators) {
            indicators.remove();
        }
        
        if (hasEntries) {
            // Create new indicator container
            const newIndicators = element.createDiv('oom-dream-indicators');
            const entryCount = Math.min(entries.length, 5); // Limit to 5 dots
            
            // Enhanced debugging for indicators
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Creating indicators for ${dateKey}`);
                    window['globalLogger'].debug('DateNavigator', `- Creating ${entryCount} dots`);
                    
                    // DIAGNOSTIC: Track the indicators creation process
                    window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Creating indicators:', {
                        dateKey,
                        entryCount,
                        entriesLength: entries.length,
                        limitedTo5: entryCount < entries.length,
                        indicatorElement: newIndicators ? 'created' : 'failed',
                        parentHasClass: element.classList.contains('has-entries')
                    });
                }
            } catch (e) {
                // Silent failure - logging should never break functionality
            }
            
            // Use proper logging
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Creating ${entryCount} dots for day ${dateKey}`);
                }
            } catch (e) {
                // Silent failure
            }
            
            // Create the actual dot elements
            for (let i = 0; i < entryCount; i++) {
                const dot = newIndicators.createDiv('oom-dream-dot');
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `- Created dot ${i+1}/${entryCount}`);
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
            }
            
            // Verify indicators were added to DOM
            const dotsAfter = newIndicators.querySelectorAll('.oom-dream-dot');
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `- Verified ${dotsAfter.length}/${entryCount} dots created`);
                    
                    // Debug the structure
                    window['globalLogger'].debug('DateNavigator', 'DOM structure check:');
                    window['globalLogger'].debug('DateNavigator', `- Cell has indicators container: ${!!element.querySelector('.oom-dream-indicators')}`);
                    window['globalLogger'].debug('DateNavigator', `- Indicators container has dots: ${!!element.querySelector('.oom-dream-indicators .oom-dream-dot')}`);
                    
                    // DIAGNOSTIC: Check if dots are actually visible in DOM
                    window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Dot visibility check:', {
                        dateKey,
                        dotsCreated: dotsAfter.length,
                        dotContainerExists: !!element.querySelector('.oom-dream-indicators'),
                        dotsExist: !!element.querySelector('.oom-dream-indicators .oom-dream-dot'),
                        containerChildCount: element.querySelector('.oom-dream-indicators')?.childElementCount || 0,
                        dotClassNames: Array.from(dotsAfter).map(dot => dot.className)
                    });
                }
            } catch (e) {
                // Silent failure - logging should never break functionality
            }
        }
        
        // Update metrics
        const metricsEl = element.querySelector('.oom-day-metrics');
        if (metricsEl) {
            metricsEl.remove();
        }
        
        // Add metrics if we have entries
        if (hasEntries) {
            // Create metrics container
            const newMetricsEl = element.createDiv('oom-day-metrics');
            
            // Enhanced debugging for metrics
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Creating metrics for ${dateKey}`);
                    
                    // DIAGNOSTIC: Track metrics creation
                    window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Creating metrics element:', {
                        dateKey,
                        metricsIndicator: day.metrics.indicator,
                        metricsValue: day.metrics.value,
                        metricsCount: day.metrics.count,
                        metricsKey: day.metrics.key,
                        metricsElementCreated: !!newMetricsEl
                    });
                }
            } catch (e) {
                // Silent failure - logging should never break functionality
            }
            
            // Get metrics or use default
            const metrics = this.metrics.get(dateKey) || {
                count: entries.length,
                key: 'entries',
                value: entries.length,
                indicator: entries.length >= 3 ? 'high' : entries.length == 2 ? 'medium' : 'low'
            };
            
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `- Metrics:`, metrics);
                    window['globalLogger'].debug('DateNavigator', `- Indicator: ${metrics.indicator}`);
                }
            } catch (e) {
                // Silent failure - logging should never break functionality
            }
            
            let starsHtml = '';
            if (metrics.indicator === 'high') {
                starsHtml = '<span class="oom-star-high">★★★</span>';
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `- Using high stars (★★★)`);
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
            } else if (metrics.indicator === 'medium') {
                starsHtml = '<span class="oom-star-medium">★★</span>';
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `- Using medium stars (★★)`);
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
            } else if (metrics.indicator === 'low') {
                starsHtml = '<span class="oom-star-low">★</span>';
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `- Using low stars (★)`);
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
            } else {
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `- WARNING: No indicator level set, this day won't have stars`);
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
            }
            
            if (starsHtml) {
                // Add stars to the metrics element
                newMetricsEl.innerHTML = starsHtml;
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `- Added stars HTML: ${starsHtml}`);
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
                
                // Add tooltip with metric info
                const metricName = metrics.key || 'entries';
                const metricValue = metrics.value;
                const metricLabel = metricName === 'entries' ? 'entries' : `${metricName}: ${metricValue}`;
                newMetricsEl.setAttribute('title', `${metrics.count} dream ${metricLabel}`);
                newMetricsEl.setAttribute('aria-label', `${metrics.count} dream ${metricLabel}`);
                
                // Add a CSS class based on the metric indicator
                newMetricsEl.addClass(`oom-metric-${metrics.indicator}`);
                
                // Verify metrics were added to DOM
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', 'DOM metrics check:');
                        window['globalLogger'].debug('DateNavigator', `- Cell has metrics container: ${!!element.querySelector('.oom-day-metrics')}`);
                        window['globalLogger'].debug('DateNavigator', `- Metrics HTML content: "${element.querySelector('.oom-day-metrics')?.innerHTML || 'EMPTY'}"`);
                        
                        // DIAGNOSTIC: Check if stars are actually visible in DOM
                        window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Stars visibility check:', {
                            dateKey,
                            starsHtml,
                            metricsContainerExists: !!element.querySelector('.oom-day-metrics'),
                            metricsHtml: element.querySelector('.oom-day-metrics')?.innerHTML || 'EMPTY',
                            hasProperClass: element.querySelector('.oom-day-metrics')?.classList.contains(`oom-metric-${metrics.indicator}`) || false,
                            parentHasHasEntriesClass: element.classList.contains('has-entries')
                        });
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
            } else {
                try {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `- No stars added because starsHtml is empty`);
                    }
                } catch (e) {
                    // Silent failure - logging should never break functionality
                }
            }
        }
        
        // Update preview
        const preview = element.querySelector('.oom-day-preview');
        if (preview) {
            preview.remove();
        }
        
        if (hasEntries) {
            const newPreview = element.createDiv('oom-day-preview');
            
            if (entries.length > 0) {
                const firstEntry = entries[0];
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
        
        // DIAGNOSTIC: Final check of the DOM after all updates
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                if (day.isToday || hasEntries) {
                    window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Final cell state:', {
                        dateKey,
                        hasEntries,
                        classList: element.className,
                        hasHasEntriesClass: element.classList.contains('has-entries'),
                        hasDots: !!element.querySelector('.oom-dream-indicators'),
                        dotCount: element.querySelectorAll('.oom-dream-indicators .oom-dream-dot').length,
                        hasStars: !!element.querySelector('.oom-day-metrics'),
                        starsHtml: element.querySelector('.oom-day-metrics')?.innerHTML || 'NONE',
                        childElementCount: element.childElementCount,
                        childrenTypes: Array.from(element.children).map(child => child.className)
                    });
                }
            }
        } catch (e) {
            // Silent failure - logging should never break functionality
        }
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
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('DateNavigator', `Failed to parse date key: ${key}`, e);
                }
            } catch (error) {
                // Silent failure - logging should never break functionality
            }
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

    /**
     * Set dream entries directly from external source
     * This is useful when the state doesn't have entries but we found them elsewhere
     * @param entries The entries to use
     */
    public setDreamEntries(entries: DreamMetricData[]): void {
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Setting ${entries.length} entries directly`);
            }
        } catch (e) {
            // Silent failure
        }
        
        // Store the entries for future use
        if (this.state && typeof this.state.updateDreamEntries === 'function') {
            this.state.updateDreamEntries(entries);
        }
        
        // Process the entries immediately
        const month = this.currentMonth;
        
        // Clear existing entries
        this.dreamEntries.clear();
        this.metrics.clear();
        
        // Filter entries for the visible month range (including partial weeks)
        const startDate = startOfDay(this.getFirstVisibleDate(month));
        const endDate = endOfDay(this.getLastVisibleDate(month));
        
        // Group entries by date
        let entriesInRange = 0;
        entries.forEach(entry => {
            // Ensure we have a valid date string
            if (!entry.date || typeof entry.date !== 'string') {
                return;
            }
            
            // Parse the entry date using improved method
            try {
                const entryDate = this.parseEntryDate(entry.date);
                if (!entryDate) {
                    try {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].warn('DateNavigator', `Failed to parse entry date: ${entry.date}`);
                        }
                    } catch (e) {
                        // Silent failure
                    }
                    return; // Skip this entry
                }
                
                // Check if the entry falls within the visible month range
                if (isWithinInterval(entryDate, { start: startDate, end: endDate })) {
                    entriesInRange++;
                    const dateKey = this.formatDateKey(entryDate);
                    
                    // DIAGNOSTIC: Log this successful match
                    try {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `MATCH: Entry date ${entry.date} parsed to ${format(entryDate, 'yyyy-MM-dd')} is in visible range`);
                        }
                    } catch (e) {
                        // Silent failure
                    }
                    
                    // Add to dream entries map
                    if (!this.dreamEntries.has(dateKey)) {
                        this.dreamEntries.set(dateKey, []);
                    }
                    this.dreamEntries.get(dateKey)?.push(entry);
                    
                    // Calculate metrics for the day
                    this.calculateDayMetrics(dateKey, this.dreamEntries.get(dateKey) || []);
                }
            } catch (e) {
                // Ignore errors for invalid dates
            }
        });
        
        // Update the UI with the loaded entries
        this.updateMonthGrid();
    }

    /**
     * Creates test entries for the specified month for debugging purposes
     * This is only used when no real entries can be found from any source
     */
    private createTestEntriesForMonth(month: Date): DreamMetricData[] {
        const entries: DreamMetricData[] = [];
        const year = month.getFullYear();
        const monthNum = month.getMonth();
        const daysInMonth = getDaysInMonth(month);
        
        // Create sample entries - about 10 randomly distributed through the month
        const numEntries = Math.min(10, daysInMonth);
        const usedDays = new Set<number>();
        
        for (let i = 0; i < numEntries; i++) {
            // Pick a random day in the month that hasn't been used yet
            let day;
            do {
                day = Math.floor(Math.random() * daysInMonth) + 1;
            } while (usedDays.has(day));
            
            usedDays.add(day);
            
            // Create an entry for this day
            const entryDate = new Date(year, monthNum, day);
            const dateStr = format(entryDate, 'yyyy-MM-dd');
            
            // Create a test entry with some random metrics
            entries.push({
                date: dateStr,
                title: `Test Dream Entry ${i+1}`,
                content: `This is a test dream entry for debugging the calendar display. Created for ${dateStr}.`,
                source: 'test-generator',
                metrics: {
                    // Add some random metrics with different values
                    lucidity: Math.floor(Math.random() * 10) + 1,
                    vividness: Math.floor(Math.random() * 10) + 1,
                    emotionality: Math.floor(Math.random() * 10) + 1
                }
            });
        }
        
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Generated ${entries.length} test entries for ${format(month, 'MMMM yyyy')}`);
            }
        } catch (e) {
            // Silent failure - logging should never break functionality
        }
        
        return entries;
    }

    /**
     * Force create test entries for the current month
     * This will add entries to the calendar even if no real entries are found
     */
    private forceCreateTestEntries(): void {
        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
            window['globalLogger'].debug('DateNavigator', 'Forcing creation of test entries for visual verification');
        }
        
        // Create test entries for the current month
        const testEntries = this.createTestEntriesForMonth(this.currentMonth);
        if (testEntries.length > 0) {
            // Add these entries directly to the dream entries map
            testEntries.forEach(entry => {
                if (entry.date) {
                    const dateKey = this.formatDateKey(new Date(entry.date));
                    if (!this.dreamEntries.has(dateKey)) {
                        this.dreamEntries.set(dateKey, []);
                    }
                    this.dreamEntries.get(dateKey)?.push(entry);
                    
                    // Calculate metrics for the day
                    this.calculateDayMetrics(dateKey, this.dreamEntries.get(dateKey) || []);
                }
            });
            
            // Update the UI
            this.updateMonthGrid();
            
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Added ${testEntries.length} test entries to calendar`);
            }
        }
    }

    /**
     * Scan all possible data sources for dream entries
     * This is a comprehensive approach to find entries wherever they might be stored
     */
    private scanAllDataSources(): void {
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'Scanning all data sources for dream entries');
            }
            
            // Array to collect entries from all sources
            const allPossibleEntries: DreamMetricData[] = [];
            
            // 1. Check global objects
            if (window['oneiroMetricsPlugin']) {
                const plugin = window['oneiroMetricsPlugin'] as any;
                
                // Try to get entries from different possible locations
                if (plugin.dreamEntries && Array.isArray(plugin.dreamEntries)) {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `Found ${plugin.dreamEntries.length} entries in plugin.dreamEntries`);
                    }
                    allPossibleEntries.push(...plugin.dreamEntries);
                }
                
                // Check for entries in state
                if (plugin.state) {
                    // Direct state entries
                    if (plugin.state.entries && Array.isArray(plugin.state.entries)) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Found ${plugin.state.entries.length} entries in plugin.state.entries`);
                        }
                        allPossibleEntries.push(...plugin.state.entries);
                    }
                    
                    // Via state method
                    if (typeof plugin.state.getDreamEntries === 'function') {
                        const stateEntries = plugin.state.getDreamEntries();
                        if (stateEntries && Array.isArray(stateEntries) && stateEntries.length > 0) {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].debug('DateNavigator', `Found ${stateEntries.length} entries via plugin.state.getDreamEntries()`);
                            }
                            allPossibleEntries.push(...stateEntries);
                        }
                    }
                }
                
                // Try to find entries in table data
                try {
                    if (plugin.memoizedTableData && plugin.memoizedTableData.size > 0) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Found memoizedTableData with ${plugin.memoizedTableData.size} tables`);
                        }
                        
                        plugin.memoizedTableData.forEach((tableData: any, key: string) => {
                            if (Array.isArray(tableData) && tableData.length > 0) {
                                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                    window['globalLogger'].debug('DateNavigator', `Found table ${key} with ${tableData.length} rows`);
                                }
                                
                                // Check if this is the right table format
                                if (tableData[0] && (tableData[0].date || tableData[0].dream_date)) {
                                    // Convert table rows to dream entries
                                    tableData.forEach((row: any) => {
                                        const date = row.date || row.dream_date;
                                        if (date) {
                                            // Create a dream entry from this row
                                            const entry: DreamMetricData = {
                                                date: date,
                                                title: row.title || row.dream_title || 'Dream Entry',
                                                content: row.content || row.dream_content || '',
                                                source: `table-${key}`,
                                                metrics: row.metrics || {}
                                            };
                                            
                                            // Add any numeric fields as metrics
                                            Object.keys(row).forEach(field => {
                                                if (typeof row[field] === 'number' && field !== 'id' && field !== 'index') {
                                                    if (!entry.metrics) entry.metrics = {};
                                                    entry.metrics[field] = row[field];
                                                }
                                            });
                                            
                                            allPossibleEntries.push(entry);
                                        }
                                    });
                                }
                            }
                        });
                    }
                } catch (err) {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].error('DateNavigator', "Error processing table data:", err);
                    }
                }
                
                // Check for special properties that might hold entries
                const possibleProperties = ['dreamMetricData', 'dreamEntries', 'entries', 'dreamMetrics', 'metrics'];
                possibleProperties.forEach(prop => {
                    if (plugin[prop] && Array.isArray(plugin[prop])) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Found ${plugin[prop].length} entries in plugin.${prop}`);
                        }
                        allPossibleEntries.push(...plugin[prop]);
                    }
                });
            }
            
            // 2. Check our own state
            if (this.state) {
                // Direct access to state
                const stateObj = this.state as any;
                if (stateObj.entries && Array.isArray(stateObj.entries)) {
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `Found ${stateObj.entries.length} entries in state.entries`);
                    }
                    allPossibleEntries.push(...stateObj.entries);
                }
                
                // Try state method
                if (typeof this.state.getDreamEntries === 'function') {
                    const stateEntries = this.state.getDreamEntries();
                    if (stateEntries && Array.isArray(stateEntries) && stateEntries.length > 0) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Found ${stateEntries.length} entries via state.getDreamEntries()`);
                        }
                        allPossibleEntries.push(...stateEntries);
                    }
                }
            }
            
            // 3. Check for global data in window object
            if (window['dreamEntries'] && Array.isArray(window['dreamEntries'])) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Found ${window['dreamEntries'].length} entries in window.dreamEntries`);
                }
                allPossibleEntries.push(...window['dreamEntries']);
            }
            
            // Process all found entries
            if (allPossibleEntries.length > 0) {
                // Deduplicate entries based on date+title
                const uniqueEntries = new Map<string, DreamMetricData>();
                
                allPossibleEntries.forEach(entry => {
                    if (entry && entry.date) {
                        const key = `${entry.date}_${entry.title || ''}`;
                        uniqueEntries.set(key, entry);
                    }
                });
                
                const finalEntries = Array.from(uniqueEntries.values());
                
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `Found ${finalEntries.length} unique entries from all sources`);
                    
                    // Log a sample entry for debugging
                    if (finalEntries.length > 0) {
                        window['globalLogger'].debug('DateNavigator', 'Sample entry:', finalEntries[0]);
                    }
                }
                
                // Force these entries into the calendar
                this.forceDreamEntries(finalEntries);
            } else {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].warn('DateNavigator', 'No entries found from any source!');
                }
            }
        } catch (err) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('DateNavigator', "Error during data source scan:", err);
            }
        }
    }
    
    /**
     * Force a set of dream entries to be used in the calendar
     * This is a public method that can be called from outside to inject entries
     * @param entries The entries to use
     */
    public forceDreamEntries(entries: DreamMetricData[]): void {
        if (!entries || entries.length === 0) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].warn('DateNavigator', 'Attempted to force empty entries array');
            }
            return;
        }
        
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Forcing ${entries.length} entries into calendar`);
            }
            
            // Store the entries for future use - if updateDreamEntries is available
            if (this.state && typeof this.state.updateDreamEntries === 'function') {
                this.state.updateDreamEntries(entries);
            }
            
            // Process the entries immediately
            const month = this.currentMonth;
            
            // Clear existing entries
            this.dreamEntries.clear();
            this.metrics.clear();
            
            // Group entries by date
            entries.forEach(entry => {
                // Ensure we have a valid date string
                if (!entry.date || typeof entry.date !== 'string') {
                    return;
                }
                
                // Parse the entry date using improved method
                try {
                    const entryDate = this.parseEntryDate(entry.date);
                    if (!entryDate) {
                        try {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].warn('DateNavigator', `Failed to parse entry date: ${entry.date}`);
                            }
                        } catch (e) {
                            // Silent failure
                        }
                        return; // Skip this entry
                    }
                    
                    const dateKey = this.formatDateKey(entryDate);
                    
                    // DIAGNOSTIC: Log successful parsing
                    try {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Parsed entry date ${entry.date} to ${format(entryDate, 'yyyy-MM-dd')} (${dateKey})`);
                        }
                    } catch (e) {
                        // Silent failure
                    }
                    
                    // Add to dream entries map
                    if (!this.dreamEntries.has(dateKey)) {
                        this.dreamEntries.set(dateKey, []);
                    }
                    this.dreamEntries.get(dateKey)?.push(entry);
                    
                    // Calculate metrics for the day
                    this.calculateDayMetrics(dateKey, this.dreamEntries.get(dateKey) || []);
                    
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `Added entry for ${dateKey}`);
                    }
                } catch (e) {
                    // Ignore errors for invalid dates
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].error('DateNavigator', `Error processing entry date: ${entry.date}`, e);
                    }
                }
            });
            
            // Update the UI with the loaded entries
            this.updateMonthGrid();
            
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Calendar now has entries for ${this.dreamEntries.size} dates`);
                
                // DIAGNOSTIC: Log the contents of the dreamEntries map
                if (this.dreamEntries.size > 0) {
                    const mapEntries = {};
                    this.dreamEntries.forEach((entriesForDate, dateKey) => {
                        mapEntries[dateKey] = entriesForDate.length;
                    });
                    window['globalLogger'].debug('DateNavigator', 'DIAGNOSTIC - Dream entries map after forcing:', mapEntries);
                }
            }
        } catch (e) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('DateNavigator', `Error forcing dream entries:`, e);
            }
        }
    }

    /**
     * Create guaranteed entries for the current month to ensure calendar works
     * These will be visible no matter what.
     */
    public createGuaranteedEntriesForCurrentMonth(): void {
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'Creating guaranteed entries for current month');
            }
            
            // Get current month info
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            
            // Format today as YYYY-MM-DD
            const todayStr = format(today, 'yyyy-MM-dd');
            
            // Create entries for 5 days in the current month including today
            const entries: DreamMetricData[] = [];
            
            // Add entry for today
            entries.push({
                date: todayStr,
                title: 'Guaranteed Entry for Today',
                content: 'This is a guaranteed entry created for today to debug the calendar display.',
                source: 'debug-guaranteed',
                metrics: {
                    clarity: 10,
                    vividness: 10,
                    intensity: 10
                }
            });
            
            // Add entries for 4 more random days this month
            for (let i = 0; i < 4; i++) {
                // Random day between 1 and days in month
                const day = Math.floor(Math.random() * 28) + 1;
                // Make sure it's not today
                if (day === today.getDate()) {
                    continue;
                }
                
                const dateObj = new Date(year, month, day);
                const dateStr = format(dateObj, 'yyyy-MM-dd');
                
                entries.push({
                    date: dateStr,
                    title: `Guaranteed Entry ${i + 1}`,
                    content: `This is a guaranteed entry created for ${dateStr} to debug the calendar display.`,
                    source: 'debug-guaranteed',
                    metrics: {
                        clarity: 8 - i,
                        vividness: 9 - i,
                        intensity: 7 - i
                    }
                });
            }
            
            // Process these entries
            // Use current month from class
            
            // Clear existing entries
            this.dreamEntries.clear();
            this.metrics.clear();
            
            // Add entries
            entries.forEach(entry => {
                try {
                    const entryDate = new Date(entry.date);
                    
                    // Check if date is valid
                    if (isNaN(entryDate.getTime())) {
                        return;
                    }
                    
                    const dateKey = this.formatDateKey(entryDate);
                    
                    // Add to dream entries map
                    if (!this.dreamEntries.has(dateKey)) {
                        this.dreamEntries.set(dateKey, []);
                    }
                    this.dreamEntries.get(dateKey)?.push(entry);
                    
                    // Calculate metrics for the day
                    this.calculateDayMetrics(dateKey, this.dreamEntries.get(dateKey) || []);
                    
                    if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                        window['globalLogger'].debug('DateNavigator', `Added guaranteed entry for ${dateKey}`);
                    }
                } catch (e) {
                    // Ignore errors
                }
            });
            
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Added ${entries.length} guaranteed entries for current month`);
            }
        } catch (e) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('DateNavigator', 'Error creating guaranteed entries:', e);
            }
        }
    }

    /**
     * Improved date parsing to handle multiple formats
     * This ensures that dates in different formats can be correctly processed
     * @param dateStr The date string to parse
     * @returns A valid Date object or null if parsing fails
     */
    private parseEntryDate(dateStr: string): Date | null {
        if (!dateStr) return null;
        
        try {
            // First try direct parsing - works for ISO format (YYYY-MM-DD)
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
            
            // Try various date formats
            // Format: MM/DD/YYYY
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
                const parts = dateStr.split('/');
                return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
            }
            
            // Format: DD/MM/YYYY
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
                const parts = dateStr.split('/');
                return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
            
            // Format: DD-MM-YYYY
            if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
                const parts = dateStr.split('-');
                return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
            
            // Format: YYYY.MM.DD
            if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(dateStr)) {
                const parts = dateStr.split('.');
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            }
            
            // Try using date-fns parsing with various formats
            const formats = [
                'yyyy-MM-dd',
                'MM/dd/yyyy',
                'dd/MM/yyyy',
                'dd-MM-yyyy',
                'yyyy.MM.dd',
                'yyyy-MM-dd HH:mm:ss',
                'MM/dd/yyyy HH:mm:ss',
            ];
            
            for (const formatStr of formats) {
                try {
                    const parsedDate = parse(dateStr, formatStr, new Date());
                    if (!isNaN(parsedDate.getTime())) {
                        return parsedDate;
                    }
                } catch (e) {
                    // Try next format
                }
            }
            
            // If all else fails, try to extract a date using regex
            const dateRegex = /(\d{4})[-./](\d{1,2})[-./](\d{1,2})/;
            const match = dateStr.match(dateRegex);
            if (match) {
                const [_, year, month, day] = match;
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
            
            // Logging the failed parse attempt
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].warn('DateNavigator', `Failed to parse date: ${dateStr}`);
                }
            } catch (e) {
                // Silent failure - logging should never break functionality
            }
            
            return null;
        } catch (e) {
            try {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].error('DateNavigator', `Error parsing date: ${dateStr}`, e);
                }
            } catch (error) {
                // Silent failure - logging should never break functionality
            }
            return null;
        }
    }

    /**
     * Special debug function to force entries to display
     * Accessible from window.oneiroMetricsPlugin.dateNavigator.debugDisplay()
     */
    public debugDisplay(): void {
        try {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', '===== DEBUG DISPLAY FUNCTION =====');
                window['globalLogger'].debug('DateNavigator', `Current month: ${format(this.currentMonth, 'MMMM yyyy')}`);
            }
            
            // Check global entries
            const globalEntries = window['dreamEntries'] || [];
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Global entries: ${globalEntries.length}`);
            }
            
            // Get all entries for current month
            const monthStartStr = format(startOfMonth(this.currentMonth), 'yyyy-MM');
            const entriesForMonth = globalEntries.filter(entry => {
                if (entry && typeof entry.date === 'string') {
                    return entry.date.startsWith(monthStartStr);
                }
                return false;
            });
            
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Entries for current month ${monthStartStr}: ${entriesForMonth.length}`);
            }
            
            // Force clear all existing entries
            this.dreamEntries.clear();
            this.metrics.clear();
            
            // Add entries for all days of the current month
            if (entriesForMonth.length > 0) {
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', 'Processing entries for days in current month...');
                }
                
                entriesForMonth.forEach(entry => {
                    try {
                        const entryDate = this.parseEntryDate(entry.date);
                        if (!entryDate) {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].warn('DateNavigator', `Failed to parse date: ${entry.date}`);
                            }
                            return;
                        }
                        
                        const dateKey = this.formatDateKey(entryDate);
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Adding entry for ${dateKey}: ${entry.title}`);
                        }
                        
                        if (!this.dreamEntries.has(dateKey)) {
                            this.dreamEntries.set(dateKey, []);
                        }
                        
                        this.dreamEntries.get(dateKey).push(entry);
                        
                        // Calculate metrics
                        this.calculateDayMetrics(dateKey, this.dreamEntries.get(dateKey) || []);
                    } catch (e) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].error('DateNavigator', `Error processing entry: ${e.message}`);
                        }
                    }
                });
                
                // Log final state
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', `After processing, dreamEntries map has ${this.dreamEntries.size} date keys`);
                    this.dreamEntries.forEach((entries, key) => {
                        window['globalLogger'].debug('DateNavigator', `Date ${key}: ${entries.length} entries`);
                    });
                }
            } else {
                // If no entries for this month, create some test entries
                if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                    window['globalLogger'].debug('DateNavigator', 'No entries for current month, creating test entries');
                }
                
                // Create test entries for current month
                const testEntries = this.createTestEntriesForMonth(this.currentMonth);
                testEntries.forEach(entry => {
                    try {
                        const entryDate = this.parseEntryDate(entry.date);
                        if (!entryDate) {
                            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                                window['globalLogger'].warn('DateNavigator', `Failed to parse date: ${entry.date}`);
                            }
                            return;
                        }
                        
                        const dateKey = this.formatDateKey(entryDate);
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].debug('DateNavigator', `Adding test entry for ${dateKey}: ${entry.title}`);
                        }
                        
                        if (!this.dreamEntries.has(dateKey)) {
                            this.dreamEntries.set(dateKey, []);
                        }
                        
                        this.dreamEntries.get(dateKey).push(entry);
                        
                        // Calculate metrics
                        this.calculateDayMetrics(dateKey, this.dreamEntries.get(dateKey) || []);
                    } catch (e) {
                        if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                            window['globalLogger'].error('DateNavigator', `Error processing test entry: ${e.message}`);
                        }
                    }
                });
            }
            
            // Also add an entry for today
            const today = new Date();
            const todayStr = this.formatDateKey(today);
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `Adding special test entry for today (${todayStr})`);
            }
            
            const todayEntry = {
                date: todayStr,
                title: "Debug Test Entry",
                content: "This is a special test entry created by the debug function",
                source: "debug-special",
                metrics: {
                    "Sensory Detail": 5,
                    "Emotional Recall": 5,
                    "Lost Segments": 1,
                    "Descriptiveness": 5,
                    "Confidence Score": 5
                }
            };
            
            if (!this.dreamEntries.has(todayStr)) {
                this.dreamEntries.set(todayStr, []);
            }
            this.dreamEntries.get(todayStr).push(todayEntry);
            this.calculateDayMetrics(todayStr, this.dreamEntries.get(todayStr) || []);
            
            // Update the display
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', 'Updating month grid display...');
            }
            this.updateMonthGrid();
            
            // Verify display after update
            const daysWithEntries = document.querySelectorAll('.oom-day-cell.has-entries');
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `DOM elements with has-entries class: ${daysWithEntries.length}`);
            }
            
            const dotsElements = document.querySelectorAll('.oom-dream-indicators');
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `DOM elements with dream indicators: ${dotsElements.length}`);
            }
            
            const metricsElements = document.querySelectorAll('.oom-day-metrics');
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', `DOM elements with metrics stars: ${metricsElements.length}`);
            }
            
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].debug('DateNavigator', '===== END DEBUG DISPLAY FUNCTION =====');
            }
        } catch (e) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('DateNavigator', 'Error in debugDisplay:', e);
            }
        }
        
        // Make this function accessible globally for easy console debugging
        try {
            window['debugDateNavigator'] = () => {
                this.debugDisplay();
            };
        } catch (e) {
            if (typeof window['globalLogger'] !== 'undefined' && window['globalLogger']) {
                window['globalLogger'].error('DateNavigator', 'Error setting global debug function:', e);
            }
        }
    }
} 
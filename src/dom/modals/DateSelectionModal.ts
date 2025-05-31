import { App, Modal, Notice, ButtonComponent } from 'obsidian';
import { TimeFilterManager } from '../../timeFilters';
import { format, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths, isToday, isSameDay } from 'date-fns';
import safeLogger from '../../logging/safe-logger';

interface DateSelection {
    start: Date;
    end: Date;
    isRange: boolean;
}

export class DateSelectionModal extends Modal {
    private timeFilterManager: TimeFilterManager;
    private currentMonth: Date;
    private selectedDates: Set<string> = new Set();
    private isRangeMode: boolean = false;
    private rangeStart: Date | null = null;
    private previewRange: DateSelection | null = null;
    
    constructor(app: App, timeFilterManager: TimeFilterManager) {
        super(app);
        this.timeFilterManager = timeFilterManager;
        this.currentMonth = new Date(); // Start with current month
        
        // Set modal properties
        this.modalEl.classList.add('oom-date-selection-modal');
    }

    onOpen(): void {
        this.buildInterface();
        safeLogger.info('DateSelectionModal', 'Modal opened');
    }

    onClose(): void {
        this.selectedDates.clear();
        this.rangeStart = null;
        this.previewRange = null;
        safeLogger.info('DateSelectionModal', 'Modal closed');
    }

    private buildInterface(): void {
        const { contentEl } = this;
        contentEl.empty();
        
        try {
            safeLogger.info('DateSelectionModal', 'Building interface - step 1: mode selection');
            // Mode selection section
            this.createModeSelection(contentEl);
            safeLogger.info('DateSelectionModal', 'Mode selection created successfully');
            
            safeLogger.info('DateSelectionModal', 'Building interface - step 2: navigation');
            // Navigation section
            this.createNavigation(contentEl);
            safeLogger.info('DateSelectionModal', 'Navigation created successfully');
            
            safeLogger.info('DateSelectionModal', 'Building interface - step 3: calendar grid');
            // Calendar grid
            this.createCalendarGrid(contentEl);
            safeLogger.info('DateSelectionModal', 'Calendar grid created successfully');
            
            safeLogger.info('DateSelectionModal', 'Building interface - step 4: action buttons');
            // Action buttons
            this.createActionButtons(contentEl);
            safeLogger.info('DateSelectionModal', 'Action buttons created successfully');
            
            safeLogger.info('DateSelectionModal', 'Interface build completed successfully');
        } catch (error) {
            safeLogger.error('DateSelectionModal', 'Error building interface', error);
            
            // Add error message to modal
            contentEl.createEl('div', {
                text: `Error building modal interface: ${error.message}. Check console for details.`,
                cls: 'oom-error-message'
            });
        }
    }

    private createModeSelection(container: HTMLElement): void {
        const modeSection = container.createDiv('oom-mode-selection');
        
        // Create flex container for two-column layout
        const modeFlexContainer = modeSection.createDiv('oom-mode-flex-container');
        
        // Left column: Selection Mode title
        const leftColumn = modeFlexContainer.createDiv('oom-mode-left-column');
        const selectionModeTitle = leftColumn.createEl('div', { text: 'Selection Mode', cls: 'oom-selection-mode-title' });
        
        // Right column: Buttons and selection info
        const rightColumn = modeFlexContainer.createDiv('oom-mode-right-column');
        
        const modeButtons = rightColumn.createDiv('oom-mode-buttons');
        
        // Single date mode - only set class if it should be active
        const singleButton = new ButtonComponent(modeButtons)
            .setButtonText('Single Date')
            .onClick(() => this.setMode(false));
        
        if (!this.isRangeMode) {
            singleButton.setClass('mod-cta');
        }
        
        // Range mode - only set class if it should be active  
        const rangeButton = new ButtonComponent(modeButtons)
            .setButtonText('Date Range')
            .onClick(() => this.setMode(true));
            
        if (this.isRangeMode) {
            rangeButton.setClass('mod-cta');
        }
        
        // Selection info (moved under the buttons)
        const selectionInfo = rightColumn.createDiv('oom-selection-info');
        this.updateSelectionInfo(selectionInfo);
    }

    private createNavigation(container: HTMLElement): void {
        const navSection = container.createDiv('oom-date-navigation');
        
        // Year navigation for multi-year spans
        const yearNav = navSection.createDiv('oom-year-nav');
        
        new ButtonComponent(yearNav)
            .setButtonText('◀◀')
            .setTooltip('Previous Year')
            .onClick(() => this.navigateYear(-1));
        
        const yearDisplay = yearNav.createEl('span', { 
            cls: 'oom-year-display',
            text: this.currentMonth.getFullYear().toString()
        });
        
        new ButtonComponent(yearNav)
            .setButtonText('▶▶')
            .setTooltip('Next Year')
            .onClick(() => this.navigateYear(1));
        
        // Month navigation
        const monthNav = navSection.createDiv('oom-month-nav');
        
        new ButtonComponent(monthNav)
            .setButtonText('◀')
            .setTooltip('Previous Month')
            .onClick(() => this.navigateMonth(-1));
        
        const monthDisplay = monthNav.createEl('span', { 
            cls: 'oom-month-display',
            text: format(this.currentMonth, 'MMMM yyyy')
        });
        
        new ButtonComponent(monthNav)
            .setButtonText('▶')
            .setTooltip('Next Month')
            .onClick(() => this.navigateMonth(1));
        
        // Quick navigation for common ranges
        const quickNav = navSection.createDiv('oom-quick-nav');
        
        new ButtonComponent(quickNav)
            .setButtonText('Today')
            .onClick(() => this.navigateToToday());
        
        new ButtonComponent(quickNav)
            .setButtonText('This Month')
            .onClick(() => this.selectCurrentMonth());
    }

    private createCalendarGrid(container: HTMLElement): void {
        const calendarContainer = container.createDiv('oom-calendar-container');
        
        // Days of week header
        const daysHeader = calendarContainer.createDiv('oom-days-header');
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            daysHeader.createEl('div', { text: day, cls: 'oom-day-header' });
        });
        
        // Calendar grid
        const calendarGrid = calendarContainer.createDiv('oom-calendar-grid');
        this.generateCalendarDays(calendarGrid);
    }

    private generateCalendarDays(container: HTMLElement): void {
        container.empty();
        
        const firstDay = startOfMonth(this.currentMonth);
        const lastDay = endOfMonth(this.currentMonth);
        
        // Start from Sunday of the week containing the first day
        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - firstDay.getDay());
        
        // Generate 6 weeks (42 days) to ensure consistent grid
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayElement = this.createDayElement(currentDate);
            container.appendChild(dayElement);
        }
    }

    private createDayElement(date: Date): HTMLElement {
        const dayEl = document.createElement('div');
        dayEl.className = 'oom-calendar-day';
        dayEl.textContent = date.getDate().toString();
        
        const dateKey = this.formatDateKey(date);
        const isCurrentMonth = isSameMonth(date, this.currentMonth);
        const isSelected = this.selectedDates.has(dateKey);
        const isTodayDate = isToday(date);
        
        // Apply classes based on state
        if (!isCurrentMonth) dayEl.classList.add('oom-other-month');
        if (isSelected) dayEl.classList.add('oom-selected');
        if (isTodayDate) dayEl.classList.add('oom-today');
        
        // Range preview highlighting
        if (this.previewRange && this.isDateInRange(date, this.previewRange)) {
            dayEl.classList.add('oom-range-preview');
            if (isSameDay(date, this.previewRange.start)) dayEl.classList.add('oom-range-start');
            if (isSameDay(date, this.previewRange.end)) dayEl.classList.add('oom-range-end');
        }
        
        // Event listeners
        dayEl.addEventListener('click', () => this.handleDayClick(date));
        dayEl.addEventListener('mouseenter', () => this.handleDayHover(date));
        
        return dayEl;
    }

    private createActionButtons(container: HTMLElement): void {
        const actionSection = container.createDiv('oom-action-buttons');
        
        // Clear selection
        new ButtonComponent(actionSection)
            .setButtonText('Clear')
            .onClick(() => this.clearSelection());
        
        // Apply filter
        new ButtonComponent(actionSection)
            .setButtonText('Apply Filter')
            .setClass('mod-cta')
            .onClick(() => this.applySelection());
        
        // Cancel
        new ButtonComponent(actionSection)
            .setButtonText('Cancel')
            .onClick(() => this.close());
    }

    private setMode(isRange: boolean): void {
        this.isRangeMode = isRange;
        this.clearSelection();
        this.buildInterface(); // Rebuild to update button states
        
        safeLogger.info('DateSelectionModal', 'Mode changed', { isRangeMode: this.isRangeMode });
    }

    private navigateYear(delta: number): void {
        this.currentMonth = new Date(
            this.currentMonth.getFullYear() + delta,
            this.currentMonth.getMonth(),
            1
        );
        this.updateCalendar();
        
        safeLogger.debug('DateSelectionModal', 'Year navigation', { 
            year: this.currentMonth.getFullYear(),
            delta 
        });
    }

    private navigateMonth(delta: number): void {
        this.currentMonth = delta > 0 
            ? addMonths(this.currentMonth, 1)
            : subMonths(this.currentMonth, 1);
        this.updateCalendar();
        
        safeLogger.debug('DateSelectionModal', 'Month navigation', { 
            month: format(this.currentMonth, 'yyyy-MM'),
            delta 
        });
    }

    private navigateToToday(): void {
        this.currentMonth = new Date();
        this.updateCalendar();
    }

    private selectCurrentMonth(): void {
        if (!this.isRangeMode) return;
        
        const start = startOfMonth(this.currentMonth);
        const end = endOfMonth(this.currentMonth);
        
        this.selectedDates.clear();
        this.addRangeToSelection(start, end);
        this.previewRange = { start, end, isRange: true };
        this.updateCalendar();
        
        new Notice(`Selected entire month: ${format(this.currentMonth, 'MMMM yyyy')}`);
    }

    private handleDayClick(date: Date): void {
        const dateKey = this.formatDateKey(date);
        
        if (this.isRangeMode) {
            this.handleRangeSelection(date);
        } else {
            // Single date mode
            this.selectedDates.clear();
            this.selectedDates.add(dateKey);
            this.previewRange = { start: date, end: date, isRange: false };
        }
        
        this.updateCalendar();
        this.updateSelectionInfo();
    }

    private handleRangeSelection(date: Date): void {
        if (!this.rangeStart) {
            // Start new range
            this.rangeStart = date;
            this.selectedDates.clear();
            this.selectedDates.add(this.formatDateKey(date));
            
            new Notice(`Range start: ${format(date, 'MMM d, yyyy')} - Select end date`);
            safeLogger.info('DateSelectionModal', 'Range start selected', {
                startDate: this.formatDateKey(date)
            });
        } else {
            // Complete range
            const start = this.rangeStart < date ? this.rangeStart : date;
            const end = this.rangeStart < date ? date : this.rangeStart;
            
            this.selectedDates.clear();
            this.addRangeToSelection(start, end);
            this.previewRange = { start, end, isRange: true };
            
            // Important: Clear rangeStart to allow new range selection
            this.rangeStart = null;
            
            const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            new Notice(`Range selected: ${format(start, 'MMM d')} to ${format(end, 'MMM d, yyyy')} (${dayCount} days)`);
            
            safeLogger.info('DateSelectionModal', 'Range selection completed', {
                startDate: this.formatDateKey(start),
                endDate: this.formatDateKey(end),
                dayCount
            });
        }
    }

    private handleDayHover(date: Date): void {
        if (this.isRangeMode && this.rangeStart) {
            // Show preview of range
            const start = this.rangeStart < date ? this.rangeStart : date;
            const end = this.rangeStart < date ? date : this.rangeStart;
            this.previewRange = { start, end, isRange: true };
            this.updateCalendar();
        }
    }

    private addRangeToSelection(start: Date, end: Date): void {
        const current = new Date(start);
        while (current <= end) {
            this.selectedDates.add(this.formatDateKey(current));
            current.setDate(current.getDate() + 1);
        }
    }

    private isDateInRange(date: Date, range: DateSelection): boolean {
        return date >= range.start && date <= range.end;
    }

    private clearSelection(): void {
        this.selectedDates.clear();
        this.rangeStart = null;
        this.previewRange = null;
        this.updateCalendar();
        this.updateSelectionInfo();
        
        new Notice('Selection cleared');
    }

    private applySelection(): void {
        if (this.selectedDates.size === 0) {
            new Notice('No dates selected');
            return;
        }

        if (!this.previewRange) {
            new Notice('Invalid selection');
            return;
        }

        try {
            // Apply filter through TimeFilterManager
            this.timeFilterManager.setCustomRange(this.previewRange.start, this.previewRange.end);
            
            const dayCount = this.selectedDates.size;
            const message = this.previewRange.isRange 
                ? `Applied date range: ${format(this.previewRange.start, 'MMM d')} to ${format(this.previewRange.end, 'MMM d, yyyy')} (${dayCount} days)`
                : `Applied date filter: ${format(this.previewRange.start, 'MMM d, yyyy')}`;
            
            new Notice(message);
            
            safeLogger.info('DateSelectionModal', 'Filter applied', {
                start: this.previewRange.start.toISOString().split('T')[0],
                end: this.previewRange.end.toISOString().split('T')[0],
                dayCount,
                isRange: this.previewRange.isRange
            });
            
            this.close();
            
        } catch (error) {
            safeLogger.error('DateSelectionModal', 'Failed to apply filter', error);
            new Notice('Failed to apply date filter. Please try again.');
        }
    }

    private updateCalendar(): void {
        const calendarGrid = this.contentEl.querySelector('.oom-calendar-grid');
        if (calendarGrid) {
            this.generateCalendarDays(calendarGrid as HTMLElement);
        }
        
        // Update navigation displays
        const yearDisplay = this.contentEl.querySelector('.oom-year-display');
        if (yearDisplay) {
            yearDisplay.textContent = this.currentMonth.getFullYear().toString();
        }
        
        const monthDisplay = this.contentEl.querySelector('.oom-month-display');
        if (monthDisplay) {
            monthDisplay.textContent = format(this.currentMonth, 'MMMM yyyy');
        }
    }

    private updateSelectionInfo(container?: HTMLElement): void {
        const infoEl = container || this.contentEl.querySelector('.oom-selection-info');
        if (!infoEl) return;
        
        infoEl.empty();
        
        if (this.selectedDates.size === 0) {
            infoEl.createEl('p', { 
                text: this.isRangeMode ? 'Select start and end dates for range' : 'Click a date to select',
                cls: 'oom-help-text'
            });
        } else if (this.isRangeMode && this.rangeStart && this.selectedDates.size === 1) {
            infoEl.createEl('p', { 
                text: `Start: ${format(this.rangeStart, 'MMM d, yyyy')} - Select end date`,
                cls: 'oom-info-text'
            });
        } else if (this.previewRange) {
            const dayCount = this.selectedDates.size;
            const text = this.previewRange.isRange 
                ? `Selected: ${format(this.previewRange.start, 'MMM d')} to ${format(this.previewRange.end, 'MMM d, yyyy')} (${dayCount} days)`
                : `Selected: ${format(this.previewRange.start, 'MMM d, yyyy')}`;
            
            infoEl.createEl('p', { text, cls: 'oom-selected-text' });
        }
    }

    private formatDateKey(date: Date): string {
        return format(date, 'yyyy-MM-dd');
    }
} 
import { App, Modal, Notice } from 'obsidian';
import type DreamMetricsPlugin from '../../../main';
import safeLogger from '../../logging/safe-logger';
import { PatternCalculator, PatternRenderer, PatternTooltips, type PatternVisualization } from '../../dom/date-navigator/pattern-visualization';
import { SafeDOMUtils } from '../../utils/SafeDOMUtils';
import { TemplateHelpers } from '../../utils/TemplateHelpers';

export interface DashboardNavigationState {
    currentDate: Date;
    viewMode: 'month' | 'dual' | 'quarter';
    selectedDates: Date[];
    selectionMode: 'single' | 'range' | 'multi';
    dreamEntries: Map<string, any[]>;
    visualizationStyle: 'composite-dots' | 'quality-gradients' | 'multi-layer' | 'minimalist-icons';
}

/**
 * Enhanced Date Navigator Modal specifically designed for the OneiroMetrics Dashboard
 * Uses callback system instead of TimeFilterManager dependency
 */
export class DashboardEnhancedDateNavigatorModal extends Modal {
    private plugin: DreamMetricsPlugin;
    private onDateRangeSelected: (start: string, end: string) => void;
    private state: DashboardNavigationState;
    private isUpdating: boolean = false;
    private initialDateRange?: { start: string; end: string };

    // UI Elements
    private mainContainer: HTMLElement;
    private navigationSection: HTMLElement;
    private calendarSection: HTMLElement;
    private actionSection: HTMLElement;

    // Pattern Visualization Components
    private patternCalculator: PatternCalculator;
    private patternRenderer: PatternRenderer;
    private patternTooltips: PatternTooltips;

    constructor(
        app: App, 
        plugin: DreamMetricsPlugin,
        initialDateRange: { start: string; end: string } | undefined,
        onDateRangeSelected: (start: string, end: string) => void
    ) {
        super(app);
        this.plugin = plugin;
        this.onDateRangeSelected = onDateRangeSelected;
        this.initialDateRange = initialDateRange;
        
        // Initialize state
        this.state = {
            currentDate: new Date(),
            viewMode: 'month',
            selectedDates: [],
            selectionMode: 'range', // Default to range for dashboard
            dreamEntries: new Map(),
            visualizationStyle: 'composite-dots'
        };

        // If we have an initial date range, set it up
        if (initialDateRange?.start && initialDateRange?.end) {
            try {
                const startDate = new Date(initialDateRange.start);
                const endDate = new Date(initialDateRange.end);
                this.state.selectedDates = [startDate, endDate];
                this.state.currentDate = startDate;
            } catch (error) {
                safeLogger.warn('DashboardEnhancedDateNavigator', 'Invalid initial date range', error);
            }
        }

        // Initialize pattern visualization components
        this.patternCalculator = new PatternCalculator();
        this.patternRenderer = new PatternRenderer(this.state.visualizationStyle);
        this.patternTooltips = new PatternTooltips();

        // Set modal properties
        this.modalEl.addClass('oomp-enhanced-date-navigator-modal');
        this.modalEl.addClass('oomp-dashboard-date-navigator');
        this.modalEl.setAttribute('role', 'dialog');
        this.modalEl.setAttribute('aria-label', 'Dashboard Date Navigator');
    }

    onOpen() {
        safeLogger.info('DashboardEnhancedDateNavigator', 'Modal opened');
        this.buildInterface();
        this.loadDreamData();
    }

    onClose() {
        safeLogger.info('DashboardEnhancedDateNavigator', 'Modal closed');
        this.cleanup();
    }

    private buildInterface(): void {
        // Clear any existing content
        this.contentEl.empty();

        try {
            // Main container with semantic structure
            this.mainContainer = this.contentEl.createDiv({
                cls: 'enhanced-date-navigator-container dashboard-variant'
            });

            // Add dashboard-specific title
            const titleEl = this.mainContainer.createEl('h2', {
                cls: 'dashboard-date-navigator-title',
                text: 'Select Date Range for Dashboard'
            });

            // Build the interface sections
            this.buildNavigationHeader();
            this.buildSelectionControls();
            this.buildCalendarSection();
            this.buildActionSection();

            safeLogger.info('DashboardEnhancedDateNavigator', 'Interface built successfully');
        } catch (error) {
            safeLogger.error('DashboardEnhancedDateNavigator', 'Error building interface', error);
            new Notice('Error building date navigator interface');
        }
    }

    private buildNavigationHeader(): void {
        this.navigationSection = this.mainContainer.createDiv({
            cls: 'nav-header-section'
        });

        const navContainer = this.navigationSection.createDiv({
            cls: 'nav-controls-row'
        });

        // View mode controls
        const viewModeContainer = navContainer.createDiv({ cls: 'view-mode-controls' });
        
        const monthBtn = viewModeContainer.createEl('button', {
            text: 'Month',
            cls: this.state.viewMode === 'month' ? 'active' : ''
        });
        monthBtn.onclick = () => this.setViewMode('month');

        const dualBtn = viewModeContainer.createEl('button', {
            text: 'Dual Month',
            cls: this.state.viewMode === 'dual' ? 'active' : ''
        });
        dualBtn.onclick = () => this.setViewMode('dual');

        const quarterBtn = viewModeContainer.createEl('button', {
            text: 'Quarter',
            cls: this.state.viewMode === 'quarter' ? 'active' : ''
        });
        quarterBtn.onclick = () => this.setViewMode('quarter');

        // Month navigation
        const navControls = navContainer.createDiv({ cls: 'month-nav-controls' });
        
        const prevBtn = navControls.createEl('button', {
            text: '‹',
            cls: 'nav-btn prev-btn'
        });
        prevBtn.onclick = () => this.navigateMonth(-1);

        const monthDisplay = navControls.createEl('span', {
            cls: 'current-month-display'
        });
        this.updateMonthDisplay(monthDisplay);

        const nextBtn = navControls.createEl('button', {
            text: '›',
            cls: 'nav-btn next-btn'
        });
        nextBtn.onclick = () => this.navigateMonth(1);
    }

    private buildSelectionControls(): void {
        const selectionContainer = this.mainContainer.createDiv({
            cls: 'selection-controls-section'
        });

        // Quick date range buttons
        const quickRangesContainer = selectionContainer.createDiv({ cls: 'quick-ranges' });
        quickRangesContainer.createEl('span', { text: 'Quick ranges: ', cls: 'quick-ranges-label' });

        const ranges = [
            { label: 'Last 7 days', days: 7 },
            { label: 'Last 30 days', days: 30 },
            { label: 'This month', special: 'thisMonth' },
            { label: 'Last month', special: 'lastMonth' },
            { label: 'This year', special: 'thisYear' }
        ];

        ranges.forEach(range => {
            const btn = quickRangesContainer.createEl('button', {
                text: range.label,
                cls: 'quick-range-btn'
            });
            btn.onclick = () => this.setQuickRange(range);
        });
    }

    private buildCalendarSection(): void {
        this.calendarSection = this.mainContainer.createDiv({
            cls: 'calendar-section'
        });

        this.renderCalendar();
    }

    private buildActionSection(): void {
        this.actionSection = this.mainContainer.createDiv({
            cls: 'action-section'
        });

        // Selection info
        const selectionInfo = this.actionSection.createDiv({
            cls: 'selection-info'
        });
        this.updateSelectionInfo(selectionInfo);

        // Action buttons
        const buttonContainer = this.actionSection.createDiv({
            cls: 'action-buttons'
        });

        const cancelBtn = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'cancel-btn'
        });
        cancelBtn.onclick = () => this.close();

        const clearBtn = buttonContainer.createEl('button', {
            text: 'Clear Selection',
            cls: 'clear-btn'
        });
        clearBtn.onclick = () => this.clearSelection();

        const applyBtn = buttonContainer.createEl('button', {
            text: 'Apply Range',
            cls: 'apply-btn primary-btn'
        });
        applyBtn.onclick = () => this.applySelection();
    }

    private setViewMode(mode: 'month' | 'dual' | 'quarter'): void {
        this.state.viewMode = mode;
        
        // Update button states
        const buttons = this.navigationSection.querySelectorAll('.view-mode-controls button');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent?.toLowerCase().includes(mode) || 
                (mode === 'dual' && btn.textContent?.includes('Dual'))) {
                btn.classList.add('active');
            }
        });

        this.renderCalendar();
    }

    private navigateMonth(direction: number): void {
        const newDate = new Date(this.state.currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        this.state.currentDate = newDate;
        
        this.updateMonthDisplay();
        this.renderCalendar();
    }

    private updateMonthDisplay(element?: HTMLElement): void {
        const display = element || this.navigationSection.querySelector('.current-month-display') as HTMLElement;
        if (display) {
            const options: Intl.DateTimeFormatOptions = { 
                year: 'numeric', 
                month: 'long' 
            };
            display.textContent = this.state.currentDate.toLocaleDateString('en-US', options);
        }
    }

    private setQuickRange(range: any): void {
        const today = new Date();
        let startDate: Date;
        let endDate: Date = new Date(today);

        if (range.days) {
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - range.days + 1);
        } else if (range.special === 'thisMonth') {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else if (range.special === 'lastMonth') {
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        } else if (range.special === 'thisYear') {
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31);
        } else {
            return;
        }

        this.state.selectedDates = [startDate, endDate];
        this.renderCalendar();
        this.updateSelectionInfo();
    }

    private renderCalendar(): void {
        if (!this.calendarSection) return;

        this.calendarSection.empty();

        try {
            switch (this.state.viewMode) {
                case 'month':
                    this.renderSingleMonth();
                    break;
                case 'dual':
                    this.renderDualMonth();
                    break;
                case 'quarter':
                    this.renderQuarterView();
                    break;
            }
        } catch (error) {
            safeLogger.error('DashboardEnhancedDateNavigator', 'Error rendering calendar', error);
        }
    }

    private renderSingleMonth(): void {
        const monthContainer = this.calendarSection.createDiv({ cls: 'single-month-view' });
        this.renderMonthCalendar(monthContainer, this.state.currentDate);
    }

    private renderDualMonth(): void {
        const dualContainer = this.calendarSection.createDiv({ cls: 'dual-month-view' });
        
        const currentMonth = new Date(this.state.currentDate);
        const nextMonth = new Date(currentMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        const leftContainer = dualContainer.createDiv({ cls: 'month-container left' });
        const rightContainer = dualContainer.createDiv({ cls: 'month-container right' });

        this.renderMonthCalendar(leftContainer, currentMonth);
        this.renderMonthCalendar(rightContainer, nextMonth);
    }

    private renderQuarterView(): void {
        const quarterContainer = this.calendarSection.createDiv({ cls: 'quarter-view' });
        
        const baseDate = new Date(this.state.currentDate);
        const quarterStart = new Date(baseDate.getFullYear(), Math.floor(baseDate.getMonth() / 3) * 3, 1);

        for (let i = 0; i < 3; i++) {
            const monthDate = new Date(quarterStart);
            monthDate.setMonth(quarterStart.getMonth() + i);
            
            const monthContainer = quarterContainer.createDiv({ cls: 'quarter-month' });
            this.renderMonthCalendar(monthContainer, monthDate, true);
        }
    }

    private renderMonthCalendar(container: HTMLElement, date: Date, compact = false): void {
        const monthHeader = container.createDiv({ cls: compact ? 'month-header compact' : 'month-header' });
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: compact ? 'short' : 'long' 
        };
        monthHeader.textContent = date.toLocaleDateString('en-US', options);

        const calendar = container.createDiv({ cls: compact ? 'calendar-grid compact' : 'calendar-grid' });
        
        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = calendar.createDiv({ 
                cls: 'day-header', 
                text: compact ? day[0] : day 
            });
        });

        // Calendar days
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        for (let i = 0; i < 42; i++) { // 6 weeks
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayEl = calendar.createDiv({
                cls: this.getDayClasses(currentDate, date.getMonth()),
                text: currentDate.getDate().toString()
            });

            dayEl.onclick = () => this.handleDateClick(currentDate);

            if (currentDate > lastDay && i > 34) break; // Don't show too many next month days
        }
    }

    private getDayClasses(date: Date, currentMonth: number): string {
        const classes = ['calendar-day'];
        
        if (date.getMonth() !== currentMonth) {
            classes.push('other-month');
        }
        
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            classes.push('today');
        }

        if (this.isDateSelected(date)) {
            classes.push('selected');
        }

        if (this.isDateInRange(date)) {
            classes.push('in-range');
        }

        return classes.join(' ');
    }

    private isDateSelected(date: Date): boolean {
        return this.state.selectedDates.some(selected => 
            selected.toDateString() === date.toDateString()
        );
    }

    private isDateInRange(date: Date): boolean {
        if (this.state.selectedDates.length < 2) return false;
        
        const sortedDates = [...this.state.selectedDates].sort((a, b) => a.getTime() - b.getTime());
        const start = sortedDates[0];
        const end = sortedDates[sortedDates.length - 1];
        
        return date >= start && date <= end;
    }

    private handleDateClick(date: Date): void {
        if (this.state.selectionMode === 'range') {
            if (this.state.selectedDates.length === 0 || this.state.selectedDates.length === 2) {
                // Start new range
                this.state.selectedDates = [date];
            } else if (this.state.selectedDates.length === 1) {
                // Complete range
                const existing = this.state.selectedDates[0];
                this.state.selectedDates = [existing, date].sort((a, b) => a.getTime() - b.getTime());
            }
        } else {
            // Single or multi selection
            const existingIndex = this.state.selectedDates.findIndex(d => 
                d.toDateString() === date.toDateString()
            );
            
            if (existingIndex !== -1) {
                this.state.selectedDates.splice(existingIndex, 1);
            } else {
                if (this.state.selectionMode === 'single') {
                    this.state.selectedDates = [date];
                } else {
                    this.state.selectedDates.push(date);
                }
            }
        }

        this.renderCalendar();
        this.updateSelectionInfo();
    }

    private updateSelectionInfo(element?: HTMLElement): void {
        const info = element || this.actionSection?.querySelector('.selection-info') as HTMLElement;
        if (!info) return;

        if (this.state.selectedDates.length === 0) {
            info.textContent = 'No dates selected';
        } else if (this.state.selectedDates.length === 1) {
            const dateStr = this.state.selectedDates[0].toLocaleDateString();
            info.textContent = `Selected: ${dateStr}`;
        } else if (this.state.selectedDates.length === 2) {
            const sortedDates = [...this.state.selectedDates].sort((a, b) => a.getTime() - b.getTime());
            const startStr = sortedDates[0].toLocaleDateString();
            const endStr = sortedDates[1].toLocaleDateString();
            const dayCount = Math.ceil((sortedDates[1].getTime() - sortedDates[0].getTime()) / (1000 * 60 * 60 * 24)) + 1;
            info.textContent = `Range: ${startStr} - ${endStr} (${dayCount} days)`;
        } else {
            info.textContent = `${this.state.selectedDates.length} dates selected`;
        }
    }

    private clearSelection(): void {
        this.state.selectedDates = [];
        this.renderCalendar();
        this.updateSelectionInfo();
    }

    private applySelection(): void {
        if (this.state.selectedDates.length === 0) {
            new Notice('Please select at least one date');
            return;
        }

        try {
            if (this.state.selectedDates.length === 1) {
                // Single date - use as both start and end
                const dateStr = this.state.selectedDates[0].toISOString().split('T')[0];
                this.onDateRangeSelected(dateStr, dateStr);
            } else {
                // Multiple dates - use range
                const sortedDates = [...this.state.selectedDates].sort((a, b) => a.getTime() - b.getTime());
                const startStr = sortedDates[0].toISOString().split('T')[0];
                const endStr = sortedDates[sortedDates.length - 1].toISOString().split('T')[0];
                this.onDateRangeSelected(startStr, endStr);
            }

            this.close();
        } catch (error) {
            safeLogger.error('DashboardEnhancedDateNavigator', 'Error applying selection', error);
            new Notice('Error applying date selection. Please try again.');
        }
    }

    private async loadDreamData(): Promise<void> {
        // For the dashboard version, we don't need to load dream data
        // since the dashboard already has the data. This is a simplified version.
        safeLogger.trace('DashboardEnhancedDateNavigator', 'Dream data loading skipped for dashboard variant');
    }

    private cleanup(): void {
        // Clean up any event listeners or resources
        safeLogger.trace('DashboardEnhancedDateNavigator', 'Cleanup completed');
    }
}
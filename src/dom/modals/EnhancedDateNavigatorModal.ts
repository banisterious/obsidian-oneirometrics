import { App, Modal, Notice } from 'obsidian';
import type DreamMetricsPlugin from '../../../main';
import type { TimeFilterManager } from '../../timeFilters';
import safeLogger from '../../logging/safe-logger';
import { PatternCalculator, PatternRenderer, PatternTooltips, type PatternVisualization } from '../date-navigator/pattern-visualization';

export interface EnhancedNavigationState {
    currentDate: Date;
    viewMode: 'month' | 'dual' | 'quarter';
    selectedDates: Date[];
    selectionMode: 'single' | 'range' | 'multi';
    dreamEntries: Map<string, any[]>;
    visualizationStyle: 'composite-dots' | 'quality-gradients' | 'multi-layer' | 'minimalist-icons';
}

export class EnhancedDateNavigatorModal extends Modal {
    private plugin: DreamMetricsPlugin;
    private timeFilterManager: TimeFilterManager;
    private state: EnhancedNavigationState;
    private isUpdating: boolean = false;

    // UI Elements - renamed to avoid conflict with Modal's containerEl
    private mainContainer: HTMLElement;
    private navigationSection: HTMLElement;
    private calendarSection: HTMLElement;
    private actionSection: HTMLElement;

    // Pattern Visualization Components
    private patternCalculator: PatternCalculator;
    private patternRenderer: PatternRenderer;
    private patternTooltips: PatternTooltips;

    constructor(app: App, timeFilterManager: TimeFilterManager, plugin: DreamMetricsPlugin) {
        super(app);
        this.plugin = plugin;
        this.timeFilterManager = timeFilterManager;
        
        // Initialize state
        this.state = {
            currentDate: new Date(),
            viewMode: 'month',
            selectedDates: [],
            selectionMode: 'single',
            dreamEntries: new Map(),
            visualizationStyle: 'composite-dots'
        };

        // Initialize pattern visualization components
        this.patternCalculator = new PatternCalculator();
        this.patternRenderer = new PatternRenderer(this.state.visualizationStyle);
        this.patternTooltips = new PatternTooltips();

        // Set modal properties
        this.modalEl.addClass('oomp-enhanced-date-navigator-modal');
        this.modalEl.setAttribute('role', 'dialog');
        this.modalEl.setAttribute('aria-label', 'Enhanced Date Navigator');
    }

    onOpen() {
        this.plugin.logger?.trace('EnhancedDateNavigator', 'Modal opened');
        this.plugin.logger?.info('EnhancedDateNavigator', 'Modal opened');
        this.buildInterface();
        this.loadDreamData();
        this.plugin.logger?.trace('EnhancedDateNavigator', 'Modal initialization complete');
    }

    onClose() {
        this.plugin.logger?.info('EnhancedDateNavigator', 'Modal closed');
        this.cleanup();
    }

    private buildInterface(): void {
        // Clear any existing content
        this.contentEl.empty();

        try {
            // Main container with semantic structure
            this.mainContainer = this.contentEl.createDiv({
                cls: 'enhanced-date-navigator-container'
            });

            // Build optimized two-row header sections
            this.buildOptimizedNavigationHeader();
            this.buildOptimizedInteractionHeader();
            this.buildCalendarSection();
            this.buildActionSection();

            this.plugin.logger?.info('EnhancedDateNavigator', 'Interface built successfully');
        } catch (error) {
            this.plugin.logger?.error('EnhancedDateNavigator', 'Error building interface', error);
            new Notice('Error building date navigator interface');
        }
    }

    /**
     * Build the optimized first row: Year, Jump to Month, Quarter View, Date Input, Go
     */
    private buildOptimizedNavigationHeader(): void {
        this.navigationSection = this.mainContainer.createDiv({
            cls: 'enhanced-nav-section optimized-nav-row'
        });

        // Primary navigation controls row
        const navRow = this.navigationSection.createDiv({
            cls: 'nav-header optimized-nav-header'
        });

        // Core navigation controls (no wrapping)
        this.buildYearPicker(navRow);
        this.buildMonthJump(navRow);
        this.buildQuarterToggle(navRow);
        this.buildGoToDate(navRow);
    }

    /**
     * Build the optimized second row: Selection Mode and Patterns (Recent removed)
     */
    private buildOptimizedInteractionHeader(): void {
        const interactionSection = this.mainContainer.createDiv({
            cls: 'enhanced-interaction-section optimized-interaction-row'
        });

        const interactionRow = interactionSection.createDiv({
            cls: 'interaction-header optimized-interaction-header'
        });

        // Center: Selection Mode Controls
        const centerSection = interactionRow.createDiv({
            cls: 'interaction-center'
        });
        this.buildSelectionModeButtons(centerSection);

        // Right: Patterns/Visualization
        const rightSection = interactionRow.createDiv({
            cls: 'interaction-right'
        });
        this.buildVisualizationDropdown(rightSection);
    }

    /**
     * Build selection mode buttons for the optimized layout
     */
    private buildSelectionModeButtons(container: HTMLElement): void {
        const modeButtons = container.createDiv({
            cls: 'mode-buttons optimized-mode-buttons'
        });

        const singleBtn = modeButtons.createEl('button', {
            cls: 'selection-mode-btn active',
            text: 'Single',
            attr: { 
                'data-mode': 'single',
                'aria-pressed': 'true',
                'title': 'Select individual dates'
            }
        });
        singleBtn.addEventListener('click', () => this.setSelectionMode('single'));

        const rangeBtn = modeButtons.createEl('button', {
            cls: 'selection-mode-btn',
            text: 'Range',
            attr: { 
                'data-mode': 'range',
                'aria-pressed': 'false',
                'title': 'Click and drag to select date ranges'
            }
        });
        rangeBtn.addEventListener('click', () => this.setSelectionMode('range'));

        const multiBtn = modeButtons.createEl('button', {
            cls: 'selection-mode-btn',
            text: 'Multi',
            attr: { 
                'data-mode': 'multi',
                'aria-pressed': 'false',
                'title': 'Ctrl+click to select multiple individual dates'
            }
        });
        multiBtn.addEventListener('click', () => this.setSelectionMode('multi'));
    }

    private buildCalendarSection(): void {
        this.calendarSection = this.mainContainer.createDiv({
            cls: 'enhanced-calendar-section'
        });

        // Calendar header with month/year display
        const calendarHeader = this.calendarSection.createDiv({
            cls: 'calendar-header'
        });

        // Month navigation
        const monthNav = calendarHeader.createDiv({
            cls: 'month-navigation'
        });

        const prevButton = monthNav.createEl('button', {
            cls: 'nav-button prev-month',
            attr: { 'aria-label': 'Previous month' }
        });
        prevButton.innerHTML = '‹';
        prevButton.addEventListener('click', () => this.navigateMonth(-1));

        const monthDisplay = monthNav.createDiv({
            cls: 'month-display'
        });

        const nextButton = monthNav.createEl('button', {
            cls: 'nav-button next-month',
            attr: { 'aria-label': 'Next month' }
        });
        nextButton.innerHTML = '›';
        nextButton.addEventListener('click', () => this.navigateMonth(1));

        // Calendar grid
        const calendarGrid = this.calendarSection.createDiv({
            cls: 'calendar-grid'
        });

        this.buildCalendarGrid(calendarGrid);
        this.updateMonthDisplay(monthDisplay);
    }

    private buildActionSection(): void {
        this.actionSection = this.mainContainer.createDiv({
            cls: 'enhanced-action-section'
        });

        // Selection info
        const selectionInfo = this.actionSection.createDiv({
            cls: 'selection-info',
            text: 'No dates selected'
        });

        // Action buttons
        const actionButtons = this.actionSection.createDiv({
            cls: 'action-buttons'
        });

        const applyButton = actionButtons.createEl('button', {
            cls: 'mod-cta apply-button',
            text: 'Apply Selection'
        });
        applyButton.addEventListener('click', () => this.applySelection());

        const cancelButton = actionButtons.createEl('button', {
            cls: 'cancel-button',
            text: 'Cancel'
        });
        cancelButton.addEventListener('click', () => this.close());

        const clearButton = actionButtons.createEl('button', {
            cls: 'clear-button',
            text: 'Clear'
        });
        clearButton.addEventListener('click', () => this.clearSelection());
    }

    // Placeholder methods for enhanced navigation components
    private buildYearPicker(container: HTMLElement): void {
        const yearPickerContainer = container.createDiv({ cls: 'year-picker-container' });
        
        const yearSelect = yearPickerContainer.createEl('select', {
            cls: 'year-picker',
            attr: { 'aria-label': 'Select year' }
        });

        // Generate year options (current year ± 10 years)
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 10;
        const endYear = currentYear + 2;

        for (let year = startYear; year <= endYear; year++) {
            const option = yearSelect.createEl('option', {
                value: year.toString(),
                text: year.toString()
            });

            // Check if this year has dream entries
            const hasEntries = this.yearHasDreamEntries(year);
            if (hasEntries) {
                option.setAttribute('data-has-dreams', 'true');
                option.textContent = `${year} ●`;
            }

            if (year === this.state.currentDate.getFullYear()) {
                option.selected = true;
            }
        }

        yearSelect.addEventListener('change', () => {
            const selectedYear = parseInt(yearSelect.value);
            const newDate = new Date(this.state.currentDate);
            newDate.setFullYear(selectedYear);
            this.state.currentDate = newDate;
            this.updateCalendar();
            this.updateMonthDisplay(this.mainContainer.querySelector('.month-display') as HTMLElement);
        });
    }

    private yearHasDreamEntries(year: number): boolean {
        for (const [dateKey] of this.state.dreamEntries) {
            if (dateKey.startsWith(year.toString())) {
                return true;
            }
        }
        return false;
    }

    private buildMonthJump(container: HTMLElement): void {
        const monthJumpContainer = container.createDiv({ cls: 'month-jump-container' });
        
        const monthButton = monthJumpContainer.createEl('button', {
            cls: 'month-jump',
            text: 'Jump to Month...',
            attr: { 'aria-label': 'Open month selection menu' }
        });

        monthButton.addEventListener('click', () => {
            this.showMonthJumpMenu(monthButton);
        });
    }

    private showMonthJumpMenu(triggerButton: HTMLElement): void {
        // Remove existing menu if open
        const existingMenu = document.querySelector('.month-jump-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const menu = createDiv({ cls: 'oomp-month-jump-menu' });
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        monthNames.forEach((monthName, index) => {
            const monthOption = menu.createEl('button', {
                cls: 'oomp-month-option',
                text: monthName
            });

            // Check if this month has entries in current year
            const hasEntries = this.monthHasDreamEntries(this.state.currentDate.getFullYear(), index);
            if (hasEntries) {
                monthOption.addClass('oomp-has-entries');
                monthOption.innerHTML = `${monthName} <span class="oomp-entry-indicator">●</span>`;
            }

            if (index === this.state.currentDate.getMonth()) {
                monthOption.addClass('oomp-current-month');
            }

            monthOption.addEventListener('click', () => {
                const newDate = new Date(this.state.currentDate);
                newDate.setMonth(index);
                this.state.currentDate = newDate;
                
                // Switch to month view and update quarter toggle
                this.state.viewMode = 'month';
                const toggleInput = this.mainContainer.querySelector('.toggle-switch input') as HTMLInputElement;
                if (toggleInput) {
                    toggleInput.checked = false;
                }
                
                this.updateCalendar();
                this.updateMonthDisplay(this.mainContainer.querySelector('.month-display') as HTMLElement);
                menu.remove();
                
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Month jump - switched to month view', {
                    selectedMonth: index,
                    newDate: newDate.toISOString()
                });
            });
        });

        // Position menu relative to button using CSS utility classes
        const rect = triggerButton.getBoundingClientRect();
        menu.classList.add('oom-dropdown-absolute');
        menu.classList.add('oom-dropdown-positioned');
        menu.style.setProperty('--oom-dropdown-top', `${rect.bottom + 4}px`);
        menu.style.setProperty('--oom-dropdown-left', `${rect.left}px`);

        document.body.appendChild(menu);

        // Close menu when clicking outside
        const closeMenu = (e: MouseEvent) => {
            if (!menu.contains(e.target as Node)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }

    private monthHasDreamEntries(year: number, month: number): boolean {
        const yearMonth = `${year}-${(month + 1).toString().padStart(2, '0')}`;
        for (const [dateKey] of this.state.dreamEntries) {
            if (dateKey.startsWith(yearMonth)) {
                return true;
            }
        }
        return false;
    }

    private buildQuarterToggle(container: HTMLElement): void {
        const viewModeContainer = container.createDiv({ cls: 'view-mode-container' });
        
        const dropdown = viewModeContainer.createEl('select', {
            cls: 'view-mode-dropdown',
            attr: { 'aria-label': 'Select view mode' }
        });

        // Add options
        const monthOption = dropdown.createEl('option', {
            value: 'month',
            text: 'Single month'
        });

        const dualOption = dropdown.createEl('option', {
            value: 'dual', 
            text: 'Dual month'
        });

        const quarterOption = dropdown.createEl('option', {
            value: 'quarter',
            text: 'Quarter'
        });

        // Set current value
        dropdown.value = this.state.viewMode;

        // Handle changes
        dropdown.addEventListener('change', () => {
            const newViewMode = dropdown.value as 'month' | 'dual' | 'quarter';
            
            this.plugin.logger?.trace('EnhancedDateNavigator', 'View mode dropdown changed', {
                oldViewMode: this.state.viewMode,
                newViewMode: newViewMode
            });
            
            this.state.viewMode = newViewMode;
            
            // Update calendar based on new view mode
            switch (newViewMode) {
                case 'month':
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Switching to single month view');
                    this.updateCalendar();
                    this.announceToScreenReader('Switched to single month view');
                    break;
                case 'dual':
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Switching to dual month view');
                    this.updateDualView();
                    this.announceToScreenReader('Switched to dual month view showing current and next month');
                    break;
                case 'quarter':
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Switching to quarter view');
                    this.updateQuarterView();
                    this.announceToScreenReader('Switched to quarter view showing three months');
                    break;
            }
            
            this.plugin.logger?.info('EnhancedDateNavigator', 'View mode changed', {
                mode: this.state.viewMode
            });
        });
    }

    private updateQuarterView(): void {
        // Quarter view implementation - shows 3 months at once
        this.plugin.logger?.trace('EnhancedDateNavigator', 'updateQuarterView() called', {
            isUpdating: this.isUpdating,
            currentDate: this.state.currentDate.toISOString()
        });
        
        if (this.isUpdating) {
            this.plugin.logger?.trace('EnhancedDateNavigator', 'Skipping quarter view update - already updating');
            return;
        }
        this.isUpdating = true;

        try {
            const existingDaysGrid = this.calendarSection.querySelector('.calendar-days-grid');
            this.plugin.logger?.trace('EnhancedDateNavigator', 'DOM cleanup for quarter view', {
                existingDaysGrid: !!existingDaysGrid
            });
            
            if (existingDaysGrid) {
                existingDaysGrid.remove();
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Removed existing calendar days grid');
            }

            const calendarGrid = this.calendarSection.querySelector('.calendar-grid');
            if (!calendarGrid) {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Calendar grid not found - aborting quarter view update');
                return;
            }
            
            this.plugin.logger?.trace('EnhancedDateNavigator', 'Building quarter view grid');

            const quarterGrid = calendarGrid.createDiv({ cls: 'calendar-days-grid quarter-view' });
            
            // Get current quarter
            const currentMonth = this.state.currentDate.getMonth();
            const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
            
            // Create 3 month grids side by side
            const monthGrids: HTMLElement[] = [];
            for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
                const monthContainer = quarterGrid.createDiv({ cls: 'oomp-quarter-month' });
                const monthDate = new Date(this.state.currentDate);
                monthDate.setMonth(quarterStartMonth + monthOffset);
                
                // Month header
                const monthHeader = monthContainer.createDiv({
                    cls: 'oomp-quarter-month-header',
                    text: monthDate.toLocaleDateString('en-US', { month: 'long' })
                });

                // Compact month grid
                const monthGrid = this.buildCompactMonthGrid(monthContainer, monthDate, monthOffset);
                monthGrids.push(monthGrid);
            }
            
            // Set up inter-grid navigation
            this.setupInterGridNavigation(monthGrids);
        } finally {
            this.isUpdating = false;
        }
    }

    private updateDualView(): void {
        // Dual view implementation - shows 2 months side by side
        this.plugin.logger?.trace('EnhancedDateNavigator', 'updateDualView() called', {
            isUpdating: this.isUpdating,
            currentDate: this.state.currentDate.toISOString()
        });
        
        if (this.isUpdating) {
            this.plugin.logger?.trace('EnhancedDateNavigator', 'Skipping dual view update - already updating');
            return;
        }
        this.isUpdating = true;

        try {
            const existingDaysGrid = this.calendarSection.querySelector('.calendar-days-grid');
            this.plugin.logger?.trace('EnhancedDateNavigator', 'DOM cleanup for dual view', {
                existingDaysGrid: !!existingDaysGrid
            });
            
            if (existingDaysGrid) {
                existingDaysGrid.remove();
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Removed existing calendar days grid');
            }

            const calendarGrid = this.calendarSection.querySelector('.calendar-grid');
            if (!calendarGrid) {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Calendar grid not found - aborting dual view update');
                return;
            }
            
            this.plugin.logger?.trace('EnhancedDateNavigator', 'Building dual view grid');

            const dualGrid = calendarGrid.createDiv({ cls: 'calendar-days-grid dual-view' });
            
            // Create 2 month grids side by side (current month and next month)
            const monthGrids: HTMLElement[] = [];
            for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
                const monthContainer = dualGrid.createDiv({ cls: 'oomp-dual-month' });
                const monthDate = new Date(this.state.currentDate);
                monthDate.setMonth(this.state.currentDate.getMonth() + monthOffset);
                
                // Month header
                const monthHeader = monthContainer.createDiv({
                    cls: 'oomp-dual-month-header',
                    text: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                });

                // Compact month grid
                const monthGrid = this.buildCompactMonthGrid(monthContainer, monthDate, monthOffset);
                monthGrids.push(monthGrid);
            }
            
            // Set up inter-grid navigation
            this.setupInterGridNavigation(monthGrids);
        } finally {
            this.isUpdating = false;
        }
    }

    private buildCompactMonthGrid(container: HTMLElement, monthDate: Date, gridIndex: number = 0): HTMLElement {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        
        const monthGrid = container.createDiv({ cls: 'oomp-compact-month-grid' });
        
        // Weekday headers (abbreviated) - must match main calendar order starting with Sunday
        const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        const headerRow = monthGrid.createDiv({ cls: 'oomp-compact-header-row' });
        weekdays.forEach(day => {
            headerRow.createDiv({ cls: 'oomp-compact-weekday', text: day });
        });
        
        // Generate days for this month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const daysContainer = monthGrid.createDiv({ cls: 'oomp-compact-days-container' });
        
        // ACCESSIBILITY: Set up ARIA grid structure for compact calendar
        this.setupCompactCalendarAccessibility(daysContainer, monthDate, gridIndex);
        
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
            
            const dayEl = daysContainer.createDiv({ cls: 'oomp-compact-day' });
            
            // ACCESSIBILITY: Add ARIA gridcell structure and data attributes
            dayEl.setAttribute('role', 'gridcell');
            dayEl.setAttribute('data-date', this.formatDateForData(currentDate));
            dayEl.setAttribute('aria-label', this.formatDateForAriaLabel(currentDate));
            dayEl.setAttribute('tabindex', '-1'); // Will be set to '0' for focused cell
            
            if (currentDate.getMonth() !== month) {
                dayEl.addClass('other-month');
            }
            
            if (this.isToday(currentDate)) {
                dayEl.addClass('today');
            }
            
            dayEl.createDiv({
                cls: 'oomp-compact-day-number',
                text: currentDate.getDate().toString()
            });
            
            // Add simple dream indicator
            const dateKey = this.getDateKey(currentDate);
            if (this.state.dreamEntries.has(dateKey)) {
                const indicator = dayEl.createDiv({ cls: 'oomp-compact-dream-indicator' });
                indicator.setText('●');
            }
            
            dayEl.addEventListener('click', (e) => {
                // Handle multi-select with Ctrl key
                if (e.ctrlKey || e.metaKey) {
                    const originalMode = this.state.selectionMode;
                    this.state.selectionMode = 'multi';
                    this.handleDateClick(currentDate);
                    this.state.selectionMode = originalMode;
                } else {
                    this.handleDateClick(currentDate);
                }
            });
        }
        
        // ACCESSIBILITY: Set up roving tabindex pattern for this compact calendar
        this.setupCompactRovingTabindex(daysContainer, gridIndex);
        
        return daysContainer;
    }

    private buildGoToDate(container: HTMLElement): void {
        const goToDateContainer = container.createDiv({ cls: 'go-to-date-container' });
        
        const dateInput = goToDateContainer.createEl('input', {
            cls: 'date-input',
            attr: {
                type: 'date',
                'aria-label': 'Go to specific date',
                placeholder: 'YYYY-MM-DD'
            }
        });

        const goButton = goToDateContainer.createEl('button', {
            cls: 'go-button',
            text: 'Go',
            attr: { 'aria-label': 'Navigate to entered date' }
        });

        // Set current date as default
        dateInput.value = this.state.currentDate.toISOString().split('T')[0];

        const handleGoToDate = () => {
            const inputValue = dateInput.value.trim();
            if (!inputValue) return;

            let targetDate: Date | null = null;

            // Support various date formats
            if (/^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
                // YYYY-MM-DD format
                targetDate = new Date(inputValue + 'T00:00:00');
            } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(inputValue)) {
                // MM/DD/YYYY format
                targetDate = new Date(inputValue);
            } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(inputValue)) {
                // MM-DD-YYYY format
                const parts = inputValue.split('-');
                targetDate = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
            }

            if (targetDate && !isNaN(targetDate.getTime())) {
                this.state.currentDate = new Date(targetDate);
                this.updateCalendar();
                this.updateMonthDisplay(this.mainContainer.querySelector('.month-display') as HTMLElement);
                dateInput.value = '';
                new Notice(`Navigated to ${targetDate.toLocaleDateString()}`);
            } else {
                new Notice('Invalid date format. Use YYYY-MM-DD, MM/DD/YYYY, or MM-DD-YYYY');
            }
        };

        dateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleGoToDate();
            }
        });

        goButton.addEventListener('click', handleGoToDate);

        // Update button state based on input
        dateInput.addEventListener('input', () => {
            if (dateInput.value.trim()) {
                goButton.disabled = false;
            } else {
                goButton.disabled = true;
            }
        });
    }

    private buildCalendarGrid(container: HTMLElement): void {
        // Basic calendar grid - will be enhanced with pattern visualization
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Weekday headers
        const headerRow = container.createDiv({ cls: 'calendar-header-row' });
        weekdays.forEach(day => {
            headerRow.createDiv({
                cls: 'calendar-weekday',
                text: day
            });
        });

        // Calendar days will be added by updateCalendar method
        this.updateCalendar();
    }

    private updateCalendar(): void {
        if (this.isUpdating) return;
        this.isUpdating = true;

        try {
            // Remove existing calendar days
            const existingDaysGrid = this.calendarSection.querySelector('.calendar-days-grid');
            if (existingDaysGrid) {
                existingDaysGrid.remove();
            }

            // Create new days grid
            const calendarGrid = this.calendarSection.querySelector('.calendar-grid');
            if (!calendarGrid) return;

            const daysGrid = calendarGrid.createDiv({ cls: 'calendar-days-grid' });
            
            // ACCESSIBILITY: Set up ARIA grid structure and keyboard navigation
            this.setupCalendarAccessibility(daysGrid);

            // Generate calendar days for current month
            const year = this.state.currentDate.getFullYear();
            const month = this.state.currentDate.getMonth();
            
            // Get first day of month and calculate grid
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

            // Generate 42 days (6 weeks)
            for (let i = 0; i < 42; i++) {
                const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
                
                const dayEl = daysGrid.createDiv({ cls: 'calendar-day' });
                
                // ACCESSIBILITY: Add ARIA gridcell structure and data attributes
                dayEl.setAttribute('role', 'gridcell');
                dayEl.setAttribute('data-date', this.formatDateForData(currentDate));
                dayEl.setAttribute('aria-label', this.formatDateForAriaLabel(currentDate));
                dayEl.setAttribute('tabindex', '-1'); // Will be set to '0' for focused cell
                
                // Add classes for styling
                if (currentDate.getMonth() !== month) {
                    dayEl.addClass('other-month');
                }
                
                if (this.isToday(currentDate)) {
                    dayEl.addClass('today');
                }

                // Add day number
                const dayNumber = dayEl.createDiv({
                    cls: 'day-number',
                    text: currentDate.getDate().toString()
                });

                // Add pattern visualization for dream entries
                const dateKey = this.getDateKey(currentDate);
                
                if (this.state.dreamEntries.has(dateKey)) {
                    const entries = this.state.dreamEntries.get(dateKey) || [];
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Found dream entries for date', {
                        dateKey,
                        entriesCount: entries.length,
                        currentVisualizationStyle: this.state.visualizationStyle
                    });
                    this.renderPatternVisualization(dayEl, entries);
                } else {
                    // Only log occasionally to avoid spam
                    if (i === 0) {
                        this.plugin.logger?.trace('EnhancedDateNavigator', 'No dream entries found for dates in this calendar view');
                    }
                }

                // Add click handler for date selection
                // Add click handler
                dayEl.addEventListener('click', (e) => {
                    // Handle multi-select with Ctrl key
                    if (e.ctrlKey || e.metaKey) {
                        const originalMode = this.state.selectionMode;
                        this.state.selectionMode = 'multi';
                        this.handleDateClick(currentDate);
                        this.state.selectionMode = originalMode;
                    } else {
                        this.handleDateClick(currentDate);
                    }
                });

                // Add drag selection support
                this.setupDragSelection(dayEl, currentDate);
            }
            
            // ACCESSIBILITY: Set up roving tabindex pattern after all day cells are created
            this.setupRovingTabindex(daysGrid);
            
        } finally {
            this.isUpdating = false;
        }
    }

    private isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    private handleDateClick(date: Date): void {
        const isSameAsSelected = this.state.selectedDates.some(selected => 
            this.isSameDay(selected, date));

        if (this.state.selectionMode === 'single') {
            this.state.selectedDates = [date];
        } else if (this.state.selectionMode === 'range') {
            // Handle range selection with click-drag support
            this.handleRangeSelection(date);
        } else if (this.state.selectionMode === 'multi') {
            // Handle multi-select with Ctrl+click
            this.handleMultiSelection(date);
        }

        this.updateCalendarVisualState();
        this.updateSelectionInfo();
    }

    private handleRangeSelection(date: Date): void {
        if (this.state.selectedDates.length === 0) {
            // First click - start range
            this.state.selectedDates = [date];
            this.rangeStart = date;
        } else if (this.state.selectedDates.length === 1) {
            // Second click - complete range
            const startDate = this.state.selectedDates[0];
            const endDate = date;
            
            if (this.isSameDay(startDate, endDate)) {
                // Same date clicked - keep single selection
                this.state.selectedDates = [date];
            } else {
                // Create date range
                this.state.selectedDates = this.createDateRange(startDate, endDate);
            }
            this.rangeStart = null;
        } else {
            // Multiple dates selected - start new range
            this.state.selectedDates = [date];
            this.rangeStart = date;
        }
    }

    private handleMultiSelection(date: Date): void {
        const existingIndex = this.state.selectedDates.findIndex(selected => 
            this.isSameDay(selected, date));

        if (existingIndex >= 0) {
            // Remove if already selected
            this.state.selectedDates.splice(existingIndex, 1);
        } else {
            // Add to selection
            this.state.selectedDates.push(date);
            // Sort dates for consistent ordering
            this.state.selectedDates.sort((a, b) => a.getTime() - b.getTime());
        }
    }

    private createDateRange(startDate: Date, endDate: Date): Date[] {
        const dates: Date[] = [];
        const start = new Date(Math.min(startDate.getTime(), endDate.getTime()));
        const end = new Date(Math.max(startDate.getTime(), endDate.getTime()));
        
        const current = new Date(start);
        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        
        return dates;
    }

    // Add drag selection support
    private isDragging: boolean = false;
    private dragStartDate: Date | null = null;
    private rangeStart: Date | null = null;

    private setupDragSelection(dayElement: HTMLElement, date: Date): void {
        // Mouse down - start drag
        dayElement.addEventListener('mousedown', (e) => {
            if (this.state.selectionMode !== 'range') return;
            
            e.preventDefault();
            this.isDragging = true;
            this.dragStartDate = date;
            this.rangeStart = date;
            
            // Temporarily set selection to start date
            this.state.selectedDates = [date];
            this.updateCalendarVisualState();
            
            // Add document listeners for drag completion
            document.addEventListener('mouseup', this.handleDragEnd);
        });

        // Mouse enter - update drag selection
        dayElement.addEventListener('mouseenter', () => {
            if (!this.isDragging || !this.dragStartDate || this.state.selectionMode !== 'range') return;
            
            // Update selection to show current drag range
            this.state.selectedDates = this.createDateRange(this.dragStartDate, date);
            this.updateCalendarVisualState();
        });
    }

    private handleDragEnd = () => {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.dragStartDate = null;
        
        // Remove document listeners
        document.removeEventListener('mouseup', this.handleDragEnd);
        
        // Final visual update
        this.updateCalendarVisualState();
        this.updateSelectionInfo();
    };

    // Add selection mode switching
    private setSelectionMode(mode: 'single' | 'range' | 'multi'): void {
        if (this.state.selectionMode === mode) return;
        
        this.state.selectionMode = mode;
        
        // Clear selection when changing modes
        this.state.selectedDates = [];
        this.rangeStart = null;
        
        this.updateCalendarVisualState();
        this.updateSelectionInfo();
        this.updateSelectionModeUI();
    }

    private updateSelectionModeUI(): void {
        // Update selection mode buttons/indicators
        const modeButtons = this.contentEl.querySelectorAll('.selection-mode-btn');
        modeButtons.forEach(btn => {
            const btnMode = btn.getAttribute('data-mode');
            if (btnMode === this.state.selectionMode) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    }

    private updateSelectionInfo(): void {
        const selectionInfo = this.contentEl.querySelector('.selection-info');
        if (!selectionInfo) return;
        
        const count = this.state.selectedDates.length;
        let infoText = '';
        
        if (count === 0) {
            infoText = 'No dates selected';
        } else if (count === 1) {
            const date = this.state.selectedDates[0];
            infoText = `Selected: ${date.toLocaleDateString()}`;
        } else {
            const sortedDates = [...this.state.selectedDates].sort((a, b) => a.getTime() - b.getTime());
            const startDate = sortedDates[0];
            const endDate = sortedDates[sortedDates.length - 1];
            
            if (this.state.selectionMode === 'range') {
                infoText = `Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()} (${count} days)`;
            } else {
                infoText = `Selected: ${count} dates`;
            }
        }
        
        selectionInfo.textContent = infoText;
    }

    private isSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    private updateCalendarVisualState(): void {
        // Update visual state of main calendar days (single month view)
        const dayElements = this.calendarSection.querySelectorAll('.calendar-day');
        dayElements.forEach((dayEl: HTMLElement) => {
            dayEl.removeClass('selected');
        });

        // Mark selected dates in main calendar
        this.state.selectedDates.forEach(selectedDate => {
            const dateIndex = this.getDateIndex(selectedDate);
            if (dateIndex >= 0 && dateIndex < dayElements.length) {
                dayElements[dateIndex].addClass('selected');
            }
        });

        // Update visual state of compact calendar days (dual/quarter views)
        const compactDayElements = this.calendarSection.querySelectorAll('.oomp-compact-day');
        compactDayElements.forEach((dayEl: HTMLElement) => {
            dayEl.removeClass('selected');
            
            // Check if this compact day represents a selected date
            const dateAttr = dayEl.getAttribute('data-date');
            if (dateAttr) {
                const compactDate = new Date(dateAttr);
                const isSelected = this.state.selectedDates.some(selectedDate => 
                    this.isSameDay(selectedDate, compactDate));
                
                if (isSelected) {
                    dayEl.addClass('selected');
                }
            }
        });
    }

    private getDateIndex(targetDate: Date): number {
        const year = this.state.currentDate.getFullYear();
        const month = this.state.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const diffTime = targetDate.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    private updateMonthDisplay(container: HTMLElement): void {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const month = monthNames[this.state.currentDate.getMonth()];
        const year = this.state.currentDate.getFullYear();
        container.setText(`${month} ${year}`);
    }

    private navigateMonth(direction: number): void {
        const newDate = new Date(this.state.currentDate);
        newDate.setMonth(newDate.getMonth() + direction);
        this.state.currentDate = newDate;
        this.updateCalendar();
        this.updateMonthDisplay(this.mainContainer.querySelector('.month-display') as HTMLElement);
    }

    private loadDreamData(): void {
        // Add structured logging for debugging
        this.plugin.logger?.trace('EnhancedDateNavigator', 'loadDreamData() called');
        
        let dreamEntries: any[] = [];
        
        // STRATEGY 1: Try plugin state.getDreamEntries()
        try {
            const stateEntries = this.plugin.state?.getDreamEntries();
            if (stateEntries && Array.isArray(stateEntries) && stateEntries.length > 0) {
                dreamEntries = stateEntries;
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Strategy 1 success - plugin.state.getDreamEntries()', {
                    entriesCount: dreamEntries.length
                });
            } else {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Strategy 1 failed - plugin.state.getDreamEntries()', {
                    entriesCount: stateEntries?.length || 0
                });
            }
        } catch (error) {
            this.plugin.logger?.trace('EnhancedDateNavigator', 'Strategy 1 error', { error });
        }
        
        // STRATEGY 2: Try plugin state.entries (direct)
        if (dreamEntries.length === 0) {
            try {
                const directEntries = (this.plugin.state as any)?.entries;
                if (directEntries && Array.isArray(directEntries) && directEntries.length > 0) {
                    dreamEntries = directEntries;
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Strategy 2 success - plugin.state.entries', {
                        entriesCount: dreamEntries.length
                    });
                } else {
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Strategy 2 failed - plugin.state.entries', {
                        entriesCount: directEntries?.length || 0
                    });
                }
            } catch (error) {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Strategy 2 error', { error });
            }
        }
        
        // STRATEGY 3: Try global plugin access
        if (dreamEntries.length === 0) {
            try {
                const globalPlugin = (window as any).oneiroMetricsPlugin;
                if (globalPlugin?.state?.getDreamEntries) {
                    const globalEntries = globalPlugin.state.getDreamEntries();
                    if (globalEntries && Array.isArray(globalEntries) && globalEntries.length > 0) {
                        dreamEntries = globalEntries;
                        this.plugin.logger?.trace('EnhancedDateNavigator', 'Strategy 3 success - global plugin.state.getDreamEntries()', {
                            entriesCount: dreamEntries.length
                        });
                    } else {
                        this.plugin.logger?.trace('EnhancedDateNavigator', 'Strategy 3 failed - global entries', {
                            entriesCount: globalEntries?.length || 0
                        });
                    }
                } else {
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Strategy 3 unavailable - no global plugin or getDreamEntries method');
                }
            } catch (error) {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Strategy 3 error', { error });
            }
        }
        
        // STRATEGY 4: Extract from DOM tables (last resort)
        if (dreamEntries.length === 0) {
            try {
                dreamEntries = this.extractEntriesFromDOMTable();
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Strategy 4 result - DOM extraction', {
                    entriesCount: dreamEntries.length
                });
            } catch (error) {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Strategy 4 error', { error });
            }
        }
        
        this.plugin.logger?.trace('EnhancedDateNavigator', 'Final dream entries result', {
            totalEntries: dreamEntries.length
        });
        
        if (dreamEntries && dreamEntries.length > 0) {
            // Group entries by date
            this.state.dreamEntries.clear();
            let validEntries = 0;
            let invalidEntries = 0;
            
            dreamEntries.forEach(entry => {
                try {
                    const dateKey = this.getDateKey(new Date(entry.date));
                    if (dateKey) { // Only process entries with valid dates
                        if (!this.state.dreamEntries.has(dateKey)) {
                            this.state.dreamEntries.set(dateKey, []);
                        }
                        this.state.dreamEntries.get(dateKey)?.push(entry);
                        validEntries++;
                    } else {
                        invalidEntries++;
                        this.plugin.logger?.trace('EnhancedDateNavigator', 'Skipping entry with invalid date', {
                            entryDate: entry.date,
                            entryTitle: entry.title || 'no title'
                        });
                    }
                } catch (error) {
                    invalidEntries++;
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Error processing entry date', {
                        entryDate: entry.date,
                        error
                    });
                }
            });
            
            this.plugin.logger?.trace('EnhancedDateNavigator', 'Dream entries grouped by date', {
                totalEntries: dreamEntries.length,
                validEntries,
                invalidEntries,
                uniqueDates: this.state.dreamEntries.size,
                visualizationStyle: this.state.visualizationStyle,
                firstFewDates: Array.from(this.state.dreamEntries.keys()).slice(0, 5)
            });
            
            if (validEntries > 0) {
                this.plugin.logger?.info('EnhancedDateNavigator', 'Dream data loaded successfully', {
                    totalEntries: dreamEntries.length,
                    validEntries,
                    uniqueDates: this.state.dreamEntries.size,
                    visualizationStyle: this.state.visualizationStyle
                });
                
                // Debug logging for pattern visualization
                this.debugPatternVisualization();
            } else {
                this.plugin.logger?.warn('EnhancedDateNavigator', 'No valid dream entries found', {
                    totalEntries: dreamEntries.length,
                    invalidEntries
                });
            }
        } else {
            this.plugin.logger?.trace('EnhancedDateNavigator', 'No dream entries found after trying all strategies');
            this.plugin.logger?.warn('EnhancedDateNavigator', 'No dream entries found in plugin state');
        }
    }
    
    /**
     * Extract dream entries from the current metrics table in the DOM
     */
    private extractEntriesFromDOMTable(): any[] {
        const entries: any[] = [];
        
        // Add comprehensive DOM inspection
        this.plugin.logger?.trace('EnhancedDateNavigator', 'DOM INSPECTION: Starting comprehensive DOM scan');
        
        // Check for different possible container selectors
        const possibleContainers = [
            '.oom-metrics-container',
            '.oom-container',
            '.metrics-container',
            '.oneiro-metrics',
            '.dream-metrics'
        ];
        
        let metricsContainer: Element | null = null;
        for (const selector of possibleContainers) {
            const container = document.querySelector(selector);
            if (container) {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Found container with selector', {
                    selector,
                    className: container.className
                });
                metricsContainer = container;
                break;
            }
        }
        
        if (!metricsContainer) {
            // Look for any element containing "metric" in its class
            const anyMetricElements = document.querySelectorAll('[class*="metric"]');
            const tables = document.querySelectorAll('table');
            const oomElements = document.querySelectorAll('[class*="oom"]');
            
            // Sample some classes from the document
            const allElements = document.querySelectorAll('*');
            const sampleClasses = Array.from(allElements)
                .slice(0, 50)
                .map(el => el.className)
                .filter(className => className && typeof className === 'string')
                .slice(0, 10);
            
            this.plugin.logger?.trace('EnhancedDateNavigator', 'DOM extraction: No metrics container found', {
                metricElementsCount: anyMetricElements.length,
                tablesCount: tables.length,
                oomElementsCount: oomElements.length,
                sampleClasses
            });
            
            return entries;
        }
        
        this.plugin.logger?.trace('EnhancedDateNavigator', 'DOM extraction: Found metrics container', {
            className: metricsContainer.className
        });
        
        // Look for the actual dream entries table, not the summary table
        // The summary table has headers like "Metric", "Average", "Min", "Max", "Count"
        // The entries table should have individual dream entries with dates
        
        let entriesTable: Element | null = null;
        
        // Try to find a table that looks like it contains individual entries with dates
        // Check if it has rows that might contain dates
        const tables = metricsContainer.querySelectorAll('table');
        this.plugin.logger?.trace('EnhancedDateNavigator', 'Found tables in container', {
            tablesCount: tables.length
        });
        
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            const firstRow = table.querySelector('tr');
            const headerText = firstRow?.textContent?.toLowerCase() || '';
            
            const hasDateColumn = headerText.includes('date');
            const hasMetricSummary = headerText.includes('average') && headerText.includes('min') && headerText.includes('max');
            
            this.plugin.logger?.trace('EnhancedDateNavigator', 'Examining table', {
                tableIndex: i,
                headerText: headerText.substring(0, 100),
                hasDateColumn,
                hasMetricSummary
            });
            
            // Skip the summary table (has "Average", "Min", "Max", "Count" headers)
            if (hasMetricSummary) {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Skipping summary table', { tableIndex: i });
                continue;
            }
            
            // Select table if it has a date column and is not a summary table
            if (hasDateColumn) {
                entriesTable = table;
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Selected table as entries table', { 
                    tableIndex: i,
                    reason: 'has date column and is not summary table'
                });
                break;
            }
            
            // Fallback: Look for a table that might contain individual entries
            // Check if it has rows that might contain dates
            const rows = table.querySelectorAll('tr');
            let hasDateLikeContent = false;
            
            // Check first few data rows (skip header)
            for (let rowIndex = 1; rowIndex < Math.min(rows.length, 5); rowIndex++) {
                const row = rows[rowIndex];
                const rowText = row.textContent || '';
                
                // Look for date patterns (YYYY-MM-DD, MM/DD/YYYY, etc.)
                const datePattern = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/;
                if (datePattern.test(rowText)) {
                    hasDateLikeContent = true;
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Found date-like content in table', {
                        tableIndex: i,
                        rowIndex,
                        rowText: rowText.substring(0, 100)
                    });
                    break;
                }
            }
            
            if (hasDateLikeContent) {
                entriesTable = table;
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Selected table as entries table', { 
                    tableIndex: i,
                    reason: 'found date-like content in rows'
                });
                break;
            }
        }
        
        if (!entriesTable) {
            this.plugin.logger?.trace('EnhancedDateNavigator', 'No entries table found, trying fallback approach');
            
            // Fallback: Look for any elements that might contain dream entries
            // Look for elements with classes that suggest they contain individual entries
            const possibleEntrySelectors = [
                '.oom-metrics-row',
                '.dream-entry',
                '.entry-row',
                '[class*="entry"]',
                '[class*="dream"]'
            ];
            
            for (const selector of possibleEntrySelectors) {
                const elements = metricsContainer.querySelectorAll(selector);
                if (elements.length > 0) {
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Found potential entry elements', {
                        selector,
                        count: elements.length
                    });
                    
                    // Check if these elements contain date-like content
                    let foundDates = 0;
                    for (let i = 0; i < Math.min(elements.length, 5); i++) {
                        const element = elements[i];
                        const text = element.textContent || '';
                        const datePattern = /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/;
                        if (datePattern.test(text)) {
                            foundDates++;
                        }
                    }
                    
                    if (foundDates > 0) {
                        this.plugin.logger?.trace('EnhancedDateNavigator', 'Found entries with dates', {
                            selector,
                            entriesWithDates: foundDates,
                            totalEntries: elements.length
                        });
                        
                        // Process these elements as entries
                        return this.extractFromElements(elements);
                    }
                }
            }
            
            this.plugin.logger?.trace('EnhancedDateNavigator', 'No suitable entries found in DOM');
            return entries;
        }
        
        // Extract from the identified entries table
        const rows = entriesTable.querySelectorAll('tr');
        this.plugin.logger?.trace('EnhancedDateNavigator', 'Processing entries table', {
            rowsCount: rows.length
        });
        
        // Skip the header row (index 0)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const entry = this.extractEntryFromRow(row, i);
            if (entry) {
                entries.push(entry);
            }
        }
        
        this.plugin.logger?.trace('EnhancedDateNavigator', 'DOM extraction completed', {
            entriesExtracted: entries.length,
            sampleEntry: entries.length > 0 ? {
                date: entries[0].date,
                metricsCount: Object.keys(entries[0].metrics).length,
                metricNames: Object.keys(entries[0].metrics)
            } : null
        });
        
        return entries;
    }
    
    /**
     * Extract entries from a collection of DOM elements
     */
    private extractFromElements(elements: NodeListOf<Element>): any[] {
        const entries: any[] = [];
        
        elements.forEach((element, index) => {
            const entry = this.extractEntryFromRow(element, index);
            if (entry) {
                entries.push(entry);
            }
        });
        
        return entries;
    }
    
    /**
     * Extract a single entry from a table row or element
     */
    private extractEntryFromRow(row: Element, index: number): any | null {
        // Add debugging for first few rows
        if (index < 5) {
            this.plugin.logger?.trace('EnhancedDateNavigator', 'Processing row', {
                rowIndex: index,
                rowHTML: row.innerHTML.substring(0, 300),
                rowClasses: row.className,
                rowTextContent: row.textContent?.substring(0, 200)
            });
        }
        
        // Try different date cell selectors
        const possibleDateSelectors = [
            '.oom-date-cell',
            '.oom-date',
            '.date-cell',
            '.date',
            'td:first-child',
            '[class*="date"]'
        ];
        
        let date: string | null = null;
        
        for (const selector of possibleDateSelectors) {
            const cell = row.querySelector(selector);
            if (cell && cell.textContent?.trim()) {
                const cellText = cell.textContent.trim();
                
                if (index < 5) {
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Checking date selector', {
                        rowIndex: index,
                        selector,
                        cellText: cellText.substring(0, 50),
                        cellHTML: cell.innerHTML.substring(0, 100),
                        hasDataIsoDate: !!cell.getAttribute('data-iso-date'),
                        dataIsoDate: cell.getAttribute('data-iso-date')
                    });
                }
                
                // Priority 1: Use data-iso-date attribute if available (most reliable)
                const isoDate = cell.getAttribute('data-iso-date');
                if (isoDate) {
                    date = isoDate;
                    if (index < 5) {
                        this.plugin.logger?.trace('EnhancedDateNavigator', 'Found date using data-iso-date attribute', {
                            rowIndex: index,
                            selector,
                            isoDate
                        });
                    }
                    break;
                }
                
                // Priority 2: Check if cell text matches date patterns
                // Enhanced patterns to include "Month DD, YYYY" format
                const datePatterns = [
                    /\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
                    /\d{1,2}\/\d{1,2}\/\d{4}/, // M/D/YYYY
                    /\d{1,2}-\d{1,2}-\d{4}/, // M-D-YYYY
                    /[A-Za-z]{3}\s+\d{1,2},\s+\d{4}/ // Mon DD, YYYY (like "Sep 16, 1990")
                ];
                
                for (const pattern of datePatterns) {
                    if (pattern.test(cellText)) {
                        // For "Month DD, YYYY" format, we need to convert to ISO format
                        if (pattern.source.includes('[A-Za-z]')) {
                            // Parse the "Month DD, YYYY" format and convert to ISO
                            try {
                                const parsedDate = new Date(cellText);
                                if (!isNaN(parsedDate.getTime())) {
                                    date = parsedDate.toISOString().split('T')[0];
                                    if (index < 5) {
                                        this.plugin.logger?.trace('EnhancedDateNavigator', 'Converted Month DD, YYYY to ISO', {
                                            rowIndex: index,
                                            originalText: cellText,
                                            isoDate: date
                                        });
                                    }
                                    break;
                                }
                            } catch (error) {
                                if (index < 5) {
                                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Failed to parse Month DD, YYYY', {
                                        rowIndex: index,
                                        cellText,
                                        error
                                    });
                                }
                                continue;
                            }
                        } else {
                            // Use the text as-is for other formats
                            date = cellText;
                            if (index < 5) {
                                this.plugin.logger?.trace('EnhancedDateNavigator', 'Found date with pattern', {
                                    rowIndex: index,
                                    selector,
                                    date,
                                    pattern: pattern.source
                                });
                            }
                            break;
                        }
                    }
                }
                
                if (date) {
                    break; // Found a valid date, stop checking other selectors
                }
                
                if (index < 5) {
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Date patterns did not match', {
                        rowIndex: index,
                        selector,
                        cellText: cellText.substring(0, 50),
                        patterns: datePatterns.map(p => p.source)
                    });
                }
            } else {
                if (index < 5) {
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'No cell found or empty', {
                        rowIndex: index,
                        selector,
                        cellExists: !!cell,
                        cellText: cell?.textContent?.trim() || 'empty'
                    });
                }
            }
        }
        
        if (!date && row.textContent) {
            // Try to extract date-like text from anywhere in the row using enhanced patterns
            const fallbackPatterns = [
                /\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
                /[A-Za-z]{3}\s+\d{1,2},\s+\d{4}/ // Mon DD, YYYY (like "Sep 16, 1990")
            ];
            
            for (const pattern of fallbackPatterns) {
                const match = row.textContent.match(pattern);
                if (match) {
                    const matchedText = match[0];
                    
                    // For "Month DD, YYYY" format, convert to ISO format
                    if (pattern.source.includes('[A-Za-z]')) {
                        try {
                            const parsedDate = new Date(matchedText);
                            if (!isNaN(parsedDate.getTime())) {
                                date = parsedDate.toISOString().split('T')[0];
                                if (index < 5) {
                                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Fallback: Converted Month DD, YYYY to ISO', {
                                        rowIndex: index,
                                        originalText: matchedText,
                                        isoDate: date,
                                        rowText: row.textContent.substring(0, 100)
                                    });
                                }
                                break;
                            }
                        } catch (error) {
                            if (index < 5) {
                                this.plugin.logger?.trace('EnhancedDateNavigator', 'Fallback: Failed to parse Month DD, YYYY', {
                                    rowIndex: index,
                                    matchedText,
                                    error
                                });
                            }
                            continue;
                        }
                    } else {
                        // Use ISO format as-is
                        date = matchedText;
                        if (index < 5) {
                            this.plugin.logger?.trace('EnhancedDateNavigator', 'Fallback: Found ISO date via regex', {
                                rowIndex: index,
                                date,
                                rowText: row.textContent.substring(0, 100)
                            });
                        }
                        break;
                    }
                }
            }
            
            if (!date && index < 5) {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Fallback: No date found via regex', {
                    rowIndex: index,
                    rowText: row.textContent.substring(0, 100),
                    patterns: fallbackPatterns.map(p => p.source)
                });
            }
        }
        
        if (!date) {
            // No valid date found in this row
            if (index < 5) {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'No valid date found in row', {
                    rowIndex: index
                });
            }
            return null;
        }
        
        // Extract metrics from the row
        const metrics: any = {};
        
        // Look for metric cells with various patterns
        const metricSelectors = [
            '[class*="oom-metric-"]',
            '[class*="metric-"]',
            'td[class*="metric"]',
            '.metric'
        ];
        
        metricSelectors.forEach(selector => {
            const metricCells = row.querySelectorAll(selector);
            metricCells.forEach(cell => {
                const classList = Array.from(cell.classList);
                const metricClass = classList.find(cls => 
                    cls.includes('metric') && cls !== 'metric'
                );
                if (metricClass) {
                    const metricName = metricClass
                        .replace(/oom-metric-|metric-/, '')
                        .replace(/-/g, ' ');
                    const value = cell.textContent?.trim();
                    if (value && !isNaN(Number(value))) {
                        metrics[metricName] = Number(value);
                    }
                }
            });
        });
        
        const entry = {
            date: date,
            title: `Dream Entry ${index + 1}`,
            content: '',
            source: 'dom-extraction',
            metrics: metrics
        };
        
        if (index < 5) {
            this.plugin.logger?.trace('EnhancedDateNavigator', 'DOM extraction: Extracted entry', {
                rowIndex: index,
                date,
                metricsCount: Object.keys(metrics).length,
                metricNames: Object.keys(metrics)
            });
        }
        
        return entry;
    }

    /**
     * Debug method to log pattern visualization state
     */
    private debugPatternVisualization(): void {
        const dreamEntries = Array.from(this.state.dreamEntries.entries()).slice(0, 3); // First 3 dates
        
        dreamEntries.forEach(([dateKey, entries]) => {
            this.plugin.logger?.trace('EnhancedDateNavigator', 'Debug pattern visualization', {
                dateKey,
                entriesCount: entries.length,
                firstEntry: {
                    title: entries[0]?.title,
                    hasMetrics: !!entries[0]?.metrics,
                    metrics: entries[0]?.metrics ? Object.keys(entries[0].metrics) : [],
                    sampleMetrics: entries[0]?.metrics ? {
                        'Sensory Detail': entries[0].metrics['Sensory Detail'],
                        'Emotional Recall': entries[0].metrics['Emotional Recall'],
                        'Lost Segments': entries[0].metrics['Lost Segments'],
                        'Descriptiveness': entries[0].metrics['Descriptiveness'],
                        'Confidence Score': entries[0].metrics['Confidence Score']
                    } : null
                },
                visualizationStyle: this.state.visualizationStyle
            });
            
            // Test pattern calculation
            if (entries[0]) {
                try {
                    const pattern = this.patternCalculator.calculateBasePattern(entries[0]);
                    this.plugin.logger?.trace('EnhancedDateNavigator', 'Pattern calculation result', {
                        dateKey,
                        pattern: pattern.basePattern,
                        qualityScore: pattern.qualityScore,
                        fragmentationLevel: pattern.fragmentationLevel,
                        visualStyle: pattern.visualStyle
                    });
                } catch (error) {
                    this.plugin.logger?.error('EnhancedDateNavigator', 'Pattern calculation failed', {
                        dateKey,
                        error
                    });
                }
            }
        });
    }

    private getDateKey(date: Date): string {
        try {
            // Check if date is valid
            if (!(date instanceof Date) || isNaN(date.getTime())) {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Invalid date provided to getDateKey', {
                    date: date,
                    type: typeof date
                });
                return '';
            }
            return date.toISOString().split('T')[0];
        } catch (error) {
            this.plugin.logger?.trace('EnhancedDateNavigator', 'Error in getDateKey', {
                date: date,
                error: error
            });
            return '';
        }
    }

    private applySelection(): void {
        if (this.state.selectedDates.length === 0) {
            new Notice('No dates selected');
            return;
        }

        try {
            if (this.state.selectedDates.length === 1) {
                this.applySingleDateFilter();
            } else {
                this.applyDateRangeFilter();
            }
        } catch (error) {
            safeLogger.error('EnhancedDateNavigatorModal', 'Error applying selection', error);
            new Notice('Error applying filter. Please try again.');
        }
    }

    private applySingleDateFilter(): void {
        const date = this.state.selectedDates[0];
        
        if (!date) {
            new Notice('Invalid date selection');
            return;
        }

        // Format as YYYY-MM-DD string for consistent filtering
        const dateStr = date.toISOString().split('T')[0];
        
        // Apply filter through TimeFilterManager
        if (this.timeFilterManager) {
            this.timeFilterManager.setCustomRange(date, date);
        }
        
        // Apply filter through FilterUI directly
        this.applyFilterToUI(dateStr, dateStr);
        
        new Notice(`Filtered for ${dateStr}`);
        this.close();
    }

    private applyDateRangeFilter(): void {
        const dates = [...this.state.selectedDates]
            .sort((a, b) => a.getTime() - b.getTime());

        if (dates.length < 2) {
            new Notice('Invalid date range selection');
            return;
        }

        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        // Format as YYYY-MM-DD strings for consistent filtering
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        // Apply filter through TimeFilterManager
        if (this.timeFilterManager) {
            this.timeFilterManager.setCustomRange(startDate, endDate);
        }
        
        // Apply filter through FilterUI directly
        this.applyFilterToUI(startDateStr, endDateStr);
        
        const dayCount = dates.length;
        new Notice(`Filtered for ${dayCount} selected dates (${startDateStr} to ${endDateStr})`);
        this.close();
    }

    private applyFilterToUI(startDateStr: string, endDateStr: string): void {
        // Get the metrics container
        const metricsContainer = document.querySelector('.oom-metrics-container') as HTMLElement;
        if (!metricsContainer) {
            safeLogger.warn('EnhancedDateNavigatorModal', 'Metrics container not found');
            return;
        }

        // Get the FilterUI instance from the global plugin
        const plugin = (window as any).oneiroMetricsPlugin;
        if (!plugin || !plugin.filterUI) {
            safeLogger.warn('EnhancedDateNavigatorModal', 'FilterUI not available, using fallback');
            this.applyFilterFallback(metricsContainer, startDateStr, endDateStr);
            return;
        }

        try {
            // Set the custom date range in FilterUI
            plugin.filterUI.setCustomDateRange({ start: startDateStr, end: endDateStr });
            
            // Update the filter dropdown to show 'custom' selection
            const filterDropdown = metricsContainer.querySelector('#oom-date-range-filter') as HTMLSelectElement;
            if (filterDropdown) {
                // Ensure 'custom' option exists
                if (!Array.from(filterDropdown.options).find(opt => opt.value === 'custom')) {
                    const customOption = document.createElement('option');
                    customOption.value = 'custom';
                    customOption.textContent = 'Custom Range';
                    filterDropdown.appendChild(customOption);
                }
                
                filterDropdown.value = 'custom';
                
                // Apply filters through FilterUI with delay (same as regular dropdown)
                setTimeout(() => {
                    plugin.filterUI.applyFilters(metricsContainer);
                }, 50);
                
                // Update the filter display with a small delay to ensure it happens after automatic update
                setTimeout(() => {
                    const filterDisplayManager = plugin.filterDisplayManager;
                    if (filterDisplayManager) {
                        const visibleRows = metricsContainer.querySelectorAll('.oom-metrics-row:not([style*="display: none"])').length;
                        filterDisplayManager.updateCustomRangeDisplay(
                            metricsContainer, 
                            startDateStr, 
                            endDateStr,
                            visibleRows
                        );
                    } else {
                        // Fallback: Update the filter display directly
                        this.updateFilterDisplay(metricsContainer, startDateStr, endDateStr);
                    }
                }, 100);
            }
        } catch (error) {
            safeLogger.error('EnhancedDateNavigatorModal', 'Error applying filter through FilterUI', error);
            this.applyFilterFallback(metricsContainer, startDateStr, endDateStr);
        }
    }

    private applyFilterFallback(metricsContainer: HTMLElement, startDateStr: string, endDateStr: string): void {
        // Set global custom date range for filtering
        (window as any).customDateRange = { start: startDateStr, end: endDateStr };
        
        // Trigger filter change through dropdown
        const filterDropdown = metricsContainer.querySelector('#oom-date-range-filter') as HTMLSelectElement;
        if (filterDropdown) {
            // Ensure 'custom' option exists
            if (!Array.from(filterDropdown.options).find(opt => opt.value === 'custom')) {
                const customOption = document.createElement('option');
                customOption.value = 'custom';
                customOption.textContent = 'Custom Range';
                filterDropdown.appendChild(customOption);
            }
            
            filterDropdown.value = 'custom';
            filterDropdown.dispatchEvent(new Event('change'));
        }
        
        // Update the filter display
        this.updateFilterDisplay(metricsContainer, startDateStr, endDateStr);
    }

    private updateFilterDisplay(metricsContainer: HTMLElement, startDateStr: string, endDateStr: string): void {
        const filterDisplay = metricsContainer.querySelector('#oom-time-filter-display');
        if (filterDisplay) {
            const displayText = startDateStr === endDateStr 
                ? `Single Date: ${startDateStr}`
                : `Custom Range: ${startDateStr} to ${endDateStr}`;
                
            filterDisplay.innerHTML = `
                <span class="oom-filter-icon">🗓️</span>
                <span class="oom-filter-text oom-filter--custom">${displayText}</span>
            `;
            filterDisplay.classList.add('oom-filter-active');
        }
    }

    private parseDateKey(dateKey: string): Date | null {
        try {
            const [year, month, day] = dateKey.split('-').map(Number);
            return new Date(year, month - 1, day);
        } catch {
            return null;
        }
    }

    private clearSelection(): void {
        this.state.selectedDates = [];
        this.updateCalendarVisualState();
        this.updateSelectionInfo();
    }

    private cleanup(): void {
        // Clean up any active drag operations
        if (this.isDragging) {
            this.isDragging = false;
            this.dragStartDate = null;
            document.removeEventListener('mouseup', this.handleDragEnd);
        }
        
        // Clean up state
        this.state.selectedDates = [];
        this.state.dreamEntries.clear();
        
        this.plugin.logger?.info('EnhancedDateNavigator', 'Modal cleanup completed');
    }

    private buildVisualizationDropdown(container: HTMLElement): void {
        const vizContainer = container.createDiv({ cls: 'oomp-visualization-dropdown-container' });
        
        const vizSelect = vizContainer.createEl('select', {
            cls: 'oomp-visualization-dropdown',
            attr: { 
                'aria-label': 'Pattern visualization style',
                'title': 'Choose how dream patterns are displayed'
            }
        });

        const options = [
            { 
                value: 'composite-dots', 
                text: '📊 Patterns', 
                title: 'Show dream patterns as colored indicator dots' 
            },
            { 
                value: 'quality-gradients', 
                text: '🎨 Quality', 
                title: 'Background gradients show overall dream quality' 
            },
            { 
                value: 'multi-layer', 
                text: '🔬 Detail', 
                title: 'All metrics visible simultaneously (Advanced)' 
            },
            { 
                value: 'minimalist-icons', 
                text: '✨ Icons', 
                title: 'Simple emoji-style pattern indicators' 
            }
        ];

        // Populate dropdown options
        options.forEach(option => {
            const optionEl = vizSelect.createEl('option', {
                value: option.value,
                text: option.text,
                attr: { title: option.title }
            });
            
            if (option.value === this.state.visualizationStyle) {
                optionEl.selected = true;
            }
        });

        // Handle selection changes
        vizSelect.addEventListener('change', () => {
            const newStyle = vizSelect.value as EnhancedNavigationState['visualizationStyle'];
            this.state.visualizationStyle = newStyle;
            
            // Update calendar visualization
            this.updateCalendarVisualization();
            
            // Log the change for debugging
            this.plugin.logger?.trace('EnhancedDateNavigator', 'Visualization style changed', {
                newStyle,
                timestamp: new Date().toISOString()
            });
            
            // TODO: Save to settings when Hub > Metrics integration is implemented
            new Notice(`Switched to ${options.find(opt => opt.value === newStyle)?.text || newStyle} visualization`);
        });
    }

    private updateCalendarVisualization(): void {
        // Update pattern renderer with new visualization style
        this.patternRenderer.updateVisualizationStyle(this.state.visualizationStyle);
        
        this.plugin.logger?.trace('EnhancedDateNavigator', 'Calendar visualization update requested', {
            style: this.state.visualizationStyle
        });
        
        // Refresh calendar to apply new visualization
        this.updateCalendar();
    }

    /**
     * Render pattern visualization for dream entries on a calendar day
     */
    private renderPatternVisualization(dayElement: HTMLElement, entries: any[]): void {
        this.plugin.logger?.trace('EnhancedDateNavigator', 'renderPatternVisualization called', {
            entriesCount: entries.length,
            visualizationStyle: this.state.visualizationStyle,
            dayText: dayElement.textContent,
            hasPatternCalculator: !!this.patternCalculator,
            hasPatternRenderer: !!this.patternRenderer,
            hasPatternTooltips: !!this.patternTooltips
        });
        
        this.plugin.logger?.trace('EnhancedDateNavigator', 'renderPatternVisualization called', {
            entriesCount: entries.length,
            visualizationStyle: this.state.visualizationStyle,
            dayText: dayElement.textContent,
            hasPatternCalculator: !!this.patternCalculator,
            hasPatternRenderer: !!this.patternRenderer,
            timestamp: new Date().toISOString()
        });
        
        try {
            // Calculate patterns for all entries on this day
            const patterns: PatternVisualization[] = entries.map(entry => {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Calculating pattern for entry', {
                    title: entry.title || 'no title',
                    hasMetrics: !!entry.metrics,
                    metricsKeys: entry.metrics ? Object.keys(entry.metrics) : []
                });
                return this.patternCalculator.calculateBasePattern(entry);
            });

            this.plugin.logger?.trace('EnhancedDateNavigator', 'Patterns calculated', {
                patterns: patterns.map(p => ({
                    basePattern: p.basePattern,
                    qualityScore: p.qualityScore,
                    fragmentationLevel: p.fragmentationLevel
                }))
            });

            // Render visualization using pattern renderer
            this.plugin.logger?.trace('EnhancedDateNavigator', 'About to call patternRenderer.renderDayIndicators');
            this.patternRenderer.renderDayIndicators(dayElement, patterns);
            this.plugin.logger?.trace('EnhancedDateNavigator', 'patternRenderer.renderDayIndicators completed');

            // Add tooltips for the first entry (primary)
            if (entries.length > 0 && patterns.length > 0) {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'About to attach tooltips');
                this.patternTooltips.attachTooltip(dayElement, entries[0], patterns);
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Tooltips attached');
            }

            this.plugin.logger?.trace('EnhancedDateNavigator', 'Pattern visualization rendered', {
                date: dayElement.textContent,
                entriesCount: entries.length,
                patterns: patterns.map(p => p.basePattern),
                visualizationStyle: this.state.visualizationStyle
            });
        } catch (error) {
            this.plugin.logger?.error('EnhancedDateNavigator', 'Error in renderPatternVisualization', { error });
            this.plugin.logger?.error('EnhancedDateNavigator', 'Error rendering pattern visualization', {
                error,
                entriesCount: entries.length,
                visualizationStyle: this.state.visualizationStyle
            });
            
            // Fallback to simple indicator
            this.renderFallbackIndicator(dayElement, entries.length);
        }
    }

    /**
     * Fallback indicator when pattern visualization fails
     */
    private renderFallbackIndicator(dayElement: HTMLElement, entryCount: number): void {
        const indicator = dayElement.createDiv({ cls: 'oom-calendar-indicator' });
        
        // Show count if multiple entries
        if (entryCount > 1) {
            indicator.textContent = entryCount.toString();
            indicator.addClasses(['oom-calendar-indicator--count']);
        }
    }

    /**
     * Announces message to screen readers
     * @param message - Message to announce
     */
    private announceToScreenReader(message: string): void {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.classList.add('oom-sr-only');
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Sets up accessibility for calendar grid with ARIA structure and keyboard navigation
     * @param calendarContainer - The calendar grid container
     */
    private setupCalendarAccessibility(calendarContainer: HTMLElement): void {
        // ACCESSIBILITY: Set up ARIA grid structure
        calendarContainer.setAttribute('role', 'grid');
        calendarContainer.setAttribute('aria-label', 'Calendar grid');
        
        // ACCESSIBILITY: Make calendar container focusable for Tab navigation
        calendarContainer.setAttribute('tabindex', '0');
        
        // ACCESSIBILITY: Set up keyboard navigation for calendar grid
        calendarContainer.addEventListener('keydown', (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            
            // Only handle arrow keys when focused on a day cell with tabindex="0"
            const isDayCell = target.hasAttribute('data-date') && target.getAttribute('tabindex') === '0';
            
            if (!isDayCell) {
                // If calendar container is focused, focus on first available day cell only for specific keys
                if (target === calendarContainer && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    const firstFocusableCell = calendarContainer.querySelector('[tabindex="0"]') as HTMLElement;
                    if (firstFocusableCell) {
                        firstFocusableCell.focus();
                    }
                }
                return;
            }
            
            let newCell: HTMLElement | null = null;
            
            switch (event.key) {
                case 'ArrowUp':
                    newCell = this.getAdjacentCell(target, 'up');
                    break;
                case 'ArrowDown':
                    newCell = this.getAdjacentCell(target, 'down');
                    break;
                case 'ArrowLeft':
                    newCell = this.getAdjacentCell(target, 'left');
                    break;
                case 'ArrowRight':
                    newCell = this.getAdjacentCell(target, 'right');
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    target.click();
                    return;
                case 'Home':
                    event.preventDefault();
                    newCell = calendarContainer.querySelector('[data-date]') as HTMLElement;
                    break;
                case 'End':
                    event.preventDefault();
                    const allCells = calendarContainer.querySelectorAll('[data-date]');
                    newCell = allCells[allCells.length - 1] as HTMLElement;
                    break;
                default:
                    return;
            }
            
            if (newCell) {
                event.preventDefault();
                
                // Update roving tabindex pattern
                target.setAttribute('tabindex', '-1');
                newCell.setAttribute('tabindex', '0');
                newCell.focus();
            }
        });
    }

    /**
     * Gets adjacent cell for keyboard navigation
     * @param currentCell - Current focused cell
     * @param direction - Direction to move (up, down, left, right)
     * @returns Adjacent cell or null if not found
     */
    private getAdjacentCell(currentCell: HTMLElement, direction: 'up' | 'down' | 'left' | 'right'): HTMLElement | null {
        const allCells = Array.from(currentCell.parentElement?.querySelectorAll('[data-date]') || []) as HTMLElement[];
        const currentIndex = allCells.indexOf(currentCell);
        
        if (currentIndex === -1) return null;
        
        let targetIndex: number;
        
        switch (direction) {
            case 'left':
                targetIndex = currentIndex - 1;
                break;
            case 'right':
                targetIndex = currentIndex + 1;
                break;
            case 'up':
                targetIndex = currentIndex - 7; // 7 days per week
                break;
            case 'down':
                targetIndex = currentIndex + 7; // 7 days per week
                break;
        }
        
        if (targetIndex >= 0 && targetIndex < allCells.length) {
            return allCells[targetIndex];
        }
        
        return null;
    }

    /**
     * Sets up roving tabindex pattern for calendar accessibility
     * @param calendarContainer - The calendar grid container
     */
    private setupRovingTabindex(calendarContainer: HTMLElement): void {
        // Find current focused cell or default to today/first cell
        let cellToFocus = calendarContainer.querySelector('[tabindex="0"]') as HTMLElement;
        
        if (!cellToFocus) {
            // Try to focus today first
            const today = new Date();
            const todayCell = calendarContainer.querySelector(`[data-date="${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}"]`) as HTMLElement;
            cellToFocus = todayCell || calendarContainer.querySelector('[data-date]') as HTMLElement;
        }
        
        if (cellToFocus) {
            // Set up roving tabindex on the focused cell
            cellToFocus.setAttribute('tabindex', '0');
            // Remove tabindex="0" from any other cells
            calendarContainer.querySelectorAll('[tabindex="0"]').forEach(cell => {
                if (cell !== cellToFocus) {
                    cell.setAttribute('tabindex', '-1');
                }
            });
        }
    }

    /**
     * Formats date for data-date attribute (YYYY-MM-DD format)
     * @param date - Date to format
     * @returns Formatted date string
     */
    private formatDateForData(date: Date): string {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }

    /**
     * Formats date for aria-label attribute (human-readable format)
     * @param date - Date to format
     * @returns Formatted aria-label string
     */
    private formatDateForAriaLabel(date: Date): string {
        const options: Intl.DateTimeFormatOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Sets up inter-grid navigation for multiple compact calendar grids
     * @param monthGrids - Array of month grid containers
     */
    private setupInterGridNavigation(monthGrids: HTMLElement[]): void {
        // The individual accessibility setup in each grid handles focus behavior
        // This method is just for coordination if needed in the future
        if (monthGrids.length <= 1) return;
        
        // All grids are already set up with proper accessibility in setupCompactCalendarAccessibility
        // No additional coordination needed - natural tab order handles inter-grid navigation
    }

    /**
     * Sets up accessibility for compact calendar grids (dual/quarter view) with ARIA structure and keyboard navigation
     * @param calendarContainer - The compact calendar grid container
     * @param monthDate - The date representing the month being displayed
     * @param gridIndex - Index of this grid in multi-grid layouts
     */
    private setupCompactCalendarAccessibility(calendarContainer: HTMLElement, monthDate: Date, gridIndex: number = 0): void {
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // ACCESSIBILITY: Set up ARIA grid structure
        calendarContainer.setAttribute('role', 'grid');
        calendarContainer.setAttribute('aria-label', `${monthName} calendar grid`);
        calendarContainer.setAttribute('tabindex', '0');
        
        // When grid container gets focus, move to first day cell
        calendarContainer.addEventListener('focus', (e) => {
            const firstDayCell = calendarContainer.querySelector('[data-date]') as HTMLElement;
            if (firstDayCell) {
                firstDayCell.focus();
            }
        });
        
        // Set up keyboard navigation on the container (delegation)
        calendarContainer.addEventListener('keydown', (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            
            // Only handle if we're on a day cell
            if (!target.hasAttribute('data-date')) {
                return;
            }
            
            let newCell: HTMLElement | null = null;
            
            switch (event.key) {
                case 'ArrowUp':
                    newCell = this.getAdjacentCompactCell(target, 'up');
                    break;
                case 'ArrowDown':
                    newCell = this.getAdjacentCompactCell(target, 'down');
                    break;
                case 'ArrowLeft':
                    newCell = this.getAdjacentCompactCell(target, 'left');
                    break;
                case 'ArrowRight':
                    newCell = this.getAdjacentCompactCell(target, 'right');
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    target.click();
                    return;
                case 'Home':
                    event.preventDefault();
                    newCell = calendarContainer.querySelector('[data-date]') as HTMLElement;
                    break;
                case 'End':
                    event.preventDefault();
                    const allCells = calendarContainer.querySelectorAll('[data-date]');
                    newCell = allCells[allCells.length - 1] as HTMLElement;
                    break;
                default:
                    return;
            }
            
            if (newCell) {
                event.preventDefault();
                newCell.focus();
            }
        });
    }

    /**
     * Gets adjacent cell for compact calendar keyboard navigation
     * @param currentCell - Current focused cell
     * @param direction - Direction to move (up, down, left, right)
     * @returns Adjacent cell or null if not found
     */
    private getAdjacentCompactCell(currentCell: HTMLElement, direction: 'up' | 'down' | 'left' | 'right'): HTMLElement | null {
        // Find the specific compact days container for this cell
        const daysContainer = currentCell.closest('.oomp-compact-days-container') as HTMLElement;
        if (!daysContainer) return null;
        
        const allCells = Array.from(daysContainer.querySelectorAll('[data-date]')) as HTMLElement[];
        const currentIndex = allCells.indexOf(currentCell);
        
        if (currentIndex === -1) return null;
        
        let targetIndex: number;
        
        switch (direction) {
            case 'left':
                targetIndex = currentIndex - 1;
                break;
            case 'right':
                targetIndex = currentIndex + 1;
                break;
            case 'up':
                targetIndex = currentIndex - 7; // 7 days per week
                break;
            case 'down':
                targetIndex = currentIndex + 7; // 7 days per week
                break;
        }
        
        if (targetIndex >= 0 && targetIndex < allCells.length) {
            return allCells[targetIndex];
        }
        
        return null;
    }

    /**
     * Sets up roving tabindex pattern for compact calendar accessibility
     * @param calendarContainer - The compact calendar grid container
     * @param gridIndex - Index of this grid in multi-grid layouts
     */
    private setupCompactRovingTabindex(calendarContainer: HTMLElement, gridIndex: number = 0): void {
        // Make all day cells focusable (but not in tab order)
        calendarContainer.querySelectorAll('[data-date]').forEach(cell => {
            cell.setAttribute('tabindex', '-1');
        });
    }
} 
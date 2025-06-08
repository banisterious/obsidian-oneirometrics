import { App, Modal, Notice } from 'obsidian';
import type DreamMetricsPlugin from '../../../main';
import type { TimeFilterManager } from '../../timeFilters';
import safeLogger from '../../logging/safe-logger';

export interface EnhancedNavigationState {
    currentDate: Date;
    viewMode: 'month' | 'quarter';
    selectedDates: Date[];
    selectionMode: 'single' | 'range' | 'multi';
    navigationMemory: Date[];
    dreamEntries: Map<string, any[]>;
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
            navigationMemory: [],
            dreamEntries: new Map()
        };

        // Set modal properties
        this.modalEl.addClass('oomp-enhanced-date-navigator-modal');
        this.modalEl.setAttribute('role', 'dialog');
        this.modalEl.setAttribute('aria-label', 'Enhanced Date Navigator');
    }

    onOpen() {
        this.plugin.logger?.info('EnhancedDateNavigator', 'Modal opened');
        this.buildInterface();
        this.loadDreamData();
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

            // Build sections
            this.buildNavigationSection();
            this.buildSelectionModeControls();
            this.buildCalendarSection();
            this.buildActionSection();

            this.plugin.logger?.info('EnhancedDateNavigator', 'Interface built successfully');
        } catch (error) {
            this.plugin.logger?.error('EnhancedDateNavigator', 'Error building interface', error);
            new Notice('Error building date navigator interface');
        }
    }

    private buildNavigationSection(): void {
        this.navigationSection = this.mainContainer.createDiv({
            cls: 'enhanced-nav-section'
        });

        // Navigation header
        const navHeader = this.navigationSection.createDiv({
            cls: 'nav-header'
        });

        // Enhanced navigation controls
        this.buildYearPicker(navHeader);
        this.buildMonthJump(navHeader);
        this.buildQuarterToggle(navHeader);
        this.buildGoToDate(navHeader);
        this.buildNavigationMemory(navHeader);
    }

    private buildSelectionModeControls(): void {
        // Selection mode controls section
        const selectionModeSection = this.mainContainer.createDiv({
            cls: 'selection-mode-section'
        });

        const modeLabel = selectionModeSection.createDiv({
            cls: 'mode-label',
            text: 'Selection Mode:'
        });

        const modeButtons = selectionModeSection.createDiv({
            cls: 'mode-buttons'
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
            this.addToNavigationMemory(new Date(selectedYear, 0, 1));
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
                this.addToNavigationMemory(new Date(newDate));
                menu.remove();
                
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Month jump - switched to month view', {
                    selectedMonth: index,
                    newDate: newDate.toISOString()
                });
            });
        });

        // Position menu relative to button
        const rect = triggerButton.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.zIndex = '1000';

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
        const quarterToggleContainer = container.createDiv({ cls: 'quarter-toggle-container' });
        
        const quarterToggle = quarterToggleContainer.createDiv({ cls: 'quarter-toggle' });
        
        const toggleSwitch = quarterToggle.createDiv({ cls: 'toggle-switch' });
        
        const toggleInput = toggleSwitch.createEl('input', {
            type: 'checkbox',
            attr: { 'aria-label': 'Toggle quarter view' }
        });

        const toggleLabel = quarterToggle.createDiv({
            cls: 'toggle-label',
            text: 'Quarter View'
        });

        toggleInput.checked = this.state.viewMode === 'quarter';

        // Make the entire toggle area clickable (not just the checkbox)
        quarterToggle.addEventListener('click', () => {
            this.plugin.logger?.trace('EnhancedDateNavigator', 'Quarter toggle clicked', {
                currentViewMode: this.state.viewMode,
                checkboxStateBefore: toggleInput.checked
            });
            
            // Toggle the view mode directly rather than relying on checkbox state
            this.state.viewMode = this.state.viewMode === 'month' ? 'quarter' : 'month';
            toggleInput.checked = this.state.viewMode === 'quarter';
            
            this.plugin.logger?.trace('EnhancedDateNavigator', 'View mode toggled', {
                newViewMode: this.state.viewMode,
                checkboxStateAfter: toggleInput.checked
            });
            
            if (this.state.viewMode === 'quarter') {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Switching to quarter view');
                this.updateQuarterView();
            } else {
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Switching to month view');
                this.updateCalendar();
            }
            
            this.plugin.logger?.info('EnhancedDateNavigator', 'View mode changed', {
                mode: this.state.viewMode
            });
        });

        toggleInput.addEventListener('change', (e) => {
            e.stopPropagation(); // Prevent double firing
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
                this.buildCompactMonthGrid(monthContainer, monthDate);
            }
        } finally {
            this.isUpdating = false;
        }
    }

    private buildCompactMonthGrid(container: HTMLElement, monthDate: Date): void {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        
        const monthGrid = container.createDiv({ cls: 'oomp-compact-month-grid' });
        
        // Weekday headers (abbreviated)
        const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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
        
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayEl = daysContainer.createDiv({ cls: 'oomp-compact-day' });
            
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
            
            dayEl.addEventListener('click', () => {
                this.state.currentDate = new Date(currentDate);
                this.state.viewMode = 'month'; // Switch back to month view
                this.updateCalendar();
                this.updateMonthDisplay(this.mainContainer.querySelector('.month-display') as HTMLElement);
                // Update toggle
                const toggleInput = this.mainContainer.querySelector('.toggle-switch input') as HTMLInputElement;
                if (toggleInput) toggleInput.checked = false;
            });
        }
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
            const inputValue = dateInput.value;
            if (!inputValue) {
                new Notice('Please enter a valid date');
                return;
            }

            try {
                const targetDate = new Date(inputValue + 'T00:00:00');
                if (isNaN(targetDate.getTime())) {
                    new Notice('Invalid date format');
                    return;
                }

                this.state.currentDate = targetDate;
                
                // Switch to month view and update quarter toggle
                this.state.viewMode = 'month';
                const toggleInput = this.mainContainer.querySelector('.toggle-switch input') as HTMLInputElement;
                if (toggleInput) {
                    toggleInput.checked = false;
                }
                
                this.updateCalendar();
                this.updateMonthDisplay(this.mainContainer.querySelector('.month-display') as HTMLElement);
                this.addToNavigationMemory(new Date(targetDate));
                
                new Notice(`Navigated to ${targetDate.toLocaleDateString()}`);
                
                this.plugin.logger?.trace('EnhancedDateNavigator', 'Go to date - switched to month view', {
                    targetDate: targetDate.toISOString()
                });
            } catch (error) {
                new Notice('Error parsing date');
                this.plugin.logger?.error('EnhancedDateNavigator', 'Error parsing date', error);
            }
        };

        goButton.addEventListener('click', handleGoToDate);
        dateInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleGoToDate();
            }
        });

        // Update input when current date changes
        dateInput.addEventListener('change', () => {
            const newDate = new Date(dateInput.value + 'T00:00:00');
            if (!isNaN(newDate.getTime())) {
                goButton.disabled = false;
            } else {
                goButton.disabled = true;
            }
        });
    }

    private buildNavigationMemory(container: HTMLElement): void {
        const navMemoryContainer = container.createDiv({ cls: 'navigation-memory-container' });
        
        const memoryLabel = navMemoryContainer.createDiv({
            cls: 'oomp-memory-label',
            text: 'Recent:'
        });
        
        const memoryChips = navMemoryContainer.createDiv({ cls: 'memory-chips' });
        
        // Initialize with current date in memory
        this.addToNavigationMemory(this.state.currentDate);
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
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                
                const dayEl = daysGrid.createDiv({ cls: 'calendar-day' });
                
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

                // Add placeholder dream indicators
                const indicators = dayEl.createDiv({ cls: 'dream-indicators' });
                const dateKey = this.getDateKey(currentDate);
                
                if (this.state.dreamEntries.has(dateKey)) {
                    const entries = this.state.dreamEntries.get(dateKey) || [];
                    const indicatorRow = indicators.createDiv({ cls: 'indicator-row' });
                    
                    // Add dots for each entry (max 5)
                    for (let j = 0; j < Math.min(entries.length, 5); j++) {
                        indicatorRow.createDiv({ cls: 'dream-dot' });
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
        // Update visual state of calendar days
        const dayElements = this.calendarSection.querySelectorAll('.calendar-day');
        dayElements.forEach((dayEl: HTMLElement) => {
            dayEl.removeClass('selected');
        });

        // Mark selected dates
        this.state.selectedDates.forEach(selectedDate => {
            const dateIndex = this.getDateIndex(selectedDate);
            if (dateIndex >= 0 && dateIndex < dayElements.length) {
                dayElements[dateIndex].addClass('selected');
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
        // Load dream entries from plugin state
        try {
            const entries = this.plugin.state?.getDreamEntries() || [];
            this.state.dreamEntries.clear();
            
            entries.forEach(entry => {
                const dateKey = this.getDateKey(new Date(entry.date));
                if (!this.state.dreamEntries.has(dateKey)) {
                    this.state.dreamEntries.set(dateKey, []);
                }
                this.state.dreamEntries.get(dateKey)?.push(entry);
            });

            this.plugin.logger?.info('EnhancedDateNavigator', `Loaded ${entries.length} dream entries`);
        } catch (error) {
            this.plugin.logger?.error('EnhancedDateNavigator', 'Error loading dream data', error);
        }
    }

    private getDateKey(date: Date): string {
        return date.toISOString().split('T')[0];
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
                
                // Apply filters through FilterUI
                plugin.filterUI.applyFilters(metricsContainer);
                
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
        this.updateCalendar();
        new Notice('Selection cleared');
    }

    private addToNavigationMemory(date: Date): void {
        const dateStr = date.toISOString().split('T')[0];
        
        // Remove if already exists (to move to front)
        this.state.navigationMemory = this.state.navigationMemory.filter(
            memDate => memDate.toISOString().split('T')[0] !== dateStr
        );
        
        // Add to front
        this.state.navigationMemory.unshift(new Date(date));
        
        // Keep only last 5 entries
        if (this.state.navigationMemory.length > 5) {
            this.state.navigationMemory = this.state.navigationMemory.slice(0, 5);
        }
        
        // Update navigation memory display
        this.updateNavigationMemoryDisplay();
    }

    private updateNavigationMemoryDisplay(): void {
        const memoryContainer = this.mainContainer.querySelector('.memory-chips');
        if (!memoryContainer) return;

        memoryContainer.empty();

        this.state.navigationMemory.forEach((date, index) => {
            const chip = memoryContainer.createDiv({ cls: 'memory-chip' });
            
            const chipDate = chip.createDiv({
                cls: 'chip-date',
                text: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            });

            const removeBtn = chip.createDiv({
                cls: 'chip-remove',
                text: '×',
                attr: { 'aria-label': 'Remove from memory' }
            });

            chip.addEventListener('click', (e) => {
                if (e.target === removeBtn) {
                    this.removeFromNavigationMemory(index);
                } else {
                    this.navigateToMemoryDate(date);
                }
            });
        });
    }

    private removeFromNavigationMemory(index: number): void {
        this.state.navigationMemory.splice(index, 1);
        this.updateNavigationMemoryDisplay();
    }

    private navigateToMemoryDate(date: Date): void {
        this.state.currentDate = new Date(date);
        
        // Switch to month view and update quarter toggle
        this.state.viewMode = 'month';
        const toggleInput = this.mainContainer.querySelector('.toggle-switch input') as HTMLInputElement;
        if (toggleInput) {
            toggleInput.checked = false;
        }
        
        this.updateCalendar();
        this.updateMonthDisplay(this.mainContainer.querySelector('.month-display') as HTMLElement);
        
        this.plugin.logger?.trace('EnhancedDateNavigator', 'Navigation memory - switched to month view', {
            memoryDate: date.toISOString()
        });
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
        this.state.navigationMemory = [];
        this.state.dreamEntries.clear();
        
        this.plugin.logger?.info('EnhancedDateNavigator', 'Modal cleanup completed');
    }
} 
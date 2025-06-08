import { App, Modal, Notice } from 'obsidian';
import type DreamMetricsPlugin from '../../../main';
import type { TimeFilterManager } from '../../timeFilters';

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
            cls: 'selection-info'
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
                this.updateCalendar();
                this.updateMonthDisplay(this.mainContainer.querySelector('.month-display') as HTMLElement);
                this.addToNavigationMemory(new Date(newDate));
                menu.remove();
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

        toggleSwitch.addEventListener('click', () => {
            toggleInput.checked = !toggleInput.checked;
            this.state.viewMode = toggleInput.checked ? 'quarter' : 'month';
            
            if (this.state.viewMode === 'quarter') {
                this.updateQuarterView();
            } else {
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
        if (this.isUpdating) return;
        this.isUpdating = true;

        try {
            const existingDaysGrid = this.calendarSection.querySelector('.calendar-days-grid');
            if (existingDaysGrid) {
                existingDaysGrid.remove();
            }

            const calendarGrid = this.calendarSection.querySelector('.calendar-grid');
            if (!calendarGrid) return;

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
                this.updateCalendar();
                this.updateMonthDisplay(this.mainContainer.querySelector('.month-display') as HTMLElement);
                this.addToNavigationMemory(new Date(targetDate));
                
                new Notice(`Navigated to ${targetDate.toLocaleDateString()}`);
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
                dayEl.addEventListener('click', () => this.handleDateClick(currentDate));
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
        // Basic single date selection for now
        this.state.selectedDates = [date];
        this.updateCalendarVisualState();
        this.plugin.logger?.info('EnhancedDateNavigator', 'Date selected', { date: date.toISOString() });
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
        try {
            if (this.state.selectedDates.length === 0) {
                new Notice('Please select at least one date');
                return;
            }

            // Apply the date selection to the time filter
            // Implementation will integrate with existing filter system
            
            this.plugin.logger?.info('EnhancedDateNavigator', 'Selection applied', {
                selectedDates: this.state.selectedDates.length,
                mode: this.state.selectionMode
            });

            new Notice(`Applied selection: ${this.state.selectedDates.length} date(s)`);
            this.close();
        } catch (error) {
            this.plugin.logger?.error('EnhancedDateNavigator', 'Error applying selection', error);
            new Notice('Error applying date selection');
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
        this.updateCalendar();
        this.updateMonthDisplay(this.mainContainer.querySelector('.month-display') as HTMLElement);
    }

    private cleanup(): void {
        // Clean up any resources
        this.isUpdating = false;
    }
} 
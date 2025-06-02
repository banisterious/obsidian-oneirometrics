import { App, Modal, Notice, ButtonComponent } from 'obsidian';
import { TimeFilterManager } from '../../timeFilters';
import { format, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths, isToday, isSameDay } from 'date-fns';
import safeLogger from '../../logging/safe-logger';

interface DateSelection {
    start: Date;
    end: Date;
    isRange: boolean;
}

enum SelectionMode {
    SINGLE = 'single',
    RANGE = 'range',
    MULTI_SELECT = 'multi-select'
}

export class DateSelectionModal extends Modal {
    private timeFilterManager: TimeFilterManager;
    private currentMonth: Date;
    private selectedDates: Set<string> = new Set();
    private isRangeMode: boolean = false;
    private isMultiSelectMode: boolean = false;
    private rangeStart: Date | null = null;
    private previewRange: DateSelection | null = null;
    private isUpdatingCalendar: boolean = false;
    private textInputsCollapsed: boolean = false;
    private startDateInput: HTMLInputElement | null = null;
    private endDateInput: HTMLInputElement | null = null;
    
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
            safeLogger.info('DateSelectionModal', 'Building interface - step 1: navigation');
            // Navigation section
            this.createNavigation(contentEl);
            safeLogger.info('DateSelectionModal', 'Navigation created successfully');
            
            safeLogger.info('DateSelectionModal', 'Building interface - step 2: calendar grid');
            // Calendar grid
            this.createCalendarGrid(contentEl);
            safeLogger.info('DateSelectionModal', 'Calendar grid created successfully');
            
            safeLogger.info('DateSelectionModal', 'Building interface - step 3: selection info');
            // Selection info below calendar
            this.createSelectionInfo(contentEl);
            safeLogger.info('DateSelectionModal', 'Selection info created successfully');
            
            safeLogger.info('DateSelectionModal', 'Building interface - step 4: text input section');
            // Text input section
            this.createTextInputSection(contentEl);
            safeLogger.info('DateSelectionModal', 'Text input section created successfully');
            
            safeLogger.info('DateSelectionModal', 'Building interface - step 5: action buttons');
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
        
        // Quick navigation buttons
        const quickNav = navSection.createDiv('oom-quick-navigation');
        
        // Quick nav buttons container
        const quickNavButtons = quickNav.createDiv('oom-quick-nav-buttons');
        
        new ButtonComponent(quickNavButtons)
            .setButtonText('Today')
            .onClick(() => this.navigateToToday());
            
        new ButtonComponent(quickNavButtons)
            .setButtonText('This Month')
            .onClick(() => this.selectCurrentMonth());
        
        // Range Mode toggle positioned to the right
        const toggleContainer = quickNav.createDiv('oom-toggle-container');
        
        // Range Mode Toggle
        const rangeToggleLabel = toggleContainer.createEl('label', { cls: 'oom-toggle-label' });
        rangeToggleLabel.createEl('span', { text: 'Range Mode', cls: 'oom-toggle-text' });
        
        const rangeToggleInput = rangeToggleLabel.createEl('input', { 
            type: 'checkbox',
            cls: 'oom-toggle-input oom-range-toggle'
        }) as HTMLInputElement;
        rangeToggleInput.checked = this.isRangeMode;
        rangeToggleInput.addEventListener('change', () => this.toggleRangeMode());
        
        const rangeToggleSwitch = rangeToggleLabel.createEl('div', { cls: 'oom-toggle-switch' });
        rangeToggleSwitch.createEl('div', { cls: 'oom-toggle-slider' });
        
        // Multi-Select Mode Toggle
        const multiToggleLabel = toggleContainer.createEl('label', { cls: 'oom-toggle-label' });
        multiToggleLabel.createEl('span', { text: 'Multi-Select', cls: 'oom-toggle-text' });
        
        const multiToggleInput = multiToggleLabel.createEl('input', { 
            type: 'checkbox',
            cls: 'oom-toggle-input oom-multi-toggle'
        }) as HTMLInputElement;
        multiToggleInput.checked = this.isMultiSelectMode;
        multiToggleInput.addEventListener('change', () => this.toggleMultiSelectMode());
        
        const multiToggleSwitch = multiToggleLabel.createEl('div', { cls: 'oom-toggle-switch' });
        multiToggleSwitch.createEl('div', { cls: 'oom-toggle-slider' });
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
        if (isSelected) {
            dayEl.classList.add('oom-selected');
            // Add specific styling for multi-select mode
            if (this.isMultiSelectMode && !this.isRangeMode) {
                dayEl.classList.add('oom-multi-selected');
            }
        }
        if (isTodayDate) dayEl.classList.add('oom-today');
        
        // Range preview highlighting
        if (this.previewRange && this.isDateInRange(date, this.previewRange)) {
            dayEl.classList.add('oom-range-preview');
            if (isSameDay(date, this.previewRange.start)) dayEl.classList.add('oom-range-start');
            if (isSameDay(date, this.previewRange.end)) dayEl.classList.add('oom-range-end');
        }
        
        // Event listeners
        dayEl.addEventListener('click', (event) => this.handleDayClick(date, event));
        dayEl.addEventListener('mouseenter', () => this.handleDayHover(date));
        
        // Debug logging for event listener attachment
        if (date.getDate() <= 3) { // Only log for first few days to avoid spam
            safeLogger.debug('DateSelectionModal', 'Event listeners attached for day', {
                date: this.formatDateKey(date),
                isCurrentMonth
            });
        }
        
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

    private createSelectionInfo(container: HTMLElement): void {
        // Selection info section below calendar
        const selectionInfo = container.createDiv('oom-selection-info');
        this.updateSelectionInfo(selectionInfo);
    }

    private createTextInputSection(container: HTMLElement): void {
        const textInputSection = container.createDiv('oom-text-input-section');
        
        // Header with collapse toggle
        const header = textInputSection.createDiv('oom-text-input-header');
        
        const title = header.createEl('span', {
            text: 'Quick Input',
            cls: 'oom-text-input-title'
        });
        
        const toggle = header.createEl('span', {
            text: this.textInputsCollapsed ? 'Show ▼' : 'Hide ▲',
            cls: 'oom-text-input-toggle'
        });
        
        toggle.addEventListener('click', () => {
            this.textInputsCollapsed = !this.textInputsCollapsed;
            toggle.textContent = this.textInputsCollapsed ? 'Show ▼' : 'Hide ▲';
            textInputSection.classList.toggle('collapsed', this.textInputsCollapsed);
        });
        
        // Text input row
        const inputRow = textInputSection.createDiv('oom-text-input-row');
        
        // Start date field
        const startField = inputRow.createDiv('oom-text-input-field');
        startField.createEl('label', {
            text: 'Start Date',
            cls: 'oom-text-input-label'
        });
        
        this.startDateInput = startField.createEl('input', {
            type: 'text',
            placeholder: 'YYYY-MM-DD',
            cls: 'oom-text-input'
        }) as HTMLInputElement;
        
        // End date field
        const endField = inputRow.createDiv('oom-text-input-field');
        endField.createEl('label', {
            text: 'End Date',
            cls: 'oom-text-input-label'
        });
        
        this.endDateInput = endField.createEl('input', {
            type: 'text',
            placeholder: 'YYYY-MM-DD',
            cls: 'oom-text-input'
        }) as HTMLInputElement;
        
        // Add event listeners for text input changes
        this.startDateInput.addEventListener('input', () => this.handleTextInputChange());
        this.endDateInput.addEventListener('input', () => this.handleTextInputChange());
        this.startDateInput.addEventListener('blur', () => this.validateAndSyncFromText());
        this.endDateInput.addEventListener('blur', () => this.validateAndSyncFromText());
        
        // Set initial collapsed state
        if (this.textInputsCollapsed) {
            textInputSection.classList.add('collapsed');
        }
    }

    private setMode(isRange: boolean): void {
        const wasRangeMode = this.isRangeMode;
        this.isRangeMode = isRange;
        
        // Only clear selection in specific cases to avoid losing range selection progress
        if (wasRangeMode && !isRange) {
            // Switching from range mode to single mode - only clear if we have an incomplete range
            if (this.rangeStart && !this.previewRange?.isRange) {
                safeLogger.info('DateSelectionModal', 'Clearing incomplete range selection when switching to single mode');
                this.clearSelection();
            }
        } else if (!wasRangeMode && isRange) {
            // Switching from single mode to range mode - clear single date selection
            if (this.previewRange && !this.previewRange.isRange) {
                safeLogger.info('DateSelectionModal', 'Clearing single date selection when switching to range mode');
                this.clearSelection();
            }
        }
        
        // Only update the toggle state without rebuilding the entire interface
        const toggleInput = this.contentEl.querySelector('.oom-toggle-input') as HTMLInputElement;
        if (toggleInput) {
            toggleInput.checked = this.isRangeMode;
        }
        
        this.updateSelectionInfo();
        
        safeLogger.info('DateSelectionModal', 'Mode changed', { 
            wasRangeMode, 
            isRangeMode: this.isRangeMode,
            hasRangeStart: !!this.rangeStart,
            hasPreviewRange: !!this.previewRange
        });
    }

    private toggleRangeMode(): void {
        this.setMode(!this.isRangeMode);
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

    private handleDayClick(date: Date, event?: MouseEvent): void {
        const dateKey = this.formatDateKey(date);
        
        safeLogger.info('DateSelectionModal', 'Day clicked', {
            date: dateKey,
            isRangeMode: this.isRangeMode,
            isMultiSelectMode: this.isMultiSelectMode,
            hasRangeStart: !!this.rangeStart,
            rangeStartDate: this.rangeStart ? this.formatDateKey(this.rangeStart) : null,
            modifierKeys: {
                ctrl: event?.ctrlKey || false,
                cmd: event?.metaKey || false,
                shift: event?.shiftKey || false
            }
        });
        
        // Check for multi-select with Ctrl/Cmd key (or if multi-select mode is active)
        const isMultiSelectClick = this.isMultiSelectMode || event?.ctrlKey || event?.metaKey;
        
        if (isMultiSelectClick && !this.isRangeMode) {
            this.handleMultiSelectClick(date);
            this.updateCalendarVisualState();
        } else if (this.isRangeMode) {
            this.handleRangeSelection(date);
            
            // For range mode: only do full calendar update when completing the range
            // For range start selection, just update visual state
            if (this.previewRange?.isRange) {
                // Range completed
                this.updateCalendar();
            } else {
                // Range start selected, just update visual state
                this.updateCalendarVisualState();
            }
        } else {
            // Single date mode
            this.selectedDates.clear();
            this.selectedDates.add(dateKey);
            this.previewRange = { start: date, end: date, isRange: false };
            this.updateCalendar();
        }
        
        this.updateSelectionInfo();
        this.syncTextInputsFromSelection();
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
            // Show preview of range using visual state update only
            const start = this.rangeStart < date ? this.rangeStart : date;
            const end = this.rangeStart < date ? date : this.rangeStart;
            this.previewRange = { start, end, isRange: true };
            // Use visual state update instead of full calendar regeneration
            this.updateCalendarVisualState();
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
        this.syncTextInputsFromSelection();
        
        new Notice('Selection cleared');
    }

    private applySelection(): void {
        if (this.selectedDates.size === 0) {
            new Notice('No dates selected');
            return;
        }

        try {
            if (this.isMultiSelectMode && this.selectedDates.size > 1) {
                // Multi-date selection - use worker filtering
                this.applyMultiDateFilter();
            } else {
                // Single date or range selection - use existing logic
                this.applySingleOrRangeFilter();
            }
        } catch (error) {
            safeLogger.error('DateSelectionModal', 'Error applying selection', error);
            new Notice('Error applying filter. Please try again.');
        }
    }

    private async applyMultiDateFilter(): Promise<void> {
        const selectedDatesArray = Array.from(this.selectedDates);
        
        safeLogger.info('DateSelectionModal', 'Applying multi-date filter', {
            selectedDatesCount: selectedDatesArray.length,
            selectedDates: selectedDatesArray
        });

        try {
            // Get the metrics container and FilterUI
            const metricsContainer = document.querySelector('.oom-metrics-container') as HTMLElement;
            if (!metricsContainer) {
                new Notice('Metrics container not found. Please ensure you are viewing a metrics note.');
                return;
            }

            const plugin = (window as any).oneiroMetricsPlugin;
            if (!plugin || !plugin.filterUI) {
                new Notice('Plugin FilterUI not available. Please try again.');
                return;
            }

            // Show progress indicator
            new Notice(`🚀 Filtering ${selectedDatesArray.length} selected dates...`, 3000);

            // Get entries for filtering (from plugin state or DOM)
            const entries = this.getAllDreamEntries();
            
            if (entries.length === 0) {
                new Notice('No dream entries found to filter.');
                return;
            }

            // Use worker-based multi-date filtering if available
            let filterResult;
            if (plugin.dateNavigatorIntegration?.workerManager) {
                try {
                    filterResult = await plugin.dateNavigatorIntegration.workerManager.filterByMultipleDates(
                        entries,
                        selectedDatesArray,
                        'include'
                    );
                    
                    safeLogger.info('DateSelectionModal', 'Worker-based multi-date filtering completed', {
                        visibleCount: filterResult.visibilityMap.filter(r => r.visible).length,
                        totalCount: filterResult.visibilityMap.length,
                        affectedDatesCount: filterResult.affectedDates.length
                    });
                } catch (workerError) {
                    safeLogger.warn('DateSelectionModal', 'Worker filtering failed, using fallback', workerError);
                    // Fallback to manual filtering if worker fails
                    filterResult = this.fallbackMultiDateFilter(entries, selectedDatesArray);
                }
            } else {
                // Use fallback multi-date filtering
                filterResult = this.fallbackMultiDateFilter(entries, selectedDatesArray);
            }

            // Apply visibility results to the DOM
            this.applyMultiDateVisibilityResults(filterResult.visibilityMap, metricsContainer);

            // Update time filter manager
            if (this.timeFilterManager) {
                // Set a custom filter type for multi-date selection
                (this.timeFilterManager as any).setCustomMultipleDates?.(selectedDatesArray);
            }

            // Update filter display
            this.updateMultiDateFilterDisplay(metricsContainer, selectedDatesArray, filterResult.visibilityMap);

            // Show success message
            const visibleCount = filterResult.visibilityMap.filter(r => r.visible).length;
            new Notice(`✅ Multi-date filter applied: ${visibleCount} entries visible from ${selectedDatesArray.length} selected dates`);
            
            this.close();

        } catch (error) {
            safeLogger.error('DateSelectionModal', 'Multi-date filter application failed', error);
            new Notice('Failed to apply multi-date filter. Please try again.');
        }
    }

    private applySingleOrRangeFilter(): void {
        if (!this.previewRange) {
            new Notice('Invalid selection');
            return;
        }

        // Format dates as YYYY-MM-DD strings for consistent filtering
        const startDateStr = this.previewRange.start.toISOString().split('T')[0];
        const endDateStr = this.previewRange.end.toISOString().split('T')[0];
        
        // Apply filter through TimeFilterManager first
        this.timeFilterManager.setCustomRange(this.previewRange.start, this.previewRange.end);
        
        // CRITICAL FIX: Get the metrics container and apply filters directly through FilterUI
        const metricsContainer = document.querySelector('.oom-metrics-container') as HTMLElement;
        if (metricsContainer) {
            // Get the FilterUI instance from the global plugin
            const plugin = (window as any).oneiroMetricsPlugin;
            safeLogger.info('DateSelectionModal', 'Checking plugin and FilterUI availability', { 
                hasPlugin: !!plugin, 
                hasFilterUI: !!(plugin && plugin.filterUI)
            });
            
            if (plugin && plugin.filterUI) {
                // Set the custom date range in FilterUI
                safeLogger.info('DateSelectionModal', 'Setting custom date range in FilterUI', { 
                    start: startDateStr, 
                    end: endDateStr 
                });
                plugin.filterUI.setCustomDateRange({ start: startDateStr, end: endDateStr });
                
                // Set the dropdown to custom and apply filters
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
                    safeLogger.info('DateSelectionModal', 'Dropdown value set', { 
                        newValue: filterDropdown.value 
                    });
                    
                    // Apply filters through FilterUI
                    safeLogger.info('DateSelectionModal', 'Calling FilterUI.applyFilters');
                    plugin.filterUI.applyFilters(metricsContainer);
                    
                    // CRITICAL FIX: Update the filter display after the automatic update completes
                    setTimeout(() => {
                        safeLogger.info('DateSelectionModal', 'Updating filter display with correct date range');
                        const filterDisplayManager = plugin.filterDisplayManager;
                        if (filterDisplayManager) {
                            // Get the visible count from the table for complete display
                            const visibleRows = metricsContainer.querySelectorAll('.oom-metrics-row:not([style*="display: none"])').length;
                            filterDisplayManager.updateCustomRangeDisplay(
                                metricsContainer, 
                                startDateStr, 
                                endDateStr,
                                visibleRows
                            );
                        } else {
                            // Fallback: Update the filter display directly
                            const filterDisplay = metricsContainer.querySelector('#oom-time-filter-display');
                            if (filterDisplay) {
                                filterDisplay.innerHTML = `
                                    <span class="oom-filter-icon">🗓️</span>
                                    <span class="oom-filter-text oom-filter--custom">Custom Range: ${startDateStr} to ${endDateStr}</span>
                                `;
                                filterDisplay.classList.add('oom-filter-active');
                            }
                        }
                    }, 100); // Small delay to ensure it happens after automatic update
                } else {
                    safeLogger.error('DateSelectionModal', 'Filter dropdown not found in metrics container');
                }
            } else {
                // Fallback method if FilterUI is not accessible
                safeLogger.warn('DateSelectionModal', 'FilterUI not found, using fallback method');
                
                // Set global custom date range for filtering
                (window as any).customDateRange = { start: startDateStr, end: endDateStr };
                
                // Trigger filter change through dropdown
                const filterDropdown = metricsContainer.querySelector('#oom-date-range-filter') as HTMLSelectElement;
                if (filterDropdown) {
                    filterDropdown.value = 'custom';
                    filterDropdown.dispatchEvent(new Event('change'));
                }
            }
        } else {
            safeLogger.error('DateSelectionModal', 'Metrics container not found');
        }
        
        const dayCount = this.selectedDates.size;
        const message = this.previewRange.isRange 
            ? `Applied date range: ${format(this.previewRange.start, 'MMM d')} to ${format(this.previewRange.end, 'MMM d, yyyy')} (${dayCount} days)`
            : `Applied date filter: ${format(this.previewRange.start, 'MMM d, yyyy')}`;
        
        new Notice(message);
        
        safeLogger.info('DateSelectionModal', 'Filter applied', {
            start: startDateStr,
            end: endDateStr,
            dayCount,
            isRange: this.previewRange.isRange
        });
        
        this.close();
    }

    private getAllDreamEntries(): any[] {
        // Try to get entries from the plugin state
        const plugin = (window as any).oneiroMetricsPlugin;
        if (plugin?.state?.getDreamEntries) {
            return plugin.state.getDreamEntries();
        }
        
        // Fallback: Extract entries from DOM
        const metricsContainer = document.querySelector('.oom-metrics-container');
        if (!metricsContainer) return [];
        
        const rows = metricsContainer.querySelectorAll('.oom-metrics-row');
        const entries: any[] = [];
        
        rows.forEach((row, index) => {
            const dateCell = row.querySelector('.oom-date-cell');
            const date = dateCell?.textContent?.trim();
            
            if (date) {
                entries.push({
                    source: `row-${index}`,
                    date: date,
                    // Add other properties as needed
                });
            }
        });
        
        return entries;
    }

    private fallbackMultiDateFilter(entries: any[], selectedDates: string[]): { visibilityMap: any[]; affectedDates: string[] } {
        const selectedSet = new Set(selectedDates);
        const results: any[] = [];
        const affectedDates: string[] = [];
        
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            
            if (!entry.date) {
                results.push({
                    id: entry.source || `entry-${i}`,
                    visible: false,
                    matchReason: 'no-date'
                });
                continue;
            }
            
            const isSelected = selectedSet.has(entry.date);
            
            results.push({
                id: entry.source || `entry-${i}`,
                visible: isSelected,
                matchReason: isSelected ? 'multi-date-include' : 'multi-date-exclude'
            });
            
            if (isSelected && !affectedDates.includes(entry.date)) {
                affectedDates.push(entry.date);
            }
        }
        
        return { visibilityMap: results, affectedDates };
    }

    private applyMultiDateVisibilityResults(visibilityMap: any[], container: HTMLElement): void {
        const rows = container.querySelectorAll('.oom-metrics-row');
        
        visibilityMap.forEach((result, index) => {
            const row = rows[index];
            if (row) {
                (row as HTMLElement).style.display = result.visible ? '' : 'none';
            }
        });
    }

    private updateMultiDateFilterDisplay(container: HTMLElement, selectedDates: string[], visibilityMap: any[]): void {
        const filterDisplay = container.querySelector('#oom-time-filter-display');
        if (filterDisplay) {
            const visibleCount = visibilityMap.filter(r => r.visible).length;
            const sortedDates = selectedDates.sort();
            const dateRange = selectedDates.length > 1 
                ? `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`
                : sortedDates[0];
            
            filterDisplay.innerHTML = `
                <span class="oom-filter-icon">📅</span>
                <span class="oom-filter-text oom-filter--multi-date">Multi-Date: ${selectedDates.length} dates (${visibleCount} entries)</span>
            `;
            filterDisplay.classList.add('oom-filter-active');
        }
    }

    private updateCalendar(): void {
        if (this.isUpdatingCalendar) {
            safeLogger.warn('DateSelectionModal', 'updateCalendar called while already updating, skipping');
            return;
        }
        
        this.isUpdatingCalendar = true;
        
        safeLogger.debug('DateSelectionModal', 'updateCalendar called', {
            stackTrace: new Error().stack?.split('\n').slice(1, 4).join(' | ')
        });
        
        try {
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
        } finally {
            this.isUpdatingCalendar = false;
        }
    }

    private updateSelectionInfo(container?: HTMLElement): void {
        safeLogger.debug('DateSelectionModal', 'updateSelectionInfo called', {
            hasContainer: !!container,
            stackTrace: new Error().stack?.split('\n').slice(1, 3).join(' | ')
        });
        
        const infoEl = container || this.contentEl.querySelector('.oom-selection-info');
        if (!infoEl) return;
        
        infoEl.empty();
        
        if (this.selectedDates.size === 0) {
            let helpText: string;
            if (this.isMultiSelectMode) {
                helpText = 'Click dates to select multiple (Ctrl/Cmd+Click also works)';
            } else if (this.isRangeMode) {
                helpText = 'Click start date, then end date for range';
            } else {
                helpText = 'Click a date to select';
            }
            
            infoEl.createEl('p', { 
                text: helpText,
                cls: 'oom-help-text'
            });
        } else if (this.isMultiSelectMode) {
            // Multi-select mode information
            const selectedCount = this.selectedDates.size;
            const selectedDatesArray = Array.from(this.selectedDates).map(key => this.parseDateKey(key)).filter(Boolean) as Date[];
            const sortedDates = selectedDatesArray.sort((a, b) => a.getTime() - b.getTime());
            
            const infoText = selectedCount === 1 
                ? `Selected: ${format(sortedDates[0], 'MMM d, yyyy')}` 
                : `Selected: ${selectedCount} dates (${format(sortedDates[0], 'MMM d')} to ${format(sortedDates[sortedDates.length - 1], 'MMM d, yyyy')})`;
            
            infoEl.createEl('p', { text: infoText, cls: 'oom-selected-text' });
            
            // Add list of selected dates if reasonable number
            if (selectedCount <= 10) {
                const datesList = sortedDates.map(date => format(date, 'MMM d')).join(', ');
                infoEl.createEl('p', { 
                    text: `Dates: ${datesList}`,
                    cls: 'oom-dates-list'
                });
            }
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

    private updateCalendarVisualState(): void {
        safeLogger.debug('DateSelectionModal', 'updateCalendarVisualState called - using efficient visual update only');
        
        // Update only the visual state of existing day elements without regenerating
        const dayElements = this.contentEl.querySelectorAll('.oom-calendar-day');
        dayElements.forEach((dayEl) => {
            const dayNumber = parseInt(dayEl.textContent || '0');
            if (dayNumber > 0) {
                // Calculate the date for this day element
                const firstDay = startOfMonth(this.currentMonth);
                const startDate = new Date(firstDay);
                startDate.setDate(firstDay.getDate() - firstDay.getDay());
                
                // Find which day this element represents
                const dayIndex = Array.from(dayElements).indexOf(dayEl);
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + dayIndex);
                
                const dateKey = this.formatDateKey(currentDate);
                const isSelected = this.selectedDates.has(dateKey);
                
                // Clear existing selection classes
                dayEl.classList.remove('oom-selected', 'oom-multi-selected', 'oom-range-preview', 'oom-range-start', 'oom-range-end');
                
                // Apply selection styling
                if (isSelected) {
                    dayEl.classList.add('oom-selected');
                    // Add specific styling for multi-select mode
                    if (this.isMultiSelectMode && !this.isRangeMode) {
                        dayEl.classList.add('oom-multi-selected');
                    }
                }
                
                // Range preview highlighting
                if (this.previewRange && this.isDateInRange(currentDate, this.previewRange)) {
                    if (this.previewRange.isRange) {
                        // Traditional range selection
                        dayEl.classList.add('oom-range-preview');
                        if (isSameDay(currentDate, this.previewRange.start)) dayEl.classList.add('oom-range-start');
                        if (isSameDay(currentDate, this.previewRange.end)) dayEl.classList.add('oom-range-end');
                    } else if (this.isMultiSelectMode) {
                        // Multi-select range preview (shows span of selected dates)
                        dayEl.classList.add('oom-multi-range-preview');
                    }
                }
            }
        });
    }

    private formatDateKey(date: Date): string {
        return format(date, 'yyyy-MM-dd');
    }

    private handleTextInputChange(): void {
        // Real-time validation and visual feedback
        if (this.startDateInput) {
            const startValue = this.startDateInput.value;
            const isValidStart = this.isValidDateFormat(startValue);
            this.startDateInput.classList.toggle('invalid', startValue.length > 0 && !isValidStart);
        }
        
        if (this.endDateInput) {
            const endValue = this.endDateInput.value;
            const isValidEnd = this.isValidDateFormat(endValue);
            this.endDateInput.classList.toggle('invalid', endValue.length > 0 && !isValidEnd);
        }
    }

    private validateAndSyncFromText(): void {
        if (!this.startDateInput || !this.endDateInput) return;
        
        const startValue = this.startDateInput.value.trim();
        const endValue = this.endDateInput.value.trim();
        
        // Parse dates
        const startDate = startValue ? this.parseInputDate(startValue) : null;
        const endDate = endValue ? this.parseInputDate(endValue) : null;
        
        if (startDate && endDate) {
            // Both dates provided - set as range
            this.setDatesFromText(startDate, endDate, true);
        } else if (startDate && !endValue) {
            // Only start date - single date selection
            this.setDatesFromText(startDate, startDate, false);
        } else if (!startValue && endDate) {
            // Only end date - treat as single date selection
            this.setDatesFromText(endDate, endDate, false);
        }
        // If both are empty or invalid, don't update selection
    }

    private isValidDateFormat(dateStr: string): boolean {
        if (!dateStr) return false;
        
        // Check format: YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateStr)) return false;
        
        // Check if it's a valid date
        const date = new Date(dateStr + 'T00:00:00');
        return date instanceof Date && !isNaN(date.getTime());
    }

    private parseInputDate(dateStr: string): Date | null {
        if (!this.isValidDateFormat(dateStr)) return null;
        
        const date = new Date(dateStr + 'T00:00:00');
        return date instanceof Date && !isNaN(date.getTime()) ? date : null;
    }

    private setDatesFromText(startDate: Date, endDate: Date, isRange: boolean): void {
        // Update internal state
        this.selectedDates.clear();
        
        if (isRange && startDate.getTime() !== endDate.getTime()) {
            // Range selection
            this.isRangeMode = true;
            this.rangeStart = null; // Clear range start since we're setting completed range
            this.addRangeToSelection(startDate, endDate);
            this.previewRange = { start: startDate, end: endDate, isRange: true };
        } else {
            // Single date selection
            this.isRangeMode = false;
            this.rangeStart = null;
            this.selectedDates.add(this.formatDateKey(startDate));
            this.previewRange = { start: startDate, end: startDate, isRange: false };
        }
        
        // Navigate calendar to show the selected date(s)
        this.currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        
        // Update UI
        this.updateCalendar();
        this.updateSelectionInfo();
        this.updateToggleFromMode();
        
        safeLogger.info('DateSelectionModal', 'Dates set from text input', {
            startDate: this.formatDateKey(startDate),
            endDate: this.formatDateKey(endDate),
            isRange
        });
    }

    private updateToggleFromMode(): void {
        const toggleInput = this.contentEl.querySelector('.oom-toggle-input') as HTMLInputElement;
        if (toggleInput) {
            toggleInput.checked = this.isRangeMode;
        }
    }

    private syncTextInputsFromSelection(): void {
        if (!this.startDateInput || !this.endDateInput) return;
        
        if (this.previewRange) {
            this.startDateInput.value = this.formatDateKey(this.previewRange.start);
            
            if (this.previewRange.isRange) {
                this.endDateInput.value = this.formatDateKey(this.previewRange.end);
            } else {
                this.endDateInput.value = '';
            }
        } else {
            this.startDateInput.value = '';
            this.endDateInput.value = '';
        }
    }

    private toggleMultiSelectMode(): void {
        this.isMultiSelectMode = !this.isMultiSelectMode;
        this.updateSelectionInfo();
        safeLogger.info('DateSelectionModal', 'Multi-Select mode changed', { 
            isMultiSelectMode: this.isMultiSelectMode
        });
    }

    private handleMultiSelectClick(date: Date): void {
        const dateKey = this.formatDateKey(date);
        
        if (this.selectedDates.has(dateKey)) {
            // Deselect if already selected
            this.selectedDates.delete(dateKey);
            
            // Update preview range for visual feedback
            if (this.selectedDates.size === 0) {
                this.previewRange = null;
            } else {
                // Update preview to show the range of all selected dates
                const allDates = Array.from(this.selectedDates).map(key => this.parseDateKey(key)).filter(Boolean) as Date[];
                const sortedDates = allDates.sort((a, b) => a.getTime() - b.getTime());
                this.previewRange = {
                    start: sortedDates[0],
                    end: sortedDates[sortedDates.length - 1],
                    isRange: false // Mark as non-range to indicate multi-select
                };
            }
        } else {
            // Add new selection
            this.selectedDates.add(dateKey);
            
            // Update preview range to encompass all selected dates
            const allDates = Array.from(this.selectedDates).map(key => this.parseDateKey(key)).filter(Boolean) as Date[];
            const sortedDates = allDates.sort((a, b) => a.getTime() - b.getTime());
            this.previewRange = {
                start: sortedDates[0],
                end: sortedDates[sortedDates.length - 1],
                isRange: false // Mark as non-range to indicate multi-select
            };
        }
        
        safeLogger.info('DateSelectionModal', 'Multi-select click processed', {
            dateKey,
            selectedCount: this.selectedDates.size,
            action: this.selectedDates.has(dateKey) ? 'selected' : 'deselected'
        });
    }

    private parseDateKey(dateKey: string): Date | null {
        try {
            const [year, month, day] = dateKey.split('-').map(Number);
            return new Date(year, month - 1, day);
        } catch (error) {
            safeLogger.warn('DateSelectionModal', 'Failed to parse date key', { dateKey, error });
            return null;
        }
    }
} 
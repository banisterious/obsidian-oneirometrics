import { App, Modal, Notice, ButtonComponent } from 'obsidian';
import { TimeFilterManager } from '../../timeFilters';
import { format, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths, isToday, isSameDay } from 'date-fns';
import safeLogger from '../../logging/safe-logger';
import DreamMetricsPlugin from '../../../main';
import { getComponentMetrics, getMetricThreshold } from '../../utils/settings-migration';

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
    private plugin: DreamMetricsPlugin;
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
    
    // ✅ ACCESSIBILITY: Track which cell should have focus for keyboard navigation
    private focusedDate: Date | null = null;
    
    constructor(app: App, timeFilterManager: TimeFilterManager, plugin: DreamMetricsPlugin) {
        super(app);
        this.timeFilterManager = timeFilterManager;
        this.plugin = plugin;
        this.currentMonth = new Date(); // Start with current month
        
        // Set modal properties
        this.modalEl.classList.add('oom-date-selection-modal');
    }

    onOpen(): void {
        this.buildInterface();
        safeLogger.info('DateSelectionModal', 'Modal opened');
        
        // ✅ ACCESSIBILITY: Announce modal opening to screen readers
        this.announceToScreenReader('Date Navigator opened. Use Tab to navigate, Arrow keys to navigate calendar days, Enter or Space to select, Escape to close.');
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
        
        // Date Controls Section (Year and Month) - styled like quick-navigation
        const dateControlsSection = navSection.createDiv('oom-quick-navigation');
        
        // Year navigation for multi-year spans
        const yearNav = dateControlsSection.createDiv('oom-year-nav');
        
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
        const monthNav = dateControlsSection.createDiv('oom-month-nav');
        
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
        
        // Quick action buttons section - styled like quick-navigation
        const quickNav = navSection.createDiv('oom-quick-navigation');
        
        // Quick nav buttons container
        const quickNavButtons = quickNav.createDiv('oom-quick-nav-buttons');
        
        new ButtonComponent(quickNavButtons)
            .setButtonText('Today')
            .onClick(() => this.navigateToToday());
            
        new ButtonComponent(quickNavButtons)
            .setButtonText('This Month')
            .onClick(() => this.selectCurrentMonth());
        
        // Mode toggles positioned to the right
        const toggleContainer = quickNav.createDiv('oom-toggle-container');
        
        // Range Mode Toggle
        const rangeToggleLabel = toggleContainer.createEl('label', { cls: 'oom-toggle-label' });
        rangeToggleLabel.createEl('span', { text: 'Range Mode', cls: 'oom-toggle-text' });
        
        const rangeToggleInput = rangeToggleLabel.createEl('input', { 
            type: 'checkbox',
            cls: 'oom-toggle-input oom-range-toggle'
        }) as HTMLInputElement;
        rangeToggleInput.checked = this.isRangeMode;
        rangeToggleInput.addEventListener('change', () => {
            this.toggleRangeMode();
            // Update visual state manually for reliability
            const toggleSwitch = rangeToggleInput.nextElementSibling as HTMLElement;
            if (toggleSwitch) {
                toggleSwitch.setAttribute('data-checked', rangeToggleInput.checked.toString());
            }
        });
        
        const rangeToggleSwitch = rangeToggleLabel.createEl('div', { cls: 'oom-toggle-switch' });
        rangeToggleSwitch.setAttribute('data-checked', this.isRangeMode.toString());
        rangeToggleSwitch.createEl('div', { cls: 'oom-toggle-slider' });
        
        // Multi-Select Mode Toggle
        const multiToggleLabel = toggleContainer.createEl('label', { cls: 'oom-toggle-label' });
        multiToggleLabel.createEl('span', { text: 'Multi-Select', cls: 'oom-toggle-text' });
        
        const multiToggleInput = multiToggleLabel.createEl('input', { 
            type: 'checkbox',
            cls: 'oom-toggle-input oom-multi-toggle'
        }) as HTMLInputElement;
        multiToggleInput.checked = this.isMultiSelectMode;
        multiToggleInput.addEventListener('change', () => {
            this.toggleMultiSelectMode();
            // Update visual state manually for reliability
            const toggleSwitch = multiToggleInput.nextElementSibling as HTMLElement;
            if (toggleSwitch) {
                toggleSwitch.setAttribute('data-checked', multiToggleInput.checked.toString());
            }
        });
        
        const multiToggleSwitch = multiToggleLabel.createEl('div', { cls: 'oom-toggle-switch' });
        multiToggleSwitch.setAttribute('data-checked', this.isMultiSelectMode.toString());
        multiToggleSwitch.createEl('div', { cls: 'oom-toggle-slider' });
    }

    private createCalendarGrid(container: HTMLElement): void {
        const calendarContainer = container.createDiv('oom-calendar-container');
        
        // ✅ ACCESSIBILITY: Add ARIA grid attributes for screen readers
        calendarContainer.setAttribute('role', 'grid');
        calendarContainer.setAttribute('aria-label', `Calendar for ${this.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
        
        // ✅ ACCESSIBILITY: Make calendar container focusable with Tab key
        // This allows Tab navigation to reach the calendar, then arrow keys work within it
        calendarContainer.setAttribute('tabindex', '0');
        calendarContainer.style.outline = 'none'; // Remove default focus outline (we'll style the focused cell instead)
        
        // Days of week header
        const daysHeader = calendarContainer.createDiv('oom-days-header');
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayHeader = daysHeader.createEl('div', { text: day, cls: 'oom-day-header' });
            // ✅ ACCESSIBILITY: Add ARIA columnheader role
            dayHeader.setAttribute('role', 'columnheader');
        });
        
        // Calendar grid
        const calendarGrid = calendarContainer.createDiv('oom-calendar-grid');
        this.generateCalendarDays(calendarGrid);
        
        // ✅ ACCESSIBILITY: Add keyboard navigation to the calendar grid
        this.addCalendarKeyboardNavigation(calendarContainer);
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
            
            const dayElement = this.createDayElement(currentDate, i);
            container.appendChild(dayElement);
        }
    }

    private createDayElement(date: Date, index: number = 0): HTMLElement {
        const dayEl = document.createElement('div');
        dayEl.className = 'oom-calendar-day';
        dayEl.textContent = date.getDate().toString();
        
        const dateKey = this.formatDateKey(date);
        const isCurrentMonth = isSameMonth(date, this.currentMonth);
        const isSelected = this.selectedDates.has(dateKey);
        const isTodayDate = isToday(date);
        
        // ✅ ACCESSIBILITY: Add ARIA gridcell attributes and position data
        dayEl.setAttribute('role', 'gridcell');
        dayEl.setAttribute('data-date', dateKey);
        dayEl.setAttribute('data-row', Math.floor(index / 7).toString());
        dayEl.setAttribute('data-col', (index % 7).toString());
        
        // ✅ ACCESSIBILITY: Set up roving tabindex pattern (only one cell focusable at a time)
        let shouldFocus = false;
        if (this.focusedDate && this.isSameDay(date, this.focusedDate)) {
            // Restore focus to the previously focused date
            shouldFocus = true;
        } else if (!this.focusedDate && isTodayDate) {
            // Default to today if no focused date is tracked
            shouldFocus = true;
        } else if (!this.focusedDate && index === 0) {
            // Fall back to first cell if no today visible and no tracked focus
            const hasToday = this.generateDaysForCurrentView().some(d => isToday(d));
            if (!hasToday) {
                shouldFocus = true;
            }
        }
        
        dayEl.setAttribute('tabindex', shouldFocus ? '0' : '-1');
        
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

        // **NEW: Add quality indicators for dream entries**
        this.addQualityIndicators(dayEl, date, dateKey);
        
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

    /**
     * Add quality indicators (dots and stars) for dream entries on this date
     */
    private addQualityIndicators(dayEl: HTMLElement, date: Date, dateKey: string): void {
        try {
            // DEBUG: Log every attempt to add indicators
            safeLogger.debug('DateSelectionModal', `Checking quality indicators for ${dateKey}`);
            
            // Get dream entries for this date
            const dreamEntries = this.getDreamEntriesForDate(dateKey);
            const hasEntries = dreamEntries.length > 0;
            
            // DEBUG: Log the results
            safeLogger.debug('DateSelectionModal', `Found ${dreamEntries.length} entries for ${dateKey}`, {
                hasEntries,
                entries: dreamEntries.slice(0, 2) // Log first 2 entries
            });
            
            if (hasEntries) {
                dayEl.classList.add('oom-has-entries');
                
                // Create dots indicator
                const dotsContainer = dayEl.createDiv('oom-dream-indicators');
                const entryCount = Math.min(dreamEntries.length, 5); // Limit to 5 dots
                
                // DEBUG: Log indicator creation
                safeLogger.debug('DateSelectionModal', `Creating ${entryCount} dots for ${dateKey}`);
                
                for (let i = 0; i < entryCount; i++) {
                    dotsContainer.createDiv('oom-dream-dot');
                }
                
                // Create quality stars based on unified metrics
                const qualityLevel = this.calculateQualityLevel(dreamEntries);
                safeLogger.debug('DateSelectionModal', `Quality level for ${dateKey}: ${qualityLevel}`);
                
                if (qualityLevel && qualityLevel !== 'none') {
                    const starsContainer = dayEl.createDiv('oom-day-metrics');
                    
                    let starsHtml = '';
                    if (qualityLevel === 'high') {
                        starsHtml = '<span class="oom-star-high">★★★</span>';
                    } else if (qualityLevel === 'medium') {
                        starsHtml = '<span class="oom-star-medium">★★</span>';
                    } else if (qualityLevel === 'low') {
                        starsHtml = '<span class="oom-star-low">★</span>';
                    }
                    
                    if (starsHtml) {
                        starsContainer.innerHTML = starsHtml;
                        starsContainer.addClass(`oom-metric-${qualityLevel}`);
                        starsContainer.setAttribute('title', `${dreamEntries.length} dream entries - ${qualityLevel} quality`);
                        
                        // DEBUG: Confirm stars were added
                        safeLogger.debug('DateSelectionModal', `Added ${qualityLevel} stars to ${dateKey}`);
                    }
                }
                
                // DEBUG: Final verification
                safeLogger.debug('DateSelectionModal', `Final indicator state for ${dateKey}:`, {
                    hasHasEntriesClass: dayEl.classList.contains('oom-has-entries'),
                    dotsCount: dayEl.querySelectorAll('.oom-dream-dot').length,
                    hasStars: !!dayEl.querySelector('.oom-day-metrics'),
                    starsContent: dayEl.querySelector('.oom-day-metrics')?.innerHTML
                });
            } else {
                // DEBUG: Log when no entries found
                safeLogger.debug('DateSelectionModal', `No entries found for ${dateKey} - no indicators added`);
            }
        } catch (error) {
            safeLogger.error('DateSelectionModal', 'Error adding quality indicators', { dateKey, error });
        }
    }

    /**
     * Get dream entries for a specific date - FIXED TO ACCESS REAL DATA SOURCE
     */
    private getDreamEntriesForDate(dateKey: string): any[] {
        try {
            safeLogger.debug('DateSelectionModal', `Looking for dream entries for date: ${dateKey}`);
            
            // APPROACH 1: Extract from the current DOM table (primary approach)
            // This is where the results table gets its data and where the real data is displayed
            const domEntries = this.extractEntriesFromCurrentTable(dateKey);
            if (domEntries.length > 0) {
                safeLogger.debug('DateSelectionModal', `Found ${domEntries.length} matching entries from DOM table`);
                return domEntries;
            }
            
            // APPROACH 2: Try plugin state entries (fallback)
            if (this.plugin?.state?.getDreamEntries) {
                const stateEntries = this.plugin.state.getDreamEntries();
                if (stateEntries && Array.isArray(stateEntries)) {
                    safeLogger.debug('DateSelectionModal', `Found ${stateEntries.length} entries in plugin state`);
                    
                    // ENHANCED DEBUG: Show what's actually in plugin state entries
                    if (stateEntries.length > 0) {
                        const sampleStateEntries = stateEntries.slice(0, 3).map((entry, index) => ({
                            index,
                            date: entry?.date,
                            dateType: typeof entry?.date,
                            normalized: entry?.date ? this.normalizeDateString(entry.date) : null,
                            hasMetrics: !!entry?.metrics,
                            keys: entry ? Object.keys(entry).slice(0, 8) : 'null/undefined',
                            title: entry?.title ? entry.title.substring(0, 50) : 'no title'
                        }));
                        safeLogger.debug('DateSelectionModal', 'Sample plugin state entries:', sampleStateEntries);
                        
                        // Show all unique dates in plugin state
                        const allStateDates = stateEntries.map(e => e?.date).filter(Boolean);
                        const uniqueStateDates = [...new Set(allStateDates)];
                        safeLogger.debug('DateSelectionModal', 'All unique dates in plugin state:', uniqueStateDates);
                    }
                    
                    const matchingStateEntries = stateEntries.filter((entry: any) => {
                        if (!entry || !entry.date) return false;
                        const entryDate = this.normalizeDateString(entry.date);
                        const isMatch = entryDate === dateKey;
                        
                        // DEBUG: Log detailed comparison for May 2025 entries
                        if (entry.date && (entry.date.includes('2025-05') || entry.date.includes('May') || entryDate.includes('2025-05'))) {
                            safeLogger.debug('DateSelectionModal', `Plugin state date comparison for ${dateKey}:`, {
                                originalDate: entry.date,
                                normalizedDate: entryDate,
                                targetDate: dateKey,
                                isMatch: isMatch,
                                entryTitle: entry.title ? entry.title.substring(0, 30) : 'no title'
                            });
                        }
                        
                        return isMatch;
                    });
                    
                    if (matchingStateEntries.length > 0) {
                        safeLogger.debug('DateSelectionModal', `Found ${matchingStateEntries.length} matching entries in plugin state`);
                        return matchingStateEntries;
                    } else {
                        safeLogger.debug('DateSelectionModal', `No matching entries found in plugin state for ${dateKey}`);
                    }
                }
            }
            
            // APPROACH 3: Try global entries (another fallback)
            if ((window as any).dreamEntries) {
                const globalEntries = (window as any).dreamEntries;
                if (Array.isArray(globalEntries)) {
                    safeLogger.debug('DateSelectionModal', `Found ${globalEntries.length} entries in global state`);
                    
                    // ENHANCED DEBUG: Show what's actually in global entries
                    if (globalEntries.length > 0) {
                        const sampleGlobalEntries = globalEntries.slice(0, 3).map((entry, index) => ({
                            index,
                            date: entry?.date,
                            dateType: typeof entry?.date,
                            normalized: entry?.date ? this.normalizeDateString(entry.date) : null,
                            hasMetrics: !!entry?.metrics,
                            keys: entry ? Object.keys(entry).slice(0, 8) : 'null/undefined',
                            title: entry?.title ? entry.title.substring(0, 50) : 'no title'
                        }));
                        safeLogger.debug('DateSelectionModal', 'Sample global entries:', sampleGlobalEntries);
                        
                        // Show all unique dates in global state
                        const allGlobalDates = globalEntries.map(e => e?.date).filter(Boolean);
                        const uniqueGlobalDates = [...new Set(allGlobalDates)];
                        safeLogger.debug('DateSelectionModal', 'All unique dates in global state:', uniqueGlobalDates);
                    }
                    
                    const matchingGlobalEntries = globalEntries.filter((entry: any) => {
                        if (!entry || !entry.date) return false;
                        const entryDate = this.normalizeDateString(entry.date);
                        const isMatch = entryDate === dateKey;
                        
                        // DEBUG: Log detailed comparison for May 2025 entries
                        if (entry.date && (entry.date.includes('2025-05') || entry.date.includes('May') || entryDate.includes('2025-05'))) {
                            safeLogger.debug('DateSelectionModal', `Global state date comparison for ${dateKey}:`, {
                                originalDate: entry.date,
                                normalizedDate: entryDate,
                                targetDate: dateKey,
                                isMatch: isMatch,
                                entryTitle: entry.title ? entry.title.substring(0, 30) : 'no title'
                            });
                        }
                        
                        return isMatch;
                    });
                    
                    if (matchingGlobalEntries.length > 0) {
                        safeLogger.debug('DateSelectionModal', `Found ${matchingGlobalEntries.length} matching entries in global state`);
                        return matchingGlobalEntries;
                    } else {
                        safeLogger.debug('DateSelectionModal', `No matching entries found in global state for ${dateKey}`);
                    }
                }
            }
            
            safeLogger.debug('DateSelectionModal', `No entries found for ${dateKey} in any data source`);
            return [];
            
        } catch (error) {
            safeLogger.error('DateSelectionModal', 'Error getting dream entries for date', { dateKey, error });
            return [];
        }
    }
    
    /**
     * Extract dream entries directly from the current DOM table (where real data is displayed)
     */
    private extractEntriesFromCurrentTable(dateKey: string): any[] {
        try {
            const entries: any[] = [];
            
            // Look for the main metrics table in the current document
            const metricsTable = document.querySelector('#oom-dream-entries-table') || 
                                 document.querySelector('table.oom-table:not(.oom-stats-table)') ||
                                 document.querySelector('.oom-metrics-container table');
            
            if (!metricsTable) {
                safeLogger.debug('DateSelectionModal', 'No main metrics table found in DOM');
                return entries;
            }
            
            const rows = metricsTable.querySelectorAll('tbody tr.oom-dream-row');
            safeLogger.debug('DateSelectionModal', `Found ${rows.length} dream rows in DOM table`);
            
            rows.forEach((row, index) => {
                const dateCell = row.querySelector('.column-date');
                const titleCell = row.querySelector('.oom-dream-title, .column-dream-title');
                const contentCell = row.querySelector('.oom-dream-content, .column-content');
                
                if (dateCell) {
                    const dateText = dateCell.textContent?.trim();
                    const rowDate = row.getAttribute('data-date') || 
                                   row.getAttribute('data-date-raw') || 
                                   row.getAttribute('data-iso-date');
                    
                    // Use row date attribute first, fallback to cell text
                    const entryDate = rowDate || dateText;
                    
                    if (entryDate) {
                        const normalizedDate = this.normalizeDateString(entryDate);
                        const matches = normalizedDate === dateKey;
                        
                        // DEBUG: Log comparison
                        if (entryDate.includes('2025-05') || entryDate.includes('May') || normalizedDate.includes('2025-05')) {
                            safeLogger.debug('DateSelectionModal', `DOM table date comparison for ${dateKey}:`, {
                                rowIndex: index,
                                originalDate: entryDate,
                                cellText: dateText,
                                rowDataDate: rowDate,
                                normalizedDate: normalizedDate,
                                targetDate: dateKey,
                                matches: matches
                            });
                        }
                        
                        if (matches) {
                            const entry: any = {
                                date: dateKey,
                                title: titleCell?.textContent?.trim() || 'Unknown Dream',
                                content: contentCell?.textContent?.trim() || '',
                                source: `dom-table-row-${index}`,
                                metrics: {}
                            };
                            
                            // Extract metrics from metric columns
                            const metricCells = row.querySelectorAll('.metric-value');
                            metricCells.forEach((cell) => {
                                const metricName = cell.getAttribute('data-metric');
                                const value = parseFloat(cell.textContent?.trim() || '');
                                if (metricName && !isNaN(value)) {
                                    entry.metrics[metricName] = value;
                                }
                            });
                            
                            entries.push(entry);
                            safeLogger.debug('DateSelectionModal', `Extracted entry from DOM table for ${dateKey}:`, {
                                title: entry.title.substring(0, 30),
                                metricsCount: Object.keys(entry.metrics).length
                            });
                        }
                    }
                }
            });
            
            safeLogger.debug('DateSelectionModal', `Extracted ${entries.length} entries from DOM table for ${dateKey}`);
            return entries;
        } catch (error) {
            safeLogger.debug('DateSelectionModal', 'Error extracting entries from DOM table', { dateKey, error });
            return [];
        }
    }

    /**
     * Normalize date strings to YYYY-MM-DD format - FIXED FOR ACTUAL FORMATS
     */
    private normalizeDateString(dateStr: string): string {
        try {
            // Handle YYYYMMDD format (e.g., "20250507")
            if (dateStr.match(/^\d{8}$/)) {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                const normalized = `${year}-${month}-${day}`;
                safeLogger.debug('DateSelectionModal', `YYYYMMDD format: "${dateStr}" -> "${normalized}"`);
                return normalized;
            }
            
            // Handle "Month DD" format without year (e.g., "May 7")
            if (dateStr.match(/^[A-Za-z]+ \d{1,2}$/)) {
                // Assume current year
                const currentYear = new Date().getFullYear();
                const fullDateStr = `${dateStr}, ${currentYear}`;
                const date = new Date(fullDateStr);
                if (!isNaN(date.getTime())) {
                    const normalized = format(date, 'yyyy-MM-dd');
                    safeLogger.debug('DateSelectionModal', `Month DD format: "${dateStr}" -> "${normalized}" (assumed year ${currentYear})`);
                    return normalized;
                }
            }
            
            // Handle ISO format: 2025-01-16T00:00:00.000Z
            if (dateStr.includes('T')) {
                const normalized = dateStr.split('T')[0];
                safeLogger.debug('DateSelectionModal', `ISO format: "${dateStr}" -> "${normalized}"`);
                return normalized;
            }
            
            // Handle YYYY-MM-DD format (already correct)
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return dateStr;
            }
            
            // Handle "Month DD, YYYY" format (e.g., "May 7, 2025")
            if (dateStr.match(/^[A-Za-z]+ \d{1,2}, \d{4}$/)) {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    const normalized = format(date, 'yyyy-MM-dd');
                    safeLogger.debug('DateSelectionModal', `Month DD, YYYY format: "${dateStr}" -> "${normalized}"`);
                    return normalized;
                }
            }
            
            // Handle MM/DD/YYYY format
            if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                    const normalized = format(date, 'yyyy-MM-dd');
                    return normalized;
                }
            }
            
            // Generic fallback
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                const normalized = format(date, 'yyyy-MM-dd');
                safeLogger.debug('DateSelectionModal', `Generic parse: "${dateStr}" -> "${normalized}"`);
                return normalized;
            }
            
            // If all else fails, return as-is with warning
            safeLogger.warn('DateSelectionModal', `Could not normalize date: "${dateStr}"`);
            return dateStr;
        } catch (error) {
            safeLogger.error('DateSelectionModal', 'Error normalizing date string', { dateStr, error });
            return dateStr;
        }
    }
    
    /**
     * Calculate quality level based on unified metrics system
     */
    private calculateQualityLevel(dreamEntries: any[]): 'high' | 'medium' | 'low' | 'none' {
        try {
            if (dreamEntries.length === 0) return 'none';
            
            // Check if unified metrics are available
            if (this.plugin.settings?.unifiedMetrics) {
                const calendarMetrics = getComponentMetrics(this.plugin.settings, 'calendar');
                const thresholds = this.plugin.settings.unifiedMetrics.visualizationThresholds;
                
                if (calendarMetrics.length > 0 && thresholds) {
                    // Calculate average quality based on configured metrics
                    let totalScore = 0;
                    let metricCount = 0;
                    
                    // For now, use a simplified calculation
                    // In a full implementation, you'd extract actual metric values from dream entries
                    dreamEntries.forEach(entry => {
                        calendarMetrics.forEach(metric => {
                            // Placeholder: extract metric value from entry
                            // const metricValue = extractMetricValue(entry, metric.name);
                            const metricValue = Math.random() * 10; // Placeholder
                            const normalized = metricValue / 10; // Normalize to 0-1
                            totalScore += normalized;
                            metricCount++;
                        });
                    });
                    
                    if (metricCount > 0) {
                        const avgQuality = totalScore / metricCount;
                        return getMetricThreshold(avgQuality, 0, 1, thresholds);
                    }
                }
            }
            
            // Fallback: use entry count
            if (dreamEntries.length >= 3) return 'high';
            if (dreamEntries.length === 2) return 'medium';
            if (dreamEntries.length === 1) return 'low';
            return 'none';
        } catch (error) {
            safeLogger.debug('DateSelectionModal', 'Error calculating quality level', { error });
            // Fallback to entry count
            if (dreamEntries.length >= 3) return 'high';
            if (dreamEntries.length === 2) return 'medium';
            if (dreamEntries.length === 1) return 'low';
            return 'none';
        }
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
                // FIXED: Clear existing day elements before regenerating to prevent duplicates
                calendarGrid.empty();
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
    
    // ✅ ACCESSIBILITY: Helper method to check if two dates are the same day
    private isSameDay(date1: Date, date2: Date): boolean {
        return isSameDay(date1, date2);
    }
    
    // ✅ ACCESSIBILITY: Generate current view days for today check
    private generateDaysForCurrentView(): Date[] {
        const days: Date[] = [];
        const firstDay = startOfMonth(this.currentMonth);
        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - firstDay.getDay());
        
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            days.push(currentDate);
        }
        return days;
    }
    
    /**
     * ✅ ACCESSIBILITY: Add standard ARIA grid keyboard navigation to the calendar
     * Implements the roving tabindex pattern for accessibility
     */
    private addCalendarKeyboardNavigation(gridContainer: HTMLElement): void {
        // ✅ ACCESSIBILITY: Handle focus on the grid container itself (from Tab navigation)
        gridContainer.addEventListener('focus', (event: FocusEvent) => {
            const target = event.target as HTMLElement;
            
            // If focus is on the grid container itself, move it to the appropriate day cell
            if (target === gridContainer) {
                // Find the currently focused cell or default to today/first cell
                let cellToFocus = gridContainer.querySelector('[tabindex="0"]') as HTMLElement;
                if (!cellToFocus) {
                    // Fallback: find today or first cell
                    cellToFocus = gridContainer.querySelector('.oom-today[data-date]') as HTMLElement;
                    if (!cellToFocus) {
                        cellToFocus = gridContainer.querySelector('[data-date]') as HTMLElement;
                    }
                    
                    // Set up roving tabindex on the fallback cell
                    if (cellToFocus) {
                        // Remove tabindex="0" from any other cells
                        gridContainer.querySelectorAll('[tabindex="0"]').forEach(cell => {
                            cell.setAttribute('tabindex', '-1');
                        });
                        cellToFocus.setAttribute('tabindex', '0');
                    }
                }
                
                if (cellToFocus) {
                    cellToFocus.focus();
                    this.announceCalendarNavigation(cellToFocus);
                }
            }
        });
        
        // Add event delegation to the grid container for all day cell key events
        gridContainer.addEventListener('keydown', (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            
            // Handle both day cells and the grid container itself
            const isGridContainer = target === gridContainer;
            const isDayCell = target.hasAttribute('data-date') && target.getAttribute('tabindex') === '0';
            
            if (!isGridContainer && !isDayCell) {
                return;
            }
            
            // If focus is on grid container, move to first focusable cell
            if (isGridContainer) {
                const firstFocusableCell = gridContainer.querySelector('[tabindex="0"]') as HTMLElement;
                if (firstFocusableCell) {
                    firstFocusableCell.focus();
                    return;
                }
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
                            // ✅ ACCESSIBILITY: Track focus when user selects with Enter/Space
                            this.focusedDate = date;
                            this.handleDayClick(date);
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
                    
                    // ✅ ACCESSIBILITY: Track the focused date
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
     * ✅ ACCESSIBILITY: Announce calendar navigation to screen readers
     */
    private announceCalendarNavigation(cell: HTMLElement): void {
        const dateStr = cell.getAttribute('data-date');
        if (!dateStr) return;
        
        const date = this.parseDateKey(dateStr);
        if (!date) return;
        
        const hasEntries = cell.classList.contains('oom-has-entries');
        const isTodayDate = cell.classList.contains('oom-today');
        const isCurrentMonth = !cell.classList.contains('oom-other-month');
        
        // Build announcement
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const dateFormatted = date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: isCurrentMonth ? undefined : 'numeric' // Include year for other months
        });
        
        let announcement = `${dayName}, ${dateFormatted}`;
        
        if (isTodayDate) {
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
     * ✅ ACCESSIBILITY: Helper method to announce messages to screen readers
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
}

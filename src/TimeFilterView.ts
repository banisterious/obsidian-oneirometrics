import { ItemView, WorkspaceLeaf } from 'obsidian';
import { TimeFilterManager } from './timeFilters.js';
import { CustomDateRangeModal } from './CustomDateRangeModal.js';

export const TIME_FILTER_VIEW_TYPE = 'oneirometrics-time-filter';

export class TimeFilterView extends ItemView {
    private filterManager: TimeFilterManager;
    private container: HTMLElement;
    private buttonsContainer: HTMLElement;
    private rangeDisplay: HTMLElement;
    private calendarPreview: HTMLElement;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
        this.filterManager = new TimeFilterManager();
    }

    getViewType(): string {
        return TIME_FILTER_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'Time Filter';
    }

    async onOpen(): Promise<void> {
        this.container = this.containerEl.children[1] as HTMLElement;
        this.container.empty();
        this.container.addClass('oneirometrics-time-filter-container');

        // Create buttons container
        this.buttonsContainer = this.container.createEl('div', {
            cls: 'oneirometrics-time-filter-buttons'
        });

        // Create filter buttons
        const filters = [
            { id: 'today', label: 'Today', icon: 'calendar', shortcut: 'Alt+T' },
            { id: 'yesterday', label: 'Yesterday', icon: 'calendar-clock', shortcut: 'Alt+Y' },
            { id: 'thisWeek', label: 'This Week', icon: 'calendar-days', shortcut: 'Alt+W' },
            { id: 'lastWeek', label: 'Last Week', icon: 'calendar-range', shortcut: 'Alt+L' },
            { id: 'thisMonth', label: 'This Month', icon: 'calendar-check', shortcut: 'Alt+M' },
            { id: 'lastMonth', label: 'Last Month', icon: 'calendar-x', shortcut: 'Alt+N' },
            { id: 'custom', label: 'Custom', icon: 'calendar-plus', shortcut: 'Alt+C' }
        ];

        filters.forEach(filter => {
            const button = this.buttonsContainer.createEl('button', {
                cls: 'oneirometrics-time-filter-button',
                attr: {
                    'aria-label': `${filter.label} (${filter.shortcut})`,
                    'data-filter': filter.id
                }
            });

            // Create icon
            const icon = button.createEl('span', {
                cls: 'oneirometrics-time-filter-icon',
                attr: { 'aria-hidden': 'true' }
            });
            icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${this.getIconPath(filter.icon)}"/></svg>`;

            // Create label
            const label = button.createEl('span', {
                cls: 'oneirometrics-time-filter-label',
                text: filter.label
            });

            // Add keyboard shortcut text for screen readers
            const shortcut = button.createEl('span', {
                cls: 'oneirometrics-sr-only',
                text: `(${filter.shortcut})`
            });

            // Add click handler
            button.addEventListener('click', () => {
                if (filter.id === 'custom') {
                    this.openCustomDateRange();
                } else {
                    this.filterManager.setFilter(filter.id);
                    this.updateRangeDisplay();
                    this.updateCalendarPreview();
                    this.announceToScreenReader(`${filter.label} selected`);
                }
            });

            // Add keyboard support
            button.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });

        // Create range display
        this.rangeDisplay = this.container.createEl('div', {
            cls: 'oneirometrics-time-filter-range',
            attr: {
                'role': 'status',
                'aria-live': 'polite'
            }
        });

        // Create calendar preview
        this.calendarPreview = this.container.createEl('div', {
            cls: 'oneirometrics-time-filter-calendar',
            attr: {
                'role': 'application',
                'aria-label': 'Calendar preview'
            }
        });

        // Initialize display
        this.updateRangeDisplay();
        this.updateCalendarPreview();

        // Add resize observer for responsive layout
        const resizeObserver = new ResizeObserver(() => {
            this.updateButtonLayout();
        });
        resizeObserver.observe(this.container);
    }

    openCustomDateRange(): void {
        new CustomDateRangeModal(this.app, (start: Date, end: Date) => {
            this.filterManager.setCustomRange(start, end);
            this.updateRangeDisplay();
            this.updateCalendarPreview();
            this.announceToScreenReader(`Custom range selected: ${this.formatDate(start)} to ${this.formatDate(end)}`);
        }).open();
    }

    private updateButtonLayout(): void {
        const width = this.container.offsetWidth;
        if (width < 600) {
            this.buttonsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else if (width < 900) {
            this.buttonsContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        } else {
            this.buttonsContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
        }
    }

    private updateRangeDisplay(): void {
        const range = this.filterManager.getCurrentRange();
        if (!range) return;

        const startDate = this.formatDate(range.start);
        const endDate = this.formatDate(range.end);
        const duration = this.getDuration(range.start, range.end);
        const relativeTime = this.getRelativeTime(range.start, range.end);

        this.rangeDisplay.innerHTML = `
            <div class="oneirometrics-date-range-main">${startDate} - ${endDate}</div>
            <div class="oneirometrics-date-range-details">
                <span class="oneirometrics-date-duration">⏱️ ${duration}</span>
                <span class="oneirometrics-date-relative">🕒 ${relativeTime}</span>
            </div>
        `;
    }

    private updateCalendarPreview(): void {
        const range = this.filterManager.getCurrentRange();
        if (!range) return;

        const today = new Date();
        const month = range.start.getMonth();
        const year = range.start.getFullYear();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        let html = `
            <div class="oneirometrics-calendar-header">
                <h3>${this.getMonthName(month)} ${year}</h3>
            </div>
            <div class="oneirometrics-calendar-grid">
                <div class="oneirometrics-calendar-weekdays">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                        .map(day => `<div class="oneirometrics-calendar-weekday">${day}</div>`)
                        .join('')}
                </div>
                <div class="oneirometrics-calendar-days">
        `;

        // Add empty cells for days before the first of the month
        for (let i = 0; i < startingDay; i++) {
            html += '<div class="oneirometrics-calendar-day empty"></div>';
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = this.isSameDay(date, today);
            const isSelected = this.isDateInRange(date, range);
            const isStart = this.isSameDay(date, range.start);
            const isEnd = this.isSameDay(date, range.end);

            html += `
                <div class="oneirometrics-calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''}"
                     data-date="${date.toISOString()}"
                     role="button"
                     tabindex="0"
                     aria-label="${this.getDateLabel(date, isToday, isSelected)}">
                    ${day}
                </div>
            `;
        }

        html += '</div></div>';
        this.calendarPreview.innerHTML = html;

        // Add click handlers for days
        this.calendarPreview.querySelectorAll('.oneirometrics-calendar-day:not(.empty)').forEach(day => {
            day.addEventListener('click', (e) => {
                const date = new Date((e.currentTarget as HTMLElement).dataset.date!);
                this.filterManager.setCustomRange(date, date);
                this.updateRangeDisplay();
                this.updateCalendarPreview();
                this.announceToScreenReader(`Selected ${this.formatDate(date)}`);
            });

            // Add keyboard support
            day.addEventListener('keydown', (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).click();
                }
            });
        });
    }

    private formatDate(date: Date): string {
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    private getDuration(start: Date, end: Date): string {
        const diff = end.getTime() - start.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return '1 day';
        return `${days + 1} days`;
    }

    private getRelativeTime(start: Date, end: Date): string {
        const now = new Date();
        if (end < now) return 'Past period';
        if (start > now) return 'Future period';
        return 'Current period';
    }

    private getMonthName(month: number): string {
        return new Date(2000, month, 1).toLocaleString(undefined, { month: 'long' });
    }

    private isSameDay(date1: Date, date2: Date): boolean {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    private isDateInRange(date: Date, range: { start: Date; end: Date }): boolean {
        return date >= range.start && date <= range.end;
    }

    private getDateLabel(date: Date, isToday: boolean, isSelected: boolean): string {
        let label = this.formatDate(date);
        if (isToday) label += ' (Today)';
        if (isSelected) label += ' (Selected)';
        return label;
    }

    private getIconPath(icon: string): string {
        // Add SVG path data for each icon
        const paths: Record<string, string> = {
            'calendar': 'M8 2v4M16 2v4M3.5 9.09h17M21 10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4',
            'calendar-clock': 'M8 2v4M16 2v4M3.5 9.09h17M21 10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M12 12v4l3 3',
            'calendar-days': 'M8 2v4M16 2v4M3.5 9.09h17M21 10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01',
            'calendar-range': 'M8 2v4M16 2v4M3.5 9.09h17M21 10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M8 14h8M8 18h8',
            'calendar-check': 'M8 2v4M16 2v4M3.5 9.09h17M21 10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M8 14l2 2 4-4',
            'calendar-x': 'M8 2v4M16 2v4M3.5 9.09h17M21 10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M8 14l4 4M12 14l-4 4',
            'calendar-plus': 'M8 2v4M16 2v4M3.5 9.09h17M21 10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M12 14v4M10 16h4'
        };
        return paths[icon] || '';
    }

    private announceToScreenReader(message: string): void {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'oneirometrics-sr-only';
        announcement.textContent = message;
        this.container.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }

    getFilterManager(): TimeFilterManager {
        return this.filterManager;
    }
} 
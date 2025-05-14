import { Modal, App } from 'obsidian';
import { TimeFilterState, TimeRange } from './TimeFilterState';

export class TimeFilterDialog extends Modal {
    private timeFilterState: TimeFilterState;
    private timeRange: TimeRange | null = null;

    constructor(app: App, timeFilterState: TimeFilterState) {
        super(app);
        this.timeFilterState = timeFilterState;
        this.timeRange = timeFilterState.getTimeRange();
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-time-filter-dialog');

        // Create dialog content
        const container = contentEl.createDiv('oom-time-filter-container');
        
        // Add title
        container.createEl('h2', { text: 'Time Filter' });
        
        // Add time range inputs
        const timeInputContainer = container.createDiv('oom-time-input-container');
        
        // Start time
        const startTimeContainer = timeInputContainer.createDiv('oom-time-input-group');
        startTimeContainer.createEl('h3', { text: 'Start Time' });
        
        const startHourSelect = startTimeContainer.createEl('select', {
            cls: 'oom-time-select'
        });
        for (let hour = 0; hour < 24; hour++) {
            startHourSelect.createEl('option', {
                text: hour.toString().padStart(2, '0'),
                value: hour.toString()
            });
        }
        
        const startMinuteSelect = startTimeContainer.createEl('select', {
            cls: 'oom-time-select'
        });
        for (let minute = 0; minute < 60; minute += 15) {
            startMinuteSelect.createEl('option', {
                text: minute.toString().padStart(2, '0'),
                value: minute.toString()
            });
        }
        
        // End time
        const endTimeContainer = timeInputContainer.createDiv('oom-time-input-group');
        endTimeContainer.createEl('h3', { text: 'End Time' });
        
        const endHourSelect = endTimeContainer.createEl('select', {
            cls: 'oom-time-select'
        });
        for (let hour = 0; hour < 24; hour++) {
            endHourSelect.createEl('option', {
                text: hour.toString().padStart(2, '0'),
                value: hour.toString()
            });
        }
        
        const endMinuteSelect = endTimeContainer.createEl('select', {
            cls: 'oom-time-select'
        });
        for (let minute = 0; minute < 60; minute += 15) {
            endMinuteSelect.createEl('option', {
                text: minute.toString().padStart(2, '0'),
                value: minute.toString()
            });
        }
        
        // Set initial values if time range exists
        if (this.timeRange) {
            startHourSelect.value = this.timeRange.startHour.toString();
            startMinuteSelect.value = this.timeRange.startMinute.toString();
            endHourSelect.value = this.timeRange.endHour.toString();
            endMinuteSelect.value = this.timeRange.endMinute.toString();
        }
        
        // Add quick filters
        const quickFilters = container.createDiv('oom-quick-filters');
        const quickFilterTimes = [
            { label: 'Morning', start: { hour: 6, minute: 0 }, end: { hour: 12, minute: 0 } },
            { label: 'Afternoon', start: { hour: 12, minute: 0 }, end: { hour: 18, minute: 0 } },
            { label: 'Evening', start: { hour: 18, minute: 0 }, end: { hour: 0, minute: 0 } },
            { label: 'Night', start: { hour: 0, minute: 0 }, end: { hour: 6, minute: 0 } }
        ];
        
        quickFilterTimes.forEach(({ label, start, end }) => {
            const button = quickFilters.createEl('button', {
                text: label,
                cls: 'oom-button oom-button--secondary'
            });
            
            button.addEventListener('click', () => {
                startHourSelect.value = start.hour.toString();
                startMinuteSelect.value = start.minute.toString();
                endHourSelect.value = end.hour.toString();
                endMinuteSelect.value = end.minute.toString();
            });
        });
        
        // Add action buttons
        const buttonContainer = container.createDiv('oom-dialog-buttons');
        
        const applyButton = buttonContainer.createEl('button', {
            text: 'Apply',
            cls: 'oom-button oom-button--primary'
        });
        
        const clearButton = buttonContainer.createEl('button', {
            text: 'Clear',
            cls: 'oom-button oom-button--secondary'
        });
        
        const cancelButton = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'oom-button oom-button--secondary'
        });
        
        // Add event listeners
        applyButton.addEventListener('click', () => {
            const timeRange: TimeRange = {
                startHour: parseInt(startHourSelect.value),
                startMinute: parseInt(startMinuteSelect.value),
                endHour: parseInt(endHourSelect.value),
                endMinute: parseInt(endMinuteSelect.value)
            };
            
            this.timeFilterState.setTimeRange(timeRange);
            this.close();
        });
        
        clearButton.addEventListener('click', () => {
            this.timeFilterState.clearFilter();
            this.close();
        });
        
        cancelButton.addEventListener('click', () => {
            this.close();
        });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
} 
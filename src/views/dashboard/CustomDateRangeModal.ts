import { App, Modal, ButtonComponent, Setting, Notice } from 'obsidian';

/**
 * Modal for selecting a custom date range for filtering
 * This is a simplified version for the dashboard
 */
export class CustomDateRangeModal extends Modal {
    private startDateInput: HTMLInputElement;
    private endDateInput: HTMLInputElement;
    private onSubmit: (start: string, end: string) => void;
    private initialRange?: { start: string; end: string };

    constructor(
        app: App,
        initialRange: { start: string; end: string } | undefined,
        onSubmit: (start: string, end: string) => void
    ) {
        super(app);
        this.initialRange = initialRange;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        // Add modal class for styling
        this.modalEl.addClass('oom-custom-date-modal');
        
        // Title
        contentEl.createEl('h2', { text: 'Select Custom Date Range' });
        
        // Description
        contentEl.createEl('p', { 
            text: 'Choose a start and end date to filter your dream entries.',
            cls: 'oom-modal-description'
        });
        
        // Start date setting
        new Setting(contentEl)
            .setName('Start Date')
            .setDesc('Beginning of the date range (YYYY-MM-DD)')
            .addText(text => {
                this.startDateInput = text.inputEl;
                text.inputEl.type = 'date';
                text.setValue(this.initialRange?.start || this.getDefaultStartDate());
                text.inputEl.addClass('oom-date-input');
            });
        
        // End date setting
        new Setting(contentEl)
            .setName('End Date')
            .setDesc('End of the date range (YYYY-MM-DD)')
            .addText(text => {
                this.endDateInput = text.inputEl;
                text.inputEl.type = 'date';
                text.setValue(this.initialRange?.end || this.getTodayDate());
                text.inputEl.addClass('oom-date-input');
            });
        
        // Quick range buttons
        const quickRangesContainer = contentEl.createDiv({ cls: 'oom-quick-ranges' });
        quickRangesContainer.createEl('h3', { text: 'Quick Ranges:' });
        
        const buttonContainer = quickRangesContainer.createDiv({ cls: 'oom-quick-range-buttons' });
        
        // Last 7 days
        new ButtonComponent(buttonContainer)
            .setButtonText('Last 7 Days')
            .onClick(() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 6);
                this.setDateInputs(start, end);
            });
        
        // Last 30 days
        new ButtonComponent(buttonContainer)
            .setButtonText('Last 30 Days')
            .onClick(() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 29);
                this.setDateInputs(start, end);
            });
        
        // This Month
        new ButtonComponent(buttonContainer)
            .setButtonText('This Month')
            .onClick(() => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                this.setDateInputs(start, end);
            });
        
        // Last Month
        new ButtonComponent(buttonContainer)
            .setButtonText('Last Month')
            .onClick(() => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const end = new Date(now.getFullYear(), now.getMonth(), 0);
                this.setDateInputs(start, end);
            });
        
        // This Year
        new ButtonComponent(buttonContainer)
            .setButtonText('This Year')
            .onClick(() => {
                const now = new Date();
                const start = new Date(now.getFullYear(), 0, 1);
                const end = new Date(now.getFullYear(), 11, 31);
                this.setDateInputs(start, end);
            });
        
        // Action buttons
        const actionContainer = contentEl.createDiv({ cls: 'oom-modal-actions' });
        
        // Cancel button
        new ButtonComponent(actionContainer)
            .setButtonText('Cancel')
            .onClick(() => {
                this.close();
            });
        
        // Apply button
        new ButtonComponent(actionContainer)
            .setButtonText('Apply')
            .setCta()
            .onClick(() => {
                this.submitDateRange();
            });
        
        // Handle Enter key to submit
        contentEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.submitDateRange();
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }

    private setDateInputs(start: Date, end: Date) {
        this.startDateInput.value = this.formatDate(start);
        this.endDateInput.value = this.formatDate(end);
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private getTodayDate(): string {
        return this.formatDate(new Date());
    }

    private getDefaultStartDate(): string {
        const date = new Date();
        date.setDate(date.getDate() - 30); // Default to last 30 days
        return this.formatDate(date);
    }

    private submitDateRange() {
        const start = this.startDateInput.value;
        const end = this.endDateInput.value;
        
        // Validate dates
        if (!start || !end) {
            new Notice('Please select both start and end dates');
            return;
        }
        
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        if (startDate > endDate) {
            new Notice('Start date must be before end date');
            return;
        }
        
        // Submit the range
        this.onSubmit(start, end);
        this.close();
    }
}
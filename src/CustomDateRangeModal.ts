import { Modal, Setting } from 'obsidian';

export class CustomDateRangeModal extends Modal {
    private startDate: Date;
    private endDate: Date;
    private onSelect: (start: Date, end: Date) => void;

    constructor(app: any, onSelect: (start: Date, end: Date) => void) {
        super(app);
        this.onSelect = onSelect;
        this.startDate = new Date();
        this.endDate = new Date();
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oneirometrics-custom-date-modal');

        // Add title
        contentEl.createEl('h2', { text: 'Select Date Range' });

        // Add date range inputs
        new Setting(contentEl)
            .setName('Start Date')
            .addText(text => text
                .setValue(this.startDate.toISOString().split('T')[0])
                .onChange(value => {
                    this.startDate = new Date(value);
                }));

        new Setting(contentEl)
            .setName('End Date')
            .addText(text => text
                .setValue(this.endDate.toISOString().split('T')[0])
                .onChange(value => {
                    this.endDate = new Date(value);
                }));

        // Add buttons
        const buttonContainer = contentEl.createDiv('oneirometrics-modal-buttons');
        
        const cancelButton = buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'mod-warning'
        });
        cancelButton.addEventListener('click', () => this.close());

        const applyButton = buttonContainer.createEl('button', {
            text: 'Apply',
            cls: 'mod-cta'
        });
        applyButton.addEventListener('click', () => {
            this.onSelect(this.startDate, this.endDate);
            this.close();
        });

        // Add keyboard support
        contentEl.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyButton.click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
            }
        });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
} 
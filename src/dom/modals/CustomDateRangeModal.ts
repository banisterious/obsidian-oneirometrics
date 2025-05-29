/**
 * CustomDateRangeModal
 * 
 * A modal for selecting custom date ranges.
 * Extracted from main.ts during the refactoring process.
 */

import { App, ButtonComponent, Modal, Notice, Setting, TextComponent } from 'obsidian';

import { 
    format, 
    parse, 
    isValid, 
    isAfter, 
    isBefore, 
    isSameDay, 
    addDays, 
    subDays 
} from 'date-fns';

import { 
    validateDate, 
    parseDate, 
    formatDate 
} from '../../utils/date-utils';

export class CustomDateRangeModal extends Modal {
    private startDateInput: TextComponent;
    private endDateInput: TextComponent;
    private favoriteNameInput: TextComponent;
    private saveButton: ButtonComponent;
    
    constructor(
        app: App,
        private callback: (start: string, end: string, saveName?: string) => void,
        private favorites: Record<string, { start: string, end: string }> = {},
        private deleteFavorite: (name: string) => void = () => {}
    ) {
        super(app);
    }
    
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Custom Date Range' });
        
        new Setting(contentEl)
            .setName('Start Date')
            .setDesc('YYYY-MM-DD format')
            .addText(text => {
                this.startDateInput = text;
                text.setValue('').setPlaceholder('YYYY-MM-DD');
            });
        
        new Setting(contentEl)
            .setName('End Date')
            .setDesc('YYYY-MM-DD format')
            .addText(text => {
                this.endDateInput = text;
                text.setValue('').setPlaceholder('YYYY-MM-DD');
            });
        
        const buttonContainer = contentEl.createDiv('button-container');
        
        const applyButton = new ButtonComponent(buttonContainer)
            .setButtonText('Apply')
            .setCta()
            .onClick(() => {
                const start = this.startDateInput.getValue();
                const end = this.endDateInput.getValue();
                if (!this.validateDates(start, end)) {
                    new Notice('Invalid date format. Use YYYY-MM-DD');
                    return;
                }
                this.callback(start, end);
                this.close();
            });
        
        const clearButton = new ButtonComponent(buttonContainer)
            .setButtonText('Clear Filter')
            .onClick(() => {
                this.callback('', '');
                this.close();
            });
        
        // Save favorite section
        contentEl.createEl('h3', { text: 'Save as Favorite' });
        
        new Setting(contentEl)
            .setName('Favorite Name')
            .addText(text => {
                this.favoriteNameInput = text;
                text.setPlaceholder('Name this range');
            })
            .addButton(btn => {
                this.saveButton = btn;
                btn.setButtonText('Save')
                    .setCta()
                    .onClick(() => {
                        const name = this.favoriteNameInput.getValue();
                        if (!name) {
                            new Notice('Please enter a name for this favorite');
                            return;
                        }
                        
                        const start = this.startDateInput.getValue();
                        const end = this.endDateInput.getValue();
                        if (!this.validateDates(start, end)) {
                            new Notice('Invalid date format. Use YYYY-MM-DD');
                            return;
                        }
                        
                        this.callback(start, end, name);
                        this.close();
                    });
            });
        
        // Favorites section
        if (Object.keys(this.favorites).length > 0) {
            contentEl.createEl('h3', { text: 'Saved Favorites' });
            
            Object.entries(this.favorites).forEach(([name, range]) => {
                const setting = new Setting(contentEl)
                    .setName(name)
                    .setDesc(`${range.start} to ${range.end}`);
                
                setting.addButton(btn => {
                    btn.setButtonText('Apply')
                        .setCta()
                        .onClick(() => {
                            this.callback(range.start, range.end);
                            this.close();
                        });
                });
                
                setting.addButton(btn => {
                    btn.setButtonText('Delete')
                        .setWarning()
                        .onClick(() => {
                            this.deleteFavorite(name);
                            setting.settingEl.remove();
                            
                            // Check if there are no more favorites
                            const hasFavorites = contentEl.querySelector('.setting');
                            if (!hasFavorites) {
                                // Remove the favorites header
                                const header = contentEl.querySelector('h3:nth-of-type(2)');
                                if (header) header.remove();
                            }
                        });
                });
            });
        }
    }
    
    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
    
    private validateDates(start: string, end: string): boolean {
        // Basic validation for YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(start) || !dateRegex.test(end)) {
            return false;
        }
        
        // Check if the dates are valid
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return false;
        }
        
        // End date should be after or equal to start date
        if (endDate < startDate) {
            new Notice('End date must be after or equal to start date');
            return false;
        }
        
        return true;
    }
} 
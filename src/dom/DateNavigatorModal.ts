import { App, Modal, Notice } from 'obsidian';
import { DateNavigator } from './DateNavigator';
import { DreamMetricsState } from '../state/DreamMetricsState';
import { DateNavigatorIntegration } from './DateNavigatorIntegration';
import { TimeFilterManager } from '../timeFilters';
import { startOfDay, endOfDay } from 'date-fns';

export class DateNavigatorModal extends Modal {
    private dateNavigator: DateNavigator | null = null;
    private integration: DateNavigatorIntegration | null = null;
    private state: DreamMetricsState;
    private timeFilterManager: TimeFilterManager;
    
    // Static reference to the active modal instance
    public static activeModal: DateNavigatorModal | null = null;

    constructor(
        app: App, 
        state: DreamMetricsState,
        timeFilterManager: TimeFilterManager
    ) {
        super(app);
        this.state = state;
        this.timeFilterManager = timeFilterManager;
    }

    onOpen(): void {
        // Set as active modal
        DateNavigatorModal.activeModal = this;
        
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('oom-date-navigator-modal');

        // Add title
        contentEl.createEl('h2', { 
            text: 'Dream Date Navigator', 
            cls: 'oom-modal-title' 
        });

        // Create container for date navigator
        const container = contentEl.createDiv('oom-date-navigator-container');

        // Initialize the integration and date navigator
        this.integration = new DateNavigatorIntegration(
            this.app, 
            this.state, 
            this.timeFilterManager
        );
        
        this.dateNavigator = this.integration.initialize(container);

        // Add button container
        const buttonContainer = contentEl.createDiv('oom-modal-button-container');
        
        // Today button
        const todayButton = buttonContainer.createEl('button', {
            text: 'Today',
            cls: 'oom-modal-button oom-today-button',
            attr: {
                'aria-label': 'Navigate to today'
            }
        });
        
        todayButton.addEventListener('click', () => {
            if (!this.dateNavigator) {
                new Notice('Date navigator not initialized properly. Please try reopening the modal.');
                return;
            }
            
            // First navigate to today's month
            const today = new Date();
            this.dateNavigator.navigateToMonth(today);
            
            // Then select today
            this.dateNavigator.selectDay(today);
            
            new Notice('Navigated to today');
        });
        
        // Apply Filter button
        const applyButton = buttonContainer.createEl('button', {
            text: 'Apply Filter',
            cls: 'oom-modal-button oom-apply-button',
            attr: {
                'aria-label': 'Apply the current date selection as a filter'
            }
        });
        
        applyButton.addEventListener('click', () => {
            if (!this.dateNavigator) {
                new Notice('Date navigator not initialized properly. Please try reopening the modal.');
                return;
            }
            
            // Get the selected date, or the current day if none is selected
            let selectedDate = this.dateNavigator.getSelectedDay();
            
            // Use direct access to ensure we get the most up-to-date selection
            const dateNavigator = this.dateNavigator as any;
            if (dateNavigator.selectedDay) {
                selectedDate = dateNavigator.selectedDay;
            }
            
            if (selectedDate) {
                // Call the direct filtering function in main.ts
                // This bypasses the TimeFilterManager for more reliable filtering
                (window as any).forceApplyDateFilter(selectedDate);
                
                // Show success notice and close modal
                new Notice(`Filter applied for ${selectedDate.toLocaleDateString()}`);
                
                // Close the modal to allow user to see the filtered results
                this.close();
            } else {
                new Notice('No date selected. Please select a date first.');
            }
        });
        
        // Clear button
        const clearButton = buttonContainer.createEl('button', {
            text: 'Clear Selection',
            cls: 'oom-modal-button oom-clear-button',
            attr: {
                'aria-label': 'Clear date selection'
            }
        });
        
        clearButton.addEventListener('click', () => {
            if (!this.dateNavigator) {
                new Notice('Date navigator not initialized properly. Please try reopening the modal.');
                return;
            }
            
            this.dateNavigator.clearSelection();
            new Notice('Selection cleared');
        });
        
        // Close button
        const closeButton = buttonContainer.createEl('button', {
            text: 'Close',
            cls: 'oom-modal-button oom-close-button',
            attr: {
                'aria-label': 'Close date navigator'
            }
        });
        
        closeButton.addEventListener('click', () => {
            this.close();
        });
        
        // Add keyboard shortcuts
        this.scope.register([], 'escape', (evt) => {
            this.close();
            return false;
        });
        
        // Arrow keys for navigation (will implement in future)
        this.scope.register([], 'ArrowLeft', (evt) => {
            // Navigate left
            return false;
        });
        
        this.scope.register([], 'ArrowRight', (evt) => {
            // Navigate right
            return false;
        });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
        
        // Clean up integration
        if (this.integration) {
            this.integration.destroy();
            this.integration = null;
        }
        
        this.dateNavigator = null;
        
        // Clear active modal reference
        DateNavigatorModal.activeModal = null;
    }
    
    /**
     * Get the current date navigator instance
     */
    public getDateNavigator(): DateNavigator | null {
        return this.dateNavigator;
    }
    
    /**
     * Navigate to a specific month
     */
    public navigateToMonth(date: Date): void {
        if (!this.dateNavigator) {
            new Notice('Date navigator not initialized properly. Please try reopening the modal.');
            return;
        }
        
        this.dateNavigator.navigateToMonth(date);
    }
    
    /**
     * Select a specific day
     */
    public selectDay(date: Date): void {
        if (!this.dateNavigator) {
            new Notice('Date navigator not initialized properly. Please try reopening the modal.');
            return;
        }
        
        this.dateNavigator.selectDay(date);
    }
} 
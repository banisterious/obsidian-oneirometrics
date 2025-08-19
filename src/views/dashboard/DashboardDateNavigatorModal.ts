import { App, Notice, Modal } from 'obsidian';
import type DreamMetricsPlugin from '../../../main';

/**
 * Dashboard-specific date navigator modal
 * Uses composition pattern to wrap the enhanced functionality while providing
 * a clean callback interface for the dashboard
 */
export class DashboardDateNavigatorModal extends Modal {
    private plugin: DreamMetricsPlugin;
    private onDateRangeSelected: (start: string, end: string) => void;
    private initialRange?: { start: string; end: string };

    constructor(
        app: App, 
        plugin: DreamMetricsPlugin,
        onDateRangeSelected: (start: string, end: string) => void,
        initialRange?: { start: string; end: string }
    ) {
        super(app);
        this.plugin = plugin;
        this.onDateRangeSelected = onDateRangeSelected;
        this.initialRange = initialRange;
        
        // Set modal properties
        this.modalEl.addClass('oom-dashboard-date-navigator-modal');
        this.modalEl.setAttribute('role', 'dialog');
        this.modalEl.setAttribute('aria-label', 'Dashboard Date Navigator');
    }

    async onOpen() {
        // Import and use the enhanced date navigator modal
        try {
            const { DashboardEnhancedDateNavigatorModal } = await import('./DashboardEnhancedDateNavigatorModal');
            
            // Close this modal and open the enhanced one
            this.close();
            
            const enhancedModal = new DashboardEnhancedDateNavigatorModal(
                this.app,
                this.plugin,
                this.initialRange,
                this.onDateRangeSelected
            );
            
            enhancedModal.open();
        } catch (error) {
            this.plugin.logger?.error('Dashboard', 'Failed to open enhanced date navigator', error);
            this.fallbackToSimpleInterface();
        }
    }

    private fallbackToSimpleInterface(): void {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Select Date Range' });
        
        const container = contentEl.createDiv({ cls: 'dashboard-date-picker-container' });
        
        // Start date input
        const startContainer = container.createDiv({ cls: 'date-input-container' });
        startContainer.createEl('label', { text: 'Start Date:' });
        const startInput = startContainer.createEl('input', { 
            type: 'date',
            value: this.initialRange?.start || ''
        });

        // End date input
        const endContainer = container.createDiv({ cls: 'date-input-container' });
        endContainer.createEl('label', { text: 'End Date:' });
        const endInput = endContainer.createEl('input', { 
            type: 'date',
            value: this.initialRange?.end || ''
        });

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
        
        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelBtn.onclick = () => this.close();

        const applyBtn = buttonContainer.createEl('button', { 
            text: 'Apply',
            cls: 'mod-cta'
        });
        
        applyBtn.onclick = () => {
            const start = startInput.value;
            const end = endInput.value;
            
            if (!start || !end) {
                new Notice('Please select both start and end dates');
                return;
            }
            
            if (start > end) {
                new Notice('Start date must be before end date');
                return;
            }
            
            this.onDateRangeSelected(start, end);
            this.close();
        };
    }
}